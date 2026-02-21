import { Request, Response } from 'express';
import { FinalFantasySpeciesRepository } from '../../repositories';

const repo = new FinalFantasySpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllFinalFantasy(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'stage') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const stage = (req.query.stage as string) || undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
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
    console.error('Error getting Final Fantasy monsters:', error);
    res.status(500).json({ success: false, message: 'Error getting Final Fantasy monsters' });
  }
}

export async function getFinalFantasyById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const monster = await repo.findById(id);
    if (!monster) {
      res.status(404).json({ success: false, message: 'Final Fantasy monster not found' });
      return;
    }

    res.json({ success: true, data: monster });
  } catch (error) {
    console.error('Error getting Final Fantasy monster by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Final Fantasy monster' });
  }
}

export async function createFinalFantasy(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const stage = body.stage as string | undefined;

    if (!name || !stage) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, stage',
      });
      return;
    }

    const monster = await repo.create({
      name,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      stage,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
    });

    res.status(201).json({ success: true, data: monster, message: 'Final Fantasy monster created successfully' });
  } catch (error) {
    console.error('Error creating Final Fantasy monster:', error);
    res.status(500).json({ success: false, message: 'Error creating Final Fantasy monster' });
  }
}

export async function updateFinalFantasy(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Final Fantasy monster not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const monster = await repo.update(id, {
      name: body.name as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      stage: body.stage as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
    });

    res.json({ success: true, data: monster, message: 'Final Fantasy monster updated successfully' });
  } catch (error) {
    console.error('Error updating Final Fantasy monster:', error);
    res.status(500).json({ success: false, message: 'Error updating Final Fantasy monster' });
  }
}

export async function deleteFinalFantasy(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Final Fantasy monster not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Final Fantasy monster deleted successfully' });
  } catch (error) {
    console.error('Error deleting Final Fantasy monster:', error);
    res.status(500).json({ success: false, message: 'Error deleting Final Fantasy monster' });
  }
}

export async function getStages(_req: Request, res: Response): Promise<void> {
  try {
    const stages = await repo.getStages();
    res.json({ success: true, data: stages });
  } catch (error) {
    console.error('Error getting Final Fantasy stages:', error);
    res.status(500).json({ success: false, message: 'Error getting stages' });
  }
}
