# backend/src/controllers/

## Responsibility

HTTP request/response handling layer. Each controller maps one-to-one with a domain resource (auth, transaction, budget, category, goal, recurring, notification, analytics, upload, cron). Controllers are responsible for:

- Extracting input from `req.params`, `req.query`, `req.body`, `req.user.id` (injected by auth middleware)
- Delegating all business logic and persistence to the corresponding **Service** class
- Formatting every response into the standard `{ success: boolean, data?: T, meta?: PaginationMeta, message?: string }` envelope typed via `ApiResponse<T>` with `satisfies`
- Setting `Cache-Control` headers on read endpoints (`private, max-age=N`) and `no-store` on auth/write endpoints
- Performing lightweight input validation (missing file, missing token, missing URL) before calling the service
- Serving as the **only** consumer of `asyncHandler` to forward uncaught promise rejections to Express error middleware

No controller performs business logic, database queries, or cross-cutting concerns (auth, validation schemas) — those are lifted to middleware and service layers.

---

## Design Patterns

### Controller Pattern
Each file exports a class with handler methods as public arrow-function properties. Handlers are stateless per-request: all dependencies (service instances) are closed over at module-load time.

```
class XxxController {
  findAll   = asyncHandler(async (req, res) => { ... });
  findById  = asyncHandler(async (req, res) => { ... });
  create    = asyncHandler(async (req, res) => { ... });
  update    = asyncHandler(async (req, res) => { ... });
  delete    = asyncHandler(async (req, res) => { ... });
}
```

### Async Handler Wrapper
Every handler is wrapped with `asyncHandler` from `../utils/asyncHandler`. This higher-order function catches any `Promise` rejection and forwards it to `next(error)`, so Express error middleware handles it. The wrapper is generic over `Request` subtypes so `AuthorizedRequest` is preserved.

```typescript
// asyncHandler contract:
<Req extends Request = Request>(fn: (req: Req, res, next) => Promise<void>)
  => (req: Request, res: Response, next: NextFunction) => void
```

### Data Transfer Object (DTO) Pattern
Create/Update payloads are typed via interfaces imported from `../interfaces` (e.g., `CreateTransactionData`, `UpdateBudgetData`). Response payloads are typed via domain-specific response interfaces (e.g., `BudgetWithSpent`, `SavingsGoalWithProgress`, `DashboardData`). The `satisfies` operator ensures structural compatibility without widening the runtime value.

### Standardized API Response Envelope
All responses conform to `ApiResponse<T> = { success: true, data?: T, meta?: PaginationMeta, message?: string }`. Paginated endpoints (`findAll` on budget, goal, notification, transaction) return `meta` containing `{ page, limit, total, totalPages }` (and `unreadCount` for notifications). Write endpoints return `message` strings for user feedback.

### Singleton-Style Service Instantiation
Each controller file creates exactly one module-level service instance:
```typescript
const xxxService = new XxxService();
```
No dependency injection container is used. This is a **composition-root-at-module-load** pattern common in lightweight Express apps.

### Read-Response Caching Headers
All `GET` endpoints set a `Cache-Control: private, max-age=<seconds>` header with varying TTLs (15s for notifications, 30s for budgets/goals/transactions, 60–300s for analytics, 300s for categories). All auth endpoints set `no-store`. This prevents intermediate proxies from caching user-specific data while allowing browser caching.

### AuthorizedRequest Pattern
Controllers that require authentication receive `req` typed as `AuthorizedRequest` (extends `Request` with `user: AuthUser`). The `AuthUser` object (`{ id, name, email, role, isVerified }`) is injected by an auth middleware that verifies the JWT. The `req.user.id` is passed as the first argument to every service method for user-scoped queries.

### Specialised Sub-Patterns

| Variation | Controllers | Details |
|-----------|-------------|---------|
| **Bare Request** | `auth.controller` (register, login, refresh, logout, forgotPassword, resetPassword) | Uses plain `Request` — no user context needed before auth |
| **Header-authorized public** | `cron.controller` | Uses plain `Request` but validates `x-cron-secret` header against `config.cronSecret` |
| **File upload** | `upload.controller` | Reads `req.file` (populated by multer middleware); passes `{ buffer, mimetype, originalname }` to upload service |
| **Bulk operation** | `transaction.controller` (`bulkDelete`) | Reads `req.body.ids` instead of a single `req.params.id` |
| **Non-CRUD action** | `goal.controller` (`contribute`), `notification.controller` (`markAsRead`, `markAllAsRead`) | Additional mutation beyond standard CRUD |
| **Read-receipt guard** | `notification.controller` | Checks `result.count === 0` after service call and throws `NotFoundError` |
| **Cookie management** | `auth.controller` (login, refresh, logout, deleteAccount) | Reads/writes `refreshToken` httpOnly cookie with configurable `maxAge` based on JWT expiry |

---

## Data & Control Flow

### Inbound (Request → Controller)

```
HTTP Request
  → Express Router (path matching)
  → Auth Middleware (JWT verification, populates req.user)  [skipped for public routes]
  → Validation Middleware (schema validation)                [external to controllers]
  → Controller method
```

