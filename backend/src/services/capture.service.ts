import { db } from '../database';
import {
  TrainerRepository,
  TrainerWithStats,
  TrainerInventoryRepository,
  UserRepository,
  MonsterRepository,
  MonsterCreateInput,
} from '../repositories';
import { MonsterInitializerService } from './monster-initializer.service';

export type CaptureData = {
  encounterId: number;
  discordUserId: string;
  trainerName: string;
  pokeballType: string;
  pokepuffCount?: number;
  monsterIndex?: number;
  isBattleCapture?: boolean;
};

export type MonsterToCapture = {
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level: number;
  groupIndex: number;
  displayIndex: number;
};

export type CapturedMonster = {
  id: number;
  species_name: string;
  nickname?: string;
  level: number;
  trainer_id: number;
  [key: string]: unknown;
};

export type CaptureResult = {
  success: boolean;
  monster: CapturedMonster | null;
  trainer: TrainerWithStats;
  pokeball_used: string;
  pokepuffs_used: number;
  capture_chance: number;
};

export type LinkedUser = {
  user_id: number;
  username: string;
  display_name: string | null;
  discord_user_id: string;
};

export type EncounterData = {
  groups: EncounterGroup[];
};

export type EncounterGroup = {
  species1?: string;
  species2?: string | null;
  species3?: string | null;
  type1?: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  count: number;
  available: number;
  captured?: Array<{ discord_user_id: string; captured_at: string }>;
};

export type Encounter = {
  id: number;
  encounter_type: string;
  encounter_data: EncounterData;
};

// Base capture rates for different pokeball types
const POKEBALL_RATES: Record<string, number> = {
  'Poke Ball': 0.5,
  'Great Ball': 0.65,
  'Ultra Ball': 0.8,
  'Master Ball': 1.0,
  'Premier Ball': 0.5,
  'Luxury Ball': 0.5,
  'Timer Ball': 0.6,
  'Repeat Ball': 0.7,
  'Net Ball': 0.6,
  'Dive Ball': 0.6,
};

// Build a case-insensitive lookup from normalized key → canonical name
const POKEBALL_CANONICAL: Map<string, string> = new Map();
for (const name of Object.keys(POKEBALL_RATES)) {
  POKEBALL_CANONICAL.set(name.toLowerCase(), name);
  // Also handle no-space variants: "pokeball" → "Poke Ball", "ultraball" → "Ultra Ball"
  POKEBALL_CANONICAL.set(name.toLowerCase().replace(/\s+/g, ''), name);
}
// Handle diacritic variants: "poké ball", "pokéball"
POKEBALL_CANONICAL.set('poké ball', 'Poke Ball');
POKEBALL_CANONICAL.set('pokéball', 'Poke Ball');

/**
 * Normalize a user-supplied pokeball name to its canonical form.
 * Handles case differences, missing spaces, and diacritics (é→e).
 * Returns the canonical name or the original input if no match found.
 */
function normalizePokeballName(input: string): string {
  // Strip diacritics (é → e, etc.) and lowercase
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return POKEBALL_CANONICAL.get(normalized)
    ?? POKEBALL_CANONICAL.get(normalized.replace(/\s+/g, ''))
    ?? input;
}

/**
 * Service for handling monster capture mechanics
 */
export class CaptureService {
  private trainerRepository: TrainerRepository;
  private inventoryRepository: TrainerInventoryRepository;
  private userRepository: UserRepository;
  private monsterRepository: MonsterRepository;
  private monsterInitializer: MonsterInitializerService;

  constructor(
    trainerRepository?: TrainerRepository,
    inventoryRepository?: TrainerInventoryRepository,
    userRepository?: UserRepository,
    monsterRepository?: MonsterRepository
  ) {
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
    this.monsterInitializer = new MonsterInitializerService();
  }

