import { db } from '../database';
import {
  MonsterRepository,
  MonsterUpdateInput,
  AbilityRepository,
} from '../repositories';
import {
  NATURE_NAMES,
  getNatureModifiers as getUtilsNatureModifiers,
  getRandomNature,
  StatModifiers,
  ALL_CHARACTERISTICS,
  getRandomCharacteristic,
  GENDERS,
  generateRandomGender,
  GenderValue,
} from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type IVs = {
  hp_iv: number;
  atk_iv: number;
  def_iv: number;
  spa_iv: number;
  spd_iv: number;
  spe_iv: number;
};

export type EVs = {
  hp_ev: number;
  atk_ev: number;
  def_ev: number;
  spa_ev: number;
  spd_ev: number;
  spe_ev: number;
};

export type CalculatedStats = {
  hp_total: number;
  atk_total: number;
  def_total: number;
  spa_total: number;
  spd_total: number;
  spe_total: number;
};

export type MonsterData = {
  id?: number;
  trainer_id?: number;
  name?: string;
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level?: number;
  hp_iv?: number;
  atk_iv?: number;
  def_iv?: number;
  spa_iv?: number;
  spd_iv?: number;
  spe_iv?: number;
  hp_ev?: number;
  atk_ev?: number;
  def_ev?: number;
  spa_ev?: number;
  spd_ev?: number;
  spe_ev?: number;
  hp_total?: number;
  atk_total?: number;
  def_total?: number;
  spa_total?: number;
  spd_total?: number;
  spe_total?: number;
  nature?: string | null;
  characteristic?: string | null;
  gender?: string | null;
  friendship?: number;
  ability1?: string | null;
  ability2?: string | null;
  moveset?: string | string[] | null;
  date_met?: string | null;
  where_met?: string | null;
  [key: string]: unknown;
};

export type InitializedMonster = MonsterData & IVs & EVs & CalculatedStats;

export type MoveType = 'normal' | 'type' | 'attribute' | 'random';

// ============================================================================
// Constants
// ============================================================================

const EV_STATS = ['hp_ev', 'atk_ev', 'def_ev', 'spa_ev', 'spd_ev', 'spe_ev'] as const;

// ============================================================================
// Service
// ============================================================================

/**
 * Service for initializing monster data with stats, moves, abilities, etc.
 */
export class MonsterInitializerService {
  private monsterRepository: MonsterRepository;
  private abilityRepository: AbilityRepository;

  constructor(
    monsterRepository?: MonsterRepository,
    abilityRepository?: AbilityRepository
  ) {
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.abilityRepository = abilityRepository ?? new AbilityRepository();
  }

  // ==========================================================================
  // IV Generation
  // ==========================================================================

  /**
   * Generate random IVs for a monster (0-31 for each stat)
   * @returns Object containing IVs for each stat
   */
  generateIVs(): IVs {
    return {
      hp_iv: Math.floor(Math.random() * 32),
      atk_iv: Math.floor(Math.random() * 32),
      def_iv: Math.floor(Math.random() * 32),
      spa_iv: Math.floor(Math.random() * 32),
      spd_iv: Math.floor(Math.random() * 32),
      spe_iv: Math.floor(Math.random() * 32),
    };
  }

  // ==========================================================================
  // Stat Calculation
  // ==========================================================================

