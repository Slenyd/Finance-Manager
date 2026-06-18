import { useEffect, Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LoadingPage } from '@/components/ui/spinner';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Target, BarChart3, Bell, Settings, LogOut, Moon, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const bottomNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Txns', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budget', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'More', icon: Settings },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r bg-card hidden md:flex flex-col animate-slide-down">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gradient">Finance Manager</h1>
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
          <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-accent" onClick={toggle}>
            {isDark ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-5 w-5 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
          <h1 className="text-lg font-bold text-gradient">Finance Manager</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="hover:bg-accent">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <Suspense fallback={<LoadingPage />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden flex items-center justify-around safe-area-bottom shadow-lg">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1 text-[10px] font-medium transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              <span className={cn('truncate', isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
