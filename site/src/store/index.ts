import { create } from 'zustand';
import type { AnalyticsData } from '@types';
import type { ParsedExcelData } from '../utils/excel/types';

interface AppState {
  analyticsData: AnalyticsData | null;
  excelData: ParsedExcelData | null;
  loading: boolean;
  error: string | null;
  uploadDate: number | null;
  isFromCache: boolean;
  wrappedYear: number | null;
  setAnalyticsData: (data: AnalyticsData) => void;
  setExcelData: (data: ParsedExcelData, uploadDate?: number, isFromCache?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWrappedYear: (year: number | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  analyticsData: null,
  excelData: null,
  loading: false,
  error: null,
  uploadDate: null,
  isFromCache: false,
  wrappedYear: null,
  setAnalyticsData: (analyticsData: AnalyticsData) => set({ analyticsData }),
  setExcelData: (excelData: ParsedExcelData, uploadDate?: number, isFromCache?: boolean) => {
    // Extract year from discovery data if available
    const year = excelData.discovery_data?.end_date
      ? parseInt(excelData.discovery_data.end_date.split('-')[0])
      : null;

    return set({
      excelData,
      uploadDate: uploadDate ?? Date.now(),
      isFromCache: isFromCache ?? false,
      wrappedYear: year,
    });
  },
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setWrappedYear: (wrappedYear: number | null) => set({ wrappedYear }),
  reset: () => set({
    analyticsData: null,
    excelData: null,
    loading: false,
    error: null,
    uploadDate: null,
    isFromCache: false,
    wrappedYear: null,
  }),
}));
