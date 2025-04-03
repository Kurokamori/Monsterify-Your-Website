const fs = require('fs');
const path = require('path');
const pool = require('../../db');

async function runMigration() {
  try {
    console.log('Starting migration: Updating boss_damage table to use player_user_id...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'update_boss_damage_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration successful: Updated boss_damage table to use player_user_id');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runMigration();
