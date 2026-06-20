# Coin Toss!

A full-stack personal finance and budgeting web app. Track your income, expenses, budgets, and savings goals in one place. 

## What You Can Do

- **Track transactions** — Add income, expenses, and transfers. Search, filter, sort, and upload receipts.
- **Set budgets** — Create budgets per category with weekly, monthly, or yearly periods. See progress bars with color-coded alerts.
- **Savings goals** — Set targets and track progress. Add contributions over time.
- **View analytics** — See your net worth, monthly trends, category breakdowns, and a financial health score.
- **Recurring transactions** — Set up templates for repeating payments (like rent). A daily cron job creates them automatically.
- **Multi-currency** — View amounts in 7 currencies with real-time exchange rates.
- **Dark mode** — Toggle between light and dark themes.
- **Mobile-friendly** — Bottom navigation bar and card-based layouts on phones.

## Tech Stack

| Layer | What's Used |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Zustand, TanStack Query |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, JWT, bcrypt, Zod |
| **Database** | PostgreSQL (via Supabase) |
| **Storage** | Vercel Blob (receipt uploads) |
| **Hosting** | Vercel (frontend + backend as separate projects) |
| **Other** | Upstash Redis (rate limiting), Vercel Cron (recurring transactions) |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or a Supabase account)

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

Edit `backend/.env` — you need:
- `POSTGRES_PRISMA_URL` — your database connection string
- `JWT_ACCESS_SECRET` — a random string for signing access tokens
- `JWT_REFRESH_SECRET` — a different random string for refresh tokens
- `COOKIE_SECRET` — another random string for cookies

Generate secrets with: `openssl rand -base64 48`

### 3. Set up the database

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 4. Run the development servers

```bash
# Terminal 1 — backend (port 5000)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser. The frontend proxies API calls to the backend automatically.

### Docker (optional)

```bash
cp .env.docker.example .env.docker
docker-compose up --build
```

## Project Structure

```
finance-manager/
├── frontend/
│   └── src/
│       ├── api/           # API call functions (one file per domain)
│       ├── components/     # UI components, forms, layout
│       ├── hooks/          # Custom React hooks (useFormatters, useAuth, etc.)
│       ├── pages/          # One file per page (dashboard, transactions, etc.)
│       ├── routes/         # React Router configuration
│       ├── store/          # Zustand stores (auth, theme)
│       ├── lib/            # Utilities (crypto, formatting)
│       └── types/          # Shared TypeScript types
├── backend/
│   └── src/
│       ├── config/          # Environment config, database setup
│       ├── controllers/     # Route handlers (call services, send responses)
│       ├── services/        # Business logic (the actual work)
│       ├── middlewares/     # Auth, rate limiting, validation, logging
│       ├── routes/          # Express route definitions
│       ├── validators/      # Zod schemas for request validation
│       └── utils/           # Error classes, helpers, logger
├── backend/prisma/          # Database schema and seed script
├── docker/                  # Dockerfiles
└── Documentation/           # See below
```

## Documentation

All documentation lives in the `Documentation/` folder:

| File | What's In It |
|------|-------------|
| [system-description.md](Documentation/overview/system-description.md) | What the app does, who it's for, tech stack |
| [user-flow.md](Documentation/overview/user-flow.md) | How users move through the app (login, navigation, token refresh, cron) |
| [wireframes.md](Documentation/design/wireframes.md) | ASCII drawings of every page + real screenshots |
| [erd.md](Documentation/architecture/erd.md) | Database tables, relationships, and indexes |
| [data-dictionary.md](Documentation/architecture/data-dictionary.md) | Every field in every table explained |
| [api-reference.md](Documentation/api/api-reference.md) | All 38 API endpoints with examples, params, and error cases |
| [AGENTS.md](Documentation/AGENTS.md) | Project context for developers and AI assistants |

## API

All endpoints are under `/api/v1`. See [api-reference.md](Documentation/api/api-reference.md) for full details.

Quick overview:

| Domain | Endpoints |
|--------|----------|
| Auth | Register, login, logout, refresh, forgot/reset password, profile, preferences, delete account |
| Transactions | CRUD + summary + bulk delete |
| Categories | CRUD (default categories provided, custom ones on signup) |
| Budgets | CRUD with spending progress |
| Goals | CRUD + contribute |
| Analytics | Dashboard, overview, monthly spending, category breakdown, cash flow, net worth |
| Notifications | List, mark read, mark all read, delete |
| Uploads | Upload receipt, delete receipt |
| Recurring | CRUD for recurring transaction templates |
| Cron | Daily processing of due recurring transactions |

## Deployment

The app is deployed as two Vercel projects. Pushing to the `main` branch auto-deploys both.

```bash
# Frontend
cd frontend && vercel --prod

# Backend
cd backend && vercel --prod --project finance-manager-backend
```

### Required Vercel Environment Variables (Backend)

| Variable | What It's For |
|----------|--------------|
| `POSTGRES_PRISMA_URL` | Database connection (pooler, port 6543) |
| `POSTGRES_URL_NON_POOLING` | Database connection (direct, port 5432) |
| `JWT_ACCESS_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `COOKIE_SECRET` | Signs cookies |
| `BLOB_READ_WRITE_TOKEN` | Receipt file storage |
| `KV_REST_API_URL` | Redis for rate limiting |
| `KV_REST_API_TOKEN` | Redis auth token |
| `CRON_SECRET` | Authenticates the daily cron job |

## Testing

```bash
# Backend — 66 tests across 7 suites
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
