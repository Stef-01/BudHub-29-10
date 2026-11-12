// NutriServe remaster simulation: create, advance, command.
//
// - No wall-clock reads: time only moves through advanceGame(state, dtMs).
// - All quantities are integers and time advances in whole milliseconds, so advancing by
//   1000 ms once or by 1 ms a thousand times gives the identical state (tested).
// - Preparation keeps cooking whatever station is selected. Held controls (pouring, drizzling,
//   boosting) are released when the player changes station or pauses, as a real hand would be.
// - Pause freezes every clock. Callers cap large frame deltas and pause when the page is hidden
//   (see ui/useNutriServeGame.ts); advanceGame itself processes exactly the time it is given.
// - Ids from commands and saves are looked up as own properties only (see lookup.ts).
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { getCatalogCustomer, getFood } from './catalog.ts';
import { generateOrder, ORDERS_VERSION } from './orders.ts';
import {
  AGGREGATION_V2,
  BUILD_V1,
  DAY_V2,
  arrivalGapRange,
  ECONOMY_V1,
  FINISH_V1,
  PREP_V1,
  WAITING_V1,
} from './params.ts';
import { PROGRESSION_VERSION, rankForPoints, upgradeEffects, UPGRADES } from './progression.ts';
import { createRng } from './rng.ts';
import { lookup } from './lookup.ts';
import {
  aggregateV2,
  contentShare,
  dishMatchesOrder,
  gradeFinishV1,
  gradeBuild,
  gradePrep,
  gradeWaitingV1,
  orderComplete,
  prepBandUnits,
  prepTargetUnits,
  rewardsV2,
  serveNotes,
} from './scoring.ts';
import {
  SCHEMA_VERSION,
  type Command,
  type CommandResult,
  type Customer,
  type Deposit,
  type Dish,
  type GameState,
  type Profile,
  type Ticket,
} from './types.ts';

export const PREP_SLOT_COUNT = 4;

/** Accepted pilot cast: the customers with approved remaster art (src/features/nutriserve/assets). */
export const PILOT_CUSTOMER_POOL = [
  'arjun_fit',
  'priya_balanced',
  'rohan_light',
  'maya_protein',
  'vikram_lowsodium',
  'ananya_breakfast',
];

export const PARAM_VERSIONS = {
  build: BUILD_V1.version,
  prep: PREP_V1.version,
  finish: FINISH_V1.version,
  waiting: WAITING_V1.version,
  aggregation: AGGREGATION_V2.version,
  economy: ECONOMY_V1.version,
  day: DAY_V2.version,
  orders: ORDERS_VERSION,
  progression: PROGRESSION_VERSION,
};

export function newProfile(): Profile {
  return { rank: 1, points: 0, coins: 0, upgrades: [], creditedDays: [], reportedDays: [], bestDayScore: 0 };
}

export interface CreateGameOptions {
  seed: number;
  customerPool?: string[];
  profile?: Profile;
  /** Defaults to the day after the profile's last credited day. */
  day?: number;
  runId?: string;
}

const STATIONS = ['order', 'build', 'prep', 'finish'];
const SIZES = ['small', 'medium', 'large'];
const COMPONENTS = ['base', 'main', 'side'];

export function createGame({ seed, customerPool = PILOT_CUSTOMER_POOL, profile = newProfile(), day, runId }: CreateGameOptions): GameState {
  const pool = customerPool.filter((id) => getCatalogCustomer(id));
  if (pool.length === 0) throw new RangeError('Customer pool has no catalog customers');
  const startDay = day ?? (profile.creditedDays.length ? Math.max(...profile.creditedDays) + 1 : 1);
  if (!Number.isInteger(startDay) || startDay < 1) throw new RangeError('day must be a positive integer');
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    runId: runId ?? `run-${(seed >>> 0).toString(36)}`,
    paramVersions: { ...PARAM_VERSIONS },
    seed: seed >>> 0,
    rngState: seed >>> 0,
    nowMs: 0,
    paused: false,
    nextId: 1,
    nextTicketNumber: 1,
    selected: { station: 'order' },
    day: { number: startDay, customers: [], completed: false, results: [] },
    tickets: [],
    dishes: [],
    prepSlots: Array.from({ length: PREP_SLOT_COUNT }, (_, index) => ({ index, boostHeld: false, heat: 0, overheated: false })),
    profile: structuredClone(profile),
    customerPool: pool,
  };
  scheduleDay(state);
  return state;
}

