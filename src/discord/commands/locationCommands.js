/**
 * Location-related slash commands
 */
module.exports = [
  {
    name: 'garden',
    description: 'Garden activities',
    options: [
      {
        name: 'start',
        description: 'Start a garden activity',
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
        name: 'complete',
        description: 'Complete a garden activity',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'activity_id',
            description: 'Activity ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'harvest',
        description: 'Harvest your garden',
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
        name: 'status',
        description: 'Check your garden status',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          }
        ]
      }
    ]
  },
  {
    name: 'farm',
    description: 'Farm activities',
    options: [
      {
        name: 'start',
        description: 'Start a farm activity',
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
        name: 'complete',
        description: 'Complete a farm activity',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'activity_id',
            description: 'Activity ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'status',
        description: 'Check your farm status',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          }
        ]
      }
    ]
  },
  {
    name: 'pirates',
    description: 'Pirates Dock activities',
    options: [
      {
        name: 'start',
        description: 'Start a Pirates Dock activity',
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
        name: 'complete',
        description: 'Complete a Pirates Dock activity',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'activity_id',
            description: 'Activity ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'status',
        description: 'Check your Pirates Dock status',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          }
        ]
      }
    ]
  },
  {
    name: 'game-corner',
    description: 'Game Corner activities',
    options: [
      {
        name: 'start',
        description: 'Start a Game Corner activity',
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
        name: 'complete',
        description: 'Complete a Game Corner activity',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'activity_id',
            description: 'Activity ID',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'status',
        description: 'Check your Game Corner status',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID',
            type: 3, // STRING
            required: true
          }
        ]
      }
    ]
  }
];
