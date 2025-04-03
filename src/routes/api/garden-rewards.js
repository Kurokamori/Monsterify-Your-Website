const express = require('express');
const router = express.Router();
const RewardSystem = require('../../utils/RewardSystem');
const GardenHarvest = require('../../models/GardenHarvest');
const Trainer = require('../../models/Trainer');

/**
 * Middleware to check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  next();
};

/**
 * Middleware to check if user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  next();
};

/**
 * Reroll garden rewards (admin only)
 * POST /api/garden/reroll-rewards
 */
router.post('/reroll-rewards', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('Rerolling garden rewards for admin user:', req.session.user.username);

    // Generate random garden points (1-5)
    const gardenPoints = Math.floor(Math.random() * 5) + 1;
    console.log(`Generated ${gardenPoints} garden points for reroll`);

    // Generate new rewards
    const rewards = await RewardSystem.generateRewards('garden', {
      gardenPoints: gardenPoints,
      productivityScore: 100,
      timeSpent: 30,
      difficulty: 'normal'
    });
    console.log(`Generated ${rewards.length} new rewards`);

    // Store new rewards in session
    req.session.rewards = rewards;

    return res.json({
      success: true,
      message: `Successfully rerolled rewards with ${gardenPoints} garden points`,
      rewardCount: rewards.length
    });
  } catch (error) {
    console.error('Error rerolling garden rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rerolling rewards: ' + error.message
    });
  }
});

/**
 * Harvest garden
 * POST /api/garden/harvest
 */
router.post('/harvest', isAuthenticated, async (req, res) => {
  try {
    console.log('Garden harvest API route accessed');

    // Get the user's Discord ID
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    console.log(`Processing harvest for user ID: ${discordUserId}`);

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(discordUserId);
    if (!trainers || trainers.length === 0) {
      console.log('No trainers found for user');
      return res.status(404).json({
        success: false,
        message: 'You need at least one trainer to harvest the garden!'
      });
    }
    console.log(`Found ${trainers.length} trainers for user`);

    // Check if the user has already harvested today
    const hasHarvestedToday = await GardenHarvest.hasHarvestedToday(discordUserId);
    console.log(`Has user harvested today? ${hasHarvestedToday}`);

    // Check if user is an admin
    const isAdmin = req.session.user.is_admin === true;
    console.log(`Is user an admin? ${isAdmin}`);

    // Only enforce the daily harvest limit for non-admin users
    if (hasHarvestedToday && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'You have already harvested your garden today. Come back tomorrow!'
      });
    }

    // For admin users who have already harvested today, generate new garden points
    let harvestResult;
    if (isAdmin && hasHarvestedToday) {
      console.log('Admin user', req.session.user.username, '(' + discordUserId + ') is harvesting again on the same day');

      // Generate random garden points (1-5) for admin users
      const gardenPoints = Math.floor(Math.random() * 5) + 1;
      console.log(`Generated ${gardenPoints} garden points for admin user`);

      // Record the new points
      await GardenHarvest.updateGardenPoints(discordUserId, gardenPoints);

      // Now harvest with the new points
      harvestResult = await GardenHarvest.harvestGarden(discordUserId);
    } else {
      // Regular harvest for non-admin users or first harvest of the day
      console.log('Harvesting garden...');
      harvestResult = await GardenHarvest.harvestGarden(discordUserId);
    }
    console.log('Harvest result:', harvestResult);

    if (!harvestResult.success) {
      return res.status(400).json({
        success: false,
        message: harvestResult.message || 'Error harvesting garden'
      });
    }

    // Process rewards to ensure they have the correct format
    const processedRewards = harvestResult.rewards.map(reward => {
      // Get a unique timestamp for each reward
      const timestamp = Date.now() + Math.floor(Math.random() * 1000);

      // Extract reward data
      const rewardData = reward.reward_data || reward.data || {};

      // Make sure reward has all required properties
      const processedReward = {
        ...reward,
        id: reward.id || reward.reward_id || `garden-reward-${timestamp}`,
        type: reward.type || reward.reward_type || 'unknown',
        reward_type: reward.reward_type || reward.type || 'unknown',
        // Ensure both data and reward_data are available and contain the same information
        data: {
          ...rewardData,
          amount: rewardData.amount || 100,
          title: rewardData.title || 'Garden Reward'
        },
        reward_data: {
          ...rewardData,
          amount: rewardData.amount || 100,
          title: rewardData.title || 'Garden Reward'
        }
      };

      // Add icon based on reward type
      if (!processedReward.icon) {
        switch (processedReward.type) {
          case 'monster':
            processedReward.icon = 'fas fa-dragon';
            break;
          case 'item':
            processedReward.icon = 'fas fa-box';
            break;
          case 'coin':
            processedReward.icon = 'fas fa-coins';
            break;
          case 'level':
            processedReward.icon = 'fas fa-level-up-alt';
            break;
          default:
            processedReward.icon = 'fas fa-gift';
        }
      }

      return processedReward;
    });

    // Store processed rewards in multiple session variables for compatibility
    req.session.rewards = processedRewards;
    req.session.gardenRewards = processedRewards;

    // Store additional information that will be needed by the rewards page
    req.session.source = 'garden';
    req.session.returnUrl = '/town/visit/garden';
    req.session.message = `You harvested your garden and earned ${harvestResult.pointsHarvested} garden points!`;

    // Log the first few rewards for debugging
    if (processedRewards.length > 0) {
      console.log('First reward:', JSON.stringify(processedRewards[0], null, 2));
    }

    return res.json({
      success: true,
      message: `Successfully harvested garden with ${harvestResult.pointsHarvested} points`,
      rewards: processedRewards,
      pointsHarvested: harvestResult.pointsHarvested
    });
  } catch (error) {
    console.error('Error harvesting garden:', error);
    return res.status(500).json({
      success: false,
      message: 'Error harvesting garden: ' + error.message
    });
  }
});

