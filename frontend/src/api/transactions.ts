import api from './client.js';
import { ApiResponse, Transaction, PaginationMeta } from '@/types';

export const transactionApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Transaction[]> & { meta: PaginationMeta }>('/transactions', { params }),
  getById: (id: string) => api.get<ApiResponse<Transaction>>(`/transactions/${id}`),
  create: (data: Partial<Transaction>) => api.post<ApiResponse<Transaction>>('/transactions', data),
  update: (id: string, data: Partial<Transaction>) => api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  bulkDelete: (ids: string[]) => api.post('/transactions/bulk-delete', { ids }),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/transactions/summary', { params }),
};