const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const db = require('../config/db');
const { calculateZodiac, calculateChineseZodiac } = require('../utils/zodiacUtils');

/**
 * Get all trainers (for forms - no pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTrainersForForms = async (req, res) => {
  try {
    console.log('Getting all trainers for forms (no pagination)');
    
    // Get all trainers without pagination
    const trainers = await Trainer.getAll();
    
    // Return all trainers
    res.json({
      success: true,
      trainers: trainers, // Use 'trainers' key for compatibility
      data: trainers,
      totalTrainers: trainers.length
    });
  } catch (error) {
    console.error('Error in getAllTrainersForForms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all trainers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTrainers = async (req, res) => {
  try {
    // Get query parameters for pagination and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sort_by || 'name';
    const sortOrder = req.query.sort_order || 'asc';
    const search = req.query.search || '';

    // Get all trainers
    const trainers = await Trainer.getAll();

    // Filter trainers if search parameter is provided
    let filteredTrainers = trainers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTrainers = trainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchLower) ||
        (trainer.faction && trainer.faction.toLowerCase().includes(searchLower)) ||
        (trainer.player_display_name && trainer.player_display_name.toLowerCase().includes(searchLower)) ||
        (trainer.player_username && trainer.player_username.toLowerCase().includes(searchLower))
      );
    }

    // Calculate pagination
    const totalTrainers = filteredTrainers.length;
    const totalPages = Math.ceil(totalTrainers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Sort trainers
    filteredTrainers.sort((a, b) => {
      let valueA, valueB;

      // Handle special sorting cases
      if (sortBy === 'player_name') {
        valueA = a.player_display_name || a.player_username || '';
        valueB = b.player_display_name || b.player_username || '';
      } else {
        valueA = a[sortBy] || 0;
        valueB = b[sortBy] || 0;
      }

      // Handle string values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      // Sort based on order
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // Get paginated trainers
    const paginatedTrainers = filteredTrainers.slice(startIndex, endIndex);

    // Return formatted response in the same format as other endpoints
    res.json({
      success: true,
      data: paginatedTrainers,
      totalPages,
      currentPage: page,
      totalTrainers
    });
  } catch (error) {
    console.error('Error in getAllTrainers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer by ID (for API requests)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    res.json({
      success: true,
      trainer: trainer
    });
  } catch (error) {
    console.error(`Error in getTrainerById for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer by ID (for internal use by other controllers)
 * @param {number} id - Trainer ID
 * @returns {Promise<Object|null>} - Trainer object or null if not found
 */
const getTrainerByIdInternal = async (id) => {
  try {
    return await Trainer.getById(id);
  } catch (error) {
    console.error(`Error in getTrainerByIdInternal for ID ${id}:`, error);
    return null;
  }
};

