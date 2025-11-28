import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const MobileShopLinks = ({ toggleMobileMenu }) => {
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

  if (loading) {
    return <div className="mobile-nav-link disabled">Loading shops...</div>;
  }

  if (error) {
    return (
      <>
        <Link to="/town/shop/apothecary" className="mobile-nav-link" onClick={toggleMobileMenu}>Apothecary</Link>
        <Link to="/town/shop/bakery" className="mobile-nav-link" onClick={toggleMobileMenu}>Bakery</Link>
        <Link to="/town/shop/witchs_hut" className="mobile-nav-link" onClick={toggleMobileMenu}>Witch's Hut</Link>
        <Link to="/town/shop/megamart" className="mobile-nav-link" onClick={toggleMobileMenu}>Mega Mart</Link>
        <Link to="/town/shop/antique-store" className="mobile-nav-link" onClick={toggleMobileMenu}>Antique Store</Link>
        <Link to="/town/shop/nursery" className="mobile-nav-link" onClick={toggleMobileMenu}>Nursery</Link>
        <Link to="/town/shop/pirates_dock" className="mobile-nav-link" onClick={toggleMobileMenu}>Pirate's Dock</Link>
      </>
    );
  }

  return (
    <>
      {shops.map(shop => (
        <Link
          key={shop.shop_id}
          to={`/town/shop/${shop.shop_id}`}
          className="mobile-nav-link"
          onClick={toggleMobileMenu}
        >
          {shop.name}
        </Link>
      ))}
    </>
  );
};

export default MobileShopLinks;
