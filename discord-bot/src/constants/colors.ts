// ============================================================================
// Embed colors — hex values used in Discord embed side-bars.
// ============================================================================

export const EmbedColor = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  ERROR: 0xed4245,
  INFO: 0x5865f2,
  MONSTER: 0x9b59b6,
  TRAINER: 0x3498db,
  TOWN: 0xe67e22,
  MARKET: 0xf39c12,
  ADVENTURE: 0x2ecc71,
  BATTLE: 0xe74c3c,
  ENCOUNTER: 0xf1c40f,
} as const;

export type EmbedColorValue = (typeof EmbedColor)[keyof typeof EmbedColor];

// Faction colors for embeds (parsed from hex string to number)
export const FactionColor = {
  NYAKUZA: 0x8b4a9c,
  DIGITAL_DAWN: 0x00bfff,
  POKEMON_RANCHERS: 0x228b22,
  KOAS_LABORATORY: 0xff6347,
  PROJECT_OBSIDIAN: 0x2f2f2f,
  SPIRIT_KEEPERS: 0x9370db,
  TRIBES: 0x8b4513,
  TWILIGHT_ORDER: 0x4b0082,
  LEAGUE: 0xffd700,
  RANGERS: 0x006400,
  TAMERS: 0xff8c00,
} as const;
