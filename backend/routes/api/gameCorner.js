const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../../config/db');
const MonsterRoller = require('../../models/MonsterRoller');
const MonsterInitializer = require('../../utils/MonsterInitializer');
const User = require('../../models/User');
const { buildRandomLimit } = require('../../utils/dbUtils');

/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon_enabled: true,
    digimon_enabled: true,
    yokai_enabled: true,
    nexomon_enabled: true,
    pals_enabled: true,
    fakemon_enabled: true
  };

  // If user has monster_roller_settings, parse them
  if (user && user.monster_roller_settings) {
    try {
      // Check if settings is already an object
      let settings;
      if (typeof user.monster_roller_settings === 'object') {
        settings = user.monster_roller_settings;
      } else {
        settings = JSON.parse(user.monster_roller_settings);
      }
      
      // Convert database format {pokemon: true} to expected format {pokemon_enabled: true}
      const convertedSettings = {};
      
      // Map database format to expected format
      if (settings.pokemon !== undefined) convertedSettings.pokemon_enabled = settings.pokemon;
      if (settings.digimon !== undefined) convertedSettings.digimon_enabled = settings.digimon;
      if (settings.yokai !== undefined) convertedSettings.yokai_enabled = settings.yokai;
      if (settings.pals !== undefined) convertedSettings.pals_enabled = settings.pals;
      if (settings.nexomon !== undefined) convertedSettings.nexomon_enabled = settings.nexomon;
      if (settings.fakemon !== undefined) convertedSettings.fakemon_enabled = settings.fakemon;
      
      // Also support if they're already in the expected format
      if (settings.pokemon_enabled !== undefined) convertedSettings.pokemon_enabled = settings.pokemon_enabled;
      if (settings.digimon_enabled !== undefined) convertedSettings.digimon_enabled = settings.digimon_enabled;
      if (settings.yokai_enabled !== undefined) convertedSettings.yokai_enabled = settings.yokai_enabled;
      if (settings.pals_enabled !== undefined) convertedSettings.pals_enabled = settings.pals_enabled;
      if (settings.nexomon_enabled !== undefined) convertedSettings.nexomon_enabled = settings.nexomon_enabled;
      if (settings.fakemon_enabled !== undefined) convertedSettings.fakemon_enabled = settings.fakemon_enabled;
      
      return { ...defaultSettings, ...convertedSettings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * @route   POST /api/town/game-corner/rewards
 * @desc    Generate rewards for Game Corner pomodoro sessions
 * @access  Private
 */
router.post('/rewards', protect, async (req, res) => {
  try {
    const { completedSessions, totalFocusMinutes, productivityScore, forceMonsterRoll } = req.body;
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Validate input
    if (!completedSessions || !totalFocusMinutes || productivityScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: completedSessions, totalFocusMinutes, productivityScore'
      });
    }

    // Get the user's trainers directly from database instead of internal API call
    let trainers = [];
    try {
      // Query trainers directly from the database
      const trainersQuery = `
        SELECT id, name, level, player_user_id
        FROM trainers
        WHERE player_user_id = $1
        ORDER BY created_at ASC
      `;
      
      if (require('../../utils/dbUtils').isPostgreSQL) {
        trainers = await db.asyncAll(trainersQuery, [userId]);
      } else {
        trainers = await db.asyncAll(trainersQuery.replace('$1', '?'), [userId]);
      }

      console.log(`Game Corner: Found ${trainers.length} trainers for user ${userId}`);
    } catch (error) {
      console.error('Error fetching trainers from database:', error);
      // Continue with empty trainers array if there's an error
    }

    // Calculate multipliers
    const productivityMultiplier = productivityScore / 100;
    const sessionMultiplier = Math.min(2, completedSessions / 4);
    const timeMultiplier = Math.min(2, totalFocusMinutes / 60);
    const combinedMultiplier = 1 + (productivityMultiplier + sessionMultiplier + timeMultiplier) / 3;

    // Get user settings for monster rolling
    console.log('🔍 DEBUG: Raw req.user object:', JSON.stringify(req.user, null, 2));
    console.log('🔍 DEBUG: req.user.monster_roller_settings:', req.user.monster_roller_settings);
    const userSettings = getUserSettings(req.user);
    console.log('🔍 DEBUG: Parsed userSettings:', JSON.stringify(userSettings, null, 2));

    // Generate rewards with the user's trainers
    const sessionId = uuidv4();

    // Debug logging
    console.log(`Game Corner: User ${userId} has ${trainers.length} trainers:`, trainers.map(t => ({ id: t.id, name: t.name })));

    const rewards = await generateGameCornerRewards(completedSessions, totalFocusMinutes, productivityScore, trainers, forceMonsterRoll, userSettings, req.user);

    // Return rewards with trainer data for frontend display
    res.json({
      success: true,
      sessionId,
      rewards,
      trainers, // Include trainer data so frontend can show proper names
      stats: {
        completedSessions,
        totalFocusMinutes,
        productivityScore,
        combinedMultiplier
      }
    });
  } catch (error) {
    console.error('Error generating Game Corner rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to generate rewards' });
  }
});

