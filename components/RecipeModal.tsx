import React, { useState } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { XIcon } from './icons/Icons';
import Button from './ui/Button';

interface RecipeModalProps {
  onClose: () => void;
}

// Helper functions for security and validation
const sanitizeInput = (input: string): string => {
    // A simple sanitizer to remove HTML tags. For a real app, use a library like DOMPurify.
    return input.replace(/<[^>]+>/g, '');
};

const validateRecipeData = (data: Partial<Recipe>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.name || data.name.trim().length < 3) errors.name = 'Recipe name must be at least 3 characters long.';
    if (data.name && data.name.length > 100) errors.name = 'Recipe name must be 100 characters or less.';
    if (!data.ingredients || data.ingredients.trim().length < 10) errors.ingredients = 'Ingredients must be at least 10 characters long.';
    if (!data.instructions || data.instructions.trim().length < 10) errors.instructions = 'Instructions must be at least 10 characters long.';
    if (data.prep_minutes != null && (data.prep_minutes < 0 || data.prep_minutes > 1440)) errors.prep_minutes = 'Prep time must be between 0 and 1440 minutes.';
    if (data.cook_minutes != null && (data.cook_minutes < 0 || data.cook_minutes > 1440)) errors.cook_minutes = 'Cook time must be between 0 and 1440 minutes.';
    if (data.servings != null && (data.servings < 1 || data.servings > 100)) errors.servings = 'Servings must be between 1 and 100.';
    return errors;
};

const RecipeModal: React.FC<RecipeModalProps> = ({ onClose }) => {
  const { saveRecipe } = useUserCookbook();
  const [formData, setFormData] = useState<Omit<Recipe, 'id' | 'source' | 'keyIngredients' | 'imageMetadata'>>({
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
    }
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRecipeData(formData);
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }
    
    const newRecipe: Recipe = {
        ...formData,
        id: `recipe_user_${new Date().getTime()}`,
        name: sanitizeInput(formData.name.trim()),
        image: sanitizeInput(formData.image.trim()),
        ingredients: sanitizeInput(formData.ingredients.trim()),
        instructions: sanitizeInput(formData.instructions.trim()),
        source: 'user',
        keyIngredients: [],
        imageMetadata: { source: 'user', status: 'cached' }
    };
    saveRecipe(newRecipe);
    onClose();
  };

  const ErrorMessage: React.FC<{ field: string }> = ({ field }) => (
      errors[field] ? <p className="text-red-600 text-sm mt-1">{errors[field]}</p> : null
  );

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
        <form id="add-recipe-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Recipe Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required minLength={3} maxLength={100} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              <ErrorMessage field="name" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image URL or Emoji</label>
              <input type="text" name="image" id="image" value={formData.image} onChange={handleChange} maxLength={200} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
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
              <input type="number" name="servings" id="servings" value={formData.servings} onChange={handleChange} min="1" max="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              <ErrorMessage field="servings" />
            </div>
            <div>
              <label htmlFor="prep_minutes" className="block text-sm font-medium text-gray-700">Prep Time (mins)</label>
              <input type="number" name="prep_minutes" id="prep_minutes" value={formData.prep_minutes} onChange={handleChange} min="0" max="1440" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              <ErrorMessage field="prep_minutes" />
            </div>
            <div>
              <label htmlFor="cook_minutes" className="block text-sm font-medium text-gray-700">Cook Time (mins)</label>
              <input type="number" name="cook_minutes" id="cook_minutes" value={formData.cook_minutes} onChange={handleChange} min="0" max="1440" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              <ErrorMessage field="cook_minutes" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
              <textarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} required minLength={10} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"></textarea>
              <ErrorMessage field="ingredients" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea name="instructions" id="instructions" value={formData.instructions} onChange={handleChange} required minLength={10} rows={7} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"></textarea>
              <ErrorMessage field="instructions" />
            </div>
          </div>
        </form>
        <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0 space-x-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="add-recipe-form">Add Recipe</Button>
        </footer>
      </div>
    </div>
  );
};

export default RecipeModal;
