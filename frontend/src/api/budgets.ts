import api from './client.js';
import { ApiResponse, Budget } from '@/types';

export const budgetApi = {
  getAll: () => api.get<ApiResponse<Budget[]>>('/budgets'),
  getById: (id: string) => api.get<ApiResponse<Budget>>(`/budgets/${id}`),
  create: (data: Partial<Budget>) => api.post<ApiResponse<Budget>>('/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.put<ApiResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};