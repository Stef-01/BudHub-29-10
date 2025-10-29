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
