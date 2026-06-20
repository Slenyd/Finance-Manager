# API Reference

**Base URL:** `/api/v1`  
**Auth:** Most endpoints need `Authorization: Bearer <token>` in the header. The token comes from login.  
**Content-Type:** `application/json` (except file uploads, which use `multipart/form-data`)

All money amounts are stored and returned in USD. The frontend converts them for display.

---

## Table of Contents

- [How Responses Work](#how-responses-work)
- [Errors](#errors)
- [Authentication](#authentication)
- [Transactions](#transactions)
- [Categories](#categories)
- [Budgets](#budgets)
- [Savings Goals](#savings-goals)
- [Notifications](#notifications)
- [Analytics](#analytics)
- [File Uploads](#file-uploads)
- [Recurring Transactions](#recurring-transactions)
- [Cron Job](#cron-job)
- [Health Check](#health-check)

---

## How Responses Work

Every API response uses the same format.

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional confirmation message"
}
```

- `data` holds the actual content. For delete/logout endpoints, `data` is `null`.
- `message` appears on most create/update/delete responses. Not always present on GET.
- Some list endpoints also include `meta` for pagination info:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 15,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "success": false,
  "error": "What went wrong",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["What was wrong with this field"]
  }
}
```

- `errors` only appears on validation errors (when the data you sent doesn't match the rules)

---

## Errors

### HTTP Status Codes

| Code | What It Means | When It Happens |
|------|--------------|----------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (creating something new) |
| 400 | Bad Request | You sent invalid or missing data |
| 401 | Unauthorized | Your token is missing, expired, or invalid |
| 403 | Forbidden | You're trying to do something you don't have permission for (like editing a default category) |
| 404 | Not Found | The thing you're looking for doesn't exist or belongs to someone else |
| 409 | Conflict | You're trying to create a duplicate (like registering an email that's already taken) |
| 429 | Too Many Requests | You've sent too many requests too fast (rate limited) |
| 500 | Server Error | Something broke on the server side |
| 503 | Service Unavailable | A required service isn't configured (like Blob storage or Cron secret) |

### Example Error Responses

**Validation error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": {
    "password": ["Password must be at least 8 characters"],
    "passwordConfirmation": ["Passwords do not match"]
  }
}
```

**Not found (404):**
```json
{
  "success": false,
  "error": "Transaction not found",
  "code": "NOT_FOUND"
}
```

**Rate limited (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Rate Limiting

| Type | Limit | Which Endpoints |
|------|-------|----------------|
| Auth | 10 requests per 15 minutes | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout` |
| General | 1000 requests per 15 minutes | Everything else |

> In production, rate limiting uses Upstash Redis. In development, it uses in-memory storage.

---

## Authentication

These endpoints handle user accounts and login. Most are public (no token needed). They're rate-limited to prevent abuse.

### POST `/auth/register`

Create a new account.

**Send:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "passwordConfirmation": "Password123"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `name` | Yes | 2–100 characters |
| `email` | Yes | Must be a valid email |
| `password` | Yes | At least 8 chars, must have uppercase + lowercase + a number |
| `passwordConfirmation` | Yes | Must match `password` |

**Returns (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isVerified": false,
      "currency": "USD",
      "locale": "en-US"
    },
    "rememberMe": false
  },
  "message": "Registration successful"
}
```

> The `refreshToken` is also set as an httpOnly cookie. The `user` object here doesn't include `createdAt`/`updatedAt` (unlike the profile endpoint).

**Errors:**
- 400 — Missing/invalid fields, passwords don't match
- 409 — Email already registered

---

### POST `/auth/login`

Log in and get tokens.

**Send:**
```json
{
  "email": "john@example.com",
  "password": "Password123",
  "rememberMe": true
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `email` | Yes | Valid email |
| `password` | Yes | At least 1 character |
| `rememberMe` | No | `true` or `false`. Defaults to `false`. Extends refresh token to 30 days (1 day otherwise). |

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isVerified": true,
      "currency": "USD",
      "locale": "en-US"
    },
    "rememberMe": true
  },
  "message": "Login successful"
}
```

> Sets `refreshToken` as an httpOnly cookie. Cookie lasts 30 days if `rememberMe` is `true`, 1 day otherwise.

**Errors:**
- 400 — Missing fields
- 401 — Wrong email or password

---

### POST `/auth/refresh`

Get new tokens when the access token expires. The refresh token comes from the httpOnly cookie (or you can send it in the body).

**Send (optional if cookie is present):**
```json
{
  "refreshToken": "eyJ..."
}
```

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

> Sets a new `refreshToken` cookie. The old refresh token is revoked. No `message` field here.

**Errors:**
- 400 — No refresh token provided
- 401 — Invalid, expired, or revoked refresh token

---

### POST `/auth/logout`

Log out and revoke all refresh tokens.

**Send (optional):**
```json
{
  "refreshToken": "eyJ..."
}
```

> If no body, uses the cookie.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

> Also clears the `refreshToken` cookie and increments `tokenVersion` (invalidates all access tokens immediately).

---

### POST `/auth/forgot-password`

Request a password reset email. Always returns success, even if the email doesn't exist (for security).

**Send:**
```json
{
  "email": "john@example.com"
}
```

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "If the email exists, a reset link has been sent"
}
```

---

### POST `/auth/reset-password`

Reset password using the token from the email.

**Send:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123",
  "passwordConfirmation": "NewPassword123"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `token` | Yes | The token from the reset email |
| `password` | Yes | Same rules as registration (8+ chars, uppercase, lowercase, number) |
| `passwordConfirmation` | Yes | Must match `password` |

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successful"
}
```

> All existing refresh tokens are revoked after a password reset, forcing re-login everywhere.

**Errors:**
- 400 — Invalid/expired token, passwords don't match

---

### GET `/auth/me`

Get the logged-in user's profile. Requires auth.

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isVerified": true,
    "currency": "USD",
    "locale": "en-US",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-06-20T14:00:00.000Z"
  }
}
```

> Note: This response includes `createdAt` and `updatedAt`, unlike the login/register response.

---

### PATCH `/auth/profile`

Update name and/or email. Requires auth.

**Send:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `name` | No | 2–100 characters |
| `email` | No | Valid email |

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "isVerified": true,
    "currency": "USD",
    "locale": "en-US",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-06-20T15:00:00.000Z"
  },
  "message": "Profile updated"
}
```

---

### PATCH `/auth/me/password`

Change password. Requires auth.

**Send:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "newPasswordConfirmation": "NewPassword123"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `currentPassword` | Yes | Your current password |
| `newPassword` | Yes | Same rules as registration (8+ chars, uppercase, lowercase, number) |
| `newPasswordConfirmation` | Yes | Must match `newPassword` |

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

> All existing sessions are revoked — you'll need to log in again everywhere.

**Errors:**
- 400 — New passwords don't match / too weak
- 401 — Current password is wrong

---

### PATCH `/auth/preferences`

Change currency and/or locale. Requires auth.

**Send:**
```json
{
  "currency": "EUR",
  "locale": "de-DE"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `currency` | No | One of: `USD`, `EUR`, `GBP`, `JPY`, `CNY`, `INR`, `ILS` |
| `locale` | No | 2–10 characters (e.g., `en-US`, `de-DE`, `ja-JP`) |

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isVerified": true,
    "currency": "EUR",
    "locale": "de-DE",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-06-20T16:00:00.000Z"
  },
  "message": "Preferences updated"
}
```

---

### DELETE `/auth/account`

Permanently delete your account and all data. Requires auth.

> This action is permanent and can't be undone. All transactions, budgets, goals, categories, notifications, and tokens are deleted.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Account deleted successfully"
}
```

> Clears the `refreshToken` cookie.

---

## Transactions

All endpoints require auth. All amounts are in USD.

### GET `/transactions`

List transactions with filters and pagination.

**Query parameters (all optional, added to the URL):**

| Parameter | Default | What It Does |
|-----------|---------|-------------|
| `page` | `"1"` | Which page of results |
| `limit` | `"15"` | How many per page (max 100) |
| `sortBy` | `"date"` | Sort by: `date`, `amount`, `createdAt`, or `description` |
| `sortOrder` | `"desc"` | `asc` (oldest first) or `desc` (newest first) |
| `type` | — | Filter by: `INCOME`, `EXPENSE`, or `TRANSFER` |
| `categoryId` | — | Filter by category (UUID) |
| `startDate` | — | Only transactions from this date onward (ISO 8601) |
| `endDate` | — | Only transactions up to this date (ISO 8601) |
| `minAmount` | — | Minimum amount |
| `maxAmount` | — | Maximum amount |
| `search` | — | Search in description and notes |
| `tags` | — | Comma-separated tags to filter by |
| `paymentMethod` | — | Filter by payment method |

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx-uuid",
      "userId": "user-uuid",
      "categoryId": "cat-uuid",
      "amount": 5000,
      "description": "Monthly salary",
      "type": "INCOME",
      "date": "2025-06-01T00:00:00.000Z",
      "paymentMethod": "bank",
      "notes": "June paycheck",
      "receiptUrl": null,
      "isRecurring": false,
      "tags": ["salary"],
      "category": {
        "id": "cat-uuid",
        "name": "Salary",
        "icon": "dollar",
        "color": "#22c55e"
      },
      "createdAt": "2025-06-01T10:00:00.000Z",
      "updatedAt": "2025-06-01T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 15, "total": 42, "totalPages": 3 }
}
```

---

### GET `/transactions/summary`

Get totals for a date range.

**Query parameters:** `startDate` and `endDate` (both optional, ISO 8601).

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 15000,
    "totalExpenses": 8500,
    "netSavings": 6500,
    "transactionCount": 37
  }
}
```

---

### GET `/transactions/:id`

Get one transaction by ID. Returns 404 if it doesn't exist or belongs to another user.

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "userId": "user-uuid",
    "categoryId": "cat-uuid",
    "amount": 42.50,
    "description": "Lunch at cafe",
    "type": "EXPENSE",
    "date": "2025-06-20T12:30:00.000Z",
    "paymentMethod": "credit_card",
    "notes": "Team lunch",
    "receiptUrl": null,
    "isRecurring": false,
    "tags": ["food", "team"],
    "category": {
      "id": "cat-uuid",
      "name": "Food",
      "icon": "utensils",
      "color": "#ef4444"
    },
    "createdAt": "2025-06-20T12:30:00.000Z",
    "updatedAt": "2025-06-20T12:30:00.000Z"
  }
}
```

---

### POST `/transactions`

Create a new transaction.

**Send:**
```json
{
  "amount": 42.50,
  "description": "Lunch at cafe",
  "type": "EXPENSE",
  "categoryId": "cat-uuid",
  "date": "2025-06-20T12:30:00.000Z",
  "paymentMethod": "credit_card",
  "notes": "Team lunch",
  "receiptUrl": "https://blob.vercel-storage.com/...",
  "tags": ["food", "team"]
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `amount` | Yes | Must be positive (> 0) |
| `description` | Yes | 1–255 characters |
| `type` | Yes | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `categoryId` | No | UUID of a category |
| `date` | No | ISO 8601 datetime. Defaults to now. |
| `paymentMethod` | No | Max 50 characters |
| `notes` | No | Max 1000 characters |
| `receiptUrl` | No | URL to an uploaded receipt |
| `tags` | No | Array of strings, max 10, each max 30 chars |

**Returns (201):**
```json
{
  "success": true,
  "data": { "...same shape as GET /:id..." },
  "message": "Transaction created"
}
```

---

### PUT `/transactions/:id`

Update a transaction. All fields are optional — only send what you want to change.

**Send:**
```json
{
  "amount": 50.00,
  "description": "Lunch and coffee",
  "categoryId": null
}
```

> `categoryId: null` removes the category from the transaction.

**Returns (200):**
```json
{
  "success": true,
  "data": { "...updated transaction..." },
  "message": "Transaction updated"
}
```

---

### DELETE `/transactions/:id`

Delete a transaction.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Transaction deleted"
}
```

---

### POST `/transactions/bulk-delete`

Delete multiple transactions at once.

**Send:**
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `ids` | Yes | Array of 1–100 UUIDs |

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Transactions deleted"
}
```

