import { db } from '../database';
import {
  TrainerRepository,
  TrainerInventoryRepository,
  TrainerAchievementRepository,
  MonsterRepository,
} from '../repositories';
import type {
  TrainerWithStats,
  TrainerInventory,
  InventoryCategory,
  MonsterWithTrainer,
  AchievementProgress,
} from '../repositories';
import { INVENTORY_CATEGORIES } from '../repositories';
import { BazarService } from './bazar.service';
import { SpecialBerryService } from './special-berry.service';
import type { SpecialBerryInventory } from './special-berry.service';
import cloudinary from '../utils/cloudinary';
import { calculateZodiac, calculateChineseZodiac } from '../utils/zodiacUtils';

// =============================================================================
// Types
// =============================================================================

export type PaginatedTrainers = {
  data: TrainerWithStats[];
  totalPages: number;
  currentPage: number;
  totalTrainers: number;
};

export type PaginatedMonsters = {
  monsters: MonsterWithTrainer[];
  totalMonsters: number;
  totalPages: number;
  currentPage: number;
};

export type TrainerProfileData = {
  nickname?: string | null;
  full_name?: string | null;
  faction?: string | null;
  title?: string | null;
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  type6?: string | null;
  ability?: string | null;
  nature?: string | null;
  characteristic?: string | null;
  fav_berry?: string | null;
  fav_type1?: string | null;
  fav_type2?: string | null;
  fav_type3?: string | null;
  fav_type4?: string | null;
  fav_type5?: string | null;
  fav_type6?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  sexuality?: string | null;
  age?: string | null;
  height?: string | null;
  weight?: string | null;
  birthplace?: string | null;
  residence?: string | null;
  race?: string | null;
  occupation?: string | null;
  theme?: string | null;
  voice_claim?: string | null;
  quote?: string | null;
  tldr?: string | null;
  biography?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  likes?: string | null;
  dislikes?: string | null;
  flaws?: string | null;
  values?: string | null;
  quirks?: string | null;
  secrets?: string | null;
  relations?: string | null;
  icon?: string | null;
};

export type TrainerCreateData = {
  name: string;
  playerUserId: string;
  mainRef?: string | null;
  birthday?: string | null;
  additionalRefs?: string | null;
} & TrainerProfileData;

export type TrainerUpdateData = {
  name?: string;
  mainRef?: string | null;
  additionalRefs?: string | null;
  birthday?: string | null;
  megaInfo?: string | null;
} & TrainerProfileData;

export type BoxPositionUpdate = {
  id: number;
  boxNumber: number;
  position: number;
};

export type FeaturedMonster = {
  display_order: number;
} & MonsterWithTrainer;

export type AchievementResult = {
  achievements: AchievementProgress[];
  isOwner: boolean;
  trainer: { id: number; name: string; level: number };
};

export type AchievementClaimResult = {
  achievement: { id: string; name: string };
  reward: { currency?: number; item?: string };
};

export type AchievementClaimAllResult = {
  message: string;
  claimedCount: number;
  totalRewards: { currency: number; items: string[] };
};

export type AchievementStats = {
  totalAchievements: number;
  claimedCount: number;
  unlockedCount: number;
  completionPercent: number;
};

export type AdminLevelResult = {
  trainer: {
    id: number;
    name: string;
    newLevel: number;
    newCurrency: number;
  };
};

export type BulkLevelResult = {
  success: Array<{ id: number; name: string; newLevel: number; newCurrency: number }>;
  failed: Array<{ id: number; reason: string }>;
};

export type ImageUploadResult = {
  url: string;
  public_id: string;
};

export type TrainerImagesResult = {
  mega_image: MegaInfo | null;
  additional_refs: AdditionalRef[];
};

export type MegaInfo = {
  mega_ref?: string;
  mega_artist?: string;
  mega_species1?: string;
  mega_species2?: string;
  mega_species3?: string;
  mega_type1?: string;
  mega_type2?: string;
  mega_type3?: string;
  mega_type4?: string;
  mega_type5?: string;
  mega_type6?: string;
  mega_ability?: string;
};

