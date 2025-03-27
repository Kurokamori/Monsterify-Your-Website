const { Pool } = require('pg');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const User = require('../models/User');
require('dotenv').config();

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create a new connection for each function call
const getConnection = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');

    // Get admin user ID
    let adminUser = null;
    try {
      adminUser = await User.findByUsername('Kurokamori');
      console.log('Found admin user:', adminUser ? adminUser.id : 'Not found');
    } catch (error) {
      console.error('Error finding admin user:', error);
    }

    // Create sample trainers
    const trainer1 = await Trainer.create({
      name: 'Ash Ketchum',
      title: 'Pokemon Master',
      player_user_id: adminUser ? adminUser.id : null,
      level: 30,
      currency_amount: 5000,
      faction: 'Kanto',
      species1: 'Human',
      type1: 'Normal',
      type2: 'Fighting',
      favorite_type1: 'Electric',
      favorite_type2: 'Fire',
      gender: 'Male',
      pronouns: 'He/Him',
      age: '10',
      birthplace: 'Pallet Town',
      residence: 'Pallet Town',
      quote: 'I wanna be the very best, like no one ever was!',
      tldr: 'Aspiring Pokemon Master from Pallet Town who never seems to age.',
      main_ref: 'https://via.placeholder.com/400x600/1e2532/d6a339?text=Ash+Ketchum'
    });

    console.log('Created trainer:', trainer1.name);

    const trainer2 = await Trainer.create({
      name: 'Misty',
      title: 'Water Gym Leader',
      player_user_id: adminUser ? adminUser.id : null,
      level: 28,
      currency_amount: 4500,
      faction: 'Kanto',
      species1: 'Human',
      type1: 'Water',
      favorite_type1: 'Water',
      gender: 'Female',
      pronouns: 'She/Her',
      age: '12',
      birthplace: 'Cerulean City',
      residence: 'Cerulean City',
      quote: 'Water Pokemon are the best!',
      tldr: 'Cerulean City Gym Leader specializing in Water-type Pokemon.',
      main_ref: 'https://via.placeholder.com/400x600/1e2532/d6a339?text=Misty'
    });

    console.log('Created trainer:', trainer2.name);

    // Create sample monsters for Ash
    const pikachu = await Monster.create({
      trainer_id: trainer1.id,
      name: 'Pikachu',
      level: 30,
      species1: 'Mouse Pokemon',
      type1: 'Electric',
      attribute: 'Variable',
      img_link: 'https://via.placeholder.com/300x300/1e2532/d6a339?text=Pikachu',
      box_number: 1 // Battle box
    });

    console.log('Created monster:', pikachu.name);

    const charizard = await Monster.create({
      trainer_id: trainer1.id,
      name: 'Charizard',
      level: 36,
      species1: 'Flame Pokemon',
      type1: 'Fire',
      type2: 'Flying',
      attribute: 'Vaccine',
      img_link: 'https://via.placeholder.com/300x300/1e2532/d6a339?text=Charizard',
      box_number: 1 // Battle box
    });

    console.log('Created monster:', charizard.name);

    // Create sample monsters for Misty
    const starmie = await Monster.create({
      trainer_id: trainer2.id,
      name: 'Starmie',
      level: 28,
      species1: 'Mysterious Pokemon',
      type1: 'Water',
      type2: 'Psychic',
      attribute: 'Data',
      img_link: 'https://via.placeholder.com/300x300/1e2532/d6a339?text=Starmie',
      box_number: 1 // Battle box
    });

    console.log('Created monster:', starmie.name);

    const gyarados = await Monster.create({
      trainer_id: trainer2.id,
      name: 'Gyarados',
      level: 30,
      species1: 'Atrocious Pokemon',
      type1: 'Water',
      type2: 'Flying',
      attribute: 'Virus',
      img_link: 'https://via.placeholder.com/300x300/1e2532/d6a339?text=Gyarados',
      box_number: 1 // Battle box
    });

    console.log('Created monster:', gyarados.name);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
