# Unsplash API Integration Implementation Plan

## Problem Statement
Hardcoded Unsplash URLs are returning 404 errors. Need to implement proper Unsplash API integration to:
1. Fetch images dynamically on first load
2. Cache fetched URLs in localStorage
3. Auto-search for images when users add new recipes

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Actions                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Recipe Components                           │
│  (RecipeCard, RecipeDetailModal, RecipeModal)           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           UserCookbookContext                            │
│  - Manages recipe state                                  │
│  - Triggers image fetching                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│          UnsplashService (NEW)                           │
│  - searchPhotos(query)                                   │
│  - getPhotoUrl(photoId)                                  │
│  - fetchImageForRecipe(recipeName, ingredients)          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│       ImageCacheService (NEW)                            │
│  - Store: localStorage key "recipe-image-cache"          │
│  - getCachedUrl(recipeId)                                │
│  - setCachedUrl(recipeId, url)                           │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Environment Configuration

**File:** `.env.local` (NEW)
```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=ekO12wsJDRvwrDQQgfbcQO1CbbQMeJcJq0Sl5BpyIww
```

**Note:** Using `NEXT_PUBLIC_` prefix makes it accessible in browser (Next.js/Vite convention)

**File:** `config.ts` (UPDATE)
```typescript
// Add Unsplash configuration
export const UNSPLASH_CONFIG = {
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
  apiUrl: 'https://api.unsplash.com',
  defaultSearchQuery: 'indian food healthy',
  perPage: 1, // Get 1 photo per search
  orientation: 'landscape', // Better for recipe cards
};
```

---

### Step 2: Create Unsplash Service

**File:** `services/unsplashService.ts` (NEW)

```typescript
import { UNSPLASH_CONFIG } from '../config';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

class UnsplashService {
  private accessKey: string;
  private apiUrl: string;

  constructor() {
    this.accessKey = UNSPLASH_CONFIG.accessKey;
    this.apiUrl = UNSPLASH_CONFIG.apiUrl;

    if (!this.accessKey) {
      console.warn('⚠️ Unsplash Access Key not configured. Images will use fallback emojis.');
    }
  }

  /**
   * Search for photos on Unsplash
   */
  async searchPhotos(query: string, perPage: number = 1): Promise<UnsplashPhoto[]> {
    if (!this.accessKey) {
      throw new Error('Unsplash Access Key not configured');
    }

    try {
      const url = new URL(`${this.apiUrl}/search/photos`);
      url.searchParams.append('query', query);
      url.searchParams.append('per_page', perPage.toString());
      url.searchParams.append('orientation', UNSPLASH_CONFIG.orientation);
      url.searchParams.append('client_id', this.accessKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }

      const data: UnsplashSearchResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      throw error;
    }
  }

  /**
   * Get optimized image URL from Unsplash photo
   */
  getOptimizedUrl(photo: UnsplashPhoto, width: number = 800): string {
    // Use Unsplash's image optimization parameters
    return `${photo.urls.raw}&w=${width}&q=80&auto=format&fit=crop`;
  }

  /**
   * Fetch image for a recipe based on name and ingredients
   */
  async fetchImageForRecipe(recipeName: string, ingredients?: string[]): Promise<string | null> {
    try {
      // Build search query from recipe name and key ingredients
      let searchQuery = recipeName;

      // Add "indian food" context if recipe name doesn't include it
      if (!recipeName.toLowerCase().includes('indian')) {
        searchQuery = `${recipeName} indian food`;
      }

      const photos = await this.searchPhotos(searchQuery, 1);

      if (photos.length === 0) {
        // Fallback to generic search if specific recipe not found
        const fallbackPhotos = await this.searchPhotos('indian healthy food', 1);
        if (fallbackPhotos.length > 0) {
          return this.getOptimizedUrl(fallbackPhotos[0], 800);
        }
        return null;
      }

      return this.getOptimizedUrl(photos[0], 800);
    } catch (error) {
      console.error(`Failed to fetch image for recipe "${recipeName}":`, error);
      return null;
    }
  }

  /**
   * Trigger a download (required by Unsplash API guidelines when displaying images)
   */
  async triggerDownload(downloadUrl: string): Promise<void> {
    if (!this.accessKey || !downloadUrl) return;

    try {
      await fetch(`${downloadUrl}?client_id=${this.accessKey}`);
    } catch (error) {
      console.error('Error triggering download:', error);
    }
  }
}

export const unsplashService = new UnsplashService();
```

---

### Step 3: Create Image Cache Service

**File:** `services/imageCacheService.ts` (NEW)

