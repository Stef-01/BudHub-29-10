# Score Logging and Tracking Setup Guide

## Overview

This implementation provides comprehensive score logging and analytics for the health intervention study, tracking both the **Nutrient Challenge** and **NutriServe Chef** games with nuanced analysis by food type and nutritional concepts.

## Features

### 1. Detailed Score Tracking
- **Nutrient Challenge**: Tracks each question attempt with:
  - Which nutritional concept was being tested (high protein, high fiber, low carb, diabetic-friendly)
  - Question details and recipe options
  - User's answer vs. correct answer
  - Time taken and points earned
  - Lives remaining

- **NutriServe Chef**: Tracks each round with:
  - Customer requirements and targets
  - Foods selected and serving sizes
  - Nutritional feedback for each nutrient
  - Which specific nutrients were off-target
  - Round score and XP earned

### 2. Session Analytics
- Complete game sessions tracked with aggregate statistics
- Concept mastery analysis showing accuracy per nutritional concept
- Problem nutrient identification showing common areas of difficulty
- Performance trends over time

### 3. Admin Dashboard
- Real-time viewing of all game data
- Concept mastery visualization with accuracy percentages
- Recent attempts and sessions history
- Problem nutrients analysis
- Detailed drill-down into individual attempts

## Setup Instructions

### Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://ghctyzaazxrnfdhakbix.supabase.co

2. Navigate to the SQL Editor

3. Run the SQL script from `supabase-schema.sql`:
   ```bash
   # The file is located at: /home/user/BudHub-29-10/supabase-schema.sql
   ```

   This will create:
   - `nutrient_challenge_attempts` table
   - `nutrient_challenge_sessions` table
   - `nutriserve_round_attempts` table
   - `nutriserve_sessions` table
   - Helpful views for analysis:
     - `user_performance_summary`
     - `nutrient_challenge_concept_mastery`
     - `nutriserve_problem_nutrients`

### Step 2: User Identification

Users are identified via URL parameter. Share links with specific user IDs:

**For your dad:**
```
https://your-app-url.vercel.app/?user=dad
```

**For other users:**
```
https://your-app-url.vercel.app/?user=user123
```

**Guest (no tracking):**
```
https://your-app-url.vercel.app/
# (defaults to 'guest' user)
```

### Step 3: Access the Admin Dashboard

To view analytics and score data:

**View dad's data:**
```
https://your-app-url.vercel.app/?admin=true&user=dad
```

**View another user's data:**
```
https://your-app-url.vercel.app/?admin=true&user=user123
```

**View all users' aggregate data:**
```
https://your-app-url.vercel.app/?admin=true
```

## How It Works

### Data Flow

1. **User plays a game** with `?user=dad` in URL
2. **Each game action is logged**:
   - Nutrient Challenge: Every question attempt
   - NutriServe: Every round completion
3. **Data is saved to Supabase** in real-time
4. **Session summary is created** when game ends
5. **Admin can view analytics** via dashboard

### Automatic Tracking

No manual intervention needed! The tracking is automatic:

- ✅ Every question answered in Nutrient Challenge → logged
- ✅ Every round completed in NutriServe → logged
- ✅ Session statistics automatically calculated
- ✅ Concept mastery automatically updated
- ✅ Problem nutrients automatically identified

## Dashboard Features

### Overview Tab
- **Concept Mastery Cards**: Shows accuracy for each nutritional concept
  - Green (80%+): Mastered
  - Yellow (60-79%): Learning
  - Red (<60%): Needs work
- **Problem Nutrients**: Highlights which nutrients are frequently off-target

### Nutrient Challenge Tab
- **Recent Sessions Table**: All game sessions with scores and accuracy
- **Recent Attempts List**: Detailed view of each question
  - Shows question text
  - User's answer vs. correct answer
  - Points earned
  - Time remaining

### NutriServe Chef Tab
- **Recent Sessions Table**: All game sessions with rounds completed and average scores
- **Recent Round Attempts**: Detailed view of each round
  - Customer requirements
  - Foods selected
  - Nutrients that were off-target
  - Round score and XP

## Nuanced Analysis

### Nutrient Challenge Analysis

The system tracks which specific concepts the user struggles with:

```sql
-- Example query to see concept mastery
SELECT
  metric,
  accuracy_pct,
  attempts,
  correct
FROM nutrient_challenge_concept_mastery
WHERE user_id = 'dad'
ORDER BY accuracy_pct ASC;
```

**Example insights:**
- "User has 45% accuracy on high_fiber questions" → Needs more fiber education
- "User has 90% accuracy on diabetic_friendly" → Strong understanding of blood sugar impact

