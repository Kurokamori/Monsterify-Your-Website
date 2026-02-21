import api from './api';

// --- Types ---

export interface BazarMonster {
  id: number;
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  [key: string]: unknown;
}

export interface BazarItem {
  id: number;
  name: string;
  category?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface ForfeitMonsterParams {
  monsterId: number;
  trainerId: number;
}

export interface ForfeitItemParams {
  trainerId: number;
  category: string;
  itemName: string;
  quantity: number;
}

// --- Service ---

const bazarService = {
  // Get available monsters in the bazar
  getAvailableMonsters: async () => {
    const response = await api.get('/town/bazar/monsters');
    return response.data;
  },

  // Get available items in the bazar
  getAvailableItems: async () => {
    const response = await api.get('/town/bazar/items');
    return response.data;
  },

  // Forfeit a single monster
  forfeitMonster: async (monsterId: number, trainerId: number) => {
    const response = await api.post('/town/bazar/forfeit/monster', { monsterId, trainerId });
    return response.data;
  },

  // Forfeit multiple monsters
  forfeitMonsters: async (monsters: ForfeitMonsterParams[]) => {
    const response = await api.post('/town/bazar/forfeit/monsters', { monsters });
    return response.data;
  },

  // Forfeit an item
  forfeitItem: async (params: ForfeitItemParams) => {
    const response = await api.post('/town/bazar/forfeit/item', params);
    return response.data;
  },

  // Adopt a monster from the bazar
  adoptMonster: async (bazarMonsterId: number, trainerId: number, newName: string) => {
    const response = await api.post('/town/bazar/adopt/monster', {
      bazarMonsterId,
      trainerId,
      newName,
    });
    return response.data;
  },

  // Collect an item from the bazar
  collectItem: async (bazarItemId: number, trainerId: number, quantity: number) => {
    const response = await api.post('/town/bazar/collect/item', {
      bazarItemId,
      trainerId,
      quantity,
    });
    return response.data;
  },

  // Get the current user's trainers (bazar context)
  getUserTrainers: async () => {
    const response = await api.get('/town/bazar/user/trainers');
    return response.data;
  },

  // Get a trainer's monsters (bazar context)
  getTrainerMonsters: async (trainerId: number | string) => {
    const response = await api.get(`/town/bazar/trainer/${trainerId}/monsters`);
    return response.data;
  },

  // Get a trainer's inventory (bazar context)
  getTrainerInventory: async (trainerId: number | string) => {
    const response = await api.get(`/town/bazar/trainer/${trainerId}/inventory`);
    return response.data;
  },
};

export default bazarService;
