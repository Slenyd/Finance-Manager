import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  if (variant === 'gradient') {
    return (
      <div className={cn('relative', className)} role="status" aria-label="Loading">
        <div
          className={cn(
            'rounded-full animate-spin',
            'border-2 border-border',
            sizeMap[size],
          )}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-spin',
            'border-2 border-t-transparent border-l-transparent',
            'border-r-primary border-b-primary',
            sizeMap[size],
          )}
          style={{ animationDirection: 'reverse', animationDuration: '0.6s' }}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeMap[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-12', className)}>
      <Spinner size="lg" variant="gradient" />
    </div>
  );
}

export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in">
      <Spinner size="lg" variant="gradient" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
