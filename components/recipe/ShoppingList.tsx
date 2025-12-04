// components/recipe/ShoppingList.tsx
// Shopping list aggregation feature for multiple recipes

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe, InstacartIngredient } from '../../types';
import {
    prepareRecipeForInstacart,
    consolidateIngredients,
    groupIngredientsByCategory,
    generateShoppingListText,
    copyShoppingListToClipboard,
    generateInstacartCartUrl,
} from '../../services/instacart/instacartService';

interface ShoppingListProps {
    recipes: Recipe[];
    onClose?: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ recipes, onClose }) => {
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);

    // Consolidate ingredients from all recipes
    const consolidatedIngredients = useMemo(() => {
        const ingredientLists = recipes.map(recipe => prepareRecipeForInstacart(recipe));
        return consolidateIngredients(ingredientLists);
    }, [recipes]);

    // Group by category
    const groupedIngredients = useMemo(() => {
        return groupIngredientsByCategory(consolidatedIngredients);
    }, [consolidatedIngredients]);

    const handleCopyToClipboard = async () => {
        const success = await copyShoppingListToClipboard(consolidatedIngredients);
        if (success) {
            setCopiedToClipboard(true);
            setTimeout(() => setCopiedToClipboard(false), 2000);
        }
    };

    const handleOpenInstacart = () => {
        const url = generateInstacartCartUrl(consolidatedIngredients);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (recipes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <p className="text-gray-600">Select recipes to create a shopping list</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-white font-bold text-xl">Shopping List</h2>
                    <p className="text-white/80 text-sm">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Recipe List */}
            <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recipes:</h3>
                <div className="flex flex-wrap gap-2">
                    {recipes.map(recipe => (
                        <span
                            key={recipe.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs text-gray-700 shadow-sm"
                        >
                            <span>{recipe.image}</span>
                            <span>{recipe.name}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Ingredients by Category */}
            <div className="p-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedIngredients).map(([category, ingredients]) => (
                    <div key={category} className="mb-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 capitalize flex items-center gap-2">
                            <span className={getCategoryIcon(category)}></span>
                            {category}
                        </h3>
                        <ul className="space-y-1">
                            {ingredients.map((ingredient, idx) => (
                                <li
                                    key={`${ingredient.name}-${idx}`}
                                    className="flex items-start gap-2 text-sm text-gray-700 bg-white rounded-lg p-2 shadow-sm"
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="flex-1">
                                        <span className="font-medium">{ingredient.name}</span>
                                        {ingredient.quantity > 0 && (
                                            <span className="text-gray-500 ml-2">
                                                ({ingredient.quantity} {ingredient.unit})
                                            </span>
                                        )}
                                        {ingredient.optional && (
                                            <span className="text-gray-400 italic text-xs ml-1">
                                                (optional)
                                            </span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 space-y-2">
                <div className="flex gap-2">
                    <button
                        onClick={handleOpenInstacart}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <span>🛒</span>
                        <span>Shop on Instacart</span>
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        className="bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        {copiedToClipboard ? (
                            <>
                                <span>✅</span>
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <span>📋</span>
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                    {consolidatedIngredients.length} total ingredient{consolidatedIngredients.length !== 1 ? 's' : ''}
                </p>
            </div>
        </motion.div>
    );
};

/**
 * Gets the icon for a category
 */
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'spices': '🌶️',
        'vegetables': '🥬',
        'herbs': '🌿',
        'grains': '🌾',
        'dairy': '🥛',
        'oils': '🫒',
        'condiments': '🧂',
        'other': '📦',
    };

    return icons[category.toLowerCase()] || '📦';
}

export default ShoppingList;
