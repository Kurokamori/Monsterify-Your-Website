/**
 * Centralized Reward System
 * Handles reward generation, processing, and claiming for all game activities
 */

const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const Item = require('../models/Item');
const MonsterRoller = require('./MonsterRoller');
const pool = require('../db');

class RewardSystem {
  /**
   * Process rewards to generate random values for ranges
   * @param {Array} rewards - Array of reward objects
   * @returns {Array} - Processed rewards with random values
   */
  static async processRewards(rewards) {
    console.log('Processing rewards:', JSON.stringify(rewards, null, 2));

    const processedRewards = rewards.map(reward => {
      // Create a copy of the reward
      const processedReward = { ...reward };

      // Make sure reward_data is parsed if it's a string
      let rewardData = processedReward.reward_data;
      if (typeof rewardData === 'string') {
        try {
          rewardData = JSON.parse(rewardData);
        } catch (e) {
          console.error('Error parsing reward_data:', e);
          return processedReward;
        }
      }

      console.log(`Processing reward type: ${reward.reward_type}, data:`, rewardData);

      // Process reward data based on type
      if (reward.reward_type === 'coin') {
        // If amount is a range, generate a random value
        if (rewardData && rewardData.amount && typeof rewardData.amount === 'object' &&
            rewardData.amount.min !== undefined && rewardData.amount.max !== undefined) {
          const min = rewardData.amount.min;
          const max = rewardData.amount.max;
          const randomAmount = Math.floor(Math.random() * (max - min + 1)) + min;

          console.log(`Generated random coin amount: ${randomAmount} (range: ${min}-${max})`);

          // Update the reward data with the random amount
          processedReward.reward_data = {
            ...rewardData,
            amount: randomAmount,
            title: `${randomAmount} Coins`
          };
        } else {
          console.log('Coin reward does not have a valid amount range:', rewardData);
          // Ensure there's at least some amount
          if (!rewardData.amount || rewardData.amount === 0) {
            processedReward.reward_data = {
              ...rewardData,
              amount: 50, // Default amount
              title: '50 Coins'
            };
          }
        }
      } else if (reward.reward_type === 'item') {
        // If quantity is a range, generate a random value
        if (rewardData && rewardData.quantity && typeof rewardData.quantity === 'object' &&
            rewardData.quantity.min !== undefined && rewardData.quantity.max !== undefined) {
          const min = rewardData.quantity.min;
          const max = rewardData.quantity.max;
          const randomQuantity = Math.floor(Math.random() * (max - min + 1)) + min;

          console.log(`Generated random item quantity: ${randomQuantity} (range: ${min}-${max})`);

          // Update the reward data with the random quantity
          processedReward.reward_data = {
            ...rewardData,
            quantity: randomQuantity
          };
        } else {
          console.log('Item reward does not have a valid quantity range:', rewardData);
        }
      }

      return processedReward;
    });

    return processedRewards;
  }

