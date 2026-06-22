import { useEffect, Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/theme';
import { LoadingPage } from '@/components/ui/spinner';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MoreDrawer } from './more-drawer';

export function AppLayout() {
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0 overscroll-y-contain">
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-40 safe-area-top">
          <h1 className="text-lg font-bold text-gradient">Coin Toss</h1>
          <Button variant="ghost" size="icon" onClick={toggle} className="hover:bg-accent" aria-label="Toggle dark mode">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="p-4 md:p-8">
          <Suspense fallback={<LoadingPage />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <MobileBottomNav moreOpen={moreOpen} setMoreOpen={setMoreOpen} />
      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
