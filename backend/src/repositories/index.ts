// Base Repository
export { BaseRepository } from './base.repository';

// User Repository
export { UserRepository } from './user.repository';
export type {
  UserCreateInput,
  UserUpdateInput,
  UserPublic,
  UserRow,
  MonsterRollerSettings,
  ContentSettings,
  AdminUserQueryOptions,
  PaginatedUsers,
} from './user.repository';

// Trainer Repository
export { TrainerRepository } from './trainer.repository';
export type {
  TrainerRow,
  TrainerWithStats,
  TrainerCreateInput,
  TrainerUpdateInput,
} from './trainer.repository';

// Trainer Inventory Repository
export { TrainerInventoryRepository, INVENTORY_CATEGORIES } from './trainer-inventory.repository';
export type {
  InventoryCategory,
  InventoryItems,
  TrainerInventory,
  TrainerInventoryRow,
  InventoryItemInfo,
} from './trainer-inventory.repository';

// Monster Repository
export { MonsterRepository } from './monster.repository';
export type {
  MonsterRow,
  MonsterWithTrainer,
  MonsterCreateInput,
  MonsterUpdateInput,
  MonsterImageRow,
  MonsterEvolutionLineRow,
  BoxPosition,
} from './monster.repository';

// Move Repository
export { MoveRepository } from './move.repository';
export type {
  MoveRow,
  Move,
} from './move.repository';

// Item Repository
export { ItemRepository } from './item.repository';
export type {
  ItemRow,
  ItemCreateInput,
  ItemUpdateInput,
  ItemQueryOptions,
  PaginatedItems,
} from './item.repository';

// Shop Repository
export { ShopRepository } from './shop.repository';
export type {
  ShopRow,
  ShopItemRow,
  ShopCreateInput,
  ShopUpdateInput,
  ShopItemCreateInput,
  ShopItemUpdateInput,
  VisibilityCondition,
} from './shop.repository';

// Trade Repository
export { TradeRepository } from './trade.repository';
export type {
  TradeStatus,
  TradeRow,
  TradeWithNames,
  Trade,
  TradeCreateInput,
  TradeUpdateInput,
  TradeQueryOptions,
  PaginatedTrades,
} from './trade.repository';

// Faction Repository
export { FactionRepository } from './faction.repository';
export type {
  FactionRow,
  FactionTitleRow,
  FactionRelationshipRow,
  FactionStandingRow,
  FactionStoreItemRow,
  FactionCreateInput,
  FactionUpdateInput,
} from './faction.repository';

// Adventure Repository
export { AdventureRepository } from './adventure.repository';
export type {
  AdventureStatus,
  AdventureRow,
  AdventureWithCreator,
  Adventure,
  AdventureCreateInput,
  AdventureUpdateInput,
  AdventureQueryOptions,
  PaginatedAdventures,
  AdventureEncounterRow,
} from './adventure.repository';

// Battle Repository
export { BattleRepository } from './battle.repository';
export type {
  BattleStatus,
  BattleWinnerType,
  BattleInstanceRow,
  BattleInstanceWithDetails,
  BattleInstance,
  BattleCreateInput,
  BattleUpdateInput,
} from './battle.repository';

// Prompt Repository
export { PromptRepository } from './prompt.repository';
export type {
  PromptType,
  PromptDifficulty,
  PromptRow,
  PromptWithStats,
  Prompt,
  PromptCreateInput,
  PromptUpdateInput,
  PromptQueryOptions,
} from './prompt.repository';

// Submission Repository
export { SubmissionRepository } from './submission.repository';
export type {
  SubmissionStatus,
  SubmissionType,
  ContentType,
  SubmissionRow,
  SubmissionWithDetails,
  Submission,
  SubmissionCreateInput,
  SubmissionUpdateInput,
  SubmissionQueryOptions,
  PaginatedSubmissions,
} from './submission.repository';

// Prompt Submission Repository
export { PromptSubmissionRepository } from './prompt-submission.repository';
export type {
  PromptSubmissionStatus,
  PromptSubmissionRow,
  PromptSubmissionWithDetails,
  PromptSubmission,
  PromptSubmissionCreateInput,
  PromptSubmissionUpdateInput,
  PromptSubmissionQueryOptions,
  PromptStats,
} from './prompt-submission.repository';

// Location Activity Repositories
export {
  LocationActivitySessionRepository,
  LocationPromptRepository,
  LocationFlavorRepository,
} from './location-activity.repository';

// ============================================================================
// Franchise Monster Repositories
// ============================================================================

