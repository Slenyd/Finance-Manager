# frontend/src/api/

## Responsibility

The API client layer that encapsulates all outbound HTTP communication between the frontend and the backend REST API (served at `VITE_API_URL` or `/api/v1` by default). It owns the shared axios instance, request/response interceptors, token refresh orchestration, and exposes per-domain service objects (`authApi`, `transactionApi`, etc.) that typed consumers (hooks, pages) call without interacting with axios directly. The one exception is `exchangeRates.ts`, which maintains its own dedicated client for a third-party FX API (frankfurter.app) and is not part of the main API gateway.

## Design Patterns

- **API Gateway (Single Axios Instance)** — `client.ts` creates and exports one configured `axios` instance (`api`) that all domain modules import. This centralizes base URL, timeout, credentials, content-type headers, and interceptors, preventing duplication across the codebase.

- **Service Object (Module-based Facades)** — Each domain (`auth`, `transactions`, `categories`, `budgets`, `goals`, `analytics`, `notifications`, `uploads`) exports a plain constant object whose methods are thin axios wrappers. There are no class instantiations — each object is a stateless collection of typed HTTP call factories.

- **Request Interceptor (Auth Injection)** — A `request` interceptor reads `accessToken` from the Zustand `useAuthStore` and attaches it as `Authorization: Bearer <token>` on every outgoing request. Null/undefined tokens cause the header to be omitted.

- **Response Interceptor (Automatic Token Refresh with Queue Deduplication)** — A `response` interceptor catches 401 errors on non-auth endpoints. It uses a `isRefreshing` flag + `pendingQueue` array to ensure only one refresh request (`POST /auth/refresh`) is in flight at a time; all concurrent 401-failed requests are queued as promises and replayed once the new token arrives. If refresh fails, the queue is rejected and the auth store calls `logout()`.

- **Barrel Re-export** — `index.ts` re-exports all named API objects from `.js` extensions (ESM module resolution), providing a single import entry point (`import { authApi, transactionApi, ... } from '@/api'`).

- **Standalone Client for External API** — `exchangeRates.ts` creates its own `axios.get()` call (not the shared `api` instance) targeting `https://api.frankfurter.app`, and includes a hardcoded `FALLBACK_RATES` dictionary for offline/error fallback, encapsulating a completely separate integration.

## Data & Control Flow

1. **Consumers import** from `@/api` (the barrel) or directly from a domain module (e.g. `@/api/transactions.js`). Each domain module imports the shared `api` instance from `./client.js`.

2. **Request construction**: The domain method calls `api.get<T>()`, `api.post<T>()`, etc., specifying the endpoint path and optional params/body. The generic `T` provides compile-time typing for the response `data` field.

3. **Request interceptor fires** — reads `useAuthStore.getState().accessToken`. If a token exists, sets `config.headers.Authorization = 'Bearer ${token}'`.

4. **Response handling (happy path)**: The response passes through the interceptor untouched and resolves with the full axios response object to the caller.

5. **401 error recovery (interceptor / token refresh flow)**:
   - If `error.response.status === 401`, `originalRequest._retry` is false, and the URL does not start with `/auth/`, the interceptor enters refresh logic.
   - **If a refresh is already in flight** (`isRefreshing === true`), the current request is parked as a promise in `pendingQueue`.
   - **Otherwise**, `_retry` is set to `true`, `isRefreshing` is set to `true`, and a standalone `axios.post()` (not the intercepted `api`) calls `/auth/refresh` with credentials.
   - On success: the new `accessToken` and `refreshToken` are written to the auth store via `store.login()`. The queue is resolved with `processQueue(null, newToken)` — each queued request gets the new token injected into its headers and is retried via `api(originalRequest)`. The original 401 request is also retried with the new token.
   - On failure: `processQueue(refreshError, null)` rejects all queued promises, `useAuthStore.getState().logout()` clears session state, and the original 401 promise rejects.
   - `finally` resets `isRefreshing = false`.

6. **Auth endpoints** (e.g. `/auth/login`) are excluded from the 401 interceptor to avoid infinite loops when credentials are invalid.

7. **`exchangeRates.ts`** follows an entirely separate flow: direct `axios.get()` to frankfurter.app with a 5-second timeout. On failure, it falls back to `FALLBACK_RATES` computed relative to the requested base currency. This module is not subject to interceptors, token injection, or the gateway instance.

## Integration Points

| File | External Dependency | Consumed By |
|---|---|---|
| `client.ts` | `axios` (npm), `@/store/auth` (Zustand store), `@/types` (TS interfaces) | Every domain module in this directory |
| `auth.ts` | `client.ts`, `@/types` | Auth hooks (`useAuth`, `useLogin`, `useRegister`), auth pages |
| `transactions.ts` | `client.ts`, `@/types` | Transaction hooks (`useTransactions`, `useTransaction`), transaction pages |
| `categories.ts` | `client.ts`, `@/types` | Category hooks (`useCategories`), category pickers, settings |
| `budgets.ts` | `client.ts`, `@/types` | Budget hooks (`useBudgets`), budget dashboard |
| `goals.ts` | `client.ts`, `@/types` | Goal hooks (`useGoals`), savings goals pages |
| `analytics.ts` | `client.ts`, `@/types` | Analytics hooks, dashboard widgets, reports |
| `notifications.ts` | `client.ts`, `@/types` | Notification hooks, notification dropdown/panel |
| `uploads.ts` | `client.ts`, `@/types` | Receipt upload components, transaction forms |
| `exchangeRates.ts` | `axios` (standalone, not shared instance) | Currency conversion hooks/widgets, budget/goal display |
| `index.ts` | (re-exports only) | Any consumer importing from `@/api` |

**Shared types consumed** (`@/types`): `ApiResponse<T>`, `User`, `Transaction`, `CreateTransactionDTO`, `UpdateTransactionDTO`, `Category`, `CreateCategoryDTO`, `UpdateCategoryDTO`, `Budget`, `CreateBudgetDTO`, `UpdateBudgetDTO`, `SavingsGoal`, `CreateGoalDTO`, `UpdateGoalDTO`, `PaginationMeta`, `TransactionSummary`, `DashboardData`, `MonthlySpendingData`, `CategoryBreakdownData`, `NetWorthData`, `OverviewData`, `Notification`.

**Shared store consumed** (`@/store/auth`): `useAuthStore` (Zustand) — provides `accessToken` (read) and `login()`, `logout()` (write) during token refresh.
