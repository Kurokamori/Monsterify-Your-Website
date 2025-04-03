const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const pool = require('../../db');
const LocationActivitySession = require('../../models/LocationActivitySession');
const Monster = require('../../models/Monster');
const RewardSystem = require('../../utils/RewardSystem');

/**
 * Claim a reward
 * POST /api/claim-reward
 */
router.post('/', async (req, res) => {
  try {
    console.log('\n\n==== CLAIM REWARD REQUEST ====');
    console.log('File: src/routes/api/claim-reward.js');
    console.log('Route: POST /api/claim-reward');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Session user:', req.session.user ? req.session.user.discord_id : 'No user in session');
    console.log('Session rewards:', req.session.rewards ? req.session.rewards.length : 'No rewards in session');
    console.log('Session activityRewards:', req.session.activityRewards ? req.session.activityRewards.length : 'No activityRewards in session');
    console.log('Session keys:', Object.keys(req.session));

    // Check if user is logged in
    if (!req.session.user) {
      console.log('Error: User not logged in');
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    console.log('User ID:', req.session.user.discord_id);

    const { reward_id, reward_type, trainerId, session_id } = req.body;

    // For backward compatibility, support both naming conventions
    const rewardId = reward_id || req.body.rewardId;
    const rewardType = reward_type || req.body.rewardType;
    const sessionId = session_id || req.body.sessionId || req.session.lastActivitySessionId;

    console.log('Session ID from request or session:', sessionId);

    console.log('Claim reward request:', { rewardId, rewardType, trainerId, sessionId, source: req.body.source });

    if (!rewardId) {
      console.log('Error: Missing reward ID');
      return res.status(400).json({ success: false, message: 'Missing reward ID' });
    }

    if (!rewardType) {
      console.log('Error: Missing reward type');
      return res.status(400).json({ success: false, message: 'Missing reward type' });
    }

    // Note: sessionId is optional and only required for certain types of rewards

    // For garden, farm, or location_activity rewards, we can create a dummy reward if needed
    if ((req.body.source === 'garden' || req.body.source === 'farm' || req.body.source === 'location_activity') && rewardType === 'coin') {
      console.log(`DEBUG: ${req.body.source} coin reward detected, will create dummy reward if needed`);
      console.log(`DEBUG: This should be handled by a specific endpoint for ${req.body.source}`);
    }

    // Check for rewards in different session variables
    let sessionRewards = [];

    if (sessionId) {
      console.log('Using rewards from database session with ID:', sessionId);
      // We'll get the rewards from the database later
    } else if (req.session.rewards && Array.isArray(req.session.rewards) && req.session.rewards.length > 0) {
      console.log('Using rewards from req.session.rewards');
      sessionRewards = req.session.rewards;
    } else if (req.session.activityRewards && Array.isArray(req.session.activityRewards) && req.session.activityRewards.length > 0) {
      console.log('Using rewards from req.session.activityRewards');
      sessionRewards = req.session.activityRewards;
    } else if (req.body.source === 'garden' && req.session.gardenRewards && Array.isArray(req.session.gardenRewards) && req.session.gardenRewards.length > 0) {
      console.log('Using rewards from req.session.gardenRewards');
      sessionRewards = req.session.gardenRewards;
    } else if (req.body.source === 'farm' && req.session.farmRewards && Array.isArray(req.session.farmRewards) && req.session.farmRewards.length > 0) {
      console.log('Using rewards from req.session.farmRewards');
      sessionRewards = req.session.farmRewards;
    } else {
      console.log('No rewards found in session. Available session keys:', Object.keys(req.session));
      console.log('Request body:', req.body);

      // Don't return an error here, we'll try to get rewards from the database if sessionId is provided
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'No rewards found in session' });
      }
    }

    // Get all trainers for the user
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);
    if (!trainers || trainers.length === 0) {
      console.log('Error: No trainers found for user');
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // If trainerId is 'select_trainer' or not provided, use the first trainer
    let trainer;
    if (!trainerId || trainerId === 'select_trainer') {
      trainer = trainers[0];
      console.log('Using first trainer:', trainer.name);
    } else {
      // Get the specific trainer
      trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        console.log('Error: Trainer not found');
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }

      // Check if the trainer belongs to the user
      if (trainer.player_user_id !== req.session.user.discord_id) {
        console.log('Error: Trainer does not belong to user');
        return res.status(403).json({ success: false, message: 'You do not have permission to claim rewards for this trainer' });
      }
    }

    // Initialize reward variable
    let reward = null;

    // If we don't have sessionRewards yet, get them based on source
    if (sessionId) {
      // Get rewards from location activity session
      try {
        // Get the session from database
        const sessionQuery = `
          SELECT rewards FROM location_activity_sessions
          WHERE session_id = $1
        `;
        const sessionResult = await pool.query(sessionQuery, [sessionId]);

        if (!sessionResult.rows[0]) {
          console.log('Error: Session not found');
          return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Parse the rewards
        try {
          const rewardsData = sessionResult.rows[0].rewards;
          if (typeof rewardsData === 'string') {
            sessionRewards = JSON.parse(rewardsData || '[]');
          } else if (Array.isArray(rewardsData)) {
            sessionRewards = rewardsData;
          } else if (typeof rewardsData === 'object' && rewardsData !== null) {
            sessionRewards = [rewardsData];
          }
        } catch (parseError) {
          console.error('Error parsing session rewards:', parseError);
          return res.status(500).json({ success: false, message: 'Error parsing session rewards' });
        }
      } catch (error) {
        console.error('Error getting session:', error);
        return res.status(500).json({ success: false, message: 'Error getting session' });
      }
    } else {
      // Use rewards from the session object
      console.log('Using rewards from session object');
      sessionRewards = req.session.rewards || [];
    }

    console.log('Session rewards:', sessionRewards);
    console.log('Looking for reward with ID:', rewardId);
    console.log('Available rewards:', sessionRewards.map(r => ({
      id: r.id,
      reward_id: r.reward_id,
      rewardId: r.rewardId
    })));

    // Find the reward
    console.log('Looking for reward with ID:', rewardId, 'in', sessionRewards.length, 'rewards');

    // Log all reward IDs for debugging
    sessionRewards.forEach(r => {
      console.log('Available reward ID:', r.id || r.reward_id || r.rewardId);
    });

    reward = sessionRewards.find(r => {
      // Check different possible ID properties
      const rewardIdStr = rewardId.toString();

      // For rewards with format like "coin-1234567890", also try matching just the type
      const isTypeMatch = rewardType && r.type === rewardType;

      const match = (
        (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
        (r.id && r.id.toString() === rewardIdStr) ||
        (r.rewardId && r.rewardId.toString() === rewardIdStr)
      );

      if (match) {
        console.log('Found exact matching reward:', JSON.stringify(r, null, 2));
        return true;
      }

      // If no exact match but types match, use the first reward of that type
      if (isTypeMatch && !reward) {
        console.log('Found type matching reward:', JSON.stringify(r, null, 2));
        return true;
      }

      return false;
    });

    // If reward not found, check for backup rewards in the request
    if (!reward && req.body.backupRewards) {
      console.log('Checking backup rewards from request');
      const backupRewards = Array.isArray(req.body.backupRewards) ? req.body.backupRewards : [req.body.backupRewards];

      // Log all backup reward IDs for debugging
      backupRewards.forEach(r => {
        console.log('Available backup reward ID:', r.id || r.reward_id || r.rewardId, 'type:', r.type || r.reward_type);
      });

      reward = backupRewards.find(r => {
        const rewardIdStr = rewardId.toString();

        // For rewards with format like "coin-1234567890", also try matching just the type
        const isTypeMatch = rewardType && (r.type === rewardType || r.reward_type === rewardType);

        const match = (
          (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
          (r.id && r.id.toString() === rewardIdStr) ||
          (r.rewardId && r.rewardId.toString() === rewardIdStr)
        );

        if (match) {
          console.log('Found exact matching backup reward:', JSON.stringify(r, null, 2));
          return true;
        }

        // If no exact match but types match, use the first reward of that type
        if (isTypeMatch) {
          console.log('Found type matching backup reward:', JSON.stringify(r, null, 2));
          return true;
        }

        return false;
      });

      if (reward) {
        console.log('Found reward in backup rewards:', JSON.stringify(reward, null, 2));
      }
    }

    // If reward still not found, try to create a dummy reward for testing
    if (!reward && rewardType) {
      console.log('Reward not found, creating dummy reward for testing');

      // Extract amount from reward ID if it's in the format "type-timestamp"
      let amount = 100;
      if (rewardId && rewardId.toString().includes('-')) {
        const parts = rewardId.toString().split('-');
        if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
          // Use the timestamp part as a seed for a random amount between 50-200
          const seed = parseInt(parts[1]) % 1000;
          amount = 50 + (seed % 151); // 50-200 range
          console.log(`Generated amount ${amount} from reward ID ${rewardId}`);
        }
      }

      // For garden, farm, or location_activity rewards, generate a more generous amount (100-300)
      if (req.body.source === 'garden' || req.body.source === 'farm' || req.body.source === 'location_activity') {
        amount = Math.floor(Math.random() * 201) + 100; // 100-300 range
        console.log(`Generated ${req.body.source} reward amount: ${amount}`);
      }

      // Create a dummy reward based on the reward type
      switch (rewardType) {
        case 'coin':
          reward = {
            id: rewardId,
            type: 'coin',
            reward_type: 'coin',
            data: { amount: amount, title: 'Coins' },
            reward_data: { amount: amount, title: 'Coins' }
          };
          console.log('Created dummy coin reward with amount:', amount);
          break;

        case 'item':
          reward = {
            id: rewardId,
            type: 'item',
            reward_type: 'item',
            data: { name: 'Mystery Item', quantity: 1 },
            reward_data: { name: 'Mystery Item', quantity: 1 }
          };
          break;

        case 'monster':
          reward = {
            id: rewardId,
            type: 'monster',
            reward_type: 'monster',
            data: { species: ['Pokemon'], types: ['Normal'] },
            reward_data: { species: ['Pokemon'], types: ['Normal'] }
          };
          break;
      }

      if (reward) {
        console.log('Created dummy reward:', JSON.stringify(reward, null, 2));
      }
    }

    if (!reward) {
      console.log('Error: Reward not found');
      return res.status(404).json({ success: false, message: 'Reward not found. Please try refreshing the page and claiming again.' });
    }

    // Ensure reward has both data and reward_data properties
    if (!reward.data && reward.reward_data) {
      reward.data = reward.reward_data;
    } else if (!reward.reward_data && reward.data) {
      reward.reward_data = reward.data;
    } else if (!reward.data && !reward.reward_data) {
      // Create empty data objects if neither exists
      reward.data = {};
      reward.reward_data = {};
    }

    // Check if the reward is already claimed
    if (reward.claimed) {
      console.log('Error: Reward already claimed');
      return res.status(400).json({ success: false, message: 'Reward already claimed' });
    }

    // Process the reward based on type
    let result = { success: false, message: 'Unknown reward type' };

    switch (rewardType) {
      case 'monster':
        result = await processMonsterReward(reward, trainer);
        break;
      case 'item':
        result = await processItemReward(reward, trainer);
        break;
      case 'coin':
        result = await processCoinReward(reward, trainer);
        break;
      case 'level':
        result = await processLevelReward(reward, trainer);
        break;
      default:
        console.log('Error: Unknown reward type:', rewardType);
        return res.status(400).json({ success: false, message: `Unknown reward type: ${rewardType}` });
    }

    // If the reward was processed successfully, mark it as claimed
    if (result.success) {
      // Mark the reward as claimed in the session rewards
      reward.claimed = true;
      reward.claimed_by = trainer.id;

      // If sessionId is provided, update the session in the database
      if (sessionId) {
        try {
          await pool.query(
            'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
            [JSON.stringify(sessionRewards), sessionId]
          );
        } catch (error) {
          console.error('Error updating session rewards:', error);
          // Continue even if update fails
        }
      } else {
        // Update the rewards in the session object
        req.session.rewards = sessionRewards;
      }

      return res.json({
        success: true,
        message: result.message,
        trainerId: trainer.id,
        trainerName: trainer.name
      });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);
    return res.status(500).json({ success: false, message: 'Error claiming reward: ' + error.message });
  }
});

