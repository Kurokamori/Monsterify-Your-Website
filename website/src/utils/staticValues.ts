/**
 * Static values for monster properties
 * Types, attributes, natures, characteristics, and other constants
 */

// Monster types
export const MONSTER_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy'
] as const;

export const TYPE_CHART: Record<string, Record<string, number>> = {
  'Normal': { 'Rock': 0.5, 'Ghost': 0, 'Steel': 0.5 },
  'Fire': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 2, 'Bug': 2, 'Rock': 0.5, 'Dragon': 0.5, 'Steel': 2 },
  'Water': { 'Fire': 2, 'Water': 0.5, 'Grass': 0.5, 'Ground': 2, 'Rock': 2, 'Dragon': 0.5 },
  'Electric': { 'Water': 2, 'Electric': 0.5, 'Grass': 0.5, 'Ground': 0, 'Flying': 2, 'Dragon': 0.5 },
  'Grass': { 'Fire': 0.5, 'Water': 2, 'Grass': 0.5, 'Poison': 0.5, 'Ground': 2, 'Flying': 0.5, 'Bug': 0.5, 'Rock': 2, 'Dragon': 0.5, 'Steel': 0.5 },
  'Ice': { 'Fire': 0.5, 'Water': 0.5, 'Grass': 2, 'Ice': 0.5, 'Ground': 2, 'Flying': 2, 'Dragon': 2, 'Steel': 0.5 },
  'Fighting': { 'Normal': 2, 'Ice': 2, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 0.5, 'Bug': 0.5, 'Rock': 2, 'Ghost': 0, 'Dark': 2, 'Steel': 2, 'Fairy': 0.5 },
  'Poison': { 'Grass': 2, 'Poison': 0.5, 'Ground': 0.5, 'Rock': 0.5, 'Ghost': 0.5, 'Steel': 0, 'Fairy': 2 },
  'Ground': { 'Fire': 2, 'Electric': 2, 'Grass': 0.5, 'Poison': 2, 'Flying': 0, 'Bug': 0.5, 'Rock': 2, 'Steel': 2 },
  'Flying': { 'Electric': 0.5, 'Grass': 2, 'Ice': 0.5, 'Fighting': 2, 'Bug': 2, 'Rock': 0.5, 'Steel': 0.5 },
  'Psychic': { 'Fighting': 2, 'Poison': 2, 'Psychic': 0.5, 'Dark': 0, 'Steel': 0.5 },
  'Bug': { 'Fire': 0.5, 'Grass': 2, 'Fighting': 0.5, 'Poison': 0.5, 'Flying': 0.5, 'Psychic': 2, 'Ghost': 0.5, 'Dark': 2, 'Steel': 0.5, 'Fairy': 0.5 },
  'Rock': { 'Fire': 2, 'Ice': 2, 'Fighting': 0.5, 'Ground': 0.5, 'Flying': 2, 'Bug': 2, 'Steel': 0.5 },
  'Ghost': { 'Normal': 0, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5 },
  'Dragon': { 'Dragon': 2, 'Steel': 0.5, 'Fairy': 0 },
  'Dark': { 'Fighting': 0.5, 'Psychic': 2, 'Ghost': 2, 'Dark': 0.5, 'Fairy': 0.5 },
  'Steel': { 'Fire': 0.5, 'Water': 0.5, 'Electric': 0.5, 'Ice': 2, 'Rock': 2, 'Steel': 0.5, 'Fairy': 2 },
  'Fairy': { 'Fire': 0.5, 'Fighting': 2, 'Poison': 0.5, 'Dragon': 2, 'Dark': 2, 'Steel': 0.5 }
} as const;

// Monster attributes
export const MONSTER_ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'] as const;

// Monster natures
export const MONSTER_NATURES = [ 'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle',
    'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty', 'Quiet',
    'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid' ] as const;

// Monster characteristics
export const MONSTER_CHARACTERISTICS = [
  // HP
  'Loves to eat', 'Takes plenty of siestas', 'Nods off a lot', 'Scatters things often', 'Likes to relax',
  // Attack
  'Proud of its power', 'Likes to thrash about', 'A little quick tempered', 'Likes to fight', 'Quick tempered',
  // Defense
  'Sturdy body', 'Capable of taking hits', 'Highly persistent', 'Good endurance', 'Good perseverance',
  // Special Attack
  'Highly curious', 'Mischievous', 'Thoroughly cunning', 'Often lost in thought', 'Very finicky',
  // Special Defense
  'Strong willed', 'Somewhat vain', 'Strongly defiant', 'Hates to lose', 'Somewhat stubborn',
  // Speed
  'Likes to run', 'Alert to sounds', 'Impetuous and silly', 'Somewhat of a clown', 'Quick to flee'
] as const;

// Factions
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
] as const;

// Species universe categories
export const SPECIES_CATEGORIES = [
  'Pokemon',
  'Digimon',
  'Yokai',
  'Palmon',
  'Nexomon',
  'Fakemon',
  'Final Fantasy',
  'Monster Hunter'
] as const;

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
] as const;

// Type exports
export type MonsterType = typeof MONSTER_TYPES[number];
export type MonsterAttribute = typeof MONSTER_ATTRIBUTES[number];
export type MonsterNature = typeof MONSTER_NATURES[number];
export type MonsterCharacteristic = typeof MONSTER_CHARACTERISTICS[number];
export type TypeChart = typeof TYPE_CHART;
export type Faction = typeof FACTIONS[number];
export type SpeciesCategory = typeof SPECIES_CATEGORIES[number];
export type Berry = typeof BERRIES[number];
