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
import type { TownTrainer, SpeciesImagesMap } from './types';
import {
  getBerryDescription,
  berryRequiresSpeciesSelection,
  BERRY_CATEGORIES
} from '../../utils/itemHelpers';
import { itemsService } from '../../services';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';
import { extractErrorMessage } from '../../utils/errorUtils';

const EXCLUDED_BERRIES = ['Forget-Me-Not', 'Forget-me-Not', 'Edenwiess', 'Edenweiss'];

interface ApothecaryProps {
  className?: string;
}

type BerryFilterKey = 'type' | 'species' | 'randomize' | 'remove' | 'misc';

interface BerryFilters {
  type: boolean;
  species: boolean;
  randomize: boolean;
  remove: boolean;
  misc: boolean;
}

/**
 * Apothecary component for using berries on monsters
 * Allows trainers to apply various berries to modify monster species, types, and attributes
 */
export function Apothecary({ className = '' }: ApothecaryProps) {
  const { isAuthenticated, currentUser } = useAuth();

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [filteredMonsters, setFilteredMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for berry selection
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [showMonsterModal, setShowMonsterModal] = useState(false);
  const [selectedBerry, setSelectedBerry] = useState('');
  const [berryLoading, setBerryLoading] = useState(false);
  const [berryError, setBerryError] = useState('');
  const [berrySuccess, setBerrySuccess] = useState(false);
  const [updatedMonster, setUpdatedMonster] = useState<Monster | null>(null);
  const [newSplitMonster, setNewSplitMonster] = useState<Monster | null>(null);
  const [divestName, setDivestName] = useState('');
  const [availableBerries, setAvailableBerries] = useState<Record<string, number>>({});

  // State for berry filtering
  const [berryFilters, setBerryFilters] = useState<BerryFilters>({
    type: false,
    species: false,
    randomize: false,
    remove: false,
    misc: false
  });

  // State for berry images
  const [berryImages, setBerryImages] = useState<Record<string, string | null>>({});

  // Fetch berry images on mount
  useEffect(() => {
    itemsService.getBerryItems().then(res => {
      if (res.success) setBerryImages(res.berryImages);
    }).catch(() => {});
  }, []);

  // State for species selection (for berries that roll species)
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [rolledSpecies, setRolledSpecies] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [speciesImages, setSpeciesImages] = useState<SpeciesImagesMap>({});

  // Fetch available berries for a trainer
  const fetchAvailableBerries = useCallback(async (trainerId: string) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/inventory`);
      const data = response.data;

      if (data.success && data.data) {
        setAvailableBerries(data.data.berries || {});
      } else {
        setAvailableBerries({});
      }
    } catch (err) {
      console.error('Error fetching berries:', err);
      setAvailableBerries({});
    }
  }, []);

  // Helper function to check if a berry is available
  const isBerryAvailable = useCallback((berryName: string): boolean => {
    return availableBerries[berryName] !== undefined && availableBerries[berryName] > 0;
  }, [availableBerries]);

  // Helper function to get berry count
  const getBerryCount = useCallback((berryName: string): number => {
    return availableBerries[berryName] || 0;
  }, [availableBerries]);

  // Helper function to check if berry matches current filters
  const matchesFilters = useCallback((berryName: string): boolean => {
    const activeFilters = (Object.keys(berryFilters) as BerryFilterKey[]).filter(
      key => berryFilters[key]
    );

    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter => {
      const categoryBerries: readonly string[] = BERRY_CATEGORIES[filter];
      return categoryBerries && categoryBerries.includes(berryName);
    });
  }, [berryFilters]);

  // Handle filter toggle
  const toggleFilter = useCallback((filterName: BerryFilterKey) => {
    setBerryFilters(prev => ({
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
        setAvailableBerries({});
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/monsters/trainer/${selectedTrainer}`);
        setTrainerMonsters(response.data.monsters || []);
        setFilteredMonsters(response.data.monsters || []);

        await fetchAvailableBerries(selectedTrainer);

        setLoading(false);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load monsters. Please try again.'));
        setLoading(false);
      }
    };

    fetchTrainerMonsters();
  }, [selectedTrainer, fetchAvailableBerries]);

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
    setBerrySuccess(false);
    setUpdatedMonster(null);
    setBerryError('');
    setSelectedBerry('');
  }, []);

  // Close monster modal
  const closeMonsterModal = useCallback(() => {
    setShowMonsterModal(false);
    setSelectedMonster(null);
    setSelectedBerry('');
    setBerryError('');
    setSpeciesImages({});
    setSelectedSpecies('');
    setRolledSpecies([]);
    setNewSplitMonster(null);
    setDivestName('');
  }, []);

  // Apply berry to monster
  const applyBerry = useCallback(async (speciesValue: string | null = null) => {
    if (!selectedMonster) return;

    try {
      setBerryLoading(true);
      setBerryError('');

      const response = await api.post('/items/use-berry', {
        monsterId: selectedMonster.id,
        berryName: selectedBerry,
        trainerId: parseInt(selectedTrainer),
        speciesValue,
        newMonsterName: selectedBerry === 'Divest Berry' && divestName.trim() ? divestName.trim() : undefined
      });

      if (response.data.success && response.data.monster) {
        setUpdatedMonster(response.data.monster);
        setBerrySuccess(true);

        const updatedMonsters = trainerMonsters.map(monster =>
          monster.id === response.data.monster.id ? response.data.monster : monster
        );

        if (selectedBerry === 'Divest Berry' && response.data.newMonster) {
          updatedMonsters.push(response.data.newMonster);
          setNewSplitMonster(response.data.newMonster);
        }

        setTrainerMonsters(updatedMonsters);
        setFilteredMonsters(updatedMonsters);

        await fetchAvailableBerries(selectedTrainer);
      } else {
        setBerryError(response.data.message || 'Failed to apply berry.');
      }
    } catch (err) {
      setBerryError(extractErrorMessage(err, 'An error occurred while applying the berry.'));
    } finally {
      setBerryLoading(false);
      setShowSpeciesModal(false);
      setSpeciesImages({});
    }
  }, [selectedMonster, selectedBerry, selectedTrainer, trainerMonsters, fetchAvailableBerries, divestName]);

  // Handle using a berry
  const handleUseBerry = useCallback(async () => {
    if (!selectedBerry || !selectedMonster) {
      setBerryError('Please select a berry to use.');
      return;
    }

    if (berryRequiresSpeciesSelection(selectedBerry)) {
      try {
        setBerryLoading(true);
        setBerryError('');

        const response = await api.post('/species/roll', { count: 10 });
        const rolledSpeciesList = response.data.species || [];
        setRolledSpecies(rolledSpeciesList);

        if (rolledSpeciesList.length > 0) {
          try {
            const speciesImagesResponse = await api.post('/species/images', { species: rolledSpeciesList });
            if (speciesImagesResponse.data.success) {
              setSpeciesImages(speciesImagesResponse.data.speciesImages || {});
            }
          } catch (imgError) {
            console.error('Error fetching species images:', imgError);
          }
        }

        setBerryLoading(false);
        setShowSpeciesModal(true);
      } catch (err) {
        setBerryError(extractErrorMessage(err, 'Failed to roll species. Please try again.'));
        setBerryLoading(false);
      }
      return;
    }

    await applyBerry();
  }, [selectedBerry, selectedMonster, applyBerry]);

  // Handle species selection
  const handleSpeciesSelect = useCallback((species: string) => {
    setSelectedSpecies(species);
  }, []);

  // Confirm species selection
  const confirmSpeciesSelection = useCallback(() => {
    if (!selectedSpecies) return;
    applyBerry(selectedSpecies);
  }, [selectedSpecies, applyBerry]);

  // Render berry button
  const renderBerryButton = useCallback((
    berryName: string,
    description: string,
    isDisabled: boolean
  ) => {
    const isFiltered = !matchesFilters(berryName);
    const isAvailable = isBerryAvailable(berryName);
    const count = getBerryCount(berryName);
    const isSelected = selectedBerry === berryName;

    return (
      <button
        key={berryName}
        className={`button vertical item-button ${isFiltered ? 'filtered-out' : ''} ${isSelected ? 'toggle active' : ''}`}
        onClick={() => setSelectedBerry(berryName)}
        disabled={isDisabled || !isAvailable}
      >
        <div className="item-button__image-container">
          <img
            src={berryImages[berryName] || getItemImageUrl({ name: berryName })}
            alt={berryName}
            className="item-button__image"
            onError={(e) => handleItemImageError(e, 'berry')}
          />
        </div>
        <span className="item-button__name">{berryName}</span>
        <span className="item-button__desc">{description}</span>
        {isAvailable && <span className="item-button__count">x{count}</span>}
      </button>
    );
  }, [matchesFilters, isBerryAvailable, getBerryCount, selectedBerry, berryImages]);

  return (
    <div className={`apothecary ${className}`.trim()}>
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
              {Object.keys(availableBerries).length > 0 && (
                <div className="compact-inventory">
                  <h4 className="compact-inventory__title">
                    <i className="fas fa-flask"></i> Available Berries
                  </h4>
                  <div className="compact-inventory__grid">
                    {Object.entries(availableBerries)
                      .filter(([name, count]) => count > 0 && !EXCLUDED_BERRIES.includes(name))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([name, count]) => (
                        <div key={name} className="compact-inventory__item">
                          <img
                            src={berryImages[name] || getItemImageUrl({ name })}
                            alt={name}
                            className="compact-inventory__image"
                            onError={(e) => handleItemImageError(e, 'berry')}
                          />
                          <div className="compact-inventory__info">
                            <span className="compact-inventory__name">{name} <span className="compact-inventory__count">x{count}</span></span>
                            <span className="compact-inventory__effect">{getBerryDescription(name)}</span>
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
                            <div className="badge-group badge-group--wrap badge-group--gap-xs badge-group--sm">
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
            {berrySuccess ? (
              <div className="success-display">
                <div className="success-display__icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 className="success-display__title">Berry Applied Successfully!</h3>
                <p>
                  The {selectedBerry} has been applied to {updatedMonster?.name}.
                  {selectedBerry === 'Divest Berry' && newSplitMonster && (
                    <span> A new monster "{newSplitMonster.name}" has been created from the split!</span>
                  )}
                </p>
                <MonsterDetails
                  monster={updatedMonster}
                  itemName={selectedBerry}
                  itemType="berry"
                  showItemInfo={false}
                />
                {selectedBerry === 'Divest Berry' && newSplitMonster && (
                  <div className="card-container">
                    <h4>New Monster Created:</h4>
                    <MonsterDetails
                      monster={newSplitMonster}
                      itemName={selectedBerry}
                      itemType="berry"
                      showItemInfo={false}
                    />
                  </div>
                )}
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
                  itemName={selectedBerry}
                  itemType="berry"
                  showItemInfo={!!selectedBerry}
                />

                <div className="form-section">
                  <h3>Select a Berry</h3>

                  <div className="card-container">
                    <h4>Filter by Category (stackable)</h4>
                    <div className="container horizontal gap-small">
                      <button
                        className={`button filter no-flex ${berryFilters.type ? 'active' : ''}`}
                        onClick={() => toggleFilter('type')}
                      >
                        Type
                      </button>
                      <button
                        className={`button filter no-flex ${berryFilters.species ? 'active' : ''}`}
                        onClick={() => toggleFilter('species')}
                      >
                        Species
                      </button>
                      <button
                        className={`button filter no-flex ${berryFilters.randomize ? 'active' : ''}`}
                        onClick={() => toggleFilter('randomize')}
                      >
                        Randomize
                      </button>
                      <button
                        className={`button filter no-flex ${berryFilters.remove ? 'active' : ''}`}
                        onClick={() => toggleFilter('remove')}
                      >
                        Remove
                      </button>
                      <button
                        className={`button filter no-flex ${berryFilters.misc ? 'active' : ''}`}
                        onClick={() => toggleFilter('misc')}
                      >
                        Misc
                      </button>
                      <button
                        className="button danger no-flex"
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

                  <div className="item-categories">
                    {/* Species Modification */}
                    <div className="item-category">
                      <h4>Species Modification</h4>
                      <div className="shop-item-list">
                        {renderBerryButton('Bugger Berry', getBerryDescription('Bugger Berry'), !selectedMonster.species2)}
                        {renderBerryButton('Mala Berry', getBerryDescription('Mala Berry'), !selectedMonster.species2)}
                        {renderBerryButton('Merco Berry', getBerryDescription('Merco Berry'), !selectedMonster.species3)}
                        {renderBerryButton('Patama Berry', getBerryDescription('Patama Berry'), false)}
                        {renderBerryButton('Bluk Berry', getBerryDescription('Bluk Berry'), !selectedMonster.species2)}
                        {renderBerryButton('Nuevo Berry', getBerryDescription('Nuevo Berry'), !selectedMonster.species3)}
                        {renderBerryButton('Azzuk Berry', getBerryDescription('Azzuk Berry'), !!selectedMonster.species2)}
                        {renderBerryButton('Mangus Berry', getBerryDescription('Mangus Berry'), !!selectedMonster.species3 || !selectedMonster.species2)}
                      </div>
                    </div>

                    {/* Type Modification */}
                    <div className="item-category">
                      <h4>Type Modification</h4>
                      <div className="shop-item-list">
                        {renderBerryButton('Siron Berry', getBerryDescription('Siron Berry'), !selectedMonster.type2 && !selectedMonster.type3 && !selectedMonster.type4 && !selectedMonster.type5)}
                        {renderBerryButton('Lilan Berry', getBerryDescription('Lilan Berry'), !selectedMonster.type2)}
                        {renderBerryButton('Kham Berry', getBerryDescription('Kham Berry'), !selectedMonster.type3)}
                        {renderBerryButton('Maizi Berry', getBerryDescription('Maizi Berry'), !selectedMonster.type4)}
                        {renderBerryButton('Fani Berry', getBerryDescription('Fani Berry'), !selectedMonster.type5)}
                        {renderBerryButton('Miraca Berry', getBerryDescription('Miraca Berry'), false)}
                        {renderBerryButton('Cocon Berry', getBerryDescription('Cocon Berry'), !selectedMonster.type2)}
                        {renderBerryButton('Durian Berry', getBerryDescription('Durian Berry'), !selectedMonster.type3)}
                        {renderBerryButton('Monel Berry', getBerryDescription('Monel Berry'), !selectedMonster.type4)}
                        {renderBerryButton('Perep Berry', getBerryDescription('Perep Berry'), !selectedMonster.type5)}
                        {renderBerryButton('Addish Berry', getBerryDescription('Addish Berry'), !!selectedMonster.type2)}
                        {renderBerryButton('Sky Carrot Berry', getBerryDescription('Sky Carrot Berry'), !!selectedMonster.type3 || !selectedMonster.type2)}
                        {renderBerryButton('Kembre Berry', getBerryDescription('Kembre Berry'), !!selectedMonster.type4 || !selectedMonster.type3)}
                        {renderBerryButton('Espara Berry', getBerryDescription('Espara Berry'), !!selectedMonster.type5 || !selectedMonster.type4)}
                      </div>
                    </div>

                    {/* Attribute Modification */}
                    <div className="item-category">
                      <h4>Attribute Modification</h4>
                      <div className="shop-item-list">
                        {renderBerryButton('Datei Berry', getBerryDescription('Datei Berry'), false)}
                      </div>
                    </div>

                    {/* Species Splitting */}
                    <div className="item-category">
                      <h4>Species Splitting</h4>
                      <div className="shop-item-list">
                        {renderBerryButton('Divest Berry', getBerryDescription('Divest Berry'), !selectedMonster.species2)}
                      </div>
                    </div>
                  </div>

                  {selectedBerry === 'Divest Berry' && selectedMonster && (
                    <div className="form-group">
                      <label className="form-label">Name for new monster:</label>
                      <input
                        type="text"
                        className="input"
                        placeholder={`Name for new monster (${selectedMonster.species1 || 'split species'})`}
                        value={divestName}
                        onChange={(e) => setDivestName(e.target.value)}
                      />
                    </div>
                  )}

                  {berryError && (
                    <div className="alert error">
                      <i className="fas fa-exclamation-circle"></i>
                      {berryError}
                    </div>
                  )}

                  <div className="action-button-group action-button-group--align-end action-button-group--gap-md action-button-group--margin-top">
                    <button className="button secondary no-flex" onClick={closeMonsterModal}>
                      Cancel
                    </button>
                    <button
                      className="button primary no-flex"
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
          <div className="state-container state-container--centered">
            <LoadingSpinner />
            <p className="spinner-message">Loading monster details...</p>
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
        size="large"
      >
        <MonsterDetails monster={selectedMonster} showItemInfo={true} />

        <div className="form-section">
          <p>Select one of the following species:</p>

          <div className="species-grid">
            {rolledSpecies.map((species, index) => {
              const speciesImage = speciesImages[species];
              const imageUrl = typeof speciesImage === 'string' ? speciesImage : speciesImage?.image_url;

              return (
                <button
                  key={index}
                  className={`card species-card ${selectedSpecies === species ? 'card--selected' : ''}`}
                  onClick={() => handleSpeciesSelect(species)}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={species}
                      className="species-card__image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="species-card__name">{species}</span>
                </button>
              );
            })}
          </div>

          <div className="action-button-group action-button-group--align-end action-button-group--gap-md action-button-group--margin-top">
            <button
              className="button secondary no-flex"
              onClick={() => {
                setShowSpeciesModal(false);
                setSpeciesImages({});
                setSelectedSpecies('');
              }}
            >
              Cancel
            </button>
            <button
              className="button primary no-flex"
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
}

export default Apothecary;