  /**
   * Attempt to capture a monster from a wild encounter
   * @param captureData - Capture attempt data
   * @returns Capture result
   */
  async attemptCapture(captureData: CaptureData): Promise<CaptureResult> {
    const {
      encounterId,
      discordUserId,
      trainerName,
      pokeballType: rawPokeballType,
      pokepuffCount = 0,
      monsterIndex = 1,
      isBattleCapture = false,
    } = captureData;

    // Normalize pokeball name to canonical form (case/diacritic insensitive)
    const pokeballType = normalizePokeballName(rawPokeballType);

    // Get encounter data
    const encounter = await this.getEncounterById(encounterId);
    if (
      !encounter ||
      (encounter.encounter_type !== 'wild' &&
        !(encounter.encounter_type === 'battle' && isBattleCapture))
    ) {
      throw new Error('Invalid encounter for capture');
    }

    // Find trainer by name (case-insensitive)
    const trainer = await this.findTrainerByName(trainerName, discordUserId);
    if (!trainer) {
      throw new Error(`The trainer name "${trainerName}" does not match any of your trainers.`);
    }

    // Validate pokeball inventory
    const hasValidPokeball = await this.validatePokeballInventory(trainer.id, pokeballType);
    if (!hasValidPokeball) {
      throw new Error(`${trainer.name} does not have any ${pokeballType}s in their inventory.`);
    }

    // Validate pokepuff inventory if used
    if (pokepuffCount > 0) {
      const hasValidPokepuffs = await this.validatePokepuffInventory(trainer.id, pokepuffCount);
      if (!hasValidPokepuffs) {
        throw new Error(`${trainer.name} does not have ${pokepuffCount} Pokepuff(s) in their inventory.`);
      }
    }

    // Select monster to capture from encounter
    const monsterToCapture = this.selectMonsterFromEncounter(
      encounter,
      discordUserId,
      monsterIndex
    );
    if (!monsterToCapture) {
      throw new Error('There are no monsters available for capture in this encounter.');
    }

    // Calculate capture chance
    const captureChance = this.calculateCaptureChance(
      pokeballType,
      pokepuffCount,
      monsterToCapture,
      isBattleCapture
    );

    // Attempt capture
    const captureSuccess = Math.random() < captureChance;

    // Consume items regardless of success
    await this.consumeItems(trainer.id, pokeballType, pokepuffCount);

    let capturedMonster: CapturedMonster | null = null;
    if (captureSuccess) {
      // Initialize and create monster
      capturedMonster = await this.initializeAndCreateMonster(monsterToCapture, trainer.id);

      // Update encounter to mark this monster as captured
      await this.markMonsterCaptured(encounter, monsterToCapture, discordUserId);
    }

    return {
      success: captureSuccess,
      monster: capturedMonster,
      trainer,
      pokeball_used: pokeballType,
      pokepuffs_used: pokepuffCount,
      capture_chance: Math.round(captureChance * 100),
    };
  }

