/**
 * Area-specific configurations for adventures
 * Defines welcome messages, battle parameters, monster roller parameters, and special encounters
 */

const areaConfigurations = {
  // Hearthfall Commons Areas
  'heimdal-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    needsMissionMandate: false,
    welcomeMessages: {
      base: "Welcome to Heimdal City, the warm heart of Hearthfall Commons! This bustling capital radiates comfort and community spirit.",
      variations: [
        "The Great Hall's hearth burns bright, welcoming all adventurers to the capital of comfort and community.",
        "Heimdal City's wooden buildings and central hearths create a cozy atmosphere perfect for new adventures.",
        "The regional capital buzzes with activity as Normal-type Monsters gather in harmonious communities."
      ]
    },
    battleParameters: {
      weather: 'clear',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Normal'],
      includeStages: ['Base Stage'], // Base evolution stage
      includeRanks: ['Baby I', 'Baby II', 'Child', 'D', 'E'], // Beginner-friendly ranks
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 1, max: 25 },
    agroRange: { min: 10, max: 40 },
    itemRequirements: {
      needsMissionMandate: true
    },
    specialEncounters: [
      {
        type: 'community_festival',
        chance: 0.15,
        description: 'A community festival is taking place, bringing together trainers and monsters in celebration!'
      },
      {
        type: 'great_hall_challenge',
        chance: 0.1,
        description: 'A legendary trainer in the Great Hall offers a friendly challenge!'
      }
    ]
  },

  'hygge-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    welcomeMessages: {
      base: "Welcome to Hygge Village, where cozy contentment and simple pleasures create the perfect atmosphere for peaceful adventures.",
      variations: [
        "The village embodies the northern concept of hygge - cozy cafes and knitting circles await your exploration.",
        "Fireplace gatherings and comfort food make this village a haven of warmth and friendship.",
        "Simple pleasures and cozy contentment define this charming village in Hearthfall Commons."
      ]
    },
    battleParameters: {
      weather: 'clear',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Normal', 'Fairy'],
      includeStages: ['Base Stage'], // Base evolution stage
      includeRanks: ['Baby I', 'Baby II', 'Child', 'D', 'E'], // Peaceful village ranks
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 1, max: 20 },
    agroRange: { min: 5, max: 30 },
    itemRequirements: {
      needsMissionMandate: true
    },
    specialEncounters: [
      {
        type: 'cozy_cafe_meeting',
        chance: 0.2,
        description: 'A friendly gathering at a cozy cafe leads to new friendships and monster encounters!'
      },
      {
        type: 'knitting_circle_wisdom',
        chance: 0.15,
        description: 'The village knitting circle shares ancient wisdom about monster care!'
      }
    ]
  },

  // Agni Peaks Areas
  'agni-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: "Welcome to Agni City, the sacred mountain city where eternal flames burn and Fire-type Monsters perform ancient rituals!",
      variations: [
        "Built into volcanic slopes with flowing lava channels, this city pulses with sacred fire energy.",
        "Sacred fire temples and purification ceremonies await in this mountain city of eternal flames.",
        "The volcanic slopes echo with the power of Fire-type Monsters and their sacred rituals."
      ]
    },
    battleParameters: {
      weather: 'sunny',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fire'],
      includeStages: ['base', 'Base Stage', 'Middle Stage'], // Allow various evolution stages
      includeRanks: ['Child', 'Adult', 'C', 'B', 'A'], // Mid-level sacred city ranks
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    },
    levelRange: { min: 30, max: 65 },
    agroRange: { min: 40, max: 70 },
    itemRequirements: {
      needsMissionMandate: true
    },
    specialEncounters: [
      {
        type: 'fire_trial',
        chance: 0.12,
        description: 'The sacred fire temples offer a trial of courage and purification!'
      },
      {
        type: 'lava_channel_guardian',
        chance: 0.08,
        description: 'A powerful Fire-type guardian emerges from the flowing lava channels!'
      },
      {
        type: 'purification_ceremony',
        chance: 0.15,
        description: 'Witness an ancient purification ceremony that strengthens the bond with Fire-type Monsters!'
      }
    ]
  },

  'eternal-flame': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: "Welcome to the Eternal Flame Shrine, the mountain peak where the sacred flame burns as a beacon for all the island!",
      variations: [
        "The eternal flame atop this mountain peak serves as a divine beacon visible across the entire island.",
        "Sacred energies converge at this peak shrine where the eternal flame has burned since time immemorial.",
        "The divine light of the eternal flame illuminates your path in this most sacred of places."
      ]
    },
    battleParameters: {
      weather: 'sunny',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fire', 'Flying'],
      includeStages: ['Middle Stage', 'Final Stage'], // Only Final Stage evolution stages at this sacred location
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'], // Highest ranks at the sacred shrine
      species_min: 1,
      species_max: 1, // Single powerful species
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 50, max: 100 },
    agroRange: { min: 60, max: 90 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: "Sacred Flame Token"
    },
    specialEncounters: [
      {
        type: 'eternal_flame_guardian',
        chance: 0.25,
        description: 'The legendary guardian of the eternal flame challenges worthy adventurers!'
      },
      {
        type: 'divine_blessing',
        chance: 0.2,
        description: 'The eternal flame bestows a divine blessing upon your monsters!'
      },
      {
        type: 'phoenix_sighting',
        chance: 0.05,
        description: 'A mythical phoenix appears, drawn by the eternal flame\'s power!'
      }
    ]
  },

  // Poseidon's Reach Areas
  'atlantis-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'poseidons-reach',
    regionName: 'Poseidon\'s Reach',
    welcomeMessages: {
      base: "Welcome to Atlantis City, the magnificent underwater capital with crystal domes and flowing water streets!",
      variations: [
        "Crystal domes protect this underwater marvel where Water-type Monsters rule the flowing streets.",
        "The sea palace rises majestically in this underwater city of crystal and flowing water.",
        "Underwater markets and crystal architecture create a breathtaking aquatic metropolis."
      ]
    },
    battleParameters: {
      weather: 'rain',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Psychic'],
      includeStages: ['base', 'Base Stage', 'Middle Stage'], // Allow various evolution stages
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'], // Underwater capital ranks
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    },
    levelRange: { min: 30, max: 65 },
    agroRange: { min: 35, max: 65 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: "Diving Gear"
    },
    specialEncounters: [
      {
        type: 'sea_palace_audience',
        chance: 0.1,
        description: 'The rulers of the sea palace grant you an audience in their crystal throne room!'
      },
      {
        type: 'underwater_market',
        chance: 0.18,
        description: 'The bustling underwater markets offer rare treasures and monster encounters!'
      },
      {
        type: 'crystal_dome_mystery',
        chance: 0.12,
        description: 'Ancient mysteries hidden within the crystal domes reveal themselves!'
      }
    ]
  },

  // Jötun Tundra Areas
  'utgard-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    welcomeMessages: {
      base: "Welcome to Utgard City, the massive ice citadel home to frost giant clans with walls reaching toward the frozen sky!",
      variations: [
        "Giant architecture and ice walls create an imposing citadel where frost giant clans make their home.",
        "The massive ice citadel towers above the tundra, its walls reaching toward the endless frozen sky.",
        "Frost clan halls and giant forges echo with the power of Ice-type Monsters and ancient magic."
      ]
    },
    battleParameters: {
      weather: 'hail',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ice', 'Fighting'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'], // Higher evolution stages in this harsh environment
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'B', 'A', 'S'], // High-level frozen citadel ranks
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 50, max: 100 },
    agroRange: { min: 70, max: 95 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: "Frost Resistance Cloak"
    },
    specialEncounters: [
      {
        type: 'frost_giant_challenge',
        chance: 0.15,
        description: 'A frost giant clan leader challenges you to prove your worth in the frozen halls!'
      },
      {
        type: 'giant_forge_trial',
        chance: 0.1,
        description: 'The ancient giant forges test your monsters with trials of ice and strength!'
      },
      {
        type: 'ice_wall_guardian',
        chance: 0.08,
        description: 'A legendary guardian emerges from the massive ice walls!'
      }
    ]
  }
