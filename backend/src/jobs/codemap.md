# backend/src/jobs

## Responsibility
Background job scheduler for recurring, time-driven tasks. Currently handles automated processing of recurring transactions on a daily cron schedule, with error isolation and logging for each job run.

## Design Patterns
- **Scheduler / Cron (via `node-cron`):** Jobs are registered using POSIX cron expressions. The single job (`0 0 * * *`) fires daily at midnight to process recurring transactions.
- **Fire-and-Forget with Error Isolation:** Each cron callback wraps its body in a `try/catch` to prevent unhandled rejections from crashing the scheduler. Errors are logged but do not propagate.
- **Service Delegation:** The module does not contain domain logic — it instantiates `RecurringService` and calls `processRecurringTransactions()`, keeping the job layer thin and testable.

## Data & Control Flow
1. **Startup:** The application entry point calls `startJobs()` during bootstrap.
2. **Registration:** `cron.schedule(expr, callback)` registers the callback with the `node-cron` runtime. The expression `0 0 * * *` means "run every day at 00:00 UTC".
3. **Execution:** At each trigger, the callback logs `Running recurring transactions job`, then awaits `recurringService.processRecurringTransactions()`. If the service method throws, the error is caught and logged as `Recurring transactions job failed:`.
4. **Completion:** After a successful or failed run, the scheduler waits for the next scheduled tick. A startup log line (`Background jobs started`) confirms the scheduler is active.

## Integration Points
- **Entry point:** `startJobs()` is expected to be called once during application initialization (typically in `src/index.ts` or `src/app.ts`).
- **RecurringService (`../services/recurring.service`):** The domain service that queries for due recurring transactions, creates actual transactions, and updates next-run dates. Instantiated locally as a singleton.
- **Logger (`../utils/logger`):** Used for structured logging of job start, completion, and failures.
- **`node-cron`:** Third-party scheduler library. Relies on the system clock and Node.js event loop for tick accuracy.
- **Future extension point:** Additional cron expressions can be added here (e.g., weekly budget alerts, monthly goal recalculations) by adding more `cron.schedule()` calls inside `startJobs()`.
