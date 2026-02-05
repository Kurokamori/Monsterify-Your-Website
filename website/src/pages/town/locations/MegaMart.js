import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import trainerService from '../../../services/trainerService';
import megaMartService from '../../../services/megaMartService';
import monsterService from '../../../services/monsterService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import MonsterCard from '../../../components/monsters/MonsterCard';
import MonsterSelector from '../../../components/monsters/MonsterSelector';
import Modal from '../../../components/common/Modal';
import TrainerSelector from '../../../components/common/TrainerSelector';
import TypeBadge from '../../../components/monsters/TypeBadge';
import AttributeBadge from '../../../components/monsters/AttributeBadge';


const MegaMart = () => {
  const { isAuthenticated, currentUser } = useAuth();


  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [monsterAbilities, setMonsterAbilities] = useState(null);
  const [monsterSearchTerm, setMonsterSearchTerm] = useState('');
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const [allAbilities, setAllAbilities] = useState([]);
  const [isAbilityCapsuleModalOpen, setIsAbilityCapsuleModalOpen] = useState(false);
  const [isScrollOfSecretsModalOpen, setIsScrollOfSecretsModalOpen] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState('');
  const [selectedAbilitySlot, setSelectedAbilitySlot] = useState('ability1');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [trainerInventory, setTrainerInventory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAbilities, setFilteredAbilities] = useState([]);


  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setUserTrainers(response.trainers || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user trainers:', error);
        setError('Failed to load trainers. Please try again.');
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated, currentUser]);

  // Fetch trainer monsters when trainer is selected
  useEffect(() => {
    const fetchTrainerMonsters = async () => {
      if (!selectedTrainer) return;

      try {
        setLoading(true);
        const response = await api.get(`/trainers/${selectedTrainer}/monsters`);
        const monsters = response.data.monsters || [];
        setTrainerMonsters(monsters);
        setFilteredMonsters(monsters);

        // Also fetch trainer inventory
        const inventoryResponse = await api.get(`/trainers/${selectedTrainer}/inventory`);
        setTrainerInventory(inventoryResponse.data.inventory || {});
      } catch (err) {
        console.error('Error fetching trainer monsters:', err);
        setError('Failed to load monsters. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerMonsters();
  }, [selectedTrainer]);

  // Filter monsters based on search term
  useEffect(() => {
    if (monsterSearchTerm.trim() === '') {
      setFilteredMonsters(trainerMonsters);
    } else {
      const filtered = trainerMonsters.filter(monster =>
        monster.name.toLowerCase().includes(monsterSearchTerm.toLowerCase()) ||
        (monster.species && monster.species.some(s =>
          s.toLowerCase().includes(monsterSearchTerm.toLowerCase())
        )) ||
        (monster.types && monster.types.some(t =>
          t.toLowerCase().includes(monsterSearchTerm.toLowerCase())
        ))
      );
      setFilteredMonsters(filtered);
    }
  }, [monsterSearchTerm, trainerMonsters]);

  // Handle monster search
  const handleMonsterSearch = (e) => {
    setMonsterSearchTerm(e.target.value);
  };

  // Fetch all abilities
  useEffect(() => {
    const fetchAllAbilities = async () => {
      try {
        const response = await megaMartService.getAllAbilities({ limit: 100 });
        setAllAbilities(response.data || []);
        setFilteredAbilities(response.data || []);
      } catch (err) {
        console.error('Error fetching abilities:', err);
      }
    };

    fetchAllAbilities();
  }, []);

  // Filter abilities based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAbilities(allAbilities);
    } else {
      const filtered = allAbilities.filter(ability =>
        ability.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ability.effect && ability.effect.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAbilities(filtered);
    }
  }, [searchTerm, allAbilities]);

  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
    setSelectedMonster(null);
    setMonsterAbilities(null);
  };

  const handleMonsterSelect = async (monster) => {
    // If the monster is already selected, don't do anything (prevents showing detail view)
    if (selectedMonster && selectedMonster.id === monster.id) {
      return;
    }

    setSelectedMonster(monster);

    try {
      // Don't set loading state for this quick operation
      const response = await megaMartService.getMonsterAbilities(monster.id);
      setMonsterAbilities(response.abilities);
    } catch (err) {
      console.error('Error fetching monster abilities:', err);
      setError('Failed to load monster abilities. Please try again later.');
    }
  };

  const handleUseAbilityCapsule = () => {
    if (!selectedMonster || !monsterAbilities) return;

    // Check if monster has both ability1 and ability2
    if (!monsterAbilities.ability1 || !monsterAbilities.ability2) {
      setActionError('This monster does not have both primary and secondary abilities.');
      return;
    }

    // Check if trainer has an ability capsule
    const items = trainerInventory.items || {};
    if (!items['Ability Capsule'] || items['Ability Capsule'] < 1) {
      setActionError('You do not have any Ability Capsules.');
      return;
    }

    setIsAbilityCapsuleModalOpen(true);
    setActionError(null);
    setActionSuccess(false);
  };

  const handleUseScrollOfSecrets = () => {
    if (!selectedMonster || !monsterAbilities) return;

    // Check if trainer has a scroll of secrets
    const items = trainerInventory.items || {};
    if (!items['Scroll of Secrets'] || items['Scroll of Secrets'] < 1) {
      setActionError('You do not have any Scrolls of Secrets.');
      return;
    }

    setIsScrollOfSecretsModalOpen(true);
    setSelectedAbility('');
    setSelectedAbilitySlot('ability1');
    setActionError(null);
    setActionSuccess(false);
  };

  const confirmUseAbilityCapsule = async () => {
    try {
      setLoading(true);

      const response = await megaMartService.useAbilityCapsule(
        selectedMonster.id,
        selectedTrainer
      );

      setMonsterAbilities(response.abilities);
      setActionSuccess(true);

      // Update inventory
      const inventoryResponse = await api.get(`/trainers/${selectedTrainer}/inventory`);
      setTrainerInventory(inventoryResponse.data.inventory || {});
    } catch (err) {
      console.error('Error using ability capsule:', err);
      setActionError(err.response?.data?.message || 'Failed to use Ability Capsule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmUseScrollOfSecrets = async () => {
    if (!selectedAbility) {
      setActionError('Please select an ability.');
      return;
    }

    try {
      setLoading(true);

      const response = await megaMartService.useScrollOfSecrets(
        selectedMonster.id,
        selectedTrainer,
        selectedAbility,
        selectedAbilitySlot
      );

      setMonsterAbilities(response.abilities);
      setActionSuccess(true);

      // Update inventory
      const inventoryResponse = await api.get(`/trainers/${selectedTrainer}/inventory`);
      setTrainerInventory(inventoryResponse.data.inventory || {});
    } catch (err) {
      console.error('Error using scroll of secrets:', err);
      setActionError(err.response?.data?.message || 'Failed to use Scroll of Secrets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeAbilityCapsuleModal = () => {
    setIsAbilityCapsuleModalOpen(false);
    setActionSuccess(false);
    setActionError(null);
  };

  const closeScrollOfSecretsModal = () => {
    setIsScrollOfSecretsModalOpen(false);
    setActionSuccess(false);
    setActionError(null);
  };

  if (loading && !isAbilityCapsuleModalOpen && !isScrollOfSecretsModalOpen) {
    return <LoadingSpinner message="Loading Mega Mart..." />;
  }

  return (
    <div className="mega-mart-container">
      <div className="location-header">
        <h2>Mega Mart</h2>
        <p className="town-location-description">
          Welcome to the Mega Mart! Here you can use special items to modify your monsters' abilities.
        </p>
      </div>

      <div className="trainer-selection">
        <TrainerSelector
          trainers={userTrainers}
          selectedTrainerId={selectedTrainer}
          onChange={handleTrainerChange}
        />
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {actionError && (
        <div className="action-error">
          <p>{actionError}</p>
          <button onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      <div className="mega-mart-content">
        <div className="monster-selection">
          <MonsterSelector
            monsters={filteredMonsters}
            selectedMonster={selectedMonster}
            onSelectMonster={handleMonsterSelect}
            title="Select a Monster"
            searchPlaceholder="Search monsters by name, species, or type..."
            emptyMessage="No monsters found for this trainer."
          />
        </div>

        {selectedMonster && monsterAbilities ? (
          <div className="monster-display">
            <h3>Selected Monster</h3>
            <div className="monster-info">
              <div className="monster-info-header">
                <h4>{selectedMonster.name}</h4>
              </div>

              <div className="monster-info-details">
                {selectedMonster.species && selectedMonster.species.length > 0 && (
                  <div className="monster-species">
                    {selectedMonster.species.slice(0, 3).map((species, index) => (
                      <span key={index} className="species-badge">{species}</span>
                    ))}
                  </div>
                )}

                {selectedMonster.types && selectedMonster.types.length > 0 && (
                  <div className="monster-types">
                    {selectedMonster.types.slice(0, 5).map((type, index) => (
                      <TypeBadge key={index} type={type} />
                    ))}
                  </div>
                )}

                {selectedMonster.attribute && (
                  <div className="monster-attribute">
                    <AttributeBadge attribute={selectedMonster.attribute} />
                  </div>
                )}
              </div>
            </div>

            <div className="abilities-container">
              <div className="ability-card">
                <h4>Primary Ability</h4>
                <p className="ability-name">{monsterAbilities.ability1?.name || 'None'}</p>
                <p className="ability-description">{monsterAbilities.ability1?.effect || 'No description available'}</p>
              </div>

              <div className="ability-card">
                <h4>Secondary Ability</h4>
                <p className="ability-name">{monsterAbilities.ability2?.name || 'None'}</p>
                <p className="ability-description">{monsterAbilities.ability2?.effect || 'No description available'}</p>
              </div>

              {monsterAbilities.hidden_ability && (
                <div className="ability-card hidden">
                  <h4>Hidden Ability</h4>
                  <p className="ability-name">{monsterAbilities.hidden_ability.name}</p>
                  <p className="ability-description">{monsterAbilities.hidden_ability.effect}</p>
                </div>
              )}
            </div>

            <div className="ability-actions">
              <button
                className="button button-primary"
                onClick={handleUseAbilityCapsule}
                disabled={!monsterAbilities.ability1 || !monsterAbilities.ability2}
              >
                Use Ability Capsule
                <span className="item-count">
                  {trainerInventory?.items?.['Ability Capsule'] || 0} available
                </span>
              </button>

              <button
                className="button button-primary"
                onClick={handleUseScrollOfSecrets}
              >
                Use Scroll of Secrets
                <span className="item-count">
                  {trainerInventory?.items?.['Scroll of Secrets'] || 0} available
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="monster-display empty-display">
            <div className="empty-display-message">
              <i className="fas fa-paw"></i>
              <h3>Select a Monster</h3>
              <p>Choose a monster from the list to view and modify its abilities</p>
            </div>
          </div>
        )}
      </div>

      {/* Ability Capsule Modal */}
      <Modal
        isOpen={isAbilityCapsuleModalOpen}
        onClose={closeAbilityCapsuleModal}
        title={actionSuccess ? "Ability Capsule Used!" : "Use Ability Capsule"}
      >
        {actionSuccess ? (
          <div className="success-message">
            <p>The Ability Capsule has been used successfully!</p>
            <p>The monster's abilities have been swapped.</p>
            <button
              className="modal-button primary"
              onClick={closeAbilityCapsuleModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="ability-capsule-modal">
            <p>
              Using an Ability Capsule will swap your monster's primary and secondary abilities.
              This action cannot be undone.
            </p>

            <div className="ability-swap-preview">
              <div className="ability-preview">
                <h4>Current Primary Ability</h4>
                <p>{monsterAbilities?.ability1?.name}</p>
              </div>

              <div className="swap-icon">
                <i className="fas fa-exchange-alt"></i>
              </div>

              <div className="ability-preview">
                <h4>Current Secondary Ability</h4>
                <p>{monsterAbilities?.ability2?.name}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-button secondary"
                onClick={closeAbilityCapsuleModal}
              >
                Cancel
              </button>

              <button
                className="modal-button primary"
                onClick={confirmUseAbilityCapsule}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Use Ability Capsule'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Scroll of Secrets Modal */}
      <Modal
        isOpen={isScrollOfSecretsModalOpen}
        onClose={closeScrollOfSecretsModal}
        title={actionSuccess ? "Scroll of Secrets Used!" : "Use Scroll of Secrets"}
      >
        {actionSuccess ? (
          <div className="success-message">
            <p>The Scroll of Secrets has been used successfully!</p>
            <p>The monster's ability has been changed.</p>
            <button
              className="modal-button primary"
              onClick={closeScrollOfSecretsModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="scroll-of-secrets-modal">
            <p>
              Using a Scroll of Secrets will change one of your monster's abilities to any ability of your choice.
              This action cannot be undone.
            </p>

            <div className="ability-slot-selection">
              <label>Select ability slot to change:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="abilitySlot"
                    value="ability1"
                    checked={selectedAbilitySlot === 'ability1'}
                    onChange={() => setSelectedAbilitySlot('ability1')}
                  />
                  Primary Ability ({monsterAbilities?.ability1?.name})
                </label>

                <label>
                  <input
                    type="radio"
                    name="abilitySlot"
                    value="ability2"
                    checked={selectedAbilitySlot === 'ability2'}
                    onChange={() => setSelectedAbilitySlot('ability2')}
                  />
                  Secondary Ability ({monsterAbilities?.ability2?.name})
                </label>
              </div>
            </div>

            <div className="ability-search">
              <label>Search for an ability:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or effect..."
              />
            </div>

            <div className="ability-list">
              {filteredAbilities.length === 0 ? (
                <p>No abilities found matching your search.</p>
              ) : (
                filteredAbilities.map(ability => (
                  <div
                    key={ability.name}
                    className={`ability-option ${selectedAbility === ability.name ? 'selected' : ''}`}
                    onClick={() => setSelectedAbility(ability.name)}
                  >
                    <h4>{ability.name}</h4>
                    <p>{ability.effect}</p>
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions">
              <button
                className="modal-button secondary"
                onClick={closeScrollOfSecretsModal}
              >
                Cancel
              </button>

              <button
                className="modal-button primary"
                onClick={confirmUseScrollOfSecrets}
                disabled={loading || !selectedAbility}
              >
                {loading ? 'Processing...' : 'Use Scroll of Secrets'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MegaMart;