,
  // Newly Added Areas
  'adamant-peak': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: "Welcome to Adamant Peak, a razor-edged summit where molten veins harden into unbreakable crystal-steel spires.",
      variations: [
        "Titanium basalt pillars jut from lava-chiseled ridges, humming with magnetic resonance.",
        "Steam plumes hiss through chromium vents as Steel and Rock hybrids test their mettle.",
        "Metallic slag waterfalls cool into mirror alloys reflecting the volcanic horizon."
      ]
    },
    battleParameters: {
      weather: 'sunny',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Steel', 'Rock', 'Fire'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'B', 'A', 'S'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    },
    levelRange: { min: 45, max: 85 },
    agroRange: { min: 55, max: 80 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: 'Heat Shield Plating'
    },
    specialEncounters: [
      {
        type: 'magnet_storm',
        chance: 0.14,
        description: 'A geomagnetic surge realigns metallic monsters, provoking a territorial duel.'
      },
      {
        type: 'crystal_steel_growth',
        chance: 0.1,
        description: 'Adamant crystals erupt nearby, attracting rare Steel/Rock fusions.'
      },
      {
        type: 'molten_core_guardian',
        chance: 0.06,
        description: 'A core-plated guardian emerges from a cooling slag trench.'
      }
    ]
  },

  'ancient-reef': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    welcomeMessages: {
      base: "Welcome to the Ancient Reef, a living labyrinth of coral vaults and bioluminescent ruins.",
      variations: [
        "Sunshafts pierce pelagic arches where Water/Psychic hybrids pulse with tidal memory.",
        "Crusted obelisks whisper sonar hymns awakening fossil polyps.",
        "Current-fed terraces bloom with neon anemones guarding relic chambers." 
      ]
    },
    battleParameters: {
      weather: 'rain',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Psychic', 'Grass', 'Electric'],
      includeStages: ['base', 'Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    },
    levelRange: { min: 25, max: 70 },
    agroRange: { min: 30, max: 60 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: 'Advanced Diving Gear'
    },
    specialEncounters: [
      {
        type: 'bioluminescent_bloom',
        chance: 0.18,
        description: 'A synchronized coral glow reveals hidden reef denizens.'
      },
      {
        type: 'sonar_echo_relic',
        chance: 0.12,
        description: 'An ancient echo pulse unlocks a psychic relic guarded by hybrids.'
      },
      {
        type: 'abyssal_upwelling',
        chance: 0.07,
        description: 'Cold nutrient surge draws rare deepwater fusions upward.'
      }
    ]
  },

  'apex-throne': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: "You stand before the Apex Throne, a caldera dais where converging jetstreams crown the mountain king.",
      variations: [
        "Dragonfire thermals coil above obsidian ribs of the summit arena.",
        "Storm halos arc over rune-scored basalt where elite hybrids gather.",
        "A seismic heartbeat resonates through the throne plateaus, summoning apex predators." 
      ]
    },
    battleParameters: {
      weather: 'sunny',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dragon', 'Fire', 'Flying', 'Dark'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 60, max: 100 },
    agroRange: { min: 65, max: 95 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: 'Apex Sigil'
    },
    specialEncounters: [
      { type: 'apex_convergence', chance: 0.22, description: 'Jetstream and seismic pulse align spawning apex hybrid.' },
      { type: 'obsidian_resonance', chance: 0.11, description: 'Basalt rune flare elevates Dragon/Fire synergy.' }
    ]
  },

  // Newly Added Set
  'sacred-vapors': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    welcomeMessages: {
      base: 'You descend into the Sacred Vapors where mineral mists thicken prophetic focus.',
      variations: [
        'Condensed droplets refract prism runes in the air.',
        'A low humming chant resonates through vapor columns.',
        'Heat pulses cause visions to ripple across cave walls.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Psychic', 'Fairy', 'Fire'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 65, max: 100 },
    agroRange: { min: 55, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Vapor Rite Seal' },
    specialEncounters: [
      { type: 'vision_overflow', chance: 0.22, description: 'Intense vapor surge crystallizes a rare Psychic hybrid.' },
      { type: 'condensate_glimmer', chance: 0.1, description: 'Glimmer pockets heighten Fairy resonance.' }
    ]
  },
  'shadow-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'ravens-shadow',
    regionName: "Raven's Shadow",
    welcomeMessages: {
      base: 'You enter Shadow Village where silhouettes stretch and whisper oblique counsel.',
      variations: [
        'Divergent shadows detach briefly then realign.',
        'Low caws punctuate shifting canopy twilight.',
        'Lanternless alleys remain inexplicably lit.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dark', 'Ghost'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 30, max: 80 },
    agroRange: { min: 25, max: 65 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'shadow_detachment', chance: 0.19, description: 'Detached shadow forms a Dark/Ghost hybrid.' },
      { type: 'raven_enigma', chance: 0.1, description: 'Riddle exchange boosts Dark encounter tier.' }
    ]
  },
  'shooting-star': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'aurora-heights',
    regionName: 'Aurora Heights',
    welcomeMessages: {
      base: 'High altitude winds bite at Shooting Star Peak where meteors thread luminous arcs.',
      variations: [
        'Fragments hiss into crystal catchment nets.',
        'Auroral bands fold around observation spires.',
        'Thin air vibrates with stellar resonance.'
      ]
    },
    battleParameters: { weather: 'hail', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Psychic', 'Ice', 'Fairy'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 70, max: 100 },
    agroRange: { min: 60, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Celestial Catch Permit' },
    specialEncounters: [
      { type: 'meteor_convergence', chance: 0.23, description: 'Simultaneous streaks spawn rare stellar hybrid.' },
      { type: 'aurora_focus', chance: 0.12, description: 'Focused aurora ring enhances Psychic synergy.' }
    ]
  },
  'silk-library': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'anansi-woods',
    regionName: 'Anansi Woods',
    welcomeMessages: {
      base: 'You step into the Silk Library where crystalline webs archive luminous narrative threads.',
      variations: [
        'Indexing drones reweave damaged pattern spines.',
        'Story glyphs crawl slowly along tension lines.',
        'Dust motes settle forming transient chapter headings.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Bug', 'Psychic', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 18, max: 55 },
    agroRange: { min: 15, max: 45 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'chapter_unfurl', chance: 0.19, description: 'New silk chapter attracts rare narrative guardians.' },
      { type: 'sap_illumination', chance: 0.09, description: 'Glowing sap reveals a hidden Bug/Fairy hybrid.' }
    ]
  },
  'sky-harbor': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'storm-belt',
    regionName: 'Storm Belt',
    welcomeMessages: {
      base: 'You arrive at Sky Harbor where windborne vessels dock on braids of compressed air.',
      variations: [
        'Sail gliders pivot to face shifting jet streams.',
        'Cargo cranes swivel using sustained updraft torsion.',
        'Signal kites flash threaded lightning codes.'
      ]
    },
    battleParameters: { weather: 'wind', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Flying', 'Electric', 'Steel'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 50, max: 85 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Aerial Docking Pass' },
    specialEncounters: [
      { type: 'jetstream_alignment', chance: 0.21, description: 'Aligned currents spawn rare Flying/Electric hybrid.' },
      { type: 'harbor_signal_event', chance: 0.11, description: 'Signal flare attracts steel-plated courier.' }
    ]
  },
  'starlight-observatory': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'aurora-heights',
    regionName: 'Aurora Heights',
    welcomeMessages: {
      base: 'You enter the Starlight Observatory where crystal arrays track shifting constellations.',
      variations: [
        'Lens facets rotate silently correcting parallax.',
        'Star maps overlay real sky in translucent grids.',
        'Meteor dust settles onto calibration pedestals.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Psychic', 'Ice', 'Fairy'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 65, max: 100 },
    agroRange: { min: 55, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Star Chart Key' },
    specialEncounters: [
      { type: 'constellation_focus', chance: 0.22, description: 'Peak alignment spawns rare Psychic hybrid.' },
      { type: 'aurora_lens_refraction', chance: 0.1, description: 'Refraction event boosts Ice/Fairy synergy.' }
    ]
  },
  'stonehenge-site': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    welcomeMessages: {
      base: 'Standing monoliths loom at the Stonehenge Site aligning with pulsing celestial nodes.',
      variations: [
        'Shadow lengths synchronize across disparate stones.',
        'Subsonic vibrations travel through ring lintels.',
        'Glyph flares trace orbital computations.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Rock', 'Psychic'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'A'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 50, max: 85 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Druidic Alignment Rod' },
    specialEncounters: [
      { type: 'solstice_alignment', chance: 0.2, description: 'Alignment pulses spawn rare Rock/Psychic hybrid.' },
      { type: 'ring_resonance', chance: 0.1, description: 'Resonance wave elevates encounter quality.' }
    ]
  },
  'storm-riders': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'tempest-zones',
    regionName: 'Tempest Zones',
    welcomeMessages: {
      base: 'Roaring currents circle the Storm Riders Outpost perched at the edge of stacked thunderheads.',
      variations: [
        'Lightning lattices stitch between anchor pylons.',
        'Pressure drops trigger alarm wind chimes.',
        'Training kites dance sparking ion trails.'
      ]
    },
    battleParameters: { weather: 'storm', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 70, max: 100 },
    agroRange: { min: 60, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Storm Rider License' },
    specialEncounters: [
      { type: 'lightning_chain_event', chance: 0.23, description: 'Chain strikes spawn rare Electric hybrid.' },
      { type: 'eye_of_tempest', chance: 0.12, description: 'Eye formation boosts Flying/Steel synergy.' }
    ]
  },

  'apollo-temple': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: "Welcome to Apollo Temple, a sun-ray sanctum with heliotropic mirrors channeling radiant fire.",
      variations: [
        "Gold-inlaid pylons focus solar flares into prismatic corridors.",
        "Incense thermals lift embers forming constellation glyphs midair.",
        "Solar braziers ring harmonic chimes guiding Fire/Psychic acolytes." 
      ]
    },
    battleParameters: {
      weather: 'sunny',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fire', 'Psychic', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'B', 'A', 'S'],
      species_min: 1,
      species_max: 2,
    levelRange: { min: 40, max: 90 },
    agroRange: { min: 45, max: 75 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: 'Solar Lens Key'
    },
    specialEncounters: [
      {
        type: 'solar_alignment',
        chance: 0.2,
        description: 'Mirror arrays align—radiant hybrids manifest empowered.'
      },
      {
        type: 'incense_vision',
        chance: 0.12,
        description: 'Psychic flame haze grants foresight, improving encounter quality.'
      },
      {
        type: 'glyph_guardian',
        chance: 0.07,
        description: 'A sigil-bound guardian tests your resolve.'
      }
    ]
  },

  'aurora-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    welcomeMessages: {
      base: "Welcome to Aurora Village, a crystalline hamlet illuminated nightly by dancing sky veils.",
      variations: [
        "Ice lanterns refract auroral bands into tranquil courtyards.",
        "Soft geothermal vents warm communal circles beneath emerald lights.",
        "Snowglass cabins hum as Ice/Fairy companions weave shimmer trails." 
      ]
    },
    battleParameters: {
      weather: 'hail',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ice', 'Fairy', 'Electric'],
      includeStages: ['base', 'Base Stage', 'Middle Stage'],
      includeRanks: ['Baby I', 'Baby II', 'Child', 'D', 'E', 'C'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 5, max: 35 },
    agroRange: { min: 10, max: 40 },
    itemRequirements: {
      needsMissionMandate: true
    },
    specialEncounters: [
      {
        type: 'aurora_bloom',
        chance: 0.22,
        description: 'Peak aurora intensity soothes wild monsters, easing bonding.'
      },
      {
        type: 'crystal_carving_circle',
        chance: 0.15,
        description: 'Villagers carve focusing prisms that attract Fairy hybrids.'
      },
      {
        type: 'glacial_echo',
        chance: 0.08,
        description: 'A harmonic ice echo reveals a hidden den.'
      }
    ]
  },

  'avalon-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    welcomeMessages: {
      base: "Welcome to Avalon City, a mist-crowned floating bastion where waterfalls descend into levitating terraced lakes.",
      variations: [
        "Runic aqueduct rings suspend luminescent koi-drake hybrids above the sea.",
        "Mist bridges braid between isles seeded with Water/Fairy sanctums.",
        "Skyward fountains cycle through gravity inversions energizing Electric currents." 
      ]
    },
    battleParameters: {
      weather: 'rain',
      terrain: 'normal'
    },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Fairy', 'Electric', 'Psychic'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'B', 'A', 'S'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 3
    },
    levelRange: { min: 50, max: 95 },
    agroRange: { min: 55, max: 85 },
    itemRequirements: {
      needsMissionMandate: true,
      itemRequired: 'Aerial Navigators Pass'
    },
    specialEncounters: [
      {
        type: 'gravity_surge',
        chance: 0.16,
        description: 'A levitation field spike causes rare aerial Water hybrids to appear.'
      },
      {
        type: 'mist_court_audience',
        chance: 0.11,
        description: 'The crystalline mist court grants you a temporary blessing.'
      },
      {
        type: 'runic_resonance',
        chance: 0.07,
        description: 'Runic aqueducts resonate, luring Psychic/Fairy emissaries.'
      }
    ]
  },

  // Additional Newly Added Areas
  'bone-citadel': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    welcomeMessages: {
      base: 'Welcome to the Bone Citadel, a necro-glacial fortress grown from titan rib arches and permafrost marrow.',
      variations: [
        'Wind howls through hollow titan spines, producing mournful organ tones.',
        'Frost-rimed ossuaries shimmer with aurora reflections in carved marrow windows.',
        'Runic femur pylons pulse dimly, guiding lost travelers—if they are worthy.'
      ]
    },
    battleParameters: { weather: 'hail', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ice', 'Ghost', 'Dark'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 60, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Bone Wayfinder Sigil' },
    specialEncounters: [
      { type: 'ossuary_echo', chance: 0.18, description: 'Resonant bone chimes awaken a spectral guardian.' },
      { type: 'aurora_requiem', chance: 0.12, description: 'Auroral surge empowers Ice/Ghost hybrids.' },
      { type: 'marrow_seal_break', chance: 0.07, description: 'A sealed crypt fractures, releasing an ancient fusion.' }
    ]
  },
  'bone-town': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    welcomeMessages: {
      base: 'Welcome to Bone Town, a frontier settlement built from cleaned giant remains and packed snow mortar.',
      variations: [
        'Smoke curls from marrow-hollow chimneys lining the frozen thoroughfare.',
        'Bone totems ward off restless spirits as traders barter frost-salvaged relics.',
        'Children carve runes into scrap vertebrae, learning ancestral scripts.'
      ]
    },
    battleParameters: { weather: 'hail', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ice', 'Ghost', 'Normal'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 25, max: 55 },
    agroRange: { min: 25, max: 55 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'spirit_markets', chance: 0.2, description: 'A transient spirit bazaar offers rare barter.' },
      { type: 'bone_weather_shift', chance: 0.1, description: 'Sudden chill animates decorative totems.' }
    ]
  },
  'cairn-town': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    welcomeMessages: {
      base: 'Welcome to Cairn Town, where stacked rune-stones track migratory ice flows and celestial drift.',
      variations: [
        'Fresh cairns bloom overnight—mystics say the glacier spirits rebuild them.',
        'Frost lichen paints glowing sigils across guardian stones.',
        'Wind-carved monolith alleys hum at dawn with harmonic resonance.'
      ]
    },
    battleParameters: { weather: 'hail', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ice', 'Rock', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 20, max: 50 },
    agroRange: { min: 20, max: 50 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'cairn_alignment', chance: 0.16, description: 'Stone lines align—rare Rock/Ice hybrid appears.' },
      { type: 'lichen_glow', chance: 0.11, description: 'Bioluminescent lichen attracts Fairy allies.' }
    ]
  },
  'celestial-shrine': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'agni-peaks',
    regionName: 'Agni Peaks',
    welcomeMessages: {
      base: 'Welcome to the Celestial Shrine, a ridge-top observatory where solar fire meets starfall embers.',
      variations: [
        'Prism dishes track constellations while volcanic vents backlight the altar.',
        'Meteor glass tiles focus dawn rays into ascending flame spirals.',
        'Chanting acolytes weave Fire and Psychic harmonics into radiant veils.'
      ]
    },
    battleParameters: { weather: 'sunny', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fire', 'Psychic', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'B', 'A', 'S'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 45, max: 90 },
    agroRange: { min: 45, max: 75 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Star Ember Relic' },
    specialEncounters: [
      { type: 'meteor_shower', chance: 0.2, description: 'Starfall boosts Fire/Psychic fusion stats.' },
      { type: 'solar_syzygy', chance: 0.1, description: 'Rare alignment spawns a radiant guardian.' }
    ]
  },
  'coastal-settlement': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    welcomeMessages: {
      base: 'Welcome to the Coastal Settlement, a tide-hugging outpost of coral-lashed piers and net terraces.',
      variations: [
        'Sea-spray wind chimes guide fishing skiffs to biolight docks.',
        'Kelp-dried lattices creak rhythmically with the swell.',
        'Tidal pools brim with juvenile hybrids awaiting release.'
      ]
    },
    battleParameters: { weather: 'rain', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Normal', 'Grass'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 15, max: 45 },
    agroRange: { min: 20, max: 50 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'high_tide_cycle', chance: 0.18, description: 'Unusual tide brings in rare Water/Grass fusion.' },
      { type: 'kelp_bloom', chance: 0.12, description: 'Nutrient surge increases encounter density.' }
    ]
  },
  'corvus-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'thunderbird-heights',
    regionName: 'Thunderbird Heights',
    welcomeMessages: {
      base: 'Welcome to Corvus City, storm-perched metropolis of slate terraces and lightning-fed aeries.',
      variations: [
        'Raven-wing banners snap across conductive sky bridges.',
        'Voltage cascades race down obsidian spires into storage coils.',
        'Flock sentries spiral above, mapping storm cell trajectories.'
      ]
    },
    battleParameters: { weather: 'thunderstorm', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Electric', 'Dark', 'Flying'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'A', 'S'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 50, max: 90 },
    agroRange: { min: 55, max: 85 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Conductive Cloak' },
    specialEncounters: [
      { type: 'storm_convergence', chance: 0.22, description: 'Multiple lightning cells fuse, empowering Electric hybrids.' },
      { type: 'shadow_flock_trial', chance: 0.1, description: 'Dark/Flying sentries initiate an aerial gauntlet.' }
    ]
  },

  // Further Added Areas
  'death-pyramid': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    welcomeMessages: {
      base: 'You approach the Death Lord Pyramid, its bone throne chambers echoing with ancestral murmurs.',
      variations: [
        'Torchlight crawls over obsidian death runes mapping the soul journey.',
        'Spectral guardians drift between stepped terraces awaiting offerings.',
        'A chill wind carries petal incense from ongoing remembrance rites.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ghost', 'Dark'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 60, max: 100 },
    agroRange: { min: 65, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Obsidian Offering Mask' },
    specialEncounters: [
      { type: 'ancestral_procession', chance: 0.22, description: 'A procession of ancestral spirits reveals a rare fusion.' },
      { type: 'throne_challenge', chance: 0.15, description: 'The bone throne guardian tests your resolve.' },
      { type: 'soul_rune_flash', chance: 0.08, description: 'Runes flare, empowering Ghost-type abilities.' }
    ]
  },
  'delphi-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    welcomeMessages: {
      base: 'Welcome to Delphi City, where sacred vapors curl through marble colonnades of prophecy.',
      variations: [
        'Seers murmur fragmented futures beneath resonant bronze bowls.',
        'Pilgrims line incense terraces awaiting guided visions.',
        'Mind crystals pulse faintly synchronizing with your thoughts.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Psychic', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 30, max: 75 },
    agroRange: { min: 25, max: 60 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'shared_vision', chance: 0.18, description: 'Collective trance improves encounter quality.' },
      { type: 'oracle_trial', chance: 0.12, description: 'A seer challenges your strategic foresight.' }
    ]
  },
  'divine-workshop': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'hephaestus-forge',
    regionName: 'Hephaestus Forge',
    welcomeMessages: {
      base: 'You enter the Divine Workshop, anvils ringing with god-forged resonance.',
      variations: [
        'Runic bellows channel eternal flame through alloy crucibles.',
        'Cyclopean assistants temper glowing ingots with rhythmic precision.',
        'Forged sparks trace sigils midair before fading.'
      ]
    },
    battleParameters: { weather: 'sunny', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Steel', 'Fire'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 50, max: 85 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Forge Access Seal' },
    specialEncounters: [
      { type: 'divine_spark', chance: 0.2, description: 'A forge spark animates into a rare Steel/Fire hybrid.' },
      { type: 'master_anvil_trial', chance: 0.1, description: 'Complete a forging pattern to impress the spirits.' }
    ]
  },
  'dragon-graveyard': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'draconic-abyss',
    regionName: 'Draconic Abyss',
    welcomeMessages: {
      base: 'You tread upon the Dragon Graveyard, where ancient bones drift as silent monuments.',
      variations: [
        'Etheric embers flicker in hollow eye sockets of colossal skulls.',
        'Bone islands creak, repositioned by unseen thermal currents.',
        'Draconic whispers coil through volcanic updrafts.'
      ]
    },
    battleParameters: { weather: 'sunny', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dragon', 'Dark', 'Fire'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 65, max: 100 },
    agroRange: { min: 70, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Bone Dust Ward' },
    specialEncounters: [
      { type: 'ancestral_roar', chance: 0.25, description: 'Echo roar summons a spectral dragon fusion.' },
      { type: 'bone_island_shift', chance: 0.12, description: 'Rearranged bones reveal a hidden lair.' }
    ]
  },
  'druid-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    welcomeMessages: {
      base: 'Welcome to Druid Village where living rock and moss weave seamless dwellings.',
      variations: [
        'Stone masons coax runes to bloom in bioluminescent patterns.',
        'Circle chants resonate through aligned menhir paths.',
        'Patient guardians cultivate crystal seeds between slabs.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Rock', 'Grass', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 20, max: 55 },
    agroRange: { min: 20, max: 50 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'stone_circle_alignment', chance: 0.18, description: 'Aligned stones amplify Grass/Fairy presence.' },
      { type: 'crystal_seed_sprout', chance: 0.1, description: 'A crystal seed germinates attracting rare hybrids.' }
    ]
  },
  'electric-vortex': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'tempest-zones',
    regionName: 'Tempest Zones',
    welcomeMessages: {
      base: 'You spiral toward the Electric Vortex, heart of converging storm channels.',
      variations: [
        'Lightning filaments braid into a glowing central core.',
        'Pressure waves distort perception along inner rings.',
        'Thunder pulses sync with your heartbeat as you approach.'
      ]
    },
    battleParameters: { weather: 'thunderstorm', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 60, max: 100 },
    agroRange: { min: 65, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Insulated Flight Harness' },
    specialEncounters: [
      { type: 'charge_supercell', chance: 0.24, description: 'Supercell forms boosting Electric encounters.' },
      { type: 'magnetic_lens_event', chance: 0.1, description: 'Field lens concentrates a rare hybrid.' }
    ]
  },
  'enchanted-glade': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'seelie-courts',
    regionName: 'Seelie Courts',
    welcomeMessages: {
      base: 'Welcome to the Enchanted Glade where midnight wishes bend fairy light.',
      variations: [
        'Will-o-wisps trace spirals above dew jeweled petals.',
        'Mushroom circles hum with gentle harmonic chords.',
        'Silver pollen drifts forming temporary sigils overhead.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fairy', 'Grass'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 25, max: 80 },
    agroRange: { min: 20, max: 55 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'midnight_wish_ritual', chance: 0.2, description: 'Successful wish ritual improves next encounter rarity.' },
      { type: 'glade_alignment', chance: 0.12, description: 'Ambient magic surge strengthens Fairy moves.' }
    ]
  },
  'eternal-dusk': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'ravens-shadow',
    regionName: "Raven's Shadow",
    welcomeMessages: {
      base: 'You enter the Eternal Dusk Grove, where twilight geometry defies natural law.',
      variations: [
        'Trees cast multiple conflicting shadows.',
        'Raven silhouettes merge then split along branch lines.',
        'Ambient light never brightens nor fully fades.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dark', 'Ghost'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 60, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Shadow Path Token' },
    specialEncounters: [
      { type: 'paradox_shadow', chance: 0.21, description: 'A shadow detaches forming a rare Dark/Ghost hybrid.' },
      { type: 'raven_riddle_event', chance: 0.11, description: 'Solving a spatial riddle alters encounter table favorably.' }
    ]
  }
  ,
  // Newly Added Batch
  'flame-chasm': {
    landmass: 'sky-isles',
    landmassName: 'Sky Isles',
    region: 'draconic-abyss',
    regionName: 'Draconic Abyss',
    welcomeMessages: {
      base: 'You descend toward the Flame Chasm where dragonfire cascades into a bottomless rift.',
      variations: [
        'Heat plumes spiral upward carrying ember motes that roar like distant wings.',
        'Molten cataracts pulse in rhythmic trial intervals.',
        'Soot silhouettes of fledgling drakes dart between glowing ledges.'
      ]
    },
    battleParameters: { weather: 'sunny', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fire', 'Dragon', 'Dark'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 65, max: 100 },
    agroRange: { min: 70, max: 95 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Heat Ward Plating' },
    specialEncounters: [
      { type: 'trial_flare_surge', chance: 0.23, description: 'A flare surge empowers Fire/Dragon hybrids.' },
      { type: 'ember_plunge_trial', chance: 0.12, description: 'Survive a ledge collapse to trigger a rare encounter.' }
    ]
  },
  'fog-temple': {
    landmass: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    region: 'mist-marshlands',
    regionName: 'Mist Marshlands',
    welcomeMessages: {
      base: 'You approach the hidden Fog Temple, its silhouette shifting within luminous marsh haze.',
      variations: [
        'Bog spirits trace spiral glyphs in drifting vapor.',
        'Condensation beads into hovering droplets that refract pale runes.',
        'Submerged bells toll with muffled resonance beneath boardwalks.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Grass', 'Ghost'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 30, max: 80 },
    agroRange: { min: 25, max: 70 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'spirit_mist_convergence', chance: 0.2, description: 'Mist density spike heightens Ghost/Water rarity.' },
      { type: 'echoing_bell_ritual', chance: 0.11, description: 'Bell resonance triggers a guardian apparition.' }
    ]
  },
  'forge-town': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'hephaestus-forge',
    regionName: 'Hephaestus Forge',
    welcomeMessages: {
      base: 'Ore carts rattle as you arrive in Forge Town—gateway to divine metal veins.',
      variations: [
        'Refining towers vent steady orange plumes.',
        'Apprentices assay glowing ingots at slag terraces.',
        'Chromatic sparks arc between calibration pylons.'
      ]
    },
    battleParameters: { weather: 'sunny', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Steel', 'Rock', 'Fire'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 20, max: 60 },
    agroRange: { min: 20, max: 55 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'rich_vein_strike', chance: 0.18, description: 'A newly exposed vein attracts rare Steel-type fusions.' },
      { type: 'furnace_overpressure', chance: 0.1, description: 'Pressure spike animates molten alloy guardian.' }
    ]
  },
  'great-tree': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'anansi-woods',
    regionName: 'Anansi Woods',
    welcomeMessages: {
      base: 'You stand at the roots of the Great Story Tree, trunk etched with living silk script.',
      variations: [
        'Story weavers reposition threads depicting shifting legends.',
        'Amber sap globes project faint narrative silhouettes.',
        'Canopy chimes respond to whispered plot changes.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Bug', 'Grass', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 18, max: 55 },
    agroRange: { min: 15, max: 50 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'chapter_unfurl', chance: 0.19, description: 'New silk chapter attracts rare narrative guardians.' },
      { type: 'sap_illumination', chance: 0.1, description: 'Glowing sap reveals a hidden Bug/Fairy hybrid.' }
    ]
  },
  'imperial-palace': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'long-valley',
    regionName: 'Long Valley',
    welcomeMessages: {
      base: 'You ascend terrace steps toward the Imperial Dragon Palace crowned in gilded scales.',
      variations: [
        'Pearl lanterns pulse with measured ancestral cadence.',
        'Celestial banners ripple without wind.',
        'Elder drakes observe in reflective meditation.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dragon', 'Psychic', 'Fairy'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 60, max: 100 },
    agroRange: { min: 55, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Imperial Audience Seal' },
    specialEncounters: [
      { type: 'imperial_audience', chance: 0.22, description: 'Audience court tests worth—success boosts encounter rarity.' },
      { type: 'pearl_resonance', chance: 0.12, description: 'Resonant pearl amplifies Psychic/Dragon synergy.' }
    ]
  },
  'jade-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'long-valley',
    regionName: 'Long Valley',
    welcomeMessages: {
      base: 'You enter Jade Village where artisans polish scale fragments into luminous charms.',
      variations: [
        'Water channels tumble through carving courts.',
        'Polishers hold gemstones against sunrise for hue calibration.',
        'Young drakes trade scales for crafted ward pendants.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dragon', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 25, max: 65 },
    agroRange: { min: 20, max: 55 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'jade_reflection', chance: 0.17, description: 'Reflected light refines Fairy/Dragon fusion outcome.' },
      { type: 'artisan_exchange', chance: 0.1, description: 'Trade materials to influence next encounter type.' }
    ]
  },
  'kumasi-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'anansi-woods',
    regionName: 'Anansi Woods',
    welcomeMessages: {
      base: 'Suspended web avenues welcome you to Kumasi City—market of woven stories.',
      variations: [
        'Silk brokers negotiate narrative thread lots.',
        'Pattern looms hum encoding fresh folklore.',
        'Glitter spores drift marking seasonal tale cycles.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Bug', 'Normal', 'Grass'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 18, max: 55 },
    agroRange: { min: 15, max: 45 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'market_story_weave', chance: 0.19, description: 'Collaborative weaving enhances Bug encounter quality.' },
      { type: 'silk_pattern_glow', chance: 0.09, description: 'Glowing pattern lures hybrid storyteller creature.' }
    ]
  },
  'memory-cliffs': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    welcomeMessages: {
      base: 'Wind keens across the Memory Cliffs where runes chronicle unbroken island epochs.',
      variations: [
        'Sunset light reveals otherwise hidden strata inscriptions.',
        'Resonant chisel echoes replay historic turning points.',
        'Moss retracts temporarily exposing archival glyph seams.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Rock', 'Psychic'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 55, max: 95 },
    agroRange: { min: 50, max: 85 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Runic Access Key' },
    specialEncounters: [
      { type: 'chronicle_alignment', chance: 0.2, description: 'Aligned glyphs boost Rock/Psychic rarity.' },
      { type: 'echo_reverberation', chance: 0.1, description: 'Historic echo forms a guardian sentinel.' }
    ]
  }
  ,
  // Newly Added Set
  'mictlampa-city': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    welcomeMessages: {
      base: 'You emerge into Mictlampa City where spirit markets glow beneath ossuary arches.',
      variations: [
        'Incense braziers line bone colonnades.',
        'Guides barter memory tokens at flickering altars.',
        'Soul lantern canals reflect drifting ancestor silhouettes.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ghost', 'Dark'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 25, max: 75 },
    agroRange: { min: 25, max: 65 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'ancestral_market', chance: 0.18, description: 'Market chant improves Ghost hybrid odds.' },
      { type: 'lantern_alignment', chance: 0.1, description: 'Aligned lanterns summon a rare Dark/Ghost fusion.' }
    ]
  },
  'mist-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'mist-marshlands',
    regionName: 'Mist Marshlands',
    welcomeMessages: {
      base: 'You approach Mist Village where stilt homes fade in and out of spectral haze.',
      variations: [
        'Reed flutes echo across glassy pools.',
        'Tidal vapors braid around suspended walkways.',
        'Children chase luminous frog sprites between piers.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Water', 'Ghost', 'Grass'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 15, max: 55 },
    agroRange: { min: 15, max: 50 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'fog_drift_glow', chance: 0.17, description: 'Biolight surge raises Water/Grass rarity.' },
      { type: 'pier_bell_resonance', chance: 0.09, description: 'Bell tone calls a Ghost guardian.' }
    ]
  },
  'nine-dragons': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'long-valley',
    regionName: 'Long Valley',
    welcomeMessages: {
      base: 'Mist tumbles at Nine Dragons Falls where spectral drakes coil in water arches.',
      variations: [
        'Pearl droplets hover briefly forming draconic sigils.',
        'Cascade thunder harmonizes with low dragon chants.',
        'Prismatic spray refracts scales of unseen guardians.'
      ]
    },
    battleParameters: { weather: 'rain', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Dragon', 'Water', 'Fairy'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'Ultimate', 'A', 'S'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 60, max: 100 },
    agroRange: { min: 55, max: 90 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Waterfall Pilgrim Charm' },
    specialEncounters: [
      { type: 'cascade_convergence', chance: 0.23, description: 'Water arcs align spawning a rare Dragon hybrid.' },
      { type: 'pearl_mist_event', chance: 0.11, description: 'Mist pearls amplify Fairy resonance.' }
    ]
  },
  'oberon-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'seelie-courts',
    regionName: 'Seelie Courts',
    welcomeMessages: {
      base: 'You cross into Oberon Village where regal fae courts rehearse moonlit rites.',
      variations: [
        'Crystal pennants chime in synchronized cadence.',
        'Petal banners shimmer with phased luminescence.',
        'Court stewards trace orbit patterns in soft moss.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fairy', 'Grass', 'Psychic'],
      includeStages: ['Base Stage', 'Middle Stage', 'Final Stage'],
      includeRanks: ['Child', 'Adult', 'Perfect', 'C', 'B', 'A'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 25, max: 80 },
    agroRange: { min: 25, max: 60 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'court_rehearsal', chance: 0.2, description: 'Ritual rehearsal elevates Fairy encounter tier.' },
      { type: 'regal_alignment', chance: 0.1, description: 'Crown glyph alignment summons psychic fae hybrid.' }
    ]
  },
  'puck-town': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'seelie-courts',
    regionName: 'Seelie Courts',
    welcomeMessages: {
      base: 'Laughter echoes through Puck Town—mosaic lanes twisting with playful glamours.',
      variations: [
        'Illusory lanterns swap colors unpredictably.',
        'Prank sprites rearrange signpost glyphs.',
        'Soft chimes trigger minor harmless illusions.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Fairy', 'Dark'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 18, max: 55 },
    agroRange: { min: 15, max: 45 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'prank_confluence', chance: 0.19, description: 'Multiple illusions converge spawning rare trickster hybrid.' },
      { type: 'glamour_spiral', chance: 0.09, description: 'Spiral charm heightens Fairy/Dark synergy.' }
    ]
  },
  'pythia-village': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    welcomeMessages: {
      base: 'Incense swirls in Pythia Village where novice seers memorize resonance hymns.',
      variations: [
        'Bronze bowls ring with training intervals.',
        'Petal offerings drift across scrying basins.',
        'Initiates trace sigils in heated sand for focus.'
      ]
    },
    battleParameters: { weather: 'clear', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Psychic', 'Fairy'],
      includeStages: ['Base Stage', 'Middle Stage'],
      includeRanks: ['Child', 'Adult', 'C', 'B'],
      species_min: 1,
      species_max: 2,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 15, max: 50 },
    agroRange: { min: 10, max: 45 },
    itemRequirements: { needsMissionMandate: true },
    specialEncounters: [
      { type: 'basin_vision_spark', chance: 0.18, description: 'Shared vision improves Psychic encounter quality.' },
      { type: 'sigil_focus_trial', chance: 0.1, description: 'Sigil completion spawns rare Fairy hybrid.' }
    ]
  },
  'river-crossing': {
    landmass: 'conoco-island',
    landmassName: 'Conoco Island',
    region: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    welcomeMessages: {
      base: 'Current whispers guide you along the River of Souls crossing.',
      variations: [
        'Spectral ferryman poles through phosphorescent eddies.',
        'Petal rafts carry offerings downstream.',
        'Translucent silhouettes wait at mist moorings.'
      ]
    },
    battleParameters: { weather: 'fog', terrain: 'normal' },
    monsterRollerParameters: {
      speciesTypesOptions: ['Ghost', 'Water'],
      includeStages: ['Middle Stage', 'Final Stage'],
      includeRanks: ['Adult', 'Perfect', 'A'],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 2
    },
    levelRange: { min: 45, max: 85 },
    agroRange: { min: 45, max: 80 },
    itemRequirements: { needsMissionMandate: true, itemRequired: 'Ferryman Token' },
    specialEncounters: [
      { type: 'soul_current_confluence', chance: 0.21, description: 'Converging currents reveal rare Ghost/Water fusion.' },
      { type: 'ferryman_judgment', chance: 0.11, description: 'Passing trial grants boosted encounter quality.' }
    ]
  }
},
// Primordial Jungle — Conoocoo Archipelago
'amber-village': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'primordial-jungle',
  regionName: 'Primordial Jungle',
  welcomeMessages: {
    base: 'Welcome to Amber Village—where time is trapped in honeyed stone and even the breeze smells prehistoric.',
    variations: [
      'Sunlight glints through amber panes, casting fossil-shadows that feel almost… alive.',
      'Craftsfolk chip memory from resin—don’t blink, the past likes to stare back.',
      'Amber spiders skitter across market stalls, weaving threads that catch more than flies.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Bug', 'Rock', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'D', 'E'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 10, max: 20 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'amber_resonance', chance: 0.18, description: 'Fossilized resin hums—ancient species emerge at increased rates.' },
    { type: 'paleontic_echo', chance: 0.12, description: 'A time-lapse gust reveals a rare Bug/Rock variant preserved in amber sheen.' }
  ]
},

// Poseidon’s Reach — Conoco Island
'amphitrite-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: "Welcome to Amphitrite Town—tidal bells ring, priestesses chant, and the docks gleam with sea-blessed bronze.",
    variations: [
      'Sea-silk banners ripple as salt spray kisses coral-tiled streets.',
      'Pearl shrines glow softly—offer a shell, gain a traveler’s blessing.',
      'Wavebreak terraces hum with water hymns; even the gulls sound reverent.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Fairy', 'Electric'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'D'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 8, max: 35 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'tide_blessing', chance: 0.20, description: 'High tide empowers Water/Fairy moves and attracts rare support species.' },
    { type: 'pearl_vigil', chance: 0.10, description: 'Temple vigil yields a ritual encounter with a guardian attendant.' }
  ]
},

// Jötun Tundra — Conoco Island
'aurora-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Aurora Village—where the sky writes poems in light and the snow listens.',
    variations: [
      'Crystal arches refract the aurora—footsteps ring like tiny bells on snowglass.',
      'Hearth-lanterns glow with captured starlight; locals swear it sings.',
      'Frost sprites skate the air—don’t worry, they only borrow heat you can spare.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Fairy', 'Electric'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 5, max: 15 },
  agroRange: { min: 5, max: 30 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'aurora_crown', chance: 0.22, description: 'Skyfire intensifies—Ice/Fairy spawns gain bonus abilities.' },
    { type: 'snowglass_resonance', chance: 0.12, description: 'Resonant arches call a rare Electric/Ice wanderer to the square.' }
  ]
},
// Poseidon's Reach — Conoco Island
'avalon-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: 'Welcome to Avalon City—mist-crowned terraces and rune-lit aqueduct rings above thundering falls.',
    variations: [
      'Water-lift gondolas drift between tiers while priest-engineers tune the runic sluice gates.',
      'Spray halos every walkway; the city hums with tidal engines and quiet miracles.',
      'Look down—yes, the lake is floating. No, you’re not dreaming. Probably.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Fairy', 'Electric'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 55 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Tidal Seal' },
  specialEncounters: [
    { type: 'mist_crown', chance: 0.20, description: 'Cascading spray amplifies Water/Fairy moves; rare guardians surface.' },
    { type: 'runic_aqueduct_resonance', chance: 0.12, description: 'Activated sigils attract Electric hybrids along the spillways.' }
  ]
},

// Crowsfoot Marsh — Conoco Island
'bog-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'crowsfoot-marsh',
  regionName: 'Crowsfoot Marsh',
  welcomeMessages: {
    base: 'Welcome to Bog Town—stilt-steps, reed roofs, and lanterns that keep the fog polite.',
    variations: [
      'Peat barges creak through channels while frog-drummers keep time at dusk.',
      'Guides tap boardwalk posts—one for depth, two for danger, three for dinner.',
      'If the path moves, it’s a log. If it waves back, it’s not.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Poison', 'Bug', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 7, max: 17 },
  agroRange: { min: 15, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'peat_mist', chance: 0.22, description: 'Marsh gas shrouds the docks—Poison types surge with evasive boons.' },
    { type: 'lantern_swarm', chance: 0.12, description: 'Will-o’-wisps lure out rare Bug/Grass predators along the reeds.' }
  ]
},

