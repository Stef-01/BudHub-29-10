// services/cookventure/cookventureScoring.ts
import type {
  UserPreferences,
  ScoredRecipe,
  RecipeCookventureData,
  TasteAxes,
  ScoringWeights,
} from '../../types/cookventure';
import { DEFAULT_SCORING_WEIGHTS } from '../../types/cookventure';
import regionsData from '../../data/cookventure/regions.json';

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

const SCORING_WEIGHTS: ScoringWeights = DEFAULT_SCORING_WEIGHTS;

/**
 * Calculate Cookventure score for a recipe based on user preferences
 */
export function calculateCookventureScore(
  recipe: Recipe,
  userPrefs: UserPreferences
): ScoredRecipe {
  // 1. HARD FILTERS (binary pass/fail)
  if (!passesHardFilters(recipe, userPrefs)) {
    return {
      score: 0,
      recipe,
      explanation: ['Contains ingredients you avoid'],
      missing_ingredients: [],
      can_swap_tadka: false,
      can_swap_masala: false,
    };
  }

  // Start with base score of 10 for all recipes that pass filters
  // This ensures every recipe appears in results
  let score = 10;
  const explanation: string[] = [];

  // 2. PANTRY COVERAGE (45 points)
  const pantryScore = calculatePantryCoverage(
    recipe.ingredients || '',
    userPrefs.pantry,
    userPrefs.selectedRegions
  );
  score += pantryScore;
  if (pantryScore > 35) {
    explanation.push(`✓ ${Math.round((pantryScore / 45) * 100)}% pantry match`);
  }

  // 3. REGION FIT (15 points)
  const regionScore = calculateRegionFit(
    recipe.region_tags || [],
    userPrefs.selectedRegions
  );
  score += regionScore;
  if (regionScore > 10) {
    const matchedRegions = recipe.region_tags?.filter((r) =>
      userPrefs.selectedRegions.includes(r)
    );
    explanation.push(`✓ Matches ${matchedRegions?.join(', ')} region`);
  }

  // 4. MASALA LOCKER FIT (15 points)
  const masalaScore = calculateMasalaFit(
    recipe.masala_profiles || [],
    userPrefs.masalaLocker
  );
  score += masalaScore;
  if (masalaScore > 10 && recipe.masala_profiles) {
    const matched = recipe.masala_profiles.filter((m) =>
      userPrefs.masalaLocker.includes(m)
    );
    if (matched.length > 0) {
      explanation.push(`✓ Uses your ${matched.join(', ')}`);
    }
  }

  // 5. TADKA FIT (10 points)
  const tadkaScore = calculateTadkaFit(
    recipe.tadka_profiles || [],
    userPrefs.favouriteTadkas
  );
  score += tadkaScore;
  if (tadkaScore > 5 && recipe.tadka_profiles && recipe.tadka_profiles.length > 0) {
    explanation.push(`✓ Favourite tadka: ${recipe.tadka_profiles[0]}`);
  }

  // 6. FLAVOR AXES FIT (10 points)
  if (recipe.taste_axes) {
    const flavorScore = calculateFlavorAxesFit(recipe.taste_axes, userPrefs.tastePrefs);
    score += flavorScore;
    if (flavorScore > 7) {
      explanation.push(
        `✓ Matches your taste (heat:${userPrefs.tastePrefs.heat}, masala:${userPrefs.tastePrefs.masala})`
      );
    }
  }

  // 7. HEALTH BONUS (5 points)
  const healthScore = calculateHealthBonus(recipe, userPrefs);
  score += healthScore;
  if (recipe.diabetic_friendly && userPrefs.diabetic_friendly) {
    explanation.push('✓ Diabetic-friendly');
  }

  // 8. DIET PREFERENCE BONUS (10 points)
  if (userPrefs.diet.length > 0 && recipe.diet_tags) {
    const dietMatches = userPrefs.diet.filter((d) => recipe.diet_tags?.includes(d));
    if (dietMatches.length > 0) {
      score += 10;
      explanation.push(`✓ Matches ${dietMatches.join(', ')} diet`);
    }
  }

  // 9. QUICK PREP BONUS (5 points) - for "quick" craving
  if (userPrefs.cravings?.includes('quick')) {
    const totalTime = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
    if (totalTime <= 30) {
      score += 5;
      explanation.push('✓ Quick to make');
    }
  }

  // 10. COURSE PREFERENCE BONUS (5 points)
  if (userPrefs.course && userPrefs.course.length > 0 && recipe.course) {
    if (userPrefs.course.includes(recipe.course)) {
      score += 5;
    }
  }

  const missingIngredients = getMissingIngredients(recipe.ingredients || '', userPrefs.pantry);

  return {
    score,
    recipe,
    explanation,
    missing_ingredients: missingIngredients,
    can_swap_tadka: (recipe.tadka_profiles?.length || 0) > 0,
    can_swap_masala: (recipe.masala_profiles?.length || 0) > 0,
  };
}

/**
 * Check if recipe passes hard filters (avoids only - keep it lenient)
 */
