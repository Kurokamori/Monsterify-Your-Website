/**
 * Area Configurations — Single Source of Truth
 *
 * This module defines ALL area, region, and landmass data for the game.
 * Different consumers (encounter system, guide pages, world map) project
 * only the slice of data they need via the AreaDataService.
 *
 * Data hierarchy:  Landmass → Region → Area
 */

import { Weather, Terrain } from '../constants/weather-terrain';

// =============================================================================
// Primitive / Shared Types
// =============================================================================

export type WeatherType = (typeof Weather)[keyof typeof Weather];
export type TerrainType = (typeof Terrain)[keyof typeof Terrain];

export type Coordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WildlifeEntry = {
  name: string;
  species: string;
  type: string;
  rarity: string;
  description: string;
};

export type ResourceEntry = {
  name: string;
  rarity: string;
  description: string;
};

export type AreaDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Extreme';

/**
 * Raw image paths as stored in definitions.
 * Both fields are optional — resolution happens at projection time.
 */
export type ImagePaths = {
  guide?: string;
  overworld?: string;
};

/**
 * Resolved image URLs returned by projection/guide endpoints.
 * Always populated — either from explicit paths, cross-fill, or convention defaults.
 */
export type ResolvedImages = {
  /** Guide image — shown on the entity's own detail/guide page */
  image: string;
  /** Overworld image — shown when entity appears on its parent's map (hover/card) */
  overworldImage: string;
};

// =============================================================================
// Encounter-Related Types
// =============================================================================

export type WelcomeMessages = {
  base: string;
  variations: string[];
};

export type BattleParameters = {
  weather: WeatherType;
  terrain: TerrainType;
};

export type MonsterRollerParameters = {
  speciesTypesOptions?: string[];
  includeStages?: string[];
  includeRanks?: string[];
  species_min?: number;
  species_max?: number;
  types_min?: number;
  types_max?: number;
  enableLegendaries?: boolean;
  enableMythicals?: boolean;
};

export type LevelRange = {
  min: number;
  max: number;
};

export type AgroRange = {
  min: number;
  max: number;
};

export type ItemRequirements = {
  needsMissionMandate?: boolean;
  itemRequired?: string;
};

export type SpecialEncounter = {
  type: string;
  chance: number;
  description: string;
};

// =============================================================================
// Landmass Definition
// =============================================================================

export type LandmassDefinition = {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  regions: string[];          // Region IDs only — no duplicated region data
  images?: ImagePaths;        // Resolved at projection time via resolveEntityImages
  lore: string;
  mapCoordinates: Coordinates;
};

// =============================================================================
// Region Definition
// =============================================================================

export type RegionDefinition = {
  id: string;
  name: string;
  landmassId: string;
  dominantTypes: string[];
  climate: string;
  areas: string[];            // Area IDs only — no duplicated area data
  images?: ImagePaths;        // Resolved at projection time via resolveEntityImages
  description: string;
  elevation: string;
  wildlife: string;
  resources: string;
  lore: string;
  mapCoordinates: Coordinates;
};

/**
 * Convert a slug-id to Title Case (e.g. "adamant-peak" → "Adamant Peak").
 * Handles apostrophe slugs like "poseidons-reach" → "Poseidons Reach".
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// Area Configuration (Single Source of Truth per area)
// =============================================================================

export type AreaConfiguration = {
  // --- Identity & hierarchy ---
  landmass: string;
  landmassName: string;
  region: string;
  regionName: string;

  // --- Encounter configuration ---
  needsMissionMandate?: boolean;
  welcomeMessages: WelcomeMessages;
  battleParameters: BattleParameters;
  monsterRollerParameters: MonsterRollerParameters;
  levelRange: LevelRange;
  agroRange: AgroRange;
  itemRequirements?: ItemRequirements;
  specialEncounters: SpecialEncounter[];
  /** Restrict the resulting types wild monsters can have (e.g. ['Fire', 'Rock']) */
  allowedWildTypes?: string[];

  // --- Guide details (optional — to be populated from old guide data) ---
  difficulty?: AreaDifficulty;
  specialFeatures?: string[];
  images?: ImagePaths;
  description?: string;
  elevation?: string;
  temperature?: string;
  weatherPatterns?: string;
  accessibility?: string;
  recommendedLevel?: string;
  wildlife?: WildlifeEntry[];
  resources?: ResourceEntry[];
  lore?: string;
  history?: string;
  dangers?: string[];
  tips?: string[];
  mapCoordinates?: Coordinates;
};

// =============================================================================
// Projection Types — used by consumers to receive only what they need
// =============================================================================

/** Encounter-only view of an area (used by encounter/adventure systems) */
export type AreaEncounterConfig = {
  areaId: string;
  areaName: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  welcomeMessages: WelcomeMessages;
  battleParameters: BattleParameters;
  monsterRollerParameters: MonsterRollerParameters;
  levelRange: LevelRange;
  agroRange: AgroRange;
  itemRequirements?: ItemRequirements;
  specialEncounters: SpecialEncounter[];
  allowedWildTypes?: string[];
  difficulty?: AreaDifficulty;
};

/** Guide-only view of an area (full detail page) — images are resolved */
export type AreaGuideView = ResolvedImages & {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  landmassId: string;
  landmassName: string;
  difficulty?: AreaDifficulty;
  specialFeatures?: string[];
  description?: string;
  elevation?: string;
  temperature?: string;
  weatherPatterns?: string;
  accessibility?: string;
  recommendedLevel?: string;
  wildlife?: WildlifeEntry[];
  resources?: ResourceEntry[];
  lore?: string;
  history?: string;
  dangers?: string[];
  tips?: string[];
  mapCoordinates?: Coordinates;
};

/** Summary of an area within a region guide — images are resolved */
export type AreaGuideSummary = ResolvedImages & {
  id: string;
  name: string;
  description?: string;
  difficulty?: AreaDifficulty;
  specialFeatures?: string[];
  mapCoordinates?: Coordinates;
};

/** Region guide view (full detail page) — images resolved, areas composed from definitions */
export type RegionGuideView = ResolvedImages & {
  id: string;
  name: string;
  landmassId: string;
  landmassName: string;
  dominantTypes: string[];
  climate: string;
  description: string;
  elevation: string;
  wildlife: string;
  resources: string;
  lore: string;
  mapCoordinates: Coordinates;
  areas: AreaGuideSummary[];
};

/** Summary of a region within a landmass guide — images resolved */
export type RegionGuideSummary = ResolvedImages & {
  id: string;
  name: string;
  description: string;
  mapCoordinates: Coordinates;
};

/** Landmass guide view (full detail page) — images resolved, regions composed from definitions */
export type LandmassGuideView = ResolvedImages & {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  regions: string[];
  lore: string;
  mapCoordinates: Coordinates;
  regionsData: RegionGuideSummary[];
};

export type AreaConfigurationsMap = Record<string, AreaConfiguration>;
export type LandmassDefinitionsMap = Record<string, LandmassDefinition>;
export type RegionDefinitionsMap = Record<string, RegionDefinition>;

// === LANDMASS_DATA_START ===
export const landmassDefinitions: LandmassDefinitionsMap = {
  'conoco-island': {
    "id": "conoco-island",
    "name": "Conoco Island",
    "description": "A vast island seemingly disconnected entirely from the rest of the world, where beasts of many kinds roam free.",
    "climate": "Varied (Temperate, Tropical, Desert, Alpine, Coastal, Mystical)",
    "dominantTypes": [
      "Normal",
      "Fire",
      "Water",
      "Electric",
      "Grass",
      "Ice",
      "Fighting",
      "Poison",
      "Ground",
      "Flying",
      "Psychic",
      "Bug",
      "Rock",
      "Ghost",
      "Dragon",
      "Dark",
      "Steel",
      "Fairy"
    ],
    "regions": [
      "hearthfall-commons",
      "agni-peaks",
      "poseidons-reach",
      "thunderbird-heights",
      "demeters-grove",
      "jotun-tundra",
      "kshatriya-arena",
      "baba-yagas-marsh",
      "terra-madre-basin",
      "quetzal-winds",
      "oracles-sanctum",
      "anansi-woods",
      "stoneheart-cliffs",
      "mictlan-hollows",
      "long-valley",
      "ravens-shadow",
      "hephaestus-forge",
      "seelie-courts",
      "pirates-bay"
    ],
    "lore": "Legend speaks of eighteen ancient spirits from different realms who found sanctuary on this island, each claiming dominion over a region that reflects their elemental essence. The island serves as a living tapestry of elemental energies, where frost titans dwell alongside fire spirits, and woodland courts neighbor wind guardians.",
    "mapCoordinates": {
      "x": 41.01002865329513,
      "y": 0.2527061445399532,
      "width": 54.90687679083094,
      "height": 62.4005093919134
    },
    "images": {
      "guide": "/images/maps/conoco-island-detailed.png"
    }
  },

  'conoocoo-archipelago': {
    "id": "conoocoo-archipelago",
    "name": "Conoocoo Archipelago",
    "description": "A chain of mysterious tropical islands where time seems frozen in the age of giants. The central Primordial Jungle harbors prehistoric Monsters that have survived since ancient times.",
    "climate": "Tropical Prehistoric (Lush, Humid, Volcanic, Coastal)",
    "dominantTypes": [
      "Grass",
      "Water",
      "Rock",
      "Dragon",
      "Steel"
    ],
    "regions": [
      "primordial-jungle",
      "crystal-cove",
      "volcanic-peaks",
      "mist-marshlands"
    ],
    "lore": "Legend tells of a great cataclysm that separated these islands from the flow of time, preserving creatures from eras long past. The central jungle pulses with primordial energy, where fossil Monsters roam freely and ancient species that predate recorded history still thrive. The local tribes live in harmony with these rare and legendary monsters, and to all they can to keep this secret hidden.",
    "mapCoordinates": {
      "x": 4.5487106017192005,
      "y": 27.63252148997135,
      "width": 23.78223495702006,
      "height": 26.615727475326327
    },
    "images": {
      "guide": "/images/maps/conoocoo-archipelago-detailed.png"
    }
  },

  'sky-isles': {
    "id": "sky-isles",
    "name": "Sky Isles",
    "description": "Mystical floating islands suspended in the clouds, where ancient sky civilizations built cities that touch the stars and commune with celestial Monsters.",
    "climate": "Ethereal Sky (Celestial Winds)",
    "dominantTypes": [
      "Flying",
      "Psychic",
      "Fairy",
      "Dragon",
      "Steel"
    ],
    "regions": [
      "nimbus-capital",
      "aurora-heights",
      "tempest-zones",
      "draconic-abyss"
    ],
    "lore": "These islands defy gravity itself, held aloft by ancient sky magic and celestial energy. The islands rotate slowly through the heavens, following star patterns that only the sky-dwellers understand. Here, Flying-type Monsters have evolved beyond earthbound limitations, and legendary sky serpents patrol the cloud roads between floating cities.",
    "mapCoordinates": {
      "x": 0.10744985673352436,
      "y": 63.92669531996179,
      "width": 99.35530085959886,
      "height": 35.40273798153455
    },
    "images": {
      "guide": "/images/maps/sky-isles-detailed.png"
    }
  },

};

// === LANDMASS_DATA_END ===


// === REGION_DATA_START ===
export const regionDefinitions: RegionDefinitionsMap = {
  'hearthfall-commons': {
    "id": "hearthfall-commons",
    "name": "Hearthfall Commons",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Normal"
    ],
    "climate": "Temperate Continental (Northern climate)",
    "areas": [
      "heimdal-city",
      "hygge-village",
      "bonfire-town",
      "hearthstone-temple",
      "golden-hall"
    ],
    "description": "A peaceful northern homeland with cozy settlements, where Normal-type Monsters gather in harmonious communities.",
    "elevation": "200 - 800 ft",
    "wildlife": "Cozy Cabin Monsters, Hearth Spirits, Community Gatherers",
    "resources": "Hearthwood, Comfort Berries, Warm Stones",
    "lore": "Inspired by northern concepts of community and comfort, this region embodies the simple joys of home and hearth. The Normal-type Monsters here are known for their loyalty and protective nature toward their human companions, much like the legendary bond between close-knit families and their guardian spirits.",
    "mapCoordinates": {
      "x": 30,
      "y": 55,
      "width": 15,
      "height": 12
    },
    "images": {
      "guide": "/images/maps/regions/hearthfall-commons-detailed.png"
    }
  },

  'agni-peaks': {
    "id": "agni-peaks",
    "name": "Agni Peaks",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Fire"
    ],
    "climate": "Volcanic Tropical (Sacred Fire Climate)",
    "areas": [
      "agni-city",
      "yagna-village",
      "tapas-town",
      "sacred-pyre",
      "eternal-flame"
    ],
    "description": "Sacred fire mountains where eternal flames burn, home to powerful Fire-type Monsters.",
    "elevation": "3,000 - 8,500 ft",
    "wildlife": "Sacred Flame Spirits, Volcanic Salamanders, Fire Temple Guardians",
    "resources": "Sacred Ash, Fire Crystals, Blessed Charcoal",
    "lore": "Named after the ancient spirit of fire, this region's eternal flames are said to purify both body and spirit. Fire-type Monsters here perform sacred rituals at dawn and dusk, and the region's temples host ceremonies where trainers can strengthen their bonds through trials of courage and purification.",
    "mapCoordinates": {
      "x": 55,
      "y": 35,
      "width": 18,
      "height": 20
    },
    "images": {
      "guide": "/images/maps/regions/agni-peaks-detailed.png"
    }
  },

  'poseidons-reach': {
    "id": "poseidons-reach",
    "name": "Poseidon's Reach",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Water"
    ],
    "climate": "Mediterranean Marine",
    "areas": [
      "atlantis-city",
      "nereid-harbor",
      "amphitrite-town",
      "trident-temple",
      "maelstrom-point"
    ],
    "description": "Coastal realm ruled by the sea lord's power, teeming with Water-type Monsters.",
    "elevation": "Sea Level - 400 ft",
    "wildlife": "Trident Wielders, Coral Architects, Deep Sea Oracles",
    "resources": "Divine Pearls, Sea Salt, Triton Shells",
    "lore": "The domain of the sea lord's influence, where the sea itself seems alive with ancient power. Water-type Monsters here display remarkable intelligence and coordination, forming complex underwater societies. The region's tides follow mysterious patterns that local oracles claim reveal prophecies of the future.",
    "mapCoordinates": {
      "x": 35,
      "y": 85,
      "width": 25,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/poseidons-reach-detailed.png"
    }
  },

  'thunderbird-heights': {
    "id": "thunderbird-heights",
    "name": "Thunderbird Heights",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Electric"
    ],
    "climate": "High Plains Stormy",
    "areas": [
      "wakinyan-city",
      "storm-dance-village",
      "thunder-mesa",
      "great-nest",
      "lightning-spire"
    ],
    "description": "Ancient sky realm where the great Storm Eagle soars, crackling with Electric-type energy.",
    "elevation": "4,000 - 9,000 ft",
    "wildlife": "Storm Eagles, Lightning Dancers, Thunder Spirits",
    "resources": "Thunder Feathers, Storm Glass, Lightning Wood",
    "lore": "Sacred to the Storm Eagle spirit of ancient legend, this region experiences constant electrical storms that seem to follow the migration patterns of its Electric-type Monsters. The ancient peoples say the Storm Eagle's wings create the storms that bring life-giving rain to the lower regions.",
    "mapCoordinates": {
      "x": 30,
      "y": 35,
      "width": 20,
      "height": 18
    },
    "images": {
      "guide": "/images/maps/regions/thunderbird-heights-detailed.png"
    }
  },

  'demeters-grove': {
    "id": "demeters-grove",
    "name": "Demeter's Grove",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Grass"
    ],
    "climate": "Eternal Spring Mediterranean",
    "areas": [
      "eleusis-city",
      "persephone-village",
      "ceres-town",
      "mystery-temple",
      "golden-wheat"
    ],
    "description": "The harvest spirit's blessed forest, where Grass-type Monsters flourish in eternal spring.",
    "elevation": "500 - 2,000 ft",
    "wildlife": "Harvest Spirits, Growth Guardians, Seasonal Dancers",
    "resources": "Golden Grain, Blessing Fruits, Life Nectar",
    "lore": "Blessed by the harvest spirit of agriculture, this region never experiences winter. The Grass-type Monsters here have learned the secrets of eternal growth and abundance, teaching sustainable farming practices to human visitors. The region's heart contains an ancient temple where the first seeds were blessed.",
    "mapCoordinates": {
      "x": 65,
      "y": 55,
      "width": 22,
      "height": 16
    },
    "images": {
      "guide": "/images/maps/regions/demeters-grove-detailed.png"
    }
  },

  'jotun-tundra': {
    "id": "jotun-tundra",
    "name": "Jötun Tundra",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Ice"
    ],
    "climate": "Subarctic Tundra (Giant's Winter)",
    "areas": [
      "utgard-city",
      "frost-village",
      "rimeheart-town",
      "jotun-halls",
      "eternal-glacier"
    ],
    "description": "Frozen realm of frost titans, where Ice-type Monsters thrive in the eternal winter.",
    "elevation": "2,000 - 7,500 ft",
    "wildlife": "Frost Giants, Ice Sculptors, Winter Shamans",
    "resources": "Giant Ice, Frost Berries, Aurora Stones",
    "lore": "The domain of the frost titans of ancient lore, where winter reigns eternal. Ice-type Monsters here grow to enormous sizes and display incredible craftsmanship, creating ice sculptures that tell the stories of ancient battles between elemental forces. The region's ice never melts, preserved by primordial magic.",
    "mapCoordinates": {
      "x": 5,
      "y": 40,
      "width": 20,
      "height": 25
    },
    "images": {
      "guide": "/images/maps/regions/jotun-tundra-detailed.png"
    }
  },

  'kshatriya-arena': {
    "id": "kshatriya-arena",
    "name": "Kshatriya Arena",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Fighting"
    ],
    "climate": "Arid Mountain Training Climate",
    "areas": [
      "kurukshetra-city",
      "dharma-village",
      "valor-town",
      "honor-temple",
      "grand-colosseum"
    ],
    "description": "Ancient warrior training grounds, where Fighting-type Monsters hone their martial arts.",
    "elevation": "1,500 - 5,000 ft",
    "wildlife": "Warrior Monks, Training Masters, Honor Guards",
    "resources": "Training Stones, Warrior Herbs, Honor Metals",
    "lore": "Inspired by the ancient warrior tradition of honor and protection, this region is dedicated to the noble art of combat and protection. Fighting-type Monsters here follow ancient codes of honor and practice disciplined martial arts. The region hosts tournaments where only the most skilled and honorable may compete.",
    "mapCoordinates": {
      "x": 70,
      "y": 20,
      "width": 16,
      "height": 18
    },
    "images": {
      "guide": "/images/maps/regions/kshatriya-arena-detailed.png"
    }
  },

  'baba-yagas-marsh': {
    "id": "baba-yagas-marsh",
    "name": "Crowsfoot Marsh",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Poison"
    ],
    "climate": "Mystical Swamp (Witch's Domain)",
    "areas": [
      "witchwood-city",
      "cauldron-village",
      "bog-town",
      "iron-teeth-hut",
      "poison-pools"
    ],
    "description": "Crowsfoot Marsh, where Poison-type Monsters brew in toxic mists.",
    "elevation": "50 - 300 ft",
    "wildlife": "Cauldron Spirits, Brew Masters, Swamp Witches",
    "resources": "Witch Herbs, Toxic Mushrooms, Mystery Potions",
    "lore": "The domain of Baba Yaga, the enigmatic witch of Slavic folklore. Poison-type Monsters here are master alchemists and potion brewers, creating both deadly toxins and miraculous cures. The marsh's mists carry whispers of ancient magic, and those brave enough to seek Baba Yaga's hut may find their deepest questions answered.",
    "mapCoordinates": {
      "x": 25,
      "y": 5,
      "width": 18,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/baba-yagas-marsh-detailed.png"
    }
  },

  'terra-madre-basin': {
    "id": "terra-madre-basin",
    "name": "Terra Madre Basin",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Ground"
    ],
    "climate": "Continental Steppe (Earth Mother's Domain)",
    "areas": [
      "tellus-city",
      "terra-village",
      "gaia-town",
      "mother-temple",
      "sacred-canyon"
    ],
    "description": "The earth mother's sacred valley, where Ground-type Monsters shape the very land.",
    "elevation": "800 - 2,500 ft",
    "wildlife": "Earth Shapers, Canyon Dwellers, Fertile Spirits",
    "resources": "Sacred Clay, Earth Gems, Fertile Soil",
    "lore": "Dedicated to the ancient earth mother spirit of earth and fertility. Ground-type Monsters here are master terraformers, able to reshape landscapes and create fertile valleys. The region's center holds an ancient amphitheater where the first agricultural ceremonies were held, blessing the earth for eternal abundance.",
    "mapCoordinates": {
      "x": 50,
      "y": 5,
      "width": 20,
      "height": 20
    },
    "images": {
      "guide": "/images/maps/regions/terra-madre-basin-detailed.png"
    }
  },

  'quetzal-winds': {
    "id": "quetzal-winds",
    "name": "Quetzal Winds",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Flying"
    ],
    "climate": "Highland Tropical (Feathered Winds)",
    "areas": [
      "tenochtitlan-sky",
      "wind-village",
      "feather-town",
      "serpent-pyramid",
      "floating-gardens"
    ],
    "description": "The feathered serpent's domain, where Flying-type Monsters dance on ancient wind currents.",
    "elevation": "3,500 - 8,000 ft",
    "wildlife": "Feathered Serpents, Wind Dancers, Sky Priests",
    "resources": "Quetzal Feathers, Wind Crystals, Sky Jade",
    "lore": "Sacred to the ancient feathered serpent spirit of wind and wisdom. Flying-type Monsters here perform elaborate aerial dances that control weather patterns across the island. The region's temples float on ancient wind currents, accessible only to those who have earned the trust of the wind spirits.",
    "mapCoordinates": {
      "x": 75,
      "y": 55,
      "width": 18,
      "height": 20
    },
    "images": {
      "guide": "/images/maps/regions/quetzal-winds-detailed.png"
    }
  },

  'oracles-sanctum': {
    "id": "oracles-sanctum",
    "name": "Oracle's Sanctum",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Psychic"
    ],
    "climate": "Mystical Highland Mediterranean",
    "areas": [
      "delphi-city",
      "pythia-village",
      "vision-town",
      "apollo-temple",
      "sacred-vapors"
    ],
    "description": "The oracle's mystical realm, where Psychic-type Monsters commune with higher powers.",
    "elevation": "2,200 - 4,500 ft",
    "wildlife": "Oracle Seers, Mind Readers, Future Whisperers",
    "resources": "Prophecy Stones, Mind Crystals, Wisdom Herbs",
    "lore": "Inspired by the Oracle of Delphi, this region serves as a conduit between the mortal and divine realms. Psychic-type Monsters here possess prophetic abilities and can glimpse fragments of possible futures. The central temple's sacred vapors enhance psychic abilities, but only the pure of heart can enter without being overwhelmed.",
    "mapCoordinates": {
      "x": 35,
      "y": 75,
      "width": 15,
      "height": 18
    },
    "images": {
      "guide": "/images/maps/regions/oracles-sanctum-detailed.png"
    }
  },

  'anansi-woods': {
    "id": "anansi-woods",
    "name": "Anansi Woods",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Bug"
    ],
    "climate": "Tropical Rainforest (Story Weaver's Domain)",
    "areas": [
      "kumasi-city",
      "story-village",
      "web-town",
      "great-tree",
      "silk-library"
    ],
    "description": "The spider lord's intricate forest, where Bug-type Monsters weave stories in silk and shadow.",
    "elevation": "300 - 1,800 ft",
    "wildlife": "Story Weavers, Web Architects, Trickster Spiders",
    "resources": "Story Silk, Wisdom Honey, Pattern Leaves",
    "lore": "Sacred to the ancient spider lord of stories and wisdom. Bug-type Monsters here are master storytellers, weaving tales into their webs that come alive under moonlight. The forest's ancient trees hold libraries of silk-spun stories, preserving the wisdom and folklore of countless generations.",
    "mapCoordinates": {
      "x": 60,
      "y": 75,
      "width": 20,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/anansi-woods-detailed.png"
    }
  },

  'stoneheart-cliffs': {
    "id": "stoneheart-cliffs",
    "name": "Stoneheart Cliffs",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Rock"
    ],
    "climate": "Highland Oceanic (Druidic)",
    "areas": [
      "avalon-city",
      "druid-village",
      "cairn-town",
      "stonehenge-site",
      "memory-cliffs"
    ],
    "description": "Ancient stone circle highlands, where Rock-type Monsters guard ancient mystical secrets.",
    "elevation": "2,800 - 6,200 ft",
    "wildlife": "Stone Guardians, Druid Spirits, Ancient Sentinels",
    "resources": "Druid Stones, Memory Crystals, Ancient Moss",
    "lore": "Inspired by ancient stone circles and mystical traditions, this region's Rock-type Monsters serve as guardians of ancient knowledge. The standing stones here record the island's complete history in mystical runes that only the most attuned can read. During celestial alignments, the stones glow with inner fire, revealing secrets of the past.",
    "mapCoordinates": {
      "x": 80,
      "y": 75,
      "width": 15,
      "height": 20
    },
    "images": {
      "guide": "/images/maps/regions/stoneheart-cliffs-detailed.png"
    }
  },

  'mictlan-hollows': {
    "id": "mictlan-hollows",
    "name": "Mictlan Hollows",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Ghost"
    ],
    "climate": "Mystical Subterranean (Underworld)",
    "areas": [
      "mictlampa-city",
      "xochitonal-village",
      "bone-town",
      "death-pyramid",
      "river-crossing"
    ],
    "description": "Ancient underworld realm where spirits dwell, home to mysterious Ghost-type Monsters.",
    "elevation": "100 - 1,000 ft (mostly underground)",
    "wildlife": "Death Guides, Spirit Guardians, Underworld Messengers",
    "resources": "Spirit Essence, Bone Dust, Afterlife Flowers",
    "lore": "Named after the ancient underworld realm, this region exists partially in the realm of spirits. Ghost-type Monsters here serve as guides between the world of the living and the dead, helping lost souls find peace. The region's caverns contain murals depicting the journey of souls through the afterlife.",
    "mapCoordinates": {
      "x": 6.217765042979941,
      "y": 76.25413530367827,
      "width": 18,
      "height": 16
    },
    "images": {
      "guide": "/images/maps/regions/mictlan-hollows-detailed.png"
    }
  },

  'long-valley': {
    "id": "long-valley",
    "name": "Long Valley",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Dragon"
    ],
    "climate": "Temperate Continental (Dragon's Breath)",
    "areas": [
      "tianlong-city",
      "jade-village",
      "wisdom-town",
      "imperial-palace",
      "nine-dragons"
    ],
    "description": "Ancient dragon realm of wisdom and power, where majestic Dragon-type Monsters reign supreme.",
    "elevation": "1,200 - 4,800 ft",
    "wildlife": "Imperial Dragons, Wisdom Keepers, Pearl Guardians",
    "resources": "Dragon Scales, Imperial Jade, Wisdom Pearls",
    "lore": "Inspired by ancient dragon lore, this valley is ruled by ancient Dragon-type Monsters who embody wisdom and imperial power. The region's dragons are scholars and philosophers, maintaining vast libraries of knowledge. Only those who demonstrate wisdom, humility, and respect for tradition are granted audience with the Dragon Elders.",
    "mapCoordinates": {
      "x": 10,
      "y": 5,
      "width": 25,
      "height": 12
    },
    "images": {
      "guide": "/images/maps/regions/long-valley-detailed.png"
    }
  },

  'ravens-shadow': {
    "id": "ravens-shadow",
    "name": "Raven's Shadow",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Dark"
    ],
    "climate": "Twilight Forest (Trickster's Domain)",
    "areas": [
      "corvus-city",
      "shadow-village",
      "twilight-town",
      "trickster-lodge",
      "eternal-dusk"
    ],
    "description": "Native American trickster's twilight realm, where cunning Dark-type Monsters lurk in shadows.",
    "elevation": "600 - 2,400 ft",
    "wildlife": "Shadow Tricksters, Night Prowlers, Twilight Ravens",
    "resources": "Shadow Berries, Night Stones, Trickster Feathers",
    "lore": "Sacred to the Raven, the trickster spirit of ancient legend. Dark-type Monsters here are clever shapeshifters and masters of illusion, teaching important lessons through elaborate pranks and challenges. The region exists in perpetual twilight, where shadows dance with their own will and nothing is quite as it seems.",
    "mapCoordinates": {
      "x": 5,
      "y": 20,
      "width": 16,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/ravens-shadow-detailed.png"
    }
  },

  'hephaestus-forge': {
    "id": "hephaestus-forge",
    "name": "Hephaestus Forge",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Steel"
    ],
    "climate": "Industrial Volcanic (Divine Workshop)",
    "areas": [
      "vulcan-city",
      "cyclops-village",
      "forge-town",
      "divine-workshop",
      "adamant-peak"
    ],
    "description": "Greek god's industrial workshop, where Steel-type Monsters craft legendary metals and machines.",
    "elevation": "1,800 - 4,200 ft",
    "wildlife": "Master Smiths, Metal Shapers, Forge Spirits",
    "resources": "Divine Metals, Forge Fire, Crafting Crystals",
    "lore": "The workshop of Hephaestus, Greek god of metalworking and craftsmanship. Steel-type Monsters here are master artisans, capable of forging legendary weapons and tools. The region's forges burn with divine fire that never dies, and the metalwork created here is said to be blessed with the gods' own power.",
    "mapCoordinates": {
      "x": 85,
      "y": 35,
      "width": 12,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/hephaestus-forge-detailed.png"
    }
  },

  'seelie-courts': {
    "id": "seelie-courts",
    "name": "Seelie Courts",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Fairy"
    ],
    "climate": "Enchanted Temperate (Fairy Magic)",
    "areas": [
      "titania-city",
      "oberon-village",
      "puck-town",
      "summer-court",
      "enchanted-glade"
    ],
    "description": "Ancient fairy kingdom of wonder and magic, where Fairy-type Monsters hold eternal revelries.",
    "elevation": "400 - 2,200 ft",
    "wildlife": "Court Nobles, Magic Weavers, Dream Dancers",
    "resources": "Fairy Dust, Dream Crystals, Enchanted Flowers",
    "lore": "The realm of the benevolent fairy court, dwelling in ancient magic and wonder. Fairy-type Monsters here live in an eternal celebration of life, beauty, and magic. The region changes with the seasons of emotion rather than weather, reflecting the collective mood of its inhabitants. Time flows differently here, and visitors often find that minutes feel like hours, or years pass like days.",
    "mapCoordinates": {
      "x": 55,
      "y": 80,
      "width": 18,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/seelie-courts-detailed.png"
    }
  },

  'pirates-bay': {
    "id": "pirates-bay",
    "name": "Pirates Bay",
    "landmassId": "conoco-island",
    "dominantTypes": [
      "Water",
      "Flying",
      "Ground"
    ],
    "climate": "Tropical",
    "areas": [
      "pirate-port",
      "pirate-village",
      "hidden-cove",
      "nyakuza-landing",
      "skull-rock"
    ],
    "description": "The far reaches of the island where few dare travel and the pirates have made their home.",
    "elevation": "Sea Level - 600 ft",
    "wildlife": "Pirates, Buccaneers, Corsairs",
    "resources": "Treasure, Booty, Spoils of War",
    "lore": "The pirate haven of Conoco Island, where the bravest and most ruthless sailors in the world make their home. The bay is a lawless place, ruled by the iron fist of the pirate lords. The waters are teeming with Monsters, and the air is thick with the scent of salt and danger. The pirates here are a rough and tumble bunch, and visitors are advised to tread carefully.",
    "mapCoordinates": {
      "x": 83.93982808022922,
      "y": 1.6064574135764769,
      "width": 15,
      "height": 15
    },
    "images": {
      "guide": "/images/maps/regions/pirates-bay-detailed.png"
    }
  },

  'primordial-jungle': {
    "id": "primordial-jungle",
    "name": "Primordial Jungle",
    "landmassId": "conoocoo-archipelago",
    "dominantTypes": [
      "Grass",
      "Rock",
      "Dragon",
      "Ground",
      "bug"
    ],
    "climate": "Tropical Prehistoric",
    "areas": [
      "amber-village",
      "dinosaur-valley",
      "time-temple"
    ],
    "description": "The massive central jungle where prehistoric Monsters roam among ancient trees that have stood since the dawn of time.",
    "elevation": "100 - 1,500 ft",
    "wildlife": "Ancient Beasts, Raptors, Time Spirits",
    "resources": "Ancient Amber, Young Fossils, Prehistoric Berries  and Fruits",
    "lore": "This jungle exists outside normal time,where prehistoric Monsters still roam. The trees themselves are living fossils, and deep in the jungle's heart, legendary Monsters that witnessed the world's creation still dwell. Time flows differently here, and some say the jungle remembers everything that ever was.",
    "mapCoordinates": {
      "x": 15,
      "y": 40,
      "width": 60,
      "height": 25
    },
    "images": {
      "guide": "/images/maps/regions/primordial-jungle-detailed.png"
    }
  },

  'crystal-cove': {
    "id": "crystal-cove",
    "name": "Crystal Cove",
    "landmassId": "conoocoo-archipelago",
    "dominantTypes": [
      "Water",
      "Ice",
      "Rock"
    ],
    "climate": "Temperate",
    "areas": [
      "coastal-settlement",
      "ancient-reef",
      "time-pools"
    ],
    "description": "Coastal region with crystalline formations that preserve ancient marine life in suspended animation.",
    "elevation": "Sea Level - 600 ft",
    "wildlife": "Crystal Guardians, Frozen Ancients, Preservation Spirits",
    "resources": "Preservation Crystals, Ancient Ice, Time Shards",
    "lore": "The crystalline formations here act as natural time capsules, preserving ancient marine Monsters in perfect stasis. The crystals themselves pulse with temporal energy that can slow or accelerate time in small pockets.",
    "mapCoordinates": {
      "x": 35,
      "y": 70,
      "width": 25,
      "height": 18
    },
    "images": {
      "guide": "/images/maps/regions/crystal-cove-detailed.png"
    }
  },

  'volcanic-peaks': {
    "id": "volcanic-peaks",
    "name": "Volcanic Peaks",
    "landmassId": "conoocoo-archipelago",
    "dominantTypes": [
      "Fire",
      "Rock",
      "Ground"
    ],
    "climate": "Volcanic",
    "areas": [
      "emberforge-settlement",
      "sacred-caldera",
      "drakescale-ridge",
      "obsidian-halls"
    ],
    "description": "A stunning volcano in the center of the Primordial Jungle, where Fire-type Monsters and drake-like creatures soar above lava flows and molten rock.",
    "elevation": "500 - 4,200 ft",
    "wildlife": "Ember Drakes, Magma Guardians, Flame Sylphs",
    "resources": "Sacred Obsidian, Ember Lotus Petals, Crimson Iron",
    "lore": "For centuries, the Emberkin clans have made sacred pacts with the Great Forge Spirit deep beneath these islands. They believe every lava flow a blessing to temper their blades and strengthen their bond with the valley’s monstrous guardians.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 18,
      "height": 22
    },
    "images": {
      "guide": "/images/maps/regions/volcanic-peaks-detailed.png"
    }
  },

  'mist-marshlands': {
    "id": "mist-marshlands",
    "name": "Mist Marshlands",
    "landmassId": "conoocoo-archipelago",
    "dominantTypes": [
      "Water",
      "Grass",
      "Ghost"
    ],
    "climate": "Misty Prehistoric Wetland",
    "areas": [
      "mist-village",
      "fog-temple"
    ],
    "description": "Mysterious marshlands shrouded in perpetual mist, where water and grass-type ancients breed in secret.",
    "elevation": "50 - 400 ft",
    "wildlife": "Ancient Bog Spirits, Prehistoric Amphibians, Mist Weavers",
    "resources": "Ancient Moss, Mist Essence, Bog Minerals",
    "lore": "These marshlands are said to be the nursery of the ancient world, where the first amphibious Monsters emerged from primordial waters. The perpetual mist carries whispers of prehistoric times, and deep in the swamps, ancient breeding grounds still function as they did millions of years ago.",
    "mapCoordinates": {
      "x": 60,
      "y": 55,
      "width": 22,
      "height": 40
    },
    "images": {
      "guide": "/images/maps/regions/mist-marshlands-detailed.png"
    }
  },

  'nimbus-capital': {
    "id": "nimbus-capital",
    "name": "Nimbus Capital",
    "landmassId": "sky-isles",
    "dominantTypes": [
      "Flying",
      "Psychic",
      "Fairy"
    ],
    "climate": "Stratospheric Royal (Cloud Kingdom)",
    "areas": [
      "cloud-palace",
      "storm-district",
      "sky-harbor",
      "wind-gardens"
    ],
    "description": "The grand floating capital built on storm clouds, where sky kings rule from palaces of crystallized air.",
    "elevation": "8,000 - 12,000 ft",
    "wildlife": "Royal Sky Guardians, Cloud Architects, Storm Nobles",
    "resources": "Crystallized Air, Royal Wind Gems, Storm Silk",
    "lore": "The capital of the sky realm, where ancient sky kings rule from palaces built of solidified clouds and crystallized wind. The city follows celestial patterns, rotating through the sky on currents that only the sky-born can predict. Here, the greatest flying Monsters serve as royal guards and ambassadors to the ground world.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 20
    },
    "images": {
      "guide": "/images/maps/regions/nimbus-capital-detailed.png"
    }
  },

  'aurora-heights': {
    "id": "aurora-heights",
    "name": "Aurora Heights",
    "landmassId": "sky-isles",
    "dominantTypes": [
      "Psychic",
      "Ice",
      "Fairy"
    ],
    "climate": "Celestial Arctic Sky (Aurora Realm)",
    "areas": [
      "starlight-observatory",
      "aurora-village",
      "celestial-shrine",
      "shooting-star"
    ],
    "description": "Highest floating islands where aurora lights dance and celestial Monsters gather under starlight.",
    "elevation": "15,000 - 20,000 ft",
    "wildlife": "Aurora Dancers, Star Gazers, Celestial Messengers",
    "resources": "Aurora Crystals, Starlight Essence, Celestial Ice",
    "lore": "The highest realm of the sky isles, where the aurora borealis creates permanent light shows and celestial Monsters commune with the stars themselves. Here, psychic-type Monsters have developed the ability to read stellar patterns and predict cosmic events, serving as oracles for both sky and ground dwellers.",
    "mapCoordinates": {
      "x": 20,
      "y": 15,
      "width": 18,
      "height": 22
    },
    "images": {
      "guide": "/images/maps/regions/aurora-heights-detailed.png"
    }
  },

  'tempest-zones': {
    "id": "tempest-zones",
    "name": "Tempest Zones",
    "landmassId": "sky-isles",
    "dominantTypes": [
      "Electric",
      "Flying",
      "Steel"
    ],
    "climate": "Eternal Tempest (Storm Chaos)",
    "areas": [
      "lightning-city",
      "storm-riders",
      "thunder-arena",
      "electric-vortex"
    ],
    "description": "Chaotic sky regions where perpetual storms rage and electric-type sky dwellers thrive in lightning.",
    "elevation": "10,000 - 16,000 ft",
    "wildlife": "Storm Lords, Lightning Riders, Thunder Titans",
    "resources": "Pure Lightning, Storm Cores, Thunder Metals",
    "lore": "The most dangerous region of the sky isles, where eternal storms have raged for millennia. Electric-type Monsters here have evolved to feed directly on lightning and ride storm currents. Only the most skilled storm riders can navigate these chaotic winds, and legends say that mastering the tempest grants dominion over all weather.",
    "mapCoordinates": {
      "x": 65,
      "y": 50,
      "width": 20,
      "height": 25
    },
    "images": {
      "guide": "/images/maps/regions/tempest-zones-detailed.png"
    }
  },

  'draconic-abyss': {
    "id": "draconic-abyss",
    "name": "Draconic Abyss",
    "landmassId": "sky-isles",
    "dominantTypes": [
      "Dragon",
      "Fire",
      "Dark"
    ],
    "climate": "Infernal Sky Wasteland (Dragon's Domain)",
    "areas": [
      "bone-citadel",
      "wyrmclaw-village",
      "dragon-graveyard",
      "flame-chasm",
      "apex-throne"
    ],
    "description": "The most treacherous sky realm where ancient dragon lords rule from floating citadels of bone and flame, protected by the savage Wyrmclaw Tribe.",
    "elevation": "18,000 - 25,000 ft",
    "wildlife": "Ancient Dragon Lords, Wyrmclaw Tribal Warriors, Bone Drakes",
    "resources": "Dragon Bones, Infernal Crystals, Tribal Totems",
    "lore": "The highest and most dangerous realm of the sky isles, where only the most ancient and powerful dragons dare to dwell. The Wyrmclaw Tribe, descendants of humans who made pacts with dragons centuries ago, have adapted to this harsh environment through draconic rituals and blood bonds. They are fierce protectors of the dragon lords and will attack any outsiders on sight. The very air here burns with draconic energy, and survival requires both incredible skill and the dragons' blessing.",
    "mapCoordinates": {
      "x": 15,
      "y": 70,
      "width": 30,
      "height": 25
    },
    "images": {
      "guide": "/images/maps/regions/draconic-abyss-detailed.png"
    }
  },

};

// === REGION_DATA_END ===


// === AREA_DATA_START ===
export const areaConfigurations: AreaConfigurationsMap = {
  'adamant-peak': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to Adamant Peak, a razor-edged summit where molten veins harden into unbreakable crystal-steel spires.",
      "variations": [
        "Titanium basalt pillars jut from lava-chiseled ridges, humming with magnetic resonance.",
        "Steam plumes hiss through chromium vents as Steel and Rock hybrids test their mettle.",
        "Metallic slag waterfalls cool into mirror alloys reflecting the volcanic horizon."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Steel",
        "Rock",
        "Fire"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "B",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 45,
      "max": 85
    },
    "agroRange": {
      "min": 55,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Heat Shield Plating"
    },
    "specialEncounters": [
      {
        "type": "magnet_storm",
        "chance": 0.14,
        "description": "A geomagnetic surge realigns metallic monsters, provoking a territorial duel."
      },
      {
        "type": "crystal_steel_growth",
        "chance": 0.1,
        "description": "Adamant crystals erupt nearby, attracting rare Steel/Rock fusions."
      },
      {
        "type": "molten_core_guardian",
        "chance": 0.06,
        "description": "A core-plated guardian emerges from a cooling slag trench."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/adamant-peak-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "9,800 ft",
    "temperature": "85°F to 120°F (vent proximity)",
    "weatherPatterns": "Superheated updrafts, metallic dust flurries, magnetic pulses",
    "accessibility": "Requires Heat Shield Plating & climbing gear",
    "recommendedLevel": "55-75",
    "specialFeatures": [
      "Crystal-Steel Spires",
      "Magnet Surge Fields",
      "Slag Waterfalls",
      "Harmonic Ore Veins"
    ],
    "wildlife": [
      {
        "name": "Ferronyx",
        "species": "Steelix / MetalGreymon / Astegon",
        "type": "Steel/Rock",
        "rarity": "Rare",
        "description": "Serpentine ore wyrm whose segmented magnetic plates vibrate to deflect projectiles."
      },
      {
        "name": "Moltracore",
        "species": "Magmortar / SkullMeramon / Blazamut",
        "type": "Fire/Steel",
        "rarity": "Uncommon",
        "description": "Portable forge-beast whose arm vents extrude hardening alloy droplets mid-battle."
      },
      {
        "name": "Shardwing",
        "species": "Skarmory / Cyberdramon / Jetragon",
        "type": "Steel/Flying",
        "rarity": "Common",
        "description": "Glides between superheated thermals, scattering reflective flakes that distort targeting."
      }
    ],
    "resources": [
      {
        "name": "Adamant Lattice",
        "rarity": "Rare",
        "description": "Interlocked crystal-steel mesh ideal for high-grade armor cores."
      },
      {
        "name": "Magnetic Flux Core",
        "rarity": "Uncommon",
        "description": "Stabilized polarity nucleus harvested after magnet storms."
      },
      {
        "name": "Slag Glass",
        "rarity": "Common",
        "description": "Cooled metallic glass formed from rapid lava quenching."
      }
    ],
    "lore": "Said to be the mountain where the First Forge Spirit tempered dawnlight into metal.",
    "history": "Mining clans once warred over the harmonic veins until a molten collapse sealed most tunnels.",
    "dangers": [
      "Magnet storms",
      "Shattering spirefall",
      "Toxic metallic fumes",
      "Heat exhaustion"
    ],
    "tips": [
      "Carry polarity stabilizers",
      "Monitor core temperature",
      "Avoid fresh slag flows",
      "Anchor gear in gust zones"
    ],
    "description": "A razor-edged volcanic summit where molten veins harden into crystal-steel spires resonating with geomagnetic force.",
    "mapCoordinates": {
      "x": 25,
      "y": 65,
      "width": 20,
      "height": 25
    }
  },

  'agni-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to Agni City, the sacred mountain city where eternal flames burn and Fire-type Monsters perform ancient rituals!",
      "variations": [
        "Built into volcanic slopes with flowing lava channels, this city pulses with sacred fire energy.",
        "Sacred fire temples and purification ceremonies await in this mountain city of eternal flames.",
        "The volcanic slopes echo with the power of Fire-type Monsters and their sacred rituals."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire"
      ],
      "includeStages": [
        "base",
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 30,
      "max": 65
    },
    "agroRange": {
      "min": 40,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "fire_trial",
        "chance": 0.12,
        "description": "The sacred fire temples offer a trial of courage and purification!"
      },
      {
        "type": "lava_channel_guardian",
        "chance": 0.08,
        "description": "A powerful Fire-type guardian emerges from the flowing lava channels!"
      },
      {
        "type": "purification_ceremony",
        "chance": 0.15,
        "description": "Witness an ancient purification ceremony that strengthens the bond with Fire-type Monsters!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/agni-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "4000 ft",
    "temperature": "90°F to 120°F",
    "weatherPatterns": "Hot, frequent volcanic activity",
    "accessibility": "Heat protection required, spiritual preparation recommended",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Sacred Fire Temples",
      "Lava Channels",
      "Purification Ceremonies",
      "Fire Trials",
      "Volcanic Forges"
    ],
    "wildlife": [
      {
        "name": "Flame Guardian",
        "species": "Blaziken / Agunimon / Blazamut",
        "type": "Fire/Fighting",
        "rarity": "Rare",
        "description": "Sacred protectors of the fire temples"
      },
      {
        "name": "Lava Salamander",
        "species": "Salazzle / Agumon / Arsox",
        "type": "Fire/Ground",
        "rarity": "Uncommon",
        "description": "Creatures that swim through molten rock"
      },
      {
        "name": "Sacred Phoenix",
        "species": "Ho-Oh / Phoenixmon / Suzaku",
        "type": "Fire/Flying",
        "rarity": "Extreme",
        "description": "Extreme bird of rebirth and purification"
      }
    ],
    "resources": [
      {
        "name": "Sacred Ash",
        "rarity": "Rare",
        "description": "Ash from sacred fires with purifying properties"
      },
      {
        "name": "Volcanic Glass",
        "rarity": "Uncommon",
        "description": "Sharp obsidian formed by intense heat"
      },
      {
        "name": "Fire Crystals",
        "rarity": "Rare",
        "description": "Crystals that store and amplify heat energy"
      }
    ],
    "lore": "Agni City is built around the sacred flames of the ancient fire spirit, representing purification, sacrifice, and the divine spark within all life. The city serves as a center for spiritual purification.",
    "history": "Constructed by fire priests and devotees to honor the fire spirit and maintain the sacred flames. The city has weathered countless volcanic eruptions, each one strengthening the inhabitants' faith.",
    "dangers": [
      "Extreme heat",
      "Lava flows",
      "Volcanic eruptions",
      "Fire trials",
      "Spiritual tests"
    ],
    "tips": [
      "Wear fire-resistant protection",
      "Respect sacred ceremonies",
      "Undergo purification rituals",
      "Study fire safety procedures",
      "Bring heat-reducing items"
    ],
    "description": "Mountain city built into volcanic slopes, with sacred fire temples and flowing lava channels that power the entire settlement. The city embodies the purifying power of fire.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 30,
      "height": 25
    }
  },

  'amber-village': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "primordial-jungle",
    "regionName": "Primordial Jungle",
    "welcomeMessages": {
      "base": "Welcome to Amber Village—where time is trapped in honeyed stone and even the breeze smells prehistoric.",
      "variations": [
        "Sunlight glints through amber panes, casting fossil-shadows that feel almost… alive.",
        "Craftsfolk chip memory from resin—don’t blink, the past likes to stare back.",
        "Amber spiders skitter across market stalls, weaving threads that catch more than flies."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Rock",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "D",
        "E"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 10,
      "max": 20
    },
    "agroRange": {
      "min": 10,
      "max": 40
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "amber_resonance",
        "chance": 0.18,
        "description": "Fossilized resin hums—ancient species emerge at increased rates."
      },
      {
        "type": "paleontic_echo",
        "chance": 0.12,
        "description": "A time-lapse gust reveals a rare Bug/Rock variant preserved in amber sheen."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/amber-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "600 ft",
    "temperature": "70°F to 85°F",
    "weatherPatterns": "Warm, humid, occasional rain",
    "accessibility": "Guided tours available",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Amber Deposits",
      "Preserved Specimens",
      "Ancient DNA",
      "Time Capsules",
      "Amber Crafting Workshops"
    ],
    "wildlife": [
      {
        "name": "Amber Spider",
        "species": "Ariados / Arukenimon / Katress",
        "type": "Bug/Rock",
        "rarity": "Rare",
        "description": "Spiders that create webs of crystalline amber"
      },
      {
        "name": "Sap Fairy",
        "species": "Ribombee / Lillymon / Celaray",
        "type": "Fairy/Grass",
        "rarity": "Uncommon",
        "description": "Tiny fairies that help trees produce magical amber"
      },
      {
        "name": "Preserved Echo",
        "species": "Banette / Soulmon",
        "type": "Ghost/Normal",
        "rarity": "Rare",
        "description": "Spirits of creatures preserved in amber"
      }
    ],
    "resources": [
      {
        "name": "Living Amber",
        "rarity": "Extreme",
        "description": "Amber that continues to preserve and protect"
      },
      {
        "name": "DNA Samples",
        "rarity": "Rare",
        "description": "Genetic material from ancient creatures"
      },
      {
        "name": "Amber Crafts",
        "rarity": "Common",
        "description": "Beautiful jewelry and tools made from amber"
      }
    ],
    "lore": "Amber Village was founded by artisans who discovered that the jungle's amber deposits contained more than just preserved insects - they held entire ecosystems in suspended animation. The villagers have learned to work with this magical amber.",
    "history": "The village has existed for over 200 years, originally founded by amber miners who discovered the deposits' unique preservative properties. The village now serves as a center for amber crafting and preservation research.",
    "dangers": [
      "Amber mining accidents",
      "Preserved predators awakening",
      "Toxic sap exposure",
      "Unstable deposit collapses",
      "Ancient parasites"
    ],
    "tips": [
      "Wear protective gear when mining",
      "Learn to identify dangerous specimens",
      "Study amber safety procedures",
      "Support local craftsmen",
      "Respect preservation sites"
    ],
    "description": "Village built among ancient amber deposits that preserve creatures from millions of years ago in perfect crystalline tombs.",
    "mapCoordinates": {
      "x": 30,
      "y": 60,
      "width": 45,
      "height": 26
    }
  },

  'amphitrite-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to Amphitrite Town—tidal bells ring, priestesses chant, and the docks gleam with sea-blessed bronze.",
      "variations": [
        "Sea-silk banners ripple as salt spray kisses coral-tiled streets.",
        "Pearl shrines glow softly—offer a shell, gain a traveler’s blessing.",
        "Wavebreak terraces hum with water hymns; even the gulls sound reverent."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Fairy",
        "Electric"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "D"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 8,
      "max": 35
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "tide_blessing",
        "chance": 0.2,
        "description": "High tide empowers Water/Fairy moves and attracts rare support species."
      },
      {
        "type": "pearl_vigil",
        "chance": 0.1,
        "description": "Temple vigil yields a ritual encounter with a guardian attendant."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/amphitrite-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Sea level to 100 ft",
    "temperature": "68°F to 78°F",
    "weatherPatterns": "Gentle sea breezes, blessed calm waters",
    "accessibility": "Pilgrims and worshippers welcome",
    "recommendedLevel": "35+",
    "specialFeatures": [
      "Queen's Temples",
      "Sea Priestesses",
      "Ritual Pools",
      "Sacred Gardens",
      "Marriage Ceremonies"
    ],
    "wildlife": [
      {
        "name": "Temple Dolphin",
        "species": "Lanturn / Dolphmon / Ningyo",
        "type": "Water/Psychic",
        "rarity": "Rare",
        "description": "Sacred dolphins that serve in temple ceremonies"
      },
      {
        "name": "Blessing Starfish",
        "species": "Starmie / Starmon / Ningyo",
        "type": "Water/Fairy",
        "rarity": "Uncommon",
        "description": "Starfish that bless unions and partnerships"
      },
      {
        "name": "Sacred Seahorse",
        "species": "Seadra / Seadramon / Kappa",
        "type": "Water",
        "rarity": "Common",
        "description": "Gentle creatures that carry temple messages"
      }
    ],
    "resources": [
      {
        "name": "Wedding Pearls",
        "rarity": "Rare",
        "description": "Perfect pearls used in marriage ceremonies"
      },
      {
        "name": "Sacred Salt",
        "rarity": "Uncommon",
        "description": "Salt blessed by Amphitrite's priestesses"
      },
      {
        "name": "Ocean Flowers",
        "rarity": "Common",
        "description": "Beautiful sea anemones used in decorations"
      }
    ],
    "lore": "Amphitrite Town honors the Queen of the Seas, the sea lord's beloved consort. The town is famous for its wedding ceremonies, which are said to be blessed by the sea lady herself.",
    "history": "Founded by priestesses devoted to the sea lady, the town has become a pilgrimage site for those seeking the sea lady's blessing on their relationships and marriages.",
    "dangers": [
      "Romantic entanglements and drama",
      "Strict religious protocols",
      "Jealous sea spirits",
      "Emotional intensity of ceremonies"
    ],
    "tips": [
      "Respect temple traditions and ceremonies",
      "Bring appropriate offerings to the sea lady",
      "Dress modestly when visiting temples",
      "Participate respectfully in rituals",
      "Seek blessing for important relationships"
    ],
    "description": "Elegant coastal town dedicated to the sea lord's consort, where sea priestesses maintain temples and perform rituals to ensure bountiful seas and peaceful waters.",
    "mapCoordinates": {
      "x": 60,
      "y": 35,
      "width": 18,
      "height": 15
    }
  },

  'ancient-reef': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to the Ancient Reef, a living labyrinth of coral vaults and bioluminescent ruins.",
      "variations": [
        "Sunshafts pierce pelagic arches where Water/Psychic hybrids pulse with tidal memory.",
        "Crusted obelisks whisper sonar hymns awakening fossil polyps.",
        "Current-fed terraces bloom with neon anemones guarding relic chambers."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Psychic",
        "Grass",
        "Electric"
      ],
      "includeStages": [
        "base",
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 25,
      "max": 70
    },
    "agroRange": {
      "min": 30,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Advanced Diving Gear"
    },
    "specialEncounters": [
      {
        "type": "bioluminescent_bloom",
        "chance": 0.18,
        "description": "A synchronized coral glow reveals hidden reef denizens."
      },
      {
        "type": "sonar_echo_relic",
        "chance": 0.12,
        "description": "An ancient echo pulse unlocks a psychic relic guarded by hybrids."
      },
      {
        "type": "abyssal_upwelling",
        "chance": 0.07,
        "description": "Cold nutrient surge draws rare deepwater fusions upward."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/ancient-reef-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Sea Level (submerged terraces -120 ft)",
    "temperature": "58°F to 72°F",
    "weatherPatterns": "Tidal resonance pulses, plankton blooms, gentle current spirals",
    "accessibility": "Advanced Diving Gear & sonar navigator required",
    "recommendedLevel": "50-70",
    "specialFeatures": [
      "Memory Coral Vaults",
      "Luminescent Galleries",
      "Sonar Obelisks",
      "Relic Sediment Caverns"
    ],
    "wildlife": [
      {
        "name": "Neurokelp",
        "species": "Lanturn / Seadramon / Lovander",
        "type": "Water/Electric",
        "rarity": "Uncommon",
        "description": "Communicates via pulsed bioluminescence that entrains nearby schools."
      },
      {
        "name": "Reef Oracle",
        "species": "Slowking / Wisemon / Lunaris",
        "type": "Water/Psychic",
        "rarity": "Rare",
        "description": "Houses centuries of tidal data in its coral crown nodules."
      },
      {
        "name": "Shellspine Scout",
        "species": "Cloyster / Armadillomon / Pengullet",
        "type": "Water/Ice",
        "rarity": "Common",
        "description": "Rolls along reef ledges filtering microcrystals into defensive spines."
      }
    ],
    "resources": [
      {
        "name": "Memory Polyp",
        "rarity": "Rare",
        "description": "Coral node storing residual psychic impressions."
      },
      {
        "name": "Tidal Relic Shard",
        "rarity": "Uncommon",
        "description": "Weathered fragment from pre-flood structures."
      },
      {
        "name": "Glow Plankton Gel",
        "rarity": "Common",
        "description": "Viscous light-emitting suspension for alchemical inks."
      }
    ],
    "lore": "Local legends claim each moon cycle imprints a new layer of the world’s history into the reef.",
    "history": "Formed around submerged temples whose carvings now guide migrating hybrids.",
    "dangers": [
      "Disorienting biolight patterns",
      "Air depletion",
      "Hidden drop chasms",
      "Aggressive territorial eels"
    ],
    "tips": [
      "Map pulse intervals",
      "Carry redundant oxygen",
      "Avoid over-glow zones",
      "Use low-intensity lamps"
    ],
    "description": "A bioluminescent coral labyrinth where psychic tides preserve fossil memories in living polyps.",
    "mapCoordinates": {
      "x": 55,
      "y": 30,
      "width": 22,
      "height": 20
    }
  },

  'apex-throne': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "You stand before the Apex Throne, a caldera dais where converging jetstreams crown the mountain king.",
      "variations": [
        "Dragonfire thermals coil above obsidian ribs of the summit arena.",
        "Storm halos arc over rune-scored basalt where elite hybrids gather.",
        "A seismic heartbeat resonates through the throne plateaus, summoning apex predators."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Fire",
        "Flying",
        "Dark"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 60,
      "max": 100
    },
    "agroRange": {
      "min": 65,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Apex Sigil"
    },
    "specialEncounters": [
      {
        "type": "apex_convergence",
        "chance": 0.22,
        "description": "Jetstream and seismic pulse align spawning apex hybrid."
      },
      {
        "type": "obsidian_resonance",
        "chance": 0.11,
        "description": "Basalt rune flare elevates Dragon/Fire synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/apex-throne-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "10,500 ft (caldera rim)",
    "temperature": "70°F to 105°F (volatile spikes)",
    "weatherPatterns": "Jetstream shears, ash vortices, thermal roar cycles",
    "accessibility": "Apex Sigil & flight or advanced climbing harness",
    "recommendedLevel": "80-100",
    "specialFeatures": [
      "Dominance Ring Terraces",
      "Basalt Resonance Pillars",
      "Jetstream Funnels",
      "Trial Scar Ridges"
    ],
    "wildlife": [
      {
        "name": "Pyrodrake Regent",
        "species": "Charizard / KaiserGreymon / Jetragon",
        "type": "Fire/Dragon",
        "rarity": "Rare",
        "description": "Marks territory with spiral thermal updraft signatures."
      },
      {
        "name": "Umbra Talon",
        "species": "Honchkrow / Devimon / Necromus",
        "type": "Dark/Flying",
        "rarity": "Uncommon",
        "description": "Circles battle rings awaiting weakened challengers."
      },
      {
        "name": "Seismiscar",
        "species": "Garchomp / SkullGreymon / Blazamut",
        "type": "Dragon/Ground",
        "rarity": "Common",
        "description": "Burrows through semi-molten layers creating tremor pitfalls."
      }
    ],
    "resources": [
      {
        "name": "Apex Ember Crest",
        "rarity": "Rare",
        "description": "Coal-black plate etched by dominance trial flames."
      },
      {
        "name": "Jetstream Feather",
        "rarity": "Uncommon",
        "description": "Aerodynamically perfect vane accelerating skill channeling."
      },
      {
        "name": "Seismic Core Fragment",
        "rarity": "Common",
        "description": "Vibration-damped shard used in stabilization gear."
      }
    ],
    "lore": "Only those whose roar resonates with the caldera’s pulse may sit upon the throne stones.",
    "history": "Site of historic convergence cycles where regional lineages determined succession.",
    "dangers": [
      "Multi-front ambushes",
      "Thermal shear gusts",
      "Ash inhalation",
      "Molten rim collapses"
    ],
    "tips": [
      "Monitor tremor cadence",
      "Bring respiratory filters",
      "Limit prolonged hovering",
      "Engage one challenger at a time"
    ],
    "description": "Caldera dais crowned by converging jetstreams where apex predators contest volcanic sovereignty.",
    "mapCoordinates": {
      "x": 40,
      "y": 65,
      "width": 20,
      "height": 20
    }
  },

  'apollo-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to Apollo Temple, a sun-ray sanctum with heliotropic mirrors channeling radiant fire.",
      "variations": [
        "Gold-inlaid pylons focus solar flares into prismatic corridors.",
        "Incense thermals lift embers forming constellation glyphs midair.",
        "Solar braziers ring harmonic chimes guiding Fire/Psychic acolytes."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "B",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 40,
      "max": 90
    },
    "agroRange": {
      "min": 45,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Solar Lens Key"
    },
    "specialEncounters": [
      {
        "type": "solar_alignment",
        "chance": 0.2,
        "description": "Mirror arrays align—radiant hybrids manifest empowered."
      },
      {
        "type": "incense_vision",
        "chance": 0.12,
        "description": "Psychic flame haze grants foresight, improving encounter quality."
      },
      {
        "type": "glyph_guardian",
        "chance": 0.07,
        "description": "A sigil-bound guardian tests your resolve."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/apollo-temple-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "8,900 ft",
    "temperature": "75°F to 115°F (solar alignments)",
    "weatherPatterns": "Solar beam refractions, incense thermals, prismatic haze",
    "accessibility": "Solar Lens Key & flame rite attunement",
    "recommendedLevel": "60-80",
    "specialFeatures": [
      "Mirror Array Plazas",
      "Glyph Projection Vault",
      "Incense Therm Columns",
      "Radiant Choir Chamber"
    ],
    "wildlife": [
      {
        "name": "Solar Seraph",
        "species": "Espeon / Angewomon / Paladius",
        "type": "Psychic/Fairy",
        "rarity": "Rare",
        "description": "Radiant wings refract coherent light into sigil shields."
      },
      {
        "name": "Flare Oracle",
        "species": "Ninetales / Wisemon / Lovander",
        "type": "Fire/Psychic",
        "rarity": "Uncommon",
        "description": "Tail embers trace predictive solar glyph arcs."
      },
      {
        "name": "Helio Sprite",
        "species": "Clefairy / Candlemon / Foxparks",
        "type": "Fairy/Fire",
        "rarity": "Common",
        "description": "Drifts between mirror pedestals maintaining luminous resonance."
      }
    ],
    "resources": [
      {
        "name": "Prism Core",
        "rarity": "Rare",
        "description": "Facet crystal storing concentrated aligned sunlight."
      },
      {
        "name": "Incense Ash Resin",
        "rarity": "Uncommon",
        "description": "Catalytic binder improving focus rituals."
      },
      {
        "name": "Mirror Shard Filament",
        "rarity": "Common",
        "description": "Flexible reflective thread for beam routing."
      }
    ],
    "lore": "Built where dawn’s first ray once ignited an eternal wick.",
    "history": "Expanded by pilgrimage orders refining heliomancy over generations.",
    "dangers": [
      "Retina scorch risk",
      "Overheated mirror arrays",
      "Glyph guardian trials"
    ],
    "tips": [
      "Wear lens filters",
      "Time entry off-peak",
      "Respect silence during hymn resonance"
    ],
    "description": "Heliotropic sanctum whose mirrored pylons focus solar flares into radiant hymn corridors.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 16,
      "height": 18
    }
  },

  'atlantis-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to Atlantis City, the magnificent underwater capital with crystal domes and flowing water streets!",
      "variations": [
        "Crystal domes protect this underwater marvel where Water-type Monsters rule the flowing streets.",
        "The sea palace rises majestically in this underwater city of crystal and flowing water.",
        "Underwater markets and crystal architecture create a breathtaking aquatic metropolis."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Psychic"
      ],
      "includeStages": [
        "base",
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 30,
      "max": 65
    },
    "agroRange": {
      "min": 35,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Diving Gear"
    },
    "specialEncounters": [
      {
        "type": "sea_palace_audience",
        "chance": 0.1,
        "description": "The rulers of the sea palace grant you an audience in their crystal throne room!"
      },
      {
        "type": "underwater_market",
        "chance": 0.18,
        "description": "The bustling underwater markets offer rare treasures and monster encounters!"
      },
      {
        "type": "crystal_dome_mystery",
        "chance": 0.12,
        "description": "Ancient mysteries hidden within the crystal domes reveal themselves!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/atlantis-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "-200 ft",
    "temperature": "70°F to 80°F",
    "weatherPatterns": "Underwater currents, bioluminescent tides",
    "accessibility": "Advanced diving equipment required, aquatic breathing recommended",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Crystal Domes",
      "Water Streets",
      "Sea Palace",
      "Underwater Markets",
      "Coral Architecture"
    ],
    "wildlife": [
      {
        "name": "Sea Noble",
        "species": "Primarina / Neptunemon / Kappa",
        "type": "Water/Psychic",
        "rarity": "Rare",
        "description": "Elegant rulers of the underwater realm"
      },
      {
        "name": "Leviathan Guard",
        "species": "Gyarados / Leviamon / Yamata-no-Orochi",
        "type": "Water/Dragon",
        "rarity": "Extreme",
        "description": "Massive sea dragons that protect the city"
      },
      {
        "name": "Coral Architect",
        "species": "Corsola / Shellmon / Kappa",
        "type": "Water/Rock",
        "rarity": "Uncommon",
        "description": "Creatures that shape the living city structures"
      }
    ],
    "resources": [
      {
        "name": "Divine Pearls",
        "rarity": "Extreme",
        "description": "Pearls blessed by the sea lord himself"
      },
      {
        "name": "Sea Crystal",
        "rarity": "Rare",
        "description": "Crystallized seawater with magical properties"
      },
      {
        "name": "Royal Kelp",
        "rarity": "Uncommon",
        "description": "Rare seaweed used in underwater construction"
      }
    ],
    "lore": "Atlantis City serves as the magnificent capital of the sea lord's underwater kingdom, where ancient oceanic power merged with divine will to create an eternal underwater paradise.",
    "history": "Built by ancient sea peoples with the sea lord's blessing and protection. The city has stood beneath the waves for over two millennia, growing more beautiful with each passing century.",
    "dangers": [
      "Drowning risk without proper equipment",
      "Water pressure at depth",
      "Territorial sea guardians",
      "Court politics and intrigue",
      "Powerful underwater currents"
    ],
    "tips": [
      "Master underwater breathing techniques",
      "Respect sea nobility and customs",
      "Bring diving gear as backup",
      "Learn basic mer-folk etiquette",
      "Navigate by bioluminescent markers"
    ],
    "description": "Magnificent underwater city with crystal domes and flowing water streets, capital of the sea realm where merfolk nobility rules over coral palaces.",
    "mapCoordinates": {
      "x": 30,
      "y": 40,
      "width": 35,
      "height": 30
    }
  },

  'aurora-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Aurora Village, a crystalline hamlet illuminated nightly by dancing sky veils.",
      "variations": [
        "Ice lanterns refract auroral bands into tranquil courtyards.",
        "Soft geothermal vents warm communal circles beneath emerald lights.",
        "Snowglass cabins hum as Ice/Fairy companions weave shimmer trails."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Fairy",
        "Electric"
      ],
      "includeStages": [
        "base",
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "D",
        "E",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 5,
      "max": 35
    },
    "agroRange": {
      "min": 10,
      "max": 40
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "aurora_bloom",
        "chance": 0.22,
        "description": "Peak aurora intensity soothes wild monsters, easing bonding."
      },
      {
        "type": "crystal_carving_circle",
        "chance": 0.15,
        "description": "Villagers carve focusing prisms that attract Fairy hybrids."
      },
      {
        "type": "glacial_echo",
        "chance": 0.08,
        "description": "A harmonic ice echo reveals a hidden den."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/aurora-village-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "3,200 ft",
    "temperature": "-10°F to 25°F",
    "weatherPatterns": "Calm frost haze, aurora curtains, gentle diamond dust",
    "accessibility": "Maintained ice paths (basic cold gear)",
    "recommendedLevel": "10-30",
    "specialFeatures": [
      "Snowglass Cabins",
      "Aurora Prism Lanterns",
      "Geothermal Hearth Circles",
      "Crystal Carving Workshops"
    ],
    "wildlife": [
      {
        "name": "Glint Hare",
        "species": "Buneary / IceLeomon / Pengullet",
        "type": "Ice/Fairy",
        "rarity": "Common",
        "description": "Leaps create micro-auroral spark trails used for navigation games."
      },
      {
        "name": "Frost Pixie",
        "species": "Alcremie / Lilamon / Chillet",
        "type": "Fairy/Ice",
        "rarity": "Uncommon",
        "description": "Weaves shimmering flurries that calm agitated beasts."
      },
      {
        "name": "Volt Puff",
        "species": "Pachirisu / Patamon / Sparkit",
        "type": "Electric/Ice",
        "rarity": "Uncommon",
        "description": "Stores static charge harvested from auroral curtains."
      }
    ],
    "resources": [
      {
        "name": "Aurora Shard",
        "rarity": "Uncommon",
        "description": "Refractive ice crystal retaining faint spectral glow."
      },
      {
        "name": "Geothermal Moss",
        "rarity": "Common",
        "description": "Warm cushion plant used in insulation packs."
      },
      {
        "name": "Prism Lantern Core",
        "rarity": "Rare",
        "description": "Stabilized light nucleus improving visibility in blizzards."
      }
    ],
    "lore": "Villagers believe each aurora ribbon is a woven promise from ancestral guardians.",
    "history": "Founded around a geothermal spring that prevented total winter isolation.",
    "dangers": [
      "Frostbite risk",
      "Sudden whiteout squalls",
      "Thin ice pockets"
    ],
    "tips": [
      "Layer insulation",
      "Follow prism markers",
      "Carry heat stones",
      "Limit exposure during wind shifts"
    ],
    "description": "Crystalline hamlet illuminated nightly by dancing auroral veils refracted through snowglass arches.",
    "mapCoordinates": {
      "x": 15,
      "y": 50,
      "width": 20,
      "height": 18
    }
  },

  'avalon-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to Avalon City, a mist-crowned floating bastion where waterfalls descend into levitating terraced lakes.",
      "variations": [
        "Runic aqueduct rings suspend luminescent koi-drake hybrids above the sea.",
        "Mist bridges braid between isles seeded with Water/Fairy sanctums.",
        "Skyward fountains cycle through gravity inversions energizing Electric currents."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Fairy",
        "Electric",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "B",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 3
    },
    "levelRange": {
      "min": 50,
      "max": 95
    },
    "agroRange": {
      "min": 55,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Aerial Navigators Pass"
    },
    "specialEncounters": [
      {
        "type": "gravity_surge",
        "chance": 0.16,
        "description": "A levitation field spike causes rare aerial Water hybrids to appear."
      },
      {
        "type": "mist_court_audience",
        "chance": 0.11,
        "description": "The crystalline mist court grants you a temporary blessing."
      },
      {
        "type": "runic_resonance",
        "chance": 0.07,
        "description": "Runic aqueducts resonate, luring Psychic/Fairy emissaries."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/avalon-city-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "1,500 ft (levitating platforms)",
    "temperature": "60°F to 78°F",
    "weatherPatterns": "Persistent mist veils, gravity inversion drifts, ionized spray arcs",
    "accessibility": "Aerial Navigators Pass or teleport conduit",
    "recommendedLevel": "75-95",
    "specialFeatures": [
      "Levitating Terrace Lakes",
      "Runic Aqueduct Rings",
      "Mist Court Plaza",
      "Inversion Fountains"
    ],
    "wildlife": [
      {
        "name": "Aquaflare Koi",
        "species": "Milotic / MarineAngemon / Lovander",
        "type": "Water/Fairy",
        "rarity": "Uncommon",
        "description": "Glides through midair water loops leaving glitter wake currents."
      },
      {
        "name": "Nimbus Ray",
        "species": "Mantine / MagnaAngemon / Jetragon",
        "type": "Water/Flying",
        "rarity": "Rare",
        "description": "Skims inversion fountains harvesting charged mist."
      },
      {
        "name": "Runic Sentinel",
        "species": "Bronzong / Guardromon / Paladius",
        "type": "Steel/Psychic",
        "rarity": "Uncommon",
        "description": "Patrol automaton stabilizing aqueduct rune cycles."
      }
    ],
    "resources": [
      {
        "name": "Inversion Core Droplet",
        "rarity": "Rare",
        "description": "Condensed anti-grav moisture nucleus."
      },
      {
        "name": "Runic Aquifer Seal",
        "rarity": "Uncommon",
        "description": "Inscribed disc regulating water levitation flow."
      },
      {
        "name": "Mist Essence",
        "rarity": "Common",
        "description": "Charged vapor condensate for alchemical cooling."
      }
    ],
    "lore": "Founded by hydromancers seeking to liberate water from terrestrial bounds.",
    "history": "Expanded ring by ring as levitation matrix stability improved.",
    "dangers": [
      "Slip overfall edges",
      "Matrix destabilization surges",
      "Runic overload arcs"
    ],
    "tips": [
      "Maintain balance tethers",
      "Respect court protocols",
      "Monitor inversion gauge",
      "Avoid saturated rune nodes"
    ],
    "description": "Mist-crowned floating bastion of terraced lakes and runic aqueduct rings suspended above cascading falls.",
    "mapCoordinates": {
      "x": 35,
      "y": 45,
      "width": 25,
      "height": 20
    }
  },

  'bog-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "crowsfoot-marsh",
    "regionName": "Crowsfoot Marsh",
    "welcomeMessages": {
      "base": "Welcome to Bog Town—stilt-steps, reed roofs, and lanterns that keep the fog polite.",
      "variations": [
        "Peat barges creak through channels while frog-drummers keep time at dusk.",
        "Guides tap boardwalk posts—one for depth, two for danger, three for dinner.",
        "If the path moves, it’s a log. If it waves back, it’s not."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Poison",
        "Bug",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 7,
      "max": 17
    },
    "agroRange": {
      "min": 15,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "peat_mist",
        "chance": 0.22,
        "description": "Marsh gas shrouds the docks—Poison types surge with evasive boons."
      },
      {
        "type": "lantern_swarm",
        "chance": 0.12,
        "description": "Will-o’-wisps lure out rare Bug/Grass predators along the reeds."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/bog-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "20 ft",
    "temperature": "68°F to 82°F",
    "weatherPatterns": "Humid, frequent morning mists, seasonal flooding",
    "accessibility": "Marsh guides and swamp dwellers",
    "recommendedLevel": "35+",
    "specialFeatures": [
      "Stilt Architecture",
      "Marsh Navigation",
      "Peat Harvesting",
      "Wetland Ecology",
      "Guide Services"
    ],
    "wildlife": [
      {
        "name": "Marsh Gator",
        "species": "Krookodile / Seadramon / Broncherry",
        "type": "Water/Ground",
        "rarity": "Common",
        "description": "Large reptiles that patrol the waterways"
      },
      {
        "name": "Will O' Wisp",
        "species": "Lampent / Candlemon",
        "type": "Ghost/Fire",
        "rarity": "Uncommon",
        "description": "Mysterious lights that lead travelers astray"
      },
      {
        "name": "Bog Turtle",
        "species": "Carracosta / Kamemon / Fuack",
        "type": "Water/Rock",
        "rarity": "Common",
        "description": "Sturdy turtles adapted to marsh life"
      }
    ],
    "resources": [
      {
        "name": "Peat Fuel",
        "rarity": "Common",
        "description": "Slow-burning fuel harvested from the bog"
      },
      {
        "name": "Marsh Maps",
        "rarity": "Uncommon",
        "description": "Navigation charts of the dangerous wetlands"
      },
      {
        "name": "Swamp Gear",
        "rarity": "Common",
        "description": "Equipment for traveling through marshes"
      }
    ],
    "lore": "Bog Town represents the resilience of people who choose to live in harmony with harsh environments, making the most of what the wetlands provide.",
    "history": "Founded by settlers who discovered the bog's resources and learned to thrive in the challenging marsh environment through ingenuity and cooperation.",
    "dangers": [
      "Getting lost in the marsh",
      "Quicksand and bog holes",
      "Dangerous marsh creatures",
      "Seasonal flooding",
      "Misleading will o' wisps"
    ],
    "tips": [
      "Hire local guides for marsh travel",
      "Stay on marked paths",
      "Carry marsh navigation tools",
      "Learn to identify quicksand",
      "Respect the wetland ecosystem"
    ],
    "description": "Rustic town built on stilts above the marsh waters, where hardy folk make their living harvesting peat, hunting marsh creatures, and guiding travelers through the wetlands.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'bone-citadel': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to the Bone Citadel, a necro-glacial fortress grown from titan rib arches and permafrost marrow.",
      "variations": [
        "Wind howls through hollow titan spines, producing mournful organ tones.",
        "Frost-rimed ossuaries shimmer with aurora reflections in carved marrow windows.",
        "Runic femur pylons pulse dimly, guiding lost travelers—if they are worthy."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Ghost",
        "Dark"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 60,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Bone Wayfinder Sigil"
    },
    "specialEncounters": [
      {
        "type": "ossuary_echo",
        "chance": 0.18,
        "description": "Resonant bone chimes awaken a spectral guardian."
      },
      {
        "type": "aurora_requiem",
        "chance": 0.12,
        "description": "Auroral surge empowers Ice/Ghost hybrids."
      },
      {
        "type": "marrow_seal_break",
        "chance": 0.07,
        "description": "A sealed crypt fractures, releasing an ancient fusion."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/bone-citadel-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "6,400 ft",
    "temperature": "-30°F to -5°F",
    "weatherPatterns": "Polar winds, aurora refractions, bone dust flurries",
    "accessibility": "Requires Bone Wayfinder Sigil",
    "recommendedLevel": "70-95",
    "specialFeatures": [
      "Titan Rib Arches",
      "Marrow Crypt Galleries",
      "Aurora Ossuaries",
      "Runic Femur Pylons"
    ],
    "wildlife": [
      {
        "name": "Frost Ossilord",
        "species": "Froslass / SkullGreymon / Chillet",
        "type": "Ice/Ghost",
        "rarity": "Rare",
        "description": "Commands fragment swarms that assemble into bone shields."
      },
      {
        "name": "Marrow Warden",
        "species": "Avalugg / Andromon / Wumpo",
        "type": "Ice/Steel",
        "rarity": "Uncommon",
        "description": "Patrols vault corridors reinforcing permafrost plate seams."
      },
      {
        "name": "Rib Echo",
        "species": "Duskull / Bakemon / Foxparks",
        "type": "Ghost/Fairy",
        "rarity": "Common",
        "description": "Faint spirit that amplifies auroral sound waves."
      }
    ],
    "resources": [
      {
        "name": "Frozen Marrow Core",
        "rarity": "Rare",
        "description": "Dense nutrient crystal used in high-tier restoration brews."
      },
      {
        "name": "Aurora Oss Dust",
        "rarity": "Uncommon",
        "description": "Powdered bone that refracts ritual light."
      },
      {
        "name": "Rib Chime Shard",
        "rarity": "Common",
        "description": "Hollow sliver producing resonant tones."
      }
    ],
    "lore": "Said to have formed where a primordial titan fell and merged with eternal frost.",
    "history": "Expanded by frost clerics binding stray spirits into structural lattice.",
    "dangers": [
      "Bone collapse zones",
      "Spectral ambushes",
      "Deep frost exposure"
    ],
    "tips": [
      "Carry thermal wards",
      "Track echo resonance",
      "Avoid uncharted crypt shafts"
    ],
    "description": "Necro-glacial fortress grown from titan rib arches and permafrost marrow vaults.",
    "mapCoordinates": {
      "x": 45,
      "y": 30,
      "width": 25,
      "height": 20
    }
  },

  'bone-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Bone Town, a frontier settlement built from cleaned giant remains and packed snow mortar.",
      "variations": [
        "Smoke curls from marrow-hollow chimneys lining the frozen thoroughfare.",
        "Bone totems ward off restless spirits as traders barter frost-salvaged relics.",
        "Children carve runes into scrap vertebrae, learning ancestral scripts."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Ghost",
        "Normal"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 25,
      "max": 55
    },
    "agroRange": {
      "min": 25,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "spirit_markets",
        "chance": 0.2,
        "description": "A transient spirit bazaar offers rare barter."
      },
      {
        "type": "bone_weather_shift",
        "chance": 0.1,
        "description": "Sudden chill animates decorative totems."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/bone-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "5,900 ft",
    "temperature": "-20°F to 10°F",
    "weatherPatterns": "Gentle drift, occasional crystal squalls",
    "accessibility": "Maintained bone causeway",
    "recommendedLevel": "30-55",
    "specialFeatures": [
      "Bone Market Row",
      "Totem Workshop",
      "Marrow Forge"
    ],
    "wildlife": [
      {
        "name": "Totem Prowler",
        "species": "Sneasel / BlackGatomon / Pengullet",
        "type": "Ice/Dark",
        "rarity": "Uncommon",
        "description": "Guards carved totems from scavengers."
      },
      {
        "name": "Chime Lynx",
        "species": "Glaceon / Mikemon / Mau",
        "type": "Ice/Fairy",
        "rarity": "Common",
        "description": "Tail bells ring to warn of frost spirits."
      },
      {
        "name": "Scrap Geist",
        "species": "Shuppet / Candlemon / Foxparks",
        "type": "Ghost/Normal",
        "rarity": "Common",
        "description": "Animated trinket cluster roaming alleys."
      }
    ],
    "resources": [
      {
        "name": "Bone Bead",
        "rarity": "Common",
        "description": "Carved token used as local currency marker."
      },
      {
        "name": "Marrow Wax",
        "rarity": "Uncommon",
        "description": "Insulating sealant for cold gear seams."
      },
      {
        "name": "Frost Totem Chip",
        "rarity": "Rare",
        "description": "Runic fragment retaining minor ward charge."
      }
    ],
    "lore": "Built by traders who settled near ossuary salvage routes.",
    "history": "Grew as a neutral exchange point between roaming frost clans.",
    "dangers": [
      "Spirit pickpockets",
      "Frost nip",
      "Loose vertebra debris"
    ],
    "tips": [
      "Secure packs",
      "Warm hands often",
      "Support local artisans"
    ],
    "description": "Frontier settlement built from cleaned giant remains and packed snow mortar.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'bonfire-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hearthfall-commons",
    "regionName": "Hearthfall Commons",
    "welcomeMessages": {
      "base": "Welcome to Bonfire Town—the eternal flame, the louder stories, and the best roasted anything.",
      "variations": [
        "Festival drums sync with crackling embers; strangers become friends by the second verse.",
        "Pass a mug, share a tale—if the fire pops, it agrees with you.",
        "Lanterns bob like fireflies; the night market glows with ember-kissed treats."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Normal",
        "Fire",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 5,
      "max": 15
    },
    "agroRange": {
      "min": 5,
      "max": 35
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "ember_circle",
        "chance": 0.2,
        "description": "Story circle heat boosts Fire/Fairy support effects."
      },
      {
        "type": "wandering_minstrel",
        "chance": 0.1,
        "description": "A traveling bard summons a rare Normal companion to the bonfire."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/bonfire-town-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "450 ft",
    "temperature": "50°F to 70°F",
    "weatherPatterns": "Warm around the bonfire, mild elsewhere",
    "accessibility": "Open to all visitors",
    "recommendedLevel": "5+",
    "specialFeatures": [
      "Eternal Bonfire",
      "Storytelling Circles",
      "Night Markets",
      "Song Festivals",
      "Dancing Grounds"
    ],
    "wildlife": [
      {
        "name": "Fire Cricket",
        "species": "Larvesta / Tentomon / Flambelle",
        "type": "Fire/Bug",
        "rarity": "Common",
        "description": "Insects that sing around the eternal flame"
      },
      {
        "name": "Story Sprite",
        "species": "Cleffa / Fairymon / Fuack",
        "type": "Fairy/Psychic",
        "rarity": "Uncommon",
        "description": "Tiny fairies that collect and share stories"
      },
      {
        "name": "Festival Bird",
        "species": "Chatot / Piyomon / Killamari",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Colorful birds that perform during celebrations"
      }
    ],
    "resources": [
      {
        "name": "Festival Food",
        "rarity": "Common",
        "description": "Traditional celebration foods and treats"
      },
      {
        "name": "Eternal Embers",
        "rarity": "Rare",
        "description": "Embers from the sacred fire that never die"
      },
      {
        "name": "Story Scrolls",
        "rarity": "Uncommon",
        "description": "Written tales from traveling storytellers"
      }
    ],
    "lore": "The eternal bonfire has burned for over 500 years, fueled by community spirit and magical flames. Legend says that any story told by the fire becomes part of the town's eternal memory.",
    "history": "Founded around a natural eternal flame discovered by early northern settlers. The town grew as travelers stopped to rest and share their tales by the warming fire.",
    "dangers": [
      "Fire safety near bonfire",
      "Crowded during festivals",
      "Late night revelry"
    ],
    "tips": [
      "Bring stories to share",
      "Stay for the evening festivities",
      "Respect the sacred flame",
      "Join in the traditional dances",
      "Try roasted festival treats"
    ],
    "description": "A lively town centered around a perpetual bonfire where stories and warmth are shared among all visitors. The eternal flame serves as both a beacon and a gathering point for travelers.",
    "mapCoordinates": {
      "x": 60,
      "y": 30,
      "width": 18,
      "height": 15
    }
  },

  'cairn-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Cairn Town, where stacked rune-stones track migratory ice flows and celestial drift.",
      "variations": [
        "Fresh cairns bloom overnight—mystics say the glacier spirits rebuild them.",
        "Frost lichen paints glowing sigils across guardian stones.",
        "Wind-carved monolith alleys hum at dawn with harmonic resonance."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Rock",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 20,
      "max": 50
    },
    "agroRange": {
      "min": 20,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "cairn_alignment",
        "chance": 0.16,
        "description": "Stone lines align—rare Rock/Ice hybrid appears."
      },
      {
        "type": "lichen_glow",
        "chance": 0.11,
        "description": "Bioluminescent lichen attracts Fairy allies."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/cairn-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "5,500 ft",
    "temperature": "-15°F to 15°F",
    "weatherPatterns": "Stable cold, aurora bands, rune glow fog",
    "accessibility": "Marked cairn path network",
    "recommendedLevel": "25-50",
    "specialFeatures": [
      "Alignment Plazas",
      "Rune Lichen Walls",
      "Stone Forecast Grid"
    ],
    "wildlife": [
      {
        "name": "Runestone Pup",
        "species": "Rockruff / Terriermon / Depresso",
        "type": "Rock/Fairy",
        "rarity": "Common",
        "description": "Carries small engraved pebbles to elders."
      },
      {
        "name": "Glacier Skink",
        "species": "Snom / Icemon / Surfent",
        "type": "Ice/Bug",
        "rarity": "Common",
        "description": "Adheres to rune faces absorbing frost patterns."
      },
      {
        "name": "Cairn Watcher",
        "species": "Graveler / Golemon / Mossanda",
        "type": "Rock/Ice",
        "rarity": "Uncommon",
        "description": "Rearranges itself to correct misaligned markers."
      }
    ],
    "resources": [
      {
        "name": "Rune Flake",
        "rarity": "Common",
        "description": "Thin chipped slate with residual sigil trace."
      },
      {
        "name": "Lichen Spore Pouch",
        "rarity": "Uncommon",
        "description": "Bioluminescent seed cluster for marking routes."
      },
      {
        "name": "Alignment Core Stone",
        "rarity": "Rare",
        "description": "Perfectly balanced geode aiding calibration."
      }
    ],
    "lore": "Every cairn shadow at solstice is recorded in village annals.",
    "history": "Founded by migratory chart keepers mapping permafrost drift.",
    "dangers": [
      "Whiteout disorientation",
      "Falling marker stacks"
    ],
    "tips": [
      "Log shadow lengths",
      "Carry spare markers",
      "Follow lichen glow at dusk"
    ],
    "description": "Stone cairn settlement where stacked rune-stones track migratory ice flows.",
    "mapCoordinates": {
      "x": 60,
      "y": 30,
      "width": 20,
      "height": 18
    }
  },

  'cauldron-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "crowsfoot-marsh",
    "regionName": "Crowsfoot Marsh",
    "welcomeMessages": {
      "base": "Welcome to Cauldron Village—where every doorstep bubbles and the air tastes faintly of mint and mystery.",
      "variations": [
        "Herb bundles sway from rafters; kettles gossip in little steams.",
        "Potion smoke curls into sigils—if it winks, you got the good batch.",
        "Market stalls clink with glass—bring a vial, leave with a story."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Poison",
        "Grass",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 9,
      "max": 19
    },
    "agroRange": {
      "min": 12,
      "max": 42
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "brew_bloom",
        "chance": 0.22,
        "description": "A lucky brew spikes Grass/Poison spawns with supportive buffs."
      },
      {
        "type": "smoke_sign",
        "chance": 0.12,
        "description": "A sigil in the steam beckons a rare Ghost apothecary familiar."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/cauldron-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "30 ft",
    "temperature": "70°F to 80°F",
    "weatherPatterns": "Steamy from magical cauldrons, aromatic mists",
    "accessibility": "Alchemists and potion enthusiasts welcome",
    "recommendedLevel": "45+",
    "specialFeatures": [
      "Potion Brewing",
      "Alchemy Workshops",
      "Ingredient Gardens",
      "Magic Cauldrons",
      "Recipe Exchanges"
    ],
    "wildlife": [
      {
        "name": "Cauldron Toad",
        "species": "Seismitoad / Gekomon / Relaxaurus",
        "type": "Poison/Water",
        "rarity": "Common",
        "description": "Amphibians whose secretions are used in potions"
      },
      {
        "name": "Herb Fairy",
        "species": "Flabébé / Palmon",
        "type": "Fairy/Grass",
        "rarity": "Uncommon",
        "description": "Tiny fairies that tend magical ingredient gardens"
      },
      {
        "name": "Brew Bat",
        "species": "Zubat / DemiDevimon / Lunaris",
        "type": "Poison/Flying",
        "rarity": "Common",
        "description": "Bats that help identify potion ingredients"
      }
    ],
    "resources": [
      {
        "name": "Magical Potions",
        "rarity": "Rare",
        "description": "Powerful brews with various magical effects"
      },
      {
        "name": "Alchemy Ingredients",
        "rarity": "Common",
        "description": "Raw materials for potion-making"
      },
      {
        "name": "Recipe Books",
        "rarity": "Uncommon",
        "description": "Collections of potion formulas"
      }
    ],
    "lore": "Cauldron Village represents the lighter side of marsh magic, focusing on helpful potions and beneficial alchemy rather than dark curses and hexes.",
    "history": "Established by friendly hedge witches who wanted to use their knowledge to help others, the village has become known for its healing potions and magical remedies.",
    "dangers": [
      "Potion explosions",
      "Toxic ingredient exposure",
      "Magical accidents",
      "Ingredient allergies",
      "Experimental brew failures"
    ],
    "tips": [
      "Learn basic alchemy safety",
      "Ask before touching ingredients",
      "Trade fairly with villagers",
      "Sample potions carefully",
      "Respect brewing traditions"
    ],
    "description": "Quaint village specializing in potion-making and alchemy, where every home has a bubbling cauldron and the air is filled with magical smoke and mysterious aromas.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'celestial-shrine': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to the Celestial Shrine, a ridge-top observatory where solar fire meets starfall embers.",
      "variations": [
        "Prism dishes track constellations while volcanic vents backlight the altar.",
        "Meteor glass tiles focus dawn rays into ascending flame spirals.",
        "Chanting acolytes weave Fire and Psychic harmonics into radiant veils."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "B",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 45,
      "max": 90
    },
    "agroRange": {
      "min": 45,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Star Ember Relic"
    },
    "specialEncounters": [
      {
        "type": "meteor_shower",
        "chance": 0.2,
        "description": "Starfall boosts Fire/Psychic fusion stats."
      },
      {
        "type": "solar_syzygy",
        "chance": 0.1,
        "description": "Rare alignment spawns a radiant guardian."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/celestial-shrine-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "9,200 ft",
    "temperature": "70°F to 110°F",
    "weatherPatterns": "Solar flares, prism refractions, ember drafts",
    "accessibility": "Star Ember Relic required",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Prism Dish Array",
      "Meteor Glass Floor",
      "Helioptic Altars"
    ],
    "wildlife": [
      {
        "name": "Flare Archivist",
        "species": "Chandelure / Wisemon / Foxparks",
        "type": "Fire/Ghost",
        "rarity": "Uncommon",
        "description": "Catalogs stellar flare residue."
      },
      {
        "name": "Solar Sprite",
        "species": "Kirlia / Candlemon / Teafant",
        "type": "Psychic/Fairy",
        "rarity": "Common",
        "description": "Focuses light into gentle restorative pulses."
      },
      {
        "name": "Corona Drake",
        "species": "Salamence / AeroVeedramon / Jetragon",
        "type": "Fire/Dragon",
        "rarity": "Rare",
        "description": "Circles during high flare cycles boosting thermal updrafts."
      }
    ],
    "resources": [
      {
        "name": "Meteor Glass Fragment",
        "rarity": "Uncommon",
        "description": "Heat-tempered pane storing stellar charge."
      },
      {
        "name": "Prism Ash",
        "rarity": "Common",
        "description": "Fine residue from refraction rites."
      },
      {
        "name": "Solar Core Lens",
        "rarity": "Rare",
        "description": "Condensed light focus crystal."
      }
    ],
    "lore": "Pilgrims claim visions arrive in refraction halos.",
    "history": "Expanded after a recorded triple solar flare event.",
    "dangers": [
      "Retina glare",
      "Overheated surfaces"
    ],
    "tips": [
      "Use filtered visors",
      "Time visits at dawn",
      "Avoid mid-flare chanting zone"
    ],
    "description": "Ridge-top observatory where solar fire converges with meteor embers.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 18,
      "height": 22
    }
  },

  'ceres-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "demeters-grove",
    "regionName": "Demeter's Grove",
    "welcomeMessages": {
      "base": "Welcome to Ceres Town—golden fields, quiet wisdom, and bread so fresh it evangelizes.",
      "variations": [
        "Irrigation runes tick softly as windmills bow to the grain.",
        "Market stalls trade seed lore—harvests here remember your name.",
        "Offer a loaf at the shrine; the goddess loves good crust."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Ground",
        "Fairy",
        "Normal"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "E",
        "D"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 4,
      "max": 14
    },
    "agroRange": {
      "min": 5,
      "max": 30
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "harvest_blessing",
        "chance": 0.22,
        "description": "Sunlit rows boost Grass/Fairy support effects and spawn rates."
      },
      {
        "type": "grain_spirit_parade",
        "chance": 0.12,
        "description": "Procession of field sprites reveals a rare Ground/Grass guardian."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/ceres-town-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "400 ft",
    "temperature": "60°F to 85°F",
    "weatherPatterns": "Perfect growing weather, gentle rains, abundant sunshine",
    "accessibility": "Farmers and agricultural enthusiasts welcome",
    "recommendedLevel": "25+",
    "specialFeatures": [
      "Advanced Agriculture",
      "Harvest Festivals",
      "Grain Markets",
      "Agricultural Schools",
      "Abundance Rituals"
    ],
    "wildlife": [
      {
        "name": "Farm Guardian",
        "species": "Ampharos / Patamon / Mammorest",
        "type": "Normal/Grass",
        "rarity": "Common",
        "description": "Loyal creatures that protect crops and livestock"
      },
      {
        "name": "Harvest Mouse",
        "species": "Rattata / Viximon",
        "type": "Normal",
        "rarity": "Common",
        "description": "Industrious mice that help with grain collection"
      },
      {
        "name": "Abundance Bird",
        "species": "Pidgey / Biyomon / Chicopi",
        "type": "Normal/Flying",
        "rarity": "Uncommon",
        "description": "Birds that signal good harvests"
      }
    ],
    "resources": [
      {
        "name": "Golden Wheat",
        "rarity": "Rare",
        "description": "Premium wheat with exceptional nutritional value"
      },
      {
        "name": "Harvest Tools",
        "rarity": "Common",
        "description": "Advanced farming implements and tools"
      },
      {
        "name": "Blessed Seeds",
        "rarity": "Uncommon",
        "description": "Seeds guaranteed to produce excellent crops"
      }
    ],
    "lore": "Ceres Town represents the practical side of agriculture, focusing on abundance, prosperity, and the Roman approach to farming and grain distribution.",
    "history": "Founded by Roman settlers who brought advanced agricultural techniques and established the town as a center for grain trade and farming innovation.",
    "dangers": [
      "Market competition",
      "Crop diseases",
      "Weather dependency",
      "Economic fluctuations"
    ],
    "tips": [
      "Learn about advanced farming techniques",
      "Participate in harvest festivals",
      "Trade in the grain markets",
      "Study agricultural innovations",
      "Respect the goddess Ceres"
    ],
    "description": "Prosperous agricultural town where the Roman goddess Ceres is honored, featuring the most advanced farming techniques and abundant harvests year-round.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'cloud-palace': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "nimbus-capital",
    "regionName": "Nimbus Capital",
    "welcomeMessages": {
      "base": "Welcome to the Cloud Palace—solid sky underfoot, coronets cut from cirrus and dawn.",
      "variations": [
        "Aether bridges hum; look down only if you like vertigo.",
        "Crystalized air balustrades ring with thunder’s afterthought.",
        "Courtiers ride thermals between balconies—mind the updrafts."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Electric",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Sky Charter Sigil"
    },
    "specialEncounters": [
      {
        "type": "cirrus_coronation",
        "chance": 0.18,
        "description": "Royal rites attract rare Flying/Fairy attendants with buff auras."
      },
      {
        "type": "aether_step",
        "chance": 0.1,
        "description": "Stair of wind forms—an Electric/Flying sovereign appears briefly."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/cloud-palace-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "12,000 ft",
    "temperature": "20°F to 40°F",
    "weatherPatterns": "Constant cloud cover, wind currents",
    "accessibility": "By royal invitation only",
    "recommendedLevel": "90+",
    "specialFeatures": [
      "Sky Royal Court",
      "Crystallized Architecture",
      "Cloud Throne Room",
      "Royal Wind Gardens",
      "Floating Chambers"
    ],
    "wildlife": [
      {
        "name": "Royal Wind Drake",
        "species": "Dragonite / Imperialdramon / Jetragon",
        "type": "Flying/Psychic",
        "rarity": "Extreme",
        "description": "Majestic dragons that serve the sky royalty"
      },
      {
        "name": "Cloud Sentinel",
        "species": "Skarmory / MetalGarurumon",
        "type": "Flying/Steel",
        "rarity": "Rare",
        "description": "Guardians made of crystallized air and metal"
      },
      {
        "name": "Court Fairy",
        "species": "Togekiss / Angewomon / Katapagos",
        "type": "Fairy/Flying",
        "rarity": "Uncommon",
        "description": "Elegant fairies that serve in the royal court"
      }
    ],
    "resources": [
      {
        "name": "Crystallized Air",
        "rarity": "Extreme",
        "description": "Solidified atmosphere with magical properties"
      },
      {
        "name": "Royal Wind Gems",
        "rarity": "Rare",
        "description": "Gems formed from concentrated wind energy"
      },
      {
        "name": "Cloud Essence",
        "rarity": "Uncommon",
        "description": "The raw material of cloud formation"
      }
    ],
    "lore": "The Cloud Palace is the seat of power for the Sky Kings, ancient rulers who have governed the floating isles for millennia. Built from clouds given permanent form through sky magic, the palace exists in a state between solid and ethereal.",
    "history": "Constructed over a thousand years ago by the first Sky King, the palace has served as the center of sky realm politics and culture. It rotates slowly through the heavens, following ancient star patterns.",
    "dangers": [
      "Royal guards",
      "Political intrigue",
      "Altitude sickness",
      "Crystallized air hazards",
      "Court politics"
    ],
    "tips": [
      "Obtain proper diplomatic credentials",
      "Learn sky realm etiquette",
      "Bring gifts for the court",
      "Respect royal protocol",
      "Study wind current patterns"
    ],
    "description": "Magnificent palace built entirely of solidified clouds and crystallized air, home to sky royalty who rule the floating realm.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 30,
      "height": 25
    }
  },

  'coastal-settlement': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to the Coastal Settlement, a tide-hugging outpost of coral-lashed piers and net terraces.",
      "variations": [
        "Sea-spray wind chimes guide fishing skiffs to biolight docks.",
        "Kelp-dried lattices creak rhythmically with the swell.",
        "Tidal pools brim with juvenile hybrids awaiting release."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Normal",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 45
    },
    "agroRange": {
      "min": 20,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "high_tide_cycle",
        "chance": 0.18,
        "description": "Unusual tide brings in rare Water/Grass fusion."
      },
      {
        "type": "kelp_bloom",
        "chance": 0.12,
        "description": "Nutrient surge increases encounter density."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/coastal-settlement-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Sea Level",
    "temperature": "62°F to 78°F",
    "weatherPatterns": "Salt spray, tidal mist, warm currents",
    "accessibility": "Open dock (basic gear)",
    "recommendedLevel": "25-50",
    "specialFeatures": [
      "Biolight Docks",
      "Kelp Drying Frames",
      "Tidal Nursery Pools"
    ],
    "wildlife": [
      {
        "name": "Pier Watcher",
        "species": "Pelipper / Seadramon / Surfent",
        "type": "Water/Flying",
        "rarity": "Common",
        "description": "Glides between pier posts scanning currents."
      },
      {
        "name": "Reef Tender",
        "species": "Corsola / Palmon / Lunaris",
        "type": "Water/Grass",
        "rarity": "Uncommon",
        "description": "Cultivates nursery coral for juvenile releases."
      },
      {
        "name": "Netshell",
        "species": "Shellder / Armadillomon / Mozzarina",
        "type": "Water/Rock",
        "rarity": "Common",
        "description": "Clamps onto frayed nets reinforcing them."
      }
    ],
    "resources": [
      {
        "name": "Kelp Fiber Roll",
        "rarity": "Common",
        "description": "Braided cord used in net repair."
      },
      {
        "name": "Pearl Spray Resin",
        "rarity": "Uncommon",
        "description": "Protective coating extracted from tidal pools."
      },
      {
        "name": "Tide Echo Shell",
        "rarity": "Rare",
        "description": "Shell capturing rhythmic wave patterns."
      }
    ],
    "lore": "Serves as first acclimation point for deeper reef expeditions.",
    "history": "Founded by reef stewards to rehabilitate over-harvested shallows.",
    "dangers": [
      "Slip hazards",
      "Rogue wave surges"
    ],
    "tips": [
      "Secure footing",
      "Log tide tables",
      "Inspect gear after salt exposure"
    ],
    "description": "Tide-hugging outpost of coral-lashed piers and net terraces.",
    "mapCoordinates": {
      "x": 15,
      "y": 25,
      "width": 18,
      "height": 16
    }
  },

  'corvus-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to Corvus City, storm-perched metropolis of slate terraces and lightning-fed aeries.",
      "variations": [
        "Raven-wing banners snap across conductive sky bridges.",
        "Voltage cascades race down obsidian spires into storage coils.",
        "Flock sentries spiral above, mapping storm cell trajectories."
      ]
    },
    "battleParameters": {
      "weather": "thunderstorm",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Dark",
        "Flying"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 50,
      "max": 90
    },
    "agroRange": {
      "min": 55,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Conductive Cloak"
    },
    "specialEncounters": [
      {
        "type": "storm_convergence",
        "chance": 0.22,
        "description": "Multiple lightning cells fuse, empowering Electric hybrids."
      },
      {
        "type": "shadow_flock_trial",
        "chance": 0.1,
        "description": "Dark/Flying sentries initiate an aerial gauntlet."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/corvus-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "8,100 ft",
    "temperature": "40°F to 65°F",
    "weatherPatterns": "Cyclic thunderstorms, charge gusts",
    "accessibility": "Conductive cloak & storm approach clearance",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Conductive Sky Bridges",
      "Voltage Reservoirs",
      "Flock Aerie Towers"
    ],
    "wildlife": [
      {
        "name": "Storm Corvid",
        "species": "Murkrow / Garudamon / Sparkit",
        "type": "Electric/Dark",
        "rarity": "Common",
        "description": "Carries static packets between coil perches."
      },
      {
        "name": "Amp Talon",
        "species": "Zapdos / Aquilamon / Jetragon",
        "type": "Electric/Flying",
        "rarity": "Rare",
        "description": "Channels multi-bolt arcs during peak surges."
      },
      {
        "name": "Shadow Line Scout",
        "species": "Luxray / BlackGatomon / Univolt",
        "type": "Electric/Dark",
        "rarity": "Uncommon",
        "description": "Tracks charge gradients through alley conduits."
      }
    ],
    "resources": [
      {
        "name": "Lightning Capacitor Core",
        "rarity": "Rare",
        "description": "High retention energy matrix."
      },
      {
        "name": "Storm Glass Rod",
        "rarity": "Uncommon",
        "description": "Conductive focus used in lightning shaping."
      },
      {
        "name": "Aerie Feather",
        "rarity": "Common",
        "description": "Insulated vane reduces static discharge."
      }
    ],
    "lore": "Founded where natural storm lanes intersect for optimal harvesting.",
    "history": "Grew vertically as storage coil tech advanced.",
    "dangers": [
      "Arc flash risk",
      "High wind shear"
    ],
    "tips": [
      "Ground regularly",
      "Use insulated grips",
      "Check surge forecasts"
    ],
    "description": "Storm-perched metropolis of slate terraces and lightning-fed aeries.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 25,
      "height": 20
    }
  },

  'cyclops-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Cyclops Village—menhir rings, forge smoke, and one-eyed smith clans who see flaws before they exist.",
      "variations": [
        "Hammer hymns echo off ice—each anvil keeps its own weather.",
        "Runed menhirs glow faintly; apprentices swear it’s the stones watching back.",
        "Trade a story for a nail and leave with a legend riveted to it."
      ]
    },
    "battleParameters": {
      "weather": "snow",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Steel",
        "Rock",
        "Fire",
        "Ice"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Forge Mark"
    },
    "specialEncounters": [
      {
        "type": "anvil_chorus",
        "chance": 0.18,
        "description": "Synchronized hammering empowers Steel/Rock spawns with defense boons."
      },
      {
        "type": "menhir_eye",
        "chance": 0.1,
        "description": "A watching stone opens—rare Fire/Steel sentinel issues a trial."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/cyclops-village-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "6,050 ft",
    "temperature": "-5°F to 20°F",
    "weatherPatterns": "Cobalt forge glow haze, drifting crystals",
    "accessibility": "Clan token escort",
    "recommendedLevel": "50-80",
    "specialFeatures": [
      "Forge Pits",
      "Menhir Circuits",
      "Echo Horn Towers"
    ],
    "wildlife": [
      {
        "name": "Forge Cyclopean",
        "species": "Machamp / Cyclonemon / Mossanda",
        "type": "Fighting/Rock",
        "rarity": "Uncommon",
        "description": "Hammers resonance anvils forging heatstone ingots."
      },
      {
        "name": "Stone Eyeling",
        "species": "Roggenrola / Hagurumon / Depresso",
        "type": "Rock/Steel",
        "rarity": "Common",
        "description": "Rolls between menhirs measuring vibrational alignment."
      },
      {
        "name": "Frost Sentinel",
        "species": "Beartic / Monochromon / Wumpo",
        "type": "Ice/Fighting",
        "rarity": "Rare",
        "description": "Patrols outer ring during whiteout pulses."
      }
    ],
    "resources": [
      {
        "name": "Forge Heatstone",
        "rarity": "Rare",
        "description": "Stable thermal core for advanced crafting."
      },
      {
        "name": "Menhir Fragment",
        "rarity": "Uncommon",
        "description": "Runic shard storing seismic patterns."
      },
      {
        "name": "Smithing Soot",
        "rarity": "Common",
        "description": "Fine carbon dust enhancing grip."
      }
    ],
    "lore": "Legend says their first anvil was carved from a fallen glacier heart.",
    "history": "Developed as a defensive forge outpost protecting tundra trade.",
    "dangers": [
      "Hammer shockwaves",
      "Forge flare sparks"
    ],
    "tips": [
      "Wear eye shielding",
      "Respect smith signals",
      "Avoid active ring drills"
    ],
    "description": "Menhir-ringed enclave guarded by one-eyed smith clans.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'death-pyramid': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "mictlan-hollows",
    "regionName": "Mictlan Hollows",
    "welcomeMessages": {
      "base": "You approach the Death Lord Pyramid, its bone throne chambers echoing with ancestral murmurs.",
      "variations": [
        "Torchlight crawls over obsidian death runes mapping the soul journey.",
        "Spectral guardians drift between stepped terraces awaiting offerings.",
        "A chill wind carries petal incense from ongoing remembrance rites."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ghost",
        "Dark"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 60,
      "max": 100
    },
    "agroRange": {
      "min": 65,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Obsidian Offering Mask"
    },
    "specialEncounters": [
      {
        "type": "ancestral_procession",
        "chance": 0.22,
        "description": "A procession of ancestral spirits reveals a rare fusion."
      },
      {
        "type": "throne_challenge",
        "chance": 0.15,
        "description": "The bone throne guardian tests your resolve."
      },
      {
        "type": "soul_rune_flash",
        "chance": 0.08,
        "description": "Runes flare, empowering Ghost-type abilities."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/death-pyramid-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "320 ft rise",
    "temperature": "45°F to 60°F",
    "weatherPatterns": "Soul dust eddies, dim green flame wisps",
    "accessibility": "Oathbound torch sigil",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Resonant Crypt Wells",
      "Ancestral Sarcophagus Rings",
      "Soul Flame Braziers"
    ],
    "wildlife": [
      {
        "name": "Crypt Jackal",
        "species": "Mightyena / BlackGaomon / Direhowl",
        "type": "Dark/Ghost",
        "rarity": "Common",
        "description": "Sniffs memory trails along carved relief passages."
      },
      {
        "name": "Phantom Scarab",
        "species": "Karrablast / FanBeemon / Lumira",
        "type": "Bug/Ghost",
        "rarity": "Uncommon",
        "description": "Feeds on residual glyph light and drifting anima motes."
      },
      {
        "name": "Sarcophageist",
        "species": "Cofagrigus / SkullSatamon / Necromus",
        "type": "Ghost/Dark",
        "rarity": "Rare",
        "description": "Emerges during low chant cycles to rearrange ossuary doors."
      }
    ],
    "resources": [
      {
        "name": "Soulbound Shard",
        "rarity": "Rare",
        "description": "Crystalline echo of a sealed vow, used in ritual catalysts."
      },
      {
        "name": "Ember Sand",
        "rarity": "Uncommon",
        "description": "Warm granular residue retaining spectral heat."
      },
      {
        "name": "Inscribed Fragment",
        "rarity": "Common",
        "description": "Broken tablet sliver with partial funerary script."
      }
    ],
    "lore": "Built to resonate with layered timelines, safeguarding forgotten accords.",
    "history": "Reclaimed from collapsing dunes then warded by crypt seers.",
    "dangers": [
      "Soul pulse disorientation",
      "Falling reliquary lids",
      "Anima drain zones"
    ],
    "tips": [
      "Carry continuous light",
      "Avoid green flame surges",
      "Track echo loop intervals"
    ],
    "description": "Sepulchral prism of echoing sarcophagi and shifting soul-sand.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 18,
      "height": 20
    }
  },

  'delphi-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "oracles-sanctum",
    "regionName": "Oracle's Sanctum",
    "welcomeMessages": {
      "base": "Welcome to Delphi City, where sacred vapors curl through marble colonnades of prophecy.",
      "variations": [
        "Seers murmur fragmented futures beneath resonant bronze bowls.",
        "Pilgrims line incense terraces awaiting guided visions.",
        "Mind crystals pulse faintly synchronizing with your thoughts."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 30,
      "max": 75
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "shared_vision",
        "chance": 0.18,
        "description": "Collective trance improves encounter quality."
      },
      {
        "type": "oracle_trial",
        "chance": 0.12,
        "description": "A seer challenges your strategic foresight."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/delphi-city-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "2,400 ft",
    "temperature": "55°F to 78°F",
    "weatherPatterns": "Golden mist veils, hush wind currents",
    "accessibility": "Consultation token or escort",
    "recommendedLevel": "35-60",
    "specialFeatures": [
      "Prophecy Pools",
      "Aether Loom Galleries",
      "Mnemonic Spire"
    ],
    "wildlife": [
      {
        "name": "Oracle Strix",
        "species": "Noctowl / Wisemon / Galeclaw",
        "type": "Psychic/Flying",
        "rarity": "Uncommon",
        "description": "Glides silently mapping probability layers."
      },
      {
        "name": "Marble Kine",
        "species": "Miltank / Goldram / Gumoss",
        "type": "Normal/Fairy",
        "rarity": "Common",
        "description": "Grazes on curated terrace moss absorbing ambient foresight hum."
      },
      {
        "name": "Chrona Sprite",
        "species": "Ralts / Clockmon / Petallia",
        "type": "Psychic/Fairy",
        "rarity": "Rare",
        "description": "Adjusts minor timeline drift near prophecy pools."
      }
    ],
    "resources": [
      {
        "name": "Aether Thread",
        "rarity": "Rare",
        "description": "Spun potential strand used in precognitive gear."
      },
      {
        "name": "Insight Petal",
        "rarity": "Uncommon",
        "description": "Bloom that opens during stable probability windows."
      },
      {
        "name": "Marble Dust",
        "rarity": "Common",
        "description": "Finely ground reflective grit used in scrying basins."
      }
    ],
    "lore": "Seers claim its foundations align with convergent destiny nodes.",
    "history": "Expanded from a single shrine into a vast interpretive complex.",
    "dangers": [
      "Temporal fatigue",
      "Aether resonance migraines"
    ],
    "tips": [
      "Limit consecutive prophecy exposures",
      "Hydrate at clarity fountains",
      "Log outcomes quickly"
    ],
    "description": "Terraced marble foresight hub threaded by divination canals.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 25,
      "height": 20
    }
  },

  'dharma-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "kshatriya-arena",
    "regionName": "Kshatriya Arena",
    "welcomeMessages": {
      "base": "Welcome to Dharma Village—ethics before elbows, vows before victories.",
      "variations": [
        "Training yards ring with respectful challenges—honor is the loudest sound.",
        "Scroll keepers stamp oaths; your word is your armor.",
        "Tea, meditation, spar—repeat until calm and competent."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Psychic",
        "Normal"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 10,
      "max": 40
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "oath_trial",
        "chance": 0.22,
        "description": "Sworn vows grant buffs to Fighting/Psychic allies during honorable duels."
      },
      {
        "type": "teacher_inspection",
        "chance": 0.12,
        "description": "A master observes—rare Normal/Psychic mentor issues a measured test."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/dharma-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "1000 ft",
    "temperature": "65°F to 85°F",
    "weatherPatterns": "Temperate, conducive to contemplation",
    "accessibility": "Students of philosophy and ethics welcome",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Dharma Schools",
      "Philosophical Debates",
      "Ethical Training",
      "Meditation Gardens",
      "Moral Guidance"
    ],
    "wildlife": [
      {
        "name": "Wise Monkey",
        "species": "Oranguru / Apemon / Broncherry",
        "type": "Normal/Psychic",
        "rarity": "Uncommon",
        "description": "Intelligent primates that contemplate moral questions"
      },
      {
        "name": "Peaceful Dove",
        "species": "Pidove / Piyomon",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Birds that represent harmony and right action"
      },
      {
        "name": "Meditation Cat",
        "species": "Meditite / Gatomon / Relaxaurus",
        "type": "Psychic/Normal",
        "rarity": "Common",
        "description": "Cats that sit in contemplative poses"
      }
    ],
    "resources": [
      {
        "name": "Dharma Texts",
        "rarity": "Rare",
        "description": "Sacred writings on righteous living"
      },
      {
        "name": "Moral Compass",
        "rarity": "Uncommon",
        "description": "Tools for ethical decision-making"
      },
      {
        "name": "Wisdom Scrolls",
        "rarity": "Common",
        "description": "Philosophical teachings and guides"
      }
    ],
    "lore": "Dharma Village embodies the principle that true strength comes from righteousness, and that warriors must first understand moral duty before wielding weapons.",
    "history": "Founded by sages who sought to teach the ethical foundations necessary for righteous warfare, the village has become a center for moral education.",
    "dangers": [
      "Challenging moral dilemmas",
      "Intense philosophical debates",
      "Confronting personal ethics",
      "Rigorous self-examination"
    ],
    "tips": [
      "Come with an open mind",
      "Be prepared to question your beliefs",
      "Engage honestly in philosophical discussions",
      "Practice meditation and self-reflection",
      "Learn from the village elders"
    ],
    "description": "Peaceful village where the principles of dharma (righteous duty) are lived and taught, focusing on moral philosophy and ethical warrior conduct.",
    "mapCoordinates": {
      "x": 15,
      "y": 25,
      "width": 18,
      "height": 16
    }
  },

  'dinosaur-valley': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "primordial-jungle",
    "regionName": "Primordial Jungle",
    "welcomeMessages": {
      "base": "Welcome to Dinosaur Valley—where the past never left and the ground still thunders.",
      "variations": [
        "Fern canopies hiss as tails sweep—walk softly, or become a teachable moment.",
        "River mud keeps perfect footprints; some are… bigger than your tent.",
        "Nesting calls roll like drums—respect the roped-off roars."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Dragon",
        "Ground",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Paleo Permit"
    },
    "specialEncounters": [
      {
        "type": "primeval_roar",
        "chance": 0.2,
        "description": "Valley-wide call boosts Dragon/Ground spawns and intimidates foes."
      },
      {
        "type": "nest_guard",
        "chance": 0.12,
        "description": "Territorial parent appears—rare Rock/Dragon protector challenges intruders."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/diphylleia-valley-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "400 ft",
    "temperature": "80°F to 95°F",
    "weatherPatterns": "Hot, humid, frequent storms",
    "accessibility": "Extreme danger - restricted access",
    "recommendedLevel": "80+",
    "specialFeatures": [
      "Living Dinosaurs",
      "Prehistoric Ecosystem",
      "Ancient Environment",
      "Well Preserved Land"
    ],
    "wildlife": [
      {
        "name": "Stormscale",
        "species": "Raijin / Voltfin",
        "type": "Electric/Dragon",
        "rarity": "Extreme",
        "description": "A colossal drake crackling with electric fury, its scales glow like storm clouds and each beat of its wings summons thunder across the canopy."
      },
      {
        "name": "Granitusk",
        "species": "Tyranitar / Magmemon / Basaltigon",
        "type": "Rock/Ground",
        "rarity": "Rare",
        "description": "A hulking behemoth whose hide resembles living stone, crowned with magma-forged horns and trailing vines that pulse with ancient life energy."
      },
      {
        "name": "Windflock",
        "species": "Talonflame / Birdramon / Karasu Tengu",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "A swift, coordinated hunting flock whose feathered crests shimmer with floral patterns, known for diving in perfect synchronicity to snatch prey from the jungle floor."
      }
    ],
    "resources": [
      {
        "name": "Dinosaur DNA",
        "rarity": "Extreme",
        "description": "Genetic material from living prehistoric specimens"
      },
      {
        "name": "Fossilized Teeth",
        "rarity": "Rare",
        "description": "Teeth from ancient predators"
      },
      {
        "name": "Prehistoric Plants",
        "rarity": "Uncommon",
        "description": "Ancient vegetation with unique properties"
      }
    ],
    "lore": "Diphyelleia Valley is whispered about in half-remembered campfire tales as the “Evergreen Graveyard” — a low-lying amphitheater of jungle so thick with ancient growth that sunlight filters in emerald beams. Locals speak of colossal vining ferns that wrap like serpents around stone monoliths, and of distant roars that shake the canopy at dawn. Legend holds that the valley was birthed in primeval times by a fallen Titanmon, its massive body petrified into the valley walls and seeping raw life energy into the soil.",
    "history": "For generations, the valley’s existence has been the closely guarded secret of the Kaemari and Tsu’lan tribes, who regard Diphyelleia as sacred—“the Womb of the Ancients.” These tribes maintain patrols at every forest edge, using ancient wards, ritual drumming, and whispered curses to deter unwelcome travelers. Any outsider caught attempting to breach the jungle is quietly escorted back to the border, their maps and journals confiscated or destroyed. As a result, Diphyelleia Valley has escaped large-scale excavation or disturbance, preserving its prehistoric ecosystems in near-pristine condition. Modern researchers must first earn the tribes’ trust—often through years of cultural exchange and gift offerings—before being granted limited access under strict supervision. This living boundary between tribal stewardship and academic curiosity keeps the valley’s deepest secrets protected, ensuring that its ancient monsters continue to roam unbothered.",
    "dangers": [
      "Apex predators",
      "Territorial dinosaurs",
      "Poisonous prehistoric plants",
      "Unstable terrain",
      "Complete isolation from help"
    ],
    "tips": [
      "Never travel alone",
      "Bring military-grade equipment",
      "Study dinosaur behavior patterns",
      "Establish emergency evacuation plans",
      "Consider this location off-limits"
    ],
    "description": "Hidden valley where living dinosaurs roam freely in their natural habitat, untouched by modern civilization.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 25,
      "height": 22
    }
  },

  'divine-workshop': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hephaestus-forge",
    "regionName": "Hephaestus Forge",
    "welcomeMessages": {
      "base": "You enter the Divine Workshop, anvils ringing with god-forged resonance.",
      "variations": [
        "Runic bellows channel eternal flame through alloy crucibles.",
        "Cyclopean assistants temper glowing ingots with rhythmic precision.",
        "Forged sparks trace sigils midair before fading."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Steel",
        "Fire"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 50,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Forge Access Seal"
    },
    "specialEncounters": [
      {
        "type": "divine_spark",
        "chance": 0.2,
        "description": "A forge spark animates into a rare Steel/Fire hybrid."
      },
      {
        "type": "master_anvil_trial",
        "chance": 0.1,
        "description": "Complete a forging pattern to impress the spirits."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/divine-workshop-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "4,800 ft caldera rim",
    "temperature": "350°F forges / 90°F ambient",
    "weatherPatterns": "Sparking slag rain, resonant hammer thunder",
    "accessibility": "Heat ward plating required",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Molten Flow Lathes",
      "Celestial Alloy Crucibles",
      "Runic Cooling Spirals"
    ],
    "wildlife": [
      {
        "name": "Anvil Core",
        "species": "Probopass / Andromon / Dumud",
        "type": "Steel/Rock",
        "rarity": "Uncommon",
        "description": "Floats via magnetic eddies stabilizing smelt fields."
      },
      {
        "name": "Slag Salamander",
        "species": "Salandit / Meramon / Reptyro",
        "type": "Fire/Poison",
        "rarity": "Common",
        "description": "Skims molten channels absorbing trace alloys."
      },
      {
        "name": "Forge Archon",
        "species": "Metagross / HiAndromon / Digtoise",
        "type": "Steel/Fire",
        "rarity": "Rare",
        "description": "Coordinates synchronized hammer pulses shaping celestial ingots."
      }
    ],
    "resources": [
      {
        "name": "Celestial Alloy",
        "rarity": "Rare",
        "description": "Ultra-refined resonant metal for top-tier forging."
      },
      {
        "name": "Runic Slag",
        "rarity": "Uncommon",
        "description": "Cooling crust imbued with forge chants."
      },
      {
        "name": "Basalt Core Chunk",
        "rarity": "Common",
        "description": "Heavy dense stone holding latent heat."
      }
    ],
    "lore": "Said to channel forgotten volcanic hymn cycles to stabilize alloy purity.",
    "history": "Reinforced after a containment spiral nearly collapsed the inner crucibles.",
    "dangers": [
      "Heat shock",
      "Slag bursts",
      "Magnetic distortion zones"
    ],
    "tips": [
      "Use heat ward gear",
      "Avoid bright white vent phases",
      "Monitor hammer sync rhythm"
    ],
    "description": "Volcanic crucible of living anvils and celestial alloy vents.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 18,
      "height": 20
    }
  },

  'dragon-graveyard': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "draconic-abyss",
    "regionName": "Draconic Abyss",
    "welcomeMessages": {
      "base": "You tread upon the Dragon Graveyard, where ancient bones drift as silent monuments.",
      "variations": [
        "Etheric embers flicker in hollow eye sockets of colossal skulls.",
        "Bone islands creak, repositioned by unseen thermal currents.",
        "Draconic whispers coil through volcanic updrafts."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Dark",
        "Fire"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 65,
      "max": 100
    },
    "agroRange": {
      "min": 70,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Bone Dust Ward"
    },
    "specialEncounters": [
      {
        "type": "ancestral_roar",
        "chance": 0.25,
        "description": "Echo roar summons a spectral dragon fusion."
      },
      {
        "type": "bone_island_shift",
        "chance": 0.12,
        "description": "Rearranged bones reveal a hidden lair."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/dragon-graveyard-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Valley floor",
    "temperature": "70°F to 95°F",
    "weatherPatterns": "Bone-dry thermal updrafts, grit spirals",
    "accessibility": "Ridge descent ropes",
    "recommendedLevel": "50-80",
    "specialFeatures": [
      "Wyrm Spine Arches",
      "Calcium Dust Gyres",
      "Fossil Ember Pits"
    ],
    "wildlife": [
      {
        "name": "Spine Raptor",
        "species": "Aerodactyl / Strikedramon / Ragnahawk",
        "type": "Rock/Dragon",
        "rarity": "Uncommon",
        "description": "Perches on arch ridges scanning thermal patterns."
      },
      {
        "name": "Bone Sifter",
        "species": "Sandslash / Dracmon / Cinnamoth",
        "type": "Ground/Dark",
        "rarity": "Common",
        "description": "Filters marrow dust for lingering minerals."
      },
      {
        "name": "Ember Wyrmling",
        "species": "Bagon / Flamedramon / Pyrin",
        "type": "Dragon/Fire",
        "rarity": "Rare",
        "description": "Nests in warm fossil pockets absorbing residual heat."
      }
    ],
    "resources": [
      {
        "name": "Dragon Bone Powder",
        "rarity": "Rare",
        "description": "Finely milled fossil dust used in potent alchemy."
      },
      {
        "name": "Calcic Scale Flake",
        "rarity": "Uncommon",
        "description": "Remnant of ancient armor plating."
      },
      {
        "name": "Marrow Residue",
        "rarity": "Common",
        "description": "Faintly nutritive dust for soil enrichment."
      }
    ],
    "lore": "Dragons returned here to fossilize in aligned thermal fields.",
    "history": "Excavators uncovered early dragon clan burial patterns.",
    "dangers": [
      "Bone collapse zones",
      "Thermal mirage disorientation"
    ],
    "tips": [
      "Test ridge stability",
      "Carry dust goggles",
      "Watch for updraft talon dives"
    ],
    "description": "Fossil dune basin studded with titanic wyrm spines.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 22,
      "height": 25
    }
  },

  'drakescale-ridge': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "volcanic-peaks",
    "regionName": "Volcanic Peaks",
    "welcomeMessages": {
      "base": "Welcome to Drakescale Ridge—obsidian ladders and sun-basking embers with opinions.",
      "variations": [
        "Heat mirages shimmer; drakes sprawl like living cairns.",
        "Scree shifts—talons carve footholds where maps said “don’t.”",
        "If the rock blinks, congratulate it. Then back away slowly."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Dragon",
        "Rock"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Drakescale Writ"
    },
    "specialEncounters": [
      {
        "type": "sunplate_bask",
        "chance": 0.22,
        "description": "High heat boosts Fire/Dragon spawns; elites claim ridge ledges."
      },
      {
        "type": "clutch_guard",
        "chance": 0.12,
        "description": "Nest alarm draws a rare Rock/Dragon defender to the trail."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/drakescale-ridge-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "2,800 - 3,500 ft",
    "temperature": "110°F to 150°F",
    "weatherPatterns": "Blistering sun, heat mirages, ash gusts",
    "accessibility": "Obsidian steps, natural dread paths",
    "recommendedLevel": "50-70",
    "specialFeatures": [
      "Drake Nests",
      "Smoking Spires",
      "Scale Harvest Grounds"
    ],
    "wildlife": [
      {
        "name": "Stormscale",
        "species": "Zekrom / WarGreymon / Raijin / Palmon / Voltfin",
        "type": "Electric/Dragon",
        "rarity": "Legendary",
        "description": "Perching atop the tallest spires, its electric wings create thunderous rockfalls."
      },
      {
        "name": "Granitusk",
        "species": "Tyranitar / Magmemon / Oni / Palmon / Basaltigon",
        "type": "Rock/Ground",
        "rarity": "Rare",
        "description": "Roaming between nests to keep smaller predators at bay, its footsteps crack the basalt underfoot."
      },
      {
        "name": "Windflock",
        "species": "Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Sweeping through the ridge in migratory bands, scattering embers like falling leaves."
      }
    ],
    "resources": [
      {
        "name": "Drake Scale",
        "rarity": "Uncommon",
        "description": "Tough scales shed by Ember Drakes used in tribal armor."
      },
      {
        "name": "Obsidian Shards",
        "rarity": "Common",
        "description": "Sharp glass fragments scattered across the ridge."
      },
      {
        "name": "Heatstone",
        "rarity": "Rare",
        "description": "Concentrated heat crystals found near nest entrances."
      }
    ],
    "lore": "Each scale on this ridge is said to bear the mark of a drake’s triumph in tribal contests.",
    "history": "Shaped by centuries of drake flight and tribal beacon fires.",
    "dangers": [
      "Nest aggression",
      "Loose spires",
      "Heat exhaustion"
    ],
    "tips": [
      "Move quietly",
      "Offer scale tributes",
      "Keep to ash-lined trails"
    ],
    "description": "Jagged obsidian spires where Ember Drakes bask on hot stone, fiercely defending their nests from all intruders.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 25,
      "height": 20
    }
  },

  'druid-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "stoneheart-cliffs",
    "regionName": "Stoneheart Cliffs",
    "welcomeMessages": {
      "base": "Welcome to Druid Village where living rock and moss weave seamless dwellings.",
      "variations": [
        "Stone masons coax runes to bloom in bioluminescent patterns.",
        "Circle chants resonate through aligned menhir paths.",
        "Patient guardians cultivate crystal seeds between slabs."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 20,
      "max": 55
    },
    "agroRange": {
      "min": 20,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "stone_circle_alignment",
        "chance": 0.18,
        "description": "Aligned stones amplify Grass/Fairy presence."
      },
      {
        "type": "crystal_seed_sprout",
        "chance": 0.1,
        "description": "A crystal seed germinates attracting rare hybrids."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/druid-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "5,300 ft",
    "temperature": "40°F to 65°F",
    "weatherPatterns": "Soft mist braids, birdsong gusts",
    "accessibility": "Root bridge approach only",
    "recommendedLevel": "30-55",
    "specialFeatures": [
      "Runic Moss Pillars",
      "Verdant Healing Rings",
      "Spirit Sap Collection Nodes"
    ],
    "wildlife": [
      {
        "name": "Grove Watcher",
        "species": "Trevenant / Woodmon / Lumoth",
        "type": "Ghost/Grass",
        "rarity": "Uncommon",
        "description": "Guards boundary roots with resonant branch taps."
      },
      {
        "name": "Moss Fawn",
        "species": "Deerling / Kodokugumon / Lamball",
        "type": "Grass/Fairy",
        "rarity": "Common",
        "description": "Browses luminous undergrowth promoting regrowth pulses."
      },
      {
        "name": "Sap Wisp",
        "species": "Budew / Cherrymon / Petallia",
        "type": "Grass",
        "rarity": "Rare",
        "description": "Condenses around healing rings emitting gentle hum."
      }
    ],
    "resources": [
      {
        "name": "Spirit Sap",
        "rarity": "Rare",
        "description": "Potent regenerative extract used in advanced brews."
      },
      {
        "name": "Runic Bark Strip",
        "rarity": "Uncommon",
        "description": "Etched with natural glyph growth patterns."
      },
      {
        "name": "Moss Bundle",
        "rarity": "Common",
        "description": "Moist cushioning plant matter for crafting."
      }
    ],
    "lore": "Rootwardens tuned the grove to amplify restorative resonance.",
    "history": "Formed after cliffs stabilized allowing natural lattice growth.",
    "dangers": [
      "Root bridge sway falls",
      "Glyph overgrowth entanglement"
    ],
    "tips": [
      "Move in single file on bridges",
      "Do not carve living pillars",
      "Respect bark tap signals"
    ],
    "description": "Runic grove settlement anchored by moss pillars and root bridges.",
    "mapCoordinates": {
      "x": 15,
      "y": 60,
      "width": 18,
      "height": 16
    }
  },

  'electric-vortex': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "tempest-zones",
    "regionName": "Tempest Zones",
    "welcomeMessages": {
      "base": "You spiral toward the Electric Vortex, heart of converging storm channels.",
      "variations": [
        "Lightning filaments braid into a glowing central core.",
        "Pressure waves distort perception along inner rings.",
        "Thunder pulses sync with your heartbeat as you approach."
      ]
    },
    "battleParameters": {
      "weather": "thunderstorm",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 60,
      "max": 100
    },
    "agroRange": {
      "min": 65,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Insulated Flight Harness"
    },
    "specialEncounters": [
      {
        "type": "charge_supercell",
        "chance": 0.24,
        "description": "Supercell forms boosting Electric encounters."
      },
      {
        "type": "magnetic_lens_event",
        "chance": 0.1,
        "description": "Field lens concentrates a rare hybrid."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/electric-vortex-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Floating strata",
    "temperature": "20°F to 45°F (wind chill)",
    "weatherPatterns": "Continuous static arcs, luminous storm halos",
    "accessibility": "Grapple glide entry",
    "recommendedLevel": "70-100",
    "specialFeatures": [
      "Storm Charge Rings",
      "Ion Channel Pillars",
      "Levitation Eddy Paths"
    ],
    "wildlife": [
      {
        "name": "Volt Skyray",
        "species": "Stunfisk / Thunderballmon / Jolthog",
        "type": "Electric/Flying",
        "rarity": "Uncommon",
        "description": "Glides on conduction layers discharging excess ions."
      },
      {
        "name": "Nimbus Core",
        "species": "Eelektrik / Raidramon / Boltmane",
        "type": "Electric/Dragon",
        "rarity": "Rare",
        "description": "Stabilizes vortex polarity through rhythmic pulses."
      },
      {
        "name": "Static Hopper",
        "species": "Heliolisk / Kokuwamon / Sparkit",
        "type": "Electric/Normal",
        "rarity": "Common",
        "description": "Absorbs low-grade charge from ion pillars."
      }
    ],
    "resources": [
      {
        "name": "Ion Capacitor Crystal",
        "rarity": "Rare",
        "description": "Stores high-density electrical charge safely."
      },
      {
        "name": "Charged Filament",
        "rarity": "Uncommon",
        "description": "Glowing thread vibrating with steady current."
      },
      {
        "name": "Storm Residue",
        "rarity": "Common",
        "description": "Powder infused with static potential."
      }
    ],
    "lore": "Formed where levitation eddies intersect migrating storm belts.",
    "history": "Mapped by airborne scouts using tethered sensor rigs.",
    "dangers": [
      "Arc surges",
      "Magnetic disorientation",
      "Shear wind flings"
    ],
    "tips": [
      "Use insulated gear",
      "Track charge build cycles",
      "Avoid central polarity shifts"
    ],
    "description": "Cyclonic charge basin with suspended storm rings.",
    "mapCoordinates": {
      "x": 45,
      "y": 65,
      "width": 25,
      "height": 25
    }
  },

  'eleusis-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "demeters-grove",
    "regionName": "Demeter's Grove",
    "welcomeMessages": {
      "base": "Welcome to Eleusis City—where fields whisper mysteries and granaries keep more than grain.",
      "variations": [
        "Incense and wheat wreaths crown the avenues; initiates walk in measured silence.",
        "Divination looms spin threads of planting, harvest, and the hidden season beneath.",
        "Offer barley at the shrine—answers arrive in cycles, not seconds."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Fairy",
        "Ground",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Eleusinian Token"
    },
    "specialEncounters": [
      {
        "type": "mystery_initiation",
        "chance": 0.2,
        "description": "Rite of seed and shadow boosts Grass/Fairy support effects."
      },
      {
        "type": "persephone_cycle",
        "chance": 0.1,
        "description": "Seasonal shift reveals a rare Ground/Psychic guardian of the threshing floor."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/eleusis-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "800 ft",
    "temperature": "55°F to 75°F",
    "weatherPatterns": "Perfect growing conditions, mystical seasonal changes",
    "accessibility": "Spiritual initiates and agricultural pilgrims welcome",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Eleusinian Mystery Schools",
      "Sacred Initiations",
      "Goddess Temples",
      "Agricultural Centers",
      "Seasonal Ceremonies"
    ],
    "wildlife": [
      {
        "name": "Mystery Guardian",
        "species": "Alakazam / Angewomon / Lycanroc",
        "type": "Psychic/Grass",
        "rarity": "Extreme",
        "description": "Ancient beings that protect the sacred mysteries"
      },
      {
        "name": "Harvest Spirit",
        "species": "Trevenant / Palmon / Whisp",
        "type": "Grass/Ghost",
        "rarity": "Rare",
        "description": "Spirits that ensure bountiful harvests"
      },
      {
        "name": "Sacred Owl",
        "species": "Noctowl / Hoothoot",
        "type": "Normal/Psychic",
        "rarity": "Uncommon",
        "description": "Wise owls that observe the mystery ceremonies"
      }
    ],
    "resources": [
      {
        "name": "Sacred Grain",
        "rarity": "Extreme",
        "description": "Mystical wheat blessed by Demeter herself"
      },
      {
        "name": "Mystery Scrolls",
        "rarity": "Rare",
        "description": "Ancient texts containing agricultural and spiritual wisdom"
      },
      {
        "name": "Initiation Stones",
        "rarity": "Uncommon",
        "description": "Stones used in sacred initiation ceremonies"
      }
    ],
    "lore": "Eleusis City is the center of the ancient Eleusinian Mysteries, where Demeter taught humanity the secrets of agriculture and the cycle of life and death through her daughter Persephone's story.",
    "history": "Founded over two millennia ago as a center for the mystery religions, the city has preserved the most sacred agricultural and spiritual knowledge of the ancient world.",
    "dangers": [
      "Intense spiritual trials",
      "Mystery cult restrictions",
      "Overwhelming divine presence",
      "Initiation challenges",
      "Sacred site violations"
    ],
    "tips": [
      "Undergo proper spiritual preparation",
      "Respect the sacred mysteries",
      "Study agricultural traditions",
      "Bring offerings of grain and flowers",
      "Seek guidance from mystery priests"
    ],
    "description": "Sacred city dedicated to the Eleusinian Mysteries, where initiates learn the secrets of life, death, and rebirth through Demeter's ancient wisdom and agricultural magic.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 28,
      "height": 22
    }
  },

  'emberforge-settlement': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "volcanic-peaks",
    "regionName": "Volcanic Peaks",
    "welcomeMessages": {
      "base": "Welcome to Emberforge—lava-tempered forges, drake stables, and vents that glow like watchful eyes.",
      "variations": [
        "Cliffside bellows thunder; sparks write brief constellations over the anvils.",
        "Drake tack hangs warm to the touch—someone just trained, or the gear refuses to cool.",
        "Mind the slag chutes unless you enjoy surprise footwear."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Dragon",
        "Rock",
        "Ground"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 10,
      "max": 19
    },
    "agroRange": {
      "min": 18,
      "max": 48
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "vent_flare",
        "chance": 0.2,
        "description": "A sudden flare empowers Fire/Rock spawns along the ridge."
      },
      {
        "type": "drake_mustering",
        "chance": 0.12,
        "description": "Stable horns call a rare Dragon/Ground sentinel to patrol the cliffs."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/emberforge-settlement-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "3,700 ft",
    "temperature": "100°F to 130°F",
    "weatherPatterns": "Scorching heat, ember winds, magma haze",
    "accessibility": "Cliffside paths, heat-shielded walkways, lava-rafting docks",
    "recommendedLevel": "45-60",
    "specialFeatures": [
      "Lava-quenched Forges",
      "Drake Stables",
      "Molten Lacquer Workshops"
    ],
    "wildlife": [
      {
        "name": "Stormscale",
        "species": "Zekrom / WarGreymon / Raijin / Palmon / Voltfin",
        "type": "Electric/Dragon",
        "rarity": "Legendary",
        "description": "A colossal drake crackling with electric fury, sometimes seen spiraling above the forges in dazzling displays of storm and flame."
      },
      {
        "name": "Granitusk",
        "species": "Tyranitar / Magmemon / Oni / Palmon / Basaltigon",
        "type": "Rock/Ground",
        "rarity": "Rare",
        "description": "A hulking behemoth whose hide resembles living stone — often called upon by tribal smiths to quarry crimson iron from deep fissures."
      },
      {
        "name": "Windflock",
        "species": "Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "A swift hunting flock whose floral-patterned crests shimmer in the heat haze as they dive in perfect formation."
      }
    ],
    "resources": [
      {
        "name": "Sacred Obsidian",
        "rarity": "Uncommon",
        "description": "Volcanic glass revered for durability and ritual uses."
      },
      {
        "name": "Ember Lotus Petals",
        "rarity": "Rare",
        "description": "Flowers that thrive in ash-rich soil, used in tribal ceremonies."
      },
      {
        "name": "Crimson Iron",
        "rarity": "Rare",
        "description": "Iron ore infused with volcanic heat, prized by smiths."
      }
    ],
    "lore": "The forge fires here are said to be lit by the breath of sleeping titans.",
    "history": "Founded when Emberkin shamans first tamed the local drakes over a millennium ago.",
    "dangers": [
      "Falling from cliffside",
      "Drake aggression",
      "Molten splatter"
    ],
    "tips": [
      "Secure all gear",
      "Offer tribute to the drake broodmother",
      "Stay within tribal guidelines"
    ],
    "description": "Perched on a cliff above molten flows, the Emberforge Settlement is the tribal heart of the Emberkin, where lava-tempered forges and drake stables coalesce under the watchful glow of active vents.",
    "mapCoordinates": {
      "x": 30,
      "y": 35,
      "width": 20,
      "height": 15
    }
  },

  'enchanted-glade': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "seelie-courts",
    "regionName": "Seelie Courts",
    "welcomeMessages": {
      "base": "Welcome to the Enchanted Glade where midnight wishes bend fairy light.",
      "variations": [
        "Will-o-wisps trace spirals above dew jeweled petals.",
        "Mushroom circles hum with gentle harmonic chords.",
        "Silver pollen drifts forming temporary sigils overhead."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fairy",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 25,
      "max": 80
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "midnight_wish_ritual",
        "chance": 0.2,
        "description": "Successful wish ritual improves next encounter rarity."
      },
      {
        "type": "glade_alignment",
        "chance": 0.12,
        "description": "Ambient magic surge strengthens Fairy moves."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/enchanted-glade-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Forest floor basin",
    "temperature": "60°F to 75°F",
    "weatherPatterns": "Glow pollen drifts, harmonic breeze tone shifts",
    "accessibility": "Spiral petal portal alignment",
    "recommendedLevel": "30-55",
    "specialFeatures": [
      "Illuminated Root Webs",
      "Aureole Bloom Rings",
      "Harmony Stone Circles"
    ],
    "wildlife": [
      {
        "name": "Glowcap Hopper",
        "species": "Shroomish / Mushroomon / Lunalop",
        "type": "Grass/Fairy",
        "rarity": "Common",
        "description": "Bounces between glowing caps spreading spores evenly."
      },
      {
        "name": "Fae Sylphid",
        "species": "Cutiefly / Fairimon / Petallia",
        "type": "Fairy/Bug",
        "rarity": "Uncommon",
        "description": "Maintains harmonic resonance with wing vibrations."
      },
      {
        "name": "Aureole Warden",
        "species": "Gardevoir / Kazemon / Sweepa",
        "type": "Fairy/Psychic",
        "rarity": "Rare",
        "description": "Monitors bloom ring energy thresholds."
      }
    ],
    "resources": [
      {
        "name": "Harmony Dewdrop",
        "rarity": "Rare",
        "description": "Amplifies positive resonance in crafted charms."
      },
      {
        "name": "Glow Pollen Pod",
        "rarity": "Uncommon",
        "description": "Soft capsule releasing steady luminescent dust."
      },
      {
        "name": "Fae Petal Cluster",
        "rarity": "Common",
        "description": "Delicate bloom fragments for basic infusions."
      }
    ],
    "lore": "Glade attunes to distant courts, reflecting seasonal mood shifts.",
    "history": "Stabilized after wardstones anchored fluctuating portals.",
    "dangers": [
      "Resonance overload dizziness",
      "Spore haze drowsiness"
    ],
    "tips": [
      "Do not disrupt bloom rings",
      "Move calmly to avoid tone spikes",
      "Carry grounding charm"
    ],
    "description": "Bioluminescent clearing humming with layered fae harmonics.",
    "mapCoordinates": {
      "x": 15,
      "y": 70,
      "width": 30,
      "height": 25
    }
  },

  'eternal-dusk': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "ravens-shadow",
    "regionName": "Raven's Shadow",
    "welcomeMessages": {
      "base": "You enter the Eternal Dusk Grove, where twilight geometry defies natural law.",
      "variations": [
        "Trees cast multiple conflicting shadows.",
        "Raven silhouettes merge then split along branch lines.",
        "Ambient light never brightens nor fully fades."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Ghost"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 60,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Shadow Path Token"
    },
    "specialEncounters": [
      {
        "type": "paradox_shadow",
        "chance": 0.21,
        "description": "A shadow detaches forming a rare Dark/Ghost hybrid."
      },
      {
        "type": "raven_riddle_event",
        "chance": 0.11,
        "description": "Solving a spatial riddle alters encounter table favorably."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/eternal-dusk-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Undulating moor",
    "temperature": "35°F to 55°F",
    "weatherPatterns": "Faint auric haze, drifting feather motes",
    "accessibility": "Shadow path induction",
    "recommendedLevel": "50-80",
    "specialFeatures": [
      "Feather Fog Bands",
      "Twilight Rune Monoliths",
      "Dusk Echo Pools"
    ],
    "wildlife": [
      {
        "name": "Moor Corvid",
        "species": "Murkrow / Ravemon / Galeclaw",
        "type": "Dark/Flying",
        "rarity": "Common",
        "description": "Circles low rune monoliths tracking echo patterns."
      },
      {
        "name": "Dusk Lurker",
        "species": "Umbreon / Sangloupmon / Vixy",
        "type": "Dark",
        "rarity": "Uncommon",
        "description": "Glides through fog banks using silent paw steps."
      },
      {
        "name": "Twilight Seer",
        "species": "Absol / Phantomon / Katress",
        "type": "Dark/Psychic",
        "rarity": "Rare",
        "description": "Reads faint probability ripples across rune stones."
      }
    ],
    "resources": [
      {
        "name": "Twilight Essence",
        "rarity": "Rare",
        "description": "Condensed dusk energy for shadowcrafting."
      },
      {
        "name": "Feather Mote Cluster",
        "rarity": "Uncommon",
        "description": "Suspended particulate from corvid flocks."
      },
      {
        "name": "Rune Lichen",
        "rarity": "Common",
        "description": "Grows on monoliths absorbing echo traces."
      }
    ],
    "lore": "Dusk never fully fades, preserving contemplative stillness.",
    "history": "Once a battlefield—now reclaimed by layered shadow wards.",
    "dangers": [
      "Visibility loss",
      "Echo confusion",
      "Shadow predators"
    ],
    "tips": [
      "Mark approach path",
      "Avoid overlapping fog bands",
      "Listen for low wingbeats"
    ],
    "description": "Perpetual twilight moor shrouded in murmuring feather-fog.",
    "mapCoordinates": {
      "x": 20,
      "y": 70,
      "width": 30,
      "height": 25
    }
  },

  'eternal-flame': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to the Eternal Flame Shrine, the mountain peak where the sacred flame burns as a beacon for all the island!",
      "variations": [
        "The eternal flame atop this mountain peak serves as a divine beacon visible across the entire island.",
        "Sacred energies converge at this peak shrine where the eternal flame has burned since time immemorial.",
        "The divine light of the eternal flame illuminates your path in this most sacred of places."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Flying"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 50,
      "max": 100
    },
    "agroRange": {
      "min": 60,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Sacred Flame Token"
    },
    "specialEncounters": [
      {
        "type": "eternal_flame_guardian",
        "chance": 0.25,
        "description": "The legendary guardian of the eternal flame challenges worthy adventurers!"
      },
      {
        "type": "divine_blessing",
        "chance": 0.2,
        "description": "The eternal flame bestows a divine blessing upon your monsters!"
      },
      {
        "type": "phoenix_sighting",
        "chance": 0.05,
        "description": "A mythical phoenix appears, drawn by the eternal flame's power!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/eternal-flame-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "3800 ft",
    "temperature": "85°F to 110°F",
    "weatherPatterns": "Warm, mystical energy fluctuations",
    "accessibility": "Spiritual pilgrims and researchers",
    "recommendedLevel": "50+",
    "specialFeatures": [
      "Natural Eternal Fire",
      "Mystical Energy",
      "Reality Distortions",
      "Spiritual Visions",
      "Ancient Meditation Site"
    ],
    "wildlife": [
      {
        "name": "Flame Wisp",
        "species": "Lampent / Candlemon / Flambelle",
        "type": "Fire/Ghost",
        "rarity": "Uncommon",
        "description": "Spirits born from the eternal flame"
      },
      {
        "name": "Vision Serpent",
        "species": "Arbok / Devimon / Pyrin",
        "type": "Fire/Psychic",
        "rarity": "Rare",
        "description": "Snakes that show glimpses of the future"
      },
      {
        "name": "Oracle Moth",
        "species": "Volcarona / FlyBeemon",
        "type": "Fire/Bug",
        "rarity": "Uncommon",
        "description": "Moths drawn to the mystical flame"
      }
    ],
    "resources": [
      {
        "name": "Mystical Flame",
        "rarity": "Extreme",
        "description": "Fire that reveals hidden truths"
      },
      {
        "name": "Vision Crystals",
        "rarity": "Rare",
        "description": "Crystals that store prophetic visions"
      },
      {
        "name": "Eternal Embers",
        "rarity": "Uncommon",
        "description": "Glowing embers that never die out"
      }
    ],
    "lore": "The Eternal Flame is said to be a window into the cosmic fire that burns at the heart of creation. Those who meditate by its light may receive visions of past, present, or future.",
    "history": "This natural phenomenon has been revered since ancient times. Many prophets and seers have received their visions while meditating beside the eternal flame.",
    "dangers": [
      "Overwhelming visions",
      "Mystical energy exposure",
      "Reality distortions",
      "Spiritual possession",
      "Truth revelations"
    ],
    "tips": [
      "Prepare mentally for visions",
      "Limit exposure time",
      "Bring spiritual anchors",
      "Meditate with caution",
      "Record any visions received"
    ],
    "description": "Natural gas fire that has burned continuously for millennia, creating a mystical site where the boundary between physical and spiritual realms grows thin.",
    "mapCoordinates": {
      "x": 50,
      "y": 10,
      "width": 12,
      "height": 15
    }
  },

  'eternal-glacier': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to the Eternal Glacier—ancient ice that remembers, and a horizon that doesn't blink.",
      "variations": [
        "Cracks sing old songs; step to the rhythm or not at all.",
        "Frost halos drift above crevasses—giant bridges appear when they are needed, not wanted.",
        "Breath crystals hang in the air like tiny omens."
      ]
    },
    "battleParameters": {
      "weather": "snow",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Water",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 14,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Glacier Oath Charm"
    },
    "specialEncounters": [
      {
        "type": "memory_ice",
        "chance": 0.22,
        "description": "Echoing ice reveals rare Ice/Fairy elites with recall auras."
      },
      {
        "type": "giant_bridge",
        "chance": 0.1,
        "description": "A spectral span forms—Water/Ice guardian tests your passage."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/eternal-glacier-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "3000 ft",
    "temperature": "-40°F to 0°F",
    "weatherPatterns": "Primordial cold, time distortions, ancient weather patterns",
    "accessibility": "Extreme cold survival, archaeological permits",
    "recommendedLevel": "85+",
    "specialFeatures": [
      "Primordial Ice",
      "Frozen Memories",
      "Time Distortions",
      "Ancient Artifacts",
      "World Creation Evidence"
    ],
    "wildlife": [
      {
        "name": "Ancient Ice Dragon",
        "species": "Kyurem / MetalGarurumon / Cryolinx",
        "type": "Ice/Dragon",
        "rarity": "Extreme",
        "description": "Dragon that remembers the world's creation"
      },
      {
        "name": "Memory Wraith",
        "species": "Froslass / LadyDevimon",
        "type": "Ice/Ghost",
        "rarity": "Rare",
        "description": "Spirits of forgotten events trapped in ice"
      },
      {
        "name": "Primordial Beast",
        "species": "Mamoswine / Mammemon / Wumpo",
        "type": "Ice/Rock",
        "rarity": "Rare",
        "description": "Creatures from the world's earliest days"
      }
    ],
    "resources": [
      {
        "name": "Primordial Ice",
        "rarity": "Extreme",
        "description": "Ice from the world's creation containing ancient power"
      },
      {
        "name": "Frozen Memories",
        "rarity": "Extreme",
        "description": "Crystallized memories of forgotten ages"
      },
      {
        "name": "Creation Artifacts",
        "rarity": "Rare",
        "description": "Relics from the time when the world was young"
      }
    ],
    "lore": "The Eternal Glacier is a remnant of the world's creation, holding within its ice the memories and artifacts of ages long past, including evidence of the first conflicts between gods and giants.",
    "history": "Formed at the world's beginning, the glacier has slowly advanced and retreated across the landscape, preserving everything it touches in eternal ice.",
    "dangers": [
      "Extreme primordial cold",
      "Time distortion effects",
      "Ancient curses in the ice",
      "Overwhelming historical visions",
      "Glacier shifts and collapses"
    ],
    "tips": [
      "Bring the most advanced cold protection available",
      "Study temporal magic for protection",
      "Work with archaeologists and historians",
      "Prepare for profound historical revelations",
      "Respect the ancient power contained within"
    ],
    "description": "Massive glacier that has existed since the world's creation, containing frozen memories of the past and serving as a bridge between the world of mortals and giants.",
    "mapCoordinates": {
      "x": 20,
      "y": 70,
      "width": 40,
      "height": 25
    }
  },

  'feather-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "quetzal-winds",
    "regionName": "Quetzal Winds",
    "welcomeMessages": {
      "base": "Welcome to Feather Town—rainbow plumes, ceremonial stitches, and art that flutters when you blink.",
      "variations": [
        "Looms hum in birdsong meter; tailfeathers become tapestry and myth.",
        "Dyers coax sunrise from pigments; even the wind leaves with souvenirs.",
        "Quetzal masks watch from lintels—smile back, it’s polite."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "E",
        "D"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 4,
      "max": 14
    },
    "agroRange": {
      "min": 5,
      "max": 30
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "plume_pageant",
        "chance": 0.22,
        "description": "Festival finery boosts Flying/Fairy support effects and spawn rates."
      },
      {
        "type": "quetzal_blessing",
        "chance": 0.12,
        "description": "A sacred dance calls a rare Grass/Flying herald to the plaza."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/feather-town-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "2500 ft",
    "temperature": "65°F to 85°F",
    "weatherPatterns": "Gentle breezes, colorful feather showers from sky birds",
    "accessibility": "Artists and craft enthusiasts welcome",
    "recommendedLevel": "25+",
    "specialFeatures": [
      "Featherwork Artisans",
      "Ceremonial Garments",
      "Rainbow Plume Collection",
      "Sacred Art Creation",
      "Cultural Preservation"
    ],
    "wildlife": [
      {
        "name": "Rainbow Quetzal",
        "species": "Ho-Oh / Phoenixmon",
        "type": "Flying/Fairy",
        "rarity": "Rare",
        "description": "Birds with the most beautiful feathers in the world"
      },
      {
        "name": "Artisan Bird",
        "species": "Noctowl / Peckmon / Tocotoco",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Birds that help collect and sort feathers"
      },
      {
        "name": "Weaver Spider",
        "species": "Ariados / Arukenimon",
        "type": "Bug/Flying",
        "rarity": "Common",
        "description": "Spiders that create delicate feather-pattern webs"
      }
    ],
    "resources": [
      {
        "name": "Sacred Feathers",
        "rarity": "Rare",
        "description": "Plumes blessed by Quetzalcoatl"
      },
      {
        "name": "Ceremonial Garments",
        "rarity": "Uncommon",
        "description": "Beautiful clothing made from rainbow feathers"
      },
      {
        "name": "Artisan Tools",
        "rarity": "Common",
        "description": "Specialized equipment for featherwork"
      }
    ],
    "lore": "Feather Town preserves the ancient Aztec art of featherwork, creating sacred objects that honor Quetzalcoatl and celebrate the beauty of the sky.",
    "history": "Established by master featherworkers who sought to preserve traditional Aztec arts, the town has become famous for its magnificent ceremonial creations.",
    "dangers": [
      "Allergic reactions to exotic feathers",
      "Competition among artisans",
      "Cultural appropriation concerns",
      "Expensive art materials"
    ],
    "tips": [
      "Learn about Aztec featherwork traditions",
      "Respect the cultural significance of designs",
      "Support local artisans",
      "Study color theory and patterns",
      "Appreciate the sacred nature of the craft"
    ],
    "description": "Colorful town where artisans craft magnificent featherwork art inspired by Quetzalcoatl, creating ceremonial garments and sacred objects from rainbow plumes.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'flame-chasm': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "draconic-abyss",
    "regionName": "Draconic Abyss",
    "welcomeMessages": {
      "base": "You descend toward the Flame Chasm where dragonfire cascades into a bottomless rift.",
      "variations": [
        "Heat plumes spiral upward carrying ember motes that roar like distant wings.",
        "Molten cataracts pulse in rhythmic trial intervals.",
        "Soot silhouettes of fledgling drakes dart between glowing ledges."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Dragon",
        "Dark"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 65,
      "max": 100
    },
    "agroRange": {
      "min": 70,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Heat Ward Plating"
    },
    "specialEncounters": [
      {
        "type": "trial_flare_surge",
        "chance": 0.23,
        "description": "A flare surge empowers Fire/Dragon hybrids."
      },
      {
        "type": "ember_plunge_trial",
        "chance": 0.12,
        "description": "Survive a ledge collapse to trigger a rare encounter."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/flame-chasm-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Ledge descent tiers",
    "temperature": "800°F vents / 120°F ambient ledges",
    "weatherPatterns": "Heat plumes, ember shear gusts",
    "accessibility": "Heat wards & descent anchors",
    "recommendedLevel": "70-100",
    "specialFeatures": [
      "Molten Cataracts",
      "Trial Ledges",
      "Ember Updraft Columns"
    ],
    "wildlife": [
      {
        "name": "Chasm Drakelet",
        "species": "Gible / Candlemon / Pyrin",
        "type": "Dragon/Fire",
        "rarity": "Common",
        "description": "Practices flare dives along inner walls."
      },
      {
        "name": "Ember Mantle",
        "species": "Magmar / Flamedramon / Foxparks",
        "type": "Fire/Fighting",
        "rarity": "Uncommon",
        "description": "Skims lava arcs stabilizing mantle heat."
      },
      {
        "name": "Rift Infernal",
        "species": "Charizard / SkullSatamon / Jetragon",
        "type": "Fire/Dark",
        "rarity": "Rare",
        "description": "Surfaces during synchronized flare surges."
      }
    ],
    "resources": [
      {
        "name": "Chasm Core Slag",
        "rarity": "Rare",
        "description": "Dense cooled magma with impurity reduction traits."
      },
      {
        "name": "Heat Plume Crystal",
        "rarity": "Uncommon",
        "description": "Grown in turbulent updraft, stores thermal charge."
      },
      {
        "name": "Basalt Ember Chip",
        "rarity": "Common",
        "description": "Glowing shard from rapid quench cycles."
      }
    ],
    "lore": "Trial site where young drakes temper wings against inferno turbulence.",
    "history": "Stabilized when anchor rings were forged by volcanic custodians.",
    "dangers": [
      "Shear updraft toss",
      "Lava arc splash",
      "Anchor rope failure"
    ],
    "tips": [
      "Monitor plume rhythm",
      "Secure dual tethers",
      "Avoid descent during triple flare phase"
    ],
    "description": "Bottomless inferno rift where molten cataracts test drake lineage.",
    "mapCoordinates": {
      "x": 15,
      "y": 70,
      "width": 18,
      "height": 25
    }
  },

  'floating-gardens': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "quetzal-winds",
    "regionName": "Quetzal Winds",
    "welcomeMessages": {
      "base": "Welcome to the Floating Gardens—aerial orchards drifting on whispered windcraft.",
      "variations": [
        "Lattice roots sip clouds; gardeners prune with kites.",
        "Fruit bells chime as terraces glide past the sun.",
        "Mind the step—gravity is more of a suggestion here."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Flying",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "aerial_bloom",
        "chance": 0.22,
        "description": "Windborne pollen spikes Grass/Fairy spawns with restorative boons."
      },
      {
        "type": "wind_harvest",
        "chance": 0.12,
        "description": "A perfect updraft brings a rare Flying/Grass keeper to the beds."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/floating-gardens-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "5000 ft",
    "temperature": "55°F to 75°F",
    "weatherPatterns": "Carefully controlled wind currents, magical plant growth",
    "accessibility": "Aerial botanists and wind magic practitioners",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Aerial Agriculture",
      "Floating Plant Beds",
      "Wind Magic Cultivation",
      "Sky Botany",
      "Magical Horticulture"
    ],
    "wildlife": [
      {
        "name": "Sky Gardener",
        "species": "Trevenant / Lilamon",
        "type": "Grass/Flying",
        "rarity": "Rare",
        "description": "Plant spirits that tend the floating gardens"
      },
      {
        "name": "Nectar Hummingbird",
        "species": "Comfey / Fairymon / Necromus",
        "type": "Flying/Fairy",
        "rarity": "Common",
        "description": "Tiny birds that pollinate aerial flowers"
      },
      {
        "name": "Wind Flower",
        "species": "Whimsicott / Floramon",
        "type": "Grass/Flying",
        "rarity": "Uncommon",
        "description": "Living plants that float freely through the air"
      }
    ],
    "resources": [
      {
        "name": "Sky Fruits",
        "rarity": "Rare",
        "description": "Fruits that can only grow in floating gardens"
      },
      {
        "name": "Wind Pollen",
        "rarity": "Uncommon",
        "description": "Magical pollen that enhances plant growth"
      },
      {
        "name": "Aerial Seeds",
        "rarity": "Common",
        "description": "Seeds adapted for growth without soil"
      }
    ],
    "lore": "The Floating Gardens represent the mastery of combining wind magic with botanical knowledge, creating impossible agricultural systems that defy gravity.",
    "history": "Developed by Aztec agricultural mages who learned to use wind magic for farming, the gardens have become a marvel of magical engineering.",
    "dangers": [
      "Falling from floating platforms",
      "Wind magic plant interactions",
      "Unstable floating garden sections",
      "Magical pollen allergies",
      "Navigation difficulties in 3D space"
    ],
    "tips": [
      "Master basic flight or wind magic",
      "Study aerial botany principles",
      "Wear safety harnesses",
      "Learn to navigate in three dimensions",
      "Respect the delicate magical balance"
    ],
    "description": "Magical gardens suspended in mid-air by wind magic, where rare plants grow without soil and aerial agriculture produces unique fruits and flowers.",
    "mapCoordinates": {
      "x": 15,
      "y": 65,
      "width": 30,
      "height": 25
    }
  },

  'fog-temple': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "mist-marshlands",
    "regionName": "Mist Marshlands",
    "welcomeMessages": {
      "base": "You approach the hidden Fog Temple, its silhouette shifting within luminous marsh haze.",
      "variations": [
        "Bog spirits trace spiral glyphs in drifting vapor.",
        "Condensation beads into hovering droplets that refract pale runes.",
        "Submerged bells toll with muffled resonance beneath boardwalks."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Grass",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 30,
      "max": 80
    },
    "agroRange": {
      "min": 25,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "spirit_mist_convergence",
        "chance": 0.2,
        "description": "Mist density spike heightens Ghost/Water rarity."
      },
      {
        "type": "echoing_bell_ritual",
        "chance": 0.11,
        "description": "Bell resonance triggers a guardian apparition."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/fog-temple-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Bog water level",
    "temperature": "55°F to 68°F",
    "weatherPatterns": "Dense mist pulses, spectral glow halos",
    "accessibility": "Boardwalk approach (low visibility gear)",
    "recommendedLevel": "65-95",
    "specialFeatures": [
      "Spirit Bell Causeways",
      "Mist Glyph Pools",
      "Echo Vault Chambers"
    ],
    "wildlife": [
      {
        "name": "Mist Warden",
        "species": "Dusclops / Shakomon / Celeray",
        "type": "Ghost/Water",
        "rarity": "Uncommon",
        "description": "Guards glyph pools with silent hover."
      },
      {
        "name": "Bog Lantern",
        "species": "Lampent / Palmon / Teafant",
        "type": "Ghost/Grass",
        "rarity": "Common",
        "description": "Drifts lighting safe stepping stones."
      },
      {
        "name": "Echo Naiad",
        "species": "Mareanie / Syakomon / Lumira",
        "type": "Water/Poison",
        "rarity": "Rare",
        "description": "Manifests in resonance rings during bell cycles."
      }
    ],
    "resources": [
      {
        "name": "Mist Glyph Fragment",
        "rarity": "Rare",
        "description": "Arcane pattern shard stabilizing spectral infusions."
      },
      {
        "name": "Luminous Peat",
        "rarity": "Uncommon",
        "description": "Glowing organic substrate enhancing growth rituals."
      },
      {
        "name": "Spirit Condensate",
        "rarity": "Common",
        "description": "Condensed vapor droplet with faint echo energy."
      }
    ],
    "lore": "Temple echoes align with primordial marsh breathing cycles.",
    "history": "Rediscovered after drought lowered outer fog curtains.",
    "dangers": [
      "Visibility collapse",
      "Spirit misdirection",
      "Slick algae slips"
    ],
    "tips": [
      "Mark path knots",
      "Listen for bell triple-tone",
      "Carry anti-slip pads"
    ],
    "description": "Submerged sanctum veiled by luminous marsh haze and spirit bells.",
    "mapCoordinates": {
      "x": 35,
      "y": 70,
      "width": 18,
      "height": 20
    }
  },

  'forge-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hephaestus-forge",
    "regionName": "Hephaestus Forge",
    "welcomeMessages": {
      "base": "Ore carts rattle as you arrive in Forge Town—gateway to divine metal veins.",
      "variations": [
        "Refining towers vent steady orange plumes.",
        "Apprentices assay glowing ingots at slag terraces.",
        "Chromatic sparks arc between calibration pylons."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Steel",
        "Rock",
        "Fire"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 20,
      "max": 60
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "rich_vein_strike",
        "chance": 0.18,
        "description": "A newly exposed vein attracts rare Steel-type fusions."
      },
      {
        "type": "furnace_overpressure",
        "chance": 0.1,
        "description": "Pressure spike animates molten alloy guardian."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/forge-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "2,150 ft",
    "temperature": "75°F to 105°F",
    "weatherPatterns": "Sparking vent haze, rhythmic pressure puffs",
    "accessibility": "Ore rail spur",
    "recommendedLevel": "25-55",
    "specialFeatures": [
      "Refining Towers",
      "Calibration Pylons",
      "Slag Quench Basins"
    ],
    "wildlife": [
      {
        "name": "Ore Burrower",
        "species": "Drilbur / Hagurumon / Dumud",
        "type": "Ground/Steel",
        "rarity": "Common",
        "description": "Surfaces near fresh seam markers."
      },
      {
        "name": "Furnace Skink",
        "species": "Salazzle / Candlemon / Depresso",
        "type": "Fire/Poison",
        "rarity": "Uncommon",
        "description": "Absorbs trace fumes regulating vent pressure."
      },
      {
        "name": "Alloy Sentinel",
        "species": "Magnezone / Guardromon / Digtoise",
        "type": "Steel/Electric",
        "rarity": "Rare",
        "description": "Monitors refinery output purity."
      }
    ],
    "resources": [
      {
        "name": "Refined Alloy Ingot",
        "rarity": "Rare",
        "description": "High-grade structural metal for advanced craft."
      },
      {
        "name": "Slag Glass Chunk",
        "rarity": "Uncommon",
        "description": "Cooled vitrified residue with trace catalysts."
      },
      {
        "name": "Ore Dust Sample",
        "rarity": "Common",
        "description": "Granular assay feedstock."
      }
    ],
    "lore": "Supply hub enabling deeper forge region expansion.",
    "history": "Founded around convergence of three ore veins.",
    "dangers": [
      "Conveyor pinch points",
      "Fume buildup",
      "Ore cart derailment"
    ],
    "tips": [
      "Wear filtration mask",
      "Keep clear of moving rails",
      "Log seam shifts daily"
    ],
    "description": "Refining hub where ore caravans feed divine smelter stacks.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'frost-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Frost Village—giant-country modesty, hearth grit, and neighbors who shovel your roof.",
      "variations": [
        "Windbreak palisades sing; braided ropes guide you home in whiteouts.",
        "Sled bells mark the paths; soup kettles mark the end of them.",
        "The aurora checks in nightly—dress for guests."
      ]
    },
    "battleParameters": {
      "weather": "snow",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Normal",
        "Fighting"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 10,
      "max": 20
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "whiteout_watch",
        "chance": 0.2,
        "description": "Approaching squall empowers Ice defenders with resilience boons."
      },
      {
        "type": "hearth_oath",
        "chance": 0.12,
        "description": "Village oath-rite summons a rare Normal/Fighting guardian to spar."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/frost-village-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "1500 ft",
    "temperature": "-20°F to 20°F",
    "weatherPatterns": "Harsh winters, brief summers, frequent snow",
    "accessibility": "Cold weather survival skills required",
    "recommendedLevel": "55+",
    "specialFeatures": [
      "Norse Survival Techniques",
      "Ice Architecture",
      "Giant Relations",
      "Winter Festivals",
      "Frost Resistance Training"
    ],
    "wildlife": [
      {
        "name": "Frost Wolf",
        "species": "Mightyena / Garurumon",
        "type": "Ice/Normal",
        "rarity": "Common",
        "description": "Hardy wolves adapted to extreme cold"
      },
      {
        "name": "Ice Bear",
        "species": "Beartic / Grizzlemon / Chillet",
        "type": "Ice/Fighting",
        "rarity": "Uncommon",
        "description": "Powerful bears that thrive in frozen conditions"
      },
      {
        "name": "Snow Owl",
        "species": "Noctowl / Falcomon",
        "type": "Ice/Flying",
        "rarity": "Common",
        "description": "Silent hunters of the tundra"
      }
    ],
    "resources": [
      {
        "name": "Frost-Resistant Furs",
        "rarity": "Rare",
        "description": "Pelts that provide exceptional cold protection"
      },
      {
        "name": "Ice Tools",
        "rarity": "Common",
        "description": "Tools designed for frozen environments"
      },
      {
        "name": "Winter Supplies",
        "rarity": "Common",
        "description": "Essential goods for surviving harsh winters"
      }
    ],
    "lore": "Frost Village represents human resilience and adaptation, showing how mortals can survive and even thrive in the harshest conditions through determination and skill.",
    "history": "Founded by Norse settlers who refused to be driven away by the giants, the village has developed unique techniques for surviving in giant territory.",
    "dangers": [
      "Extreme cold exposure",
      "Giant raids and conflicts",
      "Blizzards and whiteouts",
      "Food and fuel shortages",
      "Isolation during storms"
    ],
    "tips": [
      "Master cold weather survival first",
      "Stock up on winter supplies",
      "Learn to recognize giant signs",
      "Build relationships with villagers",
      "Respect the harsh environment"
    ],
    "description": "Hardy Norse settlement built to survive in giant territory, where brave humans live in harmony with the frozen landscape using ancient survival techniques.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 18,
      "height": 15
    }
  },

  'gaia-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "terra-madre-basin",
    "regionName": "Terra Madre Basin",
    "welcomeMessages": {
      "base": "Welcome to Gaia Town—where streets have root systems and the compost has opinions.",
      "variations": [
        "Stone paths breathe with moss; the bylaws are printed on leaves.",
        "Windmills spin slow wisdom—power, yes, but also poetry.",
        "Offer a seed, gain a friend; offer two, gain a forest."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Ground",
        "Rock",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 10,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "earth_concord",
        "chance": 0.2,
        "description": "Leyline harmony boosts Grass/Ground support and spawn rates."
      },
      {
        "type": "stone_bloom",
        "chance": 0.12,
        "description": "A rock garden blossoms—rare Rock/Fairy steward appears."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/gaia-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "700 ft",
    "temperature": "68°F to 78°F",
    "weatherPatterns": "Perfectly balanced climate, harmonious natural cycles",
    "accessibility": "Environmentalists and nature lovers",
    "recommendedLevel": "35+",
    "specialFeatures": [
      "Perfect Ecological Balance",
      "Gaia Worship",
      "Environmental Harmony",
      "Natural Architecture",
      "Ecosystem Integration"
    ],
    "wildlife": [
      {
        "name": "Gaia Avatar",
        "species": "Celebi / Rosemon / Verdash",
        "type": "Grass/Psychic",
        "rarity": "Extreme",
        "description": "Manifestation of the Earth Mother herself"
      },
      {
        "name": "Harmony Bird",
        "species": "Togekiss / Piyomon",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Birds that sing in perfect natural rhythm"
      },
      {
        "name": "Balance Beast",
        "species": "Virizion / Lilymon / Eikthyrdeer",
        "type": "Normal/Grass",
        "rarity": "Uncommon",
        "description": "Creatures that maintain ecosystem equilibrium"
      }
    ],
    "resources": [
      {
        "name": "Gaia's Blessing",
        "rarity": "Extreme",
        "description": "Direct blessing from the Earth Mother"
      },
      {
        "name": "Natural Harmony",
        "rarity": "Rare",
        "description": "Understanding of perfect ecological balance"
      },
      {
        "name": "Living Architecture",
        "rarity": "Uncommon",
        "description": "Buildings that grow from and support nature"
      }
    ],
    "lore": "Gaia Town represents the ultimate goal of environmental harmony, where human needs and natural ecosystems support each other in perfect balance.",
    "history": "Established by environmental philosophers who sought to prove that civilization and nature could coexist, the town has become a model for sustainable living.",
    "dangers": [
      "Strict environmental regulations",
      "Overwhelming natural harmony",
      "Gaia's judgment of environmental crimes",
      "Ecosystem sensitivity"
    ],
    "tips": [
      "Study ecological principles",
      "Respect all forms of life",
      "Learn sustainable living practices",
      "Participate in environmental restoration",
      "Honor Gaia through actions"
    ],
    "description": "Eco-conscious town dedicated to the Greek primordial goddess Gaia, where harmony between human civilization and natural ecosystems is perfectly balanced.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'golden-hall': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hearthfall-commons",
    "regionName": "Hearthfall Commons",
    "welcomeMessages": {
      "base": "Welcome to the Golden Hall—tapestries of bragging rights and mead with muscle memory.",
      "variations": [
        "Long tables, louder laughter—stories polished shinier than the walls.",
        "Champion plaques wink as you pass—either luck or lighting.",
        "If the horn sounds, it’s a toast; if it sounds twice, it’s your turn."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Normal",
        "Fighting",
        "Fire",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 12,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "heroic_toast",
        "chance": 0.2,
        "description": "A round of honors boosts Normal/Fighting allies with morale boons."
      },
      {
        "type": "tapestry_trial",
        "chance": 0.1,
        "description": "A deed woven in gold challenges you—rare Fire/Fairy patron appears."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/golden-hall-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "500 ft",
    "temperature": "60°F to 80°F",
    "weatherPatterns": "Warm and festive atmosphere",
    "accessibility": "Heroes and legends welcome, others by invitation",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Extreme Mead Hall",
      "Hero Tapestries",
      "Trophy Displays",
      "Epic Feasts",
      "Warrior's Rest"
    ],
    "wildlife": [
      {
        "name": "Hall Guardian",
        "species": "Machamp / Wargreymon / Anubis",
        "type": "Normal/Fighting",
        "rarity": "Rare",
        "description": "Noble protectors of the Extreme hall"
      },
      {
        "name": "Mead Bear",
        "species": "Ursaring / Bearmon / Kingpaca",
        "type": "Normal",
        "rarity": "Uncommon",
        "description": "Friendly bears that help serve at feasts"
      },
      {
        "name": "Saga Bird",
        "species": "Noctowl / Owlmon / Hoocrates",
        "type": "Normal/Psychic",
        "rarity": "Rare",
        "description": "Birds that remember and recite heroic tales"
      }
    ],
    "resources": [
      {
        "name": "Hero's Mead",
        "rarity": "Rare",
        "description": "Extreme drink that inspires courage"
      },
      {
        "name": "Golden Chalices",
        "rarity": "Rare",
        "description": "Ceremonial cups used in victory toasts"
      },
      {
        "name": "Victory Banners",
        "rarity": "Uncommon",
        "description": "Tapestries commemorating great achievements"
      }
    ],
    "lore": "The Golden Hall has hosted the greatest heroes and legends for centuries. It is said that only those who have performed truly heroic deeds can see the hall's true golden splendor.",
    "history": "Built to honor the greatest achievements of trainers and their Monsters. The hall serves as both museum and gathering place for the most accomplished adventurers.",
    "dangers": [
      "Competitive atmosphere",
      "Challenges from veteran trainers",
      "High expectations for entry"
    ],
    "tips": [
      "Bring tales of heroism",
      "Challenge veteran trainers",
      "Contribute to the trophy collection",
      "Respect the hall's traditions",
      "Earn your place among legends"
    ],
    "description": "Magnificent mead hall where Extreme trainers gather to share tales of their adventures, featuring golden walls adorned with tapestries of great deeds.",
    "mapCoordinates": {
      "x": 25,
      "y": 55,
      "width": 20,
      "height": 15
    }
  },

  'golden-wheat': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "demeters-grove",
    "regionName": "Demeter's Grove",
    "welcomeMessages": {
      "base": "Welcome to the Golden Wheat—fields that gleam like sunrise and feed like folklore.",
      "variations": [
        "Wind combs the grain; the rows answer in rustled hymns.",
        "Threshing drums set an easy march—bring a basket, leave with blessings.",
        "Scarecrows bow as you pass—good manners or excellent rigging."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Normal",
        "Fairy",
        "Ground"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "E",
        "D"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 4,
      "max": 14
    },
    "agroRange": {
      "min": 5,
      "max": 30
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "harvest_glow",
        "chance": 0.22,
        "description": "Blessed rows boost Grass/Fairy support effects and rare spawns."
      },
      {
        "type": "field_guard",
        "chance": 0.12,
        "description": "A living scarecrow—Ground/Normal—offers a gentle duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/golden-wheat-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "300 ft",
    "temperature": "65°F to 80°F",
    "weatherPatterns": "Perfect agricultural conditions, golden light phenomena",
    "accessibility": "Open to all, peaceful agricultural area",
    "recommendedLevel": "15+",
    "specialFeatures": [
      "Endless Wheat Fields",
      "Divine Golden Light",
      "Eternal Abundance",
      "Peaceful Meditation",
      "Agricultural Perfection"
    ],
    "wildlife": [
      {
        "name": "Golden Deer",
        "species": "Sawsbuck / Deerling / Eikthyrdeer",
        "type": "Normal/Grass",
        "rarity": "Rare",
        "description": "Majestic deer with golden fur that graze peacefully"
      },
      {
        "name": "Wheat Fairy",
        "species": "Comfey / Palmon / Lyleen",
        "type": "Fairy/Grass",
        "rarity": "Uncommon",
        "description": "Tiny fairies that tend to individual wheat stalks"
      },
      {
        "name": "Harvest Rabbit",
        "species": "Buneary / Lopunny",
        "type": "Normal",
        "rarity": "Common",
        "description": "Gentle rabbits that help spread seeds"
      }
    ],
    "resources": [
      {
        "name": "Divine Wheat",
        "rarity": "Extreme",
        "description": "Wheat that glows with Demeter's blessing"
      },
      {
        "name": "Golden Grain",
        "rarity": "Rare",
        "description": "Grain with extraordinary nutritional properties"
      },
      {
        "name": "Abundance Essence",
        "rarity": "Uncommon",
        "description": "Magical essence that promotes growth"
      }
    ],
    "lore": "The Golden Wheat Fields represent Demeter's greatest gift to humanity - the promise that those who work the land with respect will never know hunger.",
    "history": "These fields have produced perfect harvests for thousands of years, serving as proof of Demeter's enduring love for humanity.",
    "dangers": [
      "Getting lost in vast fields",
      "Overwhelming sense of peace and contentment",
      "Temptation to never leave"
    ],
    "tips": [
      "Bring offerings of thanks to Demeter",
      "Respect the perfect growing conditions",
      "Meditate among the golden stalks",
      "Learn about sustainable agriculture",
      "Experience true abundance"
    ],
    "description": "Vast fields of golden wheat that stretch to the horizon, where Demeter's blessing ensures eternal abundance and the grain glows with divine light.",
    "mapCoordinates": {
      "x": 15,
      "y": 60,
      "width": 30,
      "height": 25
    }
  },

  'grand-colosseum': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "kshatriya-arena",
    "regionName": "Kshatriya Arena",
    "welcomeMessages": {
      "base": "Welcome to the Grand Colosseum—honor louder than crowds and sand that remembers every step.",
      "variations": [
        "Trumpets blaze; banners judge your posture.",
        "Oathstones line the tunnel—touch one, fight fair.",
        "Win or learn—both get applause."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Steel",
        "Fire",
        "Rock"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Honor Seal"
    },
    "specialEncounters": [
      {
        "type": "honor_trial",
        "chance": 0.22,
        "description": "Sanctioned duel spawns elite Fighting/Steel challengers."
      },
      {
        "type": "arena_inferno",
        "chance": 0.1,
        "description": "Ceremonial flames awaken a rare Fire/Rock champion."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/grand-colosseum-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "1150 ft",
    "temperature": "80°F to 105°F",
    "weatherPatterns": "Hot arena conditions, intense competition atmosphere",
    "accessibility": "Elite warriors and championship competitors",
    "recommendedLevel": "80+",
    "specialFeatures": [
      "Championship Battles",
      "Honorable Combat",
      "Warrior Competitions",
      "Grand Tournaments",
      "Elite Training"
    ],
    "wildlife": [
      {
        "name": "Champion Beast",
        "species": "Kommo-o / WarGreymon / Orserk",
        "type": "Fighting/Dragon",
        "rarity": "Extreme",
        "description": "Extreme creatures that compete alongside warriors"
      },
      {
        "name": "Arena Guardian",
        "species": "Terrakion / Volcamon",
        "type": "Fighting/Rock",
        "rarity": "Rare",
        "description": "Powerful beings that maintain arena order"
      },
      {
        "name": "Victory Eagle",
        "species": "Braviary / Hawkmon / Nitocris",
        "type": "Flying/Fighting",
        "rarity": "Uncommon",
        "description": "Eagles that crown tournament champions"
      }
    ],
    "resources": [
      {
        "name": "Championship Trophies",
        "rarity": "Extreme",
        "description": "Ultimate prizes for arena champions"
      },
      {
        "name": "Gladiator Gear",
        "rarity": "Rare",
        "description": "Equipment used by elite arena fighters"
      },
      {
        "name": "Combat Techniques",
        "rarity": "Uncommon",
        "description": "Advanced fighting methods"
      }
    ],
    "lore": "The Grand Colosseum represents the pinnacle of honorable combat, where warriors prove their worth not through brutality but through skill, courage, and adherence to noble codes.",
    "history": "Constructed to provide a venue for the greatest warriors to test themselves against equals, the colosseum has hosted Extreme battles that inspire generations.",
    "dangers": [
      "Elite-level combat",
      "Serious injury risk",
      "Intense competition pressure",
      "Public performance anxiety",
      "Career-defining battles"
    ],
    "tips": [
      "Master advanced combat techniques first",
      "Study arena combat rules thoroughly",
      "Build mental resilience",
      "Learn from champion fighters",
      "Maintain honor even in defeat"
    ],
    "description": "Massive arena where the greatest warriors compete in honorable combat, testing their skills in front of crowds while following strict codes of noble warfare.",
    "mapCoordinates": {
      "x": 25,
      "y": 60,
      "width": 30,
      "height": 25
    }
  },

  'great-nest': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to the Great Nest—lightning-forged boughs and thermals that whistle like hymns.",
      "variations": [
        "Charred timbers gleam with meteoric veins; feathers hum with static.",
        "Storm sap congeals into amber sparks—don’t pocket it unless you like surprises.",
        "Shadow passes. Count to one. Thunder answers."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Stormproof Visitor Band"
    },
    "specialEncounters": [
      {
        "type": "thunder_brood",
        "chance": 0.22,
        "description": "Brood call summons Electric/Flying elites to defend the nest."
      },
      {
        "type": "metal_feather_fall",
        "chance": 0.1,
        "description": "A meteoric pinion drops—rare Steel/Flying sentinel arrives."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/great-nest-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "9000 ft",
    "temperature": "20°F to 50°F",
    "weatherPatterns": "Intense electrical activity, protective storm barriers",
    "accessibility": "Sacred site - extreme danger, divine permission required",
    "recommendedLevel": "85+",
    "specialFeatures": [
      "Thunderbird's Nest",
      "Lightning-Struck Trees",
      "Storm Metal Architecture",
      "Sacred Territory",
      "Divine Protection"
    ],
    "wildlife": [
      {
        "name": "Thunderbird Alpha",
        "species": "Zapdos / Phoenixmon / Raiju",
        "type": "Electric/Flying",
        "rarity": "Extreme",
        "description": "The Great Thunderbird, master of all storms"
      },
      {
        "name": "Nest Guardian",
        "species": "Magnezone / Andromon / Raiju",
        "type": "Electric/Steel",
        "rarity": "Rare",
        "description": "Protective spirits of the sacred nest"
      },
      {
        "name": "Lightning Sprite",
        "species": "Rotom / Pixiemon / Raiju",
        "type": "Electric/Fairy",
        "rarity": "Uncommon",
        "description": "Tiny spirits that tend to the nest"
      }
    ],
    "resources": [
      {
        "name": "Sacred Lightning Wood",
        "rarity": "Extreme",
        "description": "Wood from trees blessed by the Thunderbird"
      },
      {
        "name": "Storm Forged Metal",
        "rarity": "Extreme",
        "description": "Metal created by divine lightning"
      },
      {
        "name": "Divine Egg Fragments",
        "rarity": "Extreme",
        "description": "Pieces of the Thunderbird's sacred eggs"
      }
    ],
    "lore": "The Great Nest is the home of the Extreme Thunderbird, the most sacred site in all of Thunderbird Heights. Only those deemed worthy by the great spirit may approach.",
    "history": "Built by the Thunderbird itself over countless centuries, the nest represents the pinnacle of storm mastery and divine power.",
    "dangers": [
      "Direct confrontation with Thunderbird",
      "Divine lightning strikes",
      "Protective storm barriers",
      "Sacred site violations",
      "Overwhelming divine presence"
    ],
    "tips": [
      "Seek permission from tribal elders first",
      "Undergo extensive purification",
      "Approach with utmost respect",
      "Bring sacred offerings",
      "Be prepared for spiritual trials"
    ],
    "description": "Massive nest of the Extreme Thunderbird, built from trees struck by lightning and reinforced with metals formed by electrical storms, visible from miles away.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 15,
      "height": 12
    }
  },

  'great-tree': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "anansi-woods",
    "regionName": "Anansi Woods",
    "welcomeMessages": {
      "base": "You stand at the roots of the Great Story Tree, trunk etched with living silk script.",
      "variations": [
        "Story weavers reposition threads depicting shifting legends.",
        "Amber sap globes project faint narrative silhouettes.",
        "Canopy chimes respond to whispered plot changes."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 18,
      "max": 55
    },
    "agroRange": {
      "min": 15,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "chapter_unfurl",
        "chance": 0.19,
        "description": "New silk chapter attracts rare narrative guardians."
      },
      {
        "type": "sap_illumination",
        "chance": 0.1,
        "description": "Glowing sap reveals a hidden Bug/Fairy hybrid."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/great-tree-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Root rise plateau",
    "temperature": "68°F to 82°F",
    "weatherPatterns": "Filtered sun shafts, pollen sparkle drift",
    "accessibility": "Spiral root ramp",
    "recommendedLevel": "35-65",
    "specialFeatures": [
      "Silk Rune Canopy",
      "Story Resin Globes",
      "Narrative Loom Hollows"
    ],
    "wildlife": [
      {
        "name": "Rune Weaver",
        "species": "Spinarak / Tentomon / Lumira",
        "type": "Bug/Fairy",
        "rarity": "Common",
        "description": "Spins adaptive glyph threads."
      },
      {
        "name": "Sap Storyling",
        "species": "Combee / Parasmon / Petallia",
        "type": "Bug/Grass",
        "rarity": "Uncommon",
        "description": "Harvests resin globes preserving tales."
      },
      {
        "name": "Baobab Guardian",
        "species": "Leavanny / Kuwagamon / Mossanda",
        "type": "Bug/Grass",
        "rarity": "Rare",
        "description": "Prunes dead silk to foster new narratives."
      }
    ],
    "resources": [
      {
        "name": "Story Resin",
        "rarity": "Rare",
        "description": "Encapsulated micro-tales boosting inspiration crafting."
      },
      {
        "name": "Silk Glyph Strand",
        "rarity": "Uncommon",
        "description": "Thread retaining faint narrative bias."
      },
      {
        "name": "Baobab Fiber",
        "rarity": "Common",
        "description": "Durable organic weave material."
      }
    ],
    "lore": "Said to anchor the first tale spun by the spider lord.",
    "history": "Expanded via cultivated branch latticework.",
    "dangers": [
      "Falling silk mats",
      "Story trance distraction"
    ],
    "tips": [
      "Avoid interrupting weavers",
      "Ground yourself after long reads",
      "Carry anti-adhesion salve"
    ],
    "description": "Ancient story baobab where silk runes weave living legends.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 18,
      "height": 20
    }
  },

  'hearthstone-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hearthfall-commons",
    "regionName": "Hearthfall Commons",
    "welcomeMessages": {
      "base": "Welcome to the Hearthstone Temple—a fire that never sleeps and blessings that travel well.",
      "variations": [
        "Warmth rolls from the altar like a friendly tide.",
        "Carved runes glow ember-gold; the air smells like home.",
        "Share a spark; carry a story back with you."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Normal",
        "Fire",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 10,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Hearth Sigil"
    },
    "specialEncounters": [
      {
        "type": "ember_blessing",
        "chance": 0.22,
        "description": "Lit hearth grants Fire/Fairy boons and pacifies foes briefly."
      },
      {
        "type": "guardian_kindling",
        "chance": 0.12,
        "description": "A temple warden—rare Normal/Fire—offers a protective pact trial."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/hearthstone-temple-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "600 ft",
    "temperature": "55°F to 75°F",
    "weatherPatterns": "Perpetually warm near the hearthstone",
    "accessibility": "Pilgrimage site, respectful visitors welcome",
    "recommendedLevel": "25+",
    "specialFeatures": [
      "Sacred Hearthstone",
      "Blessing Ceremonies",
      "Ancient Runes",
      "Guardian Spirits",
      "Pilgrimage Path"
    ],
    "wildlife": [
      {
        "name": "Hearth Spirit",
        "species": "Flareon / Flarimon",
        "type": "Fire/Ghost",
        "rarity": "Rare",
        "description": "Ancient guardians of the sacred flame"
      },
      {
        "name": "Temple Guardian",
        "species": "Machamp / Medicham",
        "type": "Fighting/Psychic",
        "rarity": "Rare",
        "description": "Protectors of the sacred site"
      },
      {
        "name": "Blessing Dove",
        "species": "Pidgeot / Piyomon",
        "type": "Normal/Fairy",
        "rarity": "Uncommon",
        "description": "White doves that carry blessings to homes"
      }
    ],
    "resources": [
      {
        "name": "Blessed Stones",
        "rarity": "Rare",
        "description": "Stones charged with eternal warmth"
      },
      {
        "name": "Sacred Ash",
        "rarity": "Uncommon",
        "description": "Ash from the eternal hearthstone"
      },
      {
        "name": "Holy Water",
        "rarity": "Common",
        "description": "Water blessed by the temple priests"
      }
    ],
    "lore": "The sacred hearthstone is said to be the first fire brought by ancient spirits to warm humanity. It represents the divine gift of home, hearth, and family bonds that can never be broken.",
    "history": "An ancient temple built around a divine gift of eternal warmth. Pilgrims from all over the island have visited for over a millennium to receive blessings for their homes and families.",
    "dangers": [
      "Sacred site - respect required",
      "Protective guardian spirits",
      "Spiritual trials for the unworthy"
    ],
    "tips": [
      "Show proper reverence",
      "Participate in blessing ceremonies",
      "Bring offerings for the temple",
      "Respect the pilgrimage traditions",
      "Seek guidance from temple priests"
    ],
    "description": "Ancient temple built around a sacred hearthstone that never grows cold, blessing homes across the region with eternal warmth and protection.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 12,
      "height": 10
    }
  },

  'heimdal-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hearthfall-commons",
    "regionName": "Hearthfall Commons",
    "needsMissionMandate": false,
    "welcomeMessages": {
      "base": "Welcome to Heimdal City, the warm heart of Hearthfall Commons! This bustling capital radiates comfort and community spirit.",
      "variations": [
        "The Great Hall's hearth burns bright, welcoming all adventurers to the capital of comfort and community.",
        "Heimdal City's wooden buildings and central hearths create a cozy atmosphere perfect for new adventures.",
        "The regional capital buzzes with activity as Normal-type Monsters gather in harmonious communities."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Normal"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "D",
        "E"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 1,
      "max": 25
    },
    "agroRange": {
      "min": 10,
      "max": 40
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "community_festival",
        "chance": 0.15,
        "description": "A community festival is taking place, bringing together trainers and monsters in celebration!"
      },
      {
        "type": "great_hall_challenge",
        "chance": 0.1,
        "description": "A legendary trainer in the Great Hall offers a friendly challenge!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/heimdal-city-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "500 ft",
    "temperature": "45°F to 65°F",
    "weatherPatterns": "Temperate, occasional light snow",
    "accessibility": "All skill levels welcome",
    "recommendedLevel": "10+",
    "specialFeatures": [
      "Regional Capital",
      "Monsters Center Network",
      "Great Hall",
      "Community Festivals",
      "Traditional Architecture"
    ],
    "wildlife": [
      {
        "name": "Hearth Guardian",
        "species": "Growlithe / Agumon / Foxparks",
        "type": "Normal/Fire",
        "rarity": "Common",
        "description": "Loyal protectors of homes and families"
      },
      {
        "name": "Comfort Beast",
        "species": "Audino / Patamon / Lovander",
        "type": "Normal/Fairy",
        "rarity": "Uncommon",
        "description": "Creatures that bring peace and warmth"
      },
      {
        "name": "City Wolf",
        "species": "Mightyena / Garurumon / Loupmoon",
        "type": "Normal",
        "rarity": "Common",
        "description": "Friendly wolves that patrol the city streets"
      }
    ],
    "resources": [
      {
        "name": "Hearthwood",
        "rarity": "Common",
        "description": "Wood that burns longer and warmer than normal"
      },
      {
        "name": "Comfort Berries",
        "rarity": "Common",
        "description": "Berries that provide warmth and satisfaction"
      },
      {
        "name": "Northern Crafts",
        "rarity": "Uncommon",
        "description": "Traditional handmade goods and tools"
      }
    ],
    "lore": "Heimdal City serves as the heart of Hearthfall Commons, where the northern ideals of community and warmth are embodied in every building and gathering. Named after an ancient guardian spirit who watches over the bridge between realms, the city serves as a gateway between the mortal and spiritual worlds.",
    "history": "Founded centuries ago by northern settlers seeking a new home, the city has grown while maintaining its commitment to community and comfort. The great hall at its center has hosted countless gatherings and celebrations.",
    "dangers": [
      "Mild winter weather",
      "Crowded festivals",
      "Tourist confusion",
      "Occasional wild animal visits"
    ],
    "tips": [
      "Participate in community events",
      "Visit the Great Hall for stories",
      "Bring warm clothing in winter",
      "Respect local customs",
      "Try the local mead"
    ],
    "description": "The region's capital, a bustling city with cozy wooden buildings and central hearths in every home, embodying the northern concept of comfort and togetherness.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 25,
      "height": 20
    }
  },

  'hidden-cove': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "pirates-bay",
    "regionName": "Pirates' Bay",
    "welcomeMessages": {
      "base": "Welcome to the Hidden Cove—cutlass smiles, fog-thick alleys, and maps that lie politely.",
      "variations": [
        "Reef teeth guard the inlet; only locals and lunatics thread the pass.",
        "Signal lamps wink in codes; if you wink back, you just hired yourself.",
        "Barnacle taverns serve rumors neat—no chaser, mind the splinters."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Water",
        "Steel",
        "Fighting"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 45,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Black Flag Token"
    },
    "specialEncounters": [
      {
        "type": "smugglers_tide",
        "chance": 0.22,
        "description": "Contraband run draws rare Dark/Water raiders to the docks."
      },
      {
        "type": "reef_ambush",
        "chance": 0.12,
        "description": "Hidden passage opens—Steel/Fighting sentry challenges interlopers."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/hidden-cove-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "0 ft - 100 ft",
    "temperature": "70°F to 80°F",
    "weatherPatterns": "Foggy mornings, hidden from outside weather by rock formations",
    "accessibility": "Nearly impossible to find without inside knowledge",
    "recommendedLevel": "70+",
    "specialFeatures": [
      "Secret Entrances",
      "Hidden Lair Complex",
      "Ruthless Pirates",
      "Treasure Vaults",
      "Natural Fortifications",
      "Underground Waterways"
    ],
    "wildlife": [
      {
        "name": "Cove Guardian",
        "species": "Gyarados / Jormuntide",
        "type": "Water/Dragon",
        "rarity": "Extreme",
        "description": "Ancient sea dragon that protects the cove's secrets and judges who may enter"
      },
      {
        "name": "Shadow Parrot",
        "species": "Murkrow / Cawgnito / Shadowbeak",
        "type": "Dark/Flying",
        "rarity": "Rare",
        "description": "Intelligent birds that serve as spies and messengers for the cove's inhabitants"
      },
      {
        "name": "Reef Stalker",
        "species": "Crobat / Lunaris",
        "type": "Poison/Flying",
        "rarity": "Uncommon",
        "description": "Nocturnal predators that hunt in the cove's dark caverns and hidden passages"
      }
    ],
    "resources": [
      {
        "name": "Ancient Treasure Hoard",
        "rarity": "Extreme",
        "description": "Legendary treasure accumulated over centuries by the most successful pirates"
      },
      {
        "name": "Pirate King's Artifacts",
        "rarity": "Extreme",
        "description": "Personal effects and weapons of legendary pirate captains"
      },
      {
        "name": "Secret Charts",
        "rarity": "Rare",
        "description": "Maps to the most guarded treasure locations across all oceans"
      }
    ],
    "lore": "Hidden Cove is whispered about in pirate legends as the ultimate sanctuary for those who have nowhere else to turn. Only the most notorious and powerful pirates know its location and can gain entry.",
    "history": "The cove has been used as a pirate hideout for over 500 years, with each generation of pirates adding to its defenses and treasure hoards. Many have tried to find it, but few return.",
    "dangers": [
      "Extremely hostile inhabitants",
      "Deadly entrance trials",
      "Cursed treasure guardians",
      "Unstable cavern systems",
      "Poisonous creatures",
      "Ancient pirate traps"
    ],
    "tips": [
      "Only attempt entry with pirate sponsorship",
      "Bring offerings for the Cove Guardian",
      "Never reveal the location to outsiders",
      "Prove your worth through pirate deeds",
      "Respect the ancient pirate traditions",
      "Prepare for life-or-death challenges"
    ],
    "description": "A secluded cove where the most ruthless pirates in the world make their lair. Protected by treacherous rocks and hidden passages, this cove serves as a secret base for the most dangerous crews.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'honor-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "kshatriya-arena",
    "regionName": "Kshatriya Arena",
    "welcomeMessages": {
      "base": "Welcome to the Honor Temple—oaths first, footwork second.",
      "variations": [
        "Censer smoke traces perfect circles—break one and start over.",
        "Shrine bells judge cadence; your stance will hear about it.",
        "Purification pools reflect the fighter you promised to be."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Psychic",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Oath Talisman"
    },
    "specialEncounters": [
      {
        "type": "vow_trial",
        "chance": 0.2,
        "description": "Recited vows empower Fighting/Psychic allies during duels."
      },
      {
        "type": "steel_rite",
        "chance": 0.1,
        "description": "A rite at the anvil summons a rare Steel mentor for a spar."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/honor-temple-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "1300 ft",
    "temperature": "60°F to 80°F",
    "weatherPatterns": "Sacred atmosphere, divine presence",
    "accessibility": "Honorable warriors and spiritual seekers",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Sacred Oaths",
      "Purification Rituals",
      "Honor Codes",
      "Warrior Blessings",
      "Divine Guidance"
    ],
    "wildlife": [
      {
        "name": "Sacred Tiger",
        "species": "Raikou / SaberLeomon / Blazehowl",
        "type": "Fighting/Psychic",
        "rarity": "Extreme",
        "description": "Divine tiger that judges the honor of warriors"
      },
      {
        "name": "Honor Guard",
        "species": "Lucario / Knightmon",
        "type": "Fighting/Steel",
        "rarity": "Rare",
        "description": "Spiritual guardians of the temple"
      },
      {
        "name": "Temple Peacock",
        "species": "Ho-Oh / Peckmon / Fenglope",
        "type": "Flying/Psychic",
        "rarity": "Uncommon",
        "description": "Beautiful birds that represent divine nobility"
      }
    ],
    "resources": [
      {
        "name": "Sacred Vows",
        "rarity": "Extreme",
        "description": "Oaths that bind warriors to honorable conduct"
      },
      {
        "name": "Blessing Oils",
        "rarity": "Rare",
        "description": "Sacred oils used in warrior purification"
      },
      {
        "name": "Honor Medallions",
        "rarity": "Uncommon",
        "description": "Symbols of commitment to honorable warfare"
      }
    ],
    "lore": "The Honor Temple stands as a reminder that warfare must be conducted with dignity and respect, and that true warriors are bound by sacred codes that transcend victory.",
    "history": "Built to sanctify the warrior's path, the temple has blessed countless fighters who sought to wage war with honor rather than mere brutality.",
    "dangers": [
      "Spiritual judgment of character",
      "Binding sacred oaths",
      "Divine trials of honor",
      "Overwhelming sense of duty",
      "Consequences of broken vows"
    ],
    "tips": [
      "Examine your motivations honestly",
      "Understand the weight of sacred oaths",
      "Seek spiritual guidance",
      "Prepare for character judgment",
      "Honor all commitments made"
    ],
    "description": "Sacred temple dedicated to the concept of honor in warfare, where warriors take sacred oaths and undergo purification rituals before battle.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 15,
      "height": 18
    }
  },

  'hygge-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hearthfall-commons",
    "regionName": "Hearthfall Commons",
    "welcomeMessages": {
      "base": "Welcome to Hygge Village, where cozy contentment and simple pleasures create the perfect atmosphere for peaceful adventures.",
      "variations": [
        "The village embodies the northern concept of hygge - cozy cafes and knitting circles await your exploration.",
        "Fireplace gatherings and comfort food make this village a haven of warmth and friendship.",
        "Simple pleasures and cozy contentment define this charming village in Hearthfall Commons."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Normal",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "D",
        "E"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 1,
      "max": 20
    },
    "agroRange": {
      "min": 5,
      "max": 30
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "cozy_cafe_meeting",
        "chance": 0.2,
        "description": "A friendly gathering at a cozy cafe leads to new friendships and monster encounters!"
      },
      {
        "type": "knitting_circle_wisdom",
        "chance": 0.15,
        "description": "The village knitting circle shares ancient wisdom about monster care!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/hygge-village-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "400 ft",
    "temperature": "40°F to 60°F",
    "weatherPatterns": "Mild, cozy atmosphere with gentle snowfall",
    "accessibility": "Family-friendly, all ages welcome",
    "recommendedLevel": "5+",
    "specialFeatures": [
      "Cozy Cafes",
      "Knitting Circles",
      "Fireplace Gatherings",
      "Comfort Food",
      "Reading Nooks"
    ],
    "wildlife": [
      {
        "name": "Hygge Mouse",
        "species": "Rattata / Patamon / Chillet",
        "type": "Normal",
        "rarity": "Common",
        "description": "Small, cozy creatures that love warm spaces"
      },
      {
        "name": "Comfort Cat",
        "species": "Delcatty / Gatomon / Cattiva",
        "type": "Normal/Fairy",
        "rarity": "Common",
        "description": "Cats that purr with magical warmth"
      },
      {
        "name": "Sleepy Bear",
        "species": "Snorlax / Bearmon / Kingpaca",
        "type": "Normal",
        "rarity": "Uncommon",
        "description": "Gentle bears that love afternoon naps"
      }
    ],
    "resources": [
      {
        "name": "Warm Wool",
        "rarity": "Common",
        "description": "Exceptionally soft and warm wool"
      },
      {
        "name": "Cozy Tea",
        "rarity": "Common",
        "description": "Herbal tea that warms the soul"
      },
      {
        "name": "Comfort Blankets",
        "rarity": "Uncommon",
        "description": "Magically warm blankets that never lose their heat"
      }
    ],
    "lore": "Hygge Village represents the purest expression of northern contentment and simple joy. The village motto is \"small joys, great happiness\" and every resident embodies this philosophy in their daily life.",
    "history": "A traditional village that has preserved ancient ways of finding happiness in simple things. Founded by families seeking a slower, more meaningful way of life.",
    "dangers": [
      "None - perfectly safe and welcoming"
    ],
    "tips": [
      "Relax and enjoy the atmosphere",
      "Try local comfort foods",
      "Join a knitting circle",
      "Spend time by the fireplaces",
      "Embrace the slow pace of life"
    ],
    "description": "A quaint village embodying the northern concept of cozy contentment and simple pleasures, where every home has a crackling fireplace and time moves at a peaceful pace.",
    "mapCoordinates": {
      "x": 15,
      "y": 25,
      "width": 15,
      "height": 12
    }
  },

  'imperial-palace': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "long-valley",
    "regionName": "Long Valley",
    "welcomeMessages": {
      "base": "You ascend terrace steps toward the Imperial Dragon Palace crowned in gilded scales.",
      "variations": [
        "Pearl lanterns pulse with measured ancestral cadence.",
        "Celestial banners ripple without wind.",
        "Elder drakes observe in reflective meditation."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 60,
      "max": 100
    },
    "agroRange": {
      "min": 55,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Imperial Audience Seal"
    },
    "specialEncounters": [
      {
        "type": "imperial_audience",
        "chance": 0.22,
        "description": "Audience court tests worth—success boosts encounter rarity."
      },
      {
        "type": "pearl_resonance",
        "chance": 0.12,
        "description": "Resonant pearl amplifies Psychic/Dragon synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/imperial-palace-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Terraced high seat",
    "temperature": "58°F to 74°F",
    "weatherPatterns": "Pearl lantern glow, calm incense drafts",
    "accessibility": "Audience seal procession",
    "recommendedLevel": "70-100",
    "specialFeatures": [
      "Ancestral Pearl Court",
      "Dragon Scale Terraces",
      "Celestial Reflection Pools"
    ],
    "wildlife": [
      {
        "name": "Court Attendant",
        "species": "Dratini / Patamon / Univolt",
        "type": "Dragon/Fairy",
        "rarity": "Common",
        "description": "Assists with ceremonial arrangements."
      },
      {
        "name": "Pearl Envoy",
        "species": "Dragonair / Seadramon / Lovander",
        "type": "Dragon/Water",
        "rarity": "Uncommon",
        "description": "Maintains reflective pool clarity."
      },
      {
        "name": "Imperial Regent",
        "species": "Hydreigon / Wisemon / Jetragon",
        "type": "Dragon/Psychic",
        "rarity": "Rare",
        "description": "Adjudicates petitions with piercing insight."
      }
    ],
    "resources": [
      {
        "name": "Imperial Pearl Fragment",
        "rarity": "Rare",
        "description": "Lustrous shard amplifying focus."
      },
      {
        "name": "Scale Inlay Chip",
        "rarity": "Uncommon",
        "description": "Decorative protective layering."
      },
      {
        "name": "Incense Resin",
        "rarity": "Common",
        "description": "Fragrant compound calming volatile auras."
      }
    ],
    "lore": "Seat of draconic jurisprudence and ancestral stewardship.",
    "history": "Rebuilt after solar alignment cracked earlier terraces.",
    "dangers": [
      "Protocol breach penalties",
      "Reflective glare fatigue"
    ],
    "tips": [
      "Observe silence rings",
      "Present seal promptly",
      "Limit gaze at zenith mirror"
    ],
    "description": "Golden terrace palace where elder drakes decree realm edicts.",
    "mapCoordinates": {
      "x": 45,
      "y": 15,
      "width": 25,
      "height": 22
    }
  },

  'iron-teeth-hut': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "crowsfoot-marsh",
    "regionName": "Crowsfoot Marsh",
    "welcomeMessages": {
      "base": "Welcome to Iron Teeth’s Hut—bone fences, laughing wards, and traps that compliment your boots.",
      "variations": [
        "The path moves when it’s in the mood—bring bribery (cookies).",
        "Jar lights stare back; some are fireflies, some are… not.",
        "If the door knocks first, you’re late."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Ghost",
        "Poison"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 45,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Bone Charm"
    },
    "specialEncounters": [
      {
        "type": "hex_kiln",
        "chance": 0.22,
        "description": "Cackling kiln empowers Dark/Poison elites with curse boons."
      },
      {
        "type": "witchs_bargain",
        "chance": 0.1,
        "description": "A spectral host offers a rite—rare Ghost/Dark familiar appears."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/iron-teeth-hut-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "40 ft",
    "temperature": "60°F to 75°F",
    "weatherPatterns": "Unnatural cold spots, magical disturbances, eerie atmosphere",
    "accessibility": "Extreme danger - witch's private domain",
    "recommendedLevel": "85+",
    "specialFeatures": [
      "Extreme Witch's Lair",
      "Bone Architecture",
      "Dark Magic Experiments",
      "Magical Traps",
      "Forbidden Rituals"
    ],
    "wildlife": [
      {
        "name": "Iron Teeth Witch",
        "species": "Hatterene / Wizardmon / Katress",
        "type": "Dark/Steel",
        "rarity": "Extreme",
        "description": "The terrifying witch with iron teeth and immense power"
      },
      {
        "name": "Bone Golem",
        "species": "Dusknoir / SkullGreymon",
        "type": "Ground/Ghost",
        "rarity": "Rare",
        "description": "Animated skeletons that guard the hut"
      },
      {
        "name": "Cursed Crow",
        "species": "Honchkrow / Ravemon / Cawgnito",
        "type": "Dark/Flying",
        "rarity": "Uncommon",
        "description": "Ravens transformed by dark magic"
      }
    ],
    "resources": [
      {
        "name": "Iron Teeth's Grimoire",
        "rarity": "Extreme",
        "description": "The witch's personal spell book of ultimate power"
      },
      {
        "name": "Cursed Bones",
        "rarity": "Rare",
        "description": "Bones infused with dark magical energy"
      },
      {
        "name": "Dark Potions",
        "rarity": "Rare",
        "description": "Extremely dangerous magical brews"
      }
    ],
    "lore": "Iron Teeth Hut is the domain of the marsh's most feared witch, whose iron teeth can bite through steel and whose magic can curse entire bloodlines.",
    "history": "The hut has stood for centuries as the home of the witch Iron Teeth, who practices the darkest magic and strikes fear into all who know her name.",
    "dangers": [
      "Direct confrontation with Extreme witch",
      "Deadly magical traps",
      "Powerful curses",
      "Bone fence guardians",
      "Dark magic corruption"
    ],
    "tips": [
      "Avoid at all costs unless absolutely necessary",
      "Bring powerful magical protection",
      "Study anti-curse magic",
      "Consider diplomatic approach",
      "Have escape plan ready"
    ],
    "description": "Isolated hut of the Extreme witch Iron Teeth, surrounded by bone fences and magical traps, where the most powerful and dangerous marsh magic is practiced.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 12,
      "height": 15
    }
  },

  'jade-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "long-valley",
    "regionName": "Long Valley",
    "welcomeMessages": {
      "base": "You enter Jade Village where artisans polish scale fragments into luminous charms.",
      "variations": [
        "Water channels tumble through carving courts.",
        "Polishers hold gemstones against sunrise for hue calibration.",
        "Young drakes trade scales for crafted ward pendants."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 25,
      "max": 65
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "jade_reflection",
        "chance": 0.17,
        "description": "Reflected light refines Fairy/Dragon fusion outcome."
      },
      {
        "type": "artisan_exchange",
        "chance": 0.1,
        "description": "Trade materials to influence next encounter type."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/jade-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Valley terrace",
    "temperature": "60°F to 78°F",
    "weatherPatterns": "Soft kiln vapors, jade dust motes",
    "accessibility": "Terrace path network",
    "recommendedLevel": "30-60",
    "specialFeatures": [
      "Jade Carving Courts",
      "Scale Polishing Fountains",
      "Charm Foundries"
    ],
    "wildlife": [
      {
        "name": "Scale Pledger",
        "species": "Swablu / Shakomon / Lunaris",
        "type": "Dragon/Fairy",
        "rarity": "Common",
        "description": "Deposits old scales near polishing basins."
      },
      {
        "name": "Charm Sprout",
        "species": "Bellsprout / Floramon / Gumoss",
        "type": "Grass/Fairy",
        "rarity": "Uncommon",
        "description": "Grows near jade slurry absorbing trace minerals."
      },
      {
        "name": "Jade Curator",
        "species": "Altaria / Wisemon / Paladius",
        "type": "Dragon/Psychic",
        "rarity": "Rare",
        "description": "Evaluates resonance of finished charms."
      }
    ],
    "resources": [
      {
        "name": "Polished Scale Chip",
        "rarity": "Common",
        "description": "Refined fragment for basic adornments."
      },
      {
        "name": "Jade Slurry Sample",
        "rarity": "Uncommon",
        "description": "Mineral-rich paste for carving lubrication."
      },
      {
        "name": "Resonant Charm Core",
        "rarity": "Rare",
        "description": "Amplifies protective enchantments."
      }
    ],
    "lore": "Village techniques preserve generational carving lineage.",
    "history": "Expanded after new canal terrace opened.",
    "dangers": [
      "Jade dust inhalation",
      "Wet stone slips"
    ],
    "tips": [
      "Use filtration veil",
      "Keep footing dry",
      "Store charms in padded cases"
    ],
    "description": "Artisan enclave shaping scale jade into luminous charms.",
    "mapCoordinates": {
      "x": 15,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'jotun-halls': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to the Jötun Halls—council fires the size of houses and doors that grade your courage.",
      "variations": [
        "Ice columns boom like old drums—speak up or be snowed under.",
        "Feast benches groan; oaths weigh more than axes here.",
        "Auroras convene above the roofbeam—minutes are kept in thunder."
      ]
    },
    "battleParameters": {
      "weather": "snow",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Fighting",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Giant Parley Token"
    },
    "specialEncounters": [
      {
        "type": "council_summons",
        "chance": 0.22,
        "description": "War horns call elite Ice/Fighting challengers to the circle."
      },
      {
        "type": "oath_carving",
        "chance": 0.1,
        "description": "Runes blaze—rare Steel/Ice warden offers a pact duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/jotun-halls-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "2200 ft",
    "temperature": "-35°F to 5°F",
    "weatherPatterns": "Giant magic storms, otherworldly cold",
    "accessibility": "Forbidden to mortals - extreme divine/giant politics",
    "recommendedLevel": "95+",
    "specialFeatures": [
      "Giant Council Chambers",
      "Ancient Giant History",
      "Divine Conflict Planning",
      "Massive Feasting Halls",
      "Giant Magic Rituals"
    ],
    "wildlife": [
      {
        "name": "Elder Frost Giant",
        "species": "Regigigas / Machinedramon",
        "type": "Ice/Psychic",
        "rarity": "Extreme",
        "description": "Ancient giants with immense magical power"
      },
      {
        "name": "Giant Spirit",
        "species": "Dusknoir / Phantomon / Necromus",
        "type": "Ice/Ghost",
        "rarity": "Extreme",
        "description": "Spirits of giants who died in divine wars"
      },
      {
        "name": "Jötun Familiar",
        "species": "Sneasel / Devimon / Shadowbeak",
        "type": "Ice/Dark",
        "rarity": "Rare",
        "description": "Magical creatures that serve the giant lords"
      }
    ],
    "resources": [
      {
        "name": "Giant Wisdom",
        "rarity": "Extreme",
        "description": "Ancient knowledge from the time before gods"
      },
      {
        "name": "Ragnarök Prophecies",
        "rarity": "Extreme",
        "description": "Prophecies about the end of the world"
      },
      {
        "name": "Giant Runes",
        "rarity": "Rare",
        "description": "Magical runes of immense power"
      }
    ],
    "lore": "The Jötun Halls are where the frost giants plan for Ragnarök, the end of the world where they will finally overcome the gods and reclaim their dominion.",
    "history": "These halls have stood since the beginning of time, witnessing countless councils and the slow preparation for the final battle between giants and gods.",
    "dangers": [
      "Immediate death for unauthorized entry",
      "Giant magic beyond mortal comprehension",
      "Divine retribution",
      "Ancient curses and wards",
      "Exposure to cosmic conflicts"
    ],
    "tips": [
      "Do not attempt to enter under any circumstances",
      "Avoid the area entirely",
      "Seek divine protection if nearby",
      "Study giant lore from safe distance",
      "Respect the cosmic balance"
    ],
    "description": "Ancient meeting halls of the frost giants where they gather for councils, feasts, and to plan their eternal conflict with the gods of Asgard.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 25,
      "height": 20
    }
  },

  'kumasi-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "anansi-woods",
    "regionName": "Anansi Woods",
    "welcomeMessages": {
      "base": "Suspended web avenues welcome you to Kumasi City—market of woven stories.",
      "variations": [
        "Silk brokers negotiate narrative thread lots.",
        "Pattern looms hum encoding fresh folklore.",
        "Glitter spores drift marking seasonal tale cycles."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Normal",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 18,
      "max": 55
    },
    "agroRange": {
      "min": 15,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "market_story_weave",
        "chance": 0.19,
        "description": "Collaborative weaving enhances Bug encounter quality."
      },
      {
        "type": "silk_pattern_glow",
        "chance": 0.09,
        "description": "Glowing pattern lures hybrid storyteller creature."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/kumasi-city-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Canopy web tier",
    "temperature": "70°F to 85°F",
    "weatherPatterns": "Filtered humidity, silk drift",
    "accessibility": "Web bridge network",
    "recommendedLevel": "25-55",
    "specialFeatures": [
      "Story Loom Markets",
      "Web Archive Galleries",
      "Thread Brokerage"
    ],
    "wildlife": [
      {
        "name": "Thread Courier",
        "species": "Grubbin / Tentomon / Jolthog",
        "type": "Bug/Electric",
        "rarity": "Common",
        "description": "Delivers encoded silk spools."
      },
      {
        "name": "Pattern Broker",
        "species": "Kricketune / Waspmon / Cinnamoth",
        "type": "Bug/Flying",
        "rarity": "Uncommon",
        "description": "Negotiates motif rights."
      },
      {
        "name": "Archive Keeper",
        "species": "Ariados / Andromon / Sweepa",
        "type": "Bug/Steel",
        "rarity": "Rare",
        "description": "Maintains indexing lattice."
      }
    ],
    "resources": [
      {
        "name": "Encoded Silk Spool",
        "rarity": "Common",
        "description": "Thread containing compressed tale motifs."
      },
      {
        "name": "Pattern Catalyst Resin",
        "rarity": "Uncommon",
        "description": "Enhances stability of new design weaves."
      },
      {
        "name": "Archivist Core Filament",
        "rarity": "Rare",
        "description": "Precision strand for high fidelity patterns."
      }
    ],
    "lore": "Market fluctuations follow seasonal storytelling cycles.",
    "history": "Built where converging canopy tension lines offered natural support.",
    "dangers": [
      "Thread bridge sway",
      "Negotiation disputes"
    ],
    "tips": [
      "Secure trade tokens",
      "Check tension knots",
      "Respect archive silence zones"
    ],
    "description": "Suspended web metropolis trading woven narratives and pattern lore.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 28,
      "height": 22
    }
  },

  'kurukshetra-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "kshatriya-arena",
    "regionName": "Kshatriya Arena",
    "welcomeMessages": {
      "base": "Welcome to Kurukshetra City—oathstones underfoot and history watching from every banner.",
      "variations": [
        "Training sands whisper verses of duty; your stance is its own scripture.",
        "Trial bells mark the hours—courage keeps better time than clocks.",
        "Acolytes swap sparring for philosophy; expect bruises with footnotes."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Psychic",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Battlefield Writ"
    },
    "specialEncounters": [
      {
        "type": "dharma_duel",
        "chance": 0.22,
        "description": "Sanctioned duel empowers Fighting/Psychic allies with vow boons."
      },
      {
        "type": "chariot_trial",
        "chance": 0.1,
        "description": "A steel-clad mentor arrives—rare Steel/Fighting challenge issued."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/kurukshetra-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "1200 ft",
    "temperature": "70°F to 95°F",
    "weatherPatterns": "Hot, dry climate with occasional monsoons",
    "accessibility": "Warriors and students of dharma welcome",
    "recommendedLevel": "70+",
    "specialFeatures": [
      "Sacred Battlefield",
      "Warrior Schools",
      "Dharma Studies",
      "Combat Training",
      "Historical Monuments"
    ],
    "wildlife": [
      {
        "name": "War Elephant",
        "species": "Donphan / Mammothmon / Dumud",
        "type": "Fighting/Ground",
        "rarity": "Rare",
        "description": "Majestic elephants trained for noble combat"
      },
      {
        "name": "Dharma Eagle",
        "species": "Braviary / Garudamon",
        "type": "Flying/Fighting",
        "rarity": "Uncommon",
        "description": "Eagles that embody righteous warrior spirit"
      },
      {
        "name": "Battle Horse",
        "species": "Rapidash / Centarumon / Univolt",
        "type": "Normal/Fighting",
        "rarity": "Common",
        "description": "Noble steeds bred for honorable warfare"
      }
    ],
    "resources": [
      {
        "name": "Sacred Weapons",
        "rarity": "Extreme",
        "description": "Weapons blessed by the heroes of legend"
      },
      {
        "name": "Warrior Codes",
        "rarity": "Rare",
        "description": "Ancient texts on honorable combat"
      },
      {
        "name": "Battle Standards",
        "rarity": "Uncommon",
        "description": "Banners that inspire courage in battle"
      }
    ],
    "lore": "Kurukshetra City stands on the most sacred battlefield in Hindu tradition, where the Pandavas and Kauravas fought the great war that determined the fate of dharma in the world.",
    "history": "Built to commemorate the epic battle described in the Mahabharata, the city serves as a center for understanding righteous warfare and the warrior's path to spiritual enlightenment.",
    "dangers": [
      "Intense warrior training",
      "Spiritual trials of dharma",
      "Combat challenges",
      "Historical weight of the battlefield",
      "Demanding physical requirements"
    ],
    "tips": [
      "Study the Mahabharata before visiting",
      "Understand concepts of dharma and righteous war",
      "Train in combat skills",
      "Respect the sacred nature of the battlefield",
      "Seek guidance from warrior-philosophers"
    ],
    "description": "Sacred city built on the Extreme battlefield where the great war of the Mahabharata was fought, now a center for warrior training and understanding dharma through combat.",
    "mapCoordinates": {
      "x": 35,
      "y": 45,
      "width": 25,
      "height": 20
    }
  },

  'lightning-city': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "tempest-zones",
    "regionName": "Tempest Zones",
    "welcomeMessages": {
      "base": "Welcome to Lightning City—streets wired to the sky and rooftops that purr with thunder.",
      "variations": [
        "Conductor spires sip storms; crosswalks flash in forked brilliance.",
        "Capacitors hum lullabies—bring rubber soles and bold ideas.",
        "Transit runs on lightning; delays are measured in micro-scorches."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Stormgrid Pass"
    },
    "specialEncounters": [
      {
        "type": "grid_overcharge",
        "chance": 0.22,
        "description": "Citywide surge spawns Electric/Steel elites with speed buffs."
      },
      {
        "type": "aerial_patrol",
        "chance": 0.1,
        "description": "A storm warden—rare Electric/Flying—sweeps in for a test."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/lightning-city-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "14,000 ft",
    "temperature": "10°F to 30°F",
    "weatherPatterns": "Constant lightning storms, electrical phenomena",
    "accessibility": "Extreme electrical hazard",
    "recommendedLevel": "85+",
    "specialFeatures": [
      "Storm Integration",
      "Lightning Power",
      "Electric Architecture",
      "Thunder Resonance",
      "Storm Navigation"
    ],
    "wildlife": [
      {
        "name": "Storm Lord",
        "species": "Rayquaza / Imperialdramon / Orserk",
        "type": "Electric/Dragon",
        "rarity": "Extreme",
        "description": "Ancient dragons that have mastered storm control"
      },
      {
        "name": "Lightning Rider",
        "species": "Manectric / Elecmon / Univolt",
        "type": "Electric/Flying",
        "rarity": "Rare",
        "description": "Sky dwellers who surf lightning bolts"
      },
      {
        "name": "Thunder Sprite",
        "species": "Plusle / Pikachu / Elecmon",
        "type": "Electric/Fairy",
        "rarity": "Common",
        "description": "Small creatures that feed on electrical energy"
      }
    ],
    "resources": [
      {
        "name": "Pure Lightning",
        "rarity": "Extreme",
        "description": "Concentrated electrical energy in solid form"
      },
      {
        "name": "Storm Cores",
        "rarity": "Rare",
        "description": "Crystallized centers of lightning bolts"
      },
      {
        "name": "Electric Copper",
        "rarity": "Uncommon",
        "description": "Metal constantly charged with electricity"
      }
    ],
    "lore": "Lightning City exists in perfect harmony with the eternal storm, its inhabitants having learned to harness and live within the tempest rather than fight against it. The city's architecture conducts and channels electricity as both power source and protection.",
    "history": "Built by storm riders who discovered how to navigate the perpetual tempest, the city has grown over centuries into a marvel of electrical engineering and storm mastery.",
    "dangers": [
      "Constant lightning strikes",
      "Electrical overload",
      "Storm navigation hazards",
      "High-voltage equipment",
      "Electromagnetic interference"
    ],
    "tips": [
      "Wear full electrical protection",
      "Learn storm riding techniques",
      "Carry lightning rods",
      "Study electrical safety",
      "Travel with storm riders"
    ],
    "description": "Electrified city built within the storm itself, powered entirely by captured lightning strikes and constant electrical phenomena.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 22
    }
  },

  'lightning-spire': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to the Lightning Spire—stone that drinks thunder and smiles about it.",
      "variations": [
        "Storm ladders climb the air; your hair volunteers for leadership.",
        "Metal veins in the rock glow like captive dawns.",
        "If the sky points at you, bow or run—dealer’s choice."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Rock",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Grounding Talisman"
    },
    "specialEncounters": [
      {
        "type": "spire_strike",
        "chance": 0.22,
        "description": "Direct hits call elite Electric/Flying defenders to the pinnacle."
      },
      {
        "type": "resonant_quartz",
        "chance": 0.1,
        "description": "Charged seams awaken a rare Rock/Steel sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/lightning-spire-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "8500 ft",
    "temperature": "15°F to 45°F",
    "weatherPatterns": "Constant electrical activity, lightning attraction, aurora effects",
    "accessibility": "Extreme electrical hazard, research permits required",
    "recommendedLevel": "75+",
    "specialFeatures": [
      "Natural Lightning Rod",
      "Electrical Channeling",
      "Aurora Effects",
      "Storm Attraction",
      "Research Station"
    ],
    "wildlife": [
      {
        "name": "Spire Dragon",
        "species": "Rayquaza / Imperialdramon / Raiju",
        "type": "Electric/Dragon",
        "rarity": "Extreme",
        "description": "Ancient dragon that feeds on lightning energy"
      },
      {
        "name": "Aurora Beast",
        "species": "Alakazam / Wisemon / Raiju",
        "type": "Electric/Psychic",
        "rarity": "Rare",
        "description": "Creatures that manifest during electrical displays"
      },
      {
        "name": "Voltage Falcon",
        "species": "Talonflame / Piddomon / Tengu",
        "type": "Electric/Flying",
        "rarity": "Uncommon",
        "description": "Birds that nest in the electrical field"
      }
    ],
    "resources": [
      {
        "name": "Pure Lightning Energy",
        "rarity": "Extreme",
        "description": "Concentrated electrical power in crystalline form"
      },
      {
        "name": "Aurora Crystals",
        "rarity": "Rare",
        "description": "Crystals that emit beautiful colored light"
      },
      {
        "name": "Lightning Glass",
        "rarity": "Uncommon",
        "description": "Glass formed by lightning striking sand"
      }
    ],
    "lore": "Lightning Spire is believed to be the Thunderbird's perch, where the great spirit comes to rest and survey its storm domain. The spire channels divine electrical power.",
    "history": "The spire has attracted lightning for millennia, slowly transforming into a natural conductor that bridges earth and sky with pure electrical energy.",
    "dangers": [
      "Constant lightning strikes",
      "Overwhelming electrical fields",
      "Aurora-induced disorientation",
      "Equipment failure",
      "Electrical burns and shock"
    ],
    "tips": [
      "Use only non-conductive equipment",
      "Wear full electrical insulation",
      "Monitor electrical activity constantly",
      "Have emergency medical support",
      "Study electrical safety protocols"
    ],
    "description": "Towering natural rock spire that acts as a massive lightning rod, constantly channeling electrical energy and creating spectacular light shows during storms.",
    "mapCoordinates": {
      "x": 25,
      "y": 60,
      "width": 12,
      "height": 20
    }
  },

  'maelstrom-point': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to Maelstrom Point—whirlpool classrooms for very confident sailors.",
      "variations": [
        "Gulls ride the rim like critics; waves grade on a spiral.",
        "Signal buoys blink warnings in ancient maritime sarcasm.",
        "If your map curls, it’s agreeing with the current."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Electric",
        "Dark"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 14,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Navigator’s Seal"
    },
    "specialEncounters": [
      {
        "type": "whirlpool_ascend",
        "chance": 0.22,
        "description": "Rising eye attracts rare Water/Electric predators with surge boons."
      },
      {
        "type": "black_current",
        "chance": 0.1,
        "description": "A shadow eddy delivers a Dark/Water raider to the cape."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/maelstrom-point-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "200 ft",
    "temperature": "55°F to 70°F",
    "weatherPatterns": "Constant whirlpools, dangerous currents, storm generation",
    "accessibility": "Expert navigators only, extreme maritime danger",
    "recommendedLevel": "80+",
    "specialFeatures": [
      "Massive Whirlpools",
      "Navigation Trials",
      "Storm Generation",
      "Current Mastery",
      "Lighthouse Beacon"
    ],
    "wildlife": [
      {
        "name": "Maelstrom Kraken",
        "species": "Tentacruel / Cthulhumon / Yamata-no-Orochi",
        "type": "Water/Dark",
        "rarity": "Extreme",
        "description": "Colossal sea beast that creates the whirlpools"
      },
      {
        "name": "Current Rider",
        "species": "Mantine / Airdramon / Tengu",
        "type": "Water/Flying",
        "rarity": "Rare",
        "description": "Creatures that surf the dangerous currents"
      },
      {
        "name": "Storm Gull",
        "species": "Zapdos / Piddomon / Raiju",
        "type": "Flying/Electric",
        "rarity": "Uncommon",
        "description": "Seabirds that thrive in chaotic weather"
      }
    ],
    "resources": [
      {
        "name": "Whirlpool Essence",
        "rarity": "Extreme",
        "description": "Concentrated power of the eternal maelstrom"
      },
      {
        "name": "Current Maps",
        "rarity": "Rare",
        "description": "Navigation charts of the treacherous waters"
      },
      {
        "name": "Storm Glass",
        "rarity": "Uncommon",
        "description": "Crystal that predicts weather changes"
      }
    ],
    "lore": "Maelstrom Point is where Poseidon tests the courage and skill of mariners. Legend says the god himself created the eternal whirlpools to separate the worthy from the foolish.",
    "history": "The point has claimed countless ships throughout history, but also forged the greatest navigators. Those who master its waters are forever changed.",
    "dangers": [
      "Massive deadly whirlpools",
      "Unpredictable currents",
      "Sudden storms",
      "Ship-destroying waves",
      "Complete navigation failure"
    ],
    "tips": [
      "Master advanced navigation first",
      "Study current patterns extensively",
      "Bring emergency flotation",
      "Never attempt alone",
      "Consider hiring Extreme navigators"
    ],
    "description": "Treacherous cape where massive whirlpools form constantly, creating a natural barrier and testing ground where only the most skilled navigators dare to venture.",
    "mapCoordinates": {
      "x": 70,
      "y": 60,
      "width": 20,
      "height": 25
    }
  },

  'memory-cliffs': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "stoneheart-cliffs",
    "regionName": "Stoneheart Cliffs",
    "welcomeMessages": {
      "base": "Wind keens across the Memory Cliffs where runes chronicle unbroken island epochs.",
      "variations": [
        "Sunset light reveals otherwise hidden strata inscriptions.",
        "Resonant chisel echoes replay historic turning points.",
        "Moss retracts temporarily exposing archival glyph seams."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Psychic"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 50,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Runic Access Key"
    },
    "specialEncounters": [
      {
        "type": "chronicle_alignment",
        "chance": 0.2,
        "description": "Aligned glyphs boost Rock/Psychic rarity."
      },
      {
        "type": "echo_reverberation",
        "chance": 0.1,
        "description": "Historic echo forms a guardian sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/memory-cliffs-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Cliff shelf sequence",
    "temperature": "42°F to 60°F",
    "weatherPatterns": "Rune glow mist, updraft gusts",
    "accessibility": "Harness climb routes",
    "recommendedLevel": "65-95",
    "specialFeatures": [
      "Chronicle Strata Panels",
      "Resonant Chisel Stations",
      "Glyph Echo Cavities"
    ],
    "wildlife": [
      {
        "name": "Glyph Skitter",
        "species": "Anorith / Kokuwamon / Dumud",
        "type": "Rock/Bug",
        "rarity": "Common",
        "description": "Feeds on mineral trace behind carved lines."
      },
      {
        "name": "Strata Watcher",
        "species": "Onix / Guardromon / Mossanda",
        "type": "Rock/Steel",
        "rarity": "Uncommon",
        "description": "Stabilizes loose inscription shelves."
      },
      {
        "name": "Runic Oracle",
        "species": "Claydol / Wisemon / Katress",
        "type": "Rock/Psychic",
        "rarity": "Rare",
        "description": "Predicts chisel resonance outcomes."
      }
    ],
    "resources": [
      {
        "name": "Chronicle Dust",
        "rarity": "Common",
        "description": "Fine particulate dislodged from superficial runes."
      },
      {
        "name": "Inscription Core Shard",
        "rarity": "Uncommon",
        "description": "Dense fragment holding persistent glyph energy."
      },
      {
        "name": "Echo Lens Crystal",
        "rarity": "Rare",
        "description": "Focuses resonance to reveal hidden layers."
      }
    ],
    "lore": "Every equinox new layers softly ignite revealing additions.",
    "history": "Catalogued systematically by generational rune stewards.",
    "dangers": [
      "Loose shelf crumble",
      "Echo vertigo"
    ],
    "tips": [
      "Test anchor bolts",
      "Limit exposure to strong echoes",
      "Label samples precisely"
    ],
    "description": "Runic escarpments storing epochs of island history in glowing strata.",
    "mapCoordinates": {
      "x": 20,
      "y": 75,
      "width": 30,
      "height": 20
    }
  },

  'mictlampa-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "mictlan-hollows",
    "regionName": "Mictlan Hollows",
    "welcomeMessages": {
      "base": "You emerge into Mictlampa City where spirit markets glow beneath ossuary arches.",
      "variations": [
        "Incense braziers line bone colonnades.",
        "Guides barter memory tokens at flickering altars.",
        "Soul lantern canals reflect drifting ancestor silhouettes."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ghost",
        "Dark"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 25,
      "max": 75
    },
    "agroRange": {
      "min": 25,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "ancestral_market",
        "chance": 0.18,
        "description": "Market chant improves Ghost hybrid odds."
      },
      {
        "type": "lantern_alignment",
        "chance": 0.1,
        "description": "Aligned lanterns summon a rare Dark/Ghost fusion."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/mictlampa-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Subterranean plazas",
    "temperature": "48°F to 60°F",
    "weatherPatterns": "Lantern glow haze, incense drift",
    "accessibility": "Bone stair descent",
    "recommendedLevel": "35-70",
    "specialFeatures": [
      "Lantern Canals",
      "Memory Token Markets",
      "Ancestral Altars"
    ],
    "wildlife": [
      {
        "name": "Lantern Wisp",
        "species": "Litwick / Candlemon / Foxparks",
        "type": "Ghost/Fire",
        "rarity": "Common",
        "description": "Drifts lighting trade routes."
      },
      {
        "name": "Token Broker",
        "species": "Sableye / Dracmon / Vixy",
        "type": "Dark/Ghost",
        "rarity": "Uncommon",
        "description": "Trades memories for relic fragments."
      },
      {
        "name": "Ancestral Phalanx",
        "species": "Dusclops / Bakemon / Necromus",
        "type": "Ghost/Dark",
        "rarity": "Rare",
        "description": "Patrol unit maintaining ritual order."
      }
    ],
    "resources": [
      {
        "name": "Memory Token",
        "rarity": "Common",
        "description": "Encodes a minor ancestral recollection."
      },
      {
        "name": "Lantern Resin",
        "rarity": "Uncommon",
        "description": "Burns with steady pale light in rituals."
      },
      {
        "name": "Ossuary Relic Shard",
        "rarity": "Rare",
        "description": "Fragment from honored crypt guardian."
      }
    ],
    "lore": "Founded to harmonize living pilgrims and ancestral guidance.",
    "history": "Expanded with tiered canal system to manage spirit flow.",
    "dangers": [
      "Crowded procession crush",
      "Incense overexposure"
    ],
    "tips": [
      "Keep to marked flow lanes",
      "Carry vented mask",
      "Respect altar silence zones"
    ],
    "description": "Spirit-bazaar metropolis beneath ossuary arches and lantern canals.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 22
    }
  },

  'mist-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "mist-marshlands",
    "regionName": "Mist Marshlands",
    "welcomeMessages": {
      "base": "You approach Mist Village where stilt homes fade in and out of spectral haze.",
      "variations": [
        "Reed flutes echo across glassy pools.",
        "Tidal vapors braid around suspended walkways.",
        "Children chase luminous frog sprites between piers."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Ghost",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 55
    },
    "agroRange": {
      "min": 15,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "fog_drift_glow",
        "chance": 0.17,
        "description": "Biolight surge raises Water/Grass rarity."
      },
      {
        "type": "pier_bell_resonance",
        "chance": 0.09,
        "description": "Bell tone calls a Ghost guardian."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/mist-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Stilt platform level",
    "temperature": "55°F to 68°F",
    "weatherPatterns": "Rolling fog pulses, dew veil",
    "accessibility": "Boardwalk approaches",
    "recommendedLevel": "20-55",
    "specialFeatures": [
      "Fog Pulse Piers",
      "Reed Flute Platforms",
      "Biolight Pool Nets"
    ],
    "wildlife": [
      {
        "name": "Reed Hopper",
        "species": "Lotad / Syakomon / Teafant",
        "type": "Water/Grass",
        "rarity": "Common",
        "description": "Skims between lily nets filtering plankton."
      },
      {
        "name": "Mist Sprite",
        "species": "Phantump / Candlemon / Lumira",
        "type": "Ghost/Grass",
        "rarity": "Uncommon",
        "description": "Condenses around flute melodies."
      },
      {
        "name": "Pool Guardian",
        "species": "Quagsire / Shakomon / Celeray",
        "type": "Water/Ghost",
        "rarity": "Rare",
        "description": "Surfaces during dense fog peaks."
      }
    ],
    "resources": [
      {
        "name": "Reed Fiber Bundle",
        "rarity": "Common",
        "description": "Flexible marsh weaving material."
      },
      {
        "name": "Biolight Algae",
        "rarity": "Uncommon",
        "description": "Glows softly when hydrated."
      },
      {
        "name": "Condensed Mist Core",
        "rarity": "Rare",
        "description": "Stabilized vapor nucleus used in catalysts."
      }
    ],
    "lore": "Village relies on fog cycles for concealment and moisture farming.",
    "history": "Rebuilt after a low-water year exposed supports.",
    "dangers": [
      "Boardwalk slicks",
      "Low visibility collisions"
    ],
    "tips": [
      "Use guide ropes",
      "Mark turns with shells",
      "Carry dryness packs"
    ],
    "description": "Stilted marsh hamlet fading in and out of spectral fog bands.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 22,
      "height": 16
    }
  },

  'mother-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "terra-madre-basin",
    "regionName": "Terra Madre Basin",
    "welcomeMessages": {
      "base": "Welcome to the Mother Temple—earth’s heartbeat set to sanctuary tempo.",
      "variations": [
        "Root-pillars cradle the nave; moss writes blessings in cursive.",
        "Spring wells whisper names—answer softly and bring offerings.",
        "Stone midwives steady the path; every step feels adopted."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Ground",
        "Rock",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Earthmother Icon"
    },
    "specialEncounters": [
      {
        "type": "womb_of_stone",
        "chance": 0.22,
        "description": "Hollow chamber awakens rare Rock/Fairy caretakers."
      },
      {
        "type": "verdant_benediction",
        "chance": 0.1,
        "description": "Ley sap surge boosts Grass/Ground allies with fortify boons."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/mother-temple-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "900 ft",
    "temperature": "60°F to 75°F",
    "weatherPatterns": "Sacred atmosphere, gentle earth vibrations",
    "accessibility": "Spiritual pilgrims and earth goddess devotees",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Earth Mother Shrine",
      "Universal Goddess Worship",
      "Sacred Earth Rituals",
      "Pilgrimage Destination",
      "Divine Motherhood"
    ],
    "wildlife": [
      {
        "name": "Mother's Guardian",
        "species": "Gardevoir / Angewomon / Lovander",
        "type": "Psychic/Ground",
        "rarity": "Extreme",
        "description": "Divine protector of the Earth Mother's temple"
      },
      {
        "name": "Sacred Bear",
        "species": "Ursaring / Grizzlemon",
        "type": "Normal/Ground",
        "rarity": "Rare",
        "description": "Bears that represent the protective mother aspect"
      },
      {
        "name": "Temple Deer",
        "species": "Sawsbuck / Elecmon / Eikthyrdeer",
        "type": "Normal/Grass",
        "rarity": "Common",
        "description": "Gentle deer that graze in the sacred grounds"
      }
    ],
    "resources": [
      {
        "name": "Mother's Love",
        "rarity": "Extreme",
        "description": "Direct blessing of unconditional maternal love"
      },
      {
        "name": "Sacred Earth",
        "rarity": "Rare",
        "description": "Soil blessed by the Earth Mother herself"
      },
      {
        "name": "Nurturing Stones",
        "rarity": "Uncommon",
        "description": "Rocks that promote growth and healing"
      }
    ],
    "lore": "The Mother Temple honors the Earth Mother as the source of all life, representing the divine feminine principle that nurtures and protects all creation.",
    "history": "Built by devotees of various earth goddess traditions who recognized the universal nature of the divine mother, the temple welcomes all who seek maternal blessing.",
    "dangers": [
      "Overwhelming maternal love",
      "Emotional spiritual experiences",
      "Protective temple guardians",
      "Intensive purification rituals"
    ],
    "tips": [
      "Approach with reverence and humility",
      "Bring offerings for the Earth Mother",
      "Prepare for emotional healing",
      "Respect the sacred feminine",
      "Open your heart to maternal love"
    ],
    "description": "Sacred temple complex dedicated to the Earth Mother in all her forms, where pilgrims come to seek the blessing of the great goddess who nurtures all life.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 16,
      "height": 18
    }
  },

  'mystery-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "demeters-grove",
    "regionName": "Demeter's Grove",
    "welcomeMessages": {
      "base": "Welcome to the Mystery Temple—rites of seed, shadow, and sunrise.",
      "variations": [
        "Grain torches flicker in cyclers; silence is part of the liturgy.",
        "Veiled hymns braid through hypostyles—follow the pomegranate glyphs.",
        "Death and harvest shake hands politely; do not interrupt."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Fairy",
        "Psychic",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Kernos Token"
    },
    "specialEncounters": [
      {
        "type": "eleusinian_veil",
        "chance": 0.22,
        "description": "Initiation veil summons rare Fairy/Psychic heralds."
      },
      {
        "type": "chthonic_bloom",
        "chance": 0.1,
        "description": "Underworld breeze reveals a Ghost/Grass guide for trial."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/mystery-temple-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "1000 ft",
    "temperature": "50°F to 70°F",
    "weatherPatterns": "Mystical energy fluctuations, otherworldly phenomena",
    "accessibility": "Initiated mystics only, extreme spiritual requirements",
    "recommendedLevel": "80+",
    "specialFeatures": [
      "Sacred Mystery Chambers",
      "Divine Revelation Halls",
      "Initiation Trials",
      "Otherworldly Portals",
      "Ancient Prophecies"
    ],
    "wildlife": [
      {
        "name": "Oracle Sphinx",
        "species": "Delcatty / Sphinxmon / Anubis",
        "type": "Psychic/Flying",
        "rarity": "Extreme",
        "description": "Ancient guardian that poses riddles to seekers"
      },
      {
        "name": "Vision Serpent",
        "species": "Serperior / Seadramon",
        "type": "Psychic/Poison",
        "rarity": "Rare",
        "description": "Sacred snakes that induce prophetic visions"
      },
      {
        "name": "Mystery Cat",
        "species": "Espeon / BlackGatomon / Grintale",
        "type": "Psychic/Dark",
        "rarity": "Uncommon",
        "description": "Cats that walk between worlds and dimensions"
      }
    ],
    "resources": [
      {
        "name": "Divine Revelation",
        "rarity": "Extreme",
        "description": "Direct knowledge from the goddess herself"
      },
      {
        "name": "Sacred Mysteries",
        "rarity": "Extreme",
        "description": "Ancient secrets of life and death"
      },
      {
        "name": "Oracle Stones",
        "rarity": "Rare",
        "description": "Stones that reveal hidden truths"
      }
    ],
    "lore": "The Mystery Temple is where Demeter reveals her deepest secrets to those who prove themselves worthy. The knowledge gained here transforms initiates forever.",
    "history": "Built in the earliest days of the grove, the temple has been the site of the most profound spiritual experiences and divine revelations for millennia.",
    "dangers": [
      "Overwhelming divine knowledge",
      "Initiation trials that can destroy the unworthy",
      "Visions that can drive mortals mad",
      "Direct contact with divine power",
      "Permanent spiritual transformation"
    ],
    "tips": [
      "Complete all preliminary initiations first",
      "Undergo years of spiritual preparation",
      "Bring proof of worthiness",
      "Accept that you may be forever changed",
      "Trust in Demeter's wisdom"
    ],
    "description": "Ancient temple complex where the deepest mysteries of life, death, and rebirth are revealed to worthy initiates through sacred ceremonies and divine visions.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 16,
      "height": 18
    }
  },

  'nereid-harbor': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to Nereid Harbor—lantern shoals and guides who sing the currents by name.",
      "variations": [
        "Conch horns coordinate berths; bubbles carry receipts.",
        "Sea nymph patrols braid safe lanes through teethy reefs.",
        "Surface traders dock upstairs; business downstairs is wetter."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Fairy",
        "Electric",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 10,
      "max": 18
    },
    "agroRange": {
      "min": 20,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Conch Harbor Pass"
    },
    "specialEncounters": [
      {
        "type": "tide_ceremony",
        "chance": 0.22,
        "description": "Harbor rite boosts Water/Fairy support spawns with ward auras."
      },
      {
        "type": "dock_spark",
        "chance": 0.1,
        "description": "A charged crane draws a rare Electric/Steel sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/nereid-harbor-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "-50 ft to surface",
    "temperature": "65°F to 75°F",
    "weatherPatterns": "Tidal changes, sea nymph magic",
    "accessibility": "Surface and underwater access available",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Dual-Level Harbor",
      "Nereid Guidance",
      "Ship Protection",
      "Underwater Docks",
      "Tidal Pools"
    ],
    "wildlife": [
      {
        "name": "Harbor Nereid",
        "species": "Vaporeon / Neptunemon / Ningyo",
        "type": "Water/Fairy",
        "rarity": "Rare",
        "description": "Sea nymphs who guide ships safely to port"
      },
      {
        "name": "Dock Seal",
        "species": "Dewgong / Seadramon / Kappa",
        "type": "Water/Normal",
        "rarity": "Common",
        "description": "Friendly seals that help with harbor operations"
      },
      {
        "name": "Storm Petrel",
        "species": "Pelipper / Airdramon / Tengu",
        "type": "Water/Flying",
        "rarity": "Uncommon",
        "description": "Seabirds that predict weather changes"
      }
    ],
    "resources": [
      {
        "name": "Navigation Crystals",
        "rarity": "Rare",
        "description": "Crystals that always point toward safe harbor"
      },
      {
        "name": "Nereid Tears",
        "rarity": "Rare",
        "description": "Magical tears that calm stormy seas"
      },
      {
        "name": "Harbor Supplies",
        "rarity": "Common",
        "description": "Essential goods for sea voyages"
      }
    ],
    "lore": "Nereid Harbor has been blessed by the fifty sea nymphs, daughters of the ancient sea guardian, who have sworn to protect all who seek safe passage through the sea lord's domain.",
    "history": "Established centuries ago when the first nereids took pity on drowning sailors. The harbor has since become a sanctuary for all sea travelers.",
    "dangers": [
      "Sudden tidal changes",
      "Pirates in nearby waters",
      "Merfolk territorial disputes",
      "Unpredictable weather",
      "Deep water zones"
    ],
    "tips": [
      "Always check with harbor nereids before departing",
      "Carry offerings for the sea nymphs",
      "Monitor tidal schedules",
      "Respect both surface and underwater protocols",
      "Keep emergency flotation devices ready"
    ],
    "description": "Bustling underwater port where sea nymphs guide ships through treacherous waters, connecting the surface world with the depths of the ocean.",
    "mapCoordinates": {
      "x": 10,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'nine-dragons': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "long-valley",
    "regionName": "Long Valley",
    "welcomeMessages": {
      "base": "Mist tumbles at Nine Dragons Falls where spectral drakes coil in water arches.",
      "variations": [
        "Pearl droplets hover briefly forming draconic sigils.",
        "Cascade thunder harmonizes with low dragon chants.",
        "Prismatic spray refracts scales of unseen guardians."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Water",
        "Fairy"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 60,
      "max": 100
    },
    "agroRange": {
      "min": 55,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Waterfall Pilgrim Charm"
    },
    "specialEncounters": [
      {
        "type": "cascade_convergence",
        "chance": 0.23,
        "description": "Water arcs align spawning a rare Dragon hybrid."
      },
      {
        "type": "pearl_mist_event",
        "chance": 0.11,
        "description": "Mist pearls amplify Fairy resonance."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/nine-dragons-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Multi-tier falls",
    "temperature": "50°F to 70°F",
    "weatherPatterns": "Continuous spray, prism haze",
    "accessibility": "Pilgrim stair trail",
    "recommendedLevel": "70-100",
    "specialFeatures": [
      "Dragon Mist Arches",
      "Pearl Spray Basins",
      "Chant Echo Ledges"
    ],
    "wildlife": [
      {
        "name": "Pearl Drakeling",
        "species": "Dratini / Seadramon / Lovander",
        "type": "Dragon/Water",
        "rarity": "Common",
        "description": "Circles lower basins collecting spray."
      },
      {
        "name": "Mist Archon",
        "species": "Altaria / AeroVeedramon / Petallia",
        "type": "Dragon/Fairy",
        "rarity": "Uncommon",
        "description": "Maintains arch stability during chants."
      },
      {
        "name": "Cascade Sovereign",
        "species": "Dragonite / HiAndromon / Paladius",
        "type": "Dragon/Psychic",
        "rarity": "Rare",
        "description": "Manifests at triple-chant intervals."
      }
    ],
    "resources": [
      {
        "name": "Mist Pearl",
        "rarity": "Rare",
        "description": "Condensed droplet crystallized by draconic resonance."
      },
      {
        "name": "Cascade Spray Sample",
        "rarity": "Uncommon",
        "description": "Charged water with focus potential."
      },
      {
        "name": "Wet Stone Chip",
        "rarity": "Common",
        "description": "Smoothed fragment from lower ledge."
      }
    ],
    "lore": "Falls said to mirror nine ancestral dragon lineages.",
    "history": "Pilgrimages formalized after first recorded triple resonance.",
    "dangers": [
      "Slippery ledges",
      "Spray disorientation",
      "Chant echo vertigo"
    ],
    "tips": [
      "Use tread spikes",
      "Time climbs between chant phases",
      "Secure gear against spray"
    ],
    "description": "Sacred cascade where spectral dragon arches braid mist pearls.",
    "mapCoordinates": {
      "x": 20,
      "y": 65,
      "width": 35,
      "height": 30
    }
  },

  'nyakuza-landing': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "pirates-bay",
    "regionName": "Pirates' Bay",
    "welcomeMessages": {
      "base": "Welcome to Nyakuza Landing—soft paws, sharp laws, fortified beach.",
      "variations": [
        "Claw-mark sigils guard the dunes; trespass earns a scratchy surcharge.",
        "Catwalk watchtowers prowl the tide line—stylish and terrifying.",
        "Fish markets double as recruitment drives; contracts purr."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Water",
        "Fighting",
        "Steel",
        "Normal"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Nyakuza Clan Tag"
    },
    "specialEncounters": [
      {
        "type": "shoreline_shakedown",
        "chance": 0.22,
        "description": "Patrol sweep summons elite Dark/Water enforcers."
      },
      {
        "type": "clan_trial",
        "chance": 0.1,
        "description": "A rare Fighting/Steel duelist issues the padded gauntlet."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/nyakuza-landing-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "0 ft - 30 ft",
    "temperature": "75°F to 85°F",
    "weatherPatterns": "Controlled by Nyakuza weather manipulation technology",
    "accessibility": "Highly restricted, requires Nyakuza permission or extreme stealth",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Nyakuza Fortress",
      "Advanced Landing Systems",
      "Cat-themed Architecture",
      "High-Tech Security",
      "Underground Networks",
      "Feared Pirates' Base"
    ],
    "wildlife": [
      {
        "name": "Nyakuza Enforcer",
        "species": "Persian / Cattiva / Shadowbeak",
        "type": "Dark/Fighting",
        "rarity": "Rare",
        "description": "Elite feline warriors trained in advanced combat techniques and stealth operations"
      },
      {
        "name": "Tech Cat",
        "species": "Mewtwo / Grizzbolt",
        "type": "Psychic/Steel",
        "rarity": "Extreme",
        "description": "Highly intelligent cybernetic felines that manage the clan's advanced technology"
      },
      {
        "name": "Shadow Lynx",
        "species": "Linoone / Felbat / Kitsun",
        "type": "Dark/Psychic",
        "rarity": "Uncommon",
        "description": "Stealthy reconnaissance specialists that gather intelligence for the Nyakuza clan"
      }
    ],
    "resources": [
      {
        "name": "Nyakuza Technology",
        "rarity": "Extreme",
        "description": "Advanced gadgets and weapons developed by the most innovative pirate clan"
      },
      {
        "name": "Clan Artifacts",
        "rarity": "Rare",
        "description": "Sacred items and trophies representing the Nyakuza's greatest victories"
      },
      {
        "name": "Intelligence Reports",
        "rarity": "Rare",
        "description": "Detailed information about targets, rivals, and opportunities across the seas"
      }
    ],
    "lore": "Nyakuza Landing represents the pinnacle of pirate evolution, where traditional piracy meets cutting-edge technology. The Nyakuza clan has revolutionized maritime crime through superior organization and innovation.",
    "history": "Established 150 years ago by the legendary Captain Whiskers, the Nyakuza clan has grown from a small crew of cat-loving pirates into the most powerful and feared pirate organization in the world.",
    "dangers": [
      "High-tech security systems",
      "Elite Nyakuza warriors",
      "Automated defense turrets",
      "Advanced surveillance network",
      "Psychological warfare tactics",
      "Clan retribution protocols"
    ],
    "tips": [
      "Never underestimate Nyakuza technology",
      "Respect feline sensibilities and customs",
      "Avoid direct confrontation at all costs",
      "Consider diplomatic approaches",
      "Understand their honor code",
      "Prepare for unconventional tactics"
    ],
    "description": "The landing site of the Nyakuza pirate clan, where the most feared pirates in the world make their home. This fortified beach serves as both landing zone and fortress for the infamous cat-themed pirate organization.",
    "mapCoordinates": {
      "x": 10,
      "y": 10,
      "width": 18,
      "height": 15
    }
  },

  'oberon-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "seelie-courts",
    "regionName": "Seelie Courts",
    "welcomeMessages": {
      "base": "You cross into Oberon Village where regal fae courts rehearse moonlit rites.",
      "variations": [
        "Crystal pennants chime in synchronized cadence.",
        "Petal banners shimmer with phased luminescence.",
        "Court stewards trace orbit patterns in soft moss."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fairy",
        "Grass",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 25,
      "max": 80
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "court_rehearsal",
        "chance": 0.2,
        "description": "Ritual rehearsal elevates Fairy encounter tier."
      },
      {
        "type": "regal_alignment",
        "chance": 0.1,
        "description": "Crown glyph alignment summons psychic fae hybrid."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/oberon-village-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Clearing terrace",
    "temperature": "60°F to 74°F",
    "weatherPatterns": "Petal drift, crystal pennant chimes",
    "accessibility": "Runic arch gate",
    "recommendedLevel": "45-80",
    "specialFeatures": [
      "Crystal Pennant Courts",
      "Moonlit Rite Circles",
      "Petal Banner Hall"
    ],
    "wildlife": [
      {
        "name": "Court Sylph",
        "species": "Ribombee / Fairimon / Petallia",
        "type": "Fairy/Bug",
        "rarity": "Common",
        "description": "Carries ritual pollen to banners."
      },
      {
        "name": "Banner Warden",
        "species": "Gardevoir / Kazemon / Sweepa",
        "type": "Fairy/Psychic",
        "rarity": "Uncommon",
        "description": "Monitors banner resonance during rites."
      },
      {
        "name": "Regal Antlerkin",
        "species": "Sawsbuck / Cherrymon / Mossanda",
        "type": "Grass/Fairy",
        "rarity": "Rare",
        "description": "Oversees seasonal court transitions."
      }
    ],
    "resources": [
      {
        "name": "Pollen Seal",
        "rarity": "Common",
        "description": "Stamped token confirming rite attendance."
      },
      {
        "name": "Resonant Pennant Fiber",
        "rarity": "Uncommon",
        "description": "Chimes faintly when near aligned moonlight."
      },
      {
        "name": "Court Crest Shard",
        "rarity": "Rare",
        "description": "Holds imprint of seasonal authority."
      }
    ],
    "lore": "Village ensures continuity of fae governance cycles.",
    "history": "Founded after disputes required structured court protocols.",
    "dangers": [
      "Rite area crowding",
      "Resonance fatigue"
    ],
    "tips": [
      "Observe ritual boundaries",
      "Carry resonance dampener",
      "Rest between chant phases"
    ],
    "description": "Regal fae enclave balancing ritual order and seasonal magic.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'obsidian-halls': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "volcanic-peaks",
    "regionName": "Volcanic Peaks",
    "welcomeMessages": {
      "base": "Welcome to the Obsidian Halls—glass corridors whispering heat and history.",
      "variations": [
        "Embers stitch constellations along the ceiling—guides read by glow.",
        "Forge Spirits breathe from cracks; the air tastes like iron prayers.",
        "Footfalls ring like bells—answer when the caverns ask your name."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Rock",
        "Ground"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Flameward Sigil"
    },
    "specialEncounters": [
      {
        "type": "glass_echo",
        "chance": 0.22,
        "description": "Resonant vaults summon elite Fire/Rock custodians."
      },
      {
        "type": "forge_spirit_parley",
        "chance": 0.1,
        "description": "A molten warden—rare Ground/Fire—offers a tempered trial."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/obsidian-halls-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "1,200 ft",
    "temperature": "100°F to 140°F",
    "weatherPatterns": "Ethereal embers, echoing whispers, thermal drafts",
    "accessibility": "Shamanic gates, ember-lit corridors",
    "recommendedLevel": "60-80",
    "specialFeatures": [
      "Spirit Chambers",
      "Crystalized Lava Pools",
      "Echoing Halls"
    ],
    "wildlife": [
      {
        "name": "Stormscale",
        "species": "Zekrom / WarGreymon / Raijin / Palmon / Voltfin",
        "type": "Electric/Dragon",
        "rarity": "Legendary",
        "description": "Gliding silently through the halls, it illuminates crystal veins with arcs of lightning."
      },
      {
        "name": "Granitusk",
        "species": "Tyranitar / Magmemon / Oni / Palmon / Basaltigon",
        "type": "Rock/Ground",
        "rarity": "Rare",
        "description": "Its rumbling growl causes the glass walls to hum with resonant frequency."
      },
      {
        "name": "Windflock",
        "species": "Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Their wings stir embers into glowing patterns across the polished obsidian floor."
      }
    ],
    "resources": [
      {
        "name": "Spirit Ember",
        "rarity": "Extreme",
        "description": "Concentrated ember imbued with spirit essence."
      },
      {
        "name": "Obsidian Mirror",
        "rarity": "Rare",
        "description": "Reflective shards used in shamanic rituals."
      },
      {
        "name": "Lava Pearl",
        "rarity": "Rare",
        "description": "Small spheres formed in the deepest pools."
      }
    ],
    "lore": "The halls resonate with the voices of past shamans channeling volcanic spirits.",
    "history": "Carved by ancient rituals to house the Forge Spirits at the world’s creation.",
    "dangers": [
      "Spirit possession",
      "Glass spires",
      "Heat pulses"
    ],
    "tips": [
      "Carry spirit wards",
      "Follow ember guides",
      "Respect the silence"
    ],
    "description": "A labyrinth of volcanic glass caverns where Flame Shamans commune with Forge Spirits amid flickering embers.",
    "mapCoordinates": {
      "x": 55,
      "y": 65,
      "width": 20,
      "height": 22
    }
  },

  'persephone-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "demeters-grove",
    "regionName": "Demeter's Grove",
    "welcomeMessages": {
      "base": "Welcome to Persephone Village—bloom and hush in perfect turn.",
      "variations": [
        "Spring garlands sing; winter lanterns remember.",
        "Pomegranate dyes stain the air with sweet omens.",
        "Half the doors open to gardens, half to echoes—choose kindly."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Fairy",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 10,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "spring_return",
        "chance": 0.22,
        "description": "Seasonal surge boosts Grass/Fairy support and spawn rates."
      },
      {
        "type": "underworld_breath",
        "chance": 0.12,
        "description": "A winter veil reveals a rare Ghost/Grass guide."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/persephone-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "600 ft",
    "temperature": "45°F to 80°F (varies by season)",
    "weatherPatterns": "Dramatic seasonal changes, spring blooms, winter dormancy",
    "accessibility": "Seasonal visitors welcome, spring celebrations",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Seasonal Transformations",
      "Spring Festivals",
      "Underworld Connections",
      "Flower Gardens",
      "Mourning Rituals"
    ],
    "wildlife": [
      {
        "name": "Season Fairy",
        "species": "Florges / Lillymon / Petallia",
        "type": "Fairy/Grass",
        "rarity": "Rare",
        "description": "Fairies that change appearance with the seasons"
      },
      {
        "name": "Pomegranate Bird",
        "species": "Chatot / Biyomon / Fenglope",
        "type": "Grass/Flying",
        "rarity": "Uncommon",
        "description": "Birds that carry messages between worlds"
      },
      {
        "name": "Bloom Butterfly",
        "species": "Butterfree / Butterflamon",
        "type": "Bug/Grass",
        "rarity": "Common",
        "description": "Butterflies that herald the arrival of spring"
      }
    ],
    "resources": [
      {
        "name": "Persephone's Tears",
        "rarity": "Rare",
        "description": "Magical tears that can heal or bring sorrow"
      },
      {
        "name": "Seasonal Flowers",
        "rarity": "Common",
        "description": "Flowers that bloom regardless of normal season"
      },
      {
        "name": "Pomegranate Seeds",
        "rarity": "Uncommon",
        "description": "Seeds that connect the upper and lower worlds"
      }
    ],
    "lore": "Persephone Village embodies the eternal cycle of the seasons, representing the Greek myth of Persephone's journey between the world of the living and the underworld.",
    "history": "The village was founded by worshippers of Persephone who wanted to live in harmony with the seasonal cycle and honor both life and death.",
    "dangers": [
      "Seasonal depression during winter months",
      "Underworld portal fluctuations",
      "Emotional intensity of ceremonies",
      "Grief overwhelming visitors"
    ],
    "tips": [
      "Visit during spring for the best experience",
      "Respect both joyful and sorrowful ceremonies",
      "Bring flowers as offerings",
      "Learn about the Persephone myth",
      "Embrace the seasonal changes"
    ],
    "description": "Village that changes with the seasons, blooming magnificently in spring and summer when Persephone returns, then becoming somber during her underworld months.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'pirate-port': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "pirates-bay",
    "regionName": "Pirates' Bay",
    "welcomeMessages": {
      "base": "Welcome to the Pirate Port—lawless docks, loud coffers, and legends with bar tabs.",
      "variations": [
        "Chain cranes swing treasure nets; gulls file claims promptly.",
        "Shanties chart the tides; the chorus knows your name already.",
        "If the harbormaster smiles, check your pockets and your ship."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Dark",
        "Steel",
        "Fighting"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Harbor Pass"
    },
    "specialEncounters": [
      {
        "type": "contraband_auction",
        "chance": 0.22,
        "description": "Back-alley bidding draws rare Dark/Steel enforcers."
      },
      {
        "type": "storm_dock_raid",
        "chance": 0.1,
        "description": "A squall cover brings Water/Fighting raiders to challenge crews."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/pirate-port-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "0 ft - Sea Level",
    "temperature": "75°F to 85°F",
    "weatherPatterns": "Tropical storms, sea winds, occasional hurricanes",
    "accessibility": "Open to all brave enough to navigate pirate politics",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Treasure Ships",
      "Pirate Taverns",
      "Black Market",
      "Carousing Crews",
      "Dangerous Waters",
      "Docking Fees (in Blood or Gold)"
    ],
    "wildlife": [
      {
        "name": "Sea Raider",
        "species": "Gyarados / Seadramon / Surfent",
        "type": "Water/Dark",
        "rarity": "Uncommon",
        "description": "Fierce sea monsters trained by pirates for naval combat and treasure hunting"
      },
      {
        "name": "Parrot Lookout",
        "species": "Chatot / Nitocris",
        "type": "Flying/Normal",
        "rarity": "Common",
        "description": "Intelligent birds that serve as scouts and messengers for pirate crews"
      },
      {
        "name": "Port Shark",
        "species": "Sharpedo / Jormuntide / Robinquill",
        "type": "Water/Dark",
        "rarity": "Rare",
        "description": "Aggressive predators that patrol the harbor waters for scraps and enemies"
      },
      {
        "name": "Rum Runner",
        "species": "Sableye / Impmon",
        "type": "Dark/Ghost",
        "rarity": "Uncommon",
        "description": "Mischievous spirits that smuggle contraband and play pranks on sailors"
      }
    ],
    "resources": [
      {
        "name": "Pirate Treasure",
        "rarity": "Rare",
        "description": "Gold coins, precious gems, and exotic artifacts from distant lands"
      },
      {
        "name": "Smuggled Goods",
        "rarity": "Uncommon",
        "description": "Rare items and contraband from across the seven seas"
      },
      {
        "name": "Sea Charts",
        "rarity": "Rare",
        "description": "Maps to hidden islands, treasure locations, and secret passages"
      },
      {
        "name": "Ship Supplies",
        "rarity": "Common",
        "description": "Ropes, sails, cannons, and other maritime equipment"
      }
    ],
    "lore": "Pirate Port serves as the unofficial capital of the pirate world, where the most notorious captains gather to trade stories, plan raids, and divide their plunder. The port operates under the ancient Pirate Code, where strength and cunning determine authority.",
    "history": "Founded over 300 years ago by the legendary Captain Blackwater, the port has grown from a hidden cove into a sprawling maritime city. It has survived countless naval battles and remains unconquered.",
    "dangers": [
      "Violent pirate crews",
      "Unpredictable weather",
      "Corrupt port authorities",
      "Sea monster attacks",
      "Rival crew conflicts",
      "Cursed treasure"
    ],
    "tips": [
      "Respect the Pirate Code",
      "Never sail alone in these waters",
      "Keep your weapons visible but peaceful",
      "Pay your docking fees promptly",
      "Watch your back in taverns",
      "Don't trust anyone completely"
    ],
    "description": "The bustling port of the pirate lords, where ships laden with treasure dock and crews carouse. A lawless harbor filled with danger, treasure, and adventure at every turn.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 20
    }
  },

  'pirate-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "pirates-bay",
    "regionName": "Pirates' Bay",
    "welcomeMessages": {
      "base": "Welcome to the Pirate Village—shanty lanes, buried rumors, and hammocks that whisper.",
      "variations": [
        "Kids trade treasure maps; most lead to good stories.",
        "Signal flags talk across rooftops—some gossip, some warnings.",
        "If the sand grins, that’s a trap. Bring snacks anyway."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Dark",
        "Normal"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 15,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "buried_cache",
        "chance": 0.2,
        "description": "A fresh map turns up—rare Dark/Water scavenger appears."
      },
      {
        "type": "dockside_duel",
        "chance": 0.12,
        "description": "Local hotshot offers a bout—Normal/Dark companion joins the fray."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/pirate-village-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "10 ft - 50 ft",
    "temperature": "75°F to 85°F",
    "weatherPatterns": "Tropical climate, afternoon thunderstorms, sea breezes",
    "accessibility": "Dangerous for outsiders, safer for those with pirate connections",
    "recommendedLevel": "58+",
    "specialFeatures": [
      "Shantytown Architecture",
      "Buried Treasure Sites",
      "Pirate Culture Hub",
      "Underground Tunnels",
      "Fighting Pits",
      "Hidden Caches"
    ],
    "wildlife": [
      {
        "name": "Treasure Hound",
        "species": "Mightyena / Direhowl / Kitsun",
        "type": "Dark/Ground",
        "rarity": "Uncommon",
        "description": "Loyal canines trained to sniff out buried treasure and guard pirate homes"
      },
      {
        "name": "Scurvy Cat",
        "species": "Meowth / Chillet",
        "type": "Normal/Dark",
        "rarity": "Common",
        "description": "Streetwise felines that prowl the village alleys hunting for scraps and secrets"
      },
      {
        "name": "Tavern Brawler",
        "species": "Machamp / Greymon / Anubis",
        "type": "Fighting/Dark",
        "rarity": "Rare",
        "description": "Tough enforcers who keep order in the village through intimidation and strength"
      }
    ],
    "resources": [
      {
        "name": "Buried Treasure Maps",
        "rarity": "Rare",
        "description": "Hand-drawn maps leading to hidden treasure caches around the island"
      },
      {
        "name": "Pirate Artifacts",
        "rarity": "Uncommon",
        "description": "Old weapons, jewelry, and keepsakes with mysterious histories"
      },
      {
        "name": "Rope and Nets",
        "rarity": "Common",
        "description": "Sturdy marine equipment crafted by experienced sailors"
      }
    ],
    "lore": "Pirate Village grew organically around the port as a place where pirate families could settle when not at sea. The village maintains its own rough justice system and has never been fully conquered by any outside force.",
    "history": "What started as temporary shelters for pirate families evolved into a permanent settlement. The village has weathered storms, raids, and sieges while maintaining its fierce independence.",
    "dangers": [
      "Gang territorial disputes",
      "Buried treasure traps",
      "Unstable shanty structures",
      "Wild animals in tunnels",
      "Revenge seekers",
      "Quicksand pits"
    ],
    "tips": [
      "Learn the local gang territories",
      "Carry small valuables for bribes",
      "Avoid walking alone at night",
      "Respect the elderly pirates",
      "Don't dig randomly for treasure",
      "Know the escape routes"
    ],
    "description": "The shantytown of the pirate crews, where danger lurks around every corner and treasures are buried in the sand. A rough settlement where retired pirates and their families make their home.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'poison-pools': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "crowsfoot-marsh",
    "regionName": "Crowsfoot Marsh",
    "welcomeMessages": {
      "base": "Welcome to the Poison Pools—toxic mirrors and riches that bite back.",
      "variations": [
        "Iridescent films swirl; beauty here files its teeth.",
        "Bone markers warn the bold; reeds whisper antidotes and dares.",
        "Step only where the lantern moths hover—they vote on safe spots."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Poison",
        "Water",
        "Bug",
        "Dark"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Antitoxin Permit"
    },
    "specialEncounters": [
      {
        "type": "toxin_bloom",
        "chance": 0.22,
        "description": "Chemical surge spawns elite Poison/Water predators with hazard auras."
      },
      {
        "type": "venom_trapper",
        "chance": 0.1,
        "description": "A chitin engineer—rare Bug/Dark—sets a gauntlet along the rim."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/poison-pools-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "10 ft",
    "temperature": "75°F to 90°F",
    "weatherPatterns": "Toxic vapors, acid rain, poisonous mists",
    "accessibility": "Extreme toxicity - protective equipment essential",
    "recommendedLevel": "75+",
    "specialFeatures": [
      "Toxic Pool Network",
      "Poison Harvesting",
      "Chemical Hazards",
      "Rare Ingredients",
      "Environmental Danger"
    ],
    "wildlife": [
      {
        "name": "Toxic Slime",
        "species": "Muk / Raremon / Gumoss",
        "type": "Poison",
        "rarity": "Common",
        "description": "Acidic creatures that thrive in poisonous water"
      },
      {
        "name": "Venom Drake",
        "species": "Dragalge / Venomvamdemon / Elphidran",
        "type": "Poison/Dragon",
        "rarity": "Extreme",
        "description": "Dragon that has adapted to the toxic environment"
      },
      {
        "name": "Acid Frog",
        "species": "Croagunk / Otamamon",
        "type": "Poison/Water",
        "rarity": "Uncommon",
        "description": "Amphibians with corrosive skin secretions"
      }
    ],
    "resources": [
      {
        "name": "Concentrated Poisons",
        "rarity": "Extreme",
        "description": "Extremely potent toxins for advanced alchemy"
      },
      {
        "name": "Toxic Crystals",
        "rarity": "Rare",
        "description": "Crystallized poisons with magical properties"
      },
      {
        "name": "Antidote Herbs",
        "rarity": "Rare",
        "description": "Rare plants that counteract specific toxins"
      }
    ],
    "lore": "The Poison Pools formed when ancient magical experiments went wrong, creating a toxic wasteland that paradoxically produces some of the most valuable alchemical ingredients.",
    "history": "Created by a catastrophic magical accident centuries ago, the pools have evolved into a unique ecosystem where only the most adapted creatures can survive.",
    "dangers": [
      "Lethal poison exposure",
      "Toxic vapor inhalation",
      "Acid burns from pools",
      "Poisonous creature attacks",
      "Equipment corrosion"
    ],
    "tips": [
      "Wear full protective gear",
      "Bring multiple antidotes",
      "Monitor air quality constantly",
      "Have emergency evacuation ready",
      "Work with experienced toxicologists"
    ],
    "description": "Treacherous area of interconnected toxic pools where deadly chemicals and magical poisons have created a hazardous but resource-rich environment.",
    "mapCoordinates": {
      "x": 15,
      "y": 70,
      "width": 25,
      "height": 20
    }
  },

  'puck-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "seelie-courts",
    "regionName": "Seelie Courts",
    "welcomeMessages": {
      "base": "Laughter echoes through Puck Town—mosaic lanes twisting with playful glamours.",
      "variations": [
        "Illusory lanterns swap colors unpredictably.",
        "Prank sprites rearrange signpost glyphs.",
        "Soft chimes trigger minor harmless illusions."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fairy",
        "Dark"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 18,
      "max": 55
    },
    "agroRange": {
      "min": 15,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "prank_confluence",
        "chance": 0.19,
        "description": "Multiple illusions converge spawning rare trickster hybrid."
      },
      {
        "type": "glamour_spiral",
        "chance": 0.09,
        "description": "Spiral charm heightens Fairy/Dark synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/puck-town-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Forest lane level",
    "temperature": "62°F to 76°F",
    "weatherPatterns": "Illusory lantern swaps, laughter gusts",
    "accessibility": "Winding charm paths",
    "recommendedLevel": "25-55",
    "specialFeatures": [
      "Glamour Spiral Plaza",
      "Prank Sprite Alleys",
      "Illusion Lantern Lanes"
    ],
    "wildlife": [
      {
        "name": "Lantern Flicker",
        "species": "Morelull / Candlemon / Foxparks",
        "type": "Fairy/Grass",
        "rarity": "Common",
        "description": "Shifts lantern hues erratically."
      },
      {
        "name": "Prank Weaver",
        "species": "Cutiefly / Kodokugumon / Vixy",
        "type": "Fairy/Bug",
        "rarity": "Uncommon",
        "description": "Spins temporary illusion threads."
      },
      {
        "name": "Glamour Trickster",
        "species": "Mimikyu / BlackGatomon / Sweepa",
        "type": "Fairy/Dark",
        "rarity": "Rare",
        "description": "Orchestrates multi-lane prank cascades."
      }
    ],
    "resources": [
      {
        "name": "Illusion Thread",
        "rarity": "Common",
        "description": "Ephemeral fiber sustaining minor glamours."
      },
      {
        "name": "Prank Dust",
        "rarity": "Uncommon",
        "description": "Sparkle particulate triggering laughter reflex."
      },
      {
        "name": "Glamour Core Prism",
        "rarity": "Rare",
        "description": "Focus crystal for stable large-scale illusions."
      }
    ],
    "lore": "Town channels disruptive creativity into controlled displays.",
    "history": "Established after wandering prank bands sought a base.",
    "dangers": [
      "Disorientation",
      "Path misdirection"
    ],
    "tips": [
      "Anchor with focus charm",
      "Verify signposts twice",
      "Avoid chasing stray lights"
    ],
    "description": "Prankster fae borough alive with glamours and playful illusions.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'pythia-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "oracles-sanctum",
    "regionName": "Oracle's Sanctum",
    "welcomeMessages": {
      "base": "Incense swirls in Pythia Village where novice seers memorize resonance hymns.",
      "variations": [
        "Bronze bowls ring with training intervals.",
        "Petal offerings drift across scrying basins.",
        "Initiates trace sigils in heated sand for focus."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 50
    },
    "agroRange": {
      "min": 10,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "basin_vision_spark",
        "chance": 0.18,
        "description": "Shared vision improves Psychic encounter quality."
      },
      {
        "type": "sigil_focus_trial",
        "chance": 0.1,
        "description": "Sigil completion spawns rare Fairy hybrid."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/pythia-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Hill terrace",
    "temperature": "58°F to 72°F",
    "weatherPatterns": "Incense drift, bronze bowl tones",
    "accessibility": "Pilgrim stone path",
    "recommendedLevel": "20-50",
    "specialFeatures": [
      "Scrying Basin Courts",
      "Resonance Sand Circles",
      "Mind Crystal Groves"
    ],
    "wildlife": [
      {
        "name": "Focus Initiate",
        "species": "Ralts / Clockmon / Teafant",
        "type": "Psychic/Fairy",
        "rarity": "Common",
        "description": "Practices low-tier foresight patterns."
      },
      {
        "name": "Sigil Keeper",
        "species": "Kirlia / Wisemon / Petallia",
        "type": "Psychic/Fairy",
        "rarity": "Uncommon",
        "description": "Maintains sand sigil accuracy."
      },
      {
        "name": "Vision Warden",
        "species": "Gardevoir / Kazemon / Katress",
        "type": "Psychic/Fairy",
        "rarity": "Rare",
        "description": "Guides group trance harmonics."
      }
    ],
    "resources": [
      {
        "name": "Mind Crystal Chip",
        "rarity": "Common",
        "description": "Minor focus enhancer."
      },
      {
        "name": "Incense Pellet",
        "rarity": "Uncommon",
        "description": "Sustains steady meditative rhythm."
      },
      {
        "name": "Resonant Basin Shard",
        "rarity": "Rare",
        "description": "Amplifies predictive clarity."
      }
    ],
    "lore": "Village formalizes early prophecy discipline pathways.",
    "history": "Expanded after surplus of wandering petitioners.",
    "dangers": [
      "Vision fatigue",
      "Incense over-inhalation"
    ],
    "tips": [
      "Rotate focus drills",
      "Vent chambers regularly",
      "Log trance durations"
    ],
    "description": "Novice oracle settlement training focus through ritual resonance.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 18,
      "height": 16
    }
  },

  'rimeheart-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Rimeheart Town—frost scholars and a heartbeat sealed in ice.",
      "variations": [
        "Runes trace on the glacier core; lectures happen in mittens.",
        "Aurora maps drape the academy rafters—bring notes and cocoa.",
        "If your breath rings like a bell, class is starting."
      ]
    },
    "battleParameters": {
      "weather": "snow",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Psychic",
        "Water"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "heart_of_ice",
        "chance": 0.22,
        "description": "Glacial pulse empowers Ice/Psychic spawns with focus boons."
      },
      {
        "type": "frost_doctrine",
        "chance": 0.12,
        "description": "A scholar-warden—rare Water/Ice—invites a measured duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/rimeheart-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "1800 ft",
    "temperature": "-25°F to 15°F",
    "weatherPatterns": "Constant cold emanation, ice magic effects",
    "accessibility": "Ice magic practitioners and researchers",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Eternal Ice Heart",
      "Ice Magic Schools",
      "Frost Research",
      "Magical Phenomena",
      "Ice Sculpting"
    ],
    "wildlife": [
      {
        "name": "Ice Elemental",
        "species": "Regice / Frigimon / Frostallion",
        "type": "Ice",
        "rarity": "Rare",
        "description": "Pure beings of crystallized ice magic"
      },
      {
        "name": "Frost Sprite",
        "species": "Vanillite / Yukidarumon",
        "type": "Ice/Fairy",
        "rarity": "Uncommon",
        "description": "Tiny spirits that dance in ice crystals"
      },
      {
        "name": "Rime Fox",
        "species": "Alolan Vulpix / Renamon / Foxcicle",
        "type": "Ice/Psychic",
        "rarity": "Uncommon",
        "description": "Clever foxes with ice-crystal fur"
      }
    ],
    "resources": [
      {
        "name": "Eternal Ice",
        "rarity": "Extreme",
        "description": "Ice that never melts, even in fire"
      },
      {
        "name": "Frost Magic Crystals",
        "rarity": "Rare",
        "description": "Crystals that amplify ice magic"
      },
      {
        "name": "Ice Sculptures",
        "rarity": "Uncommon",
        "description": "Beautiful artworks carved from magical ice"
      }
    ],
    "lore": "Rimeheart Town exists around the Extreme Heart of Winter, a massive ice formation that represents the eternal nature of frost and the power of ice magic.",
    "history": "Founded by ice mages who discovered the Heart of Winter, the town has become a center for studying the deepest mysteries of frost magic.",
    "dangers": [
      "Freezing magic effects",
      "Ice magic experiments gone wrong",
      "Heart of Winter's influence",
      "Magical ice storms",
      "Hypothermia from magical cold"
    ],
    "tips": [
      "Study ice magic basics first",
      "Wear magically heated clothing",
      "Respect the Heart of Winter",
      "Learn from experienced ice mages",
      "Carry magical warming potions"
    ],
    "description": "Town built around a massive heart of ice that never melts, where ice mages study the deepest secrets of frost magic and eternal winter.",
    "mapCoordinates": {
      "x": 60,
      "y": 30,
      "width": 20,
      "height": 18
    }
  },

  'river-crossing': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "mictlan-hollows",
    "regionName": "Mictlan Hollows",
    "welcomeMessages": {
      "base": "Current whispers guide you along the River of Souls crossing.",
      "variations": [
        "Spectral ferryman poles through phosphorescent eddies.",
        "Petal rafts carry offerings downstream.",
        "Translucent silhouettes wait at mist moorings."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ghost",
        "Water"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "A"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 45,
      "max": 85
    },
    "agroRange": {
      "min": 45,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Ferryman Token"
    },
    "specialEncounters": [
      {
        "type": "soul_current_confluence",
        "chance": 0.21,
        "description": "Converging currents reveal rare Ghost/Water fusion."
      },
      {
        "type": "ferryman_judgment",
        "chance": 0.11,
        "description": "Passing trial grants boosted encounter quality."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/river-crossing-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Riverbank terraces",
    "temperature": "50°F to 62°F",
    "weatherPatterns": "Soul mist eddies, lantern reflections",
    "accessibility": "Ferryman token queue",
    "recommendedLevel": "45-85",
    "specialFeatures": [
      "Ferryman Docks",
      "Offering Petal Rafts",
      "Soul Current Whirlpools"
    ],
    "wildlife": [
      {
        "name": "Petal Guide",
        "species": "Cottonee / Palmon / Lumira",
        "type": "Grass/Fairy",
        "rarity": "Common",
        "description": "Steers petal rafts gently."
      },
      {
        "name": "Lantern Ferrid",
        "species": "Lampent / Bakemon / Teafant",
        "type": "Ghost/Fire",
        "rarity": "Uncommon",
        "description": "Illuminates current splits."
      },
      {
        "name": "Current Shade",
        "species": "Froslass / Syakomon / Necromus",
        "type": "Ghost/Water",
        "rarity": "Rare",
        "description": "Glides beneath surface attracting spirits."
      }
    ],
    "resources": [
      {
        "name": "Petal Offering",
        "rarity": "Common",
        "description": "Minor tribute easing current passage."
      },
      {
        "name": "Lantern Wick Core",
        "rarity": "Uncommon",
        "description": "Holds steady blue flame."
      },
      {
        "name": "Soul Current Vial",
        "rarity": "Rare",
        "description": "Captured eddy infused with transitional energy."
      }
    ],
    "lore": "Crossing commemorates journeys of remembrance and release.",
    "history": "Formal docks built after unregulated crossings caused drift loss.",
    "dangers": [
      "Current pull",
      "Lantern glare disorientation"
    ],
    "tips": [
      "Secure tokens early",
      "Avoid overloading rafts",
      "Follow ferryman signals"
    ],
    "description": "Mystic ferry juncture guiding offerings between realms.",
    "mapCoordinates": {
      "x": 20,
      "y": 65,
      "width": 35,
      "height": 25
    }
  },

  'sacred-caldera': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "volcanic-peaks",
    "regionName": "Volcanic Peaks",
    "welcomeMessages": {
      "base": "Welcome to the Sacred Caldera—dawn-and-dusk rites in a bowl of living fire.",
      "variations": [
        "Ash halos drift like crowns; shamans trace embers into sigils.",
        "Vents exhale dragon-breath; the rock listens for vows.",
        "The Leviathan’s seat rumbles—respect is non-optional."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Rock",
        "Dragon"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 45,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Leviathan Ember Seal"
    },
    "specialEncounters": [
      {
        "type": "leviathan_ritual",
        "chance": 0.22,
        "description": "Ritual peak spawns Fire/Dragon elites with fervor boons."
      },
      {
        "type": "caldera_resonance",
        "chance": 0.1,
        "description": "Glass rim sings—rare Rock/Fire warden rises from vents."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/sacred-caldera-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "4,200 ft",
    "temperature": "120°F to 180°F",
    "weatherPatterns": "Volcanic storms, ash showers, ritual mists",
    "accessibility": "Sealed pathways, sanctioned ritual routes",
    "recommendedLevel": "65-80",
    "specialFeatures": [
      "Leviathan’s Seal",
      "Ritual Pyres",
      "Molten Glyphs"
    ],
    "wildlife": [
      {
        "name": "Stormscale",
        "species": "Zekrom / WarGreymon / Raijin / Palmon / Voltfin",
        "type": "Electric/Dragon",
        "rarity": "Legendary",
        "description": "Circling the caldera rim in thunderous arcs, its roar echoes like distant drums during ceremonies."
      },
      {
        "name": "Granitusk",
        "species": "Tyranitar / Magmemon / Oni / Palmon / Basaltigon",
        "type": "Rock/Ground",
        "rarity": "Rare",
        "description": "Drawn by the pulsing energy of the seal, these guardians stand sentinel on the lava-scarred slopes."
      },
      {
        "name": "Windflock",
        "species": "Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Flitting through ash clouds, these birds carry embers in their feathers to spread the shamans’ rites."
      }
    ],
    "resources": [
      {
        "name": "Leviathan’s Tear",
        "rarity": "Extreme",
        "description": "Gemstone formed from volcanic tears of the Fire Leviathan."
      },
      {
        "name": "Ash-Cloaked Ember",
        "rarity": "Rare",
        "description": "Particles of pure ritual ash used in awakening ceremonies."
      },
      {
        "name": "Glyphic Forge",
        "rarity": "Rare",
        "description": "Ancient carved stones that guide pyrokinetic flows."
      }
    ],
    "lore": "Legend states the caldera floor is shaped by the Leviathan’s dreams.",
    "history": "Formed in the cataclysmic Eruption of the Titanic Fire millennia ago.",
    "dangers": [
      "Ritual backlash",
      "Ash suffocation",
      "Guardian patrols"
    ],
    "tips": [
      "Follow shaman’s chants",
      "Wear ash-forged talismans",
      "Maintain silence near the seal"
    ],
    "description": "The hollow heart of the largest volcano, revered as the seat of the Fire Leviathan, where Emberkin shamans convene to enact dawn-and-dusk rituals.",
    "mapCoordinates": {
      "x": 35.90257879656161,
      "y": 9.326647564469916,
      "width": 30,
      "height": 25
    }
  },

  'sacred-canyon': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "terra-madre-basin",
    "regionName": "Terra Madre Basin",
    "welcomeMessages": {
      "base": "Welcome to the Sacred Canyon—stone pages, earth scripture.",
      "variations": [
        "Layered cliffs glow at dusk; geologic sentences finish themselves.",
        "Root bridges hum with leylines—step like you’re reading aloud.",
        "Dust devils turn pages; the plot thickens with clay."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Ground",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "geomancy_chorus",
        "chance": 0.2,
        "description": "Aligned leylines boost Rock/Ground spawns with fortify boons."
      },
      {
        "type": "earth_spirit_walk",
        "chance": 0.12,
        "description": "A canyon echo manifests a rare Grass/Fairy guide."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/sacred-canyon-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "400 ft to 1200 ft",
    "temperature": "55°F to 85°F",
    "weatherPatterns": "Temperature variations by depth, earth magic phenomena",
    "accessibility": "Geological researchers and experienced hikers",
    "recommendedLevel": "55+",
    "specialFeatures": [
      "Geological Time Layers",
      "Ancient Earth Spirits",
      "Natural History",
      "Earth Magic Phenomena",
      "Sacred Stone Formations"
    ],
    "wildlife": [
      {
        "name": "Ancient Earth Spirit",
        "species": "Claydol / Gotsumon / Tombat",
        "type": "Ground/Ghost",
        "rarity": "Extreme",
        "description": "Spirits that remember the world's formation"
      },
      {
        "name": "Canyon Eagle",
        "species": "Aerodactyl / Aquilamon",
        "type": "Flying/Rock",
        "rarity": "Uncommon",
        "description": "Eagles that nest in the sacred stone walls"
      },
      {
        "name": "Stone Lizard",
        "species": "Onix / Dromon / Dinossom",
        "type": "Rock/Ground",
        "rarity": "Common",
        "description": "Reptiles perfectly camouflaged against canyon walls"
      }
    ],
    "resources": [
      {
        "name": "Time Stones",
        "rarity": "Extreme",
        "description": "Rocks that contain memories of geological ages"
      },
      {
        "name": "Canyon Crystals",
        "rarity": "Rare",
        "description": "Gems formed by earth magic over millennia"
      },
      {
        "name": "Sacred Sediment",
        "rarity": "Common",
        "description": "Layers of earth with historical significance"
      }
    ],
    "lore": "Sacred Canyon serves as a natural library of the Earth's history, where each stone layer tells the story of geological ages and ancient earth magic.",
    "history": "Carved by earth magic and natural forces over millions of years, the canyon preserves the complete geological history of the region in its stone walls.",
    "dangers": [
      "Rockslides and unstable formations",
      "Getting lost in canyon maze",
      "Flash floods during storms",
      "Ancient earth spirit encounters",
      "Extreme temperature variations"
    ],
    "tips": [
      "Study geological maps before exploring",
      "Bring climbing and safety equipment",
      "Respect ancient earth spirits",
      "Monitor weather conditions",
      "Travel with experienced guides"
    ],
    "description": "Magnificent canyon carved by earth magic over millennia, where the geological history of the world is written in stone layers and ancient earth spirits dwell.",
    "mapCoordinates": {
      "x": 20,
      "y": 65,
      "width": 35,
      "height": 30
    }
  },

  'sacred-pyre': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to the Sacred Pyre—peakfire that writes the sky in bright handwriting.",
      "variations": [
        "Dawn rites kindle staircases of flame; dusk braids the smoke into prayers.",
        "Bellows of wind feed the altar; the coals remember names.",
        "Pilgrims circle sunwise—keep pace or risk poetry."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Fairy",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "First Flame Brand"
    },
    "specialEncounters": [
      {
        "type": "dawn_and_dusk",
        "chance": 0.22,
        "description": "Twin rites spawn Fire/Fairy elites with radiant auras."
      },
      {
        "type": "spirit_ascension",
        "chance": 0.1,
        "description": "A flame-born guardian—rare Fire/Psychic—tests your resolve."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/sacred-pyre-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "6000 ft",
    "temperature": "100°F to 140°F",
    "weatherPatterns": "Scorching heat, updrafts from the sacred fire",
    "accessibility": "Extreme pilgrimage site, divine protection required",
    "recommendedLevel": "75+",
    "specialFeatures": [
      "Massive Sacred Fire",
      "Ceremonial Platform",
      "Divine Manifestations",
      "Spiritual Vortex",
      "Ancient Altar"
    ],
    "wildlife": [
      {
        "name": "Fire Avatar",
        "species": "Victini / Agunimon / Blazamut",
        "type": "Fire/Psychic",
        "rarity": "Extreme",
        "description": "Divine manifestation of the fire spirit itself"
      },
      {
        "name": "Pyre Guardian",
        "species": "Chandelure / Candlemon / Faleris",
        "type": "Fire/Ghost",
        "rarity": "Rare",
        "description": "Spirits that protect the sacred flame"
      },
      {
        "name": "Celestial Hawk",
        "species": "Talonflame / Garudamon / Suzaku",
        "type": "Fire/Flying",
        "rarity": "Rare",
        "description": "Divine birds that circle the sacred pyre"
      }
    ],
    "resources": [
      {
        "name": "Divine Flames",
        "rarity": "Extreme",
        "description": "Sacred fire that purifies and blesses"
      },
      {
        "name": "Blessed Ashes",
        "rarity": "Rare",
        "description": "Ashes from the eternal sacred fire"
      },
      {
        "name": "Spiritual Energy",
        "rarity": "Rare",
        "description": "Raw divine power emanating from the pyre"
      }
    ],
    "lore": "The Sacred Pyre is believed to be the earthly manifestation of the fire spirit's divine presence. The fire has burned since the beginning of time and will continue until the end of the world.",
    "history": "The pyre has existed since ancient times, possibly created by ancient spirits themselves. It serves as the most sacred site in all of Agni Peaks.",
    "dangers": [
      "Divine fire that burns the unworthy",
      "Extreme temperatures",
      "Spiritual trials",
      "Altitude and heat combination",
      "Divine judgment"
    ],
    "tips": [
      "Undergo purification first",
      "Bring blessed protection",
      "Approach with pure intentions",
      "Respect the sacred site",
      "Prepare for spiritual transformation"
    ],
    "description": "Ancient ceremonial site featuring a massive sacred fire that burns atop the highest peak, visible for miles and serving as a beacon for spiritual pilgrims.",
    "mapCoordinates": {
      "x": 35,
      "y": 60,
      "width": 20,
      "height": 18
    }
  },

  'sacred-vapors': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "oracles-sanctum",
    "regionName": "Oracle's Sanctum",
    "welcomeMessages": {
      "base": "You descend into the Sacred Vapors where mineral mists thicken prophetic focus.",
      "variations": [
        "Condensed droplets refract prism runes in the air.",
        "A low humming chant resonates through vapor columns.",
        "Heat pulses cause visions to ripple across cave walls."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Fairy",
        "Fire"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 65,
      "max": 100
    },
    "agroRange": {
      "min": 55,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Vapor Rite Seal"
    },
    "specialEncounters": [
      {
        "type": "vision_overflow",
        "chance": 0.22,
        "description": "Intense vapor surge crystallizes a rare Psychic hybrid."
      },
      {
        "type": "condensate_glimmer",
        "chance": 0.1,
        "description": "Glimmer pockets heighten Fairy resonance."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/sacred-vapors-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Subterranean fumerole galleries",
    "temperature": "92°F humid (vent peaks 120°F)",
    "weatherPatterns": "Pulse mist billows, condensate drip rhythms",
    "accessibility": "Guided descent with vapor ward mask",
    "recommendedLevel": "70-95",
    "specialFeatures": [
      "Trance Vapor Pools",
      "Echo Vision Chambers",
      "Geode Resonance Walls",
      "Temporal Pulse Fissures"
    ],
    "wildlife": [
      {
        "name": "Mist Seerling",
        "species": "Spoink / Candlemon / Teafant",
        "type": "Psychic/Fire",
        "rarity": "Common",
        "description": "Bobs over vents absorbing focused fumes."
      },
      {
        "name": "Vapor Oracle",
        "species": "Grumpig / Wisemon / Katress",
        "type": "Psychic",
        "rarity": "Uncommon",
        "description": "Stabilizes volatile vision currents."
      },
      {
        "name": "Quartz Wisp",
        "species": "Chimecho / Solarmon / Petallia",
        "type": "Psychic/Fairy",
        "rarity": "Rare",
        "description": "Resonates with crystalline chamber frequencies."
      }
    ],
    "resources": [
      {
        "name": "Condensed Prophecy Dew",
        "rarity": "Rare",
        "description": "Collected from cooled stalactite drip cycles."
      },
      {
        "name": "Vapor Geode Fragment",
        "rarity": "Uncommon",
        "description": "Enhances clarity in scrying apparatus."
      },
      {
        "name": "Thermal Salt Crust",
        "rarity": "Common",
        "description": "Base reagent moderating trance volatility."
      }
    ],
    "lore": "Sages claim overlapping destinies precipitate as mist stratification here.",
    "history": "Discovered after seismic shift opened lower vent lattice.",
    "dangers": [
      "Hyper-vision overload",
      "Heat exhaustion",
      "Steam pocket bursts"
    ],
    "tips": [
      "Limit continuous exposure",
      "Hydrate aggressively",
      "Anchor with focus talisman"
    ],
    "description": "Geothermal trance caverns where shimmering prophetic mists heighten multi-thread perception.",
    "mapCoordinates": {
      "x": 20,
      "y": 70,
      "width": 25,
      "height": 20
    }
  },

  'serpent-pyramid': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "quetzal-winds",
    "regionName": "Quetzal Winds",
    "welcomeMessages": {
      "base": "Welcome to the Serpent Pyramid—feathered coils of wind and rite.",
      "variations": [
        "Step tiers breathe like lungs; chants ride the thermals.",
        "Shadow of the serpent sweeps noon—make a wish, then hold onto something.",
        "Plume banners crackle; the air’s already halfway to music."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Dragon",
        "Fairy",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Plumed Serpent Sigil"
    },
    "specialEncounters": [
      {
        "type": "wind_ascension",
        "chance": 0.22,
        "description": "Tier rites spawn elite Flying/Dragon custodians with gale boons."
      },
      {
        "type": "plume_alignment",
        "chance": 0.1,
        "description": "Feather pennants sync—rare Fairy/Grass herald descends."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/serpent-pyramid-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "4000 ft",
    "temperature": "50°F to 75°F",
    "weatherPatterns": "Divine wind phenomena, feathered serpent manifestations",
    "accessibility": "Extreme sacred site - priests and proven devotees only",
    "recommendedLevel": "90+",
    "specialFeatures": [
      "Divine Quetzalcoatl Temple",
      "Feathered Serpent Power",
      "Wind Magic Amplification",
      "Sacred Ceremonies",
      "Divine Manifestations"
    ],
    "wildlife": [
      {
        "name": "Feathered Serpent God",
        "species": "Rayquaza / Seraphimon",
        "type": "Flying/Dragon",
        "rarity": "Extreme",
        "description": "Quetzalcoatl himself in his full divine glory"
      },
      {
        "name": "Temple Guardian",
        "species": "Salamence / WarGreymon / Jetragon",
        "type": "Flying/Fighting",
        "rarity": "Rare",
        "description": "Divine protectors of the sacred pyramid"
      },
      {
        "name": "Wind Priest",
        "species": "Alakazam / Wisemon",
        "type": "Psychic/Flying",
        "rarity": "Rare",
        "description": "Human servants blessed with flight"
      }
    ],
    "resources": [
      {
        "name": "Divine Wind Magic",
        "rarity": "Extreme",
        "description": "Ultimate mastery of air and sky power"
      },
      {
        "name": "Serpent Wisdom",
        "rarity": "Extreme",
        "description": "Ancient knowledge from Quetzalcoatl"
      },
      {
        "name": "Sacred Wind Stones",
        "rarity": "Rare",
        "description": "Stones that channel divine wind power"
      }
    ],
    "lore": "The Serpent Pyramid is the most sacred site of Quetzalcoatl worship, where the feathered serpent god reveals his greatest mysteries to worthy devotees.",
    "history": "Built by the greatest Aztec architects under divine guidance, the pyramid serves as a bridge between earth and sky, mortality and divinity.",
    "dangers": [
      "Direct divine presence",
      "Overwhelming wind magic",
      "Divine trials and judgment",
      "Feathered serpent tests",
      "Sacred site violations"
    ],
    "tips": [
      "Complete extensive spiritual preparation",
      "Study Quetzalcoatl mythology thoroughly",
      "Prove devotion through service",
      "Approach with utmost reverence",
      "Be prepared for divine transformation"
    ],
    "description": "Massive step pyramid dedicated to Quetzalcoatl, where the feathered serpent's power is strongest and wind magic reaches its most potent form during ceremonies.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 18,
      "height": 20
    }
  },

  'shadow-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "ravens-shadow",
    "regionName": "Raven's Shadow",
    "welcomeMessages": {
      "base": "You enter Shadow Village where silhouettes stretch and whisper oblique counsel.",
      "variations": [
        "Divergent shadows detach briefly then realign.",
        "Low caws punctuate shifting canopy twilight.",
        "Lanternless alleys remain inexplicably lit."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "Perfect",
        "C",
        "B",
        "A"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 30,
      "max": 80
    },
    "agroRange": {
      "min": 25,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "shadow_detachment",
        "chance": 0.19,
        "description": "Detached shadow forms a Dark/Ghost hybrid."
      },
      {
        "type": "raven_enigma",
        "chance": 0.1,
        "description": "Riddle exchange boosts Dark encounter tier."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/shadow-village-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Twilight hollow basin",
    "temperature": "38°F to 56°F",
    "weatherPatterns": "Residual auric haze, flicker shade pulses",
    "accessibility": "Shadow rite induction",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Living Shadow Archives",
      "Echo Whisper Alleys",
      "Gloom Ink Scriptorium",
      "Raven Effigy Watchposts"
    ],
    "wildlife": [
      {
        "name": "Shade Prowler",
        "species": "Poochyena / Sangloupmon / Vixy",
        "type": "Dark",
        "rarity": "Common",
        "description": "Tracks moving light seams for patrol routes."
      },
      {
        "name": "Whisper Corvid",
        "species": "Honchkrow / Ravemon / Galeclaw",
        "type": "Dark/Flying",
        "rarity": "Uncommon",
        "description": "Carries encoded dusk rune fragments."
      },
      {
        "name": "Void Scribe",
        "species": "Banette / Phantomon / Katress",
        "type": "Ghost/Dark",
        "rarity": "Rare",
        "description": "Inscribes secrets into shadow vellum."
      }
    ],
    "resources": [
      {
        "name": "Gloom Ink Vial",
        "rarity": "Rare",
        "description": "Writing medium that resists illumination tampering."
      },
      {
        "name": "Shadow Bark Slab",
        "rarity": "Uncommon",
        "description": "Absorptive tablet storing whispered data."
      },
      {
        "name": "Feather Scrip",
        "rarity": "Common",
        "description": "Inscribing quill from dusk corvid plumage."
      }
    ],
    "lore": "Ravens teach that truth emerges sharper when carved from layered obscurity.",
    "history": "Formed after migrating dusk currents stabilized over basin.",
    "dangers": [
      "Light source suppression",
      "Echo disorientation",
      "Shadow mimic lures"
    ],
    "tips": [
      "Carry dual-spectrum lamp",
      "Log coordinates frequently",
      "Ignore unsourced whisper prompts"
    ],
    "description": "Whispering hamlet where elongated sentient silhouettes archive secret lore along dusk walls.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 18,
      "height": 16
    }
  },

  'shooting-star': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "aurora-heights",
    "regionName": "Aurora Heights",
    "welcomeMessages": {
      "base": "High altitude winds bite at Shooting Star Peak where meteors thread luminous arcs.",
      "variations": [
        "Fragments hiss into crystal catchment nets.",
        "Auroral bands fold around observation spires.",
        "Thin air vibrates with stellar resonance."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Ice",
        "Fairy"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 70,
      "max": 100
    },
    "agroRange": {
      "min": 60,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Celestial Catch Permit"
    },
    "specialEncounters": [
      {
        "type": "meteor_convergence",
        "chance": 0.23,
        "description": "Simultaneous streaks spawn rare stellar hybrid."
      },
      {
        "type": "aurora_focus",
        "chance": 0.12,
        "description": "Focused aurora ring enhances Psychic synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/shooting-star-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "19,400 ft summit ridge",
    "temperature": "-30°F to 5°F",
    "weatherPatterns": "Meteor trails, ionized spark snow, rare calm windows",
    "accessibility": "Meteor updraft timing or teleport sigil",
    "recommendedLevel": "100-120",
    "specialFeatures": [
      "Star Catching Nets",
      "Cosmic Energy Conduits",
      "Meteorite Collection Craters",
      "Sky Magic Crucibles"
    ],
    "wildlife": [
      {
        "name": "Meteor Sprite",
        "species": "Minior / Solarmon / Foxparks",
        "type": "Rock/Fairy",
        "rarity": "Common",
        "description": "Descends in protective shells before bursting into light."
      },
      {
        "name": "Comet Strider",
        "species": "Absol / Phantomon / Jetragon",
        "type": "Dark/Psychic",
        "rarity": "Uncommon",
        "description": "Tracks incoming stellar debris trajectories."
      },
      {
        "name": "Star Core Seraph",
        "species": "Deoxys / Angewomon / Celaray",
        "type": "Psychic/Fairy",
        "rarity": "Rare",
        "description": "Stabilizes volatile cosmic energy nodes."
      }
    ],
    "resources": [
      {
        "name": "Cosmic Energy Fragment",
        "rarity": "Rare",
        "description": "Pulses with residual stellar charge."
      },
      {
        "name": "Meteor Alloy Shard",
        "rarity": "Uncommon",
        "description": "Durable high-impact reinforcement material."
      },
      {
        "name": "Ion Snow Sample",
        "rarity": "Common",
        "description": "Charged particulate used in cold infusion rituals."
      }
    ],
    "lore": "Peak aligns with seasonal meteor streams maximizing harvest yield.",
    "history": "First nets woven from aurora silk arrays anchored by prism pylons.",
    "dangers": [
      "Meteor impact shock",
      "Radiation flares",
      "Severe altitude sickness"
    ],
    "tips": [
      "Monitor meteor path charts",
      "Use reinforced netting",
      "Carry oxygen infusion vials"
    ],
    "description": "Highest peak where falling stars are caught and their cosmic energy harvested for sky magic.",
    "mapCoordinates": {
      "x": 45,
      "y": 65,
      "width": 20,
      "height": 25
    }
  },

  'silk-library': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "anansi-woods",
    "regionName": "Anansi Woods",
    "welcomeMessages": {
      "base": "You step into the Silk Library where crystalline webs archive luminous narrative threads.",
      "variations": [
        "Indexing drones reweave damaged pattern spines.",
        "Story glyphs crawl slowly along tension lines.",
        "Dust motes settle forming transient chapter headings."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "Adult",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 18,
      "max": 55
    },
    "agroRange": {
      "min": 15,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "chapter_unfurl",
        "chance": 0.19,
        "description": "New silk chapter attracts rare narrative guardians."
      },
      {
        "type": "sap_illumination",
        "chance": 0.09,
        "description": "Glowing sap reveals a hidden Bug/Fairy hybrid."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/silk-library-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Multi-tier canopy lattice",
    "temperature": "70°F constant humidity",
    "weatherPatterns": "Soft dew condensation cycles",
    "accessibility": "Silk lift platforms & web bridges",
    "recommendedLevel": "30-60",
    "specialFeatures": [
      "Crystalline Web Stacks",
      "Narrative Spindle Scriptorium",
      "Resonance Index Cocoon",
      "Silk Preservation Vaults"
    ],
    "wildlife": [
      {
        "name": "Index Weaver",
        "species": "Joltik / Tentomon / Teafant",
        "type": "Bug/Electric",
        "rarity": "Common",
        "description": "Maintains static-charged catalog threads."
      },
      {
        "name": "Archivist Moth",
        "species": "Dustox / Butterfreemon / Lumira",
        "type": "Bug/Psychic",
        "rarity": "Uncommon",
        "description": "Memorizes rune patterns for damaged scroll replacement."
      },
      {
        "name": "Crystal Brood",
        "species": "Shuckle / Crystamon / Gumoss",
        "type": "Bug/Rock",
        "rarity": "Rare",
        "description": "Infuses silk with mineral clarity layers."
      }
    ],
    "resources": [
      {
        "name": "Memory Filament",
        "rarity": "Rare",
        "description": "Thread capturing sequential narrative intent."
      },
      {
        "name": "Indexed Spool",
        "rarity": "Uncommon",
        "description": "Pre-sorted silk cluster easing transcription."
      },
      {
        "name": "Dust Silk Floss",
        "rarity": "Common",
        "description": "Fine repair fiber for damaged panels."
      }
    ],
    "lore": "Legends say every told story echoes here as a faint phosphor strand.",
    "history": "Expanded after convergence of three elder loom clusters formed stable lattice.",
    "dangers": [
      "Static discharge arcs",
      "Adhesive over-saturation",
      "Disorientation in mirrored aisles"
    ],
    "tips": [
      "Carry anti-stick talc",
      "Mark return anchor nodes",
      "Limit filament exposure sessions"
    ],
    "description": "Vast suspended archive where crystalline web stacks preserve luminous woven manuscripts.",
    "mapCoordinates": {
      "x": 20,
      "y": 70,
      "width": 30,
      "height": 25
    }
  },

  'skull-rock': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "pirates-bay",
    "regionName": "Pirates' Bay",
    "welcomeMessages": {
      "base": "Welcome to Skull Rock—maze of teeth, whisper of reefs.",
      "variations": [
        "Waves grin through sockets; the tide loves jump-scares.",
        "Charts curl at the edges—like they know what’s coming.",
        "If a gull laughs, consider turning around."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Dark",
        "Rock",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 45,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Reefchart Medallion"
    },
    "specialEncounters": [
      {
        "type": "reef_mirage",
        "chance": 0.22,
        "description": "Shifting channels lure rare Dark/Water raiders to ambush."
      },
      {
        "type": "skull_echo",
        "chance": 0.1,
        "description": "Cavern howl summons a Rock/Ghost sentinel from the jawline."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/skull-rock-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "0 ft - 200 ft",
    "temperature": "70°F to 80°F",
    "weatherPatterns": "Unpredictable winds, dangerous currents, fog banks",
    "accessibility": "Extremely dangerous maritime navigation required",
    "recommendedLevel": "75+",
    "specialFeatures": [
      "Skull-Shaped Formation",
      "Pirate Trap System",
      "Hidden Reefs",
      "Shipwreck Graveyard",
      "Treacherous Waters",
      "Ancient Pirate Execution Site"
    ],
    "wildlife": [
      {
        "name": "Ghost Ship",
        "species": "Drifblim / Maraith",
        "type": "Ghost/Water",
        "rarity": "Extreme",
        "description": "Spectral vessels that rise from the depths to claim new victims for their cursed crews"
      },
      {
        "name": "Skeleton Crew",
        "species": "Marowak / Tombat / Bushi",
        "type": "Ghost/Ground",
        "rarity": "Rare",
        "description": "Undead pirates who guard the rock and lure ships to their doom"
      },
      {
        "name": "Reef Wraith",
        "species": "Jellicent / Relaxaurus",
        "type": "Water/Ghost",
        "rarity": "Uncommon",
        "description": "Malevolent spirits of drowned sailors that inhabit the coral formations"
      },
      {
        "name": "Doom Gull",
        "species": "Pelipper / Nitocris / Galeclaw",
        "type": "Flying/Dark",
        "rarity": "Common",
        "description": "Ominous seabirds whose cries herald approaching storms and disasters"
      }
    ],
    "resources": [
      {
        "name": "Sunken Treasure",
        "rarity": "Extreme",
        "description": "Valuable cargo from hundreds of wrecked ships over the centuries"
      },
      {
        "name": "Cursed Artifacts",
        "rarity": "Rare",
        "description": "Dangerous magical items that carry the weight of pirate curses and vengeance"
      },
      {
        "name": "Nautical Relics",
        "rarity": "Uncommon",
        "description": "Ancient navigation instruments and ship components from legendary vessels"
      },
      {
        "name": "Ghost Pearls",
        "rarity": "Rare",
        "description": "Ethereal pearls formed by the tears of drowned sailors, said to grant visions of the past"
      }
    ],
    "lore": "Skull Rock has claimed more ships than any other natural formation in the known world. Pirates use its treacherous waters as an execution ground and a test of navigational skill, believing that those who can survive its waters are truly worthy of the pirate life.",
    "history": "For over 800 years, Skull Rock has been both feared and revered by pirates. Countless execution ceremonies, treasure hunts, and initiation rites have taken place in its shadow, adding to its supernatural reputation.",
    "dangers": [
      "Hidden reefs that destroy hulls",
      "Supernatural phenomena",
      "Cursed treasure guardians",
      "Unpredictable weather patterns",
      "Ghost ship encounters",
      "Psychological terror effects",
      "Magnetic anomalies affecting navigation"
    ],
    "tips": [
      "Only attempt passage during perfect weather",
      "Bring experienced supernatural protection",
      "Study historical wreck patterns",
      "Never dive alone for treasure",
      "Respect the spirits of the drowned",
      "Consider the rock cursed and act accordingly",
      "Have multiple escape routes planned"
    ],
    "description": "A treacherous rock formation that serves as a pirate trap, where many a ship has met its end. The skull-shaped rock formation is both a natural landmark and a deadly maze of hidden reefs.",
    "mapCoordinates": {
      "x": 50,
      "y": 40,
      "width": 25,
      "height": 20
    }
  },

  'sky-harbor': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "storm-belt",
    "regionName": "Storm Belt",
    "welcomeMessages": {
      "base": "You arrive at Sky Harbor where windborne vessels dock on braids of compressed air.",
      "variations": [
        "Sail gliders pivot to face shifting jet streams.",
        "Cargo cranes swivel using sustained updraft torsion.",
        "Signal kites flash threaded lightning codes."
      ]
    },
    "battleParameters": {
      "weather": "wind",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Electric",
        "Steel"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 50,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Aerial Docking Pass"
    },
    "specialEncounters": [
      {
        "type": "jetstream_alignment",
        "chance": 0.21,
        "description": "Aligned currents spawn rare Flying/Electric hybrid."
      },
      {
        "type": "harbor_signal_event",
        "chance": 0.11,
        "description": "Signal flare attracts steel-plated courier."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/sky-harbor-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "11,400 ft",
    "temperature": "25°F to 45°F",
    "weatherPatterns": "Layered slipstream corridors, scheduled downdraft windows",
    "accessibility": "Licensed flight clearance",
    "recommendedLevel": "65-90",
    "specialFeatures": [
      "Aerial Dock Platforms",
      "Wind Vessel Repair Gantries",
      "Slipstream Control Tower",
      "Feather Beacon Grid"
    ],
    "wildlife": [
      {
        "name": "Harbor Glider",
        "species": "Wingull / Peckmon / Galeclaw",
        "type": "Flying/Water",
        "rarity": "Common",
        "description": "Guides incoming craft through slip lanes."
      },
      {
        "name": "Beacon Wisp",
        "species": "Lampent / Candlemon / Lumoth",
        "type": "Ghost/Fire",
        "rarity": "Uncommon",
        "description": "Maintains luminous navigation pylons."
      },
      {
        "name": "Dock Sentinel",
        "species": "Skarmory / Guardromon / MetalGarurumon",
        "type": "Flying/Steel",
        "rarity": "Rare",
        "description": "Patrols for structural strain micro-fractures."
      }
    ],
    "resources": [
      {
        "name": "Slipstream Chart Fragment",
        "rarity": "Rare",
        "description": "Improves travel efficiency between sky hubs."
      },
      {
        "name": "Feather Beacon Lens",
        "rarity": "Uncommon",
        "description": "Amplifies directional signal clarity."
      },
      {
        "name": "Cloudfast Resin",
        "rarity": "Common",
        "description": "Sealant stabilizing solid-air seams."
      }
    ],
    "lore": "Harbor harmonics align with migrating jet patterns to reduce turbulence.",
    "history": "Expanded after tri-lane congestion studies introduced beacon grid optimization.",
    "dangers": [
      "Crosslane collisions",
      "Downdraft loss of lift",
      "Signal desync"
    ],
    "tips": [
      "File flight plans early",
      "Check beacon sync pulses",
      "Secure cargo to anti-slip rings"
    ],
    "description": "Aerial docking nexus of solidified air platforms coordinating wind vessel traffic and migratory flock lanes.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 22,
      "height": 18
    }
  },

  'starlight-observatory': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "aurora-heights",
    "regionName": "Aurora Heights",
    "welcomeMessages": {
      "base": "You enter the Starlight Observatory where crystal arrays track shifting constellations.",
      "variations": [
        "Lens facets rotate silently correcting parallax.",
        "Star maps overlay real sky in translucent grids.",
        "Meteor dust settles onto calibration pedestals."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Ice",
        "Fairy"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 65,
      "max": 100
    },
    "agroRange": {
      "min": 55,
      "max": 90
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Star Chart Key"
    },
    "specialEncounters": [
      {
        "type": "constellation_focus",
        "chance": 0.22,
        "description": "Peak alignment spawns rare Psychic hybrid."
      },
      {
        "type": "aurora_lens_refraction",
        "chance": 0.1,
        "description": "Refraction event boosts Ice/Fairy synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/starlight-observatory-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "18,600 ft",
    "temperature": "-20°F to 10°F",
    "weatherPatterns": "Stable polar stratosphere, auroral arcs, thin frost haze",
    "accessibility": "High-altitude glide or star current spiral",
    "recommendedLevel": "95-115",
    "specialFeatures": [
      "Celestial Observation Decks",
      "Star Communion Chamber",
      "Cosmic Prediction Array",
      "Crystal Telescopes"
    ],
    "wildlife": [
      {
        "name": "Aurora Wisp",
        "species": "Solosis / Candlemon / Chillet",
        "type": "Psychic/Ice",
        "rarity": "Common",
        "description": "Drifts through lens housings refracting starlight."
      },
      {
        "name": "Cosmic Seer",
        "species": "Beheeyem / Wisemon / Katress",
        "type": "Psychic",
        "rarity": "Uncommon",
        "description": "Charts orbital resonance patterns nightly."
      },
      {
        "name": "Prism Drake",
        "species": "Latios / Pteramon / Jetragon",
        "type": "Psychic/Dragon",
        "rarity": "Rare",
        "description": "Circles apex spire amplifying telescope clarity."
      }
    ],
    "resources": [
      {
        "name": "Starlight Essence",
        "rarity": "Rare",
        "description": "Condensed photon lattice enhancing focus gear."
      },
      {
        "name": "Aurora Crystal Shard",
        "rarity": "Uncommon",
        "description": "Refractive fragment stabilizing spell channels."
      },
      {
        "name": "Frost Lens Ring",
        "rarity": "Common",
        "description": "Cold-forged ring mounting minor optics."
      }
    ],
    "lore": "Built where auroral nodes converge, amplifying celestial signal clarity.",
    "history": "Expanded after crystal lattice allowed multi-spectrum scanning.",
    "dangers": [
      "Hypoxia",
      "Lens frost fractures",
      "Cosmic glare exposure"
    ],
    "tips": [
      "Use full thermal gear",
      "Limit continuous star trance",
      "Shield eyes during flare events"
    ],
    "description": "Crystal observatory where sky astronomers study celestial movements and commune with star Monsters.",
    "mapCoordinates": {
      "x": 35,
      "y": 30,
      "width": 25,
      "height": 20
    }
  },

  'stonehenge-site': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "stoneheart-cliffs",
    "regionName": "Stoneheart Cliffs",
    "welcomeMessages": {
      "base": "Standing monoliths loom at the Stonehenge Site aligning with pulsing celestial nodes.",
      "variations": [
        "Shadow lengths synchronize across disparate stones.",
        "Subsonic vibrations travel through ring lintels.",
        "Glyph flares trace orbital computations."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Psychic"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "A"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 55,
      "max": 95
    },
    "agroRange": {
      "min": 50,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Druidic Alignment Rod"
    },
    "specialEncounters": [
      {
        "type": "solstice_alignment",
        "chance": 0.2,
        "description": "Alignment pulses spawn rare Rock/Psychic hybrid."
      },
      {
        "type": "ring_resonance",
        "chance": 0.1,
        "description": "Resonance wave elevates encounter quality."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/stonehenge-site-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "High plateau ring",
    "temperature": "45°F to 62°F",
    "weatherPatterns": "Celestial alignment glow, rhythmic wind pulses",
    "accessibility": "Runic path convergence at solstice markers",
    "recommendedLevel": "85-110",
    "specialFeatures": [
      "Astronomical Calendar Stones",
      "Realm Gateway Nexus",
      "Megalithic Alignment Beams",
      "Celestial Resonance Channels"
    ],
    "wildlife": [
      {
        "name": "Rune Sentry",
        "species": "Baltoy / Guardromon / Dumud",
        "type": "Rock/Psychic",
        "rarity": "Common",
        "description": "Rotates to maintain minor ley adjustments."
      },
      {
        "name": "Alignment Wisp",
        "species": "Solrock / Wisemon / Petallia",
        "type": "Rock/Psychic",
        "rarity": "Uncommon",
        "description": "Flares during peak stellar harmonics."
      },
      {
        "name": "Gate Herald",
        "species": "Claydol / Angewomon / Paladius",
        "type": "Rock/Fairy",
        "rarity": "Rare",
        "description": "Stabilizes transient realm thresholds."
      }
    ],
    "resources": [
      {
        "name": "Resonant Megalith Chip",
        "rarity": "Rare",
        "description": "Channel fragment amplifying ritual precision."
      },
      {
        "name": "Alignment Dust",
        "rarity": "Uncommon",
        "description": "Fine particulate settling during nexus shifts."
      },
      {
        "name": "Runic Lichen Patch",
        "rarity": "Common",
        "description": "Glow lichen aiding low-light readings."
      }
    ],
    "lore": "Legends claim the first island epoch reset was triggered here under triple eclipse.",
    "history": "Excavated partially—deeper sub-ring layers remain sealed by harmonic locks.",
    "dangers": [
      "Temporal disorientation",
      "Ley field surges",
      "Portal instability"
    ],
    "tips": [
      "Enter only at stable intervals",
      "Carry chronometer charms",
      "Avoid standing in beam paths"
    ],
    "description": "Massive stone circle that serves as an astronomical calendar and gateway to other realms.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 20,
      "height": 18
    }
  },

  'storm-dance-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to Storm Dance Village—feet drum, clouds answer.",
      "variations": [
        "Prayer fans flutter lightning-quick; the air keeps tempo.",
        "Totem poles hum with sky song; offer respect and decent footwork.",
        "If thunder claps on beat, you’re invited."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Ground"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 10,
      "max": 19
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "rainstep_ritual",
        "chance": 0.22,
        "description": "Dance rite boosts Electric/Flying spawns with rhythm boons."
      },
      {
        "type": "totem_trial",
        "chance": 0.12,
        "description": "Ground totem awakens a rare Ground/Electric warden."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/storm-dance-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "6500 ft",
    "temperature": "40°F to 70°F",
    "weatherPatterns": "Ceremonial storms, rhythmic thunder, spiritual energy",
    "accessibility": "Cultural respect required, ceremony participants welcome",
    "recommendedLevel": "45+",
    "specialFeatures": [
      "Sacred Storm Dances",
      "Shamanic Rituals",
      "Thunder Drums",
      "Spirit Communication",
      "Traditional Ceremonies"
    ],
    "wildlife": [
      {
        "name": "Spirit Eagle",
        "species": "Altaria / Angemon / Tengu",
        "type": "Flying/Psychic",
        "rarity": "Rare",
        "description": "Sacred eagles that participate in ceremonies"
      },
      {
        "name": "Thunder Elk",
        "species": "Sawsbuck / Monochromon / Raiju",
        "type": "Electric/Normal",
        "rarity": "Uncommon",
        "description": "Majestic elk whose antlers spark with electricity"
      },
      {
        "name": "Dance Bear",
        "species": "Ursaring / Grizzmon / Yamabiko",
        "type": "Normal/Fighting",
        "rarity": "Uncommon",
        "description": "Bears that join in the traditional ceremonies"
      }
    ],
    "resources": [
      {
        "name": "Sacred Medicine",
        "rarity": "Rare",
        "description": "Traditional herbs used in shamanic healing"
      },
      {
        "name": "Thunder Drums",
        "rarity": "Rare",
        "description": "Drums that resonate with storm energy"
      },
      {
        "name": "Ceremonial Feathers",
        "rarity": "Uncommon",
        "description": "Feathers blessed in storm dances"
      }
    ],
    "lore": "Storm Dance Village preserves the ancient traditions of communicating with the Thunderbird through sacred dances that mirror the movement of storms and the flight of the great spirit.",
    "history": "Founded by shamans who first learned to speak with the Thunderbird. The village has maintained these sacred traditions for generations.",
    "dangers": [
      "Powerful spiritual energy",
      "Ceremonial restrictions",
      "Weather changes during rituals",
      "Cultural misunderstandings"
    ],
    "tips": [
      "Learn about Native American customs",
      "Participate respectfully in ceremonies",
      "Bring appropriate offerings",
      "Follow shamanic guidance",
      "Honor the sacred traditions"
    ],
    "description": "Traditional Native American village where shamans perform sacred storm dances to communicate with the Thunderbird and ensure balance between earth and sky.",
    "mapCoordinates": {
      "x": 15,
      "y": 30,
      "width": 18,
      "height": 15
    }
  },

  'storm-district': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "nimbus-capital",
    "regionName": "Nimbus Capital",
    "welcomeMessages": {
      "base": "Welcome to the Storm District—commerce on a live wire.",
      "variations": [
        "Arc lamps blink deals-per-minute; bring exact change and insulation.",
        "Wind-forged stalls rattle like good omens.",
        "Receipts are heat-printed by lightning. Eco-friendly? Ish."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Storm Market Writ"
    },
    "specialEncounters": [
      {
        "type": "grid_flash_sale",
        "chance": 0.22,
        "description": "Overcharge event spawns elite Electric/Steel with haste boons."
      },
      {
        "type": "thermal_updraft",
        "chance": 0.1,
        "description": "A perfect lift draws a rare Flying/Electric courier."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/storm-district-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "10,000 ft",
    "temperature": "30°F to 50°F",
    "weatherPatterns": "Controlled lightning, wind currents",
    "accessibility": "Commerce permit required",
    "recommendedLevel": "70+",
    "specialFeatures": [
      "Lightning Power",
      "Sky Markets",
      "Wind Forges",
      "Storm Commerce"
    ],
    "wildlife": [
      {
        "name": "Storm Merchant",
        "species": "Magnezone / Andromon / Sparkit",
        "type": "Electric/Flying",
        "rarity": "Uncommon",
        "description": "Traders who harness storm energy"
      },
      {
        "name": "Lightning Courier",
        "species": "Jolteon / Elecmon",
        "type": "Electric",
        "rarity": "Common",
        "description": "Fast messengers powered by electricity"
      },
      {
        "name": "Thunder Bird",
        "species": "Zapdos / Birddramon / Beakon",
        "type": "Electric/Flying",
        "rarity": "Rare",
        "description": "Majestic birds that channel lightning"
      }
    ],
    "resources": [
      {
        "name": "Storm Silk",
        "rarity": "Rare",
        "description": "Fabric woven from controlled lightning"
      }
    ],
    "lore": "The commercial heart of the sky kingdom.",
    "history": "Established as the main trading hub of Nimbus Capital.",
    "dangers": [
      "Electrical discharge",
      "Wind shear"
    ],
    "tips": [
      "Carry storm insurance",
      "Learn sky merchant customs"
    ],
    "description": "Commercial district powered by controlled lightning, where sky merchants trade wind-forged goods.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 25,
      "height": 20
    }
  },

  'storm-riders': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "tempest-zones",
    "regionName": "Tempest Zones",
    "welcomeMessages": {
      "base": "Roaring currents circle the Storm Riders Outpost perched at the edge of stacked thunderheads.",
      "variations": [
        "Lightning lattices stitch between anchor pylons.",
        "Pressure drops trigger alarm wind chimes.",
        "Training kites dance sparking ion trails."
      ]
    },
    "battleParameters": {
      "weather": "thunderstorm",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 70,
      "max": 100
    },
    "agroRange": {
      "min": 60,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Storm Rider License"
    },
    "specialEncounters": [
      {
        "type": "lightning_chain_event",
        "chance": 0.23,
        "description": "Chain strikes spawn rare Electric hybrid."
      },
      {
        "type": "eye_of_tempest",
        "chance": 0.12,
        "description": "Eye formation boosts Flying/Steel synergy."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/storm-riders-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "15,200 ft storm shelf",
    "temperature": "5°F to 25°F (wind chill -30°F)",
    "weatherPatterns": "Cross-shear gust corridors, harmonic thunder roll cycles",
    "accessibility": "Grapple glide / vortex thermal ascent",
    "recommendedLevel": "90-110",
    "specialFeatures": [
      "Wind Shear Simulators",
      "Lightning Rod Array Grid",
      "Jet Stream Cartography Deck",
      "Magnetic Anchor Platforms"
    ],
    "wildlife": [
      {
        "name": "Gale Strider",
        "species": "Emolga / Peckmon / Jetragon",
        "type": "Electric/Flying",
        "rarity": "Uncommon",
        "description": "Draft-rides between rod arrays testing turbulence."
      },
      {
        "name": "Ion Drakelet",
        "species": "Axew / Raidramon / Sparkit",
        "type": "Dragon/Electric",
        "rarity": "Rare",
        "description": "Practices charge cycling along spire peaks."
      },
      {
        "name": "Storm Scout",
        "species": "Rotom / Kokuwamon / Boltmane",
        "type": "Electric/Ghost",
        "rarity": "Common",
        "description": "Logs micro-current fluctuations for route charts."
      }
    ],
    "resources": [
      {
        "name": "Jet Stream Chart",
        "rarity": "Rare",
        "description": "Refines aerial navigation efficiency."
      },
      {
        "name": "Insulated Cable Weave",
        "rarity": "Uncommon",
        "description": "Flexible conductor harnessing stable charge."
      },
      {
        "name": "Spire Basalt Core",
        "rarity": "Common",
        "description": "Dense grounding material for storm gear."
      }
    ],
    "lore": "Outpost founded to tame fractal storm lanes for long-range traversal.",
    "history": "Expanded after successful mapping of triple shear corridor.",
    "dangers": [
      "Anchor line snapback",
      "Unpredicted vortex collapse",
      "Overcharge stun"
    ],
    "tips": [
      "Clip dual anchors always",
      "Monitor rod saturation gauges",
      "Abort runs at violet flux warning"
    ],
    "description": "High-wind training nexus perched on insulated basalt spires where elite riders map chaotic jet streams.",
    "mapCoordinates": {
      "x": 20,
      "y": 55,
      "width": 22,
      "height": 18
    }
  },

  'story-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "anansi-woods",
    "regionName": "Anansi Woods",
    "welcomeMessages": {
      "base": "Welcome to Story Village—spiral webs teaching in concentric chapters.",
      "variations": [
        "Elder weavers tug a strand—the lesson arrives as a breeze.",
        "Tales are braided, not told; listen with your hands.",
        "If a web glows, that’s a footnote meant for you."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Fairy",
        "Dark"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 5,
      "max": 15
    },
    "agroRange": {
      "min": 6,
      "max": 32
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "hearth_circle",
        "chance": 0.22,
        "description": "Dusk circle boosts Bug/Fairy support and lore-drop rates."
      },
      {
        "type": "pattern_riddle",
        "chance": 0.12,
        "description": "A tricky motif summons a rare Dark/Bug guide."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/story-village-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "Lower canopy cradle",
    "temperature": "72°F to 86°F",
    "weatherPatterns": "Dappled mist light, gentle silk mote drift",
    "accessibility": "Primary root ramp & training net paths",
    "recommendedLevel": "10-30",
    "specialFeatures": [
      "Living Web Story Scrolls",
      "Folklore Teaching Circles",
      "Child Weaver Lofts",
      "Night Glow Tale Loom"
    ],
    "wildlife": [
      {
        "name": "Tale Hopper",
        "species": "Venipede / Motimon / Dumud",
        "type": "Bug",
        "rarity": "Common",
        "description": "Hops web to web spreading fresh narrative spores."
      },
      {
        "name": "Silk Tutor",
        "species": "Kricketune / Tentomon / Petallia",
        "type": "Bug/Fairy",
        "rarity": "Uncommon",
        "description": "Guides apprentices weaving first glyph loops."
      },
      {
        "name": "Archive Mender",
        "species": "Araquanid / Waspmon / Lumira",
        "type": "Bug/Water",
        "rarity": "Rare",
        "description": "Repairs frayed lore threads before memory loss."
      }
    ],
    "resources": [
      {
        "name": "Fresh Glyph Strand",
        "rarity": "Common",
        "description": "Newly spun filament ready for encoding."
      },
      {
        "name": "Story Resin Drop",
        "rarity": "Uncommon",
        "description": "Semi-set bead stabilizing looping plots."
      },
      {
        "name": "Memory Pearl Node",
        "rarity": "Rare",
        "description": "Condensed motif cluster enhancing recall."
      }
    ],
    "lore": "Foundational narratives of the woods begin here as simple lattice songs.",
    "history": "Expanded when elder weavers decentralized archive growth.",
    "dangers": [
      "Mild silk entanglement",
      "Attention drift during multitale teaching"
    ],
    "tips": [
      "Attend orientation loom first",
      "Respect pause chime signals",
      "Avoid tugging active threads"
    ],
    "description": "Web-ring hamlet where every spiral strand encodes living folklore taught to initiates at dusk hearth circles.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 18,
      "height": 16
    }
  },

  'summer-court': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "seelie-courts",
    "regionName": "Seelie Courts",
    "welcomeMessages": {
      "base": "Welcome to the Summer Court—eternal solstice and festivals that outlast your stamina.",
      "variations": [
        "Sunlace canopies throw gold over everything—especially your plans.",
        "Light-weavers knit warmth into the air; joy is mandatory.",
        "Smile at the heralds; they outrank the sun here."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fairy",
        "Fire",
        "Grass"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 14,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Solstice Circlet"
    },
    "specialEncounters": [
      {
        "type": "sunweave_revel",
        "chance": 0.22,
        "description": "Festival peak spawns Fairy/Fire elites with radiant boons."
      },
      {
        "type": "greenbloom_pact",
        "chance": 0.1,
        "description": "A living garland calls a rare Grass/Fairy arbiter."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/summer-court-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Sunstone pavilion rise",
    "temperature": "70°F to 88°F",
    "weatherPatterns": "Radiant sun halos, warm petal thermals",
    "accessibility": "Season key bloom gate",
    "recommendedLevel": "75-105",
    "specialFeatures": [
      "Eternal Summer Canopy",
      "Light Festival Courts",
      "Joy Renewal Ceremonies",
      "Sunstone Rapture Altars"
    ],
    "wildlife": [
      {
        "name": "Solstice Sprite",
        "species": "Cleffa / Candlemon / Foxparks",
        "type": "Fairy/Fire",
        "rarity": "Common",
        "description": "Trails radiant sparks during dances."
      },
      {
        "name": "Helio Petaler",
        "species": "Florges / Lilamon / Petallia",
        "type": "Fairy/Grass",
        "rarity": "Uncommon",
        "description": "Conducts bloom synchronization rituals."
      },
      {
        "name": "Sunflare Herald",
        "species": "Rapidash / Angewomon / Jetragon",
        "type": "Fire/Fairy",
        "rarity": "Rare",
        "description": "Announces rite sequences in solar glyphs."
      }
    ],
    "resources": [
      {
        "name": "Sunstone Fragment",
        "rarity": "Rare",
        "description": "Stores condensed festival radiance."
      },
      {
        "name": "Festival Ribbon Strand",
        "rarity": "Uncommon",
        "description": "Woven strip amplifying morale effects."
      },
      {
        "name": "Sol Dew Drop",
        "rarity": "Common",
        "description": "Bright droplet boosting minor healing brews."
      }
    ],
    "lore": "Court believed to anchor cyclical emotional rejuvenation island-wide.",
    "history": "Formed when perennial bloom alignment stabilized ambient warmth.",
    "dangers": [
      "Heat mirage fatigue",
      "Overexposure glare",
      "Rite crowd surges"
    ],
    "tips": [
      "Hydrate frequently",
      "Use glare veils",
      "Respect procession spacing"
    ],
    "description": "Eternal solstice pavilion hosting luminous festivals of renewal, light weaving, and joy rites.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 20,
      "height": 20
    }
  },

  'tapas-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to Tapas Town—discipline in the heat and breath like a bellows.",
      "variations": [
        "Monks pace lava paths barefoot; the lesson is “focus or hop.”",
        "Meditation gongs keep time with vents; thoughts smelt clean.",
        "Tea is strong, advice stronger—hydrate accordingly."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Fire",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "ascetic_trial",
        "chance": 0.22,
        "description": "Endurance rite buffs Fighting/Psychic allies in focused duels."
      },
      {
        "type": "lava_walk",
        "chance": 0.1,
        "description": "A master of heat—rare Fire/Fighting—tests your calm under pressure."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/tapas-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "4500 ft",
    "temperature": "95°F to 125°F",
    "weatherPatterns": "Intense heat, minimal shade",
    "accessibility": "Spiritual seekers and ascetics",
    "recommendedLevel": "55+",
    "specialFeatures": [
      "Ascetic Training",
      "Meditation Caves",
      "Endurance Trials",
      "Spiritual Discipline",
      "Heat Resistance Training"
    ],
    "wildlife": [
      {
        "name": "Desert Sage",
        "species": "Medicham / Wisemon / Anubis",
        "type": "Psychic/Ground",
        "rarity": "Rare",
        "description": "Wise creatures that meditate in the heat"
      },
      {
        "name": "Endurance Lizard",
        "species": "Heliolisk / Agumon / Reptyro",
        "type": "Fire/Rock",
        "rarity": "Common",
        "description": "Reptiles adapted to extreme temperatures"
      },
      {
        "name": "Spirit Eagle",
        "species": "Braviary / Garudamon / Galeclaw",
        "type": "Flying/Psychic",
        "rarity": "Uncommon",
        "description": "Birds that soar above the meditation caves"
      }
    ],
    "resources": [
      {
        "name": "Meditation Stones",
        "rarity": "Uncommon",
        "description": "Heated stones used in spiritual practice"
      },
      {
        "name": "Ascetic Robes",
        "rarity": "Common",
        "description": "Simple clothing designed for heat endurance"
      },
      {
        "name": "Spiritual Texts",
        "rarity": "Rare",
        "description": "Ancient scrolls on meditation and discipline"
      }
    ],
    "lore": "Tapas Town represents the ancient concept of spiritual austerity and self-discipline. The extreme heat serves as a test of willpower and a means to burn away worldly attachments.",
    "history": "Established by wandering ascetics who chose this harsh location to practice the most demanding forms of spiritual discipline. The town attracts serious spiritual seekers.",
    "dangers": [
      "Extreme heat exhaustion",
      "Dehydration",
      "Mental strain from meditation",
      "Isolation challenges",
      "Spiritual intensity"
    ],
    "tips": [
      "Build heat tolerance gradually",
      "Bring adequate water supplies",
      "Practice meditation beforehand",
      "Respect ascetic traditions",
      "Know your physical limits"
    ],
    "description": "Mountain town where ascetics practice intense spiritual discipline and meditation, using the heat of the volcanic region to test their mental and physical limits.",
    "mapCoordinates": {
      "x": 60,
      "y": 20,
      "width": 15,
      "height": 12
    }
  },

  'tellus-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "terra-madre-basin",
    "regionName": "Terra Madre Basin",
    "welcomeMessages": {
      "base": "Welcome to Tellus City—stone that grows, streets that breathe.",
      "variations": [
        "Basalt colonnades bud like flowers; architects here water buildings.",
        "Quarries sing work songs—the walls harmonize.",
        "Lay a hand on the arch—feel the heartbeat of the hill."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Rock",
        "Ground",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 9,
      "max": 19
    },
    "agroRange": {
      "min": 15,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Telluric Sigil"
    },
    "specialEncounters": [
      {
        "type": "stone_growth_rite",
        "chance": 0.2,
        "description": "Living masonry awakens—rare Rock/Fairy stewards emerge."
      },
      {
        "type": "earth_tide",
        "chance": 0.12,
        "description": "Subsurface surge boosts Ground/Grass spawns with fortify boons."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/tellus-city-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "800 ft",
    "temperature": "65°F to 80°F",
    "weatherPatterns": "Stable, earth-blessed climate with perfect growing conditions",
    "accessibility": "Earth magic practitioners and geological researchers",
    "recommendedLevel": "50+",
    "specialFeatures": [
      "Living Stone Architecture",
      "Earth Magic Academies",
      "Geological Wonders",
      "Roman Earth Temples",
      "Natural Rock Gardens"
    ],
    "wildlife": [
      {
        "name": "Stone Guardian",
        "species": "Golem / Golemon / Anubis",
        "type": "Rock/Fighting",
        "rarity": "Rare",
        "description": "Living statues that protect the city"
      },
      {
        "name": "Earth Elemental",
        "species": "Rhyperior / Grottomon",
        "type": "Ground/Rock",
        "rarity": "Uncommon",
        "description": "Beings formed from the blessed earth"
      },
      {
        "name": "Crystal Mole",
        "species": "Excadrill / Drimogemon / Digtoise",
        "type": "Ground/Steel",
        "rarity": "Common",
        "description": "Industrious creatures that shape underground tunnels"
      }
    ],
    "resources": [
      {
        "name": "Living Stone",
        "rarity": "Rare",
        "description": "Rock that continues to grow and shape itself"
      },
      {
        "name": "Earth Crystals",
        "rarity": "Uncommon",
        "description": "Gems that amplify geological magic"
      },
      {
        "name": "Sacred Clay",
        "rarity": "Common",
        "description": "Clay blessed by Tellus for construction"
      }
    ],
    "lore": "Tellus City represents the Roman understanding of earth as a nurturing mother, where the goddess Tellus provides stability, fertility, and protection to all who honor her.",
    "history": "Built by Roman earth mages who learned to work with living stone, the city has grown organically over centuries as the rock formations respond to human habitation.",
    "dangers": [
      "Unstable rock formations during growth",
      "Earth magic experiments",
      "Underground cave-ins",
      "Territorial earth elementals"
    ],
    "tips": [
      "Study earth magic basics",
      "Respect the living architecture",
      "Learn Roman earth goddess traditions",
      "Work with local stone shapers",
      "Bring offerings for Tellus"
    ],
    "description": "Grand city built into living rock formations, where Roman earth goddess Tellus is honored through magnificent stone architecture that grows naturally from the ground.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 28,
      "height": 22
    }
  },

  'tenochtitlan-sky': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "quetzal-winds",
    "regionName": "Quetzal Winds",
    "welcomeMessages": {
      "base": "Welcome to Tenochtitlan-Sky—canals of cloud, plazas of wind, and feathers that vote.",
      "variations": [
        "Sun disks flash across terraces; the city glides a little when it’s happy.",
        "Serpent updrafts hum beneath bridges—hold onto your hat and your awe.",
        "Market stalls are tethered; customers preferably are."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Dragon",
        "Fairy",
        "Electric"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Feathered Sky Writ"
    },
    "specialEncounters": [
      {
        "type": "sun_disk_alignment",
        "chance": 0.22,
        "description": "Aligned disks spawn elite Flying/Dragon custodians with gale boons."
      },
      {
        "type": "cloud_canal_confluence",
        "chance": 0.1,
        "description": "Converging drafts call a rare Fairy/Electric herald."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/tenochtitlan-sky-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "15,000 ft",
    "temperature": "40°F to 65°F",
    "weatherPatterns": "Floating city weather, wind magic, feathered serpent phenomena",
    "accessibility": "Flying ability required, Aztec cultural knowledge recommended",
    "recommendedLevel": "85+",
    "specialFeatures": [
      "Floating Aztec Architecture",
      "Feathered Serpent Magic",
      "Sky Temples",
      "Wind-Powered City",
      "Cloud Agriculture"
    ],
    "wildlife": [
      {
        "name": "Quetzalcoatl Avatar",
        "species": "Rayquaza / Airdramon / Jetragon",
        "type": "Flying/Dragon",
        "rarity": "Extreme",
        "description": "Divine manifestation of the feathered serpent god"
      },
      {
        "name": "Sky Jaguar",
        "species": "Linoone / SaberLeomon",
        "type": "Flying/Fighting",
        "rarity": "Rare",
        "description": "Sacred jaguars that have learned to fly"
      },
      {
        "name": "Wind Quetzal",
        "species": "Altaria / Peckmon / Galeclaw",
        "type": "Flying/Psychic",
        "rarity": "Uncommon",
        "description": "Magnificent birds with rainbow feathers"
      }
    ],
    "resources": [
      {
        "name": "Feathered Serpent Scales",
        "rarity": "Extreme",
        "description": "Divine scales from Quetzalcoatl himself"
      },
      {
        "name": "Sky Gold",
        "rarity": "Rare",
        "description": "Gold blessed by the wind gods"
      },
      {
        "name": "Cloud Jade",
        "rarity": "Uncommon",
        "description": "Jade formed in the sky by wind magic"
      }
    ],
    "lore": "Tenochtitlan Sky represents the pinnacle of Aztec achievement, where the great city was lifted into the heavens by Quetzalcoatl to preserve it from earthly corruption.",
    "history": "Created when the feathered serpent god raised the greatest Aztec city into the sky, the floating metropolis has become a center for wind magic and sky worship.",
    "dangers": [
      "Extreme altitude",
      "Risk of falling from floating city",
      "Divine wind magic storms",
      "Feathered serpent trials",
      "Sky temple restrictions"
    ],
    "tips": [
      "Master flying or wind magic first",
      "Study Aztec culture and traditions",
      "Bring altitude sickness remedies",
      "Respect Quetzalcoatl worship",
      "Understand floating city protocols"
    ],
    "description": "Magnificent floating city inspired by the Aztec capital, suspended in the clouds by feathered serpent magic and powered by wind currents from Quetzalcoatl.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 22
    }
  },

  'terra-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "terra-madre-basin",
    "regionName": "Terra Madre Basin",
    "welcomeMessages": {
      "base": "Welcome to Terra Village—soil so good it grades your gardening.",
      "variations": [
        "Vines train themselves; farmers mostly supervise and snack.",
        "Irrigation stones purr when content—water follows the sound.",
        "Plant a seed, blink twice, meet its grandkids."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Ground",
        "Bug",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Baby II",
        "Child",
        "E",
        "D"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 3,
      "max": 13
    },
    "agroRange": {
      "min": 5,
      "max": 28
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "fertility_chorus",
        "chance": 0.22,
        "description": "Ley hum boosts Grass/Fairy support spawns."
      },
      {
        "type": "earth_kindred",
        "chance": 0.12,
        "description": "A rare Ground/Grass caretaker offers a gentle duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/terra-village-detailed.png"
    },
    "difficulty": "Easy",
    "elevation": "600 ft",
    "temperature": "70°F to 85°F",
    "weatherPatterns": "Perfect agricultural weather, gentle earth magic",
    "accessibility": "Farmers and agricultural researchers welcome",
    "recommendedLevel": "20+",
    "specialFeatures": [
      "Supernatural Fertility",
      "Earth Magic Farming",
      "Perfect Soil",
      "Abundant Harvests",
      "Agricultural Innovation"
    ],
    "wildlife": [
      {
        "name": "Garden Spirit",
        "species": "Comfey / Palmon / Lyleen",
        "type": "Grass/Fairy",
        "rarity": "Common",
        "description": "Friendly spirits that help tend crops"
      },
      {
        "name": "Harvest Mouse",
        "species": "Rattata / Chuumon",
        "type": "Normal/Ground",
        "rarity": "Common",
        "description": "Mice that help with grain collection"
      },
      {
        "name": "Earth Rabbit",
        "species": "Diggersby / Terriermon / Caprity",
        "type": "Ground/Normal",
        "rarity": "Common",
        "description": "Rabbits that help aerate soil through burrowing"
      }
    ],
    "resources": [
      {
        "name": "Miracle Soil",
        "rarity": "Rare",
        "description": "Earth so fertile it can grow anything"
      },
      {
        "name": "Perfect Produce",
        "rarity": "Common",
        "description": "Crops of exceptional quality and nutrition"
      },
      {
        "name": "Earth Seeds",
        "rarity": "Uncommon",
        "description": "Seeds enhanced by earth magic"
      }
    ],
    "lore": "Terra Village embodies the nurturing aspect of Mother Earth, where the soil itself is alive with magic and responds to the care and love of those who work it.",
    "history": "Founded by farmers who discovered a natural confluence of earth magic, the village has perfected sustainable agriculture through partnership with the land.",
    "dangers": [
      "Overconfidence in magical farming",
      "Soil magic dependency",
      "Occasional earth tremors",
      "Plant overgrowth"
    ],
    "tips": [
      "Learn sustainable farming practices",
      "Respect the living soil",
      "Participate in earth blessing ceremonies",
      "Study traditional agriculture",
      "Share knowledge with local farmers"
    ],
    "description": "Peaceful farming village where traditional earth magic ensures perfect crops and the soil is so fertile that plants grow with supernatural abundance.",
    "mapCoordinates": {
      "x": 15,
      "y": 55,
      "width": 18,
      "height": 16
    }
  },

  'thunder-arena': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "tempest-zones",
    "regionName": "Tempest Zones",
    "welcomeMessages": {
      "base": "Welcome to the Thunder Arena—duels choreographed by lightning and applause.",
      "variations": [
        "Capacitor rings hum; referees carry grounding rods and opinions.",
        "Floor glyphs glow with each step—try not to write your name.",
        "Crowds float in tethered galleries; cheers arrive slightly ionized."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 80
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Storm Charter"
    },
    "specialEncounters": [
      {
        "type": "scheduled_surge",
        "chance": 0.22,
        "description": "Arena overcharge spawns elite Electric/Steel challengers."
      },
      {
        "type": "perfect_conduction",
        "chance": 0.1,
        "description": "A pristine strike invites a rare Flying/Electric arbiter."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/thunder-arena-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "14,800 ft storm bowl",
    "temperature": "5°F to 25°F (severe wind chill)",
    "weatherPatterns": "Timed discharge volleys, rolling thunder resonance",
    "accessibility": "Charge glide ingress or conductor lift",
    "recommendedLevel": "95-120",
    "specialFeatures": [
      "Lightning Battle Grid",
      "Charge Synchronization Pillars",
      "Storm Spectator Rings",
      "Thunder Trial Annulus"
    ],
    "wildlife": [
      {
        "name": "Arc Sprite",
        "species": "Plusle / Elecmon / Sparkit",
        "type": "Electric/Fairy",
        "rarity": "Common",
        "description": "Stitches minor arcs between conductor studs."
      },
      {
        "name": "Bolt Monitor",
        "species": "Luxray / Andromon / Boltmane",
        "type": "Electric/Steel",
        "rarity": "Uncommon",
        "description": "Calibrates discharge timing sequences."
      },
      {
        "name": "Storm Gladiator",
        "species": "Zapdos / Machinedramon / Jetragon",
        "type": "Electric/Fighting",
        "rarity": "Rare",
        "description": "Channels multi-bolt surges through wing arrays."
      }
    ],
    "resources": [
      {
        "name": "Thunder Core Fragment",
        "rarity": "Rare",
        "description": "Retains structured high-voltage pattern."
      },
      {
        "name": "Conductor Alloy Strap",
        "rarity": "Uncommon",
        "description": "Flexible band dispersing residual charge."
      },
      {
        "name": "Arc Residue Dust",
        "rarity": "Common",
        "description": "Fine particulate from dissipated strikes."
      }
    ],
    "lore": "Arena geometry tuned to focus resonance into safe discharge corridors.",
    "history": "Erected after early informal duels destabilized surrounding wind lanes.",
    "dangers": [
      "Unscheduled arc forks",
      "Magnetic disorientation",
      "Edge shear gusts"
    ],
    "tips": [
      "Sync moves with pillar cadence",
      "Use tri-ground harness",
      "Abort at double-flash warning"
    ],
    "description": "Aerial colosseum suspended in charged cumulonimbus where combatants duel amid choreographed lightning strikes.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 20
    }
  },

  'thunder-mesa': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to Thunder Mesa—flat top, tall storms, excellent acoustics.",
      "variations": [
        "Echo chambers carve thunder into verses—try not to duet.",
        "Lightning calendars etch the rim; today looks… energetic.",
        "Sky drums practice on the cliff; percussionists welcome."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Rock"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Mesa Grounding Spike"
    },
    "specialEncounters": [
      {
        "type": "storm_anthem",
        "chance": 0.22,
        "description": "Resonant peals summon elite Electric/Flying defenders."
      },
      {
        "type": "quartz_resound",
        "chance": 0.1,
        "description": "Rim crystals awaken a rare Rock/Electric sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/thunder-mesa-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "7500 ft",
    "temperature": "25°F to 55°F",
    "weatherPatterns": "Frequent lightning, constant thunder echoes, electrical storms",
    "accessibility": "Extreme electrical hazard, expert mountaineering required",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Lightning Strike Zone",
      "Thunder Echoes",
      "Natural Amphitheater",
      "Stone Chambers",
      "Electric Phenomena"
    ],
    "wildlife": [
      {
        "name": "Lightning Lizard",
        "species": "Heliolisk / Elecmon / Raiju",
        "type": "Electric/Rock",
        "rarity": "Rare",
        "description": "Reptiles that absorb lightning for energy"
      },
      {
        "name": "Echo Bat",
        "species": "Crobat / Devimon / Yamabiko",
        "type": "Sound/Flying",
        "rarity": "Uncommon",
        "description": "Bats that navigate using thunder echoes"
      },
      {
        "name": "Static Mouse",
        "species": "Pikachu / Pichimon / Raiju",
        "type": "Electric/Normal",
        "rarity": "Common",
        "description": "Small rodents with electrically charged fur"
      }
    ],
    "resources": [
      {
        "name": "Lightning Rod Metal",
        "rarity": "Rare",
        "description": "Metal naturally formed by lightning strikes"
      },
      {
        "name": "Thunder Stones",
        "rarity": "Uncommon",
        "description": "Rocks that resonate with sound energy"
      },
      {
        "name": "Electric Crystals",
        "rarity": "Common",
        "description": "Crystals that store electrical energy"
      }
    ],
    "lore": "Thunder Mesa is where the Thunderbird's voice is loudest, creating eternal echoes that some say contain messages from the spirit world.",
    "history": "The mesa has been shaped by millions of lightning strikes over millennia, creating natural stone formations that amplify sound.",
    "dangers": [
      "Extreme lightning danger",
      "Deafening thunder sounds",
      "Electrical burns",
      "Rock slides from thunder",
      "Disorientation from echoes"
    ],
    "tips": [
      "Wear full electrical protection",
      "Bring hearing protection",
      "Avoid metal objects",
      "Study lightning patterns",
      "Have emergency evacuation plans"
    ],
    "description": "Flat-topped mountain where lightning strikes most frequently, creating a natural amphitheater where the sounds of thunder echo endlessly through carved stone chambers.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'tianlong-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "long-valley",
    "regionName": "Long Valley",
    "welcomeMessages": {
      "base": "Welcome to Tianlong City—spiral pagodas writing the sky in dragon script.",
      "variations": [
        "Incense coils climb towers; every breath edits a cloud.",
        "Bronze bells ring in couplets; responses arrive as wind.",
        "Scholars practice calligraphy with lightning—bring spare sleeves."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Fairy",
        "Steel",
        "Electric"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 35,
      "max": 75
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Celestial Edict Seal"
    },
    "specialEncounters": [
      {
        "type": "sky_script",
        "chance": 0.22,
        "description": "Tower spirals summon elite Dragon/Steel custodians."
      },
      {
        "type": "spirit_calligraphy",
        "chance": 0.1,
        "description": "A living stroke reveals a rare Fairy/Dragon arbiter."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/tianlong-city-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Cloud-crest terraces",
    "temperature": "62°F to 80°F",
    "weatherPatterns": "Incense thermals, drifting scale glow motes",
    "accessibility": "Scaled ascent stair & glide platforms",
    "recommendedLevel": "80-110",
    "specialFeatures": [
      "Cloud Pagoda Spirals",
      "Imperial Jade Archives",
      "Celestial Calligraphy Courts",
      "Dragon Breath Resonance Wells"
    ],
    "wildlife": [
      {
        "name": "Sky Attendant",
        "species": "Altaria / Patamon / Petallia",
        "type": "Dragon/Fairy",
        "rarity": "Common",
        "description": "Maintains incense updraft channels."
      },
      {
        "name": "Glyph Drakelet",
        "species": "Goomy / Seadramon / Lumoth",
        "type": "Dragon/Water",
        "rarity": "Uncommon",
        "description": "Traces vapor scripts around tower crowns."
      },
      {
        "name": "Celestial Archivist",
        "species": "Dragonite / Wisemon / Paladius",
        "type": "Dragon/Psychic",
        "rarity": "Rare",
        "description": "Ensures script integrity across layered chronicles."
      }
    ],
    "resources": [
      {
        "name": "Jade Script Plaque",
        "rarity": "Rare",
        "description": "Inscribed plate boosting focus and resolve."
      },
      {
        "name": "Incense Coil Segment",
        "rarity": "Uncommon",
        "description": "Steady aromatic plume stabilizer."
      },
      {
        "name": "Scale Sheen Powder",
        "rarity": "Common",
        "description": "Reflective dust used in ceremonial markings."
      }
    ],
    "lore": "City towers align with seasonal dragon constellation arcs.",
    "history": "Founded when elder drakes unified dispersed scholarly aeries.",
    "dangers": [
      "Updraft missteps",
      "Protocol infraction censure",
      "Scroll hall disorientation"
    ],
    "tips": [
      "Study greeting bows",
      "Secure glide permits early",
      "Avoid restricted archive tiers"
    ],
    "description": "Celestial pagoda metropolis where spiral towers channel dragon breath into luminous sky scripts.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 30,
      "height": 25
    }
  },

  'time-pools': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "crystal-cove",
    "regionName": "Crystal Cove",
    "welcomeMessages": {
      "base": "Welcome to the Time Pools—eddies of earlier and later in one shoreline.",
      "variations": [
        "Tide clocks tick sideways; reflections arrive before you do.",
        "Crystalline shelves ring like hourglass bells.",
        "Step between ripples; choose a pace, not a path."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Water",
        "Ice",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 14,
      "max": 20
    },
    "agroRange": {
      "min": 28,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Chrono Compass"
    },
    "specialEncounters": [
      {
        "type": "temporal_eddy",
        "chance": 0.22,
        "description": "Fast-forward pools spawn elite Psychic/Water with haste boons."
      },
      {
        "type": "tidal_inversion",
        "chance": 0.1,
        "description": "A backward surge reveals a rare Ice/Fairy time-keeper."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/time-pools-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Intertidal shelf depressions",
    "temperature": "60°F to 72°F (localized variance)",
    "weatherPatterns": "Chrono ripple refractions, mist halos",
    "accessibility": "Stabilized reef walkway (timing clearance)",
    "recommendedLevel": "75-105",
    "specialFeatures": [
      "Time Distortion Pools",
      "Chrono Ebb Channels",
      "Temporal Speed Lanes",
      "Anomaly Observation Deck"
    ],
    "wildlife": [
      {
        "name": "Phase Minnow",
        "species": "Remoraid / Syakomon / Sparkit",
        "type": "Water/Electric",
        "rarity": "Common",
        "description": "Blink-swims across slowed eddy boundaries."
      },
      {
        "name": "Chrono Jelly",
        "species": "Tentacruel / Clockmon / Lumira",
        "type": "Water/Psychic",
        "rarity": "Uncommon",
        "description": "Expands bells to stabilize time shear edges."
      },
      {
        "name": "Anomaly Ray",
        "species": "Starmie / Wisemon / Beakon",
        "type": "Water/Psychic",
        "rarity": "Rare",
        "description": "Charts layered current drift trajectories."
      }
    ],
    "resources": [
      {
        "name": "Temporal Brine Sample",
        "rarity": "Rare",
        "description": "Fluid retaining shifted time dilation signature."
      },
      {
        "name": "Ebb Core Pebble",
        "rarity": "Uncommon",
        "description": "Stone flickering slightly between patina states."
      },
      {
        "name": "Pulse Foam Residue",
        "rarity": "Common",
        "description": "Light froth used to calibrate chrono instruments."
      }
    ],
    "lore": "Sages claim each pool resonates with a distinct historical tide pattern.",
    "history": "Mapped after synchronized lunar surge exposed inner eddies.",
    "dangers": [
      "Temporal disorientation",
      "Equipment desynchronization",
      "Accelerated fatigue"
    ],
    "tips": [
      "Set dual time beacons",
      "Limit exposure in fast lanes",
      "Log perceived vs absolute intervals"
    ],
    "description": "Tidal basin cluster where microcurrents accelerate or stall chronology, forming layered temporal eddies.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 20,
      "height": 15
    }
  },

  'time-temple': {
    "landmass": "conoocoo-archipelago",
    "landmassName": "Conoocoo Archipelago",
    "region": "primordial-jungle",
    "regionName": "Primordial Jungle",
    "welcomeMessages": {
      "base": "Welcome to the Time Temple—where the air holds its breath and echoes arrive early.",
      "variations": [
        "Hourglass frescoes pour light instead of sand.",
        "Pendulum vines sway to rhythms no one is playing.",
        "Step between sunbeams—some belong to yesterday."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Ghost",
        "Steel",
        "Dragon"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Chrono Seal"
    },
    "specialEncounters": [
      {
        "type": "time_lock",
        "chance": 0.22,
        "description": "A stillness falls—rare Psychic/Steel sentinels manifest from frozen seconds."
      },
      {
        "type": "paradox_wanderer",
        "chance": 0.1,
        "description": "Echo of a future beast—Ghost/Dragon—tests your timeline etiquette."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/time-temple-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "500 ft",
    "temperature": "65°F to 80°F",
    "weatherPatterns": "Temporal distortions, eerie stillness",
    "accessibility": "Extreme temporal danger",
    "recommendedLevel": "90+",
    "specialFeatures": [
      "Time Suspension",
      "Timeless Spirits",
      "Ancient Mysteries",
      "Temporal Magic",
      "Reality Distortions"
    ],
    "wildlife": [
      {
        "name": "Chronos Guardian",
        "species": "Dialga / Clockmon / Lyleen",
        "type": "Psychic/Ghost",
        "rarity": "Extreme",
        "description": "Ancient spirit that controls time flow"
      },
      {
        "name": "Temporal Echo",
        "species": "Misdreavus / Soulmon / Fuddler",
        "type": "Ghost/Normal",
        "rarity": "Rare",
        "description": "Echoes of creatures displaced in time"
      },
      {
        "name": "Time Beetle",
        "species": "Genesect / Kabuterimon",
        "type": "Bug/Steel",
        "rarity": "Uncommon",
        "description": "Ancient insects that exist across multiple timelines"
      }
    ],
    "resources": [
      {
        "name": "Time Shards",
        "rarity": "Extreme",
        "description": "Crystallized fragments of time itself"
      }
    ],
    "lore": "The Temple of Ages exists outside normal time, where past, present and future converge. Built by a people long forgotten the people of the island worship this site though they no longer know why.",
    "history": "Built by a people long forgotten the people of the island worship this site though they no longer know why.",
    "dangers": [
      "Temporal displacement",
      "Time loops",
      "Aging acceleration",
      "Chronic distortion"
    ],
    "tips": [
      "Carry temporal anchors",
      "Limit exposure time",
      "Stay together",
      "Monitor chronometers"
    ],
    "description": "Ancient temple where time itself seems suspended, guarded by timeless spirits.",
    "mapCoordinates": {
      "x": 65,
      "y": 10,
      "width": 16,
      "height": 13
    }
  },

  'titania-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "seelie-courts",
    "regionName": "Seelie Courts",
    "welcomeMessages": {
      "base": "Welcome to Titania City—crystal spires tuned to the heart’s weather.",
      "variations": [
        "Gardens bloom in impossible palettes; color theory files for retirement.",
        "Choirs weave light into lace; joy is a public utility.",
        "Mind your courtesy—mirrors here reflect intentions, not faces."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fairy",
        "Grass",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Court Rosette"
    },
    "specialEncounters": [
      {
        "type": "chromatic_festival",
        "chance": 0.22,
        "description": "Emotion-ward blooms boost Fairy/Psychic elites with radiant boons."
      },
      {
        "type": "spire_resonance",
        "chance": 0.1,
        "description": "A tuned spire calls a rare Grass/Fairy arbiter for ceremonial duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/titania-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Spire terrace canopies",
    "temperature": "58°F to 76°F",
    "weatherPatterns": "Petal light showers, resonance chime breezes",
    "accessibility": "Petal lift platforms & spiral root causeways",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Crystal Spires",
      "Emotion Bloom Gardens",
      "Royal Court Amphitheater",
      "Prism Fountain Promenade"
    ],
    "wildlife": [
      {
        "name": "Prism Flutter",
        "species": "Cutiefly / Fairimon / Lumira",
        "type": "Fairy/Bug",
        "rarity": "Common",
        "description": "Synchronizes wing hues with garden pulses."
      },
      {
        "name": "Court Envoy",
        "species": "Togekiss / Angewomon / Katress",
        "type": "Fairy/Flying",
        "rarity": "Uncommon",
        "description": "Carries decree petals between terraces."
      },
      {
        "name": "Spire Regent",
        "species": "Sylveon / Wisemon / Paladius",
        "type": "Fairy/Psychic",
        "rarity": "Rare",
        "description": "Mediates emotional resonance fluctuations."
      }
    ],
    "resources": [
      {
        "name": "Prism Petal",
        "rarity": "Rare",
        "description": "Multicolor bloom segment enhancing charm crafting."
      },
      {
        "name": "Chime Crystal Sliver",
        "rarity": "Uncommon",
        "description": "Emits steady calming tone."
      },
      {
        "name": "Garden Dew Veil",
        "rarity": "Common",
        "description": "Collected morning condensate preserving freshness."
      }
    ],
    "lore": "City mood lights mirror collective court harmony states.",
    "history": "Expanded as emotional resonance mapping improved regulation.",
    "dangers": [
      "Overstimulation fatigue",
      "Terrace slip risk",
      "Resonance echo loops"
    ],
    "tips": [
      "Wear hue adaptation lenses",
      "Rest between promenade tiers",
      "Avoid disrupting chime cycles"
    ],
    "description": "Crystal spire capital whose gardens bloom in impossible chromatic cycles tuned to collective court emotion.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 22
    }
  },

  'trickster-lodge': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "ravens-shadow",
    "regionName": "Raven's Shadow",
    "welcomeMessages": {
      "base": "Welcome to the Trickster Lodge—twilight riddles and doors that disagree.",
      "variations": [
        "Feather sigils shuffle on the walls; the punchlines come later.",
        "Masks watch politely; some leave with you.",
        "Lessons begin with a wrong turn—preferably yours."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Ghost",
        "Flying",
        "Psychic"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 40,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Paradox Feather"
    },
    "specialEncounters": [
      {
        "type": "riddle_gauntlet",
        "chance": 0.22,
        "description": "Answer well—rare Dark/Flying mentor arrives mid-echo."
      },
      {
        "type": "shadow_flip",
        "chance": 0.1,
        "description": "Room turns inside-out—Ghost/Psychic challenger steps through."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/trickster-lodge-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "Shadow ridge hollow",
    "temperature": "36°F to 54°F",
    "weatherPatterns": "Intermittent shade pulses, echo wind murmurs",
    "accessibility": "Riddle path initiation",
    "recommendedLevel": "70-100",
    "specialFeatures": [
      "Raven Spirit Chamber",
      "Illusion Trial Corridors",
      "Paradox Riddle Hearth",
      "Shadow Lesson Alcoves"
    ],
    "wildlife": [
      {
        "name": "Puzzle Corvid",
        "species": "Rookidee / Ravemon / Galeclaw",
        "type": "Dark/Flying",
        "rarity": "Common",
        "description": "Arranges trinkets into shifting cipher patterns."
      },
      {
        "name": "Shade Tutor",
        "species": "Sableye / Phantomon / Katress",
        "type": "Dark/Ghost",
        "rarity": "Uncommon",
        "description": "Demonstrates controlled silhouette splitting."
      },
      {
        "name": "Raven Aspect",
        "species": "Honchkrow / Wisemon / Paladius",
        "type": "Dark/Psychic",
        "rarity": "Rare",
        "description": "Embodies teaching avatar of the lodge spirit."
      }
    ],
    "resources": [
      {
        "name": "Cipher Feather",
        "rarity": "Rare",
        "description": "Encodes rotating riddle keys."
      },
      {
        "name": "Shadow Echo Shard",
        "rarity": "Uncommon",
        "description": "Stores brief auditory illusion loops."
      },
      {
        "name": "Riddle Chalk Dust",
        "rarity": "Common",
        "description": "Writing powder for paradox diagram boards."
      }
    ],
    "lore": "Each solved paradox is said to lighten latent burdens carried in silence.",
    "history": "Raised when first raven emissary bound shifting shadows into teaching forms.",
    "dangers": [
      "Cognitive overload",
      "Illusion vertigo",
      "Echo loop entrapment"
    ],
    "tips": [
      "Pace trial attempts",
      "Ground using tactile token",
      "Record solutions immediately"
    ],
    "description": "Sacred twilight hall where raven spirit mentors challengers through illusion trials and paradox riddles.",
    "mapCoordinates": {
      "x": 40,
      "y": 15,
      "width": 16,
      "height": 18
    }
  },

  'trident-temple': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "poseidons-reach",
    "regionName": "Poseidon's Reach",
    "welcomeMessages": {
      "base": "Welcome to the Trident Temple—sea-quakes felt in bone and tide.",
      "variations": [
        "Salt spray beads on stone runes; the floor swells like a heartbeat.",
        "Conductor channels hum with thunder under seawater.",
        "Offerings travel by current—return postage not guaranteed."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Water",
        "Electric",
        "Steel",
        "Rock"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Trident Writ"
    },
    "specialEncounters": [
      {
        "type": "seismic_tide",
        "chance": 0.22,
        "description": "Temple tremor spawns elite Water/Steel guardians with bulwark boons."
      },
      {
        "type": "stormfont",
        "chance": 0.1,
        "description": "A charged well births a rare Water/Electric arbiter."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/trident-temple-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "50 ft",
    "temperature": "60°F to 75°F",
    "weatherPatterns": "Powerful divine energy, earth tremors",
    "accessibility": "Extreme spiritual site, divine trials required",
    "recommendedLevel": "70+",
    "specialFeatures": [
      "Sacred Trident Shrine",
      "Divine Power Focus",
      "Earthquake Chambers",
      "Ocean Control",
      "Divine Trials"
    ],
    "wildlife": [
      {
        "name": "Trident Guardian",
        "species": "Dialga / Magnamon / Raiju",
        "type": "Water/Steel",
        "rarity": "Extreme",
        "description": "Divine beings that protect the sea lord's weapon"
      },
      {
        "name": "Earthquake Spirit",
        "species": "Groudon / Machinedramon / Jishin-no-Kami",
        "type": "Ground/Psychic",
        "rarity": "Rare",
        "description": "Spirits that emerge during divine tremors"
      },
      {
        "name": "Ocean Wraith",
        "species": "Jellicent / Phantomon / Mizuchi",
        "type": "Water/Ghost",
        "rarity": "Rare",
        "description": "Spirits of those lost at sea who serve the temple"
      }
    ],
    "resources": [
      {
        "name": "Divine Trident Shard",
        "rarity": "Extreme",
        "description": "Fragment containing a portion of the sea lord's power"
      },
      {
        "name": "Earthquake Stone",
        "rarity": "Rare",
        "description": "Stone that trembles with divine power"
      },
      {
        "name": "Sacred Coral",
        "rarity": "Uncommon",
        "description": "Coral grown in the presence of divine energy"
      }
    ],
    "lore": "The Trident Temple houses the most sacred artifact of the sea lord - his divine trident. The weapon's power is so great that it causes constant tremors in both earth and sea.",
    "history": "Built to contain and honor the sea lord's trident after it was temporarily left on earth. The temple has become the center of all oceanic divine power.",
    "dangers": [
      "Divine earthquakes and tremors",
      "Overwhelming divine presence",
      "Trials of worthiness",
      "Tsunami risks",
      "Divine judgment"
    ],
    "tips": [
      "Undergo purification before entering",
      "Bring earthquake protection",
      "Prove your worth to the sea lord",
      "Respect the immense divine power",
      "Prepare for spiritual transformation"
    ],
    "description": "Massive temple complex built around the sea lord's sacred trident, where the lord's power is strongest and earthquakes can be felt through both land and sea.",
    "mapCoordinates": {
      "x": 35,
      "y": 15,
      "width": 15,
      "height": 20
    }
  },

  'twilight-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "ravens-shadow",
    "regionName": "Raven's Shadow",
    "welcomeMessages": {
      "base": "Welcome to Twilight Town—stacked dusk layers and shops that sell riddles by the pound.",
      "variations": [
        "Streetlamps glow out of order; time follows local bylaws.",
        "Market stalls trade memories for maps; haggle carefully.",
        "The horizon blinks—yes, at you."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Ghost",
        "Psychic",
        "Flying"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 28,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "dusk_gradient",
        "chance": 0.22,
        "description": "Layer shift boosts Dark/Ghost spawns with stealth boons."
      },
      {
        "type": "raven_market",
        "chance": 0.1,
        "description": "A vendor’s omen summons a rare Psychic/Flying courier."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/twilight-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Terraced twilight flats",
    "temperature": "50°F to 64°F",
    "weatherPatterns": "Layered amber haze, reverse shadow drift",
    "accessibility": "Phased causeways aligned to dusk intervals",
    "recommendedLevel": "45-75",
    "specialFeatures": [
      "Temporal Gradient Plaza",
      "Riddle Exchange Bazaars",
      "Shadow Phase Alleyways",
      "Gloam Calibration Obelisks"
    ],
    "wildlife": [
      {
        "name": "Dusk Flicker",
        "species": "Murkrow / Dracmon / Foxparks",
        "type": "Dark/Flying",
        "rarity": "Common",
        "description": "Skims temporal shear edges harvesting echo motes."
      },
      {
        "name": "Phase Scribe",
        "species": "Sableye / Wisemon / Sweepa",
        "type": "Dark/Ghost",
        "rarity": "Uncommon",
        "description": "Etches shifting inscriptions into basalt markers."
      },
      {
        "name": "Gloam Architect",
        "species": "Honchkrow / BlackGatomon / Katress",
        "type": "Dark/Psychic",
        "rarity": "Rare",
        "description": "Stabilizes multi-layer dusk corridors."
      }
    ],
    "resources": [
      {
        "name": "Riddle Token Fragment",
        "rarity": "Common",
        "description": "Partial phrase unit redeemable for clue exchanges."
      },
      {
        "name": "Dusk Phase Shard",
        "rarity": "Uncommon",
        "description": "Hardlight sliver formed in gradient convergence."
      },
      {
        "name": "Temporal Gloam Core",
        "rarity": "Rare",
        "description": "Dense nexus bead regulating local dusk persistence."
      }
    ],
    "lore": "Established to harness persistent twilight for advanced shadow craft and mnemonic riddling.",
    "history": "Spatial grid recalibrated after corridor looping incidents.",
    "dangers": [
      "Temporal disorientation",
      "Shadow echo stalking"
    ],
    "tips": [
      "Carry phase anchor charm",
      "Answer riddles succinctly",
      "Track corridor iteration counts"
    ],
    "description": "Perpetual gloam municipality where temporal gradients create staggered dusk layers and riddle commerce.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'utgard-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "jotun-tundra",
    "regionName": "Jötun Tundra",
    "welcomeMessages": {
      "base": "Welcome to Utgard City, the massive ice citadel home to frost giant clans with walls reaching toward the frozen sky!",
      "variations": [
        "Giant architecture and ice walls create an imposing citadel where frost giant clans make their home.",
        "The massive ice citadel towers above the tundra, its walls reaching toward the endless frozen sky.",
        "Frost clan halls and giant forges echo with the power of Ice-type Monsters and ancient magic."
      ]
    },
    "battleParameters": {
      "weather": "hail",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ice",
        "Fighting"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage",
        "Final Stage"
      ],
      "includeRanks": [
        "Adult",
        "Perfect",
        "Ultimate",
        "B",
        "A",
        "S"
      ],
      "species_min": 1,
      "species_max": 2,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 50,
      "max": 100
    },
    "agroRange": {
      "min": 70,
      "max": 95
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Frost Resistance Cloak"
    },
    "specialEncounters": [
      {
        "type": "frost_giant_challenge",
        "chance": 0.15,
        "description": "A frost giant clan leader challenges you to prove your worth in the frozen halls!"
      },
      {
        "type": "giant_forge_trial",
        "chance": 0.1,
        "description": "The ancient giant forges test your monsters with trials of ice and strength!"
      },
      {
        "type": "ice_wall_guardian",
        "chance": 0.08,
        "description": "A legendary guardian emerges from the massive ice walls!"
      }
    ],
    "images": {
      "guide": "/images/maps/areas/utgard-city-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "2000 ft",
    "temperature": "-30°F to 10°F",
    "weatherPatterns": "Constant blizzards, giant magic, aurora phenomena",
    "accessibility": "Extreme danger - hostile giants, diplomatic immunity required",
    "recommendedLevel": "90+",
    "specialFeatures": [
      "Giant Architecture",
      "Frost Giant Rulers",
      "Ice Magic",
      "Ancient Fortifications",
      "Jötun Councils"
    ],
    "wildlife": [
      {
        "name": "Frost Giant",
        "species": "Regigigas / WaruMonzaemon / Cryolinx",
        "type": "Ice/Fighting",
        "rarity": "Extreme",
        "description": "Massive giants that rule the frozen lands"
      },
      {
        "name": "Ice Troll",
        "species": "Darmanitan / IceDevimon",
        "type": "Ice/Ground",
        "rarity": "Rare",
        "description": "Powerful trolls that serve the frost giants"
      },
      {
        "name": "Aurora Wolf",
        "species": "Lycanroc / Garurumon / Fenglope",
        "type": "Ice/Psychic",
        "rarity": "Uncommon",
        "description": "Wolves that howl under the northern lights"
      }
    ],
    "resources": [
      {
        "name": "Giant Ice Crystals",
        "rarity": "Extreme",
        "description": "Massive crystals formed by giant magic"
      },
      {
        "name": "Jötun Artifacts",
        "rarity": "Rare",
        "description": "Ancient tools and weapons of the giants"
      },
      {
        "name": "Frost Magic Stones",
        "rarity": "Uncommon",
        "description": "Stones infused with ice magic"
      }
    ],
    "lore": "Utgard City is the capital of the Jötun, the frost giants of Norse mythology who represent the chaotic forces of nature opposing the gods of Asgard.",
    "history": "Built in the dawn of time by the first frost giants, the city has stood as a bastion of giant power and a challenge to divine authority.",
    "dangers": [
      "Hostile frost giants",
      "Extreme cold and blizzards",
      "Giant magic attacks",
      "Massive scale of everything",
      "Ancient giant curses"
    ],
    "tips": [
      "Obtain diplomatic protection first",
      "Bring extreme cold weather gear",
      "Learn basic giant customs",
      "Travel with a giant-speaker",
      "Avoid direct confrontation at all costs"
    ],
    "description": "Massive fortress city of the frost giants, built from ice and stone blocks the size of buildings, where the Jötun rule their frozen domain with ancient magic.",
    "mapCoordinates": {
      "x": 35,
      "y": 40,
      "width": 30,
      "height": 25
    }
  },

  'valor-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "kshatriya-arena",
    "regionName": "Kshatriya Arena",
    "welcomeMessages": {
      "base": "Welcome to Valor Town—academies by day, honorable bruises by night.",
      "variations": [
        "Drill fields ring with cadence; pride keeps the beat.",
        "Armory banners list alumni—aim to be a footnote at least.",
        "Courage is contagious—consider yourself exposed."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fighting",
        "Steel",
        "Fire"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Valor Writ"
    },
    "specialEncounters": [
      {
        "type": "academy_trials",
        "chance": 0.22,
        "description": "Rank exams summon elite Fighting/Steel duelists."
      },
      {
        "type": "banner_oath",
        "chance": 0.1,
        "description": "A ceremonial vow calls a rare Fire/Fighting mentor."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/valor-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "1100 ft",
    "temperature": "75°F to 100°F",
    "weatherPatterns": "Hot, challenging conditions for training",
    "accessibility": "Brave warriors and military personnel",
    "recommendedLevel": "60+",
    "specialFeatures": [
      "Warrior Academies",
      "Courage Trials",
      "Military Training",
      "Hero Monuments",
      "Valor Ceremonies"
    ],
    "wildlife": [
      {
        "name": "Brave Lion",
        "species": "Pyroar / Leomon / Reptyro",
        "type": "Fire/Fighting",
        "rarity": "Rare",
        "description": "Lions that embody courage and leadership"
      },
      {
        "name": "Honor Wolf",
        "species": "Lucario / Garurumon",
        "type": "Fighting/Normal",
        "rarity": "Uncommon",
        "description": "Wolves that fight with nobility and valor"
      },
      {
        "name": "Courage Bird",
        "species": "Staraptor / Aquilamon / Galeclaw",
        "type": "Flying/Fighting",
        "rarity": "Common",
        "description": "Birds that inspire bravery in battle"
      }
    ],
    "resources": [
      {
        "name": "Medals of Valor",
        "rarity": "Rare",
        "description": "Awards for exceptional courage"
      },
      {
        "name": "Training Equipment",
        "rarity": "Common",
        "description": "Advanced gear for warrior training"
      },
      {
        "name": "Battle Tactics",
        "rarity": "Uncommon",
        "description": "Strategic knowledge for combat"
      }
    ],
    "lore": "Valor Town celebrates the warrior spirit that faces danger without hesitation, teaching that true courage comes from protecting others rather than seeking personal glory.",
    "history": "Established by veteran warriors who wanted to pass down the traditions of heroic combat and ensure that future generations understand true valor.",
    "dangers": [
      "Intense physical training",
      "Combat exercises",
      "Courage trials that test limits",
      "Competitive warrior culture",
      "Risk of injury during training"
    ],
    "tips": [
      "Build physical fitness before arriving",
      "Understand the difference between courage and recklessness",
      "Learn from experienced warriors",
      "Participate in training exercises",
      "Honor the traditions of valor"
    ],
    "description": "Military town where courage and bravery are celebrated above all, home to elite warrior academies and training grounds for the most valorous fighters.",
    "mapCoordinates": {
      "x": 60,
      "y": 30,
      "width": 20,
      "height": 18
    }
  },

  'vision-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "oracles-sanctum",
    "regionName": "Oracle's Sanctum",
    "welcomeMessages": {
      "base": "Welcome to Vision Town—auric shields up, probabilities under review.",
      "variations": [
        "Analysis cloisters hum; ink dries in fractals.",
        "Skyline arrays model fate; bring questions and spare outcomes.",
        "Silence here is a lab instrument—handle gently."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Psychic",
        "Fairy",
        "Electric"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Auric Research Permit"
    },
    "specialEncounters": [
      {
        "type": "probability_braid",
        "chance": 0.22,
        "description": "Model convergence boosts Psychic/Electric elites with foresight boons."
      },
      {
        "type": "vision_lock",
        "chance": 0.1,
        "description": "A focused trance reveals a rare Fairy/Psychic herald."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/vision-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Ridgetop plateaus",
    "temperature": "54°F to 69°F",
    "weatherPatterns": "Clear thermal updrafts, prism halo refraction",
    "accessibility": "Switchback stair ascents with focus rest bays",
    "recommendedLevel": "40-70",
    "specialFeatures": [
      "Probability Lattice Labs",
      "Auric Shield Arrays",
      "Temporal Pattern Vault",
      "Foresight Harmonizer Ring"
    ],
    "wildlife": [
      {
        "name": "Focus Finch",
        "species": "Natu / Candlemon / Teafant",
        "type": "Psychic/Flying",
        "rarity": "Common",
        "description": "Perches on calibration rods stabilizing mind fields."
      },
      {
        "name": "Lattice Analyst",
        "species": "Kirlia / Wisemon / Petallia",
        "type": "Psychic",
        "rarity": "Uncommon",
        "description": "Charts divergence thresholds in sand arrays."
      },
      {
        "name": "Auric Warden",
        "species": "Metang / Andromon / Katress",
        "type": "Psychic/Steel",
        "rarity": "Rare",
        "description": "Maintains shield resonance under storm interference."
      }
    ],
    "resources": [
      {
        "name": "Probabilistic Sand Sample",
        "rarity": "Common",
        "description": "Fine grit capturing branching imprint traces."
      },
      {
        "name": "Auric Shield Plate",
        "rarity": "Uncommon",
        "description": "Segment from overcharged focus barrier ring."
      },
      {
        "name": "Temporal Phase Crystal",
        "rarity": "Rare",
        "description": "Stabilizes mid-range predictive echo depth."
      }
    ],
    "lore": "Founded when wandering seers required structured analytic synthesis beyond trance artistry.",
    "history": "Expanded after coordinated mitigation of a cascading misread cycle.",
    "dangers": [
      "Prediction overfitting",
      "Focus dehydration",
      "Vertigo on ridge storms"
    ],
    "tips": [
      "Hydrate between lattice sessions",
      "Cross-validate multi-view visions",
      "Log shield flux differentials"
    ],
    "description": "High ridge research enclave where disciplined psychic analysts model probability braids under auric shielding.",
    "mapCoordinates": {
      "x": 55,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'vulcan-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "hephaestus-forge",
    "regionName": "Hephaestus Forge",
    "welcomeMessages": {
      "base": "Welcome to Vulcan City—tiered megaforges and innovations that spark on contact.",
      "variations": [
        "Divine furnaces thrum; streets glow with safe, mostly, runoff light.",
        "Alloy districts compete in fireworks of metallurgy—bring visor and curiosity.",
        "Blueprint pigeons deliver patents; do not feed them filings."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Steel",
        "Fire",
        "Rock"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Forge Access Stamp"
    },
    "specialEncounters": [
      {
        "type": "divine_furnace_surge",
        "chance": 0.22,
        "description": "Overpressure wave spawns elite Steel/Fire fabricators."
      },
      {
        "type": "alloy_parade",
        "chance": 0.1,
        "description": "A showcase draw reveals a rare Rock/Steel sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/vulcan-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Smelter terraces & slag plateaus",
    "temperature": "120°F to 165°F (forge cores hotter)",
    "weatherPatterns": "Heat shimmer plumes, magnetic spark drift",
    "accessibility": "Reinforced tram rails & blast-shield gantries",
    "recommendedLevel": "50-80",
    "specialFeatures": [
      "Central Eternal Furnace",
      "Alloy Prototype Labs",
      "Flux Stabilizer Towers",
      "Molten Channel Network"
    ],
    "wildlife": [
      {
        "name": "Slag Skitter",
        "species": "Slugma / Candlemon / Dumud",
        "type": "Fire",
        "rarity": "Common",
        "description": "Absorbs residual radiant heat along channels."
      },
      {
        "name": "Forge Regulator",
        "species": "Magmar / Andromon / Solarmon",
        "type": "Fire/Steel",
        "rarity": "Uncommon",
        "description": "Balances crucible pressure gradients."
      },
      {
        "name": "Alloy Sentinel",
        "species": "Heatran / Wisemon / Kazemon",
        "type": "Fire/Steel",
        "rarity": "Rare",
        "description": "Patrols for structural stress anomalies."
      }
    ],
    "resources": [
      {
        "name": "Refined Slag Glass",
        "rarity": "Common",
        "description": "Cooled vitreous byproduct workable into insulators."
      },
      {
        "name": "Stabilized Flux Coil",
        "rarity": "Uncommon",
        "description": "Maintains field uniformity in prototype furnaces."
      },
      {
        "name": "Divine Alloy Ingot",
        "rarity": "Rare",
        "description": "High resonance metal with exceptional tensile memory."
      }
    ],
    "lore": "Built around a primordial ember bound by cooperative master smith rites.",
    "history": "Underwent duct lattice overhaul after runaway heat vortex.",
    "dangers": [
      "Heat exhaustion",
      "Metal fume inhalation",
      "Magnetic arc surges"
    ],
    "tips": [
      "Cycle cooling breaks",
      "Wear triple filter mask",
      "Log forge flux variance"
    ],
    "description": "Tiered industrial megaforge where perpetual divine furnaces power alloy innovation districts.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 22
    }
  },

  'wakinyan-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "thunderbird-heights",
    "regionName": "Thunderbird Heights",
    "welcomeMessages": {
      "base": "Welcome to Wakinyan City—rooftops are lightning rods and the views are unreasonable.",
      "variations": [
        "Stormbreak buttresses hum; glass gutters pour thunder.",
        "Feathered totems crackle with static etiquette.",
        "If the wind steals your hat, consider it a tithe."
      ]
    },
    "battleParameters": {
      "weather": "rain",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Electric",
        "Flying",
        "Steel"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Stormwarden Seal"
    },
    "specialEncounters": [
      {
        "type": "thunderline_surge",
        "chance": 0.22,
        "description": "Grid flare summons elite Electric/Flying wardens."
      },
      {
        "type": "spire_resonance",
        "chance": 0.1,
        "description": "Conductive spires call a rare Steel/Electric sentinel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/wakinyan-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "8000 ft",
    "temperature": "30°F to 60°F",
    "weatherPatterns": "Constant thunderstorms, powerful winds, frequent lightning",
    "accessibility": "Storm protection required, respect for Native traditions essential",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Thunderbird Nests",
      "Lightning Rods",
      "Wind Architecture",
      "Native Ceremonies",
      "Storm Watching"
    ],
    "wildlife": [
      {
        "name": "Great Thunderbird",
        "species": "Zapdos / Phoenixmon / Raiju",
        "type": "Electric/Flying",
        "rarity": "Extreme",
        "description": "Massive Extreme bird that controls storms"
      },
      {
        "name": "Lightning Eagle",
        "species": "Braviary / Garudamon / Tengu",
        "type": "Electric/Flying",
        "rarity": "Rare",
        "description": "Majestic birds that ride lightning bolts"
      },
      {
        "name": "Storm Wolf",
        "species": "Manectric / Garurumon / Raiju",
        "type": "Electric/Normal",
        "rarity": "Uncommon",
        "description": "Wolves whose fur crackles with static electricity"
      }
    ],
    "resources": [
      {
        "name": "Thunderbird Feathers",
        "rarity": "Extreme",
        "description": "Sacred feathers that channel lightning"
      },
      {
        "name": "Storm Stones",
        "rarity": "Rare",
        "description": "Rocks charged by constant lightning strikes"
      },
      {
        "name": "Wind Crystals",
        "rarity": "Uncommon",
        "description": "Crystals formed by powerful wind pressure"
      }
    ],
    "lore": "Wakinyan City honors the Thunderbird, the great spirit of storms in Native American tradition. The city exists in harmony with the powerful creature, learning from its mastery over lightning and wind.",
    "history": "Built by Native American tribes who received the Thunderbird's blessing to live in its domain. The city has stood for centuries, protected by the great spirit.",
    "dangers": [
      "Constant lightning strikes",
      "Powerful wind gusts",
      "Altitude sickness",
      "Thunderbird territorial behavior",
      "Sacred site restrictions"
    ],
    "tips": [
      "Wear lightning protection gear",
      "Respect Native American traditions",
      "Learn about Thunderbird legends",
      "Avoid disturbing nesting areas",
      "Bring wind-resistant equipment"
    ],
    "description": "Mountain city built high in the peaks where the great Thunderbird nests, with buildings designed to withstand constant lightning strikes and powerful winds.",
    "mapCoordinates": {
      "x": 35,
      "y": 45,
      "width": 25,
      "height": 20
    }
  },

  'web-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "anansi-woods",
    "regionName": "Anansi Woods",
    "welcomeMessages": {
      "base": "Welcome to Web Town—suspended avenues and contracts in thread.",
      "variations": [
        "Silk girders hum with news; step light, read twice.",
        "Pattern engineers tune crossings for story throughput.",
        "If a strand glows, you just got a notification."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Bug",
        "Dark",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 60
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Silk Transit Permit"
    },
    "specialEncounters": [
      {
        "type": "lattice_jam",
        "chance": 0.22,
        "description": "Traffic knot attracts rare Bug/Fairy mediators."
      },
      {
        "type": "whisper_trade",
        "chance": 0.1,
        "description": "Shadow broker—Dark/Bug—offers a duel-for-gossip."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/web-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Upper canopy tension grid",
    "temperature": "70°F to 84°F",
    "weatherPatterns": "Resonant strand hum, dew prism scatter",
    "accessibility": "Harnessed radial strand bridges",
    "recommendedLevel": "40-70",
    "specialFeatures": [
      "Tension Hub Exchanges",
      "Pattern Compiler Looms",
      "Silk Resonance Arrays",
      "Encoded Freight Spools"
    ],
    "wildlife": [
      {
        "name": "Strand Runner",
        "species": "Joltik / Tentomon / Jolthog",
        "type": "Bug/Electric",
        "rarity": "Common",
        "description": "Shuttles charge along data filaments."
      },
      {
        "name": "Pattern Auditor",
        "species": "Ariados / Waspmon / Sweepa",
        "type": "Bug/Steel",
        "rarity": "Uncommon",
        "description": "Validates lattice integrity under load."
      },
      {
        "name": "Resonance Broker",
        "species": "Galvantula / Andromon / Lumira",
        "type": "Bug/Electric",
        "rarity": "Rare",
        "description": "Balances multi-thread narrative throughput."
      }
    ],
    "resources": [
      {
        "name": "Resonant Silk Filament",
        "rarity": "Common",
        "description": "Conductive strand sustaining motif charge."
      },
      {
        "name": "Tension Node Clamp",
        "rarity": "Uncommon",
        "description": "Stabilizer preventing harmonic drift."
      },
      {
        "name": "Compiled Pattern Core",
        "rarity": "Rare",
        "description": "Dense encoded spool boosting crafting inspiration."
      }
    ],
    "lore": "Established to alleviate congestion in original archive canopies.",
    "history": "Reinforced after a tri-node oscillation cascade.",
    "dangers": [
      "Strand snap recoil",
      "Harmonic overload"
    ],
    "tips": [
      "Check anchor harness",
      "Monitor tension gauges",
      "Avoid crossing during sync pulses"
    ],
    "description": "Silk-strand conurbation suspended on tension hubs where pattern engineers optimize narrative lattice throughput.",
    "mapCoordinates": {
      "x": 60,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'wind-gardens': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "nimbus-capital",
    "regionName": "Nimbus Capital",
    "welcomeMessages": {
      "base": "Welcome to the Wind Gardens—floating beds and very opinionated breezes.",
      "variations": [
        "Aerophytes sip clouds; gardeners steer with kites.",
        "Jetstream harps keep time for pruning.",
        "Drop anything and the wind will plant it for you—somewhere."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Grass",
        "Flying",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 15,
      "max": 50
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Sky Tether Permit"
    },
    "specialEncounters": [
      {
        "type": "updraft_bloom",
        "chance": 0.22,
        "description": "Perfect lift boosts Grass/Fairy support spawns."
      },
      {
        "type": "glide_caretaker",
        "chance": 0.1,
        "description": "A rare Flying/Grass tender circles in for a gentle test."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/wind-gardens-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "High-altitude aeroponic tiers",
    "temperature": "34°F to 52°F (wind chill lower)",
    "weatherPatterns": "Laminar flow bursts, pollen spiral eddies",
    "accessibility": "Stabilized lift rings & glide gantries",
    "recommendedLevel": "35-65",
    "specialFeatures": [
      "Jetstream Pruning Arrays",
      "Aerophyte Seed Vaults",
      "Wind Pollination Conduits",
      "Sky Nectar Suspension Pods"
    ],
    "wildlife": [
      {
        "name": "Pollen Wisp",
        "species": "Hoppip / Motimon / Teafant",
        "type": "Grass/Flying",
        "rarity": "Common",
        "description": "Drifts distributing micro spore clusters."
      },
      {
        "name": "Glide Gardener",
        "species": "Skiploom / Kazemon / Petallia",
        "type": "Grass/Fairy",
        "rarity": "Uncommon",
        "description": "Manages airflow trimming patterns."
      },
      {
        "name": "Jetstream Curator",
        "species": "Jumpluff / Wisemon / Lumira",
        "type": "Grass/Flying",
        "rarity": "Rare",
        "description": "Optimizes vortex nutrient circulation."
      }
    ],
    "resources": [
      {
        "name": "Aero Spore Sachet",
        "rarity": "Common",
        "description": "Packet of buoyant fertilizing spores."
      },
      {
        "name": "Jetstream Filament",
        "rarity": "Uncommon",
        "description": "Tension strand sustaining lift ring stability."
      },
      {
        "name": "Sky Nectar Ampoule",
        "rarity": "Rare",
        "description": "Concentrated airborne floral extract."
      }
    ],
    "lore": "Gardeners pioneered airflow nutrient cycling replacing soil medium dependency.",
    "history": "Expanded after successful frost resilience graft trials.",
    "dangers": [
      "Crosswind shear",
      "Lift ring destabilization"
    ],
    "tips": [
      "Clip harness at all times",
      "Monitor wind shear index",
      "Seal pollen containers"
    ],
    "description": "Suspended horticulture platforms cultivating aerophyte matrices on tuned jetstream vortices.",
    "mapCoordinates": {
      "x": 35,
      "y": 65,
      "width": 25,
      "height": 20
    }
  },

  'wind-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "quetzal-winds",
    "regionName": "Quetzal Winds",
    "welcomeMessages": {
      "base": "Welcome to Wind Village—breezeways that sing and roofs that listen.",
      "variations": [
        "Streamers read the weather before it happens.",
        "Ceremonial kites map thermals for apprentices.",
        "If a door slams, that was a greeting."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Flying",
        "Grass",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 7,
      "max": 17
    },
    "agroRange": {
      "min": 12,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "ceremonial_draft",
        "chance": 0.22,
        "description": "Village rite boosts Flying/Grass spawns with breeze boons."
      },
      {
        "type": "plumed_mentor",
        "chance": 0.12,
        "description": "A rare Fairy/Flying tutor offers aerial drills."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/wind-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "3000 ft",
    "temperature": "60°F to 80°F",
    "weatherPatterns": "Constant gentle winds, air magic training effects",
    "accessibility": "Wind magic students and air enthusiasts",
    "recommendedLevel": "40+",
    "specialFeatures": [
      "Wind Magic Schools",
      "Air Current Channeling",
      "Breeze Architecture",
      "Sky Ceremonies",
      "Flight Training"
    ],
    "wildlife": [
      {
        "name": "Wind Sprite",
        "species": "Cutiefly / Fairymon",
        "type": "Flying/Fairy",
        "rarity": "Common",
        "description": "Tiny spirits that dance on air currents"
      },
      {
        "name": "Breeze Cat",
        "species": "Glameow / Gatomon / Bristla",
        "type": "Normal/Flying",
        "rarity": "Common",
        "description": "Cats that can walk on air for short distances"
      },
      {
        "name": "Sky Butterfly",
        "species": "Butterfree / Butterflamon",
        "type": "Bug/Flying",
        "rarity": "Uncommon",
        "description": "Butterflies that ride wind currents for miles"
      }
    ],
    "resources": [
      {
        "name": "Bottled Wind",
        "rarity": "Uncommon",
        "description": "Captured air currents for magical use"
      },
      {
        "name": "Wind Chimes",
        "rarity": "Common",
        "description": "Instruments that harmonize with air magic"
      },
      {
        "name": "Flight Feathers",
        "rarity": "Common",
        "description": "Feathers that assist in wind magic"
      }
    ],
    "lore": "Wind Village serves as a training ground for those who wish to master air magic, teaching respect for the sky and harmony with wind currents.",
    "history": "Founded by wind mages who discovered optimal air currents for magical training, the village has become a center for aerial magic education.",
    "dangers": [
      "Wind magic training accidents",
      "Sudden air current changes",
      "Flight training mishaps",
      "Altitude-related issues"
    ],
    "tips": [
      "Start with basic wind magic theory",
      "Practice balance and coordination",
      "Learn weather pattern recognition",
      "Respect air current safety",
      "Build up altitude tolerance gradually"
    ],
    "description": "Traditional village where wind mages learn to harness air currents, with buildings designed to channel breezes and ceremonies that call upon the power of the sky.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'wisdom-town': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "long-valley",
    "regionName": "Long Valley",
    "welcomeMessages": {
      "base": "Welcome to Wisdom Town—jade archives, patient bells, and lectures that molt.",
      "variations": [
        "Scroll vaults breathe; scholars practice quiet like a martial art.",
        "Resonance cloisters tune thought into tidy constellations.",
        "Debate duels end with tea… and sometimes homework."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Psychic",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "D",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 25,
      "max": 65
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Jade Scroll Writ"
    },
    "specialEncounters": [
      {
        "type": "ink_alignment",
        "chance": 0.22,
        "description": "Calligraphy rite summons rare Psychic/Fairy tutors."
      },
      {
        "type": "scale_parable",
        "chance": 0.1,
        "description": "A Dragon/Fairy sage tests your patience and posture."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/wisdom-town-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "Terraced scholar ridge",
    "temperature": "60°F to 78°F",
    "weatherPatterns": "Incense thermals, pearl mist condensation",
    "accessibility": "Tiered ramp galleries with scribe lifts",
    "recommendedLevel": "55-85",
    "specialFeatures": [
      "Jade Scroll Vaults",
      "Philosopher Cloisters",
      "Resonant Debate Forum",
      "Pearl Distillation Gardens"
    ],
    "wildlife": [
      {
        "name": "Scroll Whelp",
        "species": "Axew / Motimon / Teafant",
        "type": "Dragon",
        "rarity": "Common",
        "description": "Gently warms parchment for preservation."
      },
      {
        "name": "Archive Curator",
        "species": "Fraxure / Wisemon / Katress",
        "type": "Dragon/Psychic",
        "rarity": "Uncommon",
        "description": "Indexes multigeneration treatise tablets."
      },
      {
        "name": "Resonance Elder",
        "species": "Haxorus / Andromon / Kazemon",
        "type": "Dragon/Steel",
        "rarity": "Rare",
        "description": "Moderates high-level philosophical harmonics."
      }
    ],
    "resources": [
      {
        "name": "Ink Pearl Fragment",
        "rarity": "Common",
        "description": "Pearl sliver used in durable script mixture."
      },
      {
        "name": "Resonant Jade Slab",
        "rarity": "Uncommon",
        "description": "Vibratory tablet supporting memory retention."
      },
      {
        "name": "Elder Debate Seal",
        "rarity": "Rare",
        "description": "Authorization token for restricted discourse halls."
      }
    ],
    "lore": "Town ensures draconic wisdom lineage remains curated and reproducible.",
    "history": "Archive climate system upgraded after condensation event.",
    "dangers": [
      "Information overload",
      "Scroll humidity imbalance"
    ],
    "tips": [
      "Pace study intervals",
      "Log borrowed tablets",
      "Respect elder silence bells"
    ],
    "description": "Scholastic dragon borough maintaining vaulted jade-scroll archives and contemplative resonance cloisters.",
    "mapCoordinates": {
      "x": 65,
      "y": 25,
      "width": 20,
      "height": 18
    }
  },

  'witchwood-city': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "crowsfoot-marsh",
    "regionName": "Crowsfoot Marsh",
    "welcomeMessages": {
      "base": "Welcome to Witchwood City—twisted boughs, swamp sigils, and very legal hexes.",
      "variations": [
        "Hedge-lanterns glare like grumpy fireflies.",
        "Cauldron plazas bubble with elective coursework.",
        "Mind the roots; they mind you back."
      ]
    },
    "battleParameters": {
      "weather": "fog",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dark",
        "Poison",
        "Grass",
        "Ghost"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 12,
      "max": 20
    },
    "agroRange": {
      "min": 30,
      "max": 70
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Marsh Coven Token"
    },
    "specialEncounters": [
      {
        "type": "blackthorn_market",
        "chance": 0.22,
        "description": "Night bazaar spawns elite Dark/Poison duelists."
      },
      {
        "type": "bog_omen",
        "chance": 0.1,
        "description": "A rare Grass/Ghost augur rises from the reeds."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/witchwood-city-detailed.png"
    },
    "difficulty": "Hard",
    "elevation": "50 ft",
    "temperature": "65°F to 85°F",
    "weatherPatterns": "Misty, humid, frequent fog and magical phenomena",
    "accessibility": "Magic practitioners and brave researchers",
    "recommendedLevel": "65+",
    "specialFeatures": [
      "Hedge Magic Schools",
      "Witch Covens",
      "Dark Nature Magic",
      "Alchemical Labs",
      "Forbidden Knowledge"
    ],
    "wildlife": [
      {
        "name": "Swamp Witch",
        "species": "Misdreavus / Witchmon / Katress",
        "type": "Dark/Grass",
        "rarity": "Rare",
        "description": "Mysterious practitioners of marsh magic"
      },
      {
        "name": "Familiar Raven",
        "species": "Murkrow / Hawkmon",
        "type": "Dark/Flying",
        "rarity": "Common",
        "description": "Intelligent ravens that serve local witches"
      },
      {
        "name": "Bog Serpent",
        "species": "Seviper / Seadramon / Elphidran",
        "type": "Poison/Water",
        "rarity": "Uncommon",
        "description": "Venomous snakes that inhabit the murky waters"
      }
    ],
    "resources": [
      {
        "name": "Witch's Herbs",
        "rarity": "Rare",
        "description": "Rare plants used in powerful magical potions"
      },
      {
        "name": "Dark Grimoires",
        "rarity": "Rare",
        "description": "Spell books containing forbidden knowledge"
      },
      {
        "name": "Cursed Artifacts",
        "rarity": "Uncommon",
        "description": "Magical items with dark enchantments"
      }
    ],
    "lore": "Witchwood City serves as a haven for those who practice the darker aspects of nature magic, where ancient traditions of hedge witchcraft and swamp sorcery are preserved.",
    "history": "Founded by witches and hedge wizards who were driven from more civilized areas, the city has become a center for magical knowledge that others fear to study.",
    "dangers": [
      "Dark magic experiments",
      "Cursed locations",
      "Hostile magical practitioners",
      "Poisonous marsh creatures",
      "Forbidden knowledge corruption"
    ],
    "tips": [
      "Respect local magical traditions",
      "Avoid touching unknown magical items",
      "Bring protection against curses",
      "Study hedge magic basics",
      "Negotiate carefully with witches"
    ],
    "description": "Dark city built among twisted trees and murky waters, where practitioners of hedge magic and swamp witchcraft study the darker arts of nature magic.",
    "mapCoordinates": {
      "x": 40,
      "y": 35,
      "width": 25,
      "height": 20
    }
  },

  'wyrmclaw-village': {
    "landmass": "sky-isles",
    "landmassName": "Sky Isles",
    "region": "draconic-abyss",
    "regionName": "Draconic Abyss",
    "welcomeMessages": {
      "base": "Welcome to Wyrmclaw Village—sky edges, blood oaths, and neighbors with wingspans.",
      "variations": [
        "Clifftop chains sing; ledges are on a first-name basis.",
        "Drake shrines taste like iron on the wind.",
        "The greeting is a bow; the test is everything after."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Dragon",
        "Fire",
        "Dark",
        "Flying"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "C",
        "B"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 15,
      "max": 20
    },
    "agroRange": {
      "min": 45,
      "max": 85
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Wyrmclaw Oathband"
    },
    "specialEncounters": [
      {
        "type": "oath_trance",
        "chance": 0.22,
        "description": "Bond rite summons elite Dragon/Flying guardians."
      },
      {
        "type": "ember_vigil",
        "chance": 0.1,
        "description": "A Fire/Dark adjudicator challenges unworthy boasts."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/wyrmclaw-village-detailed.png"
    },
    "difficulty": "Extreme",
    "elevation": "20,000 ft",
    "temperature": "-10°F to 20°F",
    "weatherPatterns": "Draconic fire winds, ash storms",
    "accessibility": "Hostile tribe - extreme danger",
    "recommendedLevel": "95+",
    "specialFeatures": [
      "Dragon-Bonded Tribe",
      "Draconic Rituals",
      "Hostile Natives",
      "Blood Pacts",
      "Tribal Warfare"
    ],
    "wildlife": [
      {
        "name": "Wyrmclaw Warrior",
        "species": "Garchomp / Wargreymon / Blazamut",
        "type": "Dragon/Fighting",
        "rarity": "Rare",
        "description": "Tribal warriors bonded with dragon spirits"
      },
      {
        "name": "Bone Drake",
        "species": "Druddigon / Skullgreymon / Necromus",
        "type": "Dragon/Ghost",
        "rarity": "Rare",
        "description": "Skeletal dragons that serve the tribe"
      },
      {
        "name": "Blood Familiar",
        "species": "Sableye / Devimon / Lovander",
        "type": "Dark/Psychic",
        "rarity": "Uncommon",
        "description": "Creatures born from draconic blood magic"
      }
    ],
    "resources": [
      {
        "name": "Dragon Blood",
        "rarity": "Extreme",
        "description": "Sacred blood used in tribal bonding rituals"
      },
      {
        "name": "Tribal Totems",
        "rarity": "Rare",
        "description": "Carved totems with dragon magic properties"
      },
      {
        "name": "Bone Weapons",
        "rarity": "Uncommon",
        "description": "Weapons crafted from dragon bones"
      }
    ],
    "lore": "The Wyrmclaw Tribe are descendants of humans who made blood pacts with dragons centuries ago. They have evolved beyond normal humanity, gaining draconic traits and fierce loyalty to their dragon lords. They view all outsiders as threats to be eliminated.",
    "history": "The tribe formed during the Dragon Wars, when desperate humans sought power through blood bonds with dragons. Over generations, they have become something between human and dragon, fiercely protecting their territory.",
    "dangers": [
      "Immediate attack on sight",
      "Dragon-bonded warriors",
      "Blood magic curses",
      "Territorial dragons",
      "Draconic traps"
    ],
    "tips": [
      "Avoid at all costs",
      "Do not attempt contact",
      "Carry dragon-repelling items",
      "Plan emergency evacuation",
      "Consider area off-limits"
    ],
    "description": "Tribal settlement of dragon-bonded humans who have adapted to the hostile sky environment through draconic pacts and blood magic.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 20,
      "height": 18
    }
  },

  'xochitonal-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "mictlan-hollows",
    "regionName": "Mictlan Hollows",
    "welcomeMessages": {
      "base": "Welcome to Xochitonal Village—flowers remember, and the air hums with gentle farewells.",
      "variations": [
        "Marigold paths braid between altars; every petal is a postcard.",
        "Lantern rivers carry songs upriver and back again.",
        "Offer sugar, receive stories—fair trade."
      ]
    },
    "battleParameters": {
      "weather": "clear",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Ghost",
        "Fairy",
        "Grass",
        "Water"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Baby I",
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 8,
      "max": 18
    },
    "agroRange": {
      "min": 10,
      "max": 45
    },
    "itemRequirements": {
      "needsMissionMandate": true
    },
    "specialEncounters": [
      {
        "type": "altar_cycle",
        "chance": 0.22,
        "description": "Vigil peak boosts Ghost/Fairy support spawns."
      },
      {
        "type": "petal_procession",
        "chance": 0.1,
        "description": "A rare Water/Grass guide invites a remembrance duel."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/xochitonal-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "Subterranean bloom chambers",
    "temperature": "64°F to 72°F",
    "weatherPatterns": "Phosphor pollen glow, gentle echo drizzle",
    "accessibility": "Petal-lined descent ramps",
    "recommendedLevel": "30-60",
    "specialFeatures": [
      "Living Marigold Altars",
      "Ancestral Petal Canals",
      "Spirit Candle Gardens",
      "Memory Offering Pavilion"
    ],
    "wildlife": [
      {
        "name": "Petal Spiritlet",
        "species": "Shuppet / Motimon / Teafant",
        "type": "Ghost/Grass",
        "rarity": "Ghost/Grass",
        "description": "Floats distributing memorial pollen."
      },
      {
        "name": "Altar Guardian",
        "species": "Dusclops / Dracmon / Lumira",
        "type": "Ghost",
        "rarity": "Uncommon",
        "description": "Stabilizes offering energy signatures."
      },
      {
        "name": "Remembrance Guide",
        "species": "Dhelmise / Wisemon / BlackGatomon",
        "type": "Ghost/Steel",
        "rarity": "Rare",
        "description": "Leads processions through echo canals."
      }
    ],
    "resources": [
      {
        "name": "Memorial Petal Bundle",
        "rarity": "Common",
        "description": "Assorted bright petals charged with gentle spirit tone."
      },
      {
        "name": "Spirit Candle Wax",
        "rarity": "Uncommon",
        "description": "Slow-burning compound sustaining ritual illumination."
      },
      {
        "name": "Ancestor Echo Charm",
        "rarity": "Rare",
        "description": "Harmonic talisman improving safe underworld traversal."
      }
    ],
    "lore": "Village preserves daily honoring processes preventing fading of local ancestral narratives.",
    "history": "Expanded after canal restoration increased ceremony capacity.",
    "dangers": [
      "Overcrowded procession paths",
      "Minor spirit overattachment"
    ],
    "tips": [
      "Offer respectful silence",
      "Rotate candle placements",
      "Carry guided return charm"
    ],
    "description": "Floral remembrance settlement where continuous altar cycles sustain vibrant ancestor communion rituals.",
    "mapCoordinates": {
      "x": 15,
      "y": 50,
      "width": 18,
      "height": 16
    }
  },

  'yagna-village': {
    "landmass": "conoco-island",
    "landmassName": "Conoco Island",
    "region": "agni-peaks",
    "regionName": "Agni Peaks",
    "welcomeMessages": {
      "base": "Welcome to Yagna Village—ritual fires older than the gossip.",
      "variations": [
        "Offerings crackle into blessings; smoke writes polite cursive.",
        "Bell chimes pace mantras; ash marks mean you belong.",
        "Share warmth, carry light—refills available nightly."
      ]
    },
    "battleParameters": {
      "weather": "sunny",
      "terrain": "normal"
    },
    "monsterRollerParameters": {
      "speciesTypesOptions": [
        "Fire",
        "Fighting",
        "Fairy"
      ],
      "includeStages": [
        "Base Stage",
        "Middle Stage"
      ],
      "includeRanks": [
        "Child",
        "E",
        "D",
        "C"
      ],
      "species_min": 1,
      "species_max": 1,
      "types_min": 1,
      "types_max": 2
    },
    "levelRange": {
      "min": 9,
      "max": 19
    },
    "agroRange": {
      "min": 20,
      "max": 55
    },
    "itemRequirements": {
      "needsMissionMandate": true,
      "itemRequired": "Ritual Offering Bundle"
    },
    "specialEncounters": [
      {
        "type": "sacrificial_flame",
        "chance": 0.22,
        "description": "Ceremony surge spawns elite Fire/Fighting devotees."
      },
      {
        "type": "ember_benediction",
        "chance": 0.1,
        "description": "A rare Fire/Fairy celebrant offers a protective pact."
      }
    ],
    "images": {
      "guide": "/images/maps/areas/yagna-village-detailed.png"
    },
    "difficulty": "Medium",
    "elevation": "3500 ft",
    "temperature": "80°F to 100°F",
    "weatherPatterns": "Warm, smoke-filled air from ceremonial fires",
    "accessibility": "Spiritual pilgrims welcome",
    "recommendedLevel": "45+",
    "specialFeatures": [
      "Eternal Yagna Fires",
      "Ritual Ceremonies",
      "Sacred Offerings",
      "Meditation Gardens",
      "Priest Training"
    ],
    "wildlife": [
      {
        "name": "Sacred Cow",
        "species": "Tauros / Leomon / Mau",
        "type": "Normal/Psychic",
        "rarity": "Rare",
        "description": "Holy cattle that bless the village"
      },
      {
        "name": "Fire Monkey",
        "species": "Chimchar / Apemon / Caprity",
        "type": "Fire/Normal",
        "rarity": "Common",
        "description": "Playful primates that tend the sacred fires"
      },
      {
        "name": "Ceremony Bird",
        "species": "Talonflame / Piyomon / Galeclaw",
        "type": "Fire/Flying",
        "rarity": "Uncommon",
        "description": "Birds that circle during important rituals"
      }
    ],
    "resources": [
      {
        "name": "Sacred Ghee",
        "rarity": "Rare",
        "description": "Clarified butter used in fire ceremonies"
      },
      {
        "name": "Ritual Herbs",
        "rarity": "Common",
        "description": "Plants used in sacred offerings"
      },
      {
        "name": "Blessed Grains",
        "rarity": "Common",
        "description": "Grains offered to the sacred fires"
      }
    ],
    "lore": "Yagna Village exists solely to maintain the sacred fire ceremonies that protect the region. The continuous rituals are believed to maintain cosmic balance and bring divine protection.",
    "history": "Founded by a group of devoted priests centuries ago to perform the eternal yagna (fire sacrifice). The village has never let the ceremonial fires die.",
    "dangers": [
      "Ritual fire accidents",
      "Intense spiritual energy",
      "Smoke inhalation",
      "Religious restrictions"
    ],
    "tips": [
      "Show respect for ceremonies",
      "Learn about ancient fire traditions",
      "Participate in offerings",
      "Avoid disrupting rituals",
      "Bring appropriate donations"
    ],
    "description": "Sacred village where continuous fire ceremonies are performed, with ritual fires that have burned uninterrupted for centuries, maintained by devoted priests.",
    "mapCoordinates": {
      "x": 20,
      "y": 50,
      "width": 18,
      "height": 15
    }
  },

};

// === AREA_DATA_END ===

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get configuration for an area by ID
 */
export function getAreaConfiguration(areaId: string): AreaConfiguration | null {
  return areaConfigurations[areaId] ?? null;
}

/**
 * Check if an area has a predefined configuration
 */
export function hasAreaConfiguration(areaId: string): boolean {
  return areaId in areaConfigurations;
}

/**
 * Get all configured area IDs
 */
export function getConfiguredAreaIds(): string[] {
  return Object.keys(areaConfigurations);
}

/**
 * Get a landmass definition by ID
 */
export function getLandmassDefinition(landmassId: string): LandmassDefinition | null {
  return landmassDefinitions[landmassId] ?? null;
}

/**
 * Get a region definition by ID
 */
export function getRegionDefinition(regionId: string): RegionDefinition | null {
  return regionDefinitions[regionId] ?? null;
}

/**
 * Get all landmass IDs
 */
export function getLandmassIds(): string[] {
  return Object.keys(landmassDefinitions);
}

/**
 * Get all region IDs
 */
export function getRegionIds(): string[] {
  return Object.keys(regionDefinitions);
}

/**
 * Resolve entity images from optional ImagePaths to always-populated ResolvedImages.
 *
 * Resolution order:
 *   1. If both guide and overworld are explicitly provided → use them directly
 *   2. If only one is provided → use it for both
 *   3. If neither is provided → build convention-based default paths:
 *        Landmasses: /images/maps/landmass/{entityId}_{variant}.png
 *        Regions:    /images/maps/region/{landmassId}/{entityId}_{variant}.png
 *        Areas:      /images/maps/area/{landmassId}/{regionId}/{entityId}_{variant}.png
 *
 * The frontend should handle missing images gracefully (e.g. onError → hide).
 */
export function resolveEntityImages(
  images: ImagePaths | undefined,
  entityType: 'landmass' | 'region' | 'area',
  entityId: string,
  parentPath?: string,
): ResolvedImages {
  const guide = images?.guide;
  const overworld = images?.overworld;

  // Both explicitly provided
  if (guide && overworld) {
    return { image: guide, overworldImage: overworld };
  }

  // Only one provided — use it for both
  if (guide) {
    return { image: guide, overworldImage: guide };
  }
  if (overworld) {
    return { image: overworld, overworldImage: overworld };
  }

  // Convention-based defaults
  const basePath = parentPath
    ? `/images/maps/${entityType}/${parentPath}`
    : `/images/maps/${entityType}`;

  return {
    image: `${basePath}/${entityId}_guide.png`,
    overworldImage: `${basePath}/${entityId}_overworld.png`,
  };
}

/**
 * Project an area configuration into its encounter-only view
 */
export function projectEncounterConfig(areaId: string, config: AreaConfiguration): AreaEncounterConfig {
  return {
    areaId,
    areaName: slugToName(areaId),
    regionId: config.region,
    regionName: config.regionName,
    landmassId: config.landmass,
    landmassName: config.landmassName,
    welcomeMessages: config.welcomeMessages,
    battleParameters: config.battleParameters,
    monsterRollerParameters: config.monsterRollerParameters,
    levelRange: config.levelRange,
    agroRange: config.agroRange,
    itemRequirements: config.itemRequirements,
    specialEncounters: config.specialEncounters,
    difficulty: config.difficulty,
  };
}

/**
 * Project an area configuration into its guide-only view.
 * Images are resolved using convention-based defaults if not explicitly provided.
 */
export function projectGuideView(areaId: string, config: AreaConfiguration): AreaGuideView {
  const resolved = resolveEntityImages(
    config.images,
    'area',
    areaId,
    `${config.landmass}/${config.region}`,
  );

  return {
    id: areaId,
    name: slugToName(areaId),
    regionId: config.region,
    regionName: config.regionName,
    landmassId: config.landmass,
    landmassName: config.landmassName,
    ...resolved,
    difficulty: config.difficulty,
    specialFeatures: config.specialFeatures,
    description: config.description,
    elevation: config.elevation,
    temperature: config.temperature,
    weatherPatterns: config.weatherPatterns,
    accessibility: config.accessibility,
    recommendedLevel: config.recommendedLevel,
    wildlife: config.wildlife,
    resources: config.resources,
    lore: config.lore,
    history: config.history,
    dangers: config.dangers,
    tips: config.tips,
    mapCoordinates: config.mapCoordinates,
  };
}
