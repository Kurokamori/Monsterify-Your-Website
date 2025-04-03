const pool = require('../db');

/**
 * Migration to add date-related fields to the missions table
 */
async function addDateFieldsToMissions() {
  try {
    console.log('Adding date fields to missions table...');
    
    // Check if the columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'missions' 
      AND column_name IN ('available_dates', 'available_days');
    `;
    
    const checkResult = await pool.query(checkQuery);
    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Add available_dates column if it doesn't exist
    if (!existingColumns.includes('available_dates')) {
      await pool.query(`
        ALTER TABLE missions 
        ADD COLUMN available_dates TEXT[]
      `);
      console.log('Added available_dates column to missions table');
    }
    
    // Add available_days column if it doesn't exist
    if (!existingColumns.includes('available_days')) {
      await pool.query(`
        ALTER TABLE missions 
        ADD COLUMN available_days TEXT[]
      `);
      console.log('Added available_days column to missions table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  }
}

module.exports = addDateFieldsToMissions;

// Run the migration if this file is executed directly
if (require.main === module) {
  addDateFieldsToMissions()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
