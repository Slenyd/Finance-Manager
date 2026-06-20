# System Description

## What Is Coin Toss?

Coin Toss is a personal finance web app. It helps people track their income, expenses, budgets, and savings goals in one place. You can think of it as a simpler alternative to spreadsheets or complex budgeting software.

## Who Is It For?

- People who want a clear picture of where their money goes
- Young professionals starting to budget
- Freelancers tracking income from multiple sources
- Anyone who prefers a simple, visual tool over a complicated app

## What Can Users Do?

| Feature | What It Does |
|---------|-------------|
| Sign up / Log in | Create an account with email and password. Login uses JWT tokens for security. |
| Track transactions | Add income, expenses, and transfers. Search, filter, and sort them. Upload receipt photos. |
| Set budgets | Create budgets for categories (Food, Rent, etc.) with weekly, monthly, or yearly periods. See how much you've spent vs your limit. |
| Savings goals | Set a target amount and track progress. Add contributions over time. |
| View analytics | See your net worth, monthly spending trends, category breakdowns, and a financial health score. |
| Categories | Organize transactions with custom categories (Food, Transport, etc.). Default categories are provided. |
| Notifications | Get alerts when budgets are close to their limit or goals are reached. |
| Recurring transactions | Set up templates for repeating transactions (like monthly rent). A daily cron job creates them automatically. |
| Multi-currency | View amounts in USD, EUR, GBP, JPY, CNY, INR, or ILS. The app fetches real-time exchange rates. |
| Settings | Change your name, email, password, currency, and theme (light/dark mode). Delete your account if needed. |
| Mobile-friendly | Works on phones with a bottom navigation bar and card-based layouts. |

## Tech Stack

The app is split into a **frontend** (what the user sees) and a **backend** (the API server and database).

### Frontend

| Tool | What It Does |
|------|-------------|
| React 18 | UI library for building the page components |
| TypeScript | Adds type safety to JavaScript |
| Vite | Fast development server and build tool |
| Tailwind CSS | Utility-first CSS framework for styling |
| shadcn/ui | Pre-built UI components (buttons, cards, dialogs, etc.) built on Radix UI |
| Recharts | Chart library for bar, area, and pie charts |
| Zustand | Lightweight state management (for auth state and theme) |
| TanStack Query | Data fetching and caching (like a smart way to talk to the API) |
| React Router | Handles page navigation (going from /login to /dashboard, etc.) |
| Lucide React | Icon library |
| Zod | Form validation |

### Backend

| Tool | What It Does |
|------|-------------|
| Node.js + Express | API server framework |
| TypeScript | Type safety on the server too |
| Prisma ORM | Talks to the database (writes SQL queries for you) |
| JWT (jsonwebtoken) | Creates and verifies login tokens |
| Bcrypt | Hashes passwords so they're never stored in plain text |
| Zod | Validates incoming requests (makes sure the data is correct) |
| Helmet | Adds security HTTP headers |
| Express Rate Limit | Limits how many requests someone can make (prevents spam/abuse) |
| Upstash Redis | Used for rate limiting in production |
| Multer | Handles file uploads (receipts) |
| Vercel Blob | Cloud storage for receipt files |
| Winston | Logging |

### Database

| Tool | What It Does |
|------|-------------|
| PostgreSQL (via Supabase) | The main database. Stores users, transactions, budgets, goals, etc. |

### Infrastructure

| Tool | What It Does |
|------|-------------|
| Vercel | Hosts both frontend and backend. Auto-deploys when you push to the main branch on GitHub. |
| Supabase | Provides the PostgreSQL database |
| Upstash Redis | Provides Redis for rate limiting |
| Vercel Cron | Runs a scheduled job every day at midnight to process recurring transactions |

## Design

- **Main color:** `#704c35` (a warm brown)
- **Dark mode:** Users can toggle between light and dark. The choice is saved in localStorage.
- **Charts:** Recharts for bar, area, and pie charts
- **Icons:** Lucide React icons throughout the app
- **Mobile:** Bottom navigation bar with 4 tabs + a "More" sheet for extra pages