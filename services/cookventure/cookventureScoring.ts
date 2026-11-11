// services/cookventure/cookventureScoring.ts
import type {
  UserPreferences,
  ScoredRecipe,
  RecipeCookventureData,
  TasteAxes,
  ScoringWeights,
  ScoreComponent,
  MatchReason,
} from '../../types/cookventure';
import { DEFAULT_SCORING_WEIGHTS } from '../../types/cookventure';
import regionsData from '../../data/cookventure/regions.json';
import { getMasalaName, getRegionName, getTadkaName, humanizeId } from './labels';

interface Recipe extends RecipeCookventureData {
  id: string;
  name: string;
  ingredients: string;
  diabetic_friendly?: boolean;
  fiber_grams?: number;
  sodium_mg?: number;
  prep_minutes?: number;
  cook_minutes?: number;
  course?: string;
  diet_tags?: string[];
}

/** Every recipe that passes the hard filters starts here, so all recipes still appear in results */
const BASE_SCORE = 10;
/** Part of the pantry weight reserved for using the selected regions' staples */
const STAPLE_BONUS_MAX = 5;
const DIET_BONUS = 10;
const QUICK_BONUS = 5;
const QUICK_MAX_MINUTES = 30;
const COURSE_BONUS = 5;
/** Largest possible Manhattan distance between two taste profiles (4 axes x 0-3) */
const MAX_FLAVOR_DISTANCE = 12;
/** Ingredients every kitchen is assumed to have, so they never count as missing */
const ALWAYS_AVAILABLE = ['salt', 'water'];

/**
 * Calculate Cookventure score for a recipe based on user preferences
 */
