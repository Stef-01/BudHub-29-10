// services/instacart/marketPriceEstimator.ts
// Estimates ingredient costs using Logan market data

import type { InstacartIngredient } from '../../types';
import type { LatestPrice } from '../../types/logan';

/**
 * Estimates the cost of an ingredient based on market price data
 */
export function estimateIngredientCost(
    ingredient: InstacartIngredient,
    marketPrices?: LatestPrice[]
): number {
    if (!marketPrices || marketPrices.length === 0) {
        return 0; // No price data available
    }

    // Try to find matching produce item
    const ingredientNameLower = ingredient.name.toLowerCase();

    // Look for exact or partial matches
    const matchingPrice = marketPrices.find(price => {
        const produceName = price.produce_name.toLowerCase();
        return produceName.includes(ingredientNameLower) ||
               ingredientNameLower.includes(produceName);
    });

    if (!matchingPrice) {
        return 0; // No matching price found
    }

    // Calculate cost based on quantity and unit
    let estimatedCost = 0;

    if (matchingPrice.price_per_kg && ingredient.unit === 'kg') {
        estimatedCost = matchingPrice.price_per_kg * ingredient.quantity;
    } else if (matchingPrice.price_per_kg && (ingredient.unit === 'g' || ingredient.unit === 'grams')) {
        // Convert grams to kg
        estimatedCost = matchingPrice.price_per_kg * (ingredient.quantity / 1000);
    } else if (matchingPrice.price_per_unit) {
        // Use price per unit for items sold by piece/bunch
        estimatedCost = matchingPrice.price_per_unit * ingredient.quantity;
    }

    return Math.max(0, estimatedCost);
}

/**
 * Estimates total cost for a list of ingredients
 */
export function estimateTotalCost(
    ingredients: InstacartIngredient[],
    marketPrices?: LatestPrice[]
): { total: number; itemsWithPrices: number; itemsWithoutPrices: number } {
    let total = 0;
    let itemsWithPrices = 0;
    let itemsWithoutPrices = 0;

    ingredients.forEach(ingredient => {
        const cost = estimateIngredientCost(ingredient, marketPrices);
        if (cost > 0) {
            total += cost;
            itemsWithPrices++;
        } else {
            itemsWithoutPrices++;
        }
    });

    return { total, itemsWithPrices, itemsWithoutPrices };
}

/**
 * Formats a price for display
 */
export function formatPrice(price: number): string {
    if (price === 0) return 'N/A';
    return `$${price.toFixed(2)}`;
}

/**
 * Gets price comparison between Instacart and local markets
 */
export function compareWithLocalMarkets(
    ingredients: InstacartIngredient[],
    marketPrices?: LatestPrice[]
): {
    estimatedCost: number;
    cheapestMarket?: string;
    potentialSavings?: number;
} {
    if (!marketPrices || marketPrices.length === 0) {
        return { estimatedCost: 0 };
    }

    const { total } = estimateTotalCost(ingredients, marketPrices);

    // Find cheapest market for the ingredients
    const marketCosts = new Map<string, number>();

    ingredients.forEach(ingredient => {
        const ingredientNameLower = ingredient.name.toLowerCase();

        marketPrices.forEach(price => {
            const produceName = price.produce_name.toLowerCase();
            if (produceName.includes(ingredientNameLower) || ingredientNameLower.includes(produceName)) {
                const marketName = price.market_name;
                const cost = estimateIngredientCost(ingredient, [price]);

                if (cost > 0) {
                    marketCosts.set(
                        marketName,
                        (marketCosts.get(marketName) || 0) + cost
                    );
                }
            }
        });
    });

    if (marketCosts.size === 0) {
        return { estimatedCost: total };
    }

    // Find cheapest market
    let cheapestMarket = '';
    let cheapestCost = Infinity;

    marketCosts.forEach((cost, market) => {
        if (cost < cheapestCost) {
            cheapestCost = cost;
            cheapestMarket = market;
        }
    });

    // Assume Instacart is 20% more expensive (typical markup)
    const instacartCost = total * 1.2;
    const potentialSavings = Math.max(0, instacartCost - cheapestCost);

    return {
        estimatedCost: total,
        cheapestMarket,
        potentialSavings: potentialSavings > 0.5 ? potentialSavings : undefined,
    };
}

/**
 * Gets affordable recipe badge based on cost
 */
export function getAffordabilityBadge(cost: number): {
    label: string;
    color: string;
    emoji: string;
} | null {
    if (cost === 0) return null;

    if (cost < 10) {
        return { label: 'Budget-Friendly', color: 'green', emoji: '💰' };
    } else if (cost < 20) {
        return { label: 'Moderate', color: 'yellow', emoji: '💵' };
    } else {
        return { label: 'Premium', color: 'orange', emoji: '💎' };
    }
}
