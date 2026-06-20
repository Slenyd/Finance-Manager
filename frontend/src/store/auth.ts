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

const STORAGE_KEY = 'auth-storage';

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

function saveToStorage(state: {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
}) {
  const storage = getStorage(state.rememberMe);
  storage.setItem(STORAGE_KEY, encryptData(JSON.stringify(state)));
  const other = state.rememberMe ? sessionStorage : localStorage;
  other.removeItem(STORAGE_KEY);
}

function loadFromStorage(): {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
} {
  const defaults = {
    user: null,
    accessToken: null,
    refreshToken: null,
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
          accessToken: state.accessToken || null,
          refreshToken: state.refreshToken || null,
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
  ...loadFromStorage(),

  setUser: (user) => {
    set({ user });
    saveToStorage({ ...get(), user });
  },

  login: (user, accessToken, refreshToken, rememberMe = false) => {
    const state = { user, accessToken, refreshToken, isAuthenticated: true, rememberMe };
    set(state);
    saveToStorage(state);
  },

  logout: () => {
    clearStorage();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, rememberMe: false });
  },
}));