const apiService = require('./apiService');

class MarketService {
  // Items
  async getAllItems() {
    return await apiService.get('/items');
  }

  async getItemById(itemId) {
    return await apiService.get(`/items/${itemId}`);
  }

  async createItem(itemData) {
    return await apiService.post('/items', itemData);
  }

  async updateItem(itemId, itemData) {
    return await apiService.put(`/items/${itemId}`, itemData);
  }

  async deleteItem(itemId) {
    return await apiService.delete(`/items/${itemId}`);
  }

  // Shop-specific methods (these may need to be implemented in the backend)
  async getShopItems(shopType) {
    try {
      // Try to get shop-specific items if endpoint exists
      return await apiService.get(`/shops/${shopType}/items`);
    } catch (error) {
      // Fallback to filtering all items by shop type
      const allItems = await this.getAllItems();
      if (allItems.success && allItems.data) {
        const filteredItems = allItems.data.filter(item => 
          item.shop_type === shopType || item.category === shopType
        );
        return {
          success: true,
          data: filteredItems,
        };
      }
      throw error;
    }
  }

  async purchaseItem(itemId, quantity = 1, trainerId) {
    return await apiService.post(`/items/${itemId}/purchase`, {
      quantity,
      trainerId,
    });
  }

  async useItem(itemId, targetId, trainerId) {
    return await apiService.post(`/items/${itemId}/use`, {
      targetId,
      trainerId,
    });
  }

  // Daily deals (may need backend implementation)
  async getDailyDeals() {
    try {
      return await apiService.get('/shops/daily-deals');
    } catch (error) {
      // Return mock data if endpoint doesn't exist
      return {
        success: true,
        data: [],
        message: 'Daily deals feature coming soon!',
      };
    }
  }

  // Helper methods for formatting shop data
  formatShopInfo(shopType) {
    const shopData = {
      apothecary: {
        name: '🧪 Apothecary',
        description: 'Berries and potions that modify monster traits.',
        emoji: '🧪',
        items: ['Berries', 'Potions', 'Trait Modifiers'],
      },
      bakery: {
        name: '🥖 Bakery',
        description: 'Delicious pastries that set specific monster traits.',
        emoji: '🥖',
        items: ['Pastries', 'Cakes', 'Trait Setters'],
      },
      witch: {
        name: '🔮 Witch\'s Hut',
        description: 'Magical evolution items and mystical artifacts.',
        emoji: '🔮',
        items: ['Evolution Items', 'Magic Stones', 'Mystical Artifacts'],
      },
      megamart: {
        name: '🏪 Mega Mart',
        description: 'Pokéballs, held items, and general supplies.',
        emoji: '🏪',
        items: ['Pokéballs', 'Held Items', 'General Supplies'],
      },
      antique: {
        name: '🏺 Antique Store',
        description: 'Rare and unique event items with special properties.',
        emoji: '🏺',
        items: ['Antiques', 'Event Items', 'Collectibles'],
      },
      nursery: {
        name: '🥚 Nursery',
        description: 'Eggs for hatching and breeding supplies.',
        emoji: '🥚',
        items: ['Eggs', 'Breeding Items', 'Incubators'],
      },
      pirates: {
        name: '🏴‍☠️ Pirate\'s Dock',
        description: 'Maritime items and pirate treasures.',
        emoji: '🏴‍☠️',
        items: ['Pirate Items', 'Maritime Gear', 'Treasures'],
      },
    };

    return shopData[shopType] || {
      name: '❓ Unknown Shop',
      description: 'This shop is not yet available.',
      emoji: '❓',
      items: [],
    };
  }

  formatItemForEmbed(item) {
    return {
      name: item.name,
      description: item.description || 'No description available',
      price: item.price || 0,
      category: item.category || 'Miscellaneous',
      rarity: item.rarity || 'Common',
      effect: item.effect || 'No special effect',
      imageUrl: item.img_link,
    };
  }

  formatItemsListForEmbed(items, page = 1, itemsPerPage = 10) {
    if (!items || items.length === 0) {
      return {
        content: 'No items available in this shop.',
        totalPages: 0,
        currentPage: 1,
      };
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const content = pageItems.map((item, index) => {
      const itemNumber = startIndex + index + 1;
      const price = item.price ? `💰 ${item.price}` : 'Free';
      const rarity = item.rarity ? `[${item.rarity}]` : '';
      
      return `${itemNumber}. **${item.name}** ${rarity}\n   ${price} - ${item.description || 'No description'}`;
    }).join('\n\n');

    return {
      content,
      totalPages,
      currentPage: page,
      totalItems: items.length,
    };
  }

  // Helper method to get item usage instructions
  getItemUsageInstructions(item) {
    const usageMap = {
      berry: 'Use on a monster to modify its traits (species/types)',
      pastry: 'Use on a monster to set specific traits',
      evolution: 'Use on a compatible monster to trigger evolution',
      held: 'Equip to a monster as a held item',
      pokeball: 'Use to catch wild monsters',
      potion: 'Use on a monster to restore HP or cure status',
    };

    const category = item.category?.toLowerCase() || '';
    for (const [key, instruction] of Object.entries(usageMap)) {
      if (category.includes(key)) {
        return instruction;
      }
    }

    return 'Use this item according to its description';
  }
}

module.exports = new MarketService();
