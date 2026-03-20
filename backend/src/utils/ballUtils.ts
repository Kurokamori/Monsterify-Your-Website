import { TrainerInventoryRepository } from '../repositories';
import { TrainerRepository } from '../repositories';

const POKEBALL_FALLBACK_COST = 600;

/**
 * Consume a ball from trainer inventory for monster creation/assignment.
 * If the trainer has the ball, removes 1 from inventory.
 * If the ball is 'Poke Ball' and they don't have one, deducts 600 coins instead (can go negative).
 * For any other ball they don't own, throws an error.
 */
export async function consumeBallFromInventory(
  trainerId: number,
  ballName: string,
): Promise<void> {
  const inventoryRepo = new TrainerInventoryRepository();
  const inventory = await inventoryRepo.findByTrainerId(trainerId);
  const ballQty = inventory?.balls?.[ballName] ?? 0;

  if (ballQty > 0) {
    await inventoryRepo.removeItem(trainerId, 'balls', ballName, 1);
  } else if (ballName === 'Poke Ball') {
    const trainerRepo = new TrainerRepository();
    await trainerRepo.updateCurrency(trainerId, -POKEBALL_FALLBACK_COST);
  } else {
    throw new Error(`Trainer does not have any ${ballName} in their inventory`);
  }
}
