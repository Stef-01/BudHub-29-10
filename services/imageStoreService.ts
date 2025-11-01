// services/imageStoreService.ts
import type { Recipe } from '../types';
import { getDb, STORES } from './db';
import { urlManager } from './urlManager';
import { backupImageManifest } from './imageBackupService';

export interface ImageArtifacts {
    original: Blob;
    preview: Blob;
    thumb: Blob;
    manifest: any; // Allow any object for manifest
}

export type ImageUrls = {
    thumb: string;
    preview: string;
    original: string;
};

export interface ImageState {
    key: string;
    urls: ImageUrls;
}

/**
 * Converts a base64 data URI to a Blob.
 * Exported for use in recovery logic.
 */
export function dataUriToBlob(dataUri: string): Blob {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

/**
 * Atomically saves image artifacts and their corresponding alias in a single transaction.
 */
export async function saveImageArtifacts(key: string, recipeId: string, artifacts: ImageArtifacts): Promise<void> {
    const db = await getDb();
    const tx = db.transaction([STORES.IMAGE_ARTIFACTS, STORES.IMAGE_ALIASES], 'readwrite');

    const artifactPromise = tx.objectStore(STORES.IMAGE_ARTIFACTS).put({ key, ...artifacts });
    const aliasPromise = tx.objectStore(STORES.IMAGE_ALIASES).put({ recipeId, key });

    await Promise.all([artifactPromise, aliasPromise]);
    await tx.done;

    // After the primary storage transaction completes successfully,
    // write to the failsafe backup layer (localStorage).
    await backupImageManifest(key, artifacts)
        .catch(err => console.error("Failed to write to image backup.", err));
}


/**
 * Saves or updates just the alias mapping a recipeId to an image key.
 */
export async function saveAlias(recipeId: string, key: string): Promise<void> {
    const db = await getDb();
    await db.put(STORES.IMAGE_ALIASES, { recipeId, key });
}

/**
 * Retrieves the raw image artifacts for a given key.
 */
export async function getArtifacts(key: string): Promise<ImageArtifacts | null> {
    const db = await getDb();
    const artifacts = await db.get(STORES.IMAGE_ARTIFACTS, key);
    return artifacts || null;
}

/**
 * Retrieves the alias record for a given recipeId.
 */
export async function getAlias(recipeId: string): Promise<{ recipeId: string; key: string } | null> {
    const db = await getDb();
    const alias = await db.get(STORES.IMAGE_ALIASES, recipeId);
    return alias || null;
}

/**
 * Retrieves the complete image state for a recipe, including managed object URLs.
 * This is the primary function for UI components to get displayable images for ALL
 * image types (pre-loaded, AI-generated, and user-uploaded).
 */
export async function getRecipeImageState(recipeId: string): Promise<ImageState | null> {
    const alias = await getAlias(recipeId);
    if (!alias || !alias.key) return null;

    const artifacts = await getArtifacts(alias.key);
    if (!artifacts) return null;

    // Create managed URLs to prevent memory leaks
    return {
        key: alias.key,
        urls: {
            thumb: urlManager.create(artifacts.thumb, `${alias.key}:thumb`),
            preview: urlManager.create(artifacts.preview, `${alias.key}:preview`),
            original: urlManager.create(artifacts.original, `${alias.key}:original`),
        }
    };
}