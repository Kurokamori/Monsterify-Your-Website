import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  AdminRoute,
  TabContainer,
  TrainerAutocomplete,
  MonsterAutocomplete,
  FormInput,
  FormCheckbox,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  ActionButtonGroup,
  ConfirmModal,
  useConfirmModal,
} from '@components/common';
import type { Tab } from '@components/common';
import adminService from '@services/adminService';
import api from '@services/api';
import '@styles/admin/level-manager.css';

// ── Types ─────────────────────────────────────────────────────────────

interface Trainer {
  id: number;
  name: string;
  level: number;
}

interface Monster {
  id: number;
  name: string;
  level: number;
  trainer_id: number;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

interface TrainerLevelEntry {
  key: string;
  trainerId: number | null;
  trainerName: string;
  levels: number;
  giveCoins: boolean;
}

interface MonsterLevelEntry {
  key: string;
  trainerId: number | null;
  trainerName: string;
  monsterId: number | null;
  monsterName: string;
  levels: number;
  giveCoins: boolean;
}

interface CommitResult {
  entryKey: string;
  name: string;
  success: boolean;
  message: string;
}

type ActiveTab = 'trainer' | 'monster';

// ── Helpers ───────────────────────────────────────────────────────────

let entryCounter = 0;
function nextKey(): string {
  return `entry-${++entryCounter}`;
}

function getAxiosError(err: unknown, fallback: string): string {
  const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (axiosMessage) return axiosMessage;
  if (err instanceof Error) return err.message;
  return fallback;
}

// ── Component ─────────────────────────────────────────────────────────

function LevelManagerContent() {
  useDocumentTitle('Level Manager');

  const [activeTab, setActiveTab] = useState<ActiveTab>('trainer');

  // Trainer data (shared between both tabs)
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(true);

  // Monster data per trainer
  const [monstersByTrainer, setMonstersByTrainer] = useState<Record<number, Monster[]>>({});
  const [monsterLoadingFor, setMonsterLoadingFor] = useState<number | null>(null);

  // Trainer tab entries
  const [trainerEntries, setTrainerEntries] = useState<TrainerLevelEntry[]>([
    { key: nextKey(), trainerId: null, trainerName: '', levels: 1, giveCoins: true },
  ]);

  // Monster tab entries
  const [monsterEntries, setMonsterEntries] = useState<MonsterLevelEntry[]>([
    { key: nextKey(), trainerId: null, trainerName: '', monsterId: null, monsterName: '', levels: 1, giveCoins: true },
  ]);

  // UI state
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [commitResults, setCommitResults] = useState<CommitResult[]>([]);

  const commitConfirm = useConfirmModal();

  // ── Fetch trainers ────────────────────────────────────────────────

  useEffect(() => {
    setTrainersLoading(true);
    api.get('/trainers/all')
      .then(response => {
        const data = response.data.trainers || response.data.data || response.data || [];
        setTrainers(data);
      })
      .catch(() => setTrainers([]))
      .finally(() => setTrainersLoading(false));
  }, []);

  // ── Fetch monsters for a trainer ──────────────────────────────────

  const fetchMonstersForTrainer = useCallback(async (trainerId: number) => {
    if (monstersByTrainer[trainerId]) return;
    setMonsterLoadingFor(trainerId);
    try {
      const response = await api.get(`/monsters/trainer/${trainerId}`);
      const monsters = response.data.monsters || response.data.data || response.data || [];
      setMonstersByTrainer(prev => ({ ...prev, [trainerId]: monsters }));
    } catch {
      setMonstersByTrainer(prev => ({ ...prev, [trainerId]: [] }));
    } finally {
      setMonsterLoadingFor(null);
    }
  }, [monstersByTrainer]);

  // ── Tabs ──────────────────────────────────────────────────────────

  const tabs: Tab[] = useMemo(() => [
    { key: 'trainer', label: 'Trainer Levels', icon: 'fas fa-user', content: null },
    { key: 'monster', label: 'Monster Levels', icon: 'fas fa-paw', content: null },
  ], []);

  // ── Trainer Entry Handlers ────────────────────────────────────────

  const addTrainerEntry = useCallback(() => {
    setTrainerEntries(prev => [
      ...prev,
      { key: nextKey(), trainerId: null, trainerName: '', levels: 1, giveCoins: true },
    ]);
  }, []);

  const removeTrainerEntry = useCallback((key: string) => {
    setTrainerEntries(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(e => e.key !== key);
    });
  }, []);

  const updateTrainerEntry = useCallback((key: string, updates: Partial<TrainerLevelEntry>) => {
    setTrainerEntries(prev =>
      prev.map(e => e.key === key ? { ...e, ...updates } : e)
    );
  }, []);

  // ── Monster Entry Handlers ────────────────────────────────────────

