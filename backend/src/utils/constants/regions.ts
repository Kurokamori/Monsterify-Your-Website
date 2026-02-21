/**
 * Region and Landmass Constants
 * Defines all game regions, landmasses, and their properties
 */

import { MonsterTypeValue } from './monster-types';
import { WeatherValue, TerrainValue } from './weather-terrain';

// Landmass definitions (major geographical areas)
export const Landmass = {
  CONOCO_ISLAND: 'conoco-island',
  CONOOCOO_ARCHIPELAGO: 'conoocoo-archipelago',
  SKY_ISLES: 'sky-isles',
} as const;

export type LandmassKey = keyof typeof Landmass;
export type LandmassValue = (typeof Landmass)[LandmassKey];

export const LANDMASSES: LandmassValue[] = Object.values(Landmass);

/**
 * Landmass display names
 */
export const LANDMASS_DISPLAY_NAMES: Record<LandmassValue, string> = {
  [Landmass.CONOCO_ISLAND]: 'Conoco Island',
  [Landmass.CONOOCOO_ARCHIPELAGO]: 'Conoocoo Archipelago',
  [Landmass.SKY_ISLES]: 'Sky Isles',
};

// Region definitions
export const Region = {
  // Conoco Island regions
  HEARTHFALL_COMMONS: 'hearthfall-commons',
  AGNI_PEAKS: 'agni-peaks',
  POSEIDONS_REACH: 'poseidons-reach',
  JOTUN_TUNDRA: 'jotun-tundra',
  ANANSI_WOODS: 'anansi-woods',
  CROWSFOOT_MARSH: 'crowsfoot-marsh',
  MICTLAN_HOLLOWS: 'mictlan-hollows',
  THUNDERHEAD_PLATEAU: 'thunderhead-plateau',
  JADE_GARDENS: 'jade-gardens',
  RUST_WASTES: 'rust-wastes',
  MYSTIC_GROVES: 'mystic-groves',
  SHADOW_VALE: 'shadow-vale',
  CRYSTAL_CAVERNS: 'crystal-caverns',
  STORM_PEAKS: 'storm-peaks',

  // Conoocoo Archipelago regions
  PRIMORDIAL_JUNGLE: 'primordial-jungle',
  CORAL_REEFS: 'coral-reefs',
  VOLCANIC_ISLANDS: 'volcanic-islands',
  TRADING_PORTS: 'trading-ports',
  ANCIENT_RUINS: 'ancient-ruins',

  // Sky Isles regions
  FLOATING_GARDENS: 'floating-gardens',
  CLOUD_CITADEL: 'cloud-citadel',
  WIND_TEMPLE: 'wind-temple',
  STARFALL_OBSERVATORY: 'starfall-observatory',
  AURORA_PEAKS: 'aurora-peaks',
} as const;

export type RegionKey = keyof typeof Region;
export type RegionValue = (typeof Region)[RegionKey];

export const REGIONS: RegionValue[] = Object.values(Region);

/**
 * Region display names
 */
export const REGION_DISPLAY_NAMES: Record<RegionValue, string> = {
  [Region.HEARTHFALL_COMMONS]: 'Hearthfall Commons',
  [Region.AGNI_PEAKS]: 'Agni Peaks',
  [Region.POSEIDONS_REACH]: "Poseidon's Reach",
  [Region.JOTUN_TUNDRA]: 'Jötun Tundra',
  [Region.ANANSI_WOODS]: 'Anansi Woods',
  [Region.CROWSFOOT_MARSH]: 'Crowsfoot Marsh',
  [Region.MICTLAN_HOLLOWS]: 'Mictlan Hollows',
  [Region.THUNDERHEAD_PLATEAU]: 'Thunderhead Plateau',
  [Region.JADE_GARDENS]: 'Jade Gardens',
  [Region.RUST_WASTES]: 'Rust Wastes',
  [Region.MYSTIC_GROVES]: 'Mystic Groves',
  [Region.SHADOW_VALE]: 'Shadow Vale',
  [Region.CRYSTAL_CAVERNS]: 'Crystal Caverns',
  [Region.STORM_PEAKS]: 'Storm Peaks',
  [Region.PRIMORDIAL_JUNGLE]: 'Primordial Jungle',
  [Region.CORAL_REEFS]: 'Coral Reefs',
  [Region.VOLCANIC_ISLANDS]: 'Volcanic Islands',
  [Region.TRADING_PORTS]: 'Trading Ports',
  [Region.ANCIENT_RUINS]: 'Ancient Ruins',
  [Region.FLOATING_GARDENS]: 'Floating Gardens',
  [Region.CLOUD_CITADEL]: 'Cloud Citadel',
  [Region.WIND_TEMPLE]: 'Wind Temple',
  [Region.STARFALL_OBSERVATORY]: 'Starfall Observatory',
  [Region.AURORA_PEAKS]: 'Aurora Peaks',
};

/**
 * Region definition with metadata
 */
export interface RegionDefinition {
  name: string;
  landmass: LandmassValue;
  preferredTypes: MonsterTypeValue[];
  levelRange: { min: number; max: number };
  defaultWeather: WeatherValue;
  defaultTerrain: TerrainValue;
  description: string;
}

/**
 * Map regions to their landmass
 */
export const REGION_TO_LANDMASS: Record<RegionValue, LandmassValue> = {
  // Conoco Island
  [Region.HEARTHFALL_COMMONS]: Landmass.CONOCO_ISLAND,
  [Region.AGNI_PEAKS]: Landmass.CONOCO_ISLAND,
  [Region.POSEIDONS_REACH]: Landmass.CONOCO_ISLAND,
  [Region.JOTUN_TUNDRA]: Landmass.CONOCO_ISLAND,
  [Region.ANANSI_WOODS]: Landmass.CONOCO_ISLAND,
  [Region.CROWSFOOT_MARSH]: Landmass.CONOCO_ISLAND,
  [Region.MICTLAN_HOLLOWS]: Landmass.CONOCO_ISLAND,
  [Region.THUNDERHEAD_PLATEAU]: Landmass.CONOCO_ISLAND,
  [Region.JADE_GARDENS]: Landmass.CONOCO_ISLAND,
  [Region.RUST_WASTES]: Landmass.CONOCO_ISLAND,
  [Region.MYSTIC_GROVES]: Landmass.CONOCO_ISLAND,
  [Region.SHADOW_VALE]: Landmass.CONOCO_ISLAND,
  [Region.CRYSTAL_CAVERNS]: Landmass.CONOCO_ISLAND,
  [Region.STORM_PEAKS]: Landmass.CONOCO_ISLAND,

  // Conoocoo Archipelago
  [Region.PRIMORDIAL_JUNGLE]: Landmass.CONOOCOO_ARCHIPELAGO,
  [Region.CORAL_REEFS]: Landmass.CONOOCOO_ARCHIPELAGO,
  [Region.VOLCANIC_ISLANDS]: Landmass.CONOOCOO_ARCHIPELAGO,
  [Region.TRADING_PORTS]: Landmass.CONOOCOO_ARCHIPELAGO,
  [Region.ANCIENT_RUINS]: Landmass.CONOOCOO_ARCHIPELAGO,

  // Sky Isles
  [Region.FLOATING_GARDENS]: Landmass.SKY_ISLES,
  [Region.CLOUD_CITADEL]: Landmass.SKY_ISLES,
  [Region.WIND_TEMPLE]: Landmass.SKY_ISLES,
  [Region.STARFALL_OBSERVATORY]: Landmass.SKY_ISLES,
  [Region.AURORA_PEAKS]: Landmass.SKY_ISLES,
};

/**
 * Get all regions in a landmass
 * @param landmass - The landmass to filter by
 * @returns Array of region values
 */
export function getRegionsInLandmass(landmass: LandmassValue): RegionValue[] {
  return REGIONS.filter((region) => REGION_TO_LANDMASS[region] === landmass);
}

/**
 * Check if a region value is valid
 * @param region - The region to check
 * @returns True if valid
 */
export function isValidRegion(region: string): region is RegionValue {
  return REGIONS.includes(region as RegionValue);
}

/**
 * Check if a landmass value is valid
 * @param landmass - The landmass to check
 * @returns True if valid
 */
export function isValidLandmass(landmass: string): landmass is LandmassValue {
  return LANDMASSES.includes(landmass as LandmassValue);
}

/**
 * Get the display name for a region
 * @param region - The region value
 * @returns The display name
 */
export function getRegionDisplayName(region: RegionValue): string {
  return REGION_DISPLAY_NAMES[region] || region;
}

/**
 * Get the display name for a landmass
 * @param landmass - The landmass value
 * @returns The display name
 */
export function getLandmassDisplayName(landmass: LandmassValue): string {
  return LANDMASS_DISPLAY_NAMES[landmass] || landmass;
}

/**
 * Get the landmass for a region
 * @param region - The region value
 * @returns The landmass value
 */
export function getRegionLandmass(region: RegionValue): LandmassValue {
  return REGION_TO_LANDMASS[region];
}
