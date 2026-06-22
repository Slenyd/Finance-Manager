# frontend/src/pages/

## Responsibility

Serves as the **application's top-level routing targets** — one default-exported React component per file, each representing a full-screen view mapped to a distinct route. These components are the **consumer boundary** between the router and the rest of the UI layer: they orchestrate data fetching, compose layout shells (cards, tables, charts), manage page-level UI state (dialogs, pagination, search), and delegate form/submission logic to lazy-loaded dialog components or mutation hooks. Authentication gate pages (login, register, forgot/reset password) handle credential flows; authenticated pages (dashboard, analytics, budgets, goals, transactions, notifications, settings) render user-specific financial data in read-heavy, paginated, chart-augmented layouts.

## Design Patterns

### 1. Page Component Pattern
Every file exports a single `default` function component named `*Page` (e.g. `AnalyticsPage`, `BudgetsPage`). Pages are self-contained: they own their data-fetching strategy, loading/error/success states, and local UI state. No page-level abstractions like HOCs or render props are used — each page is a standalone orchestration function.

### 2. Route-Guarded Navigation (Auth-aware loading)
- `loading.tsx` acts as a **boot-time entry guard**: it reads `useAuthStore.isAuthenticated` and imperatively navigates to `/login` or `/dashboard` via `useNavigate`, using a `useRef` flag to prevent double-navigation.
- `login.tsx` re-checks `isAuthenticated` in a `useEffect` and redirects if the user is already logged in, using a `useRef` guard to avoid redirect loops.

### 3. Container-Presentational with Memoized Children
Pages act as controllers, passing formatted data and callbacks down to memoized subcomponents:
- `BudgetsPage → BudgetCard` (memoized)
- `GoalsPage → GoalCard` (memoized)
- `TransactionsPage → TransactionRow + TransactionMobileCard` (memoized)
- `NotificationsPage → NotificationItem` (memoized)
- `DashboardPage → RecentTransactionRow` (memoized)

Props include scalar format functions (`formatCurrency`, `formatDate`, `convertFromBase`) and callback lambdas (`onEdit`, `onDelete`, `onContribute`). The `memo()` wrapping prevents re-renders when parent state changes (e.g. pagination) but the item data hasn't changed.

### 4. Lazy-Loaded Form Dialogs
Create/Edit forms are deferred via `React.lazy(() => import(...))` and wrapped in `<Suspense>`:
- `budgets.tsx` → `BudgetFormDialog`
- `goals.tsx` → `GoalFormDialog`, `ContributeFormDialog`
- `transactions.tsx` → `TransactionFormDialog`

This keeps the page bundle lean and defers form code until the user clicks "Add" / "Edit".

### 5. Paginated List Pattern
Pages displaying entity lists (budgets, goals, notifications, transactions) consistently use:
- `useState(page)` + `keepPreviousData` from `@tanstack/react-query` for smooth transitions
- A `PAGE_SIZE` constant at module level
- `Pagination` UI component driven by `meta` from the API response
- `page` in the query key: `['transactions', search, typeFilter, page]`

### 6. CRUD with Optimistic-Retry (Mutation + Invalidation)
All mutation flows follow the same sequence:
1. User action (click delete/edit) opens a confirmation or form dialog
2. On confirm, `useMutation.mutate()` is called
3. `onSuccess` calls `queryClient.invalidateQueries()` with the relevant query key(s)
4. Mutations cascade-invalidate related keys (e.g., deleting a transaction invalidates both `['transactions']` and `['dashboard']`)

### 7. Reusable Data/Formatting Hook Injection
`useFormatters()` (currency, date, locale conversion) and `useCategories()` are consumed directly in page components and threaded into child components as props rather than called inside children, keeping children pure and testable.

### 8. Error + Loading State Trifecta
Every data-driven page renders three mutually exclusive states:
- **Loading**: Skeleton placeholders (`<Skeleton className="animate-pulse-soft">`) in a grid matching the final layout
- **Error**: A centered card with "Failed to load..." message and a "Try Again" button that calls `refetch()`
- **Success**: The full content wrapped in `<PageTransition>`

### 9. Client-Side Search + Filter (Transactions)
`transactions.tsx` implements a **debounced search (300ms)** via `useDebouncedValue()`, paired with a `typeFilter` (INCOME/EXPENSE/TRANSFER). Both are stored in URL-independent local state and appended to the API query params. Changing either resets `page` to 1.

### 10. Responsive Rendering (Transactions)
`transactions.tsx` renders a `<Table>` for `md:` breakpoint and `<TransactionMobileCard>` cards for smaller screens, gated by `hidden md:block` and `md:hidden` CSS utilities.

