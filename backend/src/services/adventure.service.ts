import {
  AdventureRepository,
  Adventure,
  AdventureCreateInput,
  AdventureUpdateInput,
  AdventureQueryOptions,
  AdventureStatus,
  PaginatedAdventures,
  TrainerRepository,
  TrainerInventoryRepository,
  AdventureLogRepository,
  AdventureParticipantRepository,
  AdventureParticipantWithDetails,
} from '../repositories';
import { db } from '../database';
import { AreaDataService, Landmass, Region, Area, FullAreaConfiguration } from './adventure/area-data.service';
import { AdventureDiscordService, ThreadCreationResult } from './adventure/adventure-discord.service';
import { MonsterInitializerService } from './monster-initializer.service';

// ============================================================================
// Types
// ============================================================================

export type CreateAdventureInput = {
  creatorId: number;
  title: string;
  description?: string;
  threadEmoji?: string;
  adventureType?: 'prebuilt' | 'custom';
  region?: string;
  area?: string;
  landmass?: string;
  selectedTrainer?: string;
  discordUserId?: string;
};

export type CreateAdventureResult = {
  success: boolean;
  message: string;
  adventure?: Adventure & {
    discord_thread_url?: string | null;
    discord_integration_status?: string;
  };
  discord_thread?: ThreadCreationResult | null;
};

export type LevelAllocation = {
  entityType: 'trainer' | 'monster';
  entityId: number;
  levels: number;
};

export type CoinAllocation = {
  trainerId: number;
  coins: number;
};

export type ItemAllocation = {
  trainerId: number;
  item: string;
};

export type ClaimRewardsInput = {
  adventureLogId: number;
  userId: number;
  levelAllocations?: LevelAllocation[];
  coinAllocations?: CoinAllocation[];
  itemAllocations?: ItemAllocation[];
};

export type RegionInfo = {
  landmasses: Record<string, Landmass>;
  regions: Record<string, Region[]>;
  areas: Record<string, Area[]>;
};

export type AdminAdventure = {
  id: number;
  creatorId: number;
  creatorUsername: string | null;
  title: string;
  description: string | null;
  status: AdventureStatus;
  regionName: string | null;
  areaName: string | null;
  encounterCount: number;
  maxEncounters: number | null;
  discordThreadId: string | null;
  totalParticipants: number;
  totalWords: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type AdminAdventureQueryOptions = {
  status?: AdventureStatus | null;
  search?: string | null;
  page?: number;
  limit?: number;
};

export type PaginatedAdminAdventures = {
  adventures: AdminAdventure[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ============================================================================
// Service
// ============================================================================

export class AdventureService {
  private adventureRepository: AdventureRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private adventureLogRepository: AdventureLogRepository;
  private participantRepository: AdventureParticipantRepository;
  private areaDataService: AreaDataService;
  private discordService: AdventureDiscordService;
  private monsterInitializer: MonsterInitializerService;

  constructor(
    adventureRepository?: AdventureRepository,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    adventureLogRepository?: AdventureLogRepository,
    areaDataService?: AreaDataService,
    discordService?: AdventureDiscordService,
    monsterInitializer?: MonsterInitializerService,
    participantRepository?: AdventureParticipantRepository,
  ) {
    this.adventureRepository = adventureRepository ?? new AdventureRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.adventureLogRepository = adventureLogRepository ?? new AdventureLogRepository();
    this.participantRepository = participantRepository ?? new AdventureParticipantRepository();
    this.areaDataService = areaDataService ?? new AreaDataService();
    this.discordService = discordService ?? new AdventureDiscordService();
    this.monsterInitializer = monsterInitializer ?? new MonsterInitializerService();
  }

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  async getAllAdventures(options: AdventureQueryOptions = {}): Promise<PaginatedAdventures> {
    return this.adventureRepository.findAll(options);
  }

  async getAdventureById(id: number): Promise<Adventure | null> {
    return this.adventureRepository.findById(id);
  }

  async getTrainerAdventures(creatorId: number, options: AdventureQueryOptions = {}): Promise<PaginatedAdventures> {
    return this.adventureRepository.findByCreatorId(creatorId, options);
  }

  // ==========================================================================
  // Create Adventure
  // ==========================================================================

  async createAdventure(input: CreateAdventureInput): Promise<CreateAdventureResult> {
    const { creatorId, title, description, threadEmoji, adventureType, area, region, landmass, selectedTrainer } = input;

    if (!title?.trim()) {
      return { success: false, message: 'Adventure title is required' };
    }

    const adventureData: AdventureCreateInput = {
      creatorId,
      title: title.trim(),
      status: 'active',
    };

    // Handle prebuilt adventures with area configuration
    if (adventureType === 'prebuilt' && area) {
      const areaConfig = await this.areaDataService.getFullAreaConfiguration(area);

      if (areaConfig) {
        // Validate item requirements
        if (selectedTrainer) {
          const itemValidation = await this.validateItemRequirements(selectedTrainer, areaConfig);
          if (!itemValidation.valid) {
            return { success: false, message: itemValidation.message };
          }
        }

        adventureData.description = `${areaConfig.regionName}: ${areaConfig.areaName}`;
        adventureData.landmassId = areaConfig.landmassId;
        adventureData.landmassName = areaConfig.landmassName;
        adventureData.regionId = areaConfig.regionId;
        adventureData.regionName = areaConfig.regionName;
        adventureData.areaId = area;
        adventureData.areaName = areaConfig.areaName;
        adventureData.areaConfig = areaConfig;
      } else {
        adventureData.description = description ?? `${region ?? ''}:${area}`;
        adventureData.areaId = area;
        adventureData.regionId = region;
        adventureData.landmassId = landmass;
      }
    } else {
      adventureData.description = description ?? 'custom';
    }

    const adventure = await this.adventureRepository.create(adventureData);

    // Create Discord thread
    let discordThreadResult: ThreadCreationResult | null = null;
    if (this.discordService.isDiscordAvailable()) {
      try {
        discordThreadResult = await this.discordService.createAdventureThread(
          adventure,
          threadEmoji ?? '🗡️',
        );
      } catch (error) {
        console.error('Error creating Discord thread:', error);
        discordThreadResult = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const responseAdventure = {
      ...adventure,
      discord_thread_url: discordThreadResult?.success ? discordThreadResult.threadUrl : null,
      discord_integration_status: discordThreadResult?.success ? 'connected' : 'failed',
    };

    return {
      success: true,
      message: 'Adventure created successfully',
      adventure: responseAdventure,
      discord_thread: discordThreadResult,
    };
  }

  // ==========================================================================
  // Update / Delete
  // ==========================================================================

  async updateAdventure(
    id: number,
    userId: number,
    isAdmin: boolean,
    updateData: AdventureUpdateInput,
  ): Promise<{ success: boolean; message: string; adventure?: Adventure }> {
    const adventure = await this.adventureRepository.findById(id);
    if (!adventure) {
      return { success: false, message: 'Adventure not found' };
    }

    if (adventure.creatorId !== userId && !isAdmin) {
      return { success: false, message: 'You can only update your own adventures' };
    }

    const updatedAdventure = await this.adventureRepository.update(id, updateData);
    return { success: true, message: 'Adventure updated successfully', adventure: updatedAdventure };
  }

  async deleteAdventure(
    id: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<{ success: boolean; message: string }> {
    const adventure = await this.adventureRepository.findById(id);
    if (!adventure) {
      return { success: false, message: 'Adventure not found' };
    }

    if (adventure.creatorId !== userId && !isAdmin) {
      return { success: false, message: 'You can only delete your own adventures' };
    }

    const deleted = await this.adventureRepository.delete(id);
    if (!deleted) {
      return { success: false, message: 'Failed to delete adventure' };
    }

    return { success: true, message: 'Adventure deleted successfully' };
  }

  // ==========================================================================
  // Complete Adventure
  // ==========================================================================

  async completeAdventure(
    id: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<{ success: boolean; message: string; adventure?: Adventure }> {
    const adventure = await this.adventureRepository.findById(id);
    if (!adventure) {
      return { success: false, message: 'Adventure not found' };
    }

    if (adventure.creatorId !== userId && !isAdmin) {
      return { success: false, message: 'You can only complete your own adventures' };
    }

    const completedAdventure = await this.adventureRepository.complete(id);
    return { success: true, message: 'Adventure completed successfully', adventure: completedAdventure };
  }

  // ==========================================================================
  // Regions
  // ==========================================================================

  async getAvailableRegions(): Promise<RegionInfo> {
    const landmasses = await this.areaDataService.getAllLandmasses();
    const regions: Record<string, Region[]> = {};
    const areas: Record<string, Area[]> = {};

    for (const landmassId of Object.keys(landmasses)) {
      const landmassRegions = await this.areaDataService.getRegionsForLandmass(landmassId);
      regions[landmassId] = landmassRegions;

      for (const region of landmassRegions) {
        const regionAreas = await this.areaDataService.getAreasForRegion(region.id);
        areas[region.id] = regionAreas;
      }
    }

    return { landmasses, regions, areas };
  }

  // ==========================================================================
  // Rewards
  // ==========================================================================

  async claimRewards(input: ClaimRewardsInput): Promise<{ success: boolean; message: string }> {
    const { adventureLogId, userId, levelAllocations, coinAllocations, itemAllocations } = input;

    // Validate adventure log
    const adventureLog = await this.adventureLogRepository.findById(adventureLogId);
    if (!adventureLog) {
      return { success: false, message: 'Adventure log not found' };
    }

    if (adventureLog.userId !== userId) {
      return { success: false, message: 'You can only claim your own rewards' };
    }

    if (adventureLog.isClaimed) {
      return { success: false, message: 'Rewards have already been claimed' };
    }

    // Apply level allocations
    if (levelAllocations) {
      for (const allocation of levelAllocations) {
        if (allocation.entityType === 'trainer') {
          await this.trainerRepository.addLevels(allocation.entityId, allocation.levels);
        } else if (allocation.entityType === 'monster') {
          await this.monsterInitializer.levelUpMonster(allocation.entityId, allocation.levels);
        }
      }
    }

    // Apply coin allocations
    if (coinAllocations) {
      for (const allocation of coinAllocations) {
        await this.trainerRepository.updateCurrency(allocation.trainerId, allocation.coins);
      }
    }

    // Apply item allocations
    if (itemAllocations) {
      for (const allocation of itemAllocations) {
        if (allocation.trainerId && allocation.item) {
          await this.inventoryRepository.addItem(allocation.trainerId, 'items', allocation.item, 1);
        }
      }
    }

    // Mark as claimed
    await this.adventureLogRepository.markAsClaimed(adventureLogId);

    return { success: true, message: 'Rewards claimed successfully' };
  }

  // ==========================================================================
  // Admin Operations
  // ==========================================================================

  async adminGetAllAdventures(options: AdminAdventureQueryOptions = {}): Promise<PaginatedAdminAdventures> {
    const { status = null, search = null, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(`(a.title ILIKE $${idx} OR u.username ILIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM adventures a
       LEFT JOIN users u ON a.creator_id = u.id
       ${whereClause}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const dataValues = [...values, limit, offset];
    const result = await db.query<{
      id: number;
      creator_id: number;
      creator_username: string | null;
      title: string;
      description: string | null;
      status: AdventureStatus;
      region_name: string | null;
      area_name: string | null;
      encounter_count: number;
      max_encounters: number | null;
      discord_thread_id: string | null;
      total_participants: number;
      total_words: number;
      created_at: Date;
      updated_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT a.id, a.creator_id, u.username as creator_username,
        a.title, a.description, a.status, a.region_name, a.area_name,
        a.encounter_count, a.max_encounters, a.discord_thread_id,
        COALESCE(ps.total_participants, 0) as total_participants,
        COALESCE(ps.total_words, 0) as total_words,
        a.created_at, a.updated_at, a.completed_at
      FROM adventures a
      LEFT JOIN users u ON a.creator_id = u.id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as total_participants, COALESCE(SUM(word_count), 0)::int as total_words
        FROM adventure_participants ap WHERE ap.adventure_id = a.id
      ) ps ON true
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues,
    );

    const adventures: AdminAdventure[] = result.rows.map((row) => ({
      id: row.id,
      creatorId: row.creator_id,
      creatorUsername: row.creator_username,
      title: row.title,
      description: row.description,
      status: row.status,
      regionName: row.region_name,
      areaName: row.area_name,
      encounterCount: row.encounter_count,
      maxEncounters: row.max_encounters,
      discordThreadId: row.discord_thread_id,
      totalParticipants: row.total_participants,
      totalWords: row.total_words,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    }));

    return {
      adventures,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetParticipants(adventureId: number): Promise<AdventureParticipantWithDetails[]> {
    return this.participantRepository.findByAdventureId(adventureId);
  }

  async adminSendMessage(
    adventureId: number,
    message: string,
  ): Promise<{ success: boolean; message: string }> {
    const adventure = await this.adventureRepository.findById(adventureId);
    if (!adventure) {
      return { success: false, message: 'Adventure not found' };
    }

    if (!adventure.discordThreadId) {
      return { success: false, message: 'Adventure has no Discord thread' };
    }

    const result = await this.discordService.sendMessageToThread(adventure.discordThreadId, message);
    if (!result.success) {
      return { success: false, message: result.message ?? 'Failed to send message' };
    }

    return { success: true, message: 'Message sent successfully' };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private async validateItemRequirements(
    trainerName: string,
    areaConfig: FullAreaConfiguration,
  ): Promise<{ valid: boolean; message: string }> {
    const requirements = areaConfig.itemRequirements;

    if (!requirements) {
      return { valid: true, message: '' };
    }

    const trainer = await this.trainerRepository.findByName(trainerName);
    if (!trainer) {
      return { valid: false, message: 'Selected trainer not found' };
    }

    // Check mission mandate
    if (requirements.needsMissionMandate !== false) {
      const hasMandate = await this.inventoryRepository.hasItem(trainer.id, 'Mission Mandate');
      if (!hasMandate) {
        return {
          valid: false,
          message: 'This adventure requires a Mission Mandate. Please ensure your trainer has one in their inventory.',
        };
      }
      await this.consumeTrainerItem(trainer.id, 'Mission Mandate');
    }

    // Check specific item requirement
    if (requirements.itemRequired) {
      const hasItem = await this.inventoryRepository.hasItem(trainer.id, requirements.itemRequired);
      if (!hasItem) {
        return {
          valid: false,
          message: `This adventure requires a ${requirements.itemRequired}. Please ensure your trainer has one in their inventory.`,
        };
      }
      await this.consumeTrainerItem(trainer.id, requirements.itemRequired);
    }

    return { valid: true, message: '' };
  }

  private async consumeTrainerItem(trainerId: number, itemName: string): Promise<void> {
    const item = await this.inventoryRepository.getItemByName(trainerId, itemName);
    if (!item) {
      throw new Error(`Item ${itemName} not found in trainer ${trainerId} inventory`);
    }
    if (item.quantity < 1) {
      throw new Error(`Insufficient ${itemName} in inventory`);
    }
    await this.inventoryRepository.removeItem(trainerId, item.category, itemName, 1);
  }
}
