import api from './client.js';
import { ApiResponse, Notification, PaginationMeta } from '@/types';

export const notificationApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Notification[]> & { meta: PaginationMeta & { unreadCount: number } }>('/notifications', { params }),
  markAsRead: (id: string) => api.patch<ApiResponse<null>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch<ApiResponse<null>>(`/notifications/read-all`),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/notifications/${id}`),
};