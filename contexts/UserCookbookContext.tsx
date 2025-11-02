// contexts/UserCookbookContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Recipe, ImageMetadata } from '../types';
import { getRecipes, getTransientRecipes, saveRecipe as dbSaveRecipe, removeRecipeWithCleanup, saveToTransientCache } from '../services/db';
import { processAndStoreUserImage } from '../services/imageService';
import { saveAlias } from '../services/imageStoreService';
import { restoreUserCookbook, backupUserCookbook } from '../services/imageBackupService';
import { INITIAL_COOKBOOK } from '../constants';
import { useAsyncLock } from '../hooks/useAsyncLock';

type TransientRecipeState = Map<string, Recipe>;

interface UserCookbookContextType {
    recipes: Recipe[];
    saveRecipe: (recipe: Recipe) => Promise<void>;
    removeRecipe: (recipeId: string) => Promise<void>;
    saveOrUpdateRecipeImage: (recipe: Recipe, imageFile: File) => Promise<void>;
    isRecipeSaved: (recipeId: string) => boolean;
    loading: boolean;
    transientRecipeState: TransientRecipeState;
    saveToTransientCache: (recipe: Recipe) => Promise<void>;
}

const UserCookbookContext = createContext<UserCookbookContextType | undefined>(undefined);

export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [transientRecipeState, setTransientRecipeState] = useState<TransientRecipeState>(() => new Map());
    const { withLock } = useAsyncLock();

    const stateRef = useRef({ recipes, transientRecipeState });
    useEffect(() => {
        stateRef.current = { recipes, transientRecipeState };
    }, [recipes, transientRecipeState]);

    useEffect(() => {
        const loadCookbook = async () => {
            setLoading(true);
            const [userRecipes, transientRecipes] = await Promise.all([getRecipes(), getTransientRecipes()]);
            
            console.log(`Loaded ${userRecipes.length} recipes and ${transientRecipes.length} transient recipes`);

            // Load main cookbook with self-healing
            let finalUserRecipes = userRecipes;
            if (userRecipes.length === 0) {
                const backupRecipes = restoreUserCookbook();
                if (backupRecipes && backupRecipes.length > 0) {
                    for (const recipe of backupRecipes) { await dbSaveRecipe(recipe); }
                    finalUserRecipes = backupRecipes;
                } else {
                    for (const recipe of INITIAL_COOKBOOK) { await dbSaveRecipe(recipe); }
                    finalUserRecipes = INITIAL_COOKBOOK;
                }
            }
            setRecipes(finalUserRecipes);

            // Load persisted transient state
            if (transientRecipes.length > 0) {
                setTransientRecipeState(new Map(transientRecipes.map(r => [r.id, r])));
            }

            setLoading(false);
        };
        loadCookbook();
    }, []);

    const handleSaveToTransientCache = useCallback(async (recipe: Recipe) => {
        setTransientRecipeState(prevMap => new Map(prevMap).set(recipe.id, recipe));
        await saveToTransientCache(recipe);
    }, []);

    const saveRecipe = useCallback(async (recipe: Recipe) => {
        await withLock(recipe.id, async () => {
            const { recipes: currentRecipes, transientRecipeState: currentTransientState } = stateRef.current;
            const definitiveRecipe = currentTransientState.get(recipe.id) || currentRecipes.find(r => r.id === recipe.id) || recipe;

            const recipeExists = currentRecipes.some(r => r.id === definitiveRecipe.id);
            const newRecipes = recipeExists
                ? currentRecipes.map(r => r.id === definitiveRecipe.id ? definitiveRecipe : r)
                : [...currentRecipes, definitiveRecipe];
            
            setRecipes(newRecipes);
            setTransientRecipeState(prev => {
                const newMap = new Map(prev);
                newMap.delete(definitiveRecipe.id);
                return newMap;
            });

            await dbSaveRecipe(definitiveRecipe);
            await backupUserCookbook(newRecipes);
        });
    }, [withLock]);

    const removeRecipe = useCallback(async (recipeId: string) => {
        const newRecipes = recipes.filter(r => r.id !== recipeId);
        setRecipes(newRecipes);
        await removeRecipeWithCleanup(recipeId); // Use new cleanup function
        await backupUserCookbook(newRecipes);
    }, [recipes]);

    const saveOrUpdateRecipeImage = useCallback(async (recipe: Recipe, imageFile: File) => {
        const { key } = await processAndStoreUserImage(recipe, imageFile);
        const updatedRecipe: Recipe = {
            ...recipe,
            imageMetadata: { source: 'user_upload', status: 'cached', image_key: key },
        };
        await saveAlias(recipe.id, key);
        await saveRecipe(updatedRecipe);
    }, [saveRecipe]);

    const isRecipeSaved = useCallback((recipeId: string) => recipes.some(r => r.id === recipeId), [recipes]);

    const value = {
        recipes,
        saveRecipe,
        removeRecipe,
        saveOrUpdateRecipeImage,
        isRecipeSaved,
        loading,
        transientRecipeState,
        saveToTransientCache: handleSaveToTransientCache,
    };

    return (
        <UserCookbookContext.Provider value={value}>
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
