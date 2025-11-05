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

  // Get nutrient data and thresholds for detailed display
  const nutrientInfo = useMemo(() => {
    switch (gameMode) {
        case 'high_protein':
            return {
              value: recipe.protein_grams ?? 0,
              unit: 'g',
              label: 'Protein',
              threshold: 15, // High protein threshold
              maxScale: 30, // For visual bar scaling
              isAboveThreshold: recipe.high_protein,
              targetText: '≥15g = High Protein'
            };
        case 'high_fiber':
            return {
              value: recipe.fiber_grams ?? 0,
              unit: 'g',
              label: 'Fiber',
              threshold: 8,
              maxScale: 20,
              isAboveThreshold: recipe.high_fiber,
              targetText: '≥8g = High Fiber'
            };
        case 'low_carb':
            return {
              value: recipe.carbs_grams ?? 0,
              unit: 'g',
              label: 'Carbs',
              threshold: 20,
              maxScale: 60,
              isAboveThreshold: !recipe.low_carb, // Inverted logic
              targetText: '≤20g = Low Carb',
              invertedLogic: true // Low value is the goal
            };
        case 'diabetic_friendly':
            return {
              value: null,
              unit: '',
              label: 'Blood Sugar Impact',
              threshold: 0,
              maxScale: 1,
              isAboveThreshold: !recipe.diabetic_friendly,
              targetText: recipe.diabetic_friendly ? 'Diabetic Friendly ✓' : 'Not Recommended ✗'
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

        {/* Back Face */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white to-slate-50">
            {/* Recipe Name */}
            <h3 className="font-bold text-lg text-slate-800 text-center px-2 mb-4">{recipe.name}</h3>

            {/* Nutrient Display */}
            {nutrientInfo && (
              <div className="w-full space-y-3">
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    {nutrientInfo.label}
                  </p>
                  {nutrientInfo.value !== null ? (
                    <>
                      <p className={`text-4xl font-bold ${isCorrect ? 'text-green-700' : 'text-slate-800'}`}>
                        {nutrientInfo.value}{nutrientInfo.unit}
                      </p>
                      {/* Visual bar showing relative amount */}
                      <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            nutrientInfo.isAboveThreshold
                              ? (isCorrect ? 'bg-green-600' : 'bg-amber-500')
                              : (isCorrect ? 'bg-blue-500' : 'bg-slate-400')
                          }`}
                          style={{ width: `${Math.min(100, (nutrientInfo.value / nutrientInfo.maxScale) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {nutrientInfo.targetText}
                      </p>
                    </>
                  ) : (
                    <p className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-rose-700'}`}>
                      {nutrientInfo.targetText}
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