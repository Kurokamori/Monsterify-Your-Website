const db = require('../config/db');
const MonsterRoller = require('./MonsterRoller');
const { v4: uuidv4 } = require('uuid');

/**
 * EggHatcher class for handling egg hatching with item effects
 */
class EggHatcher {
  constructor(options = {}) {
    this.seed = options.seed || Date.now().toString();
    this.userSettings = options.userSettings || {};
    this.enabledTables = options.enabledTables || ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'];

    // Apply user settings to enabled tables
    this.applyUserSettings();
  }

  /**
   * Apply user settings to enabled tables
   */
  applyUserSettings() {
    // Filter enabled tables based on user settings
    // Convert from user settings format (pokemon: true/false) to table names
    const settingsToTables = {
      pokemon: 'pokemon',
      digimon: 'digimon',
      yokai: 'yokai',
      nexomon: 'nexomon',
      pals: 'pals',
      fakemon: 'fakemon',
      finalfantasy: 'finalfantasy',
      monsterhunter: 'monsterhunter'
    };

    this.enabledTables = this.enabledTables.filter(table => {
      // Check if user has disabled this table type
      const userSetting = this.userSettings[table];
      // If setting is undefined or true, include the table
      // If setting is explicitly false, exclude the table
      return userSetting !== false;
    });

    console.log('EggHatcher enabled tables after applying user settings:', this.enabledTables);
  }

  /**
   * Hatch eggs with item effects
   * @param {Object} params - Hatching parameters
   * @returns {Promise<Array>} Array of hatched monster options
   */
  async hatchEggs(params) {
    const {
      trainerId,
      eggCount,
      useIncubator = false,
      imageUrl = null,
      imageFile = null,
      selectedItems = {},
      speciesInputs = {}
    } = params;

    console.log('Starting egg hatching with params:', params);

    // Process selected items to build roll parameters
    const rollParams = await this.processEggItems(selectedItems, speciesInputs);
    
    // Apply user settings to roll parameters
    rollParams.userSettings = this.userSettings;
    rollParams.enabledTables = this.enabledTables;

    console.log('Final roll parameters:', rollParams);

    const hatchedEggs = [];

    // Hatch each egg
    for (let i = 0; i < eggCount; i++) {
      const eggSeed = `${this.seed}-egg-${i}`;
      const eggResults = await this.hatchSingleEgg(eggSeed, rollParams);
      
      hatchedEggs.push({
        eggId: i + 1,
        monsters: eggResults,
        seed: eggSeed
      });
    }

    return hatchedEggs;
  }

  /**
   * Hatch a single egg to get 10 monster options
   * @param {string} seed - Seed for this egg
   * @param {Object} rollParams - Roll parameters with item effects
   * @returns {Promise<Array>} Array of 10 monsters
   */
  async hatchSingleEgg(seed, rollParams) {
    const monsters = [];
    
    for (let i = 0; i < 10; i++) {
      const monsterSeed = `${seed}-monster-${i}`;
      const roller = new MonsterRoller({
        seed: monsterSeed,
        enabledTables: rollParams.enabledTables,
        userSettings: rollParams.userSettings
      });

      try {
        let monster = await roller.rollMonster(rollParams);
        if (monster) {
          // Apply forced species from control items BEFORE post-roll effects (so preview is correct)
          monster = await this.applyForcedSpecies(monster, rollParams);

          // Update reference images for forced species overrides
          const MonsterRoller = require('./MonsterRoller');
          const rollerForImages = new MonsterRoller({ seed: monsterSeed });
          // Helper to update image for a species slot
          async function updateSpeciesImage(mon, slot) {
            if (mon[slot]) {
              try {
                const speciesMonster = await rollerForImages.getMonsterByName(mon[slot]);
                if (speciesMonster) {
                  mon[`${slot}_image`] = speciesMonster.image_url;
                }
              } catch (error) {
                console.error(`Error getting image for ${slot} (${mon[slot]}):`, error);
              }
            }
          }
          await updateSpeciesImage(monster, 'species1');
          await updateSpeciesImage(monster, 'species2');
          await updateSpeciesImage(monster, 'species3');

          // Apply ice cream type overrides BEFORE post-roll effects
          if (rollParams.guaranteedTypes && Object.keys(rollParams.guaranteedTypes).length > 0) {
            for (const [typeSlot, typeValue] of Object.entries(rollParams.guaranteedTypes)) {
              if (typeValue) {
                monster[typeSlot] = typeValue;
              }
            }
          }

          // Apply post-roll item effects (Nurture Kits, minimum types, etc.)
          monster = await this.applyPostRollEffects(monster, rollParams);

          monsters.push(monster);
        }
      } catch (error) {
        console.error(`Error rolling monster ${i} for egg ${seed}:`, error);
      }
    }

    return monsters;
  }

