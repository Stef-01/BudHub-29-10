// services/imageCacheService.ts

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

    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    if (this.isCacheExpired(entry.fetchedAt)) {
      console.log(`Cache expired for recipe: ${recipeId}`);
      this.removeCachedUrl(recipeId);
      return null;
    }

    console.log(`✅ Using cached image for recipe: ${recipeId}`);
    return entry.imageUrl;
  }

  /**
   * Set cached image URL for a recipe
   */
  setCachedUrl(
    recipeId: string,
    imageUrl: string,
    source: 'unsplash' | 'user' | 'emoji' = 'unsplash'
  ): void {
    const cache = this.loadCache();

    cache[recipeId] = {
      recipeId,
      imageUrl,
      fetchedAt: Date.now(),
      source,
    };

    this.saveCache(cache);
    console.log(`💾 Cached image for recipe: ${recipeId} (source: ${source})`);
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
      console.log('🗑️ Image cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    unsplashImages: number;
    userImages: number;
    emojis: number;
  } {
    const cache = this.loadCache();
    const entries = Object.values(cache);

    return {
      totalEntries: entries.length,
      unsplashImages: entries.filter((e) => e.source === 'unsplash').length,
      userImages: entries.filter((e) => e.source === 'user').length,
      emojis: entries.filter((e) => e.source === 'emoji').length,
    };
  }

  /**
   * Get all cached entries (for debugging)
   */
  getAllCachedEntries(): ImageCache {
    return this.loadCache();
  }

  /**
   * Export cache as JSON (for backup/migration)
   */
  exportCache(): string {
    const cache = this.loadCache();
    return JSON.stringify(cache, null, 2);
  }

  /**
   * Import cache from JSON (for restore/migration)
   */
  importCache(jsonString: string): boolean {
    try {
      const cache: ImageCache = JSON.parse(jsonString);

      // Validate structure
      if (typeof cache !== 'object') {
        throw new Error('Invalid cache format');
      }

      this.saveCache(cache);
      console.log('✅ Cache imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing cache:', error);
      return false;
    }
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
      localStorage.setItem(
        `${this.CACHE_KEY}-${this.CACHE_VERSION}`,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error('Error saving image cache:', error);

      // If localStorage is full, try to clear old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, clearing old cache entries...');
        this.clearExpiredEntries();

        // Try saving again
        try {
          localStorage.setItem(
            `${this.CACHE_KEY}-${this.CACHE_VERSION}`,
            JSON.stringify(cache)
          );
        } catch (retryError) {
          console.error('Failed to save cache even after clearing:', retryError);
        }
      }
    }
  }

  private isCacheExpired(fetchedAt: number): boolean {
    const expiryMs = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - fetchedAt > expiryMs;
  }

  private clearExpiredEntries(): void {
    const cache = this.loadCache();
    const validEntries: ImageCache = {};

    Object.entries(cache).forEach(([recipeId, entry]) => {
      if (!this.isCacheExpired(entry.fetchedAt)) {
        validEntries[recipeId] = entry;
      }
    });

    this.saveCache(validEntries);
    console.log(`Cleared ${Object.keys(cache).length - Object.keys(validEntries).length} expired entries`);
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
