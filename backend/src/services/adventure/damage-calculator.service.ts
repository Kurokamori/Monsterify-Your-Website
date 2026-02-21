import { MoveRepository, Move } from '../../repositories/move.repository';
import {
  calculateTypeEffectiveness,
  MonsterTypeValue,
  normalizeMonsterType,
} from '../../utils/constants/monster-types';
import { StatusMoveService } from './status-move.service';
import { isStatusMove } from '../../utils/constants/monster-status-moves';

// ============================================================================
// Types
// ============================================================================

export type MonsterData = Record<string, unknown> & {
  name?: string;
  level?: number;
  attack?: number;
  defense?: number;
  sp_attack?: number;
  sp_defense?: number;
  speed?: number;
  hp?: number;
  max_hp?: number;
  current_hp?: number;
  atk_total?: number;
  def_total?: number;
  spa_total?: number;
  spd_total?: number;
  spe_total?: number;
  hp_total?: number;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  monster_data?: {
    type1?: string;
    type2?: string;
    type3?: string;
    type4?: string;
    type5?: string;
  };
  stat_modifications?: Record<string, number>;
};

export type MoveData = {
  move_name?: string;
  moveName?: string;
  power?: number | null;
  accuracy?: number | null;
  move_type?: string;
  type?: string;
  MoveType?: string;
  move_category?: string;
  effect_chance?: number;
  description?: string;
  effect?: string;
};

export type DamageCalculationOptions = {
  isCritical?: boolean;
  weather?: WeatherType | null;
  terrain?: TerrainType | null;
  customMultiplier?: number;
  battleId?: number | null;
};

export type DamageResult = {
  damage: number;
  hits: boolean;
  isCritical: boolean;
  effectiveness: number;
  stabMultiplier?: number;
  accuracy?: number;
  message: string;
  moveData?: MoveData;
  isSpecialDamageMove?: boolean;
  specialMoveConfig?: unknown;
  proceedWithDamage?: boolean;
  requiresSwitchOut?: boolean;
};

export type HealingResult = {
  healAmount: number;
  newHp: number;
  message: string;
};

export type StatusEffectType =
  | 'burn'
  | 'poison'
  | 'paralysis'
  | 'sleep'
  | 'freeze'
  | 'confusion'
  | 'flinch'
  | 'unknown';

export type StatusEffect = {
  type: StatusEffectType;
  duration: number;
};

export type StatusEffectResult = {
  applied: boolean;
  effect?: StatusEffect;
  message?: string;
};

export type StatusDamageResult = {
  damage: number;
  message: string;
  shouldRemove: boolean;
};

export type WeatherType =
  | 'clear'
  | 'rain'
  | 'sunny'
  | 'sandstorm'
  | 'hail'
  | 'snow'
  | 'fog';

export type TerrainType =
  | 'normal'
  | 'electric'
  | 'grassy'
  | 'misty'
  | 'psychic';

export type WeatherDamageResult = {
  damage: number;
  message: string;
};

export type HealingItem = {
  heal_amount?: number;
  heal_percentage?: number;
};

// ============================================================================
// Constants
// ============================================================================

const CRITICAL_CHANCE = 0.0625; // 1/16 chance
const CRITICAL_MULTIPLIER = 1.5;
const STAB_MULTIPLIER = 1.5; // Same Type Attack Bonus
const RANDOM_FACTOR_MIN = 0.85;
const RANDOM_FACTOR_MAX = 1.0;

// Stat name mappings for different field formats
const STAT_MAPPING: Record<string, string[]> = {
  attack: ['attack', 'atk_total', 'atk'],
  defense: ['defense', 'def_total', 'def'],
  special_attack: ['sp_attack', 'spa_total', 'spa', 'special_attack'],
  special_defense: ['sp_defense', 'spd_total', 'spd', 'special_defense'],
  speed: ['speed', 'spe_total', 'spe'],
  hp: ['hp', 'hp_total'],
};

// ============================================================================
// Service
// ============================================================================

/**
 * DamageCalculator service for calculating battle damage and effects
 */
export class DamageCalculatorService {
  private moveRepository: MoveRepository;
  private statusMoveService: StatusMoveService | null;

  constructor(moveRepository?: MoveRepository, statusMoveService?: StatusMoveService) {
    this.moveRepository = moveRepository ?? new MoveRepository();
    this.statusMoveService = statusMoveService ?? null;
  }

  /**
   * Set the StatusMoveService (for dependency injection)
   */
  setStatusMoveService(service: StatusMoveService): void {
    this.statusMoveService = service;
  }

