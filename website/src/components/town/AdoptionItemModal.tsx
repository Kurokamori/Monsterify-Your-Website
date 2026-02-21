import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { TabContainer } from '../common/TabContainer';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import api from '../../services/api';
import { itemsService } from '../../services';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';
import { extractErrorMessage } from '../../utils/errorUtils';
import {
  getBerryDescription,
  getPastryDescription,
  berryRequiresSpeciesSelection,
  getSpeciesSlotAffected,
  canBerryBeUsedOnMonster,
  canPastryBeUsedOnMonster,
  getPastryValueType,
  AVAILABLE_TYPES,
  AVAILABLE_ATTRIBUTES,
  BERRY_CATEGORIES,
  PASTRY_CATEGORIES
} from '../../utils/itemHelpers';
import type { Monster } from '../common/MonsterDetails';
import type { TrainerInventory, QueuedItem, SpeciesImagesMap } from './types';

const EXCLUDED_BERRIES = ['Forget-Me-Not', 'Forget-me-Not', 'Edenwiess', 'Edenweiss'];

interface AdoptionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster: Monster;
  trainerId: string | number;
  trainerInventory: TrainerInventory;
  onComplete?: (updatedMonster: Monster) => void;
}

type ModalStep = 'selection' | 'valueSelection' | 'processing' | 'speciesSelection' | 'result';

interface ItemOperationResult {
  id: number;
  type: 'berry' | 'pastry';
  itemName: string;
  success: boolean;
  message: string;
  beforeMonster?: Monster;
  afterMonster?: Monster;
  newMonster?: Monster;
}

/**
 * AdoptionItemModal - Use berries and pastries on a newly adopted monster
 * Features multi-step workflow with item queuing and species selection
 */
