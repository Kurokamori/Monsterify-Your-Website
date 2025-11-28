import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Apothecary from '../../components/town/Apothecary';
import TownPage from './TownPage';

/**
 * Page component for the Apothecary
 * @returns {JSX.Element} - Rendered component
 */
const ApothecaryPage = () => {
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
          <i className="fas fa-mortar-pestle"></i>
        </div>
        <div className="location-title">
          <h2>Apothecary</h2>
          <p>Use berries to modify your monsters' species, types, and attributes</p>
        </div>
      </div>
      
      <Apothecary />
    </div>
  );
};

// Wrap the ApothecaryPage with the TownPage layout
const ApothecaryWithLayout = () => {
  return (
    <TownPage currentLocation="apothecary">
      <ApothecaryPage />
    </TownPage>
  );
};

export default ApothecaryWithLayout;