export function calculateCookventureScore(
  recipe: Recipe,
  userPrefs: UserPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoredRecipe {
  const ingredientLines = parseIngredientLines(recipe.ingredients || '');
  // Masalas in the locker are in the spice cabinet, so they count as pantry items too
  const ownedItems = [...userPrefs.pantry, ...userPrefs.masalaLocker];
  const { matched, missing } = splitByPantry(ingredientLines, ownedItems);

  // 1. HARD FILTERS (binary pass/fail)
  if (!passesHardFilters(recipe, userPrefs)) {
    return {
      score: 0,
      maxScore: 0,
      matchPercent: 0,
      recipe,
      explanation: ['Contains ingredients you avoid'],
      reasons: [],
      breakdown: [],
      matched_ingredients: matched,
      missing_ingredients: missing,
      can_swap_tadka: false,
      can_swap_masala: false,
    };
  }

  const breakdown: ScoreComponent[] = [];
  const reasons: MatchReason[] = [];

  // 2. PANTRY COVERAGE
  if (ownedItems.length > 0) {
    const points = calculatePantryCoverage(
      ingredientLines,
      matched.length,
      ownedItems,
      userPrefs.selectedRegions,
      weights.pantry
    );
    const total = ingredientLines.length;
    breakdown.push({
      kind: 'pantry',
      label: 'Pantry',
      points,
      maxPoints: weights.pantry,
      detail: total > 0 ? `${matched.length} of ${total} ingredients in your pantry` : 'No ingredient list',
    });
    if (total > 0 && matched.length / total >= 0.5) {
      reasons.push({ kind: 'pantry', label: `You have ${matched.length}/${total} ingredients` });
    }
  }

  // 3. REGION FIT
  if (userPrefs.selectedRegions.length > 0) {
    const matchedRegions = (recipe.region_tags || []).filter((tag) =>
      userPrefs.selectedRegions.includes(tag)
    );
    const points = matchedRegions.length > 0 ? weights.region : 0;
    const regionNames = matchedRegions.map(getRegionName).join(' & ');
    breakdown.push({
      kind: 'region',
      label: 'Region',
      points,
      maxPoints: weights.region,
      detail: points > 0 ? `${regionNames} dish` : describeRecipeRegions(recipe.region_tags),
    });
    if (points > 0) reasons.push({ kind: 'region', label: `${regionNames} dish` });
  }

  // 4. MASALA LOCKER FIT
  if (userPrefs.masalaLocker.length > 0) {
    const recipeMasalas = recipe.masala_profiles || [];
    const matchedMasalas = recipeMasalas.filter((m) => userPrefs.masalaLocker.includes(m));
    const points =
      recipeMasalas.length > 0 ? (matchedMasalas.length / recipeMasalas.length) * weights.masala_locker : 0;
    breakdown.push({
      kind: 'masala',
      label: 'Masala locker',
      points,
      maxPoints: weights.masala_locker,
      detail:
        matchedMasalas.length > 0
          ? `Uses your ${matchedMasalas.map(getMasalaName).join(', ')}`
          : recipeMasalas.length > 0
            ? `Uses ${recipeMasalas.map(getMasalaName).join(', ')}`
            : 'No spice blend tagged',
    });
    if (matchedMasalas.length > 0) {
      reasons.push({ kind: 'masala', label: `Uses your ${matchedMasalas.map(getMasalaName).join(', ')}` });
    }
  }

  // 5. TADKA FIT
  if (userPrefs.favouriteTadkas.length > 0) {
    const recipeTadkas = recipe.tadka_profiles || [];
    const favourite = recipeTadkas.find((t) => userPrefs.favouriteTadkas.includes(t));
    const points = favourite ? weights.tadka : 0;
    breakdown.push({
      kind: 'tadka',
      label: 'Tadka',
      points,
      maxPoints: weights.tadka,
      detail: favourite
        ? `Your favourite: ${getTadkaName(favourite)}`
        : recipeTadkas.length > 0
          ? `Tempered with ${recipeTadkas.map(getTadkaName).join(', ')}`
          : 'No tempering tagged',
    });
    if (favourite) reasons.push({ kind: 'tadka', label: `${getTadkaName(favourite)} tadka` });
  }

  // 6. FLAVOR AXES FIT (always applies: the user always has a taste profile)
  {
    const points = recipe.taste_axes
      ? calculateFlavorAxesFit(recipe.taste_axes, userPrefs.tastePrefs, weights.flavor_axes)
      : 0;
    breakdown.push({
      kind: 'flavor',
      label: 'Flavor',
      points,
      maxPoints: weights.flavor_axes,
      detail: recipe.taste_axes
        ? `${Math.round((points / weights.flavor_axes) * 100)}% close to your taste`
        : 'Flavor profile not tagged yet',
    });
    if (recipe.taste_axes && points > weights.flavor_axes * 0.7) {
      reasons.push({ kind: 'flavor', label: 'Close to your taste' });
    }
  }

  // 7. HEALTH BONUS
  {
    const { points, maxPoints, notes } = calculateHealthBonus(recipe, userPrefs, weights.health);
    breakdown.push({
      kind: 'health',
      label: 'Health',
      points,
      maxPoints,
      detail: notes.length > 0 ? notes.join(' · ') : 'No health bonus',
    });
    if (recipe.diabetic_friendly && userPrefs.diabetic_friendly) {
      reasons.push({ kind: 'health', label: 'Diabetic-friendly' });
    }
  }

  // 8. DIET PREFERENCE BONUS
  if (userPrefs.diet.length > 0) {
    const dietMatches = userPrefs.diet.filter((d) => recipe.diet_tags?.includes(d));
    const points = dietMatches.length > 0 ? DIET_BONUS : 0;
    breakdown.push({
      kind: 'diet',
      label: 'Diet',
      points,
      maxPoints: DIET_BONUS,
      detail: points > 0 ? `Fits ${dietMatches.join(', ')}` : `Not tagged ${userPrefs.diet.join(', ')}`,
    });
    if (points > 0) {
      reasons.push({ kind: 'diet', label: capitalize(dietMatches.map(humanizeId).join(', ')) });
    }
  }

  // 9. QUICK PREP BONUS - for "quick" craving
  if (userPrefs.cravings.includes('quick')) {
    const totalTime = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
    const isQuick = totalTime > 0 && totalTime <= QUICK_MAX_MINUTES;
    breakdown.push({
      kind: 'quick',
      label: 'Quick',
      points: isQuick ? QUICK_BONUS : 0,
      maxPoints: QUICK_BONUS,
      detail: totalTime > 0 ? `${totalTime} min total` : 'Cooking time unknown',
    });
    if (isQuick) reasons.push({ kind: 'quick', label: `Ready in ${totalTime} min` });
  }

  // 10. COURSE PREFERENCE BONUS
  if (userPrefs.course && userPrefs.course.length > 0) {
    const fits = !!recipe.course && userPrefs.course.includes(recipe.course);
    breakdown.push({
      kind: 'course',
      label: 'Course',
      points: fits ? COURSE_BONUS : 0,
      maxPoints: COURSE_BONUS,
      detail: recipe.course ? capitalize(recipe.course) : 'Course unknown',
    });
  }

  const score = BASE_SCORE + breakdown.reduce((sum, c) => sum + c.points, 0);
  const maxScore = BASE_SCORE + breakdown.reduce((sum, c) => sum + c.maxPoints, 0);

  return {
    score,
    maxScore,
    matchPercent: Math.round((score / maxScore) * 100),
    recipe,
    explanation: reasons.map((r) => `✓ ${r.label}`),
    reasons,
    breakdown,
    matched_ingredients: matched,
    missing_ingredients: missing,
    can_swap_tadka: (recipe.tadka_profiles?.length || 0) > 0,
    can_swap_masala: (recipe.masala_profiles?.length || 0) > 0,
  };
}

/**
 * Check if recipe passes hard filters (avoids only - keep it lenient)
 */
function passesHardFilters(recipe: Recipe, userPrefs: UserPreferences): boolean {
  if (userPrefs.avoids.length > 0) {
    const ingredients = normalize(recipe.ingredients || '');
    return !userPrefs.avoids.some((avoid) => ingredients.includes(normalize(avoid)));
  }
  return true;
}

/**
 * Split a recipe's ingredient text into one entry per ingredient.
 * Section headers such as "For Tempering:" are not ingredients and are dropped.
 */
export function parseIngredientLines(recipeIngredients: string): string[] {
  return recipeIngredients
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.endsWith(':'));
}

/** Lowercase and treat taxonomy ids ("curry_leaves") like plain text ("curry leaves") */
function normalize(text: string): string {
  return text.toLowerCase().replace(/_/g, ' ');
}

function lineMatchesPantry(line: string, userPantry: string[]): boolean {
  const normalizedLine = normalize(line);
  if (ALWAYS_AVAILABLE.some((basic) => normalizedLine.includes(basic))) return true;
  return userPantry.some((pantryItem) => {
    const item = normalize(pantryItem);
    return normalizedLine.includes(item) || item.includes(normalizedLine);
  });
}

function splitByPantry(lines: string[], userPantry: string[]): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  lines.forEach((line) => (lineMatchesPantry(line, userPantry) ? matched : missing).push(line));
  return { matched, missing };
}

/**
 * Calculate pantry coverage score (0 - maxPoints).
 * Most points come from the share of ingredients you have; a small bonus rewards
 * having the staples of the regions you picked.
 */
function calculatePantryCoverage(
  ingredientLines: string[],
  matchedCount: number,
  userPantry: string[],
  selectedRegions: string[],
  maxPoints: number
): number {
  if (ingredientLines.length === 0) return 0;

  const coverageMax = maxPoints - STAPLE_BONUS_MAX;
  let coverage = (matchedCount / ingredientLines.length) * coverageMax;

  const regionStaples = getRegionStaples(selectedRegions).map(normalize);
  const pantry = userPantry.map(normalize);
  const stapleMatches = ingredientLines.filter((line) => {
    const normalizedLine = normalize(line);
    return regionStaples.some(
      (staple) => normalizedLine.includes(staple) && pantry.some((item) => item.includes(staple))
    );
  }).length;

  coverage += Math.min(STAPLE_BONUS_MAX, stapleMatches);
  return Math.min(maxPoints, coverage);
}

