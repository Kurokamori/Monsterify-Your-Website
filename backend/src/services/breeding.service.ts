import { randomUUID } from 'crypto';
import {
  MonsterRepository,
  MonsterLineageRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  UserRepository,
  PokemonSpeciesRepository,
  DigimonSpeciesRepository,
  YokaiSpeciesRepository,
  NexomonSpeciesRepository,
  PalsSpeciesRepository,
  FakemonSpeciesRepository,
  FinalFantasySpeciesRepository,
  MonsterHunterSpeciesRepository,
} from '../repositories';
import type {
  MonsterWithTrainer,
  MonsterCreateInput,
  MonsterRollerSettings,
} from '../repositories';
import { MonsterInitializerService } from './monster-initializer.service';
import type { InitializedMonster } from './monster-initializer.service';
import { SpecialBerryService } from './special-berry.service';
import type { SpecialBerryInventory } from './special-berry.service';
import { MonsterRollerService } from './monster-roller.service';
import type { UserSettings } from './monster-roller.service';

// ============================================================================
// Types
// ============================================================================

export type EligibilityResult = {
  eligible: boolean;
  reason: string;
};

export type OffspringData = {
  name: string;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  where_met: string;
  friendship: number;
};

export type BreedingSession = {
  sessionId: string;
  userId: string;
  trainerId: number;
  parent1Id: number;
  parent2Id: number;
  parent1: MonsterWithTrainer;
  parent2: MonsterWithTrainer;
  offspring: InitializedMonster[];
  userSettings: UserSettings;
  specialBerries: SpecialBerryInventory;
  claimedMonsters: number[];
  createdAt: string;
};

export type BreedResult = {
  sessionId: string;
  parent1: MonsterWithTrainer;
  parent2: MonsterWithTrainer;
  offspring: InitializedMonster[];
  specialBerries: SpecialBerryInventory;
};

export type ClaimResult = {
  monster: MonsterWithTrainer;
  claimedMonsters: number[];
  specialBerries: SpecialBerryInventory;
};

export type RerollResult = {
  sessionId: string;
  offspring: InitializedMonster[];
  specialBerries: SpecialBerryInventory;
};

type FranchiseId =
  | 'pokemon'
  | 'digimon'
  | 'yokai'
  | 'nexomon'
  | 'pals'
  | 'fakemon'
  | 'finalfantasy'
  | 'monsterhunter';

const ATTRIBUTES = ['Data', 'Virus', 'Vaccine', 'Variable', 'Free'] as const;

const DEFAULT_USER_SETTINGS: UserSettings = {
  pokemon: true,
  digimon: true,
  yokai: true,
  nexomon: true,
  pals: true,
  fakemon: true,
  finalfantasy: true,
  monsterhunter: true,
};

// ============================================================================
// Service
// ============================================================================

export class BreedingService {
  private monsterRepo: MonsterRepository;
  private lineageRepo: MonsterLineageRepository;
  private trainerRepo: TrainerRepository;
  private inventoryRepo: TrainerInventoryRepository;
  private userRepo: UserRepository;
  private initializer: MonsterInitializerService;
  private berryService: SpecialBerryService;

  // Species repositories
  private pokemonRepo: PokemonSpeciesRepository;
  private digimonRepo: DigimonSpeciesRepository;
  private yokaiRepo: YokaiSpeciesRepository;
  private nexomonRepo: NexomonSpeciesRepository;
  private palsRepo: PalsSpeciesRepository;
  private fakemonRepo: FakemonSpeciesRepository;
  private finalFantasyRepo: FinalFantasySpeciesRepository;
  private monsterHunterRepo: MonsterHunterSpeciesRepository;

  // In-memory breeding sessions
  private sessions = new Map<string, BreedingSession>();

