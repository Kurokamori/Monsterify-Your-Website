import { Link } from 'react-router-dom';
import type { TrainerMonster } from '@services/trainerService';

export type PCBoxCellSize = 'xsmall' | 'small' | 'medium' | 'large';

interface PCBoxGridProps {
  monsters: (TrainerMonster | null)[];
  editable?: boolean;
  compact?: boolean;
  cellSize?: PCBoxCellSize;
  onDragStart?: (e: React.DragEvent, monster: TrainerMonster | null, boxIndex: number, slotIndex: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, boxIndex: number, slotIndex: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  boxIndex?: number;
  featuredMonsterIds?: number[];
}

export const PCBoxGrid = ({
  monsters,
  editable = false,
  compact = false,
  cellSize = 'medium',
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  boxIndex = 0,
  featuredMonsterIds = [],
}: PCBoxGridProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  if (editable) {
    return (
      <div className="edit-box-grid" data-box-number={boxIndex}>
        {Array.from({ length: 30 }).map((_, slotIndex) => {
          const monster = monsters[slotIndex];
          return (
            <div
              className={`edit-box-slot ${monster ? 'filled' : 'empty'}`}
              key={slotIndex}
              data-box={boxIndex}
              data-slot={slotIndex}
              draggable={!!monster}
              onDragStart={(e) => onDragStart?.(e, monster, boxIndex, slotIndex)}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop?.(e, boxIndex, slotIndex)}
              onDragEnd={onDragEnd}
            >
              {monster && (
                <div className="edit-box-monster">
                  <div className="image-container medium">
                    <img
                      src={monster.img_link || '/images/default_mon.png'}
                      alt={monster.name}
                      onError={handleImgError}
                    />
                  </div>
                  <div className="edit-box-monster-info">
                    {monster.name}
                    {featuredMonsterIds.includes(monster.id) && (
                      <i className="fas fa-star featured-indicator" title="Featured Monster"></i>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="box-preview-grid">
        {Array.from({ length: 30 }).map((_, slotIndex) => {
          const monster = monsters[slotIndex];
          return (
            <div className="box-preview-slot" key={slotIndex}>
              {monster ? (
                <Link
                  to={`/monsters/${monster.id}`}
                  className="box-preview-monster"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={monster.img_link || '/images/default_mon.png'}
                    alt={monster.name}
                    className="box-preview-monster-image"
                    onError={handleImgError}
                  />
                  <div className="box-preview-monster-name">{monster.name}</div>
                </Link>
              ) : (
                <div className="pc-box-empty-slot"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full-size grid (PC box tab)
  return (
    <div className={`pc-box-grid pc-box-grid--${cellSize}`}>
      {Array.from({ length: 30 }).map((_, index) => {
        const monster = monsters[index];
        return (
          <div className="pc-box-slot" key={index}>
            {monster ? (
              <Link to={`/monsters/${monster.id}`} className="pc-box-monster">
                <div className="pc-box-monster-image-container">
                  <img
                    src={monster.img_link || '/images/default_mon.png'}
                    alt={monster.name}
                    className="pc-box-monster-image"
                    onError={handleImgError}
                  />
                </div>
                <div className="pc-box-monster-info">
                  <h4 className="pc-box-monster-name">{monster.name}</h4>
                  <span className="pc-box-monster-level">Lv.{monster.level}</span>
                  <div className="pc-box-monster-types">
                    {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
                      .filter(Boolean)
                      .map((type, idx) => (
                        <span key={idx} className={`badge type-${(type as string).toLowerCase()}`}></span>
                      ))}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="pc-box-empty-slot"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};
