const { pool } = require('../db');

/**
 * Get prompts by category
 * @param {string} category - Prompt category (general, progression, legendary, monthly, event)
 * @returns {Promise<Array>} - Array of prompts
 */
async function getPromptsByCategory(category) {
  try {
    console.log(`Fetching prompts from database with category: ${category}`);
    
    let query = `
      SELECT 
        prompt_id,
        category,
        title,
        description,
        min_trainer_level,
        month,
        repeatable,
        active,
        reward_coins,
        reward_levels,
        reward_items,
        reward_random_items,
        reward_monster_params
      FROM 
        prompt_templates
      WHERE 
        category = $1
        AND active = true
    `;
    
    // For monthly prompts, filter by the current month
    const params = [category];
    if (category === 'monthly') {
      const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
      query += ' AND month = $2';
      params.push(currentMonth);
    }
    
    query += ' ORDER BY title ASC';
    
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} prompts for category ${category}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting prompts by category:', error);
    return [];
  }
}

/**
 * Get prompt by ID
 * @param {number} promptId - Prompt ID
 * @returns {Promise<Object>} - Prompt object
 */
async function getPromptById(promptId) {
  try {
    console.log(`Fetching prompt from database with ID: ${promptId}`);
    
    const result = await pool.query(`
      SELECT 
        prompt_id,
        category,
        title,
        description,
        min_trainer_level,
        month,
        repeatable,
        active,
        reward_coins,
        reward_levels,
        reward_items,
        reward_random_items,
        reward_monster_params
      FROM 
        prompt_templates
      WHERE 
        prompt_id = $1
    `, [promptId]);
    
    if (result.rows.length === 0) {
      console.log(`No prompt found with ID ${promptId}`);
      return null;
    }
    
    console.log(`Found prompt with ID ${promptId}:`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting prompt by ID:', error);
    return null;
  }
}

module.exports = {
  getPromptsByCategory,
  getPromptById
};
