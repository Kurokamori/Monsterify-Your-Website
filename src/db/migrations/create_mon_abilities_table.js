const fs = require('fs');
const path = require('path');
const pool = require('../../db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'create_mon_abilities_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('Migration successful: Created mon_abilities table');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

runMigration();
