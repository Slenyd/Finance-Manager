# backend/src/routes/

## Responsibility
Defines the HTTP routing layer for the finance-manager API. Each file maps URL paths and HTTP verbs to the corresponding controller method, applying middleware chains (authentication, validation, rate-limiting) per-route or per-router. Together these files constitute the entire public API surface of the backend.

## Design Patterns
- **Router Pattern (Express.Router):** Every module instantiates an independent `Router()` and registers route handlers. Each router is exported as a default export and mounted by the main Express app at a specific path prefix (e.g., `/api/transactions`, `/api/auth`).
- **Middleware Chain Pattern:** Routes compose middleware inline — `authenticate`, `validate(schema)`, and `authLimiter` are applied declaratively. The `router.use(authenticate)` call at the top of most routers applies authentication to **every** downstream route in that router, establishing an auth gate.
- **Controller Delegation:** Route handlers are zero-logic proxies that delegate entirely to controller instances (e.g., `controller.findAll`, `controller.create`). Controllers are instantiated once per router file at module load time.
- **Factory Method (validate):** `validate(schema)` is a higher-order function that accepts a Zod schema and returns a middleware function. This composes cleanly inline with route definitions.
- **Env-Aware Conditioning:** The `cron.routes.ts` and `upload.routes.ts` routers deviate from the common pattern — cron has no auth middleware (internal/trigger-only), upload embeds a `multer` instance with in-memory storage and MIME-type filtering before the controller delegate.

## Data & Control Flow
1. **Inbound:** An HTTP request hits the Express app, which is already mounted at a path prefix (e.g., `/api/budgets`). Express routes the request to the matching route definition.
2. **Middleware execution order** (per route):
   - `router.use(authenticate)` — JWT extracted from `Authorization: Bearer <token>`, decoded, tokenVersion checked against DB, user attached to `req.user`. Rejects with 401 if invalid.
   - `authLimiter` (auth routes only) — rate-limit check before processing.
   - `validate(schema)` — parses `req.body`, `req.query`, `req.params` against a Zod schema. On failure, constructs a `ValidationError` with per-field error messages and passes to `next(error)`. On success, mutated parsed values are written back to `req`.
3. **Controller invocation:** The last argument in the chain is a controller method reference (e.g., `AnalyticsController.getDashboard`). The controller receives `(req, res, next)` and performs business logic.
4. **Outbound:** The controller sends a JSON response. Errors propagate via `next(error)` to the global error handler middleware.
5. **Special flows:**
   - `upload.routes.ts` — `multer` middleware runs before the controller, parsing `multipart/form-data`, storing the file buffer in `req.file` (memory storage), and rejecting unsupported MIME types inline.
   - `cron.routes.ts` — no authentication; intended for internal cron-triggered requests only.
   - `auth.routes.ts` — applies `authLimiter` only to unauthenticated endpoints (register, login, logout, refresh, forgot-password, reset-password), then uses `router.use(authenticate)` as a boundary for authenticated endpoints (profile, preferences, account deletion).

## Integration Points
- **Consumers:** Main Express app (`app.ts` / `server.ts`) — imports each router and mounts it at a path prefix via `app.use('/api/path', router)`.
- **Controllers:** All route files import from `../controllers/<name>.controller` — `AnalyticsController`, `AuthController`, `BudgetController`, `CategoryController`, `CronController`, `GoalController`, `NotificationController`, `RecurringController`, `TransactionController`, `UploadController`.
- **Middlewares:** `authenticate` from `../middlewares/auth`; `validate` from `../middlewares/validate`; `authLimiter` from `../middlewares/rateLimiter`.
- **Validators:** Zod schemas imported from `../validators/<domain>` — each route file imports only the schemas it needs (e.g., `analytics.routes.ts` imports `monthlySpendingSchema`, `categoryBreakdownSchema`, `cashFlowSchema`).
- **Multer (upload only):** Direct dependency on `multer` with `multer.memoryStorage()` for handling file uploads.
