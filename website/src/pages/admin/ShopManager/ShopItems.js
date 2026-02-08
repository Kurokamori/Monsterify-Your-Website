import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { getItemImageUrl, handleItemImageError } from '../../../utils/imageUtils';


const ShopItems = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockCount, setStockCount] = useState(10);
  const [stockCategory, setStockCategory] = useState('');
  const [stockPriceModifier, setStockPriceModifier] = useState(1.0);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [stockSuccess, setStockSuccess] = useState(false);
  
  // Fetch shop data and items
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch shop details
        const shopResponse = await api.get(`/admin/shop-manager/${shopId}`);
        setShop(shopResponse.data.data);
        setStockCategory(shopResponse.data.data.category);
        setStockPriceModifier(shopResponse.data.data.price_modifier || 1.0);
        
        // Fetch shop items
        const itemsResponse = await api.get(`/admin/shop-manager/${shopId}/items`, {
          params: { date: stockDate }
        });
        setItems(itemsResponse.data.data || []);
        
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load shop data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [shopId, stockDate]);
  
  // Handle stock shop
  const handleStockShop = async () => {
    try {
      setStockLoading(true);
      setStockError(null);
      setStockSuccess(false);
      
      const response = await api.post(`/admin/shop-manager/${shopId}/stock`, {
        category: stockCategory,
        count: stockCount,
        price_modifier: stockPriceModifier,
        date: stockDate
      });
      
      // Update items list
      setItems(response.data.data || []);
      setStockSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        setStockSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error stocking shop:', err);
      setStockError(err.response?.data?.message || 'Failed to stock shop. Please try again later.');
    } finally {
      setStockLoading(false);
    }
  };
  
  // Handle remove item
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the shop?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/shop-manager/${shopId}/items/${itemId}`);
      
      // Update items list
      setItems(items.filter(item => item.id !== itemId));
      
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item. Please try again.');
    }
  };
  
  // Handle update item quantity
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      await api.put(`/admin/shop-manager/${shopId}/items/${itemId}`, {
        price: item.price,
        max_quantity: item.max_quantity,
        current_quantity: newQuantity
      });
      
      // Update items list
      setItems(items.map(i => {
        if (i.id === itemId) {
          return { ...i, current_quantity: newQuantity };
        }
        return i;
      }));
      
    } catch (err) {
      console.error('Error updating item quantity:', err);
      alert('Failed to update item quantity. Please try again.');
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading shop items..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (!shop) {
    return <ErrorMessage message="Shop not found" />;
  }
  
  return (
    <div className="shop-page">
      <div className="adopt-card">
        <h1>Manage Items: {shop.name}</h1>
        <Link to="/admin/shop-manager" className="button secondary">
          <i className="fas fa-arrow-left"></i> Back to Shops
        </Link>
      </div>
      
      <div className="shop-items-content">
        <div className="shop-form">
          <h2>Stock Shop</h2>
          
          <div className="stock-form">
            <div className="form-group">
              <label htmlFor="stockDate">Date</label>
              <input
                type="date"
                id="stockDate"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stockCategory">Category</label>
              <select
                id="stockCategory"
                value={stockCategory}
                onChange={(e) => setStockCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="berries">Berries</option>
                <option value="pastries">Pastries</option>
                <option value="evolution">Evolution Items</option>
                <option value="helditems">Held Items</option>
                <option value="balls">Pokeballs</option>
                <option value="eggs">Eggs</option>
                <option value="antiques">Antiques</option>
                <option value="ALL">All Items</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="stockCount">Item Count</label>
              <input
                type="number"
                id="stockCount"
                value={stockCount}
                onChange={(e) => setStockCount(parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stockPriceModifier">Price Modifier</label>
              <input
                type="number"
                id="stockPriceModifier"
                value={stockPriceModifier}
                onChange={(e) => setStockPriceModifier(parseFloat(e.target.value))}
                step="0.1"
                min="0.1"
                max="10"
              />
            </div>
            
            <button
              className="button primary"
              onClick={handleStockShop}
              disabled={stockLoading}
            >
              {stockLoading ? 'Stocking...' : 'Stock Shop'}
            </button>
          </div>
          
          {stockError && <div className="stock-error">{stockError}</div>}
          {stockSuccess && <div className="stock-success">Shop stocked successfully!</div>}
        </div>
        
        <div className="shop-form">
          <h2>Current Items</h2>
          
          {items.length === 0 ? (
            <div className="no-items-message">
              <p>No items in shop for the selected date. Use the Stock Shop form to add items.</p>
            </div>
          ) : (
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Rarity</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="item-image-cell">
                        <img
                          src={getItemImageUrl(item)}
                          alt={item.name}
                          className="item-image"
                          onError={(e) => handleItemImageError(e, item.category)}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.rarity || 'Common'}</td>
                      <td>{item.price}</td>
                      <td className="quantity-cell">
                        <div className="quantity-control">
                          <button
                            className="button quantity"
                            onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.current_quantity - 1))}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.current_quantity}</span>
                          <button
                            className="button quantity"
                            onClick={() => handleUpdateQuantity(item.id, item.current_quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="button danger"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopItems;
