import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { TabContainer, type Tab } from '@components/common/TabContainer';
import { Modal } from '@components/common/Modal';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import { FormInput } from '@components/common/FormInput';
import { FormTextArea } from '@components/common/FormTextArea';
import { FormCheckbox } from '@components/common/FormCheckbox';
import { FormSelect } from '@components/common/FormSelect';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { TypeBadge } from '@components/common/TypeBadge';
import trainerService, { type TrainerMonster } from '@services/trainerService';
import monsterService from '@services/monsterService';
import battleService, {
  type BattleTeam,
  type BattleTeamWithTrainer,
  type Gym,
  type GymKind,
  type IncomingChallenge,
  type MyBattleSummary,
} from '@services/battleService';
import { BadgeCase } from '@components/trainers/detail/shared/BadgeCase';
import chatSocketService from '@services/chatSocketService';
import { extractErrorMessage } from '@utils/errorUtils';
import type { Trainer } from '@components/trainers/types/Trainer';
import { TeamPickModal } from './TeamPickModal';
import { MonsterPicker } from './MonsterPicker';
import { monsterCanBattle } from './battleMonsterUtils';

const handleMonImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = '/images/default_mon.png';
};

// ─────────────────────────────────────────────────────────────────────────────
// Team editor modal (create / edit a saved battle team)
// ─────────────────────────────────────────────────────────────────────────────

interface TeamEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainers: Trainer[];
  editingTeam: BattleTeam | null;
  /** Trainer chosen in the battle hub — pre-selected when creating a new team. */
  initialTrainerId?: number | null;
  onSaved: () => void;
}

