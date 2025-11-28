const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { buildRandomLimit, buildLimit } = require('../utils/dbUtils');

/**
 * @desc    Get images for species
 * @route   GET /api/species/images
 * @access  Public
 */
const getSpeciesImages = asyncHandler(async (req, res) => {
  try {
    const { species } = req.query;

    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Species parameter is required'
      });
    }

    // Split the species string into an array
    const speciesArray = species.split(',');

    // Initialize results array
    const images = [];

    // Query each monster table for the species
    for (const speciesName of speciesArray) {
      // Query Pokemon monsters
      const pokemonResult = await db.asyncGet(
        `SELECT name, image_url FROM pokemon_monsters WHERE name =$1`,
        [speciesName]
      );

      if (pokemonResult && pokemonResult.image_url) {
        images.push({
          species: speciesName,
          url: pokemonResult.image_url
        });
        continue; // Skip to next species if found
      }

      // Query Digimon monsters
      const digimonResult = await db.asyncGet(
        `SELECT name, image_url FROM digimon_monsters WHERE name =$1`,
        [speciesName]
      );

      if (digimonResult && digimonResult.image_url) {
        images.push({
          species: speciesName,
          url: digimonResult.image_url
        });
        continue; // Skip to next species if found
      }

      // Query Yokai monsters
      const yokaiResult = await db.asyncGet(
        `SELECT name, image_url FROM yokai_monsters WHERE name =$1`,
        [speciesName]
      );

      if (yokaiResult && yokaiResult.image_url) {
        images.push({
          species: speciesName,
          url: yokaiResult.image_url
        });
        continue; // Skip to next species if found
      }

      // Query Nexomon monsters
      const nexomonResult = await db.asyncGet(
        `SELECT name, image_url FROM nexomon_monsters WHERE name =$1`,
        [speciesName]
      );

      if (nexomonResult && nexomonResult.image_url) {
        images.push({
          species: speciesName,
          url: nexomonResult.image_url
        });
        continue; // Skip to next species if found
      }

      // Query Pals monsters
      const palsResult = await db.asyncGet(
        `SELECT name, image_url FROM pals_monsters WHERE name =$1`,
        [speciesName]
      );

      if (palsResult && palsResult.image_url) {
        images.push({
          species: speciesName,
          url: palsResult.image_url
        });
        continue; // Skip to next species if found
      }

      // Query Fakemon monsters
      const fakemonResult = await db.asyncGet(
        `SELECT name, image_url FROM fakemon WHERE name =$1`,
        [speciesName]
      );

      if (fakemonResult && fakemonResult.image_url) {
        images.push({
          species: speciesName,
          url: fakemonResult.image_url
        });
        continue; // Skip to next species if found
      }

      // If no image found, add a null URL
      images.push({
        species: speciesName,
        url: null
      });
    }

    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Error getting species images:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting species images',
      error: error.message
    });
  }
});

/**
 * @desc    Get random species
 * @route   GET /api/species/random
 * @access  Public (optional auth to check user settings)
 */
