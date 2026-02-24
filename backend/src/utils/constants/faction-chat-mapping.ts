import { FactionName, type FactionNameValue } from './factions';

// ============================================================
// Faction Chat Alias Mapping
// Edit this map to add/remove aliases or sub-faction mappings
// ============================================================
export const FACTION_CHAT_ALIASES: Record<string, FactionNameValue> = {
  // Canonical names
  'nyakuza': FactionName.NYAKUZA,
  'cat pirates': FactionName.NYAKUZA,
  'digital dawn': FactionName.DIGITAL_DAWN,
  'pokemon ranchers': FactionName.POKEMON_RANCHERS,
  'ranchers': FactionName.POKEMON_RANCHERS,
  "koa's laboratory": FactionName.KOAS_LABORATORY,
  "professor koa's lab": FactionName.KOAS_LABORATORY,
  "koa's lab": FactionName.KOAS_LABORATORY,
  'project obsidian': FactionName.PROJECT_OBSIDIAN,
  'spirit keepers': FactionName.SPIRIT_KEEPERS,
  'the spirit keepers': FactionName.SPIRIT_KEEPERS,
  'tribes': FactionName.TRIBES,
  'the tribes': FactionName.TRIBES,
  'twilight order': FactionName.TWILIGHT_ORDER,
  'the twilight order': FactionName.TWILIGHT_ORDER,
  'league': FactionName.LEAGUE,
  'the league': FactionName.LEAGUE,
  'rangers': FactionName.RANGERS,
  'the rangers': FactionName.RANGERS,
  'tamers': FactionName.TAMERS,
  'the tamers': FactionName.TAMERS,

  // Sub-factions → Tribes
  'the old ones': FactionName.TRIBES,
  'old ones': FactionName.TRIBES,
  'the featherless ones': FactionName.TRIBES,
  'featherless ones': FactionName.TRIBES,
  'the wyvern people': FactionName.TRIBES,
  'wyvern people': FactionName.TRIBES,
};

export function normalizeFactionForChat(raw: string | null): FactionNameValue | null {
  if (!raw) { return null; }
  return FACTION_CHAT_ALIASES[raw.trim().toLowerCase()] ?? null;
}
