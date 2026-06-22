# frontend/src/components/forms/

## Responsibility

Provides modal dialog form components for creating and editing the four core domain entities: budgets, goals, transactions, and goal contributions. Each form wraps a `Dialog` shell and handles user input, client-side validation, API submission via React Query mutations, cache invalidation, and error display. These components are the primary interface for data entry into the finance-manager system.

## Design Patterns

**Controlled Modal Dialog (open/onOpenChange):** Every form receives `open: boolean` and `onOpenChange: (open: boolean) => void` props, making the parent responsible for dialog visibility. This is the standard controlled-component pattern for modals.

**Create/Edit Dual Mode:** Each form accepts an optional entity object prop (`budget?`, `transaction?`, `goal?`). When present, the component operates in edit mode — pre-populating form fields via `useForm.setValue()` inside a `useEffect` and dispatching update mutations. When absent, it operates in create mode with default/empty values and dispatches create mutations.

**Zod-Validated Controlled Form (react-hook-form + zodResolver):** All forms use `useForm` with `zodResolver(schema)` for declarative schema-based validation. Field errors are surfaced via `formState.errors` and rendered as `<p>` elements adjacent to inputs.

**Separated Select State (local useState alongside react-hook-form):** Select dropdowns (category, type, period) are managed via independent `useState` variables rather than `register()`. This is because the `<Select>` component from `@/components/ui/select` uses Radix UI's controlled `value`/`onValueChange` interface, which is incompatible with react-hook-form's `register`. The form submit handler reads these state values directly into the payload.

**Dual Mutation with Query Invalidation:** Each form instantiates two `useMutation` hooks (one create, one update). On success, both invalidate the relevant entity query key (e.g., `['budgets']`) as well as `['dashboard']`, ensuring all dependent views refresh. Error states from both mutations are captured and displayed via conditional rendering in the `DialogFooter`.

**Optimistic Reset on Close/Switch:** A `useEffect` dependent on the entity prop calls `reset()` in create mode or `setValue()` in edit mode. The `receiptFile` and `uploadError` local state in the Transaction form is also reset in this effect.

**Receipt Upload Orchestration (Transaction form only):** `TransactionFormDialog` manages receipt file selection, client-side size validation (5 MB limit), an async upload to `uploadApi.uploadReceipt()`, and in-progress/error UI states. The upload runs *before* the mutation in `onSubmit` and the resulting URL is embedded into the mutation payload.

## Data & Control Flow

1. **Props enter from parent:** `open` (dialog visibility), `onOpenChange` (visibility callback), optional entity object, and reference data (e.g., `categories: Category[]`).
2. **Form initialization:** `useForm` is configured with `zodResolver(schema)` and `defaultValues`. For selects, parallel `useState` variables hold the current value.
3. **Edit mode hydration:** A `useEffect` watches the entity prop — when truthy, it calls `setValue()` for each field and sets the local select states. When falsy/`null`, it calls `reset()` to restore defaults.
4. **User interaction:** The user fills fields and selects options. Client-side validation runs on submit via `handleSubmit(onSubmit)`. Errors appear inline below each field.
5. **Submit handler constructs payload:** The handler reads react-hook-form values and local select states, transforms dates to ISO strings, resolves category names to IDs (Transaction), optionally uploads a receipt file (Transaction), and assembles the final payload object.
6. **Mutation dispatch:** Depending on `isEditing`, either `createMutation.mutate(payload)` or `updateMutation.mutate(payload)` is called.
7. **Success path:** `onSuccess` invalidates React Query caches (`['transactions']`, `['goals']`, `['budgets']`, `['dashboard']`), calls `onOpenChange(false)` to close the dialog, and calls `reset()` to clear the form.
8. **Error path:** Mutation error objects are cast to `AxiosError<{message?: string}>` and displayed as text in the footer. The dialog remains open so the user can retry.

## Integration Points

- **`@/api`** — `budgetApi`, `transactionApi`, `goalApi`, `uploadApi`: All API call functions, consumed directly in mutation `mutationFn` closures.
- **`@/schemas`** — `budgetSchema`, `goalSchema`, `transactionSchema` and their associated TypeScript types (`BudgetForm`, `GoalForm`, `TransactionForm`): Zod schemas passed to `zodResolver` and used as `useForm` generic parameters.
- **`@/types`** — `Category`, `CreateGoalDTO`, `PaginationMeta`: Domain types passed as props or used in payload construction.
- **`@/components/ui/`** — `Button`, `Input`, `Label`, `Dialog` (and sub-components), `Select` (and sub-components): All presentational primitives that compose the form UI.
- **React Query Client** — `useQueryClient()`: Central cache manager used for invalidation on mutation success.
- **Consumers (parent pages):** Components like `BudgetListPage`, `GoalListPage`, `TransactionListPage` render these dialogs, passing `open`, `onOpenChange`, reference data, and optionally the entity to edit. The dialogs are rendered conditionally based on page-level state.
