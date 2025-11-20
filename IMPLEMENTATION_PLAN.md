# Homepage Enhancement Implementation Plan
## Logan-Specific Features Integration with Supabase

---

## 🎯 Overview

Transform the BudHub homepage into a comprehensive Logan health hub by integrating:
1. **Real market price tracking** for Indian staples
2. **Local Logan/Brisbane resources** for Indian community
3. **Game progress tracking** over time
4. **Budget-based nutrition challenges** using local prices

---

## 📊 Phase 1: Database Schema & Supabase Setup

### 1.1 Markets Table
Stores Logan area markets selling Indian produce.

```sql
-- Migration: 001_create_markets_tables.sql
create table markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('market','indian_grocery','general_grocery')),
  description text,
  suburb text,
  address text,
  lat double precision,
  lng double precision,
  day_of_week smallint,          -- 0=Sunday, 1=Monday, ...
  start_time time,
  end_time time,
  website_url text,
  facebook_url text,
  has_indian_produce boolean default false,
  is_active boolean default true,
  last_verified date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table market_tags (
  id serial primary key,
  market_id uuid references markets(id) on delete cascade,
  tag text not null                -- 'bitter melon','fresh turmeric','Indian greens'
);

create index idx_markets_day on markets(day_of_week);
create index idx_markets_suburb on markets(suburb);
create index idx_market_tags_tag on market_tags(tag);
```

### 1.2 Price Tracking Tables
Track produce prices over time at different markets.

```sql
-- Migration: 002_create_price_tracking.sql
create table produce_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_variations text[],         -- ['bitter melon','karela','bitter gourd']
  category text,                   -- 'vegetable','spice','grain'
  is_indian_staple boolean default false,
  emoji text,                      -- '🥒' for bitter melon
  nutritional_notes text,
  created_at timestamp with time zone default now()
);

create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  produce_item_id uuid references produce_items(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  price_per_kg numeric(10,2),
  price_per_unit numeric(10,2),
  unit_type text,                  -- 'kg','bunch','bag'
  snapshot_date date not null,
  source_type text,                -- 'facebook_scrape','manual','api'
  source_url text,
  notes text,
  verified boolean default false,
  created_at timestamp with time zone default now()
);

create index idx_price_snapshots_date on price_snapshots(snapshot_date desc);
create index idx_price_snapshots_produce on price_snapshots(produce_item_id);
create index idx_price_snapshots_market on price_snapshots(market_id);

-- View for latest prices
create view latest_prices as
select distinct on (p.produce_item_id, p.market_id)
  p.*,
  pi.name as produce_name,
  pi.emoji,
  pi.is_indian_staple,
  m.name as market_name,
  m.suburb,
  m.day_of_week
from price_snapshots p
join produce_items pi on p.produce_item_id = pi.id
join markets m on p.market_id = m.id
order by p.produce_item_id, p.market_id, p.snapshot_date desc;
```

### 1.3 Resources Table
Store links to Indian dietary resources.

```sql
-- Migration: 003_create_resources.sql
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,              -- 'Metro South Health','Queensland Health'
  url text not null,
  language text default 'English',
  format text,                     -- 'pdf','web','video'
  topic text,                      -- 'healthy eating','carb counting','Indian food culture'
  is_local boolean default false,  -- true for Logan/Brisbane specific
  target_audience text,            -- 'patients','families','healthcare_providers'
  description text,
  thumbnail_url text,
  created_at timestamp with time zone default now()
);

create index idx_resources_local on resources(is_local);
create index idx_resources_topic on resources(topic);
```

### 1.4 Game Progress Tracking Enhancement

```sql
-- Migration: 004_enhance_game_scores.sql
-- Add aggregated progress tracking
create table game_progress_weekly (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  week_start_date date not null,
  game_mode text not null,
  games_played int default 0,
  total_score int default 0,
  average_score numeric(10,2),
  best_score int,
  streak_days int default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, week_start_date, game_mode)
);

create index idx_game_progress_user_week on game_progress_weekly(user_id, week_start_date desc);
```

### 1.5 Budget Challenge Missions

```sql
-- Migration: 005_create_missions.sql
create table budget_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  budget_limit numeric(10,2) not null,
  duration_days int default 7,
  required_servings int,           -- minimum veg servings
  difficulty text check (difficulty in ('easy','medium','hard')),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table user_mission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  mission_id uuid references budget_missions(id),
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  total_spent numeric(10,2),
  veg_servings_achieved int,
  success boolean,
  meal_plan jsonb,                 -- store the user's meal plan
  shopping_list jsonb              -- items and prices
);

create index idx_user_missions on user_mission_attempts(user_id, started_at desc);
```

---

## 🏗️ Phase 2: Service Layer Implementation

### 2.1 Market Service (`services/marketService.ts`)
```typescript
// Fetch all Logan markets
export async function getLoganMarkets()

// Get markets open today
export async function getMarketsOpenToday()

// Get markets by produce item
export async function getMarketsByProduce(produceName: string)
```

