const pool = require('../db');

class Trainer {
  /**
   * Get all trainers
   * @returns {Promise<Array>} - Array of trainers with monster counts
   */
  static async getAll() {
    try {
      // Get all trainers with monster counts in a single query
      const query = `
        SELECT
          t.*,
          COALESCE(monster_count.count, 0) AS monster_count,
          COALESCE(monster_ref_count.count, 0) AS monster_ref_count,
          CASE
            WHEN COALESCE(monster_count.count, 0) > 0
            THEN ROUND((COALESCE(monster_ref_count.count, 0)::numeric / monster_count.count) * 100)
            ELSE 0
          END AS monster_ref_percent
        FROM
          trainers t
        LEFT JOIN
          (SELECT trainer_id, COUNT(*) as count FROM mons GROUP BY trainer_id) monster_count
          ON t.id = monster_count.trainer_id
        LEFT JOIN
          (SELECT trainer_id, COUNT(*) as count FROM mons WHERE img_link IS NOT NULL AND img_link != '' GROUP BY trainer_id) monster_ref_count
          ON t.id = monster_ref_count.trainer_id
        ORDER BY
          t.name
      `;

      const result = await pool.query(query);
      const trainers = result.rows;

      // Update the trainer records with these counts (in the background)
      // This is done asynchronously to not slow down the response
      setTimeout(async () => {
        try {
          for (const trainer of trainers) {
            await this.updateMonsterCounts(trainer.id, trainer.monster_count, trainer.monster_ref_count);
          }
        } catch (error) {
          console.error('Error updating trainer monster counts in background:', error);
        }
      }, 0);

      // Parse additional_references JSON for each trainer
      trainers.forEach(trainer => {
        if (trainer.additional_references) {
          try {
            trainer.additional_references = JSON.parse(trainer.additional_references);
          } catch (e) {
            console.error('Error parsing additional_references JSON:', e);
            trainer.additional_references = [];
          }
        } else {
          trainer.additional_references = [];
        }
      });

      return trainers;
    } catch (error) {
      console.error('Error getting all trainers:', error);
      return [];
    }
  }

  /**
   * Get a trainer by ID
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} - Trainer object
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM trainers WHERE id = $1';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const trainer = result.rows[0];

      // Parse additional_references JSON if it exists
      if (trainer.additional_references) {
        try {
          trainer.additional_references = JSON.parse(trainer.additional_references);
        } catch (e) {
          console.error('Error parsing additional_references JSON:', e);
          trainer.additional_references = [];
        }
      } else {
        trainer.additional_references = [];
      }

      return trainer;
    } catch (error) {
      console.error('Error getting trainer by ID:', error);
      return null;
    }
  }

  /**
   * Get all trainers for a player user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of trainer objects
   */
  static async getByUserId(userId) {
    try {
      const query = 'SELECT * FROM trainers WHERE player_user_id = $1 ORDER BY name';
      const result = await pool.query(query, [userId]);

      // Parse additional_references JSON for each trainer
      const trainers = result.rows.map(trainer => {
        if (trainer.additional_references) {
          try {
            trainer.additional_references = JSON.parse(trainer.additional_references);
          } catch (e) {
            console.error('Error parsing additional_references JSON:', e);
            trainer.additional_references = [];
          }
        } else {
          trainer.additional_references = [];
        }
        return trainer;
      });

      return trainers;
    } catch (error) {
      console.error('Error getting trainers by user ID:', error);
      return [];
    }
  }

