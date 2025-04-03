const pool = require('../db');

async function checkPromptTemplates() {
  try {
    console.log('Checking prompt_templates table...');
    
    // Check if the table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prompt_templates'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.error('ERROR: prompt_templates table does not exist!');
      console.log('Please run the script to create the prompt tables:');
      console.log('node src/scripts/create_prompt_tables.js');
      process.exit(1);
    }
    
    console.log('✓ prompt_templates table exists');
    
    // Check if the table has data
    const dataCheck = await pool.query('SELECT COUNT(*) FROM prompt_templates;');
    const count = parseInt(dataCheck.rows[0].count);
    
    if (count === 0) {
      console.error('ERROR: prompt_templates table is empty!');
      console.log('Please run the script to create the prompt tables which includes sample data:');
      console.log('node src/scripts/create_prompt_tables.js');
      process.exit(1);
    }
    
    console.log(`✓ prompt_templates table has ${count} rows of data`);
    
    // Check data by category
    const categories = ['general', 'progression', 'legendary', 'monthly', 'event'];
    
    for (const category of categories) {
      const categoryCheck = await pool.query('SELECT COUNT(*) FROM prompt_templates WHERE category = $1;', [category]);
      const categoryCount = parseInt(categoryCheck.rows[0].count);
      
      console.log(`  - Category "${category}": ${categoryCount} prompts`);
      
      if (categoryCount === 0) {
        console.warn(`  ⚠ WARNING: No prompts found for category "${category}"`);
      }
    }
    
    console.log('Prompt templates check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error checking prompt_templates table:', error);
    process.exit(1);
  }
}

checkPromptTemplates();