/**
 * Generate real rewards for Game Corner sessions
 * @param {number} completedSessions - Number of completed sessions
 * @param {number} totalFocusMinutes - Total focus minutes
 * @param {number} productivityScore - Productivity score
 * @param {Array} trainers - User's trainers
 * @param {boolean} forceMonsterRoll - Force at least one monster reward
 * @param {Object} userSettings - User settings
 * @param {Object} user - User object
 * @returns {Promise<Array>} Generated rewards
 */
async function generateGameCornerRewards(completedSessions, totalFocusMinutes, productivityScore, trainers = [], forceMonsterRoll = false, userSettings = {}, user = null) {
  const rewards = [];

  // Function to get a random trainer ID from the user's trainers
  const getRandomTrainerId = () => {
    if (!trainers || trainers.length === 0) {
      console.warn('No trainers available for reward assignment');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * trainers.length);
    const selectedTrainer = trainers[randomIndex];
    console.log(`Assigning reward to trainer: ${selectedTrainer.name} (ID: ${selectedTrainer.id}, type: ${typeof selectedTrainer.id})`);
    return selectedTrainer.id;
  };

  // Calculate modest scaling multipliers for reasonable coin amounts
  const timeBonus = Math.min(2.0, totalFocusMinutes / 50); // Max 2x bonus at 100+ minutes
  const sessionBonus = Math.min(1.5, completedSessions / 4); // Max 1.5x bonus at 4+ sessions  
  const performanceBonus = productivityScore / 200; // Max 0.5x bonus at 100% productivity
  
  // Much more conservative scaling for coin amounts
  const totalMultiplier = 1 + timeBonus + sessionBonus + performanceBonus;
  
  console.log(`Game Corner scaling: time bonus=${timeBonus.toFixed(2)}, session bonus=${sessionBonus.toFixed(2)}, performance bonus=${performanceBonus.toFixed(2)}, total=${totalMultiplier.toFixed(2)}x`);

  // Conservative base coin amount: 25min/60% = ~300-500 coins, 100min/100% = ~600-1200 coins
  const baseCoinAmount = Math.floor((80 + (completedSessions * 15) + (totalFocusMinutes * 2)) * totalMultiplier);

  // Calculate how many rewards to generate based on session activity
  const baseRewardCount = Math.max(2, Math.floor(1 + completedSessions * 0.8)); // 2-5 rewards based on sessions
  const bonusRewardCount = Math.floor(Math.random() * Math.max(1, Math.floor(totalFocusMinutes / 30))); // Bonus chance based on time
  const totalRewardSlots = baseRewardCount + bonusRewardCount;

  console.log(`Generating ${totalRewardSlots} reward slots for Game Corner (base: ${baseRewardCount}, bonus: ${bonusRewardCount})`);

  // Calculate individual reward chances - keep gambling variety
  const coinChance = Math.min(2.0, 0.6 + (totalMultiplier * 0.2)); // Reasonable coin chance
  const itemChance = Math.min(1.8, 0.4 + (totalMultiplier * 0.15)); // Item scaling
  const levelChance = Math.min(1.5, 0.3 + (totalMultiplier * 0.1)); // Level scaling  
  const monsterChance = Math.min(0.8, 0.05 + (totalMultiplier * 0.08)); // Monster chance

  // Handle force monster roll first (outside the normal reward loop)
  if (forceMonsterRoll) {
    console.log('🎰 Force monster roll activated!');
    await generateMonsterReward(rewards, getRandomTrainerId, userSettings);
    forceMonsterRoll = false; // Reset the flag
  }

  // Admin testing: Ensure admins always get at least one monster
  const isAdmin = user && (user.is_admin === 1 || user.is_admin === true);
  let adminMonsterGranted = forceMonsterRoll; // Track if admin already got a monster from force roll

  if (isAdmin && !adminMonsterGranted) {
    console.log('🔧 Admin detected - guaranteeing at least 1 monster reward for testing');
    await generateMonsterReward(rewards, getRandomTrainerId, userSettings);
    adminMonsterGranted = true;
  }

  // Generate rewards for each slot
  for (let slot = 0; slot < totalRewardSlots; slot++) {
    const rewardRoll = Math.random();

    // Determine what type of reward to generate for this slot
    if (rewardRoll < coinChance / totalRewardSlots || slot === 0) {
      // Coin reward (guaranteed for first slot, chance for others)
      // GAMBLING VARIANCE: Each coin reward can be 30% to 300% of base amount!
      const gamblingMultiplier = 0.3 + (Math.random() * 2.7); // 0.3x to 3.0x variance
      const coinVariation = Math.floor(baseCoinAmount * gamblingMultiplier);
      rewards.push({
        id: `coin-${uuidv4()}`,
        type: 'coin',
        reward_type: 'coin',
        rarity: 'common',
        reward_data: {
          amount: coinVariation,
          title: 'Coins'
        },
        assigned_to: getRandomTrainerId(),
        claimed: false
      });
    } else if (rewardRoll < (coinChance + itemChance) / totalRewardSlots) {
      // Item reward
      await generateItemReward(rewards, getRandomTrainerId, totalFocusMinutes, completedSessions);
    } else if (rewardRoll < (coinChance + itemChance + levelChance) / totalRewardSlots) {
      // Level reward
      await generateLevelReward(rewards, getRandomTrainerId, totalFocusMinutes, completedSessions);
    } else if (rewardRoll < (coinChance + itemChance + levelChance + monsterChance) / totalRewardSlots) {
      // Monster reward (natural chance)
      await generateMonsterReward(rewards, getRandomTrainerId, userSettings);
    }
  }

  // Ensure we have at least one reward
  if (rewards.length === 0) {
    rewards.push({
      id: `coin-${uuidv4()}`,
      type: 'coin',
      reward_type: 'coin',
      rarity: 'common',
      reward_data: {
        amount: baseCoinAmount,
        title: 'Coins'
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });
  }

  // Debug: Log all generated rewards and their assignments
  console.log('Generated Game Corner rewards:', rewards.map(r => ({
    type: r.type,
    assigned_to: r.assigned_to,
    title: r.reward_data.title
  })));

  // Auto-claim all rewards since Game Corner is random
  for (const reward of rewards) {
    await autoClaimReward(reward);
  }

  return rewards;
}

/**
 * Auto-claim a reward for Game Corner (no manual claim required)
 * @param {Object} reward - Reward object to auto-claim
 */
async function autoClaimReward(reward) {
  if (!reward.assigned_to) {
    console.warn(`Cannot auto-claim reward ${reward.id}: no trainer assigned`);
    return;
  }

  try {
    const rewardType = reward.type;
    const trainerId = reward.assigned_to;

    switch (rewardType) {
      case 'coin':
        await addCoinsToTrainer(trainerId, reward.reward_data.amount);
        console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.amount} coins for trainer ${trainerId}`);
        break;
      case 'item':
        const itemCategory = reward.reward_data.category || 'items';
        await addItemToTrainerInventory(trainerId, reward.reward_data.name, reward.reward_data.quantity, itemCategory);
        console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.quantity} ${reward.reward_data.name} (${itemCategory}) for trainer ${trainerId}`);
        break;
      case 'experience':
        await addExperienceToTrainer(trainerId, reward.reward_data.amount);
        console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.amount} experience for trainer ${trainerId}`);
        break;
      case 'level':
        if (reward.reward_data.isMonster) {
          // Get a random monster from the trainer to level up
          try {
            // Fix the parameter issue by building the query properly with proper parameter indexing
            const baseParams = [trainerId];
            let getTrainerMonstersQuery;
            
            if (require('../../utils/dbUtils').isPostgreSQL) {
              getTrainerMonstersQuery = `
                SELECT * FROM monsters
                WHERE trainer_id = $1
              `;
            } else {
              getTrainerMonstersQuery = `
                SELECT * FROM monsters
                WHERE trainer_id = ?
              `;
            }
            getTrainerMonstersQuery += buildRandomLimit(1, baseParams);

            const monster = await db.asyncGet(getTrainerMonstersQuery, baseParams);

            if (monster) {
              // Use the MonsterInitializer's levelUpMonster method for proper level progression
              const MonsterInitializer = require('../../utils/MonsterInitializer');
              const updatedMonster = await MonsterInitializer.levelUpMonster(monster.id, reward.reward_data.levels);
              
              console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.levels} level(s) for monster "${monster.name || monster.species1}" (trainer ${trainerId}). Level: ${monster.level || 1} → ${updatedMonster.level}`);
              
              // Update reward to show it was claimed by the monster
              reward.claimed_by_monster_id = monster.id;
              reward.claimed_by_monster_name = monster.name || monster.species1;
              reward.claimed_by_type = 'monster'; // Mark this as a monster claim
            } else {
              await addLevelsToTrainer(trainerId, reward.reward_data.levels);
              console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.levels} level(s) for trainer ${trainerId} (no monsters found)`);
            }
          } catch (error) {
            console.error('Error adding levels to monster:', error);
            await addLevelsToTrainer(trainerId, reward.reward_data.levels);
            console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.levels} level(s) for trainer ${trainerId} (fallback)`);
          }
        } else {
          await addLevelsToTrainer(trainerId, reward.reward_data.levels);
          console.log(`✅ AUTO-CLAIMED: ${reward.reward_data.levels} level(s) for trainer ${trainerId}`);
        }
        break;
      case 'monster':
        try {
          const monsterData = reward.reward_data;
          const Monster = require('../../models/Monster');

          // Get trainer's user ID
          const trainer = await db.asyncGet('SELECT player_user_id FROM trainers WHERE id = $1', [trainerId]);
          const playerUserId = trainer ? trainer.player_user_id : null;

          if (!playerUserId) {
            console.error(`Cannot create monster: trainer ${trainerId} not found`);
            return;
          }

          const finalMonsterName = monsterData.species1 || 'Game Corner Monster';

          // Create complete monster data object for the Monster model
          const completeMonsterData = {
            trainer_id: trainerId,
            player_user_id: playerUserId,
            name: finalMonsterName,
            species1: monsterData.species1 || null,
            species2: monsterData.species2 || null,
            species3: monsterData.species3 || null,
            type1: monsterData.type1 || null,
            type2: monsterData.type2 || null,
            type3: monsterData.type3 || null,
            type4: monsterData.type4 || null,
            type5: monsterData.type5 || null,
            attribute: monsterData.attribute || null,
            level: monsterData.level || 1,
            where_met: 'Game Corner'
          };

          // Use Monster.create() which handles proper validation and creation
          const createdMonster = await Monster.create(completeMonsterData);
          
          if (createdMonster && createdMonster.id) {
            // Initialize the monster with proper stats, moves, abilities, etc.
            await MonsterInitializer.initializeMonster(createdMonster.id);
            console.log(`✅ AUTO-CLAIMED: ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId} - Fully initialized with ID ${createdMonster.id}`);
          } else {
            console.log(`✅ AUTO-CLAIMED: ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId} - Basic creation only`);
          }
        } catch (monsterError) {
          console.error('Error auto-claiming monster:', monsterError);
        }
        break;
      default:
        console.log(`Unknown reward type: ${rewardType}`);
    }

    // Mark reward as claimed
    reward.claimed = true;
    reward.claimed_by = trainerId;
    reward.claimed_at = new Date().toISOString();
    
  } catch (error) {
    console.error('Error auto-claiming reward:', error);
  }
}

