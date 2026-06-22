# backend/prisma

## Responsibility
Defines the entire database schema (via Prisma Schema Language) and provides a seed script for bootstrapping development data. This directory is the single source of truth for the PostgreSQL data model, including all tables, enums, relations, indexes, and mapping conventions. It is consumed directly by Prisma Migrate and Prisma Client generation.

## Design Patterns
- **DAO / ORM with Prisma Client**: The `schema.prisma` file is the declarative data-access layer. Prisma generates a type-safe client from it. All application data access flows through the generated `@prisma/client` library, not through raw SQL. The schema uses `@@map()` on every model to map plural snake_case table names (e.g., `savings_goals`, `refresh_tokens`) while keeping Prisma model names in PascalCase.
- **Enum-driven domain types**: Four Prisma enums (`UserRole`, `TransactionType`, `BudgetPeriod`, `RecurringInterval`, `NotificationType`) constrain column values at the database level, preventing invalid states. These enums are re-exported by `@prisma/client` and reused in Zod validators and service logic.
- **Cascading referential integrity**: All child models (`Transaction`, `Category`, `Budget`, `SavingsGoal`, `RecurringTransaction`, `Notification`, `RefreshToken`) use `onDelete: Cascade` on the `User` relation — deleting a user removes all their data. `Budget` and `RecurringTransaction` use `onDelete: Restrict` on `Category` to prevent deletion of a category that is actively referenced by budgets or recurring templates.
- **Composite unique constraints**: `Category` has `@@unique([userId, name, type])` enforcing that a user cannot have two categories with the same name and type. `Budget` uses `@@unique([userId, categoryId, period])` preventing duplicate budget periods per category.
- **Performance indexes**: Every model has at least `@@index([userId])` for user-scoped queries. `Transaction` adds composite indexes on `[userId, date]`, `[userId, type]`, `[userId, categoryId]`, and `[userId, date, type]` to cover the main analytical query patterns. `RefreshToken` indexes `[token]` for fast lookup during token validation. `RecurringTransaction` indexes `[nextDate]` for the scheduler that finds due transactions.
- **Security-first fields**: `User.passwordHash` is stored (not the raw password). `User.tokenVersion`, `failedLoginAttempts`, `isLocked`, and `lockUntil` support brute-force protection and session invalidation. `RefreshToken` implements a **family-based theft detection** scheme: every refresh token belongs to a `family` string; token reuse within a family can signal theft and revoke all tokens in that family.
- **Decimal for monetary values**: All currency amounts (`Transaction.amount`, `Budget.limit`, `SavingsGoal.targetAmount` and `currentAmount`, `RecurringTransaction.amount`) use `Decimal(12, 2)` via `@db.Decimal(12, 2)` to avoid floating-point precision loss.
- **Upsert-based seeding**: The `seed.ts` script uses `prisma.user.upsert(...)` to create two seed users (admin + test) only when they do not already exist, making the script idempotent. Passwords are hashed with `bcryptjs` at cost factor 12.
- **Data source from environment**: `datasource db` reads credentials from `POSTGRES_PRISMA_URL` (connection pooler) and `POSTGRES_URL_NON_POOLING` (direct connection for migrations), keeping secrets out of version control.

## Data & Control Flow
1. **Migration flow**: `npx prisma migrate dev` → Prisma compares `schema.prisma` to the migration history → generates a new SQL migration → applies it to PostgreSQL → updates the generated client.
2. **Client generation flow**: `npx prisma generate` → reads `schema.prisma` → produces `node_modules/.prisma/client/` with TypeScript types for every model, enum, and relation → application imports from `@prisma/client`.
3. **Query flow (read)**: Service calls `prisma.transaction.findMany({ where: { userId, date: { gte } }, include: { category: true }, orderBy: { date: 'desc' }, skip, take })` → Prisma Client translates to parameterized SQL → PostgreSQL returns rows → Prisma Client hydrates into typed JavaScript objects with nested relation data.
4. **Query flow (write)**: Service calls `prisma.transaction.create({ data: {...} })` → Prisma Client generates `INSERT INTO "transactions" (...) VALUES (...)` → returns the created record with defaults (UUID, timestamps).
5. **Seed flow**: `npx prisma db seed` (configured via `"prisma": { "seed": "tsx prisma/seed.ts" }` in `package.json`) → runs `main()` → hashes the password → upserts admin and test user records → logs credentials to stdout.
6. **Referential integrity**: Deleting a `User` cascades to all related tables. Deleting a `Category` that is referenced by `Budget` or `RecurringTransaction` is rejected by `Restrict` — the service must first reassign or delete those dependent rows.

## Integration Points
- **Consumed by**: `@prisma/client` generated package, Prisma Migrate, Prisma Studio, Prisma DB Seed. The entire application backend depends on the generated client for all data access.
- **Called by**: `src/config/database.ts` instantiates `new PrismaClient()` and exports `prisma`. All services (`src/services/*`) import the prisma instance to query the database. The seed script is executed directly via `tsx`.
- **External dependencies**: `postgresql` (database provider), `bcryptjs` (password hashing in seed), `tsx` (TypeScript execution for seed), Prisma CLI (`prisma` dev dependency).
- **Environment variables**: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` (database connection strings), `SEED_PASSWORD` (optional, defaults to `'Password123'`).
- **Synchronized with**: `src/validators/*.ts` (enum string values must match), `src/config/database.ts` (PrismaClient singleton), `package.json` (seed script path, generator config).
