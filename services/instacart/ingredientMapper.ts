// services/instacart/ingredientMapper.ts
// Parses recipe ingredients and maps them to Instacart-searchable terms

import type { Recipe, InstacartIngredient } from '../../types';

// Common unit mappings and abbreviations
const UNIT_MAPPINGS: Record<string, string> = {
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'cup': 'cup',
    'cups': 'cup',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'lb': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'kg': 'kg',
    'kilogram': 'kg',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l',
    'bunch': 'bunch',
    'bunches': 'bunch',
    'piece': 'piece',
    'pieces': 'piece',
    'pinch': 'pinch',
    'handful': 'handful',
    'clove': 'clove',
    'cloves': 'clove',
    'sprig': 'sprig',
    'sprigs': 'sprig',
};

// Indian ingredient mappings for better Instacart search
const INDIAN_INGREDIENT_MAPPINGS: Record<string, string> = {
    'curry leaves': 'fresh curry leaves',
    'curry leaf': 'fresh curry leaves',
    'karipatta': 'fresh curry leaves',
    'hing': 'asafoetida powder',
    'asafoetida': 'asafoetida powder',
    'haldi': 'turmeric powder',
    'turmeric': 'turmeric powder',
    'jeera': 'cumin seeds',
    'cumin': 'cumin seeds',
    'dhaniya': 'coriander',
    'cilantro': 'fresh cilantro',
    'coriander leaves': 'fresh cilantro',
    'methi': 'fenugreek',
    'fenugreek leaves': 'fresh fenugreek leaves',
    'kasuri methi': 'dried fenugreek leaves',
    'garam masala': 'garam masala powder',
    'sambar powder': 'sambar masala powder',
    'rasam powder': 'rasam masala powder',
    'chana dal': 'chana dal split chickpeas',
    'toor dal': 'toor dal yellow lentils',
    'urad dal': 'urad dal black lentils',
    'moong dal': 'moong dal mung beans',
    'jaggery': 'jaggery organic',
    'tamarind': 'tamarind paste',
    'kokum': 'kokum dried',
    'amchur': 'amchur mango powder',
    'mustard seeds': 'mustard seeds black',
    'rai': 'mustard seeds black',
    'ghee': 'ghee clarified butter',
    'paneer': 'paneer indian cheese',
    'basmati rice': 'basmati rice',
    'idli rice': 'idli rice',
};

// Ingredient categories for organization
const INGREDIENT_CATEGORIES: Record<string, string> = {
    // Spices
    'turmeric': 'spices',
    'cumin': 'spices',
    'coriander': 'spices',
    'cardamom': 'spices',
    'cinnamon': 'spices',
    'cloves': 'spices',
    'pepper': 'spices',
    'chili': 'spices',
    'garam masala': 'spices',
    'sambar powder': 'spices',
    'rasam powder': 'spices',
    'asafoetida': 'spices',
    'fenugreek': 'spices',
    'mustard': 'spices',

    // Vegetables
    'onion': 'vegetables',
    'tomato': 'vegetables',
    'potato': 'vegetables',
    'carrot': 'vegetables',
    'peas': 'vegetables',
    'beans': 'vegetables',
    'cauliflower': 'vegetables',
    'spinach': 'vegetables',
    'eggplant': 'vegetables',
    'okra': 'vegetables',
    'cucumber': 'vegetables',
    'bell pepper': 'vegetables',

    // Herbs
    'curry leaves': 'herbs',
    'cilantro': 'herbs',
    'mint': 'herbs',
    'coriander leaves': 'herbs',
    'basil': 'herbs',

    // Grains & Lentils
    'rice': 'grains',
    'wheat': 'grains',
    'flour': 'grains',
    'dal': 'grains',
    'lentils': 'grains',
    'chickpeas': 'grains',

    // Dairy
    'milk': 'dairy',
    'yogurt': 'dairy',
    'ghee': 'dairy',
    'paneer': 'dairy',
    'butter': 'dairy',
    'cream': 'dairy',

    // Oils & Fats
    'oil': 'oils',
    'coconut oil': 'oils',
    'mustard oil': 'oils',

    // Condiments
    'tamarind': 'condiments',
    'jaggery': 'condiments',
    'sugar': 'condiments',
    'salt': 'condiments',
    'lemon': 'condiments',
    'lime': 'condiments',
};

/**
 * Parses a single ingredient line into a structured object
 * Example: "2 cups basmati rice" -> {name: "basmati rice", quantity: 2, unit: "cup"}
 */
