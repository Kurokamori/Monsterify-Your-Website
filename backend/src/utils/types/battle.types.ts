/**
 * Battle Type Definitions
 * Types for the battle system
 */

import { BaseEntity } from './common.types';
import { MonsterTypeValue } from '../constants/monster-types';
import { StatKeyValue } from '../constants/monster-natures';
import { StatusEffectValue } from '../constants/status-effects';
import { WeatherValue, TerrainValue } from '../constants/weather-terrain';
import {
  BattleStatusValue,
  BattleActionTypeValue,
  BattleTypeValue,
  MoveCategoryValue,
} from '../constants/battle-constants';

/**
 * Battle instance
 */
export interface BattleInstance extends BaseEntity {
  adventureId: number | null;
  battleType: BattleTypeValue;
  status: BattleStatusValue;
  currentTurn: number;
  weather: WeatherValue;
  weatherTurnsRemaining: number | null;
  terrain: TerrainValue;
  terrainTurnsRemaining: number | null;
  winnerId: number | null;
}

/**
 * Battle participant (trainer in battle)
 */
export interface BattleParticipant {
  id: number;
  battleId: number;
  trainerId: number | null; // Null for wild encounters
  isPlayer: boolean;
  isActive: boolean;
  order: number;
}

/**
 * Monster in battle (with current state)
 */
export interface BattleMonster {
  id: number;
  battleId: number;
  participantId: number;
  monsterId: number;
  position: number;

  // Current HP
  currentHp: number;
  maxHp: number;

  // Status
  primaryStatus: StatusEffectValue | null;
  primaryStatusTurns: number | null;
  volatileStatuses: VolatileStatusState[];

  // Stat stages (-6 to +6)
  statModifiers: Record<StatKeyValue, number>;
  accuracyStage: number;
  evasionStage: number;

  // Battle state
  isActive: boolean;
  isFainted: boolean;
  hasMoved: boolean;
  lastMoveUsed: string | null;
  movesDisabled: string[];
  pp: Record<string, number>;

  // Protection states
  isProtected: boolean;
  substituteHp: number | null;
}

/**
 * Volatile status with remaining turns
 */
export interface VolatileStatusState {
  status: StatusEffectValue;
  turnsRemaining: number | null;
  data?: Record<string, unknown>; // Extra data like perish song counter
}

/**
 * Battle turn record
 */
export interface BattleTurn extends BaseEntity {
  battleId: number;
  turnNumber: number;
  actorId: number;
  action: BattleAction;
  targetId: number | null;
  result: BattleTurnResult;
}

/**
 * Action taken in a turn
 */
export interface BattleAction {
  type: BattleActionTypeValue;
  moveId?: number;
  moveName?: string;
  itemId?: number;
  itemName?: string;
  switchToMonsterId?: number;
  targetMonsterId?: number;
}

/**
 * Result of a battle turn
 */
export interface BattleTurnResult {
  success: boolean;
  damage?: number;
  healing?: number;
  critical?: boolean;
  effectiveness?: number;
  effectivenessText?: string;
  statusApplied?: StatusEffectValue;
  statusRemoved?: StatusEffectValue;
  statChanges?: Record<StatKeyValue, number>;
  captured?: boolean;
  fled?: boolean;
  switched?: boolean;
  fainted?: boolean;
  recoil?: number;
  drain?: number;
  weatherChanged?: WeatherValue;
  terrainChanged?: TerrainValue;
  message?: string;
  additionalEffects?: string[];
}

/**
 * Battle log entry
 */
export interface BattleLogEntry {
  id: number;
  battleId: number;
  turnNumber: number;
  timestamp: Date;
  message: string;
  type: BattleLogType;
  data?: Record<string, unknown>;
}

/**
 * Battle log entry types
 */
export type BattleLogType =
  | 'turn_start'
  | 'move_used'
  | 'damage_dealt'
  | 'status_applied'
  | 'status_removed'
  | 'stat_changed'
  | 'switch'
  | 'faint'
  | 'item_used'
  | 'weather_change'
  | 'terrain_change'
  | 'ability_activated'
  | 'capture_attempt'
  | 'flee_attempt'
  | 'battle_end';

/**
 * Damage calculation input
 */
export interface DamageCalculationInput {
  attacker: BattleMonster;
  defender: BattleMonster;
  move: MoveData;
  attackerTypes: MonsterTypeValue[];
  defenderTypes: MonsterTypeValue[];
  weather: WeatherValue;
  terrain: TerrainValue;
  isCritical: boolean;
  randomFactor?: number;
}

/**
 * Move data for battle calculations
 */
export interface MoveData {
  name: string;
  type: MonsterTypeValue;
  category: MoveCategoryValue;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  effect?: string;
  effectChance?: number;
  target: string;
  flags?: MoveFlags;
}

/**
 * Move flags for special properties
 */
export interface MoveFlags {
  contact?: boolean;
  protect?: boolean;
  reflectable?: boolean;
  snatch?: boolean;
  mirror?: boolean;
  punch?: boolean;
  bite?: boolean;
  sound?: boolean;
  powder?: boolean;
  pulse?: boolean;
  ballistics?: boolean;
  mental?: boolean;
  dance?: boolean;
  heal?: boolean;
}

/**
 * Capture calculation input
 */
export interface CaptureCalculationInput {
  targetMonster: BattleMonster;
  ballType: string;
  targetTypes: MonsterTypeValue[];
  weather: WeatherValue;
  terrain: TerrainValue;
  turnCount: number;
}

/**
 * Capture result
 */
export interface CaptureResult {
  success: boolean;
  shakeCount: number; // 0-3 shakes before breaking out or capture
  catchRate: number; // The calculated catch rate
}

/**
 * AI decision for NPC/wild battles
 */
export interface AIDecision {
  action: BattleAction;
  priority: number;
  reasoning?: string;
}

/**
 * Battle rewards
 */
export interface BattleRewards {
  experience: number;
  currency: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  evs: Record<StatKeyValue, number>;
}

/**
 * Battle summary (for history/display)
 */
export interface BattleSummary {
  id: number;
  battleType: BattleTypeValue;
  status: BattleStatusValue;
  winnerId: number | null;
  participants: Array<{
    trainerId: number | null;
    trainerName: string;
    isPlayer: boolean;
    monstersUsed: number;
    monstersFainted: number;
  }>;
  totalTurns: number;
  duration: number; // in seconds
  rewards?: BattleRewards;
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Input for starting a battle
 */
export interface StartBattleInput {
  battleType: BattleTypeValue;
  participant1TrainerId: number;
  participant1MonsterIds: number[];
  participant2TrainerId?: number; // Null for wild battles
  participant2MonsterIds?: number[];
  wildMonsterId?: number;
  adventureId?: number;
  weather?: WeatherValue;
  terrain?: TerrainValue;
}

/**
 * Input for making a battle action
 */
export interface BattleActionInput {
  battleId: number;
  participantId: number;
  action: BattleAction;
}

/**
 * Speed comparison result for turn order
 */
export interface SpeedComparisonResult {
  monsterId: number;
  priority: number;
  speed: number;
  order: number;
}
