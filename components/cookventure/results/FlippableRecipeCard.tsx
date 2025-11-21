// components/cookventure/results/FlippableRecipeCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ScoredRecipe } from '../../../types/cookventure';

interface FlippableRecipeCardProps {
  scoredRecipe: ScoredRecipe;
  index: number;
}

const FlippableRecipeCard: React.FC<FlippableRecipeCardProps> = ({ scoredRecipe, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { recipe, explanation, missing_ingredients } = scoredRecipe;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-80 perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card - Recipe Image */}
        <div
          className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 hover:border-green-300 transition-all"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Recipe Image */}
          <div className="h-48 bg-gradient-to-br from-orange-100 to-green-100 relative overflow-hidden">
            {recipe.image && recipe.image.startsWith('http') ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">
                {recipe.image || '🍛'}
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

            {/* Recipe Name on Image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-xl text-white drop-shadow-lg leading-tight">
                {recipe.name}
              </h3>
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-4 bg-white">
            {/* Region & Dietary Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {recipe.region_tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {recipe.diabetic_friendly && (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  Diabetic-friendly
                </span>
              )}
            </div>

            {/* Taste Indicators */}
            {recipe.taste_axes && (
              <div className="flex gap-2 mb-3 text-xs">
                {recipe.taste_axes.heat > 0 && (
                  <span className="text-red-600 font-medium">🌶️×{recipe.taste_axes.heat}</span>
                )}
                {recipe.taste_axes.masala > 0 && (
                  <span className="text-orange-600 font-medium">🧄×{recipe.taste_axes.masala}</span>
                )}
                {recipe.taste_axes.tangy > 0 && (
                  <span className="text-yellow-600 font-medium">🍋×{recipe.taste_axes.tangy}</span>
                )}
                {recipe.taste_axes.sweet > 0 && (
                  <span className="text-amber-600 font-medium">🍯×{recipe.taste_axes.sweet}</span>
                )}
              </div>
            )}

            {/* Cooking Time */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {recipe.prep_minutes && (
                <span>⏱️ {recipe.prep_minutes + (recipe.cook_minutes || 0)} min</span>
              )}
              {recipe.servings && (
                <span>🍽️ {recipe.servings} servings</span>
              )}
            </div>

            {/* Tap to Flip Hint */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500 italic">👆 Tap to see why this matched</p>
            </div>
          </div>
        </div>

        {/* Back of Card - Match Explanation */}
        <div
          className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg bg-white border-2 border-green-400"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="h-full flex flex-col p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">
              Why {recipe.name} Matched
            </h3>

            {/* Match Explanations */}
            <div className="flex-1 space-y-2 mb-4">
              {explanation.length > 0 ? (
                explanation.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700 bg-white rounded-lg p-3 shadow-sm"
                  >
                    <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                    <span className="leading-tight">{exp.replace('✓ ', '')}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 italic text-center">
                  This recipe matches your preferences!
                </p>
              )}
            </div>

            {/* Missing Ingredients */}
            {missing_ingredients.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <p className="text-xs font-semibold text-yellow-800 mb-1">
                  You'll need ({missing_ingredients.length}):
                </p>
                <p className="text-xs text-yellow-700">
                  {missing_ingredients.slice(0, 4).join(', ')}
                  {missing_ingredients.length > 4 && ` +${missing_ingredients.length - 4} more`}
                </p>
              </div>
            )}

            {/* Masala & Tadka Info */}
            {(recipe.masala_profiles || recipe.tadka_profiles) && (
              <div className="space-y-2 mb-4">
                {recipe.masala_profiles && recipe.masala_profiles.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Masala: </span>
                    <span className="text-orange-700">
                      {recipe.masala_profiles.map(m => m.replace('_', ' ')).join(', ')}
                    </span>
                  </div>
                )}
                {recipe.tadka_profiles && recipe.tadka_profiles.length > 0 && (
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Tadka: </span>
                    <span className="text-amber-700">
                      {recipe.tadka_profiles.map(t => t.replace('_', ' ')).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tap to Flip Back */}
            <div className="text-center border-t border-green-200 pt-3">
              <p className="text-xs text-gray-500 italic">👆 Tap to see recipe again</p>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </motion.div>
  );
};

export default FlippableRecipeCard;
