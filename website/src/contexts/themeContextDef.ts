import { createContext } from 'react';

export interface Theme {
  id: string;
  label: string;
  description: string;
}

export interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => Promise<void>;
  THEMES: Theme[];
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme registry - add new themes here.
 * Each entry needs:
 *   id    - stored in DB / localStorage (must match data-theme value in themes.css)
 *   label - shown to the user
 *   description - short helper text
 */
export const THEMES: Theme[] = [
  { id: 'dusk', label: 'Dusk (Dark)', description: 'Default dark theme' },
  { id: 'dawn', label: 'Dawn (Light)', description: 'Light theme with warm tones' },
  { id: 'high-contrast', label: 'High Contrast', description: 'Maximum readability' },
];
