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
