import initSqlJs, { type Database } from 'sql.js';
import type { Plant, Recipe } from '../types';
import { PLANT_CATALOG, INITIAL_GARDEN, INITIAL_COOKBOOK } from '../constants';

let db: Database | null = null;
const DB_FILE_NAME = 'garden-vibe.sqlite';
const IDB_DB_NAME = 'GardenVibeDB';
const IDB_STORE_NAME = 'sqlite';

function getIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                db.createObjectStore(IDB_STORE_NAME);
            }
        };
    });
}

async function saveDbToIndexedDB() {
    if (!db) return;
    const data = db.export();
    const idb = await getIDB();
    return new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        store.put(data, DB_FILE_NAME);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function loadDbFromIndexedDB(): Promise<Uint8Array | null> {
    const idb = await getIDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const request = store.get(DB_FILE_NAME);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

function getLocalStorageValue<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(key);
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return defaultValue;
}

function migrateFromLocalStorage() {
    console.log("Checking for localStorage data to migrate...");
    const migrated = localStorage.getItem('db_migrated_to_sqlite_v1');
    if (migrated) {
        console.log("localStorage data already migrated.");
        return;
    }
    if (!db) throw new Error("DB not initialized for migration");

    // Plants
    const plants: Plant[] = getLocalStorageValue('user_garden_plants', INITIAL_GARDEN);
    const plantStmt = db.prepare("INSERT OR IGNORE INTO user_plants (plant_id) VALUES (?)");
    plants.forEach(p => plantStmt.run([p.id]));
    plantStmt.free();

    // Recipes
    let recipes: Recipe[] = getLocalStorageValue('user_cookbook_recipes', INITIAL_COOKBOOK);
    const recipeVersion = localStorage.getItem('recipe_schema_version');
    if (recipeVersion !== '3') {
        console.log("Applying recipe schema migration (v3) before storing in SQLite.");
        recipes = recipes.map(r => {
            if (r.imageMetadata?.image_key) return r;
            if (r.source === 'preloaded') {
                 return { ...r, imageMetadata: { source: 'emoji', status: 'pending', image_key: undefined } };
            }
            return { ...r, imageMetadata: { source: r.image.startsWith('http') ? 'url' : 'user', status: 'cached', image_key: undefined } };
        });
    }
    const recipeStmt = db.prepare("INSERT OR IGNORE INTO user_recipes (id, recipe_json) VALUES (?, ?)");
    recipes.forEach(r => recipeStmt.run([r.id, JSON.stringify(r)]));
    recipeStmt.free();

    // Gamification
    const xp = getLocalStorageValue('user_xp', 0);
    const level = getLocalStorageValue('user_level', 1);
    db.run("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('user_xp', ?), ('user_level', ?)", [xp, level]);

    // Task states
    const completedTasks: Record<string, boolean> = getLocalStorageValue('completed_tasks', {});
    const taskStmt = db.prepare("INSERT OR IGNORE INTO task_states (id, is_completed) VALUES (?, ?)");
    Object.entries(completedTasks).forEach(([id, completed]) => taskStmt.run([id, completed ? 1 : 0]));
    taskStmt.free();

    // Dismissed Tasks
    const dismissedTaskIds: string[] = getLocalStorageValue('dismissed_task_ids', []);
    db.run("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('dismissed_task_ids', ?)", [JSON.stringify(dismissedTaskIds)]);

    localStorage.setItem('db_migrated_to_sqlite_v1', 'true');
    console.log("Migration from localStorage to SQLite complete.");
}

function createSchema() {
    if (!db) throw new Error("Database not initialized");
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS user_plants (plant_id INTEGER PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS user_recipes (id TEXT PRIMARY KEY, recipe_json TEXT);
        CREATE TABLE IF NOT EXISTS task_states (id TEXT PRIMARY KEY, is_completed INTEGER);
    `);
    
    const [{ 'count(*)': plantCount }] = db.exec("SELECT count(*) FROM user_plants");
    if (plantCount === 0) {
        console.log("Seeding initial garden plants.");
        const plantStmt = db.prepare("INSERT INTO user_plants (plant_id) VALUES (?)");
        INITIAL_GARDEN.forEach(p => plantStmt.run([p.id]));
        plantStmt.free();
    }
    
    const [{ 'count(*)': recipeCount }] = db.exec("SELECT count(*) FROM user_recipes");
    if (recipeCount === 0) {
        console.log("Seeding initial cookbook recipes.");
        const recipeStmt = db.prepare("INSERT INTO user_recipes (id, recipe_json) VALUES (?, ?)");
        INITIAL_COOKBOOK.forEach(r => recipeStmt.run([r.id, JSON.stringify(r)]));
        recipeStmt.free();
    }
}

export async function initDatabase(): Promise<Database> {
    if (db) return db;
    
    const SQL = await initSqlJs({
        locateFile: file => `https://esm.sh/sql.js@1.10.3/dist/${file}`
    });

    const dbData = await loadDbFromIndexedDB();
    if (dbData) {
        db = new SQL.Database(dbData);
    } else {
        db = new SQL.Database();
    }

    createSchema();
    migrateFromLocalStorage();
    await saveDbToIndexedDB();
    
    return db;
}

