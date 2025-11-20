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
