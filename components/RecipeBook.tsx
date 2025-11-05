// components/RecipeBook.tsx
import React, { useState, useMemo } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { RECIPE_CATALOG } from '../constants';

import DiscoveryCarousel from './recipe/DiscoveryCarousel';
import RecipeActions from './recipe/RecipeActions';
import MyCookbookGrid from './recipe/MyCookbookGrid';
import RecipeDetailModal from './RecipeDetailModal';
import RecipeModal from './RecipeModal';
// ImageGenerationProgress removed - no longer using AI image generation

const RecipeBook: React.FC = () => {
    const { recipes } = useUserCookbook();
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);

    const allAvailableRecipes = useMemo(() => {
        const recipeMap = new Map<string, Recipe>();
        RECIPE_CATALOG.forEach(r => recipeMap.set(r.id, r));
        recipes.forEach(r => recipeMap.set(r.id, r)); // User's recipes override catalog
        return Array.from(recipeMap.values());
    }, [recipes]);

    const selectedRecipe = useMemo(() => {
        return allAvailableRecipes.find(r => r.id === selectedRecipeId) || null;
    }, [selectedRecipeId, allAvailableRecipes]);
    
    return (
        <div>
            <DiscoveryCarousel onRecipeClick={setSelectedRecipeId} />

            <RecipeActions onOpenAddModal={() => setAddModalOpen(true)} />

            <MyCookbookGrid onRecipeClick={setSelectedRecipeId} onOpenAddModal={() => setAddModalOpen(true)} />

            {selectedRecipe && (
                <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipeId(null)} />
            )}
            {isAddModalOpen && (
                <RecipeModal onClose={() => setAddModalOpen(false)} />
            )}
        </div>
    );
};

export default RecipeBook;
