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
    levels?: number;
    items?: { name: string; quantity: number }[];
    /** @deprecated Use items array instead */
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
    { id: 'normal_1', name: 'Plain Jane', description: 'Own 1 Normal-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'normal_5', name: 'Beige Appreciator', description: 'Own 5 Normal-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Normal Poffin', quantity: 2 }] } },
    { id: 'normal_10', name: 'Nothing Special Enthusiast', description: 'Own 10 Normal-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Normal Nurture Kit', quantity: 1 }, { name: 'Normal Evolution Stone', quantity: 1 }] } },
    { id: 'normal_25', name: 'Statistically Average', description: 'Own 25 Normal-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Normal Nurture Kit', quantity: 1 }, { name: 'Normal Evolution Stone', quantity: 1 }, { name: 'Patama Berry', quantity: 2 }] } },
    { id: 'normal_50', name: 'Normality at Scale', description: 'Own 50 Normal-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'normal_100', name: 'Normalcy Maximalist', description: 'Own 100 Normal-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Fire: [
    { id: 'fire_1', name: 'Kindling Keeper', description: 'Own 1 Fire-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fire_5', name: 'Campfire Curator', description: 'Own 5 Fire-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Fire Poffin', quantity: 2 }] } },
    { id: 'fire_10', name: 'Pyro in Progress', description: 'Own 10 Fire-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Fire Nurture Kit', quantity: 1 }, { name: 'Fire Evolution Stone', quantity: 1 }] } },
    { id: 'fire_25', name: 'Fahrenheit Fanatic', description: 'Own 25 Fire-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Fire Nurture Kit', quantity: 1 }, { name: 'Fire Evolution Stone', quantity: 1 }, { name: 'Miraca Berry', quantity: 2 }] } },
    { id: 'fire_50', name: 'Living Inferno', description: 'Own 50 Fire-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'fire_100', name: "Sun's Apprentice", description: 'Own 100 Fire-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Water: [
    { id: 'water_1', name: 'Floaties Owner', description: 'Own 1 Water-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'water_5', name: 'Puddle Paddler', description: 'Own 5 Water-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Water Poffin', quantity: 2 }] } },
    { id: 'water_10', name: 'Tide Watcher', description: 'Own 10 Water-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Water Nurture Kit', quantity: 1 }, { name: 'Water Evolution Stone', quantity: 1 }] } },
    { id: 'water_25', name: 'Current Rider', description: 'Own 25 Water-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Water Nurture Kit', quantity: 1 }, { name: 'Water Evolution Stone', quantity: 1 }, { name: 'Addish Berry', quantity: 2 }] } },
    { id: 'water_50', name: 'Deep Diver', description: 'Own 50 Water-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'water_100', name: 'Mariana Resident', description: 'Own 100 Water-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Cocon Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Grass: [
    { id: 'grass_1', name: 'Seedling Sitter', description: 'Own 1 Grass-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'grass_5', name: 'Garden Tender', description: 'Own 5 Grass-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Grass Poffin', quantity: 2 }] } },
    { id: 'grass_10', name: 'Hedge Maze Owner', description: 'Own 10 Grass-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Grass Nurture Kit', quantity: 1 }, { name: 'Grass Evolution Stone', quantity: 1 }] } },
    { id: 'grass_25', name: 'Overgrowth Enabler', description: 'Own 25 Grass-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Grass Nurture Kit', quantity: 1 }, { name: 'Grass Evolution Stone', quantity: 1 }, { name: 'Mala Berry', quantity: 2 }] } },
    { id: 'grass_50', name: 'Jungle Warden', description: 'Own 50 Grass-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'grass_100', name: 'Ancient Grove Keeper', description: 'Own 100 Grass-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Sky Carrot Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Electric: [
    { id: 'electric_1', name: 'Static Shock Survivor', description: 'Own 1 Electric-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'electric_5', name: 'Short Circuit', description: 'Own 5 Electric-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Electric Poffin', quantity: 2 }] } },
    { id: 'electric_10', name: 'Live Wire', description: 'Own 10 Electric-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Electric Nurture Kit', quantity: 1 }, { name: 'Electric Evolution Stone', quantity: 1 }] } },
    { id: 'electric_25', name: 'Power Grid', description: 'Own 25 Electric-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Electric Nurture Kit', quantity: 1 }, { name: 'Electric Evolution Stone', quantity: 1 }, { name: 'Cocon Berry', quantity: 2 }] } },
    { id: 'electric_50', name: 'Rolling Blackout', description: 'Own 50 Electric-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'electric_100', name: 'Walking Thunderstorm', description: 'Own 100 Electric-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Addish Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Ice: [
    { id: 'ice_1', name: 'Brain Freeze', description: 'Own 1 Ice-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ice_5', name: 'Slippery When Wet', description: 'Own 5 Ice-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Ice Poffin', quantity: 2 }] } },
    { id: 'ice_10', name: 'Thin Ice Walker', description: 'Own 10 Ice-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Ice Nurture Kit', quantity: 1 }, { name: 'Ice Evolution Stone', quantity: 1 }] } },
    { id: 'ice_25', name: 'Permafrost Pioneer', description: 'Own 25 Ice-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Ice Nurture Kit', quantity: 1 }, { name: 'Ice Evolution Stone', quantity: 1 }, { name: 'Lilan Berry', quantity: 2 }] } },
    { id: 'ice_50', name: 'Absolute Zero Seeker', description: 'Own 50 Ice-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'ice_100', name: 'Heat Death Denier', description: 'Own 100 Ice-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
  ],
  Fighting: [
    { id: 'fighting_1', name: 'First Day at the Gym', description: 'Own 1 Fighting-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fighting_5', name: 'Sparring Partner', description: 'Own 5 Fighting-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Fighting Poffin', quantity: 2 }] } },
    { id: 'fighting_10', name: 'Brawl Regular', description: 'Own 10 Fighting-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Fighting Nurture Kit', quantity: 1 }, { name: 'Fighting Evolution Stone', quantity: 1 }] } },
    { id: 'fighting_25', name: 'Tournament Circuit', description: 'Own 25 Fighting-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Fighting Nurture Kit', quantity: 1 }, { name: 'Fighting Evolution Stone', quantity: 1 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'fighting_50', name: 'Main Event', description: 'Own 50 Fighting-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'fighting_100', name: 'Undisputed Champion', description: 'Own 100 Fighting-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Macho Brace', quantity: 1 }] } },
  ],
  Poison: [
    { id: 'poison_1', name: 'Accidentally Touched It', description: 'Own 1 Poison-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'poison_5', name: 'Hazmat Curious', description: 'Own 5 Poison-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Poison Poffin', quantity: 2 }] } },
    { id: 'poison_10', name: 'Toxic Taste Tester', description: 'Own 10 Poison-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Poison Nurture Kit', quantity: 1 }, { name: 'Poison Evolution Stone', quantity: 1 }] } },
    { id: 'poison_25', name: 'Venom Vendor', description: 'Own 25 Poison-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Poison Nurture Kit', quantity: 1 }, { name: 'Poison Evolution Stone', quantity: 1 }, { name: 'Kham Berry', quantity: 2 }] } },
    { id: 'poison_50', name: 'Biohazard Baron', description: 'Own 50 Poison-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'poison_100', name: 'Venomous Virtuoso', description: 'Own 100 Poison-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Cocon Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Ground: [
    { id: 'ground_1', name: 'Got a Little Muddy', description: 'Own 1 Ground-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ground_5', name: 'Dirt Road Regular', description: 'Own 5 Ground-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Ground Poffin', quantity: 2 }] } },
    { id: 'ground_10', name: 'Trench Digger', description: 'Own 10 Ground-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Ground Nurture Kit', quantity: 1 }, { name: 'Ground Evolution Stone', quantity: 1 }] } },
    { id: 'ground_25', name: 'Tectonic Hobbyist', description: 'Own 25 Ground-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Ground Nurture Kit', quantity: 1 }, { name: 'Ground Evolution Stone', quantity: 1 }, { name: 'Siron Berry', quantity: 2 }] } },
    { id: 'ground_50', name: 'Seismic Authority', description: 'Own 50 Ground-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'ground_100', name: 'Continental Shelf Manager', description: 'Own 100 Ground-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Flying: [
    { id: 'flying_1', name: 'Looking Up', description: 'Own 1 Flying-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'flying_5', name: 'Frequent Flier', description: 'Own 5 Flying-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Flying Poffin', quantity: 2 }] } },
    { id: 'flying_10', name: 'Cloud Surfer', description: 'Own 10 Flying-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Flying Nurture Kit', quantity: 1 }, { name: 'Flying Evolution Stone', quantity: 1 }] } },
    { id: 'flying_25', name: 'Stratosphere Skipper', description: 'Own 25 Flying-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Flying Nurture Kit', quantity: 1 }, { name: 'Flying Evolution Stone', quantity: 1 }, { name: 'Sky Carrot Berry', quantity: 2 }] } },
    { id: 'flying_50', name: 'Jet Stream Rider', description: 'Own 50 Flying-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'flying_100', name: "Sky's the Limit", description: 'Own 100 Flying-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Sky Carrot Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Psychic: [
    { id: 'psychic_1', name: 'Telepathy Curious', description: 'Own 1 Psychic-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'psychic_5', name: 'Mind Reader in Training', description: 'Own 5 Psychic-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Psychic Poffin', quantity: 2 }] } },
    { id: 'psychic_10', name: 'Third Eye Opening', description: 'Own 10 Psychic-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Psychic Nurture Kit', quantity: 1 }, { name: 'Psychic Evolution Stone', quantity: 1 }] } },
    { id: 'psychic_25', name: 'Thought Criminal', description: 'Own 25 Psychic-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Psychic Nurture Kit', quantity: 1 }, { name: 'Psychic Evolution Stone', quantity: 1 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'psychic_50', name: 'Psychic Overload', description: 'Own 50 Psychic-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'psychic_100', name: 'Consciousness Collector', description: 'Own 100 Psychic-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Scroll of Secrets', quantity: 1 }] } },
  ],
  Bug: [
    { id: 'bug_1', name: 'Bug Catcher', description: 'Own 1 Bug-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'bug_5', name: 'Jar Full of Bugs', description: 'Own 5 Bug-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Bug Poffin', quantity: 2 }] } },
    { id: 'bug_10', name: "Pest Control's Nemesis", description: 'Own 10 Bug-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Bug Nurture Kit', quantity: 1 }, { name: 'Bug Evolution Stone', quantity: 1 }] } },
    { id: 'bug_25', name: 'Entomology Dropout', description: 'Own 25 Bug-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Bug Nurture Kit', quantity: 1 }, { name: 'Bug Evolution Stone', quantity: 1 }, { name: 'Mala Berry', quantity: 2 }] } },
    { id: 'bug_50', name: 'Hive Mind Adjacent', description: 'Own 50 Bug-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'bug_100', name: 'Bugpocalypse', description: 'Own 100 Bug-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Rock: [
    { id: 'rock_1', name: 'Rock Bottom', description: 'Own 1 Rock-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'rock_5', name: 'Rolling Stone', description: 'Own 5 Rock-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Rock Poffin', quantity: 2 }] } },
    { id: 'rock_10', name: 'Pebble Hoarder', description: 'Own 10 Rock-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Rock Nurture Kit', quantity: 1 }, { name: 'Rock Evolution Stone', quantity: 1 }] } },
    { id: 'rock_25', name: 'Geologist Adjacent', description: 'Own 25 Rock-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Rock Nurture Kit', quantity: 1 }, { name: 'Rock Evolution Stone', quantity: 1 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'rock_50', name: 'Tectonic Plate', description: 'Own 50 Rock-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'rock_100', name: 'Mountain Incarnate', description: 'Own 100 Rock-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  Ghost: [
    { id: 'ghost_1', name: 'Something in the Corner', description: 'Own 1 Ghost-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'ghost_5', name: 'Haunted House Regular', description: 'Own 5 Ghost-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Ghost Poffin', quantity: 2 }] } },
    { id: 'ghost_10', name: 'Ghost Whisperer', description: 'Own 10 Ghost-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Ghost Nurture Kit', quantity: 1 }, { name: 'Ghost Evolution Stone', quantity: 1 }] } },
    { id: 'ghost_25', name: 'Ectoplasm Enthusiast', description: 'Own 25 Ghost-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Ghost Nurture Kit', quantity: 1 }, { name: 'Ghost Evolution Stone', quantity: 1 }, { name: 'Mala Berry', quantity: 2 }] } },
    { id: 'ghost_50', name: 'Paranormal Investigator', description: 'Own 50 Ghost-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'ghost_100', name: 'Grim Reaper Adjacent', description: 'Own 100 Ghost-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Cocon Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
  ],
  Dragon: [
    { id: 'dragon_1', name: 'Fantasy Novel Fan', description: 'Own 1 Dragon-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'dragon_5', name: 'D&D Regular', description: 'Own 5 Dragon-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Dragon Poffin', quantity: 2 }] } },
    { id: 'dragon_10', name: 'Dragon Hoarder', description: 'Own 10 Dragon-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Dragon Nurture Kit', quantity: 1 }, { name: 'Dragon Evolution Stone', quantity: 1 }] } },
    { id: 'dragon_25', name: 'Lair Builder', description: 'Own 25 Dragon-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Dragon Nurture Kit', quantity: 1 }, { name: 'Dragon Evolution Stone', quantity: 1 }, { name: 'Azzuk Berry', quantity: 2 }] } },
    { id: 'dragon_50', name: 'Dragonlord', description: 'Own 50 Dragon-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'dragon_100', name: 'Draconic Pantheon', description: 'Own 100 Dragon-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Dark: [
    { id: 'dark_1', name: 'Suspicious Grin', description: 'Own 1 Dark-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'dark_5', name: 'Shady Dealings', description: 'Own 5 Dark-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Dark Poffin', quantity: 2 }] } },
    { id: 'dark_10', name: 'Shadow Lurker', description: 'Own 10 Dark-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Dark Nurture Kit', quantity: 1 }, { name: 'Dark Evolution Stone', quantity: 1 }] } },
    { id: 'dark_25', name: 'Darkness Devotee', description: 'Own 25 Dark-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Dark Nurture Kit', quantity: 1 }, { name: 'Dark Evolution Stone', quantity: 1 }, { name: 'Miraca Berry', quantity: 2 }] } },
    { id: 'dark_50', name: 'Villainy Veteran', description: 'Own 50 Dark-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'dark_100', name: 'Darkness Incarnate', description: 'Own 100 Dark-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
  ],
  Steel: [
    { id: 'steel_1', name: 'Metal Head', description: 'Own 1 Steel-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'steel_5', name: 'Hardware Hobbyist', description: 'Own 5 Steel-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Steel Poffin', quantity: 2 }] } },
    { id: 'steel_10', name: 'Armory Adjacent', description: 'Own 10 Steel-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Steel Nurture Kit', quantity: 1 }, { name: 'Steel Evolution Stone', quantity: 1 }] } },
    { id: 'steel_25', name: 'Steel Magnolia', description: 'Own 25 Steel-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Steel Nurture Kit', quantity: 1 }, { name: 'Steel Evolution Stone', quantity: 1 }, { name: 'Bottle Cap', quantity: 2 }] } },
    { id: 'steel_50', name: 'Iron Curtain', description: 'Own 50 Steel-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'steel_100', name: 'The Singularity', description: 'Own 100 Steel-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Datei Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Gold Bottle Cap', quantity: 1 }] } },
  ],
  Fairy: [
    { id: 'fairy_1', name: 'Caught a Pixie', description: 'Own 1 Fairy-type monster', requirement: 1, reward: { currency: 100 } },
    { id: 'fairy_5', name: 'Fairy Ring Finder', description: 'Own 5 Fairy-type monsters', requirement: 5, reward: { currency: 250, items: [{ name: 'Fairy Poffin', quantity: 2 }] } },
    { id: 'fairy_10', name: 'Enchanted Garden Keeper', description: 'Own 10 Fairy-type monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Fairy Nurture Kit', quantity: 1 }, { name: 'Fairy Evolution Stone', quantity: 1 }] } },
    { id: 'fairy_25', name: 'Fae Folk Friend', description: 'Own 25 Fairy-type monsters', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Fairy Nurture Kit', quantity: 1 }, { name: 'Fairy Evolution Stone', quantity: 1 }, { name: 'Espara Berry', quantity: 2 }] } },
    { id: 'fairy_50', name: 'Glamour Gourmand', description: 'Own 50 Fairy-type monsters', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'fairy_100', name: 'Faerie Court Regular', description: 'Own 100 Fairy-type monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Espara Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
};

const ATTRIBUTE_ACHIEVEMENTS: Record<string, AchievementDefinition[]> = {
  Virus: [
    { id: 'virus_5', name: 'Infected', description: 'Own 5 Virus attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'virus_10', name: 'Carrier', description: 'Own 10 Virus attribute monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Corruption Code', quantity: 1 }, { name: 'DigiMeat', quantity: 2 }] } },
    { id: 'virus_25', name: 'Outbreak Origin', description: 'Own 25 Virus attribute monsters', requirement: 25, reward: { currency: 1250, levels: 5, items: [{ name: 'Corruption Code', quantity: 2 }, { name: 'DigiMeat', quantity: 3 }, { name: 'Miraca Berry', quantity: 2 }] } },
    { id: 'virus_75', name: 'Pandemic Proportions', description: 'Own 75 Virus attribute monsters', requirement: 75, reward: { currency: 3750, levels: 10, items: [{ name: 'Corruption Code', quantity: 2 }, { name: 'Incubator', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
    { id: 'virus_100', name: 'Zero Day', description: 'Own 100 Virus attribute monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Corruption Code', quantity: 2 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Digital Megabytes', quantity: 1 }] } },
  ],
  Vaccine: [
    { id: 'vaccine_5', name: 'First Shot', description: 'Own 5 Vaccine attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'vaccine_10', name: 'Fully Immunized', description: 'Own 10 Vaccine attribute monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Repair Code', quantity: 1 }, { name: 'DigiMeat', quantity: 2 }] } },
    { id: 'vaccine_25', name: 'Herd Immunity', description: 'Own 25 Vaccine attribute monsters', requirement: 25, reward: { currency: 1250, levels: 5, items: [{ name: 'Repair Code', quantity: 2 }, { name: 'DigiMeat', quantity: 3 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'vaccine_75', name: 'Cure Seeker', description: 'Own 75 Vaccine attribute monsters', requirement: 75, reward: { currency: 3750, levels: 10, items: [{ name: 'Repair Code', quantity: 2 }, { name: 'Incubator', quantity: 1 }, { name: 'Digital Repair Mode', quantity: 1 }] } },
    { id: 'vaccine_100', name: 'Antidote Achieved', description: 'Own 100 Vaccine attribute monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Repair Code', quantity: 2 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Digital Megabytes', quantity: 1 }] } },
  ],
  Data: [
    { id: 'data_5', name: 'Data Entry', description: 'Own 5 Data attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'data_10', name: 'Spreadsheet Warrior', description: 'Own 10 Data attribute monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Shiny New Code', quantity: 1 }, { name: 'DigiMeat', quantity: 2 }] } },
    { id: 'data_25', name: 'Database Admin', description: 'Own 25 Data attribute monsters', requirement: 25, reward: { currency: 1250, levels: 5, items: [{ name: 'Shiny New Code', quantity: 2 }, { name: 'DigiMeat', quantity: 3 }, { name: 'Patama Berry', quantity: 2 }] } },
    { id: 'data_75', name: 'Big Data', description: 'Own 75 Data attribute monsters', requirement: 75, reward: { currency: 3750, levels: 10, items: [{ name: 'Shiny New Code', quantity: 2 }, { name: 'Incubator', quantity: 1 }, { name: 'Digital Gigabytes', quantity: 1 }] } },
    { id: 'data_100', name: 'The Algorithm', description: 'Own 100 Data attribute monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Shiny New Code', quantity: 2 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Digital Repair Mode', quantity: 1 }] } },
  ],
  Free: [
    { id: 'free_5', name: 'Off the Leash', description: 'Own 5 Free attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'free_10', name: 'Wild Card', description: 'Own 10 Free attribute monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Datei Berry', quantity: 2 }, { name: 'Aurora Evolution Stone', quantity: 1 }] } },
    { id: 'free_25', name: 'Untethered', description: 'Own 25 Free attribute monsters', requirement: 25, reward: { currency: 1250, levels: 5, items: [{ name: 'Datei Berry', quantity: 3 }, { name: 'Aurora Evolution Stone', quantity: 1 }, { name: 'Datei Pastry', quantity: 1 }] } },
    { id: 'free_75', name: 'Breaking Free', description: 'Own 75 Free attribute monsters', requirement: 75, reward: { currency: 3750, levels: 10, items: [{ name: 'Datei Berry', quantity: 3 }, { name: 'Incubator', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
    { id: 'free_100', name: 'Beyond Rules', description: 'Own 100 Free attribute monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Datei Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Variable: [
    { id: 'variable_5', name: 'Undefined', description: 'Own 5 Variable attribute monsters', requirement: 5, reward: { currency: 200 } },
    { id: 'variable_10', name: 'Type Error', description: 'Own 10 Variable attribute monsters', requirement: 10, reward: { currency: 500, items: [{ name: 'Miraca Berry', quantity: 2 }, { name: 'Cocon Berry', quantity: 2 }] } },
    { id: 'variable_25', name: 'Polymorphic', description: 'Own 25 Variable attribute monsters', requirement: 25, reward: { currency: 1250, levels: 5, items: [{ name: 'Miraca Berry', quantity: 3 }, { name: 'Cocon Berry', quantity: 2 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'variable_75', name: 'Runtime Surprise', description: 'Own 75 Variable attribute monsters', requirement: 75, reward: { currency: 3750, levels: 10, items: [{ name: 'Miraca Berry', quantity: 3 }, { name: 'Incubator', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }] } },
    { id: 'variable_100', name: 'Null Reference', description: 'Own 100 Variable attribute monsters', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Aurora Evolution Stone', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }] } },
  ],
};

const LEVEL_100_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'level100_1', name: 'Triple Digits', description: 'Own 1 level 100 monster', requirement: 1, reward: { currency: 500 } },
  { id: 'level100_5', name: 'Elite Roster', description: 'Own 5 level 100 monsters', requirement: 5, reward: { currency: 1500, levels: 5, items: [{ name: 'Incubator', quantity: 1 }] } },
  { id: 'level100_10', name: 'Dream Team', description: 'Own 10 level 100 monsters', requirement: 10, reward: { currency: 3000, levels: 10, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Daycare Daypass', quantity: 1 }] } },
  { id: 'level100_20', name: 'Powerhouse Army', description: 'Own 20 level 100 monsters', requirement: 20, reward: { currency: 6000, levels: 10, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Incubator', quantity: 2 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  { id: 'level100_50', name: 'Legend Armada', description: 'Own 50 level 100 monsters', requirement: 50, reward: { currency: 15000, levels: 15, items: [{ name: 'Standard Egg', quantity: 2 }, { name: 'Incubator', quantity: 3 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  { id: 'level100_100', name: 'The Untouchables', description: 'Own 100 level 100 monsters', requirement: 100, reward: { currency: 30000, levels: 20, items: [{ name: 'Standard Egg', quantity: 3 }, { name: 'Incubator', quantity: 5 }, { name: 'Teeming Totem', quantity: 2 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Gold Bottle Cap', quantity: 1 }, { name: 'Daycare Daypass', quantity: 1 }] } },
];

const TRAINER_LEVEL_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'trainer_level_50', name: 'Halfway There', description: 'Reach trainer level 50', requirement: 50, reward: { currency: 2500, levels: 5, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Fertilizer', quantity: 3 }] } },
  { id: 'trainer_level_100', name: 'Century Trainer', description: 'Reach trainer level 100', requirement: 100, reward: { currency: 5000, levels: 10, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Incubator', quantity: 2 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Miraca Berry', quantity: 3 }] } },
  { id: 'trainer_level_200', name: 'Double Century', description: 'Reach trainer level 200', requirement: 200, reward: { currency: 10000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Incubator', quantity: 3 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Scroll of Secrets', quantity: 1 }, { name: 'Cocon Berry', quantity: 3 }] } },
  { id: 'trainer_level_300', name: 'Triple Century', description: 'Reach trainer level 300', requirement: 300, reward: { currency: 15000, levels: 15, items: [{ name: 'Standard Egg', quantity: 2 }, { name: 'Incubator', quantity: 4 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Legacy Leeway', quantity: 1 }, { name: 'Patama Berry', quantity: 3 }] } },
  { id: 'trainer_level_400', name: 'Quadruple Century', description: 'Reach trainer level 400', requirement: 400, reward: { currency: 20000, levels: 20, items: [{ name: 'Standard Egg', quantity: 2 }, { name: 'Incubator', quantity: 5 }, { name: 'Hermit\'s Ward', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Daycare Daypass', quantity: 1 }, { name: 'Azzuk Berry', quantity: 3 }] } },
  { id: 'trainer_level_500', name: 'Half Millennium', description: 'Reach trainer level 500', requirement: 500, reward: { currency: 25000, levels: 20, items: [{ name: 'Standard Egg', quantity: 3 }, { name: 'Incubator', quantity: 5 }, { name: 'Teeming Totem', quantity: 2 }, { name: 'Mutagenic Mulch', quantity: 2 }, { name: 'Legacy Leeway', quantity: 1 }, { name: 'Gold Bottle Cap', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }, { name: 'Edenweiss', quantity: 3 }] } },
  { id: 'trainer_level_1000', name: 'Millennium Trainer', description: 'Reach trainer level 1000', requirement: 1000, reward: { currency: 50000, levels: 25, items: [{ name: 'Standard Egg', quantity: 5 }, { name: 'Incubator', quantity: 6 }, { name: 'Teeming Totem', quantity: 3 }, { name: 'Mutagenic Mulch', quantity: 3 }, { name: 'Legacy Leeway', quantity: 2 }, { name: 'Gold Bottle Cap', quantity: 2 }, { name: 'Daycare Daypass', quantity: 2 }, { name: 'Scroll of Secrets', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }, { name: 'DNA Splicer', quantity: 1 }, { name: 'Edenweiss', quantity: 2 }] } },
];

const TYPE_COUNT_ACHIEVEMENTS: Record<string, AchievementDefinition[]> = {
  '1 Type': [
    { id: 'typecount1_1', name: "Purist's Pledge", description: 'Own 1 monster with exactly 1 type', requirement: 1, reward: { currency: 100 } },
    { id: 'typecount1_5', name: 'Straightforward Collector', description: 'Own 5 monsters with exactly 1 type', requirement: 5, reward: { currency: 250 } },
    { id: 'typecount1_10', name: 'One-Track Mind', description: 'Own 10 monsters with exactly 1 type', requirement: 10, reward: { currency: 500, items: [{ name: 'Lilan Berry', quantity: 2 }, { name: 'Siron Berry', quantity: 1 }] } },
    { id: 'typecount1_25', name: 'Mono-Culture', description: 'Own 25 monsters with exactly 1 type', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Lilan Berry', quantity: 3 }, { name: 'Siron Berry', quantity: 2 }, { name: 'Kham Berry', quantity: 2 }] } },
    { id: 'typecount1_50', name: 'Singular Vision', description: 'Own 50 monsters with exactly 1 type', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Fani Berry', quantity: 2 }] } },
    { id: 'typecount1_100', name: 'Absolute Purist', description: 'Own 100 monsters with exactly 1 type', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Miraca Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  '2 Types': [
    { id: 'typecount2_1', name: 'Both Sides Now', description: 'Own 1 monster with exactly 2 types', requirement: 1, reward: { currency: 100 } },
    { id: 'typecount2_5', name: 'Double Feature', description: 'Own 5 monsters with exactly 2 types', requirement: 5, reward: { currency: 250 } },
    { id: 'typecount2_10', name: 'Balanced Portfolio', description: 'Own 10 monsters with exactly 2 types', requirement: 10, reward: { currency: 500, items: [{ name: 'Addish Berry', quantity: 2 }, { name: 'Vanilla Milk', quantity: 1 }] } },
    { id: 'typecount2_25', name: "Two's Company", description: 'Own 25 monsters with exactly 2 types', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Addish Berry', quantity: 3 }, { name: 'Cocon Berry', quantity: 2 }, { name: 'Vanilla Ice Cream', quantity: 1 }] } },
    { id: 'typecount2_50', name: 'Dual Citizen', description: 'Own 50 monsters with exactly 2 types', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Addish Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'typecount2_100', name: 'Both/And', description: 'Own 100 monsters with exactly 2 types', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Addish Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  '3 Types': [
    { id: 'typecount3_1', name: 'Trifecta', description: 'Own 1 monster with exactly 3 types', requirement: 1, reward: { currency: 100 } },
    { id: 'typecount3_5', name: 'Third Wheel Collector', description: 'Own 5 monsters with exactly 3 types', requirement: 5, reward: { currency: 250 } },
    { id: 'typecount3_10', name: "Three's a Crowd", description: 'Own 10 monsters with exactly 3 types', requirement: 10, reward: { currency: 500, items: [{ name: 'Sky Carrot Berry', quantity: 2 }, { name: 'Chocolate Milk', quantity: 1 }] } },
    { id: 'typecount3_25', name: 'Tri-Curious', description: 'Own 25 monsters with exactly 3 types', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Sky Carrot Berry', quantity: 3 }, { name: 'Cocon Berry', quantity: 2 }, { name: 'Chocolate Milk', quantity: 2 }] } },
    { id: 'typecount3_50', name: 'Triple Threat', description: 'Own 50 monsters with exactly 3 types', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Sky Carrot Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'typecount3_100', name: 'The Holy Trinity', description: 'Own 100 monsters with exactly 3 types', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Sky Carrot Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  '4 Types': [
    { id: 'typecount4_1', name: 'Four Leaf Clover', description: 'Own 1 monster with exactly 4 types', requirement: 1, reward: { currency: 100 } },
    { id: 'typecount4_5', name: 'Four Corners', description: 'Own 5 monsters with exactly 4 types', requirement: 5, reward: { currency: 250 } },
    { id: 'typecount4_10', name: 'Quadrant Manager', description: 'Own 10 monsters with exactly 4 types', requirement: 10, reward: { currency: 500, items: [{ name: 'Kembre Berry', quantity: 2 }, { name: 'Strawberry Milk', quantity: 1 }] } },
    { id: 'typecount4_25', name: 'Four-Point Plan', description: 'Own 25 monsters with exactly 4 types', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Kembre Berry', quantity: 3 }, { name: 'Espara Berry', quantity: 2 }, { name: 'Strawberry Milk', quantity: 2 }] } },
    { id: 'typecount4_50', name: 'Four Seasons Fan', description: 'Own 50 monsters with exactly 4 types', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Kembre Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'typecount4_100', name: 'Four Horsemon', description: 'Own 100 monsters with exactly 4 types', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Kembre Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
  '5 Types': [
    { id: 'typecount5_1', name: 'All Elements', description: 'Own 1 monster with all 5 types', requirement: 1, reward: { currency: 100 } },
    { id: 'typecount5_5', name: 'Full Spectrum', description: 'Own 5 monsters with all 5 types', requirement: 5, reward: { currency: 250 } },
    { id: 'typecount5_10', name: 'Rainbow Court', description: 'Own 10 monsters with all 5 types', requirement: 10, reward: { currency: 500, items: [{ name: 'Espara Berry', quantity: 2 }, { name: 'MooMoo Milk', quantity: 1 }] } },
    { id: 'typecount5_25', name: 'Chaos Theory', description: 'Own 25 monsters with all 5 types', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Espara Berry', quantity: 3 }, { name: 'Kembre Berry', quantity: 2 }, { name: 'MooMoo Milk', quantity: 2 }] } },
    { id: 'typecount5_50', name: 'Type Soup', description: 'Own 50 monsters with all 5 types', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Espara Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }, { name: 'MooMoo Milk', quantity: 1 }] } },
    { id: 'typecount5_100', name: 'The Everything Monster', description: 'Own 100 monsters with all 5 types', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Espara Pastry', quantity: 1 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'MooMoo Milk', quantity: 1 }] } },
  ],
};

const FRANCHISE_ACHIEVEMENTS: Record<string, AchievementDefinition[]> = {
  Digimon: [
    { id: 'digimon_1', name: 'Fresh From the Digi-Egg', description: 'Own 1 monster with a Digimon species', requirement: 1, reward: { currency: 100 } },
    { id: 'digimon_5', name: 'Partner Potential', description: 'Own 5 monsters with a Digimon species', requirement: 5, reward: { currency: 250 } },
    { id: 'digimon_10', name: 'Rookie Squad', description: 'Own 10 monsters with a Digimon species', requirement: 10, reward: { currency: 500, items: [{ name: 'DigiMeat', quantity: 2 }, { name: 'Digital Kilobytes', quantity: 1 }] } },
    { id: 'digimon_25', name: 'Digivolution Addict', description: 'Own 25 monsters with a Digimon species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'DigiMeat', quantity: 3 }, { name: 'Digital Megabytes', quantity: 1 }, { name: 'Corruption Code', quantity: 1 }] } },
    { id: 'digimon_50', name: 'Crest Bearer', description: 'Own 50 monsters with a Digimon species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Digital Gigabytes', quantity: 1 }, { name: 'DigiMeat', quantity: 2 }] } },
    { id: 'digimon_100', name: "Sovereign's Rival", description: 'Own 100 monsters with a Digimon species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Digital Repair Mode', quantity: 1 }, { name: 'Digital Gigabytes', quantity: 1 }, { name: 'Corruption Code', quantity: 2 }] } },
  ],
  Yokai: [
    { id: 'yokai_1', name: 'Saw Something in the Corner', description: 'Own 1 monster with a Yo-kai species', requirement: 1, reward: { currency: 100 } },
    { id: 'yokai_5', name: 'Yokai Watch Owner', description: 'Own 5 monsters with a Yo-kai species', requirement: 5, reward: { currency: 250 } },
    { id: 'yokai_10', name: 'Spirit World Neighbor', description: 'Own 10 monsters with a Yo-kai species', requirement: 10, reward: { currency: 500, items: [{ name: 'E Rank Insense', quantity: 2 }, { name: 'B Rank Insense', quantity: 1 }] } },
    { id: 'yokai_25', name: 'Befriended the Locals', description: 'Own 25 monsters with a Yo-kai species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'C Rank Insense', quantity: 2 }, { name: 'Blue Color Insense', quantity: 1 }, { name: 'Green Color Insense', quantity: 1 }] } },
    { id: 'yokai_50', name: 'Honorary Yokai', description: 'Own 50 monsters with a Yo-kai species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'A Rank Insense', quantity: 1 }, { name: 'S Rank Insense', quantity: 1 }, { name: 'Incubator', quantity: 1 }] } },
    { id: 'yokai_100', name: "King Enma's Problem", description: 'Own 100 monsters with a Yo-kai species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'S Rank Insense', quantity: 2 }, { name: 'Standard Egg', quantity: 1 }, { name: 'Red Color Insense', quantity: 1 }] } },
  ],
  'Monster Hunter': [
    { id: 'monsterhunter_1', name: 'First Hunt', description: 'Own 1 monster with a Monster Hunter species', requirement: 1, reward: { currency: 100 } },
    { id: 'monsterhunter_5', name: 'Low Rank Regular', description: 'Own 5 monsters with a Monster Hunter species', requirement: 5, reward: { currency: 250 } },
    { id: 'monsterhunter_10', name: 'High Rank Hopeful', description: 'Own 10 monsters with a Monster Hunter species', requirement: 10, reward: { currency: 500, items: [{ name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Datei Berry', quantity: 2 }] } },
    { id: 'monsterhunter_25', name: 'Master Rank Material', description: 'Own 25 monsters with a Monster Hunter species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Mutagenic Mulch', quantity: 2 }, { name: 'Datei Berry', quantity: 3 }, { name: 'Patama Berry', quantity: 2 }] } },
    { id: 'monsterhunter_50', name: "Hunter's Hub Legend", description: 'Own 50 monsters with a Monster Hunter species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Mutagenic Mulch', quantity: 2 }, { name: 'Incubator', quantity: 1 }, { name: 'Bottle Cap', quantity: 2 }] } },
    { id: 'monsterhunter_100', name: "Apex Predator's Keeper", description: 'Own 100 monsters with a Monster Hunter species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 2 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Gold Bottle Cap', quantity: 1 }] } },
  ],
  Fakemon: [
    { id: 'fakemon_1', name: 'OC Do Not Steal', description: 'Own 1 monster with a Fakemon species', requirement: 1, reward: { currency: 100 } },
    { id: 'fakemon_5', name: 'Regional Variant Found', description: 'Own 5 monsters with a Fakemon species', requirement: 5, reward: { currency: 250 } },
    { id: 'fakemon_10', name: 'Fan Design Aficionado', description: 'Own 10 monsters with a Fakemon species', requirement: 10, reward: { currency: 500, items: [{ name: 'Patama Berry', quantity: 2 }, { name: 'Input Field', quantity: 1 }] } },
    { id: 'fakemon_25', name: 'DeviantArt Archive', description: 'Own 25 monsters with a Fakemon species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Patama Berry', quantity: 3 }, { name: 'Patama Pastry', quantity: 1 }, { name: 'Drop Down', quantity: 1 }] } },
    { id: 'fakemon_50', name: 'Fakemon Dex Filler', description: 'Own 50 monsters with a Fakemon species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Patama Pastry', quantity: 1 }, { name: 'Incubator', quantity: 1 }, { name: 'Radio Buttons', quantity: 1 }] } },
    { id: 'fakemon_100', name: 'Fake Champion', description: 'Own 100 monsters with a Fakemon species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Patama Pastry', quantity: 1 }, { name: 'Bluk Pastry', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Nexomon: [
    { id: 'nexomon_1', name: 'Not the Other One', description: 'Own 1 monster with a Nexomon species', requirement: 1, reward: { currency: 100 } },
    { id: 'nexomon_5', name: 'Nexotrap Enthusiast', description: 'Own 5 monsters with a Nexomon species', requirement: 5, reward: { currency: 250 } },
    { id: 'nexomon_10', name: "Tamer's Apprentice", description: 'Own 10 monsters with a Nexomon species', requirement: 10, reward: { currency: 500, items: [{ name: 'DNA Splicer', quantity: 1 }, { name: 'Vanilla Milk', quantity: 1 }] } },
    { id: 'nexomon_25', name: 'Nexomon Herder', description: 'Own 25 monsters with a Nexomon species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'DNA Splicer', quantity: 1 }, { name: 'Chocolate Milk', quantity: 1 }, { name: 'Mangus Berry', quantity: 2 }] } },
    { id: 'nexomon_50', name: 'Nexus Walker', description: 'Own 50 monsters with a Nexomon species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Incubator', quantity: 1 }, { name: 'DNA Splicer', quantity: 2 }, { name: 'Mangus Pastry', quantity: 1 }] } },
    { id: 'nexomon_100', name: 'Omni Tamer', description: 'Own 100 monsters with a Nexomon species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'DNA Splicer', quantity: 2 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  'Dragon Quest': [
    { id: 'dragonquest_1', name: 'Metal Slime Spotter', description: 'Own 1 monster with a Dragon Quest species', requirement: 1, reward: { currency: 100 } },
    { id: 'dragonquest_5', name: 'Toriyama Fan', description: 'Own 5 monsters with a Dragon Quest species', requirement: 5, reward: { currency: 250 } },
    { id: 'dragonquest_10', name: 'Dragon Quest Regular', description: 'Own 10 monsters with a Dragon Quest species', requirement: 10, reward: { currency: 500, items: [{ name: 'Dragon Nurture Kit', quantity: 1 }, { name: 'Dragon Poffin', quantity: 2 }] } },
    { id: 'dragonquest_25', name: 'Slime Sovereign', description: 'Own 25 monsters with a Dragon Quest species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Dragon Nurture Kit', quantity: 1 }, { name: 'Dragon Evolution Stone', quantity: 1 }, { name: 'Azzuk Berry', quantity: 2 }] } },
    { id: 'dragonquest_50', name: "Dragon's Den Regular", description: 'Own 50 monsters with a Dragon Quest species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Dragon Poffin', quantity: 3 }, { name: 'Incubator', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
    { id: 'dragonquest_100', name: "Hero's Rival", description: 'Own 100 monsters with a Dragon Quest species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Dragon Evolution Stone', quantity: 2 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
  ],
  Pokemon: [
    { id: 'pokemon_1', name: 'Route 1 Survivor', description: 'Own 1 monster with a Pokemon species', requirement: 1, reward: { currency: 100 } },
    { id: 'pokemon_5', name: 'Gym Challenger', description: 'Own 5 monsters with a Pokemon species', requirement: 5, reward: { currency: 250 } },
    { id: 'pokemon_10', name: 'Badge Collector', description: 'Own 10 monsters with a Pokemon species', requirement: 10, reward: { currency: 500, items: [{ name: 'Fire Poffin', quantity: 1 }, { name: 'Water Poffin', quantity: 1 }, { name: 'Grass Poffin', quantity: 1 }] } },
    { id: 'pokemon_25', name: 'Elite Four Fodder', description: 'Own 25 monsters with a Pokemon species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Normal Nurture Kit', quantity: 1 }, { name: 'Poké Puff', quantity: 2 }] } },
    { id: 'pokemon_50', name: 'Pokemon League Contender', description: 'Own 50 monsters with a Pokemon species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Fire Nurture Kit', quantity: 1 }, { name: 'Water Nurture Kit', quantity: 1 }, { name: 'Poké Puff', quantity: 2 }] } },
    { id: 'pokemon_100', name: 'Very Best Like No One Ever Was', description: 'Own 100 monsters with a Pokemon species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 2 }, { name: 'Incubator', quantity: 2 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Poké Puff', quantity: 3 }] } },
  ],
  Palworld: [
    { id: 'palworld_1', name: 'Questionable Legality', description: 'Own 1 monster with a Palworld species', requirement: 1, reward: { currency: 100 } },
    { id: 'palworld_5', name: 'Pal Ranch Hand', description: 'Own 5 monsters with a Palworld species', requirement: 5, reward: { currency: 250 } },
    { id: 'palworld_10', name: 'Wildlife Manager', description: 'Own 10 monsters with a Palworld species', requirement: 10, reward: { currency: 500, items: [{ name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
    { id: 'palworld_25', name: 'Livestock Enthusiast', description: 'Own 25 monsters with a Palworld species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
    { id: 'palworld_50', name: 'Pal Corporation Partner', description: 'Own 50 monsters with a Palworld species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Teeming Totem', quantity: 2 }, { name: 'Incubator', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }] } },
    { id: 'palworld_100', name: 'Legendary Pal Keeper', description: 'Own 100 monsters with a Palworld species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Teeming Totem', quantity: 2 }, { name: 'Mutagenic Mulch', quantity: 2 }, { name: 'Legacy Leeway', quantity: 1 }] } },
  ],
  'Final Fantasy': [
    { id: 'finalfantasy_1', name: 'Crystals in Pocket', description: 'Own 1 monster with a Final Fantasy species', requirement: 1, reward: { currency: 100 } },
    { id: 'finalfantasy_5', name: 'Party Roster', description: 'Own 5 monsters with a Final Fantasy species', requirement: 5, reward: { currency: 250 } },
    { id: 'finalfantasy_10', name: 'Turn-Based Tactician', description: 'Own 10 monsters with a Final Fantasy species', requirement: 10, reward: { currency: 500, items: [{ name: 'Psychic Nurture Kit', quantity: 1 }, { name: 'Dark Poffin', quantity: 2 }] } },
    { id: 'finalfantasy_25', name: 'Chocobo Wrangler', description: 'Own 25 monsters with a Final Fantasy species', requirement: 25, reward: { currency: 1000, levels: 5, items: [{ name: 'Psychic Evolution Stone', quantity: 1 }, { name: 'Ghost Evolution Stone', quantity: 1 }, { name: 'Ice Poffin', quantity: 2 }] } },
    { id: 'finalfantasy_50', name: 'Summon License Holder', description: 'Own 50 monsters with a Final Fantasy species', requirement: 50, reward: { currency: 2500, levels: 10, items: [{ name: 'Incubator', quantity: 1 }, { name: 'Dark Nurture Kit', quantity: 1 }, { name: 'Psychic Evolution Stone', quantity: 1 }] } },
    { id: 'finalfantasy_100', name: "Godslayer's Companion", description: 'Own 100 monsters with a Final Fantasy species', requirement: 100, reward: { currency: 5000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Ghost Evolution Stone', quantity: 2 }, { name: 'Scroll of Secrets', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }] } },
  ],
};

const SPECIAL_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'unown_26', name: 'Allegedly Literate', description: 'Own 26 Unown', requirement: 26, reward: { currency: 10000, levels: 10, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Incubator', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }] } },
  { id: 'oak_is_calling', name: 'Oak is Calling', description: 'Own 151+ unique monster species', requirement: 151, reward: { currency: 15000, levels: 15, items: [{ name: 'Standard Egg', quantity: 1 }, { name: 'Incubator', quantity: 2 }, { name: 'DNA Splicer', quantity: 1 }, { name: 'Forget-Me-Not', quantity: 1 }, { name: 'Edenweiss', quantity: 1 }] } },
  { id: 'adoption_center', name: 'Are you an Adoption Center?', description: 'Own more than 250 monsters', requirement: 251, reward: { currency: 10000, levels: 15, items: [{ name: 'Standard Egg', quantity: 2 }, { name: 'Incubator', quantity: 2 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Daycare Daypass', quantity: 1 }] } },
  { id: 'variety_the_same', name: 'Variety the Same', description: 'Own more than 5 different monsters with the same species', requirement: 6, reward: { currency: 5000, levels: 10, items: [{ name: 'Mutagenic Mulch', quantity: 1 }, { name: 'Teeming Totem', quantity: 1 }, { name: 'Legacy Leeway', quantity: 1 }, { name: 'Hermit\'s Ward', quantity: 1 }] } },
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

  static getTypeCountAchievements(): Record<string, AchievementDefinition[]> {
    return TYPE_COUNT_ACHIEVEMENTS;
  }

  static getFranchiseAchievements(): Record<string, AchievementDefinition[]> {
    return FRANCHISE_ACHIEVEMENTS;
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

    for (const typeCountAchievements of Object.values(TYPE_COUNT_ACHIEVEMENTS)) {
      ids.push(...typeCountAchievements.map((a) => a.id));
    }

    for (const franchiseAchievements of Object.values(FRANCHISE_ACHIEVEMENTS)) {
      ids.push(...franchiseAchievements.map((a) => a.id));
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