function TeamEditorModal({ isOpen, onClose, trainers, editingTeam, initialTrainerId = null, onSaved }: TeamEditorModalProps) {
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [monsters, setMonsters] = useState<TrainerMonster[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingMonsters, setLoadingMonsters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingTeam) {
      setTrainerId(editingTeam.trainerId);
      setName(editingTeam.name);
      setDescription(editingTeam.description || '');
      setIsPublic(!!editingTeam.isPublic);
      setSelectedIds(editingTeam.monsterIds.slice(0, 6));
    } else {
      const preferred =
        initialTrainerId != null && trainers.some(t => t.id === initialTrainerId)
          ? initialTrainerId
          : trainers.length > 0
            ? trainers[0].id
            : null;
      setTrainerId(preferred);
      setName('');
      setDescription('');
      setIsPublic(false);
      setSelectedIds([]);
    }
  }, [isOpen, editingTeam, trainers, initialTrainerId]);

  useEffect(() => {
    if (!isOpen || trainerId == null) return;
    let cancelled = false;
    setLoadingMonsters(true);
    monsterService.getTrainerMonsters(trainerId)
      .then((res: { monsters?: TrainerMonster[] }) => { if (!cancelled) setMonsters(res.monsters || []); })
      .catch(() => { if (!cancelled) setMonsters([]); })
      .finally(() => { if (!cancelled) setLoadingMonsters(false); });
    return () => { cancelled = true; };
  }, [isOpen, trainerId]);

  const toggleMonster = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    if (trainerId == null) { setError('Select a trainer.'); return; }
    if (selectedIds.length < 1) { setError('Select 1-6 monsters.'); return; }
    try {
      setSaving(true);
      setError(null);
      if (editingTeam) {
        await battleService.updateTeam(editingTeam.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          monsterIds: selectedIds,
          isPublic,
        });
      } else {
        await battleService.createTeam({
          trainerId,
          name: name.trim(),
          description: description.trim() || undefined,
          monsterIds: selectedIds,
          isPublic,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save team.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTeam ? `Edit Team: ${editingTeam.name}` : 'Create Battle Team'}
      size="large"
      footer={
        <>
          <button className="button secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="button primary" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Team</>}
          </button>
        </>
      }
    >
      <div className="team-pick-modal">
        <div className="form-grid cols-2">
          <FormInput
            name="team-name"
            label="Team Name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
          />
          <FormSelect
            name="team-trainer"
            label="Trainer"
            value={trainerId != null ? String(trainerId) : ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setTrainerId(Number(e.target.value));
              setSelectedIds([]);
            }}
            options={trainers.map(t => ({ value: String(t.id), label: t.name }))}
            disabled={!!editingTeam}
          />
        </div>
        <FormTextArea
          name="team-description"
          label="Description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={2}
        />
        <FormCheckbox
          name="team-public"
          label="Public (other players can battle this team)"
          checked={isPublic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
        />

        <div className="team-pick-modal__counter">
          Selected: <strong>{selectedIds.length}</strong> / 6
        </div>
        {error && <div className="team-pick-modal__error">{error}</div>}

        {loadingMonsters ? (
          <div className="state-container sm">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading monsters...</p>
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

// ─────────────────────────────────────────────────────────────────────────────
// Battle hub page
// ─────────────────────────────────────────────────────────────────────────────

const BattlePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  useDocumentTitle('Battle');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);

  // My Teams
  const [teams, setTeams] = useState<BattleTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamEditorOpen, setTeamEditorOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<BattleTeam | null>(null);

  // Opponents
  const [opponents, setOpponents] = useState<BattleTeamWithTrainer[]>([]);
  const [opponentsLoading, setOpponentsLoading] = useState(true);

  // Gyms
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymsLoading, setGymsLoading] = useState(false);

  // PvP
  const [allTrainers, setAllTrainers] = useState<{ id: number; name: string }[]>([]);
  const [pvpOpponentId, setPvpOpponentId] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<IncomingChallenge[]>([]);

  // My battles
  const [myBattles, setMyBattles] = useState<MyBattleSummary[]>([]);
  const [myBattlesLoading, setMyBattlesLoading] = useState(true);

  // Team pick modal (shared for opponents / gyms / pvp / accept)
  const [pickTarget, setPickTarget] = useState<
    | { kind: 'opponent'; team: BattleTeamWithTrainer }
    | { kind: 'gym'; gym: Gym }
    | { kind: 'pvp'; opponentTrainerId: number; opponentName: string }
    | { kind: 'accept'; challenge: IncomingChallenge }
    | null
  >(null);
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmModal = useConfirmModal();

  const myTrainerIds = useMemo(() => new Set(trainers.map(t => t.id)), [trainers]);

  // Effective battle class (falls back to the legacy is_gym flag).
  const kindOf = useCallback(
    (g: Gym): GymKind => g.gymKind ?? (g.isGym === false ? 'ai' : 'gym'),
    [],
  );

  // Split authored battles by class: badge gyms, league, champion, plain AI.
  const badgeGyms = useMemo(() => gyms.filter(g => kindOf(g) === 'gym'), [gyms, kindOf]);
  const leagueBattles = useMemo(() => gyms.filter(g => kindOf(g) === 'league'), [gyms, kindOf]);
  const championBattles = useMemo(() => gyms.filter(g => kindOf(g) === 'champion'), [gyms, kindOf]);
  const aiBattles = useMemo(() => gyms.filter(g => kindOf(g) === 'ai'), [gyms, kindOf]);

  // ── Data loading ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    trainerService.getUserTrainers().then(res => {
      setTrainers(res.trainers);
      if (res.trainers.length > 0) setSelectedTrainerId(res.trainers[0].id);
    }).catch(() => setTrainers([]));

    trainerService.getAllTrainers().then(res => {
      setAllTrainers(res.trainers.map(t => ({ id: t.id, name: t.name })));
    }).catch(() => setAllTrainers([]));
  }, [isAuthenticated]);

  const loadTeams = useCallback(() => {
    if (selectedTrainerId == null) { setTeams([]); return; }
    setTeamsLoading(true);
    battleService.getTeams(selectedTrainerId)
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [selectedTrainerId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  useEffect(() => {
    battleService.getOpponentTeams()
      .then(setOpponents)
      .catch(() => setOpponents([]))
      .finally(() => setOpponentsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTrainerId == null) { setGyms([]); return; }
    setGymsLoading(true);
    battleService.getGyms(selectedTrainerId)
      .then(setGyms)
      .catch(() => setGyms([]))
      .finally(() => setGymsLoading(false));
  }, [selectedTrainerId]);

  const loadChallengesAndBattles = useCallback(() => {
    battleService.getIncomingChallenges().then(setChallenges).catch(() => setChallenges([]));
    battleService.getMyBattles()
      .then(setMyBattles)
      .catch(() => setMyBattles([]))
      .finally(() => setMyBattlesLoading(false));
  }, []);

  useEffect(() => {
    loadChallengesAndBattles();
    chatSocketService.connect();
    const onChallenge = () => loadChallengesAndBattles();
    chatSocketService.onBattleChallenge(onChallenge);
    return () => chatSocketService.offBattleChallenge(onChallenge);
  }, [loadChallengesAndBattles]);

  // ── Actions ───────────────────────────────────────────────────────

  const handlePickConfirm = async (selection: { trainerId: number; monsterIds: number[]; difficulty: 'easy' | 'medium' | 'hard' }) => {
    if (!pickTarget) return;
    try {
      setStarting(true);
      setActionError(null);
      let state;
      if (pickTarget.kind === 'opponent') {
        state = await battleService.startBattle({
          trainerId: selection.trainerId,
          monsterIds: selection.monsterIds,
          opponentTeamId: pickTarget.team.id,
          difficulty: selection.difficulty,
        });
      } else if (pickTarget.kind === 'gym') {
        state = await battleService.startGauntlet({
          trainerId: selection.trainerId,
          monsterIds: selection.monsterIds,
          gymId: pickTarget.gym.id,
        });
      } else if (pickTarget.kind === 'pvp') {
        state = await battleService.challengePvp({
          trainerId: selection.trainerId,
          monsterIds: selection.monsterIds,
          opponentTrainerId: pickTarget.opponentTrainerId,
        });
      } else {
        state = await battleService.acceptPvp(pickTarget.challenge.battleId, {
          trainerId: selection.trainerId,
          monsterIds: selection.monsterIds,
        });
      }
      setPickTarget(null);
      if (pickTarget.kind === 'pvp' && state.pending) {
        // Challenge sent — stay on hub
        loadChallengesAndBattles();
        setActionError(null);
      } else {
        navigate(`/adventures/battle/${state.battleId}`);
      }
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to start battle.'));
    } finally {
      setStarting(false);
    }
  };

  const handleDeleteTeam = (team: BattleTeam) => {
    confirmModal.confirmDanger(
      `Delete team "${team.name}"? This cannot be undone.`,
      async () => {
        try {
          await battleService.deleteTeam(team.id);
          loadTeams();
        } catch (err) {
          setActionError(extractErrorMessage(err, 'Failed to delete team.'));
        }
      },
      { title: 'Delete Team', confirmText: 'Delete' },
    );
  };

  const handleDecline = async (challenge: IncomingChallenge) => {
    try {
      await battleService.declinePvp(challenge.battleId);
      loadChallengesAndBattles();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to decline challenge.'));
    }
  };

  const badgeBattleActionLabel = (gym: Gym): string => {
    const kind = kindOf(gym);
    if (kind === 'champion') return gym.earned ? 'Rechallenge Champion' : 'Challenge Champion';
    if (kind === 'league') return gym.earned ? 'Rechallenge League' : 'Challenge League';
    return gym.earned ? 'Rechallenge Gauntlet' : 'Challenge Gauntlet';
  };

  // Card for a badge-awarding battle (gym / league / champion), with locked +
  // champion styling. League and champion battles never show a gauntlet line.
  const renderBadgeBattleCard = (gym: Gym) => {
    const kind = kindOf(gym);
    const isChampion = kind === 'champion';
    const isLeagueOrChampion = kind === 'league' || isChampion;
    const locked = !!gym.locked;
    return (
      <div
        key={gym.id}
        className={[
          'battle-gym-card',
          gym.earned ? 'earned' : '',
          locked ? 'battle-gym-card--locked' : '',
          isChampion ? 'battle-gym-card--champion' : '',
        ].filter(Boolean).join(' ')}
      >
        <div className="battle-gym-card__badge">
          {gym.badgeImgLink ? (
            <img src={gym.badgeImgLink} alt={gym.badgeName} />
          ) : (
            <span className="battle-badge-placeholder" title={gym.badgeName}>
              <i className={isChampion ? 'fas fa-crown' : 'fas fa-medal'}></i>
            </span>
          )}
          {gym.earned && <span className="battle-gym-card__earned-check"><i className="fas fa-check-circle"></i></span>}
          {locked && <span className="battle-gym-card__lock"><i className="fas fa-lock"></i></span>}
        </div>
        <div className="battle-gym-card__body">
          <div className="battle-gym-card__title">
            <h3>{gym.name}</h3>
            <TypeBadge type={gym.typeTheme} size="sm" />
          </div>
          <p className="battle-gym-card__leader">
            {gym.leaderImgLink && (
              <img src={gym.leaderImgLink} alt={gym.leaderName} onError={handleMonImgError} />
            )}
            {isChampion ? 'Champion' : 'Leader'}: <strong>{gym.leaderName}</strong>
          </p>
          {gym.description && <p className="battle-gym-card__description">{gym.description}</p>}
          {!isLeagueOrChampion && (
            <p className="battle-gym-card__gauntlet">
              <i className="fas fa-route"></i> {gym.gauntletTrainers.length} trainer{gym.gauntletTrainers.length === 1 ? '' : 's'} + leader
            </p>
          )}
          <p className="battle-gym-card__rewards">
            <span className="battle-reward-win"><i className="fas fa-coins"></i> +{gym.winReward}</span>
            <span className="battle-reward-loss"><i className="fas fa-coins"></i> -{gym.lossPenalty}</span>
          </p>
          {gym.earned ? (
            <span className="battle-gym-card__earned-label">
              <i className={isChampion ? 'fas fa-crown' : 'fas fa-medal'}></i> {gym.badgeName} earned!
            </span>
          ) : null}
          {locked && gym.lockReason ? (
            <div className="battle-gym-card__locked-note"><i className="fas fa-lock"></i> {gym.lockReason}</div>
          ) : null}
          <button
            className="button primary"
            disabled={locked}
            onClick={() => setPickTarget({ kind: 'gym', gym })}
          >
            <i className={isChampion ? 'fas fa-crown' : isLeagueOrChampion ? 'fas fa-award' : 'fas fa-dungeon'}></i> {badgeBattleActionLabel(gym)}
          </button>
        </div>
      </div>
    );
  };

  // ── Tab contents ──────────────────────────────────────────────────

  const teamsTab = (
    <div className="battle-hub__section">
      <div className="battle-hub__section-header">
        <FormSelect
          name="battle-trainer-select"
          label="Trainer"
          value={selectedTrainerId != null ? String(selectedTrainerId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTrainerId(Number(e.target.value))}
          options={trainers.map(t => ({ value: String(t.id), label: t.name }))}
        />
        <button
          className="button primary"
          onClick={() => { setEditingTeam(null); setTeamEditorOpen(true); }}
          disabled={trainers.length === 0}
        >
          <i className="fas fa-plus"></i> New Team
        </button>
      </div>

      {teamsLoading ? (
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading teams...</p></div>
      ) : teams.length === 0 ? (
        <div className="state-container">
          <i className="fas fa-users"></i>
          <p>No battle teams yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="battle-hub__grid">
          {teams.map(team => (
            <div key={team.id} className="battle-team-card">
              <div className="battle-team-card__header">
                <h3>{team.name}</h3>
                {team.isPublic ? (
                  <span className="battle-team-card__public"><i className="fas fa-globe"></i> Public</span>
                ) : (
                  <span className="battle-team-card__private"><i className="fas fa-lock"></i> Private</span>
                )}
              </div>
              {team.description && <p className="battle-team-card__description">{team.description}</p>}
              <p className="battle-team-card__count">
                <i className="fas fa-paw"></i> {team.monsterIds.length} monster{team.monsterIds.length === 1 ? '' : 's'}
              </p>
              <div className="battle-team-card__actions">
                <button className="button secondary sm" onClick={() => { setEditingTeam(team); setTeamEditorOpen(true); }}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className="button danger sm" onClick={() => handleDeleteTeam(team)}>
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTrainerId != null && <BadgeCase trainerId={selectedTrainerId} />}
    </div>
  );

  const opponentsTab = (
    <div className="battle-hub__section">
      {opponentsLoading ? (
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading opponents...</p></div>
      ) : opponents.length === 0 ? (
        <div className="state-container">
          <i className="fas fa-user-friends"></i>
          <p>No public teams to battle right now.</p>
        </div>
      ) : (
        <div className="battle-hub__grid">
          {opponents.map(team => (
            <div key={team.id} className="battle-opponent-card">
              <div className="battle-opponent-card__trainer">
                <img
                  src={team.trainerImage || '/images/default_mon.png'}
                  alt={team.trainerName}
                  onError={handleMonImgError}
                />
                <div>
                  <h3>{team.name}</h3>
                  <span className="battle-opponent-card__trainer-name">{team.trainerName}</span>
                </div>
              </div>
              {team.description && <p className="battle-opponent-card__description">{team.description}</p>}
              <p className="battle-team-card__count">
                <i className="fas fa-paw"></i> {team.monsterIds.length} monster{team.monsterIds.length === 1 ? '' : 's'}
              </p>
              <button
                className="button primary"
                onClick={() => setPickTarget({ kind: 'opponent', team })}
                disabled={myTrainerIds.has(team.trainerId)}
              >
                <i className="fas fa-bolt"></i> Battle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const gymsTab = (
    <div className="battle-hub__section">
      <div className="battle-hub__section-header">
        <FormSelect
          name="battle-gym-trainer-select"
          label="Trainer"
          value={selectedTrainerId != null ? String(selectedTrainerId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTrainerId(Number(e.target.value))}
          options={trainers.map(t => ({ value: String(t.id), label: t.name }))}
        />
      </div>
      {gymsLoading ? (
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading gyms...</p></div>
      ) : badgeGyms.length === 0 && leagueBattles.length === 0 && championBattles.length === 0 ? (
        <div className="state-container"><i className="fas fa-dungeon"></i><p>No gyms available.</p></div>
      ) : (
        <>
          <div className="battle-hub__subsection">
            <h3 className="battle-hub__subheading"><i className="fas fa-dungeon"></i> Gym Battles</h3>
            {badgeGyms.length === 0 ? (
              <div className="state-container sm"><i className="fas fa-dungeon"></i><p>No gyms available.</p></div>
            ) : (
              <div className="battle-hub__grid battle-hub__grid--gyms">
                {badgeGyms.map(renderBadgeBattleCard)}
              </div>
            )}
          </div>

          {leagueBattles.length > 0 && (
            <div className="battle-hub__subsection">
              <h3 className="battle-hub__subheading battle-hub__subheading--league"><i className="fas fa-award"></i> League Battles</h3>
              <p className="battle-hub__subhint">Unlocked once you hold every gym badge. No gauntlets — a single elite battle each.</p>
              <div className="battle-hub__grid battle-hub__grid--gyms">
                {leagueBattles.map(renderBadgeBattleCard)}
              </div>
            </div>
          )}

          {championBattles.length > 0 && (
            <div className="battle-hub__subsection">
              <h3 className="battle-hub__subheading battle-hub__subheading--champion"><i className="fas fa-crown"></i> Champion</h3>
              <p className="battle-hub__subhint">The final challenge. Unlocked once you hold every gym badge and all four league badges.</p>
              <div className="battle-hub__grid battle-hub__grid--gyms">
                {championBattles.map(renderBadgeBattleCard)}
              </div>
            </div>
          )}
        </>
      )}

      {selectedTrainerId != null && <BadgeCase trainerId={selectedTrainerId} />}
    </div>
  );

  const aiBattlesTab = (
    <div className="battle-hub__section">
      <div className="battle-hub__section-header">
        <FormSelect
          name="battle-ai-trainer-select"
          label="Trainer"
          value={selectedTrainerId != null ? String(selectedTrainerId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTrainerId(Number(e.target.value))}
          options={trainers.map(t => ({ value: String(t.id), label: t.name }))}
        />
      </div>
      {gymsLoading ? (
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading battles...</p></div>
      ) : aiBattles.length === 0 ? (
        <div className="state-container"><i className="fas fa-robot"></i><p>No AI battles available right now.</p></div>
      ) : (
        <div className="battle-hub__grid battle-hub__grid--gyms">
          {aiBattles.map(gym => {
            const isOneOff = gym.gauntletTrainers.length === 0;
            return (
              <div key={gym.id} className="battle-gym-card battle-gym-card--ai">
                <div className="battle-gym-card__badge">
                  {gym.leaderImgLink ? (
                    <img src={gym.leaderImgLink} alt={gym.leaderName} onError={handleMonImgError} />
                  ) : (
                    <span className="battle-badge-placeholder" title={gym.leaderName}>
                      <i className="fas fa-robot"></i>
                    </span>
                  )}
                </div>
                <div className="battle-gym-card__body">
                  <div className="battle-gym-card__title">
                    <h3>{gym.name}</h3>
                    {gym.typeTheme && <TypeBadge type={gym.typeTheme} size="sm" />}
                  </div>
                  <p className="battle-gym-card__leader">
                    Opponent: <strong>{gym.leaderName}</strong>
                  </p>
                  {gym.description && <p className="battle-gym-card__description">{gym.description}</p>}
                  <p className="battle-gym-card__gauntlet">
                    {isOneOff ? (
                      <><i className="fas fa-bolt"></i> Single battle</>
                    ) : (
                      <><i className="fas fa-route"></i> Gauntlet — {gym.gauntletTrainers.length} trainer{gym.gauntletTrainers.length === 1 ? '' : 's'} + boss</>
                    )}
                  </p>
                  <p className="battle-gym-card__rewards">
                    <span className="battle-reward-win"><i className="fas fa-coins"></i> +{gym.winReward}</span>
                    <span className="battle-reward-loss"><i className="fas fa-coins"></i> -{gym.lossPenalty}</span>
                  </p>
                  <button className="button primary" onClick={() => setPickTarget({ kind: 'gym', gym })}>
                    <i className={isOneOff ? 'fas fa-bolt' : 'fas fa-route'}></i> {isOneOff ? 'Start Battle' : 'Start Gauntlet'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const pvpTab = (
    <div className="battle-hub__section">
      <div className="battle-pvp-challenge">
        <h3><i className="fas fa-crosshairs"></i> Challenge a Trainer</h3>
        <div className="battle-pvp-challenge__row">
          <TrainerAutocomplete
            name="pvp-opponent"
            label="Opponent Trainer"
            trainers={allTrainers.filter(t => !myTrainerIds.has(t.id))}
            selectedTrainerId={pvpOpponentId}
            onSelect={(id) => setPvpOpponentId(id != null ? Number(id) : null)}
            placeholder="Type to search trainers..."
          />
          <button
            className="button primary"
            disabled={pvpOpponentId == null}
            onClick={() => {
              const opp = allTrainers.find(t => t.id === pvpOpponentId);
              if (opp) setPickTarget({ kind: 'pvp', opponentTrainerId: opp.id, opponentName: opp.name });
            }}
          >
            <i className="fas fa-bolt"></i> Challenge
          </button>
        </div>
      </div>

      <h3 className="battle-hub__subheading"><i className="fas fa-envelope"></i> Incoming Challenges</h3>
      {challenges.length === 0 ? (
        <div className="state-container sm"><i className="fas fa-inbox"></i><p>No incoming challenges.</p></div>
      ) : (
        <div className="battle-challenge-list">
          {challenges.map(c => (
            <div key={c.battleId} className="battle-challenge-item">
              <div>
                <strong>{c.challengerName}</strong> challenged you!
                <span className="battle-challenge-item__date">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div className="battle-challenge-item__actions">
                <button className="button primary sm" onClick={() => setPickTarget({ kind: 'accept', challenge: c })}>
                  <i className="fas fa-check"></i> Accept
                </button>
                <button className="button danger sm" onClick={() => handleDecline(c)}>
                  <i className="fas fa-times"></i> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const myBattlesTab = (
    <div className="battle-hub__section">
      {myBattlesLoading ? (
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading battles...</p></div>
      ) : myBattles.length === 0 ? (
        <div className="state-container"><i className="fas fa-flag-checkered"></i><p>No active battles.</p></div>
      ) : (
        <div className="battle-challenge-list">
          {myBattles.map(b => (
            <div key={b.battleId} className="battle-challenge-item">
              <div>
                <span className={`battle-mode-chip battle-mode-chip--${b.mode}`}>{b.mode}</span>
                <strong> vs {b.opponentLabel}</strong>
                {b.pending && <span className="battle-pending-chip">Awaiting opponent</span>}
                {!b.pending && b.isYourTurn && <span className="battle-turn-chip">Your turn!</span>}
                <span className="battle-challenge-item__date">{new Date(b.createdAt).toLocaleString()}</span>
              </div>
              <button className="button primary sm" onClick={() => navigate(`/adventures/battle/${b.battleId}`)}>
                <i className="fas fa-play"></i> Continue
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const tabs: Tab[] = [
    { key: 'teams', label: 'My Teams', icon: 'fas fa-users', content: teamsTab },
    { key: 'opponents', label: 'Opponents', icon: 'fas fa-user-friends', content: opponentsTab },
    { key: 'gyms', label: 'Gyms', icon: 'fas fa-dungeon', content: gymsTab },
    { key: 'ai-battles', label: 'AI Battles', icon: 'fas fa-robot', content: aiBattlesTab },
    { key: 'pvp', label: 'PvP', icon: 'fas fa-crosshairs', content: pvpTab, badge: challenges.length || undefined },
    { key: 'mine', label: 'My Battles', icon: 'fas fa-flag-checkered', content: myBattlesTab },
  ];

  const pickTitle = pickTarget?.kind === 'gym'
    ? `Challenge ${pickTarget.gym.name}`
    : pickTarget?.kind === 'opponent'
      ? `Battle ${pickTarget.team.trainerName}'s "${pickTarget.team.name}"`
      : pickTarget?.kind === 'pvp'
        ? `Challenge ${pickTarget.opponentName}`
        : pickTarget?.kind === 'accept'
          ? `Accept ${pickTarget.challenge.challengerName}'s Challenge`
          : '';

  return (
    <div className="battle-page">
      <div className="battle-page__header">
        <h1><i className="fas fa-bolt"></i> Battle</h1>
        <p>Build teams, take on gyms, and battle other trainers!</p>
      </div>

      {actionError && (
        <div className="battle-page__error">
          <i className="fas fa-exclamation-triangle"></i> {actionError}
          <button className="button ghost sm" onClick={() => setActionError(null)}><i className="fas fa-times"></i></button>
        </div>
      )}

      <TabContainer tabs={tabs} defaultTab="teams" variant="pills" keepMounted />

      <TeamEditorModal
        isOpen={teamEditorOpen}
        onClose={() => setTeamEditorOpen(false)}
        trainers={trainers}
        editingTeam={editingTeam}
        initialTrainerId={selectedTrainerId}
        onSaved={loadTeams}
      />

      <TeamPickModal
        isOpen={pickTarget != null}
        onClose={() => setPickTarget(null)}
        title={pickTitle}
        trainers={trainers}
        initialTrainerId={selectedTrainerId}
        showDifficulty={pickTarget?.kind === 'opponent'}
        confirmLabel={pickTarget?.kind === 'pvp' ? 'Send Challenge' : pickTarget?.kind === 'accept' ? 'Accept & Battle' : 'Start Battle'}
        submitting={starting}
        onConfirm={handlePickConfirm}
      />

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
};

export default BattlePage;
