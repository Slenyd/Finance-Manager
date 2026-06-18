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
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string, passwordConfirmation: string) =>
    api.post('/auth/reset-password', { token, password, passwordConfirmation }),
};