### 2.2 Price Service (`services/priceService.ts`)
```typescript
// Get cheapest prices today
export async function getCheapestPricesToday(limit?: number)

// Get price history for an item
export async function getPriceHistory(produceItemId: string, days?: number)

// Add price snapshot (for admin/scraping)
export async function addPriceSnapshot(data: PriceSnapshotData)
```

### 2.3 Resources Service (`services/resourcesService.ts`)
```typescript
// Get Indian dietary resources
export async function getIndianDietaryResources()

// Get resources by topic
export async function getResourcesByTopic(topic: string)
```

### 2.4 Facebook Scraper Service (`services/facebookScraper.ts`)
```typescript
// Parse Facebook posts for price data
export async function scrapeFacebookPrices(pageUrl: string)

// Extract price from post text using regex/AI
export function extractPriceFromText(postText: string)
```

### 2.5 Game Progress Service (`services/gameProgressService.ts`)
```typescript
// Calculate weekly progress
export async function calculateWeeklyProgress(userId: string)

// Get progress over time
export async function getProgressOverTime(userId: string, weeks?: number)
```

---

## 🎨 Phase 3: Component Updates

### 3.1 Enhance Homepage with New Sections

#### A. "Cheapest Today" Section
Replace mock produce carousel with real data:

**Location:** `components/HomepageView.tsx` - Produce section

**Features:**
- Fetch from `latest_prices` view
- Color-code Indian staples (green border)
- Show actual prices from Logan markets
- Display market name and day open
- "Updated 2 hours ago" timestamp

**UI Elements:**
```tsx
<div className="produce-card indian-staple">
  <div className="produce-emoji">🥒</div>
  <h4>Bitter Melon (Karela)</h4>
  <div className="price-tag">$3.99/kg</div>
  <div className="market-info">
    <span>📍 Global Food Markets</span>
    <span>🗓️ Sunday 6am-12pm</span>
  </div>
  <span className="badge indian-staple">Indian Staple</span>
</div>
```

#### B. Indian Dietary Resources Section
New section after Health Programs:

**Component:** `components/IndianResourcesSection.tsx`

**Features:**
- Card grid of resources
- Filter by language (English, Hindi, Punjabi, Tamil)
- Icons for format (PDF, Web, Video)
- External links to Metro South Health, Queensland Health
- "Logan/Brisbane Specific" badge

**Example Resources:**
1. Food and cultural practices of the Indian community in Australia
2. Indian food and cultural profile dietetic guide
3. Diabetes management for Indian families
4. Healthy Indian cooking videos

#### C. Game Progress Chart Enhancement
Replace mock SVG with real data visualization:

**Location:** `components/HomepageView.tsx` - Progress section

**Features:**
- Fetch user's game scores from last 30 days
- Show multiple game modes as different colored lines
- Interactive tooltips showing exact scores
- Trend analysis ("↗️ +15% improvement")
- Milestone badges (10 games, 50 games, etc.)

#### D. Budget Challenge Card
New interactive card in Games section:

**Component:** `components/BudgetChallengeCard.tsx`

**Features:**
- "Plan a 7-day Indian menu under $50"
- Shows current week's cheapest produce
- Click to start challenge in Nutriserve
- Progress tracker if challenge active
- Leaderboard of successful attempts

---

## 🔄 Phase 4: Data Population & Seeding

### 4.1 Initial Market Data
```sql
-- Seed markets
INSERT INTO markets (name, type, description, suburb, address, day_of_week, start_time, end_time, facebook_url, has_indian_produce) VALUES
('Global Food Markets', 'market', 'Multicultural fresh produce market with Asian, African and Indian vegetables', 'Logan Central', 'Near Woodridge train station', 0, '06:00', '12:00', 'https://www.facebook.com/profile.php?id=100087467967968', true),
('MC''s Indian & Island Food', 'indian_grocery', 'Large Indian and Island food supermarket carrying Indian staples and produce', 'Kingston', 'Kingston Rd, Logan Central', null, '09:00', '19:00', null, true),
('Krishna Groceries N Spices', 'indian_grocery', 'Indian groceries, spices, sweets and snacks', 'Logan Central', 'Blackwood Rd, Logan Central', null, '09:00', '20:00', null, true);

-- Seed market tags
INSERT INTO market_tags (market_id, tag)
SELECT id, tag FROM markets m
CROSS JOIN (VALUES ('bitter melon'), ('fresh turmeric'), ('Indian greens'), ('okra'), ('curry leaves')) AS tags(tag)
WHERE m.name = 'Global Food Markets';
```

### 4.2 Initial Produce Items
```sql
INSERT INTO produce_items (name, name_variations, category, is_indian_staple, emoji) VALUES
('Bitter Melon', ARRAY['karela','bitter gourd'], 'vegetable', true, '🥒'),
('Fresh Coriander', ARRAY['cilantro','dhania'], 'herb', true, '🌿'),
('Okra', ARRAY['bhindi','lady finger'], 'vegetable', true, '🫑'),
('Green Chilies', ARRAY['hari mirch'], 'spice', true, '🌶️'),
('Fresh Turmeric', ARRAY['haldi'], 'spice', true, '🟡'),
('Curry Leaves', ARRAY['kadi patta'], 'herb', true, '🍃'),
('Spinach', ARRAY['palak'], 'vegetable', true, '🥬'),
('Roma Tomatoes', ARRAY['tamatar'], 'vegetable', false, '🍅');
```

