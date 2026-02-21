import {
  AbilityRepository,
  type Ability,
  type AbilityQueryOptions,
  type PaginatedAbilities,
} from '../repositories/ability.repository';

const abilityRepository = new AbilityRepository();

export class AbilityService {
  async getAll(options: AbilityQueryOptions): Promise<PaginatedAbilities> {
    return abilityRepository.findAll(options);
  }

  async getByName(name: string): Promise<Ability | null> {
    return abilityRepository.findByName(name);
  }

  async getAllTypes(): Promise<string[]> {
    return abilityRepository.getAllTypes();
  }

  async getAllNames(): Promise<string[]> {
    return abilityRepository.getAllNames();
  }
}
