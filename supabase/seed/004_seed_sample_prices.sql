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
