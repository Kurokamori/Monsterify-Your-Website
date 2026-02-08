import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';


/**
 * WitchsHut component for evolving monsters
 * @returns {JSX.Element} - Rendered component
 */
const WitchsHut = () => {
  const { isAuthenticated, currentUser } = useAuth();

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for evolution
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [selectedEvolutionItem, setSelectedEvolutionItem] = useState('');
  const [useDigitalRepairKit, setUseDigitalRepairKit] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [evolutionError, setEvolutionError] = useState('');
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);
  const [evolvedMonster, setEvolvedMonster] = useState(null);

  // State for species selection
  const [selectedSpeciesSlot, setSelectedSpeciesSlot] = useState('species1');
  const [evolutionOptions, setEvolutionOptions] = useState([]);
  const [selectedEvolution, setSelectedEvolution] = useState('');
  const [evolutionPreview, setEvolutionPreview] = useState(null);
  const [loadingEvolutionOptions, setLoadingEvolutionOptions] = useState(false);
  const [customSpeciesName, setCustomSpeciesName] = useState('');

  // State for image submission
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [useVoidStone, setUseVoidStone] = useState(false);

  // State for trainer inventory
  const [trainerInventory, setTrainerInventory] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

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
        let errorMessage = 'Failed to load trainers. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated, currentUser]);

  // Fetch trainer monsters and inventory when trainer is selected
  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!selectedTrainer) {
        setTrainerMonsters([]);
        setFilteredMonsters([]);
        setTrainerInventory(null);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setLoadingInventory(true);

        // Fetch trainer monsters
        const monstersResponse = await monsterService.getTrainerMonsters(selectedTrainer);
        setTrainerMonsters(monstersResponse.monsters || []);
        setFilteredMonsters(monstersResponse.monsters || []);

        // Fetch trainer inventory
        const inventoryResponse = await trainerService.getTrainerInventory(selectedTrainer);
        setTrainerInventory(inventoryResponse.data || {});

        setLoading(false);
        setLoadingInventory(false);
      } catch (error) {
        console.error('Error fetching trainer data:', error);
        let errorMessage = 'Failed to load trainer data. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setLoading(false);
        setLoadingInventory(false);
      }
    };

    fetchTrainerData();
  }, [selectedTrainer]);

  // Filter monsters based on search term and valid img_link
  useEffect(() => {
    // First filter monsters with valid img_link
    const monstersWithValidImages = trainerMonsters.filter(monster => 
      monster.img_link && monster.img_link.trim() !== ''
    );

    if (!searchTerm.trim()) {
      setFilteredMonsters(monstersWithValidImages);
      return;
    }

    const filtered = monstersWithValidImages.filter(monster =>
      monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (monster.species1 && monster.species1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (monster.species2 && monster.species2.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (monster.species3 && monster.species3.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredMonsters(filtered);
  }, [searchTerm, trainerMonsters]);

  // Get trainer by ID
  const getTrainerById = (id) => {
    return userTrainers.find(trainer => trainer.id === parseInt(id));
  };

  // Handle monster selection
  const handleMonsterClick = async (monster) => {
    setSelectedMonster(monster);
    setShowMonsterModal(true);
    setEvolutionSuccess(false);
    setEvolvedMonster(null);
    setEvolutionError('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setUseVoidStone(false);
    setSelectedSpeciesSlot('species1');
    setSelectedEvolution('');
    setSelectedEvolutionItem('');
    setUseDigitalRepairKit(false);
    setEvolutionPreview(null);
    setCustomSpeciesName('');

    // Set default species slot
    if (monster.species1) {
      setSelectedSpeciesSlot('species1');
    }

    // Fetch evolution options for the selected monster's species1
    await fetchEvolutionOptions(monster, 'species1');
  };

  // Fetch evolution options for a monster's species
  const fetchEvolutionOptions = async (monster, speciesSlot) => {
    if (!monster || !monster[speciesSlot]) return;

    try {
      setLoadingEvolutionOptions(true);
      setEvolutionOptions([]);
      setSelectedEvolution('');
      setEvolutionPreview(null);

      // Call the API to get evolution options
      const response = await monsterService.getEvolutionOptions(monster.id, speciesSlot);

      if (response && response.success && response.data) {
        setEvolutionOptions(response.data);

        // If there's only one evolution option, select it automatically
        if (response.data.length === 1) {
          setSelectedEvolution(response.data[0].name);
          await fetchEvolutionPreview(response.data[0].name, response.data[0].type);
        }
      } else {
        // If no evolution options are found, set an empty array
        setEvolutionOptions([]);
        console.log('No evolution options found or invalid response format:', response);
      }

      setLoadingEvolutionOptions(false);
    } catch (error) {
      console.error('Error fetching evolution options:', error);
      let errorMessage = 'Failed to fetch evolution options.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setEvolutionError(errorMessage);
      setEvolutionOptions([]);
      setLoadingEvolutionOptions(false);
    }
  };

  // Fetch preview data for the selected evolution
  const fetchEvolutionPreview = async (evolutionName, evolutionType) => {
    if (!evolutionName) return;

    try {
      // For Pokemon, fetch from fakemon database
      if (evolutionType === 'pokemon') {
        const response = await fakemonService.searchFakemon({ name: evolutionName });

        if (response.success && response.data && response.data.length > 0) {
          setEvolutionPreview(response.data[0]);
        }
      }

      // Similar logic for other monster types

    } catch (error) {
      console.error('Error fetching evolution preview:', error);
    }
  };

  // Close monster modal
  const closeMonsterModal = () => {
    setShowMonsterModal(false);
    setSelectedMonster(null);
    setSelectedEvolutionItem('');
    setUseDigitalRepairKit(false);
    setEvolutionError('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setUseVoidStone(false);
  };

  // Handle image URL change
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImageFile(null);
    setImagePreview(e.target.value);
  };

  // Handle image file change
  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle void stone toggle
  const handleVoidStoneToggle = () => {
    setUseVoidStone(!useVoidStone);
    if (!useVoidStone) {
      setSelectedEvolutionItem('Void Evolution Stone');
    } else if (selectedEvolutionItem === 'Void Evolution Stone') {
      setSelectedEvolutionItem('');
    }
  };

  // Handle species slot change
  const handleSpeciesSlotChange = async (e) => {
    const newSlot = e.target.value;
    setSelectedSpeciesSlot(newSlot);

    // Reset evolution selection
    setSelectedEvolution('');
    setEvolutionPreview(null);

    // Fetch evolution options for the new species slot
    if (selectedMonster && selectedMonster[newSlot]) {
      await fetchEvolutionOptions(selectedMonster, newSlot);
    }
  };

  // Handle evolution selection
  const handleEvolutionSelect = async (evolution) => {
    setSelectedEvolution(evolution.name);
    await fetchEvolutionPreview(evolution.name, evolution.type);
  };

  // Check if trainer has the evolution item
  const hasEvolutionItem = (itemName) => {
    if (!trainerInventory || !trainerInventory.evolution) {
      return false;
    }

    return trainerInventory.evolution[itemName] > 0;
  };

  // Handle evolution
  const handleEvolve = async () => {
    // Validate inputs
    if (!selectedMonster) {
      setEvolutionError('Please select a monster to evolve.');
      return;
    }

    // Check if a species slot is selected
    if (!selectedSpeciesSlot || !selectedMonster[selectedSpeciesSlot]) {
      setEvolutionError('Please select a valid species slot to evolve.');
      return;
    }

    // Check if an evolution is selected or custom species is provided for Digital Repair Kit
    if (!selectedEvolution && !useDigitalRepairKit) {
      setEvolutionError('Please select an evolution or use a Digital Repair Kit.');
      return;
    }

    // Check if custom species name is provided when using Digital Repair Kit
    if (useDigitalRepairKit && !customSpeciesName.trim()) {
      setEvolutionError('Please enter a custom species name when using the Digital Repair Kit.');
      return;
    }

    // Check if image is provided or void stone is used
    if (!imageUrl && !imageFile && !useVoidStone) {
      setEvolutionError('Please provide an image URL, upload an image, or use a Void Evolution Stone.');
      return;
    }

    // Check if the trainer has the selected evolution item
    if (selectedEvolutionItem && !hasEvolutionItem(selectedEvolutionItem) && !useVoidStone) {
      setEvolutionError(`You don't have a ${selectedEvolutionItem} in your inventory.`);
      return;
    }

    try {
      setEvolutionLoading(true);
      setEvolutionError('');

      // Prepare form data for image upload if needed
      let imageData = null;
      if (imageFile && !useVoidStone) {
        const formData = new FormData();
        formData.append('image', imageFile);

        // In a real implementation, you would upload the image here
        // For now, we'll just simulate it
        imageData = { url: URL.createObjectURL(imageFile) };
      }

      // Prepare evolution data
      const evolutionData = {
        monsterId: selectedMonster.id,
        trainerId: parseInt(selectedTrainer),
        speciesSlot: selectedSpeciesSlot,
        evolutionName: selectedEvolution,
        evolutionItem: selectedEvolutionItem,
        imageUrl: useVoidStone ? null : (imageUrl || (imageData ? imageData.url : null)),
        useVoidStone: useVoidStone
      };

      // Call the API to evolve the monster
      try {
        // Prepare evolution data
        const evolutionData = {
          trainerId: parseInt(selectedTrainer),
          speciesSlot: selectedSpeciesSlot,
          evolutionName: useDigitalRepairKit ? customSpeciesName.trim() : selectedEvolution,
          evolutionItem: selectedEvolutionItem,
          imageUrl: useVoidStone ? null : imageUrl,
          useVoidStone: useVoidStone,
          useDigitalRepairKit: useDigitalRepairKit,
          customEvolutionName: useDigitalRepairKit ? customSpeciesName.trim() : null
        };

        console.log('Evolving monster with data:', {
          monsterId: selectedMonster.id,
          ...evolutionData,
          hasImageFile: !!imageFile
        });

        // Call the API
        const response = await monsterService.evolveMonster(
          selectedMonster.id,
          evolutionData,
          useVoidStone ? null : imageFile
        );

        console.log('Evolution response:', response);

        if (response && response.success && response.data) {
          // Refresh the trainer's inventory from server
          try {
            const inventoryResponse = await trainerService.getTrainerInventory(selectedTrainer);
            setTrainerInventory(inventoryResponse.data || {});
            console.log('Inventory refreshed after evolution');
          } catch (inventoryError) {
            console.error('Error refreshing inventory after evolution:', inventoryError);
            // Continue with evolution success even if inventory refresh fails
          }

          // Refresh the trainer monsters list as well since the monster was updated
          try {
            const monstersResponse = await monsterService.getTrainerMonsters(selectedTrainer);
            setTrainerMonsters(monstersResponse.monsters || []);
            setFilteredMonsters(monstersResponse.monsters || []);
            console.log('Monsters list refreshed after evolution');
          } catch (monstersError) {
            console.error('Error refreshing monsters after evolution:', monstersError);
            // Continue with evolution success even if monsters refresh fails
          }

          setEvolvedMonster(response.data);
          setEvolutionSuccess(true);
        } else {
          setEvolutionError((response && response.message) || 'Failed to evolve monster.');
        }
      } catch (error) {
        console.error('Error in evolution process:', error);
        let errorMessage = 'An error occurred during the evolution process.';

        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setEvolutionError(errorMessage);
      } finally {
        setEvolutionLoading(false);
      }

    } catch (error) {
      console.error('Error evolving monster:', error);
      setEvolutionError('An error occurred while evolving the monster.');
      setEvolutionLoading(false);
    }
  };

  return (
    <div className="witchs-hut-container">
            {loading ? (
        <div className="error-container">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="town-square">
          {/* Step 1: Trainer Selection */}
          <div className="evolution-step">
            <div className="step-header">
              <div className="step-number">1</div>
              <h3>Select Your Trainer</h3>
            </div>
            <div className="shop-search">
              <select
                id="trainer-select"
                className="trainer-select"
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
              >
                <option value="">Choose a trainer...</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} {trainer.discord_user_id ? `(Discord: ${trainer.discord_user_id})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTrainer && (
            <>
              {/* Step 2: Monster Selection */}
              <div className="evolution-step">
                <div className="step-header">
                  <div className="step-number">2</div>
                  <h3>Choose Monster to Evolve</h3>
                  <div className="step-subtitle">
                    {filteredMonsters.length} monster{filteredMonsters.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                
                <div className="form-input">
                  <div className="search-input-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      placeholder="Search monsters by name or species..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input"
                    />
                    {searchTerm && (
                      <button 
                        className="button secondary icon sm"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="container grid gap-md">
                  {filteredMonsters.length === 0 ? (
                    <div className="no-results">
                      <i className="fas fa-dragon"></i>
                      <h4>No monsters found</h4>
                      <p>
                        {searchTerm 
                          ? `No monsters match "${searchTerm}". Try a different search term.`
                          : "This trainer doesn't have any monsters yet."
                        }
                      </p>
                    </div>
                  ) : (
                    filteredMonsters.map(monster => (
                      <div
                        key={monster.id}
                        className="monster-card"
                        onClick={() => handleMonsterClick(monster)}
                      >
                        <div className="tree-header">
                          <div className="monster-name">{monster.name}</div>
                          <div className="evolution-badge">
                            <i className="fas fa-magic"></i>
                          </div>
                        </div>
                        <div className="monster-types">
                          {monster.species1}
                          {monster.species2 && ` + ${monster.species2}`}
                          {monster.species3 && ` + ${monster.species3}`}
                        </div>
                        <div className="monster-types">
                          <span className={`type-badge type-${monster.type1?.toLowerCase()}`}>
                            {monster.type1}
                          </span>
                          {monster.type2 && (
                            <span className={`type-badge type-${monster.type2.toLowerCase()}`}>
                              {monster.type2}
                            </span>
                          )}
                          {monster.type3 && (
                            <span className={`type-badge type-${monster.type3.toLowerCase()}`}>
                              {monster.type3}
                            </span>
                          )}
                          {monster.type4 && (
                            <span className={`type-badge type-${monster.type4.toLowerCase()}`}>
                              {monster.type4}
                            </span>
                          )}
                          {monster.type5 && (
                            <span className={`type-badge type-${monster.type5.toLowerCase()}`}>
                              {monster.type5}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Evolution Info - Now contextually placed */}
              <div className="evolution-help">
                <div className="help-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="help-content">
                  <h4>How Evolution Works</h4>
                  <ul>
                    <li>Choose which species slot you want to evolve</li>
                    <li>Select from available evolution options or use a Digital Repair Kit for custom evolution</li>
                    <li>Upload an image or use a Void Stone to bypass the image requirement</li>
                    <li>Optionally use evolution items to add or modify types</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monster Evolution Modal */}
      <Modal
        isOpen={showMonsterModal}
        onClose={closeMonsterModal}
        title={selectedMonster?.name || 'Monster Evolution'}
        className="witchs-hut-modal"
      >
        {selectedMonster && (
          <div className="monster-modal-content">
            {evolutionSuccess ? (
              <div className="success-step">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Evolution Successful!</h3>
                <p>
                  {selectedMonster.name} has evolved successfully!
                  {selectedEvolutionItem && ` The ${selectedEvolutionItem} was used in the evolution.`}
                </p>
                <div className="help-content">
                  <h4>Evolved Monster Details:</h4>
                  <p><strong>Species:</strong> {evolvedMonster.species1}
                    {evolvedMonster.species2 && ` + ${evolvedMonster.species2}`}
                    {evolvedMonster.species3 && ` + ${evolvedMonster.species3}`}
                  </p>
                  <p><strong>Types:</strong> {evolvedMonster.type1}
                    {evolvedMonster.type2 && `, ${evolvedMonster.type2}`}
                    {evolvedMonster.type3 && `, ${evolvedMonster.type3}`}
                    {evolvedMonster.type4 && `, ${evolvedMonster.type4}`}
                    {evolvedMonster.type5 && `, ${evolvedMonster.type5}`}
                  </p>
                  {evolvedMonster.attribute && (
                    <p><strong>Attribute:</strong> {evolvedMonster.attribute}</p>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    className="button primary"
                    onClick={closeMonsterModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="town-square">
                {/* Monster Summary Header */}
                <div className="person-header">
                  <div className="monster-info">
                    <h3>{selectedMonster.name}</h3>
                    <div className="level-display">Level {selectedMonster.level}</div>
                    <div className="species-display">
                      {selectedMonster.species1}
                      {selectedMonster.species2 && ` + ${selectedMonster.species2}`}
                      {selectedMonster.species3 && ` + ${selectedMonster.species3}`}
                    </div>
                    <div className="type-tags">
                      <span className={`type-badge type-${selectedMonster.type1?.toLowerCase()}`}>
                        {selectedMonster.type1}
                      </span>
                      {selectedMonster.type2 && (
                        <span className={`type-badge type-${selectedMonster.type2.toLowerCase()}`}>
                          {selectedMonster.type2}
                        </span>
                      )}
                      {selectedMonster.type3 && (
                        <span className={`type-badge type-${selectedMonster.type3.toLowerCase()}`}>
                          {selectedMonster.type3}
                        </span>
                      )}
                      {selectedMonster.type4 && (
                        <span className={`type-badge type-${selectedMonster.type4.toLowerCase()}`}>
                          {selectedMonster.type4}
                        </span>
                      )}
                      {selectedMonster.type5 && (
                        <span className={`type-badge type-${selectedMonster.type5.toLowerCase()}`}>
                          {selectedMonster.type5}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="evolution-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                  <div className="ability-preview">
                    <div className="target-placeholder">
                      <i className="fas fa-question"></i>
                      <span>Choose Evolution</span>
                    </div>
                  </div>
                </div>

                {/* Step-by-step Evolution Form */}
                <div className="town-square">
                  
                  {/* Step 1: Species Selection */}
                  <div className="evolution-step active">
                    <div className="step-header">
                      <div className="step-number">1</div>
                      <h4>Choose Species to Evolve</h4>
                    </div>
                    <div className="type-tags">
                      {selectedMonster.species1 && (
                        <button
                          className={`monster-card ${selectedSpeciesSlot === 'species1' ? 'selected' : ''}`}
                          onClick={() => handleSpeciesSlotChange({ target: { value: 'species1' } })}
                        >
                          <div className="species-slot">Species 1</div>
                          <div className="species-name">{selectedMonster.species1}</div>
                        </button>
                      )}
                      {selectedMonster.species2 && (
                        <button
                          className={`monster-card ${selectedSpeciesSlot === 'species2' ? 'selected' : ''}`}
                          onClick={() => handleSpeciesSlotChange({ target: { value: 'species2' } })}
                        >
                          <div className="species-slot">Species 2</div>
                          <div className="species-name">{selectedMonster.species2}</div>
                        </button>
                      )}
                      {selectedMonster.species3 && (
                        <button
                          className={`monster-card ${selectedSpeciesSlot === 'species3' ? 'selected' : ''}`}
                          onClick={() => handleSpeciesSlotChange({ target: { value: 'species3' } })}
                        >
                          <div className="species-slot">Species 3</div>
                          <div className="species-name">{selectedMonster.species3}</div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Evolution Method */}
                  <div className="evolution-step">
                    <div className="step-header">
                      <div className="step-number">2</div>
                      <h4>Choose Evolution Method</h4>
                    </div>
                    
                    <div className="form">
                      {/* Natural Evolution */}
                      {evolutionOptions.length > 0 && (
                        <div className="help-content">
                          <h5>Natural Evolution</h5>
                          <p>Choose from available evolution options for {selectedMonster[selectedSpeciesSlot]}</p>
                          {loadingEvolutionOptions ? (
                            <div className="loading-options">
                              <LoadingSpinner size="small" />
                              <span>Loading options...</span>
                            </div>
                          ) : (
                            <div className="evolution-options-grid">
                              {evolutionOptions.map((evolution, index) => (
                                <button
                                  key={index}
                                  className={`evolution-card ${selectedEvolution === evolution.name ? 'selected' : ''}`}
                                  onClick={() => handleEvolutionSelect(evolution)}
                                >
                                  <div className="evolution-name">{evolution.name}</div>
                                  <div className="evolution-type">{evolution.type}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Custom Evolution */}
                      <div className="help-content">
                        <div className="method-header">
                          <h5>Custom Evolution</h5>
                          <span className="requires-item">Requires Digital Repair Kit</span>
                        </div>
                        <p>Create your own evolution by entering any species name</p>
                        <button
                          className={`button vertical ${useDigitalRepairKit ? 'active' : ''}`}
                          onClick={() => setUseDigitalRepairKit(!useDigitalRepairKit)}
                          disabled={!hasEvolutionItem('Digital Repair Kit')}
                        >
                          {hasEvolutionItem('Digital Repair Kit') 
                            ? (useDigitalRepairKit ? 'Digital Repair Kit Selected' : 'Use Digital Repair Kit')
                            : 'No Digital Repair Kit Available'
                          }
                        </button>
                        
                        {useDigitalRepairKit && (
                          <div className="custom-input">
                            <input
                              type="text"
                              value={customSpeciesName}
                              onChange={(e) => setCustomSpeciesName(e.target.value)}
                              placeholder="Enter species name (e.g., Charizard, Dragonite, etc.)"
                              className="help-content"
                            />
                            {customSpeciesName.trim() && (
                              <div className="evolution-preview-mini">
                                <i className="fas fa-arrow-right"></i>
                                <span>{customSpeciesName.trim()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evolution Preview */}
                    {evolutionPreview && (
                      <div className="evolution-preview-card">
                        <h5>Evolution Preview</h5>
                        <div className="image-upload">
                          <div className="preview-info">
                            <div className="preview-name">{evolutionPreview.name}</div>
                            <div className="type-tags">
                              <span className={`type-badge type-${evolutionPreview.type_primary?.toLowerCase()}`}>
                                {evolutionPreview.type_primary}
                              </span>
                              {evolutionPreview.type_secondary && (
                                <span className={`type-badge type-${evolutionPreview.type_secondary.toLowerCase()}`}>
                                  {evolutionPreview.type_secondary}
                                </span>
                              )}
                            </div>
                          </div>
                          {evolutionPreview.image_url && (
                            <div className="preview-image">
                              <img src={evolutionPreview.image_url} alt={evolutionPreview.name} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Image & Items */}
                  <div className="evolution-step">
                    <div className="step-header">
                      <div className="step-number">3</div>
                      <h4>Image & Evolution Items</h4>
                    </div>

                    {/* Image Section */}
                    <div className="help-content">
                      <h5>Evolution Image</h5>
                      <p>Upload an image or use a Void Stone to bypass this requirement</p>
                      
                      <div className="image-options">
                        <div className="image-input-tabs">
                          <button 
                            className={`button vertical tab ${!useVoidStone ? 'active' : ''}`}
                            onClick={() => setUseVoidStone(false)}
                          >
                            <i className="fas fa-image"></i>
                            Upload Image
                          </button>
                          <button 
                            className={`button vertical tab ${useVoidStone ? 'active' : ''}${(trainerInventory?.evolution?.['Void Evolution Stone'] || 0) === 0 ? 'disabled' : ''}`}
                            onClick={() => {
                              const voidStoneCount = trainerInventory?.evolution?.['Void Evolution Stone'] || 0;
                              if (voidStoneCount > 0) {
                                setUseVoidStone(!useVoidStone);
                              }
                            }}
                            disabled={(trainerInventory?.evolution?.['Void Evolution Stone'] || 0) === 0}
                            title={`Void Evolution Stone (${trainerInventory?.evolution?.['Void Evolution Stone'] || 0} available)`}
                          >
                            <i className="fas fa-gem"></i>
                            Use Void Stone ({trainerInventory?.evolution?.['Void Evolution Stone'] || 0})
                          </button>
                        </div>

                        {!useVoidStone && (
                          <div className="auth-form">
                            <input
                              type="text"
                              value={imageUrl}
                              onChange={handleImageUrlChange}
                              placeholder="Enter image URL"
                              className="form-input"
                            />
                            <div className="file-input-wrapper">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                id="image-upload"
                              />
                              <label htmlFor="image-upload" className="logo-link">
                                <i className="fas fa-upload"></i>
                                Choose File
                              </label>
                            </div>
                          </div>
                        )}

                        {useVoidStone && (
                          <div className="void-stone-info">
                            <i className="fas fa-gem"></i>
                            <span>Using Void Evolution Stone ({trainerInventory?.evolution?.['Void Evolution Stone'] || 0} available) - No image required</span>
                          </div>
                        )}

                        {imagePreview && !useVoidStone && (
                          <div className="npc-avatar">
                            <img src={imagePreview} alt="Preview" />
                            <button 
                              className="remove-preview"
                              onClick={() => {
                                setImagePreview('');
                                setImageUrl('');
                                setImageFile(null);
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evolution Items */}
                    <div className="help-content">
                      <h5>Evolution Items (Optional)</h5>
                      <p>Choose one evolution item to add or modify your monster's types. Digital Repair Kit can be used alongside any other item.</p>
                      
                      {loadingInventory ? (
                        <div className="loading-items">
                          <LoadingSpinner size="small" />
                          <span>Loading inventory...</span>
                        </div>
                      ) : (
                        <div className="evolution-items-full-grid">
                          {/* All Evolution Stones */}
                          {(() => {
                            // ========================================
                            // ITEM IMAGES - Paste URLs here when ready
                            // ========================================
                            const itemImages = {
                              'Fire Stone': '',
                              'Water Stone': '',
                              'Thunder Stone': '',
                              'Leaf Stone': '',
                              'Moon Stone': '',
                              'Sun Stone': '',
                              'Shiny Stone': '',
                              'Dusk Stone': '',
                              'Dawn Stone': '',
                              'Ice Stone': '',
                              'Dragon Scale': '',
                              'Metal Coat': '',
                              'Sensei\'s Pillow': '',
                              'Poison Fang': '',
                              'Amber Stone': '',
                              'Glass Wing': '',
                              'Chalk Dust': '',
                              'Aurora Stone': '',
                              'Normal Stone': '',
                              'Digital Repair Kit': ''
                            };
                            
                            const evolutionItems = [
                              { id: 'Fire Stone', desc: 'Adds the Fire type on evolution', type: 'Fire' },
                              { id: 'Water Stone', desc: 'Adds the Water type on evolution', type: 'Water' },
                              { id: 'Thunder Stone', desc: 'Adds the Electric type on evolution', type: 'Electric' },
                              { id: 'Leaf Stone', desc: 'Adds the Grass type on evolution', type: 'Grass' },
                              { id: 'Moon Stone', desc: 'Adds the Fairy type on evolution', type: 'Fairy' },
                              { id: 'Sun Stone', desc: 'Adds the Bug type on evolution', type: 'Bug' },
                              { id: 'Shiny Stone', desc: 'Adds the Ghost type on evolution', type: 'Ghost' },
                              { id: 'Dusk Stone', desc: 'Adds the Dark type on evolution', type: 'Dark' },
                              { id: 'Dawn Stone', desc: 'Adds the Psychic type on evolution', type: 'Psychic' },
                              { id: 'Ice Stone', desc: 'Adds the Ice type on evolution', type: 'Ice' },
                              { id: 'Dragon Scale', desc: 'Adds the Dragon type on evolution', type: 'Dragon' },
                              { id: 'Metal Coat', desc: 'Adds the Steel type on evolution', type: 'Steel' },
                              { id: 'Sensei\'s Pillow', desc: 'Adds the Fighting type on evolution', type: 'Fighting' },
                              { id: 'Poison Fang', desc: 'Adds the Poison type on evolution', type: 'Poison' },
                              { id: 'Amber Stone', desc: 'Adds the Ground type on evolution', type: 'Ground' },
                              { id: 'Glass Wing', desc: 'Adds the Flying type on evolution', type: 'Flying' },
                              { id: 'Chalk Dust', desc: 'Adds the Rock type on evolution', type: 'Rock' },
                              { id: 'Aurora Stone', desc: 'Adds a random type on evolution', type: 'Random' },
                              { id: 'Normal Stone', desc: 'Adds the Normal type on evolution', type: 'Normal' }
                            ];
                            
                            return evolutionItems.map(item => {
                            // Handle name differences in inventory
                            let inventoryKey = item.id;
                            if (item.id === 'Aurora Stone') {
                              inventoryKey = 'Aurora Evolution Stone';
                            }
                            
                            const count = trainerInventory?.evolution?.[inventoryKey] || 0;
                            const isSelected = selectedEvolutionItem === item.id;
                            
                            return (
                              <button
                                key={item.id}
                                className={`evolution-item-full ${isSelected ? 'selected' : ''}${count === 0 ? 'unavailable' : ''}`}
                                onClick={() => {
                                  if (count > 0) {
                                    // If clicking the same item, deselect it
                                    if (isSelected) {
                                      setSelectedEvolutionItem('');
                                    } else {
                                      setSelectedEvolutionItem(item.id);
                                    }
                                  }
                                }}
                                disabled={count === 0}
                                title={count === 0 ? `You don't have any ${item.id}` : item.desc}
                              >
                                <div className="evolution-item-image">
                                  {/* Show item image if available */}
                                  {itemImages[item.id] && (
                                    <img 
                                      src={itemImages[item.id]} 
                                      alt={item.id}
                                      className="evolution-item-image-img"
                                    />
                                  )}
                                </div>
                                <div className="item-details">
                                  <div className="item-name">{item.id}</div>
                                  <div className="item-desc">{item.desc}</div>
                                  <div className="item-count">Count: {count}</div>
                                  <div className="item-type-badge-container">
                                    <div className={`type-badge type-${item.type?.toLowerCase()}`}>
                                      {item.type}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          });
                        })()}
                        </div>
                      )}
                      
                      {(selectedEvolutionItem || useDigitalRepairKit) && (
                        <div className="naming-header">
                          <i className="fas fa-info-circle"></i>
                          <div>
                            {useDigitalRepairKit && (
                              <div>Using: <strong>Digital Repair Kit</strong> - Allows custom species evolution</div>
                            )}
                            {selectedEvolutionItem && (
                              <div>Using: <strong>{selectedEvolutionItem}</strong> - This will add or modify your monster's types</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {evolutionError && (
                    <div className="evolution-error">
                      <i className="fas fa-exclamation-triangle"></i>
                      {evolutionError}
                    </div>
                  )}

                  <div className="evolution-actions">
                    <button
                      className="button secondary"
                      onClick={closeMonsterModal}
                    >
                      <i className="fas fa-times"></i>
                      Cancel
                    </button>
                    <button
                      className="button primary"
                      onClick={handleEvolve}
                      disabled={evolutionLoading}
                    >
                      {evolutionLoading ? (
                        <>
                          <LoadingSpinner size="small" />
                          Evolving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic"></i>
                          Evolve Monster
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WitchsHut;
