import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdventureRewards from '../../components/adventures/AdventureRewards';
import { Navigate } from 'react-router-dom';

const AdventureRewardsPage = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="error-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="main-content-container">
      <AdventureRewards />
    </div>
  );
};

export default AdventureRewardsPage;
