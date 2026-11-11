// Save / restore. The save is the whole GameState wrapped with a format tag. Restoring migrates old
// schema versions, then validates every part the reducer relies on: entity shapes, the two-way link
// between prep slots and dishes, id uniqueness, the id counter, catalog ids and parameter versions.
// Anything wrong raises SaveError, so a damaged or crafted save is rejected up front instead of
// crashing (or misbehaving) later.
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { getCatalogCustomer, getFood } from './catalog.ts';
import { PARAM_VERSIONS, PREP_SLOT_COUNT, releaseHeld } from './game.ts';
import { lookup } from './lookup.ts';
import { UPGRADES } from './progression.ts';
import { SCHEMA_VERSION, type GameState, type Profile } from './types.ts';

export const SAVE_FORMAT = 'nutriserve-remaster-save';

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  state: GameState;
}

export function serializeGame(state: GameState): string {
  const file: SaveFile = { format: SAVE_FORMAT, schemaVersion: SCHEMA_VERSION, state };
  return JSON.stringify(file);
}

export class SaveError extends Error {}

/** Migrations from older schema versions, keyed by the version they upgrade from. */
const MIGRATIONS: Record<number, (state: any) => any> = {
  1: (state) => ({ ...state, schemaVersion: 2, runId: `run-${(Number(state.seed) >>> 0).toString(36)}` }),
};

const STAGES = ['building', 'built', 'prepping', 'prepped', 'finishing', 'ready', 'served', 'trashed'];
const PHASES = ['scheduled', 'walking_in', 'at_counter', 'waiting_food', 'walking_out', 'gone'];
const SIZES = ['small', 'medium', 'large'];
const PREP_LEVELS = ['quick', 'regular', 'slow'];
const STATIONS = ['order', 'build', 'prep', 'finish'];

const isInt = (v: unknown): v is number => Number.isInteger(v);
const isNonNegInt = (v: unknown): v is number => isInt(v) && v >= 0;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => Number.isFinite(v);
const isScore = (v: unknown) => isNum(v) && (v as number) >= 0 && (v as number) <= 100;
const idNumber = (id: string) => Number(id.slice(1));
const COMPONENTS = ['base', 'main', 'side'];

function profileProblems(profile: any): boolean {
  return !(
    isObj(profile) &&
    isInt(profile.rank) && profile.rank >= 1 &&
    isNum(profile.points) && isNum(profile.coins) && profile.coins >= 0 &&
    isNum(profile.bestDayScore) &&
    Array.isArray(profile.upgrades) && profile.upgrades.every((u: unknown) => !!lookup(UPGRADES, u)) &&
    Array.isArray(profile.creditedDays) && profile.creditedDays.every(isInt) &&
    Array.isArray(profile.reportedDays) && profile.reportedDays.every(isInt)
  );
}

