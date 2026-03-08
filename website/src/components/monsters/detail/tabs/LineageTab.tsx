import { Link } from 'react-router-dom';
import { TypeBadge } from '@components/common/TypeBadge';
import { BadgeGroup } from '@components/common/BadgeGroup';
import type { Monster } from '@services/monsterService';
import type { LineageData, LineageMonster } from '../useMonsterDetail';

interface LineageTabProps {
  monster: Monster;
  lineage: LineageData | null;
  isOwner: boolean;
  showEditLineage: boolean;
  setShowEditLineage: (v: boolean) => void;
  newRelationshipType: string;
  setNewRelationshipType: (v: string) => void;
  monsterSearch: string;
  setMonsterSearch: (v: string) => void;
  relationshipNotes: string;
  setRelationshipNotes: (v: string) => void;
  searchResults: Monster[];
  selectedMonster: Monster | null;
  selectMonster: (m: Monster) => void;
  removeLineageRelationship: (relatedId: number, type: string) => Promise<void>;
  addLineageRelationship: () => Promise<void>;
}

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = '/images/default_mon.png';
};

interface LineageTierProps {
  title: string;
  icon: string;
  monsters: LineageMonster[];
  relationshipType: string;
  autoLabel: string;
  isOwner: boolean;
  showEdit: boolean;
  onRemove: (id: number, type: string) => Promise<void>;
}

const LineageTier = ({
  title,
  icon,
  monsters,
  relationshipType,
  autoLabel,
  isOwner,
  showEdit,
  onRemove,
}: LineageTierProps) => {
  if (!monsters || monsters.length === 0) return null;

  const types = (m: LineageMonster) =>
    [m.type1, m.type2, m.type3, m.type4, m.type5].filter(Boolean) as string[];

  const species = (m: LineageMonster) =>
    [m.species1, m.species2, m.species3].filter(Boolean).join(' / ');

  return (
    <div className="lineage-tier">
      <div className="lineage-tier-header">
        <span className="lineage-tier-label">
          <i className={`fas ${icon}`}></i>
          {title}
          <span className="lineage-tier-count">{monsters.length}</span>
        </span>
      </div>
      <div className="lineage-tier-cards">
        {monsters.map((mon, index) => (
          <div
            className="lineage-node"
            key={index}
            style={{
              '--node-accent': mon.type1
                ? `var(--${(mon.type1 as string).toLowerCase()}-type)`
                : 'var(--accent-color)',
            } as React.CSSProperties}
          >
            <div className="lineage-node-image">
              <img
                src={(mon.img_link as string) || '/images/default_mon.png'}
                alt={mon.name ?? 'Monster'}
                onError={handleImgError}
              />
              <span className="lineage-node-level">
                Lv. {(mon.level as number) || 1}
              </span>
            </div>
            <div className="lineage-node-info">
              <Link to={`/monsters/${mon.id}`} className="lineage-node-name">
                {mon.name}
              </Link>
              {species(mon) && (
                <p className="lineage-node-species">{species(mon)}</p>
              )}
              {types(mon).length > 0 && (
                <BadgeGroup gap="xs" align="center">
                  {types(mon).map((type, i) => (
                    <TypeBadge key={i} type={type} size="xs" />
                  ))}
                </BadgeGroup>
              )}
              {mon.is_automatic && (
                <div className="lineage-node-auto">
                  <i className="fas fa-dna"></i>
                  <span>{autoLabel}</span>
                </div>
              )}
              {showEdit && isOwner && (
                <button
                  className="lineage-node-remove"
                  onClick={() => onRemove(mon.id, relationshipType)}
                  title={`Remove ${relationshipType} relationship`}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LineageTab = ({
  lineage,
  isOwner,
  showEditLineage,
  setShowEditLineage,
  newRelationshipType,
  setNewRelationshipType,
  monsterSearch,
  setMonsterSearch,
  relationshipNotes,
  setRelationshipNotes,
  searchResults,
  selectedMonster,
  selectMonster,
  removeLineageRelationship,
  addLineageRelationship,
}: LineageTabProps) => {
  const hasLineage =
    lineage &&
    ((lineage.parents && lineage.parents.length > 0) ||
      (lineage.siblings && lineage.siblings.length > 0) ||
      (lineage.children && lineage.children.length > 0) ||
      (lineage.grandchildren && lineage.grandchildren.length > 0));

  return (
    <div className="trainer-detail__stats-section">
      <div className="collapsible-header">
        <h2>
          <i className="fas fa-sitemap"></i>
          Lineage
        </h2>
        {isOwner && (
          <button
            className={`button secondary sm ${showEditLineage ? 'active' : ''}`}
            onClick={() => setShowEditLineage(!showEditLineage)}
          >
            <i className={`fas ${showEditLineage ? 'fa-times' : 'fa-edit'}`}></i>
            {showEditLineage ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {lineage ? (
        <div className="lineage-tree-view">
          <LineageTier
            title="Parents"
            icon="fa-chevron-up"
            monsters={lineage.parents || []}
            relationshipType="parent"
            autoLabel="Breeding Parent"
            isOwner={isOwner}
            showEdit={showEditLineage}
            onRemove={removeLineageRelationship}
          />
          <LineageTier
            title="Siblings"
            icon="fa-equals"
            monsters={lineage.siblings || []}
            relationshipType="sibling"
            autoLabel="Same Clutch"
            isOwner={isOwner}
            showEdit={showEditLineage}
            onRemove={removeLineageRelationship}
          />
          <LineageTier
            title="Children"
            icon="fa-chevron-down"
            monsters={lineage.children || []}
            relationshipType="child"
            autoLabel="Bred Offspring"
            isOwner={isOwner}
            showEdit={showEditLineage}
            onRemove={removeLineageRelationship}
          />
          <LineageTier
            title="Grandchildren"
            icon="fa-angle-double-down"
            monsters={lineage.grandchildren || []}
            relationshipType="grandchild"
            autoLabel="Grandchild"
            isOwner={isOwner}
            showEdit={false}
            onRemove={removeLineageRelationship}
          />

          {!hasLineage && (
            <div className="lineage-empty">
              <div className="lineage-empty-icon">
                <i className="fas fa-sitemap"></i>
              </div>
              <p className="lineage-empty-title">No Lineage Recorded</p>
              <p className="lineage-empty-text">
                This monster's family tree hasn't been documented yet.
              </p>
              {isOwner && (
                <p className="lineage-empty-hint">
                  Use the <strong>Edit</strong> button above to add family relationships.
                </p>
              )}
            </div>
          )}

          {showEditLineage && isOwner && (
            <div className="lineage-form">
              <div className="lineage-form-header">
                <i className="fas fa-plus-circle"></i>
                <h3>Add Relationship</h3>
              </div>
              <div className="lineage-form-fields">
                <div className="lineage-form-group">
                  <label htmlFor="relationship-type">Relationship</label>
                  <select
                    id="relationship-type"
                    className="form-input"
                    value={newRelationshipType}
                    onChange={(e) => setNewRelationshipType(e.target.value)}
                  >
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                  </select>
                </div>

                <div className="lineage-form-group">
                  <label htmlFor="monster-search">Find Monster</label>
                  <div className="monster-search-container">
                    <input
                      type="text"
                      id="monster-search"
                      className="form-input"
                      placeholder="Search by trainer, monster name, or species..."
                      value={monsterSearch}
                      onChange={(e) => setMonsterSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="monster-search-results">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="monster-search-result"
                            onClick={() => selectMonster(result)}
                          >
                            <img
                              src={
                                (result.img_link as string) ||
                                '/images/default_mon.png'
                              }
                              alt={result.name ?? ''}
                              className="monster-search-result-img"
                              onError={handleImgError}
                            />
                            <div>
                              <div className="monster-search-result-name">
                                {result.name}
                              </div>
                              <div className="monster-search-result-detail">
                                {[
                                  result.species1,
                                  result.species2,
                                  result.species3,
                                ]
                                  .filter(Boolean)
                                  .join(' / ')}
                                {' - Level '}
                                {(result.level as number) || 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedMonster && (
                    <div className="lineage-form-selected">
                      <i className="fas fa-check-circle"></i>
                      <span>
                        Selected: <strong>{selectedMonster.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="lineage-form-group">
                  <label htmlFor="relationship-notes">
                    Notes{' '}
                    <span className="lineage-form-optional">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="relationship-notes"
                    className="form-input"
                    placeholder="Additional notes about this relationship..."
                    value={relationshipNotes}
                    onChange={(e) => setRelationshipNotes(e.target.value)}
                  />
                </div>

                <button
                  className="button primary"
                  onClick={addLineageRelationship}
                  disabled={!selectedMonster}
                >
                  <i className="fas fa-plus"></i>
                  Add Relationship
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="lineage-empty">
          <div className="lineage-empty-icon">
            <i className="fas fa-sitemap"></i>
          </div>
          <p className="lineage-empty-title">No Lineage Data</p>
          <p className="lineage-empty-text">
            No lineage data is available for this monster.
          </p>
          {isOwner && (
            <p className="lineage-empty-hint">
              Use the <strong>Edit</strong> button to start building a family tree.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
