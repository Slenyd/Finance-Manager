import { create } from 'zustand';
import { User } from '@/types';
import { encryptData, decryptData } from '@/lib/crypto';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  setUser: (user: User) => void;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
}

// Fix 6: Only non-sensitive session metadata is persisted to browser storage.
// Access tokens live in memory only (Zustand state, cleared on page reload).
// Refresh tokens are exclusively in the httpOnly cookie set by the server.
const STORAGE_KEY = 'auth-storage';

interface PersistedState {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
}

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

function saveToStorage(state: PersistedState) {
  const storage = getStorage(state.rememberMe);
  storage.setItem(STORAGE_KEY, encryptData(JSON.stringify(state)));
  const other = state.rememberMe ? sessionStorage : localStorage;
  other.removeItem(STORAGE_KEY);
}

function loadFromStorage(): PersistedState {
  const defaults: PersistedState = {
    user: null,
    isAuthenticated: false,
    rememberMe: false,
  };

  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) continue;

      const decrypted = decryptData(raw);
      if (!decrypted) continue;

      const state = JSON.parse(decrypted);
      if (state && typeof state === 'object') {
        return {
          user: state.user || null,
          isAuthenticated: !!state.isAuthenticated,
          rememberMe: !!state.rememberMe,
        };
      }
    } catch {
      continue;
    }
  }

  return defaults;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Tokens are always null on page load — fetched via httpOnly cookie refresh
  ...loadFromStorage(),
  accessToken: null,
  refreshToken: null,

  setUser: (user) => {
    set({ user });
    saveToStorage({ ...get(), user });
  },

  login: (user, accessToken, refreshToken, rememberMe = false) => {
    set({ user, accessToken, refreshToken, isAuthenticated: true, rememberMe });
    saveToStorage({ user, isAuthenticated: true, rememberMe });
  },

  logout: () => {
    clearStorage();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, rememberMe: false });
  },
}));