/**
 * Get trainers by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainersByUserId = async (req, res) => {
  try {
    console.log('Getting trainers by user ID');
    console.log('Request params:', req.params);
    console.log('Request user:', req.user);
    console.log('Request session:', req.session);

    // Get user ID from request params, authenticated user, or session
    // This could be either a website user ID or a Discord ID
    const userId = req.params.userId || req.user?.id || req.session?.user?.id || req.user?.discord_id || req.session?.user?.discord_id;

    // For development mode, use a default user ID if none is provided
    let trainers = [];
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using default user ID');
        // Use a default user ID for development
        const defaultUserId = '123456789012345678'; // Replace with a valid user ID in your database
        console.log(`Fetching trainers for default user ID: ${defaultUserId}`);
        trainers = await Trainer.getByUserId(defaultUserId);
        console.log(`Found ${trainers.length} trainers for default user ID: ${defaultUserId}`);
      } else {
        console.log('No user ID provided');
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
    } else {
      console.log(`Fetching trainers for user ID: ${userId}`);
      trainers = await Trainer.getByUserId(userId);
      console.log(`Found ${trainers.length} trainers for user ID: ${userId}`);
      if (trainers.length === 0) {
        console.log('No trainers found - checking all users and trainers in database');
        const allTrainers = await Trainer.getAll();
        console.log(`Total trainers in database: ${allTrainers.length}`);
        console.log('Sample trainer player_user_ids:', allTrainers.slice(0, 5).map(t => ({ id: t.id, name: t.name, player_user_id: t.player_user_id })));
      }
    }

    // Get query parameters for pagination and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Calculate pagination
    const totalTrainers = trainers.length;
    const totalPages = Math.ceil(totalTrainers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated trainers
    const paginatedTrainers = trainers.slice(startIndex, endIndex);

    // Return in the format expected by the frontend
    res.json({
      success: true,
      data: paginatedTrainers,
      totalPages,
      currentPage: page,
      totalTrainers
    });
  } catch (error) {
    console.error(`Error in getTrainersByUserId:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Create a new trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTrainer = async (req, res) => {
  try {
    console.log('Creating trainer with request:', {
      user: req.user,
      body: req.body,
      headers: req.headers
    });

    // Get user ID from authenticated user or request body
    const userId = req.user?.discord_id || req.body.player_user_id;
    console.log('User ID from request:', userId);

    if (!userId) {
      console.error('No user ID found in request');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        message: 'Trainer name is required'
      });
    }

    // Handle file upload if provided
    let uploadedImageUrl = null;
    if (req.file) {
      try {
        const cloudinary = require('../utils/cloudinary');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'trainers'
        });
        uploadedImageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', uploadedImageUrl);
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    // Process the trainer data (exclude file upload fields)
    const { image, ...trainerData } = req.body;
    trainerData.player_user_id = userId;

    // Set main_ref to uploaded image if available
    if (uploadedImageUrl) {
      trainerData.main_ref = uploadedImageUrl;
    }

    // Handle main_ref image if provided
    if (req.body.main_ref) {
      trainerData.main_ref = req.body.main_ref;
    }

    // Set mega_info to null for new trainers since they can't have mega information
    trainerData.mega_info = null;

    // Handle additional_refs if provided
    if (req.body.additional_refs) {
      // If additional_refs is a string, parse it to validate JSON
      if (typeof req.body.additional_refs === 'string') {
        try {
          // Validate that it's proper JSON
          JSON.parse(req.body.additional_refs);
          trainerData.additional_refs = req.body.additional_refs;
        } catch (e) {
          console.error('Error parsing additional_refs JSON:', e);
          // Keep the original string if parsing fails
          trainerData.additional_refs = req.body.additional_refs;
        }
      } else {
        // If it's already an object/array, stringify it
        trainerData.additional_refs = JSON.stringify(req.body.additional_refs);
      }
    }

    // Auto-calculate zodiac if birthday is provided
    if (trainerData.birthday) {
      trainerData.zodiac = calculateZodiac(trainerData.birthday);
      trainerData.chinese_zodiac = calculateChineseZodiac(trainerData.birthday);
    }

    console.log('Creating trainer with data:', trainerData);
    const trainer = await Trainer.create(trainerData);

    if (!trainer || !trainer.id) {
      throw new Error('Failed to create trainer - no trainer returned');
    }

    // Check if trainer has a main reference image and award rewards
    let rewardMessage = '';
    if (trainerData.main_ref && trainerData.main_ref.trim() !== '') {
      try {
        // Award 6 levels and 200 coins for having a main reference
        const updatedTrainer = await Trainer.addLevelsAndCoins(trainer.id, 6, 200);
        rewardMessage = ' You received 6 levels and 200 coins for providing a main reference image!';
        console.log(`Awarded main ref rewards to trainer ${trainer.id}: 6 levels and 200 coins`);
        
        // Update the trainer data with the new values
        trainer.level = updatedTrainer.level;
        trainer.currency_amount = updatedTrainer.currency_amount;
        trainer.total_earned_currency = updatedTrainer.total_earned_currency;
      } catch (rewardError) {
        console.error('Error awarding main ref rewards:', rewardError);
        // Don't fail the creation if rewards fail, just log it
      }
    }

    res.status(201).json({
      success: true,
      data: trainer,
      message: `Trainer created successfully!${rewardMessage}`
    });
  } catch (error) {
    console.error('Error in createTrainer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTrainer = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to update this trainer
    // In a real app, you would check if the authenticated user owns this trainer
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trainer'
      });
    }

    // Process the trainer data (exclude file upload fields and additional ref specific fields)
    const { image, uploadType, refId, title, description, ...trainerData } = req.body;

    // Debug logging
    console.log('Update trainer request:', {
      hasFile: !!req.file,
      uploadType: req.body.uploadType,
      bodyKeys: Object.keys(req.body)
    });

    // Handle file uploads if provided
    if (req.file) {
      // Upload to Cloudinary
      const cloudinary = require('../utils/cloudinary');
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'trainers/references'
      });
      
      // Determine which field to update based on form data
      if (req.body.uploadType === 'main_ref') {
        trainerData.main_ref = result.secure_url;
      } else if (req.body.uploadType === 'mega_ref') {
        // Handle mega reference upload
        let megaInfo = {};
        
        // Parse existing mega_info or create new
        if (trainer.mega_info) {
          try {
            megaInfo = JSON.parse(trainer.mega_info);
          } catch (e) {
            console.error('Error parsing existing mega_info:', e);
            megaInfo = {};
          }
        }
        
        // Update mega_ref in mega_info
        megaInfo.mega_ref = result.secure_url;
        trainerData.mega_info = JSON.stringify(megaInfo);
      } else if (req.body.uploadType === 'additional_ref') {
        // Handle additional reference upload
        const refId = req.body.refId;
        const title = req.body.title || '';
        const description = req.body.description || '';

        // Get current trainer to access existing additional_refs
        const currentTrainer = await Trainer.getById(req.params.id);
        let additionalRefs = [];

        // Parse existing additional_refs
        if (currentTrainer.additional_refs) {
          try {
            additionalRefs = JSON.parse(currentTrainer.additional_refs);
          } catch (e) {
            console.error('Error parsing existing additional_refs:', e);
            additionalRefs = [];
          }
        }

        // Find the ref by ID and update its image_url, or add new ref
        const refIndex = additionalRefs.findIndex(ref => ref.id == refId);
        if (refIndex !== -1) {
          // Update existing ref
          additionalRefs[refIndex].image_url = result.secure_url;
          additionalRefs[refIndex].title = title;
          additionalRefs[refIndex].description = description;
        } else {
          // Add new ref
          additionalRefs.push({
            id: refId || Date.now(),
            title,
            description,
            image_url: result.secure_url
          });
        }

        // Update the trainer's additional_refs column
        trainerData.additional_refs = JSON.stringify(additionalRefs);
      }
    }

    // Handle mega_info if provided in request body
    if (req.body.mega_info) {
      // If mega_info is a string, parse it to an object
      if (typeof req.body.mega_info === 'string') {
        try {
          // Parse the string to an object, then stringify it back to ensure proper format
          const megaInfoObj = JSON.parse(req.body.mega_info);
          trainerData.mega_info = JSON.stringify(megaInfoObj);
        } catch (e) {
          console.error('Error parsing mega_info JSON:', e);
          // If parsing fails, merge with existing or create default
          let existingMegaInfo = {};
          if (trainer.mega_info) {
            try {
              existingMegaInfo = JSON.parse(trainer.mega_info);
            } catch (parseError) {
              console.error('Error parsing existing mega_info:', parseError);
            }
          }
          
          trainerData.mega_info = JSON.stringify({
            ...existingMegaInfo,
            mega_ref: existingMegaInfo.mega_ref || "",
            mega_artist: "",
            mega_species1: "",
            mega_species2: "",
            mega_species3: "",
            mega_type1: "",
            mega_type2: "",
            mega_type3: "",
            mega_type4: "",
            mega_type5: "",
            mega_type6: "",
            mega_ability: ""
          });
        }
      } else if (typeof req.body.mega_info === 'object') {
        // If it's already an object, merge with existing and stringify
        let existingMegaInfo = {};
        if (trainer.mega_info) {
          try {
            existingMegaInfo = JSON.parse(trainer.mega_info);
          } catch (parseError) {
            console.error('Error parsing existing mega_info:', parseError);
          }
        }
        
        trainerData.mega_info = JSON.stringify({
          ...existingMegaInfo,
          ...req.body.mega_info
        });
      }
    }

    // Handle additional_references if provided
    if (req.body.additional_references) {
      // If additional_references is a string, parse it to an object
      if (typeof req.body.additional_references === 'string') {
        try {
          const additionalReferencesObj = JSON.parse(req.body.additional_references);
          trainerData.additional_references = JSON.stringify(additionalReferencesObj);
        } catch (e) {
          console.error('Error parsing additional_references JSON:', e);
          trainerData.additional_references = JSON.stringify([]);
        }
      } else if (typeof req.body.additional_references === 'object') {
        // If it's already an object, stringify it
        trainerData.additional_references = JSON.stringify(req.body.additional_references);
      }
    }

    // Auto-calculate zodiac if birthday is provided
    if (trainerData.birthday) {
      trainerData.zodiac = calculateZodiac(trainerData.birthday);
      trainerData.chinese_zodiac = calculateChineseZodiac(trainerData.birthday);
    }

    // Update trainer only if there's data to update
    let updatedTrainer;
    if (Object.keys(trainerData).length > 0) {
      updatedTrainer = await Trainer.update(req.params.id, trainerData);
    } else {
      // If no trainer data to update, just get the current trainer
      updatedTrainer = await Trainer.getById(req.params.id);
    }

    res.json({
      success: true,
      data: updatedTrainer
    });
  } catch (error) {
    console.error(`Error in updateTrainer for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTrainer = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to delete this trainer
    // In a real app, you would check if the authenticated user owns this trainer
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this trainer'
      });
    }

    // Delete trainer
    await Trainer.delete(req.params.id);

    res.json({
      success: true,
      message: `Trainer with ID ${req.params.id} deleted`
    });
  } catch (error) {
    console.error(`Error in deleteTrainer for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer inventory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerInventory = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Get inventory
    const inventory = await Trainer.getInventory(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: `Inventory for trainer with ID ${req.params.id} not found`
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error(`Error in getTrainerInventory for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update trainer inventory item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTrainerInventoryItem = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to update this trainer's inventory
    // In a real app, you would check if the authenticated user owns this trainer
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trainer\'s inventory'
      });
    }

    // Validate request body
    const { category, itemName, quantity } = req.body;
    if (!category || !itemName || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category, itemName, and quantity are required'
      });
    }

    // Update inventory item
    const updatedInventory = await Trainer.updateInventoryItem(
      req.params.id,
      category,
      itemName,
      parseInt(quantity)
    );

    res.json({
      success: true,
      data: updatedInventory
    });
  } catch (error) {
    console.error(`Error in updateTrainerInventoryItem for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer monsters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerMonsters = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Get monsters
    const monsters = await Monster.getByTrainerId(req.params.id);

    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Calculate pagination
    const totalMonsters = monsters.length;
    const totalPages = Math.ceil(totalMonsters / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated monsters
    const paginatedMonsters = monsters.slice(startIndex, endIndex);

    res.json({
      success: true,
      monsters: paginatedMonsters,
      totalMonsters,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error(`Error in getTrainerMonsters for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all trainer monsters (no pagination, for dropdowns and forms)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTrainerMonsters = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Get all monsters without pagination
    const monsters = await Monster.getByTrainerId(req.params.id);

    res.json({
      success: true,
      monsters: monsters,
      totalMonsters: monsters.length
    });
  } catch (error) {
    console.error(`Error in getAllTrainerMonsters for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update monster box positions for a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMonsterBoxPositions = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const { positions } = req.body;

    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid positions data. Expected an array of positions.'
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

    // Check if user is authorized to update this trainer's monsters
    // In a real app, you would check if the authenticated user owns this trainer
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trainer\'s monsters'
      });
    }

    // Update each monster's box position
    const updatePromises = positions.map(async (position) => {
      const { id, boxNumber, position: boxPosition } = position;

      // Validate position data
      if (!id || boxNumber === undefined || boxPosition === undefined) {
        throw new Error(`Invalid position data: ${JSON.stringify(position)}`);
      }

      // Get the monster to ensure it belongs to this trainer
      const monster = await Monster.getById(id);

      if (!monster) {
        throw new Error(`Monster with ID ${id} not found`);
      }

      if (monster.trainer_id !== parseInt(trainerId)) {
        throw new Error(`Monster with ID ${id} does not belong to trainer ${trainerId}`);
      }

      // Update the monster's box number and position
      return Monster.update(id, {
        box_number: boxNumber,
        trainer_index: boxPosition
      });
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Monster box positions updated successfully'
    });
  } catch (error) {
    console.error(`Error in updateMonsterBoxPositions for trainer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get featured monsters for a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeaturedMonsters = async (req, res) => {
  try {
    const trainerId = req.params.id;

    // Get trainer
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${trainerId} not found`
      });
    }

    // Get featured monsters - using same pattern as other monster queries
    const query = `
      SELECT m.*, fm.display_order
      FROM featured_monsters fm
      JOIN monsters m ON fm.monster_id = m.id
      WHERE fm.trainer_id = $1
      ORDER BY fm.display_order ASC
    `;

    const featuredMonsters = await db.asyncAll(query, [trainerId]);

    // Debug logging to check what fields are actually returned
    if (featuredMonsters.length > 0) {
      console.log('Featured monsters debug info:');
      console.log('First monster keys:', Object.keys(featuredMonsters[0]));
      console.log('First monster img_link value:', featuredMonsters[0].img_link);
      console.log('First monster sample data:', {
        id: featuredMonsters[0].id,
        name: featuredMonsters[0].name,
        img_link: featuredMonsters[0].img_link,
        image_url: featuredMonsters[0].image_url
      });
    }

    res.json({
      success: true,
      featuredMonsters
    });
  } catch (error) {
    console.error('Error getting featured monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured monsters',
      error: error.message
    });
  }
};

/**
 * Update featured monsters for a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateFeaturedMonsters = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const { featuredMonsters } = req.body;

    console.log(`Updating featured monsters for trainer ${trainerId}:`, featuredMonsters);

    if (!featuredMonsters || !Array.isArray(featuredMonsters)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid featured monsters data. Expected an array.'
      });
    }

    if (featuredMonsters.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 featured monsters allowed.'
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

    // Check if user is authorized to update this trainer's featured monsters
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trainer\'s featured monsters'
      });
    }

    // Verify all monsters belong to this trainer
    for (const monsterId of featuredMonsters) {
      const monster = await Monster.getById(monsterId);
      if (!monster) {
        return res.status(404).json({
          success: false,
          message: `Monster with ID ${monsterId} not found`
        });
      }
      if (monster.trainer_id !== parseInt(trainerId)) {
        return res.status(400).json({
          success: false,
          message: `Monster with ID ${monsterId} does not belong to trainer ${trainerId}`
        });
      }
    }

    // Clear existing featured monsters
    await db.asyncRun('DELETE FROM featured_monsters WHERE trainer_id = $1', [trainerId]);

    // Add new featured monsters
    for (let i = 0; i < featuredMonsters.length; i++) {
      await db.asyncRun(
        'INSERT INTO featured_monsters (trainer_id, monster_id, display_order) VALUES ($1, $2, $3)',
        [trainerId, featuredMonsters[i], i + 1]
      );
    }

    console.log(`Successfully updated featured monsters for trainer ${trainerId}`);
    res.json({
      success: true,
      message: 'Featured monsters updated successfully'
    });
  } catch (error) {
    console.error('Error updating featured monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured monsters',
      error: error.message
    });
  }
};

/**
 * Update a trainer's monster count
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<boolean>} - Success status
 */
