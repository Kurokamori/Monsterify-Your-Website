import React, { useState, useEffect } from 'react';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

/**
 * A component for selecting items from a trainer's inventory
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of items to select from
 * @param {string} props.selectedItemId - ID of the currently selected item
 * @param {Function} props.onSelect - Function to call when an item is selected
 * @param {string} props.itemType - Type of items to display ('pokeball', 'held_item', etc.)
 * @param {string} props.placeholder - Placeholder text when no item is selected
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const ItemSelector = ({ 
  items = [], 
  selectedItemId = null, 
  onSelect, 
  itemType = 'item',
  placeholder = 'Select an item',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [selectedItem, setSelectedItem] = useState(null);

  // Find the selected item when the component mounts or when selectedItemId changes
  useEffect(() => {
    if (selectedItemId && items.length > 0) {
      const item = items.find(item => item.id === selectedItemId || item.item_id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [selectedItemId, items]);

  // Filter items when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setFilteredItems(items);
      }
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItem(null);
    if (onSelect) {
      onSelect(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Get the appropriate image URL based on the item type - now using utility function

  return (
    <div className={`file-upload${disabled ? 'disabled' : ''}`}>
      <div className="item-selector-header" onClick={handleToggle}>
        {selectedItem ? (
          <div className="selected-item">
            <div className="selected-item-image">
              <img
                src={getItemImageUrl(selectedItem)}
                alt={selectedItem.name}
                onError={(e) => handleItemImageError(e, selectedItem.category)}
              />
            </div>
            <div className="naming-header">
              <div className="task-name">{selectedItem.name}</div>
              {selectedItem.quantity && (
                <div className="species-count">Qty: {selectedItem.quantity}</div>
              )}
            </div>
            {!disabled && (
              <button className="clear-selection" onClick={handleClear}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        ) : (
          <div className="placeholder">{placeholder}</div>
        )}
        {!disabled && (
          <div className="toggle-icon">
            <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="item-selector-dropdown">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="form-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>
          
          <div className="items-list">
            {filteredItems.length === 0 ? (
              <div className="no-items">
                <i className="fas fa-box-open"></i>
                <p>No items found</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item.id || item.item_id} 
                  className={`item-option${selectedItem && (selectedItem.id === item.id || selectedItem.item_id === item.item_id) ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="item-image">
                    <img
                      src={getItemImageUrl(item)}
                      alt={item.name}
                      onError={(e) => handleItemImageError(e, item.category)}
                    />
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    {item.description && (
                      <div className="item-description">{item.description}</div>
                    )}
                    {item.quantity && (
                      <div className="item-quantity">Quantity: {item.quantity}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemSelector;
