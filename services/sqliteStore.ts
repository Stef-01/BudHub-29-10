// services/sqliteStore.ts

/**
 * MOCK IMPLEMENTATION of a SQLite wrapper.
 * In a real application, this would use a SQLite WASM library
 * to persist data beyond IndexedDB's cache lifetime. This mock
 * uses an in-memory Map to simulate the database behavior and
 * ensure the application is functional.
 */

// A simple in-memory store to simulate SQLite
const MOCK_DB = {
    images: new Map<string, any>(),
    aliases: new Map<string, any>(),
};

async function migrateFromIndexedDB() {
    console.log("Mock SQLite migration from IndexedDB started.");
    try {
        const { getDb, STORES } = await import('./db');
        const idb = await getDb();
        const images = await idb.getAll(STORES.IMAGE_ARTIFACTS);
        const aliases = await idb.getAll(STORES.IMAGE_ALIASES);

        for (const image of images) {
            // In a real scenario, blobs would be converted to Uint8Arrays before saving
            MOCK_DB.images.set(image.key, image);
        }
        for (const alias of aliases) {
            MOCK_DB.aliases.set(alias.recipeId, { recipe_id: alias.recipeId, image_key: alias.key });
        }
        
        console.log(`Mock migrated ${images.length} images and ${aliases.length} aliases.`);
        return { migrated: images.length + aliases.length, errors: 0 };

    } catch (error) {
        console.error("Error during mock migration:", error);
        return { migrated: 0, errors: 1 };
    }
}

async function getImage(key: string): Promise<any | null> {
    return MOCK_DB.images.get(key) || null;
}

async function saveImage(imageRecord: any): Promise<void> {
    // Simulating the storage of Uint8Arrays
    const recordToStore = { ...imageRecord };
    if (recordToStore.original instanceof Blob) recordToStore.original = await recordToStore.original.arrayBuffer();
    if (recordToStore.preview instanceof Blob) recordToStore.preview = await recordToStore.preview.arrayBuffer();
    if (recordToStore.thumb instanceof Blob) recordToStore.thumb = await recordToStore.thumb.arrayBuffer();
    MOCK_DB.images.set(imageRecord.key, recordToStore);
}

async function getAlias(recipe_id: string): Promise<{ recipe_id: string; image_key: string } | null> {
    return MOCK_DB.aliases.get(recipe_id) || null;
}

async function saveAlias(aliasRecord: { recipe_id: string; image_key: string }): Promise<void> {
    MOCK_DB.aliases.set(aliasRecord.recipe_id, aliasRecord);
}

export const sqliteStore = {
    migrateFromIndexedDB,
    getImage,
    saveImage,
    getAlias,
    saveAlias,
};
