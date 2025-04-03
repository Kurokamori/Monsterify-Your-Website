/**
 * Configuration file for Discord bot buttons
 * Contains all button configurations for easy editing
 */

module.exports = {
  // Main menu buttons
  mainMenu: [
    { customId: 'visit_town', label: 'Visit Town', style: 'PRIMARY', emoji: '🏙️' },
    { customId: 'visit_market', label: 'Visit Market', style: 'SUCCESS', emoji: '🛒' },
    { customId: 'process_submission', label: 'Process Submission', style: 'DANGER', emoji: '📝' },
    { customId: 'view_schedule', label: 'View Schedule', style: 'SECONDARY', emoji: '📅' }
  ],
  
  // Town Square buttons
  townSquare: [
    { customId: 'town_center', label: 'Town Center', style: 'PRIMARY' },
    { customId: 'apothecary_visit', label: 'Apothecary', style: 'SECONDARY' },
    { customId: 'bakery_visit', label: 'Bakery', style: 'SECONDARY' },
    { customId: 'witchs_hut_visit', label: 'Witch\'s Hut', style: 'SECONDARY' },
    { customId: 'megamart_visit', label: 'Mega Mart', style: 'SECONDARY' },
    { customId: 'antique_visit', label: 'Antique Store', style: 'SECONDARY' },
    { customId: 'game_corner_visit', label: 'Pomodoro Game Corner', style: 'SECONDARY' },
    { customId: 'adoption_visit', label: 'Adoption Center', style: 'SECONDARY' },
    { customId: 'trade_visit', label: 'Trade Center', style: 'SECONDARY' },
    { customId: 'garden_visit', label: 'Garden', style: 'SECONDARY' },
    { customId: 'farm_visit', label: 'Farm', style: 'SECONDARY' },
    { customId: 'nursery_visit', label: 'Nursery', style: 'SECONDARY' },
    { customId: 'pirates_dock_visit', label: 'Pirate\'s Dock', style: 'SECONDARY' },
    { customId: 'back_to_main', label: 'Back to Main Menu', style: 'DANGER' }
  ],
  
  // Market buttons
  market: [
    { customId: 'markets_square', label: 'Markets Square', style: 'PRIMARY' },
    { customId: 'apothecary_shop', label: 'Apothecary', style: 'SECONDARY' },
    { customId: 'bakery_shop', label: 'Bakery', style: 'SECONDARY' },
    { customId: 'witchs_hut_shop', label: 'Witch\'s Hut', style: 'SECONDARY' },
    { customId: 'megamart_shop', label: 'Mega Mart', style: 'SECONDARY' },
    { customId: 'antique_shop', label: 'Antique Store', style: 'SECONDARY' },
    { customId: 'nursery_shop', label: 'Nursery', style: 'SECONDARY' },
    { customId: 'pirates_dock_shop', label: 'Pirate\'s Dock', style: 'SECONDARY' },
    { customId: 'back_to_main', label: 'Back to Main Menu', style: 'DANGER' }
  ],
  
  // Submission buttons
  submission: [
    { customId: 'art_submission', label: 'Art Submission', style: 'PRIMARY' },
    { customId: 'writing_submission', label: 'Writing Submission', style: 'PRIMARY' },
    { customId: 'prompt_submission', label: 'Prompt Submission', style: 'PRIMARY' },
    { customId: 'reference_submission', label: 'Reference Submission', style: 'PRIMARY' },
    { customId: 'back_to_main', label: 'Back to Main Menu', style: 'DANGER' }
  ],
  
  // Schedule buttons
  schedule: [
    { customId: 'view_schedule', label: 'View Schedule', style: 'PRIMARY' },
    { customId: 'add_task', label: 'Add Task', style: 'SECONDARY' },
    { customId: 'add_habit', label: 'Add Habit', style: 'SECONDARY' },
    { customId: 'create_schedule', label: 'Create Schedule', style: 'SECONDARY' },
    { customId: 'edit_tasks', label: 'Edit Tasks', style: 'SECONDARY' },
    { customId: 'view_tasks', label: 'View Tasks', style: 'SECONDARY' },
    { customId: 'edit_habits', label: 'Edit Habits', style: 'SECONDARY' },
    { customId: 'view_habits', label: 'View Habits', style: 'SECONDARY' },
    { customId: 'back_to_main', label: 'Back to Main Menu', style: 'DANGER' }
  ]
};
