import { Request, Response } from 'express';
import { MonsterHunterSpeciesRepository } from '../../repositories';

const repo = new MonsterHunterSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllMonsterHunter(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'rank') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const element = (req.query.element as string) || undefined;

    const rankParam = req.query.rank as string;
    const rank = rankParam && rankParam !== '' ? parseInt(rankParam, 10) : undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      rank,
      element,
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
    console.error('Error getting Monster Hunter monsters:', error);
    res.status(500).json({ success: false, message: 'Error getting Monster Hunter monsters' });
  }
}

export async function getMonsterHunterById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const monster = await repo.findById(id);
    if (!monster) {
      res.status(404).json({ success: false, message: 'Monster Hunter monster not found' });
      return;
    }

    res.json({ success: true, data: monster });
  } catch (error) {
    console.error('Error getting Monster Hunter monster by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Monster Hunter monster' });
  }
}

export async function createMonsterHunter(req: Request, res: Response): Promise<void> {
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
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      rank: body.rank !== undefined ? Number(body.rank) : undefined,
      element: body.element as string | undefined,
    });

    res.status(201).json({ success: true, data: monster, message: 'Monster Hunter monster created successfully' });
  } catch (error) {
    console.error('Error creating Monster Hunter monster:', error);
    res.status(500).json({ success: false, message: 'Error creating Monster Hunter monster' });
  }
}

export async function updateMonsterHunter(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Monster Hunter monster not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const monster = await repo.update(id, {
      name: body.name as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      rank: body.rank !== undefined ? Number(body.rank) : undefined,
      element: body.element as string | undefined,
    });

    res.json({ success: true, data: monster, message: 'Monster Hunter monster updated successfully' });
  } catch (error) {
    console.error('Error updating Monster Hunter monster:', error);
    res.status(500).json({ success: false, message: 'Error updating Monster Hunter monster' });
  }
}

export async function deleteMonsterHunter(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Monster Hunter monster not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Monster Hunter monster deleted successfully' });
  } catch (error) {
    console.error('Error deleting Monster Hunter monster:', error);
    res.status(500).json({ success: false, message: 'Error deleting Monster Hunter monster' });
  }
}

export async function getElements(_req: Request, res: Response): Promise<void> {
  try {
    const elements = await repo.getElements();
    res.json({ success: true, data: elements });
  } catch (error) {
    console.error('Error getting Monster Hunter elements:', error);
    res.status(500).json({ success: false, message: 'Error getting elements' });
  }
}

export async function getRanks(_req: Request, res: Response): Promise<void> {
  try {
    const ranks = await repo.getRanks();
    res.json({ success: true, data: ranks });
  } catch (error) {
    console.error('Error getting Monster Hunter ranks:', error);
    res.status(500).json({ success: false, message: 'Error getting ranks' });
  }
}
