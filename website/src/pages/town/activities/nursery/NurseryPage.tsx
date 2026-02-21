import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { FormSelect } from '@components/common/FormSelect';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import api from '@services/api';
import type {
  EggsResponse,
  EggItemsResponse,
  HatchResponse,
  SpeciesInputs,
} from './types';
import { extractErrorMessage } from '@utils/errorUtils';
import { getItemImageUrl, handleItemImageError } from '@utils/imageUtils';
import '@styles/town/activities.css';
import '@styles/town/nursery.css';

interface UserTrainer {
  id: number;
  name: string;
}

const ICE_CREAM_TYPE_MAP: Record<string, string> = {
  'Vanilla Ice Cream': 'type1',
  'Strawberry Ice Cream': 'type2',
  'Chocolate Ice Cream': 'type3',
  'Mint Ice Cream': 'type4',
  'Pecan Ice Cream': 'type5',
};

// Ice cream chain: each requires all previous ice creams to be selected
const ICE_CREAM_CHAIN = [
  'Vanilla Ice Cream',
  'Strawberry Ice Cream',
  'Chocolate Ice Cream',
  'Mint Ice Cream',
  'Pecan Ice Cream',
];

const SPECIES_CONTROL_COUNTS: Record<string, number> = {
  'Input Field': 1,
  'Drop Down': 2,
  'Radio Buttons': 3,
};

// Item effect descriptions
const ITEM_EFFECTS: Record<string, string> = {
  // Rank Incenses
  'S Rank Incense': 'Filter results to S Rank monsters only',
  'A Rank Incense': 'Filter results to A Rank monsters only',
  'B Rank Incense': 'Filter results to B Rank monsters only',
  'C Rank Incense': 'Filter results to C Rank monsters only',
  'D Rank Incense': 'Filter results to D Rank monsters only',
  'E Rank Incense': 'Filter results to E Rank monsters only',
  // Color Incenses
  'Restoration Color Incense': 'Filter results to Restoration attribute',
  'Virus Color Incense': 'Filter results to Virus attribute',
  'Data Color Incense': 'Filter results to Data attribute',
  'Vaccine Color Incense': 'Filter results to Vaccine attribute',
  // Exclusion items
  'Spell Tag': 'Exclude Yokai from the hatching pool',
  'DigiMeat': 'Include Digimon in the hatching pool',
  'DigiTofu': 'Exclude Digimon from the hatching pool',
  'Broken Bell': 'Exclude Pokemon from the hatching pool',
  'Complex Core': 'Include Nexomon in the hatching pool',
  'Shattered Core': 'Exclude Nexomon from the hatching pool',
  "Worker's Permit": 'Include Pals in the hatching pool',
  'Workers Strike Notice': 'Exclude Pals from the hatching pool',
  // Codes
  'Corruption Code': 'Override attribute to Virus',
  'Repair Code': 'Override attribute to Vaccine',
  'Shiny New Code': 'Override attribute to Data',
  // Milks & Drinks
  'Hot Chocolate': 'Guarantee a fusion monster (2+ species)',
  'Vanilla Milk': 'Guarantee at least 2 types',
  'Chocolate Milk': 'Guarantee at least 3 types',
  'Strawberry Milk': 'Guarantee at least 4 types',
  'MooMoo Milk': 'Guarantee exactly 5 types',
  // Ice Creams
  'Vanilla Ice Cream': 'Choose the monster\'s 1st type',
  'Strawberry Ice Cream': 'Choose the monster\'s 2nd type (requires Vanilla)',
  'Chocolate Ice Cream': 'Choose the monster\'s 3rd type (requires Vanilla + Strawberry)',
  'Mint Ice Cream': 'Choose the monster\'s 4th type (requires all previous)',
  'Pecan Ice Cream': 'Choose the monster\'s 5th type (requires all previous)',
  // Species Controls
  'Input Field': 'Choose 1 guaranteed species',
  'Drop Down': 'Choose from 2 species options',
  'Radio Buttons': 'Choose from 3 species options',
};

// Generate effect descriptions for poffins and nurture kits dynamically
const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];
for (const type of TYPES) {
  ITEM_EFFECTS[`${type} Poffin`] = `Filter results to include ${type}-type monsters`;
  ITEM_EFFECTS[`${type} Nurture Kit`] = `Guarantee the monster has the ${type} type`;
}

