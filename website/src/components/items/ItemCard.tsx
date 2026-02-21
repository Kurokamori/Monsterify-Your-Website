import { useCallback } from 'react';
import { Card } from '../common/Card';
import { getItemImageUrl } from '../../utils/imageUtils';

export interface ItemCardData {
  id?: string;
  item_id?: string;
  name: string;
  description?: string;
  effect?: string;
  category?: string;
  rarity?: string;
  price?: number;
  current_quantity?: number;
  image_url?: string;
  image_path?: string;
}

interface ItemCardProps {
  item: ItemCardData;
  onPurchaseClick?: () => void;
  onItemClick?: (item: ItemCardData) => void;
  disabled?: boolean;
  showPrice?: boolean;
  showPurchase?: boolean;
}

const getRarityBadgeClass = (rarity?: string): string => {
  if (!rarity) return '';
  const rarityLower = rarity.toLowerCase().replace(' ', '-') as string;
  // Map to existing badge classes
  const rarityMap: Record<string, string> = {
    'common': 'common',
    'uncommon': 'uncommon',
    'rare': 'rare',
    'ultra-rare': 'legendary', // Map ultra-rare to legendary styling
    'legendary': 'legendary'
  };
  return rarityMap[rarityLower] || '';
};

export const ItemCard = ({
  item,
  onPurchaseClick,
  onItemClick,
  disabled = false,
  showPrice = false,
  showPurchase = false
}: ItemCardProps) => {
  const handleCardClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  const isOutOfStock = item.current_quantity !== undefined && item.current_quantity <= 0;
  const rarityClass = getRarityBadgeClass(item.rarity);

  // Build card actions
  const actions = showPurchase ? [{
    label: isOutOfStock ? 'Out of Stock' : 'Purchase',
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onPurchaseClick?.();
    },
    variant: 'primary' as const,
    disabled: disabled || isOutOfStock
  }] : undefined;

  // Build header action (rarity badge)
  const headerAction = item.rarity ? (
    <span className={`badge sm ${rarityClass}`}>{item.rarity}</span>
  ) : undefined;

  // Build footer content (price and quantity)
  const footerContent = (showPrice || (item.current_quantity !== undefined && item.current_quantity !== 999)) ? (
    <div className="item-card__meta">
      {showPrice && item.price !== undefined && (
        <span className="item-card__price">
          <i className="fas fa-coins"></i> {item.price}
        </span>
      )}
      {item.current_quantity !== undefined && item.current_quantity !== 999 && (
        <span className="item-card__stock">Available: {item.current_quantity}</span>
      )}
    </div>
  ) : undefined;

  return (
    <Card
      image={getItemImageUrl(item)}
      imageAlt={item.name}
      imageHeight="100px"
      imageFallback="/images/items/default.png"
      title={item.name}
      subtitle={item.category}
      headerAction={headerAction}
      onClick={onItemClick ? handleCardClick : undefined}
      disabled={disabled}
      actions={actions}
      footer={footerContent}
      size="sm"
      className="item-card"
    >
      <p className="item-card__description">
        {item.description || item.effect || 'No description available.'}
      </p>
    </Card>
  );
};
