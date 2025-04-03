const MonsterRoller = require('../utils/MonsterRoller');

// Mock the Pokemon, Digimon, and Yokai models
jest.mock('../models/Pokemon', () => ({
  getRandom: jest.fn().mockResolvedValue([
    {
      name: 'Pikachu',
      Type1: 'Electric',
      Type2: null,
      data: { Rarity: 'Common' }
    }
  ])
}));

jest.mock('../models/Digimon', () => ({
  getRandom: jest.fn().mockResolvedValue([
    {
      name: 'Agumon',
      types: 'Reptile',
      attributes: 'Vaccine',
      data: { Stage: 'Rookie' }
    }
  ])
}));

jest.mock('../models/Yokai', () => ({
  getRandom: jest.fn().mockResolvedValue([
    {
      Name: 'Jibanyan',
      Tribe: 'Charming',
      Attribute: 'Fire',
      data: { Rank: 'B' }
    }
  ])
}));

// Test different monster rolling scenarios
async function testMonsterRoller() {
  try {
    console.log('Testing MonsterRoller...');
    
    // Test 1: Basic monster roll with default parameters
    console.log('\nTest 1: Basic monster roll with default parameters');
    const monster1 = await MonsterRoller.rollOne();
    console.log('Result:', JSON.stringify(monster1, null, 2));
    
    // Test 2: Roll with specific species override
    console.log('\nTest 2: Roll with specific species override');
    const monster2 = await MonsterRoller.rollOne({
      overrideParams: {
        species: 'Pokemon'
      }
    });
    console.log('Result:', JSON.stringify(monster2, null, 2));
    
    // Test 3: Roll with specific type override
    console.log('\nTest 3: Roll with specific type override');
    const monster3 = await MonsterRoller.rollOne({
      overrideParams: {
        types: 'Electric'
      }
    });
    console.log('Result:', JSON.stringify(monster3, null, 2));
    
    // Test 4: Roll with specific filters
    console.log('\nTest 4: Roll with specific filters');
    const monster4 = await MonsterRoller.rollOne({
      filters: {
        pokemon: {
          rarity: 'Common'
        },
        includeSpecies: ['Pokemon']
      }
    });
    console.log('Result:', JSON.stringify(monster4, null, 2));
    
    // Test 5: Roll with complex parameters (similar to prompt reward)
    console.log('\nTest 5: Roll with complex parameters (similar to prompt reward)');
    const monster5 = await MonsterRoller.rollOne({
      filters: {
        pokemon: { rarity: 'Common' },
        includeSpecies: ['Pokemon']
      },
      overrideParams: {
        minSpecies: 1,
        maxSpecies: 1
      }
    });
    console.log('Result:', JSON.stringify(monster5, null, 2));
    
    return {
      monster1,
      monster2,
      monster3,
      monster4,
      monster5
    };
  } catch (error) {
    console.error('Error testing MonsterRoller:', error);
    throw error;
  }
}

// Run the test
testMonsterRoller()
  .then((results) => {
    console.log('\nAll tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
