const db = require('../config/db');

/**
 * AntiqueRollSetting model
 */
class AntiqueRollSetting {
  /**
   * Get all antique roll settings
   * @returns {Promise<Array>} Array of antique roll settings
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM antique_roll_settings ORDER BY item_name ASC';
      const settings = await db.asyncAll(query);

      // Parse JSON fields
      return settings.map(setting => {
        const parsedSetting = { ...setting };
        
        if (parsedSetting.allowed_types) {
          try {
            parsedSetting.allowed_types = JSON.parse(parsedSetting.allowed_types);
          } catch (e) {
            parsedSetting.allowed_types = [];
          }
        }
        
        if (parsedSetting.allowed_attributes) {
          try {
            parsedSetting.allowed_attributes = JSON.parse(parsedSetting.allowed_attributes);
          } catch (e) {
            parsedSetting.allowed_attributes = [];
          }
        }
        
        if (parsedSetting.allowed_species) {
          try {
            parsedSetting.allowed_species = JSON.parse(parsedSetting.allowed_species);
          } catch (e) {
            parsedSetting.allowed_species = [];
          }
        }
        
        return parsedSetting;
      });
    } catch (error) {
      console.error('Error getting antique roll settings:', error);
      throw error;
    }
  }

  /**
   * Get antique roll setting by item name
   * @param {string} itemName - Item name
   * @returns {Promise<Object|null>} Antique roll setting or null if not found
   */
  static async getByItemName(itemName) {
    try {
      const query = 'SELECT * FROM antique_roll_settings WHERE item_name = $1';
      const setting = await db.asyncGet(query, [itemName]);

      if (!setting) {
        return null;
      }

      // Parse JSON fields
      const parsedSetting = { ...setting };
      
      if (parsedSetting.allowed_types) {
        try {
          parsedSetting.allowed_types = JSON.parse(parsedSetting.allowed_types);
        } catch (e) {
          parsedSetting.allowed_types = [];
        }
      }
      
      if (parsedSetting.allowed_attributes) {
        try {
          parsedSetting.allowed_attributes = JSON.parse(parsedSetting.allowed_attributes);
        } catch (e) {
          parsedSetting.allowed_attributes = [];
        }
      }
      
      if (parsedSetting.allowed_species) {
        try {
          parsedSetting.allowed_species = JSON.parse(parsedSetting.allowed_species);
        } catch (e) {
          parsedSetting.allowed_species = [];
        }
      }
      
      return parsedSetting;
    } catch (error) {
      console.error(`Error getting antique roll setting for item ${itemName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new antique roll setting
   * @param {Object} setting - Antique roll setting data
   * @returns {Promise<Object>} Created antique roll setting
   */
  static async create(setting) {
    try {
      // Prepare JSON fields
      let allowedTypes = null;
      let allowedAttributes = null;
      let allowedSpecies = null;
      
      if (setting.allowed_types && Array.isArray(setting.allowed_types)) {
        allowedTypes = JSON.stringify(setting.allowed_types);
      }
      
      if (setting.allowed_attributes && Array.isArray(setting.allowed_attributes)) {
        allowedAttributes = JSON.stringify(setting.allowed_attributes);
      }
      
      if (setting.allowed_species && Array.isArray(setting.allowed_species)) {
        allowedSpecies = JSON.stringify(setting.allowed_species);
      }
      
      const query = `
        INSERT INTO antique_roll_settings (
          item_name, fusion_forced, min_types, max_types, 
          allowed_types, allowed_attributes, allowed_species, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const params = [
        setting.item_name,
        setting.fusion_forced ? 1 : 0,
        setting.min_types || 1,
        setting.max_types || 5,
        allowedTypes,
        allowedAttributes,
        allowedSpecies,
        setting.description
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...setting };
    } catch (error) {
      console.error('Error creating antique roll setting:', error);
      throw error;
    }
  }

  /**
   * Update an antique roll setting
   * @param {number} id - Antique roll setting ID
   * @param {Object} setting - Antique roll setting data
   * @returns {Promise<Object>} Updated antique roll setting
   */
  static async update(id, setting) {
    try {
      // Prepare JSON fields
      let allowedTypes = null;
      let allowedAttributes = null;
      let allowedSpecies = null;
      
      if (setting.allowed_types && Array.isArray(setting.allowed_types)) {
        allowedTypes = JSON.stringify(setting.allowed_types);
      }
      
      if (setting.allowed_attributes && Array.isArray(setting.allowed_attributes)) {
        allowedAttributes = JSON.stringify(setting.allowed_attributes);
      }
      
      if (setting.allowed_species && Array.isArray(setting.allowed_species)) {
        allowedSpecies = JSON.stringify(setting.allowed_species);
      }
      
      const query = `
        UPDATE antique_roll_settings SET
          item_name = $1, fusion_forced = $2, min_types = $3, max_types = $4,
          allowed_types = $5, allowed_attributes = $6, allowed_species = $7, description = $8
        WHERE id = $9
      `;

      const params = [
        setting.item_name,
        setting.fusion_forced ? 1 : 0,
        setting.min_types || 1,
        setting.max_types || 5,
        allowedTypes,
        allowedAttributes,
        allowedSpecies,
        setting.description,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...setting };
    } catch (error) {
      console.error(`Error updating antique roll setting with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an antique roll setting
   * @param {number} id - Antique roll setting ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM antique_roll_settings WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting antique roll setting with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = AntiqueRollSetting;
