-- Migration: Create Markets Tables
-- Description: Stores Logan area markets selling Indian produce
-- Created: 2025-11-20

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('market', 'indian_grocery', 'general_grocery')),
  description TEXT,
  suburb TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, ...
  start_time TIME,
  end_time TIME,
  website_url TEXT,
  facebook_url TEXT,
  has_indian_produce BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_verified DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market tags table (many-to-many relationship for produce types)
CREATE TABLE IF NOT EXISTS market_tags (
  id SERIAL PRIMARY KEY,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_day ON markets(day_of_week);
CREATE INDEX IF NOT EXISTS idx_markets_suburb ON markets(suburb);
CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_market_tags_tag ON market_tags(tag);
CREATE INDEX IF NOT EXISTS idx_market_tags_market ON market_tags(market_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to markets table
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to markets
CREATE POLICY "Markets are viewable by everyone"
  ON markets FOR SELECT
  USING (true);

-- Allow public read access to market tags
CREATE POLICY "Market tags are viewable by everyone"
  ON market_tags FOR SELECT
  USING (true);

-- Only authenticated users can insert/update markets (admin only)
CREATE POLICY "Only authenticated users can manage markets"
  ON markets FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage market tags"
  ON market_tags FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE markets IS 'Logan area markets and grocery stores selling Indian produce';
COMMENT ON TABLE market_tags IS 'Tags indicating what types of produce are available at each market';
COMMENT ON COLUMN markets.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN markets.type IS 'market=farmers market, indian_grocery=Indian specialty store, general_grocery=general supermarket with Indian section';
