import { create } from 'zustand';
import { User } from '@/types';
import { obfuscateData, deobfuscateData } from '@/lib/crypto';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  setUser: (user: User) => void;
  login: (user: User, accessToken: string, rememberMe?: boolean) => void;
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
  storage.setItem(STORAGE_KEY, obfuscateData(JSON.stringify(state)));
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

      const decrypted = deobfuscateData(raw);
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

  setUser: (user) => {
    set({ user });
    saveToStorage({ ...get(), user });
  },

  login: (user, accessToken, rememberMe = false) => {
    set({ user, accessToken, isAuthenticated: true, rememberMe });
    saveToStorage({ user, isAuthenticated: true, rememberMe });
  },

  logout: () => {
    clearStorage();
    set({ user: null, accessToken: null, isAuthenticated: false, rememberMe: false });
  },
}));