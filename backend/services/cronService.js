const cron = require('node-cron');
const scheduledTasksController = require('../controllers/scheduledTasksController');

/**
 * Cron service for automated recurring tasks
 */
class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize all cron jobs
   */
  init() {
    console.log('Initializing cron jobs...');
    
    // Monthly distribution on the 1st of every month at 00:01
    this.scheduleMonthlyDistribution();
    
    console.log('Cron jobs initialized successfully');
  }

  /**
   * Schedule monthly item distribution
   * Runs on the 1st of every month at 00:01 UTC
   */
  scheduleMonthlyDistribution() {
    const job = cron.schedule('1 0 1 * *', async () => {
      console.log('Running automated monthly distribution...');
      try {
        const result = await scheduledTasksController.addMonthlyItems();
        console.log('Automated monthly distribution completed:', result);
      } catch (error) {
        console.error('Error in automated monthly distribution:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.jobs.set('monthlyDistribution', job);
    console.log('Monthly distribution cron job scheduled for 1st of every month at 00:01 UTC');
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    console.log('Stopping all cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });
    return status;
  }

  /**
   * Manually trigger monthly distribution (for testing)
   */
  async triggerMonthlyDistribution() {
    console.log('Manually triggering monthly distribution...');
    try {
      const result = await scheduledTasksController.addMonthlyItems();
      console.log('Manual monthly distribution completed:', result);
      return result;
    } catch (error) {
      console.error('Error in manual monthly distribution:', error);
      throw error;
    }
  }
}

// Create singleton instance
const cronService = new CronService();

module.exports = cronService;
