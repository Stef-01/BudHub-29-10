import React, { useState } from 'react';
import type { Recipe } from '../types';
import { XIcon, PlusIcon } from './icons/Icons';

interface RecipeModalProps {
  onClose: () => void;
  onAddRecipe: (recipe: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ onClose, onAddRecipe }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('🍲'); // Default to emoji
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ingredients || !instructions) {
      alert("Please fill out all fields.");
      return;
    }
    // FIX: Added default values for missing Recipe properties to match the expected type for `onAddRecipe`.
    onAddRecipe({
      name,
      image,
      ingredients,
      instructions,
      course: 'main',
      diet_tags: [],
      spice_level: 1,
      prep_minutes: 15,
      cook_minutes: 20,
      servings: 4,
      diabetic_friendly: false,
      high_fiber: false,
      high_protein: false,
      low_carb: false,
      gluten_free: false,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-recipe-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 id="add-recipe-title" className="text-xl sm:text-2xl font-bold text-green-900">Add a New Recipe</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
          <main className="p-4 sm:p-6 overflow-y-auto space-y-4">
            <div>
              <label htmlFor="recipe-name" className="block text-sm font-medium text-gray-700">Recipe Name</label>
              <input type="text" id="recipe-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="recipe-image" className="block text-sm font-medium text-gray-700">Image (URL or Emoji)</label>
              <input type="text" id="recipe-image" value={image} onChange={e => setImage(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="recipe-ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
              <textarea id="recipe-ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} required rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" placeholder="List each ingredient on a new line..."></textarea>
            </div>
            <div>
              <label htmlFor="recipe-instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea id="recipe-instructions" value={instructions} onChange={e => setInstructions(e.target.value)} required rows={7} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" placeholder="1. First step...&#10;2. Second step..."></textarea>
            </div>
          </main>
          <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Recipe
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default RecipeModal;