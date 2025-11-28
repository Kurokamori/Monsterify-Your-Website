import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import trainerService from '../../../services/trainerService';
import speciesService from '../../../services/speciesService';
import TrainerSelector from '../../common/TrainerSelector';
import MonsterRewardCard from './MonsterRewardCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import townService from '../../../services/townService';

/**
 * Component to display rewards and allow claiming them
 */
const RewardsDisplay = ({
  sessionId,
  rewards = [],
  onRewardClaimed = () => {},
  onAllRewardsClaimed = () => {},
  showTitle = true
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState({});
  const [claimingReward, setClaimingReward] = useState(null);
  const [forfeitingReward, setForfeitingReward] = useState(null);
  const [monsterNames, setMonsterNames] = useState({});
  const [speciesImages, setSpeciesImages] = useState({});
  const [localRewards, setLocalRewards] = useState(rewards);

  // Berry effects data copied from Apothecary component
  const getBerryEffect = (berryName) => {
    const berryEffects = {
      'Bugger Berry': 'Removes the first species of a mon with more than 1 species',
      'Mala Berry': 'Removes species 2 (if present)',
      'Merco Berry': 'Removes species 3 (if present)', 
      'Patama Berry': 'Randomizes species 1',
      'Bluk Berry': 'Randomizes species 2 (if present)',
      'Nuevo Berry': 'Randomizes species 3 (if present)',
      'Azzuk Berry': 'Adds a new random species to species 2 (if not present)',
      'Mangus Berry': 'Adds a new random species to species 3 (if not present)',
      'Siron Berry': 'Removes first type and shifts remaining types (if more than one type)',
      'Lilan Berry': 'Removes type 2 (if present)',
      'Kham Berry': 'Removes type 3 (if present)',
      'Maizi Berry': 'Removes type 4 (if present)',
      'Fani Berry': 'Removes type 5 (if present)',
      'Miraca Berry': 'Randomizes type 1',
      'Cocon Berry': 'Randomizes type 2 (if present)',
      'Durian Berry': 'Randomizes type 3 (if present)',
      'Monel Berry': 'Randomizes type 4 (if present)',
      'Perep Berry': 'Randomizes type 5 (if present)',
      'Addish Berry': 'Adds type 2 (if not present)',
      'Sky Carrot Berry': 'Adds type 3 (if not present)',
      'Kembre Berry': 'Adds type 4 (if not present)',
      'Espara Berry': 'Adds type 5 (if not present)',
      'Datei Berry': 'Randomizes attribute',
      'Divest Berry': 'Splits a monster with multiple species into two monsters',
      'Edenweiss': 'Special flower with unique properties',
      'Forget-Me-Not': 'Special flower with unique properties'
    };
    
    return berryEffects[berryName] || null;
  };

  // Fetch species images for monster rewards
  useEffect(() => {
    const fetchSpeciesImages = async () => {
      if (!rewards || !Array.isArray(rewards)) return;

      // Filter out monster rewards
      const monsterRewards = rewards.filter(reward => reward.type === 'monster');
      if (monsterRewards.length === 0) return;

      // Extract species from monster rewards
      const speciesList = monsterRewards.reduce((list, reward) => {
        // Check for species1, species2, species3 fields
        if (reward.reward_data.species1) {
          if (!list.includes(reward.reward_data.species1)) {
            list.push(reward.reward_data.species1);
          }
        }

        if (reward.reward_data.species2) {
          if (!list.includes(reward.reward_data.species2)) {
            list.push(reward.reward_data.species2);
          }
        }

        if (reward.reward_data.species3) {
          if (!list.includes(reward.reward_data.species3)) {
            list.push(reward.reward_data.species3);
          }
        }

        // Check for species in params
        if (reward.reward_data.params && reward.reward_data.params.species1) {
          if (!list.includes(reward.reward_data.params.species1)) {
            list.push(reward.reward_data.params.species1);
          }
        }

        return list;
      }, []);

      if (speciesList.length === 0) return;

      try {
        // Fetch species images
        const response = await speciesService.getSpeciesImages(speciesList);
        if (response && response.success) {
          setSpeciesImages(response.speciesImages || {});
        }
      } catch (error) {
        console.error('Error fetching species images:', error);
      }
    };

    fetchSpeciesImages();
  }, [rewards]);

  // Fetch trainers on component mount
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);

        // Extract trainers from the response
        let trainersData = [];
        if (response && response.trainers) {
          trainersData = response.trainers;
        } else if (response && response.data) {
          trainersData = Array.isArray(response.data) ? response.data :
                        (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
        }

        setUserTrainers(trainersData);

        // Initialize selected trainers
        const initialSelectedTrainers = {};
        if (trainersData.length > 0) {
          rewards.forEach(reward => {
            initialSelectedTrainers[reward.id] = trainersData[0].id;
          });
        }
        setSelectedTrainers(initialSelectedTrainers);
      }
      catch (error) {
        console.error('Error fetching user trainers:', error);
        setError('Failed to load trainers. Please try again.');
      }
      finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated, currentUser, rewards]);

  // Update local rewards when props change
  useEffect(() => {
    setLocalRewards(rewards);
  }, [rewards]);

  // Handle trainer selection for a reward
  const handleTrainerSelect = (rewardId, trainerId) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [rewardId]: trainerId
    }));
  };

  // Handle monster name change
  const handleMonsterNameChange = (rewardId, name) => {
    setMonsterNames(prev => ({
      ...prev,
      [rewardId]: name
    }));
  };

  // Claim a reward
  const claimReward = async (rewardId) => {
    try {
      setClaimingReward(rewardId);
      setError(null);

      const trainerId = selectedTrainers[rewardId];
      if (!trainerId) {
        setError('Please select a trainer to claim this reward.');
        setClaimingReward(null);
        return;
      }

      // Get monster name if it's a monster reward
      const reward = localRewards.find(r => r.id === rewardId);
      const monsterName = reward && reward.type === 'monster' ? monsterNames[rewardId] || '' : '';

      // Use garden harvest claim endpoint
      const response = await townService.claimGardenHarvestReward(sessionId, rewardId, trainerId, monsterName);

      if (response.success) {
        // Update the rewards list immediately for better UX
        setLocalRewards(prev => prev.map(reward => {
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

        // Call the onRewardClaimed callback
        onRewardClaimed(rewardId, trainerId);

        // Check if all rewards are claimed
        const updatedRewards = localRewards.map(reward =>
          reward.id === rewardId ? { ...reward, claimed: true } : reward
        );

        if (updatedRewards.every(reward => reward.claimed)) {
          onAllRewardsClaimed();
        }
      } else {
        setError(response.message || 'Failed to claim reward. Please try again.');
      }
    } catch (err) {
      console.error('RewardsDisplay: Error claiming reward:', err);
      setError('Failed to claim reward. Please try again later.');
    } finally {
      setClaimingReward(null);
    }
  };

  // Forfeit a monster reward
  const forfeitReward = async (rewardId, monsterName) => {
    try {
      setForfeitingReward(rewardId);
      setError(null);

      const response = await townService.forfeitGardenHarvestMonster(sessionId, rewardId, monsterName);

      if (response.success) {
        // Update the reward as forfeited in the local state
        setLocalRewards(prev => prev.map(reward => {
          if (reward.id === rewardId) {
            return {
              ...reward,
              claimed: true,
              claimed_by: 'Garden-Forfeit',
              claimed_at: new Date().toISOString(),
              forfeited: true
            };
          }
          return reward;
        }));

        // Call the onRewardClaimed callback to notify parent
        onRewardClaimed(rewardId, 'Garden-Forfeit');

        // Show success message
        setError('Monster successfully forfeited to the Bazar!');
      } else {
        setError(response.message || 'Failed to forfeit monster. Please try again.');
      }
    } catch (err) {
      console.error('RewardsDisplay: Error forfeiting monster:', err);
      setError('Failed to forfeit monster. Please try again later.');
    } finally {
      setForfeitingReward(null);
    }
  };

  // Claim all rewards
  const claimAllRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Claim each unclaimed reward
      const unclaimedRewards = localRewards.filter(reward => !reward.claimed);

      if (unclaimedRewards.length === 0) {
        setLoading(false);
        return;
      }

      let claimedCount = 0;
      let errorCount = 0;
      let updatedRewards = [...localRewards];

      for (const reward of unclaimedRewards) {
        const trainerId = selectedTrainers[reward.id];
        if (!trainerId) {
          errorCount++;
          continue;
        }

        try {
          // Get monster name if it's a monster reward
          const monsterName = reward.type === 'monster' ? monsterNames[reward.id] || '' : '';

          // Use garden harvest claim endpoint
          const response = await townService.claimGardenHarvestReward(sessionId, reward.id, trainerId, monsterName);

          if (response.success) {
            claimedCount++;

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
          }
        } catch (claimError) {
          errorCount++;
        }
      }

      // Update rewards state with our locally updated rewards
      setLocalRewards(updatedRewards);

      // Show summary message
      if (errorCount > 0) {
        if (claimedCount > 0) {
          setError(`Claimed ${claimedCount} rewards successfully, but ${errorCount} failed. Please try claiming the remaining rewards individually.`);
        } else {
          setError('Failed to claim any rewards. Please try again later or claim them individually.');
        }
      }

      // Check if all rewards are claimed
      if (updatedRewards.every(reward => reward.claimed)) {
        onAllRewardsClaimed();
      }
    } catch (err) {
      console.error('RewardsDisplay: Error claiming all rewards:', err);
      setError('Failed to claim all rewards. Please try again later or claim them individually.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && userTrainers.length === 0) {
    return <LoadingSpinner />;
  }

  const allClaimed = localRewards.every(reward => reward.claimed);
  const anyUnclaimed = localRewards.some(reward => !reward.claimed);

  // Separate rewards by type
  const berryRewards = localRewards.filter(reward => reward.type !== 'monster');
  const monsterRewards = localRewards.filter(reward => reward.type === 'monster');

  return (
    <div className="rewards-display">
      {showTitle && (
        <div className="rewards-header">
          <h3>Your Garden Harvest Rewards</h3>
          <p>Claim your rewards by selecting a trainer for each item.</p>
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Berry Rewards Grid */}
      {berryRewards.length > 0 && (
        <div className="rewards-section">
          <h4 className="rewards-section-title">Berry Rewards</h4>
          <div className="rewards-grid berry-rewards-grid">
            {berryRewards.map((reward) => (
              <div key={reward.id} className={`reward-card ${reward.claimed ? 'claimed' : ''}`}>
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
                  {reward.reward_data.description ||
                   (reward.type === 'coin' ? `${reward.reward_data.amount} coins` :
                    reward.type === 'item' ? `${reward.reward_data.quantity || 1} ${reward.reward_data.name}` :
                    reward.type === 'level' ? `${reward.reward_data.levels} level${reward.reward_data.levels > 1 ? 's' : ''}` :
                    'Mystery reward')}
                </div>
                {reward.type === 'item' && getBerryEffect(reward.reward_data.name) && (
                  <div className="berry-effect">
                    <strong>Effect:</strong> {getBerryEffect(reward.reward_data.name)}
                  </div>
                )}
                <div className={`reward-rarity ${reward.rarity}`}>
                  {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                </div>
                <div className="reward-actions">
                  {reward.claimed ? (
                    <div className="claimed-badge">
                      <i className="fas fa-check-circle mr-2"></i>
                      Claimed by {userTrainers.find(t => t.id === reward.claimed_by)?.name || 'Unknown'}
                    </div>
                  ) : (
                    <>
                      <TrainerSelector
                        trainers={userTrainers}
                        selectedTrainerId={selectedTrainers[reward.id]}
                        onChange={(trainerId) => handleTrainerSelect(reward.id, trainerId)}
                      />
                      <button
                        className="btn-primary mt-2 w-full"
                        onClick={() => claimReward(reward.id)}
                        disabled={claimingReward === reward.id || !selectedTrainers[reward.id]}
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

      {/* Monster Rewards Grid */}
      {monsterRewards.length > 0 && (
        <div className="rewards-section">
          <h4 className="rewards-section-title">Monster Rewards</h4>
          <div className="rewards-grid monster-rewards-grid">
            {monsterRewards.map((reward) => (
              <MonsterRewardCard
                key={reward.id}
                reward={reward}
                trainers={userTrainers}
                selectedTrainerId={selectedTrainers[reward.id]}
                onTrainerSelect={(rewardId, trainerId) => handleTrainerSelect(rewardId, trainerId)}
                onNameChange={(rewardId, name) => handleMonsterNameChange(rewardId, name)}
                onClaim={(rewardId) => claimReward(rewardId)}
                onForfeit={(rewardId, monsterName) => forfeitReward(rewardId, monsterName)}
                isClaiming={claimingReward === reward.id}
                isForfeiting={forfeitingReward === reward.id}
                isClaimedBy={reward.claimed_by}
                speciesImages={speciesImages}
                monsterName={monsterNames[reward.id] || ''}
                sessionId={sessionId}
              />
            ))}
          </div>
        </div>
      )}

      {anyUnclaimed && userTrainers.length > 0 && (
        <div className="rewards-actions">
          <button
            className="btn-primary"
            onClick={claimAllRewards}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Claiming All...
              </>
            ) : (
              <>
                <i className="fas fa-check-double mr-2"></i> Claim All Rewards
              </>
            )}
          </button>
        </div>
      )}

      {allClaimed && (
        <div className="all-claimed-message">
          <i className="fas fa-check-circle mr-2"></i>
          All rewards have been claimed!
        </div>
      )}
    </div>
  );
};

export default RewardsDisplay;
