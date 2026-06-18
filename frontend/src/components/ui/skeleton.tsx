import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        variant === 'default' ? 'animate-pulse' : 'animate-shimmer',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
