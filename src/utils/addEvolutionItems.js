/**
 * Utility script to add missing evolution items to the database
 */
const db = require('../db');

async function addEvolutionItems() {
  try {
    console.log('Starting to add evolution items to the database...');
    
    // List of evolution items to add
    const evolutionItems = [
      {
        name: 'Fighting Evolution Stone',
        effect: 'Evolves certain fighting-type monsters',
        rarity: 'RARE',
        category: 'evolution',
        base_price: 1000
      },
      {
        name: 'Digital Gigabytes',
        effect: 'Evolves certain Digimon to Ultimate level',
        rarity: 'RARE',
        category: 'evolution',
        base_price: 1200
      },
      {
        name: 'Digital Megabytes',
        effect: 'Evolves certain Digimon to Champion level',
        rarity: 'UNCOMMON',
        category: 'evolution',
        base_price: 800
      },
      {
        name: 'Digital Kilobytes',
        effect: 'Evolves certain Digimon to Rookie level',
        rarity: 'COMMON',
        category: 'evolution',
        base_price: 500
      },
      {
        name: 'Digital Repair Kit',
        effect: 'Allows setting any species for Digimon',
        rarity: 'EPIC',
        category: 'evolution',
        base_price: 2000
      },
      {
        name: 'Aurorus Stone',
        effect: 'Adds a random type to a monster during evolution',
        rarity: 'EPIC',
        category: 'evolution',
        base_price: 1500
      }
    ];
    
    // Insert each item if it doesn't already exist
    for (const item of evolutionItems) {
      // Check if the item already exists
      const checkQuery = 'SELECT COUNT(*) as count FROM items WHERE name = $1';
      const checkResult = await db.query(checkQuery, [item.name]);
      const itemExists = parseInt(checkResult.rows[0].count) > 0;
      
      if (itemExists) {
        console.log(`Item ${item.name} already exists in the database.`);
      } else {
        // Insert the item
        const insertQuery = `
          INSERT INTO items (name, effect, rarity, category, base_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const values = [
          item.name,
          item.effect,
          item.rarity,
          item.category,
          item.base_price
        ];
        
        const result = await db.query(insertQuery, values);
        console.log(`Added item ${item.name} to the database.`);
      }
    }
    
    console.log('Finished adding evolution items to the database.');
  } catch (error) {
    console.error('Error adding evolution items:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  addEvolutionItems()
    .then(() => {
      console.log('Script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
} else {
  // Export the function for use in other files
  module.exports = { addEvolutionItems };
}
