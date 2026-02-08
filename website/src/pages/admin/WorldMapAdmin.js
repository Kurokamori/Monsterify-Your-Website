import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Complete data structures from the original files
const LANDMASSES_DATA = {
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
    lore: 'Legend speaks of eighteen ancient spirits from different realms who found sanctuary on this island, each claiming dominion over a region that reflects their elemental essence.',
    regions: []
  },
  'conoocoo-archipelago': {
    id: 'conoocoo-archipelago',
    name: 'Conoocoo Archipelago',
    image: '/images/maps/conoocoo-archipelago-detailed.png',
    description: 'A chain of mysterious tropical islands where time seems frozen in the age of giants.',
    climate: 'Tropical Prehistoric (Lush, Humid, Volcanic, Coastal)',
    dominantTypes: ['Grass', 'Water', 'Rock', 'Dragon', 'Steel'],
    lore: 'Legend tells of a great cataclysm that separated these islands from the flow of time.',
    regions: []
  },
  'sky-isles': {
    id: 'sky-isles',
    name: 'Sky Isles',
    image: '/images/maps/sky-isles-detailed.png',
    description: 'Mystical floating islands suspended in the clouds, where ancient sky civilizations built cities that touch the stars.',
    climate: 'Ethereal Sky (Celestial Winds)',
    dominantTypes: ['Flying', 'Psychic', 'Fairy', 'Dragon', 'Steel'],
    lore: 'These islands defy gravity itself, held aloft by ancient sky magic and celestial energy.',
    regions: []
  }
};

const REGIONS_DATA = {
  // Conoco Island Regions
  'hearthfall-commons': {
    id: 'hearthfall-commons',
    name: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/hearthfall-commons-detailed.png',
    description: 'A peaceful northern homeland with cozy settlements, where Normal-type Monsters gather in harmonious communities.',
    climate: 'Temperate Continental',
    elevation: '200 - 800 ft',
    dominantTypes: ['Normal'],
    areas: []
  },
  'agni-peaks': {
    id: 'agni-peaks',
    name: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/agni-peaks-detailed.png',
    description: 'Sacred fire mountains where eternal flames burn, home to powerful Fire-type Monsters.',
    climate: 'Volcanic Tropical',
    elevation: '3,000 - 8,500 ft',
    dominantTypes: ['Fire'],
    areas: []
  },
  'poseidons-reach': {
    id: 'poseidons-reach',
    name: 'Poseidon\'s Reach',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/poseidons-reach-detailed.png',
    description: 'Coastal realm ruled by the sea lord\'s power, teeming with Water-type Monsters.',
    climate: 'Coastal Marine',
    elevation: 'Sea level to 500 ft',
    dominantTypes: ['Water'],
    areas: []
  },
  'thunderbird-heights': {
    id: 'thunderbird-heights',
    name: 'Thunderbird Heights',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/thunderbird-heights-detailed.png',
    description: 'A beautiful realm, crackling with Electric-type energy.',
    climate: 'Mountain Electric',
    elevation: '4,000 - 12,000 ft',
    dominantTypes: ['Electric'],
    areas: []
  },
  'demeters-grove': {
    id: 'demeters-grove',
    name: 'Demeter\'s Grove',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/demeters-grove-detailed.png',
    description: 'Believed to be a blessed forest, where Grass-type Monsters flourish in eternal spring.',
    climate: 'Temperate Forest',
    elevation: '500 - 2,000 ft',
    dominantTypes: ['Grass'],
    areas: []
  },
  'jotun-tundra': {
    id: 'jotun-tundra',
    name: 'Jötun Tundra',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/regions/jotun-tundra-detailed.png',
    description: 'Frozen realm of frost giants, where Ice-type Monsters thrive in the eternal winter.',
    climate: 'Arctic Tundra',
    elevation: '100 - 3,000 ft',
    dominantTypes: ['Ice'],
    areas: []
  },
  // Add more regions...
  'primordial-jungle': {
    id: 'primordial-jungle',
    name: 'Primordial Jungle',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/regions/primordial-jungle-detailed.png',
    description: 'The massive central jungle where prehistoric Monsters roam among ancient trees.',
    climate: 'Tropical Prehistoric',
    elevation: '200 - 1,500 ft',
    dominantTypes: ['Grass', 'Rock', 'Dragon'],
    areas: []
  },
  'crystal-cove': {
    id: 'crystal-cove',
    name: 'Crystal Cove',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/regions/crystal-cove-detailed.png',
    description: 'Coastal region with crystalline formations that preserve ancient marine life.',
    climate: 'Tropical Coastal',
    elevation: 'Sea level to 200 ft',
    dominantTypes: ['Water', 'Rock'],
    areas: []
  }
};

