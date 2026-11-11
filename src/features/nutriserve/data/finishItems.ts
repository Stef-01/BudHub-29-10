// Finish-station ingredients: drizzles (continuous deposit) and garnishes (discrete pieces).
// They are not in the main food catalog, so their canonical per-100g values live here, rounded
// from USDA FoodData Central "SR Legacy" entries (named per item). Values are approximate and
// for education only; they are not medical guidance. Target amounts are gameplay rules and live,
// versioned, in simulation/params.ts (FINISH_V1).
import type { NutrientsPer100g } from './catalogTypes.ts';

export interface DrizzleDef {
  id: string;
  label: string;
  hi: string;
  nutrients_per_100g: NutrientsPer100g;
  source: string;
  /** Rank needed before orders ask for it. */
  unlockRank: number;
}

export interface GarnishDef {
  id: string;
  label: string;
  hi: string;
  /** Grams per piece placed. */
  pieceG: number;
  nutrients_per_100g: NutrientsPer100g;
  source: string;
  unlockRank: number;
}

export const DRIZZLES: Record<string, DrizzleDef> = {
  curd_swirl: {
    id: 'curd_swirl',
    label: 'Curd swirl',
    hi: 'दही',
    nutrients_per_100g: { calories_kcal: 61, protein_g: 3.5, carbs_g: 4.7, fiber_g: 0, fat_g: 3.3, sodium_mg: 46 },
    source: 'USDA SR Legacy 01116, yogurt, plain, whole milk',
    unlockRank: 1,
  },
  ghee_tadka: {
    id: 'ghee_tadka',
    label: 'Ghee tadka',
    hi: 'घी तड़का',
    nutrients_per_100g: { calories_kcal: 876, protein_g: 0.3, carbs_g: 0, fiber_g: 0, fat_g: 99.5, sodium_mg: 2 },
    source: 'USDA SR Legacy 01003, butter oil, anhydrous (ghee)',
    unlockRank: 2,
  },
};

export const GARNISHES: Record<string, GarnishDef> = {
  coriander: {
    id: 'coriander',
    label: 'Coriander',
    hi: 'धनिया',
    pieceG: 1,
    nutrients_per_100g: { calories_kcal: 23, protein_g: 2.1, carbs_g: 3.7, fiber_g: 2.8, fat_g: 0.5, sodium_mg: 46 },
    source: 'USDA SR Legacy 11165, coriander (cilantro) leaves, raw',
    unlockRank: 1,
  },
  onion: {
    id: 'onion',
    label: 'Onion rings',
    hi: 'प्याज़',
    pieceG: 5,
    nutrients_per_100g: { calories_kcal: 40, protein_g: 1.1, carbs_g: 9.3, fiber_g: 1.7, fat_g: 0.1, sodium_mg: 4 },
    source: 'USDA SR Legacy 11282, onions, raw',
    unlockRank: 1,
  },
  lemon: {
    id: 'lemon',
    label: 'Lemon wedge',
    hi: 'नींबू',
    pieceG: 7,
    nutrients_per_100g: { calories_kcal: 29, protein_g: 1.1, carbs_g: 9.3, fiber_g: 2.8, fat_g: 0.3, sodium_mg: 2 },
    source: 'USDA SR Legacy 09150, lemons, raw, without peel',
    unlockRank: 2,
  },
  green_chilli: {
    id: 'green_chilli',
    label: 'Green chilli',
    hi: 'हरी मिर्च',
    pieceG: 3,
    nutrients_per_100g: { calories_kcal: 40, protein_g: 2, carbs_g: 9.5, fiber_g: 1.5, fat_g: 0.2, sodium_mg: 7 },
    source: 'USDA SR Legacy 11670, peppers, hot chili, green, raw',
    unlockRank: 3,
  },
  pomegranate: {
    id: 'pomegranate',
    label: 'Pomegranate',
    hi: 'अनार',
    pieceG: 2,
    nutrients_per_100g: { calories_kcal: 83, protein_g: 1.7, carbs_g: 18.7, fiber_g: 4, fat_g: 1.2, sodium_mg: 3 },
    source: 'USDA SR Legacy 09286, pomegranates, raw',
    unlockRank: 4,
  },
};
