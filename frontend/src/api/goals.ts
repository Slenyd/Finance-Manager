import api from './client.js';
import { ApiResponse, SavingsGoal } from '@/types';

export const goalApi = {
  getAll: () => api.get<ApiResponse<SavingsGoal[]>>('/goals'),
  getById: (id: string) => api.get<ApiResponse<SavingsGoal>>(`/goals/${id}`),
  create: (data: Partial<SavingsGoal>) => api.post<ApiResponse<SavingsGoal>>('/goals', data),
  update: (id: string, data: Partial<SavingsGoal>) => api.put<ApiResponse<SavingsGoal>>(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  contribute: (id: string, amount: number) => api.post(`/goals/${id}/contribute`, { amount }),
};