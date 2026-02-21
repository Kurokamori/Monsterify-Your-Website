import { Request, Response } from 'express';
import { db } from '../../database';
import { UserRepository } from '../../repositories';
import { DEFAULT_MONSTER_ROLLER_SETTINGS, MonsterRollerSettings } from '../../utils/types/user.types';

const userRepository = new UserRepository();

// Allowed species tables (used for image lookups)
const SPECIES_TABLES = [
  'pokemon_monsters',
  'digimon_monsters',
  'yokai_monsters',
  'nexomon_monsters',
  'pals_monsters',
  'fakemon',
  'finalfantasy_monsters',
  'monsterhunter_monsters',
] as const;

/**
 * Look up image URLs for an array of species names across all monster tables.
 * Returns a map of species name → { image_url }.
 */
async function lookupSpeciesImages(
  speciesArray: string[],
): Promise<Record<string, { image_url: string | null }>> {
  const speciesImages: Record<string, { image_url: string | null }> = {};

  for (const speciesName of speciesArray) {
    let found = false;

    for (const table of SPECIES_TABLES) {
      const result = await db.query<{ name: string; image_url: string | null }>(
        `SELECT name, image_url FROM ${table} WHERE name = $1`,
        [speciesName],
      );
      const row = result.rows[0];
      if (row?.image_url) {
        speciesImages[speciesName] = { image_url: row.image_url };
        found = true;
        break;
      }
    }

    if (!found) {
      speciesImages[speciesName] = { image_url: null };
    }
  }

  return speciesImages;
}

/**
 * Build and execute a random species roll query respecting user's roller settings.
 */
async function rollRandomSpecies(
  req: Request,
  count: number,
): Promise<string[]> {
  let settings: MonsterRollerSettings = { ...DEFAULT_MONSTER_ROLLER_SETTINGS };

  // Check if user is authenticated and has custom settings
  if (req.user?.discord_id) {
    try {
      const dbUser = await userRepository.findByDiscordId(req.user.discord_id);
      if (dbUser?.monster_roller_settings) {
        const parsed = typeof dbUser.monster_roller_settings === 'string'
          ? JSON.parse(dbUser.monster_roller_settings) as Partial<MonsterRollerSettings>
          : dbUser.monster_roller_settings as Partial<MonsterRollerSettings>;
        settings = { ...settings, ...parsed };
      }
    } catch (err) {
      console.error('Error getting user settings for species roll:', err);
    }
  }

  const queryParts: string[] = [];

  if (settings.pokemonEnabled) {
    queryParts.push(`
      SELECT name FROM pokemon_monsters
      WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
        AND is_legendary::boolean = false
        AND is_mythical::boolean = false
    `);
  }

  if (settings.digimonEnabled) {
    queryParts.push(`
      SELECT name FROM digimon_monsters
      WHERE rank IN ('Baby I', 'Baby II')
    `);
  }

  if (settings.yokaiEnabled) {
    queryParts.push(`
      SELECT name FROM yokai_monsters
      WHERE rank IN ('E', 'D', 'C')
        AND (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
    `);
  }

  if (settings.nexomonEnabled) {
    queryParts.push(`
      SELECT name FROM nexomon_monsters
      WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
        AND is_legendary::boolean = false
    `);
  }

  if (settings.palsEnabled) {
    queryParts.push(`SELECT name FROM pals_monsters`);
  }

  if (settings.fakemonEnabled) {
    queryParts.push(`
      SELECT name FROM fakemon
      WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
        AND is_legendary::boolean = false
        AND is_mythical::boolean = false
    `);
  }

  if (settings.finalfantasyEnabled) {
    queryParts.push(`
      SELECT name FROM finalfantasy_monsters
      WHERE stage = 'base stage' OR stage = 'doesn''t evolve'
    `);
  }

  if (settings.monsterhunterEnabled) {
    queryParts.push(`
      SELECT name FROM monsterhunter_monsters
      WHERE rank IN ('1', '2', '3')
    `);
  }

  if (queryParts.length === 0) {
    return [];
  }

  const query = `
    SELECT name FROM (
      ${queryParts.join(' UNION ')}
    ) AS random_species
    ORDER BY RANDOM()
    LIMIT $1
  `;

  const result = await db.query<{ name: string }>(query, [count]);
  return result.rows.map((r) => r.name);
}

// =============================================================================
// GET endpoints (query-param based)
// =============================================================================

export async function getSpeciesImages(req: Request, res: Response): Promise<void> {
  try {
    const speciesParam = req.query.species as string;
    if (!speciesParam) {
      res.status(400).json({ success: false, message: 'Species parameter is required' });
      return;
    }

    const speciesArray = speciesParam.split(',');
    const speciesImages = await lookupSpeciesImages(speciesArray);

    // Legacy format: array of { species, url }
    const images = Object.entries(speciesImages).map(([species, data]) => ({
      species,
      url: data.image_url,
    }));

    res.json({ success: true, images });
  } catch (error) {
    console.error('Error getting species images:', error);
    res.status(500).json({ success: false, message: 'Error getting species images' });
  }
}

export async function getRandomSpecies(req: Request, res: Response): Promise<void> {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const species = await rollRandomSpecies(req, count);

    if (species.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No monster tables are enabled in your settings',
      });
      return;
    }

    res.json({ success: true, species });
  } catch (error) {
    console.error('Error getting random species:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// =============================================================================
// POST endpoints (body-based, used by town components)
// =============================================================================

export async function rollSpecies(req: Request, res: Response): Promise<void> {
  try {
    const { count: bodyCount } = req.body as { count?: number };
    const count = bodyCount ?? 10;
    const species = await rollRandomSpecies(req, count);

    if (species.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No monster tables are enabled in your settings',
      });
      return;
    }

    res.json({ success: true, species });
  } catch (error) {
    console.error('Error rolling species:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function postSpeciesImages(req: Request, res: Response): Promise<void> {
  try {
    const { species } = req.body as { species?: string[] };

    if (!species || !Array.isArray(species) || species.length === 0) {
      res.status(400).json({ success: false, message: 'Species array is required' });
      return;
    }

    const speciesImages = await lookupSpeciesImages(species);
    res.json({ success: true, speciesImages });
  } catch (error) {
    console.error('Error getting species images:', error);
    res.status(500).json({ success: false, message: 'Error getting species images' });
  }
}

export async function getSpeciesList(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const search = (req.query.search as string) || '';

    let query = `
      SELECT name FROM (
        SELECT name FROM pokemon_monsters
        UNION
        SELECT name FROM digimon_monsters
        UNION
        SELECT name FROM nexomon_monsters
        UNION
        SELECT name FROM yokai_monsters
        UNION
        SELECT name FROM pals_monsters
        UNION
        SELECT name FROM fakemon
        UNION
        SELECT name FROM finalfantasy_monsters
        UNION
        SELECT name FROM monsterhunter_monsters
      ) AS all_species
    `;

    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE name ILIKE $${params.length}`;
    }

    query += ' ORDER BY name';
    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await db.query<{ name: string }>(query, params);
    res.json({
      success: true,
      species: result.rows.map((r) => r.name),
    });
  } catch (error) {
    console.error('Error getting species list:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function searchSpecies(req: Request, res: Response): Promise<void> {
  try {
    const search = (req.query.search as string) || (req.query.query as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!search) {
      res.status(400).json({ success: false, message: 'Search term is required' });
      return;
    }

    const query = `
      SELECT name FROM (
        SELECT name FROM pokemon_monsters
        UNION
        SELECT name FROM digimon_monsters
        UNION
        SELECT name FROM nexomon_monsters
        UNION
        SELECT name FROM yokai_monsters
        UNION
        SELECT name FROM pals_monsters
        UNION
        SELECT name FROM fakemon
        UNION
        SELECT name FROM finalfantasy_monsters
        UNION
        SELECT name FROM monsterhunter_monsters
      ) AS all_species
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2
    `;

    const result = await db.query<{ name: string }>(query, [`%${search}%`, limit]);
    res.json({
      success: true,
      species: result.rows.map((r) => r.name),
    });
  } catch (error) {
    console.error('Error searching species:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
