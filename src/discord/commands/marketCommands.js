/**
 * Market-related slash commands
 */
module.exports = [
  {
    name: 'shop',
    description: 'Visit the markets to buy items',
    options: [
      {
        name: 'shop',
        description: 'Which shop to visit',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Apothecary', value: 'apothecary' },
          { name: 'Bakery', value: 'bakery' },
          { name: 'Witch\'s Hut', value: 'witchs_hut' },
          { name: 'Mega Mart', value: 'megamart' },
          { name: 'Antique Store', value: 'antique_shop' },
          { name: 'Nursery', value: 'nursery' },
          { name: 'Pirate\'s Dock', value: 'pirates_dock' }
        ]
      }
    ]
  },
  {
    name: 'restock-shops',
    description: 'Restock all shops (admin only)',
    options: []
  }
];
