# `frontend/src/lib/`

## Responsibility
Provides lightweight, framework-agnostic utility functions used across the application. This directory contains pure helper modules with no React, routing, or UI dependencies — the lowest-level shared library in the frontend. Current modules handle client-side data obfuscation (`crypto.ts`) and Tailwind CSS class merging (`utils.ts`).

## Design Patterns
- **Utility Module Pattern**: Each file exports pure (or nearly pure) functions with no internal state or side effects beyond their declared inputs/outputs.
- **String Transformation Pipeline** (`crypto.ts`):
  - `obfuscate(data)` → base64-encodes via `btoa`, then reverses the string.
  - `deobfuscate(obfuscated)` → reverses the string, then base64-decodes via `atob` with `try/catch` error handling.
  - `encryptData(data)` → prepends `'v2:'` version prefix to obfuscated output.
  - `decryptData(encrypted)` → strips `'v2:'` prefix (returns `null` if prefix missing), then deobfuscates.
  - This is **obfuscation, not encryption** — there is no key material. It provides casual tamper-resistance for browser-stored session metadata.
- **Class Merge Utility** (`utils.ts`):
  - `cn(...inputs)` → composes `clsx` (conditional class resolution) and `tailwind-merge` (intelligent Tailwind class deduplication/conflict resolution). Accepts `ClassValue[]` (strings, objects, arrays) and returns a single merged class string.

## Data & Control Flow
1. **Crypto** (`crypto.ts`):
   - `encryptData(plaintext)` → `btoa(plaintext)` → reverse → prepend `'v2:'` → returns obfuscated string.
   - `decryptData(ciphertext)` → extract substring after `'v2:'` prefix (returns `null` if prefix absent or malformed) → reverse → `atob(...)` → returns plaintext or `null` on decode failure.
   - Called by `@/store/auth.ts` for persisting/loading non-sensitive auth state to/from `localStorage`/`sessionStorage`.

2. **Utils** (`utils.ts`):
   - `cn('px-4', 'py-2', 'bg-red-500', 'bg-blue-500')` → `clsx` resolves conditionals → `twMerge` keeps only the last conflicting Tailwind class (`bg-blue-500`) → returns `'px-4 py-2 bg-blue-500'`.
   - Used throughout `@/components/*` and `@/pages/*` for conditional/styled component className attributes.

## Integration Points
- **Imports**:
  - `clsx` — `ClassValue` type + `clsx` function
  - `tailwind-merge` — `twMerge` function
- **Consumers**:
  - `@/store/auth.ts` — uses `encryptData`/`decryptData` for persisting auth metadata to `localStorage`/`sessionStorage`.
  - All UI components (`@/components/*`, `@/pages/*`) — use `cn` for dynamic className construction.
