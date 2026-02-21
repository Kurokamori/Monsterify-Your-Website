import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SearchBar } from '../common/SearchBar';
import { FormCheckbox } from '../common/FormCheckbox';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import api from '../../services/api';
import {
  getBerryDescription,
  getPastryDescription,
  berryRequiresSpeciesSelection,
  getSpeciesSlotAffected,
  canBerryBeUsedOnMonster,
  canPastryBeUsedOnMonster
} from '../../utils/itemHelpers';

// Types
export interface MassEditMonster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
}

interface BerrySelection {
  type: string;
  id: number;
}

interface PastrySelection {
  type: string;
  value: string;
  id: number;
}

interface MonsterEditData {
  newNickname: string;
  berries: BerrySelection[];
  pastries: PastrySelection[];
}

interface Operation {
  type: 'rename' | 'berry' | 'pastry';
  monsterId: number;
  monsterName: string;
  operationId: string;
  newName?: string;
  berryType?: string;
  pastryType?: string;
  value?: string;
}

interface OperationResult extends Operation {
  status: 'success' | 'error';
  message: string;
  beforeMonster?: MassEditMonster;
  updatedMonster?: MassEditMonster;
  newMonster?: MassEditMonster;
  beforeValue?: string;
  afterValue?: string;
  changeType?: 'name' | 'berry' | 'pastry';
  displayName?: string;
  needsSelection?: boolean;
}

interface TrainerInventory {
  berries: Record<string, number>;
  pastries: Record<string, number>;
}

interface SpeciesImages {
  [species: string]: { image_url?: string };
}

interface MassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsters: MassEditMonster[];
  trainerId: string | number;
  onComplete: (results: OperationResult[]) => void;
}

type Step = 'edit' | 'processing' | 'speciesSelection' | 'results';

/**
 * MassEditModal - Bulk monster editing modal
 * Supports renaming, berry usage, and pastry usage across multiple monsters
 */
