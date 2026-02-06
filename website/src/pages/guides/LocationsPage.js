import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const LocationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch locations
      const locationsResponse = await api.get('/locations');
      setLocations(locationsResponse.data.locations || []);
      
      // Fetch regions
      const regionsResponse = await api.get('/locations/regions');
      setRegions(regionsResponse.data.regions || []);
      
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter locations based on selected region and search query
  const filteredLocations = locations.filter(location => {
    const regionMatch = selectedRegion === 'all' || location.region === selectedRegion;
    const searchMatch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        location.description.toLowerCase().includes(searchQuery.toLowerCase());
    return regionMatch && searchMatch;
  });

  // Fallback data for development
  const fallbackRegions = [
    { id: 'aurora', name: 'Aurora Region' },
    { id: 'crystal', name: 'Crystal Mountains' },
    { id: 'ember', name: 'Ember Islands' },
    { id: 'verdant', name: 'Verdant Valley' },
    { id: 'shadow', name: 'Shadow Depths' }
  ];

  const fallbackLocations = [
    {
      id: 'aurora-town',
      name: 'Aurora Town',
      region: 'aurora',
      type: 'town',
      description: 'The main hub for trainers, featuring shops, training facilities, and the Monster Research Lab.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Aurora+Town',
      points_of_interest: ['Monster Research Lab', 'Town Square', 'Training Grounds'],
      monsters: ['Common', 'Normal-type']
    },
    {
      id: 'crystal-cave',
      name: 'Crystal Cave',
      region: 'crystal',
      type: 'dungeon',
      description: 'A vast network of caves filled with glowing crystals and rare mineral-based monsters.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Crystal+Cave',
      points_of_interest: ['Crystal Lake', 'Mineral Deposits', 'Ancient Ruins'],
      monsters: ['Rock-type', 'Crystal-type', 'Rare']
    },
    {
      id: 'ember-volcano',
      name: 'Ember Volcano',
      region: 'ember',
      type: 'landmark',
      description: 'An active volcano home to powerful fire-type monsters and valuable resources.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Ember+Volcano',
      points_of_interest: ['Lava Lake', 'Fire Temple', 'Hot Springs'],
      monsters: ['Fire-type', 'Rock-type', 'Uncommon']
    },
    {
      id: 'verdant-forest',
      name: 'Verdant Forest',
      region: 'verdant',
      type: 'wild',
      description: 'A lush forest teeming with plant and bug-type monsters, perfect for beginning trainers.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Verdant+Forest',
      points_of_interest: ['Ancient Tree', 'Flower Meadow', 'Bug Haven'],
      monsters: ['Grass-type', 'Bug-type', 'Common']
    },
    {
      id: 'shadow-ruins',
      name: 'Shadow Ruins',
      region: 'shadow',
      type: 'ruins',
      description: 'Ancient ruins shrouded in darkness, home to ghost and dark-type monsters.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Shadow+Ruins',
      points_of_interest: ['Abandoned Temple', 'Crypt', 'Spirit Well'],
      monsters: ['Ghost-type', 'Dark-type', 'Rare']
    },
    {
      id: 'aurora-lake',
      name: 'Aurora Lake',
      region: 'aurora',
      type: 'landmark',
      description: 'A serene lake near Aurora Town where water-type monsters gather.',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Aurora+Lake',
      points_of_interest: ['Fishing Spot', 'Lakeside Shrine', 'Water Monster Sanctuary'],
      monsters: ['Water-type', 'Common']
    }
  ];

  const displayRegions = regions.length > 0 ? regions : fallbackRegions;
  const displayLocations = locations.length > 0 ? filteredLocations : fallbackLocations.filter(location => {
    const regionMatch = selectedRegion === 'all' || location.region === selectedRegion;
    const searchMatch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        location.description.toLowerCase().includes(searchQuery.toLowerCase());
    return regionMatch && searchMatch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading locations..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchLocations}
      />
    );
  }

  return (
    <div className="locations-container">
      <div className="locations-header">
        <h1>World Locations</h1>
        <p>Explore the various regions and locations in the Monsterify world</p>
      </div>

      <div className="locations-search-filter">
        <div className="locations-search">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="button primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        <div className="locations-filter">
          <label htmlFor="region-filter">Filter by Region:</label>
          <select
            id="region-filter"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-select"
          >
            <option value="all">All Regions</option>
            {displayRegions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="locations-grid">
        {displayLocations.map(location => (
          <div className="location-card" key={location.id}>
            <div className="location-image">
              <img
                src={location.image_url}
                alt={location.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_location.png';
                }}
              />
              <div className="location-type">{location.type}</div>
            </div>
            <div className="location-content">
              <h3 className="location-name">{location.name}</h3>
              <div className="location-region">
                <i className="fas fa-map-marker-alt"></i> {displayRegions.find(r => r.id === location.region)?.name || location.region}
              </div>
              <p className="town-location-description">{location.description}</p>
              
              <div className="location-details">
                <div className="location-section">
                  <h4>Points of Interest</h4>
                  <ul className="location-list">
                    {location.points_of_interest.map((poi, index) => (
                      <li key={index}>{poi}</li>
                    ))}
                  </ul>
                </div>
                <div className="location-section">
                  <h4>Monsters Found</h4>
                  <ul className="location-list">
                    {location.monsters.map((monster, index) => (
                      <li key={index}>{monster}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Link to={`/interactive_map?location=${location.id}`} className="button primary outline">
                <i className="fas fa-map"></i> View on Map
              </Link>
            </div>
          </div>
        ))}
      </div>

      {displayLocations.length === 0 && (
        <div className="no-locations">
          <i className="fas fa-map-marked-alt"></i>
          <p>No locations found matching your search criteria.</p>
          <button 
            className="button secondary"
            onClick={() => {
              setSelectedRegion('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