// Pokemon Species Repository
export { PokemonSpeciesRepository } from './pokemon-species.repository';
export type {
  PokemonSpeciesRow,
  PokemonSpecies,
  PokemonSpeciesCreateInput,
  PokemonSpeciesQueryOptions,
  PaginatedPokemonSpecies,
} from './pokemon-species.repository';

// Digimon Species Repository
export { DigimonSpeciesRepository } from './digimon-species.repository';
export type {
  DigimonSpeciesRow,
  DigimonSpecies,
  DigimonSpeciesCreateInput,
  DigimonSpeciesQueryOptions,
  PaginatedDigimonSpecies,
} from './digimon-species.repository';

// Nexomon Species Repository
export { NexomonSpeciesRepository } from './nexomon-species.repository';
export type {
  NexomonSpeciesRow,
  NexomonSpecies,
  NexomonSpeciesCreateInput,
  NexomonSpeciesQueryOptions,
  PaginatedNexomonSpecies,
} from './nexomon-species.repository';

// Yokai Species Repository
export { YokaiSpeciesRepository } from './yokai-species.repository';
export type {
  YokaiSpeciesRow,
  YokaiSpecies,
  YokaiSpeciesCreateInput,
  YokaiSpeciesQueryOptions,
  PaginatedYokaiSpecies,
} from './yokai-species.repository';

// Pals Species Repository
export { PalsSpeciesRepository } from './pals-species.repository';
export type {
  PalsSpeciesRow,
  PalsSpecies,
  PalsSpeciesCreateInput,
  PalsSpeciesQueryOptions,
  PaginatedPalsSpecies,
} from './pals-species.repository';

// Monster Hunter Species Repository
export { MonsterHunterSpeciesRepository } from './monsterhunter-species.repository';
export type {
  MonsterHunterSpeciesRow,
  MonsterHunterSpecies,
  MonsterHunterSpeciesCreateInput,
  MonsterHunterSpeciesQueryOptions,
  PaginatedMonsterHunterSpecies,
} from './monsterhunter-species.repository';

// Final Fantasy Species Repository
export { FinalFantasySpeciesRepository } from './finalfantasy-species.repository';
export type {
  FinalFantasySpeciesRow,
  FinalFantasySpecies,
  FinalFantasySpeciesCreateInput,
  FinalFantasySpeciesQueryOptions,
  PaginatedFinalFantasySpecies,
} from './finalfantasy-species.repository';

// Fakemon Species Repository
export { FakemonSpeciesRepository } from './fakemon-species.repository';
export type {
  FakemonSpeciesRow,
  FakemonSpecies,
  FakemonSpeciesCreateInput,
  FakemonSpeciesUpdateInput,
  FakemonSpeciesQueryOptions,
  PaginatedFakemonSpecies,
} from './fakemon-species.repository';

// ============================================================================
// Core Game Repositories
// ============================================================================

// Mission Repository
export { MissionRepository } from './mission.repository';
export type {
  MissionRow,
  Mission,
  MissionCreateInput,
  MissionUpdateInput,
  MissionQueryOptions,
  PaginatedMissions,
} from './mission.repository';

// User Mission Repository
export { UserMissionRepository } from './user-mission.repository';
export type {
  UserMissionRow,
  UserMission,
  UserMissionWithDetails,
  UserMissionCreateInput,
  UserMissionUpdateInput,
  MissionMonster,
  AdminUserMission,
  AdminUserMissionQueryOptions,
  PaginatedAdminUserMissions,
} from './user-mission.repository';

// Boss Repository
export { BossRepository } from './boss.repository';
export type {
  BossRow,
  Boss,
  BossCreateInput,
  BossUpdateInput,
  BossDamageRow,
  BossDamage,
  BossDamageWithUser,
  BossRewardClaimRow,
  BossRewardClaim,
  LeaderboardEntry,
} from './boss.repository';

// Garden Point Repository
export { GardenPointRepository } from './garden-point.repository';
export type {
  GardenPointRow,
  GardenPoint,
  GardenPointCreateInput,
  GardenPointUpdateInput,
} from './garden-point.repository';

// Ability Repository
export { AbilityRepository } from './ability.repository';
export type {
  AbilityRow,
  Ability,
  AbilityCreateInput,
  AbilityUpdateInput,
} from './ability.repository';

