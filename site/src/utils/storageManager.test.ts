import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_VERSION, storageManager } from '@utils/storageManager';

const CACHE_KEY = 'wrapped-for-linkedin-cache';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('storageManager.load', () => {
  it('returns a valid entry', () => {
    storageManager.save({ top_posts: [] });
    expect(storageManager.load()?.data).toEqual({ top_posts: [] });
  });

  it('returns null and clears the cache for an old version', () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION - 1, data: {}, uploadDate: 1 }),
    );
    expect(storageManager.load()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('returns null and clears the cache when the version is missing', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: {}, uploadDate: 1 }));
    expect(storageManager.load()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('returns null and clears the cache when data is not an object', () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, data: 'text', uploadDate: 1 }),
    );
    expect(storageManager.load()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('returns null and clears the cache for invalid JSON', () => {
    localStorage.setItem(CACHE_KEY, '{not json');
    expect(storageManager.load()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });
});
