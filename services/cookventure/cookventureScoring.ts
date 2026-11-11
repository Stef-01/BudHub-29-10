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
import subregionsData from '../../data/cookventure/subregions.json';
import { getMasalaName, getRegionName, getSubregionName, getTadkaName } from './labels';
import { enrichRecipe } from './recipeInferencer';
import { lineUsesItem } from './ingredients';
import { checkDiet, meetsGoal, DIET_OPTIONS, getDietLabel } from './dietRules';

interface Recipe extends RecipeCookventureData {
  id: string;
  name: string;
  ingredients: string;
  diabetic_friendly?: boolean;
  diabetic_adapted?: boolean;
  high_fiber?: boolean;
  fiber_grams?: number;
  sodium_mg?: number;
  prep_minutes?: number;
  cook_minutes?: number;
  course?: string;
  diet_tags?: string[];
}

/** Every recipe that passes the hard filters starts here, so all recipes still appear in results */
export const BASE_SCORE = 10;
/** Part of the pantry weight reserved for using the selected regions' staples */
const STAPLE_BONUS_MAX = 5;
/** Time limit implied by the "quick" craving when no explicit limit was picked */
const QUICK_CRAVING_MINUTES = 30;
/** The survey's top time option is "60+": anything up to two hours fits it */
const OPEN_ENDED_MINUTES = 60;
const OPEN_ENDED_LIMIT = 120;
/** Region points when the dish is from the right region but a different sub-region than the one picked */
const PARENT_REGION_SHARE = 2 / 3;
/** Largest possible Manhattan distance between two taste profiles (4 axes x 0-3) */
const MAX_FLAVOR_DISTANCE = 12;
/** Ingredients every kitchen is assumed to have, so they never count as missing */
const ALWAYS_AVAILABLE = ['salt', 'water'];

const SUBREGIONS = subregionsData as Record<string, { region: string }>;
const STRICT_DIETS = DIET_OPTIONS.filter((d) => d.kind === 'strict').map((d) => d.id as string);

/**
 * Calculate Cookventure score for a recipe based on user preferences
 */
