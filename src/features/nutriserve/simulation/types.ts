// NutriServe remaster simulation types. Pure data: the whole GameState is JSON-serialisable and is
// what gets saved and restored. Times are integer simulation milliseconds; masses are integer
// milligrams; prep progress is integer milli-units. Integers keep advanceGame() exact no matter how
// a stretch of time is split into frames.
import type { DishSize, PrepLevel } from './params.ts';

export type { DishSize, PrepLevel };

/** v2 added GameState.runId. */
export const SCHEMA_VERSION = 2;

export type StationId = 'order' | 'build' | 'prep' | 'finish';
export type BuildComponent = 'base' | 'main' | 'side';

/** What a ticket asks for. Food ids are canonical catalog ids. */
export interface TicketOrder {
  size: DishSize;
  baseId: string;
  mainId: string;
  sideId: string;
  /** Ideal grams for each component (the fill line / meter midpoint). */
  idealG: Record<BuildComponent, number>;
  prepLevel: PrepLevel;
  /** Finish steps in the order they should be done. */
  finish: FinishStep[];
}

export type FinishStep = { kind: 'drizzle'; id: string } | { kind: 'garnish'; id: string; count: number };

export type CustomerPhase = 'scheduled' | 'walking_in' | 'at_counter' | 'waiting_food' | 'walking_out' | 'gone';

export interface Customer {
  id: string;
  /** Catalog customer id (also the sprite id). */
  catalogId: string;
  arrivalMs: number;
  phase: CustomerPhase;
  /** When the customer reached the counter. */
  atCounterMs?: number;
  ticketId?: string;
  leftAtMs?: number;
}

export interface Ticket {
  id: string;
  /** Human-friendly number shown on the paper ticket. */
  number: number;
  customerId: string;
  catalogCustomerId: string;
  order: TicketOrder;
  takenAtMs: number;
  atCounterMs: number;
  servedAtMs?: number;
  servedDishId?: string;
}

export interface Portion {
  foodId: string;
  mg: number;
}

export type DishStage = 'building' | 'built' | 'prepping' | 'prepped' | 'finishing' | 'ready' | 'served' | 'trashed';

export interface Deposit {
  /** Grid of deposited milligrams inside the vessel, row-major, gridSize x gridSize. */
  cellsMg: number[];
  insideMg: number;
  spilledMg: number;
}

export interface PlacedGarnish {
  id: string;
  /** Local vessel coordinates, -1..1 on both axes; the vessel top is the unit circle. */
  x: number;
  y: number;
  fell: boolean;
}

export interface Dish {
  id: string;
  size: DishSize;
  stage: DishStage;
  createdAtMs: number;
  /**
   * The ticket this dish was started for (the selected or oldest open ticket), used only to guide
   * the player (targets, finish steps). Scoring uses whichever ticket the dish is served to.
   */
  forTicketId?: string;
  build: Partial<Record<BuildComponent, Portion>>;
  prep?: {
    slot: number;
    startedAtMs: number;
    milliUnits: number;
    finishedAtMs?: number;
  };
  finish: {
    /** Drizzles by id. */
    drizzles: Record<string, Deposit>;
    garnishes: PlacedGarnish[];
    /** Finish actions in the order the player did them, deduplicated consecutively. */
    steps: string[];
  };
}

export interface PrepSlot {
  index: number;
  dishId?: string;
  boostHeld: boolean;
  heat: number;
  overheated: boolean;
}

/** An action that is in progress while a control is held. */
export type HeldAction =
  | {
      kind: 'pour';
      dishId: string;
      component: BuildComponent;
      foodId: string;
      /** Portion mg when the press began. */
      startMg: number;
      /** The pour ends by itself at this portion mg (click-only pours stop at the line). */
      stopAtMg?: number;
    }
  | {
      kind: 'drizzle';
      dishId: string;
      drizzleId: string;
      /** Current pointer position (local coordinates). */
      x: number;
      y: number;
      /** Where the not-yet-landed drizzle started; it is spread from here to (x, y). */
      px: number;
      py: number;
      pendingMg: number;
      pendingMs: number;
    };

export interface StationScores {
  waiting: number;
  build: number;
  prep: number;
  finish: number;
  total: number;
}

