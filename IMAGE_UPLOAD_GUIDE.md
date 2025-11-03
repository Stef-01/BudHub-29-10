# 📸 Image Upload Guide for GardenVibe

This guide explains how to manually add food and recipe images to the database.

## 🗂️ GitHub Folders for Images

Drop your correctly named images into these folders:

### **Food Images** (for NutriServe Game)
```
📁 public/dataset/food-images/
```

### **Recipe Images** (for Recipe Book)
```
📁 public/dataset/recipe-images/
```

---

## 🎯 Method 1: Using the UI (Recommended)

### Step 1: Add Images to Folder
1. Clone your repository
2. Navigate to `public/dataset/food-images/` or `public/dataset/recipe-images/`
3. Drop your images with correct filenames (see naming conventions below)
4. Commit and push to GitHub

### Step 2: Upload via Admin Panel
1. Run the app: `npm run dev`
2. Navigate to the **Admin** tab
3. Choose upload type:
   - 🍽️ **Food Images** (for NutriServe game)
   - 📖 **Recipe Images** (for Recipe Book)
4. Click **"Select Folder"** button
5. Select your local folder containing the images
6. System will process and upload all images automatically

### What Happens During Upload
- ✅ Validates file types (JPG, PNG, WebP, GIF)
- ✅ Checks file size (max 10MB)
- ✅ Auto-generates 3 versions:
  - Original (full resolution)
  - Preview (800px)
  - Thumbnail (200px)
- ✅ Stores in SQLite database with content-addressing
- ✅ Makes images available to all users immediately

---

## 📝 Naming Conventions

### Food Images (40 items)

**File naming pattern:** `{food_id}.jpg`

#### Grains (5 items)
```
rice_white.jpg
rice_brown.jpg
rice_red.jpg
veg_biryani.jpg
lemon_rice.jpg
```

#### Lentils & Curries (9 items)
```
chana_masala.jpg
chickpea_curry.jpg
palak_dal.jpg
masoor_dal.jpg
moong_dal_tadka.jpg
rajma_masala.jpg
dal_tadka.jpg
paneer_butter_masala.jpg
chicken_curry.jpg
```

#### Vegetable Dishes (5 items)
```
baingan_bharta.jpg
bhindi_masala.jpg
palak_paneer.jpg
mixed_veg_curry.jpg
aloo_gobi.jpg
```

#### Breads & Breakfast (8 items)
```
roti.jpg
paratha.jpg
naan_plain.jpg
garlic_naan.jpg
cheese_naan.jpg
poha.jpg
upma.jpg
masala_dosa.jpg
```

#### Soups, Salads & Sides (3 items)
```
sambar.jpg
raita.jpg
sprouts_salad.jpg
```

#### Treats (5 items)
```
samosa.jpg
laddu.jpg
jalebi.jpg
dal_makhani.jpg
butter_chicken.jpg
```

### Recipe Images

**File naming pattern:** `{recipe_id}.jpg`

Recipe IDs are defined in your `constants.ts` file (RECIPE_CATALOG). Common examples:
```
masala_chai.jpg
palak_paneer.jpg
butter_chicken.jpg
chole_bhature.jpg
dosa_sambar.jpg
idli_vada.jpg
pav_bhaji.jpg
paneer_tikka.jpg
vegetable_biryani.jpg
chicken_tikka_masala.jpg
```

---

## 🔧 Method 2: Programmatic Upload via Code

If you want to add images programmatically, here's how:

### Import the Service
```typescript
import { seedFoodImages, seedRecipeImages } from './services/bulkImageSeed';
```

### Upload Food Images
```typescript
// Example: Upload food images programmatically
async function uploadFoodImagesFromFiles(files: File[]) {
  const result = await seedFoodImages(files, (progress) => {
    console.log(`Processing ${progress.itemId}: ${progress.current}/${progress.total}`);
  });

  console.log(`Success: ${result.success}, Failed: ${result.failed}`);
  return result;
}
```

### Upload Recipe Images
```typescript
// Example: Upload recipe images programmatically
async function uploadRecipeImagesFromFiles(files: File[]) {
  const result = await seedRecipeImages(files, (progress) => {
    console.log(`Processing ${progress.itemId}: ${progress.current}/${progress.total}`);
  });

  console.log(`Success: ${result.success}, Failed: ${result.failed}`);
  return result;
}
```

