/**
 * In-memory cache with a time to live and a maximum number of entries.
 * When the cache is full, the oldest entry is removed.
 */
export class TtlCache {
  /**
   * @param {{ ttlMs: number, maxEntries: number, now?: () => number }} options
   */
  constructor({ ttlMs, maxEntries, now = Date.now }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
    /** @type {Map<string, { value: any, expiresAt: number }>} */
    this.entries = new Map();
  }

  /** @param {string} key */
  get(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }
  }
}
