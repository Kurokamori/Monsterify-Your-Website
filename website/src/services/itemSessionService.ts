import api from './api';

export type ItemUseSessionType = 'apothecary' | 'adoption_item' | 'mass_edit';

export interface ItemUseSession {
  id: number;
  userId: string;
  sessionType: string;
  sessionData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const itemSessionService = {
  get: async (sessionType: ItemUseSessionType): Promise<ItemUseSession | null> => {
    try {
      const response = await api.get(`/item-sessions/${sessionType}`);
      return response.data.session ?? null;
    } catch {
      return null;
    }
  },

  save: async (sessionType: ItemUseSessionType, sessionData: Record<string, unknown>): Promise<void> => {
    await api.post('/item-sessions', { sessionType, sessionData });
  },

  delete: async (sessionType: ItemUseSessionType): Promise<void> => {
    try {
      await api.delete(`/item-sessions/${sessionType}`);
    } catch {
      // Silently ignore - session may already be deleted
    }
  },
};

export default itemSessionService;
