// services/gameScoreService.ts
// Service for saving game scores to Supabase for permanent storage
import { supabase } from '../lib/supabase';
import type { GameMode } from '../types';

/**
 * Save a game score to Supabase
 * This ensures permanent storage beyond browser storage
 */
export async function saveGameScoreToSupabase(
  userId: string,
  gameMode: GameMode,
  score: number,
  difficulty?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[gameScoreService] Saving score for ${userId}: ${gameMode} - ${score}`);

    const { error } = await supabase
      .from('game_scores')
      .insert({
        user_id: userId,
        game_mode: gameMode,
        score,
        difficulty,
        metadata: metadata || {},
      });

    if (error) {
      console.error('[gameScoreService] Error saving to Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('[gameScoreService] ✓ Score saved to Supabase successfully');
    return { success: true };
  } catch (error) {
    console.error('[gameScoreService] Exception saving score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get game scores for a specific user
 */
export async function getUserGameScores(
  userId: string,
  gameMode?: GameMode,
  limit: number = 50
): Promise<Array<{
  id: string;
  user_id: string;
  game_mode: string;
  score: number;
  difficulty: string | null;
  metadata: any;
  created_at: string;
}>> {
  try {
    let query = supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[gameScoreService] Error fetching scores:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[gameScoreService] Exception fetching scores:', error);
    return [];
  }
}

/**
 * Get best score for a user and game mode
 */
export async function getUserBestScore(
  userId: string,
  gameMode: GameMode
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('game_mode', gameMode)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.score;
  } catch (error) {
    console.error('[gameScoreService] Error fetching best score:', error);
    return null;
  }
}

/**
 * Get average score for a user and game mode
 */
export async function getUserAverageScore(
  userId: string,
  gameMode: GameMode
): Promise<number | null> {
  try {
    const scores = await getUserGameScores(userId, gameMode);

    if (scores.length === 0) {
      return null;
    }

    const total = scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round(total / scores.length);
  } catch (error) {
    console.error('[gameScoreService] Error calculating average score:', error);
    return null;
  }
}

/**
 * Update daily game activity
 * This is used for streak tracking
 */
export async function updateDailyActivity(
  userId: string,
  gameMode: GameMode,
  score: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if activity exists for today
    const { data: existing, error: selectError } = await supabase
      .from('game_activity_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[gameScoreService] Error checking daily activity:', selectError);
      return;
    }

    if (existing) {
      // Update existing record
      const gameModes = existing.game_modes_played || [];
      if (!gameModes.includes(gameMode)) {
        gameModes.push(gameMode);
      }

      const { error: updateError } = await supabase
        .from('game_activity_daily')
        .update({
          games_played: existing.games_played + 1,
          total_score: existing.total_score + score,
          game_modes_played: gameModes,
        })
        .eq('user_id', userId)
        .eq('activity_date', today);

      if (updateError) {
        console.error('[gameScoreService] Error updating daily activity:', updateError);
      } else {
        console.log('[gameScoreService] ✓ Daily activity updated');
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('game_activity_daily')
        .insert({
          user_id: userId,
          activity_date: today,
          games_played: 1,
          total_score: score,
          game_modes_played: [gameMode],
        });

      if (insertError) {
        console.error('[gameScoreService] Error inserting daily activity:', insertError);
      } else {
        console.log('[gameScoreService] ✓ Daily activity created');
      }
    }
  } catch (error) {
    console.error('[gameScoreService] Exception updating daily activity:', error);
  }
}

/**
 * Complete workflow: Save score and update daily activity
 * Call this when a game is completed
 */
export async function recordGameCompletion(
  userId: string,
  gameMode: GameMode,
  score: number,
  difficulty?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  // Save the score
  const result = await saveGameScoreToSupabase(userId, gameMode, score, difficulty, metadata);

  // Update daily activity (non-blocking)
  updateDailyActivity(userId, gameMode, score).catch(err =>
    console.error('[gameScoreService] Failed to update daily activity:', err)
  );

  return result;
}
