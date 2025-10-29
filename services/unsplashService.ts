// services/unsplashService.ts

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
  links: {
    download_location: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

class UnsplashService {
  private accessKey: string;
  private apiUrl: string = 'https://api.unsplash.com';

  constructor() {
    // Access key will be injected from environment or config
    this.accessKey = '';

    // Check if running in browser
    if (typeof window !== 'undefined') {
      // Try to get from window object (set by config)
      this.accessKey = (window as any).__UNSPLASH_ACCESS_KEY__ || '';
    }

    if (!this.accessKey) {
      console.warn('⚠️ Unsplash Access Key not configured. Images will use fallback emojis.');
    }
  }

  /**
   * Set the access key (call this from config initialization)
   */
  setAccessKey(key: string): void {
    this.accessKey = key;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.accessKey;
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
      url.searchParams.append('orientation', 'landscape');
      url.searchParams.append('client_id', this.accessKey);

      console.log(`🔍 Searching Unsplash for: "${query}"`);

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Unsplash API key');
        }
        if (response.status === 403) {
          throw new Error('Unsplash API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }

      const data: UnsplashSearchResponse = await response.json();
      console.log(`✅ Found ${data.results.length} photos for "${query}"`);

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
    if (!this.accessKey) {
      console.warn('Cannot fetch image: Unsplash not configured');
      return null;
    }

    try {
      // Build search query from recipe name
      let searchQuery = recipeName;

      // Add "indian food" context if recipe name doesn't include it
      if (!recipeName.toLowerCase().includes('indian')) {
        searchQuery = `${recipeName} indian food`;
      }

      console.log(`🖼️ Fetching image for recipe: ${recipeName}`);

      const photos = await this.searchPhotos(searchQuery, 1);

      if (photos.length === 0) {
        console.log(`No results for "${searchQuery}", trying fallback...`);

        // Fallback to generic search if specific recipe not found
        const fallbackPhotos = await this.searchPhotos('indian healthy food', 1);

        if (fallbackPhotos.length > 0) {
          const url = this.getOptimizedUrl(fallbackPhotos[0], 800);
          // Trigger download as per Unsplash API guidelines
          this.triggerDownload(fallbackPhotos[0].links.download_location);
          return url;
        }

        return null;
      }

      const url = this.getOptimizedUrl(photos[0], 800);

      // Trigger download as per Unsplash API guidelines
      this.triggerDownload(photos[0].links.download_location);

      return url;
    } catch (error) {
      console.error(`Failed to fetch image for recipe "${recipeName}":`, error);
      return null;
    }
  }

  /**
   * Trigger a download (required by Unsplash API guidelines when displaying images)
   */
  private async triggerDownload(downloadUrl: string): Promise<void> {
    if (!this.accessKey || !downloadUrl) return;

    try {
      const url = new URL(downloadUrl);
      url.searchParams.append('client_id', this.accessKey);

      await fetch(url.toString());
    } catch (error) {
      console.error('Error triggering download:', error);
    }
  }

  /**
   * Get random photo for a query
   */
  async getRandomPhoto(query: string = 'indian food'): Promise<string | null> {
    if (!this.accessKey) {
      return null;
    }

    try {
      const photos = await this.searchPhotos(query, 10);

      if (photos.length === 0) return null;

      // Pick a random photo from results
      const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

      // Trigger download
      this.triggerDownload(randomPhoto.links.download_location);

      return this.getOptimizedUrl(randomPhoto, 800);
    } catch (error) {
      console.error('Error getting random photo:', error);
      return null;
    }
  }
}

// Export singleton instance
export const unsplashService = new UnsplashService();
