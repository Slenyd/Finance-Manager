# Repository Atlas: Coin Toss (finance-manager)

## Project Responsibility
A production-ready full-stack personal finance and budgeting manager. Users track income/expenses, set budgets, create savings goals, view analytics, manage recurring transactions, and upload receipts. Deployed on Vercel with Supabase PostgreSQL.

## System Entry Points
- `package.json` — Monorepo root with concurrent dev/build/test scripts
- `backend/package.json` — Express API server (port 5000)
- `frontend/package.json` — React Vite SPA (port 5173)
- `docker-compose.yml` — Docker orchestration (Postgres 16 + backend + frontend)
- `backend/src/server.ts` — Backend bootstrap (HTTP server)
- `backend/src/app.ts` — Express app configuration (middleware, routes)
- `frontend/src/main.tsx` — Frontend React mount point
- `backend/prisma/schema.prisma` — Database schema (8 models)

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Recharts, Zustand, TanStack Query, React Router, react-hook-form + Zod, Axios, Lucide icons
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT (access + refresh), bcryptjs, Zod, Helmet, express-rate-limit, Winston, Nodemailer, node-cron, Multer, Vercel Blob
- **Database:** PostgreSQL (Supabase in prod, Docker in local)
- **Hosting:** Vercel (frontend + backend as separate projects)
- **Rate Limiting:** Upstash Redis (prod) / in-memory (dev)
- **Storage:** Vercel Blob (receipt uploads)

## Architecture Overview
```
finance-manager/
├── backend/           # Express + Prisma REST API
│   ├── prisma/        # Schema, migrations, seed
│   └── src/
│       ├── config/    # Singleton PrismaClient, frozen config, env validation
│       ├── controllers/  # 10 controller classes (asyncHandler + ApiResponse)
│       ├── services/    # 10 service classes (business logic, Transaction Script)
│       ├── routes/      # 10 route modules (Router pattern)
│       ├── middlewares/ # auth, rateLimit, validate, errorHandler, logging
│       ├── validators/  # 8 Zod schema modules
│       ├── utils/       # Error hierarchy, async HOF, Winston, Nodemailer
│       ├── interfaces/  # DTOs, API envelope, auth types
│       ├── jobs/        # Cron scheduler (recurring transactions)
│       └── tests/       # 7 test suites (Jest + Supertest)
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── api/       # 11 API service modules (Axios gateway + interceptors)
│       ├── components/  # forms (4), layouts (2), ui (14)
│       ├── hooks/     # 5 custom hooks (auth, categories, exchange, debounce, formatters)
│       ├── pages/     # 12 page components
│       ├── store/     # Zustand stores (auth, theme)
│       ├── routes/    # React Router v6 tree (lazy-loaded)
│       ├── schemas/   # Zod form validation schemas
│       ├── lib/       # crypto obfuscation, Tailwind utils
│       └── types/     # Entity interfaces, DTOs, API envelope
├── docker/            # Dockerfiles (backend + frontend)
└── Documentation/     # AGENTS.md, project docs
```

## Directory Map (Aggregated)

### Backend
| Directory | Responsibility Summary | Detailed Map |
|-----------|------------------------|--------------|
| `backend/prisma/` | Prisma schema (8 models, enum-driven domains, cascading referential integrity, Decimal monetary fields), upsert seeding | [View Map](backend/prisma/codemap.md) |
| `backend/src/config/` | Singleton PrismaClient, frozen config object, requireEnv factory, shutdown hooks | [View Map](backend/src/config/codemap.md) |
| `backend/src/controllers/` | 10 controller classes using asyncHandler wrapper, ApiResponse envelope, singleton service injection, Cache-Control headers | [View Map](backend/src/controllers/codemap.md) |
| `backend/src/services/` | 10 service classes (Service Layer + Transaction Script), 11 named patterns: Token Rotation/Reuse Detection, Strategy (recurring), Saga (category delete), Batch Processing | [View Map](backend/src/services/codemap.md) |
| `backend/src/routes/` | 10 Router modules with middleware chains (auth, validate, rateLimit) | [View Map](backend/src/routes/codemap.md) |
| `backend/src/middlewares/` | JWT authenticate, dual Redis/memory rate limit store, Zod parse-transform, instanceof error dispatch, global error boundary | [View Map](backend/src/middlewares/codemap.md) |
| `backend/src/validators/` | 8 Zod schema-per-resource modules, passwordSchema composition, cross-field refine | [View Map](backend/src/validators/codemap.md) |
| `backend/src/utils/` | Error hierarchy, async HOF, Winston singleton logger, Nodemailer fail-soft mailer | [View Map](backend/src/utils/codemap.md) |
| `backend/src/interfaces/` | DTOs, ApiResponse envelope, auth handshake types, controller type aliases | [View Map](backend/src/interfaces/codemap.md) |
| `backend/src/jobs/` | Cron scheduler with fire-and-forget error isolation (recurring transaction processing) | [View Map](backend/src/jobs/codemap.md) |

### Frontend
| Directory | Responsibility Summary | Detailed Map |
|-----------|------------------------|--------------|
| `frontend/src/api/` | API Gateway pattern, 11 service objects, Axios interceptors with queue-based token refresh, barrel re-export, standalone exchangeRates client | [View Map](frontend/src/api/codemap.md) |
| `frontend/src/components/forms/` | 4 form dialog components: Controlled Modal, Create/Edit Dual Mode, Zod-validated react-hook-form, Dual Mutation with Query Invalidation, Receipt Upload Orchestration | [View Map](frontend/src/components/forms/codemap.md) |
| `frontend/src/components/layouts/` | AppLayout (Outlet Shell, responsive nav) + AuthLayout (authentication guard with dual effect + render) | [View Map](frontend/src/components/layouts/codemap.md) |
| `frontend/src/components/ui/` | 14 Radix UI headless primitives: Compound Component (Card/Dialog/Table/Select), CVA variant styling, forwardRef + displayName, animation components | [View Map](frontend/src/components/ui/codemap.md) |
| `frontend/src/hooks/` | 5 custom hooks: Mutation Wrapper, Query Wrapper, Composite Hook, Parameterized Generic Utility Hook | [View Map](frontend/src/hooks/codemap.md) |
| `frontend/src/pages/` | 12 page components with 14 design patterns: data fetching, chart rendering, auth flows, form orchestration | [View Map](frontend/src/pages/codemap.md) |
| `frontend/src/store/` | Zustand auth store (memory-only tokens, obfuscated persistence) + theme store (persist middleware, dark class) | [View Map](frontend/src/store/codemap.md) |
| `frontend/src/routes/` | React Router v6 tree with lazy-loaded routes, AuthLayout/AppLayout nesting, index redirect, catch-all | [View Map](frontend/src/routes/codemap.md) |
| `frontend/src/schemas/` | Zod validation schemas for 6 forms, cross-field refinements, inferred TypeScript types, password policy | [View Map](frontend/src/schemas/codemap.md) |
| `frontend/src/lib/` | crypto.ts (obfuscation pipeline) + utils.ts (Tailwind class merging with clsx + twMerge) | [View Map](frontend/src/lib/codemap.md) |
| `frontend/src/types/` | Entity interfaces, analytics DTOs, ApiResponse envelope, pagination meta, Omit-based CRUD DTOs | [View Map](frontend/src/types/codemap.md) |

## Key Architectural Decisions
- **Auth:** JWT access (15m, in-memory) + refresh (1d/30d, httpOnly cookie). `tokenVersion` invalidation on logout/password change. Refresh token family-based theft detection.
- **Money:** All amounts stored in USD. Client-side currency conversion via frankfurter.app (cached 1h with fallback).
- **Rate Limiting:** Auth endpoints 10 req/15min, general 1000 req/15min. Upstash Redis in prod, in-memory in dev.
- **Form dialogs** lazy-loaded with `React.lazy()` to reduce initial bundle.
- **Category deletion** reassigns transactions/budgets to "Uncategorized" atomically inside a DB transaction (Saga pattern).
- **RecurringTransaction** CRUD is backend-only (no frontend UI yet).
- **Cron:** Vercel Cron runs daily at midnight to process recurring transactions.

## Data Flow Summary
1. **Request** → Express middleware chain (CORS, Helmet, compression, cookie-parser, logging, rateLimit) → Router → validate(Zod) → authenticate(JWT) → Controller
2. **Controller** → asyncHandler wrapper → Service class (business logic) → Prisma ORM → PostgreSQL
3. **Response** → ApiResponse envelope `{ success, data, message? }` → JSON
4. **Frontend** → Axios interceptor (attach Bearer token, queue refresh on 401) → API service module → TanStack Query (cache + invalidation) → Page component → UI