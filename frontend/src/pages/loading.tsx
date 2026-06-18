import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MorphLoading } from '@/components/ui/morph-loading';
import { useAuthStore } from '@/store/auth';

export default function LoadingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 animate-fade-in">
      <MorphLoading size="lg" />
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">Welcome back</p>
        <p className="text-sm text-muted-foreground animate-pulse-soft">Loading your financial dashboard...</p>
      </div>
    </div>
  );
}
