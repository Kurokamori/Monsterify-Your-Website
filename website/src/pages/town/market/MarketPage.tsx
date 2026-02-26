import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner, ErrorMessage, Card } from '@components/common';
import shopService, { type ShopInfo } from '@services/shopService';
import '@styles/town/market.css';

// Fallback shops if API fails
const FALLBACK_SHOPS: ShopInfo[] = [
  { shop_id: 'apothecary', name: 'Apothecary', description: 'Use berries to modify your monsters\' species, types, and attributes.' },
  { shop_id: 'bakery', name: 'Bakery', description: 'Use pastries to set or add types and species to your monsters.' },
  { shop_id: 'witchs_hut', name: "Witch's Hut", description: 'Evolve your monsters using evolution items.' },
  { shop_id: 'megamart', name: 'Mega Mart', description: 'Purchase a wide variety of items for your trainers.' },
  { shop_id: 'antique-store', name: 'Antique Store', description: 'Appraise and auction rare antique items.' },
  { shop_id: 'nursery', name: 'Nursery', description: 'Breed and raise your monsters.' },
  { shop_id: 'pirates_dock', name: "Pirate's Dock", description: 'Find rare and exotic items from far-off lands.' },
];

const PLACEHOLDER_IMAGE = 'https://i.imgur.com/RmKySNO.png';

// Image mapping for shop types (placeholder for now, easily swappable)
const SHOP_IMAGES: Record<string, string> = {
  apothecary: PLACEHOLDER_IMAGE,
  bakery: PLACEHOLDER_IMAGE,
  witchs_hut: PLACEHOLDER_IMAGE,
  megamart: PLACEHOLDER_IMAGE,
  'antique-store': PLACEHOLDER_IMAGE,
  nursery: PLACEHOLDER_IMAGE,
  pirates_dock: PLACEHOLDER_IMAGE,
};

// Icon mapping for shop types
const SHOP_ICONS: Record<string, string> = {
  apothecary: 'fas fa-flask',
  bakery: 'fas fa-bread-slice',
  witchs_hut: 'fas fa-hat-wizard',
  megamart: 'fas fa-shopping-cart',
  'antique-store': 'fas fa-gem',
  nursery: 'fas fa-egg',
  pirates_dock: 'fas fa-anchor',
};

export default function MarketPage() {
  useDocumentTitle('Market');

  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await shopService.getVisibleShops();
      setShops(data.length > 0 ? data : FALLBACK_SHOPS);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setShops(FALLBACK_SHOPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleShopClick = useCallback((shopId: string) => {
    navigate(`/town/market/${shopId}`);
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading market..." />;
  }

  if (error && shops.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchShops} />;
  }

  return (
    <div className="market-page">
      <div className="market-page__header">
        <h1>Heimdal City Market</h1>
        <p className="market-page__subtitle">
          Welcome to the market! Visit our many shops to purchase items, use berries and pastries,
          evolve your monsters, and more.
        </p>
      </div>

      <div className="market-page__grid">
        {shops.map(shop => (
          <Card
            key={shop.shop_id}
            className="market-shop-card"
            image={SHOP_IMAGES[shop.shop_id] || PLACEHOLDER_IMAGE}
            imageAlt={shop.name}
            imageHeight="160px"
            hoverable
            onClick={() => handleShopClick(shop.shop_id)}
          >
            <h3 className="market-shop-card__name">
              <i className={SHOP_ICONS[shop.shop_id] || 'fas fa-store'}></i>
              {shop.name}
            </h3>
            <p className="market-shop-card__description">
              {shop.description || shop.flavor_text || 'Visit this shop to browse its wares.'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
