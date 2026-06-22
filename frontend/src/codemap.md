# frontend/src/

## Responsibility
Application source code for the React SPA. Organized by functional concern across 10 subdirectories.

## Design
- **api/**: 11 service modules (API Gateway pattern), Axios client with interceptor-based token refresh queue, barrel re-export
- **components/**: forms (4 dialog components), layouts (AppLayout + AuthLayout), ui (14 Radix-based primitives)
- **hooks/**: 5 custom hooks (useAuth, useCategories, useDebouncedValue, useExchangeRates, useFormatters)
- **pages/**: 12 page components with data fetching, chart rendering, auth flows, form orchestration
- **store/**: Zustand auth store (memory-only tokens, obfuscated persistence) + theme store (persist middleware)
- **routes/**: React Router v6 tree with lazy-loaded routes, AuthLayout/AppLayout nesting
- **schemas/**: Zod validation schemas for 6 forms, cross-field refinements, inferred types
- **lib/**: crypto.ts (obfuscation pipeline), utils.ts (Tailwind class merging)
- **types/**: Entity interfaces, analytics DTOs, ApiResponse envelope, pagination meta

## Flow
Entry: `main.tsx` → `routes/index.tsx` (router) → lazy page → hooks (TanStack Query) → api/ service → Axios interceptor → backend

## Integration
- `api/client.ts` is the shared Axios instance with auth interceptor
- `store/auth.ts` provides auth state to layouts and pages
- `hooks/useFormatters.ts` provides currency/date formatting to all pages
- `components/ui/` primitives consumed by forms, layouts, and pages