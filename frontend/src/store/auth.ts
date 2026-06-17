import { create } from 'zustand';
import { User } from '@/types';
import { encryptData, decryptData, generatePassphrase } from '@/lib/crypto';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
}

const STORAGE_KEY = 'auth-storage';
const PASSPHRASE_KEY = 'auth-passphrase';

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

function clearStorage() {
  for (const key of [STORAGE_KEY, PASSPHRASE_KEY]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

function saveToStorage(state: {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
}) {
  const storage = getStorage(state.rememberMe);
  let passphrase = storage.getItem(PASSPHRASE_KEY);
  if (!passphrase) {
    passphrase = generatePassphrase();
    storage.setItem(PASSPHRASE_KEY, passphrase);
  }
  const serialized = JSON.stringify(state);
  storage.setItem(STORAGE_KEY, JSON.stringify({ c: encryptData(serialized, passphrase) }));
  const other = state.rememberMe ? sessionStorage : localStorage;
  other.removeItem(STORAGE_KEY);
  other.removeItem(PASSPHRASE_KEY);
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

      const parsed = JSON.parse(raw);
      const cipher = parsed.c;
      if (!cipher) continue;

      const passphrase = storage.getItem(PASSPHRASE_KEY);
      if (!passphrase) continue;

      const decrypted = decryptData(cipher, passphrase);
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

  setAccessToken: (token) => {
    set({ accessToken: token, isAuthenticated: true });
    saveToStorage({ ...get(), accessToken: token, isAuthenticated: true });
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
