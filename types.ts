import type { DayOfWeek, PlantCategory, Phenology, ImageMetadata, TaskCategory, TaskPriority, MovementProfile, Alert, Tab, GameMode, GameQuestion, GameScore } from './types';
// types.ts

export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export type Phenology = "Dormant" | "Vegetative" | "Flowering" | "Fruiting" | "Harvest";

export type PlantCategory = "Fruit" | "Vegetable" | "Herb" | "Berry or Vine" | "Flower";

export interface Plant {
    id: number;
    name: string;
    icon: string;
    category: PlantCategory;
    phenology: Phenology;
    fruitingMonths: string[];
}

export interface ImageMetadata {
    source: 'emoji' | 'preloaded' | 'user' | 'user_upload' | 'ai_generated' | 'content_addressed';
    status: 'pending' | 'generated' | 'failed' | 'cached';
    errorMessage?: string;
    image_key?: string; // a content-address for the image
}

export interface Recipe {
    id: string;
    name: string;
    image: string; // emoji or URL
    course: 'main' | 'side' | 'breakfast' | 'snack' | 'soup' | 'condiment' | 'beverage';
    diet_tags: string[];
    spice_level: 0 | 1 | 2 | 3; // mild, spicy, hot, fiery
    prep_minutes: number;
    cook_minutes: number;
    servings: number;
    diabetic_friendly: boolean;
    high_fiber: boolean;
    high_protein: boolean;
    low_carb: boolean;
    gluten_free: boolean;
    protein_grams?: number;
    fiber_grams?: number;
    carbs_grams?: number;
    source: 'preloaded' | 'user' | 'gemini';
    keyIngredients: string[];
    ingredients: string;
    instructions: string;
    imageMetadata?: ImageMetadata;
}

export interface CommunityEvent {
    id: number;
    name: string;
    date: string;
    location: string;
    description: string;
}

export interface Weather {
    location: {
        name: string;
        region: string;
    };
    current: {
        tempC: number;
        humidity: number;
        precipMM: number;
        condition: string;
        windKPH: number;
    };
    forecast: {
        day: DayOfWeek;
        maxTempC: number;
        minTempC: number;
        chanceOfRain: number;
        condition: string;
    }[];
}

export type TaskCategory = 'Watering' | 'Feeding' | 'Pest Control' | 'Protection' | 'Maintenance' | 'Mulching' | 'Fruiting Support';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export type MovementProfile = 'hinge_and_squat' | 'light_standing' | 'carry_push' | 'stretch_reach';

export interface Task {
    id: string;
    plantId: number | null;
    day: DayOfWeek;
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    movement: MovementProfile;
    isCompleted: boolean;
}

export interface Alert {
    type: 'Heatwave' | 'Frost';
    severity: 'Warning' | 'Critical';
    title: string;
    message: string;
}

export type Tab = 'Garden' | 'Tasks' | 'Recipes' | 'Events' | 'Games';

export type GameMode = 'diabetic_friendly' | 'high_protein' | 'high_fiber' | 'low_carb';

export interface GameQuestion {
    options: Recipe[];
    correctAnswerId: string;
}

export interface GameScore {
    gameMode: GameMode;
    score: number;
    date: string;
    id?: number;
}