// Data Access Functions
export async function getMyPlants(): Promise<Plant[]> {
    if (!db) await initDatabase();
    const res = db!.exec("SELECT plant_id FROM user_plants");
    if (!res.length) return [];
    const plantIds = new Set(res[0].values.map(row => row[0]));
    return PLANT_CATALOG.filter(p => plantIds.has(p.id));
}
export async function addPlant(plantId: number) {
    if (!db) await initDatabase();
    db!.run("INSERT OR IGNORE INTO user_plants (plant_id) VALUES (?)", [plantId]);
    await saveDbToIndexedDB();
}
export async function removePlant(plantId: number) {
    if (!db) await initDatabase();
    db!.run("DELETE FROM user_plants WHERE plant_id = ?", [plantId]);
    await saveDbToIndexedDB();
}

export async function getMyRecipes(): Promise<Recipe[]> {
    if (!db) await initDatabase();
    const res = db!.exec("SELECT recipe_json FROM user_recipes");
    if (!res.length) return [];
    return res[0].values.map(row => JSON.parse(row[0] as string));
}
export async function addRecipe(recipe: Recipe) {
    if (!db) await initDatabase();
    db!.run("INSERT OR REPLACE INTO user_recipes (id, recipe_json) VALUES (?, ?)", [recipe.id, JSON.stringify(recipe)]);
    await saveDbToIndexedDB();
}
export async function updateRecipe(recipe: Recipe) {
    if (!db) await initDatabase();
    db!.run("UPDATE user_recipes SET recipe_json = ? WHERE id = ?", [JSON.stringify(recipe), recipe.id]);
    await saveDbToIndexedDB();
}
export async function removeRecipe(recipeId: string) {
    if (!db) await initDatabase();
    db!.run("DELETE FROM user_recipes WHERE id = ?", [recipeId]);
    await saveDbToIndexedDB();
}

export async function getGamificationState(): Promise<{xp: number, level: number}> {
    if (!db) await initDatabase();
    const res = db!.exec("SELECT key, value FROM user_settings WHERE key IN ('user_xp', 'user_level')");
    let xp = 0;
    let level = 1;
    if (res.length) {
        res[0].values.forEach(([key, value]) => {
            if (key === 'user_xp') xp = parseInt(value as string, 10) || 0;
            if (key === 'user_level') level = parseInt(value as string, 10) || 1;
        });
    }
    return { xp, level };
}
export async function saveGamificationState(xp: number, level: number) {
    if (!db) await initDatabase();
    db!.run("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('user_xp', ?), ('user_level', ?)", [xp, level]);
    await saveDbToIndexedDB();
}

export async function getTaskStates(): Promise<Record<string, boolean>> {
    if (!db) await initDatabase();
    const res = db!.exec("SELECT id, is_completed FROM task_states");
    if (!res.length) return {};
    return Object.fromEntries(res[0].values.map(([id, completed]) => [id, completed === 1]));
}
export async function saveTaskState(taskId: string, isCompleted: boolean) {
    if (!db) await initDatabase();
    db!.run("INSERT OR REPLACE INTO task_states (id, is_completed) VALUES (?, ?)", [taskId, isCompleted ? 1 : 0]);
    await saveDbToIndexedDB();
}

export async function getDismissedTaskIds(): Promise<string[]> {
    if (!db) await initDatabase();
    const res = db!.exec("SELECT value FROM user_settings WHERE key = 'dismissed_task_ids'");
    if (!res.length || !res[0].values.length) return [];
    return JSON.parse(res[0].values[0][0] as string);
}
export async function saveDismissedTaskIds(ids: string[]) {
    if (!db) await initDatabase();
    db!.run("INSERT OR REPLACE INTO user_settings (key, value) VALUES ('dismissed_task_ids', ?)", [JSON.stringify(ids)]);
    await saveDbToIndexedDB();
}