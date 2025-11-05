import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          // Enable SharedArrayBuffer for SQLite WASM OPFS support
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: ['@sqlite.org/sqlite-wasm'],
      },
      build: {
        // Increase chunk size warning limit (500kb → 1000kb)
        // We're using manual chunks to properly split the bundle
        chunkSizeWarningLimit: 1000,

        rollupOptions: {
          output: {
            // Manual chunk splitting for optimal loading and caching
            manualChunks: (id) => {
              // React vendor chunk - updates rarely, cache aggressively
              if (id.includes('node_modules/react') ||
                  id.includes('node_modules/react-dom') ||
                  id.includes('node_modules/scheduler')) {
                return 'react-vendor';
              }

              // Database vendor chunk - SQLite WASM + IndexedDB
              // These are large but only loaded once
              if (id.includes('node_modules/@sqlite.org/sqlite-wasm') ||
                  id.includes('node_modules/idb')) {
                return 'database-vendor';
              }

              // AI vendor chunk - Gemini SDK
              // Separated because it's large and not always needed
              if (id.includes('node_modules/@google/genai')) {
                return 'ai-vendor';
              }

              // Game components chunk - all game-related code
              // Can be loaded on-demand when user accesses games
              if (id.includes('/components/') &&
                  (id.includes('Game') ||
                   id.includes('games/') ||
                   id.includes('UnifiedNutrient'))) {
                return 'games';
              }

              // Recipe and catalog data - large constants
              // Separate to allow efficient caching
              if (id.includes('constants.ts')) {
                return 'catalog-data';
              }

              // Shared utilities and services
              if (id.includes('/services/') ||
                  id.includes('/hooks/') ||
                  id.includes('/utils/')) {
                return 'shared-utils';
              }

              // Context providers - needed early
              if (id.includes('/contexts/')) {
                return 'contexts';
              }

              // Everything else goes to the default chunk
              // This includes main App.tsx, router, etc.
            }
          }
        }
      }
    };
});
