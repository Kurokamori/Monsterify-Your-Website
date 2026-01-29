const asyncHandler = require('express-async-handler');
const GardenPoint = require('../models/GardenPoint');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Bazar = require('../models/Bazar');
const { v4: uuidv4 } = require('uuid');
const MonsterRoller = require('../models/MonsterRoller');

// In-memory storage for active garden harvest sessions
const activeHarvestSessions = {};

/**
 * @desc    Get garden points for the current user
 * @route   GET /api/garden/points
 * @access  Private
 */
const getGardenPoints = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get garden points
    const gardenPoints = await GardenPoint.getByUserId(userId);

    res.json({
      success: true,
      data: gardenPoints || { user_id: userId, points: 0, last_harvested: null }
    });
  } catch (error) {
    console.error('Error getting garden points:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting garden points',
      error: error.message
    });
  }
});

/**
 * @desc    Harvest garden points
 * @route   POST /api/garden/harvest
 * @access  Private
 */
const harvestGarden = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.user.discord_id);

    // Harvest garden points
    const harvestResult = await GardenPoint.harvest(userId);

    if (!harvestResult.success) {
      return res.status(400).json({
        success: false,
        message: harvestResult.message
      });
    }

    // Store the session in memory
    activeHarvestSessions[harvestResult.session_id] = {
      ...harvestResult.session,
      trainers: trainers || []
    };

    res.json({
      success: true,
      message: harvestResult.message,
      session_id: harvestResult.session_id,
      session: harvestResult.session,
      rewards: harvestResult.rewards
    });
  } catch (error) {
    console.error('Error harvesting garden:', error);
    res.status(500).json({
      success: false,
      message: 'Error harvesting garden',
      error: error.message
    });
  }
});

/**
 * @desc    Get garden harvest session
 * @route   GET /api/garden/session/:sessionId
 * @access  Private
 */
const getHarvestSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get session from memory
    const session = activeHarvestSessions[sessionId];

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session belongs to user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      session,
      rewards: session.rewards
    });
  } catch (error) {
    console.error('Error getting harvest session:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting harvest session',
      error: error.message
    });
  }
});

/**
 * @desc    Claim a reward from a garden harvest session
 * @route   POST /api/garden/claim
 * @access  Private
 */
