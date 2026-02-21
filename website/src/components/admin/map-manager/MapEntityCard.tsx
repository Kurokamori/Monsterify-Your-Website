interface MapEntityCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  coordinates?: { x: number; y: number; width: number; height: number };
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  isSelected?: boolean;
}

export function MapEntityCard({
  id,
  name,
  description,
  imageUrl,
  coordinates,
  onEdit,
  onDelete,
  onClick,
  isSelected,
}: MapEntityCardProps) {
  return (
    <div
      className={`map-entity-card${isSelected ? ' map-entity-card--selected' : ''}`}
      onClick={onClick}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="map-entity-card__image"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="map-entity-card__body">
        <h4 className="map-entity-card__name">{name}</h4>
        <span className="map-entity-card__id">{id}</span>
        {description && (
          <p className="map-entity-card__desc">{description.substring(0, 120)}{description.length > 120 ? '...' : ''}</p>
        )}
        {coordinates && (
          <span className="map-entity-card__coords">
            ({Math.round(coordinates.x)}, {Math.round(coordinates.y)}) {Math.round(coordinates.width)}x{Math.round(coordinates.height)}
          </span>
        )}
      </div>
      <div className="map-entity-card__actions">
        <button
          type="button"
          className="button primary sm"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <i className="fas fa-edit"></i>
        </button>
        <button
          type="button"
          className="button danger sm"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}
