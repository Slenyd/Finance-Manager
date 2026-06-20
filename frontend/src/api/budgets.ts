import api from './client.js';
import { ApiResponse, Budget, CreateBudgetDTO, UpdateBudgetDTO } from '@/types';

export const budgetApi = {
  getAll: () => api.get<ApiResponse<Budget[]>>('/budgets'),
  getById: (id: string) => api.get<ApiResponse<Budget>>(`/budgets/${id}`),
  create: (data: CreateBudgetDTO) => api.post<ApiResponse<Budget>>('/budgets', data),
  update: (id: string, data: UpdateBudgetDTO) => api.put<ApiResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/budgets/${id}`),
};