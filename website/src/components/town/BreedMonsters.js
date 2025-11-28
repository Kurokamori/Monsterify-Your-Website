import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TrainerSelector from '../common/TrainerSelector';
import AdminTrainerSelector from '../admin/AdminTrainerSelector';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import MonsterCard from '../monsters/MonsterCard';
import MonsterSelector from '../monsters/MonsterSelector';
import monsterService from '../../services/monsterService';
import townService from '../../services/townService';
import trainerService from '../../services/trainerService';


const BreedMonsters = ({ onBreedingComplete, onCancel }) => {
  const { currentUser } = useAuth();

  // State for trainer selection
  const [userTrainer, setUserTrainer] = useState(null);
  const [anyTrainer, setAnyTrainer] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);

  // State for monster selection
  const [userTrainerMonsters, setUserTrainerMonsters] = useState([]);
  const [anyTrainerMonsters, setAnyTrainerMonsters] = useState([]);
  const [selectedMonster1, setSelectedMonster1] = useState(null);
  const [selectedMonster2, setSelectedMonster2] = useState(null);

  // State for search
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [filteredMonsters1, setFilteredMonsters1] = useState([]);
  const [filteredMonsters2, setFilteredMonsters2] = useState([]);

  // State for breeding results
  const [breedingResults, setBreedingResults] = useState(null);

  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eligibilityErrors, setEligibilityErrors] = useState({
    monster1: '',
    monster2: ''
  });

  // Fetch user trainers on component mount
  useEffect(() => {
    const fetchUserTrainers = async () => {
      try {
        setLoading(true);
        const response = await trainerService.getUserTrainers(currentUser?.discord_id);
        if (response.success && response.trainers) {
          setUserTrainers(response.trainers);
          if (response.trainers.length > 0) {
            setUserTrainer(response.trainers[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to load trainers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, []);

  // Fetch user trainer monsters when user trainer changes
  useEffect(() => {
    if (!userTrainer) return;

    const fetchUserTrainerMonsters = async () => {
      try {
        setLoading(true);
        const response = await monsterService.getTrainerMonsters(userTrainer);
        if (response.success && response.monsters) {
          setUserTrainerMonsters(response.monsters);
          setFilteredMonsters1(response.monsters);
        }
      } catch (err) {
        console.error(`Error fetching monsters for trainer ${userTrainer}:`, err);
        setError('Failed to load monsters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainerMonsters();
  }, [userTrainer]);

  // Fetch any trainer monsters when any trainer changes
  useEffect(() => {
    if (!anyTrainer) return;

    const fetchAnyTrainerMonsters = async () => {
      try {
        setLoading(true);
        const response = await monsterService.getTrainerMonsters(anyTrainer);
        if (response.success && response.monsters) {
          setAnyTrainerMonsters(response.monsters);
          setFilteredMonsters2(response.monsters);
        }
      } catch (err) {
        console.error(`Error fetching monsters for trainer ${anyTrainer}:`, err);
        setError('Failed to load monsters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnyTrainerMonsters();
  }, [anyTrainer]);

  // Filter monsters based on search term and valid img_link
  useEffect(() => {
    // First filter monsters with valid img_link
    const monstersWithValidImages = userTrainerMonsters.filter(monster => 
      monster.img_link && monster.img_link.trim() !== ''
    );

    if (!searchTerm1.trim()) {
      setFilteredMonsters1(monstersWithValidImages);
      return;
    }

    const filtered = monstersWithValidImages.filter(monster =>
      monster.name.toLowerCase().includes(searchTerm1.toLowerCase()) ||
      (monster.species1 && monster.species1.toLowerCase().includes(searchTerm1.toLowerCase())) ||
      (monster.species2 && monster.species2.toLowerCase().includes(searchTerm1.toLowerCase())) ||
      (monster.species3 && monster.species3.toLowerCase().includes(searchTerm1.toLowerCase()))
    );

    setFilteredMonsters1(filtered);
  }, [searchTerm1, userTrainerMonsters]);

  // Filter monsters based on search term and valid img_link
  useEffect(() => {
    // First filter monsters with valid img_link
    const monstersWithValidImages = anyTrainerMonsters.filter(monster => 
      monster.img_link && monster.img_link.trim() !== ''
    );

    if (!searchTerm2.trim()) {
      setFilteredMonsters2(monstersWithValidImages);
      return;
    }

    const filtered = monstersWithValidImages.filter(monster =>
      monster.name.toLowerCase().includes(searchTerm2.toLowerCase()) ||
      (monster.species1 && monster.species1.toLowerCase().includes(searchTerm2.toLowerCase())) ||
      (monster.species2 && monster.species2.toLowerCase().includes(searchTerm2.toLowerCase())) ||
      (monster.species3 && monster.species3.toLowerCase().includes(searchTerm2.toLowerCase()))
    );

    setFilteredMonsters2(filtered);
  }, [searchTerm2, anyTrainerMonsters]);

  // Check monster eligibility for breeding
  const checkEligibility = async (monsterId, monsterNumber) => {
    try {
      // Get the monster details
      const response = await monsterService.getMonsterById(monsterId);
      const monster = response.data;

      if (!monster) {
        setEligibilityErrors(prev => ({
          ...prev,
          [`monster${monsterNumber}`]: 'Monster not found'
        }));
        return false;
      }

      // Check eligibility with the backend
      const eligibilityResponse = await api.post('/town/farm/breed/check-eligibility', {
        monsterId: monsterId
      });

      if (eligibilityResponse.data && eligibilityResponse.data.success) {
        if (eligibilityResponse.data.eligible) {
          setEligibilityErrors(prev => ({
            ...prev,
            [`monster${monsterNumber}`]: ''
          }));
          return true;
        } else {
          setEligibilityErrors(prev => ({
            ...prev,
            [`monster${monsterNumber}`]: eligibilityResponse.data.reason || 'Not eligible for breeding'
          }));
          return false;
        }
      } else {
        setEligibilityErrors(prev => ({
          ...prev,
          [`monster${monsterNumber}`]: 'Error checking eligibility'
        }));
        return false;
      }
    } catch (err) {
      console.error(`Error checking eligibility for monster ${monsterId}:`, err);
      setEligibilityErrors(prev => ({
        ...prev,
        [`monster${monsterNumber}`]: err.response?.data?.message || 'Error checking eligibility'
      }));
      return false;
    }
  };

  // Handle monster selection
  const handleMonsterSelect = async (monster, monsterNumber) => {
    // If the monster is already selected, don't do anything (prevents showing detail view)
    if ((monsterNumber === 1 && selectedMonster1?.id === monster.id) ||
        (monsterNumber === 2 && selectedMonster2?.id === monster.id)) {
      return;
    }

    if (monsterNumber === 1) {
      setSelectedMonster1(monster);
      await checkEligibility(monster.id, 1);
    } else {
      setSelectedMonster2(monster);
      await checkEligibility(monster.id, 2);
    }
  };

  // Handle breeding
  const handleBreed = async () => {
    if (!userTrainer || !selectedMonster1 || !selectedMonster2) {
      setError('Please select both monsters for breeding');
      return;
    }

    // Check eligibility for both monsters before breeding
    const monster1Eligible = await checkEligibility(selectedMonster1.id, 1);
    const monster2Eligible = await checkEligibility(selectedMonster2.id, 2);

    if (!monster1Eligible || !monster2Eligible) {
      setError('One or both monsters are not eligible for breeding. Please check the eligibility errors.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await townService.breedMonsters(
        userTrainer,
        selectedMonster1.id,
        selectedMonster2.id
      );

      if (response && response.success) {
        // Set breeding results with all data including sessionId and specialBerries
        // Mark all offspring as not claimed by default
        setBreedingResults({
          ...response.data,
          sessionId: response.data.sessionId,
          specialBerries: response.data.specialBerries,
          offspring: response.data.offspring.map(o => ({ ...o, claimed: false })),
          claimedMonsters: response.data.claimedMonsters || []
        });

      } else {
        setError(response.message || 'Breeding failed. Please try again.');
      }
    } catch (err) {
      console.error('Error breeding monsters:', err);
      setError(err.response?.data?.message || 'Breeding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle claiming offspring
  const handleClaimOffspring = async (offspring) => {
    try {
      setLoading(true);

      const offspringIndex = breedingResults.offspring.findIndex(o => o === offspring);

      // Claim the monster using the session-based endpoint
      const response = await api.post('/town/farm/breed/claim', {
        sessionId: breedingResults.sessionId,
        monsterIndex: offspringIndex
      });

      if (response.data && response.data.success) {
        // Update the breeding results to mark this offspring as claimed
        setBreedingResults(prev => ({
          ...prev,
          offspring: prev.offspring.map((o, index) =>
            index === offspringIndex ? { ...o, claimed: true } : o
          ),
          specialBerries: response.data.data.specialBerries,
          claimedMonsters: response.data.data.claimedMonsters
        }));
      } else {
        setError(response.data?.message || 'Failed to claim monster. Please try again.');
      }
    } catch (err) {
      console.error('Error claiming offspring:', err);
      setError(err.response?.data?.message || 'Failed to claim monster. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle rerolling with forget-me-not berry
  const handleRerollOffspring = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/town/farm/breed/reroll', {
        sessionId: breedingResults.sessionId
      });

      if (response.data && response.data.success) {
        // Update breeding results with new offspring
        setBreedingResults(prev => ({
          ...prev,
          offspring: response.data.data.offspring.map(o => ({ ...o, claimed: false })),
          specialBerries: response.data.data.specialBerries,
          claimedMonsters: []
        }));
      } else {
        setError(response.data?.message || 'Failed to reroll offspring. Please try again.');
      }
    } catch (err) {
      console.error('Error rerolling offspring:', err);
      setError(err.response?.data?.message || 'Failed to reroll offspring. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (onBreedingComplete) {
      onBreedingComplete();
    }
  };

  // Render breeding results
  if (breedingResults) {
    return (
      <div className="breeding-results">
        <h2>Breeding Results</h2>

        <div className="breeding-parents">
          <div className="breeding-parent">
            <MonsterCard monster={breedingResults.parent1} linkToDetail={false} fullHeight={true} />
          </div>

          <div className="breeding-parent">
            <MonsterCard monster={breedingResults.parent2} linkToDetail={false} fullHeight={true} />
          </div>
        </div>

        {/* Special Berry Actions */}
        {breedingResults.specialBerries && (
          <div className="special-berry-actions">
            {breedingResults.specialBerries['Forget-Me-Not'] > 0 && (
              <button
                className="btn-special forget-me-not"
                onClick={handleRerollOffspring}
                disabled={loading}
                title="Reroll all offspring using a Forget-Me-Not berry"
              >
                <i className="fas fa-dice"></i> Forget-Me-Not: Reroll all offspring ({breedingResults.specialBerries['Forget-Me-Not']})
              </button>
            )}
          </div>
        )}

        <h3>Offspring ({breedingResults.offspring.length})</h3>
        <div className="breeding-offspring">
          {breedingResults.offspring.map((offspring, index) => (
            <div key={index} className="offspring-card">
              <div className="offspring-details">
                <h4>Species: {offspring.species1} {offspring.species2 ? `/ ${offspring.species2}` : ''} {offspring.species3 ? `/ ${offspring.species3}` : ''}</h4>
                <p>Types: {offspring.type1} {offspring.type2 ? `, ${offspring.type2}` : ''} {offspring.type3 ? `, ${offspring.type3}` : ''}</p>
                <p>Attribute: {offspring.attribute}</p>
              </div>

              <div className="offspring-actions">
                <button
                  className="btn-primary"
                  onClick={() => handleClaimOffspring(offspring)}
                  disabled={offspring.claimed || loading}
                >
                  {offspring.claimed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="breeding-actions">
          <button className="btn-secondary" onClick={handleComplete}>
            Done
          </button>
        </div>

        {error && <ErrorMessage message={error} />}
        {loading && <LoadingSpinner />}
      </div>
    );
  }

  return (
    <div className="breed-monsters-container">
      <h2>Breed Monsters</h2>

      <div className="breeding-form">
        <div className="trainer-selection">
          <div className="trainer-select-container">
            <h3>Your Trainer</h3>
            <TrainerSelector
              selectedTrainerId={userTrainer}
              onChange={setUserTrainer}
            />
          </div>

          <div className="trainer-select-container">
            <h3>Any Trainer</h3>
            <AdminTrainerSelector
              selectedTrainerId={anyTrainer}
              onChange={setAnyTrainer}
            />
          </div>
        </div>

        <div className="monster-selection">
          <div className="monster-select-container">
            <MonsterSelector
              monsters={filteredMonsters1}
              selectedMonster={selectedMonster1}
              onSelectMonster={(monster) => handleMonsterSelect(monster, 1)}
              title="Select Your Monster"
              searchPlaceholder="Search your monsters..."
              errorMessage={eligibilityErrors.monster1}
            />
          </div>

          <div className="monster-select-container">
            <MonsterSelector
              monsters={filteredMonsters2}
              selectedMonster={selectedMonster2}
              onSelectMonster={(monster) => handleMonsterSelect(monster, 2)}
              title="Select Partner Monster"
              searchPlaceholder="Search partner monsters..."
              errorMessage={eligibilityErrors.monster2}
            />
          </div>
        </div>

        <div className="breeding-actions">
          <button
            className="btn-primary"
            onClick={handleBreed}
            disabled={!userTrainer || !selectedMonster1 || !selectedMonster2 || loading}
          >
            Breed Monsters
          </button>

          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner />}
    </div>
  );
};

export default BreedMonsters;
