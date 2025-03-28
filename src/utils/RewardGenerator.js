const { v4: uuidv4 } = require('uuid');
const { RewardType, Rarity, validateReward } = require('../models/Reward');
const { MonsterRoller } = require('./MonsterRoller');
const Item = require('../models/Item');

class RewardGenerator {
  constructor(pool) {
    this.pool = pool;
    this.config = {
      defaultCoinAmount: 50,
      defaultLevelAmount: 1,
      defaultItemQuantity: 1,
      rarityWeights: {
        common: 0.60,    // 60%
        uncommon: 0.25,  // 25%
        rare: 0.10,      // 10%
        epic: 0.04,      // 4%
        legendary: 0.01  // 1%
      }
    };
  }

  /**
   * Generate a coin reward
   * @param {number} amount Base amount of coins
   * @param {number} multiplier Optional multiplier (default 1)
   * @returns {Reward} Coin reward object
   */
  generateCoinReward(amount, multiplier = 1) {
    try {
      // Validate input
      const baseAmount = parseInt(amount) || this.config.defaultCoinAmount;
      const validMultiplier = parseFloat(multiplier) || 1;

      // Calculate final amount
      const finalAmount = Math.max(1, Math.round(baseAmount * validMultiplier));

      const reward = {
        id: `coin-${uuidv4()}`,
        type: RewardType.COIN,
        rarity: this.determineRarityByAmount(finalAmount),
        data: {
          amount: finalAmount
        }
      };

      // Validate reward structure
      if (!validateReward(reward)) {
        throw new Error('Invalid coin reward structure');
      }

      return reward;
    } catch (error) {
      console.error('Error generating coin reward:', error);
      // Return minimum fallback reward
      return {
        id: `coin-${uuidv4()}`,
        type: RewardType.COIN,
        rarity: Rarity.COMMON,
        data: {
          amount: this.config.defaultCoinAmount
        }
      };
    }
  }

  /**
   * Generate an item reward
   * @param {string} source Source identifier for item pool
   * @param {string} rarity Desired rarity level
   * @returns {Promise<Reward>} Item reward object
   */
  async generateItemReward(source, rarity) {
    try {
      // Validate rarity
      const validRarity = Object.values(Rarity).includes(rarity) ? rarity : this.rollRarity();

      // Get items from database matching source and rarity
      const items = await Item.getBySourceAndRarity(source, validRarity);

      if (!items || items.length === 0) {
        throw new Error(`No items found for source: ${source}, rarity: ${validRarity}`);
      }

      // Select random item
      const item = items[Math.floor(Math.random() * items.length)];

      // Generate quantity based on rarity
      const quantity = this.determineQuantityByRarity(validRarity);

      const reward = {
        id: `item-${uuidv4()}`,
        type: RewardType.ITEM,
        rarity: validRarity,
        data: {
          name: item.name,
          description: item.description || 'A useful item',
          quantity: quantity,
          category: item.category || 'general'
        }
      };

      // Validate reward structure
      if (!validateReward(reward)) {
        throw new Error('Invalid item reward structure');
      }

      return reward;
    } catch (error) {
      console.error('Error generating item reward:', error);
      // Return fallback reward
      return {
        id: `item-${uuidv4()}`,
        type: RewardType.ITEM,
        rarity: Rarity.COMMON,
        data: {
          name: 'Potion',
          description: 'Restores 20 HP',
          quantity: this.config.defaultItemQuantity,
          category: 'general'
        }
      };
    }
  }

