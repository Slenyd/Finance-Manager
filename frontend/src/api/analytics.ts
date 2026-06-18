import api from './client.js';
import { ApiResponse, DashboardData } from '@/types';

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/analytics/dashboard'),
  getMonthlySpending: (months = 6) => api.get(`/analytics/monthly-spending?months=${months}`),
  getCategoryBreakdown: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/category-breakdown', { params }),
  getCashFlow: (months = 12) => api.get(`/analytics/cash-flow?months=${months}`),
  getNetWorth: () => api.get('/analytics/net-worth'),
  getOverview: () => api.get('/analytics/overview'),
};