export function calculateCookventureScore(
  rawRecipe: Recipe,
  userPrefs: UserPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoredRecipe {
  const recipe = enrichRecipe(rawRecipe);
  const ingredientLines = parseIngredientLines(recipe.ingredients || '');
  // Masalas in the locker are in the spice cabinet, so they count as pantry items too
  const ownedItems = [...userPrefs.pantry, ...userPrefs.masalaLocker];
  const { matched, missing } = splitByPantry(ingredientLines, ownedItems);

  // 1. HARD FILTERS: strict diets and allergens
  const dietCheck = checkDiet(recipe, userPrefs.diet, userPrefs.avoids);
  const base = {
    recipe,
    matched_ingredients: matched,
    missing_ingredients: missing,
    cautions: dietCheck.cautions,
    can_swap_tadka: recipe.tadka_profiles.length > 0,
    can_swap_masala: recipe.masala_profiles.length > 0,
  };
  if (!dietCheck.passes) {
    return {
      ...base,
      score: 0,
      maxScore: 0,
      matchPercent: 0,
      explanation: dietCheck.violations,
      reasons: [],
      breakdown: [],
      excluded: true,
      exclusion_reasons: dietCheck.violations,
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

  // 3. REGION FIT (sub-region aware)
  if (userPrefs.selectedRegions.length > 0) {
    const region = calculateRegionFit(recipe, userPrefs, weights.region);
    breakdown.push({ kind: 'region', label: 'Region', points: region.points, maxPoints: weights.region, detail: region.detail });
    if (region.reason) reasons.push({ kind: 'region', label: region.reason });
  }

  // 4. MASALA LOCKER FIT
  if (userPrefs.masalaLocker.length > 0) {
    const recipeMasalas = recipe.masala_profiles;
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
            : 'No spice blend in this dish',
    });
    if (matchedMasalas.length > 0) {
      reasons.push({ kind: 'masala', label: `Uses your ${matchedMasalas.map(getMasalaName).join(', ')}` });
    }
  }

  // 5. TADKA FIT
  if (userPrefs.favouriteTadkas.length > 0) {
    const recipeTadkas = recipe.tadka_profiles;
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
          : 'No tempering in this dish',
    });
    if (favourite) reasons.push({ kind: 'tadka', label: `${getTadkaName(favourite)} tadka` });
  }

  // 6. FLAVOR AXES FIT (always applies: the user always has a taste profile)
  {
    const points = calculateFlavorAxesFit(recipe.taste_axes, userPrefs.tastePrefs, weights.flavor_axes);
    const estimated = recipe.cookventure_source.taste_axes === 'inferred';
    breakdown.push({
      kind: 'flavor',
      label: 'Flavor',
      points,
      maxPoints: weights.flavor_axes,
      detail: `${Math.round((points / weights.flavor_axes) * 100)}% close to your taste${estimated ? ' (estimated from ingredients)' : ''}`,
    });
    if (points > weights.flavor_axes * 0.7) reasons.push({ kind: 'flavor', label: 'Close to your taste' });
  }

  // 7. HEALTH GOALS
  {
    const health = calculateHealthBonus(recipe, userPrefs, weights.health);
    breakdown.push({
      kind: 'health',
      label: 'Health',
      points: health.points,
      maxPoints: health.maxPoints,
      detail: health.notes.length > 0 ? health.notes.join(' · ') : 'No health bonus',
    });
    health.reasons.forEach((label) => reasons.push({ kind: 'health', label }));
  }

  // 8. STRICT DIETS: full points when the recipe's own label confirms them
  const strictDiets = userPrefs.diet.filter((d) => STRICT_DIETS.includes(d));
  if (strictDiets.length > 0) {
    const share = dietCheck.verified.length / strictDiets.length;
    const points = weights.diet * (share + (1 - share) / 2);
    const names = strictDiets.map(getDietLabel).join(', ');
    breakdown.push({
      kind: 'diet',
      label: 'Diet',
      points,
      maxPoints: weights.diet,
      detail:
        dietCheck.unverified.length === 0
          ? `Labelled ${names}`
          : `Ingredients fit ${dietCheck.unverified.map(getDietLabel).join(', ')}, but it isn't labelled that way`,
    });
    reasons.push({ kind: 'diet', label: names });
  }

  // 9. TIME FIT: an explicit limit, or the "quick" craving
  const timeLimit = userPrefs.timeLimit ?? (userPrefs.cravings.includes('quick') ? QUICK_CRAVING_MINUTES : undefined);
  if (timeLimit) {
    const prep = recipe.prep_minutes || 0;
    const totalTime = prep + (recipe.cook_minutes || 0);
    const limit = timeLimit >= OPEN_ENDED_MINUTES ? OPEN_ENDED_LIMIT : timeLimit;
    const share = totalTime === 0 ? 0 : totalTime <= limit ? 1 : totalTime <= limit * 1.5 ? 0.4 : 0;
    breakdown.push({
      kind: 'quick',
      label: 'Time',
      points: weights.time * share,
      maxPoints: weights.time,
      detail:
        totalTime === 0
          ? 'Cooking time unknown'
          : prep >= 240
            ? `Needs about ${Math.round(prep / 60)} h soaking or fermenting first`
            : `${totalTime} min total (you have ${timeLimit}${timeLimit >= OPEN_ENDED_MINUTES ? '+' : ''} min)`,
    });
    if (share === 1) reasons.push({ kind: 'quick', label: `Ready in ${totalTime} min` });
  }

  // 10. COURSE PREFERENCE
  if (userPrefs.course && userPrefs.course.length > 0) {
    const course = normalizeCourse(recipe.course);
    const fits = !!course && userPrefs.course.includes(course);
    breakdown.push({
      kind: 'course',
      label: 'Course',
      points: fits ? weights.course : 0,
      maxPoints: weights.course,
      detail: course ? capitalize(course) : 'Course unknown',
    });
    if (fits) reasons.push({ kind: 'course', label: capitalize(course!) });
  }

  const score = BASE_SCORE + breakdown.reduce((sum, c) => sum + c.points, 0);
  const maxScore = BASE_SCORE + breakdown.reduce((sum, c) => sum + c.maxPoints, 0);

  return {
    ...base,
    score,
    maxScore,
    matchPercent: Math.round((score / maxScore) * 100),
    explanation: reasons.map((r) => `✓ ${r.label}`),
    reasons,
    breakdown,
  };
}

