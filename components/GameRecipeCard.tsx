// components/GameRecipeCard.tsx

import React, { useMemo, useState } from 'react';
import type { Recipe, GameMode } from '../types';
import { useRecipeImage } from '../hooks/useRecipeImage';

interface GameRecipeCardProps {
  recipe: Recipe;
  onClick: (recipeId: string) => void;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  gameMode: GameMode;
}

const GameRecipeCard: React.FC<GameRecipeCardProps> = ({ recipe, onClick, isSelected, isCorrect, isRevealed, gameMode }) => {
  const { imageUrl, isGenerating, status } = useRecipeImage(recipe);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Debug logging
  console.log(`[GameRecipeCard] ${recipe.name}: imageUrl="${imageUrl}", status="${status}", isGenerating=${isGenerating}`);

  const getBorderColor = () => {
    if (!isRevealed) {
      return 'border-gray-200 hover:border-blue-400';
    }
    if (isCorrect) {
      return 'border-green-500 ring-4 ring-green-200';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 ring-4 ring-red-200';
    }
    return 'border-gray-200 opacity-60';
  };
  
  // Check if imageUrl is a renderable image (URL or data URI), not just an emoji
  // If image failed to load, don't try to render it
  const isRenderableImage = !imageLoadFailed && imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:') || imageUrl.startsWith('/'));

  console.log(`[GameRecipeCard] ${recipe.name}: isRenderableImage=${isRenderableImage}, imageLoadFailed=${imageLoadFailed}, imageUrl starts with: ${imageUrl?.substring(0, 20)}...`);

  // Handle image load error by falling back to emoji
  const handleImageError = () => {
    console.log(`[GameRecipeCard] Image failed to load for ${recipe.name}, falling back to emoji`);
    setImageLoadFailed(true);
  };

  // Get nutrient data for display
  const nutrientData = useMemo(() => {
    switch (gameMode) {
        case 'high_protein':
            return {
              value: recipe.protein_grams,
              unit: 'g',
              label: 'Protein',
              maxScale: 25, // For visual bar scaling
              isHigh: recipe.high_protein,
            };
        case 'high_fiber':
            return {
              value: recipe.fiber_grams,
              unit: 'g',
              label: 'Fiber',
              maxScale: 20,
              isHigh: recipe.high_fiber,
            };
        case 'low_carb':
            return {
              value: recipe.carbs_grams,
              unit: 'g',
              label: 'Carbs',
              maxScale: 60,
              isHigh: !recipe.low_carb, // Inverted - high carbs is NOT low carb
            };
        case 'diabetic_friendly':
            return {
              value: null, // No numeric value for diabetic friendly
              unit: '',
              label: 'Blood Sugar Impact',
              maxScale: 1,
              isHigh: !recipe.diabetic_friendly, // Inverted - NOT diabetic friendly means high impact
            };
        default:
            return null;
    }
  }, [gameMode, recipe]);

  return (
    <div className="relative w-full" style={{ perspective: '1000px' }}>
      <button
        onClick={() => onClick(recipe.id)}
        disabled={isRevealed}
        className={`w-full min-h-80 bg-white rounded-xl shadow-md overflow-hidden border-4 ${getBorderColor()} transition-all duration-700 transform-gpu`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative h-48 w-full bg-green-50">
            {isGenerating ? (
              <div className="h-full w-full flex items-center justify-center text-gray-500">Loading...</div>
            ) : isRenderableImage ? (
              <img
                className="h-full w-full object-cover"
                src={imageUrl}
                alt={recipe.name}
                onError={handleImageError}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-6xl">{recipe.image || imageUrl}</div>
            )}
          </div>
          <div className="p-4 text-center">
            <h3 className="font-bold text-lg text-green-900 truncate">{recipe.name}</h3>
          </div>
        </div>

        {/* Back Face - Enhanced Nutrient Display */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className={`h-full w-full flex flex-col items-center justify-between p-6 ${isCorrect ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}>
            {/* Result Icon */}
            <div className={`text-5xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✓ CORRECT' : '✗ WRONG'}
            </div>

            {/* Recipe Name */}
            <h3 className="font-bold text-lg text-slate-800 text-center px-2">{recipe.name}</h3>

            {/* Nutrient Display */}
            {nutrientData && (
              <div className="w-full space-y-3">
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    {nutrientData.label}
                  </p>
                  {nutrientData.value !== null ? (
                    <>
                      <p className={`text-4xl font-bold ${isCorrect ? 'text-green-700' : 'text-slate-800'}`}>
                        {nutrientData.value}{nutrientData.unit}
                      </p>
                      {/* Visual bar showing relative amount */}
                      <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            nutrientData.isHigh
                              ? (isCorrect ? 'bg-green-600' : 'bg-amber-500')
                              : (isCorrect ? 'bg-blue-500' : 'bg-slate-400')
                          }`}
                          style={{ width: `${Math.min(100, (nutrientData.value / nutrientData.maxScale) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {nutrientData.isHigh ? (gameMode === 'low_carb' ? 'Higher carbs' : 'High amount') : (gameMode === 'low_carb' ? 'Lower carbs' : 'Lower amount')}
                      </p>
                    </>
                  ) : (
                    <p className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-rose-700'}`}>
                      {recipe.diabetic_friendly ? 'Low Impact ✓' : 'High Impact'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default GameRecipeCard;