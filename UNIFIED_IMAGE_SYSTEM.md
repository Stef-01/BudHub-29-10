# Unified Image System

## Overview

The unified image system prevents duplicate images between NutriServe game and Recipe Discovery Carousel by sharing images when recipe IDs match food IDs.

## Architecture

### Three Image Sources (Priority Order)

1. **food_images table** (NutriServe game foods)
   - Used by: NutriServe game score screen + Recipe discovery carousel
   - Access via: `foodImageDataset.ts` → `getFoodImage(foodId)`
   - Primary storage for food item images

2. **recipe_images table** (Dedicated recipe images)
   - Used by: Recipe discovery carousel (when recipe doesn't match a food)
   - Access via: `imageStoreService.ts` → `getRecipeImageState(recipeId)`
   - For recipes that don't have corresponding food items

3. **image_artifacts + image_aliases tables** (AI-generated)
   - Used by: Recipe discovery carousel (legacy/fallback)
   - Access via: `imageStoreService.ts` → `getRecipeImageState(recipeId)`
   - For AI-generated recipe images

## How Recipe-to-Food Matching Works

### ID Format
- **Recipe IDs**: `rcp_<name>` (e.g., `rcp_chana_masala`)
- **Food IDs**: `<name>` (e.g., `chana_masala`)

### Matching Logic
When loading a recipe image, `getRecipeImageState()` automatically:
1. Tries exact match: `recipeId` → `food_images.food_id`
2. Strips `rcp_` prefix and tries again: `chana_masala` → `food_images.food_id`
3. If match found, uses food image (no duplication!)
4. If not found, checks `recipe_images` table
5. Finally falls back to AI-generated images

### Example
```typescript
// Recipe in discovery carousel
recipeId: "rcp_chana_masala"

// Unified system checks:
1. getFoodImage("rcp_chana_masala") → null
2. getFoodImage("chana_masala") → ✓ Found!
3. Returns food image → No duplicate needed!
```

## Image Upload Locations

### Public Dataset Folders
```
public/dataset/
├── food-images/          # 37 images for NutriServe foods
│   ├── chana_masala.jpg
│   ├── palak_dal.jpg
│   └── ...
└── recipe-images/        # Empty (uses food images when possible)
    └── README.md
```

### Naming Convention
- **Food images**: `<food_id>.<ext>` (e.g., `chana_masala.jpg`)
- **Recipe images**: `<recipe_id>.<ext>` (e.g., `rcp_masala_dosa.jpg`)

### Upload Process
1. Place images in `public/dataset/food-images/` or `recipe-images/`
2. Use admin panel to bulk upload to SQLite
3. Images become available to all users instantly
4. Images persist in SQLite (OPFS storage)

## Display Components

### NutriServe Game Score Screen
- **Component**: `DishImageDisplay.tsx`
- **Flow**:
  1. Calls `getFoodImage(foodItemId)`
  2. If found, displays food image
  3. Falls back to SVG visual component
- **Example**: Displays chana masala photo after serving to customer

### Recipe Discovery Carousel
- **Component**: `RecipeCard.tsx` + `useRecipeImage` hook
- **Flow**:
  1. Calls `getRecipeImageState(recipeId)`
  2. Checks food_images first (with prefix stripping)
  3. Then recipe_images
  4. Finally AI-generated images
  5. Falls back to emoji
- **Example**: Recipe "rcp_chana_masala" shows same image as NutriServe food "chana_masala"

## Benefits

1. **No Duplication**: Recipes that match foods automatically share images
2. **Single Source**: Upload food image once, appears in both NutriServe game and recipe carousel
3. **Fallback Chain**: Multiple layers ensure images always load
4. **Automatic Mapping**: System handles ID format differences transparently

## Adding New Images

### For Food Items (Appears in BOTH NutriServe + matching recipes)
```bash
# 1. Add image to public/dataset/food-images/
public/dataset/food-images/new_dish.jpg

# 2. Use admin panel to upload
# 3. Image appears:
#    - NutriServe game for food_id "new_dish"
#    - Recipe carousel for recipe_id "rcp_new_dish"
```

### For Recipe-Only (No corresponding food item)
```bash
# 1. Add image to public/dataset/recipe-images/
public/dataset/recipe-images/rcp_special_recipe.jpg

# 2. Use admin panel to upload
# 3. Image appears only in recipe carousel
```

## Database Tables

### food_images
```sql
CREATE TABLE food_images (
    food_id TEXT PRIMARY KEY,      -- e.g., "chana_masala"
    image_key TEXT NOT NULL,        -- Content hash
    original BLOB NOT NULL,         -- Full size WebP
    preview BLOB NOT NULL,          -- 800px WebP
    thumb BLOB NOT NULL,            -- 200px WebP
    created_at TEXT NOT NULL
);
```

### recipe_images
```sql
CREATE TABLE recipe_images (
    recipe_id TEXT PRIMARY KEY,     -- e.g., "rcp_special_recipe"
    image_key TEXT NOT NULL,        -- Content hash
    original BLOB NOT NULL,         -- Full size WebP
    preview BLOB NOT NULL,          -- 800px WebP
    thumb BLOB NOT NULL,            -- 200px WebP
    created_at TEXT NOT NULL
);
```

## File Structure

```
services/
├── foodImageDataset.ts         # Food image management
├── imageStoreService.ts        # Unified recipe image retrieval
├── sqliteStore.ts              # Database operations
└── urlManager.ts               # Blob URL lifecycle management

components/
├── games/nutriserve-ui/
│   └── DishImageDisplay.tsx    # NutriServe food images
└── RecipeCard.tsx              # Recipe carousel images

hooks/
└── useRecipeImage.ts           # Recipe image loading hook
```

## Key Functions

### foodImageDataset.ts
```typescript
uploadFoodImage(foodId, imageFile)  // Upload food image
getFoodImage(foodId)                 // Retrieve food image
hasFoodImage(foodId)                 // Check if exists
```

### imageStoreService.ts
```typescript
getRecipeImageState(recipeId)        // Unified retrieval (checks food → recipe → AI)
saveImageArtifacts(key, recipeId, artifacts)  // Save AI-generated image
```

### sqliteStore.ts
```typescript
saveFoodImage(record)      // Save to food_images table
getFoodImage(foodId)       // Get from food_images table
saveRecipeImage(record)    // Save to recipe_images table
getRecipeImage(recipeId)   // Get from recipe_images table
```

## Migration Notes

- Existing AI-generated images in `image_artifacts` + `image_aliases` tables remain functional
- New uploads should use food_images or recipe_images tables
- Old system serves as final fallback
- All three systems coexist peacefully
