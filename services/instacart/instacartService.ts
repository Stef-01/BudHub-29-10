// services/instacart/instacartService.ts
// Instacart integration service for adding recipe ingredients to cart

import type { Recipe, InstacartIngredient } from '../../types';
import { parseIngredientsFromRecipe } from './ingredientMapper';

/**
 * Generates an Instacart cart URL with pre-filled items
 * Note: Instacart's public API is limited. This uses URL-based cart population.
 */
export function generateInstacartCartUrl(ingredients: InstacartIngredient[]): string {
    // Instacart doesn't have a public cart API, but we can generate search URLs
    // The user will need to manually add items, but we can help by opening searches

    // For now, we'll create a URL that opens Instacart with a search for the first few items
    // In production, you'd integrate with Instacart's Partner API if available

    const baseUrl = 'https://www.instacart.com/store/search';

    if (ingredients.length === 0) {
        return baseUrl;
    }

    // Take the first ingredient as the primary search term
    const searchTerm = ingredients[0].searchTerm || ingredients[0].name;
    const encodedSearch = encodeURIComponent(searchTerm);

    return `${baseUrl}?q=${encodedSearch}`;
}

/**
 * Generates multiple Instacart search URLs, one for each ingredient
 * Returns an array of objects with ingredient name and URL
 */
export function generateInstacartSearchUrls(ingredients: InstacartIngredient[]): Array<{
    ingredient: string;
    url: string;
}> {
    return ingredients.map(ingredient => {
        const searchTerm = ingredient.searchTerm || ingredient.name;
        const encodedSearch = encodeURIComponent(searchTerm);
        return {
            ingredient: `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`,
            url: `https://www.instacart.com/store/search?q=${encodedSearch}`
        };
    });
}

/**
 * Generates a shareable shopping list text for Instacart
 * Can be copied and pasted or shared via other methods
 */
export function generateShoppingListText(ingredients: InstacartIngredient[]): string {
    const header = "Shopping List from BudHub:\n\n";
    const items = ingredients
        .map((ing, idx) => {
            const qty = ing.quantity > 0 ? `${ing.quantity} ${ing.unit}` : '';
            return `${idx + 1}. ${ing.name}${qty ? ' - ' + qty : ''}${ing.optional ? ' (optional)' : ''}`;
        })
        .join('\n');

    const footer = "\n\nShop on Instacart: https://www.instacart.com";

    return header + items + footer;
}

/**
 * Prepares recipe ingredients for Instacart integration
 * Parses recipe and returns structured ingredients ready for cart
 */
export function prepareRecipeForInstacart(recipe: Recipe): InstacartIngredient[] {
    // If recipe already has structured instacart_ingredients, use those
    if (recipe.instacart_ingredients && recipe.instacart_ingredients.length > 0) {
        return recipe.instacart_ingredients;
    }

    // Otherwise, parse from ingredients string
    return parseIngredientsFromRecipe(recipe);
}

/**
 * Generates an Instacart cart link for a specific recipe
 */
export function generateRecipeInstacartLink(recipe: Recipe): string {
    const ingredients = prepareRecipeForInstacart(recipe);
    return generateInstacartCartUrl(ingredients);
}

/**
 * Groups ingredients by category for better organization
 */
export function groupIngredientsByCategory(ingredients: InstacartIngredient[]): Record<string, InstacartIngredient[]> {
    const grouped: Record<string, InstacartIngredient[]> = {};

    ingredients.forEach(ingredient => {
        const category = ingredient.category || 'Other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(ingredient);
    });

    return grouped;
}

/**
 * Consolidates duplicate ingredients across multiple recipes
 * Useful for shopping list aggregation
 */
export function consolidateIngredients(ingredientLists: InstacartIngredient[][]): InstacartIngredient[] {
    const consolidated = new Map<string, InstacartIngredient>();

    ingredientLists.flat().forEach(ingredient => {
        const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;

        if (consolidated.has(key)) {
            const existing = consolidated.get(key)!;
            existing.quantity += ingredient.quantity;
        } else {
            consolidated.set(key, { ...ingredient });
        }
    });

    return Array.from(consolidated.values());
}

/**
 * Estimates the total cost of ingredients based on market data
 * This would integrate with the existing market price data
 */
export async function estimateIngredientsCost(
    ingredients: InstacartIngredient[],
    marketPrices?: any // Type from logan.ts
): Promise<number> {
    // TODO: Integrate with existing market price data
    // For now, return a placeholder
    return 0;
}

/**
 * Opens Instacart in a new tab with the recipe ingredients
 */
export function openInstacartWithRecipe(recipe: Recipe): void {
    const url = generateRecipeInstacartLink(recipe);
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Copies shopping list to clipboard
 */
export async function copyShoppingListToClipboard(ingredients: InstacartIngredient[]): Promise<boolean> {
    try {
        const text = generateShoppingListText(ingredients);
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}
