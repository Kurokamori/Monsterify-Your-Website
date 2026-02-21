import {
  AntiqueSettingRepository,
  AntiqueAuctionRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  MonsterRepository,
  UserRepository,
  type AntiqueSetting,
  type AntiqueSettingUpsertInput,
  type AntiqueAuction,
  type AntiqueAuctionCreateInput,
  type AntiqueAuctionUpdateInput,
  type AntiqueAuctionQueryOptions,
  type PaginatedAntiqueAuctions,
  type MonsterCreateInput,
} from '../repositories';
import {
  AntiqueAppraisalService,
  type Antique,
  type OverrideParameters,
} from './antique-appraisal.service';
import { MonsterRollerService, type UserSettings } from './monster-roller.service';
import { MonsterInitializerService } from './monster-initializer.service';
import cloudinary from '../utils/cloudinary';

// ============================================================================
// Types
// ============================================================================

export type FormattedAntique = {
  name: string;
  quantity: number;
};

export type CatalogueFilters = {
  antiques: { name: string; holiday: string }[];
  types: string[];
  creators: string[];
};

export type AntiqueDropdownItem = {
  name: string;
  holiday: string;
  category: string;
};

export type AppraiseResult = {
  monster: Record<string, unknown>;
  seed: string;
};

export type AuctionResult = {
  monster: Record<string, unknown>;
};

export type UploadResult = {
  url: string;
  publicId: string;
};

// ============================================================================
// Service
// ============================================================================

export class AntiqueService {
  private settingRepository: AntiqueSettingRepository;
  private auctionRepository: AntiqueAuctionRepository;
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private userRepository: UserRepository;
  private appraisalService: AntiqueAppraisalService;
  private initializerService: MonsterInitializerService;

  constructor(
    settingRepository?: AntiqueSettingRepository,
    auctionRepository?: AntiqueAuctionRepository,
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    userRepository?: UserRepository,
    appraisalService?: AntiqueAppraisalService,
    initializerService?: MonsterInitializerService
  ) {
    this.settingRepository = settingRepository ?? new AntiqueSettingRepository();
    this.auctionRepository = auctionRepository ?? new AntiqueAuctionRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.appraisalService = appraisalService ?? new AntiqueAppraisalService();
    this.initializerService = initializerService ?? new MonsterInitializerService();
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private settingToAntique(setting: AntiqueSetting): Antique {
    return {
      name: setting.itemName,
      roll_count: setting.rollCount,
      force_fusion: setting.forceFusion ?? undefined,
      force_no_fusion: setting.forceNoFusion ?? undefined,
      allow_fusion: setting.allowFusion ?? undefined,
      force_min_types: setting.forceMinTypes ?? undefined,
      override_parameters: setting.overrideParameters as OverrideParameters,
      category: setting.category as Antique['category'],
      holiday: setting.holiday as Antique['holiday'],
    };
  }

  // ==========================================================================
  // Antique Settings (Admin)
  // ==========================================================================

  async getAllAntiqueSettings(): Promise<AntiqueSetting[]> {
    return this.settingRepository.findAll();
  }

  async saveAntiqueSetting(input: AntiqueSettingUpsertInput): Promise<AntiqueSetting> {
    return this.settingRepository.upsert(input);
  }

  async deleteAntiqueSetting(itemName: string): Promise<void> {
    const deleted = await this.settingRepository.deleteByItemName(itemName);
    if (!deleted) {
      throw new Error(`Antique not found: ${itemName}`);
    }
  }

  // ==========================================================================
  // Auction CRUD (Admin)
  // ==========================================================================

  async getAntiqueAuctions(): Promise<AntiqueAuction[]> {
    return this.auctionRepository.findAll();
  }

  async getAntiqueAuctionById(id: number): Promise<AntiqueAuction | null> {
    return this.auctionRepository.findById(id);
  }

  async createAntiqueAuction(input: AntiqueAuctionCreateInput): Promise<AntiqueAuction> {
    return this.auctionRepository.create(input);
  }

  async updateAntiqueAuction(
    id: number,
    input: AntiqueAuctionUpdateInput
  ): Promise<AntiqueAuction> {
    const existing = await this.auctionRepository.findById(id);
    if (!existing) {
      throw new Error('Antique auction not found');
    }
    return this.auctionRepository.update(id, input);
  }

  async deleteAntiqueAuction(id: number): Promise<boolean> {
    const existing = await this.auctionRepository.findById(id);
    if (!existing) {
      throw new Error('Antique auction not found');
    }
    return this.auctionRepository.delete(id);
  }

  // ==========================================================================
  // Catalogue (Public)
  // ==========================================================================

  async getAuctionCatalogue(options: AntiqueAuctionQueryOptions): Promise<PaginatedAntiqueAuctions> {
    return this.auctionRepository.getCatalogue(options);
  }

  async getCatalogueFilters(): Promise<CatalogueFilters> {
    const [antiques, types, creators] = await Promise.all([
      this.auctionRepository.getUniqueAntiques(),
      this.auctionRepository.getUniqueTypes(),
      this.auctionRepository.getUniqueCreators(),
    ]);

    // Map antiques to their holiday categories from DB
    const allSettings = await this.settingRepository.findAll();
    const settingsMap = new Map(allSettings.map(s => [s.itemName, s]));

    const antiquesWithHolidays = antiques.map((antique) => {
      const setting = settingsMap.get(antique);
      return {
        name: antique,
        holiday: setting?.holiday ?? 'Unknown',
      };
    });

    return { antiques: antiquesWithHolidays, types, creators };
  }

  // ==========================================================================
  // Trainer Antiques
  // ==========================================================================

  async getTrainerAntiques(trainerId: number): Promise<FormattedAntique[]> {
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory) {
      throw new Error('Trainer inventory not found');
    }

    const antiques = inventory.antiques ?? {};
    return Object.entries(antiques).map(([name, quantity]) => ({
      name,
      quantity,
    }));
  }

