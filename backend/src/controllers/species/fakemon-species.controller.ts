import { Request, Response } from 'express';
import { FakemonSpeciesRepository } from '../../repositories';
import { db } from '../../database';

const repo = new FakemonSpeciesRepository();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

export async function getAllFakemon(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'name' | 'number') || 'number';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const type = (req.query.type as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const attribute = (req.query.attribute as string) || undefined;
    const stage = (req.query.stage as string) || undefined;

    const result = await repo.findAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      type,
      category,
      attribute,
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
    console.error('Error getting Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error getting Fakemon' });
  }
}

export async function getFakemonByNumber(req: Request, res: Response): Promise<void> {
  try {
    const number = parseInt(paramToString(req.params.number), 10);
    if (isNaN(number)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const fakemon = await repo.findByNumber(number);
    if (!fakemon) {
      res.status(404).json({ success: false, message: 'Fakemon not found' });
      return;
    }

    const prevNext = await repo.findPrevAndNext(number);

    res.json({
      success: true,
      data: fakemon,
      prev: prevNext.prev,
      next: prevNext.next,
    });
  } catch (error) {
    console.error('Error getting Fakemon by number:', error);
    res.status(500).json({ success: false, message: 'Error getting Fakemon' });
  }
}

export async function getEvolutionChain(req: Request, res: Response): Promise<void> {
  try {
    const number = parseInt(paramToString(req.params.number), 10);
    if (isNaN(number)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const fakemon = await repo.findByNumber(number);
    if (!fakemon) {
      res.status(404).json({ success: false, message: 'Fakemon not found' });
      return;
    }

    const evolutionLine = fakemon.evolutionLine ?? [];
    const chain: Array<Record<string, unknown>> = [];

    for (const entry of evolutionLine) {
      // Support both plain numbers and object entries with metadata
      let evoNumber: number;
      let metadata: Record<string, unknown> = {};

      if (typeof entry === 'number') {
        evoNumber = entry;
      } else if (typeof entry === 'object' && entry !== null) {
        const obj = entry as Record<string, unknown>;
        evoNumber = parseInt(String(obj.number), 10);
        metadata = {
          level: obj.level ? Number(obj.level) : undefined,
          method: obj.method ?? undefined,
          method_detail: obj.method_detail ?? obj.methodDetail ?? undefined,
          evolves_from: obj.evolves_from ?? obj.evolvesFrom ?? undefined,
        };
      } else {
        evoNumber = parseInt(String(entry), 10);
      }

      if (isNaN(evoNumber)) {
        continue;
      }
      const evo = await repo.findByNumber(evoNumber);
      if (evo) {
        chain.push({
          number: evo.number,
          name: evo.name,
          imageUrl: evo.imageUrl,
          type1: evo.type1,
          type2: evo.type2,
          type3: evo.type3,
          type4: evo.type4,
          type5: evo.type5,
          ...metadata,
        });
      }
    }

    // Ensure the current fakemon is included in the chain (as root if not already present)
    const currentInChain = chain.some(c => c.number === fakemon.number);
    if (!currentInChain && chain.length > 0) {
      chain.unshift({
        number: fakemon.number,
        name: fakemon.name,
        imageUrl: fakemon.imageUrl,
        type1: fakemon.type1,
        type2: fakemon.type2,
        type3: fakemon.type3,
        type4: fakemon.type4,
        type5: fakemon.type5,
      });
    }

    res.json({ success: true, data: chain });
  } catch (error) {
    console.error('Error getting evolution chain:', error);
    res.status(500).json({ success: false, message: 'Error getting evolution chain' });
  }
}

export async function getAllTypes(_req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<{ type: string }>(`
      SELECT DISTINCT unnest(ARRAY[type1, type2, type3, type4, type5]) AS type
      FROM fakemon
      WHERE type1 IS NOT NULL
      ORDER BY type
    `);
    const types = result.rows.map((r) => r.type).filter(Boolean);
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error getting Fakemon types:', error);
    res.status(500).json({ success: false, message: 'Error getting types' });
  }
}

export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await repo.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting Fakemon categories:', error);
    res.status(500).json({ success: false, message: 'Error getting categories' });
  }
}

