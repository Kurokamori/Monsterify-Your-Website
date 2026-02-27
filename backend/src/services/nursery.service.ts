import crypto from 'crypto';
import {
  TrainerRepository,
  TrainerInventoryRepository,
  MonsterRepository,
  INVENTORY_CATEGORIES,
} from '../repositories';
import type {
  MonsterRollerSettings,
  MonsterCreateInput,
} from '../repositories';
import { EggHatcherService } from './egg-hatcher.service';
import type { HatchedEgg, SpeciesInputs } from './egg-hatcher.service';
import { MonsterInitializerService } from './monster-initializer.service';
import type { MonsterData, InitializedMonster } from './monster-initializer.service';
import { SpecialBerryService } from './special-berry.service';
import type { SpecialBerryInventory } from './special-berry.service';
import type { UserSettings } from './monster-roller.service';
import cloudinary from '../utils/cloudinary';

// ============================================================================
// Types
// ============================================================================

export type HatchSession = {
  sessionId: string;
  userId: string;
  trainerId: number;
  type: 'hatch' | 'nurture';
  eggCount: number;
  useIncubator: boolean;
  useVoidStone: boolean;
  imageUrl: string | null;
  selectedItems: Record<string, number>;
  hatchedEggs: HatchedEgg[];
  selectedMonsters: Record<string, SelectedMonsterInfo>;
  claimedMonsters: string[];
  normalClaims: Record<string, boolean>;
  edenwiessUses: Record<string, number>;
  userSettings: UserSettings;
  speciesInputs: SpeciesInputs;
  specialBerries: SpecialBerryInventory;
  createdAt: string;
};

type SelectedMonsterInfo = {
  monsterIndex: number;
  monsterId: number;
  monsterName: string;
  selectedAt: string;
};

export type HatchSessionResult = {
  sessionId: string;
  hatchedEggs: HatchedEgg[];
  specialBerries: SpecialBerryInventory;
};

export type SelectMonsterInput = {
  sessionId: string;
  eggId: number;
  monsterIndex: number;
  monsterName?: string;
  dnaSplicers?: number;
  useEdenwiess?: boolean;
};

export type SelectMonsterResult = {
  message: string;
  monster: Record<string, unknown>;
  session: {
    sessionId: string;
    selectedMonsters: Record<string, SelectedMonsterInfo>;
    claimedMonsters: string[];
    totalEggs: number;
    selectedCount: number;
  };
  specialBerries: SpecialBerryInventory;
};

export type RerollResult = {
  sessionId: string;
  hatchedEggs: HatchedEgg[];
  specialBerries: SpecialBerryInventory;
};

// ============================================================================
// Egg Item Categories
// ============================================================================

const EGG_ITEM_CATEGORIES = {
  poolFilters: [
    'S Rank Incense', 'A Rank Incense', 'B Rank Incense', 'C Rank Incense', 'D Rank Incense', 'E Rank Incense',
    'Restoration Color Incense', 'Virus Color Incense', 'Data Color Incense', 'Vaccine Color Incense',
    'Normal Poffin', 'Fire Poffin', 'Water Poffin', 'Electric Poffin', 'Grass Poffin', 'Ice Poffin',
    'Fighting Poffin', 'Poison Poffin', 'Ground Poffin', 'Flying Poffin', 'Psychic Poffin', 'Bug Poffin',
    'Rock Poffin', 'Ghost Poffin', 'Dragon Poffin', 'Dark Poffin', 'Steel Poffin', 'Fairy Poffin',
    'Spell Tag', 'DigiMeat', 'DigiTofu', 'Broken Bell', 'Complex Core', 'Shattered Core',
    "Worker's Permit", 'Workers Strike Notice',
  ],
  outcomeModifiers: [
    'Normal Nurture Kit', 'Fire Nurture Kit', 'Water Nurture Kit', 'Electric Nurture Kit', 'Grass Nurture Kit', 'Ice Nurture Kit',
    'Fighting Nurture Kit', 'Poison Nurture Kit', 'Ground Nurture Kit', 'Flying Nurture Kit', 'Psychic Nurture Kit', 'Bug Nurture Kit',
    'Rock Nurture Kit', 'Ghost Nurture Kit', 'Dragon Nurture Kit', 'Dark Nurture Kit', 'Steel Nurture Kit', 'Fairy Nurture Kit',
    'Corruption Code', 'Repair Code', 'Shiny New Code',
    'Hot Chocolate', 'Vanilla Milk', 'Chocolate Milk', 'Strawberry Milk', 'MooMoo Milk',
  ],
  iceCreams: [
    'Vanilla Ice Cream', 'Strawberry Ice Cream', 'Chocolate Ice Cream', 'Mint Ice Cream', 'Pecan Ice Cream',
  ],
  speciesControls: [
    'Input Field', 'Drop Down', 'Radio Buttons',
  ],
  incubators: [
    'Incubator',
  ],
} as const;

