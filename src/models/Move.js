const pool = require('../db');

class Move {
  /**
   * Get all moves
   * @returns {Promise<Array>} - Array of moves
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM moves ORDER BY "MoveName"';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all moves:', error);
      return [];
    }
  }

  /**
   * Get a move by name
   * @param {string} name - Move name
   * @returns {Promise<Object>} - Move object
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM moves WHERE "MoveName" = $1';
      const result = await pool.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting move by name:', error);
      return null;
    }
  }

  /**
   * Get moves by type
   * @param {string} type - Move type
   * @returns {Promise<Array>} - Array of moves
   */
  static async getByType(type) {
    try {
      const query = 'SELECT * FROM moves WHERE "Type" = $1';
      const result = await pool.query(query, [type]);
      return result.rows;
    } catch (error) {
      console.error('Error getting moves by type:', error);
      return [];
    }
  }

  /**
   * Get moves by attribute
   * @param {string} attribute - Move attribute
   * @returns {Promise<Array>} - Array of moves
   */
  static async getByAttribute(attribute) {
    try {
      const query = 'SELECT * FROM moves WHERE attribute = $1';
      const result = await pool.query(query, [attribute]);
      return result.rows;
    } catch (error) {
      console.error('Error getting moves by attribute:', error);
      return [];
    }
  }

  /**
   * Get random moves
   * @param {number} count - Number of random moves to get
   * @returns {Promise<Array>} - Array of random moves
   */
  static async getRandom(count = 1) {
    try {
      const query = 'SELECT * FROM moves ORDER BY RANDOM() LIMIT $1';
      const result = await pool.query(query, [count]);
      return result.rows;
    } catch (error) {
      console.error('Error getting random moves:', error);
      return [];
    }
  }

  /**
   * Get random moves by type
   * @param {string} type - Move type
   * @param {number} count - Number of random moves to get
   * @returns {Promise<Array>} - Array of random moves
   */
  static async getRandomByType(type, count = 1) {
    try {
      const query = 'SELECT * FROM moves WHERE "Type" = $1 ORDER BY RANDOM() LIMIT $2';
      const result = await pool.query(query, [type, count]);
      return result.rows;
    } catch (error) {
      console.error('Error getting random moves by type:', error);
      return [];
    }
  }

  /**
   * Get random moves by attribute
   * @param {string} attribute - Move attribute
   * @param {number} count - Number of random moves to get
   * @returns {Promise<Array>} - Array of random moves
   */
  static async getRandomByAttribute(attribute, count = 1) {
    try {
      const query = 'SELECT * FROM moves WHERE attribute = $1 ORDER BY RANDOM() LIMIT $2';
      const result = await pool.query(query, [attribute, count]);
      return result.rows;
    } catch (error) {
      console.error('Error getting random moves by attribute:', error);
      return [];
    }
  }
}

module.exports = Move;
