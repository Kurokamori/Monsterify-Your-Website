/**
 * Script to add sample auction monsters for testing
 * Run with: node src/scripts/add_sample_auctions.js
 */

const AntiqueAuction = require('../models/AntiqueAuction');

async function addSampleAuctions() {
  try {
    // Create the antique_auctions table if it doesn't exist
    await AntiqueAuction.createTableIfNotExists();
    console.log('Antique auctions table created or already exists');

    // Sample auction monsters
    const sampleAuctions = [
      {
        antique: 'Resolution Rocket',
        image_link: 'https://i.imgur.com/JKYzXPo.png',
        name: 'Chronoflare',
        species1: 'Charizard',
        species2: 'Dialga',
        species3: null,
        type1: 'Fire',
        type2: 'Dragon',
        type3: 'Steel',
        type4: null,
        type5: null,
        attribute: 'Future Paradox'
      },
      {
        antique: 'Resolution Rocket',
        image_link: 'https://i.imgur.com/8XpqRwS.png',
        name: 'Ancientide',
        species1: 'Blastoise',
        species2: 'Tyrantrum',
        species3: null,
        type1: 'Water',
        type2: 'Rock',
        type3: 'Dragon',
        type4: null,
        type5: null,
        attribute: 'Past Paradox'
      },
      {
        antique: 'Fortune Cookie Fusions',
        image_link: 'https://i.imgur.com/pB7Mqr9.png',
        name: 'Luckyblossom',
        species1: 'Meganium',
        species2: 'Togekiss',
        species3: null,
        type1: 'Grass',
        type2: 'Fairy',
        type3: 'Flying',
        type4: null,
        type5: null,
        attribute: 'Fortunate'
      },
      {
        antique: 'Fortune Cookie Fusions',
        image_link: 'https://i.imgur.com/QZVdFYP.png',
        name: 'Prosperwing',
        species1: 'Butterfree',
        species2: 'Celebi',
        species3: null,
        type1: 'Bug',
        type2: 'Psychic',
        type3: 'Grass',
        type4: null,
        type5: null,
        attribute: 'Fortunate'
      },
      {
        antique: 'Lunar Lantern',
        image_link: 'https://i.imgur.com/L5hYfmT.png',
        name: 'Moonglow',
        species1: 'Umbreon',
        species2: 'Lunala',
        species3: null,
        type1: 'Dark',
        type2: 'Ghost',
        type3: 'Psychic',
        type4: null,
        type5: null,
        attribute: 'Lunar'
      },
      {
        antique: 'Lunar Lantern',
        image_link: 'https://i.imgur.com/vXfhMnR.png',
        name: 'Nightshade',
        species1: 'Gengar',
        species2: 'Cresselia',
        species3: null,
        type1: 'Ghost',
        type2: 'Psychic',
        type3: 'Dark',
        type4: null,
        type5: null,
        attribute: 'Lunar'
      }
    ];

    // Add each auction monster
    for (const auction of sampleAuctions) {
      await AntiqueAuction.create(auction);
      console.log(`Added auction monster: ${auction.name} (${auction.antique})`);
    }

    console.log('Sample auction monsters added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample auction monsters:', error);
    process.exit(1);
  }
}

// Run the function
addSampleAuctions();
