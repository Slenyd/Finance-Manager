# Coin Toss

A full-stack personal finance and budgeting web application built with React, Express, and PostgreSQL. Deployed on Vercel with Supabase.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, TanStack Query, Zustand, TailwindCSS, shadcn/ui, Recharts |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, JWT (access + refresh tokens) |
| **Database** | Supabase PostgreSQL (PgBouncer pooler) |
| **Storage** | Vercel Blob (receipt uploads) |
| **Infra** | Vercel (serverless), Upstash Redis (rate limiting), Vercel Cron |

## Features

- Dashboard with financial health score, income/expense charts, and KPIs
- Transaction management — income, expense, transfer — with receipt uploads
- Budget tracking with progressive alerts at 50%, 75%, 90%, 100%
- Savings goals with progress tracking and contribution history
- Financial analytics — net worth, spending breakdown, monthly trends
- Category management (CRUD, type filtering)
- Notification system
- Recurring transactions processed daily via Vercel Cron
- JWT authentication with refresh-token rotation and role-based access control
- Dark mode with system preference detection
- Mobile-responsive layout
- Lazy-loaded form dialogs, cached formatters, compressed responses

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Supabase account)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your database URL, JWT secrets, and cookie secret.

### 3. Database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Run development servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/*` to the backend on port 5000.

### Docker

```bash
cp .env.docker.example .env.docker   # fill in secrets
docker-compose up --build
```

## Project Structure

```
coin-toss/
├── frontend/                # React + Vite SPA
│   └── src/
│       ├── api/            # Domain API modules (auth, transactions, uploads, …)
│       ├── components/     # UI components, forms, layouts
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Route page components
│       ├── routes/          # React Router config
│       ├── store/           # Zustand stores
│       ├── schemas/         # Zod validation schemas
│       ├── lib/             # Utilities, formatters
│       └── types/           # Shared TypeScript types
├── backend/                 # Express + Prisma API
│   └── src/
│       ├── config/          # Env config, database
│       ├── controllers/     # Route handlers
│       ├── services/        # Business logic
│       ├── middlewares/     # Auth, rate limiting, validation, logging
│       ├── routes/          # Express routers
│       ├── validators/      # Zod request schemas
│       ├── jobs/            # Background cron jobs
│       └── utils/           # Error classes, helpers, logger
├── backend/prisma/          # Schema, migrations, seed
├── docker/                  # Dockerfiles for frontend & backend
└── Documentation/         # System docs, wireframes, ERD, API ref, data dict
```

## API

All endpoints are under `/api/v1`. See [`Documentation/api-reference.md`](Documentation/api-reference.md) for the complete endpoint reference with request/response schemas.

| Domain | Methods | Key Endpoints |
|--------|---------|--------------|
| Auth | POST, GET, PATCH, DELETE | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me`, `/auth/profile`, `/auth/me/password`, `/auth/preferences`, `/auth/account` |
| Transactions | GET, POST, PUT, DELETE | CRUD + `GET /summary`, `POST /bulk-delete` |
| Categories | GET, POST, PUT, DELETE | CRUD with automatic reassignment on delete |
| Budgets | GET, POST, PUT, DELETE | CRUD with real-time spending progress |
| Goals | GET, POST, PUT, DELETE | CRUD + `POST /:id/contribute` |
| Recurring | GET, POST, PATCH, DELETE | CRUD for recurring transaction templates |
| Analytics | GET | `/dashboard`, `/overview`, `/monthly-spending`, `/category-breakdown`, `/cash-flow`, `/net-worth` |
| Notifications | GET, PATCH, DELETE | List, mark read, mark all read, delete |
| Uploads | POST | `POST /receipt`, `POST /receipt/delete` |
| Cron | POST | `POST /recurring` (daily, protected by `CRON_SECRET`) |

## Deployment (Vercel)

The app is deployed as two Vercel projects with git auto-deploy on push to `main`:

```bash
# Frontend — from frontend/ directory
vercel --prod

# Backend — from backend/ directory
vercel --prod --project coin-toss-backend
```

### Required Vercel Environment Variables (backend)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PRISMA_URL` | Supabase pooler connection string (port 6543) |
| `JWT_ACCESS_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `COOKIE_SECRET` | Cookie signing key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage (receipt uploads) |
| `KV_REST_API_URL` | Upstash Redis URL (rate limiting) |
| `KV_REST_API_TOKEN` | Upstash Redis token |
| `CRON_SECRET` | Auth header for cron endpoint |

The frontend proxies `/api/*` to the backend via `vercel.json` rewrites — no CORS needed.

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `user@cointoss.app` | `Password123` |
| Admin | `admin@cointoss.app` | `Password123` |

> These are for local development only. Set `SEED_PASSWORD` or change the seed script in production.

## License

MIT