### 11. Settings Section Composition
`settings.tsx` uses a **card-per-section** layout with staggered animation. Each section (Profile, Password, Appearance, Currency, Session, Danger Zone) is a `<Card>` wrapped in `<StaggerItem>`. Inline dialogs handle mutations. Theme toggling reads/writes `useThemeStore`; profile/preferences changes update `useAuthStore.setUser()`.

### 12. Page-Level Animation Shell
Almost every page wraps its JSX in `<PageTransition>` and uses `<StaggerItem index={n}>` for staggered entry animations on cards/list items, controlled by CSS animation classes (`animate-fade-in`, `animate-fade-in-up`, `animate-slide-up`).

### 13. Aggregate Error & Retry (Analytics)
`analytics.tsx` runs four parallel queries and coalesces their loading/error states into single booleans (`isLoading`, `hasError`). `retryAll()` calls all four `refetch` functions simultaneously.

### 14. Status Finite State Machine (Reset Password)
`reset-password.tsx` uses a 4-state enum (`'idle' | 'loading' | 'done' | 'error'`) to drive UI transitions. The component renders three distinct branches based on: missing token → invalid link page, done → success page, otherwise → the form.

## Data & Control Flow

### Authentication Flow (login.tsx → register.tsx → loading.tsx)

1. **Login**: `LoginPage` → `useForm<LoginForm>` validated against `loginSchema` (zod) → `useLogin().mutate(data)` → `authApi.login()` → on success, `useAuthStore` is populated (inside `useLogin` hook) → `useEffect` detects `isAuthenticated` → `navigate('/dashboard')`.
2. **Register**: `RegisterPage` → same hook/form pattern → `useRegister().mutate(data)` → `authApi.register()` → on success, store updated and user is redirected (inside `useRegister` hook).
3. **Boot Loading**: `LoadingPage` → checks `useAuthStore.isAuthenticated` → if false, `navigate('/login', { replace: true })`; if true, after 800ms `navigate('/dashboard', { replace: true })`.
4. **Logout**: `settings.tsx` → `useLogout().mutate()` → clears auth store → `navigate('/login')`.

### Authenticated Data Pages (Dashboard, Analytics, Budgets, Goals, Transactions, Notifications)

**Fetch sequence** (same pattern across all):
```
Page mounts → useQuery(key, fetcher) → fetching...
  ├─ isLoading → render Skeleton grid
  ├─ isError → render error card + refetch button
  └─ success → render data with charts/lists
```

**Data dependencies**:
| Page | API calls | Query keys | Dependent hooks |
|------|-----------|------------|-----------------|
| Dashboard | `analyticsApi.getDashboard()` | `['dashboard']` | `useFormatters()` |
| Analytics | `analyticsApi.getDashboard()`, `.getMonthlySpending(6)`, `.getCategoryBreakdown()`, `.getCashFlow(12)` | `['dashboard']`, `['monthlySpending']`, `['categoryBreakdown']`, `['cashFlow']` | `useFormatters()` |
| Budgets | `budgetApi.getAll({page, limit})` | `['budgets', page]` | `useCategories()`, `useFormatters()` |
| Goals | `goalApi.getAll({page, limit})` | `['goals', page]` | `useFormatters()` |
| Transactions | `transactionApi.getAll({page, limit, search?, type?})` | `['transactions', search, typeFilter, page]` | `useCategories()`, `useDebouncedValue()`, `useFormatters()` |
| Notifications | `notificationApi.getAll({page, limit})` | `['notifications', page]` | `useFormatters()` |

**Mutation → invalidation flow**:
```
User clicks delete → setDeleteId(id) → confirm dialog
  → deleteMutation.mutate(id)
    → onSuccess: invalidateQueries(['entityKey']) + invalidateQueries(['dashboard'])
```

### Search/Filter Flow (Transactions)
```
searchInput onChange → setSearchInput(value) + setPage(1)
  → useDebouncedValue(value, 300) produces `search`
    → query key ['transactions', search, typeFilter, page] changes
      → react-query refetch with new params
```

### Settings Mutations (settings.tsx)
```
Profile dialog submit → profileMutation.mutate({name, email})
  → authApi.updateProfile()
    → onSuccess: setUser(updatedUser) from useAuthStore

Password dialog submit → passwordMutation.mutate({currentPassword, newPassword, newPasswordConfirmation})
  → authApi.changePassword()
    → onSuccess: clear local password state, close dialog

Currency select onChange → preferencesMutation.mutate({currency, locale})
  → authApi.updatePreferences()
    → onSuccess: setUser(updatedUser)

Delete account → deleteMutation.mutate()
  → authApi.deleteAccount()
    → onSuccess: logout.mutate() + navigate('/login')
```

### Chart Data Flow
```
API response (raw numbers in base currency)
  → convertFromBase() per display value
  → formatCurrency() for string formatting
  → Recharts components (AreaChart, BarChart, PieChart, ResponsiveContainer)
```
All charts use `ResponsiveContainer` with percentage-based dimensions. The `COLORS` constant array provides the palette for pie cells.

