import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_COOKBOOK } from '../constants';
import type { Recipe } from '../types';

interface UserCookbookContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => void;
  saveRecipeFromCatalog: (recipe: Recipe) => void;
  isRecipeSaved: (recipeId: string) => boolean;
}

const UserCookbookContext = createContext<UserCookbookContextType | undefined>(undefined);

export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('user_recipes', INITIAL_COOKBOOK);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `recipe-${new Date().getTime()}`,
      source: source,
      keyIngredients: [], // User/Gemini recipes don't need key ingredients for sorting
    };
    setRecipes(prev => [newRecipe, ...prev]);
  };

  const saveRecipeFromCatalog = (recipe: Recipe) => {
      setRecipes(prev => {
          if (prev.some(r => r.id === recipe.id)) return prev;
          return [...prev, recipe];
      });
  };

  const isRecipeSaved = (recipeId: string): boolean => {
      return recipes.some(r => r.id === recipeId);
  };

  return (
    <UserCookbookContext.Provider value={{ recipes, addRecipe, saveRecipeFromCatalog, isRecipeSaved }}>
      {children}
    </UserCookbookContext.Provider>
  );
};

export const useUserCookbook = (): UserCookbookContextType => {
  const context = useContext(UserCookbookContext);
  if (context === undefined) {
    throw new Error('useUserCookbook must be used within a UserCookbookProvider');
  }
  return context;
};