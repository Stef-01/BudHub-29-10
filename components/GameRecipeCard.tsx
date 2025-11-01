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
  
  const isRenderableImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'));

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
    <button
      onClick={() => onClick(recipe.id)}
      disabled={isRevealed}
      className={`w-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 border-4 ${getBorderColor()}`}
    >
      <div className="relative h-48 w-full bg-green-50">
        {isGenerating ? (
          <div className="h-full w-full flex items-center justify-center text-gray-500">Loading...</div>
        ) : (
          isRenderableImage ?
          <img className="h-full w-full object-cover" src={imageUrl} alt={recipe.name} /> :
          <div className="h-full w-full flex items-center justify-center text-6xl">{imageUrl}</div>
        )}

        {isRevealed && feedbackText && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-center">
                <p className="text-white font-bold text-sm">{feedbackText}</p>
            </div>
        )}
      </div>
      <div className="p-4 text-center">
        <h3 className="font-bold text-lg text-green-900 truncate">{recipe.name}</h3>
      </div>
    </button>
  );
};

export default GameRecipeCard;