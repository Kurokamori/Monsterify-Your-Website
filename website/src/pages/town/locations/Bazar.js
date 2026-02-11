import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import bazarService from '../../../services/bazarService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import ForfeitMonster from '../../../components/bazar/ForfeitMonster';
import ForfeitItem from '../../../components/bazar/ForfeitItem';
import AdoptMonster from '../../../components/bazar/AdoptMonster';
import CollectItem from '../../../components/bazar/CollectItem';


const Bazar = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('forfeit-monster');
  const [userTrainers, setUserTrainers] = useState([]);

  // Fetch user trainers on component mount
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);
        const response = await bazarService.getUserTrainers();
        if (response.success) {
          setUserTrainers(response.trainers);
        } else {
          setError(response.message || 'Failed to fetch trainers');
        }
      } catch (error) {
        console.error('Error fetching user trainers:', error);
        setError('Failed to fetch trainers');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bazar-container">
        <div className="bazar-header">
          <h1>Bazzar</h1>
          <p>Please log in to access the Bazzar.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bazar-container">
        <div className="bazar-header">
          <h1>Bazzar</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bazar-container">
      <div className="bazar-header">
        <h1>Bazzar</h1>
        <p>Forfeit monsters and items for others to adopt, or adopt monsters and collect items from other trainers.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="bazar-tabs">
        <button
          className={`button tab ${activeTab === 'forfeit-monster' ? 'active' : ''}`}
          onClick={() => setActiveTab('forfeit-monster')}
        >
          Forfeit Monster
        </button>
        <button
          className={`button tab ${activeTab === 'forfeit-item' ? 'active' : ''}`}
          onClick={() => setActiveTab('forfeit-item')}
        >
          Forfeit Item
        </button>
        <button
          className={`button tab ${activeTab === 'adopt-monster' ? 'active' : ''}`}
          onClick={() => setActiveTab('adopt-monster')}
        >
          Adopt Monster
        </button>
        <button
          className={`button tab ${activeTab === 'collect-item' ? 'active' : ''}`}
          onClick={() => setActiveTab('collect-item')}
        >
          Collect Items
        </button>
      </div>

      <div className="bazar-content">
        {activeTab === 'forfeit-monster' && (
          <ForfeitMonster userTrainers={userTrainers} />
        )}
        {activeTab === 'forfeit-item' && (
          <ForfeitItem userTrainers={userTrainers} />
        )}
        {activeTab === 'adopt-monster' && (
          <AdoptMonster userTrainers={userTrainers} />
        )}
        {activeTab === 'collect-item' && (
          <CollectItem userTrainers={userTrainers} />
        )}
      </div>
    </div>
  );
};

export default Bazar;
