/**
 * Script to create the schedules table
 */
const pool = require('../db');

async function createSchedulesTable() {
  try {
    console.log('Creating schedules table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);

    console.log('Schedules table created successfully!');
  } catch (error) {
    console.error('Error creating schedules table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
createSchedulesTable();
