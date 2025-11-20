-- Migration: Create Resources Table
-- Description: Indian dietary and health resources for Logan/Brisbane community
-- Created: 2025-11-20

-- Resources table (links to health guides, PDFs, videos)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT, -- 'Metro South Health', 'Queensland Health', 'Diabetes Australia'
  url TEXT NOT NULL,
  language TEXT DEFAULT 'English', -- 'English','Hindi','Punjabi','Tamil','Gujarati'
  format TEXT, -- 'pdf','web','video','infographic'
  topic TEXT, -- 'healthy eating','carb counting','Indian food culture','diabetes management'
  is_local BOOLEAN DEFAULT FALSE, -- true for Logan/Brisbane specific resources
  target_audience TEXT, -- 'patients','families','healthcare_providers','general'
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[], -- ['vegetarian','low-carb','cultural','family-friendly']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified DATE -- when the link was last checked
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_local ON resources(is_local);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic);
CREATE INDEX IF NOT EXISTS idx_resources_language ON resources(language);
CREATE INDEX IF NOT EXISTS idx_resources_format ON resources(format);
CREATE INDEX IF NOT EXISTS idx_resources_audience ON resources(target_audience);

-- GIN index for array searching (tags)
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);

-- Updated at trigger
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (true);

-- Only authenticated users can manage resources
CREATE POLICY "Only authenticated users can manage resources"
  ON resources FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE resources IS 'Indian dietary and health resources for Logan/Brisbane community';
COMMENT ON COLUMN resources.is_local IS 'TRUE for Logan/Brisbane specific resources, FALSE for general resources';
COMMENT ON COLUMN resources.language IS 'Primary language of the resource';
COMMENT ON COLUMN resources.format IS 'Type of resource: pdf, web page, video, or infographic';
COMMENT ON COLUMN resources.topic IS 'Main topic category for filtering';
COMMENT ON COLUMN resources.tags IS 'Additional tags for filtering (e.g., vegetarian, low-carb, cultural)';
