// C06 canonical nutrition adapter for the NutriServe remaster.
//
// - Totals come only from canonical per-100g data multiplied by the ACTUAL grams in the dish:
//   portions poured at Build, drizzle that landed inside the vessel, and garnish pieces that stayed
//   on. Spilled drizzle and fallen garnish are recorded but not eaten, so not counted.
// - Each physical portion is counted once. Drawing layers, prep, or re-rendering never adds food.
// - Nutrition is an educational report kept separate from the four service scores.
// - Meal goals reuse the legacy NutriServe rules (services/nutriserveUtils.ts) so both games agree.
//   They are general guidance for a game, not medical advice.
// - The player doesn't choose the foods; the customer does. So the service report separates what
//   the player changed (portions off the ticket, wrong foods, drizzle, spills) from how the order
//   itself fits the customer's meal goal. A perfectly served order is never blamed on the player.
//   (The legacy goals are full-plate targets: few three-part katoris meet all of them.)
import { CATALOG_CUSTOMERS, CATALOG_FOODS } from '../data/catalog.generated.ts';
import type { CatalogCustomer, CatalogOrder, NutrientsPer100g } from '../data/catalogTypes.ts';
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import type { Dish, TicketOrder } from '../simulation/types.ts';
import { lookup } from '../simulation/lookup.ts';
import { FINISH_V1 } from '../simulation/params.ts';

export type Nutrients = NutrientsPer100g;
export const NUTRIENT_KEYS: Array<keyof Nutrients> = ['calories_kcal', 'protein_g', 'carbs_g', 'fiber_g', 'fat_g', 'sodium_mg'];

const FOODS = new Map(CATALOG_FOODS.map((f) => [f.id, f]));

export interface NutritionLine {
  source: 'base' | 'main' | 'side' | 'drizzle' | 'garnish';
  id: string;
  label: string;
  grams: number;
  nutrients: Nutrients;
}

export interface DishNutrition {
  lines: NutritionLine[];
  totals: Nutrients;
  /** Food that left the dish and is therefore not counted. */
  notEaten: { spilledDrizzleG: number; fallenGarnishPieces: number; fallenGarnishG: number };
  /** Ids in the dish that have no canonical nutrition (should be empty). */
  unknownIds: string[];
}

const zero = (): Nutrients => ({ calories_kcal: 0, protein_g: 0, carbs_g: 0, fiber_g: 0, fat_g: 0, sodium_mg: 0 });

function scaled(per100g: Nutrients, grams: number): Nutrients {
  const out = zero();
  for (const key of NUTRIENT_KEYS) out[key] = (per100g[key] * grams) / 100;
  return out;
}

function addInto(total: Nutrients, part: Nutrients): void {
  for (const key of NUTRIENT_KEYS) total[key] += part[key];
}

export function dishNutrition(dish: Dish): DishNutrition {
  const lines: NutritionLine[] = [];
  const unknownIds: string[] = [];

  for (const source of ['base', 'main', 'side'] as const) {
    const portion = dish.build[source];
    if (!portion || portion.mg === 0) continue;
    const food = FOODS.get(portion.foodId);
    if (!food) {
      unknownIds.push(portion.foodId);
      continue;
    }
    const grams = portion.mg / 1000;
    lines.push({ source, id: food.id, label: food.label, grams, nutrients: scaled(food.nutrients_per_100g, grams) });
  }

  let spilledDrizzleG = 0;
  for (const [id, deposit] of Object.entries(dish.finish.drizzles)) {
    spilledDrizzleG += deposit.spilledMg / 1000;
    if (deposit.insideMg === 0) continue;
    const def = lookup(DRIZZLES, id);
    if (!def) {
      unknownIds.push(id);
      continue;
    }
    const grams = deposit.insideMg / 1000;
    lines.push({ source: 'drizzle', id, label: def.label, grams, nutrients: scaled(def.nutrients_per_100g, grams) });
  }

  let fallenGarnishPieces = 0;
  let fallenGarnishG = 0;
  const kept = new Map<string, number>();
  for (const piece of dish.finish.garnishes) {
    const def = lookup(GARNISHES, piece.id);
    if (!def) {
      unknownIds.push(piece.id);
      continue;
    }
    if (piece.fell) {
      fallenGarnishPieces++;
      fallenGarnishG += def.pieceG;
    } else kept.set(piece.id, (kept.get(piece.id) ?? 0) + 1);
  }
  for (const [id, count] of kept) {
    const def = lookup(GARNISHES, id)!;
    const grams = def.pieceG * count;
    lines.push({ source: 'garnish', id, label: `${def.label} ×${count}`, grams, nutrients: scaled(def.nutrients_per_100g, grams) });
  }

  const totals = zero();
  lines.forEach((line) => addInto(totals, line.nutrients));
  return { lines, totals, notEaten: { spilledDrizzleG, fallenGarnishPieces, fallenGarnishG }, unknownIds: [...new Set(unknownIds)] };
}

