# Database Schema (ERD)

This document shows all the database tables and how they relate to each other.

---

## All Tables at a Glance

```
┌─────────┐     has many     ┌──────────────┐
│  User   │─────────────────>│ Transaction  │
│         │                  └──────────────┘
│         │     has many     ┌──────────────┐
│         │─────────────────>│   Category   │
│         │                  └──────────────┘
│         │     has many     ┌──────────────┐
│         │─────────────────>│   Budget     │
│         │                  └──────────────┘
│         │     has many     ┌──────────────┐
│         │─────────────────>│ SavingsGoal  │
│         │                  └──────────────┘
│         │     has many     ┌────────────────────────┐
│         │─────────────────>│ RecurringTransaction  │
│         │                  └────────────────────────┘
│         │     has many     ┌──────────────┐
│         │─────────────────>│ Notification │
│         │                  └──────────────┘
│         │     has many     ┌──────────────┐
│         │─────────────────>│ RefreshToken │
└─────────┘                  └──────────────┘

┌──────────────┐        groups          ┌──────────────┐
│   Category   │──────────────────────>│ Transaction  │
│              │        limits          │   Budget     │
│              │──────────────────────>│              │
│              │   categorizes          │RecurringTrans│
│              └──────────────────────>└──────────────┘
```

---

## Table Relationships

| From | To | Type | What Happens on Delete | Why |
|------|----|------|------------------------|-----|
| User → Transaction | 1 to many | Delete all user's transactions | When a user is deleted, all their data goes too |
| User → Category | 1 to many | Delete all user's categories | Same as above |
| User → Budget | 1 to many | Delete all user's budgets | Same as above |
| User → SavingsGoal | 1 to many | Delete all user's goals | Same as above |
| User → RecurringTransaction | 1 to many | Delete all user's recurring templates | Same as above |
| User → Notification | 1 to many | Delete all user's notifications | Same as above |
| User → RefreshToken | 1 to many | Delete all user's tokens | Same as above |
| Category → Transaction | 1 to many | Set categoryId to null | Transactions keep their data, just lose the category label |
| Category → Budget | 1 to many | Block the delete | You must reassign budgets first (the app does this automatically) |
| Category → RecurringTransaction | 1 to many | Block the delete | Same as budgets — app reassigns first |

### What does "Cascade" vs "Set Null" vs "Restrict" mean?

- **Cascade** = When the parent is deleted, delete all the children too. If a user is deleted, all their transactions are deleted.
- **Set Null** = When the parent is deleted, set the child's reference to null. Transactions keep all their data but lose the category link.
- **Restrict** = Don't allow the delete if children still reference it. Budgets and recurring transactions must be reassigned first.

---

## Enums (Fixed Value Lists)

| Enum | Values |
|------|--------|
| UserRole | `USER`, `ADMIN` |
| TransactionType | `INCOME`, `EXPENSE`, `TRANSFER` |
| BudgetPeriod | `WEEKLY`, `MONTHLY`, `YEARLY` |
| RecurringInterval | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| NotificationType | `INFO`, `WARNING`, `ERROR`, `SUCCESS` |

---

## Indexes

Indexes make database queries faster. Here's what the app uses:

| Table | Index | Why It's Needed |
|-------|-------|-----------------|
| Transaction | `[userId, date]` | Dashboard loads recent transactions sorted by date |
| Transaction | `[userId, type]` | Filtering by income/expense/transfer |
| Transaction | `[userId, categoryId]` | Category-based queries and budget spending |
| Transaction | `[userId, date, type]` | Monthly spending analytics |
| Category | `[userId]` | Loading a user's categories |
| Category | `[userId, name, type]` (unique) | Prevents duplicate category names per user per type |
| Budget | `[userId]` | Loading a user's budgets |
| Budget | `[categoryId]` | Looking up budgets by category |
| Budget | `[userId, categoryId, period]` (unique) | One budget per category per period per user |
| SavingsGoal | `[userId]` | Loading a user's goals |
| RecurringTransaction | `[userId]` | Loading a user's recurring templates |
| RecurringTransaction | `[nextDate]` | Cron job finds templates that are due |
| Notification | `[userId]` | Loading a user's notifications |
| Notification | `[isRead]` | Counting unread notifications |
| RefreshToken | `[userId]` | Clean up tokens for a user |
| RefreshToken | `[token]` (unique) | Look up a token during refresh |

---

## Important Notes

- **All money amounts are stored in USD** in the database using `Decimal(12, 2)`. Currency conversion happens only when displaying the data to the user.
- **Passwords are never stored in plain text.** They're hashed using bcrypt with a cost factor of 12.
- **Password reset tokens are also hashed** (SHA-256) before being stored in the database.
- **Receipt files** are stored in Vercel Blob (cloud storage), not in the database. Only the URL is saved.
- **Refresh tokens** use a "family" system for theft detection. Each login creates a new family. If a revoked token from a family is reused, all tokens in that family are revoked (this catches someone stealing a refresh token).