  /**
   * Process egg items to create roll parameters
   * @param {Object} selectedItems - Selected items and their quantities
   * @param {Object} speciesInputs - User-provided species inputs for control items
   * @returns {Object} Roll parameters
   */
  async processEggItems(selectedItems, speciesInputs = {}) {
    const rollParams = {
      // STRICT egg hatching rules - eggs can ONLY hatch base stage, unevolved monsters
      includeStages: ['Base Stage', 'Doesn\'t Evolve'],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage', 'Evolves', 'First Evolution', 'Second Evolution', 'Final Evolution'],
      
      // Table-specific rank filtering - different systems for different monster types
      tableFilters: {
        pokemon: {
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          legendary: false,
          mythical: false
        },
        digimon: {
          includeRanks: ['Baby I', 'Baby II'],
          excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion']
        },
        yokai: {
          includeRanks: ['E', 'D', 'C'],
          excludeRanks: ['S', 'A', 'B'],
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage']
        },
        nexomon: {
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          legendary: false
        },
        pals: {
          // Pals don't have evolution stages or ranks, no restrictions needed
        },
        fakemon: {
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          legendary: false,
          mythical: false
        }
      },
      
      legendary: false,  // NEVER allow legendary monsters from eggs
      mythical: false,   // NEVER allow mythical monsters from eggs
      
      // Item effects will modify these but CANNOT override the stage/evolution restrictions
      includeTypes: [],
      excludeTypes: [],
      includeSpecies: [],
      excludeSpecies: [],
      includeAttributes: [],
      excludeAttributes: [],
      
      // Type guarantees and modifications
      typeGuarantees: [],
      attributeOverride: null,
      fusionRequired: false,
      minTypes: 1,
      maxTypes: 3,
      
      // Ice cream type slots
      guaranteedTypes: {},
      
      // Species controls
      speciesControls: {},
      
      // User-provided species inputs
      userSpeciesInputs: speciesInputs,

      // Monster settings
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    };

    // Process each selected item
    for (const [itemName, quantity] of Object.entries(selectedItems)) {
      if (quantity > 0) {
        await this.applyItemEffect(itemName, quantity, rollParams);
      }
    }

    // FINAL SAFETY CHECK: Ensure no item has overridden the evolution restrictions
    // Eggs can NEVER hatch evolved, legendary, or mythical monsters
    rollParams.legendary = false;
    rollParams.mythical = false;

    // Enforce table-specific restrictions - override any item effects
    rollParams.tableFilters = {
      pokemon: {
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
        legendary: false,
        mythical: false
      },
      digimon: {
        includeRanks: ['Baby I', 'Baby II'],
        excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion']
      },
      yokai: {
        includeRanks: ['E', 'D', 'C'],
        excludeRanks: ['S', 'A', 'B'],
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage']
      },
      nexomon: {
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
        legendary: false
      },
      pals: {
        // Pals don't have evolution stages or ranks, no restrictions needed
      },
      fakemon: {
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
        legendary: false,
        mythical: false
      }
    };

    return rollParams;
  }

