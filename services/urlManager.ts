// services/urlManager.ts

class ObjectURLManager {
  private urls = new Map<string, { url: string; refCount: number }>();
  
  /**
   * Creates a new object URL for a blob or returns an existing one.
   * Increments the reference count for the URL.
   * @param blob The blob to create a URL for.
   * @param key A unique key to identify this URL.
   * @returns The object URL string.
   */
  create(blob: Blob, key: string): string {
    const existing = this.urls.get(key);
    if (existing) {
      existing.refCount++;
      return existing.url;
    }
    
    const url = URL.createObjectURL(blob);
    this.urls.set(key, { url, refCount: 1 });
    return url;
  }
  
  /**
   * Decrements the reference count for a URL.
   * If the count reaches zero, the URL is revoked and removed from the manager.
   * @param key The unique key for the URL to release.
   */
  release(key: string): void {
    const entry = this.urls.get(key);
    if (!entry) return;
    
    entry.refCount--;
    if (entry.refCount <= 0) {
      URL.revokeObjectURL(entry.url);
      this.urls.delete(key);
    }
  }
  
  /**
   * Forces the revocation of all currently managed URLs.
   * Useful for application-wide cleanup.
   */
  releaseAll(): void {
    for (const entry of this.urls.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.urls.clear();
    console.log("All managed object URLs have been revoked.");
  }
}

export const urlManager = new ObjectURLManager();
