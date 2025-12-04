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
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'name'>('score');
  const [filterRegion, setFilterRegion] = useState<string | null>(null);

  // Get unique regions from results
  const availableRegions = Array.from(
    new Set(
      scoredRecipes
        .flatMap(sr => sr.recipe.region_tags || [])
        .filter(Boolean)
    )
  );

  // Sort and filter recipes
  const displayedRecipes = React.useMemo(() => {
    let filtered = [...scoredRecipes];

    // Apply region filter
    if (filterRegion) {
      filtered = filtered.filter(sr =>
        sr.recipe.region_tags?.includes(filterRegion)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score; // Highest score first
        case 'time':
          const timeA = (a.recipe.prep_minutes || 0) + (a.recipe.cook_minutes || 0);
          const timeB = (b.recipe.prep_minutes || 0) + (b.recipe.cook_minutes || 0);
          return timeA - timeB; // Shortest time first
        case 'name':
          return a.recipe.name.localeCompare(b.recipe.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [scoredRecipes, sortBy, filterRegion]);

  const handleGenerateRecipe = async (count: number = 1) => {
    if (!userPrefs) {
      setGenerationError("User preferences not available");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({ current: 0, total: count });

    try {
      const newRecipes = await generateCookventureRecipes({
        userPrefs,
        count,
      });

      // Add recipes one by one with progress updates
      for (let i = 0; i < newRecipes.length; i++) {
        setGenerationProgress({ current: i + 1, total: count });

        if (onRecipeGenerated) {
          const recipeWithMetadata: Recipe = {
            ...newRecipes[i],
            id: `generated-${Date.now()}-${i}`,
            source: 'gemini',
          };
          await onRecipeGenerated(recipeWithMetadata);

          // Small delay between saves for better UX
          if (i < newRecipes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to generate recipe");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
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
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateRecipe(1)}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating && generationProgress && generationProgress.total === 1 ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✨ Generate 1 Recipe
                  </span>
                )}
              </button>
              <button
                onClick={() => handleGenerateRecipe(3)}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating && generationProgress && generationProgress.total === 3 ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    {generationProgress.current}/{generationProgress.total}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✨✨✨ Generate 3 Recipes
                  </span>
                )}
              </button>
            </div>
            {generationProgress && (
              <div className="w-full max-w-md">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-pink-500 h-full transition-all duration-500"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Generating recipe {generationProgress.current} of {generationProgress.total}...
                </p>
              </div>
            )}
          </div>
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
            Your Matches ({displayedRecipes.length})
          </h2>
          {userPrefs && (
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateRecipe(1)}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating && generationProgress?.total === 1 ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✨ Generate 1
                  </span>
                )}
              </button>
              <button
                onClick={() => handleGenerateRecipe(3)}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate 3 recipes at once"
              >
                {isGenerating && generationProgress?.total === 3 ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    {generationProgress.current}/3
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✨✨✨ Generate 3
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'time' | 'name')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="score">Best Match</option>
            <option value="time">Quickest Time</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Region Filter */}
        {availableRegions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Region:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterRegion(null)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  filterRegion === null
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {availableRegions.map(region => (
                <button
                  key={region}
                  onClick={() => setFilterRegion(region)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    filterRegion === region
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {generationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {generationError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedRecipes.map((scoredRecipe, idx) => (
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
