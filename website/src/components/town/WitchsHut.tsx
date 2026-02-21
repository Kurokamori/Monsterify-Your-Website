import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import type { Monster } from '../common/MonsterDetails';
import type {
  TownTrainer,
  EvolutionOption,
  EvolutionPreview,
  EvolutionItem,
  EvolutionInventory,
  EvolvedMonster,
  WitchsHutProps
} from './types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';

// Evolution items configuration
const EVOLUTION_ITEMS: EvolutionItem[] = [
  { id: 'Fire Stone', desc: 'Adds the Fire type on evolution', type: 'Fire' },
  { id: 'Water Stone', desc: 'Adds the Water type on evolution', type: 'Water' },
  { id: 'Thunder Stone', desc: 'Adds the Electric type on evolution', type: 'Electric' },
  { id: 'Leaf Stone', desc: 'Adds the Grass type on evolution', type: 'Grass' },
  { id: 'Moon Stone', desc: 'Adds the Fairy type on evolution', type: 'Fairy' },
  { id: 'Sun Stone', desc: 'Adds the Bug type on evolution', type: 'Bug' },
  { id: 'Shiny Stone', desc: 'Adds the Ghost type on evolution', type: 'Ghost' },
  { id: 'Dusk Stone', desc: 'Adds the Dark type on evolution', type: 'Dark' },
  { id: 'Dawn Stone', desc: 'Adds the Psychic type on evolution', type: 'Psychic' },
  { id: 'Ice Stone', desc: 'Adds the Ice type on evolution', type: 'Ice' },
  { id: 'Dragon Scale', desc: 'Adds the Dragon type on evolution', type: 'Dragon' },
  { id: 'Metal Coat', desc: 'Adds the Steel type on evolution', type: 'Steel' },
  { id: "Sensei's Pillow", desc: 'Adds the Fighting type on evolution', type: 'Fighting' },
  { id: 'Poison Fang', desc: 'Adds the Poison type on evolution', type: 'Poison' },
  { id: 'Amber Stone', desc: 'Adds the Ground type on evolution', type: 'Ground' },
  { id: 'Glass Wing', desc: 'Adds the Flying type on evolution', type: 'Flying' },
  { id: 'Chalk Dust', desc: 'Adds the Rock type on evolution', type: 'Rock' },
  { id: 'Aurora Stone', desc: 'Adds a random type on evolution', type: 'Random' },
  { id: 'Normal Stone', desc: 'Adds the Normal type on evolution', type: 'Normal' }
];

type SpeciesSlot = 'species1' | 'species2' | 'species3';

/**
 * WitchsHut component for evolving monsters
 * Features trainer selection, monster selection, and multi-step evolution wizard
 */
