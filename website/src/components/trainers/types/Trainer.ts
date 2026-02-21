/**
 * Trainer Types and Interfaces
 * Core type definitions for trainer data throughout the application
 */

export interface Trainer {
  id: number;
  name: string;
  nickname?: string;
  full_name?: string;

  // Player info
  player_user_id?: string;
  player_display_name?: string;
  player_username?: string;

  // Game stats
  level: number;
  faction?: string;
  title?: string;
  currency_amount: number;
  total_earned_currency: number;

  // Species & Types
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  type6?: string;

  // Abilities
  ability?: string;
  nature?: string;
  characteristic?: string;

  // Favorite types/berries
  fav_type1?: string;
  fav_type2?: string;
  fav_type3?: string;
  fav_type4?: string;
  fav_type5?: string;
  fav_type6?: string;
  fav_berry?: string;

  // Personal info
  gender?: string;
  pronouns?: string;
  sexuality?: string;
  age?: string;
  height?: string;
  weight?: string;
  theme?: string;
  voice_claim?: string;
  occupation?: string;
  birthday?: string;
  zodiac?: string;
  chinese_zodiac?: string;
  birthplace?: string;
  residence?: string;
  race?: TrainerRace;

  // Personality
  strengths?: string;
  weaknesses?: string;
  likes?: string;
  dislikes?: string;
  flaws?: string;
  values?: string;
  quirks?: string;

  // Biography
  quote?: string;
  tldr?: string;
  biography?: string;

  // Images
  main_ref?: string;
  mega_ref?: string;
  mega_artist?: string;

  // Mega evolution data
  mega_species1?: string;
  mega_species2?: string;
  mega_species3?: string;
  mega_type1?: string;
  mega_type2?: string;
  mega_type3?: string;
  mega_type4?: string;
  mega_type5?: string;
  mega_type6?: string;
  mega_ability?: string;
  mega_info?: MegaEvolutionInfo;

  // Additional data (JSON fields)
  additional_refs?: AdditionalReference[];
  secrets?: TrainerSecret[];
  relations?: TrainerRelation[];

  // Computed/aggregated fields
  monster_count?: number;
  monster_ref_count?: number;
  monster_ref_percent?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export type TrainerRace =
  | 'Human'
  | 'Alter'
  | 'Ultra Beast'
  | 'Alter (Faller)'
  | 'Human (Faller)'
  | 'Catfolk';

export interface MegaEvolutionInfo {
  trigger?: string;
  description?: string;
  [key: string]: unknown;
}

export interface AdditionalReference {
  id?: number;
  url: string;
  title?: string;
  description?: string;
  artist?: string;
}

export interface TrainerSecret {
  id?: number;
  title: string;
  description: string;
}

export interface TrainerRelation {
  id?: number;
  type: 'trainer' | 'monster';
  target_id: number;
  target_name?: string;
  relationship: string;
  elaboration?: string;
}

export interface TrainerInventory {
  trainer_id: number;
  items: InventoryItem[];
  balls: InventoryItem[];
  berries: InventoryItem[];
  eggs: InventoryItem[];
  key_items: InventoryItem[];
}

export interface InventoryItem {
  name: string;
  quantity: number;
  category?: string;
}

export interface TrainerFormData {
  // Basic Info
  name: string;
  nickname?: string;
  full_name?: string;
  level?: number;
  faction?: string;
  title?: string;
  currency_amount?: number;
  total_earned_currency?: number;
  main_ref?: string;

  // Personal Info
  gender?: string;
  pronouns?: string;
  sexuality?: string;
  age?: string;
  height?: string;
  weight?: string;
  theme_display?: string;
  theme_link?: string;
  voice_claim_display?: string;
  voice_claim_link?: string;
  occupation?: string;
  birthday?: string;
  zodiac?: string;
  chinese_zodiac?: string;
  birthplace?: string;
  residence?: string;
  race?: TrainerRace;

  // Species & Types
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  type6?: string;
  ability?: string;
  nature?: string;
  characteristic?: string;

  // Favorite Types
  fav_type1?: string;
  fav_type2?: string;
  fav_type3?: string;
  fav_type4?: string;
  fav_type5?: string;
  fav_type6?: string;
  fav_berry?: string;

  // Character Info
  strengths?: string;
  weaknesses?: string;
  likes?: string;
  dislikes?: string;
  flaws?: string;
  values?: string;
  quirks?: string;

  // Biography
  quote?: string;
  tldr?: string;
  biography?: string;

  // User ID (for creation)
  user_id?: string;
}

export type TrainerFormMode = 'create' | 'edit' | 'admin';

export interface TrainerListFilters {
  search?: string;
  faction?: string;
  level?: number;
  sortBy?: 'name' | 'level' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface TrainerCardData {
  id: number;
  name: string;
  nickname?: string;
  level: number;
  faction?: string;
  title?: string;
  main_ref?: string;
  player_display_name?: string;
  monster_count?: number;
  types?: string[];
}

// Helper function to extract types from trainer
export function getTrainerTypes(trainer: Trainer | TrainerCardData): string[] {
  if ('types' in trainer && trainer.types) {
    return trainer.types;
  }

  const types: string[] = [];
  const trainerData = trainer as Trainer;

  if (trainerData.type1) types.push(trainerData.type1);
  if (trainerData.type2) types.push(trainerData.type2);
  if (trainerData.type3) types.push(trainerData.type3);
  if (trainerData.type4) types.push(trainerData.type4);
  if (trainerData.type5) types.push(trainerData.type5);
  if (trainerData.type6) types.push(trainerData.type6);

  return types;
}

// Helper to parse theme into display text and link
export function parseTrainerTheme(theme?: string): { display: string; link: string } {
  if (!theme) return { display: '', link: '' };

  if (theme.includes(' || ')) {
    const [display, link] = theme.split(' || ');
    return { display, link };
  }

  return { display: theme, link: '' };
}

// Helper to combine theme display and link
export function combineTrainerTheme(display: string, link: string): string {
  if (link && display) {
    return `${display} || ${link}`;
  }
  return display;
}

// Voice claim uses the same "display || link" format as theme
export const parseVoiceClaim = parseTrainerTheme;
export const combineVoiceClaim = combineTrainerTheme;

// --- Form-specific types for dynamic lists ---

export interface FormSecret {
  id: number;
  title: string;
  description: string;
}

export interface FormRelation {
  id: number;
  type: 'trainer' | 'monster';
  trainer_id: string;
  monster_id: string;
  name: string;
  elaboration: string;
}

export interface FormAdditionalRef {
  id: number;
  title: string;
  description: string;
  image_url: string;
  image_file?: File;
}

export interface MegaFormData {
  mega_ref?: string;
  mega_artist?: string;
  mega_species1?: string;
  mega_species2?: string;
  mega_species3?: string;
  mega_type1?: string;
  mega_type2?: string;
  mega_type3?: string;
  mega_type4?: string;
  mega_type5?: string;
  mega_type6?: string;
  mega_ability?: string;
}
