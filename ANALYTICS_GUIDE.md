# Vercel Analytics Guide

## Overview

Vercel Analytics has been integrated into the BudHub application to track user engagement, game performance, and usage patterns. This complements the Supabase logging which focuses on detailed educational outcomes.

## What Gets Tracked

### Automatic Tracking

Vercel Analytics automatically tracks:
- **Page Views**: Every page/route visited
- **User Location**: Geographic data (anonymized)
- **Device Info**: Browser, OS, device type
- **Performance**: Page load times

### Custom Events

We've implemented custom event tracking for specific user actions:

#### 1. User Sessions
**Event:** `user_session`
- **When**: User visits the app
- **Data Captured**:
  - `userId`: User identifier from URL parameter (e.g., "dad", "guest")

#### 2. Game Events

**Event:** `game_start`
- **When**: User starts any game
- **Data Captured**:
  - `gameMode`: Which game ("nutrient_challenge", "nutriserve")
  - `userId`: User identifier

**Event:** `game_complete`
- **When**: User completes a game
- **Data Captured**:
  - `gameMode`: Which game
  - `score`: Final score achieved
  - `userId`: User identifier

**Event:** `game_exit`
- **When**: User exits a game (currently tracked but not fully implemented)
- **Data Captured**:
  - `gameMode`: Which game
  - `score`: Score when exited
  - `duration`: Time spent in seconds
  - `userId`: User identifier

#### 3. Nutrient Challenge Specific

**Event:** `nutrient_challenge_attempt`
- **When**: User answers a question
- **Data Captured**:
  - `metric`: Concept being tested ("high_protein", "high_fiber", "low_carb", "diabetic_friendly")
  - `wasCorrect`: Boolean indicating if answer was correct
  - `userId`: User identifier

#### 4. NutriServe Chef Specific

**Event:** `nutriserve_round`
- **When**: User completes a round
- **Data Captured**:
  - `roundNumber`: Which round (1-20)
  - `score`: Points earned for that round
  - `userId`: User identifier

#### 5. Admin Dashboard

**Event:** `admin_dashboard_access`
- **When**: Admin dashboard is accessed
- **Data Captured**:
  - `userId`: User being viewed

**Event:** `admin_tab_change`
- **When**: Switching between dashboard tabs
- **Data Captured**:
  - `tab`: Which tab ("overview", "nutrient-challenge", "nutriserve")
  - `userId`: User being viewed

## Accessing Analytics

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Navigate to "Analytics" tab
4. View metrics:
   - **Visitors**: Total and unique visitors
   - **Events**: Custom events tracked
   - **Top Pages**: Most visited pages
   - **Devices**: Device/browser breakdown
   - **Locations**: Geographic distribution

### Custom Events

To view custom events:
1. Go to Analytics → Events
2. Filter by event name (e.g., "game_start", "nutrient_challenge_attempt")
3. View event properties and trends
4. Export data for further analysis

## Key Metrics to Monitor

### Engagement Metrics

1. **Game Popularity**
   - Count of `game_start` events per game mode
   - Which game is played more?

2. **Completion Rates**
   - Ratio of `game_complete` to `game_start` events
   - Are users finishing games?

3. **Session Duration**
   - Time between `user_session` and last event
   - How long are users engaged?

### Performance Metrics

1. **Nutrient Challenge**
   - Accuracy rate from `nutrient_challenge_attempt` events
   - Which concepts have lower accuracy?

2. **NutriServe Chef**
   - Average score per round from `nutriserve_round` events
   - Are scores improving over rounds?

### User Tracking

1. **User Activity**
   - Sessions per user
   - Games played per user
   - Most active users

2. **Admin Dashboard Usage**
   - Frequency of `admin_dashboard_access`
   - Which tabs are viewed most?

## Analytics vs. Supabase Logging

### Vercel Analytics (Engagement)
- ✅ User sessions and page views
- ✅ Device and location data
- ✅ Performance metrics
- ✅ Real-time dashboard
- ✅ Quick overview of engagement
- ✅ A/B testing capabilities

### Supabase Logging (Educational Outcomes)
- ✅ Detailed game data (every answer, every food selected)
- ✅ Concept mastery tracking
- ✅ Problem nutrient identification
- ✅ Full session history
- ✅ Custom SQL queries for research
- ✅ Exportable for academic analysis

**Use Both Together:**
- Vercel Analytics → "Are users engaging with the app?"
- Supabase → "What are they learning and struggling with?"

## Example Queries

### How many times did Dad play each game?

**In Vercel Analytics:**
1. Go to Events → `game_start`
2. Filter by `userId: dad`
3. Group by `gameMode`

### What's Dad's accuracy on protein questions?

**In Vercel Analytics:**
1. Go to Events → `nutrient_challenge_attempt`
2. Filter by `userId: dad` AND `metric: high_protein`
3. Calculate percentage where `wasCorrect: true`

**Better in Supabase:**
```sql
SELECT
  COUNT(*) as total_attempts,
  SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) as correct,
  ROUND(100.0 * SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_pct
FROM nutrient_challenge_attempts
WHERE user_id = 'dad' AND metric = 'high_protein';
```

## Privacy & Data

### What's Tracked
- User IDs (from URL parameters, not personally identifiable)
- Game interactions and scores
- Page views and navigation
- Device/browser info (anonymized)
- Geographic location (city-level only)

### What's NOT Tracked
- Personal information
- Email addresses
- Payment information
- Keystrokes or form inputs
- Private/sensitive data

### GDPR Compliance
- Vercel Analytics is GDPR compliant
- No cookies required
- Users can opt out
- Data is anonymized
- Data retention: 90 days (configurable)

## Custom Event Development

To add new custom events:

1. **Add function to `lib/analytics.ts`:**
```typescript
export const trackNewEvent = (param1: string, param2: number) => {
  track('event_name', {
    param1,
    param2,
    userId: getUserId(),
  });
};
```

2. **Import and use in component:**
```typescript
import { trackNewEvent } from '../lib/analytics';

// In your component:
const handleAction = () => {
  // Your logic here
  trackNewEvent('value1', 123);
};
```

3. **View in Vercel Dashboard:**
- Events appear automatically after deployment
- No configuration needed
- View under Analytics → Events

## Troubleshooting

### Events not showing up

1. **Check deployment:**
   - Events only work in production
   - Deploy to Vercel to see events
   - Local development shows events in console only

2. **Verify integration:**
   - Check `<Analytics />` is in App.tsx
   - Verify import: `import { Analytics } from '@vercel/analytics/react'`

3. **Check event calls:**
   - Open browser console
   - Look for analytics logs
   - Verify event names match

### Incorrect data

1. **User IDs:**
   - Make sure URL has `?user=dad` parameter
   - Check `getUserId()` function returns correct value

2. **Event properties:**
   - Verify all parameters are passed correctly
   - Check for typos in property names

## Best Practices

1. **Consistent Naming:**
   - Use snake_case for event names
   - Be descriptive but concise
   - Group related events (e.g., `game_*`)

2. **Relevant Data:**
   - Only track what you'll use
   - Include userId for user-level analysis
   - Add context where helpful

3. **Privacy First:**
   - Don't track sensitive information
   - Use generic user IDs
   - Respect user privacy

4. **Regular Review:**
   - Check analytics weekly
   - Look for trends and patterns
   - Adjust tracking as needed

## Resources

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)
- [Privacy Policy](https://vercel.com/legal/privacy-policy)

## Support

If analytics aren't working:
1. Check this guide first
2. Verify deployment to Vercel
3. Check browser console for errors
4. Review Vercel Analytics dashboard
