import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../../common/MonsterAutocomplete';
import { FormInput } from '../../common/FormInput';
import { FormCheckbox } from '../../common/FormCheckbox';
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

interface RewardEstimate {
  levels?: number;
  coins?: number;
  [key: string]: unknown;
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

interface MonsterReferenceSubmissionFormProps {
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

export function MonsterReferenceSubmissionForm({ onSubmissionComplete }: MonsterReferenceSubmissionFormProps) {
  const { currentUser } = useAuth();

  // Form state
  const [references, setReferences] = useState<ReferenceEntry[]>([{ ...DEFAULT_REFERENCE }]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complexMode, setComplexMode] = useState(false);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [rewardEstimate, setRewardEstimate] = useState<RewardEstimate | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);
  const [trainerMonsters, setTrainerMonsters] = useState<Record<string, Monster[]>>({});

  // Level cap reallocation state
  const [showLevelCapReallocation, setShowLevelCapReallocation] = useState(false);
  const [cappedMonsters, setCappedMonsters] = useState<CappedMonster[]>([]);
  const [availableTargets, setAvailableTargets] = useState<AllocationTarget[]>([]);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkTrainerId, setBulkTrainerId] = useState('');
  const [bulkCustomLevels, setBulkCustomLevels] = useState(0);
  const [bulkUseCustomLevels, setBulkUseCustomLevels] = useState(false);

  // Fetch trainers and monsters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        setUserTrainers(response.trainers || []);

        if (response.trainers?.length > 0) {
          const allMons: Monster[] = [];
          for (const trainer of response.trainers) {
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
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      }
    };

    fetchData();
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

  // Add a new reference entry
  const addReference = useCallback(() => {
    setReferences(prev => [...prev, { ...DEFAULT_REFERENCE }]);
  }, []);

