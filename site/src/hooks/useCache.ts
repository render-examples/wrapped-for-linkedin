import { useCallback, useEffect, useState, useRef } from 'react';
import { storageManager } from '@utils/storageManager';
import type { ParsedExcelData } from '@utils/excel/types';

export interface CacheState {
  data: ParsedExcelData | null;
  uploadDate: number | null;
  isLoaded: boolean;
}

export const useCache = (onCacheLoaded?: (data: ParsedExcelData, uploadDate: number) => void) => {
  const [cache, setCache] = useState<CacheState>({ data: null, uploadDate: null, isLoaded: false });
  const onCacheLoadedRef = useRef(onCacheLoaded);

  // Keep ref up to date
  useEffect(() => {
    onCacheLoadedRef.current = onCacheLoaded;
  });

  // Load cache on mount
  useEffect(() => {
    const cached = storageManager.load();
    if (cached) {
      setCache({ data: cached.data, uploadDate: cached.uploadDate, isLoaded: true });
      onCacheLoadedRef.current?.(cached.data, cached.uploadDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const save = useCallback((data: ParsedExcelData) => {
    storageManager.save(data);
    const now = Date.now();
    setCache({ data, uploadDate: now, isLoaded: false });
  }, []);

  const clear = useCallback(() => {
    storageManager.clear();
    setCache({ data: null, uploadDate: null, isLoaded: false });
  }, []);

  return { ...cache, save, clear };
};
