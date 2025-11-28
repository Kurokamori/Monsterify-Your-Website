/**
 * Database utility functions for cross-database compatibility
 */

// Detect database type
const isPostgreSQL = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

/**
 * Build a LIMIT/OFFSET clause that works with both SQLite and PostgreSQL
 * @param {number} limit - Number of records to limit
 * @param {number} offset - Number of records to offset
 * @param {Array} params - Parameters array to modify
 * @returns {string} - SQL LIMIT/OFFSET clause
 */
function buildLimitOffset(limit, offset, params) {
  if (isPostgreSQL) {
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    params.push(parseInt(limit), parseInt(offset));
    return ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
  } else {
    params.push(parseInt(limit), parseInt(offset));
    return ` LIMIT ? OFFSET ?`;
  }
}

/**
 * Build a LIMIT clause that works with both SQLite and PostgreSQL
 * @param {number} limit - Number of records to limit
 * @param {Array} params - Parameters array to modify
 * @returns {string} - SQL LIMIT clause
 */
function buildLimit(limit, params) {
  if (isPostgreSQL) {
    const limitIndex = params.length + 1;
    params.push(parseInt(limit));
    return ` LIMIT $${limitIndex}`;
  } else {
    params.push(parseInt(limit));
    return ` LIMIT ?`;
  }
}

/**
 * Get the appropriate RANDOM() function for the database
 * @returns {string} - Random function name
 */
function getRandomFunction() {
  return 'RANDOM()'; // Both SQLite and PostgreSQL use RANDOM()
}

/**
 * Build an ORDER BY with LIMIT clause for random selection
 * @param {number} count - Number of random records to select
 * @param {Array} params - Parameters array to modify
 * @returns {string} - SQL ORDER BY RANDOM() LIMIT clause
 */
function buildRandomLimit(count, params) {
  const randomFunc = getRandomFunction();
  if (isPostgreSQL) {
    const limitIndex = params.length + 1;
    params.push(parseInt(count));
    return ` ORDER BY ${randomFunc} LIMIT $${limitIndex}`;
  } else {
    params.push(parseInt(count));
    return ` ORDER BY ${randomFunc} LIMIT ?`;
  }
}

module.exports = {
  isPostgreSQL,
  buildLimitOffset,
  buildLimit,
  getRandomFunction,
  buildRandomLimit
};
