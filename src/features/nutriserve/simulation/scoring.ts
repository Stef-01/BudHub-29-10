// Station grading. Four scores stay separate (waiting, build, prep, finish); nutrition is a
// separate report (../nutrition). Every rule is NutriServe's own and versioned in ./params.ts.
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { lookup } from './lookup.ts';
import {
  AGGREGATION_V2,
  BUILD_V1,
  ECONOMY_V1,
  FINISH_V1,
  PREP_V1,
  WAITING_V1,
  type DishSize,
} from './params.ts';
import type { UpgradeEffects } from './progression.ts';
import type { BuildComponent, Deposit, Dish, StationScores, Ticket, TicketOrder } from './types.ts';

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const grams = (mg: number | undefined) => (mg ?? 0) / 1000;

// --- Build ----------------------------------------------------------------------

export interface BuildGrade {
  score: number;
  /** Signed error in grams per component (negative = underfilled); null when the wrong food. */
  signedErrorG: Record<BuildComponent, number | null>;
  correct: { size: boolean; base: boolean; main: boolean; side: boolean };
}

/** Gauge fraction for a portion: 1/meterFullMultiple at its line, 1 at meterFullMultiple x the line. */
export function meterFraction(actualG: number, idealG: number): number {
  if (!(idealG > 0) || !Number.isFinite(actualG)) return 0;
  return Math.max(0, Math.min(1, actualG / (BUILD_V1.meterFullMultiple * idealG)));
}

/** How far from its line a portion may be and still count as exact (a share of the line). */
export function exactBand(component: BuildComponent, effects?: UpgradeEffects): number {
  return effects?.portionBand?.[component] ? BUILD_V1.toolExactBand : BUILD_V1.exactBand;
}

/**
 * Share of a food's credit (0..1) for a portion of the right food (build-v6). Within the exact band
 * of its line it is full credit. Past the band, a short portion loses shortSlope per portion's worth
 * missing, down to nothing (the food isn't there), and a generous one loses overSlope per extra
 * portion's worth, down to overFloor (the food is there, but too much of it).
 */
export function portionCredit(actualG: number, idealG: number, band: number): number {
  if (!(idealG > 0) || !Number.isFinite(actualG) || actualG <= 0) return 0;
  const ratio = actualG / idealG;
  if (ratio < 1 - band) return Math.max(0, 1 - (1 - band - ratio) * BUILD_V1.shortSlope);
  if (ratio > 1 + band) return Math.max(BUILD_V1.overFloor, 1 - (ratio - 1 - band) * BUILD_V1.overSlope);
  return 1;
}

/**
 * ADAPTATION gradeBuild (build-v6). Base, main and side are each worth a share of 100 points
 * (BUILD_V1.share), earned in full for the right food within the exact band of its line and in part
 * otherwise (portionCredit); the wrong food or no food earns none of its share. Serving in a
 * different vessel size than the ticket asked costs wrongVesselPenalty on top. Portions are always
 * measured against the ticket's lines.
 */
export function gradeBuild(dish: Dish, order: TicketOrder, effects?: UpgradeEffects): BuildGrade {
  const wanted = { base: order.baseId, main: order.mainId, side: order.sideId } as const;
  const correct = {
    size: dish.size === order.size,
    base: dish.build.base?.foodId === order.baseId,
    main: dish.build.main?.foodId === order.mainId,
    side: dish.build.side?.foodId === order.sideId,
  };
  let earned = 0;
  const signedErrorG = { base: null, main: null, side: null } as BuildGrade['signedErrorG'];
  for (const c of ['base', 'main', 'side'] as const) {
    const portion = dish.build[c];
    if (!portion || portion.foodId !== wanted[c]) continue;
    const actualG = grams(portion.mg);
    signedErrorG[c] = actualG - order.idealG[c];
    earned += BUILD_V1.share[c] * portionCredit(actualG, order.idealG[c], exactBand(c, effects));
  }
  const score = clampScore(earned - (correct.size ? 0 : BUILD_V1.wrongVesselPenalty));
  return { score, signedErrorG, correct };
}

// --- Prep ----------------------------------------------------------------------

/** Whole doneness units cooked so far (prep-v4: milliseconds on the flame at normal heat). */
export const prepUnits = (dish: Dish) => Math.floor((dish.prep?.milliUnits ?? 0) / 1000);

/** Doneness units as seconds on the flame at normal heat, to one decimal place (for display). */
export const prepSeconds = (units: number) => Math.round((units / PREP_V1.unitsPerSecond) * 10) / 10;

/** The doneness mark for a prep level. */
export function prepTargetUnits(level: TicketOrder['prepLevel']): number {
  return PREP_V1.targetUnits[level];
}

