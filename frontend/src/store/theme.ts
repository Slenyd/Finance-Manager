import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const newDark = !get().isDark;
        set({ isDark: newDark });
        applyDarkClass(newDark);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ isDark: state.isDark }),
      onRehydrateStorage: () => (state) => {
        applyDarkClass(state?.isDark ?? false);
      },
    },
  ),
);