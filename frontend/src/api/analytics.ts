import api from './client.js';
import { ApiResponse, DashboardData, MonthlySpendingData, CategoryBreakdownData, NetWorthData, OverviewData } from '@/types';

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/analytics/dashboard'),
  getMonthlySpending: (months = 6) =>
    api.get<ApiResponse<MonthlySpendingData[]>>(`/analytics/monthly-spending?months=${months}`),
  getCategoryBreakdown: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<CategoryBreakdownData[]>>('/analytics/category-breakdown', { params }),
  getCashFlow: (months = 12) =>
    api.get<ApiResponse<MonthlySpendingData[]>>(`/analytics/cash-flow?months=${months}`),
  getNetWorth: () => api.get<ApiResponse<NetWorthData>>('/analytics/net-worth'),
  getOverview: () => api.get<ApiResponse<OverviewData>>('/analytics/overview'),
};