### Password Reset Flow
```
/forgot-password → ForgotPasswordPage
  → handleSubmit → authApi.forgotPassword(email)
    → setSent=true → "Check your email" view
      → user clicks email link → /reset-password?token=TOKEN
        → ResetPasswordPage reads token via useSearchParams()
          → if no token → "Invalid link" view
          → if token present → form → authApi.resetPassword(token, password, confirm)
            → success → "Password reset" view → link to /login
```

## Integration Points

| Integration | Direction | Files | Details |
|---|---|---|---|
| **Router** (react-router-dom) | Consumer | All pages | Each page is a `<Route element>` target. `login.tsx`, `loading.tsx`, `settings.tsx`, `register.tsx` use `useNavigate` for imperative redirects. `reset-password.tsx` reads `useSearchParams` for the reset token. `forgot-password.tsx`, `login.tsx`, `register.tsx`, `reset-password.tsx` render `<Link>` components for navigation. |
| **API Services** (`@/api`) | Consumer | All except `loading.tsx` | `analyticsApi`, `budgetApi`, `goalApi`, `notificationApi`, `transactionApi`, `authApi` — injected via `@tanstack/react-query` fetchers and direct mutation calls. |
| **Auth Store** (`@/store/auth`) | Consumer | `login.tsx`, `loading.tsx`, `settings.tsx` | `useAuthStore` read for `isAuthenticated` and `user`; `setUser` called on profile/preferences update success. |
| **Theme Store** (`@/store/theme`) | Consumer | `settings.tsx` | `useThemeStore` for `isDark` state and `toggle()` action. |
| **React Query** (`@tanstack/react-query`) | Consumer | `dashboard.tsx`, `analytics.tsx`, `budgets.tsx`, `goals.tsx`, `transactions.tsx`, `notifications.tsx`, `settings.tsx` | All data fetching and mutation lifecycle. Key patterns: `keepPreviousData`, `queryClient.invalidateQueries()`, parallel queries in analytics. |
| **Custom Hooks** (`@/hooks/*`) | Consumer | Multiple pages | `useFormatters()` (all data pages), `useCategories()` (budgets, transactions), `useDebouncedValue()` (transactions), `useLogin()`/`useRegister()`/`useLogout()` (auth pages). |
| **UI Components** (`@/components/ui/*`) | Consumer | All pages | `Card`, `Button`, `Input`, `Label`, `Skeleton`, `Badge`, `Progress`, `Pagination`, `Dialog*`, `Select*`, `Table*`, `Spinner`, `Spinner`. |
| **Animation Components** (`@/components/ui/page-transition`) | Consumer | `dashboard.tsx`, `analytics.tsx`, `budgets.tsx`, `goals.tsx`, `transactions.tsx`, `notifications.tsx`, `settings.tsx` | `PageTransition` wrapper and `StaggerItem` for staggered card/list entry animations. |
| **Form/Component Dialogs** (lazy-loaded) | Consumer | `budgets.tsx`, `goals.tsx`, `transactions.tsx` | `BudgetFormDialog`, `GoalFormDialog`, `ContributeFormDialog`, `TransactionFormDialog` — imported via `React.lazy()`. |
| **Chart Library** (recharts) | Consumer | `dashboard.tsx`, `analytics.tsx` | `BarChart`, `PieChart`, `AreaChart`, `ResponsiveContainer`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Cell`, `Area`, `Bar`, `Pie`. |
| **Icons** (lucide-react) | Consumer | `budgets.tsx`, `goals.tsx`, `transactions.tsx`, `notifications.tsx`, `settings.tsx` | `Plus`, `Trash2`, `Pencil`, `Search`, `Paperclip`, `Bell`, `CheckCheck`, `Target`, `Calendar`, `PiggyBank`, `User`, `Lock`, `Palette`, `Globe`, `LogOut`, `Moon`, `Sun`. |
| **Zod Schemas** (`@/schemas`) | Consumer | `login.tsx`, `register.tsx`, `reset-password.tsx` | `loginSchema`/`LoginForm`, `registerSchema`/`RegisterForm`, `resetPasswordSchema`/`ResetPasswordForm` — used with `@hookform/resolvers/zod`. |
| **TypeScript Types** (`@/types`) | Consumer | `budgets.tsx`, `dashboard.tsx`, `goals.tsx`, `transactions.tsx`, `notifications.tsx` | `Budget`, `SavingsGoal`, `Transaction`, `Notification`, `PaginationMeta` — used for component prop interfaces and data typing. |
| **CSS Animations** (Tailwind + custom classes) | Consumer | All pages (inline) | `animate-fade-in`, `animate-fade-in-up`, `animate-slide-in`, `animate-scale-in`, `animate-pulse-soft` — applied via `className` for entry/loading animations. |
