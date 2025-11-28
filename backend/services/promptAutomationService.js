const db = require('../config/db');
const Prompt = require('../models/Prompt');
const cron = require('node-cron');

class PromptAutomationService {
  constructor() {
    this.scheduledTasks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the automation service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Prompt Automation Service...');
      
      // Schedule monthly prompt activation (1st of each month at 00:01)
      this.scheduleMonthlyActivation();
      
      // Schedule daily cleanup tasks (every day at 02:00)
      this.scheduleDailyCleanup();
      
      // Schedule weekly statistics update (every Sunday at 03:00)
      this.scheduleWeeklyStatistics();
      
      // Run initial activation for current month
      await this.activateCurrentMonthPrompts();
      
      this.isInitialized = true;
      console.log('Prompt Automation Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Prompt Automation Service:', error);
      throw error;
    }
  }

  /**
   * Schedule monthly prompt activation
   */
  scheduleMonthlyActivation() {
    // Run on the 1st of every month at 00:01
    const task = cron.schedule('1 0 1 * *', async () => {
      console.log('Running monthly prompt activation...');
      try {
        await this.activateCurrentMonthPrompts();
        await this.deactivatePreviousMonthPrompts();
        console.log('Monthly prompt activation completed');
      } catch (error) {
        console.error('Error in monthly prompt activation:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledTasks.set('monthlyActivation', task);
  }

  /**
   * Schedule daily cleanup tasks
   */
  scheduleDailyCleanup() {
    // Run every day at 02:00
    const task = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily prompt cleanup...');
      try {
        await this.deactivateExpiredEvents();
        await this.updatePromptStatistics();
        await this.cleanupOldSubmissions();
        console.log('Daily prompt cleanup completed');
      } catch (error) {
        console.error('Error in daily prompt cleanup:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledTasks.set('dailyCleanup', task);
  }

  /**
   * Schedule weekly statistics update
   */
  scheduleWeeklyStatistics() {
    // Run every Sunday at 03:00
    const task = cron.schedule('0 3 * * 0', async () => {
      console.log('Running weekly prompt statistics update...');
      try {
        await this.generateWeeklyReports();
        await this.updatePromptPopularity();
        console.log('Weekly statistics update completed');
      } catch (error) {
        console.error('Error in weekly statistics update:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledTasks.set('weeklyStatistics', task);
  }

  /**
   * Activate prompts for current month
   */
  async activateCurrentMonthPrompts() {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      console.log(`Activating monthly prompts for ${currentYear}-${currentMonth.toString().padStart(2, '0')}`);

      // Get monthly prompts that should be active this month
      const query = `
        SELECT * FROM prompts 
        WHERE type = 'monthly' 
        AND is_active = true
        AND (active_months IS NULL OR active_months LIKE '%' || $1 || '%')
      `;
      
      const prompts = await db.asyncAll(query, [currentMonth.toString()]);

      let activatedCount = 0;
      for (const prompt of prompts) {
        try {
          // Insert into monthly schedule if not already there
          await db.asyncRun(`
            INSERT INTO monthly_prompt_schedule (prompt_id, year, month, activated_at, is_active)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
            ON CONFLICT (prompt_id, year, month) 
            DO UPDATE SET 
              is_active = true,
              activated_at = CURRENT_TIMESTAMP
          `, [prompt.id, currentYear, currentMonth]);

          activatedCount++;
        } catch (error) {
          console.error(`Error activating prompt ${prompt.id}:`, error);
        }
      }

      console.log(`Activated ${activatedCount} monthly prompts for ${currentYear}-${currentMonth.toString().padStart(2, '0')}`);
      return activatedCount;
    } catch (error) {
      console.error('Error activating current month prompts:', error);
      throw error;
    }
  }

  /**
   * Deactivate prompts from previous month
   */
  async deactivatePreviousMonthPrompts() {
    try {
      const now = new Date();
      const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      console.log(`Deactivating monthly prompts for ${previousYear}-${previousMonth.toString().padStart(2, '0')}`);

      const query = `
        UPDATE monthly_prompt_schedule 
        SET is_active = false, deactivated_at = CURRENT_TIMESTAMP
        WHERE year = $1 AND month = $2 AND is_active = true
      `;
      
      const result = await db.asyncRun(query, [previousYear, previousMonth]);
      const deactivatedCount = result.changes || 0;

      console.log(`Deactivated ${deactivatedCount} monthly prompts from previous month`);
      return deactivatedCount;
    } catch (error) {
      console.error('Error deactivating previous month prompts:', error);
      throw error;
    }
  }

  /**
   * Deactivate expired event prompts
   */
  async deactivateExpiredEvents() {
    try {
      const query = `
        UPDATE prompts 
        SET is_active = false 
        WHERE type = 'event' 
        AND is_active = true 
        AND end_date < CURRENT_DATE
      `;
      
      const result = await db.asyncRun(query);
      const deactivatedCount = result.changes || 0;

      if (deactivatedCount > 0) {
        console.log(`Deactivated ${deactivatedCount} expired event prompts`);
      }

      return deactivatedCount;
    } catch (error) {
      console.error('Error deactivating expired events:', error);
      throw error;
    }
  }

  /**
   * Update daily prompt statistics
   */
  async updatePromptStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all active prompts
      const prompts = await db.asyncAll(`
        SELECT id FROM prompts WHERE is_active = true
      `);

      let updatedCount = 0;
      for (const prompt of prompts) {
        try {
          // Calculate daily statistics
          const stats = await db.asyncGet(`
            SELECT 
              COUNT(*) as submissions_count,
              COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
              COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
              COUNT(DISTINCT trainer_id) as unique_participants,
              AVG(quality_score) as average_quality_score
            FROM prompt_submissions
            WHERE prompt_id = $1 AND DATE(submitted_at) = $2
          `, [prompt.id, today]);

          // Insert or update statistics
          await db.asyncRun(`
            INSERT INTO prompt_statistics (
              prompt_id, date, submissions_count, approved_count, 
              rejected_count, unique_participants, average_quality_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (prompt_id, date) 
            DO UPDATE SET 
              submissions_count = $3,
              approved_count = $4,
              rejected_count = $5,
              unique_participants = $6,
              average_quality_score = $7
          `, [
            prompt.id, today, stats.submissions_count, stats.approved_count,
            stats.rejected_count, stats.unique_participants, stats.average_quality_score
          ]);

          updatedCount++;
        } catch (error) {
          console.error(`Error updating statistics for prompt ${prompt.id}:`, error);
        }
      }

      console.log(`Updated statistics for ${updatedCount} prompts`);
      return updatedCount;
    } catch (error) {
      console.error('Error updating prompt statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old submissions and data
   */
  async cleanupOldSubmissions() {
    try {
      // Archive submissions older than 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // You might want to archive rather than delete
      // For now, we'll just log what would be cleaned up
      const oldSubmissions = await db.asyncGet(`
        SELECT COUNT(*) as count 
        FROM prompt_submissions 
        WHERE submitted_at < $1
      `, [oneYearAgo.toISOString()]);

      console.log(`Found ${oldSubmissions.count} submissions older than 1 year (archival candidate)`);

      // Clean up old statistics (keep only last 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = await db.asyncRun(`
        DELETE FROM prompt_statistics 
        WHERE date < $1
      `, [twoYearsAgo.toISOString().split('T')[0]]);

      const deletedStats = result.changes || 0;
      if (deletedStats > 0) {
        console.log(`Cleaned up ${deletedStats} old statistics records`);
      }

      return { oldSubmissions: oldSubmissions.count, deletedStats };
    } catch (error) {
      console.error('Error cleaning up old submissions:', error);
      throw error;
    }
  }

  /**
   * Generate weekly reports
   */
  async generateWeeklyReports() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get weekly submission summary
      const weeklyStats = await db.asyncGet(`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(DISTINCT prompt_id) as active_prompts,
          COUNT(DISTINCT trainer_id) as active_trainers
        FROM prompt_submissions
        WHERE submitted_at >= $1
      `, [weekAgo.toISOString()]);

      console.log('Weekly Prompt Report:', {
        period: `${weekAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
        ...weeklyStats
      });

      // Store weekly report (you might want to save this to a reports table)
      return weeklyStats;
    } catch (error) {
      console.error('Error generating weekly reports:', error);
      throw error;
    }
  }

  /**
   * Update prompt popularity metrics
   */
  async updatePromptPopularity() {
    try {
      // Update prompt priority based on recent activity
      const popularityQuery = `
        UPDATE prompts 
        SET priority = CASE 
          WHEN recent_submissions.submission_count > 10 THEN priority + 1
          WHEN recent_submissions.submission_count < 2 THEN GREATEST(priority - 1, 0)
          ELSE priority
        END
        FROM (
          SELECT 
            prompt_id,
            COUNT(*) as submission_count
          FROM prompt_submissions
          WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY prompt_id
        ) recent_submissions
        WHERE prompts.id = recent_submissions.prompt_id
      `;

      const result = await db.asyncRun(popularityQuery);
      const updatedCount = result.changes || 0;

      if (updatedCount > 0) {
        console.log(`Updated popularity for ${updatedCount} prompts`);
      }

      return updatedCount;
    } catch (error) {
      console.error('Error updating prompt popularity:', error);
      throw error;
    }
  }

  /**
   * Manually trigger monthly activation (for testing or manual runs)
   */
  async manualMonthlyActivation() {
    console.log('Manual monthly prompt activation triggered');
    await this.activateCurrentMonthPrompts();
    await this.deactivatePreviousMonthPrompts();
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks() {
    console.log('Stopping all prompt automation tasks...');
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    this.scheduledTasks.clear();
    this.isInitialized = false;
  }

  /**
   * Get status of all scheduled tasks
   */
  getTaskStatus() {
    const status = {};
    this.scheduledTasks.forEach((task, name) => {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled
      };
    });
    return {
      initialized: this.isInitialized,
      tasks: status
    };
  }
}

// Create singleton instance
const promptAutomationService = new PromptAutomationService();

module.exports = promptAutomationService;