/**
 * Process monster reward
 * @param {Object} reward - Reward object
 * @param {Object} trainer - Trainer object
 * @returns {Object} - Result object
 */
async function processMonsterReward(reward, trainer) {
  try {
    console.log('Processing monster reward:', reward);

    // Get monster data from reward
    const monsterData = reward.reward_data || reward.data || {};

    if (!monsterData) {
      return { success: false, message: 'Invalid monster data' };
    }

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

    // Create the monster
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

    console.log('Created new monster:', newMonster);

    return {
      success: true,
      message: `Successfully claimed monster for ${trainer.name}`,
      monsterId: newMonster.id
    };
  } catch (error) {
    console.error('Error processing monster reward:', error);
    return { success: false, message: 'Error processing monster reward: ' + error.message };
  }
}

/**
 * Process item reward
 * @param {Object} reward - Reward object
 * @param {Object} trainer - Trainer object
 * @returns {Object} - Result object
 */
async function processItemReward(reward, trainer) {
  try {
    console.log('Processing item reward:', reward);

    // Get item data from reward
    const itemData = reward.reward_data || reward.data || {};

    if (!itemData) {
      return { success: false, message: 'Invalid item data' };
    }

    // Get the item category (default to 'items' if not specified)
    const category = (itemData.category || 'items').toLowerCase();

    // Get current inventory for this category
    const inventoryQuery = `SELECT inv_${category} FROM trainers WHERE id = $1`;
    const inventoryResult = await pool.query(inventoryQuery, [trainer.id]);

    if (!inventoryResult.rows[0]) {
      return { success: false, message: 'Error getting trainer inventory' };
    }

    // Parse the inventory
    let inventory = [];
    try {
      const currentInventory = inventoryResult.rows[0][`inv_${category}`];
      inventory = currentInventory ? (typeof currentInventory === 'string' ? JSON.parse(currentInventory) : currentInventory) : [];
    } catch (error) {
      console.error(`Error parsing inventory for category ${category}:`, error);
      inventory = [];
    }

    // Add the item to inventory
    const newItem = {
      id: itemData.id || Date.now(),
      name: itemData.name || 'Unknown Item',
      description: itemData.description || '',
      quantity: itemData.quantity || 1,
      icon: itemData.icon || null
    };

    // Check if the item already exists in the inventory
    const existingItemIndex = inventory.findIndex(item => item.name === newItem.name);

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      inventory[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Add new item
      inventory.push(newItem);
    }

    // Update the trainer's inventory
    const updateQuery = `UPDATE trainers SET inv_${category} = $1 WHERE id = $2`;
    await pool.query(updateQuery, [JSON.stringify(inventory), trainer.id]);

    return {
      success: true,
      message: `Successfully added ${newItem.quantity} ${newItem.name} to ${trainer.name}'s inventory`
    };
  } catch (error) {
    console.error('Error processing item reward:', error);
    return { success: false, message: 'Error processing item reward: ' + error.message };
  }
}

