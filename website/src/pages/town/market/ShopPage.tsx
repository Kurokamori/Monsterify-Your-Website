import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner, ErrorMessage } from '@components/common';
import { Shop } from '@components/town';
import shopService, { type ShopInfo } from '@services/shopService';
import '@styles/town/shop.css';
import '@styles/town/market.css';

// Fallback category mapping for known shops
const SHOP_CATEGORY_MAP: Record<string, string> = {
  apothecary: 'Berries',
  bakery: 'Pastries',
};

export default function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(shop?.name || 'Shop');

  const fetchShopDetails = useCallback(async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      setError('');
      const data = await shopService.getShopById(shopId);
      setShop(data);
    } catch (err) {
      console.error('Error fetching shop details:', err);
      const fallbackName = shopId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      setShop({
        shop_id: shopId,
        name: fallbackName,
        description: `Welcome to ${fallbackName}!`,
      });
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShopDetails();
  }, [fetchShopDetails]);

  if (!shopId) {
    navigate('/town/market');
    return null;
  }

  if (loading) {
    return <LoadingSpinner message="Loading shop..." />;
  }

  if (error && !shop) {
    return <ErrorMessage message={error} onRetry={fetchShopDetails} />;
  }

  return (
    <div className="market-shop-page">
      <div className="market-shop-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      {shop?.banner_image && (
        <div
          className="market-shop-page__banner"
          style={{ backgroundImage: `url(${shop.banner_image})` }}
        />
      )}

      <div className="market-shop-page__header">
        <h1>{shop?.name || 'Shop'}</h1>
        {shop?.description && (
          <p className="market-shop-page__description">{shop.description}</p>
        )}
        {shop?.flavor_text && (
          <p className="market-shop-page__flavor">{shop.flavor_text}</p>
        )}
      </div>

      <Shop
        shopId={shopId}
        shopCategory={SHOP_CATEGORY_MAP[shopId] || shop?.category || undefined}
      />
    </div>
  );
}
