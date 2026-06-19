# Finance Manager — Project Context

## Goal
Deploy and optimize the full-stack Finance Manager on Vercel (frontend + backend) with working auth flow, then iteratively review and fix code quality, performance, UX, and accessibility issues.

## Constraints & Preferences
- Color scheme centered around hex `#704c35` (warm brown)
- Loading page between login and dashboard uses morph-loading animation from 21st.dev
- Deployment target is Vercel only
- Keep existing shadcn/ui component structure

## Architecture
- **Monorepo root**: `C:\Users\User\Desktop\Code\finance-manager`
- **Frontend**: `frontend/` — Vite + React + TypeScript + shadcn/ui + Recharts + Zustand + react-query + react-router-dom
- **Backend**: `backend/` — Express + TypeScript + Prisma + JWT auth
- **Database**: Supabase PostgreSQL (pooler URL on port 6543)
- **Deploy**: Vercel CLI (manual `vercel --prod`), NOT Git auto-deploy. Two projects: `finance-manager` (frontend) and `finance-manager-backend` (backend)

## Deployment
- Frontend: `vercel --prod` from `frontend/` directory
- Backend: `vercel --prod --project finance-manager-backend` from `backend/` directory
- Vercel CLI 54.14.2, authenticated as `slenyd` under `slenyds-projects` scope
- **Git auto-deploy is enabled** — pushes to `main` auto-deploy on Vercel
- Frontend uses Vercel rewrite proxy (`/api/*` → backend URL) — same-origin, no CORS
- **Required Vercel env vars for backend**: `BLOB_READ_WRITE_TOKEN` (Vercel Blob), `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Upstash Redis for rate limiting), `CRON_SECRET` (auth for cron endpoint)

## Seeded Login
- `user@financemanager.com` / `Password123`
- `admin@financemanager.com` / `Password123`

## Key Decisions
- `VITE_API_URL` removed from Vercel — `.env.production` exclusively controls build-time value
- Auth middleware trusts JWT claims instead of DB lookup per request — `isLocked` check removed from middleware (only checked at login)
- `asyncHandler` type simplified to avoid TS2742 portable type errors
- API modules split by domain for tree-shaking and maintainability
- Form dialogs lazy-loaded to reduce initial bundle size
- node-cron conditional import avoids loading the module on Vercel serverless
- `POSTGRES_PRISMA_URL` on Vercel = Supabase pooler URL (port 6543 with PgBouncer)
- `NODE_ENV=production` on Vercel backend
- Rate limiter uses Upstash Redis store via `@upstash/redis` when `KV_REST_API_URL`/`KV_REST_API_TOKEN` env vars are set; falls back to in-memory for local dev
- Cron jobs: Vercel Cron calls `POST /api/v1/cron/recurring` daily; node-cron still runs in non-serverless environments
- File uploads use `@vercel/blob` for receipt storage; multer with memory storage for multipart parsing

## Completed Work

### Backend Performance
- Fixed Winston File transport, `database.ts` signal handlers, and `globalForPrisma` — all guarded with `!process.env.VERCEL`
- Added `binaryTargets = ["native", "linux-musl"]` to Prisma schema
- Changed Prisma datasource from `DATABASE_URL` to `POSTGRES_PRISMA_URL`
- **N+1 fixes**: BudgetService uses `$transaction`, AnalyticsService uses aggregates + single queries, TransactionService.getSummary uses aggregates
- **RecurringService N+1 fix**: replaced sequential loop (2N+1 queries) with single `prisma.$transaction([...creates, ...updates])` batch
- **Compression middleware** added (`compression()` in `app.ts`)
- **Composite indexes** added to Transaction model: `[userId, date]`, `[userId, type]`, `[userId, categoryId]`, `[userId, date, type]`
- **Cache-Control headers** on all analytics endpoints (private, max-age 60-300)
- **Auth middleware**: eliminated DB query — user claims (`name`, `email`, `isVerified`) now embedded in JWT
- **node-cron** import gated behind `!process.env.VERCEL` (conditional `require()` in `server.ts`)
- **Notification findAll+count** batched into `Promise.all` (removed separate `getUnreadCount` method)
- **Prisma logging** reduced in production (only errors), explicit datasource URL in constructor
- **SQL injection fixed**: `$queryRawUnsafe` → `Prisma.sql` tagged template in `AnalyticsService.getNetWorth`
- **SQL injection fixed**: `$queryRawUnsafe` → `Prisma.sql` tagged template in `AnalyticsService.getNetWorth`
- **All backend controllers** standardized to `asyncHandler` (no more manual try/catch)
- **Analytics overview endpoint**: `GET /api/v1/analytics/overview` combines dashboard + monthly spending
- Unlocked 12 locked accounts via seed

### Backend Infrastructure
- **File upload support**: `@vercel/blob` + multer (memory storage) for receipt uploads; `POST /api/v1/uploads/receipt`, `DELETE /api/v1/uploads/receipt`; 5MB max, JPEG/PNG/WebP/PDF; URL validation + ownership check on delete; sanitized filenames
- **Rate limiter**: `UpstashRateLimitStore` custom store using `@upstash/redis` with Lua script for correct fixed-window behavior; falls back to in-memory for local dev; error handling with graceful fallback
- **Vercel Cron**: `POST /api/v1/cron/recurring` endpoint requires `CRON_SECRET` header; returns 503 if not configured; `backend/vercel.json` configures daily midnight schedule
- **docker-compose.yml**: removed insecure fallback defaults; uses `${VAR:?error}` pattern; added `.env.docker.example` template
- **RecurringService**: `processRecurringTransactions()` now returns `{ processed: number }` for cron reporting

### Security Fixes
- **Cron auth**: endpoint denies all requests when `CRON_SECRET` missing (was previously open)
- **Upload security**: SSRF prevention — receipt delete validates URL belongs to blob store + ownership check via `head()` API; filenames sanitized; MIME validation in service layer uses `ValidationError`/`ApiError` instead of raw `Error`
- **Transaction field injection**: `TransactionService.create`/`update` replaced `any` types with explicit `CreateTransactionData`/`UpdateTransactionData` interfaces; only whitelisted fields passed to Prisma
- **Auth validation**: `/auth/refresh` now uses dedicated `refreshSchema` instead of `loginSchema`; extracted `passwordSchema` to eliminate duplication
- **Error handler**: production mode returns generic `'Internal server error'` — no leaking `err.message`
- **Rate limiter**: Lua script `INCR`+`EXPIRE` only on first hit (correct fixed-window); memory store evicts expired entries; Redis failures gracefully fall back
- **Password reset**: tokens stored as SHA-256 hash in DB; `resetPassword` hashes incoming token before lookup; all refresh tokens revoked after password reset
- **Validation middleware**: `validate()` now reassigns `req.query` and `req.params` in addition to `req.body` — Zod coercions no longer lost
- **Falsy value bugs**: `goal.service` and `budget.service` update methods now use `!== undefined` instead of truthiness checks — `0` and `""` are no longer silently ignored
- **Goal contribution validation**: `contribute()` rejects non-positive amounts with `ValidationError`
- **Atomic category deletion**: category delete now uses `prisma.$transaction()` for transaction reassignment, budget reassignment, and category deletion — no partial state on failure
- **Database config**: `database.ts` uses `POSTGRES_PRISMA_URL || DATABASE_URL` fallback chain matching `config/index.ts`

### Frontend Performance
- **Frontend API modules split**: `api/endpoints.ts` → 7 domain modules + barrel `index.ts`; old file deleted
- **Form dialogs lazy-loaded**: `TransactionFormDialog`, `BudgetFormDialog`, `GoalFormDialog`, `ContributeFormDialog` via `React.lazy()` + `Suspense`
- **Loading delay** reduced from 2.5s to 800ms; login navigates directly to `/dashboard`
- **Auth redirect fixed**: removed `window.location.href = '/login'` on refresh failure (just `logout()`)
- **useProfile store mutation** removed from `queryFn` (was causing unnecessary re-renders)
- **Frontend static asset caching**: `Cache-Control: immutable, max-age=31536000` for `/assets/*` and static file types in `vercel.json`
- **Axios timeout** (15s) added to API client
- **Intl formatters** cached at module level in `frontend/src/lib/utils.ts`
- **Dead code** removed from `frontend/src/lib/crypto.ts` (unused `TextEncoder.encode` block)

### UX & Accessibility
- **Dark mode double-toggle** fixed (removed redundant `useEffect` in App.tsx; added `onRehydrateStorage` callback)
- **Auth store double persist** on token refresh fixed (removed `setAccessToken` call, just `login`)
- **React error #310 fixed**: Moved `useMemo` hooks above early returns in `dashboard.tsx`
- **React ErrorBoundary** wraps app with recovery UI and "Try Again" button
- **Delete confirmation dialogs** on transactions, budgets, goals, notifications, categories
- **aria-label** added to all icon-only buttons (edit, delete, theme toggle, logout)
- **Dashboard pie chart title** fixed: "Income vs Expenses Breakdown"
- **Analytics error states** with retry button added
- **Categories page**: added route + sidebar nav entry, delete confirmation, aria-labels, Select for type instead of textarea
- **Budget form**: replaced fragile `<textarea>` category name matching with proper `<Select>` dropdown that binds `categoryId` directly; also replaced bare `<select>` for period with shadcn `Select`
- **BarChart tooltip**: set `cursor={false}` and transparent `contentStyle` to prevent white overlay on hover

### CI & Config
- **CI fix**: Added `POSTGRES_PRISMA_URL` to `.github/workflows/ci.yml`

## Relevant Files
- `backend/src/middlewares/auth.ts`: JWT-only auth, no DB query, user claims in token
- `backend/src/services/analytics.service.ts`: aggregates + `$queryRaw` with `Prisma.sql`; `getOverview` combined endpoint
- `backend/src/services/budget.service.ts`: `$transaction` for batched aggregates
- `backend/src/services/recurring.service.ts`: batched `$transaction` instead of N+1 loop
- `backend/src/services/notification.service.ts`: `Promise.all` for findAll+count
- `backend/src/controllers/*.ts`: all use `asyncHandler`
- `backend/src/utils/asyncHandler.ts`: simplified type signature
- `backend/src/server.ts`: conditional `require('./jobs')` behind `!VERCEL`
- `backend/src/middlewares/rateLimiter.ts`: UpstashRateLimitStore with KV fallback to in-memory
- `backend/src/middlewares/rateLimitStore.ts`: custom express-rate-limit store using @upstash/redis
- `backend/src/services/upload.service.ts`: Vercel Blob receipt upload/delete
- `backend/src/controllers/upload.controller.ts`: upload/delete receipt endpoints
- `backend/src/routes/upload.routes.ts`: multer memory storage + upload routes
- `backend/src/controllers/cron.controller.ts`: cron endpoint for recurring transactions
- `backend/src/routes/cron.routes.ts`: cron route with CRON_SECRET auth
- `backend/src/config/index.ts`: added cronSecret field
- `backend/vercel.json`: Vercel Cron config for daily recurring transactions
- `frontend/src/api/uploads.ts`: receipt upload/delete API module
- `frontend/src/components/forms/transaction-form.tsx`: receipt file input with upload/remove, Paperclip icon
- `frontend/src/pages/transactions.tsx`: receipt indicator (Paperclip) in desktop + mobile views
- `backend/prisma/schema.prisma`: composite indexes on Transaction
- `frontend/src/api/index.ts`: barrel re-export from 8 domain modules (includes uploads)
- `frontend/src/api/client.ts`: 15s timeout, no `window.location.href` redirect
- `frontend/src/App.tsx`: ErrorBoundary wrapping, useThemeStore subscription (no useEffect)
- `frontend/src/store/theme.ts`: `onRehydrateStorage` for initial dark class
- `frontend/src/components/error-boundary.tsx`: top-level error recovery
- `frontend/src/components/layouts/app-layout.tsx`: sidebar includes Categories link now
- `frontend/src/pages/dashboard.tsx`: useMemo before early returns, chart title fix, transparent tooltip
- `frontend/src/pages/categories.tsx`: rewired with route, delete confirmation, Select for type, aria-labels
- `frontend/src/components/forms/budget-form.tsx`: Select for category + period instead of textarea/bare select
- `frontend/src/pages/transactions.tsx`, `budgets.tsx`, `goals.tsx`, `notifications.tsx`: delete confirmation dialogs, aria-labels, lazy-loaded forms
- `frontend/src/hooks/useAuth.ts`: login navigates to `/dashboard` directly; no store mutation in useProfile
- `frontend/src/pages/loading.tsx`: 800ms delay, immediate redirect if not authenticated
- `frontend/src/lib/utils.ts`: cached Intl formatters
- `frontend/src/routes/index.tsx`: includes `/categories` route
- `frontend/vercel.json`: static asset caching headers, SPA rewrite, `/api/(.*)` proxy

## Known Issues / Things That Could Still Be Improved
(none currently)

## How to Deploy
```powershell
# From monorepo root
cd frontend
vercel --prod
cd ../backend
vercel --prod --project finance-manager-backend
```