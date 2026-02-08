import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';
import speciesService from '../../services/speciesService';
import api from '../../services/api';
import adoptionService from '../../services/adoptionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import EnhancedMonsterDetails from '../common/EnhancedMonsterDetails';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';


/**
 * Bakery component for using pastries on monsters
 * @returns {JSX.Element} - Rendered component
 */
const Bakery = () => {
  const { isAuthenticated } = useAuth();
  const { currentUser } = useAuth();

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for pastry selection
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [selectedPastry, setSelectedPastry] = useState('');
  const [pastryLoading, setPastryLoading] = useState(false);
  const [pastryError, setPastryError] = useState('');
  const [pastrySuccess, setPastrySuccess] = useState(false);
  const [updatedMonster, setUpdatedMonster] = useState(null);
  const [availablePastries, setAvailablePastries] = useState({});

  // State for value selection (for pastries that set values)
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [valueOptions, setValueOptions] = useState([]);
  const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
  const [filteredValueOptions, setFilteredValueOptions] = useState([]);

  // State for pastry filtering
  const [pastryFilters, setPastryFilters] = useState({
    type: false,
    species: false,
    set: false,
    add: false,
    misc: false
  });

  // Pastry categorization
  const pastryCategories = {
    type: [
      'Miraca Pastry', 'Cocon Pastry', 'Durian Pastry', 'Monel Pastry', 'Perep Pastry',
      'Addish Pastry', 'Sky Carrot Pastry', 'Kembre Pastry', 'Espara Pastry'
    ],
    species: [
      'Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry', 'Azzuk Pastry', 'Mangus Pastry'
    ],
    set: [
      'Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry',
      'Miraca Pastry', 'Cocon Pastry', 'Durian Pastry', 'Monel Pastry', 'Perep Pastry',
      'Datei Pastry'
    ],
    add: [
      'Azzuk Pastry', 'Mangus Pastry',
      'Addish Pastry', 'Sky Carrot Pastry', 'Kembre Pastry', 'Espara Pastry'
    ],
    misc: [
      'Datei Pastry'
    ]
  };

  // Helper function to check if pastry matches current filters
  const matchesFilters = (pastryName) => {
    const activeFilters = Object.keys(pastryFilters).filter(key => pastryFilters[key]);

    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter =>
      pastryCategories[filter] && pastryCategories[filter].includes(pastryName)
    );
  };

  // Handle filter toggle
  const toggleFilter = (filterName) => {
    setPastryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Fetch available pastries for a trainer
  const fetchAvailablePastries = async (trainerId) => {
    try {
      const response = await fetch(`/api/trainers/${trainerId}/inventory`);
      const data = await response.json();

      if (data.success && data.data) {
        setAvailablePastries(data.data.pastries || {});
        console.log('Fetched pastries for trainer:', trainerId, data.data.pastries);
      } else {
        console.error('Error fetching inventory:', data.message);
        setAvailablePastries({});
      }
    } catch (err) {
      console.error('Error fetching pastries:', err);
      setAvailablePastries({});
    }
  };

  // Helper function to check if a pastry is available
  const isPastryAvailable = (pastryName) => {
    return availablePastries[pastryName] && availablePastries[pastryName] > 0;
  };

  // Helper function to get pastry count
  const getPastryCount = (pastryName) => {
    return availablePastries[pastryName] || 0;
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
        setAvailablePastries({});
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await monsterService.getTrainerMonsters(selectedTrainer);
        setTrainerMonsters(response.monsters || []);
        setFilteredMonsters(response.monsters || []);

        // Fetch available pastries for this trainer
        await fetchAvailablePastries(selectedTrainer);

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
    setPastrySuccess(false);
    setUpdatedMonster(null);
    setPastryError('');
    setSelectedPastry(''); // Clear any previously selected pastry
  };

  // Close monster modal
  const closeMonsterModal = () => {
    setShowMonsterModal(false);
    setSelectedMonster(null);
    setSelectedPastry('');
    setPastryError('');
  };

  // Handle using a pastry
  const handleUsePastry = async () => {
    if (!selectedPastry || !selectedMonster) {
      setPastryError('Please select a pastry to use.');
      return;
    }

    // Determine what kind of value selection is needed
    let options = [];

    if (selectedPastry.includes('type') || selectedPastry === 'Miraca Pastry' ||
        selectedPastry === 'Cocon Pastry' || selectedPastry === 'Durian Pastry' ||
        selectedPastry === 'Monel Pastry' || selectedPastry === 'Perep Pastry' ||
        selectedPastry === 'Addish Pastry' || selectedPastry === 'Sky Carrot Pastry' ||
        selectedPastry === 'Kembre Pastry' || selectedPastry === 'Espara Pastry') {
      // Type selection
      options = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
        'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
        'Steel', 'Fairy'
      ];
    } else if (selectedPastry.includes('species') || selectedPastry === 'Patama Pastry' ||
               selectedPastry === 'Bluk Pastry' || selectedPastry === 'Nuevo Pastry') {
      // Species selection - fetch from API
      try {
        setPastryLoading(true);
        const response = await speciesService.getSpeciesList({ limit: 5000 });
        console.log('Species list response:', response);
        if (response.success && response.species) {
          options = response.species;
          setFilteredValueOptions(options); // Initialize filtered options with all options
        } else {
          console.error('Species list API returned error:', response);
          setPastryError('Failed to fetch species list. Please try again.');
          setPastryLoading(false);
          return;
        }
        setPastryLoading(false);
      } catch (error) {
        console.error('Error fetching species list:', error);
        let errorMessage = 'Failed to fetch species list. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setPastryError(errorMessage);
        setPastryLoading(false);
        return;
      }
    } else if (selectedPastry === 'Datei Pastry') {
      // Attribute selection
      options = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];
      setFilteredValueOptions(options); // Initialize filtered options with all options
    }

    setValueOptions(options);
    setSelectedValue('');
    setSpeciesSearchTerm('');
    setShowValueModal(true);
  };

  // Apply pastry to monster
  const applyPastry = async () => {
    try {
      setPastryLoading(true);
      setPastryError('');

      const trainer = getTrainerById(selectedTrainer);

      console.log('Applying pastry:', {
        monsterId: selectedMonster.id,
        pastryName: selectedPastry,
        trainerId: parseInt(selectedTrainer),
        selectedValue: selectedValue
      });

      // Use the adoptionService.usePastry method
      const response = await adoptionService.usePastry(
        selectedMonster.id,
        selectedPastry,
        parseInt(selectedTrainer),
        selectedValue
      );

      if (response.success && response.monster) {
        setUpdatedMonster(response.monster);
        setPastrySuccess(true);

        // Update the monster in the list
        const updatedMonsters = trainerMonsters.map(monster =>
          monster.id === response.monster.id ? response.monster : monster
        );
        setTrainerMonsters(updatedMonsters);
        setFilteredMonsters(updatedMonsters);

        // Refresh inventory to update pastry quantities
        await fetchAvailablePastries(selectedTrainer);

        console.log('Pastry applied successfully:', response.monster);
      } else {
        setPastryError(response.message || 'Failed to apply pastry.');
        console.error('Failed to apply pastry:', response);
      }
    } catch (error) {
      console.error('Error using pastry:', error);

      // Extract error message from response if available
      let errorMessage = 'An error occurred while applying the pastry.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPastryError(errorMessage);
    } finally {
      setPastryLoading(false);
      setShowValueModal(false);
    }
  };

  // Handle value selection
  const handleValueSelect = (value) => {
    setSelectedValue(value);
  };

  // Handle species search
  const handleSpeciesSearch = async (searchTerm) => {
    setSpeciesSearchTerm(searchTerm);

    if (!searchTerm.trim()) {
      setFilteredValueOptions(valueOptions);
      return;
    }

    try {
      // If this is a species search, use the API to get filtered results
      if (selectedPastry.includes('species') ||
          selectedPastry === 'Patama Pastry' ||
          selectedPastry === 'Bluk Pastry' ||
          selectedPastry === 'Nuevo Pastry' ||
          selectedPastry === 'Azzuk Pastry' ||
          selectedPastry === 'Mangus Pastry') {

        const response = await speciesService.searchSpecies(searchTerm);
        console.log('Species search response:', response);
        if (response.success && response.species) {
          setFilteredValueOptions(response.species);
        } else {
          console.error('Species search failed:', response);
          // Fallback to client-side filtering if API fails
          const filtered = valueOptions.filter(value =>
            value.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredValueOptions(filtered);
        }
      } else {
        // For other pastry types, filter the existing options
        const filtered = valueOptions.filter(value =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredValueOptions(filtered);
      }
    } catch (error) {
      console.error('Error searching species:', error);
      // Fall back to client-side filtering
      const filtered = valueOptions.filter(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredValueOptions(filtered);
    }
  };

  // Confirm value selection
  const confirmValueSelection = () => {
    if (!selectedValue) {
      return;
    }

    applyPastry();
  };

  return (
    <div className="form">

      {loading ? (
        <div className="error-container">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="form">
          <div className="shop-search">
            <label htmlFor="trainer-select">Select Trainer:</label>
            <select
              id="trainer-select"
              className="trainer-select"
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
              <div className="form-input">
                <input
                  type="text"
                  placeholder="Search monsters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="container grid gap-md">
                {filteredMonsters.length === 0 ? (
                  <div className="no-results">
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
            {pastrySuccess ? (
              <div className="berry-success">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Pastry Applied Successfully!</h3>
                <p>
                  The {selectedPastry} has been applied to {updatedMonster.name}.
                </p>
                <EnhancedMonsterDetails
                  monster={updatedMonster}
                  itemName={selectedPastry}
                  itemType="pastry"
                  showItemInfo={false}
                />
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
              <>
                <EnhancedMonsterDetails
                  monster={selectedMonster}
                  itemName={selectedPastry}
                  itemType="pastry"
                  showItemInfo={!!selectedPastry}
                />

                <div className="map-filters">
                  <h3>Select a Pastry</h3>

                  <div className="berry-filters">
                    <h4>Filter by Category (stackable)</h4>
                    <div className="type-tags">
                      <button
                        className={`button filter ${pastryFilters.type ? 'active' : ''}`}
                        onClick={() => toggleFilter('type')}
                      >
                        Type
                      </button>
                      <button
                        className={`button filter ${pastryFilters.species ? 'active' : ''}`}
                        onClick={() => toggleFilter('species')}
                      >
                        Species
                      </button>
                      <button
                        className={`button filter ${pastryFilters.set ? 'active' : ''}`}
                        onClick={() => toggleFilter('set')}
                      >
                        Set
                      </button>
                      <button
                        className={`button filter ${pastryFilters.add ? 'active' : ''}`}
                        onClick={() => toggleFilter('add')}
                      >
                        Add
                      </button>
                      <button
                        className={`button filter ${pastryFilters.misc ? 'active' : ''}`}
                        onClick={() => toggleFilter('misc')}
                      >
                        Misc
                      </button>
                      <button
                        className="button filter reset"
                        onClick={() => setPastryFilters({
                          type: false,
                          species: false,
                          set: false,
                          add: false,
                          misc: false
                        })}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="berry-categories">
                    <div className="fandom-grid">
                      <h4>Species Modification</h4>
                      <div className="berry-items">
                        <button
                          className={`button vertical ${!matchesFilters('Patama Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Patama Pastry')}
                          disabled={!isPastryAvailable('Patama Pastry')}
                        >
                          <span className="berry-name">Patama Pastry</span>
                          <span className="berry-desc">Sets species 1</span>
                          {isPastryAvailable('Patama Pastry') && <span className="berry-count">x{getPastryCount('Patama Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Bluk Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Bluk Pastry')}
                          disabled={!selectedMonster?.species2 || !isPastryAvailable('Bluk Pastry')}
                        >
                          <span className="berry-name">Bluk Pastry</span>
                          <span className="berry-desc">Sets species 2 (if present)</span>
                          {isPastryAvailable('Bluk Pastry') && <span className="berry-count">x{getPastryCount('Bluk Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Nuevo Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Nuevo Pastry')}
                          disabled={!selectedMonster?.species3 || !isPastryAvailable('Nuevo Pastry')}
                        >
                          <span className="berry-name">Nuevo Pastry</span>
                          <span className="berry-desc">Sets species 3 (if present)</span>
                          {isPastryAvailable('Nuevo Pastry') && <span className="berry-count">x{getPastryCount('Nuevo Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Azzuk Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Azzuk Pastry')}
                          disabled={selectedMonster?.species2 || !isPastryAvailable('Azzuk Pastry')}
                        >
                          <span className="berry-name">Azzuk Pastry</span>
                          <span className="berry-desc">Adds a new species to species 2 (if not present)</span>
                          {isPastryAvailable('Azzuk Pastry') && <span className="berry-count">x{getPastryCount('Azzuk Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Mangus Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Mangus Pastry')}
                          disabled={selectedMonster?.species3 || !selectedMonster?.species2 || !isPastryAvailable('Mangus Pastry')}
                        >
                          <span className="berry-name">Mangus Pastry</span>
                          <span className="berry-desc">Adds a new species to species 3 (if not present)</span>
                          {isPastryAvailable('Mangus Pastry') && <span className="berry-count">x{getPastryCount('Mangus Pastry')}</span>}
                        </button>
                      </div>
                    </div>

                    <div className="fandom-grid">
                      <h4>Type Modification</h4>
                      <div className="berry-items">
                        <button
                          className={`button vertical ${!matchesFilters('Miraca Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Miraca Pastry')}
                          disabled={!isPastryAvailable('Miraca Pastry')}
                        >
                          <span className="berry-name">Miraca Pastry</span>
                          <span className="berry-desc">Sets type 1</span>
                          {isPastryAvailable('Miraca Pastry') && <span className="berry-count">x{getPastryCount('Miraca Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Cocon Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Cocon Pastry')}
                          disabled={!selectedMonster?.type2 || !isPastryAvailable('Cocon Pastry')}
                        >
                          <span className="berry-name">Cocon Pastry</span>
                          <span className="berry-desc">Sets type 2 (if present)</span>
                          {isPastryAvailable('Cocon Pastry') && <span className="berry-count">x{getPastryCount('Cocon Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Durian Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Durian Pastry')}
                          disabled={!selectedMonster?.type3 || !isPastryAvailable('Durian Pastry')}
                        >
                          <span className="berry-name">Durian Pastry</span>
                          <span className="berry-desc">Sets type 3 (if present)</span>
                          {isPastryAvailable('Durian Pastry') && <span className="berry-count">x{getPastryCount('Durian Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Monel Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Monel Pastry')}
                          disabled={!selectedMonster?.type4 || !isPastryAvailable('Monel Pastry')}
                        >
                          <span className="berry-name">Monel Pastry</span>
                          <span className="berry-desc">Sets type 4 (if present)</span>
                          {isPastryAvailable('Monel Pastry') && <span className="berry-count">x{getPastryCount('Monel Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Perep Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Perep Pastry')}
                          disabled={!selectedMonster?.type5 || !isPastryAvailable('Perep Pastry')}
                        >
                          <span className="berry-name">Perep Pastry</span>
                          <span className="berry-desc">Sets type 5 (if present)</span>
                          {isPastryAvailable('Perep Pastry') && <span className="berry-count">x{getPastryCount('Perep Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Addish Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Addish Pastry')}
                          disabled={selectedMonster?.type2 || !isPastryAvailable('Addish Pastry')}
                        >
                          <span className="berry-name">Addish Pastry</span>
                          <span className="berry-desc">Adds type 2 (if not present)</span>
                          {isPastryAvailable('Addish Pastry') && <span className="berry-count">x{getPastryCount('Addish Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Sky Carrot Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Sky Carrot Pastry')}
                          disabled={selectedMonster?.type3 || !selectedMonster?.type2 || !isPastryAvailable('Sky Carrot Pastry')}
                        >
                          <span className="berry-name">Sky Carrot Pastry</span>
                          <span className="berry-desc">Adds type 3 (if not present)</span>
                          {isPastryAvailable('Sky Carrot Pastry') && <span className="berry-count">x{getPastryCount('Sky Carrot Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Kembre Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Kembre Pastry')}
                          disabled={selectedMonster?.type4 || !selectedMonster?.type3 || !isPastryAvailable('Kembre Pastry')}
                        >
                          <span className="berry-name">Kembre Pastry</span>
                          <span className="berry-desc">Adds type 4 (if not present)</span>
                          {isPastryAvailable('Kembre Pastry') && <span className="berry-count">x{getPastryCount('Kembre Pastry')}</span>}
                        </button>
                        <button
                          className={`button vertical ${!matchesFilters('Espara Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Espara Pastry')}
                          disabled={selectedMonster?.type5 || !selectedMonster?.type4 || !isPastryAvailable('Espara Pastry')}
                        >
                          <span className="berry-name">Espara Pastry</span>
                          <span className="berry-desc">Adds type 5 (if not present)</span>
                          {isPastryAvailable('Espara Pastry') && <span className="berry-count">x{getPastryCount('Espara Pastry')}</span>}
                        </button>
                      </div>
                    </div>

                    <div className="fandom-grid">
                      <h4>Attribute Modification</h4>
                      <div className="berry-items">
                        <button
                          className={`button vertical ${!matchesFilters('Datei Pastry') ? 'filtered-out' : ''}`}
                          onClick={() => setSelectedPastry('Datei Pastry')}
                          disabled={!isPastryAvailable('Datei Pastry')}
                        >
                          <span className="berry-name">Datei Pastry</span>
                          <span className="berry-desc">Sets attribute</span>
                          {isPastryAvailable('Datei Pastry') && <span className="berry-count">x{getPastryCount('Datei Pastry')}</span>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {pastryError && (
                    <div className="berry-error">
                      {pastryError}
                    </div>
                  )}

                  <div className="container horizontal gap-md">
                    <button
                      className="button secondary"
                      onClick={closeMonsterModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="button primary"
                      onClick={handleUsePastry}
                      disabled={pastryLoading || !selectedPastry}
                    >
                      {pastryLoading ? 'Applying...' : 'Use Pastry'}
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

      {/* Value Selection Modal */}
      <Modal
        isOpen={showValueModal}
        onClose={() => setShowValueModal(false)}
        title="Select Value"
      >
        <div className="monster-modal-content">
          <EnhancedMonsterDetails
            monster={selectedMonster}
            showItemInfo={true}
          />
        </div>

        <div className="map-filters">
          <p>Select a value to apply:</p>

          <div className="value-search">
            <input
              type="text"
              placeholder="Search values..."
              value={speciesSearchTerm}
              onChange={(e) => handleSpeciesSearch(e.target.value)}
            />
          </div>

          <div className="value-list">
            {filteredValueOptions.map((value, index) => (
              <button
                key={index}
                className={`value-item ${selectedValue === value ? 'selected' : ''}`}
                onClick={() => handleValueSelect(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="container horizontal gap-md">
            <button
              className="button secondary"
              onClick={() => setShowValueModal(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={confirmValueSelection}
              disabled={!selectedValue}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bakery;
