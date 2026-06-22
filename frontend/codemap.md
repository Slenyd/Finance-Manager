# frontend/

## Responsibility
React 18 + Vite SPA providing the user interface for personal finance management: dashboard, transactions, budgets, savings goals, analytics, settings, and authentication flows.

## Design
- Component-based architecture with 12 pages, 14 UI primitives, 4 form dialogs, 2 layouts
- Server state via TanStack Query, client state via Zustand (auth, theme)
- Axios API gateway with interceptor-based token refresh queue
- React Router v6 with lazy-loaded routes and Suspense code-splitting
- shadcn/ui (Radix) headless component library with CVA variant styling
- react-hook-form + Zod for form validation
- Recharts for data visualization
- Tailwind CSS for styling, dark mode via class strategy

## Flow
1. User navigates → React Router matches route → lazy-loaded page component
2. Page → TanStack Query hook → API service module → Axios interceptor (attach Bearer, queue refresh on 401)
3. API response → Query cache → component re-render → UI
4. Mutations → Query invalidation → automatic refetch
5. Auth state → Zustand store (memory-only access token, obfuscated persistence for metadata)

## Integration
- Consumes backend API at `/api/v1/*` (Vercel rewrites in prod, proxy in dev)
- Exchange rates from frankfurter.app (standalone client, cached 1h)
- Vercel Blob for receipt uploads
- Deployed as static SPA on Vercel