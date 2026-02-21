import { useState, useEffect, useCallback, FormEvent } from 'react';
import { AdminForm } from './AdminForm';
import type { FieldSection } from './AdminForm';
import type { Mission, MissionRequirements, MissionRewardConfig } from '@services/missionService';
import missionService from '@services/missionService';

interface MissionFormProps {
  mission: Mission | null;
  onSuccess: (mission: Mission) => void;
  onCancel: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  difficulty: 'easy',
  status: 'active',
  duration: 24,
  minLevel: 1,
  maxMonsters: 3,
  requiredProgress: 100,
};

const EMPTY_REQUIREMENTS: MissionRequirements = {
  types: [],
  attributes: [],
  minLevel: 0,
};

const EMPTY_REWARDS: MissionRewardConfig = {
  levels: { min: 0, max: 0 },
  coins: { min: 0, max: 0 },
  items: { min: 0, max: 0 },
  monsters: { count: 0 },
};

function parseRequirements(raw: MissionRequirements | null): MissionRequirements {
  if (!raw) return { ...EMPTY_REQUIREMENTS, types: [], attributes: [] };
  return {
    types: raw.types ?? [],
    attributes: raw.attributes ?? [],
    minLevel: raw.minLevel ?? 0,
  };
}

function parseRewardConfig(raw: MissionRewardConfig | null): MissionRewardConfig {
  if (!raw) return { ...EMPTY_REWARDS, levels: { min: 0, max: 0 }, coins: { min: 0, max: 0 }, items: { min: 0, max: 0 }, monsters: { count: 0 } };
  return {
    levels: raw.levels ?? { min: 0, max: 0 },
    coins: raw.coins ?? { min: 0, max: 0 },
    items: raw.items ?? { min: 0, max: 0 },
    monsters: raw.monsters ?? { count: 0 },
  };
}

function TagInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="mission-form__tag-input">
      <label className="form-label">{label}</label>
      <div className="mission-form__tags">
        {tags.map(tag => (
          <span key={tag} className="mission-form__tag">
            {tag}
            <button type="button" className="mission-form__tag-remove" onClick={() => removeTag(tag)}>
              <i className="fas fa-times" />
            </button>
          </span>
        ))}
      </div>
      <div className="mission-form__tag-add">
        <input
          type="text"
          className="input sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={`Add ${label.toLowerCase()}...`}
        />
        <button type="button" className="button secondary sm" onClick={addTag}>Add</button>
      </div>
    </div>
  );
}

function MinMaxInput({ label, value, onChange }: { label: string; value: { min: number; max: number }; onChange: (val: { min: number; max: number }) => void }) {
  return (
    <div className="mission-form__minmax">
      <label className="form-label">{label}</label>
      <div className="mission-form__minmax-row">
        <input
          type="number"
          className="input sm"
          value={value.min}
          min={0}
          onChange={e => onChange({ ...value, min: Number(e.target.value) || 0 })}
          placeholder="Min"
        />
        <span className="mission-form__minmax-sep">to</span>
        <input
          type="number"
          className="input sm"
          value={value.max}
          min={0}
          onChange={e => onChange({ ...value, max: Number(e.target.value) || 0 })}
          placeholder="Max"
        />
      </div>
    </div>
  );
}

