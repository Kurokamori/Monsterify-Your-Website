import React from 'react';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

const PurchaseModal = ({
  item,
  quantity,
  setQuantity,
  maxQuantity,
  onConfirm,
  onCancel,
  error,
  success
}) => {
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(value);
    }
  };
  
  // Handle increment quantity
  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };
  
  // Handle decrement quantity
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  return (
    <div className="purchase-modal-overlay">
      <div className="purchase-modal">
        <div className="purchase-modal-header">
          <h2>Purchase Item</h2>
          <button className="button button-icon button-danger" onClick={onCancel}>×</button>
        </div>
        
        <div className="purchase-modal-content">
          <div className="item-preview">
            <img
              src={getItemImageUrl(item)}
              alt={item.name}
              className="item-preview-image"
              onError={(e) => handleItemImageError(e, item.category)}
            />
            <div className="item-preview-details">
              <h3 className="item-preview-name">{item.name}</h3>
              <p className="item-preview-description">
                {item.description || item.effect || 'No description available.'}
              </p>
            </div>
          </div>
          
          <div className="purchase-details">
            <div className="quantity-control">
              <label htmlFor="quantity">Quantity:</label>
              <div className="quantity-input-group">
                <button
                  className="button button-icon"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={maxQuantity}
                />
                <button
                  className="button button-icon"
                  onClick={handleIncrement}
                  disabled={quantity >= maxQuantity}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="price-summary">
              <div className="price-row">
                <span>Price per item:</span>
                <span>{item.price} <i className="fas fa-coins"></i></span>
              </div>
              <div className="price-row total">
                <span>Total price:</span>
                <span>{item.price * quantity} <i className="fas fa-coins"></i></span>
              </div>
            </div>
            
            {error && (
              <div className="purchase-error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="purchase-success">
                Purchase successful! Item added to your inventory.
              </div>
            )}
          </div>
        </div>
        
        <div className="purchase-modal-actions">
          <button
            className="button button-secondary"
            onClick={onCancel}
            disabled={success}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={onConfirm}
            disabled={maxQuantity < 1 || success}
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
