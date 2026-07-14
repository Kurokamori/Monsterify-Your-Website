import { Request, Response } from 'express';
import { PalsSpeciesRepository } from '../../repositories';
import { importPalsFromWiki, refreshPalImages } from '../../services';

const repo = new PalsSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllPals(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'id') || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
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
    console.error('Error getting Pals:', error);
    res.status(500).json({ success: false, message: 'Error getting Pals' });
  }
}

export async function getPalsById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const pal = await repo.findById(id);
    if (!pal) {
      res.status(404).json({ success: false, message: 'Pal not found' });
      return;
    }

    res.json({ success: true, data: pal });
  } catch (error) {
    console.error('Error getting Pal by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Pal' });
  }
}

export async function createPals(req: Request, res: Response): Promise<void> {
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

    const pal = await repo.create({
      name,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: pal, message: 'Pal created successfully' });
  } catch (error) {
    console.error('Error creating Pal:', error);
    res.status(500).json({ success: false, message: 'Error creating Pal' });
  }
}

export async function updatePals(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pal not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const pal = await repo.update(id, {
      name: body.name as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: pal, message: 'Pal updated successfully' });
  } catch (error) {
    console.error('Error updating Pal:', error);
    res.status(500).json({ success: false, message: 'Error updating Pal' });
  }
}

export async function importPals(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const dryRun = body.dryRun === true || req.query.dryRun === 'true';

    const summary = await importPalsFromWiki({ dryRun });

    res.json({
      success: true,
      data: summary,
      message: summary.dryRun
        ? `Dry run: ${summary.added.length} new Pal(s) would be imported.`
        : `Imported ${summary.added.length} new Pal(s).`,
    });
  } catch (error) {
    console.error('Error importing Pals from wiki:', error);
    res.status(500).json({ success: false, message: 'Error importing Pals from wiki' });
  }
}

export async function refreshPalImagesHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const dryRun = body.dryRun === true || req.query.dryRun === 'true';

    const summary = await refreshPalImages({ dryRun });

    const promoted = summary.updated.filter((change) => change.source === 'self-hosted').length;

    res.json({
      success: true,
      data: summary,
      message: summary.dryRun
        ? `Dry run: ${summary.updated.length} Pal image(s) would be updated (${promoted} promoted to self-hosted artwork).`
        : `Updated ${summary.updated.length} Pal image(s) (${promoted} promoted to self-hosted artwork).`,
    });
  } catch (error) {
    console.error('Error refreshing Pal images:', error);
    res.status(500).json({ success: false, message: 'Error refreshing Pal images' });
  }
}

export async function deletePals(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pal not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Pal deleted successfully' });
  } catch (error) {
    console.error('Error deleting Pal:', error);
    res.status(500).json({ success: false, message: 'Error deleting Pal' });
  }
}
