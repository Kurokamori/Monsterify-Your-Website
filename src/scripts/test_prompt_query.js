const pool = require('../db');
const Prompt = require('../models/Prompt');

async function testPromptQueries() {
  try {
    console.log('Testing database connection...');
    
    // Test database connection
    const testQuery = 'SELECT NOW() as time';
    const testResult = await pool.query(testQuery);
    console.log('Database connection successful:', testResult.rows[0].time);
    
    // Test getByCategory method
    console.log('\nTesting getByCategory method...');
    const generalPrompts = await Prompt.getByCategory('general');
    console.log(`Found ${generalPrompts.length} general prompts`);
    
    // Test getByCategory with monthly category
    console.log('\nTesting getByCategory with monthly category...');
    const monthlyPrompts = await Prompt.getByCategory('monthly');
    console.log(`Found ${monthlyPrompts.length} monthly prompts for current month`);
    
    // Test getAvailableForTrainer method
    console.log('\nTesting getAvailableForTrainer method...');
    
    // Get a trainer ID from the database
    const trainerQuery = 'SELECT id FROM trainers LIMIT 1';
    const trainerResult = await pool.query(trainerQuery);
    
    if (trainerResult.rows.length > 0) {
      const trainerId = trainerResult.rows[0].id;
      console.log(`Using trainer ID: ${trainerId}`);
      
      // Test with general category
      const availableGeneralPrompts = await Prompt.getAvailableForTrainer(trainerId, 'general');
      console.log(`Found ${availableGeneralPrompts.length} available general prompts for trainer ${trainerId}`);
      
      // Test with monthly category
      const availableMonthlyPrompts = await Prompt.getAvailableForTrainer(trainerId, 'monthly');
      console.log(`Found ${availableMonthlyPrompts.length} available monthly prompts for trainer ${trainerId}`);
    } else {
      console.log('No trainers found in the database');
    }
    
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing prompt queries:', error);
    process.exit(1);
  }
}

testPromptQueries();
