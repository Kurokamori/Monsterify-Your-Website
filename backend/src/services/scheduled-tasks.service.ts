import { db } from '../database';
import { TrainerInventoryRepository, InventoryCategory } from '../repositories';

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

type MonthlyItem = {
  name: string;
  category: InventoryCategory;
  quantity: number;
};

// Items distributed on the 1st of every month
const MONTHLY_ITEMS: MonthlyItem[] = [
  { name: 'Legacy Leeway', category: 'items', quantity: 1 },
  { name: 'Daycare Daypass', category: 'items', quantity: 1 },
  { name: 'Mission Mandate', category: 'keyitems', quantity: 1 },
];

/**
 * Service for handling scheduled/automated tasks
 */
export class ScheduledTasksService {
  private inventoryRepository: TrainerInventoryRepository;

  constructor(inventoryRepository?: TrainerInventoryRepository) {
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
  }

  /**
   * Add monthly items to all trainers
   * @returns Result of the operation
   */
  async addMonthlyItems(): Promise<MonthlyDistributionResult> {
    try {
      console.log('Starting monthly item distribution...');

      // Get all trainer IDs
      const result = await db.query<{ id: number }>('SELECT id FROM trainers');
      const trainers = result.rows;

      if (!trainers || trainers.length === 0) {
        console.log('No trainers found');
        return {
          success: false,
          message: 'No trainers found',
        };
      }

      console.log(`Found ${trainers.length} trainers`);

      // Track results
      const results = {
        totalTrainers: trainers.length,
        successCount: 0,
        failCount: 0,
        errors: [] as Array<{ trainerId: number; error: string }>,
      };

      // Add items to each trainer
      for (const trainer of trainers) {
        try {
          const trainerId = trainer.id;

          // Add each item
          for (const item of MONTHLY_ITEMS) {
            await this.inventoryRepository.addItem(
              trainerId,
              item.category,
              item.name,
              item.quantity
            );

            console.log(`Added ${item.quantity} ${item.name} to trainer ${trainerId}`);
          }

          results.successCount++;
        } catch (trainerError) {
          const errorMessage = trainerError instanceof Error ? trainerError.message : String(trainerError);
          console.error(`Error adding items to trainer ${trainer.id}:`, trainerError);
          results.failCount++;
          results.errors.push({
            trainerId: trainer.id,
            error: errorMessage,
          });
        }
      }

      console.log('Monthly item distribution completed');
      console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);

      return {
        success: true,
        message: 'Monthly items added successfully',
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error adding monthly items:', error);
      return {
        success: false,
        message: 'Error adding monthly items',
        error: errorMessage,
      };
    }
  }

  /**
   * Run all monthly tasks
   * @returns Result of the operation
   */
  async runMonthlyTasks(): Promise<MonthlyTasksResult> {
    try {
      console.log('Running monthly tasks...');

      // Add monthly items
      const itemsResult = await this.addMonthlyItems();

      // Add more monthly tasks here as needed

      return {
        success: true,
        message: 'Monthly tasks completed successfully',
        results: {
          items: itemsResult,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error running monthly tasks:', error);
      return {
        success: false,
        message: 'Error running monthly tasks',
        error: errorMessage,
      };
    }
  }

  /**
   * Check if it's the first day of the month
   * @returns True if it's the first day of the month
   */
  isFirstDayOfMonth(): boolean {
    const now = new Date();
    return now.getDate() === 1;
  }

  /**
   * Get the list of monthly items that are distributed
   * @returns Array of monthly items
   */
  getMonthlyItems(): MonthlyItem[] {
    return [...MONTHLY_ITEMS];
  }

  /**
   * Add items to a specific trainer (useful for testing or manual distribution)
   * @param trainerId - Trainer ID
   * @param items - Items to add (defaults to monthly items)
   * @returns Success status
   */
  async addItemsToTrainer(trainerId: number, items?: MonthlyItem[]): Promise<boolean> {
    const itemsToAdd = items ?? MONTHLY_ITEMS;

    try {
      for (const item of itemsToAdd) {
        await this.inventoryRepository.addItem(
          trainerId,
          item.category,
          item.name,
          item.quantity
        );
      }
      return true;
    } catch (error) {
      console.error(`Error adding items to trainer ${trainerId}:`, error);
      return false;
    }
  }
}
