import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { ThemeContext, THEMES, FONTS, type ThemeContextType } from './themeContextDef';

// Re-export types and constants for consumers
export type { ThemeContextType };
export { THEMES, FONTS };

const DEFAULT_THEME = 'dusk';
const DEFAULT_FONT = 'atkinson';
const THEME_STORAGE_KEY = 'theme';
const FONT_STORAGE_KEY = 'font';

/** Apply the data-theme attribute to <html> so every CSS variable updates instantly. */
const applyThemeToDOM = (themeId: string): void => {
  if (themeId === DEFAULT_THEME) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
};

/** Apply the chosen font by setting the --font-family CSS variable directly. */
const applyFontToDOM = (fontId: string): void => {
  const fontOption = FONTS.find(f => f.id === fontId);
  if (fontOption) {
    document.documentElement.style.setProperty('--font-family', fontOption.family);
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { currentUser, isAuthenticated, updateTheme, updateFont } = useAuth();

  // Initialize from localStorage for a flash-free first paint
  const [theme, setThemeState] = useState<string>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored || DEFAULT_THEME;
  });

  const [font, setFontState] = useState<string>(() => {
    const stored = localStorage.getItem(FONT_STORAGE_KEY);
    return stored || DEFAULT_FONT;
  });

  // Apply theme to DOM on mount and whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Apply font to DOM on mount and whenever it changes
  useEffect(() => {
    applyFontToDOM(font);
  }, [font]);

  // Sync theme from user profile once auth is ready
  useEffect(() => {
    if (isAuthenticated && currentUser?.theme) {
      setThemeState(currentUser.theme);
      localStorage.setItem(THEME_STORAGE_KEY, currentUser.theme);
    }
  }, [isAuthenticated, currentUser?.theme]);

  // Sync font from user profile once auth is ready
  useEffect(() => {
    if (isAuthenticated && currentUser?.font) {
      setFontState(currentUser.font);
      localStorage.setItem(FONT_STORAGE_KEY, currentUser.font);
    }
  }, [isAuthenticated, currentUser?.font]);

  /** Change theme - updates DOM, localStorage, and persists to backend if logged in. */
  const setTheme = useCallback(async (themeId: string): Promise<void> => {
    if (!THEMES.find(t => t.id === themeId)) return;

    setThemeState(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);

    if (isAuthenticated) {
      try {
        await updateTheme(themeId);
      } catch (err) {
        console.error('Failed to save theme preference:', err);
      }
    }
  }, [isAuthenticated, updateTheme]);

  /** Change font - updates DOM, localStorage, and persists to backend if logged in. */
  const setFont = useCallback(async (fontId: string): Promise<void> => {
    if (!FONTS.find(f => f.id === fontId)) return;

    setFontState(fontId);
    localStorage.setItem(FONT_STORAGE_KEY, fontId);

    if (isAuthenticated) {
      try {
        await updateFont(fontId);
      } catch (err) {
        console.error('Failed to save font preference:', err);
      }
    }
  }, [isAuthenticated, updateFont]);

  const value: ThemeContextType = { theme, setTheme, THEMES, font, setFont, FONTS };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Re-export hook for convenience (import from useTheme.ts for better Fast Refresh)
// eslint-disable-next-line react-refresh/only-export-components
export { useTheme } from './useTheme';