function validate(state: any): string[] {
  const p: string[] = [];
  const need = (ok: boolean, what: string) => {
    if (!ok) p.push(what);
  };
  if (!isObj(state)) return ['state'];

  need(isStr(state.runId), 'runId');
  need(isNonNegInt(state.nowMs), 'nowMs');
  need(isInt(state.rngState), 'rngState');
  need(isInt(state.seed), 'seed');
  need(isInt(state.nextId) && state.nextId >= 1, 'nextId');
  need(isInt(state.nextTicketNumber) && state.nextTicketNumber >= 1, 'nextTicketNumber');
  need(typeof state.paused === 'boolean', 'paused');
  need(isObj(state.selected) && STATIONS.includes(state.selected.station), 'selected');
  need(
    isObj(state.paramVersions) && Object.entries(PARAM_VERSIONS).every(([k, v]) => state.paramVersions[k] === v),
    'paramVersions (saved with different rules)'
  );

  need(!profileProblems(state.profile), 'profile');

  // Catalog ids can be renamed between releases. Unknown ids are dropped from the pool on load and
  // unknown customers leave when they reach the counter (game.ts), so such a save still loads.
  need(Array.isArray(state.customerPool) && state.customerPool.every(isStr) && state.customerPool.some((id: string) => !!getCatalogCustomer(id)), 'customerPool');

  const day = state.day;
  const customers: any[] = isObj(day) && Array.isArray(day.customers) ? day.customers : [];
  need(isObj(day) && isInt(day.number) && day.number >= 1 && typeof day.completed === 'boolean' && customers.length > 0 && Array.isArray(day.results), 'day');
  for (const c of customers) {
    need(isObj(c) && isStr(c.id) && isStr(c.catalogId) && isNonNegInt(c.arrivalMs) && PHASES.includes(c.phase), 'customer');
    if (!isObj(c)) continue;
    // Each phase carries the fields the reducer reads in that phase.
    if (c.phase === 'at_counter') need(isNonNegInt(c.atCounterMs), 'customer at counter without atCounterMs');
    if (c.phase === 'waiting_food') need(isNonNegInt(c.atCounterMs) && isStr(c.ticketId), 'waiting customer without a ticket');
    if (c.phase === 'walking_out') need(isNonNegInt(c.leftAtMs), 'leaving customer without leftAtMs');
  }
  const results: any[] = isObj(day) && Array.isArray(day.results) ? day.results : [];
  for (const r of results) {
    need(
      isObj(r) && isStr(r.ticketId) && isStr(r.dishId) && isStr(r.catalogCustomerId) &&
        isObj(r.scores) && ['waiting', 'build', 'prep', 'finish', 'total'].every((k) => isScore(r.scores[k])) &&
        isNum(r.tip) && r.tip >= 0 && isNum(r.points) && isNum(r.stars) && r.stars >= 0 && r.stars <= 5 &&
        typeof r.mismatchedOrder === 'boolean' && isNonNegInt(r.servedAtMs) &&
        isObj(r.buildErrorG) && COMPONENTS.every((k) => r.buildErrorG[k] === null || isNum(r.buildErrorG[k])),
      'day result'
    );
  }

  const tickets: any[] = Array.isArray(state.tickets) ? state.tickets : [];
  need(Array.isArray(state.tickets), 'tickets');
  for (const t of tickets) {
    const o = isObj(t) ? t.order : undefined;
    need(
      isObj(t) && isStr(t.id) && isInt(t.number) && isStr(t.customerId) && isNonNegInt(t.takenAtMs) && isNonNegInt(t.atCounterMs) &&
        isObj(o) && SIZES.includes(o.size) && PREP_LEVELS.includes(o.prepLevel) &&
        [o.baseId, o.mainId, o.sideId].every((id) => isStr(id) && getFood(id)) &&
        isObj(o.idealG) && COMPONENTS.every((k) => isNum(o.idealG[k]) && o.idealG[k] > 0) &&
        Array.isArray(o.finish) &&
        o.finish.every((f: any) => isObj(f) && (f.kind === 'drizzle' ? !!lookup(DRIZZLES, f.id) : f.kind === 'garnish' && !!lookup(GARNISHES, f.id) && isInt(f.count))),
      'ticket'
    );
    if (isObj(t)) need(customers.some((c) => isObj(c) && c.id === t.customerId), 'ticket for a missing customer');
  }
  for (const c of customers) {
    if (isObj(c) && c.ticketId !== undefined) need(tickets.some((t) => isObj(t) && t.id === c.ticketId), 'customer with a missing ticket');
  }

  const dishes: any[] = Array.isArray(state.dishes) ? state.dishes : [];
  need(Array.isArray(state.dishes), 'dishes');
  for (const d of dishes) {
    need(isObj(d) && isStr(d.id) && SIZES.includes(d.size) && STAGES.includes(d.stage) && isObj(d.build) && isObj(d.finish), 'dish');
    if (!isObj(d) || !isObj(d.build) || !isObj(d.finish)) continue;
    for (const [component, portion] of Object.entries(d.build)) {
      need(COMPONENTS.includes(component) && isObj(portion) && isStr((portion as any).foodId) && !!getFood((portion as any).foodId) && isNonNegInt((portion as any).mg), 'dish portion');
    }
    need(isObj(d.finish.drizzles) && Array.isArray(d.finish.garnishes) && Array.isArray(d.finish.steps), 'dish finish');
    for (const [id, dep] of Object.entries(d.finish.drizzles ?? {})) {
      need(!!lookup(DRIZZLES, id) && isObj(dep) && Array.isArray((dep as any).cellsMg) && (dep as any).cellsMg.every(isNonNegInt) && isNonNegInt((dep as any).insideMg) && isNonNegInt((dep as any).spilledMg), 'dish drizzle');
    }
    for (const g of d.finish.garnishes ?? []) need(isObj(g) && !!lookup(GARNISHES, g.id) && isNum(g.x) && isNum(g.y) && typeof g.fell === 'boolean', 'dish garnish');
    const cooking = d.stage === 'prepping';
    if (cooking || d.prep !== undefined) {
      need(isObj(d.prep) && isInt(d.prep.slot) && d.prep.slot >= 0 && d.prep.slot < PREP_SLOT_COUNT && isNonNegInt(d.prep.milliUnits) && isNonNegInt(d.prep.startedAtMs), 'dish prep');
    }
  }

  // Prep slots and cooking dishes must point at each other, one to one.
  need(Array.isArray(state.prepSlots) && state.prepSlots.length === PREP_SLOT_COUNT, 'prepSlots');
  const slots: any[] = Array.isArray(state.prepSlots) ? state.prepSlots : [];
  slots.forEach((slot, i) => {
    need(isObj(slot) && slot.index === i && typeof slot.boostHeld === 'boolean' && typeof slot.overheated === 'boolean' && isNonNegInt(slot.heat), 'prep slot');
    if (!isObj(slot) || slot.dishId === undefined) return;
    const dish = dishes.find((d) => isObj(d) && d.id === slot.dishId);
    need(!!dish && dish.stage === 'prepping' && dish.prep?.slot === i, 'prep slot dish');
  });
  for (const d of dishes) {
    if (isObj(d) && d.stage === 'prepping') need(slots[d.prep?.slot]?.dishId === d.id, 'cooking dish without its slot');
  }

  const ids = [...tickets, ...dishes, ...customers].filter(isObj).map((x) => x.id).filter(isStr);
  need(new Set(ids).size === ids.length, 'duplicate ids');
  need(ids.every((id) => !(idNumber(id) >= state.nextId)), 'nextId below an existing id');

  if (state.held !== undefined) {
    const h = state.held;
    const dish = isObj(h) ? dishes.find((d) => isObj(d) && d.id === h.dishId) : undefined;
    const pourOk = isObj(h) && h.kind === 'pour' && dish?.stage === 'building' && COMPONENTS.includes(h.component) && isStr(h.foodId) && !!getFood(h.foodId);
    const drizzleOk =
      isObj(h) && h.kind === 'drizzle' && dish?.stage === 'finishing' && !!lookup(DRIZZLES, h.drizzleId) &&
      [h.x, h.y, h.px, h.py].every(isNum) && isNonNegInt(h.pendingMg) && isNonNegInt(h.pendingMs);
    need(pourOk || drizzleOk, 'held action');
  }
  return p;
}

