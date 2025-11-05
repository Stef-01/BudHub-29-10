// services/publicImageLoader.ts

/**
 * OPTIMIZED: Direct file-based image loader for public/dataset folders.
 * Returns URLs immediately without async checks for better React performance.
 * The browser will naturally handle 404s if files don't exist.
 */

import { RECIPE_CATALOG } from '../constants';
import type { Recipe } from '../types';

const FOOD_IMAGES_BASE = '/dataset/food-images/';
const RECIPE_IMAGES_BASE = '/dataset/recipe-images/';

// Prioritized extension order (jpg is most common)
const IMAGE_EXTENSIONS = ['jpg', 'png', 'jpeg', 'webp'];

/**
 * Converts a recipe name to a filename format used in the dataset.
 * Handles various naming patterns found in the food-images folder.
 *
 * Examples:
 * - "Ada Pradhaman" → "Ada_Pradhaman"
 * - "Avial (Mixed Vegetable Curry)" → "Avial__Mixed_Vegetable_Curry_"
 * - "Chana Masala" → "chana_masala" (some files use lowercase)
 *
 * @param name - The recipe display name
 * @returns Filename without extension
 */
function nameToFilename(name: string): string {
    // Replace spaces with underscores
    let filename = name.replace(/\s+/g, '_');

    // Handle parentheses: convert "Name (Description)" to "Name__Description_"
    filename = filename.replace(/\(/g, '__').replace(/\)/g, '_');

    // Clean up any double underscores that might have been created
    // but preserve intentional double underscores from parentheses

    return filename;
}

/**
 * Gets the recipe object from RECIPE_CATALOG by ID
 */
function getRecipeById(recipeId: string): Recipe | undefined {
    return RECIPE_CATALOG.find(r => r.id === recipeId);
}

/**
 * Tries to check if an image exists by attempting to fetch it.
 * Note: This is async but returns quickly due to browser caching.
 */
async function imageExists(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Gets a food image URL from public/dataset/food-images/
 * Tries multiple filename variations to match actual files.
 *
 * @param foodId - The food item ID (e.g., "chana_masala")
 * @param recipeName - Optional recipe display name for better matching
 * @returns Image URL (optimistic)
 */
export async function getFoodImageUrl(foodId: string, recipeName?: string): Promise<string | null> {
    // Try variations in order of likelihood
    const variations = [];

    // If we have a recipe name, try that first (Title_Case_Format)
    if (recipeName) {
        const titleCaseFilename = nameToFilename(recipeName);
        variations.push(titleCaseFilename);
    }

    // Try lowercase with underscores (e.g., chana_masala)
    variations.push(foodId.toLowerCase());

    // Try as-is
    variations.push(foodId);

    // Try each variation with each extension
    for (const variation of variations) {
        for (const ext of IMAGE_EXTENSIONS) {
            const url = `${FOOD_IMAGES_BASE}${variation}.${ext}`;
            console.log(`[getFoodImageUrl] Trying: ${url}`);
            return url; // Return first URL optimistically - browser will handle 404
        }
    }

    // Fallback to first variation
    const url = `${FOOD_IMAGES_BASE}${variations[0]}.jpg`;
    console.log(`[getFoodImageUrl] Fallback URL: ${url}`);
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
 * Unified image retrieval for recipes - ENHANCED VERSION.
 * Returns the most likely image URL immediately, trying multiple filename variations.
 * This handles both ID-based filenames and display-name-based filenames.
 *
 * For recipes starting with "rcp_", strips the prefix and looks in food-images folder.
 * Also tries the recipe's display name as a filename.
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala", "rcp_ada_pradhaman")
 * @returns Image URL (optimistic, browser will validate)
 */
export async function getRecipeImageUrlUnified(recipeId: string): Promise<string | null> {
    console.log(`[getRecipeImageUrlUnified] Looking for image for recipe: ${recipeId}`);

    // Get the full recipe object to access the display name
    const recipe = getRecipeById(recipeId);
    const recipeName = recipe?.name;

    // For recipes starting with "rcp_", strip the prefix
    let foodId = recipeId;
    if (recipeId.startsWith('rcp_')) {
        foodId = recipeId.substring(4); // Remove "rcp_" prefix
    }

    // Priority 1: Try using the recipe display name (most Kerala recipes use this)
    if (recipeName) {
        const nameBasedFilename = nameToFilename(recipeName);
        for (const ext of IMAGE_EXTENSIONS) {
            const url = `${FOOD_IMAGES_BASE}${nameBasedFilename}.${ext}`;
            console.log(`[getRecipeImageUrlUnified] Priority 1 - Name-based: ${url}`);
            return url; // Return optimistically
        }
    }

    // Priority 2: Try using the ID (works for some recipes like chana_masala)
    for (const ext of IMAGE_EXTENSIONS) {
        const url = `${FOOD_IMAGES_BASE}${foodId}.${ext}`;
        console.log(`[getRecipeImageUrlUnified] Priority 2 - ID-based: ${url}`);
        return url; // Return optimistically
    }

    // Fallback
    const optimisticUrl = `${FOOD_IMAGES_BASE}${foodId}.jpg`;
    console.log(`[getRecipeImageUrlUnified] Fallback URL: ${optimisticUrl}`);
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
