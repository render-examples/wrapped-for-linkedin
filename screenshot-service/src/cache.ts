type TtlCacheOptions<V> = {
  ttlMs: number;
  maxEntries: number;
  // The maximum total size of all values, as measured by `sizeOf`. There is no limit by default.
  maxSize?: number;
  sizeOf?: (value: V) => number;
  now?: () => number;
};

type Entry<V> = { value: V; size: number; expiresAt: number };

/**
 * In-memory cache with a time to live, a maximum number of entries, and a maximum total size.
 * When the cache is full, the oldest entries are removed.
 */
export class TtlCache<V> {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly maxSize: number;
  private readonly sizeOf: (value: V) => number;
  private readonly now: () => number;
  private readonly entries = new Map<string, Entry<V>>();
  private totalSize = 0;

  constructor({
    ttlMs,
    maxEntries,
    maxSize = Infinity,
    sizeOf = () => 0,
    now = Date.now,
  }: TtlCacheOptions<V>) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.maxSize = maxSize;
    this.sizeOf = sizeOf;
    this.now = now;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.delete(key);
    const size = this.sizeOf(value);
    this.entries.set(key, { value, size, expiresAt: this.now() + this.ttlMs });
    this.totalSize += size;
    for (const oldestKey of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries && this.totalSize <= this.maxSize) {
        break;
      }
      this.delete(oldestKey);
    }
  }

  private delete(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.entries.delete(key);
    }
  }
}
