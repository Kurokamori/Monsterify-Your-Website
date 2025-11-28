const db = require('../config/db');
const { buildRandomLimit } = require('./dbUtils');

/**
 * Utility class for initializing monster data
 */
class MonsterInitializer {
  /**
   * Generate random IVs for a monster
   * @returns {Object} - Object containing IVs for each stat
   */
  static generateIVs() {
    return {
      hp_iv: Math.floor(Math.random() * 32),
      atk_iv: Math.floor(Math.random() * 32),
      def_iv: Math.floor(Math.random() * 32),
      spa_iv: Math.floor(Math.random() * 32),
      spd_iv: Math.floor(Math.random() * 32),
      spe_iv: Math.floor(Math.random() * 32)
    };
  }

  /**
   * Calculate stats for a monster based on level, IVs, and EVs
   * @param {number} level - Monster level
   * @param {Object} monster - Monster data with IVs and EVs
   * @returns {Object} - Object containing calculated stats
   */
  static calculateStats(level, monster) {
    // Base stats scale with level
    const baseValue = 20 + Math.floor(level * 2.5);

    // Get IVs and EVs, defaulting to 0 if not present
    const ivs = {
      hp: monster.hp_iv || 0,
      atk: monster.atk_iv || 0,
      def: monster.def_iv || 0,
      spa: monster.spa_iv || 0,
      spd: monster.spd_iv || 0,
      spe: monster.spe_iv || 0
    };

    const evs = {
      hp: monster.hp_ev || 0,
      atk: monster.atk_ev || 0,
      def: monster.def_ev || 0,
      spa: monster.spa_ev || 0,
      spd: monster.spd_ev || 0,
      spe: monster.spe_ev || 0
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
      spe_total: spe
    };
  }

  /**
   * Get stat modifiers based on nature
   * @param {string} nature - Monster nature
   * @returns {Object} - Object containing stat modifiers
   */
  static getNatureModifiers(nature) {
    // Default modifiers (neutral nature)
    const defaultModifiers = {
      atk: 1.0,
      def: 1.0,
      spa: 1.0,
      spd: 1.0,
      spe: 1.0
    };

    // Return default modifiers if nature is not set
    if (!nature) {
      return defaultModifiers;
    }

    // Nature modifiers
    const natureModifiers = {
      'Hardy': { ...defaultModifiers },
      'Lonely': { atk: 1.1, def: 0.9, spa: 1.0, spd: 1.0, spe: 1.0 },
      'Brave': { atk: 1.1, def: 1.0, spa: 1.0, spd: 1.0, spe: 0.9 },
      'Adamant': { atk: 1.1, def: 1.0, spa: 0.9, spd: 1.0, spe: 1.0 },
      'Naughty': { atk: 1.1, def: 1.0, spa: 1.0, spd: 0.9, spe: 1.0 },
      'Bold': { atk: 0.9, def: 1.1, spa: 1.0, spd: 1.0, spe: 1.0 },
      'Docile': { ...defaultModifiers },
      'Relaxed': { atk: 1.0, def: 1.1, spa: 1.0, spd: 1.0, spe: 0.9 },
      'Impish': { atk: 1.0, def: 1.1, spa: 0.9, spd: 1.0, spe: 1.0 },
      'Lax': { atk: 1.0, def: 1.1, spa: 1.0, spd: 0.9, spe: 1.0 },
      'Timid': { atk: 0.9, def: 1.0, spa: 1.0, spd: 1.0, spe: 1.1 },
      'Hasty': { atk: 1.0, def: 0.9, spa: 1.0, spd: 1.0, spe: 1.1 },
      'Serious': { ...defaultModifiers },
      'Jolly': { atk: 1.0, def: 1.0, spa: 0.9, spd: 1.0, spe: 1.1 },
      'Naive': { atk: 1.0, def: 1.0, spa: 1.0, spd: 0.9, spe: 1.1 },
      'Modest': { atk: 0.9, def: 1.0, spa: 1.1, spd: 1.0, spe: 1.0 },
      'Mild': { atk: 1.0, def: 0.9, spa: 1.1, spd: 1.0, spe: 1.0 },
      'Quiet': { atk: 1.0, def: 1.0, spa: 1.1, spd: 1.0, spe: 0.9 },
      'Bashful': { ...defaultModifiers },
      'Rash': { atk: 1.0, def: 1.0, spa: 1.1, spd: 0.9, spe: 1.0 },
      'Calm': { atk: 0.9, def: 1.0, spa: 1.0, spd: 1.1, spe: 1.0 },
      'Gentle': { atk: 1.0, def: 0.9, spa: 1.0, spd: 1.1, spe: 1.0 },
      'Sassy': { atk: 1.0, def: 1.0, spa: 1.0, spd: 1.1, spe: 0.9 },
      'Careful': { atk: 1.0, def: 1.0, spa: 0.9, spd: 1.1, spe: 1.0 },
      'Quirky': { ...defaultModifiers }
    };

    return natureModifiers[nature] || defaultModifiers;
  }

