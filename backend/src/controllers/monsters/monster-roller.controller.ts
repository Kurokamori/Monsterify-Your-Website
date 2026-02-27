import { Request, Response } from 'express';
import {
  MonsterRepository,
  TrainerRepository,
  UserRepository,
} from '../../repositories';
import type { MonsterRollerSettings } from '../../repositories';
import { MonsterRollerService } from '../../services/monster-roller.service';
import type { UserSettings, RollParams, TableFilter } from '../../services/monster-roller.service';
import { MonsterInitializerService } from '../../services/monster-initializer.service';
import type { MonsterData } from '../../services/monster-initializer.service';
import { getTableSchema, type MonsterTable } from '../../utils/constants';

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_TABLE_FILTERS: Record<string, TableFilter> = {
  finalfantasy: {
    includeStages: ['base stage', "doesn't evolve"],
  },
  monsterhunter: {
    includeRanks: ['1', '2', '3'],
  },
};

const ALL_TABLES_ENABLED: UserSettings = {
  pokemon: true,
  digimon: true,
  yokai: true,
  nexomon: true,
  pals: true,
  fakemon: true,
  finalfantasy: true,
  monsterhunter: true,
  dragonquest: true,
};

function parseUserSettings(settings: MonsterRollerSettings | null): UserSettings {
  if (!settings) {
    return { ...ALL_TABLES_ENABLED };
  }

  return {
    pokemon: settings.pokemon !== false,
    digimon: settings.digimon !== false,
    yokai: settings.yokai !== false,
    nexomon: settings.nexomon !== false,
    pals: settings.pals !== false,
    fakemon: settings.fakemon !== false,
    finalfantasy: settings.finalfantasy !== false,
    monsterhunter: settings.monsterhunter !== false,
    dragonquest: settings.dragonquest !== false,
  };
}

/**
 * Build roller options. When the request body includes explicit tables,
 * use all-enabled user settings so the configurator controls table selection
 * instead of the authenticated user's personal roller settings.
 */
function buildRollerOptions(
  body: RollParams & { seed?: string },
  userRollerSettings: MonsterRollerSettings | null,
): { seed: string; userSettings: UserSettings; enabledTables?: MonsterTable[] } {
  const seed = body.seed ?? Date.now().toString();
  const explicitTables = body.tables ?? body.enabledTables;

  if (explicitTables && explicitTables.length > 0) {
    return { seed, userSettings: { ...ALL_TABLES_ENABLED }, enabledTables: explicitTables };
  }

  return { seed, userSettings: parseUserSettings(userRollerSettings) };
}

// ============================================================================
// Controllers
// ============================================================================

export async function rollMonster(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RollParams & { seed?: string };
    const rollerOptions = buildRollerOptions(body, req.user?.monster_roller_settings ?? null);

    const roller = new MonsterRollerService(rollerOptions);

    const rollParams: RollParams = {
      ...body,
      tableFilters: { ...DEFAULT_TABLE_FILTERS, ...(body.tableFilters ?? {}) },
    };

    const monster = await roller.rollMonster(rollParams);

    if (!monster) {
      res.status(404).json({
        success: false,
        message: 'No monster found with the given parameters',
      });
      return;
    }

    res.json({ success: true, data: monster, seed: roller.getSeed() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling monster';
    console.error('Error rolling monster:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function rollMany(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RollParams & { seed?: string; count?: number };
    const count = body.count ?? 1;

    if (count < 1 || count > 100) {
      res.status(400).json({ success: false, message: 'Count must be between 1 and 100' });
      return;
    }

    const rollerOptions = buildRollerOptions(body, req.user?.monster_roller_settings ?? null);

    const roller = new MonsterRollerService(rollerOptions);

    const rollParams: RollParams = {
      ...body,
      tableFilters: { ...DEFAULT_TABLE_FILTERS, ...(body.tableFilters ?? {}) },
    };

    const monsters = await roller.rollMany(rollParams, count);

    if (monsters.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No monsters found with the given parameters',
      });
      return;
    }

    res.json({
      success: true,
      data: monsters,
      seed: roller.getSeed(),
      count: monsters.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling multiple monsters';
    console.error('Error rolling multiple monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function rollForTrainer(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RollParams & { seed?: string; trainerId?: number; count?: number };
    const { trainerId, count = 1 } = body;

    if (!trainerId) {
      res.status(400).json({ success: false, message: 'Trainer ID is required' });
      return;
    }
    if (count < 1 || count > 10) {
      res.status(400).json({ success: false, message: 'Count must be between 1 and 10' });
      return;
    }

    const trainerRepo = new TrainerRepository();
    const trainer = await trainerRepo.findById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const rollerOptions = buildRollerOptions(body, req.user?.monster_roller_settings ?? null);

    const roller = new MonsterRollerService(rollerOptions);

    const rollParams: RollParams = {
      ...body,
      tableFilters: { ...DEFAULT_TABLE_FILTERS, ...(body.tableFilters ?? {}) },
    };

    const monsters = await roller.rollMany(rollParams, count);
    if (monsters.length === 0) {
      res.status(404).json({ success: false, message: 'No monsters found with the given parameters' });
      return;
    }

    const initializer = new MonsterInitializerService();
    const monsterRepo = new MonsterRepository();
    const createdMonsters = [];

    for (const monster of monsters) {
      const monsterData: MonsterData = {
        trainer_id: trainerId,
        name: monster.name ?? 'New Monster',
        level: 1,
        species1: monster.species1 ?? monster.name,
        species2: monster.species2 ?? null,
        species3: monster.species3 ?? null,
        type1: monster.type1 ?? '',
        type2: monster.type2 ?? null,
        type3: monster.type3 ?? null,
        type4: monster.type4 ?? null,
        type5: monster.type5 ?? null,
        attribute: monster.attribute ?? null,
      };

      const initialized = await initializer.initializeMonster(monsterData);

      const newMonster = await monsterRepo.create({
        trainerId,
        playerUserId: user.discord_id ?? undefined,
        name: initialized.name ?? 'New Monster',
        species1: initialized.species1 ?? monsterData.species1 ?? '',
        species2: initialized.species2,
        species3: initialized.species3,
        type1: initialized.type1 ?? '',
        type2: initialized.type2,
        type3: initialized.type3,
        type4: initialized.type4,
        type5: initialized.type5,
        attribute: initialized.attribute,
        level: initialized.level,
        hpTotal: initialized.hp_total,
        hpIv: initialized.hp_iv,
        hpEv: initialized.hp_ev,
        atkTotal: initialized.atk_total,
        atkIv: initialized.atk_iv,
        atkEv: initialized.atk_ev,
        defTotal: initialized.def_total,
        defIv: initialized.def_iv,
        defEv: initialized.def_ev,
        spaTotal: initialized.spa_total,
        spaIv: initialized.spa_iv,
        spaEv: initialized.spa_ev,
        spdTotal: initialized.spd_total,
        spdIv: initialized.spd_iv,
        spdEv: initialized.spd_ev,
        speTotal: initialized.spe_total,
        speIv: initialized.spe_iv,
        speEv: initialized.spe_ev,
        nature: initialized.nature,
        characteristic: initialized.characteristic,
        gender: initialized.gender,
        friendship: initialized.friendship,
        ability1: initialized.ability1,
        ability2: initialized.ability2,
        moveset: typeof initialized.moveset === 'string'
          ? JSON.parse(initialized.moveset)
          : Array.isArray(initialized.moveset)
            ? initialized.moveset
            : [],
        whereMet: initialized.where_met,
      });

      createdMonsters.push(newMonster);
    }

    res.json({
      success: true,
      data: createdMonsters,
      seed: roller.getSeed(),
      count: createdMonsters.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling monster for trainer';
    console.error('Error rolling monster for trainer:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getOptions(req: Request, res: Response): Promise<void> {
  try {
    const rollerSettings = req.user?.monster_roller_settings ?? null;
    const userSettings = parseUserSettings(rollerSettings);
    const roller = new MonsterRollerService({ userSettings });

    const [names, types, attributes, ranks, stages, families] = await Promise.all([
      roller.getAllNames(),
      roller.getAllTypes(),
      roller.getAllAttributes(),
      roller.getAllRanks(),
      roller.getAllStages(),
      roller.getAllFamilies(),
    ]);

    const enabledTables = roller.getEnabledTables();
    const tableSchemas: Record<string, unknown> = {};
    for (const table of enabledTables) {
      tableSchemas[table] = getTableSchema(table);
    }

    res.json({
      success: true,
      data: {
        names: names.sort(),
        types: types.sort(),
        attributes: attributes.sort(),
        ranks: ranks.sort(),
        stages: stages.sort(),
        families: families.sort(),
        tables: enabledTables,
        tableSchemas,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting monster roller options';
    console.error('Error getting monster roller options:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
