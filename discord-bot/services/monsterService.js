const apiService = require('./apiService');

class MonsterService {
  // Get all monsters
  async getAllMonsters() {
    return await apiService.get('/monsters');
  }

  // Get monsters by user ID
  async getMonstersByUserId(userId) {
    return await apiService.get(`/monsters/user/${userId}`);
  }

  // Get monster by ID
  async getMonsterById(monsterId) {
    return await apiService.get(`/monsters/${monsterId}`);
  }

  // Create new monster
  async createMonster(monsterData) {
    return await apiService.post('/monsters', monsterData);
  }

  // Update monster
  async updateMonster(monsterId, monsterData) {
    return await apiService.put(`/monsters/${monsterId}`, monsterData);
  }

  // Delete monster
  async deleteMonster(monsterId) {
    return await apiService.delete(`/monsters/${monsterId}`);
  }

  // Get monster images
  async getMonsterImages(monsterId) {
    return await apiService.get(`/monsters/${monsterId}/images`);
  }

  // Add monster image
  async addMonsterImage(monsterId, imageData) {
    return await apiService.post(`/monsters/${monsterId}/images`, imageData);
  }

  // Get monster moves
  async getMonsterMoves(monsterId) {
    return await apiService.get(`/monsters/${monsterId}/moves`);
  }

  // Get monster evolution chain
  async getMonsterEvolutionChain(monsterId) {
    return await apiService.get(`/monsters/${monsterId}/evolution-chain`);
  }

  // Get evolution options
  async getEvolutionOptions(monsterId) {
    return await apiService.get(`/monsters/${monsterId}/evolution-options`);
  }

  // Evolve monster
  async evolveMonster(monsterId, evolutionData) {
    return await apiService.post(`/monsters/${monsterId}/evolve`, evolutionData);
  }

  // Rename monster (helper method)
  async renameMonster(monsterId, newName) {
    return await this.updateMonster(monsterId, { name: newName });
  }

  // Helper method to format monster data for Discord embeds
  formatMonsterForEmbed(monster) {
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join(' / ');
    
    const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(Boolean)
      .join(' / ');

    const stats = {
      hp: monster.hp_total,
      attack: monster.atk_total,
      defense: monster.def_total,
      spAttack: monster.spa_total,
      spDefense: monster.spd_total,
      speed: monster.spe_total,
    };

    const traits = [];
    if (monster.shiny) traits.push('✨ Shiny');
    if (monster.alpha) traits.push('🔺 Alpha');
    if (monster.shadow) traits.push('🌑 Shadow');
    if (monster.paradox) traits.push('⚡ Paradox');
    if (monster.pokerus) traits.push('🦠 Pokérus');

    return {
      name: monster.name,
      level: monster.level,
      species,
      types,
      attribute: monster.attribute,
      stats,
      traits: traits.length > 0 ? traits.join(', ') : 'None',
      friendship: monster.friendship,
      gender: monster.gender,
      pronouns: monster.pronouns,
      nature: monster.nature,
      characteristic: monster.characteristic,
      favBerry: monster.fav_berry,
      heldItem: monster.held_item,
      seal: monster.seal,
      mark: monster.mark,
      dateMet: monster.date_met,
      whereMet: monster.where_met,
      height: monster.height,
      tldr: monster.tldr,
      bio: monster.bio,
      imageUrl: monster.img_link,
      boxNumber: monster.box_number,
      trainerIndex: monster.trainer_index,
      moveset: monster.moveset,
    };
  }

  // Helper method to format stats for display
  formatStatsForEmbed(stats) {
    return [
      `❤️ HP: ${stats.hp}`,
      `⚔️ Attack: ${stats.attack}`,
      `🛡️ Defense: ${stats.defense}`,
      `✨ Sp. Attack: ${stats.spAttack}`,
      `🔮 Sp. Defense: ${stats.spDefense}`,
      `💨 Speed: ${stats.speed}`,
    ].join('\n');
  }

  // Helper method to get monster summary for lists
  formatMonsterSummary(monster) {
    const species = monster.species1 || 'Unknown';
    const level = monster.level || 1;
    const traits = [];
    
    if (monster.shiny) traits.push('✨');
    if (monster.alpha) traits.push('🔺');
    if (monster.shadow) traits.push('🌑');
    
    const traitString = traits.length > 0 ? ` ${traits.join('')}` : '';
    
    return `**${monster.name}** (Lv. ${level} ${species})${traitString}`;
  }
}

module.exports = new MonsterService();
