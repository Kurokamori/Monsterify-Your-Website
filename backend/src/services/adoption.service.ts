import {
  MonthlyAdoptRepository,
  MonthlyAdopt,
  MonthlyAdoptWithCount,
  PaginatedMonthlyAdopts,
  TrainerRepository,
  TrainerInventoryRepository,
  TrainerInventory,
  InventoryCategory,
  MonsterRepository,
  MonsterCreateInput,
  MonsterWithTrainer,
  UserRepository,
} from '../repositories';
import { MonsterRollerService, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService, InitializedMonster } from './monster-initializer.service';
import { MONSTER_TYPES, DIGIMON_ATTRIBUTES } from '../utils/constants';
import {
  ART_QUALITY_BASE_LEVELS,
  BACKGROUND_BONUS_LEVELS,
  APPEARANCE_BONUS_LEVELS,
  DEFAULT_REWARD_RATES,
  type ArtQualityLevel,
  type BackgroundType,
  type AppearanceType,
} from '../utils/constants/game-constants';

// ============================================================================
// Types
// ============================================================================

export type AdoptionArtDetails = {
  quality: string;
  background: string;
  appearances: { type: string }[];
  complexityBonus: number;
};

export type ClaimAdoptInput = {
  adoptId: number;
  trainerId: number;
  monsterName?: string;
  discordUserId?: string;
  berryName?: string;
  pastryName?: string;
  speciesValue?: string;
  typeValue?: string;
  artDetails?: AdoptionArtDetails;
};

export type ClaimAdoptResult = {
  success: boolean;
  message: string;
  monster?: MonsterWithTrainer;
  artLevels?: number;
  artCoins?: number;
};

export type DaypassCheckResult = {
  hasDaypass: boolean;
  daypassCount: number;
};

export type GenerateAdoptsResult = {
  count: number;
  adopts: MonthlyAdopt[];
};

// ============================================================================
// Constants
// ============================================================================

const ADOPTS_PER_MONTH = 10;

const DAYPASS_ITEM_NAME = 'Daycare Daypass';

const DAYPASS_SEARCH_CATEGORIES: InventoryCategory[] = [
  'items', 'keyitems', 'berries', 'pastries', 'evolution',
  'eggs', 'antiques', 'helditems', 'seals',
];

const DIGIMON_ATTRIBUTE_VALUES = [...DIGIMON_ATTRIBUTES] as string[];

// Berry and pastry effect definitions
const SPECIES_BERRIES: Record<string, 'species1' | 'species2' | 'species3'> = {
  'Patama Berry': 'species1',
  'Azzuk Berry': 'species2',
  'Mangus Berry': 'species3',
};

const TYPE_BERRIES: Record<string, 'type1' | 'type2' | 'type3'> = {
  'Miraca Berry': 'type1',
  'Addish Berry': 'type2',
  'Sky Carrot Berry': 'type3',
};

const ATTRIBUTE_BERRY = 'Datei Berry';

const SPECIES_PASTRIES: Record<string, 'species1' | 'species2' | 'species3'> = {
  'Patama Pastry': 'species1',
  'Azzuk Pastry': 'species2',
  'Mangus Pastry': 'species3',
};

const TYPE_PASTRIES: Record<string, 'type1' | 'type2' | 'type3'> = {
  'Miraca Pastry': 'type1',
  'Addish Pastry': 'type2',
  'Sky Carrot Pastry': 'type3',
};

const ATTRIBUTE_PASTRY = 'Datei Pastry';

// ============================================================================
// Service
// ============================================================================

export class AdoptionService {
  private adoptRepository: MonthlyAdoptRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private monsterInitializer: MonsterInitializerService;
  private userRepository: UserRepository;

  constructor(
    adoptRepository?: MonthlyAdoptRepository,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    monsterInitializer?: MonsterInitializerService,
  ) {
    this.adoptRepository = adoptRepository ?? new MonthlyAdoptRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.monsterInitializer = monsterInitializer ?? new MonsterInitializerService();
    this.userRepository = new UserRepository();
  }

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  async getCurrentMonthAdopts(page = 1, limit = 10): Promise<PaginatedMonthlyAdopts> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await this.ensureCurrentMonthAdopts(year, month);
    return this.adoptRepository.findByYearAndMonth(year, month, { page, limit });
  }

  async getAllAdopts(page = 1, limit = 10): Promise<PaginatedMonthlyAdopts> {
    return this.adoptRepository.findAll({ page, limit });
  }

  async getAdoptsByYearAndMonth(year: number, month: number, page = 1, limit = 10): Promise<PaginatedMonthlyAdopts> {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
      await this.ensureCurrentMonthAdopts(year, month);
    }
    return this.adoptRepository.findByYearAndMonth(year, month, { page, limit });
  }

  async getMonthsWithData(): Promise<{ year: number; month: number }[]> {
    return this.adoptRepository.getMonthsWithData();
  }

  async getAdoptById(id: number): Promise<MonthlyAdoptWithCount | null> {
    return this.adoptRepository.findById(id);
  }

  // ==========================================================================
  // Daypass Check
  // ==========================================================================

  async checkDaycareDaypass(trainerId: number): Promise<DaypassCheckResult> {
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory) {
      return { hasDaypass: false, daypassCount: 0 };
    }

    let totalCount = 0;
    for (const category of DAYPASS_SEARCH_CATEGORIES) {
      const items = inventory[category];
      const count = items[DAYPASS_ITEM_NAME] ?? 0;
      totalCount += count;
    }

    return { hasDaypass: totalCount > 0, daypassCount: totalCount };
  }

  // ==========================================================================
  // Claim Adopt
  // ==========================================================================

  async claimAdopt(input: ClaimAdoptInput): Promise<ClaimAdoptResult> {
    const { adoptId, trainerId, monsterName, discordUserId, berryName, pastryName, speciesValue, typeValue, artDetails } = input;

    // Validate adopt exists
    const adopt = await this.adoptRepository.findById(adoptId);
    if (!adopt) {
      return { success: false, message: 'Adopt not found' };
    }

    // Validate trainer exists
    const trainer = await this.trainerRepository.findById(trainerId);
    if (!trainer) {
      return { success: false, message: 'Trainer not found' };
    }

    // Get inventory
    const inventory = await this.inventoryRepository.findOrCreate(trainerId);

    // Determine which item to consume and validate ownership
    const itemResult = this.resolveClaimItem(inventory, berryName, pastryName);
    if (!itemResult.valid) {
      return { success: false, message: itemResult.message };
    }

    // Build base monster data from adopt
    const monsterData: Record<string, unknown> = {
      species1: adopt.species1,
      species2: adopt.species2,
      species3: adopt.species3,
      type1: adopt.type1,
      type2: adopt.type2,
      type3: adopt.type3,
      type4: adopt.type4,
      type5: adopt.type5,
      attribute: adopt.attribute,
      name: monsterName ?? adopt.species1,
      level: 1,
      trainer_id: trainerId,
      player_user_id: discordUserId ?? trainer.player_user_id,
    };

    // Apply berry/pastry effects
    const userSettings = await this.getUserSettingsFromTrainer(trainerId);
    if (berryName) {
      await this.applyBerryEffects(monsterData, berryName, speciesValue, userSettings);
    } else if (pastryName) {
      this.applyPastryEffects(monsterData, pastryName, speciesValue, typeValue);
    }

    // Consume the item
    try {
      await this.consumeClaimItem(trainerId, itemResult);
    } catch {
      return { success: false, message: 'Failed to consume item from inventory' };
    }

    // Initialize monster with stats, moves, abilities
    let initializedMonster: InitializedMonster;
    try {
      initializedMonster = await this.monsterInitializer.initializeMonster(monsterData);
    } catch (error) {
      // Refund the item on initialization failure
      await this.refundClaimItem(trainerId, itemResult);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to initialize monster: ${msg}` };
    }

    // Create the monster in the database
    let createdMonster: MonsterWithTrainer;
    try {
      createdMonster = await this.monsterRepository.create(this.toMonsterCreateInput(initializedMonster, trainerId, discordUserId ?? trainer.player_user_id));
    } catch (error) {
      // Refund the item on creation failure
      await this.refundClaimItem(trainerId, itemResult);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to create monster: ${msg}` };
    }

    // Record the adoption claim
    await this.adoptRepository.recordAdoptionClaim(adoptId, trainerId, createdMonster.id);

    // Apply art reward levels and coins if art details provided
    let artLevels = 0;
    let artCoins = 0;
    if (artDetails) {
      artLevels = this.calculateArtLevels(artDetails);
      artCoins = artLevels * DEFAULT_REWARD_RATES.coinsPerLevel;

      if (artLevels > 0) {
        await this.monsterRepository.addLevels(createdMonster.id, artLevels);
        await this.trainerRepository.updateCurrency(trainerId, artCoins);
      }
    }

    // Re-fetch monster to get updated level
    const finalMonster = artLevels > 0
      ? await this.monsterRepository.findById(createdMonster.id) ?? createdMonster
      : createdMonster;

    return {
      success: true,
      message: 'Monster adopted successfully',
      monster: finalMonster,
      artLevels,
      artCoins,
    };
  }

  // ==========================================================================
  // Art Reward Calculation
  // ==========================================================================

  private calculateArtLevels(artDetails: AdoptionArtDetails): number {
    const qualityLevels = ART_QUALITY_BASE_LEVELS[artDetails.quality as ArtQualityLevel] ?? 0;
    const backgroundLevels = BACKGROUND_BONUS_LEVELS[artDetails.background as BackgroundType] ?? 0;

    const appearanceLevels = (artDetails.appearances || []).reduce((sum, app) => {
      return sum + (APPEARANCE_BONUS_LEVELS[app.type as AppearanceType] ?? 0);
    }, 0);

    const complexityBonus = artDetails.complexityBonus ?? 0;

    return qualityLevels + backgroundLevels + appearanceLevels + complexityBonus;
  }

  // ==========================================================================
  // Admin Operations
  // ==========================================================================

  async generateMonthlyAdopts(year?: number, month?: number, count?: number): Promise<GenerateAdoptsResult> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? (now.getMonth() + 1);
    const targetCount = count ?? ADOPTS_PER_MONTH;

    const roller = new MonsterRollerService();
    const adopts: MonthlyAdopt[] = [];

    for (let i = 0; i < targetCount; i++) {
      const monster = await roller.rollMonster();
      if (!monster) {
        continue;
      }

      const adopt = await this.adoptRepository.create({
        year: targetYear,
        month: targetMonth,
        species1: monster.species1 ?? monster.name,
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1 ?? monster.type_primary ?? 'Normal',
        type2: monster.type2 ?? monster.type_secondary,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5,
        attribute: monster.attribute,
      });

      adopts.push(adopt);
    }

    return { count: adopts.length, adopts };
  }

  async generateTestData(monthsCount = 3): Promise<{ year: number; month: number; count: number }[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const results: { year: number; month: number; count: number }[] = [];

    for (let i = 1; i <= monthsCount; i++) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;

      if (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const result = await this.generateMonthlyAdopts(targetYear, targetMonth);
      results.push({ year: targetYear, month: targetMonth, count: result.count });
    }

    return results;
  }

  async addDaycareDaypass(trainerId: number): Promise<{ daypassCount: number }> {
    await this.inventoryRepository.addItem(trainerId, 'items', DAYPASS_ITEM_NAME, 1);
    const quantity = await this.inventoryRepository.getItemQuantity(trainerId, DAYPASS_ITEM_NAME);
    return { daypassCount: quantity };
  }

  // ==========================================================================
  // Inventory Items for Adoption
  // ==========================================================================

  async getBerriesForAdoption(trainerId: number): Promise<Record<string, number>> {
    const inventory = await this.inventoryRepository.findOrCreate(trainerId);
    return inventory.berries;
  }

  async getPastriesForAdoption(trainerId: number): Promise<Record<string, number>> {
    const inventory = await this.inventoryRepository.findOrCreate(trainerId);
    return inventory.pastries;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private async ensureCurrentMonthAdopts(year: number, month: number): Promise<void> {
    const count = await this.adoptRepository.getCountForMonth(year, month);
    if (count === 0) {
      await this.generateMonthlyAdopts(year, month);
    }
  }

  private resolveClaimItem(
    inventory: TrainerInventory,
    berryName?: string,
    pastryName?: string,
  ): { valid: boolean; message: string; itemName: string; category: InventoryCategory } {
    if (berryName) {
      const quantity = inventory.berries[berryName] ?? 0;
      if (quantity < 1) {
        return { valid: false, message: `You don't have any ${berryName}`, itemName: berryName, category: 'berries' };
      }
      return { valid: true, message: '', itemName: berryName, category: 'berries' };
    }

    if (pastryName) {
      const quantity = inventory.pastries[pastryName] ?? 0;
      if (quantity < 1) {
        return { valid: false, message: `You don't have any ${pastryName}`, itemName: pastryName, category: 'pastries' };
      }
      return { valid: true, message: '', itemName: pastryName, category: 'pastries' };
    }

    // Look for Daycare Daypass across all categories
    for (const category of DAYPASS_SEARCH_CATEGORIES) {
      const items = inventory[category];
      const quantity = items[DAYPASS_ITEM_NAME] ?? 0;
      if (quantity > 0) {
        return { valid: true, message: '', itemName: DAYPASS_ITEM_NAME, category };
      }
    }

    return { valid: false, message: 'You need a Daycare Daypass to adopt a monster', itemName: DAYPASS_ITEM_NAME, category: 'items' };
  }

  private async consumeClaimItem(
    trainerId: number,
    item: { itemName: string; category: InventoryCategory },
  ): Promise<void> {
    await this.inventoryRepository.removeItem(trainerId, item.category, item.itemName, 1);
  }

  private async refundClaimItem(
    trainerId: number,
    item: { itemName: string; category: InventoryCategory },
  ): Promise<void> {
    try {
      await this.inventoryRepository.addItem(trainerId, item.category, item.itemName, 1);
    } catch (error) {
      console.error(`Failed to refund ${item.itemName} to trainer ${trainerId}:`, error);
    }
  }

  private async applyBerryEffects(
    monsterData: Record<string, unknown>,
    berryName: string,
    speciesValue?: string,
    userSettings?: UserSettings,
  ): Promise<void> {
    // Species modification berries
    const speciesSlot = SPECIES_BERRIES[berryName];
    if (speciesSlot) {
      if (speciesSlot === 'species1') {
        monsterData.species1 = speciesValue ?? await this.getRandomSpeciesName(userSettings);
      } else {
        monsterData[speciesSlot] ??= speciesValue ?? await this.getRandomSpeciesName(userSettings);
      }
      return;
    }

    // Type modification berries (random type)
    const typeSlot = TYPE_BERRIES[berryName];
    if (typeSlot) {
      if (typeSlot === 'type1') {
        monsterData.type1 = this.getRandomType();
      } else {
        monsterData[typeSlot] ??= this.getRandomType();
      }
      return;
    }

    // Attribute modification berry (random attribute)
    if (berryName === ATTRIBUTE_BERRY) {
      monsterData.attribute = DIGIMON_ATTRIBUTE_VALUES[Math.floor(Math.random() * DIGIMON_ATTRIBUTE_VALUES.length)];
    }
  }

  private applyPastryEffects(
    monsterData: Record<string, unknown>,
    pastryName: string,
    speciesValue?: string,
    typeValue?: string,
  ): void {
    // Species modification pastries (user-chosen species)
    const speciesSlot = SPECIES_PASTRIES[pastryName];
    if (speciesSlot && speciesValue) {
      if (speciesSlot === 'species1') {
        monsterData.species1 = speciesValue;
      } else {
        monsterData[speciesSlot] ??= speciesValue;
      }
      return;
    }

    // Type modification pastries (user-chosen type)
    const typeSlot = TYPE_PASTRIES[pastryName];
    if (typeSlot && typeValue) {
      if (typeSlot === 'type1') {
        monsterData.type1 = typeValue;
      } else {
        monsterData[typeSlot] ??= typeValue;
      }
      return;
    }

    // Attribute modification pastry (user-chosen attribute)
    if (pastryName === ATTRIBUTE_PASTRY && typeValue) {
      monsterData.attribute = typeValue;
    }
  }

  private async getUserSettingsFromTrainer(trainerId: number): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
    };

    const trainer = await this.trainerRepository.findById(trainerId);
    if (!trainer?.player_user_id) {
      return defaultSettings;
    }

    const user = await this.userRepository.findByDiscordId(trainer.player_user_id);
    if (!user?.monster_roller_settings) {
      return defaultSettings;
    }

    try {
      const settings =
        typeof user.monster_roller_settings === 'string'
          ? JSON.parse(user.monster_roller_settings)
          : user.monster_roller_settings;
      return { ...defaultSettings, ...settings };
    } catch {
      return defaultSettings;
    }
  }

  private async getRandomSpeciesName(userSettings?: UserSettings): Promise<string> {
    try {
      const roller = new MonsterRollerService(userSettings ? { userSettings } : {});
      const names = await roller.getAllNames();
      if (names.length === 0) { return 'Unknown'; }
      return names[Math.floor(Math.random() * names.length)] ?? 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  private getRandomType(): string {
    const types = [...MONSTER_TYPES];
    return types[Math.floor(Math.random() * types.length)] ?? 'Normal';
  }

  private toMonsterCreateInput(
    monster: InitializedMonster,
    trainerId: number,
    playerUserId: string,
  ): MonsterCreateInput {
    return {
      trainerId,
      playerUserId,
      name: (monster.name as string) ?? (monster.species1 as string) ?? 'Unknown',
      species1: (monster.species1 as string) ?? 'Unknown',
      species2: monster.species2 as string | null,
      species3: monster.species3 as string | null,
      type1: (monster.type1 as string) ?? 'Normal',
      type2: monster.type2 as string | null,
      type3: monster.type3 as string | null,
      type4: monster.type4 as string | null,
      type5: monster.type5 as string | null,
      attribute: monster.attribute as string | null,
      level: monster.level ?? 1,
      hpTotal: monster.hp_total,
      hpIv: monster.hp_iv,
      hpEv: monster.hp_ev,
      atkTotal: monster.atk_total,
      atkIv: monster.atk_iv,
      atkEv: monster.atk_ev,
      defTotal: monster.def_total,
      defIv: monster.def_iv,
      defEv: monster.def_ev,
      spaTotal: monster.spa_total,
      spaIv: monster.spa_iv,
      spaEv: monster.spa_ev,
      spdTotal: monster.spd_total,
      spdIv: monster.spd_iv,
      spdEv: monster.spd_ev,
      speTotal: monster.spe_total,
      speIv: monster.spe_iv,
      speEv: monster.spe_ev,
      nature: monster.nature,
      characteristic: monster.characteristic,
      gender: monster.gender,
      friendship: monster.friendship,
      ability1: monster.ability1,
      ability2: monster.ability2,
      moveset: typeof monster.moveset === 'string' ? JSON.parse(monster.moveset) : (monster.moveset as string[]) ?? [],
      dateMet: monster.date_met ? new Date(monster.date_met as string) : new Date(),
      whereMet: (monster.where_met as string) ?? 'Adoption Center',
    };
  }
}
