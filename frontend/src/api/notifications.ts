import api from './client.js';
import { ApiResponse, Notification } from '@/types';

export const notificationApi = {
  getAll: () => api.get<ApiResponse<Notification[]> & { meta: { unreadCount: number } }>('/notifications'),
  markAsRead: (id: string) => api.patch<ApiResponse<null>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch<ApiResponse<null>>('/notifications/read-all'),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/notifications/${id}`),
};