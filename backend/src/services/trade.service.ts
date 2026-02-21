import { db } from '../database';
import {
  AutomatedTradeRepository,
  MonsterRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  INVENTORY_CATEGORIES,
} from '../repositories';
import type {
  AutomatedTradeWithDetails,
  InventoryCategory,
  InventoryItems,
} from '../repositories';
import type { PaginatedAutomatedTrades } from '../repositories/automated-trade.repository';

const automatedTradeRepo = new AutomatedTradeRepository();
const monsterRepo = new MonsterRepository();
const trainerRepo = new TrainerRepository();
const inventoryRepo = new TrainerInventoryRepository();

export type TradeExecutionInput = {
  fromTrainerId: number;
  toTrainerId: number;
  fromItems?: Record<string, Record<string, number>>;
  toItems?: Record<string, Record<string, number>>;
  fromMonsters?: number[];
  toMonsters?: number[];
};

export type TradeExecutionResult = {
  id: number;
  fromTrainerName: string;
  toTrainerName: string;
  fromItems: Record<string, Record<string, number>>;
  toItems: Record<string, Record<string, number>>;
  fromMonsters: number[];
  toMonsters: number[];
  executedAt: string;
};

async function validateAndTransferMonsters(
  monsterIds: number[],
  fromTrainerId: number,
  toTrainerId: number,
  toPlayerUserId: string,
): Promise<void> {
  for (const monsterId of monsterIds) {
    const monster = await monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }
    if (monster.trainer_id !== fromTrainerId) {
      throw new Error(`Monster ${monster.name} does not belong to the source trainer`);
    }
    await monsterRepo.transferToTrainer(monsterId, toTrainerId, toPlayerUserId);
  }
}

async function validateAndTransferItems(
  items: Record<string, Record<string, number>>,
  fromTrainerId: number,
  toTrainerId: number,
): Promise<void> {
  if (Object.keys(items).length === 0) {
    return;
  }

  const fromInventory = await inventoryRepo.findByTrainerId(fromTrainerId);
  if (!fromInventory) {
    throw new Error('Source trainer inventory not found');
  }

  await inventoryRepo.findOrCreate(toTrainerId);

  for (const [category, categoryItems] of Object.entries(items)) {
    if (!categoryItems || Object.keys(categoryItems).length === 0) {
      continue;
    }

    if (!INVENTORY_CATEGORIES.includes(category as InventoryCategory)) {
      throw new Error(`Invalid inventory category: ${category}`);
    }

    const typedCategory = category as InventoryCategory;
    const fromCategoryItems: InventoryItems = { ...fromInventory[typedCategory] };

    for (const [itemName, quantity] of Object.entries(categoryItems)) {
      const currentQuantity = fromCategoryItems[itemName] ?? 0;
      if (currentQuantity < quantity) {
        throw new Error(
          `Source trainer does not have enough ${itemName} (has ${currentQuantity}, needs ${quantity})`,
        );
      }
    }

    // Transfer: remove from source, add to target
    for (const [itemName, quantity] of Object.entries(categoryItems)) {
      await inventoryRepo.removeItem(fromTrainerId, typedCategory, itemName, quantity);
      await inventoryRepo.addItem(toTrainerId, typedCategory, itemName, quantity);
    }
  }
}

export class TradeService {
  async executeTrade(input: TradeExecutionInput): Promise<TradeExecutionResult> {
    const {
      fromTrainerId,
      toTrainerId,
      fromItems = {},
      toItems = {},
      fromMonsters = [],
      toMonsters = [],
    } = input;

    const fromTrainer = await trainerRepo.findById(fromTrainerId);
    const toTrainer = await trainerRepo.findById(toTrainerId);

    if (!fromTrainer) {
      throw new Error(`Source trainer with ID ${fromTrainerId} not found`);
    }
    if (!toTrainer) {
      throw new Error(`Target trainer with ID ${toTrainerId} not found`);
    }

    // Execute within a transaction
    return db.transaction(async () => {
      // Transfer monsters
      if (fromMonsters.length > 0) {
        await validateAndTransferMonsters(fromMonsters, fromTrainerId, toTrainerId, toTrainer.player_user_id);
      }
      if (toMonsters.length > 0) {
        await validateAndTransferMonsters(toMonsters, toTrainerId, fromTrainerId, fromTrainer.player_user_id);
      }

      // Transfer items
      if (Object.keys(fromItems).length > 0) {
        await validateAndTransferItems(fromItems, fromTrainerId, toTrainerId);
      }
      if (Object.keys(toItems).length > 0) {
        await validateAndTransferItems(toItems, toTrainerId, fromTrainerId);
      }

      // Log the trade
      const tradeRecord = await automatedTradeRepo.create({
        fromTrainerId,
        toTrainerId,
        fromItems,
        toItems,
        fromMonsters,
        toMonsters,
      });

      return {
        id: tradeRecord.id,
        fromTrainerName: fromTrainer.name,
        toTrainerName: toTrainer.name,
        fromItems,
        toItems,
        fromMonsters,
        toMonsters,
        executedAt: new Date().toISOString(),
      };
    });
  }

  async getTradeHistory(
    trainerId: number,
    options: { page?: number; limit?: number } = {},
  ): Promise<PaginatedAutomatedTrades> {
    return automatedTradeRepo.findByTrainerId(trainerId, options);
  }

  async getTradeById(id: number): Promise<AutomatedTradeWithDetails | null> {
    return automatedTradeRepo.findById(id);
  }
}
