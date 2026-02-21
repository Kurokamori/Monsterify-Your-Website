import { db } from '../database';
import { TrainerAchievementRepository } from '../repositories/trainer-achievement.repository';
import type { AchievementDefinition } from '../repositories/trainer-achievement.repository';

// =============================================================================
// Types
// =============================================================================

type TypeDistribution = Record<string, number>;

type MonsterSummary = {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  battlesWon: number;
  battlesTotal: number;
};

type MonsterListItem = {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  types: string[];
  battlesWon: number;
  battlesTotal: number;
  winRate: number;
};

export type OverallStats = {
  overview: {
    totalMonsters: number;
    uniqueSpecies: number;
    averageLevel: number;
    highestLevel: number;
    typeDistribution: TypeDistribution;
  };
  topMonsters: MonsterSummary[];
  monsters: MonsterListItem[];
};

export type AdminDashboardStats = {
  users: { total: number; newThisWeek: number };
  trainers: { total: number; newThisWeek: number };
  monsters: { total: number; newThisWeek: number };
  fakemon: { total: number; newThisWeek: number };
  submissions: { total: number; pending: number };
  shops: { total: number; active: number };
};

export type MonsterStats = {
  overview: {
    totalMonsters: number;
    uniqueSpecies: number;
    averageLevel: number;
    highestLevel: number;
    typeDistribution: TypeDistribution;
  };
  topMonsters: MonsterSummary[];
  monsters: MonsterListItem[];
};

type ReferenceData = { percentage: number; total: number; referenced: number };

type TrainerRanking = {
  id: number;
  name: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  level: number;
  playerDisplayName: string;
};

type TrainerMonsterRanking = {
  id: number;
  name: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  monsterCount: number;
  playerDisplayName: string;
};

type LeaderEntry = {
  trainerName: string;
  playerName: string;
  count: number;
};

export type TrainerComparisonStats = {
  globalStats: {
    totalTrainers: number;
    totalMonsters: number;
    totalPlayers: number;
    averageMonstersPerTrainer: number;
    averageReferencePercentage: number;
  };
  topTrainers: {
    byLevel: TrainerRanking[];
    byMonsters: TrainerMonsterRanking[];
  };
  playerRankings: {
    mostTrainers: { playerName: string | null; trainerCount: number; trainers: string[] };
    leastTrainers: { playerName: string | null; trainerCount: number; trainers: string[] };
    mostReferenced: { playerName: string | null; referencePercentage: number; totalMonsters: number; referencedMonsters: number };
    leastReferenced: { playerName: string | null; referencePercentage: number; totalMonsters: number; referencedMonsters: number };
  };
  trainerRankings: {
    highestLevel: { trainerName: string; playerName: string; level: number };
    mostMonsters: { trainerName: string; playerName: string; monsterCount: number };
    mostReferenced: { trainerName: string; playerName: string; referencePercentage: number; totalMonsters: number; referencedMonsters: number };
    leastReferenced: { trainerName: string; playerName: string; referencePercentage: number; totalMonsters: number; referencedMonsters: number };
  };
  typeDistribution: {
    byPlayer: Record<string, TypeDistribution>;
    byTrainer: Record<string, TypeDistribution>;
    mostOfType: Record<string, LeaderEntry>;
  };
  attributeDistribution: {
    byPlayer: Record<string, TypeDistribution>;
    byTrainer: Record<string, TypeDistribution>;
    mostOfAttribute: Record<string, LeaderEntry>;
  };
};

export type TrainerStats = {
  trainer: {
    id: number;
    name: string;
    level: number;
    coins: number;
    joinDate: string;
    avatarUrl: string;
  };
  monsters: {
    total: number;
    uniqueSpecies: number;
    highestLevel: number;
    types: TypeDistribution;
  };
  activities: Record<string, number>;
  activityChart: { labels: string[]; data: number[] };
};

type TrainerStatRow = {
  id: number;
  name: string;
  title: string | null;
  faction: string | null;
  main_ref: string | null;
  level: number;
  currency_amount: number;
  total_earned_currency: number;
  player_display_name: string | null;
  player_username: string | null;
  player_user_id: string;
};

type MonsterRow = {
  id: number;
  trainer_id: number;
  player_user_id: string;
  name: string;
  species1: string;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  hp_total: number;
  atk_total: number;
  def_total: number;
  spa_total: number;
  spd_total: number;
  spe_total: number;
  img_link: string | null;
  battles_won: number;
  battles_total: number;
};

type SpecialistRow = {
  trainer_name: string;
  title: string | null;
  faction: string | null;
  main_ref: string | null;
  player_display_name: string | null;
  player_username: string | null;
  normalized_type?: string;
  attribute?: string;
  species?: string;
  count: number;
  monster_data?: string;
};

type AchievementClaimRow = {
  trainer_id: number;
  achievement_id: string;
  claimed_at: Date;
  trainer_name: string;
  title: string | null;
  faction: string | null;
  main_ref: string | null;
  player_display_name: string | null;
  player_username: string | null;
};

// =============================================================================
// Helpers
// =============================================================================

const TYPE_FIELDS = ['type1', 'type2', 'type3', 'type4', 'type5'] as const;

function calculateTypeDistribution(monsters: MonsterRow[]): TypeDistribution {
  const typeCount: TypeDistribution = {};
  for (const monster of monsters) {
    for (const field of TYPE_FIELDS) {
      const val = monster[field];
      if (val) {
        typeCount[val] = (typeCount[val] ?? 0) + 1;
      }
    }
  }
  return typeCount;
}

function buildMonsterSummary(monster: MonsterRow): MonsterSummary {
  return {
    id: monster.id,
    name: monster.name || 'Unnamed',
    imagePath: monster.img_link ?? '/images/default_monster.png',
    level: monster.level || 1,
    types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean) as string[],
    stats: {
      hp: monster.hp_total || 0,
      attack: monster.atk_total || 0,
      defense: monster.def_total || 0,
      spAttack: monster.spa_total || 0,
      spDefense: monster.spd_total || 0,
      speed: monster.spe_total || 0,
    },
    battlesWon: monster.battles_won || 0,
    battlesTotal: monster.battles_total || 0,
  };
}

