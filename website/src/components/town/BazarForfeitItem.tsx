import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { FormSelect } from '../common/FormSelect';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { ConfirmModal, useConfirmModal } from '../common/ConfirmModal';
import { Card } from '../common/Card';
import api from '../../services/api';
import bazarService from '../../services/bazarService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { getItemImageUrl } from '../../utils/imageUtils';
import type {
  TownTrainer,
  BazarCategory,
  BazarForfeitItemProps
} from './types';

interface InventoryItemWithCategory {
  name: string;
  quantity: number;
  category: string;
  categoryLabel: string;
  image_url?: string;
}

type ForfeitSelection = Record<string, number>; // key: "category:itemName", value: quantity to forfeit

const CATEGORIES: BazarCategory[] = [
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
];

/**
 * BazarForfeitItem - Forfeit items to the bazar
 * Shows a grid of all inventory items, with optional category filter,
 * allowing multi-select with quantity controls for bulk forfeiting.
 */
export function BazarForfeitItem({
  className = '',
  onForfeitComplete
}: BazarForfeitItemProps) {
  // User's trainers
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<TownTrainer | null>(null);

  // Category filter (optional)
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Item image lookup map (name -> image_url)
  const [itemImagesMap, setItemImagesMap] = useState<Record<string, string>>({});

  // Full inventory
  const [allItems, setAllItems] = useState<InventoryItemWithCategory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Selection state: which items and how many to forfeit
  const [selections, setSelections] = useState<ForfeitSelection>({});

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirm modal
  const confirmModal = useConfirmModal();

  // Fetch user trainers on mount
  useEffect(() => {
    bazarService.getUserTrainers().then(data => {
      setUserTrainers(data.trainers || data || []);
    }).catch(() => setUserTrainers([]));
  }, []);

  // Fetch item image URLs on mount to build name -> image_url lookup
  useEffect(() => {
    api.get('/items', { params: { limit: 2000 } }).then(res => {
      const map: Record<string, string> = {};
      (res.data.data || []).forEach((item: { name: string; image_url?: string }) => {
        if (item.image_url) map[item.name] = item.image_url;
      });
      setItemImagesMap(map);
    }).catch(() => {});
  }, []);

  // Category filter options
  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...CATEGORIES.map(cat => ({ value: cat.key, label: cat.label }))
  ], []);

  // Fetch full inventory when trainer is selected
  const fetchInventory = useCallback(async (trainerId: string | number) => {
    try {
      setInventoryLoading(true);
      setError('');
      setSelections({});

      const response = await api.get(`/town/bazar/trainer/${trainerId}/inventory`);
      const inventory = response.data.inventory || {};

      const items: InventoryItemWithCategory[] = [];
      for (const cat of CATEGORIES) {
        const categoryData = inventory[cat.key] || {};
        for (const [name, qty] of Object.entries(categoryData)) {
          const quantity = qty as number;
          if (quantity > 0) {
            items.push({
              name,
              quantity,
              category: cat.key,
              categoryLabel: cat.label
            });
          }
        }
      }

      setAllItems(items);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load inventory'));
      setAllItems([]);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  // Filtered items based on category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return allItems;
    return allItems.filter(item => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  // Selected items count
  const selectedCount = useMemo(() => {
    return Object.values(selections).filter(qty => qty > 0).length;
  }, [selections]);

  // Item key helper
  const itemKey = (category: string, name: string) => `${category}:${name}`;

  // Toggle item selection
  const toggleItem = useCallback((item: InventoryItemWithCategory) => {
    const key = itemKey(item.category, item.name);
    setSelections(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: 1 };
    });
  }, []);

  // Update quantity for a selected item
  const updateQuantity = useCallback((item: InventoryItemWithCategory, qty: number) => {
    const key = itemKey(item.category, item.name);
    const clamped = Math.max(1, Math.min(qty, item.quantity));
    setSelections(prev => ({ ...prev, [key]: clamped }));
  }, []);

  // Handle trainer selection
  const handleTrainerSelect = useCallback((trainer: TownTrainer | null) => {
    setSelectedTrainer(trainer);
    setSelectedCategory('');
    setAllItems([]);
    setSelections({});
    setError('');
    setSuccess('');
    if (trainer) {
      fetchInventory(trainer.id);
    }
  }, [fetchInventory]);

  // Handle category change
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  }, []);

  // Build forfeit summary
  const forfeitSummary = useMemo(() => {
    const items: { category: string; name: string; quantity: number }[] = [];
    for (const [key, qty] of Object.entries(selections)) {
      if (qty <= 0) continue;
      const [category, ...nameParts] = key.split(':');
      items.push({ category, name: nameParts.join(':'), quantity: qty });
    }
    return items;
  }, [selections]);

  // Handle forfeit
  const handleForfeitClick = useCallback(() => {
    if (!selectedTrainer || forfeitSummary.length === 0) return;

    const itemDetails = (
      <ul>
        {forfeitSummary.map(i => (
          <li key={`${i.category}:${i.name}`}>{i.quantity}x {i.name}</li>
        ))}
      </ul>
    );

    confirmModal.confirmDanger(
      'Are you sure you want to forfeit the following items to the bazar?',
      async () => {
        try {
          setLoading(true);
          setError('');

          // Forfeit each item
          for (const item of forfeitSummary) {
            await api.post('/town/bazar/forfeit/item', {
              trainerId: selectedTrainer.id,
              itemName: item.name,
              category: item.category,
              quantity: item.quantity
            });
          }

          const totalItems = forfeitSummary.reduce((sum, i) => sum + i.quantity, 0);
          setSuccess(`Successfully forfeited ${totalItems} item(s) to the bazar!`);
          setSelections({});

          // Refresh inventory
          fetchInventory(selectedTrainer.id);

          onForfeitComplete?.();
        } catch (err) {
          setError(extractErrorMessage(err, 'Failed to forfeit items'));
        } finally {
          setLoading(false);
        }
      },
      {
        title: 'Confirm Forfeit',
        details: itemDetails,
        warning: 'This action cannot be undone.'
      }
    );
  }, [selectedTrainer, forfeitSummary, confirmModal, fetchInventory, onForfeitComplete]);

  // Clear selections
  const handleClearSelections = useCallback(() => {
    setSelections({});
  }, []);

  return (
    <div className={`bazar-forfeit-item ${className}`}>
      <div className="bazar-forfeit-item__header">
        <h2 className="bazar-forfeit-item__title">
          <i className="fas fa-gift"></i> Forfeit Items
        </h2>
        <p className="bazar-forfeit-item__description">
          Donate items from your inventory to the bazar for other trainers to collect.
        </p>
      </div>

      <div className="bazar-forfeit-item__content">
        {/* Trainer Selection */}
        <div className="bazar-forfeit-item__section">
          <label className="form-label">Select Trainer</label>
          <TrainerAutocomplete
            trainers={userTrainers}
            onSelectTrainer={handleTrainerSelect}
            value={selectedTrainer?.id ?? null}
            placeholder="Search your trainers..."
          />
        </div>

        {selectedTrainer && (
          <>
            {/* Category Filter */}
            <div className="bazar-forfeit-item__section">
              <FormSelect
                label="Filter by Category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={categoryOptions}
              />
            </div>

            {/* Inventory Grid */}
            <div className="bazar-forfeit-item__section">
              {inventoryLoading ? (
                <div className="bazar-forfeit-item__loading">
                  <LoadingSpinner size="sm" />
                  <span>Loading inventory...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="bazar-forfeit-item__empty">
                  <i className="fas fa-box-open"></i>
                  <span>No items found{selectedCategory ? ' in this category' : ''}.</span>
                </p>
              ) : (
                <>
                  {/* Selection controls */}
                  {selectedCount > 0 && (
                    <div className="bazar-forfeit-item__controls">
                      <div className="bazar-forfeit-item__selection-info">
                        <span className="bazar-forfeit-item__selection-count">
                          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="bazar-forfeit-item__selection-actions">
                        <button
                          type="button"
                          className="button secondary sm"
                          onClick={handleClearSelections}
                          disabled={loading}
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bazar-forfeit-item__grid">
                    {filteredItems.map(item => {
                      const key = itemKey(item.category, item.name);
                      const isSelected = key in selections;
                      const selectedQty = selections[key] || 0;

                      return (
                        <Card
                          key={key}
                          className={`bazar-forfeit-item__card ${isSelected ? 'bazar-forfeit-item__card--selected' : ''}`}
                          onClick={() => toggleItem(item)}
                          hoverable
                        >
                          <div className="bazar-forfeit-item__card-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(item)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="bazar-forfeit-item__card-info">
                            <div className="bazar-forfeit-item__card-image">
                              <img
                                src={itemImagesMap[item.name] || getItemImageUrl(item)}
                                alt={item.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/items/default.png';
                                }}
                              />
                            </div>
                            <h4 className="bazar-forfeit-item__card-name">{item.name}</h4>
                            <span className="bazar-forfeit-item__card-quantity">
                              Owned: {item.quantity}
                            </span>
                            <span className="bazar-forfeit-item__card-category">
                              {item.categoryLabel}
                            </span>
                          </div>

                          {/* Quantity controls when selected */}
                          {isSelected && (
                            <div
                              className="bazar-forfeit-item__card-qty-controls"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="button secondary sm"
                                onClick={() => updateQuantity(item, selectedQty - 1)}
                                disabled={selectedQty <= 1 || loading}
                                aria-label="Decrease quantity"
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <input
                                type="number"
                                className="input bazar-forfeit-item__qty-input"
                                value={selectedQty}
                                onChange={(e) => updateQuantity(item, parseInt(e.target.value) || 1)}
                                min={1}
                                max={item.quantity}
                                disabled={loading}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                className="button secondary sm"
                                onClick={() => updateQuantity(item, selectedQty + 1)}
                                disabled={selectedQty >= item.quantity || loading}
                                aria-label="Increase quantity"
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Messages */}
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        {/* Actions */}
        <ActionButtonGroup align="end" className="mt-md">
          <button
            className="button primary"
            onClick={handleForfeitClick}
            disabled={loading || !selectedTrainer || selectedCount === 0}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" message="" />
                Forfeiting...
              </>
            ) : (
              <>
                <i className="fas fa-gift"></i> Forfeit {selectedCount > 0 ? `(${selectedCount})` : ''}
              </>
            )}
          </button>
        </ActionButtonGroup>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        {...confirmModal.modalProps}
        loading={loading}
        confirmText="Forfeit"
      />
    </div>
  );
}

export default BazarForfeitItem;
