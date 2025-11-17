-- Score Logging Schema for Health Intervention Study
-- Run this SQL in your Supabase SQL Editor

-- Tables
CREATE TABLE IF NOT EXISTS nutrient_challenge_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),
  metric VARCHAR(64) NOT NULL,
  challenge_text TEXT NOT NULL,
  correct_recipe_id VARCHAR(255) NOT NULL,
  correct_recipe_name TEXT,
  selected_recipe_id VARCHAR(255),
  selected_recipe_name TEXT,
  was_correct BOOLEAN NOT NULL,
  options JSONB,
  time_taken_seconds INT,
  points_earned INT NOT NULL,
  lives_remaining INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nca_user_id ON nutrient_challenge_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_nca_metric ON nutrient_challenge_attempts (metric);
CREATE INDEX IF NOT EXISTS idx_nca_was_correct ON nutrient_challenge_attempts (was_correct);
CREATE INDEX IF NOT EXISTS idx_nca_created_at ON nutrient_challenge_attempts (created_at);

-- nutrient_challenge_sessions
CREATE TABLE IF NOT EXISTS nutrient_challenge_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),
  final_score INT NOT NULL,
  questions_correct INT NOT NULL,
  questions_total INT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_ncs_user_id ON nutrient_challenge_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ncs_created_at ON nutrient_challenge_sessions (created_at);

-- nutriserve_round_attempts
CREATE TABLE IF NOT EXISTS nutriserve_round_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID NOT NULL,
  round_number INT NOT NULL,
  customer_name TEXT,
  customer_targets JSONB,
  is_diabetic BOOLEAN,
  foods_selected JSONB,
  meal_totals JSONB,
  round_score INT NOT NULL,
  max_possible_score INT DEFAULT 150,
  nutrient_feedback JSONB,
  nutrients_off_target TEXT[],
  xp_awarded VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nra_user_id ON nutriserve_round_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_nra_session_id ON nutriserve_round_attempts (session_id);
CREATE INDEX IF NOT EXISTS idx_nra_round_number ON nutriserve_round_attempts (round_number);
CREATE INDEX IF NOT EXISTS idx_nra_created_at ON nutriserve_round_attempts (created_at);

-- nutriserve_sessions
CREATE TABLE IF NOT EXISTS nutriserve_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),
  final_score INT NOT NULL,
  rounds_completed INT NOT NULL,
  max_rounds INT DEFAULT 20,
  average_round_score DECIMAL(5,2),
  perfect_rounds INT DEFAULT 0,
  protein_accuracy_avg DECIMAL(5,2),
  carbs_accuracy_avg DECIMAL(5,2),
  fat_accuracy_avg DECIMAL(5,2),
  fiber_accuracy_avg DECIMAL(5,2),
  sugar_accuracy_avg DECIMAL(5,2),
  sodium_accuracy_avg DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ns_user_id ON nutriserve_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ns_created_at ON nutriserve_sessions (created_at);

-- Views
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

-- Enable RLS
ALTER TABLE nutrient_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_challenge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutriserve_round_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutriserve_sessions ENABLE ROW LEVEL SECURITY;

-- Development policies (conditional creation using DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'nutrient_challenge_attempts'
      AND policyname = 'nutrient_challenge_attempts_dev'
  ) THEN
    EXECUTE $q$
      CREATE POLICY nutrient_challenge_attempts_dev
        ON nutrient_challenge_attempts
        FOR ALL
        USING (true);
    $q$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'nutrient_challenge_sessions'
      AND policyname = 'nutrient_challenge_sessions_dev'
  ) THEN
    EXECUTE $q$
      CREATE POLICY nutrient_challenge_sessions_dev
        ON nutrient_challenge_sessions
        FOR ALL
        USING (true);
    $q$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'nutriserve_round_attempts'
      AND policyname = 'nutriserve_round_attempts_dev'
  ) THEN
    EXECUTE $q$
      CREATE POLICY nutriserve_round_attempts_dev
        ON nutriserve_round_attempts
        FOR ALL
        USING (true);
    $q$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'nutriserve_sessions'
      AND policyname = 'nutriserve_sessions_dev'
  ) THEN
    EXECUTE $q$
      CREATE POLICY nutriserve_sessions_dev
        ON nutriserve_sessions
        FOR ALL
        USING (true);
    $q$;
  END IF;
END
$$;
