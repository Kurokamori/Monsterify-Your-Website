const MonsterRoller = require('./MonsterRoller');
const Trainer = require('../models/Trainer');

class AntiqueAppraisalService {
  // Antique definitions with their effects
  static ANTIQUES = [
    {
      "name": "Resolution Rocket",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "force fusion": true,
        "attribute": ["Future Paradox", "Past Paradox"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Love Velvet Cake",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species": [
          "Cupistol", "Dandoodle", "Ray O'Light", "Auntie Heart", "Love-tune", "Peppillon", "Lillymon", "Rosemon", "Curemon", "Lopmon (Cherubimon Virtue form)", "Pucchiemon", "CresGarurumon",
          "Luvdisc", "Alomomola", "Smoochum", "Jynx", "Togekiss", "Togetic", "Fidough", "Dachsbun", "Milcery",
          "Alcremie", "Spritzee", "Aromatisse", "Sylveon", "Chansey", "Blissey", "Lopunny", "Tandemaus", "Maushold"
        ],
        "type1": ["Fairy", "Psychic", "Normal", "Flying"],
        "type2": ["Fairy", "Psychic", "Normal", "Flying"],
        "type3": ["Fairy", "Psychic", "Normal", "Flying"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Lucky Leprechaun's Loot",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Grass"],
        "attribute": ["Lucky"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Can't Believe It's Not Butter",
      "roll_count": 1,
      "force_fusion": false,
      "override_parameters": {
        "attribute": ["Trash", "Raccoon", "Snake", "Shoe", "Artist", "Silly", "Mongoose", "Architecture", "Water Bottle", "Oppression", "Vile", "Cute", "Prank", "Organic", "Geometric", "Illegal"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Bunny's Basket Bonanza",
      "roll_count": 1,
      "override_parameters": {
        "species": [
          "Robonyan", "Usapyon", "Blizzaria", "Frostail", "Shmoopie", "Happierre", "Peppillon",
          "Antylamon", "Cutemon", "Lopmon", "Terriermon", "Gazimon", "Falcomon", "Harpymon", "Hououmon",
          "Reppamon", "Deeromon", "Valkyrimon",
          "Bunnelby", "Diggersby", "Scorbunny", "Buneary", "Lopunny", "Azumarill", "Pidgey", "Pidgeot",
          "Noctowl", "Rowlet", "Decidueye", "Hoothoot", "Oricorio", "Sawsbuck", "Stantler", "Xerneas",
          "Shaymin (Sky Form)", "Swanna"
        ]
      },
      "category": "American Holidays"
    },
    {
      "name": "Star-Spangled Sparkler",
      "roll_count": 1,
      "force_no_fusion": true,
      "override_parameters": {},
      "category": "American Holidays"
    },
    {
      "name": "Fright Night Fudge",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": ["Pumpkinmon", "Gotsumon", "Wizardmon"],
        "attribute": ["Spooky"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Turkey Trot Tonic",
      "roll_count": 1,
      "override_parameters": {
        "species1": [
          "Jibanyan", "Komasan", "Usapyon",
          "Agumon", "Gabumon", "Terriermon", "Renamon", "Lopmon", "Dorumon",
          "Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic",
          "Mudkip", "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin",
          "Froakie", "Rowlet", "Litten", "Popplio", "Grookey", "Scorbunny", "Sobble", "Sprigatito", "Fuecoco", "Quaxly"
        ],
        "attribute": ["Thankful"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Jolly Holly Jamboree",
      "roll_count": 1,
      "override_parameters": {
        "species": [
          "Illuminoct", "Blizzaria", "Frostail", "Dracunyan",
          "SantaAgumon", "IceDevimon", "Frigimon", "Penguinmon", "Mojyamon",
          "Delibird", "Snover", "Abomasnow", "Stantler", "Darmanitan (Galarian form)", "Eiscue",
          "Alolan Vulpix", "Alolan Ninetales", "Froslass", "Chingling"
        ],
        "attribute": ["Vaccine"],
        "type": ["Ice", "Fire", "Grass"]
      },
      "category": "American Holidays"
    },
    {
      "name": "Sweet Shofar Surprise",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species_all": ["Applin", "Sigh-Durr", "Appak"]
      },
      "category": "Jewish Holidays"
    },
    {
      "name": "Day of Atonement Amulet",
      "roll_count": 1,
      "allow_fusion": false,
      "override_parameters": {
        "type1": ["Normal"],
        "max_types": 1
      },
      "category": "Jewish Holidays"
    },
    {
      "name": "Harvest Haven Hummus",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Ground", "Rock"]
      },
      "category": "Jewish Holidays"
    },
    {
      "name": "Latke Lightning in a Jar",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Electric"]
      },
      "category": "Jewish Holidays"
    },
    {
      "name": "Sectored Cookie",
      "roll_count": 1,
      "force_fusion": true,
      "force_min_types": 3,
      "override_parameters": {},
      "category": "Jewish Holidays"
    },
    {
      "name": "Matzah Marvel",
      "roll_count": 1,
      "force_no_fusion": false,
      "override_parameters": {
        "type1": ["Fire"]
      },
      "category": "Jewish Holidays"
    },
    {
      "name": "Frosty Czar's Confection",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type1": ["Ice"]
      },
      "category": "Russian Holidays"
    },
    {
      "name": "Snowflake Samovar",
      "roll_count": 1,
      "override_parameters": {
        "species1": [
          "Jibanyan", "Komashura", "Blazion", "Mochismo",
          "Candlemon", "Meramon", "Volcdramon", "Firamon", "Flamon",
          "Torkoal", "Cyndaquil", "Quilava", "Typhlosion", "Tepig", "Pignite", "Emboar", "Fuecoco",
          "Polteageist", "Sinistea", "Alcremie", "Fidough", "Dachsbun", "Heatmor", "Ponyta", "Rapidash"
        ]
      },
      "category": "Russian Holidays"
    },
    {
      "name": "Brave Bear Barrel",
      "roll_count": 2,
      "force_fusion": true,
      "override_parameters": {
        "species1": [
          "Bearmon", "Kumamon",
          "Bearmon", "Grizzlymon", "Pandamon", "Kumamon",
          "Teddiursa", "Ursaring", "Pancham", "Pangoro", "Stufful", "Bewear", "Cubchoo", "Beartic"
        ]
      },
      "category": "Russian Holidays"
    },
    {
      "name": "Victory Vodka Vortex",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type": ["Fire"]
      },
      "category": "Russian Holidays"
    },
    {
      "name": "Pancake Palooza",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": ["Pancake"],
        "attribute": ["Syrupy"]
      },
      "category": "Russian Holidays"
    },
    {
      "name": "Diwali Dazzle Diyas",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "attribute": ["Radiant"],
        "type1": ["Fire", "Fairy"]
      },
      "category": "Indian Holidays"
    },
    {
      "name": "Color Carnival Concoction",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "attribute": ["Vibrant"],
        "type1": ["Red", "Blue", "Green", "Yellow", "Purple"],
        "type2": ["Red", "Blue", "Green", "Yellow", "Purple"],
        "type3": ["Red", "Blue", "Green", "Yellow", "Purple"],
        "type4": ["Red", "Blue", "Green", "Yellow", "Purple"],
        "type5": ["Red", "Blue", "Green", "Yellow", "Purple"]
      },
      "category": "Indian Holidays"
    },
    {
      "name": "Raksha Rhapsody",
      "roll_count": 1,
      "override_parameters": {
        "species1": [
          "Multimutt", "Manyard", "Tengloom",
          "Shoutmon X4", "Knightmon & Pawns", "Sistermon Blanc & Noir", "Numemon",
          "Tandemaus", "Maushold", "Falinks", "Dugtrio", "Dodrio", "Exeggcute", "Exeggutor"
        ]
      },
      "category": "Indian Holidays"
    },
    {
      "name": "Ganesh's Glorious Goodie",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": ["Milcery"],
        "species2": ["Phanpy"],
        "attribute": ["Lucky", "Wise"]
      },
      "category": "Indian Holidays"
    },
    {
      "name": "Tricolor Triumph Tonic",
      "roll_count": 1,
      "override_parameters": {
        "attribute": ["Tricolor"]
      },
      "category": "Indian Holidays"
    },
    {
      "name": "Lunar Lantern Loot",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": [
          "Sparklung", "Ratman", "Tigreus", "Snaggly",
          "Monzaemon", "Dragomon", "Gazimon", "Terriermon", "Lopmon", "Apemon",
          "Rattata", "Raticate", "Raichu", "Pikachu", "Minun", "Plusle", "Pachirisu", "Emolga",
          "Morpeko", "Hisuian Lilligant", "Dratini", "Dragonair", "Dragonite", "Infernape",
          "Serperior", "Bouffalant", "Pyroar"
        ]
      },
      "category": "Chinese Holidays"
    },
    {
      "name": "Dragon Dance Delight",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type": ["Dragon"]
      },
      "category": "Chinese Holidays"
    },
    {
      "name": "Fortune Cookie Fusions",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "attribute": ["Fortunate"]
      },
      "category": "Chinese Holidays"
    }
  ];

  /**
   * Get all available antiques
   * @returns {Array} Array of antique objects
   */
  static getAllAntiques() {
    try {
      // Return the full list of antiques with their details
      return this.ANTIQUES || [];
    } catch (error) {
      console.error('Error getting all antiques:', error);
      return [];
    }
  }

  /**
   * Get antiques by category
   * @param {string} category - Category name
   * @returns {Array} Array of antique objects in the specified category
   */
  static getAntiquesByCategory(category) {
    return this.ANTIQUES.filter(antique => antique.category === category);
  }

  /**
   * Get antique by name
   * @param {string} name - Antique name
   * @returns {Object|null} Antique object or null if not found
   */
  static getAntiqueByName(name) {
    return this.ANTIQUES.find(antique => antique.name === name) || null;
  }

  /**
   * Appraise an antique to get monster rolls
   * @param {number} trainerId - Trainer ID
   * @param {string} antiqueName - Name of the antique to use
   * @returns {Promise<Object>} Result of the appraisal
   */
  static async appraiseAntique(trainerId, antiqueName) {
    try {
      console.log('Starting appraisal process for:', { trainerId, antiqueName }); // Debug log

      // Get the antique
      const antique = this.getAntiqueByName(antiqueName);
      if (!antique) {
        return {
          success: false,
          message: 'Antique not found'
        };
      }

      // Get the trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Check if trainer has the antique
      let antiquesInventory = {};
      if (trainer.inv_antiques) {
        try {
          antiquesInventory = typeof trainer.inv_antiques === 'string'
            ? JSON.parse(trainer.inv_antiques)
            : trainer.inv_antiques;
        } catch (e) {
          console.error('Error parsing antiques inventory:', e);
          return {
            success: false,
            message: 'Error reading inventory'
          };
        }
      }

      const quantity = antiquesInventory[antiqueName] || 0;
      if (quantity <= 0) {
        return {
          success: false,
          message: `You don't have any ${antiqueName} to appraise`
        };
      }

      // Use the updateInventoryItem method to decrease the quantity
      const success = await Trainer.updateInventoryItem(
        trainerId,
        'inv_antiques',
        antiqueName,
        -1 // Decrease by 1
      );

      if (!success) {
        return {
          success: false,
          message: `Failed to update inventory for ${antiqueName}`
        };
      }

      // Prepare roller options with default values
      const rollerOptions = {
        overrideParams: {},
        filters: {
          pokemon: {
            rarity: 'Common',
            stage: ['Base Stage', 'Doesn\'t Evolve']
          },
          digimon: {
            stage: ['Training 1', 'Training 2', 'Rookie']
          },
          yokai: {
            rank: ['E', 'D', 'C', 'B']
          },
          includeSpecies: ['Pokemon', 'Digimon', 'Yokai'],
          excludeSpecies: []
        }
      };

      console.log(`Processing antique: ${antique.name}`);

      // Special handling for specific antiques
      switch (antique.name) {
        // American Holidays
        case "Resolution Rocket":
          // Force fusion with Future/Past Paradox attributes
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute;
          console.log('Resolution Rocket special handling:', rollerOptions.overrideParams);
          break;

        case "Love Velvet Cake":
          // Force fusion with specific species and types
          rollerOptions.overrideParams.forceFusion = true;

          // For Love Velvet Cake, we need to directly override the species selection
          // by creating a custom monster with the specified species and types

          // Get the species list
          const loveSpecies = antique.override_parameters.species;

          // Create a hardcoded monster with the correct species and types
          const randomIndex = Math.floor(Math.random() * loveSpecies.length);
          const selectedSpecies = loveSpecies[randomIndex];

          // Get random types without duplicates
          const loveType1 = antique.override_parameters.type1;
          const randomType1 = loveType1[Math.floor(Math.random() * loveType1.length)];

          // Create a copy of the types array and remove the first selected type
          const availableTypes2 = [...antique.override_parameters.type2].filter(type => type !== randomType1);

          let randomType2 = null;
          if (Math.random() > 0.5 && availableTypes2.length > 0) { // 50% chance to have a second type
            randomType2 = availableTypes2[Math.floor(Math.random() * availableTypes2.length)];
          }

          // Create a copy of the types array and remove already selected types
          const availableTypes3 = [...antique.override_parameters.type3].filter(
            type => type !== randomType1 && type !== randomType2
          );

          let randomType3 = null;
          if (Math.random() > 0.7 && availableTypes3.length > 0) { // 30% chance to have a third type
            randomType3 = availableTypes3[Math.floor(Math.random() * availableTypes3.length)];
          }

          // Set up the filters to force the exact species we want
          rollerOptions.filters.pokemon.speciesName = selectedSpecies;
          rollerOptions.filters.digimon.name = selectedSpecies;
          rollerOptions.filters.yokai.name = selectedSpecies;

          // Also set the override params
          rollerOptions.overrideParams.species1 = selectedSpecies;
          rollerOptions.overrideParams.type1 = randomType1;
          rollerOptions.overrideParams.type2 = randomType2;
          rollerOptions.overrideParams.type3 = randomType3;

          console.log('Love Velvet Cake special handling:', {
            selectedSpecies,
            types: [randomType1, randomType2, randomType3].filter(Boolean),
            rollerOptions
          });
          break;

        case "Lucky Leprechaun's Loot":
          // Grass type with Lucky attribute
          rollerOptions.overrideParams.type1 = antique.override_parameters.type1[0]; // Grass
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Lucky
          console.log('Lucky Leprechaun\'s Loot special handling:', rollerOptions.overrideParams);
          break;

        case "Can't Believe It's Not Butter":
          // Random attribute from the list
          const attributes = antique.override_parameters.attribute;
          const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
          rollerOptions.overrideParams.attributes = [randomAttribute];
          rollerOptions.overrideParams.forceNoFusion = antique.force_fusion === false;
          console.log('Can\'t Believe It\'s Not Butter special handling:', rollerOptions.overrideParams);
          break;

        case "Bunny's Basket Bonanza":
          // Specific bunny/bird species
          const bunnySpecies = antique.override_parameters.species;
          const randomBunnySpecies = bunnySpecies[Math.floor(Math.random() * bunnySpecies.length)];
          rollerOptions.overrideParams.species1 = randomBunnySpecies;
          console.log('Bunny\'s Basket Bonanza special handling:', rollerOptions.overrideParams);
          break;

        case "Star-Spangled Sparkler":
          // No fusion, random monster
          rollerOptions.overrideParams.forceNoFusion = true;
          console.log('Star-Spangled Sparkler special handling:', rollerOptions.overrideParams);
          break;

        case "Fright Night Fudge":
          // Force fusion with Pumpkinmon/Gotsumon/Wizardmon and Spooky attribute
          rollerOptions.overrideParams.forceFusion = true;
          const frightSpecies = antique.override_parameters.species1;
          const randomFrightSpecies = frightSpecies[Math.floor(Math.random() * frightSpecies.length)];
          rollerOptions.overrideParams.species1 = randomFrightSpecies;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Spooky
          console.log('Fright Night Fudge special handling:', rollerOptions.overrideParams);
          break;

        case "Turkey Trot Tonic":
          // Starter species with Thankful attribute
          const turkeySpecies = antique.override_parameters.species1;
          const randomTurkeySpecies = turkeySpecies[Math.floor(Math.random() * turkeySpecies.length)];
          rollerOptions.overrideParams.species1 = randomTurkeySpecies;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Thankful
          console.log('Turkey Trot Tonic special handling:', rollerOptions.overrideParams);
          break;

        case "Jolly Holly Jamboree":
          // Holiday species with Vaccine attribute and Ice/Fire/Grass types
          const hollySpecies = antique.override_parameters.species;
          const randomHollySpecies = hollySpecies[Math.floor(Math.random() * hollySpecies.length)];
          rollerOptions.overrideParams.species1 = randomHollySpecies;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Vaccine

          // Random type from Ice, Fire, Grass
          const hollyTypes = antique.override_parameters.type;
          const randomHollyType = hollyTypes[Math.floor(Math.random() * hollyTypes.length)];
          rollerOptions.overrideParams.type1 = randomHollyType;

          console.log('Jolly Holly Jamboree special handling:', rollerOptions.overrideParams);
          break;

        // Jewish Holidays
        case "Sweet Shofar Surprise":
          // Force fusion with apple species
          rollerOptions.overrideParams.forceFusion = true;
          const shofarSpecies = antique.override_parameters.species_all;
          // Randomly select species for each position
          rollerOptions.overrideParams.species1 = shofarSpecies[Math.floor(Math.random() * shofarSpecies.length)];
          rollerOptions.overrideParams.species2 = shofarSpecies[Math.floor(Math.random() * shofarSpecies.length)];
          if (Math.random() > 0.5) { // 50% chance for third species
            rollerOptions.overrideParams.species3 = shofarSpecies[Math.floor(Math.random() * shofarSpecies.length)];
          }
          console.log('Sweet Shofar Surprise special handling:', rollerOptions.overrideParams);
          break;

        case "Day of Atonement Amulet":
          // No fusion, Normal type only, max 1 type
          rollerOptions.overrideParams.forceNoFusion = true;
          rollerOptions.overrideParams.type1 = antique.override_parameters.type1[0]; // Normal
          rollerOptions.overrideParams.maxType = antique.override_parameters.max_types; // 1
          console.log('Day of Atonement Amulet special handling:', rollerOptions.overrideParams);
          break;

        case "Harvest Haven Hummus":
          // Ground or Rock type
          const harvestTypes = antique.override_parameters.type1;
          const randomHarvestType = harvestTypes[Math.floor(Math.random() * harvestTypes.length)];
          rollerOptions.overrideParams.type1 = randomHarvestType; // Ground or Rock
          console.log('Harvest Haven Hummus special handling:', rollerOptions.overrideParams);
          break;

        case "Latke Lightning in a Jar":
          // Electric type
          rollerOptions.overrideParams.type1 = antique.override_parameters.type1[0]; // Electric
          console.log('Latke Lightning in a Jar special handling:', rollerOptions.overrideParams);
          break;

        case "Sectored Cookie":
          // Force fusion with at least 3 types
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.minType = antique.force_min_types; // 3
          console.log('Sectored Cookie special handling:', rollerOptions.overrideParams);
          break;

        case "Matzah Marvel":
          // Fire type
          rollerOptions.overrideParams.type1 = antique.override_parameters.type1[0]; // Fire
          console.log('Matzah Marvel special handling:', rollerOptions.overrideParams);
          break;

        // Russian Holidays
        case "Frosty Czar's Confection":
          // Force fusion with Ice type
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.type1 = antique.override_parameters.type1[0]; // Ice
          console.log('Frosty Czar\'s Confection special handling:', rollerOptions.overrideParams);
          break;

        case "Snowflake Samovar":
          // Fire-themed species
          const samovarSpecies = antique.override_parameters.species1;
          const randomSamovarSpecies = samovarSpecies[Math.floor(Math.random() * samovarSpecies.length)];
          rollerOptions.overrideParams.species1 = randomSamovarSpecies;
          console.log('Snowflake Samovar special handling:', rollerOptions.overrideParams);
          break;

        case "Brave Bear Barrel":
          // Force fusion with bear species, 2 rolls
          rollerOptions.overrideParams.forceFusion = true;
          const bearSpecies = antique.override_parameters.species1;
          const randomBearSpecies = bearSpecies[Math.floor(Math.random() * bearSpecies.length)];
          rollerOptions.overrideParams.species1 = randomBearSpecies;
          console.log('Brave Bear Barrel special handling:', rollerOptions.overrideParams);
          break;

        case "Victory Vodka Vortex":
          // Force fusion with Fire type
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.type1 = antique.override_parameters.type[0]; // Fire
          console.log('Victory Vodka Vortex special handling:', rollerOptions.overrideParams);
          break;

        case "Pancake Palooza":
          // Force fusion with Pancake species and Syrupy attribute
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.species1 = antique.override_parameters.species1[0]; // Pancake
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Syrupy
          console.log('Pancake Palooza special handling:', rollerOptions.overrideParams);
          break;

        // Indian Holidays
        case "Diwali Dazzle Diyas":
          // Force fusion with Radiant attribute and Fire/Fairy type
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Radiant
          const diwaliTypes = antique.override_parameters.type1;
          const randomDiwaliType = diwaliTypes[Math.floor(Math.random() * diwaliTypes.length)];
          rollerOptions.overrideParams.type1 = randomDiwaliType; // Fire or Fairy
          console.log('Diwali Dazzle Diyas special handling:', rollerOptions.overrideParams);
          break;

        case "Color Carnival Concoction":
          // Force fusion with Vibrant attribute and colorful types
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Vibrant

          // Random color types
          const colorTypes1 = antique.override_parameters.type1;
          rollerOptions.overrideParams.type1 = colorTypes1[Math.floor(Math.random() * colorTypes1.length)];

          const colorTypes2 = antique.override_parameters.type2;
          rollerOptions.overrideParams.type2 = colorTypes2[Math.floor(Math.random() * colorTypes2.length)];

          if (Math.random() > 0.3) { // 70% chance for third type
            const colorTypes3 = antique.override_parameters.type3;
            rollerOptions.overrideParams.type3 = colorTypes3[Math.floor(Math.random() * colorTypes3.length)];
          }

          if (Math.random() > 0.6) { // 40% chance for fourth type
            const colorTypes4 = antique.override_parameters.type4;
            rollerOptions.overrideParams.type4 = colorTypes4[Math.floor(Math.random() * colorTypes4.length)];
          }

          if (Math.random() > 0.8) { // 20% chance for fifth type
            const colorTypes5 = antique.override_parameters.type5;
            rollerOptions.overrideParams.type5 = colorTypes5[Math.floor(Math.random() * colorTypes5.length)];
          }

          console.log('Color Carnival Concoction special handling:', rollerOptions.overrideParams);
          break;

        case "Raksha Rhapsody":
          // Group species
          const rakshaSpecies = antique.override_parameters.species1;
          const randomRakshaSpecies = rakshaSpecies[Math.floor(Math.random() * rakshaSpecies.length)];
          rollerOptions.overrideParams.species1 = randomRakshaSpecies;
          console.log('Raksha Rhapsody special handling:', rollerOptions.overrideParams);
          break;

        case "Ganesh's Glorious Goodie":
          // Force fusion with Milcery and Phanpy, Lucky/Wise attribute
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.species1 = antique.override_parameters.species1[0]; // Milcery
          rollerOptions.overrideParams.species2 = antique.override_parameters.species2[0]; // Phanpy

          // Random attribute from Lucky or Wise
          const ganeshAttributes = antique.override_parameters.attribute;
          const randomGaneshAttribute = ganeshAttributes[Math.floor(Math.random() * ganeshAttributes.length)];
          rollerOptions.overrideParams.attributes = [randomGaneshAttribute];

          console.log('Ganesh\'s Glorious Goodie special handling:', rollerOptions.overrideParams);
          break;

        case "Tricolor Triumph Tonic":
          // Tricolor attribute
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Tricolor
          console.log('Tricolor Triumph Tonic special handling:', rollerOptions.overrideParams);
          break;

        // Chinese Holidays
        case "Lunar Lantern Loot":
          // Force fusion with zodiac animal species
          rollerOptions.overrideParams.forceFusion = true;
          const lunarSpecies = antique.override_parameters.species1;
          const randomLunarSpecies = lunarSpecies[Math.floor(Math.random() * lunarSpecies.length)];
          rollerOptions.overrideParams.species1 = randomLunarSpecies;
          console.log('Lunar Lantern Loot special handling:', rollerOptions.overrideParams);
          break;

        case "Dragon Dance Delight":
          // Force fusion with Dragon type
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.type1 = antique.override_parameters.type[0]; // Dragon
          console.log('Dragon Dance Delight special handling:', rollerOptions.overrideParams);
          break;

        case "Fortune Cookie Fusions":
          // Force fusion with Fortunate attribute
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.attributes = antique.override_parameters.attribute; // Fortunate
          console.log('Fortune Cookie Fusions special handling:', rollerOptions.overrideParams);
          break;

        default:
          // For other antiques, use the generic parameter mapping
          // Map the override parameters to the format expected by MonsterRoller
          const paramMapping = {
            'force fusion': 'forceFusion',
            'force no fusion': 'forceNoFusion',
            'min_types': 'minType',
            'max_types': 'maxType'
          };

          // Process each parameter in the override_parameters
          if (antique.override_parameters) {
            Object.entries(antique.override_parameters).forEach(([key, value]) => {
              // Check if we need to map the key
              const mappedKey = paramMapping[key] || key;
              rollerOptions.overrideParams[mappedKey] = value;
            });
          }
          break;
      }

      // Log the final roller options for debugging
      console.log(`Antique ${antique.name} final roller options:`, JSON.stringify(rollerOptions, null, 2));

      // Roll monsters
      const rollCount = antique.roll_count || 1;
      const monsters = [];

      // Add additional debugging
      console.log(`Rolling ${rollCount} monster(s) with options:`, JSON.stringify(rollerOptions, null, 2));

      try {
        // Import required modules
        const MonsterRoller = require('./MonsterRoller');

        console.log(`Rolling ${rollCount} monster(s) with options:`, JSON.stringify(rollerOptions, null, 2));

        // Roll monsters based on the antique parameters
        for (let i = 0; i < rollCount; i++) {
          // Special handling for antiques that need custom monster creation
          // This ensures we get exactly the species/types/attributes specified

          // Helper function to get a random item from an array
          const getRandomItem = (array) => {
            if (!array || array.length === 0) return null;
            return array[Math.floor(Math.random() * array.length)];
          };

          // Helper function to get unique types from the specified lists
          const getUniqueTypes = (type1List, type2List, type3List) => {
            const selectedTypes = [];

            // Add a type from type1List if it exists
            if (type1List && type1List.length > 0) {
              selectedTypes.push(getRandomItem(type1List));
            }

            // Add a type from type2List if it exists and doesn't duplicate
            if (type2List && type2List.length > 0) {
              let attempts = 0;
              let type2 = null;

              // Try up to 5 times to get a unique type
              while (attempts < 5) {
                type2 = getRandomItem(type2List);
                if (!selectedTypes.includes(type2)) {
                  selectedTypes.push(type2);
                  break;
                }
                attempts++;
              }
            }

            // Add a type from type3List if it exists and doesn't duplicate
            if (type3List && type3List.length > 0) {
              let attempts = 0;
              let type3 = null;

              // Try up to 5 times to get a unique type
              while (attempts < 5) {
                type3 = getRandomItem(type3List);
                if (!selectedTypes.includes(type3)) {
                  selectedTypes.push(type3);
                  break;
                }
                attempts++;
              }
            }

            return selectedTypes;
          };

          // Create a custom monster based on the antique
          let customMonster = null;

          // Check if the antique has specific parameters that should be used
          const hasSpeciesParam = antique.override_parameters && (
            antique.override_parameters.species ||
            antique.override_parameters.species1 ||
            antique.override_parameters.species2 ||
            antique.override_parameters.species3 ||
            antique.override_parameters.species_all
          );

          const hasTypeParam = antique.override_parameters && (
            antique.override_parameters.type ||
            antique.override_parameters.type1 ||
            antique.override_parameters.type2 ||
            antique.override_parameters.type3 ||
            antique.override_parameters.type4 ||
            antique.override_parameters.type5
          );

          const hasAttributeParam = antique.override_parameters && antique.override_parameters.attribute;

          // If the antique doesn't have any specific parameters, skip custom monster creation
          // and use the default monster rolling
          if (!hasSpeciesParam && !hasTypeParam && !hasAttributeParam &&
              !antique.force_fusion && !antique.force_no_fusion && !antique.force_min_types) {
            console.log(`No specific parameters for ${antique.name}, using default monster rolling`);
          } else {
            // Otherwise, create a custom monster based on the antique parameters
            switch (antique.name) {
            case "Resolution Rocket":
              customMonster = {
                species1: 'Paradox Monster',
                species2: null,
                species3: null,
                type1: 'Psychic',
                type2: 'Dragon',
                type3: null,
                type4: null,
                type5: null,
                attribute: getRandomItem(antique.override_parameters.attribute) // Future Paradox or Past Paradox
              };
              break;

            case "Love Velvet Cake":
              // Get a random species from the list
              const loveSpecies = getRandomItem(antique.override_parameters.species);

              // Get unique types from the specified lists
              const loveTypes = getUniqueTypes(
                antique.override_parameters.type1,
                antique.override_parameters.type2,
                antique.override_parameters.type3
              );

              customMonster = {
                species1: loveSpecies,
                species2: null,
                species3: null,
                type1: loveTypes[0] || 'Fairy',
                type2: loveTypes[1] || null,
                type3: loveTypes[2] || null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Lucky Leprechaun's Loot":
              customMonster = {
                species1: 'Leprechaun',
                species2: null,
                species3: null,
                type1: 'Grass', // From type1: ["Grass"]
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Lucky' // From attribute: ["Lucky"]
              };
              break;

            case "Can't Believe It's Not Butter":
              customMonster = {
                species1: 'Butterless',
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: getRandomItem(antique.override_parameters.attribute) // Random from the attribute list
              };
              break;

            case "Bunny's Basket Bonanza":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species),
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Star-Spangled Sparkler":
              // This one uses normal monster rolling with force_no_fusion
              break;

            case "Fright Night Fudge":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Ghost',
                type2: 'Dark',
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Spooky' // From attribute: ["Spooky"]
              };
              break;

            case "Turkey Trot Tonic":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Thankful' // From attribute: ["Thankful"]
              };
              break;

            case "Jolly Holly Jamboree":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species),
                species2: null,
                species3: null,
                type1: getRandomItem(antique.override_parameters.type),
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Vaccine' // From attribute: ["Vaccine"]
              };
              break;

            case "Sweet Shofar Surprise":
              // Get random species from the species_all list
              const shofarSpecies = antique.override_parameters.species_all;

              customMonster = {
                species1: getRandomItem(shofarSpecies),
                species2: getRandomItem(shofarSpecies),
                species3: Math.random() > 0.5 ? getRandomItem(shofarSpecies) : null,
                type1: 'Grass',
                type2: 'Fairy',
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Day of Atonement Amulet":
              // This antique should use default monster rolling with Normal type restriction
              // and max_types = 1, so we'll skip custom monster creation
              break;

            case "Harvest Haven Hummus":
              // This antique should use default monster rolling with Ground or Rock type restriction
              break;

            case "Latke Lightning in a Jar":
              // This antique should use default monster rolling with Electric type restriction
              break;

            case "Sectored Cookie":
              // This one uses normal monster rolling with force_min_types = 3
              break;

            case "Matzah Marvel":
              // This antique should use default monster rolling with Fire type restriction
              break;

            case "Frosty Czar's Confection":
              // This antique should use default monster rolling with Ice type restriction and force_fusion = true
              break;

            case "Snowflake Samovar":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Fire',
                type2: 'Ice',
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Brave Bear Barrel":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: 'Fighting',
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Victory Vodka Vortex":
              // This antique should use default monster rolling with Fire type restriction and force_fusion = true
              break;

            case "Pancake Palooza":
              // Use custom monster for this one since it has a specific species and attribute
              customMonster = {
                species1: 'Pancake', // From species1: ["Pancake"]
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Syrupy' // From attribute: ["Syrupy"]
              };
              break;

            case "Diwali Dazzle Diyas":
              // This antique should use default monster rolling with Fire or Fairy type restriction,
              // Radiant attribute, and force_fusion = true
              break;

            case "Color Carnival Concoction":
              // Get unique color types
              const colorTypes = getUniqueTypes(
                antique.override_parameters.type1,
                antique.override_parameters.type2,
                antique.override_parameters.type3
              );

              customMonster = {
                species1: 'Color Carnival',
                species2: null,
                species3: null,
                type1: colorTypes[0] || 'Red',
                type2: colorTypes[1] || null,
                type3: colorTypes[2] || null,
                type4: null,
                type5: null,
                attribute: 'Vibrant' // From attribute: ["Vibrant"]
              };
              break;

            case "Raksha Rhapsody":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Normal',
                type2: null,
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Ganesh's Glorious Goodie":
              customMonster = {
                species1: 'Milcery', // From species1: ["Milcery"]
                species2: 'Phanpy', // From species2: ["Phanpy"]
                species3: null,
                type1: 'Fairy',
                type2: 'Ground',
                type3: null,
                type4: null,
                type5: null,
                attribute: getRandomItem(antique.override_parameters.attribute) // Lucky or Wise
              };
              break;

            case "Tricolor Triumph Tonic":
              customMonster = {
                species1: 'Tricolor',
                species2: null,
                species3: null,
                type1: 'Fire',
                type2: 'Water',
                type3: 'Grass',
                type4: null,
                type5: null,
                attribute: 'Tricolor' // From attribute: ["Tricolor"]
              };
              break;

            case "Lunar Lantern Loot":
              customMonster = {
                species1: getRandomItem(antique.override_parameters.species1),
                species2: null,
                species3: null,
                type1: 'Electric',
                type2: 'Fire',
                type3: null,
                type4: null,
                type5: null,
                attribute: 'Variable'
              };
              break;

            case "Dragon Dance Delight":
              // This antique should use default monster rolling with Dragon type restriction and force_fusion = true
              break;

            case "Fortune Cookie Fusions":
              // This antique should use default monster rolling with Fortunate attribute and force_fusion = true
              break;
          }

            // If we created a custom monster, add it and continue
            if (customMonster) {
              console.log(`Created custom monster for ${antique.name}:`, customMonster);
              monsters.push(customMonster);
              continue; // Skip the normal monster rolling
            }
          }

          try {
            // Create a new roller for each monster
            const roller = new MonsterRoller(rollerOptions);
            const monster = await roller.rollMonster();

            if (!monster) {
              throw new Error('Failed to roll monster');
            }

            console.log(`Successfully rolled monster ${i+1}:`, monster);
            monsters.push(monster);
          } catch (rollError) {
            console.error(`Error rolling monster ${i+1}:`, rollError);

            // Create a fallback monster with some randomness
            const fallbackSpecies = [
              'Mystery Monster', 'Unknown Creature', 'Strange Being', 'Curious Critter', 'Enigmatic Entity'
            ];
            const fallbackTypes = [
              'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying'
            ];
            const fallbackAttributes = [
              'Data', 'Vaccine', 'Virus', 'Free', 'Variable'
            ];

            // Create a somewhat random fallback monster
            const fallbackMonster = {
              species1: fallbackSpecies[Math.floor(Math.random() * fallbackSpecies.length)],
              species2: Math.random() > 0.7 ? fallbackSpecies[Math.floor(Math.random() * fallbackSpecies.length)] : null,
              species3: Math.random() > 0.9 ? fallbackSpecies[Math.floor(Math.random() * fallbackSpecies.length)] : null,
              type1: fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)],
              type2: Math.random() > 0.6 ? fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)] : null,
              type3: Math.random() > 0.8 ? fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)] : null,
              type4: Math.random() > 0.9 ? fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)] : null,
              type5: Math.random() > 0.95 ? fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)] : null,
              attribute: fallbackAttributes[Math.floor(Math.random() * fallbackAttributes.length)]
            };

            console.log(`Created fallback monster ${i+1}:`, fallbackMonster);
            monsters.push(fallbackMonster);
          }
        }

        console.log('Final monsters array:', monsters);
      } catch (error) {
        console.error('Error during monster creation:', error);
        // Don't throw the error, instead return a fallback monster
        if (monsters.length === 0) {
          monsters.push({
            species1: 'Mystery Monster',
            species2: null,
            species3: null,
            type1: 'Normal',
            type2: null,
            type3: null,
            type4: null,
            type5: null,
            attribute: 'Variable'
          });
        }
      }

      return {
        success: true,
        message: `Successfully appraised ${antiqueName}`,
        monsters: monsters,
        antique: antique
      };

    } catch (error) {
      console.error('Detailed error in AntiqueAppraisalService:', error);
      return {
        success: false,
        message: 'Error appraising antique: ' + error.message
      };
    }
  }

  static async getTrainerAntiques(trainerId) {
    try {
      const inventory = await Trainer.getInventory(trainerId);
      let antiquesInventory = {};

      if (inventory?.inv_antiques) {
        antiquesInventory = typeof inventory.inv_antiques === 'string'
          ? JSON.parse(inventory.inv_antiques)
          : inventory.inv_antiques;
      }

      return this.getAllAntiques().map(antique => ({
        ...antique,
        quantity: antiquesInventory[antique.id] || antiquesInventory[antique.name] || 0
      }));
    } catch (error) {
      console.error('Error getting trainer antiques:', error);
      return [];
    }
  }

  static async generateRewards(antique) {
    try {
      // Basic reward structure based on antique properties
      const rewards = {
        coins: 0,
        items: [],
        experience: 0
      };

      // Add base rewards
      rewards.coins = Math.floor(Math.random() * 1000) + 500; // Random coins between 500-1500
      rewards.experience = Math.floor(Math.random() * 100) + 50; // Random XP between 50-150

      // Add special rewards based on antique category
      if (antique.category === 'Chinese Holidays') {
        rewards.items.push({
          type: 'fortune_cookie',
          quantity: 1
        });
      }

      // Add any additional reward logic based on antique properties
      if (antique.roll_count > 1) {
        rewards.coins *= antique.roll_count;
        rewards.experience *= antique.roll_count;
      }

      return rewards;
    } catch (error) {
      console.error('Error generating rewards:', error);
      throw error;
    }
  }
}

module.exports = AntiqueAppraisalService;