  /**
   * Get encounter by ID
   * @param encounterId - Encounter ID
   * @returns Encounter data or null
   */
  async getEncounterById(encounterId: number): Promise<Encounter | null> {
    const result = await db.query<{
      id: number;
      encounter_type: string;
      encounter_data: string | EncounterData;
    }>('SELECT id, encounter_type, encounter_data FROM adventure_encounters WHERE id = $1', [
      encounterId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const encounterData =
      typeof row.encounter_data === 'string'
        ? JSON.parse(row.encounter_data)
        : row.encounter_data;

    return {
      id: row.id,
      encounter_type: row.encounter_type,
      encounter_data: encounterData,
    };
  }

  /**
   * Find trainer by name for a Discord user
   * @param trainerName - Trainer name
   * @param discordUserId - Discord user ID
   * @returns Trainer or null
   */
  async findTrainerByName(
    trainerName: string,
    discordUserId: string
  ): Promise<TrainerWithStats | null> {
    // First, verify the user exists
    const userLink = await this.getLinkedUser(discordUserId);
    if (!userLink) {
      throw new Error('Discord account not linked to website account');
    }

    // Get trainers for this user (using discord_user_id, not user_id)
    const trainers = await this.trainerRepository.findByUserId(userLink.discord_user_id);

    // Find trainer by name (case-insensitive)
    const trainer = trainers.find(
      (t) => t.name.toLowerCase() === trainerName.toLowerCase()
    );

    return trainer ?? null;
  }

  /**
   * Get linked user from Discord user ID
   * @param discordUserId - Discord user ID
   * @returns User data or null
   */
  async getLinkedUser(discordUserId: string): Promise<LinkedUser | null> {
    const user = await this.userRepository.findByDiscordId(discordUserId);

    if (user) {
      return {
        user_id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_user_id: user.discord_id ?? '',
      };
    }

    return null;
  }

  /**
   * Validate pokeball inventory
   * @param trainerId - Trainer ID
   * @param pokeballType - Pokeball type
   * @returns Has valid pokeball
   */
  async validatePokeballInventory(trainerId: number, pokeballType: string): Promise<boolean> {
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory?.balls) {
      return false;
    }

    return (inventory.balls[pokeballType] ?? 0) > 0;
  }

  /**
   * Validate pokepuff inventory
   * @param trainerId - Trainer ID
   * @param pokepuffCount - Number of pokepuffs needed
   * @returns Has valid pokepuffs
   */
  async validatePokepuffInventory(trainerId: number, pokepuffCount: number): Promise<boolean> {
    const inventory = await this.inventoryRepository.findByTrainerId(trainerId);
    if (!inventory?.items) {
      return false;
    }

    return (inventory.items['Pokepuff'] ?? 0) >= pokepuffCount;
  }

  /**
   * Select monster to capture from encounter
   * @param encounter - Encounter data
   * @param discordUserId - Discord user ID
   * @param monsterIndex - 1-based index of monster to capture
   * @returns Monster to capture or null
   */
  selectMonsterFromEncounter(
    encounter: Encounter,
    discordUserId: string,
    monsterIndex = 1
  ): MonsterToCapture | null {
    const encounterData = encounter.encounter_data;

    // Build a flat list of all available monsters with their display order
    const availableMonsters: MonsterToCapture[] = [];

    for (let groupIdx = 0; groupIdx < encounterData.groups.length; groupIdx++) {
      const group = encounterData.groups[groupIdx];
      if (!group) { continue; }
      if (group.available > 0) {
        // Check how many this user has already captured from this group
        const userCaptures =
          group.captured?.filter((c) => c.discord_user_id === discordUserId) ?? [];
        const remainingForUser = group.count - userCaptures.length;

        // Add each remaining monster to the available list
        for (let i = 0; i < remainingForUser; i++) {
          availableMonsters.push({
            species1: group.species1 ?? 'Unknown',
            species2: group.species2,
            species3: group.species3,
            type1: group.type1 ?? 'Normal',
            type2: group.type2,
            type3: group.type3,
            type4: group.type4,
            type5: group.type5,
            attribute: group.attribute,
            level: Math.floor(Math.random() * 10) + 5, // Random level 5-15
            groupIndex: groupIdx,
            displayIndex: availableMonsters.length + 1, // 1-based display index
          });
        }
      }
    }

    // If no monsters available
    if (availableMonsters.length === 0) {
      return null;
    }

    // If requested index is out of range, default to first available
    const targetIndex = Math.max(1, Math.min(monsterIndex, availableMonsters.length));

    // Return the monster at the requested index (convert to 0-based)
    return availableMonsters[targetIndex - 1] ?? null;
  }

  /**
   * Calculate capture chance
   * @param pokeballType - Pokeball type
   * @param pokepuffCount - Number of pokepuffs used
   * @param monster - Monster data
   * @param isBattleCapture - Whether this is a capture during battle
   * @returns Capture chance (0-1)
   */
  calculateCaptureChance(
    pokeballType: string,
    pokepuffCount: number,
    monster: MonsterToCapture,
    isBattleCapture = false
  ): number {
    const baseRate = POKEBALL_RATES[pokeballType] ?? 0.5;

    // Pokepuff bonus (25% per pokepuff)
    const pokepuffBonus = pokepuffCount * 0.25;

    // Level penalty (higher level = harder to catch)
    const levelPenalty = Math.max(0, (monster.level - 10) * 0.02);

    // Battle capture bonus (monsters with reduced health are easier to catch)
    let battleBonus = 0;
    if (isBattleCapture) {
      // Simulate health-based capture rate like Pokemon
      // Assume monsters in battle have reduced health (30-70% remaining)
      const healthPercentage = Math.random() * 0.4 + 0.3; // 30-70% health
      battleBonus = (1 - healthPercentage) * 0.5; // Up to 35% bonus at low health

      console.log(
        `Battle capture: health ${(healthPercentage * 100).toFixed(1)}%, bonus ${(battleBonus * 100).toFixed(1)}%`
      );
    }

    // Calculate final chance
    const finalChance = Math.min(
      0.95,
      Math.max(0.05, baseRate + pokepuffBonus - levelPenalty + battleBonus)
    );

    return finalChance;
  }

  /**
   * Consume items from trainer inventory
   * @param trainerId - Trainer ID
   * @param pokeballType - Pokeball type
   * @param pokepuffCount - Number of pokepuffs
   */
  async consumeItems(
    trainerId: number,
    pokeballType: string,
    pokepuffCount: number
  ): Promise<void> {
    // Consume pokeball (subtract 1)
    await this.inventoryRepository.removeItem(trainerId, 'balls', pokeballType, 1);

    // Consume pokepuffs if any were used
    if (pokepuffCount > 0) {
      await this.inventoryRepository.removeItem(trainerId, 'items', 'Pokepuff', pokepuffCount);
    }
  }

  /**
   * Initialize and create captured monster
   * @param monsterData - Monster data
   * @param trainerId - Trainer ID
   * @returns Created monster
   */
  async initializeAndCreateMonster(
    monsterData: MonsterToCapture,
    trainerId: number
  ): Promise<CapturedMonster> {
    // Prepare monster data for creation — include all species, types, and attribute
    const monsterInput: MonsterCreateInput = {
      trainerId,
      name: monsterData.species1 || 'Unknown',
      species1: monsterData.species1 || 'Unknown',
      species2: monsterData.species2 ?? null,
      species3: monsterData.species3 ?? null,
      type1: monsterData.type1 || 'Normal',
      type2: monsterData.type2 ?? null,
      type3: monsterData.type3 ?? null,
      type4: monsterData.type4 ?? null,
      type5: monsterData.type5 ?? null,
      attribute: monsterData.attribute ?? null,
      level: monsterData.level,
      hpTotal: 100, // Default starting HP
      whereMet: 'Adventure Capture',
    };

    // Create the monster in the database
    const createdMonster = await this.monsterRepository.create(monsterInput);

    // Initialize monster with stats, moves, abilities, etc.
    try {
      await this.monsterInitializer.initializeMonster(createdMonster.id);
    } catch (err) {
      console.error(`Failed to initialize captured monster ${createdMonster.id}:`, err);
    }

    return {
      id: createdMonster.id,
      species_name: createdMonster.species1,
      species1: createdMonster.species1,
      species2: createdMonster.species2 ?? undefined,
      species3: createdMonster.species3 ?? undefined,
      type1: createdMonster.type1,
      type2: createdMonster.type2 ?? undefined,
      type3: createdMonster.type3 ?? undefined,
      type4: createdMonster.type4 ?? undefined,
      type5: createdMonster.type5 ?? undefined,
      attribute: createdMonster.attribute ?? undefined,
      nickname: createdMonster.name ?? undefined,
      level: createdMonster.level,
      trainer_id: createdMonster.trainer_id,
    };
  }

  /**
   * Mark monster as captured in encounter
   * @param encounter - Encounter data
   * @param monster - Monster data
   * @param discordUserId - Discord user ID
   */
  async markMonsterCaptured(
    encounter: Encounter,
    monster: MonsterToCapture,
    discordUserId: string
  ): Promise<void> {
    const encounterData = encounter.encounter_data;
    const groupIndex = monster.groupIndex;

    if (encounterData.groups[groupIndex]) {
      // Add capture record
      encounterData.groups[groupIndex].captured ??= [];

      encounterData.groups[groupIndex].captured.push({
        discord_user_id: discordUserId,
        captured_at: new Date().toISOString(),
      });

      // Decrease available count
      encounterData.groups[groupIndex].available = Math.max(
        0,
        encounterData.groups[groupIndex].available - 1
      );

      // Update encounter
      await db.query('UPDATE adventure_encounters SET encounter_data = $1 WHERE id = $2', [
        JSON.stringify(encounterData),
        encounter.id,
      ]);
    }
  }

  /**
   * Get capture rate for a specific pokeball type
   * @param pokeballType - Pokeball type
   * @returns Base capture rate
   */
  getPokeballRate(pokeballType: string): number {
    return POKEBALL_RATES[pokeballType] ?? 0.5;
  }

  /**
   * Get all pokeball rates
   * @returns All pokeball rates
   */
  getAllPokeballRates(): Record<string, number> {
    return { ...POKEBALL_RATES };
  }
}
