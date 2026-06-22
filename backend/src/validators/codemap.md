# backend/src/validators

## Responsibility
Defines Zod-based request validation schemas for every API route in the application. Each file exports named schemas that are consumed by a central validation middleware to assert the shape, types, and constraints of `req.body`, `req.query`, and `req.params` before data reaches controller or service logic.

## Design Patterns
- **Schema-per-resource layout**: One file per domain resource (`auth.ts`, `transaction.ts`, `budget.ts`, `category.ts`, `goal.ts`, `recurring.ts`, `analytics.ts`, `notification.ts`). Each file exports one or more `z.ZodObject` schemas targeting specific operations (create, update, query).
- **Nested body/query object convention**: Every exported schema wraps its fields under a `body` or `query` key (e.g., `z.object({ body: z.object({...}) })`). This mirrors the Express request structure and allows a generic validation middleware to use `schema[location].parse(req[location])`.
- **Constraint composition via `passwordSchema`** (`auth.ts`): A reusable `passwordSchema` base definition (min 8 chars, uppercase, lowercase, digit) is composed into `registerSchema`, `resetPasswordSchema`, and `changePasswordSchema` via spread/zod refinement, avoiding duplication.
- **`refine` for cross-field validation** (`auth.ts`): `registerSchema`, `resetPasswordSchema`, and `changePasswordSchema` use `.refine(...)` to assert `password === passwordConfirmation` (or `newPassword === newPasswordConfirmation`), with the error path set to the confirmation field.
- **Default values and coercion through `.default()` and `.transform()`**: Schemas like `createBudgetSchema`, `createTransactionSchema`, and `monthlySpendingSchema` use `.default(() => ...)` to supply dynamic defaults (e.g., today's date, 6-month window). Numeric query params use `.transform()` combined with manual clamping to coerce string inputs into safe integers.
- **Enum whitelisting**: Where Prisma enums exist (`TransactionType`, `BudgetPeriod`, `RecurringInterval`), Zod `.enum([...])` mirrors the exact values (`'INCOME' | 'EXPENSE' | 'TRANSFER'`, etc.), ensuring runtime validation matches the database schema.
- **Pagination schema reuse**: `budgetQuerySchema`, `goalQuerySchema`, and `getNotificationsSchema` share an identical structure (`{ page?: string, limit?: string }`), but are currently duplicated rather than extracted into a shared base.

## Data & Control Flow
1. **Route registration**: A route file (e.g., `routes/transaction.ts`) imports a schema (e.g., `createTransactionSchema`) and passes it to a validation middleware: `router.post('/', validate(createTransactionSchema), controller.create)`.
2. **Validation middleware execution**: The middleware iterates over the keys of the schema (`body`, `query`, `params`), calling `schema[key].parse(req[key])`. If parsing succeeds, the parsed (and potentially transformed/defaulted) data replaces `req[key]`. If it fails, Zod throws a `ZodError`.
3. **Error translation**: The validation middleware catches `ZodError`, flattens it via `zodError.flatten().fieldErrors`, and throws a `ValidationError` (from `utils/errors.ts`) with the field-level error map. This propagates to the Express error handler.
4. **Post-parse data flow**: Controller/service code receives sanitized, typed, defaulted data in `req.body` / `req.query` — strings have been coerced to numbers where transform is defined, defaults injected, and enums validated.
5. **Analytics query flow**: `monthlySpendingSchema` transforms the `months` query param (default `'6'`, clamped `[1, 36]`). `categoryBreakdownSchema` optionally accepts `startDate`/`endDate` as ISO 8601 datetime strings. `cashFlowSchema` mirrors the months transform pattern (default `'12'`).
6. **Transaction query flow**: `transactionQuerySchema` accepts an extensive filter set (`type`, `categoryId`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`, `tags`, `paymentMethod`) plus pagination (`page`, `limit`) and sorting (`sortBy`, `sortOrder`). All remain strings until consumed by the service layer.

## Integration Points
- **Consumed by**: A central validation middleware (`src/middleware/validate.ts`) that iterates schema keys and calls `z.parse()`. Route files import schemas directly to pass them as arguments to `validate()`.
- **Imports from**: `zod` (the Zod library). No internal application modules are imported — validators are pure schema definitions.
- **Consumer modules**: `src/routes/*` (all route files), `src/middleware/validate.ts` (validation runner).
- **Coupled to Prisma enums**: The enum string values hard-coded in Zod `.enum()` calls (`TransactionType`, `BudgetPeriod`, `RecurringInterval`) must stay in sync with `prisma/schema.prisma`. A schema drift here would pass validation but fail at the database layer.
