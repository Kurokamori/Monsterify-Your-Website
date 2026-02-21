import { Request, Response } from 'express';
import { NexomonSpeciesRepository } from '../../repositories';

const repo = new NexomonSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllNexomon(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'nr') || 'nr';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const type = (req.query.type as string) || undefined;
    const stage = (req.query.stage as string) || undefined;

    const legendaryParam = req.query.legendary as string;
    const legendary = legendaryParam === '' || legendaryParam === undefined ? undefined : legendaryParam === 'true';

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      type,
      legendary,
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
    console.error('Error getting Nexomon:', error);
    res.status(500).json({ success: false, message: 'Error getting Nexomon' });
  }
}

export async function getNexomonByNr(req: Request, res: Response): Promise<void> {
  try {
    const nr = parseInt(paramToString(req.params.nr), 10);
    if (isNaN(nr)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const nexomon = await repo.findByNr(nr);
    if (!nexomon) {
      res.status(404).json({ success: false, message: 'Nexomon not found' });
      return;
    }

    res.json({ success: true, data: nexomon });
  } catch (error) {
    console.error('Error getting Nexomon by number:', error);
    res.status(500).json({ success: false, message: 'Error getting Nexomon' });
  }
}

export async function createNexomon(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const nr = body.nr as number | undefined;
    const name = body.name as string | undefined;
    const typePrimary = (body.typePrimary ?? body.type_primary) as string | undefined;
    const stage = body.stage as string | undefined;

    if (nr === undefined || !name || !typePrimary || !stage) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: nr, name, typePrimary, stage',
      });
      return;
    }

    const nexomon = await repo.create({
      nr: Number(nr),
      name,
      isLegendary: body.is_legendary === true || body.is_legendary === 'true' || body.isLegendary === true,
      typePrimary,
      typeSecondary: (body.typeSecondary ?? body.type_secondary) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: nexomon, message: 'Nexomon created successfully' });
  } catch (error) {
    console.error('Error creating Nexomon:', error);
    res.status(500).json({ success: false, message: 'Error creating Nexomon' });
  }
}

export async function updateNexomon(req: Request, res: Response): Promise<void> {
  try {
    const nr = parseInt(paramToString(req.params.nr), 10);
    if (isNaN(nr)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const existing = await repo.findByNr(nr);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Nexomon not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const nexomon = await repo.update(existing.nr, {
      name: body.name as string | undefined,
      isLegendary: body.is_legendary !== undefined
        ? body.is_legendary === true || body.is_legendary === 'true'
        : body.isLegendary !== undefined
          ? body.isLegendary === true
          : undefined,
      typePrimary: (body.typePrimary ?? body.type_primary) as string | undefined,
      typeSecondary: (body.typeSecondary ?? body.type_secondary) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage: body.stage as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: nexomon, message: 'Nexomon updated successfully' });
  } catch (error) {
    console.error('Error updating Nexomon:', error);
    res.status(500).json({ success: false, message: 'Error updating Nexomon' });
  }
}

export async function deleteNexomon(req: Request, res: Response): Promise<void> {
  try {
    const nr = parseInt(paramToString(req.params.nr), 10);
    if (isNaN(nr)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const existing = await repo.findByNr(nr);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Nexomon not found' });
      return;
    }

    await repo.delete(existing.nr);
    res.json({ success: true, message: 'Nexomon deleted successfully' });
  } catch (error) {
    console.error('Error deleting Nexomon:', error);
    res.status(500).json({ success: false, message: 'Error deleting Nexomon' });
  }
}
