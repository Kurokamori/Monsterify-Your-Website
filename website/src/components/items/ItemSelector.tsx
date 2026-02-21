import { useState, useEffect, useCallback, useRef } from 'react';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

export interface Item {
  id?: string;
  item_id?: string;
  name: string;
  description?: string;
  category?: string;
  quantity?: number;
  image_url?: string;
  image_path?: string;
}

interface ItemSelectorProps {
  items?: Item[];
  selectedItemId?: string | null;
  onSelect?: (item: Item | null) => void;
  itemType?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const ItemSelector = ({
  items = [],
  selectedItemId = null,
  onSelect,
  placeholder = 'Select an item',
  disabled = false
}: ItemSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => {
        if (!prev) {
          setSearchTerm('');
          setFilteredItems(items);
        }
        return !prev;
      });
    }
  }, [disabled, items]);

  const handleSelect = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsOpen(false);
    onSelect?.(item);
  }, [onSelect]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(null);
    onSelect?.(null);
  }, [onSelect]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const getItemId = (item: Item): string => {
    return item.id || item.item_id || item.name;
  };

  const isItemSelected = (item: Item): boolean => {
    if (!selectedItem) return false;
    return getItemId(selectedItem) === getItemId(item);
  };

  return (
    <div
      ref={containerRef}
      className={`item-selector ${disabled ? 'item-selector--disabled' : ''}`}
    >
      <div className="item-selector__trigger" onClick={handleToggle}>
        {selectedItem ? (
          <div className="item-selector__selected">
            <div className="item-selector__selected-image">
              <img
                src={getItemImageUrl(selectedItem)}
                alt={selectedItem.name}
                onError={(e) => handleItemImageError(e, selectedItem.category)}
              />
            </div>
            <div className="item-selector__selected-info">
              <span className="item-selector__selected-name">{selectedItem.name}</span>
              {selectedItem.quantity !== undefined && (
                <span className="item-selector__selected-qty">Qty: {selectedItem.quantity}</span>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                className="button ghost sm item-selector__clear"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        ) : (
          <span className="item-selector__placeholder">{placeholder}</span>
        )}
        {!disabled && (
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} item-selector__chevron`}></i>
        )}
      </div>

      {isOpen && (
        <div className="item-selector__dropdown">
          <div className="item-selector__search">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="form-input"
              autoFocus
            />
            <i className="fas fa-search item-selector__search-icon"></i>
          </div>

          <ul className="item-selector__list">
            {filteredItems.length === 0 ? (
              <li className="item-selector__empty">
                <i className="fas fa-box-open"></i>
                <span>No items found</span>
              </li>
            ) : (
              filteredItems.map(item => (
                <li
                  key={getItemId(item)}
                  className={`item-selector__option ${isItemSelected(item) ? 'item-selector__option--selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="item-selector__option-image">
                    <img
                      src={getItemImageUrl(item)}
                      alt={item.name}
                      onError={(e) => handleItemImageError(e, item.category)}
                    />
                  </div>
                  <div className="item-selector__option-info">
                    <span className="item-selector__option-name">{item.name}</span>
                    {item.description && (
                      <span className="item-selector__option-desc">{item.description}</span>
                    )}
                    {item.quantity !== undefined && (
                      <span className="item-selector__option-qty">Quantity: {item.quantity}</span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
