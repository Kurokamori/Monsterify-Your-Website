/**
 * Monster Type Definitions
 * Types for monsters and their stats/attributes
 */

import { BaseEntity } from './common.types';
import { MonsterTypeValue } from '../constants/monster-types';
import { GenderValue } from '../constants/monster-genders';
import { MonsterAttributeValue } from '../constants/monster-attributes';

/**
 * Monster stats (calculated totals)
 */
export interface MonsterStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * Monster IVs (Individual Values)
 */
export interface MonsterIVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * Monster EVs (Effort Values)
 */
export interface MonsterEVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * Full monster entity
 */
export interface Monster extends BaseEntity {
  trainerId: number;
  playerUserId: string;
  name: string;

  // Species (supports multi-species monsters)
  species1: string;
  species2: string | null;
  species3: string | null;

  // Types (supports multi-type monsters, up to 5)
  type1: MonsterTypeValue;
  type2: MonsterTypeValue | null;
  type3: MonsterTypeValue | null;
  type4: MonsterTypeValue | null;
  type5: MonsterTypeValue | null;

  // Attribute (evolution stage, rank, etc.)
  attribute: MonsterAttributeValue | null;

  // Level
  level: number;

  // Stats (totals)
  hpTotal: number;
  atkTotal: number;
  defTotal: number;
  spaTotal: number;
  spdTotal: number;
  speTotal: number;

  // IVs (Individual Values) - 0-31
  hpIv: number;
  atkIv: number;
  defIv: number;
  spaIv: number;
  spdIv: number;
  speIv: number;

  // EVs (Effort Values) - 0-252 each, 510 total max
  hpEv: number;
  atkEv: number;
  defEv: number;
  spaEv: number;
  spdEv: number;
  speEv: number;

  // Traits
  nature: string;
  characteristic: string;
  gender: GenderValue;
  friendship: number;
  ability1: string | null;
  ability2: string | null;

  // Moves (JSON array of up to 4 move names)
  moveset: string[];

  // Images
  imgLink: string | null;

  // Metadata
  dateMet: Date | null;
  whereMet: string | null;
  boxNumber: number;
  trainerIndex: number;

  // Special flags
  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
  isStarterTemplate: boolean;
}

/**
 * Monster with computed fields (for API responses)
 */
export interface MonsterWithDetails extends Monster {
  trainerName: string;
  playerUsername: string;
  moveDetails?: MoveInfo[];
  abilityDetails?: AbilityInfo[];
}

/**
 * Monster summary (minimal info for listings)
 */
export interface MonsterSummary {
  id: number;
  name: string;
  species1: string;
  type1: MonsterTypeValue;
  type2: MonsterTypeValue | null;
  level: number;
  imgLink: string | null;
  shiny: boolean;
  alpha: boolean;
}

/**
 * Move info for display
 */
export interface MoveInfo {
  name: string;
  type: MonsterTypeValue;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  description: string;
}

/**
 * Ability info for display
 */
export interface AbilityInfo {
  name: string;
  effect: string;
  description: string;
}

/**
 * Input for creating a new monster
 */
export interface MonsterCreateInput {
  trainerId: number;
  playerUserId?: string;
  name: string;
  species1: string;
  species2?: string;
  species3?: string;
  type1: MonsterTypeValue;
  type2?: MonsterTypeValue;
  type3?: MonsterTypeValue;
  type4?: MonsterTypeValue;
  type5?: MonsterTypeValue;
  attribute?: MonsterAttributeValue;
  level?: number;
  nature?: string;
  gender?: GenderValue;
  ability1?: string;
  ability2?: string;
  moveset?: string[];
  imgLink?: string;
  dateMet?: Date;
  whereMet?: string;
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
}

/**
 * Input for updating a monster
 */
export interface MonsterUpdateInput {
  name?: string;
  type1?: MonsterTypeValue;
  type2?: MonsterTypeValue | null;
  type3?: MonsterTypeValue | null;
  type4?: MonsterTypeValue | null;
  type5?: MonsterTypeValue | null;
  attribute?: MonsterAttributeValue | null;
  nature?: string;
  gender?: GenderValue;
  ability1?: string | null;
  ability2?: string | null;
  moveset?: string[];
  imgLink?: string | null;
  friendship?: number;
  boxNumber?: number;
  trainerIndex?: number;
}

/**
 * Box position for monster storage
 */
export interface BoxPosition {
  boxNumber: number;
  trainerIndex: number;
}

/**
 * Monster transfer input
 */
export interface MonsterTransferInput {
  monsterId: number;
  newTrainerId: number;
}

/**
 * Level up result
 */
export interface MonsterLevelUpResult {
  previousLevel: number;
  newLevel: number;
  statsGained: Partial<MonsterStats>;
  evsGained: Partial<MonsterEVs>;
  friendshipGained: number;
  newMoves?: string[];
}

/**
 * Evolution data
 */
export interface EvolutionData {
  fromSpecies: string;
  toSpecies: string;
  method: EvolutionMethod;
  requirements: EvolutionRequirements;
}

/**
 * Evolution method types
 */
export type EvolutionMethod =
  | 'level'
  | 'item'
  | 'trade'
  | 'friendship'
  | 'location'
  | 'time'
  | 'special';

/**
 * Evolution requirements
 */
export interface EvolutionRequirements {
  minLevel?: number;
  item?: string;
  friendship?: number;
  location?: string;
  timeOfDay?: 'day' | 'night';
  heldItem?: string;
  move?: string;
  gender?: GenderValue;
  weather?: string;
  customCondition?: string;
}

/**
 * Monster lineage (breeding/evolution history)
 */
export interface MonsterLineage {
  id: number;
  monsterId: number;
  parent1Id: number | null;
  parent2Id: number | null;
  evolutionData: EvolutionData[];
  createdAt: Date;
}

/**
 * Monster image entry
 */
export interface MonsterImage {
  id: number;
  monsterId: number;
  imageUrl: string;
  imageType: 'primary' | 'shiny' | 'alternate' | 'art';
  uploadedAt: Date;
}

/**
 * Monster query/filter options
 */
export interface MonsterQueryOptions {
  trainerId?: number;
  playerUserId?: string;
  boxNumber?: number;
  type?: MonsterTypeValue;
  species?: string;
  minLevel?: number;
  maxLevel?: number;
  shiny?: boolean;
  alpha?: boolean;
  search?: string;
  sortBy?: 'name' | 'level' | 'species1' | 'createdAt' | 'type1';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Stat calculation input
 */
export interface StatCalculationInput {
  level: number;
  baseStats?: MonsterStats;
  ivs: MonsterIVs;
  evs: MonsterEVs;
  nature: string;
}

/**
 * Default IVs (for generation)
 */
export const DEFAULT_IVS: MonsterIVs = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

/**
 * Default EVs (for new monsters)
 */
export const DEFAULT_EVS: MonsterEVs = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};
