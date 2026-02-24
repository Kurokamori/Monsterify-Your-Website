/**
 * Static definitions for trainer form autocomplete fields
 * Used by AutocompleteInput components to provide suggestions
 */

import type { AutocompleteOption } from '../../common/AutocompleteInput';
import {
  MONSTER_TYPES,
  MONSTER_ATTRIBUTES,
  MONSTER_NATURES,
  MONSTER_CHARACTERISTICS
} from '../../../utils/staticValues';
import type {
  MonsterType,
  MonsterAttribute,
  MonsterNature,
  MonsterCharacteristic
} from '../../../utils/staticValues';

// Re-export values from staticValues with trainer-friendly aliases
export const TYPES = MONSTER_TYPES;
export const ATTRIBUTES = MONSTER_ATTRIBUTES;
export const NATURES = MONSTER_NATURES;
export const CHARACTERISTICS = MONSTER_CHARACTERISTICS;

// Re-export types from staticValues
export type { MonsterType, MonsterAttribute };
export type Nature = MonsterNature;
export type Characteristic = MonsterCharacteristic;

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
] as const;

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
] as const;

export type Faction = typeof FACTIONS[number];

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

export type Berry = typeof BERRIES[number];

// Trainer races
export const RACES = [
  'Human',
  'Alter',
  'Ultra Beast',
  'Alter (Faller)',
  'Human (Faller)',
  'Catfolk',
  'Catfolk (Faller)',
  'Catfolk (Alter)',
  'Catfolk (Alter Faller)'
] as const;

export type Race = typeof RACES[number];

// Helper function to convert string array to AutocompleteOption array
export function toAutocompleteOptions(items: readonly string[]): AutocompleteOption[] {
  return items.map(item => ({ name: item, value: item }));
}

// Pre-converted options for common use
export const TYPE_OPTIONS = toAutocompleteOptions(TYPES);
export const FACTION_OPTIONS = toAutocompleteOptions(FACTIONS);
export const NATURE_OPTIONS = toAutocompleteOptions(NATURES);
export const CHARACTERISTIC_OPTIONS = toAutocompleteOptions(CHARACTERISTICS);
export const BERRY_OPTIONS = toAutocompleteOptions(BERRIES);
export const ATTRIBUTE_OPTIONS = toAutocompleteOptions(ATTRIBUTES);
export const RACE_OPTIONS = toAutocompleteOptions(RACES);

// Helper function to get options by field name
export function getOptionsForField(fieldName: string): readonly string[] {
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
  if (fieldLower.includes('race')) {
    return RACES;
  }

  return [];
}

// Select options format for FormSelect component
export const RACE_SELECT_OPTIONS = RACES.map(race => ({
  value: race,
  label: race
}));

export const FACTION_SELECT_OPTIONS = FACTIONS.map(faction => ({
  value: faction,
  label: faction
}));
