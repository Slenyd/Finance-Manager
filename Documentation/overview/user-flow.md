# User Flow

This document explains how users move through the app and what happens behind the scenes.

---

## 1. Login and Registration Flow

When someone opens the app, here's what happens:

```
User opens the app
       │
       ▼
Does the user have an access token (login session)?
       │
       ├── No ──> Show /login page
       │                │
       │                ├── User enters email + password ──> Correct? ──> Store tokens ──> Go to /dashboard
       │                │                                     │
       │                │                                     └── Wrong? ──> Show error message
       │                │
       │                ├── "Create account" link ──> /register ──> Fill name + email + password ──> Account created ──> Go to /login
       │                │
       │                └── "Forgot password?" link ──> /forgot-password ──> Enter email ──> Send reset email ──> /reset-password?token=xxx ──> Enter new password ──> Go to /login
       │
       └── Yes ──> Try using the token to fetch data
                    │
                    ├── Token still valid ──> Go to /dashboard
                    │
                    └── Token expired ──> Try refreshing with refresh token
                                         │
                                         ├── Refresh works ──> Go to /dashboard
                                         └── Refresh fails ──> Go to /login
```

### Key details:
- Access tokens expire after 15 minutes
- Refresh tokens last 1 day (or 30 days if "Remember me" was checked)
- After 5 failed logins, the account is locked for 15 minutes
- Password changes revoke all existing sessions (forces re-login everywhere)

---

## 2. Main App Navigation

Once logged in, users can move between these pages:

```
                    ┌─────────────────────────────────────┐
                    │           /dashboard                 │
                    │  (KPIs, charts, recent transactions)│
                    └──────────────┬──────────────────────┘
                                   │
          ┌──────────┬─────────────┼──────────────┬────────────────┐
          │          │             │              │                │
          ▼          ▼             ▼              ▼                ▼
   /transactions  /budgets      /goals       /analytics       /notifications
          │          │             │              │                │
          │          │             │              │                │
   Add/Edit/Delete  Add/Edit      Add/Edit        View charts    Mark read
   Upload receipt   Delete        Delete          (read-only)    Delete
   Bulk delete     View progress  Contribute                     (unread count badge)
   Search/filter
                          │
                          ▼
                       /settings
                   Edit profile
                   Change password
                   Change currency
                   Toggle dark mode
                   Sign out
                   Delete account
```

### Desktop vs Mobile:
- **Desktop:** Left sidebar with all 7 links + user info + dark mode toggle + logout
- **Mobile:** Bottom navigation bar with 4 main tabs (Home, Transactions, Budgets, Goals) + a "More" button that opens a sheet for Analytics, Notifications, Settings, dark mode, and logout

---

## 3. Token Refresh Flow

When the frontend makes an API request and the access token has expired:

```
Frontend sends request with expired access token
       │
       ▼
Backend returns 401 Unauthorized
       │
       ▼
Frontend intercepts the 401 error
       │
       ├── Is another refresh already in progress?
       │    ├── Yes ──> Wait in a queue. When the first refresh finishes, retry with the new token.
       │    └── No  ──> Send POST /auth/refresh (refresh token comes from the httpOnly cookie)
       │                    │
       │                    ├── Success ──> Get new access + refresh tokens ──> Retry original request
       │                    │
       │                    └── Fail ──> Log out the user ──> Redirect to /login
```

This is handled in `frontend/src/api/client.ts`. The refresh token is stored in an httpOnly cookie, so JavaScript can't read it (prevents XSS attacks from stealing it).

---

## 4. Category Deletion Flow

When a user deletes a category, the app needs to handle all the transactions and budgets that were using it:

```
User clicks "Delete" on a category
       │
       ▼
Is it a default (system) category?
       │
       ├── Yes ──> Return 403 Forbidden (can't delete system categories)
       │
       └── No ──> Start a database transaction:
                   1. Find or create an "Uncategorized" fallback category of the same type
                   2. Reassign all transactions from the deleted category to the fallback
                   3. Reassign all budgets from the deleted category to the fallback
                   4. Delete the category
                   5. Commit the transaction (all steps succeed or all fail together)
```

This is handled in `backend/src/services/category.service.ts`. Using a database transaction means if anything fails (like creating the fallback category), nothing changes — no transactions or budgets are left orphaned.

---

## 5. Recurring Transactions (Daily Cron Job)

Every day at midnight, Vercel Cron calls the `POST /api/v1/cron/recurring` endpoint:

```
Cron job fires at midnight
       │
       ▼
Check the X-Cron-Secret header matches the server's CRON_SECRET?
       │
       ├── No ──> Return 401 (reject the request)
       │
       └── Yes ──> Find all active recurring templates where nextDate <= now
                    │
                    ├── None found ──> Return { processed: 0 }
                    │
                    └── Found N templates ──> For each one:
                        1. Create a new Transaction (copy amount, description, type, category)
                        2. Advance nextDate to the next interval (e.g., +1 month for MONTHLY)
                        3. If nextDate > endDate, set isActive = false
                        4. Return { processed: N }
```

This is configured in `backend/vercel.json` with the schedule `"0 0 * * *"` (daily at midnight).

---

## 6. Currency Conversion Flow

The app stores all amounts in USD in the database. When a user selects a different display currency:

```
User changes currency to EUR in Settings
       │
       ▼
Backend saves user.currency = "EUR" in the database
       │
       ▼
Frontend reads user.currency from the auth store
       │
       ▼
useFormatters hook calls useExchangeRates hook
       │
       ▼
useExchangeRates fetches exchange rates from frankfurter.app
       │
       ├── Cache hit (data less than 1 hour old) ──> Use cached rates
       └── Cache miss ──> Fetch from frankfurter.app
            │
            ├── Success ──> Cache for 1 hour
            └── Fail ──> Use hardcoded fallback rates (last-known good rates)
                   │
                   ▼
Every amount shown is multiplied by the exchange rate
(e.g., $3,400 USD shown as €3,127 EUR)

When the user submits a form (like adding a transaction):
The entered amount is divided by the exchange rate before saving
(e.g., €100 entered → $108.70 stored in the database)
```

This is handled in `frontend/src/hooks/useFormatters.ts` and `frontend/src/hooks/useExchangeRates.ts`.

---

## 7. Page Summary

| Page | What the user does | What happens on success | What happens on error |
|------|-------------------|------------------------|----------------------|
| /login | Enters email + password | Redirect to /dashboard | Show "Invalid email or password" |
| /register | Enters name + email + password | Redirect to /login | Show validation errors |
| /forgot-password | Enters email | Show "Check your email" | Always shows success (security) |
| /reset-password | Enters new password | "Password reset" + link to /login | "Invalid or expired link" |
| /dashboard | Views summary | Shows KPIs, charts, recent transactions | Error card with retry button |
| /transactions | Adds, edits, searches, deletes transactions | Shows table with pagination | Error card with retry button |
| /budgets | Adds, edits, deletes budgets | Shows budget cards with progress bars | Error card with retry button |
| /goals | Adds, edits, contributes to, deletes goals | Shows goal cards with progress | Error card with retry button |
| /analytics | Views charts and KPIs | Shows area, pie, and bar charts | Error card with retry button |
| /notifications | Marks read, deletes notifications | Shows notification list with unread count | Error card with retry button |
| /settings | Changes profile, password, currency, theme | Shows confirmation or auto-saves | Shows field-level errors |