const db = require('../config/db');
const Item = require('./Item');

/**
 * ItemRoller model for randomly selecting items
 */
class ItemRoller {
  /**
   * Constructor
   * @param {Object} options Configuration options
   * @param {string|Array} options.category Item category or categories
   * @param {string} options.rarity Item rarity
   * @param {number} options.quantity Number of items to roll
   */
  constructor(options = {}) {
    this.category = options.category || 'ALL';
    this.rarity = options.rarity || null;
    this.quantity = options.quantity || 1;
  }

  /**
   * Roll items based on configuration
   * @returns {Promise<Array>} Array of rolled items
   */
  async rollItems() {
    try {
      // Get items based on category and rarity
      let items = [];

      // Handle multiple categories
      if (Array.isArray(this.category)) {
        for (const category of this.category) {
          const categoryItems = await this._getItemsByCategory(category);
          items = [...items, ...categoryItems];
        }
      } else {
        items = await this._getItemsByCategory(this.category);
      }

      // Filter by rarity if specified
      if (this.rarity) {
        items = items.filter(item => item.rarity === this.rarity);
      }

      if (items.length === 0) {
        throw new Error('No items found matching the criteria');
      }

      // Shuffle items
      const shuffledItems = [...items].sort(() => 0.5 - Math.random());

      // Select items
      const selectedItems = [];
      const selectedItemIds = new Set();

      // Try to select unique items
      let attempts = 0;
      while (selectedItems.length < this.quantity && attempts < 100) {
        const randomIndex = Math.floor(Math.random() * shuffledItems.length);
        const item = shuffledItems[randomIndex];

        if (!selectedItemIds.has(item.id)) {
          selectedItems.push(item);
          selectedItemIds.add(item.id);
        }

        attempts++;

        // If we've tried too many times or we've selected all available items, break
        if (attempts >= 100 || selectedItemIds.size >= shuffledItems.length) {
          break;
        }
      }

      // If we still need more items, allow duplicates
      while (selectedItems.length < this.quantity) {
        const randomIndex = Math.floor(Math.random() * shuffledItems.length);
        selectedItems.push(shuffledItems[randomIndex]);
      }

      return selectedItems;
    } catch (error) {
      console.error('Error rolling items:', error);
      throw error;
    }
  }

  /**
   * Get items by category
   * @param {string} category Item category
   * @returns {Promise<Array>} Array of items
   * @private
   */
  async _getItemsByCategory(category) {
    try {
      if (category === 'ALL') {
        const allItems = await Item.getAll();
        return allItems.data || [];
      } else {
        return await Item.getByCategory(category);
      }
    } catch (error) {
      console.error(`Error getting items for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Roll a single item
   * @param {Object} options Configuration options
   * @returns {Promise<Object>} Rolled item
   */
  static async rollOne(options = {}) {
    const roller = new ItemRoller({ ...options, quantity: 1 });
    const items = await roller.rollItems();
    return items[0];
  }

  /**
   * Roll multiple items
   * @param {Object} options Configuration options
   * @returns {Promise<Array>} Array of rolled items
   */
  static async rollMany(options = {}) {
    const roller = new ItemRoller(options);
    return await roller.rollItems();
  }

  /**
   * Add rolled items to trainer inventory
   * @param {number} trainerId Trainer ID
   * @param {Object} options Configuration options
   * @returns {Promise<Object>} Result with added items
   */
  static async rollAndAddToInventory(trainerId, options = {}) {
    try {
      // Roll items
      const roller = new ItemRoller(options);
      const items = await roller.rollItems();

      // Add items to trainer inventory
      const Trainer = require('./Trainer');
      const addedItems = [];

      for (const item of items) {
        // Map item category to inventory field
        const categoryToInventory = {
          'berries': 'berries',
          'pastries': 'pastries',
          'evolution': 'evolution',
          'balls': 'balls',
          'antiques': 'antiques',
          'helditems': 'helditems',
          'eggs': 'eggs',
          'seals': 'seals',
          'keyitems': 'keyitems'
        };

        // Make sure item.category is a string and convert to lowercase
        const category = item.category ? item.category.toString().toLowerCase() : '';
        const inventoryField = categoryToInventory[category] || 'items';

        // Determine quantity based on rarity
        let quantity = 1;
        if (item.rarity === 'common') {
          quantity = Math.floor(Math.random() * 3) + 1; // 1-3
        } else if (item.rarity === 'uncommon') {
          quantity = Math.floor(Math.random() * 2) + 1; // 1-2
        }

        // Update trainer inventory
        await Trainer.updateInventoryItem(trainerId, inventoryField, item.name, quantity);

        addedItems.push({
          ...item,
          quantity
        });
      }

      return {
        success: true,
        items: addedItems
      };
    } catch (error) {
      console.error('Error rolling and adding items to inventory:', error);
      throw error;
    }
  }
}

module.exports = ItemRoller;
