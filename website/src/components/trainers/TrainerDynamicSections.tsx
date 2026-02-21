import { ChangeEvent } from 'react';
import { FormInput } from '../common/FormInput';
import { FormTextArea } from '../common/FormTextArea';
import { AutocompleteInput } from '../common/AutocompleteInput';
import { TYPE_OPTIONS } from './data/trainerFormOptions';
import type { FormSecret, FormRelation, FormAdditionalRef, MegaFormData } from './types/Trainer';

// --- Secrets Section ---

interface SecretsSectionProps {
  secrets: FormSecret[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof FormSecret, value: string) => void;
}

export function SecretsSection({ secrets, onAdd, onRemove, onChange }: SecretsSectionProps) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">Secrets</h3>
      <p className="form-section__description">Add character secrets with titles and descriptions.</p>

      {secrets.length > 0 ? (
        <div className="dynamic-list">
          {secrets.map((secret, index) => (
            <div key={secret.id} className="dynamic-list__item">
              <div className="dynamic-list__item-header">
                <h4>Secret #{index + 1}</h4>
                <button
                  type="button"
                  className="button danger sm"
                  onClick={() => onRemove(secret.id)}
                >
                  <i className="fa-solid fa-trash-alt"></i>
                </button>
              </div>
              <div className="form-grid cols-2">
                <FormInput
                  name={`secret-title-${secret.id}`}
                  label="Title"
                  value={secret.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(secret.id, 'title', e.target.value)}
                  placeholder="Secret Title"
                />
                <FormTextArea
                  name={`secret-desc-${secret.id}`}
                  label="Description"
                  value={secret.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(secret.id, 'description', e.target.value)}
                  placeholder="Describe the secret"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dynamic-list__empty">
          <i className="fa-solid fa-eye-slash"></i>
          <p>No secrets added yet.</p>
        </div>
      )}

      <button type="button" className="button primary sm" onClick={onAdd}>
        <i className="fa-solid fa-plus"></i> Add Secret
      </button>
    </div>
  );
}

// --- Relations Section ---

interface RelationTrainer {
  id: number;
  name: string;
}

interface RelationMonster {
  id: number;
  name: string;
  species1?: string;
}

interface RelationsSectionProps {
  relations: FormRelation[];
  allTrainers: RelationTrainer[];
  trainerMonsters: Record<string, RelationMonster[]>;
  currentTrainerId?: number;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof FormRelation, value: string) => void;
}

