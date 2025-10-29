# Recipe Image Display Fixes - Instructions for Google AI Studio

## Overview
Fix 3 critical bugs preventing recipe images from displaying correctly in the BudHub application.

---

## 🔴 FIX #1: ManageRecipesModal - Display Images Instead of Emoji

**File:** `components/ManageRecipesModal.tsx`

**Line:** 44

**Current Code (WRONG):**
```tsx
<span className="text-3xl mr-4">{recipe.image.startsWith('http') ? '🍲' : recipe.image}</span>
```

**Replace With:**
```tsx
{recipe.image.startsWith('http') ? (
  <img
    src={recipe.image}
    alt={recipe.name}
    className="w-12 h-12 object-cover rounded-lg mr-4"
    onError={(e) => {
      const target = e.currentTarget;
      target.onerror = null;
      target.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.className = 'text-3xl mr-4';
      fallback.textContent = '🍲';
      target.parentElement?.appendChild(fallback);
    }}
  />
) : (
  <span className="text-3xl mr-4">{recipe.image}</span>
)}
```

**Exact Steps:**
1. Open `components/ManageRecipesModal.tsx`
2. Go to line 44
3. Find the line: `<span className="text-3xl mr-4">{recipe.image.startsWith('http') ? '🍲' : recipe.image}</span>`
4. Replace the ENTIRE line with the code block above
5. Save the file

---

## 🟠 FIX #2A: RecipeCard - Add Error Handling for Images

**File:** `components/RecipeCard.tsx`

**Line:** 23

**Current Code (INCOMPLETE):**
```tsx
<img src={recipe.image} alt={recipe.name} className="w-full h-40 object-cover" />
```

**Replace With:**
```tsx
<img
  src={recipe.image}
  alt={recipe.name}
  className="w-full h-40 object-cover"
  onError={(e) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.style.display = 'none';
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'w-full h-40 flex items-center justify-center bg-green-100';
    const fallbackSpan = document.createElement('span');
    fallbackSpan.className = 'text-5xl';
    fallbackSpan.textContent = '🍲';
    fallbackDiv.appendChild(fallbackSpan);
    target.parentElement?.appendChild(fallbackDiv);
  }}
/>
```

**Exact Steps:**
1. Open `components/RecipeCard.tsx`
2. Go to line 23
3. Find the line: `<img src={recipe.image} alt={recipe.name} className="w-full h-40 object-cover" />`
4. Replace it with the code block above
5. Save the file

---

## 🟠 FIX #2B: RecipeDetailModal - Add Error Handling for Images

**File:** `components/RecipeDetailModal.tsx`

**Line:** 52

**Current Code (INCOMPLETE):**
```tsx
<img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover rounded-t-2xl" />
```

**Replace With:**
```tsx
<img
  src={recipe.image}
  alt={recipe.name}
  className="w-full h-48 object-cover rounded-t-2xl"
  onError={(e) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.style.display = 'none';
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'w-full h-48 flex items-center justify-center bg-green-100 rounded-t-2xl';
    const fallbackSpan = document.createElement('span');
    fallbackSpan.className = 'text-6xl';
    fallbackSpan.textContent = '🍲';
    fallbackDiv.appendChild(fallbackSpan);
    target.parentElement?.appendChild(fallbackDiv);
  }}
/>
```

**Exact Steps:**
1. Open `components/RecipeDetailModal.tsx`
2. Go to line 52
3. Find the line: `<img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover rounded-t-2xl" />`
4. Replace it with the code block above
5. Save the file

---

## 🟡 FIX #3: RecipeModal - Add Image Validation and Preview

**File:** `components/RecipeModal.tsx`

**Lines:** 10-14 (add new state)

**Add after line 10:**
```tsx
const [imageError, setImageError] = useState<string>('');
```

**Current state declaration (lines 11-14):**
```tsx
const [name, setName] = useState('');
const [image, setImage] = useState('🍲'); // Default to emoji
const [ingredients, setIngredients] = useState('');
const [instructions, setInstructions] = useState('');
```

**Should become:**
```tsx
const [name, setName] = useState('');
const [image, setImage] = useState('🍲'); // Default to emoji
const [imageError, setImageError] = useState<string>('');
const [ingredients, setIngredients] = useState('');
const [instructions, setInstructions] = useState('');
```

---

**Lines:** 71-74 (replace image input section)

