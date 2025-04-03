const fs = require('fs');
const path = require('path');
const pool = require('../../db');

async function runMigration() {
  try {
    console.log('Starting migration: Creating mon_abilities table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_mon_abilities.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration successful: Created mon_abilities table');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runMigration();
