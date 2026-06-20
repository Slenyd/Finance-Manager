# Coin Toss — Project Context

## Goal
Deploy and optimize Coin Toss on Vercel (frontend + backend) with working auth flow, then iteratively review and fix code quality, security, performance, UX, accessibility, architecture, REST API standards, database design, and documentation.

## Constraints & Preferences
- Color scheme centered around hex `#704c35` (warm brown)
- Loading page between login and dashboard uses morph-loading animation from 21st.dev
- Deployment target is Vercel only
- Keep existing shadcn/ui component structure
- Project renamed from "Finance Manager" to "Coin Toss - Finance and Budgeting Manager"
- Vercel project names unchanged (`finance-manager`, `finance-manager-backend`)
- DB name unchanged (`finance_manager`)

## Architecture
- **Monorepo root**: `C:\Users\User\Desktop\Code\finance-manager`
- **Frontend**: `frontend/` — Vite + React + TypeScript + shadcn/ui + Recharts + Zustand + react-query + react-router-dom
- **Backend**: `backend/` — Express + TypeScript + Prisma + JWT auth
- **Database**: Supabase PostgreSQL (pooler URL on port 6543, direct URL on port 5432)
- **Deploy**: Vercel CLI (manual `vercel --prod`), two projects: `finance-manager` (frontend) and `finance-manager-backend` (backend)
- Frontend uses Vercel rewrite proxy (`/api/*` → backend URL) — same-origin, no CORS
- **Required Vercel env vars for backend**: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `BLOB_READ_WRITE_TOKEN`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `CRON_SECRET`

## Deployment
- Frontend: `vercel --prod` from `frontend/` directory
- Backend: `vercel --prod --project finance-manager-backend` from `backend/` directory
- **Git auto-deploy is enabled** — pushes to `main` auto-deploy on Vercel
- Frontend `.env.production` controls build-time API URL
- Backend `vercel-build` script: `prisma generate && prisma db push --accept-data-loss && npm run build`

## Seeded Login
- `user@cointoss.app` / `Password123`
- `admin@cointoss.app` / `Password123`

## Key Decisions
- Prisma `directUrl` uses `POSTGRES_URL_NON_POOLING` for schema operations; `url` uses pooler (port 6543) for runtime queries
- `prisma db push --accept-data-loss` in vercel-build ensures production DB schema stays in sync
- Currency conversion: all DB amounts stored in USD (base); `convertFromBase` multiplies by exchange rate at display time; `convertToBase` divides for form submissions
- `useFormatters` hook pattern: pages destructure `{ formatCurrency, formatDate, convertFromBase }` instead of importing static formatters from `utils.ts`
- `formatCurrency` and `formatDate` in `utils.ts` kept but no longer imported by pages (only `cn` is still used from there)
- Backend `updatePreferencesSchema` uses `z.enum(['USD','EUR','GBP','JPY','CNY','INR','ILS'])` for currency validation
- Exchange rate API: frankfurter.app (ECB data), 1hr staleTime, retry:1, with hardcoded fallback rates
- Project rename intentionally did NOT change: DB name, Vercel project names, API routes, folder names, git remote URL
- Auth middleware trusts JWT claims instead of DB lookup — user claims (`name`, `email`, `isVerified`) embedded in JWT
- `asyncHandler` type simplified to avoid TS2742 portable type errors
- API modules split by domain for tree-shaking and maintainability
- Form dialogs lazy-loaded to reduce initial bundle size
- node-cron conditional import avoids loading the module on Vercel serverless
- Rate limiter uses Upstash Redis store via `@upstash/redis` when env vars are set; falls back to in-memory for dev
- File uploads use `@vercel/blob` for receipt storage; multer with memory storage for multipart parsing
- Category deletion reassigns transactions/budgets to a lazily-created "Uncategorized" fallback category inside `$transaction` (atomic, no orphans on rollback)
- `prisma db push` used instead of `prisma migrate`; initial migration baseline created at `prisma/migrations/20260619200855000_init/migration.sql` for documentation only
- `Notification.type` changed from `String` to `NotificationType` enum (INFO, WARNING, ERROR, SUCCESS)
- `Transaction.categoryId` is nullable (`String?`) with `onDelete: SetNull` — transactions keep data when category deleted
- `Budget` and `RecurringTransaction` have `onDelete: Restrict` on `categoryId` — cannot delete category while referenced (app reassigns first)
- `@@unique([userId, name, type])` on Category and `@@unique([userId, categoryId, period])` on Budget prevent duplicates
- `Goal.contribute()` uses atomic `prisma.savingsGoal.update({ data: { currentAmount: { increment: amount } } })` instead of read-then-write (race condition fix)
- `AuthService.deleteAccount()` wraps `refreshToken.deleteMany` + `user.delete` in `$transaction` (atomic)
- `UploadService.deleteReceipt()` nulls out `Transaction.receiptUrl` before deleting blob (no dangling references)
- All action-only API responses include `data: null` for consistency
- REST API standards: `DELETE /transactions/bulk` → `POST /transactions/bulk-delete`; `DELETE /uploads/receipt` → `POST /uploads/receipt/delete`; `PUT /auth/*` → `PATCH /auth/*`; `/auth/password` → `/auth/me/password`
- Notification `markAsRead`/`delete` return 404 on missing IDs; notification `limit` validated by Zod (1–100)
- `GET /auth/me` response flattened from `{ data: { user } }` to `{ data: user }`
- Analytics endpoints have Zod validation for `months` and `startDate`/`endDate` query params
- Documentation folder: `Documentation/` contains: `overview/` (system-description.md, user-flow.md), `architecture/` (erd.md, data-dictionary.md), `api/` (api-reference.md), `design/` (wireframes.md + screenshots/), and `AGENTS.md`

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
- **All backend controllers** standardized to `asyncHandler` (no more manual try/catch)
- **Analytics overview endpoint**: `GET /api/v1/analytics/overview` combines dashboard + monthly spending

