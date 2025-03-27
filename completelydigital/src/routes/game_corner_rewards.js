/**
 * Game Corner Rewards API
 * Handles processing rewards from the Pomodoro Game Corner
 */

const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

/**
 * Process level rewards for trainers and monsters
 */
router.post('/process-level-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards } = req.body;
    
    if (!rewards || !rewards.levels || !Array.isArray(rewards.levels)) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    const results = {
      success: true,
      processed: {
        trainers: [],
        monsters: []
      }
    };

    // Process each level reward
    for (const levelReward of rewards.levels) {
      try {
        if (levelReward.type === 'trainer') {
          // Update trainer level
          const trainer = await Trainer.getById(levelReward.id);
          if (!trainer) {
            console.error(`Trainer with ID ${levelReward.id} not found`);
            continue;
          }

          // Verify the trainer belongs to the current user
          if (trainer.player_id !== req.session.user.discord_id) {
            console.error(`Trainer ${levelReward.id} does not belong to user ${req.session.user.discord_id}`);
            continue;
          }

          // Update trainer level
          const updatedTrainer = {
            ...trainer,
            level: trainer.level + levelReward.levelIncrease
          };

          await Trainer.update(levelReward.id, updatedTrainer);
          results.processed.trainers.push({
            id: levelReward.id,
            name: trainer.name,
            levelIncrease: levelReward.levelIncrease,
            newLevel: updatedTrainer.level
          });

        } else if (levelReward.type === 'monster') {
          // Update monster level
          const monster = await Monster.getById(levelReward.id);
          if (!monster) {
            console.error(`Monster with ID ${levelReward.id} not found`);
            continue;
          }

          // Get the trainer to verify ownership
          const trainer = await Trainer.getById(monster.trainer_id);
          if (!trainer || trainer.player_id !== req.session.user.discord_id) {
            console.error(`Monster ${levelReward.id} does not belong to user ${req.session.user.discord_id}`);
            continue;
          }

          // Calculate new level
          const newLevel = monster.level + levelReward.levelIncrease;
          
          // Update monster with new level and recalculate stats
          const updatedMonster = {
            ...monster,
            level: newLevel
          };

          await Monster.update(levelReward.id, updatedMonster);
          results.processed.monsters.push({
            id: levelReward.id,
            name: monster.name,
            levelIncrease: levelReward.levelIncrease,
            newLevel
          });
        }
      } catch (error) {
        console.error('Error processing level reward:', error);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing level rewards:', error);
    res.status(500).json({ success: false, message: 'Error processing rewards: ' + error.message });
  }
});

/**
 * Process item rewards
 */
router.post('/process-item-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards } = req.body;
    
    if (!rewards || !rewards.items || !Array.isArray(rewards.items)) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    const results = {
      success: true,
      processed: {
        items: []
      }
    };

    // Process each item reward
    for (const itemReward of rewards.items) {
      try {
        // Get the trainer
        const trainer = await Trainer.getById(itemReward.trainerId);
        if (!trainer) {
          console.error(`Trainer with ID ${itemReward.trainerId} not found`);
          continue;
        }

        // Verify the trainer belongs to the current user
        if (trainer.player_id !== req.session.user.discord_id) {
          console.error(`Trainer ${itemReward.trainerId} does not belong to user ${req.session.user.discord_id}`);
          continue;
        }

        // Determine the category based on item type
        let category = 'inv_items'; // Default category
        const itemName = itemReward.item.name;
        
        // Categorize the item
        if (itemName.includes('Ball')) {
          category = 'inv_balls';
        } else if (itemName.includes('Berry')) {
          category = 'inv_berries';
        } else if (itemName.includes('Stone') || itemName.includes('Evolution')) {
          category = 'inv_evolution';
        }

        // Update inventory
        const success = await Trainer.updateInventoryItem(
          itemReward.trainerId,
          category,
          itemName,
          1 // Add 1 of the item
        );

        if (success) {
          results.processed.items.push({
            trainerId: itemReward.trainerId,
            trainerName: trainer.name,
            itemName: itemName,
            category
          });
        }
      } catch (error) {
        console.error('Error processing item reward:', error);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing item rewards:', error);
    res.status(500).json({ success: false, message: 'Error processing rewards: ' + error.message });
  }
});

