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
        // Conservative chunking to avoid circular dependency issues
        chunkSizeWarningLimit: 1000,

        rollupOptions: {
          output: {
            // Simplified manual chunk splitting - only split vendor code
            // This avoids circular dependency issues while still improving caching
            manualChunks: (id) => {
              // Only split out vendor dependencies from node_modules
              // Keep all application code together to avoid import issues
              if (id.includes('node_modules')) {
                // React core
                if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                  return 'react-vendor';
                }
                // Database libs
                if (id.includes('@sqlite.org/sqlite-wasm') || id.includes('idb')) {
                  return 'database-vendor';
                }
                // AI SDK
                if (id.includes('@google/genai')) {
                  return 'ai-vendor';
                }
                // Other node_modules go to vendor chunk
                return 'vendor';
              }
              // All application code stays in the main chunk
              // This prevents circular dependency and import order issues
            }
          }
        }
      }
    };
});
