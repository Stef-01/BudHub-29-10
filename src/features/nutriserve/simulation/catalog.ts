// Read-only access to the canonical NutriServe catalog for the simulation.
import { CATALOG_CUSTOMERS, CATALOG_FOODS } from '../data/catalog.generated.ts';
import type { CatalogCustomer, CatalogFood, CatalogOrder } from '../data/catalogTypes.ts';
import type { DishSize } from './params.ts';

const FOODS = new Map(CATALOG_FOODS.map((f) => [f.id, f]));
const CUSTOMERS = new Map(CATALOG_CUSTOMERS.map((c) => [c.id, c]));

export function getFood(id: string): CatalogFood | undefined {
  return FOODS.get(id);
}

export function requireFood(id: string): CatalogFood {
  const food = FOODS.get(id);
  if (!food) throw new RangeError(`Unknown food id: ${id}`);
  return food;
}

export function getCatalogCustomer(id: string): CatalogCustomer | undefined {
  return CUSTOMERS.get(id);
}

/** The customer's catalog orders (single order or variations). */
export function customerOrders(customer: CatalogCustomer): CatalogOrder[] {
  return [customer.order, ...(customer.orderVariations ?? [])].filter((o): o is CatalogOrder => !!o);
}

export const SIZE_INDEX: Record<DishSize, number> = { small: 0, medium: 1, large: 2 };

/**
 * Grams in the catalog's serving option at `index` (clamped to the options available), from the
 * volume options and density, or from the portion options.
 */
export function servingGrams(food: CatalogFood, index: number): number {
  if (food.volume_options_ml && food.volume_options_ml.length > 0) {
    if (!food.density_g_per_ml) throw new RangeError(`${food.id} has volume options but no density`);
    const i = Math.max(0, Math.min(index, food.volume_options_ml.length - 1));
    return Math.round(food.volume_options_ml[i] * food.density_g_per_ml);
  }
  if (food.portion_g && food.portion_g.length > 0) {
    const i = Math.max(0, Math.min(index, food.portion_g.length - 1));
    return food.portion_g[i];
  }
  throw new RangeError(`${food.id} has no serving options`);
}

export function foodsInCategory(category: CatalogFood['category']): CatalogFood[] {
  return CATALOG_FOODS.filter((f) => f.category === category);
}
