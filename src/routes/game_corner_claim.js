const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const Item = require('../models/Item');

/**
 * Process a single reward
 * @param {Object} reward - Reward object
 * @param {string} trainerId - Trainer ID or 'random'
 * @param {Array} trainers - Array of trainer objects
 * @param {string} source - Source of the reward
 * @returns {Object} - Result object with success status and details
 */
async function processReward(reward, trainerId, trainers, source) {
  // Always use 'game_corner' as the source for this file
  const rewardSource = 'game_corner';
  console.log(`Processing reward with source: ${source}, forcing to: ${rewardSource}`);

  // Override the source parameter to ensure it's always 'game_corner'
  source = rewardSource;
  try {
    // Select a trainer
    let selectedTrainer;
    // For game corner, always use random assignment regardless of trainerId
    if (source === 'game_corner') {
      // Random assignment for game corner
      selectedTrainer = trainers[Math.floor(Math.random() * trainers.length)];
      console.log(`Game corner reward - randomly assigned to ${selectedTrainer.name}`);
    } else if (trainerId === 'random') {
      // Random assignment for other sources when explicitly requested
      selectedTrainer = trainers[Math.floor(Math.random() * trainers.length)];
    } else {
      // Specific trainer for non-game corner rewards
      selectedTrainer = trainers.find(t => t.id.toString() === trainerId.toString());
      if (!selectedTrainer) {
        return {
          success: false,
          message: 'Selected trainer not found'
        };
      }
    }

    // Process the reward based on type
    let result = {
      success: true,
      message: 'Reward claimed successfully',
      trainerName: selectedTrainer.name,
      trainerId: selectedTrainer.id
    };

    switch (reward.type) {
      case 'coin':
        // Add coins to the trainer
        const coinAmount = reward.data?.amount || 50;
        await Trainer.update(selectedTrainer.id, {
          currency_amount: selectedTrainer.currency_amount + coinAmount,
          total_earned_currency: selectedTrainer.total_earned_currency + coinAmount
        });
        result.message = `${coinAmount} coins added to ${selectedTrainer.name}`;
        break;

      case 'item':
        // Add item to the trainer's inventory using proper inventory management
        try {
          // Check if we have item data in the reward
          if (!reward.data || !reward.data.name) {
            return {
              success: false,
              message: 'No item data provided in reward'
            };
          }

          const itemName = reward.data.name;
          const itemQuantity = reward.data.quantity || 1;

          // Determine the appropriate inventory category based on item name
          let category = 'inv_items'; // Default category

          // First, try to get the item from the database to get its actual category
          try {
            const itemData = await Item.getById(itemName);
            if (itemData && itemData.category) {
              // Map database category to inventory category
              switch(itemData.category.toLowerCase()) {
                case 'balls':
                case 'pokeballs':
                case 'poke balls':
                  category = 'inv_balls';
                  break;
                case 'berries':
                case 'berry':
                  category = 'inv_berries';
                  break;
                case 'pastries':
                case 'pastry':
                case 'food':
                  category = 'inv_pastries';
                  break;
                case 'evolution':
                case 'evolution items':
                  category = 'inv_evolution';
                  break;
                case 'eggs':
                case 'egg':
                  category = 'inv_eggs';
                  break;
                case 'antiques':
                case 'antique':
                case 'relics':
                  category = 'inv_antiques';
                  break;
                case 'held items':
                case 'held':
                case 'helditems':
                  category = 'inv_helditems';
                  break;
                case 'seals':
                case 'seal':
                  category = 'inv_seals';
                  break;
                default:
                  category = 'inv_items';
              }
            }
          } catch (e) {
            console.log('Error getting item category from database, using name-based fallback');
          }

          // Fallback to name-based categorization if database lookup failed
          if (category === 'inv_items') {
            const itemNameLower = itemName.toLowerCase();
            if (itemNameLower.includes('ball')) {
              category = 'inv_balls';
            } else if (itemNameLower.includes('berry')) {
              category = 'inv_berries';
            } else if (itemNameLower.includes('pastry') ||
                       itemNameLower.includes('cake') ||
                       itemNameLower.includes('cookie') ||
                       itemNameLower.includes('bread') ||
                       itemNameLower.includes('pie')) {
              category = 'inv_pastries';
            } else if (itemNameLower.includes('stone') ||
                       itemNameLower.includes('evolution')) {
              category = 'inv_evolution';
            } else if (itemNameLower.includes('egg')) {
              category = 'inv_eggs';
            } else if (itemNameLower.includes('antique') ||
                       itemNameLower.includes('relic')) {
              category = 'inv_antiques';
            } else if (itemNameLower.includes('held') ||
                       itemNameLower.includes('charm') ||
                       itemNameLower.includes('band') ||
                       itemNameLower.includes('scarf')) {
              category = 'inv_helditems';
            } else if (itemNameLower.includes('seal')) {
              category = 'inv_seals';
            }
          }

          // Update the trainer's inventory
          const success = await Trainer.updateInventoryItem(
            selectedTrainer.id,
            category,
            itemName,
            itemQuantity
          );

          if (!success) {
            return {
              success: false,
              message: `Failed to add ${itemName} to ${selectedTrainer.name}'s inventory`
            };
          }

          result.message = `${itemQuantity} ${itemName}${itemQuantity > 1 ? 's' : ''} added to ${selectedTrainer.name}'s inventory`;
          result.itemName = itemName;
          result.itemQuantity = itemQuantity;
          result.itemCategory = category;
        } catch (error) {
          console.error('Error adding item to inventory:', error);
          return {
            success: false,
            message: `Error adding item to inventory: ${error.message}`
          };
        }
        break;

      case 'level':
        const levelsToAdd = reward.data?.levels || 1;

        // Check if this is a trainer level-up or monster level-up
        if (reward.subtype === 'trainer' || reward.data?.isTrainer) {
          // Use the proper API endpoint to add levels to the trainer
          try {
            // Get current trainer data
            const currentTrainer = await Trainer.getById(selectedTrainer.id);
            if (!currentTrainer) {
              return {
                success: false,
                message: `Trainer ${selectedTrainer.id} not found`
              };
            }

            // Calculate coins based on levels (50 coins per level)
            const coinsToAdd = levelsToAdd * 50;

            // Update trainer with new level and coins
            const updatedTrainer = {
              ...currentTrainer,
              level: (currentTrainer.level || 1) + levelsToAdd,
              currency_amount: currentTrainer.currency_amount + coinsToAdd,
              total_earned_currency: currentTrainer.total_earned_currency + coinsToAdd
            };

            // Save the updated trainer
            await Trainer.update(selectedTrainer.id, updatedTrainer);

            result.message = `${selectedTrainer.name} gained ${levelsToAdd} trainer level(s) and ${coinsToAdd} coins`;
            result.trainerLevelUp = true;
            result.coinsAdded = coinsToAdd;
          } catch (error) {
            console.error('Error applying trainer levels:', error);
            return {
              success: false,
              message: `Error applying trainer levels: ${error.message}`
            };
          }
        } else {
          // Add levels to a random monster using proper level-up logic
          try {
            const trainerMonsters = await Monster.getByTrainerId(selectedTrainer.id);

            if (!trainerMonsters || trainerMonsters.length === 0) {
              return {
                success: false,
                message: `No monsters found for ${selectedTrainer.name}`
              };
            }

            // Select a random monster
            const randomMonster = trainerMonsters[Math.floor(Math.random() * trainerMonsters.length)];

            // Calculate new level
            const newLevel = randomMonster.level + levelsToAdd;

            // Import MonsterInitializer to calculate stats
            const MonsterInitializer = require('../utils/MonsterInitializer');

            // Calculate new stats based on the new level
            const baseStats = MonsterInitializer.calculateBaseStats(newLevel);

            // Get current moveset
            let currentMoves = [];
            try {
              currentMoves = JSON.parse(randomMonster.moveset || '[]');
            } catch (e) {
              console.error('Error parsing moveset:', e);
              currentMoves = [];
            }

            // For now, keep the same moves (in a real implementation, you would update moves based on level)
            const updatedMoves = currentMoves;

            // Calculate coins for trainer (50 per level)
            const coinsToAdd = levelsToAdd * 50;

            // Update monster with new level, stats, and moves
            const updatedMonster = {
              ...randomMonster,
              level: newLevel,
              ...baseStats,
              moveset: JSON.stringify(updatedMoves)
            };

            // Update trainer coins
            const currentTrainer = await Trainer.getById(selectedTrainer.id);
            const updatedTrainer = {
              ...currentTrainer,
              currency_amount: currentTrainer.currency_amount + coinsToAdd,
              total_earned_currency: currentTrainer.total_earned_currency + coinsToAdd
            };

            // Save the updated monster and trainer
            await Monster.update(randomMonster.id, updatedMonster);
            await Trainer.update(selectedTrainer.id, updatedTrainer);

            result.message = `${randomMonster.name || 'Monster'} gained ${levelsToAdd} level(s) and ${selectedTrainer.name} received ${coinsToAdd} coins`;
            result.monsterName = randomMonster.name || 'Monster';
            result.monsterLevelUp = true;
            result.coinsAdded = coinsToAdd;
          } catch (error) {
            console.error('Error applying monster levels:', error);
            return {
              success: false,
              message: `Error applying monster levels: ${error.message}`
            };
          }
        }
        break;

      case 'monster':
        // Add a new monster to the trainer's collection using proper monster creation
        try {
          // Check if we have monster data in the reward
          if (!reward.data) {
            return {
              success: false,
              message: 'No monster data provided in reward'
            };
          }

          // Import MonsterService for proper monster creation
          const MonsterService = require('../utils/MonsterService');

          // Generate a default name for the monster
          const defaultName = reward.data.species || 'New Monster';

          // Create the monster using MonsterService
          const monsterData = {
            species1: reward.data.species || reward.data.species1,
            species2: reward.data.species2 || null,
            species3: reward.data.species3 || null,
            type1: reward.data.type || reward.data.type1,
            type2: reward.data.type2 || null,
            type3: reward.data.type3 || null,
            type4: reward.data.type4 || null,
            type5: reward.data.type5 || null,
            attribute: reward.data.attribute || 'Data'
          };

          // Use the proper monster creation function
          const newMonster = await MonsterService.claimMonster(monsterData, selectedTrainer.id, defaultName);

          if (!newMonster) {
            return {
              success: false,
              message: 'Failed to create monster'
            };
          }

          // Initialize the monster with proper stats and moves
          const MonsterInitializer = require('../utils/MonsterInitializer');
          const initializedMonster = await MonsterInitializer.initializeMonster({
            ...newMonster,
            level: reward.data.level || 1
          });

          // Update the monster with initialized data
          if (initializedMonster) {
            await Monster.update(newMonster.id, initializedMonster);
          }

          result.message = `New monster ${defaultName} added to ${selectedTrainer.name}'s collection`;
          result.monsterName = defaultName;
          result.monsterId = newMonster.id;
        } catch (error) {
          console.error('Error creating monster:', error);
          return {
            success: false,
            message: `Error creating monster: ${error.message}`
          };
        }
        break;

      default:
        // Generic reward type
        result.message = `Reward claimed by ${selectedTrainer.name}`;
    }

    return result;
  } catch (error) {
    console.error('Error processing reward:', error);
    return {
      success: false,
      message: 'Error processing reward: ' + error.message
    };
  }
}