  // ==========================================================================
  // Appraise Antique
  // ==========================================================================

  async appraiseAntique(trainerId: number, antiqueName: string): Promise<AppraiseResult> {
    // Validate trainer exists
    const trainer = await this.trainerRepository.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Get user settings for monster roller
    const userSettings = await this.getUserSettings(trainer.player_user_id);

    // Check if trainer has the antique
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory?.antiques?.[antiqueName]) {
      throw new Error(`Trainer does not have the antique: ${antiqueName}`);
    }

    // Get antique settings from DB
    const setting = await this.settingRepository.findByItemName(antiqueName);
    if (!setting) {
      throw new Error(`Antique not found: ${antiqueName}`);
    }

    // Convert DB setting to Antique type and get roller params
    const antique = this.settingToAntique(setting);
    const rollerParams = this.appraisalService.convertToRollerParams(antique);

    // Roll monster
    const seed = Date.now().toString();
    const monsterRoller = new MonsterRollerService({ seed, userSettings });
    const monster = await monsterRoller.rollMonster(rollerParams as Record<string, unknown>);

    if (!monster) {
      throw new Error('Failed to roll monster');
    }

    // Consume the antique from inventory
    await this.inventoryRepository.removeItem(trainerId, 'antiques', antiqueName, 1);

    return { monster, seed };
  }

  // ==========================================================================
  // Auction Options & Claim
  // ==========================================================================

  async getAuctionOptions(antiqueName: string): Promise<AntiqueAuction[]> {
    const options = await this.auctionRepository.findByAntique(antiqueName);
    if (options.length === 0) {
      throw new Error(`No auction options found for antique: ${antiqueName}`);
    }
    return options;
  }

  async auctionAntique(
    trainerId: number,
    targetTrainerId: number | undefined,
    antiqueName: string,
    auctionId: number,
    monsterName?: string,
    discordUserId?: string
  ): Promise<AuctionResult> {
    const actualTrainerId = targetTrainerId ?? trainerId;

    // Check if source trainer has the antique
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory?.antiques?.[antiqueName]) {
      throw new Error(`Trainer does not have the antique: ${antiqueName}`);
    }

    // Get the auction option
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw new Error(`Auction option not found with ID: ${auctionId}`);
    }

    // Get the target trainer
    const targetTrainer = await this.trainerRepository.findById(actualTrainerId);
    if (!targetTrainer) {
      throw new Error('Target trainer not found');
    }

    // Create a monster from the auction data
    const monsterInput: MonsterCreateInput = {
      trainerId: actualTrainerId,
      playerUserId: discordUserId ?? targetTrainer.player_user_id,
      name: monsterName ?? auction.name ?? auction.species1,
      species1: auction.species1,
      species2: auction.species2,
      species3: auction.species3,
      type1: auction.type1,
      type2: auction.type2,
      type3: auction.type3,
      type4: auction.type4,
      type5: auction.type5,
      attribute: auction.attribute,
      level: 1,
      dateMet: new Date(),
      whereMet: 'Antique Auction',
    };

    const monster = await this.monsterRepository.create(monsterInput);

    // Initialize the monster with proper stats and moves
    let initializedMonster: Record<string, unknown>;
    try {
      initializedMonster = await this.initializerService.initializeMonster(monster.id);
    } catch (initError) {
      // Roll back on initialization failure
      console.error('Failed to initialize monster, rolling back:', initError);
      await this.monsterRepository.delete(monster.id);
      throw new Error('Failed to initialize monster');
    }

    // Record the auction claim (non-critical)
    try {
      await this.auctionRepository.recordClaim(auctionId, actualTrainerId, monster.id);
    } catch (claimError) {
      console.error('Failed to record claim, but monster was created:', claimError);
    }

    // Consume the antique from inventory
    await this.inventoryRepository.removeItem(trainerId, 'antiques', antiqueName, 1);

    return { monster: initializedMonster };
  }

  // ==========================================================================
  // Antiques Dropdown (Admin)
  // ==========================================================================

  async getAllAntiquesDropdown(): Promise<AntiqueDropdownItem[]> {
    const settings = await this.settingRepository.findAll();
    return settings.map((s) => ({
      name: s.itemName,
      holiday: s.holiday,
      category: s.category,
    }));
  }

  // ==========================================================================
  // Image Upload (Admin)
  // ==========================================================================

  async uploadAntiqueImage(filePath: string): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'seasonal-adopts',
      use_filename: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private async getUserSettings(playerUserId: string): Promise<UserSettings> {
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

    if (!playerUserId) {
      return defaultSettings;
    }

    const user = await this.userRepository.findByDiscordId(playerUserId);
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
}
