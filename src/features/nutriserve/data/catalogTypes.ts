// Pure data shapes for the generated NutriServe catalog (no React).
// Mirrors the literal fields of FoodItem / Character in components/games/NutriServeTypes.ts.

export interface NutrientsPer100g {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fiber_g: number;
  fat_g: number;
  sodium_mg: number;
}

export type CatalogFoodCategory =
  | 'Grains'
  | 'Lentils & Curries'
  | 'Vegetable Dishes'
  | 'Breads & Breakfast'
  | 'Soups, Salads & Sides'
  | 'Treats';

export interface CatalogFood {
  id: string;
  label: string;
  category: CatalogFoodCategory;
  nutrients_per_100g: NutrientsPer100g;
  isTreat?: boolean;
  density_g_per_ml?: number;
  volume_options_ml?: number[];
  volume_labels?: string[];
  portion_g?: number[];
  portion_labels?: string[];
}

export interface CatalogOrder {
  description: string;
  plateSize: 'Light' | 'Regular' | 'Hearty';
  diabetesMode: 'None' | 'Balanced' | 'Low-Carb';
  required_items: string[];
  healthConditions?: string[];
}

export interface CatalogCustomer {
  id: string;
  name: string;
  order?: CatalogOrder;
  orderVariations?: CatalogOrder[];
  dialogue?: { intro: string; positive: string; neutral: string; negative: string };
}
