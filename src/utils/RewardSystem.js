/**
 * Centralized Reward System
 * Handles reward generation, processing, and claiming for all game activities
 */

const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const Item = require('../models/Item');
const MonsterRoller = require('./MonsterRoller');
const pool = require('../db');
const MissionService = require('./MissionService');
const GardenHarvest = require('../models/GardenHarvest');
const BossService = require('../services/BossService');

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

    console.log('Formatting rewards for view:', JSON.stringify(rewards, null, 2));

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
        reward_type: reward.reward_type || reward.type || 'generic', // Ensure both type and reward_type are set
        rarity: reward.rarity || 'common',
        data: rewardData, // Always defined, at minimum an empty object
        reward_data: rewardData // Ensure both data and reward_data are set
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

      // For coin rewards, ensure amount is properly set
      if (formattedReward.type === 'coin') {
        if (typeof rewardData.amount === 'number') {
          formattedReward.amount = rewardData.amount;
        } else if (rewardData.amount && typeof rewardData.amount === 'object') {
          const min = rewardData.amount.min || 50;
          const max = rewardData.amount.max || 150;
          const randomAmount = Math.floor(Math.random() * (max - min + 1)) + min;
          formattedReward.amount = randomAmount;
          formattedReward.data.amount = randomAmount;
          formattedReward.reward_data.amount = randomAmount;
        } else {
          // Default amount if none is specified
          formattedReward.amount = 50;
          formattedReward.data.amount = 50;
          formattedReward.reward_data.amount = 50;
        }
      }

      // For level rewards, ensure levels is properly set
      if (formattedReward.type === 'level') {
        if (typeof rewardData.levels === 'number') {
          formattedReward.levels = rewardData.levels;
        } else {
          // Default level amount if none is specified
          formattedReward.levels = 1;
          formattedReward.data.levels = 1;
          formattedReward.reward_data.levels = 1;
        }
      }

      console.log('Formatted reward:', JSON.stringify(formattedReward, null, 2));
      return formattedReward;
    }).filter(Boolean); // Remove any null entries
  }

  /**
   * Process a single reward claim
   * @param {Object} reward - Reward object
   * @param {string|number} trainerId - Trainer ID or 'random'
   * @param {Array} trainers - Array of trainer objects
   * @param {string} source - Source of the reward (game_corner, activity, etc.)
   * @param {Object} options - Additional options
   * @param {string} options.monsterName - Custom name for monster rewards
   * @param {string} options.targetMonsterId - Target monster ID for level rewards
   * @returns {Object} - Result of the claim operation
   */
  static async processRewardClaim(reward, trainerId, trainers, source, options = {}) {
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
      // For game corner, always select random trainer regardless of trainerId
      if (source === 'game_corner') {
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
        console.log('Randomly selected trainer for game corner reward:', {
          index: randomIndex,
          totalTrainers: trainers.length
        });
      } else if (trainerId === 'random') {
        // For other sources, only use random if explicitly requested
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
        console.log('Randomly selected trainer (explicit random):', {
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
          console.log('Processing coin reward:', JSON.stringify(reward, null, 2));

          // Extract coin amount from different possible structures
          let coinAmount = 0;

          // Try to get amount from different possible structures
          if (reward.amount && !isNaN(parseInt(reward.amount))) {
            coinAmount = parseInt(reward.amount);
            console.log('Using direct amount property:', coinAmount);
          } else if (rewardData.amount && !isNaN(parseInt(rewardData.amount))) {
            coinAmount = parseInt(rewardData.amount);
            console.log('Using rewardData.amount property:', coinAmount);
          } else if (reward.reward_data && reward.reward_data.amount && !isNaN(parseInt(reward.reward_data.amount))) {
            coinAmount = parseInt(reward.reward_data.amount);
            console.log('Using reward_data.amount property:', coinAmount);
          } else if (reward.quantity && !isNaN(parseInt(reward.quantity))) {
            coinAmount = parseInt(reward.quantity);
            console.log('Using quantity property as fallback:', coinAmount);
          } else {
            // Default amount if all else fails
            coinAmount = 10;
            console.log('Using default amount:', coinAmount);
          }

          console.log(`Final extracted coin amount: ${coinAmount}`);

          // Ensure amount is valid
          if (isNaN(coinAmount) || coinAmount <= 0) {
            coinAmount = 10;
            console.log('Amount was invalid, using default: 10');
          }

          console.log(`Updating currency: current=${selectedTrainer.currency_amount || 0}, adding=${coinAmount}`);

          // Use Trainer.addCoins method which is more reliable
          const success = await Trainer.addCoins(selectedTrainer.id, coinAmount);

          if (!success) {
            console.log('Error: Trainer.addCoins returned false');
            return { success: false, message: 'Failed to add coins' };
          }

          return {
            success: true,
            message: `${coinAmount} coins added to ${selectedTrainer.name}`,
            trainerName: selectedTrainer.name,
            trainerId: selectedTrainer.id
          };

        case 'level':
          // Add levels to the trainer or monster
          const levels = rewardData.levels || 1;

          // Check if we have a target monster ID from options
          const targetMonsterId = options?.targetMonsterId || rewardData.monsterId;

          if (targetMonsterId) {
            // Level up a specific monster
            console.log('Leveling up monster with ID:', targetMonsterId);
            const monster = await Monster.getById(targetMonsterId);

            if (!monster) {
              return { success: false, message: 'Monster not found' };
            }

            // Verify monster belongs to the trainer
            if (monster.trainer_id !== selectedTrainer.id) {
              return { success: false, message: 'Monster does not belong to this trainer' };
            }

            // Level up the monster
            const newLevel = (monster.level || 1) + levels;
            await Monster.update(targetMonsterId, {
              level: newLevel
            });

            return {
              success: true,
              message: `${monster.name || 'Monster'} gained ${levels} level(s) and is now level ${newLevel}`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id,
              monsterId: targetMonsterId,
              monsterName: monster.name,
              newLevel: newLevel
            };
          } else if (rewardData.target === 'monster' && !targetMonsterId) {
            return { success: false, message: 'No monster selected for level up' };
          } else {
            // Default to leveling up the trainer
            console.log('Leveling up trainer:', selectedTrainer.name);
            const newLevel = (selectedTrainer.level || 1) + levels;
            await Trainer.update(selectedTrainer.id, {
              level: newLevel
            });

            return {
              success: true,
              message: `${selectedTrainer.name} gained ${levels} level(s) and is now level ${newLevel}`,
              trainerName: selectedTrainer.name,
              trainerId: selectedTrainer.id,
              newLevel: newLevel
            };
          }

        case 'item':
          // Add item to the trainer's inventory
          console.log('Processing item reward:', JSON.stringify(reward, null, 2));

          // Extract item data from different possible structures
          let itemName = '';
          let itemCategory = 'general';
          let itemQuantity = 1;

          // First try direct properties (highest priority)
          if (reward.name) {
            itemName = reward.name;
            itemCategory = reward.category || 'BERRIES';
            itemQuantity = reward.quantity || 1;
            console.log('Using direct properties for item reward');
          }
          // Then try reward_data (second priority)
          else if (reward.reward_data && reward.reward_data.name) {
            itemName = reward.reward_data.name;
            itemCategory = reward.reward_data.category || 'BERRIES';
            itemQuantity = reward.reward_data.quantity || 1;
            console.log('Using reward_data for item reward');
          }
          // Then try rewardData (third priority)
          else if (rewardData.name) {
            itemName = rewardData.name;
            itemCategory = rewardData.category || 'general';
            itemQuantity = rewardData.quantity || 1;
            console.log('Using rewardData for item reward');
          }
          // Then try nested reward_data (fourth priority)
          else if (rewardData.reward_data && rewardData.reward_data.name) {
            itemName = rewardData.reward_data.name;
            itemCategory = rewardData.reward_data.category || 'general';
            itemQuantity = rewardData.reward_data.quantity || 1;
            console.log('Using nested reward_data for item reward');
          }

          console.log(`Extracted item data: name=${itemName}, category=${itemCategory}, quantity=${itemQuantity}`);

          if (!itemName) {
            console.error('Failed to extract item name from reward:', JSON.stringify(reward, null, 2));
            return { success: false, message: 'Invalid item name' };
          }

          // For berry rewards, ensure the category is correct
          if (reward.id && reward.id.startsWith('berry-')) {
            itemCategory = 'BERRIES';
            console.log('Corrected category to BERRIES for berry reward');
          }

          // Update the trainer's inventory
          // Check if the category already has the inv_ prefix
          let categoryWithPrefix = itemCategory.startsWith('inv_') ? itemCategory : `inv_${itemCategory}`;

          // Force the category to be inv_berries (lowercase) for berry rewards
          if (reward.id && reward.id.startsWith('berry-')) {
            console.log('Forcing category to inv_berries (lowercase) for berry reward');
            categoryWithPrefix = 'inv_berries';
          }

          console.log(`Updating inventory with category: ${categoryWithPrefix}, name: ${itemName}, quantity: ${itemQuantity}`);

          await Trainer.updateInventoryItem(
            selectedTrainer.id,
            categoryWithPrefix,
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
                minSpecies: rewardData.minSpecies || 1,
                maxSpecies: rewardData.maxSpecies || 1,  // Default to 1 to ensure single species
                minType: rewardData.minType || 1,
                maxType: rewardData.maxType || 2,
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

            // Check if we have a species display from the rewards view
            console.log('Checking for species display in reward data:', JSON.stringify(reward, null, 2));

            // Get the species display from the reward object
            const speciesDisplay = reward.speciesDisplay || reward.name || newMonster.species1;
            console.log('Using species display:', speciesDisplay);

            // Parse the species display into individual species
            let speciesParts = speciesDisplay.split('/');
            console.log('Species parts:', speciesParts);

            // Get custom monster name if provided
            const customName = options?.monsterName || speciesDisplay;
            console.log('Using monster name:', customName);

            // Create the monster in database with complete data
            const monsterToCreate = {
              trainer_id: selectedTrainer.id,
              name: customName, // Use custom name if provided, otherwise use species display
              species1: speciesParts[0] || newMonster.species1,
              species2: speciesParts.length > 1 ? speciesParts[1] : (newMonster.species2 || null),
              species3: speciesParts.length > 2 ? speciesParts[2] : (newMonster.species3 || null),
              level: newMonster.level || rollerOptions.minLevel,
              type1: newMonster.type1,
              type2: newMonster.type2,
              type3: newMonster.type3,
              attribute: newMonster.attribute || 'Data',
              // Use date_met instead of obtained_date
              date_met: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
              box_number: 1, // Put in first box by default
              where_met: source || 'reward' // Use where_met instead of source
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

            // Check if we have a species display from the rewards view
            console.log('Checking for species display in reward data for fallback:', JSON.stringify(reward, null, 2));

            // Get the species display from the reward object
            const fallbackSpeciesDisplay = reward.speciesDisplay || reward.name || 'Eevee';
            console.log('Using species display for fallback:', fallbackSpeciesDisplay);

            // Parse the species display into individual species
            let fallbackSpeciesParts = fallbackSpeciesDisplay.split('/');
            console.log('Fallback species parts:', fallbackSpeciesParts);

            // Create a more interesting fallback monster
            const fallbackMonster = {
              trainer_id: selectedTrainer.id,
              name: fallbackSpeciesDisplay, // Use the species display as the name
              species1: fallbackSpeciesParts[0] || 'Eevee',
              species2: fallbackSpeciesParts.length > 1 ? fallbackSpeciesParts[1] : null,
              species3: fallbackSpeciesParts.length > 2 ? fallbackSpeciesParts[2] : null,
              level: rewardData.minLevel || 1,
              type1: 'Normal',
              type2: null,
              type3: null,
              attribute: 'Data',
              // Use date_met instead of obtained_date
              date_met: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
              box_number: 1, // Put in first box by default
              where_met: source || 'reward' // Use where_met instead of source
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
    // Handle garden-specific rewards
    if (source === 'garden' && params.gardenPoints) {
      return await this.generateGardenRewards(params);
    }

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
   * Generate rewards specifically for Garden activity
   * @param {Object} params - Garden parameters
   * @param {number} params.gardenPoints - Points earned from garden activity
   * @returns {Promise<Array>} - Array of generated rewards
   */
  static async generateGardenRewards(params) {
    try {
      const rewards = [];
      const gardenPoints = params.gardenPoints || 1;

      // Base coin reward
      const coinAmount = gardenPoints * 50;
      const coinReward = {
        id: `coin-${Date.now()}`,
        type: 'coin',
        reward_type: 'coin',
        rarity: 'common',
        reward_data: {
          amount: coinAmount,
          title: `${coinAmount} Coins`
        }
      };
      rewards.push(coinReward);

      // Berry rewards (40% chance per point) - increased chance for more berries
      for (let i = 0; i < gardenPoints; i++) {
        if (Math.random() < 0.4) {
          const berryRarity = Math.random() < 0.1 ? 'rare' :
                          Math.random() < 0.3 ? 'uncommon' :
                          'common';

          // Get berries from the database
          try {
            // Get all items with category 'BERRIES'
            const berryItems = await Item.getByCategory('BERRIES');

            if (berryItems && berryItems.length > 0) {
              // Filter by rarity if needed
              let filteredBerries = berryItems;
              if (berryRarity === 'rare') {
                filteredBerries = berryItems.filter(item => parseInt(item.rarity) >= 3);
              } else if (berryRarity === 'uncommon') {
                filteredBerries = berryItems.filter(item => parseInt(item.rarity) === 2);
              } else {
                filteredBerries = berryItems.filter(item => parseInt(item.rarity) === 1);
              }

              // If no berries match the rarity, use all berries
              if (filteredBerries.length === 0) {
                filteredBerries = berryItems;
              }

              // Select a random berry
              const randomBerry = filteredBerries[Math.floor(Math.random() * filteredBerries.length)];

              const quantity = Math.floor(Math.random() * 3) + 1;
              const itemReward = {
                id: `berry-${Date.now()}-${i}`,
                type: 'item',
                reward_type: 'item',
                rarity: berryRarity,
                // Add direct properties for compatibility with older code
                name: randomBerry.name,
                category: 'BERRIES',
                quantity: quantity,
                // Also include in reward_data for newer code
                reward_data: {
                  name: randomBerry.name,
                  quantity: quantity,
                  category: 'BERRIES'
                }
              };
              rewards.push(itemReward);
            } else {
              // Fallback to hardcoded berries if database query fails
              console.log('No berry items found in database, using fallback');
              const berryName = this.getRandomItemForSource('garden', berryRarity);
              const quantity = Math.floor(Math.random() * 3) + 1;
              const itemReward = {
                id: `berry-${Date.now()}-${i}`,
                type: 'item',
                reward_type: 'item',
                rarity: berryRarity,
                // Add direct properties for compatibility with older code
                name: berryName,
                category: 'BERRIES',
                quantity: quantity,
                // Also include in reward_data for newer code
                reward_data: {
                  name: berryName,
                  quantity: quantity,
                  category: 'BERRIES'
                }
              };
              rewards.push(itemReward);
            }
          } catch (error) {
            console.error('Error fetching berry items from database:', error);
            // Fallback to hardcoded berries
            const itemReward = {
              id: `berry-${Date.now()}-${i}`,
              type: 'item',
              reward_type: 'item',
              rarity: berryRarity,
              reward_data: {
                name: this.getRandomItemForSource('garden', berryRarity),
                quantity: Math.floor(Math.random() * 3) + 1,
                category: 'BERRIES'
              }
            };
            rewards.push(itemReward);
          }
        }
      }

      // Garden-themed Monster rewards (15% chance per point)
      for (let i = 0; i < gardenPoints; i++) {
        if (Math.random() < 0.15) {
          const rarityRoll = Math.random() * 100;
          let monsterRarity;

          if (rarityRoll < 0.01) {          // 0.01% legendary
            monsterRarity = 'legendary';
          } else if (rarityRoll < 1) {      // 1% epic
            monsterRarity = 'epic';
          } else if (rarityRoll < 10) {     // 10% rare
            monsterRarity = 'rare';
          } else if (rarityRoll < 30) {     // 30% uncommon
            monsterRarity = 'uncommon';
          } else {                          // 59% common
            monsterRarity = 'common';
          }

          // Garden-themed monster with specific types: grass, bug, flying, ground, rock, normal
          // Limit to max 2 species and max 3 types
          const monsterReward = {
            id: `monster-${Date.now()}-${i}`,
            type: 'monster',
            reward_type: 'monster',
            rarity: monsterRarity,
            reward_data: {
              // Species information
              species: ['Pokemon', 'Digimon', 'Yokai'], // Include all three monster types
              species1: 'Pokemon', // Default species1 field

              // Type information
              types: ['Grass', 'Bug', 'Flying', 'Ground', 'Rock', 'Normal'], // Garden-themed types - these are the allowed types, not all will be used
              type1: 'Grass', // Default type1 to ensure it's always displayed

              // Species and type limits
              minSpecies: 1,
              maxSpecies: 2, // Limit to max 2 species for garden monsters
              minType: 1,
              maxType: 3, // Limit to max 3 types for garden monsters

              // Level information
              minLevel: 1,
              maxLevel: 5,
              level: 1, // Default level

              // Filters for the monster roller
              filters: {
                pokemon: {
                  rarity: this.mapRarityToPokeRarity(monsterRarity),
                  // These are the types the monster can have, not all will be used
                  types: ['Grass', 'Bug', 'Flying', 'Ground', 'Rock', 'Normal']
                }
              },

              // Ensure we have an attribute
              attribute: 'Data',

              // Add a name field for fallback
              name: 'Garden Monster'
            }
          };
          rewards.push(monsterReward);
        }
      }

      // If no rewards were generated, add a fallback coin reward
      if (rewards.length === 0) {
        rewards.push({
          id: `coin-fallback-${Date.now()}`,
          type: 'coin',
          reward_type: 'coin',
          rarity: 'common',
          reward_data: {
            amount: 50,
            title: '50 Coins'
          }
        });
      }

      return rewards;
    } catch (error) {
      console.error('Error generating Garden rewards:', error);
      // Return minimum fallback reward
      return [{
        id: `coin-error-${Date.now()}`,
        type: 'coin',
        reward_type: 'coin',
        rarity: 'common',
        reward_data: {
          amount: 50,
          title: '50 Coins'
        }
      }];
    }
  }

  /**
   * Generate a random reward for a specific source
   * @param {string} source - Source of the reward (garden, farm, game_corner, etc.)
   * @returns {Promise<Object>} - Random reward object
   */
  static async generateRandomReward(source) {
    try {
      // Determine reward type (coin, item, monster)
      const rewardTypes = ['coin', 'item', 'monster'];
      const weights = [0.6, 0.3, 0.1]; // 60% coin, 30% item, 10% monster

      // Select reward type based on weights
      let rewardType = 'coin';
      const rand = Math.random();
      let cumulativeWeight = 0;

      for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i];
        if (rand < cumulativeWeight) {
          rewardType = rewardTypes[i];
          break;
        }
      }

      // Generate reward based on type
      switch (rewardType) {
        case 'coin':
          // Generate coin reward (50-200 coins)
          return {
            id: `coin-${Date.now()}`,
            type: 'coin',
            reward_type: 'coin',
            rarity: 'common',
            reward_data: {
              amount: Math.floor(Math.random() * 151) + 50, // 50-200 coins
              title: 'Garden Coins'
            }
          };

        case 'item':
          // Determine item rarity
          const itemRarity = Math.random() < 0.1 ? 'rare' :
                          Math.random() < 0.4 ? 'uncommon' : 'common';

          // Get random item for source and rarity
          const itemName = this.getRandomItemForSource(source, itemRarity);
          return {
            id: `item-${Date.now()}`,
            type: 'item',
            reward_type: 'item',
            rarity: itemRarity,
            reward_data: {
              name: itemName,
              quantity: 1,
              title: itemName
            }
          };

        case 'monster':
          // Generate monster reward
          const monsterRarity = Math.random() < 0.05 ? 'rare' :
                             Math.random() < 0.3 ? 'uncommon' : 'common';

          // Garden-themed types
          const types = ['Grass', 'Bug', 'Flying', 'Ground', 'Rock', 'Normal'];

          return {
            id: `monster-${Date.now()}`,
            type: 'monster',
            reward_type: 'monster',
            rarity: monsterRarity,
            reward_data: {
              species: ['Pokemon', 'Digimon'],
              types: types,
              minLevel: 1,
              maxLevel: 5,
              filters: {
                pokemon: { rarity: this.mapRarityToPokeRarity(monsterRarity) },
                digimon: { stage: this.mapRarityToDigiStage(monsterRarity) }
              }
            }
          };
      }
    } catch (error) {
      console.error('Error generating random reward:', error);
      // Return a fallback coin reward
      return {
        id: `coin-fallback-${Date.now()}`,
        type: 'coin',
        reward_type: 'coin',
        rarity: 'common',
        reward_data: {
          amount: 50,
          title: '50 Coins'
        }
      };
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
        common: ['Oran Berry', 'Cheri Berry', 'Pecha Berry', 'Aspear Berry', 'Rawst Berry'],
        uncommon: ['Sitrus Berry', 'Lum Berry', 'Leppa Berry', 'Persim Berry', 'Mago Berry'],
        rare: ['Liechi Berry', 'Ganlon Berry', 'Salac Berry', 'Petaya Berry', 'Apicot Berry']
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

  /**
   * Process additional rewards for submissions and task/habit completion
   * @param {string} userId - User ID
   * @param {string} source - Source of the activity (task, habit, art, writing, reference)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result of processing additional rewards
   */
  static async processAdditionalRewards(userId, source, options = {}) {
    try {
      // Initialize result object
      const result = {
        missionProgress: null,
        gardenPoints: null,
        bossDamage: null,
        flavorText: ''
      };

      // Generate random progress amounts (1-3)
      const missionPoints = Math.floor(Math.random() * 3) + 1;
      const gardenPoints = Math.floor(Math.random() * 3) + 1;
      const bossDamage = Math.floor(Math.random() * 3) + 1;

      // 1. Update mission progress
      try {
        const missionResult = await MissionService.updateMissionProgress(userId, missionPoints);
        result.missionProgress = missionResult;

        // Add flavor text for mission progress
        if (missionResult && !missionResult.completed) {
          result.flavorText += this.getMissionFlavorText(source, missionPoints);
        } else if (missionResult && missionResult.completed) {
          result.flavorText += `Mission complete! ${missionResult.completionMessage || 'You have completed your mission!'} `;
        }
      } catch (error) {
        console.error('Error updating mission progress:', error);
      }

      // 2. Add garden harvest points
      try {
        const gardenResult = await GardenHarvest.recordHarvest(userId, gardenPoints);
        result.gardenPoints = gardenPoints;

        // Add flavor text for garden points
        result.flavorText += this.getGardenFlavorText(source, gardenPoints);
      } catch (error) {
        console.error('Error recording garden harvest:', error);
      }

      // 3. Deal damage to boss
      try {
        // Get trainer ID from user ID
        const trainerQuery = `
          SELECT id FROM trainers
          WHERE player_user_id = $1
          LIMIT 1
        `;
        const trainerResult = await pool.query(trainerQuery, [userId]);

        if (trainerResult.rows.length > 0) {
          const trainerId = trainerResult.rows[0].id;

          // Deal damage to boss
          const bossResult = await BossService.dealDamage(trainerId, source, {
            ...options,
            damageAmount: bossDamage // Override calculated damage with our random amount
          });

          result.bossDamage = bossResult;

          // Add flavor text for boss damage
          if (bossResult && bossResult.success) {
            result.flavorText += this.getBossFlavorText(source, bossDamage, bossResult.boss?.name || 'the boss');

            // Add special text if boss was defeated
            if (bossResult.boss?.is_defeated) {
              result.flavorText += `You've defeated ${bossResult.boss.name}! Check the boss page to claim your rewards. `;
            }
          }
        }
      } catch (error) {
        console.error('Error dealing damage to boss:', error);
      }

      return result;
    } catch (error) {
      console.error('Error processing additional rewards:', error);
      return {
        missionProgress: null,
        gardenPoints: null,
        bossDamage: null,
        flavorText: 'Something went wrong while processing additional rewards.'
      };
    }
  }

  /**
   * Get flavor text for mission progress
   * @param {string} source - Source of the activity
   * @param {number} points - Points added to mission progress
   * @returns {string} - Flavor text
   */
  static getMissionFlavorText(source, points) {
    const missionTexts = [
      // Task completion texts
      'Your monsters make progress on their mission. ',
      'Your team advances toward their goal. ',
      'Your monsters work together to complete their mission. ',
      // Art submission texts
      'Your artistic efforts inspire your monsters on their mission. ',
      'Your creativity fuels your monsters\'s determination. ',
      'Your artwork provides new insights for your monsters\'s mission. ',
      // Writing submission texts
      'Your writing chronicles the adventures of your monsters. ',
      'Your storytelling motivates your monsters to press on. ',
      'The tales of your monsters spread far and wide. ',
      // Reference submission texts
      'Your reference work helps document the world of monsters. ',
      'Your detailed studies aid your monsters in their quest. ',
      'Your research provides valuable information for your mission. '
    ];

    // Select a random text
    const randomIndex = Math.floor(Math.random() * missionTexts.length);
    return `${missionTexts[randomIndex]}(+${points} mission progress) `;
  }

  /**
   * Get flavor text for garden points
   * @param {string} source - Source of the activity
   * @param {number} points - Points added to garden
   * @returns {string} - Flavor text
   */
  static getGardenFlavorText(source, points) {
    const gardenTexts = [
      'Your garden flourishes with new growth. ',
      'New seeds take root in your garden. ',
      'Your plants grow stronger with your care. ',
      'The garden responds to your nurturing touch. ',
      'Fresh sprouts appear in your garden. ',
      'Your dedication to your garden bears fruit. '
    ];

    // Select a random text
    const randomIndex = Math.floor(Math.random() * gardenTexts.length);
    return `${gardenTexts[randomIndex]}(+${points} garden points) `;
  }

  /**
   * Get flavor text for boss damage
   * @param {string} source - Source of the activity
   * @param {number} damage - Amount of damage dealt
   * @param {string} bossName - Name of the boss
   * @returns {string} - Flavor text
   */
  static getBossFlavorText(source, damage, bossName) {
    const bossTexts = [
      `Your efforts weaken ${bossName}. `,
      `${bossName} takes damage from your actions. `,
      `${bossName} recoils from your attack. `,
      `Your progress strikes a blow against ${bossName}. `,
      `${bossName} is affected by your dedication. `,
      `Your accomplishments damage ${bossName}'s defenses. `
    ];

    // Select a random text
    const randomIndex = Math.floor(Math.random() * bossTexts.length);
    return `${bossTexts[randomIndex]}(${damage} damage to boss) `;
  }
}

module.exports = RewardSystem;
