import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import townService from '../../../services/townService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import TrainerSelector from '../../../components/common/TrainerSelector';

const ActivityRewards = () => {
  const { sessionId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState({});
  const [claimingReward, setClaimingReward] = useState(null);

  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        setLoading(true);

        console.log('ActivityRewards: Fetching session data for sessionId:', sessionId);

        // First, try to get garden harvest session
        try {
          const gardenResponse = await townService.getGardenHarvestSession(sessionId);
          console.log('ActivityRewards: Garden Harvest API response:', gardenResponse);

          if (gardenResponse.success) {
            console.log('ActivityRewards: This is a garden harvest session');
            setSession(gardenResponse.session);

            if (gardenResponse.rewards) {
              console.log('ActivityRewards: Setting rewards from garden harvest session');
              setRewards(gardenResponse.rewards);
            } else if (gardenResponse.session && gardenResponse.session.rewards) {
              console.log('ActivityRewards: Setting rewards from garden harvest session.session');
              setRewards(gardenResponse.session.rewards);
            } else {
              console.warn('ActivityRewards: No rewards found in garden harvest session data');
            }

            // Fetch trainers
            console.log('ActivityRewards: Fetching trainers');
            const trainersResponse = await api.get('/trainers/user');
            console.log('ActivityRewards: Trainers response:', trainersResponse.data);

            if (Array.isArray(trainersResponse.data)) {
              setTrainers(trainersResponse.data);
            } else if (trainersResponse.data && Array.isArray(trainersResponse.data.data)) {
              setTrainers(trainersResponse.data.data);
            } else {
              console.warn('ActivityRewards: Unexpected trainers response format');
              setTrainers([]);
            }

            // Initialize selected trainers
            const initialSelectedTrainers = {};
            const trainersList = Array.isArray(trainersResponse.data)
              ? trainersResponse.data
              : (trainersResponse.data && Array.isArray(trainersResponse.data.data)
                  ? trainersResponse.data.data
                  : []);

            if (trainersList.length > 0) {
              const rewardsToInitialize = gardenResponse.rewards ||
                (gardenResponse.session && gardenResponse.session.rewards) || [];

              rewardsToInitialize.forEach(reward => {
                initialSelectedTrainers[reward.id] = trainersList[0].id;
              });
            }
            setSelectedTrainers(initialSelectedTrainers);

            setLoading(false);
            return; // Exit early since we found a garden harvest session
          }
        } catch (gardenErr) {
          // Not a garden harvest session, continue with regular session
          console.log('Not a garden harvest session, trying regular session API');
        }

        // Regular activity session
        const sessionResponse = await api.get(`/town/activities/session/${sessionId}`);
        console.log('ActivityRewards: Session response:', sessionResponse.data);

        if (!sessionResponse.data.success) {
          console.error('ActivityRewards: API returned error:', sessionResponse.data.message);
          setError(sessionResponse.data.message || 'Failed to load session data');
          setLoading(false);
          return;
        }

        setSession(sessionResponse.data.session);

        if (sessionResponse.data.session && sessionResponse.data.session.rewards) {
          console.log('ActivityRewards: Setting rewards from session');
          setRewards(sessionResponse.data.session.rewards);
        } else {
          console.warn('ActivityRewards: No rewards found in session data');
        }

        // Fetch trainers
        console.log('ActivityRewards: Fetching trainers');
        const trainersResponse = await api.get('/trainers/user');
        console.log('ActivityRewards: Trainers response:', trainersResponse.data);

        if (Array.isArray(trainersResponse.data)) {
          setTrainers(trainersResponse.data);
        } else if (trainersResponse.data && Array.isArray(trainersResponse.data.data)) {
          setTrainers(trainersResponse.data.data);
        } else {
          console.warn('ActivityRewards: Unexpected trainers response format');
          setTrainers([]);
        }

        // Initialize selected trainers
        const initialSelectedTrainers = {};
        const trainersList = Array.isArray(trainersResponse.data)
          ? trainersResponse.data
          : (trainersResponse.data && Array.isArray(trainersResponse.data.data)
              ? trainersResponse.data.data
              : []);

        if (trainersList.length > 0) {
          rewards.forEach(reward => {
            initialSelectedTrainers[reward.id] = trainersList[0].id;
          });
        }
        setSelectedTrainers(initialSelectedTrainers);
      } catch (err) {
        console.error('ActivityRewards: Error fetching rewards data:', err);
        setError('Failed to load rewards data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && sessionId) {
      console.log('ActivityRewards: Component mounted, authenticated with sessionId:', sessionId);
      fetchRewardsData();
    } else {
      console.log('ActivityRewards: Not authenticated or no sessionId');
      setLoading(false);
    }
  }, [isAuthenticated, sessionId]);

  const handleTrainerSelect = (rewardId, trainerId) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [rewardId]: trainerId
    }));
  };

  const claimReward = async (rewardId) => {
    try {
      setClaimingReward(rewardId);
      console.log('ActivityRewards: Claiming reward:', rewardId);

      const trainerId = selectedTrainers[rewardId];
      if (!trainerId) {
        console.error('ActivityRewards: No trainer selected for reward:', rewardId);
        setError('Please select a trainer to claim this reward.');
        setClaimingReward(null);
        return;
      }

      console.log('ActivityRewards: Claiming reward for trainer:', trainerId);
      console.log('ActivityRewards: Session ID:', sessionId);

      // Check if this is a garden harvest reward
      const isGardenHarvest = session && session.location === 'garden' && session.activity === 'harvest';

      let response;

      if (isGardenHarvest) {
        // Get monster name if it's a monster reward
        const reward = rewards.find(r => r.id === rewardId);
        const monsterName = reward && reward.type === 'monster' ? reward.reward_data.title || '' : '';

        // Use garden harvest claim endpoint
        response = await townService.claimGardenHarvestReward(sessionId, rewardId, trainerId, monsterName);
      } else {
        // Add authorization header explicitly
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Use regular activity claim endpoint
        response = await api.post('/town/activities/claim', {
          sessionId,
          rewardId,
          trainerId
        }, { headers });

        // Extract data from response
        response = response.data;
      }

      console.log('ActivityRewards: Claim response:', response);

      if (response.success) {
        console.log('ActivityRewards: Reward claimed successfully');

        // Update the rewards list immediately for better UX
        setRewards(prev => prev.map(reward => {
          if (reward.id === rewardId) {
            return {
              ...reward,
              claimed: true,
              claimed_by: trainerId,
              claimed_at: new Date().toISOString()
            };
          }
          return reward;
        }));

        // Clear any previous errors
        setError(null);

        // Optionally refresh the entire session data to ensure we have the latest state
        try {
          if (isGardenHarvest) {
            const gardenResponse = await townService.getGardenHarvestSession(sessionId);
            if (gardenResponse.success) {
              setSession(gardenResponse.session);
              if (gardenResponse.rewards) {
                setRewards(gardenResponse.rewards);
              } else if (gardenResponse.session && gardenResponse.session.rewards) {
                setRewards(gardenResponse.session.rewards);
              }
            }
          } else {
            const sessionResponse = await api.get(`/town/activities/session/${sessionId}`);
            if (sessionResponse.data.success && sessionResponse.data.session) {
              setSession(sessionResponse.data.session);
              if (sessionResponse.data.session.rewards) {
                setRewards(sessionResponse.data.session.rewards);
              }
            }
          }
        } catch (refreshError) {
          console.warn('ActivityRewards: Error refreshing session after claim:', refreshError);
          // Not critical, we already updated the UI
        }
      } else {
        console.error('ActivityRewards: Failed to claim reward:', response.message);
        setError(response.message || 'Failed to claim reward. Please try again.');
      }
    } catch (err) {
      console.error('ActivityRewards: Error claiming reward:', err);
      console.error('ActivityRewards: Error details:', err.response?.data || err.message);

      // Check for specific error types
      if (err.response?.status === 403) {
        setError('You do not have permission to claim this reward. Please try again or contact support.');
      } else if (err.response?.status === 404) {
        setError('Reward not found. It may have been claimed already or the session has expired.');
      } else {
        setError('Failed to claim reward. Please try again later.');
      }
    } finally {
      setClaimingReward(null);
    }
  };

  const claimAllRewards = async () => {
    try {
      setLoading(true);
      console.log('ActivityRewards: Claiming all rewards');

      // Claim each unclaimed reward
      const unclaimedRewards = rewards.filter(reward => !reward.claimed);
      console.log('ActivityRewards: Unclaimed rewards:', unclaimedRewards.length);

      if (unclaimedRewards.length === 0) {
        console.log('ActivityRewards: No unclaimed rewards to process');
        setLoading(false);
        return;
      }

      // Check if this is a garden harvest session
      const isGardenHarvest = session && session.location === 'garden' && session.activity === 'harvest';

      // Add authorization header explicitly for regular API calls
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let claimedCount = 0;
      let errorCount = 0;
      let updatedRewards = [...rewards];

      for (const reward of unclaimedRewards) {
        const trainerId = selectedTrainers[reward.id];
        if (!trainerId) {
          console.warn('ActivityRewards: No trainer selected for reward:', reward.id);
          errorCount++;
          continue;
        }

        try {
          console.log(`ActivityRewards: Claiming reward ${reward.id} for trainer ${trainerId}`);

          let response;

          if (isGardenHarvest) {
            // Get monster name if it's a monster reward
            const monsterName = reward.type === 'monster' ? reward.reward_data.title || '' : '';

            // Use garden harvest claim endpoint
            response = await townService.claimGardenHarvestReward(sessionId, reward.id, trainerId, monsterName);
          } else {
            // Use regular activity claim endpoint
            const apiResponse = await api.post('/town/activities/claim', {
              sessionId,
              rewardId: reward.id,
              trainerId
            }, { headers });

            response = apiResponse.data;
          }

          if (response.success) {
            claimedCount++;
            console.log(`ActivityRewards: Successfully claimed reward ${reward.id}`);

            // Update the reward in our local state
            updatedRewards = updatedRewards.map(r => {
              if (r.id === reward.id) {
                return {
                  ...r,
                  claimed: true,
                  claimed_by: trainerId,
                  claimed_at: new Date().toISOString()
                };
              }
              return r;
            });
          } else {
            errorCount++;
            console.error(`ActivityRewards: Failed to claim reward ${reward.id}:`, response.message);
          }
        } catch (claimError) {
          errorCount++;
          console.error(`ActivityRewards: Error claiming reward ${reward.id}:`, claimError);
        }
      }

      // Update rewards state with our locally updated rewards
      setRewards(updatedRewards);

      // Refresh rewards from server to ensure we have the latest data
      try {
        console.log('ActivityRewards: Refreshing rewards data from server');

        if (isGardenHarvest) {
          const gardenResponse = await townService.getGardenHarvestSession(sessionId);

          if (gardenResponse.success) {
            console.log('ActivityRewards: Updated rewards data received from garden harvest session');
            if (gardenResponse.rewards) {
              setRewards(gardenResponse.rewards);
            } else if (gardenResponse.session && gardenResponse.session.rewards) {
              setRewards(gardenResponse.session.rewards);
            }
          } else {
            console.warn('ActivityRewards: Failed to get updated rewards data from garden harvest session');
          }
        } else {
          const sessionResponse = await api.get(`/town/activities/session/${sessionId}`);

          if (sessionResponse.data.success && sessionResponse.data.session && sessionResponse.data.session.rewards) {
            console.log('ActivityRewards: Updated rewards data received from server');
            setRewards(sessionResponse.data.session.rewards);
          } else {
            console.warn('ActivityRewards: Failed to get updated rewards data from server');
          }
        }
      } catch (refreshError) {
        console.error('ActivityRewards: Error refreshing rewards data:', refreshError);
        // We already updated the rewards locally, so we can continue
      }

      // Show summary message
      if (errorCount > 0) {
        if (claimedCount > 0) {
          setError(`Claimed ${claimedCount} rewards successfully, but ${errorCount} failed. Please try claiming the remaining rewards individually.`);
        } else {
          setError('Failed to claim any rewards. Please try again later or claim them individually.');
        }
      } else if (claimedCount > 0) {
        // Show success message if all rewards were claimed successfully
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error('ActivityRewards: Error claiming all rewards:', err);
      console.error('ActivityRewards: Error details:', err.response?.data || err.message);
      setError('Failed to claim all rewards. Please try again later or claim them individually.');
    } finally {
      setLoading(false);
    }
  };

  console.log('ActivityRewards: Render state:', { loading, isAuthenticated, session, error });

  if (loading) {
    console.log('ActivityRewards: Showing loading spinner');
    return (
      <div className="rewards-container">
        <div className="adopt-card">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Activity Rewards</h1>
        </div>
        <div className="appraisal-start">
          <LoadingSpinner />
          <p>Loading activity rewards...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ActivityRewards: User not authenticated');
    return (
      <div className="rewards-container">
        <div className="adopt-card">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Activity Rewards</h1>
        </div>
        <div className="auth-message">
          <p>Please log in to access your rewards.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('ActivityRewards: No session data found');
    return (
      <div className="rewards-container">
        <div className="adopt-card">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Activity Rewards</h1>
        </div>
        <div className="alert error">
          <p>Session not found or has expired.</p>
          <p>Session ID: {sessionId}</p>
          <p>This may happen if the server was restarted since the session was created.</p>
          <div className="error-not-found-actions">
            <Link to="/town" className="button primary">Return to Town</Link>
            <Link to="/town/activities/garden" className="button secondary">Start New Garden Activity</Link>
            <Link to="/town/activities/farm" className="button secondary">Start New Farm Activity</Link>
            <Link to="/town/activities/pirates-dock" className="button secondary">Start New Pirate's Dock Activity</Link>
          </div>
        </div>
      </div>
    );
  }

  // Format location and activity names
  const locationName = session.location
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const activityName = session.activity
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // Separate monster rewards from other rewards
  const monsterRewards = rewards.filter(reward => reward.type === 'monster');
  const otherRewards = rewards.filter(reward => reward.type !== 'monster');

  return (
    <div className="rewards-container">
      <div className="auth-header">
        <h1>Activity Completed!</h1>
        <p>Great job completing your {activityName} at the {locationName}! You've earned the following rewards:</p>
      </div>

      {/* Other rewards grid (coins, items, levels) */}
      {otherRewards.length > 0 && (
        <>
          <div className="rewards-section-header">
            <h2>Items & Rewards</h2>
          </div>
          <div className="town-places">
            {otherRewards.map(reward => (
              <div
                key={reward.id}
                className={`area-card ${reward.claimed ? 'claimed' : ''}`}
              >
                <div className={`reward-icon${reward.type}`}>
                  <i 
                    className={
                      reward.type === 'coin' ? 'fas fa-coins' :
                      reward.type === 'item' ? 'fas fa-box' :
                      reward.type === 'level' ? 'fas fa-level-up-alt' :
                      'fas fa-gift'
                    }
                  ></i>
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
                <div className={`badge ${reward.rarity}`}>
                  {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                </div>

                <div className="reward-actions">
                  {reward.claimed ? (
                    <div className="claimed-badge">
                      <i className="fas fa-check-circle mr-2"></i>
                      Claimed
                    </div>
                  ) : (
                    <>
                      <TrainerSelector
                        trainers={trainers}
                        selectedTrainerId={selectedTrainers[reward.id]}
                        onChange={(trainerId) => handleTrainerSelect(reward.id, trainerId)}
                      />
                      <button
                        className="button primary mt-2 w-full"
                        onClick={() => claimReward(reward.id)}
                        disabled={claimingReward === reward.id}
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
        </>
      )}

      {/* Monster rewards grid */}
      {monsterRewards.length > 0 && (
        <>
          <div className="rewards-section-header">
            <h2>Monsters Caught</h2>
          </div>
          <div className="town-reward-monster-grid">
            {monsterRewards.map(reward => (
              <div
                key={reward.id}
                className={`gift-monster-card ${reward.claimed ? 'claimed' : ''}`}
              >
                <div className="monster-reward-image-container">
                  {(() => {
                    // Debug logging for the monster reward data
                    console.log('Full Monster reward data:', reward.reward_data);
                    console.log('Monster reward image data:', {
                      species1_image: reward.reward_data.species1_image,
                      species_image_url: reward.reward_data.species_image_url,
                      monster_image: reward.reward_data.monster_image,
                      debug_all_images: reward.reward_data.debug_all_images
                    });
                    
                    // Try to get the image URL from the rolled monster data directly
                    const rolledMonster = reward.reward_data.rolled_monster;
                    console.log('Rolled monster data:', rolledMonster);
                    
                    let imageUrl = null;
                    if (rolledMonster) {
                      imageUrl = rolledMonster.image_url || rolledMonster.species1_image;
                      console.log('Using rolled monster image URL:', imageUrl);
                    }
                    
                    // Fallback to reward data
                    if (!imageUrl) {
                      imageUrl = reward.reward_data.species1_image || reward.reward_data.species_image_url || reward.reward_data.monster_image;
                      console.log('Using fallback image URL:', imageUrl);
                    }
                    
                    console.log('Final selected image URL:', imageUrl);
                    
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={reward.reward_data.monster_species || reward.reward_data.species1 || 'Monster'}
                        className="monster-reward-image"
                        onError={(e) => {
                          console.log('Image failed to load:', imageUrl);
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', imageUrl);
                        }}
                      />
                    ) : null;
                  })()}
                  <i
                    className={`fas fa-dragon monster-fallback-icon${(() => {
                      const rolledMonster = reward.reward_data.rolled_monster;
                      const hasImage = rolledMonster?.image_url || reward.reward_data.species1_image || reward.reward_data.species_image_url || reward.reward_data.monster_image;
                      return hasImage ? 'hidden' : '';
                    })()}`}
                  ></i>
                </div>
                
                <div className="monster-reward-info">
                  <div className="monster-reward-title">
                    {reward.reward_data.monster_species || reward.reward_data.species1 || reward.reward_data.species || 'Monster'}
                  </div>

                  <div className="monster-reward-details">
                    <div className="monster-reward-level">
                      Level {reward.reward_data.level}
                    </div>

                    {reward.reward_data.type1 && (
                      <div className="monster-reward-types">
                        <span className={`badge monster-reward-badge${reward.reward_data.type1.toLowerCase()}`}>
                          {reward.reward_data.type1}
                        </span>
                        {reward.reward_data.type2 && (
                          <span className={`badge monster-reward-badge${reward.reward_data.type2.toLowerCase()}`}>
                            {reward.reward_data.type2}
                          </span>
                        )}
                        {reward.reward_data.type3 && (
                          <span className={`badge monster-reward-badge${reward.reward_data.type3.toLowerCase()}`}>
                            {reward.reward_data.type3}
                          </span>
                        )}
                      </div>
                    )}

                    {reward.reward_data.monster_type && (
                      <div className="monster-reward-game">
                        {reward.reward_data.monster_type.charAt(0).toUpperCase() + reward.reward_data.monster_type.slice(1)}
                      </div>
                    )}
                  </div>

                  <div className={`badge ${reward.rarity}`}>
                    {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                  </div>

                  <div className="reward-actions">
                    {reward.claimed ? (
                      <div className="claimed-badge">
                        <i className="fas fa-check-circle mr-2"></i>
                        Claimed
                      </div>
                    ) : (
                      <>
                        <TrainerSelector
                          trainers={trainers}
                          selectedTrainerId={selectedTrainers[reward.id]}
                          onChange={(trainerId) => handleTrainerSelect(reward.id, trainerId)}
                        />
                        <button
                          className="button primary mt-2 w-full"
                          onClick={() => claimReward(reward.id)}
                          disabled={claimingReward === reward.id}
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
              </div>
            ))}
          </div>
        </>
      )}

      <div className="rewards-actions">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Town
        </Link>

        {rewards.some(reward => !reward.claimed) && (
          <button
            className="button primary"
            onClick={claimAllRewards}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle mr-2"></i> Claim All Rewards
              </>
            )}
          </button>
        )}

        <Link to={`/town/activities/${session.location}`} className="button primary">
          <i className="fas fa-redo mr-2"></i> Do Another Task
        </Link>
      </div>

      {error && (
        <div className="error-container">
          <ErrorMessage message={error} />
          <div className="debug-info">
            <h4>Debug Information:</h4>
            <p>Session ID: {sessionId}</p>
            <p>API URL: {`/town/activities/session/${sessionId}`}</p>
            <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityRewards;
