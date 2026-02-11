import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import WitchsHut from '../../../components/town/WitchsHut';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';


/**
 * WitchsHut page component
 * @returns {JSX.Element} - Rendered component
 */
const WitchsHutPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="witchs-hut-page loading">
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="witchs-hut-page error">
        <ErrorMessage message="You must be logged in to access the Witch's Hut." />
        <div className="auth-actions">
          <Link to="/login" className="button primary">Login</Link>
          <Link to="/register" className="button secondary">Register</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="witchs-hut-page">
      <div className="lore-header">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
        <h1>Witch's Hut</h1>
      </div>
      
      <div className="page-content">
        <WitchsHut />
      </div>
    </div>
  );
};

export default WitchsHutPage;
