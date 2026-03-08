import { useState, useEffect, useCallback, FormEvent } from 'react';
import { AdminForm } from './AdminForm';
import type { FieldSection } from './AdminForm';
import type { Mission, MissionRequirements, MissionRewardConfig, MissionItemRewardEntry } from '@services/missionService';
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

const ITEM_CATEGORY_OPTIONS = [
  { value: 'berries', label: 'Berries' },
  { value: 'balls', label: 'Balls' },
  { value: 'items', label: 'Items' },
  { value: 'pastries', label: 'Pastries' },
  { value: 'evolution', label: 'Evolution' },
  { value: 'helditems', label: 'Held Items' },
  { value: 'antiques', label: 'Antiques' },
  { value: 'seals', label: 'Seals' },
  { value: 'keyitems', label: 'Key Items' },
  { value: 'eggs', label: 'Eggs' },
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

type AmountMode = 'fixed' | 'range';

interface RewardState {
  levelsMode: AmountMode;
  levelsFixed: number;
  levelsMin: number;
  levelsMax: number;
  coinsMode: AmountMode;
  coinsFixed: number;
  coinsMin: number;
  coinsMax: number;
  items: ItemEntryState[];
}

type ItemMode = 'static' | 'category' | 'pool';

interface ItemEntryState {
  mode: ItemMode;
  itemName: string;
  category: string;
  itemPool: string;
  quantity: number;
  chance: number;
}

function parseRequirements(raw: MissionRequirements | null): MissionRequirements {
  if (!raw) return { ...EMPTY_REQUIREMENTS, types: [], attributes: [] };
  return {
    types: raw.types ?? [],
    attributes: raw.attributes ?? [],
    minLevel: raw.minLevel ?? 0,
  };
}

function parseRewardConfig(raw: MissionRewardConfig | null): RewardState {
  const state: RewardState = {
    levelsMode: 'fixed',
    levelsFixed: 0,
    levelsMin: 0,
    levelsMax: 0,
    coinsMode: 'fixed',
    coinsFixed: 0,
    coinsMin: 0,
    coinsMax: 0,
    items: [],
  };

  if (!raw) return state;

  // Parse levels
  if (raw.levels !== undefined) {
    if (typeof raw.levels === 'number') {
      state.levelsMode = 'fixed';
      state.levelsFixed = raw.levels;
    } else {
      state.levelsMode = 'range';
      state.levelsMin = raw.levels.min;
      state.levelsMax = raw.levels.max;
    }
  }

  // Parse coins
  if (raw.coins !== undefined) {
    if (typeof raw.coins === 'number') {
      state.coinsMode = 'fixed';
      state.coinsFixed = raw.coins;
    } else {
      state.coinsMode = 'range';
      state.coinsMin = raw.coins.min;
      state.coinsMax = raw.coins.max;
    }
  }

  // Parse items
  if (raw.items) {
    state.items = raw.items.map((entry): ItemEntryState => {
      if (entry.itemName) {
        return { mode: 'static', itemName: entry.itemName, category: 'berries', itemPool: '', quantity: entry.quantity ?? 1, chance: entry.chance ?? 100 };
      }
      if (entry.category) {
        return { mode: 'category', itemName: '', category: entry.category, itemPool: '', quantity: entry.quantity ?? 1, chance: entry.chance ?? 100 };
      }
      if (entry.itemPool) {
        return { mode: 'pool', itemName: '', category: 'berries', itemPool: entry.itemPool.join(', '), quantity: entry.quantity ?? 1, chance: entry.chance ?? 100 };
      }
      return { mode: 'static', itemName: '', category: 'berries', itemPool: '', quantity: 1, chance: 100 };
    });
  }

  return state;
}

function buildRewardConfig(state: RewardState): MissionRewardConfig {
  const config: MissionRewardConfig = {};

  // Levels
  if (state.levelsMode === 'fixed' && state.levelsFixed > 0) {
    config.levels = state.levelsFixed;
  } else if (state.levelsMode === 'range' && (state.levelsMin > 0 || state.levelsMax > 0)) {
    config.levels = { min: state.levelsMin, max: state.levelsMax };
  }

  // Coins
  if (state.coinsMode === 'fixed' && state.coinsFixed > 0) {
    config.coins = state.coinsFixed;
  } else if (state.coinsMode === 'range' && (state.coinsMin > 0 || state.coinsMax > 0)) {
    config.coins = { min: state.coinsMin, max: state.coinsMax };
  }

  // Items
  if (state.items.length > 0) {
    config.items = state.items.map((entry): MissionItemRewardEntry => {
      const base: MissionItemRewardEntry = {
        quantity: entry.quantity,
        chance: entry.chance,
      };
      if (entry.mode === 'static') {
        base.itemName = entry.itemName;
      } else if (entry.mode === 'category') {
        base.category = entry.category;
      } else if (entry.mode === 'pool') {
        base.itemPool = entry.itemPool
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n));
      }
      return base;
    });
  }

  return config;
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

