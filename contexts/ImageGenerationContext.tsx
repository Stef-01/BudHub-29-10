import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from './UserCookbookContext';
import { generateAndStoreRecipeImage } from '../services/imageService';

const MAX_CONCURRENT_GENERATIONS = 1; // Keep it low to be safe

export interface ImageGenerationContextType {
    enqueueRecipe: (recipe: Recipe) => void;
    processingIds: Set<string>;
    queueSize: number;
    totalEnqueued: number;
}

export const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const ImageGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { updateRecipe } = useUserCookbook();
    const [queue, setQueue] = useState<Recipe[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const enqueuedIds = useRef<Set<string>>(new Set());
    const [totalEnqueued, setTotalEnqueued] = useState(0);
    const [isInitialDelayOver, setIsInitialDelayOver] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitialDelayOver(true), 5000); // 5s initial delay
        return () => clearTimeout(timer);
    }, []);

    const enqueueRecipe = useCallback((recipe: Recipe) => {
        // Only enqueue if it hasn't been enqueued before in this session
        if (!enqueuedIds.current.has(recipe.id)) {
            setQueue(prev => [...prev, recipe]);
            enqueuedIds.current.add(recipe.id);
            setTotalEnqueued(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        const processQueue = async () => {
            if (!isInitialDelayOver || processingIds.size >= MAX_CONCURRENT_GENERATIONS || queue.length === 0) {
                return;
            }

            const recipeToProcess = queue[0];
            
            // This is an atomic update to prevent race conditions
            setQueue(prev => prev.slice(1));
            setProcessingIds(prev => new Set(prev).add(recipeToProcess.id));

            try {
                const { key, urls } = await generateAndStoreRecipeImage(recipeToProcess);
                const updatedRecipe: Recipe = {
                    ...recipeToProcess,
                    image: '', // Store empty string, hook will resolve from IDB
                    imageMetadata: {
                        source: 'content_addressed',
                        status: 'generated',
                        image_key: key,
                    }
                };
                updateRecipe(updatedRecipe);
            } catch (err) {
                console.error(`Failed to generate image for ${recipeToProcess.name}:`, err);
                const updatedRecipe: Recipe = {
                    ...recipeToProcess,
                    imageMetadata: {
                        ...recipeToProcess.imageMetadata!,
                        status: 'failed',
                    }
                };
                updateRecipe(updatedRecipe);
            } finally {
                // Add a cooldown to respect API rate limits. The processing slot is
                // not freed until after the delay, effectively pausing the queue.
                setTimeout(() => {
                    setProcessingIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(recipeToProcess.id);
                        return newSet;
                    });
                }, 60500); // Increased cooldown to >60s to respect free-tier API rate limits (e.g., 1 RPM).
            }
        };

        processQueue();

    }, [queue, processingIds, updateRecipe, isInitialDelayOver]);


    const value = {
        enqueueRecipe,
        processingIds,
        queueSize: queue.length,
        totalEnqueued
    };

    return (
        <ImageGenerationContext.Provider value={value}>
            {children}
        </ImageGenerationContext.Provider>
    );
};