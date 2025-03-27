const { Pool } = require('pg');
require('dotenv').config();

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check tables
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check mons table columns
    const monsColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'mons'
      ORDER BY ordinal_position;
    `;
    
    try {
      const monsColumnsResult = await pool.query(monsColumnsQuery);
      console.log('\nColumns in mons table:');
      monsColumnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } catch (error) {
      console.log('\nCould not get columns for mons table:', error.message);
    }
    
    // Check monsters table columns
    const monstersColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'monsters'
      ORDER BY ordinal_position;
    `;
    
    try {
      const monstersColumnsResult = await pool.query(monstersColumnsQuery);
      console.log('\nColumns in monsters table:');
      monstersColumnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } catch (error) {
      console.log('\nCould not get columns for monsters table:', error.message);
    }
    
    // Check trainers table columns
    const trainersColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trainers'
      ORDER BY ordinal_position;
    `;
    
    try {
      const trainersColumnsResult = await pool.query(trainersColumnsQuery);
      console.log('\nColumns in trainers table:');
      trainersColumnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } catch (error) {
      console.log('\nCould not get columns for trainers table:', error.message);
    }
    
    // Check if there are any trainers
    const trainersQuery = 'SELECT COUNT(*) FROM trainers';
    try {
      const trainersResult = await pool.query(trainersQuery);
      console.log(`\nNumber of trainers: ${trainersResult.rows[0].count}`);
    } catch (error) {
      console.log('\nCould not count trainers:', error.message);
    }
    
    // Check if there are any mons
    const monsQuery = 'SELECT COUNT(*) FROM mons';
    try {
      const monsResult = await pool.query(monsQuery);
      console.log(`Number of mons: ${monsResult.rows[0].count}`);
    } catch (error) {
      console.log('\nCould not count mons:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
checkSchema()
  .then(() => {
    console.log('Schema check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });
