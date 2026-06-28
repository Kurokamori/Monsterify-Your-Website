import cron, { ScheduledTask } from 'node-cron';
import { ScheduledTasksService, MonthlyDistributionResult } from './scheduled-tasks.service';
import { ReminderService } from './reminder.service';
import {
  PromptAutomationService,
  type DailyCleanupResult,
  type WeeklyStatisticsResult,
} from './prompt-automation.service';
import { ShopService } from './shop.service';
import { HolidayCalculatorService } from './holiday-calculator.service';
import { AdoptionService } from './adoption.service';

export type CronJobStatus = {
  running: boolean;
  scheduled: boolean;
};

export type CronJobsStatus = Record<string, CronJobStatus>;

/**
 * Cron service for automated recurring tasks
 */
export class CronService {
  private jobs: Map<string, ScheduledTask>;
  private scheduledTasksService: ScheduledTasksService;
  private reminderService: ReminderService;
  private promptAutomationService: PromptAutomationService;
  private shopService: ShopService;
  private holidayCalculatorService: HolidayCalculatorService;
  private adoptionService: AdoptionService;

  constructor(
    scheduledTasksService?: ScheduledTasksService,
    reminderService?: ReminderService,
    promptAutomationService?: PromptAutomationService,
    shopService?: ShopService,
    adoptionService?: AdoptionService,
  ) {
    this.jobs = new Map();
    this.scheduledTasksService = scheduledTasksService ?? new ScheduledTasksService();
    this.reminderService = reminderService ?? new ReminderService();
    this.promptAutomationService = promptAutomationService ?? new PromptAutomationService();
    this.shopService = shopService ?? new ShopService();
    this.holidayCalculatorService = new HolidayCalculatorService();
    this.adoptionService = adoptionService ?? new AdoptionService();
  }

  /**
   * Initialize all cron jobs
   */
  init(): void {
    console.log('Initializing cron jobs...');

    // Monthly distribution on the 1st of every month at 00:01
    this.scheduleMonthlyDistribution();

    // Monthly prompt activation on the 1st of every month at 00:01
    this.scheduleMonthlyPromptActivation();

    // Daily prompt cleanup at 02:00 UTC
    this.scheduleDailyPromptCleanup();

    // Weekly prompt statistics every Sunday at 03:00 UTC
    this.scheduleWeeklyPromptStatistics();

    // Reminder processing every minute
    this.scheduleReminderProcessing();

    // Habit streak reset check every hour
    this.scheduleHabitStreakResetCheck();

    // Daily shop restocking at 00:05 UTC
    this.scheduleDailyShopRestock();

    // Yearly holiday date generation on Jan 1st at 00:10 UTC
    this.scheduleYearlyHolidayGeneration();

    // Monthly adoption-center roll on the 1st of every month at 00:02 UTC
    this.scheduleMonthlyAdoptionRoll();

    // Catch-up immediately on startup in case the server was down when the
    // monthly roll was scheduled to fire (e.g. a deploy after the month boundary).
    void this.runAdoptionRollCatchup();

    console.log('Cron jobs initialized successfully');
  }

