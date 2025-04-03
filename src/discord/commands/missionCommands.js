/**
 * Mission-related slash commands
 */
module.exports = [
  {
    name: 'mission',
    description: 'Mission commands',
    options: [
      {
        name: 'list',
        description: 'List available missions',
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
        name: 'start',
        description: 'Start a mission',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          },
          {
            name: 'mission_id',
            description: 'Mission ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'status',
        description: 'Check your active mission status',
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
        name: 'abandon',
        description: 'Abandon your active mission',
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
        name: 'history',
        description: 'View your mission history',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          },
          {
            name: 'limit',
            description: 'Number of entries to show',
            type: 4, // INTEGER
            required: false
          }
        ]
      }
    ]
  },
  {
    name: 'create-mission',
    description: 'Create a new mission (admin only)',
    options: [
      {
        name: 'name',
        description: 'Mission name',
        type: 3, // STRING
        required: true
      },
      {
        name: 'description',
        description: 'Mission description',
        type: 3, // STRING
        required: true
      },
      {
        name: 'type',
        description: 'Mission type',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Writing', value: 'writing' },
          { name: 'Art', value: 'art' },
          { name: 'Task', value: 'task' },
          { name: 'Habit', value: 'habit' },
          { name: 'Garden', value: 'garden' },
          { name: 'Boss', value: 'boss' },
          { name: 'Collection', value: 'collection' }
        ]
      },
      {
        name: 'difficulty',
        description: 'Mission difficulty',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Easy', value: 'easy' },
          { name: 'Normal', value: 'normal' },
          { name: 'Hard', value: 'hard' },
          { name: 'Epic', value: 'epic' }
        ]
      }
    ]
  }
];
