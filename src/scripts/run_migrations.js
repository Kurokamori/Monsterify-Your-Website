const fs = require('fs');
const path = require('path');
const pool = require('../db');

/**
 * Run all migration scripts in the migrations directory
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Get all SQL files in the migrations directory
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    // Sort files alphabetically to ensure consistent order
    files.sort();
    
    // Run each migration script
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error.message);
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('All migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migrations
runMigrations();
