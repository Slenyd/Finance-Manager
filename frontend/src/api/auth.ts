import api from './client.js';
import { ApiResponse, User } from '@/types';

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; passwordConfirmation: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  refresh: () => api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh'),
  getProfile: () => api.get<ApiResponse<User>>('/auth/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch<ApiResponse<{ user: User }>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }) =>
    api.patch<ApiResponse<null>>('/auth/me/password', data),
  updatePreferences: (data: { currency?: string; locale?: string }) =>
    api.patch<ApiResponse<{ user: User }>>('/auth/preferences', data),
  deleteAccount: () => api.delete<ApiResponse<null>>('/auth/account'),
  forgotPassword: (email: string) => api.post<ApiResponse<null>>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, passwordConfirmation: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password, passwordConfirmation }),
};