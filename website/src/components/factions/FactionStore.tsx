import { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorMessage } from '../common';
import api from '../../services/api';

interface StoreItem {
  id: number | string;
  item_name: string;
  item_description: string;
  item_type: string;
  price: number;
  standing_requirement: number;
  stock_quantity: number;
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

const ITEM_TYPE_ICONS: Record<string, string> = {
  items: '\u{1F9EA}',
  balls: '\u26BE',
  berries: '\u{1F353}',
  pastries: '\u{1F9C1}',
  evolution: '\u2728',
  eggs: '\u{1F95A}',
  antiques: '\u{1F3FA}',
  helditems: '\u{1F48E}',
  seals: '\u{1F516}',
  keyitems: '\u{1F5DD}\uFE0F'
};

export const FactionStore = ({ factionId, trainerId, faction }: FactionStoreProps) => {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [trainerCurrency, setTrainerCurrency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<number | string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

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
        setTrainerCurrency(response.data.remainingCurrency);

        if (item.stock_quantity !== -1) {
          setStoreItems(prevItems =>
            prevItems.map(prevItem =>
              prevItem.id === item.id
                ? { ...prevItem, stock_quantity: prevItem.stock_quantity - quantity }
                : prevItem
            )
          );
        }

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
    return trainerCurrency >= price;
  };

  const isInStock = (item: StoreItem): boolean => {
    return item.stock_quantity === -1 || item.stock_quantity > 0;
  };

  const getItemTypeIcon = (itemType: string): string => {
    return ITEM_TYPE_ICONS[itemType] || '\u{1F4E6}';
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
          <span>Your Currency:</span>
          <span>{trainerCurrency}</span>
          <i className="fas fa-coins"></i>
        </div>
      </div>

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
            <div key={item.id} className="card">
              <div className="card__header">
                <div className="shop-item__image-container">
                  <span style={{ fontSize: '2rem' }}>{getItemTypeIcon(item.item_type)}</span>
                </div>
                <div>
                  <h4 className="shop-item__name">{item.item_name}</h4>
                  <span className="badge neutral sm">{item.item_type}</span>
                </div>
              </div>

              <div className="card__body">
                <p className="text-muted">{item.item_description}</p>

                <div className="shop-item__price">
                  <span>{item.price}</span>
                  <i className="fas fa-coins"></i>
                </div>

                {item.standing_requirement > 0 && (
                  <div className="text-muted" style={{ fontSize: 'var(--font-size-small)' }}>
                    Requires {item.standing_requirement} standing
                  </div>
                )}

                {item.stock_quantity !== -1 && (
                  <div className="text-muted" style={{ fontSize: 'var(--font-size-small)' }}>
                    Stock: {item.stock_quantity}
                  </div>
                )}
              </div>

              <div className="card__footer">
                <button
                  className={[
                    'button',
                    'primary',
                    'full-width',
                    (!canAfford(item.price) || !isInStock(item)) && 'disabled'
                  ].filter(Boolean).join(' ')}
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford(item.price) || !isInStock(item) || purchaseLoading === item.id}
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
