const db = require('../config/db');

class Bazar {
  /**
   * Forfeit a monster to the bazar
   * @param {number} monsterId - Monster ID to forfeit
   * @param {number} trainerId - Trainer ID who is forfeiting
   * @param {string} userId - User ID who is forfeiting
   * @returns {Promise<Object>} Forfeited monster data
   */
  static async forfeitMonster(monsterId, trainerId, userId) {
    try {
      // Get the monster data first
      const monster = await db.asyncGet(
        'SELECT * FROM monsters WHERE id = $1 AND trainer_id = $2',
        [monsterId, trainerId]
      );

      if (!monster) {
        throw new Error('Monster not found or does not belong to this trainer');
      }

      // Insert into bazar_monsters
      let bazarQuery, result, bazarMonsterId;

      if (db.isPostgreSQL) {
        bazarQuery = `
          INSERT INTO bazar_monsters (
            original_monster_id, forfeited_by_trainer_id, forfeited_by_user_id,
            name, species1, species2, species3, type1, type2, type3, type4, type5,
            attribute, level, hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
            def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev, spd_total, spd_iv, spd_ev,
            spe_total, spe_iv, spe_ev, nature, characteristic, gender, friendship,
            ability1, ability2, moveset, img_link, date_met, where_met, box_number, trainer_index
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44
          )
          RETURNING id
        `;

        result = await db.asyncGet(bazarQuery, [
          monster.id, trainerId, userId, monster.name, monster.species1, monster.species2,
          monster.species3, monster.type1, monster.type2, monster.type3, monster.type4,
          monster.type5, monster.attribute, monster.level, monster.hp_total, monster.hp_iv,
          monster.hp_ev, monster.atk_total, monster.atk_iv, monster.atk_ev, monster.def_total,
          monster.def_iv, monster.def_ev, monster.spa_total, monster.spa_iv, monster.spa_ev,
          monster.spd_total, monster.spd_iv, monster.spd_ev, monster.spe_total, monster.spe_iv,
          monster.spe_ev, monster.nature, monster.characteristic, monster.gender,
          monster.friendship, monster.ability1, monster.ability2, monster.moveset,
          monster.img_link, monster.date_met, monster.where_met, monster.box_number, monster.trainer_index
        ]);
        bazarMonsterId = result.id;
      } else {
        // SQLite
        bazarQuery = `
          INSERT INTO bazar_monsters (
            original_monster_id, forfeited_by_trainer_id, forfeited_by_user_id,
            name, species1, species2, species3, type1, type2, type3, type4, type5,
            attribute, level, hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
            def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev, spd_total, spd_iv, spd_ev,
            spe_total, spe_iv, spe_ev, nature, characteristic, gender, friendship,
            ability1, ability2, moveset, img_link, date_met, where_met, box_number, trainer_index
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `;

        result = await db.asyncRun(bazarQuery, [
          monster.id, trainerId, userId, monster.name, monster.species1, monster.species2,
          monster.species3, monster.type1, monster.type2, monster.type3, monster.type4,
          monster.type5, monster.attribute, monster.level, monster.hp_total, monster.hp_iv,
          monster.hp_ev, monster.atk_total, monster.atk_iv, monster.atk_ev, monster.def_total,
          monster.def_iv, monster.def_ev, monster.spa_total, monster.spa_iv, monster.spa_ev,
          monster.spd_total, monster.spd_iv, monster.spd_ev, monster.spe_total, monster.spe_iv,
          monster.spe_ev, monster.nature, monster.characteristic, monster.gender,
          monster.friendship, monster.ability1, monster.ability2, monster.moveset,
          monster.img_link, monster.date_met, monster.where_met, monster.box_number, monster.trainer_index
        ]);
        bazarMonsterId = result.lastID;
      }

      // Delete the original monster
      await db.asyncRun('DELETE FROM monsters WHERE id = $1', [monsterId]);

      // Record transaction
      await this.recordTransaction('forfeit_monster', 'monster', bazarMonsterId, trainerId, userId, null, null, {
        original_monster_id: monsterId,
        monster_name: monster.name
      });

      return { success: true, bazarMonsterId };
    } catch (error) {
      console.error('Error forfeiting monster:', error);
      throw error;
    }
  }

