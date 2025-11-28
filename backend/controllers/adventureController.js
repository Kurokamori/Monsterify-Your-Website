const areaConfigurations = require('../config/areaConfigurations');
const Adventure = require('../models/Adventure');
const TrainerInventory = require('../models/TrainerInventory');
const DiscordIntegrationService = require('../services/DiscordIntegrationService');

/**
 * Get all adventures
 */
const getAllAdventures = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sort = 'newest'
    } = req.query;

    const options = {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await Adventure.getAll(options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting adventures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adventures',
      error: error.message
    });
  }
};

/**
 * Get adventure by ID
 */
const getAdventureById = async (req, res) => {
  try {
    const { id } = req.params;
    const adventure = await Adventure.getById(id);

    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    res.json({
      success: true,
      adventure
    });

  } catch (error) {
    console.error('Error getting adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adventure',
      error: error.message
    });
  }
};

/**
 * Validate item requirements for an adventure
 */
const validateItemRequirements = async (requestData, areaConfig, discordUserId) => {
  try {
    const { selectedTrainer } = requestData;

    if (!areaConfig.itemRequirements) {
      return { valid: true };
    }

    const requirements = areaConfig.itemRequirements;

    // Check mission mandate requirement
    if (requirements.needsMissionMandate !== false) {
      const Trainer = require('../models/Trainer');
      const trainer = await Trainer.getByNameAndUser(selectedTrainer, discordUserId);

      if (!trainer) {
        return {
          valid: false,
          message: 'Selected trainer not found'
        };
      }

      // Check for Mission Mandate in trainer's inventory
      const hasMissionMandate = await TrainerInventory.getItemByTrainerAndName(trainer.id, 'Mission Mandate');

      if (!hasMissionMandate || hasMissionMandate.quantity <= 0) {
        return {
          valid: false,
          message: 'This adventure requires a Mission Mandate. Please ensure your trainer has one in their inventory.'
        };
      }

      // Consume the Mission Mandate
      await consumeTrainerItem(trainer.id, 'Mission Mandate', 1);
    }

    // Check specific item requirement
    if (requirements.itemRequired) {
      const Trainer = require('../models/Trainer');
      const trainer = await Trainer.getByNameAndUser(selectedTrainer, discordUserId);

      if (!trainer) {
        return {
          valid: false,
          message: 'Selected trainer not found'
        };
      }

      // Check for required item in trainer's inventory using TrainerInventory model
      const hasRequiredItem = await TrainerInventory.getItemByTrainerAndName(trainer.id, requirements.itemRequired);

      if (!hasRequiredItem || hasRequiredItem.quantity <= 0) {
        return {
          valid: false,
          message: `This adventure requires a ${requirements.itemRequired}. Please ensure your trainer has one in their inventory.`
        };
      }

      // Consume the required item
      await consumeTrainerItem(trainer.id, requirements.itemRequired, 1);
    }

    return { valid: true };

  } catch (error) {
    console.error('Error validating item requirements:', error);
    return {
      valid: false,
      message: 'Error validating item requirements'
    };
  }
};

/**
 * Consume an item from trainer's inventory
 */
const consumeTrainerItem = async (trainerId, itemName, quantity) => {
  try {
    console.log(`Attempting to consume ${quantity} ${itemName} from trainer ${trainerId}`);

    // Get the item from trainer's inventory to find which category it's in
    const item = await TrainerInventory.getItemByTrainerAndName(trainerId, itemName);

    if (!item) {
      throw new Error(`Item ${itemName} not found in trainer ${trainerId} inventory`);
    }

    if (item.quantity < quantity) {
      throw new Error(`Insufficient ${itemName} in inventory. Has ${item.quantity}, needs ${quantity}`);
    }

    // Remove the item using TrainerInventory model
    const success = await TrainerInventory.removeItem(trainerId, item.category, itemName, quantity);

    if (!success) {
      throw new Error(`Failed to remove ${quantity} ${itemName} from trainer ${trainerId} inventory`);
    }

    console.log(`Successfully consumed ${quantity} ${itemName} from trainer ${trainerId} (category: ${item.category})`);

  } catch (error) {
    console.error('Error consuming trainer item:', error);
    throw error;
  }
};

/**
 * Create a new adventure
 */
