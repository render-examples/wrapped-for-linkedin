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
  setAnalyticsData: (data: AnalyticsData) => void;
  setExcelData: (data: ParsedExcelData, uploadDate?: number, isFromCache?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  analyticsData: null,
  excelData: null,
  loading: false,
  error: null,
  uploadDate: null,
  isFromCache: false,
  setAnalyticsData: (analyticsData: AnalyticsData) => set({ analyticsData }),
  setExcelData: (excelData: ParsedExcelData, uploadDate?: number, isFromCache?: boolean) =>
    set({
      excelData,
      uploadDate: uploadDate ?? Date.now(),
      isFromCache: isFromCache ?? false,
    }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  reset: () => set({
    analyticsData: null,
    excelData: null,
    loading: false,
    error: null,
    uploadDate: null,
    isFromCache: false,
  }),
}));