function newId(s: GameState, prefix: string): string {
  return `${prefix}${s.nextId++}`;
}

function scheduleDay(s: GameState): void {
  const rng = createRng(s.rngState);
  const count = Math.min(DAY_V2.maxCustomers, DAY_V2.baseCustomers + Math.floor((s.day.number - 1) / DAY_V2.perExtraDays));
  const [gapMin, gapMax] = arrivalGapRange(s.day.number);
  // Shuffle the pool, then cycle through it, so a day repeats a customer only when it must.
  const shuffled = [...s.customerPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  let arrival = DAY_V2.firstArrivalMs;
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    customers.push({ id: newId(s, 'c'), catalogId: shuffled[i % shuffled.length], arrivalMs: arrival, phase: 'scheduled' });
    arrival += rng.int(gapMin, gapMax);
  }
  s.day.customers = customers;
  s.rngState = rng.state;
}

// --- Time ----------------------------------------------------------------------

function hasContinuousWork(s: GameState): boolean {
  return !!s.held || s.prepSlots.some((slot) => slot.dishId !== undefined || slot.heat > 0);
}

function nextDiscreteEventMs(s: GameState): number | undefined {
  let next: number | undefined;
  const consider = (t: number) => {
    if (t > s.nowMs && (next === undefined || t < next)) next = t;
  };
  for (const c of s.day.customers) {
    if (c.phase === 'scheduled') consider(c.arrivalMs);
    else if (c.phase === 'walking_in') consider(c.arrivalMs + WAITING_V1.walkMs);
    else if (c.phase === 'walking_out' && c.leftAtMs !== undefined) consider(c.leftAtMs + WAITING_V1.walkMs);
  }
  return next;
}

function processDiscrete(s: GameState): void {
  for (const c of s.day.customers) {
    if (c.phase === 'scheduled' && s.nowMs >= c.arrivalMs) c.phase = 'walking_in';
    if (c.phase === 'walking_in' && s.nowMs >= c.arrivalMs + WAITING_V1.walkMs) {
      c.atCounterMs = c.arrivalMs + WAITING_V1.walkMs;
      // A customer whose catalog entry no longer exists (e.g. renamed since a save) leaves
      // instead of blocking the queue for everyone behind them.
      c.phase = getCatalogCustomer(c.catalogId) ? 'at_counter' : 'gone';
    }
    // Restored from a save made before the catalog entry was renamed: nobody can take this order.
    if (c.phase === 'at_counter' && !getCatalogCustomer(c.catalogId)) c.phase = 'gone';
    if (c.phase === 'walking_out' && c.leftAtMs !== undefined && s.nowMs >= c.leftAtMs + WAITING_V1.walkMs) c.phase = 'gone';
  }
  if (!s.day.completed && s.day.customers.length > 0 && s.day.customers.every((c) => c.phase === 'gone')) {
    completeDay(s);
  }
}

function depositAt(deposit: Deposit, x: number, y: number, mg: number): void {
  if (x * x + y * y > 1) {
    deposit.spilledMg += mg;
    return;
  }
  const n = FINISH_V1.gridSize;
  const col = Math.max(0, Math.min(n - 1, Math.floor(((x + 1) / 2) * n)));
  const row = Math.max(0, Math.min(n - 1, Math.floor(((y + 1) / 2) * n)));
  deposit.cellsMg[row * n + col] += mg;
  deposit.insideMg += mg;
}

/**
 * Land the pending drizzle, spread evenly along the segment from where it started to (toX, toY).
 * Integer milligrams; any remainder lands on the last point.
 */
function flushDrizzle(s: GameState, toX: number, toY: number): void {
  const held = s.held;
  if (held?.kind !== 'drizzle') return;
  const dish = dishById(s, held.dishId);
  if (dish && held.pendingMg > 0) {
    const deposit = (dish.finish.drizzles[held.drizzleId] ??= emptyDeposit());
    const distance = Math.hypot(toX - held.px, toY - held.py);
    const points = Math.max(1, Math.ceil(distance / FINISH_V1.drizzleSegmentStep));
    const each = Math.floor(held.pendingMg / points);
    for (let i = 1; i <= points; i++) {
      const t = i / points;
      const mg = i === points ? held.pendingMg - each * (points - 1) : each;
      depositAt(deposit, held.px + (toX - held.px) * t, held.py + (toY - held.py) * t, mg);
    }
  }
  held.px = toX;
  held.py = toY;
  held.pendingMg = 0;
  held.pendingMs = 0;
}

/**
 * The ticket a new dish is started for: the ticket the player picked on the rail (always honoured;
 * automatic follows don't count), else the oldest open ticket without a dish, else the shown
 * ticket, else the oldest open ticket.
 */
export function ticketForNewDish(s: GameState): Ticket | undefined {
  const open = s.tickets.filter((t) => t.servedAtMs === undefined);
  const picked = open.find((t) => t.id === s.selected.pickedTicketId);
  if (picked) return picked;
  const live = new Set(s.dishes.filter((d) => d.stage !== 'served' && d.stage !== 'trashed').map((d) => d.forTicketId));
  return open.find((t) => !live.has(t.id)) ?? open.find((t) => t.id === s.selected.ticketId) ?? open[0];
}

/** At Finish, point the paper ticket at the dish now shown on the vessel. */
function followShownFinishDish(s: GameState): void {
  if (s.selected.station !== 'finish') return;
  const working = s.dishes.filter((d) => d.stage === 'prepped' || d.stage === 'finishing');
  const shown = working.find((d) => d.id === s.selected.dishId) ?? working[0];
  if (shown) followDishTicket(s, shown);
}

/** Point the ticket selection at the open ticket a dish was started for, if any. */
function followDishTicket(s: GameState, dish: Dish): void {
  const ticket = dish.forTicketId ? s.tickets.find((t) => t.id === dish.forTicketId && t.servedAtMs === undefined) : undefined;
  if (ticket) s.selected.ticketId = ticket.id;
}

/** Land what is pending and let go of the drizzle (prep boosts are left alone). */
function endDrizzle(s: GameState): void {
  if (s.held?.kind !== 'drizzle') return;
  flushDrizzle(s, s.held.x, s.held.y);
  s.held = undefined;
}

function emptyDeposit(): Deposit {
  return { cellsMg: new Array(FINISH_V1.gridSize * FINISH_V1.gridSize).fill(0), insideMg: 0, spilledMg: 0 };
}

const dishById = (s: GameState, id: string | undefined) => (id ? s.dishes.find((d) => d.id === id) : undefined);

/** Continuous-process settings from owned upgrades (they only change between advances). */
interface StepRules {
  heatRisePerMs: number;
  boostMultiplier: number;
  /** Pressure lids: the boost lets go when a dish reaches the start of its perfect window. */
  whistle: boolean;
  bandUnits: number;
}

/** The units at which a dish's whistle blows: the start of its guiding ticket's perfect window. */
function whistleMilliUnits(s: GameState, dish: Dish, bandUnits: number): number | undefined {
  const ticket = dish.forTicketId ? s.tickets.find((t) => t.id === dish.forTicketId && t.servedAtMs === undefined) : undefined;
  return ticket ? (prepTargetUnits(ticket.order.prepLevel) - bandUnits) * 1000 : undefined;
}

