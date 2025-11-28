// Landmasses data - extracted from LandmassPage.js
export const Landmasses = {
  'conoco-island': {
    id: 'conoco-island',
    name: 'Conoco Island',
    image: '/images/maps/conoco-island-detailed.png',
    description: 'A vast island seemingly disconnected entirely from the rest of the world, where beasts of many kinds roam free.',
    climate: 'Varied (Temperate, Tropical, Desert, Alpine, Coastal, Mystical)',
    dominantTypes: [
      'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
      'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark',
      'Steel','Fairy'
    ],
    lore: 'Legend speaks of eighteen ancient spirits from different realms who found sanctuary on this island, each claiming dominion over a region that reflects their elemental essence. The island serves as a living tapestry of elemental energies, where frost titans dwell alongside fire spirits, and woodland courts neighbor wind guardians.',
    regions: [
      {
        id: 'hearthfall-commons',
        name: 'Hearthfall Commons',
        image: '/images/maps/regions/hearthfall-commons.png',
        description: 'A peaceful region with cozy settlements and the grand Central City, where Normal-type Monsters gather in harmonious communities.',
        coordinates: { x: 30, y: 55, width: 15, height: 12 },
        areas: [ ]
      }
      // ... other regions would be here
    ]
  },

  'conoocoo-archipelago': {
    id: 'conoocoo-archipelago',
    name: 'Conoocoo Archipelago',
    image: '/images/maps/conoocoo-archipelago-detailed.png',
    description: 'A chain of mysterious tropical islands where time seems frozen in the age of giants. The central Primordial Jungle harbors prehistoric Monsters that have survived since ancient times.',
    climate: 'Tropical Prehistoric (Lush, Humid, Volcanic, Coastal)',
    dominantTypes: ['Grass', 'Water', 'Rock', 'Dragon', 'Steel'],
    lore: 'Legend tells of a great cataclysm that separated these islands from the flow of time, preserving creatures from eras long past. The central jungle pulses with primordial energy, where fossil Monsters roam freely and ancient species that predate recorded history still thrive. The local tribes live in harmony with these rare and legendary monsters, and to all they can to keep this secret hidden.',
    regions: [
      {
        id: 'primordial-jungle',
        name: 'Primordial Jungle',
        image: '/images/maps/regions/primordial-jungle.png',
        description: 'The massive central jungle where prehistoric Monsters roam among ancient trees that have stood since the dawn of time.',
        coordinates: { x: 15, y: 40, width: 60, height: 25 },
        areas: []
      }
      // ... other regions would be here
    ]
  },

  'sky-isles': {
    id: 'sky-isles',
    name: 'Sky Isles',
    image: '/images/maps/sky-isles-detailed.png',
    description: 'Mystical floating islands suspended in the clouds, where ancient sky civilizations built cities that touch the stars and commune with celestial Monsters.',
    climate: 'Ethereal Sky (Celestial Winds)',
    dominantTypes: ['Flying', 'Psychic', 'Fairy', 'Dragon', 'Steel'],
    lore: 'These islands defy gravity itself, held aloft by ancient sky magic and celestial energy. The islands rotate slowly through the heavens, following star patterns that only the sky-dwellers understand. Here, Flying-type Monsters have evolved beyond earthbound limitations, and legendary sky serpents patrol the cloud roads between floating cities.',
    regions: [
      {
        id: 'nimbus-capital',
        name: 'Nimbus Capital',
        image: '/images/maps/regions/nimbus-capital.png',
        description: 'The grand floating capital built on storm clouds, where sky kings rule from palaces of crystallized air.',
        coordinates: { x: 40, y: 35, width: 25, height: 20 },
        areas: [
          { id: 'cloud-palace', name: 'Cloud Palace' },
          { id: 'storm-district', name: 'Storm District' },
          { id: 'sky-harbor', name: 'Sky Harbor' },
          { id: 'wind-gardens', name: 'Wind Gardens' }
        ]
      }
      // ... other regions would be here
    ]
  }
};

// Sample regions data
export const Regions = {
  'hearthfall-commons': {
    id: 'hearthfall-commons',
    name: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/hearthfall-commons-detailed.png',
    description: 'A peaceful northern homeland with cozy settlements, where Normal-type Monsters gather in harmonious communities.',
    climate: 'Temperate Continental (Northern climate)',
    elevation: '200 - 800 ft',
    dominantTypes: ['Normal'],
    wildlife: 'Cozy Cabin Monsters, Hearth Spirits, Community Gatherers',
    resources: 'Hearthwood, Comfort Berries, Warm Stones',
    lore: 'Inspired by northern concepts of community and comfort, this region embodies the simple joys of home and hearth. The Normal-type Monsters here are known for their loyalty and protective nature toward their human companions, much like the legendary bond between close-knit families and their guardian spirits.',
    areas: [
      {
        id: 'heimdal-city',
        name: 'Heimdal City',
        image: '/images/maps/areas/heimdal-city.png',
        description: 'The region\'s capital, a bustling city with cozy wooden buildings and central hearths in every home.',
        coordinates: { x: 35, y: 40, width: 25, height: 20 },
        difficulty: 'Easy',
        specialFeatures: ['Regional Capital', 'Monsters Center Network', 'Great Hall', 'Community Festivals']
      }
    ]
  },

  'agni-peaks': {
    id: 'agni-peaks',
    name: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/agni-peaks-detailed.png',
    description: 'Sacred fire mountains where eternal flames burn, home to powerful Fire-type Monsters.',
    climate: 'Volcanic Tropical (Sacred Fire Climate)',
    elevation: '3,000 - 8,500 ft',
    dominantTypes: ['Fire'],
    wildlife: 'Sacred Flame Spirits, Volcanic Salamanders, Fire Temple Guardians',
    resources: 'Sacred Ash, Fire Crystals, Blessed Charcoal',
    lore: 'Named after the ancient spirit of fire, this region\'s eternal flames are said to purify both body and spirit. Fire-type Monsters here perform sacred rituals at dawn and dusk, and the region\'s temples host ceremonies where trainers can strengthen their bonds through trials of courage and purification.',
    areas: [
      {
        id: 'agni-city',
        name: 'Agni City',
        image: '/images/maps/areas/agni-city.png',
        description: 'Mountain city built into volcanic slopes, with sacred fire temples and flowing lava channels.',
        coordinates: { x: 40, y: 35, width: 30, height: 25 },
        difficulty: 'Hard',
        specialFeatures: ['Sacred Fire Temples', 'Lava Channels', 'Purification Ceremonies', 'Fire Trials']
      }
    ]
  }
};

