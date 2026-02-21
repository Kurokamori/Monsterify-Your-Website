/**
 * Area service — fetches landmass, region, and area data from the backend API.
 *
 * Used by the adventure start wizard to let users browse and select locations.
 */

import { get, type BaseResponse } from './api-client.js';

// ============================================================================
// Raw response shapes
// ============================================================================

interface LandmassesResponse extends BaseResponse {
  landmasses?: RawLandmass[];
}

interface RegionsResponse extends BaseResponse {
  regions?: RawRegion[];
}

interface AreasResponse extends BaseResponse {
  areas?: RawArea[];
}

interface ConfigurationResponse extends BaseResponse {
  configuration?: RawAreaConfiguration;
}

// ============================================================================
// Raw backend types
// ============================================================================

interface RawLandmass {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  regions: string[];
  images?: { guide?: string; overworld?: string };
  lore: string;
}

interface RawRegion {
  id: string;
  name: string;
  landmassId: string;
  dominantTypes: string[];
  climate: string;
  areas: string[];
  images?: { guide?: string; overworld?: string };
  description: string;
  lore: string;
}

interface RawArea {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  difficulty?: string;
  description?: string;
  image: string;
  overworldImage: string;
  itemRequirements?: { needsMissionMandate?: boolean; itemRequired?: string };
}

interface RawAreaConfiguration {
  areaId: string;
  areaName: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  itemRequirements?: { needsMissionMandate?: boolean; itemRequired?: string };
  difficulty?: string;
  welcomeMessages?: { base: string; variations: string[] };
  [key: string]: unknown;
}

// ============================================================================
// Public types
// ============================================================================

export interface Landmass {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  regions: string[];
  images?: { guide?: string; overworld?: string };
}

export interface Region {
  id: string;
  name: string;
  landmassId: string;
  dominantTypes: string[];
  climate: string;
  areas: string[];
  images?: { guide?: string; overworld?: string };
  description: string;
  lore: string;
}

export interface Area {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  difficulty?: string;
  description?: string;
  image: string;
  overworldImage: string;
  itemRequirements?: { needsMissionMandate?: boolean; itemRequired?: string };
}

export interface AreaConfiguration {
  areaId: string;
  areaName: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  itemRequirements?: { needsMissionMandate?: boolean; itemRequired?: string };
  difficulty?: string;
  welcomeMessages?: { base: string; variations: string[] };
}

// ============================================================================
// Mappers
// ============================================================================

function mapLandmass(raw: RawLandmass): Landmass {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    climate: raw.climate,
    dominantTypes: raw.dominantTypes,
    regions: raw.regions,
    images: raw.images,
  };
}

function mapRegion(raw: RawRegion): Region {
  return {
    id: raw.id,
    name: raw.name,
    landmassId: raw.landmassId,
    dominantTypes: raw.dominantTypes,
    climate: raw.climate,
    areas: raw.areas,
    images: raw.images,
    description: raw.description,
    lore: raw.lore,
  };
}

function mapArea(raw: RawArea): Area {
  return {
    id: raw.id,
    name: raw.name,
    regionId: raw.regionId,
    regionName: raw.regionName,
    landmassId: raw.landmassId,
    landmassName: raw.landmassName,
    difficulty: raw.difficulty,
    description: raw.description,
    image: raw.image,
    overworldImage: raw.overworldImage,
    itemRequirements: raw.itemRequirements,
  };
}

function mapConfiguration(raw: RawAreaConfiguration): AreaConfiguration {
  return {
    areaId: raw.areaId,
    areaName: raw.areaName,
    regionId: raw.regionId,
    regionName: raw.regionName,
    landmassId: raw.landmassId,
    landmassName: raw.landmassName,
    itemRequirements: raw.itemRequirements,
    difficulty: raw.difficulty,
    welcomeMessages: raw.welcomeMessages,
  };
}

// ============================================================================
// API methods
// ============================================================================

/** Fetch all landmasses. */
export async function getLandmasses(): Promise<Landmass[]> {
  const res = await get<LandmassesResponse>('/areas/landmasses');
  return (res.landmasses ?? []).map(mapLandmass);
}

/** Fetch regions for a specific landmass. */
export async function getRegionsForLandmass(landmassId: string): Promise<Region[]> {
  const res = await get<RegionsResponse>(`/areas/landmasses/${landmassId}/regions`);
  return (res.regions ?? []).map(mapRegion);
}

/** Fetch areas for a specific region. */
export async function getAreasForRegion(regionId: string): Promise<Area[]> {
  const res = await get<AreasResponse>(`/areas/regions/${regionId}/areas`);
  return (res.areas ?? []).map(mapArea);
}

/** Fetch the full configuration for an area. */
export async function getAreaConfiguration(areaId: string): Promise<AreaConfiguration | null> {
  try {
    const res = await get<ConfigurationResponse>(`/areas/${areaId}/configuration`);
    if (!res.success || !res.configuration) { return null; }
    return mapConfiguration(res.configuration);
  } catch {
    return null;
  }
}
