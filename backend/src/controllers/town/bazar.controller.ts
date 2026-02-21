import { Request, Response } from 'express';
import { BazarService } from '../../services/bazar.service';
import {
  TrainerRepository,
  MonsterRepository,
  TrainerInventoryRepository,
} from '../../repositories';

const bazarService = new BazarService();
const trainerRepo = new TrainerRepository();
const monsterRepo = new MonsterRepository();
const inventoryRepo = new TrainerInventoryRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAvailableMonsters(req: Request, res: Response): Promise<void> {
  try {
    const allMonsters = await bazarService.getAvailableMonsters();
    const page = parseInt(paramToString(req.query.page as string)) || 1;
    const limit = parseInt(paramToString(req.query.limit as string)) || 12;
    const total = allMonsters.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const monsters = allMonsters.slice(start, start + limit);

    res.json({ success: true, monsters, page, totalPages, total });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting available monsters';
    console.error('Error getting available monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getAvailableItems(req: Request, res: Response): Promise<void> {
  try {
    let allItems = await bazarService.getAvailableItems();
    const category = paramToString(req.query.category as string);
    if (category) {
      allItems = allItems.filter(item => item.itemCategory === category);
    }
    const page = parseInt(paramToString(req.query.page as string)) || 1;
    const limit = parseInt(paramToString(req.query.limit as string)) || 12;
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = allItems.slice(start, start + limit).map(item => ({
      id: item.id,
      name: item.itemName,
      category: item.itemCategory,
      quantity: item.quantity,
      forfeited_by: item.forfeitedByTrainerName,
      forfeited_at: item.forfeitedAt,
    }));

    res.json({ success: true, items, page, totalPages, total });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting available items';
    console.error('Error getting available items:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function forfeitMonster(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const monsterId = body.monsterId as number | undefined;
    const trainerId = body.trainerId as number | undefined;
    const userId = req.user?.discord_id;

    if (!monsterId || !trainerId) {
      res.status(400).json({ success: false, message: 'Monster ID and Trainer ID are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Verify trainer belongs to user
    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const result = await bazarService.forfeitMonster(monsterId, trainerId, userId);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error forfeiting monster';
    console.error('Error forfeiting monster:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function forfeitMonsters(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const monsters = body.monsters as Array<{ monsterId: number; trainerId: number }> | undefined;
    const userId = req.user?.discord_id;

    if (!monsters || !Array.isArray(monsters) || monsters.length === 0) {
      res.status(400).json({ success: false, message: 'Monsters array is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const results: Array<{ monsterId: number; success: boolean; bazarMonsterId?: number }> = [];
    const errors: Array<{ monsterId: number; error: string }> = [];

    for (const { monsterId, trainerId } of monsters) {
      try {
        const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
        if (!isOwner) {
          errors.push({ monsterId, error: 'Trainer does not belong to this user' });
          continue;
        }

        const result = await bazarService.forfeitMonster(monsterId, trainerId, userId);
        results.push({ monsterId, ...result });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ monsterId, error: errMsg });
      }
    }

    res.json({ success: true, results, errors });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error forfeiting monsters';
    console.error('Error forfeiting monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function forfeitItem(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const trainerId = body.trainerId as number | undefined;
    const category = body.category as string | undefined;
    const itemName = body.itemName as string | undefined;
    const quantity = body.quantity as number | undefined;
    const userId = req.user?.discord_id;

    if (!trainerId || !category || !itemName || !quantity) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const result = await bazarService.forfeitItem(trainerId, userId, category, itemName, quantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error forfeiting item';
    console.error('Error forfeiting item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adoptMonster(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const bazarMonsterId = body.bazarMonsterId as number | undefined;
    const trainerId = body.trainerId as number | undefined;
    const newName = body.newName as string | undefined;
    const userId = req.user?.discord_id;

    if (!bazarMonsterId || !trainerId) {
      res.status(400).json({ success: false, message: 'Bazar Monster ID and Trainer ID are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const result = await bazarService.adoptMonster(bazarMonsterId, trainerId, userId, newName);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adopting monster';
    console.error('Error adopting monster:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function collectItem(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const bazarItemId = body.bazarItemId as number | undefined;
    const trainerId = body.trainerId as number | undefined;
    const quantity = body.quantity as number | undefined;
    const userId = req.user?.discord_id;

    if (!bazarItemId || !trainerId || !quantity) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const result = await bazarService.collectItem(bazarItemId, trainerId, userId, quantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error collecting item';
    console.error('Error collecting item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getUserTrainers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const trainers = await trainerRepo.findByUserId(userId);
    res.json({ success: true, trainers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting user trainers';
    console.error('Error getting user trainers:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTrainerMonsters(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const monsters = await monsterRepo.findByTrainerId(trainerId);
    res.json({ success: true, monsters });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting trainer monsters';
    console.error('Error getting trainer monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTrainerInventory(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const isOwner = await bazarService.verifyTrainerOwnership(trainerId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
      return;
    }

    const inventory = await inventoryRepo.findByTrainerId(trainerId);
    res.json({ success: true, inventory: inventory ?? {} });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting trainer inventory';
    console.error('Error getting trainer inventory:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