const ALL_EGG_ITEMS: Set<string> = new Set(
  Object.values(EGG_ITEM_CATEGORIES).flat()
);

// ============================================================================
// Helpers
// ============================================================================

function parseUserSettings(settings: MonsterRollerSettings | null): UserSettings {
  if (!settings) {
    return {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
      dragonquest: true,
    };
  }

  return {
    pokemon: settings.pokemon !== false,
    digimon: settings.digimon !== false,
    yokai: settings.yokai !== false,
    nexomon: settings.nexomon !== false,
    pals: settings.pals !== false,
    fakemon: settings.fakemon !== false,
    finalfantasy: settings.finalfantasy !== false,
    monsterhunter: settings.monsterhunter !== false,
    dragonquest: settings.dragonquest !== false,
  };
}

// ============================================================================
// Service
// ============================================================================

export class NurseryService {
  private sessions = new Map<string, HatchSession>();
  private trainerRepo: TrainerRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private monsterRepo: MonsterRepository;
  private specialBerryService: SpecialBerryService;

  constructor() {
    this.trainerRepo = new TrainerRepository();
    this.inventoryRepo = new TrainerInventoryRepository();
    this.monsterRepo = new MonsterRepository();
    this.specialBerryService = new SpecialBerryService(this.inventoryRepo);
  }

  // ==========================================================================
  // Trainer Verification
  // ==========================================================================

