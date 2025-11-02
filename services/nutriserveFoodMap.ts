// services/nutriserveFoodMap.ts
/**
 * Maps NutriServe food item IDs to Recipe IDs
 * This allows us to retrieve recipe images for food items
 */
export const FOOD_TO_RECIPE_MAP: Record<string, string> = {
  // Lentils & Curries
  chana_masala: 'rcp_chana_masala',
  chickpea_curry: 'rcp_chickpea_curry',
  palak_dal: 'rcp_palak_dal',
  masoor_dal: 'rcp_masoor_dal',
  moong_dal_tadka: 'rcp_moong_dal_tadka',
  rajma_masala: 'rcp_rajma_masala',
  sambar: 'rcp_sambar',
  paneer_butter_masala: 'rcp_paneer_butter_masala',
  chicken_curry: 'rcp_chicken_curry',
  dal_tadka: 'rcp_dal_tadka',
  
  // Grains
  lemon_rice: 'rcp_lemon_rice',
  veg_biryani: 'rcp_veg_biryani',
  
  // Vegetable Dishes
  baingan_bharta: 'rcp_baingan_bharta',
  bhindi_masala: 'rcp_bhindi_masala',
  palak_paneer: 'rcp_palak_paneer',
  mixed_veg_curry: 'rcp_mixed_veg_curry',
  aloo_gobi: 'rcp_aloo_gobi',
  
  // Breakfast
  poha: 'rcp_poha',
  upma: 'rcp_upma',
  masala_dosa: 'rcp_masala_dosa',
  
  // Treats
  dal_makhani: 'rcp_dal_makhani',
  butter_chicken: 'rcp_butter_chicken',
  
  // Items without recipe images
  roti: 'no-image',
  naan_plain: 'no-image',
  garlic_naan: 'no-image',
  cheese_naan: 'no-image',
  rice_white: 'no-image',
  rice_brown: 'no-image',
  rice_red: 'no-image',
};

export function getRecipeIdForFoodItem(foodItemId: string): string | null {
  return FOOD_TO_RECIPE_MAP[foodItemId] || null;
}

export function hasRecipeImage(foodItemId: string): boolean {
  const recipeId = FOOD_TO_RECIPE_MAP[foodItemId];
  return recipeId !== undefined && recipeId !== 'no-image';
}
