# Data Dictionary

This document describes every field in every database table.

---

## User (`users` table)

The user account. Owns all the user's financial data.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID for this user |
| `name` | Text | Yes | — | Display name shown in the UI |
| `email` | Text | Yes | — | Login email. Must be unique. |
| `password_hash` | Text | Yes | — | Bcrypt hash of the password (cost factor 12). Never stored in plain text. |
| `role` | Enum | Yes | `USER` | Either `USER` or `ADMIN` |
| `is_verified` | Boolean | Yes | `false` | Whether the email has been verified |
| `is_locked` | Boolean | Yes | `false` | Whether the account is locked from too many failed logins |
| `failed_login_attempts` | Integer | Yes | `0` | How many consecutive failed logins. Resets to 0 on successful login. |
| `lock_until` | Timestamp | No | null | When the lock expires (15 minutes after the 5th failed attempt) |
| `reset_token` | Text | No | null | SHA-256 hash of the password reset token |
| `reset_token_expires` | Timestamp | No | null | When the reset token expires (1 hour after creation) |
| `currency` | Text | Yes | `"USD"` | Preferred display currency (USD, EUR, GBP, JPY, CNY, INR, ILS) |
| `locale` | Text | Yes | `"en-US"` | Locale for number and date formatting (e.g., `de-DE` for German) |
| `token_version` | Integer | Yes | `0` | Incremented to invalidate all existing tokens (on logout, password change, etc.) |
| `created_at` | Timestamp | Yes | Current time | When the account was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When the account was last modified |

---

## Transaction (`transactions` table)

A single financial record. Could be income, an expense, or a transfer.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this transaction. Deleted when the user is deleted. |
| `category_id` | UUID | No | null | Category for this transaction. Set to null if the category is deleted. |
| `amount` | Decimal(12,2) | Yes | — | Amount in USD. Always positive. |
| `description` | Text | Yes | — | What the transaction was for (max 255 characters) |
| `type` | Enum | Yes | — | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `date` | Timestamp | Yes | — | When the transaction happened |
| `payment_method` | Text | No | null | How it was paid (Cash, Credit Card, etc.) (max 50 chars) |
| `notes` | Text | No | null | Extra notes (max 1000 chars) |
| `receipt_url` | Text | No | null | Vercel Blob URL for the receipt file |
| `is_recurring` | Boolean | Yes | `false` | Whether this was auto-created by a recurring template |
| `tags` | Text array | Yes | `[]` | User-defined tags for filtering (max 10 tags, each max 30 chars) |
| `created_at` | Timestamp | Yes | Current time | When this record was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When this record was last modified |

**Indexes:** `[user_id, date]`, `[user_id, type]`, `[user_id, category_id]`, `[user_id, date, type]`

---

## Category (`categories` table)

Groups transactions and budgets by type. Users create their own; default ones are provided on signup.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | No | null | Who owns this category. `null` means it's a system default. |
| `name` | Text | Yes | — | Display name (max 50 chars) |
| `icon` | Text | Yes | `"circle"` | Lucide icon name (e.g., `utensils`, `home`, `car`) |
| `color` | Text | Yes | `"#6366f1"` | Hex color code for display |
| `type` | Enum | Yes | — | `INCOME` or `EXPENSE` |
| `created_at` | Timestamp | Yes | Current time | When this category was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When this category was last modified |

**Unique constraint:** Only one category per user can have the same name and type. This prevents having two "Food" expense categories.

**Rules:**
- Default categories (`user_id = null`) cannot be edited or deleted by users (returns 403 error)
- When a user's category is deleted, their transactions/budgets using it get reassigned to an "Uncategorized" fallback category of the same type

---

## Budget (`budgets` table)