const claimReward = asyncHandler(async (req, res) => {
  try {
    const { sessionId, rewardId, trainerId } = req.body;
    const userId = req.user.id;

    if (!sessionId || !rewardId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get session from memory
    const session = activeHarvestSessions[sessionId];

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session belongs to user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the reward
    const reward = session.rewards.find(r => r.id === rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if reward is already claimed
    if (reward.claimed) {
      return res.status(400).json({
        success: false,
        message: 'Reward already claimed'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Process reward based on type
    let claimResult;
    switch (reward.type) {
      case 'item':
        // Add item to trainer inventory
        claimResult = await Trainer.updateInventoryItem(
          trainerId,
          reward.reward_data.category,
          reward.reward_data.name,
          reward.reward_data.quantity || 1
        );
        break;

      case 'monster':
        // Get monster name from request
        const monsterName = req.body.monsterName || '';

        // Check if the monster was pre-rolled
        if (reward.reward_data.monster_id) {
          console.log(`Using pre-rolled garden monster ${reward.reward_data.monster_id} (${reward.reward_data.monster_name || 'Unnamed'})`);

          // If a custom name was provided, update the monster's name
          if (monsterName && monsterName.trim() !== '') {
            try {
              // Get database connection
              const db = require('../config/db');

              await db.asyncRun(
                `UPDATE monsters SET name = $1 WHERE id = $2`,
                [monsterName.trim(), reward.reward_data.monster_id]
              );

              // Update the reward data with the new name
              reward.reward_data.monster_name = monsterName.trim();
              console.log(`Updated pre-rolled monster name to: ${monsterName.trim()}`);
            } catch (nameError) {
              console.error('Error updating monster name:', nameError);
              // Continue with the original name if there's an error
            }
          }

          // Create a new monster from the pre-rolled data
          try {
            const Monster = require('../models/Monster');
            const MonsterInitializer = require('../utils/MonsterInitializer');

            // Prepare monster data from the pre-rolled reward data
            const monsterData = {
              name: reward.reward_data.monster_name || 'Unnamed',
              species1: reward.reward_data.species1,
              species2: reward.reward_data.species2,
              species3: reward.reward_data.species3,
              type1: reward.reward_data.type1,
              type2: reward.reward_data.type2,
              type3: reward.reward_data.type3,
              attribute: reward.reward_data.attribute,
              level: reward.reward_data.level || 1,
              trainer_id: trainerId,
              img_link: reward.reward_data.monster_image,
              where_met: 'Garden Activity'
            };

            // Initialize the monster with proper stats and moves using the complete data
            const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);
            console.log('Pre-rolled monster initialized:', initializedMonster);

            // Create the monster in the database
            const createdMonster = await Monster.create(initializedMonster);
            console.log(`Created pre-rolled monster in database with ID: ${createdMonster.id}`);

            claimResult = createdMonster;
          } catch (trainerError) {
            console.error('Error creating pre-rolled monster:', trainerError);
            // Return basic info even if there's an error
            claimResult = {
              name: reward.reward_data.monster_name || 'Unnamed',
              species1: reward.reward_data.species1 || 'Unknown',
              trainer_id: trainerId,
              error: 'Failed to create monster'
            };
          }
        } else {
          // If the monster wasn't pre-rolled, roll it now
          console.log('Monster was not pre-rolled, rolling now...');

          // Roll a monster for the trainer using same settings as nursery
          const userSettings = getUserSettings(req.user);
          console.log('Garden - Raw user monster_roller_settings:', req.user.monster_roller_settings);
          console.log('Garden - Converted userSettings:', userSettings);
          const monsterRoller = new MonsterRoller({
            seed: `${sessionId}-${rewardId}`,
            userSettings: userSettings
          });

          // Roll monster with parameters from reward data (now uses nursery-style parameters)
          const monster = await monsterRoller.rollMonster(reward.reward_data.params || {});

          if (!monster) {
            return res.status(500).json({
              success: false,
              message: 'Failed to roll monster'
            });
          }

          // Initialize monster for trainer
          const monsterData = {
            trainer_id: trainerId,
            name: monsterName || monster.species1,
            species1: monster.species1,
            species2: monster.species2 || null,
            species3: monster.species3 || null,
            type1: monster.type1,
            type2: monster.type2 || null,
            type3: monster.type3 || null,
            type4: monster.type4 || null,
            type5: monster.type5 || null,
            attribute: monster.attribute,
            level: 5
          };

          // Initialize the monster with proper stats and moves first
          const Monster = require('../models/Monster');
          const MonsterInitializer = require('../utils/MonsterInitializer');
          const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);
          console.log('Monster initialized:', initializedMonster);

          // Create the initialized monster in the database
          const createdMonster = await Monster.create(initializedMonster);

          if (!createdMonster) {
            return res.status(500).json({
              success: false,
              message: 'Failed to create monster'
            });
          }

          claimResult = createdMonster;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported reward type: ${reward.type}`
        });
    }

    // Mark reward as claimed
    reward.claimed = true;
    reward.claimed_by = trainerId;

    // Check if all rewards are claimed
    const allClaimed = session.rewards.every(r => r.claimed);

    // If all rewards are claimed, reset garden points
    if (allClaimed) {
      await GardenPoint.resetPointsAfterClaim(userId);
    }

    res.json({
      success: true,
      message: 'Reward claimed successfully',
      reward: {
        ...reward,
        claimed: true,
        claimed_by: trainerId
      },
      claimResult
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming reward',
      error: error.message
    });
  }
});

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
    fakemon_enabled: true,
    finalfantasy_enabled: true,
    monsterhunter_enabled: true,
    species_min: 1,
    species_max: 2, // Default to max 2 species
    types_min: 1,
    types_max: 3    // Default to max 3 types
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
      
      console.log('Garden - Parsed settings from database:', settings);
      
      // Convert database format {pokemon: true} to expected format {pokemon_enabled: true}
      const convertedSettings = {};
      
      // Map database format to expected format
      if (settings.pokemon !== undefined) convertedSettings.pokemon_enabled = settings.pokemon;
      if (settings.digimon !== undefined) convertedSettings.digimon_enabled = settings.digimon;
      if (settings.yokai !== undefined) convertedSettings.yokai_enabled = settings.yokai;
      if (settings.pals !== undefined) convertedSettings.pals_enabled = settings.pals;
      if (settings.nexomon !== undefined) convertedSettings.nexomon_enabled = settings.nexomon;
      if (settings.fakemon !== undefined) convertedSettings.fakemon_enabled = settings.fakemon;
      
      console.log('Garden - After conversion mapping:', convertedSettings);
      
      // Also support if they're already in the expected format
      if (settings.pokemon_enabled !== undefined) convertedSettings.pokemon_enabled = settings.pokemon_enabled;
      if (settings.digimon_enabled !== undefined) convertedSettings.digimon_enabled = settings.digimon_enabled;
      if (settings.yokai_enabled !== undefined) convertedSettings.yokai_enabled = settings.yokai_enabled;
      if (settings.pals_enabled !== undefined) convertedSettings.pals_enabled = settings.pals_enabled;
      if (settings.nexomon_enabled !== undefined) convertedSettings.nexomon_enabled = settings.nexomon_enabled;
      if (settings.fakemon_enabled !== undefined) convertedSettings.fakemon_enabled = settings.fakemon_enabled;
      
      // Copy other settings (species_min, species_max, types_min, types_max)
      if (settings.species_min !== undefined) convertedSettings.species_min = settings.species_min;
      if (settings.species_max !== undefined) convertedSettings.species_max = settings.species_max;
      if (settings.types_min !== undefined) convertedSettings.types_min = settings.types_min;
      if (settings.types_max !== undefined) convertedSettings.types_max = settings.types_max;
      
      return { ...defaultSettings, ...convertedSettings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * @desc    Forfeit a monster reward from a garden harvest session to the bazar
 * @route   POST /api/garden/forfeit
 * @access  Private
 */
const forfeitMonster = asyncHandler(async (req, res) => {
  try {
    const { sessionId, rewardId, monsterName } = req.body;
    const userId = req.user.id;

    if (!sessionId || !rewardId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get session from memory
    const session = activeHarvestSessions[sessionId];

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session belongs to user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find the reward
    const reward = session.rewards.find(r => r.id === rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if reward is already claimed
    if (reward.claimed) {
      return res.status(400).json({
        success: false,
        message: 'Reward already claimed'
      });
    }

    // Make sure it's a monster reward
    if (reward.type !== 'monster') {
      return res.status(400).json({
        success: false,
        message: 'Only monster rewards can be forfeited'
      });
    }

    // Create the monster directly in the bazar for garden rewards
    const bazarResult = await forfeitGardenMonsterToBazar(reward, userId, monsterName || '');

    if (bazarResult.success) {
      // Mark the reward as claimed and forfeited to prevent duplicate processing
      reward.claimed = true;
      reward.claimed_at = new Date().toISOString();
      reward.forfeited = true;
      reward.claimed_by = 'Garden-Forfeit'; // Special marker for forfeited monsters

      // Update the session in memory
      activeHarvestSessions[sessionId] = session;

      res.json({
        success: true,
        message: 'Monster successfully forfeited to the Bazar!',
        bazarMonsterId: bazarResult.bazarMonsterId
      });
    } else {
      res.status(500).json({
        success: false,
        message: bazarResult.message || 'Failed to forfeit monster to bazar'
      });
    }

  } catch (error) {
    console.error('Error forfeiting garden monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error forfeiting monster to bazar',
      error: error.message
    });
  }
});

/**
 * Helper function to forfeit a garden monster directly to the bazar
 */
const forfeitGardenMonsterToBazar = async (reward, userId, monsterName) => {
  try {
    const db = require('../config/db');
    
    // Extract monster data from reward
    const rewardData = reward.reward_data;
    const name = monsterName.trim() || rewardData.species1 || 'Garden Monster';
    
    // Create monster data object
    const monsterData = {
      name: name,
      species1: rewardData.species1 || null,
      species2: rewardData.species2 || null,
      species3: rewardData.species3 || null,
      type1: rewardData.type1 || null,
      type2: rewardData.type2 || null,
      type3: rewardData.type3 || null,
      type4: rewardData.type4 || null,
      type5: rewardData.type5 || null,
      attribute: rewardData.attribute || null,
      level: rewardData.level || 5,
      hp_total: rewardData.hp_total || 20,
      hp_iv: rewardData.hp_iv || 0,
      hp_ev: rewardData.hp_ev || 0,
      atk_total: rewardData.atk_total || 10,
      atk_iv: rewardData.atk_iv || 0,
      atk_ev: rewardData.atk_ev || 0,
      def_total: rewardData.def_total || 10,
      def_iv: rewardData.def_iv || 0,
      def_ev: rewardData.def_ev || 0,
      spa_total: rewardData.spa_total || 10,
      spa_iv: rewardData.spa_iv || 0,
      spa_ev: rewardData.spa_ev || 0,
      spd_total: rewardData.spd_total || 10,
      spd_iv: rewardData.spd_iv || 0,
      spd_ev: rewardData.spd_ev || 0,
      spe_total: rewardData.spe_total || 10,
      spe_iv: rewardData.spe_iv || 0,
      spe_ev: rewardData.spe_ev || 0,
      nature: rewardData.nature || 'Hardy',
      characteristic: rewardData.characteristic || 'Loves to eat',
      gender: rewardData.gender || 'Unknown',
      friendship: rewardData.friendship || 50,
      ability1: rewardData.ability1 || null,
      ability2: rewardData.ability2 || null,
      moveset: rewardData.moveset || '{}',
      img_link: rewardData.img_link || null,
      date_met: new Date().toISOString(),
      where_met: 'Garden',
      box_number: 0,
      trainer_index: 0
    };

    // Insert directly into bazar_monsters with special handling for garden monsters
    let bazarQuery, result, bazarMonsterId;

    if (db.isPostgreSQL) {
      bazarQuery = `
        INSERT INTO bazar_monsters (
          original_monster_id, forfeited_by_trainer_id, forfeited_by_user_id,
          name, species1, species2, species3, type1, type2, type3, type4, type5,
          attribute, level, hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
          def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev, spd_total, spd_iv, spd_ev,
          spe_total, spe_iv, spe_ev, nature, characteristic, gender, friendship,
          ability1, ability2, moveset, img_link, date_met, where_met, box_number, trainer_index
        ) VALUES (
          -1, -1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42
        )
        RETURNING id
      `;

      result = await db.asyncGet(bazarQuery, [
        userId, monsterData.name, monsterData.species1, monsterData.species2,
        monsterData.species3, monsterData.type1, monsterData.type2, monsterData.type3,
        monsterData.type4, monsterData.type5, monsterData.attribute, monsterData.level,
        monsterData.hp_total, monsterData.hp_iv, monsterData.hp_ev, monsterData.atk_total,
        monsterData.atk_iv, monsterData.atk_ev, monsterData.def_total, monsterData.def_iv,
        monsterData.def_ev, monsterData.spa_total, monsterData.spa_iv, monsterData.spa_ev,
        monsterData.spd_total, monsterData.spd_iv, monsterData.spd_ev, monsterData.spe_total,
        monsterData.spe_iv, monsterData.spe_ev, monsterData.nature, monsterData.characteristic,
        monsterData.gender, monsterData.friendship, monsterData.ability1, monsterData.ability2,
        monsterData.moveset, monsterData.img_link, monsterData.date_met, monsterData.where_met,
        monsterData.box_number, monsterData.trainer_index
      ]);

      bazarMonsterId = result.id;
    } else {
      bazarQuery = `
        INSERT INTO bazar_monsters (
          original_monster_id, forfeited_by_trainer_id, forfeited_by_user_id,
          name, species1, species2, species3, type1, type2, type3, type4, type5,
          attribute, level, hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
          def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev, spd_total, spd_iv, spd_ev,
          spe_total, spe_iv, spe_ev, nature, characteristic, gender, friendship,
          ability1, ability2, moveset, img_link, date_met, where_met, box_number, trainer_index
        ) VALUES (
          -1, -1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      result = await db.asyncRun(bazarQuery, [
        userId, monsterData.name, monsterData.species1, monsterData.species2,
        monsterData.species3, monsterData.type1, monsterData.type2, monsterData.type3,
        monsterData.type4, monsterData.type5, monsterData.attribute, monsterData.level,
        monsterData.hp_total, monsterData.hp_iv, monsterData.hp_ev, monsterData.atk_total,
        monsterData.atk_iv, monsterData.atk_ev, monsterData.def_total, monsterData.def_iv,
        monsterData.def_ev, monsterData.spa_total, monsterData.spa_iv, monsterData.spa_ev,
        monsterData.spd_total, monsterData.spd_iv, monsterData.spd_ev, monsterData.spe_total,
        monsterData.spe_iv, monsterData.spe_ev, monsterData.nature, monsterData.characteristic,
        monsterData.gender, monsterData.friendship, monsterData.ability1, monsterData.ability2,
        monsterData.moveset, monsterData.img_link, monsterData.date_met, monsterData.where_met,
        monsterData.box_number, monsterData.trainer_index
      ]);
      bazarMonsterId = result.lastID;
    }

    // Record transaction for garden monster forfeit
    try {
      await Bazar.recordTransaction('forfeit_garden_monster', 'monster', bazarMonsterId, -1, userId, null, null, {
        garden_reward: true,
        monster_name: monsterData.name,
        species: monsterData.species1
      });
    } catch (transactionError) {
      console.error('Error recording garden monster forfeit transaction:', transactionError);
      // Continue anyway, don't fail the whole operation
    }

    return {
      success: true,
      bazarMonsterId: bazarMonsterId
    };

  } catch (error) {
    console.error('Error adding monster to bazar:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  getGardenPoints,
  harvestGarden,
  getHarvestSession,
  claimReward,
  forfeitMonster
};
