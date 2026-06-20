import api from './client.js';
import { ApiResponse, Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/types';

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: CreateCategoryDTO) => api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: UpdateCategoryDTO) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/categories/${id}`),
};