const updateTrainerMonsterCount = async (trainerId) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(trainerId);

    if (!trainer) {
      console.error(`Trainer with ID ${trainerId} not found`);
      return false;
    }

    // Get monster count
    const monsters = await Monster.getByTrainerId(trainerId);
    const monsterCount = monsters.length;

    // Update trainer
    const updatedTrainer = await Trainer.update(trainerId, {
      mon_amount: monsterCount
    });

    return !!updatedTrainer;
  } catch (error) {
    console.error(`Error in updateTrainerMonsterCount for ID ${trainerId}:`, error);
    return false;
  }
};

/**
 * Check item quantity in trainer inventory
 * @param {number} trainerId - Trainer ID
 * @param {string} itemName - Item name
 * @returns {Promise<number>} - Item quantity
 */
const checkItemQuantity = async (trainerId, itemName) => {
  try {
    const TrainerInventory = require('../models/TrainerInventory');

    // Use TrainerInventory model to get item
    const item = await TrainerInventory.getItemByTrainerAndName(trainerId, itemName);

    return item ? item.quantity : 0;
  } catch (error) {
    console.error(`Error in checkItemQuantity for trainer ${trainerId}, item ${itemName}:`, error);
    return 0;
  }
};

/**
 * Use an item from trainer inventory
 * @param {number} trainerId - Trainer ID
 * @param {string} itemName - Item name
 * @param {number} quantity - Quantity to use
 * @returns {Promise<boolean>} - Success status
 */
