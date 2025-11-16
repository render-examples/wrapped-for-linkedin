import { create } from 'zustand';
import type { AnalyticsData } from '../types';

interface AppState {
  fileId: string | null;
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  setFileId: (fileId: string) => void;
  setAnalyticsData: (data: AnalyticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  fileId: null,
  analyticsData: null,
  loading: false,
  error: null,
  setFileId: (fileId: string) => set({ fileId }),
  setAnalyticsData: (analyticsData: AnalyticsData) => set({ analyticsData }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  reset: () => set({
    fileId: null,
    analyticsData: null,
    loading: false,
    error: null,
  }),
}));