```typescript
interface ImageCacheEntry {
  recipeId: string;
  imageUrl: string;
  fetchedAt: number; // Timestamp
  source: 'unsplash' | 'user' | 'emoji';
}

interface ImageCache {
  [recipeId: string]: ImageCacheEntry;
}

class ImageCacheService {
  private readonly CACHE_KEY = 'budhub-recipe-image-cache';
  private readonly CACHE_VERSION = 'v1';
  private readonly CACHE_EXPIRY_DAYS = 30; // Cache images for 30 days

  /**
   * Get cached image URL for a recipe
   */
  getCachedUrl(recipeId: string): string | null {
    const cache = this.loadCache();
    const entry = cache[recipeId];

    if (!entry) return null;

    // Check if cache entry is expired
    if (this.isCacheExpired(entry.fetchedAt)) {
      this.removeCachedUrl(recipeId);
      return null;
    }

    return entry.imageUrl;
  }

  /**
   * Set cached image URL for a recipe
   */
  setCachedUrl(recipeId: string, imageUrl: string, source: 'unsplash' | 'user' | 'emoji' = 'unsplash'): void {
    const cache = this.loadCache();

    cache[recipeId] = {
      recipeId,
      imageUrl,
      fetchedAt: Date.now(),
      source,
    };

    this.saveCache(cache);
  }

  /**
   * Remove cached URL for a recipe
   */
  removeCachedUrl(recipeId: string): void {
    const cache = this.loadCache();
    delete cache[recipeId];
    this.saveCache(cache);
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${this.CACHE_KEY}-${this.CACHE_VERSION}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; unsplashImages: number; userImages: number; emojis: number } {
    const cache = this.loadCache();
    const entries = Object.values(cache);

    return {
      totalEntries: entries.length,
      unsplashImages: entries.filter(e => e.source === 'unsplash').length,
      userImages: entries.filter(e => e.source === 'user').length,
      emojis: entries.filter(e => e.source === 'emoji').length,
    };
  }

  // Private methods

  private loadCache(): ImageCache {
    if (typeof window === 'undefined') return {};

    try {
      const cached = localStorage.getItem(`${this.CACHE_KEY}-${this.CACHE_VERSION}`);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Error loading image cache:', error);
      return {};
    }
  }

  private saveCache(cache: ImageCache): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`${this.CACHE_KEY}-${this.CACHE_VERSION}`, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving image cache:', error);
    }
  }

  private isCacheExpired(fetchedAt: number): boolean {
    const expiryMs = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - fetchedAt > expiryMs;
  }
}

export const imageCacheService = new ImageCacheService();
```

---

### Step 4: Update Recipe Type

**File:** `types.ts` (UPDATE)

```typescript
// Add new fields to Recipe interface
export interface Recipe {
  id: string;
  name: string;
  image: string; // Can be URL or emoji
  imageSource?: 'unsplash' | 'user' | 'emoji' | 'preloaded'; // Track where image came from
  imageLoading?: boolean; // Track loading state
  // ... rest of existing fields
}
```

---

### Step 5: Update UserCookbookContext

**File:** `contexts/UserCookbookContext.tsx` (UPDATE)

Add new function to fetch images for recipes:

```typescript
import { unsplashService } from '../services/unsplashService';
import { imageCacheService } from '../services/imageCacheService';

// Inside UserCookbookProvider component:

/**
 * Fetch and cache image for a recipe
 */
const fetchImageForRecipe = async (recipe: Recipe): Promise<string> => {
  // Check cache first
  const cachedUrl = imageCacheService.getCachedUrl(recipe.id);
  if (cachedUrl) {
    return cachedUrl;
  }

  try {
    // Fetch from Unsplash API
    const imageUrl = await unsplashService.fetchImageForRecipe(
      recipe.name,
      recipe.keyIngredients
    );

    if (imageUrl) {
      // Cache the fetched URL
      imageCacheService.setCachedUrl(recipe.id, imageUrl, 'unsplash');
      return imageUrl;
    }
  } catch (error) {
    console.error(`Failed to fetch image for ${recipe.name}:`, error);
  }

  // Fallback to emoji
  const fallbackEmoji = '🍲';
  imageCacheService.setCachedUrl(recipe.id, fallbackEmoji, 'emoji');
  return fallbackEmoji;
};

/**
 * Initialize images for all preloaded recipes on first load
 */
const initializeRecipeImages = async () => {
  const recipesToUpdate = allRecipes.filter(recipe => {
    // Only fetch for preloaded recipes without cached images
    return recipe.source === 'preloaded' && !imageCacheService.getCachedUrl(recipe.id);
  });

  console.log(`Initializing images for ${recipesToUpdate.length} recipes...`);

  // Fetch images in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  for (let i = 0; i < recipesToUpdate.length; i += BATCH_SIZE) {
    const batch = recipesToUpdate.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipe) => {
        const imageUrl = await fetchImageForRecipe(recipe);

        // Update recipe with fetched image
        setAllRecipes(prevRecipes =>
          prevRecipes.map(r =>
            r.id === recipe.id
              ? { ...r, image: imageUrl, imageSource: imageUrl.startsWith('http') ? 'unsplash' : 'emoji' }
              : r
          )
        );
      })
    );

    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < recipesToUpdate.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('✅ Recipe images initialized!');
};

// Call on component mount
useEffect(() => {
  initializeRecipeImages();
}, []); // Empty dependency array = run once on mount
```

---

