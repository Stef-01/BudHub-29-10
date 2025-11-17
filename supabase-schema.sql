-- Score Logging Schema for Health Intervention Study
-- Run this SQL in your Supabase SQL Editor

-- Table for Nutrient Challenge Game detailed analytics
CREATE TABLE IF NOT EXISTS nutrient_challenge_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),

  -- Question details
  metric VARCHAR(64) NOT NULL, -- 'high_protein', 'high_fiber', 'low_carb', 'diabetic_friendly'
  challenge_text TEXT NOT NULL, -- e.g., "Pick the recipe with the HIGHEST protein content"

  -- Answer details
  correct_recipe_id VARCHAR(255) NOT NULL,
  correct_recipe_name TEXT,
  selected_recipe_id VARCHAR(255),
  selected_recipe_name TEXT,
  was_correct BOOLEAN NOT NULL,

  -- Options presented (stored as JSONB for analysis)
  options JSONB, -- Array of recipe objects

  -- Performance metrics
  time_taken_seconds INT, -- How many seconds remained when answered
  points_earned INT NOT NULL,
  lives_remaining INT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_nc_attempts_user_id ON nutrient_challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_attempts_metric ON nutrient_challenge_attempts(metric);
CREATE INDEX IF NOT EXISTS idx_nc_attempts_was_correct ON nutrient_challenge_attempts(was_correct);
CREATE INDEX IF NOT EXISTS idx_nc_attempts_created_at ON nutrient_challenge_attempts(created_at);

-- Table for Nutrient Challenge game sessions (overall game results)
CREATE TABLE IF NOT EXISTS nutrient_challenge_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),

  final_score INT NOT NULL,
  questions_correct INT NOT NULL,
  questions_total INT NOT NULL,

  -- Session breakdown by metric
  high_protein_correct INT DEFAULT 0,
  high_protein_total INT DEFAULT 0,
  high_fiber_correct INT DEFAULT 0,
  high_fiber_total INT DEFAULT 0,
  low_carb_correct INT DEFAULT 0,
  low_carb_total INT DEFAULT 0,
  diabetic_friendly_correct INT DEFAULT 0,
  diabetic_friendly_total INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_nc_sessions_user_id ON nutrient_challenge_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_sessions_created_at ON nutrient_challenge_sessions(created_at);

-- Table for NutriServe Chef round attempts
CREATE TABLE IF NOT EXISTS nutriserve_round_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID NOT NULL,

  -- Round details
  round_number INT NOT NULL,

  -- Customer requirements (stored as JSONB)
  customer_name TEXT,
  customer_targets JSONB, -- { calories: X, protein: Y, etc. }
  is_diabetic BOOLEAN,

  -- Player's meal composition
  foods_selected JSONB, -- Array of { foodName, grams, nutrients }
  meal_totals JSONB, -- { calories: X, protein: Y, etc. }

  -- Scoring and feedback
  round_score INT NOT NULL,
  max_possible_score INT DEFAULT 150,

  -- Detailed nutrient feedback (JSONB for nuanced analysis)
  nutrient_feedback JSONB, -- { protein: 'good', carbs: 'high', etc. }

  -- Which nutrients were off-target
  nutrients_off_target TEXT[], -- Array like ['carbs', 'fat']

  -- XP awarded
  xp_awarded VARCHAR(20), -- 'High', 'Medium', 'Low'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ns_rounds_user_id ON nutriserve_round_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_ns_rounds_session_id ON nutriserve_round_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_ns_rounds_round_number ON nutriserve_round_attempts(round_number);
CREATE INDEX IF NOT EXISTS idx_ns_rounds_created_at ON nutriserve_round_attempts(created_at);

-- Table for NutriServe Chef game sessions (overall game results)
CREATE TABLE IF NOT EXISTS nutriserve_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),

  final_score INT NOT NULL,
  rounds_completed INT NOT NULL,
  max_rounds INT DEFAULT 20,

  -- Performance summary
  average_round_score DECIMAL(5,2),
  perfect_rounds INT DEFAULT 0, -- Rounds with max score

  -- Nutrient analysis summary
  protein_accuracy_avg DECIMAL(5,2), -- Average accuracy for protein across rounds
  carbs_accuracy_avg DECIMAL(5,2),
  fat_accuracy_avg DECIMAL(5,2),
  fiber_accuracy_avg DECIMAL(5,2),
  sugar_accuracy_avg DECIMAL(5,2),
  sodium_accuracy_avg DECIMAL(5,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ns_sessions_user_id ON nutriserve_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ns_sessions_created_at ON nutriserve_sessions(created_at);

-- Create views for easy analysis

-- View: User performance summary across all games
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT
  user_id,
  COUNT(DISTINCT session_id) as total_sessions,
  AVG(final_score) as avg_score,
  MAX(final_score) as best_score,
  MAX(created_at) as last_played
FROM (
  SELECT user_id, session_id::text, final_score, created_at FROM nutrient_challenge_sessions
  UNION ALL
  SELECT user_id, session_id::text, final_score, created_at FROM nutriserve_sessions
) combined
GROUP BY user_id;

-- View: Nutrient Challenge concept mastery
CREATE OR REPLACE VIEW nutrient_challenge_concept_mastery AS
SELECT
  user_id,
  metric,
  COUNT(*) as attempts,
  SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) as correct,
  ROUND(100.0 * SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_pct,
  AVG(time_taken_seconds) as avg_time_taken
FROM nutrient_challenge_attempts
GROUP BY user_id, metric
ORDER BY user_id, accuracy_pct ASC;

-- View: NutriServe problem nutrients
CREATE OR REPLACE VIEW nutriserve_problem_nutrients AS
SELECT
  user_id,
  unnest(nutrients_off_target) as nutrient,
  COUNT(*) as times_off_target,
  AVG(round_score) as avg_score_when_off
FROM nutriserve_round_attempts
WHERE nutrients_off_target IS NOT NULL AND array_length(nutrients_off_target, 1) > 0
GROUP BY user_id, nutrient
ORDER BY user_id, times_off_target DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE nutrient_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_challenge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutriserve_round_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutriserve_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now, since using anon key)
-- In production, you'd want more restrictive policies
CREATE POLICY "Enable all access for now" ON nutrient_challenge_attempts FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON nutrient_challenge_sessions FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON nutriserve_round_attempts FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON nutriserve_sessions FOR ALL USING (true);

-- Grant access to anon role
GRANT ALL ON nutrient_challenge_attempts TO anon;
GRANT ALL ON nutrient_challenge_sessions TO anon;
GRANT ALL ON nutriserve_round_attempts TO anon;
GRANT ALL ON nutriserve_sessions TO anon;
GRANT USAGE ON SEQUENCE nutrient_challenge_attempts_id_seq TO anon;
GRANT USAGE ON SEQUENCE nutrient_challenge_sessions_id_seq TO anon;
GRANT USAGE ON SEQUENCE nutriserve_round_attempts_id_seq TO anon;
GRANT USAGE ON SEQUENCE nutriserve_sessions_id_seq TO anon;
