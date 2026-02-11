import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import AdminTrainerSelector from '../../../components/admin/AdminTrainerSelector';


const ItemRoller = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [rarity, setRarity] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rolledItems, setRolledItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [addToTrainer, setAddToTrainer] = useState(false);
  const [rollSuccess, setRollSuccess] = useState(false);

  // Fetch item categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/items/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching item categories:', err);
        // Fallback to default categories
        setCategories([
          'berries',
          'pastries',
          'evolution',
          'helditems',
          'balls',
          'eggs',
          'antiques',
          'seals',
          'keyitems'
        ]);
      }
    };

    fetchCategories();
  }, []);

  // Handle category selection
  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Handle select all categories
  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  // Handle rarity change
  const handleRarityChange = (e) => {
    setRarity(e.target.value);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > 20) {
      setQuantity(20);
    } else {
      setQuantity(value);
    }
  };

  // Handle trainer selection
  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Handle roll items
  const handleRollItems = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRollSuccess(false);

      const requestData = {
        category: selectedCategories.length === 1 ? selectedCategories[0] : selectedCategories,
        quantity
      };

      if (rarity) {
        requestData.rarity = rarity;
      }

      let response;

      if (addToTrainer && selectedTrainer) {
        // Roll items and add to trainer inventory
        response = await api.post('/item-roller/roll/trainer', {
          ...requestData,
          trainer_id: selectedTrainer
        });

        setRolledItems(response.data.data || []);
        setRollSuccess(true);
      } else {
        // Just roll items
        response = await api.post('/item-roller/roll', requestData);
        setRolledItems(response.data.data || []);
      }

    } catch (err) {
      console.error('Error rolling items:', err);
      setError(err.response?.data?.message || 'Failed to roll items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-roller-container">
      <div className="adopt-card">
        <h1>Item Roller</h1>
      </div>

      <div className="item-roller-content">
        <div className="roller-controls">
          <div className="control-section">
            <h2>Categories</h2>
            <div className="categories-grid">
              <button
                className={`button secondary ${selectedCategories.length === categories.length ? 'selected' : ''}`}
                onClick={handleSelectAllCategories}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={`button secondary ${selectedCategories.includes(category) ? 'selected' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h2>Rarity</h2>
            <div className="rarity-options">
              <label className={`rarity-option ${rarity === '' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value=""
                  checked={rarity === ''}
                  onChange={handleRarityChange}
                />
                <span>Any</span>
              </label>
              <label className={`rarity-option ${rarity === 'common' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value="common"
                  checked={rarity === 'common'}
                  onChange={handleRarityChange}
                />
                <span>Common</span>
              </label>
              <label className={`rarity-option ${rarity === 'uncommon' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value="uncommon"
                  checked={rarity === 'uncommon'}
                  onChange={handleRarityChange}
                />
                <span>Uncommon</span>
              </label>
              <label className={`rarity-option ${rarity === 'rare' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value="rare"
                  checked={rarity === 'rare'}
                  onChange={handleRarityChange}
                />
                <span>Rare</span>
              </label>
              <label className={`rarity-option ${rarity === 'ultra rare' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value="ultra rare"
                  checked={rarity === 'ultra rare'}
                  onChange={handleRarityChange}
                />
                <span>Ultra Rare</span>
              </label>
              <label className={`rarity-option ${rarity === 'legendary' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rarity"
                  value="legendary"
                  checked={rarity === 'legendary'}
                  onChange={handleRarityChange}
                />
                <span>Legendary</span>
              </label>
            </div>
          </div>

          <div className="control-section">
            <h2>Quantity</h2>
            <div className="quantity-control">
              <button
                className="button quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max="20"
              />
              <button
                className="button quantity"
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div className="control-section">
            <h2>Add to Trainer</h2>
            <div className="trainer-control">
              <label className="add-to-trainer-toggle">
                <input
                  type="checkbox"
                  checked={addToTrainer}
                  onChange={() => setAddToTrainer(!addToTrainer)}
                />
                <span>Add rolled items to trainer inventory</span>
              </label>

              {addToTrainer && (
                <div className="trainer-selector-container">
                  <AdminTrainerSelector
                    selectedTrainerId={selectedTrainer}
                    onChange={handleTrainerChange}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            className="button primary lg"
            onClick={handleRollItems}
            disabled={loading || selectedCategories.length === 0 || (addToTrainer && !selectedTrainer)}
          >
            {loading ? 'Rolling...' : 'Roll Items'}
          </button>

          {error && <div className="roll-error">{error}</div>}
          {rollSuccess && <div className="roll-success">Items added to trainer inventory!</div>}
        </div>

        <div className="rolled-items">
          <h2>Rolled Items</h2>

          {rolledItems.length === 0 ? (
            <div className="no-items-message">
              <p>No items rolled yet. Configure the options and click "Roll Items".</p>
            </div>
          ) : (
            <div className="container grid gap-md">
              {rolledItems.map((item, index) => (
                <div key={index} className={`item-card ${item.rarity || 'common'}`}>
                  <div className="item-image-container">
                    <img
                      src={item.image_url || '/images/items/default_item.png'}
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/items/default_item.png';
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <div className="item-meta">
                      <span className="item-category">{item.category}</span>
                      <span className="item-rarity">{item.rarity || 'Common'}</span>
                    </div>
                    {item.quantity && (
                      <div className="item-quantity">
                        Quantity: {item.quantity}
                      </div>
                    )}
                    <p className="item-description">
                      {item.description || item.effect || 'No description available.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemRoller;