### Processing (Controller → Service)

1. **Extract identity**: `req.user.id` (or `req.cookies.refreshToken` / `req.headers['x-cron-secret']` for auth/cron).
2. **Extract input**:
   - Path params: `req.params.id`
   - Query string: `req.query as <Type>` — cast asserted for pagination and filters
   - Body: `req.body as <CreateData | UpdateData>` — cast asserted
   - File: `req.file` (multer)
   - Cookie: `req.cookies.refreshToken`
3. **Thin validation**: Missing-file, missing-token, missing-URL checks using `instanceof BadRequestError`.
4. **Delegate**: Call `service.method(req.user.id, ...)` with extracted arguments. The service always receives `userId` as the first parameter.
5. **Await**: All service calls return `Promise<T>`.

### Outbound (Controller → Response)

```
Controller method resolves
  → res.set('Cache-Control', ...)
  → res.status(code).json({
       success: true,
       data: result,
       meta?: result.meta,
       message?: string
     } satisfies ApiResponse<T>)
```

**Error path** (implicit via `asyncHandler`):
```
Service throws AppError / Prisma error
  → asyncHandler catches rejected promise
  → next(error)
  → Express global error middleware
```

### State transitions

- **Auth flow**: `register` → `login` (sets cookie) → `refresh` (rotates cookie) → `logout` / `deleteAccount` (clears cookie) → `forgotPassword` → `resetPassword`
- **CRUD flow**: `create` (201) → `findAll` / `findById` (200) → `update` (200) → `delete` (200, data: null)
- **Cron flow**: External scheduler → `POST /cron/recurring` with `x-cron-secret` header → `recurringService.processRecurringTransactions()` → `{ data: { processed: number } }`
- **Upload flow**: `POST /upload/receipt` (201 with `{ url }`) → `DELETE /upload/receipt` (200, data: null)

---

## Integration Points

### Service Dependencies

| Controller | Service Class | Service Source |
|---|---|---|
| `auth.controller` | `AuthService` | `../services/auth.service` |
| `transaction.controller` | `TransactionService` | `../services/transaction.service` |
| `category.controller` | `CategoryService` | `../services/category.service` |
| `budget.controller` | `BudgetService` | `../services/budget.service` |
| `goal.controller` | `GoalService` | `../services/goal.service` |
| `notification.controller` | `NotificationService` | `../services/notification.service` |
| `analytics.controller` | `AnalyticsService` | `../services/analytics.service` |
| `recurring.controller` | `RecurringService` | `../services/recurring.service` |
| `cron.controller` | `RecurringService` | `../services/recurring.service` |
| `upload.controller` | `UploadService` | `../services/upload.service` |

### Utility Dependencies

| Import | Source | Used By |
|---|---|---|
| `asyncHandler` | `../utils/asyncHandler` | All controllers |
| `BadRequestError` | `../utils/errors` | `auth.controller`, `upload.controller` |
| `NotFoundError` | `../utils/errors` | `notification.controller` |
| `AuthenticationError` | `../utils/errors` | `cron.controller` |
| `ApiError` | `../utils/errors` | `cron.controller` |

### Type/Interface Dependencies (from `../interfaces/index.ts`)

| Import | Used By |
|---|---|
| `AuthorizedRequest` | All except auth public methods and cron |
| `ApiResponse<T>` | All controllers |
| `PaginationMeta`, `NotificationMeta` | Budget, Goal, Notification, Transaction |
| `DashboardData`, `MonthlySpendingData`, `CategoryBreakdownData`, `NetWorthData`, `OverviewData` | Analytics |
| `TransactionQuery`, `TransactionSummary` | Transaction |
| `BudgetQuery`, `BudgetWithSpent`, `CreateBudgetData`, `UpdateBudgetData` | Budget |
| `GoalQuery`, `SavingsGoalWithProgress`, `CreateGoalData`, `UpdateGoalData` | Goal |
| `NotificationQuery`, `Notification` | Notification |
| `Category`, `CreateCategoryData`, `UpdateCategoryData` | Category |
| `RecurringTransaction`, `CreateRecurringData`, `UpdateRecurringData` | Recurring |

### External Library Dependencies

| Library | Used By | Purpose |
|---|---|---|
| `express` (Request, Response) | All controllers | HTTP types |
| `jsonwebtoken` | `auth.controller` | Decode JWT to compute cookie `maxAge` from `exp` claim |
| `multer` (via `req.file`) | `upload.controller` | File upload handling (multer middleware runs before controller) |

### Consumer Modules

Controllers are consumed **only** by route definition files (e.g., `../routes/xxx.routes.ts`), which:

1. Instantiate or import the controller (typically the module-level instance)
2. Bind methods to Express router: `router.get('/transactions', transactionController.findAll)`
3. Apply middleware chains (auth, validation) before the handler

### Config Dependency

| Config | Used By | Purpose |
|---|---|---|
| `config.cronSecret` | `cron.controller` | Validate `x-cron-secret` header to authenticate cron job calls |
| `process.env.NODE_ENV` | `auth.controller` | Conditionally set `secure: true` on refresh token cookie in production |
