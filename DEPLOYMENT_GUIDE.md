# BudHub Supabase Deployment Guide
## Logan-Specific Features Database Setup

---

## 🎯 Overview

This guide will help you deploy the Logan-specific features database schema and seed data to your Supabase instance.

**Supabase Project:** `https://ghctyzaazxrnfdhakbix.supabase.co`

---

## 📋 Prerequisites

- Access to Supabase Dashboard (https://supabase.com/dashboard)
- Project: ghctyzaazxrnfdhakbix

---

## 🚀 Option 1: Quick Deploy (Recommended)

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/ghctyzaazxrnfdhakbix
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Complete Migration

1. Open the file: `supabase/complete_migration.sql`
2. Copy the entire contents (1423 lines)
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`

This single file contains:
- ✅ All 5 migrations (tables, views, functions)
- ✅ All 4 seed files (markets, produce, resources, sample prices)

### Step 3: Verify Deployment

Run this query in SQL Editor to verify all tables were created:

```sql
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'markets',
    'market_tags',
    'produce_items',
    'price_snapshots',
    'resources',
    'game_progress_weekly',
    'game_activity_daily',
    'budget_missions',
    'user_mission_attempts',
    'mission_leaderboard'
  )
ORDER BY tablename;
```

Expected result: **10 tables**

---

## 🔧 Option 2: Step-by-Step Deployment

If you prefer to run migrations individually:

### Migrations (Run in Order):

1. **001_create_markets_tables.sql** - Markets and market tags tables
2. **002_create_price_tracking.sql** - Produce items, price snapshots, views
3. **003_create_resources.sql** - Indian dietary resources table
4. **004_enhance_game_progress.sql** - Game progress tracking tables and functions
5. **005_create_budget_missions.sql** - Budget challenge missions tables

### Seeds (Run in Order):

1. **001_seed_logan_markets.sql** - 3 Logan markets (Global Food Markets, MC's Indian & Island Food, Krishna Groceries)
2. **002_seed_produce_items.sql** - 8 Indian staple produce items
3. **003_seed_resources.sql** - 12 Indian dietary resources
4. **004_seed_sample_prices.sql** - Sample price snapshots for testing

---

## 🔍 Verification Queries

### Check Data Counts:

```sql
-- Markets
SELECT COUNT(*) as market_count FROM markets;
-- Expected: 3 markets

-- Produce Items
SELECT COUNT(*) as produce_count FROM produce_items;
-- Expected: 8 items

-- Resources
SELECT COUNT(*) as resource_count FROM resources;
-- Expected: 12 resources

-- Price Snapshots
SELECT COUNT(*) as price_count FROM price_snapshots;
-- Expected: 24 prices (3 markets × 8 items)
```

### View Sample Data:

```sql
-- View markets with Indian produce
SELECT name, type, suburb, has_indian_produce
FROM markets
WHERE has_indian_produce = true;

-- View cheapest Indian staples
SELECT * FROM cheapest_prices
WHERE is_indian_staple = true
LIMIT 5;

-- View local resources
SELECT title, organization, format
FROM resources
WHERE is_local = true;
```

---

## 🎨 Row Level Security (RLS)

⚠️ **Important:** The current migrations do NOT enable RLS. For production:

1. Enable RLS on all tables:
```sql
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_attempts ENABLE ROW LEVEL SECURITY;
```

2. Create policies for public read access:
```sql
-- Example: Allow public read access to markets
CREATE POLICY "Public read access" ON markets
FOR SELECT USING (true);

-- Example: Allow public read access to cheapest_prices view
-- Views inherit RLS from base tables
```

3. Create policies for authenticated write access:
```sql
-- Example: Allow authenticated users to create mission attempts
CREATE POLICY "Authenticated users can create attempts" ON user_mission_attempts
FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

---

## 🧪 Test Frontend Integration

After deployment, test the homepage features:

1. **Cheapest Prices Section:** Should display real Logan market prices
2. **Markets List:** Should show 3 Logan markets with "Open Today" badges
3. **Indian Resources:** Should display 12 resources with language filters
4. **Game Progress Chart:** Ready for user data (currently shows demo data)
5. **Budget Challenge Card:** Should display featured mission or "Coming Soon"

### Test in Browser Console:

```javascript
// Test market data fetch
const { data: markets } = await window.supabase
  .from('markets')
  .select('*')
  .eq('has_indian_produce', true);
console.log('Markets:', markets);

// Test cheapest prices view
const { data: prices } = await window.supabase
  .from('cheapest_prices')
  .select('*')
  .eq('is_indian_staple', true)
  .limit(5);
console.log('Cheapest Prices:', prices);

// Test resources
const { data: resources } = await window.supabase
  .from('resources')
  .select('*')
  .eq('is_local', true);
console.log('Logan Resources:', resources);
```

---

## 🔄 Update Existing Data

### Add New Markets:

```sql
INSERT INTO markets (name, type, description, suburb, has_indian_produce, is_active)
VALUES (
  'New Market Name',
  'market',
  'Description here',
  'Logan suburb',
  true,
  true
);
```

### Add New Produce Items:

```sql
INSERT INTO produce_items (name, name_variations, category, is_indian_staple, emoji)
VALUES (
  'Eggplant',
  ARRAY['brinjal', 'baingan'],
  'vegetable',
  true,
  '🍆'
);
```

### Add Price Snapshots:

```sql
INSERT INTO price_snapshots (
  produce_item_id,
  market_id,
  price_per_kg,
  snapshot_date,
  source_type,
  verified
)
VALUES (
  (SELECT id FROM produce_items WHERE name = 'Bitter Melon'),
  (SELECT id FROM markets WHERE name = 'Global Food Markets'),
  3.99,
  CURRENT_DATE,
  'manual',
  true
);
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"
- Some tables may already exist from previous runs
- Safe to ignore if using `CREATE TABLE IF NOT EXISTS`
- Or drop existing tables first:
```sql
DROP TABLE IF EXISTS mission_leaderboard CASCADE;
DROP TABLE IF EXISTS user_mission_attempts CASCADE;
DROP TABLE IF EXISTS budget_missions CASCADE;
-- etc.
```

### Error: "permission denied"
- Make sure you're logged into the correct Supabase project
- Ensure you have admin/owner access to the project

### Data Not Showing in Frontend
1. Check browser console for errors
2. Verify Supabase anon key matches in `lib/supabase.ts`
3. Check RLS policies are allowing public read access
4. Verify tables have data using SQL queries above

---

## 📊 Database Schema Summary

### Core Tables (10):
1. **markets** - Logan area markets
2. **market_tags** - Market produce tags
3. **produce_items** - Indian staple vegetables/spices
4. **price_snapshots** - Historical price data
5. **resources** - Indian dietary resources
6. **game_progress_weekly** - Weekly game performance
7. **game_activity_daily** - Daily game activity
8. **budget_missions** - Budget challenge missions
9. **user_mission_attempts** - User mission progress
10. **mission_leaderboard** - Mission leaderboard rankings

### Views (2):
1. **latest_prices** - Most recent price for each produce/market combination
2. **cheapest_prices** - Cheapest price for each produce item across all markets

### Functions (2):
1. **calculate_weekly_progress()** - Aggregates game scores into weekly summaries
2. **get_current_streak()** - Calculates user's current game streak

---

## ✅ Next Steps After Deployment

1. **Test all homepage features** - Verify real data displays correctly
2. **Add more markets** - Expand beyond initial 3 Logan markets
3. **Update prices weekly** - Keep price data current
4. **Add more resources** - Expand Indian dietary resource library
5. **Create budget missions** - Add engaging challenges for users
6. **Enable RLS** - Secure tables with proper access policies
7. **Add price scraping** - Automate price updates from Facebook
8. **Create admin panel** - Build UI for price/market management

---

## 🎉 Success Criteria

After successful deployment:
- ✅ 10 tables created
- ✅ 2 views created
- ✅ 2 functions created
- ✅ 3 markets seeded
- ✅ 8 produce items seeded
- ✅ 12 resources seeded
- ✅ 24 sample prices seeded
- ✅ Frontend displays real data from Supabase
- ✅ No console errors in browser

---

**Questions or issues?** Check the Supabase logs in Dashboard → Logs → Postgres Logs