  /**
   * Calculate damage for an attack
   */
  async calculateDamage(
    attacker: MonsterData,
    defender: MonsterData,
    move: MoveData | string,
    options: DamageCalculationOptions = {}
  ): Promise<DamageResult> {
    const {
      isCritical = this.rollCritical(),
      weather = null,
      terrain = null,
      customMultiplier = 1.0,
      battleId = null,
    } = options;

    // Get move data if move name is provided
    let moveData: MoveData;
    if (typeof move === 'string') {
      const foundMove = await this.moveRepository.findByName(move);
      if (!foundMove) {
        throw new Error(`Move ${move} not found`);
      }
      moveData = this.convertMoveToMoveData(foundMove);
    } else {
      moveData = move;
    }

    const moveName = moveData.move_name ?? moveData.moveName ?? 'Unknown Move';

    // Check if this is a status move first (if StatusMoveService is available)
    if (this.statusMoveService && isStatusMove(moveName)) {
      const statusMoveResult = await this.processStatusMove(moveData, attacker, defender, battleId);

      if (statusMoveResult && !statusMoveResult.proceedWithDamage) {
        // This is a pure status move, return the status move result
        return statusMoveResult as DamageResult;
      }

      // Check if status move returned null - fallback to 50 power attack
      if (statusMoveResult === null) {
        console.log(`Status move "${moveName}" fell back to 50 power attack`);
        moveData = {
          ...moveData,
          power: 50,
          move_category: moveData.move_category ?? 'Physical',
        };
      }
    }

    // Calculate weather and terrain modifiers
    const weatherModifier = this.calculateWeatherModifier(moveData, weather);
    const terrainModifier = this.calculateTerrainModifier(moveData, terrain);

    // Check if move hits
    const accuracy = this.calculateAccuracy(attacker, defender, moveData);
    const hits = Math.random() * 100 <= accuracy;

    if (!hits) {
      return {
        damage: 0,
        hits: false,
        isCritical: false,
        effectiveness: 1.0,
        message: `${attacker.name ?? 'Attacker'}'s ${moveName} missed!`,
      };
    }

    // Calculate base damage using physical/special split
    let damage = this.calculateBaseDamage(attacker, defender, moveData, isCritical);

    // Apply type effectiveness
    const effectiveness = this.calculateTypeEffectiveness(moveData, defender);
    damage *= effectiveness;

    // Apply STAB (Same Type Attack Bonus)
    const stabMultiplier = this.calculateSTAB(attacker, moveData);
    damage *= stabMultiplier;

    // Apply weather, terrain, and custom modifiers
    damage *= weatherModifier;
    damage *= terrainModifier;
    damage *= customMultiplier;

    // Apply random factor
    const randomFactor =
      RANDOM_FACTOR_MIN + Math.random() * (RANDOM_FACTOR_MAX - RANDOM_FACTOR_MIN);
    damage *= randomFactor;

    // Round damage
    damage = Math.max(1, Math.floor(damage));

    // Generate damage message
    const message = this.generateDamageMessage(attacker, defender, moveData, {
      damage,
      isCritical,
      effectiveness,
      hasStab: stabMultiplier > 1,
    });

    return {
      damage,
      hits: true,
      isCritical,
      effectiveness,
      stabMultiplier,
      accuracy,
      message,
      moveData,
      isSpecialDamageMove: false,
      specialMoveConfig: null,
    };
  }

  /**
   * Process a status move through StatusMoveService
   */
  private async processStatusMove(
    _moveData: MoveData,
    _attacker: MonsterData,
    _defender: MonsterData,
    _battleId: number | null
  ): Promise<DamageResult | null> {
    if (!this.statusMoveService) {
      return null;
    }

    // TODO: Integrate with StatusMoveService when fully implemented
    // For now, return null to indicate fallback to normal damage
    return null;
  }

