// hooks/useRecipeImages.ts

import { useState, useEffect, useCallback } from 'react';
import type { Recipe } from '../types';
import { unsplashService } from '../services/unsplashService';
import { imageCacheService } from '../services/imageCacheService';

/**
 * Hook to manage recipe images with Unsplash API integration
 */
export function useRecipeImages(recipes: Recipe[]) {
  const [recipesWithImages, setRecipesWithImages] = useState<Recipe[]>(recipes);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Fetch and cache image for a single recipe
   */
  const fetchImageForRecipe = useCallback(async (recipe: Recipe): Promise<string> => {
    // Check cache first
    const cachedUrl = imageCacheService.getCachedUrl(recipe.id);
    if (cachedUrl) {
      return cachedUrl;
    }

    // If recipe already has an emoji (not a 404'd URL), cache and return it
    if (recipe.image && !recipe.image.startsWith('http')) {
      imageCacheService.setCachedUrl(recipe.id, recipe.image, 'emoji');
      return recipe.image;
    }

    try {
      // Fetch from Unsplash API
      const imageUrl = await unsplashService.fetchImageForRecipe(
        recipe.name,
        recipe.keyIngredients
      );

      if (imageUrl) {
        // Cache the fetched URL
        imageCacheService.setCachedUrl(recipe.id, imageUrl, 'unsplash');
        return imageUrl;
      }
    } catch (error) {
      console.error(`Failed to fetch image for ${recipe.name}:`, error);
    }

    // Fallback to emoji
    const fallbackEmoji = '🍲';
    imageCacheService.setCachedUrl(recipe.id, fallbackEmoji, 'emoji');
    return fallbackEmoji;
  }, []);

  /**
   * Initialize images for all recipes on first load
   */
  const initializeImages = useCallback(async () => {
    if (!unsplashService.isConfigured()) {
      console.warn('Unsplash not configured, using fallback images');
      return;
    }

    setIsInitializing(true);

    // Filter recipes that need images fetched
    const recipesToUpdate = recipes.filter(recipe => {
      const cachedUrl = imageCacheService.getCachedUrl(recipe.id);
      // Only fetch if no cache and recipe has http URL (potentially 404'd) or no image
      return !cachedUrl && (recipe.image.startsWith('http') || !recipe.image);
    });

    if (recipesToUpdate.length === 0) {
      console.log('✅ All recipe images already cached');

      // Load cached images
      const updatedRecipes = recipes.map(recipe => {
        const cachedUrl = imageCacheService.getCachedUrl(recipe.id);
        if (cachedUrl && cachedUrl !== recipe.image) {
          return {
            ...recipe,
            image: cachedUrl,
            imageSource: (cachedUrl.startsWith('http') ? 'unsplash' : 'emoji') as 'unsplash' | 'emoji',
          };
        }
        return recipe;
      });

      setRecipesWithImages(updatedRecipes);
      setIsInitializing(false);
      return;
    }

    console.log(`🔄 Initializing images for ${recipesToUpdate.length} recipes...`);

    // Fetch images in batches to avoid rate limiting
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 1000; // 1 second between batches

    for (let i = 0; i < recipesToUpdate.length; i += BATCH_SIZE) {
      const batch = recipesToUpdate.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (recipe) => {
          const imageUrl = await fetchImageForRecipe(recipe);
          return { recipeId: recipe.id, imageUrl };
        })
      );

      // Update recipes with fetched images
      setRecipesWithImages(prevRecipes =>
        prevRecipes.map(r => {
          const result = results.find(
            res => res.status === 'fulfilled' && res.value.recipeId === r.id
          );

          if (result && result.status === 'fulfilled') {
            return {
              ...r,
              image: result.value.imageUrl,
              imageSource: (result.value.imageUrl.startsWith('http') ? 'unsplash' : 'emoji') as 'unsplash' | 'emoji',
              imageLoading: false,
            };
          }

          return r;
        })
      );

      // Add delay between batches (except for last batch)
      if (i + BATCH_SIZE < recipesToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log('✅ Recipe images initialized!');
    setIsInitializing(false);

    // Log cache statistics
    const stats = imageCacheService.getCacheStats();
    console.log('📊 Image Cache Stats:', stats);
  }, [recipes, fetchImageForRecipe]);

  /**
   * Update images when recipes change (new recipes added)
   */
  useEffect(() => {
    setRecipesWithImages(recipes);
  }, [recipes]);

  /**
   * Fetch image for a new recipe (called when user adds a recipe)
   */
  const fetchImageForNewRecipe = useCallback(async (recipe: Recipe): Promise<Recipe> => {
    const imageUrl = await fetchImageForRecipe(recipe);

    return {
      ...recipe,
      image: imageUrl,
      imageSource: (imageUrl.startsWith('http') ? 'unsplash' : 'emoji') as 'unsplash' | 'emoji',
      imageLoading: false,
    };
  }, [fetchImageForRecipe]);

  return {
    recipes: recipesWithImages,
    isInitializing,
    initializeImages,
    fetchImageForNewRecipe,
  };
}
