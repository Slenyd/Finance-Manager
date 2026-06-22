# backend/src/interfaces

## Responsibility
Single source of truth for shared TypeScript type definitions, DTOs, and Express middleware contracts. This module defines the shape of every API request, response, entity subset, and utility type consumed across controllers, services, and middleware. It also exports two small response helpers used by controllers to send standardized JSON envelopes.

## Design Patterns
- **DTO (Data Transfer Object):** Explicit interfaces for create/update payloads (`CreateTransactionData`, `UpdateBudgetData`, `RegisterData`, etc.) decouple HTTP request bodies from internal entity schemas.
- **API Response Envelope (`ApiResponse<T>`):** A generic wrapper enforcing a `{ success, data, error, message, meta }` contract on every server response. The `satisfies` keyword on the helpers ensures compile-time conformance.
- **Type Aliasing / Re-export:** Prisma-generated types (`Transaction`, `Category`, `Budget`, etc.) are re-exported as `type` aliases so consumers can reference them from this barrel without adding Prisma as a direct dependency of every file.
- **Subset / Projection Types:** `SafeUser`, `AuthUser`, and `JwtPayload` are deliberately narrowed projections of the full `User`/`JWT` shape, enforcing the principle of least privilege at the type level.
- **Middleware Type Bridge:** `AuthenticatedRequest` (optional `user`) and `AuthorizedRequest` (required `user`) extend `express.Request`, giving route handlers and guards a typed pipeline.

## Data & Control Flow
- **Request flow:** Incoming HTTP → Express middleware (auth guard) attaches `AuthUser` → controller receives `AuthorizedRequest` (or `AuthenticatedRequest` for optional-auth routes) → typed handler processes the body through a DTO interface.
- **Query parameters:** `PaginationQuery`, `TransactionQuery`, `BudgetQuery`, `GoalQuery`, `NotificationQuery` define the shape of `req.query` for list endpoints. They are parsed and optionally validated by the controller layer before being passed to services.
- **Response flow:** Controllers call `sendResponse(res, status, data, message?)` or `sendDatalessResponse(res, status, message)`, which return a JSON body conforming to `ApiResponse<T>`. The generics ensure `data` matches the route's return type.
- **Auth handshake:** `RegisterData` → service → `AuthResult` (contains `accessToken`, `refreshToken`, and a `SafeUser` projection). `RefreshResult` is used downstream for token refresh endpoints.
- **Analytics aggregation:** `DashboardData`, `MonthlySpendingData`, `CategoryBreakdownData`, `NetWorthData`, and `OverviewData` are the output contracts from the analytics service, consumed by the dashboard controller.

## Integration Points
- **Express (`express`):** Extends `Request`, `Response`, `NextFunction` for typed middleware and controllers.
- **Prisma (`@prisma/client`):** Re-exports entity types (`Transaction`, `Category`, `Budget`, `SavingsGoal`, `Notification`, `RecurringTransaction`, `User`, `RefreshToken`) as pure type aliases.
- **Controllers:** Every controller imports these types as method signatures and return types.
- **Services:** Service methods accept and return these DTOs, keeping the service layer decoupled from HTTP concerns.
- **Middleware:** `AuthenticatedRequest` / `AuthorizedRequest` are used by `auth.middleware.ts` and `authorize.middleware.ts` to attach and assert the `user` property.
- **JWT utility:** `JwtPayload` is consumed by token signing/verification logic to embed and later read claims from access and refresh tokens.
- **API gateway / router:** `ControllerAsyncFn` is the unified handler signature passed to route registrations, allowing the router to type-check both protected and public handlers uniformly.
