/**
 * Faction Constants
 * Defines all 11 game factions, their relationships, and standing titles
 */

// Faction name definitions
export const FactionName = {
  NYAKUZA: 'Nyakuza',
  DIGITAL_DAWN: 'Digital Dawn',
  POKEMON_RANCHERS: 'Pokemon Ranchers',
  KOAS_LABORATORY: "Koa's Laboratory",
  PROJECT_OBSIDIAN: 'Project Obsidian',
  SPIRIT_KEEPERS: 'Spirit Keepers',
  TRIBES: 'Tribes',
  TWILIGHT_ORDER: 'Twilight Order',
  LEAGUE: 'League',
  RANGERS: 'Rangers',
  TAMERS: 'Tamers',
} as const;

export type FactionNameKey = keyof typeof FactionName;
export type FactionNameValue = (typeof FactionName)[FactionNameKey];

// Array of all faction names
export const FACTION_NAMES: FactionNameValue[] = Object.values(FactionName);

/**
 * Faction relationship types
 */
export const FactionRelationshipType = {
  ALLIED: 'allied',
  NEUTRAL: 'neutral',
  RIVAL: 'rival',
  ENEMY: 'enemy',
} as const;

export type FactionRelationshipValue =
  (typeof FactionRelationshipType)[keyof typeof FactionRelationshipType];

/**
 * Faction definition with metadata
 */
export interface FactionDefinition {
  name: FactionNameValue;
  description: string;
  color: string;
  bannerImage: string;
  iconImage: string;
}

/**
 * Complete faction definitions with all metadata
 */
export const FACTIONS: Record<FactionNameValue, FactionDefinition> = {
  [FactionName.NYAKUZA]: {
    name: FactionName.NYAKUZA,
    description:
      'Adventurous feline pirates driven by curiosity, thrill, and loyalty. Operating from Pirate\'s Bay, they deal in rare goods and information with charm and unpredictability.',
    color: '#8B4A9C',
    bannerImage: 'nyakuza_banner.png',
    iconImage: 'nyakuza.png',
  },
  [FactionName.DIGITAL_DAWN]: {
    name: FactionName.DIGITAL_DAWN,
    description:
      'Part zealots, part cyber-criminals, Digital Dawn seeks to find or create the Digital World. With unrivaled technological prowess and the ability to harness Digimon, they are a force to be reckoned with.',
    color: '#00BFFF',
    bannerImage: 'digital_dawn_banner.png',
    iconImage: 'digital_dawn.png',
  },
  [FactionName.POKEMON_RANCHERS]: {
    name: FactionName.POKEMON_RANCHERS,
    description:
      'A loose faction of ranchers and caretakers who provide food, goods, and stability for the islands. They share a deep love for monsters and advocate for their humane treatment.',
    color: '#228B22',
    bannerImage: 'pokemon_ranchers_banner.png',
    iconImage: 'pokemon_ranchers.png',
  },
  [FactionName.KOAS_LABORATORY]: {
    name: FactionName.KOAS_LABORATORY,
    description:
      'The heart of education and research on the islands, led by Professor Koa. A region-wide science center dedicated to understanding fusions, type changes, alters, and serving as neutral ground between factions.',
    color: '#FF6347',
    bannerImage: 'koas_laboratory_banner.png',
    iconImage: 'koas_laboratory.png',
  },
  [FactionName.PROJECT_OBSIDIAN]: {
    name: FactionName.PROJECT_OBSIDIAN,
    description:
      'A dark scientific organization obsessed with altering lifeforms. Masquerading as an extension of Koa\'s Lab, they seek to harness complete control over type changes, fusions, and alters for profit and power.',
    color: '#2F2F2F',
    bannerImage: 'project_obsidian_banner.png',
    iconImage: 'project_obsidian.png',
  },
  [FactionName.SPIRIT_KEEPERS]: {
    name: FactionName.SPIRIT_KEEPERS,
    description:
      'Ancient spiritual practitioners who predate the Great Change. They believe the Change was merely a revelation of what always existed, and dedicate themselves to maintaining the balance between the physical and spiritual worlds.',
    color: '#9370DB',
    bannerImage: 'spirit_keepers_banner.png',
    iconImage: 'spirit_keepers.png',
  },
  [FactionName.TRIBES]: {
    name: FactionName.TRIBES,
    description:
      'Ancient island dwellers who guard their customs and secrets fiercely, living in harmony with nature.',
    color: '#8B4513',
    bannerImage: 'tribes_banner.png',
    iconImage: 'tribes.png',
  },
  [FactionName.TWILIGHT_ORDER]: {
    name: FactionName.TWILIGHT_ORDER,
    description:
      'Mystics and scholars who believe Alters and Fusions are divine advancements of nature. They seek spiritual ascension and a new world order with Alters atop the social ladder, viewing themselves as enlightened guides.',
    color: '#4B0082',
    bannerImage: 'twilight_order_banner.png',
    iconImage: 'twilight_order.png',
  },
  [FactionName.LEAGUE]: {
    name: FactionName.LEAGUE,
    description:
      'The oldest and most visible power structure in the archipelago. Built on gyms, tournaments, and ranked competition, the League believes battle is the most honest language and serves as the closest thing the islands have to a government.',
    color: '#FFD700',
    bannerImage: 'league_banner.png',
    iconImage: 'league.png',
  },
  [FactionName.RANGERS]: {
    name: FactionName.RANGERS,
    description:
      'Intermediaries between nature, monster, and man. Rangers go where the map runs out, maintaining ecological balance and protecting the delicate ecosystem of the islands with selfless dedication.',
    color: '#006400',
    bannerImage: 'rangers_banner.png',
    iconImage: 'rangers.png',
  },
  [FactionName.TAMERS]: {
    name: FactionName.TAMERS,
    description:
      'Originally nerdy teens attuned to technology, Tamers harness the digital energy surging through the world. They protect all lifeforms — especially digital ones — and believe the digital world is best left alone.',
    color: '#FF8C00',
    bannerImage: 'tamers_banner.png',
    iconImage: 'tamers.png',
  },
};