/**
 * Claim garden reward
 * POST /api/garden/claim-reward
 */
router.post('/claim-reward', isAuthenticated, async (req, res) => {
  console.log('\n\n==== GARDEN CLAIM REWARD API ROUTE ACCESSED ====');
  console.log('File: src/routes/api/garden-rewards.js');
  console.log('Route: POST /api/garden/claim-reward');
  try {
    console.log('Garden claim reward API route accessed');
    console.log('Request body:', req.body);

    const { rewardId, rewardType, trainerId } = req.body;

    if (!rewardId || !rewardType) {
      return res.status(400).json({
        success: false,
        message: 'Reward ID and reward type are required'
      });
    }

    // For coin rewards with format "coin-timestamp", create a dummy reward
    if (rewardType === 'coin' && rewardId && rewardId.includes('-')) {
      console.log('DEBUG: Processing garden coin reward with ID:', rewardId);
      console.log('DEBUG: This is using the new special handling for coin-timestamp format');

      // Get the trainer
      console.log('DEBUG: Getting trainer with ID:', trainerId);
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        console.log('DEBUG: Trainer not found with ID:', trainerId);
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }
      console.log('DEBUG: Found trainer:', trainer.name);

      // Check if the trainer belongs to the user
      if (trainer.player_user_id !== req.session.user.discord_id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to claim rewards for this trainer'
        });
      }

      // Generate a random coin amount between 100-300
      const coinAmount = Math.floor(Math.random() * 201) + 100;
      console.log(`DEBUG: Generated garden coin reward amount: ${coinAmount}`);

      // Update the trainer's currency
      console.log('DEBUG: Trainer properties:', Object.keys(trainer));
      if (trainer.hasOwnProperty('coins')) {
        console.log(`DEBUG: Updating trainer coins from ${trainer.coins} to ${(trainer.coins || 0) + coinAmount}`);
        await Trainer.update(trainer.id, {
          coins: (trainer.coins || 0) + coinAmount
        });
      } else if (trainer.hasOwnProperty('currency_amount')) {
        console.log(`DEBUG: Updating trainer currency_amount from ${trainer.currency_amount} to ${(trainer.currency_amount || 0) + coinAmount}`);
        await Trainer.update(trainer.id, {
          currency_amount: (trainer.currency_amount || 0) + coinAmount
        });
      } else {
        console.log(`DEBUG: Using Trainer.addCoins with amount: ${coinAmount}`);
        await Trainer.addCoins(trainer.id, coinAmount);
      }

      const response = {
        success: true,
        message: `Successfully added ${coinAmount} coins to ${trainer.name}`,
        trainerName: trainer.name,
        rewardType: 'coin',
        amount: coinAmount
      };

      console.log('DEBUG: Sending successful response:', response);
      return res.json(response);
    }

    // Get rewards from session - check both rewards and gardenRewards
    let sessionRewards = req.session.rewards || req.session.gardenRewards || [];

    // If no rewards found in session, check localStorage backup from the request
    if (sessionRewards.length === 0 && req.body.backupRewards) {
      console.log('Using backup rewards from request');
      sessionRewards = req.body.backupRewards;
    }

    console.log(`Found ${sessionRewards.length} rewards in session`);

    // Find the reward
    let reward = sessionRewards.find(r => {
      const rewardIdStr = rewardId.toString();
      return (
        (r.id && r.id.toString() === rewardIdStr) ||
        (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
        (r.rewardId && r.rewardId.toString() === rewardIdStr)
      );
    });

    // If reward not found and we have backup rewards, try to find it there
    if (!reward && req.body.backupRewards) {
      console.log('Trying to find reward in backup rewards');
      reward = req.body.backupRewards.find(r => {
        const rewardIdStr = rewardId.toString();
        return (
          (r.id && r.id.toString() === rewardIdStr) ||
          (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
          (r.rewardId && r.rewardId.toString() === rewardIdStr)
        );
      });
    }

    if (!reward) {
      console.log('Reward not found in session or backup');
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    console.log('Found reward:', JSON.stringify(reward, null, 2));

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id || req.session.user.id);
    if (!trainers || trainers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trainers found for this user'
      });
    }

    // Get the trainer to assign the reward to
    let trainer;
    if (!trainerId || trainerId === 'random') {
      // Randomly select a trainer
      const randomIndex = Math.floor(Math.random() * trainers.length);
      trainer = trainers[randomIndex];
    } else {
      // Find the specific trainer
      trainer = trainers.find(t => t.id.toString() === trainerId.toString());
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }
    }

    console.log(`Selected trainer: ${trainer.name} (ID: ${trainer.id})`);

    // Process the reward based on type
    let result;
    switch (rewardType) {
      case 'coin':
        // Process coin reward
        const coinData = reward.reward_data || reward.data || {};
        const coinAmount = coinData.amount || 100;

        console.log(`Processing coin reward: ${coinAmount} coins`);

        // Update trainer's coins
        await Trainer.update(trainer.id, {
          coins: (trainer.coins || 0) + coinAmount
        });

        result = {
          success: true,
          message: `Added ${coinAmount} coins to ${trainer.name}`,
          trainerId: trainer.id,
          trainerName: trainer.name
        };
        break;

      case 'item':
        // Process item reward
        const itemData = reward.reward_data || reward.data || {};
        const itemName = itemData.name || 'Unknown Item';
        const itemQuantity = itemData.quantity || 1;
        const itemCategory = (itemData.category || 'items').toLowerCase();

        console.log(`Processing item reward: ${itemQuantity}x ${itemName} (${itemCategory})`);

        // Get current inventory
        const inventoryQuery = `SELECT inv_${itemCategory} FROM trainers WHERE id = $1`;
        const inventoryResult = await pool.query(inventoryQuery, [trainer.id]);

        if (!inventoryResult.rows[0]) {
          return res.status(500).json({
            success: false,
            message: 'Error getting trainer inventory'
          });
        }

        // Parse inventory
        let inventory = [];
        try {
          const currentInventory = inventoryResult.rows[0][`inv_${itemCategory}`];
          inventory = currentInventory ? (typeof currentInventory === 'string' ? JSON.parse(currentInventory) : currentInventory) : [];
        } catch (error) {
          console.error(`Error parsing inventory for category ${itemCategory}:`, error);
          inventory = [];
        }

        // Add item to inventory
        const existingItemIndex = inventory.findIndex(item => item.name === itemName);
        if (existingItemIndex !== -1) {
          // Update existing item quantity
          inventory[existingItemIndex].quantity += itemQuantity;
        } else {
          // Add new item
          inventory.push({
            id: Date.now(),
            name: itemName,
            description: itemData.description || '',
            quantity: itemQuantity,
            icon: itemData.icon || null
          });
        }

        // Update inventory
        const updateQuery = `UPDATE trainers SET inv_${itemCategory} = $1 WHERE id = $2`;
        await pool.query(updateQuery, [JSON.stringify(inventory), trainer.id]);

        result = {
          success: true,
          message: `Added ${itemQuantity}x ${itemName} to ${trainer.name}'s inventory`,
          trainerId: trainer.id,
          trainerName: trainer.name
        };
        break;

      case 'monster':
        // Process monster reward
        const monsterData = reward.reward_data || reward.data || {};

        console.log(`Processing monster reward:`, monsterData);

        // Extract species information
        let species1 = null, species2 = null, species3 = null;
        if (typeof monsterData.species === 'string') {
          species1 = monsterData.species;
        } else if (Array.isArray(monsterData.species)) {
          species1 = monsterData.species[0] || 'Unknown';
          species2 = monsterData.species[1] || null;
          species3 = monsterData.species[2] || null;
        } else {
          species1 = monsterData.species1 || 'Unknown';
          species2 = monsterData.species2 || null;
          species3 = monsterData.species3 || null;
        }

        // Extract type information
        let type1 = null, type2 = null, type3 = null, type4 = null, type5 = null;
        if (typeof monsterData.type === 'string') {
          type1 = monsterData.type;
        } else if (Array.isArray(monsterData.types)) {
          type1 = monsterData.types[0] || 'Normal';
          type2 = monsterData.types[1] || null;
          type3 = monsterData.types[2] || null;
          type4 = monsterData.types[3] || null;
          type5 = monsterData.types[4] || null;
        } else {
          type1 = monsterData.type1 || monsterData.type || 'Normal';
          type2 = monsterData.type2 || null;
          type3 = monsterData.type3 || null;
          type4 = monsterData.type4 || null;
          type5 = monsterData.type5 || null;
        }

        // Create monster
        const newMonster = await Monster.create({
          trainer_id: trainer.id,
          player_user_id: trainer.player_user_id,
          species1,
          species2,
          species3,
          type1,
          type2,
          type3,
          type4,
          type5,
          attribute: monsterData.attribute || 'Data',
          level: monsterData.level || 1,
          nickname: null
        });

        result = {
          success: true,
          message: `Added a new monster to ${trainer.name}'s collection`,
          trainerId: trainer.id,
          trainerName: trainer.name,
          monsterId: newMonster.id
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown reward type: ${rewardType}`
        });
    }

    // Mark the reward as claimed in the session
    const rewardIndex = sessionRewards.findIndex(r => {
      const rewardIdStr = rewardId.toString();
      return (
        (r.id && r.id.toString() === rewardIdStr) ||
        (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
        (r.rewardId && r.rewardId.toString() === rewardIdStr)
      );
    });

    if (rewardIndex !== -1) {
      sessionRewards[rewardIndex].claimed = true;
      sessionRewards[rewardIndex].claimed_by = trainer.id;
      req.session.rewards = sessionRewards;
    }

    return res.json(result);
  } catch (error) {
    console.error('Error claiming garden reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Error claiming reward: ' + error.message
    });
  }
});

module.exports = router;
