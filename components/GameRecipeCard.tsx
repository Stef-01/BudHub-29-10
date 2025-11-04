// components/GameRecipeCard.tsx

import React, { useMemo } from 'react';
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
  const { imageUrl, isGenerating } = useRecipeImage(recipe);

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
  const isRenderableImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:') || imageUrl.startsWith('/'));

  const feedbackText = useMemo(() => {
    switch (gameMode) {
        case 'high_protein':
            return recipe.protein_grams != null ? `Protein: ${recipe.protein_grams}g` : (recipe.high_protein ? 'High Protein' : 'Not High Protein');
        case 'high_fiber':
            return recipe.fiber_grams != null ? `Fiber: ${recipe.fiber_grams}g` : (recipe.high_fiber ? 'High Fiber' : 'Not High Fiber');
        case 'low_carb':
            return recipe.carbs_grams != null ? `Carbs: ${recipe.carbs_grams}g` : (recipe.low_carb ? 'Low Carb' : 'Not Low Carb');
        case 'diabetic_friendly':
            return recipe.diabetic_friendly ? 'Diabetic Friendly' : 'Not Recommended';
        default:
            return null;
    }
  }, [gameMode, recipe]);

  return (
    <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
      <button
        onClick={() => onClick(recipe.id)}
        disabled={isRevealed}
        className={`w-full bg-white rounded-xl shadow-md overflow-hidden border-4 ${getBorderColor()} transition-all duration-700 transform-gpu`}
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
            ) : (
              isRenderableImage ?
              <img className="h-full w-full object-cover" src={imageUrl} alt={recipe.name} /> :
              <div className="h-full w-full flex items-center justify-center text-6xl">{imageUrl}</div>
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
            transform: 'rotateY(180deg)',
          }}
        >
          <div className={`h-full w-full flex flex-col items-center justify-center p-6 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="text-6xl mb-4">{isCorrect ? '✓' : '✗'}</div>
            <h3 className="font-bold text-xl text-slate-800 mb-4 text-center">{recipe.name}</h3>
            {feedbackText && (
              <div className="text-center">
                <p className={`font-bold text-2xl ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {feedbackText}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default GameRecipeCard;