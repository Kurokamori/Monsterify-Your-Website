import { db } from '../database';

// ============================================================================
// Types
// ============================================================================

export type MonthlyActivationResult = {
  activatedCount: number;
  month: number;
  year: number;
};

export type DeactivationResult = {
  deactivatedCount: number;
  month: number;
  year: number;
};

export type StatisticsUpdateResult = {
  updatedCount: number;
  date: string;
};

export type CleanupResult = {
  oldSubmissionCount: number;
  deletedStatsCount: number;
};

export type WeeklyReport = {
  totalSubmissions: number;
  approvedSubmissions: number;
  activePrompts: number;
  activeTrainers: number;
  period: { start: string; end: string };
};

export type DailyCleanupResult = {
  expiredEventsDeactivated: number;
  statisticsUpdated: number;
  cleanup: CleanupResult;
};

export type WeeklyStatisticsResult = {
  report: WeeklyReport;
  popularityUpdated: number;
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for automated prompt lifecycle management.
 * Handles monthly prompt activation/deactivation, event expiry,
 * statistics tracking, and data cleanup.
 *
 * Note: This service contains only business logic.
 * Cron scheduling is handled by CronService.
 */
export class PromptAutomationService {

  // ==========================================================================
  // Composite Operations (called by CronService)
  // ==========================================================================

  /**
   * Run the monthly activation cycle: activate current month, deactivate previous
   */
  async runMonthlyActivation(): Promise<{
    activated: MonthlyActivationResult;
    deactivated: DeactivationResult;
  }> {
    console.log('Running monthly prompt activation cycle...');
    const activated = await this.activateCurrentMonthPrompts();
    const deactivated = await this.deactivatePreviousMonthPrompts();
    console.log('Monthly prompt activation cycle completed');
    return { activated, deactivated };
  }

  /**
   * Run the daily cleanup cycle: expire events, update stats, clean old data
   */
  async runDailyCleanup(): Promise<DailyCleanupResult> {
    console.log('Running daily prompt cleanup...');
    const expiredEventsDeactivated = await this.deactivateExpiredEvents();
    const statisticsUpdated = await this.updatePromptStatistics();
    const cleanup = await this.cleanupOldData();
    console.log('Daily prompt cleanup completed');
    return { expiredEventsDeactivated, statisticsUpdated, cleanup };
  }

  /**
   * Run the weekly statistics cycle: generate reports, update popularity
   */
  async runWeeklyStatistics(): Promise<WeeklyStatisticsResult> {
    console.log('Running weekly prompt statistics...');
    const report = await this.generateWeeklyReport();
    const popularityUpdated = await this.updatePromptPopularity();
    console.log('Weekly prompt statistics completed');
    return { report, popularityUpdated };
  }

  // ==========================================================================
  // Monthly Prompt Activation
  // ==========================================================================

  /**
   * Activate prompts scheduled for the current month
   */
  async activateCurrentMonthPrompts(): Promise<MonthlyActivationResult> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    console.log(`Activating monthly prompts for ${currentYear}-${String(currentMonth).padStart(2, '0')}`);

    const result = await db.query<{ id: number }>(
      `SELECT id FROM prompts
       WHERE type = 'monthly'
         AND is_active::boolean = true
         AND (active_months IS NULL OR $1 = ANY(active_months))`,
      [currentMonth]
    );

    let activatedCount = 0;

    for (const prompt of result.rows) {
      try {
        await db.query(
          `INSERT INTO monthly_prompt_schedule (prompt_id, year, month, activated_at, is_active)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 1)
           ON CONFLICT (prompt_id, year, month)
           DO UPDATE SET is_active = 1, activated_at = CURRENT_TIMESTAMP`,
          [prompt.id, currentYear, currentMonth]
        );
        activatedCount++;
      } catch (error) {
        console.error(`Error activating prompt ${prompt.id}:`, error);
      }
    }

    console.log(`Activated ${activatedCount} monthly prompts for ${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    return { activatedCount, month: currentMonth, year: currentYear };
  }

  /**
   * Deactivate prompts from the previous month
   */
  async deactivatePreviousMonthPrompts(): Promise<DeactivationResult> {
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    console.log(`Deactivating monthly prompts for ${previousYear}-${String(previousMonth).padStart(2, '0')}`);

    const result = await db.query(
      `UPDATE monthly_prompt_schedule
       SET is_active = 0, deactivated_at = CURRENT_TIMESTAMP
       WHERE year = $1 AND month = $2 AND is_active::boolean = true`,
      [previousYear, previousMonth]
    );

    const deactivatedCount = result.rowCount ?? 0;

    console.log(`Deactivated ${deactivatedCount} monthly prompts from previous month`);
    return { deactivatedCount, month: previousMonth, year: previousYear };
  }

  // ==========================================================================
  // Event Prompt Management
  // ==========================================================================

  /**
   * Deactivate event prompts that have passed their end date
   */
  async deactivateExpiredEvents(): Promise<number> {
    const result = await db.query(
      `UPDATE prompts
       SET is_active = 0
       WHERE type = 'event'
         AND is_active::boolean = true
         AND end_date < CURRENT_DATE`
    );

    const deactivatedCount = result.rowCount ?? 0;

    if (deactivatedCount > 0) {
      console.log(`Deactivated ${deactivatedCount} expired event prompts`);
    }

    return deactivatedCount;
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Update daily statistics for all active prompts
   */
  async updatePromptStatistics(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const activePrompts = await db.query<{ id: number }>(
      `SELECT id FROM prompts WHERE is_active::boolean = true`
    );

    let updatedCount = 0;

    for (const prompt of activePrompts.rows) {
      try {
        const stats = await db.query<{
          submissions_count: string;
          approved_count: string;
          rejected_count: string;
          unique_participants: string;
          average_quality_score: string | null;
        }>(
          `SELECT
             COUNT(*)::text AS submissions_count,
             COUNT(CASE WHEN status = 'approved' THEN 1 END)::text AS approved_count,
             COUNT(CASE WHEN status = 'rejected' THEN 1 END)::text AS rejected_count,
             COUNT(DISTINCT trainer_id)::text AS unique_participants,
             AVG(quality_score)::text AS average_quality_score
           FROM prompt_submissions
           WHERE prompt_id = $1 AND DATE(submitted_at) = $2`,
          [prompt.id, today]
        );

        const row = stats.rows[0];
        if (!row) {
          continue;
        }

        await db.query(
          `INSERT INTO prompt_statistics (
             prompt_id, date, submissions_count, approved_count,
             rejected_count, unique_participants, average_quality_score
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (prompt_id, date)
           DO UPDATE SET
             submissions_count = $3,
             approved_count = $4,
             rejected_count = $5,
             unique_participants = $6,
             average_quality_score = $7`,
          [
            prompt.id,
            today,
            parseInt(row.submissions_count),
            parseInt(row.approved_count),
            parseInt(row.rejected_count),
            parseInt(row.unique_participants),
            row.average_quality_score ? parseFloat(row.average_quality_score) : null,
          ]
        );

        updatedCount++;
      } catch (error) {
        console.error(`Error updating statistics for prompt ${prompt.id}:`, error);
      }
    }

    console.log(`Updated statistics for ${updatedCount} prompts`);
    return updatedCount;
  }

  /**
   * Generate a weekly summary report
   */
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = await db.query<{
      total_submissions: string;
      approved_submissions: string;
      active_prompts: string;
      active_trainers: string;
    }>(
      `SELECT
         COUNT(*)::text AS total_submissions,
         COUNT(CASE WHEN status = 'approved' THEN 1 END)::text AS approved_submissions,
         COUNT(DISTINCT prompt_id)::text AS active_prompts,
         COUNT(DISTINCT trainer_id)::text AS active_trainers
       FROM prompt_submissions
       WHERE submitted_at >= $1`,
      [weekAgo.toISOString()]
    );

    const row = stats.rows[0];

    const report: WeeklyReport = {
      totalSubmissions: row ? parseInt(row.total_submissions) : 0,
      approvedSubmissions: row ? parseInt(row.approved_submissions) : 0,
      activePrompts: row ? parseInt(row.active_prompts) : 0,
      activeTrainers: row ? parseInt(row.active_trainers) : 0,
      period: {
        start: weekAgo.toISOString().split('T')[0] ?? '',
        end: now.toISOString().split('T')[0] ?? '',
      },
    };

    console.log('Weekly Prompt Report:', report);
    return report;
  }

  /**
   * Update prompt popularity/priority based on recent submission activity
   */
  async updatePromptPopularity(): Promise<number> {
    const result = await db.query(
      `UPDATE prompts
       SET priority = CASE
         WHEN recent.submission_count > 10 THEN priority + 1
         WHEN recent.submission_count < 2 THEN GREATEST(priority - 1, 0)
         ELSE priority
       END
       FROM (
         SELECT
           prompt_id,
           COUNT(*) AS submission_count
         FROM prompt_submissions
         WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY prompt_id
       ) recent
       WHERE prompts.id = recent.prompt_id`
    );

    const updatedCount = result.rowCount ?? 0;

    if (updatedCount > 0) {
      console.log(`Updated popularity for ${updatedCount} prompts`);
    }

    return updatedCount;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Clean up old submission data and statistics
   */
  async cleanupOldData(): Promise<CleanupResult> {
    // Count submissions older than 1 year (candidates for archival)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldSubmissions = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM prompt_submissions
       WHERE submitted_at < $1`,
      [oneYearAgo.toISOString()]
    );

    const oldSubmissionCount = oldSubmissions.rows[0]
      ? parseInt(oldSubmissions.rows[0].count)
      : 0;

    if (oldSubmissionCount > 0) {
      console.log(`Found ${oldSubmissionCount} submissions older than 1 year (archival candidate)`);
    }

    // Delete statistics older than 2 years
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const deleteResult = await db.query(
      `DELETE FROM prompt_statistics WHERE date < $1`,
      [twoYearsAgo.toISOString().split('T')[0]]
    );

    const deletedStatsCount = deleteResult.rowCount ?? 0;

    if (deletedStatsCount > 0) {
      console.log(`Cleaned up ${deletedStatsCount} old statistics records`);
    }

    return { oldSubmissionCount, deletedStatsCount };
  }
}
