import { db } from '../database';
import {
  ItemRepository,
  ItemRow,
  ItemCreateInput,
  ItemUpdateInput,
  ItemQueryOptions,
  PaginatedItems,
  TrainerInventoryRepository,
  InventoryCategory,
  INVENTORY_CATEGORIES,
  MonsterRepository,
  MonsterWithTrainer,
  MonsterUpdateInput,
  TrainerRepository,
  UserRepository,
} from '../repositories';
import type { MonsterRollerSettings } from '../repositories';
import { ItemRollerService, type ItemRollOptions, type RolledItem, type RollAndAddResult } from './item-roller.service';
import { SpecialBerryService, type SpecialBerryName } from './special-berry.service';
import { MonsterInitializerService } from './monster-initializer.service';
import { MonsterRollerService, type UserSettings, type RollParams } from './monster-roller.service';
import { MONSTER_TYPES, DIGIMON_ATTRIBUTES, TABLE_NAME_MAP } from '../utils/constants';
import cloudinary from '../utils/cloudinary';

// ============================================================================
// Types
// ============================================================================

export type UseBerryParams = {
  monsterId: number;
  berryName: string;
  trainerId: number;
  speciesValue?: string;
  newMonsterName?: string;
  userId: string;
  isAdmin?: boolean;
};

export type UseBerryResult = {
  success: boolean;
  message: string;
  monster?: MonsterWithTrainer;
  newMonster?: MonsterWithTrainer;
};

export type UsePastryParams = {
  monsterId: number;
  pastryName: string;
  trainerId: number;
  selectedValue?: string;
  userId: string;
  isAdmin?: boolean;
};

export type UsePastryResult = {
  success: boolean;
  message: string;
  monster?: MonsterWithTrainer;
  requiresSelection?: boolean;
  pastryName?: string;
};

export type AddItemResult = {
  success: boolean;
  message: string;
  data?: {
    trainer: { id: number; name: string };
    item: { name: string; quantity: number; category: string };
  };
};

export type BulkAddItemResult = {
  success: boolean;
  message: string;
  data?: {
    results: {
      success: Array<{ id: number; name: string }>;
      failed: Array<{ id: number; name?: string; reason: string }>;
    };
    item: { name: string; quantity: number; category: string };
  };
};

export type SpeciesValidationResult = {
  valid: boolean;
  error?: string;
};

export type UploadImageResult = {
  url: string;
  publicId: string;
};

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_TO_INVENTORY: Record<string, InventoryCategory> = {
  items: 'items',
  berries: 'berries',
  pastries: 'pastries',
  balls: 'balls',
  evolution: 'evolution',
  helditems: 'helditems',
  eggs: 'eggs',
  seals: 'seals',
  keyitems: 'keyitems',
  antiques: 'antiques',
  // Legacy mappings from old JS codebase
  key_items: 'keyitems',
};

const SPECIES_PASTRIES = [
  'Patama Pastry',
  'Bluk Pastry',
  'Nuevo Pastry',
  'Azzuk Pastry',
  'Mangus Pastry',
];

// ============================================================================
// Service
// ============================================================================

export class ItemsService {
  private itemRepo: ItemRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private monsterRepo: MonsterRepository;
  private trainerRepo: TrainerRepository;
  private userRepo: UserRepository;
  private itemRollerService: ItemRollerService;
  private specialBerryService: SpecialBerryService;
  private monsterInitializer: MonsterInitializerService;

