// ============================================================================
// Button Custom IDs — single source of truth for all component custom IDs
// used across commands, presenters, and event handlers.
// ============================================================================

// -- Navigation --------------------------------------------------------------

export const NAV = {
  BACK: 'back',
  HOME: 'home',
  REFRESH: 'refresh',
  PREVIOUS: 'previous',
  NEXT: 'next',
} as const;

// -- Generic Actions ---------------------------------------------------------

export const ACTION = {
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
} as const;

// -- Trainer -----------------------------------------------------------------

export const TRAINER = {
  VIEW: 'view_trainer',
  INVENTORY: 'trainer_inventory',
  MONSTERS: 'trainer_monsters',
  LIST: 'trainer_list',
  STATS: 'trainer_stats',
} as const;

// -- Monster -----------------------------------------------------------------

export const MONSTER = {
  VIEW: 'view_monster',
  RENAME: 'rename_monster',
} as const;

// -- Town Menu ---------------------------------------------------------------

export const TOWN = {
  MENU: 'town_menu',
  APOTHECARY: 'town_apothecary',
  BAKERY: 'town_bakery',
  WITCH_HUT: 'town_witch_hut',
  MEGA_MART: 'town_mega_mart',
  ANTIQUE_STORE: 'town_antique_store',
  NURSERY: 'town_nursery',
  PIRATES_DOCK: 'town_pirates_dock',
  GARDEN: 'town_garden',
  GAME_CORNER: 'town_game_corner',
  FARM: 'town_farm',
  ADOPTION_CENTER: 'town_adoption_center',
  TRADE_CENTER: 'town_trade_center',
  BAZAAR: 'town_bazaar',
} as const;

// -- Adventure ---------------------------------------------------------------

export const ADVENTURE = {
  ENCOUNTER: 'adventure_encounter',
  CAPTURE: 'adventure_capture',
  END: 'adventure_end',
  STATUS: 'adventure_status',
  REWARDS: 'adventure_rewards',
  START_LANDMASS: 'adventure_start_landmass',
  START_REGION: 'adventure_start_region',
  START_AREA: 'adventure_start_area',
  START_CUSTOM: 'adventure_start_custom',
  START_MODAL: 'adventure_start_modal',
  START_CUSTOM_MODAL: 'adventure_start_custom_modal',
  HERE_CUSTOM: 'adventure_here_custom',
  HERE_PREBUILT: 'adventure_here_prebuilt',
  HERE_LANDMASS: 'adventure_here_landmass',
  HERE_REGION: 'adventure_here_region',
  HERE_AREA: 'adventure_here_area',
  HERE_MODAL: 'adventure_here_modal',
} as const;

// -- Battle ------------------------------------------------------------------

export const BATTLE = {
  JOIN: 'battle_join',
  ATTACK: 'battle_attack',
  ITEM: 'battle_item',
  RELEASE: 'battle_release',
  WITHDRAW: 'battle_withdraw',
  FLEE: 'battle_flee',
  FORFEIT: 'battle_forfeit',
  STATUS: 'battle_status',
  RESULT: 'battle_result',
} as const;

// -- Schedule Reminders ------------------------------------------------------

export const SCHEDULE = {
  COMPLETE_TASK: 'schedule_complete_task',
  COMPLETE_HABIT: 'schedule_complete_habit',
  COMPLETE_ROUTINE_ITEM: 'schedule_complete_routine_item',
  SNOOZE_15M: 'schedule_snooze_15m',
  SNOOZE_1HR: 'schedule_snooze_1hr',
  DELETE_TASK: 'schedule_delete_task',
  DELETE_HABIT: 'schedule_delete_habit',
  DELETE_ROUTINE_ITEM: 'schedule_delete_routine_item',
} as const;

// -- Shop --------------------------------------------------------------------

export const SHOP = {
  MENU: 'shop_menu',
  BUY: 'shop_buy',
  USE: 'shop_use',
  PREV: 'shop_prev',
  NEXT: 'shop_next',
  APOTHECARY: 'shop_apothecary',
  BAKERY: 'shop_bakery',
  WITCHS_HUT: 'shop_witchs_hut',
  MEGAMART: 'shop_megamart',
  KURTS_CART: 'shop_kurts_cart',
  NURSERY: 'shop_nursery',
  ANTIQUE_STORE: 'shop_antique_store',
  PIRATES_DOCK: 'shop_pirates_dock',
  DEALS: 'shop_deals',
  DEALS_BUY: 'deals_buy',
} as const;
