
import React from 'react';
import type { Recipe } from '../types';
import { XIcon, TrashIcon } from './icons/Icons';

interface ManageRecipesModalProps {
  recipes: Recipe[];
  onClose: () => void;
  // onRemoveRecipe: (recipeId: string) => void; // Optional: for future implementation
}

const ManageRecipesModal: React.FC<ManageRecipesModalProps> = ({ recipes, onClose }) => {
    const userRecipes = recipes.filter(r => r.source === 'user' || r.source === 'gemini');

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-recipes-title"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <h2 id="manage-recipes-title" className="text-xl sm:text-2xl font-bold text-green-900">Manage My Recipes</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        aria-label="Close"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </header>

                <main className="p-4 sm:p-6 overflow-y-auto">
                    {userRecipes.length > 0 ? (
                        <ul className="space-y-3">
                            {userRecipes.map(recipe => (
                                <li key={recipe.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-3xl mr-4">{recipe.image.startsWith('http') ? '🍲' : recipe.image}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">{recipe.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{recipe.source === 'gemini' ? 'Gemini Suggested' : 'Your Recipe'}</p>
                                        </div>
                                    </div>
                                    <button
                                        // onClick={() => onRemoveRecipe(recipe.id)}
                                        className="flex items-center justify-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={`Remove ${recipe.name}`}
                                        disabled // Delete functionality not implemented yet
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center p-8 bg-white/80 rounded-xl">
                            <p className="text-gray-600">You haven't added any custom recipes yet.</p>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ManageRecipesModal;
