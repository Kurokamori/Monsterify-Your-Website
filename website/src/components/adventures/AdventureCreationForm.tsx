import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import {
  Adventure,
  AdventureType,
  AdventureFormData,
  Landmass,
  Region,
  Area,
  AreaRequirements,
  Trainer,
  UserInventory,
  KeyItem,
  EMOJI_PRESETS
} from './types';

interface AdventureCreationFormProps {
  onAdventureCreated?: (adventure: Adventure) => void;
}

interface RequirementCheckResult {
  missionMandate?: boolean;
  missionMandateQuantity?: number;
  specificItem?: boolean;
  specificItemQuantity?: number;
}

export const AdventureCreationForm = ({ onAdventureCreated }: AdventureCreationFormProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [threadEmoji, setThreadEmoji] = useState('🗡️');
  const [adventureType, setAdventureType] = useState<AdventureType>('custom');
  const [selectedLandmass, setSelectedLandmass] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmasses, setLandmasses] = useState<Landmass[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [areaRequirements, setAreaRequirements] = useState<AreaRequirements | null>(null);
  const [userInventory, setUserInventory] = useState<UserInventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Load trainers for the current user
  const loadTrainers = useCallback(async () => {
    try {
      if (!currentUser?.discord_id) return;

      const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
      if (response.data.success) {
        setTrainers(response.data.trainers || response.data.data || []);
      } else {
        setError('Failed to load trainers');
      }
    } catch (err) {
      console.error('Error loading trainers:', err);
      setError('Failed to load trainers');
    }
  }, [currentUser?.discord_id]);

  // Load landmasses when component mounts or adventure type changes
  useEffect(() => {
    if (adventureType === 'prebuilt') {
      loadLandmasses();
    }
    loadTrainers();
  }, [adventureType, loadTrainers]);

  const loadLandmasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/areas/landmasses');
      if (response.data.success) {
        setLandmasses(response.data.landmasses);
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

  const handleLandmassChange = async (landmassId: string) => {
    setSelectedLandmass(landmassId);
    setSelectedRegion('');
    setSelectedArea('');
    setRegions([]);
    setAreas([]);

    if (landmassId) {
      await loadRegions(landmassId);
    }
  };

  const loadRegions = async (landmassId: string) => {
    try {
      const response = await api.get(`/areas/landmasses/${landmassId}/regions`);
      if (response.data.success) {
        setRegions(response.data.regions);
      } else {
        setError('Failed to load regions');
      }
    } catch (err) {
      console.error('Error loading regions:', err);
      setError('Failed to load regions');
    }
  };

  const handleRegionChange = async (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedArea('');
    setAreas([]);

    if (regionId) {
      await loadAreas(regionId);
    }
  };

  const loadAreas = async (regionId: string) => {
    try {
      const response = await api.get(`/areas/regions/${regionId}/areas`);
      if (response.data.success) {
        setAreas(response.data.areas || response.data.data || []);
      } else {
        setError('Failed to load areas');
      }
    } catch (err) {
      console.error('Error loading areas:', err);
      setError('Failed to load areas');
    }
  };

  const handleAreaChange = async (areaId: string) => {
    setSelectedArea(areaId);
    setUserInventory(null);

    if (areaId) {
      await loadAreaRequirements(areaId);
    } else {
      setAreaRequirements(null);
    }
  };

  const loadAreaRequirements = async (areaId: string) => {
    try {
      const response = await api.get(`/areas/${areaId}/configuration`);
      if (response.data.success) {
        setAreaRequirements(response.data.configuration.itemRequirements || null);
      } else {
        setAreaRequirements(null);
      }
    } catch (err) {
      console.error('Error loading area requirements:', err);
      setAreaRequirements(null);
    }
  };

  const loadUserInventory = async (trainerId: number) => {
    try {
      setInventoryLoading(true);
      const response = await api.get(`/trainers/${trainerId}/inventory`);
      if (response.data.success && response.data.data) {
        setUserInventory(response.data.data);
      } else if (response.data.inventory) {
        setUserInventory(response.data.inventory);
      } else {
        setUserInventory(null);
      }
    } catch (err) {
      console.error('Error loading user inventory:', err);
      setUserInventory(null);
    } finally {
      setInventoryLoading(false);
    }
  };

  const getItemQuantity = (inventory: UserInventory | null, itemName: string): number => {
    if (!inventory || !itemName) return 0;

    const keyItems: KeyItem[] = inventory.keyitems || inventory.keyItems || inventory.key_items || [];

    if (Array.isArray(keyItems)) {
      const item = keyItems.find(item => {
        const name = item.name || item.item_name || item.itemName;
        if (name === itemName) return true;
        if (itemName.toLowerCase().includes('mission mandate') &&
            name?.toLowerCase().includes('mission mandate')) {
          return true;
        }
        return false;
      });
      return item ? (item.quantity || item.amount || 1) : 0;
    }

    return 0;
  };

  const hasRequiredItems = (
    requirements: AreaRequirements | null,
    inventory: UserInventory | null
  ): RequirementCheckResult | null => {
    if (!requirements || !inventory) return null;

    const results: RequirementCheckResult = {};

    if (requirements.needsMissionMandate !== false) {
      const quantity = getItemQuantity(inventory, 'Mission Mandate');
      results.missionMandate = quantity > 0;
      results.missionMandateQuantity = quantity;
    }

    if (requirements.itemRequired) {
      const quantity = getItemQuantity(inventory, requirements.itemRequired);
      results.specificItem = quantity > 0;
      results.specificItemQuantity = quantity;
    }

    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (adventureType === 'prebuilt' && areaRequirements && userInventory) {
      const itemCheck = hasRequiredItems(areaRequirements, userInventory);

      if (itemCheck?.missionMandate === false) {
        setError('Your selected trainer does not have a Mission Mandate required for this area.');
        return;
      }

      if (areaRequirements.itemRequired && itemCheck?.specificItem === false) {
        setError(`Your selected trainer does not have the required item: ${areaRequirements.itemRequired}`);
        return;
      }
    }

    try {
      setLoading(true);

      const adventureData: AdventureFormData = {
        title: title.trim(),
        description: description.trim() || '',
        threadEmoji: threadEmoji.trim() || '🗡️',
        adventureType,
        landmass: selectedLandmass,
        region: selectedRegion,
        area: selectedArea,
        selectedTrainer
      };

      const response = await api.post('/adventures', adventureData);

      if (onAdventureCreated) {
        onAdventureCreated(response.data.adventure);
      }

      navigate(`/adventures/${response.data.adventure.id}`);
    } catch (err) {
      console.error('Error creating adventure:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create adventure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainerSelect = async (trainerName: string) => {
    setSelectedTrainer(trainerName);

    if (trainerName) {
      const trainer = trainers.find(t => t.name === trainerName);
      if (trainer) {
        await loadUserInventory(trainer.id);
      }
    } else {
      setUserInventory(null);
    }
  };

  if (loading && regions.length === 0) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="adventure-creation">
      <h2>Create New Adventure</h2>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <form className="adventure-creation__form" onSubmit={handleSubmit}>
        {/* Adventure Type Selection */}
        <div className="selection-step">
          <h4>Adventure Type</h4>

          <div className="adventure-type-selection">
            <div
              className={`adventure-type-card ${adventureType === 'custom' ? 'adventure-type-card--selected' : ''}`}
              onClick={() => setAdventureType('custom')}
            >
              <div className="adventure-type-card__icon">
                <i className="fas fa-edit"></i>
              </div>
              <h4>Custom Adventure</h4>
              <p>
                Create your own unique adventure with custom encounters and storylines.
              </p>
            </div>

            <div
              className={`adventure-type-card ${adventureType === 'prebuilt' ? 'adventure-type-card--selected' : ''}`}
              onClick={() => setAdventureType('prebuilt')}
            >
              <div className="adventure-type-card__icon">
                <i className="fas fa-map"></i>
              </div>
              <h4>Prebuilt Adventure</h4>
              <p>
                Choose from predefined regions and areas with established encounters.
              </p>
            </div>
          </div>
        </div>

        {/* Prebuilt Adventure Location Selection */}
        {adventureType === 'prebuilt' && (
          <div className="selection-step">
            <h4>Select Adventure Location</h4>

            {/* Landmass Selection */}
            <div className="selection-step">
              <h4>1. Choose Landmass</h4>
              {landmasses.length > 0 ? (
                <div className="location-grid">
                  {landmasses.map(landmass => (
                    <div
                      key={landmass.id}
                      className={`location-card ${selectedLandmass === String(landmass.id) ? 'location-card--selected' : ''}`}
                      onClick={() => handleLandmassChange(String(landmass.id))}
                    >
                      <h5>{landmass.name}</h5>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="adventure-creation__loading-text">Loading landmasses...</p>
              )}
            </div>

            {/* Region Selection */}
            {selectedLandmass && (
              <div className="selection-step">
                <h4>2. Choose Region</h4>
                {regions.length > 0 ? (
                  <div className="location-grid">
                    {regions.map(region => (
                      <div
                        key={region.id}
                        className={`location-card ${selectedRegion === String(region.id) ? 'location-card--selected' : ''}`}
                        onClick={() => handleRegionChange(String(region.id))}
                      >
                        <h5>{region.name}</h5>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="adventure-creation__loading-text">Loading regions...</p>
                )}
              </div>
            )}

            {/* Area Selection */}
            {selectedRegion && (
              <div className="selection-step">
                <h4>3. Choose Area</h4>
                {areas.length > 0 ? (
                  <div className="location-grid">
                    {areas.map(area => (
                      <div
                        key={area.id}
                        className={`location-card ${selectedArea === String(area.id) ? 'location-card--selected' : ''}`}
                        onClick={() => handleAreaChange(String(area.id))}
                      >
                        <h5>{area.name}</h5>
                        {area.welcomeMessage && <p>{area.welcomeMessage}</p>}
                        {selectedArea === String(area.id) && areaRequirements && (
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
                  <p className="adventure-creation__loading-text">Loading areas...</p>
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
                                hasRequiredItems(areaRequirements, userInventory)?.missionMandate
                                  ? 'inventory-count--has-item'
                                  : 'inventory-count--missing-item'
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
                                hasRequiredItems(areaRequirements, userInventory)?.specificItem
                                  ? 'inventory-count--has-item'
                                  : 'inventory-count--missing-item'
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
                      <p className="select-trainer-hint">
                        Select a trainer above to check if they have the required items.
                      </p>
                    )}
                  </div>
                )}

                {trainers.length > 0 ? (
                  <select
                    className="input"
                    value={selectedTrainer}
                    onChange={(e) => handleTrainerSelect(e.target.value)}
                  >
                    <option value="">Select a trainer...</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.name}>
                        {trainer.name} (Level {trainer.level})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="adventure-creation__loading-text">Loading trainers...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="selection-step">
          <h4>Adventure Details</h4>

          <div className="form-group">
            <label htmlFor="adventure-title">Title *</label>
            <input
              id="adventure-title"
              type="text"
              className="input"
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
              className="input"
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
                className="input emoji-selection"
                value={threadEmoji}
                onChange={(e) => setThreadEmoji(e.target.value)}
                placeholder="🗡️"
                maxLength={2}
              />
              <div className="emoji-presets">
                <span>Quick select:</span>
                <div className="emoji-presets">
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-preset ${threadEmoji === emoji ? 'emoji-preset--selected' : ''}`}
                      onClick={() => setThreadEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="adventure-creation__actions">
          <button
            type="submit"
            className="button primary"
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
