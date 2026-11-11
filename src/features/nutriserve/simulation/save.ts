// Save / restore. The save is the whole GameState wrapped with a format tag. Restoring migrates old
// schema versions, then validates every part the reducer relies on: entity shapes, the two-way link
// between prep slots and dishes, id uniqueness, the id counter, catalog ids and parameter versions.
// Anything wrong raises SaveError, so a damaged or crafted save is rejected up front instead of
// crashing (or misbehaving) later.
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { getCatalogCustomer, getFood } from './catalog.ts';
import { PARAM_VERSIONS, PREP_SLOT_COUNT } from './game.ts';
import { lookup } from './lookup.ts';
import { UPGRADES } from './progression.ts';
import { SCHEMA_VERSION, type GameState } from './types.ts';

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
const idNumber = (id: string) => Number(id.slice(1));

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

  const profile = state.profile;
  need(
    isObj(profile) &&
      isInt(profile.rank) && profile.rank >= 1 &&
      Number.isFinite(profile.points) && Number.isFinite(profile.coins) && profile.coins >= 0 &&
      Number.isFinite(profile.bestDayScore) &&
      Array.isArray(profile.upgrades) && profile.upgrades.every((u: unknown) => !!lookup(UPGRADES, u)) &&
      Array.isArray(profile.creditedDays) && profile.creditedDays.every(isInt) &&
      Array.isArray(profile.reportedDays) && profile.reportedDays.every(isInt),
    'profile'
  );

  need(Array.isArray(state.customerPool) && state.customerPool.length > 0 && state.customerPool.every((id: unknown) => isStr(id) && getCatalogCustomer(id)), 'customerPool');

  const day = state.day;
  const customers: any[] = isObj(day) && Array.isArray(day.customers) ? day.customers : [];
  need(isObj(day) && isInt(day.number) && day.number >= 1 && typeof day.completed === 'boolean' && Array.isArray(day.customers) && Array.isArray(day.results), 'day');
  for (const c of customers) {
    need(isObj(c) && isStr(c.id) && isStr(c.catalogId) && isNonNegInt(c.arrivalMs) && PHASES.includes(c.phase), 'customer');
    if (isObj(c) && c.phase !== 'gone') need(!!getCatalogCustomer(c.catalogId), `unknown customer ${c.catalogId}`);
  }

  const tickets: any[] = Array.isArray(state.tickets) ? state.tickets : [];
  need(Array.isArray(state.tickets), 'tickets');
  for (const t of tickets) {
    const o = isObj(t) ? t.order : undefined;
    need(
      isObj(t) && isStr(t.id) && isInt(t.number) && isStr(t.customerId) && isNonNegInt(t.takenAtMs) && isNonNegInt(t.atCounterMs) &&
        isObj(o) && SIZES.includes(o.size) && PREP_LEVELS.includes(o.prepLevel) &&
        [o.baseId, o.mainId, o.sideId].every((id) => isStr(id) && getFood(id)) &&
        isObj(o.idealG) && ['base', 'main', 'side'].every((k) => Number.isFinite(o.idealG[k]) && o.idealG[k] > 0) &&
        Array.isArray(o.finish) &&
        o.finish.every((f: any) => isObj(f) && (f.kind === 'drizzle' ? !!lookup(DRIZZLES, f.id) : f.kind === 'garnish' && !!lookup(GARNISHES, f.id) && isInt(f.count))),
      'ticket'
    );
  }

  const dishes: any[] = Array.isArray(state.dishes) ? state.dishes : [];
  need(Array.isArray(state.dishes), 'dishes');
  for (const d of dishes) {
    need(isObj(d) && isStr(d.id) && SIZES.includes(d.size) && STAGES.includes(d.stage) && isObj(d.build) && isObj(d.finish), 'dish');
    if (!isObj(d) || !isObj(d.build) || !isObj(d.finish)) continue;
    for (const [component, portion] of Object.entries(d.build)) {
      need(['base', 'main', 'side'].includes(component) && isObj(portion) && isStr((portion as any).foodId) && !!getFood((portion as any).foodId) && isNonNegInt((portion as any).mg), 'dish portion');
    }
    need(isObj(d.finish.drizzles) && Array.isArray(d.finish.garnishes) && Array.isArray(d.finish.steps), 'dish finish');
    for (const [id, dep] of Object.entries(d.finish.drizzles ?? {})) {
      need(!!lookup(DRIZZLES, id) && isObj(dep) && Array.isArray((dep as any).cellsMg) && (dep as any).cellsMg.every(isNonNegInt) && isNonNegInt((dep as any).insideMg) && isNonNegInt((dep as any).spilledMg), 'dish drizzle');
    }
    for (const g of d.finish.garnishes ?? []) need(isObj(g) && !!lookup(GARNISHES, g.id) && Number.isFinite(g.x) && Number.isFinite(g.y), 'dish garnish');
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
    need(isObj(h) && (h.kind === 'pour' || h.kind === 'drizzle') && dishes.some((d) => isObj(d) && d.id === h.dishId), 'held action');
  }
  return p;
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
  return state as GameState;
}
