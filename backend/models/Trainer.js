const db = require('../config/db');

class Trainer {
  /**
   * Get all trainers
   * @returns {Promise<Array>} Array of trainers
   */
  static async getAll() {
  try {
    const query = `
      SELECT 
        t.*,
        u.display_name AS player_display_name,
        u.username AS player_username,
        COALESCE(mc.monster_count, 0) AS monster_count,
        COALESCE(mc.monster_ref_count, 0) AS monster_ref_count
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      LEFT JOIN (
        SELECT 
          trainer_id,
          COUNT(*) AS monster_count,
          COUNT(CASE WHEN img_link IS NOT NULL AND img_link != '' AND img_link != 'null' THEN 1 END) AS monster_ref_count
        FROM monsters
        GROUP BY trainer_id
      ) mc ON t.id = mc.trainer_id
      ORDER BY t.name
    `;
    const trainers = await db.asyncAll(query);

    // Calculate monster reference percentage for each trainer
    return trainers.map(trainer => {
      if (trainer.monster_count > 0) {
        trainer.monster_ref_percent = Math.round((trainer.monster_ref_count / trainer.monster_count) * 100);
      } else {
        trainer.monster_ref_percent = 0;
      }
      return trainer;
    });
  } catch (error) {
    console.error('Error getting all trainers:', error);
    throw error;
  }
}

static async getById(id) {
  try {
    const query = `
      SELECT 
        t.*,
        u.display_name AS player_display_name,
        u.username AS player_username,
        COALESCE(mc.monster_count, 0) AS monster_count,
        COALESCE(mc.monster_ref_count, 0) AS monster_ref_count
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      LEFT JOIN (
        SELECT 
          trainer_id,
          COUNT(*) AS monster_count,
          COUNT(CASE WHEN img_link IS NOT NULL AND img_link != '' AND img_link != 'null' THEN 1 END) AS monster_ref_count
        FROM monsters
        GROUP BY trainer_id
      ) mc ON t.id = mc.trainer_id
      WHERE t.id = $1
    `;
    const trainer = await db.asyncGet(query, [id]);

    // Calculate monster reference percentage
    if (trainer) {
      if (trainer.monster_count > 0) {
        trainer.monster_ref_percent = Math.round((trainer.monster_ref_count / trainer.monster_count) * 100);
      } else {
        trainer.monster_ref_percent = 0;
      }
    }

    return trainer;
  } catch (error) {
    console.error(`Error getting trainer with ID ${id}:`, error);
    throw error;
  }
}

