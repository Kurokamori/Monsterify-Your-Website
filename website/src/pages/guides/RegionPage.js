import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleMapImageError } from '../../utils/imageUtils';

const RegionPage = () => {
  const { landmassId, regionId } = useParams();
  const navigate = useNavigate();
  const [regionData, setRegionData] = useState(null);
  const [landmassData, setLandmassData] = useState(null);
  const [hoveredArea, setHoveredArea] = useState(null);

const Regions = {
  // Conoco Island Regions - 18 Mythological Regions
  'hearthfall-commons': {
    id: 'hearthfall-commons',
    name: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/hearthfall-commons-detailed.png',
    description: 'A peaceful northern homeland with cozy settlements, where Normal-type Monsters gather in harmonious communities.',
    climate: 'Temperate Continental (Northern climate)',
    elevation: '200 - 800 ft',
    dominantTypes: ['Normal'],
    wildlife: 'Cozy Cabin Monsters, Hearth Spirits, Community Gatherers',
    resources: 'Hearthwood, Comfort Berries, Warm Stones',
    lore: 'Inspired by northern concepts of community and comfort, this region embodies the simple joys of home and hearth. The Normal-type Monsters here are known for their loyalty and protective nature toward their human companions, much like the legendary bond between close-knit families and their guardian spirits.',
    areas: [
      {
        id: 'heimdal-city',
        name: 'Heimdal City',
        image: '/images/maps/areas/heimdal-city.png',
        description: 'The region\'s capital, a bustling city with cozy wooden buildings and central hearths in every home.',
        coordinates: { x: 35, y: 40, width: 25, height: 20 },
        difficulty: 'Easy',
        specialFeatures: ['Regional Capital', 'Monsters Center Network', 'Great Hall', 'Community Festivals']
      },
      {
        id: 'hygge-village',
        name: 'Hygge Village',
        image: '/images/maps/areas/hygge-village.png',
        description: 'A quaint village embodying the northern concept of cozy contentment and simple pleasures.',
        coordinates: { x: 15, y: 25, width: 15, height: 12 },
        difficulty: 'Easy',
        specialFeatures: ['Cozy Cafes', 'Knitting Circles', 'Fireplace Gatherings', 'Comfort Food']
      },
      {
        id: 'bonfire-town',
        name: 'Bonfire Town',
        image: '/images/maps/areas/bonfire-town.png',
        description: 'A lively town centered around a perpetual bonfire where stories and warmth are shared.',
        coordinates: { x: 60, y: 30, width: 18, height: 15 },
        difficulty: 'Easy',
        specialFeatures: ['Eternal Bonfire', 'Storytelling Circles', 'Night Markets', 'Song Festivals']
      },
      {
        id: 'hearthstone-temple',
        name: 'Hearthstone Temple',
        image: '/images/maps/areas/hearthstone-temple.png',
        description: 'Ancient temple with a sacred hearthstone that never grows cold, blessing homes across the region.',
        coordinates: { x: 40, y: 15, width: 12, height: 10 },
        difficulty: 'Medium',
        specialFeatures: ['Sacred Hearthstone', 'Blessing Ceremonies', 'Ancient Runes', 'Guardian Spirits']
      },
      {
        id: 'golden-hall',
        name: 'Golden Hall',
        image: '/images/maps/areas/golden-hall.png',
        description: 'Magnificent mead hall where legendary trainers gather to share tales of their adventures.',
        coordinates: { x: 25, y: 55, width: 20, height: 15 },
        difficulty: 'Medium',
        specialFeatures: ['Legendary Mead Hall', 'Hero Tapestries', 'Trophy Displays', 'Epic Feasts']
      }
    ]
  },
  'agni-peaks': {
    id: 'agni-peaks',
    name: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/agni-peaks-detailed.png',
    description: 'Sacred fire mountains where eternal flames burn, home to powerful Fire-type Monsters.',
    climate: 'Volcanic Tropical (Sacred Fire Climate)',
    elevation: '3,000 - 8,500 ft',
    dominantTypes: ['Fire'],
    wildlife: 'Sacred Flame Spirits, Volcanic Salamanders, Fire Temple Guardians',
    resources: 'Sacred Ash, Fire Crystals, Blessed Charcoal',
    lore: 'Named after the ancient spirit of fire, this region\'s eternal flames are said to purify both body and spirit. Fire-type Monsters here perform sacred rituals at dawn and dusk, and the region\'s temples host ceremonies where trainers can strengthen their bonds through trials of courage and purification.',
    areas: [
      {
        id: 'agni-city',
        name: 'Agni City',
        image: '/images/maps/areas/agni-city.png',
        description: 'Mountain city built into volcanic slopes, with sacred fire temples and flowing lava channels.',
        coordinates: { x: 40, y: 35, width: 30, height: 25 },
        difficulty: 'Hard',
        specialFeatures: ['Sacred Fire Temples', 'Lava Channels', 'Purification Ceremonies', 'Fire Trials']
      },
      {
        id: 'yagna-village',
        name: 'Yagna Village',
        image: '/images/maps/areas/yagna-village.png',
        description: 'Village of fire ceremony practitioners who maintain the sacred flames and perform ancient rituals.',
        coordinates: { x: 20, y: 50, width: 18, height: 15 },
        difficulty: 'Medium',
        specialFeatures: ['Fire Ceremonies', 'Sacred Offerings', 'Ritual Grounds', 'Flame Keepers']
      },
      {
        id: 'tapas-town',
        name: 'Tapas Town',
        image: '/images/maps/areas/tapas-town.png',
        description: 'Meditation town where ascetics practice fire-based spiritual discipline and inner purification.',
        coordinates: { x: 60, y: 20, width: 15, height: 12 },
        difficulty: 'Hard',
        specialFeatures: ['Meditation Centers', 'Ascetic Hermitages', 'Inner Fire Training', 'Spiritual Discipline']
      },
      {
        id: 'sacred-pyre',
        name: 'Sacred Pyre Temple',
        image: '/images/maps/areas/sacred-pyre.png',
        description: 'Ancient temple complex surrounding the first sacred fire, where the fire spirit is said to dwell.',
        coordinates: { x: 35, y: 60, width: 20, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['First Sacred Fire', 'Fire Spirit\'s Dwelling', 'Ancient Altars', 'Divine Presence']
      },
      {
        id: 'eternal-flame',
        name: 'Eternal Flame Shrine',
        image: '/images/maps/areas/eternal-flame.png',
        description: 'Mountain peak shrine where the eternal flame burns, visible from across the entire island.',
        coordinates: { x: 50, y: 10, width: 12, height: 15 },
        difficulty: 'Extreme',
        specialFeatures: ['Eternal Flame', 'Island Beacon', 'Peak Shrine', 'Divine Light']
      }
    ]
  },
  'poseidons-reach': {
    id: 'poseidons-reach',
    name: 'Poseidon\'s Reach',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/poseidons-reach-detailed.png',
    description: 'Coastal realm ruled by the sea lord\'s power, teeming with Water-type Monsters.',
    climate: 'Mediterranean Marine',
    elevation: 'Sea Level - 400 ft',
    dominantTypes: ['Water'],
    wildlife: 'Trident Wielders, Coral Architects, Deep Sea Oracles',
    resources: 'Divine Pearls, Sea Salt, Triton Shells',
    lore: 'The domain of the sea lord\'s influence, where the sea itself seems alive with ancient power. Water-type Monsters here display remarkable intelligence and coordination, forming complex underwater societies. The region\'s tides follow mysterious patterns that local oracles claim reveal prophecies of the future.',
    areas: [
      {
        id: 'atlantis-city',
        name: 'Atlantis City',
        image: '/images/maps/areas/atlantis-city.png',
        description: 'Magnificent underwater city with crystal domes and flowing water streets, capital of the sea realm.',
        coordinates: { x: 30, y: 40, width: 35, height: 30 },
        difficulty: 'Hard',
        specialFeatures: ['Crystal Domes', 'Water Streets', 'Sea Palace', 'Underwater Markets']
      },
      {
        id: 'nereid-harbor',
        name: 'Nereid Harbor',
        image: '/images/maps/areas/nereid-harbor.png',
        description: 'Coastal harbor town where sea nymphs guide ships safely through treacherous waters.',
        coordinates: { x: 10, y: 25, width: 20, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Sea Nymph Guides', 'Safe Harbor', 'Fishing Fleet', 'Lighthouse Network']
      },
      {
        id: 'amphitrite-town',
        name: 'Amphitrite Town',
        image: '/images/maps/areas/amphitrite-town.png',
        description: 'Elegant seaside town dedicated to the sea lord\'s consort, known for its pearl diving and sea gardens.',
        coordinates: { x: 60, y: 35, width: 18, height: 15 },
        difficulty: 'Medium',
        specialFeatures: ['Pearl Diving', 'Sea Gardens', 'Royal Ceremonies', 'Tidal Pools']
      },
      {
        id: 'trident-temple',
        name: 'Trident Temple',
        image: '/images/maps/areas/trident-temple.png',
        description: 'Sacred temple housing the sea lord\'s legendary trident, source of the sea lord\'s power.',
        coordinates: { x: 35, y: 15, width: 15, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Sea Lord\'s Trident', 'Sacred Altar', 'Divine Power', 'Ocean Control']
      },
      {
        id: 'maelstrom-point',
        name: 'Maelstrom Point',
        image: '/images/maps/areas/maelstrom-point.png',
        description: 'Dangerous cape where massive whirlpools reveal portals to the deepest ocean trenches.',
        coordinates: { x: 70, y: 60, width: 20, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Giant Whirlpools', 'Ocean Portals', 'Deep Sea Access', 'Kraken Territory']
      }
    ]
  },
  'thunderbird-heights': {
    id: 'thunderbird-heights',
    name: 'Thunderbird Heights',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/thunderbird-heights-detailed.png',
    description: 'Ancient sky realm where the great Storm Eagle soars, crackling with Electric-type energy.',
    climate: 'High Plains Stormy',
    elevation: '4,000 - 9,000 ft',
    dominantTypes: ['Electric'],
    wildlife: 'Storm Eagles, Lightning Dancers, Thunder Spirits',
    resources: 'Thunder Feathers, Storm Glass, Lightning Wood',
    lore: 'Sacred to the Storm Eagle spirit of ancient legend, this region experiences constant electrical storms that seem to follow the migration patterns of its Electric-type Monsters. The ancient peoples say the Storm Eagle\'s wings create the storms that bring life-giving rain to the lower regions.',
    areas: [
      {
        id: 'wakinyan-city',
        name: 'Wakinyan City',
        image: '/images/maps/areas/wakinyan-city.png',
        description: 'Sky city built on storm-charged mesas, where lightning rods channel thunder power throughout the settlement.',
        coordinates: { x: 35, y: 45, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Lightning Rod Network', 'Storm Channels', 'Thunder Totems', 'Sky Bridges']
      },
      {
        id: 'storm-dance-village',
        name: 'Storm Dance Village',
        image: '/images/maps/areas/storm-dance-village.png',
        description: 'Traditional village where shamans perform storm dances to communicate with thunder spirits.',
        coordinates: { x: 15, y: 30, width: 18, height: 15 },
        difficulty: 'Medium',
        specialFeatures: ['Storm Dance Grounds', 'Spirit Communion', 'Thunder Drums', 'Rain Ceremonies']
      },
      {
        id: 'thunder-mesa',
        name: 'Thunder Mesa',
        image: '/images/maps/areas/thunder-mesa.png',
        description: 'High plateau town where constant lightning strikes power ancient electrical devices.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Constant Lightning', 'Ancient Devices', 'Storm Viewing', 'Electric Forges']
      },
      {
        id: 'great-nest',
        name: 'Great Nest Sanctuary',
        image: '/images/maps/areas/great-nest.png',
        description: 'Sacred nesting ground of the legendary Storm Eagle, protected by powerful electric barriers.',
        coordinates: { x: 40, y: 15, width: 15, height: 12 },
        difficulty: 'Extreme',
        specialFeatures: ['Storm Eagle Nest', 'Electric Barriers', 'Sacred Ground', 'Divine Protection']
      },
      {
        id: 'lightning-spire',
        name: 'Lightning Spire',
        image: '/images/maps/areas/lightning-spire.png',
        description: 'Towering rock spire that attracts all lightning in the region, serving as a natural beacon.',
        coordinates: { x: 25, y: 60, width: 12, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Lightning Magnet', 'Natural Beacon', 'Storm Focus', 'Electric Convergence']
      }
    ]
  },
  'demeters-grove': {
    id: 'demeters-grove',
    name: 'Demeter\'s Grove',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/demeters-grove-detailed.png',
    description: 'The harvest spirit\'s blessed forest, where Grass-type Monsters flourish in eternal spring.',
    climate: 'Eternal Spring Mediterranean',
    elevation: '500 - 2,000 ft',
    dominantTypes: ['Grass'],
    wildlife: 'Harvest Spirits, Growth Guardians, Seasonal Dancers',
    resources: 'Golden Grain, Blessing Fruits, Life Nectar',
    lore: 'Blessed by the harvest spirit of agriculture, this region never experiences winter. The Grass-type Monsters here have learned the secrets of eternal growth and abundance, teaching sustainable farming practices to human visitors. The region\'s heart contains an ancient temple where the first seeds were blessed.',
    areas: [
      {
        id: 'eleusis-city',
        name: 'Eleusis City',
        image: '/images/maps/areas/eleusis-city.png',
        description: 'Sacred city of mysteries and agricultural wisdom, built among eternal flowering groves.',
        coordinates: { x: 40, y: 35, width: 28, height: 22 },
        difficulty: 'Medium',
        specialFeatures: ['Mystery Schools', 'Agricultural Academies', 'Eternal Gardens', 'Harvest Festivals']
      },
      {
        id: 'persephone-village',
        name: 'Persephone Village',
        image: '/images/maps/areas/persephone-village.png',
        description: 'Village dedicated to the spring maiden, where flowers bloom in perfect cycles of renewal.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Easy',
        specialFeatures: ['Flower Cycles', 'Renewal Ceremonies', 'Spring Celebrations', 'Growth Rituals']
      },
      {
        id: 'ceres-town',
        name: 'Ceres Town',
        image: '/images/maps/areas/ceres-town.png',
        description: 'Farming community where ancient techniques produce miraculous harvests year-round.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Easy',
        specialFeatures: ['Miraculous Harvests', 'Ancient Techniques', 'Year-Round Growing', 'Seed Banks']
      },
      {
        id: 'mystery-temple',
        name: 'Mystery Temple',
        image: '/images/maps/areas/mystery-temple.png',
        description: 'Sacred temple where the Ancient Mysteries reveal the secrets of life and growth.',
        coordinates: { x: 35, y: 15, width: 16, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Ancient Mysteries', 'Life Secrets', 'Sacred Rituals', 'Divine Teachings']
      },
      {
        id: 'golden-wheat',
        name: 'Golden Wheat Fields',
        image: '/images/maps/areas/golden-wheat.png',
        description: 'Vast fields of golden wheat that glow with divine light and never cease growing.',
        coordinates: { x: 15, y: 60, width: 30, height: 25 },
        difficulty: 'Easy',
        specialFeatures: ['Divine Glow', 'Eternal Growth', 'Golden Harvest', 'Blessed Fields']
      }
    ]
  },
  'jotun-tundra': {
    id: 'jotun-tundra',
    name: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/jotun-tundra-detailed.png',
    description: 'Frozen realm of frost titans, where Ice-type Monsters thrive in the eternal winter.',
    climate: 'Subarctic Tundra (Giant\'s Winter)',
    elevation: '2,000 - 7,500 ft',
    dominantTypes: ['Ice'],
    wildlife: 'Frost Giants, Ice Sculptors, Winter Shamans',
    resources: 'Giant Ice, Frost Berries, Aurora Stones',
    lore: 'The domain of the frost titans of ancient lore, where winter reigns eternal. Ice-type Monsters here grow to enormous sizes and display incredible craftsmanship, creating ice sculptures that tell the stories of ancient battles between elemental forces. The region\'s ice never melts, preserved by primordial magic.',
    areas: [
      {
        id: 'utgard-city',
        name: 'Utgard City',
        image: '/images/maps/areas/utgard-city.png',
        description: 'Massive ice citadel home to frost giant clans, with walls that reach toward the frozen sky.',
        coordinates: { x: 35, y: 40, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Giant Architecture', 'Ice Walls', 'Frost Clan Halls', 'Giant Forges']
      },
      {
        id: 'frost-village',
        name: 'Frost Village',
        image: '/images/maps/areas/frost-village.png',
        description: 'Hardy village where humans and Monsters work together to survive the endless winter.',
        coordinates: { x: 15, y: 55, width: 18, height: 15 },
        difficulty: 'Hard',
        specialFeatures: ['Winter Survival', 'Ice Fishing', 'Frost Crafting', 'Aurora Watching']
      },
      {
        id: 'rimeheart-town',
        name: 'Rimeheart Town',
        image: '/images/maps/areas/rimeheart-town.png',
        description: 'Mining town carved into glacier hearts, extracting rare ice crystals and frozen treasures.',
        coordinates: { x: 60, y: 30, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Ice Crystal Mining', 'Glacier Carved', 'Frozen Treasures', 'Crystal Workshops']
      },
      {
        id: 'jotun-halls',
        name: 'Jötun Halls',
        image: '/images/maps/areas/jotun-halls.png',
        description: 'Ancient halls of the frost titans, filled with ice sculptures depicting cosmic battles.',
        coordinates: { x: 40, y: 15, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Ancient Titan Halls', 'Epic Ice Sculptures', 'Cosmic Battle Scenes', 'Primordial Magic']
      },
      {
        id: 'eternal-glacier',
        name: 'Eternal Glacier',
        image: '/images/maps/areas/eternal-glacier.png',
        description: 'Massive glacier that has never melted, containing frozen memories of the world\'s creation.',
        coordinates: { x: 20, y: 70, width: 40, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Never Melting Ice', 'Frozen Memories', 'Creation Echoes', 'Primordial Preservation']
      }
    ]
  },
  'kshatriya-arena': {
    id: 'kshatriya-arena',
    name: 'Kshatriya Arena',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/kshatriya-arena-detailed.png',
    description: 'Ancient warrior training grounds, where Fighting-type Monsters hone their martial arts.',
    climate: 'Arid Mountain Training Climate',
    elevation: '1,500 - 5,000 ft',
    dominantTypes: ['Fighting'],
    wildlife: 'Warrior Monks, Training Masters, Honor Guards',
    resources: 'Training Stones, Warrior Herbs, Honor Metals',
    lore: 'Inspired by the ancient warrior tradition of honor and protection, this region is dedicated to the noble art of combat and protection. Fighting-type Monsters here follow ancient codes of honor and practice disciplined martial arts. The region hosts tournaments where only the most skilled and honorable may compete.',
    areas: [
      {
        id: 'kurukshetra-city',
        name: 'Kurukshetra City',
        image: '/images/maps/areas/kurukshetra-city.png',
        description: 'Holy warrior city where the greatest battles of dharma are fought and training never ends.',
        coordinates: { x: 35, y: 45, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Sacred Battlegrounds', 'Dharma Training', 'Warrior Academies', 'Honor Ceremonies']
      },
      {
        id: 'dharma-village',
        name: 'Dharma Village',
        image: '/images/maps/areas/dharma-village.png',
        description: 'Peaceful village where warriors learn the spiritual aspects of combat and righteous duty.',
        coordinates: { x: 15, y: 25, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Spiritual Combat', 'Righteous Duty', 'Meditation Gardens', 'Moral Teaching']
      },
      {
        id: 'valor-town',
        name: 'Valor Town',
        image: '/images/maps/areas/valor-town.png',
        description: 'Mountain fortress town where young warriors prove their courage through trials of strength.',
        coordinates: { x: 60, y: 30, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Courage Trials', 'Strength Tests', 'Warrior Initiation', 'Mountain Training']
      },
      {
        id: 'honor-temple',
        name: 'Honor Temple',
        image: '/images/maps/areas/honor-temple.png',
        description: 'Sacred temple where warriors swear oaths of protection and receive blessings for battle.',
        coordinates: { x: 40, y: 15, width: 15, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Sacred Oaths', 'Battle Blessings', 'Warrior Codes', 'Divine Protection']
      },
      {
        id: 'grand-colosseum',
        name: 'Grand Colosseum',
        image: '/images/maps/areas/grand-colosseum.png',
        description: 'Massive arena where legendary tournaments test the ultimate limits of martial prowess.',
        coordinates: { x: 25, y: 60, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Legendary Tournaments', 'Ultimate Tests', 'Grand Battles', 'Champion Trials']
      }
    ]
  },
  'baba-yagas-marsh': {
    id: 'baba-yagas-marsh',
    name: 'Crowsfoot Marsh',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/baba-yagas-marsh-detailed.png',
    description: 'Crowsfoot Marsh, where Poison-type Monsters brew in toxic mists.',
    climate: 'Mystical Swamp (Witch\'s Domain)',
    elevation: '50 - 300 ft',
    dominantTypes: ['Poison'],
    wildlife: 'Cauldron Spirits, Brew Masters, Swamp Witches',
    resources: 'Witch Herbs, Toxic Mushrooms, Mystery Potions',
    lore: 'The domain of Baba Yaga, the enigmatic witch of Slavic folklore. Poison-type Monsters here are master alchemists and potion brewers, creating both deadly toxins and miraculous cures. The marsh\'s mists carry whispers of ancient magic, and those brave enough to seek Baba Yaga\'s hut may find their deepest questions answered.',
    areas: [
      {
        id: 'witchwood-city',
        name: 'Witchwood City',
        image: '/images/maps/areas/witchwood-city.png',
        description: 'Dark city built on stilts above toxic swampland, where alchemists practice forbidden arts.',
        coordinates: { x: 40, y: 35, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Stilt Architecture', 'Alchemy Labs', 'Forbidden Arts', 'Toxic Canals']
      },
      {
        id: 'cauldron-village',
        name: 'Cauldron Village',
        image: '/images/maps/areas/cauldron-village.png',
        description: 'Village of potion brewers where every home has a bubbling cauldron and herb garden.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Potion Brewing', 'Herb Gardens', 'Bubbling Cauldrons', 'Recipe Trading']
      },
      {
        id: 'bog-town',
        name: 'Bog Town',
        image: '/images/maps/areas/bog-town.png',
        description: 'Mysterious town that appears and disappears in the marsh mists, home to bog spirits.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Shifting Location', 'Bog Spirits', 'Mist Magic', 'Phantom Buildings']
      },
      {
        id: 'iron-teeth-hut',
        name: 'Iron Teeth Hut',
        image: '/images/maps/areas/iron-teeth-hut.png',
        description: 'Baba Yaga\'s legendary hut on chicken legs, surrounded by a fence of bones and riddles.',
        coordinates: { x: 35, y: 15, width: 12, height: 15 },
        difficulty: 'Extreme',
        specialFeatures: ['Chicken Leg Hut', 'Bone Fence', 'Ancient Riddles', 'Witch\'s Wisdom']
      },
      {
        id: 'poison-pools',
        name: 'Poison Pools',
        image: '/images/maps/areas/poison-pools.png',
        description: 'Natural pools of concentrated toxins where the most dangerous alchemy ingredients are harvested.',
        coordinates: { x: 15, y: 70, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Concentrated Toxins', 'Dangerous Ingredients', 'Toxic Harvesting', 'Lethal Beauty']
      }
    ]
  },
  'terra-madre-basin': {
    id: 'terra-madre-basin',
    name: 'Terra Madre Basin',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/terra-madre-basin-detailed.png',
    description: 'The earth mother\'s sacred valley, where Ground-type Monsters shape the very land.',
    climate: 'Continental Steppe (Earth Mother\'s Domain)',
    elevation: '800 - 2,500 ft',
    dominantTypes: ['Ground'],
    wildlife: 'Earth Shapers, Canyon Dwellers, Fertile Spirits',
    resources: 'Sacred Clay, Earth Gems, Fertile Soil',
    lore: 'Dedicated to the ancient earth mother spirit of earth and fertility. Ground-type Monsters here are master terraformers, able to reshape landscapes and create fertile valleys. The region\'s center holds an ancient amphitheater where the first agricultural ceremonies were held, blessing the earth for eternal abundance.',
    areas: [
      {
        id: 'tellus-city',
        name: 'Tellus City',
        image: '/images/maps/areas/tellus-city.png',
        description: 'Grand city carved from living rock, with terraced gardens cascading down canyon walls.',
        coordinates: { x: 35, y: 40, width: 28, height: 22 },
        difficulty: 'Medium',
        specialFeatures: ['Living Rock Architecture', 'Terraced Gardens', 'Canyon Integration', 'Earth Shaping']
      },
      {
        id: 'terra-village',
        name: 'Terra Village',
        image: '/images/maps/areas/terra-village.png',
        description: 'Agricultural village where ancient farming techniques create miraculous yields.',
        coordinates: { x: 15, y: 55, width: 18, height: 16 },
        difficulty: 'Easy',
        specialFeatures: ['Ancient Agriculture', 'Miraculous Yields', 'Ancient Techniques', 'Fertile Fields']
      },
      {
        id: 'gaia-town',
        name: 'Gaia Town',
        image: '/images/maps/areas/gaia-town.png',
        description: 'Cliffside town built into natural rock formations, celebrating earth\'s raw beauty.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Natural Rock Formations', 'Cliffside Living', 'Earth Beauty', 'Geological Wonders']
      },
      {
        id: 'mother-temple',
        name: 'Mother Earth Temple',
        image: '/images/maps/areas/mother-temple.png',
        description: 'Sacred temple dedicated to the earth mother, where earth\'s creative power is worshipped.',
        coordinates: { x: 40, y: 15, width: 16, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Earth Worship', 'Creative Power', 'Sacred Rituals', 'Geological Communion']
      },
      {
        id: 'sacred-canyon',
        name: 'Sacred Canyon',
        image: '/images/maps/areas/sacred-canyon.png',
        description: 'Vast canyon amphitheater where the first agricultural ceremonies blessed the earth.',
        coordinates: { x: 20, y: 65, width: 35, height: 30 },
        difficulty: 'Hard',
        specialFeatures: ['Natural Amphitheater', 'First Ceremonies', 'Agricultural Blessings', 'Earth Echoes']
      }
    ]
  },
  'quetzal-winds': {
    id: 'quetzal-winds',
    name: 'Quetzal Winds',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/quetzal-winds-detailed.png',
    description: 'The feathered serpent\'s domain, where Flying-type Monsters dance on ancient wind currents.',
    climate: 'Highland Tropical (Feathered Winds)',
    elevation: '3,500 - 8,000 ft',
    dominantTypes: ['Flying'],
    wildlife: 'Feathered Serpents, Wind Dancers, Sky Priests',
    resources: 'Quetzal Feathers, Wind Crystals, Sky Jade',
    lore: 'Sacred to the ancient feathered serpent spirit of wind and wisdom. Flying-type Monsters here perform elaborate aerial dances that control weather patterns across the island. The region\'s temples float on ancient wind currents, accessible only to those who have earned the trust of the wind spirits.',
    areas: [
      {
        id: 'tenochtitlan-sky',
        name: 'Tenochtitlan Sky',
        image: '/images/maps/areas/tenochtitlan-sky.png',
        description: 'Magnificent sky city floating on wind currents, with pyramid temples and feathered architecture.',
        coordinates: { x: 40, y: 35, width: 25, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Floating City', 'Pyramid Temples', 'Feathered Architecture', 'Wind Navigation']
      },
      {
        id: 'wind-village',
        name: 'Wind Village',
        image: '/images/maps/areas/wind-village.png',
        description: 'Mountain village where wind priests study the patterns of air currents and storm movements.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Hard',
        specialFeatures: ['Wind Studying', 'Air Current Maps', 'Storm Prediction', 'Weather Lore']
      },
      {
        id: 'feather-town',
        name: 'Feather Town',
        image: '/images/maps/areas/feather-town.png',
        description: 'Artisan town where sacred quetzal feathers are crafted into ceremonial items and flight aids.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Feather Crafting', 'Ceremonial Items', 'Flight Aids', 'Sacred Artistry']
      },
      {
        id: 'serpent-pyramid',
        name: 'Serpent Pyramid',
        image: '/images/maps/areas/serpent-pyramid.png',
        description: 'Ancient stepped pyramid dedicated to the feathered serpent spirit, where wind and wisdom converge.',
        coordinates: { x: 35, y: 15, width: 18, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Feathered Serpent Shrine', 'Wind Convergence', 'Wisdom Teachings', 'Ancient Rituals']
      },
      {
        id: 'floating-gardens',
        name: 'Floating Gardens',
        image: '/images/maps/areas/floating-gardens.png',
        description: 'Miraculous sky gardens that float on wind currents, growing rare aerial plants.',
        coordinates: { x: 15, y: 65, width: 30, height: 25 },
        difficulty: 'Hard',
        specialFeatures: ['Sky Gardens', 'Floating Agriculture', 'Aerial Plants', 'Wind Cultivation']
      }
    ]
  },
  'oracles-sanctum': {
    id: 'oracles-sanctum',
    name: 'Oracle\'s Sanctum',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/oracles-sanctum-detailed.png',
    description: 'The oracle\'s mystical realm, where Psychic-type Monsters commune with higher powers.',
    climate: 'Mystical Highland Mediterranean',
    elevation: '2,200 - 4,500 ft',
    dominantTypes: ['Psychic'],
    wildlife: 'Oracle Seers, Mind Readers, Future Whisperers',
    resources: 'Prophecy Stones, Mind Crystals, Wisdom Herbs',
    lore: 'Inspired by the Oracle of Delphi, this region serves as a conduit between the mortal and divine realms. Psychic-type Monsters here possess prophetic abilities and can glimpse fragments of possible futures. The central temple\'s sacred vapors enhance psychic abilities, but only the pure of heart can enter without being overwhelmed.',
    areas: [
      {
        id: 'delphi-city',
        name: 'Delphi City',
        image: '/images/maps/areas/delphi-city.png',
        description: 'Sacred city of prophecy where seers and pilgrims gather to seek glimpses of future paths.',
        coordinates: { x: 35, y: 40, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Prophecy Centers', 'Sacred Pilgrimage', 'Future Glimpses', 'Divine Guidance']
      },
      {
        id: 'pythia-village',
        name: 'Pythia Village',
        image: '/images/maps/areas/pythia-village.png',
        description: 'Village where priestesses train to become oracles, learning to interpret divine visions.',
        coordinates: { x: 15, y: 55, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Oracle Training', 'Priestess Schools', 'Vision Interpretation', 'Divine Communication']
      },
      {
        id: 'vision-town',
        name: 'Vision Town',
        image: '/images/maps/areas/vision-town.png',
        description: 'Mountain town where psychic researchers study the nature of prophecy and foresight.',
        coordinates: { x: 55, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Psychic Research', 'Prophecy Studies', 'Foresight Training', 'Mind Expansion']
      },
      {
        id: 'apollo-temple',
        name: 'Apollo Temple',
        image: '/images/maps/areas/apollo-temple.png',
        description: 'Grand temple dedicated to Apollo, where the most powerful oracles receive divine inspiration.',
        coordinates: { x: 40, y: 15, width: 16, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['Apollo\'s Presence', 'Divine Inspiration', 'Sacred Oracle Chamber', 'Prophetic Power']
      },
      {
        id: 'sacred-vapors',
        name: 'Sacred Vapors',
        image: '/images/maps/areas/sacred-vapors.png',
        description: 'Natural cave system where mystical vapors enhance psychic abilities and reveal hidden truths.',
        coordinates: { x: 20, y: 70, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Mystical Vapors', 'Psychic Enhancement', 'Hidden Truths', 'Consciousness Expansion']
      }
    ]
  },
  'anansi-woods': {
    id: 'anansi-woods',
    name: 'Anansi Woods',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/anansi-woods-detailed.png',
    description: 'The spider lord\'s intricate forest, where Bug-type Monsters weave stories in silk and shadow.',
    climate: 'Tropical Rainforest (Story Weaver\'s Domain)',
    elevation: '300 - 1,800 ft',
    dominantTypes: ['Bug'],
    wildlife: 'Story Weavers, Web Architects, Trickster Spiders',
    resources: 'Story Silk, Wisdom Honey, Pattern Leaves',
    lore: 'Sacred to the ancient spider lord of stories and wisdom. Bug-type Monsters here are master storytellers, weaving tales into their webs that come alive under moonlight. The forest\'s ancient trees hold libraries of silk-spun stories, preserving the wisdom and folklore of countless generations.',
    areas: [
      {
        id: 'kumasi-city',
        name: 'Kumasi City',
        image: '/images/maps/areas/kumasi-city.png',
        description: 'Tree-top city connected by intricate web bridges, where stories are currency and wisdom is wealth.',
        coordinates: { x: 35, y: 40, width: 28, height: 22 },
        difficulty: 'Medium',
        specialFeatures: ['Web Bridges', 'Story Markets', 'Wisdom Trading', 'Canopy Architecture']
      },
      {
        id: 'story-village',
        name: 'Story Village',
        image: '/images/maps/areas/story-village.png',
        description: 'Village where every web tells a tale and children learn wisdom through spider folklore.',
        coordinates: { x: 15, y: 55, width: 18, height: 16 },
        difficulty: 'Easy',
        specialFeatures: ['Web Stories', 'Folklore Teaching', 'Children\'s Education', 'Living Tales']
      },
      {
        id: 'web-town',
        name: 'Web Town',
        image: '/images/maps/areas/web-town.png',
        description: 'Town built entirely within giant spider webs, with silk architecture and pattern-based navigation.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Web Architecture', 'Silk Buildings', 'Pattern Navigation', 'Spider Engineering']
      },
      {
        id: 'great-tree',
        name: 'Great Story Tree',
        image: '/images/maps/areas/great-tree.png',
        description: 'Ancient baobab tree where the spider lord first spun the web of all stories, connecting all tales.',
        coordinates: { x: 40, y: 15, width: 18, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['First Web', 'Story Origin', 'Spider Lord\'s Tree', 'Tale Convergence']
      },
      {
        id: 'silk-library',
        name: 'Silk Library',
        image: '/images/maps/areas/silk-library.png',
        description: 'Vast library where stories are woven in silk and preserved in crystalline web formations.',
        coordinates: { x: 20, y: 70, width: 30, height: 25 },
        difficulty: 'Medium',
        specialFeatures: ['Silk Stories', 'Crystalline Webs', 'Story Preservation', 'Knowledge Archive']
      }
    ]
  },
  'stoneheart-cliffs': {
    id: 'stoneheart-cliffs',
    name: 'Stoneheart Cliffs',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/stoneheart-cliffs-detailed.png',
    description: 'Ancient stone circle highlands, where Rock-type Monsters guard ancient mystical secrets.',
    climate: 'Highland Oceanic (Druidic)',
    elevation: '2,800 - 6,200 ft',
    dominantTypes: ['Rock'],
    wildlife: 'Stone Guardians, Druid Spirits, Ancient Sentinels',
    resources: 'Druid Stones, Memory Crystals, Ancient Moss',
    lore: 'Inspired by ancient stone circles and mystical traditions, this region\'s Rock-type Monsters serve as guardians of ancient knowledge. The standing stones here record the island\'s complete history in mystical runes that only the most attuned can read. During celestial alignments, the stones glow with inner fire, revealing secrets of the past.',
    areas: [
      {
        id: 'avalon-city',
        name: 'Avalon City',
        image: '/images/maps/areas/avalon-city.png',
        description: 'Mystical city built around ancient standing stones, where druids study the old ways.',
        coordinates: { x: 35, y: 45, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Standing Stones', 'Ancient Academies', 'Ancient Wisdom', 'Mystical Architecture']
      },
      {
        id: 'druid-village',
        name: 'Druid Village',
        image: '/images/maps/areas/druid-village.png',
        description: 'Traditional village where stone masons work with living rock to build in harmony with nature.',
        coordinates: { x: 15, y: 60, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Living Rock', 'Stone Masonry', 'Natural Harmony', 'Traditional Crafts']
      },
      {
        id: 'cairn-town',
        name: 'Cairn Town',
        image: '/images/maps/areas/cairn-town.png',
        description: 'Highland town built among ancient cairns that mark sacred paths and burial sites.',
        coordinates: { x: 60, y: 30, width: 20, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Sacred Cairns', 'Ancient Paths', 'Burial Sites', 'Highland Culture']
      },
      {
        id: 'stonehenge-site',
        name: 'Stonehenge Site',
        image: '/images/maps/areas/stonehenge-site.png',
        description: 'Massive stone circle that serves as an astronomical calendar and gateway to other realms.',
        coordinates: { x: 40, y: 15, width: 20, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['Astronomical Calendar', 'Realm Gateway', 'Megalithic Mysteries', 'Celestial Alignment']
      },
      {
        id: 'memory-cliffs',
        name: 'Memory Cliffs',
        image: '/images/maps/areas/memory-cliffs.png',
        description: 'Towering cliffs carved with the complete history of the island in ancient runic script.',
        coordinates: { x: 20, y: 75, width: 30, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Island History', 'Runic Script', 'Memory Storage', 'Ancient Records']
      }
    ]
  },
  'mictlan-hollows': {
    id: 'mictlan-hollows',
    name: 'Mictlan Hollows',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/mictlan-hollows-detailed.png',
    description: 'Ancient underworld realm where spirits dwell, home to mysterious Ghost-type Monsters.',
    climate: 'Mystical Subterranean (Underworld)',
    elevation: '100 - 1,000 ft (mostly underground)',
    dominantTypes: ['Ghost'],
    wildlife: 'Death Guides, Spirit Guardians, Underworld Messengers',
    resources: 'Spirit Essence, Bone Dust, Afterlife Flowers',
    lore: 'Named after the ancient underworld realm, this region exists partially in the realm of spirits. Ghost-type Monsters here serve as guides between the world of the living and the dead, helping lost souls find peace. The region\'s caverns contain murals depicting the journey of souls through the afterlife.',
    areas: [
      {
        id: 'mictlampa-city',
        name: 'Mictlampa City',
        image: '/images/maps/areas/mictlampa-city.png',
        description: 'Underground city of the dead, where spirits and the living coexist in eternal twilight.',
        coordinates: { x: 40, y: 35, width: 25, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Underworld City', 'Spirit Coexistence', 'Eternal Twilight', 'Death Mysteries']
      },
      {
        id: 'xochitonal-village',
        name: 'Xochitonal Village',
        image: '/images/maps/areas/xochitonal-village.png',
        description: 'Village where Day of the Dead is celebrated every day, honoring ancestors with flowers and offerings.',
        coordinates: { x: 15, y: 50, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Day of Dead Celebrations', 'Ancestor Honors', 'Flower Offerings', 'Continuous Festivals']
      },
      {
        id: 'bone-town',
        name: 'Bone Town',
        image: '/images/maps/areas/bone-town.png',
        description: 'Town built from the bones of ancient creatures, where death is seen as transformation.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Bone Architecture', 'Death Transformation', 'Ancient Remains', 'Spectral Beauty']
      },
      {
        id: 'death-pyramid',
        name: 'Death Lord Pyramid',
        image: '/images/maps/areas/death-pyramid.png',
        description: 'Massive pyramid dedicated to the lord of the dead, housing the throne of bones.',
        coordinates: { x: 35, y: 15, width: 18, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Death Lord Shrine', 'Throne of Bones', 'Death Lord Temple', 'Underworld Portal']
      },
      {
        id: 'river-crossing',
        name: 'River of Souls',
        image: '/images/maps/areas/river-crossing.png',
        description: 'Mystical river where souls cross between life and death, guided by spectral ferryman.',
        coordinates: { x: 20, y: 65, width: 35, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Soul Crossing', 'Spectral Ferryman', 'Life-Death Bridge', 'Spiritual Journey']
      }
    ]
  },
  'long-valley': {
    id: 'long-valley',
    name: 'Long Valley',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/long-valley-detailed.png',
    description: 'Ancient dragon realm of wisdom and power, where majestic Dragon-type Monsters reign supreme.',
    climate: 'Temperate Continental (Dragon\'s Breath)',
    elevation: '1,200 - 4,800 ft',
    dominantTypes: ['Dragon'],
    wildlife: 'Imperial Dragons, Wisdom Keepers, Pearl Guardians',
    resources: 'Dragon Scales, Imperial Jade, Wisdom Pearls',
    lore: 'Inspired by ancient dragon lore, this valley is ruled by ancient Dragon-type Monsters who embody wisdom and imperial power. The region\'s dragons are scholars and philosophers, maintaining vast libraries of knowledge. Only those who demonstrate wisdom, humility, and respect for tradition are granted audience with the Dragon Elders.',
    areas: [
      {
        id: 'tianlong-city',
        name: 'Tianlong City',
        image: '/images/maps/areas/tianlong-city.png',
        description: 'Majestic city with pagodas that spiral into the clouds, ruled by celestial dragon emperors.',
        coordinates: { x: 40, y: 35, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Cloud Pagodas', 'Dragon Emperors', 'Celestial Architecture', 'Imperial Court']
      },
      {
        id: 'jade-village',
        name: 'Jade Village',
        image: '/images/maps/areas/jade-village.png',
        description: 'Village of jade artisans who carve dragon scales into beautiful ornaments and protective charms.',
        coordinates: { x: 15, y: 50, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Jade Artisans', 'Dragon Scale Carving', 'Protective Charms', 'Artistic Mastery']
      },
      {
        id: 'wisdom-town',
        name: 'Wisdom Town',
        image: '/images/maps/areas/wisdom-town.png',
        description: 'Scholar town with ancient libraries where dragon philosophers teach the mysteries of existence.',
        coordinates: { x: 65, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Ancient Libraries', 'Dragon Philosophers', 'Existence Mysteries', 'Scholarly Pursuits']
      },
      {
        id: 'imperial-palace',
        name: 'Imperial Dragon Palace',
        image: '/images/maps/areas/imperial-palace.png',
        description: 'Golden palace where the Dragon Emperor holds court, making decisions that affect all realms.',
        coordinates: { x: 45, y: 15, width: 25, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Dragon Emperor', 'Golden Palace', 'Realm Decisions', 'Imperial Power']
      },
      {
        id: 'nine-dragons',
        name: 'Nine Dragons Falls',
        image: '/images/maps/areas/nine-dragons.png',
        description: 'Sacred waterfall where nine dragon spirits dance, creating pearls of pure wisdom.',
        coordinates: { x: 20, y: 65, width: 35, height: 30 },
        difficulty: 'Extreme',
        specialFeatures: ['Nine Dragon Spirits', 'Sacred Waterfall', 'Wisdom Pearls', 'Spiritual Dance']
      }
    ]
  },
  'ravens-shadow': {
    id: 'ravens-shadow',
    name: 'Raven\'s Shadow',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/ravens-shadow-detailed.png',
    description: 'Native American trickster\'s twilight realm, where cunning Dark-type Monsters lurk in shadows.',
    climate: 'Twilight Forest (Trickster\'s Domain)',
    elevation: '600 - 2,400 ft',
    dominantTypes: ['Dark'],
    wildlife: 'Shadow Tricksters, Night Prowlers, Twilight Ravens',
    resources: 'Shadow Berries, Night Stones, Trickster Feathers',
    lore: 'Sacred to the Raven, the trickster spirit of ancient legend. Dark-type Monsters here are clever shapeshifters and masters of illusion, teaching important lessons through elaborate pranks and challenges. The region exists in perpetual twilight, where shadows dance with their own will and nothing is quite as it seems.',
    areas: [
      {
        id: 'corvus-city',
        name: 'Corvus City',
        image: '/images/maps/areas/corvus-city.png',
        description: 'City that shifts and changes its layout nightly, where raven guides lead visitors through illusions.',
        coordinates: { x: 35, y: 40, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Shifting Layout', 'Raven Guides', 'Urban Illusions', 'Trickster Architecture']
      },
      {
        id: 'shadow-village',
        name: 'Shadow Village',
        image: '/images/maps/areas/shadow-village.png',
        description: 'Village where shadows are longer than their owners and whisper secrets of hidden knowledge.',
        coordinates: { x: 15, y: 55, width: 18, height: 16 },
        difficulty: 'Hard',
        specialFeatures: ['Living Shadows', 'Secret Whispers', 'Hidden Knowledge', 'Shadow Magic']
      },
      {
        id: 'twilight-town',
        name: 'Twilight Town',
        image: '/images/maps/areas/twilight-town.png',
        description: 'Town suspended between day and night, where time moves differently and riddles replace conversation.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Time Distortion', 'Riddle Communication', 'Day-Night Balance', 'Temporal Magic']
      },
      {
        id: 'trickster-lodge',
        name: 'Trickster Lodge',
        image: '/images/maps/areas/trickster-lodge.png',
        description: 'Sacred lodge where the Raven spirit teaches wisdom through clever tricks and challenging puzzles.',
        coordinates: { x: 40, y: 15, width: 16, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['Raven Spirit', 'Wisdom Tricks', 'Challenging Puzzles', 'Sacred Teaching']
      },
      {
        id: 'eternal-dusk',
        name: 'Eternal Dusk Grove',
        image: '/images/maps/areas/eternal-dusk.png',
        description: 'Forest grove where twilight never ends and every tree casts multiple shadows in impossible directions.',
        coordinates: { x: 20, y: 70, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Eternal Twilight', 'Multiple Shadows', 'Impossible Geometry', 'Shadow Physics']
      }
    ]
  },
  'hephaestus-forge': {
    id: 'hephaestus-forge',
    name: 'Hephaestus Forge',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/hephaestus-forge-detailed.png',
    description: 'Greek god\'s industrial workshop, where Steel-type Monsters craft legendary metals and machines.',
    climate: 'Industrial Volcanic (Divine Workshop)',
    elevation: '1,800 - 4,200 ft',
    dominantTypes: ['Steel'],
    wildlife: 'Master Smiths, Metal Shapers, Forge Spirits',
    resources: 'Divine Metals, Forge Fire, Crafting Crystals',
    lore: 'The workshop of Hephaestus, Greek god of metalworking and craftsmanship. Steel-type Monsters here are master artisans, capable of forging legendary weapons and tools. The region\'s forges burn with divine fire that never dies, and the metalwork created here is said to be blessed with the gods\' own power.',
    areas: [
      {
        id: 'vulcan-city',
        name: 'Vulcan City',
        image: '/images/maps/areas/vulcan-city.png',
        description: 'Industrial metropolis of forges and foundries, where divine flames power endless creation.',
        coordinates: { x: 40, y: 35, width: 25, height: 22 },
        difficulty: 'Hard',
        specialFeatures: ['Divine Forges', 'Industrial Foundries', 'Endless Creation', 'Metal Workshops']
      },
      {
        id: 'cyclops-village',
        name: 'Cyclops Village',
        image: '/images/maps/areas/cyclops-village.png',
        description: 'Village of one-eyed master craftsmen who forge legendary items with incredible precision.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Hard',
        specialFeatures: ['Master Craftsmen', 'Legendary Items', 'Incredible Precision', 'Cyclops Forge']
      },
      {
        id: 'forge-town',
        name: 'Forge Town',
        image: '/images/maps/areas/forge-town.png',
        description: 'Mining town where rare metals are extracted and refined into materials for divine crafting.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Medium',
        specialFeatures: ['Rare Metal Mining', 'Divine Materials', 'Metal Refinement', 'Crafting Supplies']
      },
      {
        id: 'divine-workshop',
        name: 'Divine Workshop',
        image: '/images/maps/areas/divine-workshop.png',
        description: 'Sacred workshop where Hephaestus himself once forged the weapons of the gods.',
        coordinates: { x: 35, y: 15, width: 18, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Hephaestus Workshop', 'Divine Weapons', 'God-tier Crafting', 'Sacred Anvils']
      },
      {
        id: 'adamant-peak',
        name: 'Adamant Peak',
        image: '/images/maps/areas/adamant-peak.png',
        description: 'Mountain peak made of pure adamantine, the hardest metal known to gods and mortals.',
        coordinates: { x: 25, y: 65, width: 20, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Pure Adamantine', 'Hardest Metal', 'Divine Material', 'Unbreakable Mountain']
      }
    ]
  },
  'seelie-courts': {
    id: 'seelie-courts',
    name: 'Seelie Courts',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/seelie-courts-detailed.png',
    description: 'Ancient fairy kingdom of wonder and magic, where Fairy-type Monsters hold eternal revelries.',
    climate: 'Enchanted Temperate (Fairy Magic)',
    elevation: '400 - 2,200 ft',
    dominantTypes: ['Fairy'],
    wildlife: 'Court Nobles, Magic Weavers, Dream Dancers',
    resources: 'Fairy Dust, Dream Crystals, Enchanted Flowers',
    lore: 'The realm of the benevolent fairy court, dwelling in ancient magic and wonder. Fairy-type Monsters here live in an eternal celebration of life, beauty, and magic. The region changes with the seasons of emotion rather than weather, reflecting the collective mood of its inhabitants. Time flows differently here, and visitors often find that minutes feel like hours, or years pass like days.',
    areas: [
      {
        id: 'titania-city',
        name: 'Titania City',
        image: '/images/maps/areas/titania-city.png',
        description: 'Magnificent fairy capital with crystal spires and gardens that bloom in impossible colors.',
        coordinates: { x: 40, y: 35, width: 25, height: 22 },
        difficulty: 'Hard',
        specialFeatures: ['Crystal Spires', 'Impossible Colors', 'Fairy Architecture', 'Royal Court']
      },
      {
        id: 'oberon-village',
        name: 'Oberon Village',
        image: '/images/maps/areas/oberon-village.png',
        description: 'Village where the fairy lord holds court among mushroom circles and singing brooks.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Mushroom Circles', 'Singing Brooks', 'Fairy King Court', 'Natural Magic']
      },
      {
        id: 'puck-town',
        name: 'Puck Town',
        image: '/images/maps/areas/puck-town.png',
        description: 'Mischievous town where shapeshifting fairy tricksters play pranks on unsuspecting visitors.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Shapeshifting Fairies', 'Fairy Pranks', 'Trickster Magic', 'Mischievous Fun']
      },
      {
        id: 'summer-court',
        name: 'Summer Court',
        image: '/images/maps/areas/summer-court.png',
        description: 'Eternal summer palace where the fairy court holds festivals of light, joy, and renewal.',
        coordinates: { x: 35, y: 15, width: 20, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Eternal Summer', 'Light Festivals', 'Joy Celebrations', 'Renewal Ceremonies']
      },
      {
        id: 'enchanted-glade',
        name: 'Enchanted Glade',
        image: '/images/maps/areas/enchanted-glade.png',
        description: 'Sacred glade where fairy magic is strongest, and wishes spoken at midnight may come true.',
        coordinates: { x: 15, y: 70, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Fairy Magic Focus', 'Wish Granting', 'Midnight Rituals', 'Sacred Ground']
      }
    ]
  },

  'pirates-bay': {
    id: 'pirates-bay',
    name: 'Pirates Bay',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/pirates-bay-detailed.png',
    description: 'The far reaches of the island where few dare travel and the pirates have made their home.',
    climate: 'Tropical',
    elevation: 'Sea Level - 600 ft',
    dominantTypes: ['Water', 'Flying', 'Ground'],
    wildlife: 'Pirates, Buccaneers, Corsairs',
    resources: 'Treasure, Booty, Spoils of War',
    lore: 'The pirate haven of Conoco Island, where the bravest and most ruthless sailors in the world make their home. The bay is a lawless place, ruled by the iron fist of the pirate lords. The waters are teeming with Monsters, and the air is thick with the scent of salt and danger. The pirates here are a rough and tumble bunch, and visitors are advised to tread carefully.',
    areas: [
      {
        id: 'pirate-port',
        name: 'Pirate Port',
        image: '/images/maps/areas/pirate-port.png',
        description: 'The bustling port of the pirate lords, where ships laden with treasure dock and crews carouse.',
        coordinates: { x: 40, y: 35, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Treasure Ships', 'Carousing Crews', 'Pirate Taverns', 'Dangerous Waters']
      },
      { 
        id: 'pirate-village', 
        name: 'Pirate Village', 
        image: '/images/maps/areas/pirate-village.png',   
        description: 'The shantytown of the pirate crews, where danger lurks around every corner and treasures are buried in the sand.',
        coordinates: { x: 20, y: 50, width: 18, height: 16 },
        difficulty: 'Hard',
        specialFeatures: ['Dangerous Waters', 'Treasure Buried', 'Shantytown', 'Pirate Culture']
      },
      { 
        id: 'hidden-cove', 
        name: 'Hidden Cove', 
        image: '/images/maps/areas/hidden-cove.png',   
        description: 'A secluded cove where the most ruthless pirates in the world make their lair.',
        coordinates: { x: 60, y: 25, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Ruthless Pirates', 'Hidden Lair', 'Dangerous Waters', 'Treasure Buried']
      },
      { 
        id: 'nyakuza-landing', 
        name: 'Nyakuza Landing', 
        image: '/images/maps/areas/nyakuza-landing.png',   
        description: 'The landing site of the Nyakuza pirate clan, where the most feared pirates in the world make their home.',
        coordinates: { x: 10, y: 10, width: 18, height: 15 },
        difficulty: 'Hard',
        specialFeatures: ['Feared Pirates', 'Home of Nyakuza', 'Dangerous Waters', 'Treasure Buried']
      },
      { 
        id: 'skull-rock', 
        name: 'Skull Rock', 
        image: '/images/maps/areas/skull-rock.png',   
        description: 'A treacherous rock formation that serves as a pirate trap, where many a ship has met its end.',
        coordinates: { x: 50, y: 40, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Pirate Trap', 'Treacherous Waters', 'Hidden Coves', 'Shipwrecks']
      },
    ]
  },  

  // Conoocoo Archipelago Regions
  'primordial-jungle': {
    id: 'primordial-jungle',
    name: 'Primordial Jungle',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/regions/primordial-jungle-detailed.png',
    description: 'The massive central jungle where prehistoric Monsters roam among ancient trees that have stood since the dawn of time.',
    climate: 'Tropical Prehistoric',
    elevation: '100 - 1,500 ft',
    dominantTypes: ['Grass', 'Rock', 'Dragon', 'Ground', 'bug'],
    wildlife: 'Ancient Beasts, Raptors, Time Spirits',
    resources: 'Ancient Amber, Young Fossils, Prehistoric Berries  and Fruits',
    lore: 'This jungle exists outside normal time,where prehistoric Monsters still roam. The trees themselves are living fossils, and deep in the jungle\'s heart, legendary Monsters that witnessed the world\'s creation still dwell. Time flows differently here, and some say the jungle remembers everything that ever was.',
    areas: [
      {
        id: 'amber-village',
        name: 'Amber Village',
        image: '/images/maps/areas/amber-village.png',
        description: 'Village built among ancient amber deposits that preserve creatures from millions of years ago.',
        coordinates: { x: 30, y: 60, width: 45, height: 26 },
        difficulty: 'Medium',
        specialFeatures: ['Amber Deposits', 'Preserved Specimens', 'Ancient DNA', 'Time Capsules']
      },
      {
        id: 'dinosaur-valley',
        name: 'Diphylleia Valley',
        image: '/images/maps/areas/diphylleia-valley.png',
        description: 'Hidden valley where living dinosaur Monsters roam freely in their natural habitat.',
        coordinates: { x: 60, y: 25, width: 25, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Living Dinosaurs', 'Natural Habitat', 'Prehistoric Ecosystem', 'Ancient Behaviors']
      },
      {
        id: 'time-temple',
        name: 'Temple of Ages',
        image: '/images/maps/areas/time-temple.png',
        description: 'Ancient temple where time itself seems suspended, guarded by timeless spirits.',
        coordinates: { x: 65, y: 10, width: 16, height: 13 },
        difficulty: 'Extreme',
        specialFeatures: ['Time Suspension', 'Timeless Spirits', 'Ancient Mysteries', 'Temporal Magic']
      }
    ]
  },
  'crystal-cove': {
    id: 'crystal-cove',
    name: 'Crystal Cove',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/regions/crystal-cove-detailed.png',
    description: 'Coastal region with crystalline formations that preserve ancient marine life in suspended animation.',
    climate: 'Temperate',
    elevation: 'Sea Level - 600 ft',
    dominantTypes: ['Water', 'Ice', 'Rock'],
    wildlife: 'Crystal Guardians, Frozen Ancients, Preservation Spirits',
    resources: 'Preservation Crystals, Ancient Ice, Time Shards',
    lore: 'The crystalline formations here act as natural time capsules, preserving ancient marine Monsters in perfect stasis. The crystals themselves pulse with temporal energy that can slow or accelerate time in small pockets.',
    areas: [
      {
        id: 'coastal-settlement',
        name: 'Coastal Settlement',
        image: '/images/maps/areas/coastal-settlement.png',
        description: 'Advanced research facility studying the temporal properties of the preservation crystals.',
        coordinates: { x: 15, y: 25, width: 18, height: 16 },
        difficulty: 'Hard',
        specialFeatures: ['Temporal Research', 'Crystal Analysis', 'Time Chambers', 'Ancient Specimens']
      },
      {
        id: 'ancient-reef',
        name: 'Ancient Reef',
        image: '/images/maps/areas/ancient-reef.png',
        description: 'Underwater coral reef perfectly preserved in crystal, home to living fossil marine Monsters.',
        coordinates: { x: 55, y: 30, width: 22, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Living Fossil Reef', 'Crystal Coral', 'Ancient Ecosystem', 'Marine Preservation']
      },
      {
        id: 'time-pools',
        name: 'Time Pools',
        image: '/images/maps/areas/time-pools.png',
        description: 'Natural tidal pools where time moves at different speeds, creating temporal anomalies.',
        coordinates: { x: 40, y: 15, width: 20, height: 15 },
        difficulty: 'Extreme',
        specialFeatures: ['Time Distortion', 'Temporal Pools', 'Speed Variations', 'Chronological Mysteries']
      }
    ]
  },
  'volcanic-peaks': {
  id: 'volcanic-peaks',
  name: 'Volcanic Peaks',
  landmassId: 'conoocoo-archipelago',
  landmassName: 'Conoocoo Archipelago',
  image: '/images/maps/regions/volcanic-peaks-detailed.png',
  description: 'A stunning volcano in the center of the Primordial Jungle, where Fire-type Monsters and drake-like creatures soar above lava flows and molten rock.',
  climate: 'Volcanic',
  elevation: '500 - 4,200 ft',
  dominantTypes: ['Fire', 'Rock', 'Ground'],
  wildlife: ['Ember Drakes', 'Magma Guardians', 'Flame Sylphs'],
  resources: ['Sacred Obsidian', 'Ember Lotus Petals', 'Crimson Iron'],
  lore: 'For centuries, the Emberkin clans have made sacred pacts with the Great Forge Spirit deep beneath these islands. They believe every lava flow a blessing to temper their blades and strengthen their bond with the valley’s monstrous guardians.',
  areas: [
    {
      id: 'emberforge-settlement',
      name: 'Emberforge Settlement',
      image: '/images/maps/areas/emberforge-settlement.png',
      description: 'Perched on a cliff above a molten river, this village is the heart of Emberkin craftsmanship. Here, blacksmiths draw heat from lava flows to forge legendary weapons, while drake riders prepare their mounts for skyward patrols.',
      coordinates: { x: 30, y: 35, width: 20, height: 15 },
      difficulty: 'Medium',
      specialFeatures: ['Lava-quenched Forges', 'Tribal Smithing Rites', 'Drake Rider Stables']
    },
    {
      id: 'sacred-caldera',
      name: 'Sacred Caldera',
      image: '/images/maps/areas/sacred-caldera.png',
      description: 'The hollow heart of the volcano, where Emberkin shamans perform dawn-and-dusk ceremonies to honor—or awaken—the slumbering Fire Leviathan deep below.',
      coordinates: { x: 45, y: 20, width: 30, height: 25 },
      difficulty: 'Extreme',
      specialFeatures: ['Leviathan’s Seal', 'Ritual Pyres', 'Molten Glyphs']
    },
    {
      id: 'drakescale-ridge',
      name: 'Drakescale Ridge',
      image: '/images/maps/areas/drakescale-ridge.png',
      description: 'A jagged outcrop of obsidian spires where Ember Drakes bask in the heat and fiercely guard their nests—any who trespass risk facing packs of young drakes under the watchful eyes of broodmothers.',
      coordinates: { x: 15, y: 55, width: 25, height: 20 },
      difficulty: 'Hard',
      specialFeatures: ['Drake Nests', 'Smoking Spires', 'Scale Harvest Grounds']
    },
    {
      id: 'obsidian-halls',
      name: 'Obsidian Halls',
      image: '/images/maps/areas/obsidian-halls.png',
      description: 'A labyrinth of volcanic glass caverns where Flame Shamans commune with ancient Forge Spirits. The walls hum with latent pyromantic energy and glow with faint ember-light.',
      coordinates: { x: 55, y: 65, width: 20, height: 22 },
      difficulty: 'Extreme',
      specialFeatures: ['Spirit Chambers', 'Crystalized Lava Pools', 'Echoing Halls']
    }
  ]
}
,
  'mist-marshlands': {
    id: 'mist-marshlands',
    name: 'Mist Marshlands',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/regions/mist-marshlands-detailed.png',
    description: 'Mysterious marshlands shrouded in perpetual mist, where water and grass-type ancients breed in secret.',
    climate: 'Misty Prehistoric Wetland',
    elevation: '50 - 400 ft',
    dominantTypes: ['Water', 'Grass', 'Ghost'],
    wildlife: 'Ancient Bog Spirits, Prehistoric Amphibians, Mist Weavers',
    resources: 'Ancient Moss, Mist Essence, Bog Minerals',
    lore: 'These marshlands are said to be the nursery of the ancient world, where the first amphibious Monsters emerged from primordial waters. The perpetual mist carries whispers of prehistoric times, and deep in the swamps, ancient breeding grounds still function as they did millions of years ago.',
    areas: [
     
      {
        id: 'mist-village',
        name: 'Mist Village',
        image: '/images/maps/areas/mist-village.png',
        description: 'Traditional village built on floating platforms, where locals have learned to navigate the eternal mist.',
        coordinates: { x: 20, y: 50, width: 22, height: 16 },
        difficulty: 'Medium',
        specialFeatures: ['Floating Platforms', 'Mist Navigation', 'Traditional Fishing', 'Bog Adaptation']
      },
            {
        id: 'fog-temple',
        name: 'Temple of the Mists',
        image: '/images/maps/areas/fog-temple.png',
        description: 'Ancient temple hidden in the deepest mist, where bog spirits are said to commune with the living.',
        coordinates: { x: 35, y: 70, width: 18, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Bog Spirit Communion', 'Ancient Mysteries', 'Mist Rituals', 'Spirit Bridges']
      }
    ]
  },
  // Sky Isles Regions
  'nimbus-capital': {
    id: 'nimbus-capital',
    name: 'Nimbus Capital',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/regions/nimbus-capital-detailed.png',
    description: 'The grand floating capital built on storm clouds, where sky kings rule from palaces of crystallized air.',
    climate: 'Stratospheric Royal (Cloud Kingdom)',
    elevation: '8,000 - 12,000 ft',
    dominantTypes: ['Flying', 'Psychic', 'Fairy'],
    wildlife: 'Royal Sky Guardians, Cloud Architects, Storm Nobles',
    resources: 'Crystallized Air, Royal Wind Gems, Storm Silk',
    lore: 'The capital of the sky realm, where ancient sky kings rule from palaces built of solidified clouds and crystallized wind. The city follows celestial patterns, rotating through the sky on currents that only the sky-born can predict. Here, the greatest flying Monsters serve as royal guards and ambassadors to the ground world.',
    areas: [
      {
        id: 'cloud-palace',
        name: 'Cloud Palace',
        image: '/images/maps/areas/cloud-palace.png',
        description: 'Magnificent palace built entirely of solidified clouds and crystallized air, home to sky royalty.',
        coordinates: { x: 40, y: 35, width: 30, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Sky Royal Court', 'Crystallized Architecture', 'Cloud Throne Room', 'Royal Wind Gardens']
      },
      {
        id: 'storm-district',
        name: 'Storm District',
        image: '/images/maps/areas/storm-district.png',
        description: 'Commercial district powered by controlled lightning, where sky merchants trade wind-forged goods.',
        coordinates: { x: 20, y: 50, width: 25, height: 20 },
        difficulty: 'Hard',
        specialFeatures: ['Lightning Power', 'Sky Markets', 'Wind Forges', 'Storm Commerce']
      },
      {
        id: 'sky-harbor',
        name: 'Sky Harbor',
        image: '/images/maps/areas/sky-harbor.png',
        description: 'Aerial harbor where flying Monsters and wind-powered vessels dock on platforms of solid air.',
        coordinates: { x: 60, y: 25, width: 22, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Aerial Docking', 'Wind Vessels', 'Sky Transport', 'Flying Monsters Services']
      },
      {
        id: 'wind-gardens',
        name: 'Wind Gardens',
        image: '/images/maps/areas/wind-gardens.png',
        description: 'Floating gardens where sky plants grow on currents of air, tended by fairy-type gardeners.',
        coordinates: { x: 35, y: 65, width: 25, height: 20 },
        difficulty: 'Medium',
        specialFeatures: ['Floating Gardens', 'Air Current Cultivation', 'Sky Plants', 'Fairy Gardeners']
      }
    ]
  },
  'aurora-heights': {
    id: 'aurora-heights',
    name: 'Aurora Heights',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/regions/aurora-heights-detailed.png',
    description: 'Highest floating islands where aurora lights dance and celestial Monsters gather under starlight.',
    climate: 'Celestial Arctic Sky (Aurora Realm)',
    elevation: '15,000 - 20,000 ft',
    dominantTypes: ['Psychic', 'Ice', 'Fairy'],
    wildlife: 'Aurora Dancers, Star Gazers, Celestial Messengers',
    resources: 'Aurora Crystals, Starlight Essence, Celestial Ice',
    lore: 'The highest realm of the sky isles, where the aurora borealis creates permanent light shows and celestial Monsters commune with the stars themselves. Here, psychic-type Monsters have developed the ability to read stellar patterns and predict cosmic events, serving as oracles for both sky and ground dwellers.',
    areas: [
      {
        id: 'starlight-observatory',
        name: 'Starlight Observatory',
        image: '/images/maps/areas/starlight-observatory.png',
        description: 'Crystal observatory where sky astronomers study celestial movements and commune with star Monsters.',
        coordinates: { x: 35, y: 30, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Celestial Observation', 'Star Communion', 'Cosmic Predictions', 'Crystal Telescopes']
      },
      {
        id: 'aurora-village',
        name: 'Aurora Village',
        image: '/images/maps/areas/aurora-village.png',
        description: 'Village built within the aurora itself, where residents live among dancing lights and starfire.',
        coordinates: { x: 15, y: 50, width: 20, height: 18 },
        difficulty: 'Hard',
        specialFeatures: ['Aurora Living', 'Light Architecture', 'Starfire Hearths', 'Celestial Community']
      },
      {
        id: 'celestial-shrine',
        name: 'Celestial Shrine',
        image: '/images/maps/areas/celestial-shrine.png',
        description: 'Sacred shrine where star ceremonies honor cosmic Monsters and celestial alignments.',
        coordinates: { x: 60, y: 25, width: 18, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Star Ceremonies', 'Cosmic Honor', 'Celestial Alignments', 'Divine Astronomy']
      },
      {
        id: 'shooting-star',
        name: 'Shooting Star Peak',
        image: '/images/maps/areas/shooting-star.png',
        description: 'Highest peak where falling stars are caught and their cosmic energy harvested for sky magic.',
        coordinates: { x: 45, y: 65, width: 20, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Star Catching', 'Cosmic Energy Harvest', 'Sky Magic', 'Meteorite Collection']
      }
    ]
  },
  'tempest-zones': {
    id: 'tempest-zones',
    name: 'Tempest Zones',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/regions/tempest-zones-detailed.png',
    description: 'Chaotic sky regions where perpetual storms rage and electric-type sky dwellers thrive in lightning.',
    climate: 'Eternal Tempest (Storm Chaos)',
    elevation: '10,000 - 16,000 ft',
    dominantTypes: ['Electric', 'Flying', 'Steel'],
    wildlife: 'Storm Lords, Lightning Riders, Thunder Titans',
    resources: 'Pure Lightning, Storm Cores, Thunder Metals',
    lore: 'The most dangerous region of the sky isles, where eternal storms have raged for millennia. Electric-type Monsters here have evolved to feed directly on lightning and ride storm currents. Only the most skilled storm riders can navigate these chaotic winds, and legends say that mastering the tempest grants dominion over all weather.',
    areas: [
      {
        id: 'lightning-city',
        name: 'Lightning City',
        image: '/images/maps/areas/lightning-city.png',
        description: 'Electrified city built within the storm itself, powered entirely by captured lightning strikes.',
        coordinates: { x: 40, y: 35, width: 25, height: 22 },
        difficulty: 'Extreme',
        specialFeatures: ['Storm Integration', 'Lightning Power', 'Electric Architecture', 'Thunder Resonance']
      },
      {
        id: 'storm-riders',
        name: 'Storm Riders Outpost',
        image: '/images/maps/areas/storm-riders.png',
        description: 'Daredevil outpost where storm riders train to navigate the most dangerous wind currents.',
        coordinates: { x: 20, y: 55, width: 22, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['Storm Training', 'Dangerous Navigation', 'Wind Mastery', 'Rider Brotherhood']
      },
      {
        id: 'thunder-arena',
        name: 'Thunder Arena',
        image: '/images/maps/areas/thunder-arena.png',
        description: 'Aerial colosseum where electric Monsters battle amidst constant lightning strikes.',
        coordinates: { x: 60, y: 25, width: 20, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Lightning Battles', 'Electric Colosseum', 'Storm Combat', 'Thunder Trials']
      },
      {
        id: 'electric-vortex',
        name: 'Electric Vortex',
        image: '/images/maps/areas/electric-vortex.png',
        description: 'Massive electrical storm vortex that serves as a gateway between the sky and storm dimensions.',
        coordinates: { x: 45, y: 65, width: 25, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Storm Vortex', 'Dimensional Gateway', 'Pure Electricity', 'Chaos Convergence']
      }
    ]
  },
  'draconic-abyss': {
    id: 'draconic-abyss',
    name: 'Draconic Abyss',
    landmassId: 'sky-isles',
    landmassName: 'Sky Isles',
    image: '/images/maps/regions/draconic-abyss-detailed.png',
    description: 'The most treacherous sky realm where ancient dragon lords rule from floating citadels of bone and flame, protected by the savage Wyrmclaw Tribe.',
    climate: 'Infernal Sky Wasteland (Dragon\'s Domain)',
    elevation: '18,000 - 25,000 ft',
    dominantTypes: ['Dragon', 'Fire', 'Dark'],
    wildlife: 'Ancient Dragon Lords, Wyrmclaw Tribal Warriors, Bone Drakes',
    resources: 'Dragon Bones, Infernal Crystals, Tribal Totems',
    lore: 'The highest and most dangerous realm of the sky isles, where only the most ancient and powerful dragons dare to dwell. The Wyrmclaw Tribe, descendants of humans who made pacts with dragons centuries ago, have adapted to this harsh environment through draconic rituals and blood bonds. They are fierce protectors of the dragon lords and will attack any outsiders on sight. The very air here burns with draconic energy, and survival requires both incredible skill and the dragons\' blessing.',
    areas: [
      {
        id: 'bone-citadel',
        name: 'Bone Citadel',
        image: '/images/maps/areas/bone-citadel.png',
        description: 'Massive floating fortress built from the bones of fallen dragons, home to the most ancient dragon lords.',
        coordinates: { x: 45, y: 30, width: 25, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Dragon Bone Architecture', 'Ancient Dragon Lords', 'Floating Fortress', 'Death Magic']
      },
      {
        id: 'wyrmclaw-village',
        name: 'Wyrmclaw Village',
        image: '/images/maps/areas/wyrmclaw-village.png',
        description: 'Tribal settlement of dragon-bonded humans who have adapted to the hostile sky environment through draconic pacts.',
        coordinates: { x: 20, y: 50, width: 20, height: 18 },
        difficulty: 'Extreme',
        specialFeatures: ['Dragon-Bonded Tribe', 'Draconic Rituals', 'Hostile Natives', 'Blood Pacts']
      },
      {
        id: 'dragon-graveyard',
        name: 'Dragon Graveyard',
        image: '/images/maps/areas/dragon-graveyard.png',
        description: 'Sacred burial ground where ancient dragons come to die, their bones forming floating islands of immense power.',
        coordinates: { x: 60, y: 25, width: 22, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Dragon Burial Ground', 'Floating Bone Islands', 'Sacred Death Site', 'Immense Power']
      },
      {
        id: 'flame-chasm',
        name: 'Flame Chasm',
        image: '/images/maps/areas/flame-chasm.png',
        description: 'Bottomless chasm filled with eternal dragonfire, where young dragons prove their worth in trials by flame.',
        coordinates: { x: 15, y: 70, width: 18, height: 25 },
        difficulty: 'Extreme',
        specialFeatures: ['Eternal Dragonfire', 'Dragon Trials', 'Bottomless Chasm', 'Proving Grounds']
      },
      {
        id: 'apex-throne',
        name: 'Apex Throne',
        image: '/images/maps/areas/apex-throne.png',
        description: 'The highest point in all the sky isles, where the Dragon Emperor holds court above the clouds and stars.',
        coordinates: { x: 40, y: 65, width: 20, height: 20 },
        difficulty: 'Extreme',
        specialFeatures: ['Dragon Emperor\'s Throne', 'Highest Sky Point', 'Imperial Dragon Court', 'Stellar Dominion']
      }
    ]
  }
};


  useEffect(() => {
    const region = Regions[regionId];
    setRegionData(region);
    if (region) {
      setLandmassData({ id: region.landmassId, name: region.landmassName });
    }
  }, [regionId]);

  const handleAreaClick = (area) => {
    navigate(`/guides/interactive-map/landmass/${landmassId}/region/${regionId}/area/${area.id}`);
  };

  const handleAreaHover = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

  const handleBack = () => {
    navigate(`/guides/interactive-map/landmass/${landmassId}`);
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

  if (!regionData) {
    return <div className="loading">Loading region data...</div>;
  }

  return (
    <div className="area-page">
      <div className="area-header">
        <div className="breadcrumb">
          <button onClick={() => navigate('/guides/interactive-map')} className="breadcrumb-link">
            World Map
          </button>
          <span className="breadcrumb-separator">›</span>
          <button onClick={handleBack} className="breadcrumb-link">
            {landmassData?.name}
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="currency-label">{regionData.name}</span>
        </div>
        <button onClick={handleBack} className="button secondary">
          ← Back to {landmassData?.name}
        </button>
        <h1 align="center">{regionData.name}</h1>

        
      </div>

      <div className="area-content">
        <div className="region-top-section">
          <div className="region-map-section">
            <div className="region-map-container">
              <img 
                src={regionData.image} 
                alt={regionData.name}
                className="world-map-image"
                onError={(e) => handleMapImageError(e, 'map')}
              />
              
              {regionData.areas.map((area) => (
                <div
                  key={area.id}
                  className="area-hotspot"
                  style={{
                    left: `${area.coordinates.x}%`,
                    top: `${area.coordinates.y}%`,
                    width: `${area.coordinates.width}%`,
                    height: `${area.coordinates.height}%`
                  }}
                  onClick={() => handleAreaClick(area)}
                  onMouseEnter={() => handleAreaHover(area)}
                  onMouseLeave={handleAreaLeave}
                />
              ))}

              {hoveredArea && (
                <div className="map-tooltip">
                  <div className="npc-basic-info">
                    <img 
                      src={hoveredArea.image} 
                      alt={hoveredArea.name}
                      className="tooltip-image"
                      onError={(e) => handleMapImageError(e, 'map')}
                    />
                    <div className="area-card">
                      <h3>{hoveredArea.name}</h3>
                      <p>{hoveredArea.description}</p>
                      <div className="status-badge" style={{ backgroundColor: getDifficultyColor(hoveredArea.difficulty) }}>
                        {hoveredArea.difficulty}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="breeding-form">
            <div className="info-card">
              <h3>Description</h3>
              <p>{regionData.description}</p>
            </div>
            <div className="info-card">
              <h3>Climate</h3>
              <p>{regionData.climate}</p>
            </div>
            <div className="info-card">
              <h3>Elevation</h3>
              <p>{regionData.elevation}</p>
            </div>
            <div className="info-card">
              <h3>Dominant Types</h3>
              <div className="map-type-badges">
                {regionData.dominantTypes.map((type) => (
                  <span key={type} className={`trainer-type-badge type-${type.toLowerCase()}`}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="area-details">
          <div className="area-details">
            <div className="timer-settings">
              <div className="info-card">
                <h3>Wildlife</h3>
                <p>{regionData.wildlife}</p>
              </div>
              <div className="info-card">
                <h3>Resources</h3>
                <p>{regionData.resources}</p>
              </div>
            </div>

            <div className="tips">
              <h3>Lore & History</h3>
              <p>{regionData.lore}</p>
            </div>

            <div className="areas-section">
              <h3>Areas ({regionData.areas.length})</h3>
              <div className="areas-grid">
                {regionData.areas.map((area) => (
                  <div 
                    key={area.id} 
                    className="area-card"
                    onClick={() => handleAreaClick(area)}
                  >
                    <img 
                      src={area.image} 
                      alt={area.name}
                      className="area-card-image"
                      onError={(e) => handleMapImageError(e, 'map')}
                    />
                    <div className="area-card-content">
                      <div className="resource-header">
                        <h4>{area.name}</h4>
                        <div 
                          className="status-badge small"
                          style={{ backgroundColor: getDifficultyColor(area.difficulty) }}
                        >
                          {area.difficulty}
                        </div>
                      </div>
                      <p>{area.description}</p>
                      <div className="features-list">
                        <strong>Features:</strong>
                        <div className="feature-tags">
                          {area.specialFeatures.map((feature, index) => (
                            <span key={index} className="feature-tag">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionPage;