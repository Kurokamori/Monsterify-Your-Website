const apiService = require('./apiService');

class TownService {
  // Adoption Center
  async getAdoptionMonths() {
    return await apiService.get('/adoption/months');
  }

  async getMonthlyAdopts(year, month) {
    return await apiService.get(`/adoption/${year}/${month}`);
  }

  async claimAdopt(adoptId, trainerId) {
    return await apiService.post('/adoption/claim', { adoptId, trainerId });
  }

  async generateMonthlyAdopts() {
    return await apiService.post('/adoption/generate');
  }

  async addDaypass(trainerId) {
    return await apiService.post(`/adoption/add-daypass/${trainerId}`);
  }

  // Nursery
  async getTrainerEggs(trainerId) {
    return await apiService.get(`/nursery/eggs/${trainerId}`);
  }

  async getEggItems(trainerId) {
    return await apiService.get(`/nursery/egg-items/${trainerId}`);
  }

  async startHatching(hatchData) {
    return await apiService.post('/nursery/hatch/start', hatchData);
  }

  async startNurturing(nurtureData) {
    return await apiService.post('/nursery/nurture/start', nurtureData);
  }

  async getHatchSession(sessionId) {
    return await apiService.get(`/nursery/hatch/${sessionId}`);
  }

  async selectHatchedMonster(sessionId, selectionData) {
    return await apiService.post(`/nursery/hatch/${sessionId}/select`, selectionData);
  }

  // Breeding (Farm)
  async getBreedingPairs(trainerId) {
    return await apiService.get(`/town/farm/breed/pairs/${trainerId}`);
  }

  async startBreeding(breedData) {
    return await apiService.post('/town/farm/breed/start', breedData);
  }

  async getBreedingStatus(trainerId) {
    return await apiService.get(`/town/farm/breed/status/${trainerId}`);
  }

  // Trading
  async getTradeHistory(trainerId) {
    return await apiService.get(`/town/trade/history/${trainerId}`);
  }

  async createTrade(tradeData) {
    return await apiService.post('/town/trade/create', tradeData);
  }

  // Automated Trading
  async executeAutomatedTrade(tradeData) {
    return await apiService.post('/town/automated-trade/execute', tradeData);
  }

  async getAutomatedTradeHistory(trainerId) {
    return await apiService.get(`/town/automated-trade/history/${trainerId}`);
  }

  async getAvailableTrainers() {
    return await apiService.get('/town/automated-trade/trainers');
  }

  async getTrainerMonstersForTrade(trainerId) {
    return await apiService.get(`/town/automated-trade/trainers/${trainerId}/monsters`);
  }

  async getTrainerInventoryForTrade(trainerId) {
    return await apiService.get(`/town/automated-trade/trainers/${trainerId}/inventory`);
  }

  // Mega Mart
  async getMonsterAbilities(monsterId) {
    return await apiService.get(`/town/mega-mart/monster/${monsterId}/abilities`);
  }

  async useAbilityCapsule(monsterId, newAbility) {
    return await apiService.post('/town/mega-mart/use-ability-capsule', {
      monsterId,
      newAbility,
    });
  }

  async useScrollOfSecrets(monsterId) {
    return await apiService.post('/town/mega-mart/use-scroll-of-secrets', {
      monsterId,
    });
  }

  async getAllAbilities() {
    return await apiService.get('/town/mega-mart/abilities');
  }

  // Garden
  async getGardenPoints(trainerId) {
    return await apiService.get(`/garden/points/${trainerId}`);
  }

  async addGardenPoints(pointsData) {
    return await apiService.post('/garden/points', pointsData);
  }

  async getGardenActivities() {
    return await apiService.get('/garden/activities');
  }

  // Helper methods for formatting town data
  formatLocationInfo(location) {
    const locationData = {
      home: {
        name: '🏠 Home',
        description: 'Your cozy home base where you can rest and plan your adventures.',
        activities: ['Rest', 'Plan', 'Organize'],
      },
      adoption: {
        name: '🏥 Adoption Center',
        description: 'Adopt new monsters and give them loving homes.',
        activities: ['Adopt Monthly Monsters', 'View Available Adopts'],
      },
      garden: {
        name: '🌱 Garden',
        description: 'Tend to your garden and grow various plants and berries.',
        activities: ['Tend Garden', 'Harvest', 'Plant Seeds'],
      },
      farm: {
        name: '🚜 Farm',
        description: 'Breed monsters and work on farm activities.',
        activities: ['Breed Monsters', 'Farm Work', 'Care for Animals'],
      },
      game: {
        name: '🎮 Game Corner',
        description: 'Play games and participate in fun activities.',
        activities: ['Pomodoro Sessions', 'Mini Games', 'Challenges'],
      },
      antique: {
        name: '🏺 Antique Shop',
        description: 'Discover rare and valuable antiques.',
        activities: ['Appraise Items', 'Browse Antiques', 'Auctions'],
      },
      pirates: {
        name: '🏴‍☠️ Pirate\'s Dock',
        description: 'Join pirate adventures and maritime activities.',
        activities: ['Swab the Deck', 'Go Fishing', 'Treasure Hunting'],
      },
      lab: {
        name: '🔬 Laboratory',
        description: 'Conduct experiments and research.',
        activities: ['Research', 'Experiments', 'Analysis'],
      },
    };

    return locationData[location] || {
      name: '❓ Unknown Location',
      description: 'This location is not yet available.',
      activities: [],
    };
  }
}

module.exports = new TownService();
