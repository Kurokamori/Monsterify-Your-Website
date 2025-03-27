const fs = require('fs');
const path = require('path');
const pool = require('../../db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'add_additional_references_to_trainers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('Migration successful: Added additional_references column to trainers table');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

runMigration();
