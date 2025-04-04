/**
 * Script to run the achievement seed files
 * Run with: node src/scripts/run-achievement-seeds.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const pool = require('../db');

// Define the seed files to run
const seedFiles = [
    'level_achievements.sql',
    'all_type_collector_achievements.sql',
    'monster_collector_achievements.sql',
    'digimon_attribute_collector_achievements.sql',
    'currency_achievements.sql'
];

async function runSeeds() {
    try {
        console.log('Running achievement seeds...');

        // First, ensure the tables exist
        const migrationPath = path.join(__dirname, '../db/migrations/create_achievements_tables.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSql);
        console.log('Ensured achievement tables exist');

        // Clear existing achievements
        await pool.query('DELETE FROM achievements');
        console.log('Cleared existing achievements');

        // Run each seed file
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const seedFile of seedFiles) {
                const seedPath = path.join(__dirname, '../db/seeds', seedFile);
                const seedSql = fs.readFileSync(seedPath, 'utf8');

                // Split the SQL file into individual statements
                const statements = seedSql.split(';').filter(stmt => stmt.trim().length > 0);

                for (const statement of statements) {
                    // Skip comments and empty lines
                    if (statement.trim().startsWith('--') || statement.trim() === '') {
                        continue;
                    }

                    try {
                        await client.query(statement + ';');
                    } catch (err) {
                        console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
                        throw err;
                    }
                }

                console.log(`Executed seed file: ${seedFile}`);
            }

            await client.query('COMMIT');
            console.log('All achievement seeds committed successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error running achievement seeds, rolled back:', error);
            throw error;
        } finally {
            client.release();
        }

        // Count the achievements
        const countResult = await pool.query('SELECT COUNT(*) FROM achievements');
        const achievementCount = countResult.rows[0].count;

        console.log(`Achievement seeding completed successfully. ${achievementCount} achievements created.`);
        process.exit(0);
    } catch (error) {
        console.error('Error running achievement seeds:', error);
        process.exit(1);
    }
}

runSeeds();