const createAdventure = async (req, res) => {
  try {
    const { title, description, threadEmoji, adventureType, region, area, landmass } = req.body;
    const creator_id = req.user.id;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Adventure title is required'
      });
    }

    // Initialize adventure data
    const adventureData = {
      creator_id,
      title: title.trim(),
      status: 'active'
    };

    // Handle prebuilt adventures with area configuration
    if (adventureType === 'prebuilt' && area) {
      const areaConfig = areaConfigurations[area];

      if (areaConfig) {
        // Check item requirements
        const itemValidation = await validateItemRequirements(req.body, areaConfig, req.user.discord_id);
        if (!itemValidation.valid) {
          return res.status(400).json({
            success: false,
            message: itemValidation.message
          });
        }

        // Generate area name from area key if not provided
        const areaName = areaConfig.areaName || area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        adventureData.description = `${areaConfig.regionName}: ${areaName}`;
        adventureData.landmass_id = areaConfig.landmass;
        adventureData.landmass_name = areaConfig.landmassName;
        adventureData.region_id = areaConfig.region;
        adventureData.region_name = areaConfig.regionName;
        adventureData.area_id = area; // Use the area key as the area ID
        adventureData.area_name = areaName;
        adventureData.area_config = areaConfig;
      } else {
        // Fallback for areas without configuration
        adventureData.description = description || `${region}:${area}`;
        adventureData.area_id = area;
        adventureData.region_id = region;
        adventureData.landmass_id = landmass;
      }
    } else {
      // Custom adventure
      adventureData.description = description || 'custom';
    }

    const adventure = await Adventure.create(adventureData);

    console.log(`Adventure created: ${adventure.title} by user ${creator_id}`);

    // Create Discord thread for the adventure
    let discordThreadResult = null;
    if (DiscordIntegrationService.isDiscordAvailable()) {
      try {
        console.log(`Creating Discord thread for adventure ID ${adventure.id}...`);
        discordThreadResult = await DiscordIntegrationService.createAdventureThread(adventure, threadEmoji || '🗡️');

        if (discordThreadResult.success) {
          console.log(`✅ Discord thread created successfully: ${discordThreadResult.threadId}`);
        } else {
          console.warn(`⚠️ Failed to create Discord thread: ${discordThreadResult.message}`);
        }
      } catch (error) {
        console.error('Error creating Discord thread:', error);
        discordThreadResult = {
          success: false,
          message: error.message
        };
      }
    } else {
      console.warn('Discord integration not available - missing bot token or channel ID');
    }

    // Prepare response
    const responseAdventure = {
      ...adventure,
      discord_thread_url: discordThreadResult?.success ? discordThreadResult.threadUrl : null,
      discord_integration_status: discordThreadResult?.success ? 'connected' : 'failed'
    };

    res.status(201).json({
      success: true,
      message: 'Adventure created successfully',
      adventure: responseAdventure,
      discord_thread: discordThreadResult
    });

  } catch (error) {
    console.error('Error creating adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create adventure',
      error: error.message
    });
  }
};

/**
 * Update adventure
 */
const updateAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    // Get the adventure to check ownership
    const adventure = await Adventure.getById(id);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if user is the creator or admin
    if (adventure.creator_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own adventures'
      });
    }

    const updatedAdventure = await Adventure.update(id, updateData);

    res.json({
      success: true,
      message: 'Adventure updated successfully',
      adventure: updatedAdventure
    });

  } catch (error) {
    console.error('Error updating adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update adventure',
      error: error.message
    });
  }
};

/**
 * Delete adventure
 */
const deleteAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the adventure to check ownership
    const adventure = await Adventure.getById(id);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if user is the creator or admin
    if (adventure.creator_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own adventures'
      });
    }

    const deleted = await Adventure.delete(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete adventure'
      });
    }

    res.json({
      success: true,
      message: 'Adventure deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete adventure',
      error: error.message
    });
  }
};

/**
 * Get adventures by trainer/creator
 */
const getTrainerAdventures = async (req, res) => {
  try {
    // Handle both route patterns: /api/adventures/trainer/:trainerId and /api/trainers/:id/adventures
    const trainerId = req.params.trainerId || req.params.id;
    const {
      status,
      page = 1,
      limit = 10,
      sort = 'newest'
    } = req.query;

    const options = {
      status,
      creatorId: trainerId,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await Adventure.getByCreatorId(trainerId, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting trainer adventures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer adventures',
      error: error.message
    });
  }
};

/**
 * Complete adventure
 */
const completeAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the adventure to check ownership
    const adventure = await Adventure.getById(id);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if user is the creator or admin
    if (adventure.creator_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own adventures'
      });
    }

    const completedAdventure = await Adventure.complete(id);

    res.json({
      success: true,
      message: 'Adventure completed successfully',
      adventure: completedAdventure
    });

  } catch (error) {
    console.error('Error completing adventure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete adventure',
      error: error.message
    });
  }
};

/**
 * Get available regions for prebuilt adventures
 */
const getAvailableRegions = async (req, res) => {
  try {
    // This would typically come from a database or configuration file
    // For now, we'll return some sample regions
    const regions = [
      {
        id: 'kanto',
        name: 'Kanto',
        description: 'The original region with classic adventures',
        areas: [
          { id: 'viridian-forest', name: 'Viridian Forest', description: 'A mysterious forest filled with bug-type monsters' },
          { id: 'mt-moon', name: 'Mt. Moon', description: 'A cave system known for rare stone monsters' },
          { id: 'cerulean-cave', name: 'Cerulean Cave', description: 'The most dangerous cave in Kanto' }
        ]
      },
      {
        id: 'johto',
        name: 'Johto',
        description: 'A region of tradition and legendary monsters',
        areas: [
          { id: 'ilex-forest', name: 'Ilex Forest', description: 'An ancient forest with time-related mysteries' },
          { id: 'whirl-islands', name: 'Whirl Islands', description: 'Islands surrounded by powerful whirlpools' },
          { id: 'ice-path', name: 'Ice Path', description: 'A treacherous icy cave passage' }
        ]
      },
      {
        id: 'hoenn',
        name: 'Hoenn',
        description: 'A tropical region with diverse environments',
        areas: [
          { id: 'petalburg-woods', name: 'Petalburg Woods', description: 'Dense woods perfect for nature adventures' },
          { id: 'meteor-falls', name: 'Meteor Falls', description: 'A cave where meteors have fallen' },
          { id: 'sky-pillar', name: 'Sky Pillar', description: 'A tower reaching toward the heavens' }
        ]
      }
    ];

    res.json({
      success: true,
      regions
    });

  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get regions',
      error: error.message
    });
  }
};

/**
 * Claim adventure rewards
 */
const claimRewards = async (req, res) => {
  try {
    const { adventureLogId, userId, levelAllocations, coinAllocations, itemAllocations } = req.body;

    // Verify the adventure log belongs to this user
    const AdventureLog = require('../models/AdventureLog');
    const adventureLog = await AdventureLog.getById(adventureLogId);

    if (!adventureLog) {
      return res.status(404).json({
        success: false,
        message: 'Adventure log not found'
      });
    }

    if (adventureLog.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only claim your own rewards'
      });
    }

    if (adventureLog.is_claimed) {
      return res.status(400).json({
        success: false,
        message: 'Rewards have already been claimed'
      });
    }

    // Apply level allocations
    const Trainer = require('../models/Trainer');
    const Monster = require('../models/Monster');

    for (const allocation of levelAllocations) {
      if (allocation.entityType === 'trainer') {
        await Trainer.addLevels(allocation.entityId, allocation.levels);
      } else if (allocation.entityType === 'monster') {
        await Monster.addLevels(allocation.entityId, allocation.levels);
      }
    }

    // Apply coin allocations
    for (const allocation of coinAllocations) {
      await Trainer.addCoins(allocation.trainerId, allocation.coins);
    }

    // Apply item allocations
    for (const allocation of itemAllocations) {
      if (allocation.trainerId && allocation.item) {
        await Trainer.updateInventoryItem(allocation.trainerId, 'items', allocation.item, 1);
      }
    }

    // Mark adventure log as claimed
    await AdventureLog.markAsClaimed(adventureLogId);

    res.json({
      success: true,
      message: 'Rewards claimed successfully'
    });

  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim rewards'
    });
  }
};

module.exports = {
  getAllAdventures,
  getAdventureById,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  getTrainerAdventures,
  completeAdventure,
  getAvailableRegions,
  claimRewards
};
