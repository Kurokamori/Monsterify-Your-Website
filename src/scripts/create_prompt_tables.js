const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function createPromptTables() {
  try {
    console.log('Creating prompt tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'prompt_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Prompt tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating prompt tables:', error);
    process.exit(1);
  }
}

createPromptTables();
