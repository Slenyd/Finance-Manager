# C. ERD / Database Schema

## Entity-Relationship Diagram

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String passwordHash
        UserRole role
        Boolean isVerified
        Boolean isLocked
        Int failedLoginAttempts
        DateTime lockUntil
        String resetToken
        DateTime resetTokenExpires
        String currency
        String locale
        DateTime createdAt
        DateTime updatedAt
    }

    Transaction {
        String id PK
        String userId FK
        String categoryId FK
        Decimal amount
        String description
        TransactionType type
        DateTime date
        String paymentMethod
        String notes
        String receiptUrl
        Boolean isRecurring
        String[] tags
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String userId FK
        String name
        String icon
        String color
        TransactionType type
        DateTime createdAt
        DateTime updatedAt
    }

    Budget {
        String id PK
        String userId FK
        String categoryId FK
        Decimal limit
        BudgetPeriod period
        DateTime startDate
        DateTime endDate
        DateTime createdAt
        DateTime updatedAt
    }

    SavingsGoal {
        String id PK
        String userId FK
        String name
        Decimal targetAmount
        Decimal currentAmount
        DateTime deadline
        DateTime createdAt
        DateTime updatedAt
    }

    RecurringTransaction {
        String id PK
        String userId FK
        String categoryId FK
        Decimal amount
        String description
        TransactionType type
        RecurringInterval interval
        Int dayOfMonth
        Int dayOfWeek
        DateTime startDate
        DateTime endDate
        DateTime nextDate
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Notification {
        String id PK
        String userId FK
        String title
        String message
        NotificationType type
        Boolean isRead
        DateTime createdAt
        DateTime updatedAt
    }

    RefreshToken {
        String id PK
        String userId FK
        String token UK
        String family
        DateTime expiresAt
        Boolean isRevoked
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--o{ Transaction : "owns"
    User ||--o{ Category : "creates"
    User ||--o{ Budget : "sets"
    User ||--o{ SavingsGoal : "tracks"
    User ||--o{ RecurringTransaction : "schedules"
    User ||--o{ Notification : "receives"
    User ||--o{ RefreshToken : "authenticates"
    Category ||--o{ Transaction : "groups"
    Category ||--o{ Budget : "limits"
    Category ||--o{ RecurringTransaction : "categorizes"
```

## Enums

```mermaid
erDiagram
    UserRole {
        USER ADMIN
    }
    TransactionType {
        INCOME EXPENSE TRANSFER
    }
    BudgetPeriod {
        WEEKLY MONTHLY YEARLY
    }
    RecurringInterval {
        DAILY WEEKLY MONTHLY YEARLY
    }
    NotificationType {
        INFO WARNING ERROR SUCCESS
    }
```

## Relationship Cardinalities

| From | To | Type | On Delete | Notes |
|------|----|------|-----------|-------|
| User | Transaction | 1:N | Cascade | All transactions deleted when user deleted |
| User | Category | 1:N | Cascade | All categories deleted when user deleted |
| User | Budget | 1:N | Cascade | All budgets deleted when user deleted |
| User | SavingsGoal | 1:N | Cascade | All goals deleted when user deleted |
| User | RecurringTransaction | 1:N | Cascade | All recurring templates deleted when user deleted |
| User | Notification | 1:N | Cascade | All notifications deleted when user deleted |
| User | RefreshToken | 1:N | Cascade | All tokens deleted when user deleted |
| Category | Transaction | 1:N | **Set Null** | Transactions keep their data but lose category link |
| Category | Budget | 1:N | **Restrict** | Cannot delete category while budgets reference it (app reassigns first) |
| Category | RecurringTransaction | 1:N | **Restrict** | Cannot delete category while recurring templates reference it |

## Indexes

| Table | Columns | Type | Purpose |
|-------|---------|------|---------|
| Transaction | `[userId, date]` | Composite | Dashboard recent transactions, date-range filters |
| Transaction | `[userId, type]` | Composite | Filter by income/expense/transfer |
| Transaction | `[userId, categoryId]` | Composite | Category-based queries, budget spending |
| Transaction | `[userId, date, type]` | Composite | Monthly spending analytics |
| Category | `[userId]` | Single | User category lookup |
| Category | `[userId, name, type]` | **Unique** | Prevent duplicate category names per type per user |
| Budget | `[userId]` | Single | User budget list |
| Budget | `[categoryId]` | Single | Budget category lookup |
| Budget | `[userId, categoryId, period]` | **Unique** | One budget per category per period per user |
| SavingsGoal | `[userId]` | Single | User goals list |
| RecurringTransaction | `[userId]` | Single | User recurring list |
| RecurringTransaction | `[nextDate]` | Single | Cron job finds due transactions |
| Notification | `[userId]` | Single | User notifications |
| Notification | `[isRead]` | Single | Unread count queries |
| RefreshToken | `[userId]` | Single | Token cleanup |
| RefreshToken | `[token]` | **Unique** | Token lookup for refresh |

## Data Storage Notes

- All monetary amounts stored as `Decimal(12, 2)` in **USD** (base currency)
- Currency conversion happens at display time via `useFormatters` hook using Frankfurter API rates
- Passwords stored as bcrypt hashes (cost factor 12)
- Password reset tokens stored as SHA-256 hashes
- Receipt files stored in Vercel Blob at path `receipts/{userId}/{timestamp}-{sanitizedFilename}`
- Refresh tokens use family-based rotation for theft detection