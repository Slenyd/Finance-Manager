import { memo } from 'react';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-in' | 'fade-in-up' | 'fade-in-down' | 'slide-up' | 'slide-in-right' | 'scale-in' | 'bounce-in';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimationType;
}

const animationClasses: Record<AnimationType, string> = {
  'fade-in': 'animate-fade-in',
  'fade-in-up': 'animate-fade-in-up',
  'fade-in-down': 'animate-fade-in-down',
  'slide-up': 'animate-slide-up',
  'slide-in-right': 'animate-slide-in-right',
  'scale-in': 'animate-scale-in',
  'bounce-in': 'animate-bounce-in',
};

export function PageTransition({ children, className, delay = 0, animation = 'fade-in-up' }: PageTransitionProps) {
  return (
    <div
      className={cn(animationClasses[animation], className)}
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
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

function StaggerItemBase({ children, className, index = 0, baseDelay = 50, staggerBy = 80, animation = 'slide-up' }: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  baseDelay?: number;
  staggerBy?: number;
  animation?: AnimationType;
}) {
  return (
    <div
      className={cn(animationClasses[animation], className)}
      style={{
        animationDelay: `${baseDelay + index * staggerBy}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

export const StaggerItem = memo(StaggerItemBase);
