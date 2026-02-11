import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';


const ShopManager = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/admin/shop-manager');
        setShops(response.data.data || []);
        
      } catch (err) {
        console.error('Error fetching shops:', err);
        setError('Failed to load shops. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShops();
  }, []);
  
  // Toggle shop active status
  const toggleShopStatus = async (shopId, isActive) => {
    try {
      const shop = shops.find(s => s.shop_id === shopId);
      if (!shop) return;
      
      await api.put(`/admin/shop-manager/${shopId}`, {
        ...shop,
        is_active: isActive ? 0 : 1
      });
      
      // Update shops list
      setShops(shops.map(s => {
        if (s.shop_id === shopId) {
          return { ...s, is_active: isActive ? 0 : 1 };
        }
        return s;
      }));
      
    } catch (err) {
      console.error(`Error toggling shop status for ${shopId}:`, err);
      alert('Failed to update shop status. Please try again.');
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading shops..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <div className="shop-page">
      <div className="adopt-card">
        <h1>Shop Manager</h1>
        <Link to="/admin/shop-manager/new" className="button primary">
          <i className="fas fa-plus"></i> Add New Shop
        </Link>
      </div>
      
      <div className="shop-form">
        {shops.length === 0 ? (
          <div className="no-shops-message">
            <p>No shops found. Click the "Add New Shop" button to create one.</p>
          </div>
        ) : (
          <div className="shops-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => (
                  <tr key={shop.shop_id} className={shop.is_active ? 'active-shop' : 'inactive-shop'}>
                    <td>{shop.shop_id}</td>
                    <td>{shop.name}</td>
                    <td>{shop.category}</td>
                    <td>{shop.is_constant ? 'Constant' : 'Dynamic'}</td>
                    <td>
                      <span className={`shop-status${shop.is_active ? 'active' : 'inactive'}`}>
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="shop-actions">
                      <Link to={`/admin/shop-manager/${shop.shop_id}`} className="button secondary icon">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <Link to={`/admin/shop-manager/${shop.shop_id}/items`} className="button info icon">
                        <i className="fas fa-box"></i>
                      </Link>
                      <button
                        className={`button icon${shop.is_active ? 'danger' : 'success'}`}
                        onClick={() => toggleShopStatus(shop.shop_id, shop.is_active)}
                      >
                        <i className={`fas fa-${shop.is_active ? 'times' : 'check'}`}></i>
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
  );
};

export default ShopManager;
