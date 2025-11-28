const db = require('../config/db');

class FactionSubmission {
  /**
   * Create a new faction submission
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(submissionData) {
    try {
      const {
        trainerId,
        factionId,
        submissionId,
        promptId = null,
        trainerStatus, // 'alone' or 'with_others'
        taskSize, // 'small', 'medium', 'large'
        specialBonus = false,
        customScore = null
      } = submissionData;

      // Calculate base score
      let baseScore = 10;
      
      // Add trainer status bonus
      if (trainerStatus === 'alone') {
        baseScore += 10;
      } else if (trainerStatus === 'with_others') {
        baseScore += 20;
      }
      
      // Add task size bonus
      if (taskSize === 'medium') {
        baseScore += 10;
      } else if (taskSize === 'large') {
        baseScore += 20;
      }
      
      // Add special bonus
      if (specialBonus) {
        baseScore += 20;
      }
      
      // Get prompt modifier if applicable
      let promptModifier = 0;
      if (promptId) {
        const prompt = await db.asyncGet(
          'SELECT modifier FROM faction_prompts WHERE id = $1',
          [promptId]
        );
        if (prompt) {
          promptModifier = prompt.modifier;
        }
      }
      
      const finalScore = customScore !== null ? customScore : baseScore + promptModifier;

      const query = `
        INSERT INTO faction_submissions (
          trainer_id, faction_id, submission_id, prompt_id,
          trainer_status, task_size, special_bonus,
          base_score, prompt_modifier, final_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id
      `;

      const result = await db.asyncRun(query, [
        trainerId,
        factionId,
        submissionId,
        promptId,
        trainerStatus,
        taskSize,
        specialBonus,
        baseScore,
        promptModifier,
        finalScore
      ]);

      return {
        id: result.rows[0].id,
        trainerId,
        factionId,
        submissionId,
        promptId,
        trainerStatus,
        taskSize,
        specialBonus,
        baseScore,
        promptModifier,
        finalScore
      };
    } catch (error) {
      console.error('Error creating faction submission:', error);
      throw error;
    }
  }

  /**
   * Check if a trainer has already used a submission for faction standing
   * @param {number} trainerId - Trainer ID
   * @param {number} submissionId - Submission ID
   * @returns {Promise<boolean>} True if already used
   */
  static async hasTrainerUsedSubmission(trainerId, submissionId) {
    try {
      const query = `
        SELECT id FROM faction_submissions
        WHERE trainer_id = $1 AND submission_id = $2
      `;
      const result = await db.asyncGet(query, [trainerId, submissionId]);
      return !!result;
    } catch (error) {
      console.error('Error checking if trainer used submission:', error);
      throw error;
    }
  }

  /**
   * Get trainer's faction submissions
   * @param {number} trainerId - Trainer ID
   * @param {number} [factionId] - Optional faction filter
   * @returns {Promise<Array>} Array of submissions
   */
  static async getTrainerSubmissions(trainerId, factionId = null) {
    try {
      let query = `
        SELECT fs.*, f.name as faction_name, f.color as faction_color,
               s.title as submission_title, s.content_type,
               fp.name as prompt_name, fp.prompt_text as prompt_description
        FROM faction_submissions fs
        JOIN factions f ON fs.faction_id = f.id
        JOIN submissions s ON fs.submission_id = s.ids
        LEFT JOIN faction_prompts fp ON fs.prompt_id = fp.id
        WHERE fs.trainer_id = $1
      `;
      
      const params = [trainerId];
      
      if (factionId) {
        query += ' AND fs.faction_id = $2';
        params.push(factionId);
      }
      
      query += ' ORDER BY fs.created_at DESC';
      
      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting trainer submissions:', error);
      throw error;
    }
  }

  /**
   * Get faction submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise<Object|null>} Submission or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT fs.*, f.name as faction_name, f.color as faction_color,
               s.title as submission_title, s.content_type,
               fp.name as prompt_name, fp.prompt_text as prompt_description
        FROM faction_submissions fs
        JOIN factions f ON fs.faction_id = f.id
        JOIN submissions s ON fs.submission_id = s.id
        LEFT JOIN faction_prompts fp ON fs.prompt_id = fp.id
        WHERE fs.id = $1
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting faction submission by ID:', error);
      throw error;
    }
  }

  /**
   * Apply faction standing from submission
   * @param {number} submissionId - Faction submission ID
   * @returns {Promise<Object>} Result
   */
  static async applyStanding(submissionId) {
    try {
      const submission = await this.getById(submissionId);
      if (!submission) {
        throw new Error('Faction submission not found');
      }

      const FactionStanding = require('./FactionStanding');
      
      // Apply standing to the main faction
      await FactionStanding.updateStanding(
        submission.trainer_id,
        submission.faction_id,
        submission.final_score
      );

      // Get faction relationships to apply allied/rival effects
      const relationships = await db.asyncAll(
        `SELECT related_faction_id, standing_modifier 
         FROM faction_relationships 
         WHERE faction_id = $1`,
        [submission.faction_id]
      );

      const appliedFactions = [];
      
      for (const relationship of relationships) {
        const effectAmount = Math.round(submission.final_score * relationship.standing_modifier);
        
        if (effectAmount !== 0) {
          await FactionStanding.updateStanding(
            submission.trainer_id,
            relationship.related_faction_id,
            effectAmount
          );
          
          appliedFactions.push({
            factionId: relationship.related_faction_id,
            standingChange: effectAmount
          });
        }
      }

      return {
        success: true,
        mainFaction: {
          factionId: submission.faction_id,
          standingChange: submission.final_score
        },
        appliedFactions
      };
    } catch (error) {
      console.error('Error applying faction standing:', error);
      throw error;
    }
  }
}

module.exports = FactionSubmission;