export function MassEditModal({
  isOpen,
  onClose,
  monsters,
  trainerId,
  onComplete
}: MassEditModalProps) {
  // Step state
  const [step, setStep] = useState<Step>('edit');

  // Edit state
  const [editData, setEditData] = useState<Record<number, MonsterEditData>>({});
  const [trainerInventory, setTrainerInventory] = useState<TrainerInventory>({ berries: {}, pastries: {} });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [sortByLevel, setSortByLevel] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const [showOnlyWithoutImages, setShowOnlyWithoutImages] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [queuedOperations, setQueuedOperations] = useState<Operation[]>([]);
  const [processingResults, setProcessingResults] = useState<OperationResult[]>([]);

  // Species selection state
  const [pendingBerryOperations, setPendingBerryOperations] = useState<Operation[]>([]);
  const [rolledSpeciesForOperations, setRolledSpeciesForOperations] = useState<Record<string, string[]>>({});
  const [selectedSpeciesForOperations, setSelectedSpeciesForOperations] = useState<Record<string, string>>({});
  const [speciesImages, setSpeciesImages] = useState<SpeciesImages>({});

  // Filter monsters
  const filteredMonsters = useMemo(() => {
    let filtered = monsters.filter(monster => {
      if (!monster) return false;

      const nameMatch = !searchTerm || monster.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const speciesMatch = !speciesSearch || [monster.species1, monster.species2, monster.species3]
        .filter(Boolean)
        .some(species => species?.toLowerCase().includes(speciesSearch.toLowerCase()));

      const typeMatch = !typeSearch || [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
        .filter(Boolean)
        .some(type => type?.toLowerCase().includes(typeSearch.toLowerCase()));

      let imageMatch = true;
      if (showOnlyWithImages) {
        imageMatch = !!(monster.img_link && monster.img_link.trim() !== '');
      } else if (showOnlyWithoutImages) {
        imageMatch = !monster.img_link || monster.img_link.trim() === '';
      }

      return nameMatch && speciesMatch && typeMatch && imageMatch;
    });

    if (sortByLevel) {
      filtered = filtered.sort((a, b) => (b.level || 0) - (a.level || 0));
    }

    return filtered;
  }, [monsters, searchTerm, speciesSearch, typeSearch, sortByLevel, showOnlyWithImages, showOnlyWithoutImages]);

  // Calculate remaining berries taking into account selections
  const getRemainingBerries = useCallback(() => {
    const remaining = { ...trainerInventory.berries };

    Object.values(editData).forEach(monsterData => {
      monsterData.berries?.forEach(berry => {
        if (berry.type) {
          remaining[berry.type] = Math.max(0, (remaining[berry.type] || 0) - 1);
        }
      });
    });

    return remaining;
  }, [editData, trainerInventory.berries]);

  // Fetch trainer inventory
  useEffect(() => {
    const fetchTrainerInventory = async () => {
      if (!isOpen || !trainerId) return;

      try {
        const response = await api.get(`/trainers/${trainerId}/inventory`);
        if (response.data.success) {
          setTrainerInventory({
            berries: response.data.data.berries || {},
            pastries: response.data.data.pastries || {}
          });
        }
      } catch (error) {
        console.error('Error fetching trainer inventory:', error);
      }
    };

    fetchTrainerInventory();
  }, [isOpen, trainerId]);

  // Initialize edit data when modal opens
  useEffect(() => {
    if (isOpen && monsters.length > 0) {
      const initialData: Record<number, MonsterEditData> = {};
      monsters.forEach(monster => {
        initialData[monster.id] = {
          newNickname: monster.name || '',
          berries: [{ type: '', id: Date.now() + monster.id }],
          pastries: [{ type: '', value: '', id: Date.now() + monster.id + 1000 }]
        };
      });
      setEditData(initialData);
    }
  }, [isOpen, monsters]);

  // Update inventory after operations
  const updateInventoryAfterOperations = useCallback((results: OperationResult[]) => {
    const newInventory = { ...trainerInventory };

    results.forEach(result => {
      if (result.status !== 'success') return;

      if (result.type === 'berry' && result.berryType) {
        if (newInventory.berries[result.berryType] > 0) {
          newInventory.berries[result.berryType] -= 1;
        }
      } else if (result.type === 'pastry' && result.pastryType) {
        if (newInventory.pastries[result.pastryType] > 0) {
          newInventory.pastries[result.pastryType] -= 1;
        }
      }
    });

    setTrainerInventory(newInventory);
  }, [trainerInventory]);

  // Handle field changes
  const handleNicknameChange = useCallback((monsterId: number, newNickname: string) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: { ...prev[monsterId], newNickname }
    }));
  }, []);

  const handleBerryChange = useCallback((monsterId: number, berryIndex: number, berryType: string) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: prev[monsterId].berries.map((berry, index) =>
          index === berryIndex ? { ...berry, type: berryType } : berry
        )
      }
    }));
  }, []);

  const addBerryDropdown = useCallback((monsterId: number) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: [...prev[monsterId].berries, { type: '', id: Date.now() }]
      }
    }));
  }, []);

  const removeBerryDropdown = useCallback((monsterId: number, berryIndex: number) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: prev[monsterId].berries.filter((_, index) => index !== berryIndex)
      }
    }));
  }, []);

  const handlePastryChange = useCallback((monsterId: number, pastryIndex: number, pastryType: string) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.map((pastry, index) =>
          index === pastryIndex ? { ...pastry, type: pastryType } : pastry
        )
      }
    }));
  }, []);

  const handlePastryValueChange = useCallback((monsterId: number, pastryIndex: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.map((pastry, index) =>
          index === pastryIndex ? { ...pastry, value } : pastry
        )
      }
    }));
  }, []);

  const addPastryDropdown = useCallback((monsterId: number) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: [...prev[monsterId].pastries, { type: '', value: '', id: Date.now() }]
      }
    }));
  }, []);

  const removePastryDropdown = useCallback((monsterId: number, pastryIndex: number) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.filter((_, index) => index !== pastryIndex)
      }
    }));
  }, []);

  // Handle species selection
  const handleSpeciesSelection = useCallback((operationId: string, selectedSpecies: string) => {
    setSelectedSpeciesForOperations(prev => ({
      ...prev,
      [operationId]: selectedSpecies
    }));
  }, []);

  // Process all operations
  const handleSubmit = useCallback(async () => {
    setIsProcessing(true);
    setStep('processing');

    const operations: Operation[] = [];
    const results: OperationResult[] = [];

    // Collect all operations
    Object.entries(editData).forEach(([monsterId, data]) => {
      const monster = monsters.find(m => m.id === parseInt(monsterId));
      if (!monster) return;

      // Add pastry operations
      data.pastries.forEach((pastry, index) => {
        if (pastry.type && pastry.value) {
          operations.push({
            type: 'pastry',
            monsterId: parseInt(monsterId),
            monsterName: monster.name,
            pastryType: pastry.type,
            value: pastry.value,
            operationId: `${monsterId}-pastry-${index}`
          });
        }
      });

      // Add berry operations
      data.berries.forEach((berry, index) => {
        if (berry.type) {
          operations.push({
            type: 'berry',
            monsterId: parseInt(monsterId),
            monsterName: monster.name,
            berryType: berry.type,
            operationId: `${monsterId}-berry-${index}`
          });
        }
      });

      // Add rename operation
      if (data.newNickname && data.newNickname !== monster.name) {
        operations.push({
          type: 'rename',
          monsterId: parseInt(monsterId),
          monsterName: monster.name,
          newName: data.newNickname,
          operationId: `${monsterId}-rename`
        });
      }
    });

    setQueuedOperations(operations);

    // Track current monster states
    const currentMonsterStates: Record<number, MassEditMonster> = {};
    monsters.forEach(monster => {
      currentMonsterStates[monster.id] = { ...monster };
    });

    try {
      // Process renames
      const renameOps = operations.filter(op => op.type === 'rename');
      for (const op of renameOps) {
        try {
          const response = await api.put(`/monsters/${op.monsterId}`, { name: op.newName });

          if (response.data.success) {
            currentMonsterStates[op.monsterId] = {
              ...currentMonsterStates[op.monsterId],
              ...response.data.data,
              name: op.newName || ''
            };

            results.push({
              ...op,
              status: 'success',
              message: `Renamed ${op.monsterName} to ${op.newName}`,
              beforeValue: op.monsterName,
              afterValue: op.newName,
              changeType: 'name',
              updatedMonster: response.data.data
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to rename ${op.monsterName}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error renaming ${op.monsterName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Process pastries
      const pastryOps = operations.filter(op => op.type === 'pastry');
      for (const op of pastryOps) {
        try {
          const currentMonster = currentMonsterStates[op.monsterId];
          const currentName = currentMonster?.name || op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };

          const response = await api.post('/items/use-pastry', {
            monsterId: op.monsterId,
            pastryName: op.pastryType,
            trainerId,
            selectedValue: op.value
          });

          if (response.data.success) {
            currentMonsterStates[op.monsterId] = {
              ...currentMonsterStates[op.monsterId],
              ...response.data.monster
            };

            results.push({
              ...op,
              status: 'success',
              message: `Used ${op.pastryType} on ${currentName} (value: ${op.value})`,
              beforeMonster,
              afterValue: op.value,
              changeType: 'pastry',
              updatedMonster: response.data.monster,
              displayName: currentName
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.pastryType} on ${currentName}: ${response.data.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.pastryType}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Process berries
      const berryOps = operations.filter(op => op.type === 'berry');
      const berriesToSelectSpecies = berryOps.filter(op => op.berryType && berryRequiresSpeciesSelection(op.berryType));
      const regularBerryOps = berryOps.filter(op => !op.berryType || !berryRequiresSpeciesSelection(op.berryType));

      // Process regular berries
      for (const op of regularBerryOps) {
        try {
          const currentMonster = currentMonsterStates[op.monsterId];
          const currentName = currentMonster?.name || op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };

          const response = await api.post('/items/use-berry', {
            monsterId: op.monsterId,
            berryName: op.berryType,
            trainerId,
            speciesValue: null
          });

          if (response.data.success) {
            currentMonsterStates[op.monsterId] = {
              ...currentMonsterStates[op.monsterId],
              ...response.data.monster
            };

            let message = `Used ${op.berryType} on ${currentName}`;
            let newMonster: MassEditMonster | undefined;

            if (op.berryType === 'Divest Berry' && response.data.newMonster) {
              newMonster = response.data.newMonster;
              message = `Used ${op.berryType} on ${currentName} - created new monster "${response.data.newMonster.name}"`;
            }

            results.push({
              ...op,
              status: 'success',
              message,
              needsSelection: response.data.needsSelection || false,
              beforeMonster,
              changeType: 'berry',
              updatedMonster: response.data.monster,
              newMonster,
              displayName: currentName
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.berryType} on ${currentName}: ${response.data.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.berryType}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Handle species berries
      if (berriesToSelectSpecies.length > 0) {
        setPendingBerryOperations(berriesToSelectSpecies);

        try {
          const rolledSpeciesMap: Record<string, string[]> = {};
          const allSpecies = new Set<string>();

          for (const op of berriesToSelectSpecies) {
            const response = await api.post('/species/roll', { count: 10 });
            rolledSpeciesMap[op.operationId] = response.data.species || [];
            response.data.species?.forEach((species: string) => allSpecies.add(species));
          }

          setRolledSpeciesForOperations(rolledSpeciesMap);

          // Fetch species images
          if (allSpecies.size > 0) {
            try {
              const imagesResponse = await api.post('/species/images', { species: Array.from(allSpecies) });
              if (imagesResponse.data.success) {
                setSpeciesImages(imagesResponse.data.speciesImages);
              }
            } catch (error) {
              console.error('Error fetching species images:', error);
            }
          }

          setProcessingResults(results);
          updateInventoryAfterOperations(results);
          setStep('speciesSelection');
          return;
        } catch (error) {
          console.error('Error rolling species:', error);
          berriesToSelectSpecies.forEach(op => {
            results.push({
              ...op,
              status: 'error',
              message: `Error rolling species for ${op.berryType}: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          });
        }
      }

      setProcessingResults(results);
      updateInventoryAfterOperations(results);
      setStep('results');
    } catch (error) {
      console.error('Mass edit processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [editData, monsters, trainerId, updateInventoryAfterOperations]);

  // Complete species berry processing
  const completeSpeciesBerryProcessing = useCallback(async () => {
    setStep('processing');

    try {
      const results = [...processingResults];

      // Rebuild current monster states
      const currentMonsterStates: Record<number, MassEditMonster> = {};
      monsters.forEach(monster => {
        currentMonsterStates[monster.id] = { ...monster };
      });

      // Apply previous updates
      results.forEach(result => {
        if (result.status === 'success' && result.updatedMonster) {
          currentMonsterStates[result.monsterId] = { ...result.updatedMonster };
        }
      });

      // Process species berries
      for (const op of pendingBerryOperations) {
        const selectedSpecies = selectedSpeciesForOperations[op.operationId];
        if (!selectedSpecies) {
          results.push({
            ...op,
            status: 'error',
            message: `No species selected for ${op.berryType} on ${op.monsterName}`
          });
          continue;
        }

        try {
          const currentMonster = currentMonsterStates[op.monsterId];
          const currentName = currentMonster?.name || op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };

          const response = await api.post('/items/use-berry', {
            monsterId: op.monsterId,
            berryName: op.berryType,
            trainerId,
            speciesValue: selectedSpecies
          });

          if (response.data.success) {
            currentMonsterStates[op.monsterId] = {
              ...currentMonsterStates[op.monsterId],
              ...response.data.monster
            };

            let message = `Used ${op.berryType} on ${currentName} (selected: ${selectedSpecies})`;
            let newMonster: MassEditMonster | undefined;

            if (op.berryType === 'Divest Berry' && response.data.newMonster) {
              newMonster = response.data.newMonster;
              message = `Used ${op.berryType} on ${currentName} - created new monster "${response.data.newMonster.name}"`;
            }

            results.push({
              ...op,
              status: 'success',
              message,
              beforeMonster,
              changeType: 'berry',
              updatedMonster: response.data.monster,
              newMonster,
              displayName: currentName
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.berryType} on ${currentName}: ${response.data.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.berryType}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      setProcessingResults(results);
      updateInventoryAfterOperations(results);
      setStep('results');
    } catch (error) {
      console.error('Error completing species berry processing:', error);
    } finally {
      setIsProcessing(false);
      setPendingBerryOperations([]);
      setSelectedSpeciesForOperations({});
      setRolledSpeciesForOperations({});
      setSpeciesImages({});
    }
  }, [monsters, pendingBerryOperations, processingResults, selectedSpeciesForOperations, trainerId, updateInventoryAfterOperations]);

  // Handle close
  const handleClose = useCallback(() => {
    if (step === 'results') {
      onComplete(processingResults);
    }
    onClose();

    // Reset state
    setStep('edit');
    setEditData({});
    setQueuedOperations([]);
    setProcessingResults([]);
    setPendingBerryOperations([]);
    setSelectedSpeciesForOperations({});
    setRolledSpeciesForOperations({});
    setSpeciesImages({});
    setSearchTerm('');
    setSpeciesSearch('');
    setTypeSearch('');
    setSortByLevel(false);
    setShowOnlyWithImages(false);
    setShowOnlyWithoutImages(false);
  }, [step, processingResults, onComplete, onClose]);

  // Render edit step
  const renderEditStep = () => {
    const remainingBerries = getRemainingBerries();

    return (
      <div className="mass-edit-content">
        <div className="info-box mb-md">
          <p>Edit your monsters in bulk. You can:</p>
          <ul>
            <li>Rename monsters (guaranteed)</li>
            <li>Use pastries from your inventory (guaranteed with value selection)</li>
            <li>Use berries from your inventory (may require species selection after rolling)</li>
          </ul>
        </div>

        <div className="form-stack gap-sm mb-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name..."
          />

          <div className="form-grid cols-2">
            <SearchBar
              value={speciesSearch}
              onChange={setSpeciesSearch}
              placeholder="Search by species..."
            />
            <SearchBar
              value={typeSearch}
              onChange={setTypeSearch}
              placeholder="Search by type..."
            />
          </div>

          <div className="form-row form-row--lg gap-md">
            <FormCheckbox
              name="sortByLevel"
              label="Sort by level (highest first)"
              checked={sortByLevel}
              onChange={(e) => setSortByLevel(e.target.checked)}
            />
            <FormCheckbox
              name="showWithImages"
              label="Only with images"
              checked={showOnlyWithImages}
              onChange={(e) => {
                setShowOnlyWithImages(e.target.checked);
                if (e.target.checked) setShowOnlyWithoutImages(false);
              }}
            />
            <FormCheckbox
              name="showWithoutImages"
              label="Only without images"
              checked={showOnlyWithoutImages}
              onChange={(e) => {
                setShowOnlyWithoutImages(e.target.checked);
                if (e.target.checked) setShowOnlyWithImages(false);
              }}
            />
          </div>
        </div>

        <div className="data-grid data-grid--lg gap-md">
          {filteredMonsters.map(monster => (
            <div key={monster.id} className="card">
              <div className="card__content">
                <div className="flex gap-sm mb-sm">
                  <img
                    src={monster.img_link || '/images/default_mon.png'}
                    alt={monster.name}
                    className="image-container small"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default_mon.png';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="card__title">{monster.name}</h4>
                    <p className="text-muted text-sm">
                      {monster.species1}
                      {monster.species2 && ` + ${monster.species2}`}
                      {monster.species3 && ` + ${monster.species3}`}
                      {' - Level '}{monster.level}
                    </p>
                    <div className="container vertical center gap-small">
                    <div className="badge-group badge-group--gap-sm badge-group--sm mt-xxs badge-group--wrap">
                      {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
                        .filter(Boolean)
                        .map((type, idx) => (
                          <TypeBadge key={idx} type={type!} size="sm" />
                        ))}
                    </div>
                    {monster.attribute && (
                      <AttributeBadge attribute={monster.attribute} size="sm" />
                    )}
                  </div>
                  </div>
                </div>

                <div className="form-stack gap-xs">
                  <div className="form-group form-group--no-padding">
                    <label className="form-label">Rename:</label>
                    <input
                      type="text"
                      value={editData[monster.id]?.newNickname || ''}
                      onChange={(e) => handleNicknameChange(monster.id, e.target.value)}
                      placeholder={monster.name}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group form-group--no-padding">
                    <div className="flex justify-between align-center mb-xxs">
                      <label className="form-label">Berries:</label>
                      <button
                        type="button"
                        onClick={() => addBerryDropdown(monster.id)}
                        className="button xs secondary no-flex"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    {editData[monster.id]?.berries.map((berry, index) => (
                      <div key={berry.id} className="flex gap-xs mb-xxs">
                        <select
                          value={berry.type}
                          onChange={(e) => handleBerryChange(monster.id, index, e.target.value)}
                          className="form-input flex-1"
                        >
                          <option value="">Select berry</option>
                          {Object.entries(trainerInventory.berries).map(([berryType, originalCount]) => {
                            const remainingCount = remainingBerries[berryType] || 0;
                            const isCurrentlySelected = berry.type === berryType;
                            const canSelect = remainingCount > 0 || isCurrentlySelected;
                            const canUseOnMonster = canBerryBeUsedOnMonster(berryType, monster);
                            const isNotValid = berry.type != 'Edenwiess' && berry.type != 'Forget-Me-Not' && berry.type != 'Edenweiss' && berry.type != 'Forget-me-Not';

                            if (originalCount > 0 && canSelect && canUseOnMonster && isNotValid) {
                              return (
                                <option key={berryType} value={berryType} title={getBerryDescription(berryType)}>
                                  {berryType} (x{remainingCount + (isCurrentlySelected ? 1 : 0)}) - {getBerryDescription(berryType)}
                                </option>
                              );
                            }
                            return null;
                          })}
                        </select>
                        {editData[monster.id].berries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBerryDropdown(monster.id, index)}
                            className="button xs danger no-flex"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="form-group form-group--no-padding">
                    <div className="flex justify-between align-center mb-xxs">
                      <label className="form-label">Pastries:</label>
                      <button
                        type="button"
                        onClick={() => addPastryDropdown(monster.id)}
                        className="button xs secondary no-flex"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    {editData[monster.id]?.pastries.map((pastry, index) => (
                      <div key={pastry.id} className="flex gap-xs mb-xxs flex-col">
                        <select
                          value={pastry.type}
                          onChange={(e) => handlePastryChange(monster.id, index, e.target.value)}
                          className="form-input flex-1"
                        >
                          <option value="">Select pastry</option>
                          {Object.entries(trainerInventory.pastries).map(([pastryType, count]) => {
                            const canUseOnMonster = canPastryBeUsedOnMonster(pastryType, monster);
                            if (count > 0 && canUseOnMonster) {
                              return (
                                <option key={pastryType} value={pastryType} title={getPastryDescription(pastryType)}>
                                  {pastryType} (x{count}) - {getPastryDescription(pastryType)}
                                </option>
                              );
                            }
                            return null;
                          })}
                        </select>
                        {pastry.type && (
                          <input
                            type="text"
                            placeholder="Enter value"
                            value={pastry.value}
                            onChange={(e) => handlePastryValueChange(monster.id, index, e.target.value)}
                            className="form-input flex-1"
                          />
                        )}
                        {editData[monster.id].pastries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePastryDropdown(monster.id, index)}
                            className="button xs danger no-flex"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render processing step
  const renderProcessingStep = () => (
    <div className="flex flex-col align-center justify-center" style={{ minHeight: '200px' }}>
      <LoadingSpinner />
      <h3 className="mt-md">Processing your changes...</h3>
      <p className="text-muted">Processing {queuedOperations.length} operations...</p>
    </div>
  );

  // Render species selection step
  const renderSpeciesSelectionStep = () => (
    <div className="mass-edit-content">
      <p className="mb-md">Some berries require species selection. Please select a species for each berry operation:</p>

      {pendingBerryOperations.map((op) => {
        const monster = monsters.find(m => m.id === op.monsterId);
        const speciesSlot = getSpeciesSlotAffected(op.berryType || '');
        const availableSpecies = rolledSpeciesForOperations[op.operationId] || [];

        return (
          <div key={op.operationId} className="card mb-md">
            <div className="card__content">
              <div className="flex gap-md mb-md">
                <div className="flex gap-md align-center">
                  <img
                    src={monster?.img_link || '/images/default_mon.png'}
                    alt={monster?.name || 'Monster'}
                    className="image-container small"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default_mon.png';
                    }}
                  />
                  <div>
                    <div className="flex gap-xs flex-col">
                    <h4>{monster?.name || op.monsterName}</h4>
                    <div className="badge-group badge-group--sm gap-xs">
                      <span className={`badge ${speciesSlot === 1 ? 'badge--accent' : ''}`}>
                        {monster?.species1 || 'None'}
                      </span>
                      {monster?.species2 && (
                        <span className={`badge ${speciesSlot === 2 ? 'badge--accent' : ''}`}>
                          {monster.species2}
                        </span>
                      )}
                      {monster?.species3 && (
                        <span className={`badge ${speciesSlot === 3 ? 'badge--accent' : ''}`}>
                          {monster.species3}
                        </span>
                      )}
                    </div>
                    <div className="badge-group badge-group--sm gap-xs">
                      {[monster?.type1, monster?.type2, monster?.type3, monster?.type4, monster?.type5]
                        .filter(Boolean)
                        .map((type, idx) => (
                          <TypeBadge key={idx} type={type!} size="sm" />
                        ))}
                    </div>
                    {monster?.attribute && (
                      <AttributeBadge attribute={monster.attribute} size="sm" />
                    )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4>{op.berryType}</h4>
                  <p className="text-muted text-sm">{getBerryDescription(op.berryType || '')}</p>
                  <p className="text-sm"><strong>Affecting:</strong> Species {speciesSlot}</p>
                </div>
              </div>

              <div className="data-grid data-grid--sm gap-xs">
                {availableSpecies.map((species, index) => {
                  const speciesImage = speciesImages[species];
                  const isSelected = selectedSpeciesForOperations[op.operationId] === species;

                  return (
                    <button
                      key={index}
                      className={`card card--interactive ${isSelected ? 'card--selected' : ''}`}
                      onClick={() => handleSpeciesSelection(op.operationId, species)}
                    >
                      {speciesImage?.image_url && (
                        <img
                          src={speciesImage.image_url}
                          alt={species}
                          className="image-container small"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-sm text-standard">{species}</span>
                    </button>
                  );
                })}
              </div>

              {selectedSpeciesForOperations[op.operationId] && (
                <p className="mt-sm text-success">
                  <strong>Selected:</strong> {selectedSpeciesForOperations[op.operationId]}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render results step
  const renderResultsStep = () => {
    const successCount = processingResults.filter(r => r.status === 'success').length;
    const errorCount = processingResults.filter(r => r.status === 'error').length;

    return (
      <div className="mass-edit-content">
        <h3 className="mb-sm">Mass Edit Complete</h3>
        <div className="mb-md">
          <p className="text-success">{successCount} operations completed successfully</p>
          {errorCount > 0 && <p className="text-danger">{errorCount} operations failed</p>}
        </div>

        <div className="form-stack gap-sm">
          {processingResults.map((result, index) => (
            <div
              key={index}
              className={`card ${result.status === 'success' ? 'card--success' : 'card--danger'}`}
            >
              <div className="card__content">
                <div className="flex gap-sm align-center">
                  <i className={`fas ${result.status === 'success' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`}></i>
                  <div className="flex-1">
                    <h4>{result.displayName || result.monsterName}</h4>
                    <p className="text-sm text-muted">{result.message}</p>
                  </div>
                </div>

                {result.status === 'success' && result.updatedMonster && (
                  <div className="flex gap-md mt-sm">
                    {result.beforeMonster && (
                      <div className="flex-1 flex flex-col gap-xs">
                        <h3 className="text-sm mb-xxs">Before</h3>
                        <p className="mt-xxs">
                          {[result.beforeMonster.species1, result.beforeMonster.species2, result.beforeMonster.species3]
                            .filter(Boolean)
                            .join(' + ')}
                        </p>
                        <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                          {[result.beforeMonster.type1, result.beforeMonster.type2, result.beforeMonster.type3,
                            result.beforeMonster.type4, result.beforeMonster.type5]
                            .filter(Boolean)
                            .map((type, idx) => (
                              <TypeBadge key={idx} type={type!} size="sm" />
                            ))}
                        </div>
                        {result.beforeMonster.attribute && (
                          <AttributeBadge attribute={result.beforeMonster.attribute} size="sm" />
                        )}
                      </div>
                    )}
                    <div className="flex align-center">
                      <i className="fas fa-arrow-right text-muted"></i>
                    </div>
                    <div className="flex-1 flex flex-col gap-xs">
                      <h3 className="text-sm mb-xxs">After</h3>
                      <p className="mt-xxs">
                        {[result.updatedMonster.species1, result.updatedMonster.species2, result.updatedMonster.species3]
                          .filter(Boolean)
                          .join(' + ')}
                      </p>
                      <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                        {[result.updatedMonster.type1, result.updatedMonster.type2, result.updatedMonster.type3,
                          result.updatedMonster.type4, result.updatedMonster.type5]
                          .filter(Boolean)
                          .map((type, idx) => (
                            <TypeBadge key={idx} type={type!} size="sm" />
                          ))}
                      </div>
                      {result.updatedMonster.attribute && (
                        <AttributeBadge attribute={result.updatedMonster.attribute} size="sm" />
                      )}
                    </div>
                  </div>
                )}

                {result.newMonster && (
                  <div className="mt-sm p-sm bg-success-subtle border-radius">
                    <h5 className="text-sm mb-xxs">New Monster Created!</h5>
                    <p className="text-sm"><strong>{result.newMonster.name}</strong></p>
                    <div className="badge-group badge-group--sm">
                      {[result.newMonster.species1, result.newMonster.species2, result.newMonster.species3]
                        .filter(Boolean)
                        .map((species, idx) => (
                          <span key={idx} className="badge">{species}</span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render footer based on step
  const renderFooter = () => {
    if (step === 'processing') return null;

    return (
      <ActionButtonGroup align="end" gap="sm">
        {step === 'edit' && (
          <>
            <button type="button" className="button secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={handleSubmit} disabled={isProcessing}>
              Process All Changes
            </button>
          </>
        )}
        {step === 'speciesSelection' && (
          <>
            <button type="button" className="button secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={completeSpeciesBerryProcessing}
              disabled={pendingBerryOperations.some(op => !selectedSpeciesForOperations[op.operationId])}
            >
              Apply Selected Species
            </button>
          </>
        )}
        {step === 'results' && (
          <button type="button" className="button primary" onClick={handleClose}>
            Close
          </button>
        )}
      </ActionButtonGroup>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mass Edit Monsters"
      size="xlarge"
      footer={renderFooter()}
      closeOnOverlayClick={false}
    >
      {step === 'edit' && renderEditStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'speciesSelection' && renderSpeciesSelectionStep()}
      {step === 'results' && renderResultsStep()}
    </Modal>
  );
}

export default MassEditModal;
