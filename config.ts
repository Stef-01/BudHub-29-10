// config.ts

import type { TaskPriority } from './types';

export const HEATWAVE_THRESHOLD = 35; // degrees Celsius

// Gamification settings
export const LEVEL_XP_BASE = 100;
export const LEVEL_XP_MULTIPLIER = 1.2;

export const XP_VALUES: Record<TaskPriority, number> = {
    High: 50,
    Medium: 30,
    Low: 15,
};
