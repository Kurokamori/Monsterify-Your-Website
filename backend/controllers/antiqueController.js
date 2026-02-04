const asyncHandler = require('express-async-handler');
const AntiqueRollSetting = require('../models/AntiqueRollSetting');
const AntiqueAuction = require('../models/AntiqueAuction');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const MonsterRoller = require('../models/MonsterRoller');
const MonsterInitializer = require('../utils/MonsterInitializer');
const AntiqueAppraisalService = require('../utils/AntiqueAppraisalService');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');

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
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * @desc    Get all antique roll settings
 * @route   GET /api/antiques/settings
 * @access  Private/Admin
 */
const getAntiqueRollSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await AntiqueRollSetting.getAll();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting antique roll settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get antique roll settings'
    });
  }
});

/**
 * @desc    Get all antique auctions
 * @route   GET /api/antiques/auctions
 * @access  Private/Admin
 */
const getAntiqueAuctions = asyncHandler(async (req, res) => {
  try {
    const auctions = await AntiqueAuction.getAll();
    res.json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error('Error getting antique auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get antique auctions'
    });
  }
});

/**
 * @desc    Get auction catalogue with filtering
 * @route   GET /api/antiques/catalogue
 * @access  Public
 */
const getAuctionCatalogue = asyncHandler(async (req, res) => {
  try {
    const { antique, species, type, creator, search, page, limit } = req.query;

    const filters = {
      antique,
      species,
      type,
      creator,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const result = await AntiqueAuction.getCatalogue(filters);

    res.json({
      success: true,
      data: result.auctions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting auction catalogue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auction catalogue'
    });
  }
});

/**
 * @desc    Get catalogue filter options (unique antiques, types, creators)
 * @route   GET /api/antiques/catalogue/filters
 * @access  Public
 */
const getCatalogueFilters = asyncHandler(async (req, res) => {
  try {
    // Get unique antiques and map them to their holidays
    const antiques = await AntiqueAuction.getUniqueAntiques();
    const types = await AntiqueAuction.getUniqueTypes();
    const creators = await AntiqueAuction.getUniqueCreators();

    // Map antiques to their holiday categories using AntiqueAppraisalService
    const antiquesWithHolidays = antiques.map(antique => {
      const antiqueData = AntiqueAppraisalService.getAntiqueByName(antique);
      return {
        name: antique,
        holiday: antiqueData?.holiday || 'Unknown'
      };
    });

    res.json({
      success: true,
      data: {
        antiques: antiquesWithHolidays,
        types,
        creators
      }
    });
  } catch (error) {
    console.error('Error getting catalogue filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get catalogue filters'
    });
  }
});

/**
 * @desc    Get trainer's antiques
 * @route   GET /api/antiques/trainer/:trainerId
 * @access  Private
 */
