import type { TrainerMonster } from '@services/trainerService';
import type { FeaturedMonster } from '../useTrainerDetail';
import { PCBoxGrid } from '../shared/PCBoxGrid';

interface EditBoxesTabProps {
  featuredMonsters: (FeaturedMonster | null)[];
  setFeaturedMonsters: (v: (FeaturedMonster | null)[]) => void;
  isSaving: boolean;
  statusMessage: string;
  statusType: string;
  getMaxBoxNumber: () => number;
  getBoxMonsters: (boxIndex: number) => (TrainerMonster | null)[];
  handleDragStart: (e: React.DragEvent, monster: TrainerMonster | null, boxIndex: number, slotIndex: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, boxIndex: number, slotIndex: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleFeaturedDrop: (e: React.DragEvent, slotIndex: number) => void;
  handleFeaturedDragOver: (e: React.DragEvent) => void;
  handleFeaturedDragLeave: (e: React.DragEvent) => void;
  handleSaveBoxes: () => void;
  handleSaveFeaturedMonsters: () => void;
  handleAddBox: () => void;
  setActiveTab: (tab: string) => void;
  setStatusMessage: (msg: string) => void;
  setStatusType: (type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const EditBoxesTab = ({
  featuredMonsters,
  setFeaturedMonsters,
  isSaving,
  statusMessage,
  statusType,
  getMaxBoxNumber,
  getBoxMonsters,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleFeaturedDrop,
  handleFeaturedDragOver,
  handleFeaturedDragLeave,
  handleSaveBoxes,
  handleSaveFeaturedMonsters,
  handleAddBox,
  setActiveTab,
  setStatusMessage,
  setStatusType,
}: EditBoxesTabProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  const featuredIds = featuredMonsters.filter(Boolean).map(fm => fm!.id);

  return (
    <div className="trainer-detail__stats-section">
      <div className="tree-header">
        <h2>Edit Boxes</h2>
        <div className="edit-boxes-actions">
          <button className="button primary" onClick={handleSaveBoxes} disabled={isSaving}>
            {isSaving ? (
              <><i className="fas fa-spinner fa-spin"></i> Saving...</>
            ) : (
              <><i className="fas fa-save"></i> Save Changes</>
            )}
          </button>
          <button className="button secondary" onClick={() => setActiveTab('boxes')}>
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-message ${statusType}`}>{statusMessage}</div>
      )}

      {/* Featured Monsters Section */}
      <div className="ref-item featured-monsters-box">
        <div className="edit-box-header">
          <h3>Featured Monsters</h3>
          <span>{featuredMonsters.filter(Boolean).length}/6</span>
          <button
            className="button primary sm no-flex"
            onClick={handleSaveFeaturedMonsters}
            disabled={isSaving}
            title="Save featured monsters"
          >
            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-star"></i>}
          </button>
        </div>
        <div className="edit-box-grid featured-monsters-grid featured-monsters-compact">
          {Array.from({ length: 6 }).map((_, slotIndex) => {
            const monster = featuredMonsters[slotIndex];
            return (
              <div
                className={`edit-box-slot featured-monster-slot ${monster ? 'filled' : 'empty'}`}
                key={slotIndex}
                data-slot={slotIndex}
                onDragOver={handleFeaturedDragOver}
                onDragEnter={(e) => { e.preventDefault(); }}
                onDragLeave={handleFeaturedDragLeave}
                onDrop={(e) => handleFeaturedDrop(e, slotIndex)}
              >
                {monster ? (
                  <div
                    className="edit-box-monster map-background"
                    draggable
                    onDragStart={(e) => handleDragStart(e, monster, -1, slotIndex)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="item-icon compact">
                      <img
                        src={monster.img_link || '/images/default_mon.png'}
                        alt={monster.name}
                        onError={handleImgError}
                      />
                    </div>
                    <div className="edit-box-monster-info compact">
                      {monster.name.length > 8 ? monster.name.substring(0, 8) + '...' : monster.name}
                    </div>
                    <button
                      className="button danger icon sm no-flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = [...featuredMonsters];
                        updated[slotIndex] = null;
                        setFeaturedMonsters(updated);
                        setStatusMessage('Monster removed from featured. Remember to save your changes!');
                        setStatusType('info');
                      }}
                      title="Remove from featured"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div className="featured-monster-empty compact">
                    <i className="fas fa-star"></i>
                    <span>Drop Here</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="featured-monsters-instructions">
          <p>
            <i className="fas fa-info-circle"></i> Drag monsters from the boxes below into the featured slots above.
            Featured monsters appear on your trainer's profile page.
          </p>
        </div>
      </div>

      <div className="edit-boxes-instructions">
        <p>
          <i className="fas fa-info-circle"></i> Drag and drop monsters to rearrange them between boxes or add them to featured slots.
          Changes will not be saved until you click "Save Changes" or "Save Featured".
        </p>
      </div>

      <div className="edit-boxes-controls">
        <button className="button primary" onClick={handleAddBox} title="Add a new empty box">
          <i className="fas fa-plus"></i> Add Box
        </button>
      </div>

      <div className="edit-boxes-grid">
        {Array.from({ length: Math.max(getMaxBoxNumber(), 1) }).map((_, boxIndex) => {
          const bm = getBoxMonsters(boxIndex);
          return (
            <div className="ref-item" key={boxIndex}>
              <div className="edit-box-header">
                <h3>Box {boxIndex + 1}</h3>
                <span>{bm.filter(Boolean).length}/30</span>
              </div>
              <PCBoxGrid
                monsters={bm}
                editable
                boxIndex={boxIndex}
                featuredMonsterIds={featuredIds}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
