import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { FormInput } from '../../common/FormInput';
import { FormSelect } from '../../common/FormSelect';
import { FormCheckbox } from '../../common/FormCheckbox';
import { GiftRewards } from '../GiftRewards';

interface Trainer {
  id: number;
  name: string;
  level?: number;
}

interface Monster {
  id: number;
  name: string;
  species?: string;
  trainer_id?: number;
}

interface InstanceAppearance {
  type: 'bust' | 'halfBody' | 'fullBody';
  instanceNumber: number;
}

interface MegaReferenceEntry {
  trainerId: string;
  referenceUrl: string;
  referenceFile: File | null;
  referencePreview: string;
  customLevels: number;
  useCustomLevels: boolean;
  appearanceType: 'bust' | 'halfBody' | 'fullBody';
  instanceCount: number;
  sameAppearanceForEachInstance: boolean;
  instanceAppearances: InstanceAppearance[];
  megaArtist: string;
  megaSpecies1: string;
  megaSpecies2: string;
  megaSpecies3: string;
  megaType1: string;
  megaType2: string;
  megaType3: string;
  megaType4: string;
  megaType5: string;
  megaType6: string;
  megaAbility: string;
}

interface SubmissionResult {
  success?: boolean;
  message?: string;
  totalGiftLevels?: number;
  rewards?: { totalGiftLevels?: number };
}

interface TrainerMegaReferenceSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
}

const DEFAULT_MEGA_REFERENCE: MegaReferenceEntry = {
  trainerId: '',
  referenceUrl: '',
  referenceFile: null,
  referencePreview: '',
  customLevels: 0,
  useCustomLevels: false,
  appearanceType: 'fullBody',
  instanceCount: 1,
  sameAppearanceForEachInstance: true,
  instanceAppearances: [],
  megaArtist: '',
  megaSpecies1: '',
  megaSpecies2: '',
  megaSpecies3: '',
  megaType1: '',
  megaType2: '',
  megaType3: '',
  megaType4: '',
  megaType5: '',
  megaType6: '',
  megaAbility: '',
};

const TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Fire', label: 'Fire' },
  { value: 'Water', label: 'Water' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Grass', label: 'Grass' },
  { value: 'Ice', label: 'Ice' },
  { value: 'Fighting', label: 'Fighting' },
  { value: 'Poison', label: 'Poison' },
  { value: 'Ground', label: 'Ground' },
  { value: 'Flying', label: 'Flying' },
  { value: 'Psychic', label: 'Psychic' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Ghost', label: 'Ghost' },
  { value: 'Dragon', label: 'Dragon' },
  { value: 'Dark', label: 'Dark' },
  { value: 'Steel', label: 'Steel' },
  { value: 'Fairy', label: 'Fairy' },
];

export function TrainerMegaReferenceSubmissionForm({ onSubmissionComplete }: TrainerMegaReferenceSubmissionFormProps) {
  const { currentUser } = useAuth();

  const [references, setReferences] = useState<MegaReferenceEntry[]>([{ ...DEFAULT_MEGA_REFERENCE }]);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complexMode, setComplexMode] = useState(false);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Trainer options for FormSelect
  const trainerOptions = userTrainers.map(t => ({ value: String(t.id), label: t.name }));

  // Fetch user trainers and monsters
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.discord_id) return;
      try {
        const response = await trainerService.getAllTrainers();
        const allTrainers = response.trainers || [];
        // Mark which trainers belong to this user
        const userTrainersResponse = await trainerService.getUserTrainers(currentUser.discord_id);
        const ownedIds = new Set((userTrainersResponse.trainers || []).map((t: Trainer) => t.id));
        const trainersWithOwnership = allTrainers.map((t: Trainer) => ({
          ...t,
          is_owned: ownedIds.has(t.id)
        }));
        setUserTrainers(trainersWithOwnership);

        // Fetch monsters for user's own trainers (for gift rewards allocation)
        const ownedTrainers = trainersWithOwnership.filter((t: Trainer & { is_owned?: boolean }) => t.is_owned);
        if (ownedTrainers.length > 0) {
          const allMons: Monster[] = [];
          for (const trainer of ownedTrainers) {
            try {
              const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
              if (monstersResponse.monsters) allMons.push(...monstersResponse.monsters);
            } catch (err) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, err);
            }
          }
          setUserMonsters(allMons);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again.'));
      }
    };
    fetchData();
  }, [currentUser]);

  // Reference management
  const addReference = useCallback(() => {
    setReferences(prev => [...prev, { ...DEFAULT_MEGA_REFERENCE }]);
  }, []);

  const removeReference = useCallback((index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReferenceChange = useCallback((index: number, field: keyof MegaReferenceEntry, value: unknown) => {
    setReferences(prev => {
      const updated = [...prev];
      const ref = { ...updated[index], [field]: value };

      if (field === 'instanceCount') {
        const count = parseInt(String(value)) || 1;
        if (!ref.sameAppearanceForEachInstance) {
          const needed = Math.max(0, count - 1);
          const current = [...(ref.instanceAppearances || [])];
          if (needed > current.length) {
            for (let i = current.length; i < needed; i++) {
              current.push({ type: 'bust', instanceNumber: i + 2 });
            }
          } else if (needed < current.length) {
            current.splice(needed);
          }
          ref.instanceAppearances = current;
        } else {
          ref.instanceAppearances = [];
        }
      }

      if (field === 'sameAppearanceForEachInstance') {
        if (value) {
          ref.instanceAppearances = [];
        } else {
          const count = ref.instanceCount || 1;
          const needed = Math.max(0, count - 1);
          ref.instanceAppearances = Array.from({ length: needed }, (_, i) => ({
            type: 'bust' as const,
            instanceNumber: i + 2,
          }));
        }
      }

      updated[index] = ref;
      return updated;
    });
  }, []);

  const handleInstanceAppearanceChange = useCallback((refIndex: number, instanceIndex: number, value: string) => {
    setReferences(prev => {
      const updated = [...prev];
      const ref = { ...updated[refIndex] };
      const appearances = [...ref.instanceAppearances];
      if (appearances[instanceIndex]) {
        appearances[instanceIndex] = { ...appearances[instanceIndex], type: value as InstanceAppearance['type'] };
        ref.instanceAppearances = appearances;
        updated[refIndex] = ref;
      }
      return updated;
    });
  }, []);

  // File/URL handlers
  const handleFileUpload = useCallback((index: number, file?: File) => {
    if (!file) return;
    setReferences(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        referenceFile: file,
        referenceUrl: '',
        referencePreview: URL.createObjectURL(file),
      };
      return updated;
    });
  }, []);

  const handleUrlChange = useCallback((index: number, url: string) => {
    setReferences(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        referenceUrl: url,
        referenceFile: null,
        referencePreview: url,
      };
      return updated;
    });
  }, []);

  // Submission completion
  const handleSubmissionComplete = useCallback((result: SubmissionResult) => {
    setReferences([{ ...DEFAULT_MEGA_REFERENCE }]);
    onSubmissionComplete?.(result);
  }, [onSubmissionComplete]);

  const handleGiftRewardsComplete = useCallback(() => {
    setShowGiftRewards(false);
    if (submissionResult) handleSubmissionComplete(submissionResult);
  }, [submissionResult, handleSubmissionComplete]);

  const handleGiftRewardsCancel = useCallback(() => {
    setShowGiftRewards(false);
    if (submissionResult) handleSubmissionComplete(submissionResult);
  }, [submissionResult, handleSubmissionComplete]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validRefs = references.filter(ref => ref.trainerId && (ref.referenceUrl || ref.referenceFile));
    if (validRefs.length === 0) {
      setError('Please provide at least one trainer mega reference with a trainer and image.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('referenceType', 'trainer mega');
      formData.append('referenceCount', String(validRefs.length));

      validRefs.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, ref.trainerId);
        formData.append(`appearanceType_${index}`, ref.appearanceType);
        formData.append(`instanceCount_${index}`, String(ref.instanceCount || 1));
        formData.append(`sameAppearanceForEachInstance_${index}`, ref.sameAppearanceForEachInstance ? 'true' : 'false');
        if (ref.referenceFile) {
          formData.append(`referenceFile_${index}`, ref.referenceFile);
        } else if (ref.referenceUrl) {
          formData.append(`referenceUrl_${index}`, ref.referenceUrl);
        }
        if (!ref.sameAppearanceForEachInstance && ref.instanceAppearances?.length > 0) {
          ref.instanceAppearances.forEach((appearance, i) => {
            formData.append(`instanceAppearance_${index}_${i}_type`, appearance.type);
            formData.append(`instanceAppearance_${index}_${i}_instanceNumber`, String(appearance.instanceNumber));
          });
        }
        if (ref.useCustomLevels && ref.customLevels > 0) {
          formData.append(`customLevels_${index}`, String(ref.customLevels));
        }
        // Mega info fields
        const megaFields = ['megaArtist', 'megaSpecies1', 'megaSpecies2', 'megaSpecies3',
          'megaType1', 'megaType2', 'megaType3', 'megaType4', 'megaType5', 'megaType6', 'megaAbility'] as const;
        megaFields.forEach(field => {
          if (ref[field]) formData.append(`${field}_${index}`, ref[field]);
        });
      });

      const result = await submissionService.submitReference(formData);
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;

      if (totalGiftLevels > 0) {
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
      } else {
        handleSubmissionComplete(result);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit trainer mega reference. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [references, handleSubmissionComplete]);

  if (showGiftRewards) {
    return (
      <GiftRewards
        giftLevels={giftLevels}
        userTrainers={userTrainers}
        userMonsters={userMonsters}
        onComplete={handleGiftRewardsComplete}
        onCancel={handleGiftRewardsCancel}
        submissionType="reference"
      />
    );
  }

  return (
    <div className="submission-form-container">
      <h2>Submit Trainer Mega Reference</h2>
      <p className="form-tooltip--section">Submit reference images for trainer mega evolutions. Mega info fields are optional and can be filled in later.</p>
      <div className="mode-toggle">
        <button type="button" className={`button ${complexMode ? 'secondary' : 'primary'}`} onClick={() => setComplexMode(false)}>Simple Mode</button>
        <button type="button" className={`button ${complexMode ? 'primary' : 'secondary'}`} onClick={() => setComplexMode(true)}>Advanced Mode</button>
        <p className="form-help-text">
          {complexMode ? 'Control appearance type, instance count, and custom level rewards.' : 'Quick submit with default rewards. Switch to Advanced for more options.'}
        </p>
      </div>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Submission Error"
      />
      <form className="submission-form" onSubmit={handleSubmit}>
        {references.map((reference, index) => (
          <div key={index} className="reference-entry">
            <div className="reference-header">
              <h3>Trainer Mega Reference #{index + 1}</h3>
              {references.length > 1 && (
                <button type="button" className="button danger" onClick={() => removeReference(index)}>Remove</button>
              )}
            </div>

            <FormSelect
              name={`trainerId-${index}`}
              label="Trainer"
              value={reference.trainerId}
              onChange={(e) => handleReferenceChange(index, 'trainerId', e.target.value)}
              options={trainerOptions}
              placeholder="Select a trainer..."
              required
            />

            {/* Reference Image */}
            <div className="form-group">
              <label>Trainer Mega Reference Image</label>
              <div className="file-upload-area">
                <input
                  id={`file-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                />
                <label htmlFor={`file-${index}`} className="file-upload-label">Upload Image</label>
                <span className="file-name">{reference.referenceFile?.name || 'No file chosen'}</span>
              </div>
              <div className="upload-divider">OR</div>
              <FormInput
                name={`url-${index}`}
                type="url"
                value={reference.referenceUrl}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="Enter image URL..."
              />
              {reference.referencePreview && (
                <div className="image-preview">
                  <img src={reference.referencePreview} alt="Trainer mega reference preview" />
                </div>
              )}
            </div>

            {complexMode && (<>
              {/* Appearance & Instances */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`appearance-type-${index}`}>Appearance Type</label>
                  <select
                    id={`appearance-type-${index}`}
                    className="select"
                    value={reference.appearanceType}
                    onChange={(e) => handleReferenceChange(index, 'appearanceType', e.target.value)}
                  >
                    <option value="bust">Bust (+1 level)</option>
                    <option value="halfBody">Half Body (+2 levels)</option>
                    <option value="fullBody">Full Body (+3 levels)</option>
                  </select>
                  <p className="form-help-text">How much of the trainer is shown in the primary drawing.</p>
                </div>
                <FormInput
                  name={`instance-count-${index}`}
                  label="Number of Instances"
                  type="number"
                  min={1}
                  max={10}
                  value={reference.instanceCount}
                  onChange={(e) => handleReferenceChange(index, 'instanceCount', e.target.value)}
                  helpText="How many times this trainer appears in the reference."
                />
              </div>

              {reference.instanceCount > 1 && (
                <FormCheckbox
                  name={`same-appearance-${index}`}
                  label="Same appearance type for all instances"
                  checked={reference.sameAppearanceForEachInstance}
                  onChange={(e) => handleReferenceChange(index, 'sameAppearanceForEachInstance', e.target.checked)}
                  helpText="Uncheck if different instances have different sizes (e.g. one full body, one bust)."
                />
              )}

              {reference.instanceCount > 1 && !reference.sameAppearanceForEachInstance && reference.instanceAppearances.length > 0 && (
                <div className="instance-appearances">
                  <h5>Per-Instance Appearance Types</h5>
                  <p className="form-tooltip--section">Instance #1 uses the appearance type above. Set the type for each additional instance below.</p>
                  {reference.instanceAppearances.map((appearance, i) => (
                    <div key={i} className="option-row">
                      <label className="per-instance-label">Instance #{appearance.instanceNumber}:</label>
                      <select
                        className="select"
                        value={appearance.type}
                        onChange={(e) => handleInstanceAppearanceChange(index, i, e.target.value)}
                      >
                        <option value="bust">Bust (+1 level)</option>
                        <option value="halfBody">Half Body (+2 levels)</option>
                        <option value="fullBody">Full Body (+3 levels)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Levels */}
              <FormCheckbox
                name={`custom-levels-${index}`}
                label="Use custom level reward (default: 9 levels)"
                checked={reference.useCustomLevels}
                onChange={(e) => handleReferenceChange(index, 'useCustomLevels', e.target.checked)}
                helpText="Override the default 9-level reward for mega references."
              />
              {reference.useCustomLevels && (
                <FormInput
                  name={`custom-levels-value-${index}`}
                  type="number"
                  min={1}
                  max={50}
                  value={reference.customLevels}
                  onChange={(e) => handleReferenceChange(index, 'customLevels', parseInt(e.target.value) || 0)}
                  placeholder="Custom levels"
                />
              )}
            </>)}

            {/* Mega Information (Optional) */}
            <div className="form-section">
              <h4>Mega Information (Optional)</h4>
              <p className="form-tooltip--section">Fill out these fields for convenience. This information will be stored with your trainer.</p>

              <div className="form-row">
                <FormInput
                  name={`megaArtist-${index}`}
                  label="Mega Artist"
                  value={reference.megaArtist}
                  onChange={(e) => handleReferenceChange(index, 'megaArtist', e.target.value)}
                  placeholder="Artist name"
                />
                <FormInput
                  name={`megaAbility-${index}`}
                  label="Mega Ability"
                  value={reference.megaAbility}
                  onChange={(e) => handleReferenceChange(index, 'megaAbility', e.target.value)}
                  placeholder="Ability name"
                />
              </div>

              <div className="form-row">
                <FormInput
                  name={`megaSpecies1-${index}`}
                  label="Species 1"
                  value={reference.megaSpecies1}
                  onChange={(e) => handleReferenceChange(index, 'megaSpecies1', e.target.value)}
                  placeholder="Primary species"
                />
                <FormInput
                  name={`megaSpecies2-${index}`}
                  label="Species 2"
                  value={reference.megaSpecies2}
                  onChange={(e) => handleReferenceChange(index, 'megaSpecies2', e.target.value)}
                  placeholder="Secondary species"
                />
                <FormInput
                  name={`megaSpecies3-${index}`}
                  label="Species 3"
                  value={reference.megaSpecies3}
                  onChange={(e) => handleReferenceChange(index, 'megaSpecies3', e.target.value)}
                  placeholder="Tertiary species"
                />
              </div>

              <div className="form-row">
                <FormSelect
                  name={`megaType1-${index}`}
                  label="Type 1"
                  value={reference.megaType1}
                  onChange={(e) => handleReferenceChange(index, 'megaType1', e.target.value)}
                  options={TYPE_OPTIONS}
                />
                <FormSelect
                  name={`megaType2-${index}`}
                  label="Type 2"
                  value={reference.megaType2}
                  onChange={(e) => handleReferenceChange(index, 'megaType2', e.target.value)}
                  options={TYPE_OPTIONS}
                />
                <FormSelect
                  name={`megaType3-${index}`}
                  label="Type 3"
                  value={reference.megaType3}
                  onChange={(e) => handleReferenceChange(index, 'megaType3', e.target.value)}
                  options={TYPE_OPTIONS}
                />
              </div>

              <div className="form-row">
                <FormSelect
                  name={`megaType4-${index}`}
                  label="Type 4"
                  value={reference.megaType4}
                  onChange={(e) => handleReferenceChange(index, 'megaType4', e.target.value)}
                  options={TYPE_OPTIONS}
                />
                <FormSelect
                  name={`megaType5-${index}`}
                  label="Type 5"
                  value={reference.megaType5}
                  onChange={(e) => handleReferenceChange(index, 'megaType5', e.target.value)}
                  options={TYPE_OPTIONS}
                />
                <FormSelect
                  name={`megaType6-${index}`}
                  label="Type 6"
                  value={reference.megaType6}
                  onChange={(e) => handleReferenceChange(index, 'megaType6', e.target.value)}
                  options={TYPE_OPTIONS}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="button secondary mt-md" onClick={addReference}>
            + Add Another Reference
          </button>
          <button type="submit" className="button success" disabled={loading}>
            {loading ? (<><LoadingSpinner size="small" /> Submitting...</>) : 'Submit Trainer Mega References'}
          </button>
        </div>
      </form>
    </div>
  );
}