function passesHardFilters(recipe: Recipe, userPrefs: UserPreferences): boolean {
  // Only hard filter: Check allergen avoids
  if (userPrefs.avoids.length > 0) {
    const ingredients = recipe.ingredients?.toLowerCase() || '';
    const hasAvoided = userPrefs.avoids.some((avoid) =>
      ingredients.includes(avoid.toLowerCase())
    );
    if (hasAvoided) return false;
  }

  return true;
}

/**
 * Calculate pantry coverage score (0-45 points)
 */
function calculatePantryCoverage(
  recipeIngredients: string,
  userPantry: string[],
  selectedRegions: string[]
): number {
  if (!recipeIngredients) return 0;

  // Split ingredients string into array
  const ingredientsArray = recipeIngredients.split('\n').map(i => i.trim()).filter(Boolean);
  if (ingredientsArray.length === 0) return 0;

  const totalIngredients = ingredientsArray.length;
  const matchedIngredients = ingredientsArray.filter((ingredient) =>
    userPantry.some((pantryItem) =>
      ingredient.toLowerCase().includes(pantryItem.toLowerCase()) ||
      pantryItem.toLowerCase().includes(ingredient.toLowerCase())
    )
  ).length;

  let coverage = (matchedIngredients / totalIngredients) * 40;

  // Bonus for region staples
  const regionStaples = getRegionStaples(selectedRegions);
  const stapleMatches = ingredientsArray.filter((ingredient) =>
    regionStaples.some((staple) =>
      ingredient.toLowerCase().includes(staple.toLowerCase()) &&
      userPantry.some((pantryItem) => pantryItem.toLowerCase().includes(staple.toLowerCase()))
    )
  ).length;

  coverage += Math.min(5, stapleMatches);

  return Math.min(45, coverage);
}

/**
 * Calculate region fit score (0-15 points)
 */
function calculateRegionFit(recipeTags: string[], selectedRegions: string[]): number {
  if (recipeTags.length === 0 || selectedRegions.length === 0) return 0;

  const matchCount = recipeTags.filter((tag) =>
    selectedRegions.some((region) => tag.toLowerCase().includes(region.toLowerCase()))
  ).length;

  return Math.min(15, matchCount * 15);
}

/**
 * Calculate masala fit score (0-15 points)
 */
function calculateMasalaFit(recipeMasalas: string[], userMasalas: string[]): number {
  if (recipeMasalas.length === 0 || userMasalas.length === 0) return 0;

  const matchCount = recipeMasalas.filter((m) => userMasalas.includes(m)).length;
  const matchRatio = matchCount / recipeMasalas.length;

  return matchRatio * 15;
}

/**
 * Calculate tadka fit score (0-10 points)
 */
function calculateTadkaFit(recipeTadkas: string[], userTadkas: string[]): number {
  if (recipeTadkas.length === 0 || userTadkas.length === 0) return 0;

  const hasMatch = recipeTadkas.some((t) => userTadkas.includes(t));
  return hasMatch ? 10 : 0;
}

/**
 * Calculate flavor axes fit score (0-10 points)
 * Uses Manhattan distance (L1 norm) - closer = better
 */
function calculateFlavorAxesFit(recipeTaste: TasteAxes, userTaste: TasteAxes): number {
  const distance =
    Math.abs(recipeTaste.heat - userTaste.heat) +
    Math.abs(recipeTaste.masala - userTaste.masala) +
    Math.abs(recipeTaste.tangy - userTaste.tangy) +
    Math.abs(recipeTaste.sweet - userTaste.sweet);

  // Max distance = 12 (3+3+3+3), convert to 0-10 scale
  return 10 * (1 - distance / 12);
}

/**
 * Calculate health bonus score (0-5 points)
 */
function calculateHealthBonus(recipe: Recipe, userPrefs: UserPreferences): number {
  let bonus = 0;

  if (recipe.diabetic_friendly && userPrefs.diabetic_friendly) {
    bonus += 3;
  }

  if (recipe.fiber_grams && recipe.fiber_grams >= 5) {
    bonus += 1;
  }

  if (recipe.sodium_mg && recipe.sodium_mg <= 600) {
    bonus += 1;
  }

  return Math.min(5, bonus);
}

/**
 * Get region staples from selected regions
 */
function getRegionStaples(selectedRegions: string[]): string[] {
  const staples: string[] = [];

  selectedRegions.forEach((regionId) => {
    const region = (regionsData as any)[regionId];
    if (region && region.staple_packs) {
      staples.push(...region.staple_packs);
    }
  });

  return [...new Set(staples)]; // Remove duplicates
}

/**
 * Get missing ingredients
 */
function getMissingIngredients(recipeIngredients: string, userPantry: string[]): string[] {
  if (!recipeIngredients) return [];

  const ingredientsArray = recipeIngredients.split('\n').map(i => i.trim()).filter(Boolean);
  return ingredientsArray.filter(
    (ingredient) =>
      !userPantry.some((pantryItem) =>
        ingredient.toLowerCase().includes(pantryItem.toLowerCase()) ||
        pantryItem.toLowerCase().includes(ingredient.toLowerCase())
      )
  );
}

/**
 * Sort scored recipes by score, with tie-breakers
 */
export function sortScoredRecipes(recipes: ScoredRecipe[]): ScoredRecipe[] {
  return recipes.sort((a, b) => {
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
