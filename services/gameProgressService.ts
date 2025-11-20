// services/gameProgressService.ts
// Service layer for game progress analytics

import { supabase } from '../lib/supabase';
import type { GameProgressWeekly, UserGameStats } from '../types/logan';

/**
 * Get weekly progress for a user
 */
export async function getWeeklyProgress(userId: string, weeks: number = 4): Promise<GameProgressWeekly[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const { data, error } = await supabase
      .from('game_progress_weekly')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start_date', startDate.toISOString().split('T')[0])
      .order('week_start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[gameProgressService] Error fetching weekly progress:', error);
    return [];
  }
}

/**
 * Get progress for a specific game mode over time
 */
export async function getProgressByGameMode(
  userId: string,
  gameMode: string,
  weeks: number = 8
): Promise<GameProgressWeekly[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const { data, error } = await supabase
      .from('game_progress_weekly')
      .select('*')
      .eq('user_id', userId)
      .eq('game_mode', gameMode)
      .gte('week_start_date', startDate.toISOString().split('T')[0])
      .order('week_start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[gameProgressService] Error fetching progress by game mode:', error);
    return [];
  }
}

/**
 * Get overall user game statistics
 */
export async function getUserGameStats(userId: string): Promise<UserGameStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[gameProgressService] Error fetching user game stats:', error);
    return null;
  }
}

/**
 * Get current streak for a user
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_current_streak', { p_user_id: userId });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('[gameProgressService] Error fetching current streak:', error);
    return 0;
  }
}

/**
 * Calculate and store weekly progress
 * This would typically be run by a cron job or called after game completion
 */
export async function calculateAndStoreWeeklyProgress(userId: string): Promise<void> {
  try {
    // Get the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Call the calculate_weekly_progress function
    const { data, error } = await supabase
      .rpc('calculate_weekly_progress', {
        p_user_id: userId,
        p_week_start: weekStartStr
      });

    if (error) throw error;

    // Insert or update weekly progress records
    if (data && Array.isArray(data)) {
      for (const progressData of data) {
        await supabase
          .from('game_progress_weekly')
          .upsert({
            user_id: userId,
            week_start_date: weekStartStr,
            game_mode: progressData.game_mode,
            games_played: progressData.games_played,
            total_score: progressData.total_score,
            average_score: progressData.average_score,
            best_score: progressData.best_score,
            worst_score: progressData.worst_score,
            streak_days: await getCurrentStreak(userId)
          }, {
            onConflict: 'user_id,week_start_date,game_mode'
          });
      }
    }
  } catch (error) {
    console.error('[gameProgressService] Error calculating weekly progress:', error);
  }
}

/**
 * Get improvement trend (percentage change from previous week)
 */
export async function getImprovementTrend(userId: string, gameMode?: string): Promise<number> {
  try {
    const progress = gameMode
      ? await getProgressByGameMode(userId, gameMode, 2)
      : await getWeeklyProgress(userId, 2);

    if (progress.length < 2) return 0;

    // Calculate average score improvement
    const thisWeek = progress[progress.length - 1];
    const lastWeek = progress[progress.length - 2];

    if (lastWeek.average_score === 0) return 0;

    const improvement = ((thisWeek.average_score - lastWeek.average_score) / lastWeek.average_score) * 100;
    return Math.round(improvement);
  } catch (error) {
    console.error('[gameProgressService] Error calculating improvement trend:', error);
    return 0;
  }
}

/**
 * Get best performance week
 */
export async function getBestPerformanceWeek(userId: string): Promise<GameProgressWeekly | null> {
  try {
    const { data, error } = await supabase
      .from('game_progress_weekly')
      .select('*')
      .eq('user_id', userId)
      .order('average_score', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[gameProgressService] Error fetching best performance week:', error);
    return null;
  }
}
