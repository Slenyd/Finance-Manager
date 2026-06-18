import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-amber-950 dark:via-amber-900 dark:to-stone-950 animate-gradient-shift">
      <div className="absolute inset-0 bg-background/20 dark:bg-background/40" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Finance Manager</h1>
          <p className="text-muted-foreground mt-2">Take control of your finances</p>
        </div>
        <div className="animate-scale-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
