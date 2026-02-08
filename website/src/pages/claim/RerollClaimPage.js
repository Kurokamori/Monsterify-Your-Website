import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import rerollerService from '../../services/rerollerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RerollClaimPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  // Track selections with trainer and name per reward: { [index]: { trainerId, name } }
  const [monsterSelections, setMonsterSelections] = useState({});
  const [itemSelections, setItemSelections] = useState({});
  const [defaultTrainerId, setDefaultTrainerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Check token validity first (public endpoint)
  useEffect(() => {
    const checkToken = async () => {
      try {
        await rerollerService.checkToken(token);
        // Token is valid, proceed to load session if authenticated
        if (isAuthenticated) {
          fetchSession();
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired claim link');
        setLoading(false);
      }
    };

    checkToken();
  }, [token, isAuthenticated]);

  // Fetch session data
  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await rerollerService.getClaimSession(token);
      setSessionData(response.data);

      // Set default trainer if available
      if (response.data.trainers?.length > 0) {
        setDefaultTrainerId(response.data.trainers[0].id.toString());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load claim session');
    } finally {
      setLoading(false);
    }
  };

  // Handle login redirect
  const handleLogin = () => {
    // Store the return URL and redirect to login
    sessionStorage.setItem('claimReturnUrl', `/claim/${token}`);
    navigate('/login');
  };

  // Toggle monster selection
  const toggleMonsterSelection = (index) => {
    if (!sessionData) return;

    const monster = sessionData.monsters[index];
    if (monster.claimed) return;

    // Check claim limit
    const remaining = sessionData.remaining.monstersRemaining;
    const selectedCount = Object.keys(monsterSelections).length;

    if (monsterSelections[index]) {
      // Deselect
      const newSelections = { ...monsterSelections };
      delete newSelections[index];
      setMonsterSelections(newSelections);
    } else {
      // Select
      if (remaining !== 'unlimited' && selectedCount >= remaining) {
        return; // At limit
      }
      setMonsterSelections({
        ...monsterSelections,
        [index]: {
          trainerId: defaultTrainerId,
          name: monster.species1 || ''
        }
      });
    }
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    if (!sessionData) return;

    const item = sessionData.items[index];
    if (item.claimed) return;

    // Check claim limit
    const remaining = sessionData.remaining.itemsRemaining;
    const selectedCount = Object.keys(itemSelections).length;

    if (itemSelections[index]) {
      // Deselect
      const newSelections = { ...itemSelections };
      delete newSelections[index];
      setItemSelections(newSelections);
    } else {
      // Select
      if (remaining !== 'unlimited' && selectedCount >= remaining) {
        return; // At limit
      }
      setItemSelections({
        ...itemSelections,
        [index]: {
          trainerId: defaultTrainerId
        }
      });
    }
  };

  // Update monster name
  const updateMonsterName = (index, name) => {
    if (!monsterSelections[index]) return;
    setMonsterSelections({
      ...monsterSelections,
      [index]: { ...monsterSelections[index], name }
    });
  };

  // Update monster trainer
  const updateMonsterTrainer = (index, trainerId) => {
    if (!monsterSelections[index]) return;
    setMonsterSelections({
      ...monsterSelections,
      [index]: { ...monsterSelections[index], trainerId }
    });
  };

  // Update item trainer
  const updateItemTrainer = (index, trainerId) => {
    if (!itemSelections[index]) return;
    setItemSelections({
      ...itemSelections,
      [index]: { ...itemSelections[index], trainerId }
    });
  };

  // Check if all selections have trainers assigned
  const allSelectionsHaveTrainers = () => {
    for (const sel of Object.values(monsterSelections)) {
      if (!sel.trainerId) return false;
    }
    for (const sel of Object.values(itemSelections)) {
      if (!sel.trainerId) return false;
    }
    return true;
  };

  // Submit claims
  const handleSubmit = async () => {
    const monsterCount = Object.keys(monsterSelections).length;
    const itemCount = Object.keys(itemSelections).length;

    if (monsterCount === 0 && itemCount === 0) {
      setError('Please select at least one reward to claim');
      return;
    }

    if (!allSelectionsHaveTrainers()) {
      setError('Please select a trainer for each reward');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const claims = [];

      // Add monster claims
      for (const [index, selection] of Object.entries(monsterSelections)) {
        claims.push({
          type: 'monster',
          index: parseInt(index),
          trainerId: parseInt(selection.trainerId),
          name: selection.name || sessionData.monsters[index].species1
        });
      }

      // Add item claims
      for (const [index, selection] of Object.entries(itemSelections)) {
        claims.push({
          type: 'item',
          index: parseInt(index),
          trainerId: parseInt(selection.trainerId)
        });
      }

      const response = await rerollerService.submitClaims(token, claims);
      setClaimSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claims');
    } finally {
      setSubmitting(false);
    }
  };

  // Get trainer name by ID
  const getTrainerName = (trainerId) => {
    const trainer = sessionData?.trainers?.find(t => t.id.toString() === trainerId?.toString());
    return trainer?.name || 'Unknown';
  };

  // Loading state
  if (loading) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !sessionData) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-error">
            <i className="fas fa-exclamation-circle"></i>
            <h2>Unable to Load Rewards</h2>
            <p>{error}</p>
            <Link to="/" className="button primary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-error">
            <i className="fas fa-gift"></i>
            <h2>Claim Your Rewards</h2>
            <p>Please log in to claim your rewards from this link.</p>
            <button className="button primary" onClick={handleLogin}>
              <i className="fas fa-sign-in-alt"></i> Log In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (claimSuccess) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-error">
            <i className="fas fa-check-circle"></i>
            <h2>Rewards Claimed Successfully!</h2>
            <p>Your rewards have been added to your trainers.</p>

            <div className="task-steps">
              {claimSuccess.monsters?.length > 0 && (
                <>
                  <h3>Monsters Received:</h3>
                  <ul>
                    {claimSuccess.monsters.map((monster, i) => (
                      <li key={i}>
                        <i className="fas fa-dragon"></i>
                        {monster.name} ({monster.species1})
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {claimSuccess.items?.length > 0 && (
                <>
                  <h3>Items Received:</h3>
                  <ul>
                    {claimSuccess.items.map((item, i) => (
                      <li key={i}>
                        <i className="fas fa-box"></i>
                        {item.name} {item.quantity > 1 && `x${item.quantity}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <Link to="/my_trainers" className="button primary lg">
              View My Trainers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedMonsterCount = Object.keys(monsterSelections).length;
  const selectedItemCount = Object.keys(itemSelections).length;

  // Main claim interface
  return (
    <div className="claim-page">
      <div className="claim-container">
        <div className="map-header">
          <h1><i className="fas fa-gift"></i> Claim Your Rewards</h1>
          <p>Select the rewards you want to claim and choose which trainer receives each one.</p>
        </div>

        {error && (
          <div className="claim-info error">
            {error}
          </div>
        )}

        <div className="claim-content">
          {/* Rewards Display */}
          <div className="rewards-wrapper">
            {/* Monsters Section */}
            {sessionData?.monsters?.length > 0 && (
              <div className="rewards-section">
                <h2>
                  <i className="fas fa-dragon"></i>
                  Monsters
                  {sessionData.monsterClaimLimit && (
                    <span className="claim-count-info">
                      (Select up to {sessionData.remaining.monstersRemaining})
                    </span>
                  )}
                </h2>

                {sessionData.remaining.monstersClaimed > 0 && (
                  <div className="claim-info">
                    You have already claimed {sessionData.remaining.monstersClaimed} monster(s).
                  </div>
                )}

                <div className="town-places">
                  {sessionData.monsters.map((monster, index) => {
                    const isSelected = !!monsterSelections[index];
                    const selection = monsterSelections[index];

                    return (
                      <div
                        key={index}
                        className={`area-card ${
                          monster.claimed ? 'claimed' :
                          isSelected ? 'selected' :
                          sessionData.remaining.monstersRemaining !== 'unlimited' &&
                          selectedMonsterCount >= sessionData.remaining.monstersRemaining ? 'disabled' : ''
                        }`}
                        onClick={() => toggleMonsterSelection(index)}
                      >
                        <img
                          src={monster.image_url || monster.species1_img || '/images/monsters/default.png'}
                          alt={monster.species1}
                          className="reward-image"
                          onError={(e) => { e.target.src = '/images/monsters/default.png'; }}
                        />
                        <div className="reward-name">{monster.species1}</div>
                        {monster.species2 && (
                          <div className="reward-details">+ {monster.species2}</div>
                        )}
                        <div className="reward-types">
                          {monster.type1 && <span className="reward-type-badge">{monster.type1}</span>}
                          {monster.type2 && <span className="reward-type-badge">{monster.type2}</span>}
                          {monster.type3 && <span className="reward-type-badge">{monster.type3}</span>}
                        </div>

                        {monster.claimed && <span className="claimed-badge">Already Claimed</span>}
                        {isSelected && <span className="selected-badge">Selected</span>}

                        {isSelected && (
                          <div className="reward-config" onClick={(e) => e.stopPropagation()}>
                            <div className="form-input">
                              <label>Nickname:</label>
                              <input
                                type="text"
                                value={selection.name || ''}
                                onChange={(e) => updateMonsterName(index, e.target.value)}
                                placeholder={monster.species1}
                              />
                            </div>
                            <div className="form-input">
                              <label>Trainer:</label>
                              <select
                                value={selection.trainerId || ''}
                                onChange={(e) => updateMonsterTrainer(index, e.target.value)}
                              >
                                <option value="">Choose trainer...</option>
                                {sessionData?.trainers?.map(trainer => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items Section */}
            {sessionData?.items?.length > 0 && (
              <div className="rewards-section">
                <h2>
                  <i className="fas fa-box"></i>
                  Items
                  {sessionData.itemClaimLimit && (
                    <span className="claim-count-info">
                      (Select up to {sessionData.remaining.itemsRemaining})
                    </span>
                  )}
                </h2>

                {sessionData.remaining.itemsClaimed > 0 && (
                  <div className="claim-info">
                    You have already claimed {sessionData.remaining.itemsClaimed} item(s).
                  </div>
                )}

                <div className="town-places">
                  {sessionData.items.map((item, index) => {
                    const isSelected = !!itemSelections[index];
                    const selection = itemSelections[index];

                    return (
                      <div
                        key={index}
                        className={`area-card ${
                          item.claimed ? 'claimed' :
                          isSelected ? 'selected' :
                          sessionData.remaining.itemsRemaining !== 'unlimited' &&
                          selectedItemCount >= sessionData.remaining.itemsRemaining ? 'disabled' : ''
                        }`}
                        onClick={() => toggleItemSelection(index)}
                      >
                        <img
                          src={item.image_url || '/images/items/default_item.png'}
                          alt={item.name}
                          className="reward-image"
                          onError={(e) => { e.target.src = '/images/items/default_item.png'; }}
                        />
                        <div className="reward-name">{item.name}</div>
                        <div className="reward-details">
                          {item.category} {item.quantity > 1 && `x${item.quantity}`}
                        </div>

                        {item.claimed && <span className="claimed-badge">Already Claimed</span>}
                        {isSelected && <span className="selected-badge">Selected</span>}

                        {isSelected && (
                          <div className="reward-config" onClick={(e) => e.stopPropagation()}>
                            <div className="form-input">
                              <label>Trainer:</label>
                              <select
                                value={selection.trainerId || ''}
                                onChange={(e) => updateItemTrainer(index, e.target.value)}
                              >
                                <option value="">Choose trainer...</option>
                                {sessionData?.trainers?.map(trainer => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Claim Panel */}
          <div className="claim-panel">
            <h2>Claim Summary</h2>

            {(selectedMonsterCount > 0 || selectedItemCount > 0) ? (
              <>
                <div className="task-steps">
                  {Object.entries(monsterSelections).map(([index, selection]) => (
                    <div key={`monster-${index}`} className="selected-item">
                      <div className="naming-header">
                        <i className="fas fa-dragon category-icon"></i>
                        <span className="task-name">
                          {selection.name || sessionData.monsters[index].species1}
                        </span>
                        <span className="reward-details">
                          → {selection.trainerId ? getTrainerName(selection.trainerId) : <em>No trainer</em>}
                        </span>
                      </div>
                      <button
                        className="button danger icon sm"
                        onClick={() => {
                          const newSelections = { ...monsterSelections };
                          delete newSelections[index];
                          setMonsterSelections(newSelections);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  {Object.entries(itemSelections).map(([index, selection]) => (
                    <div key={`item-${index}`} className="selected-item">
                      <div className="naming-header">
                        <i className="fas fa-box category-icon"></i>
                        <span className="task-name">
                          {sessionData.items[index].name}
                        </span>
                        <span className="reward-details">
                          → {selection.trainerId ? getTrainerName(selection.trainerId) : <em>No trainer</em>}
                        </span>
                      </div>
                      <button
                        className="button danger icon sm"
                        onClick={() => {
                          const newSelections = { ...itemSelections };
                          delete newSelections[index];
                          setItemSelections(newSelections);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="button primary lg"
                  onClick={handleSubmit}
                  disabled={submitting || !allSelectionsHaveTrainers()}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Claim {selectedMonsterCount + selectedItemCount} Reward{selectedMonsterCount + selectedItemCount > 1 ? 's' : ''}
                    </>
                  )}
                </button>

                {!allSelectionsHaveTrainers() && (
                  <p className="claim-warning">
                    <i className="fas fa-exclamation-triangle"></i> Please select a trainer for each reward
                  </p>
                )}
              </>
            ) : (
              <p className="no-selection">Click on rewards above to select them for claiming.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RerollClaimPage;
