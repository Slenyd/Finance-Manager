# backend/src/

## Responsibility
Application source code for the Express API server. Organized into 10 subdirectories by architectural layer and domain.

## Design
- **config/**: Singleton PrismaClient, frozen config object, requireEnv env validation, graceful shutdown hooks
- **controllers/**: 10 controller classes, asyncHandler HOF, ApiResponse envelope, singleton service injection
- **services/**: 10 service classes, Transaction Script pattern, 11 named patterns (Token Rotation, Strategy, Saga, Batch)
- **routes/**: 10 Router modules with middleware chains (auth, validate, rateLimit)
- **middlewares/**: JWT authenticate, dual Redis/memory rate limit store, Zod parse-transform, global error boundary
- **validators/**: 8 Zod schema-per-resource modules, passwordSchema composition, cross-field refine
- **utils/**: Error hierarchy, async HOF, Winston singleton, Nodemailer fail-soft, helpers
- **interfaces/**: DTOs, ApiResponse envelope, auth handshake types, controller type aliases
- **jobs/**: Cron scheduler with fire-and-forget error isolation
- **tests/**: 7 integration test suites (Jest + Supertest)

## Flow
Entry: `server.ts` → `app.ts` (middleware stack + route mounting) → routes → controllers → services → Prisma

## Integration
- `app.ts` mounts all 10 route modules under `/api/v1/*`
- Services import PrismaClient from `config/database.ts`
- Validators consumed by `middlewares/validate.ts`
- Error handler is the terminal middleware in the stack