  /**
   * Create a new trainer
   * @param {Object} trainerData - Trainer data
   * @returns {Promise<Object>} - Created trainer
   */
  static async create(trainerData) {
    try {
      // Integer fields in the trainers table
      const integerFields = ['alter_human', 'age', 'height_ft', 'height_in', 'level', 'level_modifier',
                            'badge_amount', 'frontier_badges_amount', 'contest_ribbons_amount', 'mon_amount', 'mon_referenced_amount'];

      // Create a new object without the id field
      const { id, ...dataWithoutId } = trainerData;

      // Process the data to handle empty strings for integer fields
      for (const field of integerFields) {
        if (field in dataWithoutId && dataWithoutId[field] === '') {
          dataWithoutId[field] = null;
        }
      }

      // Extract the required fields
      const { name, player_user_id } = dataWithoutId;

      // Ensure we have the minimum required fields
      if (!name || !player_user_id) {
        throw new Error('Name and player_user_id are required fields');
      }

      // Set default image if not provided
      if (!dataWithoutId.main_ref) {
        dataWithoutId.main_ref = '/images/default_trainer.png';
      }

      // Get the maximum ID currently in the table and set the sequence to start after it
      try {
        const maxIdResult = await pool.query('SELECT MAX(id) FROM trainers');
        const maxId = maxIdResult.rows[0].max || 0;
        const newSeqStart = Math.max(100, maxId + 1);

        await pool.query(`ALTER SEQUENCE trainers_id_seq RESTART WITH ${newSeqStart};`);
        console.log(`Reset trainers_id_seq to start at ${newSeqStart}`);
      } catch (seqError) {
        console.error('Error resetting sequence:', seqError);
        // Continue anyway
      }

      // Build a more complete query with all the fields
      // Extract all fields from dataWithoutId
      const fields = Object.keys(dataWithoutId);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = fields.map(field => dataWithoutId[field]);

      const query = `
        INSERT INTO trainers (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      console.log('Using complete field list for insertion');
      console.log('Fields:', fields);
      console.log('Values:', values);

      const result = await pool.query(query, values);

      if (!result.rows[0]) {
        throw new Error('Failed to create trainer - no rows returned');
      }

      const newTrainer = result.rows[0];
      const trainerId = newTrainer.id;

      console.log('Created new trainer with ID:', trainerId);

      return newTrainer;
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw error;
    }
  }

  /**
   * Update a trainer
   * @param {number} id - Trainer ID
   * @param {Object} trainerData - Trainer data
   * @returns {Promise<Object>} - Updated trainer
   */
  static async update(id, trainerData) {
    try {
      // Create a copy of the trainer data to modify
      const processedData = { ...trainerData };

      // Debug output
      console.log('Trainer update data received:', processedData);
      console.log('main_ref in update:', processedData.main_ref);
      console.log('main_ref_artist in update:', processedData.main_ref_artist);

      // Handle additional references
      if (processedData.additional_references) {
        // Convert to JSON string if it's an array
        if (Array.isArray(processedData.additional_references)) {
          // Filter out empty references (those without title or description)
          const filteredReferences = processedData.additional_references.filter(ref => {
            return (ref.title && ref.title.trim()) || (ref.description && ref.description.trim());
          });

          // Set the type to 'text' if img_url is empty
          filteredReferences.forEach(ref => {
            if (!ref.img_url || ref.img_url.trim() === '') {
              ref.type = 'text';
            } else if (!ref.type) {
              ref.type = 'image';
            }
          });

          processedData.additional_references = JSON.stringify(filteredReferences);
        }
      }

      // If main_ref is empty string, set to default
      if (processedData.main_ref === '') {
        processedData.main_ref = '/images/default_trainer.png';
      }

      // Integer fields in the trainers table
      const integerFields = ['alter_human', 'age', 'height_ft', 'height_in', 'level', 'level_modifier',
                            'badge_amount', 'frontier_badges_amount', 'contest_ribbons_amount', 'mon_amount', 'mon_referenced_amount'];

      // Create a set of columns and values for the SQL query
      const columns = [];
      const values = [];
      let paramCounter = 1;

      // Add each property to the columns and values arrays
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle empty strings for integer fields
          if (integerFields.includes(key) && value === '') {
            columns.push(`${key} = $${paramCounter}`);
            values.push(null);
            paramCounter++;
          } else {
            columns.push(`${key} = $${paramCounter}`);
            values.push(value);
            paramCounter++;
          }
        }
      });

      // Explicitly ensure main_ref and main_ref_artist are included in the update
      if (!columns.some(col => col.startsWith('main_ref =')) && processedData.main_ref !== undefined) {
        columns.push(`main_ref = $${paramCounter}`);
        values.push(processedData.main_ref);
        paramCounter++;
      }

      if (!columns.some(col => col.startsWith('main_ref_artist =')) && processedData.main_ref_artist !== undefined) {
        columns.push(`main_ref_artist = $${paramCounter}`);
        values.push(processedData.main_ref_artist);
        paramCounter++;
      }

      // Add the updated_at timestamp if it's not already in the columns
      if (!columns.some(col => col.startsWith('updated_at ='))) {
        columns.push(`updated_at = CURRENT_TIMESTAMP`);
      }

      // Add the ID as the last parameter
      values.push(id);

      const query = `
        UPDATE trainers
        SET ${columns.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      // Debug output
      console.log('Final SQL query:', query);
      console.log('Final SQL values:', values);

      const result = await pool.query(query, values);

      // Debug output
      console.log('Updated trainer:', JSON.stringify(result.rows[0], null, 2));

      return result.rows[0];
    } catch (error) {
      console.error('Error updating trainer:', error);
      throw error;
    }
  }

  /**
   * Add an item to a trainer's inventory
   * @param {number} trainerId - Trainer ID
   * @param {Object} item - Item to add (with item_id and quantity)
   * @returns {Promise<Object>} Updated trainer
   */
  static async addItemToInventory(trainerId, item) {
    try {
      // Get the trainer
      const trainer = await this.getById(trainerId);

      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Parse the current inventory
      let inventory = [];
      try {
        if (trainer.inventory) {
          inventory = JSON.parse(trainer.inventory);
        }
      } catch (inventoryError) {
        console.error(`Error parsing inventory for trainer ${trainerId}:`, inventoryError);
        inventory = [];
      }

      // Check if the item already exists in the inventory
      const existingItemIndex = inventory.findIndex(i => i.item_id === item.item_id);

      if (existingItemIndex >= 0) {
        // Update the quantity of the existing item
        inventory[existingItemIndex].quantity += item.quantity;
      } else {
        // Add the new item to the inventory
        inventory.push(item);
      }

      // Update the trainer's inventory
      const updatedTrainer = {
        ...trainer,
        inventory: JSON.stringify(inventory)
      };

      // Save the updated trainer
      return await this.update(trainerId, updatedTrainer);
    } catch (error) {
      console.error(`Error adding item to inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a trainer
   * @param {number} id - Trainer ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM trainers WHERE id = $1';
      await pool.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting trainer:', error);
      throw error;
    }
  }

  /**
   * Get monsters in a trainer's battle box
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters in battle box
   */
  static async getBattleBoxMonsters(trainerId) {
    try {
      // Query for monsters with box_number = -1
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = -1 ORDER BY name';
      console.log('Executing battle box query:', query, 'with trainerId:', trainerId);
      const result = await pool.query(query, [trainerId]);
      console.log('Battle box query result:', result.rows.length, 'monsters found');

      // If no monsters found, try to query for monsters with box_number = 1 (in case the box number was changed)
      if (result.rows.length === 0) {
        console.log('No monsters found with box_number = -1, trying box_number = 1');
        const fallbackQuery = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = 1 ORDER BY name';
        const fallbackResult = await pool.query(fallbackQuery, [trainerId]);
        console.log('Fallback query result:', fallbackResult.rows.length, 'monsters found');
        return fallbackResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting battle box monsters:', error);
      return [];
    }
  }

  /**
   * Update monster counts for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterCount - Total monster count
   * @param {number} monsterRefCount - Monster reference count
   * @returns {Promise<boolean>} - Success status
   */
  static async updateMonsterCounts(trainerId, monsterCount, monsterRefCount) {
    try {
      const query = `
        UPDATE trainers
        SET mon_amount = $1, mon_referenced_amount = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;
      await pool.query(query, [monsterCount, monsterRefCount, trainerId]);
      return true;
    } catch (error) {
      console.error('Error updating monster counts:', error);
      return false;
    }
  }

  /**
   * Get inventory for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Trainer inventory object
   */
  static async getInventory(trainerId) {
    try {
      const query = `
        SELECT
          inv_items, inv_balls, inv_berries, inv_pastries,
          inv_evolution, inv_eggs, inv_antiques, inv_helditems, inv_seals
        FROM trainers
        WHERE id = $1
      `;
      const result = await pool.query(query, [trainerId]);

      if (!result.rows[0]) {
        return null;
      }

      const inventory = {};
      const trainer = result.rows[0];

      // Parse each inventory category
      const categories = [
        'inv_items', 'inv_balls', 'inv_berries', 'inv_pastries',
        'inv_evolution', 'inv_eggs', 'inv_antiques', 'inv_helditems', 'inv_seals'
      ];

      for (const category of categories) {
        try {
          inventory[category] = trainer[category] ? JSON.parse(trainer[category]) : {};
        } catch (e) {
          console.error(`Error parsing ${category} for trainer ${trainerId}:`, e);
          inventory[category] = {};
        }
      }

      return inventory;
    } catch (error) {
      console.error('Error getting trainer inventory:', error);
      return null;
    }
  }

  /**
   * Update inventory item for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {string} category - Inventory category (inv_items, inv_balls, etc.)
   * @param {string} itemName - Item name
   * @param {number} quantity - Quantity to add (positive) or remove (negative)
   * @returns {Promise<boolean>} - Success status
   */
  static async updateInventoryItem(trainerId, category, itemName, quantity) {
    try {
      // Validate category
      const validCategories = [
        'inv_items', 'inv_balls', 'inv_berries', 'inv_pastries',
        'inv_evolution', 'inv_eggs', 'inv_antiques', 'inv_helditems', 'inv_seals'
      ];

      if (!validCategories.includes(category)) {
        throw new Error(`Invalid inventory category: ${category}`);
      }

      // Get current inventory
      const query = `SELECT ${category} FROM trainers WHERE id = $1`;
      const result = await pool.query(query, [trainerId]);

      if (!result.rows[0]) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Parse inventory
      let inventory = {};
      try {
        inventory = result.rows[0][category] ? JSON.parse(result.rows[0][category]) : {};
      } catch (e) {
        console.error(`Error parsing ${category} for trainer ${trainerId}:`, e);
        // Continue with empty inventory if parsing fails
      }

      // Update item quantity
      const currentQuantity = inventory[itemName] || 0;
      const newQuantity = currentQuantity + quantity;

      // Remove item if quantity is 0 or less
      if (newQuantity <= 0) {
        delete inventory[itemName];
      } else {
        inventory[itemName] = newQuantity;
      }

      // Update inventory in database
      const updateQuery = `UPDATE trainers SET ${category} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
      await pool.query(updateQuery, [JSON.stringify(inventory), trainerId]);

      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return false;
    }
  }

  /**
   * Recalculate monster counts for a specific trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<boolean>} - Success status
   */
  static async recalculateMonsterCounts(trainerId) {
    try {
      // Count total monsters
      const monsterCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
      const monsterCountResult = await pool.query(monsterCountQuery, [trainerId]);
      const monsterCount = parseInt(monsterCountResult.rows[0].count) || 0;

      // Count monsters with references (non-empty img_link)
      const monsterRefCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND img_link IS NOT NULL AND img_link != \'\'';
      const monsterRefCountResult = await pool.query(monsterRefCountQuery, [trainerId]);
      const monsterRefCount = parseInt(monsterRefCountResult.rows[0].count) || 0;

      // Update the trainer record
      return await this.updateMonsterCounts(trainerId, monsterCount, monsterRefCount);
    } catch (error) {
      console.error('Error recalculating monster counts:', error);
      return false;
    }
  }
}

module.exports = Trainer;