const ITEM_GROUP_DEFS: { label: string; icon: string; match: (name: string) => boolean }[] = [
  { label: 'Nurture Kits', icon: 'fas fa-box', match: (name) => name.endsWith('Nurture Kit') },
  { label: 'Rank Incenses', icon: 'fas fa-fire-alt', match: (name) => name.endsWith('Rank Incense') },
  { label: 'Color Incenses', icon: 'fas fa-palette', match: (name) => name.endsWith('Color Incense') },
  { label: 'Poffins', icon: 'fas fa-cookie', match: (name) => name.endsWith('Poffin') },
  { label: 'Ice Creams', icon: 'fas fa-ice-cream', match: (name) => name.endsWith('Ice Cream') },
  { label: 'Milks & Drinks', icon: 'fas fa-glass-whiskey', match: (name) => name.endsWith('Milk') || name === 'Hot Chocolate' },
  { label: 'Species Controls', icon: 'fas fa-dna', match: (name) => ['Input Field', 'Drop Down', 'Radio Buttons'].includes(name) },
  { label: 'Codes', icon: 'fas fa-code', match: (name) => name.endsWith('Code') },
  { label: 'Other Items', icon: 'fas fa-box-open', match: () => true },
];

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function NurseryPage() {
  useDocumentTitle('Nursery');
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Trainer data
  const [userTrainers, setUserTrainers] = useState<UserTrainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [trainerEggs, setTrainerEggs] = useState<Record<string, number>>({});
  const [eggItems, setEggItems] = useState<Record<string, number>>({});

  // Hatch/Nurture settings (shared between tabs)
  const [eggCount, setEggCount] = useState(1);
  const [useIncubator, setUseIncubator] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Per-egg item selection: eggIndex -> itemName -> quantity
  const [perEggItems, setPerEggItems] = useState<Record<number, Record<string, number>>>({ 0: {} });
  const [speciesInputs, setSpeciesInputs] = useState<SpeciesInputs>({});
  // Which egg tab is active for item selection
  const [activeEggTab, setActiveEggTab] = useState(0);

  // Aggregate per-egg items into totals for backend submission
  const selectedItems = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let i = 0; i < eggCount; i++) {
      const eggItems_ = perEggItems[i] || {};
      for (const [name, qty] of Object.entries(eggItems_)) {
        totals[name] = (totals[name] || 0) + qty;
      }
    }
    return totals;
  }, [perEggItems, eggCount]);

  // totalUsedPerItem is the same as selectedItems (aggregated totals)
  const totalUsedPerItem = selectedItems;

  // Fetch user trainers on mount
  const fetchTrainers = useCallback(async () => {
    if (!currentUser?.discord_id) return;
    try {
      setLoading(true);
      const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
      const trainers: UserTrainer[] = response.data.data || [];
      setUserTrainers(trainers);

      if (trainers.length > 0) {
        setSelectedTrainerId(String(trainers[0].id));
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load trainer data.'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.discord_id]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchTrainers();
    }
  }, [isAuthenticated, currentUser, fetchTrainers]);

  // Fetch trainer eggs and items when trainer changes
  const fetchTrainerData = useCallback(async (trainerId: string) => {
    if (!trainerId) return;
    try {
      setError(null);
      const [eggsRes, itemsRes] = await Promise.all([
        api.get<EggsResponse>(`/nursery/eggs/${trainerId}`),
        api.get<EggItemsResponse>(`/nursery/egg-items/${trainerId}`),
      ]);
      setTrainerEggs(eggsRes.data.eggs || {});
      setEggItems(itemsRes.data.items || {});
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load egg and item data.'));
    }
  }, []);

  useEffect(() => {
    if (selectedTrainerId) {
      fetchTrainerData(selectedTrainerId);
      setPerEggItems({ 0: {} });
      setActiveEggTab(0);
      setSpeciesInputs({});
    }
  }, [selectedTrainerId, fetchTrainerData]);

  // Keep perEggItems in sync with eggCount
  useEffect(() => {
    setPerEggItems(prev => {
      const next = { ...prev };
      // Add empty entries for new eggs
      for (let i = 0; i < eggCount; i++) {
        if (!next[i]) next[i] = {};
      }
      // Remove entries for eggs beyond the count
      for (const key of Object.keys(next)) {
        if (Number(key) >= eggCount) delete next[Number(key)];
      }
      return next;
    });
    if (activeEggTab >= eggCount) setActiveEggTab(eggCount - 1);
  }, [eggCount, activeEggTab]);

  // Trainer select options
  const trainerOptions = useMemo(() => [
    { value: '', label: 'Choose your trainer...' },
    ...userTrainers.map(t => ({ value: String(t.id), label: t.name })),
  ], [userTrainers]);

  // Resource counts
  const standardEggs = trainerEggs['Standard Egg'] || 0;
  const incubators = trainerEggs['Incubator'] || 0;

  // Nurture items (exclude Incubator)
  const nurtureItems = useMemo(() => {
    return Object.entries(eggItems)
      .filter(([name]) => name !== 'Incubator')
      .filter(([, qty]) => qty > 0);
  }, [eggItems]);

  // Group nurture items by category
  const groupedItems = useMemo(() => {
    const groups: { label: string; icon: string; items: [string, number][] }[] = [];
    const assigned = new Set<string>();

    for (const def of ITEM_GROUP_DEFS) {
      const matched = nurtureItems.filter(([name]) => !assigned.has(name) && def.match(name));
      if (matched.length > 0) {
        matched.forEach(([name]) => assigned.add(name));
        groups.push({ label: def.label, icon: def.icon, items: matched });
      }
    }

    return groups;
  }, [nurtureItems]);

  // Collapsed state for item groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  // Handlers
  const handleTrainerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrainerId(e.target.value);
    setEggCount(1);
    setUseIncubator(false);
    setImageFile(null);
    setPerEggItems({ 0: {} });
    setActiveEggTab(0);
    setSpeciesInputs({});
    setError(null);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image file must be smaller than 10MB.');
      return;
    }

    setImageFile(file);
    setError(null);
  }, []);

  // Toggle an item on/off for a specific egg (single-use items)
  const handleItemToggle = useCallback((eggIndex: number, itemName: string) => {
    setPerEggItems(prev => {
      const current = prev[eggIndex]?.[itemName] || 0;
      const newVal = current > 0 ? 0 : 1;

      // If selecting, check availability across eggs
      if (newVal === 1) {
        const maxAvailable = eggItems[itemName] || 0;
        let usedByOthers = 0;
        for (let i = 0; i < eggCount; i++) {
          if (i !== eggIndex) usedByOthers += (prev[i]?.[itemName] || 0);
        }
        if (usedByOthers >= maxAvailable) return prev;
      }

      const newEggItems = { ...(prev[eggIndex] || {}), [itemName]: newVal };

      // If deselecting an ice cream, also deselect all ice creams that depend on it
      if (newVal === 0) {
        const chainIdx = ICE_CREAM_CHAIN.indexOf(itemName);
        if (chainIdx >= 0) {
          for (let j = chainIdx + 1; j < ICE_CREAM_CHAIN.length; j++) {
            newEggItems[ICE_CREAM_CHAIN[j]] = 0;
          }
        }
      }

      return { ...prev, [eggIndex]: newEggItems };
    });
  }, [eggItems, eggCount]);

  // Check if an ice cream item is allowed (all previous in chain must be selected for this egg)
  const isIceCreamAllowed = useCallback((eggIndex: number, itemName: string): boolean => {
    const chainIdx = ICE_CREAM_CHAIN.indexOf(itemName);
    if (chainIdx <= 0) return true; // Vanilla is always allowed, non-ice-creams too
    const eggSelections = perEggItems[eggIndex] || {};
    for (let i = 0; i < chainIdx; i++) {
      if (!eggSelections[ICE_CREAM_CHAIN[i]]) return false;
    }
    return true;
  }, [perEggItems]);

  const handleSpeciesInputChange = useCallback((key: string, value: string) => {
    setSpeciesInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // Validation
  const validate = useCallback((): string | null => {
    if (!selectedTrainerId) return 'Please select a trainer.';
    if (standardEggs < eggCount) return `Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.`;
    if (!useIncubator && !imageFile) return 'Either an incubator or uploaded artwork image is required.';
    if (useIncubator && incubators < eggCount) return `Not enough Incubators. You have ${incubators}, need ${eggCount}.`;
    return null;
  }, [selectedTrainerId, standardEggs, eggCount, useIncubator, imageFile, incubators]);

  // Submit hatch or nurture
  const handleSubmit = useCallback(async (mode: 'hatch' | 'nurture') => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('trainerId', selectedTrainerId);
      formData.append('eggCount', String(eggCount));
      formData.append('useIncubator', String(useIncubator));

      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      if (mode === 'nurture') {
        formData.append('selectedItems', JSON.stringify(selectedItems));
        formData.append('speciesInputs', JSON.stringify(speciesInputs));
      }

      const response = await api.post<HatchResponse>(`/nursery/${mode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        navigate(`/town/activities/nursery/session/${response.data.sessionId}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to start ${mode}. Please try again.`));
    } finally {
      setSubmitting(false);
    }
  }, [validate, selectedTrainerId, eggCount, useIncubator, imageFile, selectedItems, speciesInputs, navigate]);

  // Shared controls rendered in both tabs
  const renderSharedControls = (mode: 'hatch' | 'nurture') => (
    <div className="nursery-form">
      {/* Egg Count */}
      <div className="nursery-form__section">
        <h4 className="nursery-form__section-title">
          <i className="fas fa-hashtag"></i> Number of Eggs
        </h4>
        <div className="nursery-egg-count">
          <button
            type="button"
            className="button secondary sm"
            onClick={() => setEggCount(prev => Math.max(1, prev - 1))}
            disabled={eggCount <= 1 || submitting}
            aria-label="Decrease egg count"
          >
            <i className="fas fa-minus"></i>
          </button>
          <input
            type="number"
            className="input nursery-egg-count__input"
            min={1}
            max={10}
            value={eggCount}
            onChange={e => setEggCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            disabled={submitting}
          />
          <button
            type="button"
            className="button secondary sm"
            onClick={() => setEggCount(prev => Math.min(10, prev + 1))}
            disabled={eggCount >= 10 || submitting}
            aria-label="Increase egg count"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Incubator Checkbox */}
      <label className={`nursery-checkbox ${useIncubator ? 'nursery-checkbox--active' : ''}`}>
        <input
          type="checkbox"
          checked={useIncubator}
          onChange={e => setUseIncubator(e.target.checked)}
          disabled={submitting}
        />
        <div className="nursery-checkbox__icon">
          <i className="fas fa-fire"></i>
        </div>
        <div className="nursery-checkbox__info">
          <span className="nursery-checkbox__title">Use Incubator</span>
          <span className="nursery-checkbox__description">
            Bypass artwork requirements (uses {eggCount} incubator{eggCount > 1 ? 's' : ''})
          </span>
        </div>
      </label>

      {/* File Upload (only when not using incubator) */}
      {!useIncubator && (
        <div className="nursery-form__section">
          <h4 className="nursery-form__section-title">
            <i className="fas fa-palette"></i> Artwork Inspiration
          </h4>
          <div className="nursery-file-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="nursery-file-upload__input"
              id={`${mode}-image-upload`}
              disabled={submitting}
            />
            <label htmlFor={`${mode}-image-upload`} className="nursery-file-upload__label">
              <div className="nursery-file-upload__icon">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <div className="nursery-file-upload__text">
                <span className="nursery-file-upload__title">
                  {imageFile ? imageFile.name : 'Drop your artwork here'}
                </span>
                <span className="nursery-file-upload__subtitle">
                  {imageFile
                    ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                    : 'or click to browse files'
                  }
                </span>
              </div>
            </label>
            {imageFile && (
              <button
                type="button"
                className="nursery-file-upload__remove"
                onClick={e => {
                  e.preventDefault();
                  setImageFile(null);
                }}
                aria-label="Remove file"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );

  // Render special inputs for species/type control items
  const renderSpecialInputs = (itemName: string) => {
    const currentEggItems = perEggItems[activeEggTab] || {};
    const speciesCount = SPECIES_CONTROL_COUNTS[itemName];
    if (speciesCount && (currentEggItems[itemName] || 0) > 0) {
      return (
        <div className="nursery-item__special-inputs">
          {Array.from({ length: speciesCount }, (_, i) => {
            const key = `species${i + 1}` as keyof SpeciesInputs;
            return (
              <div key={key} className="nursery-item__special-input">
                <label>Species {i + 1}:</label>
                <input
                  type="text"
                  className="input"
                  value={speciesInputs[key] || ''}
                  onChange={e => handleSpeciesInputChange(key, e.target.value)}
                  placeholder={`Enter species ${i + 1}`}
                />
              </div>
            );
          })}
        </div>
      );
    }

    const typeKey = ICE_CREAM_TYPE_MAP[itemName];
    if (typeKey && (currentEggItems[itemName] || 0) > 0) {
      const slotNum = typeKey.replace('type', '');
      return (
        <div className="nursery-item__special-inputs">
          <div className="nursery-item__special-input">
            <label>Type Slot {slotNum}:</label>
            <input
              type="text"
              className="input"
              value={speciesInputs[typeKey as keyof SpeciesInputs] || ''}
              onChange={e => handleSpeciesInputChange(typeKey, e.target.value)}
              placeholder={`Enter type for slot ${slotNum}`}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState<'hatch' | 'nurture'>('hatch');

  // Loading state
  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading nursery..." />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-egg"></i>
          </div>
          <div>
            <h1>Nursery</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the nursery.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-egg"></i>
        </div>
        <div>
          <h1>Nursery</h1>
          <p className="activity-page__description">
            Transform your precious eggs into magnificent monsters through the ancient arts of hatching and nurturing
          </p>
        </div>
      </div>

      {/* Trainer Selection */}
      <FormSelect
        label="Select Trainer"
        value={selectedTrainerId}
        onChange={handleTrainerChange}
        options={trainerOptions}
      />

      {selectedTrainerId && (
        <>
          {/* Resources Overview */}
          <div className="nursery-resources">
            <div className="nursery-resource">
              <div className="nursery-resource__icon nursery-resource__icon--egg">
                <i className="fas fa-egg"></i>
              </div>
              <span className="nursery-resource__name">Standard Eggs</span>
              <span className="nursery-resource__count">{standardEggs}</span>
            </div>
            <div className="nursery-resource">
              <div className="nursery-resource__icon nursery-resource__icon--incubator">
                <i className="fas fa-fire"></i>
              </div>
              <span className="nursery-resource__name">Incubators</span>
              <span className="nursery-resource__count">{incubators}</span>
            </div>
          </div>

          {/* Hatch / Nurture Mode Selection */}
          <div className="nursery-mode-tabs">
            <button
              type="button"
              className={`nursery-mode-tab ${activeTab === 'hatch' ? 'nursery-mode-tab--active' : ''}`}
              onClick={() => setActiveTab('hatch')}
            >
              <div className="nursery-mode-tab__icon">
                <i className="fas fa-magic"></i>
              </div>
              <div className="nursery-mode-tab__text">
                <span className="nursery-mode-tab__title">Simple Hatch</span>
                <span className="nursery-mode-tab__subtitle">Quick and straightforward</span>
              </div>
            </button>
            <button
              type="button"
              className={`nursery-mode-tab ${activeTab === 'nurture' ? 'nursery-mode-tab--active' : ''}`}
              onClick={() => setActiveTab('nurture')}
            >
              <div className="nursery-mode-tab__icon">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="nursery-mode-tab__text">
                <span className="nursery-mode-tab__title">Advanced Nurture</span>
                <span className="nursery-mode-tab__subtitle">Use items to influence results</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'hatch' && (
            <div>
              <p className="nursery-form__description">
                The simple hatch method provides a straightforward approach to egg hatching with minimal configuration.
              </p>
              {renderSharedControls('hatch')}
              <div className="nursery-actions">
                <button
                  className="button primary"
                  onClick={() => handleSubmit('hatch')}
                  disabled={submitting || !selectedTrainerId}
                >
                  {submitting ? (
                    <><LoadingSpinner size="sm" message="" /> Hatching...</>
                  ) : (
                    <><i className="fas fa-magic"></i> Begin Hatching</>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'nurture' && (
            <div>
              <p className="nursery-form__description">
                The advanced nurturing method allows you to use various items and techniques to influence the hatching outcome.
              </p>
              {renderSharedControls('nurture')}

              {groupedItems.length > 0 && (
                <div className="nursery-form__section">
                  <h4 className="nursery-form__section-title">
                    <i className="fas fa-flask"></i> Nurturing Items
                  </h4>

                  {/* Per-egg tabs when hatching multiple eggs */}
                  {eggCount > 1 && (
                    <div className="nursery-egg-tabs">
                      {Array.from({ length: eggCount }, (_, i) => {
                        const eggItemCount = Object.values(perEggItems[i] || {}).filter(q => q > 0).length;
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`nursery-egg-tab ${activeEggTab === i ? 'nursery-egg-tab--active' : ''}`}
                            onClick={() => setActiveEggTab(i)}
                          >
                            <i className="fas fa-egg"></i> Egg {i + 1}
                            {eggItemCount > 0 && (
                              <span className="nursery-egg-tab__badge">{eggItemCount}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="nursery-item-groups">
                    {groupedItems.map(group => {
                      const isCollapsed = collapsedGroups[group.label] ?? false;
                      const currentEggSelections = perEggItems[activeEggTab] || {};
                      const selectedCount = group.items.filter(([name]) => (currentEggSelections[name] || 0) > 0).length;
                      return (
                        <div key={group.label} className="nursery-item-group">
                          <button
                            type="button"
                            className="nursery-item-group__header"
                            onClick={() => toggleGroup(group.label)}
                          >
                            <i className={group.icon}></i>
                            <span className="nursery-item-group__label">{group.label}</span>
                            <span className="nursery-item-group__count">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                            {selectedCount > 0 && (
                              <span className="nursery-item-group__selected">{selectedCount} selected</span>
                            )}
                            <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} nursery-item-group__chevron`}></i>
                          </button>
                          {!isCollapsed && (
                            <div className="nursery-items">
                              {group.items.map(([itemName, quantity]) => {
                                const isSelected = (currentEggSelections[itemName] || 0) > 0;
                                const usedByOthers = (totalUsedPerItem[itemName] || 0) - (currentEggSelections[itemName] || 0);
                                const isAvailable = quantity - usedByOthers > 0;
                                const isIceCream = ICE_CREAM_CHAIN.includes(itemName);
                                const chainLocked = isIceCream && !isIceCreamAllowed(activeEggTab, itemName);
                                const isDisabled = (!isSelected && !isAvailable) || chainLocked;
                                const effect = ITEM_EFFECTS[itemName];

                                return (
                                  <div key={itemName} className="nursery-item__wrapper">
                                    <button
                                      type="button"
                                      className={`nursery-item nursery-item--selectable${isSelected ? ' nursery-item--selected' : ''}${isDisabled ? ' nursery-item--disabled' : ''}`}
                                      onClick={() => !isDisabled && handleItemToggle(activeEggTab, itemName)}
                                      disabled={isDisabled && !isSelected}
                                    >
                                      <div className="nursery-item__icon">
                                        <img
                                          src={getItemImageUrl({ name: itemName })}
                                          alt={itemName}
                                          className="nursery-item__icon-img"
                                          onError={(e) => handleItemImageError(e, 'egg')}
                                        />
                                      </div>
                                      <div className="nursery-item__info">
                                        <span className="nursery-item__name">{itemName}</span>
                                        {effect && (
                                          <span className="nursery-item__effect">{effect}</span>
                                        )}
                                        {eggCount > 1 && !isSelected && (
                                          <span className="nursery-item__available">
                                            {quantity - usedByOthers} of {quantity} remaining
                                          </span>
                                        )}
                                        {chainLocked && (
                                          <span className="nursery-item__locked">
                                            <i className="fas fa-lock"></i> Requires {ICE_CREAM_CHAIN[ICE_CREAM_CHAIN.indexOf(itemName) - 1]}
                                          </span>
                                        )}
                                      </div>
                                      <div className="nursery-item__check">
                                        {isSelected
                                          ? <i className="fas fa-check-circle"></i>
                                          : <i className="far fa-circle"></i>
                                        }
                                      </div>
                                    </button>
                                    {renderSpecialInputs(itemName)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="nursery-actions">
                <button
                  className="button primary"
                  onClick={() => handleSubmit('nurture')}
                  disabled={submitting || !selectedTrainerId}
                >
                  {submitting ? (
                    <><LoadingSpinner size="sm" message="" /> Nurturing...</>
                  ) : (
                    <><i className="fas fa-seedling"></i> Begin Nurturing</>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="mt-md"><ErrorMessage message={error} /></div>}
    </div>
  );
}
