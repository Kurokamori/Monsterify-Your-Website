/**
 * WebBattleService
 *
 * Website-facing battle orchestration built on top of the existing battle engine
 * (BattleActionService / BattleAIService and the battle_* repositories).
 *
 * Supports three battle modes:
 * - friendly: challenge another trainer's public battle team, opponent controlled by AI
 * - gauntlet: 1-5 gauntlet trainers followed by the gym leader; beating the leader awards a badge
 * - pvp: realtime battle against another player (turns synced over Socket.IO)
 *
 * Trainers can use ANY move their monster knows (the full moveset, no 4-move limit).
 * Wins award currency, losses cost currency.
 */

import { BattleRepository, BattleInstance } from '@/repositories';
import {
  BattleParticipantRepository,
  BattleParticipantWithDetails,
} from '@/repositories';
import {
  BattleMonsterRepository,
  BattleMonsterWithDetails,
} from '@/repositories';
import { BattleLogRepository } from '@/repositories';
import { BattleTurnRepository, BattleTurnWithDetails } from '@/repositories';
import { MonsterRepository, MonsterWithTrainer } from '@/repositories';
import { TrainerRepository } from '@/repositories';
import { MoveRepository, Move } from '@/repositories';
import {
  BattleTeamRepository,
  BattleTeamWithTrainer,
} from '@/repositories';
import {
  GymRepository,
  Gym,
  GymKind,
  GymMonsterSpec,
  GauntletRun,
  TrainerBadge,
  BattleDialogue,
} from '@/repositories';
import {
  BattleAssetRepository,
  BattleAsset,
  BattleAssetKind,
} from '@/repositories';
import { UserRow } from '@/repositories';
import { BattleActionService } from '@/services';
import { BattleAIService, AIDifficulty } from '@/services';
import { MonsterInitializerService } from '@/services';
import type { CalculatedStats } from '@/services';
import { computeBattleLevelReward } from '@/utils/constants/battle-constants';
import {
  BattleStatSpec,
  BattleDifficultyValue,
  BattleRoleValue,
  PartialBattleStatSpec,
  resolveBattleStatSpec,
  rollBattleStatSpec,
} from '@/utils/constants';

// ============================================================================
// Types
// ============================================================================

/**
 * How many recent turns ride along with the battle state.
 *
 * The arena animates the turns it has not seen before, so this only has to cover the
 * most that can be recorded between two states the client actually observes: your
 * action plus the opponent's reply, and a switch on either side. A handful of spare
 * slots keeps a slow client from missing an attack it should have drawn.
 */
const RECENT_TURN_WINDOW = 8;

export type WebBattleMode = 'friendly' | 'gauntlet' | 'pvp';

/**
 * The resolved stat spec for a generated battle monster plus the totals it
 * produces at a given level. Returned to the admin tool so a designer authoring a
 * gym monster sees the actual numbers rather than guessing at the curve.
 */
export type SpecMonsterStatPreview = {
  level: number;
  stats: BattleStatSpec;
  totals: CalculatedStats;
  /** Starting/max HP the monster will actually have in battle (totals.hp_total + level * 2). */
  battleHp: number;
};

/** Resolved battle scenery, chosen once when the battle is created. */
export type WebBattleAppearance = {
  backgroundUrl: string | null;
  /** Draw the background with nearest-neighbour scaling (pixel art). */
  backgroundPixelated: boolean;
  spotUrl: string | null;
  spotPixelated: boolean;
  textboxUrl: string | null;
  textboxSlice: number | null;
  textboxPixelated: boolean;
};

/** Resolved opponent dialogue for a battle (empty lists = nothing to say). */
export type WebBattleDialogueView = {
  intro: string[];
  win: string[];
  loss: string[];
  generic: string[];
  /** Portrait shown in the dialogue box (bespoke talking sprite or the battle image). */
  sprite: string | null;
};

export type WebBattleData = {
  web: true;
  mode: WebBattleMode;
  winReward: number;
  lossPenalty: number;
  playerKey: string;
  playerTrainerId: number;
  opponentKey?: string | null;
  opponentTrainerId?: number | null;
  opponentLabel: string;
  /**
   * Battle portrait for an NPC opponent that has no trainer row to join against
   * (a spec-authored gauntlet trainer or a gym leader defined only by name + art).
   * Frozen at creation, same as the scenery, and used as the participant's
   * trainerImage so the arena can show the opponent trainer on the field.
   */
  opponentImage?: string | null;
  turnOf: string | null;
  pending?: boolean;
  settled?: boolean;
  settlement?: WebBattleSettlement | null;
  gauntletRunId?: number;
  gymId?: number;
  stageType?: 'trainer' | 'leader';
  stageNumber?: number;
  aiDifficulty?: AIDifficulty;
  challengerMonsterIds?: number[];
  appearance?: WebBattleAppearance | null;
  dialogue?: WebBattleDialogueView | null;
  waiting_for_switch?: unknown;
  [key: string]: unknown;
};

export type WebBattleAction =
  | { type: 'move'; moveName: string; targetBattleMonsterId?: number }
  | { type: 'switch'; battleMonsterId: number }
  | { type: 'forfeit' };

/**
 * The seven stat stages a monster can carry in battle, in the order they are shown.
 * These are the keys `stat_modifications` is written under by the status-move and
 * status-effect services; anything else in that blob is ignored by the view.
 */
export const BATTLE_STAT_STAGE_KEYS = [
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'accuracy',
  'evasion',
] as const;

export type BattleStatStageKey = (typeof BATTLE_STAT_STAGE_KEYS)[number];

/** Stage values, -6..+6. Only stats that are actually modified are present. */
export type BattleStatStages = Partial<Record<BattleStatStageKey, number>>;

export type WebBattleMonsterView = {
  id: number;
  monsterId: number;
  participantId: number;
  name: string;
  /** The species, joined with "/" — kept for callers that just want a label. */
  species: string;
  /** The same species, unjoined (up to 3). */
  speciesList: string[];
  types: string[];
  attribute: string | null;
  /** Frozen into battle_data at creation, so battles started before it existed are null. */
  gender: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
  isActive: boolean;
  isFainted: boolean;
  teamSide: string | null;
  imgLink: string | null;
  backSprite: string | null;
  statusEffects: string[];
  statStages: BattleStatStages;
  moves: string[];
};

/**
 * A recorded action, trimmed to what the arena needs to animate it.
 *
 * The arena replays these to drive the attack choreography: it needs the *actor*, which
 * cannot be inferred from an HP diff (end-of-turn chip damage from burn or poison drops
 * HP with nobody attacking, and would otherwise make a monster lunge at thin air).
 * Only turns are recorded here, so passive damage correctly produces no lunge.
 */
export type WebBattleTurnView = {
  id: number;
  turnNumber: number;
  actionType: string;
  /** The battle-monster that acted. Null on turns recorded without an actor. */
  actorMonsterId: number | null;
  actorSide: string | null;
  /** The battle-monster that was targeted, when the action had one. */
  targetMonsterId: number | null;
  moveName: string | null;
  damageDealt: number;
};

export type WebBattleParticipantView = {
  id: number;
  trainerId: number | null;
  trainerName: string;
  trainerImage: string | null;
  teamSide: string;
  participantType: string;
  isYou: boolean;
};

export type WebBattleLevelReward = {
  monsterId: number;
  name: string;
  levels: number;
  newLevel: number;
};

export type WebBattleSettlement = {
  won: boolean;
  currencyDelta: number;
  levelRewards?: WebBattleLevelReward[];
  badge?: { gymId: number; gymName: string; badgeName: string; badgeImgLink: string | null } | null;
  gauntlet?: {
    runId: number;
    status: string;
    currentStage: number;
    totalStages: number;
    nextBattleId: number | null;
  } | null;
};

export type WebBattleStateView = {
  battleId: number;
  status: string;
  mode: WebBattleMode;
  pending: boolean;
  winnerType: string | null;
  yourSide: 'players' | 'opponents' | null;
  isYourTurn: boolean;
  mustSwitch: boolean;
  opponentLabel: string;
  winReward: number;
  lossPenalty: number;
  stage: { gymId: number; stageType: string; stageNumber: number; totalStages: number } | null;
  appearance: WebBattleAppearance | null;
  dialogue: WebBattleDialogueView | null;
  participants: WebBattleParticipantView[];
  monsters: WebBattleMonsterView[];
  activeMoves: Move[];
  logs: Array<{ id: number; message: string; createdAt: Date | string }>;
  /** The last few actions, oldest-first. Drives the arena's attack animations. */
  recentTurns: WebBattleTurnView[];
  settlement: WebBattleSettlement | null;
};

export type WebActionResult = {
  success: boolean;
  message: string;
  battleEnded: boolean;
  state: WebBattleStateView;
};

const FRIENDLY_WIN_REWARD = 250;
const FRIENDLY_LOSS_PENALTY = 100;
const MAX_TEAM_SIZE = 6;

// Level rewards for winning a web battle are computed by computeBattleLevelReward,
// which scales the award on the difference between a winner's level and the
// average level of the losing team (beating a stronger team grants more growth).
const MAX_MONSTER_LEVEL = 100;

// ============================================================================
// Service
// ============================================================================

export class WebBattleService {
  private battleRepo: BattleRepository;
  private participantRepo: BattleParticipantRepository;
  private monsterBattleRepo: BattleMonsterRepository;
  private logRepo: BattleLogRepository;
  private monsterRepo: MonsterRepository;
  private trainerRepo: TrainerRepository;
  private moveRepo: MoveRepository;
  private teamRepo: BattleTeamRepository;
  private gymRepo: GymRepository;
  private assetRepo: BattleAssetRepository;
  private turnRepo: BattleTurnRepository;
  private actionService: BattleActionService;
  private aiService: BattleAIService;
  private monsterInitializer: MonsterInitializerService;

  constructor() {
    this.battleRepo = new BattleRepository();
    this.participantRepo = new BattleParticipantRepository();
    this.monsterBattleRepo = new BattleMonsterRepository();
    this.logRepo = new BattleLogRepository();
    this.monsterRepo = new MonsterRepository();
    this.trainerRepo = new TrainerRepository();
    this.moveRepo = new MoveRepository();
    this.teamRepo = new BattleTeamRepository();
    this.gymRepo = new GymRepository();
    this.assetRepo = new BattleAssetRepository();
    this.turnRepo = new BattleTurnRepository();
    this.actionService = new BattleActionService();
    this.aiService = new BattleAIService();
    this.monsterInitializer = new MonsterInitializerService(this.monsterRepo);
  }

  // ==========================================================================
  // Identity helpers
  // ==========================================================================

  /** Stable actor key for a website user, aligned with the discord battle engine. */
  static actorKey(user: Pick<UserRow, 'id' | 'discord_id'>): string {
    return user.discord_id ?? `web:${user.id}`;
  }