/** Integrate continuous processes over [nowMs, nowMs + 1). */
function stepOneMs(s: GameState, rules: StepRules): void {
  const held = s.held;
  if (held?.kind === 'pour') {
    const dish = dishById(s, held.dishId);
    const portion = dish?.build[held.component];
    if (portion) {
      portion.mg += BUILD_V1.pourRateMgPerMs[held.component];
      if (held.stopAtMg !== undefined && portion.mg >= held.stopAtMg) {
        portion.mg = Math.max(held.stopAtMg, held.startMg);
        s.held = undefined; // reached the line: the pour stops by itself
      }
    }
  } else if (held?.kind === 'drizzle') {
    held.pendingMg += lookup(FINISH_V1.drizzleRateMgPerMs, held.drizzleId) ?? 0;
    held.pendingMs += 1;
    if (held.pendingMs >= FINISH_V1.drizzleFlushMs) flushDrizzle(s, held.x, held.y);
  }

  // N units per second is exactly N milli-units per millisecond.
  const baseRate = PREP_V1.unitsPerSecond;
  const boostRate = Math.round(baseRate * rules.boostMultiplier);
  for (const slot of s.prepSlots) {
    const dish = dishById(s, slot.dishId);
    const boosting = !!dish && slot.boostHeld && !slot.overheated;
    // An overheated handi is off the flame: nothing cooks until it has cooled (prep-v2).
    if (dish?.prep && !slot.overheated) {
      const before = dish.prep.milliUnits;
      dish.prep.milliUnits = Math.min(PREP_V1.maxUnits * 1000, before + (boosting ? boostRate : baseRate));
      if (boosting && rules.whistle) {
        const at = whistleMilliUnits(s, dish, rules.bandUnits);
        if (at !== undefined && before < at && dish.prep.milliUnits >= at) slot.boostHeld = false;
      }
    }
    if (boosting) {
      slot.heat = Math.min(PREP_V1.heatMax, slot.heat + rules.heatRisePerMs);
      if (slot.heat >= PREP_V1.heatMax) {
        slot.overheated = true;
        slot.boostHeld = false; // a held or latched boost lets go; boosting again takes a new press
      }
    } else {
      slot.heat = Math.max(0, slot.heat - PREP_V1.heatCoolPerMs);
      if (slot.overheated && slot.heat <= PREP_V1.heatUnlockLevel) slot.overheated = false;
    }
  }
}

/**
 * Advance the simulation by dtMs whole milliseconds. Returns a new state; the input is untouched.
 */
export function advanceGame(state: GameState, dtMs: number): GameState {
  if (!Number.isInteger(dtMs) || dtMs < 0) throw new RangeError('dtMs must be a nonnegative integer');
  if (dtMs === 0 || state.paused || state.day.completed) return state;
  const s = structuredClone(state);
  const end = s.nowMs + dtMs;
  processDiscrete(s);
  // Owned upgrades don't change during an advance (only commands buy them).
  const owned = upgradeEffects(s.profile.upgrades);
  const rules: StepRules = {
    heatRisePerMs: owned.heatRisePerMs ?? PREP_V1.heatRisePerMs,
    boostMultiplier: owned.boostMultiplier ?? PREP_V1.boostMultiplier,
    whistle: owned.whistle,
    bandUnits: prepBandUnits(owned),
  };
  while (s.nowMs < end && !s.day.completed) {
    if (hasContinuousWork(s)) {
      stepOneMs(s, rules);
      s.nowMs += 1;
    } else {
      s.nowMs = Math.min(end, nextDiscreteEventMs(s) ?? end);
    }
    processDiscrete(s);
  }
  return s;
}

// --- Day completion & rewards -----------------------------------------------------

function completeDay(s: GameState): void {
  s.day.completed = true;
  s.paused = false;
  releaseHeld(s);
  if (s.profile.creditedDays.includes(s.day.number)) return;
  const tips = s.day.results.reduce((sum, r) => sum + r.tip, 0);
  const points = s.day.results.reduce((sum, r) => sum + r.points, 0);
  const average = s.day.results.length
    ? Math.round(s.day.results.reduce((sum, r) => sum + r.scores.total, 0) / s.day.results.length)
    : 0;
  s.profile.coins += tips;
  s.profile.points += points;
  s.profile.rank = rankForPoints(s.profile.points);
  s.profile.bestDayScore = Math.max(s.profile.bestDayScore, average);
  s.profile.creditedDays.push(s.day.number);
}

// --- Commands -----------------------------------------------------------------------

const fail = (state: GameState, error: string) => ({ state, result: { ok: false, error } as CommandResult });

/**
 * Apply a player command at the current simulation time. Invalid commands leave the state
 * unchanged and report why.
 */
export function applyCommand(state: GameState, command: Command): { state: GameState; result: CommandResult } {
  const s = structuredClone(state);
  const error = run(s, command);
  return error ? fail(state, error) : { state: s, result: { ok: true } };
}

/** Let go of every held control: end a pour (dropping an empty portion), a drizzle, and boosts. */
export function releaseHeld(s: GameState): void {
  const held = s.held;
  if (held?.kind === 'pour') {
    const dish = dishById(s, held.dishId);
    if (dish && dish.build[held.component]?.mg === 0) delete dish.build[held.component];
  } else if (held?.kind === 'drizzle') {
    endDrizzle(s);
  }
  s.held = undefined;
  s.prepSlots.forEach((slot) => (slot.boostHeld = false));
}

