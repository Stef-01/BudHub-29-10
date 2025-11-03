import { useState, useEffect, useMemo, useRef } from 'react';
import type { Recipe } from '../types';
import { getRecipeImageState, ImageState } from '../services/imageStoreService';
import { DEFAULT_RECIPE_IMAGE_B64 } from '../constants';
import { urlManager } from '../services/urlManager';

type ImageStatus = 'cached' | 'not_found';

export const useRecipeImage = (recipe: Recipe): {
    imageUrl: string;
    isGenerating: boolean;
    error: string | null;
    status: ImageStatus;
} => {

    // This state holds the resolved image data
    const [imageState, setImageState] = useState<ImageState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // This ref tracks the PREVIOUS state, allowing us to safely clean up its resources
    // AFTER the new state has been committed.
    const prevImageStateRef = useRef<ImageState | null>(null);

    // --- EFFECT 1: Data Fetching ---
    // This effect's ONLY job is to fetch the latest image state and update the component's state.
    useEffect(() => {
        let isStillMounted = true;

        const resolveImage = async () => {
            setIsLoading(true);

            const stateFromDb = await getRecipeImageState(recipe.id);

            if (isStillMounted) {
                setImageState(stateFromDb);
                setIsLoading(false);
            }
        };

        resolveImage();

        return () => {
            isStillMounted = false;
        };
    }, [recipe.id]);

    // --- EFFECT 2: Resource Cleanup on State Change ---
    // This effect runs AFTER Effect 1 has updated the state and the component has re-rendered.
    // Its job is to clean up the resources of the PREVIOUS state.
    useEffect(() => {
        const previousState = prevImageStateRef.current;
        const currentState = imageState;

        // If the key has changed, the previous URL is no longer needed and can be safely released.
        // This is safe because this effect runs *after* the render with the new URL.
        if (previousState && previousState.key !== currentState?.key) {
            urlManager.release(`${previousState.key}:thumb`);
            urlManager.release(`${previousState.key}:preview`);
            urlManager.release(`${previousState.key}:original`);
        }
        
        // Update the ref to the current state for the next render cycle.
        prevImageStateRef.current = currentState;

    }, [imageState]);

    // --- EFFECT 3: Final Unmount Cleanup ---
    // This effect's cleanup runs ONLY when the component is unmounted.
    useEffect(() => {
        return () => {
            // On unmount, we clean up the resources for whatever the last known state was.
            const lastState = prevImageStateRef.current;
            if (lastState) {
                urlManager.release(`${lastState.key}:thumb`);
                urlManager.release(`${lastState.key}:preview`);
                urlManager.release(`${lastState.key}:original`);
            }
        }
    }, []);

    // --- State Derivation & Return Logic ---
    const derivedStatusAndUrl = useMemo(() => {
        if (imageState) {
            return {
                status: 'cached' as ImageStatus,
                imageUrl: imageState.urls.thumb,
                error: null,
            };
        }

        // Use recipe emoji or default image if no image found
        const { image: emoji } = recipe;

        return {
            status: 'not_found' as ImageStatus,
            imageUrl: emoji || DEFAULT_RECIPE_IMAGE_B64,
            error: null,
        };

    }, [imageState, recipe]);

    return {
        imageUrl: derivedStatusAndUrl.imageUrl,
        isGenerating: false, // No generation anymore
        error: derivedStatusAndUrl.error,
        status: derivedStatusAndUrl.status,
    };
};
