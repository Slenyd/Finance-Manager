# `frontend/src/routes/`

## Responsibility
Defines the client-side routing tree for the application using React Router v6. This module is the single source of truth for URL-to-page mappings, layout nesting, lazy-loading boundaries, and redirect rules. It configures `createBrowserRouter` with both public (auth) and authenticated (app) route groups.

## Design Patterns
- **Lazy Loading with `React.lazy`**: Every page component is imported via `lazy(() => import('@/pages/...'))`, enabling code splitting at the route level. React Router suspends rendering until each chunk loads.
- **Layout Nesting (Outlet Pattern)**: Two layout wrappers (`AuthLayout`, `AppLayout`) are assigned as parent route elements. Their child routes render into the parent's `<Outlet />`, handling shared chrome (headers, sidebars, auth redirect guards).
- **Route Grouping**: Routes are logically grouped:
  - **Auth group** (path `/` + `AuthLayout`): login, register, forgot-password, reset-password. Root redirect (`index`) navigates to `/login`.
  - **App group** (path `/` + `AppLayout`): dashboard, transactions, budgets, goals, analytics, notifications, settings.
  - **Standalone route**: `/loading` renders `LoadingPage` outside any layout.
  - **Catch-all**: `path: '*'` redirects to `/dashboard`.
- **Index Route Redirect**: `{ index: true, element: <Navigate to="/login" replace /> }` ensures the root path `/` immediately forwards to the login page.
- **Static Router Configuration**: The router object is exported as a named constant (`router`), created once at module load time via `createBrowserRouter`.

## Data & Control Flow
1. **Module initialization**: `routes/index.tsx` executes at bundle load → all `lazy()` calls register dynamic imports → `createBrowserRouter(...)` produces the router config → the router is passed to `<RouterProvider>` in the React tree.
2. **Navigation flow**:
   - Unauthenticated user hits `/` → `AuthLayout` renders `LoginPage` (via index redirect → `/login`).
   - User logs in → hook `useLogin` calls `navigate('/dashboard')` → router matches `/dashboard` inside `AppLayout`.
   - User logs out → auth guard (presumably inside `AppLayout`) redirects to `/login`.
   - Unknown routes (`*`) cascade to `/dashboard`.
3. **Chunk loading**: When a route match triggers a `lazy` component, React Suspense shows a fallback (not defined here — likely set in `<RouterProvider>`'s `fallbackElement` or a Suspense boundary higher in the tree).

## Integration Points
- **Imports**:
  - `@/components/layouts/app-layout` — `AppLayout` (authenticated app chrome)
  - `@/components/layouts/auth-layout` — `AuthLayout` (public auth chrome)
  - `@/pages/login`, `register`, `forgot-password`, `reset-password`, `dashboard`, `transactions`, `budgets`, `goals`, `analytics`, `notifications`, `settings`, `loading`
- **Exports**:
  - `router` — consumed by the React entry point (`main.tsx` or equivalent) via `<RouterProvider router={router} />`
- **Consumers**:
  - Root application component — mounts the router via `@tanstack/react-router`'s `RouterProvider` (or React Router's).
  - `useLogin`, `useLogout` hooks — programmatic navigation triggers route transitions defined here.
