import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Recipe } from '../types';
import { useUserCookbook } from './UserCookbookContext';
import { generateAndStoreRecipeImage } from '../services/imageService';

const MAX_CONCURRENT_GENERATIONS = 1;
const API_COOLDOWN_MS = 60500; // Cooldown for successful requests (just over 1 minute)
const RATE_LIMIT_PAUSE_MS = 300000; // 5 minutes pause for 429 errors
const GENERATION_TIMEOUT_MS = 120000;
const MAX_RETRIES = 2;

type QueueItem = Recipe & { retries: number };
type ProcessorStatus = 'IDLE' | 'PROCESSING' | 'COOLDOWN';

export interface ImageGenerationContextType {
    enqueueRecipe: (recipe: Recipe) => void;
    processingIds: Set<string>;
    queueSize: number;
    totalEnqueued: number;
    isRateLimited: boolean;
}

export const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const ImageGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { updateRecipe, loading: cookbookLoading } = useUserCookbook();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [processorStatus, setProcessorStatus] = useState<ProcessorStatus>('IDLE');
    const [isRateLimited, setIsRateLimited] = useState(false);
    const enqueuedIds = useRef<Set<string>>(new Set());
    const [totalEnqueued, setTotalEnqueued] = useState(0);
    const [isInitialDelayOver, setIsInitialDelayOver] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitialDelayOver(true), 5000); // 5s initial delay to let UI settle
        return () => clearTimeout(timer);
    }, []);

    const enqueueRecipe = useCallback((recipe: Recipe) => {
        if (!enqueuedIds.current.has(recipe.id)) {
            setQueue(prev => [...prev, { ...recipe, retries: 0 }]);
            enqueuedIds.current.add(recipe.id);
            setTotalEnqueued(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        // This is the core fix: do not start the processor if the cookbook data is still loading.
        if (cookbookLoading || !isInitialDelayOver || processorStatus !== 'IDLE' || queue.length === 0) {
            return;
        }

        const recipeToProcess = queue[0];
        
        setProcessorStatus('PROCESSING');
        setQueue(prev => prev.slice(1));
        setProcessingIds(prev => new Set(prev).add(recipeToProcess.id));

        const process = async () => {
            try {
                const generationPromise = generateAndStoreRecipeImage(recipeToProcess);
                const timeoutPromise: Promise<never> = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Generation timed out for recipe: ${recipeToProcess.id}`)), GENERATION_TIMEOUT_MS)
                );

                const { key } = await Promise.race([generationPromise, timeoutPromise]);
                
                const updatedRecipe: Recipe = { ...recipeToProcess, image: '', imageMetadata: { source: 'content_addressed', status: 'generated', image_key: key } };
                updateRecipe(updatedRecipe);

                setProcessorStatus('COOLDOWN');
                setTimeout(() => setProcessorStatus('IDLE'), API_COOLDOWN_MS);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`Failed to generate image for ${recipeToProcess.name} (attempt ${(recipeToProcess.retries || 0) + 1}):`, errorMessage);

                if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`Rate limit exceeded. Pausing queue for ${RATE_LIMIT_PAUSE_MS / 60000} minutes.`);
                    setQueue(prev => [recipeToProcess, ...prev]); // Re-queue at the front
                    setIsRateLimited(true);
                    setProcessorStatus('COOLDOWN'); // Use COOLDOWN to pause
                    setTimeout(() => {
                        setIsRateLimited(false);
                        setProcessorStatus('IDLE');
                    }, RATE_LIMIT_PAUSE_MS);
                    return; // Exit without consuming a retry or marking as failed
                }

                const currentRetries = recipeToProcess.retries || 0;
                if (currentRetries < MAX_RETRIES) {
                    console.log(`Retrying image generation for ${recipeToProcess.name}.`);
                    setQueue(prev => [...prev, { ...recipeToProcess, retries: currentRetries + 1 }]);
                } else {
                    console.error(`Max retries reached for ${recipeToProcess.name}. Marking as failed.`);
                    const updatedRecipe: Recipe = { ...recipeToProcess, imageMetadata: { ...recipeToProcess.imageMetadata!, status: 'failed', errorMessage } };
                    updateRecipe(updatedRecipe);
                }

                setProcessorStatus('COOLDOWN');
                setTimeout(() => setProcessorStatus('IDLE'), API_COOLDOWN_MS);

            } finally {
                setProcessingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(recipeToProcess.id);
                    return newSet;
                });
            }
        };

        process();

    }, [queue, processorStatus, isInitialDelayOver, updateRecipe, cookbookLoading]);


    const value = {
        enqueueRecipe,
        processingIds,
        queueSize: queue.length,
        totalEnqueued,
        isRateLimited
    };

    return (
        <ImageGenerationContext.Provider value={value}>
            {children}
        </ImageGenerationContext.Provider>
    );
};