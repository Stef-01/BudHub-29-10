// FIX: Defined DayOfWeek directly to resolve circular dependency error.
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// types.ts

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

export type PlantCategory = "Vegetable" | "Fruit" | "Herb" | "Flower" | "Berry or Vine";
export type PlantPhenology = "Seedling" | "Vegetative" | "Flowering" | "Fruiting" | "Harvest" | "Dormant";

export interface Plant {
    id: number;
    name: string;
    icon: string;
    category: PlantCategory;
    phenology: PlantPhenology;
    fruitingMonths: string[]; // e.g., ['Jan', 'Feb']
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
    title: string;
    message: string;
    severity: 'Warning' | 'Critical';
}

export type Tab = 'Garden' | 'Tasks' | 'Recipes' | 'Events';

export interface Recipe {
    id: string;
    name: string;
    image: string; // Can be URL or emoji
    imageSource?: 'unsplash' | 'user' | 'emoji' | 'preloaded'; // Track where image came from
    imageLoading?: boolean; // Track loading state
    course: 'main' | 'side' | 'breakfast' | 'snack' | 'soup' | 'condiment' | 'beverage';
    diet_tags: string[];
    spice_level: number;
    prep_minutes: number;
    cook_minutes: number;
    servings: number;
    diabetic_friendly: boolean;
    high_fiber: boolean;
    high_protein: boolean;
    low_carb: boolean;
    gluten_free: boolean;
    source: 'preloaded' | 'user' | 'gemini';
    keyIngredients: string[];
    // For simplicity in this app, ingredients and instructions are strings
    ingredients: string;
    instructions: string;
}


export interface CommunityEvent {
    id: number;
    name: string;
    date: string;
    location: string;
    description: string;
}