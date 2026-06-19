import api from './client.js';
import { ApiResponse, User } from '@/types';

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; passwordConfirmation: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh'),
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }) =>
    api.put<ApiResponse<null>>('/auth/password', data),
  updatePreferences: (data: { currency?: string; locale?: string }) =>
    api.put<ApiResponse<{ user: User }>>('/auth/preferences', data),
  deleteAccount: () => api.delete<ApiResponse<null>>('/auth/account'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, passwordConfirmation: string) =>
    api.post('/auth/reset-password', { token, password, passwordConfirmation }),
};