---

## Categories

All endpoints require auth.

### GET `/categories`

List all categories for the user, including system defaults.

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid",
      "userId": "user-uuid",
      "name": "Salary",
      "icon": "dollar",
      "color": "#22c55e",
      "type": "INCOME"
    },
    {
      "id": "cat-uuid-2",
      "userId": null,
      "name": "Groceries",
      "icon": "shopping-cart",
      "color": "#f59e0b",
      "type": "EXPENSE"
    }
  ]
}
```

> Categories with `userId: null` are system defaults available to all users.

---

### GET `/categories/:id`

Get one category. Returns 404 if not found or belongs to another user.

---

### POST `/categories`

Create a custom category.

**Send:**
```json
{
  "name": "Coffee",
  "icon": "coffee",
  "color": "#8b5cf6",
  "type": "EXPENSE"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `name` | Yes | 1–50 characters |
| `icon` | No | Lucide icon name. Defaults to `"circle"`. |
| `color` | No | Hex color like `#8b5cf6`. Defaults to `"#6366f1"`. |
| `type` | Yes | `INCOME` or `EXPENSE` |

**Returns (201):**
```json
{
  "success": true,
  "data": { "...category object..." },
  "message": "Category created"
}
```

> Can't have two categories with the same name and type (returns 409 Conflict).

---

### PUT `/categories/:id`

Update a category. All fields are optional.

> Can't edit default (system) categories — returns 403 Forbidden.

**Returns (200):**
```json
{
  "success": true,
  "data": { "...updated category..." },
  "message": "Category updated"
}
```

---

### DELETE `/categories/:id`

Delete a category. Transactions using it will have their `categoryId` set to null. Budgets and recurring transactions using it will be reassigned to a fallback "Uncategorized" category. This is done atomically (all or nothing).

> Can't delete default (system) categories — returns 403 Forbidden.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Category deleted"
}
```

---

## Budgets

All endpoints require auth. Budgets support pagination.

### GET `/budgets`

List budgets with how much has been spent and the percentage used.

**Query parameters:** `page` (default 1) and `limit` (default 10, max 100).

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "budget-uuid",
      "userId": "user-uuid",
      "categoryId": "cat-uuid",
      "limit": 2000,
      "spent": 1450,
      "period": "MONTHLY",
      "startDate": "2025-06-01T00:00:00.000Z",
      "endDate": "2025-06-30T23:59:59.999Z",
      "category": {
        "id": "cat-uuid",
        "name": "Food",
        "icon": "utensils",
        "color": "#ef4444"
      },
      "percentage": 72.5
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

| Field | What It Means |
|-------|--------------|
| `limit` | The spending limit you set (in USD) |
| `spent` | How much has been spent in this category within the date range |
| `percentage` | `spent / limit * 100` |
| `period` | `WEEKLY`, `MONTHLY`, or `YEARLY` |

---

### GET `/budgets/:id`

Get one budget.

---

### POST `/budgets`

Create a budget.

**Send:**
```json
{
  "categoryId": "cat-uuid",
  "limit": 2000,
  "period": "MONTHLY",
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-06-30T23:59:59.999Z"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `categoryId` | No | UUID of a category. Omit for a general budget. |
| `limit` | Yes | Must be positive (> 0) |
| `period` | No | `WEEKLY`, `MONTHLY`, or `YEARLY`. Defaults to `MONTHLY`. |
| `startDate` | No | ISO 8601. Defaults to now. |
| `endDate` | No | ISO 8601. Defaults to end of current month. |

**Returns (201):**
```json
{
  "success": true,
  "data": { "...budget object with spent/percentage..." },
  "message": "Budget created"
}
```

> Can't have two budgets for the same category and period (returns 409 Conflict).

---

### PUT `/budgets/:id`

Update a budget. Note: you can't change `categoryId` — delete and recreate instead.

**Send:**
```json
{
  "limit": 2500,
  "period": "WEEKLY"
}
```

**Returns (200):**
```json
{
  "success": true,
  "data": { "...updated budget..." },
  "message": "Budget updated"
}
```

---

### DELETE `/budgets/:id`

Delete a budget.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Budget deleted"
}
```

---

## Savings Goals

All endpoints require auth. Goals support pagination.

### GET `/goals`

List goals with progress percentage.

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "goal-uuid",
      "userId": "user-uuid",
      "name": "Emergency Fund",
      "targetAmount": 10000,
      "currentAmount": 3500,
      "deadline": "2025-12-31T00:00:00.000Z",
      "progress": 35,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

> `progress` = `currentAmount / targetAmount * 100`

---

### GET `/goals/:id`

Get one goal.

---

### POST `/goals`

Create a goal.

**Send:**
```json
{
  "name": "Vacation Fund",
  "targetAmount": 5000,
  "currentAmount": 500,
  "deadline": "2026-06-01T00:00:00.000Z"
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `name` | Yes | 1–100 characters |
| `targetAmount` | Yes | Must be positive (> 0) |
| `currentAmount` | No | Min 0. Defaults to 0. |
| `deadline` | No | ISO 8601 or `null` (no deadline) |

**Returns (201):**
```json
{
  "success": true,
  "data": { "...goal object..." },
  "message": "Goal created"
}
```

---

### PUT `/goals/:id`

Update a goal. All fields are optional.

**Returns (200):**
```json
{
  "success": true,
  "data": { "...updated goal..." },
  "message": "Goal updated"
}
```

---

### DELETE `/goals/:id`

Delete a goal.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Goal deleted"
}
```

---

### POST `/goals/:id/contribute`

Add money to a goal. Uses an atomic database increment (prevents race conditions if two people contribute at the same time).

**Send:**
```json
{
  "amount": 500
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `amount` | Yes | Must be positive (> 0) |

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "id": "goal-uuid",
    "userId": "user-uuid",
    "name": "Emergency Fund",
    "targetAmount": 10000,
    "currentAmount": 4000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "progress": 40,
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Contribution added"
}
```

---

## Notifications

All endpoints require auth. Notifications support pagination.

### GET `/notifications`

List notifications.

**Query parameters:** `page` (default 1) and `limit` (default 50, max 100).

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "userId": "user-uuid",
      "title": "Budget Alert",
      "message": "You've spent 90% of your Food budget.",
      "type": "WARNING",
      "isRead": false,
      "createdAt": "2025-06-20T12:00:00.000Z",
      "updatedAt": "2025-06-20T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1,
    "unreadCount": 5
  }
}
```

