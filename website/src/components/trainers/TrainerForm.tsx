import { useState, useCallback, FormEvent } from 'react';
import { TabContainer, useTabState } from '../common/TabContainer';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import {
  BasicInfoFields,
  PersonalInfoFields,
  SpeciesTypesFields,
  BiographyFields
} from './TrainerFormFields';
import type { TrainerFormData, TrainerFormMode, Trainer } from './types/Trainer';
import { combineTrainerTheme } from './types/Trainer';
import { trainerToFormData } from './trainerFormUtils';

interface TrainerFormProps {
  /** Form mode: create, edit, or admin */
  mode: TrainerFormMode;
  /** Initial trainer data (for edit/admin modes) */
  initialData?: Partial<Trainer>;
  /** Form submission handler */
  onSubmit: (data: TrainerFormData) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Saving state */
  saving?: boolean;
  /** Error message */
  error?: string | null;
  /** Success callback */
  onSuccess?: () => void;
  /** User ID for create mode */
  userId?: string;
  /** Ability options (loaded from backend) */
  abilityOptions?: { name: string; value?: string; description?: string }[];
  /** Form title */
  title?: string;
  /** Additional className */
  className?: string;
}

/**
 * TrainerForm - Unified form for creating/editing trainers
 * Supports create, edit, and admin modes with appropriate field visibility
 */
export function TrainerForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  saving = false,
  error,
  userId,
  abilityOptions = [],
  title,
  className = ''
}: TrainerFormProps) {
  // Form data state
  const [formData, setFormData] = useState<Partial<TrainerFormData>>(() =>
    initialData ? trainerToFormData(initialData) : { name: '' }
  );

  // Form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab state
  const { setActiveTab, tabProps } = useTabState('basic');

  // Handle field changes
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (mode === 'create' && !userId) {
      newErrors.user_id = 'User ID is required';
    }

    setErrors(newErrors);

    // If there are errors, switch to the tab with the first error
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.nickname || newErrors.level || newErrors.faction) {
        setActiveTab('basic');
      }
    }

    return Object.keys(newErrors).length === 0;
  }, [formData, mode, userId, setActiveTab]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Combine theme display and link
    const theme = combineTrainerTheme(
      formData.theme_display || '',
      formData.theme_link || ''
    );

    // Build submit data
    const submitData: TrainerFormData = {
      name: formData.name || '',
      nickname: formData.nickname,
      level: formData.level,
      faction: formData.faction,
      title: formData.title,
      currency_amount: formData.currency_amount,
      total_earned_currency: formData.total_earned_currency,
      main_ref: formData.main_ref,
      gender: formData.gender,
      pronouns: formData.pronouns,
      sexuality: formData.sexuality,
      age: formData.age,
      height: formData.height,
      weight: formData.weight,
      theme_display: theme ? undefined : formData.theme_display,
      theme_link: theme ? undefined : formData.theme_link,
      occupation: formData.occupation,
      birthday: formData.birthday,
      birthplace: formData.birthplace,
      residence: formData.residence,
      race: formData.race,
      species1: formData.species1,
      species2: formData.species2,
      species3: formData.species3,
      type1: formData.type1,
      type2: formData.type2,
      type3: formData.type3,
      type4: formData.type4,
      type5: formData.type5,
      type6: formData.type6,
      ability: formData.ability,
      nature: formData.nature,
      characteristic: formData.characteristic,
      quote: formData.quote,
      tldr: formData.tldr,
      biography: formData.biography,
      user_id: mode === 'create' ? userId : undefined
    };

    // Add theme as combined field if present
    if (theme) {
      (submitData as TrainerFormData & { theme?: string }).theme = theme;
    }

    await onSubmit(submitData);
  }, [formData, mode, userId, validateForm, onSubmit]);

  // Build tabs for the form
  const buildFormTabs = () => {
    return [
      {
        key: 'basic',
        label: 'Basic Info',
        icon: 'fas fa-user',
        content: (
          <BasicInfoFields
            formData={formData}
            onChange={handleFieldChange}
            mode={mode}
            errors={errors}
            disabled={saving}
          />
        )
      },
      {
        key: 'personal',
        label: 'Personal',
        icon: 'fas fa-address-card',
        content: (
          <PersonalInfoFields
            formData={formData}
            onChange={handleFieldChange}
            mode={mode}
            errors={errors}
            disabled={saving}
          />
        )
      },
      {
        key: 'species',
        label: 'Species & Types',
        icon: 'fas fa-dna',
        content: (
          <SpeciesTypesFields
            formData={formData}
            onChange={handleFieldChange}
            mode={mode}
            errors={errors}
            disabled={saving}
            abilityOptions={abilityOptions}
          />
        )
      },
      {
        key: 'bio',
        label: 'Biography',
        icon: 'fas fa-book',
        content: (
          <BiographyFields
            formData={formData}
            onChange={handleFieldChange}
            mode={mode}
            errors={errors}
            disabled={saving}
          />
        )
      }
    ];
  };

  // Build tabs
  const tabs = buildFormTabs();

  // Get title based on mode
  const getTitle = () => {
    if (title) return title;
    switch (mode) {
      case 'create':
        return 'Create Trainer';
      case 'edit':
        return `Edit Trainer: ${initialData?.name || ''}`;
      case 'admin':
        return `Admin Edit: ${initialData?.name || ''}`;
      default:
        return 'Trainer Form';
    }
  };

  if (loading) {
    return (
      <div className={`trainer-form trainer-form--loading ${className}`}>
        <LoadingSpinner message="Loading trainer data..." />
      </div>
    );
  }

  return (
    <form
      className={`trainer-form trainer-form--${mode} ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Header */}
      <div className="trainer-form__header">
        <h2 className="trainer-form__title">{getTitle()}</h2>
      </div>

      {/* Error display */}
      {error && (
        <div className="trainer-form__error">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Tabbed content */}
      <TabContainer
        tabs={tabs}
        variant="underline"
        className="trainer-form__tabs"
        {...tabProps}
      />

      {/* Form actions */}
      <div className="trainer-form__footer">
        <ActionButtonGroup align="end" gap="md">
          {onCancel && (
            <button
              type="button"
              className="button secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="button primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {mode === 'create' ? ' Creating...' : ' Saving...'}
              </>
            ) : (
              <>
                <i className={mode === 'create' ? 'fas fa-plus' : 'fas fa-save'}></i>
                {mode === 'create' ? ' Create Trainer' : ' Save Changes'}
              </>
            )}
          </button>
        </ActionButtonGroup>
      </div>
    </form>
  );
}
