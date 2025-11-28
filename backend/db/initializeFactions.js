const db = require('../config/db');

/**
 * Initialize faction data and relationships
 */
async function initializeFactions() {
  try {
    console.log('Initializing faction data...');

    // Define the factions
    const factions = [
      {
        name: 'Nyakuza',
        description: 'A mysterious organization of cat-like beings who operate in the shadows, dealing in information and rare goods.',
        banner_image: 'nyakuza_banner.png',
        icon_image: 'nyakuza.png',
        color: '#8B4A9C'
      },
      {
        name: 'Digital Dawn',
        description: 'Tech-savvy innovators pushing the boundaries of digital monster research and virtual reality.',
        banner_image: 'digital_dawn_banner.png',
        icon_image: 'digital_dawn.png',
        color: '#00BFFF'
      },
      {
        name: 'Pokemon Ranchers',
        description: 'Traditional monster breeders and caretakers who focus on the natural bond between trainers and their companions.',
        banner_image: 'pokemon_ranchers_banner.png',
        icon_image: 'pokemon_ranchers.png',
        color: '#228B22'
      },
      {
        name: 'Koa\'s Laboratory',
        description: 'Scientific researchers dedicated to understanding the mysteries of monster evolution and genetics.',
        banner_image: 'koas_laboratory_banner.png',
        icon_image: 'koas_laboratory.png',
        color: '#FF6347'
      },
      {
        name: 'Project Obsidian',
        description: 'A secretive military organization focused on developing powerful battle strategies and advanced combat techniques.',
        banner_image: 'project_obsidian_banner.png',
        icon_image: 'project_obsidian.png',
        color: '#2F2F2F'
      },
      {
        name: 'Spirit Keepers',
        description: 'Mystical guardians who protect ancient spirits and maintain the balance between the physical and spiritual worlds.',
        banner_image: 'spirit_keepers_banner.png',
        icon_image: 'spirit_keepers.png',
        color: '#9370DB'
      },
      {
        name: 'Tribes',
        description: 'Ancient island dwellers who guard their customs and secrets fiercely, living in harmony with nature.',
        banner_image: 'tribes_banner.png',
        icon_image: 'tribes.png',
        color: '#8B4513'
      },
      {
        name: 'Twilight Order',
        description: 'Scholars of the arcane who seek to understand the deeper mysteries of the monster world through ancient knowledge.',
        banner_image: 'twilight_order_banner.png',
        icon_image: 'twilight_order.png',
        color: '#4B0082'
      },
      {
        name: 'League',
        description: 'Elite trainers driven by competition and glory, upholding order and prestige through rigorous battles.',
        banner_image: 'league_banner.png',
        icon_image: 'league.png',
        color: '#FFD700'
      },
      {
        name: 'Rangers',
        description: 'Protectors of the wilderness who work to preserve the natural habitats and ensure monster conservation.',
        banner_image: 'rangers_banner.png',
        icon_image: 'rangers.png',
        color: '#006400'
      },
      {
        name: 'Tamers',
        description: 'Specialists in monster behavior and training, focusing on developing unique bonds and communication techniques.',
        banner_image: 'tamers_banner.png',
        icon_image: 'tamers.png',
        color: '#FF8C00'
      }
    ];

    // Insert factions
    for (const faction of factions) {
      const existingFaction = await db.asyncGet('SELECT id FROM factions WHERE name = $1', [faction.name]);
      if (!existingFaction) {
        await db.asyncRun(
          `INSERT INTO factions (name, description, banner_image, icon_image, color) 
           VALUES ($1, $2, $3, $4, $5)`,
          [faction.name, faction.description, faction.banner_image, faction.icon_image, faction.color]
        );
        console.log(`Created faction: ${faction.name}`);
      }
    }

    // Define faction titles (positive titles)
    const factionTitles = [
      // Positive titles (standing requirements: 200, 400, 600, 800, 1000)
      { standing: 200, name: 'Initiate', description: 'A newcomer who has shown initial promise' },
      { standing: 400, name: 'Apprentice', description: 'A dedicated member learning the ways' },
      { standing: 600, name: 'Adept', description: 'A skilled practitioner of the faction\'s methods' },
      { standing: 800, name: 'Expert', description: 'A master of the faction\'s teachings' },
      { standing: 1000, name: 'Champion', description: 'The highest honor, reserved for the most devoted' },
      
      // Negative titles (automatically awarded)
      { standing: -200, name: 'Distrusted', description: 'Viewed with suspicion and wariness', isPositive: false },
      { standing: -400, name: 'Unwelcome', description: 'No longer welcome in faction territories', isPositive: false },
      { standing: -600, name: 'Adversary', description: 'Considered an active threat to faction interests', isPositive: false },
      { standing: -800, name: 'Enemy', description: 'Marked as a dangerous enemy of the faction', isPositive: false },
      { standing: -1000, name: 'Nemesis', description: 'The ultimate enemy, hunted by the faction', isPositive: false }
    ];

    // Insert titles for each faction
    const allFactions = await db.asyncAll('SELECT id, name FROM factions');
    for (const faction of allFactions) {
      for (let i = 0; i < factionTitles.length; i++) {
        const title = factionTitles[i];
        const existingTitle = await db.asyncGet(
          'SELECT id FROM faction_titles WHERE faction_id = $1 AND standing_requirement = $2',
          [faction.id, title.standing]
        );
        
        if (!existingTitle) {
          await db.asyncRun(
            `INSERT INTO faction_titles (faction_id, name, description, standing_requirement, is_positive, order_index)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [faction.id, title.name, title.description, title.standing, title.isPositive !== false ? 1 : 0, i]
          );
        }
      }
    }

    // Initialize faction relationships
    await initializeFactionRelationships();

    // Initialize sample faction store items
    await initializeFactionStores();

    console.log('Faction data initialized successfully');
  } catch (error) {
    console.error('Error initializing faction data:', error);
    throw error;
  }
}

/**
 * Initialize faction relationships and standing modifiers
 */
async function initializeFactionRelationships() {
  try {
    console.log('Initializing faction relationships...');

    // Get all factions
    const factions = await db.asyncAll('SELECT id, name FROM factions');
    const factionMap = {};
    factions.forEach(f => factionMap[f.name] = f.id);

    // Define faction relationships
    // Format: [faction1, faction2, relationship_type, standing_modifier]
    // standing_modifier: how much standing faction2 gains when faction1 gains 10 standing
    const relationships = [
      // League relationships
      ['League', 'Rangers', 'allied', 0.5],
      ['League', 'Tamers', 'allied', 0.3],
      ['League', 'Pokemon Ranchers', 'neutral', 0.1],
      ['League', 'Project Obsidian', 'rival', -0.3],
      ['League', 'Tribes', 'neutral', 0.0],
      ['League', 'Twilight Order', 'neutral', 0.0],
      ['League', 'Spirit Keepers', 'neutral', 0.1],
      ['League', 'Koa\'s Laboratory', 'allied', 0.2],
      ['League', 'Digital Dawn', 'neutral', 0.1],
      ['League', 'Nyakuza', 'rival', -0.2],

      // Rangers relationships
      ['Rangers', 'Pokemon Ranchers', 'allied', 0.6],
      ['Rangers', 'Spirit Keepers', 'allied', 0.4],
      ['Rangers', 'Tribes', 'allied', 0.3],
      ['Rangers', 'Tamers', 'allied', 0.4],
      ['Rangers', 'Project Obsidian', 'enemy', -0.6],
      ['Rangers', 'Digital Dawn', 'rival', -0.2],
      ['Rangers', 'Koa\'s Laboratory', 'neutral', 0.0],
      ['Rangers', 'Twilight Order', 'neutral', 0.1],
      ['Rangers', 'Nyakuza', 'rival', -0.1],

      // Project Obsidian relationships
      ['Project Obsidian', 'Digital Dawn', 'allied', 0.4],
      ['Project Obsidian', 'Koa\'s Laboratory', 'allied', 0.3],
      ['Project Obsidian', 'Nyakuza', 'neutral', 0.2],
      ['Project Obsidian', 'Twilight Order', 'rival', -0.2],
      ['Project Obsidian', 'Spirit Keepers', 'enemy', -0.5],
      ['Project Obsidian', 'Tribes', 'enemy', -0.4],
      ['Project Obsidian', 'Pokemon Ranchers', 'rival', -0.3],
      ['Project Obsidian', 'Tamers', 'neutral', 0.0],

      // Spirit Keepers relationships
      ['Spirit Keepers', 'Twilight Order', 'allied', 0.5],
      ['Spirit Keepers', 'Tribes', 'allied', 0.6],
      ['Spirit Keepers', 'Pokemon Ranchers', 'allied', 0.3],
      ['Spirit Keepers', 'Tamers', 'allied', 0.2],
      ['Spirit Keepers', 'Digital Dawn', 'rival', -0.4],
      ['Spirit Keepers', 'Koa\'s Laboratory', 'neutral', 0.0],
      ['Spirit Keepers', 'Nyakuza', 'neutral', 0.1],

      // Digital Dawn relationships
      ['Digital Dawn', 'Koa\'s Laboratory', 'allied', 0.5],
      ['Digital Dawn', 'Nyakuza', 'allied', 0.3],
      ['Digital Dawn', 'Tamers', 'neutral', 0.1],
      ['Digital Dawn', 'Pokemon Ranchers', 'rival', -0.2],
      ['Digital Dawn', 'Twilight Order', 'neutral', 0.0],
      ['Digital Dawn', 'Tribes', 'rival', -0.3],

      // Tribes relationships
      ['Tribes', 'Pokemon Ranchers', 'allied', 0.4],
      ['Tribes', 'Tamers', 'allied', 0.3],
      ['Tribes', 'Twilight Order', 'neutral', 0.2],
      ['Tribes', 'Koa\'s Laboratory', 'rival', -0.3],
      ['Tribes', 'Nyakuza', 'rival', -0.2],

      // Twilight Order relationships
      ['Twilight Order', 'Koa\'s Laboratory', 'allied', 0.3],
      ['Twilight Order', 'Nyakuza', 'neutral', 0.2],
      ['Twilight Order', 'Pokemon Ranchers', 'neutral', 0.1],
      ['Twilight Order', 'Tamers', 'neutral', 0.1],

      // Pokemon Ranchers relationships
      ['Pokemon Ranchers', 'Tamers', 'allied', 0.7],
      ['Pokemon Ranchers', 'Koa\'s Laboratory', 'allied', 0.2],
      ['Pokemon Ranchers', 'Nyakuza', 'neutral', 0.0],

      // Tamers relationships
      ['Tamers', 'Koa\'s Laboratory', 'allied', 0.3],
      ['Tamers', 'Nyakuza', 'neutral', 0.1],

      // Koa's Laboratory relationships
      ['Koa\'s Laboratory', 'Nyakuza', 'neutral', 0.1],

      // Nyakuza (mostly neutral/self-interested)
      // Already covered in other relationships
    ];

    // Insert relationships (bidirectional)
    for (const [faction1Name, faction2Name, relationshipType, modifier] of relationships) {
      const faction1Id = factionMap[faction1Name];
      const faction2Id = factionMap[faction2Name];

      if (!faction1Id || !faction2Id) {
        console.warn(`Faction not found: ${faction1Name} or ${faction2Name}`);
        continue;
      }

      // Insert relationship from faction1 to faction2
      const existing1 = await db.asyncGet(
        'SELECT id FROM faction_relationships WHERE faction_id = $1 AND related_faction_id = $2',
        [faction1Id, faction2Id]
      );

      if (!existing1) {
        await db.asyncRun(
          `INSERT INTO faction_relationships (faction_id, related_faction_id, relationship_type, standing_modifier)
           VALUES ($1, $2, $3, $4)`,
          [faction1Id, faction2Id, relationshipType, modifier]
        );
      }

      // Insert reverse relationship (faction2 to faction1) with same modifier
      const existing2 = await db.asyncGet(
        'SELECT id FROM faction_relationships WHERE faction_id = $1 AND related_faction_id = $2',
        [faction2Id, faction1Id]
      );

      if (!existing2) {
        await db.asyncRun(
          `INSERT INTO faction_relationships (faction_id, related_faction_id, relationship_type, standing_modifier)
           VALUES ($1, $2, $3, $4)`,
          [faction2Id, faction1Id, relationshipType, modifier]
        );
      }
    }

    console.log('Faction relationships initialized successfully');
  } catch (error) {
    console.error('Error initializing faction relationships:', error);
    throw error;
  }
}

/**
 * Initialize sample faction store items
 */
async function initializeFactionStores() {
  try {
    console.log('Initializing faction store items...');

    const factions = await db.asyncAll('SELECT id, name FROM factions');
    const factionMap = {};
    factions.forEach(f => factionMap[f.name] = f.id);

    // Sample store items for each faction
    const storeItems = [
      // League store items
      { faction: 'League', name: 'League Badge', description: 'A prestigious badge showing League membership', type: 'keyitems', price: 1000, standing: 200 },
      { faction: 'League', name: 'Champion\'s Potion', description: 'A powerful healing potion used by champions', type: 'items', price: 500, standing: 400 },
      { faction: 'League', name: 'Elite Ball', description: 'A premium capture device favored by elite trainers', type: 'balls', price: 800, standing: 600 },

      // Rangers store items
      { faction: 'Rangers', name: 'Ranger\'s Compass', description: 'A reliable compass for wilderness navigation', type: 'keyitems', price: 600, standing: 200 },
      { faction: 'Rangers', name: 'Nature\'s Blessing', description: 'A berry that enhances monster-trainer bonds', type: 'berries', price: 300, standing: 0 },
      { faction: 'Rangers', name: 'Conservation Kit', description: 'Tools for protecting monster habitats', type: 'items', price: 1200, standing: 800 },

      // Project Obsidian store items
      { faction: 'Project Obsidian', name: 'Tactical Enhancer', description: 'Military-grade monster enhancement device', type: 'items', price: 1500, standing: 600 },
      { faction: 'Project Obsidian', name: 'Combat Ration', description: 'High-energy food for battle preparation', type: 'items', price: 200, standing: 0 },
      { faction: 'Project Obsidian', name: 'Obsidian Seal', description: 'A dark seal with mysterious properties', type: 'seals', price: 2000, standing: 1000 },

      // Spirit Keepers store items
      { faction: 'Spirit Keepers', name: 'Spirit Ward', description: 'A protective charm against dark forces', type: 'helditems', price: 800, standing: 400 },
      { faction: 'Spirit Keepers', name: 'Ethereal Essence', description: 'A mystical substance that enhances spiritual connection', type: 'items', price: 1000, standing: 600 },
      { faction: 'Spirit Keepers', name: 'Sacred Incense', description: 'Incense that calms aggressive monsters', type: 'items', price: 400, standing: 200 },

      // Digital Dawn store items
      { faction: 'Digital Dawn', name: 'Data Crystal', description: 'A crystal containing compressed monster data', type: 'items', price: 700, standing: 200 },
      { faction: 'Digital Dawn', name: 'Virtual Enhancer', description: 'A device that boosts digital monster abilities', type: 'helditems', price: 1200, standing: 600 },
      { faction: 'Digital Dawn', name: 'Code Fragment', description: 'A piece of ancient digital code', type: 'keyitems', price: 1500, standing: 800 },

      // Tribes store items
      { faction: 'Tribes', name: 'Tribal Mask', description: 'A traditional mask with protective properties', type: 'helditems', price: 600, standing: 400 },
      { faction: 'Tribes', name: 'Ancient Herb', description: 'A rare herb with healing properties', type: 'berries', price: 350, standing: 200 },
      { faction: 'Tribes', name: 'Ceremonial Stone', description: 'A sacred stone used in tribal rituals', type: 'keyitems', price: 1000, standing: 600 },

      // Twilight Order store items
      { faction: 'Twilight Order', name: 'Arcane Tome', description: 'A book containing ancient monster knowledge', type: 'keyitems', price: 1200, standing: 600 },
      { faction: 'Twilight Order', name: 'Mystic Orb', description: 'An orb that enhances magical abilities', type: 'helditems', price: 900, standing: 400 },
      { faction: 'Twilight Order', name: 'Shadow Essence', description: 'A dark essence with mysterious properties', type: 'items', price: 800, standing: 800 },

      // Pokemon Ranchers store items
      { faction: 'Pokemon Ranchers', name: 'Ranch Bell', description: 'A bell that calms wild monsters', type: 'helditems', price: 400, standing: 200 },
      { faction: 'Pokemon Ranchers', name: 'Premium Feed', description: 'High-quality food that monsters love', type: 'berries', price: 250, standing: 0 },
      { faction: 'Pokemon Ranchers', name: 'Breeding Guide', description: 'A comprehensive guide to monster breeding', type: 'keyitems', price: 800, standing: 400 },

      // Tamers store items
      { faction: 'Tamers', name: 'Tamer\'s Whistle', description: 'A special whistle for monster communication', type: 'helditems', price: 500, standing: 200 },
      { faction: 'Tamers', name: 'Bond Enhancer', description: 'An item that strengthens trainer-monster bonds', type: 'items', price: 700, standing: 400 },
      { faction: 'Tamers', name: 'Master\'s Glove', description: 'A glove worn by master tamers', type: 'helditems', price: 1000, standing: 800 },

      // Koa's Laboratory store items
      { faction: 'Koa\'s Laboratory', name: 'Research Sample', description: 'A sample for scientific research', type: 'items', price: 600, standing: 200 },
      { faction: 'Koa\'s Laboratory', name: 'Evolution Catalyst', description: 'A chemical that aids in monster evolution', type: 'evolution', price: 1500, standing: 600 },
      { faction: 'Koa\'s Laboratory', name: 'Lab Equipment', description: 'Portable scientific equipment', type: 'keyitems', price: 1200, standing: 800 },

      // Nyakuza store items
      { faction: 'Nyakuza', name: 'Shadow Cloak', description: 'A cloak that helps with stealth operations', type: 'helditems', price: 800, standing: 400 },
      { faction: 'Nyakuza', name: 'Information Scroll', description: 'A scroll containing valuable information', type: 'keyitems', price: 1000, standing: 600 },
      { faction: 'Nyakuza', name: 'Thief\'s Tool', description: 'A specialized tool for acquiring rare items', type: 'items', price: 1200, standing: 800 }
    ];

    // Insert store items
    for (const item of storeItems) {
      const factionId = factionMap[item.faction];
      if (!factionId) {
        console.warn(`Faction not found: ${item.faction}`);
        continue;
      }

      const existing = await db.asyncGet(
        'SELECT id FROM faction_stores WHERE faction_id = $1 AND item_name = $2',
        [factionId, item.name]
      );

      if (!existing) {
        await db.asyncRun(
          `INSERT INTO faction_stores (faction_id, item_name, item_description, item_type, price, standing_requirement)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [factionId, item.name, item.description, item.type, item.price, item.standing]
        );
      }
    }

    console.log('Faction store items initialized successfully');
  } catch (error) {
    console.error('Error initializing faction store items:', error);
    throw error;
  }
}

module.exports = {
  initializeFactions,
  initializeFactionRelationships,
  initializeFactionStores
};
