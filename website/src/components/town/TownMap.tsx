import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface TownMapProps {
  className?: string;
}

interface TownLocation {
  id: string;
  name: string;
  description: string;
  image_path: string;
  position: { x: number; y: number };
  is_locked: boolean;
  requires_level: number;
}

/** Get icon for a location based on its ID */
const getLocationIcon = (locationId: string): string => {
  switch (locationId) {
    case 'town-square': return 'fas fa-monument';
    case 'adoption-center': return 'fas fa-home';
    case 'market': return 'fas fa-store';
    case 'garden': return 'fas fa-seedling';
    case 'farm': return 'fas fa-tractor';
    case 'game-corner': return 'fas fa-dice';
    case 'trade-center': return 'fas fa-exchange-alt';
    case 'town-hall': return 'fas fa-landmark';
    case 'pirates-dock': return 'fas fa-anchor';
    case 'apothecary': return 'fas fa-flask';
    case 'bakery': return 'fas fa-bread-slice';
    case 'antique-shop': return 'fas fa-gem';
    default: return 'fas fa-map-marker-alt';
  }
};

/**
 * TownMap component for displaying the interactive town map
 * Shows all town locations with their status and allows navigation
 */
export function TownMap({ className = '' }: TownMapProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [townLocations, setTownLocations] = useState<TownLocation[]>([]);
  const [activeLocation, setActiveLocation] = useState<TownLocation | null>(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  // Fetch town locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/town/locations');
        setTownLocations(response.data.locations || []);
      } catch (err) {
        console.error('Error fetching town locations:', err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to load town locations.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Handle location click
  const handleLocationClick = useCallback((location: TownLocation) => {
    setActiveLocation(location);
    setShowLocationInfo(true);
  }, []);

  // Handle visit location
  const handleVisitLocation = useCallback((locationId: string) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/town');
      return;
    }
    navigate(`/town/${locationId}`);
  }, [isAuthenticated, navigate]);

  // Close location info
  const closeLocationInfo = useCallback(() => {
    setShowLocationInfo(false);
    setActiveLocation(null);
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="state-container state-container--centered">
        <LoadingSpinner />
        <p className="spinner-message">Loading town map...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={`town-map-container ${className}`.trim()}>
      <div className="town-map">
        <div className="map-background">
          <img
            src="/images/town/town-map-bg.jpg"
            alt="Heimdal City Map"
            className="map-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800/1e2532/d6a339?text=Aurora+Town+Map';
            }}
          />

          {townLocations.map(location => (
            <button
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
            </button>
          ))}
        </div>
      </div>

      {/* Location Info Modal */}
      <Modal
        isOpen={showLocationInfo}
        onClose={closeLocationInfo}
        title={activeLocation?.name || 'Location'}
        size="medium"
      >
        {activeLocation && (
          <div className="location-info">
            <div className="location-image-container">
              <img
                src={activeLocation.image_path}
                alt={activeLocation.name}
                className="location-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/1e2532/d6a339?text=${encodeURIComponent(activeLocation.name)}`;
                }}
              />
              {activeLocation.is_locked && (
                <div className="location-locked-overlay">
                  <i className="fas fa-lock"></i>
                  <span>Locked</span>
                </div>
              )}
            </div>

            <p className="location-description">{activeLocation.description}</p>

            {activeLocation.is_locked ? (
              <div className="location-requirements">
                <h4>Requirements to Unlock:</h4>
                <div className="location-requirement-item">
                  <i className="fas fa-star"></i>
                  <span>Trainer Level {activeLocation.requires_level}</span>
                </div>
              </div>
            ) : (
              <div className="action-button-group action-button-group--align-center action-button-group--gap-md">
                <button
                  className="button primary no-flex"
                  onClick={() => handleVisitLocation(activeLocation.id)}
                >
                  <i className="fas fa-walking"></i> Visit Location
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TownMap;