### 4.3 Initial Resources
```sql
INSERT INTO resources (title, organization, url, format, topic, is_local, target_audience, description) VALUES
(
  'Food and cultural practices of the Indian community in Australia',
  'Metro South Health',
  'https://metrosouth.health.qld.gov.au/multicultural-health/cultural-profiles',
  'web',
  'Indian food culture',
  true,
  'healthcare_providers',
  'Metro South Health profile on food practices of Indian people settled in Brisbane, with detailed notes on typical diets and culturally appropriate education strategies'
),
(
  'Indian food and cultural profile dietetic guide',
  'Queensland Health',
  'https://www.health.qld.gov.au/__data/assets/pdf_file/0025/155887/indian_food.pdf',
  'pdf',
  'healthy eating',
  true,
  'patients',
  'Queensland Health / Metro South PDF used by Logan and Brisbane dietitians when seeing Indian patients'
);
```

---

## 📱 Phase 5: Integration & UI Updates

### 5.1 Homepage Data Flow
```typescript
// In HomepageView.tsx
const { cheapestPrices, loading: pricesLoading } = usePrices();
const { loganMarkets, loading: marketsLoading } = useMarkets();
const { indianResources, loading: resourcesLoading } = useResources();
const { weeklyProgress } = useGameProgress(userId);
const { activeMission } = useBudgetMissions(userId);
```

### 5.2 Real-time Price Updates
- Fetch prices on homepage load
- Show "Last updated" timestamp
- Refresh button to fetch latest
- Cache for 4 hours in IndexedDB

### 5.3 Admin Panel Enhancements
Add price management to admin dashboard:
- Manual price entry form
- View/edit markets
- Trigger Facebook scraper
- Approve scraped prices

---

## 🚀 Phase 6: Advanced Features

### 6.1 Price Alert System
```sql
create table price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  produce_item_id uuid references produce_items(id),
  target_price numeric(10,2),
  is_active boolean default true
);
```

### 6.2 Shopping List Generator
Based on selected recipes, generate shopping list with:
- Cheapest market for each ingredient
- Total estimated cost
- Map showing market locations

### 6.3 Nutriserve Budget Mode
- New game mode: "Budget Chef Challenge"
- Given $X budget and week's prices
- User must create balanced Indian meals
- Scoring based on nutrition + staying under budget

---

## 📋 Implementation Order

### Week 1: Database & Services
1. ✅ Create Supabase migrations
2. ✅ Seed initial market data
3. ✅ Build service layer
4. ✅ Test API endpoints

### Week 2: Price Integration
1. ✅ Build price scraper (manual entry first, automation later)
2. ✅ Create "Cheapest Today" component
3. ✅ Replace mock produce data
4. ✅ Add price history tracking

### Week 3: Resources & Progress
1. ✅ Seed resources data
2. ✅ Build Indian Resources section
3. ✅ Enhance game progress chart
4. ✅ Add weekly summaries

### Week 4: Budget Challenges
1. ✅ Create budget missions system
2. ✅ Build challenge UI
3. ✅ Integrate with Nutriserve
4. ✅ Add leaderboard

---

## 🎯 Success Metrics

### User Engagement
- % of users checking "Cheapest Today" section
- Click-through rate on resources
- Budget challenge completion rate
- Return visits to homepage

### Data Quality
- Price snapshot freshness (< 7 days old)
- Number of active markets tracked
- Resource library size

### Game Engagement
- Increase in Nutriserve plays
- Budget challenge attempts
- Improved nutrition scores

---

## 🔐 Security Considerations

1. **Row Level Security** on all Supabase tables
2. **API rate limiting** for scraping
3. **Price verification** before display
4. **User data privacy** for mission attempts

---

## 🌐 Future Enhancements

- **Multi-language support** (Hindi, Punjabi, Tamil)
- **SMS/email price alerts**
- **Recipe suggestions** based on cheapest ingredients
- **Community price reporting** (crowdsourced)
- **Partnership with markets** for official price feeds
- **Seasonal produce calendar** for Logan region
- **Nutrition facts** for Indian dishes
- **Cultural event calendar** (Diwali recipes, etc.)

---

## 📞 External Resources to Integrate

1. **Metro South Health Multicultural Resources**
   - https://metrosouth.health.qld.gov.au/multicultural-health

2. **Queensland Health Indian Food Guide**
   - https://www.health.qld.gov.au/__data/assets/pdf_file/0025/155887/indian_food.pdf

3. **Global Food Markets Facebook**
   - https://www.facebook.com/profile.php?id=100087467967968

4. **Diabetes Queensland**
   - https://www.diabetesqld.org.au/

---

This plan transforms BudHub from a generic health app into a **Logan-specific Indian community health platform** with real local market data, culturally appropriate resources, and gamified budget challenges based on actual prices. 🌱❤️