const AREAS_DATA = {
  // Hearthfall Commons Areas
  'heimdal-city': {
    id: 'heimdal-city',
    name: 'Heimdal City',
    regionId: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/heimdal-city-detailed.png',
    description: 'The region\'s capital, a bustling city with cozy wooden buildings.',
    difficulty: 'Easy',
    elevation: '500 ft',
    temperature: '45°F to 65°F',
    recommendedLevel: '10+'
  },
  'hygge-village': {
    id: 'hygge-village',
    name: 'Hygge Village',
    regionId: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/hygge-village-detailed.png',
    description: 'A quaint village embodying the northern concept of cozy contentment.',
    difficulty: 'Easy',
    elevation: '400 ft',
    temperature: '40°F to 60°F',
    recommendedLevel: '5+'
  },
  'bonfire-town': {
    id: 'bonfire-town',
    name: 'Bonfire Town',
    regionId: 'hearthfall-commons',
    regionName: 'Hearthfall Commons',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/bonfire-town-detailed.png',
    description: 'A lively town centered around a perpetual bonfire where stories and warmth are shared.',
    difficulty: 'Easy',
    elevation: '450 ft',
    temperature: '50°F to 70°F',
    recommendedLevel: '5+'
  },
  // Agni Peaks Areas
  'agni-city': {
    id: 'agni-city',
    name: 'Agni City',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/agni-city-detailed.png',
    description: 'Mountain city built into volcanic slopes, with sacred fire temples.',
    difficulty: 'Hard',
    elevation: '4000 ft',
    temperature: '90°F to 120°F',
    recommendedLevel: '60+'
  },
  'yagna-village': {
    id: 'yagna-village',
    name: 'Yagna Village',
    regionId: 'agni-peaks',
    regionName: 'Agni Peaks',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/yagna-village-detailed.png',
    description: 'Sacred village where continuous fire ceremonies are performed.',
    difficulty: 'Medium',
    elevation: '3500 ft',
    temperature: '80°F to 100°F',
    recommendedLevel: '45+'
  },
  // Poseidon's Reach Areas
  'atlantis-city': {
    id: 'atlantis-city',
    name: 'Atlantis City',
    regionId: 'poseidons-reach',
    regionName: 'Poseidon\'s Reach',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/atlantis-city-detailed.png',
    description: 'Magnificent underwater city with crystal domes and flowing water streets.',
    difficulty: 'Hard',
    elevation: '-200 ft',
    temperature: '70°F to 80°F',
    recommendedLevel: '65+'
  },
  'nereid-harbor': {
    id: 'nereid-harbor',
    name: 'Nereid Harbor',
    regionId: 'poseidons-reach',
    regionName: 'Poseidon\'s Reach',
    landmassId: 'conoco-island',
    landmassName: 'Conoco Island',
    image: '/images/maps/areas/nereid-harbor-detailed.png',
    description: 'Bustling underwater port where sea nymphs guide ships.',
    difficulty: 'Medium',
    elevation: '-50 ft to surface',
    temperature: '65°F to 75°F',
    recommendedLevel: '40+'
  },
  // Archipelago Areas
  'fossil-city': {
    id: 'fossil-city',
    name: 'Fossil City',
    regionId: 'primordial-jungle',
    regionName: 'Primordial Jungle',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/fossil-city-detailed.png',
    description: 'Research city built around massive fossil excavations.',
    difficulty: 'Hard',
    elevation: '800 ft',
    temperature: '75°F to 90°F',
    recommendedLevel: '60+'
  },
  'amber-village': {
    id: 'amber-village',
    name: 'Amber Village',
    regionId: 'primordial-jungle',
    regionName: 'Primordial Jungle',
    landmassId: 'conoocoo-archipelago',
    landmassName: 'Conoocoo Archipelago',
    image: '/images/maps/areas/amber-village-detailed.png',
    description: 'Village built among ancient amber deposits.',
    difficulty: 'Medium',
    elevation: '600 ft',
    temperature: '70°F to 85°F',
    recommendedLevel: '40+'
  }
};

const WorldMapAdmin = () => {
  const [activeTab, setActiveTab] = useState('landmasses');
  const [landmasses, setLandmasses] = useState(LANDMASSES_DATA);
  const [regions, setRegions] = useState(REGIONS_DATA);
  const [areas, setAreas] = useState(AREAS_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: 'landmasses', label: 'Landmasses', icon: 'fas fa-globe' },
    { id: 'regions', label: 'Regions', icon: 'fas fa-map' },
    { id: 'areas', label: 'Areas', icon: 'fas fa-map-marker-alt' }
  ];

  const filteredData = () => {
    let data = [];
    switch (activeTab) {
      case 'landmasses':
        data = Object.values(landmasses);
        break;
      case 'regions':
        data = Object.values(regions);
        break;
      case 'areas':
        data = Object.values(areas);
        break;
      default:
        data = [];
    }

    if (searchTerm) {
      data = data.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      switch (activeTab) {
        case 'landmasses':
          const newLandmasses = { ...landmasses };
          delete newLandmasses[itemId];
          setLandmasses(newLandmasses);
          break;
        case 'regions':
          const newRegions = { ...regions };
          delete newRegions[itemId];
          setRegions(newRegions);
          break;
        case 'areas':
          const newAreas = { ...areas };
          delete newAreas[itemId];
          setAreas(newAreas);
          break;
      }
    }
  };

  const handleSave = () => {
    if (!editingItem) return;

    switch (activeTab) {
      case 'landmasses':
        setLandmasses(prev => ({
          ...prev,
          [editingItem.id]: editingItem
        }));
        break;
      case 'regions':
        setRegions(prev => ({
          ...prev,
          [editingItem.id]: editingItem
        }));
        break;
      case 'areas':
        setAreas(prev => ({
          ...prev,
          [editingItem.id]: editingItem
        }));
        break;
    }
    
    setShowModal(false);
    setEditingItem(null);
  };

  const handleAddNew = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      name: 'New Item',
      description: 'Enter description here...',
      image: '/images/maps/placeholder.png'
    };

    switch (activeTab) {
      case 'landmasses':
        newItem.climate = 'Temperate';
        newItem.dominantTypes = ['Normal'];
        newItem.lore = 'Enter lore here...';
        newItem.regions = [];
        break;
      case 'regions':
        newItem.landmassId = '';
        newItem.landmassName = '';
        newItem.climate = 'Temperate';
        newItem.elevation = '0-100 ft';
        newItem.dominantTypes = ['Normal'];
        newItem.wildlife = 'Various creatures';
        newItem.resources = 'Natural resources';
        newItem.lore = 'Enter lore here...';
        newItem.areas = [];
        break;
      case 'areas':
        newItem.regionId = '';
        newItem.regionName = '';
        newItem.landmassId = '';
        newItem.landmassName = '';
        newItem.difficulty = 'Easy';
        newItem.elevation = '0 ft';
        newItem.temperature = '70°F';
        newItem.weatherPatterns = 'Mild weather';
        newItem.accessibility = 'Open to all';
        newItem.recommendedLevel = '1+';
        newItem.specialFeatures = [];
        newItem.wildlife = [];
        newItem.resources = [];
        newItem.lore = 'Enter lore here...';
        newItem.history = 'Enter history here...';
        newItem.dangers = [];
        newItem.tips = [];
        break;
    }

    setEditingItem(newItem);
    setShowModal(true);
  };

  const renderDataTable = () => {
    const data = filteredData();

    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              {activeTab === 'regions' && <th>Landmass</th>}
              {activeTab === 'areas' && <th>Region</th>}
              {activeTab === 'areas' && <th>Difficulty</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="name-cell">
                  <div className="name-content">
                    <strong>{item.name}</strong>
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="table-thumbnail"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                </td>
                <td className="description-cell">
                  {item.description?.substring(0, 100)}
                  {item.description?.length > 100 ? '...' : ''}
                </td>
                {activeTab === 'regions' && <td>{item.landmassName}</td>}
                {activeTab === 'areas' && <td>{item.regionName}</td>}
                {activeTab === 'areas' && (
                  <td>
                    <span className={`status-badge difficulty-${item.difficulty?.toLowerCase()}`}>
                      {item.difficulty}
                    </span>
                  </td>
                )}
                <td className="actions-cell">
                  <button
                    className="button secondary icon sm"
                    onClick={() => handleEdit(item)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="button danger icon sm"
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="no-data">
            <i className="fas fa-search"></i>
            <p>No items found matching your search.</p>
          </div>
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showModal || !editingItem) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="tree-header">
            <h2>Edit {activeTab.slice(0, -1)}</h2>
            <button 
              className="button close"
              onClick={() => setShowModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={editingItem.id}
                  onChange={(e) => setEditingItem({...editingItem, id: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Image Path</label>
                <input
                  type="text"
                  value={editingItem.image}
                  onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                />
              </div>

              {activeTab === 'landmasses' && (
                <>
                  <div className="form-group">
                    <label>Climate</label>
                    <input
                      type="text"
                      value={editingItem.climate}
                      onChange={(e) => setEditingItem({...editingItem, climate: e.target.value})}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Lore</label>
                    <textarea
                      value={editingItem.lore}
                      onChange={(e) => setEditingItem({...editingItem, lore: e.target.value})}
                      rows="4"
                    />
                  </div>
                </>
              )}

              {activeTab === 'regions' && (
                <>
                  <div className="form-group">
                    <label>Landmass ID</label>
                    <select
                      value={editingItem.landmassId}
                      onChange={(e) => {
                        const landmassId = e.target.value;
                        const landmass = landmasses[landmassId];
                        setEditingItem({
                          ...editingItem, 
                          landmassId,
                          landmassName: landmass ? landmass.name : ''
                        });
                      }}
                    >
                      <option value="">Select Landmass</option>
                      {Object.values(landmasses).map(landmass => (
                        <option key={landmass.id} value={landmass.id}>
                          {landmass.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Climate</label>
                    <input
                      type="text"
                      value={editingItem.climate}
                      onChange={(e) => setEditingItem({...editingItem, climate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Elevation</label>
                    <input
                      type="text"
                      value={editingItem.elevation}
                      onChange={(e) => setEditingItem({...editingItem, elevation: e.target.value})}
                    />
                  </div>
                </>
              )}

              {activeTab === 'areas' && (
                <>
                  <div className="form-group">
                    <label>Region ID</label>
                    <select
                      value={editingItem.regionId}
                      onChange={(e) => {
                        const regionId = e.target.value;
                        const region = regions[regionId];
                        setEditingItem({
                          ...editingItem, 
                          regionId,
                          regionName: region ? region.name : '',
                          landmassId: region ? region.landmassId : '',
                          landmassName: region ? region.landmassName : ''
                        });
                      }}
                    >
                      <option value="">Select Region</option>
                      {Object.values(regions).map(region => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={editingItem.difficulty}
                      onChange={(e) => setEditingItem({...editingItem, difficulty: e.target.value})}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Extreme">Extreme</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Temperature</label>
                    <input
                      type="text"
                      value={editingItem.temperature}
                      onChange={(e) => setEditingItem({...editingItem, temperature: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Recommended Level</label>
                    <input
                      type="text"
                      value={editingItem.recommendedLevel}
                      onChange={(e) => setEditingItem({...editingItem, recommendedLevel: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="world-map-admin">
      <div className="option-row">
        <h1>World Map Administration</h1>
        <p>Manage landmasses, regions, and areas</p>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`button tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-controls">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          className="button primary"
          onClick={handleAddNew}
        >
          <i className="fas fa-plus"></i>
          Add New {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="admin-stats">
        <div className="ref-item">
          <div className="stat-number">{Object.keys(landmasses).length}</div>
          <div className="stat-label">Landmasses</div>
        </div>
        <div className="ref-item">
          <div className="stat-number">{Object.keys(regions).length}</div>
          <div className="stat-label">Regions</div>
        </div>
        <div className="ref-item">
          <div className="stat-number">{Object.keys(areas).length}</div>
          <div className="stat-label">Areas</div>
        </div>
      </div>

      {renderDataTable()}
      {renderEditModal()}
    </div>
  );
};

export default WorldMapAdmin;