### Backend Infrastructure
- **File upload support**: `@vercel/blob` + multer (memory storage) for receipt uploads; `POST /api/v1/uploads/receipt`, `POST /api/v1/uploads/receipt/delete`; 5MB max, JPEG/PNG/WebP/PDF; URL validation + ownership check on delete; sanitized filenames
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

### Architecture Fixes (Round 2)
- **BadRequestError** added to error class hierarchy — used by upload/cron controllers instead of inline JSON responses
- **express.urlencoded** changed from `extended: true` (qs) to `extended: false` (querystring) — removes deeply-nested payload DoS vector
- **resolveCategoryId** moved from `transaction.service.ts` to `utils/category.helpers.ts` — shared utility, no cross-domain coupling
- **Transaction controller** response format fixed: `{ success: true, data: ..., meta: ... }` instead of spreading service result
- **Upload controller** inline `res.status(400).json(...)` replaced with `throw new BadRequestError(...)` — flows through error handler
- **Cron controller** inline `res.status(503/401).json(...)` replaced with `throw new ApiError(...)` / `throw new AuthenticationError(...)` — flows through error handler
- **Category service** authorization failures now return 403 `AuthorizationError` instead of misleading 404 `NotFoundError`
- **Auth middleware** JWT error messages consolidated: `Invalid token` + `Token expired` → `Invalid or expired token` (prevents token-guessing attacks)
- **Notification service** `findAll` now accepts `limit` param (default 50, capped 100) instead of hardcoded `take: 50`
- **Notification controller** passes `req.query.limit` to service (Zod-validated)

### REST API Best-Practices Overhaul
- **CRITICAL**: `DELETE /transactions/bulk` → `POST /transactions/bulk-delete`; `DELETE /uploads/receipt` → `POST /uploads/receipt/delete`
- **HIGH**: `PUT /auth/profile|password|preferences` → `PATCH /auth/profile`, `PATCH /auth/me/password`, `PATCH /auth/preferences`
- **HIGH**: All action-only responses include `data: null` (logout, changePassword, deleteAccount, forgotPassword, resetPassword, all delete endpoints, notification markAsRead/markAllAsRead, upload delete)
- **HIGH**: `GET /auth/me` response flattened from `{ data: { user } }` to `{ data: user }`
- **MEDIUM**: Notification `markAsRead`/`delete` return 404 on missing IDs (NotFoundError)
- **MEDIUM**: Zod validation added for notification `limit` query param (1–100), analytics `months` param (1–36), analytics `startDate`/`endDate` datetime params
- Frontend API modules and auth hook updated to match changed endpoints

### Database Schema Hardening
- **Transaction.categoryId** changed from required `String` to nullable `String?` with `onDelete: SetNull`; `Transaction.category` relation became optional (`Category?`)
- **Budget.categoryId** and **RecurringTransaction.categoryId** have `onDelete: Restrict` — prevents FK violations, app reassigns first
- **`@@unique([userId, name, type])`** added on Category — prevents duplicate category names per type per user
- **`@@unique([userId, categoryId, period])`** added on Budget — prevents duplicate budgets
- **`Notification.type`** changed from `String` to `NotificationType` enum (INFO, WARNING, ERROR, SUCCESS)
- **`@updatedAt`** added to `Notification` and `RefreshToken` models (with `@default(now())` for existing rows)
- **Doc comments** (`///`) added to all 8 Prisma models and 5 enums
- **Prisma migration baseline** created at `prisma/migrations/20260619200855000_init/migration.sql`
- **Full CRUD for RecurringTransaction**: Created `validators/recurring.ts`, `controllers/recurring.controller.ts`, `routes/recurring.routes.ts`; added `findAll`, `findById`, `create`, `update`, `delete` to `RecurringService` (service already had `processRecurringTransactions`)
- **Category delete** refactored: `ensureUncategorized()` moved inside `$transaction` to prevent orphan categories on rollback
- **Goal contribute race condition fix**: `prisma.savingsGoal.update({ data: { currentAmount: { increment: amount } } })` replaces read-then-write
- **Auth deleteAccount atomic**: wrapped `refreshToken.deleteMany` + `user.delete` in `prisma.$transaction`
- **Upload deleteReceipt nulls Transaction.receiptUrl**: before deleting blob, updates matching transactions to `receiptUrl: null`
- **Budget test fix**: adjusted test to avoid `@@unique([userId, categoryId, period])` constraint violations

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
- **Required field indicators**: Red `*` added to all required form labels (9 files)
- **Currency conversion**: `useFormatters` hook reads `user.currency`/`user.locale` from auth store; all pages use reactive `formatCurrency`/`formatDate`/`convertFromBase`
- **Exchange rates**: `api/exchangeRates.ts` (frankfurter.app with fallback) + `useExchangeRates` hook (1hr cache); `useFormatters` provides `convertFromBase`/`convertToBase` for real-time USD→selected currency conversion
- **UX audit round 1**: Added `isError`+retry UI to dashboard, transactions, budgets, goals, notifications, analytics; loading spinners on budget/goal/contribute form buttons; error display in contribute-form; transaction-form category textarea→Select dropdown; responsive `grid-cols-1 sm:grid-cols-2` in form dialogs
- **UX audit round 2**: Added loading/disabled states to delete confirmation buttons (transactions, budgets, goals, notifications), "Mark all read" button, "Sign Out" button

### Currency & Locale
- **User.currency/locale fields** added to Prisma schema, pushed to production DB
- **Backend Settings endpoints**: PUT /auth/profile, PUT /auth/password, PUT /auth/preferences, DELETE /auth/account
- **Frontend Settings page**: 6 card sections (Profile, Password, Appearance, Currency & Locale, Session, Danger Zone)
- **Currency dropdown**: 7 currencies (USD, EUR, GBP, JPY, CNY, INR, ILS)

### Project Rename
- "Finance Manager" → "Coin Toss" across all UI text, package names, seed emails (`@cointoss.app`), docker containers, logger service id, health check, README
- DB name, Vercel project names, API routes, folder names, git remote URL intentionally NOT changed

### CI & Config
- **CI fix**: Added `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` to `.github/workflows/ci.yml`
- **Prisma schema**: Has `directUrl = env("POSTGRES_URL_NON_POOLING")` for Supabase direct connection on port 5432
- **Backend .env**: Includes `POSTGRES_URL_NON_POOLING` pointing to local PostgreSQL

### Documentation
- **Documentation/ folder** created with 6 comprehensive files:
  - `system-description.md`: Project overview, target audience, needs analysis, 17 functional requirements, 8 NFRs, tech stack, design language
  - `wireframes.md`: ASCII mockups for all 12 pages (desktop + mobile), shared dialog patterns + 22 real PNG screenshots (2× DPI, Playwright-automated)
  - `erd.md`: Mermaid ERD diagram of all 8 models, relationship cardinalities with onDelete behaviors, unique constraints, indexes, data storage notes
  - `user-flow.md`: 5 Mermaid flowcharts (auth journey, authenticated nav, error/edge cases, category deletion cascade, cron processing, currency conversion) + page-by-page flow table
  - `api-reference.md`: Complete table of all 38 endpoints with methods, paths, auth requirements, request bodies, response schemas, HTTP status codes, auth flow diagram
  - `data-dictionary.md`: Field-by-field descriptions for all 8 database models including types, constraints, business rules, computed fields
- **Playwright screenshot script**: `frontend/scripts/screenshot.js` + `npm run screenshot` command captures 22 PNGs (11 pages × 2 viewports)
- **README updated**: API section references Documentation/api/api-reference.md; project structure tree points to `Documentation/`

## Relevant Files
- `backend/prisma/schema.prisma`: Has `directUrl`, doc comments on all models, `NotificationType` enum, nullable `categoryId` on Transaction, `onDelete: SetNull/Restrict`, `@@unique` constraints, `@updatedAt` on all mutable models, `@default(now())` on RefreshToken.updatedAt
- `backend/prisma/migrations/20260619200855000_init/migration.sql`: Full baseline migration for documentation
- `backend/package.json`: `vercel-build` = `prisma generate && prisma db push --accept-data-loss && npm run build`; `name=coin-toss-backend`; `screenshot` script in frontend
- `.github/workflows/ci.yml`: Has `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` env vars
- `backend/src/validators/auth.ts`: `updatePreferencesSchema` uses `z.enum` for currency; `changePasswordSchema` at `/auth/me/password`
- `backend/src/controllers/*.ts`: All use `asyncHandler`; all action-only responses include `data: null`; `getProfile` returns flat `data: user`
- `backend/src/controllers/recurring.controller.ts`: Full CRUD for recurring transactions (list, findById, create, update, delete)
- `backend/src/routes/recurring.routes.ts`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` — all authenticated
- `backend/src/validators/recurring.ts`: `createRecurringSchema` and `updateRecurringSchema` with Zod
- `backend/src/validators/notification.ts`: `getNotificationsSchema` with Zod-validated `limit` (1–100)
- `backend/src/validators/analytics.ts`: `monthlySpendingSchema`, `categoryBreakdownSchema`, `cashFlowSchema` with Zod-validated params
- `backend/src/services/goal.service.ts`: `contribute()` uses atomic `prisma.savingsGoal.update({ data: { currentAmount: { increment } } })`
- `backend/src/services/auth.service.ts`: `deleteAccount()` uses `$transaction`; `getProfile`/`updateProfile`/`updatePreferences` return flat `result.user`
- `backend/src/services/upload.service.ts`: `deleteReceipt()` imports `prisma`, nulls `Transaction.receiptUrl` before deleting blob
- `backend/src/services/category.service.ts`: `delete()` uses interactive `$transaction` with `tx.category.create` for `ensureUncategorized` (no orphan on rollback)
- `backend/src/services/notification.service.ts`: `markAsRead`/`delete` return Prisma result (used by controller to check `count === 0` for 404); imports `NotificationType` enum
- `backend/src/controllers/notification.controller.ts`: Returns 404 `NotFoundError` when `markAsRead`/`delete` result has `count === 0`
- `backend/src/app.ts`: Registers `/api/v1/recurring` route
- `backend/src/middlewares/validate.ts`: Reassigns `req.query` and `req.params` in addition to `req.body`
- `backend/src/utils/errors.ts`: `ApiError` base + `BadRequestError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`
- `frontend/src/hooks/useFormatters.ts`: Reactive currency/locale formatter with `convertFromBase`/`convertToBase`
- `frontend/src/hooks/useExchangeRates.ts`: React Query hook for frankfurter.app rates (1hr cache, retry:1, fallback)
- `frontend/src/api/auth.ts`: `PATCH /auth/profile`, `PATCH /auth/me/password`, `PATCH /auth/preferences`; `GET /auth/me` returns `ApiResponse<User>` (flat)
- `frontend/src/api/transactions.ts`: `POST /transactions/bulk-delete` (was DELETE)
- `frontend/src/api/uploads.ts`: `POST /uploads/receipt/delete` (was DELETE)
- `frontend/src/hooks/useAuth.ts`: `useProfile` returns `res.data.data!` (flat, not `.user`)
- `frontend/src/types/index.ts`: `Notification.type` is `'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'`; `Transaction.categoryId` is `string | null`; `Budget.categoryId` is `string | null`; `Notification.updatedAt` added
- `frontend/vercel.json`: static asset caching headers, SPA rewrite, `/api/(.*)` proxy
- `Documentation/`: organized into `overview/` (system-description.md, user-flow.md), `architecture/` (erd.md, data-dictionary.md), `api/` (api-reference.md), `design/` (wireframes.md + screenshots/), and this `AGENTS.md`
- `frontend/scripts/screenshot.js`: Playwright script for automated screenshots; `npm run screenshot`
- `backend/tests/budget.test.ts`: Uses different periods/categories to avoid `@@unique` constraint violations

## Known Issues / Things That Could Still Be Improved
- No Swagger/OpenAPI spec (could be auto-generated from Express routes + Zod schemas)
- Frontend `/categories` route exists in sidebar + types but has no dedicated page (categories managed via transaction/budget forms)
- `RecurringTransaction` CRUD is backend-only (no frontend UI yet; no `recurringApi` module in frontend)
- Budget `update()` doesn't support changing `categoryId` (must delete + recreate)
- Auth store uses manual persistence (crypto.ts obfuscation); theme store uses `persist` middleware — intentional divergence because auth needs dynamic localStorage/sessionStorage selection based on `rememberMe`

## How to Deploy
```powershell
# From monorepo root
cd frontend
vercel --prod
cd ../backend
vercel --prod --project finance-manager-backend
```

## How to Regenerate Screenshots
```powershell
# Start both servers first
cd backend && npm run dev
cd frontend && npm run dev
# Then capture all screenshots
cd frontend && npm run screenshot
```