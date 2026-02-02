import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import adoptionService from '../../services/adoptionService';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import speciesService from '../../services/speciesService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import EnhancedMonsterDetails from '../common/EnhancedMonsterDetails';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';


/**
 * Apothecary component for using berries on monsters
 * @returns {JSX.Element} - Rendered component
 */
const Apothecary = () => {
  const { isAuthenticated} = useAuth();
  const { currentUser } = useAuth();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for berry selection
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [selectedBerry, setSelectedBerry] = useState('');
  const [berryLoading, setBerryLoading] = useState(false);
  const [berryError, setBerryError] = useState('');
  const [berrySuccess, setBerrySuccess] = useState(false);
  const [updatedMonster, setUpdatedMonster] = useState(null);
  const [newSplitMonster, setNewSplitMonster] = useState(null);
  const [availableBerries, setAvailableBerries] = useState({});
  
  // State for berry filtering
  const [berryFilters, setBerryFilters] = useState({
    type: false,
    species: false,
    randomize: false,
    remove: false,
    misc: false
  });
  
  // State for species selection (for berries that roll species)
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [rolledSpecies, setRolledSpecies] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [speciesImages, setSpeciesImages] = useState({});

  // Berry categorization
  const berryCategories = {
    type: [
      'Siron Berry', 'Lilan Berry', 'Kham Berry', 'Maizi Berry', 'Fani Berry',
      'Miraca Berry', 'Cocon Berry', 'Durian Berry', 'Monel Berry', 'Perep Berry',
      'Addish Berry', 'Sky Carrot Berry', 'Kembre Berry', 'Espara Berry'
    ],
    species: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Patama Berry', 'Bluk Berry',
      'Nuevo Berry', 'Azzuk Berry', 'Mangus Berry'
    ],
    randomize: [
      'Patama Berry', 'Bluk Berry', 'Nuevo Berry', 'Miraca Berry', 'Cocon Berry',
      'Durian Berry', 'Monel Berry', 'Perep Berry', 'Datei Berry'
    ],
    remove: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Siron Berry', 'Lilan Berry',
      'Kham Berry', 'Maizi Berry', 'Fani Berry'
    ],
    misc: [
      'Edenweiss', 'Forget-Me-Not', 'Datei Berry', 'Divest Berry'
    ]
  };

  // Fetch available berries for a trainer
  const fetchAvailableBerries = async (trainerId) => {
    try {
      const response = await fetch(`/api/trainers/${trainerId}/inventory`);
      const data = await response.json();

      if (data.success && data.data) {
        setAvailableBerries(data.data.berries || {});
        console.log('Fetched berries for trainer:', trainerId, data.data.berries);
      } else {
        console.error('Error fetching inventory:', data.message);
        setAvailableBerries({});
      }
    } catch (err) {
      console.error('Error fetching berries:', err);
      setAvailableBerries({});
    }
  };

  // Helper function to check if a berry is available
  const isBerryAvailable = (berryName) => {
    return availableBerries[berryName] && availableBerries[berryName] > 0;
  };

  // Helper function to get berry count
  const getBerryCount = (berryName) => {
    return availableBerries[berryName] || 0;
  };

  // Helper function to check if berry matches current filters
  const matchesFilters = (berryName) => {
    const activeFilters = Object.keys(berryFilters).filter(key => berryFilters[key]);
    
    if (activeFilters.length === 0) return true;
    
    return activeFilters.every(filter => 
      berryCategories[filter] && berryCategories[filter].includes(berryName)
    );
  };

  // Handle filter toggle
  const toggleFilter = (filterName) => {
    setBerryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };
  
  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError('');
        console.log('User:', currentUser);
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
  
  // Fetch trainer monsters when trainer is selected
  useEffect(() => {
    const fetchTrainerMonsters = async () => {
      if (!selectedTrainer) {
        setTrainerMonsters([]);
        setFilteredMonsters([]);
        setAvailableBerries({});
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await monsterService.getTrainerMonsters(selectedTrainer);
        setTrainerMonsters(response.monsters || []);
        setFilteredMonsters(response.monsters || []);

        // Fetch available berries for this trainer
        await fetchAvailableBerries(selectedTrainer);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching trainer monsters:', error);
        let errorMessage = 'Failed to load monsters. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchTrainerMonsters();
  }, [selectedTrainer]);
  
  // Filter monsters based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMonsters(trainerMonsters);
      return;
    }
    
    const filtered = trainerMonsters.filter(monster => 
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
  const handleMonsterClick = (monster) => {
    setSelectedMonster(monster);
    setShowMonsterModal(true);
    setBerrySuccess(false);
    setUpdatedMonster(null);
    setBerryError('');
  };
  
  // Close monster modal
  const closeMonsterModal = () => {
    setShowMonsterModal(false);
    setSelectedMonster(null);
    setSelectedBerry('');
    setBerryError('');
    setSpeciesImages({});
    setSelectedSpecies('');
    setRolledSpecies([]);
    setNewSplitMonster(null);
  };
  
  // Handle using a berry
  const handleUseBerry = async () => {
    if (!selectedBerry || !selectedMonster) {
      setBerryError('Please select a berry to use.');
      return;
    }
    
    // Check if this berry requires species selection
    const speciesRollingBerries = [
      'Patama Berry', 'Bluk Berry', 'Nuevo Berry', 
      'Azzuk Berry', 'Mangus Berry'
    ];
    
    if (speciesRollingBerries.includes(selectedBerry)) {
      try {
        setBerryLoading(true);
        setBerryError('');
        
        // Roll 10 random species
        const response = await adoptionService.rollRandomSpecies(10);
        const rolledSpeciesList = response.species || [];
        setRolledSpecies(rolledSpeciesList);
        
        // Fetch images for rolled species
        if (rolledSpeciesList.length > 0) {
          try {
            const speciesImagesResponse = await speciesService.getSpeciesImages(rolledSpeciesList);
            if (speciesImagesResponse.success) {
              setSpeciesImages(speciesImagesResponse.speciesImages);
            }
          } catch (error) {
            console.error('Error fetching species images:', error);
          }
        }
        
        setBerryLoading(false);
        setShowSpeciesModal(true);
      } catch (error) {
        console.error('Error rolling species:', error);
        let errorMessage = 'Failed to roll species. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setBerryError(errorMessage);
        setBerryLoading(false);
      }
      return;
    }
    
    // For other berries, apply directly
    await applyBerry();
  };
  
  // Apply berry to monster
  const applyBerry = async (speciesValue = null) => {
    try {
      setBerryLoading(true);
      setBerryError('');
      
      const trainer = getTrainerById(selectedTrainer);
      
      const response = await adoptionService.useBerry(
        selectedMonster.id,
        selectedBerry,
        parseInt(selectedTrainer),
        speciesValue
      );
      
      if (response.success && response.monster) {
        setUpdatedMonster(response.monster);
        setBerrySuccess(true);
        
        // Update the monster in the list
        let updatedMonsters = trainerMonsters.map(monster => 
          monster.id === response.monster.id ? response.monster : monster
        );

        // If Divest Berry created a new monster, add it to the list and store it
        if (selectedBerry === 'Divest Berry' && response.newMonster) {
          updatedMonsters.push(response.newMonster);
          setNewSplitMonster(response.newMonster);
          console.log('Added new split monster to list:', response.newMonster);
        }

        setTrainerMonsters(updatedMonsters);
        setFilteredMonsters(updatedMonsters);

        // Refresh inventory to update berry quantities
        await fetchAvailableBerries(selectedTrainer);
      } else {
        setBerryError(response.message || 'Failed to apply berry.');
      }
    } catch (error) {
      console.error('Error using berry:', error);
      let errorMessage = 'An error occurred while applying the berry.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setBerryError(errorMessage);
    } finally {
      setBerryLoading(false);
      setShowSpeciesModal(false);
      setSpeciesImages({});
    }
  };
  
  // Handle species selection
  const handleSpeciesSelect = (species) => {
    setSelectedSpecies(species);
  };
  
  // Confirm species selection
  const confirmSpeciesSelection = () => {
    if (!selectedSpecies) {
      return;
    }
    
    applyBerry(selectedSpecies);
  };
  
  return (
    <div className="apothecary-container">
      
      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="apothecary-content">
          <div className="trainer-selection">
            <label htmlFor="trainer-select">Select Trainer:</label>
            <select
              id="trainer-select"
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
            >
              <option value="">Select a trainer</option>
              {userTrainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} {trainer.discord_user_id ? `(Discord: ${trainer.discord_user_id})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {selectedTrainer && (
            <>
              <div className="monster-search">
                <input
                  type="text"
                  placeholder="Search monsters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="monsters-grid">
                {filteredMonsters.length === 0 ? (
                  <div className="no-monsters">
                    <p>No monsters found.</p>
                  </div>
                ) : (
                  filteredMonsters.map(monster => (
                    <div
                      key={monster.id}
                      className="monster-card"
                      onClick={() => handleMonsterClick(monster)}
                    >
                      <div className="monster-name">{monster.name}</div>
                      <div className="monster-species">
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
            </>
          )}
        </div>
      )}
      
      {/* Monster Modal */}
      <Modal
        isOpen={showMonsterModal}
        onClose={closeMonsterModal}
        title={selectedMonster?.name || 'Monster Details'}
        size="large"
      >
        {selectedMonster ? (
          <div className="monster-modal-content">
            {berrySuccess ? (
              <div className="berry-success">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Berry Applied Successfully!</h3>
                <p>
                  The {selectedBerry} has been applied to {updatedMonster.name}.
                  {selectedBerry === 'Divest Berry' && newSplitMonster && (
                    <span> A new monster "{newSplitMonster.name}" has been created from the split!</span>
                  )}
                </p>
                <EnhancedMonsterDetails
                  monster={updatedMonster}
                  itemName={selectedBerry}
                  itemType="berry"
                  showItemInfo={false}
                />
                {selectedBerry === 'Divest Berry' && newSplitMonster && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>New Monster Created:</h4>
                    <EnhancedMonsterDetails
                      monster={newSplitMonster}
                      itemName={selectedBerry}
                      itemType="berry"
                      showItemInfo={false}
                    />
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    className="modal-button primary"
                    onClick={closeMonsterModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <EnhancedMonsterDetails
                  monster={selectedMonster}
                  itemName={selectedBerry}
                  itemType="berry"
                  showItemInfo={!!selectedBerry}
                />
                
                <div className="berry-selection">
                  <h3>Select a Berry</h3>
                  
                  <div className="berry-filters">
                    <h4>Filter by Category (stackable)</h4>
                    <div className="filter-buttons">
                      <button
                        className={`filter-button ${berryFilters.type ? 'active' : ''}`}
                        onClick={() => toggleFilter('type')}
                      >
                        Type
                      </button>
                      <button
                        className={`filter-button ${berryFilters.species ? 'active' : ''}`}
                        onClick={() => toggleFilter('species')}
                      >
                        Species
                      </button>
                      <button
                        className={`filter-button ${berryFilters.randomize ? 'active' : ''}`}
                        onClick={() => toggleFilter('randomize')}
                      >
                        Randomize
                      </button>
                      <button
                        className={`filter-button ${berryFilters.remove ? 'active' : ''}`}
                        onClick={() => toggleFilter('remove')}
                      >
                        Remove
                      </button>
                      <button
                        className={`filter-button ${berryFilters.misc ? 'active' : ''}`}
                        onClick={() => toggleFilter('misc')}
                      >
                        Misc
                      </button>
                      <button
                        className="filter-button clear"
                        onClick={() => setBerryFilters({
                          type: false,
                          species: false,
                          randomize: false,
                          remove: false,
                          misc: false
                        })}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="berry-categories">
                    <div className="berry-category">
                      <h4>Species Modification</h4>
                      <div className="berry-items">
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Bugger Berry')}
                          disabled={!selectedMonster.species2 || !isBerryAvailable('Bugger Berry')}
                          style={{ display: matchesFilters('Bugger Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Bugger Berry</span>
                          <span className="berry-desc">Removes the first species of a mon with more than 1 species</span>
                          {isBerryAvailable('Bugger Berry') && <span className="berry-count">x{getBerryCount('Bugger Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Mala Berry')}
                          disabled={!selectedMonster.species2 || !isBerryAvailable('Mala Berry')}
                          style={{ display: matchesFilters('Mala Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Mala Berry</span>
                          <span className="berry-desc">Removes species 2 (if present)</span>
                          {isBerryAvailable('Mala Berry') && <span className="berry-count">x{getBerryCount('Mala Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Merco Berry')}
                          disabled={!selectedMonster.species3 || !isBerryAvailable('Merco Berry')}
                          style={{ display: matchesFilters('Merco Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Merco Berry</span>
                          <span className="berry-desc">Removes species 3 (if present)</span>
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Patama Berry')}
                          disabled={!isBerryAvailable('Patama Berry')}
                          style={{ display: matchesFilters('Patama Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Patama Berry</span>
                          <span className="berry-desc">Randomizes species 1</span>
                          {isBerryAvailable('Patama Berry') && <span className="berry-count">x{getBerryCount('Patama Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Bluk Berry')}
                          disabled={!selectedMonster.species2 || !isBerryAvailable('Bluk Berry')}
                          style={{ display: matchesFilters('Bluk Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Bluk Berry</span>
                          <span className="berry-desc">Randomizes species 2 (if present)</span>
                          {isBerryAvailable('Bluk Berry') && <span className="berry-count">x{getBerryCount('Bluk Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Nuevo Berry')}
                          disabled={!selectedMonster.species3 || !isBerryAvailable('Nuevo Berry')}
                          style={{ display: matchesFilters('Nuevo Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Nuevo Berry</span>
                          <span className="berry-desc">Randomizes species 3 (if present)</span>
                          {isBerryAvailable('Nuevo Berry') && <span className="berry-count">x{getBerryCount('Nuevo Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Azzuk Berry')}
                          disabled={selectedMonster.species2 || !isBerryAvailable('Azzuk Berry')}
                          style={{ display: matchesFilters('Azzuk Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Azzuk Berry</span>
                          <span className="berry-desc">Adds a new random species to species 2 (if not present)</span>
                          {isBerryAvailable('Azzuk Berry') && <span className="berry-count">x{getBerryCount('Azzuk Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Mangus Berry')}
                          disabled={selectedMonster.species3 || !selectedMonster.species2 || !isBerryAvailable('Mangus Berry')}
                          style={{ display: matchesFilters('Mangus Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Mangus Berry</span>
                          <span className="berry-desc">Adds a new random species to species 3 (if not present)</span>
                          {isBerryAvailable('Mangus Berry') && <span className="berry-count">x{getBerryCount('Mangus Berry')}</span>}
                        </button>
                      </div>
                    </div>
                    
                    <div className="berry-category">
                      <h4>Type Modification</h4>
                      <div className="berry-items">
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Siron Berry')}
                          disabled={!selectedMonster.type2 && !selectedMonster.type3 && !selectedMonster.type4 && !selectedMonster.type5 || !isBerryAvailable('Siron Berry')}
                          style={{ display: matchesFilters('Siron Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Siron Berry</span>
                          <span className="berry-desc">Removes first type and shifts remaining types (if more than one type)</span>
                          {isBerryAvailable('Siron Berry') && <span className="berry-count">x{getBerryCount('Siron Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Lilan Berry')}
                          disabled={!selectedMonster.type2 || !availableBerries['Lilan Berry'] || availableBerries['Lilan Berry'] < 1}
                          style={{ display: matchesFilters('Lilan Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Lilan Berry</span>
                          <span className="berry-desc">Removes type 2 (if present)</span>
                          {availableBerries['Lilan Berry'] && <span className="berry-count">x{availableBerries['Lilan Berry']}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Kham Berry')}
                          disabled={!selectedMonster.type3 || !availableBerries['Kham Berry'] || availableBerries['Kham Berry'] < 1}
                          style={{ display: matchesFilters('Kham Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Kham Berry</span>
                          <span className="berry-desc">Removes type 3 (if present)</span>
                          {availableBerries['Kham Berry'] && <span className="berry-count">x{availableBerries['Kham Berry']}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Maizi Berry')}
                          disabled={!selectedMonster.type4 || !isBerryAvailable('Maizi Berry')}
                          style={{ display: matchesFilters('Maizi Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Maizi Berry</span>
                          <span className="berry-desc">Removes type 4 (if present)</span>
                          {isBerryAvailable('Maizi Berry') && <span className="berry-count">x{getBerryCount('Maizi Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Fani Berry')}
                          disabled={!selectedMonster.type5 || !isBerryAvailable('Fani Berry')}
                          style={{ display: matchesFilters('Fani Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Fani Berry</span>
                          <span className="berry-desc">Removes type 5 (if present)</span>
                          {isBerryAvailable('Fani Berry') && <span className="berry-count">x{getBerryCount('Fani Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Miraca Berry')}
                          disabled={!isBerryAvailable('Miraca Berry')}
                          style={{ display: matchesFilters('Miraca Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Miraca Berry</span>
                          <span className="berry-desc">Randomizes type 1</span>
                          {isBerryAvailable('Miraca Berry') && <span className="berry-count">x{getBerryCount('Miraca Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Cocon Berry')}
                          disabled={!selectedMonster.type2 || !isBerryAvailable('Cocon Berry')}
                          style={{ display: matchesFilters('Cocon Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Cocon Berry</span>
                          <span className="berry-desc">Randomizes type 2 (if present)</span>
                          {isBerryAvailable('Cocon Berry') && <span className="berry-count">x{getBerryCount('Cocon Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Durian Berry')}
                          disabled={!selectedMonster.type3 || !isBerryAvailable('Durian Berry')}
                          style={{ display: matchesFilters('Durian Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Durian Berry</span>
                          <span className="berry-desc">Randomizes type 3 (if present)</span>
                          {isBerryAvailable('Durian Berry') && <span className="berry-count">x{getBerryCount('Durian Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Monel Berry')}
                          disabled={!selectedMonster.type4 || !isBerryAvailable('Monel Berry')}
                          style={{ display: matchesFilters('Monel Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Monel Berry</span>
                          <span className="berry-desc">Randomizes type 4 (if present)</span>
                          {isBerryAvailable('Monel Berry') && <span className="berry-count">x{getBerryCount('Monel Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Perep Berry')}
                          disabled={!selectedMonster.type5 || !isBerryAvailable('Perep Berry')}
                          style={{ display: matchesFilters('Perep Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Perep Berry</span>
                          <span className="berry-desc">Randomizes type 5 (if present)</span>
                          {isBerryAvailable('Perep Berry') && <span className="berry-count">x{getBerryCount('Perep Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Addish Berry')}
                          disabled={selectedMonster.type2 || !availableBerries['Addish Berry'] || availableBerries['Addish Berry'] < 1}
                          style={{ display: matchesFilters('Addish Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Addish Berry</span>
                          <span className="berry-desc">Adds type 2 (if not present)</span>
                          {availableBerries['Addish Berry'] && <span className="berry-count">x{availableBerries['Addish Berry']}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Sky Carrot Berry')}
                          disabled={selectedMonster.type3 || !selectedMonster.type2 || !isBerryAvailable('Sky Carrot Berry')}
                          style={{ display: matchesFilters('Sky Carrot Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Sky Carrot Berry</span>
                          <span className="berry-desc">Adds type 3 (if not present)</span>
                          {isBerryAvailable('Sky Carrot Berry') && <span className="berry-count">x{getBerryCount('Sky Carrot Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Kembre Berry')}
                          disabled={selectedMonster.type4 || !selectedMonster.type3 || !isBerryAvailable('Kembre Berry')}
                          style={{ display: matchesFilters('Kembre Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Kembre Berry</span>
                          <span className="berry-desc">Adds type 4 (if not present)</span>
                          {isBerryAvailable('Kembre Berry') && <span className="berry-count">x{getBerryCount('Kembre Berry')}</span>}
                        </button>
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Espara Berry')}
                          disabled={selectedMonster.type5 || !selectedMonster.type4 || !isBerryAvailable('Espara Berry')}
                          style={{ display: matchesFilters('Espara Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Espara Berry</span>
                          <span className="berry-desc">Adds type 5 (if not present)</span>
                          {isBerryAvailable('Espara Berry') && <span className="berry-count">x{getBerryCount('Espara Berry')}</span>}
                        </button>
                      </div>
                    </div>
                    
                    <div className="berry-category">
                      <h4>Attribute Modification</h4>
                      <div className="berry-items">
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Datei Berry')}
                          disabled={!isBerryAvailable('Datei Berry')}
                          style={{ display: matchesFilters('Datei Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Datei Berry</span>
                          <span className="berry-desc">Randomizes attribute</span>
                          {isBerryAvailable('Datei Berry') && <span className="berry-count">x{getBerryCount('Datei Berry')}</span>}
                        </button>
                      </div>
                    </div>

                    <div className="berry-category">
                      <h4>Species Splitting</h4>
                      <div className="berry-items">
                        <button
                          className="berry-item"
                          onClick={() => setSelectedBerry('Divest Berry')}
                          disabled={!selectedMonster.species2 || !isBerryAvailable('Divest Berry')}
                          style={{ display: matchesFilters('Divest Berry') ? 'flex' : 'none' }}
                        >
                          <span className="berry-name">Divest Berry</span>
                          <span className="berry-desc">Splits a monster with multiple species into two monsters</span>
                          {isBerryAvailable('Divest Berry') && <span className="berry-count">x{getBerryCount('Divest Berry')}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {berryError && (
                    <div className="berry-error">
                      {berryError}
                    </div>
                  )}
                  
                  <div className="berry-actions">
                    <button
                      className="modal-button secondary"
                      onClick={closeMonsterModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="modal-button primary"
                      onClick={handleUseBerry}
                      disabled={berryLoading || !selectedBerry}
                    >
                      {berryLoading ? 'Applying...' : 'Use Berry'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="monster-modal-content">
            <p>Loading monster details...</p>
          </div>
        )}
      </Modal>
      
      {/* Species Selection Modal */}
      <Modal
        isOpen={showSpeciesModal}
        onClose={() => {
          setShowSpeciesModal(false);
          setSpeciesImages({});
          setSelectedSpecies('');
        }}
        title="Select Species"
      >
        <div className="monster-modal-content">
          <EnhancedMonsterDetails
            monster={selectedMonster}
            showItemInfo={true}
          />
        </div>

        <div className="species-modal-content">
          <p>Select one of the following species:</p>
          
          <div className="species-list">
            {rolledSpecies.map((species, index) => {
              const speciesImage = speciesImages[species];
              return (
                <button
                  key={index}
                  className={`species-item ${selectedSpecies === species ? 'selected' : ''}`}
                  onClick={() => handleSpeciesSelect(species)}
                >
                  {speciesImage?.image_url && (
                    <img 
                      src={speciesImage.image_url} 
                      alt={species}
                      className="species-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="species-name">{species}</span>
                </button>
              );
            })}
          </div>
          
          <div className="species-actions">
            <button
              className="modal-button secondary"
              onClick={() => {
                setShowSpeciesModal(false);
                setSpeciesImages({});
                setSelectedSpecies('');
              }}
            >
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={confirmSpeciesSelection}
              disabled={!selectedSpecies}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Apothecary;
