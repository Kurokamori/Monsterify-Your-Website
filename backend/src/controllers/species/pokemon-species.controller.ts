import { Request, Response } from 'express';
import { PokemonSpeciesRepository } from '../../repositories';

const repo = new PokemonSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllPokemon(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'ndex') || 'ndex';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const type = (req.query.type as string) || undefined;
    const stage = (req.query.stage as string) || undefined;

    const legendaryParam = req.query.legendary as string;
    const legendary = legendaryParam === '' || legendaryParam === undefined ? undefined : legendaryParam === 'true';

    const mythicalParam = req.query.mythical as string;
    const mythical = mythicalParam === '' || mythicalParam === undefined ? undefined : mythicalParam === 'true';

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      type,
      legendary,
      mythical,
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
    console.error('Error getting Pokemon:', error);
    res.status(500).json({ success: false, message: 'Error getting Pokemon' });
  }
}

export async function getPokemonById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const pokemon = await repo.findById(id);
    if (!pokemon) {
      res.status(404).json({ success: false, message: 'Pokemon not found' });
      return;
    }

    res.json({ success: true, data: pokemon });
  } catch (error) {
    console.error('Error getting Pokemon by ID:', error);
    res.status(500).json({ success: false, message: 'Error getting Pokemon' });
  }
}

export async function createPokemon(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const ndex = body.ndex as number | undefined;
    const typePrimary = (body.typePrimary ?? body.type_primary) as string | undefined;
    const stage = body.stage as string | undefined;

    if (!name || ndex === undefined || !typePrimary || !stage) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, ndex, typePrimary, stage',
      });
      return;
    }

    const pokemon = await repo.create({
      name,
      ndex: Number(ndex),
      typePrimary,
      typeSecondary: (body.typeSecondary ?? body.type_secondary) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage,
      isLegendary: body.is_legendary === true || body.is_legendary === 'true' || body.isLegendary === true,
      isMythical: body.is_mythical === true || body.is_mythical === 'true' || body.isMythical === true,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.status(201).json({ success: true, data: pokemon, message: 'Pokemon created successfully' });
  } catch (error) {
    console.error('Error creating Pokemon:', error);
    res.status(500).json({ success: false, message: 'Error creating Pokemon' });
  }
}

export async function updatePokemon(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pokemon not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const pokemon = await repo.update(id, {
      name: body.name as string | undefined,
      ndex: body.ndex !== undefined ? Number(body.ndex) : undefined,
      typePrimary: (body.typePrimary ?? body.type_primary) as string | undefined,
      typeSecondary: (body.typeSecondary ?? body.type_secondary) as string | undefined,
      evolvesFrom: (body.evolvesFrom ?? body.evolves_from) as string | undefined,
      evolvesTo: (body.evolvesTo ?? body.evolves_to) as string | undefined,
      breedingResults: (body.breedingResults ?? body.breeding_results) as string | undefined,
      stage: body.stage as string | undefined,
      isLegendary: body.is_legendary !== undefined
        ? body.is_legendary === true || body.is_legendary === 'true'
        : body.isLegendary !== undefined
          ? body.isLegendary === true
          : undefined,
      isMythical: body.is_mythical !== undefined
        ? body.is_mythical === true || body.is_mythical === 'true'
        : body.isMythical !== undefined
          ? body.isMythical === true
          : undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
    });

    res.json({ success: true, data: pokemon, message: 'Pokemon updated successfully' });
  } catch (error) {
    console.error('Error updating Pokemon:', error);
    res.status(500).json({ success: false, message: 'Error updating Pokemon' });
  }
}

export async function deletePokemon(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pokemon not found' });
      return;
    }

    await repo.delete(id);
    res.json({ success: true, message: 'Pokemon deleted successfully' });
  } catch (error) {
    console.error('Error deleting Pokemon:', error);
    res.status(500).json({ success: false, message: 'Error deleting Pokemon' });
  }
}
