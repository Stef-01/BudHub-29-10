import React from 'react';
import type { Recipe } from '../types';
import { SparklesIcon, BookOpenIcon } from './icons/Icons';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const isImageUrl = recipe.image && recipe.image.startsWith('http');
  
  return (
    <div 
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer hover:-translate-y-1 group overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <div className="relative">
        {isImageUrl ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-40 object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.style.display = 'none';
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = 'w-full h-40 flex items-center justify-center bg-green-100';
              const fallbackSpan = document.createElement('span');
              fallbackSpan.className = 'text-5xl';
              fallbackSpan.textContent = '🍲';
              fallbackDiv.appendChild(fallbackSpan);
              target.parentElement?.appendChild(fallbackDiv);
            }}
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-green-100">
            <span className="text-5xl">{recipe.image || '🍲'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <h3 className="font-bold text-lg text-green-900 line-clamp-2">{recipe.name}</h3>
        <div className="mt-2">
            {recipe.source === 'gemini' && (
                <span className="inline-flex items-center bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <SparklesIcon className="h-4 w-4 mr-1.5" />
                Gemini ✨
                </span>
            )}
            {recipe.source === 'user' && (
                <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <BookOpenIcon className="h-4 w-4 mr-1.5" />
                Your Recipe
                </span>
            )}
             {recipe.source === 'preloaded' && (
                <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                 From the Garden Library
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