export function parseIngredientLine(line: string): InstacartIngredient | null {
    // Skip empty lines or comments
    if (!line || line.trim().startsWith('#') || line.trim().startsWith('//')) {
        return null;
    }

    const trimmed = line.trim();

    // Try to extract quantity, unit, and name
    // Pattern: optional quantity (number/fraction), optional unit, ingredient name
    const fractionRegex = /(\d+\/\d+)/;
    const numberRegex = /^(\d+(?:\.\d+)?)/;

    let quantity = 1;
    let unit = '';
    let name = trimmed;
    let optional = false;

    // Check if marked as optional
    if (trimmed.toLowerCase().includes('optional')) {
        optional = true;
        name = name.replace(/\(optional\)/gi, '').replace(/optional/gi, '').trim();
    }

    // Try to match fraction (e.g., "1/2")
    const fractionMatch = trimmed.match(fractionRegex);
    if (fractionMatch) {
        const [numerator, denominator] = fractionMatch[1].split('/').map(Number);
        quantity = numerator / denominator;
        name = trimmed.replace(fractionMatch[0], '').trim();
    }
    // Try to match decimal or integer
    else {
        const numberMatch = trimmed.match(numberRegex);
        if (numberMatch) {
            quantity = parseFloat(numberMatch[1]);
            name = trimmed.replace(numberMatch[0], '').trim();
        }
    }

    // Try to extract unit
    const words = name.split(/\s+/);
    if (words.length > 1) {
        const possibleUnit = words[0].toLowerCase();
        if (UNIT_MAPPINGS[possibleUnit]) {
            unit = UNIT_MAPPINGS[possibleUnit];
            name = words.slice(1).join(' ').trim();
        }
    }

    // Clean up ingredient name
    name = cleanIngredientName(name);

    if (!name) {
        return null;
    }

    // Get search term mapping
    const searchTerm = getInstacartSearchTerm(name);

    // Get category
    const category = getIngredientCategory(name);

    return {
        name,
        quantity,
        unit,
        searchTerm,
        category,
        optional,
    };
}

/**
 * Cleans up ingredient name by removing extra info
 */
function cleanIngredientName(name: string): string {
    return name
        // Remove parenthetical notes
        .replace(/\([^)]*\)/g, '')
        // Remove prep instructions
        .replace(/,\s*(chopped|diced|minced|sliced|crushed|grated|peeled|seeded).*/gi, '')
        // Remove "to taste" and similar
        .replace(/,?\s*to taste/gi, '')
        .replace(/,?\s*as needed/gi, '')
        .replace(/,?\s*or more/gi, '')
        .trim();
}

/**
 * Gets the best Instacart search term for an ingredient
 */
function getInstacartSearchTerm(ingredientName: string): string {
    const lower = ingredientName.toLowerCase();

    // Check direct mappings
    for (const [key, value] of Object.entries(INDIAN_INGREDIENT_MAPPINGS)) {
        if (lower.includes(key)) {
            return value;
        }
    }

    return ingredientName;
}

/**
 * Determines the category for an ingredient
 */
function getIngredientCategory(ingredientName: string): string {
    const lower = ingredientName.toLowerCase();

    for (const [key, category] of Object.entries(INGREDIENT_CATEGORIES)) {
        if (lower.includes(key)) {
            return category;
        }
    }

    return 'other';
}

/**
 * Parses all ingredients from a recipe
 */
export function parseIngredientsFromRecipe(recipe: Recipe): InstacartIngredient[] {
    const ingredientLines = recipe.ingredients.split('\n');
    const parsed: InstacartIngredient[] = [];

    for (const line of ingredientLines) {
        const ingredient = parseIngredientLine(line);
        if (ingredient) {
            parsed.push(ingredient);
        }
    }

    return parsed;
}

/**
 * Validates and enhances parsed ingredients
 */
export function validateAndEnhanceIngredients(ingredients: InstacartIngredient[]): InstacartIngredient[] {
    return ingredients.map(ing => {
        // Ensure minimum quantity
        if (ing.quantity <= 0) {
            ing.quantity = 1;
        }

        // Ensure unit exists
        if (!ing.unit) {
            ing.unit = 'piece';
        }

        return ing;
    });
}

/**
 * Converts a recipe to have structured Instacart ingredients
 * This can be used to enhance existing recipes
 */
export function enhanceRecipeWithInstacartData(recipe: Recipe): Recipe {
    if (!recipe.instacart_ingredients) {
        const parsed = parseIngredientsFromRecipe(recipe);
        const validated = validateAndEnhanceIngredients(parsed);

        return {
            ...recipe,
            instacart_ingredients: validated,
        };
    }

    return recipe;
}
