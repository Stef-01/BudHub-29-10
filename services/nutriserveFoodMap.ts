// services/nutriserveFoodMap.ts
/**
 * Maps NutriServe food item IDs to Recipe IDs
 * This allows us to retrieve recipe images for food items
 */
export const FOOD_TO_RECIPE_MAP: Record<string, string> = {
  chana_masala: 'rcp_chana_masala',
  palak_dal: 'rcp_palak_dal',
  masoor_dal: 'rcp_masoor_dal',
  moong_dal_tadka: 'rcp_moong_dal_tadka',
  rajma_masala: 'rcp_rajma_masala',
  sambar: 'rcp_sambar',
  lemon_rice: 'rcp_lemon_rice',
  baingan_bharta: 'rcp_baingan_bharta',
  bhindi_masala: 'rcp_bhindi_masala',
  // Non-mappable items
  roti: 'no-image',
  naan_plain: 'no-image',
  garlic_naan: 'no-image',
  cheese_naan: 'no-image',
};

export function getRecipeIdForFoodItem(foodItemId: string): string | null {
  return FOOD_TO_RECIPE_MAP[foodItemId] || null;
}

export function hasRecipeImage(foodItemId: string): boolean {
  const recipeId = FOOD_TO_RECIPE_MAP[foodItemId];
  return recipeId !== undefined && recipeId !== 'no-image';
}
