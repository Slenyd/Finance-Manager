import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PageTransition({ children, className, delay = 0 }: PageTransitionProps) {
  return (
    <div
      className={cn('animate-fade-in-up', className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className, index = 0, baseDelay = 50, staggerBy = 80 }: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  baseDelay?: number;
  staggerBy?: number;
}) {
  return (
    <div
      className={cn('animate-slide-up', className)}
      style={{
        animationDelay: `${baseDelay + index * staggerBy}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
