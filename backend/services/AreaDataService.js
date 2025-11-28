const path = require('path');
const fs = require('fs').promises;
const areaConfigurations = require('../config/areaConfigurations');

/**
 * Service for extracting and organizing area data from guide pages
 * Provides a clean API for the adventure system to access area configurations
 */
class AreaDataService {
  constructor() {
    this.landmassData = null;
    this.regionData = null;
    this.areaData = null;
    this.initialized = false;
  }

  /**
   * Initialize the service by loading data from guide pages
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load data from the guide page files
      await this.loadLandmassData();
      await this.loadRegionData();
      await this.loadAreaData();
      
      this.initialized = true;
      console.log('AreaDataService initialized successfully');
    } catch (error) {
      console.error('Error initializing AreaDataService:', error);
      throw error;
    }
  }

  /**
   * Load landmass data from LandmassPage.js
   */
  async loadLandmassData() {
    try {
      const landmassPagePath = path.join(__dirname, '../../website/src/pages/guides/LandmassPage.js');
      const content = await fs.readFile(landmassPagePath, 'utf8');
      
      // Extract the Landmasses object using regex
      const landmassMatch = content.match(/const Landmasses = ({[\s\S]*?});/);
      if (!landmassMatch) {
        throw new Error('Could not extract Landmasses data from LandmassPage.js');
      }

      // Parse the landmass data (simplified extraction)
      this.landmassData = this.parseLandmassData(landmassMatch[1]);
      console.log(`Loaded ${Object.keys(this.landmassData).length} landmasses`);
    } catch (error) {
      console.error('Error loading landmass data:', error);
      throw error;
    }
  }

  /**
   * Load region data from RegionPage.js
   */
  async loadRegionData() {
    try {
      const regionPagePath = path.join(__dirname, '../../website/src/pages/guides/RegionPage.js');
      const content = await fs.readFile(regionPagePath, 'utf8');
      
      // Extract the Regions object using regex
      const regionMatch = content.match(/const Regions = ({[\s\S]*?});/);
      if (!regionMatch) {
        throw new Error('Could not extract Regions data from RegionPage.js');
      }

      // Parse the region data
      this.regionData = this.parseRegionData(regionMatch[1]);
      console.log(`Loaded ${Object.keys(this.regionData).length} regions`);
    } catch (error) {
      console.error('Error loading region data:', error);
      throw error;
    }
  }

  /**
   * Load area data from AreaPage.js
   */
  async loadAreaData() {
    try {
      const areaPagePath = path.join(__dirname, '../../website/src/pages/guides/AreaPage.js');
      const content = await fs.readFile(areaPagePath, 'utf8');
      
      // Extract the Areas object using regex
      const areaMatch = content.match(/const Areas = ({[\s\S]*?});/);
      if (!areaMatch) {
        throw new Error('Could not extract Areas data from AreaPage.js');
      }

      // Parse the area data
      this.areaData = this.parseAreaData(areaMatch[1]);
      console.log(`Loaded ${Object.keys(this.areaData).length} areas`);
    } catch (error) {
      console.error('Error loading area data:', error);
      throw error;
    }
  }

