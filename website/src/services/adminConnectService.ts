import api from './api';

// ── Types ───────────────────────────────────────────────────────

export type AdminConnectCategory =
  | 'art'
  | 'content'
  | 'guides'
  | 'gameplay'
  | 'features'
  | 'bug-fixes'
  | 'styling'
  | 'misc';

export type AdminConnectStatus = 'open' | 'in-progress' | 'resolved';
export type AdminConnectUrgency = 'low' | 'normal' | 'high' | 'critical';
export type AdminConnectDifficulty = 'trivial' | 'normal' | 'complex' | 'extra';

export interface AdminConnectDataField {
  key: string;
  value: string;
}

export interface AdminConnectSubItem {
  id: number;
  itemId: number;
  name: string;
  description: string | null;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminConnectItem {
  id: number;
  name: string;
  description: string | null;
  secretName: string | null;
  isSecret: boolean;
  category: AdminConnectCategory;
  status: AdminConnectStatus;
  urgency: AdminConnectUrgency;
  difficulty: AdminConnectDifficulty;
  progress: number;
  priority: number;
  dataFields: AdminConnectDataField[];
  createdBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subItems: AdminConnectSubItem[];
}

export interface AdminConnectItemCreateInput {
  name: string;
  description?: string;
  secretName?: string;
  isSecret?: boolean;
  category?: AdminConnectCategory;
  status?: AdminConnectStatus;
  urgency?: AdminConnectUrgency;
  difficulty?: AdminConnectDifficulty;
  progress?: number;
  priority?: number;
  dataFields?: AdminConnectDataField[];
}

export interface AdminConnectItemUpdateInput {
  name?: string;
  description?: string | null;
  secretName?: string | null;
  isSecret?: boolean;
  category?: AdminConnectCategory;
  status?: AdminConnectStatus;
  urgency?: AdminConnectUrgency;
  difficulty?: AdminConnectDifficulty;
  progress?: number;
  priority?: number;
  dataFields?: AdminConnectDataField[];
}

// ── Service ─────────────────────────────────────────────────────

const adminConnectService = {
  async getAll(): Promise<AdminConnectItem[]> {
    const res = await api.get('/admin-connect');
    return res.data.data;
  },

  async getById(id: number): Promise<AdminConnectItem> {
    const res = await api.get(`/admin-connect/${id}`);
    return res.data.data;
  },

  async create(input: AdminConnectItemCreateInput): Promise<AdminConnectItem> {
    const res = await api.post('/admin-connect', input);
    return res.data.data;
  },

  async update(id: number, input: AdminConnectItemUpdateInput): Promise<AdminConnectItem> {
    const res = await api.put(`/admin-connect/${id}`, input);
    return res.data.data;
  },

  async resolve(id: number): Promise<AdminConnectItem> {
    const res = await api.put(`/admin-connect/${id}/resolve`);
    return res.data.data;
  },

  async reopen(id: number): Promise<AdminConnectItem> {
    const res = await api.put(`/admin-connect/${id}/reopen`);
    return res.data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin-connect/${id}`);
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await api.put('/admin-connect/reorder', { orderedIds });
  },

  // Sub-items
  async createSubItem(itemId: number, input: { name: string; description?: string; sortOrder?: number }): Promise<AdminConnectSubItem> {
    const res = await api.post(`/admin-connect/${itemId}/sub-items`, input);
    return res.data.data;
  },

  async updateSubItem(itemId: number, subId: number, input: { name?: string; description?: string | null; isCompleted?: boolean; sortOrder?: number }): Promise<AdminConnectSubItem> {
    const res = await api.put(`/admin-connect/${itemId}/sub-items/${subId}`, input);
    return res.data.data;
  },

  async removeSubItem(itemId: number, subId: number): Promise<void> {
    await api.delete(`/admin-connect/${itemId}/sub-items/${subId}`);
  },
};

export default adminConnectService;