  /**
   * Generate a level reward
   * @param {'monster'|'trainer'} type Level reward type
   * @param {number} amount Number of levels
   * @returns {Reward} Level reward object
   */
  generateLevelReward(type, amount) {
    try {
      // Validate input
      const validType = type === 'monster' || type === 'trainer' ? type : 'monster';
      const validAmount = parseInt(amount) || this.config.defaultLevelAmount;

      const reward = {
        id: `level-${uuidv4()}`,
        type: RewardType.LEVEL,
        rarity: this.determineRarityByLevels(validAmount),
        data: {
          levels: validAmount,
          isMonster: validType === 'monster',
          isTrainer: validType === 'trainer'
        }
      };

      // Validate reward structure
      if (!validateReward(reward)) {
        throw new Error('Invalid level reward structure');
      }

      return reward;
    } catch (error) {
      console.error('Error generating level reward:', error);
      // Return fallback reward
      return {
        id: `level-${uuidv4()}`,
        type: RewardType.LEVEL,
        rarity: Rarity.COMMON,
        data: {
          levels: this.config.defaultLevelAmount,
          isMonster: true,
          isTrainer: false
        }
      };
    }
  }

  /**
   * Generate a monster reward
   * @param {Object} options Monster generation options
   * @returns {Promise<Reward>} Monster reward object
   */
  async generateMonsterReward(options = {}) {
    try {
      // Configure monster roller options
      const rollerOptions = {
        ...options,
        filters: {
          ...options.filters,
          pokemon: {
            rarity: this.mapRarityToPokemonRarity(options.rarity),
            ...options.filters?.pokemon
          },
          digimon: {
            stage: this.mapRarityToDigimonStage(options.rarity),
            ...options.filters?.digimon
          },
          yokai: {
            rank: this.mapRarityToYokaiRank(options.rarity),
            ...options.filters?.yokai
          }
        }
      };

      // Roll monster using MonsterRoller
      const roller = new MonsterRoller(rollerOptions);
      const rolledMonster = await roller.rollOne();

      if (!rolledMonster) {
        throw new Error('Failed to roll monster');
      }

      const reward = {
        id: `monster-${uuidv4()}`,
        type: RewardType.MONSTER,
        rarity: options.rarity || this.rollRarity(),
        data: {
          species: rolledMonster.species1,
          species2: rolledMonster.species2 || null,
          species3: rolledMonster.species3 || null,
          level: options.level || 5,
          type: rolledMonster.type1,
          type2: rolledMonster.type2 || null,
          type3: rolledMonster.type3 || null,
          type4: rolledMonster.type4 || null,
          type5: rolledMonster.type5 || null,
          attribute: rolledMonster.attribute
        }
      };

      // Validate reward structure
      if (!validateReward(reward)) {
        throw new Error('Invalid monster reward structure');
      }

      return reward;
    } catch (error) {
      console.error('Error generating monster reward:', error);
      // Return fallback reward
      return {
        id: `monster-${uuidv4()}`,
        type: RewardType.MONSTER,
        rarity: Rarity.COMMON,
        data: {
          species: 'Pikachu',
          level: 5,
          type: 'Electric',
          attribute: 'Data'
        }
      };
    }
  }

  /**
   * Roll a random rarity based on configured weights
   * @returns {string} Rarity value
   */
  rollRarity() {
    const rand = Math.random();
    let cumulativeWeight = 0;

    for (const [rarity, weight] of Object.entries(this.config.rarityWeights)) {
      cumulativeWeight += weight;
      if (rand <= cumulativeWeight) {
        return rarity;
      }
    }

    return Rarity.COMMON; // Fallback
  }

  /**
   * Determine rarity based on coin amount
   * @param {number} amount Coin amount
   * @returns {string} Rarity value
   */
  determineRarityByAmount(amount) {
    if (amount >= 10000) return Rarity.LEGENDARY;
    if (amount >= 5000) return Rarity.EPIC;
    if (amount >= 1000) return Rarity.RARE;
    if (amount >= 500) return Rarity.UNCOMMON;
    return Rarity.COMMON;
  }

  /**
   * Determine quantity based on item rarity
   * @param {string} rarity Item rarity
   * @returns {number} Quantity
   */
  determineQuantityByRarity(rarity) {
    switch (rarity) {
      case Rarity.LEGENDARY: return Math.ceil(Math.random() * 2);
      case Rarity.EPIC: return Math.ceil(Math.random() * 3);
      case Rarity.RARE: return Math.ceil(Math.random() * 4);
      case Rarity.UNCOMMON: return Math.ceil(Math.random() * 5);
      default: return Math.ceil(Math.random() * 6);
    }
  }

