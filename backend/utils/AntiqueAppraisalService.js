/**
 * AntiqueAppraisalService
 * 
 * This service handles the unique roll parameters for each antique.
 * Each antique has specific roll settings that are applied to the monster roller.
 */
class AntiqueAppraisalService {
  /**
   * List of all antiques with their unique roll parameters
   */
  static ANTIQUES = [
    {
      "name": "Resolution Rocket",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "force_fusion": true,
        "attribute": ["Future Paradox", "Past Paradox"]
      },
      "category": "American Holidays",
      "holiday": "New Year's"
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
      "category": "American Holidays",
      "holiday": "Valentine's Day"
    },
    {
      "name": "Lucky Leprechaun's Loot",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Grass"],
        "attribute": ["Lucky"]
      },
      "category": "American Holidays",
      "holiday": "St. Patrick's Day"
    },
    {
      "name": "Can't Believe It's Not Butter",
      "roll_count": 1,
      "force_fusion": false,
      "override_parameters": {
        "attribute": ["Trash", "Raccoon", "Snake", "Shoe", "Artist", "Silly", "Mongoose", "Architecture", "Water Bottle", "Oppression", "Vile", "Cute", "Prank", "Organic", "Geometric", "Illegal"]
      },
      "category": "American Holidays",
      "holiday": "April Fool's Day"
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
      "category": "American Holidays",
      "holiday": "Easter"
    },
    {
      "name": "Star-Spangled Sparkler",
      "roll_count": 1,
      "force_no_fusion": true,
      "override_parameters": {},
      "category": "American Holidays",
      "holiday": "Independence Day"
    },
    {
      "name": "Fright Night Fudge",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": ["Pumpkinmon", "Gotsumon", "Wizardmon"],
        "attribute": ["Spooky"]
      },
      "category": "American Holidays",
      "holiday": "Halloween"
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
      "category": "American Holidays",
      "holiday": "Thanksgiving"
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
      "category": "American Holidays",
      "holiday": "Christmas"
    },
    {
      "name": "Sweet Shofar Surprise",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species_all": ["Applin", "Sigh-Durr", "Appak"]
      },
      "category": "Jewish Holidays",
      "holiday": "Rosh Hashanah"
    },
    {
      "name": "Day of Atonement Amulet",
      "roll_count": 1,
      "allow_fusion": false,
      "override_parameters": {
        "type1": ["Normal"],
        "max_types": 1
      },
      "category": "Jewish Holidays",
      "holiday": "Yom Kippur"
    },
    {
      "name": "Harvest Haven Hummus",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Ground", "Rock"]
      },
      "category": "Jewish Holidays",
      "holiday": "Sukkot"
    },
    {
      "name": "Latke Lightning in a Jar",
      "roll_count": 1,
      "override_parameters": {
        "type1": ["Electric"]
      },
      "category": "Jewish Holidays",
      "holiday": "Hanukkah"
    },
    {
      "name": "Sectored Cookie",
      "roll_count": 1,
      "force_fusion": true,
      "force_min_types": 3,
      "override_parameters": {},
      "category": "Jewish Holidays",
      "holiday": "Purim"
    },
    {
      "name": "Matzah Marvel",
      "roll_count": 1,
      "force_no_fusion": false,
      "override_parameters": {
        "type1": ["Fire"]
      },
      "category": "Jewish Holidays",
      "holiday": "Passover"
    },
    {
      "name": "Frosty Czar's Confection",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type1": ["Ice"]
      },
      "category": "Russian Holidays",
      "holiday": "New Year's"
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
      "category": "Russian Holidays",
      "holiday": "Old New Year"
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
      "category": "Russian Holidays",
      "holiday": "Defender of the Fatherland Day"
    },
    {
      "name": "Victory Vodka Vortex",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type": ["Fire"]
      },
      "category": "Russian Holidays",
      "holiday": "Victory Day"
    },
    {
      "name": "Pancake Palooza",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "species1": ["Pancake"],
        "attribute": ["Syrupy"]
      },
      "category": "Russian Holidays",
      "holiday": "Maslenitsa"
    },
    {
      "name": "Diwali Dazzle Diyas",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "attribute": ["Radiant"],
        "type1": ["Fire", "Fairy"]
      },
      "category": "Indian Holidays",
      "holiday": "Diwali"
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
      "category": "Indian Holidays",
      "holiday": "Holi"
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
      "category": "Indian Holidays",
      "holiday": "Raksha Bandhan"
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
      "category": "Indian Holidays",
      "holiday": "Ganesh Chaturthi"
    },
    {
      "name": "Tricolor Triumph Tonic",
      "roll_count": 1,
      "override_parameters": {
        "attribute": ["Tricolor"]
      },
      "category": "Indian Holidays",
      "holiday": "Independence Day"
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
      "category": "Chinese Holidays",
      "holiday": "Lunar New Year"
    },
    {
      "name": "Dragon Dance Delight",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "type": ["Dragon"]
      },
      "category": "Chinese Holidays",
      "holiday": "Lunar New Year"
    },
    {
      "name": "Fortune Cookie Fusions",
      "roll_count": 1,
      "force_fusion": true,
      "override_parameters": {
        "attribute": ["Fortunate"]
      },
      "category": "Chinese Holidays",
      "holiday": "Lunar New Year"
    }
  ];

  /**
   * Get an antique by name
   * @param {string} name - Antique name
   * @returns {Object|null} - Antique object or null if not found
   */
  static getAntiqueByName(name) {
    return this.ANTIQUES.find(antique => antique.name === name) || null;
  }

  /**
   * Get all antiques by category
   * @param {string} category - Category name
   * @returns {Array} - Array of antiques in the category
   */
  static getAntiquesByCategory(category) {
    return this.ANTIQUES.filter(antique => antique.category === category);
  }

  /**
   * Get all antiques by holiday
   * @param {string} holiday - Holiday name
   * @returns {Array} - Array of antiques for the holiday
   */
  static getAntiquesByHoliday(holiday) {
    return this.ANTIQUES.filter(antique => antique.holiday === holiday);
  }

  /**
   * Get all unique holidays
   * @returns {Array} - Array of unique holiday names
   */
  static getHolidays() {
    return [...new Set(this.ANTIQUES.map(antique => antique.holiday))];
  }

  /**
   * Get all categories
   * @returns {Array} - Array of unique category names
   */
  static getCategories() {
    return [...new Set(this.ANTIQUES.map(antique => antique.category))];
  }

  /**
   * Convert antique parameters to monster roller parameters
   * @param {Object} antique - Antique object
   * @returns {Object} - Monster roller parameters
   */
  static convertToRollerParams(antique) {
    const params = {
      roll_count: antique.roll_count || 1
    };

    // Handle fusion settings
    if (antique.force_fusion) {
      params.fusion_forced = true;
    } else if (antique.force_no_fusion) {
      params.fusion_forced = false;
      params.species_max = 1;
    } else if (antique.allow_fusion === false) {
      params.species_max = 1;
    }

    // Handle min types
    if (antique.force_min_types) {
      params.types_min = antique.force_min_types;
    }

    // Merge override parameters
    if (antique.override_parameters) {
      Object.entries(antique.override_parameters).forEach(([key, value]) => {
        // Handle special cases for parameter conversion
        if (key === 'species' || key === 'species_all') {
          // If species_all is provided, set all species slots to the same pool
          if (key === 'species_all') {
            params.species1 = this.getRandomFromArray(value);
            params.species2 = this.getRandomFromArray(value);
            params.species3 = this.getRandomFromArray(value);
          } else {
            // For regular species array, set as includeSpecies
            params.includeSpecies = value;
          }
        } else if (key === 'type' || key === 'types') {
          // Handle type arrays for all type slots
          params.includeTypes = value;
        } else if (key.startsWith('species') && Array.isArray(value)) {
          // For specific species slots with arrays, use includeSpecies for that slot
          // This allows the query to use IN (...) instead of exact match
          const slotNumber = key.slice(7); // Extract the slot number (e.g., '1' from 'species1')
          if (slotNumber) {
            params[`includeSpecies${slotNumber}`] = value;
          } else {
            params.includeSpecies = value;
          }
        } else if (key.startsWith('type') && Array.isArray(value)) {
          // For specific type slots with arrays, pick a random one
          params[key] = this.getRandomFromArray(value);
        } else if (key === 'attribute' && Array.isArray(value)) {
          // For attribute arrays, pick a random one and set as override
          // This will be applied to the monster AFTER rolling, not used as a filter
          params.override_attribute = this.getRandomFromArray(value);
        } else {
          // Default case: just copy the value
          params[key] = value;
        }
      });
    }

    return params;
  }

  /**
   * Get a random element from an array
   * @param {Array} array - Array to pick from
   * @returns {*} - Random element from the array
   */
  static getRandomFromArray(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Process an antique for appraisal
   * @param {string} antiqueName - Name of the antique
   * @returns {Object} - Processed parameters for monster roller
   */
  static processAntique(antiqueName) {
    const antique = this.getAntiqueByName(antiqueName);
    if (!antique) {
      throw new Error(`Antique not found: ${antiqueName}`);
    }

    // Get base parameters from the antique
    let params = this.convertToRollerParams(antique);

    // Apply special case handling
    params = this.handleSpecialCases(antiqueName, params);

    return params;
  }

  /**
   * Roll a monster based on antique parameters
   * @param {string} antiqueName - Name of the antique
   * @param {Object} monsterRoller - MonsterRoller instance
   * @returns {Promise<Object|Array>} - Rolled monster(s)
   */
  static async rollMonster(antiqueName, monsterRoller) {
    const params = this.processAntique(antiqueName);
    const rollCount = params.roll_count || 1;

    // Remove roll_count from params as it's not a valid MonsterRoller parameter
    delete params.roll_count;

    // If roll count is 1, just roll a single monster
    if (rollCount === 1) {
      return await monsterRoller.rollMonster(params);
    }

    // Otherwise, roll multiple monsters
    return await monsterRoller.rollMany(params, rollCount);
  }

  /**
   * Get roll parameters for the backend antiqueController
   * @param {string} antiqueName - Name of the antique
   * @returns {Object} - Roll parameters for the backend
   */
  static getBackendRollParams(antiqueName) {
    const params = this.processAntique(antiqueName);

    // Convert to backend format
    const backendParams = {
      fusion_forced: params.fusion_forced || false,
      min_types: params.types_min || 1,
      max_types: params.types_max || 5,
      allowed_types: [],
      allowed_attributes: [],
      allowed_species: []
    };

    // Process type parameters
    if (params.includeTypes && params.includeTypes.length > 0) {
      backendParams.allowed_types = params.includeTypes;
    } else {
      // Check for specific type slots
      for (let i = 1; i <= 5; i++) {
        const typeKey = `type${i}`;
        if (params[typeKey]) {
          if (Array.isArray(params[typeKey])) {
            backendParams.allowed_types = [...backendParams.allowed_types, ...params[typeKey]];
          } else {
            backendParams.allowed_types.push(params[typeKey]);
          }
        }
      }
    }

    // Process attribute parameters
    if (params.attribute) {
      if (Array.isArray(params.attribute)) {
        backendParams.allowed_attributes = params.attribute;
      } else {
        backendParams.allowed_attributes = [params.attribute];
      }
    }

    // Process species parameters
    if (params.includeSpecies && params.includeSpecies.length > 0) {
      backendParams.allowed_species = params.includeSpecies;
    } else {
      // Check for specific species slots
      for (let i = 1; i <= 3; i++) {
        const speciesKey = `species${i}`;
        if (params[speciesKey]) {
          if (Array.isArray(params[speciesKey])) {
            backendParams.allowed_species = [...backendParams.allowed_species, ...params[speciesKey]];
          } else {
            backendParams.allowed_species.push(params[speciesKey]);
          }
        }
      }
    }

    return backendParams;
  }

  /**
   * Handle special case antiques that need custom processing
   * @param {string} antiqueName - Name of the antique
   * @param {Object} baseParams - Base parameters
   * @returns {Object} - Modified parameters
   */
  static handleSpecialCases(antiqueName, baseParams) {
    const params = { ...baseParams };

    switch (antiqueName) {
      case "Resolution Rocket":
        // Future Paradox or Past Paradox attribute with forced fusion
        params.fusion_forced = true;
        params.override_attribute = this.getRandomFromArray(["Future Paradox", "Past Paradox"]);
        break;

      case "Sweet Shofar Surprise":
        // Force fusion with apple-themed species
        params.fusion_forced = true;
        params.species1 = "Applin";
        params.species2 = this.getRandomFromArray(["Sigh-Durr", "Appak"]);
        break;

      case "Sectored Cookie":
        // Force fusion with at least 3 types
        params.fusion_forced = true;
        params.types_min = 3;
        break;

      case "Brave Bear Barrel":
        // Roll 2 bear-themed monsters with forced fusion
        params.roll_count = 2;
        params.fusion_forced = true;
        break;

      case "Color Carnival Concoction":
        // Vibrant attribute with colorful types
        params.fusion_forced = true;
        params.override_attribute = "Vibrant";
        // Assign random colors to each type slot
        const colors = ["Red", "Blue", "Green", "Yellow", "Purple"];
        for (let i = 1; i <= 5; i++) {
          params[`type${i}`] = this.getRandomFromArray(colors);
        }
        break;

      case "Ganesh's Glorious Goodie":
        // Fusion of Milcery and Phanpy with Lucky or Wise attribute
        params.fusion_forced = true;
        params.species1 = "Milcery";
        params.species2 = "Phanpy";
        params.override_attribute = this.getRandomFromArray(["Lucky", "Wise"]);
        break;

      default:
        // No special handling needed
        break;
    }

    return params;
  }

  /**
   * Get all antiques with their roll parameters
   * @returns {Array} - Array of antiques with roll parameters
   */
  static getAllAntiquesWithParams() {
    return this.ANTIQUES.map(antique => {
      const params = this.processAntique(antique.name);
      return {
        ...antique,
        rollParams: params
      };
    });
  }

  /**
   * Get antiques by holiday category with their roll parameters
   * @param {string} category - Holiday category
   * @returns {Array} - Array of antiques in the category with roll parameters
   */
  static getAntiquesByCategoryWithParams(category) {
    const antiques = this.getAntiquesByCategory(category);
    return antiques.map(antique => {
      const params = this.processAntique(antique.name);
      return {
        ...antique,
        rollParams: params
      };
    });
  }
}

module.exports = AntiqueAppraisalService;
