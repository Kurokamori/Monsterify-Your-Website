interface InventoryTabProps {
  inventoryData: Record<string, Record<string, number>> | null;
  getItemImageUrl: (itemName: string, category: string) => string;
  handleItemDetailClick: (itemName: string, category: string) => void;
}

const INVENTORY_CATEGORIES: { key: string; label: string }[] = [
  { key: 'items', label: 'Items' },
  { key: 'balls', label: 'Pokeballs' },
  { key: 'berries', label: 'Berries' },
  { key: 'evolution', label: 'Evolution Items' },
  { key: 'helditems', label: 'Held Items' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'pastries', label: 'Pastries' },
  { key: 'antiques', label: 'Antiques' },
  { key: 'seals', label: 'Seals' },
  { key: 'keyitems', label: 'Key Items' },
];

export const InventoryTab = ({
  inventoryData,
  getItemImageUrl,
  handleItemDetailClick,
}: InventoryTabProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_item.png';
  };

  if (!inventoryData || Object.keys(inventoryData).length === 0) {
    return (
      <div className="trainer-detail__stats-section">
        <h2>Inventory</h2>
        <div className="no-monsters-message">
          <i className="fas fa-box-open"></i>
          <p>This trainer doesn't have any items yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-detail__stats-section">
      <h2>Inventory</h2>
      <div className="inventory-sections">
        {INVENTORY_CATEGORIES.map(({ key, label }) => {
          const items = inventoryData[key];
          if (!items || Object.keys(items).length === 0) return null;

          return (
            <div className="inventory-section" key={key}>
              <h3>{label}</h3>
              <div className="images-grid">
                {Object.entries(items).map(([itemName, quantity], index) => (
                  <div
                    className="inventory-item clickable-item"
                    key={`${key}-${index}`}
                    onClick={() => handleItemDetailClick(itemName, key)}
                  >
                    <div className="image-container xs">
                      <img
                        src={getItemImageUrl(itemName, key)}
                        alt={itemName}
                        onError={handleImgError}
                      />
                    </div>
                    <div className="inventory-item-details">
                      <span className="pc-box-number">{itemName}</span>
                      <span className="inventory-item-quantity">x{quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
