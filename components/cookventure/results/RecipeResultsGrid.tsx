// components/cookventure/results/RecipeResultsGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { ScoredRecipe } from '../../../types/cookventure';
import MatchExplanationChip from './MatchExplanationChip';

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
        <p className="text-xs text-gray-500">Sorted by best match</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scoredRecipes.map((scoredRecipe, idx) => {
          const { recipe, score, explanation, missing_ingredients, can_swap_tadka, can_swap_masala } = scoredRecipe;

          // Score color
          let scoreColor = 'bg-emerald-500';
          let scoreRing = 'ring-emerald-400';
          if (score < 50) {
            scoreColor = 'bg-gray-400';
            scoreRing = 'ring-gray-300';
          } else if (score < 70) {
            scoreColor = 'bg-amber-500';
            scoreRing = 'ring-amber-400';
          }

          return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, shadow: 'lg' }}
              className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-green-300 transition-all cursor-pointer shadow-sm"
              onClick={() => onSelectRecipe?.(scoredRecipe)}
            >
              {/* Header with Score */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">
                    {recipe.title}
                  </h3>
                  {recipe.region_tags && recipe.region_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.region_tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score Badge */}
                <div className={`flex-shrink-0 ml-3 w-14 h-14 ${scoreColor} ${scoreRing} ring-2 rounded-full flex flex-col items-center justify-center text-white shadow-md`}>
                  <span className="text-lg font-bold">{Math.round(score)}</span>
                  <span className="text-[8px] font-medium">MATCH</span>
                </div>
              </div>

              {/* Masala & Tadka Tags */}
              {(recipe.masala_profiles || recipe.tadka_profiles) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.masala_profiles?.map((masala) => (
                    <span
                      key={masala}
                      className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium"
                    >
                      🧂 {masala.replace('_', ' ')}
                    </span>
                  ))}
                  {recipe.tadka_profiles?.map((tadka) => (
                    <span
                      key={tadka}
                      className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium"
                    >
                      🔥 {tadka.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Taste Axes */}
              {recipe.taste_axes && (
                <div className="flex gap-2 mb-2 text-[10px]">
                  {recipe.taste_axes.heat > 0 && (
                    <span className="text-red-600">🌶️×{recipe.taste_axes.heat}</span>
                  )}
                  {recipe.taste_axes.masala > 0 && (
                    <span className="text-orange-600">🧄×{recipe.taste_axes.masala}</span>
                  )}
                  {recipe.taste_axes.tangy > 0 && (
                    <span className="text-yellow-600">🍋×{recipe.taste_axes.tangy}</span>
                  )}
                  {recipe.taste_axes.sweet > 0 && (
                    <span className="text-amber-600">🍯×{recipe.taste_axes.sweet}</span>
                  )}
                </div>
              )}

              {/* Match Explanations */}
              <MatchExplanationChip explanations={explanation} />

              {/* Missing Ingredients */}
              {missing_ingredients.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-[10px] font-semibold text-yellow-800 mb-1">
                    Missing ({missing_ingredients.length}):
                  </p>
                  <p className="text-[10px] text-yellow-700">
                    {missing_ingredients.slice(0, 3).join(', ')}
                    {missing_ingredients.length > 3 && ` +${missing_ingredients.length - 3} more`}
                  </p>
                </div>
              )}

              {/* Swap Options */}
              {(can_swap_tadka || can_swap_masala) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  {can_swap_tadka && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      🔄 Can switch tadka
                    </span>
                  )}
                  {can_swap_masala && (
                    <span className="text-[10px] text-orange-600 font-medium">
                      🔄 Can swap masala
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecipeResultsGrid;