// --- Meal goals (legacy NutriServe rules) -------------------------------------------

export type Goal = { min: number; max: number; target: number } | { min: number } | { max: number };
export type MealGoals = Record<keyof Nutrients, Goal>;

/** Same thresholds as generateCustomerWithTargets() in services/nutriserveUtils.ts. */
export function mealGoals(order: Pick<CatalogOrder, 'plateSize' | 'diabetesMode'>): MealGoals {
  const calories = {
    Light: { min: 300, max: 450, target: 375 },
    Regular: { min: 450, max: 650, target: 550 },
    Hearty: { min: 650, max: 850, target: 750 },
  }[order.plateSize];
  const t = calories.target;
  const macros = {
    'Low-Carb': { protein: 0.075, carbs: 0.0625, fat: 0.05 },
    Balanced: { protein: 0.05, carbs: 0.1125, fat: 0.038 },
    None: { protein: 0.0375, carbs: 0.125, fat: 0.038 },
  }[order.diabetesMode];
  return {
    calories_kcal: calories,
    protein_g: { min: t * macros.protein },
    carbs_g: { max: t * macros.carbs },
    fat_g: { max: t * macros.fat },
    fiber_g: { min: 8 },
    sodium_mg: { max: 800 },
  };
}

export type GoalStatus = 'low' | 'good' | 'high';

export function goalStatus(value: number, goal: Goal): GoalStatus {
  if ('min' in goal && value < goal.min) return 'low';
  if ('max' in goal && value > goal.max) return 'high';
  return 'good';
}

export interface NutritionFeedback {
  statuses: Record<keyof Nutrients, GoalStatus>;
  /** Plain-language notes, most important first. */
  notes: string[];
  disclaimer: string;
}

const LABEL: Record<keyof Nutrients, string> = {
  calories_kcal: 'Energy',
  protein_g: 'Protein',
  carbs_g: 'Carbs',
  fiber_g: 'Fiber',
  fat_g: 'Fat',
  sodium_mg: 'Sodium',
};

export function nutritionFeedback(totals: Nutrients, order: Pick<CatalogOrder, 'plateSize' | 'diabetesMode'>): NutritionFeedback {
  const goals = mealGoals(order);
  const statuses = {} as Record<keyof Nutrients, GoalStatus>;
  const notes: string[] = [];
  for (const key of NUTRIENT_KEYS) {
    statuses[key] = goalStatus(totals[key], goals[key]);
    if (statuses[key] === 'good') continue;
    const unit = key === 'calories_kcal' ? 'kcal' : key === 'sodium_mg' ? 'mg' : 'g';
    const value = Math.round(totals[key]);
    const goal = goals[key];
    const bound = statuses[key] === 'low' ? ('min' in goal ? goal.min : 0) : 'max' in goal ? goal.max : 0;
    notes.push(`${LABEL[key]} ${value} ${unit} is ${statuses[key] === 'low' ? 'below' : 'above'} the ${Math.round(bound)} ${unit} goal for this plate.`);
  }
  if (notes.length === 0) notes.push('Every nutrient is within this plate\'s goals.');
  return {
    statuses,
    notes,
    disclaimer: 'Game guidance from general meal goals, not medical advice.',
  };
}

// --- Catalog validation ------------------------------------------------------------

export interface CatalogValidation {
  /** Required item ids that are not in the food catalog, with the customers that use them. */
  missingRequiredItems: Array<{ customerId: string; itemId: string }>;
  /** Volume-measured foods without a density (their grams can't be computed). */
  volumeWithoutDensity: string[];
  /** Foods with neither volume nor portion options. */
  withoutServings: string[];
}

