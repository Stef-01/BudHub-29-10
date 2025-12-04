// components/RecipeBook.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { RECIPE_CATALOG } from '../constants';

import DiscoveryCarousel from './recipe/DiscoveryCarousel';
import RecipeActions from './recipe/RecipeActions';
import MyCookbookGrid from './recipe/MyCookbookGrid';
import RecipeDetailModal from './RecipeDetailModal';
import RecipeModal from './RecipeModal';
import ShoppingList from './recipe/ShoppingList';
// ImageGenerationProgress removed - no longer using AI image generation

const RecipeBook: React.FC = () => {
    const { recipes } = useUserCookbook();
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [selectedRecipesForShopping, setSelectedRecipesForShopping] = useState<string[]>([]);

    const allAvailableRecipes = useMemo(() => {
        const recipeMap = new Map<string, Recipe>();
        RECIPE_CATALOG.forEach(r => recipeMap.set(r.id, r));
        recipes.forEach(r => recipeMap.set(r.id, r)); // User's recipes override catalog
        return Array.from(recipeMap.values());
    }, [recipes]);

    const selectedRecipe = useMemo(() => {
        return allAvailableRecipes.find(r => r.id === selectedRecipeId) || null;
    }, [selectedRecipeId, allAvailableRecipes]);

    const recipesForShoppingList = useMemo(() => {
        return recipes.filter(r => selectedRecipesForShopping.includes(r.id));
    }, [recipes, selectedRecipesForShopping]);

    const toggleRecipeSelection = (recipeId: string) => {
        setSelectedRecipesForShopping(prev =>
            prev.includes(recipeId)
                ? prev.filter(id => id !== recipeId)
                : [...prev, recipeId]
        );
    };

    const handleOpenShoppingList = () => {
        // Auto-select first 3 recipes if none selected
        if (selectedRecipesForShopping.length === 0 && recipes.length > 0) {
            setSelectedRecipesForShopping(recipes.slice(0, Math.min(3, recipes.length)).map(r => r.id));
        }
        setIsShoppingListOpen(true);
    };

    return (
        <div>
            <DiscoveryCarousel onRecipeClick={setSelectedRecipeId} />

            <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                    <RecipeActions onOpenAddModal={() => setAddModalOpen(true)} />
                </div>
                {recipes.length > 0 && (
                    <button
                        onClick={handleOpenShoppingList}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <span>🛒</span>
                        <span>Shopping List</span>
                        {selectedRecipesForShopping.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                {selectedRecipesForShopping.length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            <MyCookbookGrid
                onRecipeClick={setSelectedRecipeId}
                onOpenAddModal={() => setAddModalOpen(false)}
            />

            {selectedRecipe && (
                <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipeId(null)} />
            )}
            {isAddModalOpen && (
                <RecipeModal onClose={() => setAddModalOpen(false)} />
            )}

            {/* Shopping List Modal */}
            <AnimatePresence>
                {isShoppingListOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-2xl w-full max-h-[90vh] overflow-auto"
                        >
                            <ShoppingList
                                recipes={recipesForShoppingList}
                                onClose={() => setIsShoppingListOpen(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RecipeBook;
