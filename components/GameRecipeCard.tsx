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
            const proteinValue = recipe.protein_grams ?? 0;
            const proteinDiff = proteinValue - 15;
            return {
              value: proteinValue,
              unit: 'g',
              label: 'Protein',
              threshold: 15, // High protein threshold
              maxScale: 30, // For visual bar scaling
              isAboveThreshold: recipe.high_protein,
              targetText: '≥15g = High Protein',
              difference: proteinDiff,
              differenceText: proteinDiff >= 0
                ? `${Math.abs(proteinDiff)}g above threshold`
                : `${Math.abs(proteinDiff)}g below threshold`
            };
        case 'high_fiber':
            const fiberValue = recipe.fiber_grams ?? 0;
            const fiberDiff = fiberValue - 8;
            return {
              value: fiberValue,
              unit: 'g',
              label: 'Fiber',
              threshold: 8,
              maxScale: 20,
              isAboveThreshold: recipe.high_fiber,
              targetText: '≥8g = High Fiber',
              difference: fiberDiff,
              differenceText: fiberDiff >= 0
                ? `${Math.abs(fiberDiff)}g above threshold`
                : `${Math.abs(fiberDiff)}g below threshold`
            };
        case 'low_carb':
            const carbsValue = recipe.carbs_grams ?? 0;
            const carbsDiff = carbsValue - 20;
            return {
              value: carbsValue,
              unit: 'g',
              label: 'Carbs',
              threshold: 20,
              maxScale: 60,
              isAboveThreshold: !recipe.low_carb, // Inverted logic
              targetText: '≤20g = Low Carb',
              invertedLogic: true, // Low value is the goal
              difference: carbsDiff,
              differenceText: carbsDiff <= 0
                ? `${Math.abs(carbsDiff)}g below threshold`
                : `${Math.abs(carbsDiff)}g above threshold`
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

        {isRevealed && nutrientInfo && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-3">
                {nutrientInfo.value !== null ? (
                  <>
                    <div className="text-white text-xs mb-1 font-semibold">{nutrientInfo.label}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-700 h-4 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isCorrect ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((nutrientInfo.value / nutrientInfo.maxScale) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-white font-bold text-sm min-w-[3rem] text-right">
                        {nutrientInfo.value}{nutrientInfo.unit}
                      </span>
                    </div>
                    <div className="text-gray-300 text-xs mb-0.5">{nutrientInfo.targetText}</div>
                    {nutrientInfo.differenceText && (
                      <div className={`text-xs font-medium ${
                        isCorrect ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {nutrientInfo.differenceText}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-white text-sm font-semibold text-center">
                    {nutrientInfo.targetText}
                  </div>
                )}
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