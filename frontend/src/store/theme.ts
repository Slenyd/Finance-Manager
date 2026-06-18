import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((state) => {
          const newDark = !state.isDark;
          applyDarkClass(newDark);
          return { isDark: newDark };
        }),
      setDark: (dark) => {
        applyDarkClass(dark);
        set({ isDark: dark });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) applyDarkClass(state.isDark);
      },
    },
  ),
);