/**
 * Generate an item reward
 */
async function generateItemReward(rewards, getRandomTrainerId, totalFocusMinutes = 25, completedSessions = 1) {
  try {
    // Get random items from database
    const params = [];
    let itemQuery = `
      SELECT * FROM items
      WHERE category IN ('items', 'berries', 'balls', 'pastries')
      AND rarity IN ('common', 'uncommon', 'rare')
    `;
    itemQuery += buildRandomLimit(1, params);

    const items = await db.asyncAll(itemQuery, params);

    if (items && items.length > 0) {
      const randomItem = items[0];
      
      // Scale item quantity based on session time: 25min = 2-3 items, 100min = 2-9 items
      const timeScalingMultiplier = Math.max(1, totalFocusMinutes / 25);
      const sessionScalingMultiplier = Math.max(1, completedSessions / 2);
      const itemScaling = timeScalingMultiplier * sessionScalingMultiplier;
      
      // Quantity based on rarity and scaling
      let baseQuantity = 1;
      let maxQuantity = 3;
      
      if (randomItem.rarity === 'common') {
        baseQuantity = 2;
        maxQuantity = Math.min(9, Math.floor(2 + (itemScaling * 2))); // Scale to 2-9 items
      } else if (randomItem.rarity === 'uncommon') {
        baseQuantity = 1;
        maxQuantity = Math.min(6, Math.floor(1 + (itemScaling * 1.5))); // Scale to 1-6 items
      } else {
        baseQuantity = 1;
        maxQuantity = Math.min(4, Math.floor(1 + itemScaling)); // Scale to 1-4 items
      }
      
      const quantity = Math.floor(Math.random() * (maxQuantity - baseQuantity + 1)) + baseQuantity;

      rewards.push({
        id: `item-${uuidv4()}`,
        type: 'item',
        reward_type: 'item',
        rarity: randomItem.rarity || 'common',
        reward_data: {
          name: randomItem.name,
          quantity: quantity,
          title: `${quantity} ${randomItem.name}${quantity > 1 ? 's' : ''}`,
          description: randomItem.description || `${quantity} ${randomItem.name}${quantity > 1 ? 's' : ''} from the Game Corner.`,
          category: randomItem.category || 'items'
        },
        assigned_to: getRandomTrainerId(),
        claimed: false
      });
    }
  } catch (error) {
    console.error('Error getting items from database:', error);
    
    // Scale fallback item quantity
    const timeScalingMultiplier = Math.max(1, totalFocusMinutes / 25);
    const sessionScalingMultiplier = Math.max(1, completedSessions / 2);
    const itemScaling = timeScalingMultiplier * sessionScalingMultiplier;
    const quantity = Math.floor(Math.random() * Math.min(9, Math.floor(2 + (itemScaling * 2)))) + 2;
    
    // Fallback to hardcoded item
    rewards.push({
      id: `item-${uuidv4()}`,
      type: 'item',
      reward_type: 'item',
      rarity: 'common',
      reward_data: {
        name: 'Potion',
        quantity: quantity,
        title: `${quantity} Potions`,
        category: 'items'
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });
  }
}

/**
 * Generate a level reward
 */
async function generateLevelReward(rewards, getRandomTrainerId, totalFocusMinutes = 25, completedSessions = 1) {
  // Scale levels based on total session time: 25min = 1-3 levels, 100min = 1-15 levels
  const timeScalingMultiplier = Math.max(1, totalFocusMinutes / 25);
  const sessionScalingMultiplier = Math.max(1, completedSessions / 2);
  const levelScaling = timeScalingMultiplier * sessionScalingMultiplier;
  
  const maxLevels = Math.min(15, Math.floor(1 + (levelScaling * 2.5))); // Scale from 1-3 to 1-15
  const levels = Math.floor(Math.random() * maxLevels) + 1;
  const isMonsterLevel = Math.random() < 0.4; // 40% chance for monster levels

  if (isMonsterLevel) {
    // For monster levels, we need to select a specific monster
    // We'll store the trainer ID and let the claim process select a random monster
    rewards.push({
      id: `level-${uuidv4()}`,
      type: 'level',
      reward_type: 'level',
      rarity: 'uncommon',
      reward_data: {
        levels: levels,
        isMonster: true,
        title: `${levels} Level${levels > 1 ? 's' : ''} for Monster`,
        description: `${levels} level${levels > 1 ? 's' : ''} for a random monster`
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });
  } else {
    // Trainer levels
    rewards.push({
      id: `level-${uuidv4()}`,
      type: 'level',
      reward_type: 'level',
      rarity: 'uncommon',
      reward_data: {
        levels: levels,
        isMonster: false,
        title: `${levels} Level${levels > 1 ? 's' : ''} for Trainer`,
        description: `${levels} level${levels > 1 ? 's' : ''} for your trainer`
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });
  }
}

/**
 * Generate a monster reward
 */
async function generateMonsterReward(rewards, getRandomTrainerId, userSettings = {}) {
  try {
    // Determine monster tier based on extremely rare chances
    const tierRoll = Math.random();
    let monsterTier = 'normal';
    let rollParams = {};
    let rarity = 'rare';
    let levelRange = [1, 5];

    // MICROSCOPIC chance (0.01%) for legendary Pokemon
    if (tierRoll < 0.0001) {
      monsterTier = 'legendary_pokemon';
      rollParams = {
        includeStages: ['Base Stage', 'Stage 1', 'Stage 2'],
        includeLegendary: true,
        includeMythical: false,
        enabledTables: ['pokemon'],
        context: 'legendary_game_corner'
      };
      rarity = 'legendary';
      levelRange = [10, 25];
      console.log('🌟 LEGENDARY POKEMON rolled in Game Corner! (0.01% chance)');
    }
    // VERY rare chance (0.1%) for mythical/ultimate/S-rank
    else if (tierRoll < 0.001) {
      const mythicalType = Math.random();

      if (mythicalType < 0.33) {
        // Mythical Pokemon
        monsterTier = 'mythical_pokemon';
        rollParams = {
          includeStages: ['Base Stage', 'Stage 1'],
          includeLegendary: false,
          includeMythical: true,
          enabledTables: ['pokemon'],
          context: 'mythical_game_corner'
        };
        console.log('✨ MYTHICAL POKEMON rolled in Game Corner! (0.033% chance)');
      } else if (mythicalType < 0.66) {
        // Ultimate Digimon
        monsterTier = 'ultimate_digimon';
        rollParams = {
          includeRanks: ['Ultimate'],
          enabledTables: ['digimon'],
          context: 'ultimate_game_corner'
        };
        console.log('🔥 ULTIMATE DIGIMON rolled in Game Corner! (0.033% chance)');
      } else {
        // S-Rank Yokai
        monsterTier = 'srank_yokai';
        rollParams = {
          includeRanks: ['S'],
          enabledTables: ['yokai'],
          context: 'srank_game_corner'
        };
        console.log('👻 S-RANK YOKAI rolled in Game Corner! (0.033% chance)');
      }

      rarity = 'mythical';
      levelRange = [8, 20];
    }
    // Tiny chance (2%) for higher evolution stage
    else if (tierRoll < 0.02) {
      monsterTier = 'evolved';
      rollParams = {
        includeStages: ['Stage 1', 'Stage 2'],
        includeRanks: ['Child', 'Adult', 'Perfect', 'A', 'B'],
        maxLevel: 15,
        context: 'evolved_game_corner'
      };
      rarity = 'epic';
      levelRange = [5, 12];
      console.log('⭐ EVOLVED MONSTER rolled in Game Corner! (2% chance)');
    }
    // Normal chance for basic monsters
    else {
      monsterTier = 'normal';
      rollParams = {
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        maxLevel: 10,
        context: 'game_corner'
      };
      rarity = 'rare';
      levelRange = [1, 5];
    }

    // Build enabled tables based on user settings (supports both formats)
    const enabledTables = [];
    if (userSettings.pokemon_enabled === true || userSettings.pokemon === true) enabledTables.push('pokemon');
    if (userSettings.digimon_enabled === true || userSettings.digimon === true) enabledTables.push('digimon');
    if (userSettings.yokai_enabled === true || userSettings.yokai === true) enabledTables.push('yokai');
    if (userSettings.pals_enabled === true || userSettings.pals === true) enabledTables.push('pals');
    if (userSettings.nexomon_enabled === true || userSettings.nexomon === true) enabledTables.push('nexomon');
    if (userSettings.fakemon_enabled === true || userSettings.fakemon === true) enabledTables.push('fakemon');

    // If no tables are enabled, fall back to pokemon only to prevent empty results
    if (enabledTables.length === 0) {
      console.warn('No monster types enabled for user, defaulting to pokemon only');
      enabledTables.push('pokemon');
    }

    // Override rollParams.enabledTables with user settings - user preferences always take priority
    if (rollParams.enabledTables) {
      // Filter the rollParams enabled tables by user settings
      rollParams.enabledTables = rollParams.enabledTables.filter(table => enabledTables.includes(table));
      
      // If filtering results in empty array, use user's enabled tables
      if (rollParams.enabledTables.length === 0) {
        rollParams.enabledTables = enabledTables;
        console.log(`🎯 Special tier ${monsterTier} had no enabled tables matching user settings, using user settings: ${enabledTables.join(', ')}`);
      }
    }

    console.log(`🎲 Game Corner monster generation - User enabled: [${enabledTables.join(', ')}], Using: [${(rollParams.enabledTables || enabledTables).join(', ')}]`);

    // Create a monster roller for Game Corner context
    const monsterRoller = new MonsterRoller({
      seed: `game-corner-${monsterTier}-${Date.now()}-${Math.random()}`,
      enabledTables: rollParams.enabledTables || enabledTables,
      userSettings
    });

    // Roll the monster with the determined parameters
    const monster = await monsterRoller.rollMonster(rollParams);

    if (monster) {
      // Final rarity determination based on actual monster properties
      if (monster.is_legendary) {
        rarity = 'legendary';
      } else if (monster.is_mythical || monster.rank === 'Ultimate' || monster.rank === 'S') {
        rarity = 'mythical';
      } else if (monster.stage === 'Stage 2' || monster.rank === 'Perfect' || monster.rank === 'A') {
        rarity = 'epic';
      } else if (monster.stage === 'Stage 1' || monster.rank === 'Adult' || monster.rank === 'B') {
        rarity = 'rare';
      }

      // Determine level based on tier
      const level = Math.floor(Math.random() * (levelRange[1] - levelRange[0] + 1)) + levelRange[0];

      // Create special descriptions for rare tiers
      let description = `A wild ${monster.species1} appeared from the Game Corner!`;
      let title = monster.species1;

      if (monsterTier === 'legendary_pokemon') {
        description = `🌟 A LEGENDARY ${monster.species1} has emerged from the depths of the Game Corner! This is incredibly rare!`;
        title = `⭐ LEGENDARY ${monster.species1} ⭐`;
      } else if (monsterTier === 'mythical_pokemon') {
        description = `✨ A MYTHICAL ${monster.species1} has blessed you from the Game Corner! Extraordinary luck!`;
        title = `✨ MYTHICAL ${monster.species1} ✨`;
      } else if (monsterTier === 'ultimate_digimon') {
        description = `🔥 An ULTIMATE level ${monster.species1} has digitized from the Game Corner! Ultimate power!`;
        title = `🔥 ULTIMATE ${monster.species1} 🔥`;
      } else if (monsterTier === 'srank_yokai') {
        description = `👻 An S-RANK ${monster.species1} has manifested from the Game Corner! Supreme spiritual energy!`;
        title = `👻 S-RANK ${monster.species1} 👻`;
      } else if (monsterTier === 'evolved') {
        description = `⭐ An evolved ${monster.species1} has appeared from the Game Corner! Higher power awaits!`;
        title = `⭐ ${monster.species1} ⭐`;
      }

      const rewardData = {
        id: `monster-${uuidv4()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: rarity,
        reward_data: {
          species1: monster.species1,
          species2: monster.species2,
          species3: monster.species3,
          type1: monster.type1,
          type2: monster.type2,
          type3: monster.type3,
          attribute: monster.attribute,
          level: level,
          title: title,
          description: description,
          monster_data: monster,
          tier: monsterTier,
          is_special: monsterTier !== 'normal'
        },
        assigned_to: getRandomTrainerId(),
        claimed: false
      };

      rewards.push(rewardData);

      // Log special monster rewards for tracking
      if (monsterTier !== 'normal') {
        console.log(`🎰 SPECIAL MONSTER REWARD GENERATED:`, {
          tier: monsterTier,
          rarity: rarity,
          species: monster.species1,
          level: level,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error rolling monster for Game Corner:', error);
  }
}

/**
 * @route   POST /api/town/game-corner/claim
 * @desc    Claim a reward from Game Corner
 * @access  Private
 */
router.post('/claim', protect, async (req, res) => {
  try {
    const { rewardId, trainerId, rewardData, monsterName } = req.body;
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!rewardId || !trainerId || !rewardData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: rewardId, trainerId, rewardData'
      });
    }

    // Verify the trainer belongs to the user
    try {
      const trainerResponse = await axios.get(`http://localhost:4890/api/trainers/${trainerId}`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      if (!trainerResponse.data || !trainerResponse.data.success) {
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }

      const trainer = trainerResponse.data.trainer || trainerResponse.data.data || trainerResponse.data;

      if (trainer.player_user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to assign rewards to this trainer' });
      }
    } catch (error) {
      console.error('Error verifying trainer:', error);
      return res.status(500).json({ success: false, message: 'Failed to verify trainer' });
    }

    // Process the reward based on its type
    const rewardType = rewardData.type;

    try {
      switch (rewardType) {
        case 'coin':
          // Add coins to trainer
          await addCoinsToTrainer(trainerId, rewardData.reward_data.amount);
          break;
        case 'item':
          // Add item to trainer inventory
          const manualClaimCategory = rewardData.reward_data.category || 'items';
          await addItemToTrainerInventory(trainerId, rewardData.reward_data.name, rewardData.reward_data.quantity, manualClaimCategory);
          break;
        case 'experience':
          // Add experience to trainer
          await addExperienceToTrainer(trainerId, rewardData.reward_data.amount);
          break;
        case 'level':
          // Add levels to trainer or monster
          if (rewardData.reward_data.isMonster) {
            // Get a random monster from the trainer to level up
            try {
              // Fix the parameter issue by building the query properly with proper parameter indexing
              const baseParams = [trainerId];
              let getTrainerMonstersQuery;
              
              if (require('../../utils/dbUtils').isPostgreSQL) {
                getTrainerMonstersQuery = `
                  SELECT * FROM monsters
                  WHERE trainer_id = $1
                `;
              } else {
                getTrainerMonstersQuery = `
                  SELECT * FROM monsters
                  WHERE trainer_id = ?
                `;
              }
              getTrainerMonstersQuery += buildRandomLimit(1, baseParams);

              const monster = await db.asyncGet(getTrainerMonstersQuery, baseParams);

              if (monster) {
                // Use the MonsterInitializer's levelUpMonster method for proper level progression
                const MonsterInitializer = require('../../utils/MonsterInitializer');
                const updatedMonster = await MonsterInitializer.levelUpMonster(monster.id, rewardData.reward_data.levels);
                
                console.log(`✅ MONSTER LEVEL REWARD: Added ${rewardData.reward_data.levels} level(s) to monster "${monster.name || monster.species1}" (ID: ${monster.id}). Level: ${monster.level || 1} → ${updatedMonster.level}`);
              } else {
                // No monsters found, give levels to trainer instead
                console.log(`No monsters found for trainer ${trainerId}, giving levels to trainer instead`);
                await addLevelsToTrainer(trainerId, rewardData.reward_data.levels);
              }
            } catch (error) {
              console.error('Error adding levels to monster:', error);
              // Fallback to trainer levels
              await addLevelsToTrainer(trainerId, rewardData.reward_data.levels);
            }
          } else {
            await addLevelsToTrainer(trainerId, rewardData.reward_data.levels);
          }
          break;
        case 'monster':
          // Add monster to trainer
          try {
            const monsterData = rewardData.reward_data;
            const Monster = require('../../models/Monster');

            // Get trainer's user ID
            const trainer = await db.asyncGet('SELECT player_user_id FROM trainers WHERE id = $1', [trainerId]);
            const playerUserId = trainer ? trainer.player_user_id : userId;

            const finalMonsterName = monsterName || monsterData.species1 || 'Game Corner Monster';

            // Create complete monster data object for the Monster model
            const completeMonsterData = {
              trainer_id: trainerId,
              player_user_id: playerUserId,
              name: finalMonsterName,
              species1: monsterData.species1 || null,
              species2: monsterData.species2 || null,
              species3: monsterData.species3 || null,
              type1: monsterData.type1 || null,
              type2: monsterData.type2 || null,
              type3: monsterData.type3 || null,
              type4: monsterData.type4 || null,
              type5: monsterData.type5 || null,
              attribute: monsterData.attribute || null,
              level: monsterData.level || 1,
              where_met: 'Game Corner'
            };

            // Use Monster.create() which handles proper validation and creation
            const createdMonster = await Monster.create(completeMonsterData);
            
            if (createdMonster && createdMonster.id) {
              // Initialize the monster with proper stats, moves, abilities, etc.
              await MonsterInitializer.initializeMonster(createdMonster.id);
              console.log(`Created ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId} - Fully initialized with ID ${createdMonster.id}`);
            } else {
              console.log(`Created ${monsterData.species1} (Level ${monsterData.level}) for trainer ${trainerId} - Basic creation only`);
            }
          } catch (monsterError) {
            console.error('Error creating monster:', monsterError);
            throw new Error('Failed to create monster');
          }
          break;
        default:
          console.log(`Unknown reward type: ${rewardType}`);
      }

      res.json({
        success: true,
        message: 'Reward claimed successfully',
        reward: {
          ...rewardData,
          claimed: true,
          claimed_by: trainerId,
          claimed_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing reward:', error);
      res.status(500).json({ success: false, message: 'Failed to process reward' });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
});

/**
 * Add coins to a trainer
 * @param {string} trainerId - Trainer ID
 * @param {number} amount - Amount of coins to add
 * @returns {Promise<void>}
 */
async function addCoinsToTrainer(trainerId, amount) {
  try {
    // First, get the current trainer data
    const getTrainerQuery = `
      SELECT * FROM trainers
      WHERE id = $1
    `;

    const trainer = await db.asyncGet(getTrainerQuery, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Calculate new currency value
    const currentCurrency = trainer.currency_amount || 0;
    const newCurrency = currentCurrency + amount;
    const totalEarnedCurrency = trainer.total_earned_currency || 0;
    const newTotalEarnedCurrency = totalEarnedCurrency + amount;

    // Update the trainer's currency
    const updateQuery = `
      UPDATE trainers
      SET currency_amount = $1, total_earned_currency = $2
      WHERE id = $3
    `;

    await db.asyncRun(updateQuery, [newCurrency, newTotalEarnedCurrency, trainerId]);

    console.log(`Added ${amount} coins to trainer ${trainerId}. New balance: ${newCurrency}`);
  } catch (error) {
    console.error('Error adding coins to trainer:', error);
    throw error;
  }
}

/**
 * Add item to trainer inventory
 * @param {string} trainerId - Trainer ID
 * @param {string} itemName - Item name
 * @param {number} quantity - Quantity to add
 * @returns {Promise<void>}
 */
async function addItemToTrainerInventory(trainerId, itemName, quantity, category = 'items') {
  try {
    // Map category names to database column names
    const categoryMapping = {
      'items': 'items',
      'balls': 'balls',
      'berries': 'berries', 
      'pastries': 'pastries',
      'evolution': 'evolution',
      'eggs': 'eggs',
      'antiques': 'antiques',
      'helditems': 'helditems',
      'seals': 'seals',
      'keyitems': 'keyitems'
    };

    const dbColumn = categoryMapping[category] || 'items';

    // First, get the current trainer inventory
    const getInventoryQuery = `
      SELECT * FROM trainer_inventory
      WHERE trainer_id = $1
    `;

    const inventory = await db.asyncGet(getInventoryQuery, [trainerId]);

    if (!inventory) {
      // Create a new inventory entry if it doesn't exist
      const initialCategoryItems = JSON.stringify({ [itemName]: quantity });
      const createInventoryQuery = `
        INSERT INTO trainer_inventory (trainer_id, ${dbColumn})
        VALUES ($1, $2)
      `;

      await db.asyncRun(createInventoryQuery, [trainerId, initialCategoryItems]);

      console.log(`Created new inventory for trainer ${trainerId} with ${quantity} ${itemName} in ${category} category`);
      return;
    }

    // Parse the existing category items JSON
    let categoryItems = {};
    try {
      categoryItems = JSON.parse(inventory[dbColumn] || '{}');
    } catch (e) {
      console.error(`Error parsing inventory ${category}:`, e);
      categoryItems = {};
    }

    // Update the item quantity
    categoryItems[itemName] = (categoryItems[itemName] || 0) + quantity;

    // Update the inventory
    const updateInventoryQuery = `
      UPDATE trainer_inventory
      SET ${dbColumn} = $1
      WHERE trainer_id = $2
    `;

    await db.asyncRun(updateInventoryQuery, [JSON.stringify(categoryItems), trainerId]);

    console.log(`Added ${quantity} ${itemName} to trainer ${trainerId}'s ${category} inventory`);
  } catch (error) {
    console.error('Error adding item to trainer inventory:', error);
    throw error;
  }
}

/**
 * Add experience to a trainer
 * @param {string} trainerId - Trainer ID
 * @param {number} amount - Amount of experience to add
 * @returns {Promise<void>}
 */
async function addExperienceToTrainer(trainerId, amount) {
  try {
    // First, get the current trainer data
    const getTrainerQuery = `
      SELECT * FROM trainers
      WHERE id = $1
    `;

    const trainer = await db.asyncGet(getTrainerQuery, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Calculate new experience value
    const currentExp = trainer.experience || 0;
    const newExp = currentExp + amount;

    // Update the trainer's experience
    const updateQuery = `
      UPDATE trainers
      SET experience = $1
      WHERE id = $2
    `;

    await db.asyncRun(updateQuery, [newExp, trainerId]);

    console.log(`Added ${amount} experience to trainer ${trainerId}. New experience: ${newExp}`);
  } catch (error) {
    console.error('Error adding experience to trainer:', error);
    throw error;
  }
}

/**
 * Add levels to a trainer
 * @param {string} trainerId - Trainer ID
 * @param {number} levels - Number of levels to add
 * @returns {Promise<void>}
 */
async function addLevelsToTrainer(trainerId, levels) {
  try {
    // First, get the current trainer data
    const getTrainerQuery = `
      SELECT * FROM trainers
      WHERE id = $1
    `;

    const trainer = await db.asyncGet(getTrainerQuery, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Calculate new level value
    const currentLevel = trainer.level || 1;
    const newLevel = currentLevel + levels;

    // Update the trainer's level
    const updateQuery = `
      UPDATE trainers
      SET level = $1
      WHERE id = $2
    `;

    await db.asyncRun(updateQuery, [newLevel, trainerId]);

    console.log(`⬆️ TRAINER LEVEL REWARD: Added ${levels} level(s) to trainer ${trainerId}. Level: ${currentLevel} → ${newLevel}`);
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    throw error;
  }
}

module.exports = router;
