const TrainerInventoryChecker = require('./utils/TrainerInventoryChecker');
const Trainer = require('./models/Trainer');
const MonthlyAdopt = require('./models/MonthlyAdopt');

// Test function to check daycare daypass for a trainer
async function testAdoptionCenter() {
  try {
    console.log('Testing Adoption Center functionality');
    
    // Get all trainers
    const trainers = await Trainer.getAll();
    console.log(`Found ${trainers.length} trainers`);
    
    if (trainers.length === 0) {
      console.log('No trainers found. Exiting test.');
      return;
    }
    
    // Test the first trainer
    const trainer = trainers[0];
    console.log(`Testing with trainer: ${trainer.name} (ID: ${trainer.id})`);
    
    // Check if trainer has a daycare daypass
    const daypassCheck = await TrainerInventoryChecker.checkDaycareDaypass(trainer.id);
    console.log('Daypass check result:', daypassCheck);
    
    // Ensure current month adopts exist
    await MonthlyAdopt.ensureCurrentMonthAdopts();
    console.log('Ensured current month adopts exist');
    
    // Get current month adopts
    const currentMonthAdopts = await MonthlyAdopt.getByYearAndMonth(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1,
      10
    );
    console.log(`Found ${currentMonthAdopts.adopts.length} adopts for current month`);
    
    return {
      success: true,
      trainer,
      daypassCheck,
      currentMonthAdopts
    };
  } catch (error) {
    console.error('Error testing adoption center:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// If this script is run directly, execute the test
if (require.main === module) {
  // Run the test
  testAdoptionCenter()
    .then((result) => {
      console.log('Test completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAdoptionCenter };
