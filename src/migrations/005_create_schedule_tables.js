/**
 * Migration to create schedule-related tables
 */
const pool = require('../db');

async function up() {
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
    throw error;
  }
}

async function down() {
  try {
    console.log('Dropping habits table...');
    await pool.query('DROP TABLE IF EXISTS habits');

    console.log('Dropping tasks table...');
    await pool.query('DROP TABLE IF EXISTS tasks');

    console.log('Dropping schedules table...');
    await pool.query('DROP TABLE IF EXISTS schedules');

    console.log('Schedule tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping schedule tables:', error);
    throw error;
  }
}

module.exports = { up, down };
