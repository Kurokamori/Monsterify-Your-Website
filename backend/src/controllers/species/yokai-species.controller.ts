import { Request, Response } from 'express';
import { YokaiSpeciesRepository } from '../../repositories';

const repo = new YokaiSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllYokai(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'tribe' | 'rank') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const tribe = (req.query.tribe as string) || undefined;
    const rank = (req.query.rank as string) || undefined;
    const stage = (req.query.stage as string) || undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      tribe,
      rank,
      stage,
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
    console.error('Error getting Yokai:', error);
    res.status(500).json({ success: false, message: 'Error getting Yokai' });
  }
}

export async function getYokaiById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const yokai = await repo.findById(id);
    if (!yokai) {
      res.status(404).json({ success: false, message: 'Yokai not found' });
      return;
    }

    res.json({ success: true, data: yokai });
  } catch (error) {
    console.error('Error getting Yokai by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Yokai' });
  }
}

export async function createYokai(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const tribe = body.tribe as string | undefined;
    const rank = body.rank as string | undefined;
    const stage = body.stage as string | undefined;

    if (!name || !tribe || !rank || !stage) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, tribe, rank, stage',
      });
      return;
    }

    const yokai = await repo.create({
      name,
      tribe,
      rank,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: yokai, message: 'Yokai created successfully' });
  } catch (error) {
    console.error('Error creating Yokai:', error);
    res.status(500).json({ success: false, message: 'Error creating Yokai' });
  }
}

export async function updateYokai(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Yokai not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const yokai = await repo.update(id, {
      name: body.name as string | undefined,
      tribe: body.tribe as string | undefined,
      rank: body.rank as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage: body.stage as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: yokai, message: 'Yokai updated successfully' });
  } catch (error) {
    console.error('Error updating Yokai:', error);
    res.status(500).json({ success: false, message: 'Error updating Yokai' });
  }
}

export async function deleteYokai(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Yokai not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Yokai deleted successfully' });
  } catch (error) {
    console.error('Error deleting Yokai:', error);
    res.status(500).json({ success: false, message: 'Error deleting Yokai' });
  }
}

export async function getTribes(_req: Request, res: Response): Promise<void> {
  try {
    const tribes = await repo.getTribes();
    res.json({ success: true, data: tribes });
  } catch (error) {
    console.error('Error getting Yokai tribes:', error);
    res.status(500).json({ success: false, message: 'Error getting tribes' });
  }
}

export async function getRanks(_req: Request, res: Response): Promise<void> {
  try {
    const ranks = await repo.getRanks();
    res.json({ success: true, data: ranks });
  } catch (error) {
    console.error('Error getting Yokai ranks:', error);
    res.status(500).json({ success: false, message: 'Error getting ranks' });
  }
}