// Jötun Tundra — Conoco Island
'bone-citadel': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to the Bone Citadel—titan ribs for arches, marrow vaults for halls, frost for mortar.',
    variations: [
      'Polar wind plays the rib colonnades like a grave organ—dress warm, breathe steadier.',
      'Blue witchlights prowl the galleries; the bones remember footfalls.',
      'Frozen banners crackle—oaths keep better here than the living do.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Ghost', 'Dark'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 35, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Warded Bone Sigil' },
  specialEncounters: [
    { type: 'marrow_vaults', chance: 0.20, description: 'Sealed crypts crack—Ghost/Ice elites stir with burial boons.' },
    { type: 'frost_wail', chance: 0.10, description: 'A citadel keening summons a rare Dark apparition to the ramparts.' }
  ]
},

// Jötun Tundra — Conoco Island
'bone-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Bone Town—frontier grit and snow-packed beams between friendly giant remains.',
    variations: [
      'Tradesmen carve vertebrae into doorframes; kids sled on rib toboggans.',
      'Soup pots steam under tusk-rafters; travelers thaw and swap toothy stories.',
      'If a wall smiles at you, it’s the decor. Probably.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Rock', 'Normal'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'giant_bazaar', chance: 0.18, description: 'Vertebrae market draws uncommon Ice/Rock artisans and guardians.' },
    { type: 'snow_mortar_quarry', chance: 0.12, description: 'Fresh quarry cut reveals a rare Normal/Ice pioneer species.' }
  ]
},
// Hearthfall Commons — Conoco Island
'bonfire-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hearthfall-commons',
  regionName: 'Hearthfall Commons',
  welcomeMessages: {
    base: 'Welcome to Bonfire Town—the eternal flame, the louder stories, and the best roasted anything.',
    variations: [
      'Festival drums sync with crackling embers; strangers become friends by the second verse.',
      'Pass a mug, share a tale—if the fire pops, it agrees with you.',
      'Lanterns bob like fireflies; the night market glows with ember-kissed treats.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Normal', 'Fire', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 5, max: 15 },
  agroRange: { min: 5, max: 35 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'ember_circle', chance: 0.20, description: 'Story circle heat boosts Fire/Fairy support effects.' },
    { type: 'wandering_minstrel', chance: 0.10, description: 'A traveling bard summons a rare Normal companion to the bonfire.' }
  ]
},

// Jötun Tundra — Conoco Island
'cairn-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Cairn Town—stone sentinels counting ice flows so you don’t have to.',
    variations: [
      'Rime-dusted runes tick like calendars made of winter.',
      'Guides balance new stones; the wind decides if the stack approves.',
      'If a cairn moves, it’s a prankster—offer a pebble, not a punch.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Rock', 'Ground'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 15, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'rune_alignment', chance: 0.18, description: 'Aligned cairns grant Rock/Ice boons and lure sturdy sentinels.' },
    { type: 'flow_shift', chance: 0.12, description: 'A sudden glacial grind calls a rare Ground hybrid to the ridge.' }
  ]
},

// Crowsfoot Marsh — Conoco Island
'cauldron-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'crowsfoot-marsh',
  regionName: 'Crowsfoot Marsh',
  welcomeMessages: {
    base: 'Welcome to Cauldron Village—where every doorstep bubbles and the air tastes faintly of mint and mystery.',
    variations: [
      'Herb bundles sway from rafters; kettles gossip in little steams.',
      'Potion smoke curls into sigils—if it winks, you got the good batch.',
      'Market stalls clink with glass—bring a vial, leave with a story.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Poison', 'Grass', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 9, max: 19 },
  agroRange: { min: 12, max: 42 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'brew_bloom', chance: 0.22, description: 'A lucky brew spikes Grass/Poison spawns with supportive buffs.' },
    { type: 'smoke_sign', chance: 0.12, description: 'A sigil in the steam beckons a rare Ghost apothecary familiar.' }
  ]
},

// Agni Peaks — Conoco Island
'celestial-shrine': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'agni-peaks',
  regionName: 'Agni Peaks',
  welcomeMessages: {
    base: 'Welcome to the Celestial Shrine—ridge-top lenses where solar fire kisses starfall glass.',
    variations: [
      'Prism dishes hum; vents backlight the altar in slow golden breaths.',
      'Meteor tiles focus dawn into spirals that climb like prayers.',
      'Acolytes weave Fire and Psychic hymns—mind the sparks, and the insights.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Psychic', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 25, max: 55 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Star Ember Relic' },
  specialEncounters: [
    { type: 'meteor_shower', chance: 0.20, description: 'Starfall boosts Fire/Psychic fusion stats.' },
    { type: 'solar_syzygy', chance: 0.10, description: 'Rare alignment spawns a radiant guardian.' }
  ]
},
// Demeter's Grove — Conoco Island
'ceres-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'demeters-grove',
  regionName: "Demeter's Grove",
  welcomeMessages: {
    base: 'Welcome to Ceres Town—golden fields, quiet wisdom, and bread so fresh it evangelizes.',
    variations: [
      'Irrigation runes tick softly as windmills bow to the grain.',
      'Market stalls trade seed lore—harvests here remember your name.',
      'Offer a loaf at the shrine; the goddess loves good crust.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Ground', 'Fairy', 'Normal'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 4, max: 14 },
  agroRange: { min: 5, max: 30 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'harvest_blessing', chance: 0.22, description: 'Sunlit rows boost Grass/Fairy support effects and spawn rates.' },
    { type: 'grain_spirit_parade', chance: 0.12, description: 'Procession of field sprites reveals a rare Ground/Grass guardian.' }
  ]
},

// Nimbus Capital — Sky Isles
'cloud-palace': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'nimbus-capital',
  regionName: 'Nimbus Capital',
  welcomeMessages: {
    base: 'Welcome to the Cloud Palace—solid sky underfoot, coronets cut from cirrus and dawn.',
    variations: [
      'Aether bridges hum; look down only if you like vertigo.',
      'Crystalized air balustrades ring with thunder’s afterthought.',
      'Courtiers ride thermals between balconies—mind the updrafts.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Flying', 'Electric', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Sky Charter Sigil' },
  specialEncounters: [
    { type: 'cirrus_coronation', chance: 0.18, description: 'Royal rites attract rare Flying/Fairy attendants with buff auras.' },
    { type: 'aether_step', chance: 0.10, description: 'Stair of wind forms—an Electric/Flying sovereign appears briefly.' }
  ]
},

// Poseidon’s Reach — Conoco Island
'coastal-settlement': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: 'Welcome to the Coastal Settlement—net terraces, coral-lashed piers, and tides that keep their own calendar.',
    variations: [
      'Shell chimes mark the swells; fishers swear by three bells and a gull.',
      'Salt-cured beams shine like pearls; lanterns guide the night trawls.',
      'If the dock creaks in rhythm, that’s the sea saying hello.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Rock', 'Electric', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 6, max: 16 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'spring_tide', chance: 0.22, description: 'High tide surges Water/Fairy spawns with supportive boons.' },
    { type: 'net_haul', chance: 0.12, description: 'A lucky cast pulls in a rare Rock/Electric hitchhiker from the reef.' }
  ]
},

// Thunderbird Heights — Conoco Island
'corvus-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to Corvus City—slate spires, storm rails, and lightning-fed aeries.',
    variations: [
      'Storm vanes sing; the streets spark with polite menace.',
      'Sky-bridges thrum as thunder rolls—locals call it “city purring.”',
      'If your hair stands up, that’s either the weather or the welcome committee.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Dark', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Lightning Ward Token' },
  specialEncounters: [
    { type: 'storm_spire_surge', chance: 0.20, description: 'Conductor towers channel a burst—Electric/Flying elites descend.' },
    { type: 'aerie_patrol', chance: 0.12, description: 'Rooftop patrol invites a duel with a rare Dark/Steel sentinel.' }
  ]
},
// Jötun Tundra — Conoco Island
'cyclops-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Cyclops Village—menhir rings, forge smoke, and one-eyed smith clans who see flaws before they exist.',
    variations: [
      'Hammer hymns echo off ice—each anvil keeps its own weather.',
      'Runed menhirs glow faintly; apprentices swear it’s the stones watching back.',
      'Trade a story for a nail and leave with a legend riveted to it.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Steel', 'Rock', 'Fire', 'Ice'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Forge Mark' },
  specialEncounters: [
    { type: 'anvil_chorus', chance: 0.18, description: 'Synchronized hammering empowers Steel/Rock spawns with defense boons.' },
    { type: 'menhir_eye', chance: 0.10, description: 'A watching stone opens—rare Fire/Steel sentinel issues a trial.' }
  ]
},

// Mictlan Hollows — Conoco Island
'death-pyramid': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'mictlan-hollows',
  regionName: 'Mictlan Hollows',
  welcomeMessages: {
    base: 'Welcome to the Death Pyramid—sepulchral prisms, soul-sand currents, and echoes that remember footsteps.',
    variations: [
      'Obsidian stairs drink the light; whisper and the walls whisper back.',
      'Sarcophagus choirs hum in low harmony—do not hum along.',
      'Lantern shades drift like thoughts that forgot their bodies.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ghost', 'Dark', 'Ground'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 28, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Obsidian Cartouche' },
  specialEncounters: [
    { type: 'soul_sand_shift', chance: 0.20, description: 'Shifting currents unveil Ghost/Ground elites with burial boons.' },
    { type: 'echoed_name', chance: 0.10, description: 'Your name returns from below—summons a rare Dark guardian for a rite.' }
  ]
},

// Oracle's Sanctum — Conoco Island
'delphi-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'oracles-sanctum',
  regionName: "Oracle's Sanctum",
  welcomeMessages: {
    base: 'Welcome to Delphi City—marble terraces, divination canals, and futures that prefer gentle spoilers.',
    variations: [
      'Incense spirals map possibilities; choose a path, it chooses back.',
      'Water clocks tick in riddles; the answer is “bring a towel.”',
      'Seers trade visions for quiet—coins accepted, silence preferred.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Psychic', 'Water', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 9, max: 18 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'canal_omen', chance: 0.20, description: 'Divination ripples boost Psychic/Water spawns with foresight buffs.' },
    { type: 'tripod_utterance', chance: 0.10, description: 'An oracle trance calls a rare Fairy/Psychic herald to the plaza.' }
  ]
},

