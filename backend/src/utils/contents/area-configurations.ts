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
    "lore": "Legend speaks of eighteen ancient spirits from different realms who found sanctuary on this island, each claiming dominion over a region that reflects their elemental essence. Conoco Island is the great confluence of the monster world — Pokémon roam every biome freely, while Digimon that have crossed from the Digital World find nodes of resonant data energy embedded in the island's volcanic rock and ancient ruins. Yokai have been here since before recorded history, serving as guardians of sacred sites and natural places, and the beloved Moogles of Final Fantasy lore have long since settled in the warmer commons, weaving their craft into daily life alongside the islanders. Monster Hunter apex beasts claim the most remote highlands and ocean depths, while Pals have built industrious communities in the flatter trade-route territories. The island is truly a living tapestry of elemental energies and monster civilizations, unique in all the world for the sheer variety of beings that call it home.",
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
    "lore": "Legend tells of a great cataclysm that separated these islands from the flow of time, preserving creatures from eras long past. The Primordial Jungle pulses with raw life energy, where fossil Pokémon walk freely alongside their living kin, and ancient Digimon forms — primordial data-entities that predate the Digital World itself — still drift between the trees like living ghosts of the internet's first dream. Primal Yokai of immense age dwell in the deepest marshlands, older than any shrine or human myth, tending the spirits of extinct creatures with solemn reverence. Monster Hunter apex beasts — titanosaurs and elder drakes — rule the interior with unchallenged dominion, and the local tribes keep their existence secret from the wider world at great personal cost. Those few outsiders who have glimpsed the archipelago speak of a place where the boundary between past and present simply does not exist.",
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
    "lore": "These islands defy gravity itself, held aloft by a confluence of ancient sky magic, electromagnetic ley currents, and celestial energy that no scholar has yet fully explained. Flying-type Pokémon and dragon-kind have evolved beyond all earthbound limitations here, their wings shaped by winds that blow in four dimensions. Flying Digimon — Birdramon, Garudamon, and their kin — serve as royal messengers and palace guards in the great cloud cities, their digital nature resonating powerfully with the electromagnetic fields that keep the islands airborne. The two great tribes, the Featherless Ones and the Wyvern People, have warred for generations over dominion of the sky roads, each calling upon their monster allies in the struggle. At the highest reaches, where the air grows thin and the stars seem close enough to touch, the most ancient and powerful beings hold court in silence, watching the world below with ageless patience.",
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
    "lore": "Inspired by northern concepts of community and comfort, Hearthfall Commons has grown into the most welcoming corner of the entire Conoco Region, where the warmth of a shared meal matters more than elemental power or faction rank. Normal-type Pokémon are the backbone of daily life here — Eevee play in cottage gardens, Chansey assist at the local clinic, and the occasional Snorlax becomes a beloved neighbourhood landmark. Moogles from another world entirely have settled here in surprisingly large numbers, their cheerful 'Kupo!' a familiar sound in the market squares, and a handful of domesticated Digimon that emerged from old municipal data systems have quietly integrated into civic life, helping keep records and routing messages. Yokai with gentle natures — Zashiki-warashi and small household spirits — are said to inhabit every old building, bringing luck to families who leave out offerings. Faction politics barely reach this far; everyone is simply a neighbour.",
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
    "lore": "Named after the ancient Vedic spirit of fire, Agni Peaks holds that flame itself is the first language of the universe, and every monster that dwells here understands a word or two of it. Fire Yokai of the old tradition — the fearsome Kasha and the towering Oni — revere the sacred summits as divine furnaces and hold rites at the solstices that light the peaks orange for miles around. Flame-natured Digimon such as the Agumon evolutionary line feel an almost magnetic pull toward the region, drawn by the resonant heat-data encoded in the volcanic rock; the Digital Dawn faction considers this pilgrimage sacred. In the uppermost crags, Monster Hunter fire drakes — Rathalos-class wyverns and molten-plated brutes — have claimed territories that even the fire priests dare not enter. The region's eternal flames are said to purify both body and spirit, burning away falsehood and weakness in all who pass the trials of courage.",
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
    "lore": "The domain of the sea lord's ancient power, Poseidon's Reach is a place where the ocean is not merely water but a living memory — every current whispering of sunken empires and forgotten covenants. Water Pokémon form complex, layered civilizations beneath the waves, with social hierarchies that rival any surface city, while Water Yokai such as Kappa and the colossal deep-sea Umibōzu hold court in the abyss, demanding tribute from all who sail their waters. Deep-sea Digimon — Gesomon, MarineAngemon, and stranger forms — are drawn to the ancient electromagnetic currents of the sea floor, finding resonance in the mineral-rich sediment that hums with buried data. The Spirit Keepers faction considers the waters of Poseidon's Reach holy ground and maintains strict rites around who may harvest from its depths. When the tides move against the moon's pull, the local oracles say that the sea itself is passing judgment.",
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
    "lore": "Sacred to the Thunderbird spirit of ancient legend, Thunderbird Heights crackles with enough raw electrical energy that compasses spin uselessly and unshielded electronics fuse within minutes of arrival. Scholars of the Digital Dawn faction have long theorized that a vast array of ancient data servers lies buried beneath the mesa's bedrock, their cooling vents creating the supercharged atmosphere and their processing power drawing Electric Digimon — Elecmon, Thunderbirmon, and the elusive MetalEtemon — like moths to a lamp. Electric-type Pokémon thrive in the perpetual storm, their cheek sacs charged before they even hatch, and the migration patterns of Jolteon and Magnezone packs seem to follow underground ley-lines that no surface map has ever captured. The indigenous people of the mesa speak of a pact between the first Storm Eagle and the lightning itself, a promise that the storms will never cease as long as the feathered spirits are honoured. Monster Hunter-class flying wyverns occasionally ride the thermals overhead, drawn by the electromagnetic updrafts.",
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
    "lore": "Blessed by the harvest spirit of agriculture, Demeter's Grove exists in a state of eternal spring — snow never falls here, and the soil is so rich that seeds sprout within hours of planting. Grass-type Yokai are the true, ancient caretakers of this region: Kodama tree-spirits inhabit every old-growth oak, their whispered approval needed before any branch may be cut, while the predatory Jubokko — blood-drinking trees born from ancient battlefield soil — lurk at the forest's twilight edges as grim reminders that nature's bounty has a shadow side. Grass Digimon such as Palmon and Woodmon have thrived here for generations, their organic data-structures weaving into the root networks until it is difficult to tell where the digital ends and the biological begins. The Ranchers faction maintains extensive operations in the more accessible meadowlands, and their relationship with the Kodama is one of careful, ongoing negotiation. At the grove's sacred heart, an ancient temple predates every known civilization, its altar stone perpetually warm to the touch.",
    "mapCoordinates": {
      "x": 51.676217765042985,
      "y": 65.77080907864858,
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
    "lore": "The Jötun Tundra is a place that remembers a colder, older world — its ice never melts, sustained by primordial magic that predates the island's recorded history by aeons. Ice Yokai of the most powerful kind hold dominion here: the Yuki-onna, spectral and beautiful, are said to be the original inhabitants, older even than the frost titan myths, and they watch travellers from snowstorms with eyes like chips of blue glacial glass. The Jötun themselves — the frost giants whose names grace this tundra — may not be mythology at all; Monster Hunter scholars believe the region's titanic, glacially slow mega-beasts are the living descendants of those legendary giants, their bodies so large that frozen tundra forms over their backs as they hibernate across decades. Ice-type Pokémon grow to extraordinary sizes in the region's nutrient-dense permafrost, and the few Ice-aligned Digimon that venture this far from digital infrastructure tend to undergo unusual hardening evolutions. The sculptures of frozen water that dot the landscape — intricate, inexplicable, and metres tall — were made by no human hand.",
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
    "lore": "Inspired by the Kshatriya warrior tradition of honour, duty, and righteous combat, this region is a living martial academy where the philosophy of fighting is taken as seriously as the fighting itself. Fighting-type Pokémon and Pals run training grounds side by side, a rare collaboration born of mutual respect — Machamp spotters help Lyleen Noct students with form, and Pal labour-crews maintain the ancient colosseum's stone seating without complaint. Ancient Digimon warrior forms hold a place of special reverence here: Leomon is practically a patron saint, depicted in every mural and statute, and Greymon lines are treated as honoured visiting champions when they pass through. Nexomon with a fierce competitive nature are frequent challengers at the arena's open rounds, their aggressive streak channelled productively by the structured tournament format. The highest honour a combatant can achieve in Kshatriya Arena is not defeating the strongest opponent, but preserving the spirit of fair combat in the face of overwhelming temptation to cheat.",
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
    "lore": "Crowsfoot Marsh is the kind of place that maps disagree about — its borders shift with the mist, and travellers who follow a straight path through it inevitably emerge from a different side than they entered. The Poison Yokai that call this marsh home are creatures of terrifying craft: Gashadokuro — skeletal giants assembled from the bones of the unburied dead — stalk the deeper bogs, and fragments of what scholars believe may be a dismembered Yamata no Orochi linger as will-o-wisps in the toxic fog over the most poisonous pools. Virus-type Digimon thrive in the corrosive mists, their data-cores protected by adaptive toxin-resistance, and Digimon such as Sukamon and Raremon claim the foulest pockets of the marsh as their sovereign territory. Poison-type Pokémon here are extraordinary alchemists, their venoms carrying medicinal properties that no synthetic lab has ever replicated. The witch's hut at the marsh's centre is very real, and those brave — or foolish — enough to seek it out tend to return changed, if they return at all.",
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
    "lore": "Terra Madre Basin is shaped like a vast cupped hand, as if the earth mother herself scooped it from the bedrock and filled it with fertile soil and canyon-carved rivers. Ground Yokai of ancient lineage serve as the region's invisible government — Tsuchigumo in their earthen aspect, and unnamed deep-ground spirits that no tradition has fully classified — maintaining the soil's miraculous fertility through rites performed in caverns that no outsider has ever been permitted to enter. Ground-type Pokémon grow to prodigious sizes here, the rich mineral earth pushing their development in ways that confound visiting biologists, while Pals have built some of their most sophisticated agricultural settlements in the basin's rolling plains, their labour-culture perfectly suited to the region's ethos of working with the land rather than against it. The canyon's deepest cuts harbour Monster Hunter-scale beasts — burrowing brutes and armoured herbivores the size of houses — that the Spirit Keepers faction protects with fierce dedication. At the basin's sacred heart, the ancient amphitheater rings with ceremony at every equinox, blessing the earth as it has been blessed since before memory.",
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
    "lore": "Sacred to the great feathered serpent spirit of wind and wisdom, Quetzal Winds is a region where the sky is not empty space but a living, breathing highway of ancient significance. Flying-type Yokai and wind-aspect spirits ride the thermals alongside mortal creatures, conducting invisible negotiations that somehow determine whether the rainy season arrives gently or catastrophically. Wind and Sky Digimon — Hawkmon and its evolutions, the magnificent Garudamon — are revered here as sacred kin to the feathered serpent, and the Digital Dawn faction maintains a discrete presence at the uppermost temple to study the relationship between the constant updrafts and the region's peculiar electromagnetic signature. Flying-type Pokémon perform elaborate aerial dances at sunrise that the local sky priests spend lifetimes learning to read, claiming the dances are messages from the serpent spirit itself. The region's floating pyramid temples drift on wind currents, accessible only to those who have learned to read the sky.",
    "mapCoordinates": {
      "x": 78.58166189111749,
      "y": 46.22105287425219,
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
    "lore": "Oracle's Sanctum is built over a network of geological fault vents that release psychoactive vapors, and it is this — combined with something stranger and deeper in the rock — that has made the region a nexus of prophetic power since the first humans settled Conoco Island. Psychic Yokai sit in lotus posture within the innermost temple vapours, their consciousness stretched so thin across possible futures that their bodies sometimes forget to breathe; the acolytes who tend them are trained as much in resuscitation as in ritual. Data-type Digimon find their processing abilities dramatically enhanced near the sacred springs, their calculation speeds spiking as if they are tapping into some vast, invisible computational network buried beneath the stone — the Digital Dawn faction has dispatched no fewer than three research teams to investigate, none of which have published satisfying conclusions. Psychic-type Pokémon migrate here to meditate, and Gardevoir lineages have established permanent communities within the inner sanctum, their presence so entrenched that the oracle priests now consider them indispensable to the prophetic rites. Only the honest of purpose can enter the deepest vaults without being broken by what they find there.",
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
    "lore": "Sacred to the ancient spider lord of stories and cunning, Anansi Woods is a forest that never stops talking — every rustle of silk thread in the canopy is a sentence in some ongoing narrative that the forest has been composing since the first tree took root. Bug Yokai of the old tradition are embedded in every layer of the ecosystem: the great Tsuchigumo spider spirits weave alongside the spider lord's mortal descendants, their webs carrying not just prey but entire genealogies of story, while smaller insect-aspect spirits flit between blossoms acting as living punctuation marks in the forest's endless tale. Bug Digimon have constructed elaborate data-silk networks throughout the forest, information highways that hum between nodes in a pattern that researchers insist is not random, and the Digital Dawn calls the Silk Library's deepest archive their most prized research site. Bug-type Pokémon here are extraordinary storytellers in their own right — the Ariados lay webs that form maps of entire saga-cycles, and Beautifly swarms arrange themselves into formations that the monks interpret as living text. Those who learn to listen to the forest find that it tells the truth, even when the truth is painful.",
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
    "lore": "Stoneheart Cliffs is a landscape that feels older than the island itself — the standing stones predate every known civilization by such a margin that even the most ancient Yokai cannot say who raised them. Rock Yokai in their most powerful form maintain the stones: entities like Gashadokuro in its rare geological aspect — bones of the forgotten earth, slow and immovable as bedrock — serve as wardens, ensuring that the runes carved into the monoliths are never defaced or translated by those unworthy of the knowledge. Rock Digimon such as Gotsumon and Monochromon feel an instinctive duty to these stones, often found pressed against the larger monoliths as if listening, and no researcher has successfully led one away from a stone circle against its will. Rock-type Pokémon have evolved in tandem with the highland's peculiar mineral composition, developing hides that mirror the local stone so precisely they are functionally invisible when still. At celestial alignments — the solstices, the equinoxes, and the days when two moons show simultaneously — the standing stones glow from within, and for a few hours the runes can be read by anyone with an open heart.",
    "mapCoordinates": {
      "x": 63.02292263610316,
      "y": 29.556038407893674,
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
    "lore": "Mictlan Hollows exists in two places simultaneously — the physical world of stone and root, and the realm of spirits, which overlaps it so thoroughly that the boundary becomes meaningless after dark. Ghost Yokai are the native population here, predating any human settlement; they have their own names, their own governance, and their own customs, which the living inhabitants of the surface have slowly learned to respect over centuries of cautious cohabitation. Ghost and Undead Digimon — Bakemon drifting in idle procession, LadyDevimon perched on obsidian pinnacles like dark queens — are drawn to the hollows because the membrane between the Digital World and the spirit realm is at its thinnest here, their data-forms resonating with the afterlife energy like a struck tuning fork. Ghost-type Pokémon are so abundant that newcomers sometimes fail to realize they are surrounded; entire communities of Gastly, Misdreavus, and Drifblim simply drift through solid walls and carry on their affairs with cheerful indifference to the living. The murals that cover every cavern wall depict not mythology but history — a complete record of souls that have passed through on their journey to whatever lies beyond.",
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
    "lore": "Long Valley carries the weight of an imperial age that most of the world has forgotten — its jade palaces were old when the first stone circles were raised in Stoneheart Cliffs, and the Dragon Elders who hold court here can remember events that human history books have not yet catalogued. Dragon Yokai of immense and ancient power reside in the valley's deepest gorges, coiled around pearl-laden rivers, their patience measured in centuries; they are not hostile to visitors, but they are unimpressed by almost everything, which amounts to the same thing from a practical standpoint. Dragon Digimon such as Examon and the Imperialdramon line are treated as honoured kin and occasional emissaries, their digital nature no barrier to the deep respect that Long Valley's culture extends to all genuine dragon-kind. Dragon-type Monster Hunter beasts — the apex wyverns and elder dragons of legend — coexist with the valley's dragon inhabitants in a wary détente that the Dragon Elders maintain through a combination of ancient compact and sheer overwhelming authority. Those who enter with arrogance leave quickly; those who enter with genuine humility may be permitted to study in the great library, if they can read the script.",
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
    "lore": "Raven's Shadow is the kind of place that defies straight answers — its paths bend, its landmarks rearrange themselves overnight, and every resident seems to be keeping at least three secrets simultaneously, which in this region qualifies as unusual restraint. Dark Yokai are entirely at home here: Tanuki shamble through the twilight markets in imperfect human disguise, Kitsune with seven or eight tails hold informal court at crossroads shrines, and the trickster aspect of the local spirit tradition runs so deep that even the cartography guilds have stopped trying to make accurate maps of the region. Dark and Virus Digimon prefer the perpetual twilight with an almost aesthetic appreciation — Impmon loitering on rooftops, Devimon in self-imposed semi-retirement in the deeper shadow districts — finding that their data-forms are most stable when neither fully lit nor fully dark. Dark-type Pokémon have evolved remarkable cognitive flexibility here, their cunning honed by generations of outwitting creatures that are themselves masters of deception. The lessons taught in Raven's Shadow are real, important, and almost never comfortable to receive.",
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
    "lore": "Hephaestus Forge burns at the intersection of volcanic fury and disciplined craft — a region where the mountain itself is a tool, and the monsters that live here have made it the finest workshop in the known world. Steel-type Pals are the backbone of the labour force, their work ethic legendary even by Pal standards; Anubis operate the smelters with precise timing, Wixen tend the flux calculations, and Orserk handle the most energy-intensive phases of alloy refinement. Steel-aligned Digimon are drawn to the forge's unique energy with almost compulsive need — MetalGreymon seeks to bathe its chrome plating in the divine fire, and Hagurumon colonies integrate themselves into the forge's mechanical apparatus until it becomes impossible to say where machine ends and monster begins. The divine workshop at the region's heart burns with fire that has not been extinguished in recorded history, and scholars disagree on whether the heat sustains the forges or the forges sustain the heat. The metalwork produced here can only be called legendary by those who have never seen it; those who have call it something closer to sacred.",
    "mapCoordinates": {
      "x": 59.856733524355306,
      "y": 21.720920313994903,
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
    "lore": "Seelie Courts is the realm of the benevolent fairy court, a place where beauty is not aesthetic preference but fundamental law — ugliness, in all its forms, gradually unravels here as if the region itself refuses to sustain it. Fairy Yokai live under the court's protection in arrangements that predate human civilization: Tengu in their graceful avian aspect serve as heralds and border-wardens, and the beloved Zashiki-warashi — child-spirits who bring fortune to households — cluster densely in every settlement, their presence a reliable indicator that the court considers a home worthy of blessing. Fairy Digimon dance at the eternal court's gatherings, their light-data weaving into the bioluminescent flowering that illuminates the Seelie nights, and Gatomon in her celestial aspect is occasionally glimpsed presiding over these gatherings as an honoured guest of the court. Fairy-type Pokémon thrive in a state of perpetual creative joy, and the region's Togekiss are so relaxed that they have been known to fall asleep mid-flight, trusting the court's magic to keep them aloft. Time moves according to emotional tides rather than celestial mechanics here — if you are having a magnificent time, you will have been there a week before you notice; if you are suffering, every minute is a century.",
    "mapCoordinates": {
      "x": 75.77363896848138,
      "y": 34.334720413126924,
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
    "lore": "Pirates Bay is the wild edge of Conoco Island — the place the maps end and the legends begin, where the rule of law thins to a suggestion and the only currency that truly matters is the reputation you've earned through audacity or fear. The bay is a lawless melting pot of every monster type imaginable: Water-type Pokémon and sea Yokai crew the pirate vessels alongside their human counterparts, Flying-type monsters serve as lookouts from the crow's nests, and Ground-type Pals handle the heavy cargo work at the docks without complaint or contract. The Nyakuza criminal faction has deep roots here, and their monster associates — fast, cunning, and difficult to track — make them a powerful presence in the hidden coves and black-market back alleys. The waters themselves are dense with Wild Monsters of extraordinary variety, drawn by the warm currents and the regular traffic of monster-laden vessels passing through; more than one pirate captain has built their fortune not from treasure but from what they've caught in these waters. Visitors are advised to tread carefully — but those who carry themselves with confidence and respect the unwritten codes of the bay will find it surprisingly hospitable.",
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
    "lore": "The Primordial Jungle exists outside normal time in a way that is not metaphor but measurable fact — radiocarbon dating of its soil returns impossible readings, and electronic clocks malfunction within a day of entering the canopy. Fossil Pokémon that have no business being alive walk freely alongside their living relatives, the extinction event that should have claimed them apparently never arriving in this particular pocket of history. Ancient Digimon in their most primordial forms — data-entities so old their code predates any known Digimon taxonomy — drift between the enormous trees like living ghosts of the Digital World's earliest age, communicating in signal patterns that Digital Dawn scholars have spent years trying to decode. Primal Yokai of immense and unnamed power tend the deep jungle as they have always done, their forms drawn from concepts that predate human language, their attitude toward visitors ranging from curious to territorial depending on factors that cannot be predicted. Monster Hunter apex beasts — titanosaurs, elder drakes, and colossal armoured behemoths — rule the deep interior with absolute authority, and the local tribes have built their entire culture around coexistence with creatures that could level a settlement without noticing.",
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
    "lore": "Crystal Cove is one of the most scientifically baffling locations in the known world — its crystalline formations act as natural time capsules, preserving ancient marine Monsters in states of perfect stasis that are indistinguishable from life, yet technically not life as any biologist would define it. The crystals pulse with a slow, deep temporal energy, creating pockets where time stutters: stand in one spot and a minute passes normally; step two feet to the left and that same minute takes an hour, or a second. Some Digimon data-patterns appear to have crystallized here long ago, their digital signatures frozen in iridescent mineral amber — the Digital Dawn calls these crystallized data-ghosts 'digital fossils' and treats their study as their most sacred research obligation. Ancient Water-type Pokémon of forms that no modern classification system recognizes drift in the deepest crystal chambers, preserved but faintly aware, their eyes tracking visitors with slow, deep curiosity. The local coastal tribes speak of the crystals as the sea's memory — everything the ocean has ever witnessed, stored in mineral silence.",
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
    "lore": "Volcanic Peaks rises from the heart of the Primordial Jungle like a fist of raw geological fury, its summit perpetually veiled in ash-cloud that glows orange from below at night. For centuries, the Emberkin clans have made sacred pacts with the Great Forge Spirit buried in the magma chambers beneath the islands, believing every lava flow a blessing to temper their tools and strengthen their bonds with the valley’s monstrous guardians. Monster Hunter-class fire drakes — ancient Rathalos and Teostra-kin bred in isolation — rule the upper slopes with the casual authority of creatures that have never known a serious challenger, and the Emberkin maintain respectful distances that generations of painful learning have taught them is the correct approach. Fire-type Pokémon that reach the volcanic vents undergo accelerated, unusual evolutions, the intense heat catalyzing changes that would take decades elsewhere into a matter of hours. The entire archipelago is aware when the great volcano stirs; the ground trembles all the way to the coast, and every monster on every island pauses, briefly, to acknowledge it.",
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
    "lore": "Mist Marshlands is whispered about even among the archipelago's secretive tribes as the nursery of the ancient world — the place where the first amphibious Monsters crawled from primordial water to land, and where that process has never entirely stopped. Ghost Yokai of a particularly primal and wordless kind haunt the deepest fog-banks, their forms barely distinct from the mist itself, serving as the unacknowledged guardians of the ancient breeding grounds that still function in the marsh's heart exactly as they did millions of years ago. Ancient Water and Grass Pokémon of forms that appear in no modern field guide breed in the sheltered reed thickets, their eggs tended by Ghost-type companions who seem to understand the importance of the work even if they cannot articulate it. Some researchers believe the perpetual mist itself carries biological information — spores, proteins, genetic memories — that influences the development of every creature that breathes it long enough. The fog here never fully lifts, even on the clearest days elsewhere in the archipelago; some things, the marshlands seem to say, should remain hidden from the light.",
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
    "lore": "Nimbus Capital is built on the largest stable cloud formation in the known world, its streets and towers formed from compressed stormcloud solidified by generations of ambient sky-magic into something that looks like marble but weighs nothing at all. The city follows celestial patterns as it rotates slowly through the heavens, its position on any given day determinable only by those born under the sky's particular rhythms — ground-worlders require a sky-born guide or risk watching the capital drift out of reach mid-crossing. Flying Digimon serve as the city's royal guard and diplomatic corps: Birdramon is the traditional mount of the sky patrol, Garudamon holds a place of honour equivalent to a marshal, and the elegant Silphymon is employed in the messenger services that connect Nimbus Capital to every other floating island community. Flying-type Pokémon of extraordinary beauty have evolved in the cloud environment, their plumage adapted to low-UV, high-altitude living in ways that make them spectacular even by sky standards. The ground world sends tribute and trade delegations that arrive by hot-air balloon and leave with treaties that no ground-bound lawyer has ever fully understood.",
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
    "lore": "Aurora Heights is so high that the sky above it is a deep indigo even at noon, and at night the aurora fills the entire visible vault with curtains of light that shift in patterns the inhabitants have spent generations learning to interpret. Psychic-type Digimon find their processing dramatically elevated at this altitude — the electromagnetic activity of the aurora interfaces with their data-cores in ways that produce calculation speeds and perceptive clarity beyond anything achievable at lower elevations, and the Digital Dawn maintains a permanent research station here staffed entirely by Digimon and their handlers. Legendary Pokémon of celestial nature have been sighted here with regularity that defies the word 'legendary': Jirachi, Clefable lineages, and forms that match no published classification drift between the aurora curtains as if on familiar errands. Ice and Fairy Yokai of the most refined and remote kind inhabit the permanent aurora zones, their forms so deeply adapted to the celestial light that they become partially invisible during the most intense auroral displays. The sky oracle tradition that Aurora Heights maintains serves both the Sky Isles and, through careful diplomatic channel, the people of Conoco Island below.",
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
    "lore": "The Tempest Zones have been in continuous storm for as long as any record exists — the lightning strikes so frequently that the islands themselves are permanently scarred, their surfaces vitrified into glass plains that crackle underfoot and reflect every bolt in a thousand directions. Electric Digimon feed directly on the raw lightning here, their data-cores charged to extraordinary capacity; Thunderbirmon and Voltobaltomon are the most powerful specimens ever recorded, their digital architecture essentially redesigned by generations of pure electrical saturation. Monster Hunter-class flying wyverns hunt the storm currents with terrifying grace, using the electromagnetic fields to locate prey through the opaque cloud cover, and the Wyvern People tribe considers the Tempest Zones their most sacred proving ground. Electric-type Pokémon have evolved features here that no ground-world specimen possesses: redundant electrical organs, storm-sense that detects lightning strikes before they form, and fur or feathers that channel current rather than resist it. The legends are not entirely metaphorical — those who genuinely master storm navigation in the Tempest Zones do develop an intuitive understanding of weather that functions as a kind of meteorological precognition.",
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
    "lore": "The Draconic Abyss is not misnamed — it is both the highest point of the Sky Isles and a kind of abyss in the philosophical sense, a place where conventional rules of survival, civilisation, and common sense cease to apply. The oldest Dragon Digimon make their lairs in the citadels of bone and cooled dragonfire that dot the floating peaks: Examon keeps court in the highest spire, Imperialdramon patrols the abyss-gaps between islands with territorial absolutism, and SkullGreymon-aspect entities drift through the lower fog as grim territorial markers. Dragon-type Monster Hunter elder dragons — Fatalis-kin and other apex entities that the Wyrmclaw Tribe reveres as living gods — occupy the most extreme reaches, their mere breath capable of scorching stone to glass. The Wyrmclaw Tribe, humans who made blood-pacts with dragons so many generations ago that draconic traits have begun appearing in their bloodline, serve as both the tribe of this region and the self-appointed gatekeepers of it; outsiders who enter without their escort rarely exit. The very air at this altitude burns with concentrated draconic energy, and visitors without both extraordinary skill and an explicit dragon blessing will find the region uninhabitable within hours.",
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
    "lore": "Said to be the mountain where the First Forge Spirit tempered dawnlight into metal, Adamant Peak is a place of near-mythological significance to every Steel-type monster that walks Conoco Island. The harmonic veins that run through its core emit a frequency that MetalGreymon-line Digimon describe, through imperfect translation, as 'the song before sound' — a resonance that precedes all other forged things. Agni Peaks fire priests consider the summit a sacred adjunct to their own temples, maintaining that the mountain's crystal-steel is fire and earth made inseparable, and that to work it is to understand both elements simultaneously.",
    "history": "Mining clans once warred bitterly over the harmonic veins that run through Adamant Peak's core, believing that mastery of the ore would grant power over metal itself. The feud ended not through treaty but through a catastrophic molten collapse that sealed most of the deep tunnels, burying three rival clans' entire stores of extracted ore under kilometres of cooling slag. Generations later, archaeologists and Digimon archaeologists working jointly discovered that the collapse may have been deliberate — a sacrifice by one clan to prevent any from winning — but the question of which clan made that choice has never been resolved.",
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
    "lore": "Agni City is built around the sacred flames of the ancient fire spirit — a set of eternal pyres that have not been extinguished since the city's founding, tended in rotating shifts by priests who consider a moment of darkness the gravest possible failure. Fire Yokai such as the Kasha and lesser flame-spirits gather at the temple precincts during the sacred dawn and dusk rites, visible to the trained eye as heat-distortions that move with purpose and occasionally bow toward the altars. Digimon of the Agumon and Meramon evolutionary lines feel such a deep resonance with the city's sacred fire that the Digital Dawn faction has negotiated a permanent presence here, participating in purification ceremonies and maintaining that flame-data is among the oldest recorded patterns in Digimon evolution.",
    "history": "Constructed by fire priests and devotees to honour the ancient fire spirit across generations of dedicated labour, the city has weathered volcanic eruptions that by all engineering logic should have reduced it to cinders. Each eruption is recorded in the temple annals not as disaster but as trial — a purification of the city itself — and the faith of the inhabitants has, remarkably, been repaid: the lava flows have curved around the sacred precincts three times in recorded history, as if the fire itself respects the priests who tend it. The most recent eruption, two generations ago, deposited a fresh layer of obsidian that the city now uses as its finest building material.",
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
    "description": "A mountain city carved into living volcanic slopes, its sacred fire temples connected by flowing lava channels that both power and define the settlement. Every building is faced with heat-polished obsidian, every street lit by the glow of a sacred pyre, and the air itself carries the weight of ten thousand years of devotional smoke.",
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
    "lore": "Amber Village was founded by artisans who discovered that the Primordial Jungle's amber deposits contained more than preserved insects — they held entire ecosystems in suspended animation, including species that no living naturalist had ever encountered. The amber here is not merely fossilised resin; it pulses with a slow, amber-coloured light in the dead of night, and creatures preserved within it are sometimes found facing different directions than they were the day before. Fossil Pokémon revived from amber samples collected near the village display unusual traits — memories of eras their species should not remember — and the village scholars believe the amber carries information as well as life, imprinting the past on anything it touches long enough.",
    "history": "The village has existed for over two centuries, originally established by amber miners drawn by stories of an impossible find: a Pokémon the size of a barn, perfectly preserved in a deposit the size of a small hill, its eyes still faintly lit with bioluminescence. That original find was never fully excavated — the local tribespeople who guided the first miners insisted the amber creature was to be left in place — and the mine was sealed by mutual agreement. The village has since built itself into a world-class centre of amber-craft and preservation research, though the sealed mine remains the subject of considerable, ongoing speculation.",
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
    "description": "A craftsman's village nestled among ancient amber deposits that preserve creatures from millions of years ago in honeyed crystalline tombs. The buildings themselves are faced with polished amber panes through which fossilised forms are faintly visible, making the entire settlement feel like a museum that has chosen, somehow, to still be alive.",
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
    "lore": "Amphitrite Town honours the Queen of the Seas, the sea lord's beloved consort, whose influence over the water is said to be softer but no less absolute than her partner's tempestuous dominion. The sea-blessed pearl shrines that line the waterfront genuinely glow at high tide — a phosphorescent phenomenon that biologists attribute to bioluminescent microorganisms but that the town's priestesses consider a nightly renewal of divine attention. Water Yokai of the gentle Kappa tradition maintain the ritual pools in the inner temple, their particular brand of water-craft perfectly suited to the benediction rites that the priestesses perform over every couple who comes seeking blessing.",
    "history": "Founded by priestesses devoted to the sea lady who, according to tradition, arrived by boat from no known harbour and built the first temple with their bare hands over a single tide cycle. The town has become one of the most significant pilgrimage sites in Poseidon's Reach, and the wedding ceremonies performed here are legally recognised across every major jurisdiction on Conoco Island as particularly binding — a fact that the town's legal professionals attribute to the unusually high rate at which the blessed unions remain intact across lifetimes.",
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
    "lore": "Local legends claim each moon cycle imprints a new layer of the world’s history into the reef — that the coral itself is a living archive, encoding events into its chemical structure at a rate imperceptible to any individual observer but readable across centuries by those who know how to listen. The Memory Polyps that crust the oldest obelisks carry psychic impressions so dense that Slowking-line Pokémon have been observed pressing their crowns against the coral for hours at a time, emerging with knowledge they cannot entirely articulate. Water Digimon of the deep-ocean lineage — particularly Gesomon and the rare Neptunemon — treat the reef’s sonar obelisks as waypoints in a navigation system that predates any charted route, suggesting the reef was a network hub long before it became a natural wonder.",
    "history": "The Ancient Reef formed over thousands of years around a cluster of submerged temples whose original purpose is debated among scholars — some believe they were built to honour the sea lord, others that they served as a communication network between underwater civilisations that no longer exist. Their carved surfaces now guide migrating hybrid populations along routes so consistent across generations that the paths have worn smooth channels in the reef floor. A joint Ranger and Digital Dawn expedition mapped the carvings three seasons ago; their report was classified, and the expedition members have declined all interviews.",
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
    "lore": "Only those whose roar resonates with the caldera’s deep geological pulse may sit upon the throne stones — a requirement that is less metaphorical than it sounds, as the basalt resonance pillars genuinely vibrate in response to certain frequencies of sound, heat, and Draconic energy. Dragon Digimon such as KaiserGreymon and the Imperialdramon line make pilgrimage to the Apex Throne as a rite of passage, submitting their call to the mountain’s judgment before claiming any territory below. Monster Hunter fire drakes consider the caldera rim the ultimate proving ground, and the layered scar-marks on the trial ridges are a geological record of every dominance bout fought here across uncountable seasons.",
    "history": "The Apex Throne has served as the site of dominance convergence cycles since before any written record on Conoco Island — the basalt rune-scoring on the ridge faces tells of lineages and succession moments going back to an era when the mountain was ten metres taller and the surrounding region was entirely uninhabited by any creature smaller than a house. The most recent succession event occurred three generations ago, ending a territorial dispute between two Dragon-type Monster Hunter lineages that had lasted forty years; the resolution took three days of uninterrupted trial combat and reshaped the upper caldera rim measurably.",
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
    "lore": "Built where dawn’s first ray once ignited an eternal wick — or so the founding myth holds, and in a region where dawn behaves as dramatically as it does at this elevation, the story is easy to believe. The mirror array plazas channel morning light with a precision that no contemporary engineering guild has been able to fully replicate, leading to persistent theories that the original architects had guidance from either Fire-Psychic hybrid Digimon or Psychic Yokai whose attunement to solar energy went beyond mere biology. Fire-type Pokémon that spend extended periods within the solar hymn corridors undergo unusually accelerated development, their instincts shifting toward the contemplative in ways that confound trainers expecting battle-readiness.",
    "history": "Expanded over many generations by pilgrimage orders who arrived from various regions of Conoco Island drawn by the reputation of the sacred light, Apollo Temple has grown from a single altar stone to a complex of prism plazas and radiant choir chambers that covers nearly the entire ridge. The most significant expansion occurred after a triple solar flare event that scorched the original structure to its foundations — the rebuilt temple was oriented using the flare-path as a calibration reference, making the rebuilt mirror array the most precisely aligned heliomantic structure in the known world.",
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
    "lore": "Atlantis City serves as the magnificent capital of the sea lord's underwater kingdom, a place where ancient oceanic power merged with divine architecture to create something that should not, by any reasonable measure, be sustainable — and yet it has endured for over two millennia without significant structural failure. Water Pokémon of noble bearing constitute most of the city's upper-class citizenry, their complex social hierarchies playing out in the crystal dome chambers with a formality that surface-world diplomats find simultaneously admirable and exhausting. Sea Yokai of the deep tradition — the great Umibōzu is said to have an audience chamber in the lowest stratum of the city, accessed only by the most trusted water-kind — hold their own court in parallel to the surface government, their authority in certain matters absolute and unchallenged by any mortal law.",
    "history": "Built by ancient sea peoples whose civilisation was, by all accounts, far more advanced than any contemporary record suggests, Atlantis City has stood beneath the waves for over two millennia in a state of extraordinary preservation. The crystal dome technology that keeps the sea water at bay is not fully understood by modern engineers — the closest analysis suggests it operates on a combination of mineral resonance and something that Digimon scholars identify as stabilised data-lattice, implying that the city's builders may have had access to Digital World technology at a time when no such concept should have existed. Each passing century adds new coral architecture, growing the city organically in ways its original designers may or may not have anticipated.",
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
    "description": "The magnificent underwater capital of Poseidon's Reach, its crystal domes sheltering flowing water-streets and vast coral palaces where the sea nobility conducts affairs with ancient ceremony. The city glows from within with bioluminescent organisms so integrated into its architecture that they have been listed as protected residents for centuries.",
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
    "lore": "Villagers believe each aurora ribbon is a woven promise from ancestral guardians — a tradition that is not merely sentimental, as the aurora here does respond to certain sounds and movements in ways that atmospheric physics alone struggles to explain. Ice Yokai of the Yuki-onna lineage have been observed walking through the village on the clearest aurora nights, their presence neither threatening nor entirely comfortable, their expressions absorbed in the sky display as if reading a letter from someone they miss. Ice and Fairy Digimon such as IceLeomon and Lilamon are drawn to the village's quiet, their data-forms stabilised by the consistent cold and the aurora's electromagnetic regularity in ways that more chaotic environments cannot provide.",
    "history": "Founded around a geothermal spring that provided warmth sufficient to prevent the total winter isolation that claims most settlements this deep in the Jötun Tundra, Aurora Village grew from a single family's survival shelter into a community of several hundred over four generations of careful, deliberate expansion. The spring is considered sacred — the village's founding family maintained that it was a gift from one of the ancestral Ice Yokai, and the subsequent arrival of those spirits during aurora events has done nothing to challenge the tradition. The Prism Lantern tradition was developed two generations in, when a village craftsperson discovered that correctly faceted ice crystal could maintain the aurora's light long after the sky had gone dark.",
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
    "lore": "Founded by hydromancers who believed that water's natural state was not the river or the ocean but something freer — a relationship with gravity that the element had simply not yet discovered — Avalon City represents the most ambitious aquatic engineering project on Conoco Island. MarineAngemon and other aerial Water Digimon were key collaborators in the city's original construction, their ability to move freely between water and air essential to testing the early levitation matrices before the platforms were stable enough to bear weight. The runic aqueduct rings that define the city's architecture are maintained jointly by human hydromancers and Bronzong-line Pokémon whose Steel/Psychic nature makes them uniquely suited to the maintenance of psionically-reinforced infrastructure.",
    "history": "Avalon City expanded ring by ring over nearly two centuries as the levitation matrix technology grew more stable and the hydromancers who founded it passed their knowledge to increasingly numerous successors. The innermost ring — the original gestation chamber of the whole project — remains the most stable and least understood, its matrix formula having been lost with the founder, who departed the city one night and was never seen again, leaving only a note that said the water would remember what to do. The note is preserved in the Mist Court Plaza, under glass, and has never been analysed for magical resonance at the founder's written request.",
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
    "lore": "Bog Town is proof that resilience and ingenuity can make a home of anywhere — built on stilts above perpetually waterlogged ground, its residents have turned what most people consider an obstacle into an identity. The will-o'-wisps that drift along the waterways are a source of genuine local pride: they are not, the guides insist firmly, dangerous — they are the ambient expressions of the marsh's Ghost and Poison Yokai neighbors, conducting their own business in the liminal space between solid ground and open water. Virus-type Digimon that pass through the marsh tend to linger near Bog Town's lantern-lit docks, drawn by the same peat-mist chemistry that makes the fog-effects here particularly rich for their data-metabolism.",
    "history": "Founded by settlers who arrived in the marsh as refugees from a territorial dispute in the drier lands to the north, the original Bog Town inhabitants had no choice but to learn the marsh or perish in it. They chose to learn it, and within two generations their children could navigate the waterways blindfolded by sound alone. The community that emerged from those difficult early decades became one of the most cohesive and self-sufficient on Conoco Island, developing construction techniques, navigation methods, and ecological practices that the wider world is only now beginning to study seriously.",
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
    "lore": "Said to have formed where a primordial titan — one of the first Jötun, whose physical scale was geological rather than merely impressive — fell in the age before memory and merged with the eternal frost, its bones becoming the fortress's impossible architecture over aeons of slow glaciation. The resonant tones that the wind produces passing through the hollow spinal columns are not accidental: Ice Yokai of the Yuki-onna tradition maintain that the sound is the titan's slow, ongoing dream, and that to listen with the right quality of attention is to hear something approaching prophecy. Ghost and Ice Digimon — Froslass-kin entities and SkullGreymon in its most glacial aspect — are drawn to the citadel as to a site of primal data-resonance, their presence simultaneously protective of the structure and deeply territorial toward outsiders.",
    "history": "The Bone Citadel's expansion from a naturally occurring skeletal formation to a functional fortress began with the frost clerics who arrived seeking a site of maximum spiritual cold — the meeting point of death and ice they called the Threshold of Stillness. Over generations they bound stray Ice and Ghost spirits into the structural lattice, a practice that was controversial at the time and remains contested by modern Spirit Keeper ethicists, who argue that no spirit should be architectural material regardless of consent. The spirits themselves have never been successfully surveyed on the question, which is either reassuring or deeply suspicious depending on one's philosophical position.",
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
    "lore": "Built by traders who followed the ossuary salvage routes through the Jötun Tundra and eventually decided that the junction between three such routes was better as a settlement than a campsite, Bone Town has a pragmatism about it that its more mystically-inclined tundra neighbours sometimes find refreshing and sometimes find unsettling. The bone totems that line the main thoroughfare are functional as much as ceremonial — they carry minor ward-charges that discourage the more aggressive Ghost-type entities from entering town limits, a quiet negotiation with the supernatural that the residents manage with the same matter-of-fact competence they apply to frozen pipes and supply wagon scheduling. Ghost Digimon such as Bakemon drift at the ward-perimeter with what locals describe as 'respectful disappointment,' and the relationship is considered mutually acceptable.",
    "history": "Bone Town grew from a single trading post established at the confluence of three frost-clan ossuary salvage routes, a neutral exchange point that the clans agreed to leave unaffiliated so that all could use it without political complication. That neutral status has been maintained through every territorial shift in the surrounding tundra over three hundred years of recorded history, a diplomatic achievement that the town's current leadership credits to the founding charter's single critical clause: no clan colours, banners, or territorial markers within half a league of the central market, ever, without exception.",
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
    "lore": "The eternal bonfire has burned for over five hundred years, fed by a combination of community dedication, magical resilience, and the faint but genuine attention of the Hearthfall Commons' household Yokai — the Zashiki-warashi who inhabit every old building in the region consider the bonfire their communal hearth, and it is their passive blessing that keeps it burning through storms that should logically have extinguished it decades ago. Story Sprites — Fairy-type Pokémon and Digimon of the Fairymon aspect — gather at the fire's edge on festival nights to collect the tales told there, weaving them into the ambient folklore of the region in ways that researchers have compared to a living oral tradition with its own curatorial instincts. Moogles settled in this town early and enthusiastically, their kupo-punctuated commentary on the storytelling circle a beloved fixture of festival nights.",
    "history": "Bonfire Town was founded around a natural eternal flame that early northern settlers discovered burning in a clearing with no discernible fuel source — it was simply burning, had apparently always been burning, and gave every indication of intending to continue regardless of anyone's plans for the area. The settlers built around it with the quiet confidence of people who recognised a good omen when they saw one, and the town grew as travellers stopped to warm themselves and found the fire's influence on conversation so pleasant that they stayed longer than intended. The festival infrastructure grew organically over generations until the town became one of the most celebrated gathering places on Conoco Island.",
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
    "lore": "Every cairn shadow cast at the solstice is recorded in the village annals with the same precision and gravity that other settlements apply to births and deaths — the shadow-lengths tell, to those trained in the reading of them, where the permafrost has shifted, which glacier arms are retreating or advancing, and whether the next season's storms will arrive from the east or the north. Rock and Ice Yokai of the cairn tradition maintain certain stones that were placed by no human hand, their positions shifting slightly each year in patterns that the village elders track with careful notation and considerable respect. Ice Digimon such as Icemon and the occasional Monzaemon in its coldest variant have integrated into the village's stone-reading practice with the methodical dedication that seems to be a characteristic of Ice-aligned Digital creatures.",
    "history": "Founded by migratory chart keepers whose entire cultural purpose was the mapping of permafrost drift across the Jötun Tundra, Cairn Town began as a series of seasonal measurement camps that gradually accumulated enough permanent infrastructure to qualify as a settlement. The transition from camp to town happened slowly and without any conscious decision being made — one winter the chart keepers simply stopped leaving, finding that the complexity of the data they were generating required year-round presence to interpret properly. The measurement tradition has been maintained unbroken since the founding, making Cairn Town's permafrost archives one of the most comprehensive glaciological records on Conoco Island.",
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
    "lore": "Cauldron Village represents the lighter and more fragrant side of Crowsfoot Marsh's alchemical tradition — a deliberate philosophical choice made by its founders, who understood perfectly well how to brew darker things and simply declined to. The ingredient gardens that surround every home are tended with the assistance of Herb Fairies — Fairy and Grass-type Pokémon whose presence is considered essential to the more delicate brews — and the relationship between the village's human alchemists and their monster partners is so intertwined that recipes are passed down as shared memories rather than written formulae. Ghost Digimon such as Bakemon drift through the herb gardens on still mornings as a matter of habit, their proximity improving certain fermentation processes in ways that the village's chief brewer acknowledges, somewhat uncomfortably, she cannot entirely explain.",
    "history": "Established by hedge witches who arrived in the marsh as a deliberate act of counter-identity — choosing to settle adjacent to the region's darker reputation and make something useful of the same ingredients that others used for harmful purposes — Cauldron Village has been a centre of healing alchemy for over a century. Its founding covenant required every practitioner to submit their three most powerful formulas to community review before using them, a tradition that has both prevented harm and created the village's famous collaborative recipe archive, which is considered the finest collection of marsh-origin medicinal formulae in the world.",
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
    "lore": "Pilgrims claim that visions arrive in the refraction halos cast by the prism dishes — not metaphorical visions of inspiration but specific, detailed, and occasionally alarming glimpses of events not yet occurred. Psychic-type Digimon find their predictive processing dramatically enhanced within the shrine's inner ring, and several Wisemon-line entities have taken up semi-permanent residence here, their oracle functions running more efficiently at this altitude and light-saturation than anywhere else they have tried. The interaction between the shrine's solar fire rites and the shrine's Psychic energy is one of the more studied phenomena on the Agni Peaks, producing a hybrid resonance that fire priests call 'the illuminated mind' and Psychic Pokémon simply experience as unusually comfortable clarity.",
    "history": "The Celestial Shrine's most significant expansion occurred after a recorded triple solar flare event that burned the original structure to its foundations but simultaneously left behind a set of glass formations in the wreckage that, when correctly oriented, focused light with greater precision than anything the original architects had achieved. The rebuilt shrine was constructed around these accidental gifts, treating the flare-event not as disaster but as divine intervention — an opinion that was initially controversial among the more empirically-minded members of the pilgrimage orders but which became harder to argue with as the rebuilt shrine's oracular accuracy proved measurably superior to its predecessor's.",
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
    "lore": "Ceres Town represents the deeply practical side of Demeter's Grove's agricultural bounty — a place where the grove's eternal-spring magic is channelled not into ceremony but into production, and where the question asked of any blessing is 'yes, but how many loaves does it make?' Ground and Grass-type Pokémon work the fields as willing partners rather than labour, their interest in the harvest as genuine as any farmer's, and the irrigation rune-networks that keep every field optimally watered are maintained jointly by human engineers and Patamon-line Digimon whose gentle data-weaving has proven surprisingly compatible with agricultural monitoring systems. Kodama tree-spirits from the adjacent grove edge drift through the fields on market mornings, sampling the grain with an approving attentiveness that the farmers have learned to interpret as a quality indicator more reliable than any instrument.",
    "history": "Founded by settlers who arrived in Demeter's Grove with advanced agricultural techniques and the belief that the region's extraordinary natural abundance could be doubled by systematic application of good farming practice — a theory that proved entirely correct within the first growing season, and spectacularly so within the first decade. The town grew rapidly as farming communities across Conoco Island sent apprentices to study its methods, and the grain markets that developed to handle the surplus became one of the island's primary commodity exchanges. The founding settlers' decision to maintain a portion of every field as ungrazed wildflower meadow — a compromise with the Kodama that has been honoured in every subsequent generation — is credited by modern ecologists as the reason the soil has not depleted in over two centuries of intensive cultivation.",
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
    "lore": "The Cloud Palace is the seat of power for the Sky Kings, ancient rulers who have governed the floating isles for millennia in a state of dignified continuity that ground-world governments regard with equal parts admiration and bafflement. Built from clouds given permanent form through sky magic the original architects did not fully document before departing, the palace exists in a state between solid and ethereal — its walls opaque or translucent depending on the light and the mood of the attending court, its corridors occasionally rearranging themselves between one audience and the next. Flying Digimon form the core of the palace's royal guard: Garudamon holds the rank of First Wing, Silphymon serves as chief courier, and the rare Phoenixmon is permitted to nest in the upper spire as a mark of the sky royalty's favour — an arrangement the Phoenixmon seems to find entirely acceptable.",
    "history": "Constructed over a thousand years ago by the first Sky King using techniques that have never been fully replicated, the Cloud Palace has served as the centre of sky realm politics and culture through every succession, every war between the Featherless Ones and the Wyvern People, and at least three occasions when it was partially destroyed and had to be rebuilt around its own ruins. It rotates through the heavens in a pattern that the royal astronomers can predict to the minute, following ancient star-chart routes that were established before the palace was built — as if the route existed first, and the palace was placed upon it as a carriage is placed upon rails.",
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
    "lore": "The Coastal Settlement serves as the first acclimation point for deeper reef expeditions — the place where visitors breathe salt air long enough to stop feeling the pull of the mainland, and where the tidal nursery pools introduce newcomers to the juvenile Water-type monsters that will become their underwater companions. The bioluminescent dock organisms are not installed lighting but a Water/Grass Digimon colony that has chosen to live there symbiotically, their data-forms feeding on the mineral-rich tidal water and providing light in exchange, a negotiated arrangement that no one can quite remember the origin of but that everyone agrees is working well. Water Yokai of the smaller, benevolent Kappa tradition maintain the tidal nursery pools with dedicated attention, their particular expertise in aquatic ecosystem management making them invaluable partners to the reef stewards.",
    "history": "Founded by reef stewards who arrived to find the coastal shallows badly over-harvested — the previous generation of resource extraction having taken far more than the ecosystem could replace in a human lifetime — the settlement's entire founding purpose was rehabilitation rather than exploitation. The founders' children grew up in a coastal environment that was visibly recovering, and the experience shaped the settlement's culture so thoroughly that voluntary resource limits have been maintained without legal compulsion ever since, a degree of ecological self-governance that visiting researchers from other regions routinely cite as extraordinary.",
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
    "lore": "Corvus City was founded where three natural storm lanes intersect, creating a node of perpetual electrical energy intense enough to power a metropolis with charge to spare — a fact that the city's founders understood intuitively before any science existed to explain it. Electric and Dark Digimon are the city's most distinguished permanent residents: Thunderbirmon serves on the weather-monitoring council, Garudamon-aspect entities patrol the sky-bridge network, and various Virus-type Digimon whose digital nature resonates with the raw electromagnetic environment have been granted residency status in the city's lower tiers in exchange for infrastructure maintenance contributions. The dark corvid monsters that give the city its name are not merely ornamental — they serve as biological storm-sensors whose behaviour changes measurably twelve hours before any significant weather event, a fact that the city's meteorological service relies upon as heavily as any instrument.",
    "history": "Corvus City grew vertically rather than horizontally because the storm-lane intersection that powers it occupies a finite area — expanding outward would have placed new districts outside the charge zone, while building upward kept every level within reach of the electrical harvest. The storage coil technology that enables the city to bank lightning for the brief clear periods expanded over three generations of incremental improvement, each advancement allowing a new tier of construction that in turn required the next advancement to power. The current city is the eighth design iteration, each previous version having been partially or wholly rebuilt following a coil failure, giving Corvus City an architectural palimpsest quality — historical layers visible in the older sections if one knows how to look.",
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
    "lore": "Legend says that the smith clans' first anvil was carved from the heart of a fallen glacier — not metaphorically, but literally, the central crystalline core of a retreating ice mass that the clans' founders split open and found to contain a mineral perfectly suited to resonant metalworking. The menhir rings that surround the village are not decorative; they are the world's largest natural tuning fork system, oriented to amplify the harmonic resonance that the smiths use to test alloy integrity without destructive testing — a technique so sensitive that Stone Eyeling monsters can feel the menhir hum change when a flawed ingot is placed in the circuit. Steel-type Pals work the forge pits with the smith clans in a partnership of genuine mutual respect, the Anubis smiths and Wixen flux-specialists contributing capabilities that the human smiths acknowledge candidly they cannot replicate.",
    "history": "Cyclops Village developed as a defensive forge outpost during a period of sustained territorial conflict over the Jötun Tundra's trade routes — a time when the ability to produce weapons and armour quickly and in reliable quantity was the difference between communities that survived and communities that did not. The defensive mandate shaped the village's entire culture, producing a smith tradition that emphasises durability, reliability, and functional excellence over aesthetic consideration, a philosophy so deeply embedded that even modern decorative work from Cyclops Village smiths tends to be structurally over-engineered by about forty percent.",
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
    "lore": "The Death Pyramid was built to resonate with layered timelines — its architecture is not merely symbolic of the journey to the underworld but is a functional instrument for navigating the boundary between living and dead, its stepped geometry calibrated over generations of crypt-seer adjustment to maintain maximum contact with the spirit dimension that underlies Mictlan Hollows. Ghost Yokai of the highest authority gather here on the days when the spirit-membrane is thinnest, conducting ancient rites that the human priests assist rather than lead, their role understood as custodial rather than directive. Ghost Digimon such as LadyDevimon and the SkullSatamon line are drawn to the pyramid's apex with an urgency that their handlers describe as close to compulsive — the resonance between the pyramid's accumulated spiritual energy and the death-aspect of their Digimon data-structures creates a feedback loop of heightened ability that neither fully comfortable nor entirely resistible.",
    "history": "The Death Pyramid was reclaimed from collapsing dunes by crypt seers who recognised its structural and spiritual significance several generations after its original builders abandoned it — the reasons for abandonment being unclear and the crypt seers being too professionally cautious to speculate. The warding work that followed the reclamation took longer than the structural restoration, the accumulated spiritual residue of centuries of neglect having attracted entities that required considerable negotiation before agreeing to relocate. The pyramid has since been restored to its original function, operating under a joint custodianship agreement between the human crypt seers, the local Ghost Yokai governance, and the Mictlan Hollows surface community.",
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
    "lore": "Delphi City's seers claim its foundations were placed where convergent destiny nodes intersect — lines of potential future that cross in ways that make prophecy not just possible but almost unavoidable for any sufficiently sensitive mind, which in Oracle's Sanctum is most of the population. Psychic Yokai have been drawn to these nodes since before the first stone was laid, and the city was essentially built around their existing meditation sites with their tacit permission — a collaboration that is never formally acknowledged in the city's founding documents but is implicit in every architectural choice. Data-type Digimon find Delphi City's aether-saturated environment so conducive to enhanced processing that Wisemon-lineage entities have established a semi-permanent research community here, their predictive algorithms running at speeds that correlate, unsettlingly, with the oracle pool outputs.",
    "history": "Delphi City expanded from a single shrine over centuries as the reputation of its oracle pools drew first pilgrims, then scholars, then merchants serving both, and finally the full civic infrastructure that a permanent population of that scale requires. The expansion was not always smooth — the founding seers had not anticipated the noise and distraction of commerce, and several early generations of city governance were consumed by bitter arguments about how close a market could be placed to a prophecy pool before the psychic interference became unacceptable. The current layout reflects a hard-won compromise that everyone is mostly satisfied with and that has been stable for over two hundred years, which in civic governance terms qualifies as an extraordinary achievement.",
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
    "lore": "Dharma Village embodies the principle that true strength flows from righteousness — that a warrior who does not understand their moral duty is merely a liability with good weapons, while a warrior who does understand it is something closer to a force of nature with a conscience. Fighting-type Pokémon are the village's most devoted students, their competitive instincts channelled into the rigorous ethical frameworks that the dharma schools teach with equal emphasis on physical and philosophical development. Leomon-lineage Digimon are revered here as living exemplars of the warrior-philosopher ideal, their conduct in both battle and deliberation held up as the standard against which all students are measured; the Digital Dawn maintains a respectful relationship with the village's teachers, acknowledging that their warrior-ethics tradition predates the Digital World's own by a considerable margin.",
    "history": "Founded by sages who had grown concerned that the martial culture of Kshatriya Arena was producing excellent fighters with insufficient moral foundation — warriors whose skill was admirable and whose ethics were entirely situational — Dharma Village was established explicitly as the region's counterbalance, a place where the philosophical work of understanding righteous conduct was treated with the same seriousness as physical training. The relationship between the village and the arena was initially adversarial, the arena's training masters seeing moral philosophy as a distraction from practical preparation; the détente that now exists between them, where arena graduates are expected to spend a period of study in Dharma Village before receiving their full commissions, took three generations of patient negotiation to achieve.",
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
    "lore": "The Divine Workshop is said to channel forgotten volcanic hymn cycles — ancient sound-frequency patterns that the original forge-priests discovered could be used to stabilise alloy purity at a molecular level, producing metals that no subsequent technique has been able to replicate. Steel-type Pals are the workshop's primary labour force, Anubis and Wixen working in precise coordination with the runic bellows and celestial alloy crucibles, their natural facility with metalwork enhanced by the workshop's divine fire into something that approaches artistry. Andromon and HiAndromon-lineage Digimon have integrated so thoroughly into the workshop's mechanical systems that they are effectively part of the apparatus — self-maintaining components of the forge itself, their data-structures reinforced by the same divine fire that tempers the metal.",
    "history": "The Divine Workshop was reinforced to its current specification after a containment spiral failure that nearly collapsed the inner crucibles — an event that workshop historians refer to with studied understatement as 'the disruption' and that outside accounts describe as a several-hour period during which a significant portion of the Hephaestus Forge region experienced the consistent and alarming impression that the sky was on fire. The reinforcement work took a decade and produced a workshop that is now considered structurally over-engineered to a degree that borders on the theological, the engineering team having apparently decided that if something was going to contain divine fire it should do so with an appropriate margin of safety.",
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
    "lore": "The Dragon Graveyard is one of the most spiritually significant sites in the entire Sky Isles — a place where the oldest dragons returned to fossilise in aligned thermal fields, their bodies arranged in orientations that Wyrmclaw Tribe scholars insist are not natural settling but deliberate, meaningful positioning. Dragon Digimon of the most ancient lineages treat this site with the same reverence that the Dragon Elders of Long Valley treat their libraries — Examon-aspect entities have been observed descending to the graveyard floor to rest their heads against the largest skull formations, their digital consciousness apparently receiving something from the contact that their handlers cannot measure or articulate. The ghostly presence felt throughout the graveyard is not mere atmosphere: Dragon-aspect Ghost entities of considerable power maintain the site, rearranging the bones when they shift and deterring those who would harvest from the graveyard without the appropriate permissions.",
    "history": "Early Wyrmclaw Tribe excavators uncovered burial patterns in the Dragon Graveyard that indicated a degree of intentional arrangement far beyond what instinct alone could produce — evidence that the dragons who came here to die did so with deliberate ceremony, choosing their positions in relation to other burials with a spatial logic that took decades of study to begin to decode. The excavation work was eventually halted by the tribe's elders following what the excavation journals describe as 'repeated and increasingly emphatic discouragement' from the site's spiritual guardians, and current access is restricted to observation and ritual rather than extraction.",
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
    "lore": "Each scale shed on Drakescale Ridge is said to bear the mark of a drake’s triumph — not symbolically but literally, with patterns on the scale’s underside that the Emberkin tribes read like certificates of achievement, cataloguing the creature’s combats, its territory holdings, and the lineage of its clutch. Fire and Dragon-type Pokémon that reach the ridge’s mid-levels develop accelerated maturation patterns driven by the ambient temperature and the competitive pressure of existing drake population, producing adults with notably denser scales and more volatile temperaments than their lowland counterparts. Monster Hunter fire wyverns of the Rathalos lineage claim the highest spires and nesting ledges with unchallenged authority, their presence so dominant that even Dragon Digimon give them a wide respectful berth — the Emberkin clans conduct their pact-rites at a distance that the tribes admit is more safety margin than tradition.",
    "history": "Drakescale Ridge was shaped by centuries of drake flight, nest construction, and the thermal cycling that the creatures’ body heat creates in the local geology — the obsidian formations that give the ridge its distinctive appearance are partially natural volcanic glass and partially the result of generations of drake claw-marking and breath-scorching that has polished and reshaped the native basalt. The Emberkin tribal beacon fires were added to this landscape as navigation markers, their positions chosen in negotiation with the drakes in a series of compacts that the tribes maintain through annual renewal ceremonies, each ceremony involving tributes of food and crafted items in quantities that the tribes keep confidential.",
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
    "lore": "The Rootwardens who tend Druid Village have spent generations tuning the living rock-and-moss architecture to amplify restorative resonance — a process that involves as much negotiation with the Stone Yokai that inhabit the larger menhirs as it does technical knowledge of geomantic principles. Rock and Grass-type Pokémon live in such complete integration with the village's structures that the distinction between settlement and forest has become genuinely unclear; Trevenant serve as load-bearing members of certain walls, and the boundary between architectural element and independent entity is a philosophical question the village's healers discuss at length. Rock Digimon of the Gotsumon lineage are considered full community members with residency rights, their cultural contribution to the Stoneheart Cliffs tradition of stone-reading valued equally with any human druids.",
    "history": "Druid Village formed gradually after the Stoneheart Cliffs' geological activity stabilised enough to allow permanent root lattice growth — a process that took several decades of incremental change during which the settlement existed in a state of ongoing negotiation with the landscape itself. The village's characteristic organic architecture emerged not from design but from decades of the inhabitants allowing the Trevenant, Woodmon, and Grass Digimon who shared the space to grow as they wished, then adapting the human infrastructure to work with the resulting forms rather than against them. The result is a settlement that cannot be replicated because its development was fundamentally collaborative with non-human partners whose aesthetic preferences were only legible in retrospect.",
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
    "lore": "The Electric Vortex formed where levitation eddies from the Sky Isles' magnetic foundations intersect with the migrating storm belts that traverse the Tempest Zones — a confluence of forces that produces a self-sustaining electromagnetic core that has been spinning continuously since before any written record of the sky isles exists. Electric Digimon treat the Vortex as a kind of holy site: Thunderbirmon orbits the outer rings in extended meditative cycles, and Raidramon-lineage entities have been observed descending into the central core and emerging changed in ways that digital monitoring cannot fully categorise. Nimbus Core entities — essentially living electrical stabilisers in Digimon form — maintain the vortex's polarity balance in an ongoing act of stewardship that the Wyvern People recognise as a form of guardianship they do not interfere with.",
    "history": "The Electric Vortex was mapped over a series of dangerous expeditions by airborne scouts using tethered sensor rigs that needed to be rebuilt after almost every run — the electromagnetic forces within the vortex are so intense that unshielded electronics fail within seconds, and the shielded versions lasted only marginally longer. The mapping that exists today required twenty-three separate expeditions conducted over six years, and is acknowledged even by its creators to be a description of the vortex as it was rather than as it is, since the internal structure shifts constantly in ways that suggest an active, responsive intelligence the scouts were not equipped to characterise.",
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
    "lore": "Eleusis City is the centre of the ancient Eleusinian Mysteries — not merely a spiritual tradition but a living epistemic system in which the deepest knowledge about agriculture, the cycle of seasons, life, death, and rebirth is transmitted through direct experiential initiation rather than text or lecture. Grass Yokai of the Kodama aspect preside over the initiation ceremonies as silent witnesses whose approval is considered as meaningful as any human elder's blessing, their ancient connection to the cycle of growth and dormancy making them natural embodiments of what the Mysteries teach. Data-type Digimon find their prediction models recalibrated after extended exposure to Eleusis City's ambient mystery-energy — as if the cyclical agricultural wisdom encoded in the ceremonies updates their understanding of temporal patterns in ways that their own processing cannot fully account for.",
    "history": "Founded over two millennia ago as a centre for the mystery traditions that then spread outward to influence most of the spiritual culture of Demeter's Grove, Eleusis City has preserved agricultural and cosmological knowledge through a combination of initiatory transmission and, more recently, careful archival work conducted under strict access protocols. The city's most sacred ceremonies have never been recorded in any medium that outsiders can access — a policy that has produced intense frustration among researchers and intense respect from the Spirit Keepers faction, who consider the city's protective secrecy exactly correct in its handling of knowledge that belongs to the initiated.",
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
    "lore": "The forge fires of Emberforge Settlement are said to be lit by the breath of sleeping titans — not merely the geological titans of Volcanic Peaks lore, but the literal accumulated exhalation of the enormous Monster Hunter-class creatures that hibernate in the volcanic chambers below, their body heat venting through the settlement's forge pits in concentrations that make no conventional fuel necessary. Fire Pokémon that are born in the settlement's heat fields display forge-marks on their scales — patterns of slightly different pigmentation that the Emberkin smiths call 'the stamp of the mountain' and that mark their bond animals out as especially prized by the craft community. Karasu Tengu aspects of Flying Yokai serve as the settlement's navigational lookouts, their keen perception from the high vantage points providing early warning of drake territorial disputes that might otherwise resolve themselves directly through the settlement.",
    "history": "Emberforge Settlement was founded when Emberkin shamans first established the elaborate pact-rituals necessary to coexist with the local drakes over a millennium ago — a negotiation that tradition records as taking an entire generation, with the grandchildren of the original ambassadors completing what their grandparents had begun. The pacts were costly and specific, requiring ongoing tribute and behavioural observance that the settlement's culture has built itself around honouring completely. In the millennium since, the settlement has expanded, contracted, been rebuilt twice after volcanic disruptions, and maintained its pact obligations without interruption through every upheaval — a continuity that the Emberkin cite as the reason the drakes have never destroyed it.",
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
    "lore": "The Enchanted Glade attunes itself to the distant fairy courts of the Seelie realm, reflecting their seasonal mood shifts in its own ambient energy with the fidelity of a living receiver — when the courts are joyful, the glade blazes with colour; when they grieve, it grows quieter and the flowers close. Fairy Yokai in their Tengu-aspect forms maintain the harmony stone circles at the glade's edges, their ancient connection to the Seelie Courts predating the human settlements by centuries and giving their stewardship a proprietary quality that the courts' own emissaries respect. Fairy Digimon such as Fairimon and Kazemon dance at the bloom rings during alignment events, their light-data weaving into the glade's bioluminescent network in ways that the Seelie Court's own scholars describe as 'genuine contribution' rather than mere presence.",
    "history": "The Enchanted Glade's current stable state was achieved after wardstones were placed to anchor the fluctuating portals that once made it unpredictably inaccessible — the portals connected the glade to the deeper fairy courts in ways that were wonderful for the courts and deeply inconvenient for anyone who arrived to find the glade physically in a different location than it had been the previous visit. The wardstone placement was a collaborative project between Seelie Court emissaries and human fairy-mancers, conducted over a series of careful negotiations that established the access protocols still in use today, including the spiral petal portal alignment that all visitors must navigate correctly before the glade will permit entry.",
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
    "lore": "In the Eternal Dusk Grove, the light never fully fades — it hovers at that precise threshold between day and night where shadows have maximum autonomy and the world becomes most interesting to those who live in its margins. Dark Yokai of the Tanuki and Kitsune traditions are the grove's most settled inhabitants, their shapeshifting capabilities in perfect harmony with a landscape where nothing has a single, fixed form. Dark/Virus Digimon such as Impmon and the Ravemon lineage find the perpetual twilight stabilising to their data-forms, the ambient shadow-energy providing a consistent operating environment that the more chaotic light-conditions elsewhere in Raven's Shadow deny them, and the Digital Dawn reluctantly acknowledges that some of their more unconventional data-theory emerges from researchers who spend extended time in this grove.",
    "history": "The Eternal Dusk Grove was once a battlefield — the accounts of which conflict dramatically depending on which tradition is consulted — and the layered shadow wards that now define its character were laid down by Dark Yokai of considerable power in the aftermath, their purpose being the permanent reclamation of the space from the residual violence that had soaked into the soil. The reclamation took decades and produced a place that is genuinely peaceful in a way that should perhaps be more unsettling than it is, given what lies underneath the shadow wards. The Spirit Keepers maintain that the wards are holding and that no monitoring is currently necessary; other factions maintain a respectful distance and choose not to investigate the first claim by testing the second.",
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
    "lore": "The Eternal Flame is said to be a window into the cosmic fire that burns at the heart of creation — a claim that is easier to dismiss before one has stood before it, and considerably harder after. Fire Yokai of every known tradition gather here at their respective sacred intervals, the Kasha and lesser flame-spirits treating it as the ultimate authority on matters of fire-divinity, a status it holds without apparent effort or awareness. Phoenixmon-lineage Digimon make the arduous climb to the summit flame as a matter of lifecycle necessity — something in the flame's resonance accelerates their evolution and revival cycles, a fact the Digital Dawn has documented exhaustively without being able to explain why a geological phenomenon would interface with digital biology in this way.",
    "history": "The Eternal Flame has been revered since the earliest human habitation of Agni Peaks — before the fire temples of Agni City were built, before the sacred rites were formalised, the flame itself was simply there, burning without fuel on a volcanic summit and drawing the awestruck and the desperate alike. Its prophetic properties were discovered, according to the oldest accounts, by a seer who climbed to the peak during a time of crisis and descended with knowledge that resolved the crisis but left her forever changed in ways she described as entirely worthwhile. The formalisation of pilgrimage protocols came later, developed in response to visitors who arrived unprepared and experienced the flame's revelations without adequate psychological support to integrate them.",
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
    "lore": "The Eternal Glacier is ancient in a way that makes even the Jötun Tundra's other primordial features look recent — a remnant of the world's creation that holds in its ice layers the memories and physical artifacts of ages so remote that no mythology has names for them. Ice Yokai of the Yuki-onna tradition avoid the glacier's deepest zones, which they describe with the specific kind of respectful brevity that implies they know exactly what is there and have decided that knowing is sufficient. LadyDevimon and Ghost-aspect Ice Digimon are drawn to the memorial ice — the sections where ancient creatures are preserved in attitudes of moment rather than rest — their data-cores resonating with what they describe as 'the oldest known data-pattern' that their architectures recognise but cannot decode.",
    "history": "The Eternal Glacier formed at the world's beginning and has advanced and retreated across the tundra in cycles measured in millennia rather than years, preserving in perfect stasis everything its leading edge touched before the retreat left it exposed again. Archaeologists working the glacier's retreating margins have recovered artifacts from so many different eras in the same exposed layer that the stratigraphy is effectively useless as a dating method — items from ages separated by ten thousand years sit side by side where the glacier deposited them with democratic impartiality. The most significant finds are logged under the joint custodianship of the tundra's academic community, the Jötun Tundra's tribal elders, and the Spirit Keepers, with access negotiated case by case.",
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
    "lore": "Feather Town preserves the ancient art of sacred featherwork — the tradition of creating ceremonial objects whose beauty honours the feathered serpent spirit and encodes cosmological knowledge in patterns that only the initiated can fully read. Flying Yokai in their Karasu Tengu aspect are the town's most honoured suppliers of raw material, their shed feathers considered particularly sacred for ceremonial use; they do not simply leave feathers but present them in specific arrangements that the master craftspeople of the town interpret as quality indicators and sometimes as messages. Hawkmon-lineage Digimon have developed a remarkable rapport with the town's artisans, their feather-patterns offering design inspirations that have been incorporated into several significant ceremonial traditions over the past century.",
    "history": "Feather Town was established by master featherworkers who had studied the ancient traditions and chose this location in Quetzal Winds deliberately, believing that proximity to the actual feathered serpent's domain would imbue their work with genuine sacred resonance rather than mere aesthetic merit. The town's reputation for magnificent ceremonial creations spread quickly and has been maintained through a combination of extraordinary craft skill, genuine spiritual commitment, and the contribution of their Flying Yokai and Digimon neighbours whose living presence in the creative process produces results that cannot be replicated elsewhere.",
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
    "lore": "Flame Chasm is the crucible where dragon-lineage monsters are forged in earnest — a sheer-walled volcanic rift where thermal updrafts exceed hurricane-force winds and lava arcs reshape the canyon walls seasonally. Dragon and Fire-type Pokémon treat the chasm as a rite of passage, plunging into its currents to harden scales and master aerial control under true elemental stress. Guilmon-line Digimon and other fire-data species navigate the thermal columns to purge corrupted data from their structures, emerging more stable and resonant. Among Monster Hunter scholars, the Chasm is annotated in field manuals as a B-class risk zone — Rathalos juveniles use its updrafts to develop their aerial hunting instincts, and encounters with multiple simultaneously airborne wyverns are recorded as common. The anchor rings driven into the rim walls were carved with suppression runes; touching them is said to briefly bind even the most agitated monster, making the Chasm a site of both trial and calibration.",
    "history": "Early inhabitants of Agni Peaks used Flame Chasm as a natural smelting vent, lowering ore baskets into the super-heated updrafts on rope systems anchored to the rim. The system functioned for centuries until a catastrophic flare surge incinerated an entire work party and collapsed the lower anchor points — an event remembered as the Ember Audit. Volcanic custodians, advised by fire-priest scholars, redesigned the rim anchors with heat-resistant alloys and carved suppression runes into each post, restoring safe marginal access. In the decades since, the Chasm has shifted from an industrial site to a recognized monster ecology reserve, as researchers documented the extraordinary density of drake-type juveniles using its updrafts for developmental trials.",
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
    "lore": "The Floating Gardens drift through the mid-altitudes of Quetzal Winds on interconnected root-lattice platforms, tended by aerial botanists who have spent generations perfecting the art of soilless cultivation. Wind-magic practitioners wove the original platforms from compressed cloud-fiber and living root, creating terraces that self-anchor in stable updraft corridors and rotate slowly through the day to ensure even sunlight. Grass and Fairy-type Pokémon are beloved fixtures of the Gardens — Comfey garlands adorn every suspension rope, and Whimsicott drifting between beds are regarded as lucky omens by the gardeners. Lilamon-line Digimon, who carry data-encoded botanical knowledge in their core structure, have become indispensable assistants to the cultivators, able to diagnose plant ailments that human botanists cannot detect. The Gardens produce fruits and flowers impossible to cultivate at ground level, prized across Conoco Island for their concentrated elemental essence and extraordinary flavour.",
    "history": "The original Floating Gardens were small ritual platforms launched by Quetzal Winds priests to carry offerings to sky spirits — decorative rather than agricultural. A generation of practical-minded wind mages recognized the structural potential in the platforms and began scaling them into functional growing terraces, a transformation completed over roughly two centuries of iterative design. The great expansion occurred when a Grass-type Pokémon migration brought an unusual species of root-vine capable of binding platform segments without mechanical fastenings, enabling the multi-level garden systems visible today. Several platforms were lost to storm events over the years, and their drifting remnants — still alive, still blooming — can sometimes be spotted well outside the main cluster, hosting isolated ecosystems of their own.",
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
    "lore": "The Fog Temple rests half-submerged in the Mist Marshlands of the Conoocoo Archipelago, its upper spires visible only when the marsh exhales — a rhythmic cycle of rising and subsiding fog that the temple's architects reportedly designed the entire structure around. Ghost and Water-type Pokémon move freely through its flooded lower chambers, treating the drowned halls as a natural extension of the surrounding wetlands. Duskull and Dusclops are considered guardians of the inner sanctum in local tradition, and they do not permit the careless to proceed further than the outer causeway. Shakomon-line Digimon are drawn here by the echo resonance in the bell causeways — the tonal frequencies align with ancient data frequencies that these aquatic species use for long-range communication. Spirit Keepers have maintained a small research and ritual presence at the Fog Temple for generations, studying the precise relationship between the breathing cycles and the behaviour of the marsh's Ghost-type inhabitants.",
    "history": "The Fog Temple was built by an early Conoocoo Archipelago civilization who revered the marsh as a living entity, and constructed the temple to serve as a point of dialogue between the human world and the spirit world that the mist was believed to conceal. For centuries after that civilization's decline, the temple sank progressively deeper into the bog until only the highest spire remained visible — a landmark locally called the Ghost Finger. It was formally rediscovered during an extended drought that temporarily lowered the outer fog curtain and exposed the causeway entrances, prompting a joint Spirit Keepers and Ranger expedition that mapped the interior over the course of three expeditions. Full restoration is considered infeasible due to the temple's integration with the marsh ecosystem, and most scholars agree that attempting drainage would destroy both the site and the ecosystem it supports.",
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
    "lore": "Forge Town is the beating logistical heart of the Hephaestus Forge region — a sprawling refinery settlement where raw ore from the mountain seams is processed, graded, and distributed to the divine smithing workshops deeper in the highlands. Its refining towers vent steady orange plumes around the clock, and the rhythmic percussion of calibration pylons testing alloy batches has earned the settlement its nickname: the Metronome. Steel-type Pokémon are drawn here by the ambient magnetic resonance from the refinery stacks, and Magnezone families are regularly contracted to monitor purity output — their magnetic sense detecting trace contamination faster than any mechanical assay. Guardromon-line Digimon work alongside the ore carts and conveyor systems, their mechanical bodies well-suited to the high-heat, abrasive environment, and several Guardromon have risen to become full partners in guild operations. The Pals population in Forge Town is substantial; Digtoise and Dumud clans perform the deep-seam boring that human workers cannot safely reach, and their contribution to regional ore output has reshaped the entire economy of the Forge.",
    "history": "Forge Town was founded at the natural confluence of three ore veins that converge beneath the current town square — a geological coincidence that prospectors called the Triple Gift. The original settlement was a seasonal camp, occupied only during ore extraction seasons before ore cart technology made year-round habitation viable. Over time the refinery infrastructure became too large and valuable to relocate, and the camp became a permanent town with a mixed population of human smiths, Pokémon partners, and an increasingly established Digimon community. A major explosion in Refinery Tower Four, caused by a pressure valve failure, killed twelve workers and severely damaged the eastern processing complex; the rebuilt Tower Four is deliberately oversized compared to its counterparts as a memorial and a reminder of the cost of complacency.",
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
    "lore": "Frost Village is a testament to the stubborn persistence of those who refused to yield the Jötun Tundra to the frost giants — a tight-knit settlement of wind-hardened homes, braided rope guides, and communal hearths that burn regardless of season. Ice-type Pokémon are treated as neighbours rather than wildlife here; Snover families share wood-stacks with village households, and Beartic are considered the unofficial watch-monsters of the outer palisade. Garurumon-line Digimon have integrated so thoroughly into the village's sled-relay network that most residents cannot remember a time before their participation. The village maintains a careful diplomatic tradition with the Jötun clans nearby — not peace, exactly, but a sustained ceasefire maintained through annual tribute exchanges and a shared hatred of the blizzard season. Chillet Pals from the tundra have recently become regular visitors, drawn to the village's warmth during deep-winter cold snaps and tolerated so long as they refrain from raiding the jerky stores.",
    "history": "The original Norse settlers who founded Frost Village arrived in the Jötun Tundra after being driven from warmer regions by a territorial dispute that history has recorded only vaguely as the Long Argument. They chose the tundra specifically because the giants had written it off as too cold for productive habitation — an assessment the settlers counted on to buy them peace. The early decades were brutal, with multiple near-abandonments during catastrophic winter seasons, but the discovery of a network of semi-insulated underground hot-spring passages beneath the settlement gave the village its permanent foothold. The village's signature windbreak palisade architecture was developed after the Third Giant Raid destroyed the original outer wall, and the rebuilt design has not been successfully breached since.",
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
    "lore": "Gaia Town is built into the living landscape of the Terra Madre Basin rather than upon it — streets are root-reinforced earthen paths, buildings grow from living timber frameworks still putting out leaves each spring, and the town's water system is a managed network of natural springs rather than excavated pipes. Grass and Ground-type Pokémon are not penned or partnered here in the conventional sense; they live freely within the town's perimeter and participate in its rhythms as fellow inhabitants rather than companions. Rosemon-line Digimon have long claimed this settlement as a spiritual home, their data structures harmonising with the Basin's leyline network in ways that manifest as visible aura phenomena — shimmering green light that locals call Gaia's Breath. Eikthyrdeer and other Pals with natural affinity for balanced ecosystems have established grazing circuits through the town's common areas, their presence considered a reliable barometer of the settlement's ecological health. The town's governing council includes representatives from the Grass-type monster communities as well as human residents, a practice that outside visitors often find bewildering but that Gaia Town considers the baseline of responsible civilisation.",
    "history": "Gaia Town was founded as an intentional experiment — a group of environmental philosophers from the wider Conoco Island scholarly community chose the Terra Madre Basin's most ecologically sensitive subregion and set out to prove that permanent habitation and ecological preservation were not mutually exclusive. The early community faced significant scepticism and several near-collapses due to food shortages when their first growing methods proved insufficient. The breakthrough came from an unexpected alliance with the local Rosemon population, who shared root-communication techniques that allowed the community to monitor soil health in real time and adapt their practices accordingly. The town's model has since been studied and partially replicated elsewhere, though most attempts omit the monster representation clause and, according to Gaia Town's council, inevitably decline within two generations as a result.",
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
    "lore": "The Golden Hall is the apex gathering place of Hearthfall Commons — a vast Norse-style mead hall whose rafters are hung with embroidered tapestries depicting every significant deed accomplished in the region's history, updated seasonally by a devoted order of story-weavers. Its long tables have hosted peace treaties, retirement feasts, and the occasional furious argument that somehow ended in lifelong friendship. Normal and Fighting-type Pokémon are the most common inhabitants of the Hall's back corridors; Ursaring serve as the unofficial staff, managing the cellars and food stores with unmatched dedication. Bearmon-line Digimon have taken to the mead-hall tradition with gusto, developing their own internal ranking system that maps loosely onto the Hall's honour plaques. Entry is technically open to all, but the great golden doors are said to open wider — metaphorically and literally — for those who have done something genuinely worth noting.",
    "history": "The Golden Hall was raised by the founding clans of Hearthfall Commons as a neutral meeting ground, a place where feuding families could negotiate without the tactical disadvantage of hosting their rivals under their own roof. Its location was chosen for its equidistance from the three largest original settlements, and the triple-entrance design ensures no clan's guests must pass through another's wing. The Hall has been burned twice, once by accident during a particularly exuberant torchlit celebration and once during a genuine raid, and both times the rebuilding process was treated as a communal festival rather than a burden. The current structure is considered the third and definitive version, expanded to four times the original footprint to accommodate the region's growth.",
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
    "lore": "The Golden Wheat stretches across the gentlest terrain in Demeter's Grove — a seemingly endless expanse of grain that ripples with divine light in the late afternoon and emits a faint warmth at night that locals insist is Demeter's own exhalation. Grass and Normal-type Pokémon are at their most relaxed and generous here; Sawsbuck walk openly through the rows, and Comfey drifts through the air as if the entire field is a single long garland. Palmon-line Digimon have integrated seamlessly into the agricultural cycle, their botanical instincts extending to the wheat itself — some agricultural families consider a Palmon's approval of a field's soil composition the most reliable growing indicator available. The grain produced here is qualitatively different from wheat grown elsewhere: denser, sweeter, and with a shelf life that bakers across Conoco Island treat as borderline miraculous. Demeter's Grove farmers speak of the fields with quiet reverence, never boasting, as if excessive pride might disturb the balance that keeps the harvest perfect season after season.",
    "history": "Agricultural records from Demeter's Grove trace the Golden Wheat back further than any other cultivated land on Conoco Island, with the oldest records describing it in terms that blur the line between farming and religious observance. Early settlers discovered the fields already partially cultivated — rows laid out in patterns they identified as sacred geometry — and chose to continue rather than replant, a decision that the subsequent ten thousand unbroken harvests has generally validated. There was a documented near-failure during a period of regional drought roughly eight centuries ago, when the wheat thinned and browned for the first time in living memory; it recovered completely when the farmers began daily offering ceremonies, an event that cemented the agricultural-religious tradition still observed today. The Eikthyrdeer Pals arrived in the area relatively recently and have been the most significant agricultural partners the fields have seen in centuries, their naturally gentle grazing patterns aerating the soil in ways that traditional tillage methods approximate but never quite match.",
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
    "lore": "The Grand Colosseum is the supreme arena of the Kshatriya Arena region — a stone amphitheatre whose oathstones have absorbed centuries of honour-bound combat into their mineral structure, so that veteran fighters can feel a faint vibration underfoot when they step onto the sand that newcomers cannot perceive. Fighting-type Pokémon come to the Colosseum to test their limits against the best in the region, and the waiting chambers beneath the arena floor are permanently populated by Machamp families who treat the arena as their spiritual home. WarGreymon-line Digimon compete here with a near-religious intensity; their bouts draw the largest crowds of any scheduled events, and their pre-match preparation rituals — lengthy, precise, and deeply personal — are now observed in respectful silence by the entire audience as a Colosseum custom. Volcamon-line Digimon serve as unofficial referees for the most heated bouts, their ability to read combat temperature preventing escalations that honour culture alone cannot always contain. The Colosseum's records hall documents every championship bout in detail, and Orserk Pals have recently begun competing in the open-category brackets, their physical prowess drawing considerable attention from veteran trainers.",
    "history": "The Grand Colosseum was constructed by the founders of the Kshatriya Arena region as a permanent answer to the problem of disputes: rather than warring over territory, the founding clans agreed to settle all major conflicts through sanctioned combat at a neutral site. The first structure was far smaller, a simple sandy ring with wooden palisade seating, but it expanded with each generation as the tradition grew from a conflict-resolution mechanism into a beloved cultural institution. Three separate expansions have extended the seating capacity to its current level; the most recent expansion controversially added underground preparation chambers after several visiting fighters complained of inadequate pre-match facilities. The Colosseum's most famous bout — the Three-Day Marathon between two rival champions a century ago — ended in a draw that neither competitor ever contested, and both are commemorated by statues flanking the main entrance.",
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
    "lore": "The Great Nest is the nexus of storm energy in all of Thunderbird Heights — a massive structure of lightning-struck timber, storm-forged metal, and compacted cloud-mass that hums with electrical charge strong enough to raise the hair on unprotected visitors. The Thunderbird is not merely a resident of this site; according to every tradition associated with the Heights, the Nest and the Thunderbird are inseparable, each having shaped the other over uncounted generations. Zapdos-kin Pokémon circle the outer perimeter constantly, neither descending nor departing, their behaviour suggesting a kind of permanent vigil. Phoenixmon-line Digimon treat the Nest as a spiritual summit — a destination that marks the absolute highest tier of their growth cycle, reached only when their data has achieved sufficient resonance with lightning-element energies. Rotom forms that have been exposed to storm energy for extended periods have been documented near the Nest's lower reaches, their normally mischievous energy subdued into something closer to reverence.",
    "history": "The Great Nest predates every human settlement in the Thunderbird Heights region and may predate the Heights themselves as a distinct geographical feature — some researchers argue that the Thunderbird's repeated lightning strikes to the same location over millennia are responsible for the plateau's current elevation. The tribal cultures of the region have documented interactions with the Nest through oral tradition going back at least forty generations, with consistent accounts of the Thunderbird permitting specific individuals — storm-priests, storm-callers, or simply those the great bird found interesting — to approach the lower boughs and observe. The Stormproof Visitor Band requirement was instituted after a non-tribal expedition in the last century approached the Nest without preparation, triggering a defensive storm response that flattened three hundred metres of surrounding ridge. No one was killed, but the lesson was decisive.",
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
    "lore": "The Great Tree stands at the heart of the Anansi Woods as the oldest living repository of the region's stories — its bark is covered in silk runes woven by generations of Spinarak, Tentomon, and Leavanny who have added to its script-tapestry without ever removing what came before, so that the entire trunk reads as a continuous narrative from root to crown. Bug and Fairy-type Pokémon are the tree's primary caretakers; Combee collectives harvest resin globes that preserve individual story fragments in living amber, and Leavanny families maintain the silk infrastructure with meticulous care. Kuwagamon-line Digimon serve as the tree's impromptu security force, patrolling the outer root rise and gently discouraging those who approach with harvesting intent rather than scholarly purpose. The story trance phenomenon is well-documented: visitors who read too deeply into the silk runes without an anchor sometimes lose track of time so completely that they are found days later, believing only an hour has passed. The sap that pools at the base of the tree is considered among the most valuable craft materials in the Woods, capable of preserving any knowledge pressed into it.",
    "history": "The Great Tree's origin story is itself recorded on its lowest roots — a silk panel depicting a figure who is understood to be Anansi placing the first thread on the bark, establishing the tradition of narrative weaving that has continued uninterrupted ever since. The tree grew around the silk as much as the silk grew around the tree, and the current root-rise plateau is believed to be the direct result of centuries of accumulated story-energy compressing and lifting the soil beneath. A major portion of the upper canopy silk was destroyed by a wind event roughly three centuries ago, and the recovery effort — a coordinated weaving project involving every Bug-type family in the Woods — is itself documented in the replacement panels, giving the upper portion of the tree an unusual meta-narrative quality where the story of its own repair is incorporated into the text.",
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
    "lore": "Hearthstone Temple is built around a single stone that has never been cold — an irregularly shaped chunk of basalt-like mineral that radiates gentle warmth without visible flame or identifiable heat source, and which regional tradition identifies as the original gift of fire brought to humanity by an ancient spirit in the time before recorded history. Normal and Fire-type Pokémon are naturally drawn to the Temple's warmth; Flareon who linger near the hearthstone for extended periods are said to carry a distinctive quality of flame that burns more steadily and more gently than wild fire, a phenomenon that local breeders value highly. Flarimon-line Digimon have made the Temple a site of regular pilgrimage, their spiritual protocols aligning closely with those of the human temple clergy in ways that scholars of monster culture find particularly interesting. Piyomon families nest in the temple eaves and have done so for as long as records exist — their white plumage acquires a faint golden tint from the hearthstone's ambient glow, and these 'blessed doves' are eagerly sought by households across Hearthfall Commons as companions believed to carry the Temple's warmth with them.",
    "history": "Hearthstone Temple predates Heimdal City by several centuries, existing first as an open-air site marked only by the hearthstone itself and a ring of carved standing stones placed by the earliest settlers to acknowledge its significance. The enclosed temple structure was built incrementally as the pilgrimage tradition grew, with each generation's construction guild adding one more chamber, one more passage, one more wing, until the current layered complex emerged. A period of religious controversy roughly four hundred years ago saw a faction attempt to remove the hearthstone for study at a scholarly institution; the attempt failed when every member of the removal party independently and inexplicably fell into a deep sleep before reaching the temple door. The stone has not been touched since, and the temple clergy consider the incident a definitive theological statement from something they decline to name too specifically.",
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
    "lore": "Heimdal City is the regional capital of Hearthfall Commons — a warm, deeply communal city where the architecture is practical rather than grand, the streets are wide enough for sled teams and festival parades alike, and nearly every home maintains an exterior lantern as both navigation marker and hospitality signal to travellers in poor weather. The city is named for Heimdall, the ancient guardian of boundaries and watchtower figure, and the tradition of maintaining visibility — keeping lights on, paths clear, messages posted — is woven into the city's culture as both practical safety and spiritual practice. Normal-type Pokémon are everywhere in the city, integrated so thoroughly into daily life that the distinction between wild and companion is almost meaningless; Garurumon families run sled relay services, Audino work in the city's medical facilities, and Foxparks Pals have recently become popular hearth companions for households seeking something a little warmer than a cat. Agumon-line Digimon have been city residents for at least four generations, their role evolving from cautious newcomers to established guild members who operate some of the city's most reputable fire-craft businesses.",
    "history": "Heimdal City was founded by northern settlers who arrived in Hearthfall Commons after a lengthy journey that community records describe with a note of relief rather than triumph — the emphasis in the founding story is not on conquest or discovery but on the moment the settlers found a valley that felt like somewhere one could stop and stay. The city's core neighbourhood was established around a natural spring and a clearing where the founding families parked their carts and never quite left. The Great Hall was the third structure built after a granary and a communal sleeping shelter, and its central position in the city plan — and in civic life — has never changed. The city survived several major winter catastrophes in its early centuries, each of which is commemorated by a carved beam in the Great Hall's ceiling, making the Hall both a gathering place and a material record of the community's resilience.",
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
    "lore": "Hidden Cove is the worst-kept secret in Pirates' Bay — everyone knows it exists, no one outside the fraternity can find it, and the handful who have stumbled upon its entrance reef by accident have encountered either a polite escort back to open water or, less politely, nothing at all from then on. The Cove is defended not just by its rock maze approaches but by a Jormuntide that has inhabited the outer channel for as long as any living pirate can document, treating the passage as its exclusive territory and permitting only those bearing the Black Flag Token to proceed without incident. Dark and Water-type Pokémon are common throughout the Cove's interior waterways; Murkrow networks relay messages between factions within minutes, and Gyarados families patrol the underground waterways where the natural cavern system provides excellent ambush positions. Cawgnito-line Pals have become prized intelligence assets within the Cove's social hierarchy, their Dark-type instincts and aerial mobility making them ideal courier-spies in an environment where information is currency.",
    "history": "The Hidden Cove's recorded history is patchy by design — pirate culture does not encourage meticulous documentation — but five centuries of accumulated graffiti, carved naming records, and recovered account books paint a picture of a site that has changed hands at least eleven times through internal power struggles. Each new ruling faction has added to the defensive infrastructure without removing predecessor work, resulting in a labyrinthine cavern complex that even long-term residents navigate partly by instinct. The largest single construction event was the excavation of the treasure vault network, reportedly achieved through a combination of Digtoise Pal labour and controlled detonations over a two-decade period. The current ruling faction has maintained occupancy for sixty years, the longest unbroken tenure in the Cove's documented history, which most outside observers attribute to an unusual policy of accepting competent outsiders rather than restricting membership to established bloodlines.",
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
    "lore": "The Honor Temple is the spiritual cornerstone of the Kshatriya Arena region — a place where warriors come not to fight but to be reminded why fighting must be done with integrity, and where the oaths taken before battle are considered more binding than any contract. Its purification pools reflect the face of whoever leans over them with an unsettling clarity that veterans describe as showing not the face you have but the face you claimed to be when you first took up your weapon. Fighting and Psychic-type Pokémon are common here, drawn by the concentrated honour-energy that has accumulated in the stone over centuries of vow-taking; Lucario are particularly notable residents, their aura-reading ability making them natural temple functionaries who can assess a petitioner's sincerity in seconds. Knightmon-line Digimon serve as permanent temple guardians, their oath-bound nature harmonising so completely with the temple's function that the temple clergy has formally recognised them as co-custodians rather than merely residents. The Sacred Tiger that Raikou-kin and SaberLeomon embody in temple tradition is said to manifest physically during certain ceremonies, visible to those whose honour-state the temple judges sufficiently advanced.",
    "history": "The Honor Temple was established by the founders of the Kshatriya Arena tradition as a necessary counterbalance to the Grand Colosseum — a place of stillness and introspection to offset the arena's noise and competition. The founding philosophy held that combat without spiritual grounding inevitably degraded into mere violence, and that the arena's glory depended on the integrity of those who competed in it. The temple complex was built over several generations, with each generation's contribution required to be approved by the previous generation's senior priests before construction began — a process that produced a building of unusual architectural consistency despite its long construction timeline. The most controversial moment in the temple's history was a ruling, roughly two centuries ago, that declared a reigning arena champion's vows void due to demonstrated dishonour in conduct outside combat; the champion was required to undergo the full purification ritual publicly, and the humility with which they did so is considered the defining example of the system working as intended.",
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
    "lore": "Hygge Village is the quietest corner of Hearthfall Commons — a small settlement built on the philosophy that warmth, good company, and simple pleasures are sufficient foundations for a full life, and which has maintained this philosophy stubbornly across countless generations despite Conoco Island's general tendency toward drama. The village's architecture seems designed to discourage hurry: doorways are just slightly lower than comfortable, requiring a slight bow on entry; paths curve gently rather than running straight; public spaces are furnished with benches, blankets, and tea kettles. Normal and Fairy-type Pokémon are the village's most beloved companions — Delcatty curl on every other hearthrug, Patamon perch on roof beams, and Audino have become the village's informal health advisors. Gatomon-line Digimon have embraced the village aesthetic with unexpected enthusiasm, their serene nature complementing the settled pace of life in ways that make them excellent housemates. Cattiva Pals have adopted the village as a second home, their sociable nature thriving in the perpetual-gathering atmosphere of the public spaces.",
    "history": "Hygge Village was founded by families who had lived through one too many conflicts and decided collectively that they were done with the kind of history that gets written about. The founding charter, still displayed in the village hall, consists entirely of things the village will not do or permit — a document that the first generation called a Peace Register and subsequent generations have called, with affection, the Book of Nopes. The village has been largely successful in its ambition: no battle has been fought within its borders in living memory, no faction has established a base here, and the one time a criminal element attempted to use the village as a transit point for contraband, the village watch — composed entirely of extraordinarily determined knitting enthusiasts armed with fireplace pokers — resolved the situation before noon.",
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
    "lore": "The Imperial Palace is the formal seat of Long Valley's draconic governance — a multi-tiered terrace complex where elder Dragon-type lineages have administered the valley's affairs for as long as anyone has documented, adjudicating territorial disputes, mediating inter-species conflicts, and issuing the edicts that regulate jade trading, monsoon water rights, and sacred site access. Dratini and Dragonair move through the palace's lower courts as junior attendants, their calm temperament and empathic range making them excellent diplomatic liaisons between the elder drakes and visiting parties. Seadramon-line Digimon serve as the palace's memory-keepers, their data-encoded recollection of every audience held over centuries making them indispensable to the administrative process. The Pearl Court's reflective pools are used as a form of divination during major rulings — the palace clergy reads the reflection distortions caused by draconic aura fields as supplementary evidence in contested cases. Jetragon-line monsters and Hydreigon-class Pokémon occupy the upper terraces, accessible only to those who have passed the audience seal examination, and their presence is considered a visual reminder that the palace's governance operates at scales that most visitors will never fully appreciate.",
    "history": "The original Imperial Palace was a smaller structure built over a dragon-bone deposit that early Long Valley settlers identified as a place of natural power — the bones were determined to be the remains of an ancient apex drake, and the palace was raised above them as both shelter and memorial. The current tiered terrace design emerged after a solar alignment event cracked the original terraces along three structural fault lines, requiring complete reconstruction; the architects chose to elevate the new structure significantly higher than its predecessor, partially for practical drainage reasons and partially because the incident was interpreted as a sign that the original height was inadequate for the palace's purpose. Several wings have been added in subsequent centuries as the valley's population and administrative complexity grew, and the oldest wing — the Ancestral Pearl Court — has been deliberately preserved in its unaltered form despite structural impracticality.",
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
    "lore": "Iron Teeth's Hut is the most notorious address in the Crowsfoot Marsh — a bone-fenced structure that appears to occupy slightly more space on the inside than its exterior would suggest, and which is surrounded by a perimeter of jar-lights whose contents are best not examined too closely. The witch known as Iron Teeth has occupied this territory for as long as the Marsh's oldest residents can remember, and their oldest residents are very old indeed. Dark and Ghost-type Pokémon cluster around the hut's perimeter not out of loyalty to its inhabitant but because the ambient dark-magic concentration in the soil has become so dense over centuries that it functions as a passive attractor — Honchkrow families nest in the bone fence posts, and Dusknoir are sometimes seen carrying out small tasks for the witch that no one can explain. Katress-line Pals have developed an unusual relationship with the hut, their Dark-type nature giving them a degree of resistance to its wards, and several have apparently entered and departed without incident, a fact that the witch's other neighbours find deeply impressive. The Wizardmon-line Digimon who occasionally visit the hut do so for educational purposes, and emerge with new knowledge that they are invariably reluctant to describe in detail.",
    "history": "Iron Teeth's Hut predates most of the Crowsfoot Marsh's other notable landmarks, with the earliest documented references appearing in marsh records that describe the structure as already present and already considered dangerous. The witch's identity across multiple generations is a subject of local debate — whether the same entity has inhabited the hut for centuries, whether the title passes to a successor, or whether something stranger is occurring is a question that no researcher has successfully answered, partly because researchers who investigate too aggressively tend to have memorable consequences. The Bone Charm requirement for approach was established not by the witch but by the Crowsfoot Marsh community as a self-protective measure, providing the witch with a filtering mechanism that discourages purely casual visitors while permitting those with genuine purpose or sufficient credentials.",
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
    "lore": "Jade Village is the artisan hub of Long Valley — a terrace settlement built around the tradition of transforming shed dragon scales into luminous protective charms, a craft that requires equal parts metallurgical knowledge, elemental attunement, and the willingness to negotiate with the dragon who shed the scale in the first place. Dragon and Fairy-type Pokémon are the village's primary partners in this trade; Swablu and Altaria deposit scales willingly near the polishing basins, treating the exchange as a kind of craft commission, and Wisemon-line Digimon serve as the village's quality evaluators, their dimensional perception allowing them to assess a charm's resonance properties in ways that purely physical testing cannot replicate. The jade slurry that lubricates the carving process comes from a mineral spring discovered when the canal terrace was first cut, and its particular mineral composition is believed to be responsible for the distinctive green-gold sheen that Long Valley charms display when held to sunlight. Young drakes from the broader Long Valley region visit Jade Village as a kind of cultural tradition, exchanging recently shed scales for finished ward pendants — a transaction that both parties consider mutually beneficial.",
    "history": "Jade Village began as a single carving workshop established by a Long Valley artisan who had developed a technique for processing dragon scales without the brittle fracturing that plagued earlier attempts. The technique spread rapidly through the valley's crafting community, and within two generations a full village had grown around the original workshop site. The major expansion event was the completion of the canal terrace system, which brought water power to the polishing fountains and enabled a scale of production previously impossible by hand-power alone. The original workshop building is preserved at the village centre and still operated by the founding family's descendants, who are locally regarded as the ultimate authority on quality standards — a status they maintain with a combination of genuine expertise and theatrical deliberateness.",
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
    "lore": "The Jötun Halls are the formal council chambers of the frost giant clans of the Jötun Tundra — structures built to a scale that makes most humanoid visitors feel approximately the size of a well-dressed rodent, where fire columns the height of houses serve as ambient heating and the ceiling beams are decorated with battle records carved in a script that requires specialist scholars and considerable ladder access to read. Ice and Fighting-type Pokémon inhabit the Halls' outer regions, tolerated by the giants as a combination of livestock, sport, and occasionally respected adversaries; Regigigas-kin are treated with a particular deference that suggests the giants recognise something in their presence that they do not feel the need to explain. Machinedramon-line Digimon have been documented in the Halls' depths, their mechanical scale aligning more naturally with the giant architecture than most organic visitors, though their presence seems to provoke philosophical discussion among the elder giants rather than confrontation. The Phantomon-line Digimon that drift through the upper rafters are believed to be remnants of giants who fell in ancient conflicts, their data structures too large and complex to fully dissipate.",
    "history": "The Jötun Halls have existed in the Tundra since before the region's recorded history, though their current form is the product of periodic reconstruction — the giants rebuild after structural failures with the same casual thoroughness that smaller beings apply to replacing furniture. The halls have hosted seventeen documented mortal visitors across recorded history, of whom twelve returned to report their experiences; the other five are subjects of considerable scholarly speculation. The most recent confirmed visit by a mortal was the Scholar Expedition of three generations ago, which produced the Giant Rune Lexicon still used today and also produced the visitor ban that made the Giant Parley Token system necessary for any subsequent access attempt.",
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
    "lore": "Kumasi City is the commercial heart of the Anansi Woods — a suspension metropolis built across converging canopy tension lines where story-silk is bought, sold, graded, and archived with the same seriousness that other regions apply to precious metals or rare minerals. Bug and Normal-type Pokémon run the majority of the city's market infrastructure; Ariados maintain the indexing lattice that keeps the web archive galleries navigable, and Kricketune have developed a system of tonal encoding that allows them to convey complex commodity information through song in a fraction of the time conventional notation would require. Waspmon-line Digimon are the city's most active brokers, their data-processing capacity allowing them to evaluate pattern complexity and narrative density at speeds that make manual assessment seem quaint. Sweepa-line Pals have recently emerged as significant players in the archive-maintenance trade, their methodical nature and physical endurance making them excellent long-term custodians of the silk gallery stacks. The market's seasonal cycles follow the story-weaving traditions of the surrounding woods, meaning that certain tale categories become available or restricted depending on the time of year — a fact that creates substantial arbitrage opportunities for traders who understand the pattern.",
    "history": "Kumasi City grew organically from a market that began as a weekly gathering of weavers from across the Anansi Woods who met to exchange completed silk-narrative panels. The location was chosen because the canopy tension lines at that point were naturally strong enough to support suspended platforms without additional engineering, and the first market stalls were simply platforms lashed to existing branches. The archive gallery system was established after a major story-silk collection was lost in a canopy collapse, prompting the market community to formalise preservation and cataloguing as a core civic function. Several of the web bridges connecting the main market tiers are believed to be the original lashings, reinforced over generations but never fully replaced, and structural historians regard them as some of the oldest continuously maintained engineering in the Anansi Woods.",
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
    "lore": "Kurukshetra City is built on ground that carries the weight of a great reckoning — the Kshatriya Arena region's philosophical and martial capital, where the concept of dharmic warfare is not merely studied but embodied in the daily practice of every resident. Its training sands are said to retain a faint memory of every lesson ever taught on them, so that veterans describe a heightened awareness when sparring here that they attribute to fighting alongside the accumulated experience of everyone who trained before them. Fighting and Psychic-type Pokémon are found throughout the city in equal measure, the combination reflecting the city's dual emphasis on physical and ethical mastery; Medicham families operate the most respected meditation schools, and Lucario aura-practitioners serve as the city's primary spiritual counsellors. Garudamon-line Digimon occupy a position of ceremonial significance, their flight symbolising the dharmic ideal of rising above personal interest to serve a higher purpose. Centarumon-line monsters are the city's most celebrated combat instructors, their perspective spanning both the physical and philosophical dimensions of warrior training in a way that purely humanoid instructors struggle to replicate.",
    "history": "Kurukshetra City was established on the site of a decisive conflict in the Kshatriya Arena region's founding era — a battle that, by all accounts, resolved a generational dispute about who held legitimate authority over the arena tradition. The philosophical dimension of the conflict — questions about duty, loyalty, and the ethics of fighting those one loves — so dominated the post-battle discourse that the city founded in its aftermath was oriented around examining those questions rather than celebrating the military outcome. The warrior schools that now define the city emerged over the following centuries as different philosophical traditions crystallised around different interpretations of what the original conflict meant, and the productive tension between these traditions is considered the city's primary intellectual engine.",
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
    "lore": "Lightning City is the most electrified urban environment in the known world — a Sky Isles settlement built within the Tempest Zones' permanent storm belt where every structure is simultaneously a shelter and a conductor, and the city's power grid is fed directly by the lightning strikes that hit the conductor spires approximately every forty-three seconds by regional average. Electric and Steel-type Pokémon are not merely common here but structurally essential; Manectric families maintain the distribution transformers, and Magnezone are the city's most sought-after grid engineers, their natural magnetic field control enabling precision regulation that mechanical systems cannot achieve alone. Elecmon-line Digimon have integrated so thoroughly into the city's electrical infrastructure that portions of the grid are classified as partially sapient, the Digimon having embedded data-routing protocols into the copper that respond to load conditions autonomously. Orserk Pals work in the heavy-discharge zones where the raw lightning intake is too intense for most other workers, their natural lightning resistance making them the only practical option for maintenance in those areas. The city's transit system runs on captured lightning, and delays are not measured in minutes but in the number of strikes missed — a unit of time measurement that strikes visitors as either charming or deeply alarming depending on their relationship with high-voltage environments.",
    "history": "Lightning City was founded by the storm rider communities of the Sky Isles' Tempest Zones — groups who had developed the techniques for navigating and surviving within the permanent storm system and recognised that the energy it produced was not merely a hazard to be endured but a resource to be cultivated. The first permanent structures were essentially large metal stakes driven into the storm's current paths, and the city grew around the grid those stakes formed. Three major reconstruction events following catastrophic overload incidents shaped the current city layout, with each reconstruction incorporating lessons from the previous failure into the next design. The current conductor spire system was the innovation that ended the reconstruction cycle, its load-balancing architecture finally matching the storm's input with the city's consumption capacity.",
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
    "lore": "The Lightning Spire is the most consistently struck point on Conoco Island — a natural rock formation whose metallic vein composition and elevation combine to make it the preferred lightning destination for every storm system that moves through Thunderbird Heights, which in practical terms means it is struck with enough frequency that the stone has been fundamentally altered by the accumulated charge. Electric and Rock-type Pokémon are the Spire's primary inhabitants; Talonflame-line Piddomon nest in the upper crannies, having evolved a heat-resistance response to the constant discharge temperature, and Wisemon-line Digimon have established a research station in the mid-section that uses the Spire's charge cycles as a high-energy data processing environment. The aurora effects that the Spire generates during peak electrical activity are among the most spectacular naturally occurring phenomena in the region — multicoloured sheets of ionised air that are visible from as far away as Hearthfall Commons on clear nights. Tribes of Thunderbird Heights regard the Spire as the Thunderbird's secondary perch, less sacred than the Great Nest but still treated with considerable respect.",
    "history": "The Lightning Spire was documented in the earliest geological surveys of Thunderbird Heights as anomalous — the rock composition differed substantially from the surrounding formations, suggesting either a distinct geological origin or extensive modification by an external force. Current scholarly consensus favours the latter, identifying the metallic vein structure as consistent with millennia of lightning-induced mineral migration, meaning the Spire has literally been building itself from lightning for an estimated three thousand years or more. The research station was established after a previous attempt to mine the lightning-altered stone resulted in an incident that the surviving researchers declined to describe in writing beyond the phrase \"sustained electrical protest.\" The current arrangement — observation and passive energy harvesting only — has proven more productive and considerably less alarming.",
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
    "lore": "Maelstrom Point is the most treacherous navigational challenge in Poseidon's Reach — a cape where geological formations beneath the surface combine with tidal forces to generate whirlpools of sufficient size and persistence that they have been continuously active for longer than maritime records exist. Water and Dark-type Pokémon thrive in the chaotic currents here; Tentacruel are the largest visible inhabitants, their tentacle networks extending into the whirlpool channels where they feed on the disrupted sea life. Cthulhumon-line species are documented in the Maelstrom's deeper reaches, their presence considered an indicator of genuinely extreme depth and pressure conditions. Airdramon-line Digimon use the Maelstrom's updraft columns — generated by the warm-cold water interaction in the whirlpool centres — as training grounds for aerial navigation, treating the turbulent air above the water as a kind of atmospheric obstacle course. Navigation through the Point is considered one of the defining tests of maritime mastery in the region, and the Navigator's Seal requirement exists not as bureaucratic obstruction but as a genuine quality filter — the Point has killed unprepared sailors with routine indifference since before the Seal system existed.",
    "history": "Maelstrom Point appears in the earliest Poseidon's Reach maritime records as a fixed hazard notation — something to be navigated around rather than through, with no suggestion that passage was considered viable. The first documented successful transit was achieved by a navigator whose technique was immediately classified as a guild secret and shared only through direct apprenticeship for the following century. The lighthouse beacon was established after a political agreement that determined the Point's navigation route was too valuable as a short-cut lane to remain a guild monopoly, and the published current charts that followed transformed the Point from an impassable barrier into a challenging but viable passage. The Navigator's Seal requirement was instituted after the charts enabled several underqualified expeditions to attempt the passage with predictable results.",
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
    "lore": "The Memory Cliffs are the geological diary of Conoco Island — a sequence of cliff faces where generations of rune stewards have carved historical records into exposed strata layers, creating an archive that reads horizontally across time and vertically across the scope of events it records. Rock and Psychic-type Pokémon inhabit the cliff faces with equal comfort; Onix families stabilise loose inscription shelves with their body weight, serving an unintentional preservation function, while Claydol hover at various heights reading glyph sequences with an attentiveness that scholars have found both flattering and slightly unnerving. Wisemon-line Digimon conduct ongoing data verification of the carved records against their own archived copies, a cross-referencing project that has identified seventeen significant historical discrepancies over the past century. The equinox illumination phenomenon — where specific strata layers glow briefly as sunlight strikes them at the precise seasonal angle — was the original discovery that drew the first rune stewards to this location, and the pattern of which layers ignite has been used to track historical dating for over a thousand years. Claydol-line Pokémon and Katress Pals have independently developed what appears to be a form of cliff-reading practice, spending extended periods in physical contact with the inscribed stone surfaces.",
    "history": "The Memory Cliffs' oldest layers predate any human settlement on Conoco Island, with the deepest accessible inscriptions appearing to be in a script that no living scholar has fully deciphered and that may not have been created by human hands at all. The human rune steward tradition began approximately fifteen hundred years ago when a single scholar chose the Cliffs as a recording site and established the conventions — elevation, spacing, notation format — that every subsequent generation of stewards has followed. The systematic cataloguing project, involving harness teams documenting every accessible inscription, began six generations ago and is projected to reach completion in approximately two more generations at current pace. A rockfall event three centuries ago destroyed a significant section of middle-period inscriptions, a loss that rune stewards still refer to as the Gap, and the reconstruction effort to interpret surrounding layers and infer the lost content is ongoing.",
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
    "lore": "Mictlampa City is the bustling commercial and spiritual hub of the Mictlan Hollows — a subterranean metropolis where the boundary between the living and the ancestral is treated as a permeable membrane rather than an absolute border, and where the most common transaction is not the exchange of goods but the exchange of memories, recorded in tokens and traded with the same seriousness that surface markets apply to currency. Ghost and Dark-type Pokémon are the city's primary population alongside human residents; Litwick drift through the canal lanes lighting the way for both living pilgrims and ancestral visitors, and Sableye operate the most active memory token stalls with a collector's intensity that their living business partners find both impressive and slightly unnerving. Bakemon-line Digimon serve as the city's ancestral liaison corps, their naturally spectral form giving them ease of movement through both the living and ancestral districts of the city in ways that bridge species cannot always achieve. The Necromus-line Pals who patrol the ritual order zones are among the most effective peace-keeping forces in any Mictlan Hollows settlement, their Dark-type presence creating an atmosphere of respectful observance that discourages disruption more effectively than any posted rules.",
    "history": "Mictlampa City grew from a single altar site that was identified as a natural convergence point for ancestral presence — a location where the membrane between the living and the dead thinned so consistently that encounters occurred without ritual preparation. The original settlement was small and religious in function, serving primarily as a receiving point for ancestral guidance. As the city's reputation spread and more living pilgrims arrived to consult with ancestors, a commercial layer developed to serve their material needs, and the memory token trade emerged as the economic backbone of the city's growth. The tiered canal system was the critical infrastructure expansion that transformed the settlement from a pilgrimage site into a fully functioning city, allowing the management of spiritual traffic flows — both the procession of living pilgrims and the patterns of ancestral presence — without the bottlenecks and ritual contamination events that had characterised the earlier unmanaged approach.",
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
    "lore": "Mist Village is a stilt-built community in the Conoocoo Archipelago's Mist Marshlands that has engineered a life around the fog rather than despite it — using the daily rise and fall of the mist layer for agricultural irrigation, passive concealment from unwanted visitors, and the reed-flute communication system that lets villagers coordinate across poor visibility without shouting. Water and Ghost-type Pokémon move freely through the village's pier networks; Phantump are considered good omens when they condense near the reed flute platforms, and Lotad families cultivate the lily pool nets that form the village's food infrastructure. Syakomon-line Digimon are regular visitors from the surrounding marsh, their aquatic comfort giving them free access to the underwater village supports that most surface visitors never see. Teafant Pals have become the village's most beloved newcomers, their gentle water-manipulation ability proving unexpectedly useful for directing biolight algae blooms toward harvesting nets. The children of the village who grew up chasing luminous frog sprites between piers have, according to local wisdom, the best spatial navigation ability of any population on the island.",
    "history": "Mist Village was founded by marsh-dwellers who chose stilt construction specifically to remain above the seasonal waterline fluctuations that made conventional ground-level building impractical in this part of the Conoocoo Archipelago. The original village was smaller, with fewer platforms and simpler connecting boardwalks, but a low-water year exposed the original support posts as insufficiently anchored and the subsequent flood season required near-complete reconstruction. The rebuilt village was designed with the flood-and-drought cycle as a primary engineering constraint rather than an afterthought, resulting in the current deeper-anchored support system and the elevated platform network. The biolight pool cultivation technique was developed about four generations ago by a villager who observed that Syakomon disturbing the pools seemed to increase their luminosity and adapted the observation into a managed system.",
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
    "lore": "The Mother Temple is the sacred focal point of the Terra Madre Basin — a temple built into living stone and root rather than cut from it, where the architecture has grown as much as it has been constructed, and where the spring wells at the nave's centre have been flowing without interruption since before the temple's recorded history. Grass and Ground-type Pokémon approach the Mother Temple with a reverence that their behaviour in other locations does not quite prepare visitors for; Eikthyrdeer walk the sacred grounds with a stillness that veterans describe as qualitatively different from their normal gait, and Sawsbuck who rest near the spring wells are considered by the temple clergy to be carrying a blessing that spreads through their herd. Rosemon-line Digimon are among the temple's most devoted attendants, their botanical data-structures responding to the Basin's leyline network in ways that manifest as extraordinary flowering displays during major ceremonies. Angewomon-line Digimon serve a protective function that the temple clergy has never felt the need to formalise — they are simply there, and threats to the temple tend not to materialise in their presence. The Eikthyrdeer Pals who graze in the sacred grounds have been formally recognised by the clergy as temple guardians, the first non-monster-franchise beings to receive such status.",
    "history": "The Mother Temple's founding accounts differ in details but agree on essentials: a group of settlers from different cultural backgrounds arrived at the same site independently within the span of a single season, each guided by a tradition that pointed to this specific location, and chose to build together rather than separately. The multi-cultural foundation is visible in the temple's architecture, which incorporates construction traditions from at least seven distinct cultural groups in a synthesis that scholars of religious architecture find either inspiring or deeply confusing depending on their prior assumptions. The Earthmother Icon requirement for access was established not as a restriction but as a form of intention-setting — the process of obtaining the icon involves a period of reflection that the clergy considers essential preparation for the temple's more intensive ceremonies.",
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
    "lore": "The Mystery Temple is the inner sanctum of Demeter's Grove — a place where the seasonal cycle of death and renewal is not merely observed but directly experienced by those permitted to enter, through initiatory ceremonies that the temple's keepers describe only in fragments and allegories. Its hypostyle hall is lit by grain torches whose light cycles in a rhythm that initiates report as synchronising with their own breathing within minutes of entry. Grass, Fairy, and Psychic-type Pokémon are found throughout the temple in unusual combinations that reflect the dual nature of its mysteries; Espeon serve as threshold guides, their psychic sensitivity allowing them to read an initiate's readiness state, while Ghost-type Pokémon represent the death-aspect mysteries and are treated as essential presences rather than hazards. BlackGatomon-line Digimon occupy a specific ceremonial role in the Mystery Temple's deepest chambers, their nature as beings that exist at the intersection of dark and light making them ideal guardians of the rites that explore both aspects of the cycle. Sphinxmon-line Digimon serve as threshold questioners, and no initiate has ever reported finding their riddles easy.",
    "history": "The Mystery Temple was established in the earliest centuries of Demeter's Grove as a dedicated space for the more intensive aspects of the grove's agricultural spiritual tradition — the practices that could not be conducted in open sacred spaces because their depth required containment and preparation. The original structure was much simpler, with a single initiation chamber; the current multi-chamber complex evolved over fifteen centuries of gradual deepening and expansion as successive generations of mystery-keepers developed new layers of the tradition. The Kernos Token requirement was established after an incident that the temple's records describe only as the Uninvited Seeing, which apparently demonstrated conclusively that unprepared access to the deeper chambers produced outcomes that the temple considers its responsibility to prevent.",
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
    "lore": "Nereid Harbor is the most welcoming port in Poseidon's Reach — a dual-level facility where surface docks accommodate conventional vessels and underwater platforms serve the sea-dwelling species who prefer transacting business without the inconvenience of surfacing entirely. The harbor's sea nymph navigation services are its defining feature; Water and Fairy-type Pokémon associated with the Nereid tradition guide incoming vessels through the reef approaches with a precision that has produced an extraordinary safety record, and the conch horn communication system they use has been adopted by the broader maritime community as a regional standard. Neptunemon-line Digimon are the harbour's most senior underwater administrators, their long-form data memory making them excellent harbour masters with recall of every significant transit event going back generations. Ningyo-line Yokai serve as the harbour's weather forecasters, their sensitivity to ocean-current and pressure changes providing advance notice of conditions that mechanical instruments detect only after the fact. Kappa-line Yokai maintain the tidal pool monitoring stations, their affinity for liminal water spaces giving them particular attunement to the harbour's edge zones where the reef meets open water.",
    "history": "Nereid Harbor was established at the site of a natural reef break that created a protected inlet on what would otherwise have been a uniformly dangerous stretch of Poseidon's Reach coastline. The harbour's early function was primarily emergency shelter — a place storm-caught vessels could reach before the reef approaches claimed them — and the nereid guidance tradition developed organically from the Water-type Pokémon and Yokai who inhabited the reef and found that guiding vessels kept the destructive ship-strikes that damaged the reef ecosystem from occurring. The underwater platform system was added centuries after the surface harbour, when the growing sea-dweller community in the region requested commercial facilities that accommodated their needs.",
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
    "lore": "Nine Dragons Falls is the most sacred waterfall site in Long Valley — a multi-tiered cascade where nine distinct water channels converge in a sequence of basins, each associated with one of the nine ancestral dragon lineages that Long Valley tradition identifies as the founders of draconic culture in the region. Dragon and Water-type Pokémon are drawn here with an intensity that veteran observers describe as magnetic; Dratini circle the lower basins in consistent formation, and Dragonite manifestations at the triple-chant intervals are documented as the highest observed density of that species anywhere on Conoco Island. AeroVeedramon-line Digimon maintain the mist arch formations during pilgrimage seasons, their aerial control preventing the spray dispersal events that occur in their absence and that significantly reduce the site's ceremonial atmosphere. Paladius-line Pals are the most recent significant addition to the falls' population, their Dragon-type presence having added a new resonance harmonic to the chant cycles that pilgrimage scholars are still documenting. The mist pearls — water droplets crystallised by draconic resonance that hover briefly before dissolving — are considered the falls' signature phenomenon and the primary object of scientific interest.",
    "history": "Nine Dragons Falls was first identified as a sacred site in Long Valley's earliest draconic records, which describe the falls as a place where the ancestral spirits of the nine founding lineages convened seasonally to review the valley's health and communicate their guidance through the water's resonance patterns. The pilgrimage tradition developed gradually around this belief, becoming formalised after a scholar documented the first triple resonance event — a spontaneous synchronisation of all nine channel frequencies that produced a cascade tone lasting seven minutes and was audible throughout the valley. The Waterfall Pilgrim Charm requirement was introduced after an unsanctioned research expedition disturbed the chant cycles during an active resonance event, producing what the site's draconic guardians described as the equivalent of interrupting an ancestral council mid-sentence.",
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
    "lore": "Nyakuza Landing is the fortified coastal base of the Nyakuza — the most organised and, by most external assessments, most genuinely dangerous criminal faction in Pirates' Bay — a settlement that looks like a fishing village from the sea and functions like a military installation on the inside. The Nyakuza's reputation rests not on raw strength but on intelligence, coordination, and the unsettling precision with which their operations are planned and executed. Dark and Fighting-type Pokémon are the faction's primary combat assets; Persian families occupy the senior security roles, their intelligence and speed combining with the Nyakuza's training protocols to produce enforcers of exceptional capability. Cattiva Pals are enthusiastic Nyakuza participants, their social orientation and natural Dark-type affinity making them ideal network operatives — they are, in the words of one Ranger report, genuinely very difficult to dislike even when they are picking your pocket. Shadowbeak Pals serve as long-range aerial surveillance, their dark plumage and flying speed making them essentially impossible to intercept once airborne.",
    "history": "The Nyakuza were established approximately a century and a half ago by a founder whose name is preserved only as 'the Captain' in Nyakuza records, a privacy-preserving tradition that continues to the present. The founding philosophy distinguished the Nyakuza from competing pirate groups by emphasising organisation over chaos, information over force, and long-term network building over individual heists. The clan's technological edge was established early, when the founding generation invested stolen resources into research capabilities rather than expansion, producing innovations that have maintained the Nyakuza's competitive advantage through multiple subsequent generations. The Nyakuza Clan Tag access requirement is enforced with a thoroughness that has made the Landing one of the most genuinely secure locations in Pirates' Bay — not because the defences are impenetrable but because the intelligence network makes undetected approach essentially impossible.",
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
    "lore": "Oberon Village is the formal governance seat of the Seelie Courts — a clearing-terrace settlement where the Fairy-type traditions of the region are organised, debated, and ceremonially maintained through a calendar of rites so precisely scheduled that the crystal pennants have learned to chime in anticipation before the ceremonies actually begin. Fairy and Psychic-type Pokémon make up the core population; Gardevoir serve as the village's primary administrative minds, their psychic attunement to emotional and social dynamics making them exceptionally suited to the diplomacy-heavy work of fae court management, while Ribombee carry ritual pollen between ceremony sites as a function so embedded in village routine that their absence during rites is treated as a weather event requiring rescheduling. Kazemon-line Digimon have integrated into the village's governance structure as ceremonial weather stewards, their wind control enabling the outdoor rites to proceed in conditions that would otherwise be untenable. Sawsbuck-kin residing near the village are considered natural seasonal advisors — their appearance in specific coat-phase patterns is used as a calendar calibration tool by the court's scheduling committee. Mossanda Pals have recently been incorporated into the banner maintenance teams, their reliable strength and gentle handling making them excellent at the careful work of repositioning resonant pennant arrays.",
    "history": "Oberon Village was founded after a sustained period of inter-court disputes in the Seelie Courts region that had caused three consecutive ceremony seasons to be held without proper coordination — a situation that the involved parties agreed was embarrassing for everyone and could not be allowed to continue. The settlement was established as a neutral administrative site, deliberately positioned equidistant from the three primary court territories, and the governance protocols developed over its first century were designed specifically to prevent a recurrence of the scheduling conflicts. The runic arch gate that controls entrance was added after a period of heightened tensions with a neighbouring Unseelie-influenced faction; it remains active but is treated more as architectural heritage than active security measure in the current era of relative stability.",
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
    "lore": "The Obsidian Halls are a labyrinthine network of volcanic glass caverns in the Conoocoo Archipelago’s Volcanic Peaks, carved by an ancient shamanic tradition into the Extreme remnants of a collapsed magma chamber, producing corridors whose polished obsidian walls reflect torch and ember light into prismatic constellation patterns on the ceiling. Fire and Rock-type Pokémon are the Halls’ primary inhabitants; Tyranitar-line species navigate the deeper passages with comfortable ease, their resonant growl causing the glass walls to vibrate in frequencies that locals call the Hall’s Song. Magmemon-line Digimon serve as forge spirit intermediaries, their volcanic data structure giving them direct communication access to the elemental presences that the shamanic tradition identifies as permanent residents of the Halls’ deepest chambers. Oni-line Yokai inhabit the ceremonial antechambers, their presence considered an indicator that the Hall’s spiritual barriers are intact — their absence, conversely, is treated as a significant warning. The Stormscale guardians that circle the Halls during specific ritual periods are among the largest and most powerful beings documented in the region, and their participation in ceremonies is considered a mark of the Halls’ continued sanctity.",
    "history": "The Obsidian Halls were not carved in the conventional sense — early shamanic accounts describe a series of guided excavations where the shamans followed directions provided by the Forge Spirits themselves, revealing chambers that the spirits described as having always been present within the volcanic rock, waiting for the right practitioners to open them. Whether this account is literal or metaphorical is a matter of ongoing debate, but the architectural precision of the Halls — their acoustic properties, thermal circulation, and sight-line alignments — is difficult to explain as the product of purely practical excavation. A significant portion of the Halls’ deepest section was sealed after an incident the records describe only as the Unbonded Eruption, and remains sealed; the shamanic community considers the sealing to be an active ongoing decision rather than a historical accident, renewed by each generation’s senior practitioners.",
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
    "lore": "Persephone Village lives the seasonal cycle rather than merely observing it — half its doors open to gardens in full bloom, half to quiet chambers where winter grief is held with the same care as spring celebration, and the village's rhythm is dictated by which aspect of the cycle is currently present. The village undergoes genuine visible transformation with the seasons: in spring and summer the gardens erupt with colour and the air smells of pomegranate blossom, while winter months see the same spaces take on a hushed, intimate quality that regular visitors describe as equally beautiful in its own way. Grass and Fairy-type Pokémon thrive here regardless of season; Florges maintain the garden infrastructure through both halves of the cycle, their seasonal transformation tracking Persephone's own, and Butterflamon-line Digimon herald the spring transition with a collective emergence that the village considers more reliable than any calendar. Ghost-type Pokémon are present and welcome throughout the year, their connection to the winter-aspect mysteries giving them a specific ceremonial role during the season that other settlements might find uncomfortable but that Persephone Village considers essential balance. Biyomon-line Pals carry the village's seasonal offerings between garden sites, their flying ability making them ideal for the scattered distribution the ritual requires.",
    "history": "Persephone Village was founded by a community who had experienced significant collective loss and chose to build a settlement that made space for grief rather than treating it as an interruption to normal life. The founding insight — that the agricultural cycle of death and renewal was a model for emotional health rather than merely a farming metaphor — shaped the village's dual-aspect architecture and the ceremonial calendar that has governed its rhythm ever since. The village's most famous innovation was the development of the Underworld Connection rites, which allow those who have lost loved ones to participate in ceremonies that the tradition holds genuinely enables communication across the boundary, a claim that scholarly visitors assess with varying conclusions depending on their priors.",
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
    "lore": "Pirate Port is the commercial and political hub of Pirates' Bay — the settlement where the pirate community conducts its official-unofficial business, from contraband auctions to crew recruitment to the complex multi-party negotiations that govern territorial rights among the Bay's competing factions. Water and Dark-type Pokémon are found throughout the Port in numbers that reflect the Bay's maritime character; Gyarados patrol the harbour approaches as a combination of security measure and status symbol, and Seadramon-line Digimon operate the deeper channel navigation services that keep large-vessel traffic moving. Impmon-line Digimon are the Port's most prolific information brokers, their Dark-type instincts for leverage and their social mobility through every level of the Port's hierarchy making them the first resource most visitors consult when they need to know something they shouldn't. Jormuntide Pals have staked out sections of the harbour floor as territorial claims that the Port's surface governance has learned to work around rather than contest. The Port Code — the set of informal rules that govern conduct within the Port's bounds — is not written down anywhere and has never been formally agreed to by any party, but violations are enforced with remarkable consistency.",
    "history": "Pirate Port grew around a natural deep-water harbour that offered shelter for large vessels in a coastline that offered very little of it. The settlement that formed was not planned but accumulated, with each generation of occupants adding structures that suited their immediate needs without reference to any overarching plan, resulting in the current layered tangle of docks, warehouses, taverns, and residences that navigates on insider knowledge rather than any logical layout. Captain Blackwater, the Port's most celebrated founder-figure, is credited in local legend with establishing the first version of the Port Code after a series of escalating disputes threatened to make the harbour too dangerous for anyone to use — an intervention that the legend credits with saving the Port and the legend's embellishments have credited with rather more than that.",
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
    "lore": "Pirate Village is the residential hinterland of the Pirate Port — a sprawling shantytown where pirate families, retired crews, and those whose relationship with the sea is more complicated than they like to explain have put down roots in the chaotic but surprisingly functional community that has grown here over three centuries. Dark and Normal-type Pokémon are the village's constant population; Mightyena families fill the role of neighbourhood watch, their loyalty to established territories giving them a predictability that the village uses as its primary security infrastructure, and Meowth and Chillet are so ubiquitous that counting them is considered a local game for children with time to fill. Impmon-line Digimon are endemic to every alley and back-market, their information networks so thoroughly integrated into the village's social fabric that they are effectively the village's nervous system. The underground tunnel network connects the village's various neighbourhoods and factions in ways that the surface street layout deliberately obscures, and knowledge of the tunnels is treated as a citizenship indicator — newcomers who don't know the routes are identifiable immediately.",
    "history": "Pirate Village began as exactly what its name suggests — a collection of temporary shelters erected by pirate crews who needed somewhere to rest, repair, and store things between voyages and found that Pirate Port's main docks were becoming too expensive for everyday residential use. The permanence crept up on the original settlers; what was meant to be a seasonal camp became a year-round residence became a multi-generational community with its own traditions, territorial boundaries, and strong opinions about how things should be done. The village's famous refusal to be formally incorporated into any governance structure — including the Port's own looser arrangements — has been tested several times by external parties and has so far survived through a combination of collective stubbornness, inconvenient geography, and the practical consideration that the village's underground networks make occupation significantly harder than its surface appearance suggests.",
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
    "lore": "The Poison Pools of Crowsfoot Marsh are one of the most paradoxically productive environments on Conoco Island — a network of toxic pools whose iridescent surface films and corrosive chemistry would be unambiguously dangerous if not for the extraordinary alchemical and medicinal value of the substances they produce. Poison and Water-type Pokémon are uniquely adapted to the Pools' chemistry; Muk families regulate the concentration of the most dangerous compounds through active consumption, performing an ecosystem service that the alchemical community is careful not to disrupt. Raremon-line Digimon have evolved data structures that treat the toxic chemistry as a nutrient resource, their presence considered a natural concentrating mechanism that improves the quality of harvestable materials. Otamamon-line Digimon serve as living pH indicators, their behaviour patterns shifting predictably in response to chemical changes that instruments would detect more slowly. The Antitoxin Permit requirement was developed in collaboration with the marsh's alchemical community specifically to ensure that harvesting activities don't exceed the Pools' natural production rate — over-extraction has historically produced chemical desert conditions that the community has learned to prevent through careful management.",
    "history": "The Poison Pools' origin is a matter of some scholarly debate — the magical accident theory, the natural geological theory, and the deliberate ancient alchemical installation theory all have adherents and none has been definitively proven. What is clear from marsh records is that the Pools have been present since before organised settlement of the Crowsfoot Marsh area, and that early settlers initially avoided the site before an apothecary tradition developed that recognised the Pools' medicinal potential. The Antitoxin Permit system was instituted after an unregulated harvesting period in the previous century produced chemical drift events that affected settlements several kilometres downwind — an experience that convinced even the most libertarian members of the marsh community that some coordination was necessary.",
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
    "lore": "Puck Town is the Seelie Courts' most chaotic and most affectionately regarded settlement — a borough where the Fairy-type trickster tradition is not merely tolerated but elevated to something approaching an art form, and where the illusory lanterns that line every lane change colour without warning because that is simply how they were made and no one has seen fit to fix it. Fairy and Dark-type Pokémon coexist here in a combination that produces the particular flavour of mischief that defines the town's character; Morelull shift lamp colours with casual disinterest, Cutiefly weave illusion threads that last just long enough to be inconvenient, and Mimikyu have elevated their natural glamour abilities into multi-lane prank cascades of genuine creative merit. BlackGatomon-line Digimon are among the town's most respected prank architects, their Dark-type affinity giving their illusions a convincing depth that purely Fairy-based efforts sometimes lack. Vixy Pals are newcomers who have embraced the town's culture with an enthusiasm that has already produced several multi-party prank events considered noteworthy even by local standards. The Glamour Core Prisms that enable the town's more elaborate displays are among the most technically sophisticated magical crafting products in the Seelie Courts, which rather undermines the town's chaotic reputation but which the residents consider a satisfying irony.",
    "history": "Puck Town was established when a community of wandering prank practitioners who had been moving through the Seelie Courts for generations decided that the logistical advantages of a fixed base outweighed the philosophical advantages of constant movement. The founding was less a deliberate settlement decision than a gradual stopping — the community paused in the current location for what was intended to be a season and simply never left. The town's reputation for disorienting visitors is historically accurate; early accounts from neighbouring settlements describe guests arriving and requiring several hours to locate the town centre despite its being straightforwardly visible, due to the pervasive signpost-rearranging activity. The current system of focus charms for navigation was developed by the town's own residents, who recognised that some baseline orientation capability was necessary for commerce.",
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
    "lore": "Pythia Village is where the Oracle's Sanctum's prophetic tradition begins — a training settlement for initiates in the early stages of developing their predictive abilities, where the focus drills, scrying basin exercises, and resonance sand circles are less demanding than the Sanctum itself but no less seriously administered. Psychic and Fairy-type Pokémon are the village's primary teaching partners; Ralts and Kirlia work alongside human initiates as fellow students as much as companions, their natural psychic sensitivity providing a reference point against which human practitioners can calibrate their own developing abilities. Clockmon-line Digimon assist with timing precision training, their accurate internal chronometry providing the temporal anchor that many predictive exercises require. Wisemon-line Digimon serve as the village's most advanced theoretical instructors, their dimensional awareness giving them a perspective on predictive mechanics that purely temporal practitioners cannot replicate. Katress Pals have emerged as unexpectedly effective advanced-tier practice partners, their Dark-type nature creating the kind of perceptual challenge that strengthens predictive accuracy in ways that easier partners do not.",
    "history": "Pythia Village was established as a staging settlement for the Oracle's Sanctum after the Sanctum's own training programs were overwhelmed by the volume of petitioners arriving with undeveloped abilities and requiring foundational instruction before they could engage with the Sanctum's more advanced work. The original village was much smaller, serving primarily as a waiting and orientation site, but expanded as it became clear that foundational training was itself a substantial undertaking that merited dedicated facilities. The expansion of the village coincided with the formalisation of the prophecy discipline pathway — the structured curriculum that takes initiates from introductory focus exercises to Sanctum qualification over a period of years rather than the previous ad-hoc apprenticeship system.",
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
    "lore": "Rimeheart Town is built around the Heart of Winter — a massive ice formation of uncertain origin that radiates cold at consistent temperatures regardless of external conditions and that has maintained this behaviour for as long as records exist, predating the town by what the local geological survey estimates as several thousand years. Ice and Psychic-type Pokémon are drawn to the Heart in ways that make Rimeheart Town one of the densest Ice-type populations in the Jötun Tundra; Regice-kin inhabit the outer formation perimeter and are treated as permanent residents rather than wild encounters. Frigimon-line Digimon are the town's primary academic community, their ice-data structures giving them direct experiential access to the Heart's emanations that purely observational researchers lack. Renamon-line Digimon serve as theoretical instructors, their psychic-ice combination providing a bridge between the purely elemental and the analytically structured approaches to understanding the Heart. Frostallion Pals arrived in the area relatively recently and have become the most visually striking inhabitants of the outer town, their crystalline forms amplifying the Heart's ambient light into aurora-like patterns during the coldest nights.",
    "history": "Rimeheart Town was established by a group of ice mages who had been studying the Heart of Winter from a distance and decided that proximity research was necessary to make genuine progress in understanding it. The original settlement was minimal — a cluster of heavily insulated structures equipped for long-term cold-weather habitation — but grew as the research findings attracted additional scholars and the scholarly community attracted the support infrastructure that scholars require. The town's most significant theoretical breakthrough — the discovery that the Heart's emanations are not constant but cycle in patterns with a period of approximately 740 years — was made by a collaboration between Frigimon-line researchers and human mathematicians comparing long-term data sets, and has significantly reframed the town's understanding of what the Heart actually is.",
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
    "lore": "The River Crossing is the threshold site of the Mictlan Hollows — the point where the River of Souls meets the living world's bank, and where those who come to remember, release, or commune with the departed must first pass the ferryman's assessment. Ghost and Water-type Pokémon inhabit the river's margins in densities that seem to increase the closer one approaches the actual crossing point; Froslass drift just above the surface, Lampent provide navigation light along the bank, and the spectral ferryman figure that appears during crossing ceremonies is believed by local tradition to be an ancient Bakemon-line Digimon whose data structure has fused so completely with the river's spiritual current that it no longer has a separate existence. Syakomon-line Digimon manage the upstream current monitoring stations, their aquatic affinity making them reliable early-warning systems when spiritual weather — the Mictlan Hollows equivalent of meteorological conditions — is building toward a significant event. Necromus Pals serve as current shade assistants, their Dark-type presence attracting the crossing spirits that the ferryman needs to complete the transit ritual.",
    "history": "The River Crossing's formal dock system was established after a period of unregulated crossings produced what records describe as drift loss — instances where living petitioners who attempted the crossing without proper guidance were pulled into the river's current and carried further into the Mictlan Hollows than they intended to go, requiring significant effort to retrieve. The Ferryman Token system was designed not to restrict access but to ensure that every crossing is supervised by someone who understands the river's behaviour patterns and can intervene if conditions shift during transit. Several generations of ferryman practitioners have added to the dock infrastructure over time, each contributing elements that reflect the spiritual understanding current in their era, making the current docking system a historical record of the tradition's development as much as a practical facility.",
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
    "lore": "Legend states the caldera floor is shaped by the Leviathan’s dreams — that every crack and basin in the rock below corresponds to a vision the sleeping fire god once exhaled into the stone. Emberkin shamans interpret the caldera’s topography as sacred text, reading its shifting vents and lava channels the way other scholars read scripture. Fire and Dragon-type Pokémon are drawn here in numbers that defy ordinary ecological explanation; Charizard elders rest on the upper rim ledges, and Haxorus lineages make pilgrimages to the caldera’s deepest point to bask in the residual divine heat. Infermon-line Digimon treat the caldera as a data crucible, entering high-temperature zones to burn away corrupted protocols and emerge with more refined combat signatures. Monster Hunter field teams classify the Sacred Caldera as a restricted observation site — the Brachydios and Rathalos sub-populations here show territorial behaviours consistent with something protecting the floor, not merely inhabiting it.",
    "history": "Formed in the cataclysmic Eruption of the Titanic Fire millennia ago, the caldera’s creation is recorded in both Emberkin oral tradition and the geological layers of the archipelago’s surrounding seabed. The eruption was not merely a volcanic event; witnesses from the mainland coast reportedly observed a column of fire that persisted for nine days and nine nights, and the ash deposits from that period contain crystallised mineral structures unlike anything produced by ordinary lava. Emberkin shamans have maintained ritual presence at the caldera floor since the first cooling allowed human approach, treating it as a living covenant with the Leviathan rather than merely a place of worship.",
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
    "lore": "Sacred Canyon serves as a natural library of the Earth's history, where each stone layer tells the story of geological ages and ancient earth magic — researchers have catalogued over forty distinct strata, some corresponding to extinction-level events, others to periods of extraordinary biological flourishing. Rock and Ground-type Pokémon revere the canyon as ancestral territory; Claydol that wander its floor have been observed tracing the wall formations with precise gestures, as though reading inscriptions only they can perceive. Gotsumon-line Digimon store compressed data in the mineral resonance of the canyon walls, using its natural crystal inclusions as external memory arrays that have outlasted every manufactured storage medium. Ancient Earth Spirits — composite beings of Ground and Ghost energy — are the canyon's true archivists, and field researchers have reported that approaching them with genuine geological questions sometimes yields access to formations otherwise sealed off as unstable.",
    "history": "Carved by earth magic and natural forces over millions of years, the canyon preserves the complete geological history of the region in its stone walls, making it one of the most significant natural research sites on Conoco Island. The earliest human accounts of the canyon describe it as already ancient — the Grass-spirit traditions of the Terra Madre Basin claim the canyon was formed when the land itself wept during a catastrophic age, and that the canyon's current shape is the Earth's scar. Rangers who hold jurisdiction over the site restrict entry to credentialled researchers and experienced guides, as the canyon's maze structure has claimed a significant number of lost expeditions over the past century.",
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
    "lore": "The Sacred Pyre is believed to be the earthly manifestation of the fire spirit's divine presence — not a fire that was lit, but a fire that simply is, as fundamental to existence as the peak it crowns. The flame shifts colour with the time of day and the spiritual state of those approaching it; white at dawn, gold at midday, and a deep violet-crimson at dusk that pilgrims describe as overwhelming to witness directly. Fire and Psychic-type Pokémon gathered here exhibit behaviours not seen elsewhere in the Agni Peaks: Victini have been documented circling the pyre in slow spirals for days at a time, and Chandelure flames turn a pure white in its presence. Agunimon-line Digimon treat the pyre as the highest calibration point for fire-attribute data purification, making a climb to the Sacred Pyre the unofficial final trial for any fire-type Digimon seeking to advance its evolutionary potential. Those who approach with impure intent — documented in more than a few warning records maintained by the resident priest order — report the pyre extinguishing and reigniting in a colour that, by all accounts, no one has looked at twice.",
    "history": "The pyre has existed since ancient times, predating any written record in the Agni Peaks region and possibly preceding the human settlement of the island entirely. The priest order that maintains the site — formally chartered under the Spirit Keeper faction — holds oral histories describing the flame as present when the first intelligent beings reached the peaks, already burning and already sacred. Periodic attempts to study the fire with conventional instruments have uniformly failed; thermometric readings return impossible values, and analysis of the ash yields compounds that should not exist at any naturally producible temperature. The pyre's status as the most sacred site in all of Agni Peaks is essentially unchallenged, even by factions that contest most other territorial claims.",
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
    "lore": "Sages claim overlapping destinies precipitate as mist stratification here — that the density and colour of each vapour column corresponds to the convergence of specific fate-threads, and that reading the cavern's mist at any given moment is equivalent to reading the immediate futures of everyone presently standing in it. Psychic and Fairy-type Pokémon are the most reliable navigators of the vapors: Grumpig stabilise the vision currents that would otherwise overwhelm human visitors, while Chimecho produce tonal resonances that keep the mist from stratifying into feedback loops. Wisemon-line Digimon have established permanent monitoring stations at the major vent junctions, using the geothermal data pulses to refine their predictive modelling software into capabilities that reportedly exceed any manufactured oracle system. The trance vapors themselves are chemically unremarkable outside the cavern — samples collected and analysed at sea level show nothing unusual, which the sages take as confirmation that the prophetic property is not chemical but something the rock itself produces.",
    "history": "Discovered after a seismic shift opened the lower vent lattice and released the first vapour columns into the upper Oracle's Sanctum passages, the Sacred Vapors were initially treated as a geological curiosity rather than a sacred site. The first documented trance experience was accidental — a survey team measuring the new vents reported collective visions of events that subsequently occurred within the following week. Spirit Keeper scholars arrived within a month and have maintained jurisdiction over the site since, formalising the Vapor Rite Seal access requirement after three early visitors experienced vision overloads that required months of recovery.",
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
    "lore": "The Serpent Pyramid is the most sacred site of Quetzalcoatl worship, where the feathered serpent god reveals his greatest mysteries to those who have proven themselves worthy through years of devotion and demonstrated mastery of wind magic. The pyramid's stepped tiers are not merely architectural but functional — each ascending tier intensifies the wind magic ambient at that elevation, so that the uppermost platform exists in a near-constant state of divine atmospheric charge that has been measured as generating localised weather phenomena. Flying and Dragon-type Pokémon treat the pyramid with extraordinary deference; Salamence that would challenge almost anything else in the Quetzal Winds will circle the pyramid at a respectful distance and not descend unless the wind currents specifically draw them in. Seraphimon and other celestial-data Digimon regard the pyramid as one of the few non-digital locations where their data-light form achieves its maximum resonance, making it a pilgrimage destination for Digimon of the highest angel-attribute evolutionary lines. Those who have stood at the apex report that the wind does not blow here so much as listen.",
    "history": "Built by the greatest architects of the Quetzal Winds culture under what their records describe as direct divine guidance — the founding priests claimed they did not design the pyramid so much as receive it in a continuous sequence of wind-delivered visions — the pyramid's construction methods remain partially unexplained by modern structural analysis. The stone alignment tolerances exceed what should have been achievable with period tools, and the wind-channelling properties of the tier geometry are precise enough that modern aeronautical engineers have confirmed the structure functions as an intentional amplifier rather than an accidental one. The Plumed Serpent Sigil access requirement was formalised after the Ranger-aligned research team that attempted an unsanctioned survey in the early settlement period encountered what their filed report describes only as a wind that had opinions.",
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
    "lore": "Ravens teach that truth emerges sharper when carved from layered obscurity — and Shadow Village has built an entire intellectual culture around that principle, treating the withholding of direct information as a form of respect for the person seeking it. Dark and Ghost-type Pokémon are the village's most prominent residents and effectively its information network; Honchkrow families run the echo-whisper alleys, encoding and decoding messages in rune-fragment sequences that require Whisper Corvid familiarity to read. Ravemon-line Digimon serve as the village's memory infrastructure, their data-shadow forms ideal for storing records that shouldn't be held in visible media. Void Scribes — Banette and Phantomon who have taken up the shadow-vellum craft — inscribe the village's deepest records in writing materials that resist illumination by design, ensuring that the archive can only be accessed by those with the sensitivity to read in perpetual dusk. Outsiders who expect Shadow Village to be sinister are usually surprised to find it functional, methodical, and quietly proud of its unusual approach to knowledge management.",
    "history": "Formed after migrating dusk currents stabilised over the basin and created the permanently low-light conditions that make the settlement possible, Shadow Village was not originally planned as a centre of esoteric scholarship — it began as a refuge for Dark-type monster communities whose behaviour made cohabitation with more light-adapted settlements difficult. The founding residents developed the shadow-archive system out of practical necessity: their natural light-suppression abilities meant that conventional written records were routinely obscured, and encoding information into shadow-medium became the functional alternative. Over generations, what began as a workaround became a philosophy, and Shadow Village is now recognised across Conoco Island as the most reliable source of information that other archives have deemed too sensitive to preserve in conventional form.",
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
    "lore": "Shooting Star Peak aligns with the three major seasonal meteor streams in positions that have been precisely mapped over centuries, allowing the installation of catch-nets at the exact coordinates where fragment density peaks — maximising harvest yield while minimising the navigational chaos of working in an active impact zone. Psychic, Ice, and Fairy-type Pokémon are the only species capable of working the peak's extreme altitude comfortably; Deoxys-form entities appear during major meteor events and have been documented assisting with fragment collection in exchanges that no researcher has yet explained, and Minior descend in their protective shells regularly enough to have become a logistical consideration for the net maintenance teams. Solarmon-line Digimon manage the cosmic energy conduit arrays, their data-light bodies naturally resonant with the stellar charge that infuses the collected meteorite fragments. Angewomon-class Digimon serve as emergency stabilisers when a meteor convergence event produces more cosmic energy than the conduits can process safely, absorbing the overflow into their own data structures without apparent harm. The Celestial Catch Permit requirement is not bureaucratic formality — the altitude, the active impact risk, and the unpredictable cosmic energy surges make this one of the three most dangerous worksites in the Sky Isles.",
    "history": "The first nets were woven from aurora silk arrays anchored by prism pylons driven into the peak's upper ridge — a construction method developed by the Featherless Ones faction's early skycraft engineers, who recognised the peak's alignment properties before the formal meteor-stream charts were compiled. The original infrastructure was destroyed in a major convergence event approximately two centuries ago and rebuilt with reinforced materials, incorporating the lesson that the nets needed to be sacrificial rather than permanent. The current installation philosophy — nets designed to be replaced each major season rather than maintained indefinitely — has reduced catastrophic infrastructure losses to near zero, and the peak is now considered one of the most reliably productive resource extraction sites in the entire Sky Isles.",
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
    "lore": "Legends say every story ever told within earshot of the Anansi Woods echoes here as a faint phosphor strand — and the crystalline web stacks are dense enough that the library's oldest sections produce a continuous low luminescence that requires no external light source. Bug, Psychic, and Fairy-type Pokémon maintain the archive as a matter of instinct as much as choice; Joltik keep the static-charge catalog threads from degrading, Dustox memorise rune patterns and can regenerate damaged scroll sections from memory alone, and Shuckle infuse the outer silk layers with mineral clarity treatments that increase longevity by an order of magnitude over untreated filament. Tentomon and Crystamon Digimon have developed a partnership with the Index Weaver population, combining their electric-data cataloguing with the Shuckle mineral process to produce preservation-quality archives that far exceed what either species manages alone. The library is self-curating in a way that researchers find simultaneously impressive and unsettling — damaged panels are repaired overnight by resident wildlife without instruction, and sections deemed insufficiently accurate by the community are quietly restructured without anyone having made the decision.",
    "history": "The Silk Library expanded to its current scale after the convergence of three elder loom clusters formed a stable lattice large enough to support multi-tier canopy construction, an event that the Anansi Woods community treats as the library's founding rather than merely its growth. Before the convergence, each loom cluster maintained its own archive in isolation, and the resulting records were fragmented and sometimes contradictory. The merger required years of negotiation among the elder spider-lineage communities, and the integrated archive they produced is credited with resolving several long-standing disputes about the Anansi Woods' history that had previously been unanswerable due to incomplete records. Access via the silk lift platforms is a concession to non-web-capable visitors — the original library had no such accommodation, and the platforms were added only after the facility began attracting scholars from outside the Woods.",
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
    "lore": "Skull Rock has claimed more ships than any other natural formation in the known world — conservative estimates put the wreck count above three hundred, and the actual number is likely higher given that poorly documented vessels don't appear in official tallies. Pirates use its treacherous waters as both execution ground and navigational trial, reasoning that a sailor who threads the hidden reef system in fog and arrives at the interior anchor point has demonstrated the spatial awareness and composure that marks a genuine seafarer. Water, Dark, Rock, and Ghost-type Pokémon are the reef's dominant wildlife, and they have developed an unusual tolerance for pirate crews that arrive bearing the Reefchart Medallion — Jellicent that would elsewhere attack boats on sight have been documented escorting medallion-bearing vessels through the worst reef passages. Drifblim and Maraith Digimon that manifest as ghost ships near the Rock are particularly dangerous to new arrivals, as they appear credible enough to follow before leading navigators onto the reef system. The skull-shaped formation itself is not a coincidence of geology — old pirate records describe it as having been shaped, over generations, by the accumulated psychic residue of the drowned.",
    "history": "For over 800 years, Skull Rock has been both feared and revered by pirates across Pirates' Bay, with the earliest written records describing it in terms that suggest its supernatural reputation was already well established by then — implying an oral tradition several centuries older still. Countless execution ceremonies, treasure hunts, and initiation rites have taken place in its shadow, each adding another layer of psychic residue to the site and, by the account of Ghost-type specialists who have studied the area, actively increasing the density and aggressiveness of the spectral wildlife population. The Nyakuza faction currently holds informal jurisdiction over Skull Rock's approach channels, using their knowledge of the safe routes as leverage in negotiations with incoming vessels — a fact the Ranger authority disputes but has not yet resolved.",
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
    "lore": "Sky Harbor's engineering marvel is that its aerial dock platforms are not fixed — they ride the same layered slipstream corridors that bring vessels in, shifting position throughout the day to remain in the most aerodynamically stable alignment with the current jet pattern. Flying, Electric, and Steel-type Pokémon are integral to the harbour's operation: Wingull families serve as living lane-markers for incoming craft, Skarmory patrols the dock infrastructure for micro-fractures that could become catastrophic at altitude, and Magnezone-line entities manage the harbour's electrical systems with a precision no human technician can match. Peckmon-line Digimon handle the signal relay network, their wind-attribute data making them ideal operators in an environment where conventional electronic signals are routinely disrupted by static discharge. Galeclaw Pals run the lighter cargo transport routes between platforms, their natural agility in crosswind conditions making them more reliable than mechanical systems for time-sensitive loads. The licensed flight clearance requirement exists not for bureaucratic reasons but because an unlicensed vessel in the slipstream corridors risks collision with established traffic lanes in conditions where evasive manoeuvres may not be possible.",
    "history": "Sky Harbor expanded to its current tri-lane scale after congestion studies revealed that the original single-lane beacon grid was creating dangerous stacking during peak transit windows — vessels queuing in the slipstream were generating turbulence for those below them. The beacon grid optimisation introduced simultaneous arrival and departure corridors at different elevations, reducing average wait time and eliminating the stacking hazard entirely. The expansion also incorporated the Featherless Ones faction's request for dedicated wind-vessel repair gantries, which had previously been unavailable at altitude and required damaged craft to make hazardous descents for repairs.",
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
    "lore": "The Starlight Observatory was built precisely where three auroral nodes converge — a positioning that was not accidental but the product of decades of celestial survey work, as the convergence point generates atmospheric conditions that amplify telescope clarity to a degree not achievable at any other location in the Sky Isles. Psychic and Ice-type Pokémon are the observatory's most consistent research partners: Beheeyem independently chart orbital resonance patterns and have contributed data that the observatory's human astronomers have incorporated directly into published sky maps, and Latios-line Pokémon circle the apex spire in patterns that correlate with significant celestial events in ways that remain unexplained. Wisemon-line Digimon operate the Cosmic Prediction Array's data-processing functions, their analytical capabilities making them the only personnel able to process the volume of data the multi-spectrum array generates in real time. The Star Communion Chamber is the observatory's most restricted area — Psychic-type specialists who have spent time there describe the experience as receiving information rather than gathering it, as though the stars themselves were making observations about their observers.",
    "history": "The Starlight Observatory expanded to its current form after the development of the crystal lattice framework allowed multi-spectrum scanning capabilities that the original single-lens design could not support. The original structure was a simple observation tower used by the Featherless Ones faction for navigation purposes; its transformation into a research facility began when Beheeyem communities in the area began consistently appearing at the tower during significant astronomical events and were found to be generating observational data of considerably higher quality than the tower's instruments. The current collaborative model — human astronomers, Psychic-type Pokémon, and Digimon analytical systems working in structured partnership — was formalised after the first joint paper produced by the collaboration was accepted as the definitive reference for Aurora Heights stellar cartography.",
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
    "lore": "Legends claim the first island epoch reset — the catastrophic realignment of the island's leyline network that geomancers date to approximately four thousand years ago — was triggered here under a triple eclipse when all three of the site's alignment beams fired simultaneously for the first time. Rock and Psychic-type Pokémon treat the Stonehenge Site as a place of deep reverence: Solrock gather at the ring during every significant astronomical event and have been observed in apparent communication with the Alignment Wisps that manifest at the monolith junctions, and Claydol rotate slowly in the inner ring regardless of observed seasonal alignment, as though operating on a calendar no one else can see. Guardromon-line Digimon maintain the Rune Sentry function at the outer markers, their mechanical precision making them ideal for the continuous minor ley adjustments that keep the ring stable. The deeper sub-ring layers — accessible only by solving the harmonic lock sequences that seal the primary excavation tunnels — are believed by the Spirit Keeper faction to contain infrastructure predating the island itself, though no confirmed access has been documented.",
    "history": "Excavated partially in a series of Ranger-sponsored digs that reached the third sub-ring layer before the harmonic lock sequences halted progress — not through any physical barrier but because the instruments brought into the lower chambers began returning temporal readings inconsistent with the date of excavation, causing the lead researcher to halt work pending analysis that has never been fully resolved. The surface ring and first sub-ring have been mapped and are considered stable; the Druidic Alignment Rod access requirement was introduced after an unlicensed visit during a solstice alignment resulted in a Portal instability event that displaced three researchers to locations on Conoco Island approximately fifteen kilometres from the site. They were physically unharmed but describe the experience as having lasted several days subjectively.",
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
    "lore": "Storm Dance Village preserves the ancient traditions of communicating with the Thunderbird through sacred dances that mirror the movement of storms and the flight of the great spirit — ceremonies in which the rhythmic percussion of thunder drums is not merely accompaniment but direct address, each beat pattern corresponding to a specific message in the Thunderbird's ritual dialect. Electric, Flying, and Ground-type Pokémon participate in the ceremonies not as audience but as co-celebrants: Altaria descend from the upper peaks during rain rites, Sawsbuck Thunder Elk whose antlers spark with genuine electrical discharge lead processions through the village perimeter, and Ursaring Dance Bears have participated in the village's ceremonies for so many generations that they are considered founding members rather than wildlife. Monochromon-line Digimon have taken up residence in the village's outer pastures, their reliable thunderstorm weather-sense making them valuable as early-warning systems that allow the shamans to begin rain rites at precisely the right atmospheric window. Outsiders who approach Storm Dance Village with genuine respect and appropriate offerings are welcomed into outer ceremony positions — the tradition holds that the Thunderbird can hear sincerity regardless of cultural origin.",
    "history": "Founded by shamans who received the first Thunderbird communication in a storm that lasted nine days and left no destruction in its wake — an event the founding oral histories describe as the Thunderbird choosing to speak rather than act. The village has maintained these sacred traditions for generations with a continuity that has survived multiple regional upheavals, in part because the Thunderbird's continued responsiveness to the dances provides ongoing experiential confirmation of the tradition's validity. The shamanic lineage that holds the Thunderbird's ritual dialect has recently entered into a formal information-sharing agreement with Spirit Keeper scholars, creating written documentation of the ceremony structures for the first time — a decision that generated significant internal debate about preservation versus secrecy.",
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
    "lore": "The Storm District is the commercial heart of the Nimbus Capital — a marketplace where every transaction is powered by the same storm energy that makes the Sky Isles habitable, and where the controlled lightning running through the arc lamp grid is as much a symbol of the capital's authority as it is a practical utility. Electric, Flying, and Steel-type Pokémon are both the district's workforce and its most active traders: Magnezone entities run the wind-forge stalls that produce storm-treated goods available nowhere at lower altitude, Jolteon couriers carry time-sensitive documents and small cargo between platforms at speeds that mechanical alternatives cannot match, and Zapdos-line creatures serve as the district's most visible symbol — their presence in the upper arc lamp grid is both a security measure and an advertisement. Andromon Digimon manage the district's automated trading systems, their industrial-data attributes making them ideal operators of the lightning-powered receipt and inventory infrastructure. The Storm Market Writ requirement reflects the capital's position: access to the district's most powerful trade networks requires demonstrating that you are a legitimate participant rather than a weather tourist.",
    "history": "Established as the main trading hub of Nimbus Capital when the district's controlled lightning infrastructure was first scaled to commercial capacity, the Storm District grew rapidly once the wind-forge technology that produces storm-treated goods was formalised and made available to licensed vendors. The district's current layout — arc lamp grid, wind-forge stall rows, and the slipstream courier network — emerged from three successive expansion phases driven by trade volume that consistently exceeded projections. The Storm Silk trade in particular, once a specialist craft, is now the district's highest-value commodity category and has drawn merchant families from as far as Conoco Island seeking access to the Nimbus Capital's production infrastructure.",
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
    "lore": "The Storm Riders Outpost was founded to tame the fractal storm lanes of the Tempest Zones for long-range traversal — to convert what was previously an impassable band of weather chaos into a navigable, if demanding, high-speed route connecting the Sky Isles' more distant reaches. Electric, Flying, and Steel-type Pokémon are the outpost's permanent staff in all but name: Emolga draft-ride between the rod arrays as living turbulence monitors, Rotom-form entities log micro-current fluctuations that feed into the Jet Stream Cartography Deck's live charts, and Axew Ion Drakelet juveniles practice charge cycling along the spire peaks in conditions that develop the storm resilience they will need as adults. Raidramon-line Digimon serve as the outpost's most critical safety asset — their ability to absorb and redirect electrical charge makes them the first responders when a lightning chain event produces overcharge conditions that would otherwise knock human riders off their anchors. The Storm Rider License is earned through a documented series of escalating traversal trials, culminating in a solo run through the triple shear corridor without assistance — a requirement that eliminates a significant number of applicants and is considered non-negotiable.",
    "history": "The outpost expanded to its current operational scale after the successful mapping of the triple shear corridor — a notoriously unpredictable storm lane that had caused the most traversal incidents of any route in the Tempest Zones. The mapping expedition that produced the working chart lost two vessels to the corridor's vortex collapse behaviour before developing the monitoring protocol that made safe transit possible, and the current magnetic anchor platform design incorporates lessons from those losses directly. The outpost's expansion also attracted the Ion Drakelet population, which had previously avoided the area; researchers believe the new anchor infrastructure provides stable charge-cycling points that the juvenile dragons need for development, and their presence has been welcomed as an unplanned but significant ecological benefit.",
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
    "lore": "Story Village is where the foundational narratives of the Anansi Woods begin — not in written form or even spoken word, but as simple lattice songs encoded into the first web structures that young weavers produce under elder guidance. Bug, Fairy, and Dark-type Pokémon are the village's core community; Venipede hop web-to-web spreading fresh narrative spores that contribute new story material to the active archive, Kricketune serve as Silk Tutors whose musical output literally guides apprentice weavers' hands through the proper glyph loops, and Araquanid Archive Menders repair frayed lore threads before the story they contain degrades past recovery. Tentomon and Waspmon Digimon work alongside the archive community as structural assistants, their electric-data properties helping reinforce the web infrastructure against the humidity that gradually weakens untreated silk. The Night Glow Tale Loom activates at dusk and produces a complete bioluminescent rendering of the day's new story contributions — the village's most visited spectacle, and the most reliable way to understand what the Anansi Woods considers worth remembering on any given day.",
    "history": "Story Village expanded to its current canopy-spanning scale when the elder weavers of the Anansi Woods made the deliberate decision to decentralise archive growth rather than concentrate all new story threads in the Silk Library. The reasoning was cultural rather than logistical: the library was becoming a repository of finished works, while the village needed to remain a living place where stories were actively made. The decentralisation allowed each generation of apprentice weavers to contribute directly to an accessible local archive rather than submitting work to the library's more formal curation process, and the resulting increase in story diversity and volume has been cited as one of the most significant developments in Anansi Woods cultural history.",
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
    "lore": "The Summer Court is believed to anchor the island's cyclical emotional rejuvenation — that the festivals celebrated here do not merely lift the spirits of those attending but generate a warmth that propagates outward through the Seelie Courts' leyline network and influences the ambient emotional state of Conoco Island as a whole. Fairy, Fire, and Grass-type Pokémon treat the Summer Court as their spiritual apex: Cleffa trail radiant sparks during the festival dances in numbers that make the court glow independent of the natural sunlight, Florges conduct bloom synchronisation rituals that coordinate flower opening across the entire Seelie Courts region, and Rapidash Sunflare Heralds announce the rite sequences in solar glyphs visible from the neighbouring regions. Lilamon-line Digimon serve as the court's bloom cycle administrators, their plant-data attributes making them naturally suited to the synchronisation work that underpins the Summer Court's most dramatic visual spectacles. Angewomon-class Digimon participate in the Joy Renewal Ceremonies in a capacity the court's records describe as voluntary — they come because the Summer Court is, by measurable spiritual metrics, the most positive-energy site in the entire island chain.",
    "history": "The Summer Court formed when a perennial bloom alignment in the Seelie Courts region stabilised the ambient warmth to year-round solstice conditions — an event that the Fairy-type communities of the area treated as an invitation to establish permanent festival infrastructure rather than seasonal celebrations. The Solstice Circlet access requirement was introduced not to restrict entry but to ensure that those arriving at the court's most intensive ceremony periods had made the spiritual preparation that makes the experience beneficial rather than overwhelming; the court's records document a small number of visitors who arrived unprepared and experienced joy-overload states requiring recovery time. The Summer Court and the Winter Court are the Seelie Courts' two anchor points, and the tension between them — not antagonistic but complementary — is considered the primary driver of the region's extraordinary magical diversity.",
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
    "lore": "Tapas Town represents the ancient concept of spiritual austerity and self-discipline — the deliberate embrace of difficulty as a path to clarity, using the extreme heat of the Agni Peaks not as an obstacle but as the lesson itself. Fighting, Fire, and Psychic-type Pokémon are the town's most consistent residents and training partners: Medicham meditate for days at a time in the hottest accessible positions on the lava paths, and visiting monks consider training alongside a Medicham to be one of the most reliable methods of accelerating their own practice. Agumon-line Digimon resident in Tapas Town have developed fire-attribute tolerances well above their species norm through generations of voluntary exposure to the town's endurance protocols, and several have achieved evolutionary progressions that the town's records attribute directly to the discipline practices they adopted here. Heliolisk-line Pokémon are the town's natural fauna, their thermal regulation making them ideal companions for visitors learning to manage heat exposure. The town's governing philosophy holds that the volcanic environment is not hostile but instructive, and that the Agni Peaks' fire is not a danger to be survived but a teacher to be respected.",
    "history": "Established by wandering ascetics who chose this harsh volcanic location after surveying several more moderate sites and concluding that comfortable conditions produced comfortable practices rather than transformative ones, Tapas Town has been a magnet for serious spiritual seekers ever since its founding monks demonstrated that sustained residency here produced measurable changes in Fire-type affinity, endurance capability, and psychological resilience. The town attracts practitioners from across Conoco Island's spiritual traditions — the Spirit Keeper faction maintains a small representative office here, as does an independent Psychic-type research group studying the neurological effects of sustained meditation under extreme temperature conditions. The records kept by the founding monk lineage document every resident and visitor's progression, and are considered one of the most detailed longitudinal studies of spiritual development available anywhere on the island.",
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
    "lore": "Tellus City represents the Roman understanding of earth as a nurturing mother — a philosophy made literal here, where the architecture is not built on the ground but continuously grown from it, with buildings that add new rooms by agreement with the stone rather than through excavation. Rock, Ground, and Grass-type Pokémon are the city's foundational residents; Golem families serve as living structural supports in the most complex formations, Ground elementals maintain the subsurface pressure balances that allow the buildings to grow without destabilising, and Excadrill-line Pokémon manage the underground tunnel network that forms the city's hidden secondary transit system. Grottomon-line Digimon are the city's most respected earth-magic practitioners, their geological data attributes allowing them to diagnose developing structural issues in the living stone weeks before they would become visible to human observers. The Earth Crystals that form in the city's deepest rock layers are not mined but accepted as gifts — the tradition holds that Tellus offers them when the city's caretaking has been adequate, and that a period without new crystals is a form of feedback rather than a geological accident.",
    "history": "Built by earth mages who discovered in the Terra Madre Basin's geology a responsiveness to directed intention rather than mere physical force, Tellus City grew organically over centuries as each generation of inhabitants learned more refined methods of working with the living stone. The Telluric Sigil access requirement was introduced relatively late in the city's history — originally the settlement was open to all — after a period when rapid external interest led to unsupervised construction attempts that caused significant structural damage by treating the living rock as ordinary building material. The current governance model, which includes Rock-type monster community representatives in all major construction decisions, is considered a restoration of the founding philosophy rather than an innovation.",
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
    "lore": "Tenochtitlan Sky represents the pinnacle of Aztec achievement elevated — literally — where the great city was lifted into the heavens by Quetzalcoatl's feathered-serpent power to preserve it from earthly corruption and continue its civilisational mission at a higher register. The city floats not passively but dynamically, adjusting its position relative to the wind currents beneath it; the cloud-canal system that replaced the original lake-canal network functions by the same engineering principles but uses compressed air currents rather than water, meaning that everything moves slightly more and everyone is expected to have good balance. Flying, Dragon, and Fairy-type Pokémon are the city's primary workforce and defence; Rayquaza-line entities are the closest thing to governing authority in the upper districts, Altaria Wind Quetzal serve as the city's message-carriers and cultural diplomats, and Galeclaw Pals run the market stalls with the tethered competence of creatures who have mastered the city's constant gentle motion. Airdramon Digimon serve as the city's aerial cavalry, their dragon-wind attribute making them ideal for the long-range patrol routes that keep Tenochtitlan Sky's cloud-canal approaches secure. The Feathered Sky Writ requirement is not bureaucratic — the city is genuinely inaccessible without flight ability, and the writ ensures that those arriving have demonstrated the aerial competence to navigate the city's dynamic wind environment without becoming a hazard to themselves or the cloud-canal traffic.",
    "history": "Created when the feathered serpent god raised the greatest city of the Quetzal Winds culture into the sky — an event recorded in the founding chronicles as the city's completion rather than its relocation, as the ascent fulfilled a prophecy that had guided the city's construction from its first stone — Tenochtitlan Sky has become a centre for wind magic and sky worship that is unrivalled anywhere in the island chain. The floating metropolis has required significant engineering adaptation over the centuries as the cloud-agriculture systems, wind-canal maintenance protocols, and structural integrity methods unique to a city in permanent flight were developed through hard-won experience. The Sky Gold trade that flows through the city's sky-temples has made Tenochtitlan Sky one of the most commercially significant sites in the Quetzal Winds region, drawing merchants who make the difficult flight to access goods that simply do not exist at lower altitudes.",
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
    "lore": "Terra Village embodies the nurturing aspect of Mother Earth made tangible — the soil here is not merely fertile by geological fortune but alive with a low-level earth magic that responds to attentive care, producing crops of quality and variety that agricultural researchers consistently struggle to replicate elsewhere even with equivalent soil composition data. Grass, Ground, Bug, and Fairy-type Pokémon are the village's essential partners in its agricultural work: Comfey families tend the crop rows as garden spirits with genuine botanical knowledge, Diggersby-line Pokémon aerate the soil through burrowing patterns calibrated to the specific depth needs of each planting season's crops, and Rattata-Chuumon pairs manage grain collection with an efficiency that the village's human farmers have consistently failed to improve upon through mechanisation. Palmon-line Digimon serve as the village's soil diagnosticians, their plant-data attributes allowing them to assess nutritional deficiencies and magical imbalances in the earth faster than any conventional analysis method. The Miracle Soil designation — given to Terra Village's topsoil samples in the agricultural research literature — is treated by the villagers themselves as a description of good maintenance rather than a natural gift, reflecting a philosophy that the earth's generosity is earned rather than inherited.",
    "history": "Founded by farmers who discovered a natural confluence of earth magic at this specific location in the Terra Madre Basin and recognised it as the basis for a different kind of agricultural practice — one built on partnership with the land's living systems rather than management of them — Terra Village has perfected sustainable farming methods over generations of collaborative refinement between human residents and the Grass and Ground-type monster communities who were already working the land when the first settlers arrived. The village has resisted several pressures to scale its production methods for export, reasoning that the Miracle Soil conditions cannot be replicated and that attempting to do so would compromise the partnership model that produces them. The earth blessing ceremonies that mark each planting season are not ceremonial in the decorative sense but functional — participants describe them as genuine negotiations with the land about the coming season's plans.",
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
    "lore": "The Thunder Arena's geometry was not designed for aesthetics but for physics — every angle of the Lightning Battle Grid's conductor placement is tuned to focus resonance into safe discharge corridors that contain the combatant's full electrical output without losing it to the surrounding atmosphere, meaning that a fight at the Thunder Arena is played with consequences that softer venues simply cannot replicate. Electric, Flying, and Steel-type Pokémon populate the arena in roles as diverse as the infrastructure itself: Plusle Arc Sprites stitch minor arcs between conductor studs as part of the arena's continuous calibration process, Luxray Bolt Monitors adjust discharge timing sequences to match the day's atmospheric conditions, and Zapdos-line Storm Gladiators channel multi-bolt surges through their wing arrays in demonstrations that the arena's records classify as the highest practical output events regularly achievable by non-legendary combatants. Andromon and Machinedramon-line Digimon serve as the arena's technical staff, their steel-data attributes making them the only personnel capable of working inside the charge synchronisation pillars during active sessions. The Storm Charter requirement exists in part because the Thunder Arena's discharge events affect the surrounding wind lanes — uncredentialled combatants whose outputs deviate from the arena's calibration ranges cause problems for Sky Isles air traffic that extend well beyond the arena's walls.",
    "history": "Erected after early informal duels in the Tempest Zones repeatedly destabilised surrounding wind lanes and generated complaints from Sky Harbor traffic coordinators who found their approach corridors disrupted by rogue discharge events, the Thunder Arena was designed specifically to contain what informal combat in the region could not. The original design went through three iterations before the arc geometry was tuned correctly; the first two produced arenas that contained the discharge but dampened it to ineffectiveness, which the combatant community rejected as defeating the purpose. The current design — which contains the discharge while allowing it to express fully within the grid — was achieved through a collaboration between the arena's engineers and the Zapdos-line community, whose intuitive understanding of discharge propagation contributed the critical adjustments that made the safe corridor system functional.",
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
    "lore": "Thunder Mesa is where the Thunderbird's voice is loudest — the flat-topped formation's stone chamber geometry creates echoes that some say contain messages from the spirit world, though the shamans of Storm Dance Village are careful to distinguish between the mesa's natural acoustic amplification and actual Thunderbird communication, noting that the former is impressive and the latter is rare. Electric, Flying, and Rock-type Pokémon have established the mesa as their primary Thunderbird Heights territory: Heliolisk Lightning Lizards position themselves in the highest-exposure positions to absorb lightning strikes directly into their biology, Crobat-Devimon pairs navigate the echo chambers using the thunder reverberations as echolocation in conditions where conventional sonar would be overwhelmed, and Pikachu Static Mouse populations have evolved fur-charge tolerances that make them effectively immune to the mesa's baseline electrical conditions. Raiju-line Yokai treat the mesa as sacred territory, and their presence in numbers is one of the clearest indicators that a significant Thunderbird Heights spiritual event is approaching. The Mesa Grounding Spike access requirement is not optional — the mesa's electrical exposure at the rim exceeds fatal thresholds for unprotected visitors during the frequent lightning events, and the spike's grounding function is a literal survival tool rather than a ceremonial one.",
    "history": "The mesa has been shaped by millions of lightning strikes over millennia, creating the natural stone chamber formations that give it its famous acoustic properties — a process that geologists estimate is ongoing, with each significant lightning season adding new fracture patterns that modify the echo profiles in ways that the Thunderbird Heights shamans track as part of their seasonal spiritual calendar. The mesa's role as the Thunderbird's voice site predates the formal Storm Dance Village tradition by an indeterminate period; the earliest written accounts describe the mesa as already a known sacred site when the first shamanic lineages established themselves in the region. The quartz crystal deposits in the rim walls are a by-product of the long-term lightning exposure — their formation required the specific mineral composition of the mesa's base rock combined with sustained high-temperature discharge events across geological time, making them impossible to synthesise and genuinely irreplaceable as resonance-amplification material.",
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
    "lore": "Tianlong City's tower geometry is not merely beautiful but astronomically functional — the spiral pagoda crowns align with the seasonal dragon constellation arcs such that at each solstice and equinox, the incense updrafts produced by the ceremonial fires are drawn along the constellation's projected path through the city's airspace, creating a visible skyward script that the city's scholars treat as the most direct form of celestial correspondence available to them. Dragon, Fairy, Steel, and Electric-type Pokémon are the city's intellectual and administrative community: Altaria Sky Attendants maintain the incense updraft channels that are as essential to the city's function as any structural element, Goomy-Seadramon pairs trace vapor scripts around the tower crowns as part of the Celestial Calligraphy Courts' daily output, and Dragonite Celestial Archivists ensure the integrity of the Imperial Jade Archive's layered chronicles with the kind of attention to continuity that spans centuries. Wisemon-line Digimon manage the city's data infrastructure, their analytical capabilities making them the primary processors of the astronomical data that the dragon constellation alignment system generates. The Dragon Breath Resonance Wells that descend through the city's foundation levels are the most restricted area — elder drakes whose breath charges the wells regularly caution that their output, improperly approached, is not merely warm.",
    "history": "Founded when the elder drakes of the Long Valley's scattered scholarly aeries decided that dispersed research was producing slower progress than unified study could achieve, Tianlong City was built to the elder drakes' specifications, which is why its architecture prioritises aerial access, incense thermal management, and vertical spatial relationships that human-designed cities rarely emphasise. The unification of the dispersed aeries was not without friction — several lineages maintained independent archives for a generation after the city's founding — but the Imperial Jade Archive that resulted from the eventual full integration is now considered the definitive reference collection for dragon-lineage scholarship in the entire island chain. The Celestial Edict Seal access requirement reflects the elder drakes' ongoing governance role: entry to Tianlong City's most significant institutional areas requires demonstrated familiarity with the greeting protocols and scholarly conventions that the founding lineages established, and which are enforced with the consistent precision that comes from four centuries of unbroken practice.",
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
    "lore": "Sages who have studied the Time Pools claim that each pool resonates with a distinct historical tide pattern — that the temporal eddy forming in any given pool is not random but corresponds to a specific significant event in the Crystal Cove's past, meaning that a scholar who learns which pool corresponds to which period can effectively observe historical events by watching the eddy's surface reflections at the right moment. Psychic, Water, Ice, and Fairy-type Pokémon navigate the pools with apparent instinct that human visitors can only approximate: Tentacruel Chrono Jellies expand their bells to stabilise the time shear edges that would otherwise collapse into disorienting vortices, Starmie-Wisemon entities chart the layered current drift trajectories that determine which pools are safe to approach on any given tide cycle, and Remoraid Phase Minnows blink across the slowed eddy boundaries with a casual disregard for the temporal discontinuity that experienced researchers find both impressive and slightly alarming. Clockmon Digimon are the pools' permanent research staff, their time-attribute data making them the only personnel who can work extended shifts without the accelerated fatigue that normal chronological exposure produces. The Chrono Compass access requirement is a practical tool as much as an access credential — the compass's stabilisation function prevents the equipment desynchronisation that renders conventional instruments useless in the pools' temporal field.",
    "history": "The Time Pools were mapped after a synchronised lunar surge exposed the inner eddies that had previously been submerged and inaccessible during normal tidal cycles — an event that the Crystal Cove research community regards as the most significant discovery in the archipelago's scientific history, since the pools' existence had been theorised but not confirmed for over a century of investigation. The first mapping expedition's logs document a careful progression from the outer pools inward, with researchers recording perceived time dilation increasing with each pool tier. The stabilised reef walkway was constructed specifically to allow repeated access without disturbing the tidal conditions that maintain the pool dynamics, and its timing clearance requirement reflects the genuine consequence of approaching at the wrong tidal phase — not bureaucratic caution but documented experience of what happens when the inner eddy boundaries are reached during an unstable surge.",
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
    "lore": "The Time Temple exists outside normal time in a way that is not metaphorical — visitors report that the sequence of events inside the temple does not reliably match the sequence outside, that conversations held here are sometimes answered before they are started, and that the hourglass frescoes on the inner walls pour actual light rather than sand, illuminating different sections depending on which temporal layer the viewer is currently occupying. Psychic, Ghost, Steel, and Dragon-type Pokémon inhabit the temple in configurations that suggest awareness of its temporal complexity: Dialga-class entities serve as the temple's guardians in a capacity that transcends the guardian relationship found in other sacred sites, their innate time-control attribute making them the only beings that can navigate the temple's full temporal range without becoming anchored to a specific layer. Misdreavus-Soulmon Temporal Echoes are not wildlife in the conventional sense but residual impressions of creatures that passed through the temple at other times, occasionally manifesting with enough coherence to interact. Genesect-Kabuterimon Time Beetles exist across multiple timelines simultaneously and treat the temple as a point of convergence. The temple was built by a people long forgotten, and the current inhabitants of the Primordial Jungle worship it without fully understanding why — which the Psychic-type scholars who study the site consider the most honest relationship anyone could have with a structure that predates the concept of understanding.",
    "history": "Built by a people whose name no longer exists in any archive accessible to current scholars — not because the records were lost but because the records themselves appear to be temporally unstable when the Time Temple is near — the temple's construction predates every geological and archaeological reference point that researchers have attempted to use as an anchor for its dating. The Primordial Jungle communities that currently worship the site describe their tradition as inherited rather than founded, tracing back through more generations than their oral records can count to a moment when the temple was simply already there and already sacred. The Chrono Seal access requirement was established after two research expeditions failed to return on schedule — both eventually came back, one three days late and one three days early, with both teams describing the same experience from their own perspective as lasting a single afternoon.",
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
    "lore": "Titania City's crystal spires function as a collective emotional resonance instrument — the city's mood lights are not programmed but responsive, mirroring the aggregate harmony state of the court community in real time, and a visitor who pays attention to the spire colours as they move through the city gains more accurate information about the social atmosphere of each district than any briefing document could provide. Fairy, Grass, and Psychic-type Pokémon are the city's most prominent residents and its emotional infrastructure: Cutiefly Prism Flutters synchronise their wing hues with the garden's emotional pulses as living extension sensors for the spire system, Togekiss Court Envoys carry decree petals between terraces in a communication role that has remained unchanged for centuries, and Sylveon Spire Regents mediate emotional resonance fluctuations that would otherwise amplify into the feedback loops that the city's tips section warns against. Angewomon Digimon serve as the city's most senior diplomatic corps, their celestial-data attributes and innate sensitivity to emotional tone making them ideal representatives for interactions with factions that approach the Seelie Courts with agendas the court's own Fairy-type community would find discordant. The mirrors in Titania City that reflect intentions rather than faces are not a legend — they are a documented property of the Court Rosette crystal matrix, and first-time visitors are advised not to look directly at one until they are certain their intentions are what they think they are.",
    "history": "Titania City expanded to its current scale as emotional resonance mapping techniques improved the city's ability to regulate the feedback dynamics that were its greatest structural vulnerability in its early form — the original settlement was smaller and the spire network less extensive, meaning that significant emotional events could produce resonance cascades that disrupted the entire community. The regulation improvements came through a collaboration between the Sylveon Spire Regent community, whose intuitive emotional sensitivity provided the diagnostic data, and Wisemon-line Digimon analysts, whose pattern-recognition capabilities converted that data into the manageable regulation protocols currently in use. The Royal Court Amphitheater was added in the city's most recent major expansion phase, providing a dedicated venue for the large-scale collective emotional ceremonies that the smaller community spaces could not safely accommodate.",
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
    "lore": "Each solved paradox in the Trickster Lodge is said to lighten latent burdens carried in silence — the philosophy being that unexamined contradictions accumulate as psychological weight, and that the lodge's illusion trials and riddle gauntlets are less about testing intelligence than about creating the conditions in which silent burdens can be safely surfaced and released. Dark, Ghost, and Psychic-type Pokémon are the lodge's primary teachers and challengers: Rookidee Puzzle Corvids arrange trinkets into shifting cipher patterns that are simultaneously the lesson and the test, Sableye Shade Tutors demonstrate controlled silhouette splitting for visitors who need to learn the difference between protective concealment and self-deception, and Honchkrow Raven Aspects embody the teaching avatar of the lodge spirit itself — the senior mentor whose riddles are considered unanswerable by conventional logic and require a different kind of thinking entirely. Ravemon and Phantomon Digimon serve as the lodge's secondary teaching faculty, their shadow-attribute data making them ideal guides through the Illusion Trial Corridors that form the lodge's most demanding practical assessment. The Paradox Feather access item is not a key but a token of willingness — carrying it signals to the lodge's resident teachers that the visitor is prepared to be confused before they are clarified.",
    "history": "The Trickster Lodge was raised when the first raven emissary arrived in the Raven's Shadow region and demonstrated the ability to bind shifting shadows into coherent teaching forms — a capability that the early Dark-type communities of the area had observed as spontaneous and untrained, and which the emissary formalised into the Illusion Trial Corridor system that remains the lodge's primary educational infrastructure. The lodge's reputation for cognitive difficulty has grown over generations; the Paradox Riddle Hearth now holds accumulated riddle-lore contributed by every senior teacher and successful graduate in the lodge's history, making it a resource of considerable depth for those who can navigate its contents without becoming lost in the paradox loops that the less experienced find disorienting.",
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
    "lore": "The Trident Temple houses the most sacred artifact of the sea lord — a weapon whose power is so great that it causes constant tremors in both earth and sea simply by virtue of being present, meaning that the temple's earthquake chambers and conductor channels are not ornamental but structural necessities designed to absorb and redirect the trident's ambient seismic output. Water, Electric, Steel, and Rock-type Pokémon are the temple's resident guardians and clergy: Magnamon-class entities serve as Trident Guardians in a divine protection role that their steel-attribute forms are uniquely suited to, Groudon Earthquake Spirits emerge from the conductor channels during the most intense tremor events to assist with seismic redistribution, and Jellicent Ocean Wraiths — the spirits of those lost at sea who have sworn service to the temple in exchange for continued existence — patrol the outer approaches with a dedication born of genuine gratitude rather than compelled duty. Machinedramon-line Digimon manage the temple's structural integrity monitoring, their mechanical-data attributes allowing them to track micro-fracture propagation in the conductor channels with the precision that the trident's continuous seismic output requires. The Trident Writ requirement exists because the divine trials that test worthiness at the temple's inner sanctum are not symbolic — failure is not merely disappointing but has documented physical consequences.",
    "history": "Built to contain and honour the sea lord's trident after it was temporarily left on earth during an event that the temple's founding records describe with circumspect language as a period when divine attention was elsewhere, the temple has grown from its original containment function into the undisputed centre of all oceanic divine power in the Poseidon's Reach region. The Ocean Wraith community that now serves the temple arrived gradually over centuries as the temple's presence drew spirits of the drowned seeking purpose, and their integration into the temple's clergy structure is considered one of the most significant collaborative arrangements between the living and the departed in the island's spiritual history.",
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
    "lore": "Twilight Town was established to harness the persistent twilight of the Raven's Shadow basin for advanced shadow craft and mnemonic riddling — the town's Temporal Gradient Plaza is not a park but a research installation where the staggered dusk layers are studied as a naturally occurring model of time's relationship with light, and the Riddle Exchange Bazaars are its most visible commercial application, trading riddles as currency in an economy that values cognitive challenge over material exchange. Dark, Ghost, Psychic, and Flying-type Pokémon maintain the town's distinctive character: Murkrow Dusk Flickers skim the temporal shear edges harvesting echo motes that feed into the town's shadow-craft supply chain, Sableye Phase Scribes etch shifting inscriptions into basalt markers at intervals that only make sense when read across multiple dusk layers simultaneously, and Honchkrow Gloam Architects stabilise the multi-layer dusk corridors that would otherwise collapse into the undifferentiated shadow that makes the Shadow Village adjacent, but not identical, to this more commercially minded settlement. BlackGatomon-line Digimon serve as the town's most experienced dusk-corridor navigators, their dark-data attributes allowing them to move between gradient layers with the ease that human visitors can only achieve after months of phase anchor training. The phased causeways aligned to dusk intervals are the town's most unusual infrastructure — they exist in different layers at different times of day, and a visitor who has not studied the schedule will find themselves attempting to use a bridge that is not currently in the same temporal layer they are occupying.",
    "history": "Twilight Town's spatial grid was recalibrated after a series of corridor looping incidents in its early settlement period — events in which the gradient layers had not been sufficiently stabilised, causing residents and visitors to experience the town's dusk-layer sequence as repeating rather than progressing. The recalibration, which required the cooperative effort of every Gloam Architect in residence and took several weeks of continuous adjustment, produced the stable corridor system currently in operation and established the Gloam Calibration Obelisks as permanent monitoring infrastructure. The riddle commerce economy that Twilight Town is now known for developed organically from the cognitive skills that the shadow-craft training requires — practitioners who spent years developing the paradox-tolerant thinking that dusk-layer navigation demands found that they had also developed an appetite for riddle exchange as a social form, and the Bazaars grew from that appetite.",
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
    "lore": "Utgard City is the capital of the Jötun — the frost giants whose relationship to the divine order is one of deliberate opposition, not to cause destruction but to maintain the necessary resistance that prevents any single power from achieving the unchecked dominance that the Jötun consider the most dangerous condition in any world. The city's scale is calibrated to its inhabitants: walls that reach toward the frozen sky are functional architecture for beings whose smallest members stand twelve feet tall, and the visitor who arrives here without the Frost Resistance Cloak will find that the city's ambient temperature is simply the Jötun's comfortable baseline. Ice and Fighting-type Pokémon are the city's primary non-giant population: Regigigas-class entities serve as the Frost Giants' working allies in the most demanding construction and maintenance tasks, IceDevimon Digimon fill roles as court attendants and tactical advisors whose ice-attribute data makes them natural partners for Jötun military planning, and Lycanroc Aurora Wolves patrol the outer perimeter in packs whose howls serve as both security signal and weather forecast. Garurumon-line Digimon are considered honoured guests rather than residents, their warrior culture aligning closely enough with Jötun values that diplomatic relations between the Garurumon lineages and the Jötun councils have remained consistently warmer than those with most outside factions. Diplomatic immunity is genuine protection here — the Jötun honour negotiated agreements with a consistency that surprises visitors who expect chaos, because the chaos they embody is principled rather than arbitrary.",
    "history": "Built in the dawn of the Jötun Tundra's inhabited history by the first frost giant clans who chose the coldest, most exposed location as a deliberate statement about what they were willing to endure, Utgard City has stood as both bastion and symbol for as long as the island chain's mythological record extends. The city has never been conquered, a fact the Jötun councils attribute not to military superiority but to the fundamental incorrectness of the assumption that something the Jötun built can be taken from them by force. The Frost Giant Challenge and Giant Forge Trial encounters that await uninitiated visitors are the city's version of introduction — not hostile screening but an assessment of whether the visitor is worth the Jötun's time, conducted in the most direct manner the Jötun know.",
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
    "lore": "Valor Town celebrates the warrior spirit that faces danger without hesitation, teaching that true courage comes from protecting others rather than seeking personal glory — a distinction the town's academies enforce with a rigour that has caused more than a few promising recruits to reconsider their motivations. Fighting, Steel, and Fire-type Pokémon are Valor Town's most respected residents and combat instructors: Pyroar Brave Lions lead the senior warrior training cohorts in exercises where actual courage is assessed rather than simulated, Lucario Honor Wolves serve as sparring partners whose Aura sensitivity makes them effectively impossible to deceive about a training partner's mental state, and Staraptor Courage Birds serve as aerial battlefield monitors during the Courage Trials, providing the objective perspective that ground-based observers cannot always maintain. Leomon-line Digimon hold formal instructor positions at the town's most prestigious academies, their warrior-data attributes and honour code making them trusted evaluators in a community where standards are enforced by peer expectation as much as institutional authority. The Hero Monuments that line Valor Town's central avenue document not just military achievement but the specific protective acts that each honoured warrior performed, reminding active students that the monuments' subjects are celebrated for what they gave rather than what they took.",
    "history": "Established by veteran warriors who had survived enough campaigns to understand the difference between courage and recklessness, and who wanted to pass down the traditions of heroic combat in a form that would prevent the next generation from repeating the mistakes that experience had taught them, Valor Town was designed from its founding as an educational institution rather than a military base. The Kshatriya Arena region's existing fighting culture provided a ready student population, and the town's academies quickly developed reputations for producing warriors whose discipline distinguished them in any subsequent service. The Valor Writ requirement ensures that those who access the most intensive training programmes have been assessed as capable of benefiting from them — not gatekeeping but a practical determination that certain training methods require a foundation of existing competence to be useful rather than harmful.",
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
    "lore": "Vision Town was founded when wandering seers — practitioners whose raw psychic talent outpaced their analytical structure — required a facility that could provide the disciplined synthesis methods that trance artistry alone could not achieve. Psychic, Fairy, and Electric-type Pokémon are the town's resident research community: Natu Focus Finches perch on calibration rods stabilising the mind fields that would otherwise contaminate adjacent researchers' probability lattice work, Kirlia Lattice Analysts chart divergence thresholds in sand arrays with a precision that the town's human researchers match only after years of practice, and Metang Auric Wardens maintain the shield resonance under storm interference that makes Vision Town's high-ridge location a productive research environment rather than a chaotic one. Wisemon-line Digimon serve as the town's computational core, processing the probability braid data that the Foresight Harmonizer Ring generates at volumes that human analysts cannot directly manage. The Probability Lattice Labs produce research that is shared across Oracle's Sanctum's institutions, making Vision Town not merely an enclave but the analytical backbone of the entire region's predictive infrastructure.",
    "history": "Vision Town expanded to its current research-enclave scale after the town's practitioners coordinated the mitigation of a cascading misread cycle — an event in which multiple seers operating without proper auric shielding had generated interlocking predictions that each reinforced the others' errors, producing a probability feedback loop that affected the Oracle's Sanctum region's psychic environment for three weeks before Vision Town's analysts developed the correction protocol that resolved it. The Auric Research Permit requirement was introduced immediately after this event; the permit process includes an assessment of the applicant's existing auric shielding capability, ensuring that new arrivals at the town's Probability Lattice Labs are not inadvertently contributing to another cascade before they have learned the baseline containment practices the town's safety depends on.",
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
    "lore": "Vulcan City was built around a primordial ember bound by cooperative master smith rites — the Central Eternal Furnace that powers the city's production infrastructure is not a constructed furnace but a contained natural phenomenon, a fragment of the original fire that the founding smith-practitioners captured and negotiated into productive collaboration rather than consuming or extinguishing. Steel, Fire, and Rock-type Pokémon are the city's industrial workforce in the most literal sense: Slugma Slag Skitters absorb residual radiant heat along the molten channels to maintain the temperature gradients that the forge processes require, Magmar Forge Regulators balance crucible pressure gradients with the same intuitive precision that the city's human engineers took decades to approximate analytically, and Heatran Alloy Sentinels patrol for structural stress anomalies in the Flux Stabilizer Towers with a natural Fire/Steel attribute resilience that makes them the only personnel safe to work the tower interiors at full operational temperature. Andromon Digimon serve as the city's industrial automation infrastructure, their mechanical-data attributes making them ideal operators for the Alloy Prototype Labs' most demanding continuous processes. The Divine Alloy Ingots that Vulcan City produces — high-resonance metal with exceptional tensile memory — are exported as one of the Hephaestus Forge region's most valuable trade commodities, sought by craftspeople across the island chain.",
    "history": "Vulcan City underwent a complete duct lattice overhaul after a runaway heat vortex event damaged approximately a third of the original forge infrastructure and demonstrated that the city's early thermal management systems had been designed for steady-state operation without adequate provision for surge conditions. The overhaul took three years to complete and required a temporary reduction in production capacity that caused significant economic disruption in the Hephaestus Forge region; the new duct lattice design that emerged from the overhaul has since operated without a comparable failure, and is considered the definitive model for industrial forge thermal management in any Conoco Island facility working at comparable scale.",
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
    "lore": "Wakinyan City honours the Thunderbird in the most direct way available — not through ceremonial distance but through cohabitation, having built the city in the Thunderbird's nesting territory with the explicit understanding that this is a privilege extended by the great spirit rather than a claim asserted by its residents. Electric, Flying, and Steel-type Pokémon are the city's most prominent non-human population: Zapdos-class Great Thunderbirds nest in the upper spire structures and their presence is the city's most meaningful weather forecast — residents read their posture and flight patterns as accurately as any instrument, and the city's emergency protocols depend on Thunderbird behaviour signals rather than manufactured sensors. Braviary Lightning Eagles serve as the city's aerial patrol, their electric-enhanced flight making them capable of operating safely in conditions that would be fatal to most other flyers. Garurumon and Manectric Storm Wolves maintain the city's outer perimeter in packs that coordinate with the Thunderbird nesting schedule to avoid disrupting the great spirit's rest cycles. Raiju-line Yokai are considered sacred intermediaries between the Thunderbird and the city's human population, and their movements within the city boundaries are respected as messages rather than treated as wildlife behaviour.",
    "history": "Built by communities who received the Thunderbird's blessing to live in its domain — a negotiation whose terms are preserved in the founding oral tradition and which the city's shamanic lineages continue to honour in the Stormwarden Seal access framework — Wakinyan City has stood for centuries in conditions that would have defeated any settlement built on conventional engineering principles alone. The city's architecture was developed through generations of storm-season learning, with each significant damage event producing structural improvements that have made the current buildings genuinely adapted to constant lightning and wind rather than merely protected against it. The Thunderbird's protective presence is credited by the city's residents with preventing the complete destruction events that have historically reduced other high-altitude settlements to foundations during catastrophic storm seasons.",
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
    "lore": "Web Town was established to alleviate congestion in the original Anansi Woods archive canopies when the volume of new story threads being produced by Story Village and the Silk Library's expanded operations exceeded the existing infrastructure's capacity to route them efficiently — a problem of narrative logistics as much as physical storage. Bug, Dark, and Fairy-type Pokémon are the town's operational core: Joltik Strand Runners shuttle charge along data filaments at the speeds that Web Town's high-throughput lattice requires, Ariados Pattern Auditors validate lattice integrity under the sustained load that the town's main Tension Hub Exchanges operate at continuously, and Galvantula Resonance Brokers balance the multi-thread narrative throughput that determines whether the Anansi Woods' story-distribution network runs smoothly or accumulates the backlogs that the town was built to prevent. Tentomon and Waspmon Digimon serve as Web Town's technical support layer, their data-attribute capabilities allowing them to diagnose and resolve lattice problems faster than physical inspection alone could achieve. The Silk Transit Permit requirement ensures that the town's strand bridges are used by traffic that has been routed through the coordination system — unlicensed crossing creates the lattice jams that the town's Pattern Auditors spend their working hours resolving.",
    "history": "Web Town was reinforced after a tri-node oscillation cascade event in which three simultaneous lattice failures at adjacent Tension Hubs created a resonance loop that propagated through approximately forty percent of the town's strand network before the Resonance Brokers identified the oscillation pattern and implemented the emergency damping protocol. The cascade caused no physical injuries but disrupted the Anansi Woods' narrative distribution for eleven days while repairs were completed, and the loss of story throughput during that period is described in the town's records as the most significant single disruption to Anansi Woods cultural life in its recent history. The reinforcement that followed added redundant damping nodes at every Tension Hub junction, making a comparable cascade event impossible under the current design.",
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
    "lore": "The Wind Gardens' practitioners pioneered airflow nutrient cycling as a complete replacement for soil medium dependency — a horticulture philosophy that began as a constraint of altitude and became, over generations of refinement, a deliberate methodology producing plant varieties that cannot be grown any other way. Grass, Flying, and Fairy-type Pokémon are the gardens' resident horticulturists and infrastructure: Hoppip Pollen Wisps drift through the aeroponic tiers distributing micro-spore clusters that provide the biological diversity the gardens require, Skiploom Glide Gardeners manage airflow trimming patterns with the instinctive precision of beings for whom jetstream navigation is simply how they move, and Jumpluff Jetstream Curators optimise vortex nutrient circulation across the multiple tiers with techniques that human gardeners have spent decades learning to approximate. Kazemon-line Digimon serve as the gardens' atmospheric engineering staff, their wind-attribute data making them ideal operators for the Jetstream Pruning Arrays that maintain the laminar flow conditions the aerophyte matrices require. The Sky Nectar produced at the Wind Gardens is one of the Nimbus Capital's most distinctive exports — concentrated airborne floral extract whose production process is impossible to replicate at lower altitudes.",
    "history": "The Wind Gardens expanded to their current scale after successful frost resilience graft trials produced aerophyte varieties capable of maintaining productive growth through the Nimbus Capital's coldest periods, which had previously created seasonal gaps in the gardens' output. The frost resilience work was conducted over several growing cycles in collaboration with the Glide Gardener population, whose wing-membrane sensitivity to temperature change gave them earlier warning of approaching frost conditions than any instrument available at the time. The expansion that followed the successful trials tripled the gardens' aeroponic tier count and introduced the Sky Nectar Suspension Pods that are now the installation's most recognisable structural feature.",
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
    "lore": "Wind Village serves as the primary training ground for those who wish to master air magic — a practice that requires not just technical study but an attitudinal shift, which is why the village's teachers consistently describe the curriculum as teaching respect for the sky before it teaches command of it. Flying, Grass, and Fairy-type Pokémon are Wind Village's foundational community: Cutiefly Wind Sprites dance on air currents in ways that apprentices learn to read as instruction in the shapes available to a skilled wind mage, Gatomon Breeze Cats demonstrate air-walking with a casual confidence that new students find both inspiring and temporarily discouraging, and Butterfree Sky Butterflies serve as living demonstrations of long-range wind-current riding that makes the theoretical curriculum suddenly practical. Fairymon-line Digimon serve as Wind Village's senior instructors in the aerial flight disciplines, their wind-attribute data making them the most technically capable teachers of the advanced courses. Ceremonial kites are not decorative — they are precision instruments for thermal mapping, and apprentices who learn to read them graduate having internalised wind-pattern recognition that no amount of classroom instruction can provide.",
    "history": "Founded by wind mages who had independently discovered and mapped the Quetzal Winds region's optimal air currents for magical training, and who recognised that sharing their individual discoveries would accelerate everyone's progress, Wind Village grew from a loose consortium of isolated practitioners into the region's most respected aerial magic education facility over the course of several generations. The curriculum that the founding mages developed together, incorporating each practitioner's particular expertise, has been refined continuously since then and is now considered the definitive wind magic training programme in the island chain. The Sky Ceremony tradition that marks each year's graduation cohort was introduced by the second generation of village teachers as a practical capstone assessment in which graduates demonstrate their mastery by performing a coordinated atmospheric working under actual sky conditions rather than controlled training environments.",
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
    "lore": "Wisdom Town exists to ensure that the draconic wisdom lineage of the Long Valley remains curated and reproducible — not preserved in the static sense of a museum but maintained as living scholarship, with the Jade Scroll Vaults updated continuously by the Archive Curators who treat each new contribution as an addition to an ongoing conversation rather than a deposit in a closed collection. Dragon, Psychic, and Fairy-type Pokémon are the town's scholarly community: Axew Scroll Whelps warm parchment for preservation with a gentle thermal output that the town's archivists have found superior to any mechanical warming device, Fraxure Archive Curators maintain the jade-scroll catalogue with a methodical attention to detail that their Dragon-type heritage seems to make instinctive, and Haxorus Resonance Elders moderate high-level philosophical harmonics in the Resonant Debate Forum with an authority that comes from accumulated wisdom rather than imposed rank. Wisemon Digimon serve as Wisdom Town's data integration layer, their analytical capabilities allowing them to cross-reference the jade-scroll archive with digital databases maintained by partner institutions across the island chain. The Jade Scroll Writ requirement ensures that those accessing the restricted discourse halls have demonstrated sufficient scholarly background to contribute constructively rather than simply consuming the archive's resources.",
    "history": "Wisdom Town's archive climate system was upgraded after a condensation event caused by an unusual atmospheric confluence damaged approximately eighty jade scroll sections before the humidity monitoring systems detected the moisture levels. The upgrade introduced the Pearl Distillation Gardens as an active climate regulation system — the gardens' moisture management function was a secondary discovery during the development of the distillation process, and has proven more effective than the mechanical dehumidification it replaced. The incident that triggered the upgrade is recorded in the town's annals with characteristic academic thoroughness, including a full catalogue of the damaged sections and the reconstruction work that partially restored their content.",
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
    "lore": "Witchwood City serves as a haven for those who practice the darker aspects of nature magic — not because the practitioners are dangerous by default, but because the magic they work with operates at the intersection of growth, decay, and transformation that most civilised institutions classify as too unpredictable to study safely and too valuable to abandon entirely. Dark, Poison, Grass, and Ghost-type Pokémon are the city's primary residents and magical practitioners: Misdreavus Swamp Witches are the city's most experienced practitioners of marsh magic, their Ghost/Dark combination giving them access to the liminal states between living and dead vegetation that most hedge magic operates through. Murkrow Familiar Ravens serve as the city's intelligence network — not a surveillance system but a genuine network of relationships between practitioners and corvid communities built over generations of mutual benefit. Seviper Bog Serpents patrol the city's outer waterways as a natural deterrent whose presence is maintained not through force but through the habitat management practices that make the marsh genuinely comfortable for them. Witchmon-line Digimon are the city's most formally credentialled practitioners, their witch-attribute data making them ideal instructors for the Hedge Magic Schools that provide the structured curriculum that prevents students from learning the hard consequences of the city's magical traditions without appropriate preparation.",
    "history": "Founded by witches and hedge wizards who were driven from more civilised areas not because their practices were harmful but because they were uncomfortable for communities that preferred predictable magical outcomes, Witchwood City has become a centre for magical knowledge that others fear to study precisely because the study is conducted rigorously rather than recklessly. The Marsh Coven Token access requirement was established by the city's governing coven as a quality-control measure rather than a restriction — the token process assesses applicants' understanding of basic magical safety protocols, ensuring that new arrivals in the city's Alchemical Labs are not inadvertently creating the harmful outcomes that the city's reputation sometimes leads outsiders to expect. The Cursed Artifacts that are the city's most notorious exports are not products of malice but of the experimental tradition that the city maintains: items created at the boundary of magical theory, not all of which produce the effects their creators intended.",
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
    "lore": "The Wyrmclaw Tribe are descendants of humans who made blood pacts with dragons during the Dragon Wars — pacts that were not merely strategic alliances but genuine biological and spiritual mergers that have, over generations, produced a people who are genuinely something between human and dragon. Dragon, Fire, Dark, and Flying-type Pokémon exist alongside the tribe not as companions or wildlife but as kin; Garchomp Wyrmclaw Warriors have bond-relationships with their dragon partners that the Spirit Keeper faction's analysts describe as more complete than any documented trainer-monster relationship, and the Druddigon Bone Drakes that serve the tribe are not controlled creatures but ancient partners whose lineages predate the original pacts. Skullgreymon-line Digimon serve the tribe as ancestral spirit warriors, their undead-dragon attribute making them the closest Digital equivalent to the tribe's own transformed nature. Devimon-line entities serve as Blood Familiar intermediaries in the tribe's most significant ritual contexts. The Wyrmclaw Oathband requirement is the only access path because the tribe does not recognise authority structures that are not founded on demonstrated commitment — the Oathband signals that a visitor has made a binding promise that the tribe considers meaningful, which is the minimum threshold for being worth the tribe's attention rather than its immediate hostility.",
    "history": "The tribe formed during the Dragon Wars when desperate humans at the Draconic Abyss's edge sought power through blood bonds with dragons who were themselves under threat — a convergence of mutual necessity that produced the founding pacts whose terms have been honoured on both sides ever since. Over generations, they have become something between human and dragon, their physical forms gradually incorporating the draconic traits that the pacts awoke in their bloodlines. The Dragon Blood resource that is the tribe's most sacred material is not a commodity to them but a record of lineage — each sample carries the ancestral information of both the human and dragon lines involved in its production, and is treated as irreplaceable heritage rather than trade goods, which is why encounters with outsiders seeking it tend to proceed badly.",
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
    "lore": "Xochitonal Village exists to preserve the daily honouring processes that prevent the fading of local ancestral narratives — its philosophy being that the dead do not disappear when memory of them lapses but rather that the connection between living and dead becomes inaccessible, and that daily altar cycles are maintenance of a relationship rather than performance of a ritual. Ghost, Fairy, Grass, and Water-type Pokémon participate in the village's ceremonies as integral community members: Shuppet Petal Spiritlets float through the Living Marigold Altars distributing memorial pollen that carries trace ancestral energy, Dusclops Altar Guardians stabilise the offering energy signatures that would otherwise dissipate before the ancestors can receive them, and Dhelmise Remembrance Guides lead processions through the Ancestral Petal Canals with the unerring directional sense that navigating between living and dead communication channels requires. Wisemon Digimon serve as the village's memory archivists, their data-attribute capabilities allowing them to preserve ancestral narrative records in formats that complement the living altar-cycle tradition rather than replacing it. The gentle atmosphere of Xochitonal Village conceals a sophisticated ceremonial infrastructure — the phosphor pollen glow and soft echo drizzle are the sensory surface of maintenance work that the entire Mictlan Hollows region depends on for its spiritual stability.",
    "history": "Xochitonal Village expanded after canal restoration work increased the ceremony's capacity to support simultaneous procession routes, resolving the overcrowded procession path problem that had been the village's primary logistical constraint for several generations. The canal restoration was a significant engineering project that required draining sections of the Ancestral Petal Canals while maintaining the ceremony's continuity — a challenge that the village's Ghost-type community resolved by temporarily maintaining the spiritual connections through direct presence while the physical infrastructure was repaired. The restoration also revealed several additional sections of the original canal network that had been sealed rather than damaged, whose reopening expanded the village's ceremony capacity beyond what even the restoration planners had projected.",
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
    "lore": "Yagna Village exists to maintain the sacred fire ceremonies that protect the Agni Peaks region — not through belief alone but through a documented correlation between the continuity of the yagna fires and the stability of the volcanic region's spiritual environment, which the Spirit Keeper faction's researchers have noted as statistically significant even without a confirmed mechanistic explanation. Fire, Fighting, and Fairy-type Pokémon participate in the village's ceremonial life as willing partners rather than recruited wildlife: Chimchar Fire Monkey families tend the sacred fires with a dedication that the village's priests treat as a form of shared vocation, Talonflame Ceremony Birds circle during important rituals in formations that the attending priests read as divine acknowledgement rather than territorial behaviour, and Tauros Sacred Cows move through the village in patterns that the oldest ceremonial records describe as a form of blessing-distribution. Leomon-line Digimon serve as the village's most senior fire-ceremony participants, their warrior-attribute data giving them access to the ritual's most demanding physical endurance components. The Ritual Offering Bundle access item ensures that visitors arrive with the material components that the yagna ceremony requires to maintain its efficacy — attending empty-handed is not disrespectful but practically counterproductive to the ceremony's purpose.",
    "history": "Founded by a group of devoted priests centuries ago to perform the eternal yagna fire sacrifice after a period of volcanic instability in the Agni Peaks that the founding priests attributed to the absence of sustained ceremonial fire offerings, Yagna Village has never let the ceremonial fires die — a continuity that is documented in the village's records as an unbroken chain stretching back to the founding and maintained through several emergencies that required extraordinary measures to preserve. The most significant of these emergencies was a water-event approximately two centuries ago that flooded the primary fire altar chamber; the founding lineage's oral record describes the priests carrying the sacred fire in sealed containers through the flood waters until dry ground could be reached, a detail that has been verified by the charcoal isotope dating of the current fire's ash deposits.",
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
