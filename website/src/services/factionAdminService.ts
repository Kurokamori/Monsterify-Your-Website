import api from './api';

// --- Gift Item Definition Types ---

export type GiftItemSpecific = {
  type: 'specific';
  items: { name: string; quantity: number }[];
};

export type GiftItemRandomSubset = {
  type: 'random_subset';
  items: string[];
  quantity: number;
};

export type GiftItemRandomCategory = {
  type: 'random_category';
  category: string;
  quantity: number;
};

export type GiftItemDefinition = GiftItemSpecific | GiftItemRandomSubset | GiftItemRandomCategory;

// --- Types ---

export interface FactionRow {
  id: number;
  name: string;
  description: string | null;
  banner_image: string | null;
  icon_image: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactionTitleRow {
  id: number;
  faction_id: number;
  name: string;
  standing_requirement: number;
  is_positive: boolean;
  created_at: string;
}

export interface FactionRelationshipRow {
  id: number;
  faction_id: number;
  related_faction_id: number;
  relationship_type: string;
  standing_modifier: number;
  related_faction_name?: string;
  created_at: string;
}

export interface FactionStoreItemRow {
  id: number;
  faction_id: number;
  item_name: string;
  price: number;
  standing_requirement: number;
  is_active: boolean;
  item_category: string | null;
  title_id: number | null;
  title_name?: string | null;
  created_at: string;
}

export interface FactionPromptRow {
  id: number;
  factionId: number;
  name: string;
  description: string | null;
  modifier: number;
  isActive: boolean;
  submissionGiftItems: GiftItemDefinition[] | null;
  factionName: string | null;
  factionColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FactionStandingRow {
  id: number;
  trainer_id: number;
  faction_id: number;
  standing: number;
  faction_name: string;
  created_at: string;
  updated_at: string;
}

// --- Service ---

const factionAdminService = {
  // ── Core Faction ──────────────────────────────────────────────────

  getAllFactions: async (): Promise<FactionRow[]> => {
    const response = await api.get('/factions/');
    return response.data.data || [];
  },

  updateFaction: async (factionId: number, data: {
    name?: string;
    description?: string | null;
    bannerImage?: string | null;
    iconImage?: string | null;
    color?: string | null;
  }): Promise<FactionRow> => {
    const response = await api.put(`/factions/admin/factions/${factionId}`, data);
    return response.data.data;
  },

  bulkUpdateProperty: async (property: string, updates: { id: number; value: string | null }[]): Promise<FactionRow[]> => {
    const response = await api.put('/factions/admin/factions/bulk-property', { property, updates });
    return response.data.data || [];
  },

  // ── Titles ────────────────────────────────────────────────────────

  getTitles: async (factionId: number): Promise<FactionTitleRow[]> => {
    const response = await api.get(`/factions/admin/factions/${factionId}/titles`);
    return response.data.data || [];
  },

  createTitle: async (data: {
    factionId: number;
    titleName: string;
    standingRequirement: number;
    isPositive: boolean;
  }): Promise<FactionTitleRow> => {
    const response = await api.post('/factions/admin/titles', data);
    return response.data.data;
  },

  updateTitle: async (titleId: number, data: {
    titleName?: string;
    standingRequirement?: number;
    isPositive?: boolean;
  }): Promise<FactionTitleRow> => {
    const response = await api.put(`/factions/admin/titles/${titleId}`, data);
    return response.data.data;
  },

  deleteTitle: async (titleId: number): Promise<void> => {
    await api.delete(`/factions/admin/titles/${titleId}`);
  },

  // ── Relationships ─────────────────────────────────────────────────

  getRelationships: async (factionId: number): Promise<FactionRelationshipRow[]> => {
    const response = await api.get(`/factions/admin/factions/${factionId}/relationships`);
    return response.data.data || [];
  },

  createRelationship: async (data: {
    factionId: number;
    relatedFactionId: number;
    relationshipType: string;
    standingModifier: number;
  }): Promise<FactionRelationshipRow> => {
    const response = await api.post('/factions/admin/relationships', data);
    return response.data.data;
  },

  updateRelationship: async (relationshipId: number, data: {
    relatedFactionId?: number;
    relationshipType?: string;
    standingModifier?: number;
  }): Promise<FactionRelationshipRow> => {
    const response = await api.put(`/factions/admin/relationships/${relationshipId}`, data);
    return response.data.data;
  },

  deleteRelationship: async (relationshipId: number): Promise<void> => {
    await api.delete(`/factions/admin/relationships/${relationshipId}`);
  },

  // ── Store Items ───────────────────────────────────────────────────

  getStoreItems: async (factionId: number): Promise<FactionStoreItemRow[]> => {
    const response = await api.get(`/factions/admin/factions/${factionId}/store-items`);
    return response.data.data || [];
  },

  createStoreItem: async (data: {
    factionId: number;
    itemName: string;
    price: number;
    standingRequirement?: number;
    isActive?: boolean;
    itemCategory?: string | null;
    titleId?: number | null;
  }): Promise<FactionStoreItemRow> => {
    const response = await api.post('/factions/admin/store-items', data);
    return response.data.data;
  },

  updateStoreItem: async (itemId: number, data: {
    itemName?: string;
    price?: number;
    standingRequirement?: number;
    isActive?: boolean;
    itemCategory?: string | null;
    titleId?: number | null;
  }): Promise<FactionStoreItemRow> => {
    const response = await api.put(`/factions/admin/store-items/${itemId}`, data);
    return response.data.data;
  },

  deleteStoreItem: async (itemId: number): Promise<void> => {
    await api.delete(`/factions/admin/store-items/${itemId}`);
  },

  // ── Prompts ───────────────────────────────────────────────────────

  getAllPrompts: async (): Promise<FactionPromptRow[]> => {
    const response = await api.get('/factions/admin/prompts/all');
    return response.data.data || [];
  },

  getPromptsByFaction: async (factionId: number): Promise<FactionPromptRow[]> => {
    const response = await api.get(`/factions/admin/factions/${factionId}/prompts`);
    return response.data.data || [];
  },

  createPrompt: async (data: {
    factionId: number;
    name: string;
    description?: string | null;
    modifier?: number;
    isActive?: boolean;
    submissionGiftItems?: GiftItemDefinition[] | null;
  }): Promise<FactionPromptRow> => {
    const response = await api.post(`/factions/${data.factionId}/prompts`, data);
    return response.data.data;
  },

  updatePrompt: async (promptId: number, data: {
    name?: string;
    description?: string | null;
    modifier?: number;
    isActive?: boolean;
    submissionGiftItems?: GiftItemDefinition[] | null;
  }): Promise<FactionPromptRow> => {
    const response = await api.put(`/factions/prompts/${promptId}`, data);
    return response.data.data;
  },

  deletePrompt: async (promptId: number): Promise<void> => {
    await api.delete(`/factions/admin/prompts/${promptId}`);
  },

  // ── Standings (uses existing endpoints) ───────────────────────────

  getTrainerStandings: async (trainerId: number): Promise<FactionStandingRow[]> => {
    const response = await api.get(`/factions/trainers/${trainerId}/standings`);
    return response.data.data || [];
  },

  updateTrainerStanding: async (trainerId: number, factionId: number, standingChange: number, reason?: string): Promise<unknown> => {
    const response = await api.post(`/factions/trainers/${trainerId}/${factionId}/standing`, { standingChange, reason });
    return response.data.data;
  },
};

export default factionAdminService;