// Kshatriya Arena — Conoco Island
'dharma-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'kshatriya-arena',
  regionName: 'Kshatriya Arena',
  welcomeMessages: {
    base: 'Welcome to Dharma Village—ethics before elbows, vows before victories.',
    variations: [
      'Training yards ring with respectful challenges—honor is the loudest sound.',
      'Scroll keepers stamp oaths; your word is your armor.',
      'Tea, meditation, spar—repeat until calm and competent.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Psychic', 'Normal'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'oath_trial', chance: 0.22, description: 'Sworn vows grant buffs to Fighting/Psychic allies during honorable duels.' },
    { type: 'teacher_inspection', chance: 0.12, description: 'A master observes—rare Normal/Psychic mentor issues a measured test.' }
  ]
},
// Primordial Jungle — Conoocoo Archipelago
'dinosaur-valley': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'primordial-jungle',
  regionName: 'Primordial Jungle',
  welcomeMessages: {
    base: 'Welcome to Dinosaur Valley—where the past never left and the ground still thunders.',
    variations: [
      'Fern canopies hiss as tails sweep—walk softly, or become a teachable moment.',
      'River mud keeps perfect footprints; some are… bigger than your tent.',
      'Nesting calls roll like drums—respect the roped-off roars.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Rock', 'Dragon', 'Ground', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Paleo Permit' },
  specialEncounters: [
    { type: 'primeval_roar', chance: 0.20, description: 'Valley-wide call boosts Dragon/Ground spawns and intimidates foes.' },
    { type: 'nest_guard', chance: 0.12, description: 'Territorial parent appears—rare Rock/Dragon protector challenges intruders.' }
  ]
},

// Hephaestus' Forge — Conoco Island
'divine-workshop': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hephaestus-forge',
  regionName: "Hephaestus' Forge",
  welcomeMessages: {
    base: 'Welcome to the Divine Workshop—living anvils, volcanic bellows, and sparks that know your name.',
    variations: [
      'Celestial alloy vents flare—stand clear unless you’re heat-resistant or reckless.',
      'Hammer rhythms sync with magma pulses; inventions hum themselves awake.',
      'The walls have gears—and opinions.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Steel', 'Fire', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Forgebrand Sigil' },
  specialEncounters: [
    { type: 'celestial_alloy_vent', chance: 0.18, description: 'A flare empowers Steel/Fire spawns with forging boons.' },
    { type: 'living_anvil_trial', chance: 0.10, description: 'A sentient anvil awakens—a rare Rock/Steel guardian issues a test.' }
  ]
},

// Draconic Abyss — Conoco Island
'dragon-graveyard': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'draconic-abyss',
  regionName: 'Draconic Abyss',
  welcomeMessages: {
    base: 'Welcome to the Dragon Graveyard—sand-swept spines, long shadows, and heavier silence.',
    variations: [
      'Wind harps through ribs; every note sounds like a story ending.',
      'Bone dunes shift—some bones are not done being bones.',
      'Offer salt and step lightly; the old ones still count their hoards.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Ghost', 'Rock', 'Ground', 'Dark'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Bone Talisman' },
  specialEncounters: [
    { type: 'wyrm_echo', chance: 0.20, description: 'Resonant dunes summon rare Dragon/Ghost echoes with spectral auras.' },
    { type: 'ossuary_whisper', chance: 0.12, description: 'A spine ridge murmurs—Dark/Ground sentinel emerges for a rite.' }
  ]
},

// Volcanic Peaks — Conoocoo Archipelago
'drakescale-ridge': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'volcanic-peaks',
  regionName: 'Volcanic Peaks',
  welcomeMessages: {
    base: 'Welcome to Drakescale Ridge—obsidian ladders and sun-basking embers with opinions.',
    variations: [
      'Heat mirages shimmer; drakes sprawl like living cairns.',
      'Scree shifts—talons carve footholds where maps said “don’t.”',
      'If the rock blinks, congratulate it. Then back away slowly.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Dragon', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Drakescale Writ' },
  specialEncounters: [
    { type: 'sunplate_bask', chance: 0.22, description: 'High heat boosts Fire/Dragon spawns; elites claim ridge ledges.' },
    { type: 'clutch_guard', chance: 0.12, description: 'Nest alarm draws a rare Rock/Dragon defender to the trail.' }
  ]
},

// Stoneheart Cliffs — Conoco Island
'druid-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'stoneheart-cliffs',
  regionName: 'Stoneheart Cliffs',
  welcomeMessages: {
    base: 'Welcome to Druid Village—root bridges, moss pillars, and conversations with trees that answer back.',
    variations: [
      'Runes glow under lichens—yes, that hum is friendly.',
      'Circle groves echo with flute wind; offerings sprout overnight.',
      'If a stone moves, it’s migrating—give it space and compliments.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Fairy', 'Rock', 'Ground'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 6, max: 16 },
  agroRange: { min: 8, max: 35 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'grove_concord', chance: 0.20, description: 'Aligned circles boost Grass/Fairy support effects and spawn rates.' },
    { type: 'root_bridge_warden', chance: 0.12, description: 'A moss-clad guardian—rare Rock/Ground keeper—tests your passage.' }
  ]
},

// Tempest Zones — Sky Isles
'electric-vortex': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'tempest-zones',
  regionName: 'Tempest Zones',
  welcomeMessages: {
    base: 'Welcome to the Electric Vortex—storm rings hang in the air like crowns that bite.',
    variations: [
      'Ion lines sing; your teeth may hum in sympathy.',
      'Lightning ladders braid the sky—count to one, then duck.',
      'The eye blinks open sometimes; it’s polite to wave.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Stormline Conductor' },
  specialEncounters: [
    { type: 'storm_ring_alignment', chance: 0.22, description: 'Concentric rings amplify Electric/Flying elites with surge boons.' },
    { type: 'eye_of_calm', chance: 0.10, description: 'The vortex eye opens—brief calm reveals a rare Steel/Flying sentinel.' }
  ]
},
// Demeter's Grove — Conoco Island
'eleusis-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'demeters-grove',
  regionName: "Demeter's Grove",
  welcomeMessages: {
    base: 'Welcome to Eleusis City—where fields whisper mysteries and granaries keep more than grain.',
    variations: [
      'Incense and wheat wreaths crown the avenues; initiates walk in measured silence.',
      'Divination looms spin threads of planting, harvest, and the hidden season beneath.',
      'Offer barley at the shrine—answers arrive in cycles, not seconds.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Fairy', 'Ground', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Eleusinian Token' },
  specialEncounters: [
    { type: 'mystery_initiation', chance: 0.20, description: 'Rite of seed and shadow boosts Grass/Fairy support effects.' },
    { type: 'persephone_cycle', chance: 0.10, description: 'Seasonal shift reveals a rare Ground/Psychic guardian of the threshing floor.' }
  ]
},

// Volcanic Peaks — Conoocoo Archipelago
'emberforge-settlement': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'volcanic-peaks',
  regionName: 'Volcanic Peaks',
  welcomeMessages: {
    base: 'Welcome to Emberforge—lava-tempered forges, drake stables, and vents that glow like watchful eyes.',
    variations: [
      'Cliffside bellows thunder; sparks write brief constellations over the anvils.',
      'Drake tack hangs warm to the touch—someone just trained, or the gear refuses to cool.',
      'Mind the slag chutes unless you enjoy surprise footwear.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Dragon', 'Rock', 'Ground'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 10, max: 19 },
  agroRange: { min: 18, max: 48 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'vent_flare', chance: 0.20, description: 'A sudden flare empowers Fire/Rock spawns along the ridge.' },
    { type: 'drake_mustering', chance: 0.12, description: 'Stable horns call a rare Dragon/Ground sentinel to patrol the cliffs.' }
  ]
},

// Seelie Courts — Conoco Island
'enchanted-glade': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'seelie-courts',
  regionName: 'Seelie Courts',
  welcomeMessages: {
    base: 'Welcome to the Enchanted Glade—bioluminescent hush and harmonics you feel behind your eyes.',
    variations: [
      'Fae rings bloom underfoot; step politely or step elsewhere.',
      'Motes answer to music; humming may constitute a contract.',
      'Mushroom lanterns wink—some of them are jokes, some are doors.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fairy', 'Grass', 'Psychic', 'Bug'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 7, max: 17 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'fae_ring', chance: 0.22, description: 'Ring alignment boosts Fairy/Grass spawns with supportive boons.' },
    { type: 'willow_wisp_concord', chance: 0.12, description: 'Wisp chorus beckons a rare Psychic/Fairy herald to the clearing.' }
  ]
},

// Raven's Shadow — Conoco Island
'eternal-dusk': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'ravens-shadow',
  regionName: "Raven's Shadow",
  welcomeMessages: {
    base: 'Welcome to Eternal Dusk—feather-fog murmurs and horizons that never decide.',
    variations: [
      'Hats and shadows both grow longer here—keep track of which is which.',
      'Raven sigils blink from hedgerows; bargains are implied, never stated.',
      'Lanterns glow like patient eyes; the path prefers good listeners.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Ghost', 'Flying'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 28, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Raven Feather Sigil' },
  specialEncounters: [
    { type: 'murmur_fog', chance: 0.20, description: 'Whispering mist calls rare Dark/Ghost wanderers with stealth boons.' },
    { type: 'trickster_passage', chance: 0.10, description: 'A feathered gate opens—Flying/Dark sentinel offers a conditional duel.' }
  ]
},

// Jötun Tundra — Conoco Island
'eternal-glacier': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: "Welcome to the Eternal Glacier—ancient ice that remembers, and a horizon that doesn't blink.",
    variations: [
      'Cracks sing old songs; step to the rhythm or not at all.',
      'Frost halos drift above crevasses—giant bridges appear when they are needed, not wanted.',
      'Breath crystals hang in the air like tiny omens.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Water', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Glacier Oath Charm' },
  specialEncounters: [
    { type: 'memory_ice', chance: 0.22, description: 'Echoing ice reveals rare Ice/Fairy elites with recall auras.' },
    { type: 'giant_bridge', chance: 0.10, description: 'A spectral span forms—Water/Ice guardian tests your passage.' }
  ]
},
// Quetzal Winds — Conoco Island
'feather-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'quetzal-winds',
  regionName: 'Quetzal Winds',
  welcomeMessages: {
    base: 'Welcome to Feather Town—rainbow plumes, ceremonial stitches, and art that flutters when you blink.',
    variations: [
      'Looms hum in birdsong meter; tailfeathers become tapestry and myth.',
      'Dyers coax sunrise from pigments; even the wind leaves with souvenirs.',
      'Quetzal masks watch from lintels—smile back, it’s polite.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Flying', 'Grass', 'Fairy'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 4, max: 14 },
  agroRange: { min: 5, max: 30 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'plume_pageant', chance: 0.22, description: 'Festival finery boosts Flying/Fairy support effects and spawn rates.' },
    { type: 'quetzal_blessing', chance: 0.12, description: 'A sacred dance calls a rare Grass/Flying herald to the plaza.' }
  ]
},

// Draconic Abyss — Sky Isles
'flame-chasm': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'draconic-abyss',
  regionName: 'Draconic Abyss',
  welcomeMessages: {
    base: 'Welcome to the Flame Chasm—molten cataracts roar where the abyss remembers its fire.',
    variations: [
      'Heat haze climbs like serpents; the ledges judge your boots.',
      'Basalt teeth drip light—every step is a handshake with magma.',
      'Drake shadows circle; if the stone growls, that was the stone.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Dragon', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Fireproof Charter' },
  specialEncounters: [
    { type: 'magma_fall_surge', chance: 0.22, description: 'Cataracts flare—Fire/Dragon elites seize the rim with power buffs.' },
    { type: 'lineage_trial', chance: 0.10, description: 'A drake elder issues a rite—rare Rock/Dragon guardian appears.' }
  ]
},

// Quetzal Winds — Conoco Island
'floating-gardens': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'quetzal-winds',
  regionName: 'Quetzal Winds',
  welcomeMessages: {
    base: 'Welcome to the Floating Gardens—aerial orchards drifting on whispered windcraft.',
    variations: [
      'Lattice roots sip clouds; gardeners prune with kites.',
      'Fruit bells chime as terraces glide past the sun.',
      'Mind the step—gravity is more of a suggestion here.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Flying', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'aerial_bloom', chance: 0.22, description: 'Windborne pollen spikes Grass/Fairy spawns with restorative boons.' },
    { type: 'wind_harvest', chance: 0.12, description: 'A perfect updraft brings a rare Flying/Grass keeper to the beds.' }
  ]
},

// Mist Marshlands — Conoocoo Archipelago
'fog-temple': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'mist-marshlands',
  regionName: 'Mist Marshlands',
  welcomeMessages: {
    base: 'Welcome to the Fog Temple—luminous haze, spirit bells, and steps that appear when believed in.',
    variations: [
      'Marshlight gathers into runes; the air tastes like old prayers.',
      'Bells toll under the water—responses arrive as ripples.',
      'If a doorway sighs, wait. It is choosing a story to tell you.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Ghost', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Mist Talisman' },
  specialEncounters: [
    { type: 'spirit_bells', chance: 0.22, description: 'Chimes align—Ghost/Water elites emerge with veil boons.' },
    { type: 'haze_apparition', chance: 0.10, description: 'A figure forms from fog—rare Grass/Ghost guide offers a rite.' }
  ]
},

// Hephaestus Forge — Conoco Island
'forge-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hephaestus-forge',
  regionName: 'Hephaestus Forge',
  welcomeMessages: {
    base: 'Welcome to Forge Town—ore caravans rattle, smelters sing, and sparks vote loudly.',
    variations: [
      'Chain cranes swing ingots like metronomes of progress.',
      'Smelter stacks write warm constellations against dusk.',
      'If the anvil rings twice, it’s either praise or a scheduling conflict.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Steel', 'Fire', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 10, max: 19 },
  agroRange: { min: 20, max: 50 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'smelter_surge', chance: 0.20, description: 'Refining peak empowers Steel/Fire species with endurance boons.' },
    { type: 'ore_caravan_cache', chance: 0.12, description: 'A rich load spills—rare Rock/Steel scavengers converge.' }
  ]
},

// Jötun Tundra — Conoco Island
'frost-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Frost Village—giant-country modesty, hearth grit, and neighbors who shovel your roof.',
    variations: [
      'Windbreak palisades sing; braided ropes guide you home in whiteouts.',
      'Sled bells mark the paths; soup kettles mark the end of them.',
      'The aurora checks in nightly—dress for guests.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Normal', 'Fighting'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 10, max: 20 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'whiteout_watch', chance: 0.20, description: 'Approaching squall empowers Ice defenders with resilience boons.' },
    { type: 'hearth_oath', chance: 0.12, description: 'Village oath-rite summons a rare Normal/Fighting guardian to spar.' }
  ]
},
// Terra Madre Basin — Conoco Island
'gaia-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'terra-madre-basin',
  regionName: 'Terra Madre Basin',
  welcomeMessages: {
    base: 'Welcome to Gaia Town—where streets have root systems and the compost has opinions.',
    variations: [
      'Stone paths breathe with moss; the bylaws are printed on leaves.',
      'Windmills spin slow wisdom—power, yes, but also poetry.',
      'Offer a seed, gain a friend; offer two, gain a forest.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Ground', 'Rock', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'earth_concord', chance: 0.20, description: 'Leyline harmony boosts Grass/Ground support and spawn rates.' },
    { type: 'stone_bloom', chance: 0.12, description: 'A rock garden blossoms—rare Rock/Fairy steward appears.' }
  ]
},

// Hearthfall Commons — Conoco Island
'golden-hall': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hearthfall-commons',
  regionName: 'Hearthfall Commons',
  welcomeMessages: {
    base: 'Welcome to the Golden Hall—tapestries of bragging rights and mead with muscle memory.',
    variations: [
      'Long tables, louder laughter—stories polished shinier than the walls.',
      'Champion plaques wink as you pass—either luck or lighting.',
      'If the horn sounds, it’s a toast; if it sounds twice, it’s your turn.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Normal', 'Fighting', 'Fire', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 12, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'heroic_toast', chance: 0.20, description: 'A round of honors boosts Normal/Fighting allies with morale boons.' },
    { type: 'tapestry_trial', chance: 0.10, description: 'A deed woven in gold challenges you—rare Fire/Fairy patron appears.' }
  ]
},

// Demeter's Grove — Conoco Island
'golden-wheat': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'demeters-grove',
  regionName: "Demeter's Grove",
  welcomeMessages: {
    base: 'Welcome to the Golden Wheat—fields that gleam like sunrise and feed like folklore.',
    variations: [
      'Wind combs the grain; the rows answer in rustled hymns.',
      'Threshing drums set an easy march—bring a basket, leave with blessings.',
      'Scarecrows bow as you pass—good manners or excellent rigging.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Normal', 'Fairy', 'Ground'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 4, max: 14 },
  agroRange: { min: 5, max: 30 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'harvest_glow', chance: 0.22, description: 'Blessed rows boost Grass/Fairy support effects and rare spawns.' },
    { type: 'field_guard', chance: 0.12, description: 'A living scarecrow—Ground/Normal—offers a gentle duel.' }
  ]
},

// Kshatriya Arena — Conoco Island
'grand-colosseum': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'kshatriya-arena',
  regionName: 'Kshatriya Arena',
  welcomeMessages: {
    base: 'Welcome to the Grand Colosseum—honor louder than crowds and sand that remembers every step.',
    variations: [
      'Trumpets blaze; banners judge your posture.',
      'Oathstones line the tunnel—touch one, fight fair.',
      'Win or learn—both get applause.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Steel', 'Fire', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Honor Seal' },
  specialEncounters: [
    { type: 'honor_trial', chance: 0.22, description: 'Sanctioned duel spawns elite Fighting/Steel challengers.' },
    { type: 'arena_inferno', chance: 0.10, description: 'Ceremonial flames awaken a rare Fire/Rock champion.' }
  ]
},

// Thunderbird Heights — Conoco Island
'great-nest': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to the Great Nest—lightning-forged boughs and thermals that whistle like hymns.',
    variations: [
      'Charred timbers gleam with meteoric veins; feathers hum with static.',
      'Storm sap congeals into amber sparks—don’t pocket it unless you like surprises.',
      'Shadow passes. Count to one. Thunder answers.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Stormproof Visitor Band' },
  specialEncounters: [
    { type: 'thunder_brood', chance: 0.22, description: 'Brood call summons Electric/Flying elites to defend the nest.' },
    { type: 'metal_feather_fall', chance: 0.10, description: 'A meteoric pinion drops—rare Steel/Flying sentinel arrives.' }
  ]
},

// Anansi Woods — Conoco Island
'great-tree': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'anansi-woods',
  regionName: 'Anansi Woods',
  welcomeMessages: {
    base: 'Welcome to the Great Tree—silk runes weave living legends while the bark edits your grammar.',
    variations: [
      'Story threads climb the trunk; listen long enough and you become footnotes.',
      'Spider scribes draft constellations between branches.',
      'If a door appears, knock with a proverb.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Bug', 'Fairy', 'Grass', 'Dark'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'silk_saga', chance: 0.20, description: 'A woven tale manifests—rare Bug/Fairy lorekeeper descends.' },
    { type: 'baobab_whisper', chance: 0.12, description: 'Root-echo calls a Dark/Grass guardian for a riddle trial.' }
  ]
},