/**
 * Process coin reward
 * @param {Object} reward - Reward object
 * @param {Object} trainer - Trainer object
 * @returns {Object} - Result object
 */
async function processCoinReward(reward, trainer) {
  try {
    console.log('Processing coin reward:', reward);

    // Get coin data from reward
    const coinData = reward.reward_data || reward.data || {};

    if (!coinData) {
      return { success: false, message: 'Invalid coin data' };
    }

    // Get the coin amount
    let coinAmount = 0;

    if (typeof coinData.amount === 'number') {
      coinAmount = coinData.amount;
    } else if (coinData.amount && typeof coinData.amount === 'object') {
      // If amount is a range, pick a random value
      const min = coinData.amount.min || 50;
      const max = coinData.amount.max || 150;
      coinAmount = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      coinAmount = 100; // Default fallback
    }

    console.log(`Processing coin reward with amount: ${coinAmount}`);
    console.log(`Coin data:`, coinData);

    // Update the trainer's coins
    // First check if the trainer has a coins property
    if (trainer.hasOwnProperty('coins')) {
      // Use the coins property
      await Trainer.update(trainer.id, {
        coins: (trainer.coins || 0) + coinAmount
      });
    } else if (trainer.hasOwnProperty('currency_amount')) {
      // Use the currency_amount property
      await Trainer.update(trainer.id, {
        currency_amount: (trainer.currency_amount || 0) + coinAmount
      });
    } else {
      // Use the addCoins method as a fallback
      await Trainer.addCoins(trainer.id, coinAmount);
    }

    return {
      success: true,
      message: `Successfully added ${coinAmount} coins to ${trainer.name}`
    };
  } catch (error) {
    console.error('Error processing coin reward:', error);
    return { success: false, message: 'Error processing coin reward: ' + error.message };
  }
}