### NutriServe Chef Analysis

The system identifies which nutrients are consistently problematic:

```sql
-- Example query to see problem nutrients
SELECT
  nutrient,
  times_off_target,
  avg_score_when_off
FROM nutriserve_problem_nutrients
WHERE user_id = 'dad'
ORDER BY times_off_target DESC;
```

**Example insights:**
- "Protein off-target 15 times" → User may be under-portioning protein
- "Sodium off-target 12 times" → User may not recognize high-sodium foods

## Database Schema Overview

### Key Tables

**nutrient_challenge_attempts**
- Stores every single question attempt
- Includes full question context and options
- Tracks correctness and time performance

**nutrient_challenge_sessions**
- Aggregates session performance
- Breaks down accuracy by concept type
- Stores final score and question counts

**nutriserve_round_attempts**
- Stores every round with full meal composition
- Tracks nutrient feedback (which were good/high/low)
- Lists specific nutrients that were off-target

**nutriserve_sessions**
- Aggregates session performance
- Calculates average accuracy per nutrient
- Tracks perfect rounds and average scores

### Useful Views

**nutrient_challenge_concept_mastery**
```sql
-- Shows accuracy percentage for each concept per user
SELECT * FROM nutrient_challenge_concept_mastery WHERE user_id = 'dad';
```

**nutriserve_problem_nutrients**
```sql
-- Shows which nutrients are frequently off-target per user
SELECT * FROM nutriserve_problem_nutrients WHERE user_id = 'dad';
```

**user_performance_summary**
```sql
-- Overall performance across all games
SELECT * FROM user_performance_summary WHERE user_id = 'dad';
```

## Custom Queries for Research

### Track learning progression over time
```sql
SELECT
  DATE_TRUNC('day', created_at) as date,
  AVG(final_score) as avg_score,
  COUNT(*) as sessions
FROM nutrient_challenge_sessions
WHERE user_id = 'dad'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;
```

### Identify improvement in specific concepts
```sql
SELECT
  DATE_TRUNC('week', created_at) as week,
  metric,
  AVG(CASE WHEN was_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy_pct
FROM nutrient_challenge_attempts
WHERE user_id = 'dad'
GROUP BY DATE_TRUNC('week', created_at), metric
ORDER BY week, metric;
```

### Analyze food selection patterns
```sql
SELECT
  food->>'foodName' as food_name,
  food->>'category' as category,
  COUNT(*) as times_selected
FROM nutriserve_round_attempts,
     JSONB_ARRAY_ELEMENTS(foods_selected) as food
WHERE user_id = 'dad'
GROUP BY food->>'foodName', food->>'category'
ORDER BY times_selected DESC
LIMIT 20;
```

## Technical Details

### Technologies Used
- **Supabase**: Cloud PostgreSQL database
- **@supabase/supabase-js**: JavaScript client library
- **React**: Frontend framework
- **TypeScript**: Type-safe development

### Files Modified/Created
- `lib/supabase.ts` - Supabase client configuration
- `hooks/useUserId.ts` - User identification hook
- `services/supabaseLogger.ts` - Logging service functions
- `components/UnifiedNutrientGame.tsx` - Integrated logging into Nutrient Challenge
- `components/games/NutriServeGame.tsx` - Integrated logging into NutriServe Chef
- `components/AdminDashboard.tsx` - Analytics dashboard component
- `App.tsx` - Added admin dashboard routing
- `supabase-schema.sql` - Database schema definition

### Data Privacy
- Uses anon key (safe for browser usage)
- Row Level Security (RLS) enabled
- No authentication required (simple URL-based user IDs)
- Data is associated with user_id parameter only

## Troubleshooting

### No data showing in dashboard
1. Make sure the URL has `?user=dad` parameter when playing games
2. Check browser console for any Supabase errors
3. Verify database tables were created successfully
4. Check Supabase project is accessible

### Database connection errors
1. Verify Supabase project URL and API key in `lib/supabase.ts`
2. Check internet connection
3. Verify Supabase project is not paused

### Analytics not updating
1. Games must be played with `?user=dad` parameter
2. Session only logs when game ends (exit or game over)
3. Refresh dashboard page to see new data

## Future Enhancements

Potential additions:
- [ ] Export data to CSV/Excel for further analysis
- [ ] Email reports with weekly summaries
- [ ] Comparison across multiple users
- [ ] Predictive analytics for learning trajectories
- [ ] Automated coaching suggestions based on performance patterns
- [ ] Integration with other health metrics (if available)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase project status
3. Review this documentation
4. Check the Supabase dashboard for data

## Credits

Built for health intervention research study.
