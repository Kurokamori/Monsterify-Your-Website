import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';


const BossBattlesPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/adventures/boss/available" replace />} />
      <Route path="available" element={<AvailableBosses />} />
      <Route path="active" element={<ActiveBosses />} />
      <Route path="defeated" element={<DefeatedBosses />} />
      <Route path=":bossId" element={<BossDetail />} />
    </Routes>
  );
};

// Navigate component for redirection
const Navigate = ({ to, replace }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  
  return null;
};

// Available Bosses Component
const AvailableBosses = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [challengeError, setChallengeError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);

  useEffect(() => {
    fetchBosses();
  }, []);

  const fetchBosses = async () => {
    try {
      setLoading(true);
      
      // Fetch available bosses
      const bossesResponse = await api.get('/bosses/available');
      setBosses(bossesResponse.data.bosses || []);
      
      // Fetch user's trainers
      const trainersResponse = await api.get('/trainers/user');
      setUserTrainers(trainersResponse.data.trainers || []);
      
      if (trainersResponse.data.trainers && trainersResponse.data.trainers.length > 0) {
        setSelectedTrainer(trainersResponse.data.trainers[0].id);
      }
      
      // Fetch user's monsters
      const monstersResponse = await api.get('/monsters/user');
      setUserMonsters(monstersResponse.data.monsters || []);
      
    } catch (err) {
      console.error('Error fetching available bosses:', err);
      setError('Failed to load available bosses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeClick = (boss) => {
    setSelectedBoss(boss);
    setIsChallengeModalOpen(true);
    setChallengeError(null);
    setSelectedMonsters([]);
  };

  const handleMonsterSelect = (monsterId) => {
    setSelectedMonsters(prev => {
      // If already selected, remove it
      if (prev.includes(monsterId)) {
        return prev.filter(id => id !== monsterId);
      }
      
      // If we already have max monsters selected, don't add more
      if (prev.length >= 3) {
        return prev;
      }
      
      // Add the monster
      return [...prev, monsterId];
    });
  };

  const handleChallengeBoss = async () => {
    if (!selectedTrainer) {
      setChallengeError('Please select a trainer.');
      return;
    }
    
    if (selectedMonsters.length === 0) {
      setChallengeError('Please select at least one monster for your team.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to challenge boss
      await api.post(`/bosses/challenge/${selectedBoss.id}`, {
        trainer_id: selectedTrainer,
        monster_ids: selectedMonsters
      });
      
      setChallengeSuccess(true);
      
    } catch (err) {
      console.error('Error challenging boss:', err);
      setChallengeError(err.response?.data?.message || 'Failed to challenge boss. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeChallengeModal = () => {
    setIsChallengeModalOpen(false);
    
    if (challengeSuccess) {
      navigate('/adventures/boss/active');
    }
    
    setSelectedBoss(null);
    setChallengeSuccess(false);
    setChallengeError(null);
    setSelectedMonsters([]);
  };

  // Fallback data for development
  const fallbackBosses = [
    {
      id: 1,
      name: 'Dragon Lord',
      image_path: 'https://via.placeholder.com/300/1e2532/d6a339?text=Dragon+Lord',
      level: 50,
      difficulty: 'hard',
      element: 'Fire',
      description: 'A powerful dragon that rules over the volcanic mountains. Bring water and ice type monsters.',
      weaknesses: ['Water', 'Ice'],
      resistances: ['Fire', 'Grass'],
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 2000 },
        { type: 'exp', name: 'Experience', quantity: 1000 },
        { type: 'item', name: 'Dragon Scale', quantity: 1 }
      ]
    },
    {
      id: 2,
      name: 'Forest Guardian',
      image_path: 'https://via.placeholder.com/300/1e2532/d6a339?text=Forest+Guardian',
      level: 35,
      difficulty: 'medium',
      element: 'Grass',
      description: 'A mystical creature that protects the ancient forest. Vulnerable to fire and flying attacks.',
      weaknesses: ['Fire', 'Flying', 'Ice'],
      resistances: ['Water', 'Grass', 'Electric'],
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 1200 },
        { type: 'exp', name: 'Experience', quantity: 600 },
        { type: 'item', name: 'Leaf Stone', quantity: 1 }
      ]
    },
    {
      id: 3,
      name: 'Sea Serpent',
      image_path: 'https://via.placeholder.com/300/1e2532/d6a339?text=Sea+Serpent',
      level: 40,
      difficulty: 'medium',
      element: 'Water',
      description: 'A massive serpent that lurks in the depths of the ocean. Electric attacks are super effective.',
      weaknesses: ['Electric', 'Grass'],
      resistances: ['Water', 'Fire', 'Ice'],
      rewards: [
        { type: 'coin', name: 'Coins', quantity: 1500 },
        { type: 'exp', name: 'Experience', quantity: 750 },
        { type: 'item', name: 'Water Stone', quantity: 1 }
      ]
    }
  ];

  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum'
    },
    {
      id: 2,
      name: 'Misty'
    }
  ];

  const fallbackMonsters = [
    {
      id: 1,
      name: 'Leafeon',
      image_path: 'https://via.placeholder.com/100/1e2532/d6a339?text=Leafeon',
      level: 25,
      types: ['Grass']
    },
    {
      id: 2,
      name: 'Flameon',
      image_path: 'https://via.placeholder.com/100/1e2532/d6a339?text=Flameon',
      level: 27,
      types: ['Fire']
    },
    {
      id: 3,
      name: 'Aqueon',
      image_path: 'https://via.placeholder.com/100/1e2532/d6a339?text=Aqueon',
      level: 22,
      types: ['Water']
    },
    {
      id: 4,
      name: 'Zappeon',
      image_path: 'https://via.placeholder.com/100/1e2532/d6a339?text=Zappeon',
      level: 24,
      types: ['Electric']
    }
  ];

  const displayBosses = bosses.length > 0 ? bosses : fallbackBosses;
  const displayTrainers = userTrainers.length > 0 ? userTrainers : fallbackTrainers;
  const displayMonsters = userMonsters.length > 0 ? userMonsters : fallbackMonsters;

  if (loading && !isChallengeModalOpen) {
    return <LoadingSpinner message="Loading available bosses..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchBosses}
      />
    );
  }

  return (
    <div className="bosses-page">
      <div className="type-tags">
        <Link to="/adventures/boss/available" className="button active">
          Available Bosses
        </Link>
        <Link to="/adventures/boss/active" className="button">
          Active Battles
        </Link>
        <Link to="/adventures/boss/defeated" className="button">
          Defeated Bosses
        </Link>
      </div>

      <div className="bosses-list">
        {displayBosses.map((boss) => (
          <div className="boss-card" key={boss.id}>
            <div className="boss-image-container">
              <img
                src={boss.image_path}
                alt={boss.name}
                className="boss-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_boss.png';
                }}
              />
              <div className={`boss-difficulty${boss.difficulty}`}>
                {boss.difficulty.charAt(0).toUpperCase() + boss.difficulty.slice(1)}
              </div>
            </div>
            <div className="boss-info">
              <h3 className="boss-name">{boss.name}</h3>
              <div className="type-tags">
                <span className="boss-level">
                  <i className="fas fa-bolt"></i> Level {boss.level}
                </span>
                <span className="boss-element">
                  <i className="fas fa-fire-alt"></i> {boss.element} Type
                </span>
              </div>
              <p className="boss-description">{boss.description}</p>
              
              <div className="boss-attributes">
                <div className="boss-weaknesses">
                  <span className="attribute-label">Weaknesses:</span>
                  <div className="attribute-list">
                    {boss.weaknesses.map((weakness, index) => (
                      <span className={`type-badge type-${weakness.toLowerCase()}`} key={index}>
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="boss-resistances">
                  <span className="attribute-label">Resistances:</span>
                  <div className="attribute-list">
                    {boss.resistances.map((resistance, index) => (
                      <span className={`type-badge type-${resistance.toLowerCase()}`} key={index}>
                        {resistance}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="boss-rewards">
                <span className="rewards-label">Rewards:</span>
                <div className="rewards-list">
                  {boss.rewards.map((reward, index) => (
                    <span className="reward" key={index}>
                      <i className={`fas${
                        reward.type === 'coin' ? 'fa-coins' : 
                        reward.type === 'exp' ? 'fa-star' : 
                        'fa-box'
                      }`}></i> {reward.quantity} {reward.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="boss-actions">
                <button 
                  className="button primary"
                  onClick={() => handleChallengeClick(boss)}
                >
                  <i className="fas fa-dragon"></i> Challenge Boss
                </button>
                <Link 
                  to={`/adventures/boss/${boss.id}`} 
                  className="button secondary"
                >
                  <i className="fas fa-info-circle"></i> View Details
                </Link>
              </div>
            </div>
          </div>
        ))}

        {displayBosses.length === 0 && (
          <div className="no-bosses">
            <i className="fas fa-dragon"></i>
            <p>There are no available bosses at this time. Check back later!</p>
          </div>
        )}
      </div>

      {/* Challenge Boss Modal */}
      <Modal
        isOpen={isChallengeModalOpen}
        onClose={closeChallengeModal}
        title={challengeSuccess ? "Boss Challenge Started!" : "Challenge Boss"}
      >
        {challengeSuccess ? (
          <div className="challenge-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              You have successfully challenged {selectedBoss?.name}!
              Head to Active Battles to track your progress.
            </p>
            <button 
              className="button primary"
              onClick={closeChallengeModal}
            >
              Go to Active Battles
            </button>
          </div>
        ) : (
          <>
            {selectedBoss && (
              <div className="challenge-form">
                <div className="boss-preview">
                  <img
                    src={selectedBoss.image_path}
                    alt={selectedBoss.name}
                    className="boss-preview-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_boss.png';
                    }}
                  />
                  <div className="boss-preview-info">
                    <h3>{selectedBoss.name}</h3>
                    <div className="boss-preview-details">
                      <span className="boss-level">Level {selectedBoss.level}</span>
                      <span className={`boss-difficulty${selectedBoss.difficulty}`}>
                        {selectedBoss.difficulty.charAt(0).toUpperCase() + selectedBoss.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="boss-preview-weaknesses">
                      <span>Weaknesses:</span>
                      <div className="attribute-list">
                        {selectedBoss.weaknesses.map((weakness, index) => (
                          <span className={`type-badge type-${weakness.toLowerCase()}`} key={index}>
                            {weakness}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="missions-filters">
                  <label>Select Trainer:</label>
                  <select
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                  >
                    <option value="">Select a trainer</option>
                    {displayTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="monster-selector">
                  <label>Select Your Team (up to 3 monsters):</label>
                  <div className="button">
                    {displayMonsters.map((monster) => (
                      <div 
                        key={monster.id}
                        className={`monster-select-card ${selectedMonsters.includes(monster.id) ? 'selected' : ''}`}
                        onClick={() => handleMonsterSelect(monster.id)}
                      >
                        <div className="monster-select-image">
                          <img
                            src={monster.image_path}
                            alt={monster.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_mon.png';
                            }}
                          />
                        </div>
                        <div className="monster-select-info">
                          <div className="monster-select-name">{monster.name}</div>
                          <div className="monster-select-details">
                            <span>Lv. {monster.level}</span>
                            <div className="monster-select-types">
                              {monster.types.map((type, index) => (
                                <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selectedMonsters.includes(monster.id) && (
                          <div className="monster-selected-badge">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {challengeError && (
                  <div className="challenge-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{challengeError}</span>
                  </div>
                )}
                
                <div className="challenge-actions">
                  <button 
                    className="button secondary"
                    onClick={closeChallengeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button primary"
                    onClick={handleChallengeBoss}
                    disabled={loading || selectedMonsters.length === 0}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      'Challenge Boss'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

// Active Bosses Component
const ActiveBosses = () => {
  // Similar implementation to AvailableBosses
  // For brevity, showing a simplified version
  return (
    <div className="bosses-page">
      <div className="type-tags">
        <Link to="/adventures/boss/available" className="button">
          Available Bosses
        </Link>
        <Link to="/adventures/boss/active" className="button active">
          Active Battles
        </Link>
        <Link to="/adventures/boss/defeated" className="button">
          Defeated Bosses
        </Link>
      </div>

      <div className="bosses-list">
        <div className="boss-battle-card">
          <div className="battle-status in-progress">
            <i className="fas fa-swords"></i> Battle in Progress
          </div>
          <div className="battle-info">
            <div className="battle-header">
              <h3>Battle against Forest Guardian</h3>
              <span className="battle-time">Started 30 minutes ago</span>
            </div>
            <div className="battle-participants">
              <div className="battle-team">
                <div className="team-header">Your Team</div>
                <div className="team-monsters">
                  <div className="team-monster">
                    <img src="https://via.placeholder.com/60/1e2532/d6a339?text=Flameon" alt="Flameon" />
                    <span>Flameon</span>
                  </div>
                  <div className="team-monster">
                    <img src="https://via.placeholder.com/60/1e2532/d6a339?text=Zappeon" alt="Zappeon" />
                    <span>Zappeon</span>
                  </div>
                </div>
              </div>
              <div className="battle-vs">VS</div>
              <div className="battle-boss">
                <div className="boss-header">Boss</div>
                <div className="boss-monster">
                  <img src="https://via.placeholder.com/100/1e2532/d6a339?text=Forest+Guardian" alt="Forest Guardian" />
                  <span>Forest Guardian</span>
                </div>
              </div>
            </div>
            <div className="battle-progress">
              <div className="progress-header">
                <span>Battle Progress:</span>
                <span>45%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="battle-actions">
              <button className="button primary">
                <i className="fas fa-gamepad"></i> Continue Battle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Defeated Bosses Component
const DefeatedBosses = () => {
  const [defeatedBosses, setDefeatedBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [showRankingsModal, setShowRankingsModal] = useState(false);

  useEffect(() => {
    fetchDefeatedBosses();
  }, []);

  const fetchDefeatedBosses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/bosses/defeated');
      setDefeatedBosses(response.data.data || []);
      
    } catch (err) {
      console.error('Error fetching defeated bosses:', err);
      setError('Failed to load defeated bosses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRankings = async (boss) => {
    try {
      setLoading(true);
      const response = await api.get(`/bosses/defeated/${boss.id}`);
      setSelectedBoss(response.data.data);
      setShowRankingsModal(true);
    } catch (err) {
      console.error('Error fetching boss rankings:', err);
      setError('Failed to load boss rankings.');
    } finally {
      setLoading(false);
    }
  };

  const closeRankingsModal = () => {
    setShowRankingsModal(false);
    setSelectedBoss(null);
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

  if (loading && !showRankingsModal) {
    return <LoadingSpinner message="Loading defeated bosses..." />;
  }

  if (error && !showRankingsModal) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchDefeatedBosses}
      />
    );
  }

  return (
    <div className="bosses-page">
      <div className="type-tags">
        <Link to="/adventures/boss/available" className="button">
          Available Bosses
        </Link>
        <Link to="/adventures/boss/active" className="button">
          Active Battles
        </Link>
        <Link to="/adventures/boss/defeated" className="button active">
          Defeated Bosses
        </Link>
      </div>

      <div className="bosses-list">
        {defeatedBosses.map((boss) => (
          <div className="boss-battle-card defeated-boss-card" key={boss.id}>
            <div className="battle-status defeated">
              <i className="fas fa-trophy"></i> Boss Defeated
            </div>
            
            <div className="set-item">
              <div className="boss-info">
                <h3>Victory against {boss.name}</h3>
                <div className="type-tags">
                  <span className="boss-month">
                    <i className="fas fa-calendar"></i> {boss.month}/{boss.year}
                  </span>
                  {boss.end_date && (
                    <span className="defeat-date">
                      <i className="fas fa-flag-checkered"></i> Defeated {formatDate(boss.end_date)}
                    </span>
                  )}
                  <span className="total-participants">
                    <i className="fas fa-users"></i> {boss.total_participants || 0} Participants
                  </span>
                </div>
              </div>
              
              {boss.image_url && (
                <div className="boss-image-container">
                  <img
                    src={boss.image_url}
                    alt={boss.name}
                    className="defeated-boss-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_boss.png';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Top 3 Rankings Preview */}
            <div className="prize-distribution">
              <h4>🏆 Top Damage Dealers</h4>
              <div className="top-three">
                {boss.top_users && boss.top_users.slice(0, 3).map((user, index) => (
                  <div key={user.user_id} className={`top-user${getRankClass(index + 1)}`}>
                    <div className="rank-badge">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="user-info">
                      <span className="username">{user.username || 'Unknown'}</span>
                      <span className="damage">{user.total_damage?.toLocaleString() || 0} dmg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Distribution Info */}
            <div className="prize-distribution">
              <h4>🎁 Prize Distribution</h4>
              <div className="auth-form">
                <div className="other-prizes">
                  <span className="username">🥇 1st Place:</span>
                  <span className="prize-reward">Boss Monster Reward</span>
                </div>
                <div className="other-prizes">
                  <span className="username">🎉 All Other Participants:</span>
                  <span className="prize-reward">Grunt Monster Reward</span>
                </div>
              </div>
            </div>

            <div className="defeated-boss-actions">
              <button 
                className="button primary"
                onClick={() => handleViewRankings(boss)}
              >
                <i className="fas fa-trophy"></i> View Full Rankings
              </button>
              <Link 
                to={`/adventures/boss/${boss.id}`} 
                className="button secondary"
              >
                <i className="fas fa-info-circle"></i> View Boss Details
              </Link>
            </div>
          </div>
        ))}

        {defeatedBosses.length === 0 && (
          <div className="no-bosses">
            <i className="fas fa-trophy"></i>
            <p>No bosses have been defeated yet. Be part of the first victory!</p>
          </div>
        )}
      </div>

      {/* Full Rankings Modal */}
      <Modal
        isOpen={showRankingsModal}
        onClose={closeRankingsModal}
        title={selectedBoss ? `${selectedBoss.boss.name} - Final Rankings` : 'Boss Rankings'}
      >
        {selectedBoss && (
          <div className="boss-form">
            <div className="boss-info-header">
              <h3>{selectedBoss.boss.name}</h3>
              <div className="type-tags">
                <span><i className="fas fa-calendar"></i> {selectedBoss.boss.month}/{selectedBoss.boss.year}</span>
                <span><i className="fas fa-users"></i> {selectedBoss.total_participants} Participants</span>
                {selectedBoss.boss.end_date && (
                  <span><i className="fas fa-flag-checkered"></i> {formatDate(selectedBoss.boss.end_date)}</span>
                )}
              </div>
            </div>

            <div className="full-leaderboard">
              <h4>🏆 Final Leaderboard</h4>
              <div className="leaderboard-list">
                {selectedBoss.leaderboard.map((entry, index) => (
                  <div key={entry.user_id} className={`leaderboard-entry${getRankClass(index + 1)}`}>
                    <div className="rank">
                      <span className="rank-badge">{getRankIcon(index + 1)}</span>
                    </div>
                    <div className="user-info">
                      <span className="username">{entry.username || 'Unknown'}</span>
                      <span className="damage">{entry.total_damage?.toLocaleString() || 0} damage</span>
                      <span className="submissions">{entry.submission_count || 0} submissions</span>
                    </div>
                    <div className="reward-info">
                      {index === 0 ? (
                        <span className="reward boss-reward">
                          <i className="fas fa-crown"></i> Boss Monster
                        </span>
                      ) : (
                        <span className="reward grunt-reward">
                          <i className="fas fa-gift"></i> Grunt Monster
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="button primary"
                onClick={closeRankingsModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Boss Detail Component
const BossDetail = () => {
  // Implementation similar to EventDetail
  // For brevity, not showing the full implementation
  return (
    <div className="boss-detail-page">
      <h2>Boss Detail Page</h2>
      <p>This page would show detailed information about a specific boss.</p>
    </div>
  );
};

export default BossBattlesPage;
