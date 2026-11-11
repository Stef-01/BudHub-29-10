// components/cookventure/results/RecipeResultsGrid.tsx
import React, { useMemo, useState } from 'react';
import type { ScoredRecipe, UserPreferences } from '../../../types/cookventure';
import { rescoreWithTadka } from '../../../services/cookventure/tadkaSwap';
import FlippableRecipeCard from './FlippableRecipeCard';

interface RecipeResultsGridProps {
  scoredRecipes: ScoredRecipe[];
  userPrefs: UserPreferences;
}

const RecipeResultsGrid: React.FC<RecipeResultsGridProps> = ({ scoredRecipes, userPrefs }) => {
  // recipe id -> tadka id the user swapped to on this screen
  const [tadkaSwaps, setTadkaSwaps] = useState<Record<string, string>>({});

  // Swapped recipes are re-scored in place; the grid keeps its order so cards don't jump around
  const displayed = useMemo(
    () =>
      scoredRecipes.map((original) => {
        const swappedTo = tadkaSwaps[original.recipe.id];
        return {
          original,
          shown: swappedTo ? rescoreWithTadka(original, swappedTo, userPrefs) : original,
        };
      }),
    [scoredRecipes, tadkaSwaps, userPrefs]
  );

  const handleSwapTadka = (original: ScoredRecipe, tadkaId: string) => {
    setTadkaSwaps((prev) => {
      const next = { ...prev };
      if (tadkaId === original.recipe.tadka_profiles?.[0]) delete next[original.recipe.id];
      else next[original.recipe.id] = tadkaId;
      return next;
    });
  };

  if (scoredRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No recipes found</h3>
        <p className="text-sm text-gray-500">
          Try adjusting your preferences or adding more ingredients to your pantry
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Matches ({scoredRecipes.length})
          <span className="ml-2 text-sm font-normal text-gray-500">नतीजे</span>
        </h2>
        <p className="text-xs text-gray-500">Tap a card to flip it · 🔍 for the full breakdown</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayed.map(({ original, shown }, idx) => (
          <FlippableRecipeCard
            key={original.recipe.id}
            scoredRecipe={shown}
            original={original}
            userPrefs={userPrefs}
            index={idx}
            onSwapTadka={(tadkaId) => handleSwapTadka(original, tadkaId)}
          />
        ))}
      </div>
    </div>
  );
};

export default RecipeResultsGrid;
