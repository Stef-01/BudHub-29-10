import React, { useRef, useState } from 'react';
import type { Recipe } from '../types';
import { XIcon, FireIcon, TimeIcon, UsersIcon, HeartIcon, LoadingSpinner, CameraIcon } from './icons/Icons';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { useUserCookbook } from '../contexts/UserCookbookContext';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const { imageUrl, isGenerating } = useRecipeImage(recipe);
  const { saveOrUpdateRecipeImage } = useUserCookbook();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isRenderableImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await saveOrUpdateRecipeImage(recipe, file);
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="relative flex-shrink-0 group">
          <div className="h-56 w-full rounded-t-2xl bg-green-50">
            {isUploading || isGenerating ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-2">
                <LoadingSpinner className="h-8 w-8 text-green-600" />
                <p className="mt-2 text-sm text-gray-500">{isUploading ? 'Uploading...' : 'Generating...'}</p>
              </div>
            ) : isRenderableImage ? (
              <img className="h-full w-full object-cover rounded-t-2xl" src={imageUrl} alt={recipe.name} />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-green-100 text-6xl rounded-t-2xl">{imageUrl}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="absolute bottom-3 right-3 flex items-center px-3 py-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            aria-label="Change recipe image"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Change Image
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          <h2 id="recipe-detail-title" className="text-3xl font-bold text-green-900">{recipe.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-600">
            <div className="flex items-center"><TimeIcon className="h-5 w-5 mr-1.5 text-gray-400" /> Prep: {recipe.prep_minutes}m, Cook: {recipe.cook_minutes}m</div>
            <div className="flex items-center"><UsersIcon className="h-5 w-5 mr-1.5 text-gray-400" /> Serves {recipe.servings}</div>
            <div className="flex items-center"><FireIcon className="h-5 w-5 mr-1.5 text-gray-400" /> {['Mild', 'Spicy', 'Hot', 'Fiery'][recipe.spice_level]}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.diet_tags.map(tag => (
              <span key={tag} className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{tag.replace(/_/g, ' ')}</span>
            ))}
            {recipe.diabetic_friendly && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center"><HeartIcon className="h-3 w-3 mr-1"/> Diabetic Friendly</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-1">
              <h3 className="text-xl font-semibold text-green-800 border-b-2 border-green-200 pb-2 mb-3">Ingredients</h3>
              <pre className="text-gray-700 whitespace-pre-wrap font-sans text-sm">{recipe.ingredients}</pre>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold text-green-800 border-b-2 border-green-200 pb-2 mb-3">Instructions</h3>
              <pre className="text-gray-700 whitespace-pre-wrap font-sans text-sm">{recipe.instructions}</pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecipeDetailModal;