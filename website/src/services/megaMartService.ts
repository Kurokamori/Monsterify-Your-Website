import api from './api';

// --- Types ---

export interface MonsterAbilities {
  ability1?: string;
  ability2?: string;
  [key: string]: unknown;
}

export type AbilitySlot = 'ability1' | 'ability2';

// --- Service ---

const megaMartService = {
  // Get abilities for a specific monster
  getMonsterAbilities: async (monsterId: number | string): Promise<MonsterAbilities> => {
    const response = await api.get(`/town/mega-mart/monster/${monsterId}/abilities`);
    return response.data;
  },

  // Get all available abilities
  getAllAbilities: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/town/mega-mart/abilities', { params });
    return response.data;
  },

  // Use an ability capsule on a monster (randomizes ability)
  useAbilityCapsule: async (monsterId: number, trainerId: number) => {
    const response = await api.post('/town/mega-mart/use-ability-capsule', {
      monsterId,
      trainerId,
    });
    return response.data;
  },

  // Use a scroll of secrets to set a specific ability
  useScrollOfSecrets: async (
    monsterId: number,
    trainerId: number,
    abilityName: string,
    abilitySlot: AbilitySlot,
  ) => {
    const response = await api.post('/town/mega-mart/use-scroll-of-secrets', {
      monsterId,
      trainerId,
      abilityName,
      abilitySlot,
    });
    return response.data;
  },
};

export default megaMartService;
