import {
  AbilityRepository,
  MonsterRepository,
  TrainerInventoryRepository,
} from '../repositories';
import type {
  Ability,
  PaginatedAbilities,
  AbilityQueryOptions,
} from '../repositories/ability.repository';

export type MonsterAbilities = {
  ability1: { name: string; effect: string } | null;
  ability2: { name: string; effect: string } | null;
  hiddenAbility: { name: string; effect: string } | null;
};

export type AbilityCapsuleResult = {
  message: string;
  abilities: MonsterAbilities;
};

export type ScrollOfSecretsResult = {
  message: string;
  abilities: MonsterAbilities;
};

export class MegaMartService {
  private abilityRepo: AbilityRepository;
  private monsterRepo: MonsterRepository;
  private inventoryRepo: TrainerInventoryRepository;

  constructor(
    abilityRepo?: AbilityRepository,
    monsterRepo?: MonsterRepository,
    inventoryRepo?: TrainerInventoryRepository,
  ) {
    this.abilityRepo = abilityRepo ?? new AbilityRepository();
    this.monsterRepo = monsterRepo ?? new MonsterRepository();
    this.inventoryRepo = inventoryRepo ?? new TrainerInventoryRepository();
  }

  async getMonsterAbilities(monsterId: number): Promise<MonsterAbilities> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    // If monster has no abilities, generate random ones
    if (!monster.ability1) {
      const randomAbilities = await this.abilityRepo.findRandom(2);
      const a1 = randomAbilities[0];
      const a2 = randomAbilities[1] ?? randomAbilities[0];

      await this.monsterRepo.update(monsterId, {
        ability1: a1?.name ?? null,
        ability2: a2?.name ?? null,
      });

      return {
        ability1: a1 ? { name: a1.name, effect: a1.effect ?? 'No description available' } : null,
        ability2: a2 ? { name: a2.name, effect: a2.effect ?? 'No description available' } : null,
        hiddenAbility: null,
      };
    }

    const [a1Details, a2Details, hiddenDetails] = await Promise.all([
      this.abilityRepo.findByName(monster.ability1),
      monster.ability2 ? this.abilityRepo.findByName(monster.ability2) : null,
      null as Promise<Ability | null> | null, // hidden_ability not on MonsterRow; placeholder
    ]);

    return {
      ability1: {
        name: monster.ability1,
        effect: a1Details?.effect ?? 'No description available',
      },
      ability2: monster.ability2
        ? {
          name: monster.ability2,
          effect: a2Details?.effect ?? 'No description available',
        }
        : null,
      hiddenAbility: hiddenDetails
        ? { name: hiddenDetails.name, effect: hiddenDetails.effect ?? 'No description available' }
        : null,
    };
  }

  async useAbilityCapsule(monsterId: number, trainerId: number): Promise<AbilityCapsuleResult> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the specified trainer');
    }

    if (!monster.ability1 || !monster.ability2) {
      throw new Error('Monster must have both abilities to use an Ability Capsule');
    }

    // Check inventory for Ability Capsule
    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      throw new Error('Trainer inventory not found');
    }

    const capsuleCount = inventory.items['Ability Capsule'] ?? 0;
    if (capsuleCount < 1) {
      throw new Error('Trainer does not have an Ability Capsule');
    }

    // Swap abilities
    const temp = monster.ability1;
    await this.monsterRepo.update(monsterId, {
      ability1: monster.ability2,
      ability2: temp,
    });

    // Consume the item
    await this.inventoryRepo.removeItem(trainerId, 'items', 'Ability Capsule', 1);

    // After swap: ability1 = old ability2, ability2 = old ability1
    const newAbility1 = monster.ability2 as string;
    const newAbility2 = temp;

    // Get updated ability details
    const [a1Details, a2Details] = await Promise.all([
      this.abilityRepo.findByName(newAbility1),
      this.abilityRepo.findByName(newAbility2),
    ]);

    return {
      message: 'Ability Capsule used successfully. Abilities have been swapped.',
      abilities: {
        ability1: {
          name: newAbility1,
          effect: a1Details?.effect ?? 'No description available',
        },
        ability2: {
          name: temp,
          effect: a2Details?.effect ?? 'No description available',
        },
        hiddenAbility: null,
      },
    };
  }

  async useScrollOfSecrets(
    monsterId: number,
    trainerId: number,
    abilityName: string,
    abilitySlot: 'ability1' | 'ability2',
  ): Promise<ScrollOfSecretsResult> {
    const monster = await this.monsterRepo.findById(monsterId);
    if (!monster) {
      throw new Error('Monster not found');
    }

    if (monster.trainer_id !== trainerId) {
      throw new Error('This monster does not belong to the specified trainer');
    }

    // Verify ability exists
    const ability = await this.abilityRepo.findByName(abilityName);
    if (!ability) {
      throw new Error('Ability not found');
    }

    // Check inventory for Scroll of Secrets
    const inventory = await this.inventoryRepo.findByTrainerId(trainerId);
    if (!inventory) {
      throw new Error('Trainer inventory not found');
    }

    const scrollCount = inventory.items['Scroll of Secrets'] ?? 0;
    if (scrollCount < 1) {
      throw new Error('Trainer does not have a Scroll of Secrets');
    }

    // Set the ability
    await this.monsterRepo.update(monsterId, { [abilitySlot]: abilityName });

    // Consume the item
    await this.inventoryRepo.removeItem(trainerId, 'items', 'Scroll of Secrets', 1);

    // Get updated monster
    const updated = await this.monsterRepo.findById(monsterId);
    const [a1Details, a2Details] = await Promise.all([
      updated?.ability1 ? this.abilityRepo.findByName(updated.ability1) : null,
      updated?.ability2 ? this.abilityRepo.findByName(updated.ability2) : null,
    ]);

    const slotLabel = abilitySlot === 'ability1' ? 'Ability 1' : 'Ability 2';

    return {
      message: `Scroll of Secrets used successfully. ${slotLabel} has been set to ${abilityName}.`,
      abilities: {
        ability1: updated?.ability1
          ? { name: updated.ability1, effect: a1Details?.effect ?? 'No description available' }
          : null,
        ability2: updated?.ability2
          ? { name: updated.ability2, effect: a2Details?.effect ?? 'No description available' }
          : null,
        hiddenAbility: null,
      },
    };
  }

  async getAllAbilities(options: AbilityQueryOptions): Promise<PaginatedAbilities> {
    return this.abilityRepo.findAll(options);
  }
}
