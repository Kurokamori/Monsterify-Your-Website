import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';
import adoptionService from '../../services/adoptionService';
import speciesService from '../../services/speciesService';
import {
  getBerryDescription,
  getPastryDescription,
  berryRequiresSpeciesSelection,
  getSpeciesSlotAffected,
  canBerryBeUsedOnMonster,
  canPastryBeUsedOnMonster
} from '../../utils/itemHelpers';

const MassEditModal = ({ 
  isOpen, 
  onClose, 
  monsters, 
  trainerId, 
  onComplete 
}) => {
  const [step, setStep] = useState('edit'); // 'edit', 'processing', 'results'
  const [editData, setEditData] = useState({});
  const [queuedOperations, setQueuedOperations] = useState([]);
  const [processingResults, setProcessingResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [sortByLevel, setSortByLevel] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const [showOnlyWithoutImages, setShowOnlyWithoutImages] = useState(false);
  const [trainerInventory, setTrainerInventory] = useState({ berries: {}, pastries: {} });
  const [selectedBerries, setSelectedBerries] = useState({}); // Track berries selected across all monsters
  
  // Species selection state
  const [showSpeciesSelectionModal, setShowSpeciesSelectionModal] = useState(false);
  const [pendingBerryOperations, setPendingBerryOperations] = useState([]);
  const [rolledSpeciesForOperations, setRolledSpeciesForOperations] = useState({}); // Changed: now stores species per operation
  const [selectedSpeciesForOperations, setSelectedSpeciesForOperations] = useState({});
  const [speciesImages, setSpeciesImages] = useState({}); // Store species images
  
  // Enhanced filtering and sorting logic
  const filteredMonsters = (() => {
    let filtered = monsters.filter(monster => {
      if (!monster) return false;
      
      // Name search
      const nameMatch = !searchTerm || (monster.name && monster.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Species search
      const speciesMatch = !speciesSearch || [monster.species1, monster.species2, monster.species3]
        .filter(Boolean)
        .some(species => species && species.toLowerCase && species.toLowerCase().includes(speciesSearch.toLowerCase()));
      
      // Type search  
      const typeMatch = !typeSearch || [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
        .filter(Boolean)
        .some(type => type && type.toLowerCase && type.toLowerCase().includes(typeSearch.toLowerCase()));
      
      // Image filter
      let imageMatch = true;
      if (showOnlyWithImages) {
        imageMatch = monster.img_link && monster.img_link.trim() !== '';
      } else if (showOnlyWithoutImages) {
        imageMatch = !monster.img_link || monster.img_link.trim() === '';
      }
      
      return nameMatch && speciesMatch && typeMatch && imageMatch;
    });
    
    // Sort by level if enabled
    if (sortByLevel) {
      filtered = filtered.sort((a, b) => (b.level || 0) - (a.level || 0));
    }
    
    return filtered;
  })();

  // Note: Helper functions (berryRequiresSpeciesSelection, getBerryDescription,
  // getSpeciesSlotAffected, canBerryBeUsedOnMonster, canPastryBeUsedOnMonster)
  // are now imported from '../../utils/itemHelpers'

  // Calculate remaining berries taking into account selected berries
  const getRemainingBerries = () => {
    const remaining = { ...trainerInventory.berries };
    
    // Count how many of each berry type are selected
    Object.values(editData).forEach(monsterData => {
      monsterData.berries?.forEach(berry => {
        if (berry.type) {
          remaining[berry.type] = Math.max(0, (remaining[berry.type] || 0) - 1);
        }
      });
    });
    
    return remaining;
  };

  // Note: getPastryDescription is now imported from '../../utils/itemHelpers'

  // Debug inventory changes
  useEffect(() => {
    console.log('Trainer inventory changed:', trainerInventory);
  }, [trainerInventory]);

  // Fetch trainer inventory when modal opens
  useEffect(() => {
    const fetchTrainerInventory = async () => {
      if (!isOpen || !trainerId) return;
      
      try {
        const response = await api.get(`/trainers/${trainerId}/inventory`);
        if (response.data.success) {
          const inventory = {
            berries: response.data.data.berries || {},
            pastries: response.data.data.pastries || {}
          };
          console.log('Fetched trainer inventory:', inventory);
          setTrainerInventory(inventory);
        }
      } catch (error) {
        console.error('Error fetching trainer inventory:', error);
      }
    };

    fetchTrainerInventory();
  }, [isOpen, trainerId]);

  // Helper function to update inventory after successful operations
  const updateInventoryAfterOperations = (results) => {
    const newInventory = { ...trainerInventory };
    console.log('Updating inventory, current state:', trainerInventory);
    console.log('Processing results:', results);
    
    results.forEach(result => {
      if (result.status !== 'success') {
        return;
      }
        if (result.type === 'berry' && result.berryType) {
          console.log(`Subtracting ${result.berryType}, current count: ${newInventory.berries[result.berryType]}`);
          if (newInventory.berries[result.berryType] && newInventory.berries[result.berryType] > 0) {
            newInventory.berries[result.berryType] -= 1;
          }
        } else if (result.type === 'pastry' && result.pastryType) {
          console.log(`Subtracting ${result.pastryType}, current count: ${newInventory.pastries[result.pastryType]}`);
          if (newInventory.pastries[result.pastryType] && newInventory.pastries[result.pastryType] > 0) {
            newInventory.pastries[result.pastryType] -= 1;
          }
        }
      
    });
    
    console.log('Updated inventory:', newInventory);
    setTrainerInventory(newInventory);
  };

  // Initialize edit data when modal opens
  useEffect(() => {
    if (isOpen && monsters.length > 0) {
      const initialData = {};
      monsters.forEach(monster => {
        initialData[monster.id] = {
          newNickname: monster.name || '',
          berries: [{ type: '', id: Date.now() }], // Array of berry selections
          pastries: [{ type: '', value: '', id: Date.now() }] // Array of pastry selections
        };
      });
      setEditData(initialData);
    }
  }, [isOpen, monsters]);

  // Handle nickname changes
  const handleNicknameChange = (monsterId, newNickname) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        newNickname
      }
    }));
  };

  // Handle berry selection
  const handleBerryChange = (monsterId, berryIndex, berryType) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: prev[monsterId].berries.map((berry, index) => 
          index === berryIndex ? { ...berry, type: berryType } : berry
        )
      }
    }));
  };

  // Add new berry dropdown
  const addBerryDropdown = (monsterId) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: [...prev[monsterId].berries, { type: '', id: Date.now() }]
      }
    }));
  };

  // Remove berry dropdown
  const removeBerryDropdown = (monsterId, berryIndex) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        berries: prev[monsterId].berries.filter((_, index) => index !== berryIndex)
      }
    }));
  };

  // Handle pastry selection
  const handlePastryChange = (monsterId, pastryIndex, pastryType) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.map((pastry, index) => 
          index === pastryIndex ? { ...pastry, type: pastryType } : pastry
        )
      }
    }));
  };

  // Handle pastry value input
  const handlePastryValueChange = (monsterId, pastryIndex, value) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.map((pastry, index) => 
          index === pastryIndex ? { ...pastry, value: value } : pastry
        )
      }
    }));
  };

  // Add new pastry dropdown
  const addPastryDropdown = (monsterId) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: [...prev[monsterId].pastries, { type: '', value: '', id: Date.now() }]
      }
    }));
  };

  // Remove pastry dropdown
  const removePastryDropdown = (monsterId, pastryIndex) => {
    setEditData(prev => ({
      ...prev,
      [monsterId]: {
        ...prev[monsterId],
        pastries: prev[monsterId].pastries.filter((_, index) => index !== pastryIndex)
      }
    }));
  };

  // Process all queued operations
  const handleSubmit = async () => {
    setIsProcessing(true);
    setStep('processing');
    
    const operations = [];
    const results = [];

    // Collect all operations
    Object.entries(editData).forEach(([monsterId, data]) => {
      const monster = monsters.find(m => m.id === parseInt(monsterId));
      if (!monster) return;

            // Add pastry operations (multiple per monster)
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

      // Add berry operations (multiple per monster)
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
          newName: data.newNickname
        });
      }
    });

    setQueuedOperations(operations);

    // Track current monster states as they get updated
    const currentMonsterStates = {};
    monsters.forEach(monster => {
      currentMonsterStates[monster.id] = { ...monster };
    });

    try {
      // Step 1: Process all renames (guaranteed to succeed)
      const renameOps = operations.filter(op => op.type === 'rename');
      for (const op of renameOps) {
        try {
          const response = await api.put(`/monsters/${op.monsterId}`, { name: op.newName });
          
          if (response.data.success) {
            // Update the current state for this monster - merge with existing data to preserve all fields
            const existingMonster = currentMonsterStates[op.monsterId];
            currentMonsterStates[op.monsterId] = {
              ...existingMonster,  // Keep all original monster data
              ...response.data.data,  // Override with any updated data from API
              name: op.newName  // Ensure name is updated even if API doesn't return full monster
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
            message: `Error renaming ${op.monsterName}: ${error.message}`
          });
        }
      }

      // Step 2: Process all pastries (guaranteed with inventory validation)
      const pastryOps = operations.filter(op => op.type === 'pastry');
      for (const op of pastryOps) {
        try {
          // Get the current name and state BEFORE the operation
          const currentMonster = currentMonsterStates[op.monsterId];
          const currentName = currentMonster ? currentMonster.name : op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };
          
          const response = await adoptionService.usePastry(
            op.monsterId,
            op.pastryType,
            trainerId,
            op.value
          );
          
          if (response.success) {
            // Update the current state for this monster AFTER getting the before state
            const existingMonster = currentMonsterStates[op.monsterId];
            currentMonsterStates[op.monsterId] = {
              ...existingMonster,  // Keep existing data including updated name
              ...response.monster  // Override with updated monster data from pastry
            };
            
            results.push({
              ...op,
              status: 'success',
              message: `Used ${op.pastryType} on ${currentName} (value: ${op.value})`,
              beforeMonster: beforeMonster,
              afterValue: op.value,
              changeType: 'pastry',
              updatedMonster: response.monster,
              displayName: currentName
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.pastryType} on ${currentName}: ${response.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.pastryType}: ${error.message}`
          });
        }
      }

      // Step 3: Process all berries (with potential rolls and user selections)
      const berryOps = operations.filter(op => op.type === 'berry');
      
      // Separate berries that need species selection from those that don't
      const berriesToSelectSpecies = berryOps.filter(op => berryRequiresSpeciesSelection(op.berryType));
      const regularBerryOps = berryOps.filter(op => !berryRequiresSpeciesSelection(op.berryType));
      
      // Process regular berries first (those that don't need species selection)
      for (const op of regularBerryOps) {
        try {
          // Get the current name and state BEFORE the operation
          const currentMonster = currentMonsterStates[op.monsterId];
          const currentName = currentMonster ? currentMonster.name : op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };
          
          const response = await adoptionService.useBerry(
            op.monsterId,
            op.berryType,
            trainerId,
            null  // speciesValue - for non-species berries
          );
          
          if (response.success) {
            // Update the current state for this monster AFTER getting the before state  
            const existingMonster = currentMonsterStates[op.monsterId];
            currentMonsterStates[op.monsterId] = {
              ...existingMonster,  // Keep existing data including updated name
              ...response.monster  // Override with updated monster data from berry
            };
            
            let message = `Used ${op.berryType} on ${currentName}`;
            let newMonster = null;

            // Handle Divest Berry special case
            if (op.berryType === 'Divest Berry' && response.newMonster) {
              newMonster = response.newMonster;
              message = `Used ${op.berryType} on ${currentName} - created new monster "${response.newMonster.name}"`;
            }
            
            results.push({
              ...op,
              status: 'success',
              result: response,
              message: message,
              needsSelection: response.needsSelection || false,
              beforeMonster: beforeMonster,
              changeType: 'berry',
              updatedMonster: response.monster,
              newMonster: newMonster,
              displayName: currentName
            });

            
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.berryType} on ${currentName}: ${response.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.berryType}: ${error.message}`
          });
        }
      }
      
      // Now handle species berries if any exist
      if (berriesToSelectSpecies.length > 0) {
        // We need to handle species selection for these berries
        setPendingBerryOperations(berriesToSelectSpecies);
        
        // Roll unique species for each operation
        try {
          const rolledSpeciesMap = {};
          const allSpecies = new Set();
          
          // Roll 10 unique species for each berry operation
          for (const op of berriesToSelectSpecies) {
            const speciesResponse = await adoptionService.rollRandomSpecies(10);
            rolledSpeciesMap[op.operationId] = speciesResponse.species || [];
            // Collect all unique species to fetch images
            speciesResponse.species?.forEach(species => allSpecies.add(species));
          }
          
          setRolledSpeciesForOperations(rolledSpeciesMap);
          
          // Fetch images for all rolled species
          if (allSpecies.size > 0) {
            try {
              const speciesImagesResponse = await speciesService.getSpeciesImages(Array.from(allSpecies));
              if (speciesImagesResponse.success) {
                setSpeciesImages(speciesImagesResponse.speciesImages);
              }
            } catch (error) {
              console.error('Error fetching species images:', error);
            }
          }
          
          // Update results with what we've processed so far
          setProcessingResults(results);
          updateInventoryAfterOperations(results);
          
          // Show species selection modal but don't return - we still have species berries to process
          setShowSpeciesSelectionModal(true);
          return;
        } catch (error) {
          console.error('Error rolling species:', error);
          // Add error results for all species berries
          berriesToSelectSpecies.forEach(op => {
            results.push({
              ...op,
              status: 'error',
              message: `Error rolling species for ${op.berryType}: ${error.message}`
            });
          });
        }
      }

      setProcessingResults(results);
      updateInventoryAfterOperations(results);
      setStep('results');
      
      console.log('Final results:', results);
      console.log('Final trainer inventory after update:', trainerInventory);
      
    } catch (error) {
      console.error('Mass edit processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle species selection for a berry operation
  const handleSpeciesSelection = (operationId, selectedSpecies) => {
    setSelectedSpeciesForOperations(prev => ({
      ...prev,
      [operationId]: selectedSpecies
    }));
  };

  // Complete berry processing after species selection
  const completeSpeciesBerryProcessing = async () => {
    setShowSpeciesSelectionModal(false);
    
    try {
      const results = [...processingResults]; // Get existing results
      
      // Rebuild current monster states by applying all completed operations
      const currentMonsterStates = {};
      monsters.forEach(monster => {
        currentMonsterStates[monster.id] = { ...monster };
      });
      
      // Apply all previous successful updates to get current state
      results.forEach(result => {
        if (result.status === 'success' && result.updatedMonster) {
          currentMonsterStates[result.monsterId] = { ...result.updatedMonster };
        }
      });

      // Process species berries with selected species
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
          const currentName = currentMonster ? currentMonster.name : op.monsterName;
          const beforeMonster = { ...currentMonsterStates[op.monsterId] };
          
          const response = await adoptionService.useBerry(
            op.monsterId,
            op.berryType,
            trainerId,
            selectedSpecies
          );
          
          if (response.success) {
            const existingMonster = currentMonsterStates[op.monsterId];
            currentMonsterStates[op.monsterId] = {
              ...existingMonster,
              ...response.monster
            };
            
            let message = `Used ${op.berryType} on ${currentName} (selected: ${selectedSpecies})`;
            let newMonster = null;

            // Handle Divest Berry special case (though it shouldn't need species selection)
            if (op.berryType === 'Divest Berry' && response.newMonster) {
              newMonster = response.newMonster;
              message = `Used ${op.berryType} on ${currentName} - created new monster "${response.newMonster.name}"`;
            }
            
            results.push({
              ...op,
              status: 'success',
              result: response,
              message: message,
              beforeMonster: beforeMonster,
              changeType: 'berry',
              updatedMonster: response.monster,
              newMonster: newMonster,
              displayName: currentName
            });
          } else {
            results.push({
              ...op,
              status: 'error',
              message: `Failed to use ${op.berryType} on ${currentName}: ${response.message || 'Unknown error'}`
            });
          }
        } catch (error) {
          results.push({
            ...op,
            status: 'error',
            message: `Error using ${op.berryType}: ${error.message}`
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
  };

  const handleClose = () => {
    if (step === 'results') {
      onComplete(processingResults);
    }
    onClose();
    // Reset state
    setStep('edit');
    setEditData({});
    setQueuedOperations([]);
    setProcessingResults([]);
    setShowSpeciesSelectionModal(false);
    setPendingBerryOperations([]);
    setSelectedSpeciesForOperations({});
    setRolledSpeciesForOperations({});
    setSpeciesImages({});
    setSelectedBerries({});
    setSearchTerm('');
    setSpeciesSearch('');
    setTypeSearch('');
    setSortByLevel(false);
    setShowOnlyWithImages(false);
    setShowOnlyWithoutImages(false);
    // DON'T reset inventory - keep the updated counts
  };

  if (!isOpen) return null;

  return (
    <div className="mass-edit-modal-overlay">
      <div className="mass-edit-modal">
        <div className="mass-edit-header">
          <h2>Mass Edit Monsters</h2>
          <button className="button close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="mass-edit-content">
          {step === 'edit' && (
            <div className="mass-edit-form">
              <div className="mass-edit-instructions">
                <p>Edit your monsters in bulk. You can:</p>
                <ul>
                  <li>Rename monsters (guaranteed)</li>
                  <li>Use pastries from your inventory (guaranteed with value selection)</li>
                  <li>Use berries from your inventory (may require species selection after rolling)</li>
                </ul>
              </div>
              
              <div className="search-filters-section">
                <div className="search-bar">
                  <div className="search-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <input
                    id="monster-search"
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="additional-filters">
                  <div className="filter-row">
                    <div className="search-bar species-search">
                      <div className="search-icon">
                        <i className="fas fa-dna"></i>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by species..."
                        value={speciesSearch}
                        onChange={(e) => setSpeciesSearch(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    
                    <div className="search-bar type-search">
                      <div className="search-icon">
                        <i className="fas fa-tags"></i>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by type..."
                        value={typeSearch}
                        onChange={(e) => setTypeSearch(e.target.value)}
                        className="search-input"
                      />
                    </div>
                  </div>
                  
                  <div className="filter-row toggles">
                    <label className="toggle-filter">
                      <input
                        type="checkbox"
                        checked={sortByLevel}
                        onChange={(e) => setSortByLevel(e.target.checked)}
                      />
                      <span className="toggle-label">Sort by level (highest first)</span>
                    </label>
                    
                    <label className="toggle-filter">
                      <input
                        type="checkbox"
                        checked={showOnlyWithImages}
                        onChange={(e) => {
                          setShowOnlyWithImages(e.target.checked);
                          if (e.target.checked) setShowOnlyWithoutImages(false);
                        }}
                      />
                      <span className="toggle-label">Show only monsters with images</span>
                    </label>
                    
                    <label className="toggle-filter">
                      <input
                        type="checkbox"
                        checked={showOnlyWithoutImages}
                        onChange={(e) => {
                          setShowOnlyWithoutImages(e.target.checked);
                          if (e.target.checked) setShowOnlyWithImages(false);
                        }}
                      />
                      <span className="toggle-label">Show only monsters without images</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="monsters-edit-grid">
                {filteredMonsters.map(monster => (
                  <div key={monster.id} className="monster-edit-card">
                    <div className="monster-edit-info">
                      <img 
                        src={monster.img_link || '/images/default_mon.png'} 
                        alt={monster.name}
                        onError={(e) => {
                          e.target.src = `/images/default_mon.png`;
                        }}
                        className="monster-edit-image"
                      />
                      <div className="monster-edit-details">
                        <h4>{monster.name}</h4>
                        <p>{monster.species1} {monster.species2 ? `+ ${monster.species2}` : ''} {monster.species3 ? `+ ${monster.species3}` : ''} - Level {monster.level}</p>
                        <div className="monster-types">
                          {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean).map((type, index) => (
                            <span className={`type-badge type-${type && type.toLowerCase ? type.toLowerCase() : 'unknown'}`} key={index}>
                              {type}
                            </span>
                          ))}
                        </div>
                        <div className="monster-attribute">
                          <span className={`attribute-badge attribute-${monster.attribute && monster.attribute.toLowerCase ? monster.attribute.toLowerCase() : 'unknown'}`}>
                            {monster.attribute}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="monster-edit-controls">
                      <div className="edit-section">
                        <label>Rename:</label>
                        <input
                          type="text"
                          value={editData[monster.id]?.newNickname || ''}
                          onChange={(e) => handleNicknameChange(monster.id, e.target.value)}
                          placeholder={monster.name}
                          className="rename-input"
                        />
                      </div>

                      <div className="edit-section">
                        <div className="section-header">
                          <label>Use Berries:</label>
                          <button
                            type="button"
                            onClick={() => addBerryDropdown(monster.id)}
                            className="button secondary"
                            title="Add another berry"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        {editData[monster.id]?.berries.map((berry, index) => (
                          <div key={berry.id} className="dropdown-row">
                            <select
                              value={berry.type}
                              onChange={(e) => handleBerryChange(monster.id, index, e.target.value)}
                              className="berry-select"
                            >
                              <option value="">Select berry</option>
                              {(() => {
                                const remainingBerries = getRemainingBerries();
                                return Object.entries(trainerInventory.berries).map(([berryType, originalCount]) => {
                                  const remainingCount = remainingBerries[berryType] || 0;
                                  const isCurrentlySelected = berry.type === berryType;
                                  const canSelect = remainingCount > 0 || isCurrentlySelected;
                                  const canUseOnMonster = canBerryBeUsedOnMonster(berryType, monster);
                                  
                                  if (originalCount > 0 && canSelect && canUseOnMonster) {
                                    return (
                                      <option key={berryType} value={berryType} title={getBerryDescription(berryType)}>
                                        {berryType} (x{remainingCount + (isCurrentlySelected ? 1 : 0)}) - {getBerryDescription(berryType)}
                                      </option>
                                    );
                                  }
                                  return null;
                                });
                              })()}
                            </select>
                            {editData[monster.id].berries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBerryDropdown(monster.id, index)}
                                className="button danger"
                                title="Remove this berry"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="edit-section">
                        <div className="section-header">
                          <label>Use Pastries:</label>
                          <button
                            type="button"
                            onClick={() => addPastryDropdown(monster.id)}
                            className="button secondary"
                            title="Add another pastry"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        {editData[monster.id]?.pastries.map((pastry, index) => (
                          <div key={pastry.id} className="dropdown-row">
                            <div className="pastry-inputs">
                              <select
                                value={pastry.type}
                                onChange={(e) => handlePastryChange(monster.id, index, e.target.value)}
                                className="pastry-select"
                              >
                                <option value="">Select pastry</option>
                                {trainerInventory.pastries && Object.entries(trainerInventory.pastries).map(([pastryType, count]) => {
                                  const canUseOnMonster = canPastryBeUsedOnMonster(pastryType, monster);
                                  return count > 0 && canUseOnMonster && (
                                    <option key={pastryType} value={pastryType} title={getPastryDescription(pastryType)}>
                                      {pastryType} (x{count}) - {getPastryDescription(pastryType)}
                                    </option>
                                  );
                                })}
                              </select>
                              {pastry.type && (
                                <input
                                  type="text"
                                  placeholder="Enter value"
                                  value={pastry.value}
                                  onChange={(e) => handlePastryValueChange(monster.id, index, e.target.value)}
                                  className="pastry-value-input"
                                />
                              )}
                            </div>
                            {editData[monster.id].pastries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePastryDropdown(monster.id, index)}
                                className="button danger"
                                title="Remove this pastry"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mass-edit-actions">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="button success"
                >
                  Process All Changes
                </button>
                <button
                  onClick={handleClose}
                  className="button secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="mass-edit-processing">
              <LoadingSpinner />
              <h3>Processing your changes...</h3>
              <div className="processing-status">
                <p>Processing {queuedOperations.length} operations...</p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="mass-edit-results">
              <h3>Mass Edit Complete</h3>
              <div className="results-summary">
                <p>{processingResults.filter(r => r.status === 'success').length} operations completed successfully</p>
                {processingResults.filter(r => r.status === 'error').length > 0 && (
                  <p>{processingResults.filter(r => r.status === 'error').length} operations failed</p>
                )}
              </div>

              <div className="results-details">
                {processingResults.map((result, index) => (
                  <div key={index} className={`result-card ${result.status}`}>
                    {result.status === 'success' && result.updatedMonster ? (
                      <div className="monster-change-card">
                        <div className="change-header">
                          <div className="result-status">
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <div className="monster-info">
                            <h4>{result.displayName || result.currentMonsterName || result.monsterName}</h4>
                            <p className="change-description">{result.message}</p>
                          </div>
                        </div>
                        
                        <div className="monster-comparison">
                          <div className="before-after">
                            <div className="before-section">
                              <h5>Before</h5>
                              <h4>{result.beforeMonster?.name || 'Unknown'}</h4>
                              <div className="monster-mini-card">
                                {result.changeType === 'name' && (
                                  <div className="change-detail">
                                    <span className="change-label">Name:</span>
                                    <span className="change-value old-value">{result.beforeValue}</span>
                                  </div>
                                )}
                                {(result.changeType === 'pastry' || result.changeType === 'berry') && result.beforeMonster && (
                                  <div className="change-details">
                                    <div className="change-detail">
                                      <span className="change-label">All Types:</span>
                                      <div className="type-badges">
                                        {result.beforeMonster.type1 && <span className={`type-badge type-${result.beforeMonster.type1.toLowerCase()}`}>{result.beforeMonster.type1}</span>}
                                        {result.beforeMonster.type2 && <span className={`type-badge type-${result.beforeMonster.type2.toLowerCase()}`}>{result.beforeMonster.type2}</span>}
                                        {result.beforeMonster.type3 && <span className={`type-badge type-${result.beforeMonster.type3.toLowerCase()}`}>{result.beforeMonster.type3}</span>}
                                        {result.beforeMonster.type4 && <span className={`type-badge type-${result.beforeMonster.type4.toLowerCase()}`}>{result.beforeMonster.type4}</span>}
                                        {result.beforeMonster.type5 && <span className={`type-badge type-${result.beforeMonster.type5.toLowerCase()}`}>{result.beforeMonster.type5}</span>}
                                        {!result.beforeMonster.type1 && <span className="type-badge type-none">None</span>}
                                      </div>
                                    </div>
                                    <div className="change-detail">
                                      <span className="change-label">All Species:</span>
                                      <div className="species-list">
                                        {result.beforeMonster.species1 && <span className="species-badge">{result.beforeMonster.species1}</span>}
                                        {result.beforeMonster.species2 && <span className="species-badge">{result.beforeMonster.species2}</span>}
                                        {result.beforeMonster.species3 && <span className="species-badge">{result.beforeMonster.species3}</span>}
                                      </div>
                                    </div>
                                    <div className="change-detail">
                                      <span className="change-label">Attribute:</span>
                                      <span className="change-value old-value">{result.beforeMonster.attribute || 'None'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="arrow-section">
                              <i className="fas fa-arrow-right"></i>
                            </div>
                            
                            <div className="after-section">
                              <h5>After</h5>
                              <h4>{result.updatedMonster.name}</h4>
                              <div className="monster-mini-card">
                                {result.changeType === 'name' && (
                                  <div className="change-detail">
                                    <span className="change-label">Name:</span>
                                    <span className="change-value new-value">{result.afterValue}</span>
                                  </div>
                                )}
                                {(result.changeType === 'pastry' || result.changeType === 'berry') && result.updatedMonster && (
                                  <div className="change-details">
                                    <div className="change-detail">
                                      <span className="change-label">All Types:</span>
                                      <div className="type-badges">
                                        {result.updatedMonster.type1 && <span className={`type-badge type-${result.updatedMonster.type1.toLowerCase()}`}>{result.updatedMonster.type1}</span>}
                                        {result.updatedMonster.type2 && <span className={`type-badge type-${result.updatedMonster.type2.toLowerCase()}`}>{result.updatedMonster.type2}</span>}
                                        {result.updatedMonster.type3 && <span className={`type-badge type-${result.updatedMonster.type3.toLowerCase()}`}>{result.updatedMonster.type3}</span>}
                                        {result.updatedMonster.type4 && <span className={`type-badge type-${result.updatedMonster.type4.toLowerCase()}`}>{result.updatedMonster.type4}</span>}
                                        {result.updatedMonster.type5 && <span className={`type-badge type-${result.updatedMonster.type5.toLowerCase()}`}>{result.updatedMonster.type5}</span>}
                                        {!result.updatedMonster.type1 && <span className="type-badge type-none">None</span>}
                                      </div>
                                    </div>
                                    <div className="change-detail">
                                      <span className="change-label">All Species:</span>
                                      <div className="species-list">
                                        {result.updatedMonster.species1 && <span className="species-badge">{result.updatedMonster.species1}</span>}
                                        {result.updatedMonster.species2 && <span className="species-badge">{result.updatedMonster.species2}</span>}
                                        {result.updatedMonster.species3 && <span className="species-badge">{result.updatedMonster.species3}</span>}
                                      </div>
                                    </div>
                                    <div className="change-detail">
                                      <span className="change-label">Attribute:</span>
                                      <span className="change-value new-value">{result.updatedMonster.attribute || 'None'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show new monster for Divest Berry */}
                        {result.newMonster && (
                          <div className="new-monster-section" >
                            <h5>🎉 New Monster Created!</h5>
                            <div className="monster-mini-card">
                              <h4>{result.newMonster.name}</h4>
                              <div className="change-details">
                                <div className="change-detail">
                                  <span className="change-label">Species:</span>
                                  <div className="species-list">
                                    {result.newMonster.species1 && <span className="species-badge">{result.newMonster.species1}</span>}
                                    {result.newMonster.species2 && <span className="species-badge">{result.newMonster.species2}</span>}
                                    {result.newMonster.species3 && <span className="species-badge">{result.newMonster.species3}</span>}
                                  </div>
                                </div>
                                <div className="change-detail">
                                  <span className="change-label">Types:</span>
                                  <div className="type-badges">
                                    {result.newMonster.type1 && <span className={`type-badge type-${result.newMonster.type1.toLowerCase()}`}>{result.newMonster.type1}</span>}
                                    {result.newMonster.type2 && <span className={`type-badge type-${result.newMonster.type2.toLowerCase()}`}>{result.newMonster.type2}</span>}
                                    {result.newMonster.type3 && <span className={`type-badge type-${result.newMonster.type3.toLowerCase()}`}>{result.newMonster.type3}</span>}
                                    {result.newMonster.type4 && <span className={`type-badge type-${result.newMonster.type4.toLowerCase()}`}>{result.newMonster.type4}</span>}
                                    {result.newMonster.type5 && <span className={`type-badge type-${result.newMonster.type5.toLowerCase()}`}>{result.newMonster.type5}</span>}
                                  </div>
                                </div>
                                <div className="change-detail">
                                  <span className="change-label">Attribute:</span>
                                  <span className="change-value">{result.newMonster.attribute || 'None'}</span>
                                </div>
                                <div className="change-detail">
                                  <span className="change-label">Level:</span>
                                  <span className="change-value">{result.newMonster.level || 1}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {result.needsSelection && (
                          <div className="species-selection-needed">
                            <p>Species selection required - this will be handled separately</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="simple-result-item">
                        <div className="result-status">
                          <i className={`fas ${result.status === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        </div>
                        <div className="result-message">
                          <p>{result.message}</p>
                          {result.needsSelection && (
                            <div className="species-selection-needed">
                              <p>Species selection required - this will be handled separately</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="results-actions">
                <button
                  onClick={handleClose}
                  className="button primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Species Selection Modal */}
      {showSpeciesSelectionModal && (
        <div className="mass-edit-modal-overlay">
          <div className="mass-edit-modal species-selection-modal">
            <div className="mass-edit-header">
              <h2>Species Selection Required</h2>
            </div>
            <div className="mass-edit-content">
              <div className="species-selection-content">
                <p>Some berries require species selection. Please select a species for each berry operation:</p>
                
                {pendingBerryOperations.map((op) => {
                  const monster = monsters.find(m => m.id === op.monsterId);
                  const speciesSlot = getSpeciesSlotAffected(op.berryType);
                  const availableSpecies = rolledSpeciesForOperations[op.operationId] || [];
                  
                  return (
                    <div key={op.operationId} className="species-operation-selection">
                      <div className="operation-header">
                        <div className="monster-mini-info">
                          <img 
                            src={monster?.img_link || '/images/default_mon.png'} 
                            alt={monster?.name || 'Monster'}
                            onError={(e) => {
                              e.target.src = `/images/default_mon.png`;
                            }}
                            className="monster-selection-image"
                          />
                          <div className="monster-selection-details">
                            <h4>{monster?.name || op.monsterName}</h4>
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
                            <div className="current-attribute">
                              <span className={`attribute-badge attribute-${monster?.attribute?.toLowerCase() || 'none'}`}>
                                {monster?.attribute || 'None'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="berry-info">
                          <h4>{op.berryType}</h4>
                          <p className="berry-effect">{getBerryDescription(op.berryType)}</p>
                          <p className="species-slot-info">
                            Affecting: <strong>Species {speciesSlot}</strong>
                          </p>
                        </div>
                      </div>
                      
                      <div className="species-selection-grid">
                        {availableSpecies.map((species, index) => {
                          const speciesImage = speciesImages[species];
                          return (
                            <button
                              key={index}
                              className={`species-selection-item ${
                                selectedSpeciesForOperations[op.operationId] === species ? 'selected' : ''
                              }`}
                              onClick={() => handleSpeciesSelection(op.operationId, species)}
                            >
                              {speciesImage?.image_url && (
                                <img 
                                  src={speciesImage.image_url} 
                                  alt={species}
                                  className="species-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
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
                
                <div className="species-selection-actions">
                  <button
                    onClick={() => setShowSpeciesSelectionModal(false)}
                    className="button secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={completeSpeciesBerryProcessing}
                    disabled={pendingBerryOperations.some(op => !selectedSpeciesForOperations[op.operationId])}
                    className="button primary"
                  >
                    Apply Selected Species
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MassEditModal;