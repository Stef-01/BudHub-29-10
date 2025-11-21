// types/cookventure.ts
// Type definitions for Cookventure India - Regional Indian Recipe Discovery

export interface Region {
  id: string;
  name: string;
  name_hi?: string;
  states: string[];
  staple_packs: string[];
  default_masalas: string[];
  default_tadka: string[];
  default_taste: TasteAxes;
  notes: string;
  emoji: string;
}

export interface Masala {
  id: string;
  name: string;
  name_hi?: string;
  region_hint: string[];
  spices: string[];
  aroma: string[];
  description: string;
  refs: string[];
}

export interface Tadka {
  id: string;
  name: string;
  name_hi?: string;
  seeds: string[];
  aromatics: string[];
  oil: string;
  aroma: string;
  heat: number; // 0-3
  region_fit: string[];
  emoji: string;
}

export interface TasteAxes {
  heat: number;    // Teekha (0-3)
  masala: number;  // Masaledar (0-3)
  tangy: number;   // Khata (0-3)
  sweet: number;   // Meetha (0-3)
}

export interface SouringAgent {
  khata_boost: number;
  notes: string;
}

export interface Sweetener {
  meetha_boost: number;
  diabetic_friendly: boolean;
  notes: string;
}

export interface RecipeCookventureData {
  region_tags?: string[];
  masala_profiles?: string[];
  tadka_profiles?: string[];
  taste_axes?: TasteAxes;
}

export interface UserPreferences {
  selectedRegions: string[];
  timeLimit?: number;
  course?: string[];
  pantry: string[];
  tastePrefs: TasteAxes;
  diet: string[];
  avoids: string[];
  masalaLocker: string[];
  favouriteTadkas: string[];
  diabetic_friendly?: boolean;
}

export interface ScoredRecipe {
  recipe: any & RecipeCookventureData; // Will be typed with full Recipe interface later
  score: number;
  explanation: string[];
  missing_ingredients: string[];
  can_swap_tadka: boolean;
  can_swap_masala: boolean;
}

// Type for region data map
export type RegionsMap = Record<string, Omit<Region, 'id'>>;

// Type for masala data map
export type MasalasMap = Record<string, Omit<Masala, 'id'>>;

// Type for tadka data map
export type TadkaMap = Record<string, Omit<Tadka, 'id'>>;

// Type for souring agents map
export type SouringMap = Record<string, SouringAgent>;

// Type for sweeteners map
export type SweetenersMap = Record<string, Sweetener>;

// Scoring weights interface
export interface ScoringWeights {
  pantry: number;
  region: number;
  masala_locker: number;
  tadka: number;
  flavor_axes: number;
  health: number;
}

// Default scoring weights
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  pantry: 45,
  region: 15,
  masala_locker: 15,
  tadka: 10,
  flavor_axes: 10,
  health: 5,
};
