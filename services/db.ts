// services/db.ts

import { INITIAL_GARDEN, PLANT_CATALOG, INITIAL_COOKBOOK } from '../constants';
import type { Plant, Recipe, GameScore } from '../types';

const DB_NAME = 'GardenVibeDB';
const DB_VERSION = 1;
const PLANTS_STORE = 'myPlants';
const RECIPES_STORE = 'myRecipes';
const GAMIFICATION_STORE = 'gamification';
const TASKS_STORE = 'taskStates';
const SCORES_STORE = 'gameScores';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(PLANTS_STORE)) {
                db.createObjectStore(PLANTS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(RECIPES_STORE)) {
                db.createObjectStore(RECIPES_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(GAMIFICATION_STORE)) {
                db.createObjectStore(GAMIFICATION_STORE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(TASKS_STORE)) {
                db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
            }
             if (!db.objectStoreNames.contains(SCORES_STORE)) {
                db.createObjectStore(SCORES_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
    return dbPromise;
}

// --- Plants ---
export async function getMyPlants(): Promise<Plant[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PLANTS_STORE, 'readonly');
        const store = tx.objectStore(PLANTS_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            if (request.result.length > 0) {
                resolve(request.result);
            } else {
                // Initialize with default garden if empty
                const initTx = db.transaction(PLANTS_STORE, 'readwrite');
                const initStore = initTx.objectStore(PLANTS_STORE);
                INITIAL_GARDEN.forEach(plant => initStore.add(plant));
                initTx.oncomplete = () => resolve(INITIAL_GARDEN);
                initTx.onerror = () => reject(initTx.error);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function addPlant(plantId: number): Promise<void> {
    const plantToAdd = PLANT_CATALOG.find(p => p.id === plantId);
    if (!plantToAdd) return;
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PLANTS_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(PLANTS_STORE);
        store.add(plantToAdd);
    });
}

export async function removePlant(plantId: number): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PLANTS_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(PLANTS_STORE);
        store.delete(plantId);
    });
}

// --- Recipes ---
export async function getMyRecipes(): Promise<Recipe[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(RECIPES_STORE, 'readonly');
        const store = tx.objectStore(RECIPES_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            if (request.result.length > 0) {
                resolve(request.result);
            } else {
                // Initialize with default cookbook
                const initTx = db.transaction(RECIPES_STORE, 'readwrite');
                const initStore = initTx.objectStore(RECIPES_STORE);
                INITIAL_COOKBOOK.forEach(recipe => initStore.add(recipe));
                initTx.oncomplete = () => resolve(INITIAL_COOKBOOK);
                initTx.onerror = () => reject(initTx.error);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function addRecipe(recipe: Recipe): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(RECIPES_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(RECIPES_STORE);
        store.put(recipe); // Use put for add/update
    });
}

export async function removeRecipe(recipeId: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(RECIPES_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(RECIPES_STORE);
        store.delete(recipeId);
    });
}

// --- Gamification ---
export async function getGamificationState(): Promise<{ xp: number, level: number }> {
    const db = await getDb();
    return new Promise((resolve) => {
        const tx = db.transaction(GAMIFICATION_STORE, 'readonly');
        const store = tx.objectStore(GAMIFICATION_STORE);
        const request = store.get('userState');
        request.onsuccess = () => {
            resolve(request.result || { xp: 0, level: 1 });
        };
        // In case of error, resolve with default state
        request.onerror = () => resolve({ xp: 0, level: 1 });
    });
}

export async function saveGamificationState(xp: number, level: number): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GAMIFICATION_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(GAMIFICATION_STORE);
        store.put({ key: 'userState', xp, level });
    });
}

// --- Task States ---
export async function getTaskStates(): Promise<Record<string, boolean>> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TASKS_STORE, 'readonly');
        const store = tx.objectStore(TASKS_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            const states = request.result.reduce((acc, item) => {
                acc[item.id] = item.isCompleted;
                return acc;
            }, {} as Record<string, boolean>);
            resolve(states);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function saveTaskState(taskId: string, isCompleted: boolean): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TASKS_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(TASKS_STORE);
        store.put({ id: taskId, isCompleted });
    });
}

// --- Game Scores ---
export async function getHighScores(): Promise<GameScore[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCORES_STORE, 'readonly');
    const store = tx.objectStore(SCORES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveScore(score: Omit<GameScore, 'id'>): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCORES_STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(SCORES_STORE);
    store.add(score);
  });
}
