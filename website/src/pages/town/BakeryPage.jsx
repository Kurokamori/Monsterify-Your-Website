import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Bakery from '../../components/town/Bakery';
import TownPage from './TownPage';

/**
 * Page component for the Bakery
 * @returns {JSX.Element} - Rendered component
 */
const BakeryPage = () => {
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
          <i className="fas fa-cookie"></i>
        </div>
        <div className="no-adventures">
          <h2>Bakery</h2>
          <p>Use pastries to precisely modify your monsters' species, types, and attributes</p>
        </div>
      </div>
      
      <Bakery />
    </div>
  );
};

// Wrap the BakeryPage with the TownPage layout
const BakeryWithLayout = () => {
  return (
    <TownPage currentLocation="bakery">
      <BakeryPage />
    </TownPage>
  );
};

export default BakeryWithLayout;
