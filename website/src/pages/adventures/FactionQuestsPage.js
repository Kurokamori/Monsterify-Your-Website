import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TrainerSelector from '../../components/common/TrainerSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import FactionDetailPage from './FactionDetailPage';
import api from '../../services/api';


const FactionQuestsPage = () => {
  return (
    <Routes>
      <Route index element={<FactionQuestsMain />} />
      <Route path=":factionId" element={<FactionDetailPage />} />
    </Routes>
  );
};

const FactionQuestsMain = () => {
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        setUserTrainers(response.data.data || []);
        
        // Auto-select first trainer if available
        if (response.data.data && response.data.data.length > 0) {
          setSelectedTrainer(response.data.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to load trainers');
      }
    };

    fetchUserTrainers();
  }, [currentUser]);

  // Fetch factions
  useEffect(() => {
    const fetchFactions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/factions');
        setFactions(response.data.factions || []);
      } catch (err) {
        console.error('Error fetching factions:', err);
        setError('Failed to load factions');
      } finally {
        setLoading(false);
      }
    };

    fetchFactions();
  }, []);

  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  const handleFactionClick = (factionId) => {
    if (!selectedTrainer) {
      setError('Please select a trainer first');
      return;
    }
    navigate(`/adventures/faction-quests/${factionId}?trainerId=${selectedTrainer}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading factions..." />;
  }

  return (
    <div className="faction-detail-container">
      <div className="faction-quests-header">
        <h1>Faction Quests</h1>
        <p>Choose your allegiances and build your reputation with the various factions across the archipelago</p>
      </div>

      <div align="center">
        <TrainerSelector
          trainers={userTrainers}
          selectedTrainerId={selectedTrainer}
          onChange={handleTrainerChange}
        />
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {!selectedTrainer && (
        <div className="no-trainer-selected">
          <p>Please select a trainer to view faction standings and quests.</p>
        </div>
      )}

      {selectedTrainer && (
        <div className="factions-grid">
          {factions.map((faction) => (
            <div
              key={faction.id}
              className="faction-prism"
              onClick={() => handleFactionClick(faction.id)}
              style={{ '--faction-color': faction.color }}
            >
              <div
                className="faction-card-background"
                style={{
                  backgroundImage: `url(/images/factions/${faction.banner_image || faction.icon_image})`
                }}
              ></div>
              <div className="faction-card-content">
                <div className="faction-card-icon">
                  <div className="faction-icon">
                    <img
                      src={`/images/factions/${faction.icon_image}`}
                      alt={faction.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="faction-icon-placeholder" style={{ display: 'none' }}>
                      {faction.name.charAt(0)}
                    </div>
                  </div>
                </div>
                <div className="faction-content">
                  <h3 className="faction-name">{faction.name}</h3>
                  <p className="faction-description-preview">
                    {faction.description || 'Explore the mysteries and challenges of this faction...'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="faction-quests-info">
        <div className="faction-info">
          <h3>About Faction Quests</h3>
          <p>
            Build relationships with the various factions across the archipelago. Each faction offers unique rewards,
            titles, and store items based on your standing with them. Be careful though - gaining favor with one
            faction may affect your standing with their rivals!
          </p>
        </div>
        
        <div className="faction-info">
          <h3>Standing System</h3>
          <ul>
            <li>Standing ranges from -1000 (Nemesis) to +1000 (Champion)</li>
            <li>Earn titles by reaching standing thresholds and completing tributes</li>
            <li>Higher standing unlocks better items in faction stores</li>
            <li>Faction relationships affect each other - allies boost each other, enemies detract</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FactionQuestsPage;
