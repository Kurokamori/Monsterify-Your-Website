import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BossService from '../../services/bossService';
import api from '../../services/api';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';

const DefeatedBossDetailPage = () => {
  const { bossId } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bossData, setBossData] = useState(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [monsterName, setMonsterName] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardError, setRewardError] = useState(null);

  useEffect(() => {
    fetchBossDetail();
  }, [bossId]);

  const fetchBossDetail = async () => {
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

      // Fetch defeated boss details
      const response = await BossService.getDefeatedBossById(bossId, currentUser?.id);
      
      if (response.success) {
        setBossData(response.data);
      } else {
        setError('Boss not found or not defeated yet.');
      }
    } catch (err) {
      console.error('Error fetching boss details:', err);
      setError('Failed to load boss details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = () => {
    if (bossData?.userReward && !bossData.userReward.is_claimed) {
      setCurrentReward({
        boss_id: bossData.boss.id,
        boss_name: bossData.boss.name,
        boss_image: bossData.boss.image_url,
        reward_type: bossData.userReward.reward_type,
        damage_dealt: bossData.userReward.damage_dealt,
        rank_position: bossData.userReward.rank_position,
        // Parse monster data from the boss
        monster_data: bossData.userReward.reward_type === 'boss_monster' 
          ? (bossData.boss.reward_monster_data ? JSON.parse(bossData.boss.reward_monster_data) : null)
          : (bossData.boss.grunt_monster_data ? JSON.parse(bossData.boss.grunt_monster_data) : null)
      });
      setMonsterName('');
      setRewardError(null);
      setShowRewardModal(true);
    }
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
        setShowRewardModal(false);
        setCurrentReward(null);
        setMonsterName('');
        
        // Refresh the boss data to update claim status
        fetchBossDetail();
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'rank-first';
      case 2: return 'rank-second';
      case 3: return 'rank-third';
      default: return 'rank-other';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading boss details..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchBossDetail}
      />
    );
  }

  if (!bossData) {
    return (
      <div className="boss-view-page">
        <div className="no-boss-message">
          <h2>Boss Not Found</h2>
          <p>The requested boss could not be found.</p>
        </div>
      </div>
    );
  }

  const { boss, leaderboard, userReward } = bossData;

  return (
    <div className="boss-view-page defeated-boss-detail">
      <div className="boss-header">
        <h1>{boss.name} - Victory Details</h1>
        <p className="boss-subtitle">
          Final rankings and rewards from the defeated boss battle.
        </p>
      </div>

      {/* User Reward Status */}
      {currentUser && userReward && (
        <div className={`user-reward-status ${userReward.is_claimed ? 'claimed' : 'unclaimed'}`}>
          <div className="reward-status-content">
            <div className="reward-status-icon">
              {userReward.is_claimed ? (
                <i className="fas fa-check-circle"></i>
              ) : (
                <i className="fas fa-gift"></i>
              )}
            </div>
            <div className="reward-status-text">
              {userReward.is_claimed ? (
                <>
                  <h3>✅ Reward Claimed!</h3>
                  <p>You've already claimed your {userReward.reward_type === 'boss_monster' ? 'Boss Monster' : 'Grunt Monster'} reward for this battle.</p>
                  {userReward.monster_name && (
                    <p>Monster Name: <strong>{userReward.monster_name}</strong></p>
                  )}
                </>
              ) : (
                <>
                  <h3>🎁 Reward Available!</h3>
                  <p>You have an unclaimed {userReward.reward_type === 'boss_monster' ? 'Boss Monster' : 'Grunt Monster'} reward for this battle.</p>
                  <p>Rank: #{userReward.rank_position} | Damage: {userReward.damage_dealt?.toLocaleString()}</p>
                </>
              )}
            </div>
            {!userReward.is_claimed && (
              <div className="reward-status-actions">
                <button 
                  className="button primary"
                  onClick={handleClaimReward}
                >
                  <i className="fas fa-trophy"></i>
                  Claim Reward
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="boss-content">
        {/* Boss Information Card */}
        <div className="boss-card defeated">
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
            <div className="boss-status defeated">
              <i className="fas fa-trophy"></i>
              Defeated
            </div>
          </div>
          
          <div className="boss-info">
            <h2 className="boss-name">{boss.name}</h2>
            
            {boss.description && (
              <p className="boss-description">{boss.description}</p>
            )}
            
            <div className="boss-stats">
              <div className="boss-stat">
                <span className="stat-label">Battle:</span>
                <span className="stat-value">{boss.month}/{boss.year}</span>
              </div>
              
              <div className="boss-stat">
                <span className="stat-label">Participants:</span>
                <span className="stat-value">{bossData.total_participants || 0}</span>
              </div>
              
              {boss.start_date && (
                <div className="boss-stat">
                  <span className="stat-label">Started:</span>
                  <span className="stat-value">{formatDate(boss.start_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Complete Leaderboard */}
        <div className="leaderboard-card">
          <h3 className="leaderboard-title">
            <i className="fas fa-trophy"></i>
            Final Damage Rankings
          </h3>
          
          {leaderboard && leaderboard.length > 0 ? (
            <div className="leaderboard-content">
              <div className="leaderboard-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Trainer</th>
                      <th>Damage</th>
                      <th>Submissions</th>
                      <th>Reward</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.user_id} className={getRankClass(entry.rank)}>
                        <td className="rank-cell">
                          <span className="rank-badge">{getRankIcon(entry.rank)}</span>
                        </td>
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
                        <td className="damage-cell">{entry.total_damage?.toLocaleString() || 0}</td>
                        <td className="submissions-cell">{entry.submission_count || 0}</td>
                        <td className="reward-cell">
                          {entry.rank === 1 ? (
                            <span className="reward boss-reward">
                              <i className="fas fa-crown"></i> Boss Monster
                            </span>
                          ) : (
                            <span className="reward grunt-reward">
                              <i className="fas fa-gift"></i> Grunt Monster
                            </span>
                          )}
                        </td>
                        <td className="status-cell">
                          {entry.reward_claim ? (
                            entry.reward_claim.is_claimed ? (
                              <span className="status claimed">
                                <i className="fas fa-check"></i> Claimed
                              </span>
                            ) : (
                              <span className="status unclaimed">
                                <i className="fas fa-clock"></i> Pending
                              </span>
                            )
                          ) : (
                            <span className="status no-reward">
                              <i className="fas fa-minus"></i> N/A
                            </span>
                          )}
                          {currentUser && entry.user_id === currentUser.id && entry.reward_claim && !entry.reward_claim.is_claimed && (
                            <button 
                              className="button primary sm"
                              onClick={handleClaimReward}
                            >
                              Claim
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-leaderboard">
              <p>No damage data available for this boss.</p>
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
            {currentReward.monster_data && (
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

export default DefeatedBossDetailPage;