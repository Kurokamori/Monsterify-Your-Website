import { useState, useEffect, useCallback, useRef, FormEvent, ChangeEvent } from 'react';
import { FormInput } from '../common/FormInput';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import {
  BasicInfoFields,
  PersonalInfoFields,
  SpeciesTypesFields,
  BiographyFields,
  FavoriteTypesFields,
  CharacterInfoFields,
} from './TrainerFormFields';
import {
  SecretsSection,
  RelationsSection,
  AdditionalRefsSection,
  MegaEvolutionSection,
} from './TrainerDynamicSections';
import {
  trainerToFormData,
  parseTrainerSecrets,
  parseTrainerRelations,
  parseTrainerAdditionalRefs,
  parseTrainerMegaData,
  buildTrainerSubmitFormData,
} from './trainerFormUtils';
import { calculateZodiac, calculateChineseZodiac } from '../../utils/zodiacUtils';
import { extractErrorMessage } from '../../utils/errorUtils';
import abilityService from '../../services/abilityService';
import trainerService from '../../services/trainerService';
import type { TrainerListResponse, TrainerMonstersResponse } from '../../services/trainerService';
import type {
  Trainer,
  TrainerFormData,
  TrainerFormMode,
  FormSecret,
  FormRelation,
  FormAdditionalRef,
  MegaFormData,
} from './types/Trainer';
// --- Types ---

type AbilityOption = { name: string; value?: string; description?: string };

export interface SubmitResult {
  success: boolean;
  message?: string;
  trainerId?: number;
}

interface TrainerPageFormProps {
  mode: 'create' | 'edit';
  initialTrainer?: Trainer | null;
  onSubmit: (formData: FormData) => Promise<SubmitResult>;
  onCancel: () => void;
  onSuccess?: (result: SubmitResult) => void;
  title: string;
  introText?: string;
}

// --- Component ---

