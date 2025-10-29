// config.ts

/**
 * This file contains tweakable configuration values for the application.
 * It's a safe place to adjust application behavior without touching core logic.
 */

// --- Weather Service ---
export const HEATWAVE_THRESHOLD = 32; // degrees Celsius

// --- Gamification System ---
export const XP_VALUES: { [key in 'High' | 'Medium' | 'Low']: number } = {
    High: 25,
    Medium: 15,
    Low: 10,
};

export const LEVEL_XP_BASE = 100; // XP needed for Level 2
export const LEVEL_XP_MULTIPLIER = 1.2; // Each subsequent level requires this much more XP

// --- Unsplash Image Service ---
export const UNSPLASH_CONFIG = {
    accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
    apiUrl: 'https://api.unsplash.com',
    defaultSearchQuery: 'indian food healthy',
    perPage: 1, // Get 1 photo per search
    orientation: 'landscape', // Better for recipe cards
};

// Initialize Unsplash service with API key
if (typeof window !== 'undefined' && UNSPLASH_CONFIG.accessKey) {
    // Make access key available to Unsplash service
    (window as any).__UNSPLASH_ACCESS_KEY__ = UNSPLASH_CONFIG.accessKey;

    // Lazy import and initialize
    import('./services/unsplashService').then(({ unsplashService }) => {
        unsplashService.setAccessKey(UNSPLASH_CONFIG.accessKey);
        console.log('✅ Unsplash service initialized');
    });
}