### Step 6: Update RecipeModal for New Recipes

**File:** `components/RecipeModal.tsx` (UPDATE)

```typescript
import { unsplashService } from '../services/unsplashService';
import { imageCacheService } from '../services/imageCacheService';

// Add new state
const [isSearchingImage, setIsSearchingImage] = useState(false);
const [imageSearchError, setImageSearchError] = useState<string>('');

// Add function to auto-search for image
const autoSearchImage = async () => {
  if (!name) {
    setImageSearchError('Enter recipe name first');
    return;
  }

  setIsSearchingImage(true);
  setImageSearchError('');

  try {
    const imageUrl = await unsplashService.fetchImageForRecipe(name);

    if (imageUrl) {
      setImage(imageUrl);
      setImageSearchError('');
    } else {
      setImageSearchError('No images found. Using default emoji.');
      setImage('🍲');
    }
  } catch (error) {
    console.error('Error searching for image:', error);
    setImageSearchError('Failed to search for image. Using default emoji.');
    setImage('🍲');
  } finally {
    setIsSearchingImage(false);
  }
};

// Add button in the UI (after recipe name input):
<button
  type="button"
  onClick={autoSearchImage}
  disabled={!name || isSearchingImage}
  className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSearchingImage ? '🔍 Searching...' : '🔍 Auto-find Image'}
</button>
```

---

### Step 7: Update constants.ts

**File:** `constants.ts` (UPDATE)

Replace all hardcoded Unsplash URLs with emojis temporarily:

```typescript
// Change all recipes to use emoji placeholders
// Images will be fetched on first load via API

{
  id: 'rcp_chana_masala',
  name: 'Chana Masala',
  image: '🍛', // Emoji placeholder - will be replaced by API fetch
  // ... rest of recipe
},
{
  id: 'rcp_palak_dal',
  name: 'Palak Dal',
  image: '🥗', // Emoji placeholder - will be replaced by API fetch
  // ... rest of recipe
},
```

---

## Rate Limiting Strategy

Unsplash free tier limits:
- **50 requests per hour**
- **5,000 requests per month**

**Our Strategy:**
1. **Batch fetching:** Fetch 5 images at a time with 1 second delay between batches
2. **Caching:** Store fetched URLs in localStorage for 30 days
3. **Fallback:** Use emojis if API limit reached or fetch fails
4. **User recipes:** Only fetch on demand when user clicks "Auto-find Image"

**Math:**
- 18 preloaded recipes = 18 API calls on first load (within hourly limit)
- Cached for 30 days = ~18 requests/month for preloaded recipes
- User-added recipes: Variable, but controlled by manual trigger

---

## Error Handling

1. **API Key Missing:** Show warning, use emoji fallbacks
2. **Rate Limit Exceeded:** Use cached images or emojis, retry after 1 hour
3. **Network Error:** Graceful fallback to emojis
4. **No Results:** Use generic food search or emoji

---

## Testing Checklist

- [ ] `.env.local` file created with API key
- [ ] UnsplashService can search photos
- [ ] ImageCacheService stores and retrieves URLs
- [ ] Recipe images load on first app launch
- [ ] Cached images load instantly on subsequent launches
- [ ] "Auto-find Image" button works in RecipeModal
- [ ] Error handling works when API fails
- [ ] Rate limiting respected (batch delays work)
- [ ] Image display fixes applied (ManageRecipesModal, RecipeCard, etc.)

---

## Migration Path

1. **Phase 1:** Create services (UnsplashService, ImageCacheService)
2. **Phase 2:** Update types and configuration
3. **Phase 3:** Integrate with UserCookbookContext
4. **Phase 4:** Update RecipeModal for new recipes
5. **Phase 5:** Apply display fixes from RECIPE_IMAGE_FIXES.md
6. **Phase 6:** Test and validate

---

## Files to Create/Modify

**New Files:**
- `.env.local`
- `services/unsplashService.ts`
- `services/imageCacheService.ts`

**Modified Files:**
- `config.ts`
- `types.ts`
- `contexts/UserCookbookContext.tsx`
- `components/RecipeModal.tsx`
- `constants.ts`
- `components/ManageRecipesModal.tsx`
- `components/RecipeCard.tsx`
- `components/RecipeDetailModal.tsx`

---

## Expected Behavior After Implementation

1. **First Load:**
   - App shows recipes with emoji placeholders
   - Background process fetches images from Unsplash API (5 at a time)
   - Images gradually appear as they're fetched
   - URLs cached in localStorage

2. **Subsequent Loads:**
   - Cached images load instantly (no API calls)
   - Cache valid for 30 days

3. **Adding New Recipe:**
   - User enters recipe name
   - Clicks "Auto-find Image" button
   - App searches Unsplash and displays preview
   - User can accept or enter custom URL/emoji

4. **Offline/API Error:**
   - App falls back to emoji placeholders gracefully
   - No broken images or error messages shown to user

---

**Implementation Priority:** HIGH
**Estimated Complexity:** Medium
**Dependencies:** None (can implement immediately)
