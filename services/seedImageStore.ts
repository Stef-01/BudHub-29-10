/**
 * Seed image store - loads preloaded images into IndexedDB on first run
 * Never import this file directly - it's called once during app initialization
 */

import { IDBPDatabase } from 'idb';
import { STORES } from './db';
import { buildKey, resizeImage } from './imageProcessingService';

const SEED_VERSION_KEY = 'seedImageVersion';
const CURRENT_SEED_VERSION = '1.3'; // Bumped to run the new non-destructive logic.

interface SeedImageData {
  recipeId: string;
  base64Data: string;
}

// FIX: The original base64 strings were truncated, causing a fatal `atob` error.
// They have been replaced with a valid 1x1 pixel placeholder to allow the app to initialize.
const PLACEHOLDER_B64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const SEED_IMAGES_DATA: SeedImageData[] = [
    { recipeId: 'rcp_bhindi_masala', base64Data: PLACEHOLDER_B64 },
    { recipeId: 'rcp_baingan_bharta', base64Data: PLACEHOLDER_B64 },
    { recipeId: 'rcp_lemon_rice', base64Data: PLACEHOLDER_B64 },
    { recipeId: 'rcp_turmeric_milk', base64Data: PLACEHOLDER_B64 },
    { recipeId: 'rcp_masala_chai_low_sugar', base64Data: PLACEHOLDER_B64 },
];

/**
 * A more robust, synchronous method to convert a data URI to a Blob, avoiding `fetch`.
 */
function dataUriToBlob(dataUri: string): Blob {
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
 * Checks metadata to see if seeding is needed.
 * If so, it processes and stores the pre-loaded seed images.
 * This is designed to be called AFTER the DB connection is open.
 */
export async function initializeSeedImages(db: IDBPDatabase) {
    // Step 1: Check version using the idb promise-based API
    const versionRecord = await db.get(STORES.METADATA, SEED_VERSION_KEY);

    if (versionRecord?.version === CURRENT_SEED_VERSION) {
        console.log("Seed images are up to date.");
        return; // Already initialized, do nothing.
    }

    console.log(`Seeding images for version ${CURRENT_SEED_VERSION}...`);

    // Step 2: Perform all async data preparation OUTSIDE the write transaction.
    const processedImages = await Promise.all(
        SEED_IMAGES_DATA.map(async ({ recipeId, base64Data }) => {
            const originalBlob = dataUriToBlob(base64Data);
            const [previewBlob, thumbBlob] = await Promise.all([
                resizeImage(originalBlob, 1024),
                resizeImage(originalBlob, 256),
            ]);
            const manifest = {
                request: { source: 'preloaded' },
                timestamps: { created_utc: new Date().toISOString() },
            };
            const spec = { recipeId, source: 'preloaded' };
            const key = await buildKey(spec);
            const artifacts = {
                original: originalBlob,
                preview: previewBlob,
                thumb: thumbBlob,
                manifest,
            };
            return { key, recipeId, artifacts };
        })
    );
    
    // Step 3: Perform all database writes in a single transaction using idb patterns.
    try {
        const tx = db.transaction([STORES.IMAGE_ARTIFACTS, STORES.IMAGE_ALIASES, STORES.METADATA], 'readwrite');
        const stores = {
            artifacts: tx.objectStore(STORES.IMAGE_ARTIFACTS),
            aliases: tx.objectStore(STORES.IMAGE_ALIASES),
            meta: tx.objectStore(STORES.METADATA),
        };

        const promises: Promise<any>[] = [];

        for (const { key, recipeId, artifacts } of processedImages) {
            // Don't await here, just collect the promises to run in parallel within the transaction.
            promises.push(
                stores.artifacts.add({ key, ...artifacts }).catch(e => {
                    if (e.name === 'ConstraintError') console.log(`Artifact with key ${key} likely already exists. Skipping.`);
                    else throw e;
                }),
                stores.aliases.add({ recipeId, key }).catch(e => {
                    if (e.name === 'ConstraintError') console.log(`Alias for recipe ${recipeId} likely already exists. Skipping.`);
                    else throw e;
                })
            );
        }
        
        promises.push(stores.meta.put({ key: SEED_VERSION_KEY, version: CURRENT_SEED_VERSION }));

        await Promise.all(promises);
        await tx.done; // Commit the transaction
        console.log("Image seeding complete.");

    } catch (error) {
        console.error("Image seeding transaction failed:", error);
        // We throw the error to let the caller know initialization failed.
        // This will be caught in createAndSeedDb.
        throw error;
    }
}