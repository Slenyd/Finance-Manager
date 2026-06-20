# E. API Endpoints Reference

All endpoints are prefixed with `/api/v1`. Authentication uses JWT Bearer tokens in the `Authorization` header unless otherwise noted.

---

## Authentication (`/api/v1/auth`)

Public endpoints are rate-limited (5 requests / 15 minutes).

| Method | Path | Auth | Description | Request Body | Success Response |
|--------|------|------|-------------|--------------|-----------------|
| POST | `/auth/register` | No | Create a new user account | `{ name, email, password, passwordConfirmation }` | `{ success, data: { user }, message }` (201) |
| POST | `/auth/login` | No | Authenticate and receive tokens | `{ email, password, rememberMe? }` | `{ success, data: { accessToken, refreshToken, user, rememberMe }, message }` |
| POST | `/auth/logout` | No | Revoke all refresh tokens for the user | (empty or `{ refreshToken }`) | `{ success, data: null, message }` |
| POST | `/auth/refresh` | No | Get new access/refresh token pair | `{ refreshToken? }` (or cookie) | `{ success, data: { accessToken, refreshToken } }` |
| POST | `/auth/forgot-password` | No | Request a password reset email | `{ email }` | `{ success, data: null, message }` |
| POST | `/auth/reset-password` | No | Reset password using token from email | `{ token, password, passwordConfirmation }` | `{ success, data: null, message }` |
| GET | `/auth/me` | Yes | Get the current user's profile | — | `{ success, data: user }` |
| PATCH | `/auth/profile` | Yes | Update name and/or email | `{ name?, email? }` | `{ success, data: user, message }` |
| PATCH | `/auth/me/password` | Yes | Change password | `{ currentPassword, newPassword, newPasswordConfirmation }` | `{ success, data: null, message }` |
| PATCH | `/auth/preferences` | Yes | Update currency and/or locale | `{ currency?, locale? }` | `{ success, data: user, message }` |
| DELETE | `/auth/account` | Yes | Permanently delete user account and all data | — | `{ success, data: null, message }` |

---

## Transactions (`/api/v1/transactions`)

| Method | Path | Auth | Description | Query Params / Body | Success Response |
|--------|------|------|-------------|---------------------|-----------------|
| GET | `/transactions` | Yes | List transactions with filters & pagination | `?page&limit&sortBy&sortOrder&type&categoryId&startDate&endDate&minAmount&maxAmount&search&tags&paymentMethod` | `{ success, data: [...], meta: { page, limit, total, totalPages } }` |
| GET | `/transactions/summary` | Yes | Get income/expense summary | `?startDate&endDate` | `{ success, data: { totalIncome, totalExpenses, netSavings, transactionCount } }` |
| GET | `/transactions/:id` | Yes | Get a single transaction | — | `{ success, data: transaction }` |
| POST | `/transactions` | Yes | Create a transaction | `{ amount, description, type, categoryId?, date?, paymentMethod?, notes?, receiptUrl?, tags? }` | `{ success, data: transaction, message }` (201) |
| PUT | `/transactions/:id` | Yes | Update a transaction | `{ amount?, description?, type?, categoryId?, date?, paymentMethod?, notes?, receiptUrl?, tags? }` | `{ success, data: transaction, message }` |
| DELETE | `/transactions/:id` | Yes | Delete a transaction | — | `{ success, data: null, message }` |
| POST | `/transactions/bulk-delete` | Yes | Delete multiple transactions | `{ ids: [uuid, uuid, ...] }` | `{ success, data: null, message }` |

---

## Categories (`/api/v1/categories`)

| Method | Path | Auth | Description | Request Body | Success Response |
|--------|------|------|-------------|--------------|-----------------|
| GET | `/categories` | Yes | List user + default categories | — | `{ success, data: [...] }` |
| GET | `/categories/:id` | Yes | Get a single category | — | `{ success, data: category }` |
| POST | `/categories` | Yes | Create a custom category | `{ name, type, icon?, color? }` | `{ success, data: category, message }` (201) |
| PUT | `/categories/:id` | Yes | Update a category | `{ name?, icon?, color?, type? }` | `{ success, data: category, message }` |
| DELETE | `/categories/:id` | Yes | Delete category (reassigns transactions/budgets to fallback) | — | `{ success, data: null, message }` |

