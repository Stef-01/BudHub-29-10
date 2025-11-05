# Build Optimization Strategy

## Problem Statement

During production builds, Vite was warning:
```
Some chunks are larger than 500 kB after minification.
```

This indicated that the application was bundling too much code into single chunks, leading to:
- Slow initial page load
- Poor caching efficiency (changing one file invalidates entire bundle)
- Suboptimal performance on slower connections

## Root Cause Analysis

### 1. Large Dependencies
- **@google/genai** (1.28.0) - Gemini AI SDK for recipe generation
- **@sqlite.org/sqlite-wasm** (3.50.4) - WASM SQLite binary (~1MB)
- **React 19** - Modern React with all features

### 2. Large Data Files
- **constants.ts** (1954 lines) - Contains:
  - 68 recipes in RECIPE_CATALOG
  - 267 plants in PLANT_CATALOG
  - All initial data structures

### 3. No Build Configuration
- Missing `build.rollupOptions.output.manualChunks`
- All code bundled into 1-2 large chunks
- Vendor code mixed with application code

## Solution: Hybrid Chunking Strategy

### Approach
Combined **manual chunk splitting** with **selective dynamic imports** for optimal performance.

### Manual Chunks Configuration

#### 1. **react-vendor** (~150-200 KB)
- React core
- React DOM
- Scheduler
- **Why separate?** Updates rarely, cache aggressively

#### 2. **database-vendor** (~800-1000 KB)
- @sqlite.org/sqlite-wasm
- idb (IndexedDB wrapper)
- **Why separate?** Large WASM binary, loaded once per session

#### 3. **ai-vendor** (~300-400 KB)
- @google/genai
- **Why separate?** Only needed for recipe generation feature

#### 4. **games** (~100-150 KB)
- UnifiedNutrientGame
- GameRecipeCard
- All game components
- **Why separate?** Feature-specific, can be loaded on-demand

#### 5. **catalog-data** (~150-200 KB)
- constants.ts (recipes, plants, events)
- **Why separate?** Large data file, changes rarely

#### 6. **shared-utils** (~50-100 KB)
- Services (imageService, db, etc.)
- Hooks (useRecipeImage, etc.)
- **Why separate?** Shared across features, good for caching

#### 7. **contexts** (~30-50 KB)
- UserCookbookContext
- UserGardenContext
- GamificationContext
- **Why separate?** Needed early in app lifecycle

### Dynamic Imports

#### AdminView (Lazy Loaded)
```typescript
const AdminView = lazy(() => import('../AdminView'));
```

**Why?**
- Rarely accessed by regular users
- Contains heavy image upload features
- Reduces initial bundle by ~50-80 KB

**User Experience:**
- Shows loading state when accessed
- No impact on main app performance

## Benefits

### Performance Improvements

1. **Smaller Initial Bundle**
   - Before: ~1.2-1.5 MB single chunk
   - After: ~400-500 KB main chunk + smaller vendor chunks

2. **Better Caching**
   - Vendor chunks (React, SQLite) rarely change
   - Browser caches them long-term
   - Only app code invalidates on updates

3. **Parallel Loading**
   - Multiple chunks load simultaneously
   - Browser can prioritize critical chunks

4. **Lazy Loading**
   - Admin panel only loads when needed
   - Reduces initial JavaScript parsing time

### Developer Experience

1. **Clear Chunk Organization**
   - Easy to identify what's in each chunk
   - Predictable bundle sizes

2. **Maintainable Configuration**
   - Well-commented vite.config.ts
   - Easy to adjust as app grows

3. **No Code Refactoring Required**
   - Only configuration changes
   - Minimal changes to components (just AdminView)

## Monitoring & Validation

### Check Build Output
```bash
npm run build
```

Look for output like:
```
dist/assets/react-vendor-[hash].js       150.23 kB
dist/assets/database-vendor-[hash].js    892.45 kB
dist/assets/ai-vendor-[hash].js          324.12 kB
dist/assets/games-[hash].js              128.67 kB
dist/assets/catalog-data-[hash].js       187.34 kB
dist/assets/shared-utils-[hash].js        78.92 kB
dist/assets/contexts-[hash].js            42.18 kB
dist/assets/index-[hash].js              456.78 kB
```

### Warnings Suppressed
- `chunkSizeWarningLimit` increased to 1000 KB
- Only database-vendor chunk exceeds 500 KB (acceptable for WASM binary)

## Future Optimizations

### If Bundle Grows Further:

1. **Route-based Code Splitting**
   - Lazy load GamesView, RecipeBook, etc.
   - Each major view becomes its own chunk

2. **Image Optimization**
   - Use WebP/AVIF formats
   - Implement lazy loading for recipe images
   - Consider CDN for static assets

3. **Tree Shaking**
   - Audit dependencies for unused exports
   - Use ES modules exclusively

4. **Compression**
   - Enable Brotli compression on server
   - Gzip as fallback

## References

- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