const useItem = async (trainerId, itemName, quantity = 1) => {
  try {
    const TrainerInventory = require('../models/TrainerInventory');

    // Get the item from trainer's inventory to find which category it's in
    const item = await TrainerInventory.getItemByTrainerAndName(trainerId, itemName);

    if (!item || item.quantity < quantity) {
      return false;
    }

    // Remove the item using TrainerInventory model
    const success = await TrainerInventory.removeItem(trainerId, item.category, itemName, quantity);
    return success;
  } catch (error) {
    console.error(`Error in useItem for trainer ${trainerId}, item ${itemName}:`, error);
    return false;
  }
};

/**
 * Add an item to trainer inventory
 * @param {number} trainerId - Trainer ID
 * @param {string} itemName - Item name
 * @param {number} quantity - Quantity to add
 * @param {string} category - Item category (defaults to 'items')
 * @returns {Promise<boolean>} - Success status
 */
const addItem = async (trainerId, itemName, quantity = 1, category = 'items') => {
  try {
    const TrainerInventory = require('../models/TrainerInventory');

    // Add item using TrainerInventory model
    const success = await TrainerInventory.addItem(trainerId, category, itemName, quantity);
    return success;
  } catch (error) {
    console.error(`Error in addItem for trainer ${trainerId}, item ${itemName}:`, error);
    return false;
  }
};

