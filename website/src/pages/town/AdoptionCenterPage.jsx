import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdoptionCenter from '../../components/town/AdoptionCenter';
import TownPage from './TownPage';

/**
 * Page component for the Adoption Center
 * @returns {JSX.Element} - Rendered component
 */
const AdoptionCenterPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <div className="location-container">
      <div className="location-header">
        <div className="location-icon-large">
          <i className="fas fa-home"></i>
        </div>
        <div className="location-title">
          <h2>Adoption Center</h2>
          <p>Find a new monster to join your team</p>
        </div>
      </div>

      <AdoptionCenter />
    </div>
  );
};

// Wrap the AdoptionCenterPage with the TownPage layout
const AdoptionCenterWithLayout = () => {
  return (
    <TownPage currentLocation="adoption">
      <AdoptionCenterPage />
    </TownPage>
  );
};

export default AdoptionCenterWithLayout;
