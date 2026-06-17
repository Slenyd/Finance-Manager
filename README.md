<<<<<<< HEAD
# Finance-Manager
Final Project for SVCollage: Finance and Budgeting Manager
=======
# Personal Finance Manager

A production-ready Personal Finance Manager and Budgeting Web Application built with React, TypeScript, Express, and PostgreSQL.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, TanStack Query, Zustand, TailwindCSS, Shadcn/UI, Recharts

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication, RBAC

**Deployment:** Docker, Vercel, Netlify, Railway, Render

## Features

- Dashboard with financial health score and charts
- Transaction management (income, expense, transfer)
- Budget tracking with alerts at 50%, 75%, 90%, 100%
- Savings goals with progress tracking
- Financial analytics with charts and KPIs
- Recurring transactions (daily, weekly, monthly, yearly)
- JWT authentication with refresh tokens
- Role-based access control (User/Admin)
- Dark mode support
- Mobile responsive
- CSV import/export
- Receipt upload

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-manager.git
   cd finance-manager
   ```

2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. Start PostgreSQL and create the database:
   ```bash
   createdb finance_manager
   ```

5. Run database migrations and seed:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

6. Start development servers:
   ```bash
   # From root directory
   npm run dev
   ```

### Docker

```bash
docker-compose up --build
```

## Project Structure

```
finance-manager/
├── frontend/          # React + Vite application
│   └── src/
│       ├── api/       # API client and endpoints
│       ├── components/# UI components
│       ├── hooks/     # Custom React hooks
│       ├── pages/     # Page components
│       ├── routes/    # Router configuration
│       ├── store/     # Zustand stores
│       ├── schemas/   # Zod schemas
│       └── types/     # TypeScript types
├── backend/           # Express + Prisma API
│   └── src/
│       ├── config/    # Configuration
│       ├── controllers/ # Route handlers
│       ├── services/  # Business logic
│       ├── middlewares/ # Express middlewares
│       ├── routes/    # API routes
│       ├── validators/# Zod validation schemas
│       ├── jobs/      # Background jobs
│       └── utils/     # Utilities
├── docker/            # Docker configuration
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## API Documentation

### Auth
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user profile

### Transactions
- `GET /api/v1/transactions` - List transactions (with pagination, filtering)
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `DELETE /api/v1/transactions/bulk` - Bulk delete transactions

### Categories, Budgets, Goals, Analytics, Notifications
All follow RESTful conventions under `/api/v1/`.

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
```
Deploy the `dist/` folder.

### Backend (Railway/Render)
```bash
cd backend
npm run build
```
Set environment variables in the dashboard.

### Database (Supabase/Neon)
Use the connection string as `DATABASE_URL` and run:
```bash
npx prisma migrate deploy
```

## Default Users (Seed)

> **Security Note:** These credentials are for local development only. Change them in production by setting `SEED_PASSWORD` env var or updating the seed script.

- **Admin:** admin@financemanager.com / Password123
- **User:** user@financemanager.com / Password123

## License

MIT
>>>>>>> a8ec3af (initial commit)
