/**
 * Slash command definitions
 */
module.exports = [
  {
    name: 'menu',
    description: 'Show the main menu'
  },
  {
    name: 'town',
    description: 'Show the Town Square menu'
  },
  {
    name: 'market',
    description: 'Show the Market menu'
  },
  {
    name: 'submission',
    description: 'Show the Submission menu'
  },
  {
    name: 'schedule',
    description: 'Show the Schedule menu'
  },
  {
    name: 'add-task',
    description: 'Add a new task to your schedule',
    options: [
      {
        name: 'title',
        description: 'Task title',
        type: 3, // STRING
        required: true
      },
      {
        name: 'description',
        description: 'Task description',
        type: 3, // STRING
        required: false
      },
      {
        name: 'due_date',
        description: 'Due date (YYYY-MM-DD)',
        type: 3, // STRING
        required: false
      },
      {
        name: 'priority',
        description: 'Task priority',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' }
        ]
      }
    ]
  },
  {
    name: 'add-habit',
    description: 'Add a new habit to track',
    options: [
      {
        name: 'name',
        description: 'Habit name',
        type: 3, // STRING
        required: true
      },
      {
        name: 'frequency',
        description: 'Habit frequency',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Daily', value: 'daily' },
          { name: 'Weekly', value: 'weekly' },
          { name: 'Monthly', value: 'monthly' }
        ]
      },
      {
        name: 'description',
        description: 'Habit description',
        type: 3, // STRING
        required: false
      }
    ]
  },
  {
    name: 'create-schedule',
    description: 'Create a new schedule',
    options: [
      {
        name: 'name',
        description: 'Schedule name',
        type: 3, // STRING
        required: true
      },
      {
        name: 'description',
        description: 'Schedule description',
        type: 3, // STRING
        required: false
      }
    ]
  },
  {
    name: 'edit-task',
    description: 'Edit an existing task',
    options: [
      {
        name: 'task_id',
        description: 'Task ID',
        type: 3, // STRING
        required: true
      },
      {
        name: 'title',
        description: 'New task title',
        type: 3, // STRING
        required: false
      },
      {
        name: 'description',
        description: 'New task description',
        type: 3, // STRING
        required: false
      },
      {
        name: 'due_date',
        description: 'New due date (YYYY-MM-DD)',
        type: 3, // STRING
        required: false
      },
      {
        name: 'priority',
        description: 'New task priority',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' }
        ]
      },
      {
        name: 'status',
        description: 'New task status',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Pending', value: 'pending' },
          { name: 'In Progress', value: 'in_progress' },
          { name: 'Completed', value: 'completed' }
        ]
      }
    ]
  },
  {
    name: 'edit-habit',
    description: 'Edit an existing habit',
    options: [
      {
        name: 'habit_id',
        description: 'Habit ID',
        type: 3, // STRING
        required: true
      },
      {
        name: 'name',
        description: 'New habit name',
        type: 3, // STRING
        required: false
      },
      {
        name: 'description',
        description: 'New habit description',
        type: 3, // STRING
        required: false
      },
      {
        name: 'frequency',
        description: 'New habit frequency',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Daily', value: 'daily' },
          { name: 'Weekly', value: 'weekly' },
          { name: 'Monthly', value: 'monthly' }
        ]
      }
    ]
  },
  {
    name: 'submit-art',
    description: 'Submit artwork',
    options: [
      {
        name: 'url',
        description: 'URL to the artwork',
        type: 3, // STRING
        required: true
      },
      {
        name: 'type',
        description: 'Art type',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Sketch', value: 'sketch' },
          { name: 'Sketch Set', value: 'sketch_set' },
          { name: 'Line Art', value: 'line_art' },
          { name: 'Rendered', value: 'rendered' },
          { name: 'Polished', value: 'polished' }
        ]
      },
      {
        name: 'trainer_id',
        description: 'Trainer ID to receive rewards',
        type: 3, // STRING
        required: true
      }
    ]
  },
  {
    name: 'submit-writing',
    description: 'Submit writing',
    options: [
      {
        name: 'url',
        description: 'URL to the writing',
        type: 3, // STRING
        required: true
      },
      {
        name: 'word_count',
        description: 'Word count',
        type: 4, // INTEGER
        required: true
      },
      {
        name: 'trainer_id',
        description: 'Trainer ID to receive rewards',
        type: 3, // STRING
        required: true
      }
    ]
  },
  {
    name: 'submit-prompt',
    description: 'Submit a prompt',
    options: [
      {
        name: 'prompt',
        description: 'Prompt text',
        type: 3, // STRING
        required: true
      },
      {
        name: 'category',
        description: 'Prompt category',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Art', value: 'art' },
          { name: 'Writing', value: 'writing' },
          { name: 'General', value: 'general' }
        ]
      }
    ]
  },
  {
    name: 'submit-reference',
    description: 'Submit a reference',
    options: [
      {
        name: 'url',
        description: 'URL to the reference',
        type: 3, // STRING
        required: true
      },
      {
        name: 'type',
        description: 'Reference type',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Trainer', value: 'trainer' },
          { name: 'Monster', value: 'monster' }
        ]
      },
      {
        name: 'id',
        description: 'Trainer or Monster ID',
        type: 3, // STRING
        required: true
      }
    ]
  },
  {
    name: 'link-account',
    description: 'Link your Discord account to your website account',
    options: [
      {
        name: 'username',
        description: 'Your website username',
        type: 3, // STRING
        required: true
      }
    ]
  }
];
