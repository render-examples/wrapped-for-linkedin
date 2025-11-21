import type { ParsedExcelData } from './excel/types';

export interface CachedData {
  data: ParsedExcelData;
  uploadDate: number;
}

const CACHE_KEY = 'linkedin-wrapped-cache';

const getCachedItem = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as CachedData) : null;
  } catch (error) {
    console.error('Failed to load cache:', error);
    return null;
  }
};

export const storageManager = {
  save: (data: ParsedExcelData): void => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, uploadDate: Date.now() }));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  },

  load: (): CachedData | null => getCachedItem(),

  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  exists: (): boolean => getCachedItem() !== null,
};