  /**
   * Calculate base damage using the damage formula
   */
  calculateBaseDamage(
    attacker: MonsterData,
    defender: MonsterData,
    move: MoveData,
    isCritical: boolean
  ): number {
    const level = attacker.level ?? 1;
    const power = move.power ?? 40;

    // Handle status moves (power 0 or null)
    if (!power || power === 0) {
      return 0;
    }

    // Determine if move is physical, special, or status
    const moveType = move.MoveType ?? move.move_category ?? 'Unknown';

    let attack: number;
    let defense: number;

    if (moveType.toLowerCase() === 'physical') {
      attack = this.getEffectiveStat(attacker, 'attack');
      defense = this.getEffectiveStat(defender, 'defense');
    } else if (moveType.toLowerCase() === 'special') {
      attack = this.getEffectiveStat(attacker, 'special_attack');
      defense = this.getEffectiveStat(defender, 'special_defense');
    } else {
      // Unknown: randomly choose physical or special
      const usePhysical = Math.random() < 0.5;
      if (usePhysical) {
        attack = this.getEffectiveStat(attacker, 'attack');
        defense = this.getEffectiveStat(defender, 'defense');
      } else {
        attack = this.getEffectiveStat(attacker, 'special_attack');
        defense = this.getEffectiveStat(defender, 'special_defense');
      }
    }

    // Pokemon damage formula
    // Damage = ((((2 * Level / 5 + 2) * Attack * Power / Defense) / 50) + 2) * Modifiers
    const levelFactor = (2 * level) / 5 + 2;
    const baseDamage = (((levelFactor * attack * power) / defense) / 50) + 2;

    // Apply critical hit modifier
    const criticalMultiplier = isCritical ? CRITICAL_MULTIPLIER : 1;

    return Math.floor(baseDamage * criticalMultiplier);
  }

  /**
   * Get effective stat value including stat modifications
   */
  getEffectiveStat(monster: MonsterData, statName: string): number {
    // Get base stat value
    let baseStat = 50; // Default value
    const possibleFields = STAT_MAPPING[statName] ?? [statName];

    for (const field of possibleFields) {
      const value = monster[field];
      if (value !== undefined && value !== null && typeof value === 'number') {
        baseStat = value;
        break;
      }
    }

    // Apply stat modifications if they exist
    const statModifications = monster.stat_modifications ?? {};
    const modification = statModifications[statName] ?? 0;

    // Calculate stat multiplier based on modification stages
    // Pokemon stat stages: +1 = 1.5x, +2 = 2.0x, +3 = 2.5x, +4 = 3.0x, +5 = 3.5x, +6 = 4.0x
    // -1 = 0.67x, -2 = 0.5x, -3 = 0.4x, -4 = 0.33x, -5 = 0.29x, -6 = 0.25x
    let multiplier = 1.0;
    if (modification > 0) {
      multiplier = (2 + modification) / 2;
    } else if (modification < 0) {
      multiplier = 2 / (2 + Math.abs(modification));
    }

    return Math.max(1, Math.floor(baseStat * multiplier));
  }

  /**
   * Calculate type effectiveness
   */
  calculateTypeEffectiveness(move: MoveData, defender: MonsterData): number {
    const moveType = move.move_type ?? move.type;
    if (!moveType) {
      return 1.0;
    }

    const normalizedMoveType = normalizeMonsterType(moveType);
    if (!normalizedMoveType) {
      return 1.0;
    }

    const defenderTypes = this.getMonsterTypes(defender);
    const normalizedDefenderTypes = defenderTypes
      .map((t) => normalizeMonsterType(t))
      .filter((t): t is MonsterTypeValue => t !== null);

    return calculateTypeEffectiveness(normalizedMoveType, normalizedDefenderTypes);
  }

  /**
   * Calculate STAB (Same Type Attack Bonus)
   */
  calculateSTAB(attacker: MonsterData, move: MoveData): number {
    const moveType = move.move_type ?? move.type;
    if (!moveType) {
      return 1.0;
    }

    const attackerTypes = this.getMonsterTypes(attacker);

    // Check if move type matches any of the attacker's types (case-insensitive)
    const moveTypeLower = moveType.toLowerCase();
    if (attackerTypes.some((t) => t.toLowerCase() === moveTypeLower)) {
      return STAB_MULTIPLIER;
    }

    return 1.0;
  }

  /**
   * Get monster types as array
   */
  getMonsterTypes(monster: MonsterData): string[] {
    const types: string[] = [];

    // Handle direct type fields
    if (monster.type1) {
      types.push(monster.type1);
    }
    if (monster.type2) {
      types.push(monster.type2);
    }
    if (monster.type3) {
      types.push(monster.type3);
    }
    if (monster.type4) {
      types.push(monster.type4);
    }
    if (monster.type5) {
      types.push(monster.type5);
    }

    // Handle monster_data nested structure
    if (monster.monster_data) {
      const data = monster.monster_data;
      if (data.type1) {
        types.push(data.type1);
      }
      if (data.type2) {
        types.push(data.type2);
      }
      if (data.type3) {
        types.push(data.type3);
      }
      if (data.type4) {
        types.push(data.type4);
      }
      if (data.type5) {
        types.push(data.type5);
      }
    }

    // Filter out empty/null types
    return types.filter((type) => type && type.trim() !== '');
  }

  /**
   * Calculate move accuracy
   */
  calculateAccuracy(_attacker: MonsterData, _defender: MonsterData, move: MoveData): number {
    const accuracy = move.accuracy ?? 100;
    return Math.min(100, Math.max(0, accuracy));
  }

