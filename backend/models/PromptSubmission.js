const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');

class PromptSubmission {
  /**
   * Create a new prompt submission
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(submissionData) {
    try {
      const {
        promptId,
        submissionId,
        trainerId,
        status = 'pending',
        submittedAt = null
      } = submissionData;

      let query, result, promptSubmissionId;
      const params = [promptId, submissionId, trainerId, status, submittedAt];

      if (isPostgreSQL) {
        query = `
          INSERT INTO prompt_submissions (prompt_id, submission_id, trainer_id, status, submitted_at, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        result = await db.asyncRun(query, params);
        promptSubmissionId = result.rows[0].id;
      } else {
        query = `
          INSERT INTO prompt_submissions (prompt_id, submission_id, trainer_id, status, submitted_at, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        result = await db.asyncRun(query, params);
        promptSubmissionId = result.lastID;
      }

      // For progress prompts, mark as completed by trainer
      const promptQuery = 'SELECT type FROM prompts WHERE id = $1';
      const prompt = await db.asyncGet(promptQuery, [promptId]);
      
      if (prompt && prompt.type === 'progress') {
        await this.markProgressCompleted(trainerId, promptId, promptSubmissionId);
      }

      return {
        id: promptSubmissionId,
        promptId,
        submissionId,
        trainerId,
        status,
        submittedAt
      };
    } catch (error) {
      console.error('Error creating prompt submission:', error);
      throw error;
    }
  }

  /**
   * Mark a progress prompt as completed by a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} promptId - Prompt ID
   * @param {number} promptSubmissionId - Prompt submission ID
   * @returns {Promise<void>}
   */
  static async markProgressCompleted(trainerId, promptId, promptSubmissionId) {
    try {
      let query, params;

      if (isPostgreSQL) {
        query = `
          INSERT INTO trainer_prompt_submissions (trainer_id, prompt_id, prompt_submission_id, completed_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;
        params = [trainerId, promptId, promptSubmissionId];
      } else {
        query = `
          INSERT INTO trainer_prompt_submissions (trainer_id, prompt_id, prompt_submission_id, completed_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        params = [trainerId, promptId, promptSubmissionId];
      }

      await db.asyncRun(query, params);
    } catch (error) {
      console.error('Error marking progress prompt as completed:', error);
      throw error;
    }
  }

  /**
   * Get prompt submission by ID
   * @param {number} id - Prompt submission ID
   * @returns {Promise<Object|null>} Prompt submission or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT ps.*, 
               p.title as prompt_title, p.type as prompt_type, p.category as prompt_category,
               s.title as submission_title, s.content_type, s.description as submission_description,
               t.name as trainer_name
        FROM prompt_submissions ps
        JOIN prompts p ON ps.prompt_id = p.id
        JOIN submissions s ON ps.submission_id = s.id
        JOIN trainers t ON ps.trainer_id = t.id
        WHERE ps.id = $1
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting prompt submission by ID:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a prompt
   * @param {number} promptId - Prompt ID
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} Array of prompt submissions
   */
  static async getByPromptId(promptId, filters = {}) {
    try {
      let query = `
        SELECT ps.*, 
               p.title as prompt_title, p.type as prompt_type, p.category as prompt_category,
               s.title as submission_title, s.content_type, s.description as submission_description,
               t.name as trainer_name
        FROM prompt_submissions ps
        JOIN prompts p ON ps.prompt_id = p.id
        JOIN submissions s ON ps.submission_id = s.id
        JOIN trainers t ON ps.trainer_id = t.id
        WHERE ps.prompt_id = $1
      `;

      const params = [promptId];

      if (filters.status) {
        params.push(filters.status);
        query += ` AND ps.status = $${params.length}`;
      }

      if (filters.trainerId) {
        params.push(filters.trainerId);
        query += ` AND ps.trainer_id = $${params.length}`;
      }

      query += ' ORDER BY COALESCE(ps.submitted_at, s.created_at) DESC';

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting submissions by prompt ID:', error);
      throw error;
    }
  }

  /**
   * Get all submissions by a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} Array of prompt submissions
   */
  static async getByTrainerId(trainerId, filters = {}) {
    try {
      let query = `
        SELECT ps.*, 
               p.title as prompt_title, p.type as prompt_type, p.category as prompt_category,
               s.title as submission_title, s.content_type, s.description as submission_description,
               t.name as trainer_name
        FROM prompt_submissions ps
        JOIN prompts p ON ps.prompt_id = p.id
        JOIN submissions s ON ps.submission_id = s.id
        JOIN trainers t ON ps.trainer_id = t.id
        WHERE ps.trainer_id = $1
      `;

      const params = [trainerId];

      if (filters.status) {
        params.push(filters.status);
        query += ` AND ps.status = $${params.length}`;
      }

      if (filters.promptType) {
        params.push(filters.promptType);
        query += ` AND p.type = $${params.length}`;
      }

      if (filters.category) {
        params.push(filters.category);
        query += ` AND p.category = $${params.length}`;
      }

      query += ' ORDER BY COALESCE(ps.submitted_at, s.created_at) DESC';

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting submissions by trainer ID:', error);
      throw error;
    }
  }

  /**
   * Update prompt submission status
   * @param {number} id - Prompt submission ID
   * @param {string} status - New status
   * @param {string} reviewedBy - Reviewer info (optional)
   * @returns {Promise<Object>} Updated submission
   */
  static async updateStatus(id, status, reviewedBy = null) {
    try {
      const query = `
        UPDATE prompt_submissions 
        SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;
      
      await db.asyncRun(query, [status, reviewedBy, id]);
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating prompt submission status:', error);
      throw error;
    }
  }

  /**
   * Delete a prompt submission
   * @param {number} id - Prompt submission ID
   * @returns {Promise<boolean>} Success
   */
  static async delete(id) {
    try {
      // First, remove from trainer_prompt_submissions if it's a progress prompt
      const submissionQuery = `
        SELECT ps.trainer_id, ps.prompt_id, p.type 
        FROM prompt_submissions ps 
        JOIN prompts p ON ps.prompt_id = p.id 
        WHERE ps.id = $1
      `;
      const submission = await db.asyncGet(submissionQuery, [id]);

      if (submission && submission.type === 'progress') {
        const deleteProgressQuery = `
          DELETE FROM trainer_prompt_submissions 
          WHERE trainer_id = $1 AND prompt_id = $2 AND prompt_submission_id = $3
        `;
        await db.asyncRun(deleteProgressQuery, [submission.trainer_id, submission.prompt_id, id]);
      }

      // Delete the prompt submission
      const deleteQuery = 'DELETE FROM prompt_submissions WHERE id = $1';
      await db.asyncRun(deleteQuery, [id]);
      
      return true;
    } catch (error) {
      console.error('Error deleting prompt submission:', error);
      throw error;
    }
  }

  /**
   * Get trainer's completed progress prompts
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} Array of completed prompt IDs
   */
  static async getTrainerCompletedPrompts(trainerId) {
    try {
      const query = `
        SELECT tps.prompt_id, tps.completed_at, p.title, p.description
        FROM trainer_prompt_submissions tps
        JOIN prompts p ON tps.prompt_id = p.id
        WHERE tps.trainer_id = $1
        ORDER BY tps.completed_at DESC
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting trainer completed prompts:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a prompt
   * @param {number} promptId - Prompt ID
   * @returns {Promise<Object>} Prompt statistics
   */
  static async getPromptStats(promptId) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
          COUNT(DISTINCT trainer_id) as unique_trainers
        FROM prompt_submissions 
        WHERE prompt_id = $1
      `;
      
      const stats = await db.asyncGet(statsQuery, [promptId]);
      
      const recentSubmissionsQuery = `
        SELECT ps.*, t.name as trainer_name, s.title as submission_title
        FROM prompt_submissions ps
        JOIN trainers t ON ps.trainer_id = t.id
        JOIN submissions s ON ps.submission_id = s.id
        WHERE ps.prompt_id = $1
        ORDER BY COALESCE(ps.submitted_at, s.created_at) DESC
        LIMIT 5
      `;
      
      const recentSubmissions = await db.asyncAll(recentSubmissionsQuery, [promptId]);
      
      return {
        ...stats,
        recent_submissions: recentSubmissions
      };
    } catch (error) {
      console.error('Error getting prompt stats:', error);
      throw error;
    }
  }

  /**
   * Check if a trainer has already submitted to a prompt
   * @param {number} trainerId - Trainer ID  
   * @param {number} promptId - Prompt ID
   * @returns {Promise<boolean>} True if already submitted
   */
  static async hasTrainerSubmitted(trainerId, promptId) {
    try {
      const query = `
        SELECT id FROM prompt_submissions 
        WHERE trainer_id = $1 AND prompt_id = $2
      `;
      const result = await db.asyncGet(query, [trainerId, promptId]);
      return !!result;
    } catch (error) {
      console.error('Error checking if trainer has submitted:', error);
      return false;
    }
  }

  /**
   * Get submission count for trainer in current month (for monthly prompts)
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<number>} Number of monthly submissions this month
   */
  static async getTrainerMonthlySubmissionCount(trainerId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM prompt_submissions ps
        JOIN prompts p ON ps.prompt_id = p.id
        WHERE ps.trainer_id = $1 
          AND p.type = 'monthly'
          AND EXTRACT(YEAR FROM COALESCE(ps.submitted_at, s.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM COALESCE(ps.submitted_at, s.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      
      const result = await db.asyncGet(query, [trainerId]);
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting trainer monthly submission count:', error);
      return 0;
    }
  }
}

module.exports = PromptSubmission;