  constructor(
    monsterRepo?: MonsterRepository,
    lineageRepo?: MonsterLineageRepository,
    trainerRepo?: TrainerRepository,
    userRepo?: UserRepository,
    initializer?: MonsterInitializerService,
    berryService?: SpecialBerryService,
  ) {
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.lineageRepo = lineageRepo ?? new MonsterLineageRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.inventoryRepo = new TrainerInventoryRepository();
    this.userRepo = userRepo ?? new UserRepository();
    this.initializer = initializer ?? new MonsterInitializerService();
    this.berryService = berryService ?? new SpecialBerryService();

    this.pokemonRepo = new PokemonSpeciesRepository();
    this.digimonRepo = new DigimonSpeciesRepository();
    this.yokaiRepo = new YokaiSpeciesRepository();
    this.nexomonRepo = new NexomonSpeciesRepository();
    this.palsRepo = new PalsSpeciesRepository();
    this.fakemonRepo = new FakemonSpeciesRepository();
    this.finalFantasyRepo = new FinalFantasySpeciesRepository();
    this.monsterHunterRepo = new MonsterHunterSpeciesRepository();
  }

  // ==========================================================================
  // Species Identification
  // ==========================================================================

  private async identifyFranchise(species: string): Promise<FranchiseId | null> {
    // Check each franchise in parallel for efficiency
    const [pokemon, digimon, yokai, nexomon, pals, fakemon, finalFantasy, monsterHunter] =
      await Promise.all([
        this.pokemonRepo.findByName(species),
        this.digimonRepo.findByName(species),
        this.yokaiRepo.findByName(species),
        this.nexomonRepo.findByName(species),
        this.palsRepo.findByName(species),
        this.fakemonRepo.findByName(species),
        this.finalFantasyRepo.findByName(species),
        this.monsterHunterRepo.findByName(species),
      ]);

    if (pokemon) { return 'pokemon'; }
    if (digimon) { return 'digimon'; }
    if (yokai) { return 'yokai'; }
    if (nexomon) { return 'nexomon'; }
    if (pals) { return 'pals'; }
    if (fakemon) { return 'fakemon'; }
    if (finalFantasy) { return 'finalfantasy'; }
    if (monsterHunter) { return 'monsterhunter'; }

    return null;
  }

  // ==========================================================================
  // Eligibility Checking
  // ==========================================================================

  private async checkSpeciesEligibility(species: string): Promise<EligibilityResult> {
    const franchise = await this.identifyFranchise(species);

    if (!franchise) {
      return { eligible: true, reason: '' };
    }

    // Pals and Monster Hunter are always eligible
    if (franchise === 'pals' || franchise === 'monsterhunter') {
      return { eligible: true, reason: '' };
    }

    // Check stage/rank based on franchise
    switch (franchise) {
      case 'pokemon': {
        const pokemon = await this.pokemonRepo.findByName(species);
        if (pokemon?.stage && pokemon.stage !== 'Final Stage' && pokemon.stage !== "Doesn't Evolve") {
          return { eligible: false, reason: `${species} is not in its final evolution stage` };
        }
        break;
      }
      case 'digimon': {
        const digimon = await this.digimonRepo.findByName(species);
        if (digimon?.rank && (digimon.rank === 'Baby I' || digimon.rank === 'Baby II' || digimon.rank === 'Child')) {
          return { eligible: false, reason: `${species} is not mature enough for breeding` };
        }
        break;
      }
      case 'yokai': {
        const yokai = await this.yokaiRepo.findByName(species);
        if (yokai?.stage && yokai.stage !== 'Final Stage' && yokai.stage !== "Doesn't Evolve") {
          return { eligible: false, reason: `${species} is not in its final evolution stage` };
        }
        break;
      }
      case 'nexomon': {
        const nexomon = await this.nexomonRepo.findByName(species);
        if (nexomon?.stage && nexomon.stage !== 'Final Stage' && nexomon.stage !== "Doesn't Evolve") {
          return { eligible: false, reason: `${species} is not in its final evolution stage` };
        }
        break;
      }
      case 'fakemon': {
        const fakemon = await this.fakemonRepo.findByName(species);
        if (fakemon?.stage && fakemon.stage !== 'Final Stage' && fakemon.stage !== "Doesn't Evolve") {
          return { eligible: false, reason: `${species} is not in its final evolution stage` };
        }
        break;
      }
      case 'finalfantasy': {
        const ff = await this.finalFantasyRepo.findByName(species);
        if (ff?.stage && ff.stage !== 'Final Stage' && ff.stage !== "Doesn't Evolve" && ff.stage.toLowerCase() !== "doesn't evolve") {
          return { eligible: false, reason: `${species} is not in its final evolution stage` };
        }
        break;
      }
    }

    return { eligible: true, reason: '' };
  }