/**
 * Process coin rewards
 */
router.post('/process-coin-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards } = req.body;
    
    if (!rewards || !rewards.coins || !Array.isArray(rewards.coins)) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    const results = {
      success: true,
      processed: {
        coins: []
      }
    };

    // Process each coin reward
    for (const coinReward of rewards.coins) {
      try {
        // Get the trainer
        const trainer = await Trainer.getById(coinReward.trainerId);
        if (!trainer) {
          console.error(`Trainer with ID ${coinReward.trainerId} not found`);
          continue;
        }

        // Verify the trainer belongs to the current user
        if (trainer.player_id !== req.session.user.discord_id) {
          console.error(`Trainer ${coinReward.trainerId} does not belong to user ${req.session.user.discord_id}`);
          continue;
        }

        // Update trainer coins
        const updatedTrainer = {
          ...trainer,
          currency_amount: trainer.currency_amount + coinReward.amount,
          total_earned_currency: trainer.total_earned_currency + coinReward.amount
        };

        await Trainer.update(coinReward.trainerId, updatedTrainer);
        results.processed.coins.push({
          trainerId: coinReward.trainerId,
          trainerName: trainer.name,
          amount: coinReward.amount,
          newTotal: updatedTrainer.currency_amount
        });
      } catch (error) {
        console.error('Error processing coin reward:', error);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing coin rewards:', error);
    res.status(500).json({ success: false, message: 'Error processing rewards: ' + error.message });
  }
});

/**
 * Process monster encounter rewards
 */
router.post('/process-monster-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards, trainerId } = req.body;
    
    if (!rewards || !rewards.monsters || !Array.isArray(rewards.monsters) || !trainerId) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Verify the trainer belongs to the current user
    if (trainer.player_id !== req.session.user.discord_id) {
      return res.status(403).json({ success: false, message: 'You do not own this trainer' });
    }

    const results = {
      success: true,
      processed: {
        monsters: []
      }
    };

    // Process each monster reward
    for (const monsterReward of rewards.monsters) {
      try {
        // Create monster data
        const monsterData = {
          trainer_id: trainerId,
          name: monsterReward.name,
          level: 1,
          species1: monsterReward.name,
          type1: monsterReward.type.split('/')[0],
          type2: monsterReward.type.includes('/') ? monsterReward.type.split('/')[1] : null,
          box_number: 1 // Default to box 1
        };

        // Create the monster
        const monster = await Monster.create(monsterData);

        if (monster) {
          results.processed.monsters.push({
            id: monster.mon_id,
            name: monster.name,
            type: monsterReward.type
          });
        }
      } catch (error) {
        console.error('Error processing monster reward:', error);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing monster rewards:', error);
    res.status(500).json({ success: false, message: 'Error processing rewards: ' + error.message });
  }
});

/**
 * Process all rewards at once
 */
