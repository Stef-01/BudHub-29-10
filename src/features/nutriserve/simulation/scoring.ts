// Station grading. Four scores stay separate (waiting, build, prep, finish); nutrition is a
// separate report (../nutrition). Build and Prep wrap the unchanged recovered reference functions
// through named Indian-food adapters; finish and waiting are provisional and versioned.
import { gradeReferenceBuild, gradeReferenceMix, MIX_TARGETS } from '../domain/referenceScoring.ts';
import { DRIZZLES } from '../data/finishItems.ts';
import {
  AGGREGATION_V1,
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

/** Meter fraction for a main/side portion: 0.5 at the ideal, 1 at meterFullMultiple x ideal. */
export function meterFraction(actualG: number, idealG: number): number {
  return Math.max(0, Math.min(1, actualG / (BUILD_V1.meterFullMultiple * idealG)));
}

/**
 * ADAPTATION gradeIndianBuildV1. Maps the dish onto the reference's three categories:
 * cup = vessel size + base fill, mixable = main portion meter, syrup = side portion meter.
 * The reference function is called unchanged; a wrong base food (with the right vessel) costs
 * BUILD_V1.baseMismatchPenalty on top.
 */
export function gradeIndianBuildV1(dish: Dish, order: TicketOrder, effects?: UpgradeEffects): BuildGrade {
  const base = dish.build.base;
  const main = dish.build.main;
  const side = dish.build.side;
  const correct = {
    size: dish.size === order.size,
    base: base?.foodId === order.baseId,
    main: main?.foodId === order.mainId,
    side: side?.foodId === order.sideId,
  };
  const furniture = effects?.buildFurniture ?? { cup: false, mixable: false, syrup: false };
  const reference = gradeReferenceBuild({
    cup: { correct: correct.size, actualFill: grams(base?.mg), idealFill: order.idealG.base, furnitureBonus: furniture.cup },
    mixable: { correct: correct.main, meterFraction: meterFraction(grams(main?.mg), order.idealG.main), furnitureBonus: furniture.mixable },
    syrup: { correct: correct.side, meterFraction: meterFraction(grams(side?.mg), order.idealG.side), furnitureBonus: furniture.syrup },
  });
  const score = correct.size && !correct.base ? Math.max(0, reference - BUILD_V1.baseMismatchPenalty) : reference;
  return {
    score,
    signedErrorG: {
      base: correct.base ? grams(base?.mg) - order.idealG.base : null,
      main: correct.main ? grams(main?.mg) - order.idealG.main : null,
      side: correct.side ? grams(side?.mg) - order.idealG.side : null,
    },
    correct,
  };
}

// --- Prep ----------------------------------------------------------------------

/** Whole reference units cooked so far. */
export const prepUnits = (dish: Dish) => Math.floor((dish.prep?.milliUnits ?? 0) / 1000);

/** Target units for an Indian prep level (via its mapped reference blend). */
export function prepTargetUnits(level: TicketOrder['prepLevel']): number {
  return MIX_TARGETS[PREP_V1.referenceBlendFor[level]];
}

/** ADAPTATION gradeIndianPrepV1: the unchanged reference mix score on this dish's units. */
export function gradeIndianPrepV1(dish: Dish, order: TicketOrder, effects?: UpgradeEffects): number {
  if (!dish.prep) return 0;
  return gradeReferenceMix(prepUnits(dish), PREP_V1.referenceBlendFor[order.prepLevel], effects?.prepFurniture ?? false);
}

// --- Finish (PROVISIONAL, Q09 open) ------------------------------------------------

export interface FinishGrade {
  score: number;
  penalties: Array<{ reason: string; points: number }>;
}

function coverage(deposit: Deposit): number {
  // Only cells whose centre lies inside the unit circle can be covered.
  const n = FINISH_V1.gridSize;
  let inside = 0;
  let covered = 0;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const cx = ((col + 0.5) / n) * 2 - 1;
      const cy = ((row + 0.5) / n) * 2 - 1;
      if (cx * cx + cy * cy > 1) continue;
      inside++;
      if (deposit.cellsMg[row * n + col] >= FINISH_V1.coveredCellMinG * 1000) covered++;
    }
  }
  return inside === 0 ? 0 : covered / inside;
}

export function gradeFinishV1(dish: Dish, order: TicketOrder, effects?: UpgradeEffects): FinishGrade {
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
    if (!deposit || deposit.insideMg + deposit.spilledMg === 0) add(`No ${DRIZZLES[ordered.id]?.label ?? ordered.id}`, p.missingDrizzle);
    else {
      const target = DRIZZLES[ordered.id].targetG[order.size];
      const offPct = Math.abs(grams(deposit.insideMg) - target) / target * 100;
      add('Drizzle amount', Math.max(0, offPct - p.drizzleTolerancePct) * p.drizzleAmountPerPct);
      add('Drizzle spread', (1 - coverage(deposit)) * p.drizzleCoverage);
    }
  }
  for (const [id, deposit] of applied) {
    if (id === ordered?.id) continue;
    if (deposit.insideMg + deposit.spilledMg === 0) continue;
    add(`Unordered ${DRIZZLES[id]?.label ?? id}`, ordered ? p.wrongDrizzle : p.unorderedDrizzle);
  }
  const spilledG = applied.reduce((sum, [, d]) => sum + grams(d.spilledMg), 0);
  add('Spilled drizzle', spilledG * p.spillPerGram);

  // Garnishes
  const garnishSteps = order.finish.filter((s): s is Extract<typeof s, { kind: 'garnish' }> => s.kind === 'garnish');
  const onDish = dish.finish.garnishes.filter((g) => !g.fell);
  for (const step of garnishSteps) {
    const placed = onDish.filter((g) => g.id === step.id).length;
    add(`Missing ${step.id}`, Math.max(0, step.count - placed) * p.missingGarnishPiece);
    add(`Extra ${step.id}`, Math.max(0, placed - step.count) * p.extraGarnishPiece);
  }
  const wrongTypes = new Set(onDish.filter((g) => !garnishSteps.some((s) => s.id === g.id)).map((g) => g.id));
  add('Unordered garnish', wrongTypes.size * p.wrongGarnishType);
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
  return { score: Math.min(100, clampScore(100 - total) + (effects?.finishBonus ?? 0)), penalties };
}

// --- Waiting (PROVISIONAL) -------------------------------------------------------

export function gradeWaitingV1(ticket: Ticket, servedAtMs: number, effects?: UpgradeEffects): number {
  const extraGrace = effects?.waitingGraceMs ?? 0;
  const lobbyMs = Math.max(0, ticket.takenAtMs - ticket.atCounterMs - WAITING_V1.lobbyGraceMs - extraGrace);
  const prepMs = (prepTargetUnits(ticket.order.prepLevel) / PREP_V1.unitsPerSecond) * 1000;
  const ticketMs = Math.max(0, servedAtMs - ticket.takenAtMs - WAITING_V1.ticketGraceBaseMs - prepMs - extraGrace);
  return clampScore(
    100 - (lobbyMs / 1000) * WAITING_V1.lobbyPointsPerSecond - (ticketMs / 1000) * WAITING_V1.ticketPointsPerSecond
  );
}

// --- Totals & rewards ------------------------------------------------------------

export function aggregateV1(scores: Omit<StationScores, 'total'>): number {
  const w = AGGREGATION_V1.weights;
  const sum = w.waiting + w.build + w.prep + w.finish;
  return clampScore((scores.waiting * w.waiting + scores.build * w.build + scores.prep * w.prep + scores.finish * w.finish) / sum);
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
