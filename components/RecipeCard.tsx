import React from 'react';
import type { Recipe } from '../types';
import { FireIcon, HeartIcon, LoadingSpinner, AlertTriangleIcon, RetryIcon } from './icons/Icons';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { useImageGenerationBatch } from '../hooks/useImageGenerationBatch';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const { imageUrl, isGenerating, error, status } = useRecipeImage(recipe);
  const { reEnqueueRecipe } = useImageGenerationBatch();

  const isRenderableImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'));

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    reEnqueueRecipe(recipe);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-40 w-full bg-green-50">
        {status === 'failed' ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-2 text-red-500">
                <AlertTriangleIcon className="h-8 w-8" />
                <p className="text-xs mt-2 font-semibold" title={error || 'Unknown error'}>Generation Failed</p>
                <button 
                    onClick={handleRetry} 
                    className="mt-2 flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold hover:bg-red-200 transition-colors"
                >
                    <RetryIcon className="h-3 w-3 mr-1.5" />
                    Retry
                </button>
            </div>
        ) : isGenerating ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-2">
                <LoadingSpinner className="h-8 w-8 text-green-600" />
                <p className="text-xs text-gray-500 mt-2">Generating image...</p>
            </div>
        ) : (
          isRenderableImage ? 
            <img className="h-full w-full object-cover" src={imageUrl} alt={recipe.name} /> : 
            <div className="h-full w-full flex items-center justify-center text-6xl">{imageUrl}</div>
        )}
        
        <div className="absolute top-0 right-0 p-2 bg-black/40 rounded-bl-xl">
            {recipe.imageMetadata?.source === 'ai_generated' && <span title="AI Generated" className="text-xl">✨</span>}
            {recipe.imageMetadata?.source === 'content_addressed' && <span title="AI Generated" className="text-xl">✨</span>}
            {recipe.imageMetadata?.source === 'user_upload' && <span title="Custom Photo" className="text-xl">👤</span>}
            {recipe.source === 'user' && !recipe.imageMetadata?.source && <span title="Your Recipe" className="text-xl">👤</span>}
            {recipe.imageMetadata?.source === 'preloaded' && <span title="Vibe Recipe" className="text-xl">🌿</span>}
            {recipe.imageMetadata?.source === 'emoji' && <span title="Vibe Recipe" className="text-xl">🌿</span>}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-green-900 truncate group-hover:text-green-600 transition-colors">{recipe.name}</h3>
        <p className="text-sm text-gray-500 capitalize">{recipe.course}</p>
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div className="flex items-center">
                <FireIcon className={`h-4 w-4 ${recipe.spice_level > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <span className="ml-1">{['Mild', 'Spicy', 'Hot', 'Fiery'][recipe.spice_level]}</span>
            </div>
            {recipe.diabetic_friendly && (
                 <div className="flex items-center" title="Diabetic Friendly">
                    <HeartIcon className="h-4 w-4 text-blue-500" />
                    <span className="ml-1">DF</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
