import { useState, useEffect, useRef } from 'react';
import type { Recipe } from '../types';
import { getRecipeImageUrls, ImageUrls } from '../services/imageStoreService';
import { DEFAULT_RECIPE_IMAGE_B64, PRELOADED_RECIPE_IMAGES } from '../constants';
import { useImageGenerationBatch } from './useImageGenerationBatch';

export function useRecipeImage(recipe: Recipe) {
    const { enqueueRecipe, processingIds } = useImageGenerationBatch();
    const [imageUrl, setImageUrl] = useState<string>(DEFAULT_RECIPE_IMAGE_B64);
    const [error, setError] = useState<string | null>(null);
    const objectUrlRef = useRef<ImageUrls | null>(null);

    const isGenerating = processingIds.has(recipe.id);

    useEffect(() => {
        let isActive = true;

        async function loadOrEnqueueImage() {
            setError(null);
            // Priority 1: Check for an existing image in the permanent store (IndexedDB)
            const cachedUrls = await getRecipeImageUrls(recipe.id);
            if (isActive && cachedUrls) {
                objectUrlRef.current = cachedUrls;
                setImageUrl(cachedUrls.preview);
                return;
            }

            // --- Set placeholder logic ---
            // This runs if no permanent image is found. It sets the best available placeholder.
            const preloadedImage = PRELOADED_RECIPE_IMAGES[recipe.id];
            if (isActive) {
                if (preloadedImage) {
                    setImageUrl(preloadedImage);
                } else if (recipe.image && (recipe.image.startsWith('http') || recipe.image.startsWith('data:') || recipe.image.startsWith('blob:'))) {
                    setImageUrl(recipe.image);
                } else if (recipe.image) { // Handles emojis
                    setImageUrl(recipe.image);
                } else {
                    setImageUrl(DEFAULT_RECIPE_IMAGE_B64);
                }
            }

            // --- Handle background generation ---
            // This runs independently of setting the placeholder. The `isGenerating` flag
            // will correctly show a spinner over the high-quality placeholder.
            const needsGeneration =
                !recipe.imageMetadata?.image_key &&
                recipe.imageMetadata?.status === 'pending';

            if (needsGeneration) {
                enqueueRecipe(recipe);
            }

            if (isActive && recipe.imageMetadata?.status === 'failed') {
                setError("Image generation failed.");
            }
        }

        loadOrEnqueueImage();

        return () => {
            isActive = false;
            // Revoke any created object URLs to prevent memory leaks
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current.thumb);
                URL.revokeObjectURL(objectUrlRef.current.preview);
                URL.revokeObjectURL(objectUrlRef.current.original);
                objectUrlRef.current = null;
            }
        };
    }, [recipe.id, recipe.image, recipe.source, recipe.imageMetadata, enqueueRecipe]);

    return { imageUrl, isGenerating, error };
}