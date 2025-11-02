// services/nutriserveUtils.ts
import type {
  Nutrients,
  MealGoals,
  TargetBand,
  TargetMin,
  TargetMax,
  CustomerOrder,
  PlateItem,
} from '../components/games/NutriServeTypes';
// FIX: Corrected import path casing.
import { FOOD_DATA } from './nutriServeFoodData';
import { getRecipeIdForFoodItem } from './nutriserveFoodMap';

export type NutrientStatus = 'low' | 'good' | 'high' | 'ok';

export function getNutrientStatus(value: number, target: TargetBand | TargetMin | TargetMax): NutrientStatus {
  if ('min' in target && 'max' in target) { // TargetBand
    if (value < target.min) return 'low';
    if (value > target.max) return 'high';
    return 'good';
  } else if ('min' in target) { // TargetMin
    return value >= target.min ? 'good' : 'low';
  } else if ('max' in target) { // TargetMax
    return value <= target.max ? 'good' : 'high';
  }
  return 'ok';
}

export function calculateTotalNutrients(plateItems: PlateItem[]): Nutrients {
  const totals: Nutrients = {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fiber_g: 0,
    fat_g: 0,
    sodium_mg: 0,
  };

  plateItems.forEach(item => {
    const { nutrients_per_100g } = item.foodItem;
    const multiplier = item.grams / 100;
    totals.calories_kcal += nutrients_per_100g.calories_kcal * multiplier;
    totals.protein_g += nutrients_per_100g.protein_g * multiplier;
    totals.carbs_g += nutrients_per_100g.carbs_g * multiplier;
    totals.fiber_g += nutrients_per_100g.fiber_g * multiplier;
    totals.fat_g += nutrients_per_100g.fat_g * multiplier;
    totals.sodium_mg += nutrients_per_100g.sodium_mg * multiplier;
  });

  return totals;
}


export function calculateGlycemicCurve(carbs: number, fiber: number, fat: number): { time: number; rise: number }[] {
    const points = 30;
    const duration = 180; // 3 hours

    if (carbs === 0) {
        return Array.from({ length: points + 1 }, (_, i) => ({ time: i * (duration / points), rise: 0 }));
    }

    // Baseline GI for carbs, let's assume a moderate GI of 60 for an average meal
    const baseGI = 60;
    
    // Fiber and fat "flatten the curve"
    // Each gram of fiber reduces the effective GI
    const fiberFactor = Math.max(0.4, 1 - (fiber / 25)); // Fiber is very effective
    // Each gram of fat also slows absorption
    const fatFactor = Math.max(0.6, 1 - (fat / 50)); // Fat is less effective than fiber

    const effectiveGI = baseGI * fiberFactor * fatFactor;
    
    // Higher GI means a higher, faster peak. Lower GI means a lower, slower peak.
    const peakHeight = (effectiveGI / 100) * (carbs * 1.8);
    const peakTime = 45 + (100 - effectiveGI) * 0.3; // Lower GI shifts peak to the right

    const curveData: { time: number; rise: number }[] = [];
    for (let i = 0; i <= points; i++) {
        const time = i * (duration / points);
        // A simple gamma distribution-like function to model the curve
        const rise = peakHeight * (time / peakTime) * Math.exp(1 - (time / peakTime));
        curveData.push({ time, rise: Math.max(0, rise) });
    }

    return curveData;
}

export function getMainDishFromOrder(requiredItems: string[]) {
    if (requiredItems.length === 0) return null;
    const mainDishId = requiredItems[0];
    const foodItem = FOOD_DATA.find(item => item.id === mainDishId);
    if (!foodItem) return null;
    
    const recipeId = getRecipeIdForFoodItem(foodItem.id);
    return { foodItem, recipeId };
}
