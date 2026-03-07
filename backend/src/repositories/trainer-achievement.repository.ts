import { BaseRepository } from './base.repository';
import { db } from '../database';

export type TrainerAchievementClaimRow = {
  id: number;
  trainer_id: number;
  achievement_id: string;
  claimed_at: Date;
};

export type TrainerAchievementClaim = {
  id: number;
  trainerId: number;
  achievementId: string;
  claimedAt: Date;
};

export type TrainerAchievementClaimCreateInput = {
  trainerId: number;
  achievementId: string;
};

export type TrainerAchievementClaimUpdateInput = Partial<TrainerAchievementClaimCreateInput>;

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  requirement: number;
  reward: {
    currency?: number;
    item?: string;
  };
};

export type AchievementProgress = AchievementDefinition & {
  category: string;
  type?: string;
  attribute?: string;
  progress: number;
  unlocked: boolean;
  claimed: boolean;
  canClaim: boolean;
};

const normalizeTrainerAchievementClaim = (row: TrainerAchievementClaimRow): TrainerAchievementClaim => ({
  id: row.id,
  trainerId: row.trainer_id,
  achievementId: row.achievement_id,
  claimedAt: row.claimed_at,
});

// Static achievement definitions
const TYPE_ACHIEVEMENTS: Record<string, AchievementDefinition[]> = {
  Normal: [
    { id: 'normal_1', name: 'Normal Starter', description: 'Own 1 Normal-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'normal_5', name: 'Normal Collector', description: 'Own 5 Normal-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'normal_10', name: 'Normal Enthusiast', description: 'Own 10 Normal-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'normal_25', name: 'Normal Expert', description: 'Own 25 Normal-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'normal_50', name: 'Normal Master', description: 'Own 50 Normal-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'normal_100', name: 'Normal Legend', description: 'Own 100 Normal-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Fire: [
    { id: 'fire_1', name: 'Fire Starter', description: 'Own 1 Fire-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fire_5', name: 'Fire Collector', description: 'Own 5 Fire-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'fire_10', name: 'Fire Enthusiast', description: 'Own 10 Fire-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'fire_25', name: 'Fire Expert', description: 'Own 25 Fire-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'fire_50', name: 'Fire Master', description: 'Own 50 Fire-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'fire_100', name: 'Fire Legend', description: 'Own 100 Fire-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Water: [
    { id: 'water_1', name: 'Water Starter', description: 'Own 1 Water-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'water_5', name: 'Water Collector', description: 'Own 5 Water-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'water_10', name: 'Water Enthusiast', description: 'Own 10 Water-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'water_25', name: 'Water Expert', description: 'Own 25 Water-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'water_50', name: 'Water Master', description: 'Own 50 Water-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'water_100', name: 'Water Legend', description: 'Own 100 Water-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Grass: [
    { id: 'grass_1', name: 'Grass Starter', description: 'Own 1 Grass-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'grass_5', name: 'Grass Collector', description: 'Own 5 Grass-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'grass_10', name: 'Grass Enthusiast', description: 'Own 10 Grass-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'grass_25', name: 'Grass Expert', description: 'Own 25 Grass-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'grass_50', name: 'Grass Master', description: 'Own 50 Grass-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'grass_100', name: 'Grass Legend', description: 'Own 100 Grass-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Electric: [
    { id: 'electric_1', name: 'Electric Starter', description: 'Own 1 Electric-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'electric_5', name: 'Electric Collector', description: 'Own 5 Electric-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'electric_10', name: 'Electric Enthusiast', description: 'Own 10 Electric-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'electric_25', name: 'Electric Expert', description: 'Own 25 Electric-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'electric_50', name: 'Electric Master', description: 'Own 50 Electric-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'electric_100', name: 'Electric Legend', description: 'Own 100 Electric-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Ice: [
    { id: 'ice_1', name: 'Ice Starter', description: 'Own 1 Ice-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ice_5', name: 'Ice Collector', description: 'Own 5 Ice-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'ice_10', name: 'Ice Enthusiast', description: 'Own 10 Ice-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'ice_25', name: 'Ice Expert', description: 'Own 25 Ice-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'ice_50', name: 'Ice Master', description: 'Own 50 Ice-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'ice_100', name: 'Ice Legend', description: 'Own 100 Ice-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Fighting: [
    { id: 'fighting_1', name: 'Fighting Starter', description: 'Own 1 Fighting-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fighting_5', name: 'Fighting Collector', description: 'Own 5 Fighting-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'fighting_10', name: 'Fighting Enthusiast', description: 'Own 10 Fighting-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'fighting_25', name: 'Fighting Expert', description: 'Own 25 Fighting-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'fighting_50', name: 'Fighting Master', description: 'Own 50 Fighting-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'fighting_100', name: 'Fighting Legend', description: 'Own 100 Fighting-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Poison: [
    { id: 'poison_1', name: 'Poison Starter', description: 'Own 1 Poison-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'poison_5', name: 'Poison Collector', description: 'Own 5 Poison-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'poison_10', name: 'Poison Enthusiast', description: 'Own 10 Poison-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'poison_25', name: 'Poison Expert', description: 'Own 25 Poison-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'poison_50', name: 'Poison Master', description: 'Own 50 Poison-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'poison_100', name: 'Poison Legend', description: 'Own 100 Poison-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Ground: [
    { id: 'ground_1', name: 'Ground Starter', description: 'Own 1 Ground-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ground_5', name: 'Ground Collector', description: 'Own 5 Ground-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'ground_10', name: 'Ground Enthusiast', description: 'Own 10 Ground-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'ground_25', name: 'Ground Expert', description: 'Own 25 Ground-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'ground_50', name: 'Ground Master', description: 'Own 50 Ground-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'ground_100', name: 'Ground Legend', description: 'Own 100 Ground-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Flying: [
    { id: 'flying_1', name: 'Flying Starter', description: 'Own 1 Flying-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'flying_5', name: 'Flying Collector', description: 'Own 5 Flying-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'flying_10', name: 'Flying Enthusiast', description: 'Own 10 Flying-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'flying_25', name: 'Flying Expert', description: 'Own 25 Flying-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'flying_50', name: 'Flying Master', description: 'Own 50 Flying-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'flying_100', name: 'Flying Legend', description: 'Own 100 Flying-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Psychic: [
    { id: 'psychic_1', name: 'Psychic Starter', description: 'Own 1 Psychic-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'psychic_5', name: 'Psychic Collector', description: 'Own 5 Psychic-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'psychic_10', name: 'Psychic Enthusiast', description: 'Own 10 Psychic-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'psychic_25', name: 'Psychic Expert', description: 'Own 25 Psychic-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'psychic_50', name: 'Psychic Master', description: 'Own 50 Psychic-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'psychic_100', name: 'Psychic Legend', description: 'Own 100 Psychic-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Bug: [
    { id: 'bug_1', name: 'Bug Starter', description: 'Own 1 Bug-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'bug_5', name: 'Bug Collector', description: 'Own 5 Bug-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'bug_10', name: 'Bug Enthusiast', description: 'Own 10 Bug-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'bug_25', name: 'Bug Expert', description: 'Own 25 Bug-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'bug_50', name: 'Bug Master', description: 'Own 50 Bug-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'bug_100', name: 'Bug Legend', description: 'Own 100 Bug-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Rock: [
    { id: 'rock_1', name: 'Rock Starter', description: 'Own 1 Rock-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'rock_5', name: 'Rock Collector', description: 'Own 5 Rock-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'rock_10', name: 'Rock Enthusiast', description: 'Own 10 Rock-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'rock_25', name: 'Rock Expert', description: 'Own 25 Rock-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'rock_50', name: 'Rock Master', description: 'Own 50 Rock-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'rock_100', name: 'Rock Legend', description: 'Own 100 Rock-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Ghost: [
    { id: 'ghost_1', name: 'Ghost Starter', description: 'Own 1 Ghost-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ghost_5', name: 'Ghost Collector', description: 'Own 5 Ghost-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'ghost_10', name: 'Ghost Enthusiast', description: 'Own 10 Ghost-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'ghost_25', name: 'Ghost Expert', description: 'Own 25 Ghost-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'ghost_50', name: 'Ghost Master', description: 'Own 50 Ghost-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'ghost_100', name: 'Ghost Legend', description: 'Own 100 Ghost-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Dragon: [
    { id: 'dragon_1', name: 'Dragon Starter', description: 'Own 1 Dragon-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'dragon_5', name: 'Dragon Collector', description: 'Own 5 Dragon-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'dragon_10', name: 'Dragon Enthusiast', description: 'Own 10 Dragon-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'dragon_25', name: 'Dragon Expert', description: 'Own 25 Dragon-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'dragon_50', name: 'Dragon Master', description: 'Own 50 Dragon-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'dragon_100', name: 'Dragon Legend', description: 'Own 100 Dragon-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Dark: [
    { id: 'dark_1', name: 'Dark Starter', description: 'Own 1 Dark-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'dark_5', name: 'Dark Collector', description: 'Own 5 Dark-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'dark_10', name: 'Dark Enthusiast', description: 'Own 10 Dark-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'dark_25', name: 'Dark Expert', description: 'Own 25 Dark-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'dark_50', name: 'Dark Master', description: 'Own 50 Dark-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'dark_100', name: 'Dark Legend', description: 'Own 100 Dark-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Steel: [
    { id: 'steel_1', name: 'Steel Starter', description: 'Own 1 Steel-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'steel_5', name: 'Steel Collector', description: 'Own 5 Steel-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'steel_10', name: 'Steel Enthusiast', description: 'Own 10 Steel-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'steel_25', name: 'Steel Expert', description: 'Own 25 Steel-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'steel_50', name: 'Steel Master', description: 'Own 50 Steel-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'steel_100', name: 'Steel Legend', description: 'Own 100 Steel-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Fairy: [
    { id: 'fairy_1', name: 'Fairy Starter', description: 'Own 1 Fairy-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fairy_5', name: 'Fairy Collector', description: 'Own 5 Fairy-type monsters', requirement: 5, reward: { currency: 250 } },
    { id: 'fairy_10', name: 'Fairy Enthusiast', description: 'Own 10 Fairy-type monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'fairy_25', name: 'Fairy Expert', description: 'Own 25 Fairy-type monsters', requirement: 25, reward: { currency: 1000 } },
    { id: 'fairy_50', name: 'Fairy Master', description: 'Own 50 Fairy-type monsters', requirement: 50, reward: { currency: 2500 } },
    { id: 'fairy_100', name: 'Fairy Legend', description: 'Own 100 Fairy-type monsters', requirement: 100, reward: { currency: 5000 } },
  ],
};

const ATTRIBUTE_ACHIEVEMENTS: Record<string, AchievementDefinition[]> = {
  Virus: [
    { id: 'virus_5', name: 'Virus Starter', description: 'Own 5 Virus attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'virus_10', name: 'Virus Collector', description: 'Own 10 Virus attribute monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'virus_25', name: 'Virus Expert', description: 'Own 25 Virus attribute monsters', requirement: 25, reward: { currency: 1250 } },
    { id: 'virus_75', name: 'Virus Master', description: 'Own 75 Virus attribute monsters', requirement: 75, reward: { currency: 3750 } },
    { id: 'virus_100', name: 'Virus Legend', description: 'Own 100 Virus attribute monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Vaccine: [
    { id: 'vaccine_5', name: 'Vaccine Starter', description: 'Own 5 Vaccine attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'vaccine_10', name: 'Vaccine Collector', description: 'Own 10 Vaccine attribute monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'vaccine_25', name: 'Vaccine Expert', description: 'Own 25 Vaccine attribute monsters', requirement: 25, reward: { currency: 1250 } },
    { id: 'vaccine_75', name: 'Vaccine Master', description: 'Own 75 Vaccine attribute monsters', requirement: 75, reward: { currency: 3750 } },
    { id: 'vaccine_100', name: 'Vaccine Legend', description: 'Own 100 Vaccine attribute monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Data: [
    { id: 'data_5', name: 'Data Starter', description: 'Own 5 Data attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'data_10', name: 'Data Collector', description: 'Own 10 Data attribute monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'data_25', name: 'Data Expert', description: 'Own 25 Data attribute monsters', requirement: 25, reward: { currency: 1250 } },
    { id: 'data_75', name: 'Data Master', description: 'Own 75 Data attribute monsters', requirement: 75, reward: { currency: 3750 } },
    { id: 'data_100', name: 'Data Legend', description: 'Own 100 Data attribute monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Free: [
    { id: 'free_5', name: 'Free Starter', description: 'Own 5 Free attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'free_10', name: 'Free Collector', description: 'Own 10 Free attribute monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'free_25', name: 'Free Expert', description: 'Own 25 Free attribute monsters', requirement: 25, reward: { currency: 1250 } },
    { id: 'free_75', name: 'Free Master', description: 'Own 75 Free attribute monsters', requirement: 75, reward: { currency: 3750 } },
    { id: 'free_100', name: 'Free Legend', description: 'Own 100 Free attribute monsters', requirement: 100, reward: { currency: 5000 } },
  ],
  Variable: [
    { id: 'variable_5', name: 'Variable Starter', description: 'Own 5 Variable attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'variable_10', name: 'Variable Collector', description: 'Own 10 Variable attribute monsters', requirement: 10, reward: { currency: 500 } },
    { id: 'variable_25', name: 'Variable Expert', description: 'Own 25 Variable attribute monsters', requirement: 25, reward: { currency: 1250 } },
    { id: 'variable_75', name: 'Variable Master', description: 'Own 75 Variable attribute monsters', requirement: 75, reward: { currency: 3750 } },
    { id: 'variable_100', name: 'Variable Legend', description: 'Own 100 Variable attribute monsters', requirement: 100, reward: { currency: 5000 } },
  ],
};

const LEVEL_100_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'level100_1', name: 'Century Starter', description: 'Own 1 level 100 monster', requirement: 1, reward: { currency: 500 } },
  { id: 'level100_5', name: 'Century Collector', description: 'Own 5 level 100 monsters', requirement: 5, reward: { currency: 1500 } },
  { id: 'level100_10', name: 'Century Expert', description: 'Own 10 level 100 monsters', requirement: 10, reward: { currency: 3000 } },
  { id: 'level100_20', name: 'Century Master', description: 'Own 20 level 100 monsters', requirement: 20, reward: { currency: 6000 } },
  { id: 'level100_50', name: 'Century Elite', description: 'Own 50 level 100 monsters', requirement: 50, reward: { currency: 15000 } },
  { id: 'level100_100', name: 'Century Legend', description: 'Own 100 level 100 monsters', requirement: 100, reward: { currency: 30000 } },
];

const TRAINER_LEVEL_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'trainer_level_50', name: 'Halfway There', description: 'Reach trainer level 50', requirement: 50, reward: { currency: 2500 } },
  { id: 'trainer_level_100', name: 'Century Trainer', description: 'Reach trainer level 100', requirement: 100, reward: { currency: 5000 } },
  { id: 'trainer_level_200', name: 'Double Century', description: 'Reach trainer level 200', requirement: 200, reward: { currency: 10000 } },
  { id: 'trainer_level_300', name: 'Triple Century', description: 'Reach trainer level 300', requirement: 300, reward: { currency: 15000 } },
  { id: 'trainer_level_400', name: 'Quadruple Century', description: 'Reach trainer level 400', requirement: 400, reward: { currency: 20000 } },
  { id: 'trainer_level_500', name: 'Half Millennium', description: 'Reach trainer level 500', requirement: 500, reward: { currency: 25000 } },
  { id: 'trainer_level_1000', name: 'Millennium Trainer', description: 'Reach trainer level 1000', requirement: 1000, reward: { currency: 50000 } },
];

const SPECIAL_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'unown_26', name: 'Allegedly Literate', description: 'Own 26 Unown', requirement: 26, reward: { currency: 10000, item: 'Standard Egg' } },
  { id: 'oak_is_calling', name: 'Oak is Calling', description: 'Own 151+ unique monster species', requirement: 151, reward: { currency: 15000 } },
  { id: 'adoption_center', name: 'Are you an Adoption Center?', description: 'Own more than 250 monsters', requirement: 251, reward: { currency: 10000 } },
  { id: 'variety_the_same', name: 'Variety the Same', description: 'Own more than 5 different monsters with the same species', requirement: 6, reward: { currency: 5000 } },
];

export class TrainerAchievementRepository extends BaseRepository<
  TrainerAchievementClaim,
  TrainerAchievementClaimCreateInput,
  TrainerAchievementClaimUpdateInput
> {
  constructor() {
    super('trainer_achievement_claims');
  }

  // Static methods for achievement definitions
  static getTypeAchievements(): Record<string, AchievementDefinition[]> {
    return TYPE_ACHIEVEMENTS;
  }

  static getAttributeAchievements(): Record<string, AchievementDefinition[]> {
    return ATTRIBUTE_ACHIEVEMENTS;
  }

  static getLevel100Achievements(): AchievementDefinition[] {
    return LEVEL_100_ACHIEVEMENTS;
  }

  static getTrainerLevelAchievements(): AchievementDefinition[] {
    return TRAINER_LEVEL_ACHIEVEMENTS;
  }

  static getSpecialAchievements(): AchievementDefinition[] {
    return SPECIAL_ACHIEVEMENTS;
  }

  static getAllAchievementIds(): string[] {
    const ids: string[] = [];

    for (const typeAchievements of Object.values(TYPE_ACHIEVEMENTS)) {
      ids.push(...typeAchievements.map((a) => a.id));
    }

    for (const attrAchievements of Object.values(ATTRIBUTE_ACHIEVEMENTS)) {
      ids.push(...attrAchievements.map((a) => a.id));
    }

    ids.push(...LEVEL_100_ACHIEVEMENTS.map((a) => a.id));
    ids.push(...TRAINER_LEVEL_ACHIEVEMENTS.map((a) => a.id));
    ids.push(...SPECIAL_ACHIEVEMENTS.map((a) => a.id));

    return ids;
  }

  override async findById(id: number): Promise<TrainerAchievementClaim | null> {
    const result = await db.query<TrainerAchievementClaimRow>(
      'SELECT * FROM trainer_achievement_claims WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeTrainerAchievementClaim(row) : null;
  }

  async findByTrainerId(trainerId: number): Promise<TrainerAchievementClaim[]> {
    const result = await db.query<TrainerAchievementClaimRow>(
      'SELECT * FROM trainer_achievement_claims WHERE trainer_id = $1',
      [trainerId]
    );
    return result.rows.map(normalizeTrainerAchievementClaim);
  }

  async getClaimedAchievementIds(trainerId: number): Promise<Set<string>> {
    const claims = await this.findByTrainerId(trainerId);
    return new Set(claims.map((c) => c.achievementId));
  }

  async isAchievementClaimed(trainerId: number, achievementId: string): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM trainer_achievement_claims WHERE trainer_id = $1 AND achievement_id = $2',
      [trainerId, achievementId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  override async create(input: TrainerAchievementClaimCreateInput): Promise<TrainerAchievementClaim> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO trainer_achievement_claims (trainer_id, achievement_id, claimed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id`,
      [input.trainerId, input.achievementId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create achievement claim');
    }
    const claim = await this.findById(row.id);
    if (!claim) {
      throw new Error('Failed to create achievement claim');
    }
    return claim;
  }

  override async update(id: number, _input: TrainerAchievementClaimUpdateInput): Promise<TrainerAchievementClaim> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Achievement claim not found');
    }
    // Achievement claims are immutable after creation
    return existing;
  }

  async claimAchievement(trainerId: number, achievementId: string): Promise<TrainerAchievementClaim> {
    const isClaimed = await this.isAchievementClaimed(trainerId, achievementId);
    if (isClaimed) {
      throw new Error('Achievement already claimed');
    }

    return this.create({ trainerId, achievementId });
  }

  async claimMultiple(trainerId: number, achievementIds: string[]): Promise<TrainerAchievementClaim[]> {
    const claims: TrainerAchievementClaim[] = [];

    for (const achievementId of achievementIds) {
      try {
        const claim = await this.claimAchievement(trainerId, achievementId);
        claims.push(claim);
      } catch {
        // Skip already claimed achievements
      }
    }

    return claims;
  }
}
