/**
 * Mock data service for development
 * This file provides consistent mock data for the application until a backend is available
 */

// Monster Types
export const MONSTER_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 
  'Steel', 'Fairy'
];

// Monster Attributes (for Digimon-like monsters)
export const MONSTER_ATTRIBUTES = [
  'Data', 'Virus', 'Vaccine', 'Free', 'Variable'
];

// Monster Species Sources
export const MONSTER_SOURCES = [
  'Pokemon', 'Digimon', 'Yokai', 'Pals', 'Nexomon'
];

// Mock Monsters
export const monsters = [
  {
    id: 1,
    name: 'Leafeon',
    species: 'Leafeon',
    source: 'Pokemon',
    image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Leafeon',
    level: 25,
    types: ['Grass'],
    attribute: null,
    description: 'A leafy evolution of Eevee that thrives in forests and gardens.',
    height: '1.0 m',
    weight: '25.5 kg',
    category: 'Verdant Pokémon',
    abilities: ['Leaf Guard', 'Chlorophyll (Hidden)'],
    stats: {
      hp: 65,
      attack: 110,
      defense: 130,
      sp_attack: 60,
      sp_defense: 65,
      speed: 95
    },
    evolutions: ['Eevee', 'Leafeon'],
    habitat: 'Forests and lush gardens',
    rarity: 'Uncommon',
    artist: 'Jane Doe',
    artist_caption: 'Art by Jane Doe',
    trainer_id: 1,
    box_number: 1,
    box_position: 1,
    gender: 'Male',
    friendship: 70,
    nature: 'Calm',
    moves: [
      { name: 'Leaf Blade', type: 'Grass', power: 90, accuracy: 100 },
      { name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 100 },
      { name: 'Synthesis', type: 'Grass', power: 0, accuracy: 0 },
      { name: 'Sunny Day', type: 'Fire', power: 0, accuracy: 0 }
    ]
  },
  {
    id: 2,
    name: 'Flameon',
    species: 'Flameon',
    source: 'Pokemon',
    image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Flameon',
    level: 27,
    types: ['Fire'],
    attribute: null,
    description: 'A fiery evolution of Eevee with a passionate temperament.',
    height: '0.9 m',
    weight: '24.5 kg',
    category: 'Flame Pokémon',
    abilities: ['Flash Fire', 'Blaze (Hidden)'],
    stats: {
      hp: 65,
      attack: 130,
      defense: 60,
      sp_attack: 95,
      sp_defense: 110,
      speed: 65
    },
    evolutions: ['Eevee', 'Flameon'],
    habitat: 'Volcanic areas and warm climates',
    rarity: 'Uncommon',
    artist: 'John Smith',
    artist_caption: 'Art by John Smith',
    trainer_id: 1,
    box_number: 1,
    box_position: 2,
    gender: 'Female',
    friendship: 85,
    nature: 'Brave',
    moves: [
      { name: 'Flamethrower', type: 'Fire', power: 90, accuracy: 100 },
      { name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 100 },
      { name: 'Fire Spin', type: 'Fire', power: 35, accuracy: 85 },
      { name: 'Sunny Day', type: 'Fire', power: 0, accuracy: 0 }
    ]
  },
  {
    id: 3,
    name: 'Aqueon',
    species: 'Aqueon',
    source: 'Pokemon',
    image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Aqueon',
    level: 22,
    types: ['Water'],
    attribute: null,
    description: 'A water evolution of Eevee that can breathe underwater.',
    height: '1.0 m',
    weight: '29.0 kg',
    category: 'Bubble Jet Pokémon',
    abilities: ['Water Absorb', 'Hydration (Hidden)'],
    stats: {
      hp: 130,
      attack: 65,
      defense: 60,
      sp_attack: 110,
      sp_defense: 95,
      speed: 65
    },
    evolutions: ['Eevee', 'Aqueon'],
    habitat: 'Lakes, rivers, and coastal areas',
    rarity: 'Uncommon',
    artist: 'Sarah Johnson',
    artist_caption: 'Art by Sarah Johnson',
    trainer_id: 2,
    box_number: 1,
    box_position: 1,
    gender: 'Male',
    friendship: 75,
    nature: 'Modest',
    moves: [
      { name: 'Hydro Pump', type: 'Water', power: 110, accuracy: 80 },
      { name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 100 },
      { name: 'Aqua Ring', type: 'Water', power: 0, accuracy: 0 },
      { name: 'Rain Dance', type: 'Water', power: 0, accuracy: 0 }
    ]
  }
];