### Direct Database Insert (Advanced)
```typescript
import { sqliteStore } from './services/sqliteStore';
import { buildKey, resizeImage } from './services/imageProcessingService';

async function addSingleFoodImage(foodId: string, imageFile: File) {
  // Read file
  const blob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });

  // Generate content-addressed key
  const key = await buildKey(await blob.arrayBuffer());

  // Create resized versions
  const preview = await resizeImage(blob, 800, 0.88);
  const thumb = await resizeImage(blob, 200, 0.85);

  // Convert to Uint8Array
  const original = new Uint8Array(await blob.arrayBuffer());
  const previewArray = new Uint8Array(await preview.arrayBuffer());
  const thumbArray = new Uint8Array(await thumb.arrayBuffer());

  // Save to database
  await sqliteStore.saveFoodImage({
    food_id: foodId,
    image_key: key,
    original: original,
    preview: previewArray,
    thumb: thumbArray,
    created_at: new Date().toISOString(),
  });

  console.log(`✓ Saved image for ${foodId}`);
}
```

---

## ✅ Important Rules

### File Naming
- ❌ **No spaces**: `White Rice.jpg` → ✅ `rice_white.jpg`
- ❌ **Case sensitive**: `Rice_White.jpg` → ✅ `rice_white.jpg`
- ❌ **No dashes** (use underscores): `rice-white.jpg` → ✅ `rice_white.jpg`
- ❌ **Generic names**: `IMG_1234.jpg` → ✅ `rice_white.jpg`

### File Requirements
- **Formats**: JPG, PNG, WebP, GIF
- **Max size**: 10MB per file
- **Recommended**: 800x800px minimum, square aspect ratio
- **Quality**: High resolution (auto-resized during processing)

### Image Guidelines
- 📸 Clean, well-lit background
- 🍽️ Show the prepared dish clearly
- 💡 Natural lighting preferred
- 🎨 Attractive plating/presentation

---

## 📊 Upload Process Flow

```
1. Drop images in folder
   ↓
2. Images pushed to GitHub (optional)
   ↓
3. Open Admin panel in app
   ↓
4. Select upload type (Food/Recipe)
   ↓
5. Click "Select Folder"
   ↓
6. System validates files
   ↓
7. Processing (resize + hash)
   ↓
8. Store in SQLite database
   ↓
9. Images available immediately ✅
```

---

## 🗄️ Database Storage

### Food Images Table
```sql
CREATE TABLE IF NOT EXISTS food_images (
  food_id TEXT PRIMARY KEY,
  image_key TEXT NOT NULL,
  original BLOB NOT NULL,
  preview BLOB NOT NULL,
  thumb BLOB NOT NULL,
  created_at TEXT NOT NULL
);
```

### Recipe Images Table
```sql
CREATE TABLE IF NOT EXISTS recipe_images (
  recipe_id TEXT PRIMARY KEY,
  image_key TEXT NOT NULL,
  original BLOB NOT NULL,
  preview BLOB NOT NULL,
  thumb BLOB NOT NULL,
  created_at TEXT NOT NULL
);
```

Images are:
- ✅ Permanently stored in SQLite WASM (OPFS)
- ✅ Content-addressed (hash-based keys)
- ✅ Available offline
- ✅ Visible to all users
- ✅ Survive browser cache clears

---

## 🚀 Quick Start

### For Food Images:
```bash
# 1. Navigate to folder
cd public/dataset/food-images/

# 2. Add your images (e.g., rice_white.jpg, dal_tadka.jpg)

# 3. Run the app
npm run dev

# 4. Go to Admin tab → Select "Food Images" → Click "Select Folder"
```

### For Recipe Images:
```bash
# 1. Navigate to folder
cd public/dataset/recipe-images/

# 2. Add your images (e.g., palak_paneer.jpg, butter_chicken.jpg)

# 3. Run the app
npm run dev

# 4. Go to Admin tab → Select "Recipe Images" → Click "Select Folder"
```

---

## 📚 See Also

- `public/dataset/food-images/README.md` - Full food items list
- `public/dataset/recipe-images/README.md` - Recipe naming guide
- `services/bulkImageSeed.ts` - Upload implementation
- `components/admin/BulkImageUploader.tsx` - UI component
