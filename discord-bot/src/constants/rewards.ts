// ============================================================================
// Reward constants — used by presenters to format reward displays.
// The actual reward calculation lives on the backend.
// ============================================================================

export const DEFAULT_REWARD_RATES = {
  wordsPerLevel: 50,
  wordsPerCoin: 1,
  wordsPerItem: 1000,
  coinsPerLevel: 50,
} as const;

export const POKEBALL_CAPTURE_RATES: Record<string, number> = {
  'Poke Ball': 0.5,
  'Great Ball': 0.65,
  'Ultra Ball': 0.8,
  'Master Ball': 1.0,
  'Premier Ball': 0.5,
  'Luxury Ball': 0.5,
  'Timer Ball': 0.6,
  'Repeat Ball': 0.7,
  'Net Ball': 0.6,
  'Dive Ball': 0.6,
};

export const POKEBALL_TYPES = Object.keys(POKEBALL_CAPTURE_RATES);

export const ART_QUALITY_LEVELS: Record<string, number> = {
  sketch: 2,
  sketchSet: 3,
  lineArt: 4,
  rendered: 5,
  polished: 7,
};

export const BACKGROUND_BONUS: Record<string, number> = {
  none: 0,
  simple: 3,
  complex: 6,
};

export const APPEARANCE_BONUS: Record<string, number> = {
  bust: 1,
  halfBody: 2,
  fullBody: 3,
};
