import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useLogout } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { navItems } from './nav-config';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    navigate('/login');
  }, [logoutMutation, navigate]);

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col animate-slide-down">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gradient">Coin Toss</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 animate-fade-in',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm nav-link-active'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-medium shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-accent" onClick={toggle} aria-label="Toggle dark mode">
          {isDark ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-5 w-5 mr-2" /> Logout
        </Button>
      </div>
    </aside>
  );
}