/**
 * Manhattan distance (L1 norm) between two taste profiles: 0 = identical, 12 = opposite
 */
export function flavorDistance(recipeTaste: TasteAxes, userTaste: TasteAxes): number {
  return (
    Math.abs(recipeTaste.heat - userTaste.heat) +
    Math.abs(recipeTaste.masala - userTaste.masala) +
    Math.abs(recipeTaste.tangy - userTaste.tangy) +
    Math.abs(recipeTaste.sweet - userTaste.sweet)
  );
}

/**
 * Calculate flavor axes fit score (0 - maxPoints): closer = better
 */
function calculateFlavorAxesFit(recipeTaste: TasteAxes, userTaste: TasteAxes, maxPoints: number): number {
  return maxPoints * (1 - flavorDistance(recipeTaste, userTaste) / MAX_FLAVOR_DISTANCE);
}

/**
 * Calculate health bonus. The diabetic-friendly part only counts when the user asked for it.
 */
function calculateHealthBonus(
  recipe: Recipe,
  userPrefs: UserPreferences,
  weight: number
): { points: number; maxPoints: number; notes: string[] } {
  const notes: string[] = [];
  let points = 0;
  let maxPoints = 2; // fiber + sodium

  if (userPrefs.diabetic_friendly) {
    maxPoints += 3;
    if (recipe.diabetic_friendly) {
      points += 3;
      notes.push('Diabetic-friendly');
    }
  }
  if (recipe.fiber_grams && recipe.fiber_grams >= 5) {
    points += 1;
    notes.push(`${recipe.fiber_grams}g fiber`);
  }
  if (recipe.sodium_mg && recipe.sodium_mg <= 600) {
    points += 1;
    notes.push('Low sodium');
  }

  return { points: Math.min(weight, points), maxPoints: Math.min(weight, maxPoints), notes };
}

/**
 * Get region staples from selected regions
 */
function getRegionStaples(selectedRegions: string[]): string[] {
  const staples: string[] = [];

  selectedRegions.forEach((regionId) => {
    const region = (regionsData as Record<string, { staple_packs?: string[] }>)[regionId];
    if (region?.staple_packs) {
      staples.push(...region.staple_packs);
    }
  });

  return [...new Set(staples)];
}

function describeRecipeRegions(regionTags?: string[]): string {
  if (!regionTags || regionTags.length === 0) return 'Region not tagged';
  return `${regionTags.map(getRegionName).join(' & ')} dish`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Sort scored recipes by score, with tie-breakers. Returns a new array.
 */
export function sortScoredRecipes(recipes: ScoredRecipe[]): ScoredRecipe[] {
  return [...recipes].sort((a, b) => {
    // Primary: Score
    if (b.score !== a.score) return b.score - a.score;

    // Tie-breaker 1: Fewer missing ingredients
    if (a.missing_ingredients.length !== b.missing_ingredients.length) {
      return a.missing_ingredients.length - b.missing_ingredients.length;
    }

    // Tie-breaker 2: Lower sodium
    const aSodium = a.recipe.sodium_mg || 9999;
    const bSodium = b.recipe.sodium_mg || 9999;
    if (aSodium !== bSodium) return aSodium - bSodium;

    // Tie-breaker 3: Higher fiber
    const aFiber = a.recipe.fiber_grams || 0;
    const bFiber = b.recipe.fiber_grams || 0;
    return bFiber - aFiber;
  });
}
