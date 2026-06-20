# Data Dictionary

Field-by-field descriptions for all database models.

---

## User (`users`)

Core user account. Owns all financial data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique user identifier |
| `name` | String | NOT NULL | Display name |
| `email` | String | NOT NULL, UNIQUE | Login email address |
| `password_hash` | String | NOT NULL | bcrypt hash (cost factor 12) |
| `role` | Enum | NOT NULL, default `USER` | `USER` or `ADMIN` |
| `is_verified` | Boolean | NOT NULL, default `false` | Whether email has been verified |
| `is_locked` | Boolean | NOT NULL, default `false` | Whether account is locked from failed login attempts |
| `failed_login_attempts` | Integer | NOT NULL, default `0` | Consecutive failed login count (resets on success) |
| `lock_until` | DateTime | Nullable | Timestamp when lock expires (15 min after 5th failure) |
| `reset_token` | String | Nullable | SHA-256 hash of password reset token |
| `reset_token_expires` | DateTime | Nullable | Expiration timestamp for reset token (1 hour) |
| `currency` | String | NOT NULL, default `USD` | Preferred display currency (USD, EUR, GBP, JPY, CNY, INR, ILS) |
| `locale` | String | NOT NULL, default `en-US` | Locale string for date/number formatting |
| `created_at` | DateTime | NOT NULL, default `now()` | Account creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

---

## Transaction (`transactions`)

Single financial record (income, expense, or transfer). All amounts stored in USD.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique transaction identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `category_id` | UUID | FK → `categories.id`, Nullable, ON DELETE SET NULL | Categorization; null if category deleted |
| `amount` | Decimal(12,2) | NOT NULL | Transaction amount in USD |
| `description` | String | NOT NULL, max 255 chars | Human-readable description |
| `type` | Enum | NOT NULL | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `date` | DateTime | NOT NULL | Transaction date (defaults to creation time) |
| `payment_method` | String | Nullable, max 50 chars | How payment was made (Cash, Card, etc.) |
| `notes` | String | Nullable, max 1000 chars | Additional notes |
| `receipt_url` | String | Nullable | Vercel Blob URL for receipt file |
| `is_recurring` | Boolean | NOT NULL, default `false` | Whether auto-generated from a RecurringTransaction |
| `tags` | String[] | Default `[]` | User-defined tags for filtering |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Indexes:** `[user_id, date]`, `[user_id, type]`, `[user_id, category_id]`, `[user_id, date, type]`

---

## Category (`categories`)

Groups transactions and budgets by type. Users create custom categories; system provides defaults on registration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique category identifier |
| `user_id` | UUID | FK → `users.id`, Nullable, ON DELETE CASCADE | Owning user; `null` for system defaults |
| `name` | String | NOT NULL, max 50 chars | Display name |
| `icon` | String | NOT NULL, default `circle` | Lucide icon name |
| `color` | String | NOT NULL, default `#6366f1` | Hex color code |
| `type` | Enum | NOT NULL | `INCOME` or `EXPENSE` |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Unique constraint:** `[user_id, name, type]` — prevents duplicate category names per type per user.

**Business rules:**
- When deleted, transactions and budgets are reassigned to a fallback "Uncategorized" category of the same type (created lazily inside a transaction).
- Default categories (`userId: null`) cannot be modified or deleted by users (returns 403 AuthorizationError).

---

## Budget (`budgets`)

Spending limit per category per period.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique budget identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `category_id` | UUID | FK → `categories.id`, NOT NULL, ON DELETE RESTRICT | Target category |
| `limit` | Decimal(12,2) | NOT NULL | Maximum spending amount in USD |
| `period` | Enum | NOT NULL | `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `start_date` | DateTime | NOT NULL | Period start date |
| `end_date` | DateTime | NOT NULL | Period end date |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Unique constraint:** `[user_id, category_id, period]` — one budget per category per period per user.

**Computed fields** (not stored, calculated on read):
- `spent`: Aggregate of EXPENSE transactions in this category within the date range
- `percentage`: `(spent / limit) * 100`

---

## SavingsGoal (`savings_goals`)

Financial target with progress tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique goal identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `name` | String | NOT NULL | Goal name (e.g., "Vacation Fund") |
| `target_amount` | Decimal(12,2) | NOT NULL | Target amount in USD |
| `current_amount` | Decimal(12,2) | NOT NULL, default `0` | Current savings in USD (atomic increment on contribution) |
| `deadline` | DateTime | Nullable | Optional target completion date |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Computed fields** (not stored, calculated on read):
- `progress`: `(current_amount / target_amount) * 100`

---

## RecurringTransaction (`recurring_transactions`)

Template for auto-generating transactions on a schedule. Processed daily by Vercel Cron.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique template identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `category_id` | UUID | FK → `categories.id`, NOT NULL, ON DELETE RESTRICT | Category for generated transactions |
| `amount` | Decimal(12,2) | NOT NULL | Amount for generated transactions |
| `description` | String | NOT NULL | Description for generated transactions |
| `type` | Enum | NOT NULL | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `interval` | Enum | NOT NULL | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `day_of_month` | Integer | Nullable | Day of month for MONTHLY recurrence (1–31) |
| `day_of_week` | Integer | Nullable | Day of week for WEEKLY recurrence (0=Sun–6=Sat) |
| `start_date` | DateTime | NOT NULL | When to start generating transactions |
| `end_date` | DateTime | Nullable | When to stop; `null` = indefinitely |
| `next_date` | DateTime | NOT NULL | Next date to generate a transaction |
| `is_active` | Boolean | NOT NULL, default `true` | Set to `false` when `next_date` passes `end_date` |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Indexes:** `[user_id]`, `[next_date]`

**Business rules:**
- When `next_date <= now()` and `is_active = true`, the cron job creates a Transaction and advances `next_date`.
- If `next_date > end_date`, the template is deactivated (`is_active = false`).
- MONTHLY with `day_of_month`: forces specific day, clamped to month's max days (e.g., day 31 in Feb → Feb 28).

---

## Notification (`notifications`)

In-app notification for the user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique notification identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `title` | String | NOT NULL | Short title |
| `message` | String | NOT NULL | Full message body |
| `type` | Enum | NOT NULL, default `INFO` | `INFO`, `WARNING`, `ERROR`, or `SUCCESS` |
| `is_read` | Boolean | NOT NULL, default `false` | Whether the user has read this notification |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, `@updatedAt` | Last modification timestamp |

**Indexes:** `[user_id]`, `[is_read]`

---

## RefreshToken (`refresh_tokens`)

JWT refresh token with family-based theft detection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique token identifier |
| `user_id` | UUID | FK → `users.id`, NOT NULL, ON DELETE CASCADE | Owning user |
| `token` | String | NOT NULL, UNIQUE | The refresh token string |
| `family` | String | NOT NULL | Token family identifier for theft detection |
| `expires_at` | DateTime | NOT NULL | Expiration timestamp |
| `is_revoked` | Boolean | NOT NULL, default `false` | Whether this token has been revoked |
| `created_at` | DateTime | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | DateTime | NOT NULL, default `now()`, `@updatedAt` | Last modification timestamp |

**Indexes:** `[user_id]`, `[token]` (unique)

**Business rules:**
- On successful refresh, the old token is revoked and a new token with a new family is issued.
- If a revoked token from a family is reused, all tokens in that family are revoked (theft detection).
- On password change or account deletion, all refresh tokens for the user are revoked.