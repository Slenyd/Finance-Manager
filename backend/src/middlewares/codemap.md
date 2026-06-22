# backend/src/middlewares/

## Responsibility
Provides the cross-cutting middleware layer for the Express HTTP pipeline. Each file implements a single concern — authentication, request validation, rate limiting, request logging, and error handling — that is composed into route definitions. This folder also contains the custom rate-limit store implementation that backs the rate-limiter.

## Design Patterns
- **Middleware Chain / Pipeline Pattern:** Every module exports a function of the signature `(req, res, next) => void` or `(req, res, next) => Promise<void>` that fits into Express's request-response pipeline. Middleware can short-circuit the chain by calling `next(error)` (auth, validate, errorHandler) or by sending a response directly (errorHandler, rateLimiter).
- **Factory / Higher-Order Middleware (validate.ts):** `validate(schema)` is a factory that accepts a `ZodSchema` and returns a closure middleware. Each invocation produces a new middleware instance bound to that specific schema. This avoids repetitive switch/if-else logic inside a single middleware.
- **Strategy Pattern (rateLimitStore.ts):** `UpstashRateLimitStore` implements the `express-rate-limit` store interface (`increment`, `decrement`, `resetKey`) with a two-strategy fallback: primary uses Redis (Upstash) with a Lua scripting atom, secondary falls back to an in-memory `Map` with expiry eviction. This is transparent to the consumer (`rateLimiter.ts`).
- **Error Subtype Discrimination (errorHandler.ts):** Uses `instanceof` checks to discriminate between `SyntaxError`, `ValidationError`, generic `ApiError`, and unhandled errors. Each branch produces a different JSON response shape, with env-aware message exposure in production.
- **Decorator Pattern (logging.ts):** The `requestLogger` middleware attaches a `finish` event listener on the response object to log the request after completion, effectively decorating the request-response lifecycle with observability without modifying controller logic.
- **Global Error Boundary (errorHandler.ts):** Four-argument error-handling middleware that catches all errors propagated via `next(error)`, ensuring a consistent JSON error envelope `{ success, message, code, errors? }`.

## Data & Control Flow
### auth.ts (`authenticate`)
1. Extracts the `Authorization` header and validates the `Bearer` scheme.
2. Verifies the JWT access token using `jwt.verify` with `config.jwt.accessSecret`.
3. Validates `decoded.type === 'access'` and checks `tokenVersion` against the Prisma `User` record to detect invalidated sessions (force-logout).
4. Checks `user.isLocked` to reject disabled accounts.
5. Attaches decoded claims (id, name, email, role, isVerified) to `req.user` (typed as `AuthenticatedRequest`).
6. On any failure, calls `next(new AuthenticationError(...))`, skipping all downstream handlers.

### validate.ts (`validate(schema)`)
1. Receives a pre-compiled `ZodSchema`.
2. Calls `schema.parse({ body, query, params })` on every request.
3. On success, overwrites `req.body`, `req.query`, `req.params` with the parsed (and potentially coerced/transformed) values, then calls `next()`.
4. On `ZodError`, constructs a `ValidationError` with a `Record<string, string[]>` of field-level errors, then calls `next(error)`.

### rateLimiter.ts + rateLimitStore.ts
1. `generalLimiter` and `authLimiter` are pre-configured `express-rate-limit` instances with distinct `windowMs`/`max` values from `config.rateLimit`.
2. Both instances use `UpstashRateLimitStore` as their store backend.
3. On each request, `express-rate-limit` calls `store.increment(key)`:
   - `UpstashRateLimitStore.increment` first attempts Redis via `eval` with a Lua INCR+EXPIRE script.
   - If Redis is unavailable (no env vars or connection error), it falls back to an in-memory `Map<string, { count, expires }>` with lazy eviction.
   - Returns `{ totalHits, resetTime }` to the rate-limiter library.
4. `decrement` and `resetKey` similarly attempt Redis first, then fall back to memory.
5. When the limit is exceeded, `express-rate-limit` sends a JSON response with `RATE_LIMIT_EXCEEDED` or `AUTH_RATE_LIMIT_EXCEEDED` code.

### logging.ts (`requestLogger`)
1. Captures `Date.now()` and `{ method, url }` at request start.
2. Calls `next()` immediately (non-blocking).
3. Listens on `res`'s `finish` event; on completion, logs `{ method, url, statusCode, duration, ip, userAgent }` via the `logger.info` structured logger.
4. Does not mutate `req` or `res`, does not call `next(error)`.

### errorHandler.ts (`errorHandler`)
1. Four-argument Express error handler, called automatically when any middleware/controller calls `next(error)`.
2. Branch 1: `SyntaxError` with `status: 400` → malformed JSON body → responds 400 with `BAD_REQUEST`.
3. Branch 2: `ValidationError` → responds with `err.statusCode`, includes `errors` map.
4. Branch 3: `ApiError` → responds with `err.statusCode`, generic shape.
5. Branch 4 (fallback): logs the full error via `logger.error`, responds 500 with `INTERNAL_ERROR`. In production, the real error message is hidden; in development it is exposed.

## Integration Points
- **Consumers (route layer):** All route files in `../routes/` import `authenticate` from `auth.ts`, `validate` from `validate.ts`, and `authLimiter` from `rateLimiter.ts`. These are composed into route definitions via `router.get('/path', middleware, controller)`.
- **Express app bootstrap:** `errorHandler` is registered as the last middleware in the Express app via `app.use(errorHandler)`. `requestLogger` is registered early in the middleware stack (before routes) via `app.use(requestLogger)`. `generalLimiter` is typically registered at the app level to apply to all routes.
- **External libraries:**
  - `jsonwebtoken` (auth.ts) — JWT verification.
  - `@upstash/redis` (rateLimitStore.ts) — Redis client for distributed rate-limit state.
  - `express-rate-limit` (rateLimiter.ts) — rate-limit middleware library; consumes the custom store.
  - `zod` (validate.ts) — schema definition and parsing.
- **Config:** `auth.ts` reads `config.jwt.accessSecret`; `errorHandler.ts` reads `config.env`; `rateLimiter.ts` reads `config.rateLimit.*` values.
- **Prisma / Database:** `auth.ts` queries the `User` table via `prisma.user.findUnique` to verify `tokenVersion` and `isLocked`.
- **Error utilities:** `AuthenticationError` from `../utils/errors` (auth.ts); `ValidationError`, `ApiError` from `../utils/errors` (errorHandler.ts, validate.ts).
- **Logger:** `logger` from `../utils/logger` used by `logging.ts` (request logging) and `errorHandler.ts` (unhandled error logging).
