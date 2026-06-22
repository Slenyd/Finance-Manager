# backend/

## Responsibility
Express + Prisma REST API server providing JWT-authenticated CRUD endpoints for personal finance management: transactions, budgets, savings goals, categories, analytics, notifications, recurring transactions, and receipt uploads.

## Design
- Layered architecture: Routes → Controllers → Services → Prisma ORM → PostgreSQL
- 10 domain modules with 1:1:1:1 mapping (route:controller:service:validator)
- Singleton PrismaClient, frozen config object, env validation via requireEnv factory
- JWT auth with access + refresh tokens, family-based reuse detection, tokenVersion invalidation
- Dual rate limiting (Redis prod / memory dev), Zod request validation, custom error hierarchy
- Cron scheduler for recurring transaction processing

## Flow
1. HTTP request → middleware chain (CORS, Helmet, compression, cookie-parser, logging, rateLimit)
2. Router → validate(Zod) → authenticate(JWT) → Controller (asyncHandler wrapper)
3. Controller → Service (business logic) → Prisma → PostgreSQL
4. Response → ApiResponse envelope `{ success, data, message? }` → JSON

## Integration
- Exposed on port 5000 (dev) / Vercel serverless (prod)
- Frontend consumes via `/api/v1/*` endpoints
- Prisma connects to PostgreSQL (Supabase pooler port 6543 / direct port 5432)
- Vercel Cron triggers `/api/v1/cron/recurring` daily
- Upstash Redis for rate limiting, Vercel Blob for receipt storage