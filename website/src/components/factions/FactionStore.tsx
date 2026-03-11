import { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorMessage } from '../common';
import api from '../../services/api';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

interface StoreItem {
  id: number | string;
  item_id: number;
  item_name: string;
  item_description: string | null;
  item_effect: string | null;
  item_category: string;
  item_type: string | null;
  image_url: string | null;
  price: number;
  standing_requirement: number;
  title_name?: string | null;
  title_id?: number | null;
}

interface Faction {
  id: number | string;
  name: string;
}

interface FactionStoreProps {
  factionId: number | string;
  trainerId: number | string;
  faction: Faction;
}

export const FactionStore = ({ factionId, trainerId, faction }: FactionStoreProps) => {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [factionStanding, setFactionStanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<number | string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!factionId || !trainerId) return;

      try {
        setLoading(true);
        const response = await api.get(`/factions/${factionId}/store?trainerId=${trainerId}`);
        setStoreItems(response.data.items || []);
        setFactionStanding(response.data.currentStanding ?? 0);
      } catch (err) {
        console.error('Error fetching store items:', err);
        setError('Failed to load store items');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [factionId, trainerId]);

  const handlePurchase = async (item: StoreItem, quantity: number = 1) => {
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
        setFactionStanding(response.data.remainingStanding);
        setTimeout(() => setPurchaseSuccess(null), 3000);
      }
    } catch (err: unknown) {
      console.error('Error purchasing item:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setPurchaseError(axiosError.response?.data?.message || 'Failed to purchase item');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const canAfford = (price: number): boolean => {
    return factionStanding > 0 && factionStanding >= price;
  };

  if (loading) {
    return <LoadingSpinner message="Loading faction store..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="faction-store">
      <div className="shop__header">
        <h3>{faction.name} Store</h3>
        <div className="shop-item__price">
          <span>Your Standing:</span>
          <span>{factionStanding}</span>
          <i className="fas fa-star"></i>
        </div>
      </div>

      <p className="text-muted" style={{ fontSize: 'var(--font-size-small)', marginBottom: 'var(--spacing-md)' }}>
        Items are purchased using faction standing (0–1000 per item). Spending standing will not affect your earned titles.
      </p>

      {purchaseSuccess && (
        <div className="alert success">
          <i className="fas fa-check-circle"></i>
          {purchaseSuccess}
        </div>
      )}

      {purchaseError && (
        <div className="alert error">
          <i className="fas fa-exclamation-triangle"></i>
          {purchaseError}
          <button onClick={() => setPurchaseError(null)} className="button ghost sm">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {storeItems.length === 0 ? (
        <div className="known-people__empty">
          <p>No items available in this store yet.</p>
        </div>
      ) : (
        <div className="refs-grid">
          {storeItems.map(item => (
            <div key={item.id} className="card faction-store__item-card">
              <div className="card__header">
                <h4 className="shop-item__name">{item.item_name}</h4>
                <span className="badge neutral sm">{item.item_category}</span>
              </div>

              <div className="faction-store__item-image">
                <img
                  src={getItemImageUrl({ name: item.item_name, image_url: item.image_url ?? undefined, category: item.item_category })}
                  alt={item.item_name}
                  onError={(e) => handleItemImageError(e, item.item_category)}
                />
              </div>

              <div className="card__body">
                {item.item_description && (
                  <p className="text-muted" style={{ fontSize: 'var(--font-size-small)' }}>{item.item_description}</p>
                )}
                {item.item_effect && item.item_effect !== item.item_description && (
                  <p className="text-muted" style={{ fontSize: 'var(--font-size-small)', fontStyle: 'italic' }}>{item.item_effect}</p>
                )}

                <div className="shop-item__price">
                  <span>{item.price}</span>
                  <i className="fas fa-star"></i>
                  <span className="text-muted" style={{ fontSize: 'var(--font-size-small)' }}>standing</span>
                </div>

                {(item.title_name || item.standing_requirement > 0) && (
                  <div className="text-muted" style={{ fontSize: 'var(--font-size-small)' }}>
                    {item.title_name
                      ? `Requires "${item.title_name}" title`
                      : `Requires ${item.standing_requirement} standing`}
                  </div>
                )}
              </div>

              <div className="card__footer">
                <button
                  className={['button', 'primary', 'full-width', !canAfford(item.price) && 'disabled'].filter(Boolean).join(' ')}
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford(item.price) || purchaseLoading === item.id}
                >
                  {purchaseLoading === item.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Purchasing...
                    </>
                  ) : !canAfford(item.price) ? (
                    'Insufficient Standing'
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