| Field | What It Means |
|-------|--------------|
| `type` | `INFO`, `WARNING`, `ERROR`, or `SUCCESS` |
| `isRead` | `true` if the user has read this notification |
| `meta.unreadCount` | Total unread notifications (across all pages) |

---

### PATCH `/notifications/read-all`

Mark all notifications as read.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "All notifications marked as read"
}
```

---

### PATCH `/notifications/:id/read`

Mark one notification as read. Returns 404 if not found.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Notification marked as read"
}
```

---

### DELETE `/notifications/:id`

Delete a notification. Returns 404 if not found.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Notification deleted"
}
```

---

## Analytics

All endpoints require auth. All responses are cached by the browser for 1–5 minutes.

### GET `/analytics/dashboard`

Dashboard summary: KPIs, health score, and recent transactions.

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "currentBalance": 6500,
    "totalIncome": 15000,
    "totalExpenses": 8500,
    "savings": 6500,
    "monthlyBudgetUsage": 42.5,
    "healthScore": { "score": 75, "label": "Good" },
    "recentTransactions": [ { "...up to 10 recent transactions..." } ],
    "monthIncome": 5000,
    "monthExpenses": 1450,
    "totalBudgets": 3,
    "totalGoals": 2
  }
}
```

| Field | What It Means |
|-------|--------------|
| `currentBalance` | Total income minus total expenses (all time) |
| `savings` | Same as currentBalance (total income minus total expenses) |
| `monthlyBudgetUsage` | Percentage of total budget used this month |
| `healthScore.score` | 0–100, or `null` if not enough data |
| `healthScore.label` | "Excellent" (80+), "Good" (60+), "Fair" (40+), or "Poor" (<40) |
| `recentTransactions` | 10 most recent transactions |
| `monthIncome` / `monthExpenses` | Income/expenses for the current calendar month |

