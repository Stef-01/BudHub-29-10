// types.ts

// --- Core App Navigation ---
export type Tab = 'Homepage' | 'Garden' | 'Tasks' | 'Recipes' | 'Events' | 'Games';

// --- Garden & Plants ---
export type PlantPhenology = 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvest';

export interface Plant {
  id: number;
  name: string;
  icon: string;
  category: string;
  phenology: PlantPhenology | string;
  fruitingMonths: string[];
}

// --- Weather ---
export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

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

export type AlertSeverity = 'Warning' | 'Critical';
export type AlertType = 'Heatwave' | 'Frost';

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}

// --- Tasks ---
export type TaskCategory = 'Watering' | 'Feeding' | 'Pest Control' | 'Protection' | 'Maintenance' | 'Mulching' | 'Fruiting Support';
export type TaskPriority = 'Low' | 'Medium' | 'High';
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

// --- Recipes & Cookbook ---
export interface ImageMetadata {
  source: 'ai_generated' | 'user_upload' | 'preloaded' | 'user' | 'emoji' | 'content_addressed';
  status: 'pending' | 'generated' | 'cached' | 'failed';
  image_key?: string;
  errorMessage?: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string; // Emoji or URL
  course: 'main' | 'side' | 'snack' | 'soup' | 'beverage' | 'breakfast' | 'condiment';
  diet_tags: string[];
  spice_level: 0 | 1 | 2 | 3;
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
  // Cookventure India fields
  region_tags?: string[];
  masala_profiles?: string[];
  tadka_profiles?: string[];
  taste_axes?: {
    heat: number;      // Teekha (0-3)
    masala: number;    // Masaledar (0-3)
    tangy: number;     // Khata (0-3)
    sweet: number;     // Meetha (0-3)
  };
}

// --- Community ---
export interface CommunityEvent {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
}

// --- Games ---
export type GameMode = 'diabetic_friendly' | 'high_protein' | 'high_fiber' | 'low_carb' | 'nutriserve' | 'unified_nutrient';

export interface GameScore {
  id: number;
  gameMode: GameMode;
  score: number;
  date: string; // ISO string
}

export interface GameQuestion {
  options: Recipe[];
  correctAnswerId: string;
}