  async checkBreedingEligibility(monster: MonsterWithTrainer): Promise<EligibilityResult> {
    const speciesToCheck = [monster.species1, monster.species2, monster.species3].filter(
      (s): s is string => !!s,
    );

    if (speciesToCheck.length === 0) {
      return { eligible: false, reason: 'Monster has no species' };
    }

    for (const species of speciesToCheck) {
      const result = await this.checkSpeciesEligibility(species);
      if (!result.eligible) {
        return result;
      }
    }

    return { eligible: true, reason: '' };
  }

  async checkMonsterEligibility(monsterId: number): Promise<EligibilityResult> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      return { eligible: false, reason: 'Monster not found' };
    }
    return this.checkBreedingEligibility(monster);
  }

  async getEligibleMonsterIds(monsterIds: number[]): Promise<number[]> {
    const results = await Promise.all(
      monsterIds.map(async (id) => {
        const result = await this.checkMonsterEligibility(id);
        return { id, eligible: result.eligible };
      }),
    );
    return results.filter((r) => r.eligible).map((r) => r.id);
  }

  // ==========================================================================
  // Breeding Result Generation
  // ==========================================================================

  private getUserSettings(rollerSettings: MonsterRollerSettings | null): UserSettings {
    if (!rollerSettings) {
      return { ...DEFAULT_USER_SETTINGS };
    }

    return {
      pokemon: rollerSettings.pokemon ?? true,
      digimon: rollerSettings.digimon ?? true,
      yokai: rollerSettings.yokai ?? true,
      nexomon: rollerSettings.nexomon ?? true,
      pals: rollerSettings.pals ?? true,
      fakemon: rollerSettings.fakemon ?? true,
      finalfantasy: rollerSettings.finalfantasy ?? true,
      monsterhunter: rollerSettings.monsterhunter ?? true,
    };
  }

  private getEnabledTables(settings: UserSettings): FranchiseId[] {
    const tables: FranchiseId[] = [];
    if (settings.pokemon) { tables.push('pokemon'); }
    if (settings.digimon) { tables.push('digimon'); }
    if (settings.yokai) { tables.push('yokai'); }
    if (settings.nexomon) { tables.push('nexomon'); }
    if (settings.pals) { tables.push('pals'); }
    if (settings.fakemon) { tables.push('fakemon'); }
    if (settings.finalfantasy) { tables.push('finalfantasy'); }
    if (settings.monsterhunter) { tables.push('monsterhunter'); }

    // If nothing enabled, enable all
    if (tables.length === 0) {
      return ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'];
    }

    return tables;
  }

  private getRandomAttribute(): string {
    return ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)] ?? 'Data';
  }

  private async getBreedingResultsForSpecies(species: string): Promise<string | null> {
    const franchise = await this.identifyFranchise(species);
    if (!franchise) { return null; }

    switch (franchise) {
      case 'pokemon': {
        const pokemon = await this.pokemonRepo.findByName(species);
        return pokemon?.breedingResults ?? null;
      }
      case 'digimon': {
        const digimon = await this.digimonRepo.findByName(species);
        return digimon?.breedingResults ?? null;
      }
      case 'yokai': {
        const yokai = await this.yokaiRepo.findByName(species);
        return yokai?.breedingResults ?? null;
      }
      case 'nexomon': {
        const nexomon = await this.nexomonRepo.findByName(species);
        return nexomon?.breedingResults ?? null;
      }
      case 'pals': {
        // Pals breed true - return the same species
        return species;
      }
      case 'fakemon': {
        // Fakemon doesn't have breedingResults in the schema - breed true
        return species;
      }
      case 'finalfantasy': {
        const ff = await this.finalFantasyRepo.findByName(species);
        return ff?.breedingResults ?? null;
      }
      case 'monsterhunter': {
        // Monster Hunter monsters always breed true
        return species;
      }
    }
  }

  private selectFromBreedingResults(breedingResults: string): string {
    const speciesList = breedingResults
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (speciesList.length === 0) { return breedingResults; }
    return speciesList[Math.floor(Math.random() * speciesList.length)] ?? breedingResults;
  }

  private async determineOffspringSpecies(
    parent1: MonsterWithTrainer,
    parent2: MonsterWithTrainer,
  ): Promise<OffspringData> {
    // Collect all parent species
    const parentSpecies = [
      parent1.species1, parent1.species2, parent1.species3,
      parent2.species1, parent2.species2, parent2.species3,
    ].filter((s): s is string => !!s);

    // Shuffle parent species
    const shuffled = [...parentSpecies].sort(() => 0.5 - Math.random());

    // Determine number of species for offspring (1-3)
    const speciesCount = Math.min(Math.floor(Math.random() * 3) + 1, shuffled.length);

    const resolvedSpecies: string[] = [];

    for (let i = 0; i < speciesCount; i++) {
      const parentSource = shuffled[i];
      if (!parentSource) { break; }

      let resolved: string | null = null;
      const breedingResults = await this.getBreedingResultsForSpecies(parentSource);
      if (breedingResults) {
        resolved = this.selectFromBreedingResults(breedingResults);
      }
      resolved ??= parentSource;

      // Avoid duplicate species
      if (!resolvedSpecies.includes(resolved)) {
        resolvedSpecies.push(resolved);
      }
    }

    const finalSpecies1 = resolvedSpecies[0] ?? shuffled[0] ?? parent1.species1;

    return {
      name: finalSpecies1,
      species1: finalSpecies1,
      species2: resolvedSpecies[1] ?? null,
      species3: resolvedSpecies[2] ?? null,
      type1: null,
      type2: null,
      type3: null,
      type4: null,
      type5: null,
      attribute: null,
      level: 1,
      where_met: 'Farm Breeding',
      friendship: 70,
    };
  }

  private combineParentTypes(
    offspring: OffspringData,
    parent1: MonsterWithTrainer,
    parent2: MonsterWithTrainer,
  ): OffspringData {
    // Collect all parent types
    const parentTypes: string[] = [];
    for (const parent of [parent1, parent2]) {
      if (parent.type1) { parentTypes.push(parent.type1); }
      if (parent.type2) { parentTypes.push(parent.type2); }
      if (parent.type3) { parentTypes.push(parent.type3); }
      if (parent.type4) { parentTypes.push(parent.type4); }
      if (parent.type5) { parentTypes.push(parent.type5); }
    }

    // Remove duplicates and shuffle
    const uniqueTypes = [...new Set(parentTypes)];
    const shuffled = uniqueTypes.sort(() => 0.5 - Math.random());

    // 1-5 types for offspring (weighted toward fewer)
    const maxTypes = Math.min(shuffled.length, 5);
    const roll = Math.random();
    let typeCount: number;
    if (roll < 0.35) { typeCount = 1; }
    else if (roll < 0.65) { typeCount = 2; }
    else if (roll < 0.85) { typeCount = 3; }
    else if (roll < 0.95) { typeCount = 4; }
    else { typeCount = 5; }
    typeCount = Math.min(typeCount, maxTypes);

    const selected = shuffled.slice(0, typeCount);

    offspring.type1 = selected[0] ?? null;
    offspring.type2 = selected[1] ?? null;
    offspring.type3 = selected[2] ?? null;
    offspring.type4 = selected[3] ?? null;
    offspring.type5 = selected[4] ?? null;

    return offspring;
  }

  /**
   * Roll a single random species from the enabled franchise tables.
   * Returns null if the roll fails.
   */
  private async rollRandomSpecies(
    enabledTables: FranchiseId[],
    userSettings: UserSettings,
  ): Promise<string | null> {
    try {
      const roller = new MonsterRollerService({
        enabledTables,
        userSettings,
        seed: Date.now().toString() + Math.random().toString(),
      });

      const result = await roller.rollMonster({
        includeStages: ['Base Stage', "Doesn't Evolve"],
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        legendary: false,
        mythical: false,
      });

      return result?.species1 ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Roll a single random type from the enabled franchise tables.
   */
  private async rollRandomType(
    enabledTables: FranchiseId[],
    userSettings: UserSettings,
  ): Promise<string | null> {
    try {
      const roller = new MonsterRollerService({
        enabledTables,
        userSettings,
        seed: Date.now().toString() + Math.random().toString(),
      });

      const result = await roller.rollMonster({
        legendary: false,
        mythical: false,
      });

      // Pick a random type from the rolled monster
      const types = [result?.type1, result?.type2, result?.type3, result?.type4, result?.type5]
        .filter((t): t is string => !!t);
      if (types.length === 0) { return null; }
      return types[Math.floor(Math.random() * types.length)] ?? null;
    } catch {
      return null;
    }
  }

  private async generateBreedingResults(
    parent1: MonsterWithTrainer,
    parent2: MonsterWithTrainer,
    userSettings: UserSettings,
    extraItems: Record<string, number> = {},
  ): Promise<OffspringData[]> {
    // Determine offspring count with item modifiers
    const teemingTotem = extraItems['Teeming Totem'] ?? 0;
    const hermitsWard = extraItems["Hermit's Ward"] ?? 0;

    let offspringCount: number;
    if (hermitsWard > 0) {
      // Hermit's Ward: heavily favor 1 offspring (70% 1, 20% 2, 10% 3, 0% 4)
      const roll = Math.random();
      offspringCount = roll < 0.7 ? 1 : roll < 0.9 ? 2 : 3;
    } else if (teemingTotem > 0) {
      // Teeming Totem: heavily favor more offspring (10% 1, 15% 2, 35% 3, 40% 4)
      const roll = Math.random();
      offspringCount = roll < 0.1 ? 1 : roll < 0.25 ? 2 : roll < 0.6 ? 3 : 4;
    } else {
      offspringCount = Math.floor(Math.random() * 4) + 1;
    }

    const enabledTables = this.getEnabledTables(userSettings);
    const offspring: OffspringData[] = [];

    // Per-element mutation chance: base 10%, Mutagenic Mulch adds 40% per stack (up to 5 = +200%)
    const mulchCount = extraItems['Mutagenic Mulch'] ?? 0;
    const MUTATION_CHANCE = Math.min(0.1 * (1 + mulchCount * 2), 1);

    for (let i = 0; i < offspringCount; i++) {
      // Start with normal breeding results
      const offspringMonster = await this.determineOffspringSpecies(parent1, parent2);

      // Apply type inheritance from parents
      this.combineParentTypes(offspringMonster, parent1, parent2);

      // Per-element mutations: each species and type slot independently may mutate
      const speciesSlots: (keyof OffspringData)[] = ['species1', 'species2', 'species3'];
      for (const slot of speciesSlots) {
        if (offspringMonster[slot] && Math.random() < MUTATION_CHANCE) {
          const mutant = await this.rollRandomSpecies(enabledTables, userSettings);
          if (mutant) {
            (offspringMonster as Record<string, unknown>)[slot] = mutant;
          }
        }
      }

      const typeSlots: (keyof OffspringData)[] = ['type1', 'type2', 'type3', 'type4', 'type5'];
      for (const slot of typeSlots) {
        if (offspringMonster[slot] && Math.random() < MUTATION_CHANCE) {
          const mutantType = await this.rollRandomType(enabledTables, userSettings);
          if (mutantType) {
            (offspringMonster as Record<string, unknown>)[slot] = mutantType;
          }
        }
      }

      // Update name to match species1 after potential mutation
      offspringMonster.name = offspringMonster.species1;

      // Random attribute
      offspringMonster.attribute = this.getRandomAttribute();

      offspring.push(offspringMonster);
    }

    return offspring;
  }

  private async initializeOffspring(offspringData: OffspringData[]): Promise<InitializedMonster[]> {
    const initialized: InitializedMonster[] = [];

    for (const data of offspringData) {
      try {
        // Convert null fields to undefined for MonsterData compatibility
        const monsterData = {
          name: data.name,
          species1: data.species1,
          species2: data.species2 ?? undefined,
          species3: data.species3 ?? undefined,
          type1: data.type1 ?? undefined,
          type2: data.type2 ?? undefined,
          type3: data.type3 ?? undefined,
          type4: data.type4 ?? undefined,
          type5: data.type5 ?? undefined,
          attribute: data.attribute ?? undefined,
          level: data.level,
          where_met: data.where_met,
          friendship: data.friendship,
        };
        const result = await this.initializer.initializeMonster(monsterData);
        initialized.push(result);
      } catch (error) {
        console.error('Error initializing offspring monster:', error);
        // Add basic data even if initialization fails
        initialized.push(data as unknown as InitializedMonster);
      }
    }

    return initialized;
  }

  // ==========================================================================
  // Breeding Session Management
  // ==========================================================================

  async breedMonsters(
    trainerId: number,
    parent1Id: number,
    parent2Id: number,
    userId: string,
    extraItems?: Record<string, number>,
  ): Promise<BreedResult> {
    // Validate trainer ownership
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    if (trainer.player_user_id !== userId) {
      throw new Error('You can only breed with your own trainers');
    }

    // Get parent monsters
    const [parent1, parent2] = await Promise.all([
      this.monsterRepo.findById(parent1Id),
      this.monsterRepo.findById(parent2Id),
    ]);

    if (!parent1 || !parent2) {
      throw new Error('One or both parent monsters not found');
    }

    // Check eligibility
    const [elig1, elig2] = await Promise.all([
      this.checkBreedingEligibility(parent1),
      this.checkBreedingEligibility(parent2),
    ]);

    if (!elig1.eligible) {
      throw new Error(`Parent 1 is not eligible for breeding: ${elig1.reason}`);
    }
    if (!elig2.eligible) {
      throw new Error(`Parent 2 is not eligible for breeding: ${elig2.reason}`);
    }

    // Check and consume Legacy Leeway from the breeding trainer
    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    const legacyLeewayCount = inventory?.items?.['Legacy Leeway'] ?? 0;
    if (legacyLeewayCount <= 0) {
      throw new Error('Your trainer does not have a Legacy Leeway item required for breeding');
    }
    await this.inventoryRepo.removeItem(trainerId, 'items', 'Legacy Leeway', 1);

    // Validate and consume extra breeding items
    const VALID_EXTRA_ITEMS: Record<string, number> = {
      'Mutagenic Mulch': 5,
      'Teeming Totem': 1,
      "Hermit's Ward": 1,
    };
    const validatedExtras: Record<string, number> = {};
    if (extraItems && typeof extraItems === 'object') {
      for (const [name, requested] of Object.entries(extraItems)) {
        const maxAllowed = VALID_EXTRA_ITEMS[name];
        if (maxAllowed === undefined || typeof requested !== 'number' || requested <= 0) { continue; }
        const amount = Math.min(Math.floor(requested), maxAllowed);
        const owned = inventory?.items?.[name] ?? 0;
        if (owned < amount) {
          throw new Error(`Not enough ${name} (have ${owned}, need ${amount})`);
        }
        validatedExtras[name] = amount;
      }
      // Consume all validated extra items
      for (const [name, amount] of Object.entries(validatedExtras)) {
        await this.inventoryRepo.removeItem(trainerId, 'items', name, amount);
      }
    }

    // Get user settings
    const user = await this.userRepo.findByDiscordId(userId);
    const rawSettings = user?.monster_roller_settings ?? null;
    const parsedSettings: MonsterRollerSettings | null =
      typeof rawSettings === 'string' ? JSON.parse(rawSettings) as MonsterRollerSettings : rawSettings;
    const userSettings = this.getUserSettings(parsedSettings);

    // Generate and initialize offspring
    const offspringData = await this.generateBreedingResults(parent1, parent2, userSettings, validatedExtras);
    const offspring = await this.initializeOffspring(offspringData);

    // Get special berries
    const specialBerries = await this.berryService.getAvailableSpecialBerries(trainerId);

    // Create session
    const sessionId = randomUUID();
    const session: BreedingSession = {
      sessionId,
      userId,
      trainerId,
      parent1Id,
      parent2Id,
      parent1,
      parent2,
      offspring,
      userSettings,
      specialBerries,
      claimedMonsters: [],
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      parent1,
      parent2,
      offspring,
      specialBerries,
    };
  }

  async claimBreedingResult(
    sessionId: string,
    monsterIndex: number,
    userId: string,
    customName?: string,
    claimTrainerId?: number,
  ): Promise<ClaimResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Breeding session not found');
    }

    if (session.userId !== userId) {
      throw new Error('You can only access your own breeding sessions');
    }

    if (monsterIndex < 0 || monsterIndex >= session.offspring.length) {
      throw new Error('Invalid monster index');
    }

    if (session.claimedMonsters.includes(monsterIndex)) {
      throw new Error('This monster has already been claimed');
    }

    const monsterData = session.offspring[monsterIndex];
    if (!monsterData) {
      throw new Error('Invalid monster index');
    }

    // Determine which trainer to assign the monster to
    const targetTrainerId = claimTrainerId ?? session.trainerId;

    // Get the trainer for correct user ID
    const trainer = await this.trainerRepo.findById(targetTrainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Initialize and save the monster
    const monsterToCreate: MonsterCreateInput = {
      trainerId: targetTrainerId,
      playerUserId: trainer.player_user_id,
      name: customName?.trim() ?? monsterData.name ?? monsterData.species1 ?? 'Unknown',
      species1: monsterData.species1 ?? '',
      species2: monsterData.species2 as string | undefined,
      species3: monsterData.species3 as string | undefined,
      type1: monsterData.type1 ?? '',
      type2: monsterData.type2 as string | undefined,
      type3: monsterData.type3 as string | undefined,
      type4: monsterData.type4 as string | undefined,
      type5: monsterData.type5 as string | undefined,
      attribute: monsterData.attribute as string | undefined,
      level: 1,
      nature: monsterData.nature as string | undefined,
      characteristic: monsterData.characteristic as string | undefined,
      gender: monsterData.gender as string | undefined,
      friendship: 70,
      ability1: monsterData.ability1 as string | undefined,
      ability2: monsterData.ability2 as string | undefined,
      moveset: typeof monsterData.moveset === 'string'
        ? JSON.parse(monsterData.moveset) as string[]
        : Array.isArray(monsterData.moveset)
          ? monsterData.moveset as string[]
          : undefined,
      whereMet: 'Farm Breeding',
      hpIv: monsterData.hp_iv,
      atkIv: monsterData.atk_iv,
      defIv: monsterData.def_iv,
      spaIv: monsterData.spa_iv,
      spdIv: monsterData.spd_iv,
      speIv: monsterData.spe_iv,
      hpTotal: monsterData.hp_total,
      atkTotal: monsterData.atk_total,
      defTotal: monsterData.def_total,
      spaTotal: monsterData.spa_total,
      spdTotal: monsterData.spd_total,
      speTotal: monsterData.spe_total,
    };

    const savedMonster = await this.monsterRepo.create(monsterToCreate);

    // Add automatic lineage tracking
    try {
      await this.lineageRepo.addBreedingLineage(
        session.parent1Id,
        session.parent2Id,
        [savedMonster.id],
      );
    } catch (lineageError) {
      console.error('Error adding lineage tracking:', lineageError);
      // Don't fail the breeding if lineage tracking fails
    }

    // Mark monster as claimed
    session.claimedMonsters.push(monsterIndex);

    // Get updated special berries
    const updatedBerries = await this.berryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedBerries;

    return {
      monster: savedMonster,
      claimedMonsters: session.claimedMonsters,
      specialBerries: updatedBerries,
    };
  }

  async rerollBreedingResults(sessionId: string, userId: string): Promise<RerollResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Breeding session not found');
    }

    if (session.userId !== userId) {
      throw new Error('You can only access your own breeding sessions');
    }

    // Check and consume Forget-Me-Not berry
    const hasBerry = await this.berryService.hasSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!hasBerry) {
      throw new Error('You do not have a Forget-Me-Not berry');
    }

    const consumed = await this.berryService.consumeSpecialBerry(session.trainerId, 'Forget-Me-Not');
    if (!consumed) {
      throw new Error('Failed to consume Forget-Me-Not berry');
    }

    // Generate new offspring
    const offspringData = await this.generateBreedingResults(
      session.parent1,
      session.parent2,
      session.userSettings,
    );
    const newOffspring = await this.initializeOffspring(offspringData);

    // Update session
    session.offspring = newOffspring;
    session.claimedMonsters = [];

    // Get updated special berries
    const updatedBerries = await this.berryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedBerries;

    return {
      sessionId,
      offspring: newOffspring,
      specialBerries: updatedBerries,
    };
  }

  async getBreedingSession(sessionId: string, userId: string): Promise<BreedingSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Breeding session not found');
    }

    if (session.userId !== userId) {
      throw new Error('You can only access your own breeding sessions');
    }

    return session;
  }
}
