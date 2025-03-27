const fs = require('fs');
const path = require('path');

// Replace bcrypt with bcryptjs in User.js
try {
  console.log('Replacing bcrypt with bcryptjs in User.js...');
  
  // Read the new User.js file
  const newUserPath = path.join(__dirname, 'src', 'models', 'User.js.new');
  const userPath = path.join(__dirname, 'src', 'models', 'User.js');
  
  if (fs.existsSync(newUserPath)) {
    const newUserContent = fs.readFileSync(newUserPath, 'utf8');
    fs.writeFileSync(userPath, newUserContent);
    console.log('Successfully replaced User.js with bcryptjs implementation');
  } else {
    console.log('User.js.new not found, creating it...');
    
    // Read the original User.js file
    const userContent = fs.readFileSync(userPath, 'utf8');
    
    // Replace bcrypt with bcryptjs
    const updatedContent = userContent.replace(
      "const bcrypt = require('bcrypt');",
      "const bcrypt = require('bcryptjs');"
    );
    
    // Write the updated content back to User.js
    fs.writeFileSync(userPath, updatedContent);
    console.log('Successfully updated User.js to use bcryptjs');
  }
} catch (error) {
  console.error('Error replacing bcrypt with bcryptjs:', error);
}
