/**
 * Script to run the achievements migration
 * Run with: node src/scripts/run-achievements-migration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigration() {
    try {
        console.log('Running achievements migration...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../db/migrations/create_achievements_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        
        console.log('Achievements migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running achievements migration:', error);
        process.exit(1);
    }
}

runMigration();
