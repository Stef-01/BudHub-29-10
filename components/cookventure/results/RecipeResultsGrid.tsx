// components/cookventure/results/RecipeResultsGrid.tsx
import React from 'react';
import type { ScoredRecipe } from '../../../types/cookventure';
import FlippableRecipeCard from './FlippableRecipeCard';

interface RecipeResultsGridProps {
  scoredRecipes: ScoredRecipe[];
  onSelectRecipe?: (recipe: ScoredRecipe) => void;
}

const RecipeResultsGrid: React.FC<RecipeResultsGridProps> = ({
  scoredRecipes,
  onSelectRecipe,
}) => {
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Matches ({scoredRecipes.length})
        </h2>
        <p className="text-xs text-gray-500">Click cards to see match details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scoredRecipes.map((scoredRecipe, idx) => (
          <FlippableRecipeCard
            key={scoredRecipe.recipe.id}
            scoredRecipe={scoredRecipe}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
};

export default RecipeResultsGrid;
