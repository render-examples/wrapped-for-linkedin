import axios from 'axios';
import type { UploadResponse } from '@types';

const API_BASE = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getEngagementMetrics = async (fileId: string) => {
  const response = await api.get(`/analytics/engagement/${fileId}`);
  return response.data;
};

export const getDemographicInsights = async (fileId: string) => {
  const response = await api.get(`/analytics/demographics/${fileId}`);
  return response.data;
};

export default api;
