const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');

class Prompt {
  /**
   * Get all prompts with optional filtering
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} Array of prompts
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT p.*,
               COALESCE(COUNT(ps.id), 0) as submission_count,
               COALESCE(COUNT(CASE WHEN ps.status = 'approved' THEN 1 END), 0) as approved_count,
               COALESCE(COUNT(CASE WHEN ps.status = 'pending' THEN 1 END), 0) as pending_count,
               CASE
                 WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
                 THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
                 WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
                 THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
                 ELSE p.is_active
               END as is_currently_available
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
      `;

      const params = [];
      const conditions = [];

      if (filters.type) {
        conditions.push('p.type = $' + (params.length + 1));
        params.push(filters.type);
      }

      if (filters.activeOnly !== undefined) {
        conditions.push('p.is_active = $' + (params.length + 1));
        params.push(filters.activeOnly);
      }

      if (filters.category) {
        conditions.push('p.category = $' + (params.length + 1));
        params.push(filters.category);
      }

      if (filters.difficulty) {
        conditions.push('p.difficulty = $' + (params.length + 1));
        params.push(filters.difficulty);
      }

      if (filters.availableOnly) {
        conditions.push(`
          CASE
            WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
            THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
            WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
            THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
            ELSE p.is_active
          END = true
        `);
      }

      // Filter by trainer availability if trainerId provided
      if (filters.trainerId && filters.availableOnly) {
        conditions.push(`
          (p.type != 'progress' OR NOT EXISTS (
            SELECT 1 FROM trainer_prompt_progress tpp
            WHERE tpp.trainer_id = $${params.length + 1}
            AND tpp.prompt_id = p.id
            AND tpp.is_completed = true
          ))
        `);
        params.push(filters.trainerId);

        // Check submission limits
        conditions.push(`
          (p.max_submissions_per_trainer IS NULL OR
           (SELECT COUNT(*) FROM prompt_submissions ps2
            WHERE ps2.prompt_id = p.id AND ps2.trainer_id = $${params.length}) < p.max_submissions_per_trainer)
        `);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id ORDER BY p.priority DESC, p.created_at DESC';

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(filters.limit);

        if (filters.page && filters.page > 1) {
          query += ` OFFSET $${params.length + 1}`;
          params.push((filters.page - 1) * filters.limit);
        }
      }

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting all prompts:', error);
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
        SELECT p.*, 
               COALESCE(COUNT(ps.id), 0) as submission_count,
               CASE 
                 WHEN p.type = 'monthly' AND p.active_months IS NOT NULL 
                 THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
                 WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
                 THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
                 ELSE p.is_active
               END as is_currently_available
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
        WHERE p.id = $1
        GROUP BY p.id
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting prompt by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new prompt
   * @param {Object} promptData - Prompt data
   * @returns {Promise<Object>} Created prompt
   */
  static async create(promptData) {
    try {
      const {
        title,
        description,
        type = 'general',
        category = 'general',
        difficulty = 'medium',
        is_active = true,
        priority = 0,
        max_submissions = null,
        requires_approval = true,
        active_months = null,
        start_date = null,
        end_date = null,
        rewards = null,
        requirements = null,
        tags = null
      } = promptData;

      let query, result, promptId;
      
      // Handle empty string dates - convert to null
      const processedStartDate = start_date === '' ? null : start_date;
      const processedEndDate = end_date === '' ? null : end_date;
      
      const params = [
        title,
        description,
        type,
        category,
        difficulty,
        is_active,
        priority,
        max_submissions,
        requires_approval,
        active_months,
        processedStartDate,
        processedEndDate,
        rewards ? JSON.stringify(rewards) : null,
        requirements ? JSON.stringify(requirements) : null,
        tags ? JSON.stringify(tags) : null
      ];

      if (isPostgreSQL) {
        query = `
          INSERT INTO prompts (
            title, description, type, category, difficulty, is_active,
            priority, max_submissions, requires_approval, active_months,
            start_date, end_date, rewards, requirements, tags, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        result = await db.asyncRun(query, params);
        promptId = result.rows[0].id;
      } else {
        query = `
          INSERT INTO prompts (
            title, description, type, category, difficulty, is_active,
            priority, max_submissions, requires_approval, active_months,
            start_date, end_date, rewards, requirements, tags, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        result = await db.asyncRun(query, params);
        promptId = result.lastID;
      }

      // Fetch the created prompt with all calculated fields
      const createdPrompt = await this.getById(promptId);
      return createdPrompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }

  /**
   * Update a prompt
   * @param {number} id - Prompt ID
   * @param {Object} promptData - Updated prompt data
   * @returns {Promise<Object>} Updated prompt
   */
  static async update(id, promptData) {
    try {
      const fields = [];
      const params = [];
      let paramIndex = 1;

      const updateableFields = [
        'title', 'description', 'type', 'category', 'difficulty', 
        'is_active', 'priority', 'max_submissions', 'requires_approval',
        'active_months', 'start_date', 'end_date', 'rewards', 'requirements', 'tags'
      ];

      updateableFields.forEach(field => {
        if (promptData.hasOwnProperty(field)) {
          let value = promptData[field];
          
          // Handle JSON fields
          if (['rewards', 'requirements', 'tags'].includes(field) && value !== null) {
            value = JSON.stringify(value);
          }
          
          // Handle date fields - convert empty strings to null
          if (['start_date', 'end_date'].includes(field) && value === '') {
            value = null;
          }
          
          fields.push(`${field} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const query = `
        UPDATE prompts 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.asyncRun(query, params);
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }

  /**
   * Delete a prompt
   * @param {number} id - Prompt ID
   * @returns {Promise<boolean>} Success
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM prompts WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }

  /**
   * Get monthly prompts for a specific month
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year (optional, defaults to current year)
   * @returns {Promise<Array>} Array of monthly prompts
   */
  static async getMonthlyPrompts(month, year = null) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const query = `
        SELECT p.*, 
               COALESCE(COUNT(ps.id), 0) as submission_count
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
        WHERE p.type = 'monthly' 
          AND p.is_active = true
          AND (p.active_months IS NULL OR p.active_months LIKE '%' || $1 || '%')
        GROUP BY p.id
        ORDER BY p.priority DESC, p.created_at DESC
      `;
      
      return await db.asyncAll(query, [month.toString()]);
    } catch (error) {
      console.error('Error getting monthly prompts:', error);
      throw error;
    }
  }

  /**
   * Get event prompts (active events only)
   * @returns {Promise<Array>} Array of active event prompts
   */
  static async getEventPrompts() {
    try {
      const query = `
        SELECT p.*, 
               COALESCE(COUNT(ps.id), 0) as submission_count
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
        WHERE p.type = 'event' 
          AND p.is_active = true
          AND CURRENT_DATE BETWEEN p.start_date AND p.end_date
        GROUP BY p.id
        ORDER BY p.priority DESC, p.start_date ASC
      `;
      
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting event prompts:', error);
      throw error;
    }
  }

  /**
   * Get progress prompts for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} Array of available progress prompts
   */
  static async getProgressPrompts(trainerId) {
    try {
      const query = `
        SELECT p.*, 
               COALESCE(COUNT(ps.id), 0) as submission_count,
               CASE WHEN tps.prompt_id IS NOT NULL THEN true ELSE false END as completed_by_trainer
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
        LEFT JOIN trainer_prompt_submissions tps ON p.id = tps.prompt_id AND tps.trainer_id = $1
        WHERE p.type = 'progress' 
          AND p.is_active = true
          AND tps.prompt_id IS NULL
        GROUP BY p.id, tps.prompt_id
        ORDER BY p.priority DESC, p.created_at DESC
      `;
      
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting progress prompts:', error);
      throw error;
    }
  }

  /**
   * Check if a trainer can submit to a prompt
   * @param {number} promptId - Prompt ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} Availability status
   */
  static async checkAvailability(promptId, trainerId) {
    try {
      const prompt = await this.getById(promptId);
      if (!prompt) {
        return { available: false, reason: 'Prompt not found' };
      }

      if (!prompt.is_active) {
        return { available: false, reason: 'Prompt is not active' };
      }

      // Check type-specific availability
      if (prompt.type === 'monthly') {
        const currentMonth = new Date().getMonth() + 1;
        if (prompt.active_months && !prompt.active_months.includes(currentMonth.toString())) {
          return { available: false, reason: 'Not available this month' };
        }
      }

      if (prompt.type === 'event') {
        const now = new Date();
        const startDate = new Date(prompt.start_date);
        const endDate = new Date(prompt.end_date);
        
        if (now < startDate || now > endDate) {
          return { available: false, reason: 'Event is not currently active' };
        }
      }

      if (prompt.type === 'progress') {
        // Check if trainer has already completed this prompt
        const completionQuery = `
          SELECT id FROM trainer_prompt_progress
          WHERE prompt_id = $1 AND trainer_id = $2 AND is_completed = true
        `;
        const completion = await db.asyncGet(completionQuery, [promptId, trainerId]);

        if (completion) {
          return { available: false, reason: 'Progress prompt already completed' };
        }
      }

      // Check submission limits
      if (prompt.max_submissions_per_trainer) {
        const submissionQuery = `
          SELECT COUNT(*) as count FROM prompt_submissions
          WHERE prompt_id = $1 AND trainer_id = $2
        `;
        const submissionCount = await db.asyncGet(submissionQuery, [promptId, trainerId]);

        if (submissionCount.count >= prompt.max_submissions_per_trainer) {
          return { available: false, reason: 'Maximum submissions reached for this trainer' };
        }
      }

      // Check trainer level requirements
      if (prompt.min_trainer_level || prompt.max_trainer_level) {
        const trainerQuery = `SELECT level FROM trainers WHERE id = $1`;
        const trainer = await db.asyncGet(trainerQuery, [trainerId]);

        if (!trainer) {
          return { available: false, reason: 'Trainer not found' };
        }

        if (prompt.min_trainer_level && trainer.level < prompt.min_trainer_level) {
          return { available: false, reason: `Trainer level too low (minimum: ${prompt.min_trainer_level})` };
        }

        if (prompt.max_trainer_level && trainer.level > prompt.max_trainer_level) {
          return { available: false, reason: `Trainer level too high (maximum: ${prompt.max_trainer_level})` };
        }
      }

      // Check faction requirements
      if (prompt.required_factions) {
        const factions = typeof prompt.required_factions === 'string'
          ? JSON.parse(prompt.required_factions)
          : prompt.required_factions;

        if (factions && factions.length > 0) {
          const factionQuery = `
            SELECT faction_id FROM faction_standings
            WHERE trainer_id = $1 AND faction_id = ANY($2)
          `;
          const trainerFactions = await db.asyncAll(factionQuery, [trainerId, factions]);

          if (trainerFactions.length === 0) {
            return { available: false, reason: 'Required faction membership not met' };
          }
        }
      }

      return { available: true, reason: 'Prompt is available' };
    } catch (error) {
      console.error('Error checking prompt availability:', error);
      throw error;
    }
  }

  /**
   * Delete a prompt
   * @param {number} id - Prompt ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM prompts WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }

  /**
   * Get prompts by category
   * @param {string} category - Category name
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of prompts
   */
  static async getByCategory(category, filters = {}) {
    try {
      return await this.getAll({ ...filters, category });
    } catch (error) {
      console.error('Error getting prompts by category:', error);
      throw error;
    }
  }

  /**
   * Get prompts by difficulty
   * @param {string} difficulty - Difficulty level
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of prompts
   */
  static async getByDifficulty(difficulty, filters = {}) {
    try {
      return await this.getAll({ ...filters, difficulty });
    } catch (error) {
      console.error('Error getting prompts by difficulty:', error);
      throw error;
    }
  }

  /**
   * Search prompts by title or description
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of prompts
   */
  static async search(searchTerm, filters = {}) {
    try {
      let query = `
        SELECT p.*,
               COALESCE(COUNT(ps.id), 0) as submission_count,
               CASE
                 WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
                 THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
                 WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
                 THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
                 ELSE p.is_active
               END as is_currently_available
        FROM prompts p
        LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
        WHERE (p.title ILIKE $1 OR p.description ILIKE $1)
      `;

      const params = [`%${searchTerm}%`];
      const conditions = [];

      if (filters.type) {
        conditions.push('p.type = $' + (params.length + 1));
        params.push(filters.type);
      }

      if (filters.category) {
        conditions.push('p.category = $' + (params.length + 1));
        params.push(filters.category);
      }

      if (filters.activeOnly) {
        conditions.push('p.is_active = true');
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id ORDER BY p.priority DESC, p.created_at DESC';

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error searching prompts:', error);
      throw error;
    }
  }

  /**
   * Get prompt categories
   * @returns {Promise<Array>} Array of categories
   */
  static async getCategories() {
    try {
      const query = `
        SELECT DISTINCT category, COUNT(*) as prompt_count
        FROM prompts
        WHERE is_active = true
        GROUP BY category
        ORDER BY category
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting prompt categories:', error);
      throw error;
    }
  }

  /**
   * Activate monthly prompts for current month
   * @returns {Promise<Array>} Activated prompts
   */
  static async activateMonthlyPrompts() {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const query = `
        SELECT * FROM prompts
        WHERE type = 'monthly'
        AND is_active = true
        AND (active_months IS NULL OR active_months LIKE '%' || $1 || '%')
      `;

      const prompts = await db.asyncAll(query, [currentMonth.toString()]);

      for (const prompt of prompts) {
        await db.asyncRun(`
          INSERT INTO monthly_prompt_schedule (prompt_id, year, month, activated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (prompt_id, year, month) DO NOTHING
        `, [prompt.id, currentYear, currentMonth]);
      }

      return prompts;
    } catch (error) {
      console.error('Error activating monthly prompts:', error);
      throw error;
    }
  }

  /**
   * Get submission count for a prompt
   * @param {number} promptId - Prompt ID
   * @returns {Promise<number>} Number of submissions
   */
  static async getSubmissionCount(promptId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM prompt_submissions
        WHERE prompt_id = $1
      `;
      const result = await db.asyncGet(query, [promptId]);
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting submission count:', error);
      return 0;
    }
  }
}

module.exports = Prompt;