  /**
   * Apply individual item effect to roll parameters
   * @param {string} itemName - Name of the item
   * @param {number} quantity - Quantity of the item
   * @param {Object} rollParams - Roll parameters to modify
   */
  async applyItemEffect(itemName, quantity, rollParams) {
    console.log(`Applying effect for ${quantity}x ${itemName}`);

    // Pool filtering items - CANNOT override evolution restrictions
    if (itemName.includes('Rank Incense')) {
      const rank = itemName.split(' ')[0]; // Extract rank (S, A, B, etc.)
      
      // Even with rank incense, eggs can ONLY hatch base/baby forms
      // Rank incense only affects the pool within those restrictions
      if (['Baby I', 'Baby II', 'E', 'D', 'C'].includes(rank)) {
        // Only allow the lowest ranks if specified
        // Baby I/II for Digimon, E/D/C for Yokai
        rollParams.includeRanks = [rank];
      }
      // Higher ranks (S, A, B for Yokai, higher Digimon ranks) are ignored for egg hatching
      // because eggs cannot hatch evolved monsters regardless of items
    }
    
    if (itemName.includes('Color Incense')) {
      const attribute = itemName.replace(' Color Incense', '');
      if (!rollParams.includeAttributes) rollParams.includeAttributes = [];
      rollParams.includeAttributes.push(attribute);
    }
    
    if (itemName.includes('Poffin')) {
      const type = itemName.replace(' Poffin', '');
      if (!rollParams.includeTypes) rollParams.includeTypes = [];
      rollParams.includeTypes.push(type);
    }

    // Exclusion items
    if (itemName === 'Spell Tag') {
      if (!rollParams.excludeTypes) rollParams.excludeTypes = [];
      rollParams.excludeTypes.push('yokai');
    }
    
    if (itemName === 'DigiTofu') {
      if (!rollParams.excludeTypes) rollParams.excludeTypes = [];
      rollParams.excludeTypes.push('digimon');
    }
    
    if (itemName === 'Broken Bell') {
      if (!rollParams.excludeTypes) rollParams.excludeTypes = [];
      rollParams.excludeTypes.push('pokemon');
    }
    
    if (itemName === 'Shattered Core') {
      if (!rollParams.excludeTypes) rollParams.excludeTypes = [];
      rollParams.excludeTypes.push('nexomon');
    }
    
    if (itemName === 'Workers Strike Notice') {
      if (!rollParams.excludeTypes) rollParams.excludeTypes = [];
      rollParams.excludeTypes.push('pals');
    }

    // Inclusion items
    if (itemName === 'DigiMeat') {
      // DigiMeat affects Digimon pool but CANNOT override evolution restrictions
      // Eggs can only hatch Baby I and Baby II regardless of DigiMeat
      // DigiMeat has no effect on egg hatching evolution stages
    }
    
    if (itemName === 'Complex Core') {
      if (!rollParams.includeTypes) rollParams.includeTypes = [];
      rollParams.includeTypes.push('nexomon');
    }
    
    if (itemName === 'Worker\'s Permit') {
      if (!rollParams.includeTypes) rollParams.includeTypes = [];
      rollParams.includeTypes.push('pals');
    }

    // Outcome modification items
    if (itemName === 'Corruption Code') {
      rollParams.attributeOverride = 'Virus';
    }
    
    if (itemName === 'Repair Code') {
      rollParams.attributeOverride = 'Vaccine';
    }
    
    if (itemName === 'Shiny New Code') {
      rollParams.attributeOverride = 'Data';
    }
    
    if (itemName === 'Hot Chocolate') {
      rollParams.fusionRequired = true;
      rollParams.species_min = 2;
    }

    // Type guarantee items
    if (itemName.includes('Nurture Kit')) {
      const type = itemName.replace(' Nurture Kit', '');
      if (!rollParams.typeGuarantees) rollParams.typeGuarantees = [];
      rollParams.typeGuarantees.push(type);
    }

    // Milk items for type counts
    if (itemName === 'Vanilla Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes, 2);
    }
    if (itemName === 'Chocolate Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes, 3);
    }
    if (itemName === 'Strawberry Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes, 4);
    }
    if (itemName === 'MooMoo Milk') {
      rollParams.minTypes = Math.max(rollParams.minTypes, 5);
      rollParams.maxTypes = 5;
    }

    // Ice cream items: set guaranteed type slots from user input
    const iceCreamMap = {
      'Vanilla Ice Cream': 'type1',
      'Strawberry Ice Cream': 'type2',
      'Chocolate Ice Cream': 'type3',
      'Mint Ice Cream': 'type4',
      'Pecan Ice Cream': 'type5'
    };
    if (iceCreamMap[itemName]) {
      rollParams.hasIceCreams = true;
      const typeKey = iceCreamMap[itemName];
      if (!rollParams.guaranteedTypes) rollParams.guaranteedTypes = {};
      // Use user input for the type slot
      if (rollParams.userSpeciesInputs[typeKey]) {
        rollParams.guaranteedTypes[typeKey] = rollParams.userSpeciesInputs[typeKey];
      }
    }

    // Species control items - apply user inputs to force specific species
    if (itemName === 'Input Field' && rollParams.userSpeciesInputs.species1) {
      rollParams.speciesControls.species1 = 'input';
      rollParams.forceSpecies1 = rollParams.userSpeciesInputs.species1;
    }
    if (itemName === 'Drop Down' && rollParams.userSpeciesInputs.species1 && rollParams.userSpeciesInputs.species2) {
      rollParams.speciesControls.species1and2 = 'dropdown';
      rollParams.forceSpecies1 = rollParams.userSpeciesInputs.species1;
      rollParams.forceSpecies2 = rollParams.userSpeciesInputs.species2;
      rollParams.species_min = 2; // Ensure at least 2 species
    }
    if (itemName === 'Radio Buttons' && rollParams.userSpeciesInputs.species1 && rollParams.userSpeciesInputs.species2 && rollParams.userSpeciesInputs.species3) {
      rollParams.speciesControls.species1to3 = 'radio';
      rollParams.forceSpecies1 = rollParams.userSpeciesInputs.species1;
      rollParams.forceSpecies2 = rollParams.userSpeciesInputs.species2;
      rollParams.forceSpecies3 = rollParams.userSpeciesInputs.species3;
      rollParams.species_min = 3; // Ensure at least 3 species
    }
  }

