import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '@components/common/Modal';
import { FormSelect } from '@components/common/FormSelect';
import { type TrainerMonster } from '@services/trainerService';
import monsterService from '@services/monsterService';
import battleService, {
  type BattleTeam,
  type BattleDifficulty,
  type MockSideControl,
  type StartMockBattleInput,
} from '@services/battleService';
import type { Trainer } from '@components/trainers/types/Trainer';
import { MonsterPicker } from './MonsterPicker';
import { monsterCanBattle } from './battleMonsterUtils';

// ─────────────────────────────────────────────────────────────────────────────
// One side of the mock battle: trainer + control + team selection.
// ─────────────────────────────────────────────────────────────────────────────

interface MockSideState {
  trainerId: number | null;
  control: MockSideControl;
  selectedIds: number[];
}

interface MockSidePanelProps {
  sideLabel: string;
  accent: 'players' | 'opponents';
  trainers: Trainer[];
  /** Trainer chosen on the other side — excluded so the two never collide. */
  excludeTrainerId: number | null;
  state: MockSideState;
  onChange: (patch: Partial<MockSideState>) => void;
}

/**
 * A self-contained picker for one mock-battle side. Loads the chosen trainer's
 * monsters and saved teams, and lets the user set who controls the side.
 */
function MockSidePanel({
  sideLabel,
  accent,
  trainers,
  excludeTrainerId,
  state,
  onChange,
}: MockSidePanelProps) {
  const [monsters, setMonsters] = useState<TrainerMonster[]>([]);
  const [teams, setTeams] = useState<BattleTeam[]>([]);
  const [loading, setLoading] = useState(false);

  const availableTrainers = useMemo(
    () => trainers.filter(t => t.id !== excludeTrainerId),
    [trainers, excludeTrainerId],
  );

  useEffect(() => {
    if (state.trainerId == null) {
      setMonsters([]);
      setTeams([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      monsterService.getTrainerMonsters(state.trainerId).catch(() => ({ monsters: [] })),
      battleService.getTeams(state.trainerId).catch(() => []),
    ]).then(([monsterRes, teamList]) => {
      if (cancelled) return;
      setMonsters((monsterRes as { monsters?: TrainerMonster[] }).monsters || []);
      setTeams(teamList);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [state.trainerId]);

  const toggleMonster = useCallback((id: number) => {
    const prev = state.selectedIds;
    if (prev.includes(id)) {
      onChange({ selectedIds: prev.filter(m => m !== id) });
    } else if (prev.length < 6) {
      onChange({ selectedIds: [...prev, id] });
    }
  }, [state.selectedIds, onChange]);

  const applyTeam = useCallback((teamId: string) => {
    if (!teamId) return;
    const team = teams.find(t => t.id === Number(teamId));
    if (!team) return;
    const eligible = new Set(monsters.filter(monsterCanBattle).map(m => m.id));
    onChange({ selectedIds: team.monsterIds.filter(id => eligible.has(id)).slice(0, 6) });
  }, [teams, monsters, onChange]);

  return (
    <div className={`mock-side mock-side--${accent}`}>
      <h3 className="mock-side__heading">{sideLabel}</h3>

      <FormSelect
        name={`mock-${accent}-trainer`}
        label="Trainer"
        value={state.trainerId != null ? String(state.trainerId) : ''}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange({ trainerId: e.target.value ? Number(e.target.value) : null, selectedIds: [] })
        }
        options={[
          { value: '', label: '-- Select a trainer --' },
          ...availableTrainers.map(t => ({ value: String(t.id), label: t.name })),
        ]}
      />

      <div className="mock-side__control">
        <span className="mock-side__control-label">Controlled by</span>
        <div className="mock-side__control-toggle">
          <button
            type="button"
            className={`button sm ${state.control === 'user' ? 'primary' : 'secondary'}`}
            onClick={() => onChange({ control: 'user' })}
          >
            <i className="fas fa-user"></i> You
          </button>
          <button
            type="button"
            className={`button sm ${state.control === 'ai' ? 'primary' : 'secondary'}`}
            onClick={() => onChange({ control: 'ai' })}
          >
            <i className="fas fa-robot"></i> AI
          </button>
        </div>
      </div>

      {teams.length > 0 && (
        <FormSelect
          name={`mock-${accent}-team`}
          label="Use Saved Team"
          value=""
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyTeam(e.target.value)}
          options={[
            { value: '', label: '-- Pick monsters manually --' },
            ...teams.map(t => ({ value: String(t.id), label: `${t.name} (${t.monsterIds.length})` })),
          ]}
        />
      )}

      <div className="mock-side__counter">
        Selected: <strong>{state.selectedIds.length}</strong> / 6
      </div>

      {state.trainerId == null ? (
        <div className="state-container sm">
          <i className="fas fa-user-slash"></i>
          <p>Pick a trainer to choose their team.</p>
        </div>
      ) : loading ? (
        <div className="state-container sm">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading monsters...</p>
        </div>
      ) : monsters.length === 0 ? (
        <div className="state-container sm">
          <i className="fas fa-paw"></i>
          <p>This trainer has no monsters.</p>
        </div>
      ) : (
        <MonsterPicker
          key={state.trainerId}
          monsters={monsters}
          selectedIds={state.selectedIds}
          onToggle={toggleMonster}
          isEligible={monsterCanBattle}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock battle setup modal
// ─────────────────────────────────────────────────────────────────────────────

interface MockBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainers: Trainer[];
  initialTrainerId?: number | null;
  submitting?: boolean;
  onConfirm: (input: StartMockBattleInput) => void;
}

const emptySide = (control: MockSideControl): MockSideState => ({
  trainerId: null,
  control,
  selectedIds: [],
});

/**
 * Setup for a mock battle: pair two of your own trainers, choose each side's
 * team, and decide who controls each side (you or the AI). Nothing is at stake.
 */
export function MockBattleModal({
  isOpen,
  onClose,
  trainers,
  initialTrainerId = null,
  submitting = false,
  onConfirm,
}: MockBattleModalProps) {
  const [sideA, setSideA] = useState<MockSideState>(() => emptySide('user'));
  const [sideB, setSideB] = useState<MockSideState>(() => emptySide('ai'));
  const [difficulty, setDifficulty] = useState<BattleDifficulty>('medium');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDifficulty('medium');
    const preferred =
      initialTrainerId != null && trainers.some(t => t.id === initialTrainerId)
        ? initialTrainerId
        : trainers.length > 0
          ? trainers[0].id
          : null;
    setSideA({ trainerId: preferred, control: 'user', selectedIds: [] });
    setSideB({ trainerId: null, control: 'ai', selectedIds: [] });
  }, [isOpen, initialTrainerId, trainers]);

  const patchA = useCallback((patch: Partial<MockSideState>) => setSideA(s => ({ ...s, ...patch })), []);
  const patchB = useCallback((patch: Partial<MockSideState>) => setSideB(s => ({ ...s, ...patch })), []);

  const anyAiSide = sideA.control === 'ai' || sideB.control === 'ai';

  const handleConfirm = () => {
    if (sideA.trainerId == null || sideB.trainerId == null) {
      setError('Pick a trainer for each side.');
      return;
    }
    if (sideA.trainerId === sideB.trainerId) {
      setError('The two sides must be different trainers.');
      return;
    }
    if (sideA.selectedIds.length < 1 || sideB.selectedIds.length < 1) {
      setError('Each side needs at least one monster.');
      return;
    }
    setError(null);
    onConfirm({
      playersTrainerId: sideA.trainerId,
      playersMonsterIds: sideA.selectedIds,
      opponentsTrainerId: sideB.trainerId,
      opponentsMonsterIds: sideB.selectedIds,
      playersControl: sideA.control,
      opponentsControl: sideB.control,
      difficulty,
    });
  };

  const canStart = sideA.trainerId != null && sideB.trainerId != null
    && sideA.selectedIds.length > 0 && sideB.selectedIds.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mock Battle"
      size="xlarge"
      footer={
        <>
          <button className="button secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="button primary"
            onClick={handleConfirm}
            disabled={submitting || !canStart}
          >
            {submitting ? (
              <><i className="fas fa-spinner fa-spin"></i> Starting...</>
            ) : (
              <><i className="fas fa-masks-theater"></i> Start Mock Battle</>
            )}
          </button>
        </>
      }
    >
      <div className="mock-battle-modal">
        <p className="mock-battle-modal__hint">
          <i className="fas fa-info-circle"></i> Pair two of your own trainers. Choose who
          controls each side — anyone set to <strong>AI</strong> plays automatically. No levels
          or currency are earned in a mock battle.
        </p>

        {anyAiSide && (
          <FormSelect
            name="mock-difficulty"
            label="AI Difficulty"
            value={difficulty}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value as BattleDifficulty)}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
        )}

        {error && <div className="team-pick-modal__error">{error}</div>}

        <div className="mock-battle-modal__sides">
          <MockSidePanel
            sideLabel="Side A"
            accent="players"
            trainers={trainers}
            excludeTrainerId={sideB.trainerId}
            state={sideA}
            onChange={patchA}
          />
          <div className="mock-battle-modal__vs"><span>VS</span></div>
          <MockSidePanel
            sideLabel="Side B"
            accent="opponents"
            trainers={trainers}
            excludeTrainerId={sideA.trainerId}
            state={sideB}
            onChange={patchB}
          />
        </div>
      </div>
    </Modal>
  );
}
