import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import TypeBadge from '../monsters/TypeBadge';
import AttributeBadge from '../monsters/AttributeBadge';
import adoptionService from '../../services/adoptionService';
import speciesService from '../../services/speciesService';
import itemsApi from '../../services/itemsApi';
import { getItemFallbackImage } from '../../utils/imageUtils';
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
import './AdoptionItemModal.css';

/**
 * AdoptionItemModal - Modal for using berries and pastries on a newly adopted monster
 * Allows queuing multiple items before applying them all at once.
 * Species rolling for berries happens during processing, not when selecting.
 */
const AdoptionItemModal = ({
  isOpen,
  onClose,
  monster: initialMonster,
  trainerId,
  availableBerries,
  availablePastries,
  onInventoryUpdate
}) => {
  // Current state
  const [step, setStep] = useState('selection'); // 'selection', 'valueSelection', 'processing', 'speciesSelection', 'result'
  const [monster, setMonster] = useState(initialMonster);
  const [activeTab, setActiveTab] = useState('berries');

  // Queue state - items waiting to be applied
  const [queuedItems, setQueuedItems] = useState([]);

  // Berry filter state
  const [berryFilters, setBerryFilters] = useState({
    species: false,
    type: false,
    randomize: false,
    add: false,
    remove: false,
    misc: false
  });

  // Pastry filter state
  const [pastryFilters, setPastryFilters] = useState({
    species: false,
    type: false,
    set: false,
    add: false,
    misc: false
  });

  // Value selection state (for pastries)
  const [pendingPastry, setPendingPastry] = useState(null);
  const [valueOptions, setValueOptions] = useState([]);
  const [filteredValueOptions, setFilteredValueOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [valueSearchTerm, setValueSearchTerm] = useState('');

  // Species selection state (for species-rolling berries during processing)
  const [pendingBerryOperations, setPendingBerryOperations] = useState([]);
  const [rolledSpeciesForOperations, setRolledSpeciesForOperations] = useState({});
  const [selectedSpeciesForOperations, setSelectedSpeciesForOperations] = useState({});
  const [speciesImages, setSpeciesImages] = useState({});

  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState('');

  // Result state
  const [beforeMonster, setBeforeMonster] = useState(null);
  const [processingResults, setProcessingResults] = useState([]);

  // Local inventory tracking
  const [localBerries, setLocalBerries] = useState({});
  const [localPastries, setLocalPastries] = useState({});

  // Item images
  const [berryImages, setBerryImages] = useState({});
  const [pastryImages, setPastryImages] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Initialize local inventory from props
  useEffect(() => {
    setLocalBerries(availableBerries || {});
    setLocalPastries(availablePastries || {});
  }, [availableBerries, availablePastries]);

  // Update monster when prop changes
  useEffect(() => {
    setMonster(initialMonster);
  }, [initialMonster]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('selection');
      setQueuedItems([]);
      setPendingPastry(null);
      setSelectedValue('');
      setError('');
      setValueSearchTerm('');
      setProcessingResults([]);
      setBeforeMonster(null);
      setLocalBerries(availableBerries || {});
      setLocalPastries(availablePastries || {});
      setPendingBerryOperations([]);
      setRolledSpeciesForOperations({});
      setSelectedSpeciesForOperations({});
      setSpeciesImages({});

      // Fetch item images if not already loaded
      if (!imagesLoaded) {
        fetchItemImages();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch berry and pastry images
  const fetchItemImages = async () => {
    try {
      const response = await itemsApi.getBerryAndPastryImages();
      if (response.success) {
        setBerryImages(response.berryImages || {});
        setPastryImages(response.pastryImages || {});
        setImagesLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching item images:', err);
    }
  };

  // Calculate remaining inventory after queued items
  const getRemainingBerries = useCallback(() => {
    const remaining = { ...localBerries };
    queuedItems.forEach(item => {
      if (item.type === 'berry' && remaining[item.name]) {
        remaining[item.name] = Math.max(0, remaining[item.name] - 1);
      }
    });
    return remaining;
  }, [localBerries, queuedItems]);

  const getRemainingPastries = useCallback(() => {
    const remaining = { ...localPastries };
    queuedItems.forEach(item => {
      if (item.type === 'pastry' && remaining[item.name]) {
        remaining[item.name] = Math.max(0, remaining[item.name] - 1);
      }
    });
    return remaining;
  }, [localPastries, queuedItems]);

  // Filter helpers
  const matchesBerryFilters = (berryName) => {
    const activeFilters = Object.keys(berryFilters).filter(key => berryFilters[key]);
    if (activeFilters.length === 0) return true;
    return activeFilters.some(filter =>
      BERRY_CATEGORIES[filter] && BERRY_CATEGORIES[filter].includes(berryName)
    );
  };

  const matchesPastryFilters = (pastryName) => {
    const activeFilters = Object.keys(pastryFilters).filter(key => pastryFilters[key]);
    if (activeFilters.length === 0) return true;
    return activeFilters.some(filter =>
      PASTRY_CATEGORIES[filter] && PASTRY_CATEGORIES[filter].includes(pastryName)
    );
  };

  // Add berry to queue (no species rolling here - that happens during processing)
  const handleBerryClick = (berryName) => {
    setError('');
    addToQueue('berry', berryName, null);
  };

  // Add pastry to queue (needs value selection first)
  const handlePastryClick = async (pastryName) => {
    setError('');
    setPendingPastry(pastryName);

    const valueType = getPastryValueType(pastryName);

    if (valueType === 'species') {
      setLoading(true);
      try {
        const response = await speciesService.getSpeciesList({ limit: 5000 });
        if (response.success && response.species) {
          setValueOptions(response.species);
          setFilteredValueOptions(response.species);
        } else {
          setError('Failed to fetch species list.');
          setPendingPastry(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching species:', err);
        setError('Failed to fetch species list.');
        setPendingPastry(null);
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep('valueSelection');
    } else if (valueType === 'type') {
      setValueOptions(AVAILABLE_TYPES);
      setFilteredValueOptions(AVAILABLE_TYPES);
      setStep('valueSelection');
    } else if (valueType === 'attribute') {
      setValueOptions(AVAILABLE_ATTRIBUTES);
      setFilteredValueOptions(AVAILABLE_ATTRIBUTES);
      setStep('valueSelection');
    }
  };

  // Add item to queue
  const addToQueue = (type, name, value) => {
    const newItem = {
      type,
      name,
      value,
      id: Date.now() + Math.random()
    };
    setQueuedItems(prev => [...prev, newItem]);
  };

  // Remove item from queue
  const removeFromQueue = (itemId) => {
    setQueuedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Confirm value selection for pastry
  const confirmValueSelection = () => {
    if (!selectedValue || !pendingPastry) return;

    addToQueue('pastry', pendingPastry, selectedValue);

    setPendingPastry(null);
    setSelectedValue('');
    setValueSearchTerm('');
    setStep('selection');
  };

  // Cancel value selection
  const cancelSelection = () => {
    setPendingPastry(null);
    setSelectedValue('');
    setValueSearchTerm('');
    setStep('selection');
  };

  // Handle value search
  const handleValueSearch = useCallback(async (searchTerm) => {
    setValueSearchTerm(searchTerm);

    if (!searchTerm.trim()) {
      setFilteredValueOptions(valueOptions);
      return;
    }

    const valueType = getPastryValueType(pendingPastry);

    if (valueType === 'species') {
      try {
        const response = await speciesService.searchSpecies(searchTerm);
        if (response.success && response.species) {
          setFilteredValueOptions(response.species);
        } else {
          const filtered = valueOptions.filter(v =>
            v.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredValueOptions(filtered);
        }
      } catch (err) {
        const filtered = valueOptions.filter(v =>
          v.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredValueOptions(filtered);
      }
    } else {
      const filtered = valueOptions.filter(v =>
        v.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredValueOptions(filtered);
    }
  }, [valueOptions, pendingPastry]);

  // Process all queued items
  const processQueue = async () => {
    if (queuedItems.length === 0) return;

    setStep('processing');
    setLoading(true);
    setBeforeMonster({ ...monster });
    setProcessingProgress('Processing items...');

    const results = [];
    let currentMonster = { ...monster };

    // Separate items into regular items and species-rolling berries
    const regularItems = queuedItems.filter(item =>
      item.type === 'pastry' || (item.type === 'berry' && !berryRequiresSpeciesSelection(item.name))
    );
    const speciesRollingBerries = queuedItems.filter(item =>
      item.type === 'berry' && berryRequiresSpeciesSelection(item.name)
    );

    // Process regular items first
    for (const item of regularItems) {
      try {
        let response;
        const beforeState = { ...currentMonster };
        setProcessingProgress(`Applying ${item.name}...`);

        if (item.type === 'berry') {
          response = await adoptionService.useBerry(
            currentMonster.id,
            item.name,
            trainerId,
            item.value
          );
        } else {
          response = await adoptionService.usePastry(
            currentMonster.id,
            item.name,
            trainerId,
            item.value
          );
        }

        if (response.success && response.monster) {
          currentMonster = response.monster;
          results.push({
            item,
            success: true,
            before: beforeState,
            after: response.monster,
            newMonster: response.newMonster || null
          });

          if (onInventoryUpdate) {
            onInventoryUpdate(item.type, item.name);
          }
        } else {
          results.push({
            item,
            success: false,
            error: response.message || 'Failed to apply item',
            before: beforeState,
            after: beforeState
          });
        }
      } catch (err) {
        console.error(`Error applying ${item.type}:`, err);
        results.push({
          item,
          success: false,
          error: err.response?.data?.message || 'An error occurred',
          before: currentMonster,
          after: currentMonster
        });
      }
    }

    setMonster(currentMonster);
    setProcessingResults(results);

    // If there are species-rolling berries, roll species and show selection modal
    if (speciesRollingBerries.length > 0) {
      setProcessingProgress('Rolling species for berries...');

      try {
        const rolledSpeciesMap = {};
        const allSpecies = new Set();

        // Roll 10 unique species for each berry operation
        for (const item of speciesRollingBerries) {
          const speciesResponse = await adoptionService.rollRandomSpecies(10);
          const operationId = item.id;
          rolledSpeciesMap[operationId] = speciesResponse.species || [];
          speciesResponse.species?.forEach(species => allSpecies.add(species));
        }

        setRolledSpeciesForOperations(rolledSpeciesMap);

        // Fetch images for all rolled species
        if (allSpecies.size > 0) {
          try {
            const imagesResponse = await speciesService.getSpeciesImages(Array.from(allSpecies));
            if (imagesResponse.success) {
              setSpeciesImages(imagesResponse.speciesImages || {});
            }
          } catch (imgError) {
            console.error('Error fetching species images:', imgError);
          }
        }

        // Set up pending operations
        const pendingOps = speciesRollingBerries.map(item => ({
          operationId: item.id,
          monsterId: currentMonster.id,
          berryType: item.name,
          item
        }));

        setPendingBerryOperations(pendingOps);
        setSelectedSpeciesForOperations({});
        setLoading(false);
        setStep('speciesSelection');
      } catch (err) {
        console.error('Error rolling species:', err);
        setError('Failed to roll species for berries.');
        setLoading(false);
        setStep('result');
      }
    } else {
      // No species-rolling berries, go directly to results
      setQueuedItems([]);
      setLoading(false);
      setStep('result');
    }
  };

  // Complete processing after species selection
  const completeSpeciesBerryProcessing = async () => {
    setStep('processing');
    setLoading(true);
    setProcessingProgress('Applying species berries...');

    const results = [...processingResults];
    let currentMonster = { ...monster };

    for (const op of pendingBerryOperations) {
      const selectedSpecies = selectedSpeciesForOperations[op.operationId];
      if (!selectedSpecies) {
        results.push({
          item: op.item,
          success: false,
          error: 'No species selected',
          before: currentMonster,
          after: currentMonster
        });
        continue;
      }

      try {
        const beforeState = { ...currentMonster };
        setProcessingProgress(`Applying ${op.berryType} with ${selectedSpecies}...`);

        const response = await adoptionService.useBerry(
          currentMonster.id,
          op.berryType,
          trainerId,
          selectedSpecies
        );

        if (response.success && response.monster) {
          currentMonster = response.monster;
          results.push({
            item: { ...op.item, value: selectedSpecies },
            success: true,
            before: beforeState,
            after: response.monster,
            newMonster: response.newMonster || null
          });

          if (onInventoryUpdate) {
            onInventoryUpdate('berry', op.berryType);
          }
        } else {
          results.push({
            item: op.item,
            success: false,
            error: response.message || 'Failed to apply berry',
            before: beforeState,
            after: beforeState
          });
        }
      } catch (err) {
        console.error('Error applying species berry:', err);
        results.push({
          item: op.item,
          success: false,
          error: err.response?.data?.message || 'An error occurred',
          before: currentMonster,
          after: currentMonster
        });
      }
    }

    setMonster(currentMonster);
    setProcessingResults(results);
    setQueuedItems([]);
    setPendingBerryOperations([]);
    setLoading(false);
    setStep('result');
  };

  // Handle using more items after results
  const handleUseMore = () => {
    setStep('selection');
    setQueuedItems([]);
    setError('');
    setProcessingResults([]);
    setBeforeMonster(null);
    setPendingBerryOperations([]);
    setRolledSpeciesForOperations({});
    setSelectedSpeciesForOperations({});
    setLocalBerries(availableBerries || {});
    setLocalPastries(availablePastries || {});
  };

  // Render monster display
  const renderMonsterDisplay = (monsterData, title = null, compact = false) => (
    <div className={`adoption-item-monster-display ${compact ? 'compact' : ''}`}>
      {title && <h4>{title}</h4>}
      <div className="monster-info-row">
        <div className="monster-name-species">
          <h3>{monsterData.name}</h3>
          <div className="monster-species-list">
            {monsterData.species1 && <span className="species-badge">{monsterData.species1}</span>}
            {monsterData.species2 && <span className="species-badge"> {monsterData.species2}</span>}
            {monsterData.species3 && <span className="species-badge"> {monsterData.species3}</span>}
          </div>
        </div>
      </div>
      <div className="monster-types-row">
        {monsterData.type1 && <TypeBadge type={monsterData.type1} />}
        {monsterData.type2 && <TypeBadge type={monsterData.type2} />}
        {monsterData.type3 && <TypeBadge type={monsterData.type3} />}
        {monsterData.type4 && <TypeBadge type={monsterData.type4} />}
        {monsterData.type5 && <TypeBadge type={monsterData.type5} />}
      </div>
      {monsterData.attribute && (
        <div className="monster-attribute-row">
          <AttributeBadge attribute={monsterData.attribute} />
        </div>
      )}
    </div>
  );

  // Render queued items
  const renderQueuedItems = () => {
    if (queuedItems.length === 0) return null;

    return (
      <div className="queued-items-section">
        <h4>Queued Items ({queuedItems.length})</h4>
        <div className="queued-items-list">
          {queuedItems.map((item, index) => {
            const category = item.type === 'berry' ? 'berry' : 'pastry';
            const imageUrl = item.type === 'berry'
              ? (berryImages[item.name] || getItemFallbackImage('berry'))
              : (pastryImages[item.name] || getItemFallbackImage('pastry'));
            return (
              <div key={item.id} className="queued-item">
                <span className="queued-item-number">{index + 1}.</span>
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="queued-item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getItemFallbackImage(category);
                  }}
                />
                <span className="queued-item-name">{item.name}</span>
                {item.value && (
                  <span className="queued-item-value">→ {item.value}</span>
                )}
                {item.type === 'berry' && berryRequiresSpeciesSelection(item.name) && !item.value && (
                  <span className="queued-item-note">(species will be rolled)</span>
                )}
                <button
                  className="queued-item-remove"
                  onClick={() => removeFromQueue(item.id)}
                  title="Remove from queue"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <button
          className="modal-button primary apply-all-button"
          onClick={processQueue}
          disabled={loading}
        >
          Apply All ({queuedItems.length} items)
        </button>
      </div>
    );
  };

  // Render berry selection
  const renderBerrySelection = () => {
    const remainingBerries = getRemainingBerries();

    return (
      <div className="item-selection-section">
        <div className="filter-buttons">
          {Object.keys(berryFilters).map(filter => (
            <button
              key={filter}
              className={`filter-button ${berryFilters[filter] ? 'active' : ''}`}
              onClick={() => setBerryFilters(prev => ({ ...prev, [filter]: !prev[filter] }))}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <button
            className="filter-button clear"
            onClick={() => setBerryFilters({
              species: false, type: false, randomize: false, add: false, remove: false, misc: false
            })}
          >
            Clear
          </button>
        </div>

        <div className="items-grid">
          {Object.entries(remainingBerries)
            .filter(([berryName, count]) => count > 0)
            .filter(([berryName]) => matchesBerryFilters(berryName))
            .filter(([berryName]) => canBerryBeUsedOnMonster(berryName, monster))
            .map(([berryName, count]) => {
              const imageUrl = berryImages[berryName] || getItemFallbackImage('berry');
              return (
                <button
                  key={berryName}
                  className="item-button berry"
                  onClick={() => handleBerryClick(berryName)}
                  disabled={loading}
                >
                  <img
                    src={imageUrl}
                    alt={berryName}
                    className="item-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getItemFallbackImage('berry');
                    }}
                  />
                  <div className="item-info">
                    <span className="item-name">{berryName}</span>
                    <span className="item-desc">{getBerryDescription(berryName)}</span>
                  </div>
                  <span className="item-count">x{count}</span>
                </button>
              );
            })}
          {Object.entries(remainingBerries)
            .filter(([, count]) => count > 0)
            .filter(([berryName]) => matchesBerryFilters(berryName))
            .filter(([berryName]) => canBerryBeUsedOnMonster(berryName, monster))
            .length === 0 && (
            <p className="no-items-message">No usable berries available for this monster.</p>
          )}
        </div>
      </div>
    );
  };

  // Render pastry selection
  const renderPastrySelection = () => {
    const remainingPastries = getRemainingPastries();

    return (
      <div className="item-selection-section">
        <div className="filter-buttons">
          {Object.keys(pastryFilters).map(filter => (
            <button
              key={filter}
              className={`filter-button ${pastryFilters[filter] ? 'active' : ''}`}
              onClick={() => setPastryFilters(prev => ({ ...prev, [filter]: !prev[filter] }))}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <button
            className="filter-button clear"
            onClick={() => setPastryFilters({
              species: false, type: false, set: false, add: false, misc: false
            })}
          >
            Clear
          </button>
        </div>

        <div className="items-grid">
          {Object.entries(remainingPastries)
            .filter(([pastryName, count]) => count > 0)
            .filter(([pastryName]) => matchesPastryFilters(pastryName))
            .filter(([pastryName]) => canPastryBeUsedOnMonster(pastryName, monster))
            .map(([pastryName, count]) => {
              const imageUrl = pastryImages[pastryName] || getItemFallbackImage('pastry');
              return (
                <button
                  key={pastryName}
                  className="item-button pastry"
                  onClick={() => handlePastryClick(pastryName)}
                  disabled={loading}
                >
                  <img
                    src={imageUrl}
                    alt={pastryName}
                    className="item-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getItemFallbackImage('pastry');
                    }}
                  />
                  <div className="item-info">
                    <span className="item-name">{pastryName}</span>
                    <span className="item-desc">{getPastryDescription(pastryName)}</span>
                  </div>
                  <span className="item-count">x{count}</span>
                </button>
              );
            })}
          {Object.entries(remainingPastries)
            .filter(([, count]) => count > 0)
            .filter(([pastryName]) => matchesPastryFilters(pastryName))
            .filter(([pastryName]) => canPastryBeUsedOnMonster(pastryName, monster))
            .length === 0 && (
            <p className="no-items-message">No usable pastries available for this monster.</p>
          )}
        </div>
      </div>
    );
  };

  // Render value selection (for pastry)
  const renderValueSelection = () => (
    <div className="value-selection-section">
      <h3>Select a Value for {pendingPastry}</h3>
      <p className="selection-info">{getPastryDescription(pendingPastry)}</p>

      {renderMonsterDisplay(monster, null, true)}

      <div className="value-search">
        <input
          type="text"
          placeholder="Search values..."
          value={valueSearchTerm}
          onChange={(e) => handleValueSearch(e.target.value)}
        />
      </div>

      <div className="value-grid">
        {filteredValueOptions.map((value, index) => (
          <button
            key={index}
            className={`value-option ${selectedValue === value ? 'selected' : ''}`}
            onClick={() => setSelectedValue(value)}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="modal-actions">
        <button className="modal-button secondary" onClick={cancelSelection}>
          Cancel
        </button>
        <button
          className="modal-button primary"
          onClick={confirmValueSelection}
          disabled={!selectedValue || loading}
        >
          Add to Queue
        </button>
      </div>
    </div>
  );

  // Render species selection (during processing) - styled like MassEditModal
  const renderSpeciesSelection = () => (
    <div className="species-selection-content">
      <p>Some berries require species selection. Please select a species for each berry operation:</p>

      {pendingBerryOperations.map((op) => {
        const speciesSlot = getSpeciesSlotAffected(op.berryType);
        const availableSpecies = rolledSpeciesForOperations[op.operationId] || [];

        return (
          <div key={op.operationId} className="species-operation-selection">
            <div className="operation-header">
              <div className="monster-mini-info">
                {monster?.img_link && (
                  <img
                    src={monster.img_link}
                    alt={monster?.name || 'Monster'}
                    onError={(e) => { e.target.src = '/images/default_mon.png'; }}
                    className="monster-selection-image"
                  />
                )}
                <div className="monster-selection-details">
                  <h4>{monster?.name || 'Monster'}</h4>
                  <div className="current-species">
                    <span className={`species-badge ${speciesSlot === 1 ? 'species-highlight' : ''}`}>
                      {monster?.species1 || 'None'}
                    </span>
                    {monster?.species2 && (
                      <span className={`species-badge ${speciesSlot === 2 ? 'species-highlight' : ''}`}>
                        {monster.species2}
                      </span>
                    )}
                    {monster?.species3 && (
                      <span className={`species-badge ${speciesSlot === 3 ? 'species-highlight' : ''}`}>
                        {monster.species3}
                      </span>
                    )}
                  </div>
                  <div className="current-types">
                    {[monster?.type1, monster?.type2, monster?.type3, monster?.type4, monster?.type5]
                      .filter(Boolean)
                      .map((type, index) => (
                        <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                          {type}
                        </span>
                      ))}
                  </div>
                  {monster?.attribute && (
                    <div className="current-attribute">
                      <span className={`attribute-badge attribute-${monster.attribute.toLowerCase()}`}>
                        {monster.attribute}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="operation-details">
                <span className="berry-type">{op.berryType}</span>
                <span className="berry-effect">{getBerryDescription(op.berryType)}</span>
                <span className="species-slot">Affecting Species Slot {speciesSlot}</span>
              </div>
            </div>

            <div className="species-selection-grid">
              {availableSpecies.map((species, index) => {
                const speciesImage = speciesImages[species];
                const isSelected = selectedSpeciesForOperations[op.operationId] === species;

                return (
                  <button
                    key={index}
                    className={`species-selection-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSpeciesForOperations(prev => ({
                      ...prev,
                      [op.operationId]: species
                    }))}
                  >
                    {speciesImage?.image_url && (
                      <img
                        src={speciesImage.image_url}
                        alt={species}
                        className="species-image"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="species-name">{species}</span>
                  </button>
                );
              })}
            </div>

            {selectedSpeciesForOperations[op.operationId] && (
              <div className="selection-preview">
                <strong>Selected:</strong> {selectedSpeciesForOperations[op.operationId]}
              </div>
            )}
          </div>
        );
      })}

      {error && <div className="error-message">{error}</div>}

      <div className="species-selection-actions">
        <button
          className="modal-button secondary"
          onClick={() => {
            // Skip species berries and go to results
            setQueuedItems([]);
            setPendingBerryOperations([]);
            setStep('result');
          }}
        >
          Skip Species Berries
        </button>
        <button
          className="modal-button primary"
          onClick={completeSpeciesBerryProcessing}
          disabled={pendingBerryOperations.some(op => !selectedSpeciesForOperations[op.operationId])}
        >
          Apply Selected Species ({pendingBerryOperations.filter(op => selectedSpeciesForOperations[op.operationId]).length}/{pendingBerryOperations.length})
        </button>
      </div>
    </div>
  );

  // Render processing
  const renderProcessing = () => (
    <div className="processing-section">
      <LoadingSpinner />
      <p>{processingProgress}</p>
    </div>
  );

  // Render results
  const renderResults = () => {
    const successCount = processingResults.filter(r => r.success).length;
    const failCount = processingResults.filter(r => !r.success).length;

    return (
      <div className="result-section">
        <div className="results-summary">
          <h3>Results</h3>
          <p>
            {successCount > 0 && <span className="success-count">{successCount} succeeded</span>}
            {successCount > 0 && failCount > 0 && ', '}
            {failCount > 0 && <span className="fail-count">{failCount} failed</span>}
            {successCount === 0 && failCount === 0 && <span>No items were processed</span>}
          </p>
        </div>

        <div className="before-after-comparison">
          <div className="comparison-column">
            <h4>Before</h4>
            {beforeMonster && renderMonsterDisplay(beforeMonster, null, true)}
          </div>
          <div className="comparison-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
          <div className="comparison-column">
            <h4>After</h4>
            {renderMonsterDisplay(monster, null, true)}
          </div>
        </div>

        {processingResults.length > 0 && (
          <div className="results-details">
            <h4>Applied Items</h4>
            {processingResults.map((result, index) => (
              <div
                key={index}
                className={`result-item ${result.success ? 'success' : 'error'}`}
              >
                <span className="result-icon">
                  {result.success ? '✓' : '✗'}
                </span>
                <span className="result-name">{result.item.name}</span>
                {result.item.value && (
                  <span className="result-value">→ {result.item.value}</span>
                )}
                {!result.success && (
                  <span className="result-error">{result.error}</span>
                )}
                {result.newMonster && (
                  <span className="result-new-monster">
                    New monster created: {result.newMonster.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-button secondary" onClick={onClose}>
            Done
          </button>
          <button className="modal-button primary" onClick={handleUseMore}>
            Use More Items
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen || !monster) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Use Pastries and Berries"
      size="large"
    >
      <div className="adoption-item-modal-content">
        {loading && step === 'selection' && (
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        )}

        {step === 'selection' && (
          <>
            {renderMonsterDisplay(monster)}

            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'berries' ? 'active' : ''}`}
                onClick={() => setActiveTab('berries')}
              >
                Berries
              </button>
              <button
                className={`tab-button ${activeTab === 'pastries' ? 'active' : ''}`}
                onClick={() => setActiveTab('pastries')}
              >
                Pastries
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {activeTab === 'berries' ? renderBerrySelection() : renderPastrySelection()}

            {renderQueuedItems()}

            <div className="modal-actions">
              <button className="modal-button secondary" onClick={onClose}>
                {queuedItems.length > 0 ? 'Cancel' : 'Close'}
              </button>
            </div>
          </>
        )}

        {step === 'valueSelection' && renderValueSelection()}

        {step === 'processing' && renderProcessing()}

        {step === 'speciesSelection' && renderSpeciesSelection()}

        {step === 'result' && renderResults()}
      </div>
    </Modal>
  );
};

export default AdoptionItemModal;
