import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import {
  LoadingSpinner,
  ErrorMessage,
  Card,
  Modal,
  Pagination,
  TypeBadge,
  AttributeBadge
} from '@components/common';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import {
  AntiqueAppraisal,
  AntiqueAuction,
} from '@components/town';
import type { TownTrainer, AntiqueAuctionOption } from '@components/town';
import antiqueService from '@services/antiqueService';
import api from '@services/api';
import { extractErrorMessage } from '@utils/errorUtils';
import { getItemImageUrl, handleItemImageError } from '@utils/imageUtils';
import '@styles/town/item-use.css';

type ActiveView = 'inventory' | 'catalogue';

interface AntiqueItem {
  name: string;
  quantity: number;
}

interface CatalogueFilters {
  antiques: Array<{ name: string; holiday?: string }>;
  holidays: string[];
  types: string[];
  creators: string[];
}

interface SelectedFilters {
  antique: string;
  species: string;
  type: string;
  creator: string;
}

interface CataloguePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AntiqueStorePage() {
  useDocumentTitle('Antique Store');

  const { isAuthenticated, currentUser } = useAuth();

  // View state
  const [activeView, setActiveView] = useState<ActiveView>('inventory');

  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalogueLoading, setCatalogueLoading] = useState(false);

  // Trainer state
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');

  // Inventory state
  const [trainerAntiques, setTrainerAntiques] = useState<AntiqueItem[]>([]);
  const [selectedAntique, setSelectedAntique] = useState<AntiqueItem | null>(null);

  // Modal state
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

  // Catalogue state
  const [catalogueData, setCatalogueData] = useState<AntiqueAuctionOption[]>([]);
  const [catalogueFilters, setCatalogueFilters] = useState<CatalogueFilters>({
    antiques: [],
    holidays: [],
    types: [],
    creators: []
  });
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    antique: '',
    species: '',
    type: '',
    creator: ''
  });
  const [cataloguePagination, setCataloguePagination] = useState<CataloguePagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });

  // Image popout state
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', name: '' });

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
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated, currentUser]);

  // Fetch trainer antiques when trainer is selected
  const fetchTrainerAntiques = useCallback(async (trainerId: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await antiqueService.getTrainerAntiques(trainerId);
      setTrainerAntiques(response.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch antiques.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    } else {
      setTrainerAntiques([]);
    }
  }, [selectedTrainer, fetchTrainerAntiques]);

  // Fetch catalogue filters when switching to catalogue view
  useEffect(() => {
    if (activeView === 'catalogue' && catalogueFilters.antiques.length === 0) {
      const fetchFilters = async () => {
        try {
          const response = await antiqueService.getCatalogueFilters();
          if (response.success && response.data) {
            setCatalogueFilters({
              antiques: response.data.antiques || [],
              holidays: response.data.holidays || [],
              types: response.data.types || [],
              creators: response.data.creators || []
            });
          }
        } catch (err) {
          console.error('Error fetching catalogue filters:', err);
        }
      };
      fetchFilters();
    }
  }, [activeView, catalogueFilters.antiques.length]);

  // Fetch catalogue data when filters or pagination change
  useEffect(() => {
    if (activeView !== 'catalogue') return;

    const fetchCatalogue = async () => {
      try {
        setCatalogueLoading(true);
        const response = await antiqueService.getAuctionCatalogue({
          ...selectedFilters,
          page: cataloguePagination.page,
          limit: cataloguePagination.limit
        });

        if (response.success) {
          setCatalogueData(response.data || []);
          if (response.pagination) {
            setCataloguePagination(prev => ({
              ...prev,
              total: response.pagination.total,
              totalPages: response.pagination.totalPages
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching catalogue data:', err);
      } finally {
        setCatalogueLoading(false);
      }
    };

    fetchCatalogue();
  }, [activeView, selectedFilters, cataloguePagination.page, cataloguePagination.limit]);

  // Handle filter change
  const handleFilterChange = useCallback((filterName: keyof SelectedFilters, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [filterName]: value }));
    setCataloguePagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedFilters({ antique: '', species: '', type: '', creator: '' });
    setCataloguePagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle appraise/auction clicks
  const handleAppraiseClick = useCallback((antique: AntiqueItem) => {
    setSelectedAntique(antique);
    setShowAppraisalModal(true);
  }, []);

  const handleAuctionClick = useCallback((antique: AntiqueItem) => {
    setSelectedAntique(antique);
    setShowAuctionModal(true);
  }, []);

  // Close modals and refresh
  const closeAppraisalModal = useCallback(() => {
    setShowAppraisalModal(false);
    setSelectedAntique(null);
    if (selectedTrainer) fetchTrainerAntiques(selectedTrainer);
  }, [selectedTrainer, fetchTrainerAntiques]);

  const closeAuctionModal = useCallback(() => {
    setShowAuctionModal(false);
    setSelectedAntique(null);
    if (selectedTrainer) fetchTrainerAntiques(selectedTrainer);
  }, [selectedTrainer, fetchTrainerAntiques]);

  // Image popout
  const openImagePopout = useCallback((imageUrl: string, name: string) => {
    if (!imageUrl) return;
    setPopoutImage({ url: imageUrl, name });
    setShowImagePopout(true);
  }, []);

  // Helper functions
  const getSpeciesDisplay = (option: AntiqueAuctionOption) => {
    return [option.species1, option.species2, option.species3].filter(Boolean).join(' + ');
  };

  const getTypes = (option: AntiqueAuctionOption) => {
    return [option.type1, option.type2, option.type3, option.type4, option.type5].filter(Boolean) as string[];
  };

  const getAntiqueDisplayName = (item: AntiqueAuctionOption) => {
    const antiqueData = catalogueFilters.antiques.find(a => a.name === item.antique);
    if (antiqueData?.holiday) {
      return `${item.antique} (${antiqueData.holiday})`;
    }
    return item.antique || '';
  };

  return (
    <div className="item-use-page">
      <div className="item-use-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      <div className="item-use-page__header">
        <div className="item-use-page__icon">
          <i className="fas fa-gem"></i>
        </div>
        <div>
          <h1>Antique Store</h1>
          <p className="item-use-page__description">
            Appraise your antiques for a random monster roll or auction them for a specific monster
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* View Toggle */}
      <div className="antique-store__tabs">
        <button
          className={`button tab ${activeView === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveView('inventory')}
        >
          <i className="fas fa-box-open"></i> My Inventory
        </button>
        <button
          className={`button tab ${activeView === 'catalogue' ? 'active' : ''}`}
          onClick={() => setActiveView('catalogue')}
        >
          <i className="fas fa-book-open"></i> Explore Catalogue
        </button>
      </div>

      <div className="antique-store__content">
        {activeView === 'inventory' ? (
          <div className="antique-store__inventory">
            {/* Trainer Selection */}
            <div className="form-group">
              <TrainerAutocomplete
                trainers={userTrainers}
                selectedTrainerId={selectedTrainer || null}
                onSelect={(id) => setSelectedTrainer(id ? String(id) : '')}
                label="Select Trainer"
                placeholder="Type to search trainers..."
              />
            </div>

            {loading ? (
              <div className="state-container state-container--centered">
                <LoadingSpinner />
                <p className="spinner-message">Loading antiques...</p>
              </div>
            ) : selectedTrainer ? (
              trainerAntiques.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-gem"></i>
                  <h3>No Antiques Found</h3>
                  <p>This trainer doesn't have any antiques. Antiques can be obtained from special events, shops, or as rewards.</p>
                </div>
              ) : (
                <div className="data-grid__items data-grid__items--grid data-grid__items--md data-grid__items--gap-md">
                  {trainerAntiques.map((antique, index) => (
                    <Card key={`antique-${index}`} className="antique-store__item-card">
                      <div className="antique-store__item-image">
                        <img
                          src={getItemImageUrl({ name: antique.name, category: 'antique' })}
                          alt={antique.name}
                          onError={(e) => handleItemImageError(e, 'antique')}
                        />
                      </div>
                      <div className="card__content">
                        <h4 className="mb-xxs">{antique.name}</h4>
                        <p className="text-sm text-muted mb-sm">Quantity: {antique.quantity}</p>
                        <div className="antique-store__item-actions">
                          <button
                            className="button primary sm"
                            onClick={() => handleAppraiseClick(antique)}
                          >
                            <i className="fas fa-search"></i> Appraise
                          </button>
                          <button
                            className="button secondary sm"
                            onClick={() => handleAuctionClick(antique)}
                          >
                            <i className="fas fa-gavel"></i> Auction
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="empty-state">
                <i className="fas fa-hand-pointer"></i>
                <h3>Select a Trainer</h3>
                <p>Choose a trainer to view their antique collection.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="antique-store__catalogue">
            {/* Catalogue Filters */}
            <div className="antique-store__filters">
              <div className="form-group">
                <label className="form-label">Antique</label>
                <select
                  className="input"
                  value={selectedFilters.antique}
                  onChange={(e) => handleFilterChange('antique', e.target.value)}
                >
                  <option value="">All Antiques</option>
                  {catalogueFilters.antiques.map((antique, index) => (
                    <option key={index} value={antique.name}>
                      {antique.name} ({antique.holiday || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Species</label>
                <input
                  type="text"
                  className="input"
                  value={selectedFilters.species}
                  onChange={(e) => handleFilterChange('species', e.target.value)}
                  placeholder="Search species..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="input"
                  value={selectedFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  {catalogueFilters.types.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Creator</label>
                <select
                  className="input"
                  value={selectedFilters.creator}
                  onChange={(e) => handleFilterChange('creator', e.target.value)}
                >
                  <option value="">All Creators</option>
                  {catalogueFilters.creators.map((creator, index) => (
                    <option key={index} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>

              <button className="button danger no-flex" onClick={clearFilters}>
                <i className="fas fa-times"></i> Clear Filters
              </button>
            </div>

            {/* Catalogue Grid */}
            {catalogueLoading ? (
              <div className="state-container state-container--centered">
                <LoadingSpinner />
                <p className="spinner-message">Loading catalogue...</p>
              </div>
            ) : catalogueData.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-search"></i>
                <h3>No Results Found</h3>
                <p>No monsters found matching your filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <>
                <div className="data-grid__items data-grid__items--grid data-grid__items--md data-grid__items--gap-md">
                  {catalogueData.map((item) => (
                    <Card key={item.id} className="antique-store__catalogue-card">
                      <div className="card__content">
                        {/* Image */}
                        {item.image && (
                          <div
                            className="auction-option__image-container"
                            onClick={() => openImagePopout(item.image!, item.name || item.species1)}
                          >
                            <img
                              src={item.image}
                              alt={item.name || item.species1}
                              className="auction-option__image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="auction-option__zoom-hint">Click to enlarge</span>
                          </div>
                        )}

                        {/* Name */}
                        <h4 className="antique-store__catalogue-name">{item.name || getSpeciesDisplay(item)}</h4>

                        {/* Antique name */}
                        {item.antique && (
                          <p className="antique-store__catalogue-detail">
                            <i className="fas fa-gem"></i> {getAntiqueDisplayName(item)}
                          </p>
                        )}

                        {/* Species */}
                        <p className="antique-store__catalogue-detail">
                          <strong>Species:</strong> {getSpeciesDisplay(item)}
                        </p>

                        {/* Types */}
                        <div className="badge-group badge-group--sm badge-group--wrap badge-group--gap-xs">
                          {getTypes(item).map((type, idx) => (
                            <TypeBadge key={idx} type={type} size="sm" />
                          ))}
                        </div>

                        {/* Attribute */}
                        {item.attribute && (
                          <AttributeBadge attribute={item.attribute} size="sm" />
                        )}

                        {/* Creator */}
                        {item.creator && (
                          <p className="antique-store__catalogue-artist">
                            <strong>Artist:</strong> {item.creator}
                          </p>
                        )}

                        {/* Description */}
                        {item.description && (
                          <p className="antique-store__catalogue-description">{item.description}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {cataloguePagination.totalPages > 1 && (
                  <div className="mt-md">
                    <Pagination
                      currentPage={cataloguePagination.page}
                      totalPages={cataloguePagination.totalPages}
                      onPageChange={(page) => setCataloguePagination(prev => ({ ...prev, page }))}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Appraisal Modal */}
      {selectedAntique && (
        <AntiqueAppraisal
          isOpen={showAppraisalModal}
          trainerId={selectedTrainer}
          antique={selectedAntique.name}
          onClose={closeAppraisalModal}
        />
      )}

      {/* Auction Modal */}
      {selectedAntique && (
        <AntiqueAuction
          isOpen={showAuctionModal}
          trainerId={selectedTrainer}
          antique={selectedAntique.name}
          onClose={closeAuctionModal}
          userTrainers={userTrainers}
        />
      )}

      {/* Image Popout Modal */}
      <Modal
        isOpen={showImagePopout}
        onClose={() => setShowImagePopout(false)}
        title={popoutImage.name}
        size="large"
      >
        <div className="image-popout text-center">
          <img
            src={popoutImage.url}
            alt={popoutImage.name}
            className="w-full"
          />
        </div>
      </Modal>
    </div>
  );
}