// Hearthfall Commons — Conoco Island
'hearthstone-temple': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hearthfall-commons',
  regionName: 'Hearthfall Commons',
  welcomeMessages: {
    base: 'Welcome to the Hearthstone Temple—a fire that never sleeps and blessings that travel well.',
    variations: [
      'Warmth rolls from the altar like a friendly tide.',
      'Carved runes glow ember-gold; the air smells like home.',
      'Share a spark; carry a story back with you.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Normal', 'Fire', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 45 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Hearth Sigil' },
  specialEncounters: [
    { type: 'ember_blessing', chance: 0.22, description: 'Lit hearth grants Fire/Fairy boons and pacifies foes briefly.' },
    { type: 'guardian_kindling', chance: 0.12, description: 'A temple warden—rare Normal/Fire—offers a protective pact trial.' }
  ]
},
// Pirates' Bay — Conoco Island
'hidden-cove': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'pirates-bay',
  regionName: "Pirates' Bay",
  welcomeMessages: {
    base: 'Welcome to the Hidden Cove—cutlass smiles, fog-thick alleys, and maps that lie politely.',
    variations: [
      'Reef teeth guard the inlet; only locals and lunatics thread the pass.',
      'Signal lamps wink in codes; if you wink back, you just hired yourself.',
      'Barnacle taverns serve rumors neat—no chaser, mind the splinters.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Water', 'Steel', 'Fighting'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 45, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Black Flag Token' },
  specialEncounters: [
    { type: 'smugglers_tide', chance: 0.22, description: 'Contraband run draws rare Dark/Water raiders to the docks.' },
    { type: 'reef_ambush', chance: 0.12, description: 'Hidden passage opens—Steel/Fighting sentry challenges interlopers.' }
  ]
},

// Kshatriya Arena — Conoco Island
'honor-temple': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'kshatriya-arena',
  regionName: 'Kshatriya Arena',
  welcomeMessages: {
    base: 'Welcome to the Honor Temple—oaths first, footwork second.',
    variations: [
      'Censer smoke traces perfect circles—break one and start over.',
      'Shrine bells judge cadence; your stance will hear about it.',
      'Purification pools reflect the fighter you promised to be.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Psychic', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Oath Talisman' },
  specialEncounters: [
    { type: 'vow_trial', chance: 0.20, description: 'Recited vows empower Fighting/Psychic allies during duels.' },
    { type: 'steel_rite', chance: 0.10, description: 'A rite at the anvil summons a rare Steel mentor for a spar.' }
  ]
},

// Long Valley — Conoco Island
'imperial-palace': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'long-valley',
  regionName: 'Long Valley',
  welcomeMessages: {
    base: 'Welcome to the Imperial Palace—golden terraces where elder drakes edit policy and weather.',
    variations: [
      'Gong echoes roll down jade stairs; audiences run on dragon time.',
      'Edict banners crackle with static—respect the punctuation.',
      'Courtiers measure you like tailors; the fit had better be brave.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Steel', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Imperial Edict Seal' },
  specialEncounters: [
    { type: 'court_audience', chance: 0.20, description: 'Summons a rare Dragon/Steel sentinel for formal challenge.' },
    { type: 'jade_decree', chance: 0.10, description: 'A ceremonial decree buffs Fairy/Dragon allies on palace grounds.' }
  ]
},

// Crowsfoot Marsh — Conoco Island
'iron-teeth-hut': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'crowsfoot-marsh',
  regionName: 'Crowsfoot Marsh',
  welcomeMessages: {
    base: 'Welcome to Iron Teeth’s Hut—bone fences, laughing wards, and traps that compliment your boots.',
    variations: [
      'The path moves when it’s in the mood—bring bribery (cookies).',
      'Jar lights stare back; some are fireflies, some are… not.',
      'If the door knocks first, you’re late.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Ghost', 'Poison'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 45, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Bone Charm' },
  specialEncounters: [
    { type: 'hex_kiln', chance: 0.22, description: 'Cackling kiln empowers Dark/Poison elites with curse boons.' },
    { type: 'witchs_bargain', chance: 0.10, description: 'A spectral host offers a rite—rare Ghost/Dark familiar appears.' }
  ]
},

// Long Valley — Conoco Island
'jade-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'long-valley',
  regionName: 'Long Valley',
  welcomeMessages: {
    base: 'Welcome to Jade Village—chisels sing, charms glow, and tea solves most metallurgy.',
    variations: [
      'Kilns breathe cool; the jade prefers patience over polish.',
      'Workbenches bloom with talismans—touch lightly, luck bites.',
      'Master carvers judge angles by moonlight and rumor.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Rock', 'Grass', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'jade_resonance', chance: 0.20, description: 'Carving harmonics boost Rock/Fairy support and rare spawns.' },
    { type: 'mine_vein_bloom', chance: 0.12, description: 'A fresh vein reveals a rare Grass/Rock keeper under lantern light.' }
  ]
},

// Jötun Tundra — Conoco Island
'jotun-halls': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to the Jötun Halls—council fires the size of houses and doors that grade your courage.',
    variations: [
      'Ice columns boom like old drums—speak up or be snowed under.',
      'Feast benches groan; oaths weigh more than axes here.',
      'Auroras convene above the roofbeam—minutes are kept in thunder.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Fighting', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Giant Parley Token' },
  specialEncounters: [
    { type: 'council_summons', chance: 0.22, description: 'War horns call elite Ice/Fighting challengers to the circle.' },
    { type: 'oath_carving', chance: 0.10, description: 'Runes blaze—rare Steel/Ice warden offers a pact duel.' }
  ]
},

// Anansi Woods — Conoco Island
'kumasi-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'anansi-woods',
  regionName: 'Anansi Woods',
  welcomeMessages: {
    base: 'Welcome to Kumasi City—suspended webs, market stories, and bridges that remember your last bargain.',
    variations: [
      'Silk boulevards sway; vendors weave contracts in patterned thread.',
      'Storytellers auction beginnings—endings cost extra.',
      'If a strand hums, it’s gossip. If it sings, it’s law.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Bug', 'Dark', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 9, max: 18 },
  agroRange: { min: 15, max: 50 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'pattern_market', chance: 0.22, description: 'Trade fair spikes Bug/Fairy spawns with boon-woven buffs.' },
    { type: 'webway_express', chance: 0.12, description: 'A fast strand opens—rare Dark/Bug courier challenges your route.' }
  ]
},
// Kshatriya Arena — Conoco Island
'kurukshetra-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'kshatriya-arena',
  regionName: 'Kshatriya Arena',
  welcomeMessages: {
    base: 'Welcome to Kurukshetra City—oathstones underfoot and history watching from every banner.',
    variations: [
      'Training sands whisper verses of duty; your stance is its own scripture.',
      'Trial bells mark the hours—courage keeps better time than clocks.',
      'Acolytes swap sparring for philosophy; expect bruises with footnotes.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Psychic', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Battlefield Writ' },
  specialEncounters: [
    { type: 'dharma_duel', chance: 0.22, description: 'Sanctioned duel empowers Fighting/Psychic allies with vow boons.' },
    { type: 'chariot_trial', chance: 0.10, description: 'A steel-clad mentor arrives—rare Steel/Fighting challenge issued.' }
  ]
},

// Tempest Zones — Sky Isles
'lightning-city': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'tempest-zones',
  regionName: 'Tempest Zones',
  welcomeMessages: {
    base: 'Welcome to Lightning City—streets wired to the sky and rooftops that purr with thunder.',
    variations: [
      'Conductor spires sip storms; crosswalks flash in forked brilliance.',
      'Capacitors hum lullabies—bring rubber soles and bold ideas.',
      'Transit runs on lightning; delays are measured in micro-scorches.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Stormgrid Pass' },
  specialEncounters: [
    { type: 'grid_overcharge', chance: 0.22, description: 'Citywide surge spawns Electric/Steel elites with speed buffs.' },
    { type: 'aerial_patrol', chance: 0.10, description: 'A storm warden—rare Electric/Flying—sweeps in for a test.' }
  ]
},

// Thunderbird Heights — Conoco Island
'lightning-spire': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to the Lightning Spire—stone that drinks thunder and smiles about it.',
    variations: [
      'Storm ladders climb the air; your hair volunteers for leadership.',
      'Metal veins in the rock glow like captive dawns.',
      'If the sky points at you, bow or run—dealer’s choice.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Rock', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Grounding Talisman' },
  specialEncounters: [
    { type: 'spire_strike', chance: 0.22, description: 'Direct hits call elite Electric/Flying defenders to the pinnacle.' },
    { type: 'resonant_quartz', chance: 0.10, description: 'Charged seams awaken a rare Rock/Steel sentinel.' }
  ]
},

// Poseidon’s Reach — Conoco Island
'maelstrom-point': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: 'Welcome to Maelstrom Point—whirlpool classrooms for very confident sailors.',
    variations: [
      'Gulls ride the rim like critics; waves grade on a spiral.',
      'Signal buoys blink warnings in ancient maritime sarcasm.',
      'If your map curls, it’s agreeing with the current.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Electric', 'Dark'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Navigator’s Seal' },
  specialEncounters: [
    { type: 'whirlpool_ascend', chance: 0.22, description: 'Rising eye attracts rare Water/Electric predators with surge boons.' },
    { type: 'black_current', chance: 0.10, description: 'A shadow eddy delivers a Dark/Water raider to the cape.' }
  ]
},

// Stoneheart Cliffs — Conoco Island
'memory-cliffs': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'stoneheart-cliffs',
  regionName: 'Stoneheart Cliffs',
  welcomeMessages: {
    base: 'Welcome to the Memory Cliffs—strata that glow with yesterday’s handwriting.',
    variations: [
      'Runes flicker under quartz panes; history edits itself politely.',
      'Echo chambers repeat only what you meant to say.',
      'Touchstone ledges trade visions for vertigo—hold the rail.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Rock', 'Psychic', 'Ground', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Memory Keystone' },
  specialEncounters: [
    { type: 'strata_recall', chance: 0.20, description: 'A glowing layer manifests rare Rock/Psychic custodians.' },
    { type: 'echoes_unsealed', chance: 0.10, description: 'A sealed niche opens—Ghost/Ground historian emerges.' }
  ]
},

// Mictlan Hollows — Conoco Island
'mictlampa-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'mictlan-hollows',
  regionName: 'Mictlan Hollows',
  welcomeMessages: {
    base: 'Welcome to Mictlampa City—lantern canals, bone arches, and markets that sell memories by the ounce.',
    variations: [
      'Spirit vendors haggle in whispers; prices include safe passage.',
      'Obsidian mosaics reflect who you were five minutes ago.',
      'Bridge keepers stamp your shadow—do not lose it.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ghost', 'Dark', 'Water'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Lantern Scrip' },
  specialEncounters: [
    { type: 'canal_procession', chance: 0.22, description: 'Lantern parade boosts Ghost/Water spawns with veil boons.' },
    { type: 'ossuary_market', chance: 0.10, description: 'Rare Dark/Water broker offers a risky barter-for-battle.' }
  ]
},

// Mist Marshlands — Conoco Island
'mist-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'mist-marshlands',
  regionName: 'Mist Marshlands',
  welcomeMessages: {
    base: 'Welcome to Mist Village—boardwalk whispers and houses that remember how to hide.',
    variations: [
      'Fog bands roll like shy curtains; the village bows in and out.',
      'Wind chimes speak in directions—left at the third echo.',
      'If the path splits, follow the lantern with worse manners.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Ghost', 'Grass'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 6, max: 16 },
  agroRange: { min: 8, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'low_tide_window', chance: 0.22, description: 'Revealed causeways increase Water/Grass support spawns.' },
    { type: 'veil_visitant', chance: 0.10, description: 'A courteous apparition—rare Ghost/Water—requests a gentle duel.' }
  ]
},
// Seelie Courts — Conoco Island
'oberon-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'seelie-courts',
  regionName: 'Seelie Courts',
  welcomeMessages: {
    base: 'Welcome to Oberon Village—regal fae ceremony where seasons stand at attention.',
    variations: [
      'Antlered courtiers pace ring-stones; etiquette is a contact sport.',
      'Silken pennants ripple with ritual wind; the script is older than thunder.',
      'Mind your bow and your bargains—both are binding under moonlight.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fairy', 'Grass', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Court Invitation' },
  specialEncounters: [
    { type: 'season_council', chance: 0.20, description: 'Quarter rites boost Fairy/Psychic spawns with ward auras.' },
    { type: 'ring_oath', chance: 0.10, description: 'A crown-guard appears—rare Grass/Fairy herald issues a pact duel.' }
  ]
},

// Volcanic Peaks — Conoocoo Archipelago
'obsidian-halls': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'volcanic-peaks',
  regionName: 'Volcanic Peaks',
  welcomeMessages: {
    base: 'Welcome to the Obsidian Halls—glass corridors whispering heat and history.',
    variations: [
      'Embers stitch constellations along the ceiling—guides read by glow.',
      'Forge Spirits breathe from cracks; the air tastes like iron prayers.',
      'Footfalls ring like bells—answer when the caverns ask your name.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Rock', 'Ground'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Flameward Sigil' },
  specialEncounters: [
    { type: 'glass_echo', chance: 0.22, description: 'Resonant vaults summon elite Fire/Rock custodians.' },
    { type: 'forge_spirit_parley', chance: 0.10, description: 'A molten warden—rare Ground/Fire—offers a tempered trial.' }
  ]
},

// Demeter's Grove — Conoco Island
'persephone-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'demeters-grove',
  regionName: "Demeter's Grove",
  welcomeMessages: {
    base: 'Welcome to Persephone Village—bloom and hush in perfect turn.',
    variations: [
      'Spring garlands sing; winter lanterns remember.',
      'Pomegranate dyes stain the air with sweet omens.',
      'Half the doors open to gardens, half to echoes—choose kindly.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Fairy', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'spring_return', chance: 0.22, description: 'Seasonal surge boosts Grass/Fairy support and spawn rates.' },
    { type: 'underworld_breath', chance: 0.12, description: 'A winter veil reveals a rare Ghost/Grass guide.' }
  ]
},

// Pirates' Bay — Conoco Island
'pirate-port': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'pirates-bay',
  regionName: "Pirates' Bay",
  welcomeMessages: {
    base: 'Welcome to the Pirate Port—lawless docks, loud coffers, and legends with bar tabs.',
    variations: [
      'Chain cranes swing treasure nets; gulls file claims promptly.',
      'Shanties chart the tides; the chorus knows your name already.',
      'If the harbormaster smiles, check your pockets and your ship.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Dark', 'Steel', 'Fighting'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 35, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Harbor Pass' },
  specialEncounters: [
    { type: 'contraband_auction', chance: 0.22, description: 'Back-alley bidding draws rare Dark/Steel enforcers.' },
    { type: 'storm_dock_raid', chance: 0.10, description: 'A squall cover brings Water/Fighting raiders to challenge crews.' }
  ]
},

// Pirates' Bay — Conoco Island
'pirate-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'pirates-bay',
  regionName: "Pirates' Bay",
  welcomeMessages: {
    base: 'Welcome to the Pirate Village—shanty lanes, buried rumors, and hammocks that whisper.',
    variations: [
      'Kids trade treasure maps; most lead to good stories.',
      'Signal flags talk across rooftops—some gossip, some warnings.',
      'If the sand grins, that’s a trap. Bring snacks anyway.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Dark', 'Normal'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 15, max: 50 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'buried_cache', chance: 0.20, description: 'A fresh map turns up—rare Dark/Water scavenger appears.' },
    { type: 'dockside_duel', chance: 0.12, description: 'Local hotshot offers a bout—Normal/Dark companion joins the fray.' }
  ]
},

// Crowsfoot Marsh — Conoco Island
'poison-pools': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'crowsfoot-marsh',
  regionName: 'Crowsfoot Marsh',
  welcomeMessages: {
    base: 'Welcome to the Poison Pools—toxic mirrors and riches that bite back.',
    variations: [
      'Iridescent films swirl; beauty here files its teeth.',
      'Bone markers warn the bold; reeds whisper antidotes and dares.',
      'Step only where the lantern moths hover—they vote on safe spots.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Poison', 'Water', 'Bug', 'Dark'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Antitoxin Permit' },
  specialEncounters: [
    { type: 'toxin_bloom', chance: 0.22, description: 'Chemical surge spawns elite Poison/Water predators with hazard auras.' },
    { type: 'venom_trapper', chance: 0.10, description: 'A chitin engineer—rare Bug/Dark—sets a gauntlet along the rim.' }
  ]
},
// Seelie Courts — Conoco Island
'puck-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'seelie-courts',
  regionName: 'Seelie Courts',
  welcomeMessages: {
    base: 'Welcome to Puck Town—where pranks have bylaws and illusions tip their hats.',
    variations: [
      'Glamours giggle in alleys; doors move three inches for comedic effect.',
      'Street lanterns wink—some are fire, some are fae with opinions.',
      'If the road loops, it liked you. Say thanks, keep walking.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fairy', 'Psychic', 'Dark', 'Bug'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 7, max: 17 },
  agroRange: { min: 12, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'glamour_prank', chance: 0.22, description: 'Mischief surge boosts Fairy/Psychic spawns with trickster boons.' },
    { type: 'trickster_tag', chance: 0.12, description: 'Caught by a riddle—rare Dark/Fairy courier challenges you.' }
  ]
},

// Oracle's Sanctum — Conoco Island
'pythia-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'oracles-sanctum',
  regionName: "Oracle's Sanctum",
  welcomeMessages: {
    base: 'Welcome to Pythia Village—quiet chants, steady breath, futures in training.',
    variations: [
      'Resonance bowls sing; thoughts line up single-file.',
      'Water mirrors ripple in hexameter—do not interrupt the meter.',
      'Novice oracles swap focus drills for tea etiquette.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Psychic', 'Fairy', 'Water'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 40 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'oracle_chorus', chance: 0.20, description: 'Group resonance boosts Psychic/Fairy support effects.' },
    { type: 'focus_rite', chance: 0.12, description: 'A trance reveals a rare Water/Psychic herald at the springs.' }
  ]
},

// Jötun Tundra — Conoco Island
'rimeheart-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'jotun-tundra',
  regionName: 'Jötun Tundra',
  welcomeMessages: {
    base: 'Welcome to Rimeheart Town—frost scholars and a heartbeat sealed in ice.',
    variations: [
      'Runes trace on the glacier core; lectures happen in mittens.',
      'Aurora maps drape the academy rafters—bring notes and cocoa.',
      'If your breath rings like a bell, class is starting.'
    ]
  },
  battleParameters: { weather: 'snow', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ice', 'Psychic', 'Water'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'heart_of_ice', chance: 0.22, description: 'Glacial pulse empowers Ice/Psychic spawns with focus boons.' },
    { type: 'frost_doctrine', chance: 0.12, description: 'A scholar-warden—rare Water/Ice—invites a measured duel.' }
  ]
},

// Mictlan Hollows — Conoco Island
'river-crossing': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'mictlan-hollows',
  regionName: 'Mictlan Hollows',
  welcomeMessages: {
    base: 'Welcome to the River of Souls Crossing—lanterns lead, waters remember.',
    variations: [
      'Petal rafts glide in silence; fare is paid in kindness and coins.',
      'Ferryman bells count breaths—keep yours gentle.',
      'Mist shapes bow from the shallows; bow back.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ghost', 'Water', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 28, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Ferryman Token' },
  specialEncounters: [
    { type: 'soul_current_confluence', chance: 0.21, description: 'Converging currents reveal rare Ghost/Water fusion.' },
    { type: 'ferryman_judgment', chance: 0.11, description: 'Passing trial grants boosted encounter quality.' }
  ]
},

// Volcanic Peaks — Conoocoo Archipelago
'sacred-caldera': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'volcanic-peaks',
  regionName: 'Volcanic Peaks',
  welcomeMessages: {
    base: 'Welcome to the Sacred Caldera—dawn-and-dusk rites in a bowl of living fire.',
    variations: [
      'Ash halos drift like crowns; shamans trace embers into sigils.',
      'Vents exhale dragon-breath; the rock listens for vows.',
      'The Leviathan’s seat rumbles—respect is non-optional.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Rock', 'Dragon'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 45, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Leviathan Ember Seal' },
  specialEncounters: [
    { type: 'leviathan_ritual', chance: 0.22, description: 'Ritual peak spawns Fire/Dragon elites with fervor boons.' },
    { type: 'caldera_resonance', chance: 0.10, description: 'Glass rim sings—rare Rock/Fire warden rises from vents.' }
  ]
},

// Terra Madre Basin — Conoco Island
'sacred-canyon': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'terra-madre-basin',
  regionName: 'Terra Madre Basin',
  welcomeMessages: {
    base: 'Welcome to the Sacred Canyon—stone pages, earth scripture.',
    variations: [
      'Layered cliffs glow at dusk; geologic sentences finish themselves.',
      'Root bridges hum with leylines—step like you’re reading aloud.',
      'Dust devils turn pages; the plot thickens with clay.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Rock', 'Ground', 'Grass', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'geomancy_chorus', chance: 0.20, description: 'Aligned leylines boost Rock/Ground spawns with fortify boons.' },
    { type: 'earth_spirit_walk', chance: 0.12, description: 'A canyon echo manifests a rare Grass/Fairy guide.' }
  ]
},

// Agni Peaks — Conoco Island
'sacred-pyre': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'agni-peaks',
  regionName: 'Agni Peaks',
  welcomeMessages: {
    base: 'Welcome to the Sacred Pyre—peakfire that writes the sky in bright handwriting.',
    variations: [
      'Dawn rites kindle staircases of flame; dusk braids the smoke into prayers.',
      'Bellows of wind feed the altar; the coals remember names.',
      'Pilgrims circle sunwise—keep pace or risk poetry.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Fairy', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1,
    species_max: 1,
    types_min: 1,
    types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'First Flame Brand' },
  specialEncounters: [
    { type: 'dawn_and_dusk', chance: 0.22, description: 'Twin rites spawn Fire/Fairy elites with radiant auras.' },
    { type: 'spirit_ascension', chance: 0.10, description: 'A flame-born guardian—rare Fire/Psychic—tests your resolve.' }
  ]
},
// Quetzal Winds — Conoco Island
'serpent-pyramid': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'quetzal-winds',
  regionName: 'Quetzal Winds',
  welcomeMessages: {
    base: 'Welcome to the Serpent Pyramid—feathered coils of wind and rite.',
    variations: [
      'Step tiers breathe like lungs; chants ride the thermals.',
      'Shadow of the serpent sweeps noon—make a wish, then hold onto something.',
      'Plume banners crackle; the air’s already halfway to music.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Flying', 'Dragon', 'Fairy', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Plumed Serpent Sigil' },
  specialEncounters: [
    { type: 'wind_ascension', chance: 0.22, description: 'Tier rites spawn elite Flying/Dragon custodians with gale boons.' },
    { type: 'plume_alignment', chance: 0.10, description: 'Feather pennants sync—rare Fairy/Grass herald descends.' }
  ]
},

// Pirates' Bay — Conoco Island
'skull-rock': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'pirates-bay',
  regionName: "Pirates' Bay",
  welcomeMessages: {
    base: 'Welcome to Skull Rock—maze of teeth, whisper of reefs.',
    variations: [
      'Waves grin through sockets; the tide loves jump-scares.',
      'Charts curl at the edges—like they know what’s coming.',
      'If a gull laughs, consider turning around.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Dark', 'Rock', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 45, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Reefchart Medallion' },
  specialEncounters: [
    { type: 'reef_mirage', chance: 0.22, description: 'Shifting channels lure rare Dark/Water raiders to ambush.' },
    { type: 'skull_echo', chance: 0.10, description: 'Cavern howl summons a Rock/Ghost sentinel from the jawline.' }
  ]
},

// Thunderbird Heights — Conoco Island
'storm-dance-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to Storm Dance Village—feet drum, clouds answer.',
    variations: [
      'Prayer fans flutter lightning-quick; the air keeps tempo.',
      'Totem poles hum with sky song; offer respect and decent footwork.',
      'If thunder claps on beat, you’re invited.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Ground'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 10, max: 19 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'rainstep_ritual', chance: 0.22, description: 'Dance rite boosts Electric/Flying spawns with rhythm boons.' },
    { type: 'totem_trial', chance: 0.12, description: 'Ground totem awakens a rare Ground/Electric warden.' }
  ]
},

// Nimbus Capital — Sky Isles
'storm-district': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'nimbus-capital',
  regionName: 'Nimbus Capital',
  welcomeMessages: {
    base: 'Welcome to the Storm District—commerce on a live wire.',
    variations: [
      'Arc lamps blink deals-per-minute; bring exact change and insulation.',
      'Wind-forged stalls rattle like good omens.',
      'Receipts are heat-printed by lightning. Eco-friendly? Ish.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Storm Market Writ' },
  specialEncounters: [
    { type: 'grid_flash_sale', chance: 0.22, description: 'Overcharge event spawns elite Electric/Steel with haste boons.' },
    { type: 'thermal_updraft', chance: 0.10, description: 'A perfect lift draws a rare Flying/Electric courier.' }
  ]
},

// Anansi Woods — Conoco Island
'story-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'anansi-woods',
  regionName: 'Anansi Woods',
  welcomeMessages: {
    base: 'Welcome to Story Village—spiral webs teaching in concentric chapters.',
    variations: [
      'Elder weavers tug a strand—the lesson arrives as a breeze.',
      'Tales are braided, not told; listen with your hands.',
      'If a web glows, that’s a footnote meant for you.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Bug', 'Fairy', 'Dark'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 5, max: 15 },
  agroRange: { min: 6, max: 32 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'hearth_circle', chance: 0.22, description: 'Dusk circle boosts Bug/Fairy support and lore-drop rates.' },
    { type: 'pattern_riddle', chance: 0.12, description: 'A tricky motif summons a rare Dark/Bug guide.' }
  ]
},

// Seelie Courts — Conoco Island
'summer-court': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'seelie-courts',
  regionName: 'Seelie Courts',
  welcomeMessages: {
    base: 'Welcome to the Summer Court—eternal solstice and festivals that outlast your stamina.',
    variations: [
      'Sunlace canopies throw gold over everything—especially your plans.',
      'Light-weavers knit warmth into the air; joy is mandatory.',
      'Smile at the heralds; they outrank the sun here.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fairy', 'Fire', 'Grass'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Solstice Circlet' },
  specialEncounters: [
    { type: 'sunweave_revel', chance: 0.22, description: 'Festival peak spawns Fairy/Fire elites with radiant boons.' },
    { type: 'greenbloom_pact', chance: 0.10, description: 'A living garland calls a rare Grass/Fairy arbiter.' }
  ]
},

// Agni Peaks — Conoco Island
'tapas-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'agni-peaks',
  regionName: 'Agni Peaks',
  welcomeMessages: {
    base: 'Welcome to Tapas Town—discipline in the heat and breath like a bellows.',
    variations: [
      'Monks pace lava paths barefoot; the lesson is “focus or hop.”',
      'Meditation gongs keep time with vents; thoughts smelt clean.',
      'Tea is strong, advice stronger—hydrate accordingly.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Fire', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'ascetic_trial', chance: 0.22, description: 'Endurance rite buffs Fighting/Psychic allies in focused duels.' },
    { type: 'lava_walk', chance: 0.10, description: 'A master of heat—rare Fire/Fighting—tests your calm under pressure.' }
  ]
},
// Terra Madre Basin — Conoco Island
'tellus-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'terra-madre-basin',
  regionName: 'Terra Madre Basin',
  welcomeMessages: {
    base: 'Welcome to Tellus City—stone that grows, streets that breathe.',
    variations: [
      'Basalt colonnades bud like flowers; architects here water buildings.',
      'Quarries sing work songs—the walls harmonize.',
      'Lay a hand on the arch—feel the heartbeat of the hill.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Rock', 'Ground', 'Grass', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 9, max: 19 },
  agroRange: { min: 15, max: 50 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Telluric Sigil' },
  specialEncounters: [
    { type: 'stone_growth_rite', chance: 0.20, description: 'Living masonry awakens—rare Rock/Fairy stewards emerge.' },
    { type: 'earth_tide', chance: 0.12, description: 'Subsurface surge boosts Ground/Grass spawns with fortify boons.' }
  ]
},

// Quetzal Winds — Conoco Island
'tenochtitlan-sky': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'quetzal-winds',
  regionName: 'Quetzal Winds',
  welcomeMessages: {
    base: 'Welcome to Tenochtitlan-Sky—canals of cloud, plazas of wind, and feathers that vote.',
    variations: [
      'Sun disks flash across terraces; the city glides a little when it’s happy.',
      'Serpent updrafts hum beneath bridges—hold onto your hat and your awe.',
      'Market stalls are tethered; customers preferably are.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Flying', 'Dragon', 'Fairy', 'Electric'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Feathered Sky Writ' },
  specialEncounters: [
    { type: 'sun_disk_alignment', chance: 0.22, description: 'Aligned disks spawn elite Flying/Dragon custodians with gale boons.' },
    { type: 'cloud_canal_confluence', chance: 0.10, description: 'Converging drafts call a rare Fairy/Electric herald.' }
  ]
},

// Terra Madre Basin — Conoco Island
'terra-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'terra-madre-basin',
  regionName: 'Terra Madre Basin',
  welcomeMessages: {
    base: 'Welcome to Terra Village—soil so good it grades your gardening.',
    variations: [
      'Vines train themselves; farmers mostly supervise and snack.',
      'Irrigation stones purr when content—water follows the sound.',
      'Plant a seed, blink twice, meet its grandkids.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Ground', 'Bug', 'Fairy'],
    includeStages: ['Base Stage'],
    includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 3, max: 13 },
  agroRange: { min: 5, max: 28 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'fertility_chorus', chance: 0.22, description: 'Ley hum boosts Grass/Fairy support spawns.' },
    { type: 'earth_kindred', chance: 0.12, description: 'A rare Ground/Grass caretaker offers a gentle duel.' }
  ]
},

// Tempest Zones — Sky Isles
'thunder-arena': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'tempest-zones',
  regionName: 'Tempest Zones',
  welcomeMessages: {
    base: 'Welcome to the Thunder Arena—duels choreographed by lightning and applause.',
    variations: [
      'Capacitor rings hum; referees carry grounding rods and opinions.',
      'Floor glyphs glow with each step—try not to write your name.',
      'Crowds float in tethered galleries; cheers arrive slightly ionized.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 80 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Storm Charter' },
  specialEncounters: [
    { type: 'scheduled_surge', chance: 0.22, description: 'Arena overcharge spawns elite Electric/Steel challengers.' },
    { type: 'perfect_conduction', chance: 0.10, description: 'A pristine strike invites a rare Flying/Electric arbiter.' }
  ]
},

// Thunderbird Heights — Conoco Island
'thunder-mesa': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to Thunder Mesa—flat top, tall storms, excellent acoustics.',
    variations: [
      'Echo chambers carve thunder into verses—try not to duet.',
      'Lightning calendars etch the rim; today looks… energetic.',
      'Sky drums practice on the cliff; percussionists welcome.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Mesa Grounding Spike' },
  specialEncounters: [
    { type: 'storm_anthem', chance: 0.22, description: 'Resonant peals summon elite Electric/Flying defenders.' },
    { type: 'quartz_resound', chance: 0.10, description: 'Rim crystals awaken a rare Rock/Electric sentinel.' }
  ]
},

// Long Valley — Conoco Island
'tianlong-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'long-valley',
  regionName: 'Long Valley',
  welcomeMessages: {
    base: 'Welcome to Tianlong City—spiral pagodas writing the sky in dragon script.',
    variations: [
      'Incense coils climb towers; every breath edits a cloud.',
      'Bronze bells ring in couplets; responses arrive as wind.',
      'Scholars practice calligraphy with lightning—bring spare sleeves.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Fairy', 'Steel', 'Electric'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Celestial Edict Seal' },
  specialEncounters: [
    { type: 'sky_script', chance: 0.22, description: 'Tower spirals summon elite Dragon/Steel custodians.' },
    { type: 'spirit_calligraphy', chance: 0.10, description: 'A living stroke reveals a rare Fairy/Dragon arbiter.' }
  ]
},

// Crystal Cove — Conoocoo Archipelago
'time-pools': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'crystal-cove',
  regionName: 'Crystal Cove',
  welcomeMessages: {
    base: 'Welcome to the Time Pools—eddies of earlier and later in one shoreline.',
    variations: [
      'Tide clocks tick sideways; reflections arrive before you do.',
      'Crystalline shelves ring like hourglass bells.',
      'Step between ripples; choose a pace, not a path.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Psychic', 'Water', 'Ice', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 14, max: 20 },
  agroRange: { min: 28, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Chrono Compass' },
  specialEncounters: [
    { type: 'temporal_eddy', chance: 0.22, description: 'Fast-forward pools spawn elite Psychic/Water with haste boons.' },
    { type: 'tidal_inversion', chance: 0.10, description: 'A backward surge reveals a rare Ice/Fairy time-keeper.' }
  ]
},
// Primordial Jungle — Conoocoo Archipelago
'time-temple': {
  landmass: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  region: 'primordial-jungle',
  regionName: 'Primordial Jungle',
  welcomeMessages: {
    base: 'Welcome to the Time Temple—where the air holds its breath and echoes arrive early.',
    variations: [
      'Hourglass frescoes pour light instead of sand.',
      'Pendulum vines sway to rhythms no one is playing.',
      'Step between sunbeams—some belong to yesterday.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Psychic', 'Ghost', 'Steel', 'Dragon'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Chrono Seal' },
  specialEncounters: [
    { type: 'time_lock', chance: 0.22, description: 'A stillness falls—rare Psychic/Steel sentinels manifest from frozen seconds.' },
    { type: 'paradox_wanderer', chance: 0.10, description: 'Echo of a future beast—Ghost/Dragon—tests your timeline etiquette.' }
  ]
},

// Seelie Courts — Conoco Island
'titania-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'seelie-courts',
  regionName: 'Seelie Courts',
  welcomeMessages: {
    base: 'Welcome to Titania City—crystal spires tuned to the heart’s weather.',
    variations: [
      'Gardens bloom in impossible palettes; color theory files for retirement.',
      'Choirs weave light into lace; joy is a public utility.',
      'Mind your courtesy—mirrors here reflect intentions, not faces.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fairy', 'Grass', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Court Rosette' },
  specialEncounters: [
    { type: 'chromatic_festival', chance: 0.22, description: 'Emotion-ward blooms boost Fairy/Psychic elites with radiant boons.' },
    { type: 'spire_resonance', chance: 0.10, description: 'A tuned spire calls a rare Grass/Fairy arbiter for ceremonial duel.' }
  ]
},

// Raven's Shadow — Conoco Island
'trickster-lodge': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'ravens-shadow',
  regionName: "Raven's Shadow",
  welcomeMessages: {
    base: 'Welcome to the Trickster Lodge—twilight riddles and doors that disagree.',
    variations: [
      'Feather sigils shuffle on the walls; the punchlines come later.',
      'Masks watch politely; some leave with you.',
      'Lessons begin with a wrong turn—preferably yours.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Ghost', 'Flying', 'Psychic'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Paradox Feather' },
  specialEncounters: [
    { type: 'riddle_gauntlet', chance: 0.22, description: 'Answer well—rare Dark/Flying mentor arrives mid-echo.' },
    { type: 'shadow_flip', chance: 0.10, description: 'Room turns inside-out—Ghost/Psychic challenger steps through.' }
  ]
},

// Poseidon's Reach — Conoco Island
'trident-temple': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: 'Welcome to the Trident Temple—sea-quakes felt in bone and tide.',
    variations: [
      'Salt spray beads on stone runes; the floor swells like a heartbeat.',
      'Conductor channels hum with thunder under seawater.',
      'Offerings travel by current—return postage not guaranteed.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Electric', 'Steel', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Trident Writ' },
  specialEncounters: [
    { type: 'seismic_tide', chance: 0.22, description: 'Temple tremor spawns elite Water/Steel guardians with bulwark boons.' },
    { type: 'stormfont', chance: 0.10, description: 'A charged well births a rare Water/Electric arbiter.' }
  ]
},

// Raven's Shadow — Conoco Island
'twilight-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'ravens-shadow',
  regionName: "Raven's Shadow",
  welcomeMessages: {
    base: 'Welcome to Twilight Town—stacked dusk layers and shops that sell riddles by the pound.',
    variations: [
      'Streetlamps glow out of order; time follows local bylaws.',
      'Market stalls trade memories for maps; haggle carefully.',
      'The horizon blinks—yes, at you.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Ghost', 'Psychic', 'Flying'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 28, max: 65 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'dusk_gradient', chance: 0.22, description: 'Layer shift boosts Dark/Ghost spawns with stealth boons.' },
    { type: 'raven_market', chance: 0.10, description: 'A vendor’s omen summons a rare Psychic/Flying courier.' }
  ]
},

// Kshatriya Arena — Conoco Island
'valor-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'kshatriya-arena',
  regionName: 'Kshatriya Arena',
  welcomeMessages: {
    base: 'Welcome to Valor Town—academies by day, honorable bruises by night.',
    variations: [
      'Drill fields ring with cadence; pride keeps the beat.',
      'Armory banners list alumni—aim to be a footnote at least.',
      'Courage is contagious—consider yourself exposed.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fighting', 'Steel', 'Fire'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Valor Writ' },
  specialEncounters: [
    { type: 'academy_trials', chance: 0.22, description: 'Rank exams summon elite Fighting/Steel duelists.' },
    { type: 'banner_oath', chance: 0.10, description: 'A ceremonial vow calls a rare Fire/Fighting mentor.' }
  ]
},

// Oracle's Sanctum — Conoco Island
'vision-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'oracles-sanctum',
  regionName: "Oracle's Sanctum",
  welcomeMessages: {
    base: 'Welcome to Vision Town—auric shields up, probabilities under review.',
    variations: [
      'Analysis cloisters hum; ink dries in fractals.',
      'Skyline arrays model fate; bring questions and spare outcomes.',
      'Silence here is a lab instrument—handle gently.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Psychic', 'Fairy', 'Electric'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Auric Research Permit' },
  specialEncounters: [
    { type: 'probability_braid', chance: 0.22, description: 'Model convergence boosts Psychic/Electric elites with foresight boons.' },
    { type: 'vision_lock', chance: 0.10, description: 'A focused trance reveals a rare Fairy/Psychic herald.' }
  ]
},

// Hephaestus Forge — Conoco Island
'vulcan-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'hephaestus-forge',
  regionName: 'Hephaestus Forge',
  welcomeMessages: {
    base: 'Welcome to Vulcan City—tiered megaforges and innovations that spark on contact.',
    variations: [
      'Divine furnaces thrum; streets glow with safe, mostly, runoff light.',
      'Alloy districts compete in fireworks of metallurgy—bring visor and curiosity.',
      'Blueprint pigeons deliver patents; do not feed them filings.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Steel', 'Fire', 'Rock'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Forge Access Stamp' },
  specialEncounters: [
    { type: 'divine_furnace_surge', chance: 0.22, description: 'Overpressure wave spawns elite Steel/Fire fabricators.' },
    { type: 'alloy_parade', chance: 0.10, description: 'A showcase draw reveals a rare Rock/Steel sentinel.' }
  ]
},
// Thunderbird Heights — Conoco Island
'wakinyan-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'thunderbird-heights',
  regionName: 'Thunderbird Heights',
  welcomeMessages: {
    base: 'Welcome to Wakinyan City—rooftops are lightning rods and the views are unreasonable.',
    variations: [
      'Stormbreak buttresses hum; glass gutters pour thunder.',
      'Feathered totems crackle with static etiquette.',
      'If the wind steals your hat, consider it a tithe.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Electric', 'Flying', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Stormwarden Seal' },
  specialEncounters: [
    { type: 'thunderline_surge', chance: 0.22, description: 'Grid flare summons elite Electric/Flying wardens.' },
    { type: 'spire_resonance', chance: 0.10, description: 'Conductive spires call a rare Steel/Electric sentinel.' }
  ]
},

// Anansi Woods — Conoco Island
'web-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'anansi-woods',
  regionName: 'Anansi Woods',
  welcomeMessages: {
    base: 'Welcome to Web Town—suspended avenues and contracts in thread.',
    variations: [
      'Silk girders hum with news; step light, read twice.',
      'Pattern engineers tune crossings for story throughput.',
      'If a strand glows, you just got a notification.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Bug', 'Dark', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Silk Transit Permit' },
  specialEncounters: [
    { type: 'lattice_jam', chance: 0.22, description: 'Traffic knot attracts rare Bug/Fairy mediators.' },
    { type: 'whisper_trade', chance: 0.10, description: 'Shadow broker—Dark/Bug—offers a duel-for-gossip.' }
  ]
},

// Nimbus Capital — Sky Isles
'wind-gardens': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'nimbus-capital',
  regionName: 'Nimbus Capital',
  welcomeMessages: {
    base: 'Welcome to the Wind Gardens—floating beds and very opinionated breezes.',
    variations: [
      'Aerophytes sip clouds; gardeners steer with kites.',
      'Jetstream harps keep time for pruning.',
      'Drop anything and the wind will plant it for you—somewhere.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Flying', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 15, max: 50 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Sky Tether Permit' },
  specialEncounters: [
    { type: 'updraft_bloom', chance: 0.22, description: 'Perfect lift boosts Grass/Fairy support spawns.' },
    { type: 'glide_caretaker', chance: 0.10, description: 'A rare Flying/Grass tender circles in for a gentle test.' }
  ]
},

// Quetzal Winds — Conoco Island
'wind-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'quetzal-winds',
  regionName: 'Quetzal Winds',
  welcomeMessages: {
    base: 'Welcome to Wind Village—breezeways that sing and roofs that listen.',
    variations: [
      'Streamers read the weather before it happens.',
      'Ceremonial kites map thermals for apprentices.',
      'If a door slams, that was a greeting.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Flying', 'Grass', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 7, max: 17 },
  agroRange: { min: 12, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'ceremonial_draft', chance: 0.22, description: 'Village rite boosts Flying/Grass spawns with breeze boons.' },
    { type: 'plumed_mentor', chance: 0.12, description: 'A rare Fairy/Flying tutor offers aerial drills.' }
  ]
},

// Long Valley — Conoco Island
'wisdom-town': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'long-valley',
  regionName: 'Long Valley',
  welcomeMessages: {
    base: 'Welcome to Wisdom Town—jade archives, patient bells, and lectures that molt.',
    variations: [
      'Scroll vaults breathe; scholars practice quiet like a martial art.',
      'Resonance cloisters tune thought into tidy constellations.',
      'Debate duels end with tea… and sometimes homework.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Psychic', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 25, max: 65 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Jade Scroll Writ' },
  specialEncounters: [
    { type: 'ink_alignment', chance: 0.22, description: 'Calligraphy rite summons rare Psychic/Fairy tutors.' },
    { type: 'scale_parable', chance: 0.10, description: 'A Dragon/Fairy sage tests your patience and posture.' }
  ]
},

// Crowsfoot Marsh — Conoco Island
'witchwood-city': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'crowsfoot-marsh',
  regionName: 'Crowsfoot Marsh',
  welcomeMessages: {
    base: 'Welcome to Witchwood City—twisted boughs, swamp sigils, and very legal hexes.',
    variations: [
      'Hedge-lanterns glare like grumpy fireflies.',
      'Cauldron plazas bubble with elective coursework.',
      'Mind the roots; they mind you back.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Poison', 'Grass', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Marsh Coven Token' },
  specialEncounters: [
    { type: 'blackthorn_market', chance: 0.22, description: 'Night bazaar spawns elite Dark/Poison duelists.' },
    { type: 'bog_omen', chance: 0.10, description: 'A rare Grass/Ghost augur rises from the reeds.' }
  ]
},

// Draconic Abyss — Sky Isles
'wyrmclaw-village': {
  landmass: 'sky-isles',
  landmassName: 'Sky Isles',
  region: 'draconic-abyss',
  regionName: 'Draconic Abyss',
  welcomeMessages: {
    base: 'Welcome to Wyrmclaw Village—sky edges, blood oaths, and neighbors with wingspans.',
    variations: [
      'Clifftop chains sing; ledges are on a first-name basis.',
      'Drake shrines taste like iron on the wind.',
      'The greeting is a bow; the test is everything after.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Fire', 'Dark', 'Flying'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 45, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Wyrmclaw Oathband' },
  specialEncounters: [
    { type: 'oath_trance', chance: 0.22, description: 'Bond rite summons elite Dragon/Flying guardians.' },
    { type: 'ember_vigil', chance: 0.10, description: 'A Fire/Dark adjudicator challenges unworthy boasts.' }
  ]
},

// Mictlan Hollows — Conoco Island
'xochitonal-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'mictlan-hollows',
  regionName: 'Mictlan Hollows',
  welcomeMessages: {
    base: 'Welcome to Xochitonal Village—flowers remember, and the air hums with gentle farewells.',
    variations: [
      'Marigold paths braid between altars; every petal is a postcard.',
      'Lantern rivers carry songs upriver and back again.',
      'Offer sugar, receive stories—fair trade.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Ghost', 'Fairy', 'Grass', 'Water'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Baby I', 'Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 8, max: 18 },
  agroRange: { min: 10, max: 45 },
  itemRequirements: { needsMissionMandate: true },
  specialEncounters: [
    { type: 'altar_cycle', chance: 0.22, description: 'Vigil peak boosts Ghost/Fairy support spawns.' },
    { type: 'petal_procession', chance: 0.10, description: 'A rare Water/Grass guide invites a remembrance duel.' }
  ]
},

// Agni Peaks — Conoco Island
'yagna-village': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'agni-peaks',
  regionName: 'Agni Peaks',
  welcomeMessages: {
    base: 'Welcome to Yagna Village—ritual fires older than the gossip.',
    variations: [
      'Offerings crackle into blessings; smoke writes polite cursive.',
      'Bell chimes pace mantras; ash marks mean you belong.',
      'Share warmth, carry light—refills available nightly.'
    ]
  },
  battleParameters: { weather: 'sunny', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Fire', 'Fighting', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 9, max: 19 },
  agroRange: { min: 20, max: 55 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Ritual Offering Bundle' },
  specialEncounters: [
    { type: 'sacrificial_flame', chance: 0.22, description: 'Ceremony surge spawns elite Fire/Fighting devotees.' },
    { type: 'ember_benediction', chance: 0.10, description: 'A rare Fire/Fairy celebrant offers a protective pact.' }
  ]
},
// Terra Madre Basin — Conoco Island
'mother-temple': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'terra-madre-basin',
  regionName: 'Terra Madre Basin',
  welcomeMessages: {
    base: 'Welcome to the Mother Temple—earth’s heartbeat set to sanctuary tempo.',
    variations: [
      'Root-pillars cradle the nave; moss writes blessings in cursive.',
      'Spring wells whisper names—answer softly and bring offerings.',
      'Stone midwives steady the path; every step feels adopted.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Ground', 'Rock', 'Fairy'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 30, max: 70 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Earthmother Icon' },
  specialEncounters: [
    { type: 'womb_of_stone', chance: 0.22, description: 'Hollow chamber awakens rare Rock/Fairy caretakers.' },
    { type: 'verdant_benediction', chance: 0.10, description: 'Ley sap surge boosts Grass/Ground allies with fortify boons.' }
  ]
},

// Demeter's Grove — Conoco Island
'mystery-temple': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'demeters-grove',
  regionName: "Demeter's Grove",
  welcomeMessages: {
    base: 'Welcome to the Mystery Temple—rites of seed, shadow, and sunrise.',
    variations: [
      'Grain torches flicker in cyclers; silence is part of the liturgy.',
      'Veiled hymns braid through hypostyles—follow the pomegranate glyphs.',
      'Death and harvest shake hands politely; do not interrupt.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Grass', 'Fairy', 'Psychic', 'Ghost'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Kernos Token' },
  specialEncounters: [
    { type: 'eleusinian_veil', chance: 0.22, description: 'Initiation veil summons rare Fairy/Psychic heralds.' },
    { type: 'chthonic_bloom', chance: 0.10, description: 'Underworld breeze reveals a Ghost/Grass guide for trial.' }
  ]
},

// Poseidon's Reach — Conoco Island
'nereid-harbor': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'poseidons-reach',
  regionName: "Poseidon's Reach",
  welcomeMessages: {
    base: 'Welcome to Nereid Harbor—lantern shoals and guides who sing the currents by name.',
    variations: [
      'Conch horns coordinate berths; bubbles carry receipts.',
      'Sea nymph patrols braid safe lanes through teethy reefs.',
      'Surface traders dock upstairs; business downstairs is wetter.'
    ]
  },
  battleParameters: { weather: 'rain', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Water', 'Fairy', 'Electric', 'Steel'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'E', 'D', 'C'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 10, max: 18 },
  agroRange: { min: 20, max: 60 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Conch Harbor Pass' },
  specialEncounters: [
    { type: 'tide_ceremony', chance: 0.22, description: 'Harbor rite boosts Water/Fairy support spawns with ward auras.' },
    { type: 'dock_spark', chance: 0.10, description: 'A charged crane draws a rare Electric/Steel sentinel.' }
  ]
},

// Long Valley — Conoco Island
'nine-dragons': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'long-valley',
  regionName: 'Long Valley',
  welcomeMessages: {
    base: 'Welcome to Nine Dragons—mist braids, pearl spray, and echoes with scales.',
    variations: [
      'Arched cataracts write dragon cursive across the gorge.',
      'Jade basins chime when spirits pass; wish quickly.',
      'Cloud ladders rise on cue—take the one that looks at you.'
    ]
  },
  battleParameters: { weather: 'clear', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dragon', 'Water', 'Fairy', 'Ice'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 15, max: 20 },
  agroRange: { min: 40, max: 85 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Jade Scale Charm' },
  specialEncounters: [
    { type: 'pearl_mist', chance: 0.22, description: 'Cresting spray summons elite Dragon/Water custodians.' },
    { type: 'river_spirit_court', chance: 0.10, description: 'A rare Fairy/Ice arbiter rises from the chill veil.' }
  ]
},

// Pirates' Bay — Conoco Island
'nyakuza-landing': {
  landmass: 'conoco-island',
  landmassName: 'Conoco Island',
  region: 'pirates-bay',
  regionName: "Pirates' Bay",
  welcomeMessages: {
    base: 'Welcome to Nyakuza Landing—soft paws, sharp laws, fortified beach.',
    variations: [
      'Claw-mark sigils guard the dunes; trespass earns a scratchy surcharge.',
      'Catwalk watchtowers prowl the tide line—stylish and terrifying.',
      'Fish markets double as recruitment drives; contracts purr.'
    ]
  },
  battleParameters: { weather: 'fog', terrain: 'normal' },
  monsterRollerParameters: {
    speciesTypesOptions: ['Dark', 'Water', 'Fighting', 'Steel', 'Normal'],
    includeStages: ['Base Stage', 'Middle Stage'],
    includeRanks: ['Child', 'D', 'C', 'B'],
    species_min: 1, species_max: 1, types_min: 1, types_max: 2
  },
  levelRange: { min: 12, max: 20 },
  agroRange: { min: 35, max: 75 },
  itemRequirements: { needsMissionMandate: true, itemRequired: 'Nyakuza Clan Tag' },
  specialEncounters: [
    { type: 'shoreline_shakedown', chance: 0.22, description: 'Patrol sweep summons elite Dark/Water enforcers.' },
    { type: 'clan_trial', chance: 0.10, description: 'A rare Fighting/Steel duelist issues the padded gauntlet.' }
  ]
}
};

module.exports = areaConfigurations;
