import { useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { ActionButtonGroup } from './ActionButtonGroup';

// Item interface for purchase modal
export interface PurchaseItem {
  id: number | string;
  name: string;
  description?: string;
  effect?: string;
  price: number;
  category?: string;
  image_url?: string;
  image_path?: string;
  stock?: number;
  is_limited?: boolean;
}

export interface PurchaseModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** The item being purchased */
  item: PurchaseItem | null;
  /** Maximum quantity that can be purchased (default: 99) */
  maxQuantity?: number;
  /** Callback when purchase is confirmed */
  onConfirm: (item: PurchaseItem, quantity: number) => Promise<void> | void;
  /** Optional loading state (controlled externally) */
  loading?: boolean;
  /** Optional error message (controlled externally) */
  error?: string;
  /** Optional success state (controlled externally) */
  success?: boolean;
  /** Success message to display */
  successMessage?: string;
  /** Whether to show "Buy More" button on success */
  showBuyMore?: boolean;
  /** Callback when "Buy More" is clicked */
  onBuyMore?: () => void;
  /** Custom image URL getter */
  getImageUrl?: (item: PurchaseItem) => string;
  /** Custom image error handler */
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>, category?: string) => void;
  /** Additional content to render before the purchase button */
  children?: React.ReactNode;
}

// Default image URL getter
const defaultGetImageUrl = (item: PurchaseItem): string => {
  return item.image_url || item.image_path || '/images/items/default.png';
};

// Default category fallback images
const getCategoryFallbackImage = (category?: string): string => {
  if (!category) return '/images/items/default.png';

  const fallbacks: Record<string, string> = {
    berry: '/images/items/berry-default.png',
    berries: '/images/items/berry-default.png',
    evolution: '/images/items/evolution-default.png',
    pokeball: '/images/items/pokeball-default.png',
    balls: '/images/items/pokeball-default.png',
    healing: '/images/items/potion-default.png',
    training: '/images/items/training-default.png',
    held_item: '/images/items/held-default.png'
  };

  return fallbacks[category.toLowerCase()] || '/images/items/default.png';
};

/**
 * PurchaseModal - Reusable modal for purchasing items
 * Features quantity controls, price summary, and success/error states
 */