  /**
   * Schedule monthly item distribution
   * Runs on the 1st of every month at 00:01 UTC
   */
  scheduleMonthlyDistribution(): void {
    const job = cron.schedule(
      '1 0 1 * *',
      async () => {
        console.log('Running automated monthly distribution...');
        try {
          const result = await this.scheduledTasksService.addMonthlyItems('automatic');
          console.log('Automated monthly distribution completed:', result);
        } catch (error) {
          console.error('Error in automated monthly distribution:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('monthlyDistribution', job);
    console.log('Monthly distribution cron job scheduled for 1st of every month at 00:01 UTC');
  }

  /**
   * Schedule reminder processing
   * Runs every minute to check for due reminders
   */
  scheduleReminderProcessing(): void {
    const job = cron.schedule(
      '* * * * *', // Every minute
      async () => {
        try {
          const dueReminders = await this.reminderService.processDueReminders();
          if (dueReminders.length > 0) {
            console.log(`Processed ${dueReminders.length} due reminders`);
          }
        } catch (error) {
          console.error('Error processing reminders:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('reminderProcessing', job);
    console.log('Reminder processing cron job scheduled to run every minute');
  }

  /**
   * Schedule habit streak reset check
   * Runs every hour to check for habits that need streak resets
   */
  scheduleHabitStreakResetCheck(): void {
    const job = cron.schedule(
      '0 * * * *', // Every hour on the hour
      async () => {
        try {
          const resetHabits = await this.reminderService.processHabitStreakResets();
          if (resetHabits.length > 0) {
            console.log(`Reset ${resetHabits.length} habit streaks`);
          }
        } catch (error) {
          console.error('Error processing habit streak resets:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('habitStreakReset', job);
    console.log('Habit streak reset cron job scheduled to run every hour');
  }

  /**
   * Schedule daily shop restocking
   * Runs every day at 00:05 UTC to restock non-constant shops with fresh prices
   */
  scheduleDailyShopRestock(): void {
    const job = cron.schedule(
      '5 0 * * *',
      async () => {
        console.log('Running daily shop restock...');
        try {
          const result = await this.shopService.restockAllShops();
          console.log(`Daily shop restock completed: ${result.shopsRestocked} shops, ${result.totalItems} items`);
        } catch (error) {
          console.error('Error in daily shop restock:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('dailyShopRestock', job);
    console.log('Daily shop restock cron job scheduled for 00:05 UTC daily');
  }

  /**
   * Schedule monthly prompt activation
   * Runs on the 1st of every month at 00:01 UTC
   */
  scheduleMonthlyPromptActivation(): void {
    const job = cron.schedule(
      '1 0 1 * *',
      async () => {
        console.log('Running monthly prompt activation...');
        try {
          const result = await this.promptAutomationService.runMonthlyActivation();
          console.log('Monthly prompt activation completed:', result);
        } catch (error) {
          console.error('Error in monthly prompt activation:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('monthlyPromptActivation', job);
    console.log('Monthly prompt activation cron job scheduled for 1st of every month at 00:01 UTC');
  }

  /**
   * Schedule daily prompt cleanup
   * Runs every day at 02:00 UTC
   */
  scheduleDailyPromptCleanup(): void {
    const job = cron.schedule(
      '0 2 * * *',
      async () => {
        console.log('Running daily prompt cleanup...');
        try {
          const result = await this.promptAutomationService.runDailyCleanup();
          console.log('Daily prompt cleanup completed:', result);
        } catch (error) {
          console.error('Error in daily prompt cleanup:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('dailyPromptCleanup', job);
    console.log('Daily prompt cleanup cron job scheduled for 02:00 UTC daily');
  }

  /**
   * Schedule weekly prompt statistics
   * Runs every Sunday at 03:00 UTC
   */
  scheduleWeeklyPromptStatistics(): void {
    const job = cron.schedule(
      '0 3 * * 0',
      async () => {
        console.log('Running weekly prompt statistics...');
        try {
          const result = await this.promptAutomationService.runWeeklyStatistics();
          console.log('Weekly prompt statistics completed:', result);
        } catch (error) {
          console.error('Error in weekly prompt statistics:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('weeklyPromptStatistics', job);
    console.log('Weekly prompt statistics cron job scheduled for Sunday at 03:00 UTC');
  }

  /**
   * Manually trigger prompt daily cleanup (for testing)
   */
  async triggerPromptDailyCleanup(): Promise<DailyCleanupResult> {
    console.log('Manually triggering prompt daily cleanup...');
    const result = await this.promptAutomationService.runDailyCleanup();
    console.log('Manual prompt daily cleanup completed:', result);
    return result;
  }

  /**
   * Manually trigger prompt weekly statistics (for testing)
   */
  async triggerPromptWeeklyStatistics(): Promise<WeeklyStatisticsResult> {
    console.log('Manually triggering prompt weekly statistics...');
    const result = await this.promptAutomationService.runWeeklyStatistics();
    console.log('Manual prompt weekly statistics completed:', result);
    return result;
  }

  /**
   * Schedule yearly holiday date generation
   * Runs on January 1st at 00:10 UTC to generate holiday dates for the new year
   */
  scheduleYearlyHolidayGeneration(): void {
    const job = cron.schedule(
      '10 0 1 1 *',
      async () => {
        const year = new Date().getFullYear();
        console.log(`Running yearly holiday date generation for ${year}...`);
        try {
          const result = await this.holidayCalculatorService.generateHolidayDates(year);
          console.log(`Holiday date generation completed: ${result.generated} holidays generated for ${year}`);
        } catch (error) {
          console.error('Error in yearly holiday date generation:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('yearlyHolidayGeneration', job);
    console.log('Yearly holiday generation cron job scheduled for Jan 1st at 00:10 UTC');
  }

  /**
   * Schedule the monthly adoption-center roll
   * Runs on the 1st of every month at 00:02 UTC, generating that month's adopts
   * proactively so the roll never depends on whoever views the page first.
   */
  scheduleMonthlyAdoptionRoll(): void {
    const job = cron.schedule(
      '2 0 1 * *',
      async () => {
        console.log('Running monthly adoption roll...');
        try {
          await this.adoptionService.ensureCurrentMonthAdopts();
          console.log('Monthly adoption roll completed');
        } catch (error) {
          console.error('Error in monthly adoption roll:', error);
        }
      },
      {
        timezone: 'UTC',
      }
    );

    this.jobs.set('monthlyAdoptionRoll', job);
    console.log('Monthly adoption roll cron job scheduled for 1st of every month at 00:02 UTC');
  }

  /**
   * Generate the current month's adopts immediately if they are missing.
   * Used as a startup safety net so a missed scheduled roll (server downtime at
   * the month boundary) is recovered without waiting for a page view.
   */
  async runAdoptionRollCatchup(): Promise<void> {
    try {
      await this.adoptionService.ensureCurrentMonthAdopts();
    } catch (error) {
      console.error('Error in adoption roll startup catch-up:', error);
    }
  }

  /**
   * Manually trigger the monthly adoption roll (for testing)
   */
  async triggerMonthlyAdoptionRoll(): Promise<void> {
    console.log('Manually triggering monthly adoption roll...');
    try {
      await this.adoptionService.ensureCurrentMonthAdopts();
      console.log('Manual monthly adoption roll completed');
    } catch (error) {
      console.error('Error in manual monthly adoption roll:', error);
      throw error;
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll(): void {
    console.log('Stopping all cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Stop a specific cron job
   * @param jobName - Name of the job to stop
   */
  stopJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      console.log(`Stopped cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific cron job
   * @param jobName - Name of the job to start
   */
  startJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      console.log(`Started cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Get status of all cron jobs
   * @returns Status of all jobs
   */
  getStatus(): CronJobsStatus {
    const status: CronJobsStatus = {};
    this.jobs.forEach((_job, name) => {
      // Note: node-cron doesn't expose running/scheduled properties directly
      // We track this based on the job existing in our map
      status[name] = {
        running: true,
        scheduled: true,
      };
    });
    return status;
  }

  /**
   * Get list of all registered job names
   * @returns Array of job names
   */
  getJobNames(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * Check if a specific job exists
   * @param jobName - Name of the job
   * @returns Whether the job exists
   */
  hasJob(jobName: string): boolean {
    return this.jobs.has(jobName);
  }

  /**
   * Manually trigger monthly distribution (for testing)
   * @returns Result of the distribution
   */
  async triggerMonthlyDistribution(): Promise<MonthlyDistributionResult> {
    console.log('Manually triggering monthly distribution...');
    try {
      const result = await this.scheduledTasksService.addMonthlyItems('manual');
      console.log('Manual monthly distribution completed:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in manual monthly distribution:', error);
      return {
        success: false,
        message: 'Error in manual monthly distribution',
        error: errorMessage,
      };
    }
  }

  /**
   * Manually trigger reminder processing (for testing)
   */
  async triggerReminderProcessing(): Promise<void> {
    console.log('Manually triggering reminder processing...');
    try {
      await this.reminderService.scheduleProcessing();
      console.log('Manual reminder processing completed');
    } catch (error) {
      console.error('Error in manual reminder processing:', error);
      throw error;
    }
  }

  /**
   * Manually trigger habit streak reset check (for testing)
   */
  async triggerHabitStreakResetCheck(): Promise<void> {
    console.log('Manually triggering habit streak reset check...');
    try {
      const resetHabits = await this.reminderService.processHabitStreakResets();
      console.log(`Manual habit streak reset check completed. Reset ${resetHabits.length} habits.`);
    } catch (error) {
      console.error('Error in manual habit streak reset check:', error);
      throw error;
    }
  }
}
