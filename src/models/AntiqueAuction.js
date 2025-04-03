const pool = require('../db');

class AntiqueAuction {
  /**
   * Create the antique_auctions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      // Use the SQL from the migrations file
      const fs = require('fs');
      const path = require('path');
      const sql = fs.readFileSync(path.join(__dirname, '../db/migrations/antique_auctions.sql'), 'utf8');
      
      await pool.query(sql);
      console.log('Antique auctions table created or already exists');
    } catch (error) {
      console.error('Error creating antique_auctions table:', error);
      throw error;
    }
  }

  /**
   * Get all auction monsters
   * @returns {Promise<Array>} Array of auction monsters
   */
  static async getAll() {
    try {
      const result = await pool.query(`
        SELECT * FROM antique_auctions
        ORDER BY created_at DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting all auction monsters:', error);
      throw error;
    }
  }

  /**
   * Get auction monsters by antique type
   * @param {string} antique - Antique type
   * @returns {Promise<Array>} Array of auction monsters for the specified antique
   */
  static async getByAntique(antique) {
    try {
      const result = await pool.query(`
        SELECT * FROM antique_auctions
        WHERE antique = $1
        ORDER BY created_at DESC
      `, [antique]);
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting auction monsters for antique ${antique}:`, error);
      throw error;
    }
  }

  /**
   * Add a monster to the auction
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} Created auction monster
   */
  static async create(monsterData) {
    try {
      const {
        antique,
        image_link,
        name,
        species1,
        species2,
        species3,
        type1,
        type2,
        type3,
        type4,
        type5,
        attribute
      } = monsterData;

      const result = await pool.query(`
        INSERT INTO antique_auctions (
          antique,
          image_link,
          name,
          species1,
          species2,
          species3,
          type1,
          type2,
          type3,
          type4,
          type5,
          attribute
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        antique,
        image_link,
        name,
        species1,
        species2 || null,
        species3 || null,
        type1,
        type2 || null,
        type3 || null,
        type4 || null,
        type5 || null,
        attribute || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating auction monster:', error);
      throw error;
    }
  }

  /**
   * Delete an auction monster by ID
   * @param {number} id - Auction monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const result = await pool.query(`
        DELETE FROM antique_auctions
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting auction monster ${id}:`, error);
      throw error;
    }
  }
}

module.exports = AntiqueAuction;