export type AdditionalRef = {
  id: number | string;
  title: string;
  description: string;
  image_url: string;
};

// =============================================================================
// Service
// =============================================================================

export class TrainerService {
  private trainerRepo: TrainerRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private achievementRepo: TrainerAchievementRepository;
  private monsterRepo: MonsterRepository;
  private berryService: SpecialBerryService;

  constructor(
    trainerRepo?: TrainerRepository,
    inventoryRepo?: TrainerInventoryRepository,
    achievementRepo?: TrainerAchievementRepository,
    monsterRepo?: MonsterRepository,
    berryService?: SpecialBerryService,
  ) {
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.inventoryRepo = inventoryRepo ?? new TrainerInventoryRepository();
    this.achievementRepo = achievementRepo ?? new TrainerAchievementRepository();
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.berryService = berryService ?? new SpecialBerryService();
  }

  // ===========================================================================
  // Trainer CRUD
  // ===========================================================================

  async getAllTrainersForForms(): Promise<TrainerWithStats[]> {
    return this.trainerRepo.findAll(10000, 0);
  }

  async getAllTrainers(
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    search: string,
    faction: string = '',
  ): Promise<PaginatedTrainers> {
    let trainers = await this.trainerRepo.findAll(10000, 0);

    // Filter by faction
    if (faction) {
      const factionLower = faction.toLowerCase();
      trainers = trainers.filter((t) => {
        const trainerFaction = (t as unknown as Record<string, unknown>).faction;
        return typeof trainerFaction === 'string' && trainerFaction.toLowerCase() === factionLower;
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      trainers = trainers.filter((t) => {
        if (t.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        if (t.player_display_name?.toLowerCase().includes(searchLower)) {
          return true;
        }
        if (t.player_username?.toLowerCase().includes(searchLower)) {
          return true;
        }
        return false;
      });
    }

    // Sort
    trainers.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      if (sortBy === 'player_name') {
        valueA = (a.player_display_name ?? a.player_username ?? '').toLowerCase();
        valueB = (b.player_display_name ?? b.player_username ?? '').toLowerCase();
      } else {
        const rawA = (a as unknown as Record<string, unknown>)[sortBy];
        const rawB = (b as unknown as Record<string, unknown>)[sortBy];
        valueA = typeof rawA === 'string' ? rawA.toLowerCase() : (typeof rawA === 'number' ? rawA : 0);
        valueB = typeof rawB === 'string' ? rawB.toLowerCase() : (typeof rawB === 'number' ? rawB : 0);
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const totalTrainers = trainers.length;
    const totalPages = Math.ceil(totalTrainers / limit);
    const startIndex = (page - 1) * limit;
    const data = trainers.slice(startIndex, startIndex + limit);

    return { data, totalPages, currentPage: page, totalTrainers };
  }

  async getTrainerById(id: number): Promise<TrainerWithStats | null> {
    return this.trainerRepo.findById(id);
  }

  async getTrainersByUserId(
    userId: string,
  ): Promise<PaginatedTrainers> {
    const trainers = await this.trainerRepo.findByUserId(userId);
    const totalTrainers = trainers.length;

    return { data: trainers, totalPages: 1, currentPage: 1, totalTrainers };
  }

  async createTrainer(data: TrainerCreateData): Promise<{ trainer: TrainerWithStats; rewardMessage: string }> {
    // Check trainer name uniqueness
    const existingTrainer = await this.trainerRepo.findByName(data.name);
    if (existingTrainer) {
      throw new Error('A trainer with this name already exists');
    }

    // Auto-calculate zodiac from birthday
    let zodiac: string | undefined;
    let chineseZodiac: string | undefined;
    if (data.birthday) {
      zodiac = calculateZodiac(data.birthday) as string;
      chineseZodiac = calculateChineseZodiac(data.birthday) as string;
    }

    // Extract profile fields
    const { name: _n, playerUserId: _p, mainRef: _m, birthday: _bd, additionalRefs: _ar, ...profileFields } = data;

    const trainer = await this.trainerRepo.create({
      playerUserId: data.playerUserId,
      name: data.name,
      mainRef: data.mainRef ?? undefined,
      birthday: data.birthday ?? undefined,
      zodiac,
      chineseZodiac,
      ...profileFields,
    });

    // Initialize inventory for the new trainer
    await this.inventoryRepo.findOrCreate(trainer.id);

    // Award rewards for providing a main reference image
    let rewardMessage = '';
    if (data.mainRef && data.mainRef.trim() !== '') {
      const updated = await this.trainerRepo.addLevelsAndCoins(trainer.id, 6, 200);
      rewardMessage = ' You received 6 levels and 200 coins for providing a main reference image!';
      return { trainer: updated, rewardMessage };
    }

    return { trainer, rewardMessage };
  }

  async updateTrainer(id: number, data: TrainerUpdateData): Promise<TrainerWithStats> {
    // Check trainer name uniqueness (if changing name)
    if (data.name) {
      const existingTrainer = await this.trainerRepo.findByName(data.name);
      if (existingTrainer && existingTrainer.id !== id) {
        throw new Error('A trainer with this name already exists');
      }
    }

    // Auto-calculate zodiac from birthday
    let zodiac: string | undefined;
    let chineseZodiac: string | undefined;
    if (data.birthday) {
      zodiac = calculateZodiac(data.birthday) as string;
      chineseZodiac = calculateChineseZodiac(data.birthday) as string;
    }

    // Extract profile fields
    const { name: _n, mainRef: _m, additionalRefs: _ar, birthday: _bd, megaInfo: _mi, ...profileFields } = data;

    return this.trainerRepo.update(id, {
      name: data.name,
      mainRef: data.mainRef,
      additionalRefs: data.additionalRefs,
      birthday: data.birthday,
      zodiac,
      chineseZodiac,
      megaInfo: data.megaInfo,
      ...profileFields,
    });
  }

  async deleteTrainer(id: number): Promise<boolean> {
    return this.trainerRepo.delete(id);
  }

  // ===========================================================================
  // Inventory
  // ===========================================================================

  async getTrainerInventory(trainerId: number): Promise<TrainerInventory> {
    return this.inventoryRepo.findOrCreate(trainerId);
  }

  async updateTrainerInventoryItem(
    trainerId: number,
    category: InventoryCategory,
    itemName: string,
    quantity: number,
  ): Promise<TrainerInventory> {
    return this.inventoryRepo.setItemQuantity(trainerId, category, itemName, quantity);
  }

  async checkItemQuantity(trainerId: number, itemName: string): Promise<number> {
    return this.inventoryRepo.getItemQuantity(trainerId, itemName);
  }

  async useItem(trainerId: number, itemName: string, quantity = 1): Promise<boolean> {
    const item = await this.inventoryRepo.getItemByName(trainerId, itemName);
    if (!item || item.quantity < quantity) {
      return false;
    }
    await this.inventoryRepo.removeItem(trainerId, item.category, itemName, quantity);
    return true;
  }

  async addItem(
    trainerId: number,
    itemName: string,
    quantity = 1,
    category: InventoryCategory = 'items',
  ): Promise<boolean> {
    await this.inventoryRepo.addItem(trainerId, category, itemName, quantity);
    return true;
  }

  // ===========================================================================
  // Monsters
  // ===========================================================================

  async getTrainerMonsters(
    trainerId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedMonsters> {
    await this.monsterRepo.normalizeTypesInDb(trainerId);
    await this.monsterRepo.autoAssignBoxPositions(trainerId);
    const monsters = await this.monsterRepo.findByTrainerId(trainerId);
    const totalMonsters = monsters.length;
    const totalPages = Math.ceil(totalMonsters / limit);
    const startIndex = (page - 1) * limit;
    const paginatedMonsters = monsters.slice(startIndex, startIndex + limit);

    return { monsters: paginatedMonsters, totalMonsters, totalPages, currentPage: page };
  }

  async getAllTrainerMonsters(trainerId: number): Promise<MonsterWithTrainer[]> {
    await this.monsterRepo.normalizeTypesInDb(trainerId);
    await this.monsterRepo.autoAssignBoxPositions(trainerId);
    return this.monsterRepo.findByTrainerId(trainerId);
  }

  async updateMonsterBoxPositions(trainerId: number, positions: BoxPositionUpdate[]): Promise<void> {
    for (const pos of positions) {
      const monster = await this.monsterRepo.findById(pos.id);
      if (!monster) {
        throw new Error(`Monster with ID ${pos.id} not found`);
      }
      if (monster.trainer_id !== trainerId) {
        throw new Error(`Monster with ID ${pos.id} does not belong to trainer ${trainerId}`);
      }
      await this.monsterRepo.update(pos.id, {
        boxNumber: pos.boxNumber,
        trainerIndex: pos.position,
      });
    }
  }

  // ===========================================================================
  // Featured Monsters
  // ===========================================================================

  async getFeaturedMonsters(trainerId: number): Promise<FeaturedMonster[]> {
    const result = await db.query<FeaturedMonster>(
      `SELECT m.*, fm.display_order
       FROM featured_monsters fm
       JOIN monsters m ON fm.monster_id = m.id
       WHERE fm.trainer_id = $1
       ORDER BY fm.display_order ASC`,
      [trainerId],
    );
    return result.rows;
  }

  async updateFeaturedMonsters(trainerId: number, monsterIds: number[]): Promise<void> {
    if (monsterIds.length > 6) {
      throw new Error('Maximum 6 featured monsters allowed');
    }

    // Verify all monsters belong to this trainer
    for (const monsterId of monsterIds) {
      const monster = await this.monsterRepo.findById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }
      if (monster.trainer_id !== trainerId) {
        throw new Error(`Monster with ID ${monsterId} does not belong to trainer ${trainerId}`);
      }
    }

    // Replace in a transaction
    await db.transaction(async (client) => {
      await client.query('DELETE FROM featured_monsters WHERE trainer_id = $1', [trainerId]);
      for (let i = 0; i < monsterIds.length; i++) {
        await client.query(
          'INSERT INTO featured_monsters (trainer_id, monster_id, display_order) VALUES ($1, $2, $3)',
          [trainerId, monsterIds[i], i + 1],
        );
      }
    });
  }

  // ===========================================================================
  // References & Images
  // ===========================================================================

  async getTrainerReferences(trainerId: number): Promise<{
    mainRef: string | null;
    megaInfo: MegaInfo | null;
    additionalRefs: AdditionalRef[];
  }> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    let megaInfo: MegaInfo | null = null;
    if (trainer.mega_info) {
      try {
        megaInfo = JSON.parse(trainer.mega_info) as MegaInfo;
      } catch {
        megaInfo = null;
      }
    }

    let additionalRefs: AdditionalRef[] = [];
    if (trainer.additional_refs) {
      try {
        additionalRefs = JSON.parse(trainer.additional_refs) as AdditionalRef[];
      } catch {
        additionalRefs = [];
      }
    }

    return {
      mainRef: trainer.main_ref,
      megaInfo,
      additionalRefs,
    };
  }

  async getTrainerImages(trainerId: number): Promise<TrainerImagesResult> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    let megaImage: MegaInfo | null = null;
    if (trainer.mega_info) {
      try {
        megaImage = JSON.parse(trainer.mega_info) as MegaInfo;
      } catch {
        megaImage = null;
      }
    }

    let additionalRefs: AdditionalRef[] = [];
    if (trainer.additional_refs) {
      try {
        additionalRefs = JSON.parse(trainer.additional_refs) as AdditionalRef[];
      } catch {
        additionalRefs = [];
      }
    }

    return { mega_image: megaImage, additional_refs: additionalRefs };
  }

  async uploadImage(filePath: string, folder = 'trainers'): Promise<ImageUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
    });
    return { url: result.secure_url, public_id: result.public_id };
  }

  async setMegaImage(trainerId: number, imageUrl: string): Promise<MegaInfo> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    let megaInfo: MegaInfo = {};
    if (trainer.mega_info) {
      try {
        megaInfo = JSON.parse(trainer.mega_info) as MegaInfo;
      } catch {
        megaInfo = {};
      }
    }

    megaInfo.mega_ref = imageUrl;
    await this.trainerRepo.update(trainerId, { megaInfo: JSON.stringify(megaInfo) });
    return megaInfo;
  }

  async addAdditionalRef(
    trainerId: number,
    imageUrl: string,
    title = '',
    description = '',
  ): Promise<AdditionalRef> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    let additionalRefs: AdditionalRef[] = [];
    if (trainer.additional_refs) {
      try {
        additionalRefs = JSON.parse(trainer.additional_refs) as AdditionalRef[];
      } catch {
        additionalRefs = [];
      }
    }

    const newRef: AdditionalRef = {
      id: Date.now(),
      title,
      description,
      image_url: imageUrl,
    };

    additionalRefs.push(newRef);
    await this.trainerRepo.update(trainerId, {
      additionalRefs: JSON.stringify(additionalRefs),
    });

    return newRef;
  }

  // ===========================================================================
  // Levels (Self-service: level cap reallocation)
  // ===========================================================================

  async addTrainerLevels(
    trainerId: number,
    levels: number,
  ): Promise<{ oldLevel: number; newLevel: number; levelsAdded: number; updatedTrainer: TrainerWithStats }> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const updatedTrainer = await this.trainerRepo.addLevels(trainerId, levels);

    return {
      oldLevel: trainer.level,
      newLevel: updatedTrainer.level,
      levelsAdded: updatedTrainer.level - trainer.level,
      updatedTrainer,
    };
  }

  // ===========================================================================
  // Admin Level Management
  // ===========================================================================

  async adminAddLevelsToTrainer(
    trainerId: number,
    levels: number,
    coins?: number,
  ): Promise<AdminLevelResult> {
    const parsedCoins = coins ?? levels * 50;

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    await this.trainerRepo.addLevelsAndCoins(trainerId, levels, parsedCoins);

    return {
      trainer: {
        id: trainer.id,
        name: trainer.name,
        newLevel: trainer.level + levels,
        newCurrency: trainer.currency_amount + parsedCoins,
      },
    };
  }

  async adminAddLevelsToBulkTrainers(
    trainerIds: number[],
    levels: number,
    coins?: number,
  ): Promise<BulkLevelResult> {
    const parsedCoins = coins ?? levels * 50;

    const results: BulkLevelResult = { success: [], failed: [] };

    for (const trainerId of trainerIds) {
      try {
        const trainer = await this.trainerRepo.findById(trainerId);
        if (!trainer) {
          results.failed.push({ id: trainerId, reason: 'Trainer not found' });
          continue;
        }

        await this.trainerRepo.addLevelsAndCoins(trainerId, levels, parsedCoins);

        results.success.push({
          id: trainerId,
          name: trainer.name,
          newLevel: trainer.level + levels,
          newCurrency: trainer.currency_amount + parsedCoins,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ id: trainerId, reason: message });
      }
    }

    return results;
  }

  // ===========================================================================
  // Achievements
  // ===========================================================================

  async getTrainerAchievements(trainerId: number, isOwner: boolean): Promise<AchievementProgress[]> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const claimedIds = await this.achievementRepo.getClaimedAchievementIds(trainerId);

    // Count monsters by type for this trainer
    const typeCounts = await this.countMonstersByType(trainerId);
    const attributeCounts = await this.countMonstersByAttribute(trainerId);
    const level100Count = await this.countLevel100Monsters(trainerId);
    const unownCount = await this.countUnownMonsters(trainerId);

    const achievements: AchievementProgress[] = [];

    // Type achievements
    const typeAchievements = TrainerAchievementRepository.getTypeAchievements();
    for (const [type, defs] of Object.entries(typeAchievements)) {
      const progress = typeCounts[type] ?? 0;
      for (const def of defs) {
        const claimed = claimedIds.has(def.id);
        const unlocked = progress >= def.requirement;
        achievements.push({
          ...def,
          category: 'type',
          type,
          progress,
          unlocked,
          claimed,
          requirement: def.requirement,
          canClaim: isOwner && unlocked && !claimed,
        });
      }
    }

    // Attribute achievements
    const attributeAchievements = TrainerAchievementRepository.getAttributeAchievements();
    for (const [attribute, defs] of Object.entries(attributeAchievements)) {
      const progress = attributeCounts[attribute] ?? 0;
      for (const def of defs) {
        const claimed = claimedIds.has(def.id);
        const unlocked = progress >= def.requirement;
        achievements.push({
          ...def,
          category: 'attribute',
          attribute,
          progress,
          unlocked,
          claimed,
          requirement: def.requirement,
          canClaim: isOwner && unlocked && !claimed,
        });
      }
    }

    // Level 100 achievements
    for (const def of TrainerAchievementRepository.getLevel100Achievements()) {
      const claimed = claimedIds.has(def.id);
      const unlocked = level100Count >= def.requirement;
      achievements.push({
        ...def,
        category: 'level100',
        progress: level100Count,
        unlocked,
        claimed,
        requirement: def.requirement,
        canClaim: isOwner && unlocked && !claimed,
      });
    }

    // Trainer level achievements
    for (const def of TrainerAchievementRepository.getTrainerLevelAchievements()) {
      const claimed = claimedIds.has(def.id);
      const unlocked = trainer.level >= def.requirement;
      achievements.push({
        ...def,
        category: 'trainer_level',
        progress: trainer.level,
        unlocked,
        claimed,
        requirement: def.requirement,
        canClaim: isOwner && unlocked && !claimed,
      });
    }

    // Special achievements
    for (const def of TrainerAchievementRepository.getSpecialAchievements()) {
      const claimed = claimedIds.has(def.id);
      const unlocked = unownCount >= def.requirement;
      achievements.push({
        ...def,
        category: 'special',
        progress: unownCount,
        unlocked,
        claimed,
        requirement: def.requirement,
        canClaim: isOwner && unlocked && !claimed,
      });
    }

    return achievements;
  }

  async claimAchievement(trainerId: number, achievementId: string): Promise<AchievementClaimResult> {
    // Find the achievement definition
    const def = this.findAchievementDefinition(achievementId);
    if (!def) {
      throw new Error(`Achievement ${achievementId} not found`);
    }

    // Claim the achievement
    await this.achievementRepo.claimAchievement(trainerId, achievementId);

    // Award rewards
    if (def.reward.currency) {
      await this.trainerRepo.updateCurrency(trainerId, def.reward.currency);
    }
    if (def.reward.item) {
      await this.inventoryRepo.addItem(trainerId, 'items', def.reward.item, 1);
    }

    return {
      achievement: { id: def.id, name: def.name },
      reward: def.reward,
    };
  }

  async claimAllAchievements(trainerId: number): Promise<AchievementClaimAllResult> {
    const achievements = await this.getTrainerAchievements(trainerId, true);
    const claimable = achievements.filter((a) => a.canClaim);

    let totalCurrency = 0;
    const items: string[] = [];

    for (const achievement of claimable) {
      await this.achievementRepo.claimAchievement(trainerId, achievement.id);
      if (achievement.reward.currency) {
        totalCurrency += achievement.reward.currency;
      }
      if (achievement.reward.item) {
        items.push(achievement.reward.item);
        await this.inventoryRepo.addItem(trainerId, 'items', achievement.reward.item, 1);
      }
    }

    if (totalCurrency > 0) {
      await this.trainerRepo.updateCurrency(trainerId, totalCurrency);
    }

    return {
      message: `Claimed ${claimable.length} achievements!`,
      claimedCount: claimable.length,
      totalRewards: { currency: totalCurrency, items },
    };
  }

  async getAchievementStats(trainerId: number): Promise<AchievementStats> {
    const allIds = TrainerAchievementRepository.getAllAchievementIds();
    const claimedIds = await this.achievementRepo.getClaimedAchievementIds(trainerId);
    const achievements = await this.getTrainerAchievements(trainerId, false);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return {
      totalAchievements: allIds.length,
      claimedCount: claimedIds.size,
      unlockedCount,
      completionPercent:
        allIds.length > 0 ? Math.round((claimedIds.size / allIds.length) * 100) : 0,
    };
  }

  // ===========================================================================
  // Berries
  // ===========================================================================

  async getTrainerBerries(trainerId: number): Promise<SpecialBerryInventory> {
    return this.berryService.getAvailableSpecialBerries(trainerId);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  isTrainerOwner(trainer: TrainerWithStats, discordId: string): boolean {
    return trainer.player_user_id === discordId;
  }

  private findAchievementDefinition(
    achievementId: string,
  ): { id: string; name: string; reward: { currency?: number; item?: string } } | null {
    const allDefs = [
      ...Object.values(TrainerAchievementRepository.getTypeAchievements()).flat(),
      ...Object.values(TrainerAchievementRepository.getAttributeAchievements()).flat(),
      ...TrainerAchievementRepository.getLevel100Achievements(),
      ...TrainerAchievementRepository.getTrainerLevelAchievements(),
      ...TrainerAchievementRepository.getSpecialAchievements(),
    ];

    return allDefs.find((d) => d.id === achievementId) ?? null;
  }

  private async countMonstersByType(trainerId: number): Promise<Record<string, number>> {
    const monsters = await this.monsterRepo.findByTrainerId(trainerId);
    const counts: Record<string, number> = {};
    for (const m of monsters) {
      for (const t of [m.type1, m.type2, m.type3, m.type4, m.type5]) {
        if (t) {
          counts[t] = (counts[t] ?? 0) + 1;
        }
      }
    }
    return counts;
  }

  private async countMonstersByAttribute(trainerId: number): Promise<Record<string, number>> {
    const monsters = await this.monsterRepo.findByTrainerId(trainerId);
    const counts: Record<string, number> = {};
    for (const m of monsters) {
      if (m.attribute) {
        counts[m.attribute] = (counts[m.attribute] ?? 0) + 1;
      }
    }
    return counts;
  }

  private async countLevel100Monsters(trainerId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM monsters WHERE trainer_id = $1 AND level >= 100',
      [trainerId],
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  private async countUnownMonsters(trainerId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM monsters WHERE trainer_id = $1 AND (species1 ILIKE '%unown%' OR species2 ILIKE '%unown%')`,
      [trainerId],
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  // ===========================================================================
  // Admin Currency Management
  // ===========================================================================

  async adminUpdateCurrency(trainerId: number, amount: number): Promise<TrainerWithStats> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    return this.trainerRepo.updateCurrency(trainerId, amount);
  }

  // ===========================================================================
  // Admin Trainer Management
  // ===========================================================================

  async adminChangeOwner(trainerId: number, newOwnerDiscordId: string): Promise<TrainerWithStats> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    return this.trainerRepo.updateOwner(trainerId, newOwnerDiscordId);
  }

  async adminDeleteWithForfeit(
    trainerId: number,
    forfeitToBazar: boolean,
  ): Promise<{ forfeited: { monsters: number; items: number } }> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    let forfeitedMonsters = 0;
    let forfeitedItems = 0;

    if (forfeitToBazar) {
      const bazarService = new BazarService();

      // Forfeit all monsters
      const monsters = await this.monsterRepo.findByTrainerId(trainerId);
      for (const monster of monsters) {
        await bazarService.forfeitMonster(monster.id, trainerId, trainer.player_user_id);
        forfeitedMonsters++;
      }

      // Forfeit all inventory items
      const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
      if (inventory) {
        for (const category of INVENTORY_CATEGORIES) {
          const items = inventory[category] as Record<string, number>;
          if (!items) { continue; }
          for (const [itemName, quantity] of Object.entries(items)) {
            if (quantity > 0) {
              await bazarService.forfeitItem(trainerId, trainer.player_user_id, category, itemName, quantity);
              forfeitedItems++;
            }
          }
        }
      }
    }

    await this.trainerRepo.delete(trainerId);

    return { forfeited: { monsters: forfeitedMonsters, items: forfeitedItems } };
  }
}