A spending limit for a category over a time period.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this budget |
| `category_id` | UUID | Yes | — | Which category this budget applies to. Cannot be deleted while budgets reference it. |
| `limit` | Decimal(12,2) | Yes | — | Maximum spending amount in USD |
| `period` | Enum | Yes | — | `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `start_date` | Timestamp | Yes | Current time | When the budget period starts |
| `end_date` | Timestamp | Yes | End of current month | When the budget period ends |
| `created_at` | Timestamp | Yes | Current time | When this budget was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When this budget was last modified |

**Unique constraint:** Only one budget per user per category per period. This prevents having two monthly food budgets.

**Computed values (not stored, calculated when reading):**
- `spent` = Total of all EXPENSE transactions in this category within the date range
- `percentage` = `(spent / limit) * 100`

---

## SavingsGoal (`savings_goals` table)

A financial target the user is saving toward.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this goal |
| `name` | Text | Yes | — | Goal name (e.g., "Vacation Fund") |
| `target_amount` | Decimal(12,2) | Yes | — | How much the user wants to save (in USD) |
| `current_amount` | Decimal(12,2) | Yes | `0` | How much they've saved so far (in USD). Updated atomically on contribution. |
| `deadline` | Timestamp | No | null | Optional date by which the user wants to reach the goal |
| `created_at` | Timestamp | Yes | Current time | When the goal was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When the goal was last modified |

**Computed values (not stored, calculated when reading):**
- `progress` = `(current_amount / target_amount) * 100`

---

## RecurringTransaction (`recurring_transactions` table)

A template for auto-creating transactions on a schedule. Processed daily by the cron job.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this template |
| `category_id` | UUID | Yes | — | Category for generated transactions. Cannot be deleted while templates reference it. |
| `amount` | Decimal(12,2) | Yes | — | Amount for each generated transaction (in USD) |
| `description` | Text | Yes | — | Description for each generated transaction |
| `type` | Enum | Yes | — | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `interval` | Enum | Yes | — | `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY` |
| `day_of_month` | Integer | No | null | Day of month (1–31) for MONTHLY/YEARLY intervals |
| `day_of_week` | Integer | No | null | Day of week (0=Sunday–6=Saturday) for WEEKLY interval |
| `start_date` | Timestamp | Yes | Current time | When to start generating transactions |
| `end_date` | Timestamp | No | null | When to stop. `null` means it runs forever. |
| `next_date` | Timestamp | Yes | — | Next date a transaction should be created |
| `is_active` | Boolean | Yes | `true` | Set to `false` when `next_date` passes `end_date` |
| `created_at` | Timestamp | Yes | Current time | When this template was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When this template was last modified |

**Rules:**
- When `next_date <= now()` and `is_active = true`, the cron job creates a Transaction and advances `next_date`
- If `next_date > end_date`, the template is deactivated
- MONTHLY with `day_of_month`: forces a specific day, clamped to the month's max days (e.g., day 31 in February → February 28)

---

## Notification (`notifications` table)

In-app notification for the user (e.g., budget alerts, goal reached).

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this notification |
| `title` | Text | Yes | — | Short title |
| `message` | Text | Yes | — | Full message body |
| `type` | Enum | Yes | `INFO` | `INFO`, `WARNING`, `ERROR`, or `SUCCESS` |
| `is_read` | Boolean | Yes | `false` | Whether the user has read this notification |
| `created_at` | Timestamp | Yes | Current time | When this notification was created |
| `updated_at` | Timestamp | Yes | Updated automatically | When this notification was last modified |

---

## RefreshToken (`refresh_tokens` table)

JWT refresh token with family-based theft detection.

| Field | Type | Required? | Default | Description |
|-------|------|-----------|---------|-------------|
| `id` | UUID | Yes | Auto-generated | Unique ID |
| `user_id` | UUID | Yes | — | Who owns this token |
| `token` | Text | Yes | — | The refresh token string (must be unique) |
| `family` | Text | Yes | — | Family ID. All tokens from the same login session share a family. |
| `expires_at` | Timestamp | Yes | — | When this token expires |
| `is_revoked` | Boolean | Yes | `false` | Whether this token has been revoked (used or invalidated) |
| `created_at` | Timestamp | Yes | Current time | When this token was created |
| `updated_at` | Timestamp | Yes | Current time | When this token was last modified |

**How refresh tokens work:**
1. On login, a new token family is created
2. When refreshing, the old token is revoked and a new one is created in the same family
3. If a revoked token is reused, all tokens in that family are revoked (this detects token theft)
4. On password change or account deletion, all tokens for the user are revoked