---

### GET `/analytics/overview`

Combined dashboard + monthly spending data. Same as calling `/dashboard` and `/monthly-spending` in one request.

---

### GET `/analytics/monthly-spending`

Income and expenses broken down by month.

**Query parameter:** `months` (default 6, range 1–36).

**Returns (200):**
```json
{
  "success": true,
  "data": [
    { "month": "Jan '25", "income": 5000, "expenses": 3200 },
    { "month": "Feb '25", "income": 5000, "expenses": 2850 }
  ]
}
```

---

### GET `/analytics/category-breakdown`

Expense breakdown by category for a date range.

**Query parameters:** `startDate` and `endDate` (both optional, ISO 8601). If omitted, returns all-time breakdown.

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": "cat-uuid",
      "categoryName": "Food",
      "categoryColor": "#ef4444",
      "categoryIcon": "utensils",
      "total": 1450,
      "count": 23
    }
  ]
}
```

> Results are sorted by `total` (highest first).

---

### GET `/analytics/cash-flow`

Income vs expenses over time. Same format as `/monthly-spending` but defaults to 12 months.

**Query parameter:** `months` (default 12, range 1–36).

---

### GET `/analytics/net-worth`

Current net worth and monthly trend.

**Returns (200):**
```json
{
  "success": true,
  "data": {
    "currentNetWorth": 6500,
    "trend": [
      { "date": "2025-01", "netWorth": 1800 },
      { "date": "2025-02", "netWorth": 3950 },
      { "date": "2025-03", "netWorth": 6350 }
    ]
  }
}
```

> `trend[].date` is `YYYY-MM` format. `netWorth` is a running cumulative sum of income minus expenses.

---

## File Uploads

All endpoints require auth.

### POST `/uploads/receipt`

Upload a receipt file. Uses `multipart/form-data`.

**Send:** A file in the `file` field.

| Rules | Details |
|-------|---------|
| Allowed types | JPEG, PNG, WebP, PDF |
| Max size | 5 MB |

**Example (curl):**
```bash
curl -X POST https://your-api.com/api/v1/uploads/receipt \
  -H "Authorization: Bearer <token>" \
  -F "file=@receipt.jpg"
