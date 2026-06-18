import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res, variables) => {
      const { user, accessToken, refreshToken } = res.data.data!;
      login(user, accessToken, refreshToken, variables.rememberMe ?? false);
      navigate('/loading');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate('/login');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
    },
    onError: () => {
      logout();
    },
  });
}

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await authApi.getProfile();
      setUser(res.data.data!.user);
      return res.data.data!.user;
    },
    retry: false,
  });
}