export interface ServeResult {
  ticketId: string;
  dishId: string;
  catalogCustomerId: string;
  scores: StationScores;
  tip: number;
  points: number;
  /** Customer star rating, 0-5, from the total. */
  stars: number;
  /** True when the dish was built for a different order than this ticket (graded honestly). */
  mismatchedOrder: boolean;
  /** Signed build error in grams per component (negative = under); null when the wrong food. */
  buildErrorG: { base: number | null; main: number | null; side: number | null };
  /** Share (0-1) of the ordered food that was in the katori; gates the other scores (AGGREGATION_V2). */
  contentShare: number;
  /** Everything the ticket asked for was on the dish (economy-v2: needed for five stars and the bonus). */
  complete: boolean;
  /** Short reasons for the scores, most important first. */
  notes: string[];
  servedAtMs: number;
}

export interface Profile {
  rank: number;
  points: number;
  coins: number;
  upgrades: string[];
  /** Days whose rewards were credited; prevents double-crediting on replay or reload. */
  creditedDays: number[];
  /** Days already reported to the wider app (game score, XP); prevents double-reporting. */
  reportedDays: number[];
  bestDayScore: number;
}

export interface DayState {
  number: number;
  /** Ordered list of customers for the day. */
  customers: Customer[];
  completed: boolean;
  results: ServeResult[];
}

export interface GameState {
  schemaVersion: number;
  /** Identifies this play-through (one per new game), so outside records can key on it. */
  runId: string;
  /** Parameter-set versions this game is played with. */
  paramVersions: Record<string, string>;
  seed: number;
  rngState: number;
  nowMs: number;
  /**
   * How many commands that play the game (anything but selecting, pausing, letting go of held
   * controls and recording a report; see countsAsPlay) have been applied; absent until the first. With nowMs it orders two copies of one
   * day: at the same game time (paused, or on the day summary) the copy with the higher rev has
   * more done, e.g. a purchase. A safe integer, held at Number.MAX_SAFE_INTEGER once it gets there.
   */
  rev?: number;
  paused: boolean;
  nextId: number;
  nextTicketNumber: number;
  /**
   * ticketId is the ticket shown on the paper ticket (it follows the dish being worked on);
   * pickedTicketId is a ticket the player chose on the rail, which the next new dish is made for.
   */
  selected: { station: StationId; ticketId?: string; dishId?: string; pickedTicketId?: string };
  day: DayState;
  tickets: Ticket[];
  dishes: Dish[];
  prepSlots: PrepSlot[];
  held?: HeldAction;
  profile: Profile;
  /** Customer pool the day draws from (catalog ids with accepted art). */
  customerPool: string[];
}

export type Command =
  | { type: 'selectStation'; station: StationId }
  | { type: 'selectTicket'; ticketId?: string }
  | { type: 'selectDish'; dishId?: string }
  | { type: 'takeOrder' }
  | { type: 'startDish'; size: DishSize }
  /** stopAtMg: stop by itself once the portion reaches this (click-only pours stop at the line). */
  | { type: 'beginPour'; dishId: string; component: BuildComponent; foodId: string; stopAtMg?: number }
  | { type: 'endPour' }
  /** Undo the pour in progress (a touch that turned into a scroll). */
  | { type: 'cancelPour' }
  | { type: 'releaseHolds' }
  | { type: 'finishBuild'; dishId: string }
  | { type: 'startPrep'; dishId: string; slot: number }
  | { type: 'setBoost'; slot: number; held: boolean }
  | { type: 'finishPrep'; slot: number }
  | { type: 'beginDrizzle'; dishId: string; drizzleId: string; x: number; y: number }
  | { type: 'moveDrizzle'; x: number; y: number }
  | { type: 'endDrizzle' }
  | { type: 'placeGarnish'; dishId: string; garnishId: string; x: number; y: number }
  | { type: 'finishDish'; dishId: string }
  | { type: 'serve'; dishId: string; ticketId: string }
  | { type: 'trash'; dishId: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'nextDay' }
  | { type: 'buyUpgrade'; upgradeId: string }
  | { type: 'markDayReported'; day: number };

export type CommandResult = { ok: true } | { ok: false; error: string };
