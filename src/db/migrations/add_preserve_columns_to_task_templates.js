/**
 * Migration script to add preserve_times and preserve_notifications columns to task_templates table
 */

const pool = require('../../db');

const addPreserveColumnsToTaskTemplates = async () => {
  try {
    console.log('Starting migration: Adding preserve columns to task_templates table');
    
    // Check if columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'task_templates' 
      AND column_name IN ('preserve_times', 'preserve_notifications');
    `;
    
    const checkResult = await pool.query(checkColumnsQuery);
    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Add columns if they don't exist
    if (!existingColumns.includes('preserve_times')) {
      console.log('Adding preserve_times column');
      await pool.query(`
        ALTER TABLE task_templates 
        ADD COLUMN preserve_times BOOLEAN DEFAULT false;
      `);
    } else {
      console.log('preserve_times column already exists');
    }
    
    if (!existingColumns.includes('preserve_notifications')) {
      console.log('Adding preserve_notifications column');
      await pool.query(`
        ALTER TABLE task_templates 
        ADD COLUMN preserve_notifications BOOLEAN DEFAULT false;
      `);
    } else {
      console.log('preserve_notifications column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Execute the migration
addPreserveColumnsToTaskTemplates()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