const getTrainerAntiques = asyncHandler(async (req, res) => {
  try {
    const { trainerId } = req.params;

    // Get trainer inventory
    const inventory = await Trainer.getInventory(trainerId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Trainer inventory not found'
      });
    }

    // Get antiques from inventory
    const antiques = inventory.antiques || {};

    // Format the response
    const formattedAntiques = Object.entries(antiques).map(([name, quantity]) => ({
      name,
      quantity
    }));

    res.json({
      success: true,
      data: formattedAntiques
    });
  } catch (error) {
    console.error(`Error getting antiques for trainer ${req.params.trainerId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer antiques'
    });
  }
});

/**
 * @desc    Appraise an antique
 * @route   POST /api/antiques/appraise
 * @access  Private
 */
const appraiseAntique = asyncHandler(async (req, res) => {
  try {
    const { trainerId, antique } = req.body;

    if (!trainerId || !antique) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and antique name are required'
      });
    }

    // Get trainer info to find the player user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Get the user to access their monster roller settings
    const user = await User.findByDiscordId(trainer.player_user_id);
    const userSettings = getUserSettings(user);

    // Check if trainer has the antique
    const inventory = await Trainer.getInventory(trainerId);
    if (!inventory || !inventory.antiques || !inventory.antiques[antique]) {
      return res.status(400).json({
        success: false,
        message: `Trainer does not have the antique: ${antique}`
      });
    }

    // Create monster roller with user settings
    const monsterRoller = new MonsterRoller({
      seed: Date.now().toString(),
      userSettings
    });

    // Variable to store the rolled monster
    let monster;

    // Try to get the roll settings from the database first
    let rollSettings = await AntiqueRollSetting.getByItemName(antique);

    // If not found in the database, try to use the AntiqueAppraisalService
    if (!rollSettings) {
      console.log(`Roll settings not found in database for antique: ${antique}, trying AntiqueAppraisalService...`);

      // Check if the antique exists in the AntiqueAppraisalService
      const antiqueExists = AntiqueAppraisalService.getAntiqueByName(antique);
      if (!antiqueExists) {
        return res.status(404).json({
          success: false,
          message: `Antique not found: ${antique}`
        });
      }

      // Roll monster with parameters from AntiqueAppraisalService
      monster = await AntiqueAppraisalService.rollMonster(antique, monsterRoller);
    } else {
      // Build roll parameters based on the antique's settings from the database
      const rollParams = {
        fusion_forced: rollSettings.fusion_forced === 1,
        min_types: rollSettings.min_types || 1,
        max_types: rollSettings.max_types || 5
      };

      // Add type restrictions if specified
      if (rollSettings.allowed_types && rollSettings.allowed_types.length > 0) {
        // If we have exactly the number of types needed, set them directly
        if (rollSettings.allowed_types.length === rollSettings.min_types &&
            rollSettings.min_types === rollSettings.max_types) {
          for (let i = 0; i < rollSettings.allowed_types.length; i++) {
            rollParams[`type${i+1}`] = rollSettings.allowed_types[i];
          }
        } else {
          // Otherwise, set as include types
          rollParams.includeTypes = rollSettings.allowed_types;
        }
      }

      // Add attribute restrictions if specified
      if (rollSettings.allowed_attributes && rollSettings.allowed_attributes.length > 0) {
        if (rollSettings.allowed_attributes.length === 1) {
          rollParams.attribute = rollSettings.allowed_attributes[0];
        } else {
          rollParams.includeAttributes = rollSettings.allowed_attributes;
        }
      }

      // Add species restrictions if specified
      if (rollSettings.allowed_species && rollSettings.allowed_species.length > 0) {
        if (rollSettings.allowed_species.length <= 3) {
          // If we have 3 or fewer species, set them directly
          for (let i = 0; i < rollSettings.allowed_species.length; i++) {
            rollParams[`species${i+1}`] = rollSettings.allowed_species[i];
          }
          rollParams.fusion_forced = true;
        } else {
          // Otherwise, set as include species
          rollParams.includeSpecies = rollSettings.allowed_species;
        }
      }

      // Roll monster with parameters
      monster = await monsterRoller.rollMonster(rollParams);
    }

    if (!monster) {
      return res.status(500).json({
        success: false,
        message: 'Failed to roll monster'
      });
    }

    // Use the antique (remove from inventory)
    await Trainer.updateInventoryItem(trainerId, 'antiques', antique, -1);

    res.json({
      success: true,
      message: `Successfully appraised ${antique}`,
      data: {
        monster,
        seed: monsterRoller.seed
      }
    });
  } catch (error) {
    console.error(`Error appraising antique:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to appraise antique'
    });
  }
});

/**
 * @desc    Get auction options for an antique
 * @route   GET /api/antiques/auction-options/:antique
 * @access  Private
 */
const getAuctionOptions = asyncHandler(async (req, res) => {
  try {
    const { antique } = req.params;

    // Get auction options for the antique
    const options = await AntiqueAuction.getByItemName(antique);
    if (!options || options.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No auction options found for antique: ${antique}`
      });
    }

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error(`Error getting auction options for antique ${req.params.antique}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auction options'
    });
  }
});

/**
 * @desc    Auction an antique
 * @route   POST /api/antiques/auction
 * @access  Private
 */
const auctionAntique = asyncHandler(async (req, res) => {
  try {
    const { trainerId, targetTrainerId, antique, auctionId, monsterName, discordUserId } = req.body;

    // Use targetTrainerId if provided, otherwise fall back to trainerId
    const actualTrainerId = targetTrainerId || trainerId;

    if (!trainerId || !antique || !auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID, antique name, and auction ID are required'
      });
    }

    // Check if trainer has the antique (check the source trainer's inventory)
    const inventory = await Trainer.getInventory(trainerId);
    if (!inventory || !inventory.antiques || !inventory.antiques[antique]) {
      return res.status(400).json({
        success: false,
        message: `Trainer does not have the antique: ${antique}`
      });
    }

    // Get the auction option
    const auction = await AntiqueAuction.getById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: `Auction option not found with ID: ${auctionId}`
      });
    }

    // Get the target trainer (where the monster will go)
    const targetTrainer = await Trainer.getById(actualTrainerId);
    if (!targetTrainer) {
      return res.status(404).json({
        success: false,
        message: 'Target trainer not found'
      });
    }

    // Create a monster from the auction data
    const monsterData = {
      species1: auction.species1,
      species2: auction.species2,
      species3: auction.species3,
      type1: auction.type1,
      type2: auction.type2,
      type3: auction.type3,
      type4: auction.type4,
      type5: auction.type5,
      attribute: auction.attribute,
      name: monsterName || auction.name || auction.species1,
      level: 1,
      trainer_id: actualTrainerId,
      player_user_id: discordUserId || targetTrainer.player_user_id
    };

    // Create the monster
    const monster = await Monster.create(monsterData);
    if (!monster) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create monster'
      });
    }

    // Initialize the monster with proper stats and moves
    let initializedMonster;
    try {
      initializedMonster = await MonsterInitializer.initializeMonster(monster.id);
    } catch (initError) {
      // If initialization fails, delete the monster and return error
      console.error('Failed to initialize monster, rolling back:', initError);
      await Monster.delete(monster.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize monster'
      });
    }

    // Record the auction claim
    try {
      await AntiqueAuction.recordAuctionClaim(auctionId, actualTrainerId, monster.id);
    } catch (claimError) {
      console.error('Failed to record claim, but monster was created:', claimError);
      // Continue - the monster was already created successfully
    }

    // ONLY consume the antique AFTER successful monster creation
    await Trainer.updateInventoryItem(trainerId, 'antiques', antique, -1);

    // Update target trainer's monster count
    await Trainer.updateMonsterCount(actualTrainerId);

    res.json({
      success: true,
      message: `Successfully auctioned ${antique}`,
      data: {
        monster: initializedMonster
      }
    });
  } catch (error) {
    console.error(`Error auctioning antique:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to auction antique'
    });
  }
});

/**
 * @desc    Get all antiques list (for dropdown)
 * @route   GET /api/antiques/all-antiques
 * @access  Private/Admin
 */
const getAllAntiquesDropdown = asyncHandler(async (req, res) => {
  try {
    // Get all antiques from the AppraisalService with their holidays
    const antiques = AntiqueAppraisalService.ANTIQUES.map(antique => ({
      name: antique.name,
      holiday: antique.holiday,
      category: antique.category
    }));

    res.json({
      success: true,
      data: antiques
    });
  } catch (error) {
    console.error('Error getting antiques dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get antiques list'
    });
  }
});

/**
 * @desc    Get antique auction by ID (admin)
 * @route   GET /api/antiques/auctions/:id
 * @access  Private/Admin
 */
const getAntiqueAuctionById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await AntiqueAuction.getById(id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Antique auction not found'
      });
    }

    res.json({
      success: true,
      data: auction
    });
  } catch (error) {
    console.error(`Error getting antique auction with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get antique auction'
    });
  }
});

