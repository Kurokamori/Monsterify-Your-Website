import { Request, Response } from 'express';
import { DigimonSpeciesRepository } from '../../repositories';

const repo = new DigimonSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllDigimon(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'rank') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const rank = (req.query.rank as string) || undefined;
    const attribute = (req.query.attribute as string) || undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      rank,
      attribute,
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
    console.error('Error getting Digimon:', error);
    res.status(500).json({ success: false, message: 'Error getting Digimon' });
  }
}

export async function getDigimonById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const digimon = await repo.findById(id);
    if (!digimon) {
      res.status(404).json({ success: false, message: 'Digimon not found' });
      return;
    }

    res.json({ success: true, data: digimon });
  } catch (error) {
    console.error('Error getting Digimon by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Digimon' });
  }
}

export async function createDigimon(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const rank = body.rank as string | undefined;
    const attribute = body.attribute as string | undefined;

    if (!name || !rank || !attribute) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, rank, attribute',
      });
      return;
    }

    const digimon = await repo.create({
      name,
      rank,
      levelRequired: body.level_required !== undefined
        ? Number(body.level_required)
        : (body.levelRequired as number | undefined),
      attribute,
      families: body.families as string | undefined,
      digimonType: (body.digimonType ?? body.digimon_type) as string | undefined,
      naturalAttributes: (body.naturalAttributes ?? body.natural_attributes) as string | undefined,
      digivolvesFrom: (body.digivolvesFrom ?? body.digivolves_from) as string | undefined,
      digivolvesTo: (body.digivolvesTo ?? body.digivolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: digimon, message: 'Digimon created successfully' });
  } catch (error) {
    console.error('Error creating Digimon:', error);
    res.status(500).json({ success: false, message: 'Error creating Digimon' });
  }
}

export async function updateDigimon(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Digimon not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const digimon = await repo.update(id, {
      name: body.name as string | undefined,
      rank: body.rank as string | undefined,
      levelRequired: body.level_required !== undefined
        ? Number(body.level_required)
        : (body.levelRequired as number | undefined),
      attribute: body.attribute as string | undefined,
      families: body.families as string | undefined,
      digimonType: (body.digimonType ?? body.digimon_type) as string | undefined,
      naturalAttributes: (body.naturalAttributes ?? body.natural_attributes) as string | undefined,
      digivolvesFrom: (body.digivolvesFrom ?? body.digivolves_from) as string | undefined,
      digivolvesTo: (body.digivolvesTo ?? body.digivolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: digimon, message: 'Digimon updated successfully' });
  } catch (error) {
    console.error('Error updating Digimon:', error);
    res.status(500).json({ success: false, message: 'Error updating Digimon' });
  }
}

export async function deleteDigimon(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Digimon not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Digimon deleted successfully' });
  } catch (error) {
    console.error('Error deleting Digimon:', error);
    res.status(500).json({ success: false, message: 'Error deleting Digimon' });
  }
}

export async function getRanks(_req: Request, res: Response): Promise<void> {
  try {
    const ranks = await repo.getRanks();
    res.json({ success: true, data: ranks });
  } catch (error) {
    console.error('Error getting Digimon ranks:', error);
    res.status(500).json({ success: false, message: 'Error getting ranks' });
  }
}

export async function getAttributes(_req: Request, res: Response): Promise<void> {
  try {
    const attributes = await repo.getAttributes();
    res.json({ success: true, data: attributes });
  } catch (error) {
    console.error('Error getting Digimon attributes:', error);
    res.status(500).json({ success: false, message: 'Error getting attributes' });
  }
}
