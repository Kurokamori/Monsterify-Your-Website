const pool = require('../db');

class Trainer {
  /**
   * Get all trainers
   * @returns {Promise<Array>} - Array of trainers with monster counts
   */
  static async getAll() {
    try {
      // Get all trainers
      const query = 'SELECT * FROM trainers ORDER BY name';
      const result = await pool.query(query);
      const trainers = result.rows;

      // Get monster counts for each trainer
      for (const trainer of trainers) {
        // Count total monsters
        const monsterCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
        const monsterCountResult = await pool.query(monsterCountQuery, [trainer.id]);
        trainer.monster_count = parseInt(monsterCountResult.rows[0].count) || 0;

        // Count monsters with references (non-empty img_link)
        const monsterRefCountQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND img_link IS NOT NULL AND img_link != \'\'';
        const monsterRefCountResult = await pool.query(monsterRefCountQuery, [trainer.id]);
        trainer.monster_ref_count = parseInt(monsterRefCountResult.rows[0].count) || 0;

        // Calculate percentage
        trainer.monster_ref_percent = trainer.monster_count > 0
          ? Math.round((trainer.monster_ref_count / trainer.monster_count) * 100)
          : 0;

        // Update the trainer record with these counts
        await this.updateMonsterCounts(trainer.id, trainer.monster_count, trainer.monster_ref_count);
      }

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
      return result.rows[0];
    } catch (error) {
      console.error('Error getting trainer by ID:', error);
      return null;
    }
  }

  /**
   * Get a trainer by player user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Trainer object
   */
  static async getByUserId(userId) {
    try {
      const query = 'SELECT * FROM trainers WHERE player_user_id = $1';
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting trainer by user ID:', error);
      return null;
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
            // Skip this field or set it to null
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

      // Add the updated_at timestamp
      columns.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add the ID as the last parameter
      values.push(id);

      const query = `
        UPDATE trainers
        SET ${columns.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

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
