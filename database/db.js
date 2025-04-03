const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
require('dotenv').config();

// Create a new Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false // Set to console.log to see SQL queries
});

// Create a new Pool instance for direct PostgreSQL queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Also test the pool connection
    const client = await pool.connect();
    console.log('Pool connection has been established successfully.');
    await client.release();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize,
  pool,
  testConnection
};
