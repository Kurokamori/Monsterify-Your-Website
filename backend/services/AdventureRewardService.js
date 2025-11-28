const Adventure = require('../models/Adventure');
const AdventureParticipant = require('../models/AdventureParticipant');
const AdventureLog = require('../models/AdventureLog');
const Item = require('../models/Item');

class AdventureRewardService {
  constructor() {
    this.rewardRates = {
      wordsPerLevel: 50,
      wordsPerCoin: 1,
      wordsPerItem: 1000
    };
  }

  /**
   * End adventure and calculate rewards for all participants
   * @param {Object} completionData - Adventure completion data
   * @returns {Promise<Object>} Completion result with rewards
   */
  async endAdventure(completionData) {
    try {
      const { adventureId, discordUserId } = completionData;

      // Get adventure
      const adventure = await Adventure.getById(adventureId);
      if (!adventure) {
        throw new Error('Adventure not found');
      }

      if (adventure.status !== 'active') {
        throw new Error('Adventure is not active');
      }

      // Get all participants
      const participants = await AdventureParticipant.getByAdventure(adventureId);
      if (participants.length === 0) {
        throw new Error('No participants found for this adventure');
      }

      // Calculate rewards for each participant
      const participantRewards = await Promise.all(
        participants.map(participant => this.calculateParticipantRewards(participant))
      );

      // Create adventure logs for each participant
      const adventureLogs = await Promise.all(
        participantRewards.map(reward => this.createAdventureLog(adventureId, reward))
      );

      // Mark adventure as completed
      await Adventure.update(adventureId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Calculate total statistics
      const totalStats = this.calculateTotalStatistics(participantRewards);

      return {
        adventure,
        participants: participantRewards,
        adventureLogs,
        totalStats,
        completedBy: discordUserId
      };

    } catch (error) {
      console.error('Error ending adventure:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for a single participant
   * @param {Object} participant - Participant data
   * @returns {Promise<Object>} Calculated rewards
   */
  async calculateParticipantRewards(participant) {
    try {
      const wordCount = participant.word_count || 0;
      
      // Calculate levels (50 words = 1 level)
      const levelsEarned = Math.floor(wordCount / this.rewardRates.wordsPerLevel);
      
      // Calculate coins (1 word = 1 coin)
      const coinsEarned = Math.floor(wordCount / this.rewardRates.wordsPerCoin);
      
      // Calculate items (every 1,000 words = 1 item)
      const itemCount = Math.floor(wordCount / this.rewardRates.wordsPerItem);
      const itemsEarned = await this.rollRewardItems(itemCount);

      return {
        participant_id: participant.id,
        discord_user_id: participant.discord_user_id,
        user_id: participant.user_id,
        username: participant.username,
        word_count: wordCount,
        message_count: participant.message_count || 0,
        levels_earned: levelsEarned,
        coins_earned: coinsEarned,
        items_earned: itemsEarned
      };

    } catch (error) {
      console.error('Error calculating participant rewards:', error);
      throw error;
    }
  }

  /**
   * Roll reward items for a participant
   * @param {number} itemCount - Number of items to roll
   * @returns {Promise<Array>} Array of rolled items
   */
  async rollRewardItems(itemCount) {
    try {
      if (itemCount <= 0) return [];

      const items = [];
      const itemsResult = await Item.getAll();
      const availableItems = itemsResult.data || [];
      
      if (!Array.isArray(availableItems) || availableItems.length === 0) {
        console.warn('No items available for rewards or items result is not an array');
        return [];
      }

      for (let i = 0; i < itemCount; i++) {
        // Roll for item rarity
        const rarity = this.rollItemRarity();
        
        // Filter items by rarity
        const rarityItems = availableItems.filter(item => 
          item.rarity?.toLowerCase() === rarity.toLowerCase()
        );

        let selectedItem;
        if (rarityItems.length > 0) {
          selectedItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
        } else {
          // Fallback to any item
          selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        }

        items.push({
          id: selectedItem.id,
          name: selectedItem.name,
          description: selectedItem.description,
          rarity: selectedItem.rarity,
          quantity: 1
        });
      }

      return items;

    } catch (error) {
      console.error('Error rolling reward items:', error);
      return [];
    }
  }

  /**
   * Roll item rarity for adventure rewards
   * @returns {string} Item rarity
   */
  rollItemRarity() {
    const rarityWeights = {
      common: 60,
      uncommon: 25,
      rare: 10,
      epic: 4,
      legendary: 1
    };

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
   * Create adventure log entry for a participant
   * @param {number} adventureId - Adventure ID
   * @param {Object} rewardData - Participant reward data
   * @returns {Promise<Object>} Created adventure log
   */
  async createAdventureLog(adventureId, rewardData) {
    try {
      const logData = {
        adventure_id: adventureId,
        discord_user_id: rewardData.discord_user_id,
        user_id: rewardData.user_id,
        word_count: rewardData.word_count,
        message_count: rewardData.message_count,
        levels_earned: rewardData.levels_earned,
        coins_earned: rewardData.coins_earned,
        items_earned: rewardData.items_earned
      };

      const adventureLog = await AdventureLog.create(logData);
      console.log(`Created adventure log for ${rewardData.username || rewardData.discord_user_id}`);
      return adventureLog;

    } catch (error) {
      console.error('Error creating adventure log:', error);
      throw error;
    }
  }

  /**
   * Calculate total statistics for the adventure
   * @param {Array} participantRewards - Array of participant reward data
   * @returns {Object} Total statistics
   */
  calculateTotalStatistics(participantRewards) {
    const stats = {
      totalParticipants: participantRewards.length,
      totalWords: 0,
      totalMessages: 0,
      totalLevels: 0,
      totalCoins: 0,
      totalItems: 0,
      averageWordsPerParticipant: 0,
      topContributor: null
    };

    let topWordCount = 0;

    participantRewards.forEach(reward => {
      stats.totalWords += reward.word_count;
      stats.totalMessages += reward.message_count;
      stats.totalLevels += reward.levels_earned;
      stats.totalCoins += reward.coins_earned;
      stats.totalItems += reward.items_earned.length;

      if (reward.word_count > topWordCount) {
        topWordCount = reward.word_count;
        stats.topContributor = {
          username: reward.username || 'Unknown',
          word_count: reward.word_count
        };
      }
    });

    stats.averageWordsPerParticipant = stats.totalParticipants > 0 ? 
      Math.round(stats.totalWords / stats.totalParticipants) : 0;

    return stats;
  }

  /**
   * Get unclaimed adventure rewards for a Discord user
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Array>} Array of unclaimed adventure logs
   */
  async getUnclaimedRewards(discordUserId) {
    try {
      console.log(`Getting unclaimed rewards for Discord user: ${discordUserId}`);

      const unclaimedLogs = await AdventureLog.getUnclaimedByDiscordUser(discordUserId);

      // Format the logs for the frontend
      const formattedRewards = unclaimedLogs.map(log => ({
        id: log.id,
        adventure_id: log.adventure_id,
        adventure_title: log.adventure_title,
        adventure_description: log.adventure_description,
        word_count: log.word_count,
        message_count: log.message_count,
        levels_earned: log.levels_earned,
        coins_earned: log.coins_earned,
        items_earned: log.items_earned,
        created_at: log.created_at,
        is_claimed: log.is_claimed
      }));

      console.log(`Found ${formattedRewards.length} unclaimed rewards for user ${discordUserId}`);
      return formattedRewards;

    } catch (error) {
      console.error('Error getting unclaimed rewards:', error);
      throw error;
    }
  }

  /**
   * Claim adventure rewards
   * @param {Object} claimData - Claim data
   * @returns {Promise<Object>} Claim result
   */
  async claimRewards(claimData) {
    try {
      const { adventureLogId, userId, levelAllocations, itemAllocations } = claimData;

      // Validate claim data
      if (!adventureLogId || !userId) {
        throw new Error('Missing required claim data');
      }

      // For now, just return success
      // In a full implementation, this would:
      // 1. Validate the adventure log belongs to the user
      // 2. Apply level allocations to trainers/monsters
      // 3. Add items to trainer inventories
      // 4. Mark adventure log as claimed

      console.log(`Processing reward claim for adventure log ${adventureLogId}`);
      console.log(`Level allocations:`, levelAllocations);
      console.log(`Item allocations:`, itemAllocations);

      return {
        success: true,
        message: 'Rewards claimed successfully',
        adventureLogId,
        userId
      };

    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  }

  /**
   * Get adventure completion statistics
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} Adventure statistics
   */
  async getAdventureStatistics(adventureId) {
    try {
      const adventure = await Adventure.getById(adventureId);
      if (!adventure) {
        throw new Error('Adventure not found');
      }

      const participants = await AdventureParticipant.getByAdventure(adventureId);
      
      const stats = {
        adventure_id: adventureId,
        title: adventure.title,
        status: adventure.status,
        participant_count: participants.length,
        total_words: participants.reduce((sum, p) => sum + (p.word_count || 0), 0),
        total_messages: participants.reduce((sum, p) => sum + (p.message_count || 0), 0),
        encounter_count: adventure.encounter_count || 0,
        created_at: adventure.created_at,
        completed_at: adventure.completed_at
      };

      return stats;

    } catch (error) {
      console.error('Error getting adventure statistics:', error);
      throw error;
    }
  }
}

module.exports = new AdventureRewardService();
