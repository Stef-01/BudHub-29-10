// components/cookventure/results/FlippableRecipeCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ScoredRecipe, UserPreferences } from '../../../types/cookventure';
import { useRecipeImage } from '../../../hooks/useRecipeImage';
import { getMasalaName, getRegionName, getTadkaName } from '../../../services/cookventure/labels';
import { canLowerSugar, type RecipeSwaps } from '../../../services/cookventure/swaps';
import MatchExplanationChip from './MatchExplanationChip';
import WhyThisMatchedModal from './WhyThisMatchedModal';

interface FlippableRecipeCardProps {
  /** The recipe as currently shown (after any tadka swap) */
  scoredRecipe: ScoredRecipe;
  /** The recipe as originally matched; defaults to scoredRecipe */
  original?: ScoredRecipe;
  userPrefs: UserPreferences;
  index: number;
  /** 1-based position in the results, for analytics */
  rank?: number;
  swaps?: RecipeSwaps;
  onChangeSwaps?: (swaps: RecipeSwaps) => void;
  isSaved?: boolean;
  onSave?: () => void | Promise<void>;
  onOpenDetails?: () => void;
  onCook?: () => void;
  rating?: number;
  onRate?: (stars: number) => void;
}

const FlippableRecipeCard: React.FC<FlippableRecipeCardProps> = ({
  scoredRecipe,
  original = scoredRecipe,
  userPrefs,
  index,
  swaps = {},
  onChangeSwaps,
  isSaved,
  onSave,
  onOpenDetails,
  onCook,
  rating,
  onRate,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { recipe, reasons, missing_ingredients, matchPercent, swapped_tadka } = scoredRecipe;
  // Image is looked up from the original recipe so a tadka swap doesn't trigger a reload
  const { imageUrl } = useRecipeImage(original.recipe);

  const isRenderableImage =
    imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:') || imageUrl.startsWith('/'));
  const totalMinutes = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);

  const wantsLowerSugar =
    (!!userPrefs.diabetic_friendly || userPrefs.diet.includes('diabetic_friendly')) && canLowerSugar(original.recipe);

  const openDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDetails?.();
    setShowDetails(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index, 12) * 0.05 }}
        className="h-80 perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full h-full cursor-pointer"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card - Recipe Image */}
          <div
            className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 hover:border-green-400 transition-all group"
            inert={isFlipped}
          >
            <div className="relative h-full w-full bg-gradient-to-br from-orange-50 to-green-50">
              {isRenderableImage ? (
                <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">{imageUrl}</div>
              )}

              {/* Match badge */}
              <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
                <span className="px-2.5 py-1 rounded-full bg-white/95 shadow text-xs font-bold text-gray-900 tabular-nums">
                  {matchPercent}% match
                </span>
                {swapped_tadka && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white shadow text-[10px] font-semibold">
                    🔥 {getTadkaName(swapped_tadka.to)} tadka
                  </span>
                )}
                {scoredRecipe.swapped_masala && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white shadow text-[10px] font-semibold">
                    🫙 {getMasalaName(scoredRecipe.swapped_masala.to)}
                  </span>
                )}
                {scoredRecipe.sugar_swaps && scoredRecipe.sugar_swaps.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white shadow text-[10px] font-semibold">
                    🩺 Lower sugar
                  </span>
                )}
              </div>
              {isSaved && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 shadow text-[10px] font-semibold text-green-800">
                  📚 In cookbook
                </span>
              )}

              {/* Hover / focus overlay with recipe name and actions */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4">
                <h4 className="text-white font-bold text-lg mb-2 leading-tight">{recipe.name}</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openDetails}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    🔍 Why this matched
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-3 rounded-lg backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    ℹ️ Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Back of Card - Summary & Match Explanation */}
          <div
            className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg bg-white border-2 border-green-400"
            style={{ transform: 'rotateY(180deg)' }}
            inert={!isFlipped}
          >
            <div className="h-full flex flex-col p-4 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-800 leading-tight">{recipe.name}</h3>
                <span className="flex-shrink-0 text-sm font-bold text-gray-900 tabular-nums">{matchPercent}%</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 mb-2">
                {recipe.course && <span className="capitalize">{recipe.course}</span>}
                {totalMinutes > 0 && <span>⏱️ {totalMinutes} min</span>}
                {recipe.servings && <span>🍽️ {recipe.servings}</span>}
                {recipe.region_tags?.map((tag: string) => <span key={tag}>📍 {getRegionName(tag)}</span>)}
              </div>

              {/* Taste Indicators */}
              {recipe.taste_axes && (
                <div className="flex gap-2 mb-2 text-xs flex-wrap" aria-label="Flavor profile">
                  {recipe.taste_axes.heat > 0 && <span className="text-red-700 font-medium">🌶️×{recipe.taste_axes.heat}</span>}
                  {recipe.taste_axes.masala > 0 && <span className="text-orange-700 font-medium">🧄×{recipe.taste_axes.masala}</span>}
                  {recipe.taste_axes.tangy > 0 && <span className="text-yellow-700 font-medium">🍋×{recipe.taste_axes.tangy}</span>}
                  {recipe.taste_axes.sweet > 0 && <span className="text-amber-700 font-medium">🍯×{recipe.taste_axes.sweet}</span>}
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {reasons.length > 0 ? (
                  <MatchExplanationChip reasons={reasons} limit={3} size="sm" />
                ) : (
                  <p className="text-xs text-gray-600 italic">A wildcard from the recipe collection</p>
                )}

                {wantsLowerSugar && !scoredRecipe.sugar_swaps && (
                  <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1">
                    🩺 Lower-sugar swap available
                  </p>
                )}

                {missing_ingredients.length > 0 && (
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-[11px] font-semibold text-yellow-800">
                      You'll need ({missing_ingredients.length}):
                    </p>
                    <p className="text-[11px] text-yellow-800">
                      {missing_ingredients.slice(0, 3).join(', ')}
                      {missing_ingredients.length > 3 && ` +${missing_ingredients.length - 3} more`}
                    </p>
                  </div>
                )}

                {(recipe.masala_profiles?.length > 0 || recipe.tadka_profiles?.length > 0) && (
                  <div className="space-y-0.5 text-[11px]">
                    {recipe.masala_profiles?.length > 0 && (
                      <p>
                        <span className="font-semibold text-gray-700">Masala: </span>
                        <span className="text-gray-800">{recipe.masala_profiles.map(getMasalaName).join(', ')}</span>
                      </p>
                    )}
                    {recipe.tadka_profiles?.length > 0 && (
                      <p>
                        <span className="font-semibold text-gray-700">Tadka: </span>
                        <span className="text-gray-800">{recipe.tadka_profiles.map(getTadkaName).join(', ')}</span>
                        {swapped_tadka && <span className="text-amber-700 font-semibold"> (swapped)</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 mt-2 border-t border-green-200">
                <button
                  type="button"
                  onClick={openDetails}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  🔍 Why this matched
                  {(original.can_swap_tadka || original.can_swap_masala) && (
                    <span className="font-normal opacity-90"> · swaps</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  aria-label="Show recipe image"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-green-200 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  ↩
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showDetails && (
        <WhyThisMatchedModal
          scored={scoredRecipe}
          original={original}
          userPrefs={userPrefs}
          imageUrl={imageUrl}
          swaps={swaps}
          onChangeSwaps={(next) => onChangeSwaps?.(next)}
          isSaved={isSaved}
          onSave={onSave ? () => void onSave() : undefined}
          onCook={onCook}
          rating={rating}
          onRate={onRate}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default FlippableRecipeCard;
