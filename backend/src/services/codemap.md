# backend/src/services/

## Responsibility

The service layer encapsulates all business logic for the finance-manager application. Each class acts as a **transaction script** — an operation-centric object that accepts data, orchestrates Prisma queries, applies domain rules, and returns structured results. Controllers delegate HTTP requests to these services, which in turn depend on Prisma ORM for persistence, utility modules for cross-cutting concerns, and external SDKs (Vercel Blob, mailer) for infrastructure.

The layer enforces authorization invariants (scoping every query by `userId`), input validation (throwing typed `ApiError` subclasses), and domain operations (budget spent calculation, savings progress, recurring transaction scheduling, refresh-token rotation with reuse detection).

---

## Design Patterns

| Pattern | Usage | Location |
|---|---|---|
| **Service Layer** | All services (`AuthService`, `TransactionService`, `BudgetService`, `CategoryService`, `GoalService`, `NotificationService`, `AnalyticsService`, `RecurringService`, `UploadService`) are stateless classes that encapsulate business logic between controllers and Prisma. | Every `*.service.ts` |
| **Transaction Script** | Each public method is a self-contained operation (e.g. `BudgetService.findAll` computes spent amounts, `AuthService.register` creates user + default categories). No shared mutable state between calls. | All service methods |
| **Repository (via Prisma)** | Persistence is abstracted behind Prisma Client. Services never write raw SQL except `AnalyticsService.getNetWorth` which uses `prisma.$queryRaw` for a windowed aggregation. | `prisma` import in every service |
| **DTO / View Model** | Return types are explicit interfaces (`DashboardData`, `BudgetWithSpent`, `SavingsGoalWithProgress`, `SafeUser`, `AuthResult`, `TransactionSummary`) that decouple internal Prisma shapes from API consumers. | `../interfaces` imports |
| **Builder (partial update)** | `Prisma.TransactionUpdateInput`, `Prisma.UserUpdateInput`, `Prisma.CategoryUpdateInput` are conditionally populated with spread/ternary patterns for partial updates. | `transaction.service.ts:93-108`, `category.service.ts:31-36`, `recurring.service.ts:54-74` |
| **Strategy** | `RecurringService.calculateNextDateFromStart` dispatches on `RecurringInterval` enum (`DAILY` / `WEEKLY` / `MONTHLY` / `YEARLY`) to compute the next occurrence. | `recurring.service.ts:140-162` |
| **Guard / Rate-Limit** | `AuthService.handleFailedLogin` implements account lockout after 5 failed attempts with a 15-minute cooldown. | `auth.service.ts:346-356` |
| **Token Rotation / Reuse Detection** | Refresh tokens carry a `family` (UUID v4) and `jti`. On rotation the old token is revoked; if a revoked token is reused, the entire family is revoked. Access tokens embed a `tokenVersion` that is incremented on logout/password-change to bulk-invalidate all outstanding access JWTs. | `auth.service.ts:92-183`, `auth.service.ts:249-270` |
| **Template Method (fixed pipeline)** | CRUD operations follow a consistent pattern: (1) ownership check via `findById` + `NotFoundError`, (2) Prisma mutation, (3) return typed result. | `budget.service.ts:88-89`, `goal.service.ts:64-66`, `recurring.service.ts:83-85`, `transaction.service.ts:117-119` |
| **Saga / Compensating Action** | `CategoryService.delete` reassigns orphaned transactions and budgets to a fallback category before deletion, all inside a `prisma.$transaction`. | `category.service.ts:45-67` |
| **Batch Processing** | `RecurringService.processRecurringTransactions` finds all due recurring records, creates transaction rows and updates `nextDate` in a single `$transaction`. | `recurring.service.ts:88-134` |
| **Null Object / Default Fallback** | `CategoryService.delete` auto-creates an "Uncategorized" fallback category if no other category of the same type exists. | `category.service.ts:50-56` |

### Key Abstractions

- **`parsePagination(query)`** — Utility that extracts `page`, `limit`, `skip` from query params for consistent pagination across `transaction`, `budget`, `goal`, and `notification` services.
- **`resolveCategoryId(userId, type, categoryId?)`** — Resolves a named category lookup or validates a UUID category ID; shared by `transaction.service.ts` and `budget.service.ts`.
- **`calculateFinancialHealth(…)`** — Computes a composite health score from savings rate, budget compliance, expense consistency, emergency fund presence, and data sufficiency.
- **`hashToken(token)`** — SHA-256 hashes reset tokens before storage so plaintext tokens are never persisted.

---

## Data & Control Flow

### Authentication (`AuthService`)

