/**
 * Monster-related slash commands
 */
module.exports = [
  {
    name: 'monster',
    description: 'Monster management commands',
    options: [
      {
        name: 'view',
        description: 'View your monsters',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID to view monsters for',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'roll',
        description: 'Roll a random monster',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID to roll monster for',
            type: 3, // STRING
            required: true
          },
          {
            name: 'name',
            description: 'Name for the monster',
            type: 3, // STRING
            required: false
          }
        ]
      },
      {
        name: 'claim',
        description: 'Claim a rolled monster',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'trainer_id',
            description: 'Trainer ID to claim monster for',
            type: 3, // STRING
            required: true
          },
          {
            name: 'name',
            description: 'Name for the monster',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'level',
        description: 'Add levels to a monster',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'monster_id',
            description: 'Monster ID to level up',
            type: 3, // STRING
            required: true
          },
          {
            name: 'levels',
            description: 'Number of levels to add',
            type: 4, // INTEGER
            required: true
          }
        ]
      }
    ]
  },
  {
    name: 'roll-monster',
    description: 'Roll a random monster with specific parameters',
    options: [
      {
        name: 'species',
        description: 'Species type(s) to include',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Pokemon', value: 'Pokemon' },
          { name: 'Digimon', value: 'Digimon' },
          { name: 'Yokai', value: 'Yokai' },
          { name: 'All', value: 'all' }
        ]
      },
      {
        name: 'type',
        description: 'Primary type for the monster',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Normal', value: 'Normal' },
          { name: 'Fire', value: 'Fire' },
          { name: 'Water', value: 'Water' },
          { name: 'Electric', value: 'Electric' },
          { name: 'Grass', value: 'Grass' },
          { name: 'Ice', value: 'Ice' },
          { name: 'Fighting', value: 'Fighting' },
          { name: 'Poison', value: 'Poison' },
          { name: 'Ground', value: 'Ground' },
          { name: 'Flying', value: 'Flying' },
          { name: 'Psychic', value: 'Psychic' },
          { name: 'Bug', value: 'Bug' },
          { name: 'Rock', value: 'Rock' },
          { name: 'Ghost', value: 'Ghost' },
          { name: 'Dragon', value: 'Dragon' },
          { name: 'Dark', value: 'Dark' },
          { name: 'Steel', value: 'Steel' },
          { name: 'Fairy', value: 'Fairy' }
        ]
      },
      {
        name: 'attribute',
        description: 'Attribute for the monster',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Vaccine', value: 'Vaccine' },
          { name: 'Data', value: 'Data' },
          { name: 'Virus', value: 'Virus' },
          { name: 'Variable', value: 'Variable' },
          { name: 'Free', value: 'Free' }
        ]
      },
      {
        name: 'count',
        description: 'Number of monsters to roll (1-10)',
        type: 4, // INTEGER
        required: false,
        min_value: 1,
        max_value: 10
      }
    ]
  }
];
