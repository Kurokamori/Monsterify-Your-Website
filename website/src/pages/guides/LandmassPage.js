import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleMapImageError } from '../../utils/imageUtils';

const LandmassPage = () => {
  const { landmassId } = useParams();
  const navigate = useNavigate();
  const [landmassData, setLandmassData] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

const Landmasses = {
  'conoco-island': {
    id: 'conoco-island',
    name: 'Conoco Island',
    image: '/images/maps/conoco-island-detailed.png',
    description: 'A vast island seemingly disconnected entirely from the rest of the world, where beasts of many kinds roam free.',
    climate: 'Varied (Temperate, Tropical, Desert, Alpine, Coastal, Mystical)',
    dominantTypes: [
      'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
      'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark',
      'Steel','Fairy'
    ],
    lore: 'Legend speaks of eighteen ancient spirits from different realms who found sanctuary on this island, each claiming dominion over a region that reflects their elemental essence. The island serves as a living tapestry of elemental energies, where frost titans dwell alongside fire spirits, and woodland courts neighbor wind guardians.',
    regions: [
      {
        id: 'hearthfall-commons',
        name: 'Hearthfall Commons',
        image: '/images/maps/regions/hearthfall-commons.png',
        description: 'A peaceful region with cozy settlements and the grand Central City, where Normal-type Monsters gather in harmonious communities.',
        coordinates: { x: 30, y: 55, width: 15, height: 12 },
        areas: [ ]
      },
      {
        id: 'agni-peaks',
        name: 'Agni Peaks',
        image: '/images/maps/regions/agni-peaks.png',
        description: 'Sacred fire mountains where flames burn eternal, home to powerful Fire-type Monsters.',
        coordinates: { x: 55, y: 35, width: 18, height: 20 },
        areas: [
        ]
      },
      {
        id: 'poseidons-reach',
        name: 'Poseidon\'s Reach',
        image: '/images/maps/regions/poseidons-reach.png',
        description: 'Coastal realm ruled by the sea lord\'s power, teeming with Water-type Monsters.',
        coordinates: { x: 35, y: 85, width: 25, height: 15 },
        areas: [
          { id: 'atlantis-city', name: 'Atlantis City' },
          { id: 'nereid-harbor', name: 'Nereid Harbor' },
          { id: 'amphitrite-town', name: 'Amphitrite Town' },
          { id: 'trident-temple', name: 'Trident Temple' },
          { id: 'maelstrom-point', name: 'Maelstrom Point' }
        ]
      },
      {
        id: 'thunderbird-heights',
        name: 'Thunderbird Heights',
        image: '/images/maps/regions/thunderbird-heights.png',
        description: 'A beautiful realm, crackling with Electric-type energy.',
        coordinates: { x: 30, y: 35, width: 20, height: 18 },
        areas: [
        ]
      },
      {
        id: 'demeters-grove',
        name: 'Demeter\'s Grove',
        image: '/images/maps/regions/demeters-grove.png',
        description: 'Believed to be a blessed forest, where Grass-type Monsters flourish in eternal spring.',
        coordinates: { x: 65, y: 55, width: 22, height: 16 },
        areas: [
        ]
      },
      {
        id: 'jotun-tundra',
        name: 'Jötun Tundra',
        image: '/images/maps/regions/jotun-tundra.png',
        description: 'Frozen realm of frost giants, where Ice-type Monsters thrive in the eternal winter.',
        coordinates: { x: 5, y: 40, width: 20, height: 25 },
        areas: [
          { id: 'utgard-city', name: 'Utgard City' },
          { id: 'frost-village', name: 'Frost Village' },
          { id: 'rimeheart-town', name: 'Rimeheart Town' },
          { id: 'jotun-halls', name: 'Jötun Halls' },
          { id: 'eternal-glacier', name: 'Eternal Glacier' }
        ]
      },
      {
        id: 'kshatriya-arena',
        name: 'Kshatriya Arena',
        image: '/images/maps/regions/kshatriya-arena.png',
        description: 'A battlefield dedicated to the warriors of a time long past, where Fighting-type Monsters hone their martial arts.',
        coordinates: { x: 70, y: 20, width: 16, height: 18 },
        areas: [
          { id: 'kurukshetra-city', name: 'Kurukshetra City' },
          { id: 'dharma-village', name: 'Dharma Village' },
          { id: 'valor-town', name: 'Valor Town' },
          { id: 'honor-temple', name: 'Honor Temple' },
          { id: 'grand-colosseum', name: 'Grand Colosseum' }
        ]
      },
      {
        id: 'baba-yagas-marsh',
        name: 'Crowsfoot Marsh',
        image: '/images/maps/regions/crowsfoot-marsh.png',
        description: 'Ancient witch\'s mysterious swampland, where Poison-type Monsters brew in toxic mists.',
        coordinates: { x: 25, y: 5, width: 18, height: 15 },
        areas: [
          { id: 'witchwood-city', name: 'Witchwood City' },
          { id: 'cauldron-village', name: 'Cauldron Village' },
          { id: 'bog-town', name: 'Bog Town' },
          { id: 'iron-teeth-hut', name: 'Iron Teeth Hut' },
          { id: 'poison-pools', name: 'Poison Pools' }
        ]
      },
      {
        id: 'terra-madre-basin',
        name: 'Terra Madre Basin',
        image: '/images/maps/regions/terra-madre-basin.png',
        description: 'A mysterious earth mother\'s sacred valley, where Ground-type Monsters shape the very land.',
        coordinates: { x: 50, y: 5, width: 20, height: 20 },
        areas: [
          { id: 'tellus-city', name: 'Tellus City' },
          { id: 'terra-village', name: 'Terra Village' },
          { id: 'gaia-town', name: 'Gaia Town' },
          { id: 'mother-temple', name: 'Mother Earth Temple' },
          { id: 'sacred-canyon', name: 'Sacred Canyon' }
        ]
      },
      {
        id: 'quetzal-winds',
        name: 'Quetzal Winds',
        image: '/images/maps/regions/quetzal-winds.png',
        description: 'A great feathered serpent\'s domain, where Flying-type Monsters dance on ancient wind currents.',
        coordinates: { x: 75, y: 55, width: 18, height: 20 },
        areas: [
          { id: 'tenochtitlan-sky', name: 'Tenochtitlan Sky' },
          { id: 'wind-village', name: 'Wind Village' },
          { id: 'feather-town', name: 'Feather Town' },
          { id: 'serpent-pyramid', name: 'Serpent Pyramid' },
          { id: 'floating-gardens', name: 'Floating Gardens' }
        ]
      },
      {
        id: 'oracles-sanctum',
        name: 'Oracle\'s Sanctum',
        image: '/images/maps/regions/oracles-sanctum.png',
        description: 'The Delphic oracle\'s mystical realm, where Psychic-type Monsters commune with higher powers.',
        coordinates: { x: 35, y: 75, width: 15, height: 18 },
        areas: [
          { id: 'delphi-city', name: 'Delphi City' },
          { id: 'pythia-village', name: 'Pythia Village' },
          { id: 'vision-town', name: 'Vision Town' },
          { id: 'apollo-temple', name: 'Apollo Temple' },
          { id: 'sacred-vapors', name: 'Sacred Vapors' }
        ]
      },
      {
        id: 'anansi-woods',
        name: 'Anansi Woods',
        image: '/images/maps/regions/anansi-woods.png',
        description: 'The intricate forest woven by many bugs, where Bug-type Monsters weave stories in silk and shadow.',
        coordinates: { x: 60, y: 75, width: 20, height: 15 },
        areas: [
          { id: 'kumasi-city', name: 'Kumasi City' },
          { id: 'story-village', name: 'Story Village' },
          { id: 'web-town', name: 'Web Town' },
          { id: 'great-tree', name: 'Great Story Tree' },
          { id: 'silk-library', name: 'Silk Library' }
        ]
      },
      {
        id: 'stoneheart-cliffs',
        name: 'Stoneheart Cliffs',
        image: '/images/maps/regions/stoneheart-cliffs.png',
        description: 'Stone circle highlands, where Rock-type Monsters guard ancient druidic secrets.',
        coordinates: { x: 80, y: 75, width: 15, height: 20 },
        areas: [
          { id: 'avalon-city', name: 'Avalon City' },
          { id: 'druid-village', name: 'Druid Village' },
          { id: 'cairn-town', name: 'Cairn Town' },
          { id: 'stonehenge-site', name: 'Stonehenge Site' },
          { id: 'memory-cliffs', name: 'Memory Cliffs' }
        ]
      },
      {
        id: 'mictlan-hollows',
        name: 'Mictlan Hollows',
        image: '/images/maps/regions/mictlan-hollows.png',
        description: 'An almost hellish underworld realm where spirits dwell, home to mysterious Ghost-type Monsters.',
        coordinates: { x: 5, y: 75, width: 18, height: 16 },
        areas: [
          { id: 'mictlampa-city', name: 'Mictlampa City' },
          { id: 'xochitonal-village', name: 'Xochitonal Village' },
          { id: 'bone-town', name: 'Bone Town' },
          { id: 'death-pyramid', name: 'Death Lord Pyramid' },
          { id: 'river-crossing', name: 'River of Souls' }
        ]
      },
      {
        id: 'long-valley',
        name: 'Long Valley',
        image: '/images/maps/regions/long-valley.png',
        description: 'Perilous dragon realm of wisdom and power, where majestic Dragon-type Monsters reign supreme.',
        coordinates: { x: 10, y: 5, width: 25, height: 12 },
        areas: [
          { id: 'tianlong-city', name: 'Tianlong City' },
          { id: 'jade-village', name: 'Jade Village' },
          { id: 'wisdom-town', name: 'Wisdom Town' },
          { id: 'imperial-palace', name: 'Imperial Dragon Palace' },
          { id: 'nine-dragons', name: 'Nine Dragons Falls' }
        ]
      },
      {
        id: 'ravens-shadow',
        name: 'Raven\'s Shadow',
        image: '/images/maps/regions/ravens-shadow.png',
        description: 'The trickster\'s twilight realm, where cunning Dark-type Monsters lurk in shadows.',
        coordinates: { x: 5, y: 20, width: 16, height: 15 },
        areas: [
          { id: 'corvus-city', name: 'Corvus City' },
          { id: 'shadow-village', name: 'Shadow Village' },
          { id: 'twilight-town', name: 'Twilight Town' },
          { id: 'trickster-lodge', name: 'Trickster Lodge' },
          { id: 'eternal-dusk', name: 'Eternal Dusk Grove' }
        ]
      },
      {
        id: 'hephaestus-forge',
        name: 'Hephaestus Forge',
        image: '/images/maps/regions/hephaestus-forge.png',
        description: 'Believed to once have been an ancient master craftsman\'s industrial workshop, where Steel-type Monsters craft legendary metals and machines.',
        coordinates: { x: 85, y: 35, width: 12, height: 15 },
        areas: [
          { id: 'vulcan-city', name: 'Vulcan City' },
          { id: 'cyclops-village', name: 'Cyclops Village' },
          { id: 'forge-town', name: 'Forge Town' },
          { id: 'divine-workshop', name: 'Divine Workshop' },
          { id: 'adamant-peak', name: 'Adamant Peak' }
        ]
      },
      {
        id: 'seelie-courts',
        name: 'Seelie Courts',
        image: '/images/maps/regions/seelie-courts.png',
        description: 'Stunning fairy kingdom of wonder and magic, where Fairy-type Monsters hold eternal revelries.',
        coordinates: { x: 55, y: 80, width: 18, height: 15 },
        areas: [
          { id: 'titania-city', name: 'Titania City' },
          { id: 'oberon-village', name: 'Oberon Village' },
          { id: 'puck-town', name: 'Puck Town' },
          { id: 'summer-court', name: 'Summer Court' },
          { id: 'enchanted-glade', name: 'Enchanted Glade' }
        ]
      },
      {
        id: 'pirates-bay',
        name: 'Pirates Bay',
        image: '/images/maps/regions/pirates-bay.png',
        description: 'The far reaches of the island where few dare travel and the pirates have made their home.',
        coordinates: { x: 5, y: 5, width: 15, height: 15 },
        areas: [
          { id: 'pirate-port', name: 'Pirate Port' },
          { id: 'pirate-village', name: 'Pirate Village' },
          { id: 'hidden-cove', name: 'Hidden Cove' },
          { id: 'nyakuza-landing', name: 'Nyakuza Landing' },
          { id: 'skull-rock', name: 'Skull Rock' }
        ]
      }
    ]
  },

  'conoocoo-archipelago': {
    id: 'conoocoo-archipelago',
    name: 'Conoocoo Archipelago',
    image: '/images/maps/conoocoo-archipelago-detailed.png',
    description: 'A chain of mysterious tropical islands where time seems frozen in the age of giants. The central Primordial Jungle harbors prehistoric Monsters that have survived since ancient times.',
    climate: 'Tropical Prehistoric (Lush, Humid, Volcanic, Coastal)',
    dominantTypes: ['Grass', 'Water', 'Rock', 'Dragon', 'Steel'],
    lore: 'Legend tells of a great cataclysm that separated these islands from the flow of time, preserving creatures from eras long past. The central jungle pulses with primordial energy, where fossil Monsters roam freely and ancient species that predate recorded history still thrive. The local tribes live in harmony with these rare and legendary monsters, and to all they can to keep this secret hidden.',
    regions: [
      {
        id: 'primordial-jungle',
        name: 'Primordial Jungle',
        image: '/images/maps/regions/primordial-jungle.png',
        description: 'The massive central jungle where prehistoric Monsters roam among ancient trees that have stood since the dawn of time.',
        coordinates: { x: 15, y: 40, width: 60, height: 25 },
        areas: [
                  ]
      },
      {
        id: 'crystal-cove',
        name: 'Crystal Cove',
        image: '/images/maps/regions/crystal-cove.png',
        description: 'Coastal region with crystalline formations that preserve ancient marine life in suspended animation.',
        coordinates: { x: 35, y: 70, width: 25, height: 18 },
        areas: [
          
        ]
      },
      {
        id: 'volcanic-peaks',
        name: 'Volcanic Peaks',
        image: '/images/maps/regions/volcanic-peaks.png',
        description: 'Active volcanic islands where the earth\'s primordial forces still shape the land and awaken sleeping giants.',
        coordinates: { x: 35, y: 15, width: 18, height: 22 },
        areas: [
          
        ]
      },
      {
        id: 'mist-marshlands',
        name: 'Mist Marshlands',
        image: '/images/maps/regions/mist-marshlands.png',
        description: 'Mysterious marshlands shrouded in perpetual mist, where water and grass-type ancients breed in secret.',
        coordinates: { x: 60, y: 55, width: 22, height: 40 },
        areas: [
          
        ]
      }
    ]
  },

  'sky-isles': {
    id: 'sky-isles',
    name: 'Sky Isles',
    image: '/images/maps/sky-isles-detailed.png',
    description: 'Mystical floating islands suspended in the clouds, where ancient sky civilizations built cities that touch the stars and commune with celestial Monsters.',
    climate: 'Ethereal Sky (Celestial Winds)',
    dominantTypes: ['Flying', 'Psychic', 'Fairy', 'Dragon', 'Steel'],
    lore: 'These islands defy gravity itself, held aloft by ancient sky magic and celestial energy. The islands rotate slowly through the heavens, following star patterns that only the sky-dwellers understand. Here, Flying-type Monsters have evolved beyond earthbound limitations, and legendary sky serpents patrol the cloud roads between floating cities.',
    regions: [
      {
        id: 'nimbus-capital',
        name: 'Nimbus Capital',
        image: '/images/maps/regions/nimbus-capital.png',
        description: 'The grand floating capital built on storm clouds, where sky kings rule from palaces of crystallized air.',
        coordinates: { x: 40, y: 35, width: 25, height: 20 },
        areas: [
          { id: 'cloud-palace', name: 'Cloud Palace' },
          { id: 'storm-district', name: 'Storm District' },
          { id: 'sky-harbor', name: 'Sky Harbor' },
          { id: 'wind-gardens', name: 'Wind Gardens' }
        ]
      },
      {
        id: 'aurora-heights',
        name: 'Aurora Heights',
        image: '/images/maps/regions/aurora-heights.png',
        description: 'Highest floating islands where aurora lights dance and celestial Monsters gather under starlight.',
        coordinates: { x: 20, y: 15, width: 18, height: 22 },
        areas: [
          { id: 'starlight-observatory', name: 'Starlight Observatory' },
          { id: 'aurora-village', name: 'Aurora Village' },
          { id: 'celestial-shrine', name: 'Celestial Shrine' },
          { id: 'shooting-star', name: 'Shooting Star Peak' }
        ]
      },
      {
        id: 'tempest-zones',
        name: 'Tempest Zones',
        image: '/images/maps/regions/tempest-zones.png',
        description: 'Chaotic sky regions where perpetual storms rage and electric-type sky dwellers thrive in lightning.',
        coordinates: { x: 65, y: 50, width: 20, height: 25 },
        areas: [
          { id: 'lightning-city', name: 'Lightning City' },
          { id: 'storm-riders', name: 'Storm Riders Outpost' },
          { id: 'thunder-arena', name: 'Thunder Arena' },
          { id: 'electric-vortex', name: 'Electric Vortex' }
        ]
      },
      {
        id: 'draconic-abyss',
        name: 'Draconic Abyss',
        image: '/images/maps/regions/draconic-abyss.png',
        description: 'The most treacherous sky realm where ancient dragon lords rule from floating citadels of bone and flame, protected by the savage Wyrmclaw Tribe.',
        coordinates: { x: 15, y: 70, width: 30, height: 25 },
        areas: [
          { id: 'bone-citadel', name: 'Bone Citadel' },
          { id: 'wyrmclaw-village', name: 'Wyrmclaw Village' },
          { id: 'dragon-graveyard', name: 'Dragon Graveyard' },
          { id: 'flame-chasm', name: 'Flame Chasm' },
          { id: 'apex-throne', name: 'Apex Throne' }
        ]
      }
    ]
  }
};


  useEffect(() => {
    const data = Landmasses[landmassId];
    setLandmassData(data);
  }, [landmassId]);

  const handleRegionClick = (region) => {
    navigate(`/guides/interactive-map/landmass/${landmassId}/region/${region.id}`);
  };

  const handleRegionHover = (region) => {
    setHoveredRegion(region);
  };

  const handleRegionLeave = () => {
    setHoveredRegion(null);
  };

  const handleBack = () => {
    navigate('/guides/interactive-map');
  };

  if (!landmassData) {
    return <div className="loading">Loading landmass data...</div>;
  }

  return (
    <div className="landmass-page">
      <div className="landmass-header">
        <button onClick={handleBack} className="back-button">
          ← Back to World Map
        </button>
        <h1>{landmassData.name}</h1>
        <p className="landmass-subtitle">{landmassData.description}</p>
      </div>

      <div className="landmass-content">
        <div className="landmass-top-section">
          <div className="landmass-map-section">
            <div className="landmass-map-container">
              <img 
                src={landmassData.image} 
                alt={landmassData.name}
                className="landmass-map-image"
                onError={(e) => handleMapImageError(e, 'map')}
              />
              
              {landmassData.regions.map((region) => (
                <div
                  key={region.id}
                  className="region-hotspot"
                  style={{
                    left: `${region.coordinates.x}%`,
                    top: `${region.coordinates.y}%`,
                    width: `${region.coordinates.width}%`,
                    height: `${region.coordinates.height}%`
                  }}
                  onClick={() => handleRegionClick(region)}
                  onMouseEnter={() => handleRegionHover(region)}
                  onMouseLeave={handleRegionLeave}
                />
              ))}

              {hoveredRegion && (
                <div className="region-tooltip">
                  <div className="tooltip-content">
                    <img 
                      src={hoveredRegion.image} 
                      alt={hoveredRegion.name}
                      className="tooltip-image"
                      onError={(e) => handleMapImageError(e, 'map')}
                    />
                    <div className="tooltip-info">
                      <h3>{hoveredRegion.name}</h3>
                      <p>{hoveredRegion.description}</p>
                      <div className="area-count">
                        {hoveredRegion.areas.length} areas to explore
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="landmass-sidebar">
            <div className="info-card">
              <h3>Description</h3>
              <p>{landmassData.description}</p>
            </div>
            <div className="info-card">
              <h3>Climate</h3>
              <p>{landmassData.climate}</p>
            </div>
            <div className="info-card">
              <h3>Dominant Types</h3>
              <div className="map-type-badges">
                {landmassData.dominantTypes.map((type) => (
                  <span key={type} className={`trainer-type-badge type-${type.toLowerCase()}`}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="landmass-bottom-section">
          <div className="lore-section">
            <h3>Lore & History</h3>
            <p>{landmassData.lore}</p>
          </div>

          <div className="regions-section">
            <h3>Regions ({landmassData.regions.length})</h3>
            <div className="regions-grid">
              {landmassData.regions.map((region) => (
                <div 
                  key={region.id} 
                  className="region-card"
                  onClick={() => handleRegionClick(region)}
                >
                  <img 
                    src={region.image} 
                    alt={region.name}
                    className="region-card-image"
                    onError={(e) => handleMapImageError(e, 'map')}
                  />
                  <div className="region-card-content">
                    <h4>{region.name}</h4>
                    <p>{region.description}</p>
                    
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandmassPage;