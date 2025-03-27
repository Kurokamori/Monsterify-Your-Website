const Move = require('../models/Move');

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
   * Calculate base stats for a monster
   * @param {number} level - Monster level
   * @returns {Object} - Object containing base stats
   */
  static calculateBaseStats(level) {
    // Base stats scale with level
    const baseValue = 20 + Math.floor(level * 2.5);

    return {
      hp_total: baseValue + Math.floor(Math.random() * 10),
      atk_total: baseValue + Math.floor(Math.random() * 10),
      def_total: baseValue + Math.floor(Math.random() * 10),
      spa_total: baseValue + Math.floor(Math.random() * 10),
      spd_total: baseValue + Math.floor(Math.random() * 10),
      spe_total: baseValue + Math.floor(Math.random() * 10)
    };
  }

  /**
   * Initialize EVs for a monster (all start at 0)
   * @returns {Object} - Object containing EVs for each stat
   */
  static initializeEVs() {
    return {
      hp_ev: 0,
      atk_ev: 0,
      def_ev: 0,
      spa_ev: 0,
      spd_ev: 0,
      spe_ev: 0
    };
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
   * @returns {string} - Characteristic description
   */
  static generateCharacteristic() {
    const characteristics = [
      'Loves to eat', 'Takes plenty of siestas', 'Nods off a lot', 'Scatters things often',
      'Likes to relax', 'Proud of its power', 'Likes to thrash about', 'A little quick tempered',
      'Likes to fight', 'Quick tempered', 'Sturdy body', 'Capable of taking hits',
      'Highly persistent', 'Good endurance', 'Good perseverance', 'Highly curious',
      'Mischievous', 'Thoroughly cunning', 'Often lost in thought', 'Very finicky',
      'Strong willed', 'Somewhat vain', 'Strongly defiant', 'Hates to lose',
      'Somewhat stubborn', 'Impetuous and silly', 'Alert to sounds', 'Impetuous and silly',
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
   * Get random moves for a monster
   * @param {Object} monster - Monster data
   * @param {number} count - Number of moves to get
   * @returns {Promise<Array>} - Array of move names
   */
  static async getMovesForMonster(monster, count) {
    try {
      console.log('Getting moves for monster:', monster);
      console.log('Number of moves to get:', count);
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
          const typeMovesResult = await Move.getRandomByType(randomType, 1);
          move = typeMovesResult[0];

          // If no moves found for this type, try attribute
          if (!move && monster.attribute) {
            const attributeMovesResult = await Move.getRandomByAttribute(monster.attribute, 1);
            move = attributeMovesResult[0];
          }
        } else if (randomValue <= 95 && monster.attribute) {
          // 10% chance to get a move that shares the monster's attribute
          const attributeMovesResult = await Move.getRandomByAttribute(monster.attribute, 1);
          move = attributeMovesResult[0];
        }

        // If still no move or 5% chance for completely random move
        if (!move) {
          const randomMovesResult = await Move.getRandom(1);
          move = randomMovesResult[0];
        }

        if (move) {
          moves.push(move.MoveName);
        }
      }

      console.log('Selected moves:', moves);
      return moves;
    } catch (error) {
      console.error('Error getting moves for monster:', error);
      console.error('Monster data:', monster);
      console.error('Requested move count:', count);
      // Return at least an empty array to prevent further errors
      return [];
    }
  }

  /**
   * Initialize a monster with stats and moves
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Initialized monster data
   */
  static async initializeMonster(monsterData) {
    try {
      console.log('Initializing monster with data:', monsterData);
      // Make a copy of the monster data
      const initializedMonster = { ...monsterData };

      // Generate IVs
      const ivs = this.generateIVs();
      Object.assign(initializedMonster, ivs);

      // Calculate base stats based on level
      const baseStats = this.calculateBaseStats(initializedMonster.level || 1);
      Object.assign(initializedMonster, baseStats);

      // Initialize EVs
      const evs = this.initializeEVs();
      Object.assign(initializedMonster, evs);

      // Generate nature and characteristic
      initializedMonster.nature = this.generateNature();
      initializedMonster.characteristic = this.generateCharacteristic();

      // Generate gender if not provided
      if (!initializedMonster.gender) {
        initializedMonster.gender = this.generateGender();
      }

      // Set initial friendship
      initializedMonster.friendship = 70; // Default starting friendship

      // Get moves based on level (1 move per 5 levels)
      const level = initializedMonster.level || 1;
      const moveCount = Math.max(1, Math.floor(level / 5) + 1);
      const moves = await this.getMovesForMonster(initializedMonster, moveCount);

      // Set moveset as JSON string
      initializedMonster.moveset = JSON.stringify(moves);

      // Set acquisition date
      initializedMonster.date_met = new Date().toISOString().split('T')[0];

      console.log('Monster initialization complete:', initializedMonster);
      return initializedMonster;
    } catch (error) {
      console.error('Error initializing monster:', error);
      console.error('Original monster data:', monsterData);
      // Return the original data with at least empty moveset to prevent further errors
      const safeData = { ...monsterData };
      if (!safeData.moveset) {
        safeData.moveset = JSON.stringify([]);
      }
      return safeData;
    }
  }
}

module.exports = MonsterInitializer;
