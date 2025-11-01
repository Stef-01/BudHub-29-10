// services/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Plant, Recipe, Task, GameScore } from '../types';
import { PLANT_CATALOG, INITIAL_COOKBOOK } from '../constants';
import { initializeSeedImages } from './seedImageStore';

const DB_NAME = 'VibeGardenDB';
const DB_VERSION = 3; // Incremented for transient cache

export const STORES = {
    METADATA: 'metadata',
    USER_GARDEN: 'user_garden',
    USER_COOKBOOK: 'user_cookbook',
    TASK_STATES: 'task_states',
    GAMIFICATION: 'gamification',
    GAME_SCORES: 'game_scores',
    IMAGE_ARTIFACTS: 'image_artifacts',
    IMAGE_ALIASES: 'image_aliases',
    TRANSIENT_RECIPE_CACHE: 'transient_recipe_cache',
} as const;

interface VibeGardenDB extends DBSchema {
    [STORES.METADATA]: {
        key: string;
        value: { version: string };
    };
    [STORES.USER_GARDEN]: {
        key: number;
        value: { id: number };
    };
    [STORES.USER_COOKBOOK]: {
        key: string;
        value: Recipe;
        indexes: { 'by-source': string };
    };
    [STORES.TASK_STATES]: {
        key: string;
        value: { id: string; isCompleted: boolean };
    };
    [STORES.GAMIFICATION]: {
        key: string;
        value: { id: string; xp: number; level: number };
    };
    [STORES.GAME_SCORES]: {
        key: number;
        value: GameScore;
        indexes: { 'by-gamemode': string };
    };
    [STORES.IMAGE_ARTIFACTS]: {
        key: string;
        value: any;
    };
    [STORES.IMAGE_ALIASES]: {
        key: string;
        value: { recipeId: string; key: string };
    };
    [STORES.TRANSIENT_RECIPE_CACHE]: {
        key: string;
        value: Recipe;
    };
}

let dbPromise: Promise<IDBPDatabase<VibeGardenDB>> | null = null;

async function createAndSeedDb() {
    if (dbPromise) return dbPromise;

    dbPromise = openDB<VibeGardenDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
            if (oldVersion < 1) {
                db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
                db.createObjectStore(STORES.USER_GARDEN, { keyPath: 'id' });
                const cookbookStore = db.createObjectStore(STORES.USER_COOKBOOK, { keyPath: 'id' });
                cookbookStore.createIndex('by-source', 'source');
                db.createObjectStore(STORES.TASK_STATES, { keyPath: 'id' });
                db.createObjectStore(STORES.GAMIFICATION, { keyPath: 'id' });
                const scoresStore = db.createObjectStore(STORES.GAME_SCORES, { keyPath: 'id', autoIncrement: true });
                scoresStore.createIndex('by-gamemode', 'gameMode');
                db.createObjectStore(STORES.IMAGE_ARTIFACTS, { keyPath: 'key' });
                db.createObjectStore(STORES.IMAGE_ALIASES, { keyPath: 'recipeId' });

                INITIAL_COOKBOOK.forEach(recipe => {
                    transaction.objectStore(STORES.USER_COOKBOOK).add(recipe);
                });
            }
             if (oldVersion < 3) {
                if (!db.objectStoreNames.contains(STORES.TRANSIENT_RECIPE_CACHE)) {
                    db.createObjectStore(STORES.TRANSIENT_RECIPE_CACHE, { keyPath: 'id' });
                }
            }
        },
    });
    
    try {
        const db = await dbPromise;
        await initializeSeedImages(db);
        return db;
    } catch (error) {
        console.error("Failed to initialize the database:", error);
        dbPromise = null;
        throw error;
    }
}


export const getDb = (): Promise<IDBPDatabase<VibeGardenDB>> => {
    return createAndSeedDb();
};

// --- GAMIFICATION ---
export async function getGamificationState(): Promise<{ xp: number, level: number }> {
    const db = await getDb();
    const state = await db.get(STORES.GAMIFICATION, 'user');
    return state || { xp: 0, level: 1 };
}

export async function saveGamificationState(xp: number, level: number): Promise<void> {
    const db = await getDb();
    await db.put(STORES.GAMIFICATION, { id: 'user', xp, level });
}

// --- GARDEN ---
export async function getMyPlants(): Promise<Plant[]> {
    const db = await getDb();
    const plantIds = await db.getAllKeys(STORES.USER_GARDEN);
    return plantIds
        .map(id => PLANT_CATALOG.find(p => p.id === id))
        .filter((p): p is Plant => !!p);
}

export async function addPlant(plantId: number): Promise<void> {
    const db = await getDb();
    await db.put(STORES.USER_GARDEN, { id: plantId });
}

export async function removePlant(plantId: number): Promise<void> {
    const db = await getDb();
    await db.delete(STORES.USER_GARDEN, plantId);
}

// --- TASKS ---
export async function getTaskStates(): Promise<Record<string, boolean>> {
    const db = await getDb();
    const states = await db.getAll(STORES.TASK_STATES);
    return states.reduce((acc, state) => {
        acc[state.id] = state.isCompleted;
        return acc;
    }, {} as Record<string, boolean>);
}

export async function saveTaskState(taskId: string, isCompleted: boolean): Promise<void> {
    const db = await getDb();
    await db.put(STORES.TASK_STATES, { id: taskId, isCompleted });
}

// --- COOKBOOK & TRANSIENT CACHE ---
export async function getRecipes(): Promise<Recipe[]> {
    const db = await getDb();
    return db.getAll(STORES.USER_COOKBOOK);
}

export async function getTransientRecipes(): Promise<Recipe[]> {
    const db = await getDb();
    return db.getAll(STORES.TRANSIENT_RECIPE_CACHE);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
    const db = await getDb();
    const tx = db.transaction([STORES.USER_COOKBOOK, STORES.TRANSIENT_RECIPE_CACHE], 'readwrite');
    await tx.objectStore(STORES.USER_COOKBOOK).put(recipe);
    await tx.objectStore(STORES.TRANSIENT_RECIPE_CACHE).delete(recipe.id);
    await tx.done;
}

export async function saveToTransientCache(recipe: Recipe): Promise<void> {
    const db = await getDb();
    await db.put(STORES.TRANSIENT_RECIPE_CACHE, recipe);
}

export async function removeRecipe(recipeId: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORES.USER_COOKBOOK, recipeId);
}

// --- GAME SCORES ---
export async function getHighScores(): Promise<GameScore[]> {
    const db = await getDb();
    return db.getAll(STORES.GAME_SCORES);
}

export async function saveScore(score: Omit<GameScore, 'id'>): Promise<void> {
    const db = await getDb();
    await db.add(STORES.GAME_SCORES, score as GameScore);
}
