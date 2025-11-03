# SQLite WASM Permanent Storage Implementation Plan

## 1. Executive Summary

**Goal**: To replace the current non-functional, mock implementation of the `sqliteStore.ts` service with a full, production-ready implementation using the `@sqlite.org/sqlite-wasm` library. This will provide a truly persistent storage layer for AI-generated recipe images using the browser's Origin Private File System (OPFS), ensuring images survive browser cache and IndexedDB clearing.

**Strategy**:
1.  **Implement Core Service**: Replace the mock `sqliteStore.ts` with a functional service that initializes a real SQLite database in the OPFS.
2.  **Verify Module Loading**: Ensure the `index.html` import map is correctly configured to load the SQLite WASM library from the designated CDN.
3.  **Preserve Architecture**: The new service will seamlessly integrate with the existing dual-write and read-through cache patterns already established in `imageStoreService.ts` and `db.ts`.

---

## 2. Current State Analysis & Problem

-   **Critical Flaw**: The `sqliteStore.ts` service is currently a mock that uses an in-memory `Map`. It does **not** persist any data, rendering the permanent storage feature non-functional.
-   **Potential Loading Failure**: The application's stability is entirely dependent on the `index.html` import map correctly pointing to the `@sqlite.org/sqlite-wasm` module. Any misconfiguration will cause the entire persistence layer to fail.
-   **Impact**: Users' AI-generated images are not being stored permanently and are lost if the IndexedDB cache is cleared, defeating the purpose of the feature.

---

## 3. Implementation Plan

### Phase 1: Infrastructure Setup

#### Step 1.1: Implement the SQLite Service
**File**: `services/sqliteStore.ts`
**Action**: Replace the entire mock implementation with the full, robust service.
**Technical Requirements**:
-   Use the `sqlite3.oo1.OpfsDb` class from `@sqlite.org/sqlite-wasm` to create a database file named `/nutriserve-images.db` in the Origin Private File System.
-   Implement an `initDb` function with a singleton pattern to ensure only one database connection is opened.
-   On initialization, execute `CREATE TABLE IF NOT EXISTS` statements for the `image_artifacts` and `image_aliases` tables, matching the schema below.
-   All public methods (`getImage`, `saveImage`, `getAlias`, `saveAlias`, `migrateFromIndexedDB`) will be implemented to execute real, parameterized SQL queries against the database.
-   Handle data conversion: `Blob` objects from the app will be converted to `Uint8Array` for storage as `BLOB` in SQLite.

#### Step 1.2: Verify Module Loader Configuration
**File**: `index.html`
**Action**: Ensure the `importmap` contains a valid, direct path to the `@sqlite.org/sqlite-wasm` async bundle on the CDN. This is the root fix for any potential module loading errors.

### Phase 2: Integration & Migration

#### Step 2.1: Data Migration
**File**: `services/sqliteStore.ts` (within the new `migrateFromIndexedDB` implementation)
**Action**: The migration logic will be implemented to:
1.  Open an atomic transaction in the new SQLite database.
2.  Read all image artifacts and aliases from the existing IndexedDB stores.
3.  For each record, check if it already exists in SQLite to prevent duplicates during re-runs.
4.  Convert image `Blob`s to `Uint8Array`s.
5.  Execute `INSERT` statements to copy the data into the SQLite tables.
6.  Commit the transaction, or roll back if any errors occur.

#### Step 2.2: Verify Existing Integrations (No Code Change Needed)
-   **Dual-Write**: Confirm that `imageStoreService.ts`'s `saveImageArtifacts` function will call the new, functional `sqliteStore.saveImage`.
-   **Read-Through Cache**: Confirm that `imageStoreService.ts`'s `getRecipeImageState` function will correctly fall back to the new, functional `sqliteStore.getImage` on an IndexedDB cache miss.
-   **Migration Trigger**: Confirm that `db.ts` calls `sqliteStore.migrateFromIndexedDB` on application startup.

---

## 4. Database Schema (SQLite)

**Table: `image_artifacts`**
-   `key` (TEXT PRIMARY KEY): The content-addressed SHA-256 hash.
-   `original` (BLOB): The full-resolution image data.
-   `preview` (BLOB): The 1024px preview image data.
-   `thumb` (BLOB): The 256px thumbnail image data.
-   `manifest` (TEXT): JSON stringified metadata about the image.
-   `created_at` (TEXT): ISO 8601 timestamp of creation.

**Table: `image_aliases`**
-   `recipe_id` (TEXT PRIMARY KEY): The recipe's unique identifier.
-   `image_key` (TEXT): A foreign key referencing `image_artifacts.key`.

---

## 5. Success Criteria

1.  **Functionality**: Images must persist even after the browser's IndexedDB and site cache are manually cleared.
2.  **Performance**: The application must load without errors. Image retrieval from SQLite should be performant and not block the UI.
3.  **Backward Compatibility**: The one-time migration must successfully and non-destructively copy all existing images from IndexedDB to SQLite.
4.  **No Regressions**: All existing features, including AI image generation and user uploads, must continue to function correctly through the new persistence layer.
5.  **Error Handling**: The system must gracefully handle potential SQLite initialization or query failures without crashing the entire application.