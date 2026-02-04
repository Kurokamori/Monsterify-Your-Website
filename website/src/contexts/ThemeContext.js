import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

/**
 * Theme registry — add new themes here.
 * Each entry needs:
 *   id    – stored in DB / localStorage (must match data-theme value in themes.css)
 *   label – shown to the user
 *   description – short helper text
 */
export const THEMES = [
  { id: 'dusk', label: 'Dusk (Dark)', description: 'Default dark theme' },
  { id: 'dawn', label: 'Dawn (Light)', description: 'Light theme with warm tones' },
  { id: 'high-contrast', label: 'High Contrast', description: 'Maximum readability' },
];

const DEFAULT_THEME = 'dusk';
const THEME_STORAGE_KEY = 'theme';

/** Apply the data-theme attribute to <html> so every CSS variable updates instantly. */
const applyThemeToDOM = (themeId) => {
  if (themeId === DEFAULT_THEME) {
    // Remove attribute so default :root values apply
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
};

export const ThemeProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // Initialise from localStorage for a flash-free first paint
  const [theme, setThemeState] = useState(() => {
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

  /** Change theme — updates DOM, localStorage, and persists to backend if logged in. */
  const setTheme = useCallback(async (themeId) => {
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

  const value = { theme, setTheme, THEMES };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
