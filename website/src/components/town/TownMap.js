import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import townService from '../../services/townService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';


const TownMap = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [townLocations, setTownLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  
  // Fetch town locations
  useEffect(() => {
    const fetchTownLocations = async () => {
      try {
        setLoading(true);
        const response = await townService.getTownLocations();
        setTownLocations(response.locations || []);
      } catch (err) {
        console.error('Error fetching town locations:', err);
        setError('Failed to load town locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTownLocations();
  }, []);
  
  // Handle location click
  const handleLocationClick = (location) => {
    setActiveLocation(location);
    setShowLocationInfo(true);
  };
  
  // Handle location visit
  const handleVisitLocation = (locationId) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/town');
      return;
    }
    
    navigate(`/town/${locationId}`);
  };
  
  // Close location info
  const closeLocationInfo = () => {
    setShowLocationInfo(false);
    setActiveLocation(null);
  };
  
  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading town map..." />;
  }
  
  // Render error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Fallback data for development
  const fallbackLocations = [
    {
      id: 'town-square',
      name: 'Town Square',
      description: 'The central hub of Aurora Town where trainers gather.',
      image_path: '/images/town/town-square.jpg',
      position: { x: 50, y: 50 },
      is_locked: false,
      requires_level: 0
    },
    {
      id: 'adoption-center',
      name: 'Adoption Center',
      description: 'Adopt new monsters to join your team.',
      image_path: '/images/town/adoption-center.jpg',
      position: { x: 30, y: 30 },
      is_locked: false,
      requires_level: 0
    },
    {
      id: 'market',
      name: 'Market',
      description: 'Purchase items, accessories, and more.',
      image_path: '/images/town/market.jpg',
      position: { x: 70, y: 30 },
      is_locked: false,
      requires_level: 0
    },
    {
      id: 'garden',
      name: 'Garden',
      description: 'Grow berries and other plants for your monsters.',
      image_path: '/images/town/garden.jpg',
      position: { x: 20, y: 60 },
      is_locked: false,
      requires_level: 5
    },
    {
      id: 'farm',
      name: 'Farm',
      description: 'Complete farm work and breed your monsters.',
      image_path: '/images/town/farm.jpg',
      position: { x: 80, y: 60 },
      is_locked: false,
      requires_level: 10
    },
    {
      id: 'game-corner',
      name: 'Game Corner',
      description: 'Play games and earn rewards with the Pomodoro technique.',
      image_path: '/images/town/game-corner.jpg',
      position: { x: 40, y: 80 },
      is_locked: false,
      requires_level: 0
    },
    {
      id: 'trade-center',
      name: 'Trade Center',
      description: 'Trade monsters and items with other trainers.',
      image_path: '/images/town/trade-center.jpg',
      position: { x: 60, y: 80 },
      is_locked: false,
      requires_level: 15
    },
    {
      id: 'town-hall',
      name: 'Town Hall',
      description: 'Check town events and announcements.',
      image_path: '/images/town/town-hall.jpg',
      position: { x: 50, y: 20 },
      is_locked: false,
      requires_level: 0
    },
    {
      id: 'pirates-dock',
      name: "Pirate's Dock",
      description: 'Embark on pirate adventures and go fishing.',
      image_path: '/images/town/pirates-dock.jpg',
      position: { x: 90, y: 40 },
      is_locked: true,
      requires_level: 20
    }
  ];
  
  const displayLocations = townLocations.length > 0 ? townLocations : fallbackLocations;
  
  return (
    <div className="town-map-container">
      <div className="town-map">
        <div className="map-background">
          <img 
            src="/images/town/town-map-bg.jpg" 
            alt="Aurora Town Map" 
            className="map-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/1200x800/1e2532/d6a339?text=Aurora+Town+Map';
            }}
          />
          
          {displayLocations.map(location => (
            <div
              key={location.id}
              className={`map-location ${location.is_locked ? 'locked' : ''}`}
              style={{
                left: `${location.position.x}%`,
                top: `${location.position.y}%`
              }}
              onClick={() => handleLocationClick(location)}
            >
              <div className="location-icon">
                {location.is_locked ? (
                  <i className="fas fa-lock"></i>
                ) : (
                  <i className={getLocationIcon(location.id)}></i>
                )}
              </div>
              <div className="location-name">{location.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {showLocationInfo && activeLocation && (
        <div className="location-info-overlay">
          <div className="location-info-container">
            <button className="button close" onClick={closeLocationInfo}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="location-info-header">
              <h2>{activeLocation.name}</h2>
              {activeLocation.is_locked && (
                <div className="location-locked-badge">
                  <i className="fas fa-lock"></i> Locked
                </div>
              )}
            </div>
            
            <div className="location-info-content">
              <div className="location-image-container">
                <img
                  src={activeLocation.image_path}
                  alt={activeLocation.name}
                  className="location-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/400x300/1e2532/d6a339?text=${activeLocation.name}`;
                  }}
                />
              </div>
              
              <div className="location-details">
                <p className="town-location-description">{activeLocation.description}</p>
                
                {activeLocation.is_locked ? (
                  <div className="location-requirements">
                    <h3>Requirements to Unlock:</h3>
                    <p>
                      <i className="fas fa-star"></i> Trainer Level {activeLocation.requires_level}
                    </p>
                  </div>
                ) : (
                  <button
                    className="button primary"
                    onClick={() => handleVisitLocation(activeLocation.id)}
                  >
                    <i className="fas fa-walking"></i> Visit Location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get location icon
const getLocationIcon = (locationId) => {
  switch (locationId) {
    case 'town-square':
      return 'fas fa-monument';
    case 'adoption-center':
      return 'fas fa-home';
    case 'market':
      return 'fas fa-store';
    case 'garden':
      return 'fas fa-seedling';
    case 'farm':
      return 'fas fa-tractor';
    case 'game-corner':
      return 'fas fa-dice';
    case 'trade-center':
      return 'fas fa-exchange-alt';
    case 'town-hall':
      return 'fas fa-landmark';
    case 'pirates-dock':
      return 'fas fa-anchor';
    default:
      return 'fas fa-map-marker-alt';
  }
};

export default TownMap;
