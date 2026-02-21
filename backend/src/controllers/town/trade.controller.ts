import { Request, Response } from 'express';
import { TradeService } from '../../services/trade.service';
import {
  TrainerRepository,
  MonsterRepository,
  TrainerInventoryRepository,
  ItemRepository,
  INVENTORY_CATEGORIES,
} from '../../repositories';

const tradeService = new TradeService();
const trainerRepo = new TrainerRepository();
const monsterRepo = new MonsterRepository();
const inventoryRepo = new TrainerInventoryRepository();
const itemRepo = new ItemRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function executeTrade(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const fromTrainerId = body.fromTrainerId as number | undefined;
    const toTrainerId = body.toTrainerId as number | undefined;
    const fromItems = (body.fromItems ?? {}) as Record<string, Record<string, number>>;
    const toItems = (body.toItems ?? {}) as Record<string, Record<string, number>>;
    const fromMonsters = (body.fromMonsters ?? []) as number[];
    const toMonsters = (body.toMonsters ?? []) as number[];

    if (!fromTrainerId || !toTrainerId) {
      res.status(400).json({ success: false, message: 'Both from and to trainer IDs are required' });
      return;
    }

    if (fromTrainerId === toTrainerId) {
      res.status(400).json({ success: false, message: 'Cannot trade with the same trainer' });
      return;
    }

    const hasFromItems = Object.keys(fromItems).length > 0;
    const hasToItems = Object.keys(toItems).length > 0;
    const hasFromMonsters = fromMonsters.length > 0;
    const hasToMonsters = toMonsters.length > 0;

    if (!hasFromItems && !hasToItems && !hasFromMonsters && !hasToMonsters) {
      res.status(400).json({ success: false, message: 'At least one item or monster must be traded' });
      return;
    }

    const result = await tradeService.executeTrade({
      fromTrainerId,
      toTrainerId,
      fromItems,
      toItems,
      fromMonsters,
      toMonsters,
    });

    res.json({ success: true, message: 'Trade executed successfully', trade: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to execute trade';
    console.error('Error executing trade:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTradeHistory(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await tradeService.getTradeHistory(trainerId, { page, limit });

    res.json({
      success: true,
      history: history.data,
      pagination: {
        page: history.page,
        limit: history.limit,
        total: history.total,
        totalPages: history.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trade history' });
  }
}

export async function getAvailableTrainers(_req: Request, res: Response): Promise<void> {
  try {
    const trainers = await trainerRepo.findAll();

    const availableTrainers = trainers.map((trainer) => ({
      id: trainer.id,
      name: trainer.name,
      level: trainer.level,
      playerUserId: trainer.player_user_id,
    }));

    res.json({ success: true, trainers: availableTrainers });
  } catch (error) {
    console.error('Error fetching available trainers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available trainers' });
  }
}

export async function getTrainerMonsters(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const monsters = await monsterRepo.findByTrainerId(trainerId);
    res.json({ success: true, monsters: monsters ?? [] });
  } catch (error) {
    console.error('Error fetching trainer monsters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trainer monsters' });
  }
}

export async function getTrainerInventory(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const inventory = await inventoryRepo.findByTrainerId(trainerId);

    if (!inventory) {
      const emptyInventory: Record<string, Record<string, unknown>> = {};
      for (const cat of INVENTORY_CATEGORIES) {
        emptyInventory[cat] = {};
      }
      res.json({ success: true, inventory: emptyInventory });
      return;
    }

    // Collect all item names across categories
    const allItemNames = new Set<string>();
    for (const category of INVENTORY_CATEGORIES) {
      const categoryItems = inventory[category];
      for (const [itemName, quantity] of Object.entries(categoryItems)) {
        if (quantity > 0) {
          allItemNames.add(itemName);
        }
      }
    }

    // Fetch item metadata
    const itemsMetadata = await itemRepo.findByNames(Array.from(allItemNames));
    const itemsMap = new Map<string, typeof itemsMetadata[number]>();
    for (const item of itemsMetadata) {
      itemsMap.set(item.name, item);
    }

    // Enrich inventory with metadata
    const enrichedInventory: Record<string, Record<string, unknown>> = {};
    for (const category of INVENTORY_CATEGORIES) {
      const categoryItems = inventory[category];
      enrichedInventory[category] = {};

      for (const [itemName, quantity] of Object.entries(categoryItems)) {
        if (quantity > 0) {
          const metadata = itemsMap.get(itemName);
          enrichedInventory[category][itemName] = {
            name: itemName,
            quantity,
            category,
            imageUrl: metadata?.image_url ?? null,
            description: metadata?.description ?? null,
            rarity: metadata?.rarity ?? null,
            type: metadata?.type ?? null,
            effect: metadata?.effect ?? null,
            basePrice: metadata?.base_price ?? 0,
          };
        }
      }
    }

    res.json({ success: true, inventory: enrichedInventory });
  } catch (error) {
    console.error('Error fetching trainer inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trainer inventory' });
  }
}
