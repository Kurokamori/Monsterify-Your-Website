/**
 * Boss-related slash commands
 */
module.exports = [
  {
    name: 'boss',
    description: 'Boss battle commands',
    options: [
      {
        name: 'status',
        description: 'Check current boss status',
        type: 1 // SUB_COMMAND
      },
      {
        name: 'attack',
        description: 'Attack the current boss',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          },
          {
            name: 'damage',
            description: 'Amount of damage to deal',
            type: 4, // INTEGER
            required: true
          },
          {
            name: 'source',
            description: 'Source of the damage',
            type: 3, // STRING
            required: false,
            choices: [
              { name: 'Writing', value: 'writing' },
              { name: 'Art', value: 'art' },
              { name: 'Task', value: 'task' },
              { name: 'Activity', value: 'activity' }
            ]
          }
        ]
      },
      {
        name: 'contribution',
        description: 'Check your contribution to the current boss',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'leaderboard',
        description: 'View the boss battle leaderboard',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'boss_id',
            description: 'Boss ID (defaults to current boss)',
            type: 3, // STRING
            required: false
          },
          {
            name: 'limit',
            description: 'Number of entries to show',
            type: 4, // INTEGER
            required: false
          }
        ]
      },
      {
        name: 'claim-rewards',
        description: 'Claim rewards from a defeated boss',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          },
          {
            name: 'boss_id',
            description: 'Boss ID',
            type: 3, // STRING
            required: true
          }
        ]
      }
    ]
  },
  {
    name: 'create-boss',
    description: 'Create a new boss (admin only)',
    options: [
      {
        name: 'name',
        description: 'Boss name',
        type: 3, // STRING
        required: true
      },
      {
        name: 'description',
        description: 'Boss description',
        type: 3, // STRING
        required: true
      },
      {
        name: 'max_health',
        description: 'Boss maximum health',
        type: 4, // INTEGER
        required: true
      },
      {
        name: 'image_url',
        description: 'Boss image URL',
        type: 3, // STRING
        required: false
      },
      {
        name: 'type',
        description: 'Boss type',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Normal', value: 'normal' },
          { name: 'Fire', value: 'fire' },
          { name: 'Water', value: 'water' },
          { name: 'Electric', value: 'electric' },
          { name: 'Grass', value: 'grass' },
          { name: 'Psychic', value: 'psychic' },
          { name: 'Dark', value: 'dark' }
        ]
      }
    ]
  }
];
