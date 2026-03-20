import { db } from '../database';
import {
  MonsterRepository,
  TrainerRepository,
  TrainerInventoryRepository,
} from '../repositories';
import type {
  MonsterWithTrainer,
  MonsterUpdateInput,
} from '../repositories';
import {
  MONSTER_TABLES,
  TABLE_NAME_MAP,
  TABLE_SCHEMAS,
} from '../utils/constants';
import type { MonsterTable } from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

export type SpeciesSlot = 'species1' | 'species2' | 'species3';

export type EvolutionOption = {
  name: string;
  type: string;
};

export type EvolveInput = {
  monsterId: number;
  trainerId: number;
  speciesSlot: SpeciesSlot;
  evolutionName?: string;
  evolutionItem?: string;
  imageUrl?: string;
  useVoidStone?: boolean;
  useDigitalRepairKit?: boolean;
  customEvolutionName?: string;
};

export type EvolveResult = {
  monster: MonsterWithTrainer;
};

export type MultiEvolutionSlot = {
  speciesSlot: SpeciesSlot;
  evolutionName?: string;
  useDigitalRepairKit?: boolean;
  customEvolutionName?: string;
};

export type MultiEvolveInput = {
  monsterId: number;
  trainerId: number;
  stoneType: string;
  evolutions: MultiEvolutionSlot[];
  imageUrl?: string;
  useVoidStone?: boolean;
};

// ============================================================================
// Constants
// ============================================================================

const EVOLUTION_ITEM_TYPE_MAP: Record<string, string> = {
  'Fire Stone': 'Fire',
  'Water Stone': 'Water',
  'Thunder Stone': 'Electric',
  'Leaf Stone': 'Grass',
  'Moon Stone': 'Fairy',
  'Sun Stone': 'Bug',
  'Shiny Stone': 'Ghost',
  'Dusk Stone': 'Dark',
  'Dawn Stone': 'Psychic',
  'Ice Stone': 'Ice',
  'Dragon Scale': 'Dragon',
  'Metal Coat': 'Steel',
  "Sensei's Pillow": 'Fighting',
  'Poison Fang': 'Poison',
  'Amber Stone': 'Ground',
  'Glass Wing': 'Flying',
  'Normal Stone': 'Normal',
};

const NO_TYPE_CHANGE_ITEMS = ['Void Evolution Stone', 'Digital Repair Kit', 'Chimera Stone', 'Hydra Crystal'];

// ============================================================================
// Service
// ============================================================================

export class EvolutionService {
  private monsterRepo: MonsterRepository;
  private trainerRepo: TrainerRepository;
  private inventoryRepo: TrainerInventoryRepository;

  constructor(
    monsterRepo?: MonsterRepository,
    trainerRepo?: TrainerRepository,
    inventoryRepo?: TrainerInventoryRepository,
  ) {
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.inventoryRepo = inventoryRepo ?? new TrainerInventoryRepository();
  }

  // ==========================================================================
  // Evolve Monster
  // ==========================================================================

  async evolveMonster(input: EvolveInput): Promise<EvolveResult> {
    const {
      monsterId,
      trainerId,
      speciesSlot,
      evolutionName,
      evolutionItem,
      useVoidStone,
      useDigitalRepairKit,
      customEvolutionName,
    } = input;

    // Validate monster exists
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    // Validate trainer exists
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Validate monster belongs to trainer
    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the specified trainer');
    }

    // Validate species slot
    const speciesValue = this.getSpeciesValue(monster, speciesSlot);
    if (!speciesValue) {
      throw new Error(`The monster does not have a ${speciesSlot}`);
    }

    // Validate image or void stone
    if (!input.imageUrl && !useVoidStone) {
      throw new Error('Image URL is required, or use a Void Evolution Stone');
    }

    // Check evolution item inventory (but avoid double-checking void stone)
    if (evolutionItem && !(useVoidStone && evolutionItem === 'Void Evolution Stone')) {
      await this.validateInventoryItem(trainerId, evolutionItem);
    }

    // Check void stone inventory
    if (useVoidStone) {
      await this.validateInventoryItem(trainerId, 'Void Evolution Stone');
    }

    // Check digital repair kit inventory
    if (useDigitalRepairKit) {
      await this.validateInventoryItem(trainerId, 'Digital Repair Kit');
    }

    // Build the update
    const update: MonsterUpdateInput = {
      level: monster.level + 1,
      imgLink: null,
    };

