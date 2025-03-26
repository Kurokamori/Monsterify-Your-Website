const db = require(" ../../db\);

class PlayerShopPurchases {
 /**
 * Record a player purchase from a shop
 * @param {string} playerId - The player ID
 * @param {string} shopId - The shop ID
 * @param {string} itemId - The item ID
 * @param {number} quantity - The quantity purchased
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<Object>} The purchase record
 */
 static async recordPurchase(playerId, shopId, itemId, quantity, date = null) {
 try {
 // If no date is provided, use today
 const targetDate = date || new Date().toISOString().split(\T\)[0];
 
 // Check if there is an existing purchase record for today
 const checkQuery = 
 SELECT id, quantity
 FROM player_shop_purchases
 WHERE player_id = AND shop_id = AND item_id = AND date = 
 ;
 
 const checkResult = await db.query(checkQuery, [playerId, shopId, itemId, targetDate]);
 
 if (checkResult.rows.length > 0) {
 // Update existing record
 const existingRecord = checkResult.rows[0];
 const newQuantity = existingRecord.quantity + quantity;
 
 const updateQuery = 
 UPDATE player_shop_purchases
 SET quantity = , updated_at = CURRENT_TIMESTAMP
 WHERE id = 
 RETURNING *
 ;
 
 const updateResult = await db.query(updateQuery, [newQuantity, existingRecord.id]);
 return updateResult.rows[0];
 } else {
 // Create new record
 const insertQuery = 
 INSERT INTO player_shop_purchases (player_id, shop_id, item_id, quantity, date)
 VALUES (, , , , )
 RETURNING *
 ;
 
 const insertResult = await db.query(insertQuery, [playerId, shopId, itemId, quantity, targetDate]);
 return insertResult.rows[0];
 }
 } catch (error) {
 console.error(Error recording purchase for player , shop , item :, error);
 throw error;
 }
 }

 /**
 * Get purchase history for a player
 * @param {string} playerId - The player ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of purchase records
 */
 static async getPlayerPurchases(playerId, date = null) {
 try {
 // If no date is provided, use today
 const targetDate = date || new Date().toISOString().split(\T\)[0];
 
 const query = 
 SELECT psp.*, i.name as item_name, i.effect as item_description,
 i.icon as item_image, i.rarity as item_rarity, i.category as item_type,
 sc.name as shop_name
 FROM player_shop_purchases psp
 JOIN items i ON psp.item_id = i.id
 JOIN shop_config sc ON psp.shop_id = sc.shop_id
 WHERE psp.player_id = AND psp.date = 
 ORDER BY psp.created_at DESC
 ;
 
 const result = await db.query(query, [playerId, targetDate]);
 return result.rows;
 } catch (error) {
 console.error(Error getting purchase history for player :, error);
 throw error;
 }
 }

 /**
 * Get total purchases for a player on a specific date
 * @param {string} playerId - The player ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<Object>} Total purchases by shop
 */
 static async getTotalPurchases(playerId, date = null) {
 try {
 // If no date is provided, use today
 const targetDate = date || new Date().toISOString().split(\T\)[0];
 
 const query = 
 SELECT shop_id, SUM(quantity) as total_quantity, COUNT(DISTINCT item_id) as unique_items
 FROM player_shop_purchases
 WHERE player_id = AND date = 
 GROUP BY shop_id
 ;
 
 const result = await db.query(query, [playerId, targetDate]);
 
 // Convert to object with shop_id as key
 const totals = {};
 result.rows.forEach(row => {
 totals[row.shop_id] = {
 total_quantity: parseInt(row.total_quantity),
 unique_items: parseInt(row.unique_items)
 };
 });
 
 return totals;
 } catch (error) {
 console.error(Error getting total purchases for player :, error);
 throw error;
 }
 }
}

module.exports = PlayerShopPurchases;