export function PurchaseModal({
  isOpen,
  onClose,
  item,
  maxQuantity = 99,
  onConfirm,
  loading: externalLoading,
  error: externalError,
  success: externalSuccess,
  successMessage = 'Purchase successful! Item added to your inventory.',
  showBuyMore = true,
  onBuyMore,
  getImageUrl = defaultGetImageUrl,
  onImageError,
  children
}: PurchaseModalProps) {
  // Internal state for uncontrolled usage
  const [quantity, setQuantity] = useState(1);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [internalSuccess, setInternalSuccess] = useState(false);

  // Use external state if provided, otherwise use internal
  const loading = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;
  const success = externalSuccess ?? internalSuccess;

  // Calculate effective max quantity
  const effectiveMaxQuantity = useMemo(() => {
    if (item?.is_limited && item.stock !== undefined) {
      return Math.min(maxQuantity, item.stock);
    }
    return maxQuantity;
  }, [item, maxQuantity]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return item ? item.price * quantity : 0;
  }, [item, quantity]);

  // Handle quantity input change
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > effectiveMaxQuantity) {
      setQuantity(effectiveMaxQuantity);
    } else {
      setQuantity(value);
    }
  }, [effectiveMaxQuantity]);

  // Handle increment
  const handleIncrement = useCallback(() => {
    setQuantity(prev => Math.min(prev + 1, effectiveMaxQuantity));
  }, [effectiveMaxQuantity]);

  // Handle decrement
  const handleDecrement = useCallback(() => {
    setQuantity(prev => Math.max(prev - 1, 1));
  }, []);

  // Handle confirm purchase
  const handleConfirm = useCallback(async () => {
    if (!item) return;

    try {
      setInternalLoading(true);
      setInternalError('');
      await onConfirm(item, quantity);
      setInternalSuccess(true);
    } catch (err) {
      const error = err as Error;
      setInternalError(error.message || 'Failed to complete purchase.');
    } finally {
      setInternalLoading(false);
    }
  }, [item, quantity, onConfirm]);

  // Handle buy more
  const handleBuyMore = useCallback(() => {
    setQuantity(1);
    setInternalSuccess(false);
    setInternalError('');
    onBuyMore?.();
  }, [onBuyMore]);

  // Handle close
  const handleClose = useCallback(() => {
    setQuantity(1);
    setInternalSuccess(false);
    setInternalError('');
    onClose();
  }, [onClose]);

  // Handle image error
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onImageError) {
      onImageError(e, item?.category);
    } else {
      const target = e.target as HTMLImageElement;
      const fallback = getCategoryFallbackImage(item?.category);
      if (target.src !== fallback) {
        target.src = fallback;
      }
    }
  }, [item?.category, onImageError]);

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={success ? 'Purchase Complete' : 'Purchase Item'}
      size="medium"
    >
      {success ? (
        <div className="purchase-modal__success">
          <div className="purchase-modal__success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>Success!</h3>
          <p>{successMessage}</p>
          <ActionButtonGroup align="center" className="mt-md">
            <button className="button secondary" onClick={handleClose}>
              Close
            </button>
            {showBuyMore && (
              <button className="button primary" onClick={handleBuyMore}>
                <i className="fas fa-shopping-cart"></i> Buy More
              </button>
            )}
          </ActionButtonGroup>
        </div>
      ) : (
        <div className="purchase-modal__content">
          {/* Item Preview */}
          <div className="purchase-modal__preview">
            <div className="purchase-modal__image-container">
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="purchase-modal__image"
                onError={handleImageError}
              />
            </div>
            <div className="purchase-modal__details">
              <h3 className="purchase-modal__name">{item.name}</h3>
              <p className="purchase-modal__description">
                {item.description || item.effect || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Purchase Controls */}
          <div className="purchase-modal__controls">
            {/* Quantity Control */}
            <div className="purchase-modal__quantity">
              <label className="form-label" htmlFor="purchase-quantity">Quantity</label>
              <div className="purchase-modal__quantity-input">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || loading}
                  aria-label="Decrease quantity"
                >
                  <i className="fas fa-minus"></i>
                </button>
                <input
                  type="number"
                  id="purchase-quantity"
                  className="input purchase-modal__quantity-field"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min={1}
                  max={effectiveMaxQuantity}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleIncrement}
                  disabled={quantity >= effectiveMaxQuantity || loading}
                  aria-label="Increase quantity"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              {item.is_limited && item.stock !== undefined && (
                <span className="purchase-modal__stock">
                  {item.stock} in stock
                </span>
              )}
            </div>

            {/* Price Summary */}
            <div className="purchase-modal__price-summary">
              <div className="purchase-modal__price-row">
                <span className="label">Price per item:</span>
                <span className="value">
                  <i className="fas fa-coins"></i> {item.price.toLocaleString()}
                </span>
              </div>
              <div className="purchase-modal__price-row purchase-modal__price-row--total">
                <span className="label">Total price:</span>
                <span className="value">
                  <i className="fas fa-coins"></i> {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Additional content (e.g., trainer selector) */}
            {children}

            {/* Error Message */}
            {error && <ErrorMessage message={error} />}
          </div>

          {/* Actions */}
          <ActionButtonGroup align="end" className="mt-md">
            <button
              className="button secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={handleConfirm}
              disabled={loading || effectiveMaxQuantity < 1}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" message="" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-shopping-cart"></i> Confirm Purchase
                </>
              )}
            </button>
          </ActionButtonGroup>
        </div>
      )}
    </Modal>
  );
}

export default PurchaseModal;