/**
 * Process level reward
 * @param {Object} reward - Reward object
 * @param {Object} trainer - Trainer object
 * @returns {Object} - Result object
 */
async function processLevelReward(reward, trainer) {
  try {
    console.log('Processing level reward:', reward);

    // Get level data from reward
    const levelData = reward.reward_data || reward.data || {};

    if (!levelData) {
      return { success: false, message: 'Invalid level data' };
    }

    // Determine if this is a trainer level-up or monster level-up
    if (levelData.trainerLevelUp) {
      // Level up the trainer
      const levelsGained = levelData.levels || 1;

      await Trainer.update(trainer.id, {
        level: (trainer.level || 1) + levelsGained
      });

      return {
        success: true,
        message: `Successfully leveled up ${trainer.name} by ${levelsGained} levels`,
        trainerLevelUp: true
      };
    } else if (levelData.monsterId) {
      // Level up a specific monster
      const monsterId = levelData.monsterId;
      const levelsGained = levelData.levels || 1;

      // Get the monster
      const monster = await Monster.getById(monsterId);

      if (!monster) {
        return { success: false, message: 'Monster not found' };
      }

      // Check if the monster belongs to the trainer
      if (monster.trainer_id !== trainer.id) {
        return { success: false, message: 'This monster does not belong to the selected trainer' };
      }

      // Level up the monster
      await Monster.update(monsterId, {
        level: (monster.level || 1) + levelsGained
      });

      return {
        success: true,
        message: `Successfully leveled up ${monster.name || 'monster'} by ${levelsGained} levels`,
        monsterLevelUp: true,
        monsterName: monster.name || 'monster'
      };
    } else {
      // Default to trainer level-up
      const levelsGained = levelData.levels || 1;

      await Trainer.update(trainer.id, {
        level: (trainer.level || 1) + levelsGained
      });

      return {
        success: true,
        message: `Successfully leveled up ${trainer.name} by ${levelsGained} levels`,
        trainerLevelUp: true
      };
    }
  } catch (error) {
    console.error('Error processing level reward:', error);
    return { success: false, message: 'Error processing level reward: ' + error.message };
  }
}

module.exports = router;
