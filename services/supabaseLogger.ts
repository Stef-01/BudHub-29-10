import { supabase } from '../lib/supabase';
import { getUserId } from '../hooks/useUserId';

// Types for Nutrient Challenge logging
export interface NutrientChallengeAttempt {
  user_id: string;
  session_id: string;
  metric: string;
  challenge_text: string;
  correct_recipe_id: string;
  correct_recipe_name: string;
  selected_recipe_id: string | null;
  selected_recipe_name: string | null;
  was_correct: boolean;
  options: any[];
  time_taken_seconds: number | null;
  points_earned: number;
  lives_remaining: number;
}

export interface NutrientChallengeSession {
  user_id: string;
  session_id: string;
  final_score: number;
  questions_correct: number;
  questions_total: number;
  high_protein_correct: number;
  high_protein_total: number;
  high_fiber_correct: number;
  high_fiber_total: number;
  low_carb_correct: number;
  low_carb_total: number;
  diabetic_friendly_correct: number;
  diabetic_friendly_total: number;
}

// Types for NutriServe logging
export interface NutriServeRoundAttempt {
  user_id: string;
  session_id: string;
  round_number: number;
  customer_name: string;
  customer_targets: any;
  is_diabetic: boolean;
  foods_selected: any[];
  meal_totals: any;
  round_score: number;
  max_possible_score: number;
  nutrient_feedback: any;
  nutrients_off_target: string[];
  xp_awarded: string | null;
}

export interface NutriServeSession {
  user_id: string;
  session_id: string;
  final_score: number;
  rounds_completed: number;
  max_rounds: number;
  average_round_score: number;
  perfect_rounds: number;
  protein_accuracy_avg: number;
  carbs_accuracy_avg: number;
  fat_accuracy_avg: number;
  fiber_accuracy_avg: number;
  sugar_accuracy_avg: number;
  sodium_accuracy_avg: number;
}

/**
 * Log a single Nutrient Challenge question attempt
 */
export async function logNutrientChallengeAttempt(attempt: NutrientChallengeAttempt) {
  try {
    const { data, error } = await supabase
      .from('nutrient_challenge_attempts')
      .insert([attempt]);

    if (error) {
      console.error('Error logging nutrient challenge attempt:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging nutrient challenge attempt:', err);
    return { success: false, error: err };
  }
}

/**
 * Log a completed Nutrient Challenge game session
 */
export async function logNutrientChallengeSession(session: NutrientChallengeSession) {
  try {
    const { data, error } = await supabase
      .from('nutrient_challenge_sessions')
      .insert([session]);

    if (error) {
      console.error('Error logging nutrient challenge session:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging nutrient challenge session:', err);
    return { success: false, error: err };
  }
}

/**
 * Log a single NutriServe round attempt
 */
export async function logNutriServeRoundAttempt(attempt: NutriServeRoundAttempt) {
  try {
    const { data, error } = await supabase
      .from('nutriserve_round_attempts')
      .insert([attempt]);

    if (error) {
      console.error('Error logging nutriserve round attempt:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging nutriserve round attempt:', err);
    return { success: false, error: err };
  }
}

/**
 * Log a completed NutriServe game session
 */
export async function logNutriServeSession(session: NutriServeSession) {
  try {
    const { data, error } = await supabase
      .from('nutriserve_sessions')
      .insert([session]);

    if (error) {
      console.error('Error logging nutriserve session:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging nutriserve session:', err);
    return { success: false, error: err };
  }
}

/**
 * Get all attempts for a user in Nutrient Challenge
 */
export async function getNutrientChallengeAttempts(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutrient_challenge_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching nutrient challenge attempts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all sessions for a user in Nutrient Challenge
 */
export async function getNutrientChallengeSessions(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutrient_challenge_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching nutrient challenge sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all round attempts for a user in NutriServe
 */
export async function getNutriServeRoundAttempts(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutriserve_round_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching nutriserve round attempts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all sessions for a user in NutriServe
 */
export async function getNutriServeSessions(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutriserve_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching nutriserve sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get concept mastery analysis for Nutrient Challenge
 */
export async function getNutrientChallengeMastery(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutrient_challenge_concept_mastery')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching concept mastery:', error);
    return [];
  }

  return data || [];
}

/**
 * Get problem nutrients analysis for NutriServe
 */
export async function getNutriServeProblemNutrients(userId: string = getUserId()) {
  const { data, error } = await supabase
    .from('nutriserve_problem_nutrients')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching problem nutrients:', error);
    return [];
  }

  return data || [];
}