  /**
   * Calculate stats for a monster based on level, IVs, and EVs
   * Uses Pokemon-style stat formula
   * @param level - Monster level
   * @param monster - Monster data with IVs and EVs
   * @returns Object containing calculated stats
   */
  calculateStats(level: number, monster: MonsterData): CalculatedStats {
    // Base stats scale with level
    const baseValue = 20 + Math.floor(level * 2.5);

    // Get IVs and EVs, defaulting to 0 if not present
    const ivs = {
      hp: monster.hp_iv ?? 0,
      atk: monster.atk_iv ?? 0,
      def: monster.def_iv ?? 0,
      spa: monster.spa_iv ?? 0,
      spd: monster.spd_iv ?? 0,
      spe: monster.spe_iv ?? 0,
    };

    const evs = {
      hp: monster.hp_ev ?? 0,
      atk: monster.atk_ev ?? 0,
      def: monster.def_ev ?? 0,
      spa: monster.spa_ev ?? 0,
      spd: monster.spd_ev ?? 0,
      spe: monster.spe_ev ?? 0,
    };

    // Nature modifiers (default to 1.0 if nature not set)
    const natureModifiers = this.getNatureModifiers(monster.nature);

    // Calculate stats using formula: (2 * Base + IV + EV/4) * Level/100 + 5
    // HP formula is slightly different: (2 * Base + IV + EV/4) * Level/100 + Level + 10
    const hp = Math.floor(((2 * baseValue + ivs.hp + Math.floor(evs.hp / 4)) * level / 100) + level + 10);
    const atk = Math.floor((((2 * baseValue + ivs.atk + Math.floor(evs.atk / 4)) * level / 100) + 5) * natureModifiers.atk);
    const def = Math.floor((((2 * baseValue + ivs.def + Math.floor(evs.def / 4)) * level / 100) + 5) * natureModifiers.def);
    const spa = Math.floor((((2 * baseValue + ivs.spa + Math.floor(evs.spa / 4)) * level / 100) + 5) * natureModifiers.spa);
    const spd = Math.floor((((2 * baseValue + ivs.spd + Math.floor(evs.spd / 4)) * level / 100) + 5) * natureModifiers.spd);
    const spe = Math.floor((((2 * baseValue + ivs.spe + Math.floor(evs.spe / 4)) * level / 100) + 5) * natureModifiers.spe);

    return {
      hp_total: hp,
      atk_total: atk,
      def_total: def,
      spa_total: spa,
      spd_total: spd,
      spe_total: spe,
    };
  }

  // ==========================================================================
  // Nature System
  // ==========================================================================

  /**
   * Get stat modifiers based on nature
   * @param nature - Monster nature
   * @returns Object containing stat modifiers
   */
  getNatureModifiers(nature?: string | null): StatModifiers {
    return getUtilsNatureModifiers(nature ?? '');
  }

  /**
   * Generate a random nature for a monster
   * @returns Nature name
   */
  generateNature(): string {
    return getRandomNature();
  }

  // ==========================================================================
  // Characteristic Generation
  // ==========================================================================

  /**
   * Generate a random characteristic for a monster
   * @returns Characteristic string
   */
  generateCharacteristic(): string {
    return getRandomCharacteristic();
  }

  // ==========================================================================
  // Gender Generation
  // ==========================================================================

  /**
   * Generate a random gender for a monster
   * @returns Gender string
   */
  generateGender(): GenderValue {
    return generateRandomGender();
  }

  // ==========================================================================
  // Move System
  // ==========================================================================

  /**
   * Get random moves for a monster based on its types and attribute
   * @param monster - Monster data
   * @param count - Number of moves to get
   * @returns Array of move names
   */
  async getMovesForMonster(monster: MonsterData, count: number): Promise<string[]> {
    try {
      const moves: string[] = [];

      for (let i = 0; i < count; i++) {
        // Determine move source (type, attribute, or random)
        const randomValue = Math.random() * 100;

        let move: string | null = null;
        if (randomValue <= 85) {
          // 85% chance to get a move that shares a type with the monster
          const monsterTypes = [
            monster.type1,
            monster.type2,
            monster.type3,
            monster.type4,
            monster.type5,
          ].filter(Boolean) as string[];

          if (monsterTypes.length > 0) {
            // Randomly select one of the monster's types
            const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

            // Get a random move of that type
            const typeMove = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves WHERE "Type" = $1 ORDER BY RANDOM() LIMIT 1`,
              [randomType]
            );

            if (typeMove.rows[0]) {
              move = typeMove.rows[0].MoveName;
            }
          }

          // If no moves found for this type, try attribute
          if (!move && monster.attribute) {
            const attributeMove = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves WHERE "Attribute" = $1 ORDER BY RANDOM() LIMIT 1`,
              [monster.attribute]
            );

            if (attributeMove.rows[0]) {
              move = attributeMove.rows[0].MoveName;
            }
          }
        } else if (randomValue <= 95 && monster.attribute) {
          // 10% chance to get a move that shares the monster's attribute
          const attributeMove = await db.query<{ MoveName: string }>(
            `SELECT "MoveName" FROM moves WHERE "Attribute" = $1 ORDER BY RANDOM() LIMIT 1`,
            [monster.attribute]
          );

          if (attributeMove.rows[0]) {
            move = attributeMove.rows[0].MoveName;
          }
        }

        // If still no move or 5% chance for completely random move
        if (!move) {
          const randomMove = await db.query<{ MoveName: string }>(
            `SELECT "MoveName" FROM moves ORDER BY RANDOM() LIMIT 1`
          );

          if (randomMove.rows[0]) {
            move = randomMove.rows[0].MoveName;
          } else {
            // Fallback to a basic move if no moves found in the database
            move = 'Tackle';
          }
        }

        if (move) {
          moves.push(move);
        }
      }

      return moves;
    } catch (error) {
      console.error('Error getting moves for monster:', error);
      // Return at least some basic moves to prevent further errors
      return Array(count).fill('Tackle');
    }
  }

  /**
   * Get a new move for a monster based on specified type
   * @param monster - Monster data
   * @param moveType - Type of move to get ('normal', 'type', 'attribute', or 'random')
   * @param currentMoves - Current moves of the monster
   * @param maxAttempts - Maximum attempts to find a unique move
   * @returns New move name or null if none found
   */
  async getNewMove(
    monster: MonsterData,
    moveType: MoveType = 'random',
    currentMoves: string[] = [],
    maxAttempts = 10
  ): Promise<string | null> {
    try {
      let currentMoveType = moveType;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let move: { MoveName: string } | undefined;

        switch (currentMoveType) {
          case 'normal': {
            // Get a normal-type move
            const result = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves WHERE "Type" = 'normal' ORDER BY RANDOM() LIMIT 1`
            );
            move = result.rows[0];
            break;
          }

          case 'type': {
            // Get a move that matches one of the monster's types
            const monsterTypes = [
              monster.type1,
              monster.type2,
              monster.type3,
              monster.type4,
              monster.type5,
            ].filter(Boolean) as string[];

            if (monsterTypes.length === 0) {
              // Fallback to random move if no types
              currentMoveType = 'random';
              continue;
            }

            // Randomly select one of the monster's types
            const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

            const result = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves WHERE "Type" = $1 ORDER BY RANDOM() LIMIT 1`,
              [randomType]
            );
            move = result.rows[0];
            break;
          }

          case 'attribute': {
            // Get a move that matches the monster's attribute
            if (!monster.attribute) {
              // Fallback to random move if no attribute
              currentMoveType = 'random';
              continue;
            }

            const result = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves WHERE "Attribute" = $1 ORDER BY RANDOM() LIMIT 1`,
              [monster.attribute]
            );
            move = result.rows[0];
            break;
          }

          case 'random':
          default: {
            // Get a completely random move
            const result = await db.query<{ MoveName: string }>(
              `SELECT "MoveName" FROM moves ORDER BY RANDOM() LIMIT 1`
            );
            move = result.rows[0];
            break;
          }
        }

        if (!move) {
          // If no move found, try with random type on next attempt
          currentMoveType = 'random';
          continue;
        }

        // Check if the monster already knows this move
        if (!currentMoves.includes(move.MoveName)) {
          return move.MoveName;
        }

        // If we've tried the specific type and it's a duplicate, try random on next attempt
        if (currentMoveType !== 'random') {
          currentMoveType = 'random';
        }
      }

      // If all attempts failed, return a basic move (but only if not already known)
      if (!currentMoves.includes('Tackle')) {
        return 'Tackle';
      }

      // If even Tackle is known, return null to indicate no new move can be learned
      return null;
    } catch (error) {
      console.error('Error getting new move:', error);
      // Return a basic move if there's an error (but only if not already known)
      if (!currentMoves.includes('Tackle')) {
        return 'Tackle';
      }
      return null;
    }
  }

  // ==========================================================================
  // Ability System
  // ==========================================================================

  /**
   * Get random abilities for a monster
   * @returns Object containing abilities
   */
  async getRandomAbilities(): Promise<{ ability1: string; ability2: string }> {
    try {
      const abilities = await this.abilityRepository.findRandom(2);

      if (abilities.length === 0) {
        // Fallback if no abilities found
        console.error('No abilities found in database, using fallback');
        return {
          ability1: 'Adaptability',
          ability2: 'Run Away',
        };
      }

      return {
        ability1: abilities[0]?.name ?? 'Adaptability',
        ability2: (abilities.length > 1 ? abilities[1]?.name : undefined) ?? 'Run Away',
      };
    } catch (error) {
      console.error('Error getting random abilities:', error);
      // Return default abilities if there's an error
      return {
        ability1: 'Adaptability',
        ability2: 'Run Away',
      };
    }
  }

  // ==========================================================================
  // Full Monster Initialization
  // ==========================================================================

  /**
   * Initialize a monster with stats, moves, abilities, etc.
   * @param monsterIdOrData - Monster ID or monster data object
   * @returns Initialized monster data
   */
  async initializeMonster(monsterIdOrData: number | string | MonsterData): Promise<InitializedMonster> {
    try {
      let monsterData: MonsterData;
      let monsterId: number | null = null;

      // Check if we received a monster ID or a monster data object
      if (typeof monsterIdOrData === 'number' || typeof monsterIdOrData === 'string') {
        // We received a monster ID, fetch the monster data from database
        monsterId = parseInt(String(monsterIdOrData));

        if (isNaN(monsterId)) {
          throw new Error(`Invalid monster ID: ${monsterIdOrData}`);
        }

        const existingMonster = await this.monsterRepository.findById(monsterId);

        if (!existingMonster) {
          throw new Error(`Monster with ID ${monsterId} not found`);
        }

        monsterData = existingMonster as MonsterData;
      } else {
        // We received a monster data object (for new monsters being created)
        monsterData = monsterIdOrData;
        // Don't set monsterId since this is a new monster, not an existing one
      }

      // Make a copy of the monster data
      const initializedMonster: InitializedMonster = { ...monsterData } as InitializedMonster;

      // Generate IVs if not already set
      if (!initializedMonster.hp_iv) {
        const ivs = this.generateIVs();
        Object.assign(initializedMonster, ivs);
      }

      // Initialize EVs if not already set
      if (initializedMonster.hp_ev === undefined) {
        initializedMonster.hp_ev = 0;
        initializedMonster.atk_ev = 0;
        initializedMonster.def_ev = 0;
        initializedMonster.spa_ev = 0;
        initializedMonster.spd_ev = 0;
        initializedMonster.spe_ev = 0;
      }

      // Calculate base stats based on level, IVs, and EVs
      const level = initializedMonster.level ?? 1;
      const baseStats = this.calculateStats(level, initializedMonster);
      Object.assign(initializedMonster, baseStats);

      // Generate nature and characteristic if not already set
      initializedMonster.nature ??= this.generateNature();

      initializedMonster.characteristic ??= this.generateCharacteristic();

      // Generate gender if not provided
      initializedMonster.gender ??= this.generateGender();

      // Set initial friendship (0-70 random value) if not already set
      initializedMonster.friendship ??= Math.floor(Math.random() * 71);

      // Get random abilities if not already set
      if (!initializedMonster.ability1) {
        const abilities = await this.getRandomAbilities();
        initializedMonster.ability1 = abilities.ability1;
        initializedMonster.ability2 = abilities.ability2;
      }

      // Get moves based on level (1 move per 5 levels) if not already set
      // Also reinitialize if moveset is null or invalid
      let needsNewMoveset = !initializedMonster.moveset || initializedMonster.moveset === 'null';

      if (!needsNewMoveset && typeof initializedMonster.moveset === 'string') {
        try {
          const parsed = JSON.parse(initializedMonster.moveset);
          if (!Array.isArray(parsed)) {
            needsNewMoveset = true;
          }
        } catch {
          needsNewMoveset = true;
        }
      }

      if (needsNewMoveset) {
        const moveCount = Math.max(1, Math.floor(level / 5) + 1);
        const moves = await this.getMovesForMonster(initializedMonster, moveCount);
        initializedMonster.moveset = JSON.stringify(moves);
      }

      // Set acquisition date if not already set
      initializedMonster.date_met ??= new Date().toISOString().split('T')[0];

      // Set where_met if not already set
      initializedMonster.where_met ??= 'Adoption Center';

      // If we received a monster ID, update the existing monster in the database
      if (monsterId) {
        const updateInput = this.convertToUpdateInput(initializedMonster);
        await this.monsterRepository.update(monsterId, updateInput);

        // Log successful initialization
        console.log(`Successfully initialized existing monster ${monsterId} with stats, abilities, and moves`);
      } else {
        // This is a new monster being created, just return the initialized data
        console.log(`Successfully initialized new monster data for: ${initializedMonster.name ?? initializedMonster.species1 ?? 'Unknown'}`);
      }

      return initializedMonster;
    } catch (error) {
      console.error('Error initializing monster:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Level Up System
  // ==========================================================================

  /**
   * Weighted random: pick an index 0..weights.length-1 according to weights.
   * E.g. weightedRandom([10,35,25,15,10,5]) returns 0-5 biased toward 1.
   */
  private weightedRandom(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) { return i; }
    }
    return weights.length - 1;
  }

  /**
   * Level up a monster with full side-effects: friendship, EVs, stats, and move learning.
   * @param monsterId - Monster ID
   * @param levels - Number of levels to add
   * @returns Updated monster data
   */
  async levelUpMonster(monsterId: number, levels = 1): Promise<InitializedMonster> {
    try {
      if (levels <= 0) {
        throw new Error('Levels must be greater than 0');
      }

      // Get the monster data
      const monster = await this.monsterRepository.findById(monsterId);

      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      console.log(`Leveling up monster ${monsterId} (${monster.name || 'Unnamed'}) by ${levels} level(s)`);

      // Make a copy of the monster data
      const updatedMonster: InitializedMonster = { ...monster } as InitializedMonster;

      // Get current level and calculate new level
      const currentLevel = updatedMonster.level ?? 1;
      const newLevel = Math.min(currentLevel + levels, 100); // Cap at level 100

      // If already at max level, return early
      if (currentLevel >= 100) {
        console.log(`Monster ${monsterId} is already at max level (100)`);
        return updatedMonster;
      }

      // Calculate actual levels gained (accounting for level cap)
      const actualLevelsGained = newLevel - currentLevel;
      console.log(`Monster ${monsterId} will gain ${actualLevelsGained} level(s) (from ${currentLevel} to ${newLevel})`);

      // Update level
      updatedMonster.level = newLevel;

      // Initialize EVs if they don't exist
      EV_STATS.forEach((stat) => {
        updatedMonster[stat] ??= 0;
      });

      // Per-level friendship and EV gains using weighted random
      const friendshipWeights = [10, 35, 25, 15, 10, 5]; // 0-5 friendship
      const evWeights = [10, 35, 25, 15, 10, 5]; // 0-5 total EV points

      const currentFriendship = updatedMonster.friendship ?? 0;
      let totalFriendshipGain = 0;

      for (let lvl = 0; lvl < actualLevelsGained; lvl++) {
        // Friendship: 0-5 per level, weighted
        const friendshipGain = this.weightedRandom(friendshipWeights);
        totalFriendshipGain += friendshipGain;

        // EVs: 0-5 total points per level, dispersed randomly among 6 stats
        const evPointsThisLevel = this.weightedRandom(evWeights);
        for (let p = 0; p < evPointsThisLevel; p++) {
          const randomStatIndex = Math.floor(Math.random() * EV_STATS.length);
          const randomStat = EV_STATS[randomStatIndex];
          if (randomStat === undefined) { continue; }
          // Per-stat cap 252
          if ((updatedMonster[randomStat] as number) < 252) {
            (updatedMonster[randomStat] as number)++;
          }
        }
      }

      updatedMonster.friendship = Math.min(currentFriendship + totalFriendshipGain, 255);
      console.log(`Monster ${monsterId} friendship increased from ${currentFriendship} to ${updatedMonster.friendship}`);

      // Calculate new stats based on updated level, IVs, and EVs
      const newStats = this.calculateStats(newLevel, updatedMonster);
      Object.assign(updatedMonster, newStats);

      // Check for move learning (20% chance per level)
      // Safely parse moveset, defaulting to empty array if null/invalid
      let currentMoveset: string[] = [];
      try {
        if (updatedMonster.moveset && updatedMonster.moveset !== 'null') {
          const parsed = typeof updatedMonster.moveset === 'string'
            ? JSON.parse(updatedMonster.moveset)
            : updatedMonster.moveset;
          // Ensure it's an iterable array
          if (Array.isArray(parsed)) {
            currentMoveset = parsed;
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.warn(`Monster ${monsterId} had invalid moveset JSON, defaulting to empty array:`, errorMsg);
      }

      const newMoves = [...currentMoveset];
      let learnedNewMove = false;

      for (let i = 0; i < actualLevelsGained; i++) {
        // 20% chance to learn a new move per level
        if (Math.random() < 0.2) {
          // Determine move type: 65% type, 15% attribute, 10% normal, 10% random
          const moveTypeRoll = Math.random() * 100;
          let moveType: MoveType = 'random';

          if (moveTypeRoll < 65) {
            moveType = 'type';
          } else if (moveTypeRoll < 80) {
            moveType = 'attribute';
          } else if (moveTypeRoll < 90) {
            moveType = 'normal';
          }
          // else: 10% random (default)

          // Get a move based on the determined type
          const newMove = await this.getNewMove(updatedMonster, moveType, newMoves);

          if (newMove) {
            newMoves.push(newMove);
            learnedNewMove = true;
            console.log(`Monster ${monsterId} learned new move: ${newMove}`);
          }
        }
      }

      // Update moveset if new moves were learned
      if (learnedNewMove) {
        updatedMonster.moveset = JSON.stringify(newMoves);
      }

      // Update the monster in the database
      const updateInput = this.convertToUpdateInput(updatedMonster);
      await this.monsterRepository.update(monsterId, updateInput);

      console.log(`Successfully leveled up monster ${monsterId} to level ${newLevel}`);

      return updatedMonster;
    } catch (error) {
      console.error('Error leveling up monster:', error);
      throw error;
    }
  }

  /**
   * Recalculate stats for a monster at its current level/IVs/EVs and update the DB.
   */
  async recalculateStats(monsterId: number): Promise<InitializedMonster> {
    const monster = await this.monsterRepository.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    const updatedMonster: InitializedMonster = { ...monster } as InitializedMonster;
    const level = updatedMonster.level ?? 1;
    const newStats = this.calculateStats(level, updatedMonster);
    Object.assign(updatedMonster, newStats);

    const updateInput = this.convertToUpdateInput(updatedMonster);
    await this.monsterRepository.update(monsterId, updateInput);

    return updatedMonster;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Convert monster data to update input format
   * @param monster - Monster data
   * @returns Update input
   */
  private convertToUpdateInput(monster: InitializedMonster): MonsterUpdateInput {
    const moveset = typeof monster.moveset === 'string'
      ? JSON.parse(monster.moveset)
      : monster.moveset;

    return {
      name: monster.name,
      level: monster.level,
      hpTotal: monster.hp_total,
      hpIv: monster.hp_iv,
      hpEv: monster.hp_ev,
      atkTotal: monster.atk_total,
      atkIv: monster.atk_iv,
      atkEv: monster.atk_ev,
      defTotal: monster.def_total,
      defIv: monster.def_iv,
      defEv: monster.def_ev,
      spaTotal: monster.spa_total,
      spaIv: monster.spa_iv,
      spaEv: monster.spa_ev,
      spdTotal: monster.spd_total,
      spdIv: monster.spd_iv,
      spdEv: monster.spd_ev,
      speTotal: monster.spe_total,
      speIv: monster.spe_iv,
      speEv: monster.spe_ev,
      nature: monster.nature,
      characteristic: monster.characteristic,
      gender: monster.gender,
      friendship: monster.friendship,
      ability1: monster.ability1,
      ability2: monster.ability2,
      moveset: Array.isArray(moveset) ? moveset : [],
      whereMet: monster.where_met,
    };
  }

  /**
   * Get all available natures
   * @returns Array of nature names
   */
  getAllNatures(): readonly string[] {
    return NATURE_NAMES;
  }

  /**
   * Get all available characteristics
   * @returns Array of characteristics
   */
  getAllCharacteristics(): readonly string[] {
    return ALL_CHARACTERISTICS;
  }

  /**
   * Get all available genders
   * @returns Array of genders
   */
  getAllGenders(): readonly GenderValue[] {
    return GENDERS;
  }

  /**
   * Check if a nature is valid
   * @param nature - Nature to check
   * @returns Whether the nature is valid
   */
  isValidNature(nature: string): boolean {
    return NATURE_NAMES.includes(nature);
  }
}