export function TrainerPageForm({
  mode,
  initialTrainer,
  onSubmit,
  onCancel,
  onSuccess,
  title,
  introText,
}: TrainerPageFormProps) {
  // Form data state
  const [formData, setFormData] = useState<Partial<TrainerFormData>>(() =>
    initialTrainer ? trainerToFormData(initialTrainer) : { name: '', race: 'Human' }
  );

  // Dynamic lists
  const [secrets, setSecrets] = useState<FormSecret[]>([]);
  const [relations, setRelations] = useState<FormRelation[]>([]);
  const [additionalRefs, setAdditionalRefs] = useState<FormAdditionalRef[]>([]);
  const [megaData, setMegaData] = useState<MegaFormData>({});

  // File uploads
  const [mainRefFile, setMainRefFile] = useState<File | null>(null);
  const [mainRefPreview, setMainRefPreview] = useState('');
  const [megaRefFile, setMegaRefFile] = useState<File | null>(null);
  const [megaRefPreview, setMegaRefPreview] = useState('');

  // Backend data
  const [abilityOptions, setAbilityOptions] = useState<AbilityOption[]>([]);
  const [allTrainers, setAllTrainers] = useState<{ id: number; name: string }[]>([]);
  const [trainerMonsters, setTrainerMonsters] = useState<Record<string, { id: number; name: string; species1?: string }[]>>({});

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitRef = useRef<HTMLDivElement>(null);

  // Load abilities on mount
  useEffect(() => {
    abilityService.getAbilityNames().then(data => {
      setAbilityOptions(data.map(a => ({
        name: a.name,
        description: a.description,
      })));
    });
  }, []);

  // Load all trainers for relations
  useEffect(() => {
    trainerService.getAllTrainers().then((response: TrainerListResponse) => {
      if (response.trainers) {
        setAllTrainers(response.trainers.map(t => ({ id: t.id, name: t.name })));
      }
    }).catch(() => { /* ignore */ });
  }, []);

  // Initialize from trainer data (edit mode)
  useEffect(() => {
    if (!initialTrainer) return;
    setFormData(trainerToFormData(initialTrainer));
    setSecrets(parseTrainerSecrets(initialTrainer));
    setRelations(parseTrainerRelations(initialTrainer));
    setAdditionalRefs(parseTrainerAdditionalRefs(initialTrainer));
    setMegaData(parseTrainerMegaData(initialTrainer));
  }, [initialTrainer]);

  // --- Field change handler with zodiac auto-calc ---
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'birthday' && value) {
        next.zodiac = calculateZodiac(value);
        next.chinese_zodiac = calculateChineseZodiac(value);
      }
      return next;
    });
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  // --- Main ref file upload ---
  const handleMainRefUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMainRefFile(file);
    setMainRefPreview(file ? URL.createObjectURL(file) : '');
  }, []);

  // --- Mega ref file upload ---
  const handleMegaRefUpload = useCallback((file: File | null) => {
    setMegaRefFile(file);
    setMegaRefPreview(file ? URL.createObjectURL(file) : '');
  }, []);

  // --- Mega data change ---
  const handleMegaChange = useCallback((name: string, value: string) => {
    setMegaData(prev => ({ ...prev, [name]: value }));
  }, []);

  // --- Secrets handlers ---
  const addSecret = useCallback(() => {
    setSecrets(prev => [...prev, { id: Date.now(), title: '', description: '' }]);
  }, []);

  const removeSecret = useCallback((id: number) => {
    setSecrets(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSecret = useCallback((id: number, field: keyof FormSecret, value: string) => {
    setSecrets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  // --- Relations handlers ---
  const addRelation = useCallback(() => {
    setRelations(prev => [...prev, {
      id: Date.now(), type: 'trainer', trainer_id: '', monster_id: '', name: '', elaboration: '',
    }]);
  }, []);

  const removeRelation = useCallback((id: number) => {
    setRelations(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRelation = useCallback((id: number, field: keyof FormRelation, value: string) => {
    setRelations(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };

      // Reset selections when type changes
      if (field === 'type') {
        updated.trainer_id = '';
        updated.monster_id = '';
      }

      // Fetch monsters when trainer changes for monster relations
      if (field === 'trainer_id' && r.type === 'monster' && value) {
        updated.monster_id = '';
        // Load monsters for this trainer
        trainerService.getTrainerMonsters(value).then((response: TrainerMonstersResponse) => {
          if (response.monsters) {
            setTrainerMonsters(prev => ({
              ...prev,
              [value]: response.monsters.map(m => ({
                id: m.id,
                name: m.name,
                species1: m.species1,
              })),
            }));
          }
        }).catch(() => { /* ignore */ });
      }

      return updated;
    }));
  }, []);

  // --- Additional refs handlers ---
  const addAdditionalRef = useCallback(() => {
    setAdditionalRefs(prev => [...prev, {
      id: Date.now(), title: '', description: '', image_url: '',
    }]);
  }, []);

  const removeAdditionalRef = useCallback((id: number) => {
    setAdditionalRefs(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateAdditionalRef = useCallback((id: number, field: keyof FormAdditionalRef, value: string) => {
    setAdditionalRefs(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const uploadAdditionalRefFile = useCallback((id: number, file: File) => {
    setAdditionalRefs(prev => prev.map(r => r.id === id ? { ...r, image_file: file } : r));
  }, []);

  // --- Validation ---
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Trainer name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Trainer name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Trainer name must be at most 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name]);

  // --- Submit ---
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector('.form-error-text');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const submitData = buildTrainerSubmitFormData(
        formData,
        secrets,
        relations,
        additionalRefs,
        mode === 'edit' ? megaData : null,
        mainRefFile,
        mode === 'edit' ? megaRefFile : null,
      );

      const result = await onSubmit(submitData);

      if (result.success) {
        setSuccess(result.message || (mode === 'create'
          ? 'Trainer created successfully!'
          : 'Trainer updated successfully!'
        ));
        onSuccess?.(result);
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'An unexpected error occurred.'));
    } finally {
      setSaving(false);
    }
  }, [formData, secrets, relations, additionalRefs, megaData, mainRefFile, megaRefFile, mode, validate, onSubmit, onSuccess]);

  // --- Jump to submit ---
  const handleJumpToSubmit = useCallback(() => {
    submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Shared field section props
  const fieldProps = {
    formData,
    onChange: handleFieldChange,
    mode: mode as TrainerFormMode,
    errors,
    disabled: saving,
    abilityOptions,
  };

  return (
    <div className="trainer-page-form">
      <div className="trainer-page-form__header">
        <h1>{title}</h1>
      </div>

      <button
        type="button"
        className="button primary sm trainer-page-form__jump-button"
        onClick={handleJumpToSubmit}
      >
        <i className="fa-solid fa-arrow-down"></i> Jump to Submit
      </button>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      <form className="trainer-page-form__form" onSubmit={handleSubmit}>
        {/* Introduction */}
        {introText && (
          <div className="form-section">
            <h3 className="form-section__title">Trainer Information</h3>
            <p className="form-section__description">{introText}</p>
          </div>
        )}

        {/* Basic Info */}
        <BasicInfoFields {...fieldProps} />

        {/* Main Reference Image */}
        <div className="form-section">
          <h3 className="form-section__title">Main Reference Image</h3>
          <div className="ref-image-upload">
            <input
              type="file"
              accept="image/*"
              id="main-ref-upload"
              className="file-input"
              onChange={handleMainRefUpload}
              disabled={saving}
            />
            <label htmlFor="main-ref-upload" className="button secondary sm">
              {mainRefFile ? mainRefFile.name : 'Upload Trainer Image'}
            </label>
            {(mainRefPreview || formData.main_ref) && (
              <div className="image-preview">
                <img
                  src={mainRefPreview || formData.main_ref}
                  alt="Main reference preview"
                />
              </div>
            )}
            <div className="form-help-text">
              Upload a clear image of your trainer. Recommended size: 800x800 pixels.
            </div>
          </div>
        </div>

        {/* Species & Types */}
        <SpeciesTypesFields {...fieldProps} />

        {/* Favorite Types */}
        <FavoriteTypesFields {...fieldProps} />

        {/* Personal Info (includes theme and voice claim) */}
        <PersonalInfoFields {...fieldProps} />

        {/* Zodiac (auto-calculated, read-only) */}
        <div className="form-section">
          <h3 className="form-section__title">Birthday & Zodiac</h3>
          <div className="form-grid cols-3">
            <FormInput
              name="birthday"
              label="Birthday"
              type="date"
              value={formData.birthday || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('birthday', e.target.value)}
              disabled={saving}
              helpText="Zodiac will be calculated automatically"
            />
            <FormInput
              name="zodiac"
              label="Zodiac Sign"
              value={formData.zodiac || ''}
              readOnly
              disabled
              placeholder="Calculated from birthday"
            />
            <FormInput
              name="chinese_zodiac"
              label="Chinese Zodiac"
              value={formData.chinese_zodiac || ''}
              readOnly
              disabled
              placeholder="Calculated from birth year"
            />
          </div>
        </div>

        {/* Biography */}
        <BiographyFields {...fieldProps} />

        {/* Character Info */}
        <CharacterInfoFields {...fieldProps} />

        {/* Secrets */}
        <SecretsSection
          secrets={secrets}
          onAdd={addSecret}
          onRemove={removeSecret}
          onChange={updateSecret}
        />

        {/* Relations */}
        <RelationsSection
          relations={relations}
          allTrainers={allTrainers}
          trainerMonsters={trainerMonsters}
          currentTrainerId={initialTrainer?.id}
          onAdd={addRelation}
          onRemove={removeRelation}
          onChange={updateRelation}
        />

        {/* Additional References */}
        <AdditionalRefsSection
          refs={additionalRefs}
          onAdd={addAdditionalRef}
          onRemove={removeAdditionalRef}
          onChange={updateAdditionalRef}
          onFileUpload={uploadAdditionalRefFile}
        />

        {/* Mega Evolution (edit only) */}
        {mode === 'edit' && (
          <MegaEvolutionSection
            megaData={megaData}
            onChange={handleMegaChange}
            abilityOptions={abilityOptions}
            megaRefFile={megaRefFile}
            megaRefPreview={megaRefPreview}
            onFileUpload={handleMegaRefUpload}
          />
        )}

        {/* Starter Note (create only) */}
        {mode === 'create' && (
          <div className="form-section">
            <h3 className="form-section__title">Starter Monster</h3>
            <p className="form-section__description">
              After creating your trainer, you'll be redirected to select your starter monster.
            </p>
          </div>
        )}

        {/* Submit */}
        <div ref={submitRef} className="trainer-page-form__actions">
          <button
            type="button"
            className="button danger"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                {mode === 'create' ? ' Creating...' : ' Saving...'}
              </>
            ) : (
              <>
                <i className={mode === 'create' ? 'fa-solid fa-plus' : 'fa-solid fa-save'}></i>
                {mode === 'create' ? ' Create Trainer' : ' Save Changes'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
