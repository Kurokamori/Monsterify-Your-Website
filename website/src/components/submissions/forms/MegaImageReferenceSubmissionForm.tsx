import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { FormInput } from '../../common/FormInput';
import { FormCheckbox } from '../../common/FormCheckbox';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../../common/MonsterAutocomplete';
import { GiftRewards } from '../GiftRewards';
import { LevelCapReallocation } from '../LevelCapReallocation';
import api from '../../../services/api';

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
  level?: number;
}

interface InstanceAppearance {
  type: 'bust' | 'halfBody' | 'fullBody';
  instanceNumber: number;
}

interface ReferenceEntry {
  trainerId: string;
  monsterName: string;
  referenceUrl: string;
  referenceFile: File | null;
  referencePreview: string;
  customLevels: number;
  useCustomLevels: boolean;
  appearanceType: 'bust' | 'halfBody' | 'fullBody';
  instanceCount: number;
  sameAppearanceForEachInstance: boolean;
  instanceAppearances: InstanceAppearance[];
}

interface CappedMonster {
  monsterId: number;
  name?: string;
  species1?: string;
  img_link?: string;
  image_url?: string;
  currentLevel: number;
  originalLevels: number;
  excessLevels: number;
  trainerName?: string;
}

interface AllocationTarget {
  monsterId?: number;
  trainerId?: number;
  name: string;
  level?: number;
}

type Allocations = Record<number, Record<string, number>>;

interface SubmissionResult {
  success?: boolean;
  message?: string;
  hasLevelCaps?: boolean;
  cappedMonsters?: CappedMonster[];
  totalGiftLevels?: number;
  rewards?: { totalGiftLevels?: number };
}

interface MegaImageReferenceSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
}

const DEFAULT_REFERENCE: ReferenceEntry = {
  trainerId: '',
  monsterName: '',
  referenceUrl: '',
  referenceFile: null,
  referencePreview: '',
  customLevels: 0,
  useCustomLevels: false,
  appearanceType: 'fullBody',
  instanceCount: 1,
  sameAppearanceForEachInstance: true,
  instanceAppearances: [],
};

