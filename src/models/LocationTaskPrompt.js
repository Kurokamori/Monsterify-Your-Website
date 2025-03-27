const pool = require(\"../db\");

class LocationTaskPrompt {
  /**
   * Get a random task prompt for a specific location
   * @param {string} location - Location identifier
   * @returns {Promise<Object>} - Random task prompt
   */
  static async getRandomForLocation(location) {
    try {
      const query = `
        SELECT * FROM location_task_prompts
        WHERE location = $1
        ORDER BY RANDOM()
        LIMIT 1
      `;
      
      const result = await pool.query(query, [location]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting random task prompt for location ${location}:`, error);
      throw error;
    }
  }

  /**
   * Get all task prompts for a specific location
   * @param {string} location - Location identifier
   * @returns {Promise<Array>} - Array of task prompts
   */
  static async getAllForLocation(location) {
    try {
      const query = `
        SELECT * FROM location_task_prompts
        WHERE location = $1
        ORDER BY difficulty, prompt_id
      `;
      
      const result = await pool.query(query, [location]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting all task prompts for location ${location}:`, error);
      throw error;
    }
  }

  /**
   * Get a task prompt by ID
   * @param {number} promptId - Prompt ID
   * @returns {Promise<Object>} - Task prompt
   */
  static async getById(promptId) {
    try {
      const query = `
        SELECT * FROM location_task_prompts
        WHERE prompt_id = $1
      `;
      
      const result = await pool.query(query, [promptId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting task prompt by ID ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new task prompt
   * @param {Object} promptData - Prompt data
   * @param {string} promptData.location - Location identifier
   * @param {string} promptData.prompt_text - Prompt text
   * @param {string} promptData.difficulty - Difficulty level (easy, normal, hard)
   * @returns {Promise<Object>} - Created task prompt
   */
  static async create({
    location,
    prompt_text,
    difficulty = \"normal\"
  }) {
    try {
      const query = `
        INSERT INTO location_task_prompts (
          location, prompt_text, difficulty
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const values = [
        location, prompt_text, difficulty
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(\"Error creating task prompt:\", error);
      throw error;
    }
  }

  /**
   * Update a task prompt
   * @param {number} promptId - Prompt ID
   * @param {Object} promptData - Updated prompt data
   * @param {string} promptData.location - Location identifier
   * @param {string} promptData.prompt_text - Prompt text
   * @param {string} promptData.difficulty - Difficulty level (easy, normal, hard)
   * @returns {Promise<Object>} - Updated task prompt
   */
  static async update(promptId, {
    location,
    prompt_text,
    difficulty
  }) {
    try {
      // Build the SET clause dynamically based on provided fields
      const updates = [];
      const values = [promptId];
      let valueIndex = 2;
      
      if (location !== undefined) {
        updates.push(`location = $${valueIndex}`);
        values.push(location);
        valueIndex++;
      }
      
      if (prompt_text !== undefined) {
        updates.push(`prompt_text = $${valueIndex}`);
        values.push(prompt_text);
        valueIndex++;
      }
      
      if (difficulty !== undefined) {
        updates.push(`difficulty = $${valueIndex}`);
        values.push(difficulty);
        valueIndex++;
      }
      
      // Add updated_at timestamp
      updates.push(\"updated_at = CURRENT_TIMESTAMP\");
      
      // If no fields to update, return the existing prompt
      if (updates.length === 1) {
        return this.getById(promptId);
      }
      
      const query = `
        UPDATE location_task_prompts
        SET ${updates.join(\", \")}
        WHERE prompt_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating task prompt ${promptId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a task prompt
   * @param {number} promptId - Prompt ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  static async delete(promptId) {
    try {
      const query = `
        DELETE FROM location_task_prompts
        WHERE prompt_id = $1
        RETURNING prompt_id
      `;
      
      const result = await pool.query(query, [promptId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting task prompt ${promptId}:`, error);
      throw error;
    }
  }
}

module.exports = LocationTaskPrompt;
