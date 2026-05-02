// src/services/analyticsService.js
import { apiGet } from './api';
import { analyticsData, systemAlerts } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const getAnalytics = async () => {
  if (USE_MOCK) return analyticsData;
  return apiGet('/analytics');
};

export const getSystemAlerts = async () => {
  if (USE_MOCK) return systemAlerts;
  return apiGet('/alerts');
};

export const dismissAlert = async (id) => {
  if (USE_MOCK) { console.log('[MOCK] dismissAlert', id); return { success: true }; }
  return apiGet(`/alerts/${id}/dismiss`);
};
