/**
 * Utility for location activity tables (PostgreSQL compatibility)
 * Note: Table creation removed - should be handled by migrations
 */
const db = require('../config/db');

/**
 * Initialize location activity tables - DEPRECATED
 * Table creation removed for PostgreSQL compatibility
 * Tables should be created through proper migrations
 * @returns {Promise<void>}
 */
async function initLocationTables() {
  console.log('Location table initialization skipped - using PostgreSQL migrations');
  // Table creation code removed for PostgreSQL compatibility
  // All table creation should be handled through proper database migrations
}

module.exports = initLocationTables;
