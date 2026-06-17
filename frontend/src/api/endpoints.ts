import api from './client.js';
import { ApiResponse, Transaction, Category, Budget, SavingsGoal, Notification, DashboardData, User } from '@/types';

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; passwordConfirmation: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh'),
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, passwordConfirmation: string) =>
    api.post('/auth/reset-password', { token, password, passwordConfirmation }),
};

export const transactionApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Transaction[]> & { meta: import('@/types').PaginationMeta }>('/transactions', { params }),
  getById: (id: string) => api.get<ApiResponse<Transaction>>(`/transactions/${id}`),
  create: (data: Partial<Transaction>) => api.post<ApiResponse<Transaction>>('/transactions', data),
  update: (id: string, data: Partial<Transaction>) => api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/transactions/bulk', { data: { ids } }),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/transactions/summary', { params }),
};

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const budgetApi = {
  getAll: () => api.get<ApiResponse<Budget[]>>('/budgets'),
  getById: (id: string) => api.get<ApiResponse<Budget>>(`/budgets/${id}`),
  create: (data: Partial<Budget>) => api.post<ApiResponse<Budget>>('/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.put<ApiResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

export const goalApi = {
  getAll: () => api.get<ApiResponse<SavingsGoal[]>>('/goals'),
  getById: (id: string) => api.get<ApiResponse<SavingsGoal>>(`/goals/${id}`),
  create: (data: Partial<SavingsGoal>) => api.post<ApiResponse<SavingsGoal>>('/goals', data),
  update: (id: string, data: Partial<SavingsGoal>) => api.put<ApiResponse<SavingsGoal>>(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  contribute: (id: string, amount: number) => api.post(`/goals/${id}/contribute`, { amount }),
};

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/analytics/dashboard'),
  getMonthlySpending: (months = 6) => api.get(`/analytics/monthly-spending?months=${months}`),
  getCategoryBreakdown: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/category-breakdown', { params }),
  getCashFlow: (months = 12) => api.get(`/analytics/cash-flow?months=${months}`),
  getNetWorth: () => api.get('/analytics/net-worth'),
};

export const notificationApi = {
  getAll: () => api.get<ApiResponse<Notification[]> & { meta: { unreadCount: number } }>('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
