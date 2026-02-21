import api from './api';

// --- Types ---

export interface TradeItems {
  [category: string]: {
    [itemName: string]: number;
  };
}

export interface TradeData {
  fromTrainerId: number;
  toTrainerId: number;
  fromItems?: TradeItems;
  toItems?: TradeItems;
  fromMonsters?: number[];
  toMonsters?: number[];
}

export interface TradeResult {
  success: boolean;
  message?: string;
}

export interface TradeTrainer {
  id: number;
  name: string;
  level?: number;
  playerUserId?: string;
}

export interface TradeMonster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  trainer_id?: number;
}

export interface TradeInventoryItem {
  name: string;
  quantity: number;
  category: string;
  imageUrl?: string | null;
  description?: string | null;
  rarity?: string | null;
  type?: string | null;
  effect?: string | null;
  basePrice?: number;
}

export interface TradeInventory {
  [category: string]: {
    [itemName: string]: TradeInventoryItem;
  };
}

// --- Service ---

const tradeService = {
  executeTrade: async (tradeData: TradeData): Promise<TradeResult> => {
    const response = await api.post('/town/trade/execute', tradeData);
    return response.data;
  },

  getAvailableTrainers: async (): Promise<TradeTrainer[]> => {
    const response = await api.get('/town/trade/trainers');
    return response.data.trainers ?? [];
  },

  getTrainerMonsters: async (trainerId: number | string): Promise<TradeMonster[]> => {
    const response = await api.get(`/town/trade/trainers/${trainerId}/monsters`);
    return response.data.monsters ?? [];
  },

  getTrainerInventory: async (trainerId: number | string): Promise<TradeInventory> => {
    const response = await api.get(`/town/trade/trainers/${trainerId}/inventory`);
    return response.data.inventory ?? {};
  },
};

export default tradeService;
