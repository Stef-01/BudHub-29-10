// services/publicImageLoader.ts

/**
 * OPTIMIZED: Direct file-based image loader for public/dataset folders.
 * Returns URLs immediately without async checks for better React performance.
 * The browser will naturally handle 404s if files don't exist.
 */

import { RECIPE_CATALOG } from '../constants';
import type { Recipe } from '../types';
import { getRecipeImageFilename } from './recipeImageMap';

const FOOD_IMAGES_BASE = '/dataset/food-images/';
const RECIPE_IMAGES_BASE = '/dataset/recipe-images/';

// Prioritized extension order (jpg is most common)
const IMAGE_EXTENSIONS = ['jpg', 'png', 'jpeg', 'webp'];

/**
 * Converts a recipe name to multiple filename variations used in the dataset.
 * The dataset uses inconsistent naming conventions, so we generate multiple candidates.
 *
 * Examples:
 * - "Ada Pradhaman" → ["Ada_Pradhaman", "ada_pradhaman"]
 * - "Avial (Mixed Vegetable Curry)" → ["Avial__Mixed_Vegetable_Curry_", "avial__mixed_vegetable_curry_"]
 * - "Beans & Carrot" → ["Beans_&_Carrot", "Beans___Carrot", "Beans-_-Carrot"]
 *
 * @param name - The recipe display name
 * @returns Array of possible filename variations (without extension)
 */
function nameToFilenameVariations(name: string): string[] {
    const variations: string[] = [];

    // Variation 1: Title Case with underscores, parens as __ and _
    // "Avial (Mixed Vegetable Curry)" → "Avial__Mixed_Vegetable_Curry_"
    let v1 = name.replace(/\s+/g, '_');
    v1 = v1.replace(/\(/g, '__').replace(/\)/g, '_');
    variations.push(v1);

    // Variation 2: Same as v1 but lowercase
    variations.push(v1.toLowerCase());

    // Variation 3: Replace ampersand with triple underscore
    // "Beans & Carrot" → "Beans___Carrot"
    if (name.includes('&')) {
        const v3 = name.replace(/\s*&\s*/g, '___');
        const v3_formatted = v3.replace(/\s+/g, '_').replace(/\(/g, '__').replace(/\)/g, '_');
        variations.push(v3_formatted);
        variations.push(v3_formatted.toLowerCase());
    }

    // Variation 4: Replace spaces with hyphens (some files use this)
    // "Carrot Payasam" → "Carrot-Payasam"
    const v4 = name.replace(/\s+/g, '-');
    const v4_formatted = v4.replace(/\(/g, '-_').replace(/\)/g, '_');
    variations.push(v4_formatted);
    variations.push(v4_formatted.toLowerCase());

    // Variation 5: Keep spaces (some images have spaces)
    variations.push(name);
    variations.push(name.toLowerCase());

    // Variation 6: Replace special characters
    // "Rice–Lentil" → "Rice_Lentil" (em dash)
    const v6 = name.replace(/[–—]/g, '_').replace(/\s+/g, '_');
    const v6_formatted = v6.replace(/\(/g, '__').replace(/\)/g, '_');
    if (v6_formatted !== v1) {
        variations.push(v6_formatted);
        variations.push(v6_formatted.toLowerCase());
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(variations));
}

/**
 * Helper function that returns the primary filename variation for a recipe name.
 * Used for simple single-file lookups.
 */
function nameToFilename(name: string): string {
    const variations = nameToFilenameVariations(name);
    return variations[0]; // Return the first (most likely) variation
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
            const exists = await imageExists(url);
            if (exists) {
                console.log(`[getFoodImageUrl] ✓ Found image: ${url}`);
                return url;
            }
        }
    }

    // No image found
    console.log(`[getFoodImageUrl] No image found for ${foodId}`);
    return null;
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
 * Unified image retrieval for recipes - ENHANCED VERSION WITH STATIC MAPPING.
 * Uses a static map for known recipes, then falls back to pattern matching.
 * This ensures consistent and reliable image loading across the application.
 *
 * @param recipeId - The recipe ID (e.g., "rcp_chana_masala", "rcp_ada_pradhaman")
 * @returns Image URL that points to the correct file in public/dataset/food-images/
 */
export async function getRecipeImageUrlUnified(recipeId: string): Promise<string | null> {
    console.log(`[getRecipeImageUrlUnified] Looking for image for recipe: ${recipeId}`);

    // PRIORITY 1: Check static mapping (most reliable)
    const mappedFilename = getRecipeImageFilename(recipeId);
    if (mappedFilename) {
        // Try each extension for the mapped filename
        for (const ext of IMAGE_EXTENSIONS) {
            const url = `${FOOD_IMAGES_BASE}${mappedFilename}.${ext}`;
            const exists = await imageExists(url);
            if (exists) {
                console.log(`[getRecipeImageUrlUnified] ✓ Found image: ${url}`);
                return url;
            }
        }
    }

    // PRIORITY 2: Fallback to pattern matching for unmapped recipes
    console.log(`[getRecipeImageUrlUnified] No mapping found, trying pattern matching...`);

    // Get the full recipe object to access the display name
    const recipe = getRecipeById(recipeId);
    const recipeName = recipe?.name;

    // For recipes starting with "rcp_", strip the prefix
    let foodId = recipeId;
    if (recipeId.startsWith('rcp_')) {
        foodId = recipeId.substring(4); // Remove "rcp_" prefix
    }

    // Try using the recipe display name with variations
    if (recipeName) {
        const nameVariations = nameToFilenameVariations(recipeName);

        // Try first variation only (to avoid too many failed requests)
        const firstVariation = nameVariations[0];
        for (const ext of IMAGE_EXTENSIONS) {
            const url = `${FOOD_IMAGES_BASE}${firstVariation}.${ext}`;
            const exists = await imageExists(url);
            if (exists) {
                console.log(`[getRecipeImageUrlUnified] ✓ Found image: ${url}`);
                return url;
            }
        }
    }

    // Try using the ID (lowercase)
    const foodIdLower = foodId.toLowerCase();
    for (const ext of IMAGE_EXTENSIONS) {
        const url = `${FOOD_IMAGES_BASE}${foodIdLower}.${ext}`;
        const exists = await imageExists(url);
        if (exists) {
            console.log(`[getRecipeImageUrlUnified] ✓ Found image: ${url}`);
            return url;
        }
    }

    // Fallback - return null to use emoji
    console.log(`[getRecipeImageUrlUnified] No image found, will use emoji fallback`);
    return null;
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
