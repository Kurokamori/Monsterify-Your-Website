import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adventureService from '../../services/adventureService';
import areaService from '../../services/areaService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AdventureCreationForm = ({ onAdventureCreated }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [threadEmoji, setThreadEmoji] = useState('🗡️'); // Default adventure emoji
  const [adventureType, setAdventureType] = useState('custom'); // 'custom' or 'prebuilt'
  const [selectedLandmass, setSelectedLandmass] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [landmasses, setLandmasses] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [areaRequirements, setAreaRequirements] = useState(null);
  const [userInventory, setUserInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Load landmasses when component mounts or adventure type changes
  useEffect(() => {
    if (adventureType === 'prebuilt') {
      loadLandmasses();
    }
    loadTrainers();
  }, [adventureType]);

  // Load available landmasses
  const loadLandmasses = async () => {
    try {
      setLoading(true);
      const response = await areaService.getLandmasses();
      if (response.success) {
        setLandmasses(response.landmasses);
      } else {
        setError('Failed to load landmasses');
      }
    } catch (err) {
      console.error('Error loading landmasses:', err);
      setError('Failed to load landmasses');
    } finally {
      setLoading(false);
    }
  };

  // Handle landmass selection
  const handleLandmassChange = async (landmassId) => {
    setSelectedLandmass(landmassId);
    setSelectedRegion('');
    setSelectedArea('');
    setRegions([]);
    setAreas([]);

    if (landmassId) {
      await loadRegions(landmassId);
    }
  };

  // Load regions when landmass is selected
  const loadRegions = async (landmassId) => {
    try {
      const response = await areaService.getRegions(landmassId);
      if (response.success) {
        setRegions(response.regions);
      } else {
        setError('Failed to load regions');
      }
    } catch (err) {
      console.error('Error loading regions:', err);
      setError('Failed to load regions');
    }
  };

  // Handle region selection
  const handleRegionChange = async (regionId) => {
    setSelectedRegion(regionId);
    setSelectedArea('');
    setAreas([]);

    if (regionId) {
      await loadAreas(regionId);
    }
  };

  // Load areas when region is selected
  const loadAreas = async (regionId) => {
    try {
      const response = await areaService.getAreas(regionId);
      if (response.success) {
        setAreas(response.areas);
      } else {
        setError('Failed to load areas');
      }
    } catch (err) {
      console.error('Error loading areas:', err);
      setError('Failed to load areas');
    }
  };

  // Handle area selection
  const handleAreaChange = async (areaId) => {
    setSelectedArea(areaId);
    setUserInventory(null); // Reset inventory when area changes

    if (areaId) {
      await loadAreaRequirements(areaId);
    } else {
      setAreaRequirements(null);
    }
  };

  // Load trainers for the current user
  const loadTrainers = async () => {
    try {
      const response = await trainerService.getUserTrainers(currentUser.discord_id);
      if (response.success) {
        setTrainers(response.trainers);
      } else {
        setError('Failed to load trainers');
      }
    } catch (err) {
      console.error('Error loading trainers:', err);
      setError('Failed to load trainers');
    }
  };

  // Load area requirements
  const loadAreaRequirements = async (areaId) => {
    try {
      console.log('Loading area requirements for area ID:', areaId);
      const response = await areaService.getAreaConfiguration(areaId);
      console.log('Area configuration response:', response);
      if (response.success) {
        console.log('Area item requirements:', response.configuration.itemRequirements);
        setAreaRequirements(response.configuration.itemRequirements || null);
      } else {
        console.log('Failed to get area configuration');
        setAreaRequirements(null);
      }
    } catch (err) {
      console.error('Error loading area requirements:', err);
      setAreaRequirements(null);
    }
  };

  // Load user inventory for the selected trainer
  const loadUserInventory = async (trainerId) => {
    try {
      console.log('Loading inventory for trainer ID:', trainerId);
      setInventoryLoading(true);
      const response = await trainerService.getTrainerInventory(trainerId);
      console.log('Trainer inventory response:', response);
      if (response.success && response.data) {
        console.log('Setting user inventory:', response.data);
        setUserInventory(response.data);
      } else if (response.inventory) {
        console.log('Setting user inventory from inventory field:', response.inventory);
        setUserInventory(response.inventory);
      } else {
        console.log('No inventory data found in response');
        setUserInventory(null);
      }
    } catch (err) {
      console.error('Error loading user inventory:', err);
      setUserInventory(null);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Get item quantity from inventory
  const getItemQuantity = (inventory, itemName) => {
    console.log('Checking quantity for item:', itemName, 'in inventory:', inventory);
    if (!inventory || !itemName) {
      console.log('Missing inventory or itemName');
      return 0;
    }
    
    // Try different possible inventory structures
    const keyItems = inventory.keyitems || inventory.keyItems || inventory.key_items || [];
    console.log('Key items available:', keyItems);
    
    // Handle case where keyItems might be an object instead of array
    let quantity = 0;
    
    if (Array.isArray(keyItems)) {
      // keyItems is an array of item objects
      const item = keyItems.find(item => {
        const itemName1 = item.name || item.item_name || item.itemName;
        const itemName2 = itemName;
        
        // Direct match
        if (itemName1 === itemName2) return true;
        
        // Mission mandate special case
        if (itemName.toLowerCase().includes('mission mandate') && 
            itemName1?.toLowerCase().includes('mission mandate')) {
          return true;
        }
        
        return false;
      });
      
      console.log('Found item:', item);
      quantity = item ? (item.quantity || item.amount || 1) : 0;
    } else {
      // keyItems is an object with itemName: quantity structure
      quantity = keyItems[itemName] || 0;
      console.log('Found item quantity directly:', quantity);
    }
    
    console.log('Returning quantity:', quantity);
    return quantity;
  };

  // Check if user has required items
  const hasRequiredItems = (requirements, inventory) => {
    if (!requirements || !inventory) return null;
    
    const results = {};
    
    // Check mission mandate
    if (requirements.needsMissionMandate !== false) {
      const quantity = getItemQuantity(inventory, 'Mission Mandate');
      results.missionMandate = quantity > 0;
      results.missionMandateQuantity = quantity;
    }
    
    // Check specific required item
    if (requirements.itemRequired) {
      const quantity = getItemQuantity(inventory, requirements.itemRequired);
      results.specificItem = quantity > 0;
      results.specificItemQuantity = quantity;
    }
    
    return results;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      setError('Please provide a title for your adventure.');
      return;
    }

    if (adventureType === 'prebuilt' && (!selectedLandmass || !selectedRegion || !selectedArea)) {
      setError('Please select a landmass, region, and area for prebuilt adventures.');
      return;
    }

    if (adventureType === 'prebuilt' && !selectedTrainer) {
      setError('Please select a trainer for this adventure.');
      return;
    }

    // Check inventory requirements if area has requirements
    if (adventureType === 'prebuilt' && areaRequirements && userInventory) {
      const itemCheck = hasRequiredItems(areaRequirements, userInventory);
      
      if (itemCheck.missionMandate === false) {
        setError('Your selected trainer does not have a Mission Mandate required for this area.');
        return;
      }
      
      if (areaRequirements.itemRequired && itemCheck.specificItem === false) {
        setError(`Your selected trainer does not have the required item: ${areaRequirements.itemRequired}`);
        return;
      }
    }

    try {
      setLoading(true);

      const adventureData = {
        title: title.trim(),
        description: description.trim() || undefined,
        threadEmoji: threadEmoji.trim() || '🗡️',
        adventureType,
        landmass: selectedLandmass,
        region: selectedRegion,
        area: selectedArea,
        selectedTrainer: selectedTrainer
      };

      // Create the adventure
      const response = await adventureService.createAdventure(adventureData);

      // Notify parent component
      if (onAdventureCreated) {
        onAdventureCreated(response.adventure);
      }

      // Navigate to the new adventure
      navigate(`/adventures/${response.adventure.id}`);

    } catch (err) {
      console.error('Error creating adventure:', err);
      setError(err.response?.data?.message || 'Failed to create adventure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && regions.length === 0) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="adventure-creation-form-container">
      <h2>Create New Adventure</h2>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      <form className="adventure-creation-form" onSubmit={handleSubmit}>
        {/* Adventure Type Selection */}
        <div className="form-section">
          <h3>Adventure Type</h3>

          <div className="adventure-type-selection">
            <div
              className={`adventure-type-card ${adventureType === 'custom' ? 'selected' : ''}`}
              onClick={() => setAdventureType('custom')}
            >
              <div className="type-icon">
                <i className="fas fa-edit"></i>
              </div>
              <h4>Custom Adventure</h4>
              <p>Create your own unique adventure with custom encounters and storylines.</p>
            </div>

            <div
              className={`adventure-type-card ${adventureType === 'prebuilt' ? 'selected' : ''}`}
              onClick={() => setAdventureType('prebuilt')}
            >
              <div className="type-icon">
                <i className="fas fa-map"></i>
              </div>
              <h4>Prebuilt Adventure</h4>
              <p>Choose from predefined regions and areas with established encounters.</p>
            </div>
          </div>
        </div>

        {/* Landmass, Region and Area Selection for Prebuilt Adventures */}
        {adventureType === 'prebuilt' && (
          <div className="form-section">
            <h3>Select Adventure Location</h3>

            {/* Landmass Selection */}
            <div className="selection-step">
              <h4>1. Choose Landmass</h4>
              {landmasses.length > 0 ? (
                <div className="landmasses-grid">
                  {landmasses.map(landmass => (
                    <div
                      key={landmass.id}
                      className={`landmass-card ${selectedLandmass === landmass.id ? 'selected' : ''}`}
                      onClick={() => handleLandmassChange(landmass.id)}
                    >
                      <h5>{landmass.name}</h5>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Loading landmasses...</p>
              )}
            </div>

            {/* Region Selection */}
            {selectedLandmass && (
              <div className="selection-step">
                <h4>2. Choose Region</h4>
                {regions.length > 0 ? (
                  <div className="regions-grid">
                    {regions.map(region => (
                      <div
                        key={region.id}
                        className={`region-card ${selectedRegion === region.id ? 'selected' : ''}`}
                        onClick={() => handleRegionChange(region.id)}
                      >
                        <h5>{region.name}</h5>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Loading regions...</p>
                )}
              </div>
            )}

            {/* Area Selection */}
            {selectedRegion && (
              <div className="selection-step">
                <h4>3. Choose Area</h4>
                {areas.length > 0 ? (
                  <div className="areas-grid">
                    {areas.map(area => (
                      <div
                        key={area.id}
                        className={`area-card ${selectedArea === area.id ? 'selected' : ''}`}
                        onClick={() => handleAreaChange(area.id)}
                      >
                        <h5>{area.name}</h5>
                        <p>{area.welcomeMessage}</p>
                        {selectedArea === area.id && areaRequirements && (
                          <div className="area-requirements-preview">
                            <strong>Requires:</strong>
                            {areaRequirements.needsMissionMandate !== false && (
                              <span className="req-item">Mission Mandate</span>
                            )}
                            {areaRequirements.itemRequired && (
                              <span className="req-item">{areaRequirements.itemRequired}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Loading areas...</p>
                )}
              </div>
            )}

            {/* Trainer Selection */}
            {selectedArea && (
              <div className="selection-step">
                <h4>4. Select Trainer</h4>
                {areaRequirements && (
                  <div className="requirements-info">
                    <h5>Area Requirements:</h5>
                    <div className="requirements-list">
                      {areaRequirements.needsMissionMandate !== false && (
                        <div className="requirement-item">
                          <div className="requirement-details">
                            <span className="requirement-name">• Mission Mandate</span>
                            <span className="requirement-description">Required for access</span>
                          </div>
                          {selectedTrainer && userInventory && (
                            <div className="trainer-inventory">
                              <span className="inventory-label">You have:</span>
                              <span className={`inventory-count ${
                                hasRequiredItems(areaRequirements, userInventory)?.missionMandate ? 'has-item' : 'missing-item'
                              }`}>
                                {hasRequiredItems(areaRequirements, userInventory)?.missionMandateQuantity || 0}
                                {hasRequiredItems(areaRequirements, userInventory)?.missionMandate ? ' ✓' : ' ✗'}
                              </span>
                            </div>
                          )}
                          {selectedTrainer && !userInventory && !inventoryLoading && (
                            <span className="inventory-unknown">? (Unable to check)</span>
                          )}
                        </div>
                      )}
                      {areaRequirements.itemRequired && (
                        <div className="requirement-item">
                          <div className="requirement-details">
                            <span className="requirement-name">• {areaRequirements.itemRequired}</span>
                            <span className="requirement-description">Special area access item</span>
                          </div>
                          {selectedTrainer && userInventory && (
                            <div className="trainer-inventory">
                              <span className="inventory-label">You have:</span>
                              <span className={`inventory-count ${
                                hasRequiredItems(areaRequirements, userInventory)?.specificItem ? 'has-item' : 'missing-item'
                              }`}>
                                {hasRequiredItems(areaRequirements, userInventory)?.specificItemQuantity || 0}
                                {hasRequiredItems(areaRequirements, userInventory)?.specificItem ? ' ✓' : ' ✗'}
                              </span>
                            </div>
                          )}
                          {selectedTrainer && !userInventory && !inventoryLoading && (
                            <span className="inventory-unknown">? (Unable to check)</span>
                          )}
                        </div>
                      )}
                    </div>
                    {inventoryLoading && (
                      <p className="inventory-loading">Checking trainer inventory...</p>
                    )}
                    {selectedTrainer && !userInventory && !inventoryLoading && (
                      <p className="inventory-error">Unable to load trainer inventory.</p>
                    )}
                    {!selectedTrainer && (
                      <p className="select-trainer-hint">Select a trainer above to check if they have the required items.</p>
                    )}
                  </div>
                )}
                {trainers.length > 0 ? (
                  <div className="trainer-selection">
                    <select
                      value={selectedTrainer}
                      onChange={async (e) => {
                        const trainerName = e.target.value;
                        setSelectedTrainer(trainerName);
                        
                        if (trainerName) {
                          // Find the trainer object to get ID
                          const trainer = trainers.find(t => t.name === trainerName);
                          if (trainer) {
                            await loadUserInventory(trainer.id);
                          }
                        } else {
                          setUserInventory(null);
                        }
                      }}
                      className="trainer-select"
                    >
                      <option value="">Select a trainer...</option>
                      {trainers.map(trainer => (
                        <option key={trainer.id} value={trainer.name}>
                          {trainer.name} (Level {trainer.level})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p>Loading trainers...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="form-section">
          <h3>Adventure Details</h3>

          <div className="form-group">
            <label htmlFor="adventure-title">Title *</label>
            <input
              id="adventure-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your adventure"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adventure-description">Description (Optional)</label>
            <textarea
              id="adventure-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your adventure (optional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="thread-emoji">Discord Thread Emoji</label>
            <div className="emoji-selection">
              <input
                id="thread-emoji"
                type="text"
                value={threadEmoji}
                onChange={(e) => setThreadEmoji(e.target.value)}
                placeholder="🗡️"
                maxLength={2}
                className="emoji-input"
              />
              <div className="emoji-presets">
                <span>Quick select:</span>
                {['🗡️', '⚔️', '🏹', '🛡️', '🌟', '🔥', '❄️', '⚡', '🌊', '🌿', '🏔️', '🌋'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-preset ${threadEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setThreadEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button success"
            disabled={loading || (adventureType === 'prebuilt' && (!selectedRegion || !selectedArea))}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Creating...
              </>
            ) : (
              'Create Adventure'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdventureCreationForm;
