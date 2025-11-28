import React, { useState, useEffect } from 'react';
import bazarService from '../../services/bazarService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ForfeitItem = ({ userTrainers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerInventory, setTrainerInventory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
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

  // Fetch trainer inventory when trainer is selected
  useEffect(() => {
    const fetchTrainerInventory = async () => {
      if (!selectedTrainer) {
        setTrainerInventory(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await bazarService.getTrainerInventory(selectedTrainer);
        if (response.success) {
          setTrainerInventory(response.inventory);
        } else {
          setError(response.message || 'Failed to fetch trainer inventory');
        }
      } catch (error) {
        console.error('Error fetching trainer inventory:', error);
        setError('Failed to fetch trainer inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerInventory();
  }, [selectedTrainer]);

  // Reset form when trainer changes
  const handleTrainerChange = (e) => {
    setSelectedTrainer(e.target.value);
    setSelectedCategory('');
    setSelectedItem('');
    setQuantity(1);
    setError(null);
    setSuccess(null);
  };

  // Reset item selection when category changes
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedItem('');
    setQuantity(1);
  };

  // Update max quantity when item changes
  const handleItemChange = (e) => {
    setSelectedItem(e.target.value);
    setQuantity(1);
  };

  const getAvailableItems = () => {
    if (!trainerInventory || !selectedCategory) return [];
    const categoryItems = trainerInventory[selectedCategory] || {};
    return Object.entries(categoryItems).filter(([_, qty]) => qty > 0);
  };

  const getMaxQuantity = () => {
    if (!trainerInventory || !selectedCategory || !selectedItem) return 0;
    const categoryItems = trainerInventory[selectedCategory] || {};
    return categoryItems[selectedItem] || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTrainer || !selectedCategory || !selectedItem || quantity <= 0) {
      setError('Please fill in all fields');
      return;
    }

    const maxQuantity = getMaxQuantity();
    if (quantity > maxQuantity) {
      setError(`You only have ${maxQuantity} of this item`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await bazarService.forfeitItem(
        parseInt(selectedTrainer),
        selectedCategory,
        selectedItem,
        parseInt(quantity)
      );

      if (response.success) {
        setSuccess(`Successfully forfeited ${quantity} ${selectedItem}(s) to the bazzar!`);
        setSelectedItem('');
        setQuantity(1);
        
        // Refresh trainer inventory
        const refreshResponse = await bazarService.getTrainerInventory(selectedTrainer);
        if (refreshResponse.success) {
          setTrainerInventory(refreshResponse.inventory);
        }
      } else {
        setError(response.message || 'Failed to forfeit item');
      }
    } catch (error) {
      console.error('Error forfeiting item:', error);
      setError('Failed to forfeit item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forfeit-item">
      <div className="bazar-form">
        <h2>Forfeit Item</h2>
        <p>Select a trainer and choose items to forfeit to the bazzar. Other trainers will be able to collect them.</p>

        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="trainer-select">Select Trainer:</label>
            <select
              id="trainer-select"
              value={selectedTrainer}
              onChange={handleTrainerChange}
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

          {selectedTrainer && (
            <>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="category-select">Select Category:</label>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="">Choose a category...</option>
                      {categories.map(category => (
                        <option key={category.key} value={category.key}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <>
                      <div className="form-group">
                        <label htmlFor="item-select">Select Item:</label>
                        <select
                          id="item-select"
                          value={selectedItem}
                          onChange={handleItemChange}
                          required
                        >
                          <option value="">Choose an item...</option>
                          {getAvailableItems().map(([itemName, qty]) => (
                            <option key={itemName} value={itemName}>
                              {itemName} (You have: {qty})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedItem && (
                        <div className="form-group">
                          <label htmlFor="quantity-input">
                            Quantity (Max: {getMaxQuantity()}):
                          </label>
                          <input
                            type="number"
                            id="quantity-input"
                            min="1"
                            max={getMaxQuantity()}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                      )}
                    </>
                  )}

                  {getAvailableItems().length === 0 && selectedCategory && (
                    <p>This trainer has no items in the selected category.</p>
                  )}
                </>
              )}
            </>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedTrainer || !selectedCategory || !selectedItem || quantity <= 0 || submitting}
            >
              {submitting ? 'Forfeiting...' : 'Forfeit Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForfeitItem;