  /**
   * Roll for critical hit
   */
  rollCritical(_attacker: MonsterData | null = null): boolean {
    const critChance = CRITICAL_CHANCE;
    // Future: Add modifiers based on attacker's stats, items, abilities
    return Math.random() < critChance;
  }

  /**
   * Generate damage message
   */
  generateDamageMessage(
    attacker: MonsterData,
    defender: MonsterData,
    move: MoveData,
    result: { damage: number; isCritical: boolean; effectiveness: number; hasStab: boolean }
  ): string {
    const attackerName = attacker.name ?? 'Attacker';
    const defenderName = defender.name ?? 'Defender';
    const moveName = move.move_name ?? move.moveName ?? 'Unknown Move';
    const { damage, isCritical, effectiveness } = result;

    let message = `${attackerName} used **${moveName}**!`;

    if (isCritical) {
      message += '\n💥 **Critical hit!**';
    }

    if (effectiveness > 1) {
      message += "\n✨ **It's super effective!**";
    } else if (effectiveness < 1 && effectiveness > 0) {
      message += "\n🛡️ **It's not very effective...**";
    } else if (effectiveness === 0) {
      message += '\n❌ **It had no effect!**';
    }

    message += `\n💔 **${defenderName}** took **${damage}** damage!`;

    return message;
  }

  /**
   * Calculate healing amount
   */
  calculateHealing(target: MonsterData, item: HealingItem): HealingResult {
    let healAmount = 0;
    const maxHp = target.max_hp ?? target.hp ?? 100;
    const currentHp = target.current_hp ?? maxHp;

    if (item.heal_amount) {
      healAmount = item.heal_amount;
    } else if (item.heal_percentage) {
      healAmount = Math.floor(maxHp * (item.heal_percentage / 100));
    } else {
      healAmount = Math.floor(maxHp * 0.2); // Default 20% heal
    }

    // Ensure we don't overheal
    const actualHeal = Math.min(healAmount, maxHp - currentHp);

    return {
      healAmount: actualHeal,
      newHp: currentHp + actualHeal,
      message: `${target.name ?? 'Target'} recovered ${actualHeal} HP!`,
    };
  }

  /**
   * Calculate status effect application
   */
  calculateStatusEffect(
    _attacker: MonsterData,
    _defender: MonsterData,
    move: MoveData
  ): StatusEffectResult {
    const moveName = move.move_name ?? move.moveName ?? '';

    // Check if this is a status move handled by StatusMoveService
    if (isStatusMove(moveName)) {
      // Status moves handle their own effects
      return { applied: false };
    }

    // Check for explicit move-based status effects first
    const explicitEffect = this.checkExplicitStatusEffect(move);
    if (explicitEffect.applied) {
      return explicitEffect;
    }

    return { applied: false };
  }

  /**
   * Check for explicit status effects from move data
   */
  checkExplicitStatusEffect(move: MoveData): StatusEffectResult {
    const effectChance = move.effect_chance ?? 0;

    if (effectChance === 0) {
      return { applied: false };
    }

    const roll = Math.random() * 100;
    const applied = roll <= effectChance;

    if (!applied) {
      return { applied: false };
    }

    // Parse effect from move description
    const effect = this.parseStatusEffect(move.description ?? move.effect);

    // Don't apply unknown effects
    if (effect.type === 'unknown') {
      return { applied: false };
    }

    return {
      applied: true,
      effect,
      message: `Target was affected by ${effect.type}!`,
    };
  }

  /**
   * Parse status effect from move description
   */
  parseStatusEffect(description: string | undefined): StatusEffect {
    if (!description) {
      return { type: 'unknown', duration: 1 };
    }

    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('burn')) {
      return { type: 'burn', duration: 3 };
    } else if (lowerDesc.includes('poison')) {
      return { type: 'poison', duration: 3 };
    } else if (lowerDesc.includes('paralyze') || lowerDesc.includes('paralysis')) {
      return { type: 'paralysis', duration: 3 };
    } else if (lowerDesc.includes('sleep')) {
      return { type: 'sleep', duration: 2 };
    } else if (lowerDesc.includes('freeze')) {
      return { type: 'freeze', duration: 2 };
    } else if (lowerDesc.includes('confus')) {
      return { type: 'confusion', duration: 3 };
    } else if (lowerDesc.includes('flinch')) {
      return { type: 'flinch', duration: 1 };
    }

