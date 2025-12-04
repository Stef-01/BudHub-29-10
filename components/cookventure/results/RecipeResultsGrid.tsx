// components/cookventure/results/RecipeResultsGrid.tsx
import React, { useState } from 'react';
import type { ScoredRecipe, UserPreferences } from '../../../types/cookventure';
import type { Recipe } from '../../../types';
import FlippableRecipeCard from './FlippableRecipeCard';
import { generateCookventureRecipes } from '../../../services/cookventure/cookventureRecipeGenerator';

interface RecipeResultsGridProps {
  scoredRecipes: ScoredRecipe[];
  userPrefs?: UserPreferences;
  onRecipeGenerated?: (recipe: Recipe) => void;
  onRecipeSaved?: (recipeName: string) => void;
  onSelectRecipe?: (recipe: ScoredRecipe) => void;
}

const RecipeResultsGrid: React.FC<RecipeResultsGridProps> = ({
  scoredRecipes,
  userPrefs,
  onRecipeGenerated,
  onRecipeSaved,
  onSelectRecipe,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateRecipe = async () => {
    if (!userPrefs) {
      setGenerationError("User preferences not available");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const newRecipes = await generateCookventureRecipes({
        userPrefs,
        count: 1,
      });

      if (newRecipes.length > 0 && onRecipeGenerated) {
        // Add source and id to the generated recipe
        const recipeWithMetadata: Recipe = {
          ...newRecipes[0],
          id: `generated-${Date.now()}`,
          source: 'gemini',
        };
        onRecipeGenerated(recipeWithMetadata);
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to generate recipe");
    } finally {
      setIsGenerating(false);
    }
  };

  if (scoredRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No recipes found</h3>
        <p className="text-sm text-gray-500 mb-6">
          Try adjusting your preferences or adding more ingredients to your pantry
        </p>
        {userPrefs && (
          <button
            onClick={handleGenerateRecipe}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🔄</span>
                Generating Recipe...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ✨ Generate AI Recipe
              </span>
            )}
          </button>
        )}
        {generationError && (
          <p className="text-red-500 text-sm mt-4">{generationError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Your Matches ({scoredRecipes.length})
          </h2>
          {userPrefs && (
            <button
              onClick={handleGenerateRecipe}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ✨ Generate New Recipe
                </span>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">Click cards to see match details</p>
      </div>
      {generationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {generationError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scoredRecipes.map((scoredRecipe, idx) => (
          <FlippableRecipeCard
            key={scoredRecipe.recipe.id}
            scoredRecipe={scoredRecipe}
            index={idx}
            onRecipeSaved={onRecipeSaved}
          />
        ))}
      </div>
    </div>
  );
};

export default RecipeResultsGrid;
