// services/budgetMissionService.ts
// Service layer for budget mission challenges

import { supabase } from '../lib/supabase';
import type { BudgetMission, ActiveMissionWithStats, UserMissionAttempt } from '../types/logan';

/**
 * Get all active budget missions
 */
export async function getActiveMissions(): Promise<BudgetMission[]> {
  try {
    const { data, error } = await supabase
      .from('budget_missions')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[budgetMissionService] Error fetching active missions:', error);
    return [];
  }
}

/**
 * Get featured mission with statistics
 */
export async function getFeaturedMission(): Promise<ActiveMissionWithStats | null> {
  try {
    // Get a featured mission (e.g., medium difficulty, most popular)
    const { data: mission, error: missionError } = await supabase
      .from('budget_missions')
      .select('*')
      .eq('is_active', true)
      .eq('difficulty', 'medium')
      .limit(1)
      .single();

    if (missionError || !mission) {
      console.error('[budgetMissionService] Error fetching featured mission:', missionError);
      return null;
    }

    // Get statistics for this mission
    const { data: attempts, error: attemptsError } = await supabase
      .from('user_mission_attempts')
      .select('total_spent, success')
      .eq('mission_id', mission.id);

    if (attemptsError) {
      console.error('[budgetMissionService] Error fetching mission stats:', attemptsError);
    }

    const totalAttempts = attempts?.length || 0;
    const successfulAttempts = attempts?.filter(a => a.success === true) || [];
    const successfulCompletions = successfulAttempts.length;

    const spendingAmounts = successfulAttempts
      .map(a => a.total_spent)
      .filter(s => s !== null && s !== undefined) as number[];

    const avgSpending = spendingAmounts.length > 0
      ? spendingAmounts.reduce((sum, val) => sum + val, 0) / spendingAmounts.length
      : undefined;

    const bestSpending = spendingAmounts.length > 0
      ? Math.min(...spendingAmounts)
      : undefined;

    return {
      ...mission,
      total_attempts: totalAttempts,
      successful_completions: successfulCompletions,
      avg_spending: avgSpending,
      best_spending: bestSpending
    };
  } catch (error) {
    console.error('[budgetMissionService] Error in getFeaturedMission:', error);
    return null;
  }
}

/**
 * Get user's active mission attempt
 */
export async function getUserActiveMission(userId: string): Promise<UserMissionAttempt | null> {
  try {
    const { data, error } = await supabase
      .from('user_mission_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No active mission is not an error, just return null
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[budgetMissionService] Error fetching user active mission:', error);
    return null;
  }
}

/**
 * Start a new mission attempt
 */
export async function startMissionAttempt(userId: string, missionId: string): Promise<UserMissionAttempt | null> {
  try {
    const { data, error } = await supabase
      .from('user_mission_attempts')
      .insert({
        user_id: userId,
        mission_id: missionId,
        status: 'in_progress',
        total_spent: 0,
        veg_servings_achieved: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[budgetMissionService] Error starting mission attempt:', error);
    return null;
  }
}

/**
 * Get mission leaderboard (top performers)
 */
export async function getMissionLeaderboard(missionId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('mission_leaderboard')
      .select('*')
      .eq('mission_id', missionId)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[budgetMissionService] Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get user's completed missions count
 */
export async function getUserCompletedMissionsCount(userId: string): Promise<number> {
  try {
    const { data, error, count } = await supabase
      .from('user_mission_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('success', true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('[budgetMissionService] Error fetching completed missions count:', error);
    return 0;
  }
}