  /**
   * Format rewards for display in the view
   * @param {Array} rewards - Array of reward objects
   * @returns {Array} - Formatted rewards for display
   */
  static formatRewardsForView(rewards) {
    if (!rewards || !Array.isArray(rewards)) {
      console.error('Invalid rewards data passed to formatRewardsForView:', rewards);
      return [];
    }

    return rewards.map(reward => {
      if (!reward) {
        console.error('Null or undefined reward object found in rewards array');
        return null;
      }

      // Parse reward_data if it's a string, or use an empty object if undefined
      let rewardData = {};

      try {
        if (typeof reward.reward_data === 'string') {
          rewardData = JSON.parse(reward.reward_data);
        } else if (reward.reward_data) {
          rewardData = reward.reward_data;
        } else if (typeof reward.data === 'string') {
          rewardData = JSON.parse(reward.data);
        } else if (reward.data) {
          rewardData = reward.data;
        }
      } catch (e) {
        console.error('Error parsing reward data:', e);
        // Continue with empty object
      }

      // Create a formatted reward object
      const formattedReward = {
        id: reward.reward_id || reward.id || `reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: reward.reward_type || reward.type || 'generic',
        rarity: reward.rarity || 'common',
        data: rewardData // Always defined, at minimum an empty object
      };

      // Add icon based on reward type
      switch (formattedReward.type) {
        case 'monster':
          formattedReward.icon = 'fas fa-dragon';
          break;
        case 'item':
          formattedReward.icon = 'fas fa-box';
          break;
        case 'coin':
          formattedReward.icon = 'fas fa-coins';
          break;
        case 'level':
          formattedReward.icon = 'fas fa-level-up-alt';
          break;
        default:
          formattedReward.icon = 'fas fa-gift';
      }

      return formattedReward;
    }).filter(Boolean); // Remove any null entries
  }

  /**
   * Process a single reward claim
   * @param {Object} reward - Reward object
   * @param {string|number} trainerId - Trainer ID or 'random'
   * @param {Array} trainers - Array of trainer objects
   * @param {string} source - Source of the reward (game_corner, activity, etc.)
   * @returns {Object} - Result of the claim operation
   */
  static async processRewardClaim(reward, trainerId, trainers, source) {
    try {
      // Validate inputs
      if (!reward || !reward.type) {
        return { success: false, message: 'Invalid reward data' };
      }

      if (!trainers || !Array.isArray(trainers) || trainers.length === 0) {
        return { success: false, message: 'No trainers available' };
      }

      // Select a trainer
      let selectedTrainer;
      // For game corner, always select random trainer
      if (source === 'game_corner' || trainerId === 'random') {
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
        console.log('Randomly selected trainer:', {
          index: randomIndex,
          totalTrainers: trainers.length
        });
      } else {
        // For other sources, find the specified trainer
        selectedTrainer = trainers.find(t => String(t.id) === String(trainerId));
      }

      // Validate selected trainer
      if (!selectedTrainer || !selectedTrainer.id || !selectedTrainer.name) {
        console.error('Invalid trainer selection:', { 
          trainerId, 
          source,
          selectedTrainer,
          trainersCount: trainers.length 
        });
        return { success: false, message: 'Invalid trainer selection' };
      }

      console.log('Selected trainer:', {
        id: selectedTrainer.id,
        name: selectedTrainer.name,
        source: source
      });

      // Process the reward based on type
      const rewardData = typeof reward.data === 'string' ? JSON.parse(reward.data) : (reward.data || {});

      switch (reward.type) {
        case 'coin':
          // Add coins to the trainer's balance
          const coinAmount = rewardData.amount || 0;
          if (coinAmount <= 0) {
            return { success: false, message: 'Invalid coin amount' };
          }

          await Trainer.update(selectedTrainer.id, {
            currency_amount: (selectedTrainer.currency_amount || 0) + coinAmount,
            total_earned_currency: (selectedTrainer.total_earned_currency || 0) + coinAmount
          });

          return {
            success: true,
            message: `${coinAmount} coins added to ${selectedTrainer.name}`,
            trainerName: selectedTrainer.name,
            trainerId: selectedTrainer.id
          };

        case 'level':
          // Add levels to the trainer or monster
          const levels = rewardData.levels || 1;

          if (rewardData.target === 'trainer') {
            // Level up the trainer
            await Trainer.update(selectedTrainer.id, {
              level: (selectedTrainer.level || 1) + levels
            });

            return {
              success: true,
              message: `${selectedTrainer.name} gained ${levels} level(s)`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id
            };
          } else if (rewardData.monsterId) {
            // Level up a specific monster
            const monster = await Monster.getById(rewardData.monsterId);

            if (!monster) {
              return { success: false, message: 'Monster not found' };
            }

            // Verify monster belongs to the trainer
            if (monster.trainer_id !== selectedTrainer.id) {
              return { success: false, message: 'Monster does not belong to this trainer' };
            }

            // Level up the monster
            await Monster.update(rewardData.monsterId, {
              level: (monster.level || 1) + levels
            });

            return {
              success: true,
              message: `${monster.name || 'Monster'} gained ${levels} level(s)`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id
            };
          } else {
            return { success: false, message: 'Invalid level reward target' };
          }

        case 'item':
          // Add item to the trainer's inventory
          const itemName = rewardData.name || '';
          const itemCategory = rewardData.category || 'general';
          const itemQuantity = rewardData.quantity || 1;

          if (!itemName) {
            return { success: false, message: 'Invalid item name' };
          }

          // Update the trainer's inventory
          await Trainer.updateInventoryItem(
            selectedTrainer.id,
            `inv_${itemCategory}`,
            itemName,
            itemQuantity
          );

          return {
            success: true,
            message: `${itemQuantity} ${itemName} added to ${selectedTrainer.name}'s inventory`,
            trainerName: selectedTrainer.name,
            trainerId: selectedTrainer.id
          };

        case 'monster':
          try {
            console.log('=== START MONSTER REWARD PROCESSING ===');
            console.log('Initial reward data:', JSON.stringify(rewardData, null, 2));
            
            // Prepare roller options with more specific defaults
            const rollerOptions = {
              overrideParams: {
                minSpecies: 1,
                maxSpecies: 1,  // Changed to 1 to ensure single species
                minType: 1,
                maxType: 2,
                species: rewardData.species || ['Pokemon'],  // Default to Pokemon if not specified
                types: rewardData.types || []
              },
              filters: {
                pokemon: {
                  rarity: rewardData.filters?.pokemon?.rarity || ['Common', 'Uncommon'],
                  stage: rewardData.filters?.pokemon?.stage || ['Base Stage', "Doesn't Evolve"]
                },
                digimon: {
                  stage: rewardData.filters?.digimon?.stage || ['Rookie']
                },
                yokai: {
                  rank: rewardData.filters?.yokai?.rank || ['E', 'D']
                },
                includeSpecies: rewardData.species || ['Pokemon'],
                excludeSpecies: []
              },
              minLevel: rewardData.minLevel || 1,
              maxLevel: rewardData.maxLevel || 10
            };

            console.log('Prepared roller options:', JSON.stringify(rollerOptions, null, 2));
            
            // Use MonsterService for rolling
            const monsterService = require('./MonsterService');
            console.log('Attempting to roll monster using MonsterService...');
            
            let newMonster = await monsterService.rollOne(rollerOptions);
            console.log('Monster roll result:', JSON.stringify(newMonster, null, 2));

            if (!newMonster || !newMonster.species1) {
              throw new Error('Failed to roll valid monster');
            }

            // Create the monster in database with complete data
            const monsterToCreate = {
              trainer_id: selectedTrainer.id,
              name: newMonster.species1,
              species1: newMonster.species1,
              level: newMonster.level || rollerOptions.minLevel,
              type1: newMonster.type1,
              type2: newMonster.type2,
              attribute: newMonster.attribute || 'Data',
              source: source || 'reward',
              obtained_date: new Date(),
              // Include any additional data from the monster roll
              ...newMonster
            };

            console.log('Creating monster in database:', JSON.stringify(monsterToCreate, null, 2));
            const createdMonster = await Monster.create(monsterToCreate);

            if (!createdMonster) {
              throw new Error('Failed to create monster in database');
            }

            console.log('=== END MONSTER REWARD PROCESSING - SUCCESS ===');
            return {
              success: true,
              message: `${createdMonster.name} added to ${selectedTrainer.name}'s collection`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id,
              monsterId: createdMonster.id,
              monsterData: createdMonster
            };

          } catch (error) {
            console.error('=== MONSTER REWARD PROCESSING FAILED ===');
            console.error('Error details:', error);
            console.error('Stack trace:', error.stack);
            
            // Create a more interesting fallback monster
            const fallbackMonster = {
              trainer_id: selectedTrainer.id,
              name: 'Eevee',
              species1: 'Eevee',
              level: rewardData.minLevel || 1,
              type1: 'Normal',
              type2: null,
              attribute: 'Data',
              source: source || 'reward',
              obtained_date: new Date()
            };

            console.log('Creating fallback monster:', JSON.stringify(fallbackMonster, null, 2));
            const createdFallback = await Monster.create(fallbackMonster);
            
            return {
              success: true,
              message: `${createdFallback.name} added to ${selectedTrainer.name}'s collection`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id,
              monsterId: createdFallback.id,
              monsterData: createdFallback
            };
          }

        default:
          return { success: false, message: 'Unsupported reward type' };
      }
    } catch (error) {
      console.error('Error processing reward claim:', error);
      return { success: false, message: 'Error processing reward: ' + error.message };
    }
  }