  /**
   * Forfeit items to the bazar
   * @param {number} trainerId - Trainer ID who is forfeiting
   * @param {string} userId - User ID who is forfeiting
   * @param {string} category - Item category
   * @param {string} itemName - Item name
   * @param {number} quantity - Quantity to forfeit
   * @returns {Promise<Object>} Forfeited item data
   */
  static async forfeitItem(trainerId, userId, category, itemName, quantity) {
    try {
      // Check if trainer has enough items
      const inventory = await db.asyncGet(
        'SELECT * FROM trainer_inventory WHERE trainer_id = $1',
        [trainerId]
      );

      if (!inventory) {
        throw new Error('Trainer inventory not found');
      }

      let categoryData;
      try {
        categoryData = JSON.parse(inventory[category] || '{}');
      } catch (e) {
        console.error('Error parsing category data:', e);
        categoryData = {};
      }

      const currentQuantity = categoryData[itemName] || 0;

      if (currentQuantity < quantity) {
        throw new Error(`Not enough items to forfeit. You have ${currentQuantity}, trying to forfeit ${quantity}`);
      }

      // Insert into bazar_items
      let bazarQuery, result, bazarItemId;

      if (db.isPostgreSQL) {
        bazarQuery = `
          INSERT INTO bazar_items (forfeited_by_trainer_id, forfeited_by_user_id, item_name, item_category, quantity)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;
        result = await db.asyncGet(bazarQuery, [trainerId, userId, itemName, category, quantity]);
        bazarItemId = result.id;
      } else {
        // SQLite
        bazarQuery = `
          INSERT INTO bazar_items (forfeited_by_trainer_id, forfeited_by_user_id, item_name, item_category, quantity)
          VALUES (?, ?, ?, ?, ?)
        `;
        result = await db.asyncRun(bazarQuery, [trainerId, userId, itemName, category, quantity]);
        bazarItemId = result.lastID;
      }

      // Update trainer inventory
      categoryData[itemName] = currentQuantity - quantity;
      if (categoryData[itemName] <= 0) {
        delete categoryData[itemName];
      }

      const updateQuery = `UPDATE trainer_inventory SET ${category} = $1 WHERE trainer_id = $2`;
      await db.asyncRun(updateQuery, [JSON.stringify(categoryData), trainerId]);

      // Record transaction
      await this.recordTransaction('forfeit_item', 'item', bazarItemId, trainerId, userId, null, null, {
        item_name: itemName,
        category: category,
        quantity: quantity
      });

      return { success: true, bazarItemId };
    } catch (error) {
      console.error('Error forfeiting item:', error);
      throw error;
    }
  }

  /**
   * Get all available monsters in the bazar
   * @returns {Promise<Array>} Available monsters
   */
  static async getAvailableMonsters() {
    try {
      const query = `
        SELECT bm.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_monsters bm
        LEFT JOIN trainers t ON bm.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bm.forfeited_by_user_id = u.discord_id
        WHERE bm.is_available = true
        ORDER BY bm.forfeited_at DESC
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting available monsters:', error);
      throw error;
    }
  }

  /**
   * Get all available items in the bazar
   * @returns {Promise<Array>} Available items
   */
  static async getAvailableItems() {
    try {
      const query = `
        SELECT bi.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_items bi
        LEFT JOIN trainers t ON bi.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bi.forfeited_by_user_id = u.discord_id
        WHERE bi.is_available = true
        ORDER BY bi.item_category, bi.item_name, bi.forfeited_at DESC
      `;
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting available items:', error);
      throw error;
    }
  }

  /**
   * Adopt a monster from the bazar
   * @param {number} bazarMonsterId - Bazar monster ID to adopt
   * @param {number} trainerId - Trainer ID who is adopting
   * @param {string} userId - User ID who is adopting
   * @param {string} newName - New name for the monster
   * @returns {Promise<Object>} Adopted monster data
   */
  static async adoptMonster(bazarMonsterId, trainerId, userId, newName) {
    try {
      // Get the bazar monster
      const bazarMonster = await db.asyncGet(
        'SELECT * FROM bazar_monsters WHERE id = $1 AND is_available = true',
        [bazarMonsterId]
      );

      if (!bazarMonster) {
        throw new Error('Monster not available for adoption');
      }

      // Create new monster for the adopting trainer
      let monsterQuery, result, newMonsterId;

      if (db.isPostgreSQL) {
        monsterQuery = `
          INSERT INTO monsters (
            trainer_id, player_user_id, name, species1, species2, species3,
            type1, type2, type3, type4, type5, attribute, level,
            hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
            def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev,
            spd_total, spd_iv, spd_ev, spe_total, spe_iv, spe_ev,
            nature, characteristic, gender, friendship, ability1, ability2,
            moveset, img_link, date_met, where_met, box_number, trainer_index
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
          )
          RETURNING id
        `;

        result = await db.asyncGet(monsterQuery, [
          trainerId, userId, newName || bazarMonster.name, bazarMonster.species1,
          bazarMonster.species2, bazarMonster.species3, bazarMonster.type1,
          bazarMonster.type2, bazarMonster.type3, bazarMonster.type4, bazarMonster.type5,
          bazarMonster.attribute, bazarMonster.level, bazarMonster.hp_total,
          bazarMonster.hp_iv, bazarMonster.hp_ev, bazarMonster.atk_total,
          bazarMonster.atk_iv, bazarMonster.atk_ev, bazarMonster.def_total,
          bazarMonster.def_iv, bazarMonster.def_ev, bazarMonster.spa_total,
          bazarMonster.spa_iv, bazarMonster.spa_ev, bazarMonster.spd_total,
          bazarMonster.spd_iv, bazarMonster.spd_ev, bazarMonster.spe_total,
          bazarMonster.spe_iv, bazarMonster.spe_ev, bazarMonster.nature,
          bazarMonster.characteristic, bazarMonster.gender, bazarMonster.friendship,
          bazarMonster.ability1, bazarMonster.ability2, bazarMonster.moveset,
          bazarMonster.img_link, bazarMonster.date_met, bazarMonster.where_met,
          bazarMonster.box_number, bazarMonster.trainer_index
        ]);
        newMonsterId = result.id;
      } else {
        // SQLite
        monsterQuery = `
          INSERT INTO monsters (
            trainer_id, player_user_id, name, species1, species2, species3,
            type1, type2, type3, type4, type5, attribute, level,
            hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
            def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev,
            spd_total, spd_iv, spd_ev, spe_total, spe_iv, spe_ev,
            nature, characteristic, gender, friendship, ability1, ability2,
            moveset, img_link, date_met, where_met, box_number, trainer_index
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `;

        result = await db.asyncRun(monsterQuery, [
          trainerId, userId, newName || bazarMonster.name, bazarMonster.species1,
          bazarMonster.species2, bazarMonster.species3, bazarMonster.type1,
          bazarMonster.type2, bazarMonster.type3, bazarMonster.type4, bazarMonster.type5,
          bazarMonster.attribute, bazarMonster.level, bazarMonster.hp_total,
          bazarMonster.hp_iv, bazarMonster.hp_ev, bazarMonster.atk_total,
          bazarMonster.atk_iv, bazarMonster.atk_ev, bazarMonster.def_total,
          bazarMonster.def_iv, bazarMonster.def_ev, bazarMonster.spa_total,
          bazarMonster.spa_iv, bazarMonster.spa_ev, bazarMonster.spd_total,
          bazarMonster.spd_iv, bazarMonster.spd_ev, bazarMonster.spe_total,
          bazarMonster.spe_iv, bazarMonster.spe_ev, bazarMonster.nature,
          bazarMonster.characteristic, bazarMonster.gender, bazarMonster.friendship,
          bazarMonster.ability1, bazarMonster.ability2, bazarMonster.moveset,
          bazarMonster.img_link, bazarMonster.date_met, bazarMonster.where_met,
          bazarMonster.box_number, bazarMonster.trainer_index
        ]);
        newMonsterId = result.lastID;
      }

      // Mark bazar monster as unavailable
      await db.asyncRun(
        'UPDATE bazar_monsters SET is_available = false WHERE id = $1',
        [bazarMonsterId]
      );

      // Record transaction
      await this.recordTransaction('adopt_monster', 'monster', bazarMonsterId,
        bazarMonster.forfeited_by_trainer_id, bazarMonster.forfeited_by_user_id,
        trainerId, userId, {
          new_monster_id: newMonsterId,
          new_name: newName || bazarMonster.name,
          original_name: bazarMonster.name
        });

      return { success: true, monsterId: newMonsterId };
    } catch (error) {
      console.error('Error adopting monster:', error);
      throw error;
    }
  }

  /**
   * Collect an item from the bazar
   * @param {number} bazarItemId - Bazar item ID to collect
   * @param {number} trainerId - Trainer ID who is collecting
   * @param {string} userId - User ID who is collecting
   * @param {number} quantity - Quantity to collect
   * @returns {Promise<Object>} Collection result
   */
  static async collectItem(bazarItemId, trainerId, userId, quantity) {
    try {
      // Get the bazar item
      const bazarItem = await db.asyncGet(
        'SELECT * FROM bazar_items WHERE id = $1 AND is_available = true',
        [bazarItemId]
      );

      if (!bazarItem) {
        throw new Error('Item not available for collection');
      }

      if (quantity > bazarItem.quantity) {
        throw new Error('Not enough quantity available');
      }

      // Get trainer inventory
      const inventory = await db.asyncGet(
        'SELECT * FROM trainer_inventory WHERE trainer_id = $1',
        [trainerId]
      );

      if (!inventory) {
        throw new Error('Trainer inventory not found');
      }

      const categoryData = JSON.parse(inventory[bazarItem.item_category] || '{}');
      const currentQuantity = categoryData[bazarItem.item_name] || 0;

      // Update trainer inventory
      categoryData[bazarItem.item_name] = currentQuantity + quantity;

      const updateQuery = `UPDATE trainer_inventory SET ${bazarItem.item_category} = $1 WHERE trainer_id = $2`;
      await db.asyncRun(updateQuery, [JSON.stringify(categoryData), trainerId]);

      // Update bazar item quantity or mark as unavailable
      if (quantity === bazarItem.quantity) {
        await db.asyncRun(
          'UPDATE bazar_items SET is_available = false WHERE id = $1',
          [bazarItemId]
        );
      } else {
        await db.asyncRun(
          'UPDATE bazar_items SET quantity = quantity - $1 WHERE id = $2',
          [quantity, bazarItemId]
        );
      }

      // Record transaction
      await this.recordTransaction('collect_item', 'item', bazarItemId,
        bazarItem.forfeited_by_trainer_id, bazarItem.forfeited_by_user_id,
        trainerId, userId, {
          item_name: bazarItem.item_name,
          category: bazarItem.item_category,
          quantity: quantity
        });

      return { success: true };
    } catch (error) {
      console.error('Error collecting item:', error);
      throw error;
    }
  }

  /**
   * Record a transaction in the bazar_transactions table
   */
  static async recordTransaction(transactionType, itemType, itemId, fromTrainerId, fromUserId, toTrainerId, toUserId, data) {
    try {
      const query = `
        INSERT INTO bazar_transactions (transaction_type, item_type, item_id, from_trainer_id, from_user_id, to_trainer_id, to_user_id, transaction_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await db.asyncRun(query, [transactionType, itemType, itemId, fromTrainerId, fromUserId, toTrainerId, toUserId, JSON.stringify(data)]);
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }
}

module.exports = Bazar;
