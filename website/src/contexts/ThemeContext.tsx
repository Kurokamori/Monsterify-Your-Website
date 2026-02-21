import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';
import { ThemeContext, THEMES, type ThemeContextType } from './themeContextDef';

// Re-export types and constants for consumers
export type { ThemeContextType };
export { THEMES };

const DEFAULT_THEME = 'dusk';
const THEME_STORAGE_KEY = 'theme';

/** Apply the data-theme attribute to <html> so every CSS variable updates instantly. */
const applyThemeToDOM = (themeId: string): void => {
  if (themeId === DEFAULT_THEME) {
    // Remove attribute so default :root values apply
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { currentUser, isAuthenticated } = useAuth();

  // Initialize from localStorage for a flash-free first paint
  const [theme, setThemeState] = useState<string>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored || DEFAULT_THEME;
  });

  // Apply theme to DOM on mount and whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Sync theme from user profile once auth is ready
  useEffect(() => {
    if (isAuthenticated && currentUser?.theme) {
      setThemeState(currentUser.theme);
      localStorage.setItem(THEME_STORAGE_KEY, currentUser.theme);
    }
  }, [isAuthenticated, currentUser?.theme]);

  /** Change theme - updates DOM, localStorage, and persists to backend if logged in. */
  const setTheme = useCallback(async (themeId: string): Promise<void> => {
    // Validate
    if (!THEMES.find(t => t.id === themeId)) return;

    setThemeState(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);

    // Persist to backend if authenticated
    if (isAuthenticated) {
      try {
        await api.put('/auth/theme', { theme: themeId });
      } catch (err) {
        console.error('Failed to save theme preference:', err);
      }
    }
  }, [isAuthenticated]);

  const value: ThemeContextType = { theme, setTheme, THEMES };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Re-export hook for convenience (import from useTheme.ts for better Fast Refresh)
// eslint-disable-next-line react-refresh/only-export-components
export { useTheme } from './useTheme';
