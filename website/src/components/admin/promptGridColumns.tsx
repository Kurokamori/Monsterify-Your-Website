import type { ReactNode } from 'react';
import type { PromptData } from './AdminPromptList';

export interface PromptDraft {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  priority: number;
  is_active: boolean;
  event_name: string;
}

export type PromptDraftUpdater = (patch: Partial<PromptDraft>) => void;

export interface PromptColumn {
  key: string;
  label: string;
  defaultVisible: boolean;
  className?: string;
  render: (prompt: PromptData) => ReactNode;
  renderEdit?: (draft: PromptDraft, update: PromptDraftUpdater) => ReactNode;
}

export interface PromptColumnGroup {
  label: string;
  columnKeys: string[];
}

export interface PromptGridActions {
  onEdit: (prompt: PromptData) => void;
  onDelete: (promptId: number) => Promise<void>;
  onInlineEdit: (prompt: PromptData) => void;
}

const DIFFICULTY_OPTIONS: string[] = ['easy', 'medium', 'hard', 'expert'];

type RewardItemShape = {
  item_name?: string;
  quantity?: number;
  chance?: number;
  category?: string;
  is_random_from_category?: boolean;
  is_random_from_set?: boolean;
};

type StaticMonsterShape = {
  table?: string;
  species_name?: string;
  level?: number;
};

type SemiRandomMonsterShape = {
  table?: string;
  species_name?: string;
  level_mode?: string;
  fixed_level?: number;
  level_min?: number;
  level_max?: number;
  allow_fusion?: boolean;
  type_mode?: string;
  fixed_types?: string[];
  types_min?: number;
  types_max?: number;
  attribute_mode?: string;
  fixed_attribute?: string | null;
};

type MonsterRollParameters = {
  tables?: string[];
  enabledTables?: string[];
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  rarity?: string | null;
  legendary?: boolean;
  mythical?: boolean;
  onlyLegendary?: boolean;
  onlyMythical?: boolean;
  includeSpecies?: string[];
  excludeSpecies?: string[];
  includeTypes?: string[];
  excludeTypes?: string[];
  includeAttributes?: string[];
  excludeAttributes?: string[];
  includeRarities?: string[];
  excludeRarities?: string[];
  includeStages?: string[];
  excludeStages?: string[];
  includeRanks?: string[];
  excludeRanks?: string[];
  customSelector?: string | null;
  species_min?: number;
  species_max?: number;
  types_min?: number;
  types_max?: number;
  tableFilters?: Record<string, unknown>;
  seed?: string;
  [key: string]: unknown;
};

type RewardShape = {
  levels?: number;
  coins?: number;
  items?: RewardItemShape[];
  static_monsters?: StaticMonsterShape[];
  semi_random_monsters?: SemiRandomMonsterShape[];
  monster_roll?: { enabled?: boolean; parameters?: MonsterRollParameters } | null;
  [key: string]: unknown;
};

type MonsterConditionShape = {
  label?: string;
  conditionType?: string;
  applicationMode?: string;
};

const MONTH_LABELS: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function readField<T>(prompt: PromptData, camelKey: string, snakeKey: string): T | undefined {
  const value: unknown = prompt[camelKey] ?? prompt[snakeKey];
  return value === null ? undefined : (value as T);
}

function parseJson<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) { return undefined; }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T;
}

