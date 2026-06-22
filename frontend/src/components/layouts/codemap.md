# frontend/src/components/layouts/

## Responsibility

Provides the two top-level page shell components that define the structural chrome around routed page content. `AppLayout` renders the authenticated application shell (sidebar, mobile nav, theme toggle, logout, user info) and guards access behind authentication. `AuthLayout` renders a centered, branded wrapper for login/register pages. Both use React Router's `<Outlet />` to render nested route content.

## Design Patterns

**Outlet Shell / Layout Wrapper Pattern:** Both layouts render `<Outlet />` inside a `Suspense` boundary, delegating page-specific rendering to child routes defined in the router configuration. This decouples layout structure from page content.

**Authentication Guard (AppLayout only):** `AppLayout` reads `isAuthenticated` from `useAuthStore()` (Zustand). On mount, a `useEffect` calls `navigate('/login', { replace: true })` if not authenticated. Additionally, a synchronous render-time `<Navigate to="/login" replace />` is returned as a fallback to prevent flash of protected content. This is a dual guard pattern (effect + render).

**Responsive Navigation Shell (AppLayout only):** Three navigation configurations are defined:
- **Desktop sidebar** (`hidden md:flex`): Full nav list (7 items) with active-link highlighting via `location.pathname` matching, animated entry with staggered `animation-delay`, user avatar/info, theme toggle, and logout.
- **Mobile bottom tab bar** (`fixed bottom-0 md:hidden`): 4 primary nav items (Home, Transactions, Budgets, Goals) with active indicator line and scale animation.
- **Mobile "More" drawer** (`fixed inset-0 z-50 md:hidden`): A bottom-sheet overlay for secondary nav items (Analytics, Notifications, Settings) plus theme toggle and logout. Opened via a state toggle (`moreOpen`), closed by backdrop click or pathname change (`useEffect` watching `location.pathname`).

**Zustand Store Integration:** Auth state (`useAuthStore`) and theme preference (`useThemeStore`) are consumed directly in the component. No prop drilling is needed — the layouts read from global stores.

**Suspense + Code Splitting Boundary:** Both layouts wrap `<Outlet />` in `<Suspense fallback={...}>`. `AppLayout` uses `LoadingPage` as fallback; `AuthLayout` uses an inline `Spinner` centered in a padded container. This enables lazy-loaded page components with a loading indicator.

**Compound Component Interface (implicit):** Both layouts accept no props — they are pure wiring components that rely on router context (`Outlet`, `useLocation`, `useNavigate`) and global store hooks.

## Data & Control Flow

1. **Router integration:** React Router renders either `AppLayout` or `AuthLayout` as a layout route. Child routes render into `<Outlet />`.
2. **Auth check (AppLayout):** On every render, `isAuthenticated` from `useAuthStore()` is checked. If false, `<Navigate to="/login">` is rendered immediately, and a `useEffect` also imperatively navigates (covers edge cases).
3. **Theme toggle:** `useThemeStore().toggle()` flips the dark mode flag. The `isDark` value controls the icon (Sun/Moon) and label text. The actual theme application happens elsewhere (likely a `ThemeProvider` in the root).
4. **Logout flow:** `useLogout()` (from `@/hooks/useAuth`) returns a mutation. `handleLogout` calls `logoutMutation.mutate()`, then imperatively navigates to `/login`.
5. **Navigation highlighting:** `useLocation().pathname` is compared to each nav item's `href` (exact match or prefix match for nested routes). Active items receive distinct styling classes via `cn()`.
6. **Mobile "More" drawer:** `moreOpen` state toggles the drawer overlay. A `useEffect` on `location.pathname` auto-closes the drawer on navigation. The overlay backdrop uses `onClick` to close; the drawer content stops propagation.
7. **Route content rendering:** `<Outlet />` is wrapped in `<Suspense fallback={<LoadingPage />}>` to handle lazy-loaded page components.

## Integration Points

- **React Router DOM:** `Outlet`, `Link`, `useLocation`, `useNavigate`, `Navigate` — all layout routing primitives.
- **`@/store/auth` (useAuthStore):** Zustand store providing `user`, `isAuthenticated`. Read by AppLayout for guard logic and user info display.
- **`@/store/theme` (useThemeStore):** Zustand store providing `isDark` and `toggle()`. Used for theme switch UI.
- **`@/hooks/useAuth` (useLogout):** Custom hook wrapping the logout API mutation. Called on logout button click.
- **`@/components/ui/spinner` (Spinner, LoadingPage):** Loading indicators used as Suspense fallbacks.
- **`@/lib/utils` (cn):** Tailwind CSS class merging utility used throughout.
- **Consumers:** All authenticated pages (dashboard, transactions, budgets, goals, analytics, notifications, settings) render inside `AppLayout`. Auth pages (login, register) render inside `AuthLayout`. The router configuration in the app root maps these as layout routes wrapping child page routes.
