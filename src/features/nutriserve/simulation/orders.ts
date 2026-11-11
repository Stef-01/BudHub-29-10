// ORDERS_V1 (ADAPTATION): turn a catalog customer into a concrete NutriServe ticket.
// Deterministic given the RNG state. The catalog's required item fixes one component; the rest
// follow the customer's plate size and blood-sugar mode.
import type { CatalogCustomer, CatalogOrder } from '../data/catalogTypes.ts';
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { customerOrders, requireFood, servingGrams, SIZE_INDEX } from './catalog.ts';
import { SIZE_FOR_PLATE, type PrepLevel } from './params.ts';
import type { Rng } from './rng.ts';
import type { FinishStep, TicketOrder } from './types.ts';

export const ORDERS_VERSION = 'orders-v1';

const BASE_CATEGORIES = new Set(['Grains', 'Breads & Breakfast']);
const BREAKFAST_BASES = new Set(['idli_plain', 'dosa_plain', 'masala_dosa', 'upma', 'poha']);
const SIDE_POOL = ['raita', 'sprouts_salad', 'okra_pachadi', 'moru_curry_pulissery'];
const LOW_SODIUM_SIDES = ['sprouts_salad', 'raita'];
const MAIN_POOL = ['chana_masala', 'palak_dal', 'masoor_dal', 'moong_dal_tadka', 'rajma_masala', 'mixed_veg_curry', 'sambar'];
const PREP_LEVELS: PrepLevel[] = ['quick', 'regular', 'slow'];

/** Structured conditions first; descriptions are a documented fallback for older catalog entries. */
export function wantsLowSodium(order: CatalogOrder): boolean {
  const conditions = order.healthConditions ?? [];
  return conditions.includes('hypertension') || /sodium|blood pressure/i.test(order.description);
}

function pickBase(order: CatalogOrder, rng: Rng): string {
  if (order.diabetesMode === 'Low-Carb') return rng.pick(['rice_brown', 'rice_red']);
  if (order.diabetesMode === 'Balanced') return rng.weighted(['rice_brown', 'rice_red', 'rice_white'], [2, 2, 1]);
  return rng.weighted(['rice_white', 'rice_brown'], [2, 1]);
}

function unlocked<T extends { unlockRank: number }>(table: Record<string, T>, rank: number): T[] {
  return Object.values(table).filter((item) => item.unlockRank <= rank);
}

export function generateOrder(customer: CatalogCustomer, rng: Rng, rank: number): TicketOrder {
  const catalogOrder = rng.pick(customerOrders(customer));
  const size = SIZE_FOR_PLATE[catalogOrder.plateSize];
  const sizeIndex = SIZE_INDEX[size];

  let baseId: string | undefined;
  let mainId: string | undefined;
  for (const id of catalogOrder.required_items) {
    const food = requireFood(id);
    if (BASE_CATEGORIES.has(food.category) && !baseId) baseId = id;
    else if (!mainId) mainId = id;
  }
  baseId ??= pickBase(catalogOrder, rng);
  mainId ??= BREAKFAST_BASES.has(baseId) ? 'sambar' : rng.pick(MAIN_POOL);

  const sidePool = (wantsLowSodium(catalogOrder) ? LOW_SODIUM_SIDES : SIDE_POOL).filter((id) => id !== mainId);
  const sideId = rng.pick(sidePool);

  // ADAPTATION: low-carb orders get a grain portion one size smaller than the vessel.
  const baseIndex = catalogOrder.diabetesMode === 'Low-Carb' ? Math.max(0, sizeIndex - 1) : sizeIndex;
  const idealG = {
    base: servingGrams(requireFood(baseId), baseIndex),
    main: servingGrams(requireFood(mainId), sizeIndex),
    side: servingGrams(requireFood(sideId), Math.max(0, sizeIndex - 1)),
  };

  const finish: FinishStep[] = [];
  const drizzles = unlocked(DRIZZLES, rank);
  if (drizzles.length > 0 && rng.next() < 0.7) finish.push({ kind: 'drizzle', id: rng.pick(drizzles).id });
  const garnishes = unlocked(GARNISHES, rank).map((g) => g.id);
  const garnishTypes = rank >= 3 && garnishes.length > 1 ? rng.int(1, 2) : 1;
  const chosen: string[] = [];
  while (chosen.length < garnishTypes) {
    const id = rng.pick(garnishes);
    if (!chosen.includes(id)) chosen.push(id);
  }
  for (const id of chosen) finish.push({ kind: 'garnish', id, count: id === 'coriander' ? rng.int(3, 5) : rng.int(2, 3) });

  return { size, baseId, mainId, sideId, idealG, prepLevel: rng.pick(PREP_LEVELS), finish };
}