**Current Code:**
```tsx
<div>
  <label htmlFor="recipe-image" className="block text-sm font-medium text-gray-700">Image (URL or Emoji)</label>
  <input type="text" id="recipe-image" value={image} onChange={e => setImage(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
</div>
```

**Replace With:**
```tsx
<div>
  <label htmlFor="recipe-image" className="block text-sm font-medium text-gray-700">
    Image (URL or Emoji)
  </label>
  <input
    type="text"
    id="recipe-image"
    value={image}
    onChange={e => {
      const val = e.target.value;
      setImage(val);
      setImageError('');

      // Validate URL format if it's a URL
      if (val.startsWith('http')) {
        const validImageUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
        if (!validImageUrl.test(val)) {
          setImageError('⚠️ URL should end with .jpg, .png, .gif, .webp, or .svg');
        }
      }
    }}
    required
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
    placeholder="🍕 or https://example.com/image.jpg"
  />

  {/* Validation Error */}
  {imageError && (
    <p className="mt-1 text-xs text-amber-600">{imageError}</p>
  )}

  {/* Image Preview */}
  {image && image.startsWith('http') && !imageError && (
    <div className="mt-2 flex items-start gap-3">
      <img
        src={image}
        alt="Preview"
        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
        onError={() => {
          setImageError('❌ Failed to load image from this URL');
        }}
        onLoad={() => {
          setImageError('');
        }}
      />
      <p className="text-xs text-green-600 mt-1">✓ Preview loaded successfully</p>
    </div>
  )}

  {/* Emoji Preview */}
  {image && !image.startsWith('http') && (
    <div className="mt-2">
      <span className="text-4xl">{image}</span>
      <p className="text-xs text-gray-500 mt-1">Emoji preview</p>
    </div>
  )}
</div>
```

**Exact Steps:**
1. Open `components/RecipeModal.tsx`
2. After line 10 (`const RecipeModal: React.FC<RecipeModalProps> = ({ onClose, onAddRecipe }) => {`), add the new state: `const [imageError, setImageError] = useState<string>('');`
3. Find lines 71-74 (the image input div)
4. Replace the entire `<div>` block with the expanded version above
5. Save the file

---

## ✅ Verification Steps

After making all changes:

1. **Test ManageRecipesModal:**
   - Add a recipe with an image URL
   - Open "Manage My Recipes" modal
   - Verify the image displays (not just emoji 🍲)

2. **Test Error Handling:**
   - Add a recipe with a broken URL: `https://invalid-url.com/broken.jpg`
   - View the recipe card - should show 🍲 fallback instead of broken image icon

3. **Test Image Preview:**
   - Click "Add Recipe"
   - Enter a valid image URL like: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`
   - Verify preview appears below input
   - Try a broken URL - should show error message

4. **Test Emoji Input:**
   - Enter an emoji like 🍕 or 🥗
   - Should show emoji preview

---

## 📝 Summary of Changes

| File | Lines Changed | What Was Fixed |
|------|---------------|----------------|
| `ManageRecipesModal.tsx` | 44 | Changed emoji display to actual `<img>` tag with error handling |
| `RecipeCard.tsx` | 23 | Added `onError` handler to fallback to emoji |
| `RecipeDetailModal.tsx` | 52 | Added `onError` handler to fallback to emoji |
| `RecipeModal.tsx` | 10-14, 71-74 | Added validation, preview, and error messages |

---

## 🎯 Copy-Paste Prompt for Google AI Studio

```
I need you to fix recipe image display bugs in a React/TypeScript application.

Please make the following changes EXACTLY as specified:

1. In components/ManageRecipesModal.tsx at line 44, replace the span element that shows '🍲' for URLs with a proper img tag that shows the actual image
2. In components/RecipeCard.tsx at line 23, add onError handling to the img tag to fallback to emoji when images fail to load
3. In components/RecipeDetailModal.tsx at line 52, add onError handling to the img tag to fallback to emoji when images fail to load
4. In components/RecipeModal.tsx, add image URL validation, preview functionality, and error messaging for the image input field

For each file, please show me:
- The exact line number
- The current code
- The replacement code
- Why this fix is needed

Use the specifications in RECIPE_IMAGE_FIXES.md as your reference.
```

---

## 🚀 Quick Implementation Guide

If you want to implement these yourself:

1. Start with **FIX #1** (highest priority - completely broken)
2. Then do **FIX #2A and #2B** (prevents broken images)
3. Finally **FIX #3** (nice-to-have UX improvement)

Each fix is independent and can be applied separately.
