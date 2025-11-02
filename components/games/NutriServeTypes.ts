// components/games/NutriServeTypes.ts
import React from 'react';

// Core Nutritional Data
export interface Nutrients {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fiber_g: number;
    fat_g: number;
    sodium_mg: number;
}

// Visual component props
export interface VisualProps {
    volume_ml?: number;
    grams?: number;
    className?: string;
}

// Individual food items available in the library
export type FoodCategory = 
    | 'Grains'
    | 'Lentils & Curries'
    | 'Vegetable Dishes'
    | 'Breads & Breakfast'
    | 'Soups, Salads & Sides'
    | 'Treats';

export interface FoodItem {
    id: string;
    label: string;
    category: FoodCategory;
    visual: React.FC<VisualProps>;
    nutrients_per_100g: Nutrients;
    isTreat?: boolean;
    // For items measured by volume
    density_g_per_ml?: number;
    volume_options_ml?: number[];
    volume_labels?: string[];
    // For items measured by portion
    portion_g?: number[];
    portion_labels?: string[];
}

// A group of food items for the library UI
export interface FoodGroup {
    name: FoodCategory;
    items: FoodItem[];
}

// An item that has been added to the player's plate
export interface PlateItem {
    instanceId: string; // Unique ID for this specific item on the plate
    foodItem: FoodItem;
    grams: number;
}

// Nutritional Targets
export interface TargetBand {
    min: number;
    max: number;
    target: number;
}

export interface TargetMin {
    min: number;
}

export interface TargetMax {
    max: number;
}

// FIX: Export the 'Target' union type to resolve an import error.
export type Target = TargetBand | TargetMin | TargetMax;

export interface MealGoals {
    calories_kcal: TargetBand;
    protein_g: TargetMin;
    carbs_g: TargetMax;
    fat_g: TargetMax;
    fiber_g: TargetMin;
    sodium_mg: TargetMax;
}

// Customer and Order
export interface CustomerOrder {
    description: string;
    plateSize: 'Light' | 'Regular' | 'Hearty';
    diabetesMode: 'None' | 'Balanced' | 'Low-Carb';
    required_items: string[];
}

export interface Character {
    id: string;
    name: string;
    visuals: {
        default: React.FC;
        happy: React.FC;
        sad: React.FC;
    };
    order: CustomerOrder;
    dialogue: {
        intro: string;
        positive: string;
        neutral: string;
        negative: string;
    };
}

export interface NutriServeCustomerWithTargets extends Character {
    targets: MealGoals;
}

// Types from legacy service, kept for compatibility if needed.
export type ScoreResult = {
    score: number;
    feedback: string[];
    isPerfect: boolean;
};

export type Order = {
    recipeId: string;
    recipeName: string;
    recipeCourse: string;
    highProtein: boolean;
    highFiber: boolean;
    lowCarb: boolean;
};