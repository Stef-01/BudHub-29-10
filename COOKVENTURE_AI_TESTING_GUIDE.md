# Cookventure AI Features - Testing Guide

## Prerequisites
1. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
2. Start the development server
3. Navigate to the Cookventure game tab

## Test Scenarios

### 1. AI Recipe Generation
**Test Case 1.1: Generate from No Results**
- [ ] Complete Cookventure survey with very specific preferences that yield no matches
- [ ] Click "✨ Generate AI Recipe" button
- [ ] Verify loading state shows
- [ ] Verify recipe is generated with correct Cookventure metadata
- [ ] Confirm recipe is saved to cookbook automatically

**Test Case 1.2: Generate from Existing Results**
- [ ] Complete survey and see recipe results
- [ ] Click "✨ Generate New Recipe" button in header
- [ ] Verify new recipe matches your preferences (region, taste axes, dietary needs)
- [ ] Check that region_tags, masala_profiles, tadka_profiles, and taste_axes are populated

**Expected Behavior:**
- Generated recipes should match user preferences (regions, cravings, pantry, flavor profile)
- All Cookventure metadata fields should be populated
- Recipe should be immediately available in cookbook

### 2. Cookventure Chat Assistant
**Test Case 2.1: Open Chat**
- [ ] Progress past first Cookventure step (craving selection)
- [ ] Click floating 💬 chat button in bottom-right
- [ ] Verify chat opens with greeting message
- [ ] Test quick action buttons

**Test Case 2.2: Ask About Recipes**
- [ ] Ask: "Suggest a recipe for South Indian breakfast"
- [ ] Verify response is relevant to user preferences
- [ ] Check response is concise and conversational

**Test Case 2.3: Ask About Masalas**
- [ ] Ask: "What's sambar powder?"
- [ ] Ask: "What can I substitute for curry leaves?"
- [ ] Verify responses are educational and helpful

**Test Case 2.4: Context Awareness**
- [ ] Complete survey to results page
- [ ] Open chat
- [ ] Ask: "Tell me about my results"
- [ ] Verify chat knows about your preferences and matched recipes

**Expected Behavior:**
- Chat should remember conversation history
- Responses should be contextually relevant
- Quick actions should work on first click
- Chat should be minimizable and closable

### 3. Instacart Integration
**Test Case 3.1: Single Recipe to Instacart**
- [ ] Hover over a recipe card in Cookventure results
- [ ] Click "🛒 Shop on Instacart" button
- [ ] Verify new tab opens with Instacart search
- [ ] Check that ingredients are searchable on Instacart

**Test Case 3.2: Ingredient Parsing**
- [ ] Generate a recipe with AI
- [ ] Click Shop on Instacart
- [ ] Manually check that ingredients were parsed correctly (quantities, units, names)

**Test Case 3.3: Indian Ingredient Mappings**
- [ ] Find a recipe with Indian ingredients (curry leaves, jaggery, hing, etc.)
- [ ] Click Shop on Instacart
- [ ] Verify search terms are optimized (e.g., "fresh curry leaves" not just "curry leaves")

**Expected Behavior:**
- Instacart should open in a new tab
- Search should be for the first main ingredient
- No errors in console

### 4. Shopping List (Future Feature - Component Created)
**Note:** Shopping list component is built but not yet integrated into UI. To test:
- Import and add `<ShoppingList recipes={selectedRecipes} />` to a page
- [ ] Select multiple recipes
- [ ] Verify ingredients are consolidated (e.g., 2 recipes with rice = combined rice amount)
- [ ] Check ingredients are grouped by category
- [ ] Test "Copy" button copies to clipboard
- [ ] Test "Shop on Instacart" opens Instacart

## Error Handling Tests

### API Key Missing
- [ ] Remove API key from .env
- [ ] Try to generate recipe
- [ ] Verify friendly error message appears
- [ ] Try to use chat
- [ ] Verify error message appears

### Rate Limiting
- [ ] Generate multiple recipes quickly (5+ in a row)
- [ ] Verify error handling if rate limited
- [ ] Check that app doesn't crash

### Network Failures
- [ ] Disconnect internet
- [ ] Try to generate recipe
- [ ] Verify error message is user-friendly
- [ ] Reconnect and verify recovery

## Performance Tests
- [ ] Generate 3 recipes in succession - should complete in reasonable time
- [ ] Chat should respond within 2-3 seconds
- [ ] Instacart button click should be instant
- [ ] No memory leaks when opening/closing chat multiple times

## UI/UX Tests
- [ ] All buttons have hover states
- [ ] Loading spinners show during async operations
- [ ] Error messages are visible and dismissible
- [ ] Mobile responsiveness (if applicable)
- [ ] Chat doesn't obstruct important content
- [ ] Recipe cards remain flippable after adding Instacart button

## Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test on mobile device

## Known Limitations
1. **Instacart API**: No official public API, so we open search URLs rather than directly adding to cart
2. **Recipe Generation**: Costs API calls, so users should be mindful of usage
3. **Ingredient Parsing**: Regex-based, may not handle all formats perfectly
4. **Shopping List**: Component created but not yet integrated into main UI

## Suggested Enhancements (Phase 4+)
1. Add "Save" button functionality in FlippableRecipeCard (currently just console.log)
2. Integrate ShoppingList component into Cookbook or Results page
3. Add user feedback for successful recipe generation ("Recipe added to cookbook!")
4. Implement market price estimation using existing Logan market data
5. Add bulk recipe generation (generate 3-5 recipes at once)
6. Chat memory persistence across sessions
7. Voice input for chat on mobile
8. Export shopping list to PDF or email
9. Integration with local Indian grocery stores from markets database
10. Recipe modification via chat ("Make this recipe vegan")

## Deployment Checklist
- [ ] Add GEMINI_API_KEY to Vercel environment variables
- [ ] Test on Vercel preview deployment
- [ ] Monitor API usage and costs
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Add analytics for feature usage
- [ ] Document API rate limits for users

## Troubleshooting

### "API key not configured" error
- Check `.env` file has `GEMINI_API_KEY=your_key`
- Restart development server after adding key
- For Vercel: Add environment variable in project settings

### Chat not responding
- Check browser console for errors
- Verify API key is valid
- Check network tab for failed requests

### Instacart button doesn't work
- Check browser pop-up blocker settings
- Verify recipe has ingredients
- Check console for errors

### Recipe generation produces empty/invalid data
- Check Gemini API response in console
- Verify response schema matches expected format
- May need to adjust prompt or schema

---

## Success Criteria
✅ Users can generate personalized Indian recipes with AI
✅ Users can chat about Indian cuisine and get help
✅ Users can shop for recipe ingredients on Instacart
✅ All features work without crashing the app
✅ Error messages are user-friendly
✅ Performance is acceptable (recipes generate in <5 seconds)
