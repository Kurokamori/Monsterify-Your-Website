const Monster = require('../models/Monster');
const MonsterLineage = require('../models/MonsterLineage');
const Trainer = require('../models/Trainer');
const cloudinary = require('../utils/cloudinary');
const db = require('../config/db');

/**
 * Get all monsters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllMonsters = async (req, res) => {
  try {
    const monsters = await Monster.getAll();
    res.json({
      success: true,
      count: monsters.length,
      data: monsters
    });
  } catch (error) {
    console.error('Error in getAllMonsters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Search monsters with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchMonsters = async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    const searchTerm = `%${search.trim()}%`;
    
    // Search monsters by name, species, or trainer name
    const query = `
      SELECT 
        m.*,
        t.name as trainer_name
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      WHERE 
        LOWER(m.name) LIKE LOWER($1) OR
        LOWER(m.species1) LIKE LOWER($1) OR
        LOWER(m.species2) LIKE LOWER($1) OR
        LOWER(m.species3) LIKE LOWER($1) OR
        LOWER(t.name) LIKE LOWER($1)
      ORDER BY 
        CASE 
          WHEN LOWER(m.name) LIKE LOWER($1) THEN 1
          WHEN LOWER(t.name) LIKE LOWER($1) THEN 2
          ELSE 3
        END,
        m.name
      LIMIT $2
    `;

    const monsters = await db.asyncAll(query, [searchTerm, parseInt(limit)]);
    
    res.json({
      success: true,
      count: monsters.length,
      data: monsters
    });
  } catch (error) {
    console.error('Error in searchMonsters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterById = async (req, res) => {
  try {
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get monster images
    const images = await Monster.getImages(req.params.id);

    // Get monster evolution data
    const evolutionData = await Monster.getEvolutionData(req.params.id);

    // Add images and evolution data to monster
    const monsterWithDetails = {
      ...monster,
      images,
      evolution_data: evolutionData ? evolutionData.evolution_data : null
    };

    res.json({
      success: true,
      data: monsterWithDetails
    });
  } catch (error) {
    console.error(`Error in getMonsterById for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monsters by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonstersByUserId = async (req, res) => {
  try {
    // Get user ID from request params or from authenticated user
    const userId = req.params.userId || req.user?.discord_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const monsters = await Monster.getByUserId(userId);

    res.json({
      success: true,
      count: monsters.length,
      data: monsters
    });
  } catch (error) {
    console.error(`Error in getMonstersByUserId:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Create a new monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMonster = async (req, res) => {
  try {
    // Get trainer
    const trainer = await Trainer.getById(req.body.trainer_id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${req.body.trainer_id} not found`
      });
    }

    // Check if user is authorized to create a monster for this trainer
    // In a real app, you would check if the authenticated user owns this trainer
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create a monster for this trainer'
      });
    }

    // Create monster data with user ID
    const monsterData = {
      ...req.body,
      player_user_id: trainer.player_user_id
    };

    const monster = await Monster.create(monsterData);

    res.status(201).json({
      success: true,
      data: monster
    });
  } catch (error) {
    console.error('Error in createMonster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMonster = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to update this monster
    // In a real app, you would check if the authenticated user owns this monster
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this monster'
      });
    }

    // Update monster
    const updatedMonster = await Monster.update(req.params.id, req.body);

    res.json({
      success: true,
      data: updatedMonster
    });
  } catch (error) {
    console.error(`Error in updateMonster for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete a monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMonster = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to delete this monster
    // In a real app, you would check if the authenticated user owns this monster
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this monster'
      });
    }

    // Delete monster
    await Monster.delete(req.params.id);

    res.json({
      success: true,
      message: `Monster with ID ${req.params.id} deleted`
    });
  } catch (error) {
    console.error(`Error in deleteMonster for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add an image to a monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMonsterImage = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to add an image to this monster
    // In a real app, you would check if the authenticated user owns this monster
    // For now, we'll just check if the user ID matches
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add an image to this monster'
      });
    }

    // Add image
    const image = await Monster.addImage(req.params.id, req.body);

    res.status(201).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error(`Error in addMonsterImage for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterImages = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get images
    const images = await Monster.getImages(req.params.id);

    res.json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error(`Error in getMonsterImages for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Set monster evolution data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const setMonsterEvolutionData = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized to set evolution data for this monster
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to set evolution data for this monster'
      });
    }

    // Set evolution data
    const evolutionData = await Monster.setEvolutionData(req.params.id, req.body.evolution_data);

    res.json({
      success: true,
      data: evolutionData
    });
  } catch (error) {
    console.error(`Error in setMonsterEvolutionData for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster evolution data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterEvolutionData = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get evolution data
    const evolutionData = await Monster.getEvolutionData(req.params.id);

    if (!evolutionData) {
      return res.status(404).json({
        success: false,
        message: `Evolution data for monster with ID ${req.params.id} not found`
      });
    }

    res.json({
      success: true,
      data: evolutionData
    });
  } catch (error) {
    console.error(`Error in getMonsterEvolutionData for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Create a monster (for internal use by other controllers)
 * @param {Object} monsterData - Monster data
 * @returns {Promise<Object|null>} - Created monster or null if failed
 */
