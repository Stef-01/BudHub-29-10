# NutriServe Feature Plan: Dish Photo on Score Screen + Image Storage Verification

## Executive Summary

**Goal 1**: Display the requested dish's recipe image on the NutriServe result/scoring page when the customer receives their plate.

**Goal 2**: Verify and ensure the image storage database is working properly so AI-generated images persist permanently and don't regenerate.

---

## Part 1: Display Dish Photo on NutriServe Score Screen

### Current State Analysis

#### NutriServe Game Flow
1. **Game Start** (`NutriServeGame.tsx`):
   - Customer is generated with a `CustomerOrder`
   - Order contains `description`, `plateSize`, `diabetesMode`, `required_items`
   - Example: `required_items: ['chana_masala']`

2. **Plate Building**:
   - Player adds food items to the plate via `FoodLibrary`
   - Each food item is a `FoodItem` with visual, nutrients, and metadata

3. **Result/Scoring** (`ResultModal.tsx`):
   - Currently shows:
     - Character expression (happy/sad)
     - Score
     - Feedback on nutrients
     - Next button
   - **Missing**: Image of the requested main dish

#### Food Data Structure
- `FOOD_DATA` in `nutriserveFoodData.ts` contains all food items
- Each has an `id`, `label`, `visual` (React component), and `nutrients_per_100g`
- Food items are NOT tied to Recipe objects—they are separate game entities

#### Recipe Image Database
- Recipe images are stored in IndexedDB via `imageStoreService.ts`
- Stored by `recipeId` (e.g., `'rcp_chana_masala'`)
- Currently used by `RecipeCard`, `RecipeDetailModal`, and game cards

### Challenge: Mapping Food Items to Recipe Images

The NutriServe game uses **`FoodItem`** objects (from `FOOD_DATA`), but the image database stores **`Recipe`** objects. We need a bridge.

**Solution Approach**: Create a mapping system that links food item IDs to recipe IDs.

```typescript
// Map food item IDs to recipe IDs
const FOOD_TO_RECIPE_MAP: Record<string, string> = {
  'chana_masala': 'rcp_chana_masala',
  'palak_dal': 'rcp_palak_dal',
  'bhindi_masala': 'rcp_bhindi_masala',
  'baingan_bharta': 'rcp_baingan_bharta',
  // ... etc
};
```

### Implementation Steps

#### Step 1: Create Food-to-Recipe Mapping

**File**: `services/nutriserveFoodMap.ts` (NEW)

```typescript
/**
 * Maps NutriServe food item IDs to Recipe IDs
 * This allows us to retrieve recipe images for food items
 */
export const FOOD_TO_RECIPE_MAP: Record<string, string> = {
  'chana_masala': 'rcp_chana_masala',
  'palak_dal': 'rcp_palak_dal',
  'masoor_dal': 'rcp_masoor_dal',
  'moong_dal_tadka': 'rcp_moong_dal_tadka',
  'rajma_masala': 'rcp_rajma_masala',
  'sambar': 'rcp_sambar',
  'paneer_butter_masala': 'rcp_paneer_butter_masala',
  'chicken_curry': 'rcp_chicken_curry',
  'dal_makhani': 'rcp_dal_makhani',
  'butter_chicken': 'rcp_butter_chicken',
  // Breads
  'roti': 'no-image', // Emoji-only, no recipe
  'naan_plain': 'no-image',
  'garlic_naan': 'no-image',
  'cheese_naan': 'no-image',
  // ... expand as needed
};

export function getRecipeIdForFoodItem(foodItemId: string): string | null {
  return FOOD_TO_RECIPE_MAP[foodItemId] || null;
}

export function hasRecipeImage(foodItemId: string): boolean {
  const recipeId = FOOD_TO_RECIPE_MAP[foodItemId];
  return recipeId !== undefined && recipeId !== 'no-image';
}
```

