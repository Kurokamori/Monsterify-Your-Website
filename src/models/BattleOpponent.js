const pool = require('../db');

/**
 * Battle Opponent model
 */
class BattleOpponent {
  /**
   * Get all battle opponents
   * @param {boolean} activeOnly - Whether to get only active opponents
   * @returns {Promise<Array>} - Array of battle opponents
   */
  static async getAll(activeOnly = true) {
    try {
      let query = 'SELECT * FROM battle_opponents';
      
      if (activeOnly) {
        query += ' WHERE is_active = true';
      }
      
      query += ' ORDER BY difficulty, name';
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting battle opponents:', error);
      return [];
    }
  }

  /**
   * Get a battle opponent by ID
   * @param {number} opponentId - Opponent ID
   * @returns {Promise<Object|null>} - Battle opponent or null if not found
   */
  static async getById(opponentId) {
    try {
      const query = 'SELECT * FROM battle_opponents WHERE opponent_id = $1';
      const result = await pool.query(query, [opponentId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting battle opponent ${opponentId}:`, error);
      return null;
    }
  }

  /**
   * Get opponents by difficulty
   * @param {string} difficulty - Difficulty level (easy, normal, hard, elite)
   * @returns {Promise<Array>} - Array of battle opponents
   */
  static async getByDifficulty(difficulty) {
    try {
      const query = 'SELECT * FROM battle_opponents WHERE difficulty = $1 AND is_active = true ORDER BY name';
      const result = await pool.query(query, [difficulty]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting battle opponents with difficulty ${difficulty}:`, error);
      return [];
    }
  }

  /**
   * Get all monsters for an opponent
   * @param {number} opponentId - Opponent ID
   * @returns {Promise<Array>} - Array of opponent monsters
   */
  static async getMonsters(opponentId) {
    try {
      const query = 'SELECT * FROM opponent_monsters WHERE opponent_id = $1 ORDER BY position';
      const result = await pool.query(query, [opponentId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting monsters for opponent ${opponentId}:`, error);
      return [];
    }
  }

  /**
   * Create a new battle opponent
   * @param {Object} opponentData - Opponent data
   * @returns {Promise<Object|null>} - Created opponent or null if error
   */
  static async create(opponentData) {
    try {
      const { name, description, image_url, difficulty, level, type } = opponentData;
      
      const query = `
        INSERT INTO battle_opponents (
          name, description, image_url, difficulty, level, type, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        name,
        description,
        image_url,
        difficulty,
        level,
        type,
        opponentData.is_active !== undefined ? opponentData.is_active : true
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating battle opponent:', error);
      return null;
    }
  }

  /**
   * Add a monster to an opponent's team
   * @param {number} opponentId - Opponent ID
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object|null>} - Created monster or null if error
   */
  static async addMonster(opponentId, monsterData) {
    try {
      // Get the next position in the team
      const positionQuery = 'SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM opponent_monsters WHERE opponent_id = $1';
      const positionResult = await pool.query(positionQuery, [opponentId]);
      const position = positionResult.rows[0].next_position;
      
      // Create the monster
      const query = `
        INSERT INTO opponent_monsters (
          opponent_id, name, level, species1, species2, species3,
          type1, type2, type3, type4, type5, attribute,
          hp_total, atk_total, def_total, spa_total, spd_total, spe_total,
          moveset, image_url, position
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        opponentId,
        monsterData.name,
        monsterData.level,
        monsterData.species1,
        monsterData.species2 || null,
        monsterData.species3 || null,
        monsterData.type1,
        monsterData.type2 || null,
        monsterData.type3 || null,
        monsterData.type4 || null,
        monsterData.type5 || null,
        monsterData.attribute || null,
        monsterData.hp_total,
        monsterData.atk_total,
        monsterData.def_total,
        monsterData.spa_total,
        monsterData.spd_total,
        monsterData.spe_total,
        monsterData.moveset || '[]',
        monsterData.image_url || null,
        position
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error adding monster to opponent ${opponentId}:`, error);
      return null;
    }
  }

  /**
   * Update a battle opponent
   * @param {number} opponentId - Opponent ID
   * @param {Object} opponentData - Updated opponent data
   * @returns {Promise<Object|null>} - Updated opponent or null if error
   */
  static async update(opponentId, opponentData) {
    try {
      const query = `
        UPDATE battle_opponents
        SET name = $1,
            description = $2,
            image_url = $3,
            difficulty = $4,
            level = $5,
            type = $6,
            is_active = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE opponent_id = $8
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        opponentData.name,
        opponentData.description,
        opponentData.image_url,
        opponentData.difficulty,
        opponentData.level,
        opponentData.type,
        opponentData.is_active !== undefined ? opponentData.is_active : true,
        opponentId
      ]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating battle opponent ${opponentId}:`, error);
      return null;
    }
  }

  /**
   * Delete a battle opponent
   * @param {number} opponentId - Opponent ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  static async delete(opponentId) {
    try {
      // First delete all monsters associated with this opponent
      await pool.query('DELETE FROM opponent_monsters WHERE opponent_id = $1', [opponentId]);
      
      // Then delete the opponent
      const query = 'DELETE FROM battle_opponents WHERE opponent_id = $1 RETURNING *';
      const result = await pool.query(query, [opponentId]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting battle opponent ${opponentId}:`, error);
      return false;
    }
  }
}

module.exports = BattleOpponent;
