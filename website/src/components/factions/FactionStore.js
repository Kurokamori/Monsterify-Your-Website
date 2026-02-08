import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import api from '../../services/api';

const FactionStore = ({ factionId, trainerId, faction }) => {
  const [storeItems, setStoreItems] = useState([]);
  const [trainerCurrency, setTrainerCurrency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Fetch store items
  useEffect(() => {
    const fetchStoreItems = async () => {
      if (!factionId || !trainerId) return;

      try {
        setLoading(true);
        const response = await api.get(`/factions/${factionId}/store?trainerId=${trainerId}`);
        setStoreItems(response.data.items || []);
      } catch (err) {
        console.error('Error fetching store items:', err);
        setError('Failed to load store items');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreItems();
  }, [factionId, trainerId]);

  // Fetch trainer currency
  useEffect(() => {
    const fetchTrainerCurrency = async () => {
      if (!trainerId) return;

      try {
        const response = await api.get(`/trainers/${trainerId}`);
        setTrainerCurrency(response.data.trainer?.currency_amount || 0);
      } catch (err) {
        console.error('Error fetching trainer currency:', err);
      }
    };

    fetchTrainerCurrency();
  }, [trainerId]);

  const handlePurchase = async (item, quantity = 1) => {
    if (!trainerId || !item.id) {
      setPurchaseError('Invalid purchase request');
      return;
    }

    try {
      setPurchaseLoading(item.id);
      setPurchaseError(null);
      setPurchaseSuccess(null);

      const response = await api.post(`/factions/${factionId}/store/purchase`, {
        trainerId,
        itemId: item.id,
        quantity
      });

      if (response.data.success) {
        setPurchaseSuccess(`Successfully purchased ${quantity}x ${item.item_name}!`);
        setTrainerCurrency(response.data.remainingCurrency);
        
        // Update stock if limited
        if (item.stock_quantity !== -1) {
          setStoreItems(prevItems =>
            prevItems.map(prevItem =>
              prevItem.id === item.id
                ? { ...prevItem, stock_quantity: prevItem.stock_quantity - quantity }
                : prevItem
            )
          );
        }

        // Clear success message after 3 seconds
        setTimeout(() => setPurchaseSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error purchasing item:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to purchase item');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const canAfford = (price) => {
    return trainerCurrency >= price;
  };

  const isInStock = (item) => {
    return item.stock_quantity === -1 || item.stock_quantity > 0;
  };

  const getItemTypeIcon = (itemType) => {
    const icons = {
      items: '🧪',
      balls: '⚾',
      berries: '🍓',
      pastries: '🧁',
      evolution: '✨',
      eggs: '🥚',
      antiques: '🏺',
      helditems: '💎',
      seals: '🔖',
      keyitems: '🗝️'
    };
    return icons[itemType] || '📦';
  };

  if (loading) {
    return <LoadingSpinner message="Loading faction store..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="shop-page">
      <div className="store-header">
        <h3>{faction.name} Store</h3>
        <div className="trainer-currency">
          <span className="currency-label">Your Currency:</span>
          <span className="currency-amount">{trainerCurrency} <i className="fas fa-coins"></i></span>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="purchase-success">
          <i className="fas fa-check-circle"></i>
          {purchaseSuccess}
        </div>
      )}

      {purchaseError && (
        <div className="purchase-error">
          <i className="fas fa-exclamation-triangle"></i>
          {purchaseError}
          <button onClick={() => setPurchaseError(null)} className="button close sm">×</button>
        </div>
      )}

      {storeItems.length === 0 ? (
        <div className="no-items">
          <p>No items available in this store yet.</p>
        </div>
      ) : (
        <div className="store-items-grid">
          {storeItems.map(item => (
            <div key={item.id} className="store-item-card">
              <div className="item-header">
                <div className="item-icon">
                  {getItemTypeIcon(item.item_type)}
                </div>
                <div className="item-info">
                  <h4 className="item-name">{item.item_name}</h4>
                  <span className="item-type">{item.item_type}</span>
                </div>
              </div>

              <p className="item-description">{item.item_description}</p>

              <div className="item-details">
                <div className="item-price">
                  <span className="price-amount">{item.price}</span>
                  <i className="fas fa-coins"></i>
                </div>

                {item.standing_requirement > 0 && (
                  <div className="standing-requirement">
                    <span>Requires {item.standing_requirement} standing</span>
                  </div>
                )}

                {item.stock_quantity !== -1 && (
                  <div className="stock-info">
                    <span>Stock: {item.stock_quantity}</span>
                  </div>
                )}
              </div>

              <div className="item-actions">
                <button
                  className={`button primary${
                    !canAfford(item.price) ? 'cannot-afford' :
                    !isInStock(item) ? 'out-of-stock' :
                    purchaseLoading === item.id ? 'loading' : ''
                  }`}
                  onClick={() => handlePurchase(item)}
                  disabled={
                    !canAfford(item.price) || 
                    !isInStock(item) || 
                    purchaseLoading === item.id
                  }
                >
                  {purchaseLoading === item.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Purchasing...
                    </>
                  ) : !canAfford(item.price) ? (
                    'Cannot Afford'
                  ) : !isInStock(item) ? (
                    'Out of Stock'
                  ) : (
                    'Purchase'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FactionStore;
