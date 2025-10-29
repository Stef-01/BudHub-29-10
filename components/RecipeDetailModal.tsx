// components/RecipeDetailModal.tsx

import React from 'react';
import type { Recipe } from '../types';
import { XIcon, FireIcon, TimeIcon, UsersIcon, HeartIcon } from './icons/Icons';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const KeyInfo: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex flex-col items-center text-center p-2 bg-green-50 rounded-lg">
        <div className="text-green-700">{icon}</div>
        <p className="text-sm font-bold text-gray-800 mt-1">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const HealthTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
        <HeartIcon className="h-4 w-4 mr-1.5" />
        {children}
    </div>
);

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const isImageUrl = recipe.image && recipe.image.startsWith('http');

  const healthTags = [
      recipe.diabetic_friendly && 'Diabetic Friendly',
      recipe.high_fiber && 'High Fiber',
      recipe.high_protein && 'High Protein',
      recipe.low_carb && 'Low Carb',
      recipe.gluten_free && 'Gluten Free',
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`recipe-title-${recipe.id}`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="relative flex-shrink-0">
          {isImageUrl ? (
            <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover rounded-t-2xl" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-green-100 rounded-t-2xl">
              <span className="text-6xl">{recipe.image || '🍲'}</span>
            </div>
          )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-4 sm:p-6">
             <h2 id={`recipe-title-${recipe.id}`} className="text-2xl sm:text-3xl font-bold text-white shadow-text">{recipe.name}</h2>
           </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto">
            {/* Key Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <KeyInfo icon={<TimeIcon className="h-6 w-6"/>} label="Prep Time" value={`${recipe.prep_minutes} min`} />
                <KeyInfo icon={<TimeIcon className="h-6 w-6"/>} label="Cook Time" value={`${recipe.cook_minutes} min`} />
                <KeyInfo icon={<UsersIcon className="h-6 w-6"/>} label="Servings" value={recipe.servings} />
                <KeyInfo 
                    icon={<FireIcon className="h-6 w-6" />} 
                    label="Spice Level" 
                    value={['Mild', 'Low', 'Medium', 'Spicy'][recipe.spice_level] || 'Mild'} 
                />
            </div>

            {/* Health Tags */}
            {healthTags.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Health Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                        {healthTags.map(tag => <HealthTag key={tag}>{tag}</HealthTag>)}
                    </div>
                </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-green-900 border-b-2 border-green-200 pb-2 mb-3">Ingredients</h3>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {recipe.ingredients}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-green-900 border-b-2 border-green-200 pb-2 mb-3">Instructions</h3>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {recipe.instructions}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecipeDetailModal;