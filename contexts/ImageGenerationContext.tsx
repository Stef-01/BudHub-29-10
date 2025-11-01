// contexts/ImageGenerationContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from './UserCookbookContext';
import { generateAndStoreRecipeImage } from '../services/imageService';
import { saveAlias } from '../services/imageStoreService';

const MAX_CONCURRENT_GENERATIONS = 1;
const RATE_LIMIT_RETRY_DELAY = 5 * 60 * 1000;

export interface ImageGenerationContextType {
    enqueueRecipe: (recipe: Recipe) => void;
    reEnqueueRecipe: (recipe: Recipe) => void;
    processingIds: Set<string>;
    queueSize: number;
    totalEnqueued: number;
    isRateLimited: boolean;
}

export const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const ImageGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { saveToTransientCache, loading: cookbookLoading } = useUserCookbook();

    const queueRef = useRef<Recipe[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [queueSize, setQueueSize] = useState(0);
    const [totalEnqueued, setTotalEnqueued] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const enqueuedIdsRef = useRef<Set<string>>(new Set());
    const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

    const processQueue = useCallback(async () => {
        if (cookbookLoading || processingIds.size >= MAX_CONCURRENT_GENERATIONS || queueRef.current.length === 0 || isRateLimited) {
            return;
        }

        const recipeToProcess = queueRef.current.shift();
        if (!recipeToProcess) return;

        setQueueSize(q => q - 1);
        setProcessingIds(p => new Set(p).add(recipeToProcess.id));

        try {
            const { key } = await generateAndStoreRecipeImage(recipeToProcess);
            const updatedRecipe: Recipe = {
                ...recipeToProcess,
                imageMetadata: { source: 'ai_generated', status: 'generated', image_key: key },
            };
            await saveAlias(updatedRecipe.id, key);
            await saveToTransientCache(updatedRecipe); // Save result to persistent cache
        } catch (error) {
            console.error(`Failed to generate image for ${recipeToProcess.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const failedRecipe: Recipe = {
                ...recipeToProcess,
                imageMetadata: { ...(recipeToProcess.imageMetadata!), status: 'failed', errorMessage },
            };
            await saveToTransientCache(failedRecipe); // Persist failure state

            if (errorMessage.includes('429')) {
                setIsRateLimited(true);
                queueRef.current.unshift(recipeToProcess);
                setQueueSize(q => q + 1);

                if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
                rateLimitTimerRef.current = setTimeout(() => setIsRateLimited(false), RATE_LIMIT_RETRY_DELAY);
            }
        } finally {
            setProcessingIds(p => {
                const newSet = new Set(p);
                newSet.delete(recipeToProcess.id);
                return newSet;
            });
        }
    }, [cookbookLoading, processingIds.size, isRateLimited, saveToTransientCache]);

    useEffect(() => {
        processQueue();
    }, [processingIds, queueSize, isRateLimited, processQueue]);

    const enqueueRecipe = useCallback((recipe: Recipe) => {
        if (!enqueuedIdsRef.current.has(recipe.id)) {
            enqueuedIdsRef.current.add(recipe.id);
            queueRef.current.push(recipe);
            setQueueSize(q => q + 1);
            setTotalEnqueued(t => t + 1);
        }
    }, []);
    
    const reEnqueueRecipe = useCallback(async (recipe: Recipe) => {
        const newRecipe: Recipe = {
            ...recipe,
            imageMetadata: { ...recipe.imageMetadata!, status: 'pending', errorMessage: undefined }
        }
        await saveToTransientCache(newRecipe);
        queueRef.current.unshift(newRecipe);
        setQueueSize(q => q + 1);
    }, [saveToTransientCache]);

    const value = {
        enqueueRecipe,
        reEnqueueRecipe,
        processingIds,
        queueSize,
        totalEnqueued,
        isRateLimited,
    };

    return (
        <ImageGenerationContext.Provider value={value}>
            {children}
        </ImageGenerationContext.Provider>
    );
};
