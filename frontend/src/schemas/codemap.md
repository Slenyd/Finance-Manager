# `frontend/src/schemas/`

## Responsibility
Defines all client-side form validation schemas using Zod. This module is the single authoritative definition of field shapes, constraints, and error messages for every form in the application. It also exports inferred TypeScript types derived from the schemas, ensuring type safety across the boundary between validated form input and the rest of the codebase.

## Design Patterns
- **Schema Definition with `z.object`**: Each form is described as a Zod object schema with per-field validators (`.string()`, `.number()`, `.email()`, `.min()`, `.regex()`, `.positive()`, `.enum()`, `.optional()`). Error messages are embedded directly in validation chains.
- **Cross-field Refinement**: `registerSchema` and `resetPasswordSchema` use `.refine()` to assert that `password === passwordConfirmation`, with the error path set to `['passwordConfirmation']` for correct field-level display.
- **Type Inference (`z.infer`)**: Each schema exports a corresponding TypeScript type alias (e.g., `LoginForm`, `RegisterForm`, `TransactionForm`), keeping types derived from schemas and eliminating duplication.
- **Version-prefixed Obfuscation in Password Rules**: Password schemas enforce a consistent policy: minimum 8 characters, at least one uppercase letter (`/[A-Z]/`), one lowercase letter (`/[a-z]/`), and one digit (`/[0-9]/`). This policy is defined once and reused across `registerSchema` and `resetPasswordSchema`.

## Data & Control Flow
1. **Schema instantiation**: Schemas are created eagerly at module import time as static `z.object` instances.
2. **Validation flow** (in consuming pages/components):
   - Form data object → call `loginSchema.parse(data)` (throws on failure) or `loginSchema.safeParse(data)` (returns result object) → Zod validates each field against constraints → on success, typed `LoginForm` value is produced; on failure, ZodError with per-field messages is surfaced.
   - Cross-field refinement runs after individual field checks, ensuring password match is validated only after both fields pass their own rules.
3. **Type usage**: Components import types like `LoginForm` for mutation function signatures, state types, and prop interfaces, ensuring form data conforms to schema definitions at compile time.

## Integration Points
- **Imports**: `z` from `zod`
- **Exports**:
  - `loginSchema`, `registerSchema`, `transactionSchema`, `budgetSchema`, `goalSchema`, `resetPasswordSchema`
  - `LoginForm`, `RegisterForm`, `TransactionForm`, `BudgetForm`, `GoalForm`, `ResetPasswordForm`
- **Consumers**:
  - All form pages (`@/pages/login`, `register`, `transactions`, `budgets`, `goals`, `settings`) — use schemas in `react-hook-form`'s `zodResolver` or for manual validation.
  - Components that accept form data as props reference the inferred types for compile-time safety.
  - API mutation hooks may reference form types for their input type parameters.
