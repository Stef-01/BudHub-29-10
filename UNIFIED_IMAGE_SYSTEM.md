# Unified Image System - Direct File Loading

## Overview

The unified image system loads images directly from `public/dataset` folders, with no upload or database required. Images in these folders are immediately available to all users in both NutriServe game and Recipe Discovery Carousel.

## Architecture - Simple & Direct

### Priority Order (Fastest to Slowest)

1. **public/dataset/food-images/** (Direct file access - INSTANT)
   - Used by: NutriServe game + Recipe discovery carousel
   - No upload needed - just place files in folder
   - 37 images currently available

2. **public/dataset/recipe-images/** (Direct file access - INSTANT)
   - Used by: Recipe discovery carousel (for recipes without matching food)
   - No upload needed - just place files in folder

3. **SQLite database** (Legacy fallback only)
   - Used by: Recipes/foods that were previously uploaded via admin panel
   - Rarely needed now that direct file loading is implemented

## How It Works

### Simple File Access
```typescript
// Recipe carousel trying to load image for "rcp_chana_masala"
1. Check: /dataset/recipe-images/rcp_chana_masala.jpg → Not found
2. Strip prefix → Check: /dataset/food-images/chana_masala.jpg → ✓ FOUND!
3. Display image immediately (no database, no upload, no processing)
```

### ID Format & Matching
- **Recipe IDs**: `rcp_<name>` (e.g., `rcp_chana_masala`)
- **Food IDs**: `<name>` (e.g., `chana_masala`)

**Automatic Prefix Stripping:**
When a recipe image isn't found, the system automatically strips `rcp_` prefix and checks food images. This means:
- Recipe `rcp_chana_masala` automatically uses food image `chana_masala.jpg`
- No duplicate images needed!

### Supported File Extensions
The system automatically checks for: `.jpg`, `.jpeg`, `.png`, `.webp`

## Current Images Available

```bash
public/dataset/food-images/ (37 images):
├── aloo_gobi.jpg
├── baingan_bharta.jpg
├── bhindi_masala.jpg
├── butter_chicken.jpg
├── chana_masala.jpg
├── cheese_naan.jpg
├── chicken_curry.jpg
├── dal_makhani.jpg
├── dal_tadka.jpg
├── garlic_naan.jpg
├── lemon_rice.png
├── masala_dosa.jpg
├── masoor_dal.jpg
├── mixed_veg_curry.jpg
├── moong_dal_tadka.jpg
├── naan_plain.jpg
├── palak_dal.jpg
├── palak_paneer.jpg
├── paneer_butter_masala.jpg
├── paneer_tikka.jpg
├── pav_bhaji.jpg
├── puri.jpg
├── raita.jpg
├── rajma_masala.jpg
├── red_rice.jpg
├── samosa.jpg
├── tamarind_rice.jpg
├── toor_dal.jpg
├── upma.png
├── vada.jpg
├── veg_biryani.jpg
├── veg_pulao.jpg
├── vegetable_korma.jpg
├── white_rice.jpg
└── ... (and more)

public/dataset/recipe-images/:
└── (empty - recipes use food images when possible)
```

## Adding New Images - SUPER SIMPLE

### For Food Items (Appears in BOTH NutriServe + matching recipes)
```bash
# 1. Drop image into public/dataset/food-images/
cp new_dish.jpg public/dataset/food-images/

# 2. That's it! Image is now visible to everyone immediately
# - Shows in NutriServe game for food_id "new_dish"
# - Shows in Recipe carousel for recipe_id "rcp_new_dish"
```

### For Recipe-Only (No corresponding food item)
```bash
# 1. Drop image into public/dataset/recipe-images/
cp rcp_special_recipe.jpg public/dataset/recipe-images/

# 2. That's it! Image shows in recipe carousel immediately
```

### Naming Convention
**CRITICAL**: Filename must match the ID (food_id or recipe_id)

- **Food images**: `<food_id>.<ext>`
  - Example: `chana_masala.jpg` for food_id "chana_masala"

- **Recipe images**: `<recipe_id>.<ext>`
  - Example: `rcp_special_dish.jpg` for recipe_id "rcp_special_dish"

## Where Images Appear

### NutriServe Game Score Screen
- **Component**: `DishImageDisplay.tsx` → `foodImageDataset.ts` → `publicImageLoader.ts`
- **Flow**:
  1. Checks `/dataset/food-images/<food_id>.{jpg,png,webp}`
  2. If found, displays immediately
  3. Falls back to SVG visual if not found
- **Example**: Serving chana masala shows `chana_masala.jpg`

### Recipe Discovery Carousel
- **Component**: `RecipeCard.tsx` → `useRecipeImage` → `imageStoreService.ts` → `publicImageLoader.ts`
- **Flow**:
  1. Checks `/dataset/recipe-images/<recipe_id>.{jpg,png,webp}`
  2. If not found, strips `rcp_` prefix and checks `/dataset/food-images/`
  3. Falls back to recipe emoji if not found
- **Example**: Recipe "rcp_chana_masala" shows `chana_masala.jpg` from food-images

## Benefits

✅ **No Upload Needed** - Images work immediately
✅ **No Database** - Direct file access is faster
✅ **No Duplication** - Recipes automatically use food images when IDs match
✅ **Simple Deployment** - Just commit images to git
✅ **Universal Access** - All users see images immediately
✅ **Easy Updates** - Replace file to update image

## File Structure

```
public/dataset/
├── food-images/          # 37 images - Used by BOTH NutriServe + matching recipes
│   ├── chana_masala.jpg
│   ├── palak_dal.jpg
│   └── ... (35 more)
└── recipe-images/        # For recipes without matching food items
    └── (empty currently)

services/
├── publicImageLoader.ts      # NEW: Direct file loading
├── foodImageDataset.ts       # Updated: Checks public folder first
├── imageStoreService.ts      # Updated: Checks public folder first
└── sqliteStore.ts            # Legacy: Database fallback

components/
├── games/nutriserve-ui/
│   └── DishImageDisplay.tsx  # NutriServe food images
└── RecipeCard.tsx            # Recipe carousel images (simplified)

hooks/
└── useRecipeImage.ts         # Simplified: No AI generation
```

## Key Functions

### publicImageLoader.ts (NEW)
```typescript
getNutriServeFoodImageUrl(foodId)      // Get food image URL
getRecipeImageUrl(recipeId)             // Get recipe image URL
getRecipeImageUrlUnified(recipeId)      // Unified retrieval with prefix stripping
```

### foodImageDataset.ts (Updated)
```typescript
getFoodImage(foodId)  // Now checks public folder FIRST, then database
```

### imageStoreService.ts (Updated)
```typescript
getRecipeImageState(recipeId)  // Now checks public folder FIRST, then database
```

## Removed Features

❌ **AI Image Generation** - Removed completely
❌ **ImageGenerationContext** - Removed
❌ **ImageGenerationProgress** - Removed
❌ **useImageGenerationBatch** - Removed
❌ **Database Upload Requirement** - No longer needed (but still works as fallback)

## Migration Notes

- Existing database images still work (as fallback)
- No action needed for existing setups
- New images should just be placed in public/dataset folders
- Admin panel upload still works but is no longer required

## Examples

### Example 1: Adding a New Kerala Dish
```bash
# You have: kerala_parippu_curry.jpg
# Want it in: NutriServe game AND recipe carousel

# Step 1: Check the food_id in nutriServeFoodData.ts
# food_id: 'kerala_parippu_curry'

# Step 2: Rename and copy image
cp kerala_parippu_curry.jpg public/dataset/food-images/

# Step 3: Done! Image now shows:
# - NutriServe game for food "kerala_parippu_curry"
# - Recipe carousel for recipe "rcp_kerala_parippu_curry"
```

### Example 2: Recipe with Different Name
```bash
# You have: special_masala.jpg
# Recipe ID: 'rcp_garam_masala_special'

# Step 1: Rename to match recipe ID
mv special_masala.jpg rcp_garam_masala_special.jpg

# Step 2: Copy to recipe-images folder
cp rcp_garam_masala_special.jpg public/dataset/recipe-images/

# Step 3: Done! Shows in recipe carousel for "rcp_garam_masala_special"
```

## Troubleshooting

**Image not showing?**
1. Check filename matches ID exactly (case-sensitive!)
2. Check file extension is supported (.jpg, .png, .webp)
3. Check file is in correct folder (food-images vs recipe-images)
4. Check browser console for 404 errors
5. Hard refresh browser (Ctrl+Shift+R)

**Recipe not using food image?**
1. Verify recipe ID starts with `rcp_`
2. Verify food image exists without `rcp_` prefix
3. Example: Recipe `rcp_dosa` should match food `dosa.jpg`

## Performance

- **Direct file loading**: ~10-50ms (browser HTTP request)
- **Database loading**: ~50-200ms (SQLite query + blob conversion)
- **AI generation**: REMOVED (was 5-30 seconds)

Result: Images load **instantly** with direct file access!