    return { type: 'unknown', duration: 1 };
  }

  /**
   * Apply status effect damage
   */
  calculateStatusDamage(monster: MonsterData, statusEffect: StatusEffect): StatusDamageResult {
    let damage = 0;
    let message = '';
    const maxHp = monster.max_hp ?? monster.hp ?? 100;
    const name = monster.name ?? 'Monster';

    switch (statusEffect.type) {
      case 'burn':
        damage = Math.floor(maxHp / 16); // 1/16 of max HP
        message = `${name} is hurt by its burn!`;
        break;
      case 'poison':
        damage = Math.floor(maxHp / 8); // 1/8 of max HP
        message = `${name} is hurt by poison!`;
        break;
      default:
        damage = 0;
    }

    damage = Math.max(1, damage); // Minimum 1 damage

    return {
      damage,
      message,
      shouldRemove: statusEffect.duration <= 1,
    };
  }

  /**
   * Calculate weather modifier for damage
   */
  calculateWeatherModifier(move: MoveData, weather: WeatherType | null): number {
    if (!weather || weather === 'clear') {
      return 1.0;
    }

    const moveType = move.move_type ?? move.type;
    if (!moveType) {
      return 1.0;
    }

    switch (weather) {
      case 'rain':
        if (moveType === 'Water') {
          return 1.5;
        }
        if (moveType === 'Fire') {
          return 0.5;
        }
        break;
      case 'sunny':
        if (moveType === 'Fire') {
          return 1.5;
        }
        if (moveType === 'Water') {
          return 0.5;
        }
        break;
      case 'snow':
        if (moveType === 'Ice') {
          return 1.2;
        }
        break;
    }

    return 1.0;
  }

  /**
   * Calculate terrain modifier for damage
   */
  calculateTerrainModifier(move: MoveData, terrain: TerrainType | null): number {
    if (!terrain || terrain === 'normal') {
      return 1.0;
    }

    const moveType = move.move_type ?? move.type;
    if (!moveType) {
      return 1.0;
    }

    switch (terrain) {
      case 'electric':
        if (moveType === 'Electric') {
          return 1.3;
        }
        break;
      case 'grassy':
        if (moveType === 'Grass') {
          return 1.3;
        }
        break;
      case 'misty':
        if (moveType === 'Fairy') {
          return 1.3;
        }
        break;
      case 'psychic':
        if (moveType === 'Psychic') {
          return 1.3;
        }
        break;
    }

    return 1.0;
  }

  /**
   * Calculate weather accuracy modifier
   */
  calculateWeatherAccuracyModifier(_move: MoveData, weather: WeatherType | null): number {
    if (!weather || weather === 'clear') {
      return 1.0;
    }

    switch (weather) {
      case 'sandstorm':
        return 0.8; // Reduced accuracy in sandstorm
      case 'hail':
        return 0.9; // Slightly reduced accuracy in hail
      case 'fog':
        return 0.6; // Significantly reduced accuracy in fog
    }

    return 1.0;
  }

  /**
   * Get weather status damage
   */
  calculateWeatherDamage(monster: MonsterData, weather: WeatherType): WeatherDamageResult {
    let damage = 0;
    let message = '';
    const maxHp = monster.max_hp ?? monster.hp ?? 100;
    const name = monster.name ?? 'Monster';

    const monsterTypes = this.getMonsterTypes(monster);

    switch (weather) {
      case 'sandstorm':
        // Damages non-Rock/Ground/Steel types
        if (
          !monsterTypes.includes('Rock') &&
          !monsterTypes.includes('Ground') &&
          !monsterTypes.includes('Steel')
        ) {
          damage = Math.floor(maxHp / 16);
          message = `${name} is buffeted by the sandstorm!`;
        }
        break;
      case 'hail':
        // Damages non-Ice types
        if (!monsterTypes.includes('Ice')) {
          damage = Math.floor(maxHp / 16);
          message = `${name} is pelted by hail!`;
        }
        break;
    }

    return {
      damage: Math.max(0, damage),
      message,
    };
  }

  /**
   * Convert a Move (from repository) to MoveData format
   */
  private convertMoveToMoveData(move: Move): MoveData {
    return {
      move_name: move.moveName,
      moveName: move.moveName,
      power: move.power,
      accuracy: move.accuracy,
      move_type: move.moveType,
      type: move.moveType,
      MoveType: move.moveCategory ?? undefined,
      move_category: move.moveCategory ?? undefined,
      effect_chance: move.effectChance ?? undefined,
      description: move.description ?? undefined,
    };
  }
}

// Export a factory function for creating the service
export function createDamageCalculatorService(
  moveRepository?: MoveRepository,
  statusMoveService?: StatusMoveService
): DamageCalculatorService {
  return new DamageCalculatorService(moveRepository, statusMoveService);
}
