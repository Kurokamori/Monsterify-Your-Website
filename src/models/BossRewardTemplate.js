const pool = require('../db');

class BossRewardTemplate {
  /**
   * Get all boss reward templates
   * @returns {Promise<Array>} - Array of templates
   */
  static async getAll() {
    try {
      const query = `
        SELECT * FROM boss_reward_templates
        ORDER BY name ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting boss reward templates:', error);
      return [];
    }
  }

  /**
   * Get a boss reward template by ID
   * @param {number} templateId - Template ID
   * @returns {Promise<Object|null>} - Template or null if not found
   */
  static async getById(templateId) {
    try {
      const query = `
        SELECT * FROM boss_reward_templates
        WHERE template_id = $1
      `;
      
      const result = await pool.query(query, [templateId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting boss reward template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Create a new boss reward template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object|null>} - Created template or null if error
   */
  static async create(templateData) {
    try {
      const query = `
        INSERT INTO boss_reward_templates (
          name, description, coins, levels, items, monsters, is_top_damager
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        templateData.name,
        templateData.description || '',
        templateData.coins || 0,
        templateData.levels || 0,
        JSON.stringify(templateData.items || { items: [] }),
        JSON.stringify(templateData.monsters || { monsters: [] }),
        templateData.is_top_damager || false
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating boss reward template:', error);
      return null;
    }
  }

  /**
   * Update a boss reward template
   * @param {number} templateId - Template ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object|null>} - Updated template or null if error
   */
  static async update(templateId, templateData) {
    try {
      const query = `
        UPDATE boss_reward_templates
        SET
          name = $1,
          description = $2,
          coins = $3,
          levels = $4,
          items = $5,
          monsters = $6,
          is_top_damager = $7
        WHERE template_id = $8
        RETURNING *
      `;
      
      const values = [
        templateData.name,
        templateData.description || '',
        templateData.coins || 0,
        templateData.levels || 0,
        JSON.stringify(templateData.items || { items: [] }),
        JSON.stringify(templateData.monsters || { monsters: [] }),
        templateData.is_top_damager || false,
        templateId
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating boss reward template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Delete a boss reward template
   * @param {number} templateId - Template ID
   * @returns {Promise<boolean>} - True if deleted, false if error
   */
  static async delete(templateId) {
    try {
      const query = `
        DELETE FROM boss_reward_templates
        WHERE template_id = $1
        RETURNING template_id
      `;
      
      const result = await pool.query(query, [templateId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting boss reward template ${templateId}:`, error);
      return false;
    }
  }

  /**
   * Get templates assigned to a boss
   * @param {number} bossId - Boss ID
   * @returns {Promise<Array>} - Array of assigned templates
   */
  static async getAssignedTemplates(bossId) {
    try {
      const query = `
        SELECT t.*
        FROM boss_reward_templates t
        JOIN boss_template_assignments a ON t.template_id = a.template_id
        WHERE a.boss_id = $1
        ORDER BY t.name ASC
      `;
      
      const result = await pool.query(query, [bossId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting assigned templates for boss ${bossId}:`, error);
      return [];
    }
  }

  /**
   * Get templates not assigned to a boss
   * @param {number} bossId - Boss ID
   * @returns {Promise<Array>} - Array of available templates
   */
  static async getAvailableTemplates(bossId) {
    try {
      const query = `
        SELECT *
        FROM boss_reward_templates
        WHERE template_id NOT IN (
          SELECT template_id
          FROM boss_template_assignments
          WHERE boss_id = $1
        )
        ORDER BY name ASC
      `;
      
      const result = await pool.query(query, [bossId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting available templates for boss ${bossId}:`, error);
      return [];
    }
  }

  /**
   * Assign a template to a boss
   * @param {number} bossId - Boss ID
   * @param {number} templateId - Template ID
   * @returns {Promise<boolean>} - True if assigned, false if error
   */
  static async assignToBoss(bossId, templateId) {
    try {
      // Check if already assigned
      const checkQuery = `
        SELECT * FROM boss_template_assignments
        WHERE boss_id = $1 AND template_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [bossId, templateId]);
      
      if (checkResult.rows.length > 0) {
        // Already assigned
        return true;
      }
      
      // Assign template
      const query = `
        INSERT INTO boss_template_assignments (boss_id, template_id)
        VALUES ($1, $2)
        RETURNING assignment_id
      `;
      
      const result = await pool.query(query, [bossId, templateId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error assigning template ${templateId} to boss ${bossId}:`, error);
      return false;
    }
  }

  /**
   * Unassign a template from a boss
   * @param {number} bossId - Boss ID
   * @param {number} templateId - Template ID
   * @returns {Promise<boolean>} - True if unassigned, false if error
   */
  static async unassignFromBoss(bossId, templateId) {
    try {
      const query = `
        DELETE FROM boss_template_assignments
        WHERE boss_id = $1 AND template_id = $2
        RETURNING assignment_id
      `;
      
      const result = await pool.query(query, [bossId, templateId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error unassigning template ${templateId} from boss ${bossId}:`, error);
      return false;
    }
  }
}

module.exports = BossRewardTemplate;
