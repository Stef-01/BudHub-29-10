// services/imageStoreService.ts
import type { Recipe } from '../types';

const DB_NAME = 'GardenVibeImageStore';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';
const ALIASES_STORE = 'aliases';

let dbPromise: Promise<IDBDatabase> | null = null;

export interface ImageArtifacts {
    original: Blob;
    preview: Blob;
    thumb: Blob;
    manifest: object;
}

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
            if (!db.objectStoreNames.contains(IMAGES_STORE)) {
                db.createObjectStore(IMAGES_STORE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(ALIASES_STORE)) {
                db.createObjectStore(ALIASES_STORE, { keyPath: 'recipeId' });
            }
        };
    });
    return dbPromise;
}

export async function saveImageArtifacts(key: string, recipeId: string, artifacts: ImageArtifacts): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([IMAGES_STORE, ALIASES_STORE], 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);

        // 1. Save the image artifacts (blobs and manifest)
        const imagesStore = tx.objectStore(IMAGES_STORE);
        imagesStore.put({ key, ...artifacts });

        // 2. Save the alias mapping recipeId to the image key
        const aliasesStore = tx.objectStore(ALIASES_STORE);
        aliasesStore.put({ recipeId, key });
    });
}

export async function saveAlias(recipeId: string, key: string): Promise<void> {
    const db = await getDb();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ALIASES_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(ALIASES_STORE);
        store.put({ recipeId, key });
    });
}

export async function getArtifacts(key: string): Promise<ImageArtifacts | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IMAGES_STORE, 'readonly');
        const store = tx.objectStore(IMAGES_STORE);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function getAlias(recipeId: string): Promise<{ recipeId: string; key: string } | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ALIASES_STORE, 'readonly');
        const store = tx.objectStore(ALIASES_STORE);
        const request = store.get(recipeId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

export interface ImageUrls {
    thumb: string;
    preview: string;
    original: string;
}

export async function getRecipeImageUrls(recipeId: string): Promise<ImageUrls | null> {
    const alias = await getAlias(recipeId);
    if (!alias || !alias.key) return null;

    const artifacts = await getArtifacts(alias.key);
    if (!artifacts) return null;

    return {
        thumb: URL.createObjectURL(artifacts.thumb),
        preview: URL.createObjectURL(artifacts.preview),
        original: URL.createObjectURL(artifacts.original),
    };
}