function getLevel100Monsters(monsters: MonsterRow[]): MonsterSummary[] {
  return monsters
    .filter(m => (m.level || 0) >= 100)
    .map(buildMonsterSummary);
}

function buildMonsterListItem(monster: MonsterRow): MonsterListItem {
  const battlesTotal = monster.battles_total || 0;
  const battlesWon = monster.battles_won || 0;
  return {
    id: monster.id,
    name: monster.name || 'Unnamed',
    imagePath: monster.img_link ?? '/images/default_monster.png',
    level: monster.level || 1,
    types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean) as string[],
    battlesWon,
    battlesTotal,
    winRate: battlesTotal > 0 ? Math.round((battlesWon / battlesTotal) * 1000) / 10 : 0,
  };
}

function sortMonstersList(monsters: MonsterListItem[], sort: string, order: string): MonsterListItem[] {
  return [...monsters].sort((a, b) => {
    let comparison = 0;
    switch (sort) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'win_rate':
        comparison = a.winRate - b.winRate;
        break;
      case 'level':
      default:
        comparison = a.level - b.level;
        break;
    }
    return order === 'asc' ? comparison : -comparison;
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function displayName(row: { player_display_name?: string | null; player_username?: string | null }): string {
  return row.player_display_name ?? row.player_username ?? 'Unknown Player';
}

// =============================================================================
// Service
// =============================================================================

export class StatisticsService {

  // ===========================================================================
  // Overall Stats
  // ===========================================================================

  async getOverallStats(): Promise<OverallStats> {
    const monsters = await db.many<MonsterRow>('SELECT * FROM monsters');

    const totalMonsters = monsters.length;
    const uniqueSpecies = new Set(monsters.map(m => m.species1)).size;
    const levels = monsters.map(m => m.level || 0);
    const averageLevel = totalMonsters > 0 ? Math.round(levels.reduce((s, l) => s + l, 0) / totalMonsters) : 0;
    const highestLevel = Math.max(...levels, 0);

    return {
      overview: {
        totalMonsters,
        uniqueSpecies,
        averageLevel,
        highestLevel,
        typeDistribution: calculateTypeDistribution(monsters),
      },
      topMonsters: getLevel100Monsters(monsters),
      monsters: monsters.map(buildMonsterListItem),
    };
  }

  // ===========================================================================
  // Monster Stats
  // ===========================================================================

  async getMonsterStats(type: string, sort: string, order: string): Promise<MonsterStats> {
    let monsters: MonsterRow[];

    if (type !== 'all') {
      monsters = await db.many<MonsterRow>(
        `SELECT * FROM monsters
         WHERE type1 = $1 OR type2 = $1 OR type3 = $1 OR type4 = $1 OR type5 = $1`,
        [type]
      );
    } else {
      monsters = await db.many<MonsterRow>('SELECT * FROM monsters');
    }

    const totalMonsters = monsters.length;
    const uniqueSpecies = new Set(monsters.map(m => m.species1)).size;
    const levels = monsters.map(m => m.level || 0);
    const averageLevel = totalMonsters > 0 ? Math.round(levels.reduce((s, l) => s + l, 0) / totalMonsters) : 0;
    const highestLevel = Math.max(...levels, 0);

    const monstersList = sortMonstersList(monsters.map(buildMonsterListItem), sort, order);

    return {
      overview: {
        totalMonsters,
        uniqueSpecies,
        averageLevel,
        highestLevel,
        typeDistribution: calculateTypeDistribution(monsters),
      },
      topMonsters: getLevel100Monsters(monsters),
      monsters: monstersList,
    };
  }

  // ===========================================================================
  // Trainer Stats
  // ===========================================================================

  async getTrainerStats(trainerId: number): Promise<TrainerStats | null> {
    const trainer = await db.maybeOne<TrainerStatRow>(
      'SELECT * FROM trainers WHERE id = $1',
      [trainerId]
    );
    if (!trainer) {
      return null;
    }

    const monsters = await db.many<MonsterRow>(
      'SELECT * FROM monsters WHERE trainer_id = $1',
      [trainerId]
    );

    const uniqueSpecies = new Set(monsters.map(m => m.species1)).size;
    const levels = monsters.map(m => m.level || 0);
    const highestLevel = Math.max(...levels, 0);

    return {
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level || 1,
        coins: trainer.currency_amount || 0,
        joinDate: new Date().toISOString(),
        avatarUrl: trainer.main_ref ?? '/images/default_trainer.png',
      },
      monsters: {
        total: monsters.length,
        uniqueSpecies,
        highestLevel,
        types: calculateTypeDistribution(monsters),
      },
      activities: {}, // Activities are not tracked in current schema
      activityChart: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [] },
    };
  }

  // ===========================================================================
  // Trainer Comparison Stats
  // ===========================================================================

  async getTrainerComparisonStats(): Promise<TrainerComparisonStats> {
    const monsters = await db.many<MonsterRow>('SELECT * FROM monsters');
    const trainers = await db.many<TrainerStatRow>(
      `SELECT t.*, u.display_name AS player_display_name, u.username AS player_username
       FROM trainers t
       LEFT JOIN users u ON t.player_user_id = u.discord_id`
    );

    // Group monsters by trainer
    const monstersByTrainer: Record<number, MonsterRow[]> = {};
    for (const m of monsters) {
      (monstersByTrainer[m.trainer_id] ??= []).push(m);
    }

    // Group trainers by player
    const trainersByPlayer: Record<string, TrainerStatRow[]> = {};
    for (const t of trainers) {
      (trainersByPlayer[t.player_user_id] ??= []).push(t);
    }

    const totalTrainers = trainers.length;
    const totalMonsters = monsters.length;
    const totalPlayers = Object.keys(trainersByPlayer).length;
    const averageMonstersPerTrainer = totalTrainers > 0 ? totalMonsters / totalTrainers : 0;

    // Reference percentages per trainer
    const trainerRefData: Record<number, ReferenceData> = {};
    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const total = tMonsters.length;
      const referenced = tMonsters.filter(m => m.img_link && m.img_link !== '').length;
      trainerRefData[t.id] = {
        percentage: total > 0 ? (referenced / total) * 100 : 0,
        total,
        referenced,
      };
    }

    const avgRefPercent = totalTrainers > 0
      ? Object.values(trainerRefData).reduce((s, d) => s + d.percentage, 0) / totalTrainers
      : 0;

    // Player rankings
    let mostTrainersPlayer: string | null = null;
    let mostTrainersCount = 0;
    let leastTrainersPlayer: string | null = null;
    let leastTrainersCount = Infinity;

    for (const [pid, pts] of Object.entries(trainersByPlayer)) {
      if (pts.length > mostTrainersCount) {
        mostTrainersCount = pts.length;
        mostTrainersPlayer = pid;
      }
      if (pts.length < leastTrainersCount) {
        leastTrainersCount = pts.length;
        leastTrainersPlayer = pid;
      }
    }

    // Player reference percentages
    const playerRefData: Record<string, ReferenceData> = {};
    for (const [pid, pts] of Object.entries(trainersByPlayer)) {
      let total = 0;
      let referenced = 0;
      for (const t of pts) {
        const tMonsters = monstersByTrainer[t.id] ?? [];
        total += tMonsters.length;
        referenced += tMonsters.filter(m => m.img_link && m.img_link !== '').length;
      }
      playerRefData[pid] = {
        percentage: total > 0 ? (referenced / total) * 100 : 0,
        total,
        referenced,
      };
    }

    let mostRefPlayer: string | null = null;
    let highestRefPct = 0;
    let leastRefPlayer: string | null = null;
    let lowestRefPct = 100;

    for (const [pid, data] of Object.entries(playerRefData)) {
      if (data.total > 0 && data.percentage > highestRefPct) {
        highestRefPct = data.percentage;
        mostRefPlayer = pid;
      }
      if (data.total > 0 && data.percentage < lowestRefPct) {
        lowestRefPct = data.percentage;
        leastRefPlayer = pid;
      }
    }

    // Trainer-level rankings
    let highestLevelTrainer: TrainerStatRow | null = null;
    let highestLevel = 0;
    for (const t of trainers) {
      if ((t.level || 0) > highestLevel) {
        highestLevel = t.level || 0;
        highestLevelTrainer = t;
      }
    }

    let mostMonstersTrainer: TrainerStatRow | null = null;
    let mostMonstersCount = 0;
    for (const [tid, tMonsters] of Object.entries(monstersByTrainer)) {
      if (tMonsters.length > mostMonstersCount) {
        mostMonstersCount = tMonsters.length;
        mostMonstersTrainer = trainers.find(t => t.id === parseInt(tid)) ?? null;
      }
    }

    let mostRefTrainer: TrainerStatRow | null = null;
    let highestTrainerRefPct = 0;
    let leastRefTrainer: TrainerStatRow | null = null;
    let lowestTrainerRefPct = 100;

    for (const [tidStr, data] of Object.entries(trainerRefData)) {
      const tid = parseInt(tidStr);
      if (data.total > 0 && data.percentage > highestTrainerRefPct) {
        highestTrainerRefPct = data.percentage;
        mostRefTrainer = trainers.find(t => t.id === tid) ?? null;
      }
      if (data.total > 0 && data.percentage < lowestTrainerRefPct) {
        lowestTrainerRefPct = data.percentage;
        leastRefTrainer = trainers.find(t => t.id === tid) ?? null;
      }
    }

    // Type distribution
    const typeDistByPlayer: Record<string, TypeDistribution> = {};
    const typeDistByTrainer: Record<string, TypeDistribution> = {};
    const typeLeaders: Record<string, { trainerId: number | null; playerId: string | null; count: number }> = {};

    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const trainerTypeCount: TypeDistribution = {};

      for (const m of tMonsters) {
        for (const field of TYPE_FIELDS) {
          const type = m[field];
          if (type) {
            trainerTypeCount[type] = (trainerTypeCount[type] ?? 0) + 1;
            if ((trainerTypeCount[type] ?? 0) > (typeLeaders[type]?.count ?? 0)) {
              typeLeaders[type] = { trainerId: t.id, playerId: t.player_user_id, count: trainerTypeCount[type] ?? 0 };
            }
          }
        }
      }

      typeDistByTrainer[String(t.id)] = trainerTypeCount;

      const pDist = (typeDistByPlayer[t.player_user_id] ??= {});
      for (const [type, count] of Object.entries(trainerTypeCount)) {
        pDist[type] = (pDist[type] ?? 0) + count;
      }
    }

    // Attribute distribution
    const attrDistByPlayer: Record<string, TypeDistribution> = {};
    const attrDistByTrainer: Record<string, TypeDistribution> = {};
    const attrLeaders: Record<string, { trainerId: number | null; playerId: string | null; count: number }> = {};

    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const trainerAttrCount: TypeDistribution = {};

      for (const m of tMonsters) {
        if (m.attribute) {
          trainerAttrCount[m.attribute] = (trainerAttrCount[m.attribute] ?? 0) + 1;
          if ((trainerAttrCount[m.attribute] ?? 0) > (attrLeaders[m.attribute]?.count ?? 0)) {
            attrLeaders[m.attribute] = { trainerId: t.id, playerId: t.player_user_id, count: trainerAttrCount[m.attribute] ?? 0 };
          }
        }
      }

      attrDistByTrainer[String(t.id)] = trainerAttrCount;

      const pDist = (attrDistByPlayer[t.player_user_id] ??= {});
      for (const [attr, count] of Object.entries(trainerAttrCount)) {
        pDist[attr] = (pDist[attr] ?? 0) + count;
      }
    }

    // Top trainers
    const topByLevel: TrainerRanking[] = [...trainers]
      .sort((a, b) => (b.level || 0) - (a.level || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name || 'Unknown Trainer',
        title: t.title ?? null,
        faction: t.faction ?? null,
        mainRef: t.main_ref ?? null,
        level: t.level || 1,
        playerDisplayName: displayName(t),
      }));

    const topByMonsters: TrainerMonsterRanking[] = Object.entries(monstersByTrainer)
      .map(([tid, tMonsters]) => {
        const t = trainers.find(tr => tr.id === parseInt(tid));
        return {
          id: t?.id ?? parseInt(tid),
          name: t?.name ?? 'Unknown Trainer',
          title: t?.title ?? null,
          faction: t?.faction ?? null,
          mainRef: t?.main_ref ?? null,
          monsterCount: tMonsters.length,
          playerDisplayName: t ? displayName(t) : 'Unknown Player',
        };
      })
      .sort((a, b) => b.monsterCount - a.monsterCount)
      .slice(0, 5);

    const toLeaderEntry = (leaders: Record<string, { trainerId: number | null; playerId: string | null; count: number }>): Record<string, LeaderEntry> =>
      Object.fromEntries(
        Object.entries(leaders).map(([key, data]) => [
          key,
          {
            trainerName: trainers.find(t => t.id === data.trainerId)?.name ?? '',
            playerName: data.playerId ?? '',
            count: data.count,
          },
        ])
      );

    const mostRefPlayerData = mostRefPlayer ? playerRefData[mostRefPlayer] : null;
    const leastRefPlayerData = leastRefPlayer ? playerRefData[leastRefPlayer] : null;
    const mostRefTrainerData = mostRefTrainer ? trainerRefData[mostRefTrainer.id] : null;
    const leastRefTrainerData = leastRefTrainer ? trainerRefData[leastRefTrainer.id] : null;

    return {
      globalStats: {
        totalTrainers,
        totalMonsters,
        totalPlayers,
        averageMonstersPerTrainer: round1(averageMonstersPerTrainer),
        averageReferencePercentage: round1(avgRefPercent),
      },
      topTrainers: {
        byLevel: topByLevel,
        byMonsters: topByMonsters,
      },
      playerRankings: {
        mostTrainers: {
          playerName: mostTrainersPlayer,
          trainerCount: mostTrainersCount,
          trainers: (mostTrainersPlayer ? trainersByPlayer[mostTrainersPlayer] : [])?.map(t => t.name) ?? [],
        },
        leastTrainers: {
          playerName: leastTrainersPlayer,
          trainerCount: leastTrainersCount === Infinity ? 0 : leastTrainersCount,
          trainers: (leastTrainersPlayer ? trainersByPlayer[leastTrainersPlayer] : [])?.map(t => t.name) ?? [],
        },
        mostReferenced: {
          playerName: mostRefPlayer,
          referencePercentage: round1(mostRefPlayerData?.percentage ?? 0),
          totalMonsters: mostRefPlayerData?.total ?? 0,
          referencedMonsters: mostRefPlayerData?.referenced ?? 0,
        },
        leastReferenced: {
          playerName: leastRefPlayer,
          referencePercentage: round1(leastRefPlayerData?.percentage ?? 0),
          totalMonsters: leastRefPlayerData?.total ?? 0,
          referencedMonsters: leastRefPlayerData?.referenced ?? 0,
        },
      },
      trainerRankings: {
        highestLevel: {
          trainerName: highestLevelTrainer?.name ?? '',
          playerName: highestLevelTrainer?.player_user_id ?? '',
          level: highestLevel,
        },
        mostMonsters: {
          trainerName: mostMonstersTrainer?.name ?? '',
          playerName: mostMonstersTrainer?.player_user_id ?? '',
          monsterCount: mostMonstersCount,
        },
        mostReferenced: {
          trainerName: mostRefTrainer?.name ?? '',
          playerName: mostRefTrainer?.player_user_id ?? '',
          referencePercentage: round1(highestTrainerRefPct),
          totalMonsters: mostRefTrainerData?.total ?? 0,
          referencedMonsters: mostRefTrainerData?.referenced ?? 0,
        },
        leastReferenced: {
          trainerName: leastRefTrainer?.name ?? '',
          playerName: leastRefTrainer?.player_user_id ?? '',
          referencePercentage: round1(lowestTrainerRefPct),
          totalMonsters: leastRefTrainerData?.total ?? 0,
          referencedMonsters: leastRefTrainerData?.referenced ?? 0,
        },
      },
      typeDistribution: {
        byPlayer: typeDistByPlayer,
        byTrainer: typeDistByTrainer,
        mostOfType: toLeaderEntry(typeLeaders),
      },
      attributeDistribution: {
        byPlayer: attrDistByPlayer,
        byTrainer: attrDistByTrainer,
        mostOfAttribute: toLeaderEntry(attrLeaders),
      },
    };
  }

  // ===========================================================================
  // Leaderboard Stats
  // ===========================================================================

  async getLeaderboardStats(): Promise<Record<string, unknown>> {
    const monsters = await db.many<MonsterRow>('SELECT * FROM monsters');
    const trainers = await db.many<TrainerStatRow>(
      `SELECT t.*, u.display_name AS player_display_name, u.username AS player_username
       FROM trainers t
       LEFT JOIN users u ON t.player_user_id = u.discord_id`
    );

    // Group monsters by trainer
    const monstersByTrainer: Record<number, MonsterRow[]> = {};
    for (const m of monsters) {
      (monstersByTrainer[m.trainer_id] ??= []).push(m);
    }

    // Calculate stats per trainer
    const trainerStats = trainers.map(t => {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const total = tMonsters.length;
      const referenced = tMonsters.filter(m => m.img_link && m.img_link !== '').length;
      const refPercent = total > 0 ? Math.round((referenced / total) * 100) : 0;
      const totalLevels = tMonsters.reduce((s, m) => s + (m.level ?? 0), 0);
      const level100Count = tMonsters.filter(m => (m.level || 0) === 100).length;

      return {
        id: t.id,
        name: t.name || 'Unknown Trainer',
        title: t.title ?? null,
        faction: t.faction ?? null,
        mainRef: t.main_ref ?? null,
        level: t.level || 1,
        playerDisplayName: displayName(t),
        monsterCount: total,
        monsterRefPercent: refPercent,
        monsterRefCount: referenced,
        currencyAmount: t.currency_amount || 0,
        totalEarnedCurrency: t.total_earned_currency || t.currency_amount || 0,
        totalMonsterLevels: totalLevels,
        level100Count,
      };
    });

    const sortAndSlice = <T>(arr: T[], compareFn: (a: T, b: T) => number, count = 5): T[] =>
      [...arr].sort(compareFn).slice(0, count);

    // Type specialists via SQL
    const typeResults = await db.many<SpecialistRow>(
      `SELECT
        t.name as trainer_name, t.title, t.faction, t.main_ref,
        u.display_name as player_display_name, u.username as player_username,
        type_counts.normalized_type, type_counts.count
      FROM (
        SELECT trainer_id, normalized_type, SUM(cnt) as count
        FROM (
          SELECT trainer_id, LOWER(TRIM(type1)) as normalized_type, COUNT(*) as cnt FROM monsters WHERE type1 IS NOT NULL AND TRIM(type1) != '' GROUP BY trainer_id, LOWER(TRIM(type1))
          UNION ALL
          SELECT trainer_id, LOWER(TRIM(type2)) as normalized_type, COUNT(*) as cnt FROM monsters WHERE type2 IS NOT NULL AND TRIM(type2) != '' GROUP BY trainer_id, LOWER(TRIM(type2))
          UNION ALL
          SELECT trainer_id, LOWER(TRIM(type3)) as normalized_type, COUNT(*) as cnt FROM monsters WHERE type3 IS NOT NULL AND TRIM(type3) != '' GROUP BY trainer_id, LOWER(TRIM(type3))
          UNION ALL
          SELECT trainer_id, LOWER(TRIM(type4)) as normalized_type, COUNT(*) as cnt FROM monsters WHERE type4 IS NOT NULL AND TRIM(type4) != '' GROUP BY trainer_id, LOWER(TRIM(type4))
          UNION ALL
          SELECT trainer_id, LOWER(TRIM(type5)) as normalized_type, COUNT(*) as cnt FROM monsters WHERE type5 IS NOT NULL AND TRIM(type5) != '' GROUP BY trainer_id, LOWER(TRIM(type5))
        ) all_types
        GROUP BY trainer_id, normalized_type
      ) type_counts
      JOIN trainers t ON type_counts.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      ORDER BY type_counts.normalized_type, type_counts.count DESC`
    );

    const typeSpecialists: Record<string, { trainerName: string; title: string | null; faction: string | null; mainRef: string | null; playerDisplayName: string; count: number }> = {};
    for (const r of typeResults) {
      const key = r.normalized_type ?? '';
      const display = key.charAt(0).toUpperCase() + key.slice(1);
      typeSpecialists[display] ??= {
        trainerName: r.trainer_name,
        title: r.title,
        faction: r.faction,
        mainRef: r.main_ref,
        playerDisplayName: displayName(r),
        count: r.count,
      };
    }

    // Attribute specialists
    const attrResults = await db.many<SpecialistRow>(
      `SELECT
        t.name as trainer_name, t.title, t.faction, t.main_ref,
        u.display_name as player_display_name, u.username as player_username,
        m.attribute, COUNT(*) as count
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      WHERE m.attribute IN ('Free', 'Data', 'Vaccine', 'Variable', 'Virus')
      GROUP BY t.id, t.name, t.title, t.faction, t.main_ref, u.display_name, u.username, m.attribute
      ORDER BY count DESC`
    );

    const attributeSpecialists: Record<string, { trainerName: string; title: string | null; faction: string | null; mainRef: string | null; playerDisplayName: string; count: number }> = {};
    for (const r of attrResults) {
      const key = r.attribute ?? '';
      if (!attributeSpecialists[key] || attributeSpecialists[key].count < r.count) {
        attributeSpecialists[key] = {
          trainerName: r.trainer_name,
          title: r.title,
          faction: r.faction,
          mainRef: r.main_ref,
          playerDisplayName: displayName(r),
          count: r.count,
        };
      }
    }

    // Species specialists
    const speciesResults = await db.many<SpecialistRow>(
      `SELECT
        t.name as trainer_name, t.title, t.faction, t.main_ref,
        u.display_name as player_display_name, u.username as player_username,
        m.species1 as species, COUNT(*) as count,
        STRING_AGG(m.id::text || '|' || m.name || '|' || COALESCE(m.img_link, ''), ',') as monster_data
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      WHERE m.species1 IS NOT NULL AND m.species1 != ''
      GROUP BY t.id, t.name, t.title, t.faction, t.main_ref, u.display_name, u.username, m.species1
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 10`
    );

    const speciesSpecialists = speciesResults.map(r => {
      const parts = r.monster_data ? r.monster_data.split(',') : [];
      const sampleMonsters = parts.slice(0, 3).map(p => {
        const [idStr, name, imgLink] = p.split('|');
        return { id: parseInt(idStr ?? '0') ?? 0, name: name ?? 'Unnamed Monster', imgLink: imgLink ?? null };
      });

      return {
        trainerName: r.trainer_name,
        title: r.title,
        faction: r.faction,
        mainRef: r.main_ref,
        playerDisplayName: displayName(r),
        species: r.species,
        count: r.count,
        sampleMonsters,
      };
    });

    return {
      topTrainersByLevel: sortAndSlice(trainerStats, (a, b) => b.level - a.level),
      topTrainersByMonsterCount: sortAndSlice(trainerStats, (a, b) => b.monsterCount - a.monsterCount),
      topTrainersByRefPercent: sortAndSlice(
        trainerStats.filter(t => t.monsterCount > 0),
        (a, b) => b.monsterRefPercent - a.monsterRefPercent
      ),
      bottomTrainersByRefPercent: sortAndSlice(
        trainerStats.filter(t => t.monsterCount > 0),
        (a, b) => a.monsterRefPercent - b.monsterRefPercent
      ),
      topTrainersByCurrency: sortAndSlice(trainerStats, (a, b) => b.currencyAmount - a.currencyAmount),
      topTrainersByTotalCurrency: sortAndSlice(trainerStats, (a, b) => b.totalEarnedCurrency - a.totalEarnedCurrency),
      topTrainersByTotalLevel: sortAndSlice(trainerStats, (a, b) => b.totalMonsterLevels - a.totalMonsterLevels),
      topTrainersByLevel100Count: sortAndSlice(trainerStats, (a, b) => b.level100Count - a.level100Count),
      bottomTrainersByLevel: sortAndSlice(trainerStats, (a, b) => a.level - b.level),
      bottomTrainersByMonsterCount: sortAndSlice(trainerStats, (a, b) => a.monsterCount - b.monsterCount),
      bottomTrainersByCurrency: sortAndSlice(trainerStats, (a, b) => a.currencyAmount - b.currencyAmount),
      bottomTrainersByTotalCurrency: sortAndSlice(trainerStats, (a, b) => a.totalEarnedCurrency - b.totalEarnedCurrency),
      typeSpecialists,
      attributeSpecialists,
      speciesSpecialists,
    };
  }

  // ===========================================================================
  // Achievement Stats
  // ===========================================================================

  async getAchievementStats(): Promise<Record<string, unknown>> {
    const trainers = await db.many<TrainerStatRow>(
      `SELECT t.*, u.display_name AS player_display_name, u.username AS player_username
       FROM trainers t
       LEFT JOIN users u ON t.player_user_id = u.discord_id`
    );

    const allClaims = await db.many<AchievementClaimRow>(
      `SELECT
        c.trainer_id, c.achievement_id, c.claimed_at,
        t.name as trainer_name, t.title, t.faction, t.main_ref,
        u.display_name as player_display_name, u.username as player_username
      FROM trainer_achievement_claims c
      JOIN trainers t ON c.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      ORDER BY c.claimed_at DESC`
    );

    // Count achievements per trainer
    const achievementCounts: Record<number, {
      count: number;
      trainerName: string;
      title: string | null;
      faction: string | null;
      mainRef: string | null;
      playerDisplayName: string;
      achievements: string[];
    }> = {};

    for (const claim of allClaims) {
      const entry = (achievementCounts[claim.trainer_id] ??= {
        count: 0,
        trainerName: claim.trainer_name,
        title: claim.title,
        faction: claim.faction,
        mainRef: claim.main_ref,
        playerDisplayName: displayName(claim),
        achievements: [],
      });
      entry.count++;
      entry.achievements.push(claim.achievement_id);
    }

    const allAchievementIds = TrainerAchievementRepository.getAllAchievementIds();
    const typeAchievements = TrainerAchievementRepository.getTypeAchievements();
    const attributeAchievements = TrainerAchievementRepository.getAttributeAchievements();
    const level100Achievements = TrainerAchievementRepository.getLevel100Achievements();
    const trainerLevelAchievements = TrainerAchievementRepository.getTrainerLevelAchievements();
    const specialAchievements = TrainerAchievementRepository.getSpecialAchievements();

    // Category stats per trainer
    type CategoryStat = {
      trainerName: string;
      title: string | null;
      faction: string | null;
      mainRef: string | null;
      playerDisplayName: string;
      type: number;
      attribute: number;
      level100: number;
      trainerLevel: number;
      special: number;
      typeSubtypes: Record<string, number>;
      attributeSubtypes: Record<string, number>;
    };

    const categoryStats: Record<number, CategoryStat> = {};

    const findInCategory = (achievementId: string, defs: AchievementDefinition[]): boolean =>
      defs.some(a => a.id === achievementId);

    for (const claim of allClaims) {
      const stat = (categoryStats[claim.trainer_id] ??= {
        trainerName: claim.trainer_name,
        title: claim.title,
        faction: claim.faction,
        mainRef: claim.main_ref,
        playerDisplayName: displayName(claim),
        type: 0,
        attribute: 0,
        level100: 0,
        trainerLevel: 0,
        special: 0,
        typeSubtypes: {},
        attributeSubtypes: {},
      });

      for (const [typeName, defs] of Object.entries(typeAchievements)) {
        if (findInCategory(claim.achievement_id, defs)) {
          stat.type++;
          stat.typeSubtypes[typeName] = (stat.typeSubtypes[typeName] ?? 0) + 1;
        }
      }

      for (const [attrName, defs] of Object.entries(attributeAchievements)) {
        if (findInCategory(claim.achievement_id, defs)) {
          stat.attribute++;
          stat.attributeSubtypes[attrName] = (stat.attributeSubtypes[attrName] ?? 0) + 1;
        }
      }

      if (findInCategory(claim.achievement_id, level100Achievements)) {
        stat.level100++;
      }
      if (findInCategory(claim.achievement_id, trainerLevelAchievements)) {
        stat.trainerLevel++;
      }
      if (findInCategory(claim.achievement_id, specialAchievements)) {
        stat.special++;
      }
    }

    // Sort by total achievements
    const sortedByTotal = Object.entries(achievementCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([tid, data]) => ({ trainerId: parseInt(tid), ...data }));

    // Trainers with zero included
    const trainersWithZero = trainers.map(t => {
      const data = achievementCounts[t.id];
      return {
        trainerId: t.id,
        count: data?.count ?? 0,
        trainerName: t.name,
        title: t.title,
        faction: t.faction,
        mainRef: t.main_ref,
        playerDisplayName: displayName(t),
        achievements: data?.achievements ?? [],
      };
    }).sort((a, b) => a.count - b.count);

    // Top by category
    const categoryKeys = ['type', 'attribute', 'level100', 'trainerLevel', 'special'] as const;
    const topByCategory: Record<string, unknown[]> = {};

    for (const cat of categoryKeys) {
      topByCategory[cat] = Object.entries(categoryStats)
        .filter(([, d]) => d[cat] > 0)
        .sort(([, a], [, b]) => (b[cat] as number) - (a[cat] as number))
        .slice(0, 5)
        .map(([tid, d]) => ({
          trainerId: parseInt(tid),
          count: d[cat],
          trainerName: d.trainerName,
          title: d.title,
          faction: d.faction,
          mainRef: d.mainRef,
          playerDisplayName: d.playerDisplayName,
        }));
    }

    // Top by subtypes
    const topBySubtype: { types: Record<string, unknown[]>; attributes: Record<string, unknown[]> } = { types: {}, attributes: {} };

    for (const typeName of Object.keys(typeAchievements)) {
      topBySubtype.types[typeName] = Object.entries(categoryStats)
        .filter(([, d]) => (d.typeSubtypes[typeName] ?? 0) > 0)
        .sort(([, a], [, b]) => (b.typeSubtypes[typeName] ?? 0) - (a.typeSubtypes[typeName] ?? 0))
        .slice(0, 3)
        .map(([tid, d]) => ({
          trainerId: parseInt(tid),
          count: d.typeSubtypes[typeName],
          trainerName: d.trainerName,
          title: d.title,
          faction: d.faction,
          mainRef: d.mainRef,
          playerDisplayName: d.playerDisplayName,
        }));
    }

    for (const attrName of Object.keys(attributeAchievements)) {
      topBySubtype.attributes[attrName] = Object.entries(categoryStats)
        .filter(([, d]) => (d.attributeSubtypes[attrName] ?? 0) > 0)
        .sort(([, a], [, b]) => (b.attributeSubtypes[attrName] ?? 0) - (a.attributeSubtypes[attrName] ?? 0))
        .slice(0, 3)
        .map(([tid, d]) => ({
          trainerId: parseInt(tid),
          count: d.attributeSubtypes[attrName],
          trainerName: d.trainerName,
          title: d.title,
          faction: d.faction,
          mainRef: d.mainRef,
          playerDisplayName: d.playerDisplayName,
        }));
    }

    // Count category totals
    let typeTotalDefs = 0;
    for (const defs of Object.values(typeAchievements)) {
      typeTotalDefs += defs.length;
    }
    let attrTotalDefs = 0;
    for (const defs of Object.values(attributeAchievements)) {
      attrTotalDefs += defs.length;
    }

    return {
      overview: {
        totalAchievementsAvailable: allAchievementIds.length,
        totalAchievementsClaimed: allClaims.length,
        trainersWithAchievements: Object.keys(achievementCounts).length,
        totalTrainers: trainers.length,
        averageAchievementsPerTrainer: trainers.length > 0 ? round1(allClaims.length / trainers.length) : 0,
      },
      mostAchievements: sortedByTotal.slice(0, 10),
      leastAchievements: trainersWithZero.slice(0, 10),
      topByCategory,
      topBySubtype,
      recentClaims: allClaims.slice(0, 20),
      categoryBreakdown: {
        type: typeTotalDefs,
        attribute: attrTotalDefs,
        level100: level100Achievements.length,
        trainerLevel: trainerLevelAchievements.length,
        special: specialAchievements.length,
      },
    };
  }

  // ===========================================================================
  // Player Leaderboard Stats
  // ===========================================================================

  async getPlayerLeaderboardStats(): Promise<Record<string, unknown>> {
    const monsters = await db.many<MonsterRow>('SELECT * FROM monsters');
    const trainers = await db.many<TrainerStatRow>(
      `SELECT t.*, u.display_name AS player_display_name, u.username AS player_username
       FROM trainers t
       LEFT JOIN users u ON t.player_user_id = u.discord_id`
    );

    // Group monsters by trainer
    const monstersByTrainer: Record<number, MonsterRow[]> = {};
    for (const m of monsters) {
      (monstersByTrainer[m.trainer_id] ??= []).push(m);
    }

    // Group trainers by player
    const trainersByPlayer: Record<string, TrainerStatRow[]> = {};
    for (const t of trainers) {
      (trainersByPlayer[t.player_user_id] ??= []).push(t);
    }

    // Build per-player stats
    const playerStats = Object.entries(trainersByPlayer).map(([playerUserId, playerTrainers]) => {
      const firstTrainer = playerTrainers[0];
      if (!firstTrainer) {
        throw new Error(`No trainers found for player ${playerUserId}`);
      }
      const playerName = displayName(firstTrainer);
      const trainerCount = playerTrainers.length;

      let totalMonsters = 0;
      let totalRefs = 0;
      let totalCurrency = 0;
      let totalEarnedCurrency = 0;

      for (const t of playerTrainers) {
        const tMonsters = monstersByTrainer[t.id] ?? [];
        totalMonsters += tMonsters.length;
        totalRefs += tMonsters.filter(m => m.img_link && m.img_link !== '').length;
        totalCurrency += t.currency_amount ?? 0;
        totalEarnedCurrency += t.total_earned_currency ?? t.currency_amount ?? 0;
      }

      const refPercent = totalMonsters > 0 ? round1((totalRefs / totalMonsters) * 100) : 0;

      return {
        playerName,
        playerUserId,
        trainerCount,
        totalMonsters,
        totalRefs,
        refPercent,
        totalCurrency,
        totalEarnedCurrency,
      };
    });

    const sortAndSlice = <T>(arr: T[], compareFn: (a: T, b: T) => number, count = 5): T[] =>
      [...arr].sort(compareFn).slice(0, count);

    const withMonsters = playerStats.filter(p => p.totalMonsters >= 1);

    const mostMonsters = sortAndSlice(playerStats, (a, b) => b.totalMonsters - a.totalMonsters);
    const leastMonsters = sortAndSlice(withMonsters, (a, b) => a.totalMonsters - b.totalMonsters);
    const mostRefs = sortAndSlice(withMonsters, (a, b) => b.totalRefs - a.totalRefs);
    const leastRefs = sortAndSlice(withMonsters, (a, b) => a.totalRefs - b.totalRefs);
    const mostRefPercent = sortAndSlice(withMonsters, (a, b) => b.refPercent - a.refPercent);
    const leastRefPercent = sortAndSlice(withMonsters, (a, b) => a.refPercent - b.refPercent);
    const mostCurrency = sortAndSlice(playerStats, (a, b) => b.totalCurrency - a.totalCurrency);
    const leastCurrency = sortAndSlice(playerStats, (a, b) => a.totalCurrency - b.totalCurrency);

    // Type specialists across ALL trainers per player
    const playerTypeCounts: Record<string, Record<string, number>> = {};
    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const pCounts = (playerTypeCounts[t.player_user_id] ??= {});
      for (const m of tMonsters) {
        for (const field of TYPE_FIELDS) {
          const type = m[field];
          if (type) {
            const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            pCounts[normalized] = (pCounts[normalized] ?? 0) + 1;
          }
        }
      }
    }

    const typeSpecialists: Record<string, { playerName: string; count: number }> = {};
    for (const [playerUserId, typeCounts] of Object.entries(playerTypeCounts)) {
      const pTrainers = trainersByPlayer[playerUserId];
      const firstTrainer = pTrainers?.[0];
      const playerName = firstTrainer ? displayName(firstTrainer) : 'Unknown Player';
      for (const [type, count] of Object.entries(typeCounts)) {
        if (!typeSpecialists[type] || count > typeSpecialists[type].count) {
          typeSpecialists[type] = { playerName, count };
        }
      }
    }

    // Attribute specialists across ALL trainers per player
    const playerAttrCounts: Record<string, Record<string, number>> = {};
    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const pCounts = (playerAttrCounts[t.player_user_id] ??= {});
      for (const m of tMonsters) {
        if (m.attribute) {
          pCounts[m.attribute] = (pCounts[m.attribute] ?? 0) + 1;
        }
      }
    }

    const attributeSpecialists: Record<string, { playerName: string; count: number }> = {};
    for (const [playerUserId, attrCounts] of Object.entries(playerAttrCounts)) {
      const pTrainers = trainersByPlayer[playerUserId];
      const firstTrainer = pTrainers?.[0];
      const playerName = firstTrainer ? displayName(firstTrainer) : 'Unknown Player';
      for (const [attr, count] of Object.entries(attrCounts)) {
        if (!attributeSpecialists[attr] || count > attributeSpecialists[attr].count) {
          attributeSpecialists[attr] = { playerName, count };
        }
      }
    }

    // Species specialists across ALL trainers per player
    const playerSpeciesCounts: Record<string, Record<string, number>> = {};
    for (const t of trainers) {
      const tMonsters = monstersByTrainer[t.id] ?? [];
      const pCounts = (playerSpeciesCounts[t.player_user_id] ??= {});
      for (const m of tMonsters) {
        if (m.species1 && m.species1 !== '') {
          pCounts[m.species1] = (pCounts[m.species1] ?? 0) + 1;
        }
      }
    }

    const speciesEntries: { playerName: string; species: string; count: number }[] = [];
    for (const [playerUserId, speciesCounts] of Object.entries(playerSpeciesCounts)) {
      const pTrainers = trainersByPlayer[playerUserId];
      const firstTrainer = pTrainers?.[0];
      const playerName = firstTrainer ? displayName(firstTrainer) : 'Unknown Player';
      for (const [species, count] of Object.entries(speciesCounts)) {
        if (count >= 3) {
          speciesEntries.push({ playerName, species, count });
        }
      }
    }

    const speciesSpecialists = speciesEntries
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      playerStats,
      mostMonsters,
      leastMonsters,
      mostRefs,
      leastRefs,
      mostRefPercent,
      leastRefPercent,
      mostCurrency,
      leastCurrency,
      typeSpecialists,
      attributeSpecialists,
      speciesSpecialists,
    };
  }

  // ===========================================================================
  // Admin Dashboard Stats
  // ===========================================================================

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const countQuery = (table: string) =>
      db.one<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${table}`);

    const recentCountQuery = (table: string, days: number) =>
      db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM ${table} WHERE created_at >= NOW() - INTERVAL '${days} days'`
      );

    const [
      usersTotal,
      usersNew,
      trainersTotal,
      trainersNew,
      monstersTotal,
      monstersNew,
      fakemonTotal,
      fakemonNew,
      submissionsTotal,
      submissionsPending,
      shopsTotal,
      shopsActive,
    ] = await Promise.all([
      countQuery('users'),
      recentCountQuery('users', 7),
      countQuery('trainers'),
      recentCountQuery('trainers', 7),
      countQuery('monsters'),
      recentCountQuery('monsters', 7),
      countQuery('fakemon').catch(() => ({ count: 0 })),
      recentCountQuery('fakemon', 7).catch(() => ({ count: 0 })),
      countQuery('submissions'),
      db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM submissions WHERE status = 'pending'`
      ).catch(() => ({ count: 0 })),
      countQuery('shops'),
      db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM shops WHERE active::boolean = true`
      ).catch(() => ({ count: 0 })),
    ]);

    return {
      users: { total: usersTotal.count, newThisWeek: usersNew.count },
      trainers: { total: trainersTotal.count, newThisWeek: trainersNew.count },
      monsters: { total: monstersTotal.count, newThisWeek: monstersNew.count },
      fakemon: { total: fakemonTotal.count, newThisWeek: fakemonNew.count },
      submissions: { total: submissionsTotal.count, pending: submissionsPending.count },
      shops: { total: shopsTotal.count, active: shopsActive.count },
    };
  }
}
