import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PromptSubmissionForm from '../../components/submissions/PromptSubmissionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import PageHeader from '../../components/layout/PageHeader';
import MonsterCard from '../../components/monsters/MonsterCard';
import MonsterRewardCard from '../../components/town/activities/MonsterRewardCard';
import TrainerAutocomplete from '../../components/common/TrainerAutocomplete';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';

const PromptSubmissionPage = () => {
  const { category = 'general' } = useParams();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [availableBerries, setAvailableBerries] = useState({ 'Forget-Me-Not': 0 });
  const [isRerolling, setIsRerolling] = useState(false);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState({});
  const [monsterNames, setMonsterNames] = useState({});
  const [claimingMonster, setClaimingMonster] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/prompt/' + category);
    }
  }, [isAuthenticated, navigate, category]);

  // Handle submission completion
  const handleSubmissionComplete = (result) => {
    console.log('Submission completed with result:', result);
    setSubmissionResult(result);
    setSuccess(true);
    fetchAvailableBerries(result.submission.trainer_id);
    fetchUserTrainers();
    
    // Initialize monster rewards as unclaimed
    if (result.rewards && result.rewards.monsters) {
      const unclaimedMonsters = result.rewards.monsters.map(monster => ({
        ...monster,
        claimed: false
      }));
      setSubmissionResult(prev => ({
        ...prev,
        rewards: {
          ...prev.rewards,
          monsters: unclaimedMonsters
        }
      }));
    }
    
    window.scrollTo(0, 0);
  };

  // Fetch user trainers
  const fetchUserTrainers = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.discord_id || currentUser.id;
      const response = await trainerService.getUserTrainers(userId);

      let trainersData = [];
      if (response && response.trainers) {
        trainersData = response.trainers;
      } else if (response && response.data) {
        trainersData = Array.isArray(response.data) ? response.data :
                      (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
      }

      setUserTrainers(trainersData);

      // Initialize selected trainers - default to the trainer that made the submission if available
      if (trainersData.length > 0 && submissionResult?.rewards?.monsters) {
        const initialSelectedTrainers = {};
        submissionResult.rewards.monsters.forEach((monster, index) => {
          // Try to use the submission trainer, otherwise use first trainer
          const submissionTrainerId = submissionResult.submission.trainer_id;
          const defaultTrainer = trainersData.find(t => t.id === submissionTrainerId) ? submissionTrainerId : trainersData[0].id;
          initialSelectedTrainers[index] = defaultTrainer;
        });
        setSelectedTrainers(initialSelectedTrainers);
      }
    } catch (error) {
      console.error('Error fetching user trainers:', error);
      setError('Failed to load trainers. Please try again.');
    }
  };

  // Fetch available special berries
  const fetchAvailableBerries = async (trainerId) => {
    if (!trainerId) {
      console.error('No trainer ID provided for berry fetch');
      return;
    }
    
    console.log('Fetching berries for trainer:', trainerId);
    try {
      const response = await submissionService.getAvailableBerries(trainerId);
      console.log('Berry fetch response:', response);
      if (response.success) {
        setAvailableBerries(response.berries);
      }
    } catch (error) {
      console.error('Error fetching berries:', error);
      setError(`Error fetching berries: ${error.message}`);
    }
  };

  // Handle item reroll
  const handleItemReroll = async () => {
    if (!availableBerries['Forget-Me-Not'] || availableBerries['Forget-Me-Not'] <= 0 || !submissionResult) {
      return;
    }

    setIsRerolling(true);
    try {
      const response = await submissionService.rerollItems(submissionResult.submission.id, submissionResult.submission.trainer_id);
      if (response.success) {
        setSubmissionResult(prev => ({
          ...prev,
          rewards: {
            ...prev.rewards,
            items: response.newItems
          }
        }));
        setAvailableBerries(prev => ({
          ...prev,
          'Forget-Me-Not': prev['Forget-Me-Not'] - 1
        }));
      } else {
        setError(response.message || 'Failed to reroll items');
      }
    } catch (error) {
      console.error('Error rerolling items:', error);
      setError('An error occurred while rerolling items');
    } finally {
      setIsRerolling(false);
    }
  };

  // Handle monster reroll
  const handleMonsterReroll = async () => {
    if (!availableBerries['Forget-Me-Not'] || availableBerries['Forget-Me-Not'] <= 0 || !submissionResult) {
      setError('No Forget-Me-Not berries available');
      return;
    }

    if (!submissionResult.rewards.monsters || submissionResult.rewards.monsters.length === 0) {
      setError('No monsters to reroll');
      return;
    }

    // Check if there are any unclaimed monsters to reroll
    const unclaimedMonsters = submissionResult.rewards.monsters.filter(monster => !monster.claimed);
    if (unclaimedMonsters.length === 0) {
      setError('All monsters have been claimed and cannot be rerolled');
      return;
    }

    setIsRerolling(true);
    setError(''); // Clear any existing errors
    
    try {
      console.log('Attempting to reroll unclaimed monsters for submission:', submissionResult.submission.id);
      const response = await submissionService.rerollMonsters(submissionResult.submission.id, submissionResult.submission.trainer_id);
      
      if (response.success) {
        // Update only unclaimed monsters with new rolls, preserve claimed ones
        setSubmissionResult(prev => ({
          ...prev,
          rewards: {
            ...prev.rewards,
            monsters: prev.rewards.monsters.map((monster, index) => {
              if (monster.claimed) {
                // Keep claimed monsters as they are
                return monster;
              } else {
                // Replace with new monster from reroll (matching by index of unclaimed monsters)
                const unclaimedIndex = prev.rewards.monsters.filter(m => !m.claimed).indexOf(monster);
                return response.newMonsters[unclaimedIndex] || monster;
              }
            })
          }
        }));
        
        // Clear names and selections for rerolled monsters
        setMonsterNames(prev => {
          const newNames = { ...prev };
          submissionResult.rewards.monsters.forEach((monster, index) => {
            if (!monster.claimed) {
              delete newNames[index];
            }
          });
          return newNames;
        });
        
        setAvailableBerries(prev => ({
          ...prev,
          'Forget-Me-Not': prev['Forget-Me-Not'] - 1
        }));
        console.log('Successfully rerolled unclaimed monsters');
      } else {
        console.error('Reroll failed:', response.message);
        setError(response.message || 'Failed to reroll monsters');
      }
    } catch (error) {
      console.error('Error rerolling monsters:', error);
      setError(error.response?.data?.message || 'An error occurred while rerolling monsters');
    } finally {
      setIsRerolling(false);
    }
  };

  // Handle trainer selection for a monster
  const handleTrainerSelect = (monsterIndex, trainerId) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [monsterIndex]: trainerId
    }));
  };

  // Handle monster name change
  const handleMonsterNameChange = (monsterIndex, name) => {
    setMonsterNames(prev => ({
      ...prev,
      [monsterIndex]: name
    }));
  };

  // Handle monster claim
  const handleMonsterClaim = async (monsterIndex) => {
    if (!submissionResult?.rewards?.monsters || !submissionResult.rewards.monsters[monsterIndex]) {
      setError('Monster not found');
      return;
    }

    const trainerId = selectedTrainers[monsterIndex];
    const monsterName = monsterNames[monsterIndex];

    if (!trainerId) {
      setError('Please select a trainer for this monster');
      return;
    }

    if (!monsterName || monsterName.trim() === '') {
      setError('Please enter a name for this monster');
      return;
    }

    setClaimingMonster(monsterIndex);
    setError('');

    try {
      // Call the API to actually claim the monster
      const response = await submissionService.claimMonster(
        submissionResult.submission.id,
        trainerId,
        monsterIndex,
        monsterName
      );

      if (response.success) {
        // Update the local state with the claimed monster
        setSubmissionResult(prev => ({
          ...prev,
          rewards: {
            ...prev.rewards,
            monsters: prev.rewards.monsters.map((monster, index) => {
              if (index === monsterIndex) {
                return {
                  ...monster,
                  claimed: true,
                  claimed_by: trainerId,
                  final_name: monsterName,
                  monster_id: response.monster.id
                };
              }
              return monster;
            })
          }
        }));

        console.log(`Monster ${monsterIndex} successfully claimed by trainer ${trainerId} with name "${monsterName}"`);
        console.log('Created monster:', response.monster);
      } else {
        throw new Error(response.message || 'Failed to claim monster');
      }
    } catch (error) {
      console.error('Error claiming monster:', error);
      setError(error.response?.data?.message || error.message || 'Failed to claim monster. Please try again.');
    } finally {
      setClaimingMonster(null);
    }
  };

  // Format category name for display
  const formatCategoryName = (cat) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Reset form
  const handleReset = () => {
    setSuccess(false);
    setSubmissionResult(null);
  };

  if (loading) {
    return (
      <div className="submission-page">
        <PageHeader title={`${formatCategoryName(category)} Prompt Submission`} />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading submission form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-page">
      <PageHeader title={`${formatCategoryName(category)} Prompt Submission`} />
      
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      
      {success ? (
        <div className="submission-success-container">
          <SuccessMessage 
            title="Submission Successful!" 
            message="Your prompt submission has been received successfully!"
          />
          
          {submissionResult && (
            <div className="submission-details">
              <h3>Submission Details</h3>
              <p><strong>Title:</strong> {submissionResult.submission?.title}</p>
              
              {submissionResult.rewards && (
                <div className="rewards-summary">
                  <h4>Rewards Received</h4>
                  <ul>
                    {submissionResult.rewards.levels > 0 && (
                      <li><i className="fas fa-arrow-up"></i> {submissionResult.rewards.levels} trainer levels</li>
                    )}
                    {submissionResult.rewards.coins > 0 && (
                      <li><i className="fas fa-coins"></i> {submissionResult.rewards.coins} coins</li>
                    )}
                    {submissionResult.rewards.items && submissionResult.rewards.items.length > 0 && (
                      <li>
                        <div className="reward-section-header">
                          <i className="fas fa-gift"></i> Items:
                          {submissionResult.rewards.hasRandomItems && (
                            <div className="reroll-controls">
                              <span className="berry-count">
                                <i className="fas fa-leaf"></i> {availableBerries['Forget-Me-Not'] || 0} Forget-Me-Not berries
                              </span>
                              {availableBerries['Forget-Me-Not'] > 0 && (
                                <button
                                  className="button secondary ml-2"
                                  onClick={handleItemReroll}
                                  disabled={isRerolling}
                                  title={`Use 1 Forget-Me-Not berry to reroll items`}
                                >
                                  {isRerolling ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Rerolling...</>
                                  ) : (
                                    <><i className="fas fa-dice"></i> Reroll</>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <ul>
                          {submissionResult.rewards.items.map((item, index) => (
                            <li key={index}>{item.quantity}x {item.item_name} ({item.category})</li>
                          ))}
                        </ul>
                      </li>
                    )}
                    {submissionResult.rewards.monsters && submissionResult.rewards.monsters.length > 0 && (
                      <li>
                        <div className="reward-section-header">
                          <i className="fas fa-dragon"></i> Monsters:
                          {submissionResult.rewards.monsters && submissionResult.rewards.monsters.length > 0 && (
                            <div className="reroll-controls">
                              <span className="berry-count">
                                <i className="fas fa-leaf"></i> {availableBerries['Forget-Me-Not'] || 0} Forget-Me-Not berries
                              </span>
                              {availableBerries['Forget-Me-Not'] > 0 && submissionResult.rewards.monsters.some(monster => !monster.claimed) && (
                                <button
                                  className="button secondary ml-2"
                                  onClick={handleMonsterReroll}
                                  disabled={isRerolling}
                                  title={`Use 1 Forget-Me-Not berry to reroll unclaimed monsters`}
                                >
                                  {isRerolling ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Rerolling...</>
                                  ) : (
                                    <><i className="fas fa-dice"></i> Reroll Unclaimed</>
                                  )}
                                </button>
                              )}
                              {submissionResult.rewards.monsters.every(monster => monster.claimed) && (
                                <span className="reroll-disabled-text">All monsters claimed - reroll unavailable</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="monster-rewards-grid">
                          {submissionResult.rewards.monsters.map((monster, index) => (
                            <div key={index} className="monster-submission-reward">
                              <MonsterCard 
                                monster={monster} 
                                linkToDetail={false} 
                                fullHeight={false}
                              />
                              
                              {!monster.claimed ? (
                                <div className="monster-claim-section">
                                  <div className="monster-name-input">
                                    <label htmlFor={`monster-name-${index}`}>Monster Name:</label>
                                    <input
                                      id={`monster-name-${index}`}
                                      type="text"
                                      value={monsterNames[index] || ''}
                                      onChange={(e) => handleMonsterNameChange(index, e.target.value)}
                                      placeholder="Enter monster name"
                                      className="form-control"
                                    />
                                  </div>

                                  <div className="monster-trainer-select">
                                    <TrainerAutocomplete
                                      trainers={userTrainers}
                                      selectedTrainerId={selectedTrainers[index]}
                                      onSelect={(trainerId) => handleTrainerSelect(index, trainerId)}
                                      label="Trainer"
                                      placeholder="Type to search trainers..."
                                    />
                                  </div>

                                  <button
                                    className="button primary monster-claim-button"
                                    onClick={() => handleMonsterClaim(index)}
                                    disabled={claimingMonster === index || !selectedTrainers[index] || !monsterNames[index]?.trim()}
                                  >
                                    {claimingMonster === index ? (
                                      <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i> Claiming...
                                      </>
                                    ) : (
                                      <>
                                        <i className="fas fa-hand-paper mr-2"></i> Claim Monster
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="monster-claimed-section">
                                  <div className="claimed-badge">
                                    <i className="fas fa-check-circle mr-2"></i>
                                    Claimed by {userTrainers.find(t => t.id === monster.claimed_by)?.name || 'Unknown'}
                                  </div>
                                  {monster.final_name && (
                                    <div className="final-name">
                                      <strong>Name:</strong> {monster.final_name}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </li>
                    )}
                    {submissionResult.rewards.giftLevels > 0 && (
                      <li><i className="fas fa-heart"></i> {submissionResult.rewards.giftLevels} gift levels</li>
                    )}
                    {submissionResult.rewards.cappedLevels > 0 && (
                      <li><i className="fas fa-star"></i> {submissionResult.rewards.cappedLevels} capped levels</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              className="button primary"
              onClick={handleReset}
            >
              Submit Another Prompt
            </button>
            <button
              className="button secondary"
              onClick={() => navigate('/gallery')}
            >
              View Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="submission-form-container">
          <PromptSubmissionForm 
            onSubmissionComplete={handleSubmissionComplete}
            category={category}
          />
        </div>
      )}
    </div>
  );
};

export default PromptSubmissionPage;
