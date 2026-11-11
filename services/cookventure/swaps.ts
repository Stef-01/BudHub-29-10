// services/cookventure/swaps.ts
// Post-match customisation: swap the tadka, swap a masala, or make a lower-sugar version.
// Swaps stack, and are always applied to the recipe as originally matched so they never drift.
import type {
  MasalasMap,
  RecipeCookventureData,
  ScoredRecipe,
  ScoringWeights,
  TadkaMap,
  TasteAxes,
  UserPreferences,
} from '../../types/cookventure';
import tadkaData from '../../data/cookventure/tadka.json';
import masalasData from '../../data/cookventure/masalas.json';
import diabeticSwapsData from '../../data/cookventure/diabetic_swaps.json';
import { calculateCookventureScore, normalizeCourse } from './cookventureScoring';

const TADKAS = tadkaData as TadkaMap;
const MASALAS = masalasData as MasalasMap;
const SUGAR_SWAPS = diabeticSwapsData as {
  savory: Record<string, string>;
  sweet: Record<string, string>;
  tips: { savory: string; sweet: string };
};

const clampTaste = (value: number) => Math.max(0, Math.min(3, Math.round(value)));

type SwappableRecipe = RecipeCookventureData & {
  ingredients?: string;
  course?: string;
  diabetic_friendly?: boolean;
  diabetic_adapted?: boolean;
};

export interface RecipeSwaps {
  tadka?: string;
  masala?: { from: string; to: string };
  lowerSugar?: boolean;
}

export const hasSwaps = (swaps?: RecipeSwaps) => !!swaps && (!!swaps.tadka || !!swaps.masala || !!swaps.lowerSugar);

// --- Tadka ------------------------------------------------------------------------

/**
 * Return a copy of the recipe that uses `newTadkaId` as its tempering.
 * Heat is nudged by the difference between the old and new tadka's own heat.
 */
export function swapTadka<R extends SwappableRecipe>(recipe: R, newTadkaId: string): R {
  const newTadka = TADKAS[newTadkaId];
  if (!newTadka) return recipe;

  const oldTadkaId = recipe.tadka_profiles?.[0];
  const oldHeat = oldTadkaId ? TADKAS[oldTadkaId]?.heat ?? 0 : 0;

  return {
    ...recipe,
    tadka_profiles: [newTadkaId],
    taste_axes: recipe.taste_axes
      ? { ...recipe.taste_axes, heat: clampTaste(recipe.taste_axes.heat + newTadka.heat - oldHeat) }
      : recipe.taste_axes,
  };
}

/**
 * Tadkas to offer for a recipe: the current one first, then those that suit the
 * recipe's regions, then the rest.
 */
export function getTadkaOptions(recipe: RecipeCookventureData): string[] {
  const current = recipe.tadka_profiles?.[0];
  const regions = recipe.region_tags || [];
  const fitsRegion = (id: string) => TADKAS[id].region_fit.some((r) => regions.includes(r));

  const others = Object.keys(TADKAS).filter((id) => id !== current);
  const ordered = [...others.filter(fitsRegion), ...others.filter((id) => !fitsRegion(id))];
  return current && TADKAS[current] ? [current, ...ordered] : ordered;
}

// --- Masala -----------------------------------------------------------------------

const masalaName = (id: string) => MASALAS[id]?.name ?? id.replace(/_/g, ' ');
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Swap one masala for another (e.g. garam masala -> goda masala). The taste profile moves by the
 * difference between the two blends' taste effects, and the ingredient list names the new blend.
 */
export function swapMasala<R extends SwappableRecipe>(recipe: R, fromId: string, toId: string): R {
  const from = MASALAS[fromId];
  const to = MASALAS[toId];
  if (!from || !to || fromId === toId) return recipe;

  let taste = recipe.taste_axes;
  if (taste && from.taste_effect && to.taste_effect) {
    const next = {} as TasteAxes;
    (Object.keys(taste) as Array<keyof TasteAxes>).forEach((axis) => {
      next[axis] = clampTaste(taste![axis] + to.taste_effect![axis] - from.taste_effect![axis]);
    });
    taste = next;
  }

  const ingredients = recipe.ingredients
    ? recipe.ingredients.replace(new RegExp(escapeRegExp(from.name), 'gi'), to.name)
    : recipe.ingredients;

  return {
    ...recipe,
    ingredients,
    masala_profiles: (recipe.masala_profiles || []).map((m) => (m === fromId ? toId : m)),
    taste_axes: taste,
  };
}

