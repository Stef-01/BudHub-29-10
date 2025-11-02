# Vibe-Coded Garden - SQLite WASM Image Persistence Plan

## Executive Summary

**Goal**: Implement a permanent, browser-based storage solution for AI-generated recipe images using SQLite WASM with OPFS (Origin Private File System) persistence. This will prevent image loss when a user clears their browser cache or IndexedDB.

**Strategy**:
1.  **Introduce a new SQLite layer** that runs alongside the existing IndexedDB.
2.  **Implement a dual-write strategy**: New images are saved to both IndexedDB and SQLite.
3.  **Use a read-through cache pattern**: The app will attempt to read from IndexedDB first (for speed). On a cache miss, it will fall back to reading from the permanent SQLite store and then repopulate IndexedDB.
4.  **Perform a one-time migration**: On first launch after the update, existing images from IndexedDB will be seamlessly migrated to the new SQLite database in the background.

This approach ensures **zero data loss**, **full backward compatibility**, and **no breaking changes** to the existing application APIs or user experience.

---

## Part 1: SQLite Infrastructure Setup

### Step 1.1: New Service Layer
A new service, `services/sqliteStore.ts`, will be created to encapsulate all interactions with the SQLite WASM database. This service will be responsible for:
- Initializing the SQLite database and its WASM environment.
- Using the Origin Private File System (OPFS) for persistence.
- Defining the database schema for images and aliases.
- Providing simple async methods for CRUD operations (`saveImage`, `getImage`, `saveAlias`, `getAlias`).
- Containing the logic for the one-time migration from IndexedDB.

### Database Schema
- **`images` table**: Stores the binary image data.
  - `key` (TEXT, PRIMARY KEY): The content-addressed `sha256` hash of the image.
  - `original`, `preview`, `thumb` (BLOB): The binary data for each image size.
  - `manifest` (TEXT): A JSON string containing metadata about the image generation.
  - `created_at` (TEXT): ISO 8601 timestamp.
- **`aliases` table**: Maps a human-readable `recipeId` to its content-addressed `image key`.
  - `recipe_id` (TEXT, PRIMARY KEY)
  - `image_key` (TEXT)
- **`metadata` table**: Tracks internal state, like migration status.

---

## Part 2: Dual-Write and Read-Through Cache Implementation

### Step 2.1: Modify `imageStoreService.ts`
This is the core of the implementation. The existing `imageStoreService.ts` will be modified to orchestrate the interaction between the IndexedDB cache and the SQLite permanent store.

#### `saveImageArtifacts` (Dual-Write)
- The function signature will remain unchanged.
- **Step 1**: It will first perform the existing write to IndexedDB as normal.
- **Step 2**: Upon successful completion of the IndexedDB write, it will then call the new `sqliteStore.saveImage` and `sqliteStore.saveAlias` methods to persist the same data to the SQLite database. This ensures the permanent store is always up-to-date.

#### `getRecipeImageState` (Read-Through Cache)
- The function signature will remain unchanged.
- **Step 1 (Cache Hit)**: It will first attempt to retrieve the image from IndexedDB. If found, it will return the data immediately, providing the fastest possible response.
- **Step 2 (Cache Miss)**: If the image is not found in IndexedDB, it will log a "cache miss" and proceed to query the `sqliteStore`.
- **Step 3 (SQLite Fallback)**: It will attempt to retrieve the image from the SQLite database.
- **Step 4 (Cache Repopulation)**: If the image is found in SQLite, it will be automatically written back into IndexedDB by calling `saveImageArtifacts`. This ensures that subsequent requests for the same image will be served quickly from the cache.
- **Step 5 (Not Found)**: If the image is not found in either store, it will return `null` as before.

---

## Part 3: One-Time Data Migration

### Step 3.1: Modify `db.ts`
The migration process will be triggered once, automatically, when the application starts up.

- The main database initialization function, `createAndSeedDb` in `services/db.ts`, will be modified.
- After the IndexedDB is successfully initialized, it will check for a metadata flag (e.g., `sqlite_migration_v1`) within IndexedDB's `metadata` store.
- If the flag is not present, it will:
  1.  Trigger the `sqliteStore.migrateFromIndexedDB()` function.
  2.  This function will read all image artifacts and aliases from IndexedDB and write them into the SQLite database in a batch.
  3.  Upon successful completion, it will set the migration flag in the IndexedDB metadata store to ensure the process never runs again.
- This entire process will run asynchronously and will not block the main application from loading.

---

## Part 4: Technical & Success Criteria

### Must-Haves
- **Data Persistence**: Images are not lost after clearing browser site data (excluding "cookies and other site data" which can clear OPFS).
- **No Regressions**: All existing features, including AI image generation, user image uploads, and recipe management, continue to work without any changes.
- **Performance**: Image load times from the SQLite fallback remain fast (target < 1s). The initial cache-hit path remains unaffected.
- **Seamless Migration**: Users with existing data will have their images migrated without any manual steps or noticeable disruption.

### Technical Stack
- **`@sqlite.org/sqlite-wasm`**: The official SQLite WASM build will be used for its robust support of the Origin Private File System (OPFS).
- **Asynchronous Operations**: All database interactions will be asynchronous to avoid blocking the main thread.
- **Error Handling**: The system will gracefully handle potential errors during database initialization, writes, reads, and migration.

---

## Part 5: Validation Plan

### Manual Testing Checklist
1.  **Fresh Install**: Verify the app loads, generates an image, and the image is stored in both databases.
2.  **Migration Test**: Load the app with pre-existing IndexedDB image data. Verify migration runs and completes successfully by checking logs and OPFS storage via browser dev tools.
3.  **Cache Clear Test**:
    - Generate/confirm an image exists.
    - Manually delete the `VibeGardenDB` IndexedDB database from browser dev tools.
    - Reload the app.
    - **Expected**: The image should still load (from SQLite), and the IndexedDB database should be repopulated with the image data.
4.  **Concurrency Test**: Generate multiple images at once via the "AI Suggestion" feature. Verify all images are saved correctly to both stores.
5.  **Offline Test**: Load the app, go offline, and verify that already-loaded images are still visible.

This plan ensures a robust, permanent storage solution is implemented with minimal risk and no disruption to the existing, functional application.
