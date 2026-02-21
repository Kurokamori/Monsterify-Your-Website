import {
  areaConfigurations,
  landmassDefinitions,
  regionDefinitions,
  getAreaConfiguration,
  hasAreaConfiguration,
  projectEncounterConfig,
  projectGuideView,
  resolveEntityImages,
  slugToName,
  type AreaConfiguration,
  type WelcomeMessages,
  type BattleParameters,
  type MonsterRollerParameters,
  type SpecialEncounter,
  type WeatherType,
  type TerrainType,
  type LevelRange,
  type AgroRange,
  type ItemRequirements,
  type AreaDifficulty,
  type Coordinates,
  type WildlifeEntry,
  type ResourceEntry,
  type ImagePaths,
  type ResolvedImages,
  type LandmassDefinition,
  type RegionDefinition,
  type AreaEncounterConfig,
  type AreaGuideView,
  type AreaGuideSummary,
  type LandmassGuideView,
  type RegionGuideView,
  type RegionGuideSummary,
} from '../../utils/contents/area-configurations';

// Re-export types for external use
export type {
  AreaConfiguration,
  WelcomeMessages,
  BattleParameters,
  MonsterRollerParameters,
  SpecialEncounter,
  WeatherType,
  TerrainType,
  LevelRange,
  AgroRange,
  ItemRequirements,
  AreaDifficulty,
  Coordinates,
  WildlifeEntry,
  ResourceEntry,
  ImagePaths,
  ResolvedImages,
  LandmassDefinition,
  RegionDefinition,
  AreaEncounterConfig,
  AreaGuideView,
  AreaGuideSummary,
  LandmassGuideView,
  RegionGuideView,
  RegionGuideSummary,
};

// Legacy type aliases — kept for backward compatibility with existing consumers
export type Landmass = LandmassDefinition;
export type Region = RegionDefinition;

/** Area as seen by guide consumers — projected from AreaConfiguration */
export type Area = AreaGuideView;

export type AreaHierarchy = {
  landmass: Landmass;
  region: Region;
  area: Area;
};

export type FullAreaConfiguration = AreaEncounterConfig & {
  environment: {
    difficulty?: AreaDifficulty;
    climate: string;
    dominantTypes: string[];
    specialFeatures: string[];
  };
};

export type RarityModifiers = {
  common: number;
  uncommon: number;
  rare: number;
  extreme: number;
};

/**
 * Service for managing area data and configurations for adventures.
 *
 * All data originates from area-configurations.ts (single source of truth).
 * This service provides projection methods that return only the slice of data
 * each consumer needs (encounter config, guide details, world map, etc.).
 */
export class AreaDataService {
  // ========================================================================
  // Landmass Accessors
  // ========================================================================

  /**
   * Get all landmasses
   */
  async getAllLandmasses(): Promise<Record<string, Landmass>> {
    return { ...landmassDefinitions };
  }

  /**
   * Get landmass by ID
   */
  async getLandmass(landmassId: string): Promise<Landmass | null> {
    return landmassDefinitions[landmassId] ?? null;
  }

  /**
   * Get regions for a landmass
   */
  async getRegionsForLandmass(landmassId: string): Promise<Region[]> {
    const landmass = landmassDefinitions[landmassId];
    if (!landmass) {
      return [];
    }

    return landmass.regions
      .map((regionId) => regionDefinitions[regionId])
      .filter(Boolean) as Region[];
  }

  // ========================================================================
  // Region Accessors
  // ========================================================================

  /**
   * Get region by ID
   */
  async getRegion(regionId: string): Promise<Region | null> {
    return regionDefinitions[regionId] ?? null;
  }

  /**
   * Get areas for a region (returns guide views)
   */
  async getAreasForRegion(regionId: string): Promise<Area[]> {
    const region = regionDefinitions[regionId];
    if (!region) {
      return [];
    }

    return region.areas
      .map((areaId) => this.buildAreaGuideView(areaId))
      .filter(Boolean) as Area[];
  }

  // ========================================================================
  // Area Accessors
  // ========================================================================

  /**
   * Get area guide view by ID
   */
  async getArea(areaId: string): Promise<Area | null> {
    return this.buildAreaGuideView(areaId);
  }

  /**
   * Get full hierarchy for an area
   */
  async getAreaHierarchy(areaId: string): Promise<AreaHierarchy | null> {
    const area = this.buildAreaGuideView(areaId);
    if (!area) {
      return null;
    }

    const region = regionDefinitions[area.regionId];
    if (!region) {
      return null;
    }

    const landmass = landmassDefinitions[region.landmassId];
    if (!landmass) {
      return null;
    }

    return { landmass, region, area };
  }

  // ========================================================================
  // Encounter Projection (for adventure / encounter systems)
  // ========================================================================

  /**
   * Get the full area configuration for adventure creation.
   * Combines encounter config with environment context from region/landmass.
   */
  async getFullAreaConfiguration(areaId: string): Promise<FullAreaConfiguration | null> {
    const config = getAreaConfiguration(areaId);
    if (!config) {
      return null;
    }

    const region = regionDefinitions[config.region];
    const landmass = landmassDefinitions[config.landmass];

    const encounterConfig = projectEncounterConfig(areaId, config);

    return {
      ...encounterConfig,
      environment: {
        difficulty: config.difficulty,
        climate: region?.climate ?? landmass?.climate ?? '',
        dominantTypes: region?.dominantTypes ?? landmass?.dominantTypes ?? [],
        specialFeatures: config.specialFeatures ?? [],
      },
    };
  }

