import React, { useState, useMemo, useEffect } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useUserGarden } from '../contexts/UserGardenContext';
import { getRecipeSuggestion } from '../services/geminiService';
import { RECIPE_CATALOG } from '../constants';
import { useRecipeImages } from '../hooks/useRecipeImages';
import RecipeCard from './RecipeCard';
import RecipeDetailModal from './RecipeDetailModal';
import RecipeModal from './RecipeModal';
import { SparklesIcon, PlusIcon, LoadingSpinner, CheckIcon } from './icons/Icons';

const DiscoveryCarousel: React.FC = () => {
    const { myPlants } = useUserGarden();
    const { saveRecipeFromCatalog, isRecipeSaved } = useUserCookbook();

    // Use the recipe images hook for catalog recipes
    const { recipes: catalogWithImages, isInitializing, initializeImages } = useRecipeImages(RECIPE_CATALOG);

    // Initialize images on first mount
    useEffect(() => {
        initializeImages();
    }, [initializeImages]);

    const seasonalRecipes = useMemo(() => {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const harvestableIngredients = new Set(
            myPlants.filter(p => p.fruitingMonths.includes(currentMonth)).map(p => p.name)
        );

        if (harvestableIngredients.size === 0) {
            return catalogWithImages; // Show all if nothing is in season
        }

        return [...catalogWithImages].sort((a, b) => {
            const aScore = a.keyIngredients.filter(ing => harvestableIngredients.has(ing)).length;
            const bScore = b.keyIngredients.filter(ing => harvestableIngredients.has(ing)).length;
            return bScore - aScore; // Sort by most matching ingredients
        });
    }, [myPlants, catalogWithImages]);

    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    return (
        <div className="mb-12">
            <h3 className="text-xl font-bold text-green-900 mb-4">Discover New Flavors</h3>
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 group-hover:pause-animation">
                <div className="flex space-x-6 animate-marquee-slow pause-animation">
                    {seasonalRecipes.map(recipe => (
                        <div key={recipe.id} className="w-64 flex-shrink-0">
                            <RecipeCard recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                            <div className="mt-2">
                                {isRecipeSaved(recipe.id) ? (
                                    <button disabled className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                                        <CheckIcon className="h-5 w-5 mr-2" />
                                        Saved
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => saveRecipeFromCatalog(recipe)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-white hover:bg-green-50 border border-gray-300 text-gray-700 rounded-full font-semibold transition-colors text-sm"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Save to Cookbook
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             {selectedRecipe && (
                <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
            )}
        </div>
    );
};


const RecipeBook: React.FC = () => {
    const { myPlants } = useUserGarden();
    const { recipes, addRecipe } = useUserCookbook();
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleGenerateRecipe = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const recipeData = await getRecipeSuggestion(myPlants);
            if (recipeData.name !== "Garden's Resting") {
              await addRecipe(recipeData, 'gemini');
            } else {
              setError("Nothing is ready for harvest right now, so we can't suggest a recipe.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate a recipe. Please try again.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddRecipe = async (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>) => {
        await addRecipe(recipeData, 'user');
        setAddModalOpen(false);
    };
    
    return (
        <div>
            <DiscoveryCarousel />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-green-900">My Cookbook</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateRecipe}
                        disabled={isGenerating || myPlants.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-teal-500 text-white rounded-full font-semibold hover:bg-teal-600 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
                        title={myPlants.length === 0 ? "Add plants to your garden to get recipe suggestions" : "Suggest a recipe with Gemini"}
                    >
                        {isGenerating ? <LoadingSpinner className="h-5 w-5 mr-2"/> : <SparklesIcon className="h-5 w-5 mr-2" />}
                        {isGenerating ? 'Cooking...' : 'AI Suggestion'}
                    </button>
                     <button 
                        onClick={() => setAddModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Your Own
                    </button>
                </div>
            </div>

            {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-2 rounded-lg">{error}</p>}
            
            {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                    ))}
                </div>
            ) : (
                 <div className="text-center p-8 bg-white/80 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-700">Your cookbook is empty!</h3>
                    <p className="text-gray-500 mt-2">Save recipes from the discovery section or add your own.</p>
                </div>
            )}

            {selectedRecipe && (
                <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
            )}
            {isAddModalOpen && (
                <RecipeModal onClose={() => setAddModalOpen(false)} onAddRecipe={handleAddRecipe} />
            )}
        </div>
    );
};

export default RecipeBook;