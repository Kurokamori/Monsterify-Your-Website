import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { FormInput } from '@components/common/FormInput';
import { FormTextArea } from '@components/common/FormTextArea';
import { FormCheckbox } from '@components/common/FormCheckbox';
import { FormSelect } from '@components/common/FormSelect';
import { AutocompleteInput } from '@components/common/AutocompleteInput';
import { FileUpload } from '@components/common/FileUpload';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { SuccessMessage } from '@components/common/SuccessMessage';
import { MONSTER_NATURES, MONSTER_CHARACTERISTICS } from '@utils/staticValues';
import { extractErrorMessage } from '@utils/errorUtils';
import monsterService from '@services/monsterService';
import trainerService from '@services/trainerService';
import type { TrainerListResponse, TrainerMonstersResponse } from '@services/trainerService';
import type { Monster } from '@services/monsterService';
import {
  monsterToFormData,
  parseMonsterFunFacts,
  parseMonsterRelations,
  buildMonsterSubmitData,
  type MonsterFormData,
  type FormFunFact,
  type FormMonsterRelation,
} from './monsterFormUtils';

// --- Types ---

export interface SubmitResult {
  success: boolean;
  message?: string;
}

interface MonsterEditFormProps {
  monster: Monster;
  onSubmit: (data: Record<string, unknown>) => Promise<SubmitResult>;
  onCancel: () => void;
  onSuccess?: () => void;
}

// --- Component ---

export function MonsterEditForm({ monster, onSubmit, onCancel, onSuccess }: MonsterEditFormProps) {
  const [formData, setFormData] = useState<MonsterFormData>(() => monsterToFormData(monster));
  const [funFacts, setFunFacts] = useState<FormFunFact[]>(() => parseMonsterFunFacts(monster));
  const [relations, setRelations] = useState<FormMonsterRelation[]>(() => parseMonsterRelations(monster));

  // Reference data for relations
  const [allTrainers, setAllTrainers] = useState<{ id: number; name: string }[]>([]);
  const [trainerMonsters, setTrainerMonsters] = useState<Record<string, { id: number; name: string }[]>>({});

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitRef = useRef<HTMLDivElement>(null);

  // Sync form data when monster prop changes (edit mode)
  useEffect(() => {
    if (!monster) return;
    setFormData(monsterToFormData(monster));
    setFunFacts(parseMonsterFunFacts(monster));
    setRelations(parseMonsterRelations(monster));
  }, [monster]);

  // Load trainers for relations on mount
  useEffect(() => {
    trainerService.getAllTrainers().then((response: TrainerListResponse) => {
      if (response.trainers) {
        setAllTrainers(response.trainers.map(t => ({ id: t.id, name: t.name })));
      }
    }).catch(() => { /* ignore */ });
  }, []);

  // Load mega images on mount
  useEffect(() => {
    if (!monster.id) return;
    monsterService.getMegaImages(monster.id).then((response: { success?: boolean; data?: { mega_stone_image?: { image_url?: string }; mega_image?: { image_url?: string } } }) => {
      if (response.success && response.data) {
        const { mega_stone_image, mega_image } = response.data;
        setFormData(prev => ({
          ...prev,
          mega_stone_img: mega_stone_image?.image_url || prev.mega_stone_img,
          mega_image: mega_image?.image_url || prev.mega_image,
          has_mega_stone: prev.has_mega_stone || !!mega_stone_image,
        }));
      }
    }).catch(() => { /* ignore */ });
  }, [monster.id]);

  // --- Field handlers ---

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleCheckboxChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  // --- Image uploads ---

  const handleMainImageUpload = useCallback((url: string | null) => {
    setFormData(prev => ({ ...prev, img_link: url || '' }));
  }, []);

  const handleMegaStoneImageUpload = useCallback(async (url: string | null) => {
    if (url && monster.id) {
      try {
        await monsterService.addMegaStoneImage(monster.id, { image_url: url });
      } catch {
        // ignore - image saved in monster_images table
      }
    }
    setFormData(prev => ({
      ...prev,
      mega_stone_img: url || '',
      has_mega_stone: prev.has_mega_stone || !!url,
    }));
  }, [monster.id]);

  const handleMegaImageUpload = useCallback(async (url: string | null) => {
    if (url && monster.id) {
      try {
        await monsterService.addMegaImage(monster.id, { image_url: url });
      } catch {
        // ignore
      }
    }
    setFormData(prev => ({ ...prev, mega_image: url || '' }));
  }, [monster.id]);

  // --- Fun Facts handlers ---

  const addFunFact = useCallback(() => {
    setFunFacts(prev => [...prev, { id: Date.now(), title: '', content: '' }]);
  }, []);

  const removeFunFact = useCallback((id: number) => {
    setFunFacts(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFunFact = useCallback((id: number, field: keyof FormFunFact, value: string) => {
    setFunFacts(prev => prev.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  }, []);

  // --- Relations handlers ---

  const addRelation = useCallback(() => {
    setRelations(prev => [
      ...prev,
      { id: Date.now(), related_type: 'trainer', related_id: '', trainer_id: '', name: '', elaboration: '' },
    ]);
  }, []);

  const removeRelation = useCallback((id: number) => {
    setRelations(prev => prev.filter(r => r.id !== id));
  }, []);

  const fetchTrainerMonstersForRelation = useCallback((trainerId: string) => {
    if (trainerMonsters[trainerId]) return;
    trainerService.getTrainerMonsters(trainerId).then((response: TrainerMonstersResponse) => {
      if (response.monsters) {
        setTrainerMonsters(prev => ({
          ...prev,
          [trainerId]: response.monsters.map(m => ({ id: m.id, name: m.name })),
        }));
      }
    }).catch(() => { /* ignore */ });
  }, [trainerMonsters]);

  const updateRelation = useCallback((id: number, field: keyof FormMonsterRelation, value: string) => {
    setRelations(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };

      if (field === 'related_type') {
        updated.related_id = '';
        updated.trainer_id = '';
      }

      if (field === 'trainer_id' && updated.related_type === 'monster' && value) {
        updated.related_id = '';
        fetchTrainerMonstersForRelation(value);
      }

      return updated;
    }));
  }, [fetchTrainerMonstersForRelation]);

  // --- Validation ---

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Monster name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name]);

  // --- Submit ---

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = document.querySelector('.form-error-text');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const submitData = buildMonsterSubmitData(formData, funFacts, relations);
      const result = await onSubmit(submitData);

      if (result.success) {
        setSuccess(result.message || 'Monster updated successfully!');
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to update monster.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'An unexpected error occurred.'));
    } finally {
      setSaving(false);
    }
  }, [formData, funFacts, relations, validate, onSubmit, onSuccess]);

  const handleJumpToSubmit = useCallback(() => {
    submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const megaLevel = formData.level >= 100;

  return (
    <div className="trainer-page-form">
      <div className="trainer-page-form__header">
        <h1>Edit Monster: {monster.name}</h1>
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
        {/* ── Basic Information ── */}
        <div className="form-section">
          <h3 className="form-section__title">Basic Information</h3>
          <div className="form-grid cols-2">
            <FormInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('name', e.target.value)}
              required
              disabled={saving}
              error={errors.name}
            />
            <FormInput
              name="level"
              label="Level"
              type="number"
              value={String(formData.level)}
              readOnly
              disabled
              helpText="Level cannot be changed directly"
            />
          </div>
        </div>

        {/* ── Personality ── */}
        <div className="form-section">
          <h3 className="form-section__title">Personality</h3>
          <div className="form-grid cols-2">
            <AutocompleteInput
              name="nature"
              label="Nature"
              value={formData.nature}
              onChange={(value) => handleFieldChange('nature', value)}
              options={[...MONSTER_NATURES]}
              placeholder="e.g. Brave, Timid, Jolly"
              disabled={saving}
            />
            <AutocompleteInput
              name="characteristic"
              label="Characteristic"
              value={formData.characteristic}
              onChange={(value) => handleFieldChange('characteristic', value)}
              options={[...MONSTER_CHARACTERISTICS]}
              placeholder="e.g. Loves to eat, Proud of its power"
              disabled={saving}
            />
            <FormInput
              name="gender"
              label="Gender"
              value={formData.gender}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('gender', e.target.value)}
              disabled={saving}
            />
            <FormInput
              name="pronouns"
              label="Pronouns"
              value={formData.pronouns}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('pronouns', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* ── Physical Characteristics ── */}
        <div className="form-section">
          <h3 className="form-section__title">Physical Characteristics</h3>
          <div className="form-grid cols-2">
            <FormInput
              name="height"
              label="Height"
              value={formData.height}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('height', e.target.value)}
              disabled={saving}
            />
            <FormInput
              name="weight"
              label="Weight"
              value={formData.weight}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('weight', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* ── Origin Information ── */}
        <div className="form-section">
          <h3 className="form-section__title">Origin Information</h3>
          <div className="form-grid cols-2">
            <FormInput
              name="where_met"
              label="Where Met"
              value={formData.where_met}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('where_met', e.target.value)}
              disabled={saving}
            />
            <FormInput
              name="date_met"
              label="Date Met"
              type="date"
              value={formData.date_met}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('date_met', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* ── Special Features ── */}
        <div className="form-section">
          <h3 className="form-section__title">Special Features</h3>
          <div className="form-grid cols-3">
            <FormCheckbox name="shiny" label="Shiny" checked={formData.shiny} onChange={handleCheckboxChange} disabled={saving} />
            <FormCheckbox name="alpha" label="Alpha" checked={formData.alpha} onChange={handleCheckboxChange} disabled={saving} />
            <FormCheckbox name="shadow" label="Shadow" checked={formData.shadow} onChange={handleCheckboxChange} disabled={saving} />
            <FormCheckbox name="paradox" label="Paradox" checked={formData.paradox} onChange={handleCheckboxChange} disabled={saving} />
            <FormCheckbox name="pokerus" label="Pokerus" checked={formData.pokerus} onChange={handleCheckboxChange} disabled={saving} />
          </div>
        </div>

        {/* ── Held Items ── */}
        <div className="form-section">
          <h3 className="form-section__title">Held Items</h3>
          <div className="form-grid cols-3">
            <FormInput
              name="held_item"
              label="Held Item"
              value={formData.held_item}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('held_item', e.target.value)}
              disabled={saving}
              placeholder="Enter held item name"
            />
            <FormInput
              name="seal"
              label="Seal"
              value={formData.seal}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('seal', e.target.value)}
              disabled={saving}
            />
            <FormInput
              name="mark"
              label="Mark"
              value={formData.mark}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mark', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* ── Biography ── */}
        <div className="form-section">
          <h3 className="form-section__title">Biography</h3>
          <FormTextArea
            name="tldr"
            label="Summary (TLDR)"
            value={formData.tldr}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('tldr', e.target.value)}
            rows={3}
            disabled={saving}
          />
          <FormTextArea
            name="bio"
            label="Full Biography"
            value={formData.bio}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('bio', e.target.value)}
            rows={6}
            disabled={saving}
          />
        </div>

        {/* ── Images ── */}
        <div className="form-section">
          <h3 className="form-section__title">Images</h3>
          <div className="form-group">
            <label className="form-label">Main Image</label>
            <FileUpload
              onUploadSuccess={handleMainImageUpload}
              buttonText="Upload Monster Image"
              initialImageUrl={formData.img_link || null}
              disabled={saving}
              folder="monsters"
            />
            <div className="form-help-text">Upload a clear image of your monster. Recommended size: 800x800 pixels.</div>
          </div>
        </div>

        {/* ── Mega Evolution ── */}
        <div className="form-section">
          <h3 className="form-section__title">Mega Evolution</h3>

          {!megaLevel ? (
            <div className="state-container">
              <i className="fas fa-lock"></i>
              <p>Mega Evolution is only available for level 100 monsters.</p>
            </div>
          ) : (
            <>
              <div className="form-grid cols-2">
                <FormCheckbox
                  name="has_mega_stone"
                  label="Has Mega Stone"
                  checked={formData.has_mega_stone}
                  onChange={handleCheckboxChange}
                  disabled={saving}
                />
                <FormInput
                  name="mega_stone_name"
                  label="Mega Stone Name"
                  value={formData.mega_stone_name || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_stone_name', e.target.value)}
                  disabled={saving || !formData.has_mega_stone}
                />
              </div>

              {formData.has_mega_stone && (
                <>
                  {/* Mega Stone Image */}
                  <div className="form-group">
                    <label className="form-label">Mega Stone Artwork</label>
                    <FileUpload
                      onUploadSuccess={handleMegaStoneImageUpload}
                      buttonText="Upload Mega Stone Image"
                      initialImageUrl={formData.mega_stone_img || null}
                      disabled={saving}
                      folder="monsters/mega"
                    />
                    <div className="form-help-text">Upload an image of your monster's mega stone. Recommended size: 400x400 pixels.</div>
                  </div>

                  {/* Mega Form Fields */}
                  <h4 style={{ marginTop: 'var(--spacing-medium)' }}>Mega Evolution Form</h4>
                  <div className="form-grid cols-2">
                    <FormInput
                      name="mega_species1"
                      label="Mega Primary Species"
                      value={formData.mega_species1}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_species1', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_species2"
                      label="Mega Secondary Species"
                      value={formData.mega_species2}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_species2', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_species3"
                      label="Mega Tertiary Species"
                      value={formData.mega_species3}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_species3', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_type1"
                      label="Mega Primary Type"
                      value={formData.mega_type1}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_type1', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_type2"
                      label="Mega Secondary Type"
                      value={formData.mega_type2}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_type2', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_ability"
                      label="Mega Ability"
                      value={formData.mega_ability}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_ability', e.target.value)}
                      disabled={saving}
                    />
                    <FormInput
                      name="mega_stat_bonus"
                      label="Mega Stat Bonus"
                      type="number"
                      value={formData.mega_stat_bonus}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('mega_stat_bonus', e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  {/* Mega Evolution Image */}
                  <div className="form-group">
                    <label className="form-label">Mega Evolution Image</label>
                    <FileUpload
                      onUploadSuccess={handleMegaImageUpload}
                      buttonText="Upload Mega Evolution Image"
                      initialImageUrl={formData.mega_image || null}
                      disabled={saving}
                      folder="monsters/mega"
                    />
                    <div className="form-help-text">Upload an image of your monster's mega evolution form. Recommended size: 800x800 pixels.</div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Personal Information ── */}
        <div className="form-section">
          <h3 className="form-section__title">Personal Information</h3>
          <div className="form-grid cols-2">
            <FormTextArea
              name="likes"
              label="Likes"
              value={formData.likes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('likes', e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="What does this monster enjoy and love?"
            />
            <FormTextArea
              name="dislikes"
              label="Dislikes"
              value={formData.dislikes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('dislikes', e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="What does this monster dislike or hate?"
            />
          </div>
          <FormTextArea
            name="lore"
            label="Lore"
            value={formData.lore}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('lore', e.target.value)}
            rows={4}
            disabled={saving}
            placeholder="Background stories, legends, or interesting lore about this monster"
          />
        </div>

        {/* ── Fun Facts ── */}
        <div className="form-section">
          <h3 className="form-section__title">Fun Facts</h3>
          <p className="form-section__description">Add interesting fun facts about this monster with titles and content.</p>

          {funFacts.length > 0 ? (
            <div className="dynamic-list">
              {funFacts.map((fact, index) => (
                <div key={fact.id} className="dynamic-list__item">
                  <div className="dynamic-list__item-header">
                    <h4>Fun Fact #{index + 1}</h4>
                    <button
                      type="button"
                      className="button danger sm"
                      onClick={() => removeFunFact(fact.id)}
                      disabled={saving}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div className="form-grid cols-1">
                    <FormInput
                      name={`fun_fact_title_${fact.id}`}
                      label="Title"
                      value={fact.title}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateFunFact(fact.id, 'title', e.target.value)}
                      disabled={saving}
                      placeholder="Fun Fact Title"
                    />
                    <FormTextArea
                      name={`fun_fact_content_${fact.id}`}
                      label="Content"
                      value={fact.content}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateFunFact(fact.id, 'content', e.target.value)}
                      rows={3}
                      disabled={saving}
                      placeholder="Describe the fun fact"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="state-container sm">
              <i className="fas fa-lightbulb"></i>
              <p>No fun facts added yet.</p>
            </div>
          )}

          <button
            type="button"
            className="button primary sm"
            onClick={addFunFact}
            disabled={saving}
            style={{ marginTop: 'var(--spacing-small)' }}
          >
            <i className="fas fa-plus"></i> Add Fun Fact
          </button>
        </div>

        {/* ── Relations ── */}
        <div className="form-section">
          <h3 className="form-section__title">Relations</h3>
          <p className="form-section__description">Add relationships with other monsters or trainers.</p>

          {relations.length > 0 ? (
            <div className="dynamic-list">
              {relations.map((relation, index) => (
                <div key={relation.id} className="dynamic-list__item">
                  <div className="dynamic-list__item-header">
                    <h4>Relation #{index + 1}</h4>
                    <button
                      type="button"
                      className="button danger sm"
                      onClick={() => removeRelation(relation.id)}
                      disabled={saving}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div className="form-grid cols-2">
                    <FormSelect
                      name={`relation_type_${relation.id}`}
                      label="Type"
                      value={relation.related_type}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRelation(relation.id, 'related_type', e.target.value)}
                      options={[
                        { value: 'trainer', label: 'Trainer' },
                        { value: 'monster', label: 'Monster' },
                      ]}
                      disabled={saving}
                    />

                    {relation.related_type === 'monster' && (
                      <FormSelect
                        name={`relation_trainer_${relation.id}`}
                        label="Trainer"
                        value={relation.trainer_id}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRelation(relation.id, 'trainer_id', e.target.value)}
                        options={allTrainers.map(t => ({ value: String(t.id), label: t.name }))}
                        placeholder="Select Trainer"
                        disabled={saving}
                      />
                    )}

                    <FormSelect
                      name={`relation_target_${relation.id}`}
                      label={relation.related_type === 'monster' ? 'Monster' : 'Trainer'}
                      value={relation.related_id}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRelation(relation.id, 'related_id', e.target.value)}
                      options={
                        relation.related_type === 'monster'
                          ? (trainerMonsters[relation.trainer_id] || [])
                              .filter(m => m.id !== monster.id)
                              .map(m => ({ value: String(m.id), label: m.name }))
                          : allTrainers.map(t => ({ value: String(t.id), label: t.name }))
                      }
                      placeholder={`Select ${relation.related_type === 'monster' ? 'Monster' : 'Trainer'}`}
                      disabled={saving || (relation.related_type === 'monster' && !relation.trainer_id)}
                    />

                    <FormInput
                      name={`relation_name_${relation.id}`}
                      label="Relationship Name"
                      value={relation.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateRelation(relation.id, 'name', e.target.value)}
                      disabled={saving}
                      placeholder="e.g., Friend, Rival, Partner"
                    />
                  </div>
                  <FormTextArea
                    name={`relation_elaboration_${relation.id}`}
                    label="Elaboration"
                    value={relation.elaboration}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateRelation(relation.id, 'elaboration', e.target.value)}
                    rows={3}
                    disabled={saving}
                    placeholder="Describe how they interact"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="state-container sm">
              <i className="fas fa-users"></i>
              <p>No relations added yet.</p>
            </div>
          )}

          <button
            type="button"
            className="button primary sm"
            onClick={addRelation}
            disabled={saving}
            style={{ marginTop: 'var(--spacing-small)' }}
          >
            <i className="fas fa-plus"></i> Add Relation
          </button>
        </div>

        {/* ── Form Actions ── */}
        <div ref={submitRef} className="trainer-page-form__actions">
          <button type="button" className="button danger" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save"></i> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