  const addMonsterEntry = useCallback(() => {
    setMonsterEntries(prev => [
      ...prev,
      { key: nextKey(), trainerId: null, trainerName: '', monsterId: null, monsterName: '', levels: 1, giveCoins: true },
    ]);
  }, []);

  const removeMonsterEntry = useCallback((key: string) => {
    setMonsterEntries(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(e => e.key !== key);
    });
  }, []);

  const updateMonsterEntry = useCallback((key: string, updates: Partial<MonsterLevelEntry>) => {
    setMonsterEntries(prev =>
      prev.map(e => e.key === key ? { ...e, ...updates } : e)
    );
  }, []);

  const handleMonsterTrainerSelect = useCallback((key: string, trainerId: number | string | null) => {
    const numId = trainerId != null ? Number(trainerId) : null;
    const trainer = numId != null ? trainers.find(t => t.id === numId) : null;
    updateMonsterEntry(key, {
      trainerId: numId,
      trainerName: trainer?.name ?? '',
      monsterId: null,
      monsterName: '',
    });
    if (numId != null) {
      fetchMonstersForTrainer(numId);
    }
  }, [trainers, updateMonsterEntry, fetchMonstersForTrainer]);

  // ── Validation ────────────────────────────────────────────────────

  const validTrainerEntries = useMemo(() =>
    trainerEntries.filter(e => e.trainerId != null && e.levels > 0),
    [trainerEntries]
  );

  const validMonsterEntries = useMemo(() =>
    monsterEntries.filter(e => e.monsterId != null && e.levels > 0),
    [monsterEntries]
  );

  const canCommit = activeTab === 'trainer'
    ? validTrainerEntries.length > 0
    : validMonsterEntries.length > 0;

  // ── Commit Handlers ───────────────────────────────────────────────

  const commitTrainerLevels = async () => {
    setCommitting(true);
    setError(null);
    setSuccess(null);
    const results: CommitResult[] = [];

    for (const entry of validTrainerEntries) {
      try {
        const coins = entry.giveCoins ? undefined : 0;
        const result = await adminService.addLevelsToTrainer(
          entry.trainerId!,
          entry.levels,
          coins,
          'Level Manager batch',
        );
        results.push({
          entryKey: entry.key,
          name: entry.trainerName,
          success: true,
          message: result.message,
        });
      } catch (err: unknown) {
        results.push({
          entryKey: entry.key,
          name: entry.trainerName,
          success: false,
          message: getAxiosError(err, 'Failed to add levels'),
        });
      }
    }

    setCommitResults(results);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      setSuccess(`Successfully added levels to ${successCount} trainer(s)`);
      setTrainerEntries([{ key: nextKey(), trainerId: null, trainerName: '', levels: 1, giveCoins: true }]);
    } else {
      setError(`${successCount} succeeded, ${failCount} failed`);
    }
    setCommitting(false);
  };

  const commitMonsterLevels = async () => {
    setCommitting(true);
    setError(null);
    setSuccess(null);
    const results: CommitResult[] = [];

    for (const entry of validMonsterEntries) {
      try {
        const result = await adminService.addLevelsToMonster(
          entry.monsterId!,
          entry.levels,
          'Level Manager batch',
        );
        results.push({
          entryKey: entry.key,
          name: entry.monsterName,
          success: true,
          message: result.message,
        });

        // If coins toggled on, also add coins to the trainer
        if (entry.giveCoins && entry.trainerId != null) {
          try {
            await adminService.addLevelsToTrainer(
              entry.trainerId,
              0,
              entry.levels * 50,
              `Coins from monster ${entry.monsterName} leveling`,
            );
          } catch {
            // Coins failing shouldn't fail the whole entry
            results[results.length - 1]!.message += ' (coin grant to trainer failed)';
          }
        }
      } catch (err: unknown) {
        results.push({
          entryKey: entry.key,
          name: entry.monsterName,
          success: false,
          message: getAxiosError(err, 'Failed to add levels'),
        });
      }
    }

    setCommitResults(results);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      setSuccess(`Successfully added levels to ${successCount} monster(s)`);
      setMonsterEntries([{
        key: nextKey(), trainerId: null, trainerName: '',
        monsterId: null, monsterName: '', levels: 1, giveCoins: true,
      }]);
    } else {
      setError(`${successCount} succeeded, ${failCount} failed`);
    }
    setCommitting(false);
  };

  const handleCommit = () => {
    const entries = activeTab === 'trainer' ? validTrainerEntries : validMonsterEntries;
    const type = activeTab === 'trainer' ? 'trainer' : 'monster';
    commitConfirm.confirm(
      `Are you sure you want to add levels to ${entries.length} ${type}(s)? This cannot be undone.`,
      activeTab === 'trainer' ? commitTrainerLevels : commitMonsterLevels,
      { title: 'Confirm Level Addition', confirmText: 'Commit Levels', variant: 'warning' },
    );
  };

  // ── Render ────────────────────────────────────────────────────────

  if (trainersLoading) {
    return <LoadingSpinner message="Loading trainers..." />;
  }

  return (
    <div className="container vertical gap-lg">
      {/* Header */}
      <div>
        <h1><i className="fas fa-chart-line"></i> Level Manager</h1>
        <p className="text-muted">Add levels to trainers or monsters in batch. Entries are committed all at once.</p>
      </div>

      {/* Tab Toggle */}
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => {
          setActiveTab(key as ActiveTab);
          setError(null);
          setSuccess(null);
          setCommitResults([]);
        }}
        variant="pills"
        contentClassName="hidden"
      />

      {/* Messages */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      {/* Commit Results */}
      {commitResults.length > 0 && (
        <div className="level-manager__results">
          <h3><i className="fas fa-clipboard-check"></i> Commit Results</h3>
          <div className="level-manager__results-list">
            {commitResults.map((r, i) => (
              <div
                key={i}
                className={`level-manager__result-item ${r.success ? 'level-manager__result-item--success' : 'level-manager__result-item--fail'}`}
              >
                <i className={r.success ? 'fas fa-check-circle' : 'fas fa-times-circle'}></i>
                <span className="level-manager__result-name">{r.name}</span>
                <span className="level-manager__result-msg">{r.message}</span>
              </div>
            ))}
          </div>
          <button className="button secondary sm no-flex" onClick={() => setCommitResults([])}>
            <i className="fas fa-times"></i> Clear Results
          </button>
        </div>
      )}

      {/* Trainer Tab Content */}
      {activeTab === 'trainer' && (
        <div className="level-manager__entries">
          {trainerEntries.map((entry) => (
            <TrainerLevelCard
              key={entry.key}
              entry={entry}
              trainers={trainers}
              onUpdate={(updates) => updateTrainerEntry(entry.key, updates)}
              onRemove={() => removeTrainerEntry(entry.key)}
              canRemove={trainerEntries.length > 1}
            />
          ))}

          <button className="button secondary no-flex" onClick={addTrainerEntry}>
            <i className="fas fa-plus"></i> Add Entry
          </button>
        </div>
      )}

      {/* Monster Tab Content */}
      {activeTab === 'monster' && (
        <div className="level-manager__entries">
          {monsterEntries.map((entry) => (
            <MonsterLevelCard
              key={entry.key}
              entry={entry}
              trainers={trainers}
              monsters={entry.trainerId != null ? (monstersByTrainer[entry.trainerId] ?? []) : []}
              monstersLoading={monsterLoadingFor === entry.trainerId}
              onUpdate={(updates) => updateMonsterEntry(entry.key, updates)}
              onTrainerSelect={(id) => handleMonsterTrainerSelect(entry.key, id)}
              onRemove={() => removeMonsterEntry(entry.key)}
              canRemove={monsterEntries.length > 1}
            />
          ))}

          <button className="button secondary no-flex" onClick={addMonsterEntry}>
            <i className="fas fa-plus"></i> Add Entry
          </button>
        </div>
      )}

      {/* Commit Action */}
      <div className="level-manager__commit">
        <ActionButtonGroup align="start" gap="sm">
          <button
            className="button primary no-flex"
            onClick={handleCommit}
            disabled={!canCommit || committing}
          >
            {committing
              ? <><i className="fas fa-spinner fa-spin"></i> Committing...</>
              : <><i className="fas fa-check"></i> Commit {activeTab === 'trainer' ? validTrainerEntries.length : validMonsterEntries.length} Level(s)</>
            }
          </button>
          {activeTab === 'trainer' && validTrainerEntries.length > 0 && (
            <span className="text-muted">
              {validTrainerEntries.reduce((sum, e) => sum + e.levels, 0)} total levels,{' '}
              {validTrainerEntries.filter(e => e.giveCoins).reduce((sum, e) => sum + e.levels * 50, 0)} coins
            </span>
          )}
          {activeTab === 'monster' && validMonsterEntries.length > 0 && (
            <span className="text-muted">
              {validMonsterEntries.reduce((sum, e) => sum + e.levels, 0)} total levels across{' '}
              {validMonsterEntries.length} monster(s)
            </span>
          )}
        </ActionButtonGroup>
      </div>

      <ConfirmModal {...commitConfirm.modalProps} />
    </div>
  );
}

