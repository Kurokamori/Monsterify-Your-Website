import api from './api';

// ── Types ───────────────────────────────────────────────────────

export interface ChangelogVersion {
  id: number;
  version: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogVersionCreateInput {
  version: string;
  title: string;
  content?: string;
  isPublished?: boolean;
}

export interface ChangelogVersionUpdateInput {
  version?: string;
  title?: string;
  content?: string;
  isPublished?: boolean;
}

// ── Service ─────────────────────────────────────────────────────

const changelogService = {
  // Public
  async getPublished(): Promise<ChangelogVersion[]> {
    const res = await api.get('/changelog/published');
    return res.data.data;
  },

  async getLatest(): Promise<ChangelogVersion | null> {
    const res = await api.get('/changelog/latest');
    return res.data.data;
  },

  /** Returns all published versions newer than `lastSeenVersion` (newest first). */
  async getUnseenSince(lastSeenVersion: string | null): Promise<ChangelogVersion[]> {
    const all: ChangelogVersion[] = await this.getPublished();
    if (!lastSeenVersion) return all;
    const idx = all.findIndex((v) => v.version === lastSeenVersion);
    // If the last-seen version isn't found, show everything
    if (idx === -1) return all;
    return all.slice(0, idx);
  },

  // Admin
  async getAll(): Promise<ChangelogVersion[]> {
    const res = await api.get('/changelog');
    return res.data.data;
  },

  async getById(id: number): Promise<ChangelogVersion> {
    const res = await api.get(`/changelog/${id}`);
    return res.data.data;
  },

  async create(input: ChangelogVersionCreateInput): Promise<ChangelogVersion> {
    const res = await api.post('/changelog', input);
    return res.data.data;
  },

  async update(id: number, input: ChangelogVersionUpdateInput): Promise<ChangelogVersion> {
    const res = await api.put(`/changelog/${id}`, input);
    return res.data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/changelog/${id}`);
  },
};

export default changelogService;
