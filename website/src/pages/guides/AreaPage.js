import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleMapImageError } from '../../utils/imageUtils';

const AreaPage = () => {
  const { landmassId, regionId, areaId } = useParams();
  const navigate = useNavigate();
  const [areaData, setAreaData] = useState(null);
  const [breadcrumbData, setBreadcrumbData] = useState({});

 const Areas = {
'amber-village': {
      id: 'amber-village',
      name: 'Amber Village',
      regionId: 'primordial-jungle',
      regionName: 'Primordial Jungle',
      landmassId: 'conoocoo-archipelago',
      landmassName: 'Conoocoo Archipelago',
      image: '/images/maps/areas/amber-village-detailed.png',
      description: 'Village built among ancient amber deposits that preserve creatures from millions of years ago in perfect crystalline tombs.',
      difficulty: 'Medium',
      elevation: '600 ft',
      temperature: '70°F to 85°F',
      weatherPatterns: 'Warm, humid, occasional rain',
      accessibility: 'Guided tours available',
      recommendedLevel: '40+',
      specialFeatures: [
        'Amber Deposits',
        'Preserved Specimens',
        'Ancient DNA',
        'Time Capsules',
        'Amber Crafting Workshops'
      ],
      wildlife: [
        {
          name: 'Amber Spider',
          species: 'Ariados / Arukenimon / Katress',
          type: 'Bug/Rock',
          rarity: 'Rare',
          description: 'Spiders that create webs of crystalline amber'
        },
        {
          name: 'Sap Fairy',
          species: 'Ribombee / Lillymon / Celaray',
          type: 'Fairy/Grass',
          rarity: 'Uncommon',
          description: 'Tiny fairies that help trees produce magical amber'
        },
        {
          name: 'Preserved Echo',
          species: 'Banette / Soulmon',
          type: 'Ghost/Normal',
          rarity: 'Rare',
          description: 'Spirits of creatures preserved in amber'
        }
      ],
      resources: [
        {
          name: 'Living Amber',
          rarity: 'Extreme',
          description: 'Amber that continues to preserve and protect'
        },
        {
          name: 'DNA Samples',
          rarity: 'Rare',
          description: 'Genetic material from ancient creatures'
        },
        {
          name: 'Amber Crafts',
          rarity: 'Common',
          description: 'Beautiful jewelry and tools made from amber'
        }
      ],
      lore: 'Amber Village was founded by artisans who discovered that the jungle\'s amber deposits contained more than just preserved insects - they held entire ecosystems in suspended animation. The villagers have learned to work with this magical amber.',
      history: 'The village has existed for over 200 years, originally founded by amber miners who discovered the deposits\' unique preservative properties. The village now serves as a center for amber crafting and preservation research.',
      dangers: [
        'Amber mining accidents',
        'Preserved predators awakening',
        'Toxic sap exposure',
        'Unstable deposit collapses',
        'Ancient parasites'
      ],
      tips: [
        'Wear protective gear when mining',
        'Learn to identify dangerous specimens',
        'Study amber safety procedures',
        'Support local craftsmen',
        'Respect preservation sites'
      ]
    },
'dinosaur-valley': {
      id: 'dinosaur-valley',
      name: 'Diphylleia Valley',
      regionId: 'primordial-jungle',
      regionName: 'Primordial Jungle',
      landmassId: 'conoocoo-archipelago',
      landmassName: 'Conoocoo Archipelago',
      image: '/images/maps/areas/diphylleia-valley-detailed.png',
      description: 'Hidden valley where living dinosaurs roam freely in their natural habitat, untouched by modern civilization.',
      difficulty: 'Extreme',
      elevation: '400 ft',
      temperature: '80°F to 95°F',
      weatherPatterns: 'Hot, humid, frequent storms',
      accessibility: 'Extreme danger - restricted access',
      recommendedLevel: '80+',
      specialFeatures: [
        'Living Dinosaurs',
        'Prehistoric Ecosystem',
        'Ancient Environment',
        'Well Preserved Land'
      ],
      wildlife: [
      {
        name: 'Stormscale',
        species: 'Raijin / Voltfin',
        type: 'Electric/Dragon',
        rarity: 'Extreme',
        description: 'A colossal drake crackling with electric fury, its scales glow like storm clouds and each beat of its wings summons thunder across the canopy.'
      },
      {
        name: 'Granitusk',
        species: 'Tyranitar / Magmemon / Basaltigon',
        type: 'Rock/Ground',
        rarity: 'Rare',
        description: 'A hulking behemoth whose hide resembles living stone, crowned with magma-forged horns and trailing vines that pulse with ancient life energy.'
      },
      {
        name: 'Windflock',
        species: 'Talonflame / Birdramon / Karasu Tengu',
        type: 'Normal/Flying',
        rarity: 'Common',
        description: 'A swift, coordinated hunting flock whose feathered crests shimmer with floral patterns, known for diving in perfect synchronicity to snatch prey from the jungle floor.'
      }
    ],
      resources: [
        {
          name: 'Dinosaur DNA',
          rarity: 'Extreme',
          description: 'Genetic material from living prehistoric specimens'
        },
        {
          name: 'Fossilized Teeth',
          rarity: 'Rare',
          description: 'Teeth from ancient predators'
        },
        {
          name: 'Prehistoric Plants',
          rarity: 'Uncommon',
          description: 'Ancient vegetation with unique properties'
        }
      ],
      lore: 'Diphyelleia Valley is whispered about in half-remembered campfire tales as the “Evergreen Graveyard” — a low-lying amphitheater of jungle so thick with ancient growth that sunlight filters in emerald beams. Locals speak of colossal vining ferns that wrap like serpents around stone monoliths, and of distant roars that shake the canopy at dawn. Legend holds that the valley was birthed in primeval times by a fallen Titanmon, its massive body petrified into the valley walls and seeping raw life energy into the soil.',
      history: 'For generations, the valley’s existence has been the closely guarded secret of the Kaemari and Tsu’lan tribes, who regard Diphyelleia as sacred—“the Womb of the Ancients.” These tribes maintain patrols at every forest edge, using ancient wards, ritual drumming, and whispered curses to deter unwelcome travelers. Any outsider caught attempting to breach the jungle is quietly escorted back to the border, their maps and journals confiscated or destroyed. As a result, Diphyelleia Valley has escaped large-scale excavation or disturbance, preserving its prehistoric ecosystems in near-pristine condition. Modern researchers must first earn the tribes’ trust—often through years of cultural exchange and gift offerings—before being granted limited access under strict supervision. This living boundary between tribal stewardship and academic curiosity keeps the valley’s deepest secrets protected, ensuring that its ancient monsters continue to roam unbothered.',
      dangers: [
        'Apex predators',
        'Territorial dinosaurs',
        'Poisonous prehistoric plants',
        'Unstable terrain',
        'Complete isolation from help'
      ],
      tips: [
        'Never travel alone',
        'Bring military-grade equipment',
        'Study dinosaur behavior patterns',
        'Establish emergency evacuation plans',
        'Consider this location off-limits'
      ]
    },
'cloud-palace': {
      id: 'cloud-palace',
      name: 'Cloud Palace',
      regionId: 'nimbus-capital',
      regionName: 'Nimbus Capital',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/cloud-palace-detailed.png',
      description: 'Magnificent palace built entirely of solidified clouds and crystallized air, home to sky royalty who rule the floating realm.',
      difficulty: 'Extreme',
      elevation: '12,000 ft',
      temperature: '20°F to 40°F',
      weatherPatterns: 'Constant cloud cover, wind currents',
      accessibility: 'By royal invitation only',
      recommendedLevel: '90+',
      specialFeatures: [
        'Sky Royal Court',
        'Crystallized Architecture',
        'Cloud Throne Room',
        'Royal Wind Gardens',
        'Floating Chambers'
      ],
      wildlife: [
        {
          name: 'Royal Wind Drake',
          species: 'Dragonite / Imperialdramon / Jetragon',
          type: 'Flying/Psychic',
          rarity: 'Extreme',
          description: 'Majestic dragons that serve the sky royalty'
        },
        {
          name: 'Cloud Sentinel',
          species: 'Skarmory / MetalGarurumon',
          type: 'Flying/Steel',
          rarity: 'Rare',
          description: 'Guardians made of crystallized air and metal'
        },
        {
          name: 'Court Fairy',
          species: 'Togekiss / Angewomon / Katapagos',
          type: 'Fairy/Flying',
          rarity: 'Uncommon',
          description: 'Elegant fairies that serve in the royal court'
        }
      ],
      resources: [
        {
          name: 'Crystallized Air',
          rarity: 'Extreme',
          description: 'Solidified atmosphere with magical properties'
        },
        {
          name: 'Royal Wind Gems',
          rarity: 'Rare',
          description: 'Gems formed from concentrated wind energy'
        },
        {
          name: 'Cloud Essence',
          rarity: 'Uncommon',
          description: 'The raw material of cloud formation'
        }
      ],
      lore: 'The Cloud Palace is the seat of power for the Sky Kings, ancient rulers who have governed the floating isles for millennia. Built from clouds given permanent form through sky magic, the palace exists in a state between solid and ethereal.',
      history: 'Constructed over a thousand years ago by the first Sky King, the palace has served as the center of sky realm politics and culture. It rotates slowly through the heavens, following ancient star patterns.',
      dangers: [
        'Royal guards',
        'Political intrigue',
        'Altitude sickness',
        'Crystallized air hazards',
        'Court politics'
      ],
      tips: [
        'Obtain proper diplomatic credentials',
        'Learn sky realm etiquette',
        'Bring gifts for the court',
        'Respect royal protocol',
        'Study wind current patterns'
      ]
    },
'lightning-city': {
      id: 'lightning-city',
      name: 'Lightning City',
      regionId: 'tempest-zones',
      regionName: 'Tempest Zones',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/lightning-city-detailed.png',
      description: 'Electrified city built within the storm itself, powered entirely by captured lightning strikes and constant electrical phenomena.',
      difficulty: 'Extreme',
      elevation: '14,000 ft',
      temperature: '10°F to 30°F',
      weatherPatterns: 'Constant lightning storms, electrical phenomena',
      accessibility: 'Extreme electrical hazard',
      recommendedLevel: '85+',
      specialFeatures: [
        'Storm Integration',
        'Lightning Power',
        'Electric Architecture',
        'Thunder Resonance',
        'Storm Navigation'
      ],
      wildlife: [
        {
          name: 'Storm Lord',
          species: 'Rayquaza / Imperialdramon / Orserk',
          type: 'Electric/Dragon',
          rarity: 'Extreme',
          description: 'Ancient dragons that have mastered storm control'
        },
        {
          name: 'Lightning Rider',
          species: 'Manectric / Elecmon / Univolt',
          type: 'Electric/Flying',
          rarity: 'Rare',
          description: 'Sky dwellers who surf lightning bolts'
        },
        {
          name: 'Thunder Sprite',
          species: 'Plusle / Pikachu / Elecmon',
          type: 'Electric/Fairy',
          rarity: 'Common',
          description: 'Small creatures that feed on electrical energy'
        }
      ],
      resources: [
        {
          name: 'Pure Lightning',
          rarity: 'Extreme',
          description: 'Concentrated electrical energy in solid form'
        },
        {
          name: 'Storm Cores',
          rarity: 'Rare',
          description: 'Crystallized centers of lightning bolts'
        },
        {
          name: 'Electric Copper',
          rarity: 'Uncommon',
          description: 'Metal constantly charged with electricity'
        }
      ],
      lore: 'Lightning City exists in perfect harmony with the eternal storm, its inhabitants having learned to harness and live within the tempest rather than fight against it. The city\'s architecture conducts and channels electricity as both power source and protection.',
      history: 'Built by storm riders who discovered how to navigate the perpetual tempest, the city has grown over centuries into a marvel of electrical engineering and storm mastery.',
      dangers: [
        'Constant lightning strikes',
        'Electrical overload',
        'Storm navigation hazards',
        'High-voltage equipment',
        'Electromagnetic interference'
      ],
      tips: [
        'Wear full electrical protection',
        'Learn storm riding techniques',
        'Carry lightning rods',
        'Study electrical safety',
        'Travel with storm riders'
      ]
    },
'thunder-arena': {
      id: 'thunder-arena',
      name: 'Thunder Arena',
      regionId: 'tempest-zones',
      regionName: 'Tempest Zones',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/thunder-arena-detailed.png',
      description: 'Aerial colosseum suspended in charged cumulonimbus where combatants duel amid choreographed lightning strikes.',
      difficulty: 'Extreme',
      elevation: '14,800 ft storm bowl',
      temperature: '5°F to 25°F (severe wind chill)',
      weatherPatterns: 'Timed discharge volleys, rolling thunder resonance',
      accessibility: 'Charge glide ingress or conductor lift',
      recommendedLevel: '95-120',
      specialFeatures: [
        'Lightning Battle Grid',
        'Charge Synchronization Pillars',
        'Storm Spectator Rings',
        'Thunder Trial Annulus'
      ],
      wildlife: [
        { name: 'Arc Sprite', species: 'Plusle / Elecmon / Sparkit', type: 'Electric/Fairy', rarity: 'Common', description: 'Stitches minor arcs between conductor studs.' },
        { name: 'Bolt Monitor', species: 'Luxray / Andromon / Boltmane', type: 'Electric/Steel', rarity: 'Uncommon', description: 'Calibrates discharge timing sequences.' },
        { name: 'Storm Gladiator', species: 'Zapdos / Machinedramon / Jetragon', type: 'Electric/Fighting', rarity: 'Rare', description: 'Channels multi-bolt surges through wing arrays.' }
      ],
      resources: [
        { name: 'Thunder Core Fragment', rarity: 'Rare', description: 'Retains structured high-voltage pattern.' },
        { name: 'Conductor Alloy Strap', rarity: 'Uncommon', description: 'Flexible band dispersing residual charge.' },
        { name: 'Arc Residue Dust', rarity: 'Common', description: 'Fine particulate from dissipated strikes.' }
      ],
      lore: 'Arena geometry tuned to focus resonance into safe discharge corridors.',
      history: 'Erected after early informal duels destabilized surrounding wind lanes.',
      dangers: ['Unscheduled arc forks', 'Magnetic disorientation', 'Edge shear gusts'],
      tips: ['Sync moves with pillar cadence', 'Use tri-ground harness', 'Abort at double-flash warning']
    },
  'storm-riders': {
        id: 'storm-riders',
        name: 'Storm Riders Outpost',
        regionId: 'tempest-zones',
        regionName: 'Tempest Zones',
        landmassId: 'sky-isles',
        landmassName: 'Sky Isles',
        image: '/images/maps/areas/storm-riders-detailed.png',
        description: 'High-wind training nexus perched on insulated basalt spires where elite riders map chaotic jet streams.',
        difficulty: 'Extreme',
        elevation: '15,200 ft storm shelf',
        temperature: '5°F to 25°F (wind chill -30°F)',
        weatherPatterns: 'Cross-shear gust corridors, harmonic thunder roll cycles',
        accessibility: 'Grapple glide / vortex thermal ascent',
        recommendedLevel: '90-110',
        specialFeatures: [
          'Wind Shear Simulators',
          'Lightning Rod Array Grid',
          'Jet Stream Cartography Deck',
          'Magnetic Anchor Platforms'
        ],
        wildlife: [
          { name: 'Gale Strider', species: 'Emolga / Peckmon / Jetragon', type: 'Electric/Flying', rarity: 'Uncommon', description: 'Draft-rides between rod arrays testing turbulence.' },
          { name: 'Ion Drakelet', species: 'Axew / Raidramon / Sparkit', type: 'Dragon/Electric', rarity: 'Rare', description: 'Practices charge cycling along spire peaks.' },
          { name: 'Storm Scout', species: 'Rotom / Kokuwamon / Boltmane', type: 'Electric/Ghost', rarity: 'Common', description: 'Logs micro-current fluctuations for route charts.' }
        ],
        resources: [
          { name: 'Jet Stream Chart', rarity: 'Rare', description: 'Refines aerial navigation efficiency.' },
          { name: 'Insulated Cable Weave', rarity: 'Uncommon', description: 'Flexible conductor harnessing stable charge.' },
          { name: 'Spire Basalt Core', rarity: 'Common', description: 'Dense grounding material for storm gear.' }
        ],
        lore: 'Outpost founded to tame fractal storm lanes for long-range traversal.',
        history: 'Expanded after successful mapping of triple shear corridor.',
        dangers: ['Anchor line snapback', 'Unpredicted vortex collapse', 'Overcharge stun'],
        tips: ['Clip dual anchors always', 'Monitor rod saturation gauges', 'Abort runs at violet flux warning']
      },
'starlight-observatory': {
      id: 'starlight-observatory',
      name: 'Starlight Observatory',
      regionId: 'aurora-heights',
      regionName: 'Aurora Heights',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/starlight-observatory-detailed.png',
      description: 'Crystal observatory where sky astronomers study celestial movements and commune with star Monsters.',
      difficulty: 'Extreme',
      elevation: '18,600 ft',
      temperature: '-20°F to 10°F',
      weatherPatterns: 'Stable polar stratosphere, auroral arcs, thin frost haze',
      accessibility: 'High-altitude glide or star current spiral',
      recommendedLevel: '95-115',
      specialFeatures: [
        'Celestial Observation Decks',
        'Star Communion Chamber',
        'Cosmic Prediction Array',
        'Crystal Telescopes'
      ],
      wildlife: [
        { name: 'Aurora Wisp', species: 'Solosis / Candlemon / Chillet', type: 'Psychic/Ice', rarity: 'Common', description: 'Drifts through lens housings refracting starlight.' },
        { name: 'Cosmic Seer', species: 'Beheeyem / Wisemon / Katress', type: 'Psychic', rarity: 'Uncommon', description: 'Charts orbital resonance patterns nightly.' },
        { name: 'Prism Drake', species: 'Latios / Pteramon / Jetragon', type: 'Psychic/Dragon', rarity: 'Rare', description: 'Circles apex spire amplifying telescope clarity.' }
      ],
      resources: [
        { name: 'Starlight Essence', rarity: 'Rare', description: 'Condensed photon lattice enhancing focus gear.' },
        { name: 'Aurora Crystal Shard', rarity: 'Uncommon', description: 'Refractive fragment stabilizing spell channels.' },
        { name: 'Frost Lens Ring', rarity: 'Common', description: 'Cold-forged ring mounting minor optics.' }
      ],
      lore: 'Built where auroral nodes converge, amplifying celestial signal clarity.',
      history: 'Expanded after crystal lattice allowed multi-spectrum scanning.',
      dangers: ['Hypoxia', 'Lens frost fractures', 'Cosmic glare exposure'],
      tips: ['Use full thermal gear', 'Limit continuous star trance', 'Shield eyes during flare events']
    },
'shooting-star': {
      id: 'shooting-star',
      name: 'Shooting Star Peak',
      regionId: 'aurora-heights',
      regionName: 'Aurora Heights',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/shooting-star-detailed.png',
      description: 'Highest peak where falling stars are caught and their cosmic energy harvested for sky magic.',
      difficulty: 'Extreme',
      elevation: '19,400 ft summit ridge',
      temperature: '-30°F to 5°F',
      weatherPatterns: 'Meteor trails, ionized spark snow, rare calm windows',
      accessibility: 'Meteor updraft timing or teleport sigil',
      recommendedLevel: '100-120',
      specialFeatures: [
        'Star Catching Nets',
        'Cosmic Energy Conduits',
        'Meteorite Collection Craters',
        'Sky Magic Crucibles'
      ],
      wildlife: [
        { name: 'Meteor Sprite', species: 'Minior / Solarmon / Foxparks', type: 'Rock/Fairy', rarity: 'Common', description: 'Descends in protective shells before bursting into light.' },
        { name: 'Comet Strider', species: 'Absol / Phantomon / Jetragon', type: 'Dark/Psychic', rarity: 'Uncommon', description: 'Tracks incoming stellar debris trajectories.' },
        { name: 'Star Core Seraph', species: 'Deoxys / Angewomon / Celaray', type: 'Psychic/Fairy', rarity: 'Rare', description: 'Stabilizes volatile cosmic energy nodes.' }
      ],
      resources: [
        { name: 'Cosmic Energy Fragment', rarity: 'Rare', description: 'Pulses with residual stellar charge.' },
        { name: 'Meteor Alloy Shard', rarity: 'Uncommon', description: 'Durable high-impact reinforcement material.' },
        { name: 'Ion Snow Sample', rarity: 'Common', description: 'Charged particulate used in cold infusion rituals.' }
      ],
      lore: 'Peak aligns with seasonal meteor streams maximizing harvest yield.',
      history: 'First nets woven from aurora silk arrays anchored by prism pylons.',
      dangers: ['Meteor impact shock', 'Radiation flares', 'Severe altitude sickness'],
      tips: ['Monitor meteor path charts', 'Use reinforced netting', 'Carry oxygen infusion vials']
    },
'wyrmclaw-village': {
      id: 'wyrmclaw-village',
      name: 'Wyrmclaw Village',
      regionId: 'draconic-abyss',
      regionName: 'Draconic Abyss',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/wyrmclaw-village-detailed.png',
      description: 'Tribal settlement of dragon-bonded humans who have adapted to the hostile sky environment through draconic pacts and blood magic.',
      difficulty: 'Extreme',
      elevation: '20,000 ft',
      temperature: '-10°F to 20°F',
      weatherPatterns: 'Draconic fire winds, ash storms',
      accessibility: 'Hostile tribe - extreme danger',
      recommendedLevel: '95+',
      specialFeatures: [
        'Dragon-Bonded Tribe',
        'Draconic Rituals',
        'Hostile Natives',
        'Blood Pacts',
        'Tribal Warfare'
      ],
      wildlife: [
        {
          name: 'Wyrmclaw Warrior',
          species: 'Garchomp / Wargreymon / Blazamut',
          type: 'Dragon/Fighting',
          rarity: 'Rare',
          description: 'Tribal warriors bonded with dragon spirits'
        },
        {
          name: 'Bone Drake',
          species: 'Druddigon / Skullgreymon / Necromus',
          type: 'Dragon/Ghost',
          rarity: 'Rare',
          description: 'Skeletal dragons that serve the tribe'
        },
        {
          name: 'Blood Familiar',
          species: 'Sableye / Devimon / Lovander',
          type: 'Dark/Psychic',
          rarity: 'Uncommon',
          description: 'Creatures born from draconic blood magic'
        }
      ],
      resources: [
        {
          name: 'Dragon Blood',
          rarity: 'Extreme',
          description: 'Sacred blood used in tribal bonding rituals'
        },
        {
          name: 'Tribal Totems',
          rarity: 'Rare',
          description: 'Carved totems with dragon magic properties'
        },
        {
          name: 'Bone Weapons',
          rarity: 'Uncommon',
          description: 'Weapons crafted from dragon bones'
        }
      ],
      lore: 'The Wyrmclaw Tribe are descendants of humans who made blood pacts with dragons centuries ago. They have evolved beyond normal humanity, gaining draconic traits and fierce loyalty to their dragon lords. They view all outsiders as threats to be eliminated.',
      history: 'The tribe formed during the Dragon Wars, when desperate humans sought power through blood bonds with dragons. Over generations, they have become something between human and dragon, fiercely protecting their territory.',
      dangers: [
        'Immediate attack on sight',
        'Dragon-bonded warriors',
        'Blood magic curses',
        'Territorial dragons',
        'Draconic traps'
      ],
      tips: [
        'Avoid at all costs',
        'Do not attempt contact',
        'Carry dragon-repelling items',
        'Plan emergency evacuation',
        'Consider area off-limits'
      ]
    },
'time-temple': {
      id: 'time-temple',
      name: 'Temple of Ages',
      regionId: 'primordial-jungle',
      regionName: 'Primordial Jungle',
      landmassId: 'conoocoo-archipelago',
      landmassName: 'Conoocoo Archipelago',
      image: '/images/maps/areas/time-temple-detailed.png',
      description: 'Ancient temple where time itself seems suspended, guarded by timeless spirits.',
      difficulty: 'Extreme',
      elevation: '500 ft',
      temperature: '65°F to 80°F',
      weatherPatterns: 'Temporal distortions, eerie stillness',
      accessibility: 'Extreme temporal danger',
      recommendedLevel: '90+',
      specialFeatures: [
        'Time Suspension',
        'Timeless Spirits',
        'Ancient Mysteries',
        'Temporal Magic',
        'Reality Distortions'
      ],
      wildlife: [
        {
          name: 'Chronos Guardian',
          species: 'Dialga / Clockmon / Lyleen',
          type: 'Psychic/Ghost',
          rarity: 'Extreme',
          description: 'Ancient spirit that controls time flow'
        },
        {
          name: 'Temporal Echo',
          species: 'Misdreavus / Soulmon / Fuddler',
          type: 'Ghost/Normal',
          rarity: 'Rare',
          description: 'Echoes of creatures displaced in time'
        },
        {
          name: 'Time Beetle',
          species: 'Genesect / Kabuterimon',
          type: 'Bug/Steel',
          rarity: 'Uncommon',
          description: 'Ancient insects that exist across multiple timelines'
        }
      ],
      resources: [
        {
          name: 'Time Shards',
          rarity: 'Extreme',
          description: 'Crystallized fragments of time itself'
        }
      ],
      lore: 'The Temple of Ages exists outside normal time, where past, present and future converge. Built by a people long forgotten the people of the island worship this site though they no longer know why.',
      history: 'Built by a people long forgotten the people of the island worship this site though they no longer know why.',
      dangers: ['Temporal displacement', 'Time loops', 'Aging acceleration', 'Chronic distortion'],
      tips: ['Carry temporal anchors', 'Limit exposure time', 'Stay together', 'Monitor chronometers']
    },
'heimdal-city': {
      id: 'heimdal-city',
      name: 'Heimdal City',
      regionId: 'hearthfall-commons',
      regionName: 'Hearthfall Commons',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/heimdal-city-detailed.png',
      description: 'The region\'s capital, a bustling city with cozy wooden buildings and central hearths in every home, embodying the northern concept of comfort and togetherness.',
      difficulty: 'Easy',
      elevation: '500 ft',
      temperature: '45°F to 65°F',
      weatherPatterns: 'Temperate, occasional light snow',
      accessibility: 'All skill levels welcome',
      recommendedLevel: '10+',
      specialFeatures: [
        'Regional Capital',
        'Monsters Center Network',
        'Great Hall',
        'Community Festivals',
        'Traditional Architecture'
      ],
      wildlife: [
        {
          name: 'Hearth Guardian',
          species: 'Growlithe / Agumon / Foxparks',
          type: 'Normal/Fire',
          rarity: 'Common',
          description: 'Loyal protectors of homes and families'
        },
        {
          name: 'Comfort Beast',
          species: 'Audino / Patamon / Lovander',
          type: 'Normal/Fairy',
          rarity: 'Uncommon',
          description: 'Creatures that bring peace and warmth'
        },
        {
          name: 'City Wolf',
          species: 'Mightyena / Garurumon / Loupmoon',
          type: 'Normal',
          rarity: 'Common',
          description: 'Friendly wolves that patrol the city streets'
        }
      ],
      resources: [
        {
          name: 'Hearthwood',
          rarity: 'Common',
          description: 'Wood that burns longer and warmer than normal'
        },
        {
          name: 'Comfort Berries',
          rarity: 'Common',
          description: 'Berries that provide warmth and satisfaction'
        },
        {
          name: 'Northern Crafts',
          rarity: 'Uncommon',
          description: 'Traditional handmade goods and tools'
        }
      ],
      lore: 'Heimdal City serves as the heart of Hearthfall Commons, where the northern ideals of community and warmth are embodied in every building and gathering. Named after an ancient guardian spirit who watches over the bridge between realms, the city serves as a gateway between the mortal and spiritual worlds.',
      history: 'Founded centuries ago by northern settlers seeking a new home, the city has grown while maintaining its commitment to community and comfort. The great hall at its center has hosted countless gatherings and celebrations.',
      dangers: [
        'Mild winter weather',
        'Crowded festivals',
        'Tourist confusion',
        'Occasional wild animal visits'
      ],
      tips: [
        'Participate in community events',
        'Visit the Great Hall for stories',
        'Bring warm clothing in winter',
        'Respect local customs',
        'Try the local mead'
      ]
    },
'hygge-village': {
      id: 'hygge-village',
      name: 'Hygge Village',
      regionId: 'hearthfall-commons',
      regionName: 'Hearthfall Commons',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/hygge-village-detailed.png',
      description: 'A quaint village embodying the northern concept of cozy contentment and simple pleasures, where every home has a crackling fireplace and time moves at a peaceful pace.',
      difficulty: 'Easy',
      elevation: '400 ft',
      temperature: '40°F to 60°F',
      weatherPatterns: 'Mild, cozy atmosphere with gentle snowfall',
      accessibility: 'Family-friendly, all ages welcome',
      recommendedLevel: '5+',
      specialFeatures: [
        'Cozy Cafes',
        'Knitting Circles',
        'Fireplace Gatherings',
        'Comfort Food',
        'Reading Nooks'
      ],
      wildlife: [
        {
          name: 'Hygge Mouse',
          species: 'Rattata / Patamon / Chillet',
          type: 'Normal',
          rarity: 'Common',
          description: 'Small, cozy creatures that love warm spaces'
        },
        {
          name: 'Comfort Cat',
          species: 'Delcatty / Gatomon / Cattiva',
          type: 'Normal/Fairy',
          rarity: 'Common',
          description: 'Cats that purr with magical warmth'
        },
        {
          name: 'Sleepy Bear',
          species: 'Snorlax / Bearmon / Kingpaca',
          type: 'Normal',
          rarity: 'Uncommon',
          description: 'Gentle bears that love afternoon naps'
        }
      ],
      resources: [
        {
          name: 'Warm Wool',
          rarity: 'Common',
          description: 'Exceptionally soft and warm wool'
        },
        {
          name: 'Cozy Tea',
          rarity: 'Common',
          description: 'Herbal tea that warms the soul'
        },
        {
          name: 'Comfort Blankets',
          rarity: 'Uncommon',
          description: 'Magically warm blankets that never lose their heat'
        }
      ],
      lore: 'Hygge Village represents the purest expression of northern contentment and simple joy. The village motto is "small joys, great happiness" and every resident embodies this philosophy in their daily life.',
      history: 'A traditional village that has preserved ancient ways of finding happiness in simple things. Founded by families seeking a slower, more meaningful way of life.',
      dangers: ['None - perfectly safe and welcoming'],
      tips: [
        'Relax and enjoy the atmosphere',
        'Try local comfort foods',
        'Join a knitting circle',
        'Spend time by the fireplaces',
        'Embrace the slow pace of life'
      ]
    },
'bonfire-town': {
      id: 'bonfire-town',
      name: 'Bonfire Town',
      regionId: 'hearthfall-commons',
      regionName: 'Hearthfall Commons',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/bonfire-town-detailed.png',
      description: 'A lively town centered around a perpetual bonfire where stories and warmth are shared among all visitors. The eternal flame serves as both a beacon and a gathering point for travelers.',
      difficulty: 'Easy',
      elevation: '450 ft',
      temperature: '50°F to 70°F',
      weatherPatterns: 'Warm around the bonfire, mild elsewhere',
      accessibility: 'Open to all visitors',
      recommendedLevel: '5+',
      specialFeatures: [
        'Eternal Bonfire',
        'Storytelling Circles',
        'Night Markets',
        'Song Festivals',
        'Dancing Grounds'
      ],
      wildlife: [
        {
          name: 'Fire Cricket',
          species: 'Larvesta / Tentomon / Flambelle',
          type: 'Fire/Bug',
          rarity: 'Common',
          description: 'Insects that sing around the eternal flame'
        },
        {
          name: 'Story Sprite',
          species: 'Cleffa / Fairymon / Fuack',
          type: 'Fairy/Psychic',
          rarity: 'Uncommon',
          description: 'Tiny fairies that collect and share stories'
        },
        {
          name: 'Festival Bird',
          species: 'Chatot / Piyomon / Killamari',
          type: 'Normal/Flying',
          rarity: 'Common',
          description: 'Colorful birds that perform during celebrations'
        }
      ],
      resources: [
        {
          name: 'Festival Food',
          rarity: 'Common',
          description: 'Traditional celebration foods and treats'
        },
        {
          name: 'Eternal Embers',
          rarity: 'Rare',
          description: 'Embers from the sacred fire that never die'
        },
        {
          name: 'Story Scrolls',
          rarity: 'Uncommon',
          description: 'Written tales from traveling storytellers'
        }
      ],
      lore: 'The eternal bonfire has burned for over 500 years, fueled by community spirit and magical flames. Legend says that any story told by the fire becomes part of the town\'s eternal memory.',
      history: 'Founded around a natural eternal flame discovered by early northern settlers. The town grew as travelers stopped to rest and share their tales by the warming fire.',
      dangers: [
        'Fire safety near bonfire',
        'Crowded during festivals',
        'Late night revelry'
      ],
      tips: [
        'Bring stories to share',
        'Stay for the evening festivities',
        'Respect the sacred flame',
        'Join in the traditional dances',
        'Try roasted festival treats'
      ]
    },
'hearthstone-temple': {
      id: 'hearthstone-temple',
      name: 'Hearthstone Temple',
      regionId: 'hearthfall-commons',
      regionName: 'Hearthfall Commons',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/hearthstone-temple-detailed.png',
      description: 'Ancient temple built around a sacred hearthstone that never grows cold, blessing homes across the region with eternal warmth and protection.',
      difficulty: 'Medium',
      elevation: '600 ft',
      temperature: '55°F to 75°F',
      weatherPatterns: 'Perpetually warm near the hearthstone',
      accessibility: 'Pilgrimage site, respectful visitors welcome',
      recommendedLevel: '25+',
      specialFeatures: [
        'Sacred Hearthstone',
        'Blessing Ceremonies',
        'Ancient Runes',
        'Guardian Spirits',
        'Pilgrimage Path'
      ],
      wildlife: [
        {
          name: 'Hearth Spirit',
          species: 'Flareon / Flarimon',
          type: 'Fire/Ghost',
          rarity: 'Rare',
          description: 'Ancient guardians of the sacred flame'
        },
        {
          name: 'Temple Guardian',
          species: 'Machamp / Medicham',
          type: 'Fighting/Psychic',
          rarity: 'Rare',
          description: 'Protectors of the sacred site'
        },
        {
          name: 'Blessing Dove',
          species: 'Pidgeot / Piyomon',
          type: 'Normal/Fairy',
          rarity: 'Uncommon',
          description: 'White doves that carry blessings to homes'
        }
      ],
      resources: [
        {
          name: 'Blessed Stones',
          rarity: 'Rare',
          description: 'Stones charged with eternal warmth'
        },
        {
          name: 'Sacred Ash',
          rarity: 'Uncommon',
          description: 'Ash from the eternal hearthstone'
        },
        {
          name: 'Holy Water',
          rarity: 'Common',
          description: 'Water blessed by the temple priests'
        }
      ],
      lore: 'The sacred hearthstone is said to be the first fire brought by ancient spirits to warm humanity. It represents the divine gift of home, hearth, and family bonds that can never be broken.',
      history: 'An ancient temple built around a divine gift of eternal warmth. Pilgrims from all over the island have visited for over a millennium to receive blessings for their homes and families.',
      dangers: [
        'Sacred site - respect required',
        'Protective guardian spirits',
        'Spiritual trials for the unworthy'
      ],
      tips: [
        'Show proper reverence',
        'Participate in blessing ceremonies',
        'Bring offerings for the temple',
        'Respect the pilgrimage traditions',
        'Seek guidance from temple priests'
      ]
    },
'golden-hall': {
      id: 'golden-hall',
      name: 'Golden Hall',
      regionId: 'hearthfall-commons',
      regionName: 'Hearthfall Commons',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/golden-hall-detailed.png',
      description: 'Magnificent mead hall where Extreme trainers gather to share tales of their adventures, featuring golden walls adorned with tapestries of great deeds.',
      difficulty: 'Medium',
      elevation: '500 ft',
      temperature: '60°F to 80°F',
      weatherPatterns: 'Warm and festive atmosphere',
      accessibility: 'Heroes and legends welcome, others by invitation',
      recommendedLevel: '40+',
      specialFeatures: [
        'Extreme Mead Hall',
        'Hero Tapestries',
        'Trophy Displays',
        'Epic Feasts',
        'Warrior\'s Rest'
      ],
      wildlife: [
        {
          name: 'Hall Guardian',
          species: 'Machamp / Wargreymon / Anubis',
          type: 'Normal/Fighting',
          rarity: 'Rare',
          description: 'Noble protectors of the Extreme hall'
        },
        {
          name: 'Mead Bear',
          species: 'Ursaring / Bearmon / Kingpaca',
          type: 'Normal',
          rarity: 'Uncommon',
          description: 'Friendly bears that help serve at feasts'
        },
        {
          name: 'Saga Bird',
          species: 'Noctowl / Owlmon / Hoocrates',
          type: 'Normal/Psychic',
          rarity: 'Rare',
          description: 'Birds that remember and recite heroic tales'
        }
      ],
      resources: [
        {
          name: 'Hero\'s Mead',
          rarity: 'Rare',
          description: 'Extreme drink that inspires courage'
        },
        {
          name: 'Golden Chalices',
          rarity: 'Rare',
          description: 'Ceremonial cups used in victory toasts'
        },
        {
          name: 'Victory Banners',
          rarity: 'Uncommon',
          description: 'Tapestries commemorating great achievements'
        }
      ],
      lore: 'The Golden Hall has hosted the greatest heroes and legends for centuries. It is said that only those who have performed truly heroic deeds can see the hall\'s true golden splendor.',
      history: 'Built to honor the greatest achievements of trainers and their Monsters. The hall serves as both museum and gathering place for the most accomplished adventurers.',
      dangers: [
        'Competitive atmosphere',
        'Challenges from veteran trainers',
        'High expectations for entry'
      ],
      tips: [
        'Bring tales of heroism',
        'Challenge veteran trainers',
        'Contribute to the trophy collection',
        'Respect the hall\'s traditions',
        'Earn your place among legends'
      ]
    },
'agni-city': {
      id: 'agni-city',
      name: 'Agni City',
      regionId: 'agni-peaks',
      regionName: 'Agni Peaks',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/agni-city-detailed.png',
      description: 'Mountain city built into volcanic slopes, with sacred fire temples and flowing lava channels that power the entire settlement. The city embodies the purifying power of fire.',
      difficulty: 'Hard',
      elevation: '4000 ft',
      temperature: '90°F to 120°F',
      weatherPatterns: 'Hot, frequent volcanic activity',
      accessibility: 'Heat protection required, spiritual preparation recommended',
      recommendedLevel: '60+',
      specialFeatures: [
        'Sacred Fire Temples',
        'Lava Channels',
        'Purification Ceremonies',
        'Fire Trials',
        'Volcanic Forges'
      ],
      wildlife: [
        {
          name: 'Flame Guardian',
          species: 'Blaziken / Agunimon / Blazamut',
          type: 'Fire/Fighting',
          rarity: 'Rare',
          description: 'Sacred protectors of the fire temples'
        },
        {
          name: 'Lava Salamander',
          species: 'Salazzle / Agumon / Arsox',
          type: 'Fire/Ground',
          rarity: 'Uncommon',
          description: 'Creatures that swim through molten rock'
        },
        {
          name: 'Sacred Phoenix',
          species: 'Ho-Oh / Phoenixmon / Suzaku',
          type: 'Fire/Flying',
          rarity: 'Extreme',
          description: 'Extreme bird of rebirth and purification'
        }
      ],
      resources: [
        {
          name: 'Sacred Ash',
          rarity: 'Rare',
          description: 'Ash from sacred fires with purifying properties'
        },
        {
          name: 'Volcanic Glass',
          rarity: 'Uncommon',
          description: 'Sharp obsidian formed by intense heat'
        },
        {
          name: 'Fire Crystals',
          rarity: 'Rare',
          description: 'Crystals that store and amplify heat energy'
        }
      ],
      lore: 'Agni City is built around the sacred flames of the ancient fire spirit, representing purification, sacrifice, and the divine spark within all life. The city serves as a center for spiritual purification.',
      history: 'Constructed by fire priests and devotees to honor the fire spirit and maintain the sacred flames. The city has weathered countless volcanic eruptions, each one strengthening the inhabitants\' faith.',
      dangers: [
        'Extreme heat',
        'Lava flows',
        'Volcanic eruptions',
        'Fire trials',
        'Spiritual tests'
      ],
      tips: [
        'Wear fire-resistant protection',
        'Respect sacred ceremonies',
        'Undergo purification rituals',
        'Study fire safety procedures',
        'Bring heat-reducing items'
      ]
    },
'yagna-village': {
      id: 'yagna-village',
      name: 'Yagna Village',
      regionId: 'agni-peaks',
      regionName: 'Agni Peaks',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/yagna-village-detailed.png',
      description: 'Sacred village where continuous fire ceremonies are performed, with ritual fires that have burned uninterrupted for centuries, maintained by devoted priests.',
      difficulty: 'Medium',
      elevation: '3500 ft',
      temperature: '80°F to 100°F',
      weatherPatterns: 'Warm, smoke-filled air from ceremonial fires',
      accessibility: 'Spiritual pilgrims welcome',
      recommendedLevel: '45+',
      specialFeatures: [
        'Eternal Yagna Fires',
        'Ritual Ceremonies',
        'Sacred Offerings',
        'Meditation Gardens',
        'Priest Training'
      ],
      wildlife: [
        {
          name: 'Sacred Cow',
          species: 'Tauros / Leomon / Mau',
          type: 'Normal/Psychic',
          rarity: 'Rare',
          description: 'Holy cattle that bless the village'
        },
        {
          name: 'Fire Monkey',
          species: 'Chimchar / Apemon / Caprity',
          type: 'Fire/Normal',
          rarity: 'Common',
          description: 'Playful primates that tend the sacred fires'
        },
        {
          name: 'Ceremony Bird',
          species: 'Talonflame / Piyomon / Galeclaw',
          type: 'Fire/Flying',
          rarity: 'Uncommon',
          description: 'Birds that circle during important rituals'
        }
      ],
      resources: [
        {
          name: 'Sacred Ghee',
          rarity: 'Rare',
          description: 'Clarified butter used in fire ceremonies'
        },
        {
          name: 'Ritual Herbs',
          rarity: 'Common',
          description: 'Plants used in sacred offerings'
        },
        {
          name: 'Blessed Grains',
          rarity: 'Common',
          description: 'Grains offered to the sacred fires'
        }
      ],
      lore: 'Yagna Village exists solely to maintain the sacred fire ceremonies that protect the region. The continuous rituals are believed to maintain cosmic balance and bring divine protection.',
      history: 'Founded by a group of devoted priests centuries ago to perform the eternal yagna (fire sacrifice). The village has never let the ceremonial fires die.',
      dangers: [
        'Ritual fire accidents',
        'Intense spiritual energy',
        'Smoke inhalation',
        'Religious restrictions'
      ],
      tips: [
        'Show respect for ceremonies',
        'Learn about ancient fire traditions',
        'Participate in offerings',
        'Avoid disrupting rituals',
        'Bring appropriate donations'
      ]
    },
'tapas-town': {
      id: 'tapas-town',
      name: 'Tapas Town',
      regionId: 'agni-peaks',
      regionName: 'Agni Peaks',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/tapas-town-detailed.png',
      description: 'Mountain town where ascetics practice intense spiritual discipline and meditation, using the heat of the volcanic region to test their mental and physical limits.',
      difficulty: 'Hard',
      elevation: '4500 ft',
      temperature: '95°F to 125°F',
      weatherPatterns: 'Intense heat, minimal shade',
      accessibility: 'Spiritual seekers and ascetics',
      recommendedLevel: '55+',
      specialFeatures: [
        'Ascetic Training',
        'Meditation Caves',
        'Endurance Trials',
        'Spiritual Discipline',
        'Heat Resistance Training'
      ],
      wildlife: [
        {
          name: 'Desert Sage',
          species: 'Medicham / Wisemon / Anubis',
          type: 'Psychic/Ground',
          rarity: 'Rare',
          description: 'Wise creatures that meditate in the heat'
        },
        {
          name: 'Endurance Lizard',
          species: 'Heliolisk / Agumon / Reptyro',
          type: 'Fire/Rock',
          rarity: 'Common',
          description: 'Reptiles adapted to extreme temperatures'
        },
        {
          name: 'Spirit Eagle',
          species: 'Braviary / Garudamon / Galeclaw',
          type: 'Flying/Psychic',
          rarity: 'Uncommon',
          description: 'Birds that soar above the meditation caves'
        }
      ],
      resources: [
        {
          name: 'Meditation Stones',
          rarity: 'Uncommon',
          description: 'Heated stones used in spiritual practice'
        },
        {
          name: 'Ascetic Robes',
          rarity: 'Common',
          description: 'Simple clothing designed for heat endurance'
        },
        {
          name: 'Spiritual Texts',
          rarity: 'Rare',
          description: 'Ancient scrolls on meditation and discipline'
        }
      ],
      lore: 'Tapas Town represents the ancient concept of spiritual austerity and self-discipline. The extreme heat serves as a test of willpower and a means to burn away worldly attachments.',
      history: 'Established by wandering ascetics who chose this harsh location to practice the most demanding forms of spiritual discipline. The town attracts serious spiritual seekers.',
      dangers: [
        'Extreme heat exhaustion',
        'Dehydration',
        'Mental strain from meditation',
        'Isolation challenges',
        'Spiritual intensity'
      ],
      tips: [
        'Build heat tolerance gradually',
        'Bring adequate water supplies',
        'Practice meditation beforehand',
        'Respect ascetic traditions',
        'Know your physical limits'
      ]
    },
'sacred-pyre': {
      id: 'sacred-pyre',
      name: 'Sacred Pyre',
      regionId: 'agni-peaks',
      regionName: 'Agni Peaks',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/sacred-pyre-detailed.png',
      description: 'Ancient ceremonial site featuring a massive sacred fire that burns atop the highest peak, visible for miles and serving as a beacon for spiritual pilgrims.',
      difficulty: 'Extreme',
      elevation: '6000 ft',
      temperature: '100°F to 140°F',
      weatherPatterns: 'Scorching heat, updrafts from the sacred fire',
      accessibility: 'Extreme pilgrimage site, divine protection required',
      recommendedLevel: '75+',
      specialFeatures: [
        'Massive Sacred Fire',
        'Ceremonial Platform',
        'Divine Manifestations',
        'Spiritual Vortex',
        'Ancient Altar'
      ],
      wildlife: [
        {
          name: 'Fire Avatar',
          species: 'Victini / Agunimon / Blazamut',
          type: 'Fire/Psychic',
          rarity: 'Extreme',
          description: 'Divine manifestation of the fire spirit itself'
        },
        {
          name: 'Pyre Guardian',
          species: 'Chandelure / Candlemon / Faleris',
          type: 'Fire/Ghost',
          rarity: 'Rare',
          description: 'Spirits that protect the sacred flame'
        },
        {
          name: 'Celestial Hawk',
          species: 'Talonflame / Garudamon / Suzaku',
          type: 'Fire/Flying',
          rarity: 'Rare',
          description: 'Divine birds that circle the sacred pyre'
        }
      ],
      resources: [
        {
          name: 'Divine Flames',
          rarity: 'Extreme',
          description: 'Sacred fire that purifies and blesses'
        },
        {
          name: 'Blessed Ashes',
          rarity: 'Rare',
          description: 'Ashes from the eternal sacred fire'
        },
        {
          name: 'Spiritual Energy',
          rarity: 'Rare',
          description: 'Raw divine power emanating from the pyre'
        }
      ],
      lore: 'The Sacred Pyre is believed to be the earthly manifestation of the fire spirit\'s divine presence. The fire has burned since the beginning of time and will continue until the end of the world.',
      history: 'The pyre has existed since ancient times, possibly created by ancient spirits themselves. It serves as the most sacred site in all of Agni Peaks.',
      dangers: [
        'Divine fire that burns the unworthy',
        'Extreme temperatures',
        'Spiritual trials',
        'Altitude and heat combination',
        'Divine judgment'
      ],
      tips: [
        'Undergo purification first',
        'Bring blessed protection',
        'Approach with pure intentions',
        'Respect the sacred site',
        'Prepare for spiritual transformation'
      ]
    },
'eternal-flame': {
      id: 'eternal-flame',
      name: 'Eternal Flame',
      regionId: 'agni-peaks',
      regionName: 'Agni Peaks',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/eternal-flame-detailed.png',
      description: 'Natural gas fire that has burned continuously for millennia, creating a mystical site where the boundary between physical and spiritual realms grows thin.',
      difficulty: 'Hard',
      elevation: '3800 ft',
      temperature: '85°F to 110°F',
      weatherPatterns: 'Warm, mystical energy fluctuations',
      accessibility: 'Spiritual pilgrims and researchers',
      recommendedLevel: '50+',
      specialFeatures: [
        'Natural Eternal Fire',
        'Mystical Energy',
        'Reality Distortions',
        'Spiritual Visions',
        'Ancient Meditation Site'
      ],
      wildlife: [
        {
          name: 'Flame Wisp',
          species: 'Lampent / Candlemon / Flambelle',
          type: 'Fire/Ghost',
          rarity: 'Uncommon',
          description: 'Spirits born from the eternal flame'
        },
        {
          name: 'Vision Serpent',
          species: 'Arbok / Devimon / Pyrin',
          type: 'Fire/Psychic',
          rarity: 'Rare',
          description: 'Snakes that show glimpses of the future'
        },
        {
          name: 'Oracle Moth',
          species: 'Volcarona / FlyBeemon',
          type: 'Fire/Bug',
          rarity: 'Uncommon',
          description: 'Moths drawn to the mystical flame'
        }
      ],
      resources: [
        {
          name: 'Mystical Flame',
          rarity: 'Extreme',
          description: 'Fire that reveals hidden truths'
        },
        {
          name: 'Vision Crystals',
          rarity: 'Rare',
          description: 'Crystals that store prophetic visions'
        },
        {
          name: 'Eternal Embers',
          rarity: 'Uncommon',
          description: 'Glowing embers that never die out'
        }
      ],
      lore: 'The Eternal Flame is said to be a window into the cosmic fire that burns at the heart of creation. Those who meditate by its light may receive visions of past, present, or future.',
      history: 'This natural phenomenon has been revered since ancient times. Many prophets and seers have received their visions while meditating beside the eternal flame.',
      dangers: [
        'Overwhelming visions',
        'Mystical energy exposure',
        'Reality distortions',
        'Spiritual possession',
        'Truth revelations'
      ],
      tips: [
        'Prepare mentally for visions',
        'Limit exposure time',
        'Bring spiritual anchors',
        'Meditate with caution',
        'Record any visions received'
      ]
    },
'atlantis-city': {
      id: 'atlantis-city',
      name: 'Atlantis City',
      regionId: 'poseidons-reach',
      regionName: 'Poseidon\'s Reach',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/atlantis-city-detailed.png',
      description: 'Magnificent underwater city with crystal domes and flowing water streets, capital of the sea realm where merfolk nobility rules over coral palaces.',
      difficulty: 'Hard',
      elevation: '-200 ft',
      temperature: '70°F to 80°F',
      weatherPatterns: 'Underwater currents, bioluminescent tides',
      accessibility: 'Advanced diving equipment required, aquatic breathing recommended',
      recommendedLevel: '65+',
      specialFeatures: [
        'Crystal Domes',
        'Water Streets',
        'Sea Palace',
        'Underwater Markets',
        'Coral Architecture'
      ],
      wildlife: [
        {
          name: 'Sea Noble',
          species: 'Primarina / Neptunemon / Kappa',
          type: 'Water/Psychic',
          rarity: 'Rare',
          description: 'Elegant rulers of the underwater realm'
        },
        {
          name: 'Leviathan Guard',
          species: 'Gyarados / Leviamon / Yamata-no-Orochi',
          type: 'Water/Dragon',
          rarity: 'Extreme',
          description: 'Massive sea dragons that protect the city'
        },
        {
          name: 'Coral Architect',
          species: 'Corsola / Shellmon / Kappa',
          type: 'Water/Rock',
          rarity: 'Uncommon',
          description: 'Creatures that shape the living city structures'
        }
      ],
      resources: [
        {
          name: 'Divine Pearls',
          rarity: 'Extreme',
          description: 'Pearls blessed by the sea lord himself'
        },
        {
          name: 'Sea Crystal',
          rarity: 'Rare',
          description: 'Crystallized seawater with magical properties'
        },
        {
          name: 'Royal Kelp',
          rarity: 'Uncommon',
          description: 'Rare seaweed used in underwater construction'
        }
      ],
      lore: 'Atlantis City serves as the magnificent capital of the sea lord\'s underwater kingdom, where ancient oceanic power merged with divine will to create an eternal underwater paradise.',
      history: 'Built by ancient sea peoples with the sea lord\'s blessing and protection. The city has stood beneath the waves for over two millennia, growing more beautiful with each passing century.',
      dangers: [
        'Drowning risk without proper equipment',
        'Water pressure at depth',
        'Territorial sea guardians',
        'Court politics and intrigue',
        'Powerful underwater currents'
      ],
      tips: [
        'Master underwater breathing techniques',
        'Respect sea nobility and customs',
        'Bring diving gear as backup',
        'Learn basic mer-folk etiquette',
        'Navigate by bioluminescent markers'
      ]
    },
'nereid-harbor': {
      id: 'nereid-harbor',
      name: 'Nereid Harbor',
      regionId: 'poseidons-reach',
      regionName: 'Poseidon\'s Reach',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/nereid-harbor-detailed.png',
      description: 'Bustling underwater port where sea nymphs guide ships through treacherous waters, connecting the surface world with the depths of the ocean.',
      difficulty: 'Medium',
      elevation: '-50 ft to surface',
      temperature: '65°F to 75°F',
      weatherPatterns: 'Tidal changes, sea nymph magic',
      accessibility: 'Surface and underwater access available',
      recommendedLevel: '40+',
      specialFeatures: [
        'Dual-Level Harbor',
        'Nereid Guidance',
        'Ship Protection',
        'Underwater Docks',
        'Tidal Pools'
      ],
      wildlife: [
        {
          name: 'Harbor Nereid',
          species: 'Vaporeon / Neptunemon / Ningyo',
          type: 'Water/Fairy',
          rarity: 'Rare',
          description: 'Sea nymphs who guide ships safely to port'
        },
        {
          name: 'Dock Seal',
          species: 'Dewgong / Seadramon / Kappa',
          type: 'Water/Normal',
          rarity: 'Common',
          description: 'Friendly seals that help with harbor operations'
        },
        {
          name: 'Storm Petrel',
          species: 'Pelipper / Airdramon / Tengu',
          type: 'Water/Flying',
          rarity: 'Uncommon',
          description: 'Seabirds that predict weather changes'
        }
      ],
      resources: [
        {
          name: 'Navigation Crystals',
          rarity: 'Rare',
          description: 'Crystals that always point toward safe harbor'
        },
        {
          name: 'Nereid Tears',
          rarity: 'Rare',
          description: 'Magical tears that calm stormy seas'
        },
        {
          name: 'Harbor Supplies',
          rarity: 'Common',
          description: 'Essential goods for sea voyages'
        }
      ],
      lore: 'Nereid Harbor has been blessed by the fifty sea nymphs, daughters of the ancient sea guardian, who have sworn to protect all who seek safe passage through the sea lord\'s domain.',
      history: 'Established centuries ago when the first nereids took pity on drowning sailors. The harbor has since become a sanctuary for all sea travelers.',
      dangers: [
        'Sudden tidal changes',
        'Pirates in nearby waters',
        'Merfolk territorial disputes',
        'Unpredictable weather',
        'Deep water zones'
      ],
      tips: [
        'Always check with harbor nereids before departing',
        'Carry offerings for the sea nymphs',
        'Monitor tidal schedules',
        'Respect both surface and underwater protocols',
        'Keep emergency flotation devices ready'
      ]
    },
'amphitrite-town': {
      id: 'amphitrite-town',
      name: 'Amphitrite Town',
      regionId: 'poseidons-reach',
      regionName: 'Poseidon\'s Reach',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/amphitrite-town-detailed.png',
      description: 'Elegant coastal town dedicated to the sea lord\'s consort, where sea priestesses maintain temples and perform rituals to ensure bountiful seas and peaceful waters.',
      difficulty: 'Medium',
      elevation: 'Sea level to 100 ft',
      temperature: '68°F to 78°F',
      weatherPatterns: 'Gentle sea breezes, blessed calm waters',
      accessibility: 'Pilgrims and worshippers welcome',
      recommendedLevel: '35+',
      specialFeatures: [
        'Queen\'s Temples',
        'Sea Priestesses',
        'Ritual Pools',
        'Sacred Gardens',
        'Marriage Ceremonies'
      ],
      wildlife: [
        {
          name: 'Temple Dolphin',
          species: 'Lanturn / Dolphmon / Ningyo',
          type: 'Water/Psychic',
          rarity: 'Rare',
          description: 'Sacred dolphins that serve in temple ceremonies'
        },
        {
          name: 'Blessing Starfish',
          species: 'Starmie / Starmon / Ningyo',
          type: 'Water/Fairy',
          rarity: 'Uncommon',
          description: 'Starfish that bless unions and partnerships'
        },
        {
          name: 'Sacred Seahorse',
          species: 'Seadra / Seadramon / Kappa',
          type: 'Water',
          rarity: 'Common',
          description: 'Gentle creatures that carry temple messages'
        }
      ],
      resources: [
        {
          name: 'Wedding Pearls',
          rarity: 'Rare',
          description: 'Perfect pearls used in marriage ceremonies'
        },
        {
          name: 'Sacred Salt',
          rarity: 'Uncommon',
          description: 'Salt blessed by Amphitrite\'s priestesses'
        },
        {
          name: 'Ocean Flowers',
          rarity: 'Common',
          description: 'Beautiful sea anemones used in decorations'
        }
      ],
      lore: 'Amphitrite Town honors the Queen of the Seas, the sea lord\'s beloved consort. The town is famous for its wedding ceremonies, which are said to be blessed by the sea lady herself.',
      history: 'Founded by priestesses devoted to the sea lady, the town has become a pilgrimage site for those seeking the sea lady\'s blessing on their relationships and marriages.',
      dangers: [
        'Romantic entanglements and drama',
        'Strict religious protocols',
        'Jealous sea spirits',
        'Emotional intensity of ceremonies'
      ],
      tips: [
        'Respect temple traditions and ceremonies',
        'Bring appropriate offerings to the sea lady',
        'Dress modestly when visiting temples',
        'Participate respectfully in rituals',
        'Seek blessing for important relationships'
      ]
    },
'trident-temple': {
      id: 'trident-temple',
      name: 'Trident Temple',
      regionId: 'poseidons-reach',
      regionName: 'Poseidon\'s Reach',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/trident-temple-detailed.png',
      description: 'Massive temple complex built around the sea lord\'s sacred trident, where the lord\'s power is strongest and earthquakes can be felt through both land and sea.',
      difficulty: 'Hard',
      elevation: '50 ft',
      temperature: '60°F to 75°F',
      weatherPatterns: 'Powerful divine energy, earth tremors',
      accessibility: 'Extreme spiritual site, divine trials required',
      recommendedLevel: '70+',
      specialFeatures: [
        'Sacred Trident Shrine',
        'Divine Power Focus',
        'Earthquake Chambers',
        'Ocean Control',
        'Divine Trials'
      ],
      wildlife: [
        {
          name: 'Trident Guardian',
          species: 'Dialga / Magnamon / Raiju',
          type: 'Water/Steel',
          rarity: 'Extreme',
          description: 'Divine beings that protect the sea lord\'s weapon'
        },
        {
          name: 'Earthquake Spirit',
          species: 'Groudon / Machinedramon / Jishin-no-Kami',
          type: 'Ground/Psychic',
          rarity: 'Rare',
          description: 'Spirits that emerge during divine tremors'
        },
        {
          name: 'Ocean Wraith',
          species: 'Jellicent / Phantomon / Mizuchi',
          type: 'Water/Ghost',
          rarity: 'Rare',
          description: 'Spirits of those lost at sea who serve the temple'
        }
      ],
      resources: [
        {
          name: 'Divine Trident Shard',
          rarity: 'Extreme',
          description: 'Fragment containing a portion of the sea lord\'s power'
        },
        {
          name: 'Earthquake Stone',
          rarity: 'Rare',
          description: 'Stone that trembles with divine power'
        },
        {
          name: 'Sacred Coral',
          rarity: 'Uncommon',
          description: 'Coral grown in the presence of divine energy'
        }
      ],
      lore: 'The Trident Temple houses the most sacred artifact of the sea lord - his divine trident. The weapon\'s power is so great that it causes constant tremors in both earth and sea.',
      history: 'Built to contain and honor the sea lord\'s trident after it was temporarily left on earth. The temple has become the center of all oceanic divine power.',
      dangers: [
        'Divine earthquakes and tremors',
        'Overwhelming divine presence',
        'Trials of worthiness',
        'Tsunami risks',
        'Divine judgment'
      ],
      tips: [
        'Undergo purification before entering',
        'Bring earthquake protection',
        'Prove your worth to the sea lord',
        'Respect the immense divine power',
        'Prepare for spiritual transformation'
      ]
    },
'maelstrom-point': {
      id: 'maelstrom-point',
      name: 'Maelstrom Point',
      regionId: 'poseidons-reach',
      regionName: 'Poseidon\'s Reach',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/maelstrom-point-detailed.png',
      description: 'Treacherous cape where massive whirlpools form constantly, creating a natural barrier and testing ground where only the most skilled navigators dare to venture.',
      difficulty: 'Extreme',
      elevation: '200 ft',
      temperature: '55°F to 70°F',
      weatherPatterns: 'Constant whirlpools, dangerous currents, storm generation',
      accessibility: 'Expert navigators only, extreme maritime danger',
      recommendedLevel: '80+',
      specialFeatures: [
        'Massive Whirlpools',
        'Navigation Trials',
        'Storm Generation',
        'Current Mastery',
        'Lighthouse Beacon'
      ],
      wildlife: [
        {
          name: 'Maelstrom Kraken',
          species: 'Tentacruel / Cthulhumon / Yamata-no-Orochi',
          type: 'Water/Dark',
          rarity: 'Extreme',
          description: 'Colossal sea beast that creates the whirlpools'
        },
        {
          name: 'Current Rider',
          species: 'Mantine / Airdramon / Tengu',
          type: 'Water/Flying',
          rarity: 'Rare',
          description: 'Creatures that surf the dangerous currents'
        },
        {
          name: 'Storm Gull',
          species: 'Zapdos / Piddomon / Raiju',
          type: 'Flying/Electric',
          rarity: 'Uncommon',
          description: 'Seabirds that thrive in chaotic weather'
        }
      ],
      resources: [
        {
          name: 'Whirlpool Essence',
          rarity: 'Extreme',
          description: 'Concentrated power of the eternal maelstrom'
        },
        {
          name: 'Current Maps',
          rarity: 'Rare',
          description: 'Navigation charts of the treacherous waters'
        },
        {
          name: 'Storm Glass',
          rarity: 'Uncommon',
          description: 'Crystal that predicts weather changes'
        }
      ],
      lore: 'Maelstrom Point is where Poseidon tests the courage and skill of mariners. Legend says the god himself created the eternal whirlpools to separate the worthy from the foolish.',
      history: 'The point has claimed countless ships throughout history, but also forged the greatest navigators. Those who master its waters are forever changed.',
      dangers: [
        'Massive deadly whirlpools',
        'Unpredictable currents',
        'Sudden storms',
        'Ship-destroying waves',
        'Complete navigation failure'
      ],
      tips: [
        'Master advanced navigation first',
        'Study current patterns extensively',
        'Bring emergency flotation',
        'Never attempt alone',
        'Consider hiring Extreme navigators'
      ]
    },
'wakinyan-city': {
      id: 'wakinyan-city',
      name: 'Wakinyan City',
      regionId: 'thunderbird-heights',
      regionName: 'Thunderbird Heights',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/wakinyan-city-detailed.png',
      description: 'Mountain city built high in the peaks where the great Thunderbird nests, with buildings designed to withstand constant lightning strikes and powerful winds.',
      difficulty: 'Hard',
      elevation: '8000 ft',
      temperature: '30°F to 60°F',
      weatherPatterns: 'Constant thunderstorms, powerful winds, frequent lightning',
      accessibility: 'Storm protection required, respect for Native traditions essential',
      recommendedLevel: '65+',
      specialFeatures: [
        'Thunderbird Nests',
        'Lightning Rods',
        'Wind Architecture',
        'Native Ceremonies',
        'Storm Watching'
      ],
      wildlife: [
        {
          name: 'Great Thunderbird',
          species: 'Zapdos / Phoenixmon / Raiju',
          type: 'Electric/Flying',
          rarity: 'Extreme',
          description: 'Massive Extreme bird that controls storms'
        },
        {
          name: 'Lightning Eagle',
          species: 'Braviary / Garudamon / Tengu',
          type: 'Electric/Flying',
          rarity: 'Rare',
          description: 'Majestic birds that ride lightning bolts'
        },
        {
          name: 'Storm Wolf',
          species: 'Manectric / Garurumon / Raiju',
          type: 'Electric/Normal',
          rarity: 'Uncommon',
          description: 'Wolves whose fur crackles with static electricity'
        }
      ],
      resources: [
        {
          name: 'Thunderbird Feathers',
          rarity: 'Extreme',
          description: 'Sacred feathers that channel lightning'
        },
        {
          name: 'Storm Stones',
          rarity: 'Rare',
          description: 'Rocks charged by constant lightning strikes'
        },
        {
          name: 'Wind Crystals',
          rarity: 'Uncommon',
          description: 'Crystals formed by powerful wind pressure'
        }
      ],
      lore: 'Wakinyan City honors the Thunderbird, the great spirit of storms in Native American tradition. The city exists in harmony with the powerful creature, learning from its mastery over lightning and wind.',
      history: 'Built by Native American tribes who received the Thunderbird\'s blessing to live in its domain. The city has stood for centuries, protected by the great spirit.',
      dangers: [
        'Constant lightning strikes',
        'Powerful wind gusts',
        'Altitude sickness',
        'Thunderbird territorial behavior',
        'Sacred site restrictions'
      ],
      tips: [
        'Wear lightning protection gear',
        'Respect Native American traditions',
        'Learn about Thunderbird legends',
        'Avoid disturbing nesting areas',
        'Bring wind-resistant equipment'
      ]
    },
'storm-dance-village': {
      id: 'storm-dance-village',
      name: 'Storm Dance Village',
      regionId: 'thunderbird-heights',
      regionName: 'Thunderbird Heights',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/storm-dance-village-detailed.png',
      description: 'Traditional Native American village where shamans perform sacred storm dances to communicate with the Thunderbird and ensure balance between earth and sky.',
      difficulty: 'Medium',
      elevation: '6500 ft',
      temperature: '40°F to 70°F',
      weatherPatterns: 'Ceremonial storms, rhythmic thunder, spiritual energy',
      accessibility: 'Cultural respect required, ceremony participants welcome',
      recommendedLevel: '45+',
      specialFeatures: [
        'Sacred Storm Dances',
        'Shamanic Rituals',
        'Thunder Drums',
        'Spirit Communication',
        'Traditional Ceremonies'
      ],
      wildlife: [
        {
          name: 'Spirit Eagle',
          species: 'Altaria / Angemon / Tengu',
          type: 'Flying/Psychic',
          rarity: 'Rare',
          description: 'Sacred eagles that participate in ceremonies'
        },
        {
          name: 'Thunder Elk',
          species: 'Sawsbuck / Monochromon / Raiju',
          type: 'Electric/Normal',
          rarity: 'Uncommon',
          description: 'Majestic elk whose antlers spark with electricity'
        },
        {
          name: 'Dance Bear',
          species: 'Ursaring / Grizzmon / Yamabiko',
          type: 'Normal/Fighting',
          rarity: 'Uncommon',
          description: 'Bears that join in the traditional ceremonies'
        }
      ],
      resources: [
        {
          name: 'Sacred Medicine',
          rarity: 'Rare',
          description: 'Traditional herbs used in shamanic healing'
        },
        {
          name: 'Thunder Drums',
          rarity: 'Rare',
          description: 'Drums that resonate with storm energy'
        },
        {
          name: 'Ceremonial Feathers',
          rarity: 'Uncommon',
          description: 'Feathers blessed in storm dances'
        }
      ],
      lore: 'Storm Dance Village preserves the ancient traditions of communicating with the Thunderbird through sacred dances that mirror the movement of storms and the flight of the great spirit.',
      history: 'Founded by shamans who first learned to speak with the Thunderbird. The village has maintained these sacred traditions for generations.',
      dangers: [
        'Powerful spiritual energy',
        'Ceremonial restrictions',
        'Weather changes during rituals',
        'Cultural misunderstandings'
      ],
      tips: [
        'Learn about Native American customs',
        'Participate respectfully in ceremonies',
        'Bring appropriate offerings',
        'Follow shamanic guidance',
        'Honor the sacred traditions'
      ]
    },
'thunder-mesa': {
      id: 'thunder-mesa',
      name: 'Thunder Mesa',
      regionId: 'thunderbird-heights',
      regionName: 'Thunderbird Heights',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/thunder-mesa-detailed.png',
      description: 'Flat-topped mountain where lightning strikes most frequently, creating a natural amphitheater where the sounds of thunder echo endlessly through carved stone chambers.',
      difficulty: 'Hard',
      elevation: '7500 ft',
      temperature: '25°F to 55°F',
      weatherPatterns: 'Frequent lightning, constant thunder echoes, electrical storms',
      accessibility: 'Extreme electrical hazard, expert mountaineering required',
      recommendedLevel: '60+',
      specialFeatures: [
        'Lightning Strike Zone',
        'Thunder Echoes',
        'Natural Amphitheater',
        'Stone Chambers',
        'Electric Phenomena'
      ],
      wildlife: [
        {
          name: 'Lightning Lizard',
          species: 'Heliolisk / Elecmon / Raiju',
          type: 'Electric/Rock',
          rarity: 'Rare',
          description: 'Reptiles that absorb lightning for energy'
        },
        {
          name: 'Echo Bat',
          species: 'Crobat / Devimon / Yamabiko',
          type: 'Sound/Flying',
          rarity: 'Uncommon',
          description: 'Bats that navigate using thunder echoes'
        },
        {
          name: 'Static Mouse',
          species: 'Pikachu / Pichimon / Raiju',
          type: 'Electric/Normal',
          rarity: 'Common',
          description: 'Small rodents with electrically charged fur'
        }
      ],
      resources: [
        {
          name: 'Lightning Rod Metal',
          rarity: 'Rare',
          description: 'Metal naturally formed by lightning strikes'
        },
        {
          name: 'Thunder Stones',
          rarity: 'Uncommon',
          description: 'Rocks that resonate with sound energy'
        },
        {
          name: 'Electric Crystals',
          rarity: 'Common',
          description: 'Crystals that store electrical energy'
        }
      ],
      lore: 'Thunder Mesa is where the Thunderbird\'s voice is loudest, creating eternal echoes that some say contain messages from the spirit world.',
      history: 'The mesa has been shaped by millions of lightning strikes over millennia, creating natural stone formations that amplify sound.',
      dangers: [
        'Extreme lightning danger',
        'Deafening thunder sounds',
        'Electrical burns',
        'Rock slides from thunder',
        'Disorientation from echoes'
      ],
      tips: [
        'Wear full electrical protection',
        'Bring hearing protection',
        'Avoid metal objects',
        'Study lightning patterns',
        'Have emergency evacuation plans'
      ]
    },
'great-nest': {
      id: 'great-nest',
      name: 'The Great Nest',
      regionId: 'thunderbird-heights',
      regionName: 'Thunderbird Heights',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/great-nest-detailed.png',
      description: 'Massive nest of the Extreme Thunderbird, built from trees struck by lightning and reinforced with metals formed by electrical storms, visible from miles away.',
      difficulty: 'Extreme',
      elevation: '9000 ft',
      temperature: '20°F to 50°F',
      weatherPatterns: 'Intense electrical activity, protective storm barriers',
      accessibility: 'Sacred site - extreme danger, divine permission required',
      recommendedLevel: '85+',
      specialFeatures: [
        'Thunderbird\'s Nest',
        'Lightning-Struck Trees',
        'Storm Metal Architecture',
        'Sacred Territory',
        'Divine Protection'
      ],
      wildlife: [
        {
          name: 'Thunderbird Alpha',
          species: 'Zapdos / Phoenixmon / Raiju',
          type: 'Electric/Flying',
          rarity: 'Extreme',
          description: 'The Great Thunderbird, master of all storms'
        },
        {
          name: 'Nest Guardian',
          species: 'Magnezone / Andromon / Raiju',
          type: 'Electric/Steel',
          rarity: 'Rare',
          description: 'Protective spirits of the sacred nest'
        },
        {
          name: 'Lightning Sprite',
          species: 'Rotom / Pixiemon / Raiju',
          type: 'Electric/Fairy',
          rarity: 'Uncommon',
          description: 'Tiny spirits that tend to the nest'
        }
      ],
      resources: [
        {
          name: 'Sacred Lightning Wood',
          rarity: 'Extreme',
          description: 'Wood from trees blessed by the Thunderbird'
        },
        {
          name: 'Storm Forged Metal',
          rarity: 'Extreme',
          description: 'Metal created by divine lightning'
        },
        {
          name: 'Divine Egg Fragments',
          rarity: 'Extreme',
          description: 'Pieces of the Thunderbird\'s sacred eggs'
        }
      ],
      lore: 'The Great Nest is the home of the Extreme Thunderbird, the most sacred site in all of Thunderbird Heights. Only those deemed worthy by the great spirit may approach.',
      history: 'Built by the Thunderbird itself over countless centuries, the nest represents the pinnacle of storm mastery and divine power.',
      dangers: [
        'Direct confrontation with Thunderbird',
        'Divine lightning strikes',
        'Protective storm barriers',
        'Sacred site violations',
        'Overwhelming divine presence'
      ],
      tips: [
        'Seek permission from tribal elders first',
        'Undergo extensive purification',
        'Approach with utmost respect',
        'Bring sacred offerings',
        'Be prepared for spiritual trials'
      ]
    },
'lightning-spire': {
      id: 'lightning-spire',
      name: 'Lightning Spire',
      regionId: 'thunderbird-heights',
      regionName: 'Thunderbird Heights',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/lightning-spire-detailed.png',
      description: 'Towering natural rock spire that acts as a massive lightning rod, constantly channeling electrical energy and creating spectacular light shows during storms.',
      difficulty: 'Extreme',
      elevation: '8500 ft',
      temperature: '15°F to 45°F',
      weatherPatterns: 'Constant electrical activity, lightning attraction, aurora effects',
      accessibility: 'Extreme electrical hazard, research permits required',
      recommendedLevel: '75+',
      specialFeatures: [
        'Natural Lightning Rod',
        'Electrical Channeling',
        'Aurora Effects',
        'Storm Attraction',
        'Research Station'
      ],
      wildlife: [
        {
          name: 'Spire Dragon',
          species: 'Rayquaza / Imperialdramon / Raiju',
          type: 'Electric/Dragon',
          rarity: 'Extreme',
          description: 'Ancient dragon that feeds on lightning energy'
        },
        {
          name: 'Aurora Beast',
          species: 'Alakazam / Wisemon / Raiju',
          type: 'Electric/Psychic',
          rarity: 'Rare',
          description: 'Creatures that manifest during electrical displays'
        },
        {
          name: 'Voltage Falcon',
          species: 'Talonflame / Piddomon / Tengu',
          type: 'Electric/Flying',
          rarity: 'Uncommon',
          description: 'Birds that nest in the electrical field'
        }
      ],
      resources: [
        {
          name: 'Pure Lightning Energy',
          rarity: 'Extreme',
          description: 'Concentrated electrical power in crystalline form'
        },
        {
          name: 'Aurora Crystals',
          rarity: 'Rare',
          description: 'Crystals that emit beautiful colored light'
        },
        {
          name: 'Lightning Glass',
          rarity: 'Uncommon',
          description: 'Glass formed by lightning striking sand'
        }
      ],
      lore: 'Lightning Spire is believed to be the Thunderbird\'s perch, where the great spirit comes to rest and survey its storm domain. The spire channels divine electrical power.',
      history: 'The spire has attracted lightning for millennia, slowly transforming into a natural conductor that bridges earth and sky with pure electrical energy.',
      dangers: [
        'Constant lightning strikes',
        'Overwhelming electrical fields',
        'Aurora-induced disorientation',
        'Equipment failure',
        'Electrical burns and shock'
      ],
      tips: [
        'Use only non-conductive equipment',
        'Wear full electrical insulation',
        'Monitor electrical activity constantly',
        'Have emergency medical support',
        'Study electrical safety protocols'
      ]
    },
'pirate-port': {
      id: 'pirate-port',
      name: 'Pirate Port',
      regionId: 'pirates-bay',
      regionName: 'Pirates\' Bay',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/pirate-port-detailed.png',
      description: 'The bustling port of the pirate lords, where ships laden with treasure dock and crews carouse. A lawless harbor filled with danger, treasure, and adventure at every turn.',
      difficulty: 'Hard',
      elevation: '0 ft - Sea Level',
      temperature: '75°F to 85°F',
      weatherPatterns: 'Tropical storms, sea winds, occasional hurricanes',
      accessibility: 'Open to all brave enough to navigate pirate politics',
      recommendedLevel: '60+',
      specialFeatures: [
        'Treasure Ships',
        'Pirate Taverns',
        'Black Market',
        'Carousing Crews',
        'Dangerous Waters',
        'Docking Fees (in Blood or Gold)'
      ],
      wildlife: [
        {
          name: 'Sea Raider',
          species: 'Gyarados / Seadramon / Surfent',
          type: 'Water/Dark',
          rarity: 'Uncommon',
          description: 'Fierce sea monsters trained by pirates for naval combat and treasure hunting'
        },
        {
          name: 'Parrot Lookout',
          species: 'Chatot / Nitocris',
          type: 'Flying/Normal',
          rarity: 'Common',
          description: 'Intelligent birds that serve as scouts and messengers for pirate crews'
        },
        {
          name: 'Port Shark',
          species: 'Sharpedo / Jormuntide / Robinquill',
          type: 'Water/Dark',
          rarity: 'Rare',
          description: 'Aggressive predators that patrol the harbor waters for scraps and enemies'
        },
        {
          name: 'Rum Runner',
          species: 'Sableye / Impmon',
          type: 'Dark/Ghost',
          rarity: 'Uncommon',
          description: 'Mischievous spirits that smuggle contraband and play pranks on sailors'
        }
      ],
      resources: [
        {
          name: 'Pirate Treasure',
          rarity: 'Rare',
          description: 'Gold coins, precious gems, and exotic artifacts from distant lands'
        },
        {
          name: 'Smuggled Goods',
          rarity: 'Uncommon',
          description: 'Rare items and contraband from across the seven seas'
        },
        {
          name: 'Sea Charts',
          rarity: 'Rare',
          description: 'Maps to hidden islands, treasure locations, and secret passages'
        },
        {
          name: 'Ship Supplies',
          rarity: 'Common',
          description: 'Ropes, sails, cannons, and other maritime equipment'
        }
      ],
      lore: 'Pirate Port serves as the unofficial capital of the pirate world, where the most notorious captains gather to trade stories, plan raids, and divide their plunder. The port operates under the ancient Pirate Code, where strength and cunning determine authority.',
      history: 'Founded over 300 years ago by the legendary Captain Blackwater, the port has grown from a hidden cove into a sprawling maritime city. It has survived countless naval battles and remains unconquered.',
      dangers: [
        'Violent pirate crews',
        'Unpredictable weather',
        'Corrupt port authorities',
        'Sea monster attacks',
        'Rival crew conflicts',
        'Cursed treasure'
      ],
      tips: [
        'Respect the Pirate Code',
        'Never sail alone in these waters',
        'Keep your weapons visible but peaceful',
        'Pay your docking fees promptly',
        'Watch your back in taverns',
        'Don\'t trust anyone completely'
      ]
    },
'pirate-village': {
      id: 'pirate-village',
      name: 'Pirate Village',
      regionId: 'pirates-bay',
      regionName: 'Pirates\' Bay',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/pirate-village-detailed.png',
      description: 'The shantytown of the pirate crews, where danger lurks around every corner and treasures are buried in the sand. A rough settlement where retired pirates and their families make their home.',
      difficulty: 'Hard',
      elevation: '10 ft - 50 ft',
      temperature: '75°F to 85°F',
      weatherPatterns: 'Tropical climate, afternoon thunderstorms, sea breezes',
      accessibility: 'Dangerous for outsiders, safer for those with pirate connections',
      recommendedLevel: '58+',
      specialFeatures: [
        'Shantytown Architecture',
        'Buried Treasure Sites',
        'Pirate Culture Hub',
        'Underground Tunnels',
        'Fighting Pits',
        'Hidden Caches'
      ],
      wildlife: [
        {
          name: 'Treasure Hound',
          species: 'Mightyena / Direhowl / Kitsun',
          type: 'Dark/Ground',
          rarity: 'Uncommon',
          description: 'Loyal canines trained to sniff out buried treasure and guard pirate homes'
        },
        {
          name: 'Scurvy Cat',
          species: 'Meowth / Chillet',
          type: 'Normal/Dark',
          rarity: 'Common',
          description: 'Streetwise felines that prowl the village alleys hunting for scraps and secrets'
        },
        {
          name: 'Tavern Brawler',
          species: 'Machamp / Greymon / Anubis',
          type: 'Fighting/Dark',
          rarity: 'Rare',
          description: 'Tough enforcers who keep order in the village through intimidation and strength'
        }
      ],
      resources: [
        {
          name: 'Buried Treasure Maps',
          rarity: 'Rare',
          description: 'Hand-drawn maps leading to hidden treasure caches around the island'
        },
        {
          name: 'Pirate Artifacts',
          rarity: 'Uncommon',
          description: 'Old weapons, jewelry, and keepsakes with mysterious histories'
        },
        {
          name: 'Rope and Nets',
          rarity: 'Common',
          description: 'Sturdy marine equipment crafted by experienced sailors'
        }
      ],
      lore: 'Pirate Village grew organically around the port as a place where pirate families could settle when not at sea. The village maintains its own rough justice system and has never been fully conquered by any outside force.',
      history: 'What started as temporary shelters for pirate families evolved into a permanent settlement. The village has weathered storms, raids, and sieges while maintaining its fierce independence.',
      dangers: [
        'Gang territorial disputes',
        'Buried treasure traps',
        'Unstable shanty structures',
        'Wild animals in tunnels',
        'Revenge seekers',
        'Quicksand pits'
      ],
      tips: [
        'Learn the local gang territories',
        'Carry small valuables for bribes',
        'Avoid walking alone at night',
        'Respect the elderly pirates',
        'Don\'t dig randomly for treasure',
        'Know the escape routes'
      ]
    },
'hidden-cove': {
      id: 'hidden-cove',
      name: 'Hidden Cove',
      regionId: 'pirates-bay',
      regionName: 'Pirates\' Bay',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/hidden-cove-detailed.png',
      description: 'A secluded cove where the most ruthless pirates in the world make their lair. Protected by treacherous rocks and hidden passages, this cove serves as a secret base for the most dangerous crews.',
      difficulty: 'Extreme',
      elevation: '0 ft - 100 ft',
      temperature: '70°F to 80°F',
      weatherPatterns: 'Foggy mornings, hidden from outside weather by rock formations',
      accessibility: 'Nearly impossible to find without inside knowledge',
      recommendedLevel: '70+',
      specialFeatures: [
        'Secret Entrances',
        'Hidden Lair Complex',
        'Ruthless Pirates',
        'Treasure Vaults',
        'Natural Fortifications',
        'Underground Waterways'
      ],
      wildlife: [
        {
          name: 'Cove Guardian',
          species: 'Gyarados / Jormuntide',
          type: 'Water/Dragon',
          rarity: 'Extreme',
          description: 'Ancient sea dragon that protects the cove\'s secrets and judges who may enter'
        },
        {
          name: 'Shadow Parrot',
          species: 'Murkrow / Cawgnito / Shadowbeak',
          type: 'Dark/Flying',
          rarity: 'Rare',
          description: 'Intelligent birds that serve as spies and messengers for the cove\'s inhabitants'
        },
        {
          name: 'Reef Stalker',
          species: 'Crobat / Lunaris',
          type: 'Poison/Flying',
          rarity: 'Uncommon',
          description: 'Nocturnal predators that hunt in the cove\'s dark caverns and hidden passages'
        }
      ],
      resources: [
        {
          name: 'Ancient Treasure Hoard',
          rarity: 'Extreme',
          description: 'Legendary treasure accumulated over centuries by the most successful pirates'
        },
        {
          name: 'Pirate King\'s Artifacts',
          rarity: 'Extreme',
          description: 'Personal effects and weapons of legendary pirate captains'
        },
        {
          name: 'Secret Charts',
          rarity: 'Rare',
          description: 'Maps to the most guarded treasure locations across all oceans'
        }
      ],
      lore: 'Hidden Cove is whispered about in pirate legends as the ultimate sanctuary for those who have nowhere else to turn. Only the most notorious and powerful pirates know its location and can gain entry.',
      history: 'The cove has been used as a pirate hideout for over 500 years, with each generation of pirates adding to its defenses and treasure hoards. Many have tried to find it, but few return.',
      dangers: [
        'Extremely hostile inhabitants',
        'Deadly entrance trials',
        'Cursed treasure guardians',
        'Unstable cavern systems',
        'Poisonous creatures',
        'Ancient pirate traps'
      ],
      tips: [
        'Only attempt entry with pirate sponsorship',
        'Bring offerings for the Cove Guardian',
        'Never reveal the location to outsiders',
        'Prove your worth through pirate deeds',
        'Respect the ancient pirate traditions',
        'Prepare for life-or-death challenges'
      ]
    },
'nyakuza-landing': {
      id: 'nyakuza-landing',
      name: 'Nyakuza Landing',
      regionId: 'pirates-bay',
      regionName: 'Pirates\' Bay',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/nyakuza-landing-detailed.png',
      description: 'The landing site of the Nyakuza pirate clan, where the most feared pirates in the world make their home. This fortified beach serves as both landing zone and fortress for the infamous cat-themed pirate organization.',
      difficulty: 'Hard',
      elevation: '0 ft - 30 ft',
      temperature: '75°F to 85°F',
      weatherPatterns: 'Controlled by Nyakuza weather manipulation technology',
      accessibility: 'Highly restricted, requires Nyakuza permission or extreme stealth',
      recommendedLevel: '65+',
      specialFeatures: [
        'Nyakuza Fortress',
        'Advanced Landing Systems',
        'Cat-themed Architecture',
        'High-Tech Security',
        'Underground Networks',
        'Feared Pirates\' Base'
      ],
      wildlife: [
        {
          name: 'Nyakuza Enforcer',
          species: 'Persian / Cattiva / Shadowbeak',
          type: 'Dark/Fighting',
          rarity: 'Rare',
          description: 'Elite feline warriors trained in advanced combat techniques and stealth operations'
        },
        {
          name: 'Tech Cat',
          species: 'Mewtwo / Grizzbolt',
          type: 'Psychic/Steel',
          rarity: 'Extreme',
          description: 'Highly intelligent cybernetic felines that manage the clan\'s advanced technology'
        },
        {
          name: 'Shadow Lynx',
          species: 'Linoone / Felbat / Kitsun',
          type: 'Dark/Psychic',
          rarity: 'Uncommon',
          description: 'Stealthy reconnaissance specialists that gather intelligence for the Nyakuza clan'
        }
      ],
      resources: [
        {
          name: 'Nyakuza Technology',
          rarity: 'Extreme',
          description: 'Advanced gadgets and weapons developed by the most innovative pirate clan'
        },
        {
          name: 'Clan Artifacts',
          rarity: 'Rare',
          description: 'Sacred items and trophies representing the Nyakuza\'s greatest victories'
        },
        {
          name: 'Intelligence Reports',
          rarity: 'Rare',
          description: 'Detailed information about targets, rivals, and opportunities across the seas'
        }
      ],
      lore: 'Nyakuza Landing represents the pinnacle of pirate evolution, where traditional piracy meets cutting-edge technology. The Nyakuza clan has revolutionized maritime crime through superior organization and innovation.',
      history: 'Established 150 years ago by the legendary Captain Whiskers, the Nyakuza clan has grown from a small crew of cat-loving pirates into the most powerful and feared pirate organization in the world.',
      dangers: [
        'High-tech security systems',
        'Elite Nyakuza warriors',
        'Automated defense turrets',
        'Advanced surveillance network',
        'Psychological warfare tactics',
        'Clan retribution protocols'
      ],
      tips: [
        'Never underestimate Nyakuza technology',
        'Respect feline sensibilities and customs',
        'Avoid direct confrontation at all costs',
        'Consider diplomatic approaches',
        'Understand their honor code',
        'Prepare for unconventional tactics'
      ]
    },
'skull-rock': {
      id: 'skull-rock',
      name: 'Skull Rock',
      regionId: 'pirates-bay',
      regionName: 'Pirates\' Bay',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/skull-rock-detailed.png',
      description: 'A treacherous rock formation that serves as a pirate trap, where many a ship has met its end. The skull-shaped rock formation is both a natural landmark and a deadly maze of hidden reefs.',
      difficulty: 'Extreme',
      elevation: '0 ft - 200 ft',
      temperature: '70°F to 80°F',
      weatherPatterns: 'Unpredictable winds, dangerous currents, fog banks',
      accessibility: 'Extremely dangerous maritime navigation required',
      recommendedLevel: '75+',
      specialFeatures: [
        'Skull-Shaped Formation',
        'Pirate Trap System',
        'Hidden Reefs',
        'Shipwreck Graveyard',
        'Treacherous Waters',
        'Ancient Pirate Execution Site'
      ],
      wildlife: [
        {
          name: 'Ghost Ship',
          species: 'Drifblim / Maraith',
          type: 'Ghost/Water',
          rarity: 'Extreme',
          description: 'Spectral vessels that rise from the depths to claim new victims for their cursed crews'
        },
        {
          name: 'Skeleton Crew',
          species: 'Marowak / Tombat / Bushi',
          type: 'Ghost/Ground',
          rarity: 'Rare',
          description: 'Undead pirates who guard the rock and lure ships to their doom'
        },
        {
          name: 'Reef Wraith',
          species: 'Jellicent / Relaxaurus',
          type: 'Water/Ghost',
          rarity: 'Uncommon',
          description: 'Malevolent spirits of drowned sailors that inhabit the coral formations'
        },
        {
          name: 'Doom Gull',
          species: 'Pelipper / Nitocris / Galeclaw',
          type: 'Flying/Dark',
          rarity: 'Common',
          description: 'Ominous seabirds whose cries herald approaching storms and disasters'
        }
      ],
      resources: [
        {
          name: 'Sunken Treasure',
          rarity: 'Extreme',
          description: 'Valuable cargo from hundreds of wrecked ships over the centuries'
        },
        {
          name: 'Cursed Artifacts',
          rarity: 'Rare',
          description: 'Dangerous magical items that carry the weight of pirate curses and vengeance'
        },
        {
          name: 'Nautical Relics',
          rarity: 'Uncommon',
          description: 'Ancient navigation instruments and ship components from legendary vessels'
        },
        {
          name: 'Ghost Pearls',
          rarity: 'Rare',
          description: 'Ethereal pearls formed by the tears of drowned sailors, said to grant visions of the past'
        }
      ],
      lore: 'Skull Rock has claimed more ships than any other natural formation in the known world. Pirates use its treacherous waters as an execution ground and a test of navigational skill, believing that those who can survive its waters are truly worthy of the pirate life.',
      history: 'For over 800 years, Skull Rock has been both feared and revered by pirates. Countless execution ceremonies, treasure hunts, and initiation rites have taken place in its shadow, adding to its supernatural reputation.',
      dangers: [
        'Hidden reefs that destroy hulls',
        'Supernatural phenomena',
        'Cursed treasure guardians',
        'Unpredictable weather patterns',
        'Ghost ship encounters',
        'Psychological terror effects',
        'Magnetic anomalies affecting navigation'
      ],
      tips: [
        'Only attempt passage during perfect weather',
        'Bring experienced supernatural protection',
        'Study historical wreck patterns',
        'Never dive alone for treasure',
        'Respect the spirits of the drowned',
        'Consider the rock cursed and act accordingly',
        'Have multiple escape routes planned'
      ]
    },
'eleusis-city': {
      id: 'eleusis-city',
      name: 'Eleusis City',
      regionId: 'demeters-grove',
      regionName: 'Demeter\'s Grove',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/eleusis-city-detailed.png',
      description: 'Sacred city dedicated to the Eleusinian Mysteries, where initiates learn the secrets of life, death, and rebirth through Demeter\'s ancient wisdom and agricultural magic.',
      difficulty: 'Hard',
      elevation: '800 ft',
      temperature: '55°F to 75°F',
      weatherPatterns: 'Perfect growing conditions, mystical seasonal changes',
      accessibility: 'Spiritual initiates and agricultural pilgrims welcome',
      recommendedLevel: '60+',
      specialFeatures: [
        'Eleusinian Mystery Schools',
        'Sacred Initiations',
        'Goddess Temples',
        'Agricultural Centers',
        'Seasonal Ceremonies'
      ],
      wildlife: [
        {
          name: 'Mystery Guardian',
          species: 'Alakazam / Angewomon / Lycanroc',
          type: 'Psychic/Grass',
          rarity: 'Extreme',
          description: 'Ancient beings that protect the sacred mysteries'
        },
        {
          name: 'Harvest Spirit',
          species: 'Trevenant / Palmon / Whisp',
          type: 'Grass/Ghost',
          rarity: 'Rare',
          description: 'Spirits that ensure bountiful harvests'
        },
        {
          name: 'Sacred Owl',
          species: 'Noctowl / Hoothoot',
          type: 'Normal/Psychic',
          rarity: 'Uncommon',
          description: 'Wise owls that observe the mystery ceremonies'
        }
      ],
      resources: [
        {
          name: 'Sacred Grain',
          rarity: 'Extreme',
          description: 'Mystical wheat blessed by Demeter herself'
        },
        {
          name: 'Mystery Scrolls',
          rarity: 'Rare',
          description: 'Ancient texts containing agricultural and spiritual wisdom'
        },
        {
          name: 'Initiation Stones',
          rarity: 'Uncommon',
          description: 'Stones used in sacred initiation ceremonies'
        }
      ],
      lore: 'Eleusis City is the center of the ancient Eleusinian Mysteries, where Demeter taught humanity the secrets of agriculture and the cycle of life and death through her daughter Persephone\'s story.',
      history: 'Founded over two millennia ago as a center for the mystery religions, the city has preserved the most sacred agricultural and spiritual knowledge of the ancient world.',
      dangers: [
        'Intense spiritual trials',
        'Mystery cult restrictions',
        'Overwhelming divine presence',
        'Initiation challenges',
        'Sacred site violations'
      ],
      tips: [
        'Undergo proper spiritual preparation',
        'Respect the sacred mysteries',
        'Study agricultural traditions',
        'Bring offerings of grain and flowers',
        'Seek guidance from mystery priests'
      ]
    },
'persephone-village': {
      id: 'persephone-village',
      name: 'Persephone Village',
      regionId: 'demeters-grove',
      regionName: 'Demeter\'s Grove',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/persephone-village-detailed.png',
      description: 'Village that changes with the seasons, blooming magnificently in spring and summer when Persephone returns, then becoming somber during her underworld months.',
      difficulty: 'Medium',
      elevation: '600 ft',
      temperature: '45°F to 80°F (varies by season)',
      weatherPatterns: 'Dramatic seasonal changes, spring blooms, winter dormancy',
      accessibility: 'Seasonal visitors welcome, spring celebrations',
      recommendedLevel: '40+',
      specialFeatures: [
        'Seasonal Transformations',
        'Spring Festivals',
        'Underworld Connections',
        'Flower Gardens',
        'Mourning Rituals'
      ],
      wildlife: [
        {
          name: 'Season Fairy',
          species: 'Florges / Lillymon / Petallia',
          type: 'Fairy/Grass',
          rarity: 'Rare',
          description: 'Fairies that change appearance with the seasons'
        },
        {
          name: 'Pomegranate Bird',
          species: 'Chatot / Biyomon / Fenglope',
          type: 'Grass/Flying',
          rarity: 'Uncommon',
          description: 'Birds that carry messages between worlds'
        },
        {
          name: 'Bloom Butterfly',
          species: 'Butterfree / Butterflamon',
          type: 'Bug/Grass',
          rarity: 'Common',
          description: 'Butterflies that herald the arrival of spring'
        }
      ],
      resources: [
        {
          name: 'Persephone\'s Tears',
          rarity: 'Rare',
          description: 'Magical tears that can heal or bring sorrow'
        },
        {
          name: 'Seasonal Flowers',
          rarity: 'Common',
          description: 'Flowers that bloom regardless of normal season'
        },
        {
          name: 'Pomegranate Seeds',
          rarity: 'Uncommon',
          description: 'Seeds that connect the upper and lower worlds'
        }
      ],
      lore: 'Persephone Village embodies the eternal cycle of the seasons, representing the Greek myth of Persephone\'s journey between the world of the living and the underworld.',
      history: 'The village was founded by worshippers of Persephone who wanted to live in harmony with the seasonal cycle and honor both life and death.',
      dangers: [
        'Seasonal depression during winter months',
        'Underworld portal fluctuations',
        'Emotional intensity of ceremonies',
        'Grief overwhelming visitors'
      ],
      tips: [
        'Visit during spring for the best experience',
        'Respect both joyful and sorrowful ceremonies',
        'Bring flowers as offerings',
        'Learn about the Persephone myth',
        'Embrace the seasonal changes'
      ]
    },
'ceres-town': {
      id: 'ceres-town',
      name: 'Ceres Town',
      regionId: 'demeters-grove',
      regionName: 'Demeter\'s Grove',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/ceres-town-detailed.png',
      description: 'Prosperous agricultural town where the Roman goddess Ceres is honored, featuring the most advanced farming techniques and abundant harvests year-round.',
      difficulty: 'Easy',
      elevation: '400 ft',
      temperature: '60°F to 85°F',
      weatherPatterns: 'Perfect growing weather, gentle rains, abundant sunshine',
      accessibility: 'Farmers and agricultural enthusiasts welcome',
      recommendedLevel: '25+',
      specialFeatures: [
        'Advanced Agriculture',
        'Harvest Festivals',
        'Grain Markets',
        'Agricultural Schools',
        'Abundance Rituals'
      ],
      wildlife: [
        {
          name: 'Farm Guardian',
          species: 'Ampharos / Patamon / Mammorest',
          type: 'Normal/Grass',
          rarity: 'Common',
          description: 'Loyal creatures that protect crops and livestock'
        },
        {
          name: 'Harvest Mouse',
          species: 'Rattata / Viximon',
          type: 'Normal',
          rarity: 'Common',
          description: 'Industrious mice that help with grain collection'
        },
        {
          name: 'Abundance Bird',
          species: 'Pidgey / Biyomon / Chicopi',
          type: 'Normal/Flying',
          rarity: 'Uncommon',
          description: 'Birds that signal good harvests'
        }
      ],
      resources: [
        {
          name: 'Golden Wheat',
          rarity: 'Rare',
          description: 'Premium wheat with exceptional nutritional value'
        },
        {
          name: 'Harvest Tools',
          rarity: 'Common',
          description: 'Advanced farming implements and tools'
        },
        {
          name: 'Blessed Seeds',
          rarity: 'Uncommon',
          description: 'Seeds guaranteed to produce excellent crops'
        }
      ],
      lore: 'Ceres Town represents the practical side of agriculture, focusing on abundance, prosperity, and the Roman approach to farming and grain distribution.',
      history: 'Founded by Roman settlers who brought advanced agricultural techniques and established the town as a center for grain trade and farming innovation.',
      dangers: [
        'Market competition',
        'Crop diseases',
        'Weather dependency',
        'Economic fluctuations'
      ],
      tips: [
        'Learn about advanced farming techniques',
        'Participate in harvest festivals',
        'Trade in the grain markets',
        'Study agricultural innovations',
        'Respect the goddess Ceres'
      ]
    },
'mystery-temple': {
      id: 'mystery-temple',
      name: 'Mystery Temple',
      regionId: 'demeters-grove',
      regionName: 'Demeter\'s Grove',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/mystery-temple-detailed.png',
      description: 'Ancient temple complex where the deepest mysteries of life, death, and rebirth are revealed to worthy initiates through sacred ceremonies and divine visions.',
      difficulty: 'Extreme',
      elevation: '1000 ft',
      temperature: '50°F to 70°F',
      weatherPatterns: 'Mystical energy fluctuations, otherworldly phenomena',
      accessibility: 'Initiated mystics only, extreme spiritual requirements',
      recommendedLevel: '80+',
      specialFeatures: [
        'Sacred Mystery Chambers',
        'Divine Revelation Halls',
        'Initiation Trials',
        'Otherworldly Portals',
        'Ancient Prophecies'
      ],
      wildlife: [
        {
          name: 'Oracle Sphinx',
          species: 'Delcatty / Sphinxmon / Anubis',
          type: 'Psychic/Flying',
          rarity: 'Extreme',
          description: 'Ancient guardian that poses riddles to seekers'
        },
        {
          name: 'Vision Serpent',
          species: 'Serperior / Seadramon',
          type: 'Psychic/Poison',
          rarity: 'Rare',
          description: 'Sacred snakes that induce prophetic visions'
        },
        {
          name: 'Mystery Cat',
          species: 'Espeon / BlackGatomon / Grintale',
          type: 'Psychic/Dark',
          rarity: 'Uncommon',
          description: 'Cats that walk between worlds and dimensions'
        }
      ],
      resources: [
        {
          name: 'Divine Revelation',
          rarity: 'Extreme',
          description: 'Direct knowledge from the goddess herself'
        },
        {
          name: 'Sacred Mysteries',
          rarity: 'Extreme',
          description: 'Ancient secrets of life and death'
        },
        {
          name: 'Oracle Stones',
          rarity: 'Rare',
          description: 'Stones that reveal hidden truths'
        }
      ],
      lore: 'The Mystery Temple is where Demeter reveals her deepest secrets to those who prove themselves worthy. The knowledge gained here transforms initiates forever.',
      history: 'Built in the earliest days of the grove, the temple has been the site of the most profound spiritual experiences and divine revelations for millennia.',
      dangers: [
        'Overwhelming divine knowledge',
        'Initiation trials that can destroy the unworthy',
        'Visions that can drive mortals mad',
        'Direct contact with divine power',
        'Permanent spiritual transformation'
      ],
      tips: [
        'Complete all preliminary initiations first',
        'Undergo years of spiritual preparation',
        'Bring proof of worthiness',
        'Accept that you may be forever changed',
        'Trust in Demeter\'s wisdom'
      ]
    },
'golden-wheat': {
      id: 'golden-wheat',
      name: 'Golden Wheat Fields',
      regionId: 'demeters-grove',
      regionName: 'Demeter\'s Grove',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/golden-wheat-detailed.png',
      description: 'Vast fields of golden wheat that stretch to the horizon, where Demeter\'s blessing ensures eternal abundance and the grain glows with divine light.',
      difficulty: 'Easy',
      elevation: '300 ft',
      temperature: '65°F to 80°F',
      weatherPatterns: 'Perfect agricultural conditions, golden light phenomena',
      accessibility: 'Open to all, peaceful agricultural area',
      recommendedLevel: '15+',
      specialFeatures: [
        'Endless Wheat Fields',
        'Divine Golden Light',
        'Eternal Abundance',
        'Peaceful Meditation',
        'Agricultural Perfection'
      ],
      wildlife: [
        {
          name: 'Golden Deer',
          species: 'Sawsbuck / Deerling / Eikthyrdeer',
          type: 'Normal/Grass',
          rarity: 'Rare',
          description: 'Majestic deer with golden fur that graze peacefully'
        },
        {
          name: 'Wheat Fairy',
          species: 'Comfey / Palmon / Lyleen',
          type: 'Fairy/Grass',
          rarity: 'Uncommon',
          description: 'Tiny fairies that tend to individual wheat stalks'
        },
        {
          name: 'Harvest Rabbit',
          species: 'Buneary / Lopunny',
          type: 'Normal',
          rarity: 'Common',
          description: 'Gentle rabbits that help spread seeds'
        }
      ],
      resources: [
        {
          name: 'Divine Wheat',
          rarity: 'Extreme',
          description: 'Wheat that glows with Demeter\'s blessing'
        },
        {
          name: 'Golden Grain',
          rarity: 'Rare',
          description: 'Grain with extraordinary nutritional properties'
        },
        {
          name: 'Abundance Essence',
          rarity: 'Uncommon',
          description: 'Magical essence that promotes growth'
        }
      ],
      lore: 'The Golden Wheat Fields represent Demeter\'s greatest gift to humanity - the promise that those who work the land with respect will never know hunger.',
      history: 'These fields have produced perfect harvests for thousands of years, serving as proof of Demeter\'s enduring love for humanity.',
      dangers: [
        'Getting lost in vast fields',
        'Overwhelming sense of peace and contentment',
        'Temptation to never leave'
      ],
      tips: [
        'Bring offerings of thanks to Demeter',
        'Respect the perfect growing conditions',
        'Meditate among the golden stalks',
        'Learn about sustainable agriculture',
        'Experience true abundance'
      ]
    },
'utgard-city': {
      id: 'utgard-city',
      name: 'Utgard City',
      regionId: 'jotun-tundra',
      regionName: 'Jötun Tundra',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/utgard-city-detailed.png',
      description: 'Massive fortress city of the frost giants, built from ice and stone blocks the size of buildings, where the Jötun rule their frozen domain with ancient magic.',
      difficulty: 'Extreme',
      elevation: '2000 ft',
      temperature: '-30°F to 10°F',
      weatherPatterns: 'Constant blizzards, giant magic, aurora phenomena',
      accessibility: 'Extreme danger - hostile giants, diplomatic immunity required',
      recommendedLevel: '90+',
      specialFeatures: [
        'Giant Architecture',
        'Frost Giant Rulers',
        'Ice Magic',
        'Ancient Fortifications',
        'Jötun Councils'
      ],
      wildlife: [
        {
          name: 'Frost Giant',
          species: 'Regigigas / WaruMonzaemon / Cryolinx',
          type: 'Ice/Fighting',
          rarity: 'Extreme',
          description: 'Massive giants that rule the frozen lands'
        },
        {
          name: 'Ice Troll',
          species: 'Darmanitan / IceDevimon',
          type: 'Ice/Ground',
          rarity: 'Rare',
          description: 'Powerful trolls that serve the frost giants'
        },
        {
          name: 'Aurora Wolf',
          species: 'Lycanroc / Garurumon / Fenglope',
          type: 'Ice/Psychic',
          rarity: 'Uncommon',
          description: 'Wolves that howl under the northern lights'
        }
      ],
      resources: [
        {
          name: 'Giant Ice Crystals',
          rarity: 'Extreme',
          description: 'Massive crystals formed by giant magic'
        },
        {
          name: 'Jötun Artifacts',
          rarity: 'Rare',
          description: 'Ancient tools and weapons of the giants'
        },
        {
          name: 'Frost Magic Stones',
          rarity: 'Uncommon',
          description: 'Stones infused with ice magic'
        }
      ],
      lore: 'Utgard City is the capital of the Jötun, the frost giants of Norse mythology who represent the chaotic forces of nature opposing the gods of Asgard.',
      history: 'Built in the dawn of time by the first frost giants, the city has stood as a bastion of giant power and a challenge to divine authority.',
      dangers: [
        'Hostile frost giants',
        'Extreme cold and blizzards',
        'Giant magic attacks',
        'Massive scale of everything',
        'Ancient giant curses'
      ],
      tips: [
        'Obtain diplomatic protection first',
        'Bring extreme cold weather gear',
        'Learn basic giant customs',
        'Travel with a giant-speaker',
        'Avoid direct confrontation at all costs'
      ]
    },
'frost-village': {
      id: 'frost-village',
      name: 'Frost Village',
      regionId: 'jotun-tundra',
      regionName: 'Jötun Tundra',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/frost-village-detailed.png',
      description: 'Hardy Norse settlement built to survive in giant territory, where brave humans live in harmony with the frozen landscape using ancient survival techniques.',
      difficulty: 'Hard',
      elevation: '1500 ft',
      temperature: '-20°F to 20°F',
      weatherPatterns: 'Harsh winters, brief summers, frequent snow',
      accessibility: 'Cold weather survival skills required',
      recommendedLevel: '55+',
      specialFeatures: [
        'Norse Survival Techniques',
        'Ice Architecture',
        'Giant Relations',
        'Winter Festivals',
        'Frost Resistance Training'
      ],
      wildlife: [
        {
          name: 'Frost Wolf',
          species: 'Mightyena / Garurumon',
          type: 'Ice/Normal',
          rarity: 'Common',
          description: 'Hardy wolves adapted to extreme cold'
        },
        {
          name: 'Ice Bear',
          species: 'Beartic / Grizzlemon / Chillet',
          type: 'Ice/Fighting',
          rarity: 'Uncommon',
          description: 'Powerful bears that thrive in frozen conditions'
        },
        {
          name: 'Snow Owl',
          species: 'Noctowl / Falcomon',
          type: 'Ice/Flying',
          rarity: 'Common',
          description: 'Silent hunters of the tundra'
        }
      ],
      resources: [
        {
          name: 'Frost-Resistant Furs',
          rarity: 'Rare',
          description: 'Pelts that provide exceptional cold protection'
        },
        {
          name: 'Ice Tools',
          rarity: 'Common',
          description: 'Tools designed for frozen environments'
        },
        {
          name: 'Winter Supplies',
          rarity: 'Common',
          description: 'Essential goods for surviving harsh winters'
        }
      ],
      lore: 'Frost Village represents human resilience and adaptation, showing how mortals can survive and even thrive in the harshest conditions through determination and skill.',
      history: 'Founded by Norse settlers who refused to be driven away by the giants, the village has developed unique techniques for surviving in giant territory.',
      dangers: [
        'Extreme cold exposure',
        'Giant raids and conflicts',
        'Blizzards and whiteouts',
        'Food and fuel shortages',
        'Isolation during storms'
      ],
      tips: [
        'Master cold weather survival first',
        'Stock up on winter supplies',
        'Learn to recognize giant signs',
        'Build relationships with villagers',
        'Respect the harsh environment'
      ]
    },
'rimeheart-town': {
      id: 'rimeheart-town',
      name: 'Rimeheart Town',
      regionId: 'jotun-tundra',
      regionName: 'Jötun Tundra',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/rimeheart-town-detailed.png',
      description: 'Town built around a massive heart of ice that never melts, where ice mages study the deepest secrets of frost magic and eternal winter.',
      difficulty: 'Hard',
      elevation: '1800 ft',
      temperature: '-25°F to 15°F',
      weatherPatterns: 'Constant cold emanation, ice magic effects',
      accessibility: 'Ice magic practitioners and researchers',
      recommendedLevel: '65+',
      specialFeatures: [
        'Eternal Ice Heart',
        'Ice Magic Schools',
        'Frost Research',
        'Magical Phenomena',
        'Ice Sculpting'
      ],
      wildlife: [
        {
          name: 'Ice Elemental',
          species: 'Regice / Frigimon / Frostallion',
          type: 'Ice',
          rarity: 'Rare',
          description: 'Pure beings of crystallized ice magic'
        },
        {
          name: 'Frost Sprite',
          species: 'Vanillite / Yukidarumon',
          type: 'Ice/Fairy',
          rarity: 'Uncommon',
          description: 'Tiny spirits that dance in ice crystals'
        },
        {
          name: 'Rime Fox',
          species: 'Alolan Vulpix / Renamon / Foxcicle',
          type: 'Ice/Psychic',
          rarity: 'Uncommon',
          description: 'Clever foxes with ice-crystal fur'
        }
      ],
      resources: [
        {
          name: 'Eternal Ice',
          rarity: 'Extreme',
          description: 'Ice that never melts, even in fire'
        },
        {
          name: 'Frost Magic Crystals',
          rarity: 'Rare',
          description: 'Crystals that amplify ice magic'
        },
        {
          name: 'Ice Sculptures',
          rarity: 'Uncommon',
          description: 'Beautiful artworks carved from magical ice'
        }
      ],
      lore: 'Rimeheart Town exists around the Extreme Heart of Winter, a massive ice formation that represents the eternal nature of frost and the power of ice magic.',
      history: 'Founded by ice mages who discovered the Heart of Winter, the town has become a center for studying the deepest mysteries of frost magic.',
      dangers: [
        'Freezing magic effects',
        'Ice magic experiments gone wrong',
        'Heart of Winter\'s influence',
        'Magical ice storms',
        'Hypothermia from magical cold'
      ],
      tips: [
        'Study ice magic basics first',
        'Wear magically heated clothing',
        'Respect the Heart of Winter',
        'Learn from experienced ice mages',
        'Carry magical warming potions'
      ]
    },
'jotun-halls': {
      id: 'jotun-halls',
      name: 'Jötun Halls',
      regionId: 'jotun-tundra',
      regionName: 'Jötun Tundra',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/jotun-halls-detailed.png',
      description: 'Ancient meeting halls of the frost giants where they gather for councils, feasts, and to plan their eternal conflict with the gods of Asgard.',
      difficulty: 'Extreme',
      elevation: '2200 ft',
      temperature: '-35°F to 5°F',
      weatherPatterns: 'Giant magic storms, otherworldly cold',
      accessibility: 'Forbidden to mortals - extreme divine/giant politics',
      recommendedLevel: '95+',
      specialFeatures: [
        'Giant Council Chambers',
        'Ancient Giant History',
        'Divine Conflict Planning',
        'Massive Feasting Halls',
        'Giant Magic Rituals'
      ],
      wildlife: [
        {
          name: 'Elder Frost Giant',
          species: 'Regigigas / Machinedramon',
          type: 'Ice/Psychic',
          rarity: 'Extreme',
          description: 'Ancient giants with immense magical power'
        },
        {
          name: 'Giant Spirit',
          species: 'Dusknoir / Phantomon / Necromus',
          type: 'Ice/Ghost',
          rarity: 'Extreme',
          description: 'Spirits of giants who died in divine wars'
        },
        {
          name: 'Jötun Familiar',
          species: 'Sneasel / Devimon / Shadowbeak',
          type: 'Ice/Dark',
          rarity: 'Rare',
          description: 'Magical creatures that serve the giant lords'
        }
      ],
      resources: [
        {
          name: 'Giant Wisdom',
          rarity: 'Extreme',
          description: 'Ancient knowledge from the time before gods'
        },
        {
          name: 'Ragnarök Prophecies',
          rarity: 'Extreme',
          description: 'Prophecies about the end of the world'
        },
        {
          name: 'Giant Runes',
          rarity: 'Rare',
          description: 'Magical runes of immense power'
        }
      ],
      lore: 'The Jötun Halls are where the frost giants plan for Ragnarök, the end of the world where they will finally overcome the gods and reclaim their dominion.',
      history: 'These halls have stood since the beginning of time, witnessing countless councils and the slow preparation for the final battle between giants and gods.',
      dangers: [
        'Immediate death for unauthorized entry',
        'Giant magic beyond mortal comprehension',
        'Divine retribution',
        'Ancient curses and wards',
        'Exposure to cosmic conflicts'
      ],
      tips: [
        'Do not attempt to enter under any circumstances',
        'Avoid the area entirely',
        'Seek divine protection if nearby',
        'Study giant lore from safe distance',
        'Respect the cosmic balance'
      ]
    },
'eternal-glacier': {
      id: 'eternal-glacier',
      name: 'Eternal Glacier',
      regionId: 'jotun-tundra',
      regionName: 'Jötun Tundra',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/eternal-glacier-detailed.png',
      description: 'Massive glacier that has existed since the world\'s creation, containing frozen memories of the past and serving as a bridge between the world of mortals and giants.',
      difficulty: 'Extreme',
      elevation: '3000 ft',
      temperature: '-40°F to 0°F',
      weatherPatterns: 'Primordial cold, time distortions, ancient weather patterns',
      accessibility: 'Extreme cold survival, archaeological permits',
      recommendedLevel: '85+',
      specialFeatures: [
        'Primordial Ice',
        'Frozen Memories',
        'Time Distortions',
        'Ancient Artifacts',
        'World Creation Evidence'
      ],
      wildlife: [
        {
          name: 'Ancient Ice Dragon',
          species: 'Kyurem / MetalGarurumon / Cryolinx',
          type: 'Ice/Dragon',
          rarity: 'Extreme',
          description: 'Dragon that remembers the world\'s creation'
        },
        {
          name: 'Memory Wraith',
          species: 'Froslass / LadyDevimon',
          type: 'Ice/Ghost',
          rarity: 'Rare',
          description: 'Spirits of forgotten events trapped in ice'
        },
        {
          name: 'Primordial Beast',
          species: 'Mamoswine / Mammemon / Wumpo',
          type: 'Ice/Rock',
          rarity: 'Rare',
          description: 'Creatures from the world\'s earliest days'
        }
      ],
      resources: [
        {
          name: 'Primordial Ice',
          rarity: 'Extreme',
          description: 'Ice from the world\'s creation containing ancient power'
        },
        {
          name: 'Frozen Memories',
          rarity: 'Extreme',
          description: 'Crystallized memories of forgotten ages'
        },
        {
          name: 'Creation Artifacts',
          rarity: 'Rare',
          description: 'Relics from the time when the world was young'
        }
      ],
      lore: 'The Eternal Glacier is a remnant of the world\'s creation, holding within its ice the memories and artifacts of ages long past, including evidence of the first conflicts between gods and giants.',
      history: 'Formed at the world\'s beginning, the glacier has slowly advanced and retreated across the landscape, preserving everything it touches in eternal ice.',
      dangers: [
        'Extreme primordial cold',
        'Time distortion effects',
        'Ancient curses in the ice',
        'Overwhelming historical visions',
        'Glacier shifts and collapses'
      ],
      tips: [
        'Bring the most advanced cold protection available',
        'Study temporal magic for protection',
        'Work with archaeologists and historians',
        'Prepare for profound historical revelations',
        'Respect the ancient power contained within'
      ]
    },
'kurukshetra-city': {
      id: 'kurukshetra-city',
      name: 'Kurukshetra City',
      regionId: 'kshatriya-arena',
      regionName: 'Kshatriya Arena',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/kurukshetra-city-detailed.png',
      description: 'Sacred city built on the Extreme battlefield where the great war of the Mahabharata was fought, now a center for warrior training and understanding dharma through combat.',
      difficulty: 'Hard',
      elevation: '1200 ft',
      temperature: '70°F to 95°F',
      weatherPatterns: 'Hot, dry climate with occasional monsoons',
      accessibility: 'Warriors and students of dharma welcome',
      recommendedLevel: '70+',
      specialFeatures: [
        'Sacred Battlefield',
        'Warrior Schools',
        'Dharma Studies',
        'Combat Training',
        'Historical Monuments'
      ],
      wildlife: [
        {
          name: 'War Elephant',
          species: 'Donphan / Mammothmon / Dumud',
          type: 'Fighting/Ground',
          rarity: 'Rare',
          description: 'Majestic elephants trained for noble combat'
        },
        {
          name: 'Dharma Eagle',
          species: 'Braviary / Garudamon',
          type: 'Flying/Fighting',
          rarity: 'Uncommon',
          description: 'Eagles that embody righteous warrior spirit'
        },
        {
          name: 'Battle Horse',
          species: 'Rapidash / Centarumon / Univolt',
          type: 'Normal/Fighting',
          rarity: 'Common',
          description: 'Noble steeds bred for honorable warfare'
        }
      ],
      resources: [
        {
          name: 'Sacred Weapons',
          rarity: 'Extreme',
          description: 'Weapons blessed by the heroes of legend'
        },
        {
          name: 'Warrior Codes',
          rarity: 'Rare',
          description: 'Ancient texts on honorable combat'
        },
        {
          name: 'Battle Standards',
          rarity: 'Uncommon',
          description: 'Banners that inspire courage in battle'
        }
      ],
      lore: 'Kurukshetra City stands on the most sacred battlefield in Hindu tradition, where the Pandavas and Kauravas fought the great war that determined the fate of dharma in the world.',
      history: 'Built to commemorate the epic battle described in the Mahabharata, the city serves as a center for understanding righteous warfare and the warrior\'s path to spiritual enlightenment.',
      dangers: [
        'Intense warrior training',
        'Spiritual trials of dharma',
        'Combat challenges',
        'Historical weight of the battlefield',
        'Demanding physical requirements'
      ],
      tips: [
        'Study the Mahabharata before visiting',
        'Understand concepts of dharma and righteous war',
        'Train in combat skills',
        'Respect the sacred nature of the battlefield',
        'Seek guidance from warrior-philosophers'
      ]
    },
'dharma-village': {
      id: 'dharma-village',
      name: 'Dharma Village',
      regionId: 'kshatriya-arena',
      regionName: 'Kshatriya Arena',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/dharma-village-detailed.png',
      description: 'Peaceful village where the principles of dharma (righteous duty) are lived and taught, focusing on moral philosophy and ethical warrior conduct.',
      difficulty: 'Medium',
      elevation: '1000 ft',
      temperature: '65°F to 85°F',
      weatherPatterns: 'Temperate, conducive to contemplation',
      accessibility: 'Students of philosophy and ethics welcome',
      recommendedLevel: '40+',
      specialFeatures: [
        'Dharma Schools',
        'Philosophical Debates',
        'Ethical Training',
        'Meditation Gardens',
        'Moral Guidance'
      ],
      wildlife: [
        {
          name: 'Wise Monkey',
          species: 'Oranguru / Apemon / Broncherry',
          type: 'Normal/Psychic',
          rarity: 'Uncommon',
          description: 'Intelligent primates that contemplate moral questions'
        },
        {
          name: 'Peaceful Dove',
          species: 'Pidove / Piyomon',
          type: 'Normal/Flying',
          rarity: 'Common',
          description: 'Birds that represent harmony and right action'
        },
        {
          name: 'Meditation Cat',
          species: 'Meditite / Gatomon / Relaxaurus',
          type: 'Psychic/Normal',
          rarity: 'Common',
          description: 'Cats that sit in contemplative poses'
        }
      ],
      resources: [
        {
          name: 'Dharma Texts',
          rarity: 'Rare',
          description: 'Sacred writings on righteous living'
        },
        {
          name: 'Moral Compass',
          rarity: 'Uncommon',
          description: 'Tools for ethical decision-making'
        },
        {
          name: 'Wisdom Scrolls',
          rarity: 'Common',
          description: 'Philosophical teachings and guides'
        }
      ],
      lore: 'Dharma Village embodies the principle that true strength comes from righteousness, and that warriors must first understand moral duty before wielding weapons.',
      history: 'Founded by sages who sought to teach the ethical foundations necessary for righteous warfare, the village has become a center for moral education.',
      dangers: [
        'Challenging moral dilemmas',
        'Intense philosophical debates',
        'Confronting personal ethics',
        'Rigorous self-examination'
      ],
      tips: [
        'Come with an open mind',
        'Be prepared to question your beliefs',
        'Engage honestly in philosophical discussions',
        'Practice meditation and self-reflection',
        'Learn from the village elders'
      ]
    },
'valor-town': {
      id: 'valor-town',
      name: 'Valor Town',
      regionId: 'kshatriya-arena',
      regionName: 'Kshatriya Arena',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/valor-town-detailed.png',
      description: 'Military town where courage and bravery are celebrated above all, home to elite warrior academies and training grounds for the most valorous fighters.',
      difficulty: 'Hard',
      elevation: '1100 ft',
      temperature: '75°F to 100°F',
      weatherPatterns: 'Hot, challenging conditions for training',
      accessibility: 'Brave warriors and military personnel',
      recommendedLevel: '60+',
      specialFeatures: [
        'Warrior Academies',
        'Courage Trials',
        'Military Training',
        'Hero Monuments',
        'Valor Ceremonies'
      ],
      wildlife: [
        {
          name: 'Brave Lion',
          species: 'Pyroar / Leomon / Reptyro',
          type: 'Fire/Fighting',
          rarity: 'Rare',
          description: 'Lions that embody courage and leadership'
        },
        {
          name: 'Honor Wolf',
          species: 'Lucario / Garurumon',
          type: 'Fighting/Normal',
          rarity: 'Uncommon',
          description: 'Wolves that fight with nobility and valor'
        },
        {
          name: 'Courage Bird',
          species: 'Staraptor / Aquilamon / Galeclaw',
          type: 'Flying/Fighting',
          rarity: 'Common',
          description: 'Birds that inspire bravery in battle'
        }
      ],
      resources: [
        {
          name: 'Medals of Valor',
          rarity: 'Rare',
          description: 'Awards for exceptional courage'
        },
        {
          name: 'Training Equipment',
          rarity: 'Common',
          description: 'Advanced gear for warrior training'
        },
        {
          name: 'Battle Tactics',
          rarity: 'Uncommon',
          description: 'Strategic knowledge for combat'
        }
      ],
      lore: 'Valor Town celebrates the warrior spirit that faces danger without hesitation, teaching that true courage comes from protecting others rather than seeking personal glory.',
      history: 'Established by veteran warriors who wanted to pass down the traditions of heroic combat and ensure that future generations understand true valor.',
      dangers: [
        'Intense physical training',
        'Combat exercises',
        'Courage trials that test limits',
        'Competitive warrior culture',
        'Risk of injury during training'
      ],
      tips: [
        'Build physical fitness before arriving',
        'Understand the difference between courage and recklessness',
        'Learn from experienced warriors',
        'Participate in training exercises',
        'Honor the traditions of valor'
      ]
    },
'honor-temple': {
      id: 'honor-temple',
      name: 'Honor Temple',
      regionId: 'kshatriya-arena',
      regionName: 'Kshatriya Arena',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/honor-temple-detailed.png',
      description: 'Sacred temple dedicated to the concept of honor in warfare, where warriors take sacred oaths and undergo purification rituals before battle.',
      difficulty: 'Hard',
      elevation: '1300 ft',
      temperature: '60°F to 80°F',
      weatherPatterns: 'Sacred atmosphere, divine presence',
      accessibility: 'Honorable warriors and spiritual seekers',
      recommendedLevel: '65+',
      specialFeatures: [
        'Sacred Oaths',
        'Purification Rituals',
        'Honor Codes',
        'Warrior Blessings',
        'Divine Guidance'
      ],
      wildlife: [
        {
          name: 'Sacred Tiger',
          species: 'Raikou / SaberLeomon / Blazehowl',
          type: 'Fighting/Psychic',
          rarity: 'Extreme',
          description: 'Divine tiger that judges the honor of warriors'
        },
        {
          name: 'Honor Guard',
          species: 'Lucario / Knightmon',
          type: 'Fighting/Steel',
          rarity: 'Rare',
          description: 'Spiritual guardians of the temple'
        },
        {
          name: 'Temple Peacock',
          species: 'Ho-Oh / Peckmon / Fenglope',
          type: 'Flying/Psychic',
          rarity: 'Uncommon',
          description: 'Beautiful birds that represent divine nobility'
        }
      ],
      resources: [
        {
          name: 'Sacred Vows',
          rarity: 'Extreme',
          description: 'Oaths that bind warriors to honorable conduct'
        },
        {
          name: 'Blessing Oils',
          rarity: 'Rare',
          description: 'Sacred oils used in warrior purification'
        },
        {
          name: 'Honor Medallions',
          rarity: 'Uncommon',
          description: 'Symbols of commitment to honorable warfare'
        }
      ],
      lore: 'The Honor Temple stands as a reminder that warfare must be conducted with dignity and respect, and that true warriors are bound by sacred codes that transcend victory.',
      history: 'Built to sanctify the warrior\'s path, the temple has blessed countless fighters who sought to wage war with honor rather than mere brutality.',
      dangers: [
        'Spiritual judgment of character',
        'Binding sacred oaths',
        'Divine trials of honor',
        'Overwhelming sense of duty',
        'Consequences of broken vows'
      ],
      tips: [
        'Examine your motivations honestly',
        'Understand the weight of sacred oaths',
        'Seek spiritual guidance',
        'Prepare for character judgment',
        'Honor all commitments made'
      ]
    },
'grand-colosseum': {
      id: 'grand-colosseum',
      name: 'Grand Colosseum',
      regionId: 'kshatriya-arena',
      regionName: 'Kshatriya Arena',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/grand-colosseum-detailed.png',
      description: 'Massive arena where the greatest warriors compete in honorable combat, testing their skills in front of crowds while following strict codes of noble warfare.',
      difficulty: 'Extreme',
      elevation: '1150 ft',
      temperature: '80°F to 105°F',
      weatherPatterns: 'Hot arena conditions, intense competition atmosphere',
      accessibility: 'Elite warriors and championship competitors',
      recommendedLevel: '80+',
      specialFeatures: [
        'Championship Battles',
        'Honorable Combat',
        'Warrior Competitions',
        'Grand Tournaments',
        'Elite Training'
      ],
      wildlife: [
        {
          name: 'Champion Beast',
          species: 'Kommo-o / WarGreymon / Orserk',
          type: 'Fighting/Dragon',
          rarity: 'Extreme',
          description: 'Extreme creatures that compete alongside warriors'
        },
        {
          name: 'Arena Guardian',
          species: 'Terrakion / Volcamon',
          type: 'Fighting/Rock',
          rarity: 'Rare',
          description: 'Powerful beings that maintain arena order'
        },
        {
          name: 'Victory Eagle',
          species: 'Braviary / Hawkmon / Nitocris',
          type: 'Flying/Fighting',
          rarity: 'Uncommon',
          description: 'Eagles that crown tournament champions'
        }
      ],
      resources: [
        {
          name: 'Championship Trophies',
          rarity: 'Extreme',
          description: 'Ultimate prizes for arena champions'
        },
        {
          name: 'Gladiator Gear',
          rarity: 'Rare',
          description: 'Equipment used by elite arena fighters'
        },
        {
          name: 'Combat Techniques',
          rarity: 'Uncommon',
          description: 'Advanced fighting methods'
        }
      ],
      lore: 'The Grand Colosseum represents the pinnacle of honorable combat, where warriors prove their worth not through brutality but through skill, courage, and adherence to noble codes.',
      history: 'Constructed to provide a venue for the greatest warriors to test themselves against equals, the colosseum has hosted Extreme battles that inspire generations.',
      dangers: [
        'Elite-level combat',
        'Serious injury risk',
        'Intense competition pressure',
        'Public performance anxiety',
        'Career-defining battles'
      ],
      tips: [
        'Master advanced combat techniques first',
        'Study arena combat rules thoroughly',
        'Build mental resilience',
        'Learn from champion fighters',
        'Maintain honor even in defeat'
      ]
    },
'witchwood-city': {
      id: 'witchwood-city',
      name: 'Witchwood City',
      regionId: 'crowsfoot-marsh',
      regionName: 'Crowsfoot Marsh',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/witchwood-city-detailed.png',
      description: 'Dark city built among twisted trees and murky waters, where practitioners of hedge magic and swamp witchcraft study the darker arts of nature magic.',
      difficulty: 'Hard',
      elevation: '50 ft',
      temperature: '65°F to 85°F',
      weatherPatterns: 'Misty, humid, frequent fog and magical phenomena',
      accessibility: 'Magic practitioners and brave researchers',
      recommendedLevel: '65+',
      specialFeatures: [
        'Hedge Magic Schools',
        'Witch Covens',
        'Dark Nature Magic',
        'Alchemical Labs',
        'Forbidden Knowledge'
      ],
      wildlife: [
        {
          name: 'Swamp Witch',
          species: 'Misdreavus / Witchmon / Katress',
          type: 'Dark/Grass',
          rarity: 'Rare',
          description: 'Mysterious practitioners of marsh magic'
        },
        {
          name: 'Familiar Raven',
          species: 'Murkrow / Hawkmon',
          type: 'Dark/Flying',
          rarity: 'Common',
          description: 'Intelligent ravens that serve local witches'
        },
        {
          name: 'Bog Serpent',
          species: 'Seviper / Seadramon / Elphidran',
          type: 'Poison/Water',
          rarity: 'Uncommon',
          description: 'Venomous snakes that inhabit the murky waters'
        }
      ],
      resources: [
        {
          name: 'Witch\'s Herbs',
          rarity: 'Rare',
          description: 'Rare plants used in powerful magical potions'
        },
        {
          name: 'Dark Grimoires',
          rarity: 'Rare',
          description: 'Spell books containing forbidden knowledge'
        },
        {
          name: 'Cursed Artifacts',
          rarity: 'Uncommon',
          description: 'Magical items with dark enchantments'
        }
      ],
      lore: 'Witchwood City serves as a haven for those who practice the darker aspects of nature magic, where ancient traditions of hedge witchcraft and swamp sorcery are preserved.',
      history: 'Founded by witches and hedge wizards who were driven from more civilized areas, the city has become a center for magical knowledge that others fear to study.',
      dangers: [
        'Dark magic experiments',
        'Cursed locations',
        'Hostile magical practitioners',
        'Poisonous marsh creatures',
        'Forbidden knowledge corruption'
      ],
      tips: [
        'Respect local magical traditions',
        'Avoid touching unknown magical items',
        'Bring protection against curses',
        'Study hedge magic basics',
        'Negotiate carefully with witches'
      ]
    },
'cauldron-village': {
      id: 'cauldron-village',
      name: 'Cauldron Village',
      regionId: 'crowsfoot-marsh',
      regionName: 'Crowsfoot Marsh',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/cauldron-village-detailed.png',
      description: 'Quaint village specializing in potion-making and alchemy, where every home has a bubbling cauldron and the air is filled with magical smoke and mysterious aromas.',
      difficulty: 'Medium',
      elevation: '30 ft',
      temperature: '70°F to 80°F',
      weatherPatterns: 'Steamy from magical cauldrons, aromatic mists',
      accessibility: 'Alchemists and potion enthusiasts welcome',
      recommendedLevel: '45+',
      specialFeatures: [
        'Potion Brewing',
        'Alchemy Workshops',
        'Ingredient Gardens',
        'Magic Cauldrons',
        'Recipe Exchanges'
      ],
      wildlife: [
        {
          name: 'Cauldron Toad',
          species: 'Seismitoad / Gekomon / Relaxaurus',
          type: 'Poison/Water',
          rarity: 'Common',
          description: 'Amphibians whose secretions are used in potions'
        },
        {
          name: 'Herb Fairy',
          species: 'Flabébé / Palmon',
          type: 'Fairy/Grass',
          rarity: 'Uncommon',
          description: 'Tiny fairies that tend magical ingredient gardens'
        },
        {
          name: 'Brew Bat',
          species: 'Zubat / DemiDevimon / Lunaris',
          type: 'Poison/Flying',
          rarity: 'Common',
          description: 'Bats that help identify potion ingredients'
        }
      ],
      resources: [
        {
          name: 'Magical Potions',
          rarity: 'Rare',
          description: 'Powerful brews with various magical effects'
        },
        {
          name: 'Alchemy Ingredients',
          rarity: 'Common',
          description: 'Raw materials for potion-making'
        },
        {
          name: 'Recipe Books',
          rarity: 'Uncommon',
          description: 'Collections of potion formulas'
        }
      ],
      lore: 'Cauldron Village represents the lighter side of marsh magic, focusing on helpful potions and beneficial alchemy rather than dark curses and hexes.',
      history: 'Established by friendly hedge witches who wanted to use their knowledge to help others, the village has become known for its healing potions and magical remedies.',
      dangers: [
        'Potion explosions',
        'Toxic ingredient exposure',
        'Magical accidents',
        'Ingredient allergies',
        'Experimental brew failures'
      ],
      tips: [
        'Learn basic alchemy safety',
        'Ask before touching ingredients',
        'Trade fairly with villagers',
        'Sample potions carefully',
        'Respect brewing traditions'
      ]
    },
'bog-town': {
      id: 'bog-town',
      name: 'Bog Town',
      regionId: 'crowsfoot-marsh',
      regionName: 'Crowsfoot Marsh',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/bog-town-detailed.png',
      description: 'Rustic town built on stilts above the marsh waters, where hardy folk make their living harvesting peat, hunting marsh creatures, and guiding travelers through the wetlands.',
      difficulty: 'Medium',
      elevation: '20 ft',
      temperature: '68°F to 82°F',
      weatherPatterns: 'Humid, frequent morning mists, seasonal flooding',
      accessibility: 'Marsh guides and swamp dwellers',
      recommendedLevel: '35+',
      specialFeatures: [
        'Stilt Architecture',
        'Marsh Navigation',
        'Peat Harvesting',
        'Wetland Ecology',
        'Guide Services'
      ],
      wildlife: [
        {
          name: 'Marsh Gator',
          species: 'Krookodile / Seadramon / Broncherry',
          type: 'Water/Ground',
          rarity: 'Common',
          description: 'Large reptiles that patrol the waterways'
        },
        {
          name: 'Will O\' Wisp',
          species: 'Lampent / Candlemon',
          type: 'Ghost/Fire',
          rarity: 'Uncommon',
          description: 'Mysterious lights that lead travelers astray'
        },
        {
          name: 'Bog Turtle',
          species: 'Carracosta / Kamemon / Fuack',
          type: 'Water/Rock',
          rarity: 'Common',
          description: 'Sturdy turtles adapted to marsh life'
        }
      ],
      resources: [
        {
          name: 'Peat Fuel',
          rarity: 'Common',
          description: 'Slow-burning fuel harvested from the bog'
        },
        {
          name: 'Marsh Maps',
          rarity: 'Uncommon',
          description: 'Navigation charts of the dangerous wetlands'
        },
        {
          name: 'Swamp Gear',
          rarity: 'Common',
          description: 'Equipment for traveling through marshes'
        }
      ],
      lore: 'Bog Town represents the resilience of people who choose to live in harmony with harsh environments, making the most of what the wetlands provide.',
      history: 'Founded by settlers who discovered the bog\'s resources and learned to thrive in the challenging marsh environment through ingenuity and cooperation.',
      dangers: [
        'Getting lost in the marsh',
        'Quicksand and bog holes',
        'Dangerous marsh creatures',
        'Seasonal flooding',
        'Misleading will o\' wisps'
      ],
      tips: [
        'Hire local guides for marsh travel',
        'Stay on marked paths',
        'Carry marsh navigation tools',
        'Learn to identify quicksand',
        'Respect the wetland ecosystem'
      ]
    },
'iron-teeth-hut': {
      id: 'iron-teeth-hut',
      name: 'Iron Teeth Hut',
      regionId: 'crowsfoot-marsh',
      regionName: 'Crowsfoot Marsh',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/iron-teeth-hut-detailed.png',
      description: 'Isolated hut of the Extreme witch Iron Teeth, surrounded by bone fences and magical traps, where the most powerful and dangerous marsh magic is practiced.',
      difficulty: 'Extreme',
      elevation: '40 ft',
      temperature: '60°F to 75°F',
      weatherPatterns: 'Unnatural cold spots, magical disturbances, eerie atmosphere',
      accessibility: 'Extreme danger - witch\'s private domain',
      recommendedLevel: '85+',
      specialFeatures: [
        'Extreme Witch\'s Lair',
        'Bone Architecture',
        'Dark Magic Experiments',
        'Magical Traps',
        'Forbidden Rituals'
      ],
      wildlife: [
        {
          name: 'Iron Teeth Witch',
          species: 'Hatterene / Wizardmon / Katress',
          type: 'Dark/Steel',
          rarity: 'Extreme',
          description: 'The terrifying witch with iron teeth and immense power'
        },
        {
          name: 'Bone Golem',
          species: 'Dusknoir / SkullGreymon',
          type: 'Ground/Ghost',
          rarity: 'Rare',
          description: 'Animated skeletons that guard the hut'
        },
        {
          name: 'Cursed Crow',
          species: 'Honchkrow / Ravemon / Cawgnito',
          type: 'Dark/Flying',
          rarity: 'Uncommon',
          description: 'Ravens transformed by dark magic'
        }
      ],
      resources: [
        {
          name: 'Iron Teeth\'s Grimoire',
          rarity: 'Extreme',
          description: 'The witch\'s personal spell book of ultimate power'
        },
        {
          name: 'Cursed Bones',
          rarity: 'Rare',
          description: 'Bones infused with dark magical energy'
        },
        {
          name: 'Dark Potions',
          rarity: 'Rare',
          description: 'Extremely dangerous magical brews'
        }
      ],
      lore: 'Iron Teeth Hut is the domain of the marsh\'s most feared witch, whose iron teeth can bite through steel and whose magic can curse entire bloodlines.',
      history: 'The hut has stood for centuries as the home of the witch Iron Teeth, who practices the darkest magic and strikes fear into all who know her name.',
      dangers: [
        'Direct confrontation with Extreme witch',
        'Deadly magical traps',
        'Powerful curses',
        'Bone fence guardians',
        'Dark magic corruption'
      ],
      tips: [
        'Avoid at all costs unless absolutely necessary',
        'Bring powerful magical protection',
        'Study anti-curse magic',
        'Consider diplomatic approach',
        'Have escape plan ready'
      ]
    },
'poison-pools': {
      id: 'poison-pools',
      name: 'Poison Pools',
      regionId: 'crowsfoot-marsh',
      regionName: 'Crowsfoot Marsh',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/poison-pools-detailed.png',
      description: 'Treacherous area of interconnected toxic pools where deadly chemicals and magical poisons have created a hazardous but resource-rich environment.',
      difficulty: 'Extreme',
      elevation: '10 ft',
      temperature: '75°F to 90°F',
      weatherPatterns: 'Toxic vapors, acid rain, poisonous mists',
      accessibility: 'Extreme toxicity - protective equipment essential',
      recommendedLevel: '75+',
      specialFeatures: [
        'Toxic Pool Network',
        'Poison Harvesting',
        'Chemical Hazards',
        'Rare Ingredients',
        'Environmental Danger'
      ],
      wildlife: [
        {
          name: 'Toxic Slime',
          species: 'Muk / Raremon / Gumoss',
          type: 'Poison',
          rarity: 'Common',
          description: 'Acidic creatures that thrive in poisonous water'
        },
        {
          name: 'Venom Drake',
          species: 'Dragalge / Venomvamdemon / Elphidran',
          type: 'Poison/Dragon',
          rarity: 'Extreme',
          description: 'Dragon that has adapted to the toxic environment'
        },
        {
          name: 'Acid Frog',
          species: 'Croagunk / Otamamon',
          type: 'Poison/Water',
          rarity: 'Uncommon',
          description: 'Amphibians with corrosive skin secretions'
        }
      ],
      resources: [
        {
          name: 'Concentrated Poisons',
          rarity: 'Extreme',
          description: 'Extremely potent toxins for advanced alchemy'
        },
        {
          name: 'Toxic Crystals',
          rarity: 'Rare',
          description: 'Crystallized poisons with magical properties'
        },
        {
          name: 'Antidote Herbs',
          rarity: 'Rare',
          description: 'Rare plants that counteract specific toxins'
        }
      ],
      lore: 'The Poison Pools formed when ancient magical experiments went wrong, creating a toxic wasteland that paradoxically produces some of the most valuable alchemical ingredients.',
      history: 'Created by a catastrophic magical accident centuries ago, the pools have evolved into a unique ecosystem where only the most adapted creatures can survive.',
      dangers: [
        'Lethal poison exposure',
        'Toxic vapor inhalation',
        'Acid burns from pools',
        'Poisonous creature attacks',
        'Equipment corrosion'
      ],
      tips: [
        'Wear full protective gear',
        'Bring multiple antidotes',
        'Monitor air quality constantly',
        'Have emergency evacuation ready',
        'Work with experienced toxicologists'
      ]
    },
'tellus-city': {
      id: 'tellus-city',
      name: 'Tellus City',
      regionId: 'terra-madre-basin',
      regionName: 'Terra Madre Basin',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/tellus-city-detailed.png',
      description: 'Grand city built into living rock formations, where Roman earth goddess Tellus is honored through magnificent stone architecture that grows naturally from the ground.',
      difficulty: 'Medium',
      elevation: '800 ft',
      temperature: '65°F to 80°F',
      weatherPatterns: 'Stable, earth-blessed climate with perfect growing conditions',
      accessibility: 'Earth magic practitioners and geological researchers',
      recommendedLevel: '50+',
      specialFeatures: [
        'Living Stone Architecture',
        'Earth Magic Academies',
        'Geological Wonders',
        'Roman Earth Temples',
        'Natural Rock Gardens'
      ],
      wildlife: [
        {
          name: 'Stone Guardian',
          species: 'Golem / Golemon / Anubis',
          type: 'Rock/Fighting',
          rarity: 'Rare',
          description: 'Living statues that protect the city'
        },
        {
          name: 'Earth Elemental',
          species: 'Rhyperior / Grottomon',
          type: 'Ground/Rock',
          rarity: 'Uncommon',
          description: 'Beings formed from the blessed earth'
        },
        {
          name: 'Crystal Mole',
          species: 'Excadrill / Drimogemon / Digtoise',
          type: 'Ground/Steel',
          rarity: 'Common',
          description: 'Industrious creatures that shape underground tunnels'
        }
      ],
      resources: [
        {
          name: 'Living Stone',
          rarity: 'Rare',
          description: 'Rock that continues to grow and shape itself'
        },
        {
          name: 'Earth Crystals',
          rarity: 'Uncommon',
          description: 'Gems that amplify geological magic'
        },
        {
          name: 'Sacred Clay',
          rarity: 'Common',
          description: 'Clay blessed by Tellus for construction'
        }
      ],
      lore: 'Tellus City represents the Roman understanding of earth as a nurturing mother, where the goddess Tellus provides stability, fertility, and protection to all who honor her.',
      history: 'Built by Roman earth mages who learned to work with living stone, the city has grown organically over centuries as the rock formations respond to human habitation.',
      dangers: [
        'Unstable rock formations during growth',
        'Earth magic experiments',
        'Underground cave-ins',
        'Territorial earth elementals'
      ],
      tips: [
        'Study earth magic basics',
        'Respect the living architecture',
        'Learn Roman earth goddess traditions',
        'Work with local stone shapers',
        'Bring offerings for Tellus'
      ]
    },
'terra-village': {
      id: 'terra-village',
      name: 'Terra Village',
      regionId: 'terra-madre-basin',
      regionName: 'Terra Madre Basin',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/terra-village-detailed.png',
      description: 'Peaceful farming village where traditional earth magic ensures perfect crops and the soil is so fertile that plants grow with supernatural abundance.',
      difficulty: 'Easy',
      elevation: '600 ft',
      temperature: '70°F to 85°F',
      weatherPatterns: 'Perfect agricultural weather, gentle earth magic',
      accessibility: 'Farmers and agricultural researchers welcome',
      recommendedLevel: '20+',
      specialFeatures: [
        'Supernatural Fertility',
        'Earth Magic Farming',
        'Perfect Soil',
        'Abundant Harvests',
        'Agricultural Innovation'
      ],
      wildlife: [
        {
          name: 'Garden Spirit',
          species: 'Comfey / Palmon / Lyleen',
          type: 'Grass/Fairy',
          rarity: 'Common',
          description: 'Friendly spirits that help tend crops'
        },
        {
          name: 'Harvest Mouse',
          species: 'Rattata / Chuumon',
          type: 'Normal/Ground',
          rarity: 'Common',
          description: 'Mice that help with grain collection'
        },
        {
          name: 'Earth Rabbit',
          species: 'Diggersby / Terriermon / Caprity',
          type: 'Ground/Normal',
          rarity: 'Common',
          description: 'Rabbits that help aerate soil through burrowing'
        }
      ],
      resources: [
        {
          name: 'Miracle Soil',
          rarity: 'Rare',
          description: 'Earth so fertile it can grow anything'
        },
        {
          name: 'Perfect Produce',
          rarity: 'Common',
          description: 'Crops of exceptional quality and nutrition'
        },
        {
          name: 'Earth Seeds',
          rarity: 'Uncommon',
          description: 'Seeds enhanced by earth magic'
        }
      ],
      lore: 'Terra Village embodies the nurturing aspect of Mother Earth, where the soil itself is alive with magic and responds to the care and love of those who work it.',
      history: 'Founded by farmers who discovered a natural confluence of earth magic, the village has perfected sustainable agriculture through partnership with the land.',
      dangers: [
        'Overconfidence in magical farming',
        'Soil magic dependency',
        'Occasional earth tremors',
        'Plant overgrowth'
      ],
      tips: [
        'Learn sustainable farming practices',
        'Respect the living soil',
        'Participate in earth blessing ceremonies',
        'Study traditional agriculture',
        'Share knowledge with local farmers'
      ]
    },
'gaia-town': {
      id: 'gaia-town',
      name: 'Gaia Town',
      regionId: 'terra-madre-basin',
      regionName: 'Terra Madre Basin',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/gaia-town-detailed.png',
      description: 'Eco-conscious town dedicated to the Greek primordial goddess Gaia, where harmony between human civilization and natural ecosystems is perfectly balanced.',
      difficulty: 'Medium',
      elevation: '700 ft',
      temperature: '68°F to 78°F',
      weatherPatterns: 'Perfectly balanced climate, harmonious natural cycles',
      accessibility: 'Environmentalists and nature lovers',
      recommendedLevel: '35+',
      specialFeatures: [
        'Perfect Ecological Balance',
        'Gaia Worship',
        'Environmental Harmony',
        'Natural Architecture',
        'Ecosystem Integration'
      ],
      wildlife: [
        {
          name: 'Gaia Avatar',
          species: 'Celebi / Rosemon / Verdash',
          type: 'Grass/Psychic',
          rarity: 'Extreme',
          description: 'Manifestation of the Earth Mother herself'
        },
        {
          name: 'Harmony Bird',
          species: 'Togekiss / Piyomon',
          type: 'Normal/Flying',
          rarity: 'Common',
          description: 'Birds that sing in perfect natural rhythm'
        },
        {
          name: 'Balance Beast',
          species: 'Virizion / Lilymon / Eikthyrdeer',
          type: 'Normal/Grass',
          rarity: 'Uncommon',
          description: 'Creatures that maintain ecosystem equilibrium'
        }
      ],
      resources: [
        {
          name: 'Gaia\'s Blessing',
          rarity: 'Extreme',
          description: 'Direct blessing from the Earth Mother'
        },
        {
          name: 'Natural Harmony',
          rarity: 'Rare',
          description: 'Understanding of perfect ecological balance'
        },
        {
          name: 'Living Architecture',
          rarity: 'Uncommon',
          description: 'Buildings that grow from and support nature'
        }
      ],
      lore: 'Gaia Town represents the ultimate goal of environmental harmony, where human needs and natural ecosystems support each other in perfect balance.',
      history: 'Established by environmental philosophers who sought to prove that civilization and nature could coexist, the town has become a model for sustainable living.',
      dangers: [
        'Strict environmental regulations',
        'Overwhelming natural harmony',
        'Gaia\'s judgment of environmental crimes',
        'Ecosystem sensitivity'
      ],
      tips: [
        'Study ecological principles',
        'Respect all forms of life',
        'Learn sustainable living practices',
        'Participate in environmental restoration',
        'Honor Gaia through actions'
      ]
    },
'mother-temple': {
      id: 'mother-temple',
      name: 'Mother Temple',
      regionId: 'terra-madre-basin',
      regionName: 'Terra Madre Basin',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/mother-temple-detailed.png',
      description: 'Sacred temple complex dedicated to the Earth Mother in all her forms, where pilgrims come to seek the blessing of the great goddess who nurtures all life.',
      difficulty: 'Hard',
      elevation: '900 ft',
      temperature: '60°F to 75°F',
      weatherPatterns: 'Sacred atmosphere, gentle earth vibrations',
      accessibility: 'Spiritual pilgrims and earth goddess devotees',
      recommendedLevel: '60+',
      specialFeatures: [
        'Earth Mother Shrine',
        'Universal Goddess Worship',
        'Sacred Earth Rituals',
        'Pilgrimage Destination',
        'Divine Motherhood'
      ],
      wildlife: [
        {
          name: 'Mother\'s Guardian',
          species: 'Gardevoir / Angewomon / Lovander',
          type: 'Psychic/Ground',
          rarity: 'Extreme',
          description: 'Divine protector of the Earth Mother\'s temple'
        },
        {
          name: 'Sacred Bear',
          species: 'Ursaring / Grizzlemon',
          type: 'Normal/Ground',
          rarity: 'Rare',
          description: 'Bears that represent the protective mother aspect'
        },
        {
          name: 'Temple Deer',
          species: 'Sawsbuck / Elecmon / Eikthyrdeer',
          type: 'Normal/Grass',
          rarity: 'Common',
          description: 'Gentle deer that graze in the sacred grounds'
        }
      ],
      resources: [
        {
          name: 'Mother\'s Love',
          rarity: 'Extreme',
          description: 'Direct blessing of unconditional maternal love'
        },
        {
          name: 'Sacred Earth',
          rarity: 'Rare',
          description: 'Soil blessed by the Earth Mother herself'
        },
        {
          name: 'Nurturing Stones',
          rarity: 'Uncommon',
          description: 'Rocks that promote growth and healing'
        }
      ],
      lore: 'The Mother Temple honors the Earth Mother as the source of all life, representing the divine feminine principle that nurtures and protects all creation.',
      history: 'Built by devotees of various earth goddess traditions who recognized the universal nature of the divine mother, the temple welcomes all who seek maternal blessing.',
      dangers: [
        'Overwhelming maternal love',
        'Emotional spiritual experiences',
        'Protective temple guardians',
        'Intensive purification rituals'
      ],
      tips: [
        'Approach with reverence and humility',
        'Bring offerings for the Earth Mother',
        'Prepare for emotional healing',
        'Respect the sacred feminine',
        'Open your heart to maternal love'
      ]
    },
'sacred-canyon': {
      id: 'sacred-canyon',
      name: 'Sacred Canyon',
      regionId: 'terra-madre-basin',
      regionName: 'Terra Madre Basin',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/sacred-canyon-detailed.png',
      description: 'Magnificent canyon carved by earth magic over millennia, where the geological history of the world is written in stone layers and ancient earth spirits dwell.',
      difficulty: 'Hard',
      elevation: '400 ft to 1200 ft',
      temperature: '55°F to 85°F',
      weatherPatterns: 'Temperature variations by depth, earth magic phenomena',
      accessibility: 'Geological researchers and experienced hikers',
      recommendedLevel: '55+',
      specialFeatures: [
        'Geological Time Layers',
        'Ancient Earth Spirits',
        'Natural History',
        'Earth Magic Phenomena',
        'Sacred Stone Formations'
      ],
      wildlife: [
        {
          name: 'Ancient Earth Spirit',
          species: 'Claydol / Gotsumon / Tombat',
          type: 'Ground/Ghost',
          rarity: 'Extreme',
          description: 'Spirits that remember the world\'s formation'
        },
        {
          name: 'Canyon Eagle',
          species: 'Aerodactyl / Aquilamon',
          type: 'Flying/Rock',
          rarity: 'Uncommon',
          description: 'Eagles that nest in the sacred stone walls'
        },
        {
          name: 'Stone Lizard',
          species: 'Onix / Dromon / Dinossom',
          type: 'Rock/Ground',
          rarity: 'Common',
          description: 'Reptiles perfectly camouflaged against canyon walls'
        }
      ],
      resources: [
        {
          name: 'Time Stones',
          rarity: 'Extreme',
          description: 'Rocks that contain memories of geological ages'
        },
        {
          name: 'Canyon Crystals',
          rarity: 'Rare',
          description: 'Gems formed by earth magic over millennia'
        },
        {
          name: 'Sacred Sediment',
          rarity: 'Common',
          description: 'Layers of earth with historical significance'
        }
      ],
      lore: 'Sacred Canyon serves as a natural library of the Earth\'s history, where each stone layer tells the story of geological ages and ancient earth magic.',
      history: 'Carved by earth magic and natural forces over millions of years, the canyon preserves the complete geological history of the region in its stone walls.',
      dangers: [
        'Rockslides and unstable formations',
        'Getting lost in canyon maze',
        'Flash floods during storms',
        'Ancient earth spirit encounters',
        'Extreme temperature variations'
      ],
      tips: [
        'Study geological maps before exploring',
        'Bring climbing and safety equipment',
        'Respect ancient earth spirits',
        'Monitor weather conditions',
        'Travel with experienced guides'
      ]
    },
'tenochtitlan-sky': {
      id: 'tenochtitlan-sky',
      name: 'Tenochtitlan Sky',
      regionId: 'quetzal-winds',
      regionName: 'Quetzal Winds',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/tenochtitlan-sky-detailed.png',
      description: 'Magnificent floating city inspired by the Aztec capital, suspended in the clouds by feathered serpent magic and powered by wind currents from Quetzalcoatl.',
      difficulty: 'Extreme',
      elevation: '15,000 ft',
      temperature: '40°F to 65°F',
      weatherPatterns: 'Floating city weather, wind magic, feathered serpent phenomena',
      accessibility: 'Flying ability required, Aztec cultural knowledge recommended',
      recommendedLevel: '85+',
      specialFeatures: [
        'Floating Aztec Architecture',
        'Feathered Serpent Magic',
        'Sky Temples',
        'Wind-Powered City',
        'Cloud Agriculture'
      ],
      wildlife: [
        {
          name: 'Quetzalcoatl Avatar',
          species: 'Rayquaza / Airdramon / Jetragon',
          type: 'Flying/Dragon',
          rarity: 'Extreme',
          description: 'Divine manifestation of the feathered serpent god'
        },
        {
          name: 'Sky Jaguar',
          species: 'Linoone / SaberLeomon',
          type: 'Flying/Fighting',
          rarity: 'Rare',
          description: 'Sacred jaguars that have learned to fly'
        },
        {
          name: 'Wind Quetzal',
          species: 'Altaria / Peckmon / Galeclaw',
          type: 'Flying/Psychic',
          rarity: 'Uncommon',
          description: 'Magnificent birds with rainbow feathers'
        }
      ],
      resources: [
        {
          name: 'Feathered Serpent Scales',
          rarity: 'Extreme',
          description: 'Divine scales from Quetzalcoatl himself'
        },
        {
          name: 'Sky Gold',
          rarity: 'Rare',
          description: 'Gold blessed by the wind gods'
        },
        {
          name: 'Cloud Jade',
          rarity: 'Uncommon',
          description: 'Jade formed in the sky by wind magic'
        }
      ],
      lore: 'Tenochtitlan Sky represents the pinnacle of Aztec achievement, where the great city was lifted into the heavens by Quetzalcoatl to preserve it from earthly corruption.',
      history: 'Created when the feathered serpent god raised the greatest Aztec city into the sky, the floating metropolis has become a center for wind magic and sky worship.',
      dangers: [
        'Extreme altitude',
        'Risk of falling from floating city',
        'Divine wind magic storms',
        'Feathered serpent trials',
        'Sky temple restrictions'
      ],
      tips: [
        'Master flying or wind magic first',
        'Study Aztec culture and traditions',
        'Bring altitude sickness remedies',
        'Respect Quetzalcoatl worship',
        'Understand floating city protocols'
      ]
    },
'wind-village': {
      id: 'wind-village',
      name: 'Wind Village',
      regionId: 'quetzal-winds',
      regionName: 'Quetzal Winds',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/wind-village-detailed.png',
      description: 'Traditional village where wind mages learn to harness air currents, with buildings designed to channel breezes and ceremonies that call upon the power of the sky.',
      difficulty: 'Medium',
      elevation: '3000 ft',
      temperature: '60°F to 80°F',
      weatherPatterns: 'Constant gentle winds, air magic training effects',
      accessibility: 'Wind magic students and air enthusiasts',
      recommendedLevel: '40+',
      specialFeatures: [
        'Wind Magic Schools',
        'Air Current Channeling',
        'Breeze Architecture',
        'Sky Ceremonies',
        'Flight Training'
      ],
      wildlife: [
        {
          name: 'Wind Sprite',
          species: 'Cutiefly / Fairymon',
          type: 'Flying/Fairy',
          rarity: 'Common',
          description: 'Tiny spirits that dance on air currents'
        },
        {
          name: 'Breeze Cat',
          species: 'Glameow / Gatomon / Bristla',
          type: 'Normal/Flying',
          rarity: 'Common',
          description: 'Cats that can walk on air for short distances'
        },
        {
          name: 'Sky Butterfly',
          species: 'Butterfree / Butterflamon',
          type: 'Bug/Flying',
          rarity: 'Uncommon',
          description: 'Butterflies that ride wind currents for miles'
        }
      ],
      resources: [
        {
          name: 'Bottled Wind',
          rarity: 'Uncommon',
          description: 'Captured air currents for magical use'
        },
        {
          name: 'Wind Chimes',
          rarity: 'Common',
          description: 'Instruments that harmonize with air magic'
        },
        {
          name: 'Flight Feathers',
          rarity: 'Common',
          description: 'Feathers that assist in wind magic'
        }
      ],
      lore: 'Wind Village serves as a training ground for those who wish to master air magic, teaching respect for the sky and harmony with wind currents.',
      history: 'Founded by wind mages who discovered optimal air currents for magical training, the village has become a center for aerial magic education.',
      dangers: [
        'Wind magic training accidents',
        'Sudden air current changes',
        'Flight training mishaps',
        'Altitude-related issues'
      ],
      tips: [
        'Start with basic wind magic theory',
        'Practice balance and coordination',
        'Learn weather pattern recognition',
        'Respect air current safety',
        'Build up altitude tolerance gradually'
      ]
    },
'feather-town': {
      id: 'feather-town',
      name: 'Feather Town',
      regionId: 'quetzal-winds',
      regionName: 'Quetzal Winds',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/feather-town-detailed.png',
      description: 'Colorful town where artisans craft magnificent featherwork art inspired by Quetzalcoatl, creating ceremonial garments and sacred objects from rainbow plumes.',
      difficulty: 'Easy',
      elevation: '2500 ft',
      temperature: '65°F to 85°F',
      weatherPatterns: 'Gentle breezes, colorful feather showers from sky birds',
      accessibility: 'Artists and craft enthusiasts welcome',
      recommendedLevel: '25+',
      specialFeatures: [
        'Featherwork Artisans',
        'Ceremonial Garments',
        'Rainbow Plume Collection',
        'Sacred Art Creation',
        'Cultural Preservation'
      ],
      wildlife: [
        {
          name: 'Rainbow Quetzal',
          species: 'Ho-Oh / Phoenixmon',
          type: 'Flying/Fairy',
          rarity: 'Rare',
          description: 'Birds with the most beautiful feathers in the world'
        },
        {
          name: 'Artisan Bird',
          species: 'Noctowl / Peckmon / Tocotoco',
          type: 'Normal/Flying',
          rarity: 'Common',
          description: 'Birds that help collect and sort feathers'
        },
        {
          name: 'Weaver Spider',
          species: 'Ariados / Arukenimon',
          type: 'Bug/Flying',
          rarity: 'Common',
          description: 'Spiders that create delicate feather-pattern webs'
        }
      ],
      resources: [
        {
          name: 'Sacred Feathers',
          rarity: 'Rare',
          description: 'Plumes blessed by Quetzalcoatl'
        },
        {
          name: 'Ceremonial Garments',
          rarity: 'Uncommon',
          description: 'Beautiful clothing made from rainbow feathers'
        },
        {
          name: 'Artisan Tools',
          rarity: 'Common',
          description: 'Specialized equipment for featherwork'
        }
      ],
      lore: 'Feather Town preserves the ancient Aztec art of featherwork, creating sacred objects that honor Quetzalcoatl and celebrate the beauty of the sky.',
      history: 'Established by master featherworkers who sought to preserve traditional Aztec arts, the town has become famous for its magnificent ceremonial creations.',
      dangers: [
        'Allergic reactions to exotic feathers',
        'Competition among artisans',
        'Cultural appropriation concerns',
        'Expensive art materials'
      ],
      tips: [
        'Learn about Aztec featherwork traditions',
        'Respect the cultural significance of designs',
        'Support local artisans',
        'Study color theory and patterns',
        'Appreciate the sacred nature of the craft'
      ]
    },
'serpent-pyramid': {
      id: 'serpent-pyramid',
      name: 'Serpent Pyramid',
      regionId: 'quetzal-winds',
      regionName: 'Quetzal Winds',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/serpent-pyramid-detailed.png',
      description: 'Massive step pyramid dedicated to Quetzalcoatl, where the feathered serpent\'s power is strongest and wind magic reaches its most potent form during ceremonies.',
      difficulty: 'Extreme',
      elevation: '4000 ft',
      temperature: '50°F to 75°F',
      weatherPatterns: 'Divine wind phenomena, feathered serpent manifestations',
      accessibility: 'Extreme sacred site - priests and proven devotees only',
      recommendedLevel: '90+',
      specialFeatures: [
        'Divine Quetzalcoatl Temple',
        'Feathered Serpent Power',
        'Wind Magic Amplification',
        'Sacred Ceremonies',
        'Divine Manifestations'
      ],
      wildlife: [
        {
          name: 'Feathered Serpent God',
          species: 'Rayquaza / Seraphimon',
          type: 'Flying/Dragon',
          rarity: 'Extreme',
          description: 'Quetzalcoatl himself in his full divine glory'
        },
        {
          name: 'Temple Guardian',
          species: 'Salamence / WarGreymon / Jetragon',
          type: 'Flying/Fighting',
          rarity: 'Rare',
          description: 'Divine protectors of the sacred pyramid'
        },
        {
          name: 'Wind Priest',
          species: 'Alakazam / Wisemon',
          type: 'Psychic/Flying',
          rarity: 'Rare',
          description: 'Human servants blessed with flight'
        }
      ],
      resources: [
        {
          name: 'Divine Wind Magic',
          rarity: 'Extreme',
          description: 'Ultimate mastery of air and sky power'
        },
        {
          name: 'Serpent Wisdom',
          rarity: 'Extreme',
          description: 'Ancient knowledge from Quetzalcoatl'
        },
        {
          name: 'Sacred Wind Stones',
          rarity: 'Rare',
          description: 'Stones that channel divine wind power'
        }
      ],
      lore: 'The Serpent Pyramid is the most sacred site of Quetzalcoatl worship, where the feathered serpent god reveals his greatest mysteries to worthy devotees.',
      history: 'Built by the greatest Aztec architects under divine guidance, the pyramid serves as a bridge between earth and sky, mortality and divinity.',
      dangers: [
        'Direct divine presence',
        'Overwhelming wind magic',
        'Divine trials and judgment',
        'Feathered serpent tests',
        'Sacred site violations'
      ],
      tips: [
        'Complete extensive spiritual preparation',
        'Study Quetzalcoatl mythology thoroughly',
        'Prove devotion through service',
        'Approach with utmost reverence',
        'Be prepared for divine transformation'
      ]
    },
'floating-gardens': {
      id: 'floating-gardens',
      name: 'Floating Gardens',
      regionId: 'quetzal-winds',
      regionName: 'Quetzal Winds',
      landmassId: 'conoco-island',
      landmassName: 'Conoco Island',
      image: '/images/maps/areas/floating-gardens-detailed.png',
      description: 'Magical gardens suspended in mid-air by wind magic, where rare plants grow without soil and aerial agriculture produces unique fruits and flowers.',
      difficulty: 'Hard',
      elevation: '5000 ft',
      temperature: '55°F to 75°F',
      weatherPatterns: 'Carefully controlled wind currents, magical plant growth',
      accessibility: 'Aerial botanists and wind magic practitioners',
      recommendedLevel: '65+',
      specialFeatures: [
        'Aerial Agriculture',
        'Floating Plant Beds',
        'Wind Magic Cultivation',
        'Sky Botany',
        'Magical Horticulture'
      ],
      wildlife: [
        {
          name: 'Sky Gardener',
          species: 'Trevenant / Lilamon',
          type: 'Grass/Flying',
          rarity: 'Rare',
          description: 'Plant spirits that tend the floating gardens'
        },
        {
          name: 'Nectar Hummingbird',
          species: 'Comfey / Fairymon / Necromus',
          type: 'Flying/Fairy',
          rarity: 'Common',
          description: 'Tiny birds that pollinate aerial flowers'
        },
        {
          name: 'Wind Flower',
          species: 'Whimsicott / Floramon',
          type: 'Grass/Flying',
          rarity: 'Uncommon',
          description: 'Living plants that float freely through the air'
        }
      ],
      resources: [
        {
          name: 'Sky Fruits',
          rarity: 'Rare',
          description: 'Fruits that can only grow in floating gardens'
        },
        {
          name: 'Wind Pollen',
          rarity: 'Uncommon',
          description: 'Magical pollen that enhances plant growth'
        },
        {
          name: 'Aerial Seeds',
          rarity: 'Common',
          description: 'Seeds adapted for growth without soil'
        }
      ],
      lore: 'The Floating Gardens represent the mastery of combining wind magic with botanical knowledge, creating impossible agricultural systems that defy gravity.',
      history: 'Developed by Aztec agricultural mages who learned to use wind magic for farming, the gardens have become a marvel of magical engineering.',
      dangers: [
        'Falling from floating platforms',
        'Wind magic plant interactions',
        'Unstable floating garden sections',
        'Magical pollen allergies',
        'Navigation difficulties in 3D space'
      ],
      tips: [
        'Master basic flight or wind magic',
        'Study aerial botany principles',
        'Wear safety harnesses',
        'Learn to navigate in three dimensions',
        'Respect the delicate magical balance'
      ]
    },
'storm-district': {
      id: 'storm-district',
      name: 'Storm District',
      regionId: 'nimbus-capital',
      regionName: 'Nimbus Capital',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/storm-district-detailed.png',
      description: 'Commercial district powered by controlled lightning, where sky merchants trade wind-forged goods.',
      difficulty: 'Hard',
      elevation: '10,000 ft',
      temperature: '30°F to 50°F',
      weatherPatterns: 'Controlled lightning, wind currents',
      accessibility: 'Commerce permit required',
      recommendedLevel: '70+',
      specialFeatures: [
        'Lightning Power',
        'Sky Markets',
        'Wind Forges',
        'Storm Commerce'
      ],
      wildlife: [
        {
          name: 'Storm Merchant',
          species: 'Magnezone / Andromon / Sparkit',
          type: 'Electric/Flying',
          rarity: 'Uncommon',
          description: 'Traders who harness storm energy'
        },
        {
          name: 'Lightning Courier',
          species: 'Jolteon / Elecmon',
          type: 'Electric',
          rarity: 'Common',
          description: 'Fast messengers powered by electricity'
        },
        {
          name: 'Thunder Bird',
          species: 'Zapdos / Birddramon / Beakon',
          type: 'Electric/Flying',
          rarity: 'Rare',
          description: 'Majestic birds that channel lightning'
        }
      ],
      resources: [
        {
          name: 'Storm Silk',
          rarity: 'Rare',
          description: 'Fabric woven from controlled lightning'
        }
      ],
      lore: 'The commercial heart of the sky kingdom.',
      history: 'Established as the main trading hub of Nimbus Capital.',
      dangers: ['Electrical discharge', 'Wind shear'],
      tips: ['Carry storm insurance', 'Learn sky merchant customs']
    },
'sky-harbor': {
    id: 'sky-harbor',
    name: 'Sky Harbor',
    regionId: 'nimbus-capital',
    regionName: 'Nimbus Capital',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/areas/sky-harbor-detailed.png',
    description: 'Aerial docking nexus of solidified air platforms coordinating wind vessel traffic and migratory flock lanes.',
    difficulty: 'Hard',
    elevation: '11,400 ft',
    temperature: '25°F to 45°F',
    weatherPatterns: 'Layered slipstream corridors, scheduled downdraft windows',
    accessibility: 'Licensed flight clearance',
    recommendedLevel: '65-90',
    specialFeatures: [
      'Aerial Dock Platforms',
      'Wind Vessel Repair Gantries',
      'Slipstream Control Tower',
      'Feather Beacon Grid'
    ],
    wildlife: [
      { name: 'Harbor Glider', species: 'Wingull / Peckmon / Galeclaw', type: 'Flying/Water', rarity: 'Common', description: 'Guides incoming craft through slip lanes.' },
      { name: 'Beacon Wisp', species: 'Lampent / Candlemon / Lumoth', type: 'Ghost/Fire', rarity: 'Uncommon', description: 'Maintains luminous navigation pylons.' },
      { name: 'Dock Sentinel', species: 'Skarmory / Guardromon / MetalGarurumon', type: 'Flying/Steel', rarity: 'Rare', description: 'Patrols for structural strain micro-fractures.' }
    ],
    resources: [
      { name: 'Slipstream Chart Fragment', rarity: 'Rare', description: 'Improves travel efficiency between sky hubs.' },
      { name: 'Feather Beacon Lens', rarity: 'Uncommon', description: 'Amplifies directional signal clarity.' },
      { name: 'Cloudfast Resin', rarity: 'Common', description: 'Sealant stabilizing solid-air seams.' }
    ],
    lore: 'Harbor harmonics align with migrating jet patterns to reduce turbulence.',
    history: 'Expanded after tri-lane congestion studies introduced beacon grid optimization.',
    dangers: ['Crosslane collisions', 'Downdraft loss of lift', 'Signal desync'],
    tips: ['File flight plans early', 'Check beacon sync pulses', 'Secure cargo to anti-slip rings']
  },
    'wind-gardens': {
      id: 'wind-gardens',
      name: 'Wind Gardens',
      regionId: 'nimbus-capital',
      regionName: 'Nimbus Capital',
      landmassId: 'sky-isles',
      landmassName: 'Sky Isles',
      image: '/images/maps/areas/wind-gardens-detailed.png',
      description: 'Suspended horticulture platforms cultivating aerophyte matrices on tuned jetstream vortices.',
      difficulty: 'Medium',
      elevation: 'High-altitude aeroponic tiers',
      temperature: '34°F to 52°F (wind chill lower)',
      weatherPatterns: 'Laminar flow bursts, pollen spiral eddies',
      accessibility: 'Stabilized lift rings & glide gantries',
      recommendedLevel: '35-65',
      specialFeatures: [
        'Jetstream Pruning Arrays',
        'Aerophyte Seed Vaults',
        'Wind Pollination Conduits',
        'Sky Nectar Suspension Pods'
      ],
      wildlife: [
        { name: 'Pollen Wisp', species: 'Hoppip / Motimon / Teafant', type: 'Grass/Flying', rarity: 'Common', description: 'Drifts distributing micro spore clusters.' },
        { name: 'Glide Gardener', species: 'Skiploom / Kazemon / Petallia', type: 'Grass/Fairy', rarity: 'Uncommon', description: 'Manages airflow trimming patterns.' },
        { name: 'Jetstream Curator', species: 'Jumpluff / Wisemon / Lumira', type: 'Grass/Flying', rarity: 'Rare', description: 'Optimizes vortex nutrient circulation.' }
      ],
      resources: [
        { name: 'Aero Spore Sachet', rarity: 'Common', description: 'Packet of buoyant fertilizing spores.' },
        { name: 'Jetstream Filament', rarity: 'Uncommon', description: 'Tension strand sustaining lift ring stability.' },
        { name: 'Sky Nectar Ampoule', rarity: 'Rare', description: 'Concentrated airborne floral extract.' }
      ],
      lore: 'Gardeners pioneered airflow nutrient cycling replacing soil medium dependency.',
      history: 'Expanded after successful frost resilience graft trials.',
      dangers: ['Crosswind shear', 'Lift ring destabilization'],
      tips: ['Clip harness at all times', 'Monitor wind shear index', 'Seal pollen containers']
    },
'emberforge-settlement': {
    id: 'emberforge-settlement',
    name: 'Emberforge Settlement',
    regionId: 'volcanic-peaks',
    regionName: 'Volcanic Peaks',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/emberforge-settlement-detailed.png',
    description: 'Perched on a cliff above molten flows, the Emberforge Settlement is the tribal heart of the Emberkin, where lava-tempered forges and drake stables coalesce under the watchful glow of active vents.',
    difficulty: 'Medium',
    elevation: '3,700 ft',
    temperature: '100°F to 130°F',
    weatherPatterns: 'Scorching heat, ember winds, magma haze',
    accessibility: 'Cliffside paths, heat-shielded walkways, lava-rafting docks',
    recommendedLevel: '45-60',
    specialFeatures: [
      'Lava-quenched Forges',
      'Drake Stables',
      'Molten Lacquer Workshops'
    ],
    wildlife: [
      {
        name: 'Stormscale',
        species: 'Zekrom / WarGreymon / Raijin / Palmon / Voltfin',
        type: 'Electric/Dragon',
        rarity: 'Legendary',
        description: 'A colossal drake crackling with electric fury, sometimes seen spiraling above the forges in dazzling displays of storm and flame.'
      },
      {
        name: 'Granitusk',
        species: 'Tyranitar / Magmemon / Oni / Palmon / Basaltigon',
        type: 'Rock/Ground',
        rarity: 'Rare',
        description: 'A hulking behemoth whose hide resembles living stone — often called upon by tribal smiths to quarry crimson iron from deep fissures.'
      },
      {
        name: 'Windflock',
        species: 'Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart',
        type: 'Normal/Flying',
        rarity: 'Common',
        description: 'A swift hunting flock whose floral-patterned crests shimmer in the heat haze as they dive in perfect formation.'
      }
    ],
    resources: [
      { name: 'Sacred Obsidian', type: 'Mineral', rarity: 'Uncommon', description: 'Volcanic glass revered for durability and ritual uses.' },
      { name: 'Ember Lotus Petals', type: 'Botanical', rarity: 'Rare', description: 'Flowers that thrive in ash-rich soil, used in tribal ceremonies.' },
      { name: 'Crimson Iron', type: 'Metal', rarity: 'Rare', description: 'Iron ore infused with volcanic heat, prized by smiths.' }
    ],
    lore: 'The forge fires here are said to be lit by the breath of sleeping titans.',
    history: 'Founded when Emberkin shamans first tamed the local drakes over a millennium ago.',
    dangers: ['Falling from cliffside', 'Drake aggression', 'Molten splatter'],
    tips: ['Secure all gear', 'Offer tribute to the drake broodmother', 'Stay within tribal guidelines']
  },
'sacred-caldera': {
    id: 'sacred-caldera',
    name: 'Sacred Caldera',
    regionId: 'volcanic-peaks',
    regionName: 'Volcanic Peaks',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/sacred-caldera-detailed.png',
    description: 'The hollow heart of the largest volcano, revered as the seat of the Fire Leviathan, where Emberkin shamans convene to enact dawn-and-dusk rituals.',
    difficulty: 'Extreme',
    elevation: '4,200 ft',
    temperature: '120°F to 180°F',
    weatherPatterns: 'Volcanic storms, ash showers, ritual mists',
    accessibility: 'Sealed pathways, sanctioned ritual routes',
    recommendedLevel: '65-80',
    specialFeatures: [
      'Leviathan’s Seal',
      'Ritual Pyres',
      'Molten Glyphs'
    ],
    wildlife: [
      {
        name: 'Stormscale',
        species: 'Zekrom / WarGreymon / Raijin / Palmon / Voltfin',
        type: 'Electric/Dragon',
        rarity: 'Legendary',
        description: 'Circling the caldera rim in thunderous arcs, its roar echoes like distant drums during ceremonies.'
      },
      {
        name: 'Granitusk',
        species: 'Tyranitar / Magmemon / Oni / Palmon / Basaltigon',
        type: 'Rock/Ground',
        rarity: 'Rare',
        description: 'Drawn by the pulsing energy of the seal, these guardians stand sentinel on the lava-scarred slopes.'
      },
      {
        name: 'Windflock',
        species: 'Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart',
        type: 'Normal/Flying',
        rarity: 'Common',
        description: 'Flitting through ash clouds, these birds carry embers in their feathers to spread the shamans’ rites.'
      }
    ],
    resources: [
      { name: 'Leviathan’s Tear', type: 'Crystal', rarity: 'Extreme', description: 'Gemstone formed from volcanic tears of the Fire Leviathan.' },
      { name: 'Ash-Cloaked Ember', type: 'Element', rarity: 'Rare', description: 'Particles of pure ritual ash used in awakening ceremonies.' },
      { name: 'Glyphic Forge', type: 'Relic', rarity: 'Rare', description: 'Ancient carved stones that guide pyrokinetic flows.' }
    ],
    lore: 'Legend states the caldera floor is shaped by the Leviathan’s dreams.',
    history: 'Formed in the cataclysmic Eruption of the Titanic Fire millennia ago.',
    dangers: ['Ritual backlash', 'Ash suffocation', 'Guardian patrols'],
    tips: ['Follow shaman’s chants', 'Wear ash-forged talismans', 'Maintain silence near the seal']
  },
'drakescale-ridge': {
    id: 'drakescale-ridge',
    name: 'Drakescale Ridge',
    regionId: 'volcanic-peaks',
    regionName: 'Volcanic Peaks',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/drakescale-ridge-detailed.png',
    description: 'Jagged obsidian spires where Ember Drakes bask on hot stone, fiercely defending their nests from all intruders.',
    difficulty: 'Hard',
    elevation: '2,800 - 3,500 ft',
    temperature: '110°F to 150°F',
    weatherPatterns: 'Blistering sun, heat mirages, ash gusts',
    accessibility: 'Obsidian steps, natural dread paths',
    recommendedLevel: '50-70',
    specialFeatures: [
      'Drake Nests',
      'Smoking Spires',
      'Scale Harvest Grounds'
    ],
    wildlife: [
      {
        name: 'Stormscale',
        species: 'Zekrom / WarGreymon / Raijin / Palmon / Voltfin',
        type: 'Electric/Dragon',
        rarity: 'Legendary',
        description: 'Perching atop the tallest spires, its electric wings create thunderous rockfalls.'
      },
      {
        name: 'Granitusk',
        species: 'Tyranitar / Magmemon / Oni / Palmon / Basaltigon',
        type: 'Rock/Ground',
        rarity: 'Rare',
        description: 'Roaming between nests to keep smaller predators at bay, its footsteps crack the basalt underfoot.'
      },
      {
        name: 'Windflock',
        species: 'Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart',
        type: 'Normal/Flying',
        rarity: 'Common',
        description: 'Sweeping through the ridge in migratory bands, scattering embers like falling leaves.'
      }
    ],
    resources: [
      { name: 'Drake Scale', type: 'Armor Material', rarity: 'Uncommon', description: 'Tough scales shed by Ember Drakes used in tribal armor.' },
      { name: 'Obsidian Shards', type: 'Crystal', rarity: 'Common', description: 'Sharp glass fragments scattered across the ridge.' },
      { name: 'Heatstone', type: 'Mineral', rarity: 'Rare', description: 'Concentrated heat crystals found near nest entrances.' }
    ],
    lore: 'Each scale on this ridge is said to bear the mark of a drake’s triumph in tribal contests.',
    history: 'Shaped by centuries of drake flight and tribal beacon fires.',
    dangers: ['Nest aggression', 'Loose spires', 'Heat exhaustion'],
    tips: ['Move quietly', 'Offer scale tributes', 'Keep to ash-lined trails']
  },
'obsidian-halls': {
    id: 'obsidian-halls',
    name: 'Obsidian Halls',
    regionId: 'volcanic-peaks',
    regionName: 'Volcanic Peaks',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/obsidian-halls-detailed.png',
    description: 'A labyrinth of volcanic glass caverns where Flame Shamans commune with Forge Spirits amid flickering embers.',
    difficulty: 'Extreme',
    elevation: '1,200 ft',
    temperature: '100°F to 140°F',
    weatherPatterns: 'Ethereal embers, echoing whispers, thermal drafts',
    accessibility: 'Shamanic gates, ember-lit corridors',
    recommendedLevel: '60-80',
    specialFeatures: [
      'Spirit Chambers',
      'Crystalized Lava Pools',
      'Echoing Halls'
    ],
    wildlife: [
      {
        name: 'Stormscale',
        species: 'Zekrom / WarGreymon / Raijin / Palmon / Voltfin',
        type: 'Electric/Dragon',
        rarity: 'Legendary',
        description: 'Gliding silently through the halls, it illuminates crystal veins with arcs of lightning.'
      },
      {
        name: 'Granitusk',
        species: 'Tyranitar / Magmemon / Oni / Palmon / Basaltigon',
        type: 'Rock/Ground',
        rarity: 'Rare',
        description: 'Its rumbling growl causes the glass walls to hum with resonant frequency.'
      },
      {
        name: 'Windflock',
        species: 'Talonflame / Birdramon / Karasu Tengu / Palmon / Skydart',
        type: 'Normal/Flying',
        rarity: 'Common',
        description: 'Their wings stir embers into glowing patterns across the polished obsidian floor.'
      }
    ],
    resources: [
      { name: 'Spirit Ember', type: 'Energy', rarity: 'Extreme', description: 'Concentrated ember imbued with spirit essence.' },
      { name: 'Obsidian Mirror', type: 'Relic', rarity: 'Rare', description: 'Reflective shards used in shamanic rituals.' },
      { name: 'Lava Pearl', type: 'Gemstone', rarity: 'Rare', description: 'Small spheres formed in the deepest pools.' }
    ],
    lore: 'The halls resonate with the voices of past shamans channeling volcanic spirits.',
    history: 'Carved by ancient rituals to house the Forge Spirits at the world’s creation.',
    dangers: ['Spirit possession', 'Glass spires', 'Heat pulses'],
    tips: ['Carry spirit wards', 'Follow ember guides', 'Respect the silence']
  },
  // Newly added Conoco Island advanced areas
  'adamant-peak': {
    id: 'adamant-peak',
    name: 'Adamant Peak',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/adamant-peak-detailed.png',
    description: 'A razor-edged volcanic summit where molten veins harden into crystal-steel spires resonating with geomagnetic force.',
    difficulty: 'Hard',
    elevation: '9,800 ft',
    temperature: '85°F to 120°F (vent proximity)',
    weatherPatterns: 'Superheated updrafts, metallic dust flurries, magnetic pulses',
    accessibility: 'Requires Heat Shield Plating & climbing gear',
    recommendedLevel: '55-75',
    specialFeatures: [
      'Crystal-Steel Spires',
      'Magnet Surge Fields',
      'Slag Waterfalls',
      'Harmonic Ore Veins'
    ],
    wildlife: [
      {
        name: 'Ferronyx',
        species: 'Steelix / MetalGreymon / Astegon',
        type: 'Steel/Rock',
        rarity: 'Rare',
        description: 'Serpentine ore wyrm whose segmented magnetic plates vibrate to deflect projectiles.'
      },
      {
        name: 'Moltracore',
        species: 'Magmortar / SkullMeramon / Blazamut',
        type: 'Fire/Steel',
        rarity: 'Uncommon',
        description: 'Portable forge-beast whose arm vents extrude hardening alloy droplets mid-battle.'
      },
      {
        name: 'Shardwing',
        species: 'Skarmory / Cyberdramon / Jetragon',
        type: 'Steel/Flying',
        rarity: 'Common',
        description: 'Glides between superheated thermals, scattering reflective flakes that distort targeting.'
      }
    ],
    resources: [
      { name: 'Adamant Lattice', rarity: 'Rare', description: 'Interlocked crystal-steel mesh ideal for high-grade armor cores.' },
      { name: 'Magnetic Flux Core', rarity: 'Uncommon', description: 'Stabilized polarity nucleus harvested after magnet storms.' },
      { name: 'Slag Glass', rarity: 'Common', description: 'Cooled metallic glass formed from rapid lava quenching.' }
    ],
    lore: 'Said to be the mountain where the First Forge Spirit tempered dawnlight into metal.',
    history: 'Mining clans once warred over the harmonic veins until a molten collapse sealed most tunnels.',
    dangers: ['Magnet storms', 'Shattering spirefall', 'Toxic metallic fumes', 'Heat exhaustion'],
    tips: ['Carry polarity stabilizers', 'Monitor core temperature', 'Avoid fresh slag flows', 'Anchor gear in gust zones']
  },
  'ancient-reef': {
    id: 'ancient-reef',
    name: 'Ancient Reef',
    regionId: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/ancient-reef-detailed.png',
    description: 'A bioluminescent coral labyrinth where psychic tides preserve fossil memories in living polyps.',
    difficulty: 'Hard',
    elevation: 'Sea Level (submerged terraces -120 ft)',
    temperature: '58°F to 72°F',
    weatherPatterns: 'Tidal resonance pulses, plankton blooms, gentle current spirals',
    accessibility: 'Advanced Diving Gear & sonar navigator required',
    recommendedLevel: '50-70',
    specialFeatures: [
      'Memory Coral Vaults',
      'Luminescent Galleries',
      'Sonar Obelisks',
      'Relic Sediment Caverns'
    ],
    wildlife: [
      {
        name: 'Neurokelp',
        species: 'Lanturn / Seadramon / Lovander',
        type: 'Water/Electric',
        rarity: 'Uncommon',
        description: 'Communicates via pulsed bioluminescence that entrains nearby schools.'
      },
      {
        name: 'Reef Oracle',
        species: 'Slowking / Wisemon / Lunaris',
        type: 'Water/Psychic',
        rarity: 'Rare',
        description: 'Houses centuries of tidal data in its coral crown nodules.'
      },
      {
        name: 'Shellspine Scout',
        species: 'Cloyster / Armadillomon / Pengullet',
        type: 'Water/Ice',
        rarity: 'Common',
        description: 'Rolls along reef ledges filtering microcrystals into defensive spines.'
      }
    ],
    resources: [
      { name: 'Memory Polyp', rarity: 'Rare', description: 'Coral node storing residual psychic impressions.' },
      { name: 'Tidal Relic Shard', rarity: 'Uncommon', description: 'Weathered fragment from pre-flood structures.' },
      { name: 'Glow Plankton Gel', rarity: 'Common', description: 'Viscous light-emitting suspension for alchemical inks.' }
    ],
    lore: 'Local legends claim each moon cycle imprints a new layer of the world’s history into the reef.',
    history: 'Formed around submerged temples whose carvings now guide migrating hybrids.',
    dangers: ['Disorienting biolight patterns', 'Air depletion', 'Hidden drop chasms', 'Aggressive territorial eels'],
    tips: ['Map pulse intervals', 'Carry redundant oxygen', 'Avoid over-glow zones', 'Use low-intensity lamps']
  },
  'time-pools': {
    id: 'time-pools',
    name: 'Time Pools',
    regionId: 'crystal-cove',
    regionName: 'Crystal Cove',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/time-pools-detailed.png',
    description: 'Tidal basin cluster where microcurrents accelerate or stall chronology, forming layered temporal eddies.',
    difficulty: 'Extreme',
    elevation: 'Intertidal shelf depressions',
    temperature: '60°F to 72°F (localized variance)',
    weatherPatterns: 'Chrono ripple refractions, mist halos',
    accessibility: 'Stabilized reef walkway (timing clearance)',
    recommendedLevel: '75-105',
    specialFeatures: [
      'Time Distortion Pools',
      'Chrono Ebb Channels',
      'Temporal Speed Lanes',
      'Anomaly Observation Deck'
    ],
    wildlife: [
      { name: 'Phase Minnow', species: 'Remoraid / Syakomon / Sparkit', type: 'Water/Electric', rarity: 'Common', description: 'Blink-swims across slowed eddy boundaries.' },
      { name: 'Chrono Jelly', species: 'Tentacruel / Clockmon / Lumira', type: 'Water/Psychic', rarity: 'Uncommon', description: 'Expands bells to stabilize time shear edges.' },
      { name: 'Anomaly Ray', species: 'Starmie / Wisemon / Beakon', type: 'Water/Psychic', rarity: 'Rare', description: 'Charts layered current drift trajectories.' }
    ],
    resources: [
      { name: 'Temporal Brine Sample', rarity: 'Rare', description: 'Fluid retaining shifted time dilation signature.' },
      { name: 'Ebb Core Pebble', rarity: 'Uncommon', description: 'Stone flickering slightly between patina states.' },
      { name: 'Pulse Foam Residue', rarity: 'Common', description: 'Light froth used to calibrate chrono instruments.' }
    ],
    lore: 'Sages claim each pool resonates with a distinct historical tide pattern.',
    history: 'Mapped after synchronized lunar surge exposed inner eddies.',
    dangers: ['Temporal disorientation', 'Equipment desynchronization', 'Accelerated fatigue'],
    tips: ['Set dual time beacons', 'Limit exposure in fast lanes', 'Log perceived vs absolute intervals']
  },
  'apex-throne': {
    id: 'apex-throne',
    name: 'Apex Throne',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/apex-throne-detailed.png',
    description: 'Caldera dais crowned by converging jetstreams where apex predators contest volcanic sovereignty.',
    difficulty: 'Extreme',
    elevation: '10,500 ft (caldera rim)',
    temperature: '70°F to 105°F (volatile spikes)',
    weatherPatterns: 'Jetstream shears, ash vortices, thermal roar cycles',
    accessibility: 'Apex Sigil & flight or advanced climbing harness',
    recommendedLevel: '80-100',
    specialFeatures: [
      'Dominance Ring Terraces',
      'Basalt Resonance Pillars',
      'Jetstream Funnels',
      'Trial Scar Ridges'
    ],
    wildlife: [
      {
        name: 'Pyrodrake Regent',
        species: 'Charizard / KaiserGreymon / Jetragon',
        type: 'Fire/Dragon',
        rarity: 'Rare',
        description: 'Marks territory with spiral thermal updraft signatures.'
      },
      {
        name: 'Umbra Talon',
        species: 'Honchkrow / Devimon / Necromus',
        type: 'Dark/Flying',
        rarity: 'Uncommon',
        description: 'Circles battle rings awaiting weakened challengers.'
      },
      {
        name: 'Seismiscar',
        species: 'Garchomp / SkullGreymon / Blazamut',
        type: 'Dragon/Ground',
        rarity: 'Common',
        description: 'Burrows through semi-molten layers creating tremor pitfalls.'
      }
    ],
    resources: [
      { name: 'Apex Ember Crest', rarity: 'Rare', description: 'Coal-black plate etched by dominance trial flames.' },
      { name: 'Jetstream Feather', rarity: 'Uncommon', description: 'Aerodynamically perfect vane accelerating skill channeling.' },
      { name: 'Seismic Core Fragment', rarity: 'Common', description: 'Vibration-damped shard used in stabilization gear.' }
    ],
    lore: 'Only those whose roar resonates with the caldera’s pulse may sit upon the throne stones.',
    history: 'Site of historic convergence cycles where regional lineages determined succession.',
    dangers: ['Multi-front ambushes', 'Thermal shear gusts', 'Ash inhalation', 'Molten rim collapses'],
    tips: ['Monitor tremor cadence', 'Bring respiratory filters', 'Limit prolonged hovering', 'Engage one challenger at a time']
  },
  'apollo-temple': {
    id: 'apollo-temple',
    name: 'Apollo Temple',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/apollo-temple-detailed.png',
    description: 'Heliotropic sanctum whose mirrored pylons focus solar flares into radiant hymn corridors.',
    difficulty: 'Hard',
    elevation: '8,900 ft',
    temperature: '75°F to 115°F (solar alignments)',
    weatherPatterns: 'Solar beam refractions, incense thermals, prismatic haze',
    accessibility: 'Solar Lens Key & flame rite attunement',
    recommendedLevel: '60-80',
    specialFeatures: [
      'Mirror Array Plazas',
      'Glyph Projection Vault',
      'Incense Therm Columns',
      'Radiant Choir Chamber'
    ],
    wildlife: [
      {
        name: 'Solar Seraph',
        species: 'Espeon / Angewomon / Paladius',
        type: 'Psychic/Fairy',
        rarity: 'Rare',
        description: 'Radiant wings refract coherent light into sigil shields.'
      },
      {
        name: 'Flare Oracle',
        species: 'Ninetales / Wisemon / Lovander',
        type: 'Fire/Psychic',
        rarity: 'Uncommon',
        description: 'Tail embers trace predictive solar glyph arcs.'
      },
      {
        name: 'Helio Sprite',
        species: 'Clefairy / Candlemon / Foxparks',
        type: 'Fairy/Fire',
        rarity: 'Common',
        description: 'Drifts between mirror pedestals maintaining luminous resonance.'
      }
    ],
    resources: [
      { name: 'Prism Core', rarity: 'Rare', description: 'Facet crystal storing concentrated aligned sunlight.' },
      { name: 'Incense Ash Resin', rarity: 'Uncommon', description: 'Catalytic binder improving focus rituals.' },
      { name: 'Mirror Shard Filament', rarity: 'Common', description: 'Flexible reflective thread for beam routing.' }
    ],
    lore: 'Built where dawn’s first ray once ignited an eternal wick.',
    history: 'Expanded by pilgrimage orders refining heliomancy over generations.',
    dangers: ['Retina scorch risk', 'Overheated mirror arrays', 'Glyph guardian trials'],
    tips: ['Wear lens filters', 'Time entry off-peak', 'Respect silence during hymn resonance']
  },
  'aurora-village': {
    id: 'aurora-village',
    name: 'Aurora Village',
    regionId: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/aurora-village-detailed.png',
    description: 'Crystalline hamlet illuminated nightly by dancing auroral veils refracted through snowglass arches.',
    difficulty: 'Easy',
    elevation: '3,200 ft',
    temperature: '-10°F to 25°F',
    weatherPatterns: 'Calm frost haze, aurora curtains, gentle diamond dust',
    accessibility: 'Maintained ice paths (basic cold gear)',
    recommendedLevel: '10-30',
    specialFeatures: [
      'Snowglass Cabins',
      'Aurora Prism Lanterns',
      'Geothermal Hearth Circles',
      'Crystal Carving Workshops'
    ],
    wildlife: [
      {
        name: 'Glint Hare',
        species: 'Buneary / IceLeomon / Pengullet',
        type: 'Ice/Fairy',
        rarity: 'Common',
        description: 'Leaps create micro-auroral spark trails used for navigation games.'
      },
      {
        name: 'Frost Pixie',
        species: 'Alcremie / Lilamon / Chillet',
        type: 'Fairy/Ice',
        rarity: 'Uncommon',
        description: 'Weaves shimmering flurries that calm agitated beasts.'
      },
      {
        name: 'Volt Puff',
        species: 'Pachirisu / Patamon / Sparkit',
        type: 'Electric/Ice',
        rarity: 'Uncommon',
        description: 'Stores static charge harvested from auroral curtains.'
      }
    ],
    resources: [
      { name: 'Aurora Shard', rarity: 'Uncommon', description: 'Refractive ice crystal retaining faint spectral glow.' },
      { name: 'Geothermal Moss', rarity: 'Common', description: 'Warm cushion plant used in insulation packs.' },
      { name: 'Prism Lantern Core', rarity: 'Rare', description: 'Stabilized light nucleus improving visibility in blizzards.' }
    ],
    lore: 'Villagers believe each aurora ribbon is a woven promise from ancestral guardians.',
    history: 'Founded around a geothermal spring that prevented total winter isolation.',
    dangers: ['Frostbite risk', 'Sudden whiteout squalls', 'Thin ice pockets'],
    tips: ['Layer insulation', 'Follow prism markers', 'Carry heat stones', 'Limit exposure during wind shifts']
  },
  'avalon-city': {
    id: 'avalon-city',
    name: 'Avalon City',
    regionId: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/avalon-city-detailed.png',
    description: 'Mist-crowned floating bastion of terraced lakes and runic aqueduct rings suspended above cascading falls.',
    difficulty: 'Extreme',
    elevation: '1,500 ft (levitating platforms)',
    temperature: '60°F to 78°F',
    weatherPatterns: 'Persistent mist veils, gravity inversion drifts, ionized spray arcs',
    accessibility: 'Aerial Navigators Pass or teleport conduit',
    recommendedLevel: '75-95',
    specialFeatures: [
      'Levitating Terrace Lakes',
      'Runic Aqueduct Rings',
      'Mist Court Plaza',
      'Inversion Fountains'
    ],
    wildlife: [
      {
        name: 'Aquaflare Koi',
        species: 'Milotic / MarineAngemon / Lovander',
        type: 'Water/Fairy',
        rarity: 'Uncommon',
        description: 'Glides through midair water loops leaving glitter wake currents.'
      },
      {
        name: 'Nimbus Ray',
        species: 'Mantine / MagnaAngemon / Jetragon',
        type: 'Water/Flying',
        rarity: 'Rare',
        description: 'Skims inversion fountains harvesting charged mist.'
      },
      {
        name: 'Runic Sentinel',
        species: 'Bronzong / Guardromon / Paladius',
        type: 'Steel/Psychic',
        rarity: 'Uncommon',
        description: 'Patrol automaton stabilizing aqueduct rune cycles.'
      }
    ],
    resources: [
      { name: 'Inversion Core Droplet', rarity: 'Rare', description: 'Condensed anti-grav moisture nucleus.' },
      { name: 'Runic Aquifer Seal', rarity: 'Uncommon', description: 'Inscribed disc regulating water levitation flow.' },
      { name: 'Mist Essence', rarity: 'Common', description: 'Charged vapor condensate for alchemical cooling.' }
    ],
    lore: 'Founded by hydromancers seeking to liberate water from terrestrial bounds.',
    history: 'Expanded ring by ring as levitation matrix stability improved.',
    dangers: ['Slip overfall edges', 'Matrix destabilization surges', 'Runic overload arcs'],
    tips: ['Maintain balance tethers', 'Respect court protocols', 'Monitor inversion gauge', 'Avoid saturated rune nodes']
  },
  // Newly added additional areas
  'bone-citadel': {
    id: 'bone-citadel',
    name: 'Bone Citadel',
    regionId: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/bone-citadel-detailed.png',
    description: 'Necro-glacial fortress grown from titan rib arches and permafrost marrow vaults.',
    difficulty: 'Extreme',
    elevation: '6,400 ft',
    temperature: '-30°F to -5°F',
    weatherPatterns: 'Polar winds, aurora refractions, bone dust flurries',
    accessibility: 'Requires Bone Wayfinder Sigil',
    recommendedLevel: '70-95',
    specialFeatures: [ 'Titan Rib Arches', 'Marrow Crypt Galleries', 'Aurora Ossuaries', 'Runic Femur Pylons' ],
    wildlife: [
      { name: 'Frost Ossilord', species: 'Froslass / SkullGreymon / Chillet', type: 'Ice/Ghost', rarity: 'Rare', description: 'Commands fragment swarms that assemble into bone shields.' },
      { name: 'Marrow Warden', species: 'Avalugg / Andromon / Wumpo', type: 'Ice/Steel', rarity: 'Uncommon', description: 'Patrols vault corridors reinforcing permafrost plate seams.' },
      { name: 'Rib Echo', species: 'Duskull / Bakemon / Foxparks', type: 'Ghost/Fairy', rarity: 'Common', description: 'Faint spirit that amplifies auroral sound waves.' }
    ],
    resources: [
      { name: 'Frozen Marrow Core', rarity: 'Rare', description: 'Dense nutrient crystal used in high-tier restoration brews.' },
      { name: 'Aurora Oss Dust', rarity: 'Uncommon', description: 'Powdered bone that refracts ritual light.' },
      { name: 'Rib Chime Shard', rarity: 'Common', description: 'Hollow sliver producing resonant tones.' }
    ],
    lore: 'Said to have formed where a primordial titan fell and merged with eternal frost.',
    history: 'Expanded by frost clerics binding stray spirits into structural lattice.',
    dangers: ['Bone collapse zones', 'Spectral ambushes', 'Deep frost exposure'],
    tips: ['Carry thermal wards', 'Track echo resonance', 'Avoid uncharted crypt shafts']
  },
  'bone-town': {
    id: 'bone-town',
    name: 'Bone Town',
    regionId: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/bone-town-detailed.png',
    description: 'Frontier settlement built from cleaned giant remains and packed snow mortar.',
    difficulty: 'Medium',
    elevation: '5,900 ft',
    temperature: '-20°F to 10°F',
    weatherPatterns: 'Gentle drift, occasional crystal squalls',
    accessibility: 'Maintained bone causeway',
    recommendedLevel: '30-55',
    specialFeatures: ['Bone Market Row', 'Totem Workshop', 'Marrow Forge'],
    wildlife: [
      { name: 'Totem Prowler', species: 'Sneasel / BlackGatomon / Pengullet', type: 'Ice/Dark', rarity: 'Uncommon', description: 'Guards carved totems from scavengers.' },
      { name: 'Chime Lynx', species: 'Glaceon / Mikemon / Mau', type: 'Ice/Fairy', rarity: 'Common', description: 'Tail bells ring to warn of frost spirits.' },
      { name: 'Scrap Geist', species: 'Shuppet / Candlemon / Foxparks', type: 'Ghost/Normal', rarity: 'Common', description: 'Animated trinket cluster roaming alleys.' }
    ],
    resources: [
      { name: 'Bone Bead', rarity: 'Common', description: 'Carved token used as local currency marker.' },
      { name: 'Marrow Wax', rarity: 'Uncommon', description: 'Insulating sealant for cold gear seams.' },
      { name: 'Frost Totem Chip', rarity: 'Rare', description: 'Runic fragment retaining minor ward charge.' }
    ],
    lore: 'Built by traders who settled near ossuary salvage routes.',
    history: 'Grew as a neutral exchange point between roaming frost clans.',
    dangers: ['Spirit pickpockets', 'Frost nip', 'Loose vertebra debris'],
    tips: ['Secure packs', 'Warm hands often', 'Support local artisans']
  },
  'cairn-town': {
    id: 'cairn-town',
    name: 'Cairn Town',
    regionId: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/cairn-town-detailed.png',
    description: 'Stone cairn settlement where stacked rune-stones track migratory ice flows.',
    difficulty: 'Medium',
    elevation: '5,500 ft',
    temperature: '-15°F to 15°F',
    weatherPatterns: 'Stable cold, aurora bands, rune glow fog',
    accessibility: 'Marked cairn path network',
    recommendedLevel: '25-50',
    specialFeatures: ['Alignment Plazas', 'Rune Lichen Walls', 'Stone Forecast Grid'],
    wildlife: [
      { name: 'Runestone Pup', species: 'Rockruff / Terriermon / Depresso', type: 'Rock/Fairy', rarity: 'Common', description: 'Carries small engraved pebbles to elders.' },
      { name: 'Glacier Skink', species: 'Snom / Icemon / Surfent', type: 'Ice/Bug', rarity: 'Common', description: 'Adheres to rune faces absorbing frost patterns.' },
      { name: 'Cairn Watcher', species: 'Graveler / Golemon / Mossanda', type: 'Rock/Ice', rarity: 'Uncommon', description: 'Rearranges itself to correct misaligned markers.' }
    ],
    resources: [
      { name: 'Rune Flake', rarity: 'Common', description: 'Thin chipped slate with residual sigil trace.' },
      { name: 'Lichen Spore Pouch', rarity: 'Uncommon', description: 'Bioluminescent seed cluster for marking routes.' },
      { name: 'Alignment Core Stone', rarity: 'Rare', description: 'Perfectly balanced geode aiding calibration.' }
    ],
    lore: 'Every cairn shadow at solstice is recorded in village annals.',
    history: 'Founded by migratory chart keepers mapping permafrost drift.',
    dangers: ['Whiteout disorientation', 'Falling marker stacks'],
    tips: ['Log shadow lengths', 'Carry spare markers', 'Follow lichen glow at dusk']
  },
  'celestial-shrine': {
    id: 'celestial-shrine',
    name: 'Celestial Shrine',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/celestial-shrine-detailed.png',
    description: 'Ridge-top observatory where solar fire converges with meteor embers.',
    difficulty: 'Hard',
    elevation: '9,200 ft',
    temperature: '70°F to 110°F',
    weatherPatterns: 'Solar flares, prism refractions, ember drafts',
    accessibility: 'Star Ember Relic required',
    recommendedLevel: '55-85',
    specialFeatures: ['Prism Dish Array', 'Meteor Glass Floor', 'Helioptic Altars'],
    wildlife: [
      { name: 'Flare Archivist', species: 'Chandelure / Wisemon / Foxparks', type: 'Fire/Ghost', rarity: 'Uncommon', description: 'Catalogs stellar flare residue.' },
      { name: 'Solar Sprite', species: 'Kirlia / Candlemon / Teafant', type: 'Psychic/Fairy', rarity: 'Common', description: 'Focuses light into gentle restorative pulses.' },
      { name: 'Corona Drake', species: 'Salamence / AeroVeedramon / Jetragon', type: 'Fire/Dragon', rarity: 'Rare', description: 'Circles during high flare cycles boosting thermal updrafts.' }
    ],
    resources: [
      { name: 'Meteor Glass Fragment', rarity: 'Uncommon', description: 'Heat-tempered pane storing stellar charge.' },
      { name: 'Prism Ash', rarity: 'Common', description: 'Fine residue from refraction rites.' },
      { name: 'Solar Core Lens', rarity: 'Rare', description: 'Condensed light focus crystal.' }
    ],
    lore: 'Pilgrims claim visions arrive in refraction halos.',
    history: 'Expanded after a recorded triple solar flare event.',
    dangers: ['Retina glare', 'Overheated surfaces'],
    tips: ['Use filtered visors', 'Time visits at dawn', 'Avoid mid-flare chanting zone']
  },
  'coastal-settlement': {
    id: 'coastal-settlement',
    name: 'Coastal Settlement',
    regionId: 'poseidons-reach',
    regionName: "Poseidon's Reach",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/coastal-settlement-detailed.png',
    description: 'Tide-hugging outpost of coral-lashed piers and net terraces.',
    difficulty: 'Medium',
    elevation: 'Sea Level',
    temperature: '62°F to 78°F',
    weatherPatterns: 'Salt spray, tidal mist, warm currents',
    accessibility: 'Open dock (basic gear)',
    recommendedLevel: '25-50',
    specialFeatures: ['Biolight Docks', 'Kelp Drying Frames', 'Tidal Nursery Pools'],
    wildlife: [
      { name: 'Pier Watcher', species: 'Pelipper / Seadramon / Surfent', type: 'Water/Flying', rarity: 'Common', description: 'Glides between pier posts scanning currents.' },
      { name: 'Reef Tender', species: 'Corsola / Palmon / Lunaris', type: 'Water/Grass', rarity: 'Uncommon', description: 'Cultivates nursery coral for juvenile releases.' },
      { name: 'Netshell', species: 'Shellder / Armadillomon / Mozzarina', type: 'Water/Rock', rarity: 'Common', description: 'Clamps onto frayed nets reinforcing them.' }
    ],
    resources: [
      { name: 'Kelp Fiber Roll', rarity: 'Common', description: 'Braided cord used in net repair.' },
      { name: 'Pearl Spray Resin', rarity: 'Uncommon', description: 'Protective coating extracted from tidal pools.' },
      { name: 'Tide Echo Shell', rarity: 'Rare', description: 'Shell capturing rhythmic wave patterns.' }
    ],
    lore: 'Serves as first acclimation point for deeper reef expeditions.',
    history: 'Founded by reef stewards to rehabilitate over-harvested shallows.',
    dangers: ['Slip hazards', 'Rogue wave surges'],
    tips: ['Secure footing', 'Log tide tables', 'Inspect gear after salt exposure']
  },
  'corvus-city': {
    id: 'corvus-city',
    name: 'Corvus City',
    regionId: 'thunderbird-heights',
    regionName: 'Thunderbird Heights',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/corvus-city-detailed.png',
    description: 'Storm-perched metropolis of slate terraces and lightning-fed aeries.',
    difficulty: 'Hard',
    elevation: '8,100 ft',
    temperature: '40°F to 65°F',
    weatherPatterns: 'Cyclic thunderstorms, charge gusts',
    accessibility: 'Conductive cloak & storm approach clearance',
    recommendedLevel: '55-85',
    specialFeatures: ['Conductive Sky Bridges', 'Voltage Reservoirs', 'Flock Aerie Towers'],
    wildlife: [
      { name: 'Storm Corvid', species: 'Murkrow / Garudamon / Sparkit', type: 'Electric/Dark', rarity: 'Common', description: 'Carries static packets between coil perches.' },
      { name: 'Amp Talon', species: 'Zapdos / Aquilamon / Jetragon', type: 'Electric/Flying', rarity: 'Rare', description: 'Channels multi-bolt arcs during peak surges.' },
      { name: 'Shadow Line Scout', species: 'Luxray / BlackGatomon / Univolt', type: 'Electric/Dark', rarity: 'Uncommon', description: 'Tracks charge gradients through alley conduits.' }
    ],
    resources: [
      { name: 'Lightning Capacitor Core', rarity: 'Rare', description: 'High retention energy matrix.' },
      { name: 'Storm Glass Rod', rarity: 'Uncommon', description: 'Conductive focus used in lightning shaping.' },
      { name: 'Aerie Feather', rarity: 'Common', description: 'Insulated vane reduces static discharge.' }
    ],
    lore: 'Founded where natural storm lanes intersect for optimal harvesting.',
    history: 'Grew vertically as storage coil tech advanced.',
    dangers: ['Arc flash risk', 'High wind shear'],
    tips: ['Ground regularly', 'Use insulated grips', 'Check surge forecasts']
  },
  'shadow-village': {
    id: 'shadow-village',
    name: 'Shadow Village',
    regionId: 'ravens-shadow',
    regionName: "Raven's Shadow",
    landmassId: 'ravenfall-reaches',
    landmassName: 'Ravenfall Reaches',
    image: '/images/maps/areas/shadow-village-detailed.png',
    description: 'Whispering hamlet where elongated sentient silhouettes archive secret lore along dusk walls.',
    difficulty: 'Hard',
    elevation: 'Twilight hollow basin',
    temperature: '38°F to 56°F',
    weatherPatterns: 'Residual auric haze, flicker shade pulses',
    accessibility: 'Shadow rite induction',
    recommendedLevel: '55-85',
    specialFeatures: [
      'Living Shadow Archives',
      'Echo Whisper Alleys',
      'Gloom Ink Scriptorium',
      'Raven Effigy Watchposts'
    ],
    wildlife: [
      { name: 'Shade Prowler', species: 'Poochyena / Sangloupmon / Vixy', type: 'Dark', rarity: 'Common', description: 'Tracks moving light seams for patrol routes.' },
      { name: 'Whisper Corvid', species: 'Honchkrow / Ravemon / Galeclaw', type: 'Dark/Flying', rarity: 'Uncommon', description: 'Carries encoded dusk rune fragments.' },
      { name: 'Void Scribe', species: 'Banette / Phantomon / Katress', type: 'Ghost/Dark', rarity: 'Rare', description: 'Inscribes secrets into shadow vellum.' }
    ],
    resources: [
      { name: 'Gloom Ink Vial', rarity: 'Rare', description: 'Writing medium that resists illumination tampering.' },
      { name: 'Shadow Bark Slab', rarity: 'Uncommon', description: 'Absorptive tablet storing whispered data.' },
      { name: 'Feather Scrip', rarity: 'Common', description: 'Inscribing quill from dusk corvid plumage.' }
    ],
    lore: 'Ravens teach that truth emerges sharper when carved from layered obscurity.',
    history: 'Formed after migrating dusk currents stabilized over basin.',
    dangers: ['Light source suppression', 'Echo disorientation', 'Shadow mimic lures'],
    tips: ['Carry dual-spectrum lamp', 'Log coordinates frequently', 'Ignore unsourced whisper prompts']
  },
  'twilight-town': {
    id: 'twilight-town',
    name: 'Twilight Town',
    regionId: 'ravens-shadow',
    regionName: "Raven's Shadow",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/twilight-town-detailed.png',
    description: 'Perpetual gloam municipality where temporal gradients create staggered dusk layers and riddle commerce.',
    difficulty: 'Hard',
    elevation: 'Terraced twilight flats',
    temperature: '50°F to 64°F',
    weatherPatterns: 'Layered amber haze, reverse shadow drift',
    accessibility: 'Phased causeways aligned to dusk intervals',
    recommendedLevel: '45-75',
    specialFeatures: [
      'Temporal Gradient Plaza',
      'Riddle Exchange Bazaars',
      'Shadow Phase Alleyways',
      'Gloam Calibration Obelisks'
    ],
    wildlife: [
      { name: 'Dusk Flicker', species: 'Murkrow / Dracmon / Foxparks', type: 'Dark/Flying', rarity: 'Common', description: 'Skims temporal shear edges harvesting echo motes.' },
      { name: 'Phase Scribe', species: 'Sableye / Wisemon / Sweepa', type: 'Dark/Ghost', rarity: 'Uncommon', description: 'Etches shifting inscriptions into basalt markers.' },
      { name: 'Gloam Architect', species: 'Honchkrow / BlackGatomon / Katress', type: 'Dark/Psychic', rarity: 'Rare', description: 'Stabilizes multi-layer dusk corridors.' }
    ],
    resources: [
      { name: 'Riddle Token Fragment', rarity: 'Common', description: 'Partial phrase unit redeemable for clue exchanges.' },
      { name: 'Dusk Phase Shard', rarity: 'Uncommon', description: 'Hardlight sliver formed in gradient convergence.' },
      { name: 'Temporal Gloam Core', rarity: 'Rare', description: 'Dense nexus bead regulating local dusk persistence.' }
    ],
    lore: 'Established to harness persistent twilight for advanced shadow craft and mnemonic riddling.',
    history: 'Spatial grid recalibrated after corridor looping incidents.',
    dangers: ['Temporal disorientation', 'Shadow echo stalking'],
    tips: ['Carry phase anchor charm', 'Answer riddles succinctly', 'Track corridor iteration counts']
  },
  'cyclops-village': {
    id: 'cyclops-village',
    name: 'Cyclops Village',
    regionId: 'jotun-tundra',
    regionName: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/cyclops-village-detailed.png',
    description: 'Menhir-ringed enclave guarded by one-eyed smith clans.',
    difficulty: 'Hard',
    elevation: '6,050 ft',
    temperature: '-5°F to 20°F',
    weatherPatterns: 'Cobalt forge glow haze, drifting crystals',
    accessibility: 'Clan token escort',
    recommendedLevel: '50-80',
    specialFeatures: ['Forge Pits', 'Menhir Circuits', 'Echo Horn Towers'],
    wildlife: [
      { name: 'Forge Cyclopean', species: 'Machamp / Cyclonemon / Mossanda', type: 'Fighting/Rock', rarity: 'Uncommon', description: 'Hammers resonance anvils forging heatstone ingots.' },
      { name: 'Stone Eyeling', species: 'Roggenrola / Hagurumon / Depresso', type: 'Rock/Steel', rarity: 'Common', description: 'Rolls between menhirs measuring vibrational alignment.' },
      { name: 'Frost Sentinel', species: 'Beartic / Monochromon / Wumpo', type: 'Ice/Fighting', rarity: 'Rare', description: 'Patrols outer ring during whiteout pulses.' }
    ],
    resources: [
      { name: 'Forge Heatstone', rarity: 'Rare', description: 'Stable thermal core for advanced crafting.' },
      { name: 'Menhir Fragment', rarity: 'Uncommon', description: 'Runic shard storing seismic patterns.' },
      { name: 'Smithing Soot', rarity: 'Common', description: 'Fine carbon dust enhancing grip.' }
    ],
    lore: 'Legend says their first anvil was carved from a fallen glacier heart.',
    history: 'Developed as a defensive forge outpost protecting tundra trade.',
    dangers: ['Hammer shockwaves', 'Forge flare sparks'],
    tips: ['Wear eye shielding', 'Respect smith signals', 'Avoid active ring drills']
  },
  'death-pyramid': {
    id: 'death-pyramid',
    name: 'Death Pyramid',
    regionId: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    landmassId: 'mictlan-isles',
    landmassName: 'Mictlan Isles',
    image: '/images/maps/areas/death-pyramid-detailed.png',
    description: 'Sepulchral prism of echoing sarcophagi and shifting soul-sand.',
    difficulty: 'Hard',
    elevation: '320 ft rise',
    temperature: '45°F to 60°F',
    weatherPatterns: 'Soul dust eddies, dim green flame wisps',
    accessibility: 'Oathbound torch sigil',
    recommendedLevel: '55-85',
    specialFeatures: ['Resonant Crypt Wells', 'Ancestral Sarcophagus Rings', 'Soul Flame Braziers'],
    wildlife: [
      { name: 'Crypt Jackal', species: 'Mightyena / BlackGaomon / Direhowl', type: 'Dark/Ghost', rarity: 'Common', description: 'Sniffs memory trails along carved relief passages.' },
      { name: 'Phantom Scarab', species: 'Karrablast / FanBeemon / Lumira', type: 'Bug/Ghost', rarity: 'Uncommon', description: 'Feeds on residual glyph light and drifting anima motes.' },
      { name: 'Sarcophageist', species: 'Cofagrigus / SkullSatamon / Necromus', type: 'Ghost/Dark', rarity: 'Rare', description: 'Emerges during low chant cycles to rearrange ossuary doors.' }
    ],
    resources: [
      { name: 'Soulbound Shard', rarity: 'Rare', description: 'Crystalline echo of a sealed vow, used in ritual catalysts.' },
      { name: 'Ember Sand', rarity: 'Uncommon', description: 'Warm granular residue retaining spectral heat.' },
      { name: 'Inscribed Fragment', rarity: 'Common', description: 'Broken tablet sliver with partial funerary script.' }
    ],
    lore: 'Built to resonate with layered timelines, safeguarding forgotten accords.',
    history: 'Reclaimed from collapsing dunes then warded by crypt seers.',
    dangers: ['Soul pulse disorientation', 'Falling reliquary lids', 'Anima drain zones'],
    tips: ['Carry continuous light', 'Avoid green flame surges', 'Track echo loop intervals']
  },
  'delphi-city': {
    id: 'delphi-city',
    name: 'Delphi City',
    regionId: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    landmassId: 'elysian-reach',
    landmassName: 'Elysian Reach',
    image: '/images/maps/areas/delphi-city-detailed.png',
    description: 'Terraced marble foresight hub threaded by divination canals.',
    difficulty: 'Medium',
    elevation: '2,400 ft',
    temperature: '55°F to 78°F',
    weatherPatterns: 'Golden mist veils, hush wind currents',
    accessibility: 'Consultation token or escort',
    recommendedLevel: '35-60',
    specialFeatures: ['Prophecy Pools', 'Aether Loom Galleries', 'Mnemonic Spire'],
    wildlife: [
      { name: 'Oracle Strix', species: 'Noctowl / Wisemon / Galeclaw', type: 'Psychic/Flying', rarity: 'Uncommon', description: 'Glides silently mapping probability layers.' },
      { name: 'Marble Kine', species: 'Miltank / Goldram / Gumoss', type: 'Normal/Fairy', rarity: 'Common', description: 'Grazes on curated terrace moss absorbing ambient foresight hum.' },
      { name: 'Chrona Sprite', species: 'Ralts / Clockmon / Petallia', type: 'Psychic/Fairy', rarity: 'Rare', description: 'Adjusts minor timeline drift near prophecy pools.' }
    ],
    resources: [
      { name: 'Aether Thread', rarity: 'Rare', description: 'Spun potential strand used in precognitive gear.' },
      { name: 'Insight Petal', rarity: 'Uncommon', description: 'Bloom that opens during stable probability windows.' },
      { name: 'Marble Dust', rarity: 'Common', description: 'Finely ground reflective grit used in scrying basins.' }
    ],
    lore: 'Seers claim its foundations align with convergent destiny nodes.',
    history: 'Expanded from a single shrine into a vast interpretive complex.',
    dangers: ['Temporal fatigue', 'Aether resonance migraines'],
    tips: ['Limit consecutive prophecy exposures', 'Hydrate at clarity fountains', 'Log outcomes quickly']
  },
  'divine-workshop': {
    id: 'divine-workshop',
    name: 'Divine Workshop',
    regionId: 'hephaestus-forge',
    regionName: "Hephaestus' Forge",
    landmassId: 'elysian-reach',
    landmassName: 'Elysian Reach',
    image: '/images/maps/areas/divine-workshop-detailed.png',
    description: 'Volcanic crucible of living anvils and celestial alloy vents.',
    difficulty: 'Hard',
    elevation: '4,800 ft caldera rim',
    temperature: '350°F forges / 90°F ambient',
    weatherPatterns: 'Sparking slag rain, resonant hammer thunder',
    accessibility: 'Heat ward plating required',
    recommendedLevel: '55-85',
    specialFeatures: ['Molten Flow Lathes', 'Celestial Alloy Crucibles', 'Runic Cooling Spirals'],
    wildlife: [
      { name: 'Anvil Core', species: 'Probopass / Andromon / Dumud', type: 'Steel/Rock', rarity: 'Uncommon', description: 'Floats via magnetic eddies stabilizing smelt fields.' },
      { name: 'Slag Salamander', species: 'Salandit / Meramon / Reptyro', type: 'Fire/Poison', rarity: 'Common', description: 'Skims molten channels absorbing trace alloys.' },
      { name: 'Forge Archon', species: 'Metagross / HiAndromon / Digtoise', type: 'Steel/Fire', rarity: 'Rare', description: 'Coordinates synchronized hammer pulses shaping celestial ingots.' }
    ],
    resources: [
      { name: 'Celestial Alloy', rarity: 'Rare', description: 'Ultra-refined resonant metal for top-tier forging.' },
      { name: 'Runic Slag', rarity: 'Uncommon', description: 'Cooling crust imbued with forge chants.' },
      { name: 'Basalt Core Chunk', rarity: 'Common', description: 'Heavy dense stone holding latent heat.' }
    ],
    lore: 'Said to channel forgotten volcanic hymn cycles to stabilize alloy purity.',
    history: 'Reinforced after a containment spiral nearly collapsed the inner crucibles.',
    dangers: ['Heat shock', 'Slag bursts', 'Magnetic distortion zones'],
    tips: ['Use heat ward gear', 'Avoid bright white vent phases', 'Monitor hammer sync rhythm']
  },
  'dragon-graveyard': {
    id: 'dragon-graveyard',
    name: 'Dragon Graveyard',
    regionId: 'draconic-abyss',
    regionName: 'Draconic Abyss',
    landmassId: 'midgard-expanse',
    landmassName: 'Midgard Expanse',
    image: '/images/maps/areas/dragon-graveyard-detailed.png',
    description: 'Fossil dune basin studded with titanic wyrm spines.',
    difficulty: 'Hard',
    elevation: 'Valley floor',
    temperature: '70°F to 95°F',
    weatherPatterns: 'Bone-dry thermal updrafts, grit spirals',
    accessibility: 'Ridge descent ropes',
    recommendedLevel: '50-80',
    specialFeatures: ['Wyrm Spine Arches', 'Calcium Dust Gyres', 'Fossil Ember Pits'],
    wildlife: [
      { name: 'Spine Raptor', species: 'Aerodactyl / Strikedramon / Ragnahawk', type: 'Rock/Dragon', rarity: 'Uncommon', description: 'Perches on arch ridges scanning thermal patterns.' },
      { name: 'Bone Sifter', species: 'Sandslash / Dracmon / Cinnamoth', type: 'Ground/Dark', rarity: 'Common', description: 'Filters marrow dust for lingering minerals.' },
      { name: 'Ember Wyrmling', species: 'Bagon / Flamedramon / Pyrin', type: 'Dragon/Fire', rarity: 'Rare', description: 'Nests in warm fossil pockets absorbing residual heat.' }
    ],
    resources: [
      { name: 'Dragon Bone Powder', rarity: 'Rare', description: 'Finely milled fossil dust used in potent alchemy.' },
      { name: 'Calcic Scale Flake', rarity: 'Uncommon', description: 'Remnant of ancient armor plating.' },
      { name: 'Marrow Residue', rarity: 'Common', description: 'Faintly nutritive dust for soil enrichment.' }
    ],
    lore: 'Dragons returned here to fossilize in aligned thermal fields.',
    history: 'Excavators uncovered early dragon clan burial patterns.',
    dangers: ['Bone collapse zones', 'Thermal mirage disorientation'],
    tips: ['Test ridge stability', 'Carry dust goggles', 'Watch for updraft talon dives']
  },
  'druid-village': {
    id: 'druid-village',
    name: 'Druid Village',
    regionId: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    landmassId: 'midgard-expanse',
    landmassName: 'Midgard Expanse',
    image: '/images/maps/areas/druid-village-detailed.png',
    description: 'Runic grove settlement anchored by moss pillars and root bridges.',
    difficulty: 'Medium',
    elevation: '5,300 ft',
    temperature: '40°F to 65°F',
    weatherPatterns: 'Soft mist braids, birdsong gusts',
    accessibility: 'Root bridge approach only',
    recommendedLevel: '30-55',
    specialFeatures: ['Runic Moss Pillars', 'Verdant Healing Rings', 'Spirit Sap Collection Nodes'],
    wildlife: [
      { name: 'Grove Watcher', species: 'Trevenant / Woodmon / Lumoth', type: 'Ghost/Grass', rarity: 'Uncommon', description: 'Guards boundary roots with resonant branch taps.' },
      { name: 'Moss Fawn', species: 'Deerling / Kodokugumon / Lamball', type: 'Grass/Fairy', rarity: 'Common', description: 'Browses luminous undergrowth promoting regrowth pulses.' },
      { name: 'Sap Wisp', species: 'Budew / Cherrymon / Petallia', type: 'Grass', rarity: 'Rare', description: 'Condenses around healing rings emitting gentle hum.' }
    ],
    resources: [
      { name: 'Spirit Sap', rarity: 'Rare', description: 'Potent regenerative extract used in advanced brews.' },
      { name: 'Runic Bark Strip', rarity: 'Uncommon', description: 'Etched with natural glyph growth patterns.' },
      { name: 'Moss Bundle', rarity: 'Common', description: 'Moist cushioning plant matter for crafting.' }
    ],
    lore: 'Rootwardens tuned the grove to amplify restorative resonance.',
    history: 'Formed after cliffs stabilized allowing natural lattice growth.',
    dangers: ['Root bridge sway falls', 'Glyph overgrowth entanglement'],
    tips: ['Move in single file on bridges', 'Do not carve living pillars', 'Respect bark tap signals']
  },
  'stonehenge-site': {
    id: 'stonehenge-site',
    name: 'Stonehenge Site',
    regionId: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/stonehenge-site-detailed.png',
    description: 'Massive stone circle that serves as an astronomical calendar and gateway to other realms.',
    difficulty: 'Extreme',
    elevation: 'High plateau ring',
    temperature: '45°F to 62°F',
    weatherPatterns: 'Celestial alignment glow, rhythmic wind pulses',
    accessibility: 'Runic path convergence at solstice markers',
    recommendedLevel: '85-110',
    specialFeatures: [
      'Astronomical Calendar Stones',
      'Realm Gateway Nexus',
      'Megalithic Alignment Beams',
      'Celestial Resonance Channels'
    ],
    wildlife: [
      { name: 'Rune Sentry', species: 'Baltoy / Guardromon / Dumud', type: 'Rock/Psychic', rarity: 'Common', description: 'Rotates to maintain minor ley adjustments.' },
      { name: 'Alignment Wisp', species: 'Solrock / Wisemon / Petallia', type: 'Rock/Psychic', rarity: 'Uncommon', description: 'Flares during peak stellar harmonics.' },
      { name: 'Gate Herald', species: 'Claydol / Angewomon / Paladius', type: 'Rock/Fairy', rarity: 'Rare', description: 'Stabilizes transient realm thresholds.' }
    ],
    resources: [
      { name: 'Resonant Megalith Chip', rarity: 'Rare', description: 'Channel fragment amplifying ritual precision.' },
      { name: 'Alignment Dust', rarity: 'Uncommon', description: 'Fine particulate settling during nexus shifts.' },
      { name: 'Runic Lichen Patch', rarity: 'Common', description: 'Glow lichen aiding low-light readings.' }
    ],
    lore: 'Legends claim the first island epoch reset was triggered here under triple eclipse.',
    history: 'Excavated partially—deeper sub-ring layers remain sealed by harmonic locks.',
    dangers: ['Temporal disorientation', 'Ley field surges', 'Portal instability'],
    tips: ['Enter only at stable intervals', 'Carry chronometer charms', 'Avoid standing in beam paths']
  },
  'electric-vortex': {
    id: 'electric-vortex',
    name: 'Electric Vortex',
    regionId: 'tempest-zones',
    regionName: 'Tempest Zones',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/areas/electric-vortex-detailed.png',
    description: 'Cyclonic charge basin with suspended storm rings.',
    difficulty: 'Extreme',
    elevation: 'Floating strata',
    temperature: '20°F to 45°F (wind chill)',
    weatherPatterns: 'Continuous static arcs, luminous storm halos',
    accessibility: 'Grapple glide entry',
    recommendedLevel: '70-100',
    specialFeatures: ['Storm Charge Rings', 'Ion Channel Pillars', 'Levitation Eddy Paths'],
    wildlife: [
      { name: 'Volt Skyray', species: 'Stunfisk / Thunderballmon / Jolthog', type: 'Electric/Flying', rarity: 'Uncommon', description: 'Glides on conduction layers discharging excess ions.' },
      { name: 'Nimbus Core', species: 'Eelektrik / Raidramon / Boltmane', type: 'Electric/Dragon', rarity: 'Rare', description: 'Stabilizes vortex polarity through rhythmic pulses.' },
      { name: 'Static Hopper', species: 'Heliolisk / Kokuwamon / Sparkit', type: 'Electric/Normal', rarity: 'Common', description: 'Absorbs low-grade charge from ion pillars.' }
    ],
    resources: [
      { name: 'Ion Capacitor Crystal', rarity: 'Rare', description: 'Stores high-density electrical charge safely.' },
      { name: 'Charged Filament', rarity: 'Uncommon', description: 'Glowing thread vibrating with steady current.' },
      { name: 'Storm Residue', rarity: 'Common', description: 'Powder infused with static potential.' }
    ],
    lore: 'Formed where levitation eddies intersect migrating storm belts.',
    history: 'Mapped by airborne scouts using tethered sensor rigs.',
    dangers: ['Arc surges', 'Magnetic disorientation', 'Shear wind flings'],
    tips: ['Use insulated gear', 'Track charge build cycles', 'Avoid central polarity shifts']
  },
  'enchanted-glade': {
    id: 'enchanted-glade',
    name: 'Enchanted Glade',
    regionId: 'seelie-courts',
    regionName: 'Seelie Courts',
    landmassId: 'fae-realms',
    landmassName: 'Fae Realms',
    image: '/images/maps/areas/enchanted-glade-detailed.png',
    description: 'Bioluminescent clearing humming with layered fae harmonics.',
    difficulty: 'Medium',
    elevation: 'Forest floor basin',
    temperature: '60°F to 75°F',
    weatherPatterns: 'Glow pollen drifts, harmonic breeze tone shifts',
    accessibility: 'Spiral petal portal alignment',
    recommendedLevel: '30-55',
    specialFeatures: ['Illuminated Root Webs', 'Aureole Bloom Rings', 'Harmony Stone Circles'],
    wildlife: [
      { name: 'Glowcap Hopper', species: 'Shroomish / Mushroomon / Lunalop', type: 'Grass/Fairy', rarity: 'Common', description: 'Bounces between glowing caps spreading spores evenly.' },
      { name: 'Fae Sylphid', species: 'Cutiefly / Fairimon / Petallia', type: 'Fairy/Bug', rarity: 'Uncommon', description: 'Maintains harmonic resonance with wing vibrations.' },
      { name: 'Aureole Warden', species: 'Gardevoir / Kazemon / Sweepa', type: 'Fairy/Psychic', rarity: 'Rare', description: 'Monitors bloom ring energy thresholds.' }
    ],
    resources: [
      { name: 'Harmony Dewdrop', rarity: 'Rare', description: 'Amplifies positive resonance in crafted charms.' },
      { name: 'Glow Pollen Pod', rarity: 'Uncommon', description: 'Soft capsule releasing steady luminescent dust.' },
      { name: 'Fae Petal Cluster', rarity: 'Common', description: 'Delicate bloom fragments for basic infusions.' }
    ],
    lore: 'Glade attunes to distant courts, reflecting seasonal mood shifts.',
    history: 'Stabilized after wardstones anchored fluctuating portals.',
    dangers: ['Resonance overload dizziness', 'Spore haze drowsiness'],
    tips: ['Do not disrupt bloom rings', 'Move calmly to avoid tone spikes', 'Carry grounding charm']
  },
  'trickster-lodge': {
    id: 'trickster-lodge',
    name: 'Trickster Lodge',
    regionId: 'ravens-shadow',
    regionName: "Raven's Shadow",
    landmassId: 'ravenfall-reaches',
    landmassName: 'Ravenfall Reaches',
    image: '/images/maps/areas/trickster-lodge-detailed.png',
    description: 'Sacred twilight hall where raven spirit mentors challengers through illusion trials and paradox riddles.',
    difficulty: 'Extreme',
    elevation: 'Shadow ridge hollow',
    temperature: '36°F to 54°F',
    weatherPatterns: 'Intermittent shade pulses, echo wind murmurs',
    accessibility: 'Riddle path initiation',
    recommendedLevel: '70-100',
    specialFeatures: [
      'Raven Spirit Chamber',
      'Illusion Trial Corridors',
      'Paradox Riddle Hearth',
      'Shadow Lesson Alcoves'
    ],
    wildlife: [
      { name: 'Puzzle Corvid', species: 'Rookidee / Ravemon / Galeclaw', type: 'Dark/Flying', rarity: 'Common', description: 'Arranges trinkets into shifting cipher patterns.' },
      { name: 'Shade Tutor', species: 'Sableye / Phantomon / Katress', type: 'Dark/Ghost', rarity: 'Uncommon', description: 'Demonstrates controlled silhouette splitting.' },
      { name: 'Raven Aspect', species: 'Honchkrow / Wisemon / Paladius', type: 'Dark/Psychic', rarity: 'Rare', description: 'Embodies teaching avatar of the lodge spirit.' }
    ],
    resources: [
      { name: 'Cipher Feather', rarity: 'Rare', description: 'Encodes rotating riddle keys.' },
      { name: 'Shadow Echo Shard', rarity: 'Uncommon', description: 'Stores brief auditory illusion loops.' },
      { name: 'Riddle Chalk Dust', rarity: 'Common', description: 'Writing powder for paradox diagram boards.' }
    ],
    lore: 'Each solved paradox is said to lighten latent burdens carried in silence.',
    history: 'Raised when first raven emissary bound shifting shadows into teaching forms.',
    dangers: ['Cognitive overload', 'Illusion vertigo', 'Echo loop entrapment'],
    tips: ['Pace trial attempts', 'Ground using tactile token', 'Record solutions immediately']
  },
  'eternal-dusk': {
    id: 'eternal-dusk',
    name: 'Eternal Dusk',
    regionId: 'ravens-shadow',
    regionName: "Raven's Shadow",
    landmassId: 'ravenfall-reaches',
    landmassName: 'Ravenfall Reaches',
    image: '/images/maps/areas/eternal-dusk-detailed.png',
    description: 'Perpetual twilight moor shrouded in murmuring feather-fog.',
    difficulty: 'Hard',
    elevation: 'Undulating moor',
    temperature: '35°F to 55°F',
    weatherPatterns: 'Faint auric haze, drifting feather motes',
    accessibility: 'Shadow path induction',
    recommendedLevel: '50-80',
    specialFeatures: ['Feather Fog Bands', 'Twilight Rune Monoliths', 'Dusk Echo Pools'],
    wildlife: [
      { name: 'Moor Corvid', species: 'Murkrow / Ravemon / Galeclaw', type: 'Dark/Flying', rarity: 'Common', description: 'Circles low rune monoliths tracking echo patterns.' },
      { name: 'Dusk Lurker', species: 'Umbreon / Sangloupmon / Vixy', type: 'Dark', rarity: 'Uncommon', description: 'Glides through fog banks using silent paw steps.' },
      { name: 'Twilight Seer', species: 'Absol / Phantomon / Katress', type: 'Dark/Psychic', rarity: 'Rare', description: 'Reads faint probability ripples across rune stones.' }
    ],
    resources: [
      { name: 'Twilight Essence', rarity: 'Rare', description: 'Condensed dusk energy for shadowcrafting.' },
      { name: 'Feather Mote Cluster', rarity: 'Uncommon', description: 'Suspended particulate from corvid flocks.' },
      { name: 'Rune Lichen', rarity: 'Common', description: 'Grows on monoliths absorbing echo traces.' }
    ],
    lore: 'Dusk never fully fades, preserving contemplative stillness.',
    history: 'Once a battlefield—now reclaimed by layered shadow wards.',
    dangers: ['Visibility loss', 'Echo confusion', 'Shadow predators'],
    tips: ['Mark approach path', 'Avoid overlapping fog bands', 'Listen for low wingbeats']
  },
  'flame-chasm': {
    id: 'flame-chasm',
    name: 'Flame Chasm',
    regionId: 'draconic-abyss',
    regionName: 'Draconic Abyss',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/areas/flame-chasm-detailed.png',
    description: 'Bottomless inferno rift where molten cataracts test drake lineage.',
    difficulty: 'Extreme',
    elevation: 'Ledge descent tiers',
    temperature: '800°F vents / 120°F ambient ledges',
    weatherPatterns: 'Heat plumes, ember shear gusts',
    accessibility: 'Heat wards & descent anchors',
    recommendedLevel: '70-100',
    specialFeatures: ['Molten Cataracts', 'Trial Ledges', 'Ember Updraft Columns'],
    wildlife: [
      { name: 'Chasm Drakelet', species: 'Gible / Candlemon / Pyrin', type: 'Dragon/Fire', rarity: 'Common', description: 'Practices flare dives along inner walls.' },
      { name: 'Ember Mantle', species: 'Magmar / Flamedramon / Foxparks', type: 'Fire/Fighting', rarity: 'Uncommon', description: 'Skims lava arcs stabilizing mantle heat.' },
      { name: 'Rift Infernal', species: 'Charizard / SkullSatamon / Jetragon', type: 'Fire/Dark', rarity: 'Rare', description: 'Surfaces during synchronized flare surges.' }
    ],
    resources: [
      { name: 'Chasm Core Slag', rarity: 'Rare', description: 'Dense cooled magma with impurity reduction traits.' },
      { name: 'Heat Plume Crystal', rarity: 'Uncommon', description: 'Grown in turbulent updraft, stores thermal charge.' },
      { name: 'Basalt Ember Chip', rarity: 'Common', description: 'Glowing shard from rapid quench cycles.' }
    ],
    lore: 'Trial site where young drakes temper wings against inferno turbulence.',
    history: 'Stabilized when anchor rings were forged by volcanic custodians.',
    dangers: ['Shear updraft toss', 'Lava arc splash', 'Anchor rope failure'],
    tips: ['Monitor plume rhythm', 'Secure dual tethers', 'Avoid descent during triple flare phase']
  },
  'fog-temple': {
    id: 'fog-temple',
    name: 'Fog Temple',
    regionId: 'mist-marshlands',
    regionName: 'Mist Marshlands',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/fog-temple-detailed.png',
    description: 'Submerged sanctum veiled by luminous marsh haze and spirit bells.',
    difficulty: 'Extreme',
    elevation: 'Bog water level',
    temperature: '55°F to 68°F',
    weatherPatterns: 'Dense mist pulses, spectral glow halos',
    accessibility: 'Boardwalk approach (low visibility gear)',
    recommendedLevel: '65-95',
    specialFeatures: ['Spirit Bell Causeways', 'Mist Glyph Pools', 'Echo Vault Chambers'],
    wildlife: [
      { name: 'Mist Warden', species: 'Dusclops / Shakomon / Celeray', type: 'Ghost/Water', rarity: 'Uncommon', description: 'Guards glyph pools with silent hover.' },
      { name: 'Bog Lantern', species: 'Lampent / Palmon / Teafant', type: 'Ghost/Grass', rarity: 'Common', description: 'Drifts lighting safe stepping stones.' },
      { name: 'Echo Naiad', species: 'Mareanie / Syakomon / Lumira', type: 'Water/Poison', rarity: 'Rare', description: 'Manifests in resonance rings during bell cycles.' }
    ],
    resources: [
      { name: 'Mist Glyph Fragment', rarity: 'Rare', description: 'Arcane pattern shard stabilizing spectral infusions.' },
      { name: 'Luminous Peat', rarity: 'Uncommon', description: 'Glowing organic substrate enhancing growth rituals.' },
      { name: 'Spirit Condensate', rarity: 'Common', description: 'Condensed vapor droplet with faint echo energy.' }
    ],
    lore: 'Temple echoes align with primordial marsh breathing cycles.',
    history: 'Rediscovered after drought lowered outer fog curtains.',
    dangers: ['Visibility collapse', 'Spirit misdirection', 'Slick algae slips'],
    tips: ['Mark path knots', 'Listen for bell triple-tone', 'Carry anti-slip pads']
  },
  'forge-town': {
    id: 'forge-town',
    name: 'Forge Town',
    regionId: 'hephaestus-forge',
    regionName: 'Hephaestus Forge',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/forge-town-detailed.png',
    description: 'Refining hub where ore caravans feed divine smelter stacks.',
    difficulty: 'Medium',
    elevation: '2,150 ft',
    temperature: '75°F to 105°F',
    weatherPatterns: 'Sparking vent haze, rhythmic pressure puffs',
    accessibility: 'Ore rail spur',
    recommendedLevel: '25-55',
    specialFeatures: ['Refining Towers', 'Calibration Pylons', 'Slag Quench Basins'],
    wildlife: [
      { name: 'Ore Burrower', species: 'Drilbur / Hagurumon / Dumud', type: 'Ground/Steel', rarity: 'Common', description: 'Surfaces near fresh seam markers.' },
      { name: 'Furnace Skink', species: 'Salazzle / Candlemon / Depresso', type: 'Fire/Poison', rarity: 'Uncommon', description: 'Absorbs trace fumes regulating vent pressure.' },
      { name: 'Alloy Sentinel', species: 'Magnezone / Guardromon / Digtoise', type: 'Steel/Electric', rarity: 'Rare', description: 'Monitors refinery output purity.' }
    ],
    resources: [
      { name: 'Refined Alloy Ingot', rarity: 'Rare', description: 'High-grade structural metal for advanced craft.' },
      { name: 'Slag Glass Chunk', rarity: 'Uncommon', description: 'Cooled vitrified residue with trace catalysts.' },
      { name: 'Ore Dust Sample', rarity: 'Common', description: 'Granular assay feedstock.' }
    ],
    lore: 'Supply hub enabling deeper forge region expansion.',
    history: 'Founded around convergence of three ore veins.',
    dangers: ['Conveyor pinch points', 'Fume buildup', 'Ore cart derailment'],
    tips: ['Wear filtration mask', 'Keep clear of moving rails', 'Log seam shifts daily']
  },
  'vulcan-city': {
    id: 'vulcan-city',
    name: 'Vulcan City',
    regionId: 'hephaestus-forge',
    regionName: 'Hephaestus Forge',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/vulcan-city-detailed.png',
    description: 'Tiered industrial megaforge where perpetual divine furnaces power alloy innovation districts.',
    difficulty: 'Hard',
    elevation: 'Smelter terraces & slag plateaus',
    temperature: '120°F to 165°F (forge cores hotter)',
    weatherPatterns: 'Heat shimmer plumes, magnetic spark drift',
    accessibility: 'Reinforced tram rails & blast-shield gantries',
    recommendedLevel: '50-80',
    specialFeatures: [
      'Central Eternal Furnace',
      'Alloy Prototype Labs',
      'Flux Stabilizer Towers',
      'Molten Channel Network'
    ],
    wildlife: [
      { name: 'Slag Skitter', species: 'Slugma / Candlemon / Dumud', type: 'Fire', rarity: 'Common', description: 'Absorbs residual radiant heat along channels.' },
      { name: 'Forge Regulator', species: 'Magmar / Andromon / Solarmon', type: 'Fire/Steel', rarity: 'Uncommon', description: 'Balances crucible pressure gradients.' },
      { name: 'Alloy Sentinel', species: 'Heatran / Wisemon / Kazemon', type: 'Fire/Steel', rarity: 'Rare', description: 'Patrols for structural stress anomalies.' }
    ],
    resources: [
      { name: 'Refined Slag Glass', rarity: 'Common', description: 'Cooled vitreous byproduct workable into insulators.' },
      { name: 'Stabilized Flux Coil', rarity: 'Uncommon', description: 'Maintains field uniformity in prototype furnaces.' },
      { name: 'Divine Alloy Ingot', rarity: 'Rare', description: 'High resonance metal with exceptional tensile memory.' }
    ],
    lore: 'Built around a primordial ember bound by cooperative master smith rites.',
    history: 'Underwent duct lattice overhaul after runaway heat vortex.',
    dangers: ['Heat exhaustion', 'Metal fume inhalation', 'Magnetic arc surges'],
    tips: ['Cycle cooling breaks', 'Wear triple filter mask', 'Log forge flux variance']
  },
  'great-tree': {
    id: 'great-tree',
    name: 'Great Tree',
    regionId: 'anansi-woods',
    regionName: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/great-tree-detailed.png',
    description: 'Ancient story baobab where silk runes weave living legends.',
    difficulty: 'Hard',
    elevation: 'Root rise plateau',
    temperature: '68°F to 82°F',
    weatherPatterns: 'Filtered sun shafts, pollen sparkle drift',
    accessibility: 'Spiral root ramp',
    recommendedLevel: '35-65',
    specialFeatures: ['Silk Rune Canopy', 'Story Resin Globes', 'Narrative Loom Hollows'],
    wildlife: [
      { name: 'Rune Weaver', species: 'Spinarak / Tentomon / Lumira', type: 'Bug/Fairy', rarity: 'Common', description: 'Spins adaptive glyph threads.' },
      { name: 'Sap Storyling', species: 'Combee / Parasmon / Petallia', type: 'Bug/Grass', rarity: 'Uncommon', description: 'Harvests resin globes preserving tales.' },
      { name: 'Baobab Guardian', species: 'Leavanny / Kuwagamon / Mossanda', type: 'Bug/Grass', rarity: 'Rare', description: 'Prunes dead silk to foster new narratives.' }
    ],
    resources: [
      { name: 'Story Resin', rarity: 'Rare', description: 'Encapsulated micro-tales boosting inspiration crafting.' },
      { name: 'Silk Glyph Strand', rarity: 'Uncommon', description: 'Thread retaining faint narrative bias.' },
      { name: 'Baobab Fiber', rarity: 'Common', description: 'Durable organic weave material.' }
    ],
    lore: 'Said to anchor the first tale spun by the spider lord.',
    history: 'Expanded via cultivated branch latticework.',
    dangers: ['Falling silk mats', 'Story trance distraction'],
    tips: ['Avoid interrupting weavers', 'Ground yourself after long reads', 'Carry anti-adhesion salve']
  },
  'silk-library': {
    id: 'silk-library',
    name: 'Silk Library',
    regionId: 'anansi-woods',
    regionName: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/silk-library-detailed.png',
    description: 'Vast suspended archive where crystalline web stacks preserve luminous woven manuscripts.',
    difficulty: 'Medium',
    elevation: 'Multi-tier canopy lattice',
    temperature: '70°F constant humidity',
    weatherPatterns: 'Soft dew condensation cycles',
    accessibility: 'Silk lift platforms & web bridges',
    recommendedLevel: '30-60',
    specialFeatures: [
      'Crystalline Web Stacks',
      'Narrative Spindle Scriptorium',
      'Resonance Index Cocoon',
      'Silk Preservation Vaults'
    ],
    wildlife: [
      { name: 'Index Weaver', species: 'Joltik / Tentomon / Teafant', type: 'Bug/Electric', rarity: 'Common', description: 'Maintains static-charged catalog threads.' },
      { name: 'Archivist Moth', species: 'Dustox / Butterfreemon / Lumira', type: 'Bug/Psychic', rarity: 'Uncommon', description: 'Memorizes rune patterns for damaged scroll replacement.' },
      { name: 'Crystal Brood', species: 'Shuckle / Crystamon / Gumoss', type: 'Bug/Rock', rarity: 'Rare', description: 'Infuses silk with mineral clarity layers.' }
    ],
    resources: [
      { name: 'Memory Filament', rarity: 'Rare', description: 'Thread capturing sequential narrative intent.' },
      { name: 'Indexed Spool', rarity: 'Uncommon', description: 'Pre-sorted silk cluster easing transcription.' },
      { name: 'Dust Silk Floss', rarity: 'Common', description: 'Fine repair fiber for damaged panels.' }
    ],
    lore: 'Legends say every told story echoes here as a faint phosphor strand.',
    history: 'Expanded after convergence of three elder loom clusters formed stable lattice.',
    dangers: ['Static discharge arcs', 'Adhesive over-saturation', 'Disorientation in mirrored aisles'],
    tips: ['Carry anti-stick talc', 'Mark return anchor nodes', 'Limit filament exposure sessions']
  },
  'imperial-palace': {
    id: 'imperial-palace',
    name: 'Imperial Palace',
    regionId: 'long-valley',
    regionName: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/imperial-palace-detailed.png',
    description: 'Golden terrace palace where elder drakes decree realm edicts.',
    difficulty: 'Extreme',
    elevation: 'Terraced high seat',
    temperature: '58°F to 74°F',
    weatherPatterns: 'Pearl lantern glow, calm incense drafts',
    accessibility: 'Audience seal procession',
    recommendedLevel: '70-100',
    specialFeatures: ['Ancestral Pearl Court', 'Dragon Scale Terraces', 'Celestial Reflection Pools'],
    wildlife: [
      { name: 'Court Attendant', species: 'Dratini / Patamon / Univolt', type: 'Dragon/Fairy', rarity: 'Common', description: 'Assists with ceremonial arrangements.' },
      { name: 'Pearl Envoy', species: 'Dragonair / Seadramon / Lovander', type: 'Dragon/Water', rarity: 'Uncommon', description: 'Maintains reflective pool clarity.' },
      { name: 'Imperial Regent', species: 'Hydreigon / Wisemon / Jetragon', type: 'Dragon/Psychic', rarity: 'Rare', description: 'Adjudicates petitions with piercing insight.' }
    ],
    resources: [
      { name: 'Imperial Pearl Fragment', rarity: 'Rare', description: 'Lustrous shard amplifying focus.' },
      { name: 'Scale Inlay Chip', rarity: 'Uncommon', description: 'Decorative protective layering.' },
      { name: 'Incense Resin', rarity: 'Common', description: 'Fragrant compound calming volatile auras.' }
    ],
    lore: 'Seat of draconic jurisprudence and ancestral stewardship.',
    history: 'Rebuilt after solar alignment cracked earlier terraces.',
    dangers: ['Protocol breach penalties', 'Reflective glare fatigue'],
    tips: ['Observe silence rings', 'Present seal promptly', 'Limit gaze at zenith mirror']
  },
  'tianlong-city': {
    id: 'tianlong-city',
    name: 'Tianlong City',
    regionId: 'long-valley',
    regionName: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/tianlong-city-detailed.png',
    description: 'Celestial pagoda metropolis where spiral towers channel dragon breath into luminous sky scripts.',
    difficulty: 'Extreme',
    elevation: 'Cloud-crest terraces',
    temperature: '62°F to 80°F',
    weatherPatterns: 'Incense thermals, drifting scale glow motes',
    accessibility: 'Scaled ascent stair & glide platforms',
    recommendedLevel: '80-110',
    specialFeatures: [
      'Cloud Pagoda Spirals',
      'Imperial Jade Archives',
      'Celestial Calligraphy Courts',
      'Dragon Breath Resonance Wells'
    ],
    wildlife: [
      { name: 'Sky Attendant', species: 'Altaria / Patamon / Petallia', type: 'Dragon/Fairy', rarity: 'Common', description: 'Maintains incense updraft channels.' },
      { name: 'Glyph Drakelet', species: 'Goomy / Seadramon / Lumoth', type: 'Dragon/Water', rarity: 'Uncommon', description: 'Traces vapor scripts around tower crowns.' },
      { name: 'Celestial Archivist', species: 'Dragonite / Wisemon / Paladius', type: 'Dragon/Psychic', rarity: 'Rare', description: 'Ensures script integrity across layered chronicles.' }
    ],
    resources: [
      { name: 'Jade Script Plaque', rarity: 'Rare', description: 'Inscribed plate boosting focus and resolve.' },
      { name: 'Incense Coil Segment', rarity: 'Uncommon', description: 'Steady aromatic plume stabilizer.' },
      { name: 'Scale Sheen Powder', rarity: 'Common', description: 'Reflective dust used in ceremonial markings.' }
    ],
    lore: 'City towers align with seasonal dragon constellation arcs.',
    history: 'Founded when elder drakes unified dispersed scholarly aeries.',
    dangers: ['Updraft missteps', 'Protocol infraction censure', 'Scroll hall disorientation'],
    tips: ['Study greeting bows', 'Secure glide permits early', 'Avoid restricted archive tiers']
  },
  'jade-village': {
    id: 'jade-village',
    name: 'Jade Village',
    regionId: 'long-valley',
    regionName: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/jade-village-detailed.png',
    description: 'Artisan enclave shaping scale jade into luminous charms.',
    difficulty: 'Medium',
    elevation: 'Valley terrace',
    temperature: '60°F to 78°F',
    weatherPatterns: 'Soft kiln vapors, jade dust motes',
    accessibility: 'Terrace path network',
    recommendedLevel: '30-60',
    specialFeatures: ['Jade Carving Courts', 'Scale Polishing Fountains', 'Charm Foundries'],
    wildlife: [
      { name: 'Scale Pledger', species: 'Swablu / Shakomon / Lunaris', type: 'Dragon/Fairy', rarity: 'Common', description: 'Deposits old scales near polishing basins.' },
      { name: 'Charm Sprout', species: 'Bellsprout / Floramon / Gumoss', type: 'Grass/Fairy', rarity: 'Uncommon', description: 'Grows near jade slurry absorbing trace minerals.' },
      { name: 'Jade Curator', species: 'Altaria / Wisemon / Paladius', type: 'Dragon/Psychic', rarity: 'Rare', description: 'Evaluates resonance of finished charms.' }
    ],
    resources: [
      { name: 'Polished Scale Chip', rarity: 'Common', description: 'Refined fragment for basic adornments.' },
      { name: 'Jade Slurry Sample', rarity: 'Uncommon', description: 'Mineral-rich paste for carving lubrication.' },
      { name: 'Resonant Charm Core', rarity: 'Rare', description: 'Amplifies protective enchantments.' }
    ],
    lore: 'Village techniques preserve generational carving lineage.',
    history: 'Expanded after new canal terrace opened.',
    dangers: ['Jade dust inhalation', 'Wet stone slips'],
    tips: ['Use filtration veil', 'Keep footing dry', 'Store charms in padded cases']
  },
  'wisdom-town': {
    id: 'wisdom-town',
    name: 'Wisdom Town',
    regionId: 'long-valley',
    regionName: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/wisdom-town-detailed.png',
    description: 'Scholastic dragon borough maintaining vaulted jade-scroll archives and contemplative resonance cloisters.',
    difficulty: 'Hard',
    elevation: 'Terraced scholar ridge',
    temperature: '60°F to 78°F',
    weatherPatterns: 'Incense thermals, pearl mist condensation',
    accessibility: 'Tiered ramp galleries with scribe lifts',
    recommendedLevel: '55-85',
    specialFeatures: [
      'Jade Scroll Vaults',
      'Philosopher Cloisters',
      'Resonant Debate Forum',
      'Pearl Distillation Gardens'
    ],
    wildlife: [
      { name: 'Scroll Whelp', species: 'Axew / Motimon / Teafant', type: 'Dragon', rarity: 'Common', description: 'Gently warms parchment for preservation.' },
      { name: 'Archive Curator', species: 'Fraxure / Wisemon / Katress', type: 'Dragon/Psychic', rarity: 'Uncommon', description: 'Indexes multigeneration treatise tablets.' },
      { name: 'Resonance Elder', species: 'Haxorus / Andromon / Kazemon', type: 'Dragon/Steel', rarity: 'Rare', description: 'Moderates high-level philosophical harmonics.' }
    ],
    resources: [
      { name: 'Ink Pearl Fragment', rarity: 'Common', description: 'Pearl sliver used in durable script mixture.' },
      { name: 'Resonant Jade Slab', rarity: 'Uncommon', description: 'Vibratory tablet supporting memory retention.' },
      { name: 'Elder Debate Seal', rarity: 'Rare', description: 'Authorization token for restricted discourse halls.' }
    ],
    lore: 'Town ensures draconic wisdom lineage remains curated and reproducible.',
    history: 'Archive climate system upgraded after condensation event.',
    dangers: ['Information overload', 'Scroll humidity imbalance'],
    tips: ['Pace study intervals', 'Log borrowed tablets', 'Respect elder silence bells']
  },
  'kumasi-city': {
    id: 'kumasi-city',
    name: 'Kumasi City',
    regionId: 'anansi-woods',
    regionName: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/kumasi-city-detailed.png',
    description: 'Suspended web metropolis trading woven narratives and pattern lore.',
    difficulty: 'Medium',
    elevation: 'Canopy web tier',
    temperature: '70°F to 85°F',
    weatherPatterns: 'Filtered humidity, silk drift',
    accessibility: 'Web bridge network',
    recommendedLevel: '25-55',
    specialFeatures: ['Story Loom Markets', 'Web Archive Galleries', 'Thread Brokerage'],
    wildlife: [
      { name: 'Thread Courier', species: 'Grubbin / Tentomon / Jolthog', type: 'Bug/Electric', rarity: 'Common', description: 'Delivers encoded silk spools.' },
      { name: 'Pattern Broker', species: 'Kricketune / Waspmon / Cinnamoth', type: 'Bug/Flying', rarity: 'Uncommon', description: 'Negotiates motif rights.' },
      { name: 'Archive Keeper', species: 'Ariados / Andromon / Sweepa', type: 'Bug/Steel', rarity: 'Rare', description: 'Maintains indexing lattice.' }
    ],
    resources: [
      { name: 'Encoded Silk Spool', rarity: 'Common', description: 'Thread containing compressed tale motifs.' },
      { name: 'Pattern Catalyst Resin', rarity: 'Uncommon', description: 'Enhances stability of new design weaves.' },
      { name: 'Archivist Core Filament', rarity: 'Rare', description: 'Precision strand for high fidelity patterns.' }
    ],
    lore: 'Market fluctuations follow seasonal storytelling cycles.',
    history: 'Built where converging canopy tension lines offered natural support.',
    dangers: ['Thread bridge sway', 'Negotiation disputes'],
    tips: ['Secure trade tokens', 'Check tension knots', 'Respect archive silence zones']
  },
  'story-village': {
    id: 'story-village',
    name: 'Story Village',
    regionId: 'anansi-woods',
    regionName: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/story-village-detailed.png',
    description: 'Web-ring hamlet where every spiral strand encodes living folklore taught to initiates at dusk hearth circles.',
    difficulty: 'Easy',
    elevation: 'Lower canopy cradle',
    temperature: '72°F to 86°F',
    weatherPatterns: 'Dappled mist light, gentle silk mote drift',
    accessibility: 'Primary root ramp & training net paths',
    recommendedLevel: '10-30',
    specialFeatures: [
      'Living Web Story Scrolls',
      'Folklore Teaching Circles',
      'Child Weaver Lofts',
      'Night Glow Tale Loom'
    ],
    wildlife: [
      { name: 'Tale Hopper', species: 'Venipede / Motimon / Dumud', type: 'Bug', rarity: 'Common', description: 'Hops web to web spreading fresh narrative spores.' },
      { name: 'Silk Tutor', species: 'Kricketune / Tentomon / Petallia', type: 'Bug/Fairy', rarity: 'Uncommon', description: 'Guides apprentices weaving first glyph loops.' },
      { name: 'Archive Mender', species: 'Araquanid / Waspmon / Lumira', type: 'Bug/Water', rarity: 'Rare', description: 'Repairs frayed lore threads before memory loss.' }
    ],
    resources: [
      { name: 'Fresh Glyph Strand', rarity: 'Common', description: 'Newly spun filament ready for encoding.' },
      { name: 'Story Resin Drop', rarity: 'Uncommon', description: 'Semi-set bead stabilizing looping plots.' },
      { name: 'Memory Pearl Node', rarity: 'Rare', description: 'Condensed motif cluster enhancing recall.' }
    ],
    lore: 'Foundational narratives of the woods begin here as simple lattice songs.',
    history: 'Expanded when elder weavers decentralized archive growth.',
    dangers: ['Mild silk entanglement', 'Attention drift during multitale teaching'],
    tips: ['Attend orientation loom first', 'Respect pause chime signals', 'Avoid tugging active threads']
  },
  'web-town': {
    id: 'web-town',
    name: 'Web Town',
    regionId: 'anansi-woods',
    regionName: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/web-town-detailed.png',
    description: 'Silk-strand conurbation suspended on tension hubs where pattern engineers optimize narrative lattice throughput.',
    difficulty: 'Hard',
    elevation: 'Upper canopy tension grid',
    temperature: '70°F to 84°F',
    weatherPatterns: 'Resonant strand hum, dew prism scatter',
    accessibility: 'Harnessed radial strand bridges',
    recommendedLevel: '40-70',
    specialFeatures: [
      'Tension Hub Exchanges',
      'Pattern Compiler Looms',
      'Silk Resonance Arrays',
      'Encoded Freight Spools'
    ],
    wildlife: [
      { name: 'Strand Runner', species: 'Joltik / Tentomon / Jolthog', type: 'Bug/Electric', rarity: 'Common', description: 'Shuttles charge along data filaments.' },
      { name: 'Pattern Auditor', species: 'Ariados / Waspmon / Sweepa', type: 'Bug/Steel', rarity: 'Uncommon', description: 'Validates lattice integrity under load.' },
      { name: 'Resonance Broker', species: 'Galvantula / Andromon / Lumira', type: 'Bug/Electric', rarity: 'Rare', description: 'Balances multi-thread narrative throughput.' }
    ],
    resources: [
      { name: 'Resonant Silk Filament', rarity: 'Common', description: 'Conductive strand sustaining motif charge.' },
      { name: 'Tension Node Clamp', rarity: 'Uncommon', description: 'Stabilizer preventing harmonic drift.' },
      { name: 'Compiled Pattern Core', rarity: 'Rare', description: 'Dense encoded spool boosting crafting inspiration.' }
    ],
    lore: 'Established to alleviate congestion in original archive canopies.',
    history: 'Reinforced after a tri-node oscillation cascade.',
    dangers: ['Strand snap recoil', 'Harmonic overload'],
    tips: ['Check anchor harness', 'Monitor tension gauges', 'Avoid crossing during sync pulses']
  },
  'memory-cliffs': {
    id: 'memory-cliffs',
    name: 'Memory Cliffs',
    regionId: 'stoneheart-cliffs',
    regionName: 'Stoneheart Cliffs',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/memory-cliffs-detailed.png',
    description: 'Runic escarpments storing epochs of island history in glowing strata.',
    difficulty: 'Extreme',
    elevation: 'Cliff shelf sequence',
    temperature: '42°F to 60°F',
    weatherPatterns: 'Rune glow mist, updraft gusts',
    accessibility: 'Harness climb routes',
    recommendedLevel: '65-95',
    specialFeatures: ['Chronicle Strata Panels', 'Resonant Chisel Stations', 'Glyph Echo Cavities'],
    wildlife: [
      { name: 'Glyph Skitter', species: 'Anorith / Kokuwamon / Dumud', type: 'Rock/Bug', rarity: 'Common', description: 'Feeds on mineral trace behind carved lines.' },
      { name: 'Strata Watcher', species: 'Onix / Guardromon / Mossanda', type: 'Rock/Steel', rarity: 'Uncommon', description: 'Stabilizes loose inscription shelves.' },
      { name: 'Runic Oracle', species: 'Claydol / Wisemon / Katress', type: 'Rock/Psychic', rarity: 'Rare', description: 'Predicts chisel resonance outcomes.' }
    ],
    resources: [
      { name: 'Chronicle Dust', rarity: 'Common', description: 'Fine particulate dislodged from superficial runes.' },
      { name: 'Inscription Core Shard', rarity: 'Uncommon', description: 'Dense fragment holding persistent glyph energy.' },
      { name: 'Echo Lens Crystal', rarity: 'Rare', description: 'Focuses resonance to reveal hidden layers.' }
    ],
    lore: 'Every equinox new layers softly ignite revealing additions.',
    history: 'Catalogued systematically by generational rune stewards.',
    dangers: ['Loose shelf crumble', 'Echo vertigo'],
    tips: ['Test anchor bolts', 'Limit exposure to strong echoes', 'Label samples precisely']
  },
  'mictlampa-city': {
    id: 'mictlampa-city',
    name: 'Mictlampa City',
    regionId: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/mictlampa-city-detailed.png',
    description: 'Spirit-bazaar metropolis beneath ossuary arches and lantern canals.',
    difficulty: 'Hard',
    elevation: 'Subterranean plazas',
    temperature: '48°F to 60°F',
    weatherPatterns: 'Lantern glow haze, incense drift',
    accessibility: 'Bone stair descent',
    recommendedLevel: '35-70',
    specialFeatures: ['Lantern Canals', 'Memory Token Markets', 'Ancestral Altars'],
    wildlife: [
      { name: 'Lantern Wisp', species: 'Litwick / Candlemon / Foxparks', type: 'Ghost/Fire', rarity: 'Common', description: 'Drifts lighting trade routes.' },
      { name: 'Token Broker', species: 'Sableye / Dracmon / Vixy', type: 'Dark/Ghost', rarity: 'Uncommon', description: 'Trades memories for relic fragments.' },
      { name: 'Ancestral Phalanx', species: 'Dusclops / Bakemon / Necromus', type: 'Ghost/Dark', rarity: 'Rare', description: 'Patrol unit maintaining ritual order.' }
    ],
    resources: [
      { name: 'Memory Token', rarity: 'Common', description: 'Encodes a minor ancestral recollection.' },
      { name: 'Lantern Resin', rarity: 'Uncommon', description: 'Burns with steady pale light in rituals.' },
      { name: 'Ossuary Relic Shard', rarity: 'Rare', description: 'Fragment from honored crypt guardian.' }
    ],
    lore: 'Founded to harmonize living pilgrims and ancestral guidance.',
    history: 'Expanded with tiered canal system to manage spirit flow.',
    dangers: ['Crowded procession crush', 'Incense overexposure'],
    tips: ['Keep to marked flow lanes', 'Carry vented mask', 'Respect altar silence zones']
  },
  'xochitonal-village': {
    id: 'xochitonal-village',
    name: 'Xochitonal Village',
    regionId: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/xochitonal-village-detailed.png',
    description: 'Floral remembrance settlement where continuous altar cycles sustain vibrant ancestor communion rituals.',
    difficulty: 'Medium',
    elevation: 'Subterranean bloom chambers',
    temperature: '64°F to 72°F',
    weatherPatterns: 'Phosphor pollen glow, gentle echo drizzle',
    accessibility: 'Petal-lined descent ramps',
    recommendedLevel: '30-60',
    specialFeatures: [
      'Living Marigold Altars',
      'Ancestral Petal Canals',
      'Spirit Candle Gardens',
      'Memory Offering Pavilion'
    ],
    wildlife: [
      { name: 'Petal Spiritlet', species: 'Shuppet / Motimon / Teafant', type: 'Ghost/Grass', rarity: 'Ghost/Grass', description: 'Floats distributing memorial pollen.' },
      { name: 'Altar Guardian', species: 'Dusclops / Dracmon / Lumira', type: 'Ghost', rarity: 'Uncommon', description: 'Stabilizes offering energy signatures.' },
      { name: 'Remembrance Guide', species: 'Dhelmise / Wisemon / BlackGatomon', type: 'Ghost/Steel', rarity: 'Rare', description: 'Leads processions through echo canals.' }
    ],
    resources: [
      { name: 'Memorial Petal Bundle', rarity: 'Common', description: 'Assorted bright petals charged with gentle spirit tone.' },
      { name: 'Spirit Candle Wax', rarity: 'Uncommon', description: 'Slow-burning compound sustaining ritual illumination.' },
      { name: 'Ancestor Echo Charm', rarity: 'Rare', description: 'Harmonic talisman improving safe underworld traversal.' }
    ],
    lore: 'Village preserves daily honoring processes preventing fading of local ancestral narratives.',
    history: 'Expanded after canal restoration increased ceremony capacity.',
    dangers: ['Overcrowded procession paths', 'Minor spirit overattachment'],
    tips: ['Offer respectful silence', 'Rotate candle placements', 'Carry guided return charm']
  },
  'mist-village': {
    id: 'mist-village',
    name: 'Mist Village',
    regionId: 'mist-marshlands',
    regionName: 'Mist Marshlands',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/mist-village-detailed.png',
    description: 'Stilted marsh hamlet fading in and out of spectral fog bands.',
    difficulty: 'Medium',
    elevation: 'Stilt platform level',
    temperature: '55°F to 68°F',
    weatherPatterns: 'Rolling fog pulses, dew veil',
    accessibility: 'Boardwalk approaches',
    recommendedLevel: '20-55',
    specialFeatures: ['Fog Pulse Piers', 'Reed Flute Platforms', 'Biolight Pool Nets'],
    wildlife: [
      { name: 'Reed Hopper', species: 'Lotad / Syakomon / Teafant', type: 'Water/Grass', rarity: 'Common', description: 'Skims between lily nets filtering plankton.' },
      { name: 'Mist Sprite', species: 'Phantump / Candlemon / Lumira', type: 'Ghost/Grass', rarity: 'Uncommon', description: 'Condenses around flute melodies.' },
      { name: 'Pool Guardian', species: 'Quagsire / Shakomon / Celeray', type: 'Water/Ghost', rarity: 'Rare', description: 'Surfaces during dense fog peaks.' }
    ],
    resources: [
      { name: 'Reed Fiber Bundle', rarity: 'Common', description: 'Flexible marsh weaving material.' },
      { name: 'Biolight Algae', rarity: 'Uncommon', description: 'Glows softly when hydrated.' },
      { name: 'Condensed Mist Core', rarity: 'Rare', description: 'Stabilized vapor nucleus used in catalysts.' }
    ],
    lore: 'Village relies on fog cycles for concealment and moisture farming.',
    history: 'Rebuilt after a low-water year exposed supports.',
    dangers: ['Boardwalk slicks', 'Low visibility collisions'],
    tips: ['Use guide ropes', 'Mark turns with shells', 'Carry dryness packs']
  },
  'nine-dragons': {
    id: 'nine-dragons',
    name: 'Nine Dragons Falls',
    regionId: 'long-valley',
    regionName: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/nine-dragons-detailed.png',
    description: 'Sacred cascade where spectral dragon arches braid mist pearls.',
    difficulty: 'Extreme',
    elevation: 'Multi-tier falls',
    temperature: '50°F to 70°F',
    weatherPatterns: 'Continuous spray, prism haze',
    accessibility: 'Pilgrim stair trail',
    recommendedLevel: '70-100',
    specialFeatures: ['Dragon Mist Arches', 'Pearl Spray Basins', 'Chant Echo Ledges'],
    wildlife: [
      { name: 'Pearl Drakeling', species: 'Dratini / Seadramon / Lovander', type: 'Dragon/Water', rarity: 'Common', description: 'Circles lower basins collecting spray.' },
      { name: 'Mist Archon', species: 'Altaria / AeroVeedramon / Petallia', type: 'Dragon/Fairy', rarity: 'Uncommon', description: 'Maintains arch stability during chants.' },
      { name: 'Cascade Sovereign', species: 'Dragonite / HiAndromon / Paladius', type: 'Dragon/Psychic', rarity: 'Rare', description: 'Manifests at triple-chant intervals.' }
    ],
    resources: [
      { name: 'Mist Pearl', rarity: 'Rare', description: 'Condensed droplet crystallized by draconic resonance.' },
      { name: 'Cascade Spray Sample', rarity: 'Uncommon', description: 'Charged water with focus potential.' },
      { name: 'Wet Stone Chip', rarity: 'Common', description: 'Smoothed fragment from lower ledge.' }
    ],
    lore: 'Falls said to mirror nine ancestral dragon lineages.',
    history: 'Pilgrimages formalized after first recorded triple resonance.',
    dangers: ['Slippery ledges', 'Spray disorientation', 'Chant echo vertigo'],
    tips: ['Use tread spikes', 'Time climbs between chant phases', 'Secure gear against spray']
  },
  'titania-city': {
    id: 'titania-city',
    name: 'Titania City',
    regionId: 'seelie-courts',
    regionName: 'Seelie Courts',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/titania-city-detailed.png',
    description: 'Crystal spire capital whose gardens bloom in impossible chromatic cycles tuned to collective court emotion.',
    difficulty: 'Hard',
    elevation: 'Spire terrace canopies',
    temperature: '58°F to 76°F',
    weatherPatterns: 'Petal light showers, resonance chime breezes',
    accessibility: 'Petal lift platforms & spiral root causeways',
    recommendedLevel: '55-85',
    specialFeatures: [
      'Crystal Spires',
      'Emotion Bloom Gardens',
      'Royal Court Amphitheater',
      'Prism Fountain Promenade'
    ],
    wildlife: [
      { name: 'Prism Flutter', species: 'Cutiefly / Fairimon / Lumira', type: 'Fairy/Bug', rarity: 'Common', description: 'Synchronizes wing hues with garden pulses.' },
      { name: 'Court Envoy', species: 'Togekiss / Angewomon / Katress', type: 'Fairy/Flying', rarity: 'Uncommon', description: 'Carries decree petals between terraces.' },
      { name: 'Spire Regent', species: 'Sylveon / Wisemon / Paladius', type: 'Fairy/Psychic', rarity: 'Rare', description: 'Mediates emotional resonance fluctuations.' }
    ],
    resources: [
      { name: 'Prism Petal', rarity: 'Rare', description: 'Multicolor bloom segment enhancing charm crafting.' },
      { name: 'Chime Crystal Sliver', rarity: 'Uncommon', description: 'Emits steady calming tone.' },
      { name: 'Garden Dew Veil', rarity: 'Common', description: 'Collected morning condensate preserving freshness.' }
    ],
    lore: 'City mood lights mirror collective court harmony states.',
    history: 'Expanded as emotional resonance mapping improved regulation.',
    dangers: ['Overstimulation fatigue', 'Terrace slip risk', 'Resonance echo loops'],
    tips: ['Wear hue adaptation lenses', 'Rest between promenade tiers', 'Avoid disrupting chime cycles']
  },
  'summer-court': {
    id: 'summer-court',
    name: 'Summer Court',
    regionId: 'seelie-courts',
    regionName: 'Seelie Courts',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/summer-court-detailed.png',
    description: 'Eternal solstice pavilion hosting luminous festivals of renewal, light weaving, and joy rites.',
    difficulty: 'Extreme',
    elevation: 'Sunstone pavilion rise',
    temperature: '70°F to 88°F',
    weatherPatterns: 'Radiant sun halos, warm petal thermals',
    accessibility: 'Season key bloom gate',
    recommendedLevel: '75-105',
    specialFeatures: [
      'Eternal Summer Canopy',
      'Light Festival Courts',
      'Joy Renewal Ceremonies',
      'Sunstone Rapture Altars'
    ],
    wildlife: [
      { name: 'Solstice Sprite', species: 'Cleffa / Candlemon / Foxparks', type: 'Fairy/Fire', rarity: 'Common', description: 'Trails radiant sparks during dances.' },
      { name: 'Helio Petaler', species: 'Florges / Lilamon / Petallia', type: 'Fairy/Grass', rarity: 'Uncommon', description: 'Conducts bloom synchronization rituals.' },
      { name: 'Sunflare Herald', species: 'Rapidash / Angewomon / Jetragon', type: 'Fire/Fairy', rarity: 'Rare', description: 'Announces rite sequences in solar glyphs.' }
    ],
    resources: [
      { name: 'Sunstone Fragment', rarity: 'Rare', description: 'Stores condensed festival radiance.' },
      { name: 'Festival Ribbon Strand', rarity: 'Uncommon', description: 'Woven strip amplifying morale effects.' },
      { name: 'Sol Dew Drop', rarity: 'Common', description: 'Bright droplet boosting minor healing brews.' }
    ],
    lore: 'Court believed to anchor cyclical emotional rejuvenation island-wide.',
    history: 'Formed when perennial bloom alignment stabilized ambient warmth.',
    dangers: ['Heat mirage fatigue', 'Overexposure glare', 'Rite crowd surges'],
    tips: ['Hydrate frequently', 'Use glare veils', 'Respect procession spacing']
  },
  'oberon-village': {
    id: 'oberon-village',
    name: 'Oberon Village',
    regionId: 'seelie-courts',
    regionName: 'Seelie Courts',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/oberon-village-detailed.png',
    description: 'Regal fae enclave balancing ritual order and seasonal magic.',
    difficulty: 'Hard',
    elevation: 'Clearing terrace',
    temperature: '60°F to 74°F',
    weatherPatterns: 'Petal drift, crystal pennant chimes',
    accessibility: 'Runic arch gate',
    recommendedLevel: '45-80',
    specialFeatures: ['Crystal Pennant Courts', 'Moonlit Rite Circles', 'Petal Banner Hall'],
    wildlife: [
      { name: 'Court Sylph', species: 'Ribombee / Fairimon / Petallia', type: 'Fairy/Bug', rarity: 'Common', description: 'Carries ritual pollen to banners.' },
      { name: 'Banner Warden', species: 'Gardevoir / Kazemon / Sweepa', type: 'Fairy/Psychic', rarity: 'Uncommon', description: 'Monitors banner resonance during rites.' },
      { name: 'Regal Antlerkin', species: 'Sawsbuck / Cherrymon / Mossanda', type: 'Grass/Fairy', rarity: 'Rare', description: 'Oversees seasonal court transitions.' }
    ],
    resources: [
      { name: 'Pollen Seal', rarity: 'Common', description: 'Stamped token confirming rite attendance.' },
      { name: 'Resonant Pennant Fiber', rarity: 'Uncommon', description: 'Chimes faintly when near aligned moonlight.' },
      { name: 'Court Crest Shard', rarity: 'Rare', description: 'Holds imprint of seasonal authority.' }
    ],
    lore: 'Village ensures continuity of fae governance cycles.',
    history: 'Founded after disputes required structured court protocols.',
    dangers: ['Rite area crowding', 'Resonance fatigue'],
    tips: ['Observe ritual boundaries', 'Carry resonance dampener', 'Rest between chant phases']
  },
  'puck-town': {
    id: 'puck-town',
    name: 'Puck Town',
    regionId: 'seelie-courts',
    regionName: 'Seelie Courts',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/puck-town-detailed.png',
    description: 'Prankster fae borough alive with glamours and playful illusions.',
    difficulty: 'Medium',
    elevation: 'Forest lane level',
    temperature: '62°F to 76°F',
    weatherPatterns: 'Illusory lantern swaps, laughter gusts',
    accessibility: 'Winding charm paths',
    recommendedLevel: '25-55',
    specialFeatures: ['Glamour Spiral Plaza', 'Prank Sprite Alleys', 'Illusion Lantern Lanes'],
    wildlife: [
      { name: 'Lantern Flicker', species: 'Morelull / Candlemon / Foxparks', type: 'Fairy/Grass', rarity: 'Common', description: 'Shifts lantern hues erratically.' },
      { name: 'Prank Weaver', species: 'Cutiefly / Kodokugumon / Vixy', type: 'Fairy/Bug', rarity: 'Uncommon', description: 'Spins temporary illusion threads.' },
      { name: 'Glamour Trickster', species: 'Mimikyu / BlackGatomon / Sweepa', type: 'Fairy/Dark', rarity: 'Rare', description: 'Orchestrates multi-lane prank cascades.' }
    ],
    resources: [
      { name: 'Illusion Thread', rarity: 'Common', description: 'Ephemeral fiber sustaining minor glamours.' },
      { name: 'Prank Dust', rarity: 'Uncommon', description: 'Sparkle particulate triggering laughter reflex.' },
      { name: 'Glamour Core Prism', rarity: 'Rare', description: 'Focus crystal for stable large-scale illusions.' }
    ],
    lore: 'Town channels disruptive creativity into controlled displays.',
    history: 'Established after wandering prank bands sought a base.',
    dangers: ['Disorientation', 'Path misdirection'],
    tips: ['Anchor with focus charm', 'Verify signposts twice', 'Avoid chasing stray lights']
  },
  'pythia-village': {
    id: 'pythia-village',
    name: 'Pythia Village',
    regionId: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/pythia-village-detailed.png',
    description: 'Novice oracle settlement training focus through ritual resonance.',
    difficulty: 'Medium',
    elevation: 'Hill terrace',
    temperature: '58°F to 72°F',
    weatherPatterns: 'Incense drift, bronze bowl tones',
    accessibility: 'Pilgrim stone path',
    recommendedLevel: '20-50',
    specialFeatures: ['Scrying Basin Courts', 'Resonance Sand Circles', 'Mind Crystal Groves'],
    wildlife: [
      { name: 'Focus Initiate', species: 'Ralts / Clockmon / Teafant', type: 'Psychic/Fairy', rarity: 'Common', description: 'Practices low-tier foresight patterns.' },
      { name: 'Sigil Keeper', species: 'Kirlia / Wisemon / Petallia', type: 'Psychic/Fairy', rarity: 'Uncommon', description: 'Maintains sand sigil accuracy.' },
      { name: 'Vision Warden', species: 'Gardevoir / Kazemon / Katress', type: 'Psychic/Fairy', rarity: 'Rare', description: 'Guides group trance harmonics.' }
    ],
    resources: [
      { name: 'Mind Crystal Chip', rarity: 'Common', description: 'Minor focus enhancer.' },
      { name: 'Incense Pellet', rarity: 'Uncommon', description: 'Sustains steady meditative rhythm.' },
      { name: 'Resonant Basin Shard', rarity: 'Rare', description: 'Amplifies predictive clarity.' }
    ],
    lore: 'Village formalizes early prophecy discipline pathways.',
    history: 'Expanded after surplus of wandering petitioners.',
    dangers: ['Vision fatigue', 'Incense over-inhalation'],
    tips: ['Rotate focus drills', 'Vent chambers regularly', 'Log trance durations']
  },
  'vision-town': {
    id: 'vision-town',
    name: 'Vision Town',
    regionId: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/vision-town-detailed.png',
    description: 'High ridge research enclave where disciplined psychic analysts model probability braids under auric shielding.',
    difficulty: 'Hard',
    elevation: 'Ridgetop plateaus',
    temperature: '54°F to 69°F',
    weatherPatterns: 'Clear thermal updrafts, prism halo refraction',
    accessibility: 'Switchback stair ascents with focus rest bays',
    recommendedLevel: '40-70',
    specialFeatures: [
      'Probability Lattice Labs',
      'Auric Shield Arrays',
      'Temporal Pattern Vault',
      'Foresight Harmonizer Ring'
    ],
    wildlife: [
      { name: 'Focus Finch', species: 'Natu / Candlemon / Teafant', type: 'Psychic/Flying', rarity: 'Common', description: 'Perches on calibration rods stabilizing mind fields.' },
      { name: 'Lattice Analyst', species: 'Kirlia / Wisemon / Petallia', type: 'Psychic', rarity: 'Uncommon', description: 'Charts divergence thresholds in sand arrays.' },
      { name: 'Auric Warden', species: 'Metang / Andromon / Katress', type: 'Psychic/Steel', rarity: 'Rare', description: 'Maintains shield resonance under storm interference.' }
    ],
    resources: [
      { name: 'Probabilistic Sand Sample', rarity: 'Common', description: 'Fine grit capturing branching imprint traces.' },
      { name: 'Auric Shield Plate', rarity: 'Uncommon', description: 'Segment from overcharged focus barrier ring.' },
      { name: 'Temporal Phase Crystal', rarity: 'Rare', description: 'Stabilizes mid-range predictive echo depth.' }
    ],
    lore: 'Founded when wandering seers required structured analytic synthesis beyond trance artistry.',
    history: 'Expanded after coordinated mitigation of a cascading misread cycle.',
    dangers: ['Prediction overfitting', 'Focus dehydration', 'Vertigo on ridge storms'],
    tips: ['Hydrate between lattice sessions', 'Cross-validate multi-view visions', 'Log shield flux differentials']
  },
  'sacred-vapors': {
    id: 'sacred-vapors',
    name: 'Sacred Vapors',
    regionId: 'oracles-sanctum',
    regionName: "Oracle's Sanctum",
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/sacred-vapors-detailed.png',
    description: 'Geothermal trance caverns where shimmering prophetic mists heighten multi-thread perception.',
    difficulty: 'Extreme',
    elevation: 'Subterranean fumerole galleries',
    temperature: '92°F humid (vent peaks 120°F)',
    weatherPatterns: 'Pulse mist billows, condensate drip rhythms',
    accessibility: 'Guided descent with vapor ward mask',
    recommendedLevel: '70-95',
    specialFeatures: [
      'Trance Vapor Pools',
      'Echo Vision Chambers',
      'Geode Resonance Walls',
      'Temporal Pulse Fissures'
    ],
    wildlife: [
      { name: 'Mist Seerling', species: 'Spoink / Candlemon / Teafant', type: 'Psychic/Fire', rarity: 'Common', description: 'Bobs over vents absorbing focused fumes.' },
      { name: 'Vapor Oracle', species: 'Grumpig / Wisemon / Katress', type: 'Psychic', rarity: 'Uncommon', description: 'Stabilizes volatile vision currents.' },
      { name: 'Quartz Wisp', species: 'Chimecho / Solarmon / Petallia', type: 'Psychic/Fairy', rarity: 'Rare', description: 'Resonates with crystalline chamber frequencies.' }
    ],
    resources: [
      { name: 'Condensed Prophecy Dew', rarity: 'Rare', description: 'Collected from cooled stalactite drip cycles.' },
      { name: 'Vapor Geode Fragment', rarity: 'Uncommon', description: 'Enhances clarity in scrying apparatus.' },
      { name: 'Thermal Salt Crust', rarity: 'Common', description: 'Base reagent moderating trance volatility.' }
    ],
    lore: 'Sages claim overlapping destinies precipitate as mist stratification here.',
    history: 'Discovered after seismic shift opened lower vent lattice.',
    dangers: ['Hyper-vision overload', 'Heat exhaustion', 'Steam pocket bursts'],
    tips: ['Limit continuous exposure', 'Hydrate aggressively', 'Anchor with focus talisman']
  },
  'river-crossing': {
    id: 'river-crossing',
    name: 'River of Souls Crossing',
    regionId: 'mictlan-hollows',
    regionName: 'Mictlan Hollows',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/river-crossing-detailed.png',
    description: 'Mystic ferry juncture guiding offerings between realms.',
    difficulty: 'Hard',
    elevation: 'Riverbank terraces',
    temperature: '50°F to 62°F',
    weatherPatterns: 'Soul mist eddies, lantern reflections',
    accessibility: 'Ferryman token queue',
    recommendedLevel: '45-85',
    specialFeatures: ['Ferryman Docks', 'Offering Petal Rafts', 'Soul Current Whirlpools'],
    wildlife: [
      { name: 'Petal Guide', species: 'Cottonee / Palmon / Lumira', type: 'Grass/Fairy', rarity: 'Common', description: 'Steers petal rafts gently.' },
      { name: 'Lantern Ferrid', species: 'Lampent / Bakemon / Teafant', type: 'Ghost/Fire', rarity: 'Uncommon', description: 'Illuminates current splits.' },
      { name: 'Current Shade', species: 'Froslass / Syakomon / Necromus', type: 'Ghost/Water', rarity: 'Rare', description: 'Glides beneath surface attracting spirits.' }
    ],
    resources: [
      { name: 'Petal Offering', rarity: 'Common', description: 'Minor tribute easing current passage.' },
      { name: 'Lantern Wick Core', rarity: 'Uncommon', description: 'Holds steady blue flame.' },
      { name: 'Soul Current Vial', rarity: 'Rare', description: 'Captured eddy infused with transitional energy.' }
    ],
    lore: 'Crossing commemorates journeys of remembrance and release.',
    history: 'Formal docks built after unregulated crossings caused drift loss.',
    dangers: ['Current pull', 'Lantern glare disorientation'],
    tips: ['Secure tokens early', 'Avoid overloading rafts', 'Follow ferryman signals']
  },
};

  useEffect(() => {
    const area = Areas[areaId];
    setAreaData(area);
    if (area) {
      setBreadcrumbData({
        landmassId: area.landmassId,
        landmassName: area.landmassName,
        regionId: area.regionId,
        regionName: area.regionName
      });
    }
  }, [areaId]);

  const handleBack = () => {
    navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      case 'extreme': return '#8e44ad';
      default: return '#95a5a6';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#95a5a6';
      case 'uncommon': return '#2ecc71';
      case 'rare': return '#3498db';
      case 'extreme': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  if (!areaData) {
    return <div className="loading">Loading area data...</div>;
  }

  return (
    <div className="area-page">
      <div className="area-header">
        <div className="breadcrumb">
          <button onClick={() => navigate('/guides/interactive-map')} className="breadcrumb-link">
            World Map
          </button>
          <span className="breadcrumb-separator">›</span>
          <button onClick={() => navigate(`/guides/interactive-map/landmass/${landmassId}`)} className="breadcrumb-link">
            {breadcrumbData.landmassName}
          </button>
          <span className="breadcrumb-separator">›</span>
          <button onClick={handleBack} className="breadcrumb-link">
            {breadcrumbData.regionName}
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="currency-label">{areaData.name}</span>
        </div>
        <button onClick={handleBack} className="button secondary">
          ← Back to {breadcrumbData.regionName}
        </button>
        <div className="item-header">
          <h1>{areaData.name}</h1>
          <div
            className="badge lg"
            style={{ backgroundColor: getDifficultyColor(areaData.difficulty) }}
          >
            {areaData.difficulty}
          </div>
        </div>
        <p className="area-subtitle">{areaData.description}</p>
      </div>

      <div className="area-content">
        <div className="area-image-section">
          <img 
            src={areaData.image} 
            alt={areaData.name}
            className="area-main-image"
            onError={(e) => handleMapImageError(e, 'map')}
          />
        </div>

        <div className="area-details">
          <div className="tips">
            <h3>Quick Facts</h3>
            <div className="facts-grid">
              <div className="fact-item">
                <strong>Difficulty:</strong>
                <span style={{ color: getDifficultyColor(areaData.difficulty) }}>
                  {areaData.difficulty}
                </span>
              </div>
              <div className="fact-item">
                <strong>Elevation:</strong>
                <span>{areaData.elevation}</span>
              </div>
              <div className="fact-item">
                <strong>Temperature:</strong>
                <span>{areaData.temperature}</span>
              </div>
              <div className="fact-item">
                <strong>Recommended Level:</strong>
                <span>{areaData.recommendedLevel}</span>
              </div>
              <div className="fact-item">
                <strong>Weather:</strong>
                <span>{areaData.weatherPatterns}</span>
              </div>
              <div className="fact-item">
                <strong>Accessibility:</strong>
                <span>{areaData.accessibility}</span>
              </div>
            </div>
          </div>

          <div className="tips">
            <h3>Special Features</h3>
            <div className="feature-list">
              {areaData.specialFeatures.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-bullet">•</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="tips">
            <h3>Wildlife</h3>
            <div className="wildlife-grid">
              {areaData.wildlife.map((creature, index) => (
                <div key={index} className="area-card">
                  <div className="resource-header">
                    <h4>{creature.name}</h4>
                    <span
                      className="badge"
                      style={{ backgroundColor: getRarityColor(creature.rarity) }}
                    >
                      {creature.rarity}
                    </span>
                  </div>
                  <div className="wildlife-species">{creature.species}</div>
                  <div className="wildlife-type">{creature.type}</div>
                  <p>{creature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tips">
            <h3>Resources</h3>
            <div className="wildlife-grid">
              {areaData.resources.map((resource, index) => (
                <div key={index} className="area-card">
                  <div className="resource-header">
                    <h4>{resource.name}</h4>
                    <span
                      className="badge"
                      style={{ backgroundColor: getRarityColor(resource.rarity) }}
                    >
                      {resource.rarity}
                    </span>
                  </div>
                  <p>{resource.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tips">
            <h3>Lore & Legends</h3>
            <p>{areaData.lore}</p>
          </div>

          <div className="tips">
            <h3>Historical Significance</h3>
            <p>{areaData.history}</p>
          </div>

          <div className="tips">
            <div className="dangers-warnings">
              <div className="tips">
                <h3>⚠️ Dangers & Hazards</h3>
                <ul>
                  {areaData.dangers.map((danger, index) => (
                    <li key={index}>{danger}</li>
                  ))}
                </ul>
              </div>
              <div className="tips">
                <h3>💡 Survival Tips</h3>
                <ul>
                  {areaData.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaPage;