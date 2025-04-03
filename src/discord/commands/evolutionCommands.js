/**
 * Evolution-related slash commands
 */
module.exports = [
  {
    name: 'evolve',
    description: 'Evolve a monster',
    options: [
      {
        name: 'monster_id',
        description: 'Monster ID',
        type: 3, // STRING
        required: true
      },
      {
        name: 'item',
        description: 'Evolution item to use',
        type: 3, // STRING
        required: false
      }
    ]
  },
  {
    name: 'fuse',
    description: 'Fuse two monsters together',
    options: [
      {
        name: 'monster_a_id',
        description: 'First monster ID',
        type: 3, // STRING
        required: true
      },
      {
        name: 'monster_b_id',
        description: 'Second monster ID',
        type: 3, // STRING
        required: true
      },
      {
        name: 'name',
        description: 'Name for the fused monster',
        type: 3, // STRING
        required: false
      },
      {
        name: 'item',
        description: 'Fusion item to use',
        type: 3, // STRING
        required: false
      }
    ]
  }
];
