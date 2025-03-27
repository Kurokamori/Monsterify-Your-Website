// Migration script to help with the transition from the monolithic index.js to the new modular structure
console.log('Starting migration...');

// Rename the original index.js to index.js.bak
const fs = require('fs');
const path = require('path');

try {
  // Check if index.js.bak already exists
  if (fs.existsSync(path.join(__dirname, 'index.js.bak'))) {
    console.log('Backup file index.js.bak already exists. Skipping backup.');
  } else {
    // Create backup of original index.js
    fs.copyFileSync(
      path.join(__dirname, 'index.js'),
      path.join(__dirname, 'index.js.bak')
    );
    console.log('Created backup of original index.js as index.js.bak');
  }

  // Rename the new index.js.new to index.js
  fs.copyFileSync(
    path.join(__dirname, 'index.js.new'),
    path.join(__dirname, 'index.js')
  );
  console.log('Replaced index.js with new modular version');

  console.log('Migration completed successfully!');
  console.log('You can now start the application with: node src/index.js');
  console.log('If you need to revert to the original version, rename index.js.bak back to index.js');
} catch (error) {
  console.error('Error during migration:', error);
  console.log('Migration failed. Please check the error and try again.');
}

