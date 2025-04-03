const fs = require('fs');
const path = require('path');
const pool = require('../db');

/**
 * Run all JavaScript migration scripts in the migrations directory
 */
async function runJsMigrations() {
  try {
    console.log('Running JavaScript database migrations...');
    
    // Get all JS files in the migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.js'));
    
    // Sort files alphabetically to ensure consistent order
    files.sort();
    
    // Run each migration script
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      
      try {
        const migration = require(filePath);
        await migration.up();
        console.log(`Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error.message);
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('All JavaScript migrations completed');
  } catch (error) {
    console.error('Error running JavaScript migrations:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migrations
runJsMigrations();
