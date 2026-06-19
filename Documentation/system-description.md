# A. System Description

## Project Name

**Coin Toss — Finance and Budgeting Manager**

## What the Project Does

Coin Toss is a full-stack personal finance web application that enables users to track income, expenses, and transfers; set and monitor budgets; create savings goals with contribution tracking; analyze financial trends through charts and KPIs; and receive in-app notifications. It supports multi-currency display (USD, EUR, GBP, JPY, CNY, INR, ILS) with real-time exchange rate conversion, receipt uploads for transactions, and recurring transaction automation.

## Target Audience

**Primary:** Individual adults (18–55) who want a simple, visual tool to manage their personal finances without the complexity of enterprise accounting software. They may be:

- Young professionals starting to budget for the first time
- Freelancers tracking income across multiple sources
- Anyone who wants a clear picture of where their money goes each month

**Secondary:** Small-household financial planners who share a single account to coordinate family budgets and savings goals.

## Need It Addresses

Existing personal finance tools (spreadsheets, bank apps, complex software) fall into three gaps that Coin Toss fills:

| Gap | Coin Toss Solution |
|-----|-------------------|
| Spreadsheets require manual entry and lack visualization | Automatic categorization with interactive charts (bar, area, pie) and a single-dashboard overview |
| Bank apps show only transactions, not budgets or goals | Unified dashboard combining income/expense tracking, budget progress bars, and goal contributions |
| Complex tools (Mint, YNAB) have steep learning curves and data-privacy concerns | Self-hosted/controlled data with Supabase PostgreSQL, JWT authentication, and a minimal onboarding flow |
| No recurring transaction automation | Configurable recurring templates processed daily via Vercel Cron |
| Multi-currency confusion | Real-time exchange-rate conversion from USD base to 7 display currencies |

## Functional Requirements

| # | Requirement | Priority |
|---|-------------|----------|
| FR-1 | User registration and login with JWT (access + refresh tokens) | Must |
| FR-2 | Password reset via email token | Must |
| FR-3 | Account deletion with full data cascade | Must |
| FR-4 | CRUD for transactions (income, expense, transfer) with filters, search, pagination, and bulk delete | Must |
| FR-5 | Receipt upload/delete (JPEG, PNG, WebP, PDF; 5 MB max) via Vercel Blob | Must |
| FR-6 | CRUD for categories with automatic fallback reassignment on delete | Must |
| FR-7 | CRUD for budgets with real-time spending progress (50%, 75%, 90%, 100% alerts) | Must |
| FR-8 | CRUD for savings goals with contribution tracking and progress percentage | Must |
| FR-9 | Analytics dashboard: net worth, monthly trends, category breakdown, cash flow, health score | Must |
| FR-10 | CRUD for recurring transaction templates with daily cron processing | Must |
| FR-11 | In-app notification system (list, mark read, mark all read, delete) | Should |
| FR-12 | Currency conversion (7 currencies) with real-time exchange rates from ECB/Frankfurter API | Should |
| FR-13 | Profile management (name, email, password change) | Must |
| FR-14 | Preferences management (currency, locale) | Must |
| FR-15 | Dark mode with system preference detection | Should |
| FR-16 | Mobile-responsive layout with bottom nav | Must |
| FR-17 | Financial health score based on savings rate, budget adherence, and expense consistency | Should |

## Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| NFR-1 | Page load time under 2 seconds on 4G | 95th percentile |
| NFR-2 | API response time under 500ms for all endpoints | 95th percentile |
| NFR-3 | Zero exposure of secrets in client-side code or git history | Absolute |
| NFR-4 | Rate limiting on all auth endpoints (100 req/15min general, 5 req/15min auth) | Enforced |
| NFR-5 | XSS, CSRF, SQL injection, and SSRF protection | Enforced |
| NFR-6 | WCAG 2.1 AA accessibility for all interactive elements | Target |
| NFR-7 | Serverless deployment on Vercel with <10s cold start | Target |
| NFR-8 | 99.5% monthly uptime via Vercel + Supabase SLA | Target |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, Recharts, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM, JWT (access + refresh) |
| Database | Supabase PostgreSQL (PgBouncer pooler on :6543, direct on :5432) |
| Storage | Vercel Blob (receipt uploads) |
| Cache | Upstash Redis (rate limiting) |
| Infra | Vercel (serverless), Vercel Cron (daily recurring processing) |

## Design Language

- **Primary color:** `#704c35` (warm brown)
- **Component library:** shadcn/ui (Radix UI primitives + TailwindCSS)
- **Chart library:** Recharts (area, bar, pie)
- **Icon library:** Lucide React
- **Typography:** System font stack via TailwindCSS defaults
- **Dark mode:** Toggle stored in Zustand + persisted to localStorage