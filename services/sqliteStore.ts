// services/sqliteStore.ts
import { getDb, STORES } from './db';

const DB_FILENAME = 'vibegarden-images.sqlite';
let promiser: any = null;
let db: any = null;

const start = async () => {
    // This dynamic import is crucial for WASM modules.
    const sqlite3 = await import('@sqlite.org/sqlite-wasm');
    if ('opfs' in sqlite3.default) {
        promiser = await new sqlite3.default.opfs.OpfsDb(DB_FILENAME);
        console.log('OPFS is available. Using OPFS-backed SQLite DB.');
    } else {
        // Fallback for browsers that do not support OPFS
        promiser = await new sqlite3.default.oo1.JsStorageDb('local');
        console.warn('OPFS not available. Falling back to less-persistent localStorage-backed SQLite.');
    }
    db = await promiser('open', { filename: DB_FILENAME });
    return db;
};

const initPromise = start();

const initializeSchema = async () => {
    await initPromise;
    await db.exec([
        `CREATE TABLE IF NOT EXISTS images (
            key TEXT PRIMARY KEY,
            original BLOB,
            preview BLOB,
            thumb BLOB,
            manifest TEXT,
            created_at TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS aliases (
            recipe_id TEXT PRIMARY KEY,
            image_key TEXT
        );`
    ]);
    console.log('SQLite schema initialized.');
};

const schemaPromise = initializeSchema();

class SQLiteImageStore {
    
    private async getDb() {
        await schemaPromise;
        return db;
    }

    async saveImage(record: {
        key: string;
        original: Uint8Array;
        preview: Uint8Array;
        thumb: Uint8Array;
        manifest: string;
        created_at: string;
    }): Promise<void> {
        const db = await this.getDb();
        await db.exec({
            sql: `INSERT OR REPLACE INTO images (key, original, preview, thumb, manifest, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            bind: [record.key, record.original, record.preview, record.thumb, record.manifest, record.created_at]
        });
    }

    async saveAlias(record: { recipe_id: string; image_key: string }): Promise<void> {
        const db = await this.getDb();
        await db.exec({
            sql: `INSERT OR REPLACE INTO aliases (recipe_id, image_key) VALUES (?, ?)`,
            bind: [record.recipe_id, record.image_key]
        });
    }

    async getImage(key: string): Promise<{
        key: string;
        original: Uint8Array;
        preview: Uint8Array;
        thumb: Uint8Array;
        manifest: string;
    } | null> {
        const db = await this.getDb();
        const result = await db.selectObject(
            `SELECT key, original, preview, thumb, manifest FROM images WHERE key = ?`,
            [key]
        );
        return result || null;
    }

    async getAlias(recipeId: string): Promise<{ recipe_id: string; image_key: string } | null> {
        const db = await this.getDb();
        const result = await db.selectObject(
            `SELECT recipe_id, image_key FROM aliases WHERE recipe_id = ?`,
            [recipeId]
        );
        return result || null;
    }

    async migrateFromIndexedDB(): Promise<{ migrated: number; errors: number }> {
        const idb = await getDb();
        const db = await this.getDb();

        let migrated = 0;
        let errors = 0;
        
        try {
            console.log("[SQLite Migration] Starting transaction...");
            await db.exec('BEGIN TRANSACTION');

            // Migrate Artifacts
            const artifacts = await idb.getAll(STORES.IMAGE_ARTIFACTS);
            for (const artifact of artifacts) {
                try {
                    const original = await artifact.original.arrayBuffer();
                    const preview = await artifact.preview.arrayBuffer();
                    const thumb = await artifact.thumb.arrayBuffer();
                    
                    await db.exec({
                        sql: `INSERT OR IGNORE INTO images (key, original, preview, thumb, manifest, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                        bind: [
                            artifact.key,
                            new Uint8Array(original),
                            new Uint8Array(preview),
                            new Uint8Array(thumb),
                            JSON.stringify(artifact.manifest),
                            artifact.manifest.timestamps?.created_utc || new Date().toISOString()
                        ]
                    });
                    migrated++;
                } catch (e) {
                    errors++;
                    console.error(`Failed to migrate artifact with key ${artifact.key}:`, e);
                }
            }
             console.log(`[SQLite Migration] Migrated ${artifacts.length} artifacts.`);

            // Migrate Aliases
            const aliases = await idb.getAll(STORES.IMAGE_ALIASES);
            for (const alias of aliases) {
                try {
                    await db.exec({
                        sql: `INSERT OR IGNORE INTO aliases (recipe_id, image_key) VALUES (?, ?)`,
                        bind: [alias.recipeId, alias.key]
                    });
                     migrated++;
                } catch (e) {
                    errors++;
                    console.error(`Failed to migrate alias for recipe ${alias.recipeId}:`, e);
                }
            }
            console.log(`[SQLite Migration] Migrated ${aliases.length} aliases.`);

            await db.exec('COMMIT');
            console.log("[SQLite Migration] Transaction committed.");

        } catch (e) {
            errors++;
            console.error('SQLite migration failed, rolling back transaction.', e);
            await db.exec('ROLLBACK');
        } finally {
            return { migrated, errors };
        }
    }
}

export const sqliteStore = new SQLiteImageStore();
