import api from './client.js';
import { ApiResponse, Transaction, PaginationMeta, TransactionSummary, CreateTransactionDTO, UpdateTransactionDTO } from '@/types';

export const transactionApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Transaction[]> & { meta: PaginationMeta }>('/transactions', { params }),
  getById: (id: string) => api.get<ApiResponse<Transaction>>(`/transactions/${id}`),
  create: (data: CreateTransactionDTO) => api.post<ApiResponse<Transaction>>('/transactions', data),
  update: (id: string, data: UpdateTransactionDTO) => api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/transactions/${id}`),
  bulkDelete: (ids: string[]) => api.post<ApiResponse<null>>('/transactions/bulk-delete', { ids }),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<TransactionSummary>>('/transactions/summary', { params }),
};