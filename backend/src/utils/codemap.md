# backend/src/utils

## Responsibility
Provides cross-cutting infrastructure utilities consumed by all other modules in the application. These are stateless, reusable building blocks for error handling, logging, email delivery, async middleware wrapping, pagination, financial health calculation, and category resolution — none of which belong to a single domain.

## Design Patterns
- **Synchronous Error Hierarchy**: `ApiError` (base) → `ValidationError`, `AuthenticationError`, `AuthorizationError`, `BadRequestError`, `NotFoundError`, `ConflictError`. Each subclass sets a fixed `statusCode`, a machine-readable `code`, and `isOperational = true` to distinguish expected failure from programmer bugs. `ValidationError` additionally carries an `errors: Record<string, string[]>` map for field-level messages.
- **Async Middleware Wrapper (HOF)**: `asyncHandler` is a generic higher-order function that accepts `(req, res, next) => Promise<void>` and returns an Express middleware that forwards any rejected promise to `next()`, eliminating try/catch repetition in route handlers.
- **Singleton Logger (Winston)**: A single `winston.createLogger(...)` instance configured at module load. Switches between human-readable (colorized/simple) and structured (JSON with timestamps) formats based on `NODE_ENV`. In non-Vercel environments, adds rotating file transports capped at 5 MB × 5 files for both `error.log` and `combined.log`.
- **Mailer Transporter (Nodemailer)**: A singleton `nodemailer.createTransport(...)` built from `config.smtp.*`. The `sendPasswordResetEmail` function follows a **fail-soft** pattern: if `config.smtp.host` is falsy (dev mode), it logs the reset URL and returns early instead of throwing.
- **Fallback Category Resolution**: `resolveCategoryId` implements a **chain-of-responsibility** → first checks the caller-supplied `fallbackCategoryId`, then queries the user's category by type, then any category, and finally creates a hard-coded 'Miscellaneous' expense category as a last resort.
- **Pure Utility Functions**: `parsePagination` and `calculateFinancialHealth` are stateless, deterministic functions with no side effects and no dependencies beyond their parameters.

## Data & Control Flow
1. **Error flow**: Any service/controller `throw new NotFoundError('Transaction')` → Express error-handling middleware catches it → reads `statusCode` and `message` → returns structured JSON error response.
2. **Async route flow**: `router.get('/...', asyncHandler(myHandler))` → `myHandler` runs and returns a promise → if rejected, `asyncHandler` calls `next(err)` → Express error middleware processes `ApiError`.
3. **Logger flow**: Modules import `logger` and call `logger.info(...)`, `logger.error(...)`, etc. → Winston evaluates transport chain → Console emits immediately; File transports append when not on Vercel.
4. **Mailer flow**: Controller calls `sendPasswordResetEmail(email, resetToken)` → constructs reset URL → checks SMTP config → logs warning and returns if unconfigured → otherwise sends HTML email via transporter → logs success/failure (never throws).
5. **Pagination flow**: Controller calls `parsePagination(req.query)` → raw strings parsed to integers → clamped to valid range `[1..100]` → returns `{ page, limit, skip }` for Prisma `skip`/`take`.
6. **Financial health flow**: Dashboard analytics calls `calculateFinancialHealth({ savingsRate, budgetCompliance, expenseConsistency, hasEmergencySavings, hasSufficientData })` → weighted linear formula → clamped `[0, 100]` → returns `{ score, label }`. Returns `{ score: null, label: 'N/A' }` when insufficient data.
7. **Category resolution flow**: Transaction/budget service calls `resolveCategoryId(userId, type, categoryId?)` → returns the provided `categoryId` if present → otherwise queries Category table by userId+type, then by userId only → creates a default 'Miscellaneous' row if nothing exists.

## Integration Points
- **Consumed by**: All route-handler modules (`src/routes/*`, `src/controllers/*`, `src/services/*`), Express error middleware (`src/middleware/errorHandler.ts`), the mailer config (`src/config/index.ts`).
- **Imports from**: `express` (types only), `@prisma/client` (`TransactionType` enum), `winston`, `nodemailer`, `path`, `../config` (SMTP settings), `../config/database` (Prisma client instance).
- **External dependencies**: `winston` (logging), `nodemailer` (email transport).
- **Environment coupling**: `NODE_ENV` (logger format/level), `VERCEL` (disables file transports), `config.smtp.*` (mailer connectivity).
