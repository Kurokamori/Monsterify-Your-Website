import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const InteractiveMapPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialLocationId = queryParams.get('location');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showLocations, setShowLocations] = useState(true);
  const [showMonsters, setShowMonsters] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchMapData();
  }, []);

  useEffect(() => {
    if (initialLocationId && locations.length > 0) {
      const location = locations.find(loc => loc.id === initialLocationId);
      if (location) {
        setSelectedLocation(location);
        // Center map on the selected location
        setMapPosition({
          x: -location.position.x + window.innerWidth / 2,
          y: -location.position.y + window.innerHeight / 2
        });
      }
    }
  }, [initialLocationId, locations]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      
      // Fetch map data
      const mapResponse = await api.get('/map');
      setMapData(mapResponse.data || null);
      
      // Fetch locations
      const locationsResponse = await api.get('/locations');
      setLocations(locationsResponse.data.locations || []);
      
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Failed to load map data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleMapMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapPosition.x,
      y: e.clientY - mapPosition.y
    });
  };

  const handleMapMouseMove = (e) => {
    if (isDragging) {
      setMapPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setMapPosition({ x: 0, y: 0 });
    setSelectedLocation(null);
  };

  // Fallback data for development
  const fallbackMapData = {
    map_url: 'https://via.placeholder.com/2000/1e2532/d6a339?text=World+Map',
    regions: [
      { id: 'aurora', name: 'Aurora Region', color: '#4f8a8b' },
      { id: 'crystal', name: 'Crystal Mountains', color: '#7b9e89' },
      { id: 'ember', name: 'Ember Islands', color: '#d95d39' },
      { id: 'verdant', name: 'Verdant Valley', color: '#4f9e4f' },
      { id: 'shadow', name: 'Shadow Depths', color: '#564f6f' }
    ]
  };

  const fallbackLocations = [
    {
      id: 'aurora-town',
      name: 'Aurora Town',
      region: 'aurora',
      type: 'town',
      description: 'The main hub for trainers, featuring shops, training facilities, and the Monster Research Lab.',
      position: { x: 1000, y: 800 },
      icon: 'city'
    },
    {
      id: 'crystal-cave',
      name: 'Crystal Cave',
      region: 'crystal',
      type: 'dungeon',
      description: 'A vast network of caves filled with glowing crystals and rare mineral-based monsters.',
      position: { x: 1300, y: 500 },
      icon: 'dungeon'
    },
    {
      id: 'ember-volcano',
      name: 'Ember Volcano',
      region: 'ember',
      type: 'landmark',
      description: 'An active volcano home to powerful fire-type monsters and valuable resources.',
      position: { x: 700, y: 1200 },
      icon: 'landmark'
    },
    {
      id: 'verdant-forest',
      name: 'Verdant Forest',
      region: 'verdant',
      type: 'wild',
      description: 'A lush forest teeming with plant and bug-type monsters, perfect for beginning trainers.',
      position: { x: 900, y: 600 },
      icon: 'forest'
    },
    {
      id: 'shadow-ruins',
      name: 'Shadow Ruins',
      region: 'shadow',
      type: 'ruins',
      description: 'Ancient ruins shrouded in darkness, home to ghost and dark-type monsters.',
      position: { x: 500, y: 900 },
      icon: 'ruins'
    },
    {
      id: 'aurora-lake',
      name: 'Aurora Lake',
      region: 'aurora',
      type: 'landmark',
      description: 'A serene lake near Aurora Town where water-type monsters gather.',
      position: { x: 1100, y: 850 },
      icon: 'water'
    }
  ];

  const displayMapData = mapData || fallbackMapData;
  const displayLocations = locations.length > 0 ? locations : fallbackLocations;
  
  // Filter locations based on selected region
  const filteredLocations = displayLocations.filter(location => {
    return selectedRegion === 'all' || location.region === selectedRegion;
  });

  if (loading) {
    return <LoadingSpinner message="Loading map..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchMapData}
      />
    );
  }

  return (
    <div className="interactive-map-container">
      <div className="map-controls">
        <div className="map-filters">
          <div className="region-filter">
            <label htmlFor="region-select">Region:</label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="region-select"
            >
              <option value="all">All Regions</option>
              {displayMapData.regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="layer-toggles">
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showLocations}
                onChange={() => setShowLocations(!showLocations)}
              />
              <span>Locations</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showMonsters}
                onChange={() => setShowMonsters(!showMonsters)}
              />
              <span>Monsters</span>
            </label>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={showResources}
                onChange={() => setShowResources(!showResources)}
              />
              <span>Resources</span>
            </label>
          </div>
        </div>
        
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomIn}>
            <i className="fas fa-plus"></i>
          </button>
          <button className="zoom-button" onClick={handleZoomOut}>
            <i className="fas fa-minus"></i>
          </button>
          <button className="zoom-button" onClick={handleResetView}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </div>

      <div 
        className="map-container"
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="map"
          style={{
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoomLevel})`,
            backgroundImage: `url(${displayMapData.map_url})`
          }}
        >
          {showLocations && filteredLocations.map(location => (
            <div 
              key={location.id}
              className={`map-marker ${selectedLocation?.id === location.id ? 'selected' : ''}`}
              style={{
                left: `${location.position.x}px`,
                top: `${location.position.y}px`
              }}
              onClick={() => handleLocationClick(location)}
            >
              <div className={`marker-icon ${location.icon}`}>
                <i className={`fas fa-${getIconForLocationType(location.type)}`}></i>
              </div>
              <div className="marker-label">{location.name}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedLocation && (
        <div className="location-info-panel">
          <div className="panel-header">
            <h3>{selectedLocation.name}</h3>
            <button className="button close" onClick={() => setSelectedLocation(null)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="panel-content">
            <div className="location-type-badge">{selectedLocation.type}</div>
            <p className="location-description">{selectedLocation.description}</p>
            
            <div className="location-region-info">
              <i className="fas fa-map-marker-alt"></i>
              <span>{displayMapData.regions.find(r => r.id === selectedLocation.region)?.name || selectedLocation.region}</span>
            </div>
            
            <button className="view-details-button">
              <i className="fas fa-info-circle"></i> View Full Details
            </button>
          </div>
        </div>
      )}

      <div className="map-legend">
        <h4>Map Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-icon city">
              <i className="fas fa-city"></i>
            </div>
            <span>Town/City</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon dungeon">
              <i className="fas fa-dungeon"></i>
            </div>
            <span>Dungeon</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon landmark">
              <i className="fas fa-mountain"></i>
            </div>
            <span>Landmark</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon forest">
              <i className="fas fa-tree"></i>
            </div>
            <span>Forest/Wild</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon ruins">
              <i className="fas fa-landmark"></i>
            </div>
            <span>Ruins</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon water">
              <i className="fas fa-water"></i>
            </div>
            <span>Water Body</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon based on location type
const getIconForLocationType = (type) => {
  switch (type) {
    case 'town':
      return 'city';
    case 'dungeon':
      return 'dungeon';
    case 'landmark':
      return 'mountain';
    case 'wild':
      return 'tree';
    case 'ruins':
      return 'landmark';
    case 'water':
      return 'water';
    default:
      return 'map-marker';
  }
};

export default InteractiveMapPage;