export function AdoptionItemModal({
  isOpen,
  onClose,
  monster,
  trainerId,
  trainerInventory,
  onComplete
}: AdoptionItemModalProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<ModalStep>('selection');

  // Monster state (tracks updates through operations)
  const [currentMonster, setCurrentMonster] = useState<Monster>(monster);
  const [originalMonster] = useState<Monster>(monster);

  // Inventory state (tracks remaining items)
  const [inventory, setInventory] = useState<TrainerInventory>(trainerInventory);

  // Queue state
  const [itemQueue, setItemQueue] = useState<QueuedItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  // Processing state
  const [, setProcessing] = useState(false);
  const [results, setResults] = useState<ItemOperationResult[]>([]);

  // Value selection state (for pastries)
  const [pendingPastry, setPendingPastry] = useState<QueuedItem | null>(null);
  const [pastryValue, setPastryValue] = useState('');

  // Species selection state
  const [pendingSpeciesItem, setPendingSpeciesItem] = useState<QueuedItem | null>(null);
  const [rolledSpecies, setRolledSpecies] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [speciesImages, setSpeciesImages] = useState<SpeciesImagesMap>({});

  // Tab state
  const [activeTab, setActiveTab] = useState('berries');
  const [berryCategory, setBerryCategory] = useState<string>('all');
  const [pastryCategory, setPastryCategory] = useState<string>('all');

  // Item image state
  const [berryImages, setBerryImages] = useState<Record<string, string | null>>({});
  const [pastryImages, setPastryImages] = useState<Record<string, string | null>>({});

  // Fetch item images on mount
  useEffect(() => {
    itemsService.getBerryItems().then(res => {
      if (res.success) setBerryImages(res.berryImages);
    }).catch(() => {});
    itemsService.getPastryItems().then(res => {
      if (res.success) setPastryImages(res.berryImages);
    }).catch(() => {});
  }, []);

  // Reset state when monster changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMonster(monster);
      setInventory(trainerInventory);
      setItemQueue([]);
      setResults([]);
      setCurrentStep('selection');
      setCurrentQueueIndex(0);
    }
  }, [isOpen, monster, trainerInventory]);

  // Filter berries by category and usability
  const filteredBerries = useMemo(() => {
    const berries = Object.entries(inventory.berries)
      .filter(([name, count]) => count > 0 && !EXCLUDED_BERRIES.includes(name) && canBerryBeUsedOnMonster(name, currentMonster));

    if (berryCategory === 'all') return berries;

    const categoryBerries: readonly string[] = BERRY_CATEGORIES[berryCategory as keyof typeof BERRY_CATEGORIES] || [];
    return berries.filter(([name]) => categoryBerries.includes(name));
  }, [inventory.berries, currentMonster, berryCategory]);

  // Filter pastries by category and usability
  const filteredPastries = useMemo(() => {
    const pastries = Object.entries(inventory.pastries)
      .filter(([name, count]) => count > 0 && canPastryBeUsedOnMonster(name, currentMonster));

    if (pastryCategory === 'all') return pastries;

    const categoryPastries: readonly string[] = PASTRY_CATEGORIES[pastryCategory as keyof typeof PASTRY_CATEGORIES] || [];
    return pastries.filter(([name]) => categoryPastries.includes(name));
  }, [inventory.pastries, currentMonster, pastryCategory]);

  // Add item to queue
  const addToQueue = useCallback((type: 'berry' | 'pastry', itemName: string) => {
    // Check if pastry needs value selection
    if (type === 'pastry') {
      const valueType = getPastryValueType(itemName);
      if (valueType !== 'none') {
        setPendingPastry({
          id: Date.now(),
          type,
          itemName,
          value: ''
        });
        setCurrentStep('valueSelection');
        return;
      }
    }

    // Add directly to queue
    setItemQueue(prev => [...prev, {
      id: Date.now(),
      type,
      itemName,
      value: undefined
    }]);

    // Update inventory count
    if (type === 'berry') {
      setInventory(prev => ({
        ...prev,
        berries: {
          ...prev.berries,
          [itemName]: Math.max(0, (prev.berries[itemName] || 0) - 1)
        }
      }));
    } else {
      setInventory(prev => ({
        ...prev,
        pastries: {
          ...prev.pastries,
          [itemName]: Math.max(0, (prev.pastries[itemName] || 0) - 1)
        }
      }));
    }
  }, []);

  // Confirm pastry value
  const confirmPastryValue = useCallback(() => {
    if (!pendingPastry || !pastryValue) return;

    setItemQueue(prev => [...prev, {
      ...pendingPastry,
      value: pastryValue
    }]);

    // Update inventory
    setInventory(prev => ({
      ...prev,
      pastries: {
        ...prev.pastries,
        [pendingPastry.itemName]: Math.max(0, (prev.pastries[pendingPastry.itemName] || 0) - 1)
      }
    }));

    setPendingPastry(null);
    setPastryValue('');
    setCurrentStep('selection');
  }, [pendingPastry, pastryValue]);

  // Remove item from queue
  const removeFromQueue = useCallback((id: number) => {
    const item = itemQueue.find(i => i.id === id);
    if (!item) return;

    setItemQueue(prev => prev.filter(i => i.id !== id));

    // Restore inventory count
    if (item.type === 'berry') {
      setInventory(prev => ({
        ...prev,
        berries: {
          ...prev.berries,
          [item.itemName]: (prev.berries[item.itemName] || 0) + 1
        }
      }));
    } else {
      setInventory(prev => ({
        ...prev,
        pastries: {
          ...prev.pastries,
          [item.itemName]: (prev.pastries[item.itemName] || 0) + 1
        }
      }));
    }
  }, [itemQueue]);

  // Process queue
  const processQueue = useCallback(async () => {
    setProcessing(true);
    setCurrentStep('processing');
    setResults([]);
    setCurrentQueueIndex(0);

    let monster = currentMonster;
    const newResults: ItemOperationResult[] = [];

    for (let i = 0; i < itemQueue.length; i++) {
      setCurrentQueueIndex(i);
      const item = itemQueue[i];
      const beforeMonster = { ...monster };

      try {
        // Check if berry needs species selection
        if (item.type === 'berry' && berryRequiresSpeciesSelection(item.itemName)) {
          // Roll species
          const rollResponse = await api.post('/species/roll', { count: 10 });
          const species = rollResponse.data.species || [];

          if (species.length > 0) {
            // Fetch species images
            try {
              const imagesResponse = await api.post('/species/images', { species });
              if (imagesResponse.data.success) {
                setSpeciesImages(imagesResponse.data.speciesImages || {});
              }
            } catch (err) {
              console.error('Error fetching species images:', err);
            }

            setRolledSpecies(species);
            setPendingSpeciesItem(item);
            setCurrentStep('speciesSelection');
            setProcessing(false);
            return; // Wait for user selection
          }
        }

        // Process item
        let response;
        if (item.type === 'berry') {
          response = await api.post('/items/use-berry', {
            monsterId: monster.id,
            berryName: item.itemName,
            trainerId,
            speciesValue: item.selectedSpecies || null
          });
        } else {
          response = await api.post('/items/use-pastry', {
            monsterId: monster.id,
            pastryName: item.itemName,
            trainerId,
            selectedValue: item.value
          });
        }

        if (response.data.success) {
          monster = response.data.monster;
          setCurrentMonster(monster);

          newResults.push({
            id: item.id,
            type: item.type,
            itemName: item.itemName,
            success: true,
            message: `Successfully used ${item.itemName}`,
            beforeMonster,
            afterMonster: response.data.monster,
            newMonster: response.data.newMonster
          });
        } else {
          newResults.push({
            id: item.id,
            type: item.type,
            itemName: item.itemName,
            success: false,
            message: response.data.message || `Failed to use ${item.itemName}`,
            beforeMonster
          });
        }
      } catch (err) {
        newResults.push({
          id: item.id,
          type: item.type,
          itemName: item.itemName,
          success: false,
          message: extractErrorMessage(err, `Error using ${item.itemName}`),
          beforeMonster
        });
      }
    }

    setResults(newResults);
    setProcessing(false);
    setCurrentStep('result');
    setItemQueue([]);
  }, [itemQueue, currentMonster, trainerId]);

  // Continue processing after species selection
  const continueAfterSpeciesSelection = useCallback(async () => {
    if (!pendingSpeciesItem || !selectedSpecies) return;

    setProcessing(true);
    setCurrentStep('processing');

    const beforeMonster = { ...currentMonster };
    const newResults = [...results];

    try {
      const response = await api.post('/items/use-berry', {
        monsterId: currentMonster.id,
        berryName: pendingSpeciesItem.itemName,
        trainerId,
        speciesValue: selectedSpecies
      });

      if (response.data.success) {
        setCurrentMonster(response.data.monster);

        newResults.push({
          id: pendingSpeciesItem.id,
          type: 'berry',
          itemName: pendingSpeciesItem.itemName,
          success: true,
          message: `Successfully used ${pendingSpeciesItem.itemName} (${selectedSpecies})`,
          beforeMonster,
          afterMonster: response.data.monster,
          newMonster: response.data.newMonster
        });
      } else {
        newResults.push({
          id: pendingSpeciesItem.id,
          type: 'berry',
          itemName: pendingSpeciesItem.itemName,
          success: false,
          message: response.data.message || `Failed to use ${pendingSpeciesItem.itemName}`
        });
      }
    } catch (err) {
      newResults.push({
        id: pendingSpeciesItem.id,
        type: 'berry',
        itemName: pendingSpeciesItem.itemName,
        success: false,
        message: extractErrorMessage(err, `Error using ${pendingSpeciesItem.itemName}`)
      });
    }

    setResults(newResults);

    // Clear species selection state
    setPendingSpeciesItem(null);
    setSelectedSpecies('');
    setRolledSpecies([]);
    setSpeciesImages({});

    // Continue processing remaining items
    const remainingItems = itemQueue.slice(currentQueueIndex + 1);
    if (remainingItems.length > 0) {
      setItemQueue(remainingItems);
      setCurrentQueueIndex(0);
      processQueue();
    } else {
      setProcessing(false);
      setCurrentStep('result');
      setItemQueue([]);
    }
  }, [pendingSpeciesItem, selectedSpecies, currentMonster, trainerId, results, itemQueue, currentQueueIndex, processQueue]);

  // Handle close
  const handleClose = useCallback(() => {
    if (onComplete && currentMonster !== originalMonster) {
      onComplete(currentMonster);
    }
    onClose();
  }, [currentMonster, originalMonster, onComplete, onClose]);

  // Get pastry value options
  const getPastryValueOptions = (pastryName: string): string[] => {
    const valueType = getPastryValueType(pastryName);
    if (valueType === 'type') return [...AVAILABLE_TYPES];
    if (valueType === 'attribute') return [...AVAILABLE_ATTRIBUTES];
    return [];
  };

  // Render selection step
  const renderSelectionStep = () => (
    <div className="item-selection">
      {/* Monster preview */}
      <Card className="mb-md">
        <div className="card__content flex gap-md">
          <div className="flex-1 flex flex-col gap-xs">
            <h3>{currentMonster.name || 'Monster'}</h3>
            <p className="text-muted">
              {[currentMonster.species1, currentMonster.species2, currentMonster.species3]
                .filter(Boolean)
                .join(' + ')}
            </p>
            <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
              {[currentMonster.type1, currentMonster.type2, currentMonster.type3,
                currentMonster.type4, currentMonster.type5]
                .filter(Boolean)
                .map((type, idx) => (
                  <TypeBadge key={idx} type={type!} size="sm" />
                ))}
            </div>
            {currentMonster.attribute && (
              <AttributeBadge attribute={currentMonster.attribute} size="sm" />
            )}
          </div>
        </div>
      </Card>

      {/* Item tabs */}
      <TabContainer
        tabs={[
          {
            key: 'berries',
            label: 'Berries',
            icon: 'fas fa-apple-alt',
            content: (
              <div className="flex flex-col gap-sm">
                <div className="category-filter mb-sm">
                  <select
                    value={berryCategory}
                    onChange={(e) => setBerryCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">All Berries</option>
                    <option value="species">Species</option>
                    <option value="type">Type</option>
                    <option value="randomize">Randomize</option>
                    <option value="add">Add</option>
                    <option value="remove">Remove</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                {filteredBerries.length === 0 ? (
                  <p className="text-muted text-center">No usable berries available.</p>
                ) : (
                  <div className="shop-item-list">
                    {filteredBerries.map(([name, count]) => {
                      const queuedCount = itemQueue.filter(i => i.itemName === name && i.type === 'berry').length;
                      return (
                        <button
                          key={name}
                          className="button vertical item-button"
                          onClick={() => addToQueue('berry', name)}
                          disabled={count <= 0}
                        >
                          <div className="item-button__image-container">
                            <img
                              src={berryImages[name] || getItemImageUrl({ name })}
                              alt={name}
                              className="item-button__image"
                              onError={(e) => handleItemImageError(e, 'berry')}
                            />
                          </div>
                          <span className="item-button__name">{name}</span>
                          <span className="item-button__desc">{getBerryDescription(name)}</span>
                          <span className="item-button__count">x{count}</span>
                          {queuedCount > 0 && (
                            <span className="badge info">+{queuedCount} queued</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'pastries',
            label: 'Pastries',
            icon: 'fas fa-cookie',
            content: (
              <div className="flex flex-col gap-sm">
                <div className="category-filter mb-sm">
                  <select
                    value={pastryCategory}
                    onChange={(e) => setPastryCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">All Pastries</option>
                    <option value="species">Species</option>
                    <option value="type">Type</option>
                    <option value="set">Set</option>
                    <option value="add">Add</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                {filteredPastries.length === 0 ? (
                  <p className="text-muted text-center">No usable pastries available.</p>
                ) : (
                  <div className="shop-item-list">
                    {filteredPastries.map(([name, count]) => {
                      const queuedCount = itemQueue.filter(i => i.itemName === name && i.type === 'pastry').length;
                      return (
                        <button
                          key={name}
                          className="button vertical item-button"
                          onClick={() => addToQueue('pastry', name)}
                          disabled={count <= 0}
                        >
                          <div className="item-button__image-container">
                            <img
                              src={pastryImages[name] || getItemImageUrl({ name })}
                              alt={name}
                              className="item-button__image"
                              onError={(e) => handleItemImageError(e, 'pastry')}
                            />
                          </div>
                          <span className="item-button__name">{name}</span>
                          <span className="item-button__desc">{getPastryDescription(name)}</span>
                          <span className="item-button__count">x{count}</span>
                          {queuedCount > 0 && (
                            <span className="badge info">+{queuedCount} queued</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />

      {/* Queue */}
      {itemQueue.length > 0 && (
        <div className="item-queue mt-md">
          <h4 className="mb-xs">Queue ({itemQueue.length} items)</h4>
          <div className="form-stack gap-xxs">
            {itemQueue.map((item, idx) => (
              <div key={item.id} className="flex justify-between align-center p-xs bg-secondary-hover border-radius">
                <span>
                  {idx + 1}. {item.itemName}
                  {item.value && <span className="text-muted"> ({item.value})</span>}
                </span>
                <button
                  className="button xs danger no-flex"
                  onClick={() => removeFromQueue(item.id)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <ActionButtonGroup align="end" className="mt-sm">
            <button className="button primary" onClick={processQueue}>
              <i className="fas fa-play"></i> Process Queue
            </button>
          </ActionButtonGroup>
        </div>
      )}
    </div>
  );

  // Render value selection step
  const renderValueSelectionStep = () => {
    if (!pendingPastry) return null;

    const valueType = getPastryValueType(pendingPastry.itemName);
    const options = getPastryValueOptions(pendingPastry.itemName);

    return (
      <div className="value-selection">
        <h3 className="mb-sm">Select Value for {pendingPastry.itemName}</h3>
        <p className="text-muted mb-md">{getPastryDescription(pendingPastry.itemName)}</p>

        {valueType === 'species' ? (
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Enter species name"
              value={pastryValue}
              onChange={(e) => setPastryValue(e.target.value)}
            />
          </div>
        ) : (
          <div className="data-grid data-grid--sm gap-xs">
            {options.map(option => (
              <button
                key={option}
                className={`card card--interactive ${pastryValue === option ? 'card--selected' : ''}`}
                onClick={() => setPastryValue(option)}
              >
                <span className="text-sm">{option}</span>
              </button>
            ))}
          </div>
        )}

        <ActionButtonGroup align="end" className="mt-md">
          <button
            className="button secondary"
            onClick={() => {
              setPendingPastry(null);
              setPastryValue('');
              setCurrentStep('selection');
            }}
          >
            Cancel
          </button>
          <button
            className="button primary"
            onClick={confirmPastryValue}
            disabled={!pastryValue}
          >
            Confirm
          </button>
        </ActionButtonGroup>
      </div>
    );
  };

  // Render processing step
  const renderProcessingStep = () => (
    <div className="processing-step flex flex-col align-center justify-center" style={{ minHeight: '200px' }}>
      <LoadingSpinner />
      <h3 className="mt-md">Processing Items...</h3>
      <p className="text-muted">
        Processing item {currentQueueIndex + 1} of {itemQueue.length}
      </p>
    </div>
  );

  // Render species selection step
  const renderSpeciesSelectionStep = () => {
    if (!pendingSpeciesItem) return null;

    const speciesSlot = getSpeciesSlotAffected(pendingSpeciesItem.itemName);

    return (
      <div className="species-selection">
        <h3 className="mb-sm">Select Species for {pendingSpeciesItem.itemName}</h3>
        <p className="text-muted mb-xs">{getBerryDescription(pendingSpeciesItem.itemName)}</p>
        <p className="text-sm mb-md">Affecting: <strong>Species {speciesSlot}</strong></p>

        <div className="data-grid data-grid--sm gap-sm">
          {rolledSpecies.map((species, idx) => {
            const imageData = speciesImages[species];
            const imageUrl = typeof imageData === 'string' ? imageData : imageData?.image_url;

            return (
              <button
                key={idx}
                className={`card card--interactive ${selectedSpecies === species ? 'card--selected' : ''}`}
                onClick={() => setSelectedSpecies(species)}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={species}
                    className="image-container small mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="text-sm text-center">{species}</span>
              </button>
            );
          })}
        </div>

        <ActionButtonGroup align="end" className="mt-md">
          <button
            className="button primary"
            onClick={continueAfterSpeciesSelection}
            disabled={!selectedSpecies}
          >
            Select {selectedSpecies || 'Species'}
          </button>
        </ActionButtonGroup>
      </div>
    );
  };

  // Render result step
  const renderResultStep = () => {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return (
      <div className="result-step">
        <h3 className="mb-sm">Processing Complete</h3>
        <p className="text-success mb-xs">{successCount} item(s) used successfully</p>
        {errorCount > 0 && <p className="text-danger">{errorCount} item(s) failed</p>}

        <div className="form-stack gap-sm mt-md">
          {results.map(result => (
            <Card
              key={result.id}
              className={result.success ? 'card--success' : 'card--danger'}
            >
              <div className="card__content">
                <div className="flex gap-sm align-center mb-xs">
                  <i className={`fas ${result.success ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`}></i>
                  <h4>{result.itemName}</h4>
                </div>
                <p className="text-sm text-muted">{result.message}</p>

                {result.success && result.beforeMonster && result.afterMonster && (
                  <div className="flex gap-md mt-sm">
                    <div className="flex-1 flex flex-col gap-xs">
                      <h3 className="text-xs mb-xxs">Before</h3>
                      <p className="mt-xxs">
                        {[result.beforeMonster.species1, result.beforeMonster.species2, result.beforeMonster.species3]
                          .filter(Boolean)
                          .join(' + ')}
                      </p>
                      <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                        {[result.beforeMonster.type1, result.beforeMonster.type2,
                          result.beforeMonster.type3, result.beforeMonster.type4,
                          result.beforeMonster.type5]
                          .filter(Boolean)
                          .map((type, idx) => (
                            <TypeBadge key={idx} type={type!} size="sm" />
                          ))}
                      </div>
                      {result.beforeMonster.attribute && (
                        <AttributeBadge attribute={result.beforeMonster.attribute} size="sm" />
                      )}
                    </div>
                    <i className="fas fa-arrow-right text-muted"></i>
                    <div className="flex-1 flex flex-col gap-xs">
                      <h3 className="text-xs mb-xxs">After</h3>
                      <p className="mt-xxs">
                        {[result.afterMonster.species1, result.afterMonster.species2, result.afterMonster.species3]
                          .filter(Boolean)
                          .join(' + ')}
                      </p>
                      <div className="badge-group badge-group--sm badge-group--gap-sm badge-group--wrap">
                        {[result.afterMonster.type1, result.afterMonster.type2,
                          result.afterMonster.type3, result.afterMonster.type4,
                          result.afterMonster.type5]
                          .filter(Boolean)
                          .map((type, idx) => (
                            <TypeBadge key={idx} type={type!} size="sm" />
                          ))}
                      </div>
                      {result.afterMonster.attribute && (
                        <AttributeBadge attribute={result.afterMonster.attribute} size="sm" />
                      )}
                    </div>
                  </div>
                )}

                {result.newMonster && (
                  <div className="mt-sm p-sm bg-success-subtle border-radius">
                    <h5 className="text-xs">New Monster Created!</h5>
                    <p className="text-sm"><strong>{result.newMonster.name}</strong></p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <ActionButtonGroup align="between" className="mt-md">
          <button className="button secondary" onClick={() => setCurrentStep('selection')}>
            Use More Items
          </button>
          <button className="button primary" onClick={handleClose}>
            Done
          </button>
        </ActionButtonGroup>
      </div>
    );
  };

  // Render based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 'selection':
        return renderSelectionStep();
      case 'valueSelection':
        return renderValueSelectionStep();
      case 'processing':
        return renderProcessingStep();
      case 'speciesSelection':
        return renderSpeciesSelectionStep();
      case 'result':
        return renderResultStep();
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'selection':
        return 'Select Items';
      case 'valueSelection':
        return 'Enter Value';
      case 'processing':
        return 'Processing';
      case 'speciesSelection':
        return 'Select Species';
      case 'result':
        return 'Results';
      default:
        return 'Use Items';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${getStepTitle()} - ${currentMonster.name || 'Monster'}`}
      size="large"
      closeOnOverlayClick={currentStep === 'selection' || currentStep === 'result'}
    >
      {renderContent()}
    </Modal>
  );
}

export default AdoptionItemModal;
