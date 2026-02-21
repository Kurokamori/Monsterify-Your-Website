import { Request, Response } from 'express';
import { MonsterService } from '../../services/monster.service';

const monsterService = new MonsterService();

// =============================================================================
// Monster CRUD
// =============================================================================

export async function getAllMonsters(_req: Request, res: Response): Promise<void> {
  try {
    const monsters = await monsterService.getAllMonsters();
    res.json({ success: true, count: monsters.length, data: monsters });
  } catch (error) {
    console.error('Error in getAllMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function searchMonsters(req: Request, res: Response): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await monsterService.searchMonsters(search ?? '', limit);
    res.json({ success: true, count: result.count, data: result.data });
  } catch (error) {
    console.error('Error in searchMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getMonsterById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const monster = await monsterService.getMonsterById(id);

    if (!monster) {
      res.status(404).json({ success: false, message: `Monster with ID ${id} not found` });
      return;
    }

    // Get images and evolution data
    const [images, evolutionData] = await Promise.all([
      monsterService.getMonsterImages(id),
      monsterService.getEvolutionData(id),
    ]);

    const monsterWithDetails = {
      ...monster,
      images,
      evolution_data: evolutionData?.evolution_data ?? null,
    };

    res.json({ success: true, data: monsterWithDetails });
  } catch (error) {
    console.error('Error in getMonsterById:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getMonstersByUserId(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.params.userId as string) ?? req.user?.discord_id;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const monsters = await monsterService.getMonstersByUserId(userId);
    res.json({ success: true, count: monsters.length, data: monsters });
  } catch (error) {
    console.error('Error in getMonstersByUserId:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getMonstersByTrainerId(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);

    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Valid trainer ID is required' });
      return;
    }

    const monsters = await monsterService.getMonstersByTrainerId(trainerId);
    res.json({ success: true, count: monsters.length, monsters });
  } catch (error) {
    console.error('Error in getMonstersByTrainerId:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function createMonster(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      trainer_id?: number;
      name?: string;
      species1?: string;
      type1?: string;
      [key: string]: unknown;
    };

    if (!body.trainer_id) {
      res.status(400).json({ success: false, message: 'trainer_id is required' });
      return;
    }

    const monster = await monsterService.createMonster(
      {
        trainerId: body.trainer_id,
        name: body.name ?? 'New Monster',
        species1: body.species1 ?? '',
        type1: body.type1 ?? '',
        species2: body.species2 as string | undefined,
        species3: body.species3 as string | undefined,
        type2: body.type2 as string | undefined,
        type3: body.type3 as string | undefined,
        type4: body.type4 as string | undefined,
        type5: body.type5 as string | undefined,
        attribute: body.attribute as string | undefined,
        level: body.level as number | undefined,
        imgLink: body.img_link as string | undefined,
        shiny: body.shiny as boolean | undefined,
        alpha: body.alpha as boolean | undefined,
        shadow: body.shadow as boolean | undefined,
        paradox: body.paradox as boolean | undefined,
        pokerus: body.pokerus as boolean | undefined,
      },
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );

    res.status(201).json({ success: true, data: monster });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in createMonster:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateMonster(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const body = req.body as Record<string, unknown>;

    // Map snake_case body to camelCase input
    const input: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      name: 'name', species1: 'species1', species2: 'species2', species3: 'species3',
      type1: 'type1', type2: 'type2', type3: 'type3', type4: 'type4', type5: 'type5',
      attribute: 'attribute', level: 'level',
      hp_total: 'hpTotal', hp_iv: 'hpIv', hp_ev: 'hpEv',
      atk_total: 'atkTotal', atk_iv: 'atkIv', atk_ev: 'atkEv',
      def_total: 'defTotal', def_iv: 'defIv', def_ev: 'defEv',
      spa_total: 'spaTotal', spa_iv: 'spaIv', spa_ev: 'spaEv',
      spd_total: 'spdTotal', spd_iv: 'spdIv', spd_ev: 'spdEv',
      spe_total: 'speTotal', spe_iv: 'speIv', spe_ev: 'speEv',
      nature: 'nature', characteristic: 'characteristic', gender: 'gender',
      friendship: 'friendship', ability1: 'ability1', ability2: 'ability2',
      moveset: 'moveset', img_link: 'imgLink', date_met: 'dateMet',
      where_met: 'whereMet', box_number: 'boxNumber', trainer_index: 'trainerIndex',
      shiny: 'shiny', alpha: 'alpha', shadow: 'shadow', paradox: 'paradox', pokerus: 'pokerus',
      pronouns: 'pronouns', height: 'height', weight: 'weight',
      held_item: 'heldItem', seal: 'seal', mark: 'mark',
      tldr: 'tldr', bio: 'bio', likes: 'likes', dislikes: 'dislikes', lore: 'lore',
      fun_facts: 'funFacts', relations: 'relations',
      ability: 'ability', age: 'age', acquired: 'acquired', ball: 'ball',
      main_ref: 'mainRef', biography: 'biography',
      mega_species1: 'megaSpecies1', mega_species2: 'megaSpecies2', mega_species3: 'megaSpecies3',
      mega_type1: 'megaType1', mega_type2: 'megaType2',
      mega_ability: 'megaAbility', mega_stat_bonus: 'megaStatBonus',
      mega_stone_name: 'megaStoneName', has_mega_stone: 'hasMegaStone',
      mega_img_link: 'megaImgLink', mega_stone_img: 'megaStoneImg',
    };

    for (const [snakeKey, camelKey] of Object.entries(fieldMap)) {
      if (body[snakeKey] !== undefined) {
        input[camelKey] = body[snakeKey];
      }
    }

    const updatedMonster = await monsterService.updateMonster(
      id,
      input,
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );

    res.json({ success: true, data: updatedMonster });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in updateMonster:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteMonster(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    await monsterService.deleteMonster(
      id,
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );
    res.json({ success: true, message: `Monster with ID ${id} deleted` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in deleteMonster:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Images
// =============================================================================

export async function addMonsterImage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const image = await monsterService.addMonsterImage(
      id,
      req.body as { image_url: string; image_type?: string; order_index?: number },
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in addMonsterImage:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getMonsterImages(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const images = await monsterService.getMonsterImages(id);
    res.json({ success: true, count: images.length, data: images });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMonsterImages:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function uploadMonsterImage(req: Request, res: Response): Promise<void> {
  try {
    // In TS backend, we handle file uploads differently.
    // The frontend should provide the image URL directly (e.g., after uploading to Cloudinary client-side).
    const { image_url } = req.body as { image_url?: string };
    if (!image_url) {
      res.status(400).json({ success: false, message: 'image_url is required' });
      return;
    }

    res.json({
      success: true,
      data: { url: image_url },
      message: 'Image URL registered successfully',
    });
  } catch (error) {
    console.error('Error in uploadMonsterImage:', error);
    res.status(500).json({ success: false, message: 'Error uploading image' });
  }
}

export async function getMegaImages(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const megaImages = await monsterService.getMegaImages(id);
    res.json({ success: true, data: megaImages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMegaImages:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function addMegaStoneImage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { image_url } = req.body as { image_url?: string };

    if (!image_url) {
      res.status(400).json({ success: false, message: 'image_url is required' });
      return;
    }

    const image = await monsterService.addMegaStoneImage(
      id,
      image_url,
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );
    res.status(201).json({ success: true, data: image, message: 'Mega stone image added successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in addMegaStoneImage:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function addMegaImage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { image_url } = req.body as { image_url?: string };

    if (!image_url) {
      res.status(400).json({ success: false, message: 'image_url is required' });
      return;
    }

    const image = await monsterService.addMegaImage(
      id,
      image_url,
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );
    res.status(201).json({ success: true, data: image, message: 'Mega image added successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in addMegaImage:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Evolution
// =============================================================================

export async function setMonsterEvolutionData(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { evolution_data } = req.body as { evolution_data?: object };

    if (!evolution_data) {
      res.status(400).json({ success: false, message: 'evolution_data is required' });
      return;
    }

    const data = await monsterService.setEvolutionData(
      id,
      evolution_data,
      req.user?.discord_id ?? undefined,
      req.user?.is_admin,
    );
    res.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in setMonsterEvolutionData:', error);
    if (msg.includes('Not authorized')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getMonsterEvolutionData(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const data = await monsterService.getEvolutionData(id);
    res.json({ success: true, data: data ?? { evolution_data: [] } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMonsterEvolutionData:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getMonsterEvolutionChain(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const chain = await monsterService.getEvolutionChain(id);
    res.json({ success: true, data: chain });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMonsterEvolutionChain:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Moves, Gallery, References
// =============================================================================

export async function getMonsterMoves(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const moves = await monsterService.getMonsterMoves(id);
    res.json({ success: true, count: moves.length, data: moves });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMonsterMoves:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getMonsterGallery(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const gallery = await monsterService.getMonsterGallery(id);
    res.json({ success: true, count: gallery.length, data: gallery });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    // Return empty gallery gracefully on DB errors (e.g., table doesn't exist yet)
    if (!msg.includes('not found')) {
      console.error('Error in getMonsterGallery:', error);
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    // Return empty gallery instead of 500 to avoid frontend retry cascades
    res.json({ success: true, count: 0, data: [] });
  }
}

export async function getMonsterReferences(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const references = await monsterService.getMonsterReferences(id);
    res.json({ success: true, references });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getMonsterReferences:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Levels & Initialization
// =============================================================================

export async function addMonsterLevels(req: Request, res: Response): Promise<void> {
  try {
    const { monsterId, levels } = req.body as { monsterId?: number; levels?: number };

    if (!monsterId || !levels || levels <= 0) {
      res.status(400).json({
        success: false,
        message: 'Monster ID and positive level count are required',
      });
      return;
    }

    const result = await monsterService.addMonsterLevels(monsterId, levels);

    res.json({
      success: true,
      message: `Successfully added ${result.levelsAdded} levels`,
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error adding levels to monster:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function initializeMonsterController(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.id as string);
    const initializedMonster = await monsterService.initializeMonster(monsterId);
    res.json({
      success: true,
      message: `Monster ${monsterId} initialized successfully`,
      data: initializedMonster,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to initialize monster';
    console.error('Error initializing monster:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Lineage
// =============================================================================

export async function getMonsterLineage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const lineage = await monsterService.getMonsterLineage(id);
    res.json({ success: true, data: lineage });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    // Return empty lineage gracefully on DB errors (e.g., table doesn't exist yet)
    if (!msg.includes('not found')) {
      console.error('Error in getMonsterLineage:', error);
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    // Return empty lineage instead of 500 to avoid frontend retry cascades
    const id = parseInt(req.params.id as string);
    res.json({
      success: true,
      data: { monsterId: id, parents: [], siblings: [], children: [], grandchildren: [] },
    });
  }
}

export async function addMonsterLineage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { related_monster_id, relationship_type, notes } = req.body as {
      related_monster_id?: number;
      relationship_type?: string;
      notes?: string;
    };
    const userId = req.user?.discord_id;

    if (!related_monster_id || !relationship_type) {
      res.status(400).json({
        success: false,
        message: 'related_monster_id and relationship_type are required',
      });
      return;
    }

    if (!['parent', 'child', 'sibling'].includes(relationship_type)) {
      res.status(400).json({
        success: false,
        message: 'relationship_type must be parent, child, or sibling',
      });
      return;
    }

    const createdRelationships = await monsterService.addMonsterLineage(
      id,
      related_monster_id,
      relationship_type as 'parent' | 'sibling' | 'child',
      userId ?? '',
      notes,
    );

    res.json({
      success: true,
      message: 'Lineage relationship added successfully',
      data: createdRelationships,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in addMonsterLineage:', error);
    if (msg.includes('only edit lineage')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('already exists')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function removeMonsterLineage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { related_monster_id, relationship_type } = req.body as {
      related_monster_id?: number;
      relationship_type?: string;
    };
    const userId = req.user?.discord_id;

    if (!related_monster_id || !relationship_type) {
      res.status(400).json({
        success: false,
        message: 'related_monster_id and relationship_type are required',
      });
      return;
    }

    const success = await monsterService.removeMonsterLineage(
      id,
      related_monster_id,
      relationship_type as 'parent' | 'sibling' | 'child',
      userId ?? '',
    );

    if (success) {
      res.json({ success: true, message: 'Lineage relationship removed successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to remove lineage relationship' });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in removeMonsterLineage:', error);
    if (msg.includes('only edit lineage')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Metadata
// =============================================================================

export async function getMonsterTypes(_req: Request, res: Response): Promise<void> {
  try {
    const types = await monsterService.getDistinctTypes();
    res.json({ success: true, types });
  } catch (error) {
    console.error('Error fetching monster types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monster types' });
  }
}

export async function getMonsterAttributes(_req: Request, res: Response): Promise<void> {
  try {
    const attributes = await monsterService.getDistinctAttributes();
    res.json({ success: true, attributes });
  } catch (error) {
    console.error('Error fetching monster attributes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monster attributes' });
  }
}

export async function getMonsterSpecies(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const species = await monsterService.getDistinctSpecies(limit);
    res.json({ success: true, species });
  } catch (error) {
    console.error('Error fetching monster species:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monster species' });
  }
}

// =============================================================================
// Admin Level Management
// =============================================================================

export async function adminGetFilterOptions(_req: Request, res: Response): Promise<void> {
  try {
    const options = await monsterService.getAdminFilterOptions();
    res.json({ success: true, types: options.types, attributes: options.attributes });
  } catch (error) {
    console.error('Error in adminGetFilterOptions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function adminGetMonstersPaginated(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || 'id';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' as const : 'desc' as const;
    const trainerId = req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined;
    const type = (req.query.type as string) || undefined;
    const species = (req.query.species as string) || undefined;
    const attribute = (req.query.attribute as string) || undefined;

    const result = await monsterService.getMonstersPaginated({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      trainerId,
      type,
      species,
      attribute,
    });

    res.json({
      success: true,
      monsters: result.monsters,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      totalMonsters: result.totalMonsters,
    });
  } catch (error) {
    console.error('Error in adminGetMonstersPaginated:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function adminChangeMonsterOwner(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { newTrainerId } = req.body as { newTrainerId?: number };

    if (!newTrainerId) {
      res.status(400).json({ success: false, message: 'newTrainerId is required' });
      return;
    }

    const updatedMonster = await monsterService.adminChangeMonsterOwner(id, newTrainerId);

    res.json({
      success: true,
      message: `Monster transferred to trainer "${updatedMonster.trainer_name}"`,
      data: updatedMonster,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in adminChangeMonsterOwner:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminDeleteMonster(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { forfeitToBazar } = req.body as { forfeitToBazar?: boolean };

    const result = await monsterService.adminDeleteMonster(id, !!forfeitToBazar);

    res.json({ success: true, message: result.message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in adminDeleteMonster:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminAddLevelsToMonster(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.monsterId as string);
    const { levels, reason } = req.body as { levels?: number; reason?: string };

    if (!levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Positive level count is required' });
      return;
    }

    const result = await monsterService.adminAddLevelsToMonster(monsterId, levels, reason);

    res.json({
      success: true,
      message: `Successfully added ${result.levelsAdded} levels to monster ${result.updatedMonster.name}`,
      data: {
        monster: {
          id: result.monsterId,
          name: result.updatedMonster.name,
          newLevel: result.newLevel,
          trainerId: result.updatedMonster.trainer_id,
        },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in adminAddLevelsToMonster:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminBulkAddMonsters(req: Request, res: Response): Promise<void> {
  try {
    const { trainer_id, monsters_text } = req.body as {
      trainer_id?: number;
      monsters_text?: string;
    };

    if (!trainer_id || !monsters_text) {
      res.status(400).json({
        success: false,
        message: 'trainer_id and monsters_text are required',
      });
      return;
    }

    const result = await monsterService.bulkAddMonsters(trainer_id, monsters_text);

    res.json({
      success: true,
      message: `Successfully processed ${result.processedCount} monsters`,
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in bulk add monsters:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function adminAddLevelsToBulkMonsters(req: Request, res: Response): Promise<void> {
  try {
    const { monsterIds, levels, reason } = req.body as {
      monsterIds?: number[];
      levels?: number;
      reason?: string;
    };

    if (!monsterIds || !Array.isArray(monsterIds) || monsterIds.length === 0) {
      res.status(400).json({ success: false, message: 'Monster IDs array is required' });
      return;
    }

    if (!levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Positive level count is required' });
      return;
    }

    const results = await monsterService.adminAddLevelsToBulkMonsters(monsterIds, levels, reason);

    res.json({
      success: true,
      message: `Successfully processed ${results.success.length} monsters, failed: ${results.failed.length}`,
      data: results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in adminAddLevelsToBulkMonsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