```
login(email, password)
  → prisma.user.findUnique(email)          [read user row]
  → bcrypt.compare(password, hash)         [verify credential]
  → handleFailedLogin() / lock check       [rate-limit guard]
  → jwt.sign(accessToken)                  [JWT with tokenVersion]
  → jwt.sign(refreshToken, {family, jti})  [JWT with rotation family]
  → prisma.refreshToken.create(token)      [persist refresh token]
  ← { accessToken, refreshToken, user }

refresh(token)
  → jwt.verify(token, refreshSecret)       [cryptographic validation]
  → prisma.refreshToken.findUnique(token)  [DB lookup]
  → if revoked → revoke entire family      [reuse detection]
  → revoke old token
  → jwt.sign(new accessToken)
  → jwt.sign(new refreshToken, same family)
  → prisma.refreshToken.create(new token)
  ← { accessToken, refreshToken }

logout(token)
  → revoke all user refresh tokens
  → increment user.tokenVersion            [bulk-invalidate access JWTs]

register(data)
  → prisma.user.findUnique(email)          [duplicate check]
  → bcrypt.hash(password, 12)
  → prisma.user.create(data)
  → createDefaultCategories(userId)        [seed 12 default categories]
  ← SafeUser

forgotPassword(email)
  → prisma.user.findUnique(email)
  → crypto.randomBytes(32) → SHA-256 hash  [reset token]
  → prisma.user.update(resetToken, resetTokenExpires)
  → sendPasswordResetEmail(email, rawToken)

resetPassword(token, password)
  → SHA-256(token) → prisma.user.findFirst(resetToken, not expired)
  → bcrypt.hash(password, 12)
  → prisma.user.update(passwordHash, tokenVersion++, clear resetToken)
  → revoke all user refresh tokens
```

### Core Domain — Transaction / Category / Budget / Goal

```
TransactionService.findAll(userId, query)
  → parsePagination(query)                 [extract page/limit/skip]
  → build Prisma.TransactionWhereInput     [apply filters: type, categoryId, search, tags, dateRange, amountRange]
  → build Prisma.TransactionOrderByWithRelationInput [sortBy: date|amount|description]
  → prisma.transaction.findMany(where, orderBy, skip, take, include category)
  → prisma.transaction.count(where)
  ← { data: Transaction[], meta: PaginationMeta }

TransactionService.create(userId, data)
  → resolveCategoryId(userId, type, categoryId)  [name→UUID or pass-through]
  → prisma.transaction.create(include category)
  ← Transaction (with category)

CategoryService.delete(userId, id)
  → findById → ownership check (userId vs null)
  → prisma.$transaction([
       findOrCreate fallback category,
       tx.transaction.updateMany(reassign to fallback),
       tx.budget.updateMany(reassign to fallback),
       tx.category.delete(id)
     ])

BudgetService.findAll(userId, query)
  → prisma.budget.findMany(include category)
  → for each budget:
      prisma.transaction.aggregate(sum amount, where EXPENSE + categoryId + date range)
  → compute spent & percentage per budget
  ← { data: BudgetWithSpent[], meta: PaginationMeta }

GoalService.contribute(userId, id, amount)
  → validate amount > 0
  → findById (ownership)
  → prisma.savingsGoal.update(currentAmount: { increment: amount })
  ← SavingsGoal
```

### Analytics (`AnalyticsService`)

```
getDashboard(userId)
  → Promise.all([
      income aggregate (all-time),
      expense aggregate (all-time),
      income aggregate (month-to-date),
      expense aggregate (month-to-date),
      budgets findMany,
      goals findMany,
      recent 10 transactions (with category)
    ])
  → calculateFinancialHealth(savingsRate, budgetCompliance, …)
  → compose DashboardData

getCategoryBreakdown(userId, startDate?, endDate?)
  → prisma.transaction.groupBy(by: categoryId, where EXPENSE + optional date filter, _sum amount)
  → prisma.category.findMany(ids) → map id→name/color/icon
  → sort by total descending
  ← CategoryBreakdownData[]

getNetWorth(userId)
  → prisma.transaction.aggregate(INCOME sum) // all-time income
  → prisma.transaction.aggregate(EXPENSE sum) // all-time expenses
  → prisma.$queryRaw(SELECT to_char(date, 'YYYY-MM'), SUM(CASE WHEN type=INCOME THEN amount ELSE -amount END) … GROUP BY month)
  → compute runningTotal across monthly snapshots
  ← { currentNetWorth, trend: [{date, netWorth}] }
```

### Recurring Transactions (`RecurringService`)

```
create(userId, data)
  → calculateNextDateFromStart(interval, startDate, dayOfMonth)
  → prisma.recurringTransaction.create(include category)
  ← RecurringWithCategory

processRecurringTransactions()
  → prisma.recurringTransaction.findMany(isActive, nextDate <= now)
  → map due → prisma.transaction.create({…, isRecurring: true})
  → map due → prisma.recurringTransaction.updateMany(nextDate, deactivate if past endDate)
  → prisma.$transaction([…creates, …updates])
  ← { processed: count }
  on failure → logger.error(…), throw
```

