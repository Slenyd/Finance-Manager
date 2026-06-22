# `frontend/src/types/`

## Responsibility
Defines all shared TypeScript type definitions for the Finance Manager frontend. This module is the single source of truth for entity shapes, API response envelopes, pagination metadata, analytics DTOs, and CRUD operation payloads. Every other module that references domain objects imports from here, ensuring consistent type contracts between the API layer, store, hooks, and UI components.

## Design Patterns
- **Interface-based Entity Definitions**: Core domain entities (`User`, `Transaction`, `Category`, `Budget`, `SavingsGoal`, `Notification`, `RecurringTransaction`) are modeled as TypeScript `interface` with required and optional (`?`) fields. Each interface mirrors the server-side entity shape, including timestamps (`createdAt`, `updatedAt`) and relational fields (`userId`, `categoryId`, `category: CategorySummary | null`).
- **Nested Summary Interface**: `CategorySummary` provides a lightweight, denormalized shape (`id`, `name`, `icon`, `color`) embedded in `Transaction`, `Budget`, and `RecurringTransaction` to avoid eager joins.
- **DTO Type Aliases with `Omit`/`Partial`**: Create and Update DTOs for each entity are derived from their base interfaces:
  - `Create*DTO = Omit<Entity, 'id' | 'userId' | ...auto-generated fields> & { optional overrides }` — only client-editable fields, with server-generated fields (id, userId, timestamps) excluded.
  - `Update*DTO = Partial<Create*DTO> & { field-level overrides }` — all fields optional for partial updates.
  - This keeps DTO shapes automatically in sync with entity definitions and prevents stale type definitions.
- **Tagged Union for Analytics DTOs**: Separate interfaces for `DashboardData`, `MonthlySpendingData`, `CategoryBreakdownData`, `NetWorthData`, `OverviewData`, `TransactionSummary` — each representing a distinct API response shape for the analytics feature.
- **Generic API Response Envelope**: `ApiResponse<T = unknown>` defines the standard server response wrapper with `success`, `data?`, `message?`, `error?`, `code?`, `errors?` (field-level validation map), and `meta?` (pagination + unread count). `PaginationMeta` provides `page`, `limit`, `total`, `totalPages`.

## Data & Control Flow
1. **Type resolution at compile time**: Types are statically defined and exported. They have no runtime presence (no Zod schemas, no class constructors). They are consumed by:
   - **API client** (`@/api/*`) — generic type parameters on axios/ky calls: `api.get<ApiResponse<DashboardData>>(...)`.
   - **Zustand stores** (`@/store/auth.ts`) — `User` interface used for `user` field type.
   - **Form validation** (`@/schemas/index.ts`) — inferred types like `LoginForm` are separate; entity types are used as comparison/transformation targets.
   - **Components** — prop types, state variables, and event handlers reference these types.
2. **DTO construction flow**:
   - Form component collects user input → casts as `CreateTransactionDTO` → passes to mutation → API client sends to server.
   - Update flows: `UpdateTransactionDTO = Partial<CreateTransactionDTO>` allows partial payloads.
3. **API response deserialization**:
   - Server responds with `ApiResponse<Transaction[]>` → `response.data.data` yields `Transaction[]` after type narrowing → passed to store or component state.

## Integration Points
- **Imports**: None (pure TypeScript, no runtime dependencies)
- **Exports**:
  - Entity interfaces: `User`, `CategorySummary`, `Transaction`, `Category`, `Budget`, `SavingsGoal`, `Notification`, `RecurringTransaction`
  - Analytics DTOs: `DashboardData`, `MonthlySpendingData`, `CategoryBreakdownData`, `NetWorthData`, `OverviewData`, `TransactionSummary`
  - Pagination & response: `PaginationMeta`, `ApiResponse<T>`
  - CRUD DTOs: `CreateTransactionDTO`, `UpdateTransactionDTO`, `CreateCategoryDTO`, `UpdateCategoryDTO`, `CreateBudgetDTO`, `UpdateBudgetDTO`, `CreateGoalDTO`, `UpdateGoalDTO`, `CreateRecurringDTO`, `UpdateRecurringDTO`
- **Consumers**:
  - `@/store/auth.ts` — imports `User`
  - `@/api/*` (presumed) — imports `ApiResponse` and entity types for typed API calls
  - `@/schemas/index.ts` — structurally aligned with DTO types (Zod inferred types are used for form input, while DTO types represent the on-wire shape)
  - `@/hooks/*`, `@/components/*`, `@/pages/*` — import entity and DTO types for type-safe data handling
