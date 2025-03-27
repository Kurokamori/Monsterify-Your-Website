const db = require('../db');

class Item {
  /**
   * Get all items
   * @returns {Promise<Array>} Array of items
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM items ORDER BY name';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all items:', error);
      throw error;
    }
  }

  /**
   * Get an item by ID
   * @param {string} itemId - The item ID
   * @returns {Promise<Object>} Item object
   */
  static async getById(itemId) {
    try {
      const query = 'SELECT * FROM items WHERE name = $1';
      const result = await db.query(query, [itemId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get items by category
   * @param {string} category - The category
   * @returns {Promise<Array>} Array of items
   */
  static async getByCategory(category) {
    try {
      const query = 'SELECT * FROM items WHERE category = $1 ORDER BY name';
      console.log(`Executing query for category ${category}:`, query);
      const result = await db.query(query, [category]);
      console.log(`Found ${result.rows.length} items for category ${category}:`, result.rows);
      return result.rows;
    } catch (error) {
      console.error(`Error getting items by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Create a new item
   * @param {Object} itemData - The item data
   * @returns {Promise<Object>} Created item
   */
  static async create(itemData) {
    try {
      const {
        name,
        description,
        image_url,
        category,
        type,
        rarity,
        effect,
        base_price
      } = itemData;

      const query = `
        INSERT INTO items (
          name, description, image_url, category, type, rarity,
          effect, base_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        name,
        description,
        image_url,
        category,
        type,
        rarity,
        effect,
        base_price
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an item
   * @param {string} itemId - The item ID
   * @param {Object} itemData - The item data to update
   * @returns {Promise<Object>} Updated item
   */
  static async update(itemId, itemData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(itemData)) {
        if (value !== undefined && key !== 'name') {
          columns.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the item_id as the last parameter
      values.push(itemId);

      const query = `
        UPDATE items
        SET ${columns.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE name = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {string} itemId - The item ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(itemId) {
    try {
      const query = 'DELETE FROM items WHERE name = $1 RETURNING *';
      const result = await db.query(query, [itemId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize sample items for each category
   * @returns {Promise<void>}
   */
  static async initializeSampleItems() {
    try {
      // Check if we already have items
      const checkQuery = 'SELECT COUNT(*) as count FROM items';
      const checkResult = await db.query(checkQuery);
      const itemCount = parseInt(checkResult.rows[0].count);

      if (itemCount > 0) {
        console.log(`Database already has ${itemCount} items`);
        return;
      }

      console.log('Initializing sample items...');

      // Sample items by category
      const sampleItems = [
        // Berries
        { name: 'Oran Berry', effect: 'Restores 10 HP', rarity: '1', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 100 },
        { name: 'Sitrus Berry', effect: 'Restores 30 HP', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 200 },
        { name: 'Lum Berry', effect: 'Cures any status condition', rarity: '3', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 300 },
        { name: 'Cheri Berry', effect: 'Cures paralysis', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 150 },
        { name: 'Chesto Berry', effect: 'Cures sleep', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 150 },
        { name: 'Pecha Berry', effect: 'Cures poison', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 150 },
        { name: 'Rawst Berry', effect: 'Cures burn', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 150 },
        { name: 'Aspear Berry', effect: 'Cures freeze', rarity: '2', category: 'berries', icon: 'https://i.imgur.com/HViAPDq.jpeg', base_price: 150 },

        // Pastries
        { name: 'Sweet Cake', effect: 'Increases happiness', rarity: '2', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 200 },
        { name: 'Sour Cake', effect: 'Increases attack', rarity: '3', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 300 },
        { name: 'Bitter Cake', effect: 'Increases defense', rarity: '3', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 300 },
        { name: 'Spicy Cake', effect: 'Increases speed', rarity: '3', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 300 },
        { name: 'Dry Cake', effect: 'Increases special attack', rarity: '3', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 300 },
        { name: 'Sweet Bread', effect: 'Increases happiness slightly', rarity: '1', category: 'pastries', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 100 },

        // Evolution items
        { name: 'Fire Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },
        { name: 'Water Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },
        { name: 'Thunder Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },
        { name: 'Leaf Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },
        { name: 'Moon Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },
        { name: 'Sun Stone', effect: 'Evolves certain Pokémon', rarity: '4', category: 'evolution', icon: 'https://i.imgur.com/5cgcSGC.png', base_price: 1000 },

        // Balls
        { name: 'Poké Ball', effect: 'Catches Pokémon', rarity: '1', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 200 },
        { name: 'Great Ball', effect: 'Better chance to catch Pokémon', rarity: '2', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 600 },
        { name: 'Ultra Ball', effect: 'High chance to catch Pokémon', rarity: '3', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 1200 },
        { name: 'Master Ball', effect: 'Catches any Pokémon without fail', rarity: '5', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 10000 },
        { name: 'Luxury Ball', effect: 'Pokémon caught will be more friendly', rarity: '3', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 1000 },
        { name: 'Premier Ball', effect: 'Commemorative ball', rarity: '2', category: 'balls', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 200 },

        // Antiques
        { name: 'Ancient Coin', effect: 'Valuable collector\'s item', rarity: '4', category: 'antiques', icon: 'https://i.imgur.com/Yg6BWUm.jpeg', base_price: 5000 },
        { name: 'Old Painting', effect: 'Valuable collector\'s item', rarity: '5', category: 'antiques', icon: 'https://i.imgur.com/Yg6BWUm.jpeg', base_price: 10000 },
        { name: 'Fossil Fragment', effect: 'Part of an ancient Pokémon', rarity: '3', category: 'antiques', icon: 'https://i.imgur.com/Yg6BWUm.jpeg', base_price: 3000 },
        { name: 'Ancient Statue', effect: 'Mysterious old statue', rarity: '4', category: 'antiques', icon: 'https://i.imgur.com/Yg6BWUm.jpeg', base_price: 7000 },
        { name: 'Rare Vase', effect: 'Beautifully crafted vase', rarity: '4', category: 'antiques', icon: 'https://i.imgur.com/Yg6BWUm.jpeg', base_price: 6000 },

        // Eggs
        { name: 'Pokémon Egg', effect: 'Contains a baby Pokémon', rarity: '3', category: 'eggs', icon: 'https://i.imgur.com/IhtWUxD.png', base_price: 2000 },
        { name: 'Mystery Egg', effect: 'Contains a mysterious Pokémon', rarity: '4', category: 'eggs', icon: 'https://i.imgur.com/IhtWUxD.png', base_price: 5000 },
        { name: 'Rare Egg', effect: 'Contains a rare Pokémon', rarity: '5', category: 'eggs', icon: 'https://i.imgur.com/IhtWUxD.png', base_price: 10000 },
        { name: 'Egg Incubator', effect: 'Helps eggs hatch faster', rarity: '3', category: 'eggs', icon: 'https://i.imgur.com/IhtWUxD.png', base_price: 3000 },
        { name: 'Egg Warmer', effect: 'Keeps eggs warm', rarity: '2', category: 'eggs', icon: 'https://i.imgur.com/IhtWUxD.png', base_price: 1000 },

        // Black Market
        { name: 'Rare Candy', effect: 'Increases a Pokémon\'s level by 1', rarity: '4', category: 'black_market', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 4000 },
        { name: 'PP Max', effect: 'Maximizes PP of a move', rarity: '5', category: 'black_market', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 9000 },
        { name: 'Ability Capsule', effect: 'Changes a Pokémon\'s ability', rarity: '5', category: 'black_market', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 8000 },
        { name: 'Sacred Ash', effect: 'Revives all fainted Pokémon', rarity: '5', category: 'black_market', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 10000 },
        { name: 'Lucky Egg', effect: 'Holder earns more EXP', rarity: '4', category: 'black_market', icon: 'https://i.imgur.com/RmKySNO.png', base_price: 6000 }
      ];

      // Insert all items
      for (const item of sampleItems) {
        // First, check if the item already exists
        const checkItemQuery = 'SELECT COUNT(*) as count FROM items WHERE name = $1';
        const checkItemResult = await db.query(checkItemQuery, [item.name]);
        const itemExists = parseInt(checkItemResult.rows[0].count) > 0;

        if (!itemExists) {
          const insertQuery = `
            INSERT INTO items (name, effect, rarity, category, icon, base_price)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;

          await db.query(insertQuery, [
            item.name,
            item.effect,
            item.rarity,
            item.category,
            item.icon,
            item.base_price
          ]);
        }

        await db.query(insertQuery, [
          item.name,
          item.effect,
          item.rarity,
          item.category,
          item.icon,
          item.base_price
        ]);
      }

      console.log(`Initialized ${sampleItems.length} sample items`);
    } catch (error) {
      console.error('Error initializing sample items:', error);
      throw error;
    }
  }
}

module.exports = Item;