### File Upload (`UploadService`)

```
uploadReceipt(userId, file)
  → check BLOB_READ_WRITE_TOKEN configured
  → validate MIME type (jpeg/png/webp/pdf)
  → validate file size ≤ 5 MB
  → sanitize filename (regex replace non-alphanumeric)
  → put(key, buffer, {access:'public', contentType}) via @vercel/blob
  ← blob.url

deleteReceipt(userId, url)
  → check configured; validate URL format + path prefix
  → head(url) → verify ownership (pathname contains userId)
  → prisma.transaction.updateMany(receiptUrl = null)
  → del(url) via @vercel/blob
```

### Notifications (`NotificationService`)

```
findAll(userId, query)
  → parsePagination(query)
  → Promise.all([
      prisma.notification.findMany(orderBy createdAt desc, skip, take),
      prisma.notification.aggregate(where isRead false, _count) — unreadCount,
      prisma.notification.count(where)
    ])
  ← { data: Notification[], meta: { …, unreadCount } }
```

---

## Integration Points

### Dependencies (imports)

| Module | Used By | Role |
|---|---|---|
| `../config/database` (prisma) | All services | ORM client for all persistence |
| `../config` (config) | `auth.service.ts` | JWT secrets, access/refresh expiry durations |
| `../utils/errors` | `auth.service.ts`, `budget.service.ts`, `category.service.ts`, `goal.service.ts`, `recurring.service.ts`, `transaction.service.ts`, `upload.service.ts` | Typed error classes: `AuthenticationError`, `ConflictError`, `NotFoundError`, `ValidationError`, `AuthorizationError`, `ApiError` |
| `../utils/helpers` | `analytics.service.ts`, `budget.service.ts`, `goal.service.ts`, `notification.service.ts`, `transaction.service.ts` | `calculateFinancialHealth()`, `parsePagination()` |
| `../utils/category.helpers` | `budget.service.ts`, `transaction.service.ts` | `resolveCategoryId()` — resolves category name to UUID or validates existing ID |
| `../utils/mailer` | `auth.service.ts` | `sendPasswordResetEmail()` — outbound email for password reset flow |
| `../utils/logger` | `recurring.service.ts` | `logger.info/error` for batch processing observability |
| `../interfaces` | `analytics.service.ts`, `auth.service.ts`, `budget.service.ts`, `category.service.ts`, `goal.service.ts`, `notification.service.ts`, `recurring.service.ts`, `transaction.service.ts` | Shared TypeScript interfaces (`DashboardData`, `AuthResult`, `BudgetWithSpent`, `Category`, `SavingsGoalWithProgress`, `Notification`, `TransactionQuery`, `PaginationMeta`, etc.) |
| `@prisma/client` | `analytics.service.ts`, `auth.service.ts`, `budget.service.ts`, `category.service.ts`, `goal.service.ts`, `notification.service.ts`, `recurring.service.ts`, `transaction.service.ts` | Prisma generated types (`Prisma.TransactionGetPayload`, `Prisma.UserGetPayload`, `SavingsGoal`, `RecurringInterval`, `NotificationType`, etc.) |
| `bcryptjs` | `auth.service.ts` | Password hashing (cost factor 12) |
| `jsonwebtoken` | `auth.service.ts` | JWT signing and verification (access + refresh tokens) |
| `uuid` | `auth.service.ts` | `v4` for token family and `jti` generation |
| `crypto` (Node) | `auth.service.ts` | `randomBytes` for reset tokens, `createHash('sha256')` for token hashing |
| `@vercel/blob` | `upload.service.ts` | `put`, `del`, `head` — receipt file storage on Vercel Blob |

### Consumers (callers)

| Consumer | Services Used | Mechanism |
|---|---|---|
| Controllers (e.g. `AuthController`, `TransactionController`, `BudgetController`, `CategoryController`, `GoalController`, `NotificationController`, `AnalyticsController`, `RecurringController`, `UploadController`) | All services | Instantiated in route handlers; controller calls `service.method()`, catches typed errors, maps to HTTP responses |
| Scheduler / Cron (external) | `RecurringService.processRecurringTransactions()` | Scheduled job (e.g., Vercel Cron or Bull queue) that calls the batch processing method to materialize recurring transactions |
| `AuthService.register()` | `CategoryService` (indirect via `createDefaultCategories`) | On user registration: seeds 12 default income/expense categories for the new user |
| `AnalyticsService.getDashboard()` | `BudgetService` & `GoalService` (indirect via Prisma queries) | Pulls budgets and goals inline from Prisma rather than delegating to service methods |
| `AnalyticsService.getNetWorth()` | Prisma raw SQL | Uses `prisma.$queryRaw` for a monthly windowed aggregation that cannot be expressed declaratively with Prisma's typed API |
| `index.ts` (barrel) | All services | Re-exports all service classes for single-import consumption by controllers |
