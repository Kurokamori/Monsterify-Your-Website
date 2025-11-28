const db = require('../config/db');

class FactionPrompt {
  /**
   * Get all prompts for a faction
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of prompts
   */
  static async getFactionPrompts(factionId) {
    try {
      const query = `
        SELECT * FROM faction_prompts
        WHERE faction_id = $1 AND is_active = 1
        ORDER BY modifier DESC, name ASC
      `;
      return await db.asyncAll(query, [factionId]);
    } catch (error) {
      console.error('Error getting faction prompts:', error);
      throw error;
    }
  }

  /**
   * Get prompt by ID
   * @param {number} id - Prompt ID
   * @returns {Promise<Object|null>} Prompt or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT fp.*, f.name as faction_name
        FROM faction_prompts fp
        JOIN factions f ON fp.faction_id = f.id
        WHERE fp.id = $1
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting prompt by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new faction prompt
   * @param {Object} promptData - Prompt data
   * @returns {Promise<Object>} Created prompt
   */
  static async create(promptData) {
    try {
      const {
        factionId,
        name,
        description,
        modifier = 0,
        isActive = true
      } = promptData;

      const query = `
        INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `;

      const result = await db.asyncRun(query, [
        factionId,
        name,
        description,
        modifier,
        isActive
      ]);

      return {
        id: result.lastID,
        factionId,
        name,
        description,
        modifier,
        isActive
      };
    } catch (error) {
      console.error('Error creating faction prompt:', error);
      throw error;
    }
  }

  /**
   * Update a faction prompt
   * @param {number} id - Prompt ID
   * @param {Object} promptData - Updated prompt data
   * @returns {Promise<Object>} Updated prompt
   */
  static async update(id, promptData) {
    try {
      const {
        name,
        description,
        modifier,
        isActive
      } = promptData;

      const query = `
        UPDATE faction_prompts
        SET name = $1, description = $2, modifier = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `;

      await db.asyncRun(query, [name, description, modifier, isActive, id]);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating faction prompt:', error);
      throw error;
    }
  }

  /**
   * Delete a faction prompt
   * @param {number} id - Prompt ID
   * @returns {Promise<boolean>} Success
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM faction_prompts WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting faction prompt:', error);
      throw error;
    }
  }

  /**
   * Get all prompts with faction information
   * @returns {Promise<Array>} Array of all prompts
   */
  static async getAllWithFactions() {
    try {
      const query = `
        SELECT fp.*, f.name as faction_name, f.color as faction_color
        FROM faction_prompts fp
        JOIN factions f ON fp.faction_id = f.id
        ORDER BY f.name ASC, fp.modifier DESC, fp.name ASC
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all prompts with factions:', error);
      throw error;
    }
  }
}

module.exports = FactionPrompt;