export function WitchsHut({ className = '', onEvolutionComplete }: WitchsHutProps) {
  const { currentUser } = useAuth();

  // Trainer and monster state
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | number | null>(null);
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [trainerInventory, setTrainerInventory] = useState<EvolutionInventory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected monster and modal state
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);

  // Evolution form state
  const [selectedSpeciesSlot, setSelectedSpeciesSlot] = useState<SpeciesSlot>('species1');
  const [evolutionOptions, setEvolutionOptions] = useState<EvolutionOption[]>([]);
  const [selectedEvolution, setSelectedEvolution] = useState('');
  const [evolutionPreview, setEvolutionPreview] = useState<EvolutionPreview | null>(null);
  const [useDigitalRepairKit, setUseDigitalRepairKit] = useState(false);
  const [customSpeciesName, setCustomSpeciesName] = useState('');
  const [selectedEvolutionItem, setSelectedEvolutionItem] = useState('');

  // Image submission state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [useVoidStone, setUseVoidStone] = useState(false);

  // Loading and status state
  const [loading, setLoading] = useState(false);
  const [loadingEvolutionOptions, setLoadingEvolutionOptions] = useState(false);
  const [error, setError] = useState('');
  const [evolutionError, setEvolutionError] = useState('');
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);
  const [evolvedMonster, setEvolvedMonster] = useState<EvolvedMonster | null>(null);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        setLoading(true);
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = response.data.data || response.data.trainers || [];
        setUserTrainers(trainers);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [currentUser?.discord_id]);

  // Fetch trainer monsters and inventory when trainer is selected
  useEffect(() => {
    if (!selectedTrainer) {
      setTrainerMonsters([]);
      setTrainerInventory(null);
      return;
    }

    const fetchTrainerData = async () => {
      try {
        setLoading(true);
        setError('');

        const [monstersResponse, inventoryResponse] = await Promise.all([
          api.get(`/monsters/trainer/${selectedTrainer}`),
          api.get(`/trainers/${selectedTrainer}/inventory`)
        ]);

        setTrainerMonsters(monstersResponse.data.monsters || []);
        setTrainerInventory(inventoryResponse.data.data || { evolution: {} });
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainer data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, [selectedTrainer]);

  // Filter monsters with valid images and search term
  const filteredMonsters = useMemo(() => {
    const withImages = trainerMonsters.filter(m => m.img_link?.trim());
    if (!searchTerm.trim()) return withImages;

    const term = searchTerm.toLowerCase();
    return withImages.filter(monster =>
      monster.name?.toLowerCase().includes(term) ||
      monster.species1?.toLowerCase().includes(term) ||
      monster.species2?.toLowerCase().includes(term) ||
      monster.species3?.toLowerCase().includes(term)
    );
  }, [trainerMonsters, searchTerm]);

  // Check if trainer has an evolution item
  const hasEvolutionItem = useCallback((itemName: string): boolean => {
    if (!trainerInventory?.evolution) return false;
    // Handle Aurora Stone -> Aurora Evolution Stone mapping
    const inventoryKey = itemName === 'Aurora Stone' ? 'Aurora Evolution Stone' : itemName;
    return (trainerInventory.evolution[inventoryKey] || 0) > 0;
  }, [trainerInventory]);

  // Get item count from inventory
  const getItemCount = useCallback((itemName: string): number => {
    if (!trainerInventory?.evolution) return 0;
    const inventoryKey = itemName === 'Aurora Stone' ? 'Aurora Evolution Stone' : itemName;
    return trainerInventory.evolution[inventoryKey] || 0;
  }, [trainerInventory]);

  // Fetch evolution preview
  const fetchEvolutionPreview = useCallback(async (evolutionName: string, evolutionType: string) => {
    if (!evolutionName) return;

    try {
      if (evolutionType === 'pokemon') {
        const response = await api.get('/fakemon/search', {
          params: { name: evolutionName }
        });

        if (response.data?.success && response.data.data?.length > 0) {
          setEvolutionPreview(response.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching evolution preview:', err);
    }
  }, []);

  // Fetch evolution options for a species
  const fetchEvolutionOptions = useCallback(async (monster: Monster, speciesSlot: SpeciesSlot) => {
    if (!monster || !monster[speciesSlot]) return;

    try {
      setLoadingEvolutionOptions(true);
      setEvolutionOptions([]);
      setSelectedEvolution('');
      setEvolutionPreview(null);

      const response = await api.get(`/monsters/${monster.id}/evolution-options`, {
        params: { speciesSlot }
      });

      if (response.data?.success && response.data.data) {
        setEvolutionOptions(response.data.data);

        // Auto-select if only one option
        if (response.data.data.length === 1) {
          const option = response.data.data[0];
          setSelectedEvolution(option.name);
          await fetchEvolutionPreview(option.name, option.type);
        }
      } else {
        setEvolutionOptions([]);
      }
    } catch (err) {
      setEvolutionError(extractErrorMessage(err, 'Failed to fetch evolution options.'));
      setEvolutionOptions([]);
    } finally {
      setLoadingEvolutionOptions(false);
    }
  }, [fetchEvolutionPreview]);

  // Handle monster selection
  const handleMonsterClick = useCallback(async (monster: Monster) => {
    setSelectedMonster(monster);
    setShowEvolutionModal(true);
    setEvolutionSuccess(false);
    setEvolvedMonster(null);
    setEvolutionError('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setUseVoidStone(false);
    setSelectedSpeciesSlot('species1');
    setSelectedEvolution('');
    setSelectedEvolutionItem('');
    setUseDigitalRepairKit(false);
    setEvolutionPreview(null);
    setCustomSpeciesName('');

    if (monster.species1) {
      await fetchEvolutionOptions(monster, 'species1');
    }
  }, [fetchEvolutionOptions]);

  // Handle species slot change
  const handleSpeciesSlotChange = useCallback(async (slot: SpeciesSlot) => {
    setSelectedSpeciesSlot(slot);
    setSelectedEvolution('');
    setEvolutionPreview(null);

    if (selectedMonster && selectedMonster[slot]) {
      await fetchEvolutionOptions(selectedMonster, slot);
    }
  }, [selectedMonster, fetchEvolutionOptions]);

  // Handle evolution selection
  const handleEvolutionSelect = useCallback(async (evolution: EvolutionOption) => {
    setSelectedEvolution(evolution.name);
    await fetchEvolutionPreview(evolution.name, evolution.type);
  }, [fetchEvolutionPreview]);

  // Handle image URL change
  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null);
    setImagePreview(e.target.value);
  }, []);

  // Handle image file change
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle void stone toggle
  const handleVoidStoneToggle = useCallback(() => {
    const newValue = !useVoidStone;
    setUseVoidStone(newValue);
    if (newValue) {
      setSelectedEvolutionItem('Void Evolution Stone');
    } else if (selectedEvolutionItem === 'Void Evolution Stone') {
      setSelectedEvolutionItem('');
    }
  }, [useVoidStone, selectedEvolutionItem]);

  // Close modal
  const closeModal = useCallback(() => {
    setShowEvolutionModal(false);
    setSelectedMonster(null);
    setEvolutionError('');
  }, []);

  // Handle evolution
  const handleEvolve = useCallback(async () => {
    if (!selectedMonster || !selectedTrainer) {
      setEvolutionError('Please select a monster to evolve.');
      return;
    }

    if (!selectedSpeciesSlot || !selectedMonster[selectedSpeciesSlot]) {
      setEvolutionError('Please select a valid species slot to evolve.');
      return;
    }

    if (!selectedEvolution && !useDigitalRepairKit) {
      setEvolutionError('Please select an evolution or use a Digital Repair Kit.');
      return;
    }

    if (useDigitalRepairKit && !customSpeciesName.trim()) {
      setEvolutionError('Please enter a custom species name when using the Digital Repair Kit.');
      return;
    }

    if (!imageUrl && !imageFile && !useVoidStone) {
      setEvolutionError('Please provide an image URL, upload an image, or use a Void Evolution Stone.');
      return;
    }

    if (selectedEvolutionItem && !hasEvolutionItem(selectedEvolutionItem) && !useVoidStone) {
      setEvolutionError(`You don't have a ${selectedEvolutionItem} in your inventory.`);
      return;
    }

    try {
      setLoading(true);
      setEvolutionError('');

      const evolutionData = {
        trainerId: selectedTrainer,
        speciesSlot: selectedSpeciesSlot,
        evolutionName: useDigitalRepairKit ? customSpeciesName.trim() : selectedEvolution,
        evolutionItem: selectedEvolutionItem,
        imageUrl: useVoidStone ? null : imageUrl,
        useVoidStone,
        useDigitalRepairKit,
        customEvolutionName: useDigitalRepairKit ? customSpeciesName.trim() : null
      };

      // Create FormData if we have a file
      let response;
      if (imageFile && !useVoidStone) {
        const formData = new FormData();
        formData.append('image', imageFile);
        Object.entries(evolutionData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        response = await api.post(`/monsters/${selectedMonster.id}/evolve`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post(`/monsters/${selectedMonster.id}/evolve`, evolutionData);
      }

      if (response.data?.success && response.data.data) {
        // Refresh inventory
        try {
          const inventoryResponse = await api.get(`/trainers/${selectedTrainer}/inventory`);
          setTrainerInventory(inventoryResponse.data.data || { evolution: {} });
        } catch (err) {
          console.error('Error refreshing inventory:', err);
        }

        // Refresh monsters list
        try {
          const monstersResponse = await api.get(`/monsters/trainer/${selectedTrainer}`);
          setTrainerMonsters(monstersResponse.data.monsters || []);
        } catch (err) {
          console.error('Error refreshing monsters:', err);
        }

        setEvolvedMonster(response.data.data);
        setEvolutionSuccess(true);
        onEvolutionComplete?.(response.data.data);
      } else {
        setEvolutionError(response.data?.message || 'Failed to evolve monster.');
      }
    } catch (err) {
      setEvolutionError(extractErrorMessage(err, 'An error occurred during evolution.'));
    } finally {
      setLoading(false);
    }
  }, [
    selectedMonster,
    selectedTrainer,
    selectedSpeciesSlot,
    selectedEvolution,
    useDigitalRepairKit,
    customSpeciesName,
    imageUrl,
    imageFile,
    useVoidStone,
    selectedEvolutionItem,
    hasEvolutionItem,
    onEvolutionComplete
  ]);

  // Render monster card
  const renderMonsterCard = (monster: Monster) => (
    <Card
      key={monster.id}
      onClick={() => handleMonsterClick(monster)}
      className="witchs-hut-monster-card"
    >
      <div className="card__image-container">
        <img
          src={monster.img_link!}
          alt={monster.name}
          className="card__image"
        />
      </div>
      <div className="card__body">
        <div className="witchs-hut-monster-header">
          <h4 className="card__title">{monster.name}</h4>
          <span className="witchs-hut-evolution-badge">
            <i className="fas fa-magic"></i>
          </span>
        </div>
        <p className="card__subtitle">
          {monster.species1}
          {monster.species2 && ` + ${monster.species2}`}
          {monster.species3 && ` + ${monster.species3}`}
        </p>
        <div className="badge-group badge-group--sm badge-group--gap-xs badge-group--wrap mt-xs">
          {monster.type1 && <TypeBadge type={monster.type1} size="sm" />}
          {monster.type2 && <TypeBadge type={monster.type2} size="sm" />}
          {monster.type3 && <TypeBadge type={monster.type3} size="sm" />}
          {monster.type4 && <TypeBadge type={monster.type4} size="sm" />}
          {monster.type5 && <TypeBadge type={monster.type5} size="sm" />}
        </div>
      </div>
    </Card>
  );

  // Render evolution success screen
  const renderSuccessScreen = () => (
    <div className="witchs-hut-success">
      <div className="witchs-hut-success-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h3>Evolution Successful!</h3>
      <p>
        {selectedMonster?.name} has evolved successfully!
        {selectedEvolutionItem && ` The ${selectedEvolutionItem} was used in the evolution.`}
      </p>
      {evolvedMonster && (
        <div className="witchs-hut-evolved-details">
          <h4>Evolved Monster Details:</h4>
          <p>
            <strong>Species:</strong> {evolvedMonster.species1}
            {evolvedMonster.species2 && ` + ${evolvedMonster.species2}`}
            {evolvedMonster.species3 && ` + ${evolvedMonster.species3}`}
          </p>
          <div className="badge-group badge-group--sm badge-group--gap-xs badge-group--wrap mt-xs">
            {evolvedMonster.type1 && <TypeBadge type={evolvedMonster.type1} size="sm" />}
            {evolvedMonster.type2 && <TypeBadge type={evolvedMonster.type2} size="sm" />}
            {evolvedMonster.type3 && <TypeBadge type={evolvedMonster.type3} size="sm" />}
            {evolvedMonster.type4 && <TypeBadge type={evolvedMonster.type4} size="sm" />}
            {evolvedMonster.type5 && <TypeBadge type={evolvedMonster.type5} size="sm" />}
          </div>
          {evolvedMonster.attribute && (
            <div className="mt-xs">
              <AttributeBadge attribute={evolvedMonster.attribute} size="sm" />
            </div>
          )}
        </div>
      )}
      <div className="action-button-group action-button-group--align-center mt-md">
        <button className="button primary no-flex" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );

  // Render evolution form
  const renderEvolutionForm = () => {
    if (!selectedMonster) return null;

    return (
      <div className="witchs-hut-evolution-form">
        {/* Monster Summary */}
        <div className="witchs-hut-summary">
          <div className="witchs-hut-monster-info">
            <h3>{selectedMonster.name}</h3>
            <p className="witchs-hut-level">Level {selectedMonster.level}</p>
            <p className="witchs-hut-species">
              {selectedMonster.species1}
              {selectedMonster.species2 && ` + ${selectedMonster.species2}`}
              {selectedMonster.species3 && ` + ${selectedMonster.species3}`}
            </p>
            <div className="badge-group badge-group--sm mt-xs badge-group--wrap badge-group--gap-xs">
              {selectedMonster.type1 && <TypeBadge type={selectedMonster.type1} size="sm" />}
              {selectedMonster.type2 && <TypeBadge type={selectedMonster.type2} size="sm" />}
              {selectedMonster.type3 && <TypeBadge type={selectedMonster.type3} size="sm" />}
              {selectedMonster.type4 && <TypeBadge type={selectedMonster.type4} size="sm" />}
              {selectedMonster.type5 && <TypeBadge type={selectedMonster.type5} size="sm" />}
            </div>
          </div>
          <div className="witchs-hut-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
          <div className="witchs-hut-target">
            {selectedEvolution || customSpeciesName ? (
              <span className="witchs-hut-target-name">
                {useDigitalRepairKit ? customSpeciesName : selectedEvolution}
              </span>
            ) : (
              <>
                <i className="fas fa-question"></i>
                <span>Choose Evolution</span>
              </>
            )}
          </div>
        </div>

        {/* Step 1: Species Selection */}
        <div className="witchs-hut-step">
          <div className="witchs-hut-step-header">
            <span className="witchs-hut-step-number">1</span>
            <h4>Choose Species to Evolve</h4>
          </div>
          <div className="witchs-hut-species-buttons">
            {selectedMonster.species1 && (
              <button
                className={`button ${selectedSpeciesSlot === 'species1' ? 'primary' : 'secondary'} no-flex`}
                onClick={() => handleSpeciesSlotChange('species1')}
              >
                <span className="witchs-hut-species-slot">Species 1</span>
                <span className="witchs-hut-species-name">{selectedMonster.species1}</span>
              </button>
            )}
            {selectedMonster.species2 && (
              <button
                className={`button ${selectedSpeciesSlot === 'species2' ? 'primary' : 'secondary'} no-flex`}
                onClick={() => handleSpeciesSlotChange('species2')}
              >
                <span className="witchs-hut-species-slot">Species 2</span>
                <span className="witchs-hut-species-name">{selectedMonster.species2}</span>
              </button>
            )}
            {selectedMonster.species3 && (
              <button
                className={`button ${selectedSpeciesSlot === 'species3' ? 'primary' : 'secondary'} no-flex`}
                onClick={() => handleSpeciesSlotChange('species3')}
              >
                <span className="witchs-hut-species-slot">Species 3</span>
                <span className="witchs-hut-species-name">{selectedMonster.species3}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Evolution Method */}
        <div className="witchs-hut-step">
          <div className="witchs-hut-step-header">
            <span className="witchs-hut-step-number">2</span>
            <h4>Choose Evolution Method</h4>
          </div>

          {/* Natural Evolution */}
          {evolutionOptions.length > 0 && (
            <div className="witchs-hut-method">
              <h5>Natural Evolution</h5>
              <p>Choose from available evolution options for {selectedMonster[selectedSpeciesSlot]}</p>
              {loadingEvolutionOptions ? (
                <div className="witchs-hut-loading">
                  <LoadingSpinner size="sm" />
                  <span>Loading options...</span>
                </div>
              ) : (
                <div className="witchs-hut-evolution-options">
                  {evolutionOptions.map((evolution, index) => (
                    <button
                      key={index}
                      className={`witchs-hut-evolution-card ${selectedEvolution === evolution.name ? 'selected' : ''}`}
                      onClick={() => handleEvolutionSelect(evolution)}
                    >
                      <span className="witchs-hut-evolution-name">{evolution.name}</span>
                      <span className="witchs-hut-evolution-type">{evolution.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Evolution */}
          <div className="witchs-hut-method">
            <div className="witchs-hut-method-header">
              <h5>Custom Evolution</h5>
              <span className="witchs-hut-requires-item">Requires Digital Repair Kit</span>
            </div>
            <p>Create your own evolution by entering any species name</p>
            <button
              className={`button ${useDigitalRepairKit ? 'primary' : 'secondary'} no-flex`}
              onClick={() => setUseDigitalRepairKit(!useDigitalRepairKit)}
              disabled={!hasEvolutionItem('Digital Repair Kit')}
            >
              {hasEvolutionItem('Digital Repair Kit')
                ? (useDigitalRepairKit ? 'Digital Repair Kit Selected' : 'Use Digital Repair Kit')
                : 'No Digital Repair Kit Available'
              }
            </button>

            {useDigitalRepairKit && (
              <div className="witchs-hut-custom-input">
                <input
                  type="text"
                  className="input"
                  value={customSpeciesName}
                  onChange={(e) => setCustomSpeciesName(e.target.value)}
                  placeholder="Enter species name (e.g., Charizard, Dragonite, etc.)"
                />
                {customSpeciesName.trim() && (
                  <div className="witchs-hut-preview-mini">
                    <i className="fas fa-arrow-right"></i>
                    <span>{customSpeciesName.trim()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evolution Preview */}
          {evolutionPreview && (
            <div className="witchs-hut-preview-card">
              <h5>Evolution Preview</h5>
              <div className="witchs-hut-preview-content">
                <div className="witchs-hut-preview-info">
                  <span className="witchs-hut-preview-name">{evolutionPreview.name}</span>
                  <div className="badge-group badge-group--sm mt-xs badge-group--wrap badge-group--gap-xs">
                    {evolutionPreview.type_primary && (
                      <TypeBadge type={evolutionPreview.type_primary} size="sm" />
                    )}
                    {evolutionPreview.type_secondary && (
                      <TypeBadge type={evolutionPreview.type_secondary} size="sm" />
                    )}
                  </div>
                </div>
                {evolutionPreview.image_url && (
                  <img
                    src={evolutionPreview.image_url}
                    alt={evolutionPreview.name}
                    className="witchs-hut-preview-image"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Image & Items */}
        <div className="witchs-hut-step">
          <div className="witchs-hut-step-header">
            <span className="witchs-hut-step-number">3</span>
            <h4>Image & Evolution Items</h4>
          </div>

          {/* Image Section */}
          <div className="witchs-hut-method">
            <h5>Evolution Image</h5>
            <p>Upload an image or use a Void Stone to bypass this requirement</p>

            <div className="witchs-hut-image-tabs">
              <button
                className={`button ${!useVoidStone ? 'primary' : 'secondary'} no-flex`}
                onClick={() => setUseVoidStone(false)}
              >
                <i className="fas fa-image"></i>
                Upload Image
              </button>
              <button
                className={`button ${useVoidStone ? 'primary' : 'secondary'} no-flex`}
                onClick={handleVoidStoneToggle}
                disabled={getItemCount('Void Evolution Stone') === 0}
                title={`Void Evolution Stone (${getItemCount('Void Evolution Stone')} available)`}
              >
                <i className="fas fa-gem"></i>
                Use Void Stone ({getItemCount('Void Evolution Stone')})
              </button>
            </div>

            {!useVoidStone && (
              <div className="witchs-hut-image-inputs">
                <input
                  type="text"
                  className="input"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="Enter image URL"
                />
                <div className="witchs-hut-file-input">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    id="evolution-image-upload"
                  />
                  <label htmlFor="evolution-image-upload" className="button secondary no-flex">
                    <i className="fas fa-upload"></i>
                    Choose File
                  </label>
                </div>
              </div>
            )}

            {useVoidStone && (
              <div className="witchs-hut-void-info">
                <i className="fas fa-gem"></i>
                <span>Using Void Evolution Stone ({getItemCount('Void Evolution Stone')} available) - No image required</span>
              </div>
            )}

            {imagePreview && !useVoidStone && (
              <div className="witchs-hut-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  className="witchs-hut-remove-preview"
                  onClick={() => {
                    setImagePreview('');
                    setImageUrl('');
                    setImageFile(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>

          {/* Evolution Items */}
          <div className="witchs-hut-method">
            <h5>Evolution Items (Optional)</h5>
            <p>Choose one evolution item to add or modify your monster's types</p>

            <div className="witchs-hut-items-grid">
              {EVOLUTION_ITEMS.map(item => {
                const count = getItemCount(item.id);
                const isSelected = selectedEvolutionItem === item.id;

                return (
                  <button
                    key={item.id}
                    className={`witchs-hut-item ${isSelected ? 'selected' : ''} ${count === 0 ? 'unavailable' : ''}`}
                    onClick={() => {
                      if (count > 0) {
                        setSelectedEvolutionItem(isSelected ? '' : item.id);
                      }
                    }}
                    disabled={count === 0}
                    title={count === 0 ? `You don't have any ${item.id}` : item.desc}
                  >
                    <div className="witchs-hut-item-details">
                      <div className="witchs-hut-item-image-container"> 
                        <img
                          src={getItemImageUrl({ name: item.id, category: 'evolution' })}
                          alt={item.id}
                          className="witchs-hut-item-image"
                          onError={(e) => handleItemImageError(e, 'evolution')}
                        />
                      </div>
                      <span className="witchs-hut-item-name">{item.id}</span>
                      <span className="witchs-hut-item-desc">{item.desc}</span>
                      <span className="witchs-hut-item-count">Count: {count}</span>
                      <div className="witchs-hut-item-badge">
                        <TypeBadge type={item.type} size="sm" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {(selectedEvolutionItem || useDigitalRepairKit) && (
              <div className="witchs-hut-selected-items">
                <i className="fas fa-info-circle"></i>
                <div>
                  {useDigitalRepairKit && (
                    <div>Using: <strong>Digital Repair Kit</strong> - Allows custom species evolution</div>
                  )}
                  {selectedEvolutionItem && (
                    <div>Using: <strong>{selectedEvolutionItem}</strong> - This will add or modify your monster's types</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {evolutionError && <ErrorMessage message={evolutionError} />}

        <div className="witchs-hut-actions">
          <button className="button secondary no-flex" onClick={closeModal}>
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button
            className="button primary no-flex"
            onClick={handleEvolve}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" message="" />
                Evolving...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i>
                Evolve Monster
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`witchs-hut ${className}`.trim()}>
      {error && <ErrorMessage message={error} />}

      {/* Step 1: Trainer Selection */}
      <div className="witchs-hut-step">
        <div className="witchs-hut-step-header">
          <span className="witchs-hut-step-number">1</span>
          <h3>Select Your Trainer</h3>
        </div>
        <TrainerAutocomplete
          trainers={userTrainers}
          selectedTrainerId={selectedTrainer}
          onSelect={setSelectedTrainer}
          label=""
          placeholder="Choose a trainer..."
        />
      </div>

      {selectedTrainer && (
        <>
          {/* Step 2: Monster Selection */}
          <div className="witchs-hut-step">
            <div className="witchs-hut-step-header">
              <span className="witchs-hut-step-number">2</span>
              <h3>Choose Monster to Evolve</h3>
              <span className="witchs-hut-step-subtitle">
                {filteredMonsters.length} monster{filteredMonsters.length !== 1 ? 's' : ''} available
              </span>
            </div>

            <div className="form-group">
              <div className="witchs-hut-search">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  className="input"
                  placeholder="Search monsters by name or species..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="button ghost sm"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="witchs-hut-monster-grid">
              {filteredMonsters.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-dragon"></i>
                  <h4>No monsters found</h4>
                  <p>
                    {searchTerm
                      ? `No monsters match "${searchTerm}". Try a different search term.`
                      : "This trainer doesn't have any monsters yet."
                    }
                  </p>
                </div>
              ) : (
                filteredMonsters.map(monster => renderMonsterCard(monster))
              )}
            </div>
          </div>

          {/* Evolution Help */}
          <div className="witchs-hut-help">
            <div className="witchs-hut-help-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <div className="witchs-hut-help-content">
              <h4>How Evolution Works</h4>
              <ul>
                <li>Choose which species slot you want to evolve</li>
                <li>Select from available evolution options or use a Digital Repair Kit for custom evolution</li>
                <li>Upload an image or use a Void Stone to bypass the image requirement</li>
                <li>Optionally use evolution items to add or modify types</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {loading && !showEvolutionModal && (
        <div className="state-container state-container--centered">
          <LoadingSpinner />
        </div>
      )}

      {/* Evolution Modal */}
      <Modal
        isOpen={showEvolutionModal}
        onClose={closeModal}
        title={selectedMonster?.name || 'Monster Evolution'}
        size="large"
      >
        {evolutionSuccess ? renderSuccessScreen() : renderEvolutionForm()}
      </Modal>
    </div>
  );
}

export default WitchsHut;
