import { db } from '../database';
import {
  MonsterRepository,
  MonsterLineageRepository,
  TrainerRepository,
  UserRepository,
  MoveRepository,
} from '../repositories';
import type {
  MonsterWithTrainer,
  MonsterCreateInput,
  MonsterUpdateInput,
  MonsterImageRow,
  MonsterEvolutionLineRow,
} from '../repositories';
import type {
  CompleteLineage,
  MonsterLineage,
} from '../repositories/monster-lineage.repository';
import { MonsterInitializerService } from './monster-initializer.service';
import type { InitializedMonster } from './monster-initializer.service';
import { BazarService } from './bazar.service';

// ============================================================================
// Types
// ============================================================================

export type MonsterSearchResult = {
  count: number;
  data: MonsterWithTrainer[];
};

export type MonsterMoveData = {
  move_name: string;
  move_type: string | null;
  pp: number | null;
  power: number | null;
  accuracy: number | null;
  description: string | null;
  move_category: string | null;
  attribute: string | null;
};

export type MonsterGalleryItem = {
  id: number;
  image_url: string;
  title: string | null;
  created_at: Date;
};

export type MonsterReference = {
  species: string;
  image_url: string | null;
};

export type MegaImages = {
  mega_stone_image: MonsterImageRow | null;
  mega_image: MonsterImageRow | null;
};

export type AddLevelsResult = {
  monsterId: number;
  oldLevel: number;
  newLevel: number;
  levelsAdded: number;
  updatedMonster: MonsterWithTrainer;
};

export type BulkAddMonsterResult = {
  line: number;
  name: string;
  level: number;
  species: string[];
  types: string[];
  attribute: string;
  monsterId: number;
};

export type BulkAddMonstersResult = {
  trainerId: number;
  trainerName: string;
  processedCount: number;
  errorCount: number;
  results: BulkAddMonsterResult[];
  errors: string[];
};

// ============================================================================
// Service
// ============================================================================

export class MonsterService {
  private monsterRepo: MonsterRepository;
  private lineageRepo: MonsterLineageRepository;
  private trainerRepo: TrainerRepository;
  private userRepo: UserRepository;
  private moveRepo: MoveRepository;
  private initializer: MonsterInitializerService;

  constructor(
    monsterRepo?: MonsterRepository,
    lineageRepo?: MonsterLineageRepository,
    trainerRepo?: TrainerRepository,
    userRepo?: UserRepository,
    initializer?: MonsterInitializerService,
  ) {
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.lineageRepo = lineageRepo ?? new MonsterLineageRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.userRepo = userRepo ?? new UserRepository();
    this.moveRepo = new MoveRepository();
    this.initializer = initializer ?? new MonsterInitializerService();
  }

  // ==========================================================================
  // Monster CRUD
  // ==========================================================================

  async getAllMonsters(): Promise<MonsterWithTrainer[]> {
    return this.monsterRepo.findAll();
  }

  async searchMonsters(search: string, limit = 20): Promise<MonsterSearchResult> {
    if (!search || search.trim().length < 2) {
      return { count: 0, data: [] };
    }
    const data = await this.monsterRepo.search(search.trim(), limit);
    return { count: data.length, data };
  }

  async getMonsterById(id: number): Promise<MonsterWithTrainer | null> {
    return this.monsterRepo.findById(id);
  }

  async getMonstersByUserId(userId: string): Promise<MonsterWithTrainer[]> {
    return this.monsterRepo.findByUserId(userId);
  }

  async getMonstersByTrainerId(trainerId: number): Promise<MonsterWithTrainer[]> {
    return this.monsterRepo.findByTrainerId(trainerId);
  }

  async createMonster(
    input: MonsterCreateInput,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterWithTrainer> {
    const trainer = await this.trainerRepo.findById(input.trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${input.trainerId} not found`);
    }

    if (requestingUserId && trainer.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to create a monster for this trainer');
    }

    const createInput: MonsterCreateInput = {
      ...input,
      playerUserId: trainer.player_user_id,
    };

    return this.monsterRepo.create(createInput);
  }

  async createMonsterInternal(monsterData: MonsterCreateInput): Promise<MonsterWithTrainer | null> {
    try {
      if (!monsterData.trainerId) {
        console.error('Trainer ID is required');
        return null;
      }

      const trainer = await this.trainerRepo.findById(monsterData.trainerId);
      if (!trainer) {
        console.error(`Trainer with ID ${monsterData.trainerId} not found`);
        return null;
      }

      const createInput: MonsterCreateInput = {
        ...monsterData,
        playerUserId: trainer.player_user_id,
      };

      return await this.monsterRepo.create(createInput);
    } catch (error) {
      console.error('Error in createMonsterInternal:', error);
      return null;
    }
  }

  async updateMonster(
    id: number,
    input: MonsterUpdateInput,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterWithTrainer> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to update this monster');
    }

    return this.monsterRepo.update(id, input);
  }

  async deleteMonster(
    id: number,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<void> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to delete this monster');
    }

    await this.monsterRepo.delete(id);
  }

  // ==========================================================================
  // Images
  // ==========================================================================

  async getMonsterImages(id: number): Promise<MonsterImageRow[]> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.monsterRepo.getImages(id);
  }

  async addMonsterImage(
    id: number,
    imageData: { image_url: string; image_type?: string; order_index?: number },
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterImageRow> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to add an image to this monster');
    }

    return this.monsterRepo.addImage(
      id,
      imageData.image_url,
      imageData.image_type ?? 'default',
      imageData.order_index ?? 0,
    );
  }

  async getMegaImages(id: number): Promise<MegaImages> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    const [megaStoneImage, megaImage] = await Promise.all([
      this.monsterRepo.getMegaStoneImage(id),
      this.monsterRepo.getMegaImage(id),
    ]);

    return {
      mega_stone_image: megaStoneImage,
      mega_image: megaImage,
    };
  }

  async addMegaStoneImage(
    id: number,
    imageUrl: string,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterImageRow> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to add mega stone image to this monster');
    }

    return this.monsterRepo.setMegaStoneImage(id, imageUrl);
  }

  async addMegaImage(
    id: number,
    imageUrl: string,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterImageRow> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to add mega image to this monster');
    }

    return this.monsterRepo.setMegaImage(id, imageUrl);
  }

  // ==========================================================================
  // Evolution
  // ==========================================================================

  async getEvolutionData(id: number): Promise<MonsterEvolutionLineRow | null> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.monsterRepo.getEvolutionData(id);
  }

  async setEvolutionData(
    id: number,
    evolutionData: object,
    requestingUserId?: string,
    isAdmin?: boolean,
  ): Promise<MonsterEvolutionLineRow> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }

    if (requestingUserId && monster.player_user_id !== requestingUserId && !isAdmin) {
      throw new Error('Not authorized to set evolution data for this monster');
    }

    return this.monsterRepo.setEvolutionData(id, evolutionData);
  }

  async getEvolutionChain(id: number): Promise<MonsterWithTrainer[]> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.monsterRepo.getEvolutionChain(id);
  }

  // ==========================================================================
  // Moves, Gallery, References
  // ==========================================================================

  async getMonsterMoves(id: number): Promise<MonsterMoveData[]> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    const moveNames = this.monsterRepo.getMoveset(monster);
    if (moveNames.length === 0) { return []; }

    const moves = await this.moveRepo.findByNames(moveNames);

    // Build a lookup and preserve the monster's move order
    const moveLookup = new Map(moves.map(m => [m.moveName.toLowerCase(), m]));

    return moveNames.map(name => {
      const move = moveLookup.get(name.toLowerCase());
      return {
        move_name: name,
        move_type: move?.moveType ?? null,
        pp: move?.pp ?? null,
        power: move?.power ?? null,
        accuracy: move?.accuracy ?? null,
        description: move?.description ?? null,
        move_category: move?.moveCategory ?? null,
        attribute: move?.attribute ?? null,
      };
    });
  }

  async getMonsterGallery(id: number): Promise<MonsterGalleryItem[]> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.monsterRepo.getGallery(id);
  }

  async getMonsterReferences(id: number): Promise<MonsterReference[]> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.monsterRepo.getReferences(id);
  }

  // ==========================================================================
  // Levels & Initialization
  // ==========================================================================

  async addMonsterLevels(monsterId: number, levels: number): Promise<AddLevelsResult> {
    if (!monsterId || !levels || levels <= 0) {
      throw new Error('Monster ID and positive level count are required');
    }

    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    const trainer = await this.trainerRepo.findById(monster.trainer_id);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const updatedMonster = await this.monsterRepo.addLevels(monsterId, levels);

    return {
      monsterId,
      oldLevel: monster.level,
      newLevel: updatedMonster.level,
      levelsAdded: updatedMonster.level - monster.level,
      updatedMonster,
    };
  }

  async adminAddLevelsToMonster(
    monsterId: number,
    levels: number,
    reason?: string,
  ): Promise<AddLevelsResult> {
    if (!monsterId || !levels || levels <= 0) {
      throw new Error('Monster ID and positive level count are required');
    }

    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    const updatedMonster = await this.monsterRepo.addLevels(monsterId, levels);

    console.log(`Admin added ${levels} levels to monster ${monster.name} (ID: ${monsterId})`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return {
      monsterId,
      oldLevel: monster.level,
      newLevel: updatedMonster.level,
      levelsAdded: updatedMonster.level - monster.level,
      updatedMonster,
    };
  }

  async adminAddLevelsToBulkMonsters(
    monsterIds: number[],
    levels: number,
    reason?: string,
  ): Promise<{ success: AddLevelsResult[]; failed: { id: number; reason: string }[] }> {
    if (!monsterIds || monsterIds.length === 0 || !levels || levels <= 0) {
      throw new Error('Monster IDs array and positive level count are required');
    }

    const results: { success: AddLevelsResult[]; failed: { id: number; reason: string }[] } = {
      success: [],
      failed: [],
    };

    for (const monsterId of monsterIds) {
      try {
        const monster = await this.monsterRepo.findById(monsterId);
        if (!monster) {
          results.failed.push({ id: monsterId, reason: 'Monster not found' });
          continue;
        }

        const updatedMonster = await this.monsterRepo.addLevels(monsterId, levels);

        results.success.push({
          monsterId,
          oldLevel: monster.level,
          newLevel: updatedMonster.level,
          levelsAdded: updatedMonster.level - monster.level,
          updatedMonster,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ id: monsterId, reason: msg });
      }
    }

    console.log(`Admin added ${levels} levels to ${results.success.length} monsters`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return results;
  }

  async initializeMonster(monsterId: number): Promise<InitializedMonster> {
    return this.initializer.initializeMonster(monsterId);
  }

  // ==========================================================================
  // Admin Bulk Add
  // ==========================================================================

  /**
   * Bulk add monsters to a trainer from a text-based format.
   * Format per line: Name | Level | Species1,Species2,Species3 | Type1,Type2,Type3,Type4,Type5 | Attribute (optional)
   */
  async bulkAddMonsters(
    trainerId: number,
    monstersText: string,
  ): Promise<BulkAddMonstersResult> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    const lines = monstersText.split('\n').filter(line => line.trim());
    const results: BulkAddMonsterResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) {
        continue;
      }

      try {
        const parts = line.split('|').map(part => part.trim());

        if (parts.length < 4) {
          errors.push(`Line ${i + 1}: Invalid format - expected at least 4 parts separated by |`);
          continue;
        }

        const name = parts[0];
        const levelStr = parts[1];
        const speciesStr = parts[2];
        const typesStr = parts[3];
        const attributeStr = parts[4];

        if (!name) {
          errors.push(`Line ${i + 1}: Missing monster name`);
          continue;
        }

        // Validate and parse level
        const level = parseInt(levelStr ?? '');
        if (isNaN(level) || level < 1 || level > 100) {
          errors.push(`Line ${i + 1}: Invalid level "${levelStr ?? ''}" - must be between 1-100`);
          continue;
        }

        // Parse species
        const species = (speciesStr ?? '').split(',').map(s => s.trim()).filter(s => s);
        if (species.length === 0) {
          errors.push(`Line ${i + 1}: No species provided`);
          continue;
        }

        // Parse types
        const types = (typesStr ?? '').split(',').map(t => t.trim()).filter(t => t);
        if (types.length === 0) {
          errors.push(`Line ${i + 1}: No types provided`);
          continue;
        }

        // Generate random attribute if not provided
        const trimmedAttr = attributeStr?.trim();
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- need to treat empty string as missing
        const attribute = trimmedAttr || generateRandomAttribute();

        const createdMonster = await this.monsterRepo.create({
          trainerId,
          playerUserId: trainer.player_user_id,
          name,
          level,
          species1: species[0] ?? '',
          species2: species[1] ?? null,
          species3: species[2] ?? null,
          type1: types[0] ?? '',
          type2: types[1] ?? null,
          type3: types[2] ?? null,
          type4: types[3] ?? null,
          type5: types[4] ?? null,
          attribute,
        });

        // Initialize monster with stats, moves, abilities
        await this.initializer.initializeMonster(createdMonster.id);

        results.push({
          line: i + 1,
          name,
          level,
          species: species.slice(0, 3),
          types: types.slice(0, 5),
          attribute,
          monsterId: createdMonster.id,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Line ${i + 1}: ${msg}`);
      }
    }

    console.log(`Admin bulk-added ${results.length} monsters to trainer ${trainer.name} (ID: ${trainerId})`);

    return {
      trainerId,
      trainerName: trainer.name,
      processedCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  // ==========================================================================
  // Lineage
  // ==========================================================================

  async getMonsterLineage(id: number): Promise<CompleteLineage> {
    const monster = await this.monsterRepo.findById(id);
    if (!monster) {
      throw new Error(`Monster with ID ${id} not found`);
    }
    return this.lineageRepo.getCompleteLineage(id);
  }

  async addMonsterLineage(
    monsterId: number,
    relatedMonsterId: number,
    relationshipType: 'parent' | 'sibling' | 'child',
    userId: string,
    notes?: string | null,
  ): Promise<MonsterLineage[]> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    const relatedMonster = await this.monsterRepo.findById(relatedMonsterId);
    if (!relatedMonster) {
      throw new Error('One or both monsters not found');
    }

    // Check ownership
    if (userId && String(monster.player_user_id) !== String(userId)) {
      throw new Error(
        `You can only edit lineage for your own monsters. Your ID: ${userId}, Monster owner ID: ${monster.player_user_id}`,
      );
    }

    // Check for existing relationship
    const exists = await this.lineageRepo.relationshipExists(monsterId, relatedMonsterId, relationshipType);
    if (exists) {
      throw new Error('This lineage relationship already exists');
    }

    // Get the user's DB id for created_by
    const user = await this.userRepo.findByDiscordId(userId);
    const createdByUserId = user?.id ?? 0;

    return this.lineageRepo.addManualRelationship(
      monsterId,
      relatedMonsterId,
      relationshipType,
      createdByUserId,
      notes ?? null,
    );
  }

  async removeMonsterLineage(
    monsterId: number,
    relatedMonsterId: number,
    relationshipType: 'parent' | 'sibling' | 'child',
    userId: string,
  ): Promise<boolean> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    if (userId && String(monster.player_user_id) !== String(userId)) {
      throw new Error('You can only edit lineage for your own monsters');
    }

    return this.lineageRepo.removeRelationship(monsterId, relatedMonsterId, relationshipType);
  }

  // ==========================================================================
  // Admin Monster Manager
  // ==========================================================================

  async getMonstersPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    trainerId?: number;
    type?: string;
    species?: string;
    attribute?: string;
  }): Promise<{
    monsters: MonsterWithTrainer[];
    totalPages: number;
    currentPage: number;
    totalMonsters: number;
  }> {
    const { monsters, total } = await this.monsterRepo.findPaginated(params);
    return {
      monsters,
      totalPages: Math.ceil(total / params.limit) || 1,
      currentPage: params.page,
      totalMonsters: total,
    };
  }

  async getAdminFilterOptions(): Promise<{ types: string[]; attributes: string[] }> {
    const [types, attributes] = await Promise.all([
      this.monsterRepo.getDistinctTypes(),
      this.monsterRepo.getDistinctAttributes(),
    ]);
    return { types, attributes };
  }

  async adminChangeMonsterOwner(
    monsterId: number,
    newTrainerId: number,
  ): Promise<MonsterWithTrainer> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    const trainer = await this.trainerRepo.findById(newTrainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${newTrainerId} not found`);
    }

    return this.monsterRepo.transferToTrainer(monsterId, newTrainerId, trainer.player_user_id);
  }

  async adminDeleteMonster(
    monsterId: number,
    forfeitToBazar: boolean,
  ): Promise<{ message: string }> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    if (forfeitToBazar) {
      const bazarService = new BazarService();
      await bazarService.forfeitMonster(monster.id, monster.trainer_id, monster.player_user_id);
      return { message: `Monster "${monster.name}" forfeited to the Bazar` };
    }

    await this.monsterRepo.delete(monsterId);
    return { message: `Monster "${monster.name}" deleted permanently` };
  }

  // ==========================================================================
  // Metadata
  // ==========================================================================

  async getDistinctTypes(): Promise<string[]> {
    const result = await db.query<{ type: string }>(
      `SELECT DISTINCT type FROM monster_types ORDER BY type`
    );
    return result.rows.map(r => r.type);
  }

  async getDistinctAttributes(): Promise<string[]> {
    const result = await db.query<{ attribute: string }>(
      `SELECT DISTINCT attribute FROM monsters WHERE attribute IS NOT NULL ORDER BY attribute`
    );
    return result.rows.map(r => r.attribute);
  }

  async getDistinctSpecies(limit = 100): Promise<string[]> {
    const result = await db.query<{ species1: string }>(
      `SELECT DISTINCT species1 FROM monsters ORDER BY species1 LIMIT $1`,
      [limit]
    );
    return result.rows.map(r => r.species1);
  }
}

// =============================================================================
// Helpers
// =============================================================================

const ATTRIBUTES = ['Data', 'Variable', 'Virus', 'Vaccine', 'Free'] as const;

function generateRandomAttribute(): string {
  return ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)] ?? 'Data';
}
