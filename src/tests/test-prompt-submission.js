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

const mockTrainer = {
  id: 1,
  name: 'Test Trainer',
  level: 5
};

// Mock the database methods
jest.mock('../models/Prompt', () => ({
  getById: jest.fn().mockResolvedValue(mockPrompt)
}));

jest.mock('../models/Trainer', () => ({
  getById: jest.fn().mockResolvedValue(mockTrainer),
  addCoins: jest.fn().mockResolvedValue(true),
  addLevels: jest.fn().mockResolvedValue(true),
  updateInventoryItem: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/PromptCompletion', () => ({
  create: jest.fn().mockResolvedValue({ completion_id: 1 }),
  hasCompleted: jest.fn().mockResolvedValue(false)
}));

jest.mock('../models/Item', () => ({
  getByCategory: jest.fn().mockImplementation((category) => {
    const mockItems = {
      'berries': [
        { name: 'Oran Berry', rarity: '1' },
        { name: 'Sitrus Berry', rarity: '2' },
        { name: 'Lum Berry', rarity: '3' }
      ],
      'items': [
        { name: 'Potion', rarity: '1' },
        { name: 'Super Potion', rarity: '2' },
        { name: 'Rare Candy', rarity: '3' }
      ]
    };
    return Promise.resolve(mockItems[category.toLowerCase()] || []);
  })
}));

// Test the prompt submission process
async function testPromptSubmission() {
  try {
    console.log('Testing prompt submission...');
    
    const result = await PromptSubmissionService.submitPrompt({
      promptId: 1,
      trainerId: 1,
      submissionUrl: 'https://example.com/submission.jpg'
    }, 'test-user');
    
    console.log('Submission result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error testing prompt submission:', error);
    throw error;
  }
}

// Run the test
testPromptSubmission()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
