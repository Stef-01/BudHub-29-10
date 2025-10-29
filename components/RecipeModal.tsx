import React, { useState } from 'react';
import type { Recipe } from '../types';
import { XIcon } from './icons/Icons';

interface RecipeModalProps {
  onClose: () => void;
  onAddRecipe: (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ onClose, onAddRecipe }) => {
  const [formData, setFormData] = useState<Omit<Recipe, 'id' | 'source' | 'keyIngredients'>>({
    name: '',
    image: '',
    course: 'main',
    ingredients: '',
    instructions: '',
    prep_minutes: 0,
    cook_minutes: 0,
    servings: 4,
    spice_level: 0,
    diet_tags: [],
    diabetic_friendly: false,
    high_fiber: false,
    high_protein: false,
    low_carb: false,
    gluten_free: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ingredients || !formData.instructions) {
      alert('Please fill out the name, ingredients, and instructions.');
      return;
    }
    onAddRecipe(formData);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 id="add-recipe-title" className="text-xl sm:text-2xl font-bold text-green-900">Add Your Recipe</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Close">
            <XIcon className="h-6 w-6" />
          </button>
        </header>
        <form id="add-recipe-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Recipe Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image URL or Emoji</label>
              <input type="text" name="image" id="image" value={formData.image} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700">Course</label>
              <select name="course" id="course" value={formData.course} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                <option value="main">Main</option>
                <option value="side">Side</option>
                <option value="breakfast">Breakfast</option>
                <option value="snack">Snack</option>
                <option value="soup">Soup</option>
                <option value="condiment">Condiment</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
             <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700">Servings</label>
              <input type="number" name="servings" id="servings" value={formData.servings} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
              <label htmlFor="prep_minutes" className="block text-sm font-medium text-gray-700">Prep Time (mins)</label>
              <input type="number" name="prep_minutes" id="prep_minutes" value={formData.prep_minutes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
              <label htmlFor="cook_minutes" className="block text-sm font-medium text-gray-700">Cook Time (mins)</label>
              <input type="number" name="cook_minutes" id="cook_minutes" value={formData.cook_minutes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
              <textarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} required rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"></textarea>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea name="instructions" id="instructions" value={formData.instructions} onChange={handleChange} required rows={7} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"></textarea>
            </div>
          </div>
        </form>
        <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" form="add-recipe-form" className="ml-3 px-4 py-2 bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700">Add Recipe</button>
        </footer>
      </div>
    </div>
  );
};

export default RecipeModal;
