# Recipe Images Dataset

This folder is for **Recipe Book and Discovery Panel images**.

## How to Use

1. **Name your images** exactly as the recipe ID (case-sensitive)
2. **Supported formats**: JPG, PNG, WebP
3. **Drop images here** and use the Admin panel to bulk upload

## Naming Convention

Use the recipe ID as the filename. Recipe IDs are typically lowercase with underscores or hyphens.

### ✅ Correct Examples:
```
masala_chai.jpg
palak_paneer.png
butter_chicken.jpg
chole_bhature.webp
dosa_sambar.jpg
idli_vada.png
pav_bhaji.jpg
paneer_tikka.jpg
vegetable_biryani.jpg
chicken_tikka_masala.jpg
```

### ❌ Wrong Examples:
```
Masala Chai.jpg         ← Has spaces
masala-chai.JPG         ← Wrong case extension
Butter Chicken.png      ← Has spaces, wrong case
IMG_5678.jpg           ← Not using recipe ID
recipe-001.png         ← Generic name
```

## How to Find Recipe IDs

Recipe IDs are stored in your database. They match the filenames you've labeled your dataset with.

**Common patterns:**
- Lowercase
- Words separated by underscores (`_`) or hyphens (`-`)
- No spaces
- ASCII characters only

**Examples from typical Indian recipe database:**
- Dal dishes: `dal_tadka`, `dal_makhani`, `masoor_dal`
- Paneer dishes: `palak_paneer`, `paneer_butter_masala`, `paneer_tikka`
- Rice dishes: `veg_biryani`, `lemon_rice`, `curd_rice`
- Breads: `naan`, `roti`, `paratha`, `garlic_naan`
- Breakfast: `poha`, `upma`, `idli`, `dosa`, `masala_dosa`
- Snacks: `samosa`, `pakora`, `vada_pav`, `pav_bhaji`
- Sweets: `gulab_jamun`, `jalebi`, `laddu`, `kheer`

## After Uploading

1. Go to Admin tab in the app
2. Click "Bulk Upload Recipe Images"
3. System will process all images from this folder
4. Images will appear in:
   - Recipe Book
   - Recipe Discovery Panel
   - Recipe Detail Modals
5. Available to all users immediately

## Image Guidelines

- **Minimum size**: 800x800px
- **Recommended**: Square or 4:3 aspect ratio
- **Quality**: High resolution (will be auto-resized)
- **Background**: Clean, well-lit
- **Content**: Show the finished dish
- **Plating**: Attractive presentation
- **Lighting**: Natural light preferred

## Database Connection

Once uploaded, images are permanently stored in SQLite and linked to recipe IDs. They will:
- Survive browser cache clears
- Be visible to all users
- Load instantly
- Work offline (after first load)
