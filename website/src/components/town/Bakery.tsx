import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TypeBadge } from '../common/TypeBadge';
import { MonsterDetails } from '../common/MonsterDetails';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import type { Monster } from '../common/MonsterDetails';
import type { TownTrainer } from './types';
import {
  getPastryDescription,
  getPastryValueType,
  AVAILABLE_TYPES,
  AVAILABLE_ATTRIBUTES,
  PASTRY_CATEGORIES
} from '../../utils/itemHelpers';
import { itemsService } from '../../services';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';
import { extractErrorMessage } from '../../utils/errorUtils';

interface BakeryProps {
  className?: string;
}

type PastryFilterKey = 'type' | 'species' | 'set' | 'add' | 'misc';

interface PastryFilters {
  type: boolean;
  species: boolean;
  set: boolean;
  add: boolean;
  misc: boolean;
}

/**
 * Bakery component for using pastries on monsters
 * Allows trainers to apply various pastries to set specific species, types, and attributes
 */
export function Bakery({ className = '' }: BakeryProps) {
  const { isAuthenticated, currentUser } = useAuth();

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [filteredMonsters, setFilteredMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for pastry selection
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [selectedPastry, setSelectedPastry] = useState('');
  const [pastryLoading, setPastryLoading] = useState(false);
  const [pastryError, setPastryError] = useState('');
  const [pastrySuccess, setPastrySuccess] = useState(false);
  const [updatedMonster, setUpdatedMonster] = useState<Monster | null>(null);
  const [availablePastries, setAvailablePastries] = useState<Record<string, number>>({});

  // State for value selection (for pastries that set values)
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [valueOptions, setValueOptions] = useState<string[]>([]);
  const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
  const [filteredValueOptions, setFilteredValueOptions] = useState<string[]>([]);

  // State for pastry images
  const [pastryImages, setPastryImages] = useState<Record<string, string | null>>({});

  // Fetch pastry images on mount
  useEffect(() => {
    itemsService.getPastryItems().then(res => {
      if (res.success) setPastryImages(res.berryImages);
    }).catch(() => {});
  }, []);

  // State for pastry filtering
  const [pastryFilters, setPastryFilters] = useState<PastryFilters>({
    type: false,
    species: false,
    set: false,
    add: false,
    misc: false
  });

  // Fetch available pastries for a trainer
  const fetchAvailablePastries = useCallback(async (trainerId: string) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/inventory`);
      const data = response.data;

      if (data.success && data.data) {
        setAvailablePastries(data.data.pastries || {});
      } else {
        setAvailablePastries({});
      }
    } catch (err) {
      console.error('Error fetching pastries:', err);
      setAvailablePastries({});
    }
  }, []);

  // Helper function to check if a pastry is available
  const isPastryAvailable = useCallback((pastryName: string): boolean => {
    return availablePastries[pastryName] !== undefined && availablePastries[pastryName] > 0;
  }, [availablePastries]);

  // Helper function to get pastry count
  const getPastryCount = useCallback((pastryName: string): number => {
    return availablePastries[pastryName] || 0;
  }, [availablePastries]);

  // Helper function to check if pastry matches current filters
  const matchesFilters = useCallback((pastryName: string): boolean => {
    const activeFilters = (Object.keys(pastryFilters) as PastryFilterKey[]).filter(
      key => pastryFilters[key]
    );

    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter => {
      const categoryPastries: readonly string[] = PASTRY_CATEGORIES[filter];
      return categoryPastries && categoryPastries.includes(pastryName);
    });
  }, [pastryFilters]);

  // Handle filter toggle
  const toggleFilter = useCallback((filterName: PastryFilterKey) => {
    setPastryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  }, []);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        const userId = currentUser?.discord_id;
        const response = await api.get(`/trainers/user/${userId}`);
        setUserTrainers(response.data.data || response.data.trainers || []);
        setLoading(false);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again.'));
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

        const response = await api.get(`/monsters/trainer/${selectedTrainer}`);
        setTrainerMonsters(response.data.monsters || []);
        setFilteredMonsters(response.data.monsters || []);

        await fetchAvailablePastries(selectedTrainer);

        setLoading(false);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load monsters. Please try again.'));
        setLoading(false);
      }
    };

    fetchTrainerMonsters();
  }, [selectedTrainer, fetchAvailablePastries]);

  // Filter monsters based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMonsters(trainerMonsters);
      return;
    }

    const filtered = trainerMonsters.filter(monster =>
      monster.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      monster.species1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      monster.species2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      monster.species3?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredMonsters(filtered);
  }, [searchTerm, trainerMonsters]);

  // Handle monster selection
  const handleMonsterClick = useCallback((monster: Monster) => {
    setSelectedMonster(monster);
    setShowMonsterModal(true);
    setPastrySuccess(false);
    setUpdatedMonster(null);
    setPastryError('');
    setSelectedPastry('');
  }, []);

  // Close monster modal
  const closeMonsterModal = useCallback(() => {
    setShowMonsterModal(false);
    setSelectedMonster(null);
    setSelectedPastry('');
    setPastryError('');
  }, []);

  // Handle using a pastry
  const handleUsePastry = useCallback(async () => {
    if (!selectedPastry || !selectedMonster) {
      setPastryError('Please select a pastry to use.');
      return;
    }

    const valueType = getPastryValueType(selectedPastry);
    let options: string[] = [];

    if (valueType === 'type') {
      options = [...AVAILABLE_TYPES];
      setFilteredValueOptions(options);
    } else if (valueType === 'species') {
      try {
        setPastryLoading(true);
        const response = await api.get('/species/list', { params: { limit: 5000 } });
        if (response.data.success && response.data.species) {
          options = response.data.species;
          setFilteredValueOptions(options);
        } else {
          setPastryError('Failed to fetch species list. Please try again.');
          setPastryLoading(false);
          return;
        }
        setPastryLoading(false);
      } catch (err) {
        setPastryError(extractErrorMessage(err, 'Failed to fetch species list. Please try again.'));
        setPastryLoading(false);
        return;
      }
    } else if (valueType === 'attribute') {
      options = [...AVAILABLE_ATTRIBUTES];
      setFilteredValueOptions(options);
    }

    setValueOptions(options);
    setSelectedValue('');
    setSpeciesSearchTerm('');
    setShowValueModal(true);
  }, [selectedPastry, selectedMonster]);

  // Apply pastry to monster
  const applyPastry = useCallback(async () => {
    if (!selectedMonster) return;

    try {
      setPastryLoading(true);
      setPastryError('');

      const response = await api.post('/items/use-pastry', {
        monsterId: selectedMonster.id,
        pastryName: selectedPastry,
        trainerId: parseInt(selectedTrainer),
        selectedValue
      });

      if (response.data.success && response.data.monster) {
        setUpdatedMonster(response.data.monster);
        setPastrySuccess(true);

        const updatedMonsters = trainerMonsters.map(monster =>
          monster.id === response.data.monster.id ? response.data.monster : monster
        );
        setTrainerMonsters(updatedMonsters);
        setFilteredMonsters(updatedMonsters);

        await fetchAvailablePastries(selectedTrainer);
      } else {
        setPastryError(response.data.message || 'Failed to apply pastry.');
      }
    } catch (err) {
      setPastryError(extractErrorMessage(err, 'An error occurred while applying the pastry.'));
    } finally {
      setPastryLoading(false);
      setShowValueModal(false);
    }
  }, [selectedMonster, selectedPastry, selectedTrainer, selectedValue, trainerMonsters, fetchAvailablePastries]);

  // Handle value selection
  const handleValueSelect = useCallback((value: string) => {
    setSelectedValue(value);
  }, []);

  // Handle species search
  const handleSpeciesSearch = useCallback(async (searchValue: string) => {
    setSpeciesSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setFilteredValueOptions(valueOptions);
      return;
    }

    try {
      const valueType = getPastryValueType(selectedPastry);
      if (valueType === 'species') {
        const response = await api.get('/species/search', { params: { query: searchValue } });
        if (response.data.success && response.data.species) {
          setFilteredValueOptions(response.data.species);
        } else {
          const filtered = valueOptions.filter(value =>
            value.toLowerCase().includes(searchValue.toLowerCase())
          );
          setFilteredValueOptions(filtered);
        }
      } else {
        const filtered = valueOptions.filter(value =>
          value.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredValueOptions(filtered);
      }
    } catch (err) {
      console.error('Error searching species:', err);
      const filtered = valueOptions.filter(value =>
        value.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredValueOptions(filtered);
    }
  }, [selectedPastry, valueOptions]);

  // Confirm value selection
  const confirmValueSelection = useCallback(() => {
    if (!selectedValue) return;
    applyPastry();
  }, [selectedValue, applyPastry]);

  // Render pastry button
  const renderPastryButton = useCallback((
    pastryName: string,
    description: string,
    isDisabled: boolean
  ) => {
    const isFiltered = !matchesFilters(pastryName);
    const isAvailable = isPastryAvailable(pastryName);
    const count = getPastryCount(pastryName);
    const isSelected = selectedPastry === pastryName;

    return (
      <button
        key={pastryName}
        className={`button vertical item-button ${isFiltered ? 'filtered-out' : ''} ${isSelected ? 'toggle active' : ''}`}
        onClick={() => setSelectedPastry(pastryName)}
        disabled={isDisabled || !isAvailable}
      >
        <div className="item-button__image-container">
          <img
            src={pastryImages[pastryName] || getItemImageUrl({ name: pastryName })}
            alt={pastryName}
            className="item-button__image"
            onError={(e) => handleItemImageError(e, 'pastry')}
          />
        </div>
        <span className="item-button__name">{pastryName}</span>
        <span className="item-button__desc">{description}</span>
        {isAvailable && <span className="item-button__count">x{count}</span>}
      </button>
    );
  }, [matchesFilters, isPastryAvailable, getPastryCount, selectedPastry, pastryImages]);

  return (
    <div className={`bakery ${className}`.trim()}>
      {loading && !selectedTrainer ? (
        <div className="state-container state-container--centered">
          <LoadingSpinner />
          <p className="spinner-message">Loading...</p>
        </div>
      ) : error && !selectedTrainer ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="form-sections">
          <div className="form-group">
            <TrainerAutocomplete
              trainers={userTrainers}
              selectedTrainerId={selectedTrainer || null}
              onSelect={(id) => setSelectedTrainer(id ? String(id) : '')}
              label="Select Trainer"
              placeholder="Type to search trainers..."
            />
          </div>

          {selectedTrainer && (
            <>
              {Object.keys(availablePastries).length > 0 && (
                <div className="compact-inventory">
                  <h4 className="compact-inventory__title">
                    <i className="fas fa-cookie-bite"></i> Available Pastries
                  </h4>
                  <div className="compact-inventory__grid">
                    {Object.entries(availablePastries)
                      .filter(([, count]) => count > 0)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([name, count]) => (
                        <div key={name} className="compact-inventory__item">
                          <img
                            src={pastryImages[name] || getItemImageUrl({ name })}
                            alt={name}
                            className="compact-inventory__image"
                            onError={(e) => handleItemImageError(e, 'pastry')}
                          />
                          <div className="compact-inventory__info">
                            <span className="compact-inventory__name">{name} <span className="compact-inventory__count">x{count}</span></span>
                            <span className="compact-inventory__effect">{getPastryDescription(name)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Search monsters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="state-container state-container--centered">
                  <LoadingSpinner />
                  <p className="spinner-message">Loading monsters...</p>
                </div>
              ) : (
                <div className="data-grid">
                  <div className="data-grid__items data-grid__items--grid data-grid__items--md data-grid__items--gap-md">
                    {filteredMonsters.length === 0 ? (
                      <div className="empty-state">
                        <i className="fas fa-ghost"></i>
                        <h3>No monsters found</h3>
                        <p>This trainer doesn't have any monsters yet.</p>
                      </div>
                    ) : (
                      filteredMonsters.map(monster => (
                        <Card
                          key={monster.id}
                          onClick={() => handleMonsterClick(monster)}
                        >
                          <div className="card__image-container">
                            <img
                              src={monster.img_link || '/images/default_mon.png'}
                              alt={monster.name}
                              className="card__image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/default_mon.png';
                              }}
                            />
                          </div>
                          <div className="card__body">
                            <h4 className="card__title">{monster.name}</h4>
                            <p className="card__subtitle">
                              {monster.species1}
                              {monster.species2 && ` + ${monster.species2}`}
                              {monster.species3 && ` + ${monster.species3}`}
                            </p>
                            <div className="badge-group badge-group--sm mt-xs badge-group--wrap badge-group--gap-xs">
                              {monster.type1 && <TypeBadge type={monster.type1} size="sm" />}
                              {monster.type2 && <TypeBadge type={monster.type2} size="sm" />}
                              {monster.type3 && <TypeBadge type={monster.type3} size="sm" />}
                              {monster.type4 && <TypeBadge type={monster.type4} size="sm" />}
                              {monster.type5 && <TypeBadge type={monster.type5} size="sm" />}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
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
          <div className="modal-content">
            {pastrySuccess ? (
              <div className="success-display">
                <div className="success-display__icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 className="success-display__title">Pastry Applied Successfully!</h3>
                <p>
                  The {selectedPastry} has been applied to {updatedMonster?.name}.
                </p>
                <MonsterDetails
                  monster={updatedMonster}
                  itemName={selectedPastry}
                  itemType="pastry"
                  showItemInfo={false}
                />
                <div className="action-button-group action-button-group--align-center action-button-group--gap-md action-button-group--margin-top">
                  <button className="button primary" onClick={closeMonsterModal}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MonsterDetails
                  monster={selectedMonster}
                  itemName={selectedPastry}
                  itemType="pastry"
                  showItemInfo={!!selectedPastry}
                />

                <div className="form-section">
                  <h3>Select a Pastry</h3>

                  <div className="card-container">
                    <h4>Filter by Category (stackable)</h4>
                    <div className="container horizontal gap-small">
                      <button
                        className={`button filter no-flex ${pastryFilters.type ? 'active' : ''}`}
                        onClick={() => toggleFilter('type')}
                      >
                        Type
                      </button>
                      <button
                        className={`button filter no-flex ${pastryFilters.species ? 'active' : ''}`}
                        onClick={() => toggleFilter('species')}
                      >
                        Species
                      </button>
                      <button
                        className={`button filter no-flex ${pastryFilters.set ? 'active' : ''}`}
                        onClick={() => toggleFilter('set')}
                      >
                        Set
                      </button>
                      <button
                        className={`button filter no-flex ${pastryFilters.add ? 'active' : ''}`}
                        onClick={() => toggleFilter('add')}
                      >
                        Add
                      </button>
                      <button
                        className={`button filter no-flex ${pastryFilters.misc ? 'active' : ''}`}
                        onClick={() => toggleFilter('misc')}
                      >
                        Misc
                      </button>
                      <button
                        className="button danger no-flex"
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

                  <div className="item-categories">
                    {/* Species Modification */}
                    <div className="item-category">
                      <h4>Species Modification</h4>
                      <div className="shop-item-list">
                        {renderPastryButton('Patama Pastry', getPastryDescription('Patama Pastry'), false)}
                        {renderPastryButton('Bluk Pastry', getPastryDescription('Bluk Pastry'), !selectedMonster.species2)}
                        {renderPastryButton('Nuevo Pastry', getPastryDescription('Nuevo Pastry'), !selectedMonster.species3)}
                        {renderPastryButton('Azzuk Pastry', getPastryDescription('Azzuk Pastry'), !!selectedMonster.species2)}
                        {renderPastryButton('Mangus Pastry', getPastryDescription('Mangus Pastry'), !!selectedMonster.species3 || !selectedMonster.species2)}
                      </div>
                    </div>

                    {/* Type Modification */}
                    <div className="item-category">
                      <h4>Type Modification</h4>
                      <div className="shop-item-list">
                        {renderPastryButton('Miraca Pastry', getPastryDescription('Miraca Pastry'), false)}
                        {renderPastryButton('Cocon Pastry', getPastryDescription('Cocon Pastry'), !selectedMonster.type2)}
                        {renderPastryButton('Durian Pastry', getPastryDescription('Durian Pastry'), !selectedMonster.type3)}
                        {renderPastryButton('Monel Pastry', getPastryDescription('Monel Pastry'), !selectedMonster.type4)}
                        {renderPastryButton('Perep Pastry', getPastryDescription('Perep Pastry'), !selectedMonster.type5)}
                        {renderPastryButton('Addish Pastry', getPastryDescription('Addish Pastry'), !!selectedMonster.type2)}
                        {renderPastryButton('Sky Carrot Pastry', getPastryDescription('Sky Carrot Pastry'), !!selectedMonster.type3 || !selectedMonster.type2)}
                        {renderPastryButton('Kembre Pastry', getPastryDescription('Kembre Pastry'), !!selectedMonster.type4 || !selectedMonster.type3)}
                        {renderPastryButton('Espara Pastry', getPastryDescription('Espara Pastry'), !!selectedMonster.type5 || !selectedMonster.type4)}
                      </div>
                    </div>

                    {/* Attribute Modification */}
                    <div className="item-category">
                      <h4>Attribute Modification</h4>
                      <div className="shop-item-list">
                        {renderPastryButton('Datei Pastry', getPastryDescription('Datei Pastry'), false)}
                      </div>
                    </div>
                  </div>

                  {pastryError && (
                    <div className="alert error">
                      <i className="fas fa-exclamation-circle"></i>
                      {pastryError}
                    </div>
                  )}

                  <div className="action-button-group action-button-group--align-end action-button-group--gap-md action-button-group--margin-top">
                    <button className="button secondary no-flex" onClick={closeMonsterModal}>
                      Cancel
                    </button>
                    <button
                      className="button primary no-flex"
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
          <div className="state-container state-container--centered">
            <LoadingSpinner />
            <p className="spinner-message">Loading monster details...</p>
          </div>
        )}
      </Modal>

      {/* Value Selection Modal */}
      <Modal
        isOpen={showValueModal}
        onClose={() => setShowValueModal(false)}
        title="Select Value"
        size="large"
      >
        <MonsterDetails monster={selectedMonster} showItemInfo={true} />

        <div className="form-section">
          <p>Select a value to apply:</p>

          <div className="form-group">
            <input
              type="text"
              className="input"
              placeholder="Search values..."
              value={speciesSearchTerm}
              onChange={(e) => handleSpeciesSearch(e.target.value)}
            />
          </div>

          <div className="value-grid">
            {filteredValueOptions.map((value, index) => (
              <button
                key={index}
                className={`value-option ${selectedValue === value ? 'selected' : ''}`}
                onClick={() => handleValueSelect(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="action-button-group action-button-group--align-end action-button-group--gap-md action-button-group--margin-top">
            <button
              className="button secondary no-flex"
              onClick={() => setShowValueModal(false)}
            >
              Cancel
            </button>
            <button
              className="button primary no-flex"
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
}

export default Bakery;