/** Reject malformed command values (commands can come from saves, tests or plain JS). */
function invalidValues(s: GameState, c: Command): string | undefined {
  const slotOk = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < s.prepSlots.length;
  switch (c.type) {
    case 'selectStation':
      return STATIONS.includes(c.station) ? undefined : 'Unknown station';
    case 'startDish':
      return SIZES.includes(c.size) ? undefined : 'Unknown vessel size';
    case 'beginPour':
      if (!COMPONENTS.includes(c.component)) return 'Unknown component';
      return c.stopAtMg === undefined || (Number.isInteger(c.stopAtMg) && c.stopAtMg > 0) ? undefined : 'Bad stop amount';
    case 'startPrep':
    case 'finishPrep':
      return slotOk(c.slot) ? undefined : 'No such prep slot';
    case 'setBoost':
      return slotOk(c.slot) && typeof c.held === 'boolean' ? undefined : 'Bad boost command';
    default:
      return undefined;
  }
}

function run(s: GameState, c: Command): string | undefined {
  const bad = invalidValues(s, c);
  if (bad) return bad;
  if (c.type === 'releaseHolds') {
    releaseHeld(s);
    return;
  }
  if (s.day.completed && !['nextDay', 'buyUpgrade', 'markDayReported', 'selectStation', 'resume'].includes(c.type)) return 'Day is over';
  if (s.paused && c.type !== 'resume' && c.type !== 'selectStation') return 'Game is paused';
  const effects = upgradeEffects(s.profile.upgrades);

  switch (c.type) {
    case 'selectStation': {
      releaseHeld(s);
      s.selected.station = c.station;
      // At Build and Finish, the paper ticket shows the ticket of the dish being worked on; at Build
      // with nothing on the counter, the ticket the next dish would be made for.
      if (c.station === 'build') {
        const building = s.dishes.find((d) => d.stage === 'building');
        if (building) followDishTicket(s, building);
        else {
          const next = ticketForNewDish(s);
          if (next) s.selected.ticketId = next.id;
        }
      } else if (c.station === 'finish') {
        const working = s.dishes.filter((d) => d.stage === 'prepped' || d.stage === 'finishing');
        const shown = working.find((d) => d.id === s.selected.dishId) ?? working[0];
        if (shown) followDishTicket(s, shown);
      }
      return;
    }
    case 'selectTicket':
      if (c.ticketId && !s.tickets.some((t) => t.id === c.ticketId)) return 'No such ticket';
      s.selected.ticketId = c.ticketId;
      s.selected.pickedTicketId = c.ticketId; // the player's own pick
      return;
    case 'selectDish': {
      const dish = c.dishId ? dishById(s, c.dishId) : undefined;
      if (c.dishId && !dish) return 'No such dish';
      // A drizzle on the dish being left ends (it must never keep pouring onto a dish off screen).
      if (s.held?.kind === 'drizzle' && s.held.dishId !== c.dishId) endDrizzle(s);
      s.selected.dishId = c.dishId;
      if (dish) followDishTicket(s, dish);
      return;
    }
    case 'pause':
      s.paused = true;
      releaseHeld(s);
      return;
    case 'resume':
      s.paused = false;
      return;

    case 'takeOrder': {
      const queue = s.day.customers
        .filter((x) => x.phase === 'at_counter')
        .sort((a, b) => (a.atCounterMs ?? 0) - (b.atCounterMs ?? 0));
      const customer = queue[0];
      if (!customer) return 'Nobody is waiting at the counter';
      const catalog = getCatalogCustomer(customer.catalogId);
      if (!catalog) return `Unknown customer ${customer.catalogId}`;
      const rng = createRng(s.rngState);
      const order = generateOrder(catalog, rng, s.profile.rank);
      s.rngState = rng.state;
      const ticket = {
        id: newId(s, 't'),
        number: s.nextTicketNumber++,
        customerId: customer.id,
        catalogCustomerId: customer.catalogId,
        order,
        takenAtMs: s.nowMs,
        atCounterMs: customer.atCounterMs ?? s.nowMs,
      };
      s.tickets.push(ticket);
      customer.phase = 'waiting_food';
      customer.ticketId = ticket.id;
      s.selected.ticketId = ticket.id;
      return;
    }

    case 'startDish': {
      if (s.dishes.some((d) => d.stage === 'building')) return 'Finish or trash the dish on the build counter first';
      const forTicket = ticketForNewDish(s);
      const dish: Dish = {
        id: newId(s, 'd'),
        size: c.size,
        stage: 'building',
        createdAtMs: s.nowMs,
        ...(forTicket ? { forTicketId: forTicket.id } : {}),
        build: {},
        finish: { drizzles: {}, garnishes: [], steps: [] },
      };
      if (forTicket) s.selected.ticketId = forTicket.id; // the paper ticket shows what the gauges follow
      s.selected.pickedTicketId = undefined; // the pick has been used
      s.dishes.push(dish);
      s.selected.dishId = dish.id;
      return;
    }
    case 'beginPour': {
      if (s.held) return 'Already holding a control';
      const dish = dishById(s, c.dishId);
      if (!dish || dish.stage !== 'building') return 'That dish is not on the build counter';
      if (!getFood(c.foodId)) return `Unknown food ${c.foodId}`;
      const existing = dish.build[c.component];
      if (existing && existing.foodId !== c.foodId) {
        // build-v4: a mis-tap (no more than one minimum press) can be swapped for another food.
        if (existing.mg > BUILD_V1.pourRateMgPerMs[c.component] * BUILD_V1.minPressMs) {
          return `The ${c.component} is already ${getFood(existing.foodId)?.label ?? existing.foodId}; trash the dish to change it`;
        }
        delete dish.build[c.component];
      }
      dish.build[c.component] ??= { foodId: c.foodId, mg: 0 };
      const startMg = dish.build[c.component]?.mg ?? 0;
      // A pour that should stop at a line it has already reached would otherwise run unchecked.
      if (c.stopAtMg !== undefined && c.stopAtMg <= startMg) return `Already at the line (${Math.round(startMg / 1000)} g)`;
      s.held = {
        kind: 'pour',
        dishId: dish.id,
        component: c.component,
        foodId: c.foodId,
        startMg,
        ...(c.stopAtMg !== undefined && c.stopAtMg > startMg ? { stopAtMg: c.stopAtMg } : {}),
      };
      return;
    }
    case 'cancelPour': {
      if (s.held?.kind !== 'pour') return 'Not pouring';
      const held = s.held;
      const dish = dishById(s, held.dishId);
      const portion = dish?.build[held.component];
      if (dish && portion) {
        if (held.startMg === 0) delete dish.build[held.component];
        else portion.mg = held.startMg;
      }
      s.held = undefined;
      return;
    }
    case 'endPour': {
      if (s.held?.kind !== 'pour') return 'Not pouring';
      const held = s.held;
      const dish = dishById(s, held.dishId);
      const portion = dish?.build[held.component];
      // build-v3: a press pours at least minPressMs worth, however quick the tap was.
      const least = BUILD_V1.pourRateMgPerMs[held.component] * BUILD_V1.minPressMs;
      // ...but never past the line of a pour that stops at one.
      if (portion && portion.mg - held.startMg < least) portion.mg = Math.min(held.startMg + least, held.stopAtMg ?? Infinity);
      s.held = undefined;
      return;
    }
    case 'finishBuild': {
      const dish = dishById(s, c.dishId);
      if (!dish || dish.stage !== 'building') return 'That dish is not on the build counter';
      if (s.held && 'dishId' in s.held && s.held.dishId === dish.id) releaseHeld(s);
      dish.stage = 'built';
      // That ticket now has its dish: point the selection at the next ticket still waiting for
      // one, so the next dish is suggested for it (the player can still pick any ticket).
      // A pick of this dish's own ticket has been used by it.
      if (s.selected.pickedTicketId === dish.forTicketId) s.selected.pickedTicketId = undefined;
      if (s.selected.ticketId === dish.forTicketId) {
        const next = ticketForNewDish({ ...s, selected: { ...s.selected, ticketId: undefined } });
        if (next) s.selected.ticketId = next.id;
      }
      return;
    }

    case 'startPrep': {
      const dish = dishById(s, c.dishId);
      const slot = s.prepSlots[c.slot];
      if (!slot) return 'No such prep slot';
      if (slot.dishId) return `Prep slot ${c.slot + 1} is busy`;
      if (!dish || dish.stage !== 'built') return 'Only a finished build can go to prep';
      dish.stage = 'prepping';
      dish.prep = { slot: c.slot, startedAtMs: s.nowMs, milliUnits: 0 };
      slot.dishId = dish.id;
      slot.boostHeld = false;
      return;
    }
    case 'setBoost': {
      const slot = s.prepSlots[c.slot];
      if (!slot) return 'No such prep slot';
      if (!slot.dishId && c.held) return 'Nothing is cooking in that slot';
      if (slot.overheated && c.held) return 'Too hot to boost; wait for it to cool';
      slot.boostHeld = c.held;
      return;
    }
    case 'finishPrep': {
      const slot = s.prepSlots[c.slot];
      if (!slot?.dishId) return 'Nothing is cooking in that slot';
      const dish = dishById(s, slot.dishId);
      if (!dish?.prep || dish.stage !== 'prepping' || dish.prep.slot !== c.slot) return 'Nothing is cooking in that slot';
      dish.stage = 'prepped';
      dish.prep!.finishedAtMs = s.nowMs;
      slot.dishId = undefined;
      slot.boostHeld = false;
      return;
    }

    case 'beginDrizzle': {
      if (s.held) return 'Already holding a control';
      const dish = dishById(s, c.dishId);
      if (!dish || (dish.stage !== 'prepped' && dish.stage !== 'finishing')) return 'That dish is not at the finish counter';
      const drizzle = lookup(DRIZZLES, c.drizzleId);
      if (!drizzle) return `Unknown drizzle ${c.drizzleId}`;
      if (drizzle.unlockRank > s.profile.rank) return `${drizzle.label} unlocks at rank ${drizzle.unlockRank}`;
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return 'Bad position';
      dish.stage = 'finishing';
      dish.finish.drizzles[c.drizzleId] ??= emptyDeposit();
      recordStep(dish, `drizzle:${c.drizzleId}`);
      const x = clampLocal(c.x);
      const y = clampLocal(c.y);
      s.held = { kind: 'drizzle', dishId: dish.id, drizzleId: c.drizzleId, x, y, px: x, py: y, pendingMg: 0, pendingMs: 0 };
      return;
    }
    case 'moveDrizzle': {
      if (s.held?.kind !== 'drizzle') return 'Not drizzling';
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return 'Bad position';
      const x = clampLocal(c.x);
      const y = clampLocal(c.y);
      flushDrizzle(s, x, y);
      s.held.x = x;
      s.held.y = y;
      return;
    }
    case 'endDrizzle':
      if (s.held?.kind !== 'drizzle') return 'Not drizzling';
      endDrizzle(s);
      return;
    case 'placeGarnish': {
      const dish = dishById(s, c.dishId);
      if (!dish || (dish.stage !== 'prepped' && dish.stage !== 'finishing')) return 'That dish is not at the finish counter';
      const garnish = lookup(GARNISHES, c.garnishId);
      if (!garnish) return `Unknown garnish ${c.garnishId}`;
      if (garnish.unlockRank > s.profile.rank) return `${garnish.label} unlocks at rank ${garnish.unlockRank}`;
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return 'Bad position';
      const x = clampLocal(c.x);
      const y = clampLocal(c.y);
      const outside = x * x + y * y > 1;
      // Garnish tray (progression-v5): a piece dropped outside the katori lands back on the tray.
      if (outside && effects.catchFallen) return 'Caught by the garnish tray: place it inside the katori';
      dish.stage = 'finishing';
      dish.finish.garnishes.push({ id: c.garnishId, x, y, fell: outside });
      recordStep(dish, `garnish:${c.garnishId}`);
      return;
    }
    case 'finishDish': {
      const dish = dishById(s, c.dishId);
      if (!dish || (dish.stage !== 'prepped' && dish.stage !== 'finishing')) return 'That dish is not at the finish counter';
      if (s.held?.kind === 'drizzle' && s.held.dishId === dish.id) endDrizzle(s);
      dish.stage = 'ready';
      followShownFinishDish(s);
      return;
    }

    case 'serve': {
      const dish = dishById(s, c.dishId);
      const ticket = s.tickets.find((t) => t.id === c.ticketId);
      if (!dish || dish.stage !== 'ready') return 'That dish is not ready to serve';
      if (!ticket) return 'No such ticket';
      if (ticket.servedAtMs !== undefined) return 'That ticket was already served';
      const customer = s.day.customers.find((x) => x.id === ticket.customerId);
      const buildGrade = gradeBuild(dish, ticket.order, effects);
      const build = buildGrade.score;
      const prep = gradePrep(dish, ticket.order, effects);
      const finishGrade = gradeFinishV1(dish, ticket.order);
      const finish = finishGrade.score;
      const waiting = gradeWaitingV1(ticket, s.nowMs, effects);
      const share = contentShare(dish, ticket.order);
      const total = aggregateV2({ waiting, build, prep, finish }, share);
      const complete = orderComplete(dish, ticket.order);
      const reward = rewardsV2(total, ticket.order.size, complete);
      const notes = serveNotes(dish, ticket.order, { waiting, build, prep, finish }, share, finishGrade.penalties, s.nowMs - ticket.atCounterMs, effects);
      ticket.servedAtMs = s.nowMs;
      ticket.servedDishId = dish.id;
      dish.stage = 'served';
      if (customer) {
        customer.phase = 'walking_out';
        customer.leftAtMs = s.nowMs;
      }
      s.day.results.push({
        ticketId: ticket.id,
        dishId: dish.id,
        catalogCustomerId: ticket.catalogCustomerId,
        scores: { waiting, build, prep, finish, total },
        ...reward,
        mismatchedOrder: !dishMatchesOrder(dish, ticket.order),
        buildErrorG: buildGrade.signedErrorG,
        contentShare: share,
        complete,
        notes,
        servedAtMs: s.nowMs,
      });
      if (s.selected.ticketId === ticket.id) s.selected.ticketId = undefined;
      if (s.selected.pickedTicketId === ticket.id) s.selected.pickedTicketId = undefined;
      if (s.selected.dishId === dish.id) s.selected.dishId = undefined;
      followShownFinishDish(s);
      return;
    }
    case 'trash': {
      const dish = dishById(s, c.dishId);
      if (!dish || dish.stage === 'served' || dish.stage === 'trashed') return 'Nothing to trash';
      if (dish.prep && dish.stage === 'prepping') {
        const slot = s.prepSlots[dish.prep.slot];
        if (slot.dishId === dish.id) {
          slot.dishId = undefined;
          slot.boostHeld = false;
        }
      }
      if (s.held && 'dishId' in s.held && s.held.dishId === dish.id) releaseHeld(s);
      dish.stage = 'trashed';
      if (s.selected.dishId === dish.id) s.selected.dishId = undefined;
      followShownFinishDish(s);
      return;
    }

    case 'nextDay': {
      if (!s.day.completed) return 'The day is not over yet';
      s.day = { number: s.day.number + 1, customers: [], completed: false, results: [] };
      s.nowMs = 0;
      s.tickets = [];
      s.dishes = [];
      s.held = undefined;
      s.nextTicketNumber = 1;
      s.selected = { station: 'order' };
      s.prepSlots = s.prepSlots.map((slot) => ({ index: slot.index, boostHeld: false, heat: 0, overheated: false }));
      scheduleDay(s);
      return;
    }
    case 'buyUpgrade': {
      const upgrade = lookup(UPGRADES, c.upgradeId);
      if (!upgrade) return 'Unknown upgrade';
      if (!Number.isFinite(s.profile.coins)) return 'Coins are not a number';
      if (s.profile.upgrades.includes(upgrade.id)) return 'Already owned';
      if (s.profile.rank < upgrade.unlockRank) return `Unlocks at rank ${upgrade.unlockRank}`;
      if (s.profile.coins < upgrade.cost) return 'Not enough coins';
      s.profile.coins -= upgrade.cost;
      s.profile.upgrades.push(upgrade.id);
      return;
    }
    case 'markDayReported':
      if (!s.profile.creditedDays.includes(c.day)) return 'That day has not been credited';
      if (s.profile.reportedDays.includes(c.day)) return 'Already reported';
      s.profile.reportedDays.push(c.day);
      return;
  }
}

function clampLocal(v: number): number {
  return Math.max(-1.5, Math.min(1.5, v));
}

function recordStep(dish: Dish, step: string): void {
  if (dish.finish.steps[dish.finish.steps.length - 1] !== step) dish.finish.steps.push(step);
}