export function MissionForm({ mission, onSuccess, onCancel }: MissionFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...EMPTY_FORM });
  const [requirements, setRequirements] = useState<MissionRequirements>(parseRequirements(null));
  const [rewardConfig, setRewardConfig] = useState<MissionRewardConfig>(parseRewardConfig(null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mission) {
      setValues({
        title: mission.title,
        description: mission.description ?? '',
        difficulty: mission.difficulty,
        status: mission.status,
        duration: mission.duration,
        minLevel: mission.minLevel,
        maxMonsters: mission.maxMonsters,
        requiredProgress: mission.requiredProgress,
      });
      setRequirements(parseRequirements(mission.requirements));
      setRewardConfig(parseRewardConfig(mission.rewardConfig));
    } else {
      setValues({ ...EMPTY_FORM });
      setRequirements(parseRequirements(null));
      setRewardConfig(parseRewardConfig(null));
    }
    setErrors({});
  }, [mission]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!values.title || String(values.title).trim() === '') {
      newErrors.title = 'Title is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: String(values.title).trim(),
        description: String(values.description || '').trim() || null,
        difficulty: String(values.difficulty),
        status: String(values.status),
        duration: Number(values.duration) || 24,
        minLevel: Number(values.minLevel) || 1,
        maxMonsters: Number(values.maxMonsters) || 3,
        requiredProgress: Number(values.requiredProgress) || 100,
        requirements: requirements,
        rewardConfig: rewardConfig,
      };

      let result;
      if (mission) {
        result = await missionService.adminUpdateMission(mission.id, payload);
      } else {
        result = await missionService.adminCreateMission(payload);
      }

      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        setErrors({ _form: result.message || 'Failed to save mission' });
      }
    } catch {
      setErrors({ _form: 'Failed to save mission' });
    } finally {
      setSubmitting(false);
    }
  }, [values, requirements, rewardConfig, mission, onSuccess]);

  const sections: FieldSection[] = [
    {
      title: 'Basic Info',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Mission title' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4, placeholder: 'Mission description / flavor text' },
        { key: 'difficulty', label: 'Difficulty', type: 'select', options: DIFFICULTY_OPTIONS },
        { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
        { key: 'duration', label: 'Duration (hours)', type: 'number', min: 1, helpText: 'How long the mission takes in hours' },
        { key: 'minLevel', label: 'Minimum Level', type: 'number', min: 1 },
        { key: 'maxMonsters', label: 'Max Monsters', type: 'number', min: 1, max: 10 },
        { key: 'requiredProgress', label: 'Required Progress', type: 'number', min: 1, helpText: 'Progress needed to complete the mission' },
      ],
    },
    {
      title: 'Requirements & Rewards',
      fields: [
        {
          key: 'requirements',
          label: 'Monster Requirements',
          type: 'custom',
          render: () => (
            <div className="mission-form__json-section">
              <TagInput
                label="Required Types"
                tags={requirements.types ?? []}
                onChange={types => setRequirements(prev => ({ ...prev, types }))}
              />
              <TagInput
                label="Required Attributes"
                tags={requirements.attributes ?? []}
                onChange={attributes => setRequirements(prev => ({ ...prev, attributes }))}
              />
              <div className="mission-form__field-row">
                <label className="form-label">Min Monster Level</label>
                <input
                  type="number"
                  className="input sm"
                  value={requirements.minLevel ?? 0}
                  min={0}
                  onChange={e => setRequirements(prev => ({ ...prev, minLevel: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'rewardConfig',
          label: 'Reward Configuration',
          type: 'custom',
          render: () => (
            <div className="mission-form__json-section">
              <MinMaxInput
                label="Level Rewards"
                value={rewardConfig.levels ?? { min: 0, max: 0 }}
                onChange={levels => setRewardConfig(prev => ({ ...prev, levels }))}
              />
              <MinMaxInput
                label="Coin Rewards"
                value={rewardConfig.coins ?? { min: 0, max: 0 }}
                onChange={coins => setRewardConfig(prev => ({ ...prev, coins }))}
              />
              <MinMaxInput
                label="Item Rewards"
                value={rewardConfig.items ?? { min: 0, max: 0 }}
                onChange={items => setRewardConfig(prev => ({ ...prev, items }))}
              />
              <div className="mission-form__field-row">
                <label className="form-label">Monster Reward Count</label>
                <input
                  type="number"
                  className="input sm"
                  value={rewardConfig.monsters?.count ?? 0}
                  min={0}
                  onChange={e => setRewardConfig(prev => ({ ...prev, monsters: { count: Number(e.target.value) || 0 } }))}
                />
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="mission-form">
      {errors._form && (
        <div className="alert error">
          <p>{errors._form}</p>
          <button onClick={() => setErrors(prev => { const next = { ...prev }; delete next._form; return next; })} className="button secondary sm">Dismiss</button>
        </div>
      )}
      <AdminForm
        title={mission ? `Edit Mission: ${mission.title}` : 'Create New Mission'}
        sections={sections}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={mission ? 'Update Mission' : 'Create Mission'}
      />
    </div>
  );
}