  private async verifyTrainerOwnership(trainerId: number, userId: string) {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return null;
    }
    return trainer;
  }

  // ==========================================================================
  // Get Trainer Eggs
  // ==========================================================================

  async getTrainerEggs(trainerId: number, userId: string) {
    const trainer = await this.verifyTrainerOwnership(trainerId, userId);
    if (!trainer) {
      return { success: false as const, status: 403, message: 'You can only access your own trainers' };
    }

    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      return { success: false as const, status: 404, message: 'Trainer inventory not found' };
    }

    return {
      success: true as const,
      eggs: inventory.eggs,
      trainer: { id: trainer.id, name: trainer.name },
    };
  }

  // ==========================================================================
  // Get Egg Items
  // ==========================================================================

  async getEggItems(trainerId: number, userId: string) {
    const trainer = await this.verifyTrainerOwnership(trainerId, userId);
    if (!trainer) {
      return { success: false as const, status: 403, message: 'You can only access your own trainers' };
    }

    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      return { success: false as const, status: 404, message: 'Trainer inventory not found' };
    }

    const availableItems: Record<string, number> = {};

    for (const category of INVENTORY_CATEGORIES) {
      const categoryItems = inventory[category];
      for (const [itemName, quantity] of Object.entries(categoryItems)) {
        if (ALL_EGG_ITEMS.has(itemName) && quantity > 0) {
          availableItems[itemName] = quantity;
        }
      }
    }

    return {
      success: true as const,
      items: availableItems,
      categories: EGG_ITEM_CATEGORIES,
      trainer: { id: trainer.id, name: trainer.name },
    };
  }

  // ==========================================================================
  // Start Hatch (Simple)
  // ==========================================================================

  async startHatch(params: {
    trainerId: number;
    userId: string;
    eggCount: number;
    useIncubator: boolean;
    useVoidStone: boolean;
    imageUrl?: string | null;
    file?: Express.Multer.File;
    rollerSettings: MonsterRollerSettings | null;
  }): Promise<{ success: true } & HatchSessionResult | { success: false; status: number; message: string }> {
    const { trainerId, userId, eggCount, useIncubator, useVoidStone, rollerSettings } = params;
    let { imageUrl } = params;

    const trainer = await this.verifyTrainerOwnership(trainerId, userId);
    if (!trainer) {
      return { success: false, status: 403, message: 'You can only hatch eggs for your own trainers' };
    }

    if (!eggCount || eggCount < 1 || eggCount > 10) {
      return { success: false, status: 400, message: 'Invalid egg count. Must be between 1 and 10.' };
    }

    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      return { success: false, status: 404, message: 'Trainer inventory not found' };
    }

    const standardEggs = inventory.eggs['Standard Egg'] ?? 0;
    if (standardEggs < eggCount) {
      return { success: false, status: 400, message: `Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.` };
    }

    // Handle image upload
    if (params.file && !useIncubator && !useVoidStone) {
      try {
        const result = await cloudinary.uploader.upload(params.file.path, { folder: 'nursery/hatch' });
        imageUrl = result.secure_url;
      } catch {
        return { success: false, status: 500, message: 'Failed to upload image' };
      }
    }

    if (!useIncubator && !useVoidStone && !imageUrl) {
      return { success: false, status: 400, message: 'Either an incubator, void stone, or artwork is required for hatching.' };
    }

    if (useIncubator) {
      const incubators = inventory.eggs['Incubator'] ?? 0;
      if (incubators < eggCount) {
        return { success: false, status: 400, message: `Not enough Incubators. You have ${incubators}, need ${eggCount}.` };
      }
    }

    if (useVoidStone) {
      const voidStones = inventory.evolution['Void Evolution Stone'] ?? 0;
      if (voidStones < eggCount) {
        return { success: false, status: 400, message: `Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.` };
      }
    }

    const userSettings = parseUserSettings(rollerSettings);

    const hatcher = new EggHatcherService({
      seed: Date.now().toString(),
      userSettings,
    });

    const hatchedEggs = await hatcher.hatchEggs({
      trainerId,
      eggCount,
      useIncubator: useIncubator || useVoidStone,
      imageUrl: imageUrl ?? undefined,
      selectedItems: {},
    });

    const specialBerries = await this.specialBerryService.getAvailableSpecialBerries(trainerId);

    const sessionId = crypto.randomUUID();
    const session: HatchSession = {
      sessionId,
      userId,
      trainerId,
      type: 'hatch',
      eggCount,
      useIncubator,
      useVoidStone,
      imageUrl: imageUrl ?? null,
      selectedItems: {},
      hatchedEggs,
      selectedMonsters: {},
      claimedMonsters: [],
      normalClaims: {},
      edenwiessUses: {},
      userSettings,
      speciesInputs: {},
      specialBerries,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);

    // Consume eggs
    await this.inventoryRepo.removeItem(trainerId, 'eggs', 'Standard Egg', eggCount);
    if (useIncubator) {
      await this.inventoryRepo.removeItem(trainerId, 'eggs', 'Incubator', eggCount);
    }
    if (useVoidStone) {
      await this.inventoryRepo.removeItem(trainerId, 'evolution', 'Void Evolution Stone', eggCount);
    }

    return { success: true, sessionId, hatchedEggs, specialBerries };
  }

  // ==========================================================================
  // Start Nurture (Complex)
  // ==========================================================================

  async startNurture(params: {
    trainerId: number;
    userId: string;
    eggCount: number;
    useIncubator: boolean;
    useVoidStone: boolean;
    imageUrl?: string | null;
    file?: Express.Multer.File;
    selectedItems: Record<string, number>;
    speciesInputs: SpeciesInputs;
    rollerSettings: MonsterRollerSettings | null;
  }): Promise<{ success: true } & HatchSessionResult | { success: false; status: number; message: string }> {
    const { trainerId, userId, eggCount, useIncubator, useVoidStone, selectedItems, speciesInputs, rollerSettings } = params;
    let { imageUrl } = params;

    // Validate species inputs for species control items
    if ((selectedItems['Input Field'] ?? 0) > 0 && !speciesInputs?.species1) {
      return { success: false, status: 400, message: 'Input Field item requires species1 to be specified' };
    }
    if ((selectedItems['Drop Down'] ?? 0) > 0 && (!speciesInputs?.species1 || !speciesInputs?.species2)) {
      return { success: false, status: 400, message: 'Drop Down item requires species1 and species2 to be specified' };
    }
    if ((selectedItems['Radio Buttons'] ?? 0) > 0 && (!speciesInputs?.species1 || !speciesInputs?.species2 || !speciesInputs?.species3)) {
      return { success: false, status: 400, message: 'Radio Buttons item requires species1, species2, and species3 to be specified' };
    }

    const trainer = await this.verifyTrainerOwnership(trainerId, userId);
    if (!trainer) {
      return { success: false, status: 403, message: 'You can only nurture eggs for your own trainers' };
    }

    if (!eggCount || eggCount < 1 || eggCount > 10) {
      return { success: false, status: 400, message: 'Invalid egg count. Must be between 1 and 10.' };
    }

    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      return { success: false, status: 404, message: 'Trainer inventory not found' };
    }

    const standardEggs = inventory.eggs['Standard Egg'] ?? 0;
    if (standardEggs < eggCount) {
      return { success: false, status: 400, message: `Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.` };
    }

    // Handle image upload
    if (params.file && !useIncubator && !useVoidStone) {
      try {
        const result = await cloudinary.uploader.upload(params.file.path, { folder: 'nursery/nurture' });
        imageUrl = result.secure_url;
      } catch {
        return { success: false, status: 500, message: 'Failed to upload image' };
      }
    }

    if (!useIncubator && !useVoidStone && !imageUrl) {
      return { success: false, status: 400, message: 'Either an incubator, void stone, or artwork is required for nurturing.' };
    }

    if (useIncubator) {
      const incubators = inventory.eggs['Incubator'] ?? 0;
      if (incubators < eggCount) {
        return { success: false, status: 400, message: `Not enough Incubators. You have ${incubators}, need ${eggCount}.` };
      }
    }

    if (useVoidStone) {
      const voidStones = inventory.evolution['Void Evolution Stone'] ?? 0;
      if (voidStones < eggCount) {
        return { success: false, status: 400, message: `Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.` };
      }
    }

    const userSettings = parseUserSettings(rollerSettings);

    const hatcher = new EggHatcherService({
      seed: Date.now().toString(),
      userSettings,
    });

    const hatchedEggs = await hatcher.hatchEggs({
      trainerId,
      eggCount,
      useIncubator: useIncubator || useVoidStone,
      imageUrl: imageUrl ?? undefined,
      selectedItems,
      speciesInputs,
    });

    const specialBerries = await this.specialBerryService.getAvailableSpecialBerries(trainerId);

    const sessionId = crypto.randomUUID();
    const session: HatchSession = {
      sessionId,
      userId,
      trainerId,
      type: 'nurture',
      eggCount,
      useIncubator,
      useVoidStone,
      imageUrl: imageUrl ?? null,
      selectedItems,
      hatchedEggs,
      selectedMonsters: {},
      claimedMonsters: [],
      normalClaims: {},
      edenwiessUses: {},
      userSettings,
      speciesInputs,
      specialBerries,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);

    // Consume eggs
    await this.inventoryRepo.removeItem(trainerId, 'eggs', 'Standard Egg', eggCount);
    if (useIncubator) {
      await this.inventoryRepo.removeItem(trainerId, 'eggs', 'Incubator', eggCount);
    }
    if (useVoidStone) {
      await this.inventoryRepo.removeItem(trainerId, 'evolution', 'Void Evolution Stone', eggCount);
    }

    // Consume selected items
    for (const [itemName, quantity] of Object.entries(selectedItems)) {
      if (quantity > 0) {
        const currentInventory = await this.inventoryRepo.findByTrainerId(trainerId);
        if (!currentInventory) { continue; }

        for (const category of INVENTORY_CATEGORIES) {
          const categoryItems = currentInventory[category];
          if (categoryItems[itemName] !== undefined) {
            await this.inventoryRepo.removeItem(trainerId, category, itemName, quantity);
            break;
          }
        }
      }
    }

    return { success: true, sessionId, hatchedEggs, specialBerries };
  }

  // ==========================================================================
  // Get Session
  // ==========================================================================

  getSession(sessionId: string, userId: string): { success: true; session: HatchSession } | { success: false; status: number; message: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, status: 404, message: 'Hatch session not found' };
    }
    if (session.userId !== userId) {
      return { success: false, status: 403, message: 'You can only access your own hatch sessions' };
    }
    return { success: true, session };
  }

  // ==========================================================================
  // Select Monster
  // ==========================================================================

  async selectMonster(input: SelectMonsterInput, userId: string): Promise<{ success: true } & SelectMonsterResult | { success: false; status: number; message: string }> {
    const { sessionId, eggId, monsterIndex, monsterName, dnaSplicers, useEdenwiess } = input;

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, status: 404, message: 'Hatch session not found' };
    }
    if (session.userId !== userId) {
      return { success: false, status: 403, message: 'You can only access your own hatch sessions' };
    }

    // Check if this specific monster has already been claimed
    const eggKey = `${eggId}-${monsterIndex}`;
    if (session.claimedMonsters.includes(eggKey)) {
      return { success: false, status: 400, message: 'This monster has already been claimed' };
    }

    // Edenwiess or normal claim logic
    if (useEdenwiess) {
      const hasEdenwiess = await this.specialBerryService.hasSpecialBerry(session.trainerId, 'Edenwiess');
      if (!hasEdenwiess) {
        return { success: false, status: 400, message: 'You do not have an Edenwiess berry' };
      }

      const consumed = await this.specialBerryService.consumeSpecialBerry(session.trainerId, 'Edenwiess');
      if (!consumed) {
        return { success: false, status: 500, message: 'Failed to consume Edenwiess berry' };
      }

      session.edenwiessUses[eggId] = (session.edenwiessUses[eggId] ?? 0) + 1;
    } else {
      if (session.normalClaims[eggId]) {
        return { success: false, status: 400, message: 'You can only claim one monster per egg without using an Edenwiess berry' };
      }
      session.normalClaims[eggId] = true;
    }

    // Find the selected monster from hatched eggs
    const egg = session.hatchedEggs.find(e => e.eggId === eggId);
    if (!egg) {
      return { success: false, status: 404, message: 'Egg not found in session' };
    }

    const selectedMonster = egg.monsters[monsterIndex];
    if (!selectedMonster) {
      return { success: false, status: 404, message: 'Monster not found in egg' };
    }

    // Initialize monster
    const monsterData: MonsterData = {
      trainer_id: session.trainerId,
      name: monsterName ?? selectedMonster.name ?? 'Unnamed',
      species1: selectedMonster.species1 ?? undefined,
      species2: selectedMonster.species2 ?? null,
      species3: selectedMonster.species3 ?? null,
      type1: selectedMonster.type1 ?? undefined,
      type2: selectedMonster.type2 ?? null,
      type3: selectedMonster.type3 ?? null,
      type4: selectedMonster.type4 ?? null,
      type5: selectedMonster.type5 ?? null,
      attribute: selectedMonster.attribute ?? null,
      level: 1,
    };

    const initializer = new MonsterInitializerService();
    const initialized: InitializedMonster = await initializer.initializeMonster(monsterData);

    // Create monster in database
    const createInput: MonsterCreateInput = {
      trainerId: session.trainerId,
      playerUserId: session.userId,
      name: initialized.name ?? 'Unnamed',
      species1: initialized.species1 ?? monsterData.species1 ?? '',
      species2: initialized.species2,
      species3: initialized.species3,
      type1: initialized.type1 ?? '',
      type2: initialized.type2,
      type3: initialized.type3,
      type4: initialized.type4,
      type5: initialized.type5,
      attribute: initialized.attribute,
      level: initialized.level,
      hpTotal: initialized.hp_total,
      hpIv: initialized.hp_iv,
      hpEv: initialized.hp_ev,
      atkTotal: initialized.atk_total,
      atkIv: initialized.atk_iv,
      atkEv: initialized.atk_ev,
      defTotal: initialized.def_total,
      defIv: initialized.def_iv,
      defEv: initialized.def_ev,
      spaTotal: initialized.spa_total,
      spaIv: initialized.spa_iv,
      spaEv: initialized.spa_ev,
      spdTotal: initialized.spd_total,
      spdIv: initialized.spd_iv,
      spdEv: initialized.spd_ev,
      speTotal: initialized.spe_total,
      speIv: initialized.spe_iv,
      speEv: initialized.spe_ev,
      nature: initialized.nature,
      characteristic: initialized.characteristic,
      gender: initialized.gender,
      friendship: initialized.friendship,
      ability1: initialized.ability1,
      ability2: initialized.ability2,
      moveset: typeof initialized.moveset === 'string'
        ? JSON.parse(initialized.moveset)
        : Array.isArray(initialized.moveset)
          ? initialized.moveset
          : [],
      whereMet: initialized.where_met,
    };

    const createdMonster = await this.monsterRepo.create(createInput);

    // Mark this monster as claimed
    session.claimedMonsters.push(eggKey);

    session.selectedMonsters[eggId] = {
      monsterIndex,
      monsterId: createdMonster.id,
      monsterName: createInput.name,
      selectedAt: new Date().toISOString(),
    };

    // Consume DNA Splicers if provided
    if (dnaSplicers && dnaSplicers > 0) {
      await this.inventoryRepo.removeItem(session.trainerId, 'items', 'DNA Splicer', dnaSplicers);
    }

    // Update special berries
    const updatedSpecialBerries = await this.specialBerryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedSpecialBerries;

    return {
      success: true,
      message: useEdenwiess
        ? 'Extra monster claimed successfully with Edenwiess berry'
        : 'Monster claimed successfully',
      monster: {
        id: createdMonster.id,
        ...monsterData,
        ...initialized,
      },
      session: {
        sessionId: session.sessionId,
        selectedMonsters: session.selectedMonsters,
        claimedMonsters: session.claimedMonsters,
        totalEggs: session.eggCount,
        selectedCount: Object.keys(session.selectedMonsters).length,
      },
      specialBerries: updatedSpecialBerries,
    };
  }

  // ==========================================================================
  // Reroll Results
  // ==========================================================================

  async rerollResults(sessionId: string, userId: string): Promise<{ success: true } & RerollResult | { success: false; status: number; message: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, status: 404, message: 'Hatch session not found' };
    }
    if (session.userId !== userId) {
      return { success: false, status: 403, message: 'You can only access your own hatch sessions' };
    }

    const hasForgetMeNot = await this.specialBerryService.hasSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      return { success: false, status: 400, message: 'You do not have a Forget-Me-Not berry' };
    }

    const consumed = await this.specialBerryService.consumeSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!consumed) {
      return { success: false, status: 500, message: 'Failed to consume Forget-Me-Not berry' };
    }

    const hatcher = new EggHatcherService({
      seed: Date.now().toString(),
      userSettings: session.userSettings,
    });

    const newHatchedEggs = await hatcher.hatchEggs({
      trainerId: session.trainerId,
      eggCount: session.eggCount,
      useIncubator: session.useIncubator,
      imageUrl: session.imageUrl ?? undefined,
      selectedItems: session.selectedItems,
      speciesInputs: session.speciesInputs,
    });

    // Reset session state with new results
    session.hatchedEggs = newHatchedEggs;
    session.selectedMonsters = {};
    session.claimedMonsters = [];
    session.normalClaims = {};
    session.edenwiessUses = {};

    const updatedSpecialBerries = await this.specialBerryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedSpecialBerries;

    return {
      success: true,
      sessionId,
      hatchedEggs: newHatchedEggs,
      specialBerries: updatedSpecialBerries,
    };
  }
}
