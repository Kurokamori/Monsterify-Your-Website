/**
 * Move Type Definitions
 * Types for moves and abilities
 */

import { BaseEntity } from './common.types';
import { MonsterTypeValue } from '../constants/monster-types';
import { MoveCategoryValue, MoveTargetValue } from '../constants/battle-constants';

/**
 * Move entity
 */
export interface Move {
  id?: number;
  moveName: string;
  type: MonsterTypeValue;
  attribute: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  effect: string | null;
  effectChance: number | null;
  target: MoveTargetValue;
  moveType: MoveCategoryValue; // Physical, Special, or Status
  learnLevel: number | null;
  description: string | null;
}

/**
 * Move with formatted display data
 */
export interface MoveWithDetails extends Move {
  typeColor: string;
  categoryIcon: string;
  formattedPower: string;
  formattedAccuracy: string;
}

/**
 * Move summary for listings
 */
export interface MoveSummary {
  moveName: string;
  type: MonsterTypeValue;
  moveType: MoveCategoryValue;
  power: number | null;
  accuracy: number | null;
}

/**
 * Move for battle context
 */
export interface BattleMove extends Move {
  currentPP: number;
  maxPP: number;
  isDisabled: boolean;
  canUse: boolean;
  disabledReason?: string;
}

/**
 * Move effect types
 */
export type MoveEffectType =
  | 'damage'
  | 'heal'
  | 'status'
  | 'stat_change'
  | 'weather'
  | 'terrain'
  | 'protect'
  | 'recoil'
  | 'drain'
  | 'multi_hit'
  | 'priority'
  | 'switch'
  | 'trap'
  | 'flinch'
  | 'crit_boost'
  | 'field_effect';

/**
 * Parsed move effect
 */
export interface ParsedMoveEffect {
  type: MoveEffectType;
  value?: number;
  stat?: string;
  status?: string;
  weather?: string;
  terrain?: string;
  chance?: number;
  target?: 'self' | 'target' | 'all';
}

/**
 * Ability entity
 */
export interface Ability extends BaseEntity {
  name: string;
  effect: string;
  description: string;
  commonTypes: MonsterTypeValue[];
  signatureMonsters: string[];
}

/**
 * Ability with details
 */
export interface AbilityWithDetails extends Ability {
  monsterCount: number;
  isHidden: boolean;
}

/**
 * Ability trigger types
 */
export type AbilityTrigger =
  | 'on_switch_in'
  | 'on_switch_out'
  | 'on_damage_taken'
  | 'on_damage_dealt'
  | 'on_status_applied'
  | 'on_turn_end'
  | 'on_move_used'
  | 'on_weather_change'
  | 'on_terrain_change'
  | 'passive'
  | 'contact';

/**
 * Ability effect definition
 */
export interface AbilityEffect {
  trigger: AbilityTrigger;
  effect: string;
  chance?: number;
  conditions?: AbilityCondition[];
}

/**
 * Ability condition
 */
export interface AbilityCondition {
  type: 'weather' | 'terrain' | 'status' | 'hp_threshold' | 'move_type';
  value: string | number;
  operator?: 'equals' | 'above' | 'below' | 'not';
}

/**
 * Move query options
 */
export interface MoveQueryOptions {
  type?: MonsterTypeValue;
  category?: MoveCategoryValue;
  minPower?: number;
  maxPower?: number;
  minAccuracy?: number;
  hasPriority?: boolean;
  search?: string;
  sortBy?: 'name' | 'power' | 'accuracy' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Ability query options
 */
export interface AbilityQueryOptions {
  search?: string;
  sortBy?: 'name' | 'monsterCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Learnable move for a monster
 */
export interface LearnableMove {
  moveName: string;
  learnMethod: LearnMethod;
  level?: number;
  item?: string;
  tutor?: string;
}

/**
 * How a move can be learned
 */
export type LearnMethod = 'level_up' | 'tm' | 'hm' | 'tutor' | 'egg' | 'evolution' | 'event';

/**
 * Move compatibility for a monster
 */
export interface MoveCompatibility {
  monsterId: number;
  monsterSpecies: string;
  learnableMoves: LearnableMove[];
  currentMoves: string[];
  canLearnTMs: string[];
  eggMoves: string[];
}

/**
 * Move damage calculation result
 */
export interface MoveDamageResult {
  baseDamage: number;
  finalDamage: number;
  isCritical: boolean;
  effectiveness: number;
  stab: boolean;
  weatherModifier: number;
  terrainModifier: number;
  randomFactor: number;
  burnPenalty: boolean;
}
