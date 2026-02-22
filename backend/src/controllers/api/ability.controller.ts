import { Request, Response } from 'express';
import { AbilityService } from '../../services/ability.service';

const abilityService = new AbilityService();

// ============================================================================
// Controllers
// ============================================================================

/**
 * Get all abilities with filtering, search, and pagination
 * GET /api/abilities
 */
export async function getAbilities(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      monsterSearch,
      types,
      typeLogic = 'OR',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      monsterSearch?: string;
      types?: string;
      typeLogic?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const parsedTypes = types ? types.split(',').filter(Boolean) : undefined;

    const result = await abilityService.getAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search ?? undefined,
      monsterSearch: monsterSearch ?? undefined,
      types: parsedTypes,
      typeLogic: typeLogic === 'AND' ? 'AND' : 'OR',
      sortBy: sortBy === 'effect' ? 'effect' : 'name',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
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
    console.error('Error getting abilities:', error);
    res.status(500).json({ success: false, message: 'Error getting abilities' });
  }
}

/**
 * Get all unique ability types
 * GET /api/abilities/types
 */
export async function getAbilityTypes(_req: Request, res: Response): Promise<void> {
  try {
    const types = await abilityService.getAllTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error getting ability types:', error);
    res.status(500).json({ success: false, message: 'Error getting ability types' });
  }
}

/**
 * Get ability names for autocomplete
 * GET /api/abilities/names
 */
export async function getAbilityNames(_req: Request, res: Response): Promise<void> {
  try {
    const names = await abilityService.getAllNames();
    res.json({ success: true, abilities: names });
  } catch (error) {
    console.error('Error getting ability names:', error);
    res.status(500).json({ success: false, message: 'Error getting ability names' });
  }
}

/**
 * Get ability by name
 * GET /api/abilities/:name
 */
export async function getAbilityByName(req: Request, res: Response): Promise<void> {
  try {
    const name = decodeURIComponent(req.params.name as string);

    if (!name) {
      res.status(400).json({ success: false, message: 'Ability name is required' });
      return;
    }

    const ability = await abilityService.getByName(name);

    if (!ability) {
      res.status(404).json({ success: false, message: 'Ability not found' });
      return;
    }

    res.json({ success: true, data: ability });
  } catch (error) {
    console.error('Error getting ability by name:', error);
    res.status(500).json({ success: false, message: 'Error getting ability' });
  }
}