// ── Trainer Level Card ──────────────────────────────────────────────

interface TrainerLevelCardProps {
  entry: TrainerLevelEntry;
  trainers: Trainer[];
  onUpdate: (updates: Partial<TrainerLevelEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function TrainerLevelCard({ entry, trainers, onUpdate, onRemove, canRemove }: TrainerLevelCardProps) {
  const handleTrainerSelect = useCallback((id: string | number | null) => {
    const numId = id != null ? Number(id) : null;
    const trainer = numId != null ? trainers.find(t => t.id === numId) : null;
    onUpdate({ trainerId: numId, trainerName: trainer?.name ?? '' });
  }, [trainers, onUpdate]);

  return (
    <div className="level-manager__card">
      <div className="level-manager__card-fields">
        <div className="level-manager__card-trainer">
          <TrainerAutocomplete
            trainers={trainers}
            selectedTrainerId={entry.trainerId}
            onSelect={handleTrainerSelect}
            label="Trainer"
            placeholder="Search trainers..."
            required
          />
        </div>

        <div className="level-manager__card-levels">
          <FormInput
            name={`levels-${entry.key}`}
            label="Levels"
            type="number"
            value={entry.levels}
            onChange={(e) => onUpdate({ levels: Math.max(0, parseInt(e.target.value) || 0) })}
            min={0}
            max={100}
            required
          />
        </div>

        <div className="level-manager__card-toggle">
          <FormCheckbox
            name={`coins-${entry.key}`}
            label="Grant coins"
            checked={entry.giveCoins}
            onChange={(e) => onUpdate({ giveCoins: (e.target as HTMLInputElement).checked })}
            helpText={entry.giveCoins ? `+${entry.levels * 50} coins` : 'No coins'}
          />
        </div>
      </div>

      {canRemove && (
        <button
          className="button danger icon sm level-manager__card-remove"
          onClick={onRemove}
          title="Remove entry"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}
    </div>
  );
}

// ── Monster Level Card ──────────────────────────────────────────────

interface MonsterLevelCardProps {
  entry: MonsterLevelEntry;
  trainers: Trainer[];
  monsters: Monster[];
  monstersLoading: boolean;
  onUpdate: (updates: Partial<MonsterLevelEntry>) => void;
  onTrainerSelect: (id: string | number | null) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function MonsterLevelCard({
  entry,
  trainers,
  monsters,
  monstersLoading,
  onUpdate,
  onTrainerSelect,
  onRemove,
  canRemove,
}: MonsterLevelCardProps) {
  const handleMonsterSelect = useCallback((id: string | number | null) => {
    const numId = id != null ? Number(id) : null;
    const monster = numId != null ? monsters.find(m => m.id === numId) : null;
    onUpdate({ monsterId: numId, monsterName: monster?.name ?? '' });
  }, [monsters, onUpdate]);

  return (
    <div className="level-manager__card">
      <div className="level-manager__card-fields level-manager__card-fields--monster">
        <div className="level-manager__card-trainer">
          <TrainerAutocomplete
            trainers={trainers}
            selectedTrainerId={entry.trainerId}
            onSelect={onTrainerSelect}
            label="Trainer"
            placeholder="Select trainer first..."
            required
          />
        </div>

        <div className="level-manager__card-monster">
          {monstersLoading ? (
            <div className="form-group">
              <label className="form-label">Monster</label>
              <div className="level-manager__loading-monsters">
                <i className="fas fa-spinner fa-spin"></i> Loading monsters...
              </div>
            </div>
          ) : (
            <MonsterAutocomplete
              monsters={monsters}
              selectedMonsterId={entry.monsterId}
              onSelect={handleMonsterSelect}
              label="Monster"
              placeholder={entry.trainerId ? 'Search monsters...' : 'Select a trainer first'}
              required
              disabled={!entry.trainerId}
            />
          )}
        </div>

        <div className="level-manager__card-levels">
          <FormInput
            name={`levels-${entry.key}`}
            label="Levels"
            type="number"
            value={entry.levels}
            onChange={(e) => onUpdate({ levels: Math.max(0, parseInt(e.target.value) || 0) })}
            min={0}
            max={100}
            required
          />
        </div>

        <div className="level-manager__card-toggle">
          <FormCheckbox
            name={`coins-${entry.key}`}
            label="Grant trainer coins"
            checked={entry.giveCoins}
            onChange={(e) => onUpdate({ giveCoins: (e.target as HTMLInputElement).checked })}
            helpText={entry.giveCoins ? `+${entry.levels * 50} coins to trainer` : 'No coins'}
          />
        </div>
      </div>

      {canRemove && (
        <button
          className="button danger icon sm level-manager__card-remove"
          onClick={onRemove}
          title="Remove entry"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}
    </div>
  );
}

// ── Page Export ──────────────────────────────────────────────────────

export default function LevelManagerPage() {
  return (
    <AdminRoute>
      <LevelManagerContent />
    </AdminRoute>
  );
}