function toStringList(value: unknown): string[] {
  const parsed: unknown = parseJson<unknown>(value);
  if (Array.isArray(parsed)) { return parsed.map((entry) => String(entry)); }
  if (typeof parsed === 'string' && parsed.length > 0) {
    return parsed.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function formatDate(value: unknown): string {
  if (!value) { return '—'; }
  const date: Date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function emptyCell(): ReactNode {
  return <span className="grid-cell-empty">—</span>;
}

export function toPromptDraft(prompt: PromptData): PromptDraft {
  return {
    title: prompt.title ?? '',
    description: (prompt.description as string | undefined) ?? '',
    category: (prompt.category as string | undefined) ?? '',
    difficulty: (prompt.difficulty as string | undefined) ?? 'easy',
    priority: (prompt.priority as number | undefined) ?? 0,
    is_active: readField<boolean>(prompt, 'isActive', 'is_active') ?? false,
    event_name: readField<string>(prompt, 'eventName', 'event_name') ?? '',
  };
}

function renderStatus(prompt: PromptData): ReactNode {
  const isActive: boolean | undefined = readField<boolean>(prompt, 'isActive', 'is_active');
  const endDate: string | undefined = readField<string>(prompt, 'endDate', 'end_date');
  const isAvailable: boolean | undefined = readField<boolean>(prompt, 'isCurrentlyAvailable', 'is_currently_available');

  if (!isActive) { return <span className="badge inactive">Inactive</span>; }
  if (prompt.type === 'event' && endDate && new Date(endDate) < new Date()) {
    return <span className="badge expired">Expired</span>;
  }
  if (isAvailable) { return <span className="badge active">Active</span>; }
  return <span className="badge scheduled">Scheduled</span>;
}

function renderRollFilter(label: string, include: string[] | undefined, exclude: string[] | undefined): ReactNode {
  const included: string[] = include ?? [];
  const excluded: string[] = exclude ?? [];
  if (included.length === 0 && excluded.length === 0) { return null; }
  return (
    <li key={label}>
      <span className="requirement-key">{label}:</span>{' '}
      {included.length > 0 && <span className="roll-include">+{included.join(', ')}</span>}
      {included.length > 0 && excluded.length > 0 && ' '}
      {excluded.length > 0 && <span className="roll-exclude">−{excluded.join(', ')}</span>}
    </li>
  );
}

function renderMonsterRoll(rollConfig: { enabled?: boolean; parameters?: MonsterRollParameters } | null | undefined): ReactNode {
  if (!rollConfig?.enabled) { return null; }
  const parameters: MonsterRollParameters = rollConfig.parameters ?? {};

  const tables: string[] = (parameters.enabledTables?.length ? parameters.enabledTables : parameters.tables) ?? [];
  const fixedSpecies: string[] = [parameters.species1, parameters.species2, parameters.species3]
    .filter((species): species is string => Boolean(species));
  const fixedTypes: string[] = [parameters.type1, parameters.type2, parameters.type3, parameters.type4, parameters.type5]
    .filter((type): type is string => Boolean(type));

  const flags: string[] = [];
  if (parameters.onlyLegendary) { flags.push('Only Legendary'); }
  else if (parameters.legendary) { flags.push('Legendary allowed'); }
  if (parameters.onlyMythical) { flags.push('Only Mythical'); }
  else if (parameters.mythical) { flags.push('Mythical allowed'); }

  const details: ReactNode[] = [];

  details.push(
    <li key="tables">
      <span className="requirement-key">Tables:</span>{' '}
      {tables.length > 0 ? tables.join(', ') : 'All tables'}
    </li>
  );

  if (parameters.species_min !== undefined || parameters.species_max !== undefined) {
    details.push(
      <li key="species-count">
        <span className="requirement-key">Species count:</span>{' '}
        {parameters.species_min ?? 1}–{parameters.species_max ?? 1}
      </li>
    );
  }

  if (parameters.types_min !== undefined || parameters.types_max !== undefined) {
    details.push(
      <li key="types-count">
        <span className="requirement-key">Type count:</span>{' '}
        {parameters.types_min ?? 1}–{parameters.types_max ?? 1}
      </li>
    );
  }

  if (fixedSpecies.length > 0) {
    details.push(
      <li key="fixed-species">
        <span className="requirement-key">Fixed species:</span> {fixedSpecies.join(', ')}
      </li>
    );
  }

  if (fixedTypes.length > 0) {
    details.push(
      <li key="fixed-types">
        <span className="requirement-key">Fixed types:</span> {fixedTypes.join(', ')}
      </li>
    );
  }

  if (parameters.attribute) {
    details.push(
      <li key="attribute"><span className="requirement-key">Attribute:</span> {parameters.attribute}</li>
    );
  }

  if (parameters.rarity) {
    details.push(<li key="rarity"><span className="requirement-key">Rarity:</span> {parameters.rarity}</li>);
  }

  if (flags.length > 0) {
    details.push(<li key="flags"><span className="requirement-key">Flags:</span> {flags.join(', ')}</li>);
  }

  const filters: ReactNode[] = [
    renderRollFilter('Species', parameters.includeSpecies, parameters.excludeSpecies),
    renderRollFilter('Types', parameters.includeTypes, parameters.excludeTypes),
    renderRollFilter('Attributes', parameters.includeAttributes, parameters.excludeAttributes),
    renderRollFilter('Rarities', parameters.includeRarities, parameters.excludeRarities),
    renderRollFilter('Stages', parameters.includeStages, parameters.excludeStages),
    renderRollFilter('Ranks', parameters.includeRanks, parameters.excludeRanks),
  ].filter((entry): entry is ReactNode => entry !== null);

  details.push(...filters);

  if (parameters.customSelector) {
    details.push(
      <li key="selector">
        <span className="requirement-key">Custom selector:</span>{' '}
        <span className="grid-mono">{parameters.customSelector}</span>
      </li>
    );
  }

  if (parameters.seed) {
    details.push(
      <li key="seed"><span className="requirement-key">Seed:</span> <span className="grid-mono">{parameters.seed}</span></li>
    );
  }

  const tableFilterEntries: [string, unknown][] = Object.entries(parameters.tableFilters ?? {})
    .filter(([, value]) => value && Object.keys(value as Record<string, unknown>).length > 0);

  for (const [table, value] of tableFilterEntries) {
    const parts: string[] = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => Array.isArray(entryValue) ? entryValue.length > 0 : Boolean(entryValue))
      .map(([entryKey, entryValue]) => `${entryKey}: ${Array.isArray(entryValue) ? entryValue.join(', ') : String(entryValue)}`);
    if (parts.length === 0) { continue; }
    details.push(
      <li key={`table-${table}`}>
        <span className="requirement-key">{table} filters:</span> {parts.join(' | ')}
      </li>
    );
  }

  return (
    <div key="roll" className="reward-line">
      <span className="reward-tag roll">Monster Roll</span>
      <ul className="reward-sublist">{details}</ul>
    </div>
  );
}

function renderRewards(prompt: PromptData): ReactNode {
  const rewards: RewardShape | undefined = parseJson<RewardShape>(prompt.rewards);
  if (!rewards) { return emptyCell(); }

  const lines: ReactNode[] = [];

  if (rewards.levels) {
    lines.push(<div key="levels" className="reward-line"><span className="reward-tag levels">Levels</span> {rewards.levels}</div>);
  }
  if (rewards.coins) {
    lines.push(<div key="coins" className="reward-line"><span className="reward-tag coins">Coins</span> {rewards.coins}</div>);
  }

  const items: RewardItemShape[] = rewards.items ?? [];
  if (items.length > 0) {
    lines.push(
      <div key="items" className="reward-line">
        <span className="reward-tag items">Items</span>
        <ul className="reward-sublist">
          {items.map((item, index) => {
            const name: string = item.is_random_from_category
              ? `Random from ${item.category || 'category'}`
              : item.is_random_from_set
                ? 'Random from set'
                : item.item_name || 'Unnamed item';
            const chance: number = item.chance ?? 100;
            return (
              <li key={index}>
                {name} ×{item.quantity ?? 1}
                {chance < 100 && <span className="reward-chance"> ({chance}%)</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const staticMonsters: StaticMonsterShape[] = rewards.static_monsters ?? [];
  if (staticMonsters.length > 0) {
    lines.push(
      <div key="static" className="reward-line">
        <span className="reward-tag monsters">Monsters</span>
        <ul className="reward-sublist">
          {staticMonsters.map((monster, index) => (
            <li key={index}>
              {monster.species_name || 'Unset species'}
              {monster.table && <span className="reward-chance"> [{monster.table}]</span>}
              {monster.level !== undefined && ` Lv.${monster.level}`}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const semiRandom: SemiRandomMonsterShape[] = rewards.semi_random_monsters ?? [];
  if (semiRandom.length > 0) {
    lines.push(
      <div key="semi" className="reward-line">
        <span className="reward-tag monsters">Semi-Random</span>
        <ul className="reward-sublist">
          {semiRandom.map((monster, index) => {
            const level: string = monster.level_mode === 'random'
              ? `Lv.${monster.level_min ?? '?'}–${monster.level_max ?? '?'}`
              : `Lv.${monster.fixed_level ?? '?'}`;
            const types: string = monster.type_mode === 'fixed'
              ? (monster.fixed_types ?? []).join('/') || 'fixed types'
              : `${monster.types_min ?? 1}–${monster.types_max ?? 1} random types`;
            const attribute: string = monster.attribute_mode === 'fixed'
              ? monster.fixed_attribute || 'fixed attribute'
              : 'random attribute';
            return (
              <li key={index}>
                {monster.species_name || 'Random species'}
                {monster.table && <span className="reward-chance"> [{monster.table}]</span>}
                {` ${level}`}
                <span className="reward-chance"> — {types}, {attribute}{monster.allow_fusion ? ', fusion allowed' : ''}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const rollNode: ReactNode = renderMonsterRoll(rewards.monster_roll);
  if (rollNode) { lines.push(rollNode); }

  if (lines.length === 0) { return emptyCell(); }
  return <div className="reward-breakdown">{lines}</div>;
}

function renderMonsterRollColumn(prompt: PromptData): ReactNode {
  const rewards: RewardShape | undefined = parseJson<RewardShape>(prompt.rewards);
  const rollNode: ReactNode = renderMonsterRoll(rewards?.monster_roll);
  if (!rollNode) { return emptyCell(); }
  return <div className="reward-breakdown">{rollNode}</div>;
}

function renderRequirements(prompt: PromptData): ReactNode {
  const requirements: Record<string, unknown> | undefined = parseJson<Record<string, unknown>>(prompt.requirements);
  if (!requirements || Object.keys(requirements).length === 0) { return emptyCell(); }
  return (
    <ul className="reward-sublist">
      {Object.entries(requirements).map(([key, value]) => (
        <li key={key}>
          <span className="requirement-key">{key}:</span>{' '}
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </li>
      ))}
    </ul>
  );
}

function renderMonsterConditions(prompt: PromptData): ReactNode {
  const conditions: MonsterConditionShape[] | undefined = parseJson<MonsterConditionShape[]>(
    prompt.monsterConditions ?? prompt.monster_conditions
  );
  if (!conditions || conditions.length === 0) { return emptyCell(); }
  return (
    <ul className="reward-sublist">
      {conditions.map((condition, index) => (
        <li key={index}>
          {condition.label || condition.conditionType || 'Condition'}
          {condition.applicationMode && <span className="reward-chance"> ({condition.applicationMode})</span>}
        </li>
      ))}
    </ul>
  );
}

function renderTagList(value: unknown, badgeClass: string): ReactNode {
  const tags: string[] = toStringList(value);
  if (tags.length === 0) { return emptyCell(); }
  return (
    <div className="grid-tag-list">
      {tags.map((tag) => <span key={tag} className={`badge ${badgeClass}`}>{tag}</span>)}
    </div>
  );
}

function renderActiveMonths(prompt: PromptData): ReactNode {
  const raw: string | undefined = readField<string>(prompt, 'activeMonths', 'active_months');
  const months: string[] = toStringList(raw);
  if (months.length === 0) { return emptyCell(); }
  return (
    <div className="grid-tag-list">
      {months.map((month) => {
        const index: number = Number(month) - 1;
        const label: string = MONTH_LABELS[index] ?? month;
        return <span key={month} className="badge month">{label}</span>;
      })}
    </div>
  );
}

function renderLevelRange(prompt: PromptData): ReactNode {
  const min: number | undefined = readField<number>(prompt, 'minTrainerLevel', 'min_trainer_level');
  const max: number | undefined = readField<number>(prompt, 'maxTrainerLevel', 'max_trainer_level');
  if (min === undefined && max === undefined) { return emptyCell(); }
  return <span>{min ?? '0'} – {max ?? '∞'}</span>;
}

function renderSubmissionLimits(prompt: PromptData): ReactNode {
  const total: number | undefined = readField<number>(prompt, 'maxSubmissions', 'max_submissions');
  const perTrainer: number | undefined = readField<number>(prompt, 'maxSubmissionsPerTrainer', 'max_submissions_per_trainer');
  if (total === undefined && perTrainer === undefined) { return <span>Unlimited</span>; }
  return (
    <div className="grid-stacked">
      <span>Total: {total ?? '∞'}</span>
      <span>Per trainer: {perTrainer ?? '∞'}</span>
    </div>
  );
}

function renderSubmissions(prompt: PromptData): ReactNode {
  const total: number = readField<number>(prompt, 'submissionCount', 'submission_count') ?? 0;
  const approved: number = readField<number>(prompt, 'approvedCount', 'approved_count') ?? 0;
  const pending: number = readField<number>(prompt, 'pendingCount', 'pending_count') ?? 0;
  return (
    <div className="grid-stacked">
      <span className="submission-total">{total} total</span>
      <span className="submission-approved">{approved} approved</span>
      <span className="submission-pending">{pending} pending</span>
    </div>
  );
}

function renderBoolean(value: boolean | undefined): ReactNode {
  return value
    ? <span className="badge active">Yes</span>
    : <span className="badge inactive">No</span>;
}

export function buildPromptColumns(actions: PromptGridActions): PromptColumn[] {
  return [
    {
      key: 'id',
      label: 'ID',
      defaultVisible: false,
      className: 'grid-cell-narrow',
      render: (prompt) => <span className="grid-mono">#{prompt.id}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      defaultVisible: true,
      className: 'grid-cell-title',
      render: (prompt) => <span className="prompt-title">{prompt.title}</span>,
      renderEdit: (draft, update) => (
        <input type="text" className="grid-edit-input" value={draft.title} aria-label="Title"
          onChange={(event) => update({ title: event.target.value })} />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      defaultVisible: true,
      className: 'grid-cell-wide',
      render: (prompt) => prompt.description
        ? <span className="grid-description">{prompt.description as string}</span>
        : emptyCell(),
      renderEdit: (draft, update) => (
        <textarea className="grid-edit-input grid-edit-textarea" rows={5} value={draft.description} aria-label="Description"
          onChange={(event) => update({ description: event.target.value })} />
      ),
    },
    {
      key: 'type',
      label: 'Type',
      defaultVisible: true,
      render: (prompt) => <span className={`badge type-${prompt.type}`}>{prompt.type}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      defaultVisible: false,
      render: (prompt) => (prompt.category as string) || emptyCell(),
      renderEdit: (draft, update) => (
        <input type="text" className="grid-edit-input" value={draft.category} aria-label="Category"
          onChange={(event) => update({ category: event.target.value })} />
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      defaultVisible: false,
      render: (prompt) => (prompt.difficulty as string) || emptyCell(),
      renderEdit: (draft, update) => (
        <select className="grid-edit-input" value={draft.difficulty} aria-label="Difficulty"
          onChange={(event) => update({ difficulty: event.target.value })}>
          {DIFFICULTY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      defaultVisible: true,
      render: renderStatus,
      renderEdit: (draft, update) => (
        <label className="checkbox-label">
          <input type="checkbox" checked={draft.is_active}
            onChange={(event) => update({ is_active: event.target.checked })} />
          <span>Active</span>
        </label>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      defaultVisible: false,
      className: 'grid-cell-narrow',
      render: (prompt) => <span>{(prompt.priority as number) ?? 0}</span>,
      renderEdit: (draft, update) => (
        <input type="number" className="grid-edit-input" value={draft.priority} aria-label="Priority"
          onChange={(event) => update({ priority: Number(event.target.value) })} />
      ),
    },
    {
      key: 'rewards',
      label: 'Rewards',
      defaultVisible: true,
      className: 'grid-cell-wide',
      render: renderRewards,
    },
    {
      key: 'monsterRoll',
      label: 'Monster Roll',
      defaultVisible: false,
      className: 'grid-cell-wide',
      render: renderMonsterRollColumn,
    },
    {
      key: 'requirements',
      label: 'Requirements',
      defaultVisible: false,
      className: 'grid-cell-wide',
      render: renderRequirements,
    },
    {
      key: 'monsterConditions',
      label: 'Monster Conditions',
      defaultVisible: false,
      className: 'grid-cell-wide',
      render: renderMonsterConditions,
    },
    {
      key: 'tags',
      label: 'Tags',
      defaultVisible: false,
      render: (prompt) => renderTagList(prompt.tags, 'tag'),
    },
    {
      key: 'requiredFactions',
      label: 'Required Factions',
      defaultVisible: false,
      render: (prompt) => renderTagList(prompt.requiredFactions ?? prompt.required_factions, 'faction'),
    },
    {
      key: 'trainerLevel',
      label: 'Trainer Level',
      defaultVisible: false,
      render: renderLevelRange,
    },
    {
      key: 'activeMonths',
      label: 'Active Months',
      defaultVisible: false,
      render: renderActiveMonths,
    },
    {
      key: 'eventName',
      label: 'Event Name',
      defaultVisible: false,
      render: (prompt) => readField<string>(prompt, 'eventName', 'event_name') || emptyCell(),
      renderEdit: (draft, update) => (
        <input type="text" className="grid-edit-input" value={draft.event_name} aria-label="Event name"
          onChange={(event) => update({ event_name: event.target.value })} />
      ),
    },
    {
      key: 'startDate',
      label: 'Starts',
      defaultVisible: false,
      className: 'date-cell',
      render: (prompt) => formatDate(readField<string>(prompt, 'startDate', 'start_date')),
    },
    {
      key: 'endDate',
      label: 'Ends',
      defaultVisible: false,
      className: 'date-cell',
      render: (prompt) => formatDate(readField<string>(prompt, 'endDate', 'end_date')),
    },
    {
      key: 'submissionLimits',
      label: 'Submission Limits',
      defaultVisible: false,
      render: renderSubmissionLimits,
    },
    {
      key: 'requiresApproval',
      label: 'Approval',
      defaultVisible: false,
      render: (prompt) => renderBoolean(readField<boolean>(prompt, 'requiresApproval', 'requires_approval')),
    },
    {
      key: 'submissions',
      label: 'Submissions',
      defaultVisible: true,
      render: renderSubmissions,
    },
    {
      key: 'createdAt',
      label: 'Created',
      defaultVisible: false,
      className: 'date-cell',
      render: (prompt) => formatDate(readField<string>(prompt, 'createdAt', 'created_at')),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      defaultVisible: false,
      className: 'date-cell',
      render: (prompt) => formatDate(readField<string>(prompt, 'updatedAt', 'updated_at')),
    },
    {
      key: 'actions',
      label: 'Actions',
      defaultVisible: true,
      className: 'actions-cell',
      render: (prompt) => (
        <div className="admin-prompt__actions grid-stacked">
          <button onClick={() => actions.onInlineEdit(prompt)} className="button secondary sm" title="Edit inline">Quick Edit</button>
          <button onClick={() => actions.onEdit(prompt)} className="button primary sm" title="Open full editor">Full Edit</button>
          <button onClick={() => actions.onDelete(prompt.id)} className="button danger sm" title="Delete prompt">Delete</button>
        </div>
      ),
    },
  ];
}

export const PROMPT_COLUMN_GROUPS: PromptColumnGroup[] = [
  { label: 'Core', columnKeys: ['id', 'title', 'description', 'type', 'category', 'difficulty', 'status', 'priority'] },
  { label: 'Rewards & Conditions', columnKeys: ['rewards', 'monsterRoll', 'requirements', 'monsterConditions'] },
  { label: 'Eligibility', columnKeys: ['tags', 'requiredFactions', 'trainerLevel', 'activeMonths', 'eventName', 'startDate', 'endDate'] },
  { label: 'Submissions', columnKeys: ['submissionLimits', 'requiresApproval', 'submissions'] },
  { label: 'Meta', columnKeys: ['createdAt', 'updatedAt', 'actions'] },
];