// Trainer Achievement Repository
export { TrainerAchievementRepository } from './trainer-achievement.repository';
export type {
  TrainerAchievementClaimRow,
  TrainerAchievementClaim,
  TrainerAchievementClaimCreateInput,
  AchievementDefinition,
  AchievementProgress,
} from './trainer-achievement.repository';

// Monster Lineage Repository
export { MonsterLineageRepository } from './monster-lineage.repository';
export type {
  MonsterLineageRow,
  MonsterLineage,
  MonsterLineageWithDetails,
  MonsterLineageCreateInput,
  MonsterLineageUpdateInput,
} from './monster-lineage.repository';

// ============================================================================
// Battle System Repositories
// ============================================================================

// Battle Log Repository
export { BattleLogRepository } from './battle-log.repository';
export type {
  BattleLogRow,
  BattleLog,
  BattleLogWithDetails,
  BattleLogCreateInput,
} from './battle-log.repository';

// Battle Monster Repository
export { BattleMonsterRepository } from './battle-monster.repository';
export type {
  BattleMonsterRow,
  BattleMonster,
  BattleMonsterWithDetails,
  BattleMonsterCreateInput,
  BattleMonsterUpdateInput,
} from './battle-monster.repository';

// Battle Participant Repository
export { BattleParticipantRepository } from './battle-participant.repository';
export type {
  BattleParticipantRow,
  BattleParticipant,
  BattleParticipantWithDetails,
  BattleParticipantCreateInput,
  BattleParticipantUpdateInput,
} from './battle-participant.repository';

// Battle Turn Repository
export { BattleTurnRepository } from './battle-turn.repository';
export type {
  BattleTurnRow,
  BattleTurn,
  BattleTurnCreateInput,
} from './battle-turn.repository';

// ============================================================================
// Adventure System Repositories
// ============================================================================

// Adventure Log Repository
export { AdventureLogRepository } from './adventure-log.repository';
export type {
  AdventureLogRow,
  AdventureLog,
  AdventureLogWithDetails,
  AdventureLogCreateInput,
  ItemEarned,
} from './adventure-log.repository';

// Adventure Participant Repository
export { AdventureParticipantRepository } from './adventure-participant.repository';
export type {
  AdventureParticipantRow,
  AdventureParticipant,
  AdventureParticipantWithDetails,
  AdventureParticipantCreateInput,
  AdventureParticipantUpdateInput,
} from './adventure-participant.repository';

// Adventure Thread Repository
export { AdventureThreadRepository } from './adventure-thread.repository';
export type {
  AdventureThreadRow,
  AdventureThread,
  AdventureThreadWithDetails,
  AdventureThreadCreateInput,
  AdventureThreadUpdateInput,
} from './adventure-thread.repository';

// ============================================================================
// Faction System Repositories
// ============================================================================

// Faction Person Repository
export { FactionPersonRepository } from './faction-person.repository';
export type {
  FactionPersonRow,
  FactionPerson,
  FactionPersonWithDetails,
  FactionPersonMonsterRow,
  FactionPersonMonster,
  FactionPersonCreateInput,
  FactionPersonUpdateInput,
} from './faction-person.repository';

// Faction Person Meeting Repository
export { FactionPersonMeetingRepository } from './faction-person-meeting.repository';
export type {
  FactionPersonMeetingRow,
  FactionPersonMeeting,
  FactionPersonMeetingWithDetails,
  FactionPersonMeetingCreateInput,
} from './faction-person-meeting.repository';

// Faction Prompt Repository
export { FactionPromptRepository } from './faction-prompt.repository';
export type {
  FactionPromptRow,
  FactionPrompt,
  FactionPromptWithDetails,
  FactionPromptCreateInput,
  FactionPromptUpdateInput,
} from './faction-prompt.repository';

// Faction Submission Repository
export { FactionSubmissionRepository } from './faction-submission.repository';
export type {
  FactionSubmissionRow,
  FactionSubmission,
  FactionSubmissionWithDetails,
  FactionSubmissionCreateInput,
  FactionSubmissionUpdateInput,
} from './faction-submission.repository';

// Faction Tribute Repository
export { FactionTributeRepository } from './faction-tribute.repository';
export type {
  FactionTributeRow,
  FactionTribute,
  FactionTributeWithDetails,
  FactionTributeCreateInput,
  FactionTributeUpdateInput,
} from './faction-tribute.repository';

// ============================================================================
// Utility Repositories
// ============================================================================

// Automated Trade Repository
export { AutomatedTradeRepository } from './automated-trade.repository';
export type {
  AutomatedTradeRow,
  AutomatedTrade,
  AutomatedTradeWithDetails,
  AutomatedTradeCreateInput,
} from './automated-trade.repository';

