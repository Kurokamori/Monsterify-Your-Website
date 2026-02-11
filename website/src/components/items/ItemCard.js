import React from 'react';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

const ItemCard = ({
  item,
  onPurchaseClick,
  onItemClick,
  disabled = false,
  showPrice = false,
  showPurchase = false
}) => {
  // Get rarity class
  const getRarityClass = () => {
    if (!item.rarity) return '';

    const rarity = item.rarity.toLowerCase();
    if (rarity === 'common') return 'rarity-common';
    if (rarity === 'uncommon') return 'rarity-uncommon';
    if (rarity === 'rare') return 'rarity-rare';
    if (rarity === 'ultra rare') return 'rarity-ultra-rare';
    if (rarity === 'legendary') return 'rarity-legendary';

    return '';
  };

  // Get default image based on category - now handled by utility function

  const handleCardClick = (e) => {
    // Don't trigger if clicking on purchase button
    if (e.target.closest('.button.primary')) {
      return;
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div 
      className={`item-card ${getRarityClass()} ${disabled ? 'disabled' : ''}${onItemClick ? 'clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="item-image-container">
        <img
          src={getItemImageUrl(item)}
          alt={item.name}
          className="item-image"
          onError={(e) => handleItemImageError(e, item.category)}
        />
        {item.rarity && (
          <div className={`item-rarity ${getRarityClass()}`}>
            {item.rarity}
          </div>
        )}
      </div>

      <div className="item-content">
        <h3 className="item-name">{item.name}</h3>

        <div className="item-category">
          {item.category}
        </div>

        <p className="item-description">
          {item.description || item.effect || 'No description available.'}
        </p>

        {showPrice && (
          <div className="item-price">
            <span>{item.price}</span>
            <i className="fas fa-coins"></i>
          </div>
        )}

        {item.current_quantity !== undefined && item.current_quantity !== 999 && (
          <div className="item-quantity">
            <span>Available:</span>
            <span>{item.current_quantity}</span>
          </div>
        )}

        {showPurchase && (
          <button
            className="button primary"
            onClick={onPurchaseClick}
            disabled={disabled}
          >
            {item.current_quantity <= 0 ? 'Out of Stock' : 'Purchase'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
