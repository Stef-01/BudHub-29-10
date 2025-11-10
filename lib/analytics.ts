import { track } from '@vercel/analytics';

/**
 * Analytics tracking helpers for the BudHub application
 * Tracks user engagement and game performance
 */

// Game Events
export const trackGameStart = (gameMode: string, userId?: string) => {
  track('game_start', {
    gameMode,
    userId: userId || 'guest',
  });
};

export const trackGameComplete = (gameMode: string, score: number, userId?: string) => {
  track('game_complete', {
    gameMode,
    score,
    userId: userId || 'guest',
  });
};

export const trackGameExit = (gameMode: string, score: number, duration?: number, userId?: string) => {
  track('game_exit', {
    gameMode,
    score,
    duration,
    userId: userId || 'guest',
  });
};

// Nutrient Challenge specific
export const trackNutrientChallengeAttempt = (metric: string, wasCorrect: boolean, userId?: string) => {
  track('nutrient_challenge_attempt', {
    metric,
    wasCorrect,
    userId: userId || 'guest',
  });
};

// NutriServe Chef specific
export const trackNutriServeRound = (roundNumber: number, score: number, userId?: string) => {
  track('nutriserve_round', {
    roundNumber,
    score,
    userId: userId || 'guest',
  });
};

// Admin Dashboard
export const trackAdminAccess = (userId: string) => {
  track('admin_dashboard_access', {
    userId,
  });
};

export const trackAdminTabChange = (tab: string, userId: string) => {
  track('admin_tab_change', {
    tab,
    userId,
  });
};

// Tab Navigation
export const trackTabChange = (tab: string, userId?: string) => {
  track('tab_change', {
    tab,
    userId: userId || 'guest',
  });
};

// User Identification
export const trackUserSession = (userId: string) => {
  track('user_session', {
    userId,
  });
};
