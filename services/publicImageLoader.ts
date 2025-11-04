// services/publicImageLoader.ts

/**
 * OPTIMIZED: Direct file-based image loader for public/dataset folders.
 * Returns URLs immediately without async checks for better React performance.
 * The browser will naturally handle 404s if files don't exist.
 */

const FOOD_IMAGES_BASE = '/dataset/food-images/';
const RECIPE_IMAGES_BASE = '/dataset/recipe-images/';

// Prioritized extension order (jpg is most common)
const IMAGE_EXTENSIONS = ['jpg', 'png', 'jpeg', 'webp'];

/**
 * Gets a food image URL from public/dataset/food-images/
 * Returns the most likely URL (jpg) without verification.
 *
 * @param foodId - The food item ID (e.g., "chana_masala")
 * @returns Image URL (optimistic)
 */
export async function getFoodImageUrl(foodId: string): Promise<string | null> {
    const url = `${FOOD_IMAGES_BASE}${foodId}.jpg`;
    console.log(`[getFoodImageUrl] Optimistic URL: ${url}`);
    return url;
}

/**
 * Gets a recipe image URL from public/dataset/recipe-images/
 * Returns the most likely URL (jpg) without verification.
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala")
 * @returns Image URL (optimistic)
 */
export async function getRecipeImageUrl(recipeId: string): Promise<string | null> {
    const url = `${RECIPE_IMAGES_BASE}${recipeId}.jpg`;
    console.log(`[getRecipeImageUrl] Optimistic URL: ${url}`);
    return url;
}

/**
 * Unified image retrieval for recipes - OPTIMISTIC VERSION.
 * Returns the most likely image URL immediately without async file checks.
 * This avoids React rendering issues caused by async state updates.
 *
 * For recipes starting with "rcp_", strips the prefix and looks in food-images folder.
 * This is where most recipe images are stored.
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala")
 * @returns Image URL (optimistic, browser will validate)
 */
export async function getRecipeImageUrlUnified(recipeId: string): Promise<string | null> {
    console.log(`[getRecipeImageUrlUnified] Looking for image for recipe: ${recipeId}`);

    // For recipes starting with "rcp_", strip the prefix and try food images
    // This is the most common case - food-images folder has images for most recipes
    if (recipeId.startsWith('rcp_')) {
        const foodId = recipeId.substring(4); // Remove "rcp_" prefix
        const optimisticUrl = `${FOOD_IMAGES_BASE}${foodId}.jpg`;
        console.log(`[getRecipeImageUrlUnified] ✓ Optimistic URL: ${optimisticUrl}`);
        return optimisticUrl;
    }

    // For non-rcp recipes, try food images folder
    const optimisticUrl = `${FOOD_IMAGES_BASE}${recipeId}.jpg`;
    console.log(`[getRecipeImageUrlUnified] ✓ Optimistic URL: ${optimisticUrl}`);
    return optimisticUrl;
}

/**
 * Gets a food image URL for NutriServe game.
 * Returns optimistic URL immediately.
 *
 * @param foodId - The food item ID (e.g., "chana_masala")
 * @returns Image URL (optimistic)
 */
export async function getNutriServeFoodImageUrl(foodId: string): Promise<string | null> {
    return getFoodImageUrl(foodId);
}
