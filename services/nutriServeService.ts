// services/nutriServeService.ts
import type { Recipe } from '../types';
// FIX: Added FoodItem, FoodCategory, Order, and ScoreResult to import to resolve module export errors.
import type { FoodItem, FoodCategory, Order, ScoreResult, VisualProps, Nutrients } from '../components/games/NutriServeTypes';
import React from 'react';

// FIX: Added mock visual component to satisfy FoodItem type for what appears to be legacy code.
const MockVisual: React.FC<VisualProps> = () => null;

// FIX: Added placeholder nutrient data to satisfy the Nutrients type.
const mockNutrients: Nutrients = { calories_kcal: 0, protein_g: 0, carbs_g: 0, fiber_g: 0, fat_g: 0, sodium_mg: 0 };

// FIX: Updated data structure to match FoodItem type. Changed 'name' to 'label', removed 'emoji', and added required fields.
export const FOOD_ITEMS: FoodItem[] = [
    // Proteins
    { id: 'chicken', label: 'Chicken', visual: MockVisual, category: 'Lentils & Curries', nutrients_per_100g: mockNutrients },
    { id: 'fish', label: 'Fish', visual: MockVisual, category: 'Lentils & Curries', nutrients_per_100g: mockNutrients },
    { id: 'beans', label: 'Beans', visual: MockVisual, category: 'Lentils & Curries', nutrients_per_100g: mockNutrients },
    { id: 'tofu', label: 'Tofu', visual: MockVisual, category: 'Lentils & Curries', nutrients_per_100g: mockNutrients },
    { id: 'egg', label: 'Egg', visual: MockVisual, category: 'Breads & Breakfast', nutrients_per_100g: mockNutrients },
    // Carbohydrates
    { id: 'rice', label: 'Rice', visual: MockVisual, category: 'Grains', nutrients_per_100g: mockNutrients },
    { id: 'bread', label: 'Bread', visual: MockVisual, category: 'Breads & Breakfast', nutrients_per_100g: mockNutrients },
    { id: 'potato', label: 'Potato', visual: MockVisual, category: 'Vegetable Dishes', nutrients_per_100g: mockNutrients },
    { id: 'pasta', label: 'Pasta', visual: MockVisual, category: 'Grains', nutrients_per_100g: mockNutrients },
    // Vegetables
    { id: 'broccoli', label: 'Broccoli', visual: MockVisual, category: 'Vegetable Dishes', nutrients_per_100g: mockNutrients },
    { id: 'carrot', label: 'Carrot', visual: MockVisual, category: 'Vegetable Dishes', nutrients_per_100g: mockNutrients },
    { id: 'lettuce', label: 'Lettuce', visual: MockVisual, category: 'Soups, Salads & Sides', nutrients_per_100g: mockNutrients },
    { id: 'tomato', label: 'Tomato', visual: MockVisual, category: 'Vegetable Dishes', nutrients_per_100g: mockNutrients },
    { id: 'onion', label: 'Onion', visual: MockVisual, category: 'Vegetable Dishes', nutrients_per_100g: mockNutrients },
    // Fruits
    { id: 'apple', label: 'Apple', visual: MockVisual, category: 'Treats', nutrients_per_100g: mockNutrients },
    { id: 'banana', label: 'Banana', visual: MockVisual, category: 'Treats', nutrients_per_100g: mockNutrients },
    // Fats
    { id: 'avocado', label: 'Avocado', visual: MockVisual, category: 'Soups, Salads & Sides', nutrients_per_100g: mockNutrients },
    { id: 'oil', label: 'Oil', visual: MockVisual, category: 'Soups, Salads & Sides', nutrients_per_100g: mockNutrients },
];

export function generateNewOrder(recipes: Recipe[]): Order | null {
    const mainDishes = recipes.filter(r => r.course === 'main' && (r.imageMetadata?.status === 'cached' || r.imageMetadata?.status === 'generated'));
    if (mainDishes.length === 0) return null;

    const randomRecipe = mainDishes[Math.floor(Math.random() * mainDishes.length)];
    
    return {
        recipeId: randomRecipe.id,
        recipeName: randomRecipe.name,
        recipeCourse: randomRecipe.course,
        highProtein: randomRecipe.high_protein,
        highFiber: randomRecipe.high_fiber,
        lowCarb: randomRecipe.low_carb,
    };
}

export function calculatePlateScore(plate: FoodItem[], order: Order): ScoreResult {
    let score = 0;
    const feedback: string[] = [];
    const categoryCounts = new Map<string, number>();
    plate.forEach(item => {
        // This function seems to use a different category system. We adapt.
        let gameCategory = 'unknown';
        if (['chicken', 'fish', 'beans', 'tofu', 'egg'].includes(item.id)) gameCategory = 'Protein';
        if (['rice', 'bread', 'potato', 'pasta'].includes(item.id)) gameCategory = 'Carbohydrate';
        if (['broccoli', 'carrot', 'lettuce', 'tomato', 'onion'].includes(item.id)) gameCategory = 'Vegetable';
        if (['apple', 'banana'].includes(item.id)) gameCategory = 'Fruit';

        categoryCounts.set(gameCategory, (categoryCounts.get(gameCategory) || 0) + 1);
    });

    const proteinCount = categoryCounts.get('Protein') || 0;
    const carbCount = categoryCounts.get('Carbohydrate') || 0;
    const vegFruitCount = (categoryCounts.get('Vegetable') || 0) + (categoryCounts.get('Fruit') || 0);

    // Balance Score
    if (proteinCount > 0) { score += 30; feedback.push('+30: Protein included!'); } else { feedback.push('Missing a protein source.'); }
    if (carbCount > 0) { score += 20; feedback.push('+20: Energy from carbs!'); } else { feedback.push('A source of carbs for energy would be good.'); }
    if (vegFruitCount > 0) { score += 20; feedback.push('+20: Veggies for vitamins!'); } else { feedback.push('Missing vegetables or fruit.'); }
    if (vegFruitCount > 1) { score += 15; feedback.push('+15: Great veggie variety!'); }

    // Recipe Synergy Bonus
    if (order.highProtein && proteinCount >= 2) { score += 20; feedback.push('+20 Bonus: High protein order fulfilled!'); }
    if (order.highFiber && vegFruitCount >= 2) { score += 20; feedback.push('+20 Bonus: High fiber goal met!'); }
    if (order.lowCarb && carbCount <= 1) { score += 20; feedback.push('+20 Bonus: Low-carb request honored!'); }
    
    // Imbalance Penalty
    if (carbCount > 2) { score -= 15; feedback.push('-15: Too many carbs, less balanced.'); }
    if (proteinCount === 0 && vegFruitCount === 0) { score = 0; feedback.push('Meal is very unbalanced.'); }

    const isPerfect = proteinCount > 0 && carbCount > 0 && vegFruitCount > 1;

    return { score: Math.max(0, score), feedback, isPerfect };
}
