const TrainerInventoryChecker = require('./utils/TrainerInventoryChecker');

// Test function to check daycare daypass for a trainer
async function testDaycareDaypass(trainerId) {
  try {
    console.log(`Checking daycare daypass for trainer ID: ${trainerId}`);
    
    // Use our utility to check for daycare daypass
    const result = await TrainerInventoryChecker.checkDaycareDaypass(trainerId);
    
    console.log('Result:', result);
    
    if (result.hasDaypass) {
      console.log(`Trainer has ${result.daypassCount} daycare daypass(es)`);
    } else {
      console.log('Trainer does not have any daycare daypasses');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing daycare daypass:', error);
    return {
      hasDaypass: false,
      daypassCount: 0,
      error: error.message
    };
  }
}

// If this script is run directly, execute the test
if (require.main === module) {
  // Get trainer ID from command line arguments or use a default
  const trainerId = process.argv[2] || 1;
  
  // Run the test
  testDaycareDaypass(trainerId)
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDaycareDaypass };
