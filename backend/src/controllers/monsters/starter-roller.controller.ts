import { Request, Response } from 'express';
import {
  MonsterRepository,
  TrainerRepository,
  UserRepository,
} from '../../repositories';
import type { MonsterRollerSettings } from '../../repositories';
import { MonsterRollerService } from '../../services/monster-roller.service';
import type { UserSettings, RollParams, RolledMonster } from '../../services/monster-roller.service';
import { MonsterInitializerService } from '../../services/monster-initializer.service';
import type { MonsterData } from '../../services/monster-initializer.service';

// ============================================================================
// Helpers
// ============================================================================

function parseUserSettings(settings: MonsterRollerSettings | null): UserSettings {
  if (!settings) {
    return {
      pokemon: true,
      digimon: true,
      yokai: true,
      nexomon: true,
      pals: true,
      fakemon: true,
      finalfantasy: true,
      monsterhunter: true,
    };
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
  };
}

// ============================================================================
// Controllers
// ============================================================================

export async function rollStarterSets(req: Request, res: Response): Promise<void> {
  try {
    const rollerSettings = req.user?.monster_roller_settings ?? null;
    const userSettings = parseUserSettings(rollerSettings);
    const body = req.body as RollParams & { seed?: string };

    const roller = new MonsterRollerService({
      seed: body.seed ?? Date.now().toString(),
      userSettings,
    });

    const defaultParams: RollParams = {
      tables: roller.getEnabledTables(),
      includeStages: ['Base Stage', "Doesn't Evolve"],
      legendary: false,
      mythical: false,
      includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3,
    };

    const rollParams: RollParams = { ...defaultParams, ...body };

    const starterSets = [];
    for (let i = 0; i < 3; i++) {
      const setSeed = `${roller.getSeed()}-set-${i}`;
      const setRoller = new MonsterRollerService({
        seed: setSeed,
        enabledTables: roller.getEnabledTables(),
        userSettings,
      });

      const monsters = await setRoller.rollMany(rollParams, 10);
      if (monsters.length === 0) {
        res.status(404).json({ success: false, message: 'No monsters found with the given parameters' });
        return;
      }

      starterSets.push({
        setId: i + 1,
        seed: setSeed,
        monsters,
      });
    }

    res.json({
      success: true,
      data: starterSets,
      seed: roller.getSeed(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling starter monsters';
    console.error('Error rolling starter monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function selectStarters(req: Request, res: Response): Promise<void> {
  try {
    const { trainerId, selectedStarters } = req.body as {
      trainerId?: number;
      selectedStarters?: Array<{ monster: RolledMonster; name?: string }>;
    };

    if (!trainerId) {
      res.status(400).json({ success: false, message: 'Trainer ID is required' });
      return;
    }
    if (!selectedStarters || !Array.isArray(selectedStarters) || selectedStarters.length === 0) {
      res.status(400).json({ success: false, message: 'Selected starters are required' });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const trainerRepo = new TrainerRepository();
    const trainer = await trainerRepo.findById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const initializer = new MonsterInitializerService();
    const monsterRepo = new MonsterRepository();
    const createdMonsters = [];

    for (const starter of selectedStarters) {
      const { monster, name } = starter;

      const monsterData: MonsterData = {
        trainer_id: trainerId,
        name: name ?? monster.name ?? 'New Monster',
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
      data: { trainer, monsters: createdMonsters },
      message: 'Starter monsters added to trainer successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error selecting starter monsters';
    console.error('Error selecting starter monsters:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
