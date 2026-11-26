/**
 * Keep the parsed data in localStorage.
 */

import type { ParsedExcelData } from '@utils/excel/types';

// Increase this number when ParsedExcelData changes. The app then ignores data saved by older versions.
export const CACHE_VERSION = 1;

interface CachedData {
  version: number;
  data: ParsedExcelData;
  uploadDate: number;
}

const CACHE_KEY = 'wrapped-for-linkedin-cache';

function isCurrentCache(value: unknown): value is CachedData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const cached = value as Partial<CachedData>;
  return (
    cached.version === CACHE_VERSION &&
    typeof cached.data === 'object' &&
    cached.data !== null &&
    !Array.isArray(cached.data)
  );
}

export const storageManager = {
  save: (data: ParsedExcelData): void => {
    try {
      const cached: CachedData = { version: CACHE_VERSION, data, uploadDate: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  },

  /** Returns null, and clears the cache, if the saved data is from another version or is not valid. */
  load: (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }
      const parsed: unknown = JSON.parse(cached);
      if (isCurrentCache(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
    storageManager.clear();
    return null;
  },

  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },
};
