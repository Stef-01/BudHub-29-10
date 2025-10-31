import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { Recipe } from '../types';
import { 
    getMyRecipes, 
    addRecipe as dbAddRecipe, 
    removeRecipe as dbRemoveRecipe 
} from '../services/db';
import { processAndStoreUserImage } from '../services/imageService';


interface UserCookbookContextType {
  recipes: Recipe[];
  addRecipe: (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => void;
  updateRecipe: (updatedRecipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;
  saveOrUpdateRecipeImage: (recipe: Recipe, file: File) => Promise<void>;
  saveRecipeFromCatalog: (recipe: Recipe) => void;
  isRecipeSaved: (recipeId: string) => boolean;
  loading: boolean;
}

const UserCookbookContext = createContext<UserCookbookContextType | undefined>(undefined);

export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
        setLoading(true);
        const savedRecipes = await getMyRecipes();
        setRecipes(savedRecipes);
        setLoading(false);
    };
    loadRecipes();
  }, []);


  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'source' | 'keyIngredients'>, source: 'user' | 'gemini') => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `recipe_${new Date().getTime()}`,
      source,
      keyIngredients: [], 
      imageMetadata: {
        source: source === 'user' ? 'user' : 'emoji',
        status: source === 'user' ? 'cached' : 'pending',
      }
    };
    setRecipes(prev => [...prev, newRecipe]);
    dbAddRecipe(newRecipe);
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => {
        const exists = prev.some(r => r.id === updatedRecipe.id);
        if (exists) {
            return prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
        }
        return [...prev, updatedRecipe];
    });
    // dbAddRecipe performs INSERT OR REPLACE, which is correct for an upsert.
    dbAddRecipe(updatedRecipe);
  };
  
  const saveOrUpdateRecipeImage = async (recipe: Recipe, file: File) => {
    const { key } = await processAndStoreUserImage(recipe, file);

    const baseRecipe = recipes.find(r => r.id === recipe.id) || recipe;

    const updatedRecipe: Recipe = {
        ...baseRecipe,
        image: '', // Clear any temporary or old image value
        imageMetadata: {
            source: 'user_upload',
            status: 'generated',
            image_key: key,
        }
    };
    
    // Call the newly robust updateRecipe function
    updateRecipe(updatedRecipe);
  };

  const removeRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    dbRemoveRecipe(recipeId);
  };

  const saveRecipeFromCatalog = (recipe: Recipe) => {
    setRecipes(prev => {
        if (prev.some(r => r.id === recipe.id)) return prev;
        dbAddRecipe(recipe);
        return [...prev, recipe];
    });
  };

  const isRecipeSaved = (recipeId: string): boolean => {
    return recipes.some(r => r.id === recipeId);
  }

  return (
    <UserCookbookContext.Provider value={{ recipes, addRecipe, updateRecipe, removeRecipe, saveOrUpdateRecipeImage, saveRecipeFromCatalog, isRecipeSaved, loading }}>
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