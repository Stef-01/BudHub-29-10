// Save / restore. The save is the whole GameState wrapped with a format tag. Restoring checks the
// format and schema version and the shape of the parts the reducer relies on, so a corrupt or
// foreign save is rejected instead of silently producing an invalid game.
import { PREP_SLOT_COUNT } from './game.ts';
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

const isInt = (v: unknown) => Number.isInteger(v);
const isArray = Array.isArray;

/** Migrations from older schema versions, keyed by the version they upgrade from. */
const MIGRATIONS: Record<number, (state: any) => any> = {};

export function deserializeGame(text: string): GameState {
  let file: any;
  try {
    file = JSON.parse(text);
  } catch {
    throw new SaveError('Save is not valid JSON');
  }
  if (!file || file.format !== SAVE_FORMAT) throw new SaveError('Not a NutriServe save');
  let state = file.state;
  let version = file.schemaVersion;
  while (isInt(version) && version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) throw new SaveError(`No migration from schema ${version}`);
    state = migrate(state);
    version++;
  }
  if (version !== SCHEMA_VERSION || state?.schemaVersion !== SCHEMA_VERSION) throw new SaveError('Unsupported save version');

  const problems: string[] = [];
  if (!isInt(state.nowMs) || state.nowMs < 0) problems.push('nowMs');
  if (!isInt(state.rngState)) problems.push('rngState');
  if (!isInt(state.nextId) || state.nextId < 1) problems.push('nextId');
  if (!isArray(state.tickets) || !isArray(state.dishes)) problems.push('tickets/dishes');
  if (!isArray(state.prepSlots) || state.prepSlots.length !== PREP_SLOT_COUNT) problems.push('prepSlots');
  if (!state.day || !isArray(state.day.customers) || !isArray(state.day.results)) problems.push('day');
  if (!state.profile || !isArray(state.profile.creditedDays) || !isArray(state.profile.reportedDays)) problems.push('profile');
  if (!isArray(state.customerPool) || state.customerPool.length === 0) problems.push('customerPool');
  const ids = [...state.tickets, ...state.dishes, ...(state.day?.customers ?? [])].map((x: any) => x.id);
  if (new Set(ids).size !== ids.length) problems.push('duplicate ids');
  for (const slot of state.prepSlots ?? []) {
    if (slot.dishId && !state.dishes.some((d: any) => d.id === slot.dishId && d.stage === 'prepping')) problems.push('prep slot dish');
  }
  if (problems.length) throw new SaveError(`Save is damaged: ${problems.join(', ')}`);
  return state as GameState;
}
