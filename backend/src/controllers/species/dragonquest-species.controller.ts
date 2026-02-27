import { Request, Response } from 'express';
import { DragonQuestSpeciesRepository } from '../../repositories';

const repo = new DragonQuestSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllDragonQuest(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'family' | 'subfamily') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const family = (req.query.family as string) || undefined;
    const subfamily = (req.query.subfamily as string) || undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      family,
      subfamily,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting Dragon Quest monsters:', error);
    res.status(500).json({ success: false, message: 'Error getting Dragon Quest monsters' });
  }
}

export async function getDragonQuestById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const monster = await repo.findById(id);
    if (!monster) {
      res.status(404).json({ success: false, message: 'Dragon Quest monster not found' });
      return;
    }

    res.json({ success: true, data: monster });
  } catch (error) {
    console.error('Error getting Dragon Quest monster by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Dragon Quest monster' });
  }
}

export async function createDragonQuest(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name',
      });
      return;
    }

    const monster = await repo.create({
      name,
      family: body.family as string | undefined,
      subfamily: body.subfamily as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: monster, message: 'Dragon Quest monster created successfully' });
  } catch (error) {
    console.error('Error creating Dragon Quest monster:', error);
    res.status(500).json({ success: false, message: 'Error creating Dragon Quest monster' });
  }
}

export async function updateDragonQuest(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Dragon Quest monster not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const monster = await repo.update(id, {
      name: body.name as string | undefined,
      family: body.family as string | undefined,
      subfamily: body.subfamily as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: monster, message: 'Dragon Quest monster updated successfully' });
  } catch (error) {
    console.error('Error updating Dragon Quest monster:', error);
    res.status(500).json({ success: false, message: 'Error updating Dragon Quest monster' });
  }
}

export async function deleteDragonQuest(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Dragon Quest monster not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Dragon Quest monster deleted successfully' });
  } catch (error) {
    console.error('Error deleting Dragon Quest monster:', error);
    res.status(500).json({ success: false, message: 'Error deleting Dragon Quest monster' });
  }
}

export async function getFamilies(_req: Request, res: Response): Promise<void> {
  try {
    const families = await repo.getFamilies();
    res.json({ success: true, data: families });
  } catch (error) {
    console.error('Error getting Dragon Quest families:', error);
    res.status(500).json({ success: false, message: 'Error getting families' });
  }
}

export async function getSubfamilies(req: Request, res: Response): Promise<void> {
  try {
    const family = (req.query.family as string) || undefined;
    const subfamilies = await repo.getSubfamilies(family);
    res.json({ success: true, data: subfamilies });
  } catch (error) {
    console.error('Error getting Dragon Quest subfamilies:', error);
    res.status(500).json({ success: false, message: 'Error getting subfamilies' });
  }
}
