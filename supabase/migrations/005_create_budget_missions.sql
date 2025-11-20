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
CREATE TRIGGER update_budget_missions_updated_at
    BEFORE UPDATE ON budget_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
