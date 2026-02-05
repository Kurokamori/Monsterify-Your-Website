import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import GardenHarvestComponent from '../../../components/town/GardenHarvest';

const GardenHarvestPage = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="location-activity-container">
        <div className="location-activity-header">
          <Link to="/town" className="btn btn-secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Garden Harvest</h1>
        </div>
        <div className="auth-message">
          <p>Please log in to access the garden harvest.</p>
          <Link to="/login" className="btn btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="location-activity-container">
      <div className="location-activity-header">
        <Link to="/town/activities/garden" className="btn btn-secondary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Garden
        </Link>
        <h1>Garden Harvest</h1>
      </div>

      <div className="location-activity-content">
        <GardenHarvestComponent />
      </div>
    </div>
  );
};

export default GardenHarvestPage;