  /**
   * Determine rarity based on level amount
   * @param {number} levels Number of levels
   * @returns {string} Rarity value
   */
  determineRarityByLevels(levels) {
    if (levels >= 10) return Rarity.LEGENDARY;
    if (levels >= 7) return Rarity.EPIC;
    if (levels >= 5) return Rarity.RARE;
    if (levels >= 3) return Rarity.UNCOMMON;
    return Rarity.COMMON;
  }

  /**
   * Map general rarity to Pokemon-specific rarity
   * @param {string} rarity General rarity
   * @returns {string[]} Pokemon rarity values
   */
  mapRarityToPokemonRarity(rarity) {
    switch (rarity) {
      case Rarity.LEGENDARY:
        return ['Legendary', 'Mythical', 'Ultra Beast'];
      case Rarity.EPIC:
        return ['Rare', 'Very Rare'];
      case Rarity.RARE:
        return ['Rare'];
      case Rarity.UNCOMMON:
        return ['Uncommon'];
      default:
        return ['Common'];
    }
  }

  /**
   * Map general rarity to Digimon stage
   * @param {string} rarity General rarity
   * @returns {string[]} Digimon stage values
   */
  mapRarityToDigimonStage(rarity) {
    switch (rarity) {
      case Rarity.LEGENDARY:
        return ['Ultra', 'Super Ultimate'];
      case Rarity.EPIC:
        return ['Mega'];
      case Rarity.RARE:
        return ['Ultimate'];
      case Rarity.UNCOMMON:
        return ['Champion'];
      default:
        return ['Rookie', 'Training'];
    }
  }

  /**
   * Map general rarity to Yokai rank
   * @param {string} rarity General rarity
   * @returns {string[]} Yokai rank values
   */
  mapRarityToYokaiRank(rarity) {
    switch (rarity) {
      case Rarity.LEGENDARY:
        return ['SS'];
      case Rarity.EPIC:
        return ['S'];
      case Rarity.RARE:
        return ['A'];
      case Rarity.UNCOMMON:
        return ['B'];
      default:
        return ['E', 'D', 'C'];
    }
  }

