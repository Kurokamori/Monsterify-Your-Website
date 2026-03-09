import { useState, useRef, useCallback } from 'react';
import type { TrainerMonster } from '@services/trainerService';
import type { FeaturedMonster } from '../useTrainerDetail';
import { PCBoxGrid } from '../shared/PCBoxGrid';
import { AutoSortModal } from '../shared/AutoSortModal';
import type { MonsterBoxPosition } from '../shared/boxSortUtils';

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
  // Box settings
  isBoxLocked: (boxNum: number) => boolean;
  isDefaultBox: (boxNum: number) => boolean;
  toggleBoxLock: (boxNum: number) => void;
  setDefaultBox: (boxNum: number) => void;
  lockedBoxNumbers: Set<number>;
  // Auto sort
  boxMonsters: TrainerMonster[];
  showAutoSortModal: boolean;
  setShowAutoSortModal: (show: boolean) => void;
  handleApplySort: (positions: MonsterBoxPosition[]) => void;
  // Box rearrangement
  handleSwapBoxes: (sourceBox: number, targetBox: number) => void;
  handleInsertBoxBefore: (sourceBox: number, targetBox: number) => void;
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
  isBoxLocked,
  isDefaultBox,
  toggleBoxLock,
  setDefaultBox,
  lockedBoxNumbers,
  boxMonsters,
  showAutoSortModal,
  setShowAutoSortModal,
  handleApplySort,
  handleSwapBoxes,
  handleInsertBoxBefore,
}: EditBoxesTabProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  const featuredIds = featuredMonsters.filter(Boolean).map(fm => fm!.id);

  // Box-level drag and drop state
  const [draggedBoxIndex, setDraggedBoxIndex] = useState<number | null>(null);
  const [dropTargetBox, setDropTargetBox] = useState<number | null>(null);
  const [dropMode, setDropMode] = useState<'before' | 'swap' | null>(null);
  const boxDragCounter = useRef<Map<number, number>>(new Map());

  const handleBoxDragStart = useCallback((e: React.DragEvent, boxIndex: number) => {
    setDraggedBoxIndex(boxIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/box-drag', String(boxIndex));
    (e.currentTarget as HTMLElement).classList.add('box-dragging');
  }, []);

  const handleBoxDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('box-dragging');
    setDraggedBoxIndex(null);
    setDropTargetBox(null);
    setDropMode(null);
    boxDragCounter.current.clear();
    // Clean up all drop indicators
    document.querySelectorAll('.box-drop-before, .box-drop-swap').forEach(el => {
      el.classList.remove('box-drop-before', 'box-drop-swap');
    });
  }, []);

  const handleBoxDropZoneDragOver = useCallback((e: React.DragEvent, boxIndex: number) => {
    if (draggedBoxIndex == null || draggedBoxIndex === boxIndex) { return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetBox(boxIndex);
    setDropMode('before');
  }, [draggedBoxIndex]);

  const handleBoxDropZoneDragLeave = useCallback((_e: React.DragEvent, boxIndex: number) => {
    if (dropTargetBox === boxIndex && dropMode === 'before') {
      setDropTargetBox(null);
      setDropMode(null);
    }
  }, [dropTargetBox, dropMode]);

  const handleBoxDropZoneDrop = useCallback((e: React.DragEvent, boxIndex: number) => {
    e.preventDefault();
    if (draggedBoxIndex != null && draggedBoxIndex !== boxIndex) {
      handleInsertBoxBefore(draggedBoxIndex, boxIndex);
    }
    setDraggedBoxIndex(null);
    setDropTargetBox(null);
    setDropMode(null);
    boxDragCounter.current.clear();
  }, [draggedBoxIndex, handleInsertBoxBefore]);

  const handleBoxHeaderDragOver = useCallback((e: React.DragEvent, boxIndex: number) => {
    if (draggedBoxIndex == null || draggedBoxIndex === boxIndex) { return; }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetBox(boxIndex);
    setDropMode('swap');
  }, [draggedBoxIndex]);

  const handleBoxHeaderDragEnter = useCallback((e: React.DragEvent, boxIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const count = (boxDragCounter.current.get(boxIndex) ?? 0) + 1;
    boxDragCounter.current.set(boxIndex, count);
    if (draggedBoxIndex != null && draggedBoxIndex !== boxIndex) {
      (e.currentTarget as HTMLElement).classList.add('box-drop-swap');
    }
  }, [draggedBoxIndex]);

  const handleBoxHeaderDragLeave = useCallback((e: React.DragEvent, boxIndex: number) => {
    e.stopPropagation();
    const count = (boxDragCounter.current.get(boxIndex) ?? 0) - 1;
    boxDragCounter.current.set(boxIndex, count);
    if (count <= 0) {
      boxDragCounter.current.delete(boxIndex);
      (e.currentTarget as HTMLElement).classList.remove('box-drop-swap');
      if (dropTargetBox === boxIndex && dropMode === 'swap') {
        setDropTargetBox(null);
        setDropMode(null);
      }
    }
  }, [dropTargetBox, dropMode]);

  const handleBoxHeaderDrop = useCallback((e: React.DragEvent, boxIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('box-drop-swap');
    if (draggedBoxIndex != null && draggedBoxIndex !== boxIndex) {
      handleSwapBoxes(draggedBoxIndex, boxIndex);
    }
    setDraggedBoxIndex(null);
    setDropTargetBox(null);
    setDropMode(null);
    boxDragCounter.current.clear();
  }, [draggedBoxIndex, handleSwapBoxes]);

  return (
    <div className="trainer-detail__stats-section">
      <div className="tree-header">
        <h2>Edit Boxes</h2>
        <div className="edit-boxes-actions">
          <button className="button primary" onClick={() => setShowAutoSortModal(true)}>
            <i className="fas fa-sort"></i> Auto Sort
          </button>
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

      <div className="edit-boxes-instructions">
        <p>
          <i className="fas fa-info-circle"></i> <br />
          Drag and drop monsters to rearrange them between boxes or add them to featured slots. <br />
          Use the grip handle (<i className="fas fa-grip-vertical"></i>) to drag entire boxes — drop on another box header to swap, or drop between boxes to insert. <br />
          Use the lock icon to prevent changes to a box, and the star icon to set a default box that new monsters will be added to. <br />
          Use the Auto Sort button to automatically sort monsters in a box based on various criteria. <br />
          Changes will not be saved until you click "Save Changes" or "Save Featured".
        </p>
      </div>

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
        <div className="featured-monsters-compact">
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

      <div className="edit-boxes-controls">
        <button className="button primary" onClick={handleAddBox} title="Add a new empty box">
          <i className="fas fa-plus"></i> Add Box
        </button>
      </div>

      <div className="edit-boxes-grid">
        {Array.from({ length: Math.max(getMaxBoxNumber(), 1) }).map((_, boxIndex) => {
          const bm = getBoxMonsters(boxIndex);
          const locked = isBoxLocked(boxIndex);
          const isDefault = isDefaultBox(boxIndex);
          const isDragSource = draggedBoxIndex === boxIndex;
          return (
            <div key={boxIndex} className="edit-box-wrapper">
              {/* Drop zone before this box (insert mode) */}
              {draggedBoxIndex != null && draggedBoxIndex !== boxIndex && (
                <div
                  className={`box-drop-zone ${dropTargetBox === boxIndex && dropMode === 'before' ? 'box-drop-zone--active' : ''}`}
                  onDragOver={(e) => handleBoxDropZoneDragOver(e, boxIndex)}
                  onDragLeave={(e) => handleBoxDropZoneDragLeave(e, boxIndex)}
                  onDrop={(e) => handleBoxDropZoneDrop(e, boxIndex)}
                >
                  <div className="box-drop-zone__indicator">
                    <i className="fas fa-arrow-right"></i> Insert here
                  </div>
                </div>
              )}
              <div className={`ref-item ${locked ? 'edit-box-locked' : ''} ${isDefault ? 'edit-box-default' : ''} ${isDragSource ? 'edit-box-dragging' : ''}`}>
                <div
                  className="edit-box-header"
                  onDragOver={(e) => handleBoxHeaderDragOver(e, boxIndex)}
                  onDragEnter={(e) => handleBoxHeaderDragEnter(e, boxIndex)}
                  onDragLeave={(e) => handleBoxHeaderDragLeave(e, boxIndex)}
                  onDrop={(e) => handleBoxHeaderDrop(e, boxIndex)}
                >
                  <div
                    className="box-drag-handle"
                    draggable
                    onDragStart={(e) => handleBoxDragStart(e, boxIndex)}
                    onDragEnd={handleBoxDragEnd}
                    title="Drag to rearrange box"
                  >
                    <i className="fas fa-grip-vertical"></i>
                  </div>
                  <h3>Box {boxIndex + 1}</h3>
                  <span>{bm.filter(Boolean).length}/30</span>
                  <div className="box-setting-icons">
                    <button
                      onClick={() => toggleBoxLock(boxIndex)}
                      className={`button icon sm no-flex ${locked ? 'active' : ''}`}
                      title={locked ? 'Unlock box' : 'Lock box'}
                    >
                      <i className={`fas fa-${locked ? 'lock' : 'lock-open'}`}></i>
                    </button>
                    <button
                      onClick={() => setDefaultBox(boxIndex)}
                      className={`button icon sm no-flex ${isDefault ? 'active' : ''}`}
                      title={isDefault ? 'Remove default' : 'Set as default box'}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  </div>
                </div>
                <PCBoxGrid
                  monsters={bm}
                  editable
                  boxIndex={boxIndex}
                  featuredMonsterIds={featuredIds}
                  isLocked={locked}
                  isDefault={isDefault}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AutoSortModal
        monsters={boxMonsters}
        lockedBoxNumbers={lockedBoxNumbers}
        onApplySort={handleApplySort}
        isOpen={showAutoSortModal}
        onClose={() => setShowAutoSortModal(false)}
      />
    </div>
  );
};
