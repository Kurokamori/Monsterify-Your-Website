const db = require('../config/db');
const { buildLimitOffset, buildRandomLimit } = require('../utils/dbUtils');
const cloudinary = require('../utils/cloudinary');

/**
 * Table creation removed for PostgreSQL compatibility
 * Tables should be created through proper migrations
 * @returns {Promise<void>}
 */
async function ensureFakemonTableExists() {
  try {
    console.log('Fakemon table creation skipped - using PostgreSQL migrations');

    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'ability1', type: 'TEXT' },
      { name: 'ability2', type: 'TEXT' },
      { name: 'hidden_ability', type: 'TEXT' },
      { name: 'hp', type: 'INTEGER' },
      { name: 'attack', type: 'INTEGER' },
      { name: 'defense', type: 'INTEGER' },
      { name: 'special_attack', type: 'INTEGER' },
      { name: 'special_defense', type: 'INTEGER' },
      { name: 'speed', type: 'INTEGER' },
      { name: 'classification', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      try {
        await db.asyncGet(`SELECT ${column.name} FROM fakemon LIMIT 1`);
      } catch (e) {
        if (e.message.includes('no such column')) {
          console.log(`Adding ${column.name} column to fakemon table`);
          await db.asyncExec(`ALTER TABLE fakemon ADD COLUMN ${column.name} ${column.type}`);
        }
      }
    }

    // Check if table is empty and seed initial data if needed
    const count = await db.asyncGet('SELECT COUNT(*) as count FROM fakemon');
    if (count && count.count === 0) {
      await seedInitialFakemon();
    }
  } catch (error) {
    console.error('Error creating fakemon table:', error);
    throw error;
  }
}

/**
 * Seed initial Fakemon data
 * @returns {Promise<void>}
 */