#### Step 2: Extract Main Dish from Customer Order

**File**: `services/nutriserveUtils.ts` (EXTEND)

```typescript
import type { Character, FoodItem } from '../components/games/NutriServeTypes';
import { FOOD_DATA } from './nutriserveFoodData';
import { getRecipeIdForFoodItem } from './nutriserveFoodMap';

/**
 * Given a customer's order (with required_items like ['chana_masala']),
 * extract the primary/main dish item
 */
export function getMainDishFromOrder(
  requiredItems: string[]
): { foodItem: FoodItem; recipeId: string | null } | null {
  if (!requiredItems || requiredItems.length === 0) return null;

  // The first required item is typically the main dish
  const mainItemId = requiredItems[0];
  const foodItem = FOOD_DATA.find(f => f.id === mainItemId);

  if (!foodItem) return null;

  const recipeId = getRecipeIdForFoodItem(mainItemId);
  return { foodItem, recipeId };
}
```

#### Step 3: Create DishImageDisplay Component

**File**: `components/games/nutriserve-ui/DishImageDisplay.tsx` (NEW)

```typescript
import React, { useMemo } from 'react';
import { getRecipeImageState } from '../../../services/imageStoreService';
import { useUserCookbook } from '../../../contexts/UserCookbookContext';
import { LoadingSpinner } from '../../icons/Icons';

interface DishImageDisplayProps {
  foodItemId: string;
  recipeId: string | null;
  fallbackVisual?: React.FC<any>;
  maxHeight?: string;
}

const DishImageDisplay: React.FC<DishImageDisplayProps> = ({
  foodItemId,
  recipeId,
  fallbackVisual: FallbackVisual,
  maxHeight = '200px',
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { recipes } = useUserCookbook();

  // Try to fetch the recipe image
  React.useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!recipeId) {
        setLoading(false);
        return;
      }

      try {
        const imageState = await getRecipeImageState(recipeId);
        if (isMounted && imageState) {
          setImageUrl(imageState.urls.preview);
        }
      } catch (error) {
        console.warn(`Failed to load image for recipe ${recipeId}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImage();
    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  // Fallback to emoji if no recipe image or visual available
  const foodItem = React.useMemo(() => {
    if (!recipeId) return null;
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.image;
  }, [recipes, recipeId]);

  if (loading && recipeId) {
    return (
      <div
        style={{ height: maxHeight, maxHeight }}
        className="flex items-center justify-center bg-slate-100 rounded-lg"
      >
        <LoadingSpinner className="h-8 w-8 text-slate-500" />
      </div>
    );
  }

  // If we have an image URL, display it
  if (imageUrl) {
    return (
      <div
        className="rounded-lg overflow-hidden shadow-md"
        style={{ height: maxHeight, maxHeight }}
      >
        <img
          src={imageUrl}
          alt="Requested dish"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to emoji or text
  if (foodItem && typeof foodItem === 'string') {
    return (
      <div
        className="flex items-center justify-center text-6xl bg-slate-50 rounded-lg border-2 border-slate-200"
        style={{ height: maxHeight, maxHeight }}
      >
        {foodItem}
      </div>
    );
  }

  // Last resort: placeholder
  return (
    <div
      className="flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300"
      style={{ height: maxHeight, maxHeight }}
    >
      <p className="text-slate-400 text-sm">No image available</p>
    </div>
  );
};

export default DishImageDisplay;
```

#### Step 4: Integrate Into ResultModal

**File**: `components/games/nutriserve-ui/ResultModal.tsx` (MODIFY)

```typescript
import React from 'react';
import type { NutriServeCustomerWithTargets } from '../NutriServeTypes';
import type { NutrientStatus } from '../../../services/nutriserveUtils';
import { getMainDishFromOrder } from '../../../services/nutriserveUtils';
import { IconArrowRightCircle } from './Icons';
import DishImageDisplay from './DishImageDisplay';

interface ResultModalProps {
  score: number;
  customer: NutriServeCustomerWithTargets;
  feedback: Record<string, NutrientStatus>;
  onNext: () => void;
  isLastRound: boolean;
}

const ResultModal: React.FC<ResultModalProps> = ({
  score,
  customer,
  feedback,
  onNext,
  isLastRound,
}) => {
  const isSuccess = score >= 100;
  const CharacterVisual = isSuccess ? customer.visuals.happy : customer.visuals.sad;
  const dialogue = isSuccess
    ? customer.dialogue.positive
    : score > 50
    ? customer.dialogue.neutral
    : customer.dialogue.negative;

  // Extract main dish info
  const mainDish = React.useMemo(
    () => getMainDishFromOrder(customer.order.required_items),
    [customer.order.required_items]
  );

  const feedbackText: Record<string, (status: NutrientStatus) => string> = {
    calories_kcal: (s) =>
      s === 'good'
        ? 'Perfect calorie range!'
        : s === 'low'
        ? 'A bit light on calories.'
        : 'A bit too heavy.',
    protein_g: (s) => (s === 'good' ? 'Great protein level!' : 'Could use more protein.'),
    carbs_g: (s) => (s === 'good' ? 'Carbs are in check!' : 'Too many carbs.'),
    fat_g: (s) => (s === 'good' ? 'Healthy fat amount!' : 'A bit too much fat.'),
    fiber_g: (s) => (s === 'good' ? 'Excellent fiber!' : 'Could use more fiber.'),
    sodium_mg: (s) => (s === 'good' ? 'Sodium level is great!' : 'Too much sodium.'),
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-jump-in max-h-[90vh] overflow-y-auto">
        {/* Character + Dialogue */}
        <div className="w-24 h-24 mx-auto">
          <CharacterVisual />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mt-2">Order Complete!</h2>
        <p className="text-slate-600 italic mt-2 p-2 bg-slate-50 rounded-lg">
          "{dialogue}" - {customer.name}
        </p>

        {/* DISH IMAGE - NEW SECTION */}
        {mainDish && (
          <div className="my-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">
              You prepared:
            </p>
            <DishImageDisplay
              foodItemId={mainDish.foodItem.id}
              recipeId={mainDish.recipeId}
              maxHeight="180px"
            />
          </div>
        )}

        {/* Score */}
        <p
          className={`text-6xl font-extrabold my-4 ${
            isSuccess ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          +{score}
        </p>

        {/* Feedback */}
        <div className="space-y-1 text-left my-6 text-sm">
          {Object.entries(feedback).map(([nutrient, status]) => {
            const key = nutrient as keyof typeof feedbackText;
            if (!feedbackText[key]) return null;
            return (
              <div
                key={nutrient}
                className={`p-1.5 rounded-md font-semibold ${
                  status === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {feedbackText[key](status)}
              </div>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors"
        >
          {isLastRound ? 'Finish Game' : 'Next Customer'}
          <IconArrowRightCircle className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ResultModal;
```

---

## Part 2: Image Storage Verification & Permanent Storage

### Current Architecture Review

#### Image Storage Flow

```
AI Generation / User Upload
         ↓
imageService.ts (generateAndStoreRecipeImage / processAndStoreUserImage)
         ↓
buildKey() → content-addressed key (sha256)
         ↓
saveImageArtifacts() → IndexedDB + localStorage backup
         ↓
IMAGE_ARTIFACTS store + IMAGE_ALIASES store
         ↓
getRecipeImageState() → retrieves with managed object URLs
```

#### Potential Issues

1. **Key Collision**: Different recipes might generate the same key if spec is not unique
2. **Transient Recipe State**: AI-generated images might be lost if transient cache is cleared
3. **Alias Orphans**: If a recipe is deleted, the alias might persist without cleanup
4. **Cache Hit Logic**: No mechanism to skip regeneration if key already exists

### Verification Steps

#### Step 1: Audit imageService.ts

**File**: `services/imageService.ts` (REVIEW)

**Current Issues Found**:
```typescript
// Current: No check for existing key before generation
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string }> {
  // Should check if key already exists in IMAGE_ARTIFACTS
```

**Fix**: Check if image already exists before regenerating

```typescript
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string }> {
  if (!ai) {
    throw new Error("Gemini API not initialized. Cannot generate images.");
  }

  const prompt = `...`; // existing prompt

  const generationSpec = {
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    recipeId: recipe.id,
  };

  const key = await buildKey(generationSpec);

  // NEW: Check if this key already exists in the database
  const db = await getDb();
  const existingArtifacts = await db.get(STORES.IMAGE_ARTIFACTS, key);
  
  if (existingArtifacts) {
    console.log(`Image for recipe "${recipe.name}" already exists (key: ${key}). Skipping generation.`);
    // Still ensure alias is created/updated
    await saveAlias(recipe.id, key);
    return { key };
  }

  console.log(`Generating image for recipe "${recipe.name}" with key: ${key}`);

  try {
    // ... rest of generation code
```

#### Step 2: Audit imageStoreService.ts

**File**: `services/imageStoreService.ts` (REVIEW)

**Verification**:
- ✅ `saveImageArtifacts()` uses atomic transaction
- ✅ `getRecipeImageState()` returns managed URLs
- ✅ Backup happens after DB write
- **Gap**: No check for existing artifacts before save

**Improvement**: Add existence check

```typescript
export async function saveImageArtifacts(
  key: string,
  recipeId: string,
  artifacts: ImageArtifacts
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORES.IMAGE_ARTIFACTS, STORES.IMAGE_ALIASES], 'readwrite');

  // Check if this key already exists
  const existingArtifacts = await tx.objectStore(STORES.IMAGE_ARTIFACTS).get(key);
  if (existingArtifacts) {
    console.log(`Artifacts with key ${key} already exist. Updating alias only.`);
    await tx.objectStore(STORES.IMAGE_ALIASES).put({ recipeId, key });
    await tx.done;
    return;
  }

  // New artifacts, save everything
  const artifactPromise = tx.objectStore(STORES.IMAGE_ARTIFACTS).put({ key, ...artifacts });
  const aliasPromise = tx.objectStore(STORES.IMAGE_ALIASES).put({ recipeId, key });

  await Promise.all([artifactPromise, aliasPromise]);
  await tx.done;

  await backupImageManifest(key, artifacts).catch(err =>
    console.error("Failed to write to image backup.", err)
  );
}
```

#### Step 3: Verify ImageGenerationContext

**File**: `contexts/ImageGenerationContext.tsx` (REVIEW)

**Current Logic**:
- ✅ `processingIdsRef` tracks actual processing
- ✅ Duplicate detection in `enqueueRecipe()`
- ✅ Re-enqueue logic for failures
- **Gap**: Doesn't check if image already exists before enqueueing

**Improvement**: Add pre-check

```typescript
export const ImageGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ... existing code ...

  const enqueueRecipe = useCallback((recipe: Recipe) => {
    // NEW: Check if image already exists
    if (recipe.imageMetadata?.status === 'cached' || recipe.imageMetadata?.status === 'generated') {
      console.log(`Recipe "${recipe.name}" already has a cached/generated image. Skipping queue.`);
      return;
    }

    if (!enqueuedIdsRef.current.has(recipe.id) && !processingIdsRef.current.has(recipe.id)) {
      enqueuedIdsRef.current.add(recipe.id);
      queueRef.current.push(recipe);
      setQueueSize(q => q + 1);
      setTotalEnqueued(t => t + 1);
    }
  }, []);

  // ... rest of code
```

#### Step 4: Test Transient Cache Persistence

**File**: `contexts/UserCookbookContext.tsx` (VERIFY)

**Current Flow**:
1. AI generation queued
2. Image saved to transient cache
3. On "Save Recipe", moved from transient to permanent
4. On delete, uses `removeRecipeWithCleanup()`

**Verification**:
- ✅ Transient recipes loaded from DB on mount
- ✅ Atomic transaction for moving recipes
- ✅ Cleanup removes orphaned images

**Recommendation**: Add confirmation logging

```typescript
export const UserCookbookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ... existing code ...

  useEffect(() => {
    const loadCookbook = async () => {
      setLoading(true);
      const [userRecipes, transientRecipes] = await Promise.all([getRecipes(), getTransientRecipes()]);

      console.log(`Loaded ${userRecipes.length} recipes and ${transientRecipes.length} transient recipes`);

      // ... rest of loading logic
```

#### Step 5: Database Index Verification

**File**: `services/db.ts` (REVIEW)

**Current State**:
```typescript
export const STORES = {
  IMAGE_ARTIFACTS: 'image_artifacts',      // keyPath: 'key'
  IMAGE_ALIASES: 'image_aliases',          // keyPath: 'recipeId'
  TRANSIENT_RECIPE_CACHE: 'transient_recipe_cache', // keyPath: 'id'
} as const;
```

**Verification**: Make sure on upgrade, all stores are created

```typescript
// In openDB upgrade callback
if (oldVersion < 1) {
  db.createObjectStore(STORES.IMAGE_ARTIFACTS, { keyPath: 'key' });
  db.createObjectStore(STORES.IMAGE_ALIASES, { keyPath: 'recipeId' });
  // ...
}

if (oldVersion < 3) {
  if (!db.objectStoreNames.contains(STORES.TRANSIENT_RECIPE_CACHE)) {
    db.createObjectStore(STORES.TRANSIENT_RECIPE_CACHE, { keyPath: 'id' });
  }
}
```

---

## Part 3: Implementation Checklist

### Phase 1: Image Storage Verification (Days 1-2)

- [ ] **Code Review & Audit**
  - [ ] Review `imageService.ts` for regeneration logic
  - [ ] Review `imageStoreService.ts` for deduplication
  - [ ] Review `ImageGenerationContext.tsx` for cache hits
  - [ ] Verify `db.ts` store creation

- [ ] **Add Pre-Existence Checks**
  - [ ] Modify `generateAndStoreRecipeImage()` to check for existing key
  - [ ] Modify `saveImageArtifacts()` to skip re-save
  - [ ] Modify `enqueueRecipe()` to check `imageMetadata.status`

- [ ] **Testing**
  - [ ] Generate an image for Recipe A
  - [ ] Verify it's stored in IndexedDB
  - [ ] Close and reopen the app
  - [ ] Load Recipe A—should NOT regenerate
  - [ ] Check browser storage (DevTools) that key exists once

- [ ] **Logging**
  - [ ] Add console logs for cache hits
  - [ ] Add console logs for new generations
  - [ ] Track in-memory queue size for debugging

### Phase 2: NutriServe Dish Display Feature (Days 3-4)

- [ ] **Create Mapping System**
  - [ ] Create `services/nutriserveFoodMap.ts`
  - [ ] Map food item IDs to recipe IDs
  - [ ] Create helper functions

- [ ] **Enhance Utils**
  - [ ] Add `getMainDishFromOrder()` to `nutriserveUtils.ts`
  - [ ] Handle null/missing dishes gracefully

- [ ] **Create UI Component**
  - [ ] Create `DishImageDisplay.tsx`
  - [ ] Handle loading states
  - [ ] Fallback to emoji
  - [ ] Responsive sizing

- [ ] **Integrate Into ResultModal**
  - [ ] Import `getMainDishFromOrder()`
  - [ ] Import `DishImageDisplay`
  - [ ] Add image above score
  - [ ] Add label "You prepared:"

- [ ] **Testing**
  - [ ] Play a round and complete order
  - [ ] Verify dish image shows on result screen
  - [ ] Test with no image available (fallback to emoji)
  - [ ] Test on different screen sizes
  - [ ] Verify accessibility (alt text, keyboard nav)

### Phase 3: Integration & Polish (Days 5)

- [ ] **Cross-Component Testing**
  - [ ] Generate AI images in Recipe section
  - [ ] Play NutriServe and verify images persist
  - [ ] Verify no duplicate image generation on app restart

- [ ] **Error Handling**
  - [ ] What if recipe image fails to load?
  - [ ] What if food item has no recipe mapping?
  - [ ] What if customer has no required items?

- [ ] **Performance**
  - [ ] Monitor IndexedDB query times
  - [ ] Check memory usage with many images
  - [ ] Verify URL cleanup happens

- [ ] **Documentation**
  - [ ] Update README with feature description
  - [ ] Document food-to-recipe mapping
  - [ ] Add troubleshooting guide

---

## Part 4: Code Changes Summary

### New Files

1. **`services/nutriserveFoodMap.ts`** - Food-to-recipe mapping
2. **`components/games/nutriserve-ui/DishImageDisplay.tsx`** - Image display component

### Modified Files

1. **`services/imageService.ts`**
   - Add existence check before generation

2. **`services/imageStoreService.ts`**
   - Add existence check in `saveImageArtifacts()`

3. **`contexts/ImageGenerationContext.tsx`**
   - Add cache status check in `enqueueRecipe()`

4. **`components/games/nutriserve-ui/ResultModal.tsx`**
   - Import and integrate `DishImageDisplay`
   - Extract main dish from order
   - Render image section

5. **`services/db.ts`** (Optional)
   - Add logging for store creation

### No Breaking Changes

All changes are additive and backward-compatible:
- New component is optional within ResultModal
- Cache checks don't affect existing workflows
- Mapping is optional (missing mappings fall back to emoji)

---

## Part 5: Testing Strategy

### Unit Tests

```typescript
// Test nutriserveFoodMap
describe('nutriserveFoodMap', () => {
  it('should return recipe ID for known food item', () => {
    expect(getRecipeIdForFoodItem('chana_masala')).toBe('rcp_chana_masala');
  });

  it('should return null for unknown food item', () => {
    expect(getRecipeIdForFoodItem('unknown')).toBeNull();
  });

  it('should indicate if food item has recipe image', () => {
    expect(hasRecipeImage('chana_masala')).toBe(true);
    expect(hasRecipeImage('roti')).toBe(false);
  });
});

// Test image existence check
describe('imageService', () => {
  it('should skip regeneration if image already exists', async () => {
    // Setup: Save an image to DB
    // Call generateAndStoreRecipeImage with same recipe
    // Assert: No API call made, same key returned
  });
});
```

### Integration Tests

1. **Image Persistence Flow**
   - Generate image
   - Save recipe
   - Close app
   - Reopen app
   - Load recipe
   - Verify: No regeneration, image loads

2. **NutriServe Result Flow**
   - Start game
   - Build plate for required dish
   - Complete round
   - Verify: Main dish image displays on result screen

### Manual Testing Checklist

- [ ] Fresh install: First image generation works
- [ ] Cache hit: Second generation skipped
- [ ] Transient to permanent: Saves don't recreate images
- [ ] Fallback: Missing recipe maps to emoji gracefully
- [ ] Performance: No lag when loading 20+ images
- [ ] Network: Works offline after first load
- [ ] Storage: DevTools shows image data in IndexedDB
- [ ] Backup: localStorage has image manifest backup

---

## Part 6: Rollout Plan

### Stage 1: Backend Verification (Internal)
- Audit and fix image storage logic
- Add logging and monitoring
- Deploy to staging environment

### Stage 2: Feature Addition (Internal)
- Implement NutriServe dish display
- Full testing in staging
- Code review and QA sign-off

### Stage 3: Canary Release (10% users)
- Monitor error rates
- Check performance metrics
- Verify no duplicate image generation

### Stage 4: General Release (100% users)
- Full rollout with monitoring
- Have rollback plan ready
- Document in release notes

---

## Part 7: Rollback Plan

If issues arise:

1. **Disable NutriServe Dish Display**
   ```typescript
   // Temporarily comment out DishImageDisplay in ResultModal
   // Feature gracefully disabled, game still playable
   ```

2. **Reset Image Generation**
   ```typescript
   // Clear transient cache and ARTIFACT stores
   // Force fresh generation on next session
   // Users won't lose recipes, just images regenerate once
   ```

3. **Quick Fix Process**
   - Identify root cause from logs
   - Deploy fix to staging
   - Run full test suite
   - Deploy to production
   - Monitor for 24 hours

---

## Part 8: Success Metrics

### Technical Metrics
- ✅ Zero duplicate image generations per session
- ✅ Image load time < 500ms for cached images
- ✅ IndexedDB storage < 50MB for 50 recipes
- ✅ No memory leaks after 1 hour gameplay

### User Metrics
- ✅ NutriServe dish image loads on 99% of result screens
- ✅ No increase in API error rate
- ✅ No complaints about image regeneration
- ✅ Positive feedback on visual enhancement

---

## Appendix A: Current Image Flow Diagram

```
Recipe Created
    ↓
ImageGenerationContext.enqueueRecipe()
    ↓
Queue Processing (max 2 concurrent)
    ↓
generateAndStoreRecipeImage() [CHECK EXIST]
    ↓
buildKey(spec) → Content-addressed
    ↓
getDb() → Fetch from IMAGE_ARTIFACTS [CHECK EXIST]
    ↓
Gemini API Call
    ↓
saveImageArtifacts() [CHECK EXIST]
    ↓
IndexedDB IMAGE_ARTIFACTS (key, original, preview, thumb, manifest)
IndexedDB IMAGE_ALIASES (recipeId → key mapping)
    ↓
Backup to localStorage
    ↓
saveToTransientCache(recipe with imageMetadata.status='generated')
    ↓
On Save Recipe: move to permanent UserCookbook
```

---

## Appendix B: File Modification Templates

### Template: imageService.ts modification

```typescript
// BEFORE
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string }> {
  if (!ai) {
    throw new Error("Gemini API not initialized. Cannot generate images.");
  }

  const prompt = `...`;
  const generationSpec = { model: '...', prompt, recipeId: recipe.id };
  const key = await buildKey(generationSpec);
  
  console.log(`Generating image...`);
  // Make API call...
}

// AFTER
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string }> {
  if (!ai) {
    throw new Error("Gemini API not initialized. Cannot generate images.");
  }

  const prompt = `...`;
  const generationSpec = { model: '...', prompt, recipeId: recipe.id };
  const key = await buildKey(generationSpec);

  // NEW: Check if already exists
  const db = await getDb();
  const existingArtifacts = await db.get(STORES.IMAGE_ARTIFACTS, key);
  if (existingArtifacts) {
    console.log(`✓ Image for "${recipe.name}" already cached (key: ${key})`);
    await saveAlias(recipe.id, key);
    return { key };
  }

  console.log(`⏳ Generating image for "${recipe.name}"...`);
  // Make API call...
}
```

---

## Summary

**Goal 1 Achievement**: Display dish photo on NutriServe score screen by:
- Creating food-to-recipe mapping
- Building `DishImageDisplay` component  
- Integrating into `ResultModal`
- Extracting main dish from customer order

**Goal 2 Achievement**: Ensure permanent image storage by:
- Adding pre-existence checks to prevent regeneration
- Auditing transient cache persistence
- Implementing atomic transactions
- Adding logging and monitoring
