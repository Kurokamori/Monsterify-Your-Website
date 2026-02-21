import { TrainerInventoryRepository } from '../repositories';

export type SpecialBerryName = 'Forget-Me-Not' | 'Edenwiess';

export type SpecialBerryInventory = {
  'Forget-Me-Not': number;
  'Edenwiess': number;
};

/**
 * Service for managing special berries (Forget-Me-Not and Edenwiess)
 * These berries have special effects in the game:
 * - Forget-Me-Not: Used for move management
 * - Edenwiess: Used for evolution/transformation effects
 */
export class SpecialBerryService {
  private inventoryRepository: TrainerInventoryRepository;

  constructor(inventoryRepository?: TrainerInventoryRepository) {
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
  }

  /**
   * Check if trainer has a specific special berry
   * @param trainerId - Trainer ID
   * @param berryName - Berry name ('Forget-Me-Not' or 'Edenwiess')
   * @returns Whether trainer has at least one of the specified berry
   */
  async hasSpecialBerry(trainerId: number, berryName: SpecialBerryName): Promise<boolean> {
    try {
      const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
      if (!inventory?.berries) {
        return false;
      }

      const berries = inventory.berries;

      // Check for the berry
      const quantity = berries[berryName] ?? 0;
      return quantity > 0;
    } catch (error) {
      console.error(`Error checking special berry ${berryName} for trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Consume a special berry from trainer inventory
   * @param trainerId - Trainer ID
   * @param berryName - Berry name ('Forget-Me-Not' or 'Edenwiess')
   * @returns Whether berry was successfully consumed
   */
  async consumeSpecialBerry(trainerId: number, berryName: SpecialBerryName): Promise<boolean> {
    try {
      const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
      if (!inventory?.berries) {
        return false;
      }

      const berries = inventory.berries;
      const currentQuantity = berries[berryName] ?? 0;

      if (currentQuantity <= 0) {
        return false;
      }

      // Consume one berry
      await this.inventoryRepository.removeItem(trainerId, 'berries', berryName, 1);

      console.log(
        `Consumed 1 ${berryName} from trainer ${trainerId}. Remaining: ${currentQuantity - 1}`
      );
      return true;
    } catch (error) {
      console.error(`Error consuming special berry ${berryName} for trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Get available special berries for a trainer
   * @param trainerId - Trainer ID
   * @returns Object with berry counts
   */
  async getAvailableSpecialBerries(trainerId: number): Promise<SpecialBerryInventory> {
    try {
      const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
      if (!inventory?.berries) {
        return { 'Forget-Me-Not': 0, 'Edenwiess': 0 };
      }

      const berries = inventory.berries;

      return {
        'Forget-Me-Not': berries['Forget-Me-Not'] ?? 0,
        'Edenwiess': berries['Edenwiess'] ?? 0,
      };
    } catch (error) {
      console.error(`Error getting special berries for trainer ${trainerId}:`, error);
      return { 'Forget-Me-Not': 0, 'Edenwiess': 0 };
    }
  }

  /**
   * Add special berries to trainer inventory
   * @param trainerId - Trainer ID
   * @param berryName - Berry name
   * @param quantity - Quantity to add (default 1)
   * @returns Whether berries were successfully added
   */
  async addSpecialBerry(
    trainerId: number,
    berryName: SpecialBerryName,
    quantity = 1
  ): Promise<boolean> {
    try {
      // Ensure inventory exists
      const inventory = await this.inventoryRepository.findOrCreate(trainerId);
      if (!inventory) {
        return false;
      }

      await this.inventoryRepository.addItem(trainerId, 'berries', berryName, quantity);

      const updatedInventory = await this.inventoryRepository.findByTrainerId(trainerId);
      const newQuantity = updatedInventory?.berries[berryName] ?? 0;

      console.log(`Added ${quantity} ${berryName} to trainer ${trainerId}. Total: ${newQuantity}`);
      return true;
    } catch (error) {
      console.error(`Error adding special berry ${berryName} to trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Get the quantity of a specific special berry
   * @param trainerId - Trainer ID
   * @param berryName - Berry name
   * @returns Quantity of the specified berry
   */
  async getBerryQuantity(trainerId: number, berryName: SpecialBerryName): Promise<number> {
    try {
      const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
      if (!inventory?.berries) {
        return 0;
      }

      return inventory.berries[berryName] ?? 0;
    } catch (error) {
      console.error(`Error getting berry quantity for trainer ${trainerId}:`, error);
      return 0;
    }
  }

  /**
   * Check if trainer can use Forget-Me-Not berry (has at least one)
   * @param trainerId - Trainer ID
   * @returns Whether trainer can use Forget-Me-Not
   */
  async canUseForgetMeNot(trainerId: number): Promise<boolean> {
    return this.hasSpecialBerry(trainerId, 'Forget-Me-Not');
  }

  /**
   * Check if trainer can use Edenwiess berry (has at least one)
   * @param trainerId - Trainer ID
   * @returns Whether trainer can use Edenwiess
   */
  async canUseEdenwiess(trainerId: number): Promise<boolean> {
    return this.hasSpecialBerry(trainerId, 'Edenwiess');
  }

  /**
   * Use Forget-Me-Not berry (consume it)
   * @param trainerId - Trainer ID
   * @returns Whether the berry was successfully used
   */
  async useForgetMeNot(trainerId: number): Promise<boolean> {
    return this.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
  }

  /**
   * Use Edenwiess berry (consume it)
   * @param trainerId - Trainer ID
   * @returns Whether the berry was successfully used
   */
  async useEdenwiess(trainerId: number): Promise<boolean> {
    return this.consumeSpecialBerry(trainerId, 'Edenwiess');
  }
}
