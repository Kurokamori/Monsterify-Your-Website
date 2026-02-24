import { ChangeEvent } from 'react';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { FormTextArea } from '../common/FormTextArea';
import { AutocompleteInput } from '../common/AutocompleteInput';
import {
  TYPE_OPTIONS,
  FACTION_OPTIONS,
  NATURE_OPTIONS,
  CHARACTERISTIC_OPTIONS,
  BERRY_OPTIONS,
  RACE_SELECT_OPTIONS
} from './data/trainerFormOptions';
import type { TrainerFormData, TrainerFormMode } from './types/Trainer';

interface FieldChangeHandler {
  (name: string, value: string): void;
}

interface TrainerFieldSectionProps {
  formData: Partial<TrainerFormData>;
  onChange: FieldChangeHandler;
  mode: TrainerFormMode;
  errors?: Record<string, string>;
  disabled?: boolean;
  abilityOptions?: { name: string; value?: string; description?: string }[];
}

/**
 * BasicInfoFields - Name, nickname, level, faction, title, currency
 */
export function BasicInfoFields({
  formData,
  onChange,
  mode,
  errors = {},
  disabled = false
}: TrainerFieldSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const handleAutocompleteChange = (name: string) => (value: string) => {
    onChange(name, value);
  };

  const showAdminFields = mode === 'admin';
  const showCurrencyFields = mode === 'admin' || mode === 'edit';

  return (
    <div className="form-section">
      <h3 className="form-section__title">Basic Information</h3>

      <div className="form-grid cols-3">
        <FormInput
          name="name"
          label="Name"
          value={formData.name || ''}
          onChange={handleInputChange}
          required
          disabled={disabled}
          error={errors.name}
        />

        <FormInput
          name="nickname"
          label="Nickname"
          value={formData.nickname || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.nickname}
        />

        <FormInput
          name="full_name"
          label="Full Name"
          value={formData.full_name || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.full_name}
        />

        {showAdminFields && (
          <FormInput
            name="level"
            label="Level"
            type="number"
            value={formData.level?.toString() || '1'}
            onChange={handleInputChange}
            disabled={disabled}
            error={errors.level}
          />
        )}

        <AutocompleteInput
          name="faction"
          label="Faction"
          value={formData.faction || ''}
          onChange={handleAutocompleteChange('faction')}
          options={FACTION_OPTIONS}
          placeholder="Select or type faction"
          disabled={disabled}
        />

        <FormInput
          name="title"
          label="Title"
          value={formData.title || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.title}
        />

        {showCurrencyFields && (
          <>
            <FormInput
              name="currency_amount"
              label="Currency Amount"
              type="number"
              value={formData.currency_amount?.toString() || '0'}
              onChange={handleInputChange}
              disabled={disabled || mode !== 'admin'}
              error={errors.currency_amount}
            />

            {showAdminFields && (
              <FormInput
                name="total_earned_currency"
                label="Total Earned Currency"
                type="number"
                value={formData.total_earned_currency?.toString() || '0'}
                onChange={handleInputChange}
                disabled={disabled}
                error={errors.total_earned_currency}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PersonalInfoFields - Gender, pronouns, age, height, weight, theme, etc.
 */
export function PersonalInfoFields({
  formData,
  onChange,
  errors = {},
  disabled = false
}: TrainerFieldSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <div className="form-section">
      <h3 className="form-section__title">Personal Information</h3>

      <div className="form-grid cols-3">
        <FormInput
          name="gender"
          label="Gender"
          value={formData.gender || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.gender}
        />

        <FormInput
          name="pronouns"
          label="Pronouns"
          value={formData.pronouns || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.pronouns}
        />

        <FormInput
          name="sexuality"
          label="Sexuality"
          value={formData.sexuality || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.sexuality}
        />

        <FormInput
          name="age"
          label="Age"
          value={formData.age || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.age}
        />

        <FormInput
          name="height"
          label="Height"
          value={formData.height || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.height}
        />

        <FormInput
          name="weight"
          label="Weight"
          value={formData.weight || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.weight}
        />
      </div>

      <div className="form-grid cols-3">
        <FormInput
          name="occupation"
          label="Occupation"
          value={formData.occupation || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.occupation}
        />

        <FormInput
          name="birthplace"
          label="Birthplace"
          value={formData.birthplace || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.birthplace}
        />

        <FormInput
          name="residence"
          label="Residence"
          value={formData.residence || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.residence}
        />

        <FormSelect
          name="race"
          label="Race"
          value={formData.race || 'Human'}
          onChange={handleInputChange}
          options={RACE_SELECT_OPTIONS}
          disabled={disabled}
          error={errors.race}
        />
      </div>


      <div className="form-grid cols-2">
        <FormInput
          name="theme_display"
          label="Theme Display Text"
          value={formData.theme_display || ''}
          onChange={handleInputChange}
          placeholder="e.g., Champion Theme"
          disabled={disabled}
          error={errors.theme_display}
        />

        <FormInput
          name="theme_link"
          label="Theme YouTube Link (Optional)"
          value={formData.theme_link || ''}
          onChange={handleInputChange}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={disabled}
          helpText="If provided, users can expand to play the theme music"
          error={errors.theme_link}
        />

        <FormInput
          name="voice_claim_display"
          label="Voice Claim Display Text"
          value={formData.voice_claim_display || ''}
          onChange={handleInputChange}
          placeholder="e.g., Character Name (Actor Name)"
          disabled={disabled}
          error={errors.voice_claim_display}
        />

        <FormInput
          name="voice_claim_link"
          label="Voice Claim Video Link (Optional)"
          value={formData.voice_claim_link || ''}
          onChange={handleInputChange}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={disabled}
          helpText="If provided, users can expand to view the voice claim video"
          error={errors.voice_claim_link}
        />
      </div>
    </div>
  );
}

/**
 * SpeciesTypesFields - Species, types, ability, nature, characteristic
 */
export function SpeciesTypesFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
  abilityOptions = []
}: TrainerFieldSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const handleAutocompleteChange = (name: string) => (value: string) => {
    onChange(name, value);
  };

  return (
    <div className="form-section">
      <h3 className="form-section__title">Species & Types</h3>

      <div className="form-grid cols-3">
        {/* Species fields */}
        <FormInput
          name="species1"
          label="Species 1"
          value={formData.species1 || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.species1}
        />

        <FormInput
          name="species2"
          label="Species 2"
          value={formData.species2 || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.species2}
        />

        <FormInput
          name="species3"
          label="Species 3"
          value={formData.species3 || ''}
          onChange={handleInputChange}
          disabled={disabled}
          error={errors.species3}
        />
        </div>

        <div className="form-grid cols-3">
        {/* Type fields */}
        <AutocompleteInput
          name="type1"
          label="Type 1"
          value={formData.type1 || ''}
          onChange={handleAutocompleteChange('type1')}
          options={TYPE_OPTIONS}
          placeholder="Primary type"
          disabled={disabled}
        />

        <AutocompleteInput
          name="type2"
          label="Type 2"
          value={formData.type2 || ''}
          onChange={handleAutocompleteChange('type2')}
          options={TYPE_OPTIONS}
          placeholder="Secondary type"
          disabled={disabled}
        />

        <AutocompleteInput
          name="type3"
          label="Type 3"
          value={formData.type3 || ''}
          onChange={handleAutocompleteChange('type3')}
          options={TYPE_OPTIONS}
          placeholder="Type 3"
          disabled={disabled}
        />

        <AutocompleteInput
          name="type4"
          label="Type 4"
          value={formData.type4 || ''}
          onChange={handleAutocompleteChange('type4')}
          options={TYPE_OPTIONS}
          placeholder="Type 4"
          disabled={disabled}
        />

        <AutocompleteInput
          name="type5"
          label="Type 5"
          value={formData.type5 || ''}
          onChange={handleAutocompleteChange('type5')}
          options={TYPE_OPTIONS}
          placeholder="Type 5"
          disabled={disabled}
        />

        <AutocompleteInput
          name="type6"
          label="Type 6"
          value={formData.type6 || ''}
          onChange={handleAutocompleteChange('type6')}
          options={TYPE_OPTIONS}
          placeholder="Type 6"
          disabled={disabled}
        />

        </div>

        <div className="form-grid cols-2">
  </div>
    
    <div className="form-section mt-md">
      <h3 className="form-section__title">Special Characteristics</h3>
        {/* Ability, Nature, Characteristic */}

        <div className="form-grid cols-3">
        <AutocompleteInput
          name="ability"
          label="Ability"
          value={formData.ability || ''}
          onChange={handleAutocompleteChange('ability')}
          options={abilityOptions}
          placeholder="Trainer ability"
          showDescriptionBelow
          disabled={disabled}
        />

        <AutocompleteInput
          name="nature"
          label="Nature"
          value={formData.nature || ''}
          onChange={handleAutocompleteChange('nature')}
          options={NATURE_OPTIONS}
          placeholder="e.g. Brave, Timid, Jolly"
          disabled={disabled}
        />

        <AutocompleteInput
          name="characteristic"
          label="Characteristic"
          value={formData.characteristic || ''}
          onChange={handleAutocompleteChange('characteristic')}
          options={CHARACTERISTIC_OPTIONS}
          placeholder="Trainer characteristic"
          disabled={disabled}
        />
        </div>
      </div>
    </div>
  );
}

/**
 * BiographyFields - Quote, TL;DR, full biography
 */
export function BiographyFields({
  formData,
  onChange,
  errors = {},
  disabled = false
}: TrainerFieldSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <div className="form-section">
      <h3 className="form-section__title">Biography</h3>

      <div className="form-stack">
        <FormInput
          name="quote"
          label="Quote"
          value={formData.quote || ''}
          onChange={handleInputChange}
          placeholder="A memorable quote from your trainer"
          disabled={disabled}
          error={errors.quote}
        />

        <FormTextArea
          name="tldr"
          label="TL;DR (Summary)"
          value={formData.tldr || ''}
          onChange={handleInputChange}
          placeholder="A brief summary of your trainer"
          rows={3}
          disabled={disabled}
          error={errors.tldr}
        />

        <FormTextArea
          name="biography"
          label="Full Biography"
          value={formData.biography || ''}
          onChange={handleInputChange}
          placeholder="The full biography of your trainer (supports Markdown formatting)"
          rows={10}
          disabled={disabled}
          helpText="You can use Markdown formatting: **bold**, *italic*, [links](url), # headings, etc."
          error={errors.biography}
        />
      </div>
    </div>
  );
}

/**
 * FavoriteTypesFields - Favorite type slots and favorite berry
 */
export function FavoriteTypesFields({
  formData,
  onChange,
  disabled = false
}: TrainerFieldSectionProps) {
  const handleAutocompleteChange = (name: string) => (value: string) => {
    onChange(name, value);
  };

  const FAV_TYPE_FIELDS = [
    { name: 'fav_type1', label: 'Favorite Type 1' },
    { name: 'fav_type2', label: 'Favorite Type 2' },
    { name: 'fav_type3', label: 'Favorite Type 3' },
    { name: 'fav_type4', label: 'Favorite Type 4' },
    { name: 'fav_type5', label: 'Favorite Type 5' },
    { name: 'fav_type6', label: 'Favorite Type 6' },
  ] as const;

  return (
    <div className="form-section">
      <h3 className="form-section__title">Favorites</h3>

      <div className="form-grid cols-3">
        {FAV_TYPE_FIELDS.map(({ name, label }) => (
          <AutocompleteInput
            key={name}
            name={name}
            label={label}
            value={(formData[name as keyof typeof formData] as string) || ''}
            onChange={handleAutocompleteChange(name)}
            options={TYPE_OPTIONS}
            placeholder={label}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="form-grid cols-2" style={{ marginTop: 'var(--spacing-small)' }}>
        <AutocompleteInput
          name="fav_berry"
          label="Favorite Berry"
          value={formData.fav_berry || ''}
          onChange={handleAutocompleteChange('fav_berry')}
          options={BERRY_OPTIONS}
          placeholder="Favorite berry"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * CharacterInfoFields - Strengths, weaknesses, likes, dislikes, flaws, values, quirks
 */
export function CharacterInfoFields({
  formData,
  onChange,
  errors = {},
  disabled = false
}: TrainerFieldSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const CHARACTER_FIELDS = [
    { name: 'strengths', label: 'Strengths', placeholder: 'List your character\'s strengths and positive traits' },
    { name: 'weaknesses', label: 'Weaknesses', placeholder: 'List your character\'s weaknesses and areas for improvement' },
    { name: 'likes', label: 'Likes', placeholder: 'What does your character enjoy and love?' },
    { name: 'dislikes', label: 'Dislikes', placeholder: 'What does your character dislike or hate?' },
    { name: 'flaws', label: 'Flaws', placeholder: 'Character flaws and imperfections' },
    { name: 'values', label: 'Core Values', placeholder: 'What principles and values does your character hold dear?' },
    { name: 'quirks', label: 'Quirks', placeholder: 'Unique habits, behaviors, or characteristics' },
  ] as const;

  return (
    <div className="form-section">
      <h3 className="form-section__title">Character Information</h3>

      <div className="form-grid cols-2">
        {CHARACTER_FIELDS.map(({ name, label, placeholder }) => (
          <FormTextArea
            key={name}
            name={name}
            label={label}
            value={(formData[name as keyof typeof formData] as string) || ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={3}
            disabled={disabled}
            error={errors[name]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * All form field sections combined - useful for simple single-section forms
 */
export function AllTrainerFields(props: TrainerFieldSectionProps) {
  return (
    <>
      <BasicInfoFields {...props} />
      <PersonalInfoFields {...props} />
      <SpeciesTypesFields {...props} />
      <BiographyFields {...props} />
    </>
  );
}