// Mock Trainers
export const trainers = [
  {
    id: 1,
    name: 'Ash Ketchum',
    avatar_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Ash',
    level: 25,
    experience: 12500,
    next_level_exp: 15000,
    monsters_count: 42,
    badges_count: 8,
    coins: 8750,
    join_date: '2023-01-15T00:00:00Z',
    last_active: '2023-06-20T14:30:00Z',
    stats: {
      battles_won: 87,
      battles_lost: 23,
      missions_completed: 35,
      bosses_defeated: 5
    },
    bio: 'A passionate trainer from Pallet Town who dreams of becoming a Pokémon Master.',
    favorite_type: 'Electric',
    user_id: 1
  },
  {
    id: 2,
    name: 'Misty',
    avatar_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Misty',
    level: 23,
    experience: 10800,
    next_level_exp: 12000,
    monsters_count: 28,
    badges_count: 6,
    coins: 6500,
    join_date: '2023-02-10T00:00:00Z',
    last_active: '2023-06-19T09:45:00Z',
    stats: {
      battles_won: 65,
      battles_lost: 18,
      missions_completed: 27,
      bosses_defeated: 3
    },
    bio: 'A Water-type specialist from Cerulean City with a fiery personality.',
    favorite_type: 'Water',
    user_id: 1
  }
];

// Mock Submissions
export const submissions = [
  {
    id: 1,
    type: 'monster',
    name: 'Thunderclaw',
    description: 'A powerful electric-type monster with sharp claws that can generate lightning.',
    image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Thunderclaw',
    status: 'pending',
    submitted_date: '2023-05-15T00:00:00Z',
    feedback: null,
    user_id: 1,
    trainer_id: 1,
    rewards: {
      levels: 5,
      coins: 250,
      items: [
        { name: 'Thunder Stone', quantity: 1 }
      ]
    }
  },
  {
    id: 2,
    type: 'location',
    name: 'Crystal Cavern',
    description: 'A mysterious cave filled with glowing crystals that enhance monster abilities.',
    image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Crystal+Cavern',
    status: 'approved',
    submitted_date: '2023-04-10T00:00:00Z',
    feedback: 'Great concept! We\'ve added this to the game with some minor adjustments.',
    user_id: 1,
    trainer_id: 1,
    rewards: {
      levels: 8,
      coins: 400,
      items: [
        { name: 'Crystal Shard', quantity: 3 },
        { name: 'Rare Candy', quantity: 1 }
      ]
    }
  }
];

// Mock Users
export const users = [
  {
    id: 1,
    username: 'ash123',
    display_name: 'Ash',
    email: 'ash@example.com',
    discord_id: 'ash#1234',
    role: 'user',
    created_at: '2023-01-15T00:00:00Z',
    last_login: '2023-06-20T14:30:00Z',
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        discord: true
      },
      monsterRollerSettings: {
        enabledTypes: ['Pokemon', 'Digimon'],
        allowedMonsters: ['Pokemon', 'Digimon', 'Yokai', 'Pals', 'Nexomon'],
        excludedMonsters: []
      }
    }
  }
];

// Mock Adventures
export const adventures = [
  {
    id: 1,
    title: 'The Lost Temple',
    description: 'Explore the ancient temple hidden deep in the jungle to discover its secrets.',
    status: 'active',
    creator_id: 1,
    max_encounters: 5,
    current_encounter_count: 2,
    is_custom: false,
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2023-06-15T00:00:00Z',
    participants: [
      { user_id: 1, trainer_id: 1, joined_at: '2023-06-01T00:00:00Z', message_count: 15, word_count: 750 }
    ],
    encounters: [
      {
        id: 1,
        adventure_id: 1,
        title: 'Entrance Guardian',
        description: 'A massive stone guardian blocks the entrance to the temple.',
        image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Stone+Guardian',
        created_at: '2023-06-01T00:00:00Z',
        completed_at: '2023-06-05T00:00:00Z'
      },
      {
        id: 2,
        adventure_id: 1,
        title: 'Puzzle Chamber',
        description: 'A chamber filled with ancient puzzles that must be solved to proceed.',
        image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Puzzle+Chamber',
        created_at: '2023-06-10T00:00:00Z',
        completed_at: null
      }
    ]
  }
];

// Mock Bosses
export const bosses = [
  {
    id: 1,
    name: 'Dragon Lord',
    image_path: 'https://via.placeholder.com/300/1e2532/d6a339?text=Dragon+Lord',
    level: 50,
    difficulty: 'hard',
    element: 'Fire',
    description: 'A powerful dragon that rules over the volcanic mountains. Bring water and ice type monsters.',
    weaknesses: ['Water', 'Ice'],
    resistances: ['Fire', 'Grass'],
    max_health: 10000,
    current_health: 7500,
    rewards: [
      { type: 'coin', name: 'Coins', quantity: 2000 },
      { type: 'exp', name: 'Experience', quantity: 1000 },
      { type: 'item', name: 'Dragon Scale', quantity: 1 }
    ],
    start_date: '2023-06-01T00:00:00Z',
    end_date: '2023-06-30T00:00:00Z'
  }
];

// Export a function to get mock data with a delay to simulate API calls
export const getMockData = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};
