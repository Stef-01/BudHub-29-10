// NutriServe Kitchen simulation parameters.
//
// Every rule here is NutriServe's own design: an ADAPTATION (a deliberate choice for this game) or
// PROVISIONAL (a placeholder still being tuned in play). The game takes its station structure from
// the kitchen-serving genre, but none of its rules or numbers are copied from another game, and none
// of them is a claim of matching one.
//
// Parameter sets are versioned. A saved game records the versions it was played with; changing a
// value means bumping the version, never editing a shipped version in place.

export type DishSize = 'small' | 'medium' | 'large';
export type PrepLevel = 'quick' | 'regular' | 'slow';

/** ADAPTATION: customer plate sizes from the catalog map to vessel sizes. */
export const SIZE_FOR_PLATE = { Light: 'small', Regular: 'medium', Hearty: 'large' } as const;

export const BUILD_V1 = {
  // v3: every press of a dispenser pours at least minPressMs worth, so a quick tap (mouse, touch or
  // an assistive-tech activation) always adds a small fixed amount instead of nothing.
  // v4: a component holding no more than one minimum press of a food can still be switched to a
  // different food (the mis-tap is discarded), so a stray tap never forces trashing the dish.
  // v5: NutriServe's own portion grading (see gradeBuild): each food is worth a share of the score,
  // a portion near its line counts as exact, short portions lose more than generous ones, and the
  // wrong vessel costs a flat amount. Hold rates are unchanged.
  version: 'build-v5',
  /** Pour rates while a dispenser is held, in milligrams per millisecond (= grams per second). */
  pourRateMgPerMs: { base: 80, main: 90, side: 50 },
  /** The least one press pours, in ms of pouring (100 ms = 8 g base, 9 g main, 5 g side). */
  minPressMs: 100,
  /** Points each food is worth when it is the right food at the right amount (sums to 100). */
  share: { base: 40, main: 35, side: 25 },
  /** A portion within this fraction of its line counts as exact. */
  exactBand: 0.1,
  /** The same band with the matching serving tool (rice scoop, ladle set). */
  toolExactBand: 0.2,
  /** Past the band, a generous portion loses this share of its credit per extra portion's worth. */
  overSlope: 0.6,
  /** A generous portion never drops below this share of its credit (the food is there). */
  overFloor: 0.2,
  /** Points off for serving in a different vessel size than the ticket asked for. */
  wrongVesselPenalty: 20,
  /** Meters show a main or side up to this multiple of its line (the line sits halfway). */
  meterFullMultiple: 2,
} as const;

export const PREP_V1 = {
  // v2: overheating lets go of the boost and takes the handi off the flame (no cooking at all)
  // until it cools to heatUnlockLevel. In v1 overheating cost nothing: the lockout cycle gave the
  // same boost share as never overheating, and a latched boost cycled forever.
  // v3: NutriServe's own doneness marks and grading (see gradePrep): each level has a mark, a
  // window around it counts as perfect, an undercooked dish earns its share of the way there, and
  // an overcooked one loses points for every second it stayed on.
  version: 'prep-v3-provisional',
  /** PROVISIONAL: doneness units gained per second on the flame (1 unit per ms = 1000 milli-units). */
  unitsPerSecond: 150,
  /** PROVISIONAL: units accrue this many times faster while boost is held. */
  boostMultiplier: 2.5,
  /** PROVISIONAL heat model (integer heat points). Boosting heats the slot; idling cools it. */
  heatMax: 10_000,
  heatRisePerMs: 5,
  heatCoolPerMs: 2,
  /** After overheating, boost is locked and nothing cooks until heat falls back to this level. */
  heatUnlockLevel: 3_000,
  /** A dish stops gaining doneness here (25 s on the flame). */
  maxUnits: 3_750,
  /** Doneness mark for each prep level: 7, 13 and 19 seconds on the flame. */
  targetUnits: { quick: 1_050, regular: 1_950, slow: 2_850 },
  /** Units either side of the mark that count as perfect (0.8 s on the flame). */
  perfectBandUnits: 120,
  /** The same window with copper handis (1.4 s on the flame). */
  wideBandUnits: 210,
  /** Past the window, points lost per second on the flame of overcooking. */
  overPointsPerSecond: 12,
} as const;