  /**
   * Generate rewards based on activity parameters
   * @param {string} source - Source of the rewards (game_corner, garden, farm, pirates_dock)
   * @param {Object} params - Parameters for reward generation
   * @returns {Array} - Generated rewards
   */
  static async generateRewards(source, params = {}) {
    const rewards = [];

    // Common parameters
    const productivityScore = params.productivityScore || 100;
    const timeSpent = params.timeSpent || 0; // in minutes
    const difficulty = params.difficulty || 'normal';

    // Base reward counts based on difficulty
    let coinRewardCount = 1;
    let itemRewardCount = 0;
    let monsterRewardCount = 0;
    let levelRewardCount = 0;

    // Adjust reward counts based on difficulty
    switch (difficulty) {
      case 'easy':
        itemRewardCount = Math.random() < 0.5 ? 1 : 0;
        break;
      case 'normal':
        itemRewardCount = 1;
        levelRewardCount = Math.random() < 0.3 ? 1 : 0;
        break;
      case 'hard':
        itemRewardCount = Math.floor(Math.random() * 2) + 1; // 1-2
        levelRewardCount = Math.random() < 0.5 ? 1 : 0;
        monsterRewardCount = Math.random() < 0.2 ? 1 : 0;
        break;
      default:
        break;
    }

    // Adjust based on time spent
    if (timeSpent > 30) {
      itemRewardCount += Math.floor(timeSpent / 30);
    }

    // Cap reward counts
    itemRewardCount = Math.min(itemRewardCount, 3);
    monsterRewardCount = Math.min(monsterRewardCount, 1);
    levelRewardCount = Math.min(levelRewardCount, 2);

    // Generate coin reward
    const coinReward = {
      id: 'coin-' + Date.now(),
      type: 'coin',
      reward_type: 'coin',
      rarity: 'common',
      reward_data: {
        amount: {
          min: 50,
          max: 200
        },
        title: 'Coins'
      }
    };
    rewards.push(coinReward);

    // Generate item rewards
    for (let i = 0; i < itemRewardCount; i++) {
      // Get random item from database or use predefined items
      let itemRarity = 'common';

      // Determine rarity based on productivity and random chance
      const rarityRoll = Math.random() * 100;
      if (rarityRoll < 10 && productivityScore > 80) {
        itemRarity = 'rare';
      } else if (rarityRoll < 30 && productivityScore > 60) {
        itemRarity = 'uncommon';
      }

      // Create item reward
      const itemReward = {
        id: 'item-' + Date.now() + '-' + i,
        type: 'item',
        reward_type: 'item',
        rarity: itemRarity,
        reward_data: {
          name: this.getRandomItemForSource(source, itemRarity),
          quantity: {
            min: 1,
            max: 3
          },
          category: 'general'
        }
      };
      rewards.push(itemReward);
    }

    // Generate level rewards
    for (let i = 0; i < levelRewardCount; i++) {
      const levelReward = {
        id: 'level-' + Date.now() + '-' + i,
        type: 'level',
        reward_type: 'level',
        rarity: 'uncommon',
        reward_data: {
          levels: 1,
          target: 'trainer',
          title: 'Trainer Level Up'
        }
      };
      rewards.push(levelReward);
    }

    // Generate monster rewards
    for (let i = 0; i < monsterRewardCount; i++) {
      // Determine monster rarity based on productivity
      let monsterRarity = 'common';
      let types = [];

      // Set types based on source
      switch (source) {
        case 'garden':
          types = ['Grass', 'Bug'];
          break;
        case 'farm':
          types = ['Normal', 'Ground'];
          break;
        case 'pirates_dock':
          types = ['Water', 'Dark'];
          break;
        default:
          types = ['Normal'];
      }

      // Determine rarity based on productivity and random chance
      const rarityRoll = Math.random() * 100;
      if (rarityRoll < 1 && productivityScore > 95) {
        monsterRarity = 'rare';
      } else if (rarityRoll < 20 && productivityScore > 75) {
        monsterRarity = 'uncommon';
      }

      // Create monster reward
      const monsterReward = {
        id: 'monster-' + Date.now() + '-' + i,
        type: 'monster',
        reward_type: 'monster',
        rarity: monsterRarity,
        reward_data: {
          species: ['Pokemon', 'Digimon'],
          types: types,
          minLevel: 1,
          maxLevel: 10,
          filters: {
            pokemon: { rarity: this.mapRarityToPokeRarity(monsterRarity) },
            digimon: { stage: this.mapRarityToDigiStage(monsterRarity) }
          }
        }
      };
      
      rewards.push(monsterReward);
    }

    // Process rewards to generate random values
    return await this.processRewards(rewards);
  }

