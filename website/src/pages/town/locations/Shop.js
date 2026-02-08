import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Modal from '../../../components/common/Modal';
import api from '../../../services/api';
const Shop = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [berryFilters, setBerryFilters] = useState({
    type: false,
    species: false,
    randomize: false,
    remove: false,
    misc: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      filterItems();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shop items
      const itemsResponse = await api.get('/shop/items');
      setItems(itemsResponse.data.items || []);
      
      // Fetch item categories
      const categoriesResponse = await api.get('/shop/categories');
      setCategories(categoriesResponse.data.categories || []);
      
      // Fetch user's trainers
      const trainersResponse = await api.get('/trainers/user');
      setUserTrainers(trainersResponse.data.trainers || []);
      
      if (trainersResponse.data.trainers && trainersResponse.data.trainers.length > 0) {
        setSelectedTrainer(trainersResponse.data.trainers[0].id);
      }
      
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError('Failed to load shop data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = async () => {
    try {
      setLoading(true);
      
      if (selectedCategory === 'all') {
        const response = await api.get('/shop/items');
        setItems(response.data.items || []);
      } else {
        const response = await api.get(`/shop/items?category=${selectedCategory}`);
        setItems(response.data.items || []);
      }
      
    } catch (err) {
      console.error('Error filtering items:', err);
      setError('Failed to filter items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (item) => {
    setSelectedItem(item);
    setIsBuyModalOpen(true);
    setPurchaseError(null);
    setQuantity(1);
  };

  const handleBuy = async () => {
    if (!selectedTrainer) {
      setPurchaseError('Please select a trainer to purchase this item.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to purchase the item
      await api.post('/shop/purchase', {
        item_id: selectedItem.id,
        trainer_id: selectedTrainer,
        quantity: quantity
      });
      
      setPurchaseSuccess(true);
      
    } catch (err) {
      console.error('Error purchasing item:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to purchase item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeBuyModal = () => {
    setIsBuyModalOpen(false);
    setSelectedItem(null);
    setPurchaseSuccess(false);
    setPurchaseError(null);
  };

  // Berry categorization
  const berryCategories = {
    type: [
      'Siron Berry', 'Lilan Berry', 'Kham Berry', 'Maizi Berry', 'Fani Berry',
      'Miraca Berry', 'Cocon Berry', 'Durian Berry', 'Monel Berry', 'Perep Berry',
      'Addish Berry', 'Sky Carrot Berry', 'Kembre Berry', 'Espara Berry'
    ],
    species: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Patama Berry', 'Bluk Berry',
      'Nuevo Berry', 'Azzuk Berry', 'Mangus Berry'
    ],
    randomize: [
      'Patama Berry', 'Bluk Berry', 'Nuevo Berry', 'Miraca Berry', 'Cocon Berry',
      'Durian Berry', 'Monel Berry', 'Perep Berry', 'Datei Berry'
    ],
    remove: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Siron Berry', 'Lilan Berry',
      'Kham Berry', 'Maizi Berry', 'Fani Berry'
    ],
    misc: [
      'Edenweiss', 'Forget-Me-Not', 'Datei Berry', 'Divest Berry'
    ]
  };

  // Helper function to check if berry matches current filters
  const matchesBerryFilters = (itemName) => {
    const activeFilters = Object.keys(berryFilters).filter(key => berryFilters[key]);
    
    if (activeFilters.length === 0) return true;
    
    return activeFilters.every(filter => 
      berryCategories[filter] && berryCategories[filter].includes(itemName)
    );
  };

  // Handle berry filter toggle
  const toggleBerryFilter = (filterName) => {
    setBerryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Fallback data for development
  const fallbackCategories = [
    { id: 'all', name: 'All Items' },
    { id: 'pokeballs', name: 'Poké Balls' },
    { id: 'medicine', name: 'Medicine' },
    { id: 'berries', name: 'Berries' },
    { id: 'battle', name: 'Battle Items' },
    { id: 'evolution', name: 'Evolution Items' }
  ];

  const fallbackItems = [
    {
      id: 1,
      name: 'Poké Ball',
      description: 'A device for catching wild Pokémon.',
      price: 200,
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Poke+Ball',
      category: 'pokeballs',
      stock: 999
    },
    {
      id: 2,
      name: 'Potion',
      description: 'Restores 20 HP to a Pokémon.',
      price: 300,
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Potion',
      category: 'medicine',
      stock: 999
    },
    {
      id: 3,
      name: 'Oran Berry',
      description: 'Restores 10 HP when held and health falls below 50%.',
      price: 100,
      image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Oran+Berry',
      category: 'berries',
      stock: 999
    }
  ];

  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum'
    },
    {
      id: 2,
      name: 'Misty'
    }
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const baseItems = items.length > 0 ? items : fallbackItems;
  
  // Filter items based on berry filters if berries category is selected
  const displayItems = selectedCategory === 'berries' 
    ? baseItems.filter(item => matchesBerryFilters(item.name))
    : baseItems;
    
  const displayTrainers = userTrainers.length > 0 ? userTrainers : fallbackTrainers;

  if (loading && !isBuyModalOpen) {
    return <LoadingSpinner message="Loading shop..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="location-container">
      <div className="location-header">
        <div className="location-icon-large">
          <i className="fas fa-store"></i>
        </div>
        <div className="no-adventures">
          <h2>Shop</h2>
          <p>Purchase items for your adventures</p>
        </div>
      </div>

      <div className="location-content">
        <div className="town-location-description">
          <p>
            Welcome to the Aurora Town Shop! Here you can purchase various items to help you on your adventures.
            From Poké Balls to catch new monsters, to medicine to heal your team, we have everything a trainer needs.
          </p>
        </div>

        <div className="shop-categories">
          {displayCategories.map((category) => (
            <button
              key={category.id}
              className={`button filter ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Berry filters - only show when berries category is selected */}
        {(selectedCategory === 'berries' || true) && (
          <div className="berry-filters">
            <h4>Filter Berries by Type (stackable) - Debug: {selectedCategory}</h4>
            <div className="type-tags">
              <button
                className={`button filter ${berryFilters.type ? 'active' : ''}`}
                onClick={() => toggleBerryFilter('type')}
              >
                Type
              </button>
              <button
                className={`button filter ${berryFilters.species ? 'active' : ''}`}
                onClick={() => toggleBerryFilter('species')}
              >
                Species
              </button>
              <button
                className={`button filter ${berryFilters.randomize ? 'active' : ''}`}
                onClick={() => toggleBerryFilter('randomize')}
              >
                Randomize
              </button>
              <button
                className={`button filter ${berryFilters.remove ? 'active' : ''}`}
                onClick={() => toggleBerryFilter('remove')}
              >
                Remove
              </button>
              <button
                className={`button filter ${berryFilters.misc ? 'active' : ''}`}
                onClick={() => toggleBerryFilter('misc')}
              >
                Misc
              </button>
              <button
                className="button filter reset"
                onClick={() => setBerryFilters({
                  type: false,
                  species: false,
                  randomize: false,
                  remove: false,
                  misc: false
                })}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="town-places">
          {displayItems.map((item) => (
            <div className="guide-card" key={item.id}>
              <div className="item-image-container">
                <img
                  src={item.image_path}
                  alt={item.name}
                  className="item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_item.png';
                  }}
                />
              </div>
              <div className="item-info">
                <h4 className="item-name">{item.name}</h4>
                <p className="item-description">{item.description}</p>
                <div className="item-price">
                  <span>Price:</span>
                  <span className="price-amount">{item.price} <i className="fas fa-coins"></i></span>
                </div>
                <button 
                  className="button primary"
                  onClick={() => handleBuyClick(item)}
                  disabled={item.stock <= 0}
                >
                  {item.stock > 0 ? 'Buy' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Modal */}
      <Modal
        isOpen={isBuyModalOpen}
        onClose={closeBuyModal}
        title={purchaseSuccess ? "Purchase Successful!" : "Confirm Purchase"}
      >
        {purchaseSuccess ? (
          <div className="purchase-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              You have successfully purchased {quantity} {selectedItem?.name}(s).
              The item(s) have been added to your inventory.
            </p>
            <button 
              className="button primary"
              onClick={closeBuyModal}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {selectedItem && (
              <div className="purchase-confirmation">
                <div className="purchase-item-preview">
                  <img
                    src={selectedItem.image_path}
                    alt={selectedItem.name}
                    className="preview-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_item.png';
                    }}
                  />
                  <div className="preview-info">
                    <h3>{selectedItem.name}</h3>
                    <p>{selectedItem.description}</p>
                    <div className="preview-price">
                      <span>Price:</span>
                      <span className="price-amount">{selectedItem.price} <i className="fas fa-coins"></i></span>
                    </div>
                  </div>
                </div>
                
                <div className="purchase-details">
                  <div className="quantity-selector">
                    <label htmlFor="quantity">Quantity:</label>
                    <div className="quantity-controls">
                      <button 
                        className="button icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedItem.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(selectedItem.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                      />
                      <button 
                        className="button icon"
                        onClick={() => setQuantity(Math.min(selectedItem.stock, quantity + 1))}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="total-price">
                    <span>Total:</span>
                    <span className="price-amount">{selectedItem.price * quantity} <i className="fas fa-coins"></i></span>
                  </div>
                  
                  <div className="trainer-select">
                    <label htmlFor="trainer">Select Trainer:</label>
                    <select
                      id="trainer"
                      value={selectedTrainer}
                      onChange={(e) => setSelectedTrainer(e.target.value)}
                    >
                      <option value="">Select a trainer</option>
                      {displayTrainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {purchaseError && (
                  <div className="purchase-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{purchaseError}</span>
                  </div>
                )}
                
                <div className="purchase-actions">
                  <button 
                    className="button secondary"
                    onClick={closeBuyModal}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button primary"
                    onClick={handleBuy}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Shop;
