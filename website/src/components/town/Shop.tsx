import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { FormSelect } from '../common/FormSelect';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import {
  BERRY_DESCRIPTIONS,
  PASTRY_DESCRIPTIONS,
  BERRY_CATEGORIES,
  PASTRY_CATEGORIES,
} from '../../utils/itemHelpers';
import type {
  ShopItem,
  ShopCategory,
  ShopTrainer,
  ShopProps
} from './types';

// Filter definitions for specific shop categories
const BERRY_FILTERS: ShopCategory[] = [
  { id: 'all', name: 'All Berries' },
  { id: 'species', name: 'Species' },
  { id: 'type', name: 'Type' },
  { id: 'randomize', name: 'Randomize' },
  { id: 'add', name: 'Add' },
  { id: 'remove', name: 'Remove' },
  { id: 'misc', name: 'Misc' },
];

const PASTRY_FILTERS: ShopCategory[] = [
  { id: 'all', name: 'All Pastries' },
  { id: 'species', name: 'Species' },
  { id: 'type', name: 'Type' },
  { id: 'set', name: 'Set' },
  { id: 'add', name: 'Add' },
  { id: 'misc', name: 'Misc' },
];

// Get item image URL with fallback
const getItemImageUrl = (item: ShopItem): string => {
  if (item.image_url) return item.image_url;
  if (item.image_path) return item.image_path;
  return '/images/items/default.png';
};

// Get category-specific fallback image
const getCategoryFallbackImage = (category: string): string => {
  const fallbacks: Record<string, string> = {
    berry: '/images/items/berry-default.png',
    berries: '/images/items/berry-default.png',
    evolution: '/images/items/evolution-default.png',
    pokeball: '/images/items/pokeball-default.png',
    balls: '/images/items/pokeball-default.png',
    healing: '/images/items/potion-default.png',
    training: '/images/items/training-default.png'
  };
  return fallbacks[category.toLowerCase()] || '/images/items/default.png';
};

// Get description for an item based on shop category
const getItemDescription = (item: ShopItem, shopCategory?: string): string => {
  if (shopCategory === 'Berries' && BERRY_DESCRIPTIONS[item.name]) {
    return BERRY_DESCRIPTIONS[item.name];
  }
  if (shopCategory === 'Pastries' && PASTRY_DESCRIPTIONS[item.name]) {
    return PASTRY_DESCRIPTIONS[item.name];
  }
  return item.description || item.effect || '';
};

// Get filter categories for berry/pastry names
const getFilteredItemNames = (filterId: string, shopCategory?: string): string[] | null => {
  if (filterId === 'all') return null;

  if (shopCategory === 'Berries') {
    const cats = BERRY_CATEGORIES as Record<string, readonly string[]>;
    return cats[filterId] ? [...cats[filterId]] : null;
  }
  if (shopCategory === 'Pastries') {
    const cats = PASTRY_CATEGORIES as Record<string, readonly string[]>;
    return cats[filterId] ? [...cats[filterId]] : null;
  }
  return null;
};

/**
 * Shop component for purchasing items
 * Features category filtering, and purchase modal
 */
