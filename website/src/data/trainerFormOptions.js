/**
 * Static definitions for trainer form autocomplete fields
 * These are used by the AutocompleteInput component to provide suggestions
 */

// Pokemon-style types
export const TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy'
];

// Monster attributes
export const ATTRIBUTES = [
  'Data',
  'Virus',
  'Vaccine',
  'Free',
  'Variable'
];

// Fakemon universe categories
export const FAKEMON_CATEGORIES = [
  'Pokemon',
  'Digimon',
  'Yokai',
  'Palmon',
  'Nexomon',
  'Fakemon',
  'Final Fantasy',
  'Monster Hunter'
];

// Berry types
export const BERRIES = [
  'Cheri Berry',
  'Chesto Berry',
  'Pecha Berry',
  'Rawst Berry',
  'Aspear Berry',
  'Leppa Berry',
  'Oran Berry',
  'Persim Berry',
  'Lum Berry',
  'Sitrus Berry',
  'Figy Berry',
  'Wiki Berry',
  'Mago Berry',
  'Aguav Berry',
  'Iapapa Berry',
  'Razz Berry',
  'Bluk Berry',
  'Nanab Berry',
  'Wepear Berry',
  'Pinap Berry',
  'Pomeg Berry',
  'Kelpsy Berry',
  'Qualot Berry',
  'Hondew Berry',
  'Grepa Berry',
  'Tamato Berry',
  'Cornn Berry',
  'Magost Berry',
  'Rabuta Berry',
  'Nomel Berry',
  'Spelon Berry',
  'Pamtre Berry',
  'Watmel Berry',
  'Durin Berry',
  'Belue Berry',
  'Occa Berry',
  'Passho Berry',
  'Wacan Berry',
  'Rindo Berry',
  'Yache Berry',
  'Chople Berry',
  'Kebia Berry',
  'Shuca Berry',
  'Coba Berry',
  'Payapa Berry',
  'Tanga Berry',
  'Charti Berry',
  'Kasib Berry',
  'Haban Berry',
  'Colbur Berry',
  'Babiri Berry',
  'Chilan Berry',
  'Roseli Berry',
  'Liechi Berry',
  'Ganlon Berry',
  'Salac Berry',
  'Petaya Berry',
  'Apicot Berry',
  'Lansat Berry',
  'Starf Berry',
  'Enigma Berry',
  'Micle Berry',
  'Custap Berry',
  'Jaboca Berry',
  'Rowap Berry',
  'Kee Berry',
  'Maranga Berry'
];

// Factions in the game
export const FACTIONS = [
  'Nyakuza',
  'Digital Dawn',
  'Ranchers',
  'Tamers',
  'Rangers',
  'League',
  "Koa's Laboratory",
  'Project Obsidian',
  'Spirit Keepers',
  'The Tribes',
  'Twilight Order',
  'Unknown'
];

// Pokemon natures
export const NATURES = [
  'Hardy',
  'Lonely',
  'Brave',
  'Adamant',
  'Naughty',
  'Bold',
  'Docile',
  'Relaxed',
  'Impish',
  'Lax',
  'Timid',
  'Hasty',
  'Serious',
  'Jolly',
  'Naive',
  'Modest',
  'Mild',
  'Quiet',
  'Bashful',
  'Rash',
  'Calm',
  'Gentle',
  'Sassy',
  'Careful',
  'Quirky'
];

// Pokemon characteristics
export const CHARACTERISTICS = [
  // HP
  'Loves to eat',
  'Takes plenty of siestas',
  'Nods off a lot',
  'Scatters things often',
  'Likes to relax',
  // Attack
  'Proud of its power',
  'Likes to thrash about',
  'A little quick tempered',
  'Likes to fight',
  'Quick tempered',
  // Defense
  'Sturdy body',
  'Capable of taking hits',
  'Highly persistent',
  'Good endurance',
  'Good perseverance',
  // Special Attack
  'Highly curious',
  'Mischievous',
  'Thoroughly cunning',
  'Often lost in thought',
  'Very finicky',
  // Special Defense
  'Strong willed',
  'Somewhat vain',
  'Strongly defiant',
  'Hates to lose',
  'Somewhat stubborn',
  // Speed
  'Likes to run',
  'Alert to sounds',
  'Impetuous and silly',
  'Somewhat of a clown',
  'Quick to flee'
];

// Helper function to get options by field name
export const getOptionsForField = (fieldName) => {
  const fieldLower = fieldName.toLowerCase();

  if (fieldLower.includes('type') || fieldLower.includes('fav_type')) {
    return TYPES;
  }
  if (fieldLower.includes('attribute')) {
    return ATTRIBUTES;
  }
  if (fieldLower.includes('berry') || fieldLower.includes('fav_berry')) {
    return BERRIES;
  }
  if (fieldLower.includes('faction')) {
    return FACTIONS;
  }
  if (fieldLower.includes('nature')) {
    return NATURES;
  }
  if (fieldLower.includes('characteristic')) {
    return CHARACTERISTICS;
  }

  return [];
};

export default {
  TYPES,
  ATTRIBUTES,
  BERRIES,
  FACTIONS,
  NATURES,
  CHARACTERISTICS,
  getOptionsForField
};
