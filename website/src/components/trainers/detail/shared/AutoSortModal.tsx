import { useState, useCallback } from 'react';
import { Modal } from '@components/common/Modal';
import type { TrainerMonster } from '@services/trainerService';
import { fetchSpeciesMetadata } from '@services/speciesMetadataService';
import {
  computeSortedPositions,
  DEFAULT_SORT_CONFIG,
  type SortConfig,
  type MonsterBoxPosition,
} from './boxSortUtils';

interface AutoSortModalProps {
  monsters: TrainerMonster[];
  lockedBoxNumbers: Set<number>;
  onApplySort: (positions: MonsterBoxPosition[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SORT_FIELD_LABELS: Record<string, string> = {
  level: 'Level',
  type: 'Type (Type 1)',
  name: 'Name (Alphabetical)',
  species: 'Group by Species',
  attribute: 'Attribute',
};

export const AutoSortModal = ({
  monsters,
  lockedBoxNumbers,
  onApplySort,
  isOpen,
  onClose,
}: AutoSortModalProps) => {
  const [config, setConfig] = useState<SortConfig>({ ...DEFAULT_SORT_CONFIG, sortWithin: DEFAULT_SORT_CONFIG.sortWithin.map(s => ({ ...s })) });
  const [isLoading, setIsLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleSpecialChange = (key: keyof SortConfig['specialSeparations']) => {
    setConfig(prev => ({
      ...prev,
      specialSeparations: {
        ...prev.specialSeparations,
        [key]: !prev.specialSeparations[key],
      },
    }));
  };

  const handleSegregationChange = (value: SortConfig['mainSegregation']) => {
    setConfig(prev => ({ ...prev, mainSegregation: value }));
  };

  const handleSegregationOptionChange = (
    key: keyof SortConfig['segregationOptions'],
    value: string,
  ) => {
    setConfig(prev => ({
      ...prev,
      segregationOptions: {
        ...prev.segregationOptions,
        [key]: value,
      },
    }));
  };

  const handleSortFieldToggle = (index: number) => {
    setConfig(prev => {
      const updated = [...prev.sortWithin];
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return { ...prev, sortWithin: updated };
    });
  };

  const handleSortDirectionToggle = (index: number) => {
    setConfig(prev => {
      const updated = [...prev.sortWithin];
      updated[index] = {
        ...updated[index],
        direction: updated[index].direction === 'asc' ? 'desc' : 'asc',
      };
      return { ...prev, sortWithin: updated };
    });
  };

  // Drag reorder for sort fields
  const handleFieldDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    setConfig(prev => {
      const updated = [...prev.sortWithin];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(index, 0, moved);
      return { ...prev, sortWithin: updated };
    });
    setDragIdx(index);
  };

  const handleFieldDragEnd = () => {
    setDragIdx(null);
  };

  const handleApply = useCallback(async () => {
    setIsLoading(true);
    try {
      // Collect unique species names from unlocked-box monsters
      const speciesNames = new Set<string>();
      for (const m of monsters) {
        if (m.box_number != null && lockedBoxNumbers.has(m.box_number)) continue;
        if (m.species1) speciesNames.add(m.species1 as string);
        if (m.species2) speciesNames.add(m.species2 as string);
        if (m.species3) speciesNames.add(m.species3 as string);
      }

      const metadata = await fetchSpeciesMetadata([...speciesNames]);
      const positions = computeSortedPositions(monsters, metadata, lockedBoxNumbers, config);
      onApplySort(positions);
      onClose();
    } catch (err) {
      console.error('Error applying sort:', err);
    } finally {
      setIsLoading(false);
    }
  }, [monsters, lockedBoxNumbers, config, onApplySort, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auto Sort Monsters" size="large">
      <div className="auto-sort-modal">
        {/* Section A: Special Separations */}
        <div className="auto-sort-section">
          <h3>Special Separations</h3>
          <p className="auto-sort-hint">These groups get their own boxes before the main sort.</p>
          <div className="special-separations">
            <label className="sort-checkbox">
              <input
                type="checkbox"
                checked={config.specialSeparations.level100Separate}
                onChange={() => handleSpecialChange('level100Separate')}
              />
              Separate Level 100+ into own box
            </label>
            <label className="sort-checkbox">
              <input
                type="checkbox"
                checked={config.specialSeparations.legendaryMythicalSeparate}
                onChange={() => handleSpecialChange('legendaryMythicalSeparate')}
              />
              Separate Legendaries/Mythicals into own box
            </label>
            <label className="sort-checkbox">
              <input
                type="checkbox"
                checked={config.specialSeparations.splitByImage}
                onChange={() => handleSpecialChange('splitByImage')}
              />
              Split groups by Has Image / No Image
            </label>
          </div>
        </div>

        {/* Section B: Box Segregation */}
        <div className="auto-sort-section">
          <h3>Box Segregation</h3>
          <p className="auto-sort-hint">Each group starts in a new box.</p>
          <div className="segregation-options">
            {([
              ['none', 'None'],
              ['stage', 'By Stage / Rank'],
              ['franchise', 'By Franchise'],
              ['type', 'By Type'],
              ['attribute', 'By Attribute'],
            ] as [SortConfig['mainSegregation'], string][]).map(([value, label]) => (
              <div key={value}>
                <label className="sort-radio">
                  <input
                    type="radio"
                    name="segregation"
                    checked={config.mainSegregation === value}
                    onChange={() => handleSegregationChange(value)}
                  />
                  {label}
                </label>
                {/* Sub-options */}
                {value === 'franchise' && config.mainSegregation === 'franchise' && (
                  <div className="segregation-sub-options">
                    <label className="sort-radio">
                      <input
                        type="radio"
                        name="franchiseMode"
                        checked={config.segregationOptions.franchiseMode === 'species1Only'}
                        onChange={() => handleSegregationOptionChange('franchiseMode', 'species1Only')}
                      />
                      Species 1 only
                    </label>
                    <label className="sort-radio">
                      <input
                        type="radio"
                        name="franchiseMode"
                        checked={config.segregationOptions.franchiseMode === 'allSpecies'}
                        onChange={() => handleSegregationOptionChange('franchiseMode', 'allSpecies')}
                      />
                      All species combinations
                    </label>
                  </div>
                )}
                {value === 'type' && config.mainSegregation === 'type' && (
                  <div className="segregation-sub-options">
                    <label className="sort-radio">
                      <input
                        type="radio"
                        name="typeMode"
                        checked={config.segregationOptions.typeMode === 'type1Only'}
                        onChange={() => handleSegregationOptionChange('typeMode', 'type1Only')}
                      />
                      Type 1 only
                    </label>
                    <label className="sort-radio">
                      <input
                        type="radio"
                        name="typeMode"
                        checked={config.segregationOptions.typeMode === 'allTypes'}
                        onChange={() => handleSegregationOptionChange('typeMode', 'allTypes')}
                      />
                      All type combinations
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Sort Within Boxes */}
        <div className="auto-sort-section">
          <h3>Sort Within Boxes</h3>
          <p className="auto-sort-hint">Drag to reorder priority. Toggle to enable/disable.</p>
          <div className="sort-field-list">
            {config.sortWithin.map((field, index) => (
              <div
                key={field.field}
                className={`sort-field-item ${dragIdx === index ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleFieldDragStart(index)}
                onDragOver={(e) => handleFieldDragOver(e, index)}
                onDragEnd={handleFieldDragEnd}
              >
                <span className="sort-field-handle">
                  <i className="fas fa-grip-vertical"></i>
                </span>
                <label className="sort-field-checkbox">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={() => handleSortFieldToggle(index)}
                  />
                  {SORT_FIELD_LABELS[field.field]}
                </label>
                <button
                  className={`button icon sm no-flex sort-direction-toggle ${!field.enabled ? 'disabled' : ''}`}
                  onClick={() => handleSortDirectionToggle(index)}
                  disabled={!field.enabled}
                  title={field.direction === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <i className={`fas fa-arrow-${field.direction === 'asc' ? 'up' : 'down'}`}></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {lockedBoxNumbers.size > 0 && (
          <div className="auto-sort-note">
            <i className="fas fa-lock"></i> {lockedBoxNumbers.size} locked box{lockedBoxNumbers.size > 1 ? 'es' : ''} will be preserved.
          </div>
        )}
      </div>

      <div className="auto-sort-actions">
        <button className="button secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
        <button className="button primary" onClick={handleApply} disabled={isLoading}>
          {isLoading ? (
            <><i className="fas fa-spinner fa-spin"></i> Sorting...</>
          ) : (
            <><i className="fas fa-sort"></i> Apply Sort</>
          )}
        </button>
      </div>
    </Modal>
  );
};
