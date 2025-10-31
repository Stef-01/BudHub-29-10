// components/GameRecipeCard.tsx

import React from 'react';
import type { Recipe } from '../types';
import { useRecipeImage } from '../hooks/useRecipeImage';

interface GameRecipeCardProps {
  recipe: Recipe;
  onClick: (recipeId: string) => void;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
}

const GameRecipeCard: React.FC<GameRecipeCardProps> = ({ recipe, onClick, isSelected, isCorrect, isRevealed }) => {
  const { imageUrl, isGenerating } = useRecipeImage(recipe);

  const getBorderColor = () => {
    if (!isRevealed) {
      return isSelected ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200 hover:border-blue-400';
    }
    if (isCorrect) {
      return 'border-green-500 ring-4 ring-green-200';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 ring-4 ring-red-200';
    }
    return 'border-gray-200 opacity-50';
  };
  
  const isRenderableImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'));

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
      </div>
      <div className="p-4 text-center">
        <h3 className="font-bold text-lg text-green-900 truncate">{recipe.name}</h3>
      </div>
    </button>
  );
};

export default GameRecipeCard;