export async function getNumbersByCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = (req.query.category as string) || '';
    if (!category) {
      res.status(400).json({ success: false, message: 'Category parameter is required' });
      return;
    }

    const numbers = await repo.getNumbersByCategory(category);
    res.json({ success: true, data: numbers });
  } catch (error) {
    console.error('Error getting numbers by category:', error);
    res.status(500).json({ success: false, message: 'Error getting numbers by category' });
  }
}

export async function getRandomFakemon(req: Request, res: Response): Promise<void> {
  try {
    const count = parseInt(req.query.count as string) || parseInt(req.query.limit as string) || 1;
    const fakemon = await repo.findRandom(count);
    res.json({ success: true, data: fakemon });
  } catch (error) {
    console.error('Error getting random Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error getting random Fakemon' });
  }
}

export async function searchFakemon(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.query as string) || (req.query.search as string) || '';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      res.status(400).json({ success: false, message: 'Search query is required' });
      return;
    }

    const results = await repo.search(query, limit);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error searching Fakemon' });
  }
}

export async function getNextFakemonNumber(_req: Request, res: Response): Promise<void> {
  try {
    const nextNumber = await repo.getNextNumber();
    res.json({ success: true, data: nextNumber });
  } catch (error) {
    console.error('Error getting next Fakemon number:', error);
    res.status(500).json({ success: false, message: 'Error getting next number' });
  }
}

export async function createFakemon(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const number = body.number as number | undefined;
    const name = body.name as string | undefined;
    const category = body.category as string | undefined;
    const type1 = body.type1 as string | undefined;

    if (number === undefined || !name || !category || !type1) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: number, name, category, type1',
      });
      return;
    }

    const fakemon = await repo.create({
      number: Number(number),
      name,
      category,
      classification: body.classification as string | undefined,
      type1,
      type2: body.type2 as string | undefined,
      type3: body.type3 as string | undefined,
      type4: body.type4 as string | undefined,
      type5: body.type5 as string | undefined,
      attribute: body.attribute as string | undefined,
      description: body.description as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      evolutionLine: body.evolutionLine as unknown[] | undefined,
      ability1: body.ability1 as string | undefined,
      ability2: body.ability2 as string | undefined,
      hiddenAbility: (body.hiddenAbility ?? body.hidden_ability) as string | undefined,
      hp: body.hp !== undefined ? Number(body.hp) : undefined,
      attack: body.attack !== undefined ? Number(body.attack) : undefined,
      defense: body.defense !== undefined ? Number(body.defense) : undefined,
      specialAttack: body.specialAttack !== undefined
        ? Number(body.specialAttack)
        : body.special_attack !== undefined
          ? Number(body.special_attack)
          : undefined,
      specialDefense: body.specialDefense !== undefined
        ? Number(body.specialDefense)
        : body.special_defense !== undefined
          ? Number(body.special_defense)
          : undefined,
      speed: body.speed !== undefined ? Number(body.speed) : undefined,
      stage: body.stage as string | undefined,
      isLegendary: body.is_legendary === true || body.is_legendary === 'true' || body.isLegendary === true,
      isMythical: body.is_mythical === true || body.is_mythical === 'true' || body.isMythical === true,
    });

    res.status(201).json({ success: true, data: fakemon, message: 'Fakemon created successfully' });
  } catch (error) {
    console.error('Error creating Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error creating Fakemon' });
  }
}

