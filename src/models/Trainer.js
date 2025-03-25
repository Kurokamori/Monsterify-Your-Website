const pool = require('../db');

class Trainer {
  /**
   * Get all trainers
   * @returns {Promise<Array>} - Array of trainers
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM trainers ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
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
      const {
        name,
        title,
        player_user_id,
        level,
        currency_amount,
        faction,
        species1,
        species2,
        species3,
        type1,
        type2,
        type3,
        type4,
        type5,
        type6,
        fav_type1,
        fav_type2,
        fav_type3,
        fav_type4,
        fav_type5,
        fav_type6,
        gender,
        pronouns,
        age,
        birthday,
        birthplace,
        residence,
        fav_berry,
        quote,
        tldr,
        long_bio,
        mega_evo,
        mega_main_reference,
        mega_artist,
        mega_ability
      } = trainerData;

      const query = `
        INSERT INTO trainers (
          name,
          title,
          player_user_id,
          level,
          currency_amount,
          faction,
          species1,
          species2,
          species3,
          type1,
          type2,
          type3,
          type4,
          type5,
          type6,
          fav_type1,
          fav_type2,
          fav_type3,
          fav_type4,
          fav_type5,
          fav_type6,
          gender,
          pronouns,
          age,
          birthday,
          birthplace,
          residence,
          fav_berry,
          quote,
          tldr,
          long_bio,
          mega_evo,
          mega_main_reference,
          mega_artist,
          mega_ability
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35
        )
        RETURNING *
      `;

      const values = [
        name,
        title,
        player_user_id,
        level,
        currency_amount,
        faction,
        species1,
        species2,
        species3,
        type1,
        type2,
        type3,
        type4,
        type5,
        type6,
        fav_type1,
        fav_type2,
        fav_type3,
        fav_type4,
        fav_type5,
        fav_type6,
        gender,
        pronouns,
        age,
        birthday,
        birthplace,
        residence,
        fav_berry,
        quote,
        tldr,
        long_bio,
        mega_evo,
        mega_main_reference,
        mega_artist,
        mega_ability
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
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
      // Integer fields in the trainers table
      const integerFields = ['id', 'alter_human', 'age', 'height_ft', 'height_in', 'level', 'level_modifier',
                            'badge_amount', 'frontier_badges_amount', 'contest_ribbons_amount', 'mon_amount', 'mon_referenced_amount'];

      // Create a set of columns and values for the SQL query
      const columns = [];
      const values = [];
      let paramCounter = 1;

      // Add each property to the columns and values arrays
      Object.entries(trainerData).forEach(([key, value]) => {
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
}

module.exports = Trainer;
