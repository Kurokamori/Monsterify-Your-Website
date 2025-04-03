/**
 * Script to create schedule-related tables
 */
const pool = require('../db');

async function createScheduleTables() {
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

    console.log('Creating tasks table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);

    console.log('Creating habits table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
        streak INTEGER DEFAULT 0,
        last_completed TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);

    console.log('Schedule tables created successfully!');
  } catch (error) {
    console.error('Error creating schedule tables:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
createScheduleTables();
