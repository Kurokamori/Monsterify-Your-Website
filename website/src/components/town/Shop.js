import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import townService from '../../services/townService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';


const Shop = ({ shopId, shopName, shopDescription }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // Fetch shop items and user trainers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch shop items
        const params = {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          page,
          limit: 12
        };

        const response = await townService.getShopItems(shopId, params);
        setItems(response.items || []);
        setCategories(response.categories || []);
        setTotalPages(response.totalPages || 1);

        // Fetch user trainers if authenticated
        if (isAuthenticated) {
          console.log('User:', currentUser);
          const userId = currentUser?.discord_id;
          const trainersResponse = await trainerService.getUserTrainers(userId);
          setUserTrainers(trainersResponse.trainers || []);

          if (trainersResponse.trainers && trainersResponse.trainers.length > 0) {
            setSelectedTrainer(trainersResponse.trainers[0].id);
          }
        }

      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load shop data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId, selectedCategory, page, isAuthenticated, currentUser, trainerService]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Handle item click
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
    setPurchaseQuantity(1);
    setPurchaseSuccess(false);
    setPurchaseError('');
  };

  // Close item modal
  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setPurchaseQuantity(value);
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setPurchaseError('You must be logged in to make a purchase.');
      return;
    }

    if (!selectedTrainer) {
      setPurchaseError('Please select a trainer for this purchase.');
      return;
    }

    try {
      setPurchaseLoading(true);
      setPurchaseError('');

      await townService.purchaseItem(
        shopId,
        selectedItem.id,
        purchaseQuantity,
        selectedTrainer
      );

      setPurchaseSuccess(true);

      // Refresh trainer data
      const trainersResponse = await trainerService.getUserTrainers();
      setUserTrainers(trainersResponse.trainers || []);

    } catch (err) {
      console.error('Error purchasing item:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to purchase item. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    return selectedItem.price * purchaseQuantity;
  };

  // Get trainer by ID
  const getTrainerById = (trainerId) => {
    return userTrainers.find(trainer => trainer.id === parseInt(trainerId));
  };

  // Render loading state
  if (loading && items.length === 0) {
    return <LoadingSpinner message="Loading shop items..." />;
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Fallback data for development
  const fallbackItems = [
    {
      id: 1,
      name: 'Potion',
      description: 'Restores 20 HP to a monster.',
      price: 300,
      image_path: '/content/static/images/items/default.png',
      category: 'healing',
      stock: 999,
      is_limited: false
    },
    {
      id: 2,
      name: 'Super Potion',
      description: 'Restores 50 HP to a monster.',
      price: 700,
      image_path: '/content/static/images/items/default.png',
      category: 'healing',
      stock: 999,
      is_limited: false
    },
    {
      id: 3,
      name: 'Revive',
      description: 'Revives a fainted monster with half HP.',
      price: 1500,
      image_path: '/content/static/images/items/default.png',
      category: 'healing',
      stock: 999,
      is_limited: false
    },
    {
      id: 4,
      name: 'Pokeball',
      description: 'A device for catching wild monsters.',
      price: 200,
      image_path: '/content/static/images/items/default.png',
      category: 'balls',
      stock: 999,
      is_limited: false
    },
    {
      id: 5,
      name: 'Great Ball',
      description: 'A good, high-performance ball.',
      price: 600,
      image_path: '/content/static/images/items/default.png',
      category: 'balls',
      stock: 999,
      is_limited: false
    },
    {
      id: 6,
      name: 'Rare Candy',
      description: 'Raises the level of a monster by one.',
      price: 4800,
      image_path: '/content/static/images/items/default.png',
      category: 'training',
      stock: 10,
      is_limited: true
    }
  ];

  const fallbackCategories = [
    { id: 'all', name: 'All Items' },
    { id: 'healing', name: 'Healing' },
    { id: 'balls', name: 'Pokeballs' },
    { id: 'training', name: 'Training' },
    { id: 'evolution', name: 'Evolution' },
    { id: 'berries', name: 'Berries' }
  ];

  const displayItems = items.length > 0 ? items : fallbackItems;
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h2>{shopName || 'Shop'}</h2>
        <p className="shop-description">{shopDescription || 'Purchase items for your monsters and trainers.'}</p>
      </div>

      <div className="shop-categories">
        {displayCategories.map(category => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="shop-items-grid">
        {displayItems.map(item => (
          <div
            key={item.id}
            className={`shop-item ${item.stock === 0 ? 'out-of-stock' : ''}`}
            onClick={() => item.stock > 0 && handleItemClick(item)}
          >
            <div className="item-image-container">
              <img
                src={getItemImageUrl(item)}
                alt={item.name}
                className="item-image"
                onError={(e) => handleItemImageError(e, item.category)}
              />
              {item.is_limited && (
                <div className="limited-badge">Limited</div>
              )}
            </div>

            <div className="item-info">
              <h3 className="item-name">{item.name}</h3>
              <div className="item-price">
                <i className="fas fa-coins"></i> {item.price}
              </div>

              {item.stock === 0 ? (
                <div className="out-of-stock-label">Out of Stock</div>
              ) : (
                item.is_limited && (
                  <div className="stock-label">
                    Stock: {item.stock}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shop-pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div className="pagination-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="pagination-button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Item Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={closeItemModal}
        title={selectedItem?.name || 'Item Details'}
      >
        {selectedItem && (
          <div className="item-modal-content">
            {purchaseSuccess ? (
              <div className="purchase-success">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Purchase Successful!</h3>
                <p>
                  You have successfully purchased {purchaseQuantity} {purchaseQuantity > 1 ? `${selectedItem.name}s` : selectedItem.name}.
                </p>
                <div className="modal-actions">
                  <button
                    className="modal-button secondary"
                    onClick={closeItemModal}
                  >
                    Close
                  </button>
                  <button
                    className="modal-button primary"
                    onClick={() => {
                      setPurchaseSuccess(false);
                      setPurchaseQuantity(1);
                    }}
                  >
                    Buy More
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="item-details">
                  <div className="item-image-large-container">
                    <img
                      src={getItemImageUrl(selectedItem)}
                      alt={selectedItem.name}
                      className="item-image-large"
                      onError={(e) => handleItemImageError(e, selectedItem.category)}
                    />
                  </div>

                  <div className="item-info-detailed">
                    <p className="item-description">{selectedItem.description}</p>

                    <div className="item-meta">
                      <div className="meta-item">
                        <span className="meta-label">Price:</span>
                        <span className="meta-value">
                          <i className="fas fa-coins"></i> {selectedItem.price}
                        </span>
                      </div>

                      <div className="meta-item">
                        <span className="meta-label">Category:</span>
                        <span className="meta-value">
                          {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}
                        </span>
                      </div>

                      {selectedItem.is_limited && (
                        <div className="meta-item">
                          <span className="meta-label">Stock:</span>
                          <span className="meta-value">{selectedItem.stock}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="purchase-section">
                    <div className="purchase-options">
                      <div className="form-group">
                        <label htmlFor="purchase-quantity">Quantity:</label>
                        <div className="quantity-input">
                          <button
                            type="button"
                            className="quantity-button"
                            onClick={() => purchaseQuantity > 1 && setPurchaseQuantity(purchaseQuantity - 1)}
                          >
                            -
                          </button>
                          <input
                            id="purchase-quantity"
                            type="number"
                            min="1"
                            max={selectedItem.is_limited ? selectedItem.stock : 99}
                            value={purchaseQuantity}
                            onChange={handleQuantityChange}
                          />
                          <button
                            type="button"
                            className="quantity-button"
                            onClick={() => {
                              if (selectedItem.is_limited) {
                                purchaseQuantity < selectedItem.stock && setPurchaseQuantity(purchaseQuantity + 1);
                              } else {
                                purchaseQuantity < 99 && setPurchaseQuantity(purchaseQuantity + 1);
                              }
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="purchase-trainer">Trainer:</label>
                        <select
                          id="purchase-trainer"
                          value={selectedTrainer}
                          onChange={(e) => setSelectedTrainer(e.target.value)}
                        >
                          <option value="">Select a trainer</option>
                          {userTrainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name} (Coins: {trainer.coins})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="purchase-summary">
                      <div className="total-price">
                        <span className="total-label">Total:</span>
                        <span className="total-value">
                          <i className="fas fa-coins"></i> {calculateTotalPrice()}
                        </span>
                      </div>

                      {selectedTrainer && (
                        <div className="trainer-balance">
                          <span className="balance-label">Trainer Balance:</span>
                          <span className="balance-value">
                            <i className="fas fa-coins"></i> {getTrainerById(selectedTrainer)?.coins || 0}
                          </span>
                        </div>
                      )}

                      {purchaseError && (
                        <div className="purchase-error">
                          {purchaseError}
                        </div>
                      )}

                      <button
                        className="purchase-button"
                        onClick={handlePurchase}
                        disabled={
                          purchaseLoading ||
                          !selectedTrainer ||
                          (selectedTrainer && calculateTotalPrice() > (getTrainerById(selectedTrainer)?.coins || 0))
                        }
                      >
                        {purchaseLoading ? (
                          <>
                            <LoadingSpinner size="small" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-shopping-cart"></i> Purchase
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="login-prompt">
                    <p>Please log in to purchase items.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Shop;
