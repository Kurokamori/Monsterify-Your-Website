import { MoveRepository, Move } from '../../repositories/move.repository';
import {
  calculateTypeEffectiveness,
  MonsterTypeValue,
  normalizeMonsterType,
} from '../../utils/constants/monster-types';

// ============================================================================
// Types
// ============================================================================

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type DifficultySettings = {
  randomChance: number;
  healThreshold: number;
  switchThreshold: number;
  typeAdvantageWeight: number;
};

export type DifficultyConfig = Record<AIDifficulty, DifficultySettings>;

export type TeamSide = 'players' | 'opponents';

export type BattleParticipant = {
  id: number;
  trainerId?: number;
  trainerName?: string;
  trainer_name?: string;
  teamSide: TeamSide;
  team_side?: TeamSide;
  isAI: boolean;
  is_ai?: boolean;
};

export type BattleMonster = {
  id: number;
  participantId: number;
  participant_id?: number;
  name: string;
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level: number;
  currentHp: number;
  current_hp?: number;
  maxHp: number;
  max_hp?: number;
  isActive: boolean;
  is_active?: boolean;
  isFainted: boolean;
  is_fainted?: boolean;
  teamSide: TeamSide;
  team_side?: TeamSide;
  monsterData?: {
    moveset?: string;
    [key: string]: unknown;
  };
  monster_data?: {
    moveset?: string;
    [key: string]: unknown;
  };
};

export type BattleState = {
  monsters: BattleMonster[];
  participants: BattleParticipant[];
};

export type ActionType = 'attack' | 'item' | 'switch' | 'wait';

export type ActionData = {
  move_name?: string;
  moveName?: string;
  target_id?: number;
  targetId?: number;
  item_name?: string;
  itemName?: string;
  monster_id?: number;
  monsterId?: number;
};

export type AIAction = {
  actionType: ActionType;
  action_type?: ActionType;
  actionData: ActionData;
  action_data?: ActionData;
};

export type AIActionResult = AIAction & {
  aiMessage: string;
  ai_message?: string;
  wordCount: number;
  word_count?: number;
};

export type HealingItem = {
  name: string;
  healAmount: number;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  easy: {
    randomChance: 0.4,
    healThreshold: 0.2,
    switchThreshold: 0.1,
    typeAdvantageWeight: 0.3,
  },
  medium: {
    randomChance: 0.2,
    healThreshold: 0.3,
    switchThreshold: 0.2,
    typeAdvantageWeight: 0.6,
  },
  hard: {
    randomChance: 0.1,
    healThreshold: 0.4,
    switchThreshold: 0.3,
    typeAdvantageWeight: 0.9,
  },
};

const BASIC_MOVES = ['Tackle', 'Scratch', 'Pound'];

const HEALING_ITEMS: HealingItem[] = [
  { name: 'Potion', healAmount: 20 },
  { name: 'Super Potion', healAmount: 50 },
  { name: 'Hyper Potion', healAmount: 200 },
];