  constructor() {
    this.itemRepo = new ItemRepository();
    this.inventoryRepo = new TrainerInventoryRepository();
    this.monsterRepo = new MonsterRepository();
    this.trainerRepo = new TrainerRepository();
    this.userRepo = new UserRepository();
    this.itemRollerService = new ItemRollerService();
    this.specialBerryService = new SpecialBerryService();
    this.monsterInitializer = new MonsterInitializerService();
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async getAllItems(options: ItemQueryOptions = {}): Promise<PaginatedItems> {
    return this.itemRepo.findAll(options);
  }

  async getAllCategories(): Promise<string[]> {
    return this.itemRepo.getAllCategories();
  }

  async getAllTypes(): Promise<string[]> {
    return this.itemRepo.getAllTypes();
  }

  async getAllRarities(): Promise<string[]> {
    return this.itemRepo.getAllRarities();
  }

  async getItemById(id: number): Promise<ItemRow | null> {
    return this.itemRepo.findById(id);
  }

  async createItem(input: ItemCreateInput): Promise<ItemRow> {
    return this.itemRepo.create(input);
  }

  async createBulkItems(items: ItemCreateInput[]): Promise<ItemRow[]> {
    return db.transaction(async () => {
      const created: ItemRow[] = [];
      for (const item of items) {
        const newItem = await this.itemRepo.create(item);
        created.push(newItem);
      }
      return created;
    });
  }

  async updateItem(id: number, input: ItemUpdateInput): Promise<ItemRow> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) {
      throw new Error('Item not found');
    }
    return this.itemRepo.update(id, input);
  }

  async deleteItem(id: number): Promise<void> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) {
      throw new Error('Item not found');
    }
    await this.itemRepo.delete(id);
  }

  async batchUpdateItemImages(updates: { id: number; imageUrl: string }[]): Promise<number> {
    return this.itemRepo.batchUpdateImages(updates);
  }

  async uploadImage(filePath: string): Promise<UploadImageResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'items',
      use_filename: true,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  // ==========================================================================
  // Berry Usage
  // ==========================================================================

  async useBerry(params: UseBerryParams): Promise<UseBerryResult> {
    const { monsterId, berryName, trainerId, speciesValue, newMonsterName, userId, isAdmin } = params;

    // Validate trainer ownership
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    if (!isAdmin && trainer.player_user_id !== userId) {
      throw new Error('Trainer does not belong to this user');
    }

    // Get user settings for species rolling
    const user = await this.userRepo.findByDiscordId(userId);
    const rawSettings = user?.monster_roller_settings ?? null;
    const parsedSettings = this.parseMonsterRollerSettings(rawSettings);
    const userSettings = this.getUserSettings(parsedSettings);

    // Check inventory
    const hasItem = await this.inventoryRepo.hasItem(trainerId, berryName);
    if (!hasItem) {
      throw new Error(`Trainer does not have ${berryName}`);
    }

    // Get the monster
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }
    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the trainer');
    }

    // Apply berry effect
    const { update, applied, newMonster } = await this.applyBerryEffect(
      monster,
      berryName,
      speciesValue,
      newMonsterName,
      userSettings,
    );

    if (!applied) {
      throw new Error(`Cannot apply ${berryName} to this monster`);
    }

    // Update the monster
    await this.monsterRepo.update(monsterId, update);

    // Consume the berry
    await this.inventoryRepo.removeItem(trainerId, 'berries', berryName, 1);

    // Fetch the updated monster
    const updatedMonster = await this.monsterRepo.findById(monsterId);

    const result: UseBerryResult = {
      success: true,
      message: `Successfully applied ${berryName} to the monster`,
      monster: updatedMonster ?? undefined,
    };

    if (berryName === 'Divest Berry' && newMonster) {
      result.newMonster = newMonster;
      result.message = `Successfully applied ${berryName} to split ${monster.name} into two monsters`;
    }

    return result;
  }

  // ==========================================================================
  // Pastry Usage
  // ==========================================================================

  async usePastry(params: UsePastryParams): Promise<UsePastryResult> {
    const { monsterId, pastryName, trainerId, selectedValue, userId, isAdmin } = params;

    // If no selectedValue, return requiresSelection response
    if (!selectedValue) {
      return {
        success: true,
        message: 'Please select a value for the pastry',
        pastryName,
        requiresSelection: true,
      };
    }

    // Validate trainer ownership
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    if (!isAdmin && trainer.player_user_id !== userId) {
      throw new Error('Trainer does not belong to this user');
    }

    // Validate species for species-setting pastries
    if (SPECIES_PASTRIES.includes(pastryName)) {
      const validation = await this.validateSpeciesForPastry(selectedValue);
      if (!validation.valid) {
        throw new Error(
          validation.error ??
            `Invalid species: ${selectedValue}. Pastries can only use base stage, unevolved species.`,
        );
      }
    }

    // Check inventory
    const hasItem = await this.inventoryRepo.hasItem(trainerId, pastryName);
    if (!hasItem) {
      throw new Error(`Trainer does not have ${pastryName}`);
    }

    // Get the monster
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }
    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the trainer');
    }

    // Apply pastry effect
    const { update, applied } = this.applyPastryEffect(monster, pastryName, selectedValue);

    if (!applied) {
      throw new Error(`Cannot apply ${pastryName} to this monster`);
    }

    // Update the monster
    await this.monsterRepo.update(monsterId, update);

    // Consume the pastry
    await this.inventoryRepo.removeItem(trainerId, 'pastries', pastryName, 1);

    const updatedMonster = await this.monsterRepo.findById(monsterId);

    return {
      success: true,
      message: `Successfully applied ${pastryName} to the monster`,
      monster: updatedMonster ?? undefined,
    };
  }

  // ==========================================================================
  // Item Rolling (delegates to ItemRollerService)
  // ==========================================================================

  async rollItems(options: ItemRollOptions): Promise<RolledItem[]> {
    return this.itemRollerService.rollItems(options);
  }

  async rollItemsForTrainer(trainerId: number, options: ItemRollOptions): Promise<RollAndAddResult> {
    // Verify trainer exists
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    return this.itemRollerService.rollAndAddToInventory(trainerId, options);
  }

  // ==========================================================================
  // Admin Management
  // ==========================================================================

  async addItemToTrainer(
    trainerId: number,
    category: string,
    itemName: string,
    quantity: number,
  ): Promise<AddItemResult> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const inventoryField = this.mapCategoryToInventory(category);
    await this.inventoryRepo.addItem(trainerId, inventoryField, itemName, quantity);

    return {
      success: true,
      message: `Successfully added ${quantity} ${itemName} to trainer ${trainer.name}`,
      data: {
        trainer: { id: trainer.id, name: trainer.name },
        item: { name: itemName, quantity, category },
      },
    };
  }

  async addItemToBulkTrainers(
    trainerIds: number[],
    category: string,
    itemName: string,
    quantity: number,
  ): Promise<BulkAddItemResult> {
    const inventoryField = this.mapCategoryToInventory(category);
    const results: { success: Array<{ id: number; name: string }>; failed: Array<{ id: number; name?: string; reason: string }> } = {
      success: [],
      failed: [],
    };

    for (const trainerId of trainerIds) {
      try {
        const trainer = await this.trainerRepo.findById(trainerId);
        if (!trainer) {
          results.failed.push({ id: trainerId, reason: 'Trainer not found' });
          continue;
        }
        await this.inventoryRepo.addItem(trainerId, inventoryField, itemName, quantity);
        results.success.push({ id: trainerId, name: trainer.name });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ id: trainerId, reason: msg });
      }
    }

    return {
      success: true,
      message: `Successfully added ${itemName} to ${results.success.length} trainers (${results.failed.length} failed)`,
      data: {
        results,
        item: { name: itemName, quantity, category },
      },
    };
  }

  async addItemToAllTrainers(
    category: string,
    itemName: string,
    quantity: number,
  ): Promise<BulkAddItemResult> {
    const inventoryField = this.mapCategoryToInventory(category);

    const trainersResult = await db.query<{ id: number; name: string }>(
      'SELECT id, name FROM trainers',
    );
    const trainers = trainersResult.rows;

    if (trainers.length === 0) {
      throw new Error('No trainers found');
    }

    const results: { success: Array<{ id: number; name: string }>; failed: Array<{ id: number; name?: string; reason: string }> } = {
      success: [],
      failed: [],
    };

    for (const trainer of trainers) {
      try {
        await this.inventoryRepo.addItem(trainer.id, inventoryField, itemName, quantity);
        results.success.push({ id: trainer.id, name: trainer.name });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ id: trainer.id, name: trainer.name, reason: msg });
      }
    }

    return {
      success: true,
      message: `Successfully added ${itemName} to ${results.success.length} trainers (${results.failed.length} failed)`,
      data: {
        results,
        item: { name: itemName, quantity, category },
      },
    };
  }

  async addSpecialBerriesToTrainer(
    trainerId: number,
    berryName?: SpecialBerryName,
    quantity = 5,
  ): Promise<{ success: boolean; message: string; berries: Record<string, number> }> {
    if (!berryName) {
      await this.specialBerryService.addSpecialBerry(trainerId, 'Forget-Me-Not', quantity);
      await this.specialBerryService.addSpecialBerry(trainerId, 'Edenwiess', quantity);
    } else {
      await this.specialBerryService.addSpecialBerry(trainerId, berryName, quantity);
    }

    const updatedBerries = await this.specialBerryService.getAvailableSpecialBerries(trainerId);

    return {
      success: true,
      message: `Special berries added to trainer ${trainerId}`,
      berries: updatedBerries,
    };
  }

  // ==========================================================================
  // Private: Berry Effect Application
  // ==========================================================================

  private async applyBerryEffect(
    monster: MonsterWithTrainer,
    berryName: string,
    speciesValue: string | undefined,
    newMonsterName: string | undefined,
    userSettings: UserSettings,
  ): Promise<{ update: MonsterUpdateInput; applied: boolean; newMonster?: MonsterWithTrainer }> {
    const update: MonsterUpdateInput = {};
    let applied = false;
    let newMonster: MonsterWithTrainer | undefined;

    switch (berryName) {
      // === Species Removal ===
      case 'Bugger Berry':
        if (monster.species2) {
          update.species1 = monster.species2;
          update.species2 = monster.species3 ?? null;
          update.species3 = null;
          applied = true;
        }
        break;
      case 'Mala Berry':
        if (monster.species2) {
          update.species2 = monster.species3 ?? null;
          update.species3 = null;
          applied = true;
        }
        break;
      case 'Merco Berry':
        if (monster.species3) {
          update.species3 = null;
          applied = true;
        }
        break;

      // === Type Removal ===
      case 'Siron Berry':
        if (monster.type2 || monster.type3 || monster.type4 || monster.type5) {
          update.type1 = monster.type2 ?? monster.type1;
          update.type2 = monster.type3 ?? null;
          update.type3 = monster.type4 ?? null;
          update.type4 = monster.type5 ?? null;
          update.type5 = null;
          applied = true;
        }
        break;
      case 'Lilan Berry':
        if (monster.type2) {
          update.type2 = monster.type3 ?? null;
          update.type3 = monster.type4 ?? null;
          update.type4 = monster.type5 ?? null;
          update.type5 = null;
          applied = true;
        }
        break;
      case 'Kham Berry':
        if (monster.type3) {
          update.type3 = monster.type4 ?? null;
          update.type4 = monster.type5 ?? null;
          update.type5 = null;
          applied = true;
        }
        break;
      case 'Maizi Berry':
        if (monster.type4) {
          update.type4 = monster.type5 ?? null;
          update.type5 = null;
          applied = true;
        }
        break;
      case 'Fani Berry':
        if (monster.type5) {
          update.type5 = null;
          applied = true;
        }
        break;

      // === Type Randomization ===
      case 'Miraca Berry': {
        const newType1 = this.getRandomTypeExcluding(monster);
        update.type1 = newType1;
        applied = true;
        break;
      }
      case 'Cocon Berry':
        if (monster.type2) {
          update.type2 = this.getRandomTypeExcluding(monster);
          applied = true;
        }
        break;
      case 'Durian Berry':
        if (monster.type3) {
          update.type3 = this.getRandomTypeExcluding(monster);
          applied = true;
        }
        break;
      case 'Monel Berry':
        if (monster.type4) {
          update.type4 = this.getRandomTypeExcluding(monster);
          applied = true;
        }
        break;
      case 'Perep Berry':
        if (monster.type5) {
          update.type5 = this.getRandomTypeExcluding(monster);
          applied = true;
        }
        break;

      // === Type Addition ===
      case 'Addish Berry':
        if (!monster.type2) {
          update.type2 = this.getRandomType();
          applied = true;
        }
        break;
      case 'Sky Carrot Berry':
        if (!monster.type3) {
          update.type3 = this.getRandomType();
          applied = true;
        }
        break;
      case 'Kembre Berry':
        if (!monster.type4) {
          update.type4 = this.getRandomType();
          applied = true;
        }
        break;
      case 'Espara Berry':
        if (!monster.type5) {
          update.type5 = this.getRandomType();
          applied = true;
        }
        break;

      // === Species Randomization ===
      case 'Patama Berry': {
        const species1 = speciesValue ?? await this.getRandomSpecies(userSettings);
        update.species1 = species1;
        applied = true;
        break;
      }
      case 'Bluk Berry':
        if (monster.species2) {
          update.species2 = speciesValue ?? await this.getRandomSpecies(userSettings);
          applied = true;
        }
        break;
      case 'Nuevo Berry':
        if (monster.species3) {
          update.species3 = speciesValue ?? await this.getRandomSpecies(userSettings);
          applied = true;
        }
        break;

      // === Species Addition ===
      case 'Azzuk Berry':
        if (!monster.species2) {
          update.species2 = speciesValue ?? await this.getRandomSpecies(userSettings);
          applied = true;
        }
        break;
      case 'Mangus Berry':
        if (!monster.species3) {
          update.species3 = speciesValue ?? await this.getRandomSpecies(userSettings);
          applied = true;
        }
        break;

      // === Attribute Randomization ===
      case 'Datei Berry': {
        const randomIndex = Math.floor(Math.random() * DIGIMON_ATTRIBUTES.length);
        update.attribute = DIGIMON_ATTRIBUTES[randomIndex] ?? 'Data';
        applied = true;
        break;
      }

      // === Species Splitting ===
      case 'Divest Berry': {
        if (!monster.species2) {
          throw new Error('Monster must have at least 2 species to use Divest Berry');
        }

        const splitResult = await this.handleDivestBerry(monster, newMonsterName);
        Object.assign(update, splitResult.update);
        newMonster = splitResult.newMonster;
        applied = true;
        break;
      }

      default:
        throw new Error(`Unknown berry: ${berryName}`);
    }

    return { update, applied, newMonster };
  }

  // ==========================================================================
  // Private: Pastry Effect Application
  // ==========================================================================

  private applyPastryEffect(
    monster: MonsterWithTrainer,
    pastryName: string,
    selectedValue: string,
  ): { update: MonsterUpdateInput; applied: boolean } {
    const update: MonsterUpdateInput = {};
    let applied = false;

    switch (pastryName) {
      // === Type Setting ===
      case 'Miraca Pastry':
        update.type1 = selectedValue;
        applied = true;
        break;
      case 'Cocon Pastry':
        if (monster.type2) {
          update.type2 = selectedValue;
          applied = true;
        }
        break;
      case 'Durian Pastry':
        if (monster.type3) {
          update.type3 = selectedValue;
          applied = true;
        }
        break;
      case 'Monel Pastry':
        if (monster.type4) {
          update.type4 = selectedValue;
          applied = true;
        }
        break;
      case 'Perep Pastry':
        if (monster.type5) {
          update.type5 = selectedValue;
          applied = true;
        }
        break;

      // === Type Addition ===
      case 'Addish Pastry':
        if (!monster.type2) {
          update.type2 = selectedValue;
          applied = true;
        }
        break;
      case 'Sky Carrot Pastry':
        if (!monster.type3) {
          update.type3 = selectedValue;
          applied = true;
        }
        break;
      case 'Kembre Pastry':
        if (!monster.type4) {
          update.type4 = selectedValue;
          applied = true;
        }
        break;
      case 'Espara Pastry':
        if (!monster.type5) {
          update.type5 = selectedValue;
          applied = true;
        }
        break;

      // === Species Setting ===
      case 'Patama Pastry':
        update.species1 = selectedValue;
        applied = true;
        break;
      case 'Bluk Pastry':
        if (monster.species2) {
          update.species2 = selectedValue;
          applied = true;
        }
        break;
      case 'Nuevo Pastry':
        if (monster.species3) {
          update.species3 = selectedValue;
          applied = true;
        }
        break;

      // === Species Addition ===
      case 'Azzuk Pastry':
        if (!monster.species2) {
          update.species2 = selectedValue;
          applied = true;
        }
        break;
      case 'Mangus Pastry':
        if (!monster.species3) {
          update.species3 = selectedValue;
          applied = true;
        }
        break;

      // === Attribute Setting ===
      case 'Datei Pastry':
        update.attribute = selectedValue;
        applied = true;
        break;

      default:
        throw new Error(`Unknown pastry: ${pastryName}`);
    }

    return { update, applied };
  }

  // ==========================================================================
  // Private: Divest Berry (Species Split)
  // ==========================================================================

  private async handleDivestBerry(
    monster: MonsterWithTrainer,
    newMonsterName?: string,
  ): Promise<{ update: MonsterUpdateInput; newMonster: MonsterWithTrainer }> {
    const update: MonsterUpdateInput = {};
    let splitSpecies: string;

    if (monster.species3) {
      // 3 species -> new monster gets species1, original keeps species2+species3
      splitSpecies = monster.species1;
      update.species1 = monster.species2 ?? undefined;
      update.species2 = monster.species3;
      update.species3 = null;
    } else {
      // 2 species -> new monster gets species1, original keeps species2
      splitSpecies = monster.species1;
      update.species1 = monster.species2 ?? undefined;
      update.species2 = null;
    }

    // Initialize new monster with proper stats via MonsterInitializerService
    const initializedData = await this.monsterInitializer.initializeMonster({
      trainer_id: monster.trainer_id,
      name: newMonsterName ?? `${monster.name} Clone`,
      species1: splitSpecies,
      type1: monster.type1,
      type2: monster.type2,
      type3: monster.type3,
      type4: monster.type4,
      type5: monster.type5,
      attribute: monster.attribute,
      level: 1,
      where_met: 'Species Split',
      date_met: new Date().toISOString().split('T')[0],
    });

    const newMonster = await this.monsterRepo.create({
      trainerId: monster.trainer_id,
      playerUserId: monster.player_user_id,
      name: newMonsterName ?? (initializedData.name ?? `${monster.name} Clone`),
      species1: initializedData.species1 ?? splitSpecies,
      species2: initializedData.species2 ?? null,
      species3: initializedData.species3 ?? null,
      type1: initializedData.type1 ?? monster.type1,
      type2: initializedData.type2 ?? null,
      type3: initializedData.type3 ?? null,
      type4: initializedData.type4 ?? null,
      type5: initializedData.type5 ?? null,
      attribute: initializedData.attribute ?? null,
      level: 1,
      hpIv: initializedData.hp_iv,
      atkIv: initializedData.atk_iv,
      defIv: initializedData.def_iv,
      spaIv: initializedData.spa_iv,
      spdIv: initializedData.spd_iv,
      speIv: initializedData.spe_iv,
      hpTotal: initializedData.hp_total,
      atkTotal: initializedData.atk_total,
      defTotal: initializedData.def_total,
      spaTotal: initializedData.spa_total,
      spdTotal: initializedData.spd_total,
      speTotal: initializedData.spe_total,
      nature: initializedData.nature ?? null,
      characteristic: initializedData.characteristic ?? null,
      gender: initializedData.gender ?? null,
      whereMet: 'Species Split',
      dateMet: new Date(),
    });

    return { update, newMonster };
  }

  // ==========================================================================
  // Private: Random Type/Species Helpers
  // ==========================================================================

  private getRandomType(): string {
    const idx = Math.floor(Math.random() * MONSTER_TYPES.length);
    return MONSTER_TYPES[idx] ?? 'Normal';
  }

  private getRandomTypeExcluding(monster: MonsterWithTrainer): string {
    const existingTypes = new Set([
      monster.type1,
      monster.type2,
      monster.type3,
      monster.type4,
      monster.type5,
    ].filter(Boolean));

    const available = MONSTER_TYPES.filter((t) => !existingTypes.has(t));
    if (available.length === 0) {
      return this.getRandomType();
    }

    const idx = Math.floor(Math.random() * available.length);
    return available[idx] ?? 'Normal';
  }

  private async getRandomSpecies(userSettings: UserSettings): Promise<string> {
    try {
      const rollerOptions = {
        seed: Date.now().toString(),
        userSettings,
      };
      const monsterRoller = new MonsterRollerService(rollerOptions);

      const rollParams: RollParams = {
        includeStages: ['Base Stage', "Doesn't Evolve"],
        excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
        legendary: false,
        mythical: false,
        tableFilters: {
          pokemon: {
            includeStages: ['Base Stage', "Doesn't Evolve"],
            excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
            legendary: false,
            mythical: false,
          },
          digimon: {
            includeRanks: ['Baby I', 'Baby II'],
            excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion'],
          },
          yokai: {
            includeRanks: ['E', 'D', 'C'],
            excludeRanks: ['S', 'A', 'B'],
            includeStages: ['Base Stage', "Doesn't Evolve"],
            excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          },
          nexomon: {
            includeStages: ['Base Stage', "Doesn't Evolve"],
            excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
            legendary: false,
          },
        },
      };

      const monster = await monsterRoller.rollMonster(rollParams);
      return monster?.name ?? 'Unknown';
    } catch (error) {
      console.error('Error getting random species:', error);
      return 'Unknown';
    }
  }

  // ==========================================================================
  // Private: Species Validation for Pastries
  // ==========================================================================

  async validateSpeciesForPastry(speciesName: string): Promise<SpeciesValidationResult> {
    try {
      type SpeciesLookupRow = {
        name: string;
        monster_type: string;
        stage: string | null;
        is_legendary: boolean;
        is_mythical: boolean;
        rank: string | null;
      };

      const tables = Object.entries(TABLE_NAME_MAP) as [string, string][];
      let species: SpeciesLookupRow | null = null;

      // Query each table until we find a match
      for (const [monsterType, tableName] of tables) {
        const hasStage = ['pokemon', 'yokai', 'nexomon', 'fakemon', 'finalfantasy'].includes(monsterType);
        const hasLegendary = ['pokemon', 'nexomon', 'fakemon'].includes(monsterType);
        const hasMythical = ['pokemon', 'fakemon'].includes(monsterType);
        const hasRank = ['digimon', 'yokai'].includes(monsterType);

        const result = await db.query<SpeciesLookupRow>(
          `SELECT
            name,
            '${monsterType}' as monster_type,
            ${hasStage ? 'stage' : 'NULL'} as stage,
            ${hasLegendary ? 'is_legendary' : 'false'} as is_legendary,
            ${hasMythical ? 'is_mythical' : 'false'} as is_mythical,
            ${hasRank ? 'rank' : 'NULL'} as rank
          FROM ${tableName}
          WHERE name = $1
          LIMIT 1`,
          [speciesName],
        );

        if (result.rows.length > 0) {
          species = result.rows[0] ?? null;
          break;
        }
      }

      if (!species) {
        return { valid: false, error: `Species "${speciesName}" does not exist in the database.` };
      }

      if (species.is_legendary) {
        return {
          valid: false,
          error: `"${speciesName}" is a legendary species. Pastries can only be used with non-legendary, base stage species.`,
        };
      }

      if (species.is_mythical) {
        return {
          valid: false,
          error: `"${speciesName}" is a mythical species. Pastries can only be used with non-mythical, base stage species.`,
        };
      }

      // Stage checks for pokemon/yokai/nexomon/finalfantasy
      const stageCheckedTypes = ['pokemon', 'yokai', 'nexomon', 'finalfantasy', 'fakemon'];
      if (stageCheckedTypes.includes(species.monster_type)) {
        if (species.stage && !['Base Stage', "Doesn't Evolve"].includes(species.stage)) {
          return {
            valid: false,
            error: `"${speciesName}" is an evolved form (${species.stage}). Pastries can only be used with base stage or non-evolving species.`,
          };
        }
      }

      // Rank checks for Digimon
      if (species.monster_type === 'digimon') {
        if (species.rank && !['Baby I', 'Baby II'].includes(species.rank)) {
          return {
            valid: false,
            error: `"${speciesName}" is a ${species.rank} rank Digimon. Pastries can only be used with Baby I or Baby II rank Digimon.`,
          };
        }
      }

      // Rank checks for Yokai
      if (species.monster_type === 'yokai') {
        if (species.rank && !['E', 'D', 'C'].includes(species.rank)) {
          return {
            valid: false,
            error: `"${speciesName}" is a ${species.rank} rank Yokai. Pastries can only be used with E, D, or C rank Yokai.`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: msg };
    }
  }

  // ==========================================================================
  // Private: Utility Helpers
  // ==========================================================================

  private parseMonsterRollerSettings(
    raw: MonsterRollerSettings | string | null | undefined,
  ): MonsterRollerSettings | null {
    if (!raw) {
      return null;
    }
    if (typeof raw === 'object') {
      return raw;
    }
    try {
      return JSON.parse(raw) as MonsterRollerSettings;
    } catch {
      return null;
    }
  }

  private getUserSettings(settings: MonsterRollerSettings | null): UserSettings {
    const defaults: UserSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
    };

    if (!settings) {
      return defaults;
    }

    return {
      pokemon: settings.pokemon ?? true,
      digimon: settings.digimon ?? true,
      yokai: settings.yokai ?? true,
      nexomon: settings.nexomon ?? true,
      pals: settings.pals ?? true,
      fakemon: settings.fakemon ?? true,
      finalfantasy: settings.finalfantasy ?? true,
      monsterhunter: settings.monsterhunter ?? true,
    };
  }

  private mapCategoryToInventory(category: string): InventoryCategory {
    const mapped = CATEGORY_TO_INVENTORY[category.toLowerCase()];
    if (mapped && INVENTORY_CATEGORIES.includes(mapped)) {
      return mapped;
    }
    return 'items';
  }
}
