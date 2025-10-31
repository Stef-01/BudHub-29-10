import { useState, useEffect, useRef } from 'react';
import type { Recipe } from '../types';
import { getRecipeImageState, ImageState } from '../services/imageStoreService';
import { getBackupState } from '../services/imageBackupService';
import { DEFAULT_RECIPE_IMAGE_B64, PRELOADED_RECIPE_IMAGES } from '../constants';
import { useImageGenerationBatch } from './useImageGenerationBatch';
import { getGenerationSpec } from '../services/imageService';
import { buildKey } from '../services/imageProcessingService';

export function useRecipeImage(recipe: Recipe) {
    const { enqueueRecipe, processingIds } = useImageGenerationBatch();
    const [imageUrl, setImageUrl] = useState<string>(DEFAULT_RECIPE_IMAGE_B64);
    const [error, setError] = useState<string | null>(null);
    const objectUrlRef = useRef<ImageState | null>(null);

    const isGenerating = processingIds.has(recipe.id);

    useEffect(() => {
        let isActive = true;

        async function loadOrEnqueueImage() {
            setError(null);
            
            // Determine if an AI image is desired for this recipe.
            const wantsAiImage = recipe.imageMetadata?.status === 'pending' || recipe.imageMetadata?.source === 'content_addressed';

            let expectedKey: string | null = null;
            if (wantsAiImage) {
                const spec = getGenerationSpec(recipe);
                expectedKey = await buildKey(spec);
            } else if (recipe.imageMetadata?.source === 'user_upload' && recipe.imageMetadata.image_key) {
                expectedKey = recipe.imageMetadata.image_key;
            }

            // 1. Check for an existing image in the primary store (IndexedDB)
            const currentState = await getRecipeImageState(recipe.id);
            if (isActive && currentState) {
                objectUrlRef.current = currentState;
                setImageUrl(currentState.preview);

                // If the key is what we expect, we're done.
                if (expectedKey && currentState.key === expectedKey) {
                    return; 
                }
            } else {
                // 2. If no primary image, check the failsafe backup (localStorage)
                const backupState = await getBackupState(recipe.id);
                if (isActive && backupState) {
                    console.log(`Restoring image for ${recipe.name} from localStorage backup.`);
                    if (backupState.thumbDataUri) {
                        // User-uploaded images have a thumbnail backup for immediate display.
                        setImageUrl(backupState.thumbDataUri);
                    }
                    if (backupState.manifest?.request?.source === 'ai_generated') {
                        // AI-generated images are re-queued for generation to restore hi-res version.
                        enqueueRecipe(recipe);
                    }
                    return; // Recovery initiated, exit.
                }
            }


            // --- 3. Set placeholder logic if no permanent or backup image is found ---
            if (isActive && !currentState) {
                const preloadedImage = PRELOADED_RECIPE_IMAGES[recipe.id];
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

            // --- 4. Handle background generation for stale or new images ---
            const needsFirstTimeGeneration = wantsAiImage && !currentState;
            const needsRegeneration = wantsAiImage && currentState && expectedKey && currentState.key !== expectedKey;
            
            if (needsFirstTimeGeneration || needsRegeneration) {
                enqueueRecipe(recipe);
            }

            if (isActive && recipe.imageMetadata?.status === 'failed') {
                setError(recipe.imageMetadata.errorMessage || "Image generation failed.");
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