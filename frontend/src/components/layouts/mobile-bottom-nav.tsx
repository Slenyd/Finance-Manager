import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bottomNav, moreNav } from './nav-config';

interface MobileBottomNavProps {
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
}

export function MobileBottomNav({ moreOpen, setMoreOpen }: MobileBottomNavProps) {
  const location = useLocation();

  const isMoreActive = moreNav.some((item) =>
    location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden flex items-center justify-around safe-area-bottom shadow-lg">
      {bottomNav.map((item) => {
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-[10px] font-medium transition-all duration-200',
              isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
            )}
          >
            <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
            <span className={cn('truncate', isActive && 'font-semibold')}>{item.label}</span>
            {isActive && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />}
          </Link>
        );
      })}
      <button
        onClick={() => setMoreOpen(true)}
        className={cn(
          'flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-[10px] font-medium transition-all duration-200',
          isMoreActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
        )}
        aria-label="More navigation"
      >
        <MoreHorizontal className={cn('h-5 w-5 transition-transform duration-200', moreOpen && 'scale-110')} />
        <span className={cn('truncate', isMoreActive && 'font-semibold')}>More</span>
        {isMoreActive && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />}
      </button>
    </nav>
  );
}