  /**
   * Generate a random nature for a monster
   * @returns {string} - Nature name
   */
  static generateNature() {
    const natures = [
      'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
      'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
      'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
      'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
      'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
    ];

    return natures[Math.floor(Math.random() * natures.length)];
  }

  /**
   * Generate a random characteristic for a monster
   * @returns {string} - Characteristic
   */
  static generateCharacteristic() {
    const characteristics = [
      'Loves to eat', 'Takes plenty of siestas', 'Nods off a lot',
      'Scatters things often', 'Likes to relax', 'Proud of its power',
      'Likes to thrash about', 'A little quick tempered', 'Likes to fight',
      'Quick tempered', 'Sturdy body', 'Capable of taking hits',
      'Highly persistent', 'Good endurance', 'Good perseverance',
      'Highly curious', 'Mischievous', 'Thoroughly cunning',
      'Often lost in thought', 'Very finicky', 'Strong willed',
      'Somewhat vain', 'Strongly defiant', 'Hates to lose',
      'Somewhat stubborn', 'Impetuous and silly', 'Alert to sounds',
      'Impetuous and silly', 'A little quick tempered', 'Likes to run',
      'Somewhat of a clown', 'Quick to flee'
    ];

    return characteristics[Math.floor(Math.random() * characteristics.length)];
  }

