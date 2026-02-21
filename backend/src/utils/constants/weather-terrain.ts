/**
 * Weather and Terrain Constants
 * Defines all weather conditions and terrain types with their type modifiers
 */

import { MonsterTypeValue, MonsterType } from './monster-types';

// Weather condition definitions
export const Weather = {
  CLEAR: 'clear',
  RAIN: 'rain',
  SUNNY: 'sunny',
  SNOW: 'snow',
  SANDSTORM: 'sandstorm',
  HAIL: 'hail',
  FOG: 'fog',
  THUNDERSTORM: 'thunderstorm',
  WIND: 'wind',
} as const;

export type WeatherKey = keyof typeof Weather;
export type WeatherValue = (typeof Weather)[WeatherKey];

export const WEATHER_CONDITIONS: WeatherValue[] = Object.values(Weather);

// Terrain type definitions
export const Terrain = {
  NORMAL: 'normal',
  ELECTRIC: 'electric',
  GRASSY: 'grassy',
  MISTY: 'misty',
  PSYCHIC: 'psychic',
} as const;

export type TerrainKey = keyof typeof Terrain;
export type TerrainValue = (typeof Terrain)[TerrainKey];

export const TERRAIN_TYPES: TerrainValue[] = Object.values(Terrain);

/**
 * Weather display names
 */
export const WEATHER_DISPLAY_NAMES: Record<WeatherValue, string> = {
  [Weather.CLEAR]: 'Clear',
  [Weather.RAIN]: 'Rain',
  [Weather.SUNNY]: 'Harsh Sunlight',
  [Weather.SNOW]: 'Snow',
  [Weather.SANDSTORM]: 'Sandstorm',
  [Weather.HAIL]: 'Hail',
  [Weather.FOG]: 'Fog',
  [Weather.THUNDERSTORM]: 'Thunderstorm',
  [Weather.WIND]: 'Strong Winds',
};

/**
 * Terrain display names
 */
export const TERRAIN_DISPLAY_NAMES: Record<TerrainValue, string> = {
  [Terrain.NORMAL]: 'Normal',
  [Terrain.ELECTRIC]: 'Electric Terrain',
  [Terrain.GRASSY]: 'Grassy Terrain',
  [Terrain.MISTY]: 'Misty Terrain',
  [Terrain.PSYCHIC]: 'Psychic Terrain',
};

/**
 * Weather type modifiers
 * Maps weather to type -> damage multiplier adjustments
 */
export const WEATHER_TYPE_MODIFIERS: Record<WeatherValue, Partial<Record<MonsterTypeValue, number>>> = {
  [Weather.CLEAR]: {},
  [Weather.RAIN]: {
    [MonsterType.WATER]: 1.5,
    [MonsterType.FIRE]: 0.5,
  },
  [Weather.SUNNY]: {
    [MonsterType.FIRE]: 1.5,
    [MonsterType.WATER]: 0.5,
  },
  [Weather.SNOW]: {
    [MonsterType.ICE]: 1.2,
  },
  [Weather.SANDSTORM]: {
    [MonsterType.ROCK]: 1.2,
    [MonsterType.GROUND]: 1.2,
    [MonsterType.STEEL]: 1.2,
  },
  [Weather.HAIL]: {
    [MonsterType.ICE]: 1.2,
  },
  [Weather.FOG]: {
    [MonsterType.GHOST]: 1.2,
    [MonsterType.DARK]: 1.2,
  },
  [Weather.THUNDERSTORM]: {
    [MonsterType.ELECTRIC]: 1.5,
    [MonsterType.WATER]: 1.3,
    [MonsterType.FLYING]: 0.8,
  },
  [Weather.WIND]: {
    [MonsterType.FLYING]: 1.3,
    [MonsterType.FIRE]: 0.8,
  },
};

/**
 * Terrain type modifiers
 * Maps terrain to type -> damage multiplier adjustments
 */
export const TERRAIN_TYPE_MODIFIERS: Record<TerrainValue, Partial<Record<MonsterTypeValue, number>>> = {
  [Terrain.NORMAL]: {},
  [Terrain.ELECTRIC]: {
    [MonsterType.ELECTRIC]: 1.3,
  },
  [Terrain.GRASSY]: {
    [MonsterType.GRASS]: 1.3,
  },
  [Terrain.MISTY]: {
    [MonsterType.FAIRY]: 1.3,
    [MonsterType.DRAGON]: 0.5,
  },
  [Terrain.PSYCHIC]: {
    [MonsterType.PSYCHIC]: 1.3,
  },
};

/**
 * Weather residual damage
 * Damage dealt at end of turn to non-immune types (as fraction of max HP)
 */
export const WEATHER_RESIDUAL_DAMAGE: Record<WeatherValue, number> = {
  [Weather.CLEAR]: 0,
  [Weather.RAIN]: 0,
  [Weather.SUNNY]: 0,
  [Weather.SNOW]: 0,
  [Weather.SANDSTORM]: 1 / 16, // 6.25% damage
  [Weather.HAIL]: 1 / 16, // 6.25% damage
  [Weather.FOG]: 0,
  [Weather.THUNDERSTORM]: 0,
  [Weather.WIND]: 0,
};

/**
 * Types immune to weather residual damage
 */
export const WEATHER_IMMUNE_TYPES: Record<WeatherValue, MonsterTypeValue[]> = {
  [Weather.CLEAR]: [],
  [Weather.RAIN]: [],
  [Weather.SUNNY]: [],
  [Weather.SNOW]: [MonsterType.ICE],
  [Weather.SANDSTORM]: [MonsterType.ROCK, MonsterType.GROUND, MonsterType.STEEL],
  [Weather.HAIL]: [MonsterType.ICE],
  [Weather.FOG]: [],
  [Weather.THUNDERSTORM]: [],
  [Weather.WIND]: [],
};

/**
 * Default weather duration in turns (0 = permanent until changed)
 */
export const DEFAULT_WEATHER_DURATION = 5;

/**
 * Default terrain duration in turns
 */
export const DEFAULT_TERRAIN_DURATION = 5;

/**
 * Get the type modifier for a given weather and type
 * @param weather - The current weather
 * @param type - The monster type
 * @returns The damage multiplier (default 1.0)
 */
export function getWeatherTypeModifier(weather: WeatherValue, type: MonsterTypeValue): number {
  const modifiers = WEATHER_TYPE_MODIFIERS[weather];
  return modifiers[type] ?? 1.0;
}

/**
 * Get the type modifier for a given terrain and type
 * @param terrain - The current terrain
 * @param type - The monster type
 * @returns The damage multiplier (default 1.0)
 */
export function getTerrainTypeModifier(terrain: TerrainValue, type: MonsterTypeValue): number {
  const modifiers = TERRAIN_TYPE_MODIFIERS[terrain];
  return modifiers[type] ?? 1.0;
}

/**
 * Check if a type is immune to weather damage
 * @param weather - The current weather
 * @param types - The monster's types
 * @returns True if any type grants immunity
 */
export function isImmuneToWeatherDamage(weather: WeatherValue, types: MonsterTypeValue[]): boolean {
  const immuneTypes = WEATHER_IMMUNE_TYPES[weather];
  return types.some((type) => immuneTypes.includes(type));
}

/**
 * Get the residual damage for weather
 * @param weather - The current weather
 * @param types - The affected monster's types
 * @returns The damage as a fraction of max HP (0 if immune)
 */
export function getWeatherResidualDamage(weather: WeatherValue, types: MonsterTypeValue[]): number {
  if (isImmuneToWeatherDamage(weather, types)) {
    return 0;
  }
  return WEATHER_RESIDUAL_DAMAGE[weather];
}

/**
 * Check if a weather value is valid
 * @param weather - The weather to check
 * @returns True if valid
 */
export function isValidWeather(weather: string): weather is WeatherValue {
  return WEATHER_CONDITIONS.includes(weather as WeatherValue);
}

/**
 * Check if a terrain value is valid
 * @param terrain - The terrain to check
 * @returns True if valid
 */
export function isValidTerrain(terrain: string): terrain is TerrainValue {
  return TERRAIN_TYPES.includes(terrain as TerrainValue);
}

/**
 * Get the display name for weather
 * @param weather - The weather value
 * @returns The display name
 */
export function getWeatherDisplayName(weather: WeatherValue): string {
  return WEATHER_DISPLAY_NAMES[weather] || weather;
}

/**
 * Get the display name for terrain
 * @param terrain - The terrain value
 * @returns The display name
 */
export function getTerrainDisplayName(terrain: TerrainValue): string {
  return TERRAIN_DISPLAY_NAMES[terrain] || terrain;
}