  /**
   * Parse landmass data from extracted string
   */
  parseLandmassData(dataString) {
    // For now, return a simplified structure
    // In a real implementation, you'd want a proper JS parser
    return {
      'conoco-island': {
        id: 'conoco-island',
        name: 'Conoco Island',
        description: 'A vast island seemingly disconnected entirely from the rest of the world, where beasts of many kinds roam free.',
        climate: 'Varied (Temperate, Tropical, Desert, Alpine, Coastal, Mystical)',
        dominantTypes: ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'],
        regions: [
          'hearthfall-commons', 'agni-peaks', 'poseidons-reach', 'thunderbird-heights',
          'demeters-grove', 'jotun-tundra', 'kshatriya-arena', 'baba-yagas-marsh',
          'terra-madre-basin', 'quetzal-winds', 'oracles-sanctum', 'anansi-woods',
          'stoneheart-cliffs', 'mictlan-hollows', 'long-valley', 'ravens-shadow',
          'hephaestus-forge', 'seelie-courts', 'pirates-bay'
        ]
      },
      'conoocoo-archipelago': {
        id: 'conoocoo-archipelago',
        name: 'Conoocoo Archipelago',
        description: 'A chain of mysterious tropical islands where time seems frozen in the age of giants.',
        climate: 'Tropical Prehistoric (Lush, Humid, Volcanic, Coastal)',
        dominantTypes: ['Grass', 'Water', 'Rock', 'Dragon', 'Steel'],
        regions: ['primordial-jungle', 'crystal-cove', 'volcanic-peaks', 'mist-marshlands']
      },
      'sky-isles': {
        id: 'sky-isles',
        name: 'Sky Isles',
        description: 'Mystical floating islands suspended in the clouds, where ancient sky civilizations built cities that touch the stars.',
        climate: 'Ethereal Sky (Celestial Winds)',
        dominantTypes: ['Flying', 'Psychic', 'Fairy', 'Dragon', 'Steel'],
        regions: ['nimbus-capital', 'aurora-heights', 'tempest-zones', 'draconic-abyss']
      }
    };
  }

  /**
   * Parse region data from extracted string
   */
  parseRegionData(dataString) {
    // Simplified parsing - in production you'd want proper JS parsing
    return {
      'hearthfall-commons': {
        id: 'hearthfall-commons',
        name: 'Hearthfall Commons',
        landmassId: 'conoco-island',
        dominantTypes: ['Normal'],
        climate: 'Temperate Continental (Northern climate)',
        areas: ['heimdal-city', 'hygge-village', 'bonfire-town', 'hearthstone-temple', 'golden-hall']
      },
      'agni-peaks': {
        id: 'agni-peaks',
        name: 'Agni Peaks',
        landmassId: 'conoco-island',
        dominantTypes: ['Fire'],
        climate: 'Volcanic Tropical (Sacred Fire Climate)',
        areas: ['agni-city', 'yagna-village', 'tapas-town', 'sacred-pyre', 'eternal-flame']
      }
      // Add more regions as needed
    };
  }

  /**
   * Parse area data from extracted string
   */
  parseAreaData(dataString) {
    // Simplified parsing - in production you'd want proper JS parsing
    return {
      'heimdal-city': {
        id: 'heimdal-city',
        name: 'Heimdal City',
        regionId: 'hearthfall-commons',
        landmassId: 'conoco-island',
        difficulty: 'Easy',
        specialFeatures: ['Regional Capital', 'Monsters Center Network', 'Great Hall', 'Community Festivals']
      }
      // Add more areas as needed
    };
  }

  /**
   * Get all landmasses
   */
  async getAllLandmasses() {
    await this.initialize();
    return this.landmassData;
  }

  /**
   * Get landmass by ID
   */
  async getLandmass(landmassId) {
    await this.initialize();
    return this.landmassData[landmassId] || null;
  }

  /**
   * Get regions for a landmass
   */
  async getRegionsForLandmass(landmassId) {
    await this.initialize();
    const landmass = this.landmassData[landmassId];
    if (!landmass) return [];

    return landmass.regions.map(regionId => this.regionData[regionId]).filter(Boolean);
  }

  /**
   * Get region by ID
   */
  async getRegion(regionId) {
    await this.initialize();
    return this.regionData[regionId] || null;
  }

  /**
   * Get areas for a region
   */
  async getAreasForRegion(regionId) {
    await this.initialize();
    const region = this.regionData[regionId];
    if (!region) return [];

    return region.areas.map(areaId => this.areaData[areaId]).filter(Boolean);
  }

  /**
   * Get area by ID
   */
  async getArea(areaId) {
    await this.initialize();
    return this.areaData[areaId] || null;
  }