/**
 * Faction title definition
 */
export interface FactionTitle {
  standing: number;
  name: string;
  description: string;
  isPositive: boolean;
}

/**
 * Positive standing titles (earned through good reputation)
 */
export const POSITIVE_FACTION_TITLES: FactionTitle[] = [
  {
    standing: 200,
    name: 'Initiate',
    description: 'A newcomer who has shown initial promise',
    isPositive: true,
  },
  {
    standing: 400,
    name: 'Apprentice',
    description: 'A dedicated member learning the ways',
    isPositive: true,
  },
  {
    standing: 600,
    name: 'Adept',
    description: "A skilled practitioner of the faction's methods",
    isPositive: true,
  },
  {
    standing: 800,
    name: 'Expert',
    description: "A master of the faction's teachings",
    isPositive: true,
  },
  {
    standing: 1000,
    name: 'Champion',
    description: 'The highest honor, reserved for the most devoted',
    isPositive: true,
  },
];

/**
 * Negative standing titles (earned through bad reputation)
 */
export const NEGATIVE_FACTION_TITLES: FactionTitle[] = [
  {
    standing: -200,
    name: 'Distrusted',
    description: 'Viewed with suspicion and wariness',
    isPositive: false,
  },
  {
    standing: -400,
    name: 'Unwelcome',
    description: 'No longer welcome in faction territories',
    isPositive: false,
  },
  {
    standing: -600,
    name: 'Adversary',
    description: 'Considered an active threat to faction interests',
    isPositive: false,
  },
  {
    standing: -800,
    name: 'Enemy',
    description: 'Marked as a dangerous enemy of the faction',
    isPositive: false,
  },
  {
    standing: -1000,
    name: 'Nemesis',
    description: 'The ultimate enemy, hunted by the faction',
    isPositive: false,
  },
];

/**
 * All faction titles combined
 */
export const ALL_FACTION_TITLES: FactionTitle[] = [
  ...POSITIVE_FACTION_TITLES,
  ...NEGATIVE_FACTION_TITLES,
];

/**
 * Faction relationship definition with standing modifier
 */
export interface FactionRelationship {
  faction1: FactionNameValue;
  faction2: FactionNameValue;
  relationshipType: FactionRelationshipValue;
  standingModifier: number; // How much faction2 standing changes when faction1 gains 10 standing
}

/**
 * Default faction relationships
 * Format: [faction1, faction2, relationshipType, standingModifier]
 */