export function validateCatalog(
  customers: readonly CatalogCustomer[] = CATALOG_CUSTOMERS,
  foods = CATALOG_FOODS
): CatalogValidation {
  const ids = new Set(foods.map((f) => f.id));
  const missingRequiredItems: CatalogValidation['missingRequiredItems'] = [];
  for (const customer of customers) {
    for (const order of [customer.order, ...(customer.orderVariations ?? [])]) {
      for (const itemId of order?.required_items ?? []) {
        if (!ids.has(itemId)) missingRequiredItems.push({ customerId: customer.id, itemId });
      }
    }
  }
  return {
    missingRequiredItems,
    volumeWithoutDensity: foods.filter((f) => f.volume_options_ml?.length && !f.density_g_per_ml).map((f) => f.id),
    withoutServings: foods.filter((f) => !f.volume_options_ml?.length && !f.portion_g?.length).map((f) => f.id),
  };
}

// --- Service report: the player's changes vs the order, and the order vs the goal ----------------

/** The katori exactly as the ticket ordered it: ideal grams, the ordered drizzle on target, every garnish piece on. */
export function orderedDish(order: TicketOrder): Dish {
  const dish: Dish = {
    id: 'ordered',
    size: order.size,
    stage: 'ready',
    createdAtMs: 0,
    build: {
      base: { foodId: order.baseId, mg: Math.round(order.idealG.base * 1000) },
      main: { foodId: order.mainId, mg: Math.round(order.idealG.main * 1000) },
      side: { foodId: order.sideId, mg: Math.round(order.idealG.side * 1000) },
    },
    finish: { drizzles: {}, garnishes: [], steps: [] },
  };
  for (const step of order.finish) {
    if (step.kind === 'drizzle') {
      const targetG = lookup(FINISH_V1.drizzleTargetG, step.id)?.[order.size] ?? 0;
      dish.finish.drizzles[step.id] = { cellsMg: [], insideMg: Math.round(targetG * 1000), spilledMg: 0 };
    } else {
      for (let i = 0; i < step.count; i++) dish.finish.garnishes.push({ id: step.id, x: 0, y: 0, fell: false });
    }
  }
  return dish;
}

export interface ServiceNutritionReport {
  /** What the customer actually ate. */
  served: DishNutrition;
  /** What the order would have provided if served exactly. */
  ordered: Nutrients;
  /** Plain-language differences the player made, largest energy effect first; empty = matched the ticket. */
  changes: string[];
  /** How the order itself sits against the customer's meal goal (the customer's choice, not the player's). */
  orderFit: NutritionFeedback;
}