/** Units either side of the mark that count as perfect (wider with copper handis). */
export function prepBandUnits(effects?: UpgradeEffects): number {
  return effects?.prepBand ? PREP_V1.wideBandUnits : PREP_V1.perfectBandUnits;
}

/**
 * ADAPTATION gradePrep (prep-v3 rules, prep-v4 units). Within the perfect window around the level's mark: 100. Short of
 * the window, the dish earns its share of the way there (a dish taken out half way scores 50, a raw
 * one 0). Past the window it loses overPointsPerSecond for every second on the flame it stayed on.
 * A dish that never went into a handi scores 0.
 */
export function gradePrep(dish: Dish, order: TicketOrder, effects?: UpgradeEffects): number {
  if (!dish.prep || !Number.isFinite(dish.prep.milliUnits)) return 0;
  const units = prepUnits(dish);
  const target = prepTargetUnits(order.prepLevel);
  const band = prepBandUnits(effects);
  if (units < target - band) return clampScore((100 * units) / (target - band));
  if (units > target + band) return clampScore(100 - ((units - target - band) / PREP_V1.unitsPerSecond) * PREP_V1.overPointsPerSecond);
  return 100;
}

// --- Finish (PROVISIONAL) ------------------------------------------------------------

export interface FinishGrade {
  score: number;
  penalties: Array<{ reason: string; points: number }>;
}

/** Grid cells whose centre lies inside the vessel rim (the unit circle). */
const INSIDE_CELLS: number[] = (() => {
  const n = FINISH_V1.gridSize;
  const cells: number[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const cx = ((col + 0.5) / n) * 2 - 1;
      const cy = ((row + 0.5) / n) * 2 - 1;
      if (cx * cx + cy * cy <= 1) cells.push(row * n + col);
    }
  }
  return cells;
})();

/** Share of the inside cells holding at least coveredCellShare of an even split of the target. */
function coverage(deposit: Deposit, targetG: number): number {
  const minMg = ((targetG * 1000) / INSIDE_CELLS.length) * FINISH_V1.coveredCellShare;
  const covered = INSIDE_CELLS.filter((i) => deposit.cellsMg[i] >= minMg).length;
  return covered / INSIDE_CELLS.length;
}

/** Versioned target grams for a drizzle on a vessel size. */
export function drizzleTargetG(drizzleId: string, size: DishSize): number | undefined {
  return lookup(FINISH_V1.drizzleTargetG, drizzleId)?.[size];
}

export function gradeFinishV1(dish: Dish, order: TicketOrder): FinishGrade {
  const p = FINISH_V1.penalty;
  const penalties: FinishGrade['penalties'] = [];
  const add = (reason: string, points: number) => {
    if (points > 0.0001) penalties.push({ reason, points });
  };

  // Drizzle
  const ordered = order.finish.find((s) => s.kind === 'drizzle');
  const applied = Object.entries(dish.finish.drizzles);
  if (ordered) {
    const deposit = dish.finish.drizzles[ordered.id];
    const target = drizzleTargetG(ordered.id, order.size);
    const label = lookup(DRIZZLES, ordered.id)?.label ?? ordered.id;
    if (!deposit || deposit.insideMg + deposit.spilledMg === 0) add(`No ${label}`, p.missingDrizzle);
    else if (target) {
      const offPct = (Math.abs(grams(deposit.insideMg) - target) / target) * 100;
      const beyond = Math.max(0, offPct - p.drizzleTolerancePct);
      add(`Too ${grams(deposit.insideMg) > target ? 'much' : 'little'} ${label}`, Math.min(1, beyond / p.drizzleAmountSpanPct) * p.drizzleAmountMax);
      add(`${label} not spread evenly`, (1 - coverage(deposit, target)) * p.drizzleCoverage);
    }
  }
  for (const [id, deposit] of applied) {
    if (id === ordered?.id) continue;
    if (deposit.insideMg + deposit.spilledMg === 0) continue;
    add(`Unordered ${lookup(DRIZZLES, id)?.label ?? id}`, ordered ? p.wrongDrizzle : p.unorderedDrizzle);
  }
  const spilledG = applied.reduce((sum, [, d]) => sum + grams(d.spilledMg), 0);
  add('Spilled drizzle', spilledG * p.spillPerGram);

  // Garnishes
  const garnishSteps = order.finish.filter((s): s is Extract<typeof s, { kind: 'garnish' }> => s.kind === 'garnish');
  const onDish = dish.finish.garnishes.filter((g) => !g.fell);
  for (const step of garnishSteps) {
    const placed = onDish.filter((g) => g.id === step.id).length;
    const label = lookup(GARNISHES, step.id)?.label ?? step.id;
    const missing = Math.max(0, step.count - placed);
    const extra = Math.max(0, placed - step.count);
    add(`Missing ${missing} ${label}`, missing * p.missingGarnishPiece);
    add(`${extra} extra ${label}`, extra * p.extraGarnishPiece);
  }
  const wrongTypes = [...new Set(onDish.filter((g) => !garnishSteps.some((s) => s.id === g.id)).map((g) => g.id))];
  add(`Unordered ${wrongTypes.map((id) => lookup(GARNISHES, id)?.label ?? id).join(', ')}`, wrongTypes.length * p.wrongGarnishType);
  add('Garnish fell off', dish.finish.garnishes.filter((g) => g.fell).length * p.fallenGarnishPiece);
  if (onDish.length > 0) {
    const cx = onDish.reduce((s, g) => s + g.x, 0) / onDish.length;
    const cy = onDish.reduce((s, g) => s + g.y, 0) / onDish.length;
    add('Garnish balance', Math.min(1, Math.hypot(cx, cy)) * p.garnishBalance);
  }

  // Order of steps: compare the first time each ordered step was done.
  const wanted = order.finish.map((s) => `${s.kind}:${s.id}`);
  const doneOrder = dish.finish.steps.filter((s, i, all) => wanted.includes(s) && all.indexOf(s) === i);
  const expected = wanted.filter((s) => doneOrder.includes(s));
  if (doneOrder.join('|') !== expected.join('|')) add('Steps out of order', p.outOfOrder);

  const total = penalties.reduce((s, x) => s + x.points, 0);
  return { score: clampScore(100 - total), penalties };
}

