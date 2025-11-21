# Testing Guide - Logan Features Integration

## 🎉 Deployment Successful!

Your Supabase migrations have been deployed successfully. Here's how to verify and test the new features.

---

## Step 1: Verify Database (In Supabase SQL Editor)

**Run:** `supabase/verify_deployment.sql`

Open this file and run all queries in Supabase SQL Editor to verify:
- ✅ 11 tables created
- ✅ 4 views accessible
- ✅ 3 Logan markets seeded
- ✅ 8 Indian produce items seeded
- ✅ 12 resources seeded
- ✅ 24 price snapshots seeded

**Quick Verification Query:**
```sql
SELECT
  'markets' as table_name, COUNT(*) as count FROM markets
UNION ALL
SELECT 'produce_items', COUNT(*) FROM produce_items
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'price_snapshots', COUNT(*) FROM price_snapshots;
```

**Expected Results:**
- markets: 3
- produce_items: 8
- resources: 12
- price_snapshots: 24

---

## Step 2: Test Homepage Features

### Start Development Server:
```bash
npm run dev
```

### Open Homepage Tab

Navigate to the Homepage (first tab in bottom navbar) and verify:

### 1. **Cheapest Prices Section**
   - Should display real prices from Logan markets
   - Example: "Bitter Melon $3.99/kg @ Global Food Markets"
   - Green "Indian Staple" badges
   - Blue "Low GI" badges
   - Prices should be current (not mock data)

### 2. **Local Markets List**
   - Should show 3 markets:
     - Global Food Markets (Sunday market)
     - MC's Indian & Island Food
     - Krishna Groceries N Spices
   - "Open Today" badge for current day
   - Correct day/time information

### 3. **Indian Dietary Resources**
   - Should display 12 resources
   - Purple section with "📚 Health Resources"
   - Resources from Metro South Health, Diabetes Queensland
   - Color-coded topic badges
   - "Logan/Brisbane" badges on local resources
   - Clickable links to external resources

### 4. **Budget Challenge Card**
   - Should show "Budget Challenges Coming Soon!"
   - (No missions created yet, this is expected)
   - Card is ready for future budget challenges

### 5. **Game Progress Chart**
   - Shows demo data (expected - no user games recorded in Supabase yet)
   - Will show real data once games are played and synced

---

## Step 3: Browser Console Checks

Open browser DevTools (F12) and check Console for:

### No Errors:
```
✅ No Supabase connection errors
✅ No 404 errors on data fetching
✅ No CORS errors
```

### Successful Data Fetching:
Look for console logs showing successful data loads:
```
[marketService] Fetched X markets
[priceService] Fetched X prices
[resourcesService] Fetched X resources
```

### Test Data Fetching Manually:

Run in browser console:
```javascript
// Test markets fetch
const { data: markets, error } = await window.supabase
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

**Expected:** All queries return data arrays (not null/undefined/error)

---

## Step 4: Network Tab Checks

In DevTools Network tab, verify:

### Supabase Requests:
- Requests to `ghctyzaazxrnfdhakbix.supabase.co`
- Status: 200 OK
- Response contains data arrays

### Tables Being Queried:
- ✅ `markets`
- ✅ `cheapest_prices` (view)
- ✅ `resources`
- ✅ `game_progress_weekly`
- ✅ `budget_missions`

---

## Step 5: Data Quality Checks

### Markets:
- **Global Food Markets**: Sunday 6am-12pm, Logan Central
- **MC's Indian & Island Food**: Daily, Kingston
- **Krishna Groceries N Spices**: Daily, Logan Central

### Produce Items (Sample):
- 🥒 Bitter Melon (Karela) - Indian Staple, Low GI
- 🌿 Fresh Coriander (Dhania) - Indian Staple
- 🫑 Okra (Bhindi) - Indian Staple
- 🌶️ Green Chilies (Hari Mirch) - Indian Staple
- 🥬 Spinach (Palak) - Indian Staple

### Resources (Sample):
- Metro South Health: Food and cultural practices
- Queensland Health: Indian food and cultural profile
- Diabetes Queensland: Healthy Indian cooking guides
- Multiple Hindi language materials

---

## Common Issues & Solutions

### Issue: "No price data available yet"
**Solution:** Check Supabase has 24 price snapshots seeded
```sql
SELECT COUNT(*) FROM price_snapshots;
```

### Issue: "No resources available yet"
**Solution:** Verify resources table has 12 rows
```sql
SELECT COUNT(*) FROM resources WHERE is_local = true;
```

### Issue: Markets not showing
**Solution:** Check markets table and RLS policies
```sql
SELECT * FROM markets WHERE has_indian_produce = true;
```

### Issue: CORS errors
**Solution:** Verify Supabase anon key matches in `lib/supabase.ts`

### Issue: Permission denied errors
**Solution:** Check RLS policies allow public read:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## Success Criteria

### ✅ Phase 4 Complete When:
1. Verification query returns correct counts
2. Homepage displays real Logan market data
3. All 3 markets show with correct info
4. Indian staples display with prices
5. Resources show from Metro South Health
6. No console errors
7. No network errors (200 OK on all Supabase requests)
8. Budget Challenge card displays (coming soon state)

### 🎉 If All Pass:
**Phase 4: Data Population - COMPLETE!**

---

## Next Steps After Verification

### Immediate:
1. ✅ Create a budget mission in Supabase for testing
2. ✅ Add more produce items as prices are collected
3. ✅ Update prices weekly from markets

### Short Term:
1. Build admin panel for price management
2. Add price history tracking
3. Create more budget challenge missions
4. Test game score syncing to Supabase

### Long Term:
1. Implement Facebook scraper for automated prices
2. Add price alert notifications
3. Build shopping list generator
4. Create community price reporting feature

---

## Support

**Issue?** Check:
1. Supabase SQL Editor logs for query errors
2. Browser console for JavaScript errors
3. Network tab for failed requests
4. `DEPLOYMENT_GUIDE.md` for RLS configuration

**Still stuck?** Verify tables exist:
```bash
npm run verify-db
```
(Note: This may show "fetch failed" due to Node environment, use SQL queries instead)

---

## 🎊 Congratulations!

You've successfully deployed the Logan-specific features database! The homepage now displays real market data, prices, and resources for the Indian community in Logan, Queensland.

**What's Live:**
- ✅ 3 Logan markets with Indian produce
- ✅ 8 Indian staple vegetables with pricing
- ✅ 12 Indian dietary resources
- ✅ 24 current price snapshots
- ✅ Complete game progress tracking infrastructure
- ✅ Budget challenge mission system (ready for challenges)

**What's Next:**
- Build admin tools for price updates
- Create budget challenge missions
- Collect more market price data
- Expand resource library