async function seedInitialFakemon() {
  try {
    console.log('Seeding initial Fakemon data...');

    // Sample Fakemon data
    const fakemonData = [
      {
        number: 1,
        name: 'Leaflet',
        category: 'Seedling',
        type1: 'Grass',
        description: 'A small, leafy Fakemon that loves to bask in the sunlight. It stores energy in the leaf on its head.',
        image_url: 'https://via.placeholder.com/200?text=Leaflet',
        ability1: 'Overgrow',
        ability2: 'Chlorophyll',
        hidden_ability: 'Leaf Guard',
        hp: 45,
        attack: 49,
        defense: 49,
        special_attack: 65,
        special_defense: 65,
        speed: 45,
        evolution_line: JSON.stringify([
          { number: 1, name: 'Leaflet', level: 1 },
          { number: 2, name: 'Frondleaf', level: 16 },
          { number: 3, name: 'Arborealis', level: 32 }
        ])
      },
      {
        number: 2,
        name: 'Frondleaf',
        category: 'Sapling',
        type1: 'Grass',
        description: 'The leaves on its body have grown larger, allowing it to absorb more sunlight for energy.',
        image_url: 'https://via.placeholder.com/200?text=Frondleaf',
        ability1: 'Overgrow',
        ability2: 'Chlorophyll',
        hidden_ability: 'Leaf Guard',
        hp: 60,
        attack: 62,
        defense: 63,
        special_attack: 80,
        special_defense: 80,
        speed: 60,
        evolution_line: JSON.stringify([
          { number: 1, name: 'Leaflet', level: 1 },
          { number: 2, name: 'Frondleaf', level: 16 },
          { number: 3, name: 'Arborealis', level: 32 }
        ])
      },
      {
        number: 3,
        name: 'Arborealis',
        category: 'Ancient Tree',
        type1: 'Grass',
        type2: 'Psychic',
        description: 'Its body has grown into a massive tree. The leaves glow with mystical energy at night.',
        image_url: 'https://via.placeholder.com/200?text=Arborealis',
        ability1: 'Overgrow',
        ability2: 'Magic Guard',
        hidden_ability: 'Regenerator',
        hp: 80,
        attack: 82,
        defense: 83,
        special_attack: 100,
        special_defense: 100,
        speed: 80,
        evolution_line: JSON.stringify([
          { number: 1, name: 'Leaflet', level: 1 },
          { number: 2, name: 'Frondleaf', level: 16 },
          { number: 3, name: 'Arborealis', level: 32 }
        ])
      },
      {
        number: 4,
        name: 'Embercub',
        category: 'Flame Cub',
        type1: 'Fire',
        description: 'A small, fiery cub that radiates heat. It has a flame sac in its belly that keeps it warm.',
        image_url: 'https://via.placeholder.com/200?text=Embercub',
        ability1: 'Blaze',
        ability2: 'Flash Fire',
        hidden_ability: 'Solar Power',
        hp: 39,
        attack: 52,
        defense: 43,
        special_attack: 60,
        special_defense: 50,
        speed: 65,
        evolution_line: JSON.stringify([
          { number: 4, name: 'Embercub', level: 1 },
          { number: 5, name: 'Blazepaw', level: 16 },
          { number: 6, name: 'Infernoar', level: 36 }
        ])
      }
    ];

    // Insert sample data
    for (const fakemon of fakemonData) {
      await db.asyncRun(`
        INSERT INTO fakemon (
          number, name, category, type1, type2, description,
          image_url, evolution_line, ability1, ability2, hidden_ability,
          hp, attack, defense, special_attack, special_defense, speed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        fakemon.number,
        fakemon.name,
        fakemon.category,
        fakemon.type1,
        fakemon.type2 || null,
        fakemon.description,
        fakemon.image_url,
        fakemon.evolution_line,
        fakemon.ability1 || null,
        fakemon.ability2 || null,
        fakemon.hidden_ability || null,
        fakemon.hp || 50,
        fakemon.attack || 50,
        fakemon.defense || 50,
        fakemon.special_attack || 50,
        fakemon.special_defense || 50,
        fakemon.speed || 50
      ]);
    }

    console.log('Initial Fakemon data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial Fakemon data:', error);
    throw error;
  }
}

/**
 * Get all fakemon with pagination, filtering, and search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllFakemon = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    const { page = 1, limit = 24, type, category, attribute, search } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let query = 'SELECT * FROM fakemon';
    const params = [];

    // Add search and filter conditions
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE $1 OR description LIKE $2)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      conditions.push('(type1 = $1 OR type2 = $2 OR type3 = $3 OR type4 = $4 OR type5 = $5)');
      params.push(type, type, type, type, type);
    }

    if (category) {
      conditions.push('category = $1');
      params.push(category);
    }

    if (attribute) {
      conditions.push('attribute = $1');
      params.push(attribute);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add order and pagination
    query += ' ORDER BY number ASC';
    query += buildLimitOffset(limit, offset, params);

    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM fakemon';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Execute queries
    const fakemon = await db.asyncAll(query, params);
    const countResult = await db.asyncGet(countQuery, params.slice(0, -2));

    const totalItems = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Process fakemon data to ensure consistent structure
    const processedFakemon = fakemon.map(mon => {
      // Ensure image_url is set
      if (!mon.image_url) {
        mon.image_url = `https://via.placeholder.com/200?text=${encodeURIComponent(mon.name)}`;
      }

      return mon;
    });

    res.json({
      fakemon: processedFakemon,
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching fakemon:', error);
    res.status(500).json({ error: 'Failed to fetch fakemon' });
  }
};

/**
 * Get fakemon by number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFakemonByNumber = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    const { number } = req.params;

    // Get fakemon by number
    const fakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    if (!fakemon) {
      return res.status(404).json({ error: 'Fakemon not found' });
    }

    // Get previous and next fakemon for navigation
    const prevFakemon = await db.asyncGet(
      'SELECT number, name FROM fakemon WHERE number < $1 ORDER BY number DESC LIMIT 1',
      [number]
    );
    const nextFakemon = await db.asyncGet(
      'SELECT number, name FROM fakemon WHERE number > $1 ORDER BY number ASC LIMIT 1',
      [number]
    );

    res.json({ fakemon, prevFakemon: prevFakemon || null, nextFakemon: nextFakemon || null });
  } catch (error) {
    console.error(`Error fetching fakemon ${req.params.number}:`, error);
    res.status(500).json({ error: 'Failed to fetch fakemon' });
  }
};

/**
 * Get evolution chain for a fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEvolutionChain = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    const { number } = req.params;

    // Get fakemon by number
    const fakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    if (!fakemon) {
      return res.status(404).json({ error: 'Fakemon not found' });
    }

    // Parse evolution line
    let evolutionChain = [];
    if (fakemon.evolution_line) {
      try {
        const evolutionData = JSON.parse(fakemon.evolution_line);

        // Fetch all fakemon in the evolution chain
        const evolutionNumbers = evolutionData.map(evo => evo.number);
        if (evolutionNumbers.length > 0) {
          const placeholders = evolutionNumbers.map((_, i) => `$${i + 1}`).join(',');
          const evolutionFakemon = await db.asyncAll(
            `SELECT * FROM fakemon WHERE number IN (${placeholders})`,
            evolutionNumbers
          );

          // Map evolution data with fakemon details, including evolution method info
          evolutionChain = evolutionData.map((evo, index) => {
            // Use parseInt to normalize numbers (handles zero-padded strings like "001" vs integer 1)
            const fakemonDetails = evolutionFakemon.find(f => parseInt(f.number, 10) === parseInt(evo.number, 10)) || {};

            // Backward compatibility: infer method from level if method not present
            let method = evo.method || null;
            let method_detail = evo.method_detail || null;
            if (!method && evo.level && evo.level > 1) {
              method = 'level';
              method_detail = `Level ${evo.level}`;
            }

            // Backward compatibility: infer evolves_from from array order if not present
            // Treat empty string as null so the fallback inference can work
            let evolves_from = (evo.evolves_from !== undefined && evo.evolves_from !== null && evo.evolves_from !== '') ? evo.evolves_from : null;
            if (evolves_from === null && index > 0) {
              evolves_from = evolutionData[index - 1].number;
            }

            return {
              ...evo,
              name: fakemonDetails.name || evo.name,
              image_url: fakemonDetails.image_url || null,
              types: [
                fakemonDetails.type1,
                fakemonDetails.type2,
                fakemonDetails.type3,
                fakemonDetails.type4,
                fakemonDetails.type5
              ].filter(Boolean),
              method,
              method_detail,
              evolves_from
            };
          });

          // Ensure the current fakemon is included in the evolution chain
          const currentInChain = evolutionChain.some(evo => String(evo.number) === String(number));
          if (!currentInChain) {
            // Add the current fakemon as a base entry at the start
            evolutionChain.unshift({
              number: fakemon.number,
              name: fakemon.name,
              image_url: fakemon.image_url || null,
              types: [fakemon.type1, fakemon.type2, fakemon.type3, fakemon.type4, fakemon.type5].filter(Boolean),
              method: null,
              method_detail: null,
              evolves_from: null
            });
            // Update any entries that have no evolves_from to point to the current fakemon
            // (only if they aren't roots themselves)
            evolutionChain.forEach((evo, idx) => {
              if (idx > 0 && evo.evolves_from === null && !evo.method) {
                // This is probably the first evolution from the current mon
              } else if (idx > 0 && evo.evolves_from === null) {
                evo.evolves_from = fakemon.number;
              }
            });
          }
        }
      } catch (e) {
        console.error('Error parsing evolution line:', e);
      }
    }

    res.json({ evolutionChain });
  } catch (error) {
    console.error(`Error fetching evolution chain for fakemon ${req.params.number}:`, error);
    res.status(500).json({ error: 'Failed to fetch evolution chain' });
  }
};

// Standard Pokemon-style types - always available regardless of database content
const STANDARD_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

/**
 * Get all fakemon types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTypes = async (req, res) => {
  try {
    // Return the standard list of types
    // This ensures all types are always available, even if not yet used in the database
    res.json({ types: STANDARD_TYPES });
  } catch (error) {
    console.error('Error fetching fakemon types:', error);
    res.status(500).json({ error: 'Failed to fetch fakemon types' });
  }
};

/**
 * Get random fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRandomFakemon = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    const { count = 3 } = req.query;

    // Get random fakemon
    const params = [];
    let query = 'SELECT * FROM fakemon';
    query += buildRandomLimit(count, params);

    const fakemon = await db.asyncAll(query, params);

    res.json({ fakemon });
  } catch (error) {
    console.error('Error fetching random fakemon:', error);
    res.status(500).json({ error: 'Failed to fetch random fakemon' });
  }
};

/**
 * Create a new fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createFakemon = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    const {
      number,
      name,
      category,
      classification,
      type1,
      type2,
      type3,
      type4,
      type5,
      attribute,
      description,
      image_url,
      evolution_line,
      ability1,
      ability2,
      hidden_ability,
      hp,
      attack,
      defense,
      special_attack,
      special_defense,
      speed
    } = req.body;

    // Validate required fields
    if (!number || !name || !category || !type1) {
      return res.status(400).json({
        success: false,
        message: 'Number, name, category, and at least one type are required'
      });
    }

    // Check if fakemon with this number already exists
    const existingFakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    if (existingFakemon) {
      return res.status(400).json({
        success: false,
        message: `Fakemon with number ${number} already exists`
      });
    }

    // Insert new fakemon
    const result = await db.asyncRun(`
      INSERT INTO fakemon (
        number, name, category, classification, type1, type2, type3, type4, type5,
        attribute, description, image_url, evolution_line,
        ability1, ability2, hidden_ability,
        hp, attack, defense, special_attack, special_defense, speed,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `, [
      number,
      name,
      category,
      classification || null,
      type1,
      type2 || null,
      type3 || null,
      type4 || null,
      type5 || null,
      attribute || null,
      description || null,
      image_url || null,
      evolution_line ? JSON.stringify(evolution_line) : null,
      ability1 || null,
      ability2 || null,
      hidden_ability || null,
      hp || 50,
      attack || 50,
      defense || 50,
      special_attack || 50,
      special_defense || 50,
      speed || 50,
      req.user?.id || null
    ]);

    // Get the created fakemon
    const createdFakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    res.status(201).json({
      success: true,
      message: 'Fakemon created successfully',
      fakemon: createdFakemon
    });
  } catch (error) {
    console.error('Error creating fakemon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fakemon'
    });
  }
};

/**
 * Update an existing fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateFakemon = async (req, res) => {
  try {
    const { number } = req.params;

    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    // Check if fakemon exists
    const existingFakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    if (!existingFakemon) {
      return res.status(404).json({
        success: false,
        message: `Fakemon with number ${number} not found`
      });
    }

    const {
      name,
      category,
      classification,
      type1,
      type2,
      type3,
      type4,
      type5,
      attribute,
      description,
      image_url,
      evolution_line,
      ability1,
      ability2,
      hidden_ability,
      hp,
      attack,
      defense,
      special_attack,
      special_defense,
      speed
    } = req.body;

    // Validate required fields
    if (!name || !category || !type1) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and at least one type are required'
      });
    }

    // Update fakemon
    await db.asyncRun(`
      UPDATE fakemon SET
        name = $1,
        category = $2,
        classification = $3,
        type1 = $4,
        type2 = $5,
        type3 = $6,
        type4 = $7,
        type5 = $8,
        attribute = $9,
        description = $10,
        image_url = $11,
        evolution_line = $12,
        ability1 = $13,
        ability2 = $14,
        hidden_ability = $15,
        hp = $16,
        attack = $17,
        defense = $18,
        special_attack = $19,
        special_defense = $20,
        speed = $21
      WHERE number = $22
    `, [
      name,
      category,
      classification || null,
      type1,
      type2 || null,
      type3 || null,
      type4 || null,
      type5 || null,
      attribute || null,
      description || null,
      image_url || null,
      evolution_line ? JSON.stringify(evolution_line) : existingFakemon.evolution_line,
      ability1 || null,
      ability2 || null,
      hidden_ability || null,
      hp || existingFakemon.hp || 50,
      attack || existingFakemon.attack || 50,
      defense || existingFakemon.defense || 50,
      special_attack || existingFakemon.special_attack || 50,
      special_defense || existingFakemon.special_defense || 50,
      speed || existingFakemon.speed || 50,
      number
    ]);

    // Get the updated fakemon
    const updatedFakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    res.json({
      success: true,
      message: 'Fakemon updated successfully',
      fakemon: updatedFakemon
    });
  } catch (error) {
    console.error(`Error updating fakemon ${req.params.number}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fakemon'
    });
  }
};

/**
 * Delete a fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFakemon = async (req, res) => {
  try {
    const { number } = req.params;

    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    // Check if fakemon exists
    const existingFakemon = await db.asyncGet(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );

    if (!existingFakemon) {
      return res.status(404).json({
        success: false,
        message: `Fakemon with number ${number} not found`
      });
    }

    // Delete fakemon
    await db.asyncRun(
      'DELETE FROM fakemon WHERE number = $1',
      [number]
    );

    res.json({
      success: true,
      message: 'Fakemon deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting fakemon ${req.params.number}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fakemon'
    });
  }
};

/**
 * Get the next available fakemon number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNextFakemonNumber = async (req, res) => {
  try {
    // Ensure the fakemon table exists
    await ensureFakemonTableExists();

    // Get the highest number
    const result = await db.asyncGet(
      'SELECT MAX(number) as max_number FROM fakemon'
    );

    const nextNumber = result && result.max_number
      ? parseInt(result.max_number) + 1
      : 1;

    res.json({
      success: true,
      nextNumber
    });
  } catch (error) {
    console.error('Error getting next fakemon number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next fakemon number'
    });
  }
};

/**
 * Upload image to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image'
    });
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'fakemon',
      use_filename: true
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading fakemon image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
};

/**
 * Get all unique categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllCategories = async (req, res) => {
  try {
    await ensureFakemonTableExists();

    const result = await db.asyncAll(
      'SELECT DISTINCT category FROM fakemon WHERE category IS NOT NULL ORDER BY category'
    );

    const categories = result.map(row => row.category);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching fakemon categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Get numbers used within a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNumbersByCategory = async (req, res) => {
  try {
    await ensureFakemonTableExists();

    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const result = await db.asyncAll(
      'SELECT number FROM fakemon WHERE category = $1 ORDER BY number',
      [category]
    );

    const numbers = result.map(row => row.number);

    res.json({
      success: true,
      numbers
    });
  } catch (error) {
    console.error('Error fetching numbers by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch numbers'
    });
  }
};

/**
 * Bulk create fakemon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const bulkCreateFakemon = async (req, res) => {
  try {
    await ensureFakemonTableExists();

    const { fakemonList } = req.body;

    if (!fakemonList || !Array.isArray(fakemonList) || fakemonList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a list of fakemon to create'
      });
    }

    const results = [];
    const errors = [];

    for (const fakemon of fakemonList) {
      const {
        number,
        name,
        category,
        classification,
        type1,
        type2,
        type3,
        type4,
        type5,
        attribute,
        image_url
      } = fakemon;

      // Validate required fields
      if (!number || !name || !category || !type1) {
        errors.push({
          fakemon,
          error: 'Number, name, category, and at least one type are required'
        });
        continue;
      }

      // Check if number already exists within this category
      const existingFakemon = await db.asyncGet(
        'SELECT * FROM fakemon WHERE number = $1 AND category = $2',
        [number, category]
      );

      if (existingFakemon) {
        errors.push({
          fakemon,
          error: `Number ${number} already exists in category "${category}"`
        });
        continue;
      }

      try {
        // Insert new fakemon with default stats
        await db.asyncRun(`
          INSERT INTO fakemon (
            number, name, category, classification, type1, type2, type3, type4, type5,
            attribute, image_url,
            hp, attack, defense, special_attack, special_defense, speed,
            created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        `, [
          number,
          name,
          category,
          classification || null,
          type1,
          type2 || null,
          type3 || null,
          type4 || null,
          type5 || null,
          attribute || null,
          image_url || null,
          50, // default hp
          50, // default attack
          50, // default defense
          50, // default special_attack
          50, // default special_defense
          50, // default speed
          req.user?.id || null
        ]);

        results.push({
          number,
          name,
          category,
          success: true
        });
      } catch (insertError) {
        console.error(`Error inserting fakemon ${name}:`, insertError);
        errors.push({
          fakemon,
          error: insertError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} fakemon successfully ${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      created: results,
      errors
    });
  } catch (error) {
    console.error('Error bulk creating fakemon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create fakemon'
    });
  }
};

/**
 * Search fakemon by name (for autocomplete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchFakemon = async (req, res) => {
  try {
    await ensureFakemonTableExists();

    const { query } = req.query;
    if (!query) {
      return res.json({ success: true, results: [] });
    }

    const results = await db.asyncAll(
      'SELECT number, name, image_url FROM fakemon WHERE name ILIKE $1 ORDER BY number LIMIT 20',
      [`%${query}%`]
    );

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching fakemon:', error);
    res.status(500).json({ success: false, message: 'Failed to search fakemon' });
  }
};

module.exports = {
  getAllFakemon,
  getFakemonByNumber,
  getEvolutionChain,
  getAllTypes,
  getAllCategories,
  getNumbersByCategory,
  getRandomFakemon,
  searchFakemon,
  createFakemon,
  updateFakemon,
  deleteFakemon,
  getNextFakemonNumber,
  uploadImage,
  bulkCreateFakemon
};
