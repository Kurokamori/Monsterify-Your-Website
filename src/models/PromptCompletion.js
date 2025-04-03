const pool = require('../db');

class PromptCompletion {
  /**
   * Get all completions
   * @returns {Promise<Array>} Array of completions
   */
  static async getAll() {
    try {
      const query = `
        SELECT pc.*, pt.title, pt.category, t.name as trainer_name
        FROM prompt_completions pc
        JOIN prompt_templates pt ON pc.prompt_id = pt.prompt_id
        JOIN trainers t ON pc.trainer_id = t.id
        ORDER BY pc.completed_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all prompt completions:', error);
      throw error;
    }
  }

  /**
   * Get a completion by ID
   * @param {number} completionId - The completion ID
   * @returns {Promise<Object>} Completion object
   */
  static async getById(completionId) {
    try {
      const query = `
        SELECT pc.*, pt.title, pt.category, t.name as trainer_name
        FROM prompt_completions pc
        JOIN prompt_templates pt ON pc.prompt_id = pt.prompt_id
        JOIN trainers t ON pc.trainer_id = t.id
        WHERE pc.completion_id = $1
      `;
      const result = await pool.query(query, [completionId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting completion ${completionId}:`, error);
      throw error;
    }
  }

  /**
   * Get completions by trainer ID
   * @param {number} trainerId - The trainer ID
   * @returns {Promise<Array>} Array of completions
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT pc.*, pt.title, pt.category, pt.description
        FROM prompt_completions pc
        JOIN prompt_templates pt ON pc.prompt_id = pt.prompt_id
        WHERE pc.trainer_id = $1
        ORDER BY pc.completed_at DESC
      `;
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting completions for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get completions by prompt ID
   * @param {number} promptId - The prompt ID
   * @returns {Promise<Array>} Array of completions
   */
  static async getByPromptId(promptId) {
    try {
      const query = `
        SELECT pc.*, t.name as trainer_name
        FROM prompt_completions pc
        JOIN trainers t ON pc.trainer_id = t.id
        WHERE pc.prompt_id = $1
        ORDER BY pc.completed_at DESC
      `;
      const result = await pool.query(query, [promptId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting completions for prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a trainer has completed a prompt
   * @param {number} trainerId - The trainer ID
   * @param {number} promptId - The prompt ID
   * @returns {Promise<boolean>} Whether the trainer has completed the prompt
   */
  static async hasCompleted(trainerId, promptId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM prompt_completions
        WHERE trainer_id = $1 AND prompt_id = $2
      `;
      const result = await pool.query(query, [trainerId, promptId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`Error checking if trainer ${trainerId} has completed prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new completion
   * @param {Object} completionData - The completion data
   * @returns {Promise<Object>} Created completion
   */
  static async create(completionData) {
    try {
      const {
        prompt_id,
        trainer_id,
        submission_url,
        rewards_claimed = true
      } = completionData;

      // Check if this is a non-repeatable prompt that the trainer has already completed
      const promptQuery = 'SELECT repeatable FROM prompt_templates WHERE prompt_id = $1';
      const promptResult = await pool.query(promptQuery, [prompt_id]);
      
      if (!promptResult.rows[0]) {
        throw new Error(`Prompt with ID ${prompt_id} not found`);
      }
      
      const isRepeatable = promptResult.rows[0].repeatable;
      
      if (!isRepeatable) {
        const hasCompletedQuery = `
          SELECT COUNT(*) as count
          FROM prompt_completions
          WHERE trainer_id = $1 AND prompt_id = $2
        `;
        const hasCompletedResult = await pool.query(hasCompletedQuery, [trainer_id, prompt_id]);
        
        if (parseInt(hasCompletedResult.rows[0].count) > 0) {
          throw new Error(`Trainer ${trainer_id} has already completed non-repeatable prompt ${prompt_id}`);
        }
      }

      const query = `
        INSERT INTO prompt_completions (
          prompt_id, trainer_id, submission_url, rewards_claimed
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        prompt_id,
        trainer_id,
        submission_url,
        rewards_claimed
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating prompt completion:', error);
      throw error;
    }
  }

  /**
   * Update a completion
   * @param {number} completionId - The completion ID
   * @param {Object} completionData - The completion data to update
   * @returns {Promise<Object>} Updated completion
   */
  static async update(completionId, completionData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(completionData)) {
        if (value !== undefined) {
          columns.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the completion_id as the last parameter
      values.push(completionId);

      const query = `
        UPDATE prompt_completions
        SET ${columns.join(', ')}
        WHERE completion_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating completion ${completionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a completion
   * @param {number} completionId - The completion ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(completionId) {
    try {
      const query = 'DELETE FROM prompt_completions WHERE completion_id = $1 RETURNING completion_id';
      const result = await pool.query(query, [completionId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting completion ${completionId}:`, error);
      throw error;
    }
  }

  /**
   * Create the prompt_completions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      // This is a simplified version - the full schema is in prompt_tables.sql
      const query = `
        CREATE TABLE IF NOT EXISTS prompt_completions (
          completion_id SERIAL PRIMARY KEY,
          prompt_id INTEGER NOT NULL,
          trainer_id INTEGER NOT NULL,
          submission_url TEXT NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          rewards_claimed BOOLEAN DEFAULT TRUE
        );
      `;

      await pool.query(query);
      console.log('Prompt completions table created or already exists');
    } catch (error) {
      console.error('Error creating prompt_completions table:', error);
      throw error;
    }
  }
}

module.exports = PromptCompletion;