export function RelationsSection({
  relations,
  allTrainers,
  trainerMonsters,
  currentTrainerId,
  onAdd,
  onRemove,
  onChange,
}: RelationsSectionProps) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">Relations</h3>
      <p className="form-section__description">Add relationships with other trainers and their monsters.</p>

      {relations.length > 0 ? (
        <div className="dynamic-list">
          {relations.map((relation, index) => (
            <div key={relation.id} className="dynamic-list__item">
              <div className="dynamic-list__item-header">
                <h4>Relation #{index + 1}</h4>
                <button
                  type="button"
                  className="button danger sm"
                  onClick={() => onRemove(relation.id)}
                >
                  <i className="fa-solid fa-trash-alt"></i>
                </button>
              </div>
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">Relation Type</label>
                  <select
                    className="select"
                    value={relation.type}
                    onChange={(e) => onChange(relation.id, 'type', e.target.value)}
                  >
                    <option value="trainer">Trainer Relation</option>
                    <option value="monster">Monster Relation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Trainer</label>
                  <select
                    className="select"
                    value={relation.trainer_id}
                    onChange={(e) => onChange(relation.id, 'trainer_id', e.target.value)}
                  >
                    <option value="">Select Trainer</option>
                    {allTrainers
                      .filter(t => relation.type === 'monster' || t.id !== currentTrainerId)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>

                {relation.type === 'monster' && (
                  <div className="form-group">
                    <label className="form-label">Monster</label>
                    <select
                      className="select"
                      value={relation.monster_id}
                      onChange={(e) => onChange(relation.id, 'monster_id', e.target.value)}
                      disabled={!relation.trainer_id}
                    >
                      <option value="">
                        {relation.trainer_id ? 'Select Monster' : 'Select Trainer First'}
                      </option>
                      {relation.trainer_id && trainerMonsters[relation.trainer_id]?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.species1 || 'Unknown'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <FormInput
                  name={`relation-name-${relation.id}`}
                  label="Relationship Name"
                  value={relation.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(relation.id, 'name', e.target.value)}
                  placeholder={relation.type === 'monster' ? 'e.g., Partner, Rival, Feared' : 'e.g., Friend, Rival, Mentor'}
                />

                <FormTextArea
                  name={`relation-elab-${relation.id}`}
                  label="Elaboration"
                  value={relation.elaboration}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(relation.id, 'elaboration', e.target.value)}
                  placeholder={
                    relation.type === 'monster'
                      ? 'Describe how they interact with this monster'
                      : 'Describe how they interact with this trainer'
                  }
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dynamic-list__empty">
          <i className="fa-solid fa-users"></i>
          <p>No relations added yet.</p>
        </div>
      )}

      <button type="button" className="button primary sm" onClick={onAdd}>
        <i className="fa-solid fa-plus"></i> Add Relation
      </button>
    </div>
  );
}

// --- Additional References Section ---

interface AdditionalRefsSectionProps {
  refs: FormAdditionalRef[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof FormAdditionalRef, value: string) => void;
  onFileUpload: (id: number, file: File) => void;
}

export function AdditionalRefsSection({
  refs,
  onAdd,
  onRemove,
  onChange,
  onFileUpload,
}: AdditionalRefsSectionProps) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">Additional References</h3>
      <p className="form-section__description">
        Add additional reference images, artwork, or other visual content for your trainer.
      </p>

      {refs.length > 0 ? (
        <div className="dynamic-list">
          {refs.map((ref, index) => (
            <div key={ref.id} className="dynamic-list__item">
              <div className="dynamic-list__item-header">
                <h4>Reference #{index + 1}</h4>
                <button
                  type="button"
                  className="button danger sm"
                  onClick={() => onRemove(ref.id)}
                >
                  <i className="fa-solid fa-trash-alt"></i>
                </button>
              </div>
              <div className="form-grid cols-2">
                <FormInput
                  name={`ref-title-${ref.id}`}
                  label="Title"
                  value={ref.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(ref.id, 'title', e.target.value)}
                  placeholder="Reference Title"
                />
                <FormTextArea
                  name={`ref-desc-${ref.id}`}
                  label="Description"
                  value={ref.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(ref.id, 'description', e.target.value)}
                  placeholder="Describe this reference"
                  rows={2}
                />
                <div className="form-group">
                  <label className="form-label">Image</label>
                  <div className="ref-image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      id={`ref-upload-${ref.id}`}
                      className="file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onFileUpload(ref.id, file);
                      }}
                    />
                    <label htmlFor={`ref-upload-${ref.id}`} className="button secondary sm">
                      {ref.image_file ? ref.image_file.name : 'Upload Reference Image'}
                    </label>
                    {(ref.image_url || ref.image_file) && (
                      <div className="image-preview">
                        <img
                          src={ref.image_file ? URL.createObjectURL(ref.image_file) : ref.image_url}
                          alt="Reference preview"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dynamic-list__empty">
          <i className="fa-solid fa-images"></i>
          <p>No additional references added yet.</p>
        </div>
      )}

      <button type="button" className="button primary sm" onClick={onAdd}>
        <i className="fa-solid fa-plus"></i> Add Reference
      </button>
    </div>
  );
}

// --- Mega Evolution Section ---

interface MegaEvolutionSectionProps {
  megaData: MegaFormData;
  onChange: (name: string, value: string) => void;
  abilityOptions: { name: string; value?: string; description?: string }[];
  megaRefFile: File | null;
  megaRefPreview: string;
  onFileUpload: (file: File | null) => void;
}

export function MegaEvolutionSection({
  megaData,
  onChange,
  abilityOptions,
  megaRefFile,
  megaRefPreview,
  onFileUpload,
}: MegaEvolutionSectionProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const handleAutocompleteChange = (name: string) => (value: string) => {
    onChange(name, value);
  };

  const MEGA_TYPE_FIELDS = [
    { name: 'mega_type1', label: 'Mega Primary Type' },
    { name: 'mega_type2', label: 'Mega Secondary Type' },
    { name: 'mega_type3', label: 'Mega 3rd Type' },
    { name: 'mega_type4', label: 'Mega 4th Type' },
    { name: 'mega_type5', label: 'Mega 5th Type' },
    { name: 'mega_type6', label: 'Mega 6th Type' },
  ] as const;

  return (
    <div className="form-section">
      <h3 className="form-section__title">Mega Evolution</h3>

      <div className="form-grid cols-2">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Mega Evolution Image</label>
          <div className="ref-image-upload">
            <input
              type="file"
              accept="image/*"
              id="mega-ref-upload"
              className="file-input"
              onChange={(e) => onFileUpload(e.target.files?.[0] || null)}
            />
            <label htmlFor="mega-ref-upload" className="button secondary sm">
              {megaRefFile ? megaRefFile.name : 'Upload Mega Evolution Image'}
            </label>
            {(megaData.mega_ref || megaRefPreview) && (
              <div className="image-preview">
                <img
                  src={megaRefPreview || megaData.mega_ref}
                  alt="Mega reference preview"
                />
              </div>
            )}
          </div>
          <div className="form-help-text">
            Upload an image of your trainer's mega evolution form. Recommended size: 800x800 pixels.
          </div>
        </div>

        <FormInput
          name="mega_artist"
          label="Mega Artist"
          value={megaData.mega_artist || ''}
          onChange={handleInputChange}
        />

        <FormInput
          name="mega_species1"
          label="Mega Primary Species"
          value={megaData.mega_species1 || ''}
          onChange={handleInputChange}
        />
        <FormInput
          name="mega_species2"
          label="Mega Secondary Species"
          value={megaData.mega_species2 || ''}
          onChange={handleInputChange}
        />
        <FormInput
          name="mega_species3"
          label="Mega Tertiary Species"
          value={megaData.mega_species3 || ''}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-grid cols-3" style={{ marginTop: 'var(--spacing-small)' }}>
        {MEGA_TYPE_FIELDS.map(({ name, label }) => (
          <AutocompleteInput
            key={name}
            name={name}
            label={label}
            value={(megaData[name as keyof MegaFormData] as string) || ''}
            onChange={handleAutocompleteChange(name)}
            options={TYPE_OPTIONS}
            placeholder={label}
          />
        ))}
      </div>

      <div className="form-grid cols-2" style={{ marginTop: 'var(--spacing-small)' }}>
        <AutocompleteInput
          name="mega_ability"
          label="Mega Ability"
          value={megaData.mega_ability || ''}
          onChange={handleAutocompleteChange('mega_ability')}
          options={abilityOptions}
          placeholder="Mega ability"
          showDescriptionBelow
        />
      </div>
    </div>
  );
}
