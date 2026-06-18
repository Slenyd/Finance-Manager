import api from './client.js';
import { ApiResponse, Category } from '@/types';

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};