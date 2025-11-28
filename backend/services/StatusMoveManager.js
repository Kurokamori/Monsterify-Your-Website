const BattleMonster = require('../models/BattleMonster');
const BattleLog = require('../models/BattleLog');
const StatusEffectManager = require('./StatusEffectManager');

/**
 * StatusMoveManager service for handling status moves in battle
 */
class StatusMoveManager {
  constructor() {
    // Status move categories
    this.statBuffDebuffMoves = {
      'Growl': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1 },
        message: (user, target) => `${user}'s Growl lowered ${target}'s Attack!`
      },
      'Double Team': {
        type: 'stat_buff',
        target: 'self',
        stats: { evasion: 1 },
        message: (user, target) => `${user} used Double Team! ${user}'s evasiveness rose!`
      },
      'Screech': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { defense: -2 },
        message: (user, target) => `${user}'s Screech harshly lowered ${target}'s Defense!`
      },
      'Sand Attack': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { accuracy: -1 },
        message: (user, target) => `${user} kicked up sand! ${target}'s accuracy fell!`
      },
      // Bug-type stat moves
      'Tail Glow': {
        type: 'stat_buff',
        target: 'self',
        stats: { special_attack: 3 },
        message: (user, target) => `${user} used Tail Glow! ${user}'s Special Attack rose drastically!`
      },
      'String Shot': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { speed: -2 },
        message: (user, target) => `${user} used String Shot! ${target}'s Speed harshly fell!`
      },
      'Quiver Dance': {
        type: 'stat_buff',
        target: 'self',
        stats: { special_attack: 1, special_defense: 1, speed: 1 },
        message: (user, target) => `${user} used Quiver Dance! ${user}'s Special Attack, Special Defense, and Speed rose!`
      },
      'Defend Order': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 1, special_defense: 1 },
        message: (user, target) => `${user} used Defend Order! ${user}'s Defense and Special Defense rose!`
      },
      // Dark-type stat moves
      'Nasty Plot': {
        type: 'stat_buff',
        target: 'self',
        stats: { special_attack: 2 },
        message: (user, target) => `${user} used Nasty Plot! ${user}'s Special Attack rose sharply!`
      },
      'Hone Claws': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, accuracy: 1 },
        message: (user, target) => `${user} used Hone Claws! ${user}'s Attack and accuracy rose!`
      },
      'Fake Tears': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { special_defense: -2 },
        message: (user, target) => `${user} used Fake Tears! ${target}'s Special Defense harshly fell!`
      },
      'Flatter': {
        type: 'stat_buff_confuse',
        target: 'opponent',
        stats: { special_attack: 1 },
        statusEffect: 'confusion',
        duration: 3,
        message: (user, target) => `${user} used Flatter! ${target}'s Special Attack rose, but ${target} became confused!`
      },
      'Parting Shot': {
        type: 'stat_debuff_switch',
        target: 'opponent',
        stats: { attack: -1, special_attack: -1 },
        switchOut: true,
        message: (user, target) => `${user} used Parting Shot! ${target}'s Attack and Special Attack fell! ${user} switched out!`
      },
      // Dragon-type stat moves
      'Dragon Dance': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, speed: 1 },
        message: (user, target) => `${user} used Dragon Dance! ${user}'s Attack and Speed rose!`
      },
      'Clangorous Soul': {
        type: 'stat_buff_hp_cost',
        target: 'self',
        stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
        hpCost: 0.33, // 33% of max HP
        message: (user, target) => `${user} used Clangorous Soul! ${user} lost some HP and all stats rose!`
      },
      // Electric-type stat moves
      'Eerie Impulse': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { special_attack: -2 },
        message: (user, target) => `${user} used Eerie Impulse! ${target}'s Special Attack harshly fell!`
      },
      // Fairy-type stat moves
      'Charm': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -2 },
        message: (user, target) => `${user} used Charm! ${target}'s Attack harshly fell!`
      },
      'Baby-Doll Eyes': {
        type: 'stat_debuff_priority',
        target: 'opponent',
        stats: { attack: -1 },
        priority: 1,
        message: (user, target) => `${user} used Baby-Doll Eyes! ${target}'s Attack fell!`
      },
      'Decorate': {
        type: 'ally_stat_buff',
        target: 'ally',
        stats: { attack: 2, special_attack: 2 },
        message: (user, target) => `${user} used Decorate! ${target}'s Attack and Special Attack rose sharply!`
      },
      'Aromatic Mist': {
        type: 'ally_stat_buff',
        target: 'ally',
        stats: { special_defense: 1 },
        message: (user, target) => `${user} used Aromatic Mist! ${target}'s Special Defense rose!`
      },
      'Flower Shield': {
        type: 'type_specific_buff',
        target: 'allies',
        stats: { defense: 1 },
        typeRestriction: ['Grass'],
        message: (user, target) => `${user} used Flower Shield! Grass-type Pokémon's Defense rose!`
      },
      'Geomancy': {
        type: 'charge_stat_buff',
        target: 'self',
        stats: { special_attack: 2, special_defense: 2, speed: 2 },
        chargeTurn: true,
        message: (user, target) => `${user} is absorbing power from the earth! ${user}'s Special Attack, Special Defense, and Speed rose sharply!`
      },
      // Fighting-type stat moves
      'Bulk Up': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, defense: 1 },
        message: (user, target) => `${user} used Bulk Up! ${user}'s Attack and Defense rose!`
      },
      'Victory Dance': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
        message: (user, target) => `${user} used Victory Dance! All of ${user}'s stats rose!`
      },
      'No Retreat': {
        type: 'stat_buff_trap_self',
        target: 'self',
        stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
        trapSelf: true,
        message: (user, target) => `${user} used No Retreat! All of ${user}'s stats rose, but ${user} can no longer escape!`
      },
      'Coaching': {
        type: 'ally_stat_buff',
        target: 'ally',
        stats: { attack: 1, defense: 1 },
        message: (user, target) => `${user} used Coaching! ${target}'s Attack and Defense rose!`
      },
      'Octolock': {
        type: 'trap_debuff',
        target: 'opponent',
        trapTarget: true,
        stats: { defense: -1, special_defense: -1 },
        duration: 5,
        message: (user, target) => `${user} used Octolock! ${target} is trapped and its Defense and Special Defense fell!`
      },
      // Flying-type stat moves
      'Feather Dance': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -2 },
        message: (user, target) => `${user} used Feather Dance! ${target}'s Attack harshly fell!`
      },
      // Ghost-type stat moves
      'Curse': {
        type: 'curse_conditional',
        target: 'variable', // Depends on user's type
        ghostEffect: {
          type: 'curse_ghost',
          hpCost: 0.5,
          statusEffect: 'curse',
          duration: -1 // Until target faints
        },
        nonGhostEffect: {
          type: 'stat_mixed',
          stats: { attack: 1, defense: 1, speed: -1 }
        },
        message: (user, target, isGhost) => isGhost 
          ? `${user} used Curse! ${user} cut its own HP and laid a curse on ${target}!`
          : `${user} used Curse! ${user}'s Attack and Defense rose, but Speed fell!`
      },
      // Grass-type stat moves
      'Cotton Guard': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 3 },
        message: (user, target) => `${user} used Cotton Guard! ${user}'s Defense rose drastically!`
      },
      'Spicy Extract': {
        type: 'stat_mixed_opponent',
        target: 'opponent',
        stats: { attack: -2, special_attack: 2 },
        message: (user, target) => `${user} used Spicy Extract! ${target}'s Attack harshly fell, but Special Attack rose sharply!`
      },
      'Cotton Spore': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { speed: -2 },
        message: (user, target) => `${user} used Cotton Spore! ${target}'s Speed harshly fell!`
      },
      'Strength Sap': {
        type: 'stat_debuff_heal',
        target: 'opponent',
        stats: { attack: -1 },
        healBased: 'opponent_attack',
        message: (user, target) => `${user} used Strength Sap! ${target}'s Attack fell and ${user} recovered HP!`
      },
      // Ground-type stat moves
      'Rototiller': {
        type: 'type_specific_buff',
        target: 'field',
        stats: { attack: 1, special_attack: 1 },
        typeRestriction: ['Grass'],
        message: (user, target) => `${user} used Rototiller! Grass-type Pokémon's Attack and Special Attack rose!`
      },
      // Ice-type stat moves
      'Haze': {
        type: 'stat_reset',
        target: 'field',
        resetAllStats: true,
        message: (user, target) => `${user} used Haze! All stat changes were eliminated!`
      },
      // Normal-type stat moves
      'Tail Whip': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { defense: -1 },
        message: (user, target) => `${user} used Tail Whip! ${target}'s Defense fell!`
      },
      'Shell Smash': {
        type: 'stat_mixed_self',
        target: 'self',
        stats: { defense: -1, special_defense: -1, attack: 2, special_attack: 2, speed: 2 },
        message: (user, target) => `${user} used Shell Smash! ${user}'s Defense and Special Defense fell, but Attack, Special Attack, and Speed rose sharply!`
      },
      'Fillet Away': {
        type: 'stat_buff_hp_cost',
        target: 'self',
        stats: { attack: 2, special_attack: 2, speed: 2 },
        hpCost: 0.5, // 50% of max HP
        message: (user, target) => `${user} used Fillet Away! ${user} lost half its HP, but Attack, Special Attack, and Speed rose sharply!`
      },
      'Power Shift': {
        type: 'stat_swap',
        target: 'self',
        swapStats: ['attack', 'defense'],
        message: (user, target) => `${user} used Power Shift! ${user} swapped its Attack and Defense stats!`
      },
      'Howl': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1 },
        message: (user, target) => `${user} used Howl! ${user}'s Attack rose!`
      },
      'Sharpen': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1 },
        message: (user, target) => `${user} used Sharpen! ${user}'s Attack rose!`
      },
      'Stockpile': {
        type: 'stat_buff_stockpile',
        target: 'self',
        stats: { defense: 1, special_defense: 1 },
        maxStacks: 3,
        message: (user, target) => `${user} used Stockpile! ${user} stockpiled power and raised its defenses!`
      },
      'Sweet Scent': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { evasion: -2 },
        message: (user, target) => `${user} used Sweet Scent! ${target}'s evasion harshly fell!`
      },
      'Smokescreen': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { accuracy: -1 },
        message: (user, target) => `${user} used Smokescreen! ${target}'s accuracy fell!`
      },
      'Swords Dance': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 2 },
        message: (user, target) => `${user} used Swords Dance! ${user}'s Attack rose sharply!`
      },
      'Double Team': {
        type: 'stat_buff',
        target: 'self',
        stats: { evasion: 1 },
        message: (user, target) => `${user} used Double Team! ${user}'s evasion rose!`
      },
      'Captivate': {
        type: 'stat_debuff_gender',
        target: 'opponent',
        stats: { special_attack: -2 },
        requiresOppositeGender: true,
        message: (user, target) => `${user} used Captivate! ${target}'s Special Attack harshly fell!`
      },
      'Defense Curl': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 1 },
        rolloutBoost: true, // Doubles Rollout power
        message: (user, target) => `${user} used Defense Curl! ${user}'s Defense rose!`
      },
      'Work Up': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, special_attack: 1 },
        message: (user, target) => `${user} used Work Up! ${user}'s Attack and Special Attack rose!`
      },
      'Acupressure': {
        type: 'stat_buff_random',
        target: 'self',
        randomStatBoost: 2, // +2 to random stat
        possibleStats: ['attack', 'defense', 'special_attack', 'special_defense', 'speed', 'accuracy', 'evasion'],
        message: (user, target, stat) => `${user} used Acupressure! ${user}'s ${stat} rose sharply!`
      },
      'Stuff Cheeks': {
        type: 'stat_buff_consume_berry',
        target: 'self',
        stats: { defense: 2 },
        requiresBerry: true,
        consumeBerry: true,
        message: (user, target) => `${user} used Stuff Cheeks! ${user} ate its berry and its Defense rose sharply!`
      },
      'Swagger': {
        type: 'stat_buff_confuse',
        target: 'opponent',
        stats: { attack: 2 },
        statusEffect: 'confusion',
        duration: 3,
        message: (user, target) => `${user} used Swagger! ${target}'s Attack rose sharply, but it became confused!`
      },
      'Leer': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { defense: -1 },
        message: (user, target) => `${user} used Leer! ${target}'s Defense fell!`
      },
      'Psych Up': {
        type: 'stat_copy',
        target: 'opponent',
        copyAllStatChanges: true,
        message: (user, target) => `${user} used Psych Up and copied ${target}'s stat changes!`
      },
      'Confide': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { special_attack: -1 },
        message: (user, target) => `${user} used Confide! ${target}'s Special Attack fell!`
      },
      'Harden': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 1 },
        message: (user, target) => `${user} used Harden! ${user}'s Defense rose!`
      },
      'Minimize': {
        type: 'stat_buff',
        target: 'self',
        stats: { evasion: 2 },
        vulnerableToStomp: true, // Takes double damage from Stomp, Body Slam, etc.
        message: (user, target) => `${user} used Minimize! ${user}'s evasion rose sharply!`
      },
      'Tickle': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1, defense: -1 },
        message: (user, target) => `${user} used Tickle! ${target}'s Attack and Defense fell!`
      },
      'Extreme Evoboost': {
        type: 'stat_buff_all',
        target: 'self',
        stats: { attack: 2, defense: 2, special_attack: 2, special_defense: 2, speed: 2 },
        zMoveOnly: true,
        message: (user, target) => `${user} used Extreme Evoboost! All of ${user}'s stats rose drastically!`
      },
      'Tearful Look': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1, special_attack: -1 },
        message: (user, target) => `${user} used Tearful Look! ${target}'s Attack and Special Attack fell!`
      },
      'Growl': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1 },
        message: (user, target) => `${user} used Growl! ${target}'s Attack fell!`
      },
      'Play Nice': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1 },
        message: (user, target) => `${user} used Play Nice! ${target}'s Attack fell!`
      },
      'Scary Face': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { speed: -2 },
        message: (user, target) => `${user} used Scary Face! ${target}'s Speed harshly fell!`
      },
      'Growth': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, special_attack: 1 },
        message: (user, target) => `${user} used Growth! ${user}'s Attack and Special Attack rose!`
      },
      'Focus Energy': {
        type: 'critical_buff',
        target: 'self',
        effect: 'focus_energy',
        duration: 5,
        message: (user, target) => `${user} used Focus Energy! ${user} is getting pumped!`
      },
      'Flash': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { accuracy: -1 },
        message: (user, target) => `${user} used Flash! ${target}'s accuracy fell!`
      },
      'Noble Roar': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { attack: -1, special_attack: -1 },
        message: (user, target) => `${user} used Noble Roar! ${target}'s Attack and Special Attack fell!`
      },
      'Belly Drum': {
        type: 'stat_buff_max_hp_cost',
        target: 'self',
        stats: { attack: 6 }, // Maximize Attack (set to +6)
        hpCost: 0.5, // 50% of max HP
        message: (user, target) => `${user} used Belly Drum! ${user} cut its HP in half and maximized its Attack!`
      },
      'Venom Drench': {
        type: 'conditional_stat_debuff',
        target: 'opponent',
        stats: { attack: -1, special_attack: -1, speed: -1 },
        condition: 'poison',
        message: (user, target) => `${user} used Venom Drench! ${target}'s Attack, Special Attack, and Speed fell!`
      },
      'Coil': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1, defense: 1, accuracy: 1 },
        message: (user, target) => `${user} used Coil! ${user}'s Attack, Defense, and accuracy rose!`
      },
      'Acid Armor': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 2 },
        message: (user, target) => `${user} used Acid Armor! ${user}'s Defense rose sharply!`
      },
      'Amnesia': {
        type: 'stat_buff',
        target: 'self',
        stats: { special_defense: 2 },
        message: (user, target) => `${user} used Amnesia! ${user}'s Special Defense rose sharply!`
      },
      'Toxic Thread': {
        type: 'stat_debuff_status',
        target: 'opponent',
        stats: { speed: -1 },
        statusEffect: 'poison',
        duration: 4,
        message: (user, target) => `${user} used Toxic Thread! ${target}'s Speed fell and ${target} was poisoned!`
      },
      'Heart Swap': {
        type: 'stat_swap_all',
        target: 'opponent',
        swapAllStatChanges: true,
        message: (user, target) => `${user} used Heart Swap! ${user} and ${target} switched all stat changes!`
      },
      // Psychic-type stat moves
      'Kinesis': {
        type: 'stat_debuff',
        target: 'opponent',
        stats: { accuracy: -1 },
        message: (user, target) => `${user} used Kinesis! ${target}'s accuracy fell!`
      },
      'Calm Mind': {
        type: 'stat_buff',
        target: 'self',
        stats: { special_attack: 1, special_defense: 1 },
        message: (user, target) => `${user} used Calm Mind! ${user}'s Special Attack and Special Defense rose!`
      },
      'Barrier': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 2 },
        message: (user, target) => `${user} used Barrier! ${user}'s Defense rose sharply!`
      },
      'Meditate': {
        type: 'stat_buff',
        target: 'self',
        stats: { attack: 1 },
        message: (user, target) => `${user} used Meditate! ${user}'s Attack rose!`
      },
      'Speed Swap': {
        type: 'stat_swap_specific',
        target: 'opponent',
        swapStats: ['speed'],
        message: (user, target) => `${user} used Speed Swap! ${user} and ${target} switched Speed stats!`
      },
      'Power Swap': {
        type: 'stat_swap_specific',
        target: 'opponent',
        swapStats: ['attack', 'special_attack'],
        message: (user, target) => `${user} used Power Swap! ${user} and ${target} switched Attack and Special Attack stats!`
      },
      // Additional Psychic-type stat moves  
      'Agility': {
        type: 'stat_buff',
        target: 'self',
        stats: { speed: 2 },
        message: (user, target) => `${user} used Agility! ${user}'s Speed rose sharply!`
      },
      'Power Trick': {
        type: 'stat_swap_self',
        target: 'self',
        swapStats: ['attack', 'defense'],
        message: (user, target) => `${user} used Power Trick! ${user} swapped its Attack and Defense stats!`
      },
      'Guard Split': {
        type: 'stat_average',
        target: 'opponent',
        averageStats: ['defense', 'special_defense'],
        message: (user, target) => `${user} used Guard Split! ${user} and ${target} shared their Defense and Special Defense!`
      },
      'Take Heart': {
        type: 'stat_buff_clear_debuffs',
        target: 'self',
        stats: { special_attack: 1, special_defense: 1 },
        clearNegativeStats: true,
        message: (user, target) => `${user} used Take Heart! Negative stat changes were removed and Special Attack and Special Defense rose!`
      },
      
      // Third set of stat-based moves
      'Guard Swap': {
        type: 'stat_swap_specific',
        target: 'opponent',
        swapStats: ['defense', 'special_defense'],
        message: (user, target) => `${user} used Guard Swap! ${user} and ${target} swapped their Defense and Special Defense stats!`
      },
      'Power Split': {
        type: 'stat_average',
        target: 'opponent',
        averageStats: ['attack', 'special_attack'],
        message: (user, target) => `${user} used Power Split! ${user} and ${target} shared their Attack and Special Attack!`
      },
      'Cosmic Power': {
        type: 'stat_buff',
        target: 'self',
        stats: { defense: 1, special_defense: 1 },
        message: (user, target) => `${user} used Cosmic Power! ${user}'s Defense and Special Defense rose!`
      },
      'Rock Polish': {
        type: 'stat_buff',
        target: 'self',
        stats: { speed: 2 },
        message: (user, target) => `${user} used Rock Polish! ${user}'s Speed rose sharply!`
      }
      // More moves will be added here later
    };

    this.statusAfflictionMoves = {
      'Toxic': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'poison',
        duration: 5, // Toxic lasts longer than regular poison
        message: (user, target) => `${user} used Toxic! ${target} was badly poisoned!`
      },
      // Dark-type status affliction moves
      'Dark Void': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        message: (user, target) => `${user} used Dark Void! ${target} fell into a deep sleep!`
      },
      // Electric-type status affliction moves
      'Thunder Wave': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'paralysis',
        duration: 4,
        message: (user, target) => `${user} used Thunder Wave! ${target} is paralyzed and may not be able to attack!`
      },
      // Fairy-type status affliction moves
      'Sweet Kiss': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'confusion',
        duration: 3,
        message: (user, target) => `${user} used Sweet Kiss! ${target} became confused!`
      },
      // Fire-type status affliction moves
      'Will-O-Wisp': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'burn',
        duration: 4,
        message: (user, target) => `${user} used Will-O-Wisp! ${target} was burned!`
      },
      // Ghost-type status affliction moves
      'Confuse Ray': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'confusion',
        duration: 3,
        message: (user, target) => `${user} used Confuse Ray! ${target} became confused!`
      },
      'Nightmare': {
        type: 'conditional_status',
        target: 'opponent',
        statusEffect: 'nightmare',
        duration: -1, // Lasts while sleeping
        condition: 'sleeping',
        message: (user, target) => `${user} used Nightmare! ${target} fell into a nightmare!`
      },
      // Grass-type status affliction moves
      'Sleep Powder': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        message: (user, target) => `${user} used Sleep Powder! ${target} fell asleep!`
      },
      'Spore': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        accuracy: 100, // Spore never misses
        message: (user, target) => `${user} used Spore! ${target} fell asleep!`
      },
      'Grass Whistle': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        message: (user, target) => `${user} used Grass Whistle! ${target} fell asleep!`
      },
      'Stun Spore': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'paralysis',
        duration: 4,
        message: (user, target) => `${user} used Stun Spore! ${target} is paralyzed and may not be able to attack!`
      },
      // Normal-type status affliction moves
      'Sing': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        message: (user, target) => `${user} used Sing! ${target} fell asleep to the soothing melody!`
      },
      'Yawn': {
        type: 'delayed_status',
        target: 'opponent',
        statusEffect: 'sleep',
        delay: 1, // Takes effect next turn
        duration: 3,
        message: (user, target) => `${user} used Yawn! ${target} grew drowsy and will fall asleep next turn!`
      },
      'Supersonic': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'confusion',
        duration: 3,
        message: (user, target) => `${user} used Supersonic! ${target} became confused!`
      },
      'Lovely Kiss': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        message: (user, target) => `${user} used Lovely Kiss! ${target} fell asleep!`
      },
      'Attract': {
        type: 'status_affliction_gender',
        target: 'opponent',
        statusEffect: 'infatuation',
        duration: -1, // Lasts until one switches out
        requiresOppositeGender: true,
        message: (user, target) => `${user} used Attract! ${target} fell in love!`
      },
      'Teeter Dance': {
        type: 'status_affliction_all',
        target: 'all',
        statusEffect: 'confusion',
        duration: 3,
        includesSelf: true, // Affects all Pokemon including user
        message: (user) => `${user} used Teeter Dance! All Pokemon became confused!`
      },
      'Glare': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'paralysis',
        duration: 4,
        message: (user, target) => `${user} used Glare! ${target} is paralyzed and may not be able to attack!`
      },
      'Poison Powder': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'poison',
        duration: 4,
        message: (user, target) => `${user} used Poison Powder! ${target} was poisoned!`
      },
      'Poison Gas': {
        type: 'status_affliction_adjacent',
        target: 'adjacent_opponents',
        statusEffect: 'poison',
        duration: 4,
        affectsAdjacent: true,
        message: (user, targets) => `${user} used Poison Gas! Adjacent opponents were poisoned!`
      },
      // Additional Psychic-type status affliction moves
      'Hypnosis': {
        type: 'status_affliction',
        target: 'opponent',
        statusEffect: 'sleep',
        duration: 3,
        accuracy: 60, // Lower accuracy than other sleep moves
        message: (user, target) => `${user} used Hypnosis! ${target} fell into a deep sleep!`
      },
      'Psycho Shift': {
        type: 'status_transfer',
        target: 'opponent',
        transferOwnStatus: true,
        curesSelf: true,
        message: (user, target) => `${user} used Psycho Shift! ${user} transferred its status condition to ${target}!`
      }
      // More moves will be added here later
    };

    this.healingMoves = {
      'Synthesis': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Synthesis and restored its health!`
      },
      'Milk Drink': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Milk Drink and restored its health!`
      },
      // Bug-type healing moves
      'Heal Order': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Heal Order and restored its health!`
      },
      // Fairy-type healing moves
      'Moonlight': {
        type: 'healing_weather',
        target: 'self',
        healAmount: (monster, weather) => {
          // Heal varies by weather: 66% in sun, 25% in rain/sand/hail, 50% normally
          let healPercent = 0.5;
          if (weather === 'sunny') healPercent = 0.66;
          else if (['rain', 'sandstorm', 'hail'].includes(weather)) healPercent = 0.25;
          return Math.floor(monster.max_hp * healPercent);
        },
        message: (user) => `${user} used Moonlight and restored its health!`
      },
      'Floral Healing': {
        type: 'healing_terrain',
        target: 'ally',
        healAmount: (monster, terrain) => {
          // Heal 50% normally, 66% on Grassy Terrain
          let healPercent = terrain === 'grassy_terrain' ? 0.66 : 0.5;
          return Math.floor(monster.max_hp * healPercent);
        },
        message: (user, target) => `${user} used Floral Healing! ${target} restored its health!`
      },
      // Flying-type healing moves
      'Roost': {
        type: 'healing_type_change',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        loseFlying: true,
        duration: 1, // Lose Flying type for 1 turn
        message: (user) => `${user} used Roost and restored its health! ${user} lost its Flying type temporarily!`
      },
      // Grass-type healing moves
      'Jungle Healing': {
        type: 'team_healing_status_cure',
        target: 'team',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.25), // Heal 25% of max HP
        cureStatus: true,
        message: (user) => `${user} used Jungle Healing! The team recovered HP and was cured of status conditions!`
      },
      // Ground-type healing moves
      'Shore Up': {
        type: 'healing_weather',
        target: 'self',
        healAmount: (monster, weather) => {
          // Heal varies by weather: 66% in sandstorm, 50% normally, 25% in rain/hail
          let healPercent = 0.5;
          if (weather === 'sandstorm') healPercent = 0.66;
          else if (['rain', 'hail', 'snow'].includes(weather)) healPercent = 0.25;
          return Math.floor(monster.max_hp * healPercent);
        },
        message: (user) => `${user} used Shore Up and restored its health!`
      },
      // Normal-type healing moves
      'Wish': {
        type: 'delayed_healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        delay: 2, // Heals after 2 turns
        message: (user) => `${user} used Wish! A wish will come true in 2 turns!`
      },
      'Refresh': {
        type: 'status_cure',
        target: 'self',
        healAmount: () => 0, // No HP healing, only status cure
        cureStatus: true,
        message: (user) => `${user} used Refresh and cured all status conditions!`
      },
      'Milk Drink': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Milk Drink and restored its health!`
      },
      'Swallow': {
        type: 'healing_stockpile',
        target: 'self',
        healAmount: (monster, stacks) => {
          // Heal based on Stockpile stacks: 25%, 50%, 100%
          const healPercent = stacks === 1 ? 0.25 : stacks === 2 ? 0.5 : 1.0;
          return Math.floor(monster.max_hp * healPercent);
        },
        consumeStockpile: true,
        message: (user, stacks) => `${user} used Swallow and consumed ${stacks} Stockpile${stacks > 1 ? 's' : ''}!`
      },
      'Recover': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Recover and restored its health!`
      },
      'Heal Bell': {
        type: 'team_status_cure',
        target: 'team',
        healAmount: () => 0, // No HP healing, only status cure
        cureAllTeamStatus: true,
        message: (user) => `${user} used Heal Bell! The team was cured of all status conditions!`
      },
      'Soft-Boiled': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Soft-Boiled and restored its health!`
      },
      'Morning Sun': {
        type: 'healing_weather',
        target: 'self',
        healAmount: (monster, weather) => {
          // Heal varies by weather: 66% in sun, 50% normally, 25% in rain/hail/sandstorm
          let healPercent = 0.5;
          if (weather === 'sun') healPercent = 0.66;
          else if (['rain', 'hail', 'sandstorm', 'snow'].includes(weather)) healPercent = 0.25;
          return Math.floor(monster.max_hp * healPercent);
        },
        message: (user) => `${user} used Morning Sun and restored its health with the power of sunlight!`
      },
      'Slack Off': {
        type: 'healing',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user) => `${user} used Slack Off and restored its health!`
      },
      'Purify': {
        type: 'healing_cure_status',
        target: 'opponent',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        cureStatus: true,
        healSelf: true, // Also heals user when curing status
        message: (user, target) => `${user} used Purify! ${target} was cured and restored health!`
      },
      'Heal Pulse': {
        type: 'healing_target',
        target: 'ally',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.5), // Heal 50% of max HP
        message: (user, target) => `${user} used Heal Pulse! ${target} recovered health!`
      },
      // Special sacrifice healing moves
      'Lunar Dance': {
        type: 'sacrifice_heal',
        target: 'self',
        healAmount: (monster) => monster.max_hp, // Full heal
        sacrifice: true,
        message: (user, target) => `${user} used Lunar Dance! ${user} fainted to restore the next Pokémon to full health!`
      },
      'Healing Wish': {
        type: 'sacrifice_heal',
        target: 'self',
        healAmount: (monster) => monster.max_hp, // Full heal
        sacrifice: true,
        cureStatus: true,
        message: (user, target) => `${user} used Healing Wish! ${user} fainted to restore the next Pokémon to full health and cure its status!`
      },
      'Rest': {
        type: 'healing_sleep',
        target: 'self',
        healAmount: (monster) => monster.max_hp, // Full heal
        statusEffect: 'sleep',
        duration: 2,
        message: (user) => `${user} used Rest! ${user} restored its health and fell asleep!`
      },
      // Additional Psychic-type healing moves
      'Lunar Blessing': {
        type: 'healing_user_and_ally',
        target: 'self',
        healAmount: (monster) => Math.floor(monster.max_hp * 0.25), // Heal 25% of max HP
        healAlly: true,
        cureStatus: true,
        message: (user) => `${user} used Lunar Blessing! ${user} and its ally were healed and cured of status conditions!`
      }
      // More moves will be added here later
    };

    this.otherMoves = {
      'Psychic Terrain': {
        type: 'terrain',
        target: 'field',
        effect: 'psychic_terrain',
        duration: 5,
        message: (user) => `${user} used Psychic Terrain! The battlefield became weird!`
      },
      'Splash': {
        type: 'no_effect',
        target: 'self',
        effect: 'nothing',
        message: (user) => `${user} used Splash! But nothing happened!`
      },
      // Bug-type special moves
      'Spider Web': {
        type: 'trap',
        target: 'opponent',
        effect: 'trapped',
        duration: 5,
        message: (user) => `${user} used Spider Web! The opponent is trapped and cannot escape!`
      },
      'Powder': {
        type: 'powder',
        target: 'opponent',
        effect: 'powder_protection',
        duration: 1,
        message: (user) => `${user} used Powder! If hit by a Fire-type move, the attacker will take damage!`
      },
      'Rage Powder': {
        type: 'redirect',
        target: 'self',
        effect: 'attention_focus',
        duration: 1,
        message: (user) => `${user} used Rage Powder! ${user} became the center of attention!`
      },
      'Silk Trap': {
        type: 'protection_debuff',
        target: 'self',
        effect: 'silk_protection',
        duration: 1,
        speedDebuff: -1,
        message: (user) => `${user} used Silk Trap! ${user} is protected and will lower the attacker's Speed!`
      },
      'Sticky Web': {
        type: 'entry_hazard',
        target: 'field',
        effect: 'sticky_web',
        duration: -1, // Permanent until removed
        message: (user) => `${user} used Sticky Web! A sticky web was laid around the opposing team!`
      },
      // Dark-type special moves
      'Embargo': {
        type: 'disable_items',
        target: 'opponent',
        effect: 'embargo',
        duration: 5,
        message: (user) => `${user} used Embargo! The opponent cannot use items!`
      },
      'Torment': {
        type: 'disable_repeat',
        target: 'opponent',
        effect: 'torment',
        duration: 5,
        message: (user) => `${user} used Torment! The opponent cannot use the same move twice!`
      },
      'Memento': {
        type: 'sacrifice_debuff',
        target: 'opponent',
        effect: 'memento',
        stats: { attack: -2, special_attack: -2 },
        sacrifice: true,
        message: (user) => `${user} used Memento! ${user} fainted! The opponent's Attack and Special Attack harshly fell!`
      },
      'Obstruct': {
        type: 'protection_debuff',
        target: 'self',
        effect: 'obstruct_protection',
        duration: 1,
        defenseDebuff: -2,
        message: (user) => `${user} used Obstruct! ${user} is protected and will harshly lower the attacker's Defense!`
      },
      'Switcheroo': {
        type: 'swap_items',
        target: 'opponent',
        effect: 'item_swap',
        message: (user) => `${user} used Switcheroo! ${user} swapped items with the opponent!`
      },
      'Snatch': {
        type: 'steal_move',
        target: 'self',
        effect: 'snatch',
        duration: 1,
        message: (user) => `${user} used Snatch! ${user} will steal the next status move!`
      },
      'Quash': {
        type: 'priority_control',
        target: 'opponent',
        effect: 'quash',
        duration: 1,
        message: (user) => `${user} used Quash! The opponent will move last this turn!`
      },
      'Topsy Turvy': {
        type: 'reverse_stats',
        target: 'opponent',
        effect: 'stat_reversal',
        message: (user) => `${user} used Topsy Turvy! All stat changes on the opponent were reversed!`
      },
      'Taunt': {
        type: 'disable_status',
        target: 'opponent',
        effect: 'taunt',
        duration: 3,
        message: (user) => `${user} used Taunt! The opponent cannot use status moves!`
      },
      // Dragon-type special moves
      'Dragon Cheer': {
        type: 'critical_boost',
        target: 'ally',
        effect: 'critical_boost',
        duration: 5,
        message: (user) => `${user} used Dragon Cheer! Allies' critical hit ratio increased!`
      },
      // Electric-type special moves
      'Electric Terrain': {
        type: 'terrain',
        target: 'field',
        effect: 'electric_terrain',
        duration: 5,
        message: (user) => `${user} used Electric Terrain! The battlefield became electrified!`
      },
      'Charge': {
        type: 'charge_up',
        target: 'self',
        effect: 'charge',
        duration: 1,
        message: (user) => `${user} used Charge! ${user} began charging power and raised Special Defense!`
      },
      'Electrify': {
        type: 'type_change',
        target: 'opponent',
        effect: 'electrify',
        duration: 1,
        changeType: 'Electric',
        message: (user) => `${user} used Electrify! The opponent's next move will become Electric-type!`
      },
      'Magnetic Flux': {
        type: 'ally_boost',
        target: 'allies',
        effect: 'magnetic_flux',
        stats: { defense: 1, special_defense: 1 },
        typeRestriction: ['Steel', 'Electric'],
        message: (user) => `${user} used Magnetic Flux! Steel and Electric allies' Defense and Special Defense rose!`
      },
      'Ion Deluge': {
        type: 'move_type_change',
        target: 'field',
        effect: 'ion_deluge',
        duration: 1,
        changeFrom: 'Normal',
        changeTo: 'Electric',
        message: (user) => `${user} used Ion Deluge! Normal-type moves will become Electric-type this turn!`
      },
      'Magnet Rise': {
        type: 'levitate',
        target: 'self',
        effect: 'magnet_rise',
        duration: 5,
        message: (user) => `${user} used Magnet Rise! ${user} levitated with electromagnetism!`
      },
      // Fairy-type special moves
      'Misty Terrain': {
        type: 'terrain',
        target: 'field',
        effect: 'misty_terrain',
        duration: 5,
        message: (user) => `${user} used Misty Terrain! The battlefield became misty!`
      },
      'Crafty Shield': {
        type: 'team_protection',
        target: 'team',
        effect: 'crafty_shield',
        duration: 1,
        protectFrom: 'status_moves',
        message: (user) => `${user} used Crafty Shield! The team is protected from status moves!`
      },
      'Fairy Lock': {
        type: 'field_lock',
        target: 'field',
        effect: 'fairy_lock',
        duration: 1,
        preventSwitching: true,
        message: (user) => `${user} used Fairy Lock! No one can escape now!`
      },
      // Fighting-type special moves
      'Quick Guard': {
        type: 'team_protection',
        target: 'team',
        effect: 'quick_guard',
        duration: 1,
        protectFrom: 'priority_moves',
        message: (user) => `${user} used Quick Guard! The team is protected from priority moves!`
      },
      'Detect': {
        type: 'protection',
        target: 'self',
        effect: 'detect',
        duration: 1,
        protection: true,
        message: (user) => `${user} used Detect! ${user} is protected from attacks!`
      },
      'Mat Block': {
        type: 'team_protection_first_turn',
        target: 'team',
        effect: 'mat_block',
        duration: 1,
        protectFrom: 'damaging_moves',
        firstTurnOnly: true,
        message: (user) => `${user} used Mat Block! The team is protected from damaging moves!`
      },
      // Fire-type special moves
      'Burning Bulwark': {
        type: 'protection_burn',
        target: 'self',
        effect: 'burning_bulwark',
        duration: 1,
        protection: true,
        contactEffect: { statusEffect: 'burn', duration: 4 },
        message: (user) => `${user} used Burning Bulwark! ${user} is protected and will burn attackers on contact!`
      },
      'Sunny Day': {
        type: 'weather',
        target: 'field',
        effect: 'sunny_day',
        duration: 5,
        weather: 'sunny',
        message: (user) => `${user} used Sunny Day! The sunlight turned harsh!`
      },
      // Flying-type special moves
      'Tailwind': {
        type: 'team_speed_boost',
        target: 'team',
        effect: 'tailwind',
        duration: 4,
        speedMultiplier: 2,
        message: (user) => `${user} used Tailwind! The team's Speed doubled!`
      },
      'Mirror Move': {
        type: 'copy_move',
        target: 'opponent',
        effect: 'mirror_move',
        copyLastMove: true,
        message: (user, lastMove) => `${user} used Mirror Move and copied ${lastMove}!`
      },
      'Defog': {
        type: 'hazard_removal',
        target: 'field',
        effect: 'defog',
        removeHazards: true,
        stats: { evasion: -1 }, // Also lowers target's evasion
        message: (user) => `${user} used Defog! Hazards were cleared and the opponent's evasiveness fell!`
      },
      // Ghost-type special moves
      'Spite': {
        type: 'pp_reduction',
        target: 'opponent',
        effect: 'spite',
        ppReduction: 4,
        targetLastMove: true,
        message: (user, lastMove) => `${user} used Spite! ${lastMove} lost 4 PP!`
      },
      'Grudge': {
        type: 'pp_zero_on_ko',
        target: 'self',
        effect: 'grudge',
        duration: 1,
        zeroLastMovePP: true,
        message: (user) => `${user} used Grudge! If ${user} faints, the attacker's last move will lose all PP!`
      },
      'Trick-or-Treat': {
        type: 'add_type',
        target: 'opponent',
        effect: 'trick_or_treat',
        addType: 'Ghost',
        message: (user, target) => `${user} used Trick-or-Treat! ${target} became part Ghost-type!`
      },
      'Destiny Bond': {
        type: 'destiny_bond',
        target: 'self',
        effect: 'destiny_bond',
        duration: 1,
        faintTogether: true,
        message: (user) => `${user} used Destiny Bond! If ${user} faints, the attacker will too!`
      },
      // Grass-type special moves
      'Spiky Shield': {
        type: 'protection_damage',
        target: 'self',
        effect: 'spiky_shield',
        duration: 1,
        protection: true,
        contactDamage: (attacker) => Math.floor(attacker.max_hp / 8), // 1/8 max HP damage
        message: (user) => `${user} used Spiky Shield! ${user} is protected and will damage attackers on contact!`
      },
      'Aromatherapy': {
        type: 'team_status_cure',
        target: 'team',
        effect: 'aromatherapy',
        cureAllStatus: true,
        message: (user) => `${user} used Aromatherapy! The team was cured of all status conditions!`
      },
      'Forest\'s Curse': {
        type: 'add_type',
        target: 'opponent',
        effect: 'forests_curse',
        addType: 'Grass',
        message: (user, target) => `${user} used Forest's Curse! ${target} became part Grass-type!`
      },
      'Ingrain': {
        type: 'ingrain',
        target: 'self',
        effect: 'ingrain',
        duration: -1, // Permanent until removed
        healPerTurn: (monster) => Math.floor(monster.max_hp / 16), // 1/16 max HP per turn
        trapSelf: true,
        message: (user) => `${user} used Ingrain! ${user} planted roots and is now trapped, but will recover HP each turn!`
      },
      'Grassy Terrain': {
        type: 'terrain',
        target: 'field',
        effect: 'grassy_terrain',
        duration: 5,
        message: (user) => `${user} used Grassy Terrain! The battlefield became grassy!`
      },
      'Worry Seed': {
        type: 'ability_change',
        target: 'opponent',
        effect: 'worry_seed',
        changeAbility: 'Insomnia',
        message: (user, target) => `${user} used Worry Seed! ${target}'s ability became Insomnia!`
      },
      // Ground-type special moves
      'Mud Sport': {
        type: 'field_effect',
        target: 'field',
        effect: 'mud_sport',
        duration: 5,
        weakenElectricMoves: 0.33, // Electric moves deal 1/3 damage
        message: (user) => `${user} used Mud Sport! Electric-type moves are weakened!`
      },
      'Spikes': {
        type: 'entry_hazard',
        target: 'field',
        effect: 'spikes',
        duration: -1, // Permanent until removed
        layers: 1, // Can stack up to 3 layers
        damagePercent: 0.125, // 1/8 max HP per layer
        message: (user) => `${user} used Spikes! Spikes were scattered around the opposing team!`
      },
      // Ice-type special moves
      'Hail': {
        type: 'weather',
        target: 'field',
        effect: 'hail',
        duration: 5,
        weather: 'hail',
        message: (user) => `${user} used Hail! It started to hail!`
      },
      'Snowscape': {
        type: 'weather',
        target: 'field',
        effect: 'snow',
        duration: 5,
        weather: 'snow',
        message: (user) => `${user} used Snowscape! It started to snow!`
      },
      'Chilly Reception': {
        type: 'weather_switch',
        target: 'field',
        effect: 'chilly_reception',
        duration: 5,
        weather: 'snow',
        switchOut: true,
        message: (user) => `${user} used Chilly Reception! It started to snow and ${user} switched out!`
      },
      'Mist': {
        type: 'team_protection',
        target: 'team',
        effect: 'mist',
        duration: 5,
        protectFrom: 'stat_reduction',
        message: (user) => `${user} used Mist! The team is protected from stat reduction!`
      },
      'Aurora Veil': {
        type: 'team_damage_reduction',
        target: 'team',
        effect: 'aurora_veil',
        duration: 5,
        damageReduction: 0.5, // Reduce damage by 50%
        requiresSnow: true,
        message: (user) => `${user} used Aurora Veil! The team is protected by a mystical veil!`
      },
      // Normal-type special moves
      'Lucky Chant': {
        type: 'critical_prevention',
        target: 'team',
        effect: 'lucky_chant',
        duration: 5,
        preventCriticals: true,
        message: (user) => `${user} used Lucky Chant! The team is protected from critical hits!`
      },
      'Whirlwind': {
        type: 'force_switch',
        target: 'opponent',
        effect: 'whirlwind',
        forceSwitch: true,
        priority: -6, // Negative priority
        message: (user, target) => `${user} used Whirlwind! ${target} was blown away!`
      },
      'Teatime': {
        type: 'consume_berries',
        target: 'field',
        effect: 'teatime',
        consumeAllBerries: true,
        message: (user) => `${user} used Teatime! Everyone consumed their berries!`
      },
      'Camouflage': {
        type: 'type_change_terrain',
        target: 'self',
        effect: 'camouflage',
        changeTypeBasedOnTerrain: true,
        message: (user, newType) => `${user} used Camouflage! ${user} became ${newType}-type!`
      },
      'Entrainment': {
        type: 'ability_copy',
        target: 'opponent',
        effect: 'entrainment',
        copyAbilityToTarget: true,
        message: (user, target, ability) => `${user} used Entrainment! ${target}'s ability became ${ability}!`
      },
      'Assist': {
        type: 'random_team_move',
        target: 'varies',
        effect: 'assist',
        useRandomTeamMove: true,
        message: (user, move) => `${user} used Assist and performed ${move}!`
      },
      'Court Change': {
        type: 'swap_field_effects',
        target: 'field',
        effect: 'court_change',
        swapAllFieldEffects: true,
        message: (user) => `${user} used Court Change! All field effects were swapped!`
      },
      'Reflect Type': {
        type: 'type_copy',
        target: 'opponent',
        effect: 'reflect_type',
        copyType: true,
        message: (user, target) => `${user} used Reflect Type and copied ${target}'s type!`
      },
      'Helping Hand': {
        type: 'ally_boost',
        target: 'ally',
        effect: 'helping_hand',
        boostNextMove: 1.5, // 50% power boost
        duration: 1,
        message: (user) => `${user} used Helping Hand! An ally's next move will be boosted!`
      },
      'Splash': {
        type: 'no_effect',
        target: 'self',
        effect: 'splash',
        message: (user) => `${user} used Splash! But nothing happened!`
      },
      'Copycat': {
        type: 'copy_last_move',
        target: 'varies',
        effect: 'copycat',
        copyLastMove: true,
        message: (user, move) => `${user} used Copycat and copied ${move}!`
      },
      'Tidy Up': {
        type: 'hazard_removal_stat_boost',
        target: 'field',
        effect: 'tidy_up',
        removeHazards: ['spikes', 'toxic_spikes', 'stealth_rock', 'sticky_web'],
        stats: { attack: 1, speed: 1 },
        message: (user) => `${user} used Tidy Up! Hazards were removed and stats rose!`
      },
      'Foresight': {
        type: 'identify_ghost',
        target: 'opponent',
        effect: 'foresight',
        removeEvasion: true,
        allowNormalVsGhost: true,
        duration: -1, // Permanent
        message: (user, target) => `${user} used Foresight! ${target} was identified!`
      },
      'Happy Hour': {
        type: 'double_prize_money',
        target: 'field',
        effect: 'happy_hour',
        doubleMoney: true,
        duration: -1, // Lasts for battle
        message: (user) => `${user} used Happy Hour! Prize money will be doubled!`
      },
      'Max Guard': {
        type: 'max_protection',
        target: 'self',
        effect: 'max_guard',
        protectFromMaxMoves: true,
        duration: 1,
        message: (user) => `${user} used Max Guard! It will be protected from Max Moves!`
      },
      'Revival Blessing': {
        type: 'revive_ally',
        target: 'ally',
        effect: 'revival_blessing',
        reviveHpPercent: 0.5, // Revive with 50% HP
        message: (user) => `${user} used Revival Blessing! A fainted ally was revived!`
      },
      'Metronome': {
        type: 'random_move',
        target: 'varies',
        effect: 'metronome',
        useRandomMove: true,
        excludedMoves: ['Metronome', 'Struggle', 'Sketch', 'Mirror Move', 'Copycat'],
        message: (user, move) => `${user} used Metronome and performed ${move}!`
      },
      'Sleep Talk': {
        type: 'sleep_move',
        target: 'varies',
        effect: 'sleep_talk',
        onlyWhileAsleep: true,
        useRandomKnownMove: true,
        message: (user, move) => `${user} used Sleep Talk and performed ${move} while sleeping!`
      },
      'Hold Hands': {
        type: 'no_battle_effect',
        target: 'ally',
        effect: 'hold_hands',
        message: (user) => `${user} used Hold Hands! Everyone feels happy!`
      },
      'Recycle': {
        type: 'restore_item',
        target: 'self',
        effect: 'recycle',
        restoreLastUsedItem: true,
        message: (user) => `${user} used Recycle and restored its item!`
      },
      'Me First': {
        type: 'priority_copy',
        target: 'opponent',
        effect: 'me_first',
        copyOpponentMove: true,
        powerBoost: 1.5, // 50% more powerful
        priority: 1,
        message: (user, move) => `${user} used Me First and copied ${move} with increased power!`
      },
      'Celebrate': {
        type: 'no_battle_effect',
        target: 'self',
        effect: 'celebrate',
        message: (user) => `${user} used Celebrate! Congratulations!`
      },
      'Protect': {
        type: 'protection',
        target: 'self',
        effect: 'protect',
        protectFromAllMoves: true,
        priority: 4, // +4 priority
        duration: 1,
        message: (user) => `${user} used Protect! It protected itself!`
      },
      'Laser Focus': {
        type: 'critical_guarantee',
        target: 'self',
        effect: 'laser_focus',
        guaranteeCritical: true,
        duration: 1, // Next move only
        message: (user) => `${user} used Laser Focus! Its next move will be a critical hit!`
      },
      'Sketch': {
        type: 'permanent_copy',
        target: 'opponent',
        effect: 'sketch',
        copyLastMove: true,
        permanentLearn: true,
        message: (user, move) => `${user} used Sketch and permanently learned ${move}!`
      },
      'Block': {
        type: 'trap_prevent_switch',
        target: 'opponent',
        effect: 'block',
        preventSwitch: true,
        duration: -1, // Until user switches/faints
        message: (user, target) => `${user} used Block! ${target} can no longer escape!`
      },
      'Endure': {
        type: 'survive_lethal',
        target: 'self',
        effect: 'endure',
        surviveWith1HP: true,
        priority: 4, // +4 priority
        duration: 1,
        message: (user) => `${user} used Endure! It will survive any attack with at least 1 HP!`
      },
      'Substitute': {
        type: 'create_substitute',
        target: 'self',
        effect: 'substitute',
        hpCost: 0.25, // 25% of max HP
        createSubstitute: true,
        message: (user) => `${user} used Substitute! It created a substitute!`
      },
      'Conversion': {
        type: 'type_change_move',
        target: 'self',
        effect: 'conversion',
        changeToFirstMoveType: true,
        message: (user, newType) => `${user} used Conversion and changed its type to ${newType}!`
      },
      'Bestow': {
        type: 'give_item',
        target: 'opponent',
        effect: 'bestow',
        giveHeldItem: true,
        message: (user, target) => `${user} used Bestow and gave its item to ${target}!`
      },
      'Transform': {
        type: 'copy_appearance',
        target: 'opponent',
        effect: 'transform',
        copyAppearance: true,
        copyMoves: true,
        copyStats: true,
        copyType: true,
        message: (user, target) => `${user} used Transform and transformed into ${target}!`
      },
      'Mean Look': {
        type: 'trap_prevent_switch',
        target: 'opponent',
        effect: 'mean_look',
        preventSwitch: true,
        duration: -1, // Until user switches/faints
        message: (user, target) => `${user} used Mean Look! ${target} can no longer escape!`
      },
      'Spotlight': {
        type: 'force_target',
        target: 'opponent',
        effect: 'spotlight',
        forceAllAttacks: true,
        priority: 3, // +3 priority
        duration: 1,
        message: (user, target) => `${user} used Spotlight! ${target} became the center of attention!`
      },
      'Roar': {
        type: 'force_switch_negative_priority',
        target: 'opponent',
        effect: 'roar',
        forceSwitch: true,
        priority: -6, // Negative priority
        message: (user, target) => `${user} used Roar! ${target} was blown away!`
      },
      'Baton Pass': {
        type: 'switch_pass_effects',
        target: 'self',
        effect: 'baton_pass',
        passStatChanges: true,
        passStatusEffects: true,
        switchUser: true,
        message: (user) => `${user} used Baton Pass and switched out while passing its effects!`
      },
      'Mimic': {
        type: 'temporary_copy_move',
        target: 'opponent',
        effect: 'mimic',
        copyLastMove: true,
        temporaryLearn: true,
        duration: -1, // Until switch out
        message: (user, move) => `${user} used Mimic and learned ${move}!`
      },
      'Encore': {
        type: 'force_repeat_move',
        target: 'opponent',
        effect: 'encore',
        forceRepeatLastMove: true,
        duration: 3,
        message: (user, target) => `${user} used Encore! ${target} must repeat its last move!`
      },
      'Doodle': {
        type: 'copy_ability',
        target: 'opponent',
        effect: 'doodle',
        copyAbility: true,
        applyToTeam: true, // Affects user's entire team
        message: (user, target, ability) => `${user} used Doodle and copied ${target}'s ${ability} for the whole team!`
      },
      'Odor Sleuth': {
        type: 'identify_ghost',
        target: 'opponent',
        effect: 'odor_sleuth',
        removeEvasion: true,
        allowNormalVsGhost: true,
        duration: -1, // Permanent
        message: (user, target) => `${user} used Odor Sleuth! ${target} was identified!`
      },
      'After You': {
        type: 'priority_boost_target',
        target: 'ally',
        effect: 'after_you',
        makeTargetMoveNext: true,
        priority: 0,
        message: (user, target) => `${user} used After You! ${target} will move next!`
      },
      'Nature Power': {
        type: 'terrain_dependent_move',
        target: 'varies',
        effect: 'nature_power',
        becomesMove: {
          normal: 'Tri Attack',
          electric: 'Thunderbolt',
          grassy: 'Energy Ball',
          psychic: 'Psychic',
          misty: 'Moonblast'
        },
        message: (user, move) => `${user} used Nature Power and turned it into ${move}!`
      },
      'Perish Song': {
        type: 'perish_countdown',
        target: 'all',
        effect: 'perish_song',
        perishCountdown: 3,
        affectsAll: true,
        message: (user) => `${user} used Perish Song! All Pokemon that hear it will faint in 3 turns!`
      },
      'Disable': {
        type: 'disable_move',
        target: 'opponent',
        effect: 'disable',
        disableLastMove: true,
        duration: 4,
        message: (user, target, move) => `${user} used Disable! ${target}'s ${move} was disabled!`
      },
      'Safeguard': {
        type: 'team_protection',
        target: 'team',
        effect: 'safeguard',
        duration: 5,
        protectFrom: 'status_conditions',
        message: (user) => `${user} used Safeguard! The team is protected from status conditions!`
      },
      'Conversion 2': {
        type: 'type_change_resist',
        target: 'self',
        effect: 'conversion_2',
        changeTypeToResist: true,
        message: (user, newType) => `${user} used Conversion 2! ${user} changed its type to ${newType}!`
      },
      'Simple Beam': {
        type: 'ability_change',
        target: 'opponent',
        effect: 'simple_beam',
        changeAbility: 'Simple',
        message: (user, target) => `${user} used Simple Beam! ${target}'s ability became Simple!`
      },
      'Pain Split': {
        type: 'hp_average',
        target: 'opponent',
        effect: 'pain_split',
        averageHP: true,
        message: (user, target, userHP, targetHP) => `${user} used Pain Split! ${user} and ${target} shared their pain! (${userHP} HP each)`
      },
      'Shed Tail': {
        type: 'substitute_switch',
        target: 'self',
        effect: 'shed_tail',
        hpCost: 0.25, // 25% of max HP for substitute
        forceSwitch: true,
        message: (user) => `${user} used Shed Tail! ${user} created a substitute and switched out!`
      },
      'Follow Me': {
        type: 'redirect_all',
        target: 'self',
        effect: 'follow_me',
        redirectAttacks: true,
        priority: 2, // +2 priority
        duration: 1,
        message: (user) => `${user} used Follow Me! ${user} became the center of attention!`
      },
      'Lock On': {
        type: 'guarantee_next_hit',
        target: 'opponent',
        effect: 'lock_on',
        guaranteeHit: true,
        duration: 1, // Next turn only
        message: (user, target) => `${user} used Lock On! ${user} took aim at ${target}!`
      },
      'Mind Reader': {
        type: 'guarantee_next_hit',
        target: 'opponent',
        effect: 'mind_reader',
        guaranteeHit: true,
        duration: 1, // Next turn only
        message: (user, target) => `${user} used Mind Reader! ${user} sensed ${target}'s movements!`
      },
      'Baneful Bunker': {
        type: 'protection_poison',
        target: 'self',
        effect: 'baneful_bunker',
        protection: true,
        contactEffect: { statusEffect: 'poison', duration: 4 },
        priority: 4, // +4 priority
        duration: 1,
        message: (user) => `${user} used Baneful Bunker! ${user} is protected and will poison attackers on contact!`
      },
      'Corrosive Gas': {
        type: 'destroy_items',
        target: 'all',
        effect: 'corrosive_gas',
        destroyHeldItems: true,
        affectsAll: true,
        message: (user) => `${user} used Corrosive Gas! All held items were destroyed!`
      },
      'Toxic Spikes': {
        type: 'entry_hazard_poison',
        target: 'field',
        effect: 'toxic_spikes',
        hazardType: 'poison',
        layers: 1, // Can stack up to 2 layers
        maxLayers: 2,
        duration: -1, // Permanent until removed
        message: (user) => `${user} used Toxic Spikes! Toxic spikes were scattered around the opposing team!`
      },
      'Gastro Acid': {
        type: 'suppress_ability',
        target: 'opponent',
        effect: 'gastro_acid',
        suppressAbility: true,
        duration: -1, // Permanent until switch
        message: (user, target) => `${user} used Gastro Acid! ${target}'s ability was suppressed!`
      },
      'Magic Coat': {
        type: 'reflect_status',
        target: 'self',
        effect: 'magic_coat',
        reflectStatusMoves: true,
        priority: 4, // +4 priority
        duration: 1,
        message: (user) => `${user} used Magic Coat! ${user} is ready to reflect status moves!`
      },
      // Additional special moves
      'Imprison': {
        type: 'disable_moves',
        target: 'opponent',
        effect: 'imprison',
        duration: -1, // Until user switches out
        disableSharedMoves: true,
        message: (user, target) => `${user} used Imprison! ${target} can no longer use moves that ${user} knows!`
      },
      'Reflect': {
        type: 'team_barrier',
        target: 'team',
        effect: 'reflect',
        duration: 5,
        damageReduction: 0.5, // Reduce physical damage by 50%
        barrierType: 'physical',
        message: (user) => `${user} used Reflect! Physical damage to the team will be reduced!`
      },
      'Ally Switch': {
        type: 'switch_positions',
        target: 'ally',
        effect: 'ally_switch',
        priority: 2, // +2 priority
        switchPlaces: true,
        message: (user, target) => `${user} used Ally Switch! ${user} and ${target} switched places!`
      },
      'Magic Room': {
        type: 'field_effect',
        target: 'field',
        effect: 'magic_room',
        duration: 5,
        suppressItems: true,
        message: (user) => `${user} used Magic Room! All held item effects are suppressed!`
      },
      'Trick Room': {
        type: 'field_effect',
        target: 'field',
        effect: 'trick_room',
        duration: 5,
        reverseSpeed: true,
        message: (user) => `${user} used Trick Room! Speed order has been reversed!`
      },
      // Additional Psychic-type special moves
      'Heal Block': {
        type: 'disable_healing',
        target: 'opponent',
        effect: 'heal_block',
        duration: 5,
        preventHealing: true,
        message: (user, target) => `${user} used Heal Block! ${target} was prevented from healing!`
      },
      'Instruct': {
        type: 'force_repeat_last_move',
        target: 'opponent',
        effect: 'instruct',
        forceRepeatLast: true,
        message: (user, target) => `${user} used Instruct! ${target} used its last move again!`
      },
      'Miracle Eye': {
        type: 'identify_dark',
        target: 'opponent',
        effect: 'miracle_eye',
        removeEvasion: true,
        allowPsychicVsDark: true,
        duration: -1, // Permanent
        message: (user, target) => `${user} used Miracle Eye! ${target} was identified and can now be hit by Psychic moves!`
      },
      'Role Play': {
        type: 'copy_ability',
        target: 'opponent',
        effect: 'role_play',
        copyTargetAbility: true,
        message: (user, target) => `${user} used Role Play and copied ${target}'s ability!`
      },
      'Trick': {
        type: 'swap_items',
        target: 'opponent',
        effect: 'trick',
        swapHeldItems: true,
        message: (user, target) => `${user} used Trick! ${user} and ${target} swapped held items!`
      },
      'Teleport': {
        type: 'escape_battle',
        target: 'self',
        effect: 'teleport',
        escapeBattle: true,
        priority: -6, // Negative priority like Roar
        message: (user) => `${user} used Teleport and fled from battle!`
      },
      'Telekinesis': {
        type: 'levitate_target',
        target: 'opponent',
        effect: 'telekinesis',
        duration: 3,
        levitateTarget: true,
        guaranteeHit: true, // All moves will hit
        message: (user, target) => `${user} used Telekinesis! ${target} was lifted into the air and cannot avoid attacks!`
      },
      'Wonder Room': {
        type: 'field_effect',
        target: 'field',
        effect: 'wonder_room',
        duration: 5,
        swapDefenses: true, // Swap Defense and Special Defense for all Pokemon
        message: (user) => `${user} used Wonder Room! Defense and Special Defense stats were swapped for all Pokémon!`
      },
      
      // Third set of additional moves
      'Light Screen': {
        type: 'team_special_defense_boost',
        target: 'team',
        effect: 'light_screen',
        duration: 5,
        specialDefenseMultiplier: 2, // Halves special damage to team
        message: (user) => `${user} used Light Screen! A wondrous wall of light was raised to reduce the damage of special moves!`
      },
      'Magic Powder': {
        type: 'type_change_target',
        target: 'opponent',
        effect: 'magic_powder',
        changeType: 'Psychic',
        duration: -1, // Permanent until switch
        message: (user, target) => `${user} used Magic Powder! ${target}'s type changed to Psychic!`
      },
      'Skill Swap': {
        type: 'ability_swap',
        target: 'opponent',
        effect: 'skill_swap',
        swapAbilities: true,
        duration: -1, // Permanent until switch
        message: (user, target) => `${user} used Skill Swap! ${user} and ${target} swapped abilities!`
      },
      'Gravity': {
        type: 'field_effect_gravity',
        target: 'field',
        effect: 'gravity',
        duration: 5,
        groundsFlying: true,
        increaseAccuracy: true,
        accuracyMultiplier: 1.67, // 5/3 accuracy boost
        message: (user) => `${user} used Gravity! Gravity was intensified! Flying Pokémon and those with Levitate can be hit by Ground moves!`
      },
      'Sandstorm': {
        type: 'weather',
        target: 'field',
        effect: 'sandstorm',
        weather: 'sandstorm',
        duration: 5,
        message: (user) => `${user} used Sandstorm! A sandstorm kicked up!`
      },
      'Stealth Rock': {
        type: 'entry_hazard',
        target: 'field',
        effect: 'stealth_rock',
        duration: -1, // Permanent until removed
        side: 'opponent',
        hazardType: 'stealth_rock',
        message: (user) => `${user} used Stealth Rock! Pointed stones float in the air around the foe!`
      },
      'Wide Guard': {
        type: 'team_protection_wide',
        target: 'team',
        effect: 'wide_guard',
        duration: 1,
        protectFrom: 'wide_moves',
        priority: 3,
        message: (user) => `${user} used Wide Guard! Wide Guard protected the team!`
      },
      'Tar Shot': {
        type: 'speed_debuff_fire_weakness',
        target: 'opponent',
        effect: 'tar_shot',
        duration: -1, // Permanent until switch
        stats: { speed: -1 },
        fireWeakness: true,
        message: (user, target) => `${user} used Tar Shot! ${target} was covered in sticky tar! ${target}'s Speed fell and it became weak to Fire moves!`
      }
      // More moves will be added here later
    };

    // Special damage moves with additional effects
    this.specialDamageMoves = {
      'Leech Life': {
        type: 'damage_heal',
        target: 'opponent',
        healPercent: 50, // Heal 50% of damage dealt
        message: (user, target, damage, healing) => `${user} used Leech Life! ${target} lost ${damage} HP! ${user} recovered ${healing} HP!`
      },
      'Bullet Seed': {
        type: 'multi_hit',
        target: 'opponent',
        minHits: 2,
        maxHits: 5,
        message: (user, target, hits) => `${user} used Bullet Seed! Hit ${hits} time(s)!`
      },
      'Leech Seed': {
        type: 'damage_status',
        target: 'opponent',
        statusEffect: 'leech_seed',
        duration: 5,
        message: (user, target) => `${user} used Leech Seed! ${target} was seeded!`
      },
      'Dig': {
        type: 'two_turn',
        target: 'opponent',
        firstTurnMessage: (user) => `${user} burrowed underground!`,
        secondTurnMessage: (user, target) => `${user} emerged from underground and attacked ${target}!`
      },
      'Bounce': {
        type: 'two_turn',
        target: 'opponent',
        firstTurnMessage: (user) => `${user} bounced high into the air!`,
        secondTurnMessage: (user, target) => `${user} came down and attacked ${target}!`
      },
      'Fly': {
        type: 'two_turn',
        target: 'opponent',
        firstTurnMessage: (user) => `${user} flew high into the sky!`,
        secondTurnMessage: (user, target) => `${user} dove down and attacked ${target}!`
      },
      'Bite': {
        type: 'damage_flinch',
        target: 'opponent',
        flinchChance: 30,
        message: (user, target, flinched) => flinched ?
          `${user} used Bite! ${target} flinched and couldn't move!` :
          `${user} used Bite!`
      },
      'Crunch': {
        type: 'damage_flinch',
        target: 'opponent',
        flinchChance: 20,
        message: (user, target, flinched) => flinched ?
          `${user} used Crunch! ${target} flinched and couldn't move!` :
          `${user} used Crunch!`
      }
    };
  }

  /**
   * Check if a move is a status move and execute it
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} Status move result or null if not a status move
   */
  async processStatusMove(move, attacker, target, battleId) {
    try {
      const moveName = move.move_name;

      // Check stat buff/debuff moves
      if (this.statBuffDebuffMoves[moveName]) {
        return await this.executeStatMove(this.statBuffDebuffMoves[moveName], move, attacker, target, battleId);
      }

      // Check status affliction moves
      if (this.statusAfflictionMoves[moveName]) {
        return await this.executeStatusAfflictionMove(this.statusAfflictionMoves[moveName], move, attacker, target, battleId);
      }

      // Check healing moves
      if (this.healingMoves[moveName]) {
        return await this.executeHealingMove(this.healingMoves[moveName], move, attacker, target, battleId);
      }

      // Check other moves
      if (this.otherMoves[moveName]) {
        return await this.executeOtherMove(this.otherMoves[moveName], move, attacker, target, battleId);
      }

      // Check special damage moves
      if (this.specialDamageMoves[moveName]) {
        return await this.executeSpecialDamageMove(this.specialDamageMoves[moveName], move, attacker, target, battleId);
      }

      // Not a status move, return null to proceed with normal damage calculation
      return null;

    } catch (error) {
      console.error('Error processing status move:', error);
      throw error;
    }
  }

  /**
   * Execute stat buff/debuff move
   * @param {Object} moveConfig - Move configuration
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Move result
   */
  async executeStatMove(moveConfig, move, attacker, target, battleId) {
    try {
      // Validate moveConfig
      if (!moveConfig || typeof moveConfig !== 'object') {
        console.error(`Invalid moveConfig for move "${move.move_name}":`, moveConfig);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        
        // Return null to indicate this should be processed as a normal attacking move
        // The DamageCalculator will handle it as a 50 power move of the move's type
        return null;
      }

      // Check if move hits
      const accuracy = move.accuracy || 100;
      const hits = Math.random() * 100 <= accuracy;

      if (!hits) {
        return {
          hits: false,
          message: `${attacker.name || 'Attacker'}'s ${move.move_name} missed!`,
          isStatusMove: true
        };
      }

      // Determine actual target based on move configuration
      const actualTarget = moveConfig.target === 'self' ? attacker : target;
      const targetName = actualTarget.name || (actualTarget === attacker ? 'User' : 'Target');
      const userName = attacker.name || 'User';

      // Apply stat changes
      let statModifications = actualTarget.stat_modifications || {};
      
      // Check if moveConfig.stats exists and is not null
      if (moveConfig.stats && typeof moveConfig.stats === 'object') {
        for (const [stat, change] of Object.entries(moveConfig.stats)) {
          if (!statModifications[stat]) {
            statModifications[stat] = 0;
          }
          statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
        }
      } else {
        console.warn(`Move "${move.move_name}" has no stats configuration or stats is null/undefined`);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        
        // Return null to indicate this should be processed as a normal attacking move
        return null;
      }

      // Update monster with stat modifications
      await BattleMonster.update(actualTarget.id, {
        monster_data: {
          ...actualTarget.monster_data,
          stat_modifications: statModifications
        }
      });

      let message = '';
      if (moveConfig.message && typeof moveConfig.message === 'function') {
        try {
          message = moveConfig.message(userName, targetName);
        } catch (error) {
          console.error(`Error calling message function for move "${move.move_name}":`, error);
          message = `${userName} used ${move.move_name}!`;
        }
      } else {
        message = `${userName} used ${move.move_name}!`;
      }
      let additionalEffects = {};

      // Handle special move types
      if (moveConfig.type === 'stat_buff_confuse') {
        // Flatter - apply confusion after stat boost
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.statusEffect, moveConfig.duration);
        additionalEffects.confusion = true;
      }

      if (moveConfig.type === 'critical_buff') {
        // Focus Energy - apply critical boost effect
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.effect, moveConfig.duration);
        additionalEffects.criticalBuff = true;
      }

      if (moveConfig.type === 'stat_buff_max_hp_cost') {
        // Belly Drum - maximize Attack at cost of half HP
        const hpCost = Math.floor(actualTarget.max_hp * moveConfig.hpCost);
        if (actualTarget.current_hp <= hpCost) {
          return {
            hits: false,
            message: `${userName} doesn't have enough HP to use ${move.move_name}!`,
            isStatusMove: true
          };
        }
        // Deal damage to self
        await BattleMonster.dealDamage(actualTarget.id, hpCost);
        
        // Set Attack to maximum (+6 stages)
        statModifications.attack = 6;
        
        message += `\n💔 ${targetName} lost ${hpCost} HP!`;
        additionalEffects.hpCost = hpCost;
        additionalEffects.maximizedAttack = true;
      }

      if (moveConfig.type === 'conditional_stat_debuff') {
        // Venom Drench - only works on poisoned targets
        const isPoisoned = StatusEffectManager.hasStatusEffect(actualTarget, 'poison');
        if (!isPoisoned) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it had no effect! ${targetName} is not poisoned!`,
            isStatusMove: true
          };
        }
        additionalEffects.conditionalDebuff = moveConfig.condition;
      }

      if (moveConfig.type === 'stat_debuff_status') {
        // Toxic Thread - apply stat debuff and poison
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.statusEffect, moveConfig.duration);
        additionalEffects.statusAffliction = moveConfig.statusEffect;
      }

      if (moveConfig.type === 'stat_swap_all') {
        // Heart Swap - swap all stat modifications
        const userStatMods = attacker.stat_modifications || {};
        const targetStatMods = actualTarget.stat_modifications || {};
        
        // Swap the stat modifications
        await BattleMonster.update(attacker.id, {
          monster_data: {
            ...attacker.monster_data,
            stat_modifications: targetStatMods
          }
        });
        
        await BattleMonster.update(actualTarget.id, {
          monster_data: {
            ...actualTarget.monster_data,
            stat_modifications: userStatMods
          }
        });
        
        additionalEffects.heartSwap = {
          userPrevious: userStatMods,
          targetPrevious: targetStatMods
        };
      }

      if (moveConfig.type === 'stat_debuff_switch') {
        // Parting Shot - switch out after debuff
        additionalEffects.switchOut = true;
      }

      if (moveConfig.type === 'stat_buff_hp_cost') {
        // Clangorous Soul - pay HP cost for stat boosts
        const hpCost = Math.floor(actualTarget.max_hp * moveConfig.hpCost);
        if (actualTarget.current_hp <= hpCost) {
          return {
            hits: false,
            message: `${userName} doesn't have enough HP to use ${move.move_name}!`,
            isStatusMove: true
          };
        }
        // Deal damage to self
        await BattleMonster.dealDamage(actualTarget.id, hpCost);
        message += `\n💔 ${targetName} lost ${hpCost} HP!`;
        additionalEffects.hpCost = hpCost;
      }

      if (moveConfig.type === 'stat_debuff_priority') {
        // Baby-Doll Eyes - priority move
        additionalEffects.priority = moveConfig.priority;
      }

      if (moveConfig.type === 'ally_stat_buff') {
        // Decorate, Aromatic Mist - boost ally stats
        // This would need ally targeting in multi-battle scenarios
        additionalEffects.allyBuff = moveConfig.stats;
      }

      if (moveConfig.type === 'stat_mixed_self') {
        // Shell Smash - already handled by main stat modification logic
        additionalEffects.mixedSelf = true;
      }

      if (moveConfig.type === 'stat_buff_hp_cost_self') {
        // Fillet Away - pay HP cost for stat boosts
        const hpCost = Math.floor(actualTarget.max_hp * moveConfig.hpCost);
        if (actualTarget.current_hp <= hpCost) {
          return {
            hits: false,
            message: `${userName} doesn't have enough HP to use ${move.move_name}!`,
            isStatusMove: true
          };
        }
        // Deal damage to self
        await BattleMonster.dealDamage(actualTarget.id, hpCost);
        message += `\n💔 ${targetName} lost ${hpCost} HP!`;
        additionalEffects.hpCost = hpCost;
      }

      if (moveConfig.type === 'stat_swap') {
        // Power Shift - swap two stats
        const [stat1, stat2] = moveConfig.swapStats;
        const currentMods = actualTarget.stat_modifications || {};
        const stat1Value = currentMods[stat1] || 0;
        const stat2Value = currentMods[stat2] || 0;
        
        // Swap the stat modifications
        statModifications[stat1] = stat2Value;
        statModifications[stat2] = stat1Value;
        
        additionalEffects.statSwap = {
          swapped: moveConfig.swapStats
        };
      }

      if (moveConfig.type === 'stat_swap_specific') {
        // Speed Swap, Power Swap - swap specific stats between user and opponent
        const userStatMods = attacker.stat_modifications || {};
        const targetStatMods = actualTarget.stat_modifications || {};
        
        // Create new stat modifications for both monsters
        const newUserStats = { ...userStatMods };
        const newTargetStats = { ...targetStatMods };
        
        // Swap the specified stats
        for (const stat of moveConfig.swapStats) {
          const userValue = userStatMods[stat] || 0;
          const targetValue = targetStatMods[stat] || 0;
          
          newUserStats[stat] = targetValue;
          newTargetStats[stat] = userValue;
        }
        
        // Update both monsters
        await BattleMonster.update(attacker.id, {
          monster_data: {
            ...attacker.monster_data,
            stat_modifications: newUserStats
          }
        });
        
        await BattleMonster.update(actualTarget.id, {
          monster_data: {
            ...actualTarget.monster_data,
            stat_modifications: newTargetStats
          }
        });
        
        additionalEffects.statSwapSpecific = {
          swappedStats: moveConfig.swapStats,
          userPrevious: userStatMods,
          targetPrevious: targetStatMods
        };
      }

      if (moveConfig.type === 'stat_swap_self') {
        // Power Trick - swap own attack and defense
        const [stat1, stat2] = moveConfig.swapStats;
        const currentMods = actualTarget.stat_modifications || {};
        const stat1Value = currentMods[stat1] || 0;
        const stat2Value = currentMods[stat2] || 0;
        
        // Swap the stat modifications
        statModifications[stat1] = stat2Value;
        statModifications[stat2] = stat1Value;
        
        additionalEffects.statSwapSelf = {
          swapped: moveConfig.swapStats
        };
      }

      if (moveConfig.type === 'stat_swap_specific') {
        // Guard Swap - swap specific stats between user and target
        const swapStats = moveConfig.swapStats;
        const userStatMods = attacker.stat_modifications || {};
        const targetStatMods = actualTarget.stat_modifications || {};
        
        // Store original values
        const userOriginalStats = {};
        const targetOriginalStats = {};
        
        for (const stat of swapStats) {
          userOriginalStats[stat] = userStatMods[stat] || 0;
          targetOriginalStats[stat] = targetStatMods[stat] || 0;
          
          // Set user's stats to target's original values
          statModifications[stat] = targetOriginalStats[stat];
        }
        
        // Update target's stat modifications with user's original values
        const updatedTargetStatMods = { ...targetStatMods };
        for (const stat of swapStats) {
          updatedTargetStatMods[stat] = userOriginalStats[stat];
        }
        
        await BattleMonster.update(actualTarget.id, {
          monster_data: {
            ...actualTarget.monster_data,
            stat_modifications: updatedTargetStatMods
          }
        });
        
        additionalEffects.statSwapSpecific = {
          swappedStats: swapStats,
          userOriginalStats: userOriginalStats,
          targetOriginalStats: targetOriginalStats
        };
      }

      if (moveConfig.type === 'stat_average') {
        // Guard Split - average stats between user and opponent
        const userStatMods = attacker.stat_modifications || {};
        const targetStatMods = actualTarget.stat_modifications || {};
        
        // Calculate averages for specified stats
        for (const stat of moveConfig.averageStats) {
          const userValue = userStatMods[stat] || 0;
          const targetValue = targetStatMods[stat] || 0;
          const averageValue = Math.floor((userValue + targetValue) / 2);
          
          // Set both to the average
          if (!statModifications[stat]) {
            statModifications[stat] = 0;
          }
          statModifications[stat] = averageValue;
          
          // Also update the attacker's stats
          let attackerStatMods = attacker.stat_modifications || {};
          attackerStatMods[stat] = averageValue;
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              stat_modifications: attackerStatMods
            }
          });
        }
        
        additionalEffects.statAverage = {
          averagedStats: moveConfig.averageStats
        };
      }

      if (moveConfig.type === 'stat_buff_clear_debuffs') {
        // Take Heart - remove negative stat changes and boost stats
        let currentMods = actualTarget.stat_modifications || {};
        
        // Remove all negative stat modifications
        for (const [stat, value] of Object.entries(currentMods)) {
          if (value < 0) {
            delete currentMods[stat];
          }
        }
        
        // Apply the stat boosts
        for (const [stat, change] of Object.entries(moveConfig.stats)) {
          if (!currentMods[stat]) {
            currentMods[stat] = 0;
          }
          currentMods[stat] = Math.max(-6, Math.min(6, currentMods[stat] + change));
        }
        
        // Update with cleared debuffs and new boosts
        statModifications = currentMods;
        
        additionalEffects.clearDebuffs = {
          clearedNegativeStats: true,
          statBoosts: moveConfig.stats
        };
      }

      if (moveConfig.type === 'stat_buff_stockpile') {
        // Stockpile - stack up to 3 times
        let currentStacks = 0;
        
        // Check current stockpile stacks (would need to implement this in status effects)
        const existingEffect = actualTarget.status_effects?.find(e => e.type === 'stockpile');
        if (existingEffect) {
          currentStacks = existingEffect.stacks || 0;
        }
        
        if (currentStacks >= moveConfig.maxStacks) {
          return {
            hits: false,
            message: `${userName} can't stockpile any more!`,
            isStatusMove: true
          };
        }
        
        // Apply stockpile effect
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, 'stockpile', -1, {
          stacks: currentStacks + 1
        });
        
        additionalEffects.stockpile = currentStacks + 1;
      }

      if (moveConfig.type === 'stat_debuff_gender') {
        // Captivate - only affects opposite gender
        const userGender = attacker.monster_data?.gender || 'genderless';
        const targetGender = target.monster_data?.gender || 'genderless';
        
        if (userGender === 'genderless' || targetGender === 'genderless' || userGender === targetGender) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it had no effect!`,
            isStatusMove: true
          };
        }
        additionalEffects.genderBased = true;
      }

      if (moveConfig.type === 'stat_buff_random') {
        // Acupressure - boost random stat sharply
        const randomStat = moveConfig.possibleStats[Math.floor(Math.random() * moveConfig.possibleStats.length)];
        
        // Override the stats to boost the randomly chosen one
        for (const stat of Object.keys(statModifications)) {
          delete statModifications[stat];
        }
        statModifications[randomStat] = (statModifications[randomStat] || 0) + moveConfig.randomStatBoost;
        
        message = moveConfig.message(userName, targetName, randomStat.replace('_', ' '));
        additionalEffects.randomStatBoosted = randomStat;
      }

      if (moveConfig.type === 'stat_buff_consume_berry') {
        // Stuff Cheeks - requires berry to work
        const hasBerry = actualTarget.held_item && actualTarget.held_item.includes('Berry');
        if (!hasBerry) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it had no berry to eat!`,
            isStatusMove: true
          };
        }
        
        // Consume the berry
        if (moveConfig.consumeBerry) {
          await BattleMonster.update(actualTarget.id, {
            monster_data: {
              ...actualTarget.monster_data,
              held_item: null
            }
          });
        }
        additionalEffects.berryConsumed = actualTarget.held_item;
      }

      if (moveConfig.type === 'stat_copy') {
        // Psych Up - copy opponent's stat changes
        const targetStatMods = target.stat_modifications || {};
        
        // Copy all stat modifications from target
        for (const [stat, value] of Object.entries(targetStatMods)) {
          statModifications[stat] = value;
        }
        additionalEffects.statsCopied = targetStatMods;
      }

      if (moveConfig.type === 'type_specific_buff') {
        // Flower Shield - boost specific types
        additionalEffects.typeSpecificBuff = {
          stats: moveConfig.stats,
          typeRestriction: moveConfig.typeRestriction
        };
      }

      if (moveConfig.type === 'charge_stat_buff') {
        // Geomancy - charge turn then massive stat boost
        additionalEffects.chargeTurn = moveConfig.chargeTurn;
      }

      if (moveConfig.type === 'stat_buff_trap_self') {
        // No Retreat - trap self after stat boost
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, 'trapped', -1); // Permanent trap
        additionalEffects.trapSelf = true;
      }

      if (moveConfig.type === 'trap_debuff') {
        // Octolock - trap target and apply ongoing debuffs
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, 'octolock', moveConfig.duration);
        additionalEffects.trapDebuff = true;
      }

      if (moveConfig.type === 'curse_conditional') {
        // Curse - different effects for Ghost vs non-Ghost types
        const isGhost = attacker.monster_data?.type1 === 'Ghost' || attacker.monster_data?.type2 === 'Ghost';
        
        if (isGhost) {
          // Ghost-type Curse: Cut HP in half and curse the target
          const hpCost = Math.floor(attacker.max_hp * moveConfig.ghostEffect.hpCost);
          if (attacker.current_hp <= hpCost) {
            return {
              hits: false,
              message: `${userName} doesn't have enough HP to use Curse!`,
              isStatusMove: true
            };
          }
          await BattleMonster.dealDamage(attacker.id, hpCost);
          await StatusEffectManager.applyStatusEffect(battleId, target, moveConfig.ghostEffect.statusEffect, moveConfig.ghostEffect.duration);
          message = moveConfig.message(userName, target.name || 'Target', true);
          additionalEffects.curseDamage = true;
        } else {
          // Non-Ghost Curse: Raise Attack/Defense, lower Speed
          for (const [stat, change] of Object.entries(moveConfig.nonGhostEffect.stats)) {
            if (!statModifications[stat]) {
              statModifications[stat] = 0;
            }
            statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
          }
          message = moveConfig.message(userName, targetName, false);
          additionalEffects.curseStats = true;
        }
      }

      if (moveConfig.type === 'stat_mixed_opponent') {
        // Spicy Extract - mixed stat changes on opponent
        for (const [stat, change] of Object.entries(moveConfig.stats)) {
          if (!statModifications[stat]) {
            statModifications[stat] = 0;
          }
          statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
        }
        additionalEffects.mixedStats = true;
      }

      if (moveConfig.type === 'stat_debuff_heal') {
        // Strength Sap - debuff and heal based on opponent's stat
        const opponentAttack = target.monster_data?.base_attack || 100; // Fallback value
        const healAmount = Math.floor(opponentAttack * 0.8); // Heal based on opponent's Attack
        
        const BattleMonster = require('../models/BattleMonster');
        await BattleMonster.heal(attacker.id, healAmount);
        
        message += `\n💚 ${userName} recovered ${healAmount} HP!`;
        additionalEffects.strengthSapHeal = healAmount;
      }

      if (moveConfig.type === 'stat_reset') {
        // Haze - reset all stat changes
        if (moveConfig.resetAllStats) {
          // Reset both attacker and target stats (simplified - would need all battle participants)
          const BattleMonster = require('../models/BattleMonster');
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              stat_modifications: {}
            }
          });
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              stat_modifications: {}
            }
          });
          additionalEffects.statReset = true;
        }
      }

      if (moveConfig.type === 'stat_mixed_self') {
        // Shell Smash - mixed stat changes on self
        for (const [stat, change] of Object.entries(moveConfig.stats)) {
          if (!statModifications[stat]) {
            statModifications[stat] = 0;
          }
          statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
        }
        additionalEffects.shellSmash = true;
      }

      return {
        hits: true,
        damage: 0,
        message: message,
        isStatusMove: true,
        statChanges: moveConfig.stats,
        additionalEffects: additionalEffects,
        requiresSwitchOut: additionalEffects.switchOut || false
      };

    } catch (error) {
      console.error('Error executing stat move:', error);
      throw error;
    }
  }

  /**
   * Execute status affliction move
   * @param {Object} moveConfig - Move configuration
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Move result
   */
  async executeStatusAfflictionMove(moveConfig, move, attacker, target, battleId) {
    try {
      // Validate moveConfig
      if (!moveConfig || typeof moveConfig !== 'object') {
        console.error(`Invalid moveConfig for status affliction move "${move.move_name}":`, moveConfig);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        return null;
      }

      // Check if move hits
      const accuracy = move.accuracy || 100;
      const hits = Math.random() * 100 <= accuracy;

      if (!hits) {
        return {
          hits: false,
          message: `${attacker.name || 'Attacker'}'s ${move.move_name} missed!`,
          isStatusMove: true
        };
      }

      // Determine actual target
      const actualTarget = moveConfig.target === 'self' ? attacker : target;
      const targetName = actualTarget.name || (actualTarget === attacker ? 'User' : 'Target');
      const userName = attacker.name || 'User';

      // Check for conditional status moves
      if (moveConfig.type === 'conditional_status') {
        // Nightmare - only works on sleeping targets
        if (moveConfig.condition === 'sleeping') {
          const isSleeping = StatusEffectManager.hasStatusEffect(actualTarget, 'sleep');
          if (!isSleeping) {
            return {
              hits: false,
              message: `${userName} used ${move.move_name}, but it failed! ${targetName} is not asleep!`,
              isStatusMove: true
            };
          }
        }
      }

      // Handle gender-based status effects
      if (moveConfig.type === 'status_affliction_gender') {
        // Attract - only affects opposite gender
        const userGender = attacker.monster_data?.gender || 'genderless';
        const targetGender = actualTarget.monster_data?.gender || 'genderless';
        
        if (userGender === 'genderless' || targetGender === 'genderless' || userGender === targetGender) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it had no effect!`,
            isStatusMove: true
          };
        }
      }

      // Handle delayed status effects
      if (moveConfig.type === 'delayed_status') {
        // Yawn - apply drowsy effect that causes sleep after delay
        const delayedStatusResult = await StatusEffectManager.applyStatusEffect(
          battleId,
          actualTarget,
          'yawn',
          moveConfig.delay,
          {
            delayedEffect: moveConfig.statusEffect,
            delayedDuration: moveConfig.duration
          }
        );

        let message = moveConfig.message(userName, targetName);
        if (delayedStatusResult.success) {
          message += `\n${delayedStatusResult.message}`;
        }

        return {
          hits: true,
          damage: 0,
          message: message,
          isStatusMove: true,
          additionalEffects: { delayedStatus: moveConfig.statusEffect }
        };
      }

      // Handle all-target status effects
      if (moveConfig.type === 'status_affliction_all') {
        // Teeter Dance - affects all Pokemon in battle
        
        // Apply to all Pokemon (simplified - would need battle participant system)
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.statusEffect, moveConfig.duration);
        if (moveConfig.includesSelf) {
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.statusEffect, moveConfig.duration);
        }
        
        let message = moveConfig.message(userName);
        return {
          hits: true,
          damage: 0,
          message: message,
          isStatusMove: true,
          additionalEffects: { 
            affectsAll: true,
            includesSelf: moveConfig.includesSelf,
            statusEffect: moveConfig.statusEffect
          }
        };
      }

      // Handle adjacent-target status effects
      if (moveConfig.type === 'status_affliction_adjacent') {
        // Poison Gas - affects adjacent opponents
        
        // Apply to adjacent opponents (simplified implementation)
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.statusEffect, moveConfig.duration);
        
        let message = moveConfig.message(userName, 'adjacent opponents');
        return {
          hits: true,
          damage: 0,
          message: message,
          isStatusMove: true,
          additionalEffects: { 
            affectsAdjacent: moveConfig.affectsAdjacent,
            statusEffect: moveConfig.statusEffect
          }
        };
      }

      // Handle status transfer effects
      if (moveConfig.type === 'status_transfer') {
        // Psycho Shift - transfer user's status conditions to target
        const userStatusEffects = attacker.status_effects || [];
        
        if (userStatusEffects.length === 0) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it failed! ${userName} has no status condition to transfer!`,
            isStatusMove: true
          };
        }
        
        // Transfer all status conditions from user to target
        for (const statusEffect of userStatusEffects) {
          await StatusEffectManager.applyStatusEffect(
            battleId,
            actualTarget,
            statusEffect.type,
            statusEffect.duration
          );
        }
        
        // Remove status conditions from user if specified
        if (moveConfig.curesSelf) {
          await StatusEffectManager.removeAllStatusEffects(battleId, attacker);
        }
        
        let message = moveConfig.message(userName, targetName);
        return {
          hits: true,
          damage: 0,
          message: message,
          isStatusMove: true,
          additionalEffects: {
            statusTransfer: true,
            transferredEffects: userStatusEffects.map(effect => effect.type),
            curedSelf: moveConfig.curesSelf
          }
        };
      }

      // Apply status effect
      const statusResult = await StatusEffectManager.applyStatusEffect(
        battleId,
        actualTarget,
        moveConfig.statusEffect,
        moveConfig.duration
      );

      let message = moveConfig.message(userName, targetName);
      if (statusResult.success) {
        message += `\n${statusResult.message}`;
      }

      return {
        hits: true,
        damage: 0,
        message: message,
        isStatusMove: true,
        statusEffect: moveConfig.statusEffect
      };

    } catch (error) {
      console.error('Error executing status affliction move:', error);
      throw error;
    }
  }

  /**
   * Execute healing move
   * @param {Object} moveConfig - Move configuration
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Move result
   */
  async executeHealingMove(moveConfig, move, attacker, target, battleId) {
    try {
      // Validate moveConfig
      if (!moveConfig || typeof moveConfig !== 'object') {
        console.error(`Invalid moveConfig for healing move "${move.move_name}":`, moveConfig);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        return null;
      }

      // Check if move hits
      const accuracy = move.accuracy || 100;
      const hits = Math.random() * 100 <= accuracy;

      if (!hits) {
        return {
          hits: false,
          message: `${attacker.name || 'Attacker'}'s ${move.move_name} missed!`,
          isStatusMove: true
        };
      }

      // Determine actual target (healing moves usually target self)
      const actualTarget = moveConfig.target === 'self' ? attacker : target;
      const targetName = actualTarget.name || (actualTarget === attacker ? 'User' : 'Target');
      const userName = attacker.name || 'User';

      // Calculate heal amount
      let healAmount;
      if (moveConfig.type === 'healing_weather') {
        // Moonlight - healing varies by weather (simplified - would need weather system)
        const currentWeather = 'normal'; // This would come from battle state
        healAmount = moveConfig.healAmount(actualTarget, currentWeather);
      } else if (moveConfig.type === 'healing_terrain') {
        // Floral Healing - healing varies by terrain (simplified - would need terrain system)
        const currentTerrain = 'normal'; // This would come from battle state
        healAmount = moveConfig.healAmount(actualTarget, currentTerrain);
      } else {
        healAmount = moveConfig.healAmount(actualTarget);
      }
      
      // Apply healing
      const healResult = await BattleMonster.heal(actualTarget.id, healAmount);

      let message = moveConfig.message(userName, targetName);
      let additionalEffects = {};

      if (moveConfig.type === 'healing_type_change') {
        // Roost - temporarily lose Flying type
        if (moveConfig.loseFlying) {
          await StatusEffectManager.applyStatusEffect(battleId, actualTarget, 'roost', moveConfig.duration);
          additionalEffects.loseFlying = true;
        }
      } else if (moveConfig.type === 'team_healing_status_cure') {
        // Jungle Healing - heal team and cure status
        if (moveConfig.cureStatus) {
          // Cure all status conditions from team (simplified - would need team system)
          await StatusEffectManager.cureAllStatusEffects(battleId, actualTarget);
          additionalEffects.teamHealAndCure = true;
        }
      } else if (moveConfig.type === 'delayed_healing') {
        // Wish - apply delayed healing effect
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, 'wish', moveConfig.duration, {
          healAmount: healAmount,
          wishUser: userName
        });
        additionalEffects.delayedHealing = true;
        message += `\n🌟 ${userName} made a wish for ${targetName}!`;
        return {
          hits: true,
          damage: 0,
          healing: 0, // No immediate healing
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'status_cure') {
        // Refresh - cure status conditions without healing HP
        await StatusEffectManager.cureAllStatusEffects(battleId, actualTarget);
        additionalEffects.statusCure = true;
        message += `\n✨ ${targetName} was cured of all status conditions!`;
        return {
          hits: true,
          damage: 0,
          healing: 0, // No HP healing for Refresh
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'healing_cure_status') {
        // Purify - cure target's status and heal both user and target
        const targetHasStatus = actualTarget.status_effects && actualTarget.status_effects.length > 0;
        if (!targetHasStatus) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it failed! ${targetName} has no status conditions!`,
            isStatusMove: true
          };
        }
        
        // Cure target's status conditions
        await StatusEffectManager.cureAllStatusEffects(battleId, actualTarget);
        
        // Heal both target and user
        const targetHealResult = await BattleMonster.heal(actualTarget.id, healAmount);
        const userHealAmount = Math.floor(attacker.max_hp * 0.5);
        const userHealResult = await BattleMonster.heal(attacker.id, userHealAmount);
        
        message = `${userName} used Purify! ${targetName} was cured and recovered ${targetHealResult.heal_amount} HP! ${userName} also recovered ${userHealResult.heal_amount} HP!`;
        additionalEffects.purify = {
          curedStatus: true,
          targetHealing: targetHealResult.heal_amount,
          userHealing: userHealResult.heal_amount
        };
        
        return {
          hits: true,
          damage: 0,
          healing: targetHealResult.heal_amount + userHealResult.heal_amount,
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'healing_target') {
        // Heal Pulse - heal another target
        const healResult = await BattleMonster.heal(actualTarget.id, healAmount);
        
        message = moveConfig.message(userName, targetName);
        additionalEffects.targetHealing = {
          healAmount: healResult.heal_amount,
          target: 'other'
        };
        
        return {
          hits: true,
          damage: 0,
          healing: healResult.heal_amount,
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'healing_stockpile') {
        // Swallow - heal based on Stockpile stacks
        let stockpileStacks = 0;
        
        // Check for stockpile stacks
        const stockpileEffect = actualTarget.status_effects?.find(e => e.type === 'stockpile');
        if (stockpileEffect) {
          stockpileStacks = stockpileEffect.data?.stacks || 0;
        }
        
        if (stockpileStacks === 0) {
          return {
            hits: false,
            message: `${userName} used ${move.move_name}, but it failed! No power was stockpiled!`,
            isStatusMove: true
          };
        }
        
        // Calculate healing based on stacks
        healAmount = moveConfig.healAmount(actualTarget, stockpileStacks);
        
        // Apply healing
        const healResult = await BattleMonster.heal(actualTarget.id, healAmount);
        
        // Remove stockpile effect
        if (moveConfig.consumeStockpile) {
          await StatusEffectManager.removeStatusEffect(battleId, actualTarget, 'stockpile');
        }
        
        additionalEffects.stockpileConsumed = stockpileStacks;
        message = moveConfig.message(userName, stockpileStacks);
        message += `\n💚 **${targetName}** recovered ${healResult.heal_amount || healAmount} HP!`;
        
        return {
          hits: true,
          damage: 0,
          healing: healResult.heal_amount || healAmount,
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'team_status_cure') {
        // Heal Bell - cure all team status conditions without healing HP
        
        // Cure status for entire team (simplified - would need team system)
        await StatusEffectManager.cureAllStatusEffects(battleId, actualTarget);
        
        additionalEffects.teamStatusCure = true;
        message += `\n🔔 The team was cured of all status conditions!`;
        
        return {
          hits: true,
          damage: 0,
          healing: 0, // No HP healing for Heal Bell
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'sacrifice_heal') {
        // Lunar Dance, Healing Wish - user faints to heal next Pokémon
        
        // Mark the user as sacrificing for healing
        await StatusEffectManager.applyStatusEffect(battleId, attacker, 'sacrifice_heal', 1, {
          healAmount: healAmount,
          cureStatus: moveConfig.cureStatus || false,
          sacrificeUser: userName
        });
        
        // Faint the user
        await BattleMonster.update(attacker.id, {
          current_hp: 0,
          is_fainted: true
        });
        
        additionalEffects.sacrifice = {
          healAmount: healAmount,
          cureStatus: moveConfig.cureStatus || false
        };
        
        return {
          hits: true,
          damage: 0,
          healing: 0, // No immediate healing - saved for next Pokémon
          message: moveConfig.message(userName),
          isStatusMove: true,
          additionalEffects: additionalEffects,
          userFaints: true
        };
      } else if (moveConfig.type === 'healing_sleep') {
        // Rest - full heal but fall asleep
        
        // Apply full healing
        const fullHealResult = await BattleMonster.heal(actualTarget.id, healAmount);
        
        // Apply sleep status
        await StatusEffectManager.applyStatusEffect(battleId, actualTarget, moveConfig.statusEffect, moveConfig.duration);
        
        additionalEffects.restHealing = {
          healAmount: fullHealResult.heal_amount,
          statusEffect: moveConfig.statusEffect
        };
        
        return {
          hits: true,
          damage: 0,
          healing: fullHealResult.heal_amount,
          message: moveConfig.message(userName),
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else if (moveConfig.type === 'healing_user_and_ally') {
        // Lunar Blessing - heal both user and ally
        const userHealAmount = moveConfig.healAmount(attacker);
        const allyHealAmount = moveConfig.healAmount(actualTarget);
        
        // Heal user
        const userHealResult = await BattleMonster.heal(attacker.id, userHealAmount);
        
        // Heal ally (actualTarget should be ally)
        const allyHealResult = await BattleMonster.heal(actualTarget.id, allyHealAmount);
        
        additionalEffects.dualHealing = {
          userHealing: userHealResult.heal_amount,
          allyHealing: allyHealResult.heal_amount
        };
        
        message = moveConfig.message(userName, targetName);
        message += `\n💚 **${userName}** recovered ${userHealResult.heal_amount} HP!`;
        message += `\n💚 **${targetName}** recovered ${allyHealResult.heal_amount} HP!`;
        
        return {
          hits: true,
          damage: 0,
          healing: (userHealResult.heal_amount || 0) + (allyHealResult.heal_amount || 0),
          message: message,
          isStatusMove: true,
          additionalEffects: additionalEffects
        };
      } else {
        message += `\n💚 **${targetName}** recovered ${healResult.heal_amount || healAmount} HP!`;
      }

      return {
        hits: true,
        damage: 0,
        healing: healResult.heal_amount || healAmount,
        message: message,
        isStatusMove: true,
        additionalEffects: additionalEffects
      };

    } catch (error) {
      console.error('Error executing healing move:', error);
      throw error;
    }
  }

  /**
   * Execute other status moves (terrain, weather, etc.)
   * @param {Object} moveConfig - Move configuration
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Move result
   */
  async executeOtherMove(moveConfig, move, attacker, target, battleId) {
    try {
      // Validate moveConfig
      if (!moveConfig || typeof moveConfig !== 'object') {
        console.error(`Invalid moveConfig for other move "${move.move_name}":`, moveConfig);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        return null;
      }

      // Check if move hits
      const accuracy = move.accuracy || 100;
      const hits = Math.random() * 100 <= accuracy;

      if (!hits) {
        return {
          hits: false,
          message: `${attacker.name || 'Attacker'}'s ${move.move_name} missed!`,
          isStatusMove: true
        };
      }

      const userName = attacker.name || 'User';
      const targetName = target.name || 'Target';
      let message = moveConfig.message(userName);
      let additionalEffects = {};

      // Handle specific move types
      switch (moveConfig.type) {
        case 'trap':
          // Spider Web - trap the opponent
          await StatusEffectManager.applyStatusEffect(battleId, target, 'trapped', moveConfig.duration);
          additionalEffects.trapped = true;
          break;

        case 'powder':
          // Powder - set up powder protection on opponent
          await StatusEffectManager.applyStatusEffect(battleId, target, 'powder', moveConfig.duration);
          additionalEffects.powder = true;
          break;

        case 'redirect':
          // Rage Powder - redirect attacks to self
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'rage_powder', moveConfig.duration);
          additionalEffects.redirect = true;
          break;

        case 'protection_debuff':
          // Silk Trap - protect self and prepare speed debuff for attacker
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'silk_trap', moveConfig.duration);
          additionalEffects.protection = true;
          additionalEffects.speedDebuff = moveConfig.speedDebuff;
          break;

        case 'entry_hazard':
          // Sticky Web - set up entry hazard
          await StatusEffectManager.applyStatusEffect(battleId, null, 'sticky_web', moveConfig.duration, { side: 'opponent' });
          additionalEffects.hazard = true;
          break;

        case 'disable_items':
          // Embargo - prevent item usage
          await StatusEffectManager.applyStatusEffect(battleId, target, 'embargo', moveConfig.duration);
          additionalEffects.embargo = true;
          break;

        case 'disable_repeat':
          // Torment - prevent repeating moves
          await StatusEffectManager.applyStatusEffect(battleId, target, 'torment', moveConfig.duration);
          additionalEffects.torment = true;
          break;

        case 'sacrifice_debuff':
          // Memento - sacrifice self to debuff opponent
          // Apply stat debuff to opponent
          let statModifications = target.stat_modifications || {};
          for (const [stat, change] of Object.entries(moveConfig.stats)) {
            if (!statModifications[stat]) {
              statModifications[stat] = 0;
            }
            statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
          }
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              stat_modifications: statModifications
            }
          });
          // Sacrifice the user
          await BattleMonster.update(attacker.id, { current_hp: 0 });
          additionalEffects.sacrifice = true;
          additionalEffects.statDebuff = moveConfig.stats;
          break;

        case 'protection_debuff':
          // Obstruct - protect self and prepare debuff for attacker
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'obstruct', moveConfig.duration);
          additionalEffects.protection = true;
          additionalEffects.defenseDebuff = moveConfig.defenseDebuff;
          break;

        case 'swap_items':
          // Switcheroo - swap items between user and target
          // This would need item system integration
          additionalEffects.itemSwap = true;
          break;

        case 'steal_move':
          // Snatch - steal next status move
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'snatch', moveConfig.duration);
          additionalEffects.snatch = true;
          break;

        case 'priority_control':
          // Quash - force opponent to move last
          await StatusEffectManager.applyStatusEffect(battleId, target, 'quash', moveConfig.duration);
          additionalEffects.quash = true;
          break;

        case 'reverse_stats':
          // Topsy Turvy - reverse all stat modifications
          let targetStats = target.stat_modifications || {};
          for (const [stat, value] of Object.entries(targetStats)) {
            targetStats[stat] = -value;
          }
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              stat_modifications: targetStats
            }
          });
          additionalEffects.statReversal = true;
          break;

        case 'disable_status':
          // Taunt - prevent status moves
          await StatusEffectManager.applyStatusEffect(battleId, target, 'taunt', moveConfig.duration);
          additionalEffects.taunt = true;
          break;

        case 'critical_boost':
          // Dragon Cheer - boost critical hit ratio for allies
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'dragon_cheer', moveConfig.duration);
          additionalEffects.criticalBoost = true;
          break;

        case 'charge_up':
          // Charge - boost next Electric move and raise Special Defense
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'charge', moveConfig.duration);
          // Also boost Special Defense
          let chargeStatMods = attacker.stat_modifications || {};
          if (!chargeStatMods.special_defense) {
            chargeStatMods.special_defense = 0;
          }
          chargeStatMods.special_defense = Math.max(-6, Math.min(6, chargeStatMods.special_defense + 1));
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              stat_modifications: chargeStatMods
            }
          });
          additionalEffects.charge = true;
          additionalEffects.statBoost = { special_defense: 1 };
          break;

        case 'type_change':
          // Electrify - change opponent's next move to Electric type
          await StatusEffectManager.applyStatusEffect(battleId, target, 'electrify', moveConfig.duration);
          additionalEffects.typeChange = moveConfig.changeType;
          break;

        case 'ally_boost':
          // Magnetic Flux - boost allies with specific types
          // This would need multi-battle support for full implementation
          additionalEffects.allyBoost = {
            stats: moveConfig.stats,
            typeRestriction: moveConfig.typeRestriction
          };
          break;

        case 'move_type_change':
          // Ion Deluge - change Normal moves to Electric for the turn
          await StatusEffectManager.applyStatusEffect(battleId, null, 'ion_deluge', moveConfig.duration, { 
            field: true,
            changeFrom: moveConfig.changeFrom,
            changeTo: moveConfig.changeTo 
          });
          additionalEffects.fieldTypeChange = {
            from: moveConfig.changeFrom,
            to: moveConfig.changeTo
          };
          break;

        case 'levitate':
          // Magnet Rise - levitate the user
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'magnet_rise', moveConfig.duration);
          additionalEffects.levitate = true;
          break;

        case 'terrain':
          // Electric Terrain, Misty Terrain and other terrain moves
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { field: true });
          additionalEffects.terrain = moveConfig.effect;
          break;

        case 'team_protection':
          // Crafty Shield - protect team from status moves
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            team: true,
            protectFrom: moveConfig.protectFrom 
          });
          additionalEffects.teamProtection = moveConfig.protectFrom;
          break;

        case 'field_lock':
          // Fairy Lock - prevent switching
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            field: true,
            preventSwitching: moveConfig.preventSwitching 
          });
          additionalEffects.fieldLock = true;
          break;

        case 'protection':
          // Detect - individual protection
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.protection = true;
          break;

        case 'team_protection_first_turn':
          // Mat Block - team protection only on first turn
          if (moveConfig.firstTurnOnly) {
            // Check if this is first turn (would need battle state tracking)
            await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
              team: true,
              protectFrom: moveConfig.protectFrom,
              firstTurnOnly: true
            });
            additionalEffects.teamProtectionFirstTurn = moveConfig.protectFrom;
          }
          break;

        case 'protection_burn':
          // Burning Bulwark - protection with burn on contact
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.protectionBurn = moveConfig.contactEffect;
          break;

        case 'weather':
          // Sunny Day - change weather
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            field: true,
            weather: moveConfig.weather 
          });
          additionalEffects.weather = moveConfig.weather;
          break;

        case 'team_speed_boost':
          // Tailwind - boost team speed
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            team: true,
            speedMultiplier: moveConfig.speedMultiplier 
          });
          additionalEffects.teamSpeedBoost = moveConfig.speedMultiplier;
          break;

        case 'copy_move':
          // Mirror Move - copy last move used (simplified implementation)
          additionalEffects.copyLastMove = true;
          break;

        case 'hazard_removal':
          // Defog - remove hazards and lower evasion
          // Remove hazards (simplified - would need hazard system)
          if (moveConfig.stats) {
            let statMods = target.stat_modifications || {};
            for (const [stat, change] of Object.entries(moveConfig.stats)) {
              if (!statMods[stat]) {
                statMods[stat] = 0;
              }
              statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));
            }
            await BattleMonster.update(target.id, {
              monster_data: {
                ...target.monster_data,
                stat_modifications: statMods
              }
            });
          }
          additionalEffects.defog = {
            removeHazards: moveConfig.removeHazards,
            statChange: moveConfig.stats
          };
          break;

        case 'pp_reduction':
          // Spite - reduce PP of last move
          additionalEffects.spitePP = {
            reduction: moveConfig.ppReduction,
            targetLastMove: moveConfig.targetLastMove
          };
          break;

        case 'pp_zero_on_ko':
          // Grudge - zero PP if user faints
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.grudge = true;
          break;

        case 'add_type':
          // Trick-or-Treat - add Ghost type
          await StatusEffectManager.applyStatusEffect(battleId, target, moveConfig.effect, -1); // Permanent
          additionalEffects.addType = moveConfig.addType;
          break;

        case 'destiny_bond':
          // Destiny Bond - faint together
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.destinyBond = true;
          break;

        case 'protection_damage':
          // Spiky Shield - protection with contact damage
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.protectionDamage = moveConfig.contactDamage;
          break;

        case 'team_status_cure':
          // Aromatherapy - cure team of all status conditions
          // This would need team system for full implementation
          await StatusEffectManager.cureAllStatusEffects(battleId, attacker);
          additionalEffects.teamStatusCure = true;
          break;

        case 'ingrain':
          // Ingrain - heal each turn but become trapped
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration);
          additionalEffects.ingrain = {
            healPerTurn: moveConfig.healPerTurn,
            trapped: moveConfig.trapSelf
          };
          break;

        case 'ability_change':
          // Worry Seed - change opponent's ability
          await StatusEffectManager.applyStatusEffect(battleId, target, moveConfig.effect, -1); // Permanent
          additionalEffects.abilityChange = moveConfig.changeAbility;
          break;

        case 'field_effect':
          // Mud Sport - weaken Electric moves
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            field: true,
            weakenElectricMoves: moveConfig.weakenElectricMoves 
          });
          additionalEffects.fieldEffect = moveConfig.effect;
          break;

        case 'entry_hazard':
          // Spikes - set up entry hazard
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            field: true,
            side: 'opponent',
            layers: moveConfig.layers,
            damagePercent: moveConfig.damagePercent
          });
          additionalEffects.entryHazard = moveConfig.effect;
          break;

        case 'weather_switch':
          // Chilly Reception - change weather and switch out
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            field: true,
            weather: moveConfig.weather 
          });
          additionalEffects.weather = moveConfig.weather;
          additionalEffects.switchOut = moveConfig.switchOut;
          break;

        case 'team_damage_reduction':
          // Aurora Veil - reduce damage for team
          if (moveConfig.requiresSnow) {
            // Check for snow weather (simplified - would need weather system)
            const currentWeather = 'normal'; // This would come from battle state
            if (currentWeather !== 'snow' && currentWeather !== 'hail') {
              return {
                hits: false,
                message: `${userName} used ${move.move_name}, but it failed! Aurora Veil requires snow or hail!`,
                isStatusMove: true
              };
            }
          }
          await StatusEffectManager.applyStatusEffect(battleId, null, moveConfig.effect, moveConfig.duration, { 
            team: true,
            damageReduction: moveConfig.damageReduction 
          });
          additionalEffects.teamDamageReduction = moveConfig.damageReduction;
          break;

        case 'critical_prevention':
          // Lucky Chant - prevent critical hits
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'lucky_chant', moveConfig.duration);
          additionalEffects.criticalPrevention = true;
          break;

        case 'force_switch':
          // Whirlwind - force opponent to switch out
          await StatusEffectManager.applyStatusEffect(battleId, target, 'whirlwind', 1);
          additionalEffects.forceSwitch = true;
          break;

        case 'consume_berries':
          // Teatime - force all Pokemon to consume held berries
          additionalEffects.teatime = {
            consumeAllBerries: moveConfig.consumeAll
          };
          break;

        case 'type_change_terrain':
          // Camouflage - change user's type to match terrain
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'camouflage', -1, { newType: moveConfig.changeType });
          additionalEffects.typeChange = moveConfig.changeType;
          break;

        case 'ability_copy':
          // Entrainment - copy user's ability to target
          additionalEffects.abilityCopy = {
            fromUser: attacker.name || 'User',
            toTarget: target.name || 'Target',
            ability: moveConfig.copyAbility
          };
          break;

        case 'random_team_move':
          // Assist - use random move from team
          additionalEffects.randomTeamMove = {
            excludedMoves: moveConfig.excludedMoves
          };
          break;

        case 'swap_field_effects':
          // Court Change - swap field effects between sides
          additionalEffects.swapFieldEffects = {
            effects: ['spikes', 'toxic_spikes', 'stealth_rock', 'sticky_web', 'reflect', 'light_screen', 'aurora_veil', 'tailwind']
          };
          break;

        case 'type_copy':
          // Reflect Type - copy opponent's type
          const targetType1 = target.monster_data?.type1 || 'Normal';
          const targetType2 = target.monster_data?.type2 || null;
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'reflect_type', -1, {
            newType1: targetType1,
            newType2: targetType2
          });
          additionalEffects.typeCopy = { type1: targetType1, type2: targetType2 };
          break;

        case 'ally_boost':
          // Helping Hand - boost ally's next move
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'helping_hand', moveConfig.duration, {
            powerBoost: moveConfig.boostNextMove
          });
          additionalEffects.allyBoost = moveConfig.boostNextMove;
          break;

        case 'no_effect':
          // Splash - literally does nothing
          additionalEffects.noEffect = true;
          break;

        case 'copy_last_move':
          // Copycat - copy the last move used in battle
          additionalEffects.copyLastMove = {
            moveType: 'last_used'
          };
          break;

        case 'hazard_removal_stat_boost':
          // Tidy Up - remove hazards and boost stats
          // Remove hazards (simplified - would need hazard system)
          additionalEffects.hazardRemoval = moveConfig.removeHazards;
          
          // Apply stat boosts
          let tidyStatMods = attacker.stat_modifications || {};
          for (const [stat, change] of Object.entries(moveConfig.stats)) {
            if (!tidyStatMods[stat]) {
              tidyStatMods[stat] = 0;
            }
            tidyStatMods[stat] = Math.max(-6, Math.min(6, tidyStatMods[stat] + change));
          }
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              stat_modifications: tidyStatMods
            }
          });
          additionalEffects.statBoost = moveConfig.stats;
          break;

        case 'identify_ghost':
          // Foresight - remove evasion and allow Normal/Fighting vs Ghost
          await StatusEffectManager.applyStatusEffect(battleId, target, 'foresight', moveConfig.duration, {
            removeEvasion: moveConfig.removeEvasion,
            allowNormalVsGhost: moveConfig.allowNormalVsGhost
          });
          additionalEffects.identify = {
            removeEvasion: moveConfig.removeEvasion,
            allowNormalVsGhost: moveConfig.allowNormalVsGhost
          };
          break;

        case 'double_prize_money':
          // Happy Hour - double prize money for battle
          await StatusEffectManager.applyStatusEffect(battleId, null, 'happy_hour', moveConfig.duration);
          additionalEffects.happyHour = true;
          break;

        case 'max_protection':
          // Max Guard - protect from Max Moves only
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'max_guard', moveConfig.duration);
          additionalEffects.maxProtection = true;
          break;

        case 'revive_ally':
          // Revival Blessing - revive a fainted ally
          additionalEffects.reviveAlly = {
            hpPercent: moveConfig.reviveHpPercent
          };
          break;

        case 'random_move':
          // Metronome - use completely random move
          additionalEffects.randomMove = {
            excludedMoves: moveConfig.excludedMoves
          };
          break;

        case 'sleep_move':
          // Sleep Talk - use random known move while asleep
          const isSleeping = await StatusEffectManager.hasStatusEffect(attacker, 'sleep');
          if (!isSleeping) {
            return {
              hits: false,
              message: `${userName} used ${move.move_name}, but it failed! ${userName} is not asleep!`,
              isStatusMove: true
            };
          }
          additionalEffects.sleepMove = {
            useRandomKnownMove: moveConfig.useRandomKnownMove
          };
          break;

        case 'no_battle_effect':
          // Hold Hands, Celebrate - no battle effect
          additionalEffects.noBattleEffect = true;
          break;

        case 'restore_item':
          // Recycle - restore last used item
          additionalEffects.restoreItem = {
            restoreLastUsed: moveConfig.restoreLastUsedItem
          };
          break;

        case 'priority_copy':
          // Me First - copy opponent's move with priority and power boost
          additionalEffects.priorityCopy = {
            powerBoost: moveConfig.powerBoost,
            priority: moveConfig.priority
          };
          break;

        case 'protection':
          // Protect - protect from all moves for one turn
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'protect', moveConfig.duration);
          additionalEffects.protection = {
            protectFromAll: moveConfig.protectFromAllMoves,
            priority: moveConfig.priority
          };
          break;

        case 'critical_guarantee':
          // Laser Focus - guarantee critical hit on next move
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'laser_focus', moveConfig.duration);
          additionalEffects.criticalGuarantee = true;
          break;

        case 'permanent_copy':
          // Sketch - permanently learn opponent's last move
          additionalEffects.permanentCopy = {
            copyLastMove: moveConfig.copyLastMove,
            permanentLearn: moveConfig.permanentLearn
          };
          break;

        case 'trap_prevent_switch':
          // Block, Mean Look - prevent opponent from switching
          await StatusEffectManager.applyStatusEffect(battleId, target, moveConfig.effect, moveConfig.duration);
          additionalEffects.trapPreventSwitch = true;
          break;

        case 'survive_lethal':
          // Endure - survive any attack with at least 1 HP
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'endure', moveConfig.duration);
          additionalEffects.surviveLethal = {
            priority: moveConfig.priority
          };
          break;

        case 'create_substitute':
          // Substitute - create substitute with 25% HP
          const subHpCost = Math.floor(attacker.max_hp * moveConfig.hpCost);
          if (attacker.current_hp <= subHpCost) {
            return {
              hits: false,
              message: `${userName} doesn't have enough HP to create a substitute!`,
              isStatusMove: true
            };
          }
          
          // Pay HP cost
          await BattleMonster.dealDamage(attacker.id, subHpCost);
          
          // Create substitute effect
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'substitute', -1, {
            hp: subHpCost
          });
          
          additionalEffects.substitute = {
            hpCost: subHpCost,
            hp: subHpCost
          };
          break;

        case 'type_change_move':
          // Conversion - change type to first move's type
          const firstMove = attacker.moves?.[0]; // Get first move
          const newType = firstMove?.type || 'Normal';
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'conversion', -1, {
            newType: newType
          });
          message = moveConfig.message(userName, newType);
          additionalEffects.typeChange = newType;
          break;

        case 'give_item':
          // Bestow - give held item to target
          if (!attacker.held_item) {
            return {
              hits: false,
              message: `${userName} used ${move.move_name}, but it has no item to give!`,
              isStatusMove: true
            };
          }
          
          if (target.held_item) {
            return {
              hits: false,
              message: `${userName} used ${move.move_name}, but ${target.name || 'Target'} is already holding an item!`,
              isStatusMove: true
            };
          }
          
          // Transfer item
          const itemToGive = attacker.held_item;
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              held_item: null
            }
          });
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              held_item: itemToGive
            }
          });
          
          additionalEffects.itemGiven = itemToGive;
          break;

        case 'copy_appearance':
          // Transform - copy target's appearance, moves, stats, and type
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'transform', -1, {
            targetData: {
              appearance: target.monster_data,
              moves: target.moves,
              stats: target.base_stats,
              type1: target.monster_data?.type1,
              type2: target.monster_data?.type2
            }
          });
          additionalEffects.transform = {
            target: target.name || 'Target'
          };
          break;

        case 'force_target':
          // Spotlight - force all attacks to target this Pokemon
          await StatusEffectManager.applyStatusEffect(battleId, target, 'spotlight', moveConfig.duration);
          additionalEffects.forceTarget = {
            priority: moveConfig.priority
          };
          break;

        case 'force_switch_negative_priority':
          // Roar - force opponent to switch with negative priority
          await StatusEffectManager.applyStatusEffect(battleId, target, 'roar', 1);
          additionalEffects.forceSwitch = {
            priority: moveConfig.priority,
            negative: true
          };
          break;

        case 'switch_pass_effects':
          // Baton Pass - switch and pass stat changes/status effects
          additionalEffects.batonPass = {
            passStatChanges: moveConfig.passStatChanges,
            passStatusEffects: moveConfig.passStatusEffects,
            switchUser: moveConfig.switchUser
          };
          break;

        case 'temporary_copy_move':
          // Mimic - temporarily learn opponent's last move
          additionalEffects.temporaryCopy = {
            copyLastMove: moveConfig.copyLastMove,
            temporaryLearn: moveConfig.temporaryLearn,
            duration: moveConfig.duration
          };
          break;

        case 'force_repeat_move':
          // Encore - force opponent to repeat their last move
          await StatusEffectManager.applyStatusEffect(battleId, target, 'encore', moveConfig.duration);
          additionalEffects.forceRepeat = {
            duration: moveConfig.duration
          };
          break;

        case 'copy_ability':
          // Doodle - copy target's ability to user's team
          const targetAbility = target.monster_data?.ability || 'Unknown';
          additionalEffects.copyAbility = {
            ability: targetAbility,
            applyToTeam: moveConfig.applyToTeam
          };
          message = moveConfig.message(userName, target.name || 'Target', targetAbility);
          break;

        case 'priority_boost_target':
          // After You - make target move next
          await StatusEffectManager.applyStatusEffect(battleId, target, 'after_you', 1);
          additionalEffects.priorityBoost = {
            makeTargetMoveNext: moveConfig.makeTargetMoveNext
          };
          break;

        case 'terrain_dependent_move':
          // Nature Power - becomes different move based on terrain
          const currentTerrain = 'normal'; // This would come from battle state
          const resultingMove = moveConfig.becomesMove[currentTerrain] || moveConfig.becomesMove.normal;
          additionalEffects.naturePower = {
            terrain: currentTerrain,
            becomesMove: resultingMove
          };
          message = moveConfig.message(userName, resultingMove);
          break;

        case 'perish_countdown':
          // Perish Song - all Pokemon faint after 3 turns
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'perish_song', moveConfig.perishCountdown);
          await StatusEffectManager.applyStatusEffect(battleId, target, 'perish_song', moveConfig.perishCountdown);
          additionalEffects.perishSong = {
            countdown: moveConfig.perishCountdown,
            affectsAll: moveConfig.affectsAll
          };
          break;

        case 'disable_move':
          // Disable - prevent use of opponent's last move
          const lastMove = target.lastMoveUsed || 'Unknown Move'; // Would need to track this
          await StatusEffectManager.applyStatusEffect(battleId, target, 'disable', moveConfig.duration, {
            disabledMove: lastMove
          });
          additionalEffects.disable = {
            disabledMove: lastMove,
            duration: moveConfig.duration
          };
          message = moveConfig.message(userName, target.name || 'Target', lastMove);
          break;

        case 'critical_buff':
          // Focus Energy - increase critical hit ratio
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'focus_energy', moveConfig.duration);
          additionalEffects.criticalBuff = true;
          break;

        case 'team_protection':
          // Safeguard - protect team from status conditions
          await StatusEffectManager.applyStatusEffect(battleId, null, 'safeguard', moveConfig.duration, { 
            team: true,
            protectFrom: moveConfig.protectFrom 
          });
          additionalEffects.safeguard = moveConfig.protectFrom;
          break;

        case 'type_change_resist':
          // Conversion 2 - change type to resist opponent's last move
          // This would need battle history to determine last move type used
          const resistantType = 'Normal'; // Simplified - would calculate based on last move
          message = moveConfig.message(userName, resistantType);
          additionalEffects.typeChangeResist = resistantType;
          break;

        case 'ability_change':
          // Simple Beam - change target's ability
          await StatusEffectManager.applyStatusEffect(battleId, target, 'simple_beam', -1); // Permanent
          additionalEffects.abilityChange = moveConfig.changeAbility;
          break;

        case 'hp_average':
          // Pain Split - average HP between user and target
          const userCurrentHP = attacker.current_hp;
          const targetCurrentHP = target.current_hp;
          const averageHP = Math.floor((userCurrentHP + targetCurrentHP) / 2);
          
          // Set both monsters to the average HP
          await BattleMonster.update(attacker.id, { current_hp: Math.min(averageHP, attacker.max_hp) });
          await BattleMonster.update(target.id, { current_hp: Math.min(averageHP, target.max_hp) });
          
          message = moveConfig.message(userName, targetName, averageHP, averageHP);
          additionalEffects.painSplit = {
            previousUserHP: userCurrentHP,
            previousTargetHP: targetCurrentHP,
            newHP: averageHP
          };
          break;

        case 'substitute_switch':
          // Shed Tail - create substitute and force switch
          const shedTailHpCost = Math.floor(attacker.max_hp * moveConfig.hpCost);
          if (attacker.current_hp <= shedTailHpCost) {
            return {
              hits: false,
              message: `${userName} doesn't have enough HP to use ${move.move_name}!`,
              isStatusMove: true
            };
          }
          
          // Pay HP cost and create substitute
          await BattleMonster.dealDamage(attacker.id, shedTailHpCost);
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'shed_tail', -1, {
            hp: shedTailHpCost
          });
          
          additionalEffects.shedTail = {
            hpCost: shedTailHpCost,
            forceSwitch: moveConfig.forceSwitch,
            substituteHP: shedTailHpCost
          };
          break;

        case 'redirect_all':
          // Follow Me - redirect all attacks to user
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'follow_me', moveConfig.duration);
          additionalEffects.followMe = {
            redirectAttacks: moveConfig.redirectAttacks,
            priority: moveConfig.priority
          };
          break;

        case 'guarantee_next_hit':
          // Lock On / Mind Reader - guarantee next move hits
          await StatusEffectManager.applyStatusEffect(battleId, attacker, moveConfig.effect, moveConfig.duration, {
            target: target.id
          });
          additionalEffects.guaranteeHit = {
            targetId: target.id,
            moveType: moveConfig.effect
          };
          break;

        case 'protection_poison':
          // Baneful Bunker - protect and poison on contact
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'baneful_bunker', moveConfig.duration);
          additionalEffects.banefulBunker = {
            protection: moveConfig.protection,
            contactEffect: moveConfig.contactEffect,
            priority: moveConfig.priority
          };
          break;

        case 'destroy_items':
          // Corrosive Gas - destroy all held items
          await StatusEffectManager.applyStatusEffect(battleId, null, 'corrosive_gas', moveConfig.duration, { 
            field: true,
            destroyAllItems: true
          });
          additionalEffects.corrosiveGas = {
            destroyItems: moveConfig.destroyHeldItems,
            affectsAll: moveConfig.affectsAll
          };
          break;

        case 'entry_hazard_poison':
          // Toxic Spikes - set up poisoning entry hazard
          await StatusEffectManager.applyStatusEffect(battleId, null, 'toxic_spikes', moveConfig.duration, { 
            field: true,
            side: 'opponent',
            layers: moveConfig.layers,
            maxLayers: moveConfig.maxLayers,
            hazardType: moveConfig.hazardType
          });
          additionalEffects.toxicSpikes = {
            hazardType: moveConfig.hazardType,
            layers: moveConfig.layers,
            maxLayers: moveConfig.maxLayers
          };
          break;

        case 'suppress_ability':
          // Gastro Acid - suppress target's ability
          await StatusEffectManager.applyStatusEffect(battleId, target, 'gastro_acid', moveConfig.duration);
          additionalEffects.gastroAcid = {
            suppressAbility: moveConfig.suppressAbility
          };
          break;

        case 'reflect_status':
          // Magic Coat - reflect status moves
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'magic_coat', moveConfig.duration);
          additionalEffects.magicCoat = {
            reflectStatusMoves: moveConfig.reflectStatusMoves,
            priority: moveConfig.priority
          };
          break;

        case 'disable_moves':
          // Imprison - prevent opponent from using shared moves
          await StatusEffectManager.applyStatusEffect(battleId, target, 'imprison', moveConfig.duration, {
            imprisonUser: userName,
            sharedMoves: attacker.moves || [] // List of moves user knows
          });
          additionalEffects.imprison = {
            disableSharedMoves: moveConfig.disableSharedMoves,
            imprisonedBy: userName
          };
          break;

        case 'team_barrier':
          // Reflect - create team barrier against physical moves
          await StatusEffectManager.applyStatusEffect(battleId, null, 'reflect', moveConfig.duration, {
            team: true,
            side: 'players',
            barrierType: moveConfig.barrierType,
            damageReduction: moveConfig.damageReduction
          });
          additionalEffects.teamBarrier = {
            barrierType: moveConfig.barrierType,
            damageReduction: moveConfig.damageReduction,
            duration: moveConfig.duration
          };
          break;

        case 'switch_positions':
          // Ally Switch - switch positions with ally
          await StatusEffectManager.applyStatusEffect(battleId, attacker, 'ally_switch', moveConfig.duration);
          additionalEffects.allySwitch = {
            switchPlaces: moveConfig.switchPlaces,
            priority: moveConfig.priority
          };
          break;

        case 'field_effect':
          // Magic Room, Trick Room - create field-wide effects
          if (moveConfig.effect === 'magic_room') {
            await StatusEffectManager.applyStatusEffect(battleId, null, 'magic_room', moveConfig.duration, {
              field: true,
              suppressItems: moveConfig.suppressItems
            });
            additionalEffects.magicRoom = {
              suppressItems: moveConfig.suppressItems,
              duration: moveConfig.duration
            };
          } else if (moveConfig.effect === 'trick_room') {
            await StatusEffectManager.applyStatusEffect(battleId, null, 'trick_room', moveConfig.duration, {
              field: true,
              reverseSpeed: moveConfig.reverseSpeed
            });
            additionalEffects.trickRoom = {
              reverseSpeed: moveConfig.reverseSpeed,
              duration: moveConfig.duration
            };
          }
          break;

        case 'disable_healing':
          // Heal Block - prevents healing moves and abilities
          await StatusEffectManager.applyStatusEffect(battleId, target, 'heal_block', moveConfig.duration);
          additionalEffects.healBlock = true;
          break;

        case 'force_repeat_last_move':
          // Instruct - makes target use its last move again
          await StatusEffectManager.applyStatusEffect(battleId, target, 'instruct', moveConfig.duration);
          additionalEffects.instruct = true;
          break;

        case 'identify_dark':
          // Miracle Eye - removes Dark-type immunity and evasion
          await StatusEffectManager.applyStatusEffect(battleId, target, 'miracle_eye', moveConfig.duration);
          additionalEffects.miracleEye = {
            removeDarkImmunity: true,
            ignoreEvasion: true
          };
          break;

        case 'escape_battle':
          // Teleport - allows escape from battle
          additionalEffects.escapeAttempt = true;
          // In a real implementation, this would trigger battle end logic
          break;

        case 'levitate_target':
          // Telekinesis - makes target unable to avoid attacks
          await StatusEffectManager.applyStatusEffect(battleId, target, 'telekinesis', moveConfig.duration);
          additionalEffects.telekinesis = {
            cannotAvoidAttacks: true,
            levitated: true
          };
          break;

        case 'field_effect_stat_swap':
          // Wonder Room - swaps all Defense and Sp.Defense stats
          await StatusEffectManager.applyStatusEffect(battleId, null, 'wonder_room', moveConfig.duration, {
            field: true,
            swapDefenseStats: true
          });
          additionalEffects.wonderRoom = {
            swapDefenseStats: true,
            duration: moveConfig.duration
          };
          break;

        case 'team_special_defense_boost':
          // Light Screen - raises team's Special Defense
          await StatusEffectManager.applyStatusEffect(battleId, null, 'light_screen', moveConfig.duration, {
            team: true,
            specialDefenseMultiplier: moveConfig.specialDefenseMultiplier
          });
          additionalEffects.lightScreen = {
            specialDefenseMultiplier: moveConfig.specialDefenseMultiplier,
            duration: moveConfig.duration
          };
          break;

        case 'type_change_target':
          // Magic Powder - changes target's type to Psychic
          await StatusEffectManager.applyStatusEffect(battleId, target, 'type_change', moveConfig.duration, {
            newType: moveConfig.changeType
          });
          additionalEffects.typeChange = {
            newType: moveConfig.changeType,
            target: 'opponent'
          };
          break;

        case 'ability_swap':
          // Skill Swap - swaps abilities with target
          const userAbility = attacker.monster_data?.ability || 'Unknown';
          
          // Swap abilities (simplified implementation)
          await BattleMonster.update(attacker.id, {
            monster_data: {
              ...attacker.monster_data,
              ability: targetAbility
            }
          });
          
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              ability: userAbility
            }
          });
          
          additionalEffects.abilitySwap = {
            userOriginalAbility: userAbility,
            targetOriginalAbility: targetAbility,
            userNewAbility: targetAbility,
            targetNewAbility: userAbility
          };
          break;

        case 'field_effect_gravity':
          // Gravity - grounds all Pokemon and increases accuracy
          await StatusEffectManager.applyStatusEffect(battleId, null, 'gravity', moveConfig.duration, {
            field: true,
            groundsFlying: moveConfig.groundsFlying,
            accuracyMultiplier: moveConfig.accuracyMultiplier
          });
          additionalEffects.gravity = {
            groundsFlying: moveConfig.groundsFlying,
            accuracyBoost: moveConfig.accuracyMultiplier,
            duration: moveConfig.duration
          };
          break;

        case 'team_protection_wide':
          // Wide Guard - protects team from multi-target moves
          await StatusEffectManager.applyStatusEffect(battleId, null, 'wide_guard', moveConfig.duration, {
            team: true,
            protectFrom: moveConfig.protectFrom,
            priority: moveConfig.priority
          });
          additionalEffects.wideGuard = {
            protectFrom: moveConfig.protectFrom,
            priority: moveConfig.priority
          };
          break;

        case 'speed_debuff_fire_weakness':
          // Tar Shot - lowers Speed and makes target weak to Fire
          // Apply speed debuff
          let targetStatMods = target.stat_modifications || {};
          for (const [stat, change] of Object.entries(moveConfig.stats)) {
            if (!targetStatMods[stat]) {
              targetStatMods[stat] = 0;
            }
            targetStatMods[stat] = Math.max(-6, Math.min(6, targetStatMods[stat] + change));
          }
          
          await BattleMonster.update(target.id, {
            monster_data: {
              ...target.monster_data,
              stat_modifications: targetStatMods
            }
          });
          
          // Apply fire weakness effect
          await StatusEffectManager.applyStatusEffect(battleId, target, 'fire_weakness', moveConfig.duration, {
            fireWeakness: moveConfig.fireWeakness
          });
          
          additionalEffects.tarShot = {
            speedDebuff: moveConfig.stats.speed,
            fireWeakness: moveConfig.fireWeakness
          };
          break;

        default:
          // Default handling for terrain, weather, etc.
          break;
      }
      
      // Log the effect to battle log
      await BattleLog.logSystem(battleId, `🌟 ${message}`);

      return {
        hits: true,
        damage: 0,
        message: message,
        isStatusMove: true,
        effect: moveConfig.effect,
        additionalEffects: additionalEffects
      };

    } catch (error) {
      console.error('Error executing other move:', error);
      throw error;
    }
  }

  /**
   * Execute special damage moves with additional effects
   * @param {Object} moveConfig - Move configuration
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Move result
   */
  async executeSpecialDamageMove(moveConfig, move, attacker, target, battleId) {
    try {
      // Validate moveConfig
      if (!moveConfig || typeof moveConfig !== 'object') {
        console.error(`Invalid moveConfig for special damage move "${move.move_name}":`, moveConfig);
        console.log(`Falling back to normal attack behavior with 50 power for move "${move.move_name}"`);
        return null;
      }

      // These moves still do damage, so we return a special marker
      // The damage calculator will handle the damage, but we'll add special effects

      const userName = attacker.name || 'User';
      const targetName = target.name || 'Target';

      // Return special move data that the damage calculator can use
      return {
        isSpecialDamageMove: true,
        moveConfig: moveConfig,
        specialEffects: {
          type: moveConfig.type,
          ...moveConfig
        },
        // Let damage calculation proceed normally
        proceedWithDamage: true,
        baseMessage: `${userName} used ${move.move_name}!`
      };

    } catch (error) {
      console.error('Error executing special damage move:', error);
      throw error;
    }
  }

  /**
   * Apply special effects after damage calculation
   * @param {Object} moveConfig - Move configuration
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @param {number} damageDealt - Damage that was dealt
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Effect result
   */
  async applySpecialDamageEffects(moveConfig, attacker, target, damageDealt, battleId) {
    try {
      const userName = attacker.name || 'User';
      const targetName = target.name || 'Target';
      let effectMessage = '';
      let healing = 0;

      switch (moveConfig.type) {
        case 'damage_heal':
          // Leech Life - heal based on damage dealt
          if (damageDealt > 0) {
            healing = Math.floor(damageDealt * (moveConfig.healPercent / 100));
            const BattleMonster = require('../models/BattleMonster');
            await BattleMonster.heal(attacker.id, healing);
            effectMessage = `\n💚 ${userName} recovered ${healing} HP!`;
          }
          break;

        case 'damage_status':
          // Leech Seed - apply status effect
          await StatusEffectManager.applyStatusEffect(battleId, target, moveConfig.statusEffect, moveConfig.duration);
          effectMessage = `\n🌱 ${targetName} was seeded!`;
          break;

        case 'damage_flinch':
          // Bite/Crunch - chance to flinch
          if (Math.random() * 100 < moveConfig.flinchChance) {
            // Apply flinch status (prevents next action)
            await StatusEffectManager.applyStatusEffect(battleId, target, 'flinch', 1);
            effectMessage = `\n😵 ${targetName} flinched!`;
          }
          break;

        case 'multi_hit':
          // Bullet Seed - multiple hits (handled in damage calculation)
          const hits = Math.floor(Math.random() * (moveConfig.maxHits - moveConfig.minHits + 1)) + moveConfig.minHits;
          effectMessage = `\n🎯 Hit ${hits} time(s)!`;
          break;

        case 'two_turn':
          // Dig/Bounce/Fly - two turn moves (simplified for now)
          effectMessage = `\n⏳ ${moveConfig.secondTurnMessage(userName, targetName)}`;
          break;
      }

      return {
        effectMessage,
        healing,
        success: true
      };

    } catch (error) {
      console.error('Error applying special damage effects:', error);
      return { effectMessage: '', healing: 0, success: false };
    }
  }

  /**
   * Check if a move is a status move
   * @param {string} moveName - Move name
   * @returns {boolean} Whether the move is a status move
   */
  isStatusMove(moveName) {
    return !!(
      this.statBuffDebuffMoves[moveName] ||
      this.statusAfflictionMoves[moveName] ||
      this.healingMoves[moveName] ||
      this.otherMoves[moveName] ||
      this.specialDamageMoves[moveName]
    );
  }
}

module.exports = new StatusMoveManager();
