import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { FormSelect } from '../common/FormSelect';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { Card } from '../common/Card';
import api from '../../services/api';
import bazarService from '../../services/bazarService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type {
  TownTrainer,
  BazarCategory,
  BazarItem,
  BazarCollectItemProps
} from './types';

/**
 * BazarCollectItem - Collect items from the bazar
 * Browse and claim items forfeited by other trainers
 */
export function BazarCollectItem({
  className = '',
  onCollectComplete
}: BazarCollectItemProps) {
  // Categories
  const [categories] = useState<BazarCategory[]>([
    { key: '', label: 'All Categories' },
    { key: 'items', label: 'Items' },
    { key: 'balls', label: 'Poké Balls' },
    { key: 'berries', label: 'Berries' },
    { key: 'pastries', label: 'Pastries' },
    { key: 'evolution', label: 'Evolution Items' },
    { key: 'eggs', label: 'Eggs' },
    { key: 'antiques', label: 'Antiques' },
    { key: 'helditems', label: 'Held Items' },
    { key: 'seals', label: 'Seals' },
    { key: 'keyitems', label: 'Key Items' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Items and pagination
  const [items, setItems] = useState<BazarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  // User's trainers
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);

  // Collection modal
  const [selectedItem, setSelectedItem] = useState<BazarItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TownTrainer | null>(null);
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState('');
  const [collectSuccess, setCollectSuccess] = useState('');

  // Category options for select
  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({
      value: cat.key,
      label: cat.label
    }));
  }, [categories]);

  // Fetch available items
  const fetchItems = useCallback(async (page = 1, category = '') => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      if (category) {
        params.append('category', category);
      }

      const response = await api.get(`/town/bazar/items?${params.toString()}`);

      setItems(response.data.items || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: pagination.limit
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load bazar items'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchItems(1, selectedCategory);
    bazarService.getUserTrainers().then(data => {
      setUserTrainers(data.trainers || data || []);
    }).catch(() => setUserTrainers([]));
  }, [fetchItems, selectedCategory]);

  // Handle category change
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchItems(page, selectedCategory);
  }, [fetchItems, selectedCategory]);

  // Open collection modal
  const handleItemClick = useCallback((item: BazarItem) => {
    setSelectedItem(item);
    setSelectedTrainer(null);
    setCollectError('');
    setCollectSuccess('');
    setShowModal(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedItem(null);
    setSelectedTrainer(null);
    setCollectError('');
    setCollectSuccess('');
  }, []);

  // Handle collection
  const handleCollect = useCallback(async () => {
    if (!selectedItem || !selectedTrainer) return;

    try {
      setCollectLoading(true);
      setCollectError('');

      await api.post('/town/bazar/collect/item', {
        bazarItemId: selectedItem.id,
        trainerId: selectedTrainer.id,
        quantity: selectedItem.quantity
      });

      setCollectSuccess(`Successfully collected ${selectedItem.name}!`);
      onCollectComplete?.(selectedItem, selectedTrainer.id);

      // Refresh items list after a short delay
      setTimeout(() => {
        handleCloseModal();
        fetchItems(pagination.page, selectedCategory);
      }, 1500);
    } catch (err) {
      setCollectError(extractErrorMessage(err, 'Failed to collect item'));
    } finally {
      setCollectLoading(false);
    }
  }, [selectedItem, selectedTrainer, pagination.page, selectedCategory, fetchItems, handleCloseModal, onCollectComplete]);

  // Get image URL for item
  const getItemImage = useCallback((item: BazarItem) => {
    return item.image_url || item.image_path || '/images/items/default.png';
  }, []);

  return (
    <div className={`bazar-collect-item ${className}`}>
      <div className="bazar-collect-item__header">
        <h2 className="bazar-collect-item__title">
          <i className="fas fa-box-open"></i> Collect Items
        </h2>
        <p className="bazar-collect-item__description">
          Browse items forfeited by other trainers and add them to your collection.
        </p>
      </div>

      {/* Filter */}
      <div className="bazar-collect-item__filter">
        <FormSelect
          label="Filter by Category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          options={categoryOptions}
        />
      </div>

      {/* Content */}
      <div className="bazar-collect-item__content">
        {loading ? (
          <div className="bazar-collect-item__loading">
            <LoadingSpinner />
            <p>Loading available items...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : items.length === 0 ? (
          <div className="bazar-collect-item__empty">
            <i className="fas fa-box-open"></i>
            <p>No items available in the bazar.</p>
          </div>
        ) : (
          <>
            <div className="bazar-collect-item__grid">
              {items.map(item => (
                <Card
                  key={item.id}
                  className="bazar-collect-item__card"
                  onClick={() => handleItemClick(item)}
                  hoverable
                >
                  <div className="bazar-collect-item__card-image">
                    <img
                      src={getItemImage(item)}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/items/default.png';
                      }}
                    />
                  </div>
                  <div className="bazar-collect-item__card-info">
                    <h4 className="bazar-collect-item__card-name">{item.name}</h4>
                    <span className="bazar-collect-item__card-quantity">
                      x{item.quantity}
                    </span>
                    <span className="bazar-collect-item__card-category">
                      {item.category}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Collection Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Collect Item"
        size="medium"
      >
        {selectedItem && (
          <div className="bazar-collect-item__modal-content">
            {collectSuccess ? (
              <div className="bazar-collect-item__success">
                <div className="bazar-collect-item__success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Success!</h3>
                <p>{collectSuccess}</p>
              </div>
            ) : (
              <>
                {/* Item Preview */}
                <div className="bazar-collect-item__preview">
                  <div className="bazar-collect-item__preview-image">
                    <img
                      src={getItemImage(selectedItem)}
                      alt={selectedItem.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/items/default.png';
                      }}
                    />
                  </div>
                  <div className="bazar-collect-item__preview-info">
                    <h3>{selectedItem.name}</h3>
                    <p className="bazar-collect-item__preview-quantity">
                      Available: {selectedItem.quantity}
                    </p>
                    <span className="bazar-collect-item__preview-category">
                      {selectedItem.category}
                    </span>
                  </div>
                </div>

                {/* Trainer Selection */}
                <div className="bazar-collect-item__trainer-select">
                  <label className="form-label">Select Trainer to Receive Item</label>
                  <TrainerAutocomplete
                    trainers={userTrainers}
                    onSelectTrainer={(trainer) => setSelectedTrainer(trainer as TownTrainer | null)}
                    value={selectedTrainer?.id ?? null}
                    placeholder="Search your trainers..."
                  />
                </div>

                {collectError && <ErrorMessage message={collectError} />}

                {/* Actions */}
                <ActionButtonGroup align="end" className="mt-md">
                  <button
                    className="button secondary"
                    onClick={handleCloseModal}
                    disabled={collectLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="button primary"
                    onClick={handleCollect}
                    disabled={collectLoading || !selectedTrainer}
                  >
                    {collectLoading ? (
                      <>
                        <LoadingSpinner size="sm" message="" />
                        Collecting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-hand-holding"></i> Collect
                      </>
                    )}
                  </button>
                </ActionButtonGroup>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BazarCollectItem;
