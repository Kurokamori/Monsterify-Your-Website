const { initializeSchema } = require('./schema');
const db = require('../config/db');
const { migrateSubmissions } = require('./migrations/submissions');
const { createMonsterTypeTables } = require('./migrations/monster_types');
const { createItemsTable } = require('./migrations/items');
const { migrateAntiqueStore } = require('./migrations/antique_store');
const { initializeFactions } = require('./initializeFactions');

async function initializeDatabase() {}

module.exports = {
  initializeDatabase
};
