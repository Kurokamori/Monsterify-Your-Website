import React, { useState, useEffect } from 'react';
import bazarService from '../../services/bazarService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';

const CollectItem = ({ userTrainers }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [collectQuantity, setCollectQuantity] = useState(1);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [
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
  ];

  // Fetch available items on component mount
  useEffect(() => {
    fetchAvailableItems();
  }, []);

  const fetchAvailableItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bazarService.getAvailableItems();
      if (response.success) {
        setAvailableItems(response.items);
      } else {
        setError(response.message || 'Failed to fetch available items');
      }
    } catch (error) {
      console.error('Error fetching available items:', error);
      setError('Failed to fetch available items');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectClick = (item) => {
    setSelectedItem(item);
    setSelectedTrainer('');
    setCollectQuantity(1);
    setShowCollectModal(true);
  };

  const handleCollect = async () => {
    if (!selectedTrainer) {
      setError('Please select a trainer');
      return;
    }

    if (collectQuantity <= 0 || collectQuantity > selectedItem.quantity) {
      setError(`Please enter a valid quantity (1-${selectedItem.quantity})`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await bazarService.collectItem(
        selectedItem.id,
        parseInt(selectedTrainer),
        parseInt(collectQuantity)
      );

      if (response.success) {
        setSuccess(`Successfully collected ${collectQuantity} ${selectedItem.item_name}(s)!`);
        setShowCollectModal(false);
        setSelectedItem(null);
        setSelectedTrainer('');
        setCollectQuantity(1);
        // Refresh available items
        await fetchAvailableItems();
      } else {
        setError(response.message || 'Failed to collect item');
      }
    } catch (error) {
      console.error('Error collecting item:', error);
      setError('Failed to collect item');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredItems = () => {
    if (!filterCategory) return availableItems;
    return availableItems.filter(item => item.item_category === filterCategory);
  };

  const getCategoryLabel = (categoryKey) => {
    const category = categories.find(cat => cat.key === categoryKey);
    return category ? category.label : categoryKey;
  };

  const renderItemCard = (item) => {
    return (
      <div key={item.id} className="item-card">
        <div className="item-header">
          <h3>{item.item_name}</h3>
          <span className="item-category">{getCategoryLabel(item.item_category)}</span>
        </div>
        
        <div className="item-quantity">
          <strong>Available:</strong> {item.quantity}
        </div>
        
        <div className="item-info">
          <p><strong>Forfeited by:</strong> {item.forfeited_by_trainer_name}</p>
          <p><strong>Date:</strong> {new Date(item.forfeited_at).toLocaleDateString()}</p>
        </div>
        
        <div className="item-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleCollectClick(item)}
          >
            Collect
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="collect-item">
        <div className="bazar-form">
          <h2>Collect Items</h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="collect-item">
      <div className="bazar-form">
        <h2>Collect Items</h2>
        <p>Browse available items and collect them for your trainer. You can collect partial quantities if available.</p>

        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <p>
            {filterCategory 
              ? `No items are currently available in the ${getCategoryLabel(filterCategory)} category.`
              : 'No items are currently available for collection.'
            }
          </p>
        ) : (
          <div className="items-grid">
            {filteredItems.map(renderItemCard)}
          </div>
        )}
      </div>

      {showCollectModal && selectedItem && (
        <Modal isOpen={showCollectModal} onClose={() => setShowCollectModal(false)}>
          <div className="modal-header">
            <h3>Collect {selectedItem.item_name}</h3>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="trainer-select">Select Trainer:</label>
              <select
                id="trainer-select"
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                required
              >
                <option value="">Choose a trainer...</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} (Level {trainer.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="collect-quantity">
                Quantity (Available: {selectedItem.quantity}):
              </label>
              <input
                type="number"
                id="collect-quantity"
                min="1"
                max={selectedItem.quantity}
                value={collectQuantity}
                onChange={(e) => setCollectQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="item-details">
              <p><strong>Category:</strong> {getCategoryLabel(selectedItem.item_category)}</p>
              <p><strong>Forfeited by:</strong> {selectedItem.forfeited_by_trainer_name}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowCollectModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCollect}
              disabled={submitting || !selectedTrainer || collectQuantity <= 0 || collectQuantity > selectedItem.quantity}
            >
              {submitting ? 'Collecting...' : 'Collect Items'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CollectItem;