/** Why a save could not be read, plus the profile inside it when that part is still sound. */
export interface SaveSalvage {
  reason: string;
  /** Progress that can seed a fresh day (rank, coins, upgrades, credited days), if readable. */
  profile?: Profile;
  runId?: string;
}

/**
 * When a save can't be restored (different rules, a renamed customer, damage), the player's
 * progress usually still can be: pull the profile out on its own so the game can start a fresh day
 * with it instead of wiping everything.
 */
export function salvageSave(text: string, reason: string): SaveSalvage {
  try {
    const file = JSON.parse(text);
    const state = isObj(file) ? file.state : undefined;
    if (!isObj(state) || profileProblems(state.profile)) return { reason };
    const profile: Profile = {
      rank: state.profile.rank,
      points: state.profile.points,
      coins: state.profile.coins,
      upgrades: [...state.profile.upgrades],
      creditedDays: [...state.profile.creditedDays],
      reportedDays: [...state.profile.reportedDays],
      bestDayScore: state.profile.bestDayScore,
    };
    return { reason, profile, runId: isStr(state.runId) ? state.runId : undefined };
  } catch {
    return { reason };
  }
}

export function deserializeGame(text: string): GameState {
  let file: any;
  try {
    file = JSON.parse(text);
  } catch {
    throw new SaveError('Save is not valid JSON');
  }
  if (!isObj(file) || file.format !== SAVE_FORMAT) throw new SaveError('Not a NutriServe save');
  let state = file.state;
  let version = file.schemaVersion;
  if (!isInt(version) || version > SCHEMA_VERSION) throw new SaveError('Unsupported save version');
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) throw new SaveError(`No migration from schema ${version}`);
    state = migrate(state);
    version++;
  }
  if (!isObj(state) || state.schemaVersion !== SCHEMA_VERSION) throw new SaveError('Unsupported save version');

  let problems: string[];
  try {
    problems = validate(state);
  } catch (error) {
    problems = [`unreadable (${(error as Error).message})`];
  }
  if (problems.length) throw new SaveError(`Save is damaged: ${[...new Set(problems)].join(', ')}`);
  // Nobody is holding a control when a game is reopened: end any pour, drizzle or boost that was
  // held when it was saved (an unload can save mid-hold), so nothing keeps running unattended.
  releaseHeld(state as GameState);
  state.customerPool = state.customerPool.filter((id: string) => !!getCatalogCustomer(id));
  return state as GameState;
}
