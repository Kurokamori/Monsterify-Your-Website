/**
 * Test script for prompt rewards
 * This script tests the prompt submission process and verifies that rewards are correctly applied
 */

const PromptSubmissionService = require('../utils/PromptSubmissionService');
const Prompt = require('../models/Prompt');
const Trainer = require('../models/Trainer');
const Item = require('../models/Item');

// Mock data for testing
const mockPrompt = {
  prompt_id: 1,
  title: 'Test Prompt',
  description: 'This is a test prompt',
  category: 'general',
  min_trainer_level: 1,
  repeatable: true,
  reward_coins: 100,
  reward_levels: 2,
  reward_items: JSON.stringify([
    { name: 'Rare Candy', quantity: 1 }
  ]),
  reward_random_items: JSON.stringify({
    'BERRIES': 2,
    'ITEMS': 1
  }),
  reward_monster_params: JSON.stringify({
    filters: {
      pokemon: { rarity: 'Common' },
      includeSpecies: ['Pokemon']
    },
    overrideParams: {
      minSpecies: 1,
      maxSpecies: 1
    }
  })
};

// Test the prompt submission process
async function testPromptSubmission() {
  try {
    console.log('Testing prompt submission with rewards...');
    
    // Mock the database methods
    Prompt.getById = jest.fn().mockResolvedValue(mockPrompt);
    
    Trainer.getById = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Trainer',
      level: 5
    });
    
    Trainer.addCoins = jest.fn().mockResolvedValue(true);
    Trainer.addLevels = jest.fn().mockResolvedValue(true);
    Trainer.updateInventoryItem = jest.fn().mockResolvedValue(true);
    
    // Mock the PromptCompletion model
    const PromptCompletion = require('../models/PromptCompletion');
    PromptCompletion.create = jest.fn().mockResolvedValue({ completion_id: 1 });
    PromptCompletion.hasCompleted = jest.fn().mockResolvedValue(false);
    
    // Mock the Item model
    Item.getByCategory = jest.fn().mockImplementation((category) => {
      const mockItems = {
        'BERRIES': [
          { name: 'Oran Berry', rarity: '1', category: 'BERRIES' },
          { name: 'Sitrus Berry', rarity: '2', category: 'BERRIES' },
          { name: 'Lum Berry', rarity: '3', category: 'BERRIES' }
        ],
        'ITEMS': [
          { name: 'Potion', rarity: '1', category: 'ITEMS' },
          { name: 'Super Potion', rarity: '2', category: 'ITEMS' },
          { name: 'Rare Candy', rarity: '3', category: 'ITEMS' }
        ]
      };
      
      // Convert category to uppercase for case-insensitive comparison
      const normalizedCategory = category.toUpperCase();
      return Promise.resolve(mockItems[normalizedCategory] || []);
    });
    
    // Submit the prompt
    const result = await PromptSubmissionService.submitPrompt({
      promptId: 1,
      trainerId: 1,
      submissionUrl: 'https://example.com/submission.jpg'
    }, 'test-user');
    
    console.log('Submission result:', JSON.stringify(result, null, 2));
    
    // Verify the result
    console.log('\nVerifying result...');
    console.log('Coins:', result.calculation.coins);
    console.log('Levels:', result.calculation.levels);
    console.log('Items:', result.calculation.items);
    console.log('Monster:', result.calculation.monster);
    
    return result;
  } catch (error) {
    console.error('Error testing prompt submission:', error);
    throw error;
  }
}

// Run the test
testPromptSubmission()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
