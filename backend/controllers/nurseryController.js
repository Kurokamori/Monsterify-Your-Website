const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const Trainer = require('../models/Trainer');
const EggHatcher = require('../models/EggHatcher');
const MonsterInitializer = require('../utils/MonsterInitializer');
const SpecialBerryService = require('../services/specialBerryService');
const cloudinary = require('../utils/cloudinary');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for hatch sessions
const hatchSessions = {};

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
 * @desc    Get trainer's eggs from inventory
 * @route   GET /api/nursery/eggs/:trainerId
 * @access  Private
 */
const getTrainerEggs = asyncHandler(async (req, res) => {
  try {
    const { trainerId } = req.params;
    const userId = req.user?.discord_id;

    console.log('getTrainerEggs - User:', req.user);
    console.log('getTrainerEggs - Discord ID:', userId);
    console.log('getTrainerEggs - Trainer ID:', trainerId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own trainers'
      });
    }

    // Get trainer inventory
    const inventory = await Trainer.getInventory(trainerId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Trainer inventory not found'
      });
    }

    // Extract eggs from inventory
    const eggs = inventory.eggs || {};

    res.json({
      success: true,
      eggs,
      trainer: {
        id: trainer.id,
        name: trainer.name
      }
    });
  } catch (error) {
    console.error('Error getting trainer eggs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer eggs'
    });
  }
});

/**
 * @desc    Get trainer's egg-related items
 * @route   GET /api/nursery/egg-items/:trainerId
 * @access  Private
 */
const getEggItems = asyncHandler(async (req, res) => {
  try {
    const { trainerId } = req.params;
    const userId = req.user?.discord_id;

    console.log('getEggItems - User:', req.user);
    console.log('getEggItems - Discord ID:', userId);
    console.log('getEggItems - Trainer ID:', trainerId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own trainers'
      });
    }

    // Get trainer inventory
    const inventory = await Trainer.getInventory(trainerId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Trainer inventory not found'
      });
    }

    // Define egg-related items by category
    const eggItemCategories = {
      poolFilters: [
        'S Rank Incense', 'A Rank Incense', 'B Rank Incense', 'C Rank Incense', 'D Rank Incense', 'E Rank Incense',
        'Restoration Color Incense', 'Virus Color Incense', 'Data Color Incense', 'Vaccine Color Incense',
        'Normal Poffin', 'Fire Poffin', 'Water Poffin', 'Electric Poffin', 'Grass Poffin', 'Ice Poffin',
        'Fighting Poffin', 'Poison Poffin', 'Ground Poffin', 'Flying Poffin', 'Psychic Poffin', 'Bug Poffin',
        'Rock Poffin', 'Ghost Poffin', 'Dragon Poffin', 'Dark Poffin', 'Steel Poffin', 'Fairy Poffin',
        'Spell Tag', 'DigiMeat', 'DigiTofu', 'Broken Bell', 'Complex Core', 'Shattered Core',
        'Worker\'s Permit', 'Workers Strike Notice'
      ],
      outcomeModifiers: [
        'Normal Nurture Kit', 'Fire Nurture Kit', 'Water Nurture Kit', 'Electric Nurture Kit', 'Grass Nurture Kit', 'Ice Nurture Kit',
        'Fighting Nurture Kit', 'Poison Nurture Kit', 'Ground Nurture Kit', 'Flying Nurture Kit', 'Psychic Nurture Kit', 'Bug Nurture Kit',
        'Rock Nurture Kit', 'Ghost Nurture Kit', 'Dragon Nurture Kit', 'Dark Nurture Kit', 'Steel Nurture Kit', 'Fairy Nurture Kit',
        'Corruption Code', 'Repair Code', 'Shiny New Code',
        'Hot Chocolate', 'Vanilla Milk', 'Chocolate Milk', 'Strawberry Milk', 'MooMoo Milk'
      ],
      iceCreams: [
        'Vanilla Ice Cream', 'Strawberry Ice Cream', 'Chocolate Ice Cream', 'Mint Ice Cream', 'Pecan Ice Cream'
      ],
      speciesControls: [
        'Input Field', 'Drop Down', 'Radio Buttons'
      ],
      incubators: [
        'Incubator'
      ]
    };

    // Extract relevant items from all inventory categories
    const availableItems = {};

    // Check all inventory categories for egg items
    const allCategories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

    for (const category of allCategories) {
      const categoryItems = inventory[category] || {};

      for (const [itemName, quantity] of Object.entries(categoryItems)) {
        // Check if this item is egg-related
        const isEggItem = Object.values(eggItemCategories).some(categoryList =>
          categoryList.includes(itemName)
        );

        if (isEggItem && quantity > 0) {
          availableItems[itemName] = quantity;
        }
      }
    }

    res.json({
      success: true,
      items: availableItems,
      categories: eggItemCategories,
      trainer: {
        id: trainer.id,
        name: trainer.name
      }
    });
  } catch (error) {
    console.error('Error getting egg items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get egg items'
    });
  }
});

/**
 * @desc    Start simple egg hatching
 * @route   POST /api/nursery/hatch
 * @access  Private
 */
const startHatch = asyncHandler(async (req, res) => {
  try {
    let { trainerId, eggCount, useIncubator, useVoidStone, imageUrl } = req.body;
    const userId = req.user.discord_id;

    // Parse boolean values from FormData strings
    useIncubator = useIncubator === 'true' || useIncubator === true;
    useVoidStone = useVoidStone === 'true' || useVoidStone === true;
    eggCount = parseInt(eggCount);

    console.log('Starting simple hatch:', { trainerId, eggCount, useIncubator, useVoidStone, hasFile: !!req.file });

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only hatch eggs for your own trainers'
      });
    }

    // Validate egg count
    if (!eggCount || eggCount < 1 || eggCount > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid egg count. Must be between 1 and 10.'
      });
    }

    // Check if trainer has enough eggs
    const inventory = await Trainer.getInventory(trainerId);
    const eggs = inventory.eggs || {};
    const standardEggs = eggs['Standard Egg'] || 0;

    if (standardEggs < eggCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.`
      });
    }

    // Handle image upload if file is provided
    let finalImageUrl = imageUrl;
    if (req.file && !useIncubator && !useVoidStone) {
      try {
        console.log('Uploading image to Cloudinary for hatch');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'nursery/hatch'
        });
        finalImageUrl = result.secure_url;
        console.log('Image uploaded successfully:', finalImageUrl);
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Check requirements (incubator, void stone, or artwork)
    if (!useIncubator && !useVoidStone && !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either an incubator, void stone, or artwork is required for hatching.'
      });
    }

    // If using incubator, check if trainer has enough
    if (useIncubator) {
      const incubators = eggs['Incubator'] || 0;
      if (incubators < eggCount) {
        return res.status(400).json({
          success: false,
          message: `Not enough Incubators. You have ${incubators}, need ${eggCount}.`
        });
      }
    }

    // If using void stone, check if trainer has enough
    if (useVoidStone) {
      const evolution = inventory.evolution || {};
      const voidStones = evolution['Void Evolution Stone'] || 0;
      if (voidStones < eggCount) {
        return res.status(400).json({
          success: false,
          message: `Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.`
        });
      }
    }

    // Get user settings for monster rolling
    const userSettings = getUserSettings(req.user);

    // Create egg hatcher
    const hatcher = new EggHatcher({
      seed: Date.now().toString(),
      userSettings
    });

    // Hatch eggs (simple hatch with no items)
    const hatchedEggs = await hatcher.hatchEggs({
      trainerId,
      eggCount,
      useIncubator: useIncubator || useVoidStone, // Treat void stone same as incubator for bypassing requirements
      imageUrl: finalImageUrl,
      selectedItems: {} // No items for simple hatch
    });

    // Get available special berries
    const specialBerries = await SpecialBerryService.getAvailableSpecialBerries(trainerId);

    // Create session
    const sessionId = uuidv4();
    const session = {
      sessionId,
      userId,
      trainerId,
      type: 'hatch',
      eggCount,
      useIncubator,
      useVoidStone,
      imageUrl: finalImageUrl,
      hatchedEggs,
      selectedMonsters: {},
      specialBerries,
      claimedMonsters: [],
      normalClaims: {},
      edenwiessUses: {},
      userSettings, // Store user settings for rerolls
      selectedItems: {}, // No items for simple hatch
      speciesInputs: {}, // No species inputs for simple hatch
      createdAt: new Date().toISOString()
    };

    hatchSessions[sessionId] = session;

    // Consume eggs and incubators/void stones
    await Trainer.updateInventoryItem(trainerId, 'eggs', 'Standard Egg', -eggCount);
    if (useIncubator) {
      await Trainer.updateInventoryItem(trainerId, 'eggs', 'Incubator', -eggCount);
    }
    if (useVoidStone) {
      await Trainer.updateInventoryItem(trainerId, 'evolution', 'Void Evolution Stone', -eggCount);
    }

    res.json({
      success: true,
      sessionId,
      hatchedEggs,
      specialBerries
    });
  } catch (error) {
    console.error('Error starting hatch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start hatching'
    });
  }
});

/**
 * @desc    Start complex egg hatching with items
 * @route   POST /api/nursery/nurture
 * @access  Private
 */
const startNurture = asyncHandler(async (req, res) => {
  try {
    let { trainerId, eggCount, useIncubator, useVoidStone, imageUrl, selectedItems, speciesInputs } = req.body;
    const userId = req.user.discord_id;

    // Parse boolean values from FormData strings
    useIncubator = useIncubator === 'true' || useIncubator === true;
    useVoidStone = useVoidStone === 'true' || useVoidStone === true;
    eggCount = parseInt(eggCount);

    // Parse selectedItems if it's a string (from FormData)
    if (typeof selectedItems === 'string') {
      try {
        selectedItems = JSON.parse(selectedItems);
      } catch (error) {
        selectedItems = {};
      }
    }

    // Parse speciesInputs if it's a string (from FormData)
    if (typeof speciesInputs === 'string') {
      try {
        speciesInputs = JSON.parse(speciesInputs);
      } catch (error) {
        speciesInputs = {};
      }
    }

    console.log('Starting nurture:', { trainerId, eggCount, useIncubator, useVoidStone, selectedItems, speciesInputs, hasFile: !!req.file });

    // Validate species inputs for species control items
    const speciesControlItems = ['Input Field', 'Drop Down', 'Radio Buttons'];
    const hasSpeciesControlItems = speciesControlItems.some(item => selectedItems[item] > 0);
    
    if (hasSpeciesControlItems) {
      // Check if required species inputs are provided
      if (selectedItems['Input Field'] > 0 && (!speciesInputs || !speciesInputs.species1)) {
        return res.status(400).json({
          success: false,
          message: 'Input Field item requires species1 to be specified',
          missingInput: 'species1'
        });
      }
      
      if (selectedItems['Drop Down'] > 0 && (!speciesInputs || !speciesInputs.species1 || !speciesInputs.species2)) {
        return res.status(400).json({
          success: false,
          message: 'Drop Down item requires species1 and species2 to be specified',
          missingInput: ['species1', 'species2']
        });
      }
      
      if (selectedItems['Radio Buttons'] > 0 && (!speciesInputs || !speciesInputs.species1 || !speciesInputs.species2 || !speciesInputs.species3)) {
        return res.status(400).json({
          success: false,
          message: 'Radio Buttons item requires species1, species2, and species3 to be specified',
          missingInput: ['species1', 'species2', 'species3']
        });
      }
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only nurture eggs for your own trainers'
      });
    }

    // Validate egg count
    if (!eggCount || eggCount < 1 || eggCount > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid egg count. Must be between 1 and 10.'
      });
    }

    // Check if trainer has enough eggs
    const inventory = await Trainer.getInventory(trainerId);
    const eggs = inventory.eggs || {};
    const standardEggs = eggs['Standard Egg'] || 0;

    if (standardEggs < eggCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.`
      });
    }

    // Handle image upload if file is provided
    let finalImageUrl = imageUrl;
    if (req.file && !useIncubator && !useVoidStone) {
      try {
        console.log('Uploading image to Cloudinary for nurture');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'nursery/nurture'
        });
        finalImageUrl = result.secure_url;
        console.log('Image uploaded successfully:', finalImageUrl);
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Check requirements (incubator, void stone, or artwork)
    if (!useIncubator && !useVoidStone && !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either an incubator, void stone, or artwork is required for nurturing.'
      });
    }

    // If using incubator, check if trainer has enough
    if (useIncubator) {
      const incubators = eggs['Incubator'] || 0;
      if (incubators < eggCount) {
        return res.status(400).json({
          success: false,
          message: `Not enough Incubators. You have ${incubators}, need ${eggCount}.`
        });
      }
    }

    // If using void stone, check if trainer has enough
    if (useVoidStone) {
      const evolution = inventory.evolution || {};
      const voidStones = evolution['Void Evolution Stone'] || 0;
      if (voidStones < eggCount) {
        return res.status(400).json({
          success: false,
          message: `Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.`
        });
      }
    }

    // Get user settings for monster rolling
    const userSettings = getUserSettings(req.user);

    // Create egg hatcher with items
    const hatcher = new EggHatcher({
      seed: Date.now().toString(),
      userSettings
    });

    // Process selected items
    const processedItems = { ...selectedItems };

    // Hatch eggs with item effects
    const hatchedEggs = await hatcher.hatchEggs({
      trainerId,
      eggCount,
      useIncubator: useIncubator || useVoidStone, // Treat void stone same as incubator for bypassing requirements
      imageUrl: finalImageUrl,
      selectedItems: processedItems,
      speciesInputs: speciesInputs || {}
    });

    // Get available special berries
    const specialBerries = await SpecialBerryService.getAvailableSpecialBerries(trainerId);

    // Create session
    const sessionId = uuidv4();
    const session = {
      sessionId,
      userId,
      trainerId,
      type: 'nurture',
      eggCount,
      useIncubator,
      useVoidStone,
      imageUrl: finalImageUrl,
      selectedItems: processedItems,
      hatchedEggs,
      selectedMonsters: {},
      specialBerries,
      claimedMonsters: [],
      normalClaims: {},
      edenwiessUses: {},
      userSettings, // Store user settings for rerolls
      speciesInputs: speciesInputs || {}, // Store species inputs for rerolls
      createdAt: new Date().toISOString()
    };

    hatchSessions[sessionId] = session;

    // Consume eggs, incubators, and items
    await Trainer.updateInventoryItem(trainerId, 'eggs', 'Standard Egg', -eggCount);
    if (useIncubator) {
      await Trainer.updateInventoryItem(trainerId, 'eggs', 'Incubator', -eggCount);
    }
    if (useVoidStone) {
      await Trainer.updateInventoryItem(trainerId, 'evolution', 'Void Evolution Stone', -eggCount);
    }

    // Consume selected items
    for (const [itemName, quantity] of Object.entries(selectedItems)) {
      if (quantity > 0) {
        // Find which category the item is in and consume it
        const inventory = await Trainer.getInventory(trainerId);
        const allCategories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

        for (const category of allCategories) {
          const categoryItems = inventory[category] || {};
          if (categoryItems[itemName]) {
            await Trainer.updateInventoryItem(trainerId, category, itemName, -quantity);
            break;
          }
        }
      }
    }

    res.json({
      success: true,
      sessionId,
      hatchedEggs,
      specialBerries
    });
  } catch (error) {
    console.error('Error starting nurture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start nurturing'
    });
  }
});

/**
 * @desc    Get hatch session details
 * @route   GET /api/nursery/session/:sessionId
 * @access  Private
 */
const getHatchSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.discord_id;

    const session = hatchSessions[sessionId];
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Hatch session not found'
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own hatch sessions'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting hatch session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hatch session'
    });
  }
});

/**
 * @desc    Select hatched monster from options
 * @route   POST /api/nursery/select
 * @access  Private
 */
const selectHatchedMonster = asyncHandler(async (req, res) => {
  try {
    const { sessionId, eggId, monsterIndex, monsterName, dnaSplicers, useEdenwiess } = req.body;
    const userId = req.user.discord_id;

    console.log('Selecting hatched monster:', { sessionId, eggId, monsterIndex, monsterName, useEdenwiess });
    console.log('Available sessions:', Object.keys(hatchSessions));
    console.log('Looking for session:', sessionId);

    const session = hatchSessions[sessionId];
    if (!session) {
      console.log('Session not found! Available sessions:', Object.keys(hatchSessions));
      return res.status(404).json({
        success: false,
        message: 'Hatch session not found'
      });
    }

    console.log('Found session:', session.sessionId);

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own hatch sessions'
      });
    }

    // Initialize claim tracking structures if needed
    if (!session.claimedMonsters) {
      session.claimedMonsters = [];
    }
    if (!session.normalClaims) {
      session.normalClaims = {}; // Track normal claims per egg: { eggId: true }
    }
    if (!session.edenwiessUses) {
      session.edenwiessUses = {}; // Track edenwiess uses per egg: { eggId: count }
    }

    // Check if this specific monster has already been claimed
    const eggKey = `${eggId}-${monsterIndex}`;
    if (session.claimedMonsters.includes(eggKey)) {
      return res.status(400).json({
        success: false,
        message: 'This monster has already been claimed'
      });
    }

    // If using edenwiess, check and consume the berry
    if (useEdenwiess) {
      console.log(`Checking Edenwiess for trainer ${session.trainerId}`);
      const hasEdenwiess = await SpecialBerryService.hasSpecialBerry(session.trainerId, 'Edenwiess');
      console.log(`Has Edenwiess: ${hasEdenwiess}`);

      if (!hasEdenwiess) {
        console.log('No Edenwiess berry available');
        return res.status(400).json({
          success: false,
          message: 'You do not have an Edenwiess berry'
        });
      }

      console.log('Attempting to consume Edenwiess berry');
      const consumed = await SpecialBerryService.consumeSpecialBerry(session.trainerId, 'Edenwiess');
      console.log(`Berry consumed: ${consumed}`);

      if (!consumed) {
        console.log('Failed to consume Edenwiess berry');
        return res.status(500).json({
          success: false,
          message: 'Failed to consume Edenwiess berry'
        });
      }

      // Track Edenwiess use for this egg
      session.edenwiessUses[eggId] = (session.edenwiessUses[eggId] || 0) + 1;
    } else {
      // Normal claim - check if this egg already has a normal claim
      if (session.normalClaims[eggId]) {
        return res.status(400).json({
          success: false,
          message: 'You can only claim one monster per egg without using an Edenwiess berry'
        });
      }
      
      // Mark this egg as having a normal claim
      session.normalClaims[eggId] = true;
    }

    // Find the selected monster
    const egg = session.hatchedEggs.find(e => e.eggId === eggId);
    if (!egg) {
      return res.status(404).json({
        success: false,
        message: 'Egg not found in session'
      });
    }

    const selectedMonster = egg.monsters[monsterIndex];
    if (!selectedMonster) {
      return res.status(404).json({
        success: false,
        message: 'Monster not found in egg'
      });
    }

    // Create the monster in the database
    const monsterData = {
      trainer_id: session.trainerId,
      player_user_id: session.discordUserId,
      name: monsterName || selectedMonster.name || 'Unnamed',
      species1: selectedMonster.species1,
      species2: selectedMonster.species2 || null,
      species3: selectedMonster.species3 || null,
      type1: selectedMonster.type1,
      type2: selectedMonster.type2 || null,
      type3: selectedMonster.type3 || null,
      type4: selectedMonster.type4 || null,
      type5: selectedMonster.type5 || null,
      attribute: selectedMonster.attribute,
      level: 1 // Hatched monsters start at level 5
    };

    // Initialize the monster with proper stats and moves first
    const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);

    // Create the initialized monster in the database
    const Monster = require('../models/Monster');
    const createdMonster = await Monster.create(initializedMonster);
    const monsterId = createdMonster.id;

    // Update trainer monster count
    const countResult = await db.asyncGet(
      `SELECT COUNT(*) as count FROM monsters WHERE trainer_id = $1`,
      [session.trainerId]
    );

    // Mark this monster as claimed
    session.claimedMonsters.push(eggKey);

    // Mark this egg as selected in the session
    session.selectedMonsters[eggId] = {
      monsterIndex,
      monsterId,
      monsterName: monsterData.name,
      selectedAt: new Date().toISOString()
    };

    // Use DNA Splicers if provided
    if (dnaSplicers && dnaSplicers > 0) {
      // Consume DNA Splicers from trainer inventory
      await Trainer.updateInventoryItem(session.trainerId, 'items', 'DNA Splicer', -dnaSplicers);

      // Apply DNA Splicer effects (could add additional species/types)
      console.log(`Used ${dnaSplicers} DNA Splicers on monster ${monsterId}`);
    }

    // Get updated special berries
    const updatedSpecialBerries = await SpecialBerryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedSpecialBerries;

    res.json({
      success: true,
      message: useEdenwiess ? 'Extra monster claimed successfully with Edenwiess berry' : 'Monster claimed successfully',
      monster: {
        id: monsterId,
        ...monsterData,
        ...initializedMonster
      },
      session: {
        sessionId: session.sessionId,
        selectedMonsters: session.selectedMonsters,
        claimedMonsters: session.claimedMonsters,
        totalEggs: session.eggCount,
        selectedCount: Object.keys(session.selectedMonsters).length
      },
      specialBerries: updatedSpecialBerries
    });
  } catch (error) {
    console.error('Error selecting hatched monster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select hatched monster'
    });
  }
});

