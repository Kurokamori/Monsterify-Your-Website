import api from './api';

export interface EvolutionCacheVersion {
  version: number;
  updatedAt: string;
}

const evolutionService = {
  /**
   * Returns every franchise/table a species name appears in. More than one
   * result means the name is ambiguous (e.g. nexomon "Grimmon" vs digimon
   * "Grimmon") and the user must pick which one to explore.
   */
  getSpeciesTables: async (speciesName: string): Promise<string[]> => {
    if (!speciesName || speciesName.trim() === '') return [];
    const response = await api.get(`/evolution/tables/${encodeURIComponent(speciesName.trim())}`);
    return response.data.success ? (response.data.data as string[]) : [];
  },

  /** Reads the server-side Evolution Explorer cache version. */
  getCacheVersion: async (): Promise<EvolutionCacheVersion | null> => {
    try {
      const response = await api.get('/evolution/cache-version');
      return response.data.success ? (response.data.data as EvolutionCacheVersion) : null;
    } catch {
      return null;
    }
  },

  /** Admin: bumps the cache version, invalidating every user's cached data. */
  bumpCacheVersion: async (): Promise<EvolutionCacheVersion> => {
    const response = await api.post('/evolution/cache-version/bump');
    return response.data.data as EvolutionCacheVersion;
  },
};

export default evolutionService;
