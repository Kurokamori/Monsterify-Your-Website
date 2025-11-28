import api from './api';

class BazarService {
  // Get available monsters and items
  async getAvailableMonsters() {
    try {
      const response = await api.get('/town/bazar/monsters');
      return response.data;
    } catch (error) {
      console.error('Error getting available monsters:', error);
      throw error;
    }
  }

  async getAvailableItems() {
    try {
      const response = await api.get('/town/bazar/items');
      return response.data;
    } catch (error) {
      console.error('Error getting available items:', error);
      throw error;
    }
  }

  // Forfeit monsters and items
  async forfeitMonster(monsterId, trainerId) {
    try {
      const response = await api.post('/town/bazar/forfeit/monster', {
        monsterId,
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error('Error forfeiting monster:', error);
      throw error;
    }
  }

  async forfeitMonsters(monsters) {
    try {
      const response = await api.post('/town/bazar/forfeit/monsters', {
        monsters
      });
      return response.data;
    } catch (error) {
      console.error('Error forfeiting monsters:', error);
      throw error;
    }
  }

  async forfeitItem(trainerId, category, itemName, quantity) {
    try {
      const response = await api.post('/town/bazar/forfeit/item', {
        trainerId,
        category,
        itemName,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error forfeiting item:', error);
      throw error;
    }
  }

  // Adopt monsters and collect items
  async adoptMonster(bazarMonsterId, trainerId, newName) {
    try {
      const response = await api.post('/town/bazar/adopt/monster', {
        bazarMonsterId,
        trainerId,
        newName
      });
      return response.data;
    } catch (error) {
      console.error('Error adopting monster:', error);
      throw error;
    }
  }

  async collectItem(bazarItemId, trainerId, quantity) {
    try {
      const response = await api.post('/town/bazar/collect/item', {
        bazarItemId,
        trainerId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error collecting item:', error);
      throw error;
    }
  }

  // Helper methods for UI
  async getUserTrainers() {
    try {
      const response = await api.get('/town/bazar/user/trainers');
      return response.data;
    } catch (error) {
      console.error('Error getting user trainers:', error);
      throw error;
    }
  }

  async getTrainerMonsters(trainerId) {
    try {
      const response = await api.get(`/town/bazar/trainer/${trainerId}/monsters`);
      return response.data;
    } catch (error) {
      console.error('Error getting trainer monsters:', error);
      throw error;
    }
  }

  async getTrainerInventory(trainerId) {
    try {
      const response = await api.get(`/town/bazar/trainer/${trainerId}/inventory`);
      return response.data;
    } catch (error) {
      console.error('Error getting trainer inventory:', error);
      throw error;
    }
  }
}

export default new BazarService();
