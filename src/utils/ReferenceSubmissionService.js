const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

class ReferenceSubmissionService {
  /**
   * Calculate rewards for a reference submission
   * @param {Object} data - Submission data
   * @param {string} data.referenceType - Type of reference ('trainer' or 'monster')
   * @param {Array} data.references - Array of reference objects
   * @returns {Promise<Object>} - Calculation results
   */
  static async calculateRewards(data) {
    try {
      const { referenceType, references } = data;

      // Validate inputs
      if (!referenceType || !references || !references.length) {
        throw new Error('Missing required parameters');
      }

      // Fixed rewards for references
      const levelsPerReference = 6;
      const coinsPerReference = 200;

      // Calculate total rewards
      const totalReferences = references.length;
      const totalLevels = totalReferences * levelsPerReference;
      const totalCoins = totalReferences * coinsPerReference;

      // Calculate rewards per reference
      const referenceRewards = [];

      for (const reference of references) {
        if (referenceType === 'trainer') {
          const { trainerId, referenceUrl } = reference;

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
            referenceUrl,
            levels: levelsPerReference,
            coins: coinsPerReference
          };

          referenceRewards.push(reward);
        } else if (referenceType === 'monster') {
          const { trainerId, monsterName, referenceUrl } = reference;

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
            referenceUrl,
            levels: levelsPerReference,
            coins: coinsPerReference
          };

          referenceRewards.push(reward);
        }
      }

      return {
        referenceType,
        totalReferences,
        totalLevels,
        totalCoins,
        referenceRewards
      };
    } catch (error) {
      console.error('Error calculating reference rewards:', error);
      throw error;
    }
  }

  /**
   * Submit a reference submission
   * @param {Object} data - Submission data
   * @param {string} data.referenceType - Type of reference ('trainer' or 'monster')
   * @param {Array} data.references - Array of reference objects
   * @param {string} submitterId - Discord ID of the submitter
   * @returns {Promise<Object>} - Submission result
   */
  static async submitReference(data, submitterId) {
    try {
      const { referenceType, references } = data;

      // Validate inputs
      if (!referenceType || !references || !references.length) {
        throw new Error('Missing required parameters');
      }

      // Calculate rewards
      const calculation = await this.calculateRewards({
        referenceType,
        references
      });

      // We don't store reference submissions in the database
      const submission = {
        reference_type: referenceType,
        total_references: calculation.totalReferences,
        total_levels: calculation.totalLevels,
        total_coins: calculation.totalCoins,
        submission_date: new Date()
      };

      // Apply rewards and update references for each reference
      for (const reward of calculation.referenceRewards) {
        const { type, trainerId, monsterName, referenceUrl, levels, coins } = reward;

        // Add coins to trainer
        await Trainer.addCoins(trainerId, coins);

        // Update reference and add levels based on reference type
        if (type === 'trainer') {
          // Update trainer reference
          await Trainer.update(trainerId, {
            main_ref: referenceUrl
          });

          // Add levels to trainer
          await Trainer.addLevels(trainerId, levels);
        } else if (type === 'monster') {
          // Find the monster
          const monsters = await Monster.getByTrainerIdAndName(trainerId, monsterName);
          
          if (monsters && monsters.length > 0) {
            // Update monster reference
            await Monster.update(monsters[0].mon_id, {
              img_link: referenceUrl
            });

            // Add levels to monster
            await Monster.addLevels(monsters[0].mon_id, levels);
          } else {
            throw new Error(`Monster ${monsterName} not found for trainer ${trainerId}`);
          }
        }
      }

      return {
        submission,
        calculation
      };
    } catch (error) {
      console.error('Error submitting reference:', error);
      throw error;
    }
  }
}

module.exports = ReferenceSubmissionService;