  /**
   * Generate rewards for Game Corner activity
   * @param {Object} parameters Game Corner parameters
   * @param {number} parameters.sessions Number of completed sessions
   * @param {number} parameters.minutes Total focus minutes
   * @param {number} parameters.productivity Productivity score (0-100)
   * @returns {Promise<Reward[]>} Array of generated rewards
   */
  async generateGameCornerRewards({ sessions, minutes, productivity }) {
    try {
      const rewards = [];

      // Base coin reward
      const baseCoins = this.config.defaultCoinAmount;
      const sessionFactor = sessions;
      const timeFactor = Math.ceil(minutes / 15); // Additional coins per 15 minutes
      const productivityMultiplier = productivity / 100;
      const coinAmount = Math.round(baseCoins * (sessionFactor + timeFactor) * productivityMultiplier);
      
      rewards.push(this.generateCoinReward(coinAmount));

      // Level rewards based on productivity
      if (productivity >= 50) {
        const maxLevelRewards = Math.min(Math.max(Math.floor(productivity / 20), Math.floor(minutes / 30)), 5);
        const numLevelRewards = Math.floor(Math.random() * (maxLevelRewards + 1));

        // 70% monster levels, 30% trainer levels
        const numMonsterLevels = Math.ceil(numLevelRewards * 0.7);
        const numTrainerLevels = numLevelRewards - numMonsterLevels;

        for (let i = 0; i < numMonsterLevels; i++) {
          rewards.push(this.generateLevelReward('monster', Math.ceil(Math.random() * 2)));
        }

        for (let i = 0; i < numTrainerLevels; i++) {
          rewards.push(this.generateLevelReward('trainer', Math.ceil(Math.random() * 2)));
        }
      }

      // Item rewards based on time spent
      const maxItems = Math.min(Math.max(Math.floor(productivity / 20), Math.floor(minutes / 25)), 5);
      const numItems = Math.floor(Math.random() * (maxItems + 1));

      for (let i = 0; i < numItems; i++) {
        const itemRarity = productivity >= 90 ? 
          (Math.random() < 0.1 ? Rarity.RARE : Rarity.UNCOMMON) :
          (productivity >= 70 ? Rarity.UNCOMMON : Rarity.COMMON);

        rewards.push(await this.generateItemReward('game_corner', itemRarity));
      }

      // Monster rewards for high productivity
      if (productivity >= 80) {
        const maxMonsters = Math.min(Math.max(Math.floor(productivity / 20), Math.floor(minutes / 35)), 5);
        const numMonsters = Math.floor(Math.random() * (maxMonsters + 1));

        for (let i = 0; i < numMonsters; i++) {
          let monsterRarity;
          if (productivity >= 95 && Math.random() <= 0.000002) { // 0.0002% chance
            monsterRarity = Rarity.LEGENDARY;
          } else if (productivity >= 90) {
            monsterRarity = Rarity.EPIC;
          } else {
            monsterRarity = Rarity.RARE;
          }

          rewards.push(await this.generateMonsterReward({
            rarity: monsterRarity,
            level: Math.floor(5 + (sessions / 2))
          }));
        }
      }

      return rewards;

    } catch (error) {
      console.error('Error generating Game Corner rewards:', error);
      // Return minimum fallback reward
      return [this.generateCoinReward(this.config.defaultCoinAmount)];
    }
  }

  /**
   * Generate rewards for Garden activity
   * @param {Object} parameters Garden parameters
   * @param {number} parameters.gardenPoints Points earned from garden activity
   * @returns {Promise<Reward[]>} Array of generated rewards
   */
  async generateGardenRewards({ gardenPoints }) {
    try {
      const rewards = [];

      // Base coin reward
      const coinAmount = gardenPoints * 50;
      rewards.push(this.generateCoinReward(coinAmount));

      // Berry rewards (25% chance per point)
      for (let i = 0; i < gardenPoints; i++) {
        if (Math.random() < 0.25) {
          const berryRarity = Math.random() < 0.1 ? Rarity.RARE :
                            Math.random() < 0.3 ? Rarity.UNCOMMON :
                            Rarity.COMMON;

          rewards.push(await this.generateItemReward('garden', berryRarity));
        }
      }

      // Monster rewards (15% chance per point)
      for (let i = 0; i < gardenPoints; i++) {
        if (Math.random() < 0.15) {
          const rarityRoll = Math.random() * 100;
          let monsterRarity;

          if (rarityRoll < 0.01) {          // 0.01% legendary
            monsterRarity = Rarity.LEGENDARY;
          } else if (rarityRoll < 1) {      // 1% epic
            monsterRarity = Rarity.EPIC;
          } else if (rarityRoll < 10) {     // 10% rare
            monsterRarity = Rarity.RARE;
          } else if (rarityRoll < 30) {     // 30% uncommon
            monsterRarity = Rarity.UNCOMMON;
          } else {                          // 59% common
            monsterRarity = Rarity.COMMON;
          }

          rewards.push(await this.generateMonsterReward({
            rarity: monsterRarity,
            level: Math.floor(Math.random() * 5) + 1,
            filters: {
              pokemon: { types: ['Grass', 'Bug'] },
              digimon: { attribute: ['Nature Spirit', 'Insectoid'] },
              yokai: { tribe: ['Nature'] }
            }
          }));
        }
      }

      return rewards;

    } catch (error) {
      console.error('Error generating Garden rewards:', error);
      // Return minimum fallback reward
      return [this.generateCoinReward(50)];
    }
  }
}

module.exports = RewardGenerator;