const getRandomSpecies = asyncHandler(async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;

    // Get user settings for monster roller
    const User = require('../models/User');
    const getUserSettings = (user) => {
      // Default settings if user has no settings
      const defaultSettings = {
        pokemon: true,
        digimon: true,
        yokai: true,
        nexomon: true,
        pals: true,
        fakemon: true
      };

      // If user has monster_roller_settings, parse them
      if (user && user.monster_roller_settings) {
        try {
          // Check if settings is already an object
          let settings;
          if (typeof user.monster_roller_settings === 'object') {
            settings = user.monster_roller_settings;
          } else {
            settings = JSON.parse(user.monster_roller_settings);
          }
          return { ...defaultSettings, ...settings };
        } catch (error) {
          console.error('Error parsing user monster roller settings:', error);
        }
      }

      return defaultSettings;
    };

    // Get current user and their settings
    let userSettings = {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true
    };

    if (req.user && req.user.discord_id) {
      try {
        const user = await User.findByDiscordId(req.user.discord_id);
        userSettings = getUserSettings(user);
      } catch (error) {
        console.error('Error getting user settings for species roll:', error);
        // Fall back to default settings if error
      }
    }

    console.log('Rolling species with user settings:', userSettings);

    // Use the EXACT same filtering logic as EggHatcher to ensure species can only be
    // base stage, unevolved monsters (no legendaries, mythicals, or evolved forms)
    // This matches the nursery's strict egg hatching rules
    const { isPostgreSQL } = require('../utils/dbUtils');

    // Build query parts based on enabled tables
    const queryParts = [];
    let params = [];

    if (userSettings.pokemon) {
      if (isPostgreSQL) {
        queryParts.push(`
          SELECT name FROM pokemon_monsters
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND is_mythical = false
        `);
      } else {
        queryParts.push(`
          SELECT name FROM pokemon_monsters
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND is_mythical = false
        `);
      }
    }

    if (userSettings.digimon) {
      queryParts.push(`
        SELECT name FROM digimon_monsters
        WHERE rank IN ('Baby I', 'Baby II')
      `);
    }

    if (userSettings.yokai) {
      if (isPostgreSQL) {
        queryParts.push(`
          SELECT name FROM yokai_monsters
          WHERE rank IN ('E', 'D', 'C')
            AND (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
        `);
      } else {
        queryParts.push(`
          SELECT name FROM yokai_monsters
          WHERE rank IN ('E', 'D', 'C')
            AND (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
        `);
      }
    }

    if (userSettings.nexomon) {
      if (isPostgreSQL) {
        queryParts.push(`
          SELECT name FROM nexomon_monsters
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND (stage IS NULL OR stage = 'Base Stage')
        `);
      } else {
        queryParts.push(`
          SELECT name FROM nexomon_monsters
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND (stage IS NULL OR stage = 'Base Stage')
        `);
      }
    }

    if (userSettings.pals) {
      queryParts.push(`
        SELECT name FROM pals_monsters
      `);
    }

    if (userSettings.fakemon) {
      if (isPostgreSQL) {
        queryParts.push(`
          SELECT name FROM fakemon
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND is_mythical = false
        `);
      } else {
        queryParts.push(`
          SELECT name FROM fakemon
          WHERE (stage = 'Base Stage' OR stage = 'Doesn''t Evolve')
            AND is_legendary = false
            AND is_mythical = false
        `);
      }
    }

    // If no tables are enabled, return error
    if (queryParts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No monster tables are enabled in your settings'
      });
    }

    let query = `
      SELECT name FROM (
        ${queryParts.join(' UNION ')}
      ) AS random_species`;

    query += buildRandomLimit(count, params);

    const species = await db.asyncAll(query, params);

    return res.status(200).json({
      success: true,
      species: species.map(s => s.name)
    });
  } catch (error) {
    console.error('Error getting random species:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @desc    Get species list
 * @route   GET /api/species/list
 * @access  Public
 */
const getSpeciesList = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || '';

    console.log('Species list request:', { limit, search, query: req.query });

    let query = `
      SELECT name FROM (
        SELECT name FROM pokemon_monsters
        UNION
        SELECT name FROM digimon_monsters
        UNION
        SELECT name FROM nexomon_monsters
        UNION
        SELECT name FROM yokai_monsters
        UNION
        SELECT name FROM pals_monsters
        UNION
        SELECT name FROM fakemon
      ) AS all_species
    `;

    const params = [];

    if (search) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name';
    query += buildLimit(limit, params);

    console.log('Executing species list query:', query, params);
    const species = await db.asyncAll(query, params);
    console.log('Species list results:', species.length, 'species found');

    return res.status(200).json({
      success: true,
      species: species.map(s => s.name)
    });
  } catch (error) {
    console.error('Error getting species list:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @desc    Search species
 * @route   GET /api/species/search
 * @access  Public
 */
const searchSpecies = asyncHandler(async (req, res) => {
  try {
    const search = req.query.search || req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;

    console.log('Species search request:', { search, limit, query: req.query });

    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    let query = `
      SELECT name FROM (
        SELECT name FROM pokemon_monsters
        UNION
        SELECT name FROM digimon_monsters
        UNION
        SELECT name FROM nexomon_monsters
        UNION
        SELECT name FROM yokai_monsters
        UNION
        SELECT name FROM pals_monsters
        UNION
        SELECT name FROM fakemon
      ) AS all_species WHERE name ILIKE $1 ORDER BY name`;

    const params = [`%${search}%`];
    query += buildLimit(limit, params);

    console.log('Executing species search query:', query, params);
    const species = await db.asyncAll(query, params);
    console.log('Species search results:', species.length, 'species found');

    return res.status(200).json({
      success: true,
      species: species.map(s => s.name)
    });
  } catch (error) {
    console.error('Error searching species:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = {
  getSpeciesImages,
  getRandomSpecies,
  getSpeciesList,
  searchSpecies
};
