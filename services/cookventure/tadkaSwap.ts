// services/cookventure/tadkaSwap.ts
// Post-match customisation: swap the tempering (tadka) a recipe uses.
import type { RecipeCookventureData, ScoredRecipe, TadkaMap, UserPreferences } from '../../types/cookventure';
import tadkaData from '../../data/cookventure/tadka.json';
import { calculateCookventureScore } from './cookventureScoring';

const TADKAS = tadkaData as TadkaMap;

const clampTaste = (value: number) => Math.max(0, Math.min(3, value));

/**
 * Return a copy of the recipe that uses `newTadkaId` as its tempering.
 * Heat is nudged by the difference between the old and new tadka's own heat.
 */
export function swapTadka<R extends RecipeCookventureData>(recipe: R, newTadkaId: string): R {
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
 * Re-score a recipe with a different tadka and record what changed.
 * Always swaps from the recipe as it was originally matched, so repeated swaps don't drift.
 */
export function rescoreWithTadka(
  original: ScoredRecipe,
  newTadkaId: string,
  userPrefs: UserPreferences
): ScoredRecipe {
  const swappedRecipe = swapTadka(original.recipe, newTadkaId);
  const rescored = calculateCookventureScore(swappedRecipe, userPrefs);
  const tadka = TADKAS[newTadkaId];

  return {
    ...rescored,
    swapped_tadka: {
      from: original.recipe.tadka_profiles?.[0],
      to: newTadkaId,
      tempering_note: tadka?.method ?? `Temper with ${tadka?.name ?? newTadkaId} instead.`,
    },
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
