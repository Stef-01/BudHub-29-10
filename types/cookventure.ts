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
  use_in?: string[];
  /** How the blend pushes each flavor axis (0-3); used when swapping one masala for another */
  taste_effect?: TasteAxes;
  /** Blends that make a natural substitute */
  swaps_well_with?: string[];
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
  /** Short, step-by-step tempering instructions */
  method?: string;
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
  /** Finer-grained cuisine ids from subregions.json, e.g. "kerala", "chettinad" */
  subregion_tags?: string[];
  masala_profiles?: string[];
  tadka_profiles?: string[];
  taste_axes?: TasteAxes;
}

export interface UserPreferences {
  cravings: string[];
  selectedRegions: string[];
  /** Sub-regions (subregions.json) picked under the selected regions */
  selectedSubregions?: string[];
  /** Minutes available (prep + cook); undefined = no limit */
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

/** Which part of the scoring algorithm a reason or score component came from */
export type MatchReasonKind =
  | 'pantry'
  | 'region'
  | 'masala'
  | 'tadka'
  | 'flavor'
  | 'health'
  | 'diet'
  | 'quick'
  | 'course';

/** A human-readable reason a recipe matched, rendered as an icon chip */
export interface MatchReason {
  kind: MatchReasonKind;
  label: string;
}

/** Points earned by one part of the scoring algorithm */
export interface ScoreComponent {
  kind: MatchReasonKind;
  label: string;
  points: number;
  maxPoints: number;
  detail?: string;
}

export interface ScoredRecipe {
  recipe: any & RecipeCookventureData; // Will be typed with full Recipe interface later
  score: number;
  /** Highest score this recipe could have reached with the user's current preferences */
  maxScore: number;
  /** score / maxScore as a whole-number percentage (0-100) */
  matchPercent: number;
  /** Plain-text reasons, kept for callers that only need strings */
  explanation: string[];
  reasons: MatchReason[];
  breakdown: ScoreComponent[];
  matched_ingredients: string[];
  missing_ingredients: string[];
  can_swap_tadka: boolean;
  can_swap_masala: boolean;
  /** True when a strict diet or allergen rules the recipe out */
  excluded?: boolean;
  exclusion_reasons?: string[];
  /** Worth-knowing notes for the user's diet, e.g. "use gluten-free hing" */
  cautions?: string[];
  /** Set when the user swapped the recipe's tadka on the results screen */
  swapped_tadka?: {
    from?: string;
    to: string;
    tempering_note: string;
  };
  /** Set when the user swapped a masala on the results screen */
  swapped_masala?: { from: string; to: string };
  /** Set when the lower-sugar adapter was applied: each ingredient line and its replacement */
  sugar_swaps?: Array<{ from: string; to: string }>;
  sugar_tip?: string;
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
  diet: number;
  time: number;
  course: number;
}

// Default scoring weights
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  pantry: 45,
  region: 15,
  masala_locker: 15,
  tadka: 10,
  flavor_axes: 10,
  health: 5,
  diet: 10,
  time: 5,
  course: 5,
};