  // Remove a reference entry
  const removeReference = useCallback((index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle reference field changes
  const handleReferenceChange = useCallback((index: number, field: keyof ReferenceEntry, value: unknown) => {
    setReferences(prev => {
      const updated = [...prev];
      const ref = { ...updated[index], [field]: value };

      // If changing trainer, fetch monsters for dropdown
      if (field === 'trainerId' && value) {
        fetchTrainerMonsters(value as string);
      }

      // If changing instance count, update instance appearances
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

      // If toggling sameAppearanceForEachInstance
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

  // Handle reference image file change
  const handleReferenceImageChange = useCallback((index: number, file?: File) => {
    if (!file) return;
    setReferences(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        referenceFile: file,
        referencePreview: URL.createObjectURL(file),
      };
      return updated;
    });
  }, []);

  // Handle instance appearance change
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

  // Handle bulk image upload
  const handleBulkImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!bulkTrainerId) {
      setError('Please select a trainer before uploading multiple images.');
      return;
    }
    const newRefs: ReferenceEntry[] = files.map(file => ({
      ...DEFAULT_REFERENCE,
      trainerId: bulkTrainerId,
      referenceFile: file,
      referencePreview: URL.createObjectURL(file),
      customLevels: bulkUseCustomLevels ? bulkCustomLevels : 0,
      useCustomLevels: bulkUseCustomLevels,
    }));
    setReferences(newRefs);
    fetchTrainerMonsters(bulkTrainerId);
    setError('');
  }, [bulkTrainerId, bulkUseCustomLevels, bulkCustomLevels, fetchTrainerMonsters]);

  // Toggle bulk upload mode
  const toggleBulkUpload = useCallback(() => {
    setShowBulkUpload(prev => {
      if (prev) {
        setBulkTrainerId('');
        setBulkCustomLevels(0);
        setBulkUseCustomLevels(false);
      }
      return !prev;
    });
  }, []);

  // Calculate reward estimate
  const calculateRewardEstimate = useCallback(async () => {
    const validRefs = references.filter(ref => ref.trainerId && ref.monsterName && (ref.referenceUrl || ref.referenceFile));
    if (validRefs.length === 0) {
      setError('Please provide at least one valid reference with a trainer, monster name, and image.');
      return;
    }
    try {
      setLoading(true);
      const response = await submissionService.calculateReferenceRewards({
        referenceType: 'monster',
        references: validRefs.map(ref => ({
          trainerId: parseInt(ref.trainerId),
          monsterName: ref.monsterName,
          customLevels: ref.useCustomLevels ? ref.customLevels : undefined,
        })),
      });
      setRewardEstimate(response);
      setShowRewardEstimate(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to calculate rewards. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [references]);

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
    setRewardEstimate(null);
    setShowRewardEstimate(false);
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

    const validRefs = references.filter(ref => ref.trainerId && ref.monsterName && (ref.referenceUrl || ref.referenceFile));
    if (validRefs.length === 0) {
      setError('Please provide at least one valid reference with a trainer, monster name, and image.');
      return;
    }

    const missingTrainer = references.some(ref => ref.monsterName && !ref.trainerId);
    if (missingTrainer) {
      setError('All monsters must have a trainer selected.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('referenceType', 'monster');

      validRefs.forEach((ref, index) => {
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
      setError(extractErrorMessage(err, 'Failed to submit monster references. Please try again.'));
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
      <h2>Submit Monster References</h2>
      <div className="mode-toggle">
        <button
          type="button"
          className={`button ${complexMode ? 'secondary' : 'primary'}`}
          onClick={() => setComplexMode(false)}
        >
          Simple Mode
        </button>
        <button
          type="button"
          className={`button ${complexMode ? 'primary' : 'secondary'}`}
          onClick={() => setComplexMode(true)}
        >
          Advanced Mode
        </button>
        <p className="form-help-text">
          {complexMode
            ? 'Control appearance type, instance count, and custom level rewards.'
            : 'Quick submit with default rewards. Switch to Advanced for more options.'}
        </p>
      </div>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError('')}
        message={error}
        title="Submission Error"
      />

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Bulk Upload Section */}
        <div className="form-section">
          <div className="reference-header">
            <h3>Upload Options</h3>
            <button
              type="button"
              className={`button no-flex ${showBulkUpload ? 'primary' : 'secondary'}`}
              onClick={toggleBulkUpload}
            >
              {showBulkUpload ? 'Switch to Individual Upload' : 'Upload Many Refs'}
            </button>
          </div>

          {showBulkUpload && (
            <div className="bulk-upload-section">
              <h4>Bulk Upload Settings</h4>
              <p className="form-tooltip--section">
                Select a trainer and upload multiple images at once. You&apos;ll then fill in the monster names for each image.
              </p>

              <div>
                <div>
                  <TrainerAutocomplete
                    id="bulk-trainer"
                    trainers={userTrainers}
                    selectedTrainerId={bulkTrainerId}
                    onSelect={(id) => setBulkTrainerId(String(id))}
                    label="Trainer (for all uploads)"
                    placeholder="Type to search trainers..."
                    required
                  />
                </div>
              </div>

              <FormCheckbox
                name="bulk-custom-levels"
                label="Use custom level reward for all"
                checked={bulkUseCustomLevels}
                onChange={(e) => setBulkUseCustomLevels(e.target.checked)}
              />

              {bulkUseCustomLevels && (
                <FormInput
                  name="bulk-custom-levels-value"
                  label="Custom Levels (for all)"
                  type="number"
                  min={0}
                  max={10}
                  value={bulkCustomLevels}
                  onChange={(e) => setBulkCustomLevels(parseInt(e.target.value) || 0)}
                />
              )}

              <div className="form-group">
                <label htmlFor="bulk-images">Upload Multiple Images</label>
                <div className="file-upload-area">
                  <input
                    id="bulk-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkImageUpload}
                  />
                  <label htmlFor="bulk-images" className="file-upload-label">Choose Multiple Images</label>
                </div>
                <p className="form-help-text">Hold Ctrl (or Cmd on Mac) to select multiple images at once</p>
              </div>
            </div>
          )}
        </div>

        {/* Reference Entries */}
        <div className="form-section">
          <h3>{showBulkUpload && references.length > 1 ? 'Review and Name Your Monsters' : 'Monster References'}</h3>
          {!showBulkUpload && (
            <p className="form-tooltip--section">Submit reference images for your monsters. Each ref needs a trainer, monster name, and an image.</p>
          )}
          {showBulkUpload && references.length > 1 && (
            <p className="form-help-text">Fill in the monster names for each uploaded image.</p>
          )}

          {references.map((reference, index) => (
            <div key={index} className="reference-entry">
              <div className="reference-header">
                <h4>Reference #{index + 1}</h4>
                {index > 0 && (
                  <button type="button" className="button danger no-flex" onClick={() => removeReference(index)}>Remove</button>
                )}
              </div>

              {/* Individual upload mode: trainer + monster autocomplete */}
              {!showBulkUpload && (
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
              )}

              {/* Bulk upload mode: monster name only */}
              {showBulkUpload && (
                <div className="form-row">
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
                  <div className="bulk-info">
                    <span>Trainer: {userTrainers.find(t => String(t.id) === reference.trainerId)?.name || 'Unknown'}</span>
                  </div>
                </div>
              )}

              {/* File upload - individual mode only */}
              {!showBulkUpload && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`reference-url-${index}`}>Reference URL</label>
                    <input
                      id={`reference-url-${index}`}
                      className="input"
                      type="url"
                      value={reference.referenceUrl}
                      onChange={(e) => handleReferenceChange(index, 'referenceUrl', e.target.value)}
                      placeholder="Enter URL to reference image"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`reference-file-${index}`}>Or Upload Image</label>
                    <div className="file-upload-area">
                      <input
                        id={`reference-file-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleReferenceImageChange(index, e.target.files?.[0])}
                      />
                      <label htmlFor={`reference-file-${index}`} className="file-upload-label">Choose File</label>
                      <span className="file-name">{reference.referenceFile?.name || 'No file chosen'}</span>
                    </div>
                  </div>
                </div>
              )}

              {reference.referencePreview && (
                <div className="image-preview">
                  <img src={reference.referencePreview} alt="Reference Preview" />
                </div>
              )}

              {/* Advanced options - individual mode only, complex mode only */}
              {!showBulkUpload && complexMode && (
                <>
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

                  {/* Instance appearances when not using same appearance */}
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
                      label="Custom Levels"
                      type="number"
                      min={0}
                      max={10}
                      value={reference.customLevels}
                      onChange={(e) => handleReferenceChange(index, 'customLevels', e.target.value)}
                      helpText="Number of levels to award instead of the default."
                    />
                  )}
                </>
              )}

              {/* Bulk mode: show custom levels info */}
              {showBulkUpload && reference.useCustomLevels && (
                <div className="bulk-info">
                  <span>Custom Levels: {reference.customLevels}</span>
                </div>
              )}
            </div>
          ))}

          {!showBulkUpload && (
            <button type="button" className="button primary mt-md" onClick={addReference}>
              + Add Another Reference
            </button>
          )}
        </div>

        {/* Reward Estimate - advanced mode only */}
        {complexMode && (
          <div className="form-section">
            <h3>Reward Estimate</h3>
            <button type="button" className="button secondary mb-md" onClick={calculateRewardEstimate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Rewards'}
            </button>

            {showRewardEstimate && rewardEstimate && (
              <div className="reward-estimate-section">
                <h4>Estimated Rewards:</h4>
                <div className="submission__reward-section">
                  <h5>Trainer Rewards</h5>
                  <div className="reward-details">
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Levels:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.levels ?? 0}</span>
                    </div>
                    <div className="submission-form__reward-item">
                      <span className="submission-form__reward-label">Coins:</span>
                      <span className="submission-form__reward-value">{rewardEstimate.coins ?? 0} <i className="fas fa-coins"></i></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="button success" disabled={loading}>
            {loading ? (<><LoadingSpinner size="small" /> Submitting...</>) : 'Submit References'}
          </button>
        </div>
      </form>
    </div>
  );
}