const signed = (n: number, unit: string) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(Math.round(n))} ${unit}`;
/** ": +12 kcal", or nothing when the effect rounds to zero (a garnish or a dab of drizzle). */
const kcalSuffix = (kcal: number) => (Math.round(kcal) === 0 ? '' : `: ${signed(kcal, 'kcal')}`);

export function serviceNutritionReport(dish: Dish, order: TicketOrder, goalsFor: Pick<CatalogOrder, 'plateSize' | 'diabetesMode'>): ServiceNutritionReport {
  const served = dishNutrition(dish);
  const ordered = dishNutrition(orderedDish(order)).totals;
  const changes: Array<{ text: string; kcal: number }> = [];
  const foodLabel = (id: string) => FOODS.get(id)?.label ?? id;
  const kcalOf = (id: string, grams: number) => ((FOODS.get(id)?.nutrients_per_100g.calories_kcal ?? 0) * grams) / 100;
  const wanted = { base: order.baseId, main: order.mainId, side: order.sideId } as const;

  for (const c of ['base', 'main', 'side'] as const) {
    const idealG = order.idealG[c];
    const portion = dish.build[c];
    const gotG = portion ? portion.mg / 1000 : 0;
    if (!portion || gotG === 0) {
      const kcal = -kcalOf(wanted[c], idealG);
      changes.push({ text: `No ${foodLabel(wanted[c])} (${c})${kcalSuffix(kcal)}`, kcal });
    } else if (portion.foodId !== wanted[c]) {
      const kcal = kcalOf(portion.foodId, gotG) - kcalOf(wanted[c], idealG);
      changes.push({ text: `${foodLabel(portion.foodId)} instead of ${foodLabel(wanted[c])}${kcalSuffix(kcal)}`, kcal });
    } else {
      const deltaG = gotG - idealG;
      if (Math.abs(deltaG) >= Math.max(5, idealG * 0.05)) {
        const kcal = kcalOf(wanted[c], deltaG);
        changes.push({ text: `${Math.round(Math.abs(deltaG))} g ${deltaG > 0 ? 'more' : 'less'} ${foodLabel(wanted[c])} than ordered${kcalSuffix(kcal)}`, kcal });
      }
    }
  }

  const drizzleKcal = (id: string, grams: number) => ((lookup(DRIZZLES, id)?.nutrients_per_100g.calories_kcal ?? 0) * grams) / 100;
  const orderedDrizzle = order.finish.find((s) => s.kind === 'drizzle')?.id;
  for (const [id, deposit] of Object.entries(dish.finish.drizzles)) {
    const landedG = deposit.insideMg / 1000;
    const label = lookup(DRIZZLES, id)?.label ?? id;
    if (id !== orderedDrizzle) {
      if (landedG > 0) changes.push({ text: `Unordered ${label}${kcalSuffix(drizzleKcal(id, landedG))}`, kcal: drizzleKcal(id, landedG) });
      continue;
    }
    const targetG = lookup(FINISH_V1.drizzleTargetG, id)?.[order.size] ?? 0;
    const deltaG = landedG - targetG;
    if (Math.abs(deltaG) >= Math.max(1, targetG * 0.2)) {
      changes.push({ text: `${Math.round(Math.abs(deltaG))} g ${deltaG > 0 ? 'more' : 'less'} ${label} than ordered${kcalSuffix(drizzleKcal(id, deltaG))}`, kcal: drizzleKcal(id, deltaG) });
    }
  }
  if (orderedDrizzle && !dish.finish.drizzles[orderedDrizzle]) {
    const targetG = lookup(FINISH_V1.drizzleTargetG, orderedDrizzle)?.[order.size] ?? 0;
    const kcal = -drizzleKcal(orderedDrizzle, targetG);
    changes.push({ text: `No ${lookup(DRIZZLES, orderedDrizzle)?.label ?? orderedDrizzle}${kcalSuffix(kcal)}`, kcal });
  }
  // Garnish pieces that stayed on, against what was ordered (counts, and kcal for completeness).
  const kept = new Map<string, number>();
  for (const piece of dish.finish.garnishes) if (!piece.fell) kept.set(piece.id, (kept.get(piece.id) ?? 0) + 1);
  const garnishKcal = (id: string, pieces: number) => {
    const def = lookup(GARNISHES, id);
    return def ? (def.nutrients_per_100g.calories_kcal * def.pieceG * pieces) / 100 : 0;
  };
  const orderedGarnish = new Map(order.finish.filter((f) => f.kind === 'garnish').map((f) => [f.id, (f as { count: number }).count]));
  for (const id of new Set([...orderedGarnish.keys(), ...kept.keys()])) {
    const want = orderedGarnish.get(id) ?? 0;
    const got = kept.get(id) ?? 0;
    if (got === want) continue;
    const label = lookup(GARNISHES, id)?.label ?? id;
    const kcal = garnishKcal(id, got - want);
    const text =
      want === 0
        ? `${got} unordered ${label}${kcalSuffix(kcal)}`
        : got === 0
          ? `No ${label} (${want} ordered)`
          : `${Math.abs(got - want)} ${got > want ? 'more' : 'fewer'} ${label} than ordered`;
    changes.push({ text, kcal });
  }

  if (served.notEaten.spilledDrizzleG >= 0.5 || served.notEaten.fallenGarnishPieces > 0) {
    changes.push({
      text: `Not eaten: ${served.notEaten.spilledDrizzleG.toFixed(1)} g spilled drizzle, ${served.notEaten.fallenGarnishPieces} fallen garnish`,
      kcal: 0,
    });
  }

  changes.sort((a, b) => Math.abs(b.kcal) - Math.abs(a.kcal));
  return { served, ordered, changes: changes.map((c) => c.text), orderFit: nutritionFeedback(ordered, goalsFor) };
}