  /**
   * Generate a random gender for a monster
   * @returns {string} - Gender
   */
  static generateGender() {
    const genders = ['Male', 'Female', 'Non-binary', 'Genderless'];
    const weights = [45, 45, 5, 5]; // Weights for each gender (in percentage)

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < genders.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        return genders[i];
      }
    }

    return genders[0]; // Default to Male if something goes wrong
  }

  /**
   * Get random moves for a monster based on its types and attribute
   * @param {Object} monster - Monster data
   * @param {number} count - Number of moves to get
   * @returns {Promise<Array>} - Array of move names
   */
  static async getMovesForMonster(monster, count) {
    try {
      const moves = [];

      for (let i = 0; i < count; i++) {
        // Determine move source (type, attribute, or random)
        const randomValue = Math.random() * 100;

        let move;
        if (randomValue <= 85) {
          // 85% chance to get a move that shares a type with the monster
          const monsterTypes = [
            monster.type1,
            monster.type2,
            monster.type3,
            monster.type4,
            monster.type5
          ].filter(Boolean);

          // Randomly select one of the monster's types
          const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

          // Get a random move of that type
          const params = [randomType];
          let query = `SELECT "MoveName" FROM moves WHERE "Type" = $1`;
          query += buildRandomLimit(1, params);
          const typeMove = await db.asyncGet(query, params);

          if (typeMove) {
            move = typeMove.MoveName;
          }

          // If no moves found for this type, try attribute
          if (!move && monster.attribute) {
            const attrParams = [monster.attribute];
            let attributeQuery = `SELECT "MoveName" FROM moves WHERE "Attribute" = $1`;
            attributeQuery += buildRandomLimit(1, attrParams);
            const attributeMove = await db.asyncGet(attributeQuery, attrParams);

            if (attributeMove) {
              move = attributeMove.MoveName;
            }
          }
        } else if (randomValue <= 95 && monster.attribute) {
          // 10% chance to get a move that shares the monster's attribute
          const attrParams = [monster.attribute];
          let attributeQuery = `SELECT "MoveName" FROM moves WHERE "Attribute" = $1`;
          attributeQuery += buildRandomLimit(1, attrParams);
          const attributeMove = await db.asyncGet(attributeQuery, attrParams);

          if (attributeMove) {
            move = attributeMove.MoveName;
          }
        }

        // If still no move or 5% chance for completely random move
        if (!move) {
          const randParams = [];
          let randomQuery = `SELECT "MoveName" FROM moves`;
          randomQuery += buildRandomLimit(1, randParams);
          const randomMove = await db.asyncGet(randomQuery, randParams);

          if (randomMove) {
            move = randomMove.MoveName;
          } else {
            // Fallback to a basic move if no moves found in the database
            move = "Tackle";
          }
        }

        moves.push(move);
      }

      return moves;
    } catch (error) {
      console.error('Error getting moves for monster:', error);
      // Return at least some basic moves to prevent further errors
      return Array(count).fill("Tackle");
    }
  }

  /**
   * Get random abilities for a monster
   * @returns {Promise<Object>} - Object containing abilities
   */
  static async getRandomAbilities() {
    try {
      // Get two random abilities using the proper database abstraction
      const { buildRandomLimit } = require('./dbUtils');
      let query = `SELECT abilityname FROM abilities`;
      const params = [];
      query += buildRandomLimit(2, params);

      const abilities = await db.asyncAll(query, params);

      if (abilities.length === 0) {
        // Fallback if no abilities found
        console.error('No abilities found in database, using fallback');
        return {
          ability1: "Adaptability",
          ability2: "Run Away"
        };
      }

      return {
        ability1: abilities[0]?.abilityname || "Adaptability",
        ability2: abilities.length > 1 ? abilities[1]?.abilityname : "Run Away"
      };
    } catch (error) {
      console.error('Error getting random abilities:', error);
      // Return default abilities if there's an error
      return {
        ability1: "Adaptability",
        ability2: "Run Away"
      };
    }
  }

  /**
   * Initialize a monster with stats, moves, abilities, etc.
   * @param {number|Object} monsterIdOrData - Monster ID or monster data object
   * @returns {Promise<Object>} - Initialized monster data
   */
  static async initializeMonster(monsterIdOrData) {
    try {
      let monsterData;
      let monsterId = null;

      // Check if we received a monster ID or a monster data object
      if (typeof monsterIdOrData === 'number' || typeof monsterIdOrData === 'string') {
        // We received a monster ID, fetch the monster data from user's monsters table
        const Monster = require('../models/Monster');
        monsterId = parseInt(monsterIdOrData);

        if (isNaN(monsterId)) {
          throw new Error(`Invalid monster ID: ${monsterIdOrData}`);
        }

        monsterData = await Monster.getById(monsterId);

        if (!monsterData) {
          throw new Error(`Monster with ID ${monsterId} not found`);
        }
      } else {
        // We received a monster data object (for new monsters being created)
        monsterData = monsterIdOrData;
        // Don't set monsterId since this is a new monster, not an existing one
      }

      // Make a copy of the monster data
      const initializedMonster = { ...monsterData };

      // Generate IVs if not already set
      if (!initializedMonster.hp_iv) {
        const ivs = this.generateIVs();
        Object.assign(initializedMonster, ivs);
      }

      // Initialize EVs if not already set
      if (!initializedMonster.hp_ev) {
        initializedMonster.hp_ev = 0;
        initializedMonster.atk_ev = 0;
        initializedMonster.def_ev = 0;
        initializedMonster.spa_ev = 0;
        initializedMonster.spd_ev = 0;
        initializedMonster.spe_ev = 0;
      }

      // Calculate base stats based on level, IVs, and EVs
      const level = initializedMonster.level || 1;
      const baseStats = this.calculateStats(level, initializedMonster);
      Object.assign(initializedMonster, baseStats);

      // Generate nature and characteristic if not already set
      if (!initializedMonster.nature) {
        initializedMonster.nature = this.generateNature();
      }

      if (!initializedMonster.characteristic) {
        initializedMonster.characteristic = this.generateCharacteristic();
      }

      // Generate gender if not provided
      if (!initializedMonster.gender) {
        initializedMonster.gender = this.generateGender();
      }

      // Set initial friendship (0-70 random value) if not already set
      if (!initializedMonster.friendship) {
        initializedMonster.friendship = Math.floor(Math.random() * 71);
      }

      // Get random abilities if not already set
      if (!initializedMonster.ability1) {
        const abilities = await this.getRandomAbilities();
        initializedMonster.ability1 = abilities.ability1;
        initializedMonster.ability2 = abilities.ability2;
      }

      // Get moves based on level (1 move per 5 levels) if not already set
      // Also reinitialize if moveset is null or invalid
      let needsNewMoveset = !initializedMonster.moveset || initializedMonster.moveset === 'null';
      
      if (!needsNewMoveset) {
        try {
          const parsed = JSON.parse(initializedMonster.moveset);
          if (!Array.isArray(parsed)) {
            needsNewMoveset = true;
          }
        } catch (e) {
          needsNewMoveset = true;
        }
      }
      
      if (needsNewMoveset) {
        const moveCount = Math.max(1, Math.floor(level / 5) + 1);
        const moves = await this.getMovesForMonster(initializedMonster, moveCount);
        initializedMonster.moveset = JSON.stringify(moves);
      }

      // Set acquisition date if not already set
      if (!initializedMonster.date_met) {
        initializedMonster.date_met = new Date().toISOString().split('T')[0];
      }

      // Set where_met if not already set
      if (!initializedMonster.where_met) {
        initializedMonster.where_met = initializedMonster.where_met || "Adoption Center";
      }

      // If we received a monster ID, update the existing monster in the database
      if (monsterId) {
        const Monster = require('../models/Monster');
        await Monster.update(monsterId, initializedMonster);

        // Log successful initialization
        console.log(`Successfully initialized existing monster ${monsterId} with stats, abilities, and moves`);
      } else {
        // This is a new monster being created, just return the initialized data
        console.log(`Successfully initialized new monster data for: ${initializedMonster.name || initializedMonster.species1 || 'Unknown'}`);
      }

      return initializedMonster;
    } catch (error) {
      console.error('Error initializing monster:', error);
      throw error;
    }
  }

  /**
   * Level up a monster
   * @param {number} monsterId - Monster ID
   * @param {number} levels - Number of levels to add
   * @returns {Promise<Object>} - Updated monster data
   */
  static async levelUpMonster(monsterId, levels = 1) {
    try {
      if (levels <= 0) {
        throw new Error('Levels must be greater than 0');
      }

      // Get the monster data
      const Monster = require('../models/Monster');
      const monster = await Monster.getById(monsterId);

      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      console.log(`Leveling up monster ${monsterId} (${monster.name || 'Unnamed'}) by ${levels} level(s)`);

      // Make a copy of the monster data
      const updatedMonster = { ...monster };

      // Get current level and calculate new level
      const currentLevel = updatedMonster.level || 1;
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

      // Add EVs for each level gained (random distribution)
      const totalEVsToAdd = actualLevelsGained * 2; // 2 EVs per level
      const evStats = ['hp_ev', 'atk_ev', 'def_ev', 'spa_ev', 'spd_ev', 'spe_ev'];

      // Initialize EVs if they don't exist
      evStats.forEach(stat => {
        if (updatedMonster[stat] === undefined) {
          updatedMonster[stat] = 0;
        }
      });

      // Distribute EVs randomly
      for (let i = 0; i < totalEVsToAdd; i++) {
        const randomStat = evStats[Math.floor(Math.random() * evStats.length)];
        // Cap individual EVs at 255
        if (updatedMonster[randomStat] < 255) {
          updatedMonster[randomStat]++;
        }
      }

      // Increase friendship (capped at 255)
      const currentFriendship = updatedMonster.friendship || 0;
      const friendshipIncrease = Math.floor(Math.random() * 3) + 1; // 1-3 friendship per level
      updatedMonster.friendship = Math.min(currentFriendship + (friendshipIncrease * actualLevelsGained), 255);

      console.log(`Monster ${monsterId} friendship increased from ${currentFriendship} to ${updatedMonster.friendship}`);

      // Calculate new stats based on updated level, IVs, and EVs
      const newStats = this.calculateStats(newLevel, updatedMonster);
      Object.assign(updatedMonster, newStats);

      // Check for move learning (30% chance per level)
      // Safely parse moveset, defaulting to empty array if null/invalid
      let currentMoveset = [];
      try {
        if (updatedMonster.moveset && updatedMonster.moveset !== 'null') {
          const parsed = JSON.parse(updatedMonster.moveset);
          // Ensure it's an iterable array
          if (Array.isArray(parsed)) {
            currentMoveset = parsed;
          }
        }
      } catch (e) {
        console.warn(`Monster ${monsterId} had invalid moveset JSON, defaulting to empty array:`, e.message);
      }
      let newMoves = [...currentMoveset];
      let learnedNewMove = false;

      for (let i = 0; i < actualLevelsGained; i++) {
        // 30% chance to learn a new move
        if (Math.random() < 0.3) {
          // Determine move type
          const moveTypeRoll = Math.random() * 100;
          let moveType = 'random';

          if (moveTypeRoll < 10) {
            // 10% chance for normal move
            moveType = 'normal';
          } else if (moveTypeRoll < 70) {
            // 60% chance for move of monster's type
            moveType = 'type';
          } else if (moveTypeRoll < 95) {
            // 25% chance for move of monster's attribute
            moveType = 'attribute';
          }

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
      await Monster.update(monsterId, updatedMonster);

      console.log(`Successfully leveled up monster ${monsterId} to level ${newLevel}`);

      return updatedMonster;
    } catch (error) {
      console.error('Error leveling up monster:', error);
      throw error;
    }
  }

  /**
   * Get a new move for a monster based on specified type
   * @param {Object} monster - Monster data
   * @param {string} moveType - Type of move to get ('normal', 'type', 'attribute', or 'random')
   * @param {Array} currentMoves - Current moves of the monster
   * @param {number} maxAttempts - Maximum attempts to find a unique move
   * @returns {Promise<string>} - New move name
   */
  static async getNewMove(monster, moveType = 'random', currentMoves = [], maxAttempts = 10) {
    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let query = '';
        let params = [];

        switch (moveType) {
          case 'normal':
            // Get a normal-type move
            query = `SELECT "MoveName" FROM moves WHERE "Type" = 'normal'`;
            query += buildRandomLimit(1, params);
            break;

          case 'type':
            // Get a move that matches one of the monster's types
            const monsterTypes = [
              monster.type1,
              monster.type2,
              monster.type3,
              monster.type4,
              monster.type5
            ].filter(Boolean);

            if (monsterTypes.length === 0) {
              // Fallback to random move if no types
              moveType = 'random';
              continue;
            }

            // Randomly select one of the monster's types
            const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

            params.push(randomType);
            query = `SELECT "MoveName" FROM moves WHERE "Type" = $1`;
            query += buildRandomLimit(1, params);
            break;

          case 'attribute':
            // Get a move that matches the monster's attribute
            if (!monster.attribute) {
              // Fallback to random move if no attribute
              moveType = 'random';
              continue;
            }

            params.push(monster.attribute);
            query = `SELECT "MoveName" FROM moves WHERE "Attribute" = $1`;
            query += buildRandomLimit(1, params);
            break;

          case 'random':
          default:
            // Get a completely random move
            query = `SELECT "MoveName" FROM moves`;
            query += buildRandomLimit(1, params);
            break;
        }

        // Execute the query
        const move = await db.asyncGet(query, params);

        if (!move) {
          // If no move found, try with random type on next attempt
          moveType = 'random';
          continue;
        }

        // Check if the monster already knows this move
        if (!currentMoves.includes(move.MoveName)) {
          return move.MoveName;
        }

        // If we've tried the specific type and it's a duplicate, try random on next attempt
        if (moveType !== 'random') {
          moveType = 'random';
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
}

module.exports = MonsterInitializer;