// --- Waiting (PROVISIONAL) -------------------------------------------------------

export function gradeWaitingV1(ticket: Ticket, servedAtMs: number, effects?: UpgradeEffects): number {
  const extraGrace = effects?.waitingGraceMs ?? 0;
  const lobbyMs = Math.max(0, ticket.takenAtMs - ticket.atCounterMs - WAITING_V1.lobbyGraceMs - extraGrace - (effects?.lobbyGraceMs ?? 0));
  const prepMs = (prepTargetUnits(ticket.order.prepLevel) / PREP_V1.unitsPerSecond) * 1000;
  const ticketMs = Math.max(0, servedAtMs - ticket.takenAtMs - WAITING_V1.ticketGraceBaseMs - prepMs - extraGrace - (effects?.ticketGraceMs ?? 0));
  return clampScore(
    100 - (lobbyMs / 1000) * WAITING_V1.lobbyPointsPerSecond - (ticketMs / 1000) * WAITING_V1.ticketPointsPerSecond
  );
}

// --- Totals & rewards ------------------------------------------------------------

/**
 * Share (0-1) of the ordered food that is in the katori: for each component, the grams of the
 * ordered food up to the ordered grams, over the ordered total. A wrong food counts as none.
 */
export function contentShare(dish: Dish, order: TicketOrder): number {
  const ordered = { base: order.baseId, main: order.mainId, side: order.sideId } as const;
  let have = 0;
  let want = 0;
  for (const c of ['base', 'main', 'side'] as const) {
    const ideal = order.idealG[c];
    want += ideal;
    const portion = dish.build[c];
    if (portion && portion.foodId === ordered[c]) have += Math.min(ideal, portion.mg / 1000);
  }
  return want > 0 ? Math.round((have / want) * 100) / 100 : 0;
}

/** Equal-weight mean with the AGGREGATION_V2 content gate on waiting, prep and finish. */
export function aggregateV2(scores: Omit<StationScores, 'total'>, share: number): number {
  const w = AGGREGATION_V2.weights;
  const gate = Math.max(0, Math.min(1, share / AGGREGATION_V2.fullCreditShare));
  const sum = w.waiting + w.build + w.prep + w.finish;
  return clampScore(
    (scores.waiting * w.waiting * gate + scores.build * w.build + scores.prep * w.prep * gate + scores.finish * w.finish * gate) / sum
  );
}

/**
 * Everything the ticket asked for is on the dish (economy-v3): the right vessel and three foods,
 * each at least completeShare of its ordered grams; at least completeShare of the ordered drizzle
 * landed; and at least the ordered number of each garnish stayed on.
 */
export function orderComplete(dish: Dish, order: TicketOrder): boolean {
  if (!dishMatchesOrder(dish, order)) return false;
  const enough = ECONOMY_V1.completeShare;
  if ((['base', 'main', 'side'] as const).some((c) => (dish.build[c]?.mg ?? 0) / 1000 < order.idealG[c] * enough)) return false;
  return order.finish.every((step) =>
    step.kind === 'drizzle'
      ? (dish.finish.drizzles[step.id]?.insideMg ?? 0) / 1000 >= (drizzleTargetG(step.id, order.size) ?? 0) * enough
      : dish.finish.garnishes.filter((g) => g.id === step.id && !g.fell).length >= step.count
  );
}

