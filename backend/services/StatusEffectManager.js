const BattleMonster = require('../models/BattleMonster');
const BattleLog = require('../models/BattleLog');

/**
 * StatusEffectManager service for handling status conditions in battle
 */
class StatusEffectManager {
  constructor() {
    // Status effect definitions
    this.statusEffects = {
      poison: {
        name: 'Poison',
        emoji: '☠️',
        damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 8)), // 1/8 max HP
        preventAction: false,
        duration: 3,
        curable: true
      },
      burn: {
        name: 'Burn',
        emoji: '🔥',
        damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 16)), // 1/16 max HP
        preventAction: false,
        duration: 3,
        curable: true
      },
      freeze: {
        name: 'Freeze',
        emoji: '🧊',
        damagePerTurn: () => 0,
        preventAction: true,
        thawChance: 20, // 20% chance to thaw each turn
        duration: 5,
        curable: true
      },
      paralysis: {
        name: 'Paralysis',
        emoji: '⚡',
        damagePerTurn: () => 0,
        preventAction: true,
        actionChance: 25, // 25% chance to be unable to act
        duration: 4,
        curable: true
      },
      sleep: {
        name: 'Sleep',
        emoji: '😴',
        damagePerTurn: () => 0,
        preventAction: true,
        wakeChance: 33, // 33% chance to wake up each turn
        duration: 3,
        curable: true
      },
      confusion: {
        name: 'Confusion',
        emoji: '😵',
        damagePerTurn: () => 0,
        preventAction: false,
        selfHarmChance: 33, // 33% chance to hurt self
        selfHarmDamage: (monster) => Math.max(1, Math.floor(monster.max_hp / 16)),
        duration: 3,
        curable: true
      },
      flinch: {
        name: 'Flinch',
        emoji: '😨',
        damagePerTurn: () => 0,
        preventAction: true,
        duration: 1, // Only lasts one turn
        curable: false // Flinch cannot be cured, only lasts one turn
      },
      leech_seed: {
        name: 'Leech Seed',
        emoji: '🌱',
        damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 8)), // 1/8 max HP
        preventAction: false,
        duration: 5,
        curable: true,
        healOpponent: true // Special flag for leech seed
      },
      // Dark-type status effects
      taunt: {
        name: 'Taunt',
        emoji: '🗣️',
        damagePerTurn: () => 0,
        preventAction: false,
        preventStatusMoves: true,
        duration: 3,
        curable: true
      },
      embargo: {
        name: 'Embargo',
        emoji: '🚫',
        damagePerTurn: () => 0,
        preventAction: false,
        preventItemUse: true,
        duration: 5,
        curable: true
      },
      torment: {
        name: 'Torment',
        emoji: '🔄',
        damagePerTurn: () => 0,
        preventAction: false,
        preventRepeatMove: true,
        duration: 5,
        curable: true
      },
      snatch: {
        name: 'Snatch',
        emoji: '👺',
        damagePerTurn: () => 0,
        preventAction: false,
        stealStatusMoves: true,
        duration: 1,
        curable: false
      },
      quash: {
        name: 'Quash',
        emoji: '⏬',
        damagePerTurn: () => 0,
        preventAction: false,
        moveLast: true,
        duration: 1,
        curable: false
      },
      rage_powder: {
        name: 'Rage Powder',
        emoji: '💥',
        damagePerTurn: () => 0,
        preventAction: false,
        redirectAttacks: true,
        duration: 1,
        curable: false
      },
      // Bug-type status effects
      trapped: {
        name: 'Trapped',
        emoji: '🕷️',
        damagePerTurn: () => 0,
        preventAction: false,
        preventEscape: true,
        duration: 5,
        curable: true
      },
      powder: {
        name: 'Powder',
        emoji: '💨',
        damagePerTurn: () => 0,
        preventAction: false,
        fireTypePunishment: true,
        duration: 1,
        curable: false
      },
      silk_trap: {
        name: 'Silk Trap',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        contactEffect: { stat: 'speed', change: -1 },
        duration: 1,
        curable: false
      },
      obstruct: {
        name: 'Obstruct',
        emoji: '🚧',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        contactEffect: { stat: 'defense', change: -2 },
        duration: 1,
        curable: false
      },
      // Dragon-type status effects
      dragon_cheer: {
        name: 'Dragon Cheer',
        emoji: '🐉',
        damagePerTurn: () => 0,
        preventAction: false,
        criticalBoost: true,
        duration: 5,
        curable: true
      },
      // Electric-type status effects
      charge: {
        name: 'Charge',
        emoji: '⚡',
        damagePerTurn: () => 0,
        preventAction: false,
        chargeNext: true,
        duration: 1,
        curable: false
      },
      electrify: {
        name: 'Electrify',
        emoji: '🔌',
        damagePerTurn: () => 0,
        preventAction: false,
        changeNextMoveType: 'Electric',
        duration: 1,
        curable: false
      },
      ion_deluge: {
        name: 'Ion Deluge',
        emoji: '⚡',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        changeNormalToElectric: true,
        duration: 1,
        curable: false
      },
      magnet_rise: {
        name: 'Magnet Rise',
        emoji: '🧲',
        damagePerTurn: () => 0,
        preventAction: false,
        levitate: true,
        immuneToGround: true,
        duration: 5,
        curable: true
      },
      electric_terrain: {
        name: 'Electric Terrain',
        emoji: '⚡',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        boostElectricMoves: 1.3,
        preventSleep: true,
        duration: 5,
        curable: false
      },
      // Fairy-type status effects
      misty_terrain: {
        name: 'Misty Terrain',
        emoji: '🌫️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        halveDragonMoves: 0.5,
        preventStatusConditions: true,
        duration: 5,
        curable: false
      },
      crafty_shield: {
        name: 'Crafty Shield',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        protectFromStatusMoves: true,
        duration: 1,
        curable: false
      },
      fairy_lock: {
        name: 'Fairy Lock',
        emoji: '🔒',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        preventSwitching: true,
        duration: 1,
        curable: false
      },
      // Fighting-type status effects
      quick_guard: {
        name: 'Quick Guard',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        protectFromPriorityMoves: true,
        duration: 1,
        curable: false
      },
      detect: {
        name: 'Detect',
        emoji: '👁️',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        duration: 1,
        curable: false
      },
      mat_block: {
        name: 'Mat Block',
        emoji: '🥋',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        protectFromDamagingMoves: true,
        firstTurnOnly: true,
        duration: 1,
        curable: false
      },
      octolock: {
        name: 'Octolock',
        emoji: '🐙',
        damagePerTurn: () => 0,
        preventAction: false,
        trapped: true,
        statDebuffPerTurn: { defense: -1, special_defense: -1 },
        duration: 5,
        curable: true
      },
      // Fire-type status effects
      burning_bulwark: {
        name: 'Burning Bulwark',
        emoji: '🔥',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        contactEffect: { statusEffect: 'burn', duration: 4 },
        duration: 1,
        curable: false
      },
      sunny_day: {
        name: 'Sunny Day',
        emoji: '☀️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        weather: 'sunny',
        boostFireMoves: 1.5,
        weakenWaterMoves: 0.5,
        duration: 5,
        curable: false
      },
      // Flying-type status effects
      tailwind: {
        name: 'Tailwind',
        emoji: '💨',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        speedDoubled: true,
        duration: 4,
        curable: false
      },
      roost: {
        name: 'Roost',
        emoji: '🪶',
        damagePerTurn: () => 0,
        preventAction: false,
        loseFlying: true,
        duration: 1,
        curable: false
      },
      // Ghost-type status effects
      curse: {
        name: 'Curse',
        emoji: '💀',
        damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 4)), // 1/4 max HP per turn
        preventAction: false,
        duration: -1, // Until target faints
        curable: true
      },
      nightmare: {
        name: 'Nightmare',
        emoji: '😱',
        damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 4)), // 1/4 max HP per turn
        preventAction: false,
        onlySleeping: true,
        duration: -1, // Lasts while sleeping
        curable: true
      },
      grudge: {
        name: 'Grudge',
        emoji: '👻',
        damagePerTurn: () => 0,
        preventAction: false,
        zeroLastMovePP: true,
        duration: 1,
        curable: false
      },
      trick_or_treat: {
        name: 'Trick-or-Treat',
        emoji: '🎃',
        damagePerTurn: () => 0,
        preventAction: false,
        addGhostType: true,
        duration: -1, // Permanent
        curable: false
      },
      destiny_bond: {
        name: 'Destiny Bond',
        emoji: '⚰️',
        damagePerTurn: () => 0,
        preventAction: false,
        faintTogether: true,
        duration: 1,
        curable: false
      },
      // Grass-type status effects
      spiky_shield: {
        name: 'Spiky Shield',
        emoji: '🌿',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        contactDamage: (attacker) => Math.floor(attacker.max_hp / 8), // 1/8 max HP damage
        duration: 1,
        curable: false
      },
      ingrain: {
        name: 'Ingrain',
        emoji: '🌱',
        damagePerTurn: () => 0,
        preventAction: false,
        healPerTurn: (monster) => Math.floor(monster.max_hp / 16), // 1/16 max HP per turn
        trapped: true,
        duration: -1, // Permanent until removed
        curable: true
      },
      grassy_terrain: {
        name: 'Grassy Terrain',
        emoji: '🌱',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        boostGrassMoves: 1.3,
        healGrounded: (monster) => Math.floor(monster.max_hp / 16), // Heal 1/16 HP per turn
        duration: 5,
        curable: false
      },
      forests_curse: {
        name: 'Forest\'s Curse',
        emoji: '🌳',
        damagePerTurn: () => 0,
        preventAction: false,
        addGrassType: true,
        duration: -1, // Permanent
        curable: false
      },
      worry_seed: {
        name: 'Worry Seed',
        emoji: '😟',
        damagePerTurn: () => 0,
        preventAction: false,
        changeAbility: 'Insomnia',
        duration: -1, // Permanent
        curable: false
      },
      // Ground-type status effects
      mud_sport: {
        name: 'Mud Sport',
        emoji: '🟫',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        weakenElectricMoves: 0.33, // Electric moves deal 1/3 damage
        duration: 5,
        curable: false
      },
      spikes: {
        name: 'Spikes',
        emoji: '📍',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        entryHazard: true,
        damageOnEntry: (monster, layers) => Math.floor(monster.max_hp * 0.125 * layers), // 1/8 HP per layer
        maxLayers: 3,
        duration: -1, // Permanent until removed
        curable: false
      },
      // Ice-type status effects
      hail: {
        name: 'Hail',
        emoji: '🧊',
        damagePerTurn: (monster) => {
          // Deal damage to non-Ice types
          const isIce = monster.monster_data?.type1 === 'Ice' || monster.monster_data?.type2 === 'Ice';
          return isIce ? 0 : Math.max(1, Math.floor(monster.max_hp / 16)); // 1/16 max HP
        },
        preventAction: false,
        fieldEffect: true,
        weather: 'hail',
        duration: 5,
        curable: false
      },
      snow: {
        name: 'Snow',
        emoji: '❄️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        weather: 'snow',
        boostIceDefense: 1.5, // Ice types get 50% Defense boost
        duration: 5,
        curable: false
      },
      mist: {
        name: 'Mist',
        emoji: '🌫️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        preventStatReduction: true,
        duration: 5,
        curable: false
      },
      aurora_veil: {
        name: 'Aurora Veil',
        emoji: '🌈',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        damageReduction: 0.5, // Reduce damage by 50%
        duration: 5,
        curable: false
      },
      chilly_reception: {
        name: 'Chilly Reception',
        emoji: '❄️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        weather: 'snow',
        duration: 5,
        curable: false
      },
      // Normal-type status effects
      lucky_chant: {
        name: 'Lucky Chant',
        emoji: '🍀',
        damagePerTurn: () => 0,
        preventAction: false,
        preventCritical: true,
        teamEffect: true,
        duration: 5,
        curable: false
      },
      whirlwind: {
        name: 'Whirlwind',
        emoji: '🌪️',
        damagePerTurn: () => 0,
        preventAction: false,
        forceSwitch: true,
        duration: 1,
        curable: false
      },
      camouflage: {
        name: 'Camouflage',
        emoji: '🦎',
        damagePerTurn: () => 0,
        preventAction: false,
        typeChange: true,
        duration: -1, // Permanent until removed
        curable: false
      },
      wish: {
        name: 'Wish',
        emoji: '🌟',
        damagePerTurn: () => 0,
        preventAction: false,
        delayedHealing: true,
        duration: 2, // Activate after 2 turns
        curable: false
      },
      yawn: {
        name: 'Drowsy',
        emoji: '😪',
        damagePerTurn: () => 0,
        preventAction: false,
        delayedStatus: true,
        duration: 1, // Activate after 1 turn
        curable: true
      },
      stockpile: {
        name: 'Stockpile',
        emoji: '📦',
        damagePerTurn: () => 0,
        preventAction: false,
        stackable: true,
        maxStacks: 3,
        duration: -1, // Permanent until used
        curable: false
      },
      reflect_type: {
        name: 'Reflect Type',
        emoji: '🪞',
        damagePerTurn: () => 0,
        preventAction: false,
        typeChange: true,
        duration: -1, // Permanent
        curable: false
      },
      helping_hand: {
        name: 'Helping Hand',
        emoji: '🤝',
        damagePerTurn: () => 0,
        preventAction: false,
        boostNextMove: true,
        duration: 1, // Next move only
        curable: false
      },
      foresight: {
        name: 'Identified',
        emoji: '👁️',
        damagePerTurn: () => 0,
        preventAction: false,
        removeEvasion: true,
        allowNormalVsGhost: true,
        duration: -1, // Permanent
        curable: false
      },
      happy_hour: {
        name: 'Happy Hour',
        emoji: '💰',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        doublePrizeMoney: true,
        duration: -1, // Lasts for battle
        curable: false
      },
      max_guard: {
        name: 'Max Guard',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        protectFromMaxMoves: true,
        duration: 1, // One turn only
        curable: false
      },
      protect: {
        name: 'Protected',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        protectFromAll: true,
        priority: 4,
        duration: 1, // One turn only
        curable: false
      },
      laser_focus: {
        name: 'Laser Focus',
        emoji: '🎯',
        damagePerTurn: () => 0,
        preventAction: false,
        guaranteeCritical: true,
        duration: 1, // Next move only
        curable: false
      },
      infatuation: {
        name: 'Infatuated',
        emoji: '💕',
        damagePerTurn: () => 0,
        preventAction: true,
        actionChance: 50, // 50% chance to be unable to act
        duration: -1, // Until one switches out
        curable: true
      },
      block: {
        name: 'Blocked',
        emoji: '🚫',
        damagePerTurn: () => 0,
        preventAction: false,
        preventSwitch: true,
        duration: -1, // Until user switches/faints
        curable: false
      },
      mean_look: {
        name: 'Trapped',
        emoji: '👁️',
        damagePerTurn: () => 0,
        preventAction: false,
        preventSwitch: true,
        duration: -1, // Until user switches/faints
        curable: false
      },
      endure: {
        name: 'Enduring',
        emoji: '💪',
        damagePerTurn: () => 0,
        preventAction: false,
        surviveWith1HP: true,
        priority: 4,
        duration: 1, // One turn only
        curable: false
      },
      substitute: {
        name: 'Substitute',
        emoji: '🎭',
        damagePerTurn: () => 0,
        preventAction: false,
        hasSubstitute: true,
        duration: -1, // Until substitute is destroyed
        curable: false
      },
      conversion: {
        name: 'Converted',
        emoji: '🔄',
        damagePerTurn: () => 0,
        preventAction: false,
        typeChange: true,
        duration: -1, // Permanent
        curable: false
      },
      transform: {
        name: 'Transformed',
        emoji: '🪄',
        damagePerTurn: () => 0,
        preventAction: false,
        transformed: true,
        duration: -1, // Permanent until switch
        curable: false
      },
      spotlight: {
        name: 'Spotlighted',
        emoji: '🎯',
        damagePerTurn: () => 0,
        preventAction: false,
        forceTarget: true,
        priority: 3,
        duration: 1, // One turn only
        curable: false
      },
      roar: {
        name: 'Blown Away',
        emoji: '💨',
        damagePerTurn: () => 0,
        preventAction: false,
        forceSwitch: true,
        priority: -6, // Negative priority
        duration: 1,
        curable: false
      },
      encore: {
        name: 'Encored',
        emoji: '🎭',
        damagePerTurn: () => 0,
        preventAction: false,
        forceRepeatMove: true,
        duration: 3,
        curable: true
      },
      after_you: {
        name: 'Boosted Priority',
        emoji: '⚡',
        damagePerTurn: () => 0,
        preventAction: false,
        moveNext: true,
        duration: 1, // Next turn only
        curable: false
      },
      perish_song: {
        name: 'Perish Count',
        emoji: '☠️',
        damagePerTurn: () => 0,
        preventAction: false,
        perishCountdown: true,
        duration: 3, // Faints after 3 turns
        curable: false
      },
      disable: {
        name: 'Disabled',
        emoji: '🚫',
        damagePerTurn: () => 0,
        preventAction: false,
        disableMove: true,
        duration: 4,
        curable: true
      },
      focus_energy: {
        name: 'Focused',
        emoji: '🎯',
        damagePerTurn: () => 0,
        preventAction: false,
        criticalBoost: true,
        duration: 5,
        curable: true
      },
      safeguard: {
        name: 'Safeguard',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        preventStatusConditions: true,
        duration: 5,
        curable: false
      },
      simple_beam: {
        name: 'Simple Beam',
        emoji: '✨',
        damagePerTurn: () => 0,
        preventAction: false,
        changeAbility: 'Simple',
        duration: -1, // Permanent
        curable: false
      },
      follow_me: {
        name: 'Follow Me',
        emoji: '🎯',
        damagePerTurn: () => 0,
        preventAction: false,
        redirectAttacks: true,
        priority: 2,
        duration: 1,
        curable: false
      },
      lock_on: {
        name: 'Lock-On',
        emoji: '🎯',
        damagePerTurn: () => 0,
        preventAction: false,
        guaranteeNextHit: true,
        duration: 1, // Next move only
        curable: false
      },
      mind_reader: {
        name: 'Mind Reader',
        emoji: '👁️',
        damagePerTurn: () => 0,
        preventAction: false,
        guaranteeNextHit: true,
        duration: 1, // Next move only
        curable: false
      },
      baneful_bunker: {
        name: 'Baneful Bunker',
        emoji: '☠️',
        damagePerTurn: () => 0,
        preventAction: false,
        protection: true,
        contactEffect: { statusEffect: 'poison', duration: 4 },
        priority: 4,
        duration: 1,
        curable: false
      },
      shed_tail: {
        name: 'Shed Tail',
        emoji: '🎭',
        damagePerTurn: () => 0,
        preventAction: false,
        hasSubstitute: true,
        forceSwitch: true,
        duration: -1, // Until substitute is destroyed
        curable: false
      },
      corrosive_gas: {
        name: 'Corrosive Gas',
        emoji: '🌪️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        destroyItems: true,
        duration: 1, // One-time effect
        curable: false
      },
      toxic_spikes: {
        name: 'Toxic Spikes',
        emoji: '☠️',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        entryHazard: true,
        poisonOnEntry: true,
        stackable: true,
        maxLayers: 2,
        duration: -1, // Permanent until removed
        curable: false
      },
      gastro_acid: {
        name: 'Gastro Acid',
        emoji: '🧪',
        damagePerTurn: () => 0,
        preventAction: false,
        suppressAbility: true,
        duration: -1, // Until switch
        curable: false
      },
      magic_coat: {
        name: 'Magic Coat',
        emoji: '✨',
        damagePerTurn: () => 0,
        preventAction: false,
        reflectStatusMoves: true,
        priority: 4,
        duration: 1,
        curable: false
      },
      // New status effects for missing moves
      imprison: {
        name: 'Imprisoned',
        emoji: '🚫',
        damagePerTurn: () => 0,
        preventAction: false,
        disableSharedMoves: true,
        duration: -1, // Until user switches out
        curable: false
      },
      reflect: {
        name: 'Reflect',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        damageReduction: 0.5,
        barrierType: 'physical',
        duration: 5,
        curable: false
      },
      ally_switch: {
        name: 'Ally Switch',
        emoji: '🔄',
        damagePerTurn: () => 0,
        preventAction: false,
        switchPlaces: true,
        priority: 2,
        duration: 1,
        curable: false
      },
      magic_room: {
        name: 'Magic Room',
        emoji: '✨',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        suppressItems: true,
        duration: 5,
        curable: false
      },
      trick_room: {
        name: 'Trick Room',
        emoji: '🔄',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        reverseSpeed: true,
        duration: 5,
        curable: false
      },
      sacrifice_heal: {
        name: 'Sacrifice Heal',
        emoji: '🌙',
        damagePerTurn: () => 0,
        preventAction: false,
        sacrificeHealing: true,
        duration: 1,
        curable: false
      },
      // New status effects for additional moves
      heal_block: {
        name: 'Heal Block',
        emoji: '🚫',
        damagePerTurn: () => 0,
        preventAction: false,
        preventHealing: true,
        duration: 5,
        curable: true
      },
      instruct: {
        name: 'Instructed',
        emoji: '📢',
        damagePerTurn: () => 0,
        preventAction: false,
        forceRepeatLast: true,
        duration: 1,
        curable: false
      },
      miracle_eye: {
        name: 'Miracle Eye',
        emoji: '👁️',
        damagePerTurn: () => 0,
        preventAction: false,
        removeEvasion: true,
        allowPsychicVsDark: true,
        duration: -1, // Permanent
        curable: false
      },
      role_play: {
        name: 'Role Play',
        emoji: '🎭',
        damagePerTurn: () => 0,
        preventAction: false,
        copiedAbility: true,
        duration: -1, // Permanent until switch
        curable: false
      },
      telekinesis: {
        name: 'Telekinesis',
        emoji: '🌀',
        damagePerTurn: () => 0,
        preventAction: false,
        levitated: true,
        guaranteeHit: true,
        duration: 3,
        curable: true
      },
      wonder_room: {
        name: 'Wonder Room',
        emoji: '🔮',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        swapDefenses: true,
        duration: 5,
        curable: false
      },
      
      // Third set of status effects
      light_screen: {
        name: 'Light Screen',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamEffect: true,
        specialDefenseMultiplier: 2,
        duration: 5,
        curable: false
      },
      type_change: {
        name: 'Type Changed',
        emoji: '🔄',
        damagePerTurn: () => 0,
        preventAction: false,
        typeChange: true,
        duration: -1, // Permanent until switch
        curable: false
      },
      gravity: {
        name: 'Gravity',
        emoji: '🌍',
        damagePerTurn: () => 0,
        preventAction: false,
        fieldEffect: true,
        groundsFlying: true,
        accuracyMultiplier: 1.67,
        duration: 5,
        curable: false
      },
      sandstorm: {
        name: 'Sandstorm',
        emoji: '🌪️',
        damagePerTurn: (monster) => {
          // Sandstorm damages non-Rock/Ground/Steel types
          const immuneTypes = ['Rock', 'Ground', 'Steel'];
          const monsterTypes = monster.monster_data?.types || [];
          const isImmune = monsterTypes.some(type => immuneTypes.includes(type));
          return isImmune ? 0 : Math.max(1, Math.floor(monster.max_hp / 16));
        },
        preventAction: false,
        weatherEffect: true,
        duration: 5,
        curable: false
      },
      stealth_rock: {
        name: 'Stealth Rock',
        emoji: '🪨',
        damagePerTurn: () => 0,
        preventAction: false,
        entryHazard: true,
        hazardType: 'stealth_rock',
        duration: -1, // Permanent until removed
        curable: false
      },
      wide_guard: {
        name: 'Wide Guard',
        emoji: '🛡️',
        damagePerTurn: () => 0,
        preventAction: false,
        teamProtection: true,
        protectFrom: 'wide_moves',
        duration: 1,
        curable: false
      },
      fire_weakness: {
        name: 'Fire Weakness',
        emoji: '🔥',
        damagePerTurn: () => 0,
        preventAction: false,
        fireWeakness: true,
        duration: -1, // Permanent until switch
        curable: false
      }
    };

    // Type-based status effect chances
    this.typeStatusChances = {
      Fire: { burn: 10 },
      Poison: { poison: 10 },
      Ice: { freeze: 10 },
      Electric: { paralysis: 10 },
      Psychic: { confusion: 10 },
      Ghost: { confusion: 10 }
    };
  }

  /**
   * Apply status effect to a monster
   * @param {number} battleId - Battle ID
   * @param {Object} monster - Target monster
   * @param {string} effectType - Status effect type
   * @param {number} duration - Effect duration (optional)
   * @returns {Promise<Object>} Application result
   */
  async applyStatusEffect(battleId, monster, effectType, duration = null) {
    try {
      if (!this.statusEffects[effectType]) {
        console.warn(`Unknown status effect: ${effectType}. Skipping application.`);
        return {
          success: false,
          message: `Unknown status effect: ${effectType}`,
          effectType,
          duration: 0
        };
      }

      // Check if monster already has this status effect
      const currentEffects = monster.status_effects || [];
      const existingEffect = currentEffects.find(effect => effect.type === effectType);

      if (existingEffect) {
        // Refresh duration if effect already exists
        existingEffect.duration = duration || this.statusEffects[effectType].duration;
        existingEffect.applied_at = new Date().toISOString();
      } else {
        // Add new status effect
        const newEffect = {
          type: effectType,
          duration: duration || this.statusEffects[effectType].duration,
          applied_at: new Date().toISOString()
        };
        currentEffects.push(newEffect);
      }

      // Update monster with new status effects
      await BattleMonster.update(monster.id, { status_effects: currentEffects });

      // Create status application message
      const effectDef = this.statusEffects[effectType];
      const monsterName = monster.monster_data?.name || 'Monster';
      const message = `${effectDef.emoji} **${monsterName}** was afflicted with **${effectDef.name}**!`;

      // Log the status effect application
      await BattleLog.logSystem(battleId, message);

      return {
        success: true,
        message,
        effectType,
        duration: duration || effectDef.duration
      };

    } catch (error) {
      console.error('Error applying status effect:', error);
      throw error;
    }
  }

  /**
   * Process status effects at the start of a monster's turn
   * @param {number} battleId - Battle ID
   * @param {Object} monster - Monster to process
   * @returns {Promise<Object>} Processing result
   */
  async processStatusEffects(battleId, monster) {
    try {
      const results = {
        canAct: true,
        damageDealt: 0,
        messages: [],
        effectsRemoved: []
      };

      if (!monster.status_effects || monster.status_effects.length === 0) {
        return results;
      }

      const monsterName = monster.monster_data?.name || 'Monster';
      const updatedEffects = [];

      for (const effect of monster.status_effects) {
        const effectDef = this.statusEffects[effect.type];
        if (!effectDef) continue;

        let shouldRemove = false;
        let effectMessage = '';

        // Process effect based on type
        switch (effect.type) {
          case 'poison':
          case 'burn':
            // Deal damage
            const damage = effectDef.damagePerTurn(monster);
            if (damage > 0) {
              const damageResult = await BattleMonster.dealDamage(monster.id, damage);
              results.damageDealt += damage;
              effectMessage = `${effectDef.emoji} **${monsterName}** is hurt by ${effectDef.name.toLowerCase()}! (-${damage} HP)`;
              results.messages.push(effectMessage);
            }
            break;

          case 'leech_seed':
            // Deal damage and heal opponent (simplified - would need battle context for full implementation)
            const leechDamage = effectDef.damagePerTurn(monster);
            if (leechDamage > 0) {
              const damageResult = await BattleMonster.dealDamage(monster.id, leechDamage);
              results.damageDealt += leechDamage;
              effectMessage = `${effectDef.emoji} **${monsterName}** is hurt by Leech Seed! (-${leechDamage} HP)`;
              results.messages.push(effectMessage);
              // Note: Healing opponent would require battle context to find the seeder
            }
            break;

          case 'freeze':
            // Check if monster thaws
            if (Math.random() * 100 < effectDef.thawChance) {
              shouldRemove = true;
              effectMessage = `🌡️ **${monsterName}** thawed out!`;
              results.messages.push(effectMessage);
            } else {
              results.canAct = false;
              effectMessage = `${effectDef.emoji} **${monsterName}** is frozen solid and cannot act!`;
              results.messages.push(effectMessage);
            }
            break;

          case 'paralysis':
            // Check if monster can act
            if (Math.random() * 100 < effectDef.actionChance) {
              results.canAct = false;
              effectMessage = `${effectDef.emoji} **${monsterName}** is paralyzed and cannot act!`;
              results.messages.push(effectMessage);
            }
            break;

          case 'sleep':
            // Check if monster wakes up
            if (Math.random() * 100 < effectDef.wakeChance) {
              shouldRemove = true;
              effectMessage = `😊 **${monsterName}** woke up!`;
              results.messages.push(effectMessage);
            } else {
              results.canAct = false;
              effectMessage = `${effectDef.emoji} **${monsterName}** is fast asleep and cannot act!`;
              results.messages.push(effectMessage);
            }
            break;

          case 'confusion':
            // Check if monster hurts itself
            if (Math.random() * 100 < effectDef.selfHarmChance) {
              const damage = effectDef.selfHarmDamage(monster);
              if (damage > 0) {
                const damageResult = await BattleMonster.dealDamage(monster.id, damage);
                results.damageDealt += damage;
                effectMessage = `${effectDef.emoji} **${monsterName}** hurt itself in confusion! (-${damage} HP)`;
                results.messages.push(effectMessage);
              }
            }
            break;

          case 'taunt':
            // Prevent status moves (handled in battle logic)
            effectMessage = `${effectDef.emoji} **${monsterName}** is taunted and cannot use status moves!`;
            results.messages.push(effectMessage);
            results.preventStatusMoves = true;
            break;

          case 'embargo':
            // Prevent item use (handled in battle logic)
            effectMessage = `${effectDef.emoji} **${monsterName}** cannot use items due to Embargo!`;
            results.messages.push(effectMessage);
            results.preventItemUse = true;
            break;

          case 'torment':
            // Prevent repeating last move (handled in battle logic)
            results.preventRepeatMove = true;
            break;

          case 'snatch':
            // Ready to steal status moves (handled in battle logic)
            results.snatchActive = true;
            break;

          case 'quash':
            // Force to move last (handled in battle logic)
            results.moveLast = true;
            break;

          case 'rage_powder':
            // Redirect attacks (handled in battle logic)
            results.redirectTarget = true;
            break;

          case 'trapped':
            // Prevent escape (handled in battle logic)
            results.preventEscape = true;
            break;

          case 'powder':
            // Punish Fire-type moves (handled in battle logic)
            results.firePunishment = true;
            break;

          case 'silk_trap':
          case 'obstruct':
            // Protection effects (handled in battle logic)
            results.protection = effect.type;
            break;

          case 'dragon_cheer':
            // Boost critical hit ratio (handled in battle logic)
            results.criticalBoost = true;
            break;

          case 'charge':
            // Next Electric move is boosted (handled in battle logic)
            results.chargeActive = true;
            break;

          case 'electrify':
            // Next move becomes Electric type (handled in battle logic)
            results.electrifyActive = true;
            break;

          case 'ion_deluge':
            // Normal moves become Electric (handled in battle logic)
            results.ionDelugeActive = true;
            break;

          case 'magnet_rise':
            // Levitate effect (handled in battle logic)
            results.levitating = true;
            break;

          case 'electric_terrain':
            // Electric Terrain effects (handled in battle logic)
            results.electricTerrain = true;
            break;

          case 'misty_terrain':
            // Misty Terrain effects (handled in battle logic)
            results.mistyTerrain = true;
            break;

          case 'crafty_shield':
            // Team protection from status moves (handled in battle logic)
            results.craftyShield = true;
            break;

          case 'fairy_lock':
            // Prevent switching (handled in battle logic)
            results.fairyLock = true;
            break;

          case 'quick_guard':
            // Team protection from priority moves (handled in battle logic)
            results.quickGuard = true;
            break;

          case 'detect':
            // Individual protection (handled in battle logic)
            results.detectProtection = true;
            break;

          case 'mat_block':
            // Team protection from damaging moves (handled in battle logic)
            results.matBlock = true;
            break;

          case 'octolock':
            // Ongoing trap with stat debuffs
            const octolockDef = this.statusEffects.octolock;
            if (octolockDef.statDebuffPerTurn) {
              // Apply stat debuffs each turn
              let statMods = monster.stat_modifications || {};
              for (const [stat, change] of Object.entries(octolockDef.statDebuffPerTurn)) {
                if (!statMods[stat]) {
                  statMods[stat] = 0;
                }
                statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));
              }
              await BattleMonster.update(monster.id, {
                monster_data: {
                  ...monster.monster_data,
                  stat_modifications: statMods
                }
              });
              effectMessage = `🐙 **${monsterName}** is squeezed by Octolock! Defense and Special Defense fell!`;
              results.messages.push(effectMessage);
            }
            results.octolockTrap = true;
            break;

          case 'burning_bulwark':
            // Protection with burn on contact (handled in battle logic)
            results.burningBulwark = true;
            break;

          case 'sunny_day':
            // Weather effects (handled in battle logic)
            results.sunnyWeather = true;
            break;

          case 'tailwind':
            // Team speed boost (handled in battle logic)
            results.tailwindActive = true;
            break;

          case 'roost':
            // Temporarily lose Flying type (handled in battle logic)
            results.lostFlying = true;
            break;

          case 'curse':
            // Take damage from curse
            const curseDamage = effectDef.damagePerTurn(monster);
            if (curseDamage > 0) {
              const damageResult = await BattleMonster.dealDamage(monster.id, curseDamage);
              results.damageDealt += curseDamage;
              effectMessage = `${effectDef.emoji} **${monsterName}** is hurt by the curse! (-${curseDamage} HP)`;
              results.messages.push(effectMessage);
            }
            break;

          case 'nightmare':
            // Take damage from nightmare (only while sleeping)
            const isSleeping = this.hasStatusEffect(monster, 'sleep');
            if (isSleeping) {
              const nightmareDamage = effectDef.damagePerTurn(monster);
              if (nightmareDamage > 0) {
                const damageResult = await BattleMonster.dealDamage(monster.id, nightmareDamage);
                results.damageDealt += nightmareDamage;
                effectMessage = `${effectDef.emoji} **${monsterName}** is tormented by nightmares! (-${nightmareDamage} HP)`;
                results.messages.push(effectMessage);
              }
            } else {
              // Remove nightmare if not sleeping
              shouldRemove = true;
            }
            break;

          case 'grudge':
            // Prepared to zero PP (handled when user faints)
            results.grudgeActive = true;
            break;

          case 'trick_or_treat':
            // Added Ghost type (handled in battle logic)
            results.addedGhostType = true;
            break;

          case 'destiny_bond':
            // Prepared to faint together (handled when user faints)
            results.destinyBondActive = true;
            break;

          case 'spiky_shield':
            // Protection with contact damage (handled in battle logic)
            results.spikyShield = true;
            break;

          case 'ingrain':
            // Heal each turn while trapped
            const ingrainHeal = effectDef.healPerTurn(monster);
            if (ingrainHeal > 0) {
              const healResult = await BattleMonster.heal(monster.id, ingrainHeal);
              effectMessage = `${effectDef.emoji} **${monsterName}** recovered ${ingrainHeal} HP from its roots!`;
              results.messages.push(effectMessage);
            }
            results.ingrainTrapped = true;
            break;

          case 'grassy_terrain':
            // Heal grounded Pokemon and boost Grass moves (handled in battle logic)
            results.grassyTerrain = true;
            const terrainHeal = effectDef.healGrounded(monster);
            if (terrainHeal > 0) {
              const healResult = await BattleMonster.heal(monster.id, terrainHeal);
              effectMessage = `${effectDef.emoji} **${monsterName}** recovered ${terrainHeal} HP from Grassy Terrain!`;
              results.messages.push(effectMessage);
            }
            break;

          case 'forests_curse':
            // Added Grass type (handled in battle logic)
            results.addedGrassType = true;
            break;

          case 'worry_seed':
            // Changed ability (handled in battle logic)
            results.changedAbility = true;
            break;

          case 'mud_sport':
            // Weaken Electric moves (handled in battle logic)
            results.mudSport = true;
            break;

          case 'spikes':
            // Entry hazard (handled when switching in)
            results.spikesActive = true;
            break;

          case 'hail':
            // Weather damage to non-Ice types
            const hailDamage = effectDef.damagePerTurn(monster);
            if (hailDamage > 0) {
              const damageResult = await BattleMonster.dealDamage(monster.id, hailDamage);
              results.damageDealt += hailDamage;
              effectMessage = `${effectDef.emoji} **${monsterName}** is buffeted by the hail! (-${hailDamage} HP)`;
              results.messages.push(effectMessage);
            }
            results.hailWeather = true;
            break;

          case 'snow':
            // Snow weather effects (handled in battle logic)
            results.snowWeather = true;
            break;

          case 'chilly_reception':
            // Snow weather effects (handled in battle logic)
            results.chillyReceptionSnow = true;
            break;

          case 'mist':
            // Team protection from stat reduction (handled in battle logic)
            results.mistProtection = true;
            break;

          case 'aurora_veil':
            // Team damage reduction (handled in battle logic)
            results.auroraVeil = true;
            break;

          case 'lucky_chant':
            // Team protection from critical hits (handled in battle logic)
            results.luckyChant = true;
            break;

          case 'whirlwind':
            // Force switch out (handled by battle system)
            results.forceSwitch = true;
            break;

          case 'camouflage':
            // Type change (handled by battle system)
            results.typeChange = {
              newType: effect.data?.newType || 'Normal'
            };
            break;

          case 'wish':
            // Delayed healing
            if (effect.duration === 0) {
              const healAmount = effect.data?.healAmount || Math.floor(monster.max_hp * 0.5);
              const healResult = await BattleMonster.heal(monster.id, healAmount);
              results.healing += healResult.heal_amount || healAmount;
              const wishUser = effect.data?.wishUser || 'Someone';
              results.messages.push(`💫 ${wishUser}'s wish came true! ${monster.name || 'Monster'} recovered ${healResult.heal_amount || healAmount} HP!`);
            }
            break;

          case 'yawn':
            // Delayed sleep effect
            if (effect.duration === 0) {
              const delayedEffect = effect.data?.delayedEffect || 'sleep';
              const delayedDuration = effect.data?.delayedDuration || 3;
              await this.applyStatusEffect(battleId, monster, delayedEffect, delayedDuration);
              results.messages.push(`😴 ${monster.name || 'Monster'} fell asleep from drowsiness!`);
            }
            break;

          case 'stockpile':
            // Stockpile stacks (handled by battle system when using Swallow/Spit Up)
            results.stockpile = {
              stacks: effect.data?.stacks || 1
            };
            break;

          case 'reflect_type':
            // Type change (handled by battle system)
            results.typeChange = {
              newType1: effect.data?.newType1 || 'Normal',
              newType2: effect.data?.newType2 || null
            };
            break;

          case 'helping_hand':
            // Boost next move (handled by battle system)
            results.helpingHand = {
              powerBoost: effect.data?.powerBoost || 1.5
            };
            break;

          case 'foresight':
            // Identification (handled by battle system)
            results.foresight = {
              removeEvasion: effect.data?.removeEvasion || false,
              allowNormalVsGhost: effect.data?.allowNormalVsGhost || false
            };
            break;

          case 'happy_hour':
            // Double prize money (handled by battle system)
            results.happyHour = true;
            break;

          case 'max_guard':
            // Protection from Max Moves (handled by battle system)
            results.maxGuard = true;
            break;

          case 'protect':
            // Protection from all moves (handled by battle system)
            results.protect = {
              protectFromAll: true,
              priority: effectDef.priority || 4
            };
            break;

          case 'laser_focus':
            // Guarantee critical hit on next move (handled by battle system)
            results.laserFocus = true;
            break;

          case 'infatuation':
            // 50% chance to be unable to act due to infatuation
            if (Math.random() < 0.5) {
              results.preventAction = true;
              results.messages.push(`💕 ${monster.name || 'Monster'} is immobilized by love!`);
            }
            break;

          case 'block':
          case 'mean_look':
            // Prevent switching (handled by battle system)
            results.preventSwitch = true;
            break;

          case 'endure':
            // Survive with 1 HP (handled by battle system when taking damage)
            results.endure = {
              surviveWith1HP: true,
              priority: effectDef.priority
            };
            break;

          case 'substitute':
            // Has substitute (handled by battle system)
            results.substitute = {
              hp: effect.data?.hp || 0,
              active: true
            };
            break;

          case 'conversion':
            // Type change (handled by battle system)
            results.conversion = {
              newType: effect.data?.newType || 'Normal'
            };
            break;

          case 'transform':
            // Transformed state (handled by battle system)
            results.transform = {
              targetData: effect.data?.targetData || null,
              active: true
            };
            break;

          case 'spotlight':
            // Force target (handled by battle system)
            results.spotlight = {
              forceTarget: true,
              priority: effectDef.priority
            };
            break;

          case 'roar':
            // Force switch (handled by battle system)
            results.roar = {
              forceSwitch: true,
              priority: effectDef.priority
            };
            break;

          case 'encore':
            // Force repeat last move (handled by battle system)
            results.encore = {
              forceRepeatMove: true,
              duration: effect.duration
            };
            break;

          case 'after_you':
            // Move next (handled by battle system)
            results.afterYou = {
              moveNext: true
            };
            break;

          case 'perish_song':
            // Perish countdown
            if (effect.duration === 0) {
              // Faint the Pokemon
              await BattleMonster.update(monster.id, { current_hp: 0 });
              results.messages.push(`☠️ ${monster.name || 'Monster'} fainted from Perish Song!`);
            } else {
              results.messages.push(`☠️ ${monster.name || 'Monster'} has ${effect.duration} turn${effect.duration !== 1 ? 's' : ''} left before fainting!`);
            }
            results.perishSong = {
              countdown: effect.duration
            };
            break;

          case 'disable':
            // Move disabled (handled by battle system)
            results.disable = {
              disabledMove: effect.data?.disabledMove || 'Unknown Move',
              active: true
            };
            break;

          case 'focus_energy':
            // Critical hit boost (handled by battle system)
            results.focusEnergy = {
              criticalBoost: true
            };
            break;

          case 'safeguard':
            // Team protection from status conditions (handled by battle system)
            results.safeguard = {
              preventStatusConditions: true,
              teamEffect: true
            };
            break;

          case 'simple_beam':
            // Ability changed to Simple (handled by battle system)
            results.simpleBeam = {
              changedAbility: 'Simple'
            };
            break;

          case 'follow_me':
            // Redirect attacks (handled by battle system)
            results.followMe = {
              redirectAttacks: true,
              priority: effectDef.priority
            };
            break;

          case 'lock_on':
          case 'mind_reader':
            // Guarantee next hit (handled by battle system)
            results.guaranteeNextHit = {
              active: true,
              moveType: effect.type
            };
            break;

          case 'baneful_bunker':
            // Protection with poison on contact (handled by battle system)
            results.banefulBunker = {
              protection: true,
              contactEffect: effectDef.contactEffect,
              priority: effectDef.priority
            };
            break;

          case 'shed_tail':
            // Has substitute from Shed Tail (handled by battle system)
            results.shedTail = {
              hasSubstitute: true,
              hp: effect.data?.hp || 0
            };
            break;

          case 'corrosive_gas':
            // Destroy held items (handled by battle system)
            results.corrosiveGas = {
              destroyItems: true,
              fieldEffect: true
            };
            break;

          case 'toxic_spikes':
            // Entry hazard that poisons (handled when switching in)
            results.toxicSpikes = {
              layers: effect.data?.layers || 1,
              poisonOnEntry: true,
              hazardType: 'poison'
            };
            break;

          case 'gastro_acid':
            // Ability suppressed (handled by battle system)
            results.gastroAcid = {
              suppressAbility: true
            };
            break;

          case 'magic_coat':
            // Reflect status moves (handled by battle system)
            results.magicCoat = {
              reflectStatusMoves: true,
              priority: effectDef.priority
            };
            break;

          case 'imprison':
            // Prevent opponent from using shared moves (handled by battle system)
            results.imprison = {
              disableSharedMoves: true,
              imprisonedBy: effect.data?.imprisonUser || 'Unknown'
            };
            break;

          case 'reflect':
            // Team barrier against physical moves (handled by battle system)
            results.reflect = {
              teamEffect: true,
              damageReduction: effectDef.damageReduction,
              barrierType: effectDef.barrierType
            };
            break;

          case 'ally_switch':
            // Switch places with ally (handled by battle system)
            results.allySwitch = {
              switchPlaces: true,
              priority: effectDef.priority
            };
            break;

          case 'magic_room':
            // Suppress held item effects (handled by battle system)
            results.magicRoom = {
              fieldEffect: true,
              suppressItems: true
            };
            break;

          case 'trick_room':
            // Reverse speed priority (handled by battle system)
            results.trickRoom = {
              fieldEffect: true,
              reverseSpeed: true
            };
            break;

          case 'sacrifice_heal':
            // Sacrifice healing effect (triggers when next Pokémon enters)
            if (effect.data?.healAmount) {
              results.sacrificeHealing = {
                healAmount: effect.data.healAmount,
                cureStatus: effect.data.cureStatus || false,
                sacrificeUser: effect.data.sacrificeUser || 'Unknown'
              };
              // This effect message would be shown when a new Pokémon enters
              effectMessage = `🌙 ${effect.data.sacrificeUser}'s sacrifice healed the incoming Pokémon!`;
              results.messages.push(effectMessage);
            }
            break;
        }

        // Decrease duration
        effect.duration--;
        if (effect.duration <= 0 || shouldRemove) {
          results.effectsRemoved.push(effect.type);
          if (!shouldRemove) {
            // Effect wore off naturally
            effectMessage = `✨ **${monsterName}**'s ${effectDef.name.toLowerCase()} wore off!`;
            results.messages.push(effectMessage);
          }
        } else {
          updatedEffects.push(effect);
        }
      }

      // Update monster with remaining effects
      await BattleMonster.update(monster.id, { status_effects: updatedEffects });

      // Log all status effect messages
      if (results.messages.length > 0) {
        await BattleLog.logSystem(battleId, results.messages.join('\n'));
      }

      return results;

    } catch (error) {
      console.error('Error processing status effects:', error);
      throw error;
    }
  }

  /**
   * Check if a move should apply a status effect based on its type
   * @param {Object} move - Move data
   * @param {Object} attacker - Attacking monster
   * @param {Object} target - Target monster
   * @returns {Object|null} Status effect to apply or null
   */
  checkTypeBasedStatusEffect(move, attacker, target) {
    try {
      const moveType = move.move_type || move.type;
      if (!moveType || !this.typeStatusChances[moveType]) {
        return null;
      }

      const statusChances = this.typeStatusChances[moveType];
      
      for (const [statusType, chance] of Object.entries(statusChances)) {
        if (Math.random() * 100 < chance) {
          return {
            type: statusType,
            chance: chance
          };
        }
      }

      return null;

    } catch (error) {
      console.error('Error checking type-based status effect:', error);
      return null;
    }
  }

  /**
   * Cure a specific status effect from a monster
   * @param {number} battleId - Battle ID
   * @param {Object} monster - Monster to cure
   * @param {string} effectType - Status effect type to cure
   * @returns {Promise<Object>} Cure result
   */
  async cureStatusEffect(battleId, monster, effectType) {
    try {
      if (!monster.status_effects || monster.status_effects.length === 0) {
        return { success: false, message: 'No status effects to cure' };
      }

      const currentEffects = monster.status_effects.filter(effect => effect.type !== effectType);
      const wasCured = currentEffects.length < monster.status_effects.length;

      if (wasCured) {
        await BattleMonster.update(monster.id, { status_effects: currentEffects });
        
        const effectDef = this.statusEffects[effectType];
        const monsterName = monster.monster_data?.name || 'Monster';
        const message = `💊 **${monsterName}**'s ${effectDef?.name || effectType} was cured!`;
        
        await BattleLog.logSystem(battleId, message);
        
        return { success: true, message };
      }

      return { success: false, message: 'Status effect not found' };

    } catch (error) {
      console.error('Error curing status effect:', error);
      throw error;
    }
  }

  /**
   * Cure all status effects from a monster
   * @param {number} battleId - Battle ID
   * @param {Object} monster - Monster to cure
   * @returns {Promise<Object>} Cure result
   */
  async cureAllStatusEffects(battleId, monster) {
    try {
      if (!monster.status_effects || monster.status_effects.length === 0) {
        return { success: false, message: 'No status effects to cure' };
      }

      await BattleMonster.update(monster.id, { status_effects: [] });
      
      const monsterName = monster.monster_data?.name || 'Monster';
      const message = `✨ **${monsterName}** was cured of all status conditions!`;
      
      await BattleLog.logSystem(battleId, message);
      
      return { success: true, message };

    } catch (error) {
      console.error('Error curing all status effects:', error);
      throw error;
    }
  }

  /**
   * Check if monster has a specific status effect
   * @param {Object} monster - Monster to check
   * @param {string} effectType - Status effect type
   * @returns {Object|null} Status effect object or null
   */
  hasStatusEffect(monster, effectType) {
    if (!monster.status_effects || monster.status_effects.length === 0) {
      return null;
    }
    return monster.status_effects.find(effect => effect.type === effectType) || null;
  }

  /**
   * Check if monster can use status moves (not taunted)
   * @param {Object} monster - Monster to check
   * @returns {boolean} Whether monster can use status moves
   */
  canUseStatusMoves(monster) {
    return !this.hasStatusEffect(monster, 'taunt');
  }

  /**
   * Check if monster can use items (not embargoed)
   * @param {Object} monster - Monster to check
   * @returns {boolean} Whether monster can use items
   */
  canUseItems(monster) {
    return !this.hasStatusEffect(monster, 'embargo');
  }

  /**
   * Check if monster can repeat last move (not tormented)
   * @param {Object} monster - Monster to check
   * @param {string} lastMove - Last move used
   * @param {string} currentMove - Move attempting to use
   * @returns {boolean} Whether monster can use the move
   */
  canRepeatMove(monster, lastMove, currentMove) {
    if (!this.hasStatusEffect(monster, 'torment')) {
      return true;
    }
    return lastMove !== currentMove;
  }

  /**
   * Check if monster has protection (Silk Trap, Obstruct, Detect, Burning Bulwark, Spiky Shield, etc.)
   * @param {Object} monster - Monster to check
   * @returns {Object|null} Protection effect or null
   */
  hasProtection(monster) {
    const silkTrap = this.hasStatusEffect(monster, 'silk_trap');
    const obstruct = this.hasStatusEffect(monster, 'obstruct');
    const detect = this.hasStatusEffect(monster, 'detect');
    const burningBulwark = this.hasStatusEffect(monster, 'burning_bulwark');
    const spikyShield = this.hasStatusEffect(monster, 'spiky_shield');
    return silkTrap || obstruct || detect || burningBulwark || spikyShield;
  }

  /**
   * Handle contact with protected monster (Silk Trap, Obstruct, Burning Bulwark)
   * @param {number} battleId - Battle ID
   * @param {Object} protectedMonster - Monster with protection
   * @param {Object} attacker - Attacking monster
   * @returns {Promise<Object>} Contact result
   */
  async handleProtectionContact(battleId, protectedMonster, attacker) {
    try {
      const protection = this.hasProtection(protectedMonster);
      if (!protection) {
        return { success: false, message: 'No protection active' };
      }

      const effectDef = this.statusEffects[protection.type];
      if (!effectDef.contactEffect) {
        return { success: false, message: 'No contact effect defined' };
      }

      const attackerName = attacker.monster_data?.name || 'Attacker';
      let message = '';
      let effectResult = {};

      if (effectDef.contactDamage) {
        // Spiky Shield - deal damage on contact
        const contactDamage = effectDef.contactDamage(attacker);
        if (contactDamage > 0) {
          await BattleMonster.dealDamage(attacker.id, contactDamage);
          message = `${effectDef.emoji} **${attackerName}** was hurt by ${effectDef.name}! (-${contactDamage} HP)`;
          effectResult.contactDamage = contactDamage;
        }
      } else if (effectDef.contactEffect && effectDef.contactEffect.statusEffect) {
        // Burning Bulwark - apply status effect
        const statusEffect = effectDef.contactEffect.statusEffect;
        const duration = effectDef.contactEffect.duration;
        
        await this.applyStatusEffect(battleId, attacker, statusEffect, duration);
        message = `${effectDef.emoji} **${attackerName}** was ${statusEffect}ed by contact with ${effectDef.name}!`;
        effectResult.statusEffect = statusEffect;
      } else if (effectDef.contactEffect && effectDef.contactEffect.stat) {
        // Silk Trap, Obstruct - apply stat changes
        let statModifications = attacker.stat_modifications || {};
        const stat = effectDef.contactEffect.stat;
        const change = effectDef.contactEffect.change;

        if (!statModifications[stat]) {
          statModifications[stat] = 0;
        }
        statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));

        await BattleMonster.update(attacker.id, {
          monster_data: {
            ...attacker.monster_data,
            stat_modifications: statModifications
          }
        });

        const statName = stat.charAt(0).toUpperCase() + stat.slice(1).replace('_', ' ');
        const changeText = change < 0 ? 'fell' : 'rose';
        const severity = Math.abs(change) > 1 ? 'harshly ' : '';

        message = `${effectDef.emoji} **${attackerName}**'s ${statName} ${severity}${changeText} from contact with ${effectDef.name}!`;
        effectResult.statChange = { [stat]: change };
      }
      
      await BattleLog.logSystem(battleId, message);

      return { 
        success: true, 
        message,
        ...effectResult
      };

    } catch (error) {
      console.error('Error handling protection contact:', error);
      throw error;
    }
  }
}

module.exports = new StatusEffectManager();
