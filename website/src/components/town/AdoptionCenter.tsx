import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { DataGrid } from '../common/DataGrid';
import { Pagination } from '../common/Pagination';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { SearchBar } from '../common/SearchBar';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { AdoptionItemModal } from './AdoptionItemModal';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { Monster } from '../common/MonsterDetails';
import type {
  Adopt,
  AdoptionPagination,
  MonthData,
  TownTrainer,
  AdoptedMonster,
  Artwork,
  TrainerInventory,
  SpeciesImagesMap
} from './types';

interface AdoptionCenterProps {
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * AdoptionCenter - Browse and adopt available monsters
 * Features month/year filtering, artwork selection, and trainer assignment
 */
export function AdoptionCenter({ className = '' }: AdoptionCenterProps) {
  // Auth state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Adoption data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adopts, setAdopts] = useState<Adopt[]>([]);
  const [pagination, setPagination] = useState<AdoptionPagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Filter state
  const [monthsWithData, setMonthsWithData] = useState<MonthData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // User trainers state
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | number>('');
  const [trainerDaypasses, setTrainerDaypasses] = useState<Record<string | number, { hasDaypass: boolean; daypassCount: number }>>({});

  // Adoption modal state
  const [selectedAdopt, setSelectedAdopt] = useState<Adopt | null>(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [monsterName, setMonsterName] = useState('');
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionSuccess, setAdoptionSuccess] = useState(false);
  const [adoptionError, setAdoptionError] = useState('');
  const [adoptedMonster, setAdoptedMonster] = useState<AdoptedMonster | null>(null);

  // Artwork selector state
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [userArtworks, setUserArtworks] = useState<Artwork[]>([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [artworksPagination, setArtworksPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 8
  });
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');

  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [trainerInventory, setTrainerInventory] = useState<TrainerInventory>({ berries: {}, pastries: {} });

  // Species images
  const [speciesImages, setSpeciesImages] = useState<SpeciesImagesMap>({});

  // Image popout
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', species: '' });

  // Load auth state
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.discord_id);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Fetch months with data
  const fetchMonthsWithData = useCallback(async () => {
    try {
      const response = await api.get('/adoption/months');
      if (response.data.success) {
        setMonthsWithData(response.data.months || []);
      }
    } catch (err) {
      console.error('Error fetching months with data:', err);
    }
  }, []);

  // Fetch species images
  const fetchSpeciesImages = useCallback(async (adoptsList: Adopt[]) => {
    if (!adoptsList?.length) return;

    const speciesNames = new Set<string>();
    adoptsList.forEach(adopt => {
      if (adopt.species1) speciesNames.add(adopt.species1);
      if (adopt.species2) speciesNames.add(adopt.species2);
      if (adopt.species3) speciesNames.add(adopt.species3);
    });

    if (speciesNames.size === 0) return;

    try {
      const response = await api.post('/species/images', {
        species: Array.from(speciesNames)
      });

      if (response.data.success && response.data.speciesImages) {
        const newImages: SpeciesImagesMap = {};
        Object.entries(response.data.speciesImages).forEach(([species, data]) => {
          const imageData = data as { image_url?: string; imageUrl?: string };
          const imageUrl = imageData.image_url || imageData.imageUrl;
          if (imageUrl) {
            newImages[species] = imageUrl;
          }
        });
        setSpeciesImages(prev => ({ ...prev, ...newImages }));
      }
    } catch (err) {
      console.error('Error fetching species images:', err);
    }
  }, []);

  // Fetch adoption data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch months with data if not already loaded
      if (monthsWithData.length === 0) {
        await fetchMonthsWithData();
      }

      const response = await api.get(`/adoption/${selectedYear}/${selectedMonth}`, {
        params: { page: pagination.page, limit: pagination.limit }
      });

      if (response.data.success) {
        const adoptsList = response.data.adopts || [];
        setAdopts(adoptsList);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.pagination?.totalPages || 1
        }));
        fetchSpeciesImages(adoptsList);
      } else {
        setError(response.data.message || 'Failed to load adoption data');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load adoption center data. Please try again later.'));
    } finally {
      setLoading(false);
    }
  }, [monthsWithData.length, fetchMonthsWithData, pagination.page, pagination.limit, selectedYear, selectedMonth, fetchSpeciesImages]);

  // Check daycare daypasses for each trainer
  const checkTrainerDaypasses = useCallback(async (trainers: TownTrainer[]) => {
    try {
      const daypasses: Record<string | number, { hasDaypass: boolean; daypassCount: number }> = {};

      for (const trainer of trainers) {
        try {
          const response = await api.get(`/adoption/check-daypass/${trainer.id}`);
          if (response.data.success) {
            daypasses[trainer.id] = {
              hasDaypass: response.data.hasDaypass,
              daypassCount: response.data.daypassCount || 0
            };
          }
        } catch {
          // If check fails for a trainer, default to no daypass
          daypasses[trainer.id] = { hasDaypass: false, daypassCount: 0 };
        }
      }

      setTrainerDaypasses(daypasses);
    } catch (err) {
      console.error('Error checking trainer daypasses:', err);
    }
  }, []);

  // Fetch user trainers
  const fetchUserTrainers = useCallback(async () => {
    try {
      const response = await api.get(`/trainers/user/${currentUserId}`);
      let trainers: TownTrainer[] = [];
      if (Array.isArray(response.data)) {
        trainers = response.data;
      } else if (response.data?.trainers) {
        trainers = response.data.trainers;
      } else if (response.data?.data) {
        trainers = response.data.data;
      }
      setUserTrainers(trainers);

      // Set default trainer if available
      if (trainers.length > 0 && !selectedTrainer) {
        setSelectedTrainer(trainers[0].id);
      }

      // Check daypasses for each trainer
      if (trainers.length > 0) {
        await checkTrainerDaypasses(trainers);
      }
    } catch (err) {
      console.error('Error fetching user trainers:', err);
    }
  }, [currentUserId, selectedTrainer, checkTrainerDaypasses]);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch user trainers when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      fetchUserTrainers();
    }
  }, [isAuthenticated, currentUserId, fetchUserTrainers]);

  // Fetch user artworks
  const fetchUserArtworks = async (page = 1) => {
    if (!currentUserId) return;

    try {
      setArtworksLoading(true);
      const response = await api.get('/submissions/gallery', {
        params: {
          page,
          limit: artworksPagination.limit,
          userId: currentUserId,
          sort: 'newest',
          search: artworkSearchQuery || undefined
        }
      });

      if (response.data.success) {
        setUserArtworks(response.data.submissions || []);
        setArtworksPagination(prev => ({
          ...prev,
          page,
          total: response.data.totalSubmissions || 0,
          totalPages: response.data.totalPages || 1
        }));
      }
    } catch (err) {
      console.error('Error fetching artworks:', err);
    } finally {
      setArtworksLoading(false);
    }
  };

  // Fetch trainer inventory
  const fetchTrainerInventory = async (trainerId: string | number) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/inventory`);
      if (response.data.success) {
        setTrainerInventory({
          berries: response.data.data.berries || {},
          pastries: response.data.data.pastries || {}
        });
      }
    } catch (err) {
      console.error('Error fetching trainer inventory:', err);
    }
  };

  // Open adopt modal
  const handleAdoptClick = (adopt: Adopt) => {
    setSelectedAdopt(adopt);
    setMonsterName(adopt.species1 || '');
    setShowAdoptModal(true);
    setAdoptionSuccess(false);
    setAdoptionError('');
    setAdoptedMonster(null);
    setSelectedArtwork(null);
    fetchUserArtworks();
  };

  // Close adopt modal
  const handleCloseAdoptModal = () => {
    setShowAdoptModal(false);
    setSelectedAdopt(null);
    setMonsterName('');
    setAdoptionError('');
    setSelectedArtwork(null);
  };

  // Handle adoption
  const handleAdopt = async () => {
    if (!selectedAdopt || !selectedTrainer) {
      setAdoptionError('Please select a trainer');
      return;
    }

    if (!monsterName.trim()) {
      setAdoptionError('Please enter a name for your monster');
      return;
    }

    if (!selectedArtwork) {
      setAdoptionError('Please select an artwork to proceed');
      return;
    }

    try {
      setAdoptionLoading(true);
      setAdoptionError('');

      const response = await api.post('/adoption/claim', {
        adoptId: selectedAdopt.id,
        trainerId: selectedTrainer,
        monsterName: monsterName.trim(),
        artworkId: selectedArtwork?.id
      });

      if (response.data.success) {
        setAdoptionSuccess(true);
        setAdoptedMonster(response.data.monster);

        // Refresh the list
        fetchData();

        // Fetch trainer inventory for item modal
        await fetchTrainerInventory(selectedTrainer);
      } else {
        setAdoptionError(response.data.message || 'Failed to adopt');
      }
    } catch (err) {
      setAdoptionError(extractErrorMessage(err, 'Failed to adopt. Please try again.'));
    } finally {
      setAdoptionLoading(false);
    }
  };

  // Open item modal after adoption
  const handleOpenItemModal = () => {
    setShowAdoptModal(false);
    setShowItemModal(true);
  };

  // Close item modal
  const handleCloseItemModal = () => {
    setShowItemModal(false);
    setAdoptedMonster(null);
  };

  // Handle item modal complete
  const handleItemModalComplete = (updatedMonster: Monster) => {
    setAdoptedMonster(updatedMonster as AdoptedMonster);
    setShowItemModal(false);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Get unique years from months with data
  const availableYears = [...new Set(monthsWithData.map(m => m.year))].sort((a, b) => b - a);

  // Get available months for selected year
  const availableMonths = monthsWithData
    .filter(m => m.year === selectedYear)
    .map(m => m.month)
    .sort((a, b) => a - b);

  // Helper to resolve a species image URL from the cache
  const getSpeciesImageUrl = (species: string | undefined): string | undefined => {
    if (!species) return undefined;
    const img = speciesImages[species];
    if (!img) return undefined;
    if (typeof img === 'string') return img;
    return (img as { image_url?: string }).image_url;
  };

  // Render adopt card
  const renderAdoptCard = (adopt: Adopt) => {
    const speciesList = [adopt.species1, adopt.species2, adopt.species3].filter(Boolean) as string[];
    const types = [adopt.type1, adopt.type2, adopt.type3, adopt.type4, adopt.type5].filter(Boolean) as string[];
    return (
      <div
        key={adopt.id}
        className={`adopt-card${adopt.is_adopted ? ' adopt-card--adopted' : ''}`}
        onClick={() => !adopt.is_adopted && handleAdoptClick(adopt)}
      >
        {/* Species showcase */}
        <div className={`adopt-card__showcase showcase--${speciesList.length}`}>
          {speciesList.map((species, idx) => {
            const url = getSpeciesImageUrl(species);
            return (
              <div
                key={species + idx}
                className={`adopt-card__species-slot${idx > 0 ? ' adopt-card__species-slot--fusion' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (url) {
                    setPopoutImage({ url, species });
                    setShowImagePopout(true);
                  }
                }}
              >
                {url ? (
                  <img src={url} alt={species} className="adopt-card__species-img" />
                ) : (
                  <div className="adopt-card__species-placeholder">
                    <span>{species.charAt(0)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info section */}
        <div className="adopt-card__info">
          <h4 className="adopt-card__name">{speciesList.join(' + ')}</h4>

          <div className="adopt-card__types">
            {types.map((type, idx) => (
              <TypeBadge key={idx} type={type} size="sm" />
            ))}
          </div>

          {adopt.attribute && (
            <div className="adopt-card__meta">
              <AttributeBadge attribute={adopt.attribute} size="sm" />
            </div>
          )}

          {adopt.is_adopted && (
            <div className="adopt-card__adopted-overlay">
              <i className="fas fa-check-circle"></i> Adopted
            </div>
          )}
        </div>
      </div>
    );
  };

  const classes = ['adoption-center', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Filters */}
      <div className="adoption-center__filters form-row gap-sm mb-md">
        <FormSelect
          name="year"
          value={selectedYear.toString()}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          options={availableYears.map(y => ({ value: y.toString(), label: y.toString() }))}
        />
        <FormSelect
          name="month"
          value={selectedMonth.toString()}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          options={availableMonths.map(m => ({
            value: m.toString(),
            label: MONTHS[m - 1]
          }))}
        />
      </div>

      {/* Main content */}
      {loading ? (
        <LoadingSpinner message="Loading adoptable monsters..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : adopts.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-dragon"></i>
          <p>No adoptable monsters available for this period.</p>
        </div>
      ) : (
        <DataGrid
          data={adopts}
          renderItem={(adopt) => renderAdoptCard(adopt)}
          keyExtractor={(adopt) => adopt.id.toString()}
          gridColumns={4}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Adoption Modal */}
      <Modal
        isOpen={showAdoptModal}
        onClose={handleCloseAdoptModal}
        title={adoptionSuccess ? 'Adoption Complete!' : `Adopt ${selectedAdopt?.species1 || ''}`}
        size="large"
      >
        {adoptionSuccess ? (
          <div className="adoption-success">
            <SuccessMessage message={`Successfully adopted ${adoptedMonster?.name || monsterName}!`} />

            <div className="adopted-monster-preview mt-md">
              {adoptedMonster && (
                <Card>
                  <div className="card__content gap-sm">
                    <h3>{adoptedMonster.name}</h3>
                    <p className="text-muted">
                      {[adoptedMonster.species1, adoptedMonster.species2, adoptedMonster.species3]
                        .filter(Boolean)
                        .join(' + ')}
                    </p>
                    <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                      {[adoptedMonster.type1, adoptedMonster.type2, adoptedMonster.type3,
                        adoptedMonster.type4, adoptedMonster.type5]
                        .filter(Boolean)
                        .map((type, idx) => (
                          <TypeBadge key={idx} type={type!} size="sm" />
                        ))}
                    </div>
                    {adoptedMonster.attribute && (
                      <AttributeBadge attribute={adoptedMonster.attribute} size="sm" />
                    )}
                  </div>
                </Card>
              )}
            </div>

            <ActionButtonGroup align="center" className="mt-md">
              <button className="button secondary" onClick={handleCloseAdoptModal}>
                Close
              </button>
              {adoptedMonster && (
                <button className="button primary" onClick={handleOpenItemModal}>
                  <i className="fas fa-box"></i> Use Items
                </button>
              )}
            </ActionButtonGroup>
          </div>
        ) : (
          <div className="adoption-form">
            {selectedAdopt && (
              <>
                {/* Adopt preview */}
                <div className="adopt-preview mb-md">
                  <Card>
                    <div className="card__content flex gap-md">
                      <div className="adopt-modal-species-images">
                        {[selectedAdopt.species1, selectedAdopt.species2, selectedAdopt.species3]
                          .filter(Boolean)
                          .map((species, idx) => {
                            const url = getSpeciesImageUrl(species!);
                            return (
                              <div
                                key={species}
                                className={`adopt-modal-species-container${url ? ' clickable' : ''}${idx > 0 ? ' fusion' : ''}`}
                                onClick={() => {
                                  if (url) {
                                    setPopoutImage({ url, species: species! });
                                    setShowImagePopout(true);
                                  }
                                }}
                                title={url ? `Click to view ${species}` : species}
                              >
                                {idx > 0 && <span className="adopt-fusion-plus">+</span>}
                                {url ? (
                                  <img src={url} alt={species} className="adopt-modal-species-img" />
                                ) : (
                                  <div className="adopt-species-placeholder">
                                    <span>{species!.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      <div className="flex flex-col gap-xs">
                        <h3>
                          {[selectedAdopt.species1, selectedAdopt.species2, selectedAdopt.species3]
                            .filter(Boolean)
                            .join(' + ')}
                        </h3>
                        <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                          {[selectedAdopt.type1, selectedAdopt.type2, selectedAdopt.type3,
                            selectedAdopt.type4, selectedAdopt.type5]
                            .filter(Boolean)
                            .map((type, idx) => (
                              <TypeBadge key={idx} type={type!} size="sm" />
                            ))}
                        </div>
                        {selectedAdopt.attribute && (
                          <AttributeBadge attribute={selectedAdopt.attribute} size="sm" />
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Form fields */}
                <div className="form-stack gap-sm">
                  <FormInput
                    name="monsterName"
                    label="Monster Name"
                    value={monsterName}
                    onChange={(e) => setMonsterName(e.target.value)}
                    placeholder="Enter a name for your new monster"
                    required
                  />

                  <div className="form-group">
                    <label className="form-label">Trainer</label>
                    <TrainerAutocomplete
                      selectedTrainerId={selectedTrainer}
                      onSelect={(id) => setSelectedTrainer(id || '')}
                      trainers={userTrainers.map(trainer => ({
                        ...trainer,
                        level: undefined,
                        displaySuffix: trainerDaypasses[trainer.id]?.hasDaypass
                          ? `${trainerDaypasses[trainer.id]?.daypassCount} Daypass(es)`
                          : 'No Daypasses'
                      }))}
                      placeholder="Type to search trainers..."
                    />
                  </div>

                  {/* Artwork selector */}
                  <div className="form-group">
                    <label className="form-label">Select Artwork <span className="required-indicator">*</span></label>

                    {/* Selected artwork preview */}
                    {selectedArtwork && (
                      <div className="selected-artwork-preview mb-sm">
                        <img
                          src={selectedArtwork.thumbnail_url || selectedArtwork.image_url}
                          alt={selectedArtwork.title}
                          className="selected-artwork-thumbnail"
                        />
                        <div className="selected-artwork-info">
                          <span className="selected-artwork-title">{selectedArtwork.title}</span>
                          <button
                            type="button"
                            className="button secondary sm"
                            onClick={() => setSelectedArtwork(null)}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}

                    {artworksLoading ? (
                      <LoadingSpinner />
                    ) : userArtworks.length > 0 ? (
                      <>
                        <SearchBar
                          value={artworkSearchQuery}
                          onChange={(value) => {
                            setArtworkSearchQuery(value);
                            fetchUserArtworks(1);
                          }}
                          placeholder="Search artworks..."
                        />
                        <div className="artwork-grid data-grid data-grid--sm gap-xs">
                          {userArtworks.map(artwork => (
                            <button
                              key={artwork.id}
                              className={`artwork-item card card--interactive ${selectedArtwork?.id === artwork.id ? 'card--selected' : ''}`}
                              onClick={() => setSelectedArtwork(
                                selectedArtwork?.id === artwork.id ? null : artwork
                              )}
                            >
                              <img
                                src={artwork.thumbnail_url || artwork.image_url}
                                alt={artwork.title}
                                className="artwork-thumbnail"
                              />
                            </button>
                          ))}
                        </div>
                        {artworksPagination.totalPages > 1 && (
                          <Pagination
                            currentPage={artworksPagination.page}
                            totalPages={artworksPagination.totalPages}
                            onPageChange={(page) => fetchUserArtworks(page)}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No artworks found.</p>
                    )}
                  </div>

                  {adoptionError && <ErrorMessage message={adoptionError} />}
                </div>

                <ActionButtonGroup align="end" className="mt-md">
                  <button
                    className="button secondary"
                    onClick={handleCloseAdoptModal}
                    disabled={adoptionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="button primary"
                    onClick={handleAdopt}
                    disabled={adoptionLoading || !selectedTrainer || !monsterName.trim() || !selectedArtwork}
                  >
                    {adoptionLoading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Adopting...</>
                    ) : (
                      <><i className="fas fa-heart"></i> Adopt</>
                    )}
                  </button>
                </ActionButtonGroup>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Image Popout Modal */}
      <Modal
        isOpen={showImagePopout}
        onClose={() => setShowImagePopout(false)}
        title={popoutImage.species}
        size="large"
      >
        <div className="image-popout">
          <img src={popoutImage.url} alt={popoutImage.species} className="w-full" />
        </div>
      </Modal>

      {/* Item Modal */}
      {adoptedMonster && (
        <AdoptionItemModal
          isOpen={showItemModal}
          onClose={handleCloseItemModal}
          monster={adoptedMonster}
          trainerId={selectedTrainer}
          trainerInventory={trainerInventory}
          onComplete={handleItemModalComplete}
        />
      )}
    </div>
  );
}

export default AdoptionCenter;
