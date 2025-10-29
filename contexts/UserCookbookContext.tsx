import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Recipe } from '../types';
import { INITIAL_COOKBOOK } from '../constants';

interface UserCookbookContextType {
  recipes: Recipe[];
  addRecipe: (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => void;
  removeRecipe: (recipeId: string) => void;
  saveRecipeFromCatalog: (recipe: Recipe) => void;
  isRecipeSaved: (recipeId: string) => boolean;
}

const UserCookbookContext = createContext<UserCookbookContextType | undefined>(undefined);

export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('user_cookbook_recipes', INITIAL_COOKBOOK);

  const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => {
    const recipeId = `recipe-${new Date().getTime()}`;
    let finalImage = recipeData.image;
    let imageSource: 'unsplash' | 'user' | 'emoji' | 'preloaded' = 'emoji';

    // Check if image is already cached
    const cachedImage = imageCacheService.getCachedUrl(recipeId);
    if (cachedImage) {
      finalImage = cachedImage;
      imageSource = cachedImage.startsWith('http') ? 'unsplash' : 'emoji';
    } else if (!recipeData.image || recipeData.image.startsWith('http')) {
      // If no image or broken URL, fetch from Unsplash
      try {
        if (unsplashService.isConfigured()) {
          const fetchedImage = await unsplashService.fetchImageForRecipe(recipeData.name);
          if (fetchedImage) {
            finalImage = fetchedImage;
            imageSource = 'unsplash';
            imageCacheService.setCachedUrl(recipeId, fetchedImage, 'unsplash');
          } else {
            // Fallback to emoji
            finalImage = recipeData.image || '🍲';
            imageSource = 'emoji';
            imageCacheService.setCachedUrl(recipeId, finalImage, 'emoji');
          }
        }
      } catch (error) {
        console.error('Failed to fetch image for new recipe:', error);
        finalImage = recipeData.image || '🍲';
        imageSource = 'emoji';
      }
    } else {
      // User provided emoji or valid image
      imageSource = finalImage.startsWith('http') ? 'user' : 'emoji';
      imageCacheService.setCachedUrl(recipeId, finalImage, imageSource);
    }

    const newRecipe: Recipe = {
      ...recipeData,
      id: `recipe_${new Date().getTime()}`,
      source,
      // Gemini/user added recipes won't have this for now for simplicity
      keyIngredients: [], 
    };
    setRecipes(prev => [...prev, newRecipe]);
  };

  const removeRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const saveRecipeFromCatalog = (recipe: Recipe) => {
    setRecipes(prev => {
        if (prev.some(r => r.id === recipe.id)) return prev;
        return [...prev, recipe];
    });
  };

  const isRecipeSaved = (recipeId: string): boolean => {
    return recipes.some(r => r.id === recipeId);
  }

  return (
    <UserCookbookContext.Provider value={{ recipes, addRecipe, removeRecipe, saveRecipeFromCatalog, isRecipeSaved }}>
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
