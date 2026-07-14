import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@components/common/Modal';
import { FormSelect } from '@components/common/FormSelect';
import { type TrainerMonster } from '@services/trainerService';
import monsterService from '@services/monsterService';
import battleService, { type BattleTeam, type BattleDifficulty } from '@services/battleService';
import type { Trainer } from '@components/trainers/types/Trainer';
import { MonsterPicker } from './MonsterPicker';
import { monsterCanBattle } from './battleMonsterUtils';

interface TeamPickModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  trainers: Trainer[];
  /** Trainer chosen in the battle hub — pre-selected when the modal opens. */
  initialTrainerId?: number | null;
  showDifficulty?: boolean;
  confirmLabel?: string;
  submitting?: boolean;
  onConfirm: (selection: {
    trainerId: number;
    monsterIds: number[];
    difficulty: BattleDifficulty;
  }) => void;
}

/**
 * Shared modal for picking a trainer + up to 6 monsters (optionally from a
 * saved battle team) before starting any kind of battle.
 */
export function TeamPickModal({
  isOpen,
  onClose,
  title,
  trainers,
  initialTrainerId = null,
  showDifficulty = false,
  confirmLabel = 'Start Battle',
  submitting = false,
  onConfirm,
}: TeamPickModalProps) {
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [monsters, setMonsters] = useState<TrainerMonster[]>([]);
  const [teams, setTeams] = useState<BattleTeam[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<BattleDifficulty>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when opened — pre-select the trainer chosen in the battle hub.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setError(null);
    const preferred =
      initialTrainerId != null && trainers.some(t => t.id === initialTrainerId)
        ? initialTrainerId
        : trainers.length > 0
          ? trainers[0].id
          : null;
    setTrainerId(preferred);
  }, [isOpen, initialTrainerId, trainers]);

  // Load monsters + saved teams for the selected trainer
  useEffect(() => {
    if (!isOpen || trainerId == null) return;
    let cancelled = false;
    setLoading(true);
    setSelectedIds([]);
    Promise.all([
      monsterService.getTrainerMonsters(trainerId).catch(() => ({ monsters: [] })),
      battleService.getTeams(trainerId).catch(() => []),
    ]).then(([monsterRes, teamList]) => {
      if (cancelled) return;
      setMonsters((monsterRes as { monsters?: TrainerMonster[] }).monsters || []);
      setTeams(teamList);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, trainerId]);

  const toggleMonster = useCallback((id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  }, []);

  const applyTeam = useCallback((teamId: string) => {
    if (!teamId) return;
    const team = teams.find(t => t.id === Number(teamId));
    if (!team) return;
    // Only pull in monsters that are actually battle-eligible.
    const eligible = new Set(monsters.filter(monsterCanBattle).map(m => m.id));
    setSelectedIds(team.monsterIds.filter(id => eligible.has(id)).slice(0, 6));
  }, [teams, monsters]);

  const handleConfirm = () => {
    if (trainerId == null) {
      setError('Please select a trainer.');
      return;
    }
    if (selectedIds.length < 1) {
      setError('Select at least one monster.');
      return;
    }
    setError(null);
    onConfirm({ trainerId, monsterIds: selectedIds, difficulty });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      footer={
        <>
          <button className="button secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="button primary"
            onClick={handleConfirm}
            disabled={submitting || selectedIds.length === 0}
          >
            {submitting ? (
              <><i className="fas fa-spinner fa-spin"></i> Starting...</>
            ) : (
              <><i className="fas fa-bolt"></i> {confirmLabel}</>
            )}
          </button>
        </>
      }
    >
      <div className="team-pick-modal">
        <div className="form-grid cols-2">
          <FormSelect
            name="team-pick-trainer"
            label="Trainer"
            value={trainerId != null ? String(trainerId) : ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTrainerId(Number(e.target.value))}
            options={trainers.map(t => ({ value: String(t.id), label: t.name }))}
          />
          {teams.length > 0 && (
            <FormSelect
              name="team-pick-saved"
              label="Use Saved Team"
              value=""
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyTeam(e.target.value)}
              options={[
                { value: '', label: '-- Pick monsters manually --' },
                ...teams.map(t => ({ value: String(t.id), label: `${t.name} (${t.monsterIds.length})` })),
              ]}
            />
          )}
          {showDifficulty && (
            <FormSelect
              name="team-pick-difficulty"
              label="Difficulty"
              value={difficulty}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value as BattleDifficulty)}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          )}
        </div>

        <div className="team-pick-modal__counter">
          Selected: <strong>{selectedIds.length}</strong> / 6
        </div>

        {error && <div className="team-pick-modal__error">{error}</div>}

        {loading ? (
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
            key={trainerId ?? 'none'}
            monsters={monsters}
            selectedIds={selectedIds}
            onToggle={toggleMonster}
            isEligible={monsterCanBattle}
          />
        )}
      </div>
    </Modal>
  );
}
