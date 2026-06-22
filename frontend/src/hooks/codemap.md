# `frontend/src/hooks/`

## Responsibility
Provides reusable React custom hooks that encapsulate data fetching, authentication workflows, formatting logic, and UI utility state. These hooks act as the primary interface between the UI layer (pages/components) and the data/storage layers (API client, Zustand stores, browser APIs). They abstract away React Query lifecycle management, Zustand selectors, and browser-intrinsic logic so that components remain declarative and side-effect-free.

## Design Patterns
- **Custom Hook Pattern**: Each export is a plain function that composes React primitives (`useState`, `useEffect`, `useMemo`) and library hooks (`useQuery`, `useMutation`, `useNavigate`, Zustand selectors) into reusable, testable units.
- **Mutation Wrapper Pattern** (`useAuth.ts`): `useLogin`, `useRegister`, and `useLogout` wrap `useMutation` from `@tanstack/react-query`. They attach `onSuccess`/`onError` callbacks that orchestrate store updates (`useAuthStore.login`/`logout`), navigation (`navigate`), and cache invalidation (`queryClient.clear()`).
- **Query Wrapper Pattern** (`useCategories.ts`, `useExchangeRates.ts`): Wrap `useQuery` with a predefined `queryKey` and `queryFn`, providing a stable cache key and default options (stale time, retry, refetch behavior). `useExchangeRates` extends the pattern with parameterized keys and a `select` transform.
- **Composite Hook Pattern** (`useFormatters.ts`): Consumes other hooks (`useAuthStore`, `useExchangeRates`) and derives multiple derived values (`formatCurrency`, `formatDate`, `convertFromBase`) via `useMemo`, composing lower-level hooks into a higher-level formatting interface.
- **Parameterized Generic Utility Hook** (`useDebouncedValue.ts`): A generic (`<T>`) hook that accepts a value and delay, returning a debounced copy. Implemented via `useState`/`useEffect`/`setTimeout` with cleanup.

## Data & Control Flow
1. **Authentication** (`useAuth.ts`):
   - `useLogin` → calls `authApi.login()` → on success, extracts `{ user, accessToken, refreshToken }` from response → calls `useAuthStore.login()` to persist session → navigates to `/dashboard`.
   - `useRegister` → calls `authApi.register()` → on success, navigates to `/login`.
   - `useLogout` → calls `authApi.logout()` → on success **or** error, calls `queryClient.clear()` to purge React Query cache, then `useAuthStore.logout()` to clear auth state and storage.

2. **Categories** (`useCategories.ts`):
   - `useCategories` → calls `categoryApi.getAll()` → React Query caches under `['categories'] key` → response data unwrapped at `res.data.data!`.

3. **Exchange Rates** (`useExchangeRates.ts`):
   - Accepts optional `baseCurrency` (default `'USD'`) → keyed as `['exchangeRates', baseCurrency]` → calls `fetchRates(baseCurrency)` → `select` extracts `.rates` from response → stale time set to 1 hour; no refetch on window focus; 1 retry.

4. **Formatters** (`useFormatters.ts`):
   - Reads `user.currency` and `user.locale` from `useAuthStore` → falls back to `CURRENCY_MAP` or `'en-US'` → calls `useExchangeRates('USD')` to get live rates → `useMemo` creates `Intl.NumberFormat` for currency, `Intl.DateTimeFormat` for dates, and a `convertFromBase` multiplier → returns all formatters + `currency` string + `currencySymbol`.

5. **Debounced Value** (`useDebouncedValue.ts`):
   - On every `value` or `delay` change, clears previous timer via cleanup → sets new timer → after `delay` ms, updates internal state → consumer receives stable debounced output.

## Integration Points
- **Imports**:
  - `@/api` — `authApi`, `categoryApi` (API client modules)
  - `@/api/exchangeRates` — `fetchRates`
  - `@/store/auth` — `useAuthStore` (Zustand auth store)
  - `@tanstack/react-query` — `useQuery`, `useMutation`, `useQueryClient`
  - `react-router-dom` — `useNavigate`
- **Consumers**:
  - Pages (`@/pages/*`) and components (`@/components/*`) consume these hooks to obtain data, trigger mutations, and access formatting utilities.
  - `useFormatters` internally depends on `useExchangeRates`, creating a composable dependency chain.
