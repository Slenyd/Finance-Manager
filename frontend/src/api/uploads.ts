import api from './client.js';
import { ApiResponse } from '@/types';

export const uploadApi = {
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ url: string }>>('/uploads/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteReceipt: (url: string) => api.post<ApiResponse<null>>('/uploads/receipt/delete', { url }),
};