export async function updateFakemon(req: Request, res: Response): Promise<void> {
  try {
    const number = parseInt(paramToString(req.params.number), 10);
    if (isNaN(number)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const existing = await repo.findByNumber(number);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Fakemon not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const fakemon = await repo.update(existing.id, {
      number: body.number !== undefined ? Number(body.number) : undefined,
      name: body.name as string | undefined,
      category: body.category as string | undefined,
      classification: body.classification as string | undefined,
      type1: body.type1 as string | undefined,
      type2: body.type2 as string | undefined,
      type3: body.type3 as string | undefined,
      type4: body.type4 as string | undefined,
      type5: body.type5 as string | undefined,
      attribute: body.attribute as string | undefined,
      description: body.description as string | undefined,
      imageUrl: (body.imageUrl ?? body.image_url) as string | undefined,
      evolutionLine: body.evolutionLine as unknown[] | undefined,
      ability1: body.ability1 as string | undefined,
      ability2: body.ability2 as string | undefined,
      hiddenAbility: (body.hiddenAbility ?? body.hidden_ability) as string | undefined,
      hp: body.hp !== undefined ? Number(body.hp) : undefined,
      attack: body.attack !== undefined ? Number(body.attack) : undefined,
      defense: body.defense !== undefined ? Number(body.defense) : undefined,
      specialAttack: body.specialAttack !== undefined
        ? Number(body.specialAttack)
        : body.special_attack !== undefined
          ? Number(body.special_attack)
          : undefined,
      specialDefense: body.specialDefense !== undefined
        ? Number(body.specialDefense)
        : body.special_defense !== undefined
          ? Number(body.special_defense)
          : undefined,
      speed: body.speed !== undefined ? Number(body.speed) : undefined,
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
    });

    res.json({ success: true, data: fakemon, message: 'Fakemon updated successfully' });
  } catch (error) {
    console.error('Error updating Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error updating Fakemon' });
  }
}

export async function deleteFakemon(req: Request, res: Response): Promise<void> {
  try {
    const number = parseInt(paramToString(req.params.number), 10);
    if (isNaN(number)) {
      res.status(400).json({ success: false, message: 'Invalid number' });
      return;
    }

    const existing = await repo.findByNumber(number);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Fakemon not found' });
      return;
    }

    await repo.delete(existing.id);
    res.json({ success: true, message: 'Fakemon deleted successfully' });
  } catch (error) {
    console.error('Error deleting Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error deleting Fakemon' });
  }
}

export async function bulkCreateFakemon(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const items = body.fakemon as Record<string, unknown>[] | undefined;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of fakemon' });
      return;
    }

    const createInputs = items.map((item) => ({
      number: Number(item.number),
      name: item.name as string,
      category: item.category as string,
      classification: item.classification as string | undefined,
      type1: item.type1 as string,
      type2: item.type2 as string | undefined,
      type3: item.type3 as string | undefined,
      type4: item.type4 as string | undefined,
      type5: item.type5 as string | undefined,
      attribute: item.attribute as string | undefined,
      description: item.description as string | undefined,
      imageUrl: (item.imageUrl ?? item.image_url) as string | undefined,
      evolutionLine: item.evolutionLine as unknown[] | undefined,
      ability1: item.ability1 as string | undefined,
      ability2: item.ability2 as string | undefined,
      hiddenAbility: (item.hiddenAbility ?? item.hidden_ability) as string | undefined,
      hp: item.hp !== undefined ? Number(item.hp) : undefined,
      attack: item.attack !== undefined ? Number(item.attack) : undefined,
      defense: item.defense !== undefined ? Number(item.defense) : undefined,
      specialAttack: item.specialAttack !== undefined ? Number(item.specialAttack) : undefined,
      specialDefense: item.specialDefense !== undefined ? Number(item.specialDefense) : undefined,
      speed: item.speed !== undefined ? Number(item.speed) : undefined,
      stage: item.stage as string | undefined,
      isLegendary: item.is_legendary === true || item.isLegendary === true,
      isMythical: item.is_mythical === true || item.isMythical === true,
    }));

    const created = await repo.bulkCreate(createInputs);

    res.status(201).json({
      success: true,
      data: created,
      message: `Successfully created ${created.length} Fakemon`,
    });
  } catch (error) {
    console.error('Error bulk creating Fakemon:', error);
    res.status(500).json({ success: false, message: 'Error bulk creating Fakemon' });
  }
}