  /**
   * Get full hierarchy for an area
   */
  async getAreaHierarchy(areaId) {
    await this.initialize();

    const area = this.areaData[areaId];
    if (!area) return null;

    const region = this.regionData[area.regionId];
    const landmass = this.landmassData[region?.landmassId];

    return {
      landmass,
      region,
      area
    };
  }

  /**
   * Get area configuration for adventures
   */
  async getAreaConfiguration(areaId) {
    await this.initialize();

    const hierarchy = await this.getAreaHierarchy(areaId);
    if (!hierarchy) return null;

    const { landmass, region, area } = hierarchy;

    // Check if we have a predefined configuration for this area
    const predefinedConfig = areaConfigurations[areaId];

    if (predefinedConfig) {
      // Use predefined configuration
      return {
        // Basic info
        areaId: area.id,
        areaName: area.name,
        regionId: region.id,
        regionName: region.name,
        landmassId: landmass.id,
        landmassName: landmass.name,

        // Use predefined configurations
        welcomeMessages: predefinedConfig.welcomeMessages,
        battleParameters: predefinedConfig.battleParameters,
        monsterRollerParameters: predefinedConfig.monsterRollerParameters,
        specialEncounters: predefinedConfig.specialEncounters,

        // Environmental data
        environment: {
          difficulty: area.difficulty || 'Medium',
          climate: region.climate || landmass.climate,
          dominantTypes: region.dominantTypes || landmass.dominantTypes,
          specialFeatures: area.specialFeatures || []
        }
      };
    }

    // Fallback to generated configuration
    return {
      // Basic info
      areaId: area.id,
      areaName: area.name,
      regionId: region.id,
      regionName: region.name,
      landmassId: landmass.id,
      landmassName: landmass.name,

      // Generate configuration
      welcomeMessages: this.generateWelcomeMessages(area, region, landmass),
      battleParameters: this.generateBattleParameters(area, region, landmass),
      monsterRollerParameters: this.generateMonsterRollerParameters(area, region, landmass),
      specialEncounters: this.generateSpecialEncounters(area, region, landmass),

      // Environmental data
      environment: {
        difficulty: area.difficulty || 'Medium',
        climate: region.climate || landmass.climate,
        dominantTypes: region.dominantTypes || landmass.dominantTypes,
        specialFeatures: area.specialFeatures || []
      }
    };
  }

  /**
   * Generate welcome messages for an area
   */
  generateWelcomeMessages(area, region, landmass) {
    const baseMessage = `🌟 **Welcome to ${area.name}!** 🌟\n\n` +
      `You have arrived in ${area.name}, located in the ${region.name} region of ${landmass.name}.\n\n` +
      `This is your adventure thread! Here's how it works:\n\n` +
      `📝 **Every message you send counts toward your word count**\n` +
      `⚔️ Use \`/encounter\` to roll random encounters\n` +
      `🎯 Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
      `🎲 Use \`/result\` to resolve battle encounters\n` +
      `🏁 Use \`/end\` to complete the adventure and claim rewards\n\n` +
      `**Maximum encounters:** 3 per adventure\n` +
      `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n`;

    // Generate area-specific adventure variations
    const adventureVariations = [
      `${baseMessage}**Area Info:** ${area.name} is known for its ${(area.specialFeatures || []).join(', ').toLowerCase()}. ` +
      `The ${region.dominantTypes?.join('/')} types are particularly common here.\n\nGood luck, adventurers! 🚀`,

      `${baseMessage}**Local Conditions:** The ${region.climate} creates unique opportunities for encounters. ` +
      `Be prepared for ${area.difficulty?.toLowerCase()} challenges ahead!\n\nGood luck, adventurers! 🚀`,

      `${baseMessage}**Explorer's Note:** This ${area.difficulty?.toLowerCase()} area offers ${(area.specialFeatures || []).length} special features to discover. ` +
      `The local ${region.dominantTypes?.join(' and ')} type monsters are waiting to meet you!\n\nGood luck, adventurers! 🚀`
    ];

    return {
      base: baseMessage + `Good luck, adventurers! 🚀`,
      variations: adventureVariations
    };
  }