  /**
   * Check if area has predefined configuration
   */
  hasPredefinedConfig(areaId: string): boolean {
    return hasAreaConfiguration(areaId);
  }

  /**
   * Get all predefined area configurations
   */
  getAllPredefinedConfigs(): Record<string, AreaConfiguration> {
    return areaConfigurations;
  }

  // ========================================================================
  // Difficulty Utility Methods
  // ========================================================================

  /**
   * Get rarity modifiers based on difficulty
   */
  getDifficultyRarityModifiers(difficulty: AreaDifficulty): RarityModifiers {
    switch (difficulty) {
      case 'Easy':
        return { common: 1.5, uncommon: 1.0, rare: 0.5, extreme: 0.1 };
      case 'Medium':
        return { common: 1.2, uncommon: 1.2, rare: 0.8, extreme: 0.3 };
      case 'Hard':
        return { common: 1.0, uncommon: 1.3, rare: 1.2, extreme: 0.6 };
      case 'Extreme':
        return { common: 0.8, uncommon: 1.0, rare: 1.5, extreme: 1.2 };
      default:
        return { common: 1.0, uncommon: 1.0, rare: 1.0, extreme: 1.0 };
    }
  }

  /**
   * Get level range based on difficulty
   */
  getDifficultyLevelRange(difficulty: AreaDifficulty): LevelRange {
    switch (difficulty) {
      case 'Easy':
        return { min: 1, max: 25 };
      case 'Medium':
        return { min: 15, max: 45 };
      case 'Hard':
        return { min: 30, max: 65 };
      case 'Extreme':
        return { min: 50, max: 100 };
      default:
        return { min: 1, max: 50 };
    }
  }

  // ========================================================================
  // Guide Methods
  // ========================================================================

  /**
   * Get world map data (all landmasses with resolved images for the interactive map)
   */
  async getWorldMapData(): Promise<{ landmasses: (Omit<LandmassDefinition, 'images'> & ResolvedImages)[] }> {
    const landmasses = Object.values(landmassDefinitions).map((landmass) => {
      const { images, ...rest } = landmass;
      const resolved = resolveEntityImages(images, 'landmass', landmass.id);
      return { ...rest, ...resolved };
    });
    return { landmasses };
  }

  /**
   * Get landmass guide data with resolved images and region summaries.
   * Regions are composed from definitions — no duplicated data in the landmass source.
   */
  async getLandmassGuideData(landmassId: string): Promise<LandmassGuideView | null> {
    const landmass = landmassDefinitions[landmassId];
    if (!landmass) {
      return null;
    }

    const landmassImages = resolveEntityImages(landmass.images, 'landmass', landmass.id);

    const regionsData: RegionGuideSummary[] = landmass.regions
      .map((regionId) => {
        const region = regionDefinitions[regionId];
        if (!region) {
          return null;
        }
        const regionImages = resolveEntityImages(region.images, 'region', regionId, landmass.id);
        return {
          id: region.id,
          name: region.name,
          description: region.description,
          ...regionImages,
          mapCoordinates: region.mapCoordinates,
        };
      })
      .filter(Boolean) as RegionGuideSummary[];

    return {
      id: landmass.id,
      name: landmass.name,
      description: landmass.description,
      climate: landmass.climate,
      dominantTypes: landmass.dominantTypes,
      regions: landmass.regions,
      ...landmassImages,
      lore: landmass.lore,
      mapCoordinates: landmass.mapCoordinates,
      regionsData,
    };
  }

  /**
   * Get region guide data with resolved images and area summaries.
   * Areas are composed from their configurations — no duplicated data in the region source.
   */
  async getRegionGuideData(regionId: string): Promise<RegionGuideView | null> {
    const region = regionDefinitions[regionId];
    if (!region) {
      return null;
    }

    const landmass = landmassDefinitions[region.landmassId];
    const regionImages = resolveEntityImages(region.images, 'region', regionId, region.landmassId);

    const areas: AreaGuideSummary[] = region.areas
      .map((areaId) => {
        const config = getAreaConfiguration(areaId);
        if (!config) {
          return null;
        }
        const areaImages = resolveEntityImages(config.images, 'area', areaId, `${config.landmass}/${config.region}`);
        return {
          id: areaId,
          name: slugToName(areaId),
          ...areaImages,
          description: config.description,
          difficulty: config.difficulty,
          specialFeatures: config.specialFeatures,
          mapCoordinates: config.mapCoordinates,
        } as AreaGuideSummary;
      })
      .filter(Boolean) as AreaGuideSummary[];

    return {
      id: region.id,
      name: region.name,
      landmassId: region.landmassId,
      landmassName: landmass?.name ?? '',
      dominantTypes: region.dominantTypes,
      climate: region.climate,
      ...regionImages,
      description: region.description,
      elevation: region.elevation,
      wildlife: region.wildlife,
      resources: region.resources,
      lore: region.lore,
      mapCoordinates: region.mapCoordinates,
      areas,
    };
  }

  /**
   * Get area guide data with full details and resolved images.
   */
  async getAreaGuideData(areaId: string): Promise<AreaGuideView | null> {
    return this.buildAreaGuideView(areaId);
  }

  // ========================================================================
  // Private Helpers
  // ========================================================================

  /**
   * Build an AreaGuideView from the area configuration.
   * Image resolution is handled by projectGuideView.
   */
  private buildAreaGuideView(areaId: string): AreaGuideView | null {
    const config = getAreaConfiguration(areaId);
    if (!config) {
      return null;
    }
    return projectGuideView(areaId, config);
  }
}
