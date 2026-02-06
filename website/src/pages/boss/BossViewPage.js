import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BossService from '../../services/bossService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';

const BossViewPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bossData, setBossData] = useState(null);
  const [showDefeated, setShowDefeated] = useState(false);
  const [defeatedBosses, setDefeatedBosses] = useState([]);
  const [unclaimedRewards, setUnclaimedRewards] = useState([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [monsterName, setMonsterName] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardError, setRewardError] = useState(null);

  useEffect(() => {
    fetchBossData();
  }, []);

  const fetchBossData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user trainers if logged in
      if (currentUser) {
        try {
          const trainersResponse = await trainerService.getUserTrainers(currentUser.discord_id);
          if (trainersResponse.success) {
            setUserTrainers(trainersResponse.trainers || []);
            if (trainersResponse.trainers && trainersResponse.trainers.length > 0) {
              setSelectedTrainer(trainersResponse.trainers[0].id);
            }
          }
        } catch (trainersError) {
          console.log('Could not fetch user trainers');
        }
      }
      
      // Always check for unclaimed rewards first if user is logged in
      if (currentUser) {
        console.log('Current user for rewards check:', currentUser);
        try {
          const rewardsResponse = await BossService.getUnclaimedRewards(currentUser.id);
          console.log('Unclaimed rewards response:', rewardsResponse);
          if (rewardsResponse.success) {
            setUnclaimedRewards(rewardsResponse.data);
            console.log('Set unclaimed rewards:', rewardsResponse.data);
          }
        } catch (rewardsError) {
          console.log('Could not fetch unclaimed rewards:', rewardsError);
        }
      }

      // Try to get current boss
      try {
        const response = await BossService.getCurrentBossWithLeaderboard(20);
        
        if (response.success && response.data.boss) {
          setBossData(response.data);
          setShowDefeated(false);
          return;
        }
      } catch (currentBossError) {
        console.log('No current boss found, fetching defeated bosses');
      }
      
      // If no current boss, fetch defeated bosses
      try {
        const defeatedResponse = await BossService.getDefeatedBosses(5);
        if (defeatedResponse.success && defeatedResponse.data.length > 0) {
          setDefeatedBosses(defeatedResponse.data);
          setShowDefeated(true);
        } else {
          setError('No bosses found. Check back later for new boss battles!');
        }
      } catch (defeatedError) {
        console.error('Error fetching defeated bosses:', defeatedError);
        setError('Failed to load boss data. Please try again later.');
      }
      
    } catch (err) {
      console.error('Error fetching boss data:', err);
      setError('Failed to load boss data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getHealthBarColor = (percentage) => {
    if (percentage > 60) return '#4CAF50'; // Green
    if (percentage > 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const handleClaimReward = (reward) => {
    console.log('Reward data received:', reward); // Debug log
    
    // Parse monster data from the reward
    let monsterData = null;
    try {
      if (reward.reward_type === 'boss_monster' && reward.reward_monster_data) {
        monsterData = JSON.parse(reward.reward_monster_data);
      } else if (reward.reward_type === 'grunt_monster' && reward.grunt_monster_data) {
        monsterData = JSON.parse(reward.grunt_monster_data);
      }
    } catch (error) {
      console.error('Error parsing monster data:', error);
    }
    
    console.log('Parsed monster data:', monsterData); // Debug log
    
    // Structure the reward data for the modal
    const rewardData = {
      boss_id: reward.boss_id,
      boss_name: reward.boss_name,
      boss_image: reward.boss_image,
      reward_type: reward.reward_type,
      damage_dealt: reward.damage_dealt,
      rank_position: reward.rank_position,
      monster_data: monsterData
    };
    
    setCurrentReward(rewardData);
    setMonsterName('');
    setRewardError(null);
    setShowRewardModal(true);
  };

  const submitRewardClaim = async () => {
    if (!monsterName.trim()) {
      setRewardError('Please enter a name for your monster');
      return;
    }
    
    if (!selectedTrainer) {
      setRewardError('Please select a trainer');
      return;
    }

    try {
      setClaimingReward(true);
      setRewardError(null);

      const claimData = {
        userId: currentUser.id,
        monsterName: monsterName.trim(),
        trainerId: selectedTrainer
      };

      const response = await BossService.claimBossReward(currentReward.boss_id, claimData);
      
      if (response.success) {
        // Remove the claimed reward from the list
        setUnclaimedRewards(prev => prev.filter(r => r.boss_id !== currentReward.boss_id));
        setShowRewardModal(false);
        setCurrentReward(null);
        setMonsterName('');
        
        // Show success message or refresh data
        fetchBossData();
      } else {
        setRewardError(response.message || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setRewardError('Failed to claim reward. Please try again.');
    } finally {
      setClaimingReward(false);
    }
  };

  const closeRewardModal = () => {
    setShowRewardModal(false);
    setCurrentReward(null);
    setMonsterName('');
    setRewardError(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading boss data..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchBossData}
      />
    );
  }

  if (showDefeated && defeatedBosses.length > 0) {
    return (
      <div className="boss-view-page">
        <div className="boss-header">
          <h1>Boss Battles</h1>
          <p className="boss-subtitle">
            No active boss battles right now. Here are the most recent defeated bosses:
          </p>
        </div>

        {/* Unclaimed Rewards Banner */}
        {currentUser && unclaimedRewards.length > 0 && (
          <div className="unclaimed-rewards-banner">
            <div className="banner-content">
              <div className="banner-icon">
                <i className="fas fa-gift"></i>
              </div>
              <div className="banner-text">
                <h3>🎉 You have unclaimed boss rewards!</h3>
                <p>You have {unclaimedRewards.length} reward{unclaimedRewards.length > 1 ? 's' : ''} waiting to be claimed from previous boss battles.</p>
              </div>
              <div className="banner-actions">
                <button 
                  className="button success"
                  onClick={() => handleClaimReward(unclaimedRewards[0])}
                >
                  <i className="fas fa-trophy"></i>
                  Claim Reward
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="defeated-bosses-preview">
          {defeatedBosses.map((boss) => (
            <div key={boss.id} className="defeated-boss-card">
              <div className="boss-info-header">
                <div className="boss-image-container">
                  {boss.image_url && (
                    <img
                      src={boss.image_url}
                      alt={boss.name}
                      className="boss-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default_boss.png';
                      }}
                    />
                  )}
                </div>
                <div className="boss-details">
                  <h3>{boss.name}</h3>
                  <div className="boss-meta">
                    <span>🗓️ {boss.month}/{boss.year}</span>
                    <span>👥 {boss.total_participants || 0} participants</span>
                    {boss.end_date && (
                      <span>🏆 Defeated {formatDate(boss.end_date)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {boss.top_users && boss.top_users.length > 0 && (
                <div className="winners-preview">
                  <h4>🏆 Top 3 Winners:</h4>
                  <div className="top-winners">
                    {boss.top_users.slice(0, 3).map((user, index) => (
                      <div key={user.user_id} className={`winner rank-${index + 1}`}>
                        <span className="rank-badge">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="winner-name">{user.username || 'Unknown'}</span>
                        <span className="winner-damage">{user.total_damage?.toLocaleString() || 0} dmg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="boss-actions">
          <a href="/adventures/boss/defeated" className="button primary">
            View All Defeated Bosses
          </a>
        </div>

        {/* Reward Claiming Modal */}
        <Modal
          isOpen={showRewardModal}
          onClose={closeRewardModal}
          title="Claim Your Boss Reward!"
          size="large"
        >
          {currentReward && (
            <div className="reward-claim-modal">
              <div className="reward-info">
                <div className="reward-boss-info">
                  <img 
                    src={currentReward.boss_image || '/images/default_boss.png'} 
                    alt={currentReward.boss_name}
                    className="reward-boss-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_boss.png';
                    }}
                  />
                  <div className="reward-details">
                    <h3>{currentReward.boss_name}</h3>
                    <div className="reward-type">
                      {currentReward.reward_type === 'boss_monster' ? (
                        <>
                          <i className="fas fa-crown"></i>
                          <span>Boss Monster Reward (1st Place)</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-gift"></i>
                          <span>Grunt Monster Reward (Participant)</span>
                        </>
                      )}
                    </div>
                    <div className="reward-stats">
                      <span>🗡️ Damage Dealt: {currentReward.damage_dealt?.toLocaleString() || 0}</span>
                      <span>🏆 Rank: #{currentReward.rank_position}</span>
                    </div>
                  </div>
                </div>
              </div>

                       {/* Monster Preview Section */}
            {currentReward.monster_data ? (
              <div className="monster-preview-section">
                <h4 className="monster-preview-title">
                  <i className="fas fa-dragon"></i>
                  Monster Preview: {currentReward.monster_data.name}
                </h4>
                <div className="monster-preview-card">
                  <div className="monster-attributes">
                    <div className="attribute-section">
                      <h5><i className="fas fa-dna"></i> Species</h5>
                      <div className="attribute-tags">
                        {currentReward.monster_data.species && currentReward.monster_data.species.map((species, index) => (
                          <span key={index} className="attribute-tag species-tag">
                            {species}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attribute-section">
                      <h5><i className="fas fa-magic"></i> Types</h5>
                      <div className="attribute-tags">
                        {currentReward.monster_data.types && currentReward.monster_data.types.map((type, index) => (
                          <span key={index} className="attribute-tag type-tag">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attribute-section">
                      <h5><i className="fas fa-star"></i> Attribute</h5>
                      <div className="attribute-tags">
                        <span className="attribute-tag primary-attribute-tag">
                          {currentReward.monster_data.attribute}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="monster-preview-section">
                <h4 className="monster-preview-title">
                  <i className="fas fa-exclamation-circle"></i>
                  Monster Preview Unavailable
                </h4>
                <p>Monster data not found for this reward.</p>
              </div>
            )}
              
              <div className="claim-form">
                <div className="form-group">
                  
                <label htmlFor="monster-name">Name your new monster:</label>
                  <input
                    type="text"
                    id="monster-name"
                    value={monsterName}
                    onChange={(e) => setMonsterName(e.target.value)}
                    placeholder="Enter monster name..."
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="trainer-select">Assign to trainer:</label>
                  <select
                    id="trainer-select"
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                  >
                    <option value="">Select a trainer</option>
                    {userTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {rewardError && (
                  <div className="reward-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{rewardError}</span>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="button secondary"
                    onClick={closeRewardModal}
                    disabled={claimingReward}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button primary"
                    onClick={submitRewardClaim}
                    disabled={claimingReward || !monsterName.trim() || !selectedTrainer}
                  >
                    {claimingReward ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Claiming...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trophy"></i> Claim Reward
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  if (!bossData || !bossData.boss) {
    return (
      <div className="boss-view-page">
        <div className="no-boss-message">
          <h2>No Boss Battles</h2>
          <p>There are currently no boss battles available. Check back later!</p>
        </div>
      </div>
    );
  }

  const { boss, leaderboard } = bossData;

  return (
    <div className="boss-view-page">
      <div className="boss-header">
        <h1>Monthly Boss Battle</h1>
        <p className="boss-subtitle">
          Defeat the boss by submitting artwork! The top damage dealer gets the boss monster.
        </p>
      </div>

      {/* Unclaimed Rewards Banner */}
      {currentUser && unclaimedRewards.length > 0 && (
        <div className="unclaimed-rewards-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <i className="fas fa-gift"></i>
            </div>
            <div className="banner-text">
              <h3>🎉 You have unclaimed boss rewards!</h3>
              <p>You have {unclaimedRewards.length} reward{unclaimedRewards.length > 1 ? 's' : ''} waiting to be claimed from previous boss battles.</p>
            </div>
            <div className="banner-actions">
              <button 
                className="button success"
                onClick={() => handleClaimReward(unclaimedRewards[0])}
              >
                <i className="fas fa-trophy"></i>
                Claim Reward
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="boss-content">
        {/* Boss Information Card */}
        <div className="boss-card">
          <div className="boss-image-container">
            {boss.image_url ? (
              <img 
                src={boss.image_url} 
                alt={boss.name}
                className="boss-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_boss.png';
                }}
              />
            ) : (
              <div className="boss-image-placeholder">
                <i className="fas fa-dragon"></i>
              </div>
            )}
          </div>
          
          <div className="boss-info">
            <h2 className="boss-name">{boss.name}</h2>
            
            {boss.description && (
              <p className="boss-description">{boss.description}</p>
            )}
            
            <div className="boss-stats">
              <div className="boss-stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value status-${boss.status}`}>
                  {boss.status.charAt(0).toUpperCase() + boss.status.slice(1)}
                </span>
              </div>
              
              <div className="boss-stat">
                <span className="stat-label">Month:</span>
                <span className="stat-value">{boss.month}/{boss.year}</span>
              </div>
              
              {boss.start_date && (
                <div className="boss-stat">
                  <span className="stat-label">Started:</span>
                  <span className="stat-value">{formatDate(boss.start_date)}</span>
                </div>
              )}
            </div>
            
            {/* Health Bar */}
            <div className="boss-health">
              <div className="health-label">
                <span>Health</span>
                <span>{boss.current_hp.toLocaleString()} / {boss.total_hp.toLocaleString()}</span>
              </div>
              <div className="health-bar-container">
                <div 
                  className="health-bar"
                  style={{
                    width: `${boss.healthPercentage}%`,
                    backgroundColor: getHealthBarColor(boss.healthPercentage)
                  }}
                ></div>
              </div>
              <div className="health-percentage">{boss.healthPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <h3 className="leaderboard-title">
            <i className="fas fa-trophy"></i>
            Damage Leaderboard
          </h3>
          
          {leaderboard && leaderboard.length > 0 ? (
            <div className="leaderboard-content">
              {/* Top 3 */}
              {leaderboard.slice(0, 3).length > 0 && (
                <div className="top-three">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div key={`${entry.user_id}-${entry.trainer_id}`} className={`top-rank rank-${index + 1}`}>
                      <div className="rank-badge">{index + 1}</div>
                      <div className="trainer-avatar">
                        {entry.trainer_avatar ? (
                          <img 
                            src={entry.trainer_avatar} 
                            alt={entry.trainer_name || entry.username}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_avatar.png';
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </div>
                      <div className="trainer-info">
                        <div className="trainer-name">
                          {entry.trainer_name || entry.username || 'Unknown'}
                        </div>
                        <div className="damage-amount">
                          {entry.total_damage.toLocaleString()} damage
                        </div>
                        <div className="submission-count">
                          {entry.submission_count} submission{entry.submission_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Rest of leaderboard */}
              {leaderboard.length > 3 && (
                <div className="leaderboard-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Trainer</th>
                        <th>Damage</th>
                        <th>Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(3).map((entry) => (
                        <tr key={`${entry.user_id}-${entry.trainer_id}`}>
                          <td className="rank-cell">#{entry.rank}</td>
                          <td className="trainer-cell">
                            <div className="trainer-info-row">
                              {entry.trainer_avatar ? (
                                <img 
                                  src={entry.trainer_avatar} 
                                  alt={entry.trainer_name || entry.username}
                                  className="trainer-avatar-small"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/default_avatar.png';
                                  }}
                                />
                              ) : (
                                <div className="avatar-placeholder-small">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              <span className="trainer-name">
                                {entry.trainer_name || entry.username || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="damage-cell">{entry.total_damage.toLocaleString()}</td>
                          <td className="submissions-cell">{entry.submission_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="no-leaderboard">
              <p>No damage has been dealt to this boss yet. Be the first to submit artwork!</p>
            </div>
          )}
        </div>
      </div>

      {/* Reward Claiming Modal */}
      <Modal
        isOpen={showRewardModal}
        onClose={closeRewardModal}
        title="Claim Your Boss Reward!"
        size="large"
      >
        {currentReward && (
          <div className="reward-claim-modal">
            <div className="reward-info">
              <div className="reward-boss-info">
                <img 
                  src={currentReward.boss_image || '/images/default_boss.png'} 
                  alt={currentReward.boss_name}
                  className="reward-boss-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_boss.png';
                  }}
                />
                <div className="reward-details">
                  <h3>{currentReward.boss_name}</h3>
                  <div className="reward-type">
                    {currentReward.reward_type === 'boss_monster' ? (
                      <>
                        <i className="fas fa-crown"></i>
                        <span>Boss Monster Reward (1st Place)</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-gift"></i>
                        <span>Grunt Monster Reward (Participant)</span>
                      </>
                    )}
                  </div>
                  <div className="reward-stats">
                    <span>🗡️ Damage Dealt: {currentReward.damage_dealt?.toLocaleString() || 0}</span>
                    <span>🏆 Rank: #{currentReward.rank_position}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monster Preview Section */}
            {currentReward.monster_data ? (
              <div className="monster-preview-section">
                <h4 className="monster-preview-title">
                  <i className="fas fa-dragon"></i>
                  Monster Preview: {currentReward.monster_data.name}
                </h4>
                <div className="monster-preview-card">
                  <div className="monster-attributes">
                    <div className="attribute-section">
                      <h5><i className="fas fa-dna"></i> Species</h5>
                      <div className="attribute-tags">
                        {currentReward.monster_data.species && currentReward.monster_data.species.map((species, index) => (
                          <span key={index} className="attribute-tag species-tag">
                            {species}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attribute-section">
                      <h5><i className="fas fa-magic"></i> Types</h5>
                      <div className="attribute-tags">
                        {currentReward.monster_data.types && currentReward.monster_data.types.map((type, index) => (
                          <span key={index} className="attribute-tag type-tag">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attribute-section">
                      <h5><i className="fas fa-star"></i> Attribute</h5>
                      <div className="attribute-tags">
                        <span className="attribute-tag primary-attribute-tag">
                          {currentReward.monster_data.attribute}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="monster-preview-section">
                <h4 className="monster-preview-title">
                  <i className="fas fa-exclamation-circle"></i>
                  Monster Preview Unavailable
                </h4>
                <p>Monster data not found for this reward.</p>
              </div>
            )}

            <div className="claim-form">
              <div className="form-group">
                <label htmlFor="monster-name">Name your new monster:</label>
                <input
                  type="text"
                  id="monster-name"
                  value={monsterName}
                  onChange={(e) => setMonsterName(e.target.value)}
                  placeholder="Enter monster name..."
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="trainer-select">Assign to trainer:</label>
                <select
                  id="trainer-select"
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                >
                  <option value="">Select a trainer</option>
                  {userTrainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
              </div>

              {rewardError && (
                <div className="reward-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{rewardError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className="button secondary"
                  onClick={closeRewardModal}
                  disabled={claimingReward}
                >
                  Cancel
                </button>
                <button 
                  className="button primary"
                  onClick={submitRewardClaim}
                  disabled={claimingReward || !monsterName.trim() || !selectedTrainer}
                >
                  {claimingReward ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Claiming...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trophy"></i> Claim Reward
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BossViewPage;
