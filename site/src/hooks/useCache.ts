import { useCallback, useEffect, useRef } from 'react';
import { storageManager } from '@utils/storageManager';
import type { ParsedExcelData } from '@utils/excel/types';

/**
 * Save and clear the parsed data in localStorage.
 * On mount, call `onCacheLoaded` with the saved data, if there is any.
 */
export function useCache(onCacheLoaded?: (data: ParsedExcelData, uploadDate: number) => void) {
  const onCacheLoadedRef = useRef(onCacheLoaded);

  useEffect(() => {
    onCacheLoadedRef.current = onCacheLoaded;
  });

  useEffect(() => {
    const cached = storageManager.load();
    if (cached) {
      onCacheLoadedRef.current?.(cached.data, cached.uploadDate);
    }
  }, []);

  const save = useCallback((data: ParsedExcelData) => storageManager.save(data), []);
  const clear = useCallback(() => storageManager.clear(), []);

  return { save, clear };
}
