const pool = require('../db');

class WritingSubmission {
  /**
   * Create a new writing submission
   * @param {Object} submissionData - Submission data
   * @param {string} submissionData.user_id - User ID
   * @param {string} submissionData.title - Title of the writing
   * @param {string} submissionData.writing_url - URL to the writing
   * @param {string} submissionData.writing_type - Type of writing ('game' or 'other')
   * @param {number} submissionData.word_count - Word count
   * @param {number} submissionData.difficulty_modifier - Difficulty modifier (0-3)
   * @param {string} submissionData.notes - Optional notes
   * @param {number} submissionData.total_levels - Total levels awarded
   * @param {number} submissionData.total_coins - Total coins awarded
   * @param {Array} submissionData.participants - Array of participant reward objects
   * @returns {Promise<Object>} - Created submission
   */
  static async create({
    user_id,
    title,
    writing_url,
    writing_type,
    word_count,
    difficulty_modifier,
    notes = '',
    total_levels,
    total_coins,
    participants
  }) {
    try {
      // Start a transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Insert writing submission
        const submissionQuery = `
          INSERT INTO writing_submissions (
            user_id, title, writing_url, writing_type, word_count, 
            difficulty_modifier, notes, total_levels, total_coins, 
            submission_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *
        `;
        
        const submissionValues = [
          user_id,
          title,
          writing_url,
          writing_type,
          word_count,
          difficulty_modifier,
          notes,
          total_levels,
          total_coins
        ];
        
        const submissionResult = await client.query(submissionQuery, submissionValues);
        const submission = submissionResult.rows[0];
        
        // Insert participant rewards
        for (const participant of participants) {
          const participantQuery = `
            INSERT INTO writing_submission_participants (
              submission_id, trainer_id, monster_id, levels_awarded, coins_awarded
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;
          
          const participantValues = [
            submission.id,
            participant.trainerId,
            participant.monsterId || null,
            participant.levels,
            participant.coins
          ];
          
          await client.query(participantQuery, participantValues);
        }
        
        await client.query('COMMIT');
        
        // Return the submission with participants
        submission.participants = participants;
        return submission;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating writing submission:', error);
      throw error;
    }
  }
  
  /**
   * Get a writing submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise<Object|null>} - Submission or null if not found
   */
  static async getById(id) {
    try {
      // Get submission
      const submissionQuery = `
        SELECT * FROM writing_submissions
        WHERE id = $1
      `;
      
      const submissionResult = await pool.query(submissionQuery, [id]);
      
      if (submissionResult.rows.length === 0) {
        return null;
      }
      
      const submission = submissionResult.rows[0];
      
      // Get participants
      const participantsQuery = `
        SELECT 
          wsp.*, 
          t.name AS trainer_name,
          m.name AS monster_name
        FROM writing_submission_participants wsp
        JOIN trainers t ON wsp.trainer_id = t.id
        LEFT JOIN monsters m ON wsp.monster_id = m.id
        WHERE wsp.submission_id = $1
      `;
      
      const participantsResult = await pool.query(participantsQuery, [id]);
      submission.participants = participantsResult.rows.map(row => ({
        trainerId: row.trainer_id,
        trainerName: row.trainer_name,
        monsterId: row.monster_id,
        monsterName: row.monster_name,
        levels: row.levels_awarded,
        coins: row.coins_awarded
      }));
      
      return submission;
    } catch (error) {
      console.error('Error getting writing submission:', error);
      throw error;
    }
  }
  
  /**
   * Get writing submissions by user ID
   * @param {string} userId - User ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Submissions and pagination info
   */
  static async getByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM writing_submissions
        WHERE user_id = $1
      `;
      
      const countResult = await pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);
      
      // Get submissions
      const submissionsQuery = `
        SELECT * FROM writing_submissions
        WHERE user_id = $1
        ORDER BY submission_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const submissionsResult = await pool.query(submissionsQuery, [userId, limit, offset]);
      const submissions = submissionsResult.rows;
      
      // Get participants for each submission
      for (const submission of submissions) {
        const participantsQuery = `
          SELECT 
            wsp.*, 
            t.name AS trainer_name,
            m.name AS monster_name
          FROM writing_submission_participants wsp
          JOIN trainers t ON wsp.trainer_id = t.id
          LEFT JOIN monsters m ON wsp.monster_id = m.id
          WHERE wsp.submission_id = $1
        `;
        
        const participantsResult = await pool.query(participantsQuery, [submission.id]);
        submission.participants = participantsResult.rows.map(row => ({
          trainerId: row.trainer_id,
          trainerName: row.trainer_name,
          monsterId: row.monster_id,
          monsterName: row.monster_name,
          levels: row.levels_awarded,
          coins: row.coins_awarded
        }));
      }
      
      return {
        submissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting user writing submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get writing submissions by trainer ID
   * @param {number} trainerId - Trainer ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Submissions and pagination info
   */
  static async getByTrainerId(trainerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT ws.id) FROM writing_submissions ws
        JOIN writing_submission_participants wsp ON ws.id = wsp.submission_id
        WHERE wsp.trainer_id = $1
      `;
      
      const countResult = await pool.query(countQuery, [trainerId]);
      const total = parseInt(countResult.rows[0].count);
      
      // Get submissions
      const submissionsQuery = `
        SELECT DISTINCT ws.* FROM writing_submissions ws
        JOIN writing_submission_participants wsp ON ws.id = wsp.submission_id
        WHERE wsp.trainer_id = $1
        ORDER BY ws.submission_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const submissionsResult = await pool.query(submissionsQuery, [trainerId, limit, offset]);
      const submissions = submissionsResult.rows;
      
      // Get participants for each submission
      for (const submission of submissions) {
        const participantsQuery = `
          SELECT 
            wsp.*, 
            t.name AS trainer_name,
            m.name AS monster_name
          FROM writing_submission_participants wsp
          JOIN trainers t ON wsp.trainer_id = t.id
          LEFT JOIN monsters m ON wsp.monster_id = m.id
          WHERE wsp.submission_id = $1
        `;
        
        const participantsResult = await pool.query(participantsQuery, [submission.id]);
        submission.participants = participantsResult.rows.map(row => ({
          trainerId: row.trainer_id,
          trainerName: row.trainer_name,
          monsterId: row.monster_id,
          monsterName: row.monster_name,
          levels: row.levels_awarded,
          coins: row.coins_awarded
        }));
      }
      
      return {
        submissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting trainer writing submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get all writing submissions
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Submissions and pagination info
   */
  static async getAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM writing_submissions
      `;
      
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);
      
      // Get submissions
      const submissionsQuery = `
        SELECT 
          ws.*,
          u.username AS user_username,
          u.display_name AS user_display_name
        FROM writing_submissions ws
        JOIN users u ON ws.user_id = u.discord_id
        ORDER BY ws.submission_date DESC
        LIMIT $1 OFFSET $2
      `;
      
      const submissionsResult = await pool.query(submissionsQuery, [limit, offset]);
      const submissions = submissionsResult.rows;
      
      // Get participants for each submission
      for (const submission of submissions) {
        const participantsQuery = `
          SELECT 
            wsp.*, 
            t.name AS trainer_name,
            m.name AS monster_name
          FROM writing_submission_participants wsp
          JOIN trainers t ON wsp.trainer_id = t.id
          LEFT JOIN monsters m ON wsp.monster_id = m.id
          WHERE wsp.submission_id = $1
        `;
        
        const participantsResult = await pool.query(participantsQuery, [submission.id]);
        submission.participants = participantsResult.rows.map(row => ({
          trainerId: row.trainer_id,
          trainerName: row.trainer_name,
          monsterId: row.monster_id,
          monsterName: row.monster_name,
          levels: row.levels_awarded,
          coins: row.coins_awarded
        }));
      }
      
      return {
        submissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting all writing submissions:', error);
      throw error;
    }
  }
}

module.exports = WritingSubmission;
