const db = require('../config/db');

class FactionPersonMeeting {
  /**
   * Check if trainer has met a person
   * @param {number} trainerId - Trainer ID
   * @param {number} personId - Person ID
   * @returns {Promise<Object|null>} Meeting record or null if not met
   */
  static async hasMet(trainerId, personId) {
    try {
      const query = `
        SELECT * FROM faction_person_meetings
        WHERE trainer_id = $1 AND person_id = $2
      `;
      return await db.asyncGet(query, [trainerId, personId]);
    } catch (error) {
      console.error('Error checking if trainer has met person:', error);
      throw error;
    }
  }

  /**
   * Get all people met by trainer for a faction
   * @param {number} trainerId - Trainer ID
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of met people
   */
  static async getTrainerMetPeople(trainerId, factionId) {
    try {
      const query = `
        SELECT fpm.*, fp.name, fp.alias, fp.images, fp.role
        FROM faction_person_meetings fpm
        JOIN faction_people fp ON fpm.person_id = fp.id
        WHERE fpm.trainer_id = $1 AND fp.faction_id = $2
        ORDER BY fpm.met_at DESC
      `;
      return await db.asyncAll(query, [trainerId, factionId]);
    } catch (error) {
      console.error('Error getting trainer met people:', error);
      throw error;
    }
  }

  /**
   * Meet a person (submit artwork)
   * @param {Object} meetingData - Meeting data
   * @returns {Promise<Object>} Meeting record and standing update
   */
  static async meetPerson(meetingData) {
    try {
      const {
        trainer_id,
        person_id,
        submission_id
      } = meetingData;

      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Get person details for standing calculation
        const person = await db.asyncGet('SELECT * FROM faction_people WHERE id = $1', [person_id]);
        if (!person) {
          throw new Error('Person not found');
        }

        // Get trainer's current standing with the faction
        const FactionStanding = require('./FactionStanding');
        const standing = await FactionStanding.getTrainerFactionStanding(trainer_id, person.faction_id);
        
        // Calculate standing reward (same sign as current standing)
        let standingReward = person.standing_reward;
        if (standing && standing.current_standing < 0) {
          standingReward = -Math.abs(standingReward);
        } else {
          standingReward = Math.abs(standingReward);
        }

        // Create meeting record
        const meetingQuery = `
          INSERT INTO faction_person_meetings (trainer_id, person_id, submission_id, met_at)
          VALUES ($1, $2, $3, datetime('now'))
        `;
        const meetingResult = await db.asyncRun(meetingQuery, [trainer_id, person_id, submission_id]);

        // Update faction standing
        await FactionStanding.updateStanding(trainer_id, person.faction_id, standingReward);

        // Mark submission as used
        await db.asyncRun(
          'UPDATE submissions SET faction_used = 1 WHERE id = $1',
          [submission_id]
        );

        await db.asyncRun('COMMIT');

        // Get the created meeting record
        const meeting = await db.asyncGet(
          'SELECT * FROM faction_person_meetings WHERE id = $1',
          [meetingResult.lastID]
        );

        return {
          meeting,
          standingReward,
          person
        };

      } catch (error) {
        await db.asyncRun('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error meeting person:', error);
      throw error;
    }
  }

  /**
   * Get trainer's available submissions for meeting people (not used for faction submissions, tributes, or meetings)
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} Array of available submissions
   */
  static async getAvailableSubmissionsForMeeting(trainerId) {
    try {
      const query = `
        SELECT s.* FROM submissions s
        WHERE s.trainer_id = $1
        AND s.id NOT IN (
          SELECT fs.submission_id FROM faction_submissions fs
          WHERE fs.trainer_id = $1 AND fs.submission_id IS NOT NULL
        )
        AND s.id NOT IN (
          SELECT ft.submission_id FROM faction_tributes ft
          WHERE ft.trainer_id = $1 AND ft.submission_id IS NOT NULL
        )
        AND s.id NOT IN (
          SELECT fpm.submission_id FROM faction_person_meetings fpm
          WHERE fpm.trainer_id = $1 AND fpm.submission_id IS NOT NULL
        )
        ORDER BY s.created_at DESC
      `;
      
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting available submissions for meeting:', error);
      throw error;
    }
  }

  /**
   * Check if trainer can meet a person (standing requirement)
   * @param {number} trainerId - Trainer ID
   * @param {number} personId - Person ID
   * @returns {Promise<boolean>} Whether trainer can meet the person
   */
  static async canMeet(trainerId, personId) {
    try {
      // Get person and their standing requirement
      const person = await db.asyncGet('SELECT * FROM faction_people WHERE id = $1', [personId]);
      if (!person) {
        return false;
      }

      // Get trainer's standing with the faction
      const FactionStanding = require('./FactionStanding');
      const standing = await FactionStanding.getTrainerFactionStanding(trainerId, person.faction_id);
      
      if (!standing) {
        return false;
      }

      // Check if absolute value of standing meets requirement
      return Math.abs(standing.current_standing) >= Math.abs(person.standing_requirement);
    } catch (error) {
      console.error('Error checking if trainer can meet person:', error);
      throw error;
    }
  }

  /**
   * Delete meeting record
   * @param {number} id - Meeting ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM faction_person_meetings WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }
}

module.exports = FactionPersonMeeting;