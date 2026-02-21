import type { TrainerMonster } from '@services/trainerService';
import { SearchBar } from '@components/common/SearchBar';
import { PCBoxGrid } from '../shared/PCBoxGrid';
import { MonsterListView } from '../shared/MonsterListView';

interface AllBoxesTabProps {
  monsters: TrainerMonster[];
  filteredMonsters: TrainerMonster[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  isOwner: boolean;
  getMaxBoxNumber: () => number;
  getBoxMonstersForDisplay: (boxIndex: number) => (TrainerMonster | null)[];
  getFilteredBoxMonsters: (boxIndex: number) => (TrainerMonster | null)[];
  setCurrentPCBox: (v: number) => void;
  setActiveTab: (tab: string) => void;
  handleOpenMassEdit: () => void;
}

export const AllBoxesTab = ({
  monsters,
  filteredMonsters,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  isOwner,
  getMaxBoxNumber,
  getBoxMonstersForDisplay,
  getFilteredBoxMonsters,
  setCurrentPCBox,
  setActiveTab,
  handleOpenMassEdit,
}: AllBoxesTabProps) => {
  const maxBoxes = getMaxBoxNumber();

  return (
    <div className="trainer-detail__stats-section">
      <div className="pc-header">
        <h2>All Boxes</h2>
        <div className="flex gap-md">
            {isOwner && monsters.length > 0 && (
            <button
              className="button secondary"
              onClick={handleOpenMassEdit}
              title="Mass edit your monsters"
            >
              <i className="fas fa-edit"></i> Mass Edit
            </button>
          )}
          {monsters.length > 0 && (
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
          )}
        </div>
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
            <div className="all-boxes-list">
              {Array.from({ length: maxBoxes }).map((_, boxIndex) => {
                const bm = getFilteredBoxMonsters(boxIndex).filter(Boolean) as TrainerMonster[];
                return (
                  <MonsterListView
                    key={boxIndex}
                    monsters={bm}
                    title={`Box ${boxIndex + 1} (${bm.length}/30)`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="all-boxes-grid">
              {Array.from({ length: maxBoxes }).map((_, boxIndex) => {
                const bm = searchTerm
                  ? getFilteredBoxMonsters(boxIndex)
                  : getBoxMonstersForDisplay(boxIndex);
                return (
                  <div className="ref-item" key={boxIndex}>
                    <div className="box-preview-header">
                      <h3>Box {boxIndex + 1}</h3>
                      <span>{bm.filter(Boolean).length}/30</span>
                    </div>
                    <div className="box-preview">
                      <div
                        className="box-preview-title"
                        onClick={() => {
                          setCurrentPCBox(boxIndex);
                          setActiveTab('pc');
                        }}
                      >
                        View Full Box
                      </div>
                      <PCBoxGrid monsters={bm} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
