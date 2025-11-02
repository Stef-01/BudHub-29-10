// contexts/ImageGenerationContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from './UserCookbookContext';
import { generateAndStoreRecipeImage } from '../services/imageService';
import { saveAlias } from '../services/imageStoreService';

// Increased concurrency for better throughput
const MAX_CONCURRENT_GENERATIONS = 2;
const RATE_LIMIT_RETRY_DELAY = 5 * 60 * 1000;
const QUEUE_PROCESS_INTERVAL = 1000; // Process queue every second

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
    const processingIdsRef = useRef<Set<string>>(new Set());
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set()); // State for UI updates
    const [queueSize, setQueueSize] = useState(0);
    const [totalEnqueued, setTotalEnqueued] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const enqueuedIdsRef = useRef<Set<string>>(new Set());
    const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const processQueue = useCallback(async () => {
        if (
            cookbookLoading ||
            processingIdsRef.current.size >= MAX_CONCURRENT_GENERATIONS ||
            queueRef.current.length === 0 ||
            isRateLimited
        ) {
            return;
        }

        const recipeToProcess = queueRef.current.shift();
        if (!recipeToProcess) return;

        if (processingIdsRef.current.has(recipeToProcess.id)) {
            queueRef.current.unshift(recipeToProcess);
            return;
        }

        setQueueSize(q => q - 1);
        processingIdsRef.current.add(recipeToProcess.id);
        setProcessingIds(new Set(processingIdsRef.current));

        try {
            const { key } = await generateAndStoreRecipeImage(recipeToProcess);
            const updatedRecipe: Recipe = {
                ...recipeToProcess,
                imageMetadata: { source: 'ai_generated', status: 'generated', image_key: key },
            };
            await saveAlias(updatedRecipe.id, key);
            await saveToTransientCache(updatedRecipe);
        } catch (error) {
            console.error(`Failed to generate image for ${recipeToProcess.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const failedRecipe: Recipe = {
                ...recipeToProcess,
                imageMetadata: { ...(recipeToProcess.imageMetadata!), status: 'failed', errorMessage },
            };
            await saveToTransientCache(failedRecipe);

            if (errorMessage.includes('429')) {
                setIsRateLimited(true);
                queueRef.current.unshift(recipeToProcess);
                setQueueSize(q => q + 1);

                if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
                rateLimitTimerRef.current = setTimeout(() => {
                    setIsRateLimited(false);
                }, RATE_LIMIT_RETRY_DELAY);
            }
        } finally {
            processingIdsRef.current.delete(recipeToProcess.id);
            setProcessingIds(new Set(processingIdsRef.current));
        }
    }, [cookbookLoading, isRateLimited, saveToTransientCache]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            processQueue();
        }, QUEUE_PROCESS_INTERVAL);

        return () => {
            clearInterval(intervalId);
            if (rateLimitTimerRef.current) {
                clearTimeout(rateLimitTimerRef.current);
            }
        };
    }, [processQueue]);

    const enqueueRecipe = useCallback((recipe: Recipe) => {
        // Check if image already exists
        if (recipe.imageMetadata?.status === 'cached' || recipe.imageMetadata?.status === 'generated') {
          return;
        }

        if (!enqueuedIdsRef.current.has(recipe.id) && !processingIdsRef.current.has(recipe.id)) {
            enqueuedIdsRef.current.add(recipe.id);
            queueRef.current.push(recipe);
            setQueueSize(q => q + 1);
            setTotalEnqueued(t => t + 1);
        }
    }, []);

    const reEnqueueRecipe = useCallback(async (recipe: Recipe) => {
        enqueuedIdsRef.current.delete(recipe.id);

        const newRecipe: Recipe = {
            ...recipe,
            imageMetadata: { ...recipe.imageMetadata!, status: 'pending', errorMessage: undefined }
        };
        await saveToTransientCache(newRecipe);

        if (!queueRef.current.some(r => r.id === recipe.id) && !processingIdsRef.current.has(recipe.id)) {
            queueRef.current.unshift(newRecipe);
            setQueueSize(q => q + 1);
        }
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
