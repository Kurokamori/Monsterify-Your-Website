const pool = require('../db');

class Monster {
  /**
   * Get all monsters
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM mons ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all monsters:', error);
      return [];
    }
  }

  /**
   * Get a monster by ID
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Monster object
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM mons WHERE mon_id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting monster by ID:', error);
      return null;
    }
  }

  /**
   * Get monsters by trainer ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 ORDER BY name';
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID:', error);
      return [];
    }
  }

  /**
   * Get monsters in a trainer's battle box
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters in battle box
   */
  static async getBattleBox(trainerId) {
    try {
      // Query for monsters with box_number = -1
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = -1 ORDER BY name';
      const result = await pool.query(query, [trainerId]);

      // If no monsters found, try to query for monsters with box_number = 1 (in case the box number was changed)
      if (result.rows.length === 0) {
        const fallbackQuery = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = 1 ORDER BY name';
        const fallbackResult = await pool.query(fallbackQuery, [trainerId]);
        return fallbackResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting battle box monsters:', error);
      return [];
    }
  }

  /**
   * Create a new monster
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Created monster
   */
  static async create(monsterData) {
    try {
      // Create a copy of the monster data to modify
      const processedData = { ...monsterData };

      // Set default image if not provided
      if (!processedData.img_link) {
        processedData.img_link = '/images/default_mon.png';
      }

      const {
        trainer_id,
        name,
        level,
        species1,
        species2,
        species3,
        type1,
        type2,
        type3,
        type4,
        type5,
        attribute,
        img_link,
        box_number
      } = processedData;

      const query = `
        INSERT INTO mons (
          trainer_id,
          name,
          level,
          species1,
          species2,
          species3,
          type1,
          type2,
          type3,
          type4,
          type5,
          attribute,
          img_link,
          box_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        trainer_id,
        name,
        level,
        species1,
        species2,
        species3,
        type1,
        type2,
        type3,
        type4,
        type5,
        attribute,
        img_link,
        box_number
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating monster:', error);
      return null;
    }
  }

  /**
   * Update a monster
   * @param {number} id - Monster ID
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Updated monster
   */
  static async update(id, monsterData) {
    try {
      // Create a copy of the monster data to modify
      const processedData = { ...monsterData };

      // If img_link is empty string, set to default
      if (processedData.img_link === '') {
        processedData.img_link = '/images/default_mon.png';
      }

      // Integer fields in the mons table
      const integerFields = ['mon_id', 'trainer_id', 'level', 'mon_index', 'box_number',
                            'hp_total', 'hp_ev', 'hp_iv', 'atk_total', 'atk_ev', 'atk_iv',
                            'def_total', 'def_ev', 'def_iv', 'spa_total', 'spa_ev', 'spa_iv',
                            'spd_total', 'spd_ev', 'spd_iv', 'spe_total', 'spe_ev', 'spe_iv',
                            'shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'friendship'];

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
        UPDATE mons
        SET ${columns.join(', ')}
        WHERE mon_id = $${paramCounter}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      // Debug output
      console.log('Updated monster:', JSON.stringify(result.rows[0], null, 2));

      return result.rows[0];
    } catch (error) {
      console.error('Error updating monster:', error);
      return null;
    }
  }

  /**
   * Delete a monster
   * @param {number} id - Monster ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM mons WHERE mon_id = $1';
      await pool.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting monster:', error);
      return false;
    }
  }

  /**
   * Get monsters by trainer ID and box number
   * @param {number} trainerId - Trainer ID
   * @param {number} boxNumber - Box number
   * @returns {Promise<Array>} - Array of monsters in the specified box
   */
  static async getByTrainerIdAndBoxNumber(trainerId, boxNumber) {
    try {
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = $2 ORDER BY trainer_index, name';
      const result = await pool.query(query, [trainerId, boxNumber]);
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID and box number:', error);
      return [];
    }
  }

  /**
   * Get all box numbers for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of box numbers
   */
  static async getBoxNumbersByTrainerId(trainerId) {
    try {
      const query = 'SELECT DISTINCT box_number FROM mons WHERE trainer_id = $1 ORDER BY box_number';
      const result = await pool.query(query, [trainerId]);
      return result.rows.map(row => row.box_number);
    } catch (error) {
      console.error('Error getting box numbers by trainer ID:', error);
      return [];
    }
  }

  /**
   * Get monsters by trainer ID with pagination
   * @param {number} trainerId - Trainer ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of monsters per page
   * @returns {Promise<Object>} - Object containing monsters and pagination info
   */
  static async getByTrainerIdPaginated(trainerId, page = 1, limit = 30) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
      const countResult = await pool.query(countQuery, [trainerId]);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get monsters for the current page
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 ORDER BY box_number, trainer_index, name LIMIT $2 OFFSET $3';
      const result = await pool.query(query, [trainerId, limit, offset]);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        monsters: result.rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting paginated monsters by trainer ID:', error);
      return {
        monsters: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get monsters by trainer ID and box number with pagination
   * @param {number} trainerId - Trainer ID
   * @param {number} boxNumber - Box number
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of monsters per page
   * @returns {Promise<Object>} - Object containing monsters and pagination info
   */
  static async getByTrainerIdAndBoxNumberPaginated(trainerId, boxNumber, page = 1, limit = 30) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND box_number = $2';
      const countResult = await pool.query(countQuery, [trainerId, boxNumber]);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get monsters for the current page
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = $2 ORDER BY trainer_index, name LIMIT $3 OFFSET $4';
      const result = await pool.query(query, [trainerId, boxNumber, limit, offset]);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        monsters: result.rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting paginated monsters by trainer ID and box number:', error);
      return {
        monsters: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Reorganize monsters into boxes of specified size
   * @param {number} trainerId - Trainer ID
   * @param {number} boxSize - Maximum number of monsters per box
   * @returns {Promise<boolean>} - Success status
   */
  static async reorganizeBoxes(trainerId, boxSize = 30) {
    try {
      // Get all monsters for the trainer, excluding battle box (box_number = -1)
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number != -1 ORDER BY trainer_index, name';
      const result = await pool.query(query, [trainerId]);
      const monsters = result.rows;

      // Calculate new box numbers
      const updates = [];
      monsters.forEach((monster, index) => {
        const newBoxNumber = Math.floor(index / boxSize) + 1; // Box numbers start at 1
        if (monster.box_number !== newBoxNumber) {
          updates.push({
            monId: monster.mon_id,
            boxNumber: newBoxNumber
          });
        }
      });

      // Update box numbers in batches
      for (const update of updates) {
        await pool.query(
          'UPDATE mons SET box_number = $1, updated_at = CURRENT_TIMESTAMP WHERE mon_id = $2',
          [update.boxNumber, update.monId]
        );
      }

      return true;
    } catch (error) {
      console.error('Error reorganizing boxes:', error);
      return false;
    }
  }
}

module.exports = Monster;