/** economy-v3: the great bonus and five stars need a complete order. */
export function rewardsV2(total: number, size: DishSize, complete: boolean): { tip: number; points: number; stars: number } {
  const great = complete && total >= ECONOMY_V1.greatScore;
  const tip = Math.round((ECONOMY_V1.baseTip[size] * total) / 100) + (great ? ECONOMY_V1.greatBonus : 0);
  const stars = Math.max(0, Math.min(complete ? 5 : ECONOMY_V1.incompleteStarCap, Math.round(total / 20)));
  return { tip, points: Math.round(total / ECONOMY_V1.pointsDivisor), stars };
}

/** Short plain-language reasons for a serve's scores, most important first (shown to the player). */
export function serveNotes(
  dish: Dish,
  order: TicketOrder,
  scores: Omit<StationScores, 'total'>,
  share: number,
  finishPenalties: FinishGrade['penalties'],
  waitedMs: number,
  effects?: UpgradeEffects
): string[] {
  const notes: string[] = [];
  if (share < AGGREGATION_V2.fullCreditShare) {
    notes.push(`Only ${Math.round(share * 100)}% of the ordered food is in the katori, so waiting, prep and finish counted less`);
  }
  const wanted = { base: order.baseId, main: order.mainId, side: order.sideId } as const;
  if (dish.size !== order.size) notes.push(`${dish.size[0].toUpperCase()}${dish.size.slice(1)} vessel; the ticket wanted ${order.size}`);
  for (const c of ['base', 'main', 'side'] as const) {
    const portion = dish.build[c];
    const label = `${c[0].toUpperCase()}${c.slice(1)}`;
    if (!portion || portion.mg === 0) notes.push(`No ${c}`);
    else if (portion.foodId !== wanted[c]) notes.push(`${label}: wrong food`);
    else {
      // Every portion outside its exact band costs points (build-v6), so every one gets a note.
      const actualG = portion.mg / 1000;
      if (portionCredit(actualG, order.idealG[c], exactBand(c, effects)) < 1) {
        const error = actualG - order.idealG[c];
        notes.push(`${label} ${error > 0 ? '+' : '−'}${Math.max(1, Math.round(Math.abs(error)))} g (line ${order.idealG[c]} g)`);
      }
    }
  }
  // Every station score below 100 gets at least one note, so "No points lost" is never shown when
  // points were lost.
  if (scores.prep < 100) {
    const cooked = prepSeconds(prepUnits(dish));
    const mark = prepSeconds(prepTargetUnits(order.prepLevel));
    notes.push(
      !dish.prep
        ? 'Not cooked'
        : prepUnits(dish) < prepTargetUnits(order.prepLevel)
          ? `Undercooked: ${cooked} s on the flame; the mark is ${mark} s`
          : `Overcooked: ${cooked} s on the flame; the mark is ${mark} s`
    );
  }
  // Finish penalties largest first, the top three. Ones under half a point are listed only when
  // nothing larger explains a lost point.
  if (scores.finish < 100) {
    const sorted = [...finishPenalties].sort((a, b) => b.points - a.points);
    const shown = sorted.filter((p) => p.points >= 0.5).slice(0, 3);
    for (const p of shown.length ? shown : sorted.slice(0, 1)) notes.push(`${p.reason} (−${p.points >= 0.5 ? Math.round(p.points) : '<1'})`);
  }
  if (scores.waiting < 100) notes.push(`Waited ${Math.round(waitedMs / 1000)} s`);
  return notes;
}

export function rewardsV1(total: number, size: DishSize): { tip: number; points: number; stars: number } {
  const tip = Math.round((ECONOMY_V1.baseTip[size] * total) / 100) + (total >= ECONOMY_V1.greatScore ? ECONOMY_V1.greatBonus : 0);
  return {
    tip,
    points: Math.round(total / ECONOMY_V1.pointsDivisor),
    stars: Math.max(0, Math.min(5, Math.round(total / 20))),
  };
}

/** Does the dish's build match the ticket's order (size and the three foods)? */
export function dishMatchesOrder(dish: Dish, order: TicketOrder): boolean {
  return (
    dish.size === order.size &&
    dish.build.base?.foodId === order.baseId &&
    dish.build.main?.foodId === order.mainId &&
    dish.build.side?.foodId === order.sideId
  );
}
