// User Service
export { UserService } from './user.service';
export type {
  AuthResult,
  TokenPayload,
  RefreshTokenPayload,
  DiscordProfile,
} from './user.service';

// Special Berry Service
export { SpecialBerryService } from './special-berry.service';
export type {
  SpecialBerryName,
  SpecialBerryInventory,
} from './special-berry.service';

// Reminder Service
export { ReminderService } from './reminder.service';
export type {
  ReminderProcessingResults,
  ReminderSyncResults,
} from './reminder.service';

// Event Service
export { EventService } from './event.service';
export type {
  EventMetadata,
  EventWithHtml,
  CategorizedEvents,
} from './event.service';

// Scheduled Tasks Service
export { ScheduledTasksService } from './scheduled-tasks.service';
export type {
  MonthlyDistributionResult,
  MonthlyTasksResult,
} from './scheduled-tasks.service';

// Cron Service
export { CronService } from './cron.service';
export type {
  CronJobStatus,
  CronJobsStatus,
} from './cron.service';

// Immediate Reward Service
export { ImmediateRewardService } from './immediate-reward.service';
export type {
  RewardItem,
  PromptRewards,
  MonsterRollParameters,
  RolledMonster,
  AppliedRewards,
  RerollResult,
  RewardSummary,
} from './immediate-reward.service';

// Adventure Services (from adventure folder)
export {
  // Adventure Reward Service
  AdventureRewardService,
  // Area Data Service
  AreaDataService,
  // Encounter Service
  EncounterService,
  // Adventure Discord Service
  AdventureDiscordService,
  // Battle AI Service
  BattleAIService,
  // Battle Service (encounter resolution)
  BattleService,
  // Battle Action Service (real-time battle actions)
  BattleActionService,
  // Battle Manager Service (battle lifecycle orchestration)
  BattleManagerService,
} from './adventure';

export type {
  // Adventure Reward types
  RewardRates,
  ParticipantRewards,
  AdventureCompletionResult,
  TotalStatistics,
  ItemRarity,
  UnclaimedReward,
  ClaimData,
  ClaimResult,
  AdventureStatistics,
  // Area Data types
  Landmass,
  Region,
  Area,
  AreaDifficulty,
  AreaHierarchy,
  FullAreaConfiguration,
  RarityModifiers,
  AreaConfiguration,
  WelcomeMessages,
  BattleParameters,
  MonsterRollerParameters,
  SpecialEncounter,
  WeatherType,
  TerrainType,
  LevelRange,
  AgroRange,
  // Encounter types
  EncounterType,
  EncounterWeights,
  LocationParameters,
  EnemyTrainer,
  EncounterBattleMonster,
  BattleEncounterData,
  WildMonsterGroup,
  WildEncounterData,
  ItemEncounterData,
  SpecialEncounterData,
  AutoBattleData,
  EncounterData as AdventureEncounterData,
  EncounterResult,
  BattleRewards,
  BattleOutcome,
  // Adventure Discord types
  ThreadCreationResult,
  MessageSendResult,
  ArchiveResult,
  DiscordConfig,
  // Battle AI types
  AIDifficulty,
  DifficultySettings,
  DifficultyConfig,
  TeamSide,
  BattleParticipant,
  AIBattleMonster,
  BattleState,
  ActionType,
  ActionData,
  AIAction,
  AIActionResult,
  HealingItem,
  // Battle Service types (encounter resolution)
  BattleServiceOutcome,
  BattleOutcomeConfig,
  BattleOutcomes,
  ItemReward,
  BattleServiceRewards,
  BattleResolutionData,
  BattleResolutionResult,
  BattleServiceStatistics,
  BattleDifficulty,
  RarityWeights,
  BattleEncounterInput,
  // Battle Action Service types (real-time)
  MonsterData as BattleMonsterData,
  DamageResult,
  StatusEffectResult,
  StatusProcessingResult,
  HealingResult,
  ItemEffectResult,
  AttackResult,
  ItemUseResult,
  ReleaseResult,
  WithdrawResult,
  SwitchOutResult,
  BattleAIAction,
  BattleActionState,
  BattleEndResult,
  // Damage Calculator Service
  DamageCalculatorService,
  createDamageCalculatorService,
  // Damage Calculator types
  DamageCalcMonsterData,
  MoveData,
  DamageCalculationOptions,
  DamageCalcResult,
  DamageCalcHealingResult,
  StatusEffectType,
  DamageCalcStatusEffect,
  DamageCalcStatusEffectResult,
  StatusDamageResult,
  DamageCalcWeatherType,
  DamageCalcTerrainType,
  WeatherDamageResult,
  DamageCalcHealingItem,
  // Battle Manager Service types
  BattleType,
  EncounterInput,
  EncounterDataInput,
  WildMonsterGroupInput,
  EncounterMonsterInput,
  EncounterTrainerInput,
  BattleManagerState,
  BattleConditionResult,
  LevelAward,
  KnockoutResult,
  ParticipantRewardResult,
  BattleRewardResult,
  BattleManagerEndResult,
  ForceEndResult,
} from './adventure';

// Capture Service
export { CaptureService } from './capture.service';
export type {
  CaptureData,
  MonsterToCapture,
  CapturedMonster,
  CaptureResult,
  LinkedUser,
  EncounterData,
  EncounterGroup,
  Encounter,
} from './capture.service';

// Monster Initializer Service
export { MonsterInitializerService } from './monster-initializer.service';
export type {
  IVs,
  EVs,
  CalculatedStats,
  MonsterData,
  InitializedMonster,
  MoveType,
} from './monster-initializer.service';

// Antique Appraisal Service
export { AntiqueAppraisalService } from './antique-appraisal.service';
export type {
  AntiqueCategory,
  AntiqueHoliday,
  OverrideParameters,
  Antique,
  RollerParams,
  BackendRollParams,
} from './antique-appraisal.service';

// Monster Roller Service
export { MonsterRollerService } from './monster-roller.service';
export type {
  UserSettings,
  TableFilter,
  RollParams,
  RolledMonster as MonsterRollerRolledMonster,
  MonsterRollerOptions,
} from './monster-roller.service';

// Item Roller Service
export { ItemRollerService } from './item-roller.service';
export type {
  ItemRollOptions,
  RolledItem,
  RollAndAddResult,
} from './item-roller.service';

// Egg Hatcher Service
export { EggHatcherService } from './egg-hatcher.service';
export type {
  HatchParams,
  SpeciesInputs,
  HatchedEgg,
  EggRollParams,
  EggHatcherOptions,
} from './egg-hatcher.service';

// Submission Reward Service
export { SubmissionRewardService } from './submission-reward.service';
export type {
  Appearance,
  Background,
  TrainerInput,
  MonsterInput,
  NpcInput,
  ArtSubmissionData,
  WritingSubmissionData,
  TrainerReward,
  MonsterReward,
  GiftItem,
  ArtRewardResult,
  WritingRewardResult,
  AppliedRewardsResult,
  LevelCapResult,
} from './submission-reward.service';

// Prompt Automation Service
export { PromptAutomationService } from './prompt-automation.service';
export type {
  MonthlyActivationResult,
  DeactivationResult,
  StatisticsUpdateResult,
  CleanupResult,
  WeeklyReport,
  DailyCleanupResult,
  WeeklyStatisticsResult,
} from './prompt-automation.service';

// Prompt Reward Service
export { PromptRewardService } from './prompt-reward.service';
export type {
  StaticMonsterConfig,
  SemiRandomMonsterConfig,
  RewardItemConfig,
  SpecialItemConfig,
  MonsterRollConfig,
  BonusConditions,
  PromptRewardConfig,
  PromptBonusRewardConfig,
  CreatedMonster,
  DistributedRewards,
  PromptInput,
  SubmissionInput,
  RewardHistoryEntry,
  TotalRewardsSummary,
  UnclaimedMonsterRoll,
} from './prompt-reward.service';

// Shop Service
export { ShopService } from './shop.service';
export type {
  PurchaseResult,
  StockResult,
} from './shop.service';

// Mega Mart Service
export { MegaMartService } from './mega-mart.service';
export type {
  MonsterAbilities,
  AbilityCapsuleResult,
  ScrollOfSecretsResult,
} from './mega-mart.service';

// Art Todo Service
export { ArtTodoService } from './art-todo.service';