export const FACTION_RELATIONSHIPS: FactionRelationship[] = [
  // League relationships
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.RANGERS,
    relationshipType: 'allied',
    standingModifier: 0.5,
  },
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.TAMERS,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'neutral',
    standingModifier: 0.1,
  },
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.PROJECT_OBSIDIAN,
    relationshipType: 'rival',
    standingModifier: -0.3,
  },
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.2,
  },
  {
    faction1: FactionName.LEAGUE,
    faction2: FactionName.NYAKUZA,
    relationshipType: 'rival',
    standingModifier: -0.2,
  },

  // Rangers relationships
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'allied',
    standingModifier: 0.6,
  },
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.SPIRIT_KEEPERS,
    relationshipType: 'allied',
    standingModifier: 0.4,
  },
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.TRIBES,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.TAMERS,
    relationshipType: 'allied',
    standingModifier: 0.4,
  },
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.PROJECT_OBSIDIAN,
    relationshipType: 'enemy',
    standingModifier: -0.6,
  },
  {
    faction1: FactionName.RANGERS,
    faction2: FactionName.DIGITAL_DAWN,
    relationshipType: 'rival',
    standingModifier: -0.2,
  },

  // Project Obsidian relationships
  {
    faction1: FactionName.PROJECT_OBSIDIAN,
    faction2: FactionName.DIGITAL_DAWN,
    relationshipType: 'allied',
    standingModifier: 0.4,
  },
  {
    faction1: FactionName.PROJECT_OBSIDIAN,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.PROJECT_OBSIDIAN,
    faction2: FactionName.SPIRIT_KEEPERS,
    relationshipType: 'enemy',
    standingModifier: -0.5,
  },
  {
    faction1: FactionName.PROJECT_OBSIDIAN,
    faction2: FactionName.TRIBES,
    relationshipType: 'enemy',
    standingModifier: -0.4,
  },
  {
    faction1: FactionName.PROJECT_OBSIDIAN,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'rival',
    standingModifier: -0.3,
  },

  // Spirit Keepers relationships
  {
    faction1: FactionName.SPIRIT_KEEPERS,
    faction2: FactionName.TWILIGHT_ORDER,
    relationshipType: 'allied',
    standingModifier: 0.5,
  },
  {
    faction1: FactionName.SPIRIT_KEEPERS,
    faction2: FactionName.TRIBES,
    relationshipType: 'allied',
    standingModifier: 0.6,
  },
  {
    faction1: FactionName.SPIRIT_KEEPERS,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.SPIRIT_KEEPERS,
    faction2: FactionName.DIGITAL_DAWN,
    relationshipType: 'rival',
    standingModifier: -0.4,
  },

  // Digital Dawn relationships
  {
    faction1: FactionName.DIGITAL_DAWN,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.5,
  },
  {
    faction1: FactionName.DIGITAL_DAWN,
    faction2: FactionName.NYAKUZA,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.DIGITAL_DAWN,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'rival',
    standingModifier: -0.2,
  },
  {
    faction1: FactionName.DIGITAL_DAWN,
    faction2: FactionName.TRIBES,
    relationshipType: 'rival',
    standingModifier: -0.3,
  },

  // Tribes relationships
  {
    faction1: FactionName.TRIBES,
    faction2: FactionName.POKEMON_RANCHERS,
    relationshipType: 'allied',
    standingModifier: 0.4,
  },
  {
    faction1: FactionName.TRIBES,
    faction2: FactionName.TAMERS,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.TRIBES,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'rival',
    standingModifier: -0.3,
  },
  {
    faction1: FactionName.TRIBES,
    faction2: FactionName.NYAKUZA,
    relationshipType: 'rival',
    standingModifier: -0.2,
  },

  // Twilight Order relationships
  {
    faction1: FactionName.TWILIGHT_ORDER,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.TWILIGHT_ORDER,
    faction2: FactionName.PROJECT_OBSIDIAN,
    relationshipType: 'rival',
    standingModifier: -0.2,
  },

  // Pokemon Ranchers relationships
  {
    faction1: FactionName.POKEMON_RANCHERS,
    faction2: FactionName.TAMERS,
    relationshipType: 'allied',
    standingModifier: 0.7,
  },
  {
    faction1: FactionName.POKEMON_RANCHERS,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.2,
  },

  // Tamers relationships
  {
    faction1: FactionName.TAMERS,
    faction2: FactionName.KOAS_LABORATORY,
    relationshipType: 'allied',
    standingModifier: 0.3,
  },
  {
    faction1: FactionName.TAMERS,
    faction2: FactionName.SPIRIT_KEEPERS,
    relationshipType: 'allied',
    standingModifier: 0.2,
  },
];

/**
 * Get the title for a given standing value
 * @param standing - The standing value
 * @returns The appropriate title or null if neutral
 */
export function getFactionTitle(standing: number): FactionTitle | null {
  if (standing >= 0) {
    // Find highest positive title that applies
    for (let i = POSITIVE_FACTION_TITLES.length - 1; i >= 0; i--) {
      const title = POSITIVE_FACTION_TITLES[i];
      if (title && standing >= title.standing) {
        return title;
      }
    }
  } else {
    // Find lowest negative title that applies
    for (let i = NEGATIVE_FACTION_TITLES.length - 1; i >= 0; i--) {
      const title = NEGATIVE_FACTION_TITLES[i];
      if (title && standing <= title.standing) {
        return title;
      }
    }
  }
  return null;
}

/**
 * Get the relationship between two factions
 * @param faction1 - First faction name
 * @param faction2 - Second faction name
 * @returns The relationship or neutral if not defined
 */
export function getFactionRelationship(
  faction1: FactionNameValue,
  faction2: FactionNameValue
): FactionRelationship | null {
  return (
    FACTION_RELATIONSHIPS.find(
      (r) =>
        (r.faction1 === faction1 && r.faction2 === faction2) ||
        (r.faction1 === faction2 && r.faction2 === faction1)
    ) ?? null
  );
}

/**
 * Check if a faction name is valid
 * @param faction - The faction name to check
 * @returns True if valid
 */
export function isValidFactionName(faction: string): faction is FactionNameValue {
  return FACTION_NAMES.includes(faction as FactionNameValue);
}

/**
 * Get a faction definition by name
 * @param faction - The faction name
 * @returns The faction definition or null
 */
export function getFactionDefinition(faction: FactionNameValue): FactionDefinition | null {
  return FACTIONS[faction] || null;
}
