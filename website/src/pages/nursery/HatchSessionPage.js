import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import MonsterCard from '../../components/monsters/MonsterCard';
import api from '../../services/api';
import { toast } from 'react-toastify';

const HatchSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [currentEgg, setCurrentEgg] = useState(0);
  const [selectedMonsters, setSelectedMonsters] = useState({});
  const [monsterNames, setMonsterNames] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/nursery/session/${sessionId}`);

      if (response.data.success) {
        setSession(response.data.session);

        // Initialize selected monsters and names
        const initialSelected = {};
        const initialNames = {};

        response.data.session.hatchedEggs.forEach(egg => {
          if (response.data.session.selectedMonsters[egg.eggId]) {
            initialSelected[egg.eggId] = response.data.session.selectedMonsters[egg.eggId].monsterIndex;
            initialNames[egg.eggId] = response.data.session.selectedMonsters[egg.eggId].monsterName;
          }
        });

        setSelectedMonsters(initialSelected);
        setMonsterNames(initialNames);
      } else {
        setError(response.data.message || 'Failed to load hatch session');
      }
    } catch (err) {
      console.error('Error fetching hatch session:', err);
      setError('Failed to load hatch session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonsterSelect = (eggId, monsterIndex) => {
    setSelectedMonsters(prev => ({
      ...prev,
      [eggId]: monsterIndex
    }));
  };

  const handleNameChange = (eggId, name) => {
    setMonsterNames(prev => ({
      ...prev,
      [eggId]: name
    }));
  };

  const handleClaimWithEdenwiess = async (eggId) => {
    const monsterIndex = selectedMonsters[eggId];
    const monsterName = monsterNames[eggId];

    if (monsterIndex === undefined) {
      toast.error('Please select a monster first');
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post('/nursery/select', {
        sessionId,
        eggId,
        monsterIndex,
        monsterName: monsterName || `Hatched Monster ${eggId}`,
        dnaSplicers: 0,
        useEdenwiess: true
      });

      if (response.data.success) {
        toast.success('Extra monster claimed with Edenwiess!');

        // Update session data with new claimed monsters and special berries
        setSession(prev => ({
          ...prev,
          claimedMonsters: response.data.session.claimedMonsters || prev.claimedMonsters,
          specialBerries: response.data.specialBerries || prev.specialBerries
        }));

        // Reset the monster selection for this egg to allow selecting another
        setSelectedMonsters(prev => ({
          ...prev,
          [eggId]: undefined
        }));

        // Clear the name input
        setMonsterNames(prev => ({
          ...prev,
          [eggId]: ''
        }));
      }
    } catch (err) {
      console.error('Error claiming monster with Edenwiess:', err);
      toast.error(err.response?.data?.message || 'Failed to claim monster');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMonster = async (eggId) => {
    const monsterIndex = selectedMonsters[eggId];
    const monsterName = monsterNames[eggId];

    if (monsterIndex === undefined) {
      toast.error('Please select a monster first');
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post('/nursery/select', {
        sessionId,
        eggId,
        monsterIndex,
        monsterName: monsterName || `Hatched Monster ${eggId}`,
        dnaSplicers: 0,
        useEdenwiess: false
      });

      if (response.data.success) {
        toast.success('Monster selected successfully!');

        // Update session data
        setSession(prev => ({
          ...prev,
          selectedMonsters: {
            ...prev.selectedMonsters,
            [eggId]: {
              monsterIndex,
              monsterId: response.data.monster.id,
              monsterName: response.data.monster.name,
              selectedAt: new Date().toISOString()
            }
          }
        }));

        // Move to next egg or finish
        const nextEgg = session.hatchedEggs.findIndex(egg =>
          egg.eggId > eggId && !session.selectedMonsters[egg.eggId]
        );

        if (nextEgg !== -1) {
          setCurrentEgg(nextEgg);
        } else {
          // All eggs processed, show completion
          toast.success('All eggs hatched successfully!');
          setTimeout(() => {
            navigate('/town/nursery');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error selecting monster:', err);
      toast.error(err.response?.data?.message || 'Failed to select monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle rerolling current egg with forget-me-not berry
  const handleRerollEgg = async () => {
    try {
      setSubmitting(true);

      const response = await api.post('/nursery/reroll', {
        sessionId
      });

      if (response.data.success) {
        toast.success('Egg rerolled with Forget-Me-Not!');
        // Reset selections for current egg
        setSelectedMonsters(prev => ({
          ...prev,
          [currentEggData.eggId]: undefined
        }));
        setMonsterNames(prev => ({
          ...prev,
          [currentEggData.eggId]: ''
        }));
        // Update session with new data
        setSession(response.data.session || session);
        await fetchSession(); // Refresh session data
      } else {
        toast.error(response.data.message || 'Failed to reroll egg');
      }
    } catch (err) {
      console.error('Error rerolling egg:', err);
      toast.error('Failed to reroll egg. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrdinal = (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  if (loading) {
    return <LoadingSpinner message="Loading hatch session..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchSession}
      />
    );
  }

  if (!session || !session.hatchedEggs) {
    return <ErrorMessage message="Invalid hatch session" />;
  }

  const currentEggData = session.hatchedEggs[currentEgg];
  const isEggSelected = session.selectedMonsters[currentEggData?.eggId];
  const allEggsSelected = session.hatchedEggs.every(egg =>
    session.selectedMonsters[egg.eggId]
  );

  // Check if current egg has any claimed monsters (for Edenwiess functionality)
  const currentEggClaims = session.claimedMonsters ?
    session.claimedMonsters.filter(claim => claim.startsWith(`${currentEggData?.eggId}-`)).length : 0;

  // Check which monsters from current egg have been claimed with Edenwiess
  const claimedMonsterIndices = session.claimedMonsters ?
    session.claimedMonsters
      .filter(claim => claim.startsWith(`${currentEggData?.eggId}-`))
      .map(claim => parseInt(claim.split('-')[1]))
    : [];

  if (allEggsSelected) {
    return (
      <div className="hatch-session-modern-container">
        <div className="hatch-complete-modern">
          <div className="success-celebration">
            <div className="success-icon-large">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="confetti-animation">
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
            </div>
          </div>
          <div className="success-content">
            <h2 className="success-title">Hatching Complete!</h2>
            <p className="success-description">
              Congratulations! You have successfully hatched <strong>{session.eggCount}</strong> {session.eggCount === 1 ? 'egg' : 'eggs'} and selected your monsters.
            </p>
            <div className="success-stats">
              <div className="stat-item">
                <i className="fas fa-egg"></i>
                <span>Eggs Hatched: {session.eggCount}</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-dragon"></i>
                <span>Monsters Selected: {Object.keys(session.selectedMonsters || {}).length}</span>
              </div>
            </div>
          </div>
          <div className="success-actions">
            <button
              className="button primary large"
              onClick={() => navigate('/town/nursery')}
            >
              <span className="icon">
                <i className="fas fa-home"></i>
              </span>
              <span className="button">Return to Nursery</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEggData) {
    return <ErrorMessage message="No eggs to hatch" />;
  }

  return (
    <div className="hatch-session-modern-container">
      {/* Session Header */}
      <div className="session-header-modern">
        <div className="session-background">
          <div className="session-icon">
            <i className="fas fa-egg"></i>
          </div>
        </div>
        <div className="session-info-modern">
          <h1 className="session-title">Hatching Session</h1>
          <div className="session-details">
            <div className="session-type">
              <i className={session.type === 'hatch' ? 'fas fa-magic' : 'fas fa-seedling'}></i>
              <span>{session.type === 'hatch' ? 'Simple Hatch' : 'Advanced Nurture'}</span>
            </div>
            <div className="session-progress-text">
              Egg <strong>{currentEgg + 1}</strong> of <strong>{session.eggCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container-modern">
        <div className="progress-bar-modern">
          {session.hatchedEggs.map((egg, index) => (
            <div
              key={egg.eggId}
              className={`progress-step-modern ${
                index < currentEgg ? 'completed' :
                index === currentEgg ? 'active' : 'pending'
              }`}
            >
              <div className="step-circle">
                {session.selectedMonsters[egg.eggId] ? (
                  <i className="fas fa-check"></i>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="step-label">
                Egg {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Egg */}
      <div className="current-egg-modern">
        <div className="egg-header-modern">
          <h2 className="egg-title">
            <i className="fas fa-egg"></i>
            Choose your {getOrdinal(currentEgg + 1)} monster
          </h2>
          <div className="egg-id-badge">
            Egg #{currentEggData.eggId}
          </div>
        </div>

        {!isEggSelected && (
          <div className="monster-naming-section">
            <div className="naming-card">
              <div className="naming-header">
                <i className="fas fa-signature"></i>
                <span>Name Your Monster</span>
                <span className="optional-badge">Optional</span>
              </div>
              <div className="naming-input-container">
                <input
                  type="text"
                  className="monster-name-input-modern"
                  value={monsterNames[currentEggData.eggId] || ''}
                  onChange={(e) => handleNameChange(currentEggData.eggId, e.target.value)}
                  placeholder={`Hatched Monster ${currentEggData.eggId}`}
                  maxLength={50}
                />
                <div className="character-count">
                  {(monsterNames[currentEggData.eggId] || '').length}/50
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monster Selection Grid */}
        <div className="monster-selection-modern">
          <h3 className="selection-title">
            <i className="fas fa-sparkles"></i>
            Available Monsters
          </h3>
          <div className="monster-grid-modern">
            {currentEggData.monsters.map((monster, index) => {
              const isClaimedWithEdenwiess = claimedMonsterIndices.includes(index);
              const isCurrentlySelected = selectedMonsters[currentEggData.eggId] === index;

              return (
                <div
                  key={index}
                  className={`monster-card-modern ${
                    isCurrentlySelected ? 'selected' : ''
                  } ${isEggSelected ? 'disabled' : ''} ${isClaimedWithEdenwiess ? 'claimed-with-edenwiess' : ''}`}
                  onClick={() => !isEggSelected && !isClaimedWithEdenwiess && handleMonsterSelect(currentEggData.eggId, index)}
                >
                  <div className="monster-card-content">
                    <MonsterCard
                      monster={monster}
                      linkToDetail={false}
                      fullHeight={false}
                    />
                    
                    {isCurrentlySelected && !isEggSelected && (
                      <div className="selection-overlay">
                        <div className="selection-checkmark">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      </div>
                    )}
                    
                    {isClaimedWithEdenwiess && (
                      <div className="claimed-overlay">
                        <div className="claimed-badge">
                          <i className="fas fa-star"></i>
                          <span>Claimed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special Berry Actions */}
        {!isEggSelected && session.specialBerries && (
          <div className="special-actions-section">
            <h4 className="special-actions-title">
              <i className="fas fa-magic"></i>
              Special Options
            </h4>
            <div className="special-actions-grid">
              {session.specialBerries['Forget-Me-Not'] > 0 && (
                <button
                  className="button decorative forget-me-not"
                  onClick={handleRerollEgg}
                  disabled={submitting}
                  title="Reroll this egg using a Forget-Me-Not berry"
                >
                  <div className="special-icon">
                    <i className="fas fa-dice"></i>
                  </div>
                  <div className="special-button-content">
                    <span className="special-button-title">Forget-Me-Not</span>
                    <span className="special-button-description">Reroll egg ({session.specialBerries['Forget-Me-Not']} available)</span>
                  </div>
                </button>
              )}

              {selectedMonsters[currentEggData.eggId] !== undefined && session.specialBerries['Edenwiess'] > 0 && (
                <button
                  className="button decorative edenwiess"
                  onClick={() => handleClaimWithEdenwiess(currentEggData.eggId)}
                  disabled={submitting}
                  title="Claim this monster as an extra using an Edenwiess berry"
                >
                  <div className="special-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <div className="special-button-content">
                    <span className="special-button-title">Use Edenwiess</span>
                    <span className="special-button-description">Claim as extra ({session.specialBerries['Edenwiess']} available)</span>
                  </div>
                </button>
              )}
            </div>

            {session.specialBerries['Edenwiess'] > 0 && (
              <div className="edenwiess-help">
                <div className="help-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="help-text">
                  <strong>Edenwiess Tip:</strong> Select a monster and use "Edenwiess" to claim it as extra, then select another monster to complete the egg.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Section */}
        {!isEggSelected && (
          <div className="egg-actions-modern">
            <button
              className="button primary large"
              onClick={() => handleSelectMonster(currentEggData.eggId)}
              disabled={submitting || selectedMonsters[currentEggData.eggId] === undefined}
            >
              <span className="icon">
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-check"></i>
                )}
              </span>
              <span className="button-text">
                {submitting 
                  ? 'Selecting Monster...' 
                  : currentEggClaims > 0 
                    ? 'Select This Monster (Final)' 
                    : 'Select This Monster'
                }
              </span>
            </button>
          </div>
        )}

        {/* Selected State */}
        {isEggSelected && (
          <div className="egg-selected-modern">
            <div className="selected-success">
              <div className="success-icon-medium">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="success-content-medium">
                <h4>Monster Selected!</h4>
                <p>You chose: <strong>{session.selectedMonsters[currentEggData.eggId].monsterName}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HatchSessionPage;
