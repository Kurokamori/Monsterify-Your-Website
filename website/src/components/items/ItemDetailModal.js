import React from 'react';
import Modal from '../common/Modal';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

const ItemDetailModal = ({ isOpen, onClose, item }) => {
  if (!item) return null;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item Details">
      <div className="item-detail-modal">
        <div className="item-detail-header">
          <div className="item-detail-image-container">
            <img
              src={getItemImageUrl(item)}
              alt={item.name}
              className="floating-monster"
              onError={(e) => handleItemImageError(e, item.category)}
            />
            {item.rarity && (
              <div className={`item-detail-rarity${getRarityClass()}`}>
                {item.rarity}
              </div>
            )}
          </div>
          
          <div className="compact-trainer-info">
            <h2 className="item-detail-name">{item.name}</h2>
            {item.category && (
              <div className="item-detail-category">{item.category}</div>
            )}
          </div>
        </div>

        <div className="item-detail-content">
          {item.description && (
            <div className="item-detail-section">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>
          )}
          
          {item.effect && item.effect !== item.description && (
            <div className="item-detail-section">
              <h3>Effect</h3>
              <p>{item.effect}</p>
            </div>
          )}

          
        </div>
        
        <div className="item-detail-actions">
          <button className="button primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemDetailModal;