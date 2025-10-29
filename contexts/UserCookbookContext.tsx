import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_COOKBOOK } from '../constants';
import type { Recipe } from '../types';
import { unsplashService } from '../services/unsplashService';
import { imageCacheService } from '../services/imageCacheService';

interface UserCookbookContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => Promise<void>;
  saveRecipeFromCatalog: (recipe: Recipe) => void;
  isRecipeSaved: (recipeId: string) => boolean;
}

const UserCookbookContext = createContext<UserCookbookContextType | undefined>(undefined);

export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('user_recipes', INITIAL_COOKBOOK);

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
      id: recipeId,
      source: source,
      keyIngredients: [], // User/Gemini recipes don't need key ingredients for sorting
      image: finalImage,
      imageSource: imageSource,
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