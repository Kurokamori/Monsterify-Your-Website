import { createContext } from 'react';

export interface Theme {
  id: string;
  label: string;
  description: string;
}

export interface FontOption {
  id: string;
  label: string;
  description: string;
  /** CSS font-family value applied when this font is selected */
  family: string;
  /** true if the font is self-hosted via @font-face (loaded from /fonts/) */
  selfHosted?: boolean;
}

export interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => Promise<void>;
  THEMES: Theme[];
  font: string;
  setFont: (fontId: string) => Promise<void>;
  FONTS: FontOption[];
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

/**
 * Font registry - add new fonts here.
 * For self-hosted fonts, also add @font-face declarations in index.css.
 *   id         - stored in DB / localStorage (used as data-font attribute value)
 *   label      - shown to the user
 *   description
 *   family     - the CSS font-family string
 *   selfHosted - true if loaded from /fonts/ via @font-face
 */
export const FONTS: FontOption[] = [
  { id: 'atkinson', label: 'Atkinson Hyperlegible', description: 'Designed for maximum readability', family: "'Atkinson Hyperlegible', sans-serif", selfHosted: true },
  { id: 'inter', label: 'Inter (Legacy)', description: 'Previous default font', family: "'Inter', Arial, sans-serif" },
  { id: 'system', label: 'System Default', description: 'Uses your device\'s default font', family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: 'georgia', label: 'Georgia', description: 'Classic serif font', family: "Georgia, 'Times New Roman', serif" },
  { id: 'verdana', label: 'Verdana', description: 'Clean and wide sans-serif', family: "Verdana, Geneva, sans-serif" },
  { id: 'open-dyslexic', label: 'Open Dyslexic', description: 'Designed to mitigate common reading errors for dyslexic readers', family: "'Open Dyslexic', sans-serif", selfHosted: true },
];
