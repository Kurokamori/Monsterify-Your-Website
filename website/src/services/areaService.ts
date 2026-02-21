import api from './api';

// --- Types ---

export interface Landmass {
  id: number | string;
  name: string;
  description?: string;
  image_url?: string;
  regions?: Region[];
  [key: string]: unknown;
}

export interface Region {
  id: number | string;
  name: string;
  landmass_id?: number | string;
  description?: string;
  image_url?: string;
  areas?: Area[];
  [key: string]: unknown;
}

export interface Area {
  id: number | string;
  name: string;
  region_id?: number | string;
  description?: string;
  image_url?: string;
  [key: string]: unknown;
}

export interface AreaConfiguration {
  area_id: number | string;
  encounter_table?: unknown[];
  terrain?: string;
  difficulty?: string;
  [key: string]: unknown;
}

export interface AreaHierarchy {
  landmasses: (Landmass & { regions: (Region & { areas: Area[] })[] })[];
  [key: string]: unknown;
}

// --- Guide Types ---

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WildlifeEntry {
  name: string;
  species: string;
  type: string;
  rarity: string;
  description: string;
}

export interface ResourceEntry {
  name: string;
  rarity: string;
  description: string;
}

export interface LandmassGuide {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  regions: string[];
  image: string;
  overworldImage: string;
  lore: string;
  mapCoordinates: Coordinates;
}

export interface RegionGuide {
  id: string;
  name: string;
  landmassId: string;
  landmassName: string;
  dominantTypes: string[];
  climate: string;
  elevation: string;
  wildlife: string;
  resources: string;
  lore: string;
  image: string;
  overworldImage: string;
  description: string;
  mapCoordinates: Coordinates;
  areas: RegionAreaSummary[];
}

export interface RegionAreaSummary {
  id: string;
  name: string;
  image: string;
  overworldImage: string;
  description: string;
  difficulty: string;
  specialFeatures: string[];
  mapCoordinates: Coordinates;
}

export interface AreaGuide {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  difficulty: string;
  specialFeatures: string[];
  image: string;
  overworldImage: string;
  description: string;
  elevation: string;
  temperature: string;
  weatherPatterns: string;
  accessibility: string;
  recommendedLevel: string;
  wildlife: WildlifeEntry[];
  resources: ResourceEntry[];
  lore: string;
  history: string;
  dangers: string[];
  tips: string[];
  mapCoordinates: Coordinates;
}

/** Summary of a region as seen within a landmass guide view */
export interface RegionGuideSummary {
  id: string;
  name: string;
  description: string;
  image: string;
  overworldImage: string;
  mapCoordinates: Coordinates;
}

export interface WorldMapData {
  landmasses: LandmassGuide[];
}

// --- Service ---

const areaService = {
  // Get all available landmasses
  getLandmasses: async (): Promise<Landmass[]> => {
    const response = await api.get('/areas/landmasses');
    return response.data;
  },

  // Get regions for a specific landmass
  getRegions: async (landmassId: number | string): Promise<Region[]> => {
    const response = await api.get(`/areas/landmasses/${landmassId}/regions`);
    return response.data;
  },

  // Get areas for a specific region
  getAreas: async (regionId: number | string): Promise<Area[]> => {
    const response = await api.get(`/areas/regions/${regionId}/areas`);
    return response.data;
  },

  // Get configuration for a specific area
  getAreaConfiguration: async (areaId: number | string): Promise<AreaConfiguration> => {
    const response = await api.get(`/areas/${areaId}/configuration`);
    return response.data;
  },

  // Get complete area hierarchy (landmasses -> regions -> areas)
  getAreaHierarchy: async (): Promise<AreaHierarchy> => {
    const response = await api.get('/areas/hierarchy');
    return response.data;
  },

  // Get world map data (all landmasses with coordinates)
  getWorldMapData: async (): Promise<WorldMapData> => {
    const response = await api.get('/areas/world-map');
    return response.data;
  },

  // Get landmass guide data
  getLandmassGuide: async (landmassId: string): Promise<LandmassGuide & { regionsData: RegionGuideSummary[] }> => {
    const response = await api.get(`/areas/landmasses/${landmassId}/guide`);
    return response.data;
  },

  // Get region guide data
  getRegionGuide: async (regionId: string): Promise<RegionGuide> => {
    const response = await api.get(`/areas/regions/${regionId}/guide`);
    return response.data;
  },

  // Get area guide data
  getAreaGuide: async (areaId: string): Promise<AreaGuide> => {
    const response = await api.get(`/areas/${areaId}/guide`);
    return response.data;
  },

  // ── Admin Methods ─────────────────────────────────────────────────

  adminGetLandmass: async (id: string) => {
    const response = await api.get(`/areas/admin/landmasses/${id}`);
    return response.data.data;
  },
  adminUpdateLandmass: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/areas/admin/landmasses/${id}`, data);
    return response.data.data;
  },
  adminCreateLandmass: async (data: Record<string, unknown>) => {
    const response = await api.post('/areas/admin/landmasses', data);
    return response.data.data;
  },
  adminDeleteLandmass: async (id: string) => {
    await api.delete(`/areas/admin/landmasses/${id}`);
  },

  adminGetRegion: async (id: string) => {
    const response = await api.get(`/areas/admin/regions/${id}`);
    return response.data.data;
  },
  adminUpdateRegion: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/areas/admin/regions/${id}`, data);
    return response.data.data;
  },
  adminCreateRegion: async (data: Record<string, unknown>) => {
    const response = await api.post('/areas/admin/regions', data);
    return response.data.data;
  },
  adminDeleteRegion: async (id: string) => {
    await api.delete(`/areas/admin/regions/${id}`);
  },

  adminGetArea: async (id: string) => {
    const response = await api.get(`/areas/admin/areas/${id}`);
    return response.data.data;
  },
  adminUpdateArea: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/areas/admin/areas/${id}`, data);
    return response.data.data;
  },
  adminCreateArea: async (data: Record<string, unknown>) => {
    const response = await api.post('/areas/admin/areas', data);
    return response.data.data;
  },
  adminDeleteArea: async (id: string) => {
    await api.delete(`/areas/admin/areas/${id}`);
  },

  adminUpdateCoordinates: async (type: string, id: string, coords: Coordinates) => {
    const response = await api.patch(`/areas/admin/coordinates/${type}/${id}`, coords);
    return response.data;
  },
};

export default areaService;