  /**
   * Map reward rarity to Pokemon rarity
   * @param {string} rarity - Reward rarity
   * @returns {string} - Pokemon rarity
   */
  static mapRarityToPokeRarity(rarity) {
    switch (rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'epic': return 'Very Rare';
      case 'legendary': return 'Legendary';
      default: return 'Common';
    }
  }

  /**
   * Map reward rarity to Digimon stage
   * @param {string} rarity - Reward rarity
   * @returns {Array} - Digimon stages
   */
  static mapRarityToDigiStage(rarity) {
    switch (rarity) {
      case 'common': return ['Rookie'];
      case 'uncommon': return ['Rookie', 'Champion'];
      case 'rare': return ['Champion', 'Ultimate'];
      case 'epic': return ['Ultimate'];
      case 'legendary': return ['Mega'];
      default: return ['Rookie'];
    }
  }

  /**
   * Get a random item name for a source
   * @param {string} source - Source of the rewards
   * @param {string} rarity - Item rarity
   * @returns {string} - Random item name
   */
  static getRandomItemForSource(source, rarity) {
    // Define items by source and rarity
    const items = {
      garden: {
        common: ['Oran Berry', 'Cheri Berry', 'Pecha Berry'],
        uncommon: ['Sitrus Berry', 'Lum Berry', 'Leppa Berry'],
        rare: ['Miracle Seed', 'Big Root', 'Rose Incense']
      },
      farm: {
        common: ['Potion', 'Antidote', 'Awakening'],
        uncommon: ['Super Potion', 'Revive', 'Full Heal'],
        rare: ['Rare Candy', 'PP Up', 'Protein']
      },
      pirates_dock: {
        common: ['Poké Ball', 'Net Ball', 'Dive Ball'],
        uncommon: ['Great Ball', 'Lure Ball', 'Mystic Water'],
        rare: ['Ultra Ball', 'Water Stone', 'Dragon Scale']
      },
      game_corner: {
        common: ['Potion', 'Poké Ball', 'Repel'],
        uncommon: ['Super Potion', 'Great Ball', 'Super Repel'],
        rare: ['Rare Candy', 'Ultra Ball', 'Max Repel']
      }
    };

    // Get items for the source and rarity
    const sourceItems = items[source] || items.game_corner;
    const rarityItems = sourceItems[rarity] || sourceItems.common;

    // Return a random item
    return rarityItems[Math.floor(Math.random() * rarityItems.length)];
  }
}

module.exports = RewardSystem;