  static async getByUserId(userId) {
    try {
      // Try to fetch trainers directly with userId (could be website ID or Discord ID)
      const query = `
        SELECT 
          t.*,
          u.display_name AS player_display_name,
          u.username AS player_username,
          COALESCE(mc.monster_count, 0) AS monster_count,
          COALESCE(mc.monster_ref_count, 0) AS monster_ref_count
        FROM trainers t
        LEFT JOIN users u ON t.player_user_id = u.discord_id
        LEFT JOIN (
          SELECT 
            trainer_id,
            COUNT(*) AS monster_count,
            COUNT(CASE WHEN img_link IS NOT NULL AND img_link != '' AND img_link != 'null' THEN 1 END) AS monster_ref_count
          FROM monsters
          GROUP BY trainer_id
        ) mc ON t.id = mc.trainer_id
        WHERE t.player_user_id = $1
        ORDER BY t.name
      `;

      let trainers = await db.asyncAll(query, [userId]);

      if (trainers && trainers.length > 0) {
        return trainers.map(trainer => {
          trainer.monster_ref_percent = trainer.monster_count > 0
            ? Math.round((trainer.monster_ref_count / trainer.monster_count) * 100)
            : 0;
          return trainer;
        });
      }

      // No trainers found? Try to resolve user ID to discord_id or site ID
      const userQuery = `SELECT id FROM users WHERE id = $1 OR discord_id = CAST($1 AS VARCHAR)`;
      const user = await db.asyncGet(userQuery, [userId]);

      if (!user) return [];

      // Try again using resolved user ID
      const trainerQuery = `
        SELECT 
          t.*,
          u.display_name AS player_display_name,
          u.username AS player_username,
          COALESCE(mc.monster_count, 0) AS monster_count,
          COALESCE(mc.monster_ref_count, 0) AS monster_ref_count
        FROM trainers t
        LEFT JOIN users u ON t.player_user_id = u.discord_id
        LEFT JOIN (
          SELECT 
            trainer_id,
            COUNT(*) AS monster_count,
            COUNT(CASE WHEN img_link IS NOT NULL AND img_link != '' AND img_link != 'null' THEN 1 END) AS monster_ref_count
          FROM monsters
          GROUP BY trainer_id
        ) mc ON t.id = mc.trainer_id
        WHERE t.player_user_id = $1
        ORDER BY t.name
      `;
      trainers = await db.asyncAll(trainerQuery, [user.id]);

      return trainers.map(trainer => {
        trainer.monster_ref_percent = trainer.monster_count > 0
          ? Math.round((trainer.monster_ref_count / trainer.monster_count) * 100)
          : 0;
        return trainer;
      });
    } catch (error) {
      console.error(`Error getting trainers for user ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new trainer
   * @param {Object} trainerData Trainer data
   * @returns {Promise<Object>} Created trainer
   */
  static async create(trainerData) {
    try {
      // Ensure required fields are present
      if (!trainerData.name || !trainerData.player_user_id) {
        throw new Error('Name and player_user_id are required fields');
      }

      // Set default values
      const defaultData = {
        level: 1,
        currency_amount: 500,
        total_earned_currency: 500
      };

      // Merge default data with provided data
      const data = { ...defaultData, ...trainerData };

      // Build query dynamically based on provided fields
      const fields = Object.keys(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const values = fields.map(field => {
        const value = data[field];
        return value;
      });

      const query = `
        INSERT INTO trainers (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `;

      const result = await db.asyncRun(query, values);
      const trainerId = db.isPostgreSQL ? result.rows[0].id : result.lastID;

      // Initialize trainer inventory
      await this.initializeInventory(trainerId);

      // Return the created trainer
      const createdTrainer = await this.getById(trainerId);
      if (!createdTrainer) {
        console.error(`Failed to retrieve newly created trainer with ID: ${trainerId}`);
        throw new Error('Failed to retrieve newly created trainer');
      }
      return createdTrainer;
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw error;
    }
  }

  /**
   * Update a trainer
   * @param {number} id Trainer ID
   * @param {Object} trainerData Trainer data
   * @returns {Promise<Object>} Updated trainer
   */
  static async update(id, trainerData) {
    try {
      // Get current trainer data
      const currentTrainer = await this.getById(id);
      if (!currentTrainer) {
        throw new Error(`Trainer with ID ${id} not found`);
      }

      // Prevent updating certain fields
      const protectedFields = ['id', 'player_user_id', 'level', 'currency_amount', 'total_earned_currency'];
      const filteredData = { ...trainerData };
      protectedFields.forEach(field => delete filteredData[field]);

      // Build query dynamically based on provided fields
      const fields = Object.keys(filteredData);
      if (fields.length === 0) {
        return currentTrainer; // Nothing to update
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = fields.map(field => {
        const value = filteredData[field];
        return value;
      });
      values.push(id);

      const query = `
        UPDATE trainers
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
      `;

      await db.asyncRun(query, values);

      // Return the updated trainer
      return await this.getById(id);
    } catch (error) {
      console.error(`Error updating trainer with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a trainer
   * @param {number} id Trainer ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      // Check if trainer exists
      const trainer = await this.getById(id);
      if (!trainer) {
        throw new Error(`Trainer with ID ${id} not found`);
      }

      // Delete trainer (cascade will delete inventory and monsters)
      const query = 'DELETE FROM trainers WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error(`Error deleting trainer with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Initialize inventory for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object>} Created inventory
   */
  static async initializeInventory(trainerId) {
    try {
      // Default inventory items
      const defaultInventory = {
        items: JSON.stringify({ 'Daycare Daypass': 1, 'Legacy Leeway': 1 }),
        balls: JSON.stringify({ 'Poke Ball': 10 }),
        berries: JSON.stringify({
          'Forget-Me-Not': 2,
          'Edenwiess': 2
        }),
        eggs: JSON.stringify({ 'Standard Egg': 1 }),
        keyitems: JSON.stringify({ 'Mission Mandate': 1 })
      };

      // Insert inventory
      const query = `
        INSERT INTO trainer_inventory (trainer_id, items, balls, berries, eggs, keyitems)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await db.asyncRun(query, [
        trainerId,
        defaultInventory.items,
        defaultInventory.balls,
        defaultInventory.berries,
        defaultInventory.eggs,
        defaultInventory.keyitems
      ]);

      // Return the created inventory
      return await this.getInventory(trainerId);
    } catch (error) {
      console.error(`Error initializing inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object>} Trainer inventory
   */
  static async getInventory(trainerId) {
    try {
      const query = 'SELECT * FROM trainer_inventory WHERE trainer_id = $1';
      const inventory = await db.asyncGet(query, [trainerId]);

      if (!inventory) {
        return null;
      }

      // Parse JSON fields
      const parsedInventory = { ...inventory };
      const jsonFields = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

      jsonFields.forEach(field => {
        if (parsedInventory[field]) {
          try {
            parsedInventory[field] = JSON.parse(parsedInventory[field]);
          } catch (e) {
            parsedInventory[field] = {};
          }
        } else {
          parsedInventory[field] = {};
        }
      });

      return parsedInventory;
    } catch (error) {
      console.error(`Error getting inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Update currency for a trainer
   * @param {number} trainerId Trainer ID
   * @param {number} amount Amount to add (positive) or remove (negative)
   * @returns {Promise<Object>} Updated trainer
   */
  static async updateCurrency(trainerId, amount) {
    try {
      // Get current trainer data
      const trainer = await this.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Calculate new currency amount
      const currentAmount = trainer.currency_amount || 0;
      const newAmount = Math.max(0, currentAmount + amount); // Ensure it doesn't go below 0

      // Update total earned currency if amount is positive
      let totalEarnedUpdate = '';
      const values = [newAmount];

      if (amount > 0) {
        totalEarnedUpdate = ', total_earned_currency = total_earned_currency + $2';
        values.push(amount);
      }

      // Update trainer in database
      const query = `
        UPDATE trainers
        SET currency_amount = $1${totalEarnedUpdate}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length + 1}
      `;

      values.push(trainerId);
      await db.asyncRun(query, values);

      // Return updated trainer
      return await this.getById(trainerId);
    } catch (error) {
      console.error(`Error updating currency for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Update inventory item for a trainer
   * @param {number} trainerId Trainer ID
   * @param {string} category Inventory category (items, balls, etc.)
   * @param {string} itemName Item name
   * @param {number} quantity Quantity to add (positive) or remove (negative)
   * @returns {Promise<Object>} Updated inventory
   */
  static async updateInventoryItem(trainerId, category, itemName, quantity) {
    try {
      // Validate category
      const validCategories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid inventory category: ${category}`);
      }

      // Get current inventory
      const inventory = await this.getInventory(trainerId);
      if (!inventory) {
        throw new Error(`Inventory for trainer ${trainerId} not found`);
      }

      // Update item quantity
      const items = inventory[category] || {};
      const currentQuantity = items[itemName] || 0;
      const newQuantity = currentQuantity + quantity;

      // Remove item if quantity is 0 or less
      if (newQuantity <= 0) {
        delete items[itemName];
      } else {
        items[itemName] = newQuantity;
      }

      // Update inventory in database
      const query = `
        UPDATE trainer_inventory
        SET ${category} = $1, updated_at = CURRENT_TIMESTAMP
        WHERE trainer_id = $2
      `;

      await db.asyncRun(query, [JSON.stringify(items), trainerId]);

      // Return updated inventory
      return await this.getInventory(trainerId);
    } catch (error) {
      console.error(`Error updating inventory item for trainer ${trainerId}:`, error);
      throw error;
    }
  }
  /**
   * Add levels to a trainer
   * @param {number} trainerId Trainer ID
   * @param {number} levels Number of levels to add
   * @returns {Promise<Object>} Updated trainer
   */
  static async addLevels(trainerId, levels) {
    try {
      // Get current trainer data
      const trainer = await this.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Calculate new level
      const currentLevel = trainer.level || 1;
      const newLevel = currentLevel + levels;

      // Log level change
      console.log(`Trainer ${trainerId} (${trainer.name}): Level ${currentLevel} -> ${newLevel}`);

      // Update trainer in database
      const query = `
        UPDATE trainers
        SET level = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await db.asyncRun(query, [newLevel, trainerId]);

      // Return updated trainer
      return await this.getById(trainerId);
    } catch (error) {
      console.error(`Error adding levels for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add coins to a trainer
   * @param {number} trainerId Trainer ID
   * @param {number} coins Number of coins to add
   * @returns {Promise<Object>} Updated trainer
   */
  static async addCoins(trainerId, coins) {
    try {
      // Get current trainer data for logging
      const trainer = await this.getById(trainerId);
      if (trainer) {
        console.log(`Adding ${coins} coins to trainer ${trainerId} (${trainer.name}): Current coins: ${trainer.currency_amount || 0}`);
      }

      const result = await this.updateCurrency(trainerId, coins);

      // Log the result
      console.log(`Updated coins for trainer ${trainerId}: New amount: ${result.currency_amount}`);

      return result;
    } catch (error) {
      console.error(`Error adding coins for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add levels and coins to a trainer
   * @param {number} trainerId Trainer ID
   * @param {number} levels Number of levels to add
   * @param {number} coins Number of coins to add
   * @returns {Promise<Object>} Updated trainer
   */
  static async addLevelsAndCoins(trainerId, levels, coins) {
    try {
      // Get current trainer data
      const trainer = await this.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Calculate new level and currency
      const currentLevel = trainer.level || 1;
      const newLevel = currentLevel + levels;
      const currentAmount = trainer.currency_amount || 0;
      const newAmount = currentAmount + coins;
      const totalEarned = trainer.total_earned_currency || 0;
      const newTotalEarned = totalEarned + coins;

      // Update trainer in database
      const query = `
        UPDATE trainers
        SET level = $1, currency_amount = $2, total_earned_currency = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `;

      await db.asyncRun(query, [newLevel, newAmount, newTotalEarned, trainerId]);

      // Return updated trainer
      return await this.getById(trainerId);
    } catch (error) {
      console.error(`Error adding levels and coins for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get references for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Array>} Array of references
   */
  static async getReferences(trainerId) {
    try {
      // Get trainer
      const trainer = await this.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Get additional references from trainer's additional_refs column
      let additionalRefs = [];
      if (trainer.additional_refs) {
        try {
          additionalRefs = JSON.parse(trainer.additional_refs);
          // Ensure it's an array
          if (!Array.isArray(additionalRefs)) {
            additionalRefs = [];
          }
        } catch (e) {
          console.error('Error parsing additional_refs:', e);
          additionalRefs = [];
        }
      }

      // Get references from submissions
      const submissionQuery = `
        SELECT
          s.id,
          s.title,
          s.description,
          s.submission_date,
          s.content_type,
          s.user_id,
          u.username,
          u.display_name,
          (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as image_url
        FROM submissions s
        JOIN submission_references sr ON s.id = sr.submission_id
        JOIN users u ON s.user_id = u.id
        WHERE sr.trainer_id = $1 AND sr.reference_type = 'trainer'
        ORDER BY s.submission_date DESC
      `;

      const submissionRefs = await db.asyncAll(submissionQuery, [trainerId]);

      // Combine both types of references
      return [...additionalRefs, ...submissionRefs];
    } catch (error) {
      console.error(`Error getting references for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add images to a trainer
   * @param {number} trainerId Trainer ID
   * @param {Object} imageData Image data (image_url, image_type, title, description, order_index)
   * @returns {Promise<Object>} Created image
   */
  static async addImage(trainerId, imageData) {
    try {
      // Ensure required fields are present
      if (!imageData.image_url || !imageData.image_type) {
        throw new Error('image_url and image_type are required fields');
      }

      // Set default values
      const defaultData = {
        title: '',
        description: '',
        order_index: 0
      };

      // Merge default data with provided data
      const data = { ...defaultData, ...imageData, trainer_id: trainerId };

      // Build query
      const query = `
        INSERT INTO trainer_images (trainer_id, image_url, image_type, title, description, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const result = await db.asyncRun(query, [
        data.trainer_id,
        data.image_url,
        data.image_type,
        data.title,
        data.description,
        data.order_index
      ]);

      // Return the created image
      return {
        id: result.lastID,
        ...data
      };
    } catch (error) {
      console.error(`Error adding image to trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get images for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Array>} Array of images
   */
  static async getImages(trainerId) {
    try {
      const query = `
        SELECT *
        FROM trainer_images
        WHERE trainer_id = $1
        ORDER BY image_type, order_index
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error(`Error getting images for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get mega image for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object|null>} Mega image or null
   */
  static async getMegaImage(trainerId) {
    try {
      const query = `
        SELECT *
        FROM trainer_images
        WHERE trainer_id = $1 AND image_type = 'mega_image'
        ORDER BY order_index
        LIMIT 1
      `;
      return await db.asyncGet(query, [trainerId]);
    } catch (error) {
      console.error(`Error getting mega image for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get additional reference images for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Array>} Array of additional reference images
   */
  static async getAdditionalRefs(trainerId) {
    try {
      const query = `
        SELECT *
        FROM trainer_images
        WHERE trainer_id = $1 AND image_type = 'additional_ref'
        ORDER BY order_index
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error(`Error getting additional refs for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add or update mega image for a trainer
   * @param {number} trainerId Trainer ID
   * @param {string} imageUrl Image URL
   * @returns {Promise<Object>} Created or updated image
   */
  static async setMegaImage(trainerId, imageUrl) {
    try {
      // Check if mega image already exists
      const existingImage = await this.getMegaImage(trainerId);

      if (existingImage) {
        // Update existing image
        const query = `
          UPDATE trainer_images
          SET image_url = $1
          WHERE id = $2
        `;
        await db.asyncRun(query, [imageUrl, existingImage.id]);
        return { ...existingImage, image_url: imageUrl };
      } else {
        // Create new image
        return await this.addImage(trainerId, {
          image_url: imageUrl,
          image_type: 'mega_image',
          order_index: 0
        });
      }
    } catch (error) {
      console.error(`Error setting mega image for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add additional reference image for a trainer
   * @param {number} trainerId Trainer ID
   * @param {Object} imageData Image data (image_url, title, description)
   * @returns {Promise<Object>} Created image
   */
  static async addAdditionalRef(trainerId, imageData) {
    try {
      // Get current count for order_index
      const existingRefs = await this.getAdditionalRefs(trainerId);
      const orderIndex = existingRefs.length;

      return await this.addImage(trainerId, {
        image_url: imageData.image_url,
        image_type: 'additional_ref',
        title: imageData.title || '',
        description: imageData.description || '',
        order_index: orderIndex
      });
    } catch (error) {
      console.error(`Error adding additional ref to trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get achievements for a trainer
   * @param {number} trainerId Trainer ID
   * @param {boolean} isOwner Whether the requester is the owner
   * @returns {Promise<Array>} Array of achievements
   */
  static async getAchievements(trainerId, isOwner = false) {
    try {
      const TrainerAchievement = require('./TrainerAchievement');
      return await TrainerAchievement.getTrainerAchievements(trainerId, isOwner);
    } catch (error) {
      console.error(`Error getting achievements for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Claim an achievement for a trainer
   * @param {number} trainerId Trainer ID
   * @param {string} achievementId Achievement ID
   * @returns {Promise<Object>} Claim result
   */
  static async claimAchievement(trainerId, achievementId) {
    try {
      const TrainerAchievement = require('./TrainerAchievement');
      return await TrainerAchievement.claimAchievement(trainerId, achievementId);
    } catch (error) {
      console.error(`Error claiming achievement ${achievementId} for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Claim all available achievements for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object>} Claim all result
   */
  static async claimAllAchievements(trainerId) {
    try {
      const TrainerAchievement = require('./TrainerAchievement');
      return await TrainerAchievement.claimAllAchievements(trainerId);
    } catch (error) {
      console.error(`Error claiming all achievements for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get achievement statistics for a trainer
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object>} Achievement statistics
   */
  static async getAchievementStats(trainerId) {
    try {
      const achievements = await this.getAchievements(trainerId, true);
      
      const stats = {
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length,
        claimed: achievements.filter(a => a.claimed).length,
        unclaimed: achievements.filter(a => a.unlocked && !a.claimed).length,
        categories: {}
      };

      // Group by category
      const categories = ['type', 'attribute', 'level100', 'trainer_level', 'special'];
      for (const category of categories) {
        const categoryAchievements = achievements.filter(a => a.category === category);
        stats.categories[category] = {
          total: categoryAchievements.length,
          unlocked: categoryAchievements.filter(a => a.unlocked).length,
          claimed: categoryAchievements.filter(a => a.claimed).length
        };
      }

      return stats;
    } catch (error) {
      console.error(`Error getting achievement stats for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get trainer by name and user
   * @param {string} name - Trainer name
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} Trainer or null
   */
  static async getByNameAndUser(name, discordUserId) {
    try {
      const query = `
        SELECT * FROM trainers
        WHERE name = $1 AND player_user_id = $2
      `;

      const trainer = await db.asyncGet(query, [name, discordUserId]);
      return trainer;
    } catch (error) {
      console.error(`Error getting trainer by name and user:`, error);
      throw error;
    }
  }

  /**
   * Get trainer by name only
   * @param {string} name - Trainer name
   * @returns {Promise<Object|null>} Trainer or null
   */
  static async getByName(name) {
    try {
      const query = `
        SELECT * FROM trainers
        WHERE name = $1
        LIMIT 1
      `;

      const trainer = await db.asyncGet(query, [name]);
      return trainer;
    } catch (error) {
      console.error(`Error getting trainer by name:`, error);
      throw error;
    }
  }
}

module.exports = Trainer;
