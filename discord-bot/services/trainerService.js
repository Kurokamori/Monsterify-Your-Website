const apiService = require('./apiService');

class TrainerService {
  // Get all trainers with pagination
  async getAllTrainers(page = 1, limit = 12) {
    return await apiService.get('/trainers', { page, limit });
  }

  // Get trainers by user ID
  async getTrainersByUserId(userId) {
    return await apiService.get(`/trainers/user/${userId}`);
  }

  // Get trainer by ID
  async getTrainerById(trainerId) {
    return await apiService.get(`/trainers/${trainerId}`);
  }

  // Create new trainer
  async createTrainer(trainerData) {
    return await apiService.post('/trainers', trainerData);
  }

  // Update trainer
  async updateTrainer(trainerId, trainerData) {
    return await apiService.put(`/trainers/${trainerId}`, trainerData);
  }

  // Delete trainer
  async deleteTrainer(trainerId) {
    return await apiService.delete(`/trainers/${trainerId}`);
  }

  // Get trainer inventory
  async getTrainerInventory(trainerId) {
    return await apiService.get(`/trainers/${trainerId}/inventory`);
  }

  // Update trainer inventory item
  async updateTrainerInventory(trainerId, inventoryData) {
    return await apiService.put(`/trainers/${trainerId}/inventory`, inventoryData);
  }

  // Get trainer's monsters
  async getTrainerMonsters(trainerId) {
    return await apiService.get(`/trainers/${trainerId}/monsters`);
  }

  // Update monster box positions
  async updateMonsterPositions(trainerId, positionData) {
    return await apiService.put(`/trainers/${trainerId}/monsters/positions`, positionData);
  }

  // Get trainer statistics (custom endpoint - may need to be implemented)
  async getTrainerStats(trainerId) {
    try {
      return await apiService.get(`/trainers/${trainerId}/stats`);
    } catch (error) {
      // If stats endpoint doesn't exist, return basic info
      const trainer = await this.getTrainerById(trainerId);
      const monsters = await this.getTrainerMonsters(trainerId);
      const inventory = await this.getTrainerInventory(trainerId);
      
      return {
        success: true,
        data: {
          trainer,
          monsterCount: monsters.data?.length || 0,
          inventoryCount: inventory.data?.length || 0,
        },
      };
    }
  }

  // Helper method to format trainer data for Discord embeds
  formatTrainerForEmbed(trainer) {
    return {
      name: trainer.name,
      pronouns: trainer.pronouns || 'Not specified',
      age: trainer.age || 'Not specified',
      location: trainer.location || 'Unknown',
      bio: trainer.bio || 'No bio available',
      monsterCount: trainer.monster_count || 0,
      imageUrl: trainer.img_link,
      createdAt: trainer.created_at,
    };
  }

  // Helper method to format inventory for Discord
  formatInventoryForEmbed(inventory) {
    if (!inventory || inventory.length === 0) {
      return 'No items in inventory';
    }

    return inventory.map(item => {
      const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';
      return `• ${item.name}${quantity}`;
    }).join('\n');
  }
}

module.exports = new TrainerService();