---

## Budgets (`/api/v1/budgets`)

| Method | Path | Auth | Description | Request Body | Success Response |
|--------|------|------|-------------|--------------|-----------------|
| GET | `/budgets` | Yes | List budgets with spent calculation | — | `{ success, data: [...budgets] }` |
| GET | `/budgets/:id` | Yes | Get single budget with spent/percentage | — | `{ success, data: budget }` |
| POST | `/budgets` | Yes | Create a budget | `{ categoryId?, limit, period?, startDate?, endDate? }` | `{ success, data: budget, message }` (201) |
| PUT | `/budgets/:id` | Yes | Update a budget | `{ limit?, period?, startDate?, endDate? }` | `{ success, data: budget, message }` |
| DELETE | `/budgets/:id` | Yes | Delete a budget | — | `{ success, data: null, message }` |

---

## Savings Goals (`/api/v1/goals`)

| Method | Path | Auth | Description | Request Body | Success Response |
|--------|------|------|-------------|--------------|-----------------|
| GET | `/goals` | Yes | List goals with progress percentage | — | `{ success, data: [...goals] }` |
| GET | `/goals/:id` | Yes | Get single goal with progress | — | `{ success, data: goal }` |
| POST | `/goals` | Yes | Create a savings goal | `{ name, targetAmount, currentAmount?, deadline? }` | `{ success, data: goal, message }` (201) |
| PUT | `/goals/:id` | Yes | Update a goal | `{ name?, targetAmount?, currentAmount?, deadline? }` | `{ success, data: goal, message }` |
| DELETE | `/goals/:id` | Yes | Delete a goal | — | `{ success, data: null, message }` |
| POST | `/goals/:id/contribute` | Yes | Add funds to a goal | `{ amount }` (must be > 0) | `{ success, data: goal, message }` |

---

## Notifications (`/api/v1/notifications`)

| Method | Path | Auth | Description | Query Params / Body | Success Response |
|--------|------|------|-------------|---------------------|-----------------|
| GET | `/notifications` | Yes | List notifications with unread count | `?limit` (default 50, max 100) | `{ success, data: [...notifications], meta: { unreadCount } }` |
| PATCH | `/notifications/read-all` | Yes | Mark all notifications as read | — | `{ success, data: null, message }` |
| PATCH | `/notifications/:id/read` | Yes | Mark a single notification as read | — | `{ success, data: null, message }` |
| DELETE | `/notifications/:id` | Yes | Delete a notification | — | `{ success, data: null, message }` |

---

## Analytics (`/api/v1/analytics`)

All endpoints return cached responses (`Cache-Control: private, max-age=N`).

| Method | Path | Auth | Description | Query Params | Success Response |
|--------|------|------|-------------|-------------|-----------------|
| GET | `/analytics/dashboard` | Yes | Dashboard summary (KPIs, charts, recent transactions) | — | `{ success, data: { ... } }` |
| GET | `/analytics/overview` | Yes | Combined dashboard + monthly spending | — | `{ success, data: { ... } }` |
| GET | `/analytics/monthly-spending` | Yes | Monthly income/expense breakdown | `?months` (default 6, max 36) | `{ success, data: { ... } }` |
| GET | `/analytics/category-breakdown` | Yes | Expense breakdown by category | `?startDate&endDate` (ISO 8601 datetime) | `{ success, data: { ... } }` |
| GET | `/analytics/cash-flow` | Yes | Cash flow over time | `?months` (default 12, max 36) | `{ success, data: { ... } }` |
| GET | `/analytics/net-worth` | Yes | Net worth calculation with monthly trend | — | `{ success, data: { ... } }` |