// Schedule Service
export { ScheduleService } from './schedule.service';
export type { DashboardData } from './schedule.service';

// Adoption Service
export { AdoptionService } from './adoption.service';
export type {
  ClaimAdoptInput,
  ClaimAdoptResult,
  DaypassCheckResult,
  GenerateAdoptsResult,
} from './adoption.service';

// Adventure Service (main orchestrator)
export { AdventureService } from './adventure.service';
export type {
  CreateAdventureInput,
  CreateAdventureResult,
  LevelAllocation,
  CoinAllocation,
  ItemAllocation,
  ClaimRewardsInput,
  RegionInfo,
} from './adventure.service';

// Items Service
export { ItemsService } from './items.service';
export type {
  UseBerryParams,
  UseBerryResult,
  UsePastryParams,
  UsePastryResult,
  AddItemResult,
  BulkAddItemResult,
  SpeciesValidationResult,
  UploadImageResult,
} from './items.service';

// Monster Service (player-owned monster management)
export { MonsterService } from './monster.service';
export type {
  MonsterSearchResult,
  MonsterGalleryItem,
  MonsterReference,
  MegaImages,
  AddLevelsResult,
  BulkAddMonsterResult,
  BulkAddMonstersResult,
} from './monster.service';

// Evolution Service
export { EvolutionService } from './evolution.service';
export type {
  SpeciesSlot,
  EvolutionOption,
  EvolveInput,
  EvolveResult,
} from './evolution.service';

// Boss Service
export { BossService } from './boss.service';
export type {
  BossWithHealth,
  LeaderboardWithRank,
  BossWithLeaderboard,
  BossWithStats,
  DefeatedBossDetails,
  UnclaimedReward as BossUnclaimedReward,
  BossWithRewards,
  DamageResult as BossDamageResult,
  ClaimResult as BossClaimResult,
} from './boss.service';

// Mission Service
export { MissionService } from './mission.service';
export type {
  AvailableMissionsResult,
  StartMissionResult,
  ClaimMissionResult,
} from './mission.service';

// Nursery Service
export { NurseryService } from './nursery.service';
export type {
  HatchSession,
  HatchSessionResult,
  SelectMonsterInput,
  SelectMonsterResult,
  RerollResult as NurseryRerollResult,
} from './nursery.service';

// Garden Service
export { GardenService } from './garden.service';
export type {
  HarvestReward,
  HarvestSession,
  HarvestResult,
  ClaimResult as GardenClaimResult,
  ForfeitResult,
} from './garden.service';

// Reroller Service
export { RerollerService } from './reroller.service';
export type {
  CreateSessionInput,
  ClaimInput,
  ClaimSubmitResult,
  TokenCheckResult,
  ClaimSessionData,
} from './reroller.service';

// Prompt Service
export { PromptService } from './prompt.service';

// Chat Services
export { ChatStorageService } from './chat-storage.service';
export { ChatRealtimeService } from './chat-realtime.service';
export { ChatService } from './chat.service';
export type {
  SendMessageInput,
  CreateGroupInput,
} from './chat.service';

// Antique Service
export { AntiqueService } from './antique.service';
export type {
  FormattedAntique,
  CatalogueFilters,
  AntiqueDropdownItem,
  AppraiseResult,
  AuctionResult,
  UploadResult,
} from './antique.service';

// Faction Service
export { FactionService } from './faction.service';
export type {
  FactionWithDetails,
  FactionPersonWithMeetingStatus,
  PersonWithTeam,
  StandingUpdateResult,
  SubmissionCreateResult,
  MeetPersonResult,
  TributeRequirement,
  AvailableSubmission,
} from './faction.service';

// Statistics Service
export { StatisticsService } from './statistics.service';
export type {
  OverallStats,
  MonsterStats,
  TrainerComparisonStats,
  TrainerStats,
  AdminDashboardStats,
} from './statistics.service';

// Submission Service
export { SubmissionService } from './submission.service';
export type {
  GalleryFilters,
  LibraryFilters,
  MySubmissionsFilters,
  SubmitArtData,
  SubmitWritingData,
  SubmitReferenceData,
  SubmitPromptData,
  SubmitPromptCombinedData,
} from './submission.service';
