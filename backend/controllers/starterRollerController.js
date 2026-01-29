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
      
      // Map database format to expected format
      const mappedSettings = {
        pokemon_enabled: settings.pokemon !== false,
        digimon_enabled: settings.digimon !== false,
        yokai_enabled: settings.yokai !== false,
        nexomon_enabled: settings.nexomon !== false,
        pals_enabled: settings.pals !== false,
        fakemon_enabled: settings.fakemon !== false,
        species_min: settings.species_min,
        species_max: settings.species_max,
        types_min: settings.types_min,
        types_max: settings.types_max
      };
      
      return { ...defaultSettings, ...mappedSettings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * @desc    Roll starter monsters (3 sets of 10 monsters)
 * @route   POST /api/starter-roller/roll
 * @access  Private
 */
const rollStarterSets = asyncHandler(async (req, res) => {
  try {
    // Get user settings
    const userSettings = getUserSettings(req.user);

    // Create monster roller
    const monsterRoller = new MonsterRoller({
      seed: req.body.seed || Date.now().toString(),
      userSettings
    });

    // Default parameters for starter monsters
    const defaultParams = {
      tables: monsterRoller.enabledTables,
      // Only roll base stage or doesn't evolve
      includeStages: ['Base Stage', 'Doesn\'t Evolve'],
      // No legendaries or mythicals
      legendary: false,
      mythical: false,
      // For Digimon, only roll Baby I, Baby II, and Child
      // For Yokai, only roll E, D, and C ranks (early stages)
      includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      // Quantity settings
      species_min: 1,
      species_max: 2, // Max 2 species
      types_min: 1,
      types_max: 3  // Max 3 types
    };

    // Merge default parameters with provided parameters
    const rollParams = { ...defaultParams, ...req.body };

    // Roll 3 sets of 10 monsters each
    const starterSets = [];
    for (let i = 0; i < 3; i++) {
      // Generate a new seed for each set based on the original seed
      const setSeed = `${monsterRoller.seed}-set-${i}`;
      const setRoller = new MonsterRoller({
        seed: setSeed,
        enabledTables: monsterRoller.enabledTables,
        userSettings
      });

      // Roll 10 monsters for this set
      const monsters = await setRoller.rollMany(rollParams, 10);

      if (!monsters || monsters.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No monsters found with the given parameters'
        });
      }

      starterSets.push({
        setId: i + 1,
        seed: setSeed,
        monsters
      });
    }

    res.json({
      success: true,
      data: starterSets,
      seed: monsterRoller.seed
    });
  } catch (error) {
    console.error('Error rolling starter monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Error rolling starter monsters',
      error: error.message
    });
  }
});

/**
 * @desc    Select starter monsters and add to trainer
 * @route   POST /api/starter-roller/select
 * @access  Private
 */
const selectStarters = asyncHandler(async (req, res) => {
  try {
    const { trainerId, selectedStarters } = req.body;

    // Validate trainerId
    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Validate selectedStarters
    if (!selectedStarters || !Array.isArray(selectedStarters) || selectedStarters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected starters are required'
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

    // Get user for player_user_id
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create monsters for trainer
    const createdMonsters = [];
    for (const starter of selectedStarters) {
      const { monster, name } = starter;
      const monsterType = monster.monster_type;

      // Prepare monster data for the monsters table
      let monsterData = {
        trainer_id: trainerId,
        player_user_id: user.discord_id,
        name: name || monster.name || `New ${monsterType} Monster`,
        level: 1,
        img_link: null, // Don't add the species image link to the image URL
      };

      // Map the monster data to the monsters table schema
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
      data: {
        trainer,
        monsters: createdMonsters
      },
      message: 'Starter monsters added to trainer successfully'
    });
  } catch (error) {
    console.error('Error selecting starter monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Error selecting starter monsters',
      error: error.message
    });
  }
});

module.exports = {
  rollStarterSets,
  selectStarters
};