---

## Uploads (`/api/v1/uploads`)

| Method | Path | Auth | Description | Content-Type | Success Response |
|--------|------|------|-------------|-------------|-----------------|
| POST | `/uploads/receipt` | Yes | Upload a receipt file (JPEG, PNG, WebP, PDF; max 5 MB) | `multipart/form-data` (field: `file`) | `{ success, data: { url }, message }` (201) |
| POST | `/uploads/receipt/delete` | Yes | Delete a receipt by URL (ownership verified) | `{ url }` | `{ success, data: null, message }` |

---

## Recurring Transactions (`/api/v1/recurring`)

| Method | Path | Auth | Description | Request Body | Success Response |
|--------|------|------|-------------|--------------|-----------------|
| GET | `/recurring` | Yes | List all recurring transaction templates | — | `{ success, data: [...] }` |
| GET | `/recurring/:id` | Yes | Get a single recurring template | — | `{ success, data: recurring }` |
| POST | `/recurring` | Yes | Create a recurring transaction template | `{ categoryId, amount, description, type, interval, dayOfMonth?, dayOfWeek?, startDate?, endDate? }` | `{ success, data: recurring, message }` (201) |
| PATCH | `/recurring/:id` | Yes | Update a recurring template | `{ categoryId?, amount?, description?, type?, interval?, dayOfMonth?, dayOfWeek?, startDate?, endDate?, isActive? }` | `{ success, data: recurring, message }` |
| DELETE | `/recurring/:id` | Yes | Delete a recurring template | — | `{ success, data: null, message }` |

---

## Cron (`/api/v1/cron`)

| Method | Path | Auth | Description | Headers | Success Response |
|--------|------|------|-------------|---------|-----------------|
| POST | `/cron/recurring` | `X-Cron-Secret` | Process all due recurring transactions | `X-Cron-Secret: <CRON_SECRET>` | `{ success, data: { processed: N }, message }` |

---

## Health Check

| Method | Path | Auth | Description | Success Response |
|--------|------|------|-------------|-----------------|
| GET | `/api/v1/health` | No | Verify API is running | `{ success: true, message: "Coin Toss API is running", timestamp }` |

---

## Response Envelope

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

For error responses:

```json
{
  "success": false,
  "error": "Error type",
  "code": "ERROR_CODE",
  "errors": { "field": ["Validation message"] }
}
```

### HTTP Status Codes

| Code | Meaning | Used For |
|------|---------|----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (create) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient permissions (e.g., modifying default category) |
| 404 | Not Found | Resource doesn't exist or doesn't belong to user |
| 409 | Conflict | Duplicate email, registration failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors (generic message in production) |
| 503 | Service Unavailable | External service not configured (e.g., Blob storage, Cron secret) |

---

## Authentication Flow

```
Client                                   Server
  │                                        │
  │──── POST /auth/login ────────────────>│
  │     { email, password }               │
  │                                        │
  │<─── { accessToken, refreshToken } ───│
  │     Set-Cookie: refreshToken           │
  │                                        │
  │──── GET /transactions ───────────────>│
  │     Authorization: Bearer <accessToken>│
  │                                        │
  │<─── { success, data } ────────────────│
  │                                        │
  │     (accessToken expires after 15 min) │
  │                                        │
  │──── POST /auth/refresh ──────────────>│
  │     { refreshToken } (or cookie)       │
  │                                        │
  │<─── { accessToken, refreshToken } ────│
  │     Set-Cookie: refreshToken           │
  │                                        │
  │──── POST /auth/logout ───────────────>│
  │                                        │
  │<─── { success, data: null } ──────────│
  │     Clear-Cookie: refreshToken         │
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total endpoints | **38** |
| Public (no auth) | **7** |
| JWT-authenticated | **30** |
| Cron-secret authenticated | **1** |
| Rate-limited (authLimiter) | **6** |
| Zod-validated endpoints | **23** |
| Cached endpoints (Cache-Control) | **6** |