const AI_MESSAGES = {
  attack: [
    '{trainer} commands their monster to attack!',
    '{trainer} calls out an offensive move!',
    '{trainer} goes on the offensive!',
    '{trainer} strikes with determination!',
  ],
  item: [
    '{trainer} reaches for an item!',
    '{trainer} uses a helpful item!',
    '{trainer} provides support with an item!',
  ],
  switch: [
    '{trainer} recalls their monster!',
    '{trainer} makes a tactical switch!',
    '{trainer} changes their strategy!',
  ],
  wait: [
    '{trainer} waits and watches...',
    '{trainer} takes a moment to think...',
    '{trainer} observes the battlefield...',
  ],
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for AI decision making in battles
 */
export class BattleAIService {
  private difficulties: DifficultyConfig;
  private moveRepository: MoveRepository;

  constructor(moveRepository?: MoveRepository, difficultyConfig?: Partial<DifficultyConfig>) {
    this.moveRepository = moveRepository ?? new MoveRepository();
    this.difficulties = {
      ...DEFAULT_DIFFICULTY_CONFIG,
      ...difficultyConfig,
    };
  }

  /**
   * Select AI action for a participant
   */
  async selectAction(
    participant: BattleParticipant,
    battleState: BattleState,
    difficulty: AIDifficulty = 'medium'
  ): Promise<AIAction> {
    try {
      const difficultySettings = this.difficulties[difficulty] || this.difficulties.medium;

      // Get AI's active monster
      const aiMonster = this.getActiveMonster(participant, battleState.monsters);
      if (!aiMonster) {
        return { actionType: 'wait', actionData: {} };
      }

      // Get opponent monsters
      const opponentMonsters = this.getOpponentMonsters(participant, battleState.monsters);
      const targetMonster = this.selectTarget(aiMonster, opponentMonsters, difficultySettings);

      if (!targetMonster) {
        return { actionType: 'wait', actionData: {} };
      }

      // Decide action type based on situation
      const actionType = await this.decideActionType(aiMonster, difficultySettings);

      switch (actionType) {
        case 'attack':
          return await this.selectAttack(aiMonster, targetMonster, difficultySettings);
        case 'item':
          return await this.selectItem(aiMonster);
        case 'switch':
          return await this.selectSwitch(participant, battleState.monsters);
        default:
          return { actionType: 'wait', actionData: {} };
      }
    } catch (error) {
      console.error('Error selecting AI action:', error);
      // Fallback to random attack
      return await this.selectRandomAttack(participant, battleState);
    }
  }

  /**
   * Get active monster for participant
   */
  private getActiveMonster(
    participant: BattleParticipant,
    monsters: BattleMonster[]
  ): BattleMonster | null {
    return (
      monsters.find(
        (m) =>
          (m.participantId === participant.id || m.participant_id === participant.id) &&
          (m.isActive || m.is_active) &&
          !(m.isFainted || m.is_fainted)
      ) ?? null
    );
  }

  /**
   * Get opponent monsters
   */
  private getOpponentMonsters(
    participant: BattleParticipant,
    monsters: BattleMonster[]
  ): BattleMonster[] {
    const participantSide = participant.teamSide || participant.team_side;
    const opponentSide: TeamSide = participantSide === 'players' ? 'opponents' : 'players';

    return monsters.filter(
      (m) =>
        (m.teamSide === opponentSide || m.team_side === opponentSide) &&
        (m.isActive || m.is_active) &&
        !(m.isFainted || m.is_fainted)
    );
  }

  /**
   * Select target monster
   */
  private selectTarget(
    aiMonster: BattleMonster,
    opponentMonsters: BattleMonster[],
    settings: DifficultySettings
  ): BattleMonster | null {
    if (opponentMonsters.length === 0) {
      return null;
    }

    // Random selection chance
    if (Math.random() < settings.randomChance) {
      const randomIndex = Math.floor(Math.random() * opponentMonsters.length);
      return opponentMonsters[randomIndex] ?? null;
    }

    // Strategic target selection
    const firstTarget = opponentMonsters[0];
    if (!firstTarget) {
      return null;
    }

    let bestTarget: BattleMonster = firstTarget;
    let bestScore = 0;

    for (const opponent of opponentMonsters) {
      let score = 0;

      // Prefer low HP targets
      const opponentHp = opponent.currentHp ?? opponent.current_hp ?? 100;
      const opponentMaxHp = opponent.maxHp ?? opponent.max_hp ?? 100;
      const hpRatio = opponentHp / opponentMaxHp;
      score += (1 - hpRatio) * 50;

      // Consider type advantages
      const aiTypes = this.getMonsterTypes(aiMonster);
      const opponentTypes = this.getMonsterTypes(opponent);

      // Simple type advantage calculation
      for (const aiType of aiTypes) {
        if (aiType) {
          const normalized = normalizeMonsterType(aiType);
          if (normalized) {
            const validOpponentTypes = opponentTypes.filter((t): t is string => t !== null);
            const normalizedOpponentTypes = validOpponentTypes
              .map(t => normalizeMonsterType(t))
              .filter((t): t is MonsterTypeValue => t !== null);
            const effectiveness = calculateTypeEffectiveness(normalized, normalizedOpponentTypes);
            score += (effectiveness - 1) * 30;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = opponent;
      }
    }

    return bestTarget;
  }

  /**
   * Decide what type of action to take
   */
  private async decideActionType(
    aiMonster: BattleMonster,
    settings: DifficultySettings
  ): Promise<ActionType> {
    // Check if monster needs healing
    const currentHp = aiMonster.currentHp ?? aiMonster.current_hp ?? 100;
    const maxHp = aiMonster.maxHp ?? aiMonster.max_hp ?? 100;
    const hpRatio = currentHp / maxHp;

    if (hpRatio < settings.healThreshold && Math.random() < 0.7) {
      return 'item'; // Try to heal
    }

    // Check if should switch (low HP and no healing available)
    if (hpRatio < settings.switchThreshold && Math.random() < 0.5) {
      return 'switch';
    }

    // Default to attack
    return 'attack';
  }

  /**
   * Select attack move
   */
  private async selectAttack(
    aiMonster: BattleMonster,
    targetMonster: BattleMonster,
    settings: DifficultySettings
  ): Promise<AIAction> {
    try {
      // Get monster's moves
      const moves = await this.getMonsterMoves(aiMonster);

      if (moves.length === 0) {
        // No moves available, use struggle
        return {
          actionType: 'attack',
          actionData: {
            moveName: 'Struggle',
            targetId: targetMonster.id,
          },
        };
      }

      // Random move selection chance
      if (Math.random() < settings.randomChance) {
        const randomIndex = Math.floor(Math.random() * moves.length);
        const randomMove = moves[randomIndex];
        if (randomMove) {
          return {
            actionType: 'attack',
            actionData: {
              moveName: randomMove.moveName,
              targetId: targetMonster.id,
            },
          };
        }
      }

      // Strategic move selection
      const firstMove = moves[0];
      if (!firstMove) {
        return {
          actionType: 'attack',
          actionData: {
            moveName: 'Struggle',
            targetId: targetMonster.id,
          },
        };
      }

      let bestMove: Move = firstMove;
      let bestScore = 0;

      const targetTypes = this.getMonsterTypes(targetMonster)
        .filter((t): t is string => t !== null)
        .map(t => normalizeMonsterType(t))
        .filter((t): t is MonsterTypeValue => t !== null);
      const aiTypes = this.getMonsterTypes(aiMonster);

      for (const move of moves) {
        let score = move.power ?? 40;

        // Consider type effectiveness
        const moveType = normalizeMonsterType(move.moveType);
        if (moveType) {
          const effectiveness = calculateTypeEffectiveness(moveType, targetTypes);
          score *= effectiveness * settings.typeAdvantageWeight;
        }

        // Consider STAB (Same Type Attack Bonus)
        if (aiTypes.includes(move.moveType)) {
          score *= 1.5;
        }

        // Consider accuracy
        score *= (move.accuracy ?? 100) / 100;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return {
        actionType: 'attack',
        actionData: {
          moveName: bestMove.moveName,
          targetId: targetMonster.id,
        },
      };
    } catch (error) {
      console.error('Error selecting attack:', error);
      return {
        actionType: 'attack',
        actionData: {
          moveName: 'Tackle',
          targetId: targetMonster.id,
        },
      };
    }
  }

  /**
   * Get monster's available moves
   */
  private async getMonsterMoves(monster: BattleMonster): Promise<Move[]> {
    try {
      let moveset: string[] = [];

      const monsterData = monster.monsterData ?? monster.monster_data;
      if (monsterData?.moveset) {
        try {
          moveset = JSON.parse(monsterData.moveset);
        } catch {
          console.error('Error parsing moveset');
        }
      }

      if (!Array.isArray(moveset) || moveset.length === 0) {
        // Generate basic moves based on monster type/level
        moveset = await this.generateBasicMoves(monster);
      }

      // Get move details
      if (moveset.length > 0) {
        return await this.moveRepository.findByNames(moveset);
      }

      return [];
    } catch (error) {
      console.error('Error getting monster moves:', error);
      return [];
    }
  }

  /**
   * Generate basic moves for a monster
   */
  private async generateBasicMoves(monster: BattleMonster): Promise<string[]> {
    try {
      const moves = [...BASIC_MOVES];
      const monsterTypes = this.getMonsterTypes(monster);

      // Add type-specific moves
      for (const type of monsterTypes) {
        if (!type) {
          continue;
        }

        const typeMoves = await this.moveRepository.findByType(type);
        if (typeMoves.length > 0) {
          // Add a random move of this type
          const randomIndex = Math.floor(Math.random() * typeMoves.length);
          const randomTypeMove = typeMoves[randomIndex];
          if (randomTypeMove) {
            moves.push(randomTypeMove.moveName);
          }
        }
      }

      return moves.slice(0, 4); // Limit to 4 moves
    } catch (error) {
      console.error('Error generating basic moves:', error);
      return ['Tackle'];
    }
  }

  /**
   * Get monster types as array
   */
  private getMonsterTypes(monster: BattleMonster): string[] {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(
      (t): t is string => t !== null && t !== undefined
    );
  }

  /**
   * Select item to use
   */
  private async selectItem(aiMonster: BattleMonster): Promise<AIAction> {
    const currentHp = aiMonster.currentHp ?? aiMonster.current_hp ?? 100;
    const maxHp = aiMonster.maxHp ?? aiMonster.max_hp ?? 100;
    const hpMissing = maxHp - currentHp;

    // Select appropriate healing item (default to Potion)
    const defaultItem: HealingItem = { name: 'Potion', healAmount: 20 };
    let selectedItem: HealingItem = HEALING_ITEMS[0] ?? defaultItem;
    for (const item of HEALING_ITEMS) {
      if (item.healAmount <= hpMissing * 1.2) {
        selectedItem = item;
      }
    }

    return {
      actionType: 'item',
      actionData: {
        itemName: selectedItem.name,
        targetId: aiMonster.id,
      },
    };
  }

  /**
   * Select monster to switch to
   */
  private async selectSwitch(
    participant: BattleParticipant,
    monsters: BattleMonster[]
  ): Promise<AIAction> {
    // Get available monsters to switch to
    const availableMonsters = monsters.filter(
      (m) =>
        (m.participantId === participant.id || m.participant_id === participant.id) &&
        !(m.isActive || m.is_active) &&
        !(m.isFainted || m.is_fainted)
    );

    const firstAvailable = availableMonsters[0];
    if (!firstAvailable) {
      return { actionType: 'wait', actionData: {} };
    }

    // Select monster with highest HP
    let bestMonster: BattleMonster = firstAvailable;
    let bestHpRatio = 0;

    for (const monster of availableMonsters) {
      const currentHp = monster.currentHp ?? monster.current_hp ?? 100;
      const maxHp = monster.maxHp ?? monster.max_hp ?? 100;
      const hpRatio = currentHp / maxHp;

      if (hpRatio > bestHpRatio) {
        bestHpRatio = hpRatio;
        bestMonster = monster;
      }
    }

    return {
      actionType: 'switch',
      actionData: {
        monsterId: bestMonster.id,
      },
    };
  }

  /**
   * Fallback random attack selection
   */
  private async selectRandomAttack(
    participant: BattleParticipant,
    battleState: BattleState
  ): Promise<AIAction> {
    try {
      const aiMonster = this.getActiveMonster(participant, battleState.monsters);
      const opponentMonsters = this.getOpponentMonsters(participant, battleState.monsters);

      if (!aiMonster || opponentMonsters.length === 0) {
        return { actionType: 'wait', actionData: {} };
      }

      const targetIndex = Math.floor(Math.random() * opponentMonsters.length);
      const target = opponentMonsters[targetIndex];
      const moveIndex = Math.floor(Math.random() * BASIC_MOVES.length);
      const move = BASIC_MOVES[moveIndex] ?? 'Tackle';

      if (!target) {
        return { actionType: 'wait', actionData: {} };
      }

      return {
        actionType: 'attack',
        actionData: {
          moveName: move,
          targetId: target.id,
        },
      };
    } catch (error) {
      console.error('Error selecting random attack:', error);
      return { actionType: 'wait', actionData: {} };
    }
  }

  /**
   * Process AI turn automatically
   */
  async processAITurn(
    participant: BattleParticipant,
    battleState: BattleState,
    difficulty: AIDifficulty = 'medium'
  ): Promise<AIActionResult> {
    try {
      // Add a small delay to make AI feel more natural
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const action = await this.selectAction(participant, battleState, difficulty);

      // Add AI flavor text
      const aiMessage = this.generateAIMessage(participant, action);

      return {
        ...action,
        actionType: action.actionType,
        actionData: action.actionData,
        aiMessage,
        wordCount: aiMessage.split(' ').length,
      };
    } catch (error) {
      console.error('Error processing AI turn:', error);
      const trainerName =
        participant.trainerName ?? participant.trainer_name ?? 'AI Trainer';

      return {
        actionType: 'wait',
        actionData: {},
        aiMessage: `${trainerName} hesitates...`,
        wordCount: 3,
      };
    }
  }

  /**
   * Generate AI flavor message
   */
  generateAIMessage(participant: BattleParticipant, action: AIAction): string {
    const trainerName =
      participant.trainerName ?? participant.trainer_name ?? 'AI Trainer';

    const actionType = action.actionType ?? 'wait';
    const actionMessages = AI_MESSAGES[actionType] ?? AI_MESSAGES.wait;
    const templateIndex = Math.floor(Math.random() * actionMessages.length);
    const template = actionMessages[templateIndex] ?? `${trainerName} takes action!`;

    return template.replace('{trainer}', trainerName);
  }

  /**
   * Get difficulty settings
   */
  getDifficultySettings(difficulty: AIDifficulty): DifficultySettings {
    return { ...this.difficulties[difficulty] };
  }

  /**
   * Update difficulty settings
   */
  setDifficultySettings(difficulty: AIDifficulty, settings: Partial<DifficultySettings>): void {
    this.difficulties[difficulty] = {
      ...this.difficulties[difficulty],
      ...settings,
    };
  }
}
