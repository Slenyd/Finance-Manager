# backend/src/config

## Responsibility
Centralized application configuration and database client initialization. This module loads environment variables, validates required secrets, exposes a frozen configuration object consumed by all other modules, and bootstraps the Prisma ORM client with connection pooling and lifecycle management.

## Design Patterns
- **Singleton (via module cache):** The `PrismaClient` instance is stored on `globalThis` to prevent multiple connections during hot-reload in development. Only one instance exists per process.
- **Configuration Object (frozen literal):** `config` is exported as a `const`-asserted object that acts as an immutable configuration registry. Every consumer reads from this single source of truth.
- **Factory / Helper:** `requireEnv()` is a small factory that reads `process.env` with optional fallback, throwing a descriptive error when a mandatory variable is missing.
- **Lifecycle Hook (Shutdown):** Graceful `SIGTERM`/`SIGINT` handlers disconnect Prisma and exit cleanly, following the container/process-manager contract.

## Data & Control Flow
1. **Startup:** `index.ts` imports `dotenv` and calls `dotenv.config()` — this loads `.env` into `process.env` as a side effect before any other module reads config values.
2. **Configuration resolution:** The `config` object is built by reading validated env vars. `requireEnv()` throws immediately if `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, or `DATABASE_URL` (fallback) are undefined, failing fast during import.
3. **Prisma initialization:** `database.ts` reads the resolved `POSTGRES_PRISMA_URL || DATABASE_URL` from `process.env`, constructs a `PrismaClient` with a specific datasource URL and dev-aware log levels (`[warn, error]` vs `[error]`), then caches it on `globalForPrisma.prisma` in non-production (excluding Vercel).
4. **Shutdown:** `SIGTERM`/`SIGINT` triggers `prisma.$disconnect()` followed by `process.exit(0)`. This sequence runs only outside Vercel's serverless environment.

## Integration Points
- **Direct consumer:** Every service, resolver, or middleware imports `config` for env-aware behavior (port, JWT secrets, CORS origins, rate-limit settings, SMTP credentials, client URL).
- **Prisma dependency:** `@prisma/client` — the ORM layer. The exported `prisma` singleton is imported by all repository/DAO modules for database access.
- **dotenv:** Loads `.env` file contents into `process.env` (side-effect on import).
- **Environment contracts:** Reads `NODE_ENV`, `PORT`, `POSTGRES_PRISMA_URL`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `COOKIE_SECRET`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`, `SMTP_*`, `CLIENT_URL`, `CRON_SECRET`.
- **Vercel guard:** Detects `VERCEL` env var to skip global caching and shutdown hooks (serverless compatibility).