  /** Verify the trainer belongs to the given user (admin bypasses). */
  private async requireOwnedTrainer(
    user: UserRow,
    trainerId: number
  ): Promise<{ id: number; name: string }> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    const owns =
      trainer.player_user_id === user.discord_id ||
      trainer.player_user_id === String(user.id);
    if (!owns && !user.is_admin) {
      throw new Error('You do not own this trainer');
    }
    return { id: trainer.id, name: trainer.name };
  }

  private async loadOwnedMonsters(
    trainerId: number,
    monsterIds: number[]
  ): Promise<MonsterWithTrainer[]> {
    if (monsterIds.length === 0 || monsterIds.length > MAX_TEAM_SIZE) {
      throw new Error(`Pick between 1 and ${MAX_TEAM_SIZE} monsters for your team`);
    }
    const owned = await this.monsterRepo.findByTrainerId(trainerId);
    const byId = new Map(owned.map((m) => [m.id, m]));
    const selected: MonsterWithTrainer[] = [];
    for (const id of monsterIds) {
      const monster = byId.get(id);
      if (!monster) {
        throw new Error(`Monster ${id} does not belong to this trainer`);
      }
      if (!WebBattleService.hasMainRef(monster)) {
        throw new Error(
          `${monster.name} needs a main reference image before it can battle`
        );
      }
      selected.push(monster);
    }
    return selected;
  }

  /**
   * A monster may only participate in battles once it has at least a main
   * reference image. A back sprite alone (or none) is not enough.
   */
  static hasMainRef(monster: { img_link?: string | null; main_ref?: string | null }): boolean {
    // Falsy-fallback (||) is intentional: an empty img_link should fall through
    // to main_ref rather than count as "present".
    return Boolean(monster.img_link?.trim() || monster.main_ref?.trim());
  }

  // ==========================================================================
  // Battle appearance & dialogue resolution
  //
  // Scenery and dialogue are resolved ONCE, when the battle is created, and
  // frozen into battle_data so that a "random" choice stays stable for the whole
  // fight (and across state refetches).
  // ==========================================================================

  /**
   * Pick an asset of a kind: an explicit choice wins; otherwise a random active
   * asset is used when either the source or the caller (friendly/pvp) asks for one.
   */
  private async pickAsset(
    kind: BattleAssetKind,
    assetId: number | null | undefined,
    random: boolean | undefined,
    fallbackRandom: boolean
  ): Promise<BattleAsset | null> {
    if (assetId) {
      const asset = await this.assetRepo.findById(assetId);
      if (asset && asset.isActive) {return asset;}
    }
    if (random || fallbackRandom) {
      return this.assetRepo.findRandomByKind(kind);
    }
    return null;
  }

  private async resolveAppearance(opts: {
    backgroundAssetId?: number | null;
    backgroundRandom?: boolean;
    spotAssetId?: number | null;
    spotRandom?: boolean;
    textboxAssetId?: number | null;
    /** friendly/pvp battles have no authored scenery — give them a random one. */
    fallbackRandom?: boolean;
  }): Promise<WebBattleAppearance> {
    const fallback = Boolean(opts.fallbackRandom);
    const [bg, spot, textbox] = await Promise.all([
      this.pickAsset('background', opts.backgroundAssetId, opts.backgroundRandom, fallback),
      this.pickAsset('spot', opts.spotAssetId, opts.spotRandom, fallback),
      // Text-box skin: only an explicit choice, otherwise the built-in CSS box is used.
      this.pickAsset('textbox', opts.textboxAssetId, false, false),
    ]);
    return {
      backgroundUrl: bg?.imgLink ?? null,
      backgroundPixelated: bg?.pixelated ?? false,
      spotUrl: spot?.imgLink ?? null,
      spotPixelated: spot?.pixelated ?? false,
      textboxUrl: textbox?.imgLink ?? null,
      textboxSlice: textbox?.sliceInset ?? null,
      textboxPixelated: textbox?.pixelated ?? false,
    };
  }

  /** Build the client dialogue view, or null when nothing is authored. */
  private buildDialogue(
    dialogue: BattleDialogue | null | undefined,
    spriteFallback: string | null
  ): WebBattleDialogueView | null {
    if (!dialogue) {return null;}
    const clean = (lines?: string[]): string[] =>
      (lines ?? []).map((l) => (l ?? '').trim()).filter((l) => l.length > 0);
    const intro = clean(dialogue.intro);
    const win = clean(dialogue.win);
    const loss = clean(dialogue.loss);
    const generic = clean(dialogue.generic);
    if (!intro.length && !win.length && !loss.length && !generic.length) {
      return null;
    }
    const sprite = dialogue.talkingSprite?.trim() || spriteFallback || null;
    return { intro, win, loss, generic, sprite };
  }

  // ==========================================================================
  // Monster data builders
  // ==========================================================================

  private parseMoveset(moveset: string | string[] | null | undefined): string[] {
    if (!moveset || moveset === 'null') {return [];}
    if (Array.isArray(moveset)) {return moveset;}
    try {
      const parsed = JSON.parse(moveset);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** Build the battle monsterData payload from a real monster row. */
  private buildMonsterData(monster: MonsterWithTrainer): Record<string, unknown> {
    return {
      name: monster.name,
      species1: monster.species1,
      species2: monster.species2,
      species3: monster.species3,
      type1: monster.type1,
      type2: monster.type2,
      type3: monster.type3,
      type4: monster.type4,
      type5: monster.type5,
      attribute: monster.attribute,
      gender: monster.gender,
      level: monster.level,
      hp_total: monster.hp_total,
      atk_total: monster.atk_total,
      def_total: monster.def_total,
      spa_total: monster.spa_total,
      spd_total: monster.spd_total,
      spe_total: monster.spe_total,
      nature: monster.nature,
      ability: monster.ability ?? monster.ability1,
      moveset: this.parseMoveset(monster.moveset),
      img_link: monster.img_link,
      back_sprite: monster.back_sprite,
      isWild: false,
    };
  }

  private battleMonsterHp(monster: { hp_total?: number | null; level?: number | null }): number {
    const baseHp = monster.hp_total ?? 50;
    const level = monster.level ?? 1;
    return Math.max(1, Math.floor(baseHp + level * 2));
  }

  /**
   * Build monsterData for a gym spec monster (no real monster row behind it).
   *
   * Stats run through the same MonsterInitializerService.calculateStats curve that
   * player-owned monsters use, fed by the spec's authored nature/IV/EV (or the
   * medium/balanced preset when the spec predates that field). Generated opponents
   * and trainer monsters of the same level are therefore on the same scale.
   */
  private async buildSpecMonsterData(spec: GymMonsterSpec): Promise<Record<string, unknown>> {
    const level = spec.level || 10;
    const statSpec = resolveBattleStatSpec(spec.stats);
    const stats = this.monsterInitializer.calculateStats(level, {
      level,
      nature: statSpec.nature,
      hp_iv: statSpec.ivs.hp,
      atk_iv: statSpec.ivs.atk,
      def_iv: statSpec.ivs.def,
      spa_iv: statSpec.ivs.spa,
      spd_iv: statSpec.ivs.spd,
      spe_iv: statSpec.ivs.spe,
      hp_ev: statSpec.evs.hp,
      atk_ev: statSpec.evs.atk,
      def_ev: statSpec.evs.def,
      spa_ev: statSpec.evs.spa,
      spd_ev: statSpec.evs.spd,
      spe_ev: statSpec.evs.spe,
    });

    const moves = spec.moves && spec.moves.length > 0 ? spec.moves : await this.pickMovesForTypes(
      [spec.type1, spec.type2, spec.type3].filter((t): t is string => Boolean(t)),
      level
    );

    return {
      name: spec.name,
      species1: spec.species1,
      species2: spec.species2 ?? null,
      species3: spec.species3 ?? null,
      type1: spec.type1,
      type2: spec.type2 ?? null,
      type3: spec.type3 ?? null,
      type4: spec.type4 ?? null,
      type5: spec.type5 ?? null,
      attribute: spec.attribute ?? null,
      gender: spec.gender ?? null,
      level,
      nature: statSpec.nature,
      hp_total: stats.hp_total,
      atk_total: stats.atk_total,
      def_total: stats.def_total,
      spa_total: stats.spa_total,
      spd_total: stats.spd_total,
      spe_total: stats.spe_total,
      moveset: moves,
      img_link: spec.imgLink ?? null,
      isWild: false,
    };
  }

  // ==========================================================================
  // Spec monster stat authoring (admin tool)
  // ==========================================================================

  /**
   * Resolve a (possibly partial) authored stat spec and compute the totals it
   * produces at a given level. The admin tool calls this so a designer sees the
   * real numbers their nature/IV/EV choices yield — computed by the same curve
   * the battle uses, never re-derived on the client.
   */
  previewSpecMonsterStats(
    level: number,
    stats: PartialBattleStatSpec | null | undefined
  ): SpecMonsterStatPreview {
    const clampedLevel = Math.max(1, Math.min(MAX_MONSTER_LEVEL, Math.floor(level) || 1));
    const statSpec = resolveBattleStatSpec(stats);
    const totals = this.monsterInitializer.calculateStats(clampedLevel, {
      level: clampedLevel,
      nature: statSpec.nature,
      hp_iv: statSpec.ivs.hp,
      atk_iv: statSpec.ivs.atk,
      def_iv: statSpec.ivs.def,
      spa_iv: statSpec.ivs.spa,
      spd_iv: statSpec.ivs.spd,
      spe_iv: statSpec.ivs.spe,
      hp_ev: statSpec.evs.hp,
      atk_ev: statSpec.evs.atk,
      def_ev: statSpec.evs.def,
      spa_ev: statSpec.evs.spa,
      spd_ev: statSpec.evs.spd,
      spe_ev: statSpec.evs.spe,
    });

    return {
      level: clampedLevel,
      stats: statSpec,
      totals,
      battleHp: this.battleMonsterHp({ hp_total: totals.hp_total, level: clampedLevel }),
    };
  }

  /**
   * Roll a stat spec from a difficulty + role preset and return it along with the
   * totals it yields at the given level.
   */
  rollSpecMonsterStats(
    level: number,
    difficulty: BattleDifficultyValue,
    role: BattleRoleValue
  ): SpecMonsterStatPreview {
    const rolled: BattleStatSpec = rollBattleStatSpec(difficulty, role);
    return this.previewSpecMonsterStats(level, rolled);
  }

  /** Pick a usable moveset from the moves table for the given types. */
  private async pickMovesForTypes(types: string[], level: number): Promise<string[]> {
    const picked: string[] = [];
    for (const type of types) {
      const typeMoves = await this.moveRepo.findByType(type);
      const usable = typeMoves
        .filter((m) => (m.learnLevel ?? 0) <= level && (m.power ?? 0) > 0)
        .sort((a, b) => (b.power ?? 0) - (a.power ?? 0));
      // Take a strong move and a weaker (accurate) one per type
      if (usable.length > 0) {picked.push(usable[Math.floor(usable.length / 2)]!.moveName);}
      if (usable.length > 1) {picked.push(usable[usable.length - 1]!.moveName);}
    }
    if (picked.length === 0) {
      picked.push('Tackle');
    }
    return [...new Set(picked)].slice(0, 6);
  }

  private async addTeamToBattle(
    battleId: number,
    participantId: number,
    monsters: MonsterWithTrainer[]
  ): Promise<void> {
    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i]!;
      const data = this.buildMonsterData(monster);
      const hp = this.battleMonsterHp(monster);
      await this.monsterBattleRepo.create({
        battleId,
        participantId,
        monsterId: monster.id,
        monsterData: data,
        currentHp: hp,
        maxHp: hp,
        positionIndex: i,
        isActive: i === 0,
      });
    }
  }

  private async addSpecTeamToBattle(
    battleId: number,
    participantId: number,
    specs: GymMonsterSpec[]
  ): Promise<void> {
    for (let i = 0; i < specs.length; i++) {
      const data = await this.buildSpecMonsterData(specs[i]!);
      const hp = this.battleMonsterHp(data as { hp_total?: number; level?: number });
      await this.monsterBattleRepo.create({
        battleId,
        participantId,
        monsterId: 0,
        monsterData: data,
        currentHp: hp,
        maxHp: hp,
        positionIndex: i,
        isActive: i === 0,
      });
    }
  }

  // ==========================================================================
  // Battle creation — friendly (vs AI-controlled player team)
  // ==========================================================================

  async listOpponentTeams(user: UserRow): Promise<BattleTeamWithTrainer[]> {
    return this.teamRepo.findPublicTeams(user.discord_id ?? String(user.id));
  }

  async startFriendlyBattle(
    user: UserRow,
    trainerId: number,
    monsterIds: number[],
    opponentTeamId: number,
    difficulty: AIDifficulty = 'medium'
  ): Promise<WebBattleStateView> {
    const playerKey = WebBattleService.actorKey(user);
    const trainer = await this.requireOwnedTrainer(user, trainerId);
    const myMonsters = await this.loadOwnedMonsters(trainerId, monsterIds);

    const team = await this.teamRepo.findById(opponentTeamId);
    if (!team || !team.isPublic) {
      throw new Error('Opponent team not found');
    }
    if (team.trainerId === trainerId) {
      throw new Error('You cannot battle your own team');
    }
    const opponentMonsters = await this.loadTeamMonsters(team);
    if (opponentMonsters.length === 0) {
      throw new Error('Opponent team has no monsters');
    }

    // Friendly battles have no authored scenery — give them a random background/spot.
    const appearance = await this.resolveAppearance({ fallbackRandom: true });

    const battleData: WebBattleData = {
      web: true,
      mode: 'friendly',
      winReward: FRIENDLY_WIN_REWARD,
      lossPenalty: FRIENDLY_LOSS_PENALTY,
      playerKey,
      playerTrainerId: trainerId,
      opponentTrainerId: team.trainerId,
      opponentLabel: `${team.trainerName}'s ${team.name}`,
      turnOf: playerKey,
      aiDifficulty: difficulty,
      appearance,
    };

    const battle = await this.battleRepo.create({
      adventureId: null,
      battleType: 'trainer',
      createdByDiscordUserId: playerKey,
      battleData,
    });

    const playerParticipant = await this.participantRepo.create({
      battleId: battle.id,
      participantType: 'player',
      discordUserId: playerKey,
      trainerId,
      trainerName: trainer.name,
      teamSide: 'players',
      turnOrder: 0,
    });

    const opponentParticipant = await this.participantRepo.create({
      battleId: battle.id,
      participantType: 'npc',
      trainerId: team.trainerId,
      trainerName: team.trainerName,
      teamSide: 'opponents',
      turnOrder: 1,
    });

    await this.addTeamToBattle(battle.id, playerParticipant.id, myMonsters);
    await this.addTeamToBattle(battle.id, opponentParticipant.id, opponentMonsters);

    await this.logRepo.logSystem(
      battle.id,
      `⚔️ **${trainer.name}** challenges **${team.trainerName}'s ${team.name}**!`
    );

    return this.getBattleState(battle.id, user);
  }

  private async loadTeamMonsters(team: BattleTeamWithTrainer): Promise<MonsterWithTrainer[]> {
    const monsters: MonsterWithTrainer[] = [];
    for (const id of team.monsterIds.slice(0, MAX_TEAM_SIZE)) {
      const monster = await this.monsterRepo.findById(id);
      if (monster && monster.trainer_id === team.trainerId) {
        monsters.push(monster);
      }
    }
    return monsters;
  }

  // ==========================================================================
  // Battle creation — gauntlet
  // ==========================================================================

  async startGauntlet(
    user: UserRow,
    trainerId: number,
    monsterIds: number[],
    gymId: number
  ): Promise<WebBattleStateView> {
    const trainer = await this.requireOwnedTrainer(user, trainerId);
    await this.loadOwnedMonsters(trainerId, monsterIds); // validate

    const gym = await this.gymRepo.findById(gymId);
    if (!gym?.isActive) {
      throw new Error('Gym not found');
    }

    // League / champion battles are gated behind badge progression.
    if (gym.gymKind === 'league' || gym.gymKind === 'champion') {
      const activeGyms = await this.gymRepo.findAllActive();
      const badges = await this.gymRepo.findBadgesByTrainerId(trainerId);
      const earnedGymIds = new Set(badges.map((b) => b.gymId));
      const unlock = this.computeUnlock(activeGyms, earnedGymIds);
      const lock = this.lockStateFor(gym, unlock);
      if (lock.locked) {
        throw new Error(lock.lockReason ?? 'This battle is locked.');
      }
    }

    const gauntletTrainers = gym.gauntletTrainers.slice(0, 5);
    const hasLeader = this.gymHasLeaderStage(gym);
    if (!hasLeader && gauntletTrainers.length === 0) {
      throw new Error('This gauntlet is not ready for challengers yet');
    }

    const existing = await this.gymRepo.findActiveGauntletRun(trainerId, gymId);
    if (existing) {
      throw new Error('You already have an active gauntlet run at this gym');
    }

    const run = await this.gymRepo.createGauntletRun({
      gymId,
      trainerId,
      userId: user.id,
      teamMonsterIds: monsterIds,
      totalStages: gauntletTrainers.length + (hasLeader ? 1 : 0),
    });

    const battle = await this.createGauntletStageBattle(user, run, gym, trainer.name);
    return this.getBattleState(battle.id, user);
  }

  /** Whether the gym/gauntlet has a final leader stage defined. */
  private gymHasLeaderStage(gym: Gym): boolean {
    return (
      gym.leaderTeam.length > 0 ||
      Boolean(gym.leaderTrainerId && gym.leaderMonsterIds.length > 0)
    );
  }

  /** Create the battle for the run's current stage. */
  private async createGauntletStageBattle(
    user: UserRow,
    run: GauntletRun,
    gym: Gym,
    trainerName: string
  ): Promise<BattleInstance> {
    const playerKey = WebBattleService.actorKey(user);
    const gauntletTrainers = gym.gauntletTrainers.slice(0, 5);
    const isLeaderStage = this.gymHasLeaderStage(gym) && run.currentStage >= gauntletTrainers.length;
    const stageTrainer = isLeaderStage ? null : gauntletTrainers[run.currentStage]!;

    const opponentName = isLeaderStage ? gym.leaderName : stageTrainer!.name;

    // Stage opponents can be spec-based (generated) or backed by a real trainer's monsters
    const stageRealTrainerId = isLeaderStage
      ? gym.leaderTrainerId
      : stageTrainer?.trainerId ?? null;
    const stageRealMonsterIds = isLeaderStage
      ? gym.leaderMonsterIds
      : stageTrainer?.monsterIds ?? [];
    const opponentSpecTeam = isLeaderStage ? gym.leaderTeam : stageTrainer!.team;

    // Trainer stages pay a partial reward; the final stage pays the full pot.
    const isFinalStage = run.currentStage + 1 >= run.totalStages;
    const winReward = isFinalStage ? gym.winReward : Math.floor(gym.winReward / 5);
    const lossPenalty = gym.lossPenalty;

    // Scenery: a gauntlet trainer may override the gym's background/spot; the
    // leader stage always uses the gym's. Text-box skin is gym-wide.
    const tBgId = stageTrainer?.backgroundAssetId ?? null;
    const tSpotId = stageTrainer?.spotAssetId ?? null;
    const tBgRandom = Boolean(stageTrainer?.backgroundRandom);
    const tSpotRandom = Boolean(stageTrainer?.spotRandom);
    const bgOverride = !isLeaderStage && (tBgId !== null || tBgRandom);
    const spotOverride = !isLeaderStage && (tSpotId !== null || tSpotRandom);
    const appearance = await this.resolveAppearance({
      backgroundAssetId: bgOverride ? tBgId : gym.backgroundAssetId,
      backgroundRandom: bgOverride ? tBgRandom : gym.backgroundRandom,
      spotAssetId: spotOverride ? tSpotId : gym.spotAssetId,
      spotRandom: spotOverride ? tSpotRandom : gym.spotRandom,
      textboxAssetId: gym.textboxAssetId,
    });

    // Dialogue: the leader speaks the gym's leader dialogue; a gauntlet trainer
    // speaks its own. Falls back to the battle image for the portrait.
    const opponentImage = isLeaderStage
      ? gym.leaderImgLink ?? null
      : stageTrainer?.imgLink ?? null;

    const dialogue = isLeaderStage
      ? this.buildDialogue(gym.leaderDialogue, opponentImage)
      : this.buildDialogue(stageTrainer?.dialogue, opponentImage);

    const battleData: WebBattleData = {
      web: true,
      mode: 'gauntlet',
      winReward,
      lossPenalty,
      playerKey,
      playerTrainerId: run.trainerId,
      opponentLabel: isLeaderStage
        ? `Gym Leader ${opponentName}`
        : `${opponentName} (${run.currentStage + 1}/${run.totalStages})`,
      opponentImage,
      turnOf: playerKey,
      gauntletRunId: run.id,
      gymId: gym.id,
      stageType: isLeaderStage ? 'leader' : 'trainer',
      stageNumber: run.currentStage + 1,
      aiDifficulty: isLeaderStage ? 'hard' : 'medium',
      appearance,
      dialogue,
    };

    const battle = await this.battleRepo.create({
      adventureId: null,
      battleType: 'trainer',
      createdByDiscordUserId: playerKey,
      battleData,
    });

    const playerParticipant = await this.participantRepo.create({
      battleId: battle.id,
      participantType: 'player',
      discordUserId: playerKey,
      trainerId: run.trainerId,
      trainerName,
      teamSide: 'players',
      turnOrder: 0,
    });

    const opponentParticipant = await this.participantRepo.create({
      battleId: battle.id,
      participantType: 'npc',
      trainerId: stageRealTrainerId,
      trainerName: opponentName,
      teamSide: 'opponents',
      turnOrder: 1,
    });

    const myMonsters = await this.loadOwnedMonsters(run.trainerId, run.teamMonsterIds);
    await this.addTeamToBattle(battle.id, playerParticipant.id, myMonsters);

    const realOpponents = await this.loadRealNpcMonsters(stageRealTrainerId, stageRealMonsterIds);
    if (realOpponents.length > 0) {
      await this.addTeamToBattle(battle.id, opponentParticipant.id, realOpponents);
    } else {
      await this.addSpecTeamToBattle(battle.id, opponentParticipant.id, opponentSpecTeam);
    }

    await this.gymRepo.updateGauntletRun(run.id, { currentBattleId: battle.id });

    await this.logRepo.logSystem(
      battle.id,
      isLeaderStage
        ? `🏟️ **Gym Leader ${opponentName}** accepts your challenge at **${gym.name}**!`
        : `🏟️ **${opponentName}** blocks your path at **${gym.name}**! (Stage ${run.currentStage + 1}/${run.totalStages})`
    );

    return battle;
  }

  /** Load a real trainer's monsters for use as an NPC gauntlet/leader team. */
  private async loadRealNpcMonsters(
    trainerId: number | null | undefined,
    monsterIds: number[] | undefined
  ): Promise<MonsterWithTrainer[]> {
    if (!trainerId || !monsterIds || monsterIds.length === 0) {
      return [];
    }
    const monsters: MonsterWithTrainer[] = [];
    for (const id of monsterIds.slice(0, MAX_TEAM_SIZE)) {
      const monster = await this.monsterRepo.findById(id);
      if (monster && monster.trainer_id === trainerId) {
        monsters.push(monster);
      }
    }
    return monsters;
  }

  // ==========================================================================
  // Battle creation — PvP
  // ==========================================================================

  async createPvpChallenge(
    user: UserRow,
    trainerId: number,
    monsterIds: number[],
    opponentTrainerId: number
  ): Promise<WebBattleStateView> {
    const playerKey = WebBattleService.actorKey(user);
    const trainer = await this.requireOwnedTrainer(user, trainerId);
    await this.loadOwnedMonsters(trainerId, monsterIds); // validate

    const opponentTrainer = await this.trainerRepo.findById(opponentTrainerId);
    if (!opponentTrainer) {
      throw new Error('Opponent trainer not found');
    }
    if (!opponentTrainer.player_user_id) {
      throw new Error('That trainer has no player to battle');
    }
    if (opponentTrainer.player_user_id === playerKey) {
      throw new Error('You cannot challenge your own trainer');
    }

    // PvP battles have no authored scenery — give them a random background/spot.
    const appearance = await this.resolveAppearance({ fallbackRandom: true });

    const battleData: WebBattleData = {
      web: true,
      mode: 'pvp',
      winReward: FRIENDLY_WIN_REWARD,
      lossPenalty: FRIENDLY_LOSS_PENALTY,
      playerKey,
      playerTrainerId: trainerId,
      opponentKey: opponentTrainer.player_user_id,
      opponentTrainerId,
      opponentLabel: opponentTrainer.name,
      turnOf: playerKey,
      pending: true,
      challengerMonsterIds: monsterIds,
      appearance,
    };

    const battle = await this.battleRepo.create({
      adventureId: null,
      battleType: 'pvp',
      createdByDiscordUserId: playerKey,
      battleData,
    });

    const playerParticipant = await this.participantRepo.create({
      battleId: battle.id,
      participantType: 'player',
      discordUserId: playerKey,
      trainerId,
      trainerName: trainer.name,
      teamSide: 'players',
      turnOrder: 0,
    });

    const myMonsters = await this.loadOwnedMonsters(trainerId, monsterIds);
    await this.addTeamToBattle(battle.id, playerParticipant.id, myMonsters);

    await this.logRepo.logSystem(
      battle.id,
      `📨 **${trainer.name}** challenges **${opponentTrainer.name}** to a battle!`
    );

    return this.getBattleState(battle.id, user);
  }

  /** PvP challenges waiting on this user. */
  async listIncomingChallenges(user: UserRow): Promise<Array<{
    battleId: number;
    challengerName: string;
    createdAt: Date;
  }>> {
    const key = WebBattleService.actorKey(user);
    const active = await this.battleRepo.findByStatus('active', 200);
    const results: Array<{ battleId: number; challengerName: string; createdAt: Date }> = [];
    for (const battle of active) {
      const data = battle.battleData as WebBattleData;
      if (data.web && data.mode === 'pvp' && data.pending && data.opponentKey === key) {
        const participants = await this.participantRepo.findByBattleId(battle.id);
        results.push({
          battleId: battle.id,
          challengerName: participants[0]?.trainerName ?? 'Unknown',
          createdAt: battle.createdAt,
        });
      }
    }
    return results;
  }

  async acceptPvpChallenge(
    user: UserRow,
    battleId: number,
    trainerId: number,
    monsterIds: number[]
  ): Promise<WebBattleStateView> {
    const key = WebBattleService.actorKey(user);
    const battle = await this.battleRepo.findById(battleId);
    if (battle?.status !== 'active') {
      throw new Error('Challenge no longer available');
    }
    const data = battle.battleData as WebBattleData;
    if (!data.web || data.mode !== 'pvp' || !data.pending) {
      throw new Error('This is not a pending PvP challenge');
    }
    if (data.opponentKey !== key && !user.is_admin) {
      throw new Error('This challenge is not addressed to you');
    }

    const trainer = await this.requireOwnedTrainer(user, trainerId);
    const myMonsters = await this.loadOwnedMonsters(trainerId, monsterIds);

    const participant = await this.participantRepo.create({
      battleId,
      participantType: 'player',
      discordUserId: key,
      trainerId,
      trainerName: trainer.name,
      teamSide: 'opponents',
      turnOrder: 1,
    });
    await this.addTeamToBattle(battleId, participant.id, myMonsters);

    await this.battleRepo.update(battleId, {
      battleData: { ...data, pending: false, opponentTrainerId: trainerId, opponentLabel: trainer.name, turnOf: data.playerKey },
    });

    await this.logRepo.logSystem(battleId, `⚔️ **${trainer.name}** accepted the challenge! The battle begins!`);

    return this.getBattleState(battleId, user);
  }

  async declinePvpChallenge(user: UserRow, battleId: number): Promise<void> {
    const key = WebBattleService.actorKey(user);
    const battle = await this.battleRepo.findById(battleId);
    if (battle?.status !== 'active') {
      return;
    }
    const data = battle.battleData as WebBattleData;
    const involved = data.opponentKey === key || data.playerKey === key;
    if (!data.web || data.mode !== 'pvp' || !data.pending || (!involved && !user.is_admin)) {
      throw new Error('Cannot decline this challenge');
    }
    await this.battleRepo.cancel(battleId);
  }

  /** Battles this user is participating in (active web battles). */
  async listMyBattles(user: UserRow): Promise<Array<{
    battleId: number;
    mode: WebBattleMode;
    opponentLabel: string;
    pending: boolean;
    isYourTurn: boolean;
    createdAt: Date;
  }>> {
    const key = WebBattleService.actorKey(user);
    const active = await this.battleRepo.findByStatus('active', 200);
    const results: Array<{
      battleId: number;
      mode: WebBattleMode;
      opponentLabel: string;
      pending: boolean;
      isYourTurn: boolean;
      createdAt: Date;
    }> = [];
    for (const battle of active) {
      const data = battle.battleData as WebBattleData;
      if (!data.web) {continue;}
      if (data.playerKey !== key && data.opponentKey !== key) {continue;}
      let opponentLabel = data.opponentLabel;
      if (data.playerKey !== key) {
        const participants = await this.participantRepo.findByBattleId(battle.id);
        const challenger = participants.find((p) => p.discordUserId === data.playerKey);
        opponentLabel = challenger?.trainerName ?? 'Challenger';
      }
      results.push({
        battleId: battle.id,
        mode: data.mode,
        opponentLabel,
        pending: Boolean(data.pending),
        isYourTurn: data.turnOf === key,
        createdAt: battle.createdAt,
      });
    }
    return results;
  }

  // ==========================================================================
  // Battle state
  // ==========================================================================

  async getBattleState(battleId: number, user: UserRow): Promise<WebBattleStateView> {
    const key = WebBattleService.actorKey(user);
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }
    const data = battle.battleData as WebBattleData;
    if (!data.web) {
      throw new Error('Not a web battle');
    }

    const participants = await this.participantRepo.findByBattleId(battleId);
    const monsters = await this.monsterBattleRepo.findByBattleId(battleId);
    const logs = await this.logRepo.findRecentByBattleId(battleId, 40);
    const turns = await this.turnRepo.findRecentByBattleId(battleId, RECENT_TURN_WINDOW);

    const myParticipant = participants.find((p) => p.discordUserId === key) ?? null;
    const yourSide = (myParticipant?.teamSide ?? null) as 'players' | 'opponents' | null;

    const monsterViews = monsters.map((m) => this.toMonsterView(m, participants, yourSide));

    // Full move data for your active monster (any move the monster knows is usable)
    let activeMoves: Move[] = [];
    if (myParticipant) {
      const active = monsters.find(
        (m) => m.participantId === myParticipant.id && m.isActive && !m.isFainted
      );
      if (active) {
        const moveNames = this.parseMoveset(
          (active.monsterData as { moveset?: string | string[] }).moveset ?? null
        );
        if (moveNames.length > 0) {
          activeMoves = await this.moveRepo.findByNames(moveNames);
          // Keep the monster's own move order and include unknown moves as basic entries
          const byName = new Map(activeMoves.map((m) => [m.moveName.toLowerCase(), m]));
          activeMoves = moveNames.map((name) =>
            byName.get(name.toLowerCase()) ?? {
              moveName: name,
              moveType: 'Normal',
              attribute: null,
              power: null,
              accuracy: null,
              pp: null,
              priority: null,
              description: null,
              effectChance: null,
              target: null,
              moveCategory: null,
              learnLevel: null,
            }
          );
        }
      }
    }

    const mustSwitch = Boolean(
      myParticipant &&
      !monsters.some((m) => m.participantId === myParticipant.id && m.isActive && !m.isFainted) &&
      monsters.some((m) => m.participantId === myParticipant.id && !m.isFainted)
    );

    return {
      battleId: battle.id,
      status: battle.status,
      mode: data.mode,
      pending: Boolean(data.pending),
      winnerType: battle.winnerType,
      yourSide,
      isYourTurn: battle.status === 'active' && !data.pending && data.turnOf === key,
      mustSwitch,
      opponentLabel: data.opponentLabel,
      winReward: data.winReward,
      lossPenalty: data.lossPenalty,
      stage: data.mode === 'gauntlet'
        ? {
            gymId: data.gymId ?? 0,
            stageType: data.stageType ?? 'trainer',
            stageNumber: data.stageNumber ?? 1,
            totalStages: await this.getRunTotalStages(data.gauntletRunId),
          }
        : null,
      appearance: data.appearance ?? null,
      dialogue: data.dialogue ?? null,
      participants: participants.map((p) => ({
        id: p.id,
        trainerId: p.trainerId,
        trainerName: p.trainerName,
        // A spec-authored gauntlet trainer / gym leader has no trainer row to join
        // against, so its portrait comes from the art frozen into battle_data.
        trainerImage:
          p.trainerImage ?? (p.teamSide === 'opponents' ? data.opponentImage ?? null : null),
        teamSide: p.teamSide,
        participantType: p.participantType,
        isYou: p.discordUserId === key,
      })),
      monsters: monsterViews,
      activeMoves,
      logs: logs.map((l) => ({
        id: l.id,
        message: l.message,
        createdAt: l.createdAt,
      })),
      recentTurns: turns.map((t) => this.toTurnView(t, participants, monsters)),
      settlement: data.settlement ?? null,
    };
  }

  /**
   * Trim a recorded turn down to the actor/target/move the arena animates from.
   *
   * The actor's side is resolved through its participant rather than read off the turn
   * row, so it stays correct for turns whose participant row was written without one.
   */
  private toTurnView(
    turn: BattleTurnWithDetails,
    participants: BattleParticipantWithDetails[],
    monsters: BattleMonsterWithDetails[]
  ): WebBattleTurnView {
    const actor = monsters.find((m) => m.id === turn.monsterId) ?? null;
    const actorParticipant = participants.find((p) => p.id === (actor?.participantId ?? turn.participantId));
    const action = turn.actionData ?? {};
    const targetId = typeof action.target_id === 'number' ? action.target_id : null;
    const moveName = typeof action.move_name === 'string' ? action.move_name : null;
    return {
      id: turn.id,
      turnNumber: turn.turnNumber,
      actionType: turn.actionType,
      actorMonsterId: turn.monsterId,
      actorSide: actorParticipant?.teamSide ?? turn.teamSide ?? null,
      targetMonsterId: targetId,
      moveName,
      damageDealt: turn.damageDealt,
    };
  }

  private async getRunTotalStages(runId: number | undefined): Promise<number> {
    if (!runId) {return 1;}
    const run = await this.gymRepo.findGauntletRunById(runId);
    return run?.totalStages ?? 1;
  }

  /**
   * Pull the battle-visible stat stages out of a monsterData blob.
   *
   * The blob is written by the status-move/status-effect services and can hold keys the
   * arena knows nothing about, so this whitelists the seven real stages, drops the
   * zeroes (an unmodified stat is not a "stat change") and re-clamps to -6..+6 rather
   * than trusting whatever was persisted.
   */
  private toStatStages(data: Record<string, unknown>): BattleStatStages {
    const raw = data.stat_modifications;
    if (!raw || typeof raw !== 'object') {
      return {};
    }
    const source = raw as Record<string, unknown>;
    const stages: BattleStatStages = {};
    for (const key of BATTLE_STAT_STAGE_KEYS) {
      const value = source[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) {
        continue;
      }
      stages[key] = Math.max(-6, Math.min(6, Math.trunc(value)));
    }
    return stages;
  }

  private toMonsterView(
    m: BattleMonsterWithDetails,
    participants: BattleParticipantWithDetails[],
    yourSide: 'players' | 'opponents' | null
  ): WebBattleMonsterView {
    const data = m.monsterData as Record<string, unknown>;
    const participant = participants.find((p) => p.id === m.participantId);
    const isYours = Boolean(yourSide && participant?.teamSide === yourSide);
    const types = [data.type1, data.type2, data.type3, data.type4, data.type5]
      .filter((t): t is string => Boolean(t));
    const speciesList = [data.species1, data.species2, data.species3]
      .filter((s): s is string => Boolean(s));
    return {
      id: m.id,
      monsterId: m.monsterId,
      participantId: m.participantId,
      name: (data.name as string) ?? 'Unknown',
      species: speciesList.join('/'),
      speciesList,
      types,
      attribute: (data.attribute as string) ?? null,
      gender: (data.gender as string) ?? null,
      level: (data.level as number) ?? 1,
      currentHp: m.currentHp,
      maxHp: m.maxHp,
      isActive: m.isActive,
      isFainted: m.isFainted,
      teamSide: participant?.teamSide ?? m.teamSide,
      imgLink: (data.img_link as string) ?? null,
      backSprite: (data.back_sprite as string) ?? null,
      statusEffects: m.statusEffects.map((s) => s.type),
      statStages: this.toStatStages(data),
      // Only reveal full movesets for your own monsters
      moves: isYours
        ? this.parseMoveset((data as { moveset?: string | string[] }).moveset ?? null)
        : [],
    };
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  async performAction(
    battleId: number,
    user: UserRow,
    action: WebBattleAction
  ): Promise<WebActionResult> {
    const key = WebBattleService.actorKey(user);
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }
    if (battle.status !== 'active') {
      throw new Error('This battle has ended');
    }
    const data = battle.battleData as WebBattleData;
    if (!data.web) {
      throw new Error('Not a web battle');
    }
    if (data.pending) {
      throw new Error('The challenge has not been accepted yet');
    }

    const participant = await this.participantRepo.findByBattleAndUser(battleId, key);
    if (!participant) {
      throw new Error('You are not in this battle');
    }

    if (action.type === 'forfeit') {
      return this.forfeit(battle, data, participant, user);
    }

    const myMonsters = await this.monsterBattleRepo.findByBattleId(battleId, {
      participantId: participant.id,
    });
    const myActive = myMonsters.find((m) => m.isActive && !m.isFainted);
    const faintSwitch = !myActive && myMonsters.some((m) => !m.isFainted);

    // Turn enforcement: free switch after a faint, otherwise it must be your turn
    if (!faintSwitch && data.turnOf !== key) {
      throw new Error("It's not your turn");
    }

    let message: string;
    let battleEnded = false;

    if (action.type === 'switch') {
      message = await this.performSwitch(battleId, participant, myMonsters, action.battleMonsterId);
      // A post-faint switch does not consume the turn
      if (faintSwitch) {
        const state = await this.getBattleState(battleId, user);
        return { success: true, message, battleEnded: false, state };
      }
    } else {
      if (!myActive) {
        throw new Error('You must send out a monster first');
      }
      const result = await this.actionService.executeAttack(
        battleId,
        key,
        action.moveName,
        null,
        '',
        (myActive.monsterData as { name?: string }).name ?? null
      );
      message = result.message;
      battleEnded = Boolean(result.battleEnded);
    }

    // Pass the turn
    const opponentKey = this.otherKey(data, key);
    await this.updateBattleData(battleId, { turnOf: opponentKey ?? key });

    // AI opponent responds immediately
    if (!battleEnded) {
      const refreshed = await this.battleRepo.findById(battleId);
      if (refreshed?.status === 'active') {
        const aiActed = await this.maybeRunAITurn(battleId, data);
        if (aiActed) {
          await this.updateBattleData(battleId, { turnOf: key });
        }
      }
    }

    // Settle if the battle ended at any point above
    const finalBattle = await this.battleRepo.findById(battleId);
    if (finalBattle && finalBattle.status !== 'active') {
      battleEnded = true;
      await this.settleBattle(finalBattle);
    }

    const state = await this.getBattleState(battleId, user);
    return { success: true, message, battleEnded, state };
  }

  private otherKey(data: WebBattleData, key: string): string | null {
    if (data.mode !== 'pvp') {return null;}
    return data.playerKey === key ? data.opponentKey ?? null : data.playerKey;
  }

  private async performSwitch(
    battleId: number,
    participant: BattleParticipantWithDetails,
    myMonsters: BattleMonsterWithDetails[],
    battleMonsterId: number | undefined
  ): Promise<string> {
    const target = myMonsters.find((m) => m.id === battleMonsterId);
    if (!target) {
      throw new Error('That monster is not on your team');
    }
    if (target.isFainted || target.currentHp <= 0) {
      throw new Error('That monster has fainted');
    }
    if (target.isActive) {
      throw new Error('That monster is already in battle');
    }

    for (const m of myMonsters) {
      if (m.isActive) {
        await this.monsterBattleRepo.setInactive(m.id);
      }
    }
    await this.monsterBattleRepo.setActive(target.id);

    const name = (target.monsterData as { name?: string }).name ?? 'Monster';
    const message = `🔄 **${participant.trainerName}** sent out **${name}**!`;
    await this.logRepo.logSystem(battleId, message);
    return message;
  }

  /** Run one AI action if the opponent side is NPC-controlled. Returns true if AI acted. */
  private async maybeRunAITurn(battleId: number, data: WebBattleData): Promise<boolean> {
    if (data.mode === 'pvp') {
      return false;
    }

    const participants = await this.participantRepo.findByBattleId(battleId);
    const aiParticipant = participants.find((p) => p.participantType === 'npc');
    if (!aiParticipant) {
      return false;
    }

    // Ensure the AI has an active monster (auto-switch after a faint)
    const aiMonsters = await this.monsterBattleRepo.findByBattleId(battleId, {
      participantId: aiParticipant.id,
    });
    const aiActive = aiMonsters.find((m) => m.isActive && !m.isFainted);
    if (!aiActive) {
      const bench = aiMonsters.find((m) => !m.isFainted && m.currentHp > 0);
      if (!bench) {
        return false; // battle end handled by checkBattleConditions
      }
      for (const m of aiMonsters) {
        if (m.isActive) {
          await this.monsterBattleRepo.setInactive(m.id);
        }
      }
      await this.monsterBattleRepo.setActive(bench.id);
      const name = (bench.monsterData as { name?: string }).name ?? 'Monster';
      await this.logRepo.logSystem(
        battleId,
        `🔄 **${aiParticipant.trainerName}** sent out **${name}**!`
      );
      // Replacing a fainted monster consumes the AI's turn
      return true;
    }

    const allMonsters = await this.monsterBattleRepo.findByBattleId(battleId);
    const battleState = {
      participants: participants.map((p) => ({
        id: p.id,
        trainerId: p.trainerId ?? undefined,
        trainerName: p.trainerName,
        teamSide: p.teamSide,
        isAI: p.participantType !== 'player',
      })),
      monsters: allMonsters.map((m) => {
        const d = m.monsterData as Record<string, unknown>;
        const participant = participants.find((p) => p.id === m.participantId);
        return {
          id: m.id,
          participantId: m.participantId,
          name: (d.name as string) ?? 'Unknown',
          species1: (d.species1 as string) ?? null,
          type1: (d.type1 as string) ?? null,
          type2: (d.type2 as string) ?? null,
          level: (d.level as number) ?? 1,
          currentHp: m.currentHp,
          maxHp: m.maxHp,
          isActive: m.isActive,
          isFainted: m.isFainted,
          teamSide: (participant?.teamSide ?? 'opponents') as 'players' | 'opponents',
          monsterData: d as { moveset?: string },
        };
      }),
    };

    const aiDecision = await this.aiService.selectAction(
      {
        id: aiParticipant.id,
        trainerId: aiParticipant.trainerId ?? undefined,
        trainerName: aiParticipant.trainerName,
        teamSide: aiParticipant.teamSide,
        isAI: true,
      },
      battleState,
      data.aiDifficulty ?? 'medium'
    );

    const actionType = aiDecision.actionType ?? aiDecision.action_type;
    const actionData = aiDecision.actionData ?? aiDecision.action_data ?? {};

    if (actionType === 'switch') {
      const monsterId = actionData.monsterId ?? actionData.monster_id;
      const target = aiMonsters.find((m) => m.id === monsterId && !m.isFainted);
      if (target && !target.isActive) {
        for (const m of aiMonsters) {
          if (m.isActive) {
            await this.monsterBattleRepo.setInactive(m.id);
          }
        }
        await this.monsterBattleRepo.setActive(target.id);
        const name = (target.monsterData as { name?: string }).name ?? 'Monster';
        await this.logRepo.logSystem(
          battleId,
          `🔄 **${aiParticipant.trainerName}** switched to **${name}**!`
        );
      }
      return true;
    }

    if (actionType === 'attack' || actionType === 'wait') {
      // Resolve the move and target for the engine's AI attack executor
      let moveName = actionData.moveName ?? actionData.move_name;
      let targetId = actionData.targetId ?? actionData.target_id;

      if (!moveName) {
        const moveset = this.parseMoveset(
          (aiActive.monsterData as { moveset?: string | string[] }).moveset ?? null
        );
        moveName = moveset[Math.floor(Math.random() * Math.max(1, moveset.length))] ?? 'Tackle';
      }
      if (!targetId) {
        const playerActive = allMonsters.find((m) => {
          const p = participants.find((pp) => pp.id === m.participantId);
          return p?.teamSide !== aiParticipant.teamSide && m.isActive && !m.isFainted;
        });
        targetId = playerActive?.id;
      }
      if (!targetId) {
        return false;
      }

      await this.actionService.executeAIAttack(battleId, aiParticipant, {
        action_type: 'attack',
        action_data: { move_name: moveName, target_id: targetId },
        ai_message: `**${aiParticipant.trainerName}** commands an attack!`,
        word_count: 0,
      });
      return true;
    }

    return true;
  }

  private async forfeit(
    battle: BattleInstance,
    _data: WebBattleData,
    participant: BattleParticipantWithDetails,
    user: UserRow
  ): Promise<WebActionResult> {
    const winnerSide = participant.teamSide === 'players' ? 'opponents' : 'players';
    await this.logRepo.logSystem(
      battle.id,
      `🏳️ **${participant.trainerName}** forfeited the battle!`
    );
    const completed = await this.battleRepo.complete(battle.id, winnerSide);
    await this.settleBattle(completed);

    const state = await this.getBattleState(battle.id, user);
    return {
      success: true,
      message: 'You forfeited the battle.',
      battleEnded: true,
      state,
    };
  }

  // ==========================================================================
  // Settlement — money, badges, gauntlet progression
  // ==========================================================================

  /** Apply money/badge/gauntlet outcomes exactly once per battle. */
  /** Read a battle monster's level from its snapshot data, defaulting to 1. */
  private battleMonsterLevel(monster: { monsterData: Record<string, unknown> }): number {
    const lvl = Number(monster.monsterData?.level);
    return Number.isFinite(lvl) && lvl > 0 ? lvl : 1;
  }

  /**
   * Award scaled levels to every real (owned) monster on the winning side.
   * Returns a map of participantId -> rewards for embedding into settlements.
   */
  private async awardBattleLevels(
    battleId: number,
    winnerSide: string | null
  ): Promise<Map<number, WebBattleLevelReward[]>> {
    const rewards = new Map<number, WebBattleLevelReward[]>();
    if (winnerSide !== 'players' && winnerSide !== 'opponents') {
      return rewards; // draws / cancellations grant nothing
    }

    const allMonsters = await this.monsterBattleRepo.findByBattleId(battleId);
    const losingSide = winnerSide === 'players' ? 'opponents' : 'players';

    const opponentLevels = allMonsters
      .filter((m) => m.teamSide === losingSide)
      .map((m) => this.battleMonsterLevel(m));
    if (opponentLevels.length === 0) {
      return rewards;
    }
    const avgOpponentLevel =
      opponentLevels.reduce((sum, l) => sum + l, 0) / opponentLevels.length;

    // monsterId === 0 is a wild/gym-spec opponent with no DB row to level up.
    const winners = allMonsters.filter((m) => m.teamSide === winnerSide && m.monsterId > 0);

    for (const monster of winners) {
      const myLevel = this.battleMonsterLevel(monster);
      if (myLevel >= MAX_MONSTER_LEVEL) {
        continue;
      }
      const levels = computeBattleLevelReward(myLevel, avgOpponentLevel, MAX_MONSTER_LEVEL);
      if (levels <= 0) {
        continue;
      }

      // Full level-up: recalculates stats, disperses EVs, updates friendship
      // and rolls new move learning (not just a raw level bump).
      const updated = await this.monsterInitializer.levelUpMonster(monster.monsterId, levels);
      const newLevel = updated.level ?? myLevel + levels;
      const list = rewards.get(monster.participantId) ?? [];
      list.push({
        monsterId: monster.monsterId,
        name: updated.name ?? monster.originalName ?? 'Monster',
        levels: newLevel - myLevel,
        newLevel,
      });
      rewards.set(monster.participantId, list);
    }

    return rewards;
  }

  private async settleBattle(battle: BattleInstance): Promise<void> {
    const data = battle.battleData as WebBattleData;
    if (!data.web || data.settled || battle.status === 'cancelled') {
      return;
    }

    const participants = await this.participantRepo.findByBattleId(battle.id);
    const winnerSide = battle.winnerType;

    // Award levels to the winning side's real monsters, scaled by how much the
    // losing team out-leveled them.
    const levelRewardsByParticipant = await this.awardBattleLevels(battle.id, winnerSide);

    const settlements: Record<string, WebBattleSettlement> = {};

    for (const p of participants) {
      if (p.participantType !== 'player' || !p.trainerId) {
        continue;
      }
      const won = winnerSide === p.teamSide;
      let delta = 0;
      if (winnerSide === 'players' || winnerSide === 'opponents') {
        if (won) {
          delta = data.winReward;
        } else {
          const trainer = await this.trainerRepo.findById(p.trainerId);
          const balance = trainer?.currency_amount ?? 0;
          delta = -Math.min(balance, data.lossPenalty);
        }
        if (delta !== 0) {
          await this.trainerRepo.updateCurrency(p.trainerId, delta);
        }
      }
      settlements[p.discordUserId ?? String(p.id)] = {
        won,
        currencyDelta: delta,
        levelRewards: levelRewardsByParticipant.get(p.id) ?? [],
        badge: null,
        gauntlet: null,
      };
    }

    // Gauntlet progression + badge
    const playerSettlement = settlements[data.playerKey];
    if (data.mode === 'gauntlet' && data.gauntletRunId && playerSettlement) {
      const run = await this.gymRepo.findGauntletRunById(data.gauntletRunId);
      const gym = data.gymId ? await this.gymRepo.findById(data.gymId) : null;

      if (run && gym && run.status === 'active') {
        if (playerSettlement.won) {
          const isFinalStage = run.currentStage + 1 >= run.totalStages;
          if (isFinalStage) {
            await this.gymRepo.updateGauntletRun(run.id, {
              currentStage: run.currentStage + 1,
              status: 'completed',
              completedAt: new Date(),
              currentBattleId: null,
            });
            // Gyms, leagues and champion battles award a badge; plain AI
            // gauntlets just pay out.
            if (gym.gymKind !== 'ai') {
              await this.gymRepo.awardBadge(run.trainerId, gym.id);
              playerSettlement.badge = {
                gymId: gym.id,
                gymName: gym.name,
                badgeName: gym.badgeName,
                badgeImgLink: gym.badgeImgLink,
              };
              const badgeMessage =
                gym.gymKind === 'champion'
                  ? `👑 **${gym.badgeName}** claimed! You are the new Champion — ${gym.name} conquered!`
                  : gym.gymKind === 'league'
                    ? `🏅 **${gym.badgeName}** earned! You bested ${gym.leaderName} at the ${gym.name}!`
                    : `🏅 **${gym.badgeName}** earned! ${gym.leaderName} salutes your victory at ${gym.name}!`;
              await this.logRepo.logSystem(battle.id, badgeMessage);
            } else {
              await this.logRepo.logSystem(
                battle.id,
                `🏆 **${gym.name}** gauntlet conquered!`
              );
            }
            playerSettlement.gauntlet = {
              runId: run.id,
              status: 'completed',
              currentStage: run.currentStage + 1,
              totalStages: run.totalStages,
              nextBattleId: null,
            };
          } else {
            // Advance to the next stage and spin up the next battle
            const updatedRun = await this.gymRepo.updateGauntletRun(run.id, {
              currentStage: run.currentStage + 1,
            });
            const playerParticipant = participants.find((p) => p.discordUserId === data.playerKey);
            const owner = {
              id: run.userId,
              discord_id: data.playerKey.startsWith('web:') ? null : data.playerKey,
            } as UserRow;
            const nextBattle = await this.createGauntletStageBattle(
              owner,
              updatedRun,
              gym,
              playerParticipant?.trainerName ?? 'Trainer'
            );
            playerSettlement.gauntlet = {
              runId: run.id,
              status: 'active',
              currentStage: updatedRun.currentStage,
              totalStages: run.totalStages,
              nextBattleId: nextBattle.id,
            };
          }
        } else {
          await this.gymRepo.updateGauntletRun(run.id, {
            status: 'failed',
            completedAt: new Date(),
            currentBattleId: null,
          });
          playerSettlement.gauntlet = {
            runId: run.id,
            status: 'failed',
            currentStage: run.currentStage,
            totalStages: run.totalStages,
            nextBattleId: null,
          };
        }
      }
    }

    await this.updateBattleData(battle.id, {
      settled: true,
      settlement: playerSettlement ?? null,
      settlements,
    });
  }

  private async updateBattleData(
    battleId: number,
    patch: Record<string, unknown>
  ): Promise<void> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {return;}
    await this.battleRepo.update(battleId, {
      battleData: { ...(battle.battleData as object), ...patch },
    });
  }

  // ==========================================================================
  // Gyms & badges (read APIs)
  // ==========================================================================

  async listGyms(
    trainerId?: number
  ): Promise<Array<Gym & { earned: boolean; locked: boolean; lockReason: string | null }>> {
    const gyms = await this.gymRepo.findAllActive();
    const earned = trainerId ? await this.gymRepo.findBadgesByTrainerId(trainerId) : [];
    const earnedGymIds = new Set(earned.map((b) => b.gymId));
    const unlock = this.computeUnlock(gyms, earnedGymIds);
    return gyms.map((gym) => {
      const { locked, lockReason } = this.lockStateFor(gym, unlock);
      return {
        ...gym,
        // Never leak full team specs to the client list; keep sizes only
        leaderTeam: gym.leaderTeam.map((m) => ({ ...m, moves: undefined })),
        // Don't spoil authored dialogue before the battle actually starts
        leaderDialogue: {},
        gauntletTrainers: gym.gauntletTrainers.map((t) => ({ ...t, dialogue: null })),
        earned: earnedGymIds.has(gym.id),
        locked,
        lockReason,
      };
    });
  }

  /**
   * Compute a trainer's progression gates across all active gyms: whether every
   * gym badge is held, and whether every league badge is held. An empty pool of
   * a kind counts as fully-earned (so leagues open if no gyms are configured).
   */
  private computeUnlock(
    gyms: Gym[],
    earnedGymIds: Set<number>
  ): { allGymBadges: boolean; allLeagueBadges: boolean } {
    const byKind = (kind: GymKind): Gym[] => gyms.filter((g) => g.gymKind === kind);
    const allGymBadges = byKind('gym').every((g) => earnedGymIds.has(g.id));
    const allLeagueBadges = byKind('league').every((g) => earnedGymIds.has(g.id));
    return { allGymBadges, allLeagueBadges };
  }

  /** Whether a given league/champion battle is locked for a trainer, and why. */
  private lockStateFor(
    gym: Gym,
    unlock: { allGymBadges: boolean; allLeagueBadges: boolean }
  ): { locked: boolean; lockReason: string | null } {
    if (gym.gymKind === 'league' && !unlock.allGymBadges) {
      return { locked: true, lockReason: 'Earn every gym badge to challenge the league.' };
    }
    if (gym.gymKind === 'champion' && (!unlock.allGymBadges || !unlock.allLeagueBadges)) {
      return {
        locked: true,
        lockReason: 'Earn every gym badge and all league badges to challenge the champion.',
      };
    }
    return { locked: false, lockReason: null };
  }

  async getTrainerBadges(trainerId: number): Promise<TrainerBadge[]> {
    return this.gymRepo.findBadgesByTrainerId(trainerId);
  }
}