const createMonsterInternal = async (monsterData) => {
  try {
    // Validate required fields
    if (!monsterData.trainer_id) {
      console.error('Trainer ID is required');
      return null;
    }

    // Get trainer
    const trainer = await Trainer.getById(monsterData.trainer_id);

    if (!trainer) {
      console.error(`Trainer with ID ${monsterData.trainer_id} not found`);
      return null;
    }

    // Create monster data with user ID
    const monsterToCreate = {
      ...monsterData,
      player_user_id: trainer.player_user_id
    };

    const monster = await Monster.create(monsterToCreate);
    return monster;
  } catch (error) {
    console.error('Error in createMonsterInternal:', error);
    return null;
  }
};

/**
 * Get monster moves
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterMoves = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get moves
    const moves = await Monster.getMoves(req.params.id);

    res.json({
      success: true,
      count: moves.length,
      data: moves
    });
  } catch (error) {
    console.error(`Error in getMonsterMoves for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster evolution chain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterEvolutionChain = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get evolution chain
    const evolutionChain = await Monster.getEvolutionChain(req.params.id);

    res.json({
      success: true,
      data: evolutionChain
    });
  } catch (error) {
    console.error(`Error in getMonsterEvolutionChain for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster gallery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterGallery = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get gallery submissions
    const gallery = await Monster.getGallery(req.params.id);

    res.json({
      success: true,
      count: gallery.length,
      data: gallery
    });
  } catch (error) {
    console.error(`Error in getMonsterGallery for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster references
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterReferences = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get references
    const references = await Monster.getReferences(req.params.id);

    res.json({
      success: true,
      references
    });
  } catch (error) {
    console.error(`Error in getMonsterReferences for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Upload image for monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadMonsterImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'monsters',
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
    console.error('Error uploading monster image to Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

/**
 * Add mega stone image to monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMegaStoneImage = async (req, res) => {
  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'image_url is required'
      });
    }

    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add mega stone image to this monster'
      });
    }

    // Add or update mega stone image
    const image = await Monster.setMegaStoneImage(req.params.id, image_url);

    res.status(201).json({
      success: true,
      data: image,
      message: 'Mega stone image added successfully'
    });
  } catch (error) {
    console.error(`Error in addMegaStoneImage for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add mega image to monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMegaImage = async (req, res) => {
  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'image_url is required'
      });
    }

    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Check if user is authorized
    const userId = req.user?.discord_id;
    if (userId && monster.player_user_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add mega image to this monster'
      });
    }

    // Add or update mega image
    const image = await Monster.setMegaImage(req.params.id, image_url);

    res.status(201).json({
      success: true,
      data: image,
      message: 'Mega image added successfully'
    });
  } catch (error) {
    console.error(`Error in addMegaImage for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get mega images for monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMegaImages = async (req, res) => {
  try {
    // Get monster
    const monster = await Monster.getById(req.params.id);

    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${req.params.id} not found`
      });
    }

    // Get mega images
    const megaStoneImage = await Monster.getMegaStoneImage(req.params.id);
    const megaImage = await Monster.getMegaImage(req.params.id);

    res.json({
      success: true,
      data: {
        mega_stone_image: megaStoneImage,
        mega_image: megaImage
      }
    });
  } catch (error) {
    console.error(`Error in getMegaImages for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add levels to a monster (for level cap reallocation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMonsterLevels = async (req, res) => {
  try {
    const { monsterId, levels } = req.body;
    const userId = req.user.id; // Discord ID from auth middleware

    if (!monsterId || !levels || levels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monster ID and positive level count are required'
      });
    }

    // Get the monster to verify ownership
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).json({
        success: false,
        message: 'Monster not found'
      });
    }

    // Check if the user owns the monster's trainer
    const trainer = await Trainer.getById(monster.trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Add levels to the monster using existing level-up system
    const updatedMonster = await Monster.addLevels(monsterId, levels);

    console.log(`Added ${levels} levels to monster ${monsterId} (${monster.name}). New level: ${updatedMonster.level}`);

    res.json({
      success: true,
      message: `Successfully added ${levels} levels to ${monster.name}`,
      data: {
        monsterId,
        oldLevel: monster.level,
        newLevel: updatedMonster.level,
        levelsAdded: updatedMonster.level - monster.level,
        updatedMonster
      }
    });

  } catch (error) {
    console.error('Error adding levels to monster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster lineage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterLineage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate monster exists
    const monster = await Monster.getById(id);
    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${id} not found`
      });
    }

    // Get complete lineage tree
    const lineage = await MonsterLineage.getCompleteLineage(id);

    res.json({
      success: true,
      data: lineage
    });
  } catch (error) {
    console.error('Error in getMonsterLineage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add manual lineage relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMonsterLineage = async (req, res) => {
  try {
    const { id } = req.params;
    const { related_monster_id, relationship_type, notes } = req.body;
    const userId = req.user.discord_id;

    console.log('addMonsterLineage - Debug info:', {
      monsterId: id,
      relatedMonsterId: related_monster_id,
      relationshipType: relationship_type,
      userId: userId,
      userObject: req.user
    });

    // Validate required fields
    if (!related_monster_id || !relationship_type) {
      return res.status(400).json({
        success: false,
        message: 'related_monster_id and relationship_type are required'
      });
    }

    // Validate relationship type
    if (!['parent', 'child', 'sibling'].includes(relationship_type)) {
      return res.status(400).json({
        success: false,
        message: 'relationship_type must be parent, child, or sibling'
      });
    }

    // Validate both monsters exist
    const monster = await Monster.getById(id);
    const relatedMonster = await Monster.getById(related_monster_id);

    if (!monster || !relatedMonster) {
      return res.status(404).json({
        success: false,
        message: 'One or both monsters not found'
      });
    }

    // Check if user owns the monster (if user is authenticated)
    console.log('Ownership check:', {
      userId: userId,
      monsterPlayerId: monster.player_user_id,
      userIdType: typeof userId,
      monsterPlayerIdType: typeof monster.player_user_id,
      strictEqual: monster.player_user_id === userId,
      stringEqual: String(monster.player_user_id) === String(userId)
    });

    if (userId && String(monster.player_user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: `You can only edit lineage for your own monsters. Your ID: ${userId}, Monster owner ID: ${monster.player_user_id}`
      });
    }

    // Check if relationship already exists
    const exists = await MonsterLineage.relationshipExists(id, related_monster_id, relationship_type);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'This lineage relationship already exists'
      });
    }

    // Add the relationship (bidirectional)
    const createdRelationships = await MonsterLineage.addManualRelationship(
      parseInt(id), 
      parseInt(related_monster_id), 
      relationship_type, 
      userId, 
      notes
    );

    res.json({
      success: true,
      message: 'Lineage relationship added successfully',
      data: createdRelationships
    });
  } catch (error) {
    console.error('Error in addMonsterLineage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Remove lineage relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeMonsterLineage = async (req, res) => {
  try {
    const { id } = req.params;
    const { related_monster_id, relationship_type } = req.body;
    const userId = req.user.discord_id;

    // Validate required fields
    if (!related_monster_id || !relationship_type) {
      return res.status(400).json({
        success: false,
        message: 'related_monster_id and relationship_type are required'
      });
    }

    // Validate monster exists
    const monster = await Monster.getById(id);
    if (!monster) {
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${id} not found`
      });
    }

    // Check if user owns the monster (if user is authenticated)
    if (userId && String(monster.player_user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit lineage for your own monsters'
      });
    }

    // Remove the relationship
    const success = await MonsterLineage.removeRelationship(
      parseInt(id), 
      parseInt(related_monster_id), 
      relationship_type
    );

    if (success) {
      res.json({
        success: true,
        message: 'Lineage relationship removed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to remove lineage relationship'
      });
    }
  } catch (error) {
    console.error('Error in removeMonsterLineage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};




const MonsterInitializer = require('../utils/MonsterInitializer');
const initializeMonsterController = async (req, res) => {
  try {
    const monsterId = req.params.id;
    // Optionally, check user ownership here if needed
    const initializedMonster = await MonsterInitializer.initializeMonster(monsterId);
    res.json({
      success: true,
      message: `Monster ${monsterId} initialized successfully`,
      data: initializedMonster
    });
  } catch (error) {
    console.error('Error initializing monster:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize monster',
      error: error.stack
    });
  }
};

module.exports = {
  getAllMonsters,
  searchMonsters,
  getMonsterById,
  getMonstersByUserId,
  createMonster,
  createMonsterInternal,
  updateMonster,
  deleteMonster,
  addMonsterImage,
  getMonsterImages,
  setMonsterEvolutionData,
  getMonsterEvolutionData,
  getMonsterMoves,
  getMonsterEvolutionChain,
  getMonsterGallery,
  getMonsterReferences,
  uploadMonsterImage,
  addMonsterLevels,
  addMegaStoneImage,
  addMegaImage,
  getMegaImages,
  getMonsterLineage,
  addMonsterLineage,
  removeMonsterLineage,
  initializeMonsterController
};

