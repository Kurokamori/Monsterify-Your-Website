import { db } from '../database';
import {
  BazarRepository,
  MonsterRepository,
  TrainerRepository,
  TrainerInventoryRepository,
} from '../repositories';
import type {
  BazarMonsterWithDetails,
  BazarItemWithDetails,
  InventoryCategory,
} from '../repositories';

const bazarRepo = new BazarRepository();
const monsterRepo = new MonsterRepository();
const trainerRepo = new TrainerRepository();
const inventoryRepo = new TrainerInventoryRepository();

export type ForfeitMonsterResult = {
  success: boolean;
  bazarMonsterId: number;
};

export type ForfeitItemResult = {
  success: boolean;
  bazarItemId: number;
};

export type AdoptMonsterResult = {
  success: boolean;
  monsterId: number;
};

export type CollectItemResult = {
  success: boolean;
};

export class BazarService {
  async getAvailableMonsters(): Promise<BazarMonsterWithDetails[]> {
    return bazarRepo.getAvailableMonsters();
  }

  async getAvailableItems(): Promise<BazarItemWithDetails[]> {
    return bazarRepo.getAvailableItems();
  }

  async forfeitMonster(
    monsterId: number,
    trainerId: number,
    userId: string,
  ): Promise<ForfeitMonsterResult> {
    const monster = await monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found or does not belong to this trainer');
    }
    if (monster.trainer_id !== trainerId) {
      throw new Error('Monster does not belong to this trainer');
    }

    return db.transaction(async () => {
      // Create bazar monster entry
      const bazarMonster = await bazarRepo.createMonster({
        originalMonsterId: monster.id,
        forfeitedByTrainerId: trainerId,
        forfeitedByUserId: userId,
        name: monster.name,
        species1: monster.species1,
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1,
        type2: monster.type2,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5,
        attribute: monster.attribute,
        level: monster.level,
      });

      // Delete the original monster
      await monsterRepo.delete(monsterId);

      // Record transaction
      await bazarRepo.recordTransaction(
        'forfeit_monster',
        'monster',
        bazarMonster.id,
        trainerId,
        userId,
        null,
        null,
        { original_monster_id: monsterId, monster_name: monster.name },
      );

      return { success: true, bazarMonsterId: bazarMonster.id };
    });
  }

  async forfeitItem(
    trainerId: number,
    userId: string,
    category: string,
    itemName: string,
    quantity: number,
  ): Promise<ForfeitItemResult> {
    const typedCategory = category as InventoryCategory;
    const inventory = await inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      throw new Error('Trainer inventory not found');
    }

    const categoryData = inventory[typedCategory] ?? {};
    const currentQuantity = categoryData[itemName] ?? 0;

    if (currentQuantity < quantity) {
      throw new Error(
        `Not enough items to forfeit. You have ${currentQuantity}, trying to forfeit ${quantity}`,
      );
    }

    return db.transaction(async () => {
      // Create bazar item entry
      const bazarItem = await bazarRepo.createItem({
        forfeitedByTrainerId: trainerId,
        forfeitedByUserId: userId,
        itemName,
        itemCategory: category,
        quantity,
      });

      // Remove from trainer inventory
      await inventoryRepo.removeItem(trainerId, typedCategory, itemName, quantity);

      // Record transaction
      await bazarRepo.recordTransaction(
        'forfeit_item',
        'item',
        bazarItem.id,
        trainerId,
        userId,
        null,
        null,
        { item_name: itemName, category, quantity },
      );

      return { success: true, bazarItemId: bazarItem.id };
    });
  }

  async adoptMonster(
    bazarMonsterId: number,
    trainerId: number,
    userId: string,
    newName?: string,
  ): Promise<AdoptMonsterResult> {
    const bazarMonster = await bazarRepo.findMonsterById(bazarMonsterId);
    if (!bazarMonster || !bazarMonster.isAvailable) {
      throw new Error('Monster not available for adoption');
    }

    return db.transaction(async () => {
      // Create a new monster for the adopting trainer
      const newMonster = await monsterRepo.create({
        trainerId,
        playerUserId: userId,
        name: newName ?? bazarMonster.name,
        species1: bazarMonster.species1,
        species2: bazarMonster.species2,
        species3: bazarMonster.species3,
        type1: bazarMonster.type1,
        type2: bazarMonster.type2,
        type3: bazarMonster.type3,
        type4: bazarMonster.type4,
        type5: bazarMonster.type5,
        attribute: bazarMonster.attribute,
        level: bazarMonster.level,
      });

      // Mark bazar monster as unavailable
      await bazarRepo.markMonsterUnavailable(bazarMonsterId);

      // Record transaction
      await bazarRepo.recordTransaction(
        'adopt_monster',
        'monster',
        bazarMonsterId,
        bazarMonster.forfeitedByTrainerId,
        bazarMonster.forfeitedByUserId,
        trainerId,
        userId,
        {
          new_monster_id: newMonster.id,
          new_name: newName ?? bazarMonster.name,
          original_name: bazarMonster.name,
        },
      );

      return { success: true, monsterId: newMonster.id };
    });
  }

  async collectItem(
    bazarItemId: number,
    trainerId: number,
    userId: string,
    quantity: number,
  ): Promise<CollectItemResult> {
    const bazarItem = await bazarRepo.findItemById(bazarItemId);
    if (!bazarItem || !bazarItem.isAvailable) {
      throw new Error('Item not available for collection');
    }

    if (quantity > bazarItem.quantity) {
      throw new Error('Not enough quantity available');
    }

    const typedCategory = bazarItem.itemCategory as InventoryCategory;

    return db.transaction(async () => {
      // Add to trainer inventory
      await inventoryRepo.addItem(trainerId, typedCategory, bazarItem.itemName, quantity);

      // Update bazar item quantity or mark unavailable
      if (quantity >= bazarItem.quantity) {
        await bazarRepo.markItemUnavailable(bazarItemId);
      } else {
        await bazarRepo.reduceItemQuantity(bazarItemId, quantity);
      }

      // Record transaction
      await bazarRepo.recordTransaction(
        'collect_item',
        'item',
        bazarItemId,
        bazarItem.forfeitedByTrainerId,
        bazarItem.forfeitedByUserId,
        trainerId,
        userId,
        { item_name: bazarItem.itemName, category: bazarItem.itemCategory, quantity },
      );

      return { success: true };
    });
  }

  async verifyTrainerOwnership(trainerId: number, discordUserId: string): Promise<boolean> {
    const trainer = await trainerRepo.findById(trainerId);
    if (!trainer) {
      return false;
    }
    return trainer.player_user_id === discordUserId;
  }
}
