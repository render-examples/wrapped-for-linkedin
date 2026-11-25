/**
 * Least recently used (LRU) cache for exported card images.
 * The cache removes the oldest entries when it goes over its size or count limit.
 */

const MAX_CACHE_BYTES = 15 * 1024 * 1024;
const MAX_CACHED_IMAGES = 12;

export interface CachedImage {
  dataUrl: string;
  // Approximate size in bytes.
  size: number;
}

class ImageCache {
  // A Map keeps insertion order, so the first key is the least recently used.
  private entries = new Map<string, CachedImage>();
  private totalSize = 0;

  public get(key: string): CachedImage | null {
    const image = this.entries.get(key);
    if (!image) {
      return null;
    }
    // Move the entry to the end, so it is the most recently used.
    this.entries.delete(key);
    this.entries.set(key, image);
    return image;
  }

  public set(key: string, image: CachedImage): void {
    this.remove(key);
    this.entries.set(key, image);
    this.totalSize += image.size;
    this.evictIfNeeded();
  }

  private remove(key: string): void {
    const image = this.entries.get(key);
    if (image) {
      this.entries.delete(key);
      this.totalSize -= image.size;
    }
  }

  private evictIfNeeded(): void {
    while (
      this.entries.size > MAX_CACHED_IMAGES ||
      (this.entries.size > 0 && this.totalSize > MAX_CACHE_BYTES)
    ) {
      const oldestKey = this.entries.keys().next().value as string;
      this.remove(oldestKey);
    }
  }
}

export const imageCache = new ImageCache();