```

**Returns (201):**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/..."
  },
  "message": "File uploaded"
}
```

**Errors:**
- 400 — No file sent, or wrong file type
- 503 — Blob storage not configured on the server

---

### POST `/uploads/receipt/delete`

Delete a receipt. Verifies that the file belongs to the user before deleting. Any transactions using this receipt URL will have it cleared.

**Send:**
```json
{
  "url": "https://blob.vercel-storage.com/..."
}
```

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "File deleted"
}
```

**Errors:**
- 400 — No URL provided
- 403 — This URL doesn't belong to you
- 503 — Blob storage not configured

---

## Recurring Transactions

All endpoints require auth. Note: the list endpoint does NOT support pagination — all templates are returned at once.

### GET `/recurring`

List all recurring transaction templates.

**Returns (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "recurring-uuid",
      "userId": "user-uuid",
      "categoryId": "cat-uuid",
      "amount": 1500,
      "description": "Monthly rent",
      "type": "EXPENSE",
      "interval": "MONTHLY",
      "dayOfMonth": 1,
      "dayOfWeek": null,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": null,
      "nextDate": "2025-07-01T00:00:00.000Z",
      "isActive": true,
      "category": {
        "id": "cat-uuid",
        "name": "Housing",
        "icon": "home",
        "color": "#6366f1"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

| Field | What It Means |
|-------|--------------|
| `interval` | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `dayOfMonth` | Day of month (1–31) for MONTHLY/YEARLY |
| `dayOfWeek` | Day of week (0=Sunday – 6=Saturday) for WEEKLY |
| `nextDate` | When the cron job should next create a transaction |
| `isActive` | `false` = paused or past end date. `true` = still running. |

---

### GET `/recurring/:id`

Get one recurring template.

---

### POST `/recurring`

Create a recurring template.

**Send:**
```json
{
  "categoryId": "cat-uuid",
  "amount": 1500,
  "description": "Monthly rent",
  "type": "EXPENSE",
  "interval": "MONTHLY",
  "dayOfMonth": 1,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": null
}
```

| Field | Required? | Rules |
|-------|-----------|-------|
| `categoryId` | Yes | UUID of a category |
| `amount` | Yes | Must be positive (> 0) |
| `description` | Yes | 1–255 characters |
| `type` | Yes | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `interval` | Yes | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `dayOfMonth` | No | 1–31 (for MONTHLY/YEARLY) |
| `dayOfWeek` | No | 0–6 (for WEEKLY) |
| `startDate` | No | ISO 8601. Defaults to now. |
| `endDate` | No | ISO 8601 or `null` (runs forever) |

**Returns (201):**
```json
{
  "success": true,
  "data": { "...recurring transaction..." },
  "message": "Recurring transaction created"
}
```

---

### PATCH `/recurring/:id`

Update a recurring template. All fields are optional.

**Send:**
```json
{
  "amount": 1600,
  "isActive": false
}
```

**Returns (200):**
```json
{
  "success": true,
  "data": { "...updated template..." },
  "message": "Recurring transaction updated"
}
```

---

### DELETE `/recurring/:id`

Delete a recurring template.

**Returns (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Recurring transaction deleted"
}
```

---

## Cron Job

### POST `/cron/recurring`

Process all due recurring transactions. This is called automatically by Vercel Cron daily at midnight. You don't call this manually.

**Authentication:** Uses `X-Cron-Secret` header (not JWT).

**Returns (200):**
```json
{
  "success": true,
  "data": { "processed": 5 },
  "message": "Recurring transactions processed"
}
```

**Errors:**
- 401 — Wrong or missing secret
- 503 — Cron secret not configured on the server

---

## Health Check

### GET `/api/v1/health`

Check if the API is running. No auth needed.

**Returns (200):**
```json
{
  "success": true,
  "message": "Coin Toss API is running",
  "timestamp": "2025-06-20T12:00:00.000Z"
}
```

---

## Summary

| What | Count |
|------|-------|
| Total endpoints | 38 |
| Public (no login needed) | 7 |
| Require login (JWT) | 30 |
| Cron job (special auth) | 1 |
| Rate-limited | 6 (auth endpoints) |
| Validated with Zod | 23 |
| Cached by browser | 6 (analytics) |
| Paginated | 4 (transactions, budgets, goals, notifications) |