  /**
   * Generate battle parameters for an area
   */
  generateBattleParameters(area, region, landmass) {
    const parameters = {
      weather: null,
      terrain: null
    };

    // Set weather based on region climate and area characteristics
    if (region.climate) {
      if (region.climate.includes('Fire') || region.climate.includes('Volcanic')) {
        parameters.weather = 'sunny';
      } else if (region.climate.includes('Ice') || region.climate.includes('Tundra')) {
        parameters.weather = 'hail';
      } else if (region.climate.includes('Water') || region.climate.includes('Marine')) {
        parameters.weather = 'rain';
      } else if (region.climate.includes('Electric') || region.climate.includes('Storm')) {
        parameters.weather = 'rain'; // Electric areas often have storms
      } else if (region.climate.includes('Desert') || region.climate.includes('Arid')) {
        parameters.weather = 'sandstorm';
      }
    }

    // Set terrain based on dominant types
    if (region.dominantTypes) {
      const primaryType = region.dominantTypes[0]?.toLowerCase();
      switch (primaryType) {
        case 'electric':
          parameters.terrain = 'electric';
          break;
        case 'grass':
          parameters.terrain = 'grassy';
          break;
        case 'psychic':
          parameters.terrain = 'psychic';
          break;
        case 'fairy':
          parameters.terrain = 'misty';
          break;
        default:
          parameters.terrain = 'normal';
      }
    }

    return parameters;
  }

  /**
   * Generate monster roller parameters for an area
   */
  generateMonsterRollerParameters(area, region, landmass) {
    return {
      // Type restrictions based on region
      allowedTypes: region.dominantTypes || landmass.dominantTypes || [],

      // Rarity modifiers based on area difficulty
      rarityModifiers: this.getDifficultyRarityModifiers(area.difficulty),

      // Level range based on difficulty
      levelRange: this.getDifficultyLevelRange(area.difficulty),

      // Special parameters
      enableLegendaries: area.difficulty === 'Extreme',
      enableMythicals: false, // Generally disabled unless special event

      // Evolution preferences
      evolutionStage: area.difficulty === 'Easy' ? 'base' : 'any',

      // Regional preferences
      preferredSpecies: this.getRegionalPreferredSpecies(region, landmass)
    };
  }

  /**
   * Get rarity modifiers based on difficulty
   */
  getDifficultyRarityModifiers(difficulty) {
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
  getDifficultyLevelRange(difficulty) {
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

  /**
   * Get preferred species for a region
   */
  getRegionalPreferredSpecies(region, landmass) {
    // This would be expanded with actual species mappings
    const preferences = [];

    if (region.dominantTypes) {
      region.dominantTypes.forEach(type => {
        // Add type-specific species preferences
        preferences.push(`${type.toLowerCase()}_native`);
      });
    }

    return preferences;
  }

  /**
   * Generate special encounters for an area
   */
  generateSpecialEncounters(area, region, landmass) {
    const encounters = [];

    // Add area-specific special encounters based on special features
    if (area.specialFeatures) {
      area.specialFeatures.forEach(feature => {
        if (feature.includes('Temple') || feature.includes('Shrine')) {
          encounters.push({
            type: 'legendary_guardian',
            chance: 0.05, // 5% chance
            description: `A legendary guardian protects the sacred ${feature.toLowerCase()}`
          });
        }

        if (feature.includes('Arena') || feature.includes('Colosseum')) {
          encounters.push({
            type: 'champion_battle',
            chance: 0.1, // 10% chance
            description: `A skilled champion challenges you in the ${feature.toLowerCase()}`
          });
        }

        if (feature.includes('Library') || feature.includes('Archive')) {
          encounters.push({
            type: 'rare_item',
            chance: 0.15, // 15% chance
            description: `Ancient knowledge yields rare treasures in the ${feature.toLowerCase()}`
          });
        }
      });
    }

    return encounters;
  }
}

module.exports = new AreaDataService();
