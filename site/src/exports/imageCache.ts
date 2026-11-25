/**
 * Least recently used (LRU) cache for exported card images.
 * The cache removes the oldest entries when it goes over its size or count limit.
 */

const MAX_CACHE_BYTES = 15 * 1024 * 1024;
const MAX_CACHED_IMAGES = 12;

class ImageCache {
  // Data URLs by cache key. A Map keeps insertion order, so the first key is the least recently used.
  private entries = new Map<string, string>();
  // Approximate size in bytes. Each data URL character is one byte.
  private totalSize = 0;

  public get(key: string): string | null {
    const dataUrl = this.entries.get(key);
    if (dataUrl === undefined) {
      return null;
    }
    // Move the entry to the end, so it is the most recently used.
    this.entries.delete(key);
    this.entries.set(key, dataUrl);
    return dataUrl;
  }

  public set(key: string, dataUrl: string): void {
    this.remove(key);
    this.entries.set(key, dataUrl);
    this.totalSize += dataUrl.length;
    this.evictIfNeeded();
  }

  private remove(key: string): void {
    const dataUrl = this.entries.get(key);
    if (dataUrl !== undefined) {
      this.entries.delete(key);
      this.totalSize -= dataUrl.length;
    }
  }

  private evictIfNeeded(): void {
    while (this.entries.size > MAX_CACHED_IMAGES || this.totalSize > MAX_CACHE_BYTES) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      this.remove(oldestKey);
    }
  }
}

export const imageCache = new ImageCache();
