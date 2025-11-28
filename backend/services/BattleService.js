const AdventureEncounter = require('../models/AdventureEncounter');
const AdventureParticipant = require('../models/AdventureParticipant');
const Item = require('../models/Item');

class BattleService {
  constructor() {
    this.battleOutcomes = {
      victory: { weight: 50, coinMultiplier: 1.5, itemChance: 0.4 },
      retreat: { weight: 30, coinMultiplier: 0.8, itemChance: 0.2 },
      draw: { weight: 20, coinMultiplier: 1.0, itemChance: 0.3 }
    };
  }

  /**
   * Resolve a battle encounter
   * @param {Object} battleData - Battle resolution data
   * @returns {Promise<Object>} Battle result
   */
  async resolveBattle(battleData) {
    try {
      const { encounterId, discordUserId } = battleData;

      // Get encounter data
      const encounter = await AdventureEncounter.getById(encounterId);
      if (!encounter || encounter.encounter_type !== 'battle') {
        throw new Error('Invalid battle encounter');
      }

      if (encounter.is_resolved) {
        throw new Error('Battle encounter already resolved');
      }

      // Roll battle outcome
      const outcome = this.rollBattleOutcome();

      // Calculate rewards
      const rewards = await this.calculateBattleRewards(encounter.encounter_data, outcome);

      // Distribute rewards to all participants
      await this.distributeRewardsToParticipants(encounter.adventure_id, rewards);

      // Mark encounter as resolved
      await AdventureEncounter.markResolved(encounterId);

      return {
        outcome,
        rewards,
        resolved_by: discordUserId
      };

    } catch (error) {
      console.error('Error resolving battle:', error);
      throw error;
    }
  }

  /**
   * Roll battle outcome based on weights
   * @returns {string} Battle outcome
   */
  rollBattleOutcome() {
    const totalWeight = Object.values(this.battleOutcomes).reduce((sum, outcome) => sum + outcome.weight, 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [outcome, data] of Object.entries(this.battleOutcomes)) {
      currentWeight += data.weight;
      if (roll <= currentWeight) {
        return outcome;
      }
    }

    return 'victory'; // Fallback
  }

  /**
   * Calculate battle rewards based on encounter and outcome
   * @param {Object} encounterData - Battle encounter data
   * @param {string} outcome - Battle outcome
   * @returns {Promise<Object>} Calculated rewards
   */
  async calculateBattleRewards(encounterData, outcome) {
    try {
      const outcomeData = this.battleOutcomes[outcome];
      const rewards = {
        coins: 0,
        items: []
      };

      // Calculate base coin reward
      const enemyCount = (encounterData.trainers?.length || 0) + (encounterData.monsters?.length || 0);
      const baseCoinReward = enemyCount * 100 + Math.floor(Math.random() * 200); // 100-300 per enemy
      rewards.coins = Math.floor(baseCoinReward * outcomeData.coinMultiplier);

      // Roll for item rewards
      if (Math.random() < outcomeData.itemChance) {
        const itemRewards = await this.rollBattleItems(outcome, enemyCount);
        rewards.items = itemRewards;
      }

      return rewards;

    } catch (error) {
      console.error('Error calculating battle rewards:', error);
      throw error;
    }
  }

  /**
   * Roll for battle item rewards
   * @param {string} outcome - Battle outcome
   * @param {number} enemyCount - Number of enemies
   * @returns {Promise<Array>} Array of item rewards
   */
  async rollBattleItems(outcome, enemyCount) {
    try {
      const items = [];
      
      // Determine number of items to roll
      let itemCount = 1;
      if (outcome === 'victory' && enemyCount >= 3) {
        itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items for big victories
      }

      // Get available items (you might want to filter by category or rarity)
      const availableItems = await Item.getAll();
      
      for (let i = 0; i < itemCount; i++) {
        // Roll for item rarity based on outcome
        const rarityWeights = this.getItemRarityWeights(outcome);
        const rarity = this.rollItemRarity(rarityWeights);
        
        // Filter items by rarity
        const rarityItems = availableItems.filter(item => 
          item.rarity?.toLowerCase() === rarity.toLowerCase()
        );

        if (rarityItems.length > 0) {
          const randomItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
          items.push({
            id: randomItem.id,
            name: randomItem.name,
            description: randomItem.description,
            rarity: randomItem.rarity,
            quantity: 1
          });
        } else {
          // Fallback to any item if no items of the rolled rarity exist
          const fallbackItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          items.push({
            id: fallbackItem.id,
            name: fallbackItem.name,
            description: fallbackItem.description,
            rarity: fallbackItem.rarity,
            quantity: 1
          });
        }
      }

      return items;

    } catch (error) {
      console.error('Error rolling battle items:', error);
      return [];
    }
  }

