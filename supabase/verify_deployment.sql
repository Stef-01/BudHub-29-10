-- ========================================
-- VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify deployment
-- ========================================

-- 1. Check all tables exist
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'markets',
    'market_tags',
    'produce_items',
    'price_snapshots',
    'resources',
    'game_scores',
    'game_progress_weekly',
    'game_activity_daily',
    'budget_missions',
    'user_mission_attempts',
    'mission_leaderboard'
  )
ORDER BY tablename;
-- Expected: 11 rows


-- 2. Check all views exist
SELECT
  viewname,
  schemaname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('latest_prices', 'cheapest_prices', 'user_game_stats', 'active_missions_with_stats')
ORDER BY viewname;
-- Expected: 4 rows


-- 3. Check data counts
SELECT
  'markets' as table_name,
  COUNT(*) as row_count
FROM markets
UNION ALL
SELECT 'produce_items', COUNT(*) FROM produce_items
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'price_snapshots', COUNT(*) FROM price_snapshots
UNION ALL
SELECT 'market_tags', COUNT(*) FROM market_tags
UNION ALL
SELECT 'game_scores', COUNT(*) FROM game_scores
UNION ALL
SELECT 'budget_missions', COUNT(*) FROM budget_missions
ORDER BY table_name;
-- Expected:
-- budget_missions: 0 (ready for data)
-- game_scores: 0 (ready for data)
-- market_tags: 0 (ready for data)
-- markets: 3
-- price_snapshots: 24
-- produce_items: 8
-- resources: 12


-- 4. View sample markets
SELECT
  name,
  type,
  suburb,
  has_indian_produce,
  is_active
FROM markets
ORDER BY name;
-- Expected: 3 Logan markets


-- 5. View cheapest Indian staples (using the view)
SELECT
  produce_name,
  emoji,
  price_per_kg,
  market_name,
  is_indian_staple
FROM cheapest_prices
WHERE is_indian_staple = true
ORDER BY price_per_kg
LIMIT 5;
-- Expected: 5 cheapest Indian staples with prices


-- 6. View Indian resources
SELECT
  title,
  organization,
  format,
  is_local,
  language
FROM resources
WHERE is_local = true
ORDER BY title
LIMIT 5;
-- Expected: Logan/Brisbane specific resources


-- 7. Test RLS policies - should allow public read
SELECT COUNT(*) as market_count FROM markets;
SELECT COUNT(*) as produce_count FROM produce_items;
SELECT COUNT(*) as resource_count FROM resources;
-- All should return counts (not permission errors)


-- 8. Check functions exist
SELECT
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('calculate_weekly_progress', 'get_current_streak', 'update_updated_at_column')
ORDER BY proname;
-- Expected: 3 functions


-- ========================================
-- SUCCESS CRITERIA
-- ========================================
-- ✅ 11 tables created
-- ✅ 4 views created
-- ✅ 3 functions created
-- ✅ 3 markets seeded
-- ✅ 8 produce items seeded
-- ✅ 12 resources seeded
-- ✅ 24 price snapshots seeded
-- ✅ RLS policies allow public read access
-- ✅ No permission errors
