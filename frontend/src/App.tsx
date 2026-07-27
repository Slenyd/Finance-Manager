import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/index.js';
import { ErrorBoundary } from './components/error-boundary.js';
import { useThemeStore } from './store/theme.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  // Single source of truth: keep the <html> 'dark' class in sync with the
  // store on every change. This guarantees the DOM matches state even if the
  // store's own side effects don't fire (e.g. rehydrate edge cases).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}