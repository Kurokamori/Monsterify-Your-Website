import { useState } from 'react';
import type { TrainerMonster } from '@services/trainerService';
import { SearchBar } from '@components/common/SearchBar';
import { PCBoxGrid, type PCBoxCellSize } from '../shared/PCBoxGrid';
import { MonsterListView } from '../shared/MonsterListView';

interface PCBoxTabProps {
  monsters: TrainerMonster[];
  filteredMonsters: TrainerMonster[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  currentPCBox: number;
  setCurrentPCBox: (v: number | ((prev: number) => number)) => void;
  getMaxBoxNumber: () => number;
  getBoxMonstersForDisplay: (boxIndex: number) => (TrainerMonster | null)[];
  getFilteredBoxMonsters: (boxIndex: number) => (TrainerMonster | null)[];
}

export const PCBoxTab = ({
  monsters,
  filteredMonsters,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  currentPCBox,
  setCurrentPCBox,
  getMaxBoxNumber,
  getBoxMonstersForDisplay,
  getFilteredBoxMonsters,
}: PCBoxTabProps) => {
  const [cellSize, setCellSize] = useState<PCBoxCellSize>('medium');
  const maxBoxes = getMaxBoxNumber();
  const boxMonsters = searchTerm
    ? getFilteredBoxMonsters(currentPCBox)
    : getBoxMonstersForDisplay(currentPCBox);

  return (
    <div className="trainer-detail__stats-section">
      <div className="pc-header">
        <h2>PC Boxes</h2>
        {monsters.length > 0 && (
          <div className="pc-header-controls">
            <div className="view-toggle">
              <button
                className={`button toggle${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                className={`button toggle${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Detailed List View"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
            {viewMode === 'grid' && (
              <div className="view-toggle">
                <button
                  className={`button toggle${cellSize === 'xsmall' ? ' active' : ''}`}
                  onClick={() => setCellSize('xsmall')}
                  title="Extra small cells"
                >
                  XS
                </button>
                <button
                  className={`button toggle${cellSize === 'small' ? ' active' : ''}`}
                  onClick={() => setCellSize('small')}
                  title="Small cells"
                >
                  S
                </button>
                <button
                  className={`button toggle${cellSize === 'medium' ? ' active' : ''}`}
                  onClick={() => setCellSize('medium')}
                  title="Medium cells"
                >
                  M
                </button>
                <button
                  className={`button toggle${cellSize === 'large' ? ' active' : ''}`}
                  onClick={() => setCellSize('large')}
                  title="Large cells"
                >
                  L
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {monsters.length === 0 ? (
        <div className="no-monsters-message">
          <i className="fas fa-dragon-slash"></i>
          <p>This trainer doesn't have any monsters yet.</p>
        </div>
      ) : (
        <>
          <div className="pc-search-container">
            <SearchBar
              placeholder="Search monsters by name, species, or type..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
            {searchTerm && (
              <div className="adopt-card">
                <p>{filteredMonsters.length} monsters found</p>
                <button className="button danger" onClick={() => setSearchTerm('')}>
                  <i className="fas fa-times"></i> Clear Search
                </button>
              </div>
            )}
          </div>

          {viewMode === 'list' ? (
            <MonsterListView monsters={filteredMonsters} />
          ) : (
            <>
              <div className="pc-box-navigation">
                <div className="container center horizontal gap-md">
                  <button
                    className="button primary"
                    onClick={() => setCurrentPCBox(prev => Math.max(0, prev - 1))}
                    disabled={currentPCBox === 0}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="pc-box-number">Box {currentPCBox + 1} of {maxBoxes}</span>
                  <button
                    className="button primary"
                    onClick={() => setCurrentPCBox(prev => Math.min(maxBoxes - 1, prev + 1))}
                    disabled={currentPCBox >= maxBoxes - 1}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <PCBoxGrid monsters={boxMonsters} cellSize={cellSize} />
            </>
          )}
        </>
      )}
    </div>
  );
};