// Sample areas data
export const Areas = {
  'heimdal-city': {
    id: 'heimdal-city',
    name: 'Heimdal City',
    regionId: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/heimdal-city-detailed.png',
    description: 'The region\'s capital, a bustling city with cozy wooden buildings and central hearths in every home, embodying the northern concept of comfort and togetherness.',
    difficulty: 'Easy',
    elevation: '500 ft',
    temperature: '45°F to 65°F',
    weatherPatterns: 'Temperate, occasional light snow',
    accessibility: 'All skill levels welcome',
    recommendedLevel: '10+',
    specialFeatures: [
      'Regional Capital',
      'Monsters Center Network',
      'Great Hall',
      'Community Festivals',
      'Traditional Architecture'
    ],
    wildlife: [
      {
        name: 'Hearth Guardian',
        type: 'Normal/Fire',
        rarity: 'Common',
        description: 'Loyal protectors of homes and families'
      },
      {
        name: 'Comfort Beast',
        type: 'Normal/Fairy',
        rarity: 'Uncommon',
        description: 'Creatures that bring peace and warmth'
      }
    ],
    resources: [
      {
        name: 'Hearthwood',
        rarity: 'Common',
        description: 'Wood that burns longer and warmer than normal'
      },
      {
        name: 'Comfort Berries',
        rarity: 'Common',
        description: 'Berries that provide warmth and satisfaction'
      }
    ],
    lore: 'Heimdal City serves as the heart of Hearthfall Commons, where the northern ideals of community and warmth are embodied in every building and gathering. Named after an ancient guardian spirit who watches over the bridge between realms, the city serves as a gateway between the mortal and spiritual worlds.',
    history: 'Founded centuries ago by northern settlers seeking a new home, the city has grown while maintaining its commitment to community and comfort. The great hall at its center has hosted countless gatherings and celebrations.',
    dangers: [
      'Mild winter weather',
      'Crowded festivals',
      'Tourist confusion',
      'Occasional wild animal visits'
    ],
    tips: [
      'Participate in community events',
      'Visit the Great Hall for stories',
      'Bring warm clothing in winter',
      'Respect local customs',
      'Try the local mead'
    ]
  },

  'agni-city': {
    id: 'agni-city',
    name: 'Agni City',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/agni-city-detailed.png',
    description: 'Mountain city built into volcanic slopes, with sacred fire temples and flowing lava channels that power the entire settlement. The city embodies the purifying power of fire.',
    difficulty: 'Hard',
    elevation: '4000 ft',
    temperature: '90°F to 120°F',
    weatherPatterns: 'Hot, frequent volcanic activity',
    accessibility: 'Heat protection required, spiritual preparation recommended',
    recommendedLevel: '60+',
    specialFeatures: [
      'Sacred Fire Temples',
      'Lava Channels',
      'Purification Ceremonies',
      'Fire Trials',
      'Volcanic Forges'
    ],
    wildlife: [
      {
        name: 'Flame Guardian',
        type: 'Fire/Fighting',
        rarity: 'Rare',
        description: 'Sacred protectors of the fire temples'
      },
      {
        name: 'Lava Salamander',
        type: 'Fire/Ground',
        rarity: 'Uncommon',
        description: 'Creatures that swim through molten rock'
      }
    ],
    resources: [
      {
        name: 'Sacred Ash',
        rarity: 'Rare',
        description: 'Ash from sacred fires with purifying properties'
      },
      {
        name: 'Volcanic Glass',
        rarity: 'Uncommon',
        description: 'Sharp obsidian formed by intense heat'
      }
    ],
    lore: 'Agni City is built around the sacred flames of the ancient fire spirit, representing purification, sacrifice, and the divine spark within all life. The city serves as a center for spiritual purification.',
    history: 'Constructed by fire priests and devotees to honor the fire spirit and maintain the sacred flames. The city has weathered countless volcanic eruptions, each one strengthening the inhabitants\' faith.',
    dangers: [
      'Extreme heat',
      'Lava flows',
      'Volcanic eruptions',
      'Fire trials',
      'Spiritual tests'
    ],
    tips: [
      'Wear fire-resistant protection',
      'Respect sacred ceremonies',
      'Undergo purification rituals',
      'Study fire safety procedures',
      'Bring heat-reducing items'
    ]
  }
};