// services/nutriserveUtils.ts
import type { Character, PlateItem, Nutrients, MealGoals, Target, NutriServeCustomerWithTargets, FoodItem } from '../components/games/NutriServeTypes';
import { CUSTOMER_CHARACTERS } from './nutriserveCharacters';
// FIX: Correct casing of import to match filename 'nutriserveFoodData.ts'.
import { FOOD_LIBRARY } from './nutriserveFoodData';
import { getRecipeIdForFoodItem } from './nutriserveFoodMap';

export type NutrientStatus = 'low' | 'good' | 'high' | 'ok';

/**
 * Determines if a nutrient value is low, good, or high compared to its target.
 */
export function getNutrientStatus(value: number, target: Target): NutrientStatus {
  if ('min' in target && 'max' in target) { // TargetBand
    if (value < target.min) return 'low';
    if (value > target.max) return 'high';
    return 'good';
  }
  if ('min' in target) { // TargetMin
    return value >= target.min ? 'good' : 'low';
  }
  if ('max' in target) { // TargetMax
    return value <= target.max ? 'good' : 'high';
  }
  return 'ok'; // Should not happen with valid targets
}

/**
 * Calculates the total nutrients for all items on a plate.
 */
export function calculateMealTotals(plateItems: PlateItem[]): Nutrients {
  const totals: Nutrients = { calories_kcal: 0, protein_g: 0, carbs_g: 0, fiber_g: 0, fat_g: 0, sodium_mg: 0 };
  for (const item of plateItems) {
    const multiplier = item.grams / 100;
    for (const key in totals) {
      const nutrientKey = key as keyof Nutrients;
      totals[nutrientKey] += item.foodItem.nutrients_per_100g[nutrientKey] * multiplier;
    }
  }
  return totals;
}

/**
 * Generates specific nutritional targets for a customer based on their order.
 */
export function generateCustomerWithTargets(character: Character): NutriServeCustomerWithTargets {
    const goals: Partial<MealGoals> = {};

    // 1. Set Calorie Targets based on Plate Size
    switch (character.order.plateSize) {
        case 'Light':
            goals.calories_kcal = { min: 300, max: 450, target: 375 };
            break;
        case 'Regular':
            goals.calories_kcal = { min: 450, max: 650, target: 550 };
            break;
        case 'Hearty':
            goals.calories_kcal = { min: 650, max: 850, target: 750 };
            break;
    }

    // 2. Set Macro Targets based on Diabetes Mode
    switch (character.order.diabetesMode) {
        case 'Low-Carb':
            goals.protein_g = { min: goals.calories_kcal.target * 0.075 }; // ~30% of calories
            goals.carbs_g = { max: goals.calories_kcal.target * 0.0625 }; // ~25% of calories
            goals.fat_g = { max: goals.calories_kcal.target * 0.05 }; // ~45% of calories
            break;
        case 'Balanced':
            goals.protein_g = { min: goals.calories_kcal.target * 0.05 }; // ~20% of calories
            goals.carbs_g = { max: goals.calories_kcal.target * 0.1125 }; // ~45% of calories
            goals.fat_g = { max: goals.calories_kcal.target * 0.038 }; // ~35% of calories
            break;
        case 'None':
        default:
            goals.protein_g = { min: goals.calories_kcal.target * 0.0375 }; // ~15% of calories
            goals.carbs_g = { max: goals.calories_kcal.target * 0.125 }; // ~50% of calories
            goals.fat_g = { max: goals.calories_kcal.target * 0.038 }; // ~35% of calories
            break;
    }

    // 3. Set Universal Micro Targets
    goals.fiber_g = { min: 8 }; // General good target for a meal
    goals.sodium_mg = { max: 800 }; // General healthy limit per meal

    return {
        ...character,
        targets: goals as MealGoals,
    };
}

/**
 * Scores a meal against the customer's targets and provides feedback.
 */
export function calculateScoreAndFeedback(totals: Nutrients, targets: MealGoals): { score: number; feedback: Record<string, NutrientStatus> } {
    let score = 0;
    const feedback: Record<string, NutrientStatus> = {};
    const MAX_SCORE_PER_NUTRIENT = 25;

    for (const key in targets) {
        const nutrient = key as keyof MealGoals;
        const status = getNutrientStatus(totals[nutrient], targets[nutrient]);
        feedback[nutrient] = status;

        if (status === 'good') {
            score += MAX_SCORE_PER_NUTRIENT;
        } else if (status === 'low') {
            const { min } = targets[nutrient] as { min: number };
            const ratio = totals[nutrient] / min;
            if (ratio > 0.75) score += MAX_SCORE_PER_NUTRIENT * 0.5; // Close
        } else if (status === 'high') {
            const { max } = targets[nutrient] as { max: number };
            const ratio = max / totals[nutrient];
            if (ratio > 0.75) score += MAX_SCORE_PER_NUTRIENT * 0.5; // Close
        }
    }
    
    // Bonus for hitting the calorie sweet spot
    const calStatus = getNutrientStatus(totals.calories_kcal, targets.calories_kcal);
    if(calStatus === 'good') {
        const calTarget = targets.calories_kcal.target;
        const diff = Math.abs(totals.calories_kcal - calTarget);
        if (diff < calTarget * 0.1) { // Within 10% of target
            score += 20;
        }
    }
    
    return { score: Math.round(Math.min(150, score)), feedback };
}


/**
 * Returns a random customer with their generated targets.
 */
export function getNewCustomer(): NutriServeCustomerWithTargets {
    const randomCustomer = CUSTOMER_CHARACTERS[Math.floor(Math.random() * CUSTOMER_CHARACTERS.length)];
    return generateCustomerWithTargets(randomCustomer);
}

/**
 * Simulates a glycemic response curve based on meal composition.
 * A simple model: Carbs increase the peak, while Fiber and Fat flatten and delay it.
 */
export function calculateGlycemicCurve(carbs: number, fiber: number, fat: number): { time: number; rise: number }[] {
    if (carbs === 0) return [{ time: 0, rise: 0 }, { time: 180, rise: 0 }];

    const peakHeight = Math.max(10, carbs * 1.5 - fiber * 3 - fat * 1.5);
    const peakTime = 45 + fiber * 2 + fat * 1; // Fiber and fat delay the peak
    const curve: { time: number; rise: number }[] = [];

    for (let time = 0; time <= 180; time += 10) {
        // Use a bell-like curve formula (Gaussian-like)
        const rise = peakHeight * Math.exp(-Math.pow(time - peakTime, 2) / (2 * Math.pow(40 + fiber, 2)));
        curve.push({ time, rise: Math.max(0, rise) });
    }
    return curve;
}

/**
 * Helper to find the main dish from a customer's required items list.
 */
export function getMainDishFromOrder(requiredItems: string[]): { recipeId: string | null; foodItem: FoodItem } | null {
    if (requiredItems.length === 0) return null;
    
    const allFoodItems = FOOD_LIBRARY.flatMap(group => group.items);
    const foodItem = allFoodItems.find(item => item.id === requiredItems[0]);

    if (!foodItem) return null;

    const recipeId = getRecipeIdForFoodItem(foodItem.id);

    return { foodItem, recipeId };
}