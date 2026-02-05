import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import TrainerSelector from '../../common/TrainerSelector';
import MonsterRewardCard from './MonsterRewardCard';
import { useAuth } from '../../../contexts/AuthContext';

const SessionDisplay = ({
  session,
  prompt,
  flavor,
  onSessionComplete,
  onReturnToActivity,
  loading = false,
  error = null
}) => {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [claimingReward, setClaimingReward] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [monsterNames, setMonsterNames] = useState({});
  const [speciesImages, setSpeciesImages] = useState({});
  
  // Cooldown state
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute in seconds
  const [canSubmit, setCanSubmit] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Initialize session start time and check if user is admin
  useEffect(() => {
    if (session && !sessionStartTime) {
      setSessionStartTime(Date.now());
      // If user is admin, allow immediate submission
      console.log('Current user:', currentUser);
      console.log('Is admin:', currentUser?.is_admin);
      if (currentUser && currentUser.is_admin) {
        console.log('Admin detected - allowing immediate submission');
        setCanSubmit(true);
        setTimeRemaining(0);
      }
    }
  }, [session, currentUser, sessionStartTime]);

  // Cooldown timer
  useEffect(() => {
    if (!sessionStartTime || (currentUser && currentUser.is_admin)) {
      return; // No timer for admins
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setCanSubmit(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime, currentUser]);

  // Fetch trainers when component mounts
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        // Get user data from localStorage to get the discord_id
        const userData = localStorage.getItem('user');
        let userId = null;

        if (userData) {
          try {
            const user = JSON.parse(userData);
            userId = user.discord_id;
            console.log('Using discord_id from localStorage:', userId);
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
          }
        }

        // Make the API call with the user's discord ID
        const response = await api.get(userId ? `/trainers/user/${userId}` : '/trainers/user');

        if (Array.isArray(response.data)) {
          setTrainers(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setTrainers(response.data.data);
        } else {
          console.warn('Unexpected trainers response format');
          setTrainers([]);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setTrainers([]);
      }
    };

    fetchTrainers();
  }, []);

  // Function to handle claiming a reward
  const claimReward = async (rewardId, trainerId) => {
    if (!trainerId) {
      setClaimError('Please select a trainer to claim this reward.');
      return;
    }

    try {
      setClaimingReward(rewardId);
      setClaimError(null);

      // Find the reward
      const reward = rewards.find(r => r.id === rewardId);

      // If it's a monster reward, make sure it has a name
      let monsterName = null;
      if (reward && reward.type === 'monster') {
        monsterName = monsterNames[rewardId];

        // If no name is provided, use the species name if available
        // For Mystery Rolls, use "Mystery Monster" as placeholder (backend will handle actual naming)
        if (!monsterName || monsterName.trim() === '') {
          if (reward.reward_data.species) {
            monsterName = reward.reward_data.species;
          } else if (reward.reward_data.species1) {
            monsterName = reward.reward_data.species1;
          } else {
            // Mystery Roll - use placeholder, will be updated after roll
            monsterName = 'Mystery Monster';
          }

          // Update the monster name state
          setMonsterNames(prev => ({
            ...prev,
            [rewardId]: monsterName
          }));
        }
      }

      const response = await api.post('/town/activities/claim', {
        sessionId: session.session_id,
        rewardId,
        trainerId,
        monsterName: monsterName // Include the monster name if it's a monster reward
      });

      if (response.data.success) {
        // Update the rewards list to mark this reward as claimed
        setRewards(prevRewards =>
          prevRewards.map(reward =>
            reward.id === rewardId
              ? {
                  ...reward,
                  claimed: true,
                  claimed_by: trainerId,
                  claimed_at: new Date().toISOString(),
                  // If it's a monster reward and we got monster data back, update it
                  ...(reward.type === 'monster' && response.data.monster ? {
                    reward_data: {
                      ...reward.reward_data,
                      monster_id: response.data.monster.id,
                      monster_name: response.data.monster.name || monsterName,
                      monster_species: response.data.monster.species1 || 'Unknown',
                      monster_image: response.data.monster.img_link || null,
                      // Add the species, types, and attribute data
                      species1: response.data.monster.species1,
                      species2: response.data.monster.species2,
                      species3: response.data.monster.species3,
                      type1: response.data.monster.type1,
                      type2: response.data.monster.type2,
                      type3: response.data.monster.type3,
                      attribute: response.data.monster.attribute
                    }
                  } : {})
                }
              : reward
          )
        );
      } else {
        setClaimError(response.data.message || 'Failed to claim reward');
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      setClaimError('Failed to claim reward. Please try again later.');
    } finally {
      setClaimingReward(null);
    }
  };

  // Function to handle trainer selection for a reward
  const handleTrainerSelect = (rewardId, trainerId) => {
    setRewards(prevRewards =>
      prevRewards.map(reward =>
        reward.id === rewardId
          ? { ...reward, assigned_to: trainerId }
          : reward
      )
    );
  };

  // Function to handle monster name input
  const handleMonsterNameChange = (rewardId, name) => {
    setMonsterNames(prev => ({
      ...prev,
      [rewardId]: name
    }));
  };

  // Function to extract species images from monster reward data (no API calls needed)
  const extractSpeciesImages = (rewards) => {
    if (!rewards || !Array.isArray(rewards)) return;

    // Filter out monster rewards
    const monsterRewards = rewards.filter(reward => reward.type === 'monster');
    if (monsterRewards.length === 0) return;

    console.log('Extracting species images from monster rewards:', monsterRewards);

    // Extract species images from the reward data
    const newSpeciesImages = { ...speciesImages };

    monsterRewards.forEach(reward => {
      console.log('Processing full reward data for species images:', reward);
      console.log('Reward data structure:', reward.reward_data);

      // Check multiple possible locations for monster data
      const monsterData = reward.reward_data.rolled_monster || reward.reward_data;
      console.log('Monster data for images:', monsterData);

      if (monsterData) {
        // Extract species1 image
        if (monsterData.species1) {
          const imageUrl = monsterData.species1_image || monsterData.img_link || monsterData.image_url;
          if (imageUrl) {
            newSpeciesImages[monsterData.species1] = {
              image_url: imageUrl,
              type: monsterData.type1,
              type2: monsterData.type2,
              attribute: monsterData.attribute
            };
            console.log(`Set species image for ${monsterData.species1}:`, imageUrl);
          }
        }

        // Extract species2 image
        if (monsterData.species2) {
          const imageUrl = monsterData.species2_image || monsterData.img_link || monsterData.image_url;
          if (imageUrl) {
            newSpeciesImages[monsterData.species2] = {
              image_url: imageUrl,
              type: monsterData.type1,
              type2: monsterData.type2,
              attribute: monsterData.attribute
            };
            console.log(`Set species image for ${monsterData.species2}:`, imageUrl);
          }
        }

        // Extract species3 image
        if (monsterData.species3) {
          const imageUrl = monsterData.species3_image || monsterData.img_link || monsterData.image_url;
          if (imageUrl) {
            newSpeciesImages[monsterData.species3] = {
              image_url: imageUrl,
              type: monsterData.type1,
              type2: monsterData.type2,
              attribute: monsterData.attribute
            };
            console.log(`Set species image for ${monsterData.species3}:`, imageUrl);
          }
        }

        // Also set the main monster species
        const mainSpecies = monsterData.monster_species || monsterData.species || monsterData.species1;
        if (mainSpecies) {
          const imageUrl = monsterData.img_link || monsterData.image_url || monsterData.species1_image;
          if (imageUrl) {
            newSpeciesImages[mainSpecies] = {
              image_url: imageUrl,
              type: monsterData.type1,
              type2: monsterData.type2,
              attribute: monsterData.attribute
            };
            console.log(`Set main species image for ${mainSpecies}:`, imageUrl);
          }
        }
      }
    });

    console.log('Final species images:', newSpeciesImages);
    setSpeciesImages(newSpeciesImages);
  };

  // Mystery Roll constant for fallback
  const MYSTERY_ROLL = 'Mystery Roll';

  // Helper function - no longer used for fallback species, but kept for compatibility
  // Mystery Rolls will be shown instead of defaulting to specific species
  const getDefaultSpeciesForType = (type) => {
    // Return Mystery Roll - the actual species will be determined when claimed
    return [MYSTERY_ROLL];
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      // Fix the endpoint to match the backend route
      const response = await api.post(`/town/activities/complete`, {
        sessionId: session.session_id
      });

      if (response.data.success) {
        setSuccess(true);

        // Initialize rewards with assigned_to property if trainers are available
        const initializedRewards = response.data.rewards.map(reward => {
          // If the reward already has an assignment, keep it
          if (reward.assigned_to) {
            return reward;
          }

          // Otherwise, assign to the first trainer if available
          return {
            ...reward,
            assigned_to: trainers.length > 0 ? trainers[0].id : null
          };
        });

        // Initialize monster names with default species names
        // For Mystery Rolls (no species data), leave name empty for user to fill in
        const initialMonsterNames = {};
        initializedRewards.forEach(reward => {
          if (reward.type === 'monster') {
            // For monster rewards, set the default name to the species
            let defaultName = '';

            if (reward.reward_data.species) {
              defaultName = reward.reward_data.species;
            } else if (reward.reward_data.species1) {
              defaultName = reward.reward_data.species1;
            }
            // For Mystery Rolls (no species data), leave name empty

            initialMonsterNames[reward.id] = defaultName;
          }
        });

        setMonsterNames(initialMonsterNames);
        setRewards(initializedRewards);

        // Extract species images from the rewards
        extractSpeciesImages(initializedRewards);

        // Don't call onSessionComplete immediately
        // This allows the rewards to be displayed without flashing
        console.log('Activity completed successfully, rewards:', initializedRewards);

        // We'll let the parent component know about the completion
        // only when the user explicitly chooses to return or claim rewards
      } else {
        setSubmitError(response.data.message || 'Failed to submit activity');
      }
    } catch (err) {
      console.error('Error submitting activity:', err);
      setSubmitError('Failed to submit activity. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="activity-session-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-session-container">
        <ErrorMessage message={error} />
        <div className="debug-actions">
          <button onClick={onReturnToActivity} className="btn btn-secondary">Return to Activity</button>
        </div>
      </div>
    );
  }

  if (success && rewards) {
    return (
      <div className="activity-session-container">
        <div className="activity-session-content">
          <div className="activity-rewards">
            <h3>Congratulations!</h3>
            <p>You've successfully completed the activity at {session.location.replace(/_/g, ' ')}.</p>

            {/* Monster Rewards Grid */}
            {rewards.filter(reward => reward.type === 'monster').length > 0 && (
              <div className="monster-rewards-section">
                <h4>Monster Rewards</h4>
                <div className="monster-rewards-grid">
                  {Array.isArray(rewards) && rewards
                    .filter(reward => reward.type === 'monster')
                    .map((reward, index) => (
                      <MonsterRewardCard
                        key={reward.id || index}
                        reward={reward}
                        trainers={trainers}
                        selectedTrainerId={reward.assigned_to}
                        onTrainerSelect={handleTrainerSelect}
                        onNameChange={handleMonsterNameChange}
                        onClaim={claimReward}
                        isClaiming={claimingReward === reward.id}
                        isClaimedBy={reward.claimed_by}
                        speciesImages={speciesImages}
                        monsterName={monsterNames[reward.id] || ''}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Other Rewards Grid */}
            {rewards.filter(reward => reward.type !== 'monster').length > 0 && (
              <div className="other-rewards-section">
                <h4>Other Rewards</h4>
                <div className="rewards-grid">
                  {Array.isArray(rewards) && rewards
                    .filter(reward => reward.type !== 'monster')
                    .map((reward, index) => (
                      <div key={reward.id || index} className={`reward-card ${reward.claimed ? 'claimed' : ''}`}>
                        <div className={`reward-icon ${reward.type}`}>
                          <i className={
                            reward.type === 'coin' ? 'fas fa-coins' :
                            reward.type === 'item' ? 'fas fa-box' :
                            reward.type === 'level' ? 'fas fa-level-up-alt' :
                            'fas fa-gift'
                          }></i>
                        </div>
                        <div className="reward-title">
                          {reward.reward_data.title ||
                           (reward.type === 'coin' ? `${reward.reward_data.amount} Coins` :
                            reward.type === 'item' ? reward.reward_data.name :
                            reward.type === 'level' ? `${reward.reward_data.levels} Level${reward.reward_data.levels > 1 ? 's' : ''}` :
                            'Mystery Reward')}
                        </div>
                        <div className="reward-description">
                          {reward.type === 'coin' ? `${reward.reward_data.amount} coins` :
                           reward.type === 'item' ? `${reward.reward_data.quantity} ${reward.reward_data.name}` :
                           reward.type === 'level' ? `${reward.reward_data.levels} level${reward.reward_data.levels > 1 ? 's' : ''}` :
                           'Mystery reward'}
                        </div>
                        <div className={`reward-rarity ${reward.rarity}`}>
                          {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                        </div>

                        <div className="reward-actions">
                          {reward.claimed ? (
                            <div className="claimed-badge">
                              <i className="fas fa-check-circle mr-2"></i>
                              Claimed by {trainers.find(t => t.id === reward.claimed_by)?.name || 'Unknown'}
                            </div>
                          ) : (
                            <>
                              <TrainerSelector
                                trainers={trainers}
                                selectedTrainerId={reward.assigned_to}
                                onChange={(trainerId) => handleTrainerSelect(reward.id, trainerId)}
                              />
                              <button
                                className="btn btn-primary mt-2 w-full"
                                onClick={() => claimReward(reward.id, reward.assigned_to)}
                                disabled={claimingReward === reward.id || !reward.assigned_to}
                              >
                                {claimingReward === reward.id ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i> Claiming...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-hand-paper mr-2"></i> Claim
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {claimError && <ErrorMessage message={claimError} />}

            <div className="rewards-actions">
              <button onClick={onReturnToActivity} className="btn btn-primary">
                <i className="fas fa-arrow-left mr-2"></i> Start New Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !prompt || !flavor) {
    return (
      <div className="activity-session-container">
        <ErrorMessage message="Session data not found. Please try starting a new activity." />
        <div className="debug-actions">
          <button onClick={onReturnToActivity} className="btn btn-secondary">Return to Activity</button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-session-container">
      <div className="activity-session-content">
        <div className="activity-flavor">
          {flavor.image_url && (
            <img
              src={flavor.image_url}
              alt={`${session.location} ${session.activity}`}
              className="activity-image"
            />
          )}
          <p className="flavor-text">{flavor.flavor_text}</p>
        </div>

        <div className="activity-prompt">
          <h3>Your Creative Prompt</h3>
          <p><strong>Prompt:</strong> {prompt.prompt_text}</p>
          <div className="creative-instructions">
            <p><strong>📝 Instructions:</strong> Create artwork, write a story, poem, or any creative response inspired by this prompt. 
            This is a creative activity - trainers are not required to be included in your creation, but feel free to include them if you'd like!</p>
            <p><em>Express your creativity through any medium that inspires you!</em></p>
          </div>
        </div>

        <div className="activity-completion">
          <p>When you've completed your creative work, click Done to earn your rewards!</p>
          
          {!canSubmit && !(currentUser && currentUser.is_admin) && (
            <div className="cooldown-notice">
              <p><i className="fas fa-clock"></i> Please wait {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} before submitting</p>
              <p><em>This gives you time to create something wonderful!</em></p>
            </div>
          )}
          
          <button
            className="button button-success"
            onClick={handleComplete}
            disabled={submitting || (!canSubmit && !(currentUser && currentUser.is_admin))}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Completing...
              </>
            ) : !canSubmit && !(currentUser && currentUser.is_admin) ? (
              <>
                <i className="fas fa-clock"></i> Please Wait ({Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')})
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Done
              </>
            )}
          </button>
        </div>

        {submitError && <ErrorMessage message={submitError} />}
      </div>
    </div>
  );
};

export default SessionDisplay;
