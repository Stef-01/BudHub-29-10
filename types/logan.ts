// types/logan.ts
// TypeScript types for Logan-specific features (markets, prices, resources, budget missions)

// ==================== MARKETS ====================

export type MarketType = 'market' | 'indian_grocery' | 'general_grocery';

export interface Market {
  id: string;
  name: string;
  type: MarketType;
  description?: string;
  suburb?: string;
  address?: string;
  lat?: number;
  lng?: number;
  day_of_week?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time?: string;
  end_time?: string;
  website_url?: string;
  facebook_url?: string;
  has_indian_produce: boolean;
  is_active: boolean;
  last_verified?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketTag {
  id: number;
  market_id: string;
  tag: string;
}

export interface MarketWithTags extends Market {
  tags: string[];
}

// ==================== PRODUCE & PRICES ====================

export type ProduceCategory = 'vegetable' | 'spice' | 'grain' | 'herb' | 'fruit';
export type GIRating = 'low' | 'medium' | 'high';
export type UnitType = 'kg' | 'bunch' | 'bag' | 'piece';
export type PriceSourceType = 'facebook_scrape' | 'manual' | 'api' | 'user_reported';

export interface ProduceItem {
  id: string;
  name: string;
  name_variations?: string[];
  category?: ProduceCategory;
  is_indian_staple: boolean;
  emoji?: string;
  nutritional_notes?: string;
  gi_rating?: GIRating;
  created_at: string;
  updated_at: string;
}

export interface PriceSnapshot {
  id: string;
  produce_item_id: string;
  market_id: string;
  price_per_kg?: number;
  price_per_unit?: number;
  unit_type?: UnitType;
  snapshot_date: string;
  source_type: PriceSourceType;
  source_url?: string;
  notes?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LatestPrice {
  id: string;
  produce_item_id: string;
  market_id: string;
  price_per_kg?: number;
  price_per_unit?: number;
  unit_type?: UnitType;
  snapshot_date: string;
  verified: boolean;
  produce_name: string;
  emoji?: string;
  is_indian_staple: boolean;
  category?: ProduceCategory;
  gi_rating?: GIRating;
  market_name: string;
  suburb?: string;
  day_of_week?: number;
  market_type: MarketType;
}

export interface CheapestPrice extends LatestPrice {
  // Same as LatestPrice but represents the cheapest option across all markets
}

// ==================== RESOURCES ====================

export type ResourceFormat = 'pdf' | 'web' | 'video' | 'infographic';
export type ResourceLanguage = 'English' | 'Hindi' | 'Punjabi' | 'Tamil' | 'Gujarati';
export type ResourceTopic =
  | 'healthy eating'
  | 'carb counting'
  | 'Indian food culture'
  | 'diabetes management'
  | 'healthy cooking'
  | 'recipes'
  | 'lifestyle program'
  | 'medical services'
  | 'community support';
export type ResourceAudience = 'patients' | 'families' | 'healthcare_providers' | 'general';

export interface Resource {
  id: string;
  title: string;
  organization?: string;
  url: string;
  language: ResourceLanguage;
  format?: ResourceFormat;
  topic?: ResourceTopic;
  is_local: boolean;
  target_audience?: ResourceAudience;
  description?: string;
  thumbnail_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  last_verified?: string;
}

// ==================== GAME PROGRESS ====================

export interface GameProgressWeekly {
  id: string;
  user_id: string;
  week_start_date: string;
  game_mode: string;
  games_played: number;
  total_score: number;
  average_score: number;
  best_score: number;
  worst_score?: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface GameActivityDaily {
  id: string;
  user_id: string;
  activity_date: string;
  games_played: number;
  total_score: number;
  game_modes_played?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserGameStats {
  user_id: string;
  total_days_played: number;
  total_games_played: number;
  average_score: number;
  best_score: number;
  first_game_date: string;
  last_game_date: string;
}

// ==================== BUDGET MISSIONS ====================

export type MissionDifficulty = 'easy' | 'medium' | 'hard';
export type MissionStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned';

export interface BudgetMission {
  id: string;
  title: string;
  description?: string;
  budget_limit: number;
  duration_days: number;
  required_servings?: number;
  required_produce_types?: string[];
  difficulty: MissionDifficulty;
  is_active: boolean;
  points_reward: number;
  badge_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  produce_id: string;
  produce_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  market_id: string;
  market_name: string;
  total_cost: number;
}

export interface MealPlanDay {
  day: number;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string[];
  veg_servings: number;
}

export interface UserMissionAttempt {
  id: string;
  user_id: string;
  mission_id: string;
  started_at: string;
  completed_at?: string;
  status: MissionStatus;
  total_spent: number;
  veg_servings_achieved: number;
  success?: boolean;
  meal_plan?: MealPlanDay[];
  shopping_list?: ShoppingListItem[];
  feedback_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MissionLeaderboardEntry {
  id: string;
  mission_id: string;
  user_id: string;
  attempt_id: string;
  completion_time_hours: number;
  budget_utilization_percent: number;
  servings_count: number;
  rank: number;
  created_at: string;
}

export interface ActiveMissionWithStats extends BudgetMission {
  total_attempts: number;
  successful_completions: number;
  avg_spending?: number;
  best_spending?: number;
}
