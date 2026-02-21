import api from './api';

// --- Faction Types ---

export interface FactionMember {
  name: string;
  role: string;
  image_url: string;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  leader: string;
  headquarters: string;
  alignment: string;
  image_url: string;
  banner_url: string;
  color: string;
  history: string;
  goals: string[];
  notable_members: FactionMember[];
}

// --- Lore Types ---

export interface LoreCategory {
  id: string;
  name: string;
}

export interface LoreEntry {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
}

// --- NPC Types ---

export interface NPCReward {
  type: string;
  name: string;
  description: string;
}

export interface NPC {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  image_url: string;
  faction: string;
  specialization: string;
  quests: string[];
  bio: string;
  dialogue: string[];
  rewards: NPCReward[];
}

export interface NPCCategory {
  id: string;
  name: string;
}

// --- Service ---

const worldLoreService = {
  // Factions
  getFactions: async (): Promise<Faction[]> => {
    const response = await api.get('/factions');
    return response.data.factions || [];
  },

  // Lore
  getLoreEntries: async (): Promise<LoreEntry[]> => {
    const response = await api.get('/lore');
    return response.data.entries || [];
  },

  getLoreCategories: async (): Promise<LoreCategory[]> => {
    const response = await api.get('/lore/categories');
    return response.data.categories || [];
  },

  // NPCs
  getNPCs: async (): Promise<NPC[]> => {
    const response = await api.get('/npcs');
    return response.data.npcs || [];
  },

  getNPCCategories: async (): Promise<NPCCategory[]> => {
    const response = await api.get('/npcs/categories');
    return response.data.categories || [];
  },
};

export default worldLoreService;
