// services/nutriserveUtils.ts
import type { Nutrients, MealGoals, TargetBand, TargetMin, TargetMax, CustomerOrder, FoodItem, PlateItem } from '../components/games/NutriServeTypes';
import { FOOD_DATA, MEAL_GOALS } from './nutriserveFoodData';
import { getRecipeIdForFoodItem } from './nutriserveFoodMap';

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
    return 'ok';
}

export function calculateTotalNutrients(plateItems: PlateItem[]): Nutrients {
    const totals: Nutrients = { calories_kcal: 0, protein_g: 0, carbs_g: 0, fiber_g: 0, fat_g: 0, sodium_mg: 0 };
    for (const item of plateItems) {
        const multiplier = item.grams / 100;
        for (const key of Object.keys(totals) as (keyof Nutrients)[]) {
            totals[key] += item.foodItem.nutrients_per_100g[key] * multiplier;
        }
    }
    return totals;
}

export function generateCustomerGoals(order: CustomerOrder): MealGoals {
    const baseGoals = MEAL_GOALS[order.plateSize];
    let protein_g: TargetMin;
    let carbs_g: TargetMax;
    let fat_g: TargetMax;

    switch (order.diabetesMode) {
        case 'Low-Carb':
            protein_g = { min: baseGoals.calories_kcal.target * 0.3 / 4 }; // 30% from protein
            carbs_g = { max: baseGoals.calories_kcal.target * 0.25 / 4 }; // 25% from carbs
            fat_g = { max: baseGoals.calories_kcal.target * 0.45 / 9 }; // 45% from fat
            break;
        case 'Balanced':
            protein_g = { min: baseGoals.calories_kcal.target * 0.20 / 4 }; // 20%
            carbs_g = { max: baseGoals.calories_kcal.target * 0.45 / 4 }; // 45%
            fat_g = { max: baseGoals.calories_kcal.target * 0.35 / 9 }; // 35%
            break;
        case 'None':
        default:
            protein_g = { min: baseGoals.calories_kcal.target * 0.15 / 4 }; // 15%
            carbs_g = { max: baseGoals.calories_kcal.target * 0.55 / 4 }; // 55%
            fat_g = { max: baseGoals.calories_kcal.target * 0.30 / 9 }; // 30%
            break;
    }

    return { ...baseGoals, protein_g, carbs_g, fat_g };
}

export function calculateScoreAndFeedback(totals: Nutrients, targets: MealGoals): { score: number; feedback: Record<string, NutrientStatus> } {
    let score = 0;
    const feedback: Record<string, NutrientStatus> = {};

    const nutrientKeys: (keyof MealGoals)[] = ['calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg'];
    
    for (const key of nutrientKeys) {
        const status = getNutrientStatus(totals[key as keyof Nutrients], targets[key]);
        feedback[key] = status;
        if (status === 'good') {
            score += 20;
        } else if (status === 'high' && (key === 'carbs_g' || key === 'fat_g' || key === 'sodium_mg')) {
            score -= 10;
        } else if (status === 'low' && (key === 'protein_g' || key === 'fiber_g')) {
            score -= 10;
        }
    }
    
    // Bonus for hitting calorie target band
    if (feedback.calories_kcal === 'good') { score += 20; }
    else { score -= 15; }

    return { score: Math.max(0, Math.round(score)), feedback };
}

export function calculateGlycemicCurve(carbs: number, fiber: number, fat: number): { time: number; rise: number }[] {
    if (carbs === 0) {
        return Array.from({ length: 19 }, (_, i) => ({ time: i * 10, rise: 0 }));
    }

    const peakTime = 45 + (fiber * 2) + (fat * 1.5);
    const peakHeight = Math.max(10, carbs * 1.8 - (fiber * 3) - (fat * 2));
    const duration = 120 + (fiber * 4) + (fat * 3);

    const points: { time: number; rise: number }[] = [];
    for (let time = 0; time <= 180; time += 10) {
        let rise = 0;
        if (time <= duration) {
            const progress = time / duration;
            const positionRelativeToPeak = time / peakTime;

            if (time <= peakTime) {
                rise = peakHeight * Math.sin((Math.PI / 2) * positionRelativeToPeak);
            } else {
                rise = peakHeight * Math.cos(((time - peakTime) / (duration - peakTime)) * (Math.PI / 2));
            }
        }
        points.push({ time, rise: Math.max(0, rise) });
    }
    return points;
}

export function getMainDishFromOrder(requiredItems: string[]): { foodItem: FoodItem, recipeId: string | null } | null {
    if (!requiredItems || requiredItems.length === 0) return null;

    const mainDishId = requiredItems[0];
    const foodItem = FOOD_DATA.find(item => item.id === mainDishId);
    if (!foodItem) return null;
    
    const recipeId = getRecipeIdForFoodItem(mainDishId);

    return { foodItem, recipeId };
}
