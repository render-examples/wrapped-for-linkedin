import { useCallback, useEffect, useEffectEvent } from 'react';
import { storageManager } from '@utils/storageManager';
import type { ParsedExcelData } from '@utils/excel/types';

/**
 * Save and clear the parsed data in localStorage.
 * On mount, call `onCacheLoaded` with the saved data, if there is any.
 */
export function useCache(onCacheLoaded?: (data: ParsedExcelData, uploadDate: number) => void) {
  const handleCacheLoaded = useEffectEvent((data: ParsedExcelData, uploadDate: number) => {
    onCacheLoaded?.(data, uploadDate);
  });

  useEffect(() => {
    const cached = storageManager.load();
    if (cached) {
      handleCacheLoaded(cached.data, cached.uploadDate);
    }
  }, []);

  const save = useCallback((data: ParsedExcelData) => storageManager.save(data), []);
  const clear = useCallback(() => storageManager.clear(), []);

  return { save, clear };
}
