# Quick Start Guide - Score Tracking

## 🚀 Getting Started (3 Steps)

### Step 1: Set Up Database (5 minutes)

1. **Go to Supabase SQL Editor**:
   - Visit: https://supabase.com/dashboard/project/ghctyzaazxrnfdhakbix/sql

2. **Run the Database Setup**:
   - Open the file: `supabase-schema.sql` (in this project)
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - You should see: "Success. No rows returned"

### Step 2: Find Your App URL

**Option A: If deployed to Vercel**
1. Go to https://vercel.com/dashboard
2. Click your project name
3. Copy the URL shown at the top (e.g., `https://budhub-abc123.vercel.app`)

**Option B: Deploy now**
1. Run: `vercel` (or `npx vercel`)
2. Follow prompts
3. Copy the deployment URL

**Option C: Test locally first**
1. Run: `npm run dev`
2. Use: `http://localhost:5173`

### Step 3: Share the Links

**Replace `YOUR_URL` with your actual deployment URL**

#### For your dad to play games:
```
YOUR_URL/?user=dad
```

**Real example:** `https://budhub-abc123.vercel.app/?user=dad`
**Local example:** `http://localhost:5173/?user=dad`

#### For you to view analytics:
```
YOUR_URL/?admin=true&user=dad
```

**Real example:** `https://budhub-abc123.vercel.app/?admin=true&user=dad`
**Local example:** `http://localhost:5173/?admin=true&user=dad`

---

## 📱 URL Parameter Guide

| What you want | URL Pattern | Example |
|--------------|-------------|---------|
| Dad plays games | `YOUR_URL/?user=dad` | `https://myapp.vercel.app/?user=dad` |
| View dad's analytics | `YOUR_URL/?admin=true&user=dad` | `https://myapp.vercel.app/?admin=true&user=dad` |
| Someone else plays | `YOUR_URL/?user=mom` | `https://myapp.vercel.app/?user=mom` |
| View all users | `YOUR_URL/?admin=true` | `https://myapp.vercel.app/?admin=true` |
| Local testing (game) | `http://localhost:5173/?user=dad` | - |
| Local testing (admin) | `http://localhost:5173/?admin=true&user=dad` | - |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Database tables created (check Supabase Table Editor)
- [ ] App is deployed (or running locally)
- [ ] Can access game with `?user=dad` parameter
- [ ] Can access admin dashboard with `?admin=true&user=dad`
- [ ] Play a few rounds of Nutrient Challenge
- [ ] Play a few rounds of NutriServe Chef
- [ ] View analytics in admin dashboard
- [ ] See data appearing in Supabase tables

---

## 🐛 Troubleshooting

### "No data in admin dashboard"
- Make sure you played games with `?user=dad` in the URL
- Check browser console for errors (F12)
- Verify Supabase tables exist (check Table Editor)

### "Database connection error"
- Check internet connection
- Verify Supabase project is active (not paused)
- Check credentials in `lib/supabase.ts`

### "Can't find my Vercel URL"
- Go to: https://vercel.com/dashboard
- Click your project
- URL is at the top of the page

### "Testing locally"
- Run: `npm run dev`
- Visit: `http://localhost:5173/?user=dad`
- Admin: `http://localhost:5173/?admin=true&user=dad`

---

## 📊 What Gets Tracked?

### Nutrient Challenge
- ✅ Every question answered
- ✅ Which nutritional concept (protein, fiber, carbs, diabetic-friendly)
- ✅ Correct vs incorrect answers
- ✅ Time taken per question
- ✅ Accuracy by concept

### NutriServe Chef
- ✅ Every round completed
- ✅ Foods selected and portions
- ✅ Which nutrients were off-target
- ✅ Score per round
- ✅ Accuracy by nutrient type

---

## 📖 Full Documentation

For detailed information, see: `SCORE_TRACKING_SETUP.md`

---

## 💡 Pro Tips

1. **Bookmark the admin URL** for quick access to analytics
2. **Use different user IDs** to track multiple people (`?user=mom`, `?user=john`)
3. **Export data from Supabase** for Excel analysis (SQL tab → Export)
4. **Check analytics weekly** to track learning progress

---

## 🆘 Need Help?

1. Check this guide first
2. Read full documentation: `SCORE_TRACKING_SETUP.md`
3. Check browser console (F12) for error messages
4. Verify database setup in Supabase Table Editor
