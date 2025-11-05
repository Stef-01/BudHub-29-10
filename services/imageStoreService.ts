// services/imageStoreService.ts
import type { Recipe } from '../types';
import { getDb, STORES } from './db';
import { urlManager } from './urlManager';
import { backupImageManifest } from './imageBackupService';
import { sqliteStore } from './sqliteStore';
import { blobToUint8Array, uint8ArrayToBlob } from './imageProcessingService';
import { getRecipeImageUrlUnified } from './publicImageLoader';


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
 * IMPROVED: Implements dual-write to SQLite with existence check to prevent redundant writes.
 */
export async function saveImageArtifacts(key: string, recipeId: string, artifacts: ImageArtifacts): Promise<void> {
    // Phase 1: Write to IndexedDB (as a cache)
    const db = await getDb();
    const tx = db.transaction([STORES.IMAGE_ARTIFACTS, STORES.IMAGE_ALIASES], 'readwrite');
    const artifactPromise = tx.objectStore(STORES.IMAGE_ARTIFACTS).put({ key, ...artifacts });
    const aliasPromise = tx.objectStore(STORES.IMAGE_ALIASES).put({ recipeId, key });
    await Promise.all([artifactPromise, aliasPromise]);
    await tx.done;

    // Phase 2: Write to SQLite (for permanent storage)
    try {
        const existingInSQLite = await sqliteStore.getImage(key);
        
        if (existingInSQLite) {
            // Still update alias in case it changed, but skip the expensive blob write.
            await sqliteStore.saveAlias({ recipe_id: recipeId, image_key: key });
        } else {
            // Convert blobs and save the full record
            await sqliteStore.saveImage({
                key,
                original: await blobToUint8Array(artifacts.original),
                preview: await blobToUint8Array(artifacts.preview),
                thumb: await blobToUint8Array(artifacts.thumb),
                manifest: JSON.stringify(artifacts.manifest),
                created_at: new Date().toISOString()
            });
            await sqliteStore.saveAlias({ recipe_id: recipeId, image_key: key });
            console.log(`Successfully saved image ${key} to SQLite.`);
        }
    } catch (e) {
        console.error("Failed to save image artifacts to SQLite:", e);
    }

    // Phase 3: Backup manifest to localStorage (failsafe)
    await backupImageManifest(key, artifacts)
        .catch(err => console.error("Failed to write to image backup.", err));
}


/**
 * Saves or updates just the alias mapping a recipeId to an image key.
 * NEW: Implements dual-write.
 */
export async function saveAlias(recipeId: string, key: string): Promise<void> {
    const db = await getDb();
    await db.put(STORES.IMAGE_ALIASES, { recipeId, key });

    try {
        await sqliteStore.saveAlias({ recipe_id: recipeId, image_key: key });
    } catch (e) {
        console.error("Failed to save alias to SQLite:", e);
    }
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
 * UNIFIED IMAGE SYSTEM: Checks public/dataset folders first (direct file access),
 * then falls back to SQLite if needed.
 * This prevents the need for uploading images - they can be used directly from public folders.
 */
export async function getRecipeImageState(recipeId: string): Promise<ImageState | null> {
    // 0. FIRST: Check public/dataset folders for direct file access
    // This allows images to be used immediately without uploading to database
    try {
        const publicImageUrl = await getRecipeImageUrlUnified(recipeId);
        if (publicImageUrl) {
            console.log(`Using public folder image for recipe ${recipeId}: ${publicImageUrl}`);

            // Return the same URL for all sizes (the browser will scale as needed)
            return {
                key: `public:${recipeId}`,
                urls: {
                    thumb: publicImageUrl,
                    preview: publicImageUrl,
                    original: publicImageUrl,
                }
            };
        }
    } catch (e) {
        console.log(`No public folder image found for recipe ${recipeId}, checking database...`);
    }

    // 1. FALLBACK: Check SQLite food_images table
    try {
        // Try exact match first
        let foodImage = await sqliteStore.getFoodImage(recipeId);

        // If no exact match and recipe ID starts with "rcp_", try stripping the prefix
        if (!foodImage && recipeId.startsWith('rcp_')) {
            const foodId = recipeId.substring(4); // Remove "rcp_" prefix
            foodImage = await sqliteStore.getFoodImage(foodId);
        }

        if (foodImage) {
            console.log(`Using database food image for recipe ${recipeId}`);

            // Convert Uint8Array back to Blob
            const thumb = new Blob([foodImage.thumb], { type: 'image/webp' });
            const preview = new Blob([foodImage.preview], { type: 'image/webp' });
            const original = new Blob([foodImage.original], { type: 'image/webp' });

            return {
                key: foodImage.image_key,
                urls: {
                    thumb: urlManager.create(thumb, `food:${recipeId}:thumb`),
                    preview: urlManager.create(preview, `food:${recipeId}:preview`),
                    original: urlManager.create(original, `food:${recipeId}:original`),
                }
            };
        }
    } catch (e) {
        console.log(`Recipe ${recipeId} not found in database food_images`);
    }

    // 2. FALLBACK: Check SQLite recipe_images table
    try {
        const recipeImage = await sqliteStore.getRecipeImage(recipeId);
        if (recipeImage) {
            console.log(`Using database recipe image for ${recipeId}`);

            // Convert Uint8Array back to Blob
            const thumb = new Blob([recipeImage.thumb], { type: 'image/webp' });
            const preview = new Blob([recipeImage.preview], { type: 'image/webp' });
            const original = new Blob([recipeImage.original], { type: 'image/webp' });

            return {
                key: recipeImage.image_key,
                urls: {
                    thumb: urlManager.create(thumb, `recipe:${recipeId}:thumb`),
                    preview: urlManager.create(preview, `recipe:${recipeId}:preview`),
                    original: urlManager.create(original, `recipe:${recipeId}:original`),
                }
            };
        }
    } catch (e) {
        console.log(`Recipe ${recipeId} not found in database recipe_images`);
    }

    return null; // No image found anywhere
}
