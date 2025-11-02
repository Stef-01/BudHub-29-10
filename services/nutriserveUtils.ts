// services/nutriserveUtils.ts
import type { PlateItem, MealGoals, Nutrients, TargetBand, TargetMin, TargetMax } from '../components/games/NutriServeTypes';
import { MEAL_GOALS } from './nutriserveFoodData';

export type NutrientStatus = 'low' | 'good' | 'high' | 'ok';

export function getNutrientStatus(value: number, target: TargetBand | TargetMin | TargetMax): NutrientStatus {
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
    return 'ok'; // Should not happen
}

export function calculateTotalNutrients(plate: PlateItem[]): Nutrients {
    const totals: Nutrients = {
        calories_kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        fiber_g: 0,
        fat_g: 0,
        sodium_mg: 0,
    };

    plate.forEach(item => {
        const multiplier = item.grams / 100;
        for (const key in totals) {
            const nutrient = key as keyof Nutrients;
            totals[nutrient] += (item.foodItem.nutrients_per_100g[nutrient] || 0) * multiplier;
        }
    });

    return totals;
}

export function generateCustomerTargets(
    plateSize: 'Light' | 'Regular' | 'Hearty',
    diabetesMode: 'None' | 'Balanced' | 'Low-Carb'
): MealGoals {
    const baseGoals = { ...MEAL_GOALS[plateSize] };

    // Macronutrient targets are often based on calories
    const targetCalories = baseGoals.calories_kcal.target;

    let proteinMin_g, carbsMax_g, fatMax_g;

    switch (diabetesMode) {
        case 'Low-Carb':
            // 40% protein, 30% fat, 30% carbs
            proteinMin_g = (targetCalories * 0.40) / 4;
            fatMax_g = (targetCalories * 0.30) / 9;
            carbsMax_g = (targetCalories * 0.30) / 4;
            break;
        case 'Balanced':
            // 30% protein, 30% fat, 40% carbs
            proteinMin_g = (targetCalories * 0.30) / 4;
            fatMax_g = (targetCalories * 0.30) / 9;
            carbsMax_g = (targetCalories * 0.40) / 4;
            break;
        case 'None':
        default:
            // Standard: 20% protein, 30% fat, 50% carbs
            proteinMin_g = (targetCalories * 0.20) / 4;
            fatMax_g = (targetCalories * 0.30) / 9;
            carbsMax_g = (targetCalories * 0.50) / 4;
            break;
    }

    return {
        ...baseGoals,
        protein_g: { min: proteinMin_g },
        carbs_g: { max: carbsMax_g },
        fat_g: { max: fatMax_g },
    };
}
