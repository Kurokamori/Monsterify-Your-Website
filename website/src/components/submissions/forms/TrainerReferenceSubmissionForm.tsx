import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { extractErrorMessage } from '../../../utils/errorUtils';
import submissionService from '../../../services/submissionService';
import trainerService from '../../../services/trainerService';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import { TrainerAutocomplete } from '../../common/TrainerAutocomplete';
import { FormInput } from '../../common/FormInput';
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

interface ReferenceEntry {
  trainerId: string | number;
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
}

interface SubmissionResult {
  totalGiftLevels?: number;
  rewards?: { totalGiftLevels?: number };
  [key: string]: unknown;
}

interface TrainerReferenceSubmissionFormProps {
  onSubmissionComplete?: (result: SubmissionResult) => void;
}

const DEFAULT_REFERENCE: ReferenceEntry = {
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
};

export function TrainerReferenceSubmissionForm({ onSubmissionComplete }: TrainerReferenceSubmissionFormProps) {
  const { currentUser } = useAuth();

  const [references, setReferences] = useState<ReferenceEntry[]>([{ ...DEFAULT_REFERENCE }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complexMode, setComplexMode] = useState(false);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [rewardEstimate, setRewardEstimate] = useState<RewardEstimate | null>(null);
  const [showRewardEstimate, setShowRewardEstimate] = useState(false);
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Fetch trainers and monsters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await trainerService.getAllTrainers();
        const trainers: Trainer[] = response.trainers || [];
        setUserTrainers(trainers);

        const allMonsters: Monster[] = [];
        for (const trainer of trainers) {
          try {
            const monstersResponse = await trainerService.getAllTrainerMonsters(trainer.id);
            if (monstersResponse.monsters) {
              allMonsters.push(...monstersResponse.monsters);
            }
          } catch {
            // Skip trainer if monsters fail to load
          }
        }
        setUserMonsters(allMonsters);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      }
    };
    if (currentUser) fetchData();
  }, [currentUser]);

  const updateReference = useCallback((index: number, field: keyof ReferenceEntry, value: unknown) => {
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

  const addReference = useCallback(() => {
    setReferences(prev => [...prev, { ...DEFAULT_REFERENCE }]);
  }, []);

  const removeReference = useCallback((index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferences(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          referenceFile: file,
          referencePreview: URL.createObjectURL(file),
        };
        return updated;
      });
    }
  }, []);

  const getValidReferences = useCallback(() => {
    return references.filter(ref => ref.trainerId && (ref.referenceUrl || ref.referenceFile));
  }, [references]);

  const calculateRewardEstimate = useCallback(async () => {
    const valid = getValidReferences();
    if (valid.length === 0) {
      setError('Please provide at least one valid reference with a trainer and image.');
      return;
    }
    try {
      setLoading(true);
      const response = await submissionService.calculateReferenceRewards({
        referenceType: 'trainer',
        references: valid.map(ref => ({
          trainerId: Number(ref.trainerId),
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
  }, [getValidReferences]);

  const handleSubmissionComplete = useCallback((result: SubmissionResult) => {
    setReferences([{ ...DEFAULT_REFERENCE }]);
    setRewardEstimate(null);
    setShowRewardEstimate(false);
    onSubmissionComplete?.(result);
  }, [onSubmissionComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = getValidReferences();
    if (valid.length === 0) {
      setError('Please provide at least one valid reference with a trainer and image.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('referenceType', 'trainer');

      valid.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, String(ref.trainerId));
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
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;

      if (totalGiftLevels > 0) {
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
      } else {
        handleSubmissionComplete(result);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit trainer references. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGiftRewardsComplete = useCallback(() => {
    setShowGiftRewards(false);
    if (submissionResult) handleSubmissionComplete(submissionResult);
  }, [submissionResult, handleSubmissionComplete]);

  const handleGiftRewardsCancel = useCallback(() => {
    setShowGiftRewards(false);
    if (submissionResult) handleSubmissionComplete(submissionResult);
  }, [submissionResult, handleSubmissionComplete]);

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
      <h2>Submit Trainer References</h2>
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
          <h3>Trainer References</h3>
          <p className="form-tooltip--section">
            Submit reference images for your trainers. Each ref needs a trainer and an image (upload or URL).
          </p>

          <div className="reference-list">
            {references.map((reference, index) => (
              <div key={index} className="reference-entry">
                <div className="reference-header">
                  <h4>Reference #{index + 1}</h4>
                  {index > 0 && (
                    <button type="button" className="button danger" onClick={() => removeReference(index)}>
                      Remove
                    </button>
                  )}
                </div>

                <TrainerAutocomplete
                  id={`trainer-${index}`}
                  trainers={userTrainers}
                  selectedTrainerId={reference.trainerId}
                  onSelect={(id) => updateReference(index, 'trainerId', id)}
                  label="Trainer"
                  placeholder="Type to search trainers..."
                  required
                />

                <div className="form-row">
                  <FormInput
                    name={`reference-url-${index}`}
                    label="Reference URL"
                    type="url"
                    value={reference.referenceUrl}
                    onChange={(e) => updateReference(index, 'referenceUrl', e.target.value)}
                    placeholder="Enter URL to reference image"
                  />
                  <div className="file-upload-area">
                    <label className="form-label">Or Upload Image</label>
                    <input
                      id={`reference-file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                    />
                    <label htmlFor={`reference-file-${index}`} className="file-upload-label">
                      Choose File
                    </label>
                    <span className="file-name">
                      {reference.referenceFile ? reference.referenceFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>

                {reference.referencePreview && (
                  <div className="image-preview">
                    <img src={reference.referencePreview} alt="Reference Preview" />
                  </div>
                )}

                {complexMode && (<>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`appearance-type-${index}`}>Appearance Type</label>
                      <select
                        id={`appearance-type-${index}`}
                        className="select"
                        value={reference.appearanceType}
                        onChange={(e) => updateReference(index, 'appearanceType', e.target.value)}
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
                      onChange={(e) => updateReference(index, 'instanceCount', e.target.value)}
                      helpText="How many times this trainer appears in the reference."
                    />
                  </div>

                  {reference.instanceCount > 1 && (
                    <FormCheckbox
                      name={`same-appearance-${index}`}
                      label="Same appearance type for all instances"
                      checked={reference.sameAppearanceForEachInstance}
                      onChange={(e) => updateReference(index, 'sameAppearanceForEachInstance', e.target.checked)}
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

                  <FormCheckbox
                    name={`custom-levels-${index}`}
                    label="Use custom level reward"
                    checked={reference.useCustomLevels}
                    onChange={(e) => updateReference(index, 'useCustomLevels', e.target.checked)}
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
                      onChange={(e) => updateReference(index, 'customLevels', Number(e.target.value))}
                    />
                  )}
                </>)}
              </div>
            ))}
          </div>

          <button type="button" className="button primary mt-md" onClick={addReference}>
            Add Another Reference
          </button>
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
                <h4>Estimated Rewards</h4>
                <div className="reward-estimate-grid">
                  <div className="submission-form__reward-item">
                    <span className="submission-form__reward-label">Levels:</span>
                    <span className="submission-form__reward-value">{rewardEstimate.levels ?? 0}</span>
                  </div>
                  <div className="submission-form__reward-item">
                    <span className="submission-form__reward-label">Coins:</span>
                    <span className="submission-form__reward-value">{rewardEstimate.coins ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="button success" disabled={loading}>
            {loading ? <><LoadingSpinner size="small" /> Submitting...</> : 'Submit References'}
          </button>
        </div>
      </form>

    </div>
  );
}