export function MegaImageReferenceSubmissionForm({ onSubmissionComplete }: MegaImageReferenceSubmissionFormProps) {
  const { currentUser } = useAuth();

  const [references, setReferences] = useState<ReferenceEntry[]>([{ ...DEFAULT_REFERENCE }]);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complexMode, setComplexMode] = useState(false);

  // Level cap reallocation state
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState<CappedMonster[]>([]);
  const [availableTargets, setAvailableTargets] = useState<AllocationTarget[]>([]);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [trainerMonsters, setTrainerMonsters] = useState<Record<string, Monster[]>>({});

  // Fetch trainers and monsters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        const allTrainers = response.trainers || [];
        // Mark which trainers belong to this user
        const userTrainersResponse = await trainerService.getUserTrainers(currentUser?.discord_id);
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

    if (currentUser?.discord_id) fetchData();
  }, [currentUser]);

  // Fetch monsters for a specific trainer (cached)
  const fetchTrainerMonsters = useCallback(async (trainerId: string) => {
    if (!trainerId || trainerMonsters[trainerId]) return;
    try {
      const response = await monsterService.getTrainerMonsters(Number(trainerId));
      setTrainerMonsters(prev => ({ ...prev, [trainerId]: response.monsters || [] }));
    } catch (err) {
      console.error('Error fetching trainer monsters:', err);
    }
  }, [trainerMonsters]);

  // Reference management
  const addReference = useCallback(() => {
    setReferences(prev => [...prev, { ...DEFAULT_REFERENCE }]);
  }, []);

  const removeReference = useCallback((index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReferenceChange = useCallback((index: number, field: keyof ReferenceEntry, value: string | number | boolean | File | null) => {
    setReferences(prev => {
      const updated = [...prev];
      const ref = { ...updated[index], [field]: value };

      if (field === 'trainerId' && value) {
        fetchTrainerMonsters(String(value));
      }

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
  }, [fetchTrainerMonsters]);

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

  const handleFileUpload = useCallback((index: number, file: File | undefined) => {
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

  // Build available targets for level cap reallocation
  const buildAvailableTargets = useCallback((): AllocationTarget[] => {
    const targets: AllocationTarget[] = [];
    userTrainers.forEach(trainer => {
      targets.push({ trainerId: trainer.id, name: trainer.name, level: trainer.level });
    });
    userMonsters.forEach(monster => {
      targets.push({ monsterId: monster.id, name: monster.name, level: monster.level });
    });
    return targets;
  }, [userTrainers, userMonsters]);

  // Apply level allocations after cap reallocation
  const applyLevelAllocations = useCallback(async (allocations: Allocations) => {
    const promises: Promise<unknown>[] = [];
    for (const [, targets] of Object.entries(allocations)) {
      for (const [targetKey, levels] of Object.entries(targets)) {
        if (levels > 0) {
          const [targetType, targetId] = targetKey.split('_');
          if (targetType === 'monster') {
            promises.push(api.post('/monsters/add-levels', { monsterId: parseInt(targetId), levels }));
          } else if (targetType === 'trainer') {
            promises.push(api.post('/trainers/add-levels', { trainerId: parseInt(targetId), levels }));
          }
        }
      }
    }
    await Promise.all(promises);
  }, []);

  // Handle submission completion
  const handleSubmissionComplete = useCallback((result: SubmissionResult) => {
    setReferences([{ ...DEFAULT_REFERENCE }]);
    onSubmissionComplete?.(result);
  }, [onSubmissionComplete]);

  // Continue to gift rewards (or complete) after level cap reallocation
  const continueNormalRewardFlow = useCallback(() => {
    const result = submissionResult;
    if (!result) return;
    const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;
    if (totalGiftLevels > 0) {
      setGiftLevels(totalGiftLevels);
      setShowGiftRewards(true);
    } else {
      handleSubmissionComplete(result);
    }
  }, [submissionResult, handleSubmissionComplete]);

  // Level cap reallocation handlers
  const handleLevelCapComplete = useCallback(async (allocations: Allocations) => {
    setShowLevelCapReallocation(false);
    setLoading(true);
    try {
      await applyLevelAllocations(allocations);
      continueNormalRewardFlow();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to apply level allocations. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [applyLevelAllocations, continueNormalRewardFlow]);

  const handleLevelCapCancel = useCallback(() => {
    setShowLevelCapReallocation(false);
  }, []);

  // Gift rewards handlers
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

    const validReferences = references.filter(
      ref => ref.trainerId && ref.monsterName && (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one complete reference with trainer, monster name, and image.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('referenceType', 'mega image');

      validReferences.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, ref.trainerId);
        formData.append(`monsterName_${index}`, ref.monsterName);
        formData.append(`appearanceType_${index}`, ref.appearanceType);
        formData.append(`instanceCount_${index}`, String(ref.instanceCount || 1));
        formData.append(`sameAppearanceForEachInstance_${index}`, ref.sameAppearanceForEachInstance ? 'true' : 'false');
        if (ref.referenceFile) {
          formData.append(`referenceFile_${index}`, ref.referenceFile);
        } else if (ref.referenceUrl) {
          formData.append(`referenceUrl_${index}`, ref.referenceUrl);
        }
        if (ref.useCustomLevels) {
          formData.append(`customLevels_${index}`, String(ref.customLevels));
        }
        if (!ref.sameAppearanceForEachInstance && ref.instanceAppearances?.length > 0) {
          ref.instanceAppearances.forEach((appearance, i) => {
            formData.append(`instanceAppearance_${index}_${i}_type`, appearance.type);
            formData.append(`instanceAppearance_${index}_${i}_instanceNumber`, String(appearance.instanceNumber));
          });
        }
      });

      const result = await submissionService.submitReference(formData);
      setSubmissionResult(result);

      if (result.hasLevelCaps && result.cappedMonsters?.length > 0) {
        setCappedMonsters(result.cappedMonsters);
        setAvailableTargets(buildAvailableTargets());
        setShowLevelCapReallocation(true);
      } else {
        const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;
        if (totalGiftLevels > 0) {
          setGiftLevels(totalGiftLevels);
          setShowGiftRewards(true);
        } else {
          handleSubmissionComplete(result);
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit references. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [references, buildAvailableTargets, handleSubmissionComplete]);

  if (loading && userTrainers.length === 0) {
    return <LoadingSpinner />;
  }

  if (showLevelCapReallocation) {
    return (
      <LevelCapReallocation
        cappedMonsters={cappedMonsters}
        availableTargets={availableTargets}
        onComplete={handleLevelCapComplete}
        onCancel={handleLevelCapCancel}
      />
    );
  }

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
      <h2>Mega Image Reference Submission</h2>
      <p className="form-tooltip--section">Submit mega evolution images for your monsters. Each needs a trainer, monster name, and an image.</p>
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
        <div className="form-section">
          <h3>Mega Image References</h3>

          {references.map((reference, index) => (
            <div key={index} className="reference-entry">
              <div className="reference-header">
                <h4>Reference #{index + 1}</h4>
                {index > 0 && (
                  <button type="button" className="button danger" onClick={() => removeReference(index)}>Remove</button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <TrainerAutocomplete
                    id={`trainer-${index}`}
                    trainers={userTrainers}
                    selectedTrainerId={reference.trainerId}
                    onSelect={(id) => handleReferenceChange(index, 'trainerId', String(id))}
                    label="Trainer"
                    placeholder="Type to search trainers..."
                    required
                  />
                </div>
                <div className="form-group">
                  <MonsterAutocomplete
                    id={`monster-name-${index}`}
                    monsters={reference.trainerId && trainerMonsters[reference.trainerId] ? trainerMonsters[reference.trainerId] : []}
                    onSelect={(name) => handleReferenceChange(index, 'monsterName', String(name))}
                    label="Monster Name"
                    placeholder={!reference.trainerId ? 'Select a trainer first' : 'Type to search monsters...'}
                    required
                    disabled={!reference.trainerId}
                    returnName
                    allowFreeText
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mega Evolution Image</label>
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
                  placeholder="Enter image URL"
                />

                {reference.referencePreview && (
                  <div className="image-preview">
                    <img src={reference.referencePreview} alt="Mega evolution preview" />
                  </div>
                )}
              </div>

              {complexMode && (<>
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
                    <p className="form-help-text">How much of the monster is shown in the primary drawing.</p>
                  </div>
                  <FormInput
                    name={`instance-count-${index}`}
                    label="Number of Instances"
                    type="number"
                    min={1}
                    max={10}
                    value={reference.instanceCount}
                    onChange={(e) => handleReferenceChange(index, 'instanceCount', e.target.value)}
                    helpText="How many times this monster appears in the reference."
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

                <div className="custom-levels-row">
                  <FormCheckbox
                    name={`custom-levels-${index}`}
                    label="Use custom level reward"
                    checked={reference.useCustomLevels}
                    onChange={(e) => handleReferenceChange(index, 'useCustomLevels', e.target.checked)}
                    helpText="Override the default level reward for this reference."
                  />
                  {reference.useCustomLevels && (
                    <FormInput
                      name={`custom-levels-value-${index}`}
                      type="number"
                      min={1}
                      max={50}
                      value={reference.customLevels}
                      onChange={(e) => handleReferenceChange(index, 'customLevels', parseInt(e.target.value) || 0)}
                      placeholder="Custom levels (1-50)"
                    />
                  )}
                </div>
              </>)}
            </div>
          ))}

          <button type="button" className="button primary mt-md" onClick={addReference}>
            + Add Another Reference
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="button success" disabled={loading}>
            {loading ? (<><LoadingSpinner size="small" /> Submitting...</>) : 'Submit References'}
          </button>
        </div>
      </form>
    </div>
  );
}
