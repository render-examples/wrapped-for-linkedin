/**
 * Keep the parsed data in localStorage.
 */

import type { ParsedExcelData } from '@utils/excel/types';

interface CachedData {
  data: ParsedExcelData;
  uploadDate: number;
}

const CACHE_KEY = 'wrapped-for-linkedin-cache';

export const storageManager = {
  save: (data: ParsedExcelData): void => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, uploadDate: Date.now() }));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  },

  load: (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? (JSON.parse(cached) as CachedData) : null;
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },
};
