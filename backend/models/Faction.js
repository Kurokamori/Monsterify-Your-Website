const db = require('../config/db');

class Faction {
  /**
   * Get all factions
   * @returns {Promise<Array>} Array of factions
   */
  static async getAll() {
    try {
      const query = `
        SELECT * FROM factions
        ORDER BY name
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all factions:', error);
      throw error;
    }
  }

  /**
   * Get faction by ID
   * @param {number} id - Faction ID
   * @returns {Promise<Object|null>} Faction object or null if not found
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM factions WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting faction by ID:', error);
      throw error;
    }
  }

  /**
   * Get faction by name
   * @param {string} name - Faction name
   * @returns {Promise<Object|null>} Faction object or null if not found
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM factions WHERE name = $1';
      return await db.asyncGet(query, [name]);
    } catch (error) {
      console.error('Error getting faction by name:', error);
      throw error;
    }
  }

  /**
   * Get faction titles
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of faction titles
   */
  static async getTitles(factionId) {
    try {
      const query = `
        SELECT * FROM faction_titles 
        WHERE faction_id = $1 
        ORDER BY standing_requirement ASC
      `;
      return await db.asyncAll(query, [factionId]);
    } catch (error) {
      console.error('Error getting faction titles:', error);
      throw error;
    }
  }

  /**
   * Get faction store items
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of store items
   */
  static async getStoreItems(factionId) {
    try {
      const query = `
        SELECT * FROM faction_stores 
        WHERE faction_id = $1 AND is_active = 1
        ORDER BY standing_requirement ASC, price ASC
      `;
      return await db.asyncAll(query, [factionId]);
    } catch (error) {
      console.error('Error getting faction store items:', error);
      throw error;
    }
  }

  /**
   * Get faction relationships
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of faction relationships
   */
  static async getRelationships(factionId) {
    try {
      const query = `
        SELECT fr.*, f.name as related_faction_name
        FROM faction_relationships fr
        JOIN factions f ON fr.related_faction_id = f.id
        WHERE fr.faction_id = $1
      `;
      return await db.asyncAll(query, [factionId]);
    } catch (error) {
      console.error('Error getting faction relationships:', error);
      throw error;
    }
  }

  /**
   * Create a new faction
   * @param {Object} factionData - Faction data
   * @returns {Promise<Object>} Created faction
   */
  static async create(factionData) {
    try {
      const { name, description, banner_image, icon_image, color } = factionData;
      
      const query = `
        INSERT INTO factions (name, description, banner_image, icon_image, color)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const result = await db.asyncRun(query, [name, description, banner_image, icon_image, color]);
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating faction:', error);
      throw error;
    }
  }

  /**
   * Update faction
   * @param {number} id - Faction ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated faction
   */
  static async update(id, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = $1`).join(', ');
      
      const query = `UPDATE factions SET ${setClause} WHERE id = $2`;
      await db.asyncRun(query, [...values, id]);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating faction:', error);
      throw error;
    }
  }

  /**
   * Delete faction
   * @param {number} id - Faction ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM factions WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting faction:', error);
      throw error;
    }
  }
}

module.exports = Faction;
