import { TrainerInventoryRepository, InventoryCategory } from '../repositories';
import { MonthlyDistributionRepository } from '../repositories';
import type { DistributionRun } from '../repositories';
import { db } from '../database';

export type MonthlyDistributionResult = {
  success: boolean;
  message: string;
  results?: {
    totalTrainers: number;
    successCount: number;
    failCount: number;
    errors: Array<{ trainerId: number; error: string }>;
  };
  error?: string;
};

export type MonthlyTasksResult = {
  success: boolean;
  message: string;
  results?: {
    items: MonthlyDistributionResult;
  };
  error?: string;
};

export type MonthlyItem = {
  name: string;
  category: InventoryCategory;
  quantity: number;
};

// Default items seeded if the DB table is empty
const DEFAULT_MONTHLY_ITEMS: MonthlyItem[] = [
  { name: 'Legacy Leeway', category: 'items', quantity: 1 },
  { name: 'Daycare Daypass', category: 'items', quantity: 1 },
  { name: 'Mission Mandate', category: 'keyitems', quantity: 1 },
];

/**
 * Service for handling scheduled/automated tasks
 */
export class ScheduledTasksService {
  private inventoryRepository: TrainerInventoryRepository;
  private distributionRepository: MonthlyDistributionRepository;

  constructor(
    inventoryRepository?: TrainerInventoryRepository,
    distributionRepository?: MonthlyDistributionRepository
  ) {
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.distributionRepository = distributionRepository ?? new MonthlyDistributionRepository();
  }

  /**
   * Get the list of monthly items from the database.
   * Seeds defaults if the table is empty.
   */
  async getMonthlyItems(): Promise<MonthlyItem[]> {
    let items = await this.distributionRepository.getItems();
    if (items.length === 0) {
      // Seed defaults
      items = await this.distributionRepository.replaceItems(DEFAULT_MONTHLY_ITEMS);
    }
    return items.map(i => ({ name: i.name, category: i.category, quantity: i.quantity }));
  }

  /**
   * Update the list of monthly items in the database.
   */
  async setMonthlyItems(items: MonthlyItem[]): Promise<MonthlyItem[]> {
    const saved = await this.distributionRepository.replaceItems(
      items.map(i => ({ name: i.name, category: i.category, quantity: i.quantity }))
    );
    return saved.map(i => ({ name: i.name, category: i.category, quantity: i.quantity }));
  }

  /**
   * Add monthly items to all trainers
   */
  async addMonthlyItems(triggerType: 'automatic' | 'manual' = 'manual'): Promise<MonthlyDistributionResult> {
    try {
      console.log('Starting monthly item distribution...');

      const monthlyItems = await this.getMonthlyItems();
      const result = await db.query<{ id: number }>('SELECT id FROM trainers');
      const trainers = result.rows;

      if (!trainers || trainers.length === 0) {
        console.log('No trainers found');
        const res: MonthlyDistributionResult = { success: false, message: 'No trainers found' };
        await this.distributionRepository.recordRun({
          triggerType,
          success: false,
          totalTrainers: 0,
          successCount: 0,
          failCount: 0,
          errorMessage: 'No trainers found',
        });
        return res;
      }

      console.log(`Found ${trainers.length} trainers`);

      const results = {
        totalTrainers: trainers.length,
        successCount: 0,
        failCount: 0,
        errors: [] as Array<{ trainerId: number; error: string }>,
      };

      for (const trainer of trainers) {
        try {
          for (const item of monthlyItems) {
            await this.inventoryRepository.addItem(
              trainer.id,
              item.category,
              item.name,
              item.quantity
            );
          }
          results.successCount++;
        } catch (trainerError) {
          const errorMessage = trainerError instanceof Error ? trainerError.message : String(trainerError);
          console.error(`Error adding items to trainer ${trainer.id}:`, trainerError);
          results.failCount++;
          results.errors.push({ trainerId: trainer.id, error: errorMessage });
        }
      }

      console.log('Monthly item distribution completed');
      console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);

      await this.distributionRepository.recordRun({
        triggerType,
        success: true,
        totalTrainers: results.totalTrainers,
        successCount: results.successCount,
        failCount: results.failCount,
        errorMessage: results.errors.length > 0 ? `${results.errors.length} trainer(s) failed` : null,
      });

      return { success: true, message: 'Monthly items added successfully', results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error adding monthly items:', error);

      await this.distributionRepository.recordRun({
        triggerType,
        success: false,
        totalTrainers: 0,
        successCount: 0,
        failCount: 0,
        errorMessage: errorMessage,
      }).catch(e => console.error('Failed to record run:', e));

      return { success: false, message: 'Error adding monthly items', error: errorMessage };
    }
  }

  /**
   * Run all monthly tasks
   */
  async runMonthlyTasks(triggerType: 'automatic' | 'manual' = 'manual'): Promise<MonthlyTasksResult> {
    try {
      console.log('Running monthly tasks...');
      const itemsResult = await this.addMonthlyItems(triggerType);
      return {
        success: true,
        message: 'Monthly tasks completed successfully',
        results: { items: itemsResult },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error running monthly tasks:', error);
      return { success: false, message: 'Error running monthly tasks', error: errorMessage };
    }
  }

  /**
   * Check if it's the first day of the month
   */
  isFirstDayOfMonth(): boolean {
    return new Date().getDate() === 1;
  }

  /**
   * Get recent distribution runs
   */
  async getRecentRuns(limit = 20): Promise<DistributionRun[]> {
    return this.distributionRepository.getRecentRuns(limit);
  }

  /**
   * Add items to a specific trainer (useful for testing or manual distribution)
   */
  async addItemsToTrainer(trainerId: number, items?: MonthlyItem[]): Promise<boolean> {
    const itemsToAdd = items ?? await this.getMonthlyItems();
    try {
      for (const item of itemsToAdd) {
        await this.inventoryRepository.addItem(trainerId, item.category, item.name, item.quantity);
      }
      return true;
    } catch (error) {
      console.error(`Error adding items to trainer ${trainerId}:`, error);
      return false;
    }
  }
}
