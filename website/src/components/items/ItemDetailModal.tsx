import { Modal } from '../common/Modal';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

export interface ItemDetailData {
  id?: string;
  item_id?: string;
  name: string;
  description?: string;
  effect?: string;
  category?: string;
  rarity?: string;
  image_url?: string;
  image_path?: string;
}

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetailData | null;
}

const getRarityBadgeClass = (rarity?: string): string => {
  if (!rarity) return '';
  const rarityLower = rarity.toLowerCase().replace(' ', '-');
  const rarityMap: Record<string, string> = {
    'common': 'common',
    'uncommon': 'uncommon',
    'rare': 'rare',
    'ultra-rare': 'legendary',
    'legendary': 'legendary'
  };
  return rarityMap[rarityLower] || '';
};

export const ItemDetailModal = ({ isOpen, onClose, item }: ItemDetailModalProps) => {
  if (!item) return null;

  const rarityClass = getRarityBadgeClass(item.rarity);

  const footer = (
    <button className="button primary" onClick={onClose}>
      Close
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item Details" size="medium" footer={footer}>
      <div className="item-detail">
        <div className="item-detail__header">
          <div className="item-detail__image">
            <img
              src={getItemImageUrl(item)}
              alt={item.name}
              onError={(e) => handleItemImageError(e, item.category)}
            />
            {item.rarity && (
              <span className={`badge sm ${rarityClass} item-detail__rarity`}>
                {item.rarity}
              </span>
            )}
          </div>

          <div className="item-detail__title">
            <h2>{item.name}</h2>
            {item.category && (
              <span className="badge info sm">{item.category}</span>
            )}
          </div>
        </div>

        <div className="item-detail__body">
          {item.description && (
            <div className="item-detail__section">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>
          )}

          {item.effect && item.effect !== item.description && (
            <div className="item-detail__section">
              <h3>Effect</h3>
              <p>{item.effect}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
