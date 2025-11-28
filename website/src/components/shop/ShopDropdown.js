import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ShopDropdown = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch visible shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/shops/visible');
        setShops(response.data.data || []);

      } catch (err) {
        console.error('Error fetching shops:', err);
        setError('Failed to load shops');

        // Fallback to default shops
        setShops([
          { shop_id: 'apothecary', name: 'Apothecary' },
          { shop_id: 'bakery', name: 'Bakery' },
          { shop_id: 'witchs_hut', name: 'Witch\'s Hut' },
          { shop_id: 'megamart', name: 'Mega Mart' },
          { shop_id: 'antique-store', name: 'Antique Store' },
          { shop_id: 'nursery', name: 'Nursery' },
          { shop_id: 'pirates_dock', name: 'Pirate\'s Dock' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  return (
    <div className="dropdown">
      <span className="top-nav-link">
        Markets
        <span className="dropdown-arrow"></span>
      </span>
      <div className="dropdown-content">
        {loading ? (
          <div className="shop-dropdown-loading">Loading shops...</div>
        ) : error ? (
          <>
            <Link to="/town/shop/apothecary">Apothecary</Link>
            <Link to="/town/shop/bakery">Bakery</Link>
            <Link to="/town/shop/witchs_hut">Witch's Hut</Link>
            <Link to="/town/shop/megamart">Mega Mart</Link>
            <Link to="/town/shop/antique-store">Antique Store</Link>
            <Link to="/town/shop/nursery">Nursery</Link>
            <Link to="/town/shop/pirates_dock">Pirate's Dock</Link>
          </>
        ) : (
          shops.map(shop => (
            <Link key={shop.shop_id} to={`/town/shop/${shop.shop_id}`}>
              {shop.name}
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopDropdown;
