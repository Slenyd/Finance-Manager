# Coin Toss — Project Context

## What This Project Is

Coin Toss is a full-stack personal finance web app. Users can track income and expenses, set budgets, create savings goals, view analytics, and manage recurring transactions. It's deployed on Vercel with a Supabase PostgreSQL database.

## Monorepo Structure

```
finance-manager/
├── frontend/          # React + Vite SPA
├── backend/           # Express + Prisma API
├── Documentation/     # This folder
└── docker/            # Dockerfiles
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Zustand, TanStack Query, React Router, Lucide icons
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, bcrypt, Zod, Helmet, express-rate-limit
- **Database:** PostgreSQL (Supabase)
- **Hosting:** Vercel (frontend + backend as separate projects, auto-deploy from main branch)
- **Storage:** Vercel Blob (receipt uploads)
- **Rate limiting:** Upstash Redis (production) / in-memory (dev)
- **Cron:** Vercel Cron (runs daily at midnight to process recurring transactions)

## Key Config

- **Frontend dev port:** 5173
- **Backend dev port:** 5000
- **Frontend proxies** `/api/*` to the backend via `vercel.json` rewrites — no CORS needed in production
- **Backend build script:** `prisma generate && prisma db push --accept-data-loss && npm run build`
- **Database connection:** Uses `POSTGRES_PRISMA_URL` (pooler on port 6543) for runtime, `POSTGRES_URL_NON_POOLING` (direct on port 5432) for schema operations

## Seeded Login Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `user@cointoss.app` | `Password123` |
| Admin | `admin@cointoss.app` | `Password123` |

## Key Decisions

- All money amounts stored in USD. Currency conversion happens client-side at display time using frankfurter.app exchange rates (cached 1 hour with fallback rates)
- `useFormatters` hook provides `formatCurrency`, `formatDate`, and `convertFromBase` to all pages
- Access tokens stored in memory only (Zustand state, not localStorage). Refresh tokens in httpOnly cookies.
- `tokenVersion` on the User model — incremented on logout/password change to invalidate all existing access tokens
- Auth middleware checks `tokenVersion` against the database on every authenticated request
- Refresh tokens use a family system — each login creates a new family. If a revoked token is reused, the entire family is revoked (theft detection)
- Passwords hashed with bcrypt (cost factor 12). Reset tokens hashed with SHA-256.
- Rate limiting: auth endpoints 10 req/15min, general 1000 req/15min. Uses Upstash Redis in production, falls back to in-memory for dev.
- Form dialogs lazy-loaded with `React.lazy()` to reduce initial bundle size
- API modules split by domain (auth, transactions, budgets, etc.) for tree-shaking
- `RecurringTransaction` CRUD is backend-only (no frontend UI yet)
- Budget `update()` doesn't support changing `categoryId` (must delete + recreate)
- Category deletion reassigns transactions/budgets to a fallback "Uncategorized" category inside a database transaction (atomic)

## Required Environment Variables (Backend)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PRISMA_URL` | Database pooler connection (port 6543) |
| `POSTGRES_URL_NON_POOLING` | Direct database connection (port 5432) |
| `JWT_ACCESS_SECRET` | Signs access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (1 or 30 day expiry) |
| `COOKIE_SECRET` | Signs cookies |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage for receipts |
| `KV_REST_API_URL` | Upstash Redis for rate limiting |
| `KV_REST_API_TOKEN` | Upstash Redis token |
| `CRON_SECRET` | Authenticates cron job requests |

## How to Run Locally

```bash
# Install
cd backend && npm install
cd ../frontend && npm install

# Set up env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Database
cd backend
npx prisma db push
npx prisma db seed

# Run both (separate terminals)
cd backend && npm run dev    # port 5000
cd frontend && npm run dev   # port 5173
```

## How to Deploy

```bash
# Frontend
cd frontend && vercel --prod

# Backend
cd backend && vercel --prod --project finance-manager-backend
```

Git auto-deploy is also enabled — pushing to `main` auto-deploys both projects.

## How to Run Tests

```bash
# Backend (66 tests across 7 suites)
cd backend && npm test

# Frontend
cd frontend && npm test

# Type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Linting
cd backend && npm run lint
cd frontend && npm run lint
```