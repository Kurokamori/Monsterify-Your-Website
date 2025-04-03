const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const WritingSubmission = require('../models/WritingSubmission');
const RewardSystem = require('./RewardSystem');
const pool = require('../db');

class WritingSubmissionService {
  /**
   * Calculate rewards for a writing submission
   * @param {Object} data - Submission data
   * @param {string} data.writingType - Type of writing ('game' or 'other')
   * @param {number} data.wordCount - Word count
   * @param {number} data.difficultyModifier - Difficulty modifier (0-3)
   * @param {Array} data.participants - Array of participant objects
   * @returns {Promise<Object>} - Calculation results
   */
  static async calculateRewards(data) {
    try {
      const { writingType, wordCount, difficultyModifier, participants } = data;

      // Validate inputs
      if (!writingType || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
        throw new Error('Missing required parameters');
      }

      // Calculate total levels based on word count and difficulty modifier
      const totalLevels = this.calculateBaseLevels(wordCount, difficultyModifier);

      // Calculate total coins (levels * 50)
      const totalCoins = totalLevels * 50;

      // Calculate rewards per participant
      const { participantRewards, totalGiftLevels, allGiftParticipants } = await this.calculateParticipantRewards(
        participants,
        totalLevels,
        totalCoins,
        writingType
      );

      // We already have totalGiftLevels from calculateParticipantRewards

      return {
        wordCount,
        difficultyModifier,
        totalLevels,
        totalCoins,
        totalGiftLevels,
        participantRewards,
        needGiftRecipient: participants.every(p => p.isGift) && participants.length > 0
      };
    } catch (error) {
      console.error('Error calculating writing rewards:', error);
      throw error;
    }
  }

  /**
   * Calculate base levels from word count
   * @param {number} wordCount - Word count
   * @param {number} difficultyModifier - Difficulty modifier
   * @returns {number} - Base levels
   */
  static calculateBaseLevels(wordCount, difficultyModifier) {
    // 1 level per 50 words (rounded up) * difficulty modifier
    return Math.ceil(Math.ceil(wordCount / 50) * difficultyModifier);
  }

  /**
   * Calculate rewards for each participant
   * @param {Array} participants - Array of participant objects
   * @param {number} totalLevels - Total levels to distribute
   * @param {number} totalCoins - Total coins to distribute
   * @param {string} writingType - Type of writing ('game' or 'other')
   * @returns {Promise<Array>} - Array of participant rewards
   */
  static async calculateParticipantRewards(participants, totalLevels, totalCoins, writingType) {
    try {
      const participantRewards = [];

      // Separate participants by type
      const trainerParticipants = participants.filter(p => p.type === 'trainer' && !p.isGift);
      const monsterParticipants = participants.filter(p => p.type === 'monster' && !p.isGift);
      const giftParticipants = participants.filter(p => p.isGift);

      // Count of regular participants (non-gift)
      const regularCount = trainerParticipants.length + monsterParticipants.length;
      // Count of gift participants
      const giftCount = giftParticipants.length;

      // If all participants are gift participants, we'll need to handle this specially
      const allGiftParticipants = regularCount === 0 && giftCount > 0;

      // Only throw an error if there are no participants at all
      if (regularCount === 0 && giftCount === 0) {
        throw new Error('At least one participant is required');
      }

      // Calculate levels and coins per participant
      const levelsPerParticipant = Math.ceil(totalLevels / (regularCount + giftCount));
      // If all participants are gift participants, no coins are awarded
      // Otherwise, distribute coins among regular participants
      const coinsPerParticipant = regularCount > 0 ? Math.ceil(totalCoins / regularCount) : 0;

      // Calculate gift levels (1 level for every 5 total levels, rounded up)
      const totalGiftLevels = Math.ceil(totalLevels / 5);

      // This is a reference error since calculation doesn't exist yet
      // We'll store this value later when we return from this function

      // Calculate gift levels per regular participant
      // If all participants are gift participants, this will be handled separately
      const giftLevelsPerParticipant = (giftCount > 0 && regularCount > 0) ? Math.ceil(totalGiftLevels / regularCount) : 0;

      // Flag to indicate that we need to prompt for a gift recipient
      const needGiftRecipient = allGiftParticipants;

      // Process trainer participants
      for (const participant of trainerParticipants) {
        const { trainerId } = participant;

        // Get trainer details
        const trainer = await Trainer.getById(trainerId);
        if (!trainer) {
          throw new Error(`Trainer with ID ${trainerId} not found`);
        }

        // Create reward object
        const reward = {
          type: 'trainer',
          trainerId,
          trainerName: trainer.name,
          levels: levelsPerParticipant,
          coins: coinsPerParticipant,
          giftLevels: giftLevelsPerParticipant
        };

        participantRewards.push(reward);
      }

      // Process monster participants
      for (const participant of monsterParticipants) {
        const { monsterName, trainerId } = participant;

        // Get trainer details
        const trainer = await Trainer.getById(trainerId);
        if (!trainer) {
          throw new Error(`Trainer with ID ${trainerId} not found`);
        }

        // Create reward object
        const reward = {
          type: 'monster',
          trainerId,
          trainerName: trainer.name,
          monsterName,
          levels: levelsPerParticipant,
          coins: coinsPerParticipant,
          giftLevels: giftLevelsPerParticipant
        };

        participantRewards.push(reward);
      }

      // Add gift participants to the calculation
      for (const giftParticipant of giftParticipants) {
        // Get trainer details
        const trainerId = giftParticipant.trainerId;
        let trainerName = 'Gift';

        if (trainerId) {
          const trainer = await Trainer.getById(trainerId);
          if (trainer) {
            trainerName = trainer.name;
          }
        }

        participantRewards.push({
          isGift: true,
          type: giftParticipant.type,
          trainerId: trainerId || 'gift',
          trainerName: trainerName,
          monsterName: giftParticipant.monsterName,
          levels: levelsPerParticipant, // Gift participants get the same base levels
          coins: 0 // But no coins
        });
      }

      // Calculate item rewards based on gift levels
      if (totalGiftLevels > 0) {
        const itemRewardCount = Math.floor(totalGiftLevels / 5);
        if (itemRewardCount > 0) {
          // This will be handled by the calling function
        }
      }

      return {
        participantRewards,
        totalGiftLevels,
        allGiftParticipants
      };
    } catch (error) {
      console.error('Error calculating participant rewards:', error);
      throw error;
    }
  }