// Bazar Repository
export { BazarRepository } from './bazar.repository';
export type {
  BazarMonsterRow,
  BazarMonster,
  BazarMonsterWithDetails,
  BazarItemRow,
  BazarItem,
  BazarItemWithDetails,
  BazarTransactionRow,
  BazarTransaction,
  BazarMonsterCreateInput,
  BazarItemCreateInput,
  TransactionType,
  ItemType,
} from './bazar.repository';

// Daily Routine Repository
export { DailyRoutineRepository } from './daily-routine.repository';
export type {
  PatternType,
  DailyRoutineRow,
  DailyRoutine,
  DailyRoutineWithItems,
  RoutineItemRow,
  RoutineItem,
  RoutineItemWithDetails,
  DailyRoutineCreateInput,
  DailyRoutineUpdateInput,
  RoutineItemCreateInput,
  RoutineItemUpdateInput,
} from './daily-routine.repository';

// Habit Repository
export { HabitRepository } from './habit.repository';
export type {
  HabitFrequency,
  HabitStatus,
  StreakStatus,
  HabitRow,
  Habit,
  HabitWithDetails,
  HabitCreateInput,
  HabitUpdateInput,
} from './habit.repository';

// Reminder Repository
export { ReminderRepository } from './reminder.repository';
export type {
  ReminderItemType,
  ReminderRow,
  Reminder,
  ReminderWithUserDetails,
  ReminderCreateInput,
  ReminderUpdateInput,
  ReminderStatistics,
} from './reminder.repository';

// Task Repository
export { TaskRepository } from './task.repository';
export type {
  TaskPriority,
  TaskDifficulty,
  TaskStatus,
  RepeatType,
  TaskStep,
  TaskRow,
  Task,
  TaskWithDetails,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQueryOptions,
} from './task.repository';

// Monthly Adopt Repository
export { MonthlyAdoptRepository } from './monthly-adopt.repository';
export type {
  MonthlyAdoptRow,
  MonthlyAdopt,
  MonthlyAdoptWithCount,
  AdoptionClaimRow,
  AdoptionClaim,
  MonthlyAdoptCreateInput,
  MonthlyAdoptUpdateInput,
  PaginatedMonthlyAdopts,
} from './monthly-adopt.repository';

// ============================================================================
// Antique System Repositories
// ============================================================================

// Antique Setting Repository
export { AntiqueSettingRepository } from './antique-setting.repository';
export type {
  AntiqueSettingRow,
  AntiqueSetting,
  AntiqueSettingUpsertInput,
} from './antique-setting.repository';

// Antique Auction Repository
export { AntiqueAuctionRepository } from './antique-auction.repository';
export type {
  AntiqueAuctionRow,
  AntiqueAuction,
  AntiqueAuctionClaimRow,
  AntiqueAuctionClaim,
  AntiqueAuctionCreateInput,
  AntiqueAuctionUpdateInput,
  AntiqueAuctionQueryOptions,
  PaginatedAntiqueAuctions,
} from './antique-auction.repository';

// ============================================================================
// Art Todo Repository
// ============================================================================

export { ArtTodoRepository } from './art-todo.repository';
export type {
  ArtTodoListRow,
  ArtTodoList,
  ArtTodoListWithCounts,
  ArtTodoListWithItems,
  ArtTodoItemPriority,
  ArtTodoItemStatus,
  ArtTodoItemRow,
  ArtTodoItem,
  ArtTodoItemWithDetails,
  ArtTodoReferenceType,
  ArtTodoReferenceRow,
  ArtTodoReference,
  ArtTodoReferenceWithDetails,
  ArtTodoListCreateInput,
  ArtTodoListUpdateInput,
  ArtTodoItemCreateInput,
  ArtTodoItemUpdateInput,
  ArtTodoReferenceCreateInput,
} from './art-todo.repository';

// ============================================================================
// Reroll Repository
// ============================================================================

export { RerollRepository } from './reroll.repository';
export type {
  RerollSessionStatus,
  RerollType,
  RerollSessionRow,
  RerollSession,
  RerollSessionWithDetails,
  RerollClaimType,
  RerollClaimRow,
  RerollClaim,
  RerollClaimWithDetails,
  RerollSessionCreateInput,
  RerollSessionUpdateInput,
  RerollClaimCreateInput,
  RerollSessionQueryOptions,
  PaginatedRerollSessions,
} from './reroll.repository';
