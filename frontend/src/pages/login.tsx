import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, LoginForm } from '@/schemas';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  const login = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !isRedirecting.current) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    isRedirecting.current = true;
    login.mutate(data);
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              {errors.email && (
                <span className="text-xs text-destructive font-medium animate-scale-in">Required</span>
              )}
            </div>
            <Input id="email" type="email" placeholder="user@example.com" {...register('email')} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              {errors.password && (
                <span className="text-xs text-destructive font-medium animate-scale-in">Required</span>
              )}
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register('rememberMe')}
            />
            <Label htmlFor="rememberMe" className="text-sm cursor-pointer">Remember me</Label>
          </div>
          {login.error && (
            <p className="text-sm text-destructive">
              {(login.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? <><Spinner size="sm" className="mr-2 inline-block" /> Signing in...</> : 'Sign in'}
          </Button>
          <div className="flex items-center justify-between w-full text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-primary hover:underline">Create account</Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