/**
 * Get references for a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerReferences = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Get references
    const references = await Trainer.getReferences(req.params.id);

    res.json({
      success: true,
      data: references
    });
  } catch (error) {
    console.error(`Error in getTrainerReferences for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add levels to a trainer (for level cap reallocation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addTrainerLevels = async (req, res) => {
  try {
    const { trainerId, levels } = req.body;
    const userId = req.user.id; // Discord ID from auth middleware

    if (!trainerId || !levels || levels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and positive level count are required'
      });
    }

    // Get the trainer to verify ownership
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if the user owns the trainer
    // Compare using Discord ID (trainer.player_user_id is Discord ID string)
    const userDiscordId = req.user.discord_id || req.user.id;
    console.log(`Trainer ownership check: trainer.player_user_id=${trainer.player_user_id}, userDiscordId=${userDiscordId}, userId=${userId}`);

    if (trainer.player_user_id !== userDiscordId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Add levels to the trainer using existing system
    const updatedTrainer = await Trainer.addLevels(trainerId, levels);

    console.log(`Added ${levels} levels to trainer ${trainerId} (${trainer.name}). New level: ${updatedTrainer.level}`);

    res.json({
      success: true,
      message: `Successfully added ${levels} levels to ${trainer.name}`,
      data: {
        trainerId,
        oldLevel: trainer.level,
        newLevel: updatedTrainer.level,
        levelsAdded: updatedTrainer.level - trainer.level,
        updatedTrainer
      }
    });

  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer achievements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerAchievements = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get trainer to check if it exists
    const trainer = await Trainer.getById(id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if the current user is the owner
    let isOwner = false;
    if (req.user) {
      // Use discord_id first since trainers are linked to Discord IDs, fallback to website id
      const userId = req.user.discord_id || req.user.id;
      console.log(`Achievement ownership check details:`, {
        'req.user.id': req.user.id,
        'req.user.discord_id': req.user.discord_id,
        'userId': userId,
        'trainer.player_user_id': trainer.player_user_id,
        'userId.toString()': userId?.toString(),
        'types': {
          userId: typeof userId,
          trainerPlayerId: typeof trainer.player_user_id
        }
      });
      
      // Try multiple comparison methods
      const exactMatch = userId === trainer.player_user_id;
      const stringMatch = userId && trainer.player_user_id === userId.toString();
      const reverseStringMatch = trainer.player_user_id && userId === trainer.player_user_id.toString();
      
      isOwner = exactMatch || stringMatch || reverseStringMatch;
      console.log(`Ownership comparison results: exact=${exactMatch}, string=${stringMatch}, reverse=${reverseStringMatch}, final=${isOwner}`);
    }
    
    // Get achievements
    const achievements = await Trainer.getAchievements(id, isOwner);
    
    res.json({
      success: true,
      data: {
        achievements,
        isOwner,
        trainer: {
          id: trainer.id,
          name: trainer.name,
          level: trainer.level
        }
      }
    });
  } catch (error) {
    console.error(`Error getting achievements for trainer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Claim trainer achievement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const claimTrainerAchievement = async (req, res) => {
  try {
    const { id, achievementId } = req.params;
    // Use discord_id first since trainers are linked to Discord IDs, fallback to website id
    const userId = req.user.discord_id || req.user.id;
    
    // Get trainer to verify ownership
    const trainer = await Trainer.getById(id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if the user owns the trainer
    if (trainer.player_user_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Claim the achievement
    const result = await Trainer.claimAchievement(id, achievementId);
    
    res.json({
      success: true,
      message: `Achievement "${result.achievement.name}" claimed successfully!`,
      data: result
    });
  } catch (error) {
    console.error(`Error claiming achievement ${req.params.achievementId} for trainer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message
    });
  }
};

/**
 * Claim all trainer achievements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const claimAllTrainerAchievements = async (req, res) => {
  try {
    const { id } = req.params;
    // Use discord_id first since trainers are linked to Discord IDs, fallback to website id
    const userId = req.user.discord_id || req.user.id;
    
    // Get trainer to verify ownership
    const trainer = await Trainer.getById(id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if the user owns the trainer
    if (trainer.player_user_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Claim all achievements
    const result = await Trainer.claimAllAchievements(id);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error(`Error claiming all achievements for trainer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer achievement statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerAchievementStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get trainer to check if it exists
    const trainer = await Trainer.getById(id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Get achievement statistics
    const stats = await Trainer.getAchievementStats(id);
    
    res.json({
      success: true,
      data: {
        stats,
        trainer: {
          id: trainer.id,
          name: trainer.name,
          level: trainer.level
        }
      }
    });
  } catch (error) {
    console.error(`Error getting achievement stats for trainer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Upload image for trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadTrainerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'trainers',
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
    console.error('Error uploading trainer image to Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

/**
 * Add mega image to trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addTrainerMegaImage = async (req, res) => {
  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'image_url is required'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add mega image to this trainer'
      });
    }

    // Add or update mega image
    const image = await Trainer.setMegaImage(req.params.id, image_url);

    res.status(201).json({
      success: true,
      data: image,
      message: 'Mega image added successfully'
    });
  } catch (error) {
    console.error(`Error in addTrainerMegaImage for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add additional reference image to trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addTrainerAdditionalRef = async (req, res) => {
  try {
    const { image_url, title, description } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'image_url is required'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add additional reference to this trainer'
      });
    }

    // Add additional reference image
    const image = await Trainer.addAdditionalRef(req.params.id, {
      image_url,
      title: title || '',
      description: description || ''
    });

    res.status(201).json({
      success: true,
      data: image,
      message: 'Additional reference added successfully'
    });
  } catch (error) {
    console.error(`Error in addTrainerAdditionalRef for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerImages = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.params.id} not found`
      });
    }

    // Get trainer images
    const megaImage = await Trainer.getMegaImage(req.params.id);
    const additionalRefs = await Trainer.getAdditionalRefs(req.params.id);

    res.json({
      success: true,
      data: {
        mega_image: megaImage,
        additional_refs: additionalRefs
      }
    });
  } catch (error) {
    console.error(`Error in getTrainerImages for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer berries
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerBerries = async (req, res) => {
  try {
    const SpecialBerryService = require('../services/specialBerryService');
    const trainerId = req.params.id;

    // Get trainer to verify it exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${trainerId} not found`
      });
    }

    // Get available special berries
    const berries = await SpecialBerryService.getAvailableSpecialBerries(trainerId);

    res.json({
      success: true,
      berries
    });
  } catch (error) {
    console.error(`Error in getTrainerBerries for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllTrainers,
  getAllTrainersForForms,
  getTrainerById,
  getTrainerByIdInternal,
  getTrainersByUserId,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getTrainerInventory,
  updateTrainerInventoryItem,
  getTrainerMonsters,
  getAllTrainerMonsters,
  updateMonsterBoxPositions,
  getFeaturedMonsters,
  updateFeaturedMonsters,
  updateTrainerMonsterCount,
  checkItemQuantity,
  useItem,
  addItem,
  getTrainerReferences,
  addTrainerLevels,
  getTrainerAchievements,
  claimTrainerAchievement,
  claimAllTrainerAchievements,
  getTrainerAchievementStats,
  getTrainerBerries
};
