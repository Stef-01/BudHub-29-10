-- Migration: Cookventure India analytics events
-- Description: Append-only event log for Cookventure (survey, swaps, "Make this", ratings,
--              scoring-weight experiment exposure) plus an aggregate-only read function.
-- Created: 2026-11-11
--
-- Access model: the app talks to Supabase with the anon key and has no auth, so anonymous
-- clients may INSERT events but cannot read, update or delete them. Dashboards read through
-- cookventure_insights(), which returns counts only (no user ids, no raw rows).

CREATE TABLE IF NOT EXISTS cookventure_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 64),
  session_id TEXT NOT NULL CHECK (char_length(session_id) BETWEEN 1 AND 64),
  event TEXT NOT NULL CHECK (event ~ '^[a-z_]{3,40}$'),
  variant TEXT CHECK (variant IS NULL OR char_length(variant) <= 32),
  props JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(props) <= 4096),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aggregates filter by event and time window; per-user lookups power repeat-usage metrics
CREATE INDEX IF NOT EXISTS idx_cookventure_events_event_time ON cookventure_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cookventure_events_user_time ON cookventure_events (user_id, created_at DESC);

ALTER TABLE cookventure_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log cookventure events" ON cookventure_events;
CREATE POLICY "Anyone can log cookventure events"
  ON cookventure_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policies: with RLS on, those are denied. Also drop the grants.
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON cookventure_events FROM anon, authenticated;

-- Aggregate-only insights for the admin dashboard
CREATE OR REPLACE FUNCTION cookventure_insights(since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days')
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'since', since,
    'events', (
      SELECT COALESCE(jsonb_object_agg(event, n), '{}'::jsonb)
      FROM (
        SELECT event, COUNT(*) AS n
        FROM public.cookventure_events
        WHERE created_at >= since
        GROUP BY event
      ) e
    ),
    'users', (
      SELECT COUNT(DISTINCT user_id) FROM public.cookventure_events WHERE created_at >= since
    ),
    'regions', (
      SELECT COALESCE(jsonb_object_agg(item, n), '{}'::jsonb)
      FROM (
        SELECT item, COUNT(*) AS n
        FROM public.cookventure_events, jsonb_array_elements_text(props -> 'regions') AS item
        WHERE event = 'survey_completed' AND created_at >= since
        GROUP BY item
      ) r
    ),
    'masalas', (
      SELECT COALESCE(jsonb_object_agg(item, n), '{}'::jsonb)
      FROM (
        SELECT item, COUNT(*) AS n
        FROM public.cookventure_events, jsonb_array_elements_text(props -> 'masalas') AS item
        WHERE event = 'survey_completed' AND created_at >= since
        GROUP BY item
      ) m
    ),
    'tadkas', (
      SELECT COALESCE(jsonb_object_agg(item, n), '{}'::jsonb)
      FROM (
        SELECT item, COUNT(*) AS n
        FROM public.cookventure_events, jsonb_array_elements_text(props -> 'tadkas') AS item
        WHERE event = 'survey_completed' AND created_at >= since
        GROUP BY item
      ) t
    ),
    'variants', (
      SELECT COALESCE(jsonb_object_agg(variant, stats), '{}'::jsonb)
      FROM (
        SELECT
          variant,
          jsonb_build_object(
            'results_shown', COUNT(*) FILTER (WHERE event = 'results_shown'),
            'details_opened', COUNT(*) FILTER (WHERE event = 'details_opened'),
            'make_this', COUNT(*) FILTER (WHERE event = 'make_this'),
            'ratings', COUNT(*) FILTER (WHERE event = 'recipe_rated'),
            'avg_rating', ROUND(AVG((props ->> 'stars')::NUMERIC) FILTER (WHERE event = 'recipe_rated'), 2),
            'mean_reciprocal_rank', ROUND(
              AVG(1.0 / NULLIF((props ->> 'rank')::NUMERIC, 0)) FILTER (WHERE event = 'details_opened'), 3
            )
          ) AS stats
        FROM public.cookventure_events
        WHERE created_at >= since AND variant IS NOT NULL
        GROUP BY variant
      ) v
    )
  );
$$;

REVOKE ALL ON FUNCTION cookventure_insights(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cookventure_insights(TIMESTAMPTZ) TO anon, authenticated;

COMMENT ON TABLE cookventure_events IS 'Cookventure India analytics: append-only from the client; read via cookventure_insights()';
