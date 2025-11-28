const asyncHandler = require('express-async-handler');
const MonsterRoller = require('../models/MonsterRoller');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const db = require('../config/db');
const MonsterInitializer = require('../utils/MonsterInitializer');

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
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * @desc    Roll a monster
 * @route   POST /api/monster-roller/roll
 * @access  Private/Admin
 */
const rollMonster = asyncHandler(async (req, res) => {
  try {
    // Get user settings
    const userSettings = getUserSettings(req.user);

    // Create monster roller
    const monsterRoller = new MonsterRoller({
      seed: req.body.seed || Date.now().toString(),
      userSettings
    });

    // Roll monster with parameters
    const monster = await monsterRoller.rollMonster(req.body);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: 'No monster found with the given parameters'
      });
    }

    res.json({
      success: true,
      data: monster,
      seed: monsterRoller.seed
    });
  } catch (error) {
    console.error('Error rolling monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error rolling monster',
      error: error.message
    });
  }
});

/**
 * @desc    Roll multiple monsters
 * @route   POST /api/monster-roller/roll/many
 * @access  Private/Admin
 */
const rollMany = asyncHandler(async (req, res) => {
  try {
    const { count = 1 } = req.body;

    // Validate count
    if (count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 100'
      });
    }

    // Get user settings
    const userSettings = getUserSettings(req.user);

    // Create monster roller
    const monsterRoller = new MonsterRoller({
      seed: req.body.seed || Date.now().toString(),
      userSettings
    });

    // Roll monsters with parameters
    const monsters = await monsterRoller.rollMany(req.body, count);

    if (!monsters || monsters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No monsters found with the given parameters'
      });
    }

    res.json({
      success: true,
      data: monsters,
      seed: monsterRoller.seed,
      count: monsters.length
    });
  } catch (error) {
    console.error('Error rolling multiple monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Error rolling multiple monsters',
      error: error.message
    });
  }
});

/**
 * @desc    Roll a monster and add to trainer's inventory
 * @route   POST /api/monster-roller/roll/trainer
 * @access  Private/Admin
 */
const rollForTrainer = asyncHandler(async (req, res) => {
  try {
    const { trainerId, count = 1 } = req.body;

    // Validate trainerId
    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Validate count
    if (count < 1 || count > 10) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 10'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${trainerId} not found`
      });
    }

    // Get user settings
    const userSettings = getUserSettings(req.user);

    // Create monster roller
    const monsterRoller = new MonsterRoller({
      seed: req.body.seed || Date.now().toString(),
      userSettings
    });

    // Roll monsters with parameters
    const monsters = await monsterRoller.rollMany(req.body, count);

    if (!monsters || monsters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No monsters found with the given parameters'
      });
    }

    // Create monsters for trainer
    const createdMonsters = [];
    for (const monster of monsters) {
      const monsterType = monster.monster_type;

      // Get user for player_user_id
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare monster data for the monsters table
      let monsterData = {
        trainer_id: trainerId,
        player_user_id: user.discord_id,
        name: monster.name || `New ${monsterType} Monster`,
        level: 1,
        img_link: null, // Don't add the species image link to the image URL
      };

      // Map the monster data to the monsters table schema
      // Use the species, types, and attribute from the processed monster
      monsterData = {
        ...monsterData,
        species1: monster.species1 || monster.name,
        species2: monster.species2 || null,
        species3: monster.species3 || null,
        type1: monster.type1 || '',
        type2: monster.type2 || null,
        type3: monster.type3 || null,
        type4: monster.type4 || null,
        type5: monster.type5 || null,
        attribute: monster.attribute || null
      };

      // Add monster-type specific fields
      if (monsterType === 'pokemon') {
        monsterData.mon_index = monster.ndex || null;
      }

      // Initialize monster with stats, moves, abilities, etc.
      const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);

      // Create monster using the Monster model (which handles field filtering)
      const Monster = require('../models/Monster');
      const newMonster = await Monster.create(initializedMonster);

      createdMonsters.push(newMonster);
    }

    res.json({
      success: true,
      data: createdMonsters,
      seed: monsterRoller.seed,
      count: createdMonsters.length
    });
  } catch (error) {
    console.error('Error rolling monster for trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Error rolling monster for trainer',
      error: error.message
    });
  }
});

/**
 * @desc    Get all options for monster roller
 * @route   GET /api/monster-roller/options
 * @access  Private/Admin
 */
const getOptions = asyncHandler(async (req, res) => {
  try {
    // Get user settings
    const userSettings = getUserSettings(req.user);

    // Create monster roller
    const monsterRoller = new MonsterRoller({ userSettings });

    // Get all options
    const [names, types, attributes, ranks, stages, families] = await Promise.all([
      monsterRoller.getAllNames(),
      monsterRoller.getAllTypes(),
      monsterRoller.getAllAttributes(),
      monsterRoller.getAllRanks(),
      monsterRoller.getAllStages(),
      monsterRoller.getAllFamilies()
    ]);

    // Get table schemas
    const tableSchemas = {};
    monsterRoller.enabledTables.forEach(table => {
      tableSchemas[table] = monsterRoller.tableSchemas[table];
    });

    res.json({
      success: true,
      data: {
        names: names.sort(),
        types: types.sort(),
        attributes: attributes.sort(),
        ranks: ranks.sort(),
        stages: stages.sort(),
        families: families.sort(),
        tables: monsterRoller.enabledTables,
        tableSchemas
      }
    });
  } catch (error) {
    console.error('Error getting monster roller options:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting monster roller options',
      error: error.message
    });
  }
});

module.exports = {
  rollMonster,
  rollMany,
  rollForTrainer,
  getOptions
};
