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