/** Masalas to offer in place of `fromId`: natural substitutes first, then the rest */
export function getMasalaOptions(fromId: string): Array<{ id: string; classic: boolean }> {
  const classic = MASALAS[fromId]?.swaps_well_with ?? [];
  const others = Object.keys(MASALAS).filter((id) => id !== fromId && !classic.includes(id));
  return [...classic.map((id) => ({ id, classic: true })), ...others.map((id) => ({ id, classic: false }))];
}

export { masalaName };

// --- Lower sugar ---------------------------------------------------------------

const SWEETENER_PATTERN = /\b(jaggery|sugar|honey|maple syrup|dates|raisins?)\b/i;

const isSweetCourse = (course?: string) => {
  const c = normalizeCourse(course);
  return c === 'dessert' || c === 'beverage';
};

/** Lines that would change, so the UI can offer the swap only when it does something */
export function canLowerSugar(recipe: SwappableRecipe): boolean {
  if (recipe.diabetic_friendly) return false;
  return (recipe.ingredients || '').split('\n').some((line) => SWEETENER_PATTERN.test(line) && !/optional/i.test(line));
}

/**
 * Lower-sugar version: replaces sugar, jaggery, dates and honey with gentler options, chosen by
 * course (savory dishes lose the sweetener; desserts and drinks halve it). Sweetness drops a step.
 */
export function lowerSugar<R extends SwappableRecipe>(
  recipe: R
): R & { sugar_swaps: Array<{ from: string; to: string }>; sugar_tip: string } {
  const table = isSweetCourse(recipe.course) ? SUGAR_SWAPS.sweet : SUGAR_SWAPS.savory;
  const swaps: Array<{ from: string; to: string }> = [];

  const ingredients = (recipe.ingredients || '')
    .split('\n')
    .map((line) => {
      const match = line.match(SWEETENER_PATTERN);
      if (!match || /optional/i.test(line)) return line;
      const key = match[1].toLowerCase().replace(/^raisin$/, 'raisins');
      const replacement = table[key];
      if (!replacement) return line;
      swaps.push({ from: line.trim(), to: replacement });
      return `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)} (replaces: ${line.trim()})`;
    })
    .join('\n');

  return {
    ...recipe,
    ingredients,
    diabetic_adapted: swaps.length > 0,
    taste_axes: recipe.taste_axes ? { ...recipe.taste_axes, sweet: clampTaste(recipe.taste_axes.sweet - 1) } : recipe.taste_axes,
    sugar_swaps: swaps,
    sugar_tip: isSweetCourse(recipe.course) ? SUGAR_SWAPS.tips.sweet : SUGAR_SWAPS.tips.savory,
  };
}

// --- Re-scoring -----------------------------------------------------------------

/**
 * Apply the swaps to the recipe as originally matched, re-score it, and record what changed.
 */
export function rescoreWithSwaps(
  original: ScoredRecipe,
  swaps: RecipeSwaps,
  userPrefs: UserPreferences,
  weights?: ScoringWeights
): ScoredRecipe {
  if (!hasSwaps(swaps)) return original;

  let recipe = original.recipe;
  if (swaps.masala) recipe = swapMasala(recipe, swaps.masala.from, swaps.masala.to);
  if (swaps.tadka) recipe = swapTadka(recipe, swaps.tadka);
  let sugar: { sugar_swaps: Array<{ from: string; to: string }>; sugar_tip: string } | undefined;
  if (swaps.lowerSugar) {
    const adapted = lowerSugar(recipe);
    sugar = { sugar_swaps: adapted.sugar_swaps, sugar_tip: adapted.sugar_tip };
    recipe = adapted;
  }

  const rescored = calculateCookventureScore(recipe, userPrefs, weights);
  const tadka = swaps.tadka ? TADKAS[swaps.tadka] : undefined;

  return {
    ...rescored,
    swapped_tadka: swaps.tadka
      ? {
          from: original.recipe.tadka_profiles?.[0],
          to: swaps.tadka,
          tempering_note: tadka?.method ?? `Temper with ${tadka?.name ?? swaps.tadka} instead.`,
        }
      : undefined,
    swapped_masala: swaps.masala,
    sugar_swaps: sugar?.sugar_swaps,
    sugar_tip: sugar?.sugar_tip,
  };
}
