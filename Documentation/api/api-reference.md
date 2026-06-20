# API Endpoints Reference

**Base URL:** `/api/v1`  
**Authentication:** JWT Bearer token in `Authorization: Bearer <token>` header (unless noted otherwise)  
**Content-Type:** `application/json` (except file uploads, which use `multipart/form-data`)

All amounts are stored in USD (base currency) and converted client-side at display time.

---

## Table of Contents

- [Response Envelope](#response-envelope)
- [Error Handling](#error-handling)
- [Authentication](#authentication-apiv1auth)
- [Transactions](#transactions-apiv1transactions)
- [Categories](#categories-apiv1categories)
- [Budgets](#budgets-apiv1budgets)
- [Savings Goals](#savings-goals-apiv1goals)
- [Notifications](#notifications-apiv1notifications)
- [Analytics](#analytics-apiv1analytics)
- [File Uploads](#file-uploads-apiv1uploads)
- [Recurring Transactions](#recurring-transactions-apiv1recurring)
- [Cron Jobs](#cron-jobs-apiv1cron)
- [Health Check](#health-check-apiv1health)
- [Authentication Flow Diagram](#authentication-flow-diagram)
- [Summary Statistics](#summary-statistics)

---

## Response Envelope

Every API response follows a consistent JSON envelope.

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | `boolean` | Always | `true` on success |
| `data` | `object \| array \| null` | Always | The response payload. `null` for action-only endpoints (delete, logout, etc.) |
| `message` | `string` | Optional | Human-readable confirmation (present on most mutation endpoints) |
| `meta` | `object` | Optional | Pagination metadata (present on list endpoints) |

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | `boolean` | Always | `false` on error |
| `error` | `string` | Always | Human-readable error description |
| `code` | `string` | Optional | Machine-readable error code (e.g., `VALIDATION_ERROR`, `CRON_NOT_CONFIGURED`) |
| `errors` | `Record<string, string[]>` | Optional | Per-field validation errors (Zod validation failures only) |

### Pagination Metadata

List endpoints that support pagination include a `meta` object:

```json
{
  "meta": {
    "page": 1,
    "limit": 15,
    "total": 42,
    "totalPages": 3
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `page` | `number` | Current page number (1-based) |
| `limit` | `number` | Items per page (max 100) |
| `total` | `number` | Total item count across all pages |
| `totalPages` | `number` | Total number of pages |

> **Note:** The notifications endpoint extends `meta` with an additional `unreadCount: number` field.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (create) |
| 400 | Bad Request | Validation errors, malformed input |
| 401 | Unauthorized | Missing, expired, or invalid JWT |
| 403 | Forbidden | Insufficient permissions (e.g., modifying a default category) |
| 404 | Not Found | Resource doesn't exist or doesn't belong to the authenticated user |
| 409 | Conflict | Duplicate email on registration |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors (generic message in production) |
| 503 | Service Unavailable | External service not configured (Blob storage, Cron secret) |

### Common Error Examples

**Zod validation error (400):**
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

**Authentication error (401):**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTHENTICATION_ERROR"
}
```

**Not found error (404):**
```json
{
  "success": false,
  "error": "Transaction not found",
  "code": "NOT_FOUND"
}
```

**Rate limit exceeded (429):**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Rate Limiting

| Scope | Limit | Window | Endpoints |
|-------|-------|--------|-----------|
| Auth endpoints | 5 requests | 15 minutes | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout` |
| General API | 100 requests | 15 minutes | All other endpoints |

> Rate limiting uses Upstash Redis (via Lua script for accurate fixed-window behavior) in production and falls back to in-memory for local development.

---

## Authentication (`/api/v1/auth`)

All auth endpoints set `Cache-Control: no-store`. Public endpoints are rate-limited.

### POST `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "passwordConfirmation": "Password123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | `string` | Yes | 2–100 characters |
| `email` | `string` | Yes | Valid email format |
| `password` | `string` | Yes | Min 8 chars, must contain uppercase, lowercase, and a number |
| `passwordConfirmation` | `string` | Yes | Must match `password` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "a1b2c3d4-...",
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

> **Note:** The `user` object in `register`/`login` responses does **not** include `createdAt`/`updatedAt`. The `refreshToken` is also set as an `httpOnly` cookie.

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | Missing/invalid fields, passwords don't match |
| 409 | `CONFLICT` | Email already registered |

---

### POST `/auth/login`

Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123",
  "rememberMe": true
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Valid email format |
| `password` | `string` | Yes | Min 1 character |
| `rememberMe` | `boolean` | No | Defaults to `false`. Extends refresh token cookie lifetime to 30 days (1 day otherwise) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "a1b2c3d4-...",
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

> Sets `refreshToken` as an `httpOnly` cookie. Cookie `maxAge` is 30 days if `rememberMe` is `true`, 1 day otherwise.

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | Missing/invalid fields |
| 401 | `AUTHENTICATION_ERROR` | Invalid credentials |

---

### POST `/auth/refresh`

Get a new access/refresh token pair. Requires either the `refreshToken` cookie or a `refreshToken` in the request body.

**Request Body (optional if cookie present):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> Sets a new `refreshToken` httpOnly cookie. Cookie `maxAge` matches the new refresh token's actual expiry. No `message` field is returned.

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | No refresh token provided (neither cookie nor body) |
| 401 | `AUTHENTICATION_ERROR` | Invalid, expired, or revoked refresh token |

---

### POST `/auth/logout`

Revoke the refresh token and clear the cookie.

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> If no body is provided, the `refreshToken` cookie is used instead.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/forgot-password`

Request a password reset email. Always returns success regardless of whether the email exists.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "If the email exists, a reset link has been sent"
}
```

---

### POST `/auth/reset-password`

Reset password using the token from the reset email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123",
  "passwordConfirmation": "NewPassword123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | `string` | Yes | Reset token from email |
| `password` | `string` | Yes | Same rules as registration (min 8, uppercase, lowercase, number) |
| `passwordConfirmation` | `string` | Yes | Must match `password` |

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successful"
}
```

> All existing refresh tokens are revoked after a password reset.

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | Missing/invalid fields, passwords don't match |
| 400 | `BAD_REQUEST` | Invalid or expired reset token |

---

### GET `/auth/me`

Get the current user's profile. Requires JWT authentication.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
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

> The `data` field is the `SafeUser` object — note it includes `createdAt` and `updatedAt`, unlike the login/register response.

---

### PATCH `/auth/profile`

Update the user's name and/or email.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | `string` | No | 2–100 characters |
| `email` | `string` | No | Valid email format |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
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

Change the current password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "newPasswordConfirmation": "NewPassword123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currentPassword` | `string` | Yes | Min 1 character |
| `newPassword` | `string` | Yes | Same rules as registration (min 8, uppercase, lowercase, number) |
| `newPasswordConfirmation` | `string` | Yes | Must match `newPassword` |

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | New passwords don't match, new password too weak |
| 401 | `AUTHENTICATION_ERROR` | Current password is incorrect |

---

### PATCH `/auth/preferences`

Update currency and/or locale preferences.

**Request Body:**
```json
{
  "currency": "EUR",
  "locale": "de-DE"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currency` | `string` | No | One of: `USD`, `EUR`, `GBP`, `JPY`, `CNY`, `INR`, `ILS` |
| `locale` | `string` | No | 2–10 characters |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
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

Permanently delete the user's account and all associated data. This action is irreversible.

> **Note:** This endpoint does not require password confirmation. All refresh tokens are revoked and the user record is deleted atomically in a database transaction.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Account deleted successfully"
}
```

> Clears the `refreshToken` cookie.

---

## Transactions (`/api/v1/transactions`)

All endpoints require JWT authentication.

### GET `/transactions`

List transactions with filtering, sorting, and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `string` | `"1"` | Page number (1-based) |
| `limit` | `string` | `"15"` | Items per page (max 100) |
| `sortBy` | `string` | `"date"` | One of: `date`, `amount`, `createdAt`, `description` |
| `sortOrder` | `string` | `"desc"` | `asc` or `desc` |
| `type` | `string` | — | Filter by type: `INCOME`, `EXPENSE`, `TRANSFER` |
| `categoryId` | `string` | — | Filter by category (UUID) |
| `startDate` | `string` | — | Filter from date (ISO 8601) |
| `endDate` | `string` | — | Filter to date (ISO 8601) |
| `minAmount` | `string` | — | Minimum amount (in base currency) |
| `maxAmount` | `string` | — | Maximum amount (in base currency) |
| `search` | `string` | — | Full-text search on description/notes |
| `tags` | `string` | — | Comma-separated tags |
| `paymentMethod` | `string` | — | Filter by payment method |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx-uuid-1",
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
  "meta": {
    "page": 1,
    "limit": 15,
    "total": 42,
    "totalPages": 3
  }
}
```

> `Cache-Control: private, max-age=15`

---

### GET `/transactions/summary`

Get income/expense summary for a date range.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | `string` | — | Start date (ISO 8601) |
| `endDate` | `string` | — | End date (ISO 8601) |

**Response (200):**
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

> `Cache-Control: private, max-age=30`

---

### GET `/transactions/:id`

Get a single transaction by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid-1",
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
}
```

> `Cache-Control: private, max-age=30`. Returns 404 if the transaction doesn't exist or belongs to another user.

---

### POST `/transactions`

Create a new transaction.

**Request Body:**
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

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | Must be positive (> 0) |
| `description` | `string` | Yes | 1–255 characters |
| `type` | `string` | Yes | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `categoryId` | `string` | No | UUID of an existing category |
| `date` | `string` | No | ISO 8601 datetime. Defaults to current time |
| `paymentMethod` | `string` | No | Max 50 characters |
| `notes` | `string` | No | Max 1000 characters |
| `receiptUrl` | `string` | No | URL to uploaded receipt |
| `isRecurring` | `boolean` | No | Defaults to `false` |
| `tags` | `string[]` | No | Max 10 tags, each max 30 characters. Defaults to `[]` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-tx-uuid",
    "userId": "user-uuid",
    "categoryId": "cat-uuid",
    "amount": 42.50,
    "description": "Lunch at cafe",
    "type": "EXPENSE",
    "date": "2025-06-20T12:30:00.000Z",
    "paymentMethod": "credit_card",
    "notes": "Team lunch",
    "receiptUrl": "https://blob.vercel-storage.com/...",
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
  },
  "message": "Transaction created"
}
```

---

### PUT `/transactions/:id`

Update an existing transaction. All fields are optional — only provided fields are updated.

**Request Body:**
```json
{
  "amount": 50.00,
  "description": "Lunch and coffee",
  "categoryId": null,
  "notes": null
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `amount` | `number` | Must be positive |
| `description` | `string` | 1–255 characters |
| `type` | `string` | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `categoryId` | `string \| null` | UUID or `null` to unset |
| `date` | `string` | ISO 8601 datetime |
| `paymentMethod` | `string \| null` | Max 50 characters |
| `notes` | `string \| null` | Max 1000 characters |
| `receiptUrl` | `string \| null` | URL to uploaded receipt |
| `tags` | `string[]` | Max 10 tags, each max 30 characters |

**Response (200):**
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

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Transaction deleted"
}
```

---

### POST `/transactions/bulk-delete`

Delete multiple transactions in one request.

**Request Body:**
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `ids` | `string[]` | Yes | 1–100 UUIDs |

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Transactions deleted"
}
```

---

## Categories (`/api/v1/categories`)

All endpoints require JWT authentication.

### GET `/categories`

List all user-created and default (system) categories.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-1",
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

> `Cache-Control: private, max-age=300`. Categories with `userId: null` are default/system categories available to all users.

---

### GET `/categories/:id`

Get a single category.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cat-uuid-1",
    "userId": "user-uuid",
    "name": "Salary",
    "icon": "dollar",
    "color": "#22c55e",
    "type": "INCOME"
  }
}
```

> `Cache-Control: private, max-age=300`. Returns 404 if the category doesn't exist or belongs to another user. Default categories are accessible to all users.

---

### POST `/categories`

Create a custom category.

**Request Body:**
```json
{
  "name": "Coffee",
  "icon": "coffee",
  "color": "#8b5cf6",
  "type": "EXPENSE"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | `string` | Yes | 1–50 characters |
| `icon` | `string` | No | Max 30 characters. Defaults to `"circle"` |
| `color` | `string` | No | Hex color `#RRGGBB`. Defaults to `"#6366f1"` |
| `type` | `string` | Yes | `INCOME` or `EXPENSE` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-cat-uuid",
    "userId": "user-uuid",
    "name": "Coffee",
    "icon": "coffee",
    "color": "#8b5cf6",
    "type": "EXPENSE"
  },
  "message": "Category created"
}
```

> Duplicate `(userId, name, type)` combinations are rejected with a 409 Conflict.

---

### PUT `/categories/:id`

Update a category. All fields are optional.

**Request Body:**
```json
{
  "name": "Coffee & Tea",
  "color": "#ec4899"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "...updated category..." },
  "message": "Category updated"
}
```

> Returns 403 if attempting to modify a default (system) category.

---

### DELETE `/categories/:id`

Delete a category. Transactions referencing this category will have their `categoryId` set to `null` (`onDelete: SetNull`). Budgets and recurring transactions referencing this category will be reassigned to a lazily-created "Uncategorized" fallback category. This operation is atomic (wrapped in a database transaction).

> Returns 403 if attempting to delete a default (system) category.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Category deleted"
}
```

---

## Budgets (`/api/v1/budgets`)

All endpoints require JWT authentication.

### GET `/budgets`

List budgets with spent amount and percentage calculation. Supports pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `string` | `"1"` | Page number (1-based) |
| `limit` | `string` | `"10"` | Items per page (max 100) |

**Response (200):**
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
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

> `Cache-Control: private, max-age=30`. `spent` and `percentage` are computed server-side based on the budget's date range and the user's transactions.

**Response Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `limit` | `number` | Budget limit in base currency (USD) |
| `spent` | `number` | Total expenses in the budget's category and date range |
| `percentage` | `number` | `spent / limit * 100` |
| `period` | `string` | `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `category` | `object \| null` | Flattened category subset: `{ id, name, icon, color }` |

---

### GET `/budgets/:id`

Get a single budget with spent/percentage.

**Response (200):**
```json
{
  "success": true,
  "data": {
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
}
```

> `Cache-Control: private, max-age=30`

---

### POST `/budgets`

Create a budget.

**Request Body:**
```json
{
  "categoryId": "cat-uuid",
  "limit": 2000,
  "period": "MONTHLY",
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-06-30T23:59:59.999Z"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `categoryId` | `string` | No | UUID of a category. If omitted, budget applies to all expenses |
| `limit` | `number` | Yes | Must be positive (> 0) |
| `period` | `string` | No | `WEEKLY`, `MONTHLY`, or `YEARLY`. Defaults to `MONTHLY` |
| `startDate` | `string` | No | ISO 8601 datetime. Defaults to current time |
| `endDate` | `string` | No | ISO 8601 datetime. Defaults to end of current month |

**Response (201):**
```json
{
  "success": true,
  "data": { "...budget object with spent/percentage..." },
  "message": "Budget created"
}
```

> Duplicate `(userId, categoryId, period)` combinations are rejected with a 409 Conflict.

---

### PUT `/budgets/:id`

Update a budget. All fields are optional.

> **Note:** `categoryId` cannot be changed via update. To change the category, delete and recreate the budget.

**Request Body:**
```json
{
  "limit": 2500,
  "period": "WEEKLY"
}
```

**Response (200):**
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

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Budget deleted"
}
```

---

## Savings Goals (`/api/v1/goals`)

All endpoints require JWT authentication.

### GET `/goals`

List savings goals with progress percentage. Supports pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `string` | `"1"` | Page number (1-based) |
| `limit` | `string` | `"10"` | Items per page (max 100) |

**Response (200):**
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
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

> `Cache-Control: private, max-age=30`. `progress` is computed as `currentAmount / targetAmount * 100`.

---

### GET `/goals/:id`

Get a single goal with progress.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "goal-uuid",
    "userId": "user-uuid",
    "name": "Emergency Fund",
    "targetAmount": 10000,
    "currentAmount": 3500,
    "deadline": "2025-12-31T00:00:00.000Z",
    "progress": 35,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### POST `/goals`

Create a savings goal.

**Request Body:**
```json
{
  "name": "Vacation Fund",
  "targetAmount": 5000,
  "currentAmount": 500,
  "deadline": "2026-06-01T00:00:00.000Z"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | `string` | Yes | 1–100 characters |
| `targetAmount` | `number` | Yes | Must be positive (> 0) |
| `currentAmount` | `number` | No | Min 0. Defaults to `0` |
| `deadline` | `string \| null` | No | ISO 8601 datetime. `null` means no deadline |

**Response (201):**
```json
{
  "success": true,
  "data": { "...goal object with progress..." },
  "message": "Goal created"
}
```

---

### PUT `/goals/:id`

Update a goal. All fields are optional.

**Request Body:**
```json
{
  "name": "Vacation Fund 2026",
  "targetAmount": 6000
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | `string` | 1–100 characters |
| `targetAmount` | `number` | Must be positive |
| `currentAmount` | `number` | Min 0 |
| `deadline` | `string \| null` | ISO 8601 datetime or `null` |

**Response (200):**
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

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Goal deleted"
}
```

---

### POST `/goals/:id/contribute`

Add funds to a savings goal. Uses an atomic database increment to prevent race conditions.

**Request Body:**
```json
{
  "amount": 500
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | Must be positive (> 0) |

**Response (200):**
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

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `VALIDATION_ERROR` | Amount is not positive |
| 404 | `NOT_FOUND` | Goal doesn't exist or belongs to another user |

---

## Notifications (`/api/v1/notifications`)

All endpoints require JWT authentication.

### GET `/notifications`

List notifications with unread count. Supports pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `string` | `"1"` | Page number (1-based) |
| `limit` | `string` | `"50"` | Items per page (1–100) |

**Response (200):**
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

> `Cache-Control: private, max-age=15`. The `meta` object extends standard pagination with `unreadCount`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | One of: `INFO`, `WARNING`, `ERROR`, `SUCCESS` |
| `isRead` | `boolean` | Whether the notification has been read |
| `meta.unreadCount` | `number` | Total unread notifications across all pages |

---

### PATCH `/notifications/read-all`

Mark all notifications as read.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "All notifications marked as read"
}
```

---

### PATCH `/notifications/:id/read`

Mark a single notification as read.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Notification marked as read"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 404 | `NOT_FOUND` | Notification doesn't exist or belongs to another user |

---

### DELETE `/notifications/:id`

Delete a notification.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Notification deleted"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 404 | `NOT_FOUND` | Notification doesn't exist or belongs to another user |

---

## Analytics (`/api/v1/analytics`)

All endpoints require JWT authentication. All responses are cached with `Cache-Control: private, max-age=N`.

### GET `/analytics/dashboard`

Get dashboard summary including KPIs, health score, and recent transactions.

> `Cache-Control: private, max-age=60`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentBalance": 6500,
    "totalIncome": 15000,
    "totalExpenses": 8500,
    "savings": 6500,
    "monthlyBudgetUsage": 42.5,
    "healthScore": {
      "score": 75,
      "label": "Good"
    },
    "recentTransactions": [
      {
        "id": "tx-uuid",
        "userId": "user-uuid",
        "categoryId": "cat-uuid",
        "amount": 42.50,
        "description": "Lunch at cafe",
        "type": "EXPENSE",
        "date": "2025-06-20T12:30:00.000Z",
        "paymentMethod": "credit_card",
        "notes": null,
        "receiptUrl": null,
        "isRecurring": false,
        "tags": [],
        "category": {
          "id": "cat-uuid",
          "name": "Food",
          "icon": "utensils",
          "color": "#ef4444"
        },
        "createdAt": "2025-06-20T12:30:00.000Z",
        "updatedAt": "2025-06-20T12:30:00.000Z"
      }
    ],
    "monthIncome": 5000,
    "monthExpenses": 1450,
    "totalBudgets": 3,
    "totalGoals": 2
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `currentBalance` | `number` | Total income minus total expenses (all time) |
| `totalIncome` | `number` | Sum of all income transactions (all time) |
| `totalExpenses` | `number` | Sum of all expense transactions (all time) |
| `savings` | `number` | `totalIncome - totalExpenses` |
| `monthlyBudgetUsage` | `number` | Percentage of total budget used this month |
| `healthScore.score` | `number \| null` | Financial health score (0–100), or `null` if insufficient data |
| `healthScore.label` | `string` | Human-readable health label (e.g., "Good", "Excellent", "Needs Attention") |
| `recentTransactions` | `Transaction[]` | 10 most recent transactions |
| `monthIncome` | `number` | Income this calendar month |
| `monthExpenses` | `number` | Expenses this calendar month |
| `totalBudgets` | `number` | Count of user's budgets |
| `totalGoals` | `number` | Count of user's savings goals |

---

### GET `/analytics/overview`

Combined dashboard summary + monthly spending data.

> `Cache-Control: private, max-age=60`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dashboard": { "...DashboardData object (same as /dashboard)..." },
    "monthlySpending": [
      { "month": "Jan '25", "income": 5000, "expenses": 3200 },
      { "month": "Feb '25", "income": 5000, "expenses": 2850 }
    ]
  }
}
```

---

### GET `/analytics/monthly-spending`

Monthly income and expense breakdown.

> `Cache-Control: private, max-age=120`

**Query Parameters:**

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `months` | `string` | `"6"` | Integer 1–36 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "month": "Jan '25", "income": 5000, "expenses": 3200 },
    { "month": "Feb '25", "income": 5000, "expenses": 2850 },
    { "month": "Mar '25", "income": 5500, "expenses": 3100 },
    { "month": "Apr '25", "income": 5000, "expenses": 2900 },
    { "month": "May '25", "income": 5000, "expenses": 3400 },
    { "month": "Jun '25", "income": 5000, "expenses": 1450 }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `month` | `string` | Short month name + 2-digit year (e.g., `"Jan '25"`) |
| `income` | `number` | Total income for that month |
| `expenses` | `number` | Total expenses for that month |

---

### GET `/analytics/category-breakdown`

Expense breakdown by category for a date range.

> `Cache-Control: private, max-age=120`

**Query Parameters:**

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `startDate` | `string` | — | ISO 8601 datetime |
| `endDate` | `string` | — | ISO 8601 datetime |

> If both are omitted, returns breakdown for all time.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": "cat-uuid-1",
      "categoryName": "Food",
      "categoryColor": "#ef4444",
      "categoryIcon": "utensils",
      "total": 1450,
      "count": 23
    },
    {
      "categoryId": "cat-uuid-2",
      "categoryName": "Transport",
      "categoryColor": "#3b82f6",
      "categoryIcon": "car",
      "total": 850,
      "count": 12
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `categoryId` | `string \| null` | Category UUID, or `null` for uncategorized |
| `categoryName` | `string` | Category name, or `"Unknown"` if category was deleted |
| `categoryColor` | `string` | Hex color code |
| `categoryIcon` | `string` | Icon identifier |
| `total` | `number` | Total expenses in this category |
| `count` | `number` | Number of expense transactions |

> Results are sorted by `total` descending.

---

### GET `/analytics/cash-flow`

Cash flow (income vs expenses) over time.

> `Cache-Control: private, max-age=300`

**Query Parameters:**

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `months` | `string` | `"12"` | Integer 1–36 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "month": "Jul '24", "income": 5000, "expenses": 3000 },
    { "month": "Aug '24", "income": 5000, "expenses": 2800 },
    { "month": "Sep '24", "income": 5500, "expenses": 3100 }
  ]
}
```

> Same shape as `/analytics/monthly-spending`, but defaults to 12 months.

---

### GET `/analytics/net-worth`

Net worth calculation with monthly cumulative trend.

> `Cache-Control: private, max-age=60`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentNetWorth": 6500,
    "trend": [
      { "date": "2025-01", "netWorth": 1800 },
      { "date": "2025-02", "netWorth": 3950 },
      { "date": "2025-03", "netWorth": 6350 },
      { "date": "2025-04", "netWorth": 8450 },
      { "date": "2025-05", "netWorth": 5050 },
      { "date": "2025-06", "netWorth": 6500 }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `currentNetWorth` | `number` | Total income minus total expenses (all time) |
| `trend` | `object[]` | Monthly cumulative net worth |
| `trend[].date` | `string` | `YYYY-MM` format |
| `trend[].netWorth` | `number` | Running cumulative sum income minus expenses |

---

## File Uploads (`/api/v1/uploads`)

All endpoints require JWT authentication.

### POST `/uploads/receipt`

Upload a receipt file. File is stored via Vercel Blob storage.

**Request:** `multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | `File` | Yes | JPEG, PNG, WebP, or PDF. Max 5 MB |

**Request Example (curl):**
```bash
curl -X POST https://api.example.com/api/v1/uploads/receipt \
  -H "Authorization: Bearer <token>" \
  -F "file=@receipt.jpg"
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/user-uuid/receipt-123456.jpg"
  },
  "message": "File uploaded"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `BAD_REQUEST` | No file provided |
| 400 | `VALIDATION_ERROR` | Invalid MIME type or file too large |
| 503 | `SERVICE_UNAVAILABLE` | Blob storage not configured (missing `BLOB_READ_WRITE_TOKEN`) |

---

### POST `/uploads/receipt/delete`

Delete a previously uploaded receipt. Verifies ownership before deletion. Any transactions referencing this receipt URL will have their `receiptUrl` set to `null` before the blob is deleted.

**Request Body:**
```json
{
  "url": "https://blob.vercel-storage.com/user-uuid/receipt-123456.jpg"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Must be a valid Vercel Blob URL |

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "File deleted"
}
```

**Errors:**

| Status | Error | When |
|--------|-------|------|
| 400 | `BAD_REQUEST` | No URL provided |
| 403 | `AUTHORIZATION_ERROR` | URL does not belong to the authenticated user |
| 503 | `SERVICE_UNAVAILABLE` | Blob storage not configured |

---

## Recurring Transactions (`/api/v1/recurring`)

All endpoints require JWT authentication.

> **Note:** Unlike transactions, budgets, goals, and notifications, the `GET /recurring` list endpoint does **not** support pagination — all recurring templates are returned in a single response.

### GET `/recurring`

List all recurring transaction templates.

**Response (200):**
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

| Field | Type | Description |
|-------|------|-------------|
| `interval` | `string` | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `dayOfMonth` | `number \| null` | Day of month (1–31) for monthly/yearly intervals |
| `dayOfWeek` | `number \| null` | Day of week (0=Sunday – 6=Saturday) for weekly intervals |
| `nextDate` | `string` | Next scheduled execution date (ISO 8601) |
| `isActive` | `boolean` | Whether the template is active (paused templates are skipped by cron) |

---

### GET `/recurring/:id`

Get a single recurring transaction template.

**Response (200):**
```json
{
  "success": true,
  "data": { "...single recurring transaction object..." }
}
```

---

### POST `/recurring`

Create a recurring transaction template.

**Request Body:**
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

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `categoryId` | `string` | Yes | UUID of a category |
| `amount` | `number` | Yes | Must be positive (> 0) |
| `description` | `string` | Yes | 1–255 characters |
| `type` | `string` | Yes | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `interval` | `string` | Yes | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `dayOfMonth` | `number \| null` | No | Integer 1–31. For MONTHLY/YEARLY intervals |
| `dayOfWeek` | `number \| null` | No | Integer 0–6 (0=Sunday). For WEEKLY interval |
| `startDate` | `string` | No | ISO 8601 datetime. Defaults to current time |
| `endDate` | `string \| null` | No | ISO 8601 datetime or `null` for no end date |

**Response (201):**
```json
{
  "success": true,
  "data": { "...recurring transaction object..." },
  "message": "Recurring transaction created"
}
```

---

### PATCH `/recurring/:id`

Update a recurring transaction template. All fields are optional.

**Request Body:**
```json
{
  "amount": 1600,
  "isActive": false,
  "endDate": "2025-12-31T00:00:00.000Z"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `categoryId` | `string` | UUID of a category |
| `amount` | `number` | Must be positive |
| `description` | `string` | 1–255 characters |
| `type` | `string` | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `interval` | `string` | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `dayOfMonth` | `number \| null` | Integer 1–31 |
| `dayOfWeek` | `number \| null` | Integer 0–6 |
| `startDate` | `string` | ISO 8601 datetime |
| `endDate` | `string \| null` | ISO 8601 datetime or `null` |
| `isActive` | `boolean` | `true` = active, `false` = paused |

**Response (200):**
```json
{
  "success": true,
  "data": { "...updated recurring transaction..." },
  "message": "Recurring transaction updated"
}
```

---

### DELETE `/recurring/:id`

Delete a recurring transaction template.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Recurring transaction deleted"
}
```

---

## Cron Jobs (`/api/v1/cron`)

### POST `/cron/recurring`

Process all due recurring transactions. Authenticated via `X-Cron-Secret` header (not JWT).

**Request Headers:**
```
X-Cron-Secret: <CRON_SECRET value from environment>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "processed": 5
  },
  "message": "Recurring transactions processed"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data.processed` | `number` | Count of recurring transactions that were executed |

> This endpoint is designed to be called by Vercel's cron scheduler (configured in `backend/vercel.json` for daily midnight execution). Each matching recurring template creates a new transaction and advances its `nextDate`.

**Errors:**

| Status | Error Code | When |
|--------|------------|------|
| 401 | `AUTHENTICATION_ERROR` | Missing or incorrect `X-Cron-Secret` header |
| 503 | `CRON_NOT_CONFIGURED` | `CRON_SECRET` environment variable not set on server |

---

## Health Check (`/api/v1/health`)

### GET `/health`

Verify the API is running. No authentication required.

**Response (200):**
```json
{
  "success": true,
  "message": "Coin Toss API is running",
  "timestamp": "2025-06-20T12:00:00.000Z"
}
```

---

## Authentication Flow Diagram

```
Client                                      Server
  │                                           │
  │── POST /auth/login ─────────────────────►  │
  │   { email, password, rememberMe }         │
  │                                           │
  │◄── 200 ───────────────────────────────── │
  │   { accessToken, refreshToken, user }     │
  │   Set-Cookie: refreshToken (httpOnly)     │
  │                                           │
  │── GET /transactions ───────────────────►  │
  │   Authorization: Bearer <accessToken>     │
  │                                           │
  │◄── 200 { success, data, meta } ──────────│
  │                                           │
  │   ... (accessToken valid for 15 min) ...  │
  │                                           │
  │── GET /budgets ────────────────────────►  │
  │   Authorization: Bearer <expired token>   │
  │                                           │
  │◄── 401 { success: false } ───────────────│
  │                                           │
  │── POST /auth/refresh ───────────────────► │
  │   (refreshToken sent via cookie)          │
  │                                           │
  │◄── 200 ────────────────────────────────── │
  │   { accessToken, refreshToken }           │
  │   Set-Cookie: refreshToken (httpOnly)     │
  │                                           │
  │── GET /budgets ────────────────────────►  │
  │   Authorization: Bearer <new accessToken> │
  │                                           │
  │◄── 200 { success, data, meta } ──────────│
  │                                           │
  │── POST /auth/logout ───────────────────►  │
  │   (refreshToken sent via cookie)          │
  │                                           │
  │◄── 200 { success: true, data: null } ─────│
  │   Clear-Cookie: refreshToken              │
```

**Token details:**
- Access tokens expire after 15 minutes
- Refresh tokens expire after 1 day (or 30 days if `rememberMe: true`)
- Refresh tokens are stored as httpOnly cookies and rotated on each refresh (old token is revoked)
- All refresh tokens are revoked on password change/reset and account deletion
- The `tokenVersion` field in the database is checked on every authenticated request, enabling global session invalidation

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total endpoints | **38** |
| Public (no auth) | **7** |
| JWT-authenticated | **30** |
| Cron-secret authenticated | **1** |
| Rate-limited (auth endpoints) | **6** |
| Zod-validated endpoints | **23** |
| Cached endpoints (Cache-Control) | **6** |
| Paginated endpoints | **4** (transactions, budgets, goals, notifications) |

### Endpoint Inventory by Domain

| Domain | Endpoints | Methods |
|--------|-----------|---------|
| Auth | 11 | POST ×6, GET ×1, PATCH ×3, DELETE ×1 |
| Transactions | 7 | GET ×3, POST ×2, PUT ×1, DELETE ×1 |
| Categories | 5 | GET ×2, POST ×1, PUT ×1, DELETE ×1 |
| Budgets | 5 | GET ×2, POST ×1, PUT ×1, DELETE ×1 |
| Goals | 6 | GET ×2, POST ×2, PUT ×1, DELETE ×1 |
| Notifications | 4 | GET ×1, PATCH ×2, DELETE ×1 |
| Analytics | 6 | GET ×6 |
| Uploads | 2 | POST ×2 |
| Recurring | 5 | GET ×2, POST ×1, PATCH ×1, DELETE ×1 |
| Cron | 1 | POST ×1 |
| Health | 1 | GET ×1 |