    // Update species slot
    const newSpeciesName = this.determineNewSpeciesName(
      speciesValue,
      evolutionName,
      useDigitalRepairKit,
      customEvolutionName,
    );
    this.setSpeciesSlot(update, speciesSlot, newSpeciesName);

    // Apply type changes from evolution item
    if (evolutionItem) {
      this.applyTypeChanges(update, monster, evolutionItem);
    }

    // Save evolution history
    await this.saveEvolutionHistory(monsterId, monster, evolutionItem);

    // Update monster in database
    const updatedMonster = await this.monsterRepo.update(monsterId, update);

    // Remove evolution items from inventory (avoid double consumption of void stone)
    if (evolutionItem && !(useVoidStone && evolutionItem === 'Void Evolution Stone')) {
      await this.inventoryRepo.removeItem(trainerId, 'evolution', evolutionItem, 1);
    }

    if (useVoidStone) {
      await this.inventoryRepo.removeItem(trainerId, 'evolution', 'Void Evolution Stone', 1);
    }

    if (useDigitalRepairKit) {
      await this.inventoryRepo.removeItem(trainerId, 'evolution', 'Digital Repair Kit', 1);
    }

    return { monster: updatedMonster };
  }

  // ==========================================================================
  // Multi-Evolve Monster (Chimera Stone / Hydra Crystal)
  // ==========================================================================

  async multiEvolveMonster(input: MultiEvolveInput): Promise<EvolveResult> {
    const {
      monsterId,
      trainerId,
      stoneType,
      evolutions,
      useVoidStone,
    } = input;

    // Validate monster exists
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    // Validate trainer exists
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Validate monster belongs to trainer
    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the specified trainer');
    }

    // Validate stone type
    const validStones = ['Chimera Stone', 'Hydra Crystal'];
    if (!validStones.includes(stoneType)) {
      throw new Error('Invalid multi-evolution stone type');
    }

    // Validate species count vs stone type
    const speciesCount = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean).length;

    if (stoneType === 'Chimera Stone') {
      if (speciesCount < 2) {
        throw new Error('Chimera Stone requires a monster with at least 2 species');
      }
      if (evolutions.length !== 2) {
        throw new Error('Chimera Stone requires exactly 2 species to evolve');
      }
    }

    if (stoneType === 'Hydra Crystal') {
      if (speciesCount !== 3) {
        throw new Error('Hydra Crystal requires a monster with exactly 3 species');
      }
      if (evolutions.length !== 3) {
        throw new Error('Hydra Crystal requires exactly 3 species to evolve');
      }
    }

    // Validate no duplicate species slots
    const slots = evolutions.map(e => e.speciesSlot);
    if (new Set(slots).size !== slots.length) {
      throw new Error('Cannot evolve the same species slot twice');
    }

    // Validate image or void stones
    if (!input.imageUrl && !useVoidStone) {
      throw new Error('Image URL is required, or use Void Evolution Stones');
    }

    // Validate stone inventory
    await this.validateInventoryItem(trainerId, stoneType);

    // Validate void stone count (1 per species being evolved)
    if (useVoidStone) {
      const hasEnough = await this.inventoryRepo.hasItem(
        trainerId, 'Void Evolution Stone', evolutions.length,
      );
      if (!hasEnough) {
        throw new Error(
          `Not enough Void Evolution Stones. Need ${evolutions.length} (1 per species being evolved)`,
        );
      }
    }

    // Validate each evolution slot and count DRKs needed
    let drkCount = 0;
    for (const evo of evolutions) {
      const speciesValue = this.getSpeciesValue(monster, evo.speciesSlot);
      if (!speciesValue) {
        throw new Error(`The monster does not have a ${evo.speciesSlot}`);
      }

      if (!evo.evolutionName && !evo.useDigitalRepairKit) {
        throw new Error(
          `Evolution name is required for ${evo.speciesSlot}, or use a Digital Repair Kit`,
        );
      }

      if (evo.useDigitalRepairKit) {
        if (!evo.customEvolutionName?.trim()) {
          throw new Error(
            `Custom evolution name is required when using Digital Repair Kit for ${evo.speciesSlot}`,
          );
        }
        drkCount++;
      }
    }

    // Validate DRK count
    if (drkCount > 0) {
      const hasEnoughDrk = await this.inventoryRepo.hasItem(
        trainerId, 'Digital Repair Kit', drkCount,
      );
      if (!hasEnoughDrk) {
        throw new Error(`Not enough Digital Repair Kits. Need ${drkCount}`);
      }
    }

    // Build the update
    const update: MonsterUpdateInput = {
      level: monster.level + 1,
      imgLink: null,
    };

    // Update each species slot
    for (const evo of evolutions) {
      const speciesValue = this.getSpeciesValue(monster, evo.speciesSlot);
      if (!speciesValue) {
        continue; // Already validated above
      }
      const newSpeciesName = this.determineNewSpeciesName(
        speciesValue,
        evo.evolutionName,
        evo.useDigitalRepairKit,
        evo.customEvolutionName,
      );
      this.setSpeciesSlot(update, evo.speciesSlot, newSpeciesName);
    }

    // Save evolution history
    await this.saveEvolutionHistory(monsterId, monster, stoneType);

    // Update monster in database
    const updatedMonster = await this.monsterRepo.update(monsterId, update);

    // Consume items
    await this.inventoryRepo.removeItem(trainerId, 'evolution', stoneType, 1);

    if (useVoidStone) {
      await this.inventoryRepo.removeItem(
        trainerId, 'evolution', 'Void Evolution Stone', evolutions.length,
      );
    }

    if (drkCount > 0) {
      await this.inventoryRepo.removeItem(
        trainerId, 'evolution', 'Digital Repair Kit', drkCount,
      );
    }

    return { monster: updatedMonster };
  }

  // ==========================================================================
  // Get Evolution Options (by monster ID)
  // ==========================================================================

  async getEvolutionOptions(
    monsterId: number,
    speciesSlot: SpeciesSlot = 'species1',
  ): Promise<EvolutionOption[]> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }

    const speciesValue = this.getSpeciesValue(monster, speciesSlot);
    if (!speciesValue) {
      throw new Error(`The monster does not have a ${speciesSlot}`);
    }

    return this.findEvolutionOptions(speciesValue);
  }

  // ==========================================================================
  // Get Evolution Options (by species name)
  // ==========================================================================

  async getEvolutionOptionsBySpecies(speciesName: string): Promise<EvolutionOption[]> {
    return this.findEvolutionOptions(speciesName);
  }

  // ==========================================================================
  // Get Reverse Evolution Options
  // ==========================================================================

  async getReverseEvolutionOptions(speciesName: string): Promise<EvolutionOption[]> {
    const results: EvolutionOption[] = [];

    for (const table of MONSTER_TABLES) {
      const schema = TABLE_SCHEMAS[table];

      // Skip tables without evolution fields
      if (schema.evolutionFields.length === 0) {
        continue;
      }

      const tableName = TABLE_NAME_MAP[table];
      const evolutionToField = schema.evolutionFields[1];

      if (!evolutionToField) {
        continue;
      }

      const query = `
        SELECT ${schema.nameField}, ${evolutionToField}
        FROM ${tableName}
        WHERE ${evolutionToField} IS NOT NULL AND ${evolutionToField} != ''
      `;
      const queryResult = await db.query<Record<string, string>>(query);

      for (const row of queryResult.rows) {
        const name = row[schema.nameField];
        const evolutionTo = row[evolutionToField];
        if (!name || !evolutionTo || name === speciesName) {
          continue;
        }

        const evolutions = evolutionTo.split(',').map(e => e.trim());
        if (evolutions.includes(speciesName)) {
          results.push({ name, type: table });
        }
      }
    }

    return results;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private getSpeciesValue(monster: MonsterWithTrainer, slot: SpeciesSlot): string | null {
    switch (slot) {
      case 'species1': return monster.species1;
      case 'species2': return monster.species2;
      case 'species3': return monster.species3;
    }
  }

  private setSpeciesSlot(update: MonsterUpdateInput, slot: SpeciesSlot, value: string): void {
    switch (slot) {
      case 'species1': update.species1 = value; break;
      case 'species2': update.species2 = value; break;
      case 'species3': update.species3 = value; break;
    }
  }

  private determineNewSpeciesName(
    currentSpecies: string,
    evolutionName?: string,
    useDigitalRepairKit?: boolean,
    customEvolutionName?: string,
  ): string {
    if (useDigitalRepairKit) {
      return customEvolutionName ?? `${currentSpecies} (Evolved)`;
    }
    return evolutionName ?? `${currentSpecies} (Evolved)`;
  }

  private async validateInventoryItem(trainerId: number, itemName: string): Promise<void> {
    const hasItem = await this.inventoryRepo.hasItem(trainerId, itemName);
    if (!hasItem) {
      throw new Error(`Trainer does not have ${itemName} in inventory`);
    }
  }

  private applyTypeChanges(
    update: MonsterUpdateInput,
    monster: MonsterWithTrainer,
    evolutionItem: string,
  ): void {
    if (NO_TYPE_CHANGE_ITEMS.includes(evolutionItem)) {
      return;
    }

    let newType: string | undefined;

    if (evolutionItem === 'Aurora Evolution Stone') {
      const types = Object.values(EVOLUTION_ITEM_TYPE_MAP);
      newType = types[Math.floor(Math.random() * types.length)];
    } else {
      newType = EVOLUTION_ITEM_TYPE_MAP[evolutionItem];
    }

    if (!newType) {
      return;
    }

    // Find the first empty type slot or replace type3
    if (!monster.type2) {
      update.type2 = newType;
    } else if (!monster.type3) {
      update.type3 = newType;
    } else if (!monster.type4) {
      update.type4 = newType;
    } else if (!monster.type5) {
      update.type5 = newType;
    } else {
      update.type3 = newType;
    }
  }

  private async saveEvolutionHistory(
    monsterId: number,
    monster: MonsterWithTrainer,
    evolutionItem?: string,
  ): Promise<void> {
    try {
      let currentEvolutionData: object[] = [];
      const existingData = await this.monsterRepo.getEvolutionData(monsterId);

      if (existingData?.evolution_data) {
        try {
          const parsed = typeof existingData.evolution_data === 'string'
            ? JSON.parse(existingData.evolution_data)
            : existingData.evolution_data;

          if (Array.isArray(parsed)) {
            currentEvolutionData = parsed as object[];
          }
        } catch {
          // If parsing fails, start fresh
        }
      }

      const preEvolutionEntry = {
        id: Date.now(),
        image: monster.img_link ?? '',
        species1: monster.species1 ?? '',
        species2: monster.species2 ?? '',
        species3: monster.species3 ?? '',
        type1: monster.type1 ?? '',
        type2: monster.type2 ?? '',
        type3: monster.type3 ?? '',
        type4: monster.type4 ?? '',
        type5: monster.type5 ?? '',
        attribute: monster.attribute ?? '',
        evolution_method: evolutionItem ? `Evolution Item: ${evolutionItem}` : 'Evolution',
        level: monster.level.toString(),
        key: evolutionItem ? 'item' : '',
        data: evolutionItem ?? '',
        order: currentEvolutionData.length,
      };

      currentEvolutionData.push(preEvolutionEntry);
      await this.monsterRepo.setEvolutionData(monsterId, currentEvolutionData);
    } catch (error) {
      console.error('Error saving evolution history:', error);
    }
  }

  private async findEvolutionOptions(speciesName: string): Promise<EvolutionOption[]> {
    const table = await this.findSpeciesTable(speciesName);
    if (!table) {
      return [];
    }

    const schema = TABLE_SCHEMAS[table];

    // No evolution for this table
    if (schema.evolutionFields.length === 0) {
      return [];
    }

    // The evolution_to field is the second in the evolutionFields array
    const evolutionToField = schema.evolutionFields[1];
    if (!evolutionToField) {
      return [];
    }

    const tableName = TABLE_NAME_MAP[table];
    const query = `
      SELECT ${evolutionToField} FROM ${tableName}
      WHERE ${schema.nameField} = $1 AND ${evolutionToField} IS NOT NULL
    `;
    const result = await db.query<Record<string, string>>(query, [speciesName]);

    if (result.rows.length === 0 || !result.rows[0]) {
      return [];
    }

    const evolutionTo = result.rows[0][evolutionToField];
    if (!evolutionTo) {
      return [];
    }

    const evolutions = evolutionTo.split(',').map(e => e.trim());
    return evolutions.map(evo => ({ name: evo, type: table }));
  }

  private async findSpeciesTable(speciesName: string): Promise<MonsterTable | null> {
    for (const table of MONSTER_TABLES) {
      const tableName = TABLE_NAME_MAP[table];
      const schema = TABLE_SCHEMAS[table];
      const query = `SELECT ${schema.nameField} FROM ${tableName} WHERE ${schema.nameField} = $1`;
      const result = await db.query<Record<string, string>>(query, [speciesName]);

      if (result.rows.length > 0) {
        return table;
      }
    }
    return null;
  }
}
