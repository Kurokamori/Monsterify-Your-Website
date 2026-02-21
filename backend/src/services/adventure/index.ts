// Adventure Reward Service
export { AdventureRewardService } from './adventure-reward.service';
export type {
  RewardRates,
  ParticipantRewards,
  AdventureCompletionResult,
  TotalStatistics,
  ItemRarity,
  UnclaimedReward,
  ClaimData,
  ClaimResult,
  AdventureStatistics,
} from './adventure-reward.service';

// Area Data Service
export { AreaDataService } from './area-data.service';
export type {
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
  // New projection / definition types
  Coordinates,
  WildlifeEntry,
  ResourceEntry,
  ImagePaths,
  ResolvedImages,
  LandmassDefinition,
  RegionDefinition,
  AreaEncounterConfig,
  AreaGuideView,
  AreaGuideSummary,
  LandmassGuideView,
  RegionGuideView,
  RegionGuideSummary,
} from './area-data.service';

// Encounter Service
export { EncounterService } from './encounter.service';
export type {
  EncounterType,
  EncounterWeights,
  LocationParameters,
  EnemyTrainer,
  BattleMonster as EncounterBattleMonster,
  BattleEncounterData,
  WildMonsterGroup,
  WildEncounterData,
  ItemEncounterData,
  SpecialEncounterData,
  AutoBattleData,
  EncounterData,
  EncounterResult,
  BattleRewards,
  BattleOutcome,
} from './encounter.service';

// Adventure Discord Service
export { AdventureDiscordService } from './adventure-discord.service';
export type {
  ThreadCreationResult,
  MessageSendResult,
  ArchiveResult,
  DiscordConfig,
} from './adventure-discord.service';

// Battle AI Service
export { BattleAIService } from './battle-ai.service';
export type {
  AIDifficulty,
  DifficultySettings,
  DifficultyConfig,
  TeamSide,
  BattleParticipant,
  BattleMonster as AIBattleMonster,
  BattleState,
  ActionType,
  ActionData,
  AIAction,
  AIActionResult,
  HealingItem,
} from './battle-ai.service';

// Status Move Service
export { StatusMoveService, createStatusMoveService } from './status-move.service';
export type {
  StatusMoveBattleMonster,
  StatusEffect,
  MoveInfo,
  StatusMoveData,
  BattleState as StatusMoveBattleState,
  StatusMoveResult,
  SpecialDamageMoveResult,
  IStatusEffectManager,
  IBattleMonsterRepository,
  IBattleLog,
  SpecialDamageMove,
} from './status-move.service';

// Battle Service (encounter resolution)
export { BattleService } from './battle.service';
export type {
  BattleOutcome as BattleServiceOutcome,
  BattleOutcomeConfig,
  BattleOutcomes,
  ItemReward,
  BattleRewards as BattleServiceRewards,
  BattleResolutionData,
  BattleResolutionResult,
  BattleStatistics as BattleServiceStatistics,
  BattleDifficulty,
  RarityWeights,
  EncounterData as BattleEncounterInput,
} from './battle.service';

// Battle Action Service (real-time battle actions)
export { BattleActionService } from './battle-action.service';
export type {
  MonsterData,
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
  AIAction as BattleAIAction,
  BattleState as BattleActionState,
  BattleEndResult,
} from './battle-action.service';

// Damage Calculator Service
export { DamageCalculatorService, createDamageCalculatorService } from './damage-calculator.service';
export type {
  MonsterData as DamageCalcMonsterData,
  MoveData,
  DamageCalculationOptions,
  DamageResult as DamageCalcResult,
  HealingResult as DamageCalcHealingResult,
  StatusEffectType,
  StatusEffect as DamageCalcStatusEffect,
  StatusEffectResult as DamageCalcStatusEffectResult,
  StatusDamageResult,
  WeatherType as DamageCalcWeatherType,
  TerrainType as DamageCalcTerrainType,
  WeatherDamageResult,
  HealingItem as DamageCalcHealingItem,
} from './damage-calculator.service';

// Status Effect Service
export { StatusEffectService, createStatusEffectService, STATUS_EFFECT_METADATA, TYPE_STATUS_CHANCES } from './status-effect.service';
export type {
  StatusEffectMonster,
  ActiveStatusEffect,
  StatusEffectMetadata,
  StatusEffectApplicationResult,
  StatusEffectProcessingResult,
  TypeStatusChance,
  IStatusEffectBattleMonsterRepository,
  IStatusEffectBattleLog,
} from './status-effect.service';

// Battle Manager Service (battle lifecycle orchestration)
export { BattleManagerService } from './battle-manager.service';
export type {
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
  BattleEndResult as BattleManagerEndResult,
  ForceEndResult,
} from './battle-manager.service';
