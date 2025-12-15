import { useState, useCallback } from 'react';
import type { ParsedExcelData } from '@utils/excel/types';

interface UseSampleDataReturn {
  loadSampleData: () => Promise<void>;
  isLoading: boolean;
}

export function useSampleData(
  onDataLoaded: (data: ParsedExcelData) => void,
  onError: (error: Error) => void
): UseSampleDataReturn {
  const [isLoading, setIsLoading] = useState(false);

  const loadSampleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/demo-data/linkedin-demo.xlsx');
      if (!response.ok) throw new Error('Failed to load demo data');

      const blob = await response.blob();
      const file = new File([blob], 'linkedin-demo.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const { processExcelFile } = await import('@utils/excel/excelProcessor');
      const data = await processExcelFile(file);
      onDataLoaded(data);
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Failed to load sample data'));
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  return { loadSampleData, isLoading };
}
