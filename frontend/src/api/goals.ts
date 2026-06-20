import api from './client.js';
import { ApiResponse, SavingsGoal, CreateGoalDTO, UpdateGoalDTO } from '@/types';

export const goalApi = {
  getAll: () => api.get<ApiResponse<SavingsGoal[]>>('/goals'),
  getById: (id: string) => api.get<ApiResponse<SavingsGoal>>(`/goals/${id}`),
  create: (data: CreateGoalDTO) => api.post<ApiResponse<SavingsGoal>>('/goals', data),
  update: (id: string, data: UpdateGoalDTO) => api.put<ApiResponse<SavingsGoal>>(`/goals/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/goals/${id}`),
  contribute: (id: string, amount: number) => api.post<ApiResponse<SavingsGoal>>(`/goals/${id}/contribute`, { amount }),
};