export const FINISH_V1 = {
  // v2: drizzle targets moved here (versioned) and coverage scaled to each drizzle's target, so a
  // small drizzle such as ghee tadka can reach full marks (v1 needed 11 g of cover for a 5 g target).
  // v3: each drizzle has its own rate (about 1.7 s to a medium target for every drizzle), and the
  // deposit is spread along the path between pointer samples, so scores don't depend on the
  // device's pointer/refresh rate.
  version: 'finish-v3-provisional',
  /** Drizzle deposition rate while held, mg per ms, by drizzle. */
  drizzleRateMgPerMs: { curd_swirl: 12, ghee_tadka: 3 } as Record<string, number>,
  /**
   * While the pointer stays still, the pending drizzle lands at least this often (ms). Longer than
   * any frame or pointer-event gap (a 20 fps phone is 50 ms), so a moving pour is always spread
   * along its path whatever the device's rate.
   */
  drizzleFlushMs: 100,
  /** Spacing (local units) of the points a moved drizzle is spread over. */
  drizzleSegmentStep: 0.12,
  /** Target drizzle in grams, by drizzle and vessel size. */
  drizzleTargetG: {
    curd_swirl: { small: 15, medium: 20, large: 25 },
    ghee_tadka: { small: 4, medium: 5, large: 6 },
  } as Record<string, Record<DishSize, number>>,
  /** Distribution grid laid over the vessel's circular top (local coordinates -1..1). */
  gridSize: 6,
  /**
   * A grid cell counts as covered when it holds at least this share of an even split of the
   * target across the cells inside the rim.
   */
  coveredCellShare: 0.56,
  /** Penalties (points out of 100). */
  penalty: {
    missingDrizzle: 30,
    wrongDrizzle: 25,
    unorderedDrizzle: 15,
    /** Per percent of distance between deposited and target grams, after a 10% tolerance. */
    drizzleAmountPerPct: 0.3,
    drizzleTolerancePct: 10,
    /** Scaled by (1 - coverage of the cells the vessel actually covers). */
    drizzleCoverage: 20,
    spillPerGram: 1.5,
    missingGarnishPiece: 6,
    extraGarnishPiece: 3,
    wrongGarnishType: 10,
    fallenGarnishPiece: 3,
    /** Scaled by how far the pieces' centre of mass sits from the centre (0 = centred). */
    garnishBalance: 12,
    outOfOrder: 8,
  },
} as const;

export const WAITING_V1 = {
  version: 'waiting-v1-provisional',
  /** Walking in from the door to the counter, and out again. */
  walkMs: 2_500,
  /** Time at the counter before the order is taken that costs nothing, then points lost per second. */
  lobbyGraceMs: 12_000,
  lobbyPointsPerSecond: 1,
  /** After the order is taken: free time grows with the prep the order needs. */
  ticketGraceBaseMs: 45_000,
  ticketPointsPerSecond: 0.6,
} as const;

/** PROVISIONAL: how the four station scores combine. Equal weights. Superseded by V2. */
export const AGGREGATION_V1 = {
  version: 'aggregation-v1-provisional',
  weights: { waiting: 1, build: 1, prep: 1, finish: 1 },
} as const;

/**
 * PROVISIONAL: equal weights, plus a content gate. Under V1 a straight-through empty
 * katori averaged 44 (waiting 100, prep and finish partial credit). Now the waiting, prep and
 * finish scores count in full only when the katori holds at least fullCreditShare of the ordered
 * food (the right foods, up to the ordered grams), and proportionally less below that. The build
 * score is never gated.
 */
export const AGGREGATION_V2 = {
  version: 'aggregation-v2-provisional',
  weights: { waiting: 1, build: 1, prep: 1, finish: 1 },
  fullCreditShare: 0.5,
} as const;

export const ECONOMY_V1 = {
  // v2: five stars and the great-service bonus need a complete order (the right vessel and foods,
  // and every ordered drizzle and garnish piece on the dish). In v1 a katori with no side, or no
  // garnish at all, still earned five stars and the bonus.
  // v3: "complete" also needs each food and the drizzle at completeShare of the ordered amount, so
  // a katori of half portions no longer counts (in v2 it earned five stars and the bonus).
  version: 'economy-v3',
  /** A food or drizzle counts as served once at least this share of the ordered amount is there. */
  completeShare: 0.8,
  /** Stars without a complete order are capped here. */
  incompleteStarCap: 4,
  /** Base tip in coins by vessel size, scaled by the overall score. */
  baseTip: { small: 4, medium: 6, large: 8 },
  /** Extra tip for an overall score at or above this. */
  greatScore: 90,
  greatBonus: 3,
  /** Rank points awarded per serve = round(total score / this). */
  pointsDivisor: 10,
} as const;

/** Superseded by DAY_V2 (kept for reference). */
export const DAY_V1 = {
  version: 'day-v1',
  firstArrivalMs: 1_500,
  /** Gap between arrivals, inclusive range. */
  arrivalGapMs: [22_000, 38_000] as const,
  /** Customers on day N: min(maxCustomers, base + floor((N - 1) / perExtraDays)). */
  baseCustomers: 3,
  perExtraDays: 2,
  maxCustomers: 7,
} as const;

/**
 * ADAPTATION: later days get busier, not only longer. The gap between arrivals shrinks by a
 * second (shortest) and two (longest) each day, down to 12-20 s, and up to 8 customers come. Under
 * v1 the gaps stayed 22-38 s, so the waiting score never came under pressure.
 */
export const DAY_V2 = {
  version: 'day-v2',
  firstArrivalMs: 1_500,
  /** Arrival gap on day 1, and how much each later day takes off, down to the floor. */
  arrivalGapMs: [22_000, 38_000] as const,
  gapShrinkPerDayMs: [1_000, 2_000] as const,
  gapFloorMs: [12_000, 20_000] as const,
  baseCustomers: 3,
  perExtraDays: 2,
  maxCustomers: 8,
} as const;

/** The inclusive range of gaps between arrivals on a given day (DAY_V2). */
export function arrivalGapRange(day: number): [number, number] {
  const d = Math.max(0, day - 1);
  return [
    Math.max(DAY_V2.gapFloorMs[0], DAY_V2.arrivalGapMs[0] - d * DAY_V2.gapShrinkPerDayMs[0]),
    Math.max(DAY_V2.gapFloorMs[1], DAY_V2.arrivalGapMs[1] - d * DAY_V2.gapShrinkPerDayMs[1]),
  ];
}