/**
 * Claim a reward from the game corner
 */
router.post('/claim-reward', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewardId, rewardType, trainerId = 'random', source } = req.body;

    // Always use 'game_corner' as the source for this endpoint
    const rewardSource = 'game_corner';

    console.log('Game Corner Claim Request:', {
      rewardId,
      rewardType,
      trainerId,
      originalSource: source,
      forcedSource: rewardSource
    });

    if (!rewardId || !rewardType) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Create a reward object from the request parameters
    const reward = {
      id: rewardId,
      type: rewardType,
      data: req.body.data || {}
    };

    // Process the reward
    const result = await processReward(reward, trainerId, trainers, rewardSource);

    res.json(result);
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward: ' + error.message });
  }
});

/**
 * Claim all rewards at once
 */
router.post('/claim-all-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards, trainerId = 'random', source } = req.body;

    // Always use 'game_corner' as the source for this endpoint
    const rewardSource = 'game_corner';

    console.log('Game Corner Claim All Request:', {
      rewardsCount: rewards?.length || 0,
      trainerId,
      originalSource: source,
      forcedSource: rewardSource
    });

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Process each reward
    const results = [];
    for (const reward of rewards) {
      const result = await processReward(reward, trainerId, trainers, rewardSource);
      results.push({
        id: reward.id,
        type: reward.type,
        success: result.success,
        message: result.message,
        trainerName: result.trainerName,
        trainerId: result.trainerId
      });
    }

    // Check if all rewards were processed successfully
    const allSuccessful = results.every(result => result.success);

    res.json({
      success: allSuccessful,
      message: allSuccessful ? 'All rewards claimed successfully' : 'Some rewards failed to process',
      claimedRewards: results
    });
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    res.status(500).json({ success: false, message: 'Error claiming rewards: ' + error.message });
  }
});

module.exports = router;
module.exports.processReward = processReward;
