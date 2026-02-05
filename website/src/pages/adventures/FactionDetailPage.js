import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import FactionStandingDisplay from '../../components/factions/FactionStandingDisplay';
import FactionStore from '../../components/factions/FactionStore';
import TributeSubmissionModal from '../../components/factions/TributeSubmissionModal';
import FactionSubmissionModal from '../../components/factions/FactionSubmissionModal';
import KnownPeople from '../../components/factions/KnownPeople';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';


const FactionDetailPage = () => {
  const { factionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [faction, setFaction] = useState(null);
  const [allFactions, setAllFactions] = useState([]);
  const [standing, setStanding] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set document title based on faction name
  useDocumentTitle(faction ? faction.name : 'Faction');
  const [activeTab, setActiveTab] = useState('overview');
  const [showTributeModal, setShowTributeModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Get trainer ID from URL params or use first available trainer
  useEffect(() => {
    const trainerId = searchParams.get('trainerId');
    if (trainerId) {
      setSelectedTrainer(parseInt(trainerId));
    }
  }, [searchParams]);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = response.data.data || [];
        setUserTrainers(trainers);
        
        // If no trainer selected, use first available
        if (!selectedTrainer && trainers.length > 0) {
          setSelectedTrainer(trainers[0].id);
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to load trainers');
      }
    };

    fetchUserTrainers();
  }, [currentUser, selectedTrainer]);

  // Fetch all factions and current faction details
  useEffect(() => {
    const fetchFactions = async () => {
      try {
        setLoading(true);

        // Fetch all factions for navigation
        const allFactionsResponse = await api.get('/factions');
        const factions = allFactionsResponse.data.factions || [];
        setAllFactions(factions);

        // Fetch specific faction details
        const factionResponse = await api.get(`/factions/${factionId}`);
        setFaction(factionResponse.data.faction);
      } catch (err) {
        console.error('Error fetching faction:', err);
        setError('Failed to load faction details');
      } finally {
        setLoading(false);
      }
    };

    if (factionId) {
      fetchFactions();
    }
  }, [factionId]);

  // Fetch trainer's standing with this faction
  useEffect(() => {
    const fetchStanding = async () => {
      if (!selectedTrainer || !factionId) return;

      try {
        const response = await api.get(`/factions/trainers/${selectedTrainer}/${factionId}/standing`);
        setStanding(response.data.standing);
      } catch (err) {
        console.error('Error fetching standing:', err);
        // Don't set error here as standing might not exist yet
      }
    };

    fetchStanding();
  }, [selectedTrainer, factionId]);

  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
    // Update URL with new trainer ID
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('trainerId', trainerId);
    navigate(`/adventures/faction-quests/${factionId}?${newSearchParams.toString()}`, { replace: true });
  };

  const navigateToFaction = (direction) => {
    if (!allFactions.length || !faction) return;

    const currentIndex = allFactions.findIndex(f => f.id === faction.id);
    let nextIndex;

    if (direction === 'left') {
      nextIndex = currentIndex === 0 ? allFactions.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === allFactions.length - 1 ? 0 : currentIndex + 1;
    }

    const nextFaction = allFactions[nextIndex];
    if (nextFaction) {
      const newSearchParams = new URLSearchParams(searchParams);
      navigate(`/adventures/faction-quests/${nextFaction.id}?${newSearchParams.toString()}`);
    }
  };

  const handleSubmissionClick = (type) => {
    if (type === 'tribute') {
      setShowTributeModal(true);
    } else if (type === 'submission') {
      setShowSubmissionModal(true);
    } else {
      alert(`${type} submission coming soon!`);
    }
  };

  const handleSubmissionComplete = (result) => {
    setShowSubmissionModal(false);
    refreshStanding();
  };

  const refreshStanding = async () => {
    if (!selectedTrainer || !factionId) return;
    try {
      const response = await api.get(`/factions/trainers/${selectedTrainer}/${factionId}/standing`);
      setStanding(response.data.standing);
    } catch (err) {
      console.error('Error refreshing standing:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading faction details..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!faction) {
    return (
      <div className="faction-not-found">
        <h2>Faction not found</h2>
        <button onClick={() => navigate('/adventures/faction-quests')}>
          Return to Faction Quests
        </button>
      </div>
    );
  }

  return (
    <div className="faction-detail-container">
      {/* Faction Banner */}
      <div 
        className="faction-banner"
        style={{ 
          backgroundImage: `url(/images/factions/${faction.banner_image})`,
          borderColor: faction.color 
        }}
      >
        <div className="banner-overlay">
          <div className="faction-navigation">
            <button 
              className="nav-button nav-left"
              onClick={() => navigateToFaction('left')}
              title="Previous Faction"
            >
              ‹
            </button>
            <h1 className="faction-title" style={{ color: faction.color }}>
              {faction.name}
            </h1>
            <button 
              className="nav-button nav-right"
              onClick={() => navigateToFaction('right')}
              title="Next Faction"
            >
              ›
            </button>
          </div>
          <p className="faction-description">{faction.description}</p>
        </div>
      </div>

      {/* Trainer Selection */}
      <div className="trainer-selection-section">
        <label htmlFor="trainer-select">Viewing as:</label>
        <select
          id="trainer-select"
          value={selectedTrainer || ''}
          onChange={(e) => handleTrainerChange(parseInt(e.target.value))}
          className="trainer-select"
        >
          <option value="" disabled>Select a trainer</option>
          {userTrainers.map(trainer => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTrainer && (
        <>
          {/* Standing Display */}
          <FactionStandingDisplay 
            standing={standing}
            faction={faction}
            trainerId={selectedTrainer}
          />

          {/* Action Tabs */}
          <div className="faction-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'store' ? 'active' : ''}`}
              onClick={() => setActiveTab('store')}
            >
              Faction Store
            </button>
            <button
              className={`tab-button ${activeTab === 'individuals' ? 'active' : ''}`}
              onClick={() => setActiveTab('individuals')}
            >
              Known Individuals
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="overview-content">
                <div className="action-buttons">
                  <button
                    className="button button-primary submission-button"
                    onClick={() => handleSubmissionClick('submission')}
                  >
                    Make Submission
                  </button>
                  <button
                    className="button button-primary tribute-button"
                    onClick={() => handleSubmissionClick('tribute')}
                  >
                    Make Tribute
                  </button>
                </div>
                
                <div className="faction-info">
                  <h3>About {faction.name}</h3>
                  <p>{faction.description}</p>
                  
                  {faction.relationships && faction.relationships.length > 0 && (
                    <div className="relationships-section">
                      <h4>Faction Relationships</h4>
                      <div className="relationships-grid">
                        {faction.relationships.map(rel => (
                          <div key={rel.related_faction_id} className={`relationship-item ${rel.relationship_type}`}>
                            <span className="relationship-faction">{rel.related_faction_name}</span>
                            <span className="relationship-type">{rel.relationship_type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'store' && (
              <FactionStore 
                factionId={factionId}
                trainerId={selectedTrainer}
                faction={faction}
              />
            )}

            {activeTab === 'individuals' && (
              <KnownPeople 
                faction={faction}
                trainerId={selectedTrainer}
                standing={standing}
                onStandingChange={refreshStanding}
              />
            )}
          </div>
        </>
      )}

      {/* Tribute Submission Modal */}
      {showTributeModal && (
        <TributeSubmissionModal
          faction={faction}
          trainerId={selectedTrainer}
          standing={standing}
          onClose={() => setShowTributeModal(false)}
          onSubmit={() => {
            setShowTributeModal(false);
            // Refresh standing after tribute submission
            window.location.reload();
          }}
        />
      )}

      {/* Faction Submission Modal */}
      {showSubmissionModal && (
        <FactionSubmissionModal
          faction={faction}
          trainerId={selectedTrainer}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={handleSubmissionComplete}
        />
      )}
    </div>
  );
};

export default FactionDetailPage;
