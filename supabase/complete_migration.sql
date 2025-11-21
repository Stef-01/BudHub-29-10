-- Migration: Create Markets Tables
-- Description: Stores Logan area markets selling Indian produce
-- Created: 2025-11-20

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('market', 'indian_grocery', 'general_grocery')),
  description TEXT,
  suburb TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, ...
  start_time TIME,
  end_time TIME,
  website_url TEXT,
  facebook_url TEXT,
  has_indian_produce BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_verified DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market tags table (many-to-many relationship for produce types)
CREATE TABLE IF NOT EXISTS market_tags (
  id SERIAL PRIMARY KEY,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_day ON markets(day_of_week);
CREATE INDEX IF NOT EXISTS idx_markets_suburb ON markets(suburb);
CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_market_tags_tag ON market_tags(tag);
CREATE INDEX IF NOT EXISTS idx_market_tags_market ON market_tags(market_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to markets table
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to markets
CREATE POLICY "Markets are viewable by everyone"
  ON markets FOR SELECT
  USING (true);

-- Allow public read access to market tags
CREATE POLICY "Market tags are viewable by everyone"
  ON market_tags FOR SELECT
  USING (true);

-- Only authenticated users can insert/update markets (admin only)
CREATE POLICY "Only authenticated users can manage markets"
  ON markets FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage market tags"
  ON market_tags FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE markets IS 'Logan area markets and grocery stores selling Indian produce';
COMMENT ON TABLE market_tags IS 'Tags indicating what types of produce are available at each market';
COMMENT ON COLUMN markets.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN markets.type IS 'market=farmers market, indian_grocery=Indian specialty store, general_grocery=general supermarket with Indian section';
-- Migration: Create Price Tracking Tables
-- Description: Track produce prices over time at different Logan markets
-- Created: 2025-11-20

-- Produce items table (catalog of vegetables, spices, etc.)
CREATE TABLE IF NOT EXISTS produce_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_variations TEXT[], -- ['bitter melon','karela','bitter gourd']
  category TEXT, -- 'vegetable','spice','grain','herb'
  is_indian_staple BOOLEAN DEFAULT FALSE,
  emoji TEXT, -- '🥒' for bitter melon
  nutritional_notes TEXT,
  gi_rating TEXT CHECK (gi_rating IN ('low', 'medium', 'high')), -- Glycemic Index
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price snapshots table (historical price tracking)
CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produce_item_id UUID REFERENCES produce_items(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  price_per_kg NUMERIC(10,2),
  price_per_unit NUMERIC(10,2),
  unit_type TEXT, -- 'kg','bunch','bag','piece'
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_type TEXT DEFAULT 'manual', -- 'facebook_scrape','manual','api','user_reported'
  source_url TEXT,
  notes TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_produce_items_staple ON produce_items(is_indian_staple);
CREATE INDEX IF NOT EXISTS idx_produce_items_category ON produce_items(category);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_date ON price_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_produce ON price_snapshots(produce_item_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_market ON price_snapshots(market_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_verified ON price_snapshots(verified);

-- Composite index for common queries (latest price per produce per market)
CREATE INDEX IF NOT EXISTS idx_price_snapshots_composite
  ON price_snapshots(produce_item_id, market_id, snapshot_date DESC);

-- Updated at triggers
CREATE TRIGGER update_produce_items_updated_at
    BEFORE UPDATE ON produce_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_snapshots_updated_at
    BEFORE UPDATE ON price_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for latest prices (most recent price for each produce item at each market)
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (ps.produce_item_id, ps.market_id)
  ps.id,
  ps.produce_item_id,
  ps.market_id,
  ps.price_per_kg,
  ps.price_per_unit,
  ps.unit_type,
  ps.snapshot_date,
  ps.verified,
  pi.name AS produce_name,
  pi.emoji,
  pi.is_indian_staple,
  pi.category,
  pi.gi_rating,
  m.name AS market_name,
  m.suburb,
  m.day_of_week,
  m.type AS market_type
FROM price_snapshots ps
JOIN produce_items pi ON ps.produce_item_id = pi.id
JOIN markets m ON ps.market_id = m.id
WHERE ps.verified = TRUE
ORDER BY ps.produce_item_id, ps.market_id, ps.snapshot_date DESC;

-- View for cheapest prices today (best price for each produce item across all markets)
CREATE OR REPLACE VIEW cheapest_prices AS
SELECT DISTINCT ON (produce_item_id)
  *
FROM latest_prices
ORDER BY produce_item_id, price_per_kg ASC NULLS LAST, price_per_unit ASC NULLS LAST;

-- Row Level Security
ALTER TABLE produce_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Produce items are viewable by everyone"
  ON produce_items FOR SELECT
  USING (true);

CREATE POLICY "Verified price snapshots are viewable by everyone"
  ON price_snapshots FOR SELECT
  USING (verified = true OR auth.role() = 'authenticated');

-- Only authenticated users can manage produce items and prices
CREATE POLICY "Only authenticated users can manage produce items"
  ON produce_items FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can add price snapshots"
  ON price_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update price snapshots"
  ON price_snapshots FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE produce_items IS 'Catalog of vegetables, fruits, spices available at Logan markets';
COMMENT ON TABLE price_snapshots IS 'Historical price tracking for produce items at different markets';
COMMENT ON VIEW latest_prices IS 'Most recent verified price for each produce item at each market';
COMMENT ON VIEW cheapest_prices IS 'Best current price for each produce item across all markets';
COMMENT ON COLUMN produce_items.name_variations IS 'Alternative names (e.g., bitter melon, karela, bitter gourd)';
COMMENT ON COLUMN produce_items.gi_rating IS 'Glycemic Index rating for diabetes management';
COMMENT ON COLUMN price_snapshots.source_type IS 'How the price was obtained: manual entry, Facebook scrape, API, or user-reported';
-- Migration: Create Resources Table
-- Description: Indian dietary and health resources for Logan/Brisbane community
-- Created: 2025-11-20

-- Resources table (links to health guides, PDFs, videos)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT, -- 'Metro South Health', 'Queensland Health', 'Diabetes Australia'
  url TEXT NOT NULL,
  language TEXT DEFAULT 'English', -- 'English','Hindi','Punjabi','Tamil','Gujarati'
  format TEXT, -- 'pdf','web','video','infographic'
  topic TEXT, -- 'healthy eating','carb counting','Indian food culture','diabetes management'
  is_local BOOLEAN DEFAULT FALSE, -- true for Logan/Brisbane specific resources
  target_audience TEXT, -- 'patients','families','healthcare_providers','general'
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[], -- ['vegetarian','low-carb','cultural','family-friendly']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified DATE -- when the link was last checked
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_local ON resources(is_local);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic);
CREATE INDEX IF NOT EXISTS idx_resources_language ON resources(language);
CREATE INDEX IF NOT EXISTS idx_resources_format ON resources(format);
CREATE INDEX IF NOT EXISTS idx_resources_audience ON resources(target_audience);

-- GIN index for array searching (tags)
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);

-- Updated at trigger
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (true);

-- Only authenticated users can manage resources
CREATE POLICY "Only authenticated users can manage resources"
  ON resources FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE resources IS 'Indian dietary and health resources for Logan/Brisbane community';
COMMENT ON COLUMN resources.is_local IS 'TRUE for Logan/Brisbane specific resources, FALSE for general resources';
COMMENT ON COLUMN resources.language IS 'Primary language of the resource';
COMMENT ON COLUMN resources.format IS 'Type of resource: pdf, web page, video, or infographic';
COMMENT ON COLUMN resources.topic IS 'Main topic category for filtering';
COMMENT ON COLUMN resources.tags IS 'Additional tags for filtering (e.g., vegetarian, low-carb, cultural)';
-- Migration: Enhance Game Progress Tracking
-- Description: Add game scores table and weekly aggregated progress tracking
-- Created: 2025-11-20
-- Fixed: Added game_scores table creation

-- First, create the game_scores table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  score INT NOT NULL,
  difficulty TEXT,
  metadata JSONB, -- Store additional game data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for game_scores
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_mode ON game_scores(game_mode);

-- Updated at trigger function (create if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_scores
DROP TRIGGER IF EXISTS update_game_scores_updated_at ON game_scores;
CREATE TRIGGER update_game_scores_updated_at
    BEFORE UPDATE ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Weekly game progress aggregation table
CREATE TABLE IF NOT EXISTS game_progress_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  game_mode TEXT NOT NULL,
  games_played INT DEFAULT 0,
  total_score INT DEFAULT 0,
  average_score NUMERIC(10,2),
  best_score INT,
  worst_score INT,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date, game_mode)
);

-- Daily game activity (for streak tracking)
CREATE TABLE IF NOT EXISTS game_activity_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  games_played INT DEFAULT 0,
  total_score INT DEFAULT 0,
  game_modes_played TEXT[], -- ['nutriserve','unified_nutrient']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_progress_user_week ON game_progress_weekly(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_game_progress_mode ON game_progress_weekly(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_activity_user_date ON game_activity_daily(user_id, activity_date DESC);

-- Updated at triggers
DROP TRIGGER IF EXISTS update_game_progress_weekly_updated_at ON game_progress_weekly;
CREATE TRIGGER update_game_progress_weekly_updated_at
    BEFORE UPDATE ON game_progress_weekly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_activity_daily_updated_at ON game_activity_daily;
CREATE TRIGGER update_game_activity_daily_updated_at
    BEFORE UPDATE ON game_activity_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate weekly progress from game_scores table
CREATE OR REPLACE FUNCTION calculate_weekly_progress(p_user_id TEXT, p_week_start DATE)
RETURNS TABLE (
  game_mode TEXT,
  games_played BIGINT,
  total_score BIGINT,
  average_score NUMERIC,
  best_score INT,
  worst_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.game_mode::TEXT,
    COUNT(*)::BIGINT AS games_played,
    SUM(gs.score)::BIGINT AS total_score,
    AVG(gs.score)::NUMERIC AS average_score,
    MAX(gs.score)::INT AS best_score,
    MIN(gs.score)::INT AS worst_score
  FROM game_scores gs
  WHERE gs.user_id = p_user_id
    AND gs.created_at >= p_week_start
    AND gs.created_at < p_week_start + INTERVAL '7 days'
  GROUP BY gs.game_mode;
END;
$$ LANGUAGE plpgsql;

-- Function to get current streak for a user
CREATE OR REPLACE FUNCTION get_current_streak(p_user_id TEXT)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM game_activity_daily
      WHERE user_id = p_user_id
        AND activity_date = v_date
        AND games_played > 0
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      -- Check if we should allow a 1-day gap for today
      IF v_date = CURRENT_DATE THEN
        v_date := v_date - INTERVAL '1 day';
        CONTINUE;
      ELSE
        EXIT;
      END IF;
    END IF;

    v_streak := v_streak + 1;
    v_date := v_date - INTERVAL '1 day';

    -- Prevent infinite loop
    IF v_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- View for user game statistics
CREATE OR REPLACE VIEW user_game_stats AS
SELECT
  user_id,
  COUNT(DISTINCT DATE(created_at)) AS total_days_played,
  COUNT(*) AS total_games_played,
  AVG(score) AS average_score,
  MAX(score) AS best_score,
  MIN(created_at) AS first_game_date,
  MAX(created_at) AS last_game_date
FROM game_scores
GROUP BY user_id;

-- Row Level Security
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_activity_daily ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to game scores" ON game_scores;
DROP POLICY IF EXISTS "Public read access to weekly progress" ON game_progress_weekly;
DROP POLICY IF EXISTS "Public read access to daily activity" ON game_activity_daily;
DROP POLICY IF EXISTS "Users can insert their own scores" ON game_scores;
DROP POLICY IF EXISTS "System can manage weekly progress" ON game_progress_weekly;
DROP POLICY IF EXISTS "System can manage daily activity" ON game_activity_daily;

-- Public read access to allow anon key to read data
CREATE POLICY "Public read access to game scores"
  ON game_scores FOR SELECT
  USING (true);

CREATE POLICY "Public read access to weekly progress"
  ON game_progress_weekly FOR SELECT
  USING (true);

CREATE POLICY "Public read access to daily activity"
  ON game_activity_daily FOR SELECT
  USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON game_scores FOR INSERT
  WITH CHECK (true);

-- System can insert/update progress data
CREATE POLICY "System can manage weekly progress"
  ON game_progress_weekly FOR ALL
  USING (true);

CREATE POLICY "System can manage daily activity"
  ON game_activity_daily FOR ALL
  USING (true);

-- Comments
COMMENT ON TABLE game_scores IS 'Individual game scores from all game modes';
COMMENT ON TABLE game_progress_weekly IS 'Weekly aggregated game performance metrics for progress tracking';
COMMENT ON TABLE game_activity_daily IS 'Daily game activity for streak tracking';
COMMENT ON FUNCTION calculate_weekly_progress IS 'Calculate weekly game statistics from raw game_scores';
COMMENT ON FUNCTION get_current_streak IS 'Get current consecutive days played streak for a user';
COMMENT ON VIEW user_game_stats IS 'Overall game statistics per user';
-- Migration: Enhance Game Progress Tracking
-- Description: Add game scores table and weekly aggregated progress tracking
-- Created: 2025-11-20
-- Fixed: Added game_scores table creation

-- First, create the game_scores table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  score INT NOT NULL,
  difficulty TEXT,
  metadata JSONB, -- Store additional game data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for game_scores
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_mode ON game_scores(game_mode);

-- Updated at trigger function (create if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_scores
DROP TRIGGER IF EXISTS update_game_scores_updated_at ON game_scores;
CREATE TRIGGER update_game_scores_updated_at
    BEFORE UPDATE ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Weekly game progress aggregation table
CREATE TABLE IF NOT EXISTS game_progress_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  game_mode TEXT NOT NULL,
  games_played INT DEFAULT 0,
  total_score INT DEFAULT 0,
  average_score NUMERIC(10,2),
  best_score INT,
  worst_score INT,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date, game_mode)
);

-- Daily game activity (for streak tracking)
CREATE TABLE IF NOT EXISTS game_activity_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  games_played INT DEFAULT 0,
  total_score INT DEFAULT 0,
  game_modes_played TEXT[], -- ['nutriserve','unified_nutrient']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_progress_user_week ON game_progress_weekly(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_game_progress_mode ON game_progress_weekly(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_activity_user_date ON game_activity_daily(user_id, activity_date DESC);

-- Updated at triggers
DROP TRIGGER IF EXISTS update_game_progress_weekly_updated_at ON game_progress_weekly;
CREATE TRIGGER update_game_progress_weekly_updated_at
    BEFORE UPDATE ON game_progress_weekly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_activity_daily_updated_at ON game_activity_daily;
CREATE TRIGGER update_game_activity_daily_updated_at
    BEFORE UPDATE ON game_activity_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate weekly progress from game_scores table
CREATE OR REPLACE FUNCTION calculate_weekly_progress(p_user_id TEXT, p_week_start DATE)
RETURNS TABLE (
  game_mode TEXT,
  games_played BIGINT,
  total_score BIGINT,
  average_score NUMERIC,
  best_score INT,
  worst_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.game_mode::TEXT,
    COUNT(*)::BIGINT AS games_played,
    SUM(gs.score)::BIGINT AS total_score,
    AVG(gs.score)::NUMERIC AS average_score,
    MAX(gs.score)::INT AS best_score,
    MIN(gs.score)::INT AS worst_score
  FROM game_scores gs
  WHERE gs.user_id = p_user_id
    AND gs.created_at >= p_week_start
    AND gs.created_at < p_week_start + INTERVAL '7 days'
  GROUP BY gs.game_mode;
END;
$$ LANGUAGE plpgsql;

-- Function to get current streak for a user
CREATE OR REPLACE FUNCTION get_current_streak(p_user_id TEXT)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM game_activity_daily
      WHERE user_id = p_user_id
        AND activity_date = v_date
        AND games_played > 0
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      -- Check if we should allow a 1-day gap for today
      IF v_date = CURRENT_DATE THEN
        v_date := v_date - INTERVAL '1 day';
        CONTINUE;
      ELSE
        EXIT;
      END IF;
    END IF;

    v_streak := v_streak + 1;
    v_date := v_date - INTERVAL '1 day';

    -- Prevent infinite loop
    IF v_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- View for user game statistics
CREATE OR REPLACE VIEW user_game_stats AS
SELECT
  user_id,
  COUNT(DISTINCT DATE(created_at)) AS total_days_played,
  COUNT(*) AS total_games_played,
  AVG(score) AS average_score,
  MAX(score) AS best_score,
  MIN(created_at) AS first_game_date,
  MAX(created_at) AS last_game_date
FROM game_scores
GROUP BY user_id;

-- Row Level Security
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_activity_daily ENABLE ROW LEVEL SECURITY;

-- Public read access to allow anon key to read data
CREATE POLICY "Public read access to game scores"
  ON game_scores FOR SELECT
  USING (true);

CREATE POLICY "Public read access to weekly progress"
  ON game_progress_weekly FOR SELECT
  USING (true);

CREATE POLICY "Public read access to daily activity"
  ON game_activity_daily FOR SELECT
  USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON game_scores FOR INSERT
  WITH CHECK (true);

-- System can insert/update progress data
CREATE POLICY "System can manage weekly progress"
  ON game_progress_weekly FOR ALL
  USING (true);

CREATE POLICY "System can manage daily activity"
  ON game_activity_daily FOR ALL
  USING (true);

-- Comments
COMMENT ON TABLE game_scores IS 'Individual game scores from all game modes';
COMMENT ON TABLE game_progress_weekly IS 'Weekly aggregated game performance metrics for progress tracking';
COMMENT ON TABLE game_activity_daily IS 'Daily game activity for streak tracking';
COMMENT ON FUNCTION calculate_weekly_progress IS 'Calculate weekly game statistics from raw game_scores';
COMMENT ON FUNCTION get_current_streak IS 'Get current consecutive days played streak for a user';
COMMENT ON VIEW user_game_stats IS 'Overall game statistics per user';
-- Migration: Create Budget Challenge Missions
-- Description: Gamified nutrition challenges based on Logan market prices
-- Created: 2025-11-20

-- Budget missions table (challenge templates)
CREATE TABLE IF NOT EXISTS budget_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  budget_limit NUMERIC(10,2) NOT NULL, -- Maximum budget in AUD
  duration_days INT DEFAULT 7, -- How many days the challenge runs
  required_servings INT, -- Minimum vegetable servings required
  required_produce_types TEXT[], -- ['bitter melon','spinach','okra'] - must include these
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active BOOLEAN DEFAULT TRUE,
  points_reward INT DEFAULT 0, -- XP points for completing
  badge_name TEXT, -- 'Budget Chef','Thrifty Shopper','Smart Saver'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User mission attempts table (tracking user progress)
CREATE TABLE IF NOT EXISTS user_mission_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  mission_id UUID REFERENCES budget_missions(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),
  total_spent NUMERIC(10,2) DEFAULT 0,
  veg_servings_achieved INT DEFAULT 0,
  success BOOLEAN,
  meal_plan JSONB, -- Store the user's planned meals
  shopping_list JSONB, -- Items and prices selected
  feedback_notes TEXT, -- User notes or reflections
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission leaderboard (fastest completions, best budget utilization)
CREATE TABLE IF NOT EXISTS mission_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES budget_missions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  attempt_id UUID REFERENCES user_mission_attempts(id) ON DELETE CASCADE,
  completion_time_hours INT, -- How long it took to complete
  budget_utilization_percent NUMERIC(5,2), -- Percentage of budget used
  servings_count INT,
  rank INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mission_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_missions_active ON budget_missions(is_active);
CREATE INDEX IF NOT EXISTS idx_budget_missions_difficulty ON budget_missions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_missions_user ON user_mission_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON user_mission_attempts(status);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission ON user_mission_attempts(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_leaderboard_mission ON mission_leaderboard(mission_id, rank);
CREATE INDEX IF NOT EXISTS idx_mission_leaderboard_user ON mission_leaderboard(user_id);

-- Updated at triggers
DROP TRIGGER IF EXISTS update_budget_missions_updated_at ON budget_missions;
CREATE TRIGGER update_budget_missions_updated_at
    BEFORE UPDATE ON budget_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_mission_attempts_updated_at ON user_mission_attempts;
CREATE TRIGGER update_user_mission_attempts_updated_at
    BEFORE UPDATE ON user_mission_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate mission success
CREATE OR REPLACE FUNCTION check_mission_success()
RETURNS TRIGGER AS $$
DECLARE
  v_mission budget_missions%ROWTYPE;
  v_success BOOLEAN := FALSE;
BEGIN
  -- Get mission details
  SELECT * INTO v_mission FROM budget_missions WHERE id = NEW.mission_id;

  -- Check if mission is completed successfully
  IF NEW.status = 'completed' THEN
    v_success := (
      NEW.total_spent <= v_mission.budget_limit AND
      NEW.veg_servings_achieved >= COALESCE(v_mission.required_servings, 0)
    );

    NEW.success := v_success;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate success when mission is marked completed
DROP TRIGGER IF EXISTS calculate_mission_success ON user_mission_attempts;
CREATE TRIGGER calculate_mission_success
    BEFORE UPDATE OF status ON user_mission_attempts
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION check_mission_success();

-- Function to update leaderboard when mission is completed
CREATE OR REPLACE FUNCTION update_mission_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  v_completion_hours INT;
  v_budget_percent NUMERIC(5,2);
  v_mission budget_missions%ROWTYPE;
BEGIN
  IF NEW.status = 'completed' AND NEW.success = TRUE THEN
    -- Get mission details
    SELECT * INTO v_mission FROM budget_missions WHERE id = NEW.mission_id;

    -- Calculate completion time in hours
    v_completion_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 3600;

    -- Calculate budget utilization percentage
    v_budget_percent := (NEW.total_spent / v_mission.budget_limit) * 100;

    -- Insert or update leaderboard entry
    INSERT INTO mission_leaderboard (
      mission_id,
      user_id,
      attempt_id,
      completion_time_hours,
      budget_utilization_percent,
      servings_count
    ) VALUES (
      NEW.mission_id,
      NEW.user_id,
      NEW.id,
      v_completion_hours,
      v_budget_percent,
      NEW.veg_servings_achieved
    )
    ON CONFLICT (mission_id, user_id)
    DO UPDATE SET
      attempt_id = EXCLUDED.attempt_id,
      completion_time_hours = EXCLUDED.completion_time_hours,
      budget_utilization_percent = EXCLUDED.budget_utilization_percent,
      servings_count = EXCLUDED.servings_count,
      created_at = NOW()
    WHERE mission_leaderboard.budget_utilization_percent > EXCLUDED.budget_utilization_percent;

    -- Update ranks
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY mission_id
          ORDER BY budget_utilization_percent ASC, servings_count DESC
        ) AS new_rank
      FROM mission_leaderboard
      WHERE mission_id = NEW.mission_id
    )
    UPDATE mission_leaderboard ml
    SET rank = ranked.new_rank
    FROM ranked
    WHERE ml.id = ranked.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard
DROP TRIGGER IF EXISTS update_leaderboard_on_completion ON user_mission_attempts;
CREATE TRIGGER update_leaderboard_on_completion
    AFTER UPDATE OF status ON user_mission_attempts
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_mission_leaderboard();

-- View for active missions with stats
CREATE OR REPLACE VIEW active_missions_with_stats AS
SELECT
  bm.*,
  COUNT(uma.id) AS total_attempts,
  COUNT(CASE WHEN uma.success = TRUE THEN 1 END) AS successful_completions,
  AVG(CASE WHEN uma.success = TRUE THEN uma.total_spent END) AS avg_spending,
  MIN(CASE WHEN uma.success = TRUE THEN uma.total_spent END) AS best_spending
FROM budget_missions bm
LEFT JOIN user_mission_attempts uma ON bm.id = uma.mission_id
WHERE bm.is_active = TRUE
GROUP BY bm.id;

-- Row Level Security
ALTER TABLE budget_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view active missions" ON budget_missions;
DROP POLICY IF EXISTS "Users can view their own mission attempts" ON user_mission_attempts;
DROP POLICY IF EXISTS "Users can create their own mission attempts" ON user_mission_attempts;
DROP POLICY IF EXISTS "Users can update their own mission attempts" ON user_mission_attempts;
DROP POLICY IF EXISTS "Everyone can view mission leaderboards" ON mission_leaderboard;
DROP POLICY IF EXISTS "System can manage leaderboard" ON mission_leaderboard;
DROP POLICY IF EXISTS "Admins can manage budget missions" ON budget_missions;

-- Public can view active missions
CREATE POLICY "Everyone can view active missions"
  ON budget_missions FOR SELECT
  USING (is_active = TRUE);

-- Users can view their own attempts
CREATE POLICY "Users can view their own mission attempts"
  ON user_mission_attempts FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- Users can insert their own attempts
CREATE POLICY "Users can create their own mission attempts"
  ON user_mission_attempts FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Users can update their own attempts
CREATE POLICY "Users can update their own mission attempts"
  ON user_mission_attempts FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));

-- Everyone can view leaderboards
CREATE POLICY "Everyone can view mission leaderboards"
  ON mission_leaderboard FOR SELECT
  USING (true);

-- Only system can manage leaderboard
CREATE POLICY "System can manage leaderboard"
  ON mission_leaderboard FOR ALL
  USING (auth.role() = 'authenticated');

-- Only admins can manage missions
CREATE POLICY "Admins can manage budget missions"
  ON budget_missions FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE budget_missions IS 'Budget challenge templates based on Logan market prices';
COMMENT ON TABLE user_mission_attempts IS 'User attempts at budget challenges with meal plans and shopping lists';
COMMENT ON TABLE mission_leaderboard IS 'Leaderboard showing best budget utilization for each mission';
COMMENT ON COLUMN budget_missions.budget_limit IS 'Maximum budget in AUD for the challenge';
COMMENT ON COLUMN budget_missions.required_produce_types IS 'Specific produce items that must be included (e.g., Indian staples)';
COMMENT ON COLUMN user_mission_attempts.meal_plan IS 'JSON structure of planned meals for the challenge period';
COMMENT ON COLUMN user_mission_attempts.shopping_list IS 'JSON structure of selected items with prices and quantities';
COMMENT ON COLUMN mission_leaderboard.budget_utilization_percent IS 'Percentage of budget used (lower is better)';

-- ========================================
-- SEED DATA
-- ========================================

-- Seed Data: Logan Area Markets
-- Description: Initial data for markets selling Indian produce in Logan/Brisbane area
-- Created: 2025-11-20

-- Insert Logan markets
INSERT INTO markets (
  name,
  type,
  description,
  suburb,
  address,
  lat,
  lng,
  day_of_week,
  start_time,
  end_time,
  facebook_url,
  has_indian_produce,
  is_active,
  last_verified
) VALUES
(
  'Global Food Markets',
  'market',
  'Multicultural fresh produce market with Asian, African and Indian vegetables like bitter melon, turmeric, okra, curry leaves and more. Popular Sunday market serving Logan''s diverse community.',
  'Logan Central',
  'Near Woodridge train station, Logan Central QLD 4114',
  -27.6347,
  153.1089,
  0, -- Sunday
  '06:00:00',
  '12:00:00',
  'https://www.facebook.com/profile.php?id=100087467967968',
  true,
  true,
  CURRENT_DATE
),
(
  'MC''s Indian & Island Food',
  'indian_grocery',
  'Large Indian and Island food supermarket carrying extensive range of Indian staples, fresh produce, spices, and specialty items. Known for competitive prices and authentic products.',
  'Kingston',
  'Kingston Rd, Logan Central QLD 4114',
  -27.6380,
  153.1065,
  NULL, -- Open daily
  '09:00:00',
  '19:00:00',
  NULL,
  true,
  true,
  CURRENT_DATE
),
(
  'Krishna Groceries N Spices',
  'indian_grocery',
  'Specialized Indian grocery store offering fresh vegetables, spices, sweets, snacks and religious items. Family-run business serving Logan''s Indian community since 2010.',
  'Logan Central',
  'Blackwood Rd, Logan Central QLD 4114',
  -27.6392,
  153.1072,
  NULL, -- Open daily
  '09:00:00',
  '20:00:00',
  NULL,
  true,
  true,
  CURRENT_DATE
),
(
  'Beenleigh Markets',
  'market',
  'Traditional farmers market with fresh local produce, some vendors carry Asian vegetables. Good for budget-conscious shoppers.',
  'Beenleigh',
  'Beenleigh Showgrounds, City Rd, Beenleigh QLD 4207',
  -27.7167,
  153.2042,
  6, -- Saturday
  '06:00:00',
  '11:00:00',
  NULL,
  false,
  true,
  CURRENT_DATE
),
(
  'Sunnybank Hills Shoppingtown',
  'general_grocery',
  'Major shopping center with Coles, Woolworths and several Asian grocers carrying Indian produce. About 30 min drive from Logan Central.',
  'Sunnybank Hills',
  'Calam Rd & Crest Rd, Sunnybank Hills QLD 4109',
  -27.5981,
  153.0514,
  NULL, -- Open daily
  '09:00:00',
  '21:00:00',
  NULL,
  true,
  true,
  CURRENT_DATE
);

-- Insert market tags for Global Food Markets
WITH global_market AS (
  SELECT id FROM markets WHERE name = 'Global Food Markets' LIMIT 1
)
INSERT INTO market_tags (market_id, tag)
SELECT id, tag FROM global_market
CROSS JOIN (VALUES
  ('bitter melon'),
  ('karela'),
  ('fresh turmeric'),
  ('Indian greens'),
  ('okra'),
  ('bhindi'),
  ('curry leaves'),
  ('kadi patta'),
  ('fresh coriander'),
  ('dhania'),
  ('green chilies'),
  ('hari mirch'),
  ('drumsticks'),
  ('bottle gourd'),
  ('lauki'),
  ('ridge gourd'),
  ('turai'),
  ('snake gourd'),
  ('Indian eggplant'),
  ('baingan'),
  ('cluster beans'),
  ('guar'),
  ('fenugreek leaves'),
  ('methi'),
  ('spinach'),
  ('palak'),
  ('mustard greens'),
  ('sarson'),
  ('fresh coconut'),
  ('nariyal'),
  ('ginger'),
  ('adrak'),
  ('garlic'),
  ('lehsun')
) AS tags(tag);

-- Insert market tags for MC's Indian & Island Food
WITH mcs_market AS (
  SELECT id FROM markets WHERE name = 'MC''s Indian & Island Food' LIMIT 1
)
INSERT INTO market_tags (market_id, tag)
SELECT id, tag FROM mcs_market
CROSS JOIN (VALUES
  ('bitter melon'),
  ('fresh turmeric'),
  ('curry leaves'),
  ('fresh coriander'),
  ('green chilies'),
  ('Indian eggplant'),
  ('okra'),
  ('spinach'),
  ('bottle gourd'),
  ('drumsticks'),
  ('fresh coconut'),
  ('ginger'),
  ('garlic'),
  ('taro root'),
  ('arbi'),
  ('plantains'),
  ('raw banana')
) AS tags(tag);

-- Insert market tags for Krishna Groceries N Spices
WITH krishna_market AS (
  SELECT id FROM markets WHERE name = 'Krishna Groceries N Spices' LIMIT 1
)
INSERT INTO market_tags (market_id, tag)
SELECT id, tag FROM krishna_market
CROSS JOIN (VALUES
  ('fresh coriander'),
  ('curry leaves'),
  ('green chilies'),
  ('bitter melon'),
  ('okra'),
  ('Indian eggplant'),
  ('bottle gourd'),
  ('fresh turmeric'),
  ('ginger'),
  ('garlic'),
  ('fresh coconut')
) AS tags(tag);

-- Add comment
COMMENT ON TABLE markets IS 'Seeded with Logan and Brisbane area markets selling Indian produce';
-- Seed Data: Indian Staple Produce Items
-- Description: Catalog of vegetables, spices, and herbs common in Indian cooking
-- Created: 2025-11-20

-- Insert produce items
INSERT INTO produce_items (
  name,
  name_variations,
  category,
  is_indian_staple,
  emoji,
  nutritional_notes,
  gi_rating
) VALUES
-- Vegetables
(
  'Bitter Melon',
  ARRAY['Karela', 'Bitter Gourd', 'Pavakkai'],
  'vegetable',
  true,
  '🥒',
  'Excellent for blood sugar control, rich in vitamins A and C. Contains compounds that help regulate glucose levels.',
  'low'
),
(
  'Okra',
  ARRAY['Bhindi', 'Lady Finger', 'Vendakkai'],
  'vegetable',
  true,
  '🫑',
  'High in fiber and vitamin C. The mucilage helps slow sugar absorption.',
  'low'
),
(
  'Bottle Gourd',
  ARRAY['Lauki', 'Doodhi', 'Sorakkai'],
  'vegetable',
  true,
  '🥒',
  'Very low in calories, high in water content. Great for hydration and weight management.',
  'low'
),
(
  'Ridge Gourd',
  ARRAY['Turai', 'Peerkangai', 'Jhinge'],
  'vegetable',
  true,
  '🥒',
  'Low calorie vegetable, good source of dietary fiber and vitamin C.',
  'low'
),
(
  'Snake Gourd',
  ARRAY['Chichinda', 'Pudalangai'],
  'vegetable',
  true,
  '🥒',
  'Low in calories, high in fiber. Helps with digestion.',
  'low'
),
(
  'Spinach',
  ARRAY['Palak', 'Keerai'],
  'vegetable',
  true,
  '🥬',
  'Rich in iron, vitamins A, C, and K. Excellent for diabetes management.',
  'low'
),
(
  'Mustard Greens',
  ARRAY['Sarson', 'Kadugu Keerai'],
  'vegetable',
  true,
  '🥬',
  'High in vitamins K, A, and C. Contains antioxidants.',
  'low'
),
(
  'Fenugreek Leaves',
  ARRAY['Methi', 'Vendhaya Keerai'],
  'herb',
  true,
  '🌿',
  'Known to help lower blood sugar levels. Rich in fiber and iron.',
  'low'
),
(
  'Indian Eggplant',
  ARRAY['Baingan', 'Brinjal', 'Kathirikkai'],
  'vegetable',
  true,
  '🍆',
  'Low in calories, good source of fiber and antioxidants.',
  'low'
),
(
  'Drumsticks',
  ARRAY['Moringa', 'Murungakkai'],
  'vegetable',
  true,
  '🥒',
  'Nutrient-dense superfood. Rich in vitamins, minerals, and antioxidants.',
  'low'
),
(
  'Cluster Beans',
  ARRAY['Guar', 'Kothavarangai'],
  'vegetable',
  true,
  '🫘',
  'High in fiber and protein. Good for diabetes management.',
  'low'
),
(
  'Taro Root',
  ARRAY['Arbi', 'Colocasia', 'Seppankizhangu'],
  'vegetable',
  true,
  '🥔',
  'Good source of fiber and resistant starch. Moderate glycemic index.',
  'medium'
),
-- Herbs and Aromatics
(
  'Fresh Coriander',
  ARRAY['Cilantro', 'Dhania', 'Kothamalli'],
  'herb',
  true,
  '🌿',
  'Rich in antioxidants, aids digestion. Essential in Indian cooking.',
  'low'
),
(
  'Curry Leaves',
  ARRAY['Kadi Patta', 'Kariveppilai'],
  'herb',
  true,
  '🍃',
  'Contains compounds that help regulate blood sugar. Rich in antioxidants.',
  'low'
),
(
  'Fresh Turmeric',
  ARRAY['Haldi', 'Manjal'],
  'spice',
  true,
  '🟡',
  'Powerful anti-inflammatory properties. Contains curcumin which aids blood sugar control.',
  'low'
),
(
  'Ginger',
  ARRAY['Adrak', 'Inji'],
  'spice',
  true,
  '🫚',
  'Anti-inflammatory, aids digestion. May help improve insulin sensitivity.',
  'low'
),
(
  'Garlic',
  ARRAY['Lehsun', 'Poondu'],
  'spice',
  true,
  '🧄',
  'May help lower blood sugar and cholesterol. Rich in antioxidants.',
  'low'
),
(
  'Green Chilies',
  ARRAY['Hari Mirch', 'Pacha Milagai'],
  'spice',
  true,
  '🌶️',
  'Contains capsaicin which may boost metabolism. Rich in vitamin C.',
  'low'
),
(
  'Fresh Coconut',
  ARRAY['Nariyal', 'Thengai'],
  'fruit',
  true,
  '🥥',
  'Good source of healthy fats. Moderate in calories, use in moderation.',
  'low'
),
-- Common vegetables also used in Indian cooking
(
  'Roma Tomatoes',
  ARRAY['Tamatar', 'Thakkali'],
  'vegetable',
  false,
  '🍅',
  'Low in calories, rich in lycopene and vitamin C.',
  'low'
),
(
  'Red Onions',
  ARRAY['Pyaz', 'Vengayam'],
  'vegetable',
  false,
  '🧅',
  'Contains quercetin which may help regulate blood sugar.',
  'low'
),
(
  'Cauliflower',
  ARRAY['Gobi', 'Cauliflower'],
  'vegetable',
  false,
  '🥦',
  'Low in calories, high in fiber and vitamin C.',
  'low'
),
(
  'Green Beans',
  ARRAY['French Beans', 'Beans'],
  'vegetable',
  false,
  '🫛',
  'Good source of fiber and protein. Low glycemic index.',
  'low'
),
(
  'Cabbage',
  ARRAY['Patta Gobi', 'Muttaikose'],
  'vegetable',
  false,
  '🥬',
  'Low in calories, high in fiber and vitamin C.',
  'low'
),
(
  'Carrots',
  ARRAY['Gajar', 'Carrot'],
  'vegetable',
  false,
  '🥕',
  'Rich in beta-carotene. Moderate glycemic index when cooked.',
  'medium'
),
(
  'Potatoes',
  ARRAY['Aloo', 'Urulaikizhangu'],
  'vegetable',
  false,
  '🥔',
  'High in starch. Use in moderation for diabetes management.',
  'high'
),
-- Fruits
(
  'Raw Banana',
  ARRAY['Green Banana', 'Plantain', 'Vazhakkai'],
  'fruit',
  true,
  '🍌',
  'Good source of resistant starch when unripe. Moderate glycemic index.',
  'medium'
);

-- Add comment
COMMENT ON TABLE produce_items IS 'Seeded with Indian staple vegetables, herbs, and spices common in Logan markets';
-- Seed Data: Indian Dietary and Health Resources
-- Description: Links to culturally appropriate resources for Logan/Brisbane Indian community
-- Created: 2025-11-20

INSERT INTO resources (
  title,
  organization,
  url,
  language,
  format,
  topic,
  is_local,
  target_audience,
  description,
  tags,
  last_verified
) VALUES
-- Metro South Health Resources
(
  'Food and cultural practices of the Indian community in Australia',
  'Metro South Health',
  'https://metrosouth.health.qld.gov.au/multicultural-health/cultural-profiles',
  'English',
  'web',
  'Indian food culture',
  true,
  'healthcare_providers',
  'Comprehensive guide on food practices of Indian people settled in Brisbane and Logan. Includes detailed notes on typical diets, religious considerations, and culturally appropriate education strategies for healthcare providers.',
  ARRAY['cultural', 'healthcare', 'community', 'education'],
  CURRENT_DATE
),
(
  'Indian food and cultural profile - Dietetic guide',
  'Queensland Health / Metro South',
  'https://www.health.qld.gov.au/__data/assets/pdf_file/0025/155887/indian_food.pdf',
  'English',
  'pdf',
  'healthy eating',
  true,
  'patients',
  'Official dietetic guide used by Logan and Brisbane dietitians when seeing Indian patients. Covers traditional foods, meal patterns, and healthy adaptations of Indian dishes.',
  ARRAY['diabetes', 'nutrition', 'cultural', 'meal-planning'],
  CURRENT_DATE
),
-- Diabetes-Specific Resources
(
  'Managing diabetes with Indian foods',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/living-with-diabetes/eating-well/indian-food',
  'English',
  'web',
  'diabetes management',
  false,
  'patients',
  'Practical guide to managing diabetes while enjoying traditional Indian foods. Includes tips on portion control, recipe modifications, and understanding carbohydrate content in Indian dishes.',
  ARRAY['diabetes', 'Indian cuisine', 'carb counting', 'meal-planning'],
  CURRENT_DATE
),
(
  'Healthy Indian cooking for diabetes',
  'Diabetes Queensland',
  'https://www.diabetesqld.org.au/living-with-diabetes/food-nutrition',
  'English',
  'web',
  'healthy cooking',
  true,
  'families',
  'Queensland-specific resource with tips on healthier Indian cooking methods, ingredient substitutions, and recipe ideas suitable for diabetes management.',
  ARRAY['cooking', 'recipes', 'diabetes', 'family-friendly'],
  CURRENT_DATE
),
-- Language-Specific Resources (when available)
(
  'मधुमेह और भारतीय भोजन (Diabetes and Indian Food in Hindi)',
  'Multicultural Health',
  'https://www.health.qld.gov.au/multicultural/health_info/diabetes',
  'Hindi',
  'pdf',
  'diabetes management',
  false,
  'patients',
  'Diabetes education materials in Hindi covering meal planning, blood sugar monitoring, and healthy Indian food choices.',
  ARRAY['Hindi', 'diabetes', 'translated'],
  CURRENT_DATE
),
-- Logan-Specific Services
(
  'Logan Hospital Diabetes Centre',
  'Metro South Health',
  'https://metrosouth.health.qld.gov.au/our-services/services/diabetes',
  'English',
  'web',
  'medical services',
  true,
  'patients',
  'Diabetes education and support services at Logan Hospital. Offers culturally appropriate education and has staff familiar with Indian dietary needs.',
  ARRAY['Logan', 'medical', 'support', 'education'],
  CURRENT_DATE
),
(
  'My Health for Life - Logan Program',
  'Queensland Health',
  'https://www.myhealthforlife.com.au',
  'English',
  'web',
  'lifestyle program',
  true,
  'patients',
  'Free healthy lifestyle program available to Logan residents at risk of type 2 diabetes. Includes personalized coaching on diet, exercise, and lifestyle changes with cultural sensitivity.',
  ARRAY['free', 'Logan', 'prevention', 'lifestyle', 'coaching'],
  CURRENT_DATE
),
-- Nutrition Education
(
  'Understanding the Glycemic Index - Indian Foods',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/living-with-diabetes/eating-well/gi',
  'English',
  'web',
  'carb counting',
  false,
  'general',
  'Guide to understanding glycemic index with specific reference to common Indian staples like rice, roti, dal, and vegetables.',
  ARRAY['GI', 'education', 'Indian staples', 'blood sugar'],
  CURRENT_DATE
),
(
  'Healthy plate method for Indian meals',
  'Queensland Health',
  'https://www.health.qld.gov.au/nutrition/healthy-plate',
  'English',
  'web',
  'healthy eating',
  true,
  'families',
  'Visual guide to building a balanced plate adapted for Indian meal patterns. Shows portion sizes for roti/rice, dal/curry, and vegetables.',
  ARRAY['portions', 'visual', 'meal-planning', 'family-friendly'],
  CURRENT_DATE
),
-- Community Support
(
  'Indian Australian Association of Queensland',
  'Community Organization',
  'https://www.iaq.org.au',
  'English',
  'web',
  'community support',
  true,
  'families',
  'Community organization supporting Indian families in Queensland. Often runs health awareness events and cooking workshops in Brisbane and Logan area.',
  ARRAY['community', 'cultural', 'events', 'support'],
  CURRENT_DATE
),
-- Recipe Resources
(
  'Healthy Indian recipes for diabetes',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/recipes',
  'English',
  'web',
  'recipes',
  false,
  'families',
  'Collection of diabetes-friendly Indian recipes with nutritional information and cooking tips.',
  ARRAY['recipes', 'cooking', 'diabetes-friendly', 'nutrition'],
  CURRENT_DATE
),
-- Video Resources
(
  'Indian cooking for diabetes - Video series',
  'Multicultural Health',
  'https://www.youtube.com/health',
  'English',
  'video',
  'healthy cooking',
  false,
  'families',
  'Video demonstrations of healthy Indian cooking techniques, ingredient substitutions, and meal preparation tips.',
  ARRAY['video', 'cooking', 'demonstrations', 'visual-learning'],
  CURRENT_DATE
);

-- Add comment
COMMENT ON TABLE resources IS 'Seeded with culturally appropriate Indian dietary and health resources for Logan/Brisbane community';
-- Seed Data: Sample Price Snapshots
-- Description: Sample prices for demonstration (to be replaced with real scraped data)
-- Created: 2025-11-20

-- Get market and produce IDs for reference
WITH market_ids AS (
  SELECT id, name FROM markets WHERE name IN ('Global Food Markets', 'MC''s Indian & Island Food', 'Krishna Groceries N Spices')
),
produce_ids AS (
  SELECT id, name FROM produce_items
)

-- Insert sample prices for this week
INSERT INTO price_snapshots (
  produce_item_id,
  market_id,
  price_per_kg,
  unit_type,
  snapshot_date,
  source_type,
  notes,
  verified
)
SELECT
  pi.id,
  mi.id,
  price_data.price,
  'kg',
  CURRENT_DATE - (random() * 3)::int, -- Random date within last 3 days
  'manual',
  'Sample data for testing',
  true
FROM (VALUES
  -- Global Food Markets prices (Sunday market - cheapest)
  ('Bitter Melon', 'Global Food Markets', 3.99),
  ('Okra', 'Global Food Markets', 4.99),
  ('Fresh Coriander', 'Global Food Markets', 2.50), -- per bunch, will handle in app
  ('Green Chilies', 'Global Food Markets', 6.99),
  ('Spinach', 'Global Food Markets', 3.49),
  ('Roma Tomatoes', 'Global Food Markets', 2.99),
  ('Fresh Turmeric', 'Global Food Markets', 8.99),
  ('Curry Leaves', 'Global Food Markets', 3.50), -- per bunch
  ('Bottle Gourd', 'Global Food Markets', 3.99),
  ('Indian Eggplant', 'Global Food Markets', 4.50),
  ('Ginger', 'Global Food Markets', 7.50),
  ('Garlic', 'Global Food Markets', 9.99),
  ('Ridge Gourd', 'Global Food Markets', 5.99),
  ('Drumsticks', 'Global Food Markets', 6.99),

  -- MC's Indian & Island Food prices (slightly higher but daily availability)
  ('Bitter Melon', 'MC''s Indian & Island Food', 4.50),
  ('Okra', 'MC''s Indian & Island Food', 5.50),
  ('Fresh Coriander', 'MC''s Indian & Island Food', 2.99),
  ('Green Chilies', 'MC''s Indian & Island Food', 7.50),
  ('Spinach', 'MC''s Indian & Island Food', 3.99),
  ('Roma Tomatoes', 'MC''s Indian & Island Food', 3.50),
  ('Fresh Turmeric', 'MC''s Indian & Island Food', 9.99),
  ('Curry Leaves', 'MC''s Indian & Island Food', 3.99),
  ('Bottle Gourd', 'MC''s Indian & Island Food', 4.50),
  ('Indian Eggplant', 'MC''s Indian & Island Food', 4.99),
  ('Taro Root', 'MC''s Indian & Island Food', 5.50),
  ('Fresh Coconut', 'MC''s Indian & Island Food', 2.50), -- per piece

  -- Krishna Groceries N Spices prices (premium quality)
  ('Bitter Melon', 'Krishna Groceries N Spices', 4.99),
  ('Okra', 'Krishna Groceries N Spices', 5.99),
  ('Fresh Coriander', 'Krishna Groceries N Spices', 3.50),
  ('Green Chilies', 'Krishna Groceries N Spices', 7.99),
  ('Curry Leaves', 'Krishna Groceries N Spices', 4.50),
  ('Fresh Turmeric', 'Krishna Groceries N Spices', 10.99),
  ('Ginger', 'Krishna Groceries N Spices', 8.50),
  ('Garlic', 'Krishna Groceries N Spices', 10.99),
  ('Fresh Coconut', 'Krishna Groceries N Spices', 2.99)
) AS price_data(produce_name, market_name, price)
JOIN produce_ids pi ON pi.name = price_data.produce_name
JOIN market_ids mi ON mi.name = price_data.market_name;

-- Add some historical prices (last week) to show price trends
WITH market_ids AS (
  SELECT id, name FROM markets WHERE name = 'Global Food Markets'
),
produce_ids AS (
  SELECT id, name FROM produce_items WHERE name IN ('Bitter Melon', 'Okra', 'Spinach')
)
INSERT INTO price_snapshots (
  produce_item_id,
  market_id,
  price_per_kg,
  unit_type,
  snapshot_date,
  source_type,
  notes,
  verified
)
SELECT
  pi.id,
  mi.id,
  price_data.price,
  'kg',
  CURRENT_DATE - 7, -- Last week
  'manual',
  'Historical price data',
  true
FROM (VALUES
  ('Bitter Melon', 4.50), -- Was more expensive last week
  ('Okra', 5.50),
  ('Spinach', 3.99)
) AS price_data(produce_name, price)
JOIN produce_ids pi ON pi.name = price_data.produce_name
CROSS JOIN market_ids mi;

-- Add comment
COMMENT ON TABLE price_snapshots IS 'Seeded with sample prices from Logan markets (to be updated with real Facebook-scraped data)';
