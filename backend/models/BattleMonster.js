const db = require('../config/db');

/**
 * BattleMonster model for managing monsters in battle
 */
class BattleMonster {
  /**
   * Create a new battle monster
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} Created battle monster
   */
  static async create(monsterData) {
    try {
      console.log('BattleMonster.create called with:', monsterData);

      const {
        battle_id,
        participant_id,
        monster_id,
        monster_data,
        current_hp,
        max_hp,
        position_index = 0,
        is_active = false
      } = monsterData;

      const query = `
        INSERT INTO battle_monsters (
          battle_id, participant_id, monster_id, monster_data,
          current_hp, max_hp, position_index, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      // Ensure monster_data is properly serialized
      let monsterDataJson;
      try {
        monsterDataJson = typeof monster_data === 'string' ? monster_data : JSON.stringify(monster_data);
      } catch (e) {
        console.error('Error stringifying monster_data:', e);
        console.error('monster_data value:', monster_data);
        monsterDataJson = '{}';
      }

      const params = [
        battle_id,
        participant_id,
        monster_id,
        monsterDataJson,
        current_hp,
        max_hp,
        position_index,
        is_active
      ];

      console.log('Executing BattleMonster create query with params:', params);
      const result = await db.asyncRun(query, params);
      console.log('BattleMonster create result:', result);

      const battleMonsterId = result.rows ? result.rows[0].id : result.lastID;
      console.log('Created battle monster with ID:', battleMonsterId);

      const createdMonster = await this.getById(battleMonsterId);
      console.log('Retrieved created monster:', createdMonster);
      return createdMonster;
    } catch (error) {
      console.error('Error creating battle monster:', error);
      throw error;
    }
  }

  /**
   * Get battle monster by ID
   * @param {number} id - Battle monster ID
   * @returns {Promise<Object|null>} Battle monster or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          bm.*,
          bp.trainer_name,
          bp.team_side,
          m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.id = $1
      `;

      const battleMonster = await db.asyncGet(query, [id]);
      
      if (battleMonster) {
        // Parse JSON fields
        if (battleMonster.monster_data) {
          try {
            if (typeof battleMonster.monster_data === 'string') {
              battleMonster.monster_data = JSON.parse(battleMonster.monster_data);
            }
          } catch (e) {
            console.error('Error parsing monster_data:', e);
            console.error('monster_data value:', battleMonster.monster_data);
            battleMonster.monster_data = {};
          }
        }

        if (battleMonster.status_effects) {
          try {
            if (typeof battleMonster.status_effects === 'string') {
              battleMonster.status_effects = JSON.parse(battleMonster.status_effects);
            }
          } catch (e) {
            console.error('Error parsing status_effects:', e);
            console.error('status_effects value:', battleMonster.status_effects);
            battleMonster.status_effects = [];
          }
        }
      }

      return battleMonster;
    } catch (error) {
      console.error(`Error getting battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get battle monster by battle ID and monster ID
   * @param {number} battleId - Battle ID
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Object|null>} Battle monster or null
   */
  static async getByBattleAndMonster(battleId, monsterId) {
    try {
      const query = `
        SELECT
          bm.*,
          m.name as monster_name,
          m.species1,
          m.species2,
          m.species3,
          m.type1,
          m.type2,
          m.type3,
          m.type4,
          m.type5,
          m.level,
          bp.trainer_name,
          bp.team_side
        FROM battle_monsters bm
        LEFT JOIN monsters m ON bm.monster_id = m.id
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        WHERE bm.battle_id = $1 AND bm.monster_id = $2
        LIMIT 1
      `;

      const battleMonster = await db.asyncGet(query, [battleId, monsterId]);

      if (battleMonster) {
        // Parse JSON fields
        if (battleMonster.monster_data) {
          try {
            if (typeof battleMonster.monster_data === 'string') {
              battleMonster.monster_data = JSON.parse(battleMonster.monster_data);
            }
          } catch (e) {
            console.error('Error parsing monster_data:', e);
            battleMonster.monster_data = {};
          }
        }

        if (battleMonster.status_effects) {
          try {
            if (typeof battleMonster.status_effects === 'string') {
              battleMonster.status_effects = JSON.parse(battleMonster.status_effects);
            }
          } catch (e) {
            console.error('Error parsing status_effects:', e);
            battleMonster.status_effects = [];
          }
        }
      }

      return battleMonster;
    } catch (error) {
      console.error(`Error getting battle monster for battle ${battleId} and monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get battle monsters by battle ID
   * @param {number} battleId - Battle ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of battle monsters
   */
  static async getByBattle(battleId, options = {}) {
    try {
      const { participantId = null, isActive = null, teamSide = null } = options;

      let query = `
        SELECT 
          bm.*,
          bp.trainer_name,
          bp.team_side,
          m.name as original_name
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.battle_id = $1
      `;
      const params = [battleId];

      if (participantId) {
        query += ` AND bm.participant_id = $${params.length + 1}`;
        params.push(participantId);
      }

      if (isActive !== null) {
        query += ` AND bm.is_active = $${params.length + 1}`;
        params.push(isActive);
      }

      if (teamSide) {
        query += ` AND bp.team_side = $${params.length + 1}`;
        params.push(teamSide);
      }

      query += ' ORDER BY bp.team_side, bm.position_index, bm.created_at';

      const battleMonsters = await db.asyncAll(query, params);
      
      // Parse JSON fields for each monster
      battleMonsters.forEach(monster => {
        if (monster.monster_data) {
          try {
            // Check if it's already an object
            if (typeof monster.monster_data === 'object') {
              // Already parsed or is an object
              monster.monster_data = monster.monster_data;
            } else if (typeof monster.monster_data === 'string') {
              // Check for corrupted "[object Object]" strings
              if (monster.monster_data === '[object Object]' || monster.monster_data.includes('[object Object]')) {
                console.warn('Corrupted monster_data detected, setting to empty object');
                monster.monster_data = {};
              } else {
                monster.monster_data = JSON.parse(monster.monster_data);
              }
            } else {
              monster.monster_data = {};
            }
          } catch (e) {
            console.error('Error parsing monster_data:', e);
            console.error('monster_data value:', monster.monster_data);
            monster.monster_data = {};
          }
        }

        if (monster.status_effects) {
          try {
            // Check if it's already an array
            if (Array.isArray(monster.status_effects)) {
              // Already parsed
              monster.status_effects = monster.status_effects;
            } else if (typeof monster.status_effects === 'string') {
              // Handle empty strings and corrupted data
              if (monster.status_effects === '' || monster.status_effects === '[object Object]') {
                monster.status_effects = [];
              } else {
                monster.status_effects = JSON.parse(monster.status_effects);
              }
            } else {
              monster.status_effects = [];
            }
          } catch (e) {
            console.error('Error parsing status_effects:', e);
            console.error('status_effects value:', monster.status_effects);
            monster.status_effects = [];
          }
        }
      });

      return battleMonsters;
    } catch (error) {
      console.error(`Error getting battle monsters for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get active battle monsters by participant
   * @param {number} participantId - Participant ID
   * @returns {Promise<Array>} Array of active battle monsters
   */
  static async getActiveByParticipant(participantId) {
    try {
      const query = `
        SELECT
          bm.*,
          bp.trainer_name,
          bp.team_side,
          m.name as original_name,
          m.species1,
          m.species2,
          m.species3,
          m.type1,
          m.type2,
          m.type3,
          m.type4,
          m.type5,
          m.level,
          m.moveset,
          m.hp_total,
          m.atk_total,
          m.def_total,
          m.spa_total,
          m.spd_total,
          m.spe_total
        FROM battle_monsters bm
        LEFT JOIN battle_participants bp ON bm.participant_id = bp.id
        LEFT JOIN monsters m ON bm.monster_id = m.id
        WHERE bm.participant_id = $1 AND bm.is_active = true AND bm.is_fainted = false
        ORDER BY bm.position_index
      `;

      const battleMonsters = await db.asyncAll(query, [participantId]);
      
      // Parse JSON fields
      battleMonsters.forEach(monster => {
        if (monster.monster_data) {
          try {
            // Check if it's already an object
            if (typeof monster.monster_data === 'object') {
              monster.monster_data = monster.monster_data;
            } else if (typeof monster.monster_data === 'string') {
              // Check for corrupted "[object Object]" strings
              if (monster.monster_data === '[object Object]' || monster.monster_data.includes('[object Object]')) {
                console.warn('Corrupted monster_data detected, falling back to original monster data');
                monster.monster_data = this.buildMonsterDataFromOriginal(monster);
              } else {
                monster.monster_data = JSON.parse(monster.monster_data);
              }
            } else {
              monster.monster_data = {};
            }
          } catch (e) {
            console.error('Error parsing monster_data:', e);
            console.error('monster_data value:', monster.monster_data);
            console.warn('Falling back to original monster data');
            monster.monster_data = this.buildMonsterDataFromOriginal(monster);
          }
        } else {
          // No monster_data at all, build from original
          monster.monster_data = this.buildMonsterDataFromOriginal(monster);
        }

        // Check if monster_data is still empty or invalid, and rebuild if needed
        if (!monster.monster_data || Object.keys(monster.monster_data).length === 0) {
          console.warn('Empty monster_data detected, rebuilding from original');
          monster.monster_data = this.buildMonsterDataFromOriginal(monster);
        }

        if (monster.status_effects) {
          try {
            // Check if it's already an array
            if (Array.isArray(monster.status_effects)) {
              monster.status_effects = monster.status_effects;
            } else if (typeof monster.status_effects === 'string') {
              // Handle empty strings and corrupted data
              if (monster.status_effects === '' || monster.status_effects === '[object Object]') {
                monster.status_effects = [];
              } else {
                monster.status_effects = JSON.parse(monster.status_effects);
              }
            } else {
              monster.status_effects = [];
            }
          } catch (e) {
            console.error('Error parsing status_effects:', e);
            console.error('status_effects value:', monster.status_effects);
            monster.status_effects = [];
          }
        }
      });

      return battleMonsters;
    } catch (error) {
      console.error(`Error getting active battle monsters for participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Build monster data from original monster fields
   * @param {Object} monster - Monster record with original fields
   * @returns {Object} Monster data object
   */
  static buildMonsterDataFromOriginal(monster) {
    try {
      // Parse moves from moveset field
      let moves = [];
      if (monster.moveset) {
        if (Array.isArray(monster.moveset)) {
          moves = monster.moveset;
        } else if (typeof monster.moveset === 'string') {
          try {
            moves = JSON.parse(monster.moveset);
          } catch (e) {
            console.error('Error parsing moveset:', e);
            moves = [];
          }
        }
      }

      // Build types array from type1, type2, etc.
      let types = [];
      if (monster.type1) types.push(monster.type1);
      if (monster.type2) types.push(monster.type2);
      if (monster.type3) types.push(monster.type3);
      if (monster.type4) types.push(monster.type4);
      if (monster.type5) types.push(monster.type5);

      // Build species array from species1, species2, etc.
      let species = [];
      if (monster.species1) species.push(monster.species1);
      if (monster.species2) species.push(monster.species2);
      if (monster.species3) species.push(monster.species3);

      return {
        name: monster.original_name || monster.name || 'Unknown',
        species: species.length > 0 ? species[0] : 'Unknown', // Use first species as primary
        species_list: species, // Keep full species list
        types: types,
        level: monster.level || 1,
        moves: moves,
        hp: monster.hp_total || 100,
        attack: monster.atk_total || 50,
        defense: monster.def_total || 50,
        sp_attack: monster.spa_total || 50,
        sp_defense: monster.spd_total || 50,
        speed: monster.spe_total || 50
      };
    } catch (error) {
      console.error('Error building monster data from original:', error);
      return {
        name: 'Unknown',
        species: 'Unknown',
        types: [],
        level: 1,
        moves: [],
        hp: 100,
        attack: 50,
        defense: 50,
        sp_attack: 50,
        sp_defense: 50,
        speed: 50
      };
    }
  }

  /**
   * Update battle monster
   * @param {number} id - Battle monster ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated battle monster
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'current_hp', 'max_hp', 'status_effects', 'is_active', 
        'is_fainted', 'position_index', 'monster_data'
      ];
      
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${index + 1}`);
          
          // Handle JSON fields
          if ((key === 'status_effects' || key === 'monster_data') && typeof updateData[key] === 'object') {
            params.push(JSON.stringify(updateData[key]));
          } else {
            params.push(updateData[key]);
          }
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);

      const query = `
        UPDATE battle_monsters 
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);
    } catch (error) {
      console.error(`Error updating battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deal damage to battle monster
   * @param {number} id - Battle monster ID
   * @param {number} damage - Damage amount
   * @returns {Promise<Object>} Updated battle monster with damage result
   */
  static async dealDamage(id, damage) {
    try {
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Battle monster ${id} not found`);
      }

      const newHp = Math.max(0, monster.current_hp - damage);
      const isFainted = newHp === 0;

      const updateData = {
        current_hp: newHp,
        is_fainted: isFainted
      };

      if (isFainted) {
        updateData.is_active = false;
      }

      const updatedMonster = await this.update(id, updateData);

      return {
        ...updatedMonster,
        damage_dealt: damage,
        hp_before: monster.current_hp,
        hp_after: newHp,
        fainted: isFainted
      };
    } catch (error) {
      console.error(`Error dealing damage to battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Heal battle monster
   * @param {number} id - Battle monster ID
   * @param {number} healAmount - Heal amount
   * @returns {Promise<Object>} Updated battle monster with heal result
   */
  static async heal(id, healAmount) {
    try {
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Battle monster ${id} not found`);
      }

      const newHp = Math.min(monster.max_hp, monster.current_hp + healAmount);
      const actualHeal = newHp - monster.current_hp;

      const updateData = {
        current_hp: newHp
      };

      // If monster was fainted and now has HP, revive it
      if (monster.is_fainted && newHp > 0) {
        updateData.is_fainted = false;
      }

      const updatedMonster = await this.update(id, updateData);

      return {
        ...updatedMonster,
        heal_amount: actualHeal,
        hp_before: monster.current_hp,
        hp_after: newHp,
        revived: monster.is_fainted && newHp > 0
      };
    } catch (error) {
      console.error(`Error healing battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Set monster as active
   * @param {number} id - Battle monster ID
   * @returns {Promise<Object|null>} Updated battle monster
   */
  static async setActive(id) {
    try {
      return this.update(id, { is_active: true });
    } catch (error) {
      console.error(`Error setting battle monster ${id} as active:`, error);
      throw error;
    }
  }

  /**
   * Set monster as inactive
   * @param {number} id - Battle monster ID
   * @returns {Promise<Object|null>} Updated battle monster
   */
  static async setInactive(id) {
    try {
      return this.update(id, { is_active: false });
    } catch (error) {
      console.error(`Error setting battle monster ${id} as inactive:`, error);
      throw error;
    }
  }

  /**
   * Add status effect to monster
   * @param {number} id - Battle monster ID
   * @param {Object} statusEffect - Status effect data
   * @returns {Promise<Object|null>} Updated battle monster
   */
  static async addStatusEffect(id, statusEffect) {
    try {
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Battle monster ${id} not found`);
      }

      const statusEffects = monster.status_effects || [];
      statusEffects.push({
        ...statusEffect,
        applied_at: new Date().toISOString()
      });

      return this.update(id, { status_effects: statusEffects });
    } catch (error) {
      console.error(`Error adding status effect to battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove status effect from monster
   * @param {number} id - Battle monster ID
   * @param {string} effectType - Status effect type to remove
   * @returns {Promise<Object|null>} Updated battle monster
   */
  static async removeStatusEffect(id, effectType) {
    try {
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Battle monster ${id} not found`);
      }

      const statusEffects = (monster.status_effects || []).filter(
        effect => effect.type !== effectType
      );

      return this.update(id, { status_effects: statusEffects });
    } catch (error) {
      console.error(`Error removing status effect from battle monster ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete battle monster
   * @param {number} id - Battle monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM battle_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting battle monster ${id}:`, error);
      throw error;
    }
  }
}

module.exports = BattleMonster;
