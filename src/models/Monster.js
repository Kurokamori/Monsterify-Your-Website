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
      } = monsterData;

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
      Object.entries(monsterData).forEach(([key, value]) => {
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
}

module.exports = Monster;
