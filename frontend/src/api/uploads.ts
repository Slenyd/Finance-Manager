import api from './client.js';

export const uploadApi = {
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; data: { url: string }; message: string }>('/uploads/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteReceipt: (url: string) => api.delete<{ success: boolean; message: string }>('/uploads/receipt', { data: { url } }),
};