function AmountEditor({
  label,
  mode,
  fixedValue,
  minValue,
  maxValue,
  onModeChange,
  onFixedChange,
  onRangeChange,
}: {
  label: string;
  mode: AmountMode;
  fixedValue: number;
  minValue: number;
  maxValue: number;
  onModeChange: (mode: AmountMode) => void;
  onFixedChange: (val: number) => void;
  onRangeChange: (min: number, max: number) => void;
}) {
  return (
    <div className="mission-form__amount-editor">
      <div className="mission-form__amount-header">
        <label className="form-label">{label}</label>
        <div className="mission-form__amount-toggle">
          <button
            type="button"
            className={`button sm ${mode === 'fixed' ? 'primary' : 'secondary'}`}
            onClick={() => onModeChange('fixed')}
          >
            Fixed
          </button>
          <button
            type="button"
            className={`button sm ${mode === 'range' ? 'primary' : 'secondary'}`}
            onClick={() => onModeChange('range')}
          >
            Range
          </button>
        </div>
      </div>
      {mode === 'fixed' ? (
        <input
          type="number"
          className="input sm"
          value={fixedValue}
          min={0}
          onChange={e => onFixedChange(Number(e.target.value) || 0)}
        />
      ) : (
        <MinMaxInput
          label=""
          value={{ min: minValue, max: maxValue }}
          onChange={val => onRangeChange(val.min, val.max)}
        />
      )}
    </div>
  );
}

function ItemRewardEditor({
  items,
  onChange,
}: {
  items: ItemEntryState[];
  onChange: (items: ItemEntryState[]) => void;
}) {
  const addItem = () => {
    onChange([...items, { mode: 'static', itemName: '', category: 'berries', itemPool: '', quantity: 1, chance: 100 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, partial: Partial<ItemEntryState>) => {
    const next = [...items];
    next[index] = { ...next[index], ...partial } as ItemEntryState;
    onChange(next);
  };

  return (
    <div className="mission-form__item-rewards">
      <div className="mission-form__amount-header">
        <label className="form-label">Item Rewards</label>
        <button type="button" className="button secondary sm" onClick={addItem}>
          <i className="fas fa-plus"></i> Add Item
        </button>
      </div>

      {items.map((entry, i) => (
        <div key={i} className="mission-form__item-entry">
          <div className="mission-form__item-entry-header">
            <select
              className="select sm"
              value={entry.mode}
              onChange={e => updateItem(i, { mode: e.target.value as ItemMode })}
            >
              <option value="static">Static Item</option>
              <option value="category">Random from Category</option>
              <option value="pool">Random from Pool</option>
            </select>
            <button
              type="button"
              className="button icon danger small"
              onClick={() => removeItem(i)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>

          <div className="mission-form__item-entry-body">
            {entry.mode === 'static' && (
              <input
                type="text"
                className="input sm"
                value={entry.itemName}
                onChange={e => updateItem(i, { itemName: e.target.value })}
                placeholder="Item name..."
              />
            )}
            {entry.mode === 'category' && (
              <select
                className="select sm"
                value={entry.category}
                onChange={e => updateItem(i, { category: e.target.value })}
              >
                {ITEM_CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {entry.mode === 'pool' && (
              <input
                type="text"
                className="input sm"
                value={entry.itemPool}
                onChange={e => updateItem(i, { itemPool: e.target.value })}
                placeholder="Comma-separated item IDs..."
              />
            )}

            <div className="mission-form__item-entry-fields">
              <div className="mission-form__item-field">
                <label className="form-label">Qty</label>
                <input
                  type="number"
                  className="input sm"
                  value={entry.quantity}
                  min={1}
                  onChange={e => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="mission-form__item-field">
                <label className="form-label">Chance %</label>
                <input
                  type="number"
                  className="input sm"
                  value={entry.chance}
                  min={0}
                  max={100}
                  onChange={e => updateItem(i, { chance: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="form-tooltip--section">No item rewards configured. Click "Add Item" to add one.</p>
      )}
    </div>
  );
}

export function MissionForm({ mission, onSuccess, onCancel }: MissionFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...EMPTY_FORM });
  const [requirements, setRequirements] = useState<MissionRequirements>(parseRequirements(null));
  const [rewardState, setRewardState] = useState<RewardState>(parseRewardConfig(null));
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
      setRewardState(parseRewardConfig(mission.rewardConfig));
    } else {
      setValues({ ...EMPTY_FORM });
      setRequirements(parseRequirements(null));
      setRewardState(parseRewardConfig(null));
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
      const rewardConfig = buildRewardConfig(rewardState);

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
  }, [values, requirements, rewardState, mission, onSuccess]);

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
              <AmountEditor
                label="Level Rewards"
                mode={rewardState.levelsMode}
                fixedValue={rewardState.levelsFixed}
                minValue={rewardState.levelsMin}
                maxValue={rewardState.levelsMax}
                onModeChange={mode => setRewardState(prev => ({ ...prev, levelsMode: mode }))}
                onFixedChange={val => setRewardState(prev => ({ ...prev, levelsFixed: val }))}
                onRangeChange={(min, max) => setRewardState(prev => ({ ...prev, levelsMin: min, levelsMax: max }))}
              />
              <AmountEditor
                label="Coin Rewards"
                mode={rewardState.coinsMode}
                fixedValue={rewardState.coinsFixed}
                minValue={rewardState.coinsMin}
                maxValue={rewardState.coinsMax}
                onModeChange={mode => setRewardState(prev => ({ ...prev, coinsMode: mode }))}
                onFixedChange={val => setRewardState(prev => ({ ...prev, coinsFixed: val }))}
                onRangeChange={(min, max) => setRewardState(prev => ({ ...prev, coinsMin: min, coinsMax: max }))}
              />
              <ItemRewardEditor
                items={rewardState.items}
                onChange={items => setRewardState(prev => ({ ...prev, items }))}
              />
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