/**
 * @desc    Reroll nursery hatching results using forget-me-not berry
 * @route   POST /api/nursery/reroll
 * @access  Private
 */
const rerollHatchingResults = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.discord_id;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: sessionId'
      });
    }

    // Get hatch session
    const session = hatchSessions[sessionId];
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Hatch session not found'
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own hatch sessions'
      });
    }

    // Check if trainer has forget-me-not berry
    const hasForgetMeNot = await SpecialBerryService.hasSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      return res.status(400).json({
        success: false,
        message: 'You do not have a Forget-Me-Not berry'
      });
    }

    // Consume the berry
    const consumed = await SpecialBerryService.consumeSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!consumed) {
      return res.status(500).json({
        success: false,
        message: 'Failed to consume Forget-Me-Not berry'
      });
    }

    // Create new hatcher with same parameters, preserving all user settings
    const hatcher = new EggHatcher({
      seed: Date.now().toString(), // New seed for reroll
      userSettings: session.userSettings || {},
      enabledTables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon']
    });

    // Regenerate hatching results with same parameters, preserving all settings and overrides
    const newHatchedEggs = await hatcher.hatchEggs({
      trainerId: session.trainerId,
      eggCount: session.eggCount,
      useIncubator: session.useIncubator,
      imageUrl: session.imageUrl,
      selectedItems: session.selectedItems || {},
      speciesInputs: session.speciesInputs || {} // Preserve species inputs for ice creams, input fields, etc.
    });

    // Update session with new results
    session.hatchedEggs = newHatchedEggs;
    session.selectedMonsters = {}; // Reset selections
    session.claimedMonsters = []; // Reset claimed monsters
    session.normalClaims = {}; // Reset normal claims
    session.edenwiessUses = {}; // Reset Edenwiess uses

    // Get updated special berries
    const updatedSpecialBerries = await SpecialBerryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedSpecialBerries;

    res.json({
      success: true,
      message: 'Hatching results rerolled successfully',
      sessionId,
      hatchedEggs: newHatchedEggs,
      specialBerries: updatedSpecialBerries
    });
  } catch (error) {
    console.error('Error rerolling hatching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reroll hatching results'
    });
  }
});

module.exports = {
  getTrainerEggs,
  getEggItems,
  startHatch,
  startNurture,
  getHatchSession,
  selectHatchedMonster,
  rerollHatchingResults
};
