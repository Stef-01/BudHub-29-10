// services/sqliteStore.ts

/**
 * SQLite WASM Store Implementation
 * 
 * This module provides a complete SQLite WASM integration for persistent storage
 * of image artifacts and recipe-to-image alias mappings using the Origin Private
 * File System (OPFS). It replaces the previous mock implementation.
 * 
 * Architecture:
 * - Uses @sqlite.org/sqlite-wasm with OPFS-async bundle for true persistence
 * - Creates tables: image_artifacts, image_aliases
 * - Stores image blobs as BLOB type (Uint8Array)
 * - Provides migration from IndexedDB
 * - Thread-safe with single database connection
 */

let dbPromise: Promise<any> | null = null;

/**
 * Initializes the SQLite WASM database connection.
 * Creates tables if they don't exist.
 * Singleton pattern ensures only one connection is created.
 */
async function initDb(): Promise<any> {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = (async () => {
        try {
            console.log('[SQLite] Initializing SQLite WASM with OPFS...');
            
            // Import the SQLite WASM module from the import map
            const sqlite3InitModule = (await import('@sqlite.org/sqlite-wasm')).default;
            const sqlite3 = await sqlite3InitModule({
                print: console.log,
                printErr: console.error,
            });

            console.log('[SQLite] SQLite WASM version:', sqlite3.version.libVersion);

            // Open database in OPFS (persistent storage)
            // Using 'c' mode to create if it doesn't exist
            const db = new sqlite3.oo1.OpfsDb('/nutriserve-images.db', 'c');
            console.log('[SQLite] Database opened successfully in OPFS');

            // Create tables if they don't exist
            db.exec(`
                CREATE TABLE IF NOT EXISTS image_artifacts (
                    key TEXT PRIMARY KEY,
                    original BLOB NOT NULL,
                    preview BLOB NOT NULL,
                    thumb BLOB NOT NULL,
                    manifest TEXT,
                    created_at TEXT NOT NULL
                );
            `);

            db.exec(`
                CREATE TABLE IF NOT EXISTS image_aliases (
                    recipe_id TEXT PRIMARY KEY,
                    image_key TEXT NOT NULL,
                    FOREIGN KEY (image_key) REFERENCES image_artifacts(key)
                );
            `);

            // Create index for faster lookups
            db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_aliases_key 
                ON image_aliases(image_key);
            `);

            console.log('[SQLite] Tables and indexes created successfully');
            return db;

        } catch (error) {
            console.error('[SQLite] Initialization error:', error);
            dbPromise = null; // Reset promise so it can be retried
            throw error;
        }
    })();

    return dbPromise;
}

/**
 * Migrates image artifacts and aliases from IndexedDB to SQLite.
 * This is called automatically by db.ts on first load.
 * 
 * @returns Object with migration statistics
 */
async function migrateFromIndexedDB(): Promise<{ migrated: number; errors: number }> {
    console.log('[SQLite Migration] Starting migration from IndexedDB...');
    
    try {
        const db = await initDb();
        const { getDb, STORES } = await import('./db');
        const idb = await getDb();

        // Fetch all images and aliases from IndexedDB
        const [images, aliases] = await Promise.all([
            idb.getAll(STORES.IMAGE_ARTIFACTS),
            idb.getAll(STORES.IMAGE_ALIASES),
        ]);

        console.log(`[SQLite Migration] Found ${images.length} images and ${aliases.length} aliases in IndexedDB`);

        let migratedCount = 0;
        let errorCount = 0;

        // Begin transaction for atomic migration
        db.exec('BEGIN TRANSACTION');

        try {
            // Migrate images
            for (const image of images) {
                try {
                    // Check if image already exists to avoid duplicates
                    const exists = db.selectValue(
                        'SELECT 1 FROM image_artifacts WHERE key = ?',
                        [image.key]
                    );

                    if (!exists) {
                        // Convert Blobs to Uint8Array for storage
                        const original = image.original instanceof Blob 
                            ? new Uint8Array(await image.original.arrayBuffer())
                            : image.original;
                        const preview = image.preview instanceof Blob
                            ? new Uint8Array(await image.preview.arrayBuffer())
                            : image.preview;
                        const thumb = image.thumb instanceof Blob
                            ? new Uint8Array(await image.thumb.arrayBuffer())
                            : image.thumb;

                        const manifest = typeof image.manifest === 'object'
                            ? JSON.stringify(image.manifest)
                            : image.manifest || '{}';

                        const created_at = image.created_at || new Date().toISOString();

                        db.exec({
                            sql: `
                                INSERT INTO image_artifacts 
                                (key, original, preview, thumb, manifest, created_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `,
                            bind: [image.key, original, preview, thumb, manifest, created_at]
                        });

                        migratedCount++;
                    }
                } catch (err) {
                    console.error(`[SQLite Migration] Error migrating image ${image.key}:`, err);
                    errorCount++;
                }
            }

            // Migrate aliases
            for (const alias of aliases) {
                try {
                    const exists = db.selectValue(
                        'SELECT 1 FROM image_aliases WHERE recipe_id = ?',
                        [alias.recipeId]
                    );

                    if (!exists) {
                        db.exec({
                            sql: 'INSERT INTO image_aliases (recipe_id, image_key) VALUES (?, ?)',
                            bind: [alias.recipeId, alias.key]
                        });

                        migratedCount++;
                    }
                } catch (err) {
                    console.error(`[SQLite Migration] Error migrating alias ${alias.recipeId}:`, err);
                    errorCount++;
                }
            }

            // Commit transaction
            db.exec('COMMIT');
            console.log(`[SQLite Migration] Successfully migrated ${migratedCount} records with ${errorCount} errors`);

        } catch (txError) {
            // Rollback on error
            db.exec('ROLLBACK');
            console.error('[SQLite Migration] Transaction failed, rolled back:', txError);
            throw txError;
        }

        return { migrated: migratedCount, errors: errorCount };

    } catch (error) {
        console.error('[SQLite Migration] Migration failed:', error);
        return { migrated: 0, errors: 1 };
    }
}

/**
 * Retrieves an image artifact record by its key.
 * 
 * @param key - The content-addressed key (sha256:hash)
 * @returns Image record with Blobs, or null if not found
 */
async function getImage(key: string): Promise<any | null> {
    try {
        const db = await initDb();
        
        const result = db.exec({
            sql: 'SELECT * FROM image_artifacts WHERE key = ?',
            bind: [key],
            returnValue: 'resultRows',
            rowMode: 'object'
        });

        if (!result || result.length === 0) {
            return null;
        }

        const row = result[0];

        // The caller (imageStoreService) is responsible for converting back to Blob
        return {
            key: row.key,
            original: row.original,
            preview: row.preview,
            thumb: row.thumb,
            manifest: row.manifest,
            created_at: row.created_at
        };

    } catch (error) {
        console.error(`[SQLite] Error retrieving image ${key}:`, error);
        return null;
    }
}

/**
 * Saves an image artifact record to SQLite.
 * 
 * @param imageRecord - Record containing key, blobs (as Uint8Array), manifest, etc.
 */
async function saveImage(imageRecord: any): Promise<void> {
    try {
        const db = await initDb();

        // Ensure blobs are Uint8Array for storage
        const original = imageRecord.original instanceof Blob
            ? new Uint8Array(await imageRecord.original.arrayBuffer())
            : imageRecord.original;
        const preview = imageRecord.preview instanceof Blob
            ? new Uint8Array(await imageRecord.preview.arrayBuffer())
            : imageRecord.preview;
        const thumb = imageRecord.thumb instanceof Blob
            ? new Uint8Array(await imageRecord.thumb.arrayBuffer())
            : imageRecord.thumb;

        const manifest = typeof imageRecord.manifest === 'object'
            ? JSON.stringify(imageRecord.manifest)
            : imageRecord.manifest || '{}';

        const created_at = imageRecord.created_at || new Date().toISOString();

        // Use REPLACE to handle both insert and update atomically
        db.exec({
            sql: `
                REPLACE INTO image_artifacts 
                (key, original, preview, thumb, manifest, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            bind: [imageRecord.key, original, preview, thumb, manifest, created_at]
        });

    } catch (error) {
        console.error(`[SQLite] Error saving image ${imageRecord.key}:`, error);
        throw error;
    }
}

/**
 * Retrieves an alias record mapping a recipe ID to an image key.
 * 
 * @param recipe_id - The recipe identifier
 * @returns Alias record or null if not found
 */
async function getAlias(recipe_id: string): Promise<{ recipe_id: string; image_key: string } | null> {
    try {
        const db = await initDb();

        const result = db.exec({
            sql: 'SELECT * FROM image_aliases WHERE recipe_id = ?',
            bind: [recipe_id],
            returnValue: 'resultRows',
            rowMode: 'object'
        });

        if (!result || result.length === 0) {
            return null;
        }

        return {
            recipe_id: result[0].recipe_id,
            image_key: result[0].image_key
        };

    } catch (error) {
        console.error(`[SQLite] Error retrieving alias for recipe ${recipe_id}:`, error);
        return null;
    }
}

/**
 * Saves an alias record mapping a recipe ID to an image key.
 * 
 * @param aliasRecord - Object with recipe_id and image_key
 */
async function saveAlias(aliasRecord: { recipe_id: string; image_key: string }): Promise<void> {
    try {
        const db = await initDb();

        // Use REPLACE to handle both insert and update atomically
        db.exec({
            sql: 'REPLACE INTO image_aliases (recipe_id, image_key) VALUES (?, ?)',
            bind: [aliasRecord.recipe_id, aliasRecord.image_key]
        });

    } catch (error) {
        console.error(`[SQLite] Error saving alias for recipe ${aliasRecord.recipe_id}:`, error);
        throw error;
    }
}

/**
 * Export the SQLite store interface.
 * This matches the mock interface, so no changes are needed in calling code.
 */
export const sqliteStore = {
    migrateFromIndexedDB,
    getImage,
    saveImage,
    getAlias,
    saveAlias,
};