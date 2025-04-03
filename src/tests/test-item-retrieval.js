const Item = require('../models/Item');
const PromptSubmissionService = require('../utils/PromptSubmissionService');

// Mock the Item model
jest.mock('../models/Item', () => ({
  getByCategory: jest.fn().mockImplementation((category) => {
    const mockItems = {
      'berries': [
        { name: 'Oran Berry', rarity: '1' },
        { name: 'Sitrus Berry', rarity: '2' },
        { name: 'Lum Berry', rarity: '3' },
        { name: 'Cheri Berry', rarity: '1' }
      ],
      'items': [
        { name: 'Potion', rarity: '1' },
        { name: 'Super Potion', rarity: '2' },
        { name: 'Hyper Potion', rarity: '3' },
        { name: 'Rare Candy', rarity: '3' }
      ],
      'balls': [
        { name: 'Poké Ball', rarity: '1' },
        { name: 'Great Ball', rarity: '2' },
        { name: 'Ultra Ball', rarity: '3' }
      ]
    };
    return Promise.resolve(mockItems[category.toLowerCase()] || []);
  })
}));

// Test the item retrieval functionality
async function testItemRetrieval() {
  try {
    console.log('Testing item retrieval...');
    
    // Test 1: Get items from BERRIES category
    console.log('\nTest 1: Get items from BERRIES category');
    const berries = await PromptSubmissionService.getRandomItemsFromCategory('BERRIES', 2);
    console.log('Result:', JSON.stringify(berries, null, 2));
    
    // Test 2: Get items from ITEMS category
    console.log('\nTest 2: Get items from ITEMS category');
    const items = await PromptSubmissionService.getRandomItemsFromCategory('ITEMS', 3);
    console.log('Result:', JSON.stringify(items, null, 2));
    
    // Test 3: Get items from BALLS category
    console.log('\nTest 3: Get items from BALLS category');
    const balls = await PromptSubmissionService.getRandomItemsFromCategory('BALLS', 1);
    console.log('Result:', JSON.stringify(balls, null, 2));
    
    // Test 4: Get items from non-existent category (should use fallback)
    console.log('\nTest 4: Get items from non-existent category (should use fallback)');
    const nonExistent = await PromptSubmissionService.getRandomItemsFromCategory('NON_EXISTENT', 2);
    console.log('Result:', JSON.stringify(nonExistent, null, 2));
    
    return {
      berries,
      items,
      balls,
      nonExistent
    };
  } catch (error) {
    console.error('Error testing item retrieval:', error);
    throw error;
  }
}

// Run the test
testItemRetrieval()
  .then((results) => {
    console.log('\nAll tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
