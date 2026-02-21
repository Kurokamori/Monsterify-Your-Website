/**
 * Adventure Type Definitions
 * Types for adventures, encounters, and exploration
 */

import { BaseEntity, Range } from './common.types';
import { MonsterTypeValue } from '../constants/monster-types';
import { WeatherValue, TerrainValue } from '../constants/weather-terrain';
import { RegionValue, LandmassValue } from '../constants/regions';
import { EvolutionStageValue, DigimonRankValue, MonsterGradeValue } from '../constants/monster-attributes';

/**
 * Adventure status
 */
export const AdventureStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type AdventureStatusValue = (typeof AdventureStatus)[keyof typeof AdventureStatus];

/**
 * Adventure entity
 */
export interface Adventure extends BaseEntity {
  title: string;
  description: string;
  region: RegionValue;
  areaKey: string;
  creatorId: number;
  status: AdventureStatusValue;
  discordThreadId: string | null;
  discordChannelId: string | null;
  maxParticipants: number | null;
  isPublic: boolean;
}

/**
 * Adventure with computed fields
 */
export interface AdventureWithDetails extends Adventure {
  creatorName: string;
  participantCount: number;
  encounterCount: number;
  regionName: string;
  landmassName: string;
}

/**
 * Adventure encounter
 */
export interface AdventureEncounter extends BaseEntity {
  adventureId: number;
  encounterId: number;
  monsterSpecies: string;
  monsterLevel: number;
  monsterTypes: MonsterTypeValue[];
  isShiny: boolean;
  isAlpha: boolean;
  agroLevel: number;
  encountered: boolean;
  captured: boolean;
  defeated: boolean;
  fled: boolean;
}

/**
 * Adventure participant
 */
export interface AdventureParticipant {
  id: number;
  adventureId: number;
  trainerId: number;
  joinedAt: Date;
  isActive: boolean;
  lastActivityAt: Date;
}

/**
 * Adventure participant with details
 */
export interface AdventureParticipantWithDetails extends AdventureParticipant {
  trainerName: string;
  trainerLevel: number;
  trainerImgLink: string | null;
  playerUsername: string;
}

/**
 * Adventure thread (Discord integration)
 */
export interface AdventureThread {
  id: number;
  adventureId: number;
  threadId: string;
  channelId: string;
  guildId: string;
  createdAt: Date;
  archivedAt: Date | null;
}

/**
 * Adventure log entry
 */
export interface AdventureLogEntry {
  id: number;
  adventureId: number;
  participantId: number | null;
  eventType: AdventureEventType;
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Adventure event types
 */
export type AdventureEventType =
  | 'adventure_start'
  | 'adventure_end'
  | 'participant_join'
  | 'participant_leave'
  | 'encounter_spawned'
  | 'encounter_engaged'
  | 'monster_captured'
  | 'monster_defeated'
  | 'monster_fled'
  | 'item_found'
  | 'special_event';

/**
 * Input for creating an adventure
 */
export interface AdventureCreateInput {
  title: string;
  description?: string;
  areaKey: string;
  creatorId: number;
  maxParticipants?: number;
  isPublic?: boolean;
  discordChannelId?: string;
}

/**
 * Input for updating an adventure
 */
export interface AdventureUpdateInput {
  title?: string;
  description?: string;
  status?: AdventureStatusValue;
  maxParticipants?: number | null;
  isPublic?: boolean;
}

/**
 * Area configuration for adventures
 */
export interface AreaConfiguration {
  key: string;
  landmass: LandmassValue;
  landmassName: string;
  region: RegionValue;
  regionName: string;
  needsMissionMandate: boolean;
  welcomeMessages: {
    base: string;
    variations: string[];
  };
  battleParameters: {
    weather: WeatherValue;
    terrain: TerrainValue;
  };
  monsterRollerParameters: MonsterRollerParameters;
  levelRange: Range;
  agroRange: Range;
  itemRequirements: {
    needsMissionMandate: boolean;
    itemRequired?: string;
  };
  specialEncounters: SpecialEncounterConfig[];
}

/**
 * Monster roller parameters for area
 */
export interface MonsterRollerParameters {
  speciesTypesOptions: MonsterTypeValue[];
  includeStages: (EvolutionStageValue | 'base')[];
  includeRanks: (DigimonRankValue | MonsterGradeValue)[];
  species_min: number;
  species_max: number;
  types_min: number;
  types_max: number;
}

/**
 * Special encounter configuration
 */
export interface SpecialEncounterConfig {
  type: string;
  chance: number;
  description: string;
  requirements?: {
    minLevel?: number;
    item?: string;
    weather?: WeatherValue;
    timeOfDay?: 'day' | 'night';
  };
}

/**
 * Encounter roll result
 */
export interface EncounterRollResult {
  species: string;
  speciesSource: string; // pokemon, digimon, yokai, etc.
  types: MonsterTypeValue[];
  level: number;
  attribute: string | null;
  isShiny: boolean;
  isAlpha: boolean;
  agroLevel: number;
  activity: string;
  willAttack: boolean;
}

/**
 * Adventure query options
 */
export interface AdventureQueryOptions {
  status?: AdventureStatusValue;
  region?: RegionValue;
  creatorId?: number;
  participantId?: number;
  isPublic?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'participantCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Encounter generation input
 */
export interface EncounterGenerationInput {
  adventureId: number;
  areaConfig: AreaConfiguration;
  participantLevel?: number;
  forceSpecialEncounter?: boolean;
}

/**
 * Adventure statistics
 */
export interface AdventureStats {
  adventureId: number;
  totalEncounters: number;
  monstersEncountered: number;
  monstersCaptured: number;
  monstersDefeated: number;
  monstersFled: number;
  itemsFound: number;
  participantCount: number;
  duration: number; // in minutes
  mostCommonType: MonsterTypeValue | null;
  averageMonsterLevel: number;
}