/**
 * @desc    Create a new antique auction
 * @route   POST /api/antiques/auctions
 * @access  Private/Admin
 */
const createAntiqueAuction = asyncHandler(async (req, res) => {
  try {
    const auctionData = req.body;

    // Validate required fields
    if (!auctionData.name || !auctionData.antique || !auctionData.species1 || !auctionData.type1 || !auctionData.attribute || !auctionData.creator) {
      return res.status(400).json({
        success: false,
        message: 'Name, antique, species1, type1, attribute, and creator are required'
      });
    }

    const auction = await AntiqueAuction.create(auctionData);

    res.status(201).json({
      success: true,
      data: auction,
      message: 'Antique auction created successfully'
    });
  } catch (error) {
    console.error('Error creating antique auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create antique auction'
    });
  }
});

/**
 * @desc    Update an antique auction
 * @route   PUT /api/antiques/auctions/:id
 * @access  Private/Admin
 */
const updateAntiqueAuction = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const auctionData = req.body;

    // Check if auction exists
    const existingAuction = await AntiqueAuction.getById(id);
    if (!existingAuction) {
      return res.status(404).json({
        success: false,
        message: 'Antique auction not found'
      });
    }

    // Validate required fields
    if (!auctionData.name || !auctionData.antique || !auctionData.species1 || !auctionData.type1 || !auctionData.attribute || !auctionData.creator) {
      return res.status(400).json({
        success: false,
        message: 'Name, antique, species1, type1, attribute, and creator are required'
      });
    }

    const auction = await AntiqueAuction.update(id, auctionData);

    res.json({
      success: true,
      data: auction,
      message: 'Antique auction updated successfully'
    });
  } catch (error) {
    console.error(`Error updating antique auction with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update antique auction'
    });
  }
});

/**
 * @desc    Delete an antique auction
 * @route   DELETE /api/antiques/auctions/:id
 * @access  Private/Admin
 */
const deleteAntiqueAuction = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if auction exists
    const existingAuction = await AntiqueAuction.getById(id);
    if (!existingAuction) {
      return res.status(404).json({
        success: false,
        message: 'Antique auction not found'
      });
    }

    const deleted = await AntiqueAuction.delete(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete antique auction'
      });
    }

    res.json({
      success: true,
      message: 'Antique auction deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting antique auction with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete antique auction'
    });
  }
});

/**
 * @desc    Upload an image for antique auction
 * @route   POST /api/antiques/upload
 * @access  Private/Admin
 */
const uploadAntiqueImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'seasonal-adopts',
      use_filename: true
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    res.status(500);
    throw new Error('Error uploading image');
  }
});

module.exports = {
  getAntiqueRollSettings,
  getAntiqueAuctions,
  getAuctionCatalogue,
  getCatalogueFilters,
  getTrainerAntiques,
  appraiseAntique,
  getAuctionOptions,
  auctionAntique,
  getAllAntiquesDropdown,
  getAntiqueAuctionById,
  createAntiqueAuction,
  updateAntiqueAuction,
  deleteAntiqueAuction,
  uploadAntiqueImage
};