export function Shop({
  shopId,
  shopCategory,
  className = '',
  onPurchaseComplete
}: ShopProps) {
  const { currentUser, isAuthenticated } = useAuth();

  // Items state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ShopItem[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Trainer state
  const [userTrainers, setUserTrainers] = useState<ShopTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | number>('');

  // Purchase modal state
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // Determine filter categories based on shop category (exclude 'all' since stackable)
  const filterCategories = useMemo((): ShopCategory[] => {
    if (shopCategory === 'Berries') return BERRY_FILTERS.filter(f => f.id !== 'all');
    if (shopCategory === 'Pastries') return PASTRY_FILTERS.filter(f => f.id !== 'all');
    return [];
  }, [shopCategory]);

  // Toggle a filter on/off (stackable)
  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }, []);

  // Filter items client-side: item must match ALL active filters (intersection) + search term
  const filteredItems = useMemo(() => {
    let items = allItems;

    if (activeFilters.size > 0) {
      items = items.filter(item => {
        return Array.from(activeFilters).every(filterId => {
          const allowedNames = getFilteredItemNames(filterId, shopCategory);
          return !allowedNames || allowedNames.includes(item.name);
        });
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.effect?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allItems, activeFilters, shopCategory, searchTerm]);

  // Fetch shop items
  const fetchShopItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/shops/${shopId}/items`);

      if (response.data.success !== false) {
        const rawItems = response.data.data || response.data.items || [];
        const mapped: ShopItem[] = rawItems.map((item: Record<string, unknown>) => ({
          id: item.id as number,
          name: (item.name as string) || 'Unknown Item',
          description: (item.description as string) || (item.effect as string) || '',
          effect: (item.effect as string) || '',
          price: item.price as number,
          image_url: (item.image_url as string) || undefined,
          image_path: (item.image_path as string) || undefined,
          category: (item.category as string) || 'misc',
          stock: (item.current_quantity as number) ?? 999,
          is_limited: item.current_quantity != null,
        }));
        setAllItems(mapped);
      } else {
        setError(response.data.message || 'Failed to load shop items');
      }
    } catch (err) {
      console.error('Error fetching shop items:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load shop data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // Fetch user trainers
  const fetchUserTrainers = useCallback(async () => {
    if (!currentUser?.discord_id) return;

    try {
      const response = await api.get(`/trainers/user/${currentUser.discord_id}`);

      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(response.data)) {
        raw = response.data;
      } else if (response.data?.data) {
        raw = response.data.data;
      } else if (response.data?.trainers) {
        raw = response.data.trainers;
      }

      const trainers: ShopTrainer[] = raw.map((t) => ({
        ...t,
        id: t.id as number | string,
        name: t.name as string,
        currency_amount: (t.currency_amount as number) ?? 0,
      }));

      setUserTrainers(trainers);

      if (trainers.length > 0 && !selectedTrainer) {
        setSelectedTrainer(trainers[0].id);
      }
    } catch (err) {
      console.error('Error fetching user trainers:', err);
    }
  }, [currentUser?.discord_id, selectedTrainer]);

  useEffect(() => {
    fetchShopItems();
  }, [fetchShopItems]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTrainers();
    }
  }, [isAuthenticated, fetchUserTrainers]);

  // Handle item click
  const handleItemClick = useCallback((item: ShopItem) => {
    if (item.is_limited && item.stock === 0) return;

    setSelectedItem(item);
    setShowPurchaseModal(true);
    setPurchaseQuantity(1);
    setPurchaseSuccess(false);
    setPurchaseError('');
  }, []);

  // Close purchase modal
  const closePurchaseModal = useCallback(() => {
    setShowPurchaseModal(false);
    setSelectedItem(null);
    setPurchaseQuantity(1);
    setPurchaseError('');
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((delta: number) => {
    setPurchaseQuantity(prev => {
      const newValue = prev + delta;
      const maxQty = selectedItem?.is_limited ? selectedItem.stock : 99;
      return Math.max(1, Math.min(newValue, maxQty));
    });
  }, [selectedItem]);

  // Handle quantity input change
  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const maxQty = selectedItem?.is_limited ? selectedItem.stock : 99;
    setPurchaseQuantity(Math.max(1, Math.min(value, maxQty)));
  }, [selectedItem]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedItem ? selectedItem.price * purchaseQuantity : 0;
  }, [selectedItem, purchaseQuantity]);

  // Get selected trainer object
  const selectedTrainerObj = useMemo(() => {
    return userTrainers.find(t => t.id.toString() === selectedTrainer.toString());
  }, [userTrainers, selectedTrainer]);

  // Check if trainer can afford purchase
  const canAfford = useMemo(() => {
    if (!selectedTrainerObj) return false;
    return selectedTrainerObj.currency_amount >= totalPrice;
  }, [selectedTrainerObj, totalPrice]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!isAuthenticated) {
      setPurchaseError('You must be logged in to make a purchase.');
      return;
    }

    if (!selectedTrainer) {
      setPurchaseError('Please select a trainer for this purchase.');
      return;
    }

    if (!selectedItem) {
      setPurchaseError('No item selected.');
      return;
    }

    if (!canAfford) {
      setPurchaseError('Insufficient currency for this purchase.');
      return;
    }

    try {
      setPurchaseLoading(true);
      setPurchaseError('');

      const response = await api.post(`/shops/${shopId}/purchase`, {
        item_id: selectedItem.id,
        quantity: purchaseQuantity,
        trainer_id: selectedTrainer
      });

      if (response.data.success) {
        setPurchaseSuccess(true);
        await fetchUserTrainers();
        await fetchShopItems();
        onPurchaseComplete?.(selectedItem, purchaseQuantity, selectedTrainer);
      } else {
        setPurchaseError(response.data.message || 'Failed to complete purchase.');
      }
    } catch (err) {
      console.error('Error purchasing item:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setPurchaseError(error.response?.data?.message || 'Failed to purchase item. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  }, [
    isAuthenticated,
    selectedTrainer,
    selectedItem,
    canAfford,
    shopId,
    purchaseQuantity,
    fetchUserTrainers,
    fetchShopItems,
    onPurchaseComplete
  ]);

  // Handle buy more
  const handleBuyMore = useCallback(() => {
    setPurchaseSuccess(false);
    setPurchaseQuantity(1);
  }, []);

  // Handle image error
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, category: string) => {
    const target = e.target as HTMLImageElement;
    const fallback = getCategoryFallbackImage(category);
    if (target.src !== fallback) {
      target.src = fallback;
    }
  }, []);

  // Render item card
  const renderItemCard = (item: ShopItem) => {
    const isOutOfStock = item.is_limited && item.stock === 0;

    return (
      <Card
        key={item.id}
        className={`shop-item ${isOutOfStock ? 'shop-item--out-of-stock' : ''}`}
        onClick={() => handleItemClick(item)}
      >
        <div className="shop-item__image-container">
          <img
            src={getItemImageUrl(item)}
            alt={item.name}
            className="shop-item__image"
            onError={(e) => handleImageError(e, item.category)}
          />
          {item.is_limited && !isOutOfStock && (
            <span className="shop-item__badge shop-item__badge--limited">Limited</span>
          )}
          {isOutOfStock && (
            <span className="shop-item__badge shop-item__badge--out-of-stock">Out of Stock</span>
          )}
        </div>

        <div className="shop-item__info">
          <h4 className="shop-item__name">{item.name}</h4>
          <p className="shop-item__effect">{item.effect || getItemDescription(item, shopCategory)}</p>
          <div className="shop-item__price">
            <i className="fas fa-coins"></i>
            <span>{item.price.toLocaleString()}</span>
          </div>
          {item.is_limited && !isOutOfStock && (
            <span className="shop-item__stock">Stock: {item.stock}</span>
          )}
        </div>
      </Card>
    );
  };

  // Render purchase success
  const renderPurchaseSuccess = () => (
    <div className="shop-purchase-success">
      <div className="shop-purchase-success__icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h3>Purchase Successful!</h3>
      <p>
        You have successfully purchased {purchaseQuantity}{' '}
        {purchaseQuantity > 1 ? `${selectedItem?.name}s` : selectedItem?.name}.
      </p>
      <ActionButtonGroup align="center" className="mt-md">
        <button className="button secondary" onClick={closePurchaseModal}>
          Close
        </button>
        <button className="button primary" onClick={handleBuyMore}>
          <i className="fas fa-shopping-cart"></i> Buy More
        </button>
      </ActionButtonGroup>
    </div>
  );

  // Render purchase form
  const renderPurchaseForm = () => {
    if (!selectedItem) return null;

    return (
      <div className="shop-purchase-form">
        {/* Item preview */}
        <div className="shop-purchase-preview">
          <div className="shop-purchase-preview__image-container">
            <img
              src={getItemImageUrl(selectedItem)}
              alt={selectedItem.name}
              className="shop-purchase-preview__image"
              onError={(e) => handleImageError(e, selectedItem.category)}
            />
          </div>
          <div className="shop-purchase-preview__info">
            <p className="shop-purchase-preview__description">
              {getItemDescription(selectedItem, shopCategory)}
            </p>
            {selectedItem.effect && selectedItem.effect !== selectedItem.description && (
              <p className="shop-purchase-preview__effect">
                <strong>Effect:</strong> {selectedItem.effect}
              </p>
            )}
            <div className="shop-purchase-preview__meta">
              <div className="shop-purchase-preview__meta-item">
                <span className="label">Price:</span>
                <span className="value">
                  <i className="fas fa-coins"></i> {selectedItem.price.toLocaleString()}
                </span>
              </div>
              {selectedItem.is_limited && (
                <div className="shop-purchase-preview__meta-item">
                  <span className="label">Stock:</span>
                  <span className="value">{selectedItem.stock}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="shop-purchase-controls">
            {/* Quantity selector */}
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <div className="shop-quantity-selector">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={purchaseQuantity <= 1}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <input
                  type="number"
                  className="input shop-quantity-input"
                  min="1"
                  max={selectedItem.is_limited ? selectedItem.stock : 99}
                  value={purchaseQuantity}
                  onChange={handleQuantityInputChange}
                />
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={purchaseQuantity >= (selectedItem.is_limited ? selectedItem.stock : 99)}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Trainer selector */}
            <div className="form-group">
              <label className="form-label">Trainer</label>
              <FormSelect
                name="trainer"
                value={selectedTrainer.toString()}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                options={[
                  { value: '', label: 'Select a trainer' },
                  ...userTrainers.map(trainer => ({
                    value: trainer.id.toString(),
                    label: `${trainer.name} (${trainer.currency_amount.toLocaleString()} currency)`
                  }))
                ]}
              />
            </div>

            {/* Purchase summary */}
            <div className="shop-purchase-summary">
              <div className="shop-purchase-summary__row">
                <span className="label">Total:</span>
                <span className="value shop-purchase-summary__total">
                  <i className="fas fa-coins"></i> {totalPrice.toLocaleString()}
                </span>
              </div>

              {selectedTrainerObj && (
                <div className="shop-purchase-summary__row">
                  <span className="label">Trainer Balance:</span>
                  <span className={`value ${!canAfford ? 'text-danger' : ''}`}>
                    <i className="fas fa-coins"></i> {selectedTrainerObj.currency_amount.toLocaleString()}
                  </span>
                </div>
              )}

              {selectedTrainerObj && !canAfford && (
                <div className="shop-purchase-summary__warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  Insufficient currency
                </div>
              )}
            </div>

            {purchaseError && <ErrorMessage message={purchaseError} />}

            <ActionButtonGroup align="end" className="mt-md">
              <button
                className="button secondary"
                onClick={closePurchaseModal}
                disabled={purchaseLoading}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handlePurchase}
                disabled={purchaseLoading || !selectedTrainer || !canAfford}
              >
                {purchaseLoading ? (
                  <>
                    <LoadingSpinner size="sm" message="" />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart"></i> Purchase
                  </>
                )}
              </button>
            </ActionButtonGroup>
          </div>
        ) : (
          <div className="shop-purchase-login-prompt">
            <i className="fas fa-sign-in-alt"></i>
            <p>Please log in to purchase items.</p>
          </div>
        )}
      </div>
    );
  };

  const classes = ['shop', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Trainer currency display */}
      {isAuthenticated && userTrainers.length > 0 && (
        <div className="shop-wallet">
          <select
            className="shop-wallet__select select"
            value={selectedTrainer.toString()}
            onChange={(e) => setSelectedTrainer(e.target.value)}
          >
            {userTrainers.map(trainer => (
              <option key={trainer.id.toString()} value={trainer.id.toString()}>
                {trainer.name}
              </option>
            ))}
          </select>
          {selectedTrainerObj && (
            <div className="shop-wallet__balance">
              <i className="fas fa-coins"></i>
              <span className="shop-wallet__amount">{selectedTrainerObj.currency_amount.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Category filters (stackable, for Apothecary/Bakery) */}
      {filterCategories.length > 0 && (
        <div className="shop__categories">
          {filterCategories.map(category => (
            <button
              key={category.id}
              className={`button filter ${activeFilters.has(category.id) ? 'active-secondary' : ''}`}
              onClick={() => toggleFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              className="button danger no-flex"
              onClick={() => setActiveFilters(new Set())}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="shop__search">
        <i className="fas fa-search"></i>
        <input
          type="text"
          className="input"
          placeholder="Search items by name or effect..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="button ghost sm" onClick={() => setSearchTerm('')}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Items grid */}
      {loading ? (
        <LoadingSpinner message="Loading shop items..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchShopItems} />
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-store-slash"></i>
          <h4>No items available</h4>
          <p>There are no items in this category right now.</p>
        </div>
      ) : (
        <div className="shop__items data-grid data-grid--columns-4">
          {filteredItems.map(item => renderItemCard(item))}
        </div>
      )}

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={closePurchaseModal}
        title={purchaseSuccess ? 'Purchase Complete' : selectedItem?.name || 'Item Details'}
        size="medium"
      >
        {purchaseSuccess ? renderPurchaseSuccess() : renderPurchaseForm()}
      </Modal>
    </div>
  );
}

export default Shop;