  /**
   * Get item rarity weights based on battle outcome
   * @param {string} outcome - Battle outcome
   * @returns {Object} Rarity weights
   */
  getItemRarityWeights(outcome) {
    const baseWeights = {
      common: 50,
      uncommon: 30,
      rare: 15,
      epic: 4,
      legendary: 1
    };

    switch (outcome) {
      case 'victory':
        return {
          common: 30,
          uncommon: 35,
          rare: 25,
          epic: 8,
          legendary: 2
        };
      case 'retreat':
        return {
          common: 70,
          uncommon: 20,
          rare: 8,
          epic: 2,
          legendary: 0
        };
      case 'draw':
        return baseWeights;
      default:
        return baseWeights;
    }
  }

  /**
   * Roll item rarity based on weights
   * @param {Object} rarityWeights - Rarity weights
   * @returns {string} Item rarity
   */
  rollItemRarity(rarityWeights) {
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    const roll = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      currentWeight += weight;
      if (roll <= currentWeight) {
        return rarity;
      }
    }

    return 'common'; // Fallback
  }

  /**
   * Distribute rewards to all adventure participants
   * @param {number} adventureId - Adventure ID
   * @param {Object} rewards - Rewards to distribute
   * @returns {Promise<void>}
   */
  async distributeRewardsToParticipants(adventureId, rewards) {
    try {
      // Get all participants for this adventure
      const participants = await AdventureParticipant.getByAdventure(adventureId);

      // For now, just log the distribution
      // In a full implementation, you would add these rewards to adventure logs
      console.log(`Distributing battle rewards to ${participants.length} participants:`);
      console.log(`- Coins: ${rewards.coins} each`);
      console.log(`- Items: ${rewards.items.map(item => item.name).join(', ')}`);

      // TODO: Implement actual reward distribution to adventure logs
      // This would involve creating or updating adventure_logs entries for each participant

    } catch (error) {
      console.error('Error distributing rewards to participants:', error);
      throw error;
    }
  }

  /**
   * Get battle statistics for an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} Battle statistics
   */
  async getBattleStatistics(adventureId) {
    try {
      const battles = await AdventureEncounter.getByAdventure(adventureId, {
        encounterType: 'battle',
        isResolved: true
      });

      const stats = {
        total_battles: battles.length,
        victories: 0,
        retreats: 0,
        draws: 0,
        total_coins_earned: 0,
        total_items_earned: 0
      };

      battles.forEach(battle => {
        // Parse battle result from encounter data if stored
        // For now, just count battles
        stats.total_battles++;
      });

      return stats;

    } catch (error) {
      console.error('Error getting battle statistics:', error);
      throw error;
    }
  }

  /**
   * Check if a battle encounter can be resolved
   * @param {number} encounterId - Encounter ID
   * @returns {Promise<boolean>} Can be resolved
   */
  async canResolveBattle(encounterId) {
    try {
      const encounter = await AdventureEncounter.getById(encounterId);
      
      return encounter && 
             encounter.encounter_type === 'battle' && 
             !encounter.is_resolved;

    } catch (error) {
      console.error('Error checking if battle can be resolved:', error);
      return false;
    }
  }

  /**
   * Get battle difficulty based on encounter data
   * @param {Object} encounterData - Battle encounter data
   * @returns {string} Difficulty level
   */
  getBattleDifficulty(encounterData) {
    const enemyCount = (encounterData.trainers?.length || 0) + (encounterData.monsters?.length || 0);
    
    if (enemyCount <= 2) return 'easy';
    if (enemyCount <= 4) return 'medium';
    if (enemyCount <= 6) return 'hard';
    return 'extreme';
  }
}

module.exports = new BattleService();
