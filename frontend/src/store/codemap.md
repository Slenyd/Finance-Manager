# `frontend/src/store/`

## Responsibility
Manages global client-side state using Zustand. This directory contains standalone, independently-instantiated Zustand stores that hold cross-component state (authentication session, theme preference). Each store owns its state shape, actions, persistence strategy, and side-effect initialization, providing a centralized state layer that hooks and components can subscribe to with fine-grained selectors.

## Design Patterns
- **Zustand Store with `create`**: Each store is created via `create<StateInterface>()((set, get) => ({...}))`. Selectors are used by consumers (e.g., `useAuthStore((s) => s.user)`) to minimize re-renders.
- **Memory-Only Sensitive State + Obfuscated Persistence** (`auth.ts`):
  - **Access tokens** (`accessToken`, `refreshToken`) live only in memory — initialized as `null` on page load, never persisted to browser storage. The server sets an httpOnly cookie for the refresh token.
  - **Non-sensitive metadata** (`user`, `isAuthenticated`, `rememberMe`) is persisted to `localStorage` or `sessionStorage` (chosen by `rememberMe` flag) using `encryptData`/`decryptData` from `@/lib/crypto` (obfuscation, not true encryption).
  - `loadFromStorage()` iterates both `localStorage` and `sessionStorage` to restore state on reload.
  - `clearStorage()` removes the key from both storage backends unconditionally on logout.
  - The `setUser` action updates only the `user` field and re-persists; `login` sets full session; `logout` wipes all state and storage.
- **Zustand `persist` Middleware** (`theme.ts`):
  - Uses the built-in `persist` middleware with `name: 'theme-storage'` to automatically sync `isDark` to `localStorage`.
  - `onRehydrateStorage` callback applies the `dark` CSS class to `document.documentElement` when the persisted state is restored (critical for preventing flash of wrong theme on load).
  - The `toggle` action flips `isDark`, triggers `applyDarkClass`, and relies on the `persist` middleware to write the new value to storage.

## Data & Control Flow
1. **Auth store initialization** (`auth.ts`):
   - Store is created → `loadFromStorage()` runs → checks `localStorage` then `sessionStorage` for `'auth-storage'` key → decrypts and parses → returns persisted `{ user, isAuthenticated, rememberMe }` → state initialized with those values but `accessToken`/`refreshToken` forced to `null`.
   - On login: `useLogin` mutation calls `store.login(user, accessToken, refreshToken, rememberMe)` → `set()` updates all fields → `saveToStorage()` writes to the appropriate storage backend.
   - On logout: `useLogout` calls `store.logout()` → `clearStorage()` removes from both backends → `set()` resets all fields to defaults.
   - On setUser: partial update, re-persists.

2. **Theme store initialization** (`theme.ts`):
   - Store created with `persist` middleware → on rehydration, `onRehydrateStorage` fires → calls `applyDarkClass(state.isDark)` → toggles `'dark'` class on `<html>`.
   - Toggle: user clicks toggle → `toggle()` action → `set()` flips `isDark` → `applyDarkClass(newDark)` updates DOM immediately → `persist` middleware serializes new state to `localStorage`.

## Integration Points
- **Imports**:
  - `zustand` — `create`
  - `zustand/middleware` — `persist` (theme only)
  - `@/types` — `User` interface
  - `@/lib/crypto` — `encryptData`, `decryptData`
- **Exports**:
  - `useAuthStore` — consumed by `@/hooks/useAuth.ts`, `@/hooks/useFormatters.ts`, auth guards in `@/components/layouts/*`, and any component needing user/session state.
  - `useThemeStore` — consumed by theme toggle components (`@/components/*`), layout components that apply the `dark` class, and any component reading `isDark`.
- **Consumers**:
  - `@/hooks/useAuth.ts` — calls store actions `login`, `logout` in mutation callbacks.
  - `@/hooks/useFormatters.ts` — reads `user` from store via selector for currency/locale.
  - `@/components/layouts/app-layout` (presumed) — reads `isAuthenticated` to guard routes.
  - Theme toggle UI — reads `isDark` and calls `toggle`.
