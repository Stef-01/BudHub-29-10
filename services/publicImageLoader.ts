// services/publicImageLoader.ts

/**
 * Simple file-based image loader for public/dataset folders.
 * No SQLite, no upload needed - just direct file access.
 */

const FOOD_IMAGES_BASE = '/dataset/food-images/';
const RECIPE_IMAGES_BASE = '/dataset/recipe-images/';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Checks if an image exists at the given path.
 */
async function imageExists(path: string): Promise<boolean> {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Tries to find an image for a given ID with any supported extension.
 * Returns the URL if found, null otherwise.
 */
async function findImageWithExtension(basePath: string, id: string): Promise<string | null> {
    for (const ext of IMAGE_EXTENSIONS) {
        const url = `${basePath}${id}.${ext}`;
        if (await imageExists(url)) {
            console.log(`Found image: ${url}`);
            return url;
        }
    }
    return null;
}

/**
 * Gets a food image URL from public/dataset/food-images/
 *
 * @param foodId - The food item ID (e.g., "chana_masala")
 * @returns Image URL or null if not found
 */
export async function getFoodImageUrl(foodId: string): Promise<string | null> {
    return findImageWithExtension(FOOD_IMAGES_BASE, foodId);
}

/**
 * Gets a recipe image URL from public/dataset/recipe-images/
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala")
 * @returns Image URL or null if not found
 */
export async function getRecipeImageUrl(recipeId: string): Promise<string | null> {
    return findImageWithExtension(RECIPE_IMAGES_BASE, recipeId);
}

/**
 * Unified image retrieval for recipes.
 * Checks food images first (with prefix stripping), then recipe images.
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala")
 * @returns Image URL or null if not found
 */
export async function getRecipeImageUrlUnified(recipeId: string): Promise<string | null> {
    // 1. Try recipe images folder first (exact match)
    let imageUrl = await getRecipeImageUrl(recipeId);
    if (imageUrl) return imageUrl;

    // 2. Try food images folder with prefix stripping
    // Recipe IDs use "rcp_<name>", food IDs use "<name>"
    if (recipeId.startsWith('rcp_')) {
        const foodId = recipeId.substring(4); // Remove "rcp_" prefix
        imageUrl = await getFoodImageUrl(foodId);
        if (imageUrl) {
            console.log(`Recipe ${recipeId} using food image for ${foodId} (unified system)`);
            return imageUrl;
        }
    }

    // 3. Try exact match in food images (in case recipe ID format matches food ID)
    imageUrl = await getFoodImageUrl(recipeId);
    if (imageUrl) return imageUrl;

    return null;
}

/**
 * Gets a food image URL for NutriServe game.
 *
 * @param foodId - The food item ID (e.g., "chana_masala")
 * @returns Image URL or null if not found
 */
export async function getNutriServeFoodImageUrl(foodId: string): Promise<string | null> {
    return getFoodImageUrl(foodId);
}
