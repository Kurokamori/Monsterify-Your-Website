const pool = require('../db');

class Prompt {
  /**
   * Get all prompts
   * @returns {Promise<Array>} Array of prompts
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM prompt_templates ORDER BY category, title';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all prompts:', error);
      throw error;
    }
  }

  /**
   * Get a prompt by ID
   * @param {number} promptId - The prompt ID
   * @returns {Promise<Object>} Prompt object
   */
  static async getById(promptId) {
    try {
      const query = 'SELECT * FROM prompt_templates WHERE prompt_id = $1';
      const result = await pool.query(query, [promptId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Get prompts by category
   * @param {string} category - The prompt category
   * @param {boolean} activeOnly - Whether to only return active prompts
   * @returns {Promise<Array>} Array of prompts
   */
  static async getByCategory(category, activeOnly = true) {
    try {
      let query = 'SELECT * FROM prompt_templates WHERE category = $1';
      const params = [category];

      if (activeOnly) {
        query += ' AND active = TRUE';
      }

      // For monthly prompts, only show the current month
      if (category === 'monthly') {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
        query += ' AND month = $2';
        params.push(currentMonth);
      }

      query += ' ORDER BY title';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error getting prompts for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get prompts available for a specific trainer
   * @param {number} trainerId - The trainer ID
   * @param {string} category - The prompt category
   * @returns {Promise<Array>} Array of available prompts
   */
  static async getAvailableForTrainer(trainerId, category) {
    try {
      // Get trainer level
      const trainerQuery = 'SELECT level FROM trainers WHERE id = $1';
      const trainerResult = await pool.query(trainerQuery, [trainerId]);

      if (!trainerResult.rows[0]) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      const trainerLevel = trainerResult.rows[0].level;

      // Get prompts for the category that the trainer meets the level requirement for
      let query = `
        SELECT pt.*
        FROM prompt_templates pt
        WHERE pt.category = $1
        AND pt.min_trainer_level <= $2
        AND pt.active = TRUE
      `;

      const params = [category, trainerLevel];
      let paramIndex = 3; // Start with $3 for the next parameter

      // For monthly prompts, only show the current month
      if (category === 'monthly') {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
        query += ` AND pt.month = $${paramIndex}`;
        params.push(currentMonth);
        paramIndex++; // Increment for the next parameter
      }

      // Exclude non-repeatable prompts that the trainer has already completed
      query += `
        AND (
          pt.repeatable = TRUE
          OR NOT EXISTS (
            SELECT 1 FROM prompt_completions pc
            WHERE pc.prompt_id = pt.prompt_id
            AND pc.trainer_id = $${paramIndex}
          )
        )
      `;
      params.push(trainerId);

      query += ' ORDER BY pt.title';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error getting available prompts for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new prompt
   * @param {Object} promptData - The prompt data
   * @returns {Promise<Object>} Created prompt
   */
  static async create(promptData) {
    try {
      const {
        category,
        title,
        description,
        image_url,
        min_trainer_level,
        month,
        repeatable,
        active,
        reward_coins,
        reward_levels,
        reward_items,
        reward_random_items,
        reward_monster_params
      } = promptData;

      const query = `
        INSERT INTO prompt_templates (
          category, title, description, image_url, min_trainer_level,
          month, repeatable, active, reward_coins, reward_levels,
          reward_items, reward_random_items, reward_monster_params
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        category,
        title,
        description,
        image_url,
        min_trainer_level || 0,
        month,
        repeatable || false,
        active !== undefined ? active : true,
        reward_coins || 0,
        reward_levels || 0,
        reward_items ? JSON.stringify(reward_items) : null,
        reward_random_items ? JSON.stringify(reward_random_items) : null,
        reward_monster_params ? JSON.stringify(reward_monster_params) : null
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }

  /**
   * Update a prompt
   * @param {number} promptId - The prompt ID
   * @param {Object} promptData - The prompt data to update
   * @returns {Promise<Object>} Updated prompt
   */
  static async update(promptId, promptData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(promptData)) {
        if (value !== undefined) {
          // Handle JSON fields
          if (['reward_items', 'reward_random_items', 'reward_monster_params'].includes(key) && value !== null) {
            columns.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            columns.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      }

      // Add updated_at timestamp
      columns.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add the prompt_id as the last parameter
      values.push(promptId);

      const query = `
        UPDATE prompt_templates
        SET ${columns.join(', ')}
        WHERE prompt_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a prompt
   * @param {number} promptId - The prompt ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(promptId) {
    try {
      const query = 'DELETE FROM prompt_templates WHERE prompt_id = $1 RETURNING prompt_id';
      const result = await pool.query(query, [promptId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Create the prompt_templates table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      // This is a simplified version - the full schema is in prompt_tables.sql
      const query = `
        CREATE TABLE IF NOT EXISTS prompt_templates (
          prompt_id SERIAL PRIMARY KEY,
          category VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          min_trainer_level INTEGER DEFAULT 0,
          month VARCHAR(20),
          repeatable BOOLEAN DEFAULT FALSE,
          active BOOLEAN DEFAULT TRUE,
          reward_coins INTEGER DEFAULT 0,
          reward_levels INTEGER DEFAULT 0,
          reward_items JSONB,
          reward_random_items JSONB,
          reward_monster_params JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Prompt templates table created or already exists');
    } catch (error) {
      console.error('Error creating prompt_templates table:', error);
      throw error;
    }
  }
}

module.exports = Prompt;