/** Recipe courses as the survey offers them */
export function normalizeCourse(course?: string): string | undefined {
  if (!course) return undefined;
  const c = course.toLowerCase();
  if (c === 'drink' || c === 'drinks') return 'beverage';
  if (c === 'sweet' || c === 'sweets') return 'dessert';
  return c;
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

function lineMatchesPantry(line: string, userPantry: string[]): boolean {
  const lower = line.toLowerCase();
  if (ALWAYS_AVAILABLE.some((basic) => lower.includes(basic))) return true;
  return userPantry.some((pantryItem) => lineUsesItem(line, pantryItem));
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

  const ownedStaples = getRegionStaples(selectedRegions).filter((staple) =>
    userPantry.some((item) => lineUsesItem(item, staple))
  );
  const stapleMatches = ingredientLines.filter((line) => ownedStaples.some((staple) => lineUsesItem(line, staple))).length;

  coverage += Math.min(STAPLE_BONUS_MAX, stapleMatches);
  return Math.min(maxPoints, coverage);
}

/**
 * Region points: full for a dish from a picked sub-region, or from a picked region when no
 * sub-region of it was narrowed down; two-thirds for the right region but another sub-region.
 */
function calculateRegionFit(
  recipe: { region_tags: string[]; subregion_tags: string[] },
  userPrefs: UserPreferences,
  maxPoints: number
): { points: number; detail: string; reason?: string } {
  const pickedSubs = userPrefs.selectedSubregions || [];
  const subMatch = recipe.subregion_tags.find((s) => pickedSubs.includes(s));
  if (subMatch) {
    return { points: maxPoints, detail: `${getSubregionName(subMatch)} dish`, reason: `${getSubregionName(subMatch)} dish` };
  }

  const regionMatches = recipe.region_tags.filter((tag) => userPrefs.selectedRegions.includes(tag));
  if (regionMatches.length === 0) return { points: 0, detail: describeRecipeRegions(recipe) };

  const regionNames = regionMatches.map(getRegionName).join(' & ');
  const narrowed = regionMatches.every((r) => pickedSubs.some((s) => SUBREGIONS[s]?.region === r));
  if (narrowed) {
    return {
      points: maxPoints * PARENT_REGION_SHARE,
      detail: `${regionNames} dish, not from the ${pickedSubs.map(getSubregionName).join(' / ')} kitchen you picked`,
      reason: `${regionNames} dish`,
    };
  }
  return { points: maxPoints, detail: `${regionNames} dish`, reason: `${regionNames} dish` };
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
 * Health points. Fiber and sodium always count; the diabetes part counts when the user asked
 * for it (verified diabetes-friendly recipes earn more than lower-sugar adaptations).
 */
function calculateHealthBonus(
  recipe: Recipe,
  userPrefs: UserPreferences,
  weight: number
): { points: number; maxPoints: number; notes: string[]; reasons: string[] } {
  const notes: string[] = [];
  const reasons: string[] = [];
  let points = 0;
  let maxPoints = 2; // fiber + sodium

  const wantsDiabetic = !!userPrefs.diabetic_friendly || userPrefs.diet.includes('diabetic_friendly');
  const wantsFiber = userPrefs.diet.includes('high_fiber');

  if (wantsDiabetic) {
    maxPoints += 3;
    if (meetsGoal(recipe, 'diabetic_friendly')) {
      points += 3;
      notes.push('Diabetes-friendly');
      reasons.push('Diabetes-friendly');
    } else if (recipe.diabetic_adapted) {
      points += 2;
      notes.push('Lower-sugar swap applied');
      reasons.push('Lower-sugar swap');
    }
  }
  if (meetsGoal(recipe, 'high_fiber')) {
    points += 1;
    notes.push(recipe.fiber_grams ? `${recipe.fiber_grams}g fiber` : 'High fiber');
    if (wantsFiber) reasons.push(recipe.fiber_grams ? `${recipe.fiber_grams}g fiber` : 'High fiber');
  }
  if (recipe.sodium_mg && recipe.sodium_mg <= 600) {
    points += 1;
    notes.push('Low sodium');
  }

  // A high-fiber goal makes fiber worth more
  if (wantsFiber) {
    maxPoints += 2;
    if (meetsGoal(recipe, 'high_fiber')) points += 2;
  }

  const cap = weight + (wantsFiber ? 2 : 0);
  return { points: Math.min(cap, points), maxPoints: Math.min(cap, maxPoints), notes, reasons };
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

function describeRecipeRegions(recipe: { region_tags: string[]; subregion_tags: string[] }): string {
  if (recipe.region_tags.length === 0) return 'Region not tagged';
  const sub = recipe.subregion_tags.length > 0 ? `${recipe.subregion_tags.map(getSubregionName).join(' & ')}, ` : '';
  return `${sub}${recipe.region_tags.map(getRegionName).join(' & ')} dish`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Sort scored recipes by score, with tie-breakers. Returns a new array.
 * Pass the user's first-picked region to use it as the last tie-breaker.
 */
export function sortScoredRecipes(recipes: ScoredRecipe[], firstRegion?: string): ScoredRecipe[] {
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
    if (aFiber !== bFiber) return bFiber - aFiber;

    // Tie-breaker 4: Matches the user's first-selected region
    if (firstRegion) {
      const aFirst = a.recipe.region_tags?.includes(firstRegion) ? 1 : 0;
      const bFirst = b.recipe.region_tags?.includes(firstRegion) ? 1 : 0;
      return bFirst - aFirst;
    }
    return 0;
  });
}
