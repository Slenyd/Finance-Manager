import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/theme';
import { useLogout } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { moreNav } from './nav-config';

interface MoreDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MoreDrawer({ open, onClose }: MoreDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useThemeStore();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    navigate('/login');
  }, [logoutMutation, navigate]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full bg-card rounded-t-2xl p-4 pb-8 safe-area-bottom shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">More</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="space-y-1">
          {moreNav.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground active:bg-accent',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <div className="border-t my-2" />
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground transition-all duration-200 active:scale-[0.98] active:bg-accent w-full"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-destructive transition-all duration-200 active:scale-[0.98] active:bg-destructive/10 w-full"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