router.post('/process-all-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    const { rewards, selectedTrainerId } = req.body;
    
    if (!rewards) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    const results = {
      success: true,
      processed: {
        levels: { trainers: [], monsters: [] },
        items: [],
        coins: [],
        monsters: []
      }
    };

    // Process level rewards
    if (rewards.levels && Array.isArray(rewards.levels)) {
      for (const levelReward of rewards.levels) {
        try {
          if (levelReward.type === 'trainer') {
            // Update trainer level
            const trainer = await Trainer.getById(levelReward.id);
            if (!trainer || trainer.player_id !== req.session.user.discord_id) continue;

            const updatedTrainer = {
              ...trainer,
              level: trainer.level + levelReward.levelIncrease
            };

            await Trainer.update(levelReward.id, updatedTrainer);
            results.processed.levels.trainers.push({
              id: levelReward.id,
              name: trainer.name,
              levelIncrease: levelReward.levelIncrease,
              newLevel: updatedTrainer.level
            });
          } else if (levelReward.type === 'monster') {
            // Update monster level
            const monster = await Monster.getById(levelReward.id);
            if (!monster) continue;

            const trainer = await Trainer.getById(monster.trainer_id);
            if (!trainer || trainer.player_id !== req.session.user.discord_id) continue;

            const newLevel = monster.level + levelReward.levelIncrease;
            const updatedMonster = { ...monster, level: newLevel };

            await Monster.update(levelReward.id, updatedMonster);
            results.processed.levels.monsters.push({
              id: levelReward.id,
              name: monster.name,
              levelIncrease: levelReward.levelIncrease,
              newLevel
            });
          }
        } catch (error) {
          console.error('Error processing level reward:', error);
        }
      }
    }

    // Process item rewards
    if (rewards.items && Array.isArray(rewards.items)) {
      for (const itemReward of rewards.items) {
        try {
          const trainer = await Trainer.getById(itemReward.trainerId);
          if (!trainer || trainer.player_id !== req.session.user.discord_id) continue;

          let category = 'inv_items';
          const itemName = itemReward.item.name;
          
          if (itemName.includes('Ball')) {
            category = 'inv_balls';
          } else if (itemName.includes('Berry')) {
            category = 'inv_berries';
          } else if (itemName.includes('Stone') || itemName.includes('Evolution')) {
            category = 'inv_evolution';
          }

          const success = await Trainer.updateInventoryItem(
            itemReward.trainerId,
            category,
            itemName,
            1
          );

          if (success) {
            results.processed.items.push({
              trainerId: itemReward.trainerId,
              trainerName: trainer.name,
              itemName: itemName,
              category
            });
          }
        } catch (error) {
          console.error('Error processing item reward:', error);
        }
      }
    }

    // Process coin rewards
    if (rewards.coins && Array.isArray(rewards.coins)) {
      for (const coinReward of rewards.coins) {
        try {
          const trainer = await Trainer.getById(coinReward.trainerId);
          if (!trainer || trainer.player_id !== req.session.user.discord_id) continue;

          const updatedTrainer = {
            ...trainer,
            currency_amount: trainer.currency_amount + coinReward.amount,
            total_earned_currency: trainer.total_earned_currency + coinReward.amount
          };

          await Trainer.update(coinReward.trainerId, updatedTrainer);
          results.processed.coins.push({
            trainerId: coinReward.trainerId,
            trainerName: trainer.name,
            amount: coinReward.amount,
            newTotal: updatedTrainer.currency_amount
          });
        } catch (error) {
          console.error('Error processing coin reward:', error);
        }
      }
    }

    // Process monster rewards
    if (rewards.monsters && Array.isArray(rewards.monsters) && selectedTrainerId) {
      const trainer = await Trainer.getById(selectedTrainerId);
      if (trainer && trainer.player_id === req.session.user.discord_id) {
        for (const monsterReward of rewards.monsters) {
          try {
            const monsterData = {
              trainer_id: selectedTrainerId,
              name: monsterReward.name,
              level: 1,
              species1: monsterReward.name,
              type1: monsterReward.type.split('/')[0],
              type2: monsterReward.type.includes('/') ? monsterReward.type.split('/')[1] : null,
              box_number: 1
            };

            const monster = await Monster.create(monsterData);
            if (monster) {
              results.processed.monsters.push({
                id: monster.mon_id,
                name: monster.name,
                type: monsterReward.type
              });
            }
          } catch (error) {
            console.error('Error processing monster reward:', error);
          }
        }
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing all rewards:', error);
    res.status(500).json({ success: false, message: 'Error processing rewards: ' + error.message });
  }
});

module.exports = router;