  /**
   * Apply post-roll effects to a monster
   * @param {Object} monster - The rolled monster
   * @param {Object} rollParams - Roll parameters with item effects
   * @returns {Object} Modified monster
   */
  async applyPostRollEffects(monster, rollParams) {
    const modifiedMonster = { ...monster };

    // Apply attribute override
    if (rollParams.attributeOverride) {
      modifiedMonster.attribute = rollParams.attributeOverride;
    }

    // Apply type guarantees (Nurture Kits)
    if (rollParams.typeGuarantees && rollParams.typeGuarantees.length > 0) {
      const guaranteedType = rollParams.typeGuarantees[Math.floor(Math.random() * rollParams.typeGuarantees.length)];
      
      // Ensure at least one type matches the guarantee
      const hasGuaranteedType = [
        modifiedMonster.type1,
        modifiedMonster.type2,
        modifiedMonster.type3,
        modifiedMonster.type4,
        modifiedMonster.type5
      ].includes(guaranteedType);

      if (!hasGuaranteedType && modifiedMonster.type1) {
        modifiedMonster.type1 = guaranteedType;
      }
    }

    // Apply minimum type requirements
    if (rollParams.minTypes > 1) {
      const pokemonTypes = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
        'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
        'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
      ];

      const currentTypes = [
        modifiedMonster.type1,
        modifiedMonster.type2,
        modifiedMonster.type3,
        modifiedMonster.type4,
        modifiedMonster.type5
      ].filter(Boolean);

      while (currentTypes.length < rollParams.minTypes) {
        const availableTypes = pokemonTypes.filter(t => !currentTypes.includes(t));
        if (availableTypes.length > 0) {
          const newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          const typeSlot = `type${currentTypes.length + 1}`;
          modifiedMonster[typeSlot] = newType;
          currentTypes.push(newType);
        } else {
          break;
        }
      }
    }

    return modifiedMonster;
  }

  /**
   * Apply forced species from control items (Input Field, Drop Down, Radio Buttons)
   * @param {Object} monster - The rolled monster
   * @param {Object} rollParams - Roll parameters with forced species
   * @returns {Object} Modified monster with forced species
   */
  async applyForcedSpecies(monster, rollParams) {
    const modifiedMonster = { ...monster };

    // Apply forced species from Input Field item
    if (rollParams.forceSpecies1) {
      modifiedMonster.species1 = rollParams.forceSpecies1;
      console.log(`Forced species1 to: ${rollParams.forceSpecies1}`);
    }

    // Apply forced species from Drop Down item
    if (rollParams.forceSpecies2) {
      modifiedMonster.species2 = rollParams.forceSpecies2;
      console.log(`Forced species2 to: ${rollParams.forceSpecies2}`);
    }

    // Apply forced species from Radio Buttons item
    if (rollParams.forceSpecies3) {
      modifiedMonster.species3 = rollParams.forceSpecies3;
      console.log(`Forced species3 to: ${rollParams.forceSpecies3}`);
    }

    return modifiedMonster;
  }
}

module.exports = EggHatcher;
