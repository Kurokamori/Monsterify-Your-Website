const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
require('dotenv').config();

// Database setup
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

/**
 * Initialize the database
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    console.log('Schema created successfully');
    
    // Create admin user
    await User.initializeDatabase();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