  /**
   * Submit a writing submission and apply rewards
   * @param {Object} data - Submission data
   * @param {string} data.writingType - Type of writing ('game' or 'other')
   * @param {string} data.title - Title of the writing
   * @param {string} data.writingUrl - URL to the writing
   * @param {number} data.wordCount - Word count
   * @param {number} data.difficultyModifier - Difficulty modifier (0-3)
   * @param {string} data.notes - Optional notes
   * @param {Array} data.participants - Array of participant objects
   * @param {string} userId - User ID of the submitter
   * @returns {Promise<Object>} - Submission result
   */
  static async submitWriting(data, userId) {
    try {
      const { writingType, title, writingUrl, wordCount, difficultyModifier, notes, participants } = data;

      // Calculate rewards
      const calculation = await this.calculateRewards({
        writingType,
        wordCount,
        difficultyModifier,
        participants
      });

      // We don't store writing submissions in the database
      const submission = {
        title,
        writing_url: writingUrl,
        writing_type: writingType,
        word_count: wordCount,
        difficulty_modifier: difficultyModifier,
        total_levels: calculation.totalLevels,
        total_coins: calculation.totalCoins,
        submission_date: new Date()
      };

      // Apply rewards to each participant
      for (const reward of calculation.participantRewards) {
        const { type, trainerId, monsterName, levels, coins = 0, giftLevels = 0, isGift } = reward;

        // Add coins to trainer (only for non-gift participants)
        if (!isGift && coins > 0) {
          await Trainer.addCoins(trainerId, coins);
        }

        // Process additional rewards (mission progress, garden points, boss damage)
        if (!isGift && trainerId) {
          // Get the user ID from the trainer ID
          const trainerQuery = `
            SELECT player_user_id FROM trainers
            WHERE id = $1
            LIMIT 1
          `;
          const trainerResult = await pool.query(trainerQuery, [trainerId]);

          if (trainerResult.rows.length > 0) {
            const playerUserId = trainerResult.rows[0].player_user_id;

            // Process additional rewards
            await RewardSystem.processAdditionalRewards(playerUserId, 'writing', {
              wordCount,
              levels,
              coins
            });
          }
        }

        // Add levels based on participant type
        if (type === 'monster') {
          // For monster participants, create a new monster with the specified name
          // or add levels to an existing monster with that name
          const monsters = await Monster.getByTrainerIdAndName(trainerId, monsterName);

          if (monsters && monsters.length > 0) {
            // If monster exists, add levels to it
            // For gift participants, just add the base levels
            // For regular participants, add base levels + gift levels
            const levelsToAdd = isGift ? levels : (levels + giftLevels);
            await Monster.addLevels(monsters[0].mon_id, levelsToAdd);
          } else {
            // If monster doesn't exist, create a new one
            const MonsterInitializer = require('./MonsterInitializer');
            const levelsToAdd = isGift ? levels : (levels + giftLevels);
            const monsterData = await MonsterInitializer.generateRandomMonster(levelsToAdd);

            await Monster.create({
              trainer_id: trainerId,
              name: monsterName,
              ...monsterData
            });
          }
        } else {
          // For trainer participants, add levels to the trainer
          // For gift participants, just add the base levels
          // For regular participants, add base levels + gift levels
          const levelsToAdd = isGift ? levels : (levels + giftLevels);
          await Trainer.addLevels(trainerId, levelsToAdd);
        }
      }

      // Handle item rewards for gift levels if applicable
      // For both game and external writing types
      const giftParticipants = participants.filter(p => p.isGift);
      if (giftParticipants.length > 0) {
        // Calculate total gift levels (1 level for every 5 total levels)
        const totalGiftLevels = Math.ceil(calculation.totalLevels / 5);

        // Calculate number of item rewards (1 per 5 gift levels, minimum 1 if there are any gift levels)
        // Ensure at least 1 reward is given when there are gift levels
        const itemRewardCount = totalGiftLevels > 0 ? Math.max(1, Math.floor(totalGiftLevels / 5)) : 0;

        // Check if we need to handle the all-gift-participants case
        if (participants.every(p => p.isGift)) {
          // For all-gift-participants case, we'll set a flag in the calculation
          // The UI will handle prompting for a recipient
          calculation.pendingGiftRewards = {
            count: itemRewardCount,
            giftLevels: totalGiftLevels
          };
        } else {
          // Get regular participants to distribute rewards to
          const regularParticipants = participants.filter(p => !p.isGift);

          // Always generate rewards if there are gift levels
          if (regularParticipants.length > 0) {
            // Categories to roll from
            const categories = ['ITEMS', 'BALLS', 'EVOLUTION', 'BERRIES', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'];

            // Roll and distribute rewards
            for (let i = 0; i < itemRewardCount; i++) {
              // Determine which participant gets this reward
              const participantIndex = i % regularParticipants.length;
              const participant = regularParticipants[participantIndex];

              // 20% chance to roll a monster instead of an item
              if (Math.random() < 0.2) {
                // Roll a monster using default parameters
                const MonsterRoller = require('./MonsterRoller');
                const roller = new MonsterRoller(); // Using default parameters
                const monster = await roller.rollMonster();

                // Create monster for trainer
                await Monster.create({
                  trainer_id: participant.trainerId,
                  ...monster,
                  level: 1
                });

                // Add to calculation for display purposes
                calculation.itemRewards = calculation.itemRewards || [];
                calculation.itemRewards.push({
                  type: 'monster',
                  name: `${monster.species1} ${monster.type1} Monster`,
                  quantity: 1
                });
              } else {
                // Roll an item
                const category = categories[Math.floor(Math.random() * categories.length)];

                // Get random item from category
                const Item = require('../models/Item');
                const items = await Item.getByCategory(category);

                if (items && items.length > 0) {
                  const item = items[Math.floor(Math.random() * items.length)];

                  // Add item to trainer's inventory
                  const inventoryCategory = this.mapCategoryToInventoryField(category);
                  await Trainer.addItemDirectly(
                    participant.trainerId,
                    inventoryCategory,
                    item.name,
                    1
                  );

                  // Add to calculation for display purposes
                  calculation.itemRewards = calculation.itemRewards || [];
                  calculation.itemRewards.push({
                    type: 'item',
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    quantity: 1
                  });
                }
              }
            }
          }
        }
      }

      // Process additional rewards for the submitter
      let additionalRewards = null;
      if (userId) {
        additionalRewards = await RewardSystem.processAdditionalRewards(userId, 'writing', {
          wordCount,
          totalLevels: calculation.totalLevels,
          totalCoins: calculation.totalCoins
        });
      }

      return {
        submission,
        calculation,
        additionalRewards,
        flavorText: additionalRewards?.flavorText || ''
      };
    } catch (error) {
      console.error('Error submitting writing:', error);
      throw error;
    }
  }

  /**
   * Map item category to inventory field
   * @param {string} category - Item category
   * @returns {string} - Inventory field name
   */
  static mapCategoryToInventoryField(category) {
    const mapping = {
      'ITEMS': 'inv_items',
      'BALLS': 'inv_balls',
      'EVOLUTION': 'inv_evolution',
      'BERRIES': 'inv_berries',
      'PASTRIES': 'inv_pastries',
      'ANTIQUES': 'inv_antiques',
      'HELDITEMS': 'inv_helditems',
      'SEALS': 'inv_seals'
    };

    return mapping[category] || 'inv_items';
  }

  /**
   * Get writing submissions for a user
   * @param {string} userId - User ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Submissions and pagination info
   */
  static async getUserSubmissions(userId, page = 1, limit = 10) {
    try {
      return await WritingSubmission.getByUserId(userId, page, limit);
    } catch (error) {
      console.error('Error getting user writing submissions:', error);
      throw error;
    }
  }

  /**
   * Get writing submissions for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Submissions and pagination info
   */
  static async getTrainerSubmissions(trainerId, page = 1, limit = 10) {
    try {
      return await WritingSubmission.getByTrainerId(trainerId, page, limit);
    } catch (error) {
      console.error('Error getting trainer writing submissions:', error);
      throw error;
    }
  }
}

module.exports = WritingSubmissionService;
