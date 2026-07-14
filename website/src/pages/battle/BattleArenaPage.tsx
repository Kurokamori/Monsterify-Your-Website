import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { TypeBadge } from '@components/common/TypeBadge';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import battleService, {
  type WebBattleStateView,
  type BattleMonster,
  type BattleMove,
} from '@services/battleService';
import chatSocketService from '@services/chatSocketService';
import { extractErrorMessage } from '@utils/errorUtils';
import { pixelatedClass } from '@utils/battleAssetStyles';
import { handleMonImgError } from './battleMonsterUtils';
import { useBattleFx, type BattleSide } from './useBattleFx';
import { MonsterInfoCard } from './components/MonsterInfoCard';
import { BenchMonsterButton } from './components/BenchMonsterButton';
import { TrainerPortrait } from './components/TrainerPortrait';
import { DialogueBox } from './components/DialogueBox';
import { BattleFxLayer } from './components/BattleFxLayer';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send-in choreography, per side. The trainer slides in (0.45s in CSS) to an empty
 * field, then throws: the monster appears while the trainer is still there, and the
 * trainer leaves under it. The reveal deliberately lands before the exit starts, so
 * the two overlap instead of cutting.
 */
const MONSTER_REVEAL_MS = 650;
const TRAINER_EXIT_MS = 950;
/**
 * When dialogue held the trainer on screen, they don't vanish the instant it is
 * dismissed — they stay for this long while the monster comes out under them.
 */
const TRAINER_LINGER_MS = 450;

type TrainerSlot = 'you' | 'foe';
type SlotFlags = Record<TrainerSlot, boolean>;

/**
 * Clean a battle log message for web display: strip markdown-ish ** emphasis
 * and remove emojis (the web arena has real sprites/HP bars, so the emoji
 * decorations baked into the shared backend log strings are just noise).
 */
const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]/gu;
// Variation selector (FE0F), zero-width joiner (200D), keycap combiner (20E3).
// Alternation of escapes (not a character class, not literals) so the combining
// marks don't trip the no-misleading-character-class lint rule.
const EMOJI_JOINERS_RE = new RegExp('\\uFE0F|\\u200D|\\u20E3', 'g');

function cleanLogMessage(message: string): string {
  return message
    .replace(/\*\*/g, '')
    .replace(EMOJI_RE, '')
    .replace(EMOJI_JOINERS_RE, '')
    // Strip sprite/image URLs — Discord renders these as inline images, but the
    // web arena already shows the sprites visually, so they're just noise here.
    .replace(/https?:\/\/\S+/gi, '')
    // Collapse the whitespace the removed emojis/links left behind
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Arena page
// ─────────────────────────────────────────────────────────────────────────────

const BattleArenaPage = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Battle Arena');

  const [state, setState] = useState<WebBattleStateView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Dialogue: intro plays before the fight, the outcome line after it ends.
  const [introDismissed, setIntroDismissed] = useState(false);
  const [outcomeDismissed, setOutcomeDismissed] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  // Trainer choreography. `trainerOut` = the trainer is standing on the field;
  // `throwing` = their monster has not been sent out yet, so the field is bare.
  const [trainerOut, setTrainerOut] = useState<SlotFlags>({ you: false, foe: false });
  const [throwing, setThrowing] = useState<SlotFlags>({ you: false, foe: false });
  const confirmModal = useConfirmModal();
  const logRef = useRef<HTMLDivElement>(null);
  const exitTimersRef = useRef<Record<TrainerSlot, ReturnType<typeof setTimeout> | null>>({ you: null, foe: null });
  const revealTimersRef = useRef<Record<TrainerSlot, ReturnType<typeof setTimeout> | null>>({ you: null, foe: null });
  const prevShownRef = useRef<Record<TrainerSlot, number | null>>({ you: null, foe: null });
  const startPlayedRef = useRef(false);

  // Every transient visual — the attacker's lunge, the hit flash, drained HP, floating
  // damage and stat arrows, the knockout drop — is derived from the state stream here.
  // `observe`/`reset` are pulled out because the `fx` object itself is rebuilt on every
  // animation tick: a callback that closed over the whole of it would change identity
  // constantly, and the effects keyed on it would refetch the battle in a loop.
  const fx = useBattleFx();
  const { observe: observeFx, reset: resetFx } = fx;

  const clearSlotTimers = useCallback((slot: TrainerSlot) => {
    const exit = exitTimersRef.current[slot];
    const reveal = revealTimersRef.current[slot];
    if (exit) clearTimeout(exit);
    if (reveal) clearTimeout(reveal);
    exitTimersRef.current[slot] = null;
    revealTimersRef.current[slot] = null;
  }, []);

  /** Trainer in → (beat) → monster out → trainer off. */
  const playSendIn = useCallback((slot: TrainerSlot) => {
    clearSlotTimers(slot);
    setTrainerOut((cur) => ({ ...cur, [slot]: true }));
    setThrowing((cur) => ({ ...cur, [slot]: true }));
    revealTimersRef.current[slot] = setTimeout(() => {
      revealTimersRef.current[slot] = null;
      setThrowing((cur) => ({ ...cur, [slot]: false }));
    }, MONSTER_REVEAL_MS);
    exitTimersRef.current[slot] = setTimeout(() => {
      exitTimersRef.current[slot] = null;
      setTrainerOut((cur) => ({ ...cur, [slot]: false }));
    }, TRAINER_EXIT_MS);
  }, [clearSlotTimers]);

  /** Keep a trainer on screen a moment longer, then walk them off. */
  const playExit = useCallback((slot: TrainerSlot) => {
    clearSlotTimers(slot);
    setTrainerOut((cur) => ({ ...cur, [slot]: true }));
    exitTimersRef.current[slot] = setTimeout(() => {
      exitTimersRef.current[slot] = null;
      setTrainerOut((cur) => ({ ...cur, [slot]: false }));
    }, TRAINER_LINGER_MS);
  }, [clearSlotTimers]);

  useEffect(() => () => {
    clearSlotTimers('you');
    clearSlotTimers('foe');
  }, [clearSlotTimers]);

  /**
   * Guards against out-of-order battle states.
   *
   * The arena reads a state by diffing it against the last one, so a stale response is
   * worse than a late one: an older snapshot rewinds the HP and faint baselines, and the
   * next state then replays damage that has already been animated — as *chip* damage,
   * since its turns are behind the cursor. Every fetch takes a ticket; only the newest
   * one is allowed to land. Bumping it also strands the in-flight request for a battle
   * you have just navigated away from.
   */
  const stateSeqRef = useRef(0);

  const applyState = useCallback((next: WebBattleStateView) => {
    observeFx(next);
    setState(next);
  }, [observeFx]);

  const refetch = useCallback(() => {
    if (!battleId) return;
    const seq = ++stateSeqRef.current;
    battleService.getBattleState(battleId)
      .then((next) => {
        if (seq !== stateSeqRef.current) return;
        applyState(next);
      })
      .catch(err => {
        if (seq !== stateSeqRef.current) return;
        setError(extractErrorMessage(err, 'Failed to load battle.'));
      })
      .finally(() => {
        if (seq === stateSeqRef.current) setLoading(false);
      });
  }, [battleId, applyState]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  // Reset dialogue when moving to a different battle (e.g. next gauntlet opponent)
  useEffect(() => {
    setIntroDismissed(false);
    setOutcomeDismissed(false);
    setLineIndex(0);
    // The next battle has its own trainers and its own send-in, so replay both.
    prevShownRef.current = { you: null, foe: null };
    startPlayedRef.current = false;
    resetFx();
  }, [battleId, resetFx]);

  // Socket join / updates + pvp polling fallback
  useEffect(() => {
    if (!battleId) return;
    const id = Number(battleId);
    chatSocketService.connect();
    chatSocketService.joinBattle(id);
    const onUpdate = (data: { battle_id: number }) => {
      if (data.battle_id === id) refetch();
    };
    chatSocketService.onBattleUpdate(onUpdate);
    return () => {
      chatSocketService.offBattleUpdate(onUpdate);
      chatSocketService.leaveBattle(id);
    };
  }, [battleId, refetch]);

  useEffect(() => {
    if (state?.mode !== 'pvp' || state.status !== 'active') return;
    const interval = setInterval(refetch, 10000);
    return () => clearInterval(interval);
  }, [state?.mode, state?.status, refetch]);

  // Scroll log to bottom on new entries
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.logs?.length]);

  // ── Derived data ──────────────────────────────────────────────────

  const yourSide: BattleSide = state?.yourSide ?? 'players';
  const enemySide: BattleSide = yourSide === 'players' ? 'opponents' : 'players';

  const yourMonsters = useMemo(
    () => (state?.monsters ?? []).filter(m => m.teamSide === yourSide),
    [state, yourSide],
  );
  // A knocked-out monster is deactivated server-side the moment it faints, so by the
  // time this state arrives it is no longer anybody's active monster — and on the
  // opponent's side the AI has already switched its replacement in. Keep showing the
  // dead one for as long as the FX layer holds it: it takes the killing blow, drains to
  // zero and plays its faint-drop, just like the games, and only then does the field
  // move on. Without this the fatal hit lands on an empty slot and is never seen.
  const retainedOn = (side: BattleSide) =>
    (state?.monsters ?? []).find(m => m.teamSide === side && fx.retainedIds.has(m.id)) ?? null;

  const yourActive = retainedOn(yourSide) ?? yourMonsters.find(m => m.isActive) ?? null;
  const enemyActive = (state?.monsters ?? []).find(m => m.teamSide === enemySide && m.isActive) ?? null;
  const enemyShown = retainedOn(enemySide) ?? enemyActive;
  // A monster still finishing its faint-drop on the field is not also on the bench.
  const bench = yourMonsters.filter(m => !m.isActive && !fx.retainedIds.has(m.id));

  const yourTrainer = (state?.participants ?? []).find(p => p.teamSide === yourSide) ?? null;
  const enemyTrainer = (state?.participants ?? []).find(p => p.teamSide === enemySide) ?? null;

  const battleOver = state?.status !== 'active';
  const canMove = !!state && !battleOver && state.isYourTurn && !state.mustSwitch && !actionPending && !state.pending;
  const canSwitch = !!state && !battleOver && !actionPending && !state.pending && (state.mustSwitch || state.isYourTurn);

  const orderedLogs = useMemo(
    () =>
      [...(state?.logs ?? [])]
        .reverse()
        .map((log) => ({ ...log, text: cleanLogMessage(log.message) }))
        // Drop lines that were made up entirely of emoji (e.g. text HP bars)
        .filter((log) => log.text.length > 0),
    [state?.logs],
  );

  /** The floating numbers/arrows currently attached to one monster. */
  const popupsFor = useCallback((monsterId: number) => ({
    statPopups: fx.statPopups.filter((p) => p.monsterId === monsterId),
    damagePopups: fx.damagePopups.filter((p) => p.monsterId === monsterId),
  }), [fx.statPopups, fx.damagePopups]);

  /**
   * The HP to draw for a monster on the field: the value the FX layer is holding it at,
   * which lags the server's until the blow responsible actually connects, so the bar
   * drains on the hit rather than before the attacker has moved.
   */
  const shownHp = (monster: BattleMonster): number =>
    fx.displayHp.get(monster.id) ?? monster.currentHp;

  // ── Dialogue & scenery ────────────────────────────────────────────

  const appearance = state?.appearance ?? null;
  const dialogue = state?.dialogue ?? null;
  const speaker = useMemo(
    () => (state?.opponentLabel ?? '').replace(/\s*\(\d+\/\d+\)\s*$/, '').trim() || 'Opponent',
    [state?.opponentLabel],
  );

  // Which line set is showing: intro before the fight, or the outcome after it.
  const outcomeLines = useMemo(() => {
    if (!state || state.status === 'active' || !dialogue) return [];
    const didWin = state.settlement?.won ?? (state.winnerType === (state.yourSide ?? 'players'));
    if (didWin && dialogue.win.length) return dialogue.win;
    if (!didWin && dialogue.loss.length) return dialogue.loss;
    return dialogue.generic; // shown for either outcome when no specific line exists
  }, [state, dialogue]);

  const introLines = useMemo(() => dialogue?.intro ?? [], [dialogue]);
  const introActive =
    !!state && !state.pending && state.status === 'active' && introLines.length > 0 && !introDismissed;
  const outcomeActive =
    !!state && state.status !== 'active' && outcomeLines.length > 0 && !outcomeDismissed;
  const activeDialogue = useMemo(
    () =>
      introActive
        ? { kind: 'intro' as const, lines: introLines }
        : outcomeActive
          ? { kind: 'outcome' as const, lines: outcomeLines }
          : null,
    [introActive, outcomeActive, introLines, outcomeLines],
  );

  const advanceDialogue = useCallback(() => {
    if (!activeDialogue) return;
    if (lineIndex < activeDialogue.lines.length - 1) {
      setLineIndex(lineIndex + 1);
    } else {
      if (activeDialogue.kind === 'intro') setIntroDismissed(true);
      else setOutcomeDismissed(true);
      setLineIndex(0);
    }
  }, [activeDialogue, lineIndex]);

  // Advance dialogue with Space / Enter as well as clicking.
  useEffect(() => {
    if (!activeDialogue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') {
        e.preventDefault();
        advanceDialogue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeDialogue, advanceDialogue]);

  // ── Trainer choreography ──────────────────────────────────────────

  // Battle start: both trainers walk onto an empty field. With intro dialogue they
  // hold there and speak first; the send-in only completes once it is dismissed.
  useEffect(() => {
    if (!state || state.pending || startPlayedRef.current) return;
    startPlayedRef.current = true;
    playSendIn('you');
    playSendIn('foe');
  }, [state, playSendIn]);

  // Send-in: the monster shown on a side changed (you switched, or the AI sent its
  // next one out after the previous finished its KO animation), so that side's
  // trainer steps back in to throw. Laid out before paint so the incoming monster
  // never flashes on screen ahead of its trainer.
  useLayoutEffect(() => {
    const prev = prevShownRef.current;
    const youId = yourActive?.id ?? null;
    const foeId = enemyShown?.id ?? null;
    if (youId !== null && prev.you !== null && youId !== prev.you) playSendIn('you');
    if (foeId !== null && prev.foe !== null && foeId !== prev.foe) playSendIn('foe');
    prev.you = youId;
    prev.foe = foeId;
  }, [yourActive?.id, enemyShown?.id, playSendIn]);

  // Intro dialogue over: the trainers finally throw, then step off under their
  // monsters. (An empty dependency-free ref guard so this fires once, on the edge.)
  const introWasActiveRef = useRef(false);
  useEffect(() => {
    if (introActive) {
      introWasActiveRef.current = true;
      return;
    }
    if (!introWasActiveRef.current) return;
    introWasActiveRef.current = false;
    playExit('you');
    playExit('foe');
  }, [introActive, playExit]);

  // The trainer stands on the field while speaking, while throwing, and once the
  // battle is decided — so you see who you beat, or lost to.
  const trainerVisible = (slot: TrainerSlot): boolean =>
    trainerOut[slot] || introActive || battleOver;
  // Nothing on the field but the trainer until they have thrown.
  const monsterHidden = (slot: TrainerSlot): boolean => throwing[slot] || introActive;

  // ── Actions ───────────────────────────────────────────────────────

  const sendAction = useCallback(async (action: Parameters<typeof battleService.sendAction>[1]) => {
    if (!battleId) return;
    try {
      setActionPending(true);
      setActionError(null);
      const result = await battleService.sendAction(battleId, action);
      if (result.state) {
        // The action's own response is the newest state there is — retire any GET still
        // in flight so a slower, older snapshot can't land on top of it.
        stateSeqRef.current++;
        applyState(result.state);
      }
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Action failed.'));
    } finally {
      setActionPending(false);
    }
  }, [battleId, applyState]);

  const handleForfeit = () => {
    confirmModal.confirmDanger(
      'Are you sure you want to forfeit this battle? You will take the loss.',
      () => sendAction({ type: 'forfeit' }),
      { title: 'Forfeit Battle', confirmText: 'Forfeit' },
    );
  };

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="battle-arena-page">
        <div className="state-container"><i className="fas fa-spinner fa-spin"></i><p>Loading battle...</p></div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="battle-arena-page">
        <div className="state-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || 'Battle not found.'}</p>
          <button className="button secondary" onClick={() => navigate('/adventures/battle')}>
            <i className="fas fa-arrow-left"></i> Back to Battle Hub
          </button>
        </div>
      </div>
    );
  }

  const settlement = state.settlement;
  const won = settlement?.won ?? (state.winnerType === yourSide);

  /**
   * One combatant's patch of ground: the place-spot, the sprite (carrying its own
   * lunge / hit / faint animation classes) and the numbers floating off it.
   */
  const renderSpriteZone = (monster: BattleMonster, slot: TrainerSlot) => {
    const side: BattleSide = slot === 'you' ? yourSide : enemySide;
    const facing = slot === 'you' ? 'player' : 'enemy';
    const fainting = fx.faintingIds.has(monster.id);
    // Knocked out, but its drop hasn't finished playing. Between the state arriving and
    // the killing blow connecting it must still look alive, so the settled `--fainted`
    // look is held back until the FX layer lets go of it.
    const retained = fx.retainedIds.has(monster.id);
    const settledFaint = monster.isFainted && !retained;
    // A monster that is dropping doesn't also flinch — the KO animation owns it.
    const struck = fx.hitSides.has(side) && !fainting;
    const lunging = fx.lurchingSides.has(side) && !fainting;
    const { statPopups, damagePopups } = popupsFor(monster.id);

    return (
      <div className={`battle-field__sprite-zone ${struck ? 'battle-field__sprite-zone--hit' : ''}`}>
        {appearance?.spotUrl ? (
          <img
            className={`battle-field__spot ${pixelatedClass(appearance.spotPixelated)}`}
            src={appearance.spotUrl}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <div className="battle-field__platform" />
        )}
        {!monsterHidden(slot) && (
          <>
            {struck && <span className="battle-field__impact" aria-hidden="true" />}
            {/* Keyed by monster, so the send-in slide plays once per monster sent out —
                and the sprite inside it is free to shake, lunge and fall without the
                slide being re-triggered under it. */}
            <span
              key={monster.id}
              className={`battle-field__sprite-enter battle-field__sprite-enter--${facing}`}
            >
              <img
                className={[
                  'battle-field__sprite',
                  `battle-field__sprite--${facing}`,
                  settledFaint ? 'battle-field__sprite--fainted' : '',
                  fainting ? 'battle-field__sprite--fainting' : '',
                  lunging ? 'battle-field__sprite--lurch' : '',
                ].filter(Boolean).join(' ')}
                src={slot === 'you'
                  ? (monster.backSprite || monster.imgLink || '/images/default_mon.png')
                  : (monster.imgLink || '/images/default_mon.png')}
                alt={monster.name}
                onError={handleMonImgError}
              />
            </span>
            <BattleFxLayer statPopups={statPopups} damagePopups={damagePopups} />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="battle-arena-page">
      {/* Header */}
      <div className="battle-arena__header">
        <button className="button secondary sm" onClick={() => navigate('/adventures/battle')}>
          <i className="fas fa-arrow-left"></i> Battle Hub
        </button>
        <div className="battle-arena__header-center">
          <h1>
            <span className={`battle-mode-chip battle-mode-chip--${state.mode}`}>{state.mode}</span>
            {' '}vs {state.opponentLabel}
          </h1>
          {state.stage && (
            <div className={`battle-arena__stage ${state.stage.stageType === 'leader' ? 'battle-arena__stage--leader' : ''}`}>
              <i className={state.stage.stageType === 'leader' ? 'fas fa-crown' : 'fas fa-route'}></i>
              {' '}Stage {state.stage.stageNumber}/{state.stage.totalStages}
              {state.stage.stageType === 'leader' && <span> — Gym Leader Battle!</span>}
            </div>
          )}
        </div>
        {!battleOver && (
          <button className="button danger sm" onClick={handleForfeit} disabled={actionPending}>
            <i className="fas fa-flag"></i> Forfeit
          </button>
        )}
      </div>

      {state.pending && (
        <div className="battle-arena__banner">
          <i className="fas fa-hourglass-half"></i> Waiting for your opponent to accept the challenge...
        </div>
      )}

      {/* Turn indicator */}
      {!battleOver && !state.pending && (
        <div className={`battle-arena__banner ${state.mustSwitch ? 'battle-arena__banner--switch' : state.isYourTurn ? 'battle-arena__banner--your-turn' : ''}`}>
          {state.mustSwitch
            ? <><i className="fas fa-exchange-alt"></i> Choose your next monster!</>
            : state.isYourTurn
              ? <><i className="fas fa-bolt"></i> Your turn — choose a move!</>
              : <><i className="fas fa-hourglass-half"></i> Waiting for {state.opponentLabel}...</>}
        </div>
      )}

      {actionError && (
        <div className="battle-page__error">
          <i className="fas fa-exclamation-triangle"></i> {actionError}
          <button className="button ghost sm" onClick={() => setActionError(null)}><i className="fas fa-times"></i></button>
        </div>
      )}

      {/* Battlefield */}
      <div className={`battle-field ${appearance?.backgroundUrl ? 'battle-field--has-bg' : ''}`}>
        {appearance?.backgroundUrl && (
          <div
            className={`battle-field__bg ${pixelatedClass(appearance.backgroundPixelated)}`}
            style={{ backgroundImage: `url(${appearance.backgroundUrl})` }}
            aria-hidden="true"
          />
        )}
        {/* Opponent side (top-right) */}
        <div className="battle-field__side battle-field__side--enemy">
          {enemyShown ? (
            <>
              <MonsterInfoCard
                key={enemyShown.id}
                monster={enemyShown}
                flashing={fx.hpFlashIds.has(enemyShown.id)}
                concealed={monsterHidden('foe')}
                hp={shownHp(enemyShown)}
              />
              {renderSpriteZone(enemyShown, 'foe')}
            </>
          ) : (
            <div className="battle-field__empty">No opposing monster</div>
          )}
        </div>

        {/* Your side (bottom-left) */}
        <div className="battle-field__side battle-field__side--player">
          {yourActive ? (
            <>
              {renderSpriteZone(yourActive, 'you')}
              <MonsterInfoCard
                key={yourActive.id}
                monster={yourActive}
                flashing={fx.hpFlashIds.has(yourActive.id)}
                concealed={monsterHidden('you')}
                hp={shownHp(yourActive)}
              />
            </>
          ) : (
            <div className="battle-field__empty">Choose a monster</div>
          )}
        </div>

        {/* Trainers: slide on at the start, on each send-in, and when the battle ends */}
        {enemyTrainer?.trainerImage && (
          <TrainerPortrait
            image={enemyTrainer.trainerImage}
            name={enemyTrainer.trainerName}
            side="enemy"
            visible={trainerVisible('foe')}
          />
        )}
        {yourTrainer?.trainerImage && (
          <TrainerPortrait
            image={yourTrainer.trainerImage}
            name={yourTrainer.trainerName}
            side="player"
            visible={trainerVisible('you')}
          />
        )}

        {/* Dialogue (intro before the fight, outcome after) */}
        {activeDialogue && (
          <DialogueBox
            lines={activeDialogue.lines}
            index={Math.min(lineIndex, activeDialogue.lines.length - 1)}
            sprite={dialogue?.sprite ?? null}
            speaker={speaker}
            textboxUrl={appearance?.textboxUrl ?? null}
            textboxSlice={appearance?.textboxSlice ?? null}
            textboxPixelated={appearance?.textboxPixelated ?? false}
            onAdvance={advanceDialogue}
          />
        )}
      </div>

      {/* Controls row */}
      <div className="battle-controls">
        {/* Move panel */}
        <div className="battle-moves">
          <h3><i className="fas fa-fist-raised"></i> Moves</h3>
          {state.activeMoves.length === 0 ? (
            <div className="state-container sm"><p>No moves available.</p></div>
          ) : (
            <div className="battle-moves__grid">
              {state.activeMoves.map((move: BattleMove) => (
                <button
                  key={move.moveName}
                  className={`battle-move-button battle-move-button--${move.moveCategory.toLowerCase()}`}
                  disabled={!canMove}
                  title={move.description || undefined}
                  onClick={() => sendAction({ type: 'move', moveName: move.moveName })}
                >
                  <span className="battle-move-button__name">{move.moveName}</span>
                  <span className="battle-move-button__meta">
                    <TypeBadge type={move.moveType} size="xs" />
                    <span className={`battle-move-category battle-move-category--${move.moveCategory.toLowerCase()}`}>
                      {move.moveCategory}
                    </span>
                  </span>
                  <span className="battle-move-button__stats">
                    <span>PWR {move.power ?? '—'}</span>
                    <span>ACC {move.accuracy != null ? `${move.accuracy}%` : '—'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Team bar */}
          <h3 className={state.mustSwitch ? 'battle-team-bar__must-switch' : ''}>
            <i className="fas fa-paw"></i> Team
            {state.mustSwitch && <span> — Choose your next monster!</span>}
          </h3>
          <div className={`battle-team-bar ${state.mustSwitch ? 'battle-team-bar--emphasized' : ''}`}>
            {bench.length === 0 && <span className="battle-team-bar__empty">No bench monsters.</span>}
            {bench.map(m => (
              <BenchMonsterButton
                key={m.id}
                monster={m}
                disabled={!canSwitch || m.isFainted}
                onSwitch={() => sendAction({ type: 'switch', battleMonsterId: m.id })}
              />
            ))}
          </div>
        </div>

        {/* Battle log */}
        <div className="battle-log">
          <h3><i className="fas fa-scroll"></i> Battle Log</h3>
          <div className="battle-log__entries" ref={logRef}>
            {orderedLogs.length === 0 ? (
              <p className="battle-log__empty">The battle is about to begin...</p>
            ) : (
              orderedLogs.map(log => (
                <p key={log.id} className="battle-log__entry">{log.text}</p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* End-of-battle overlay (waits for the outcome dialogue to finish) */}
      {battleOver && !outcomeActive && (
        <div className="battle-overlay">
          <div className={`battle-overlay__card ${won ? 'battle-overlay__card--victory' : 'battle-overlay__card--defeat'}`}>
            <h2>
              {state.winnerType === 'draw'
                ? 'Draw!'
                : won ? 'Victory!' : 'Defeat...'}
            </h2>

            {settlement && settlement.currencyDelta !== 0 && (
              <p className={`battle-overlay__currency ${settlement.currencyDelta > 0 ? 'gain' : 'loss'}`}>
                <i className="fas fa-coins"></i>{' '}
                {settlement.currencyDelta > 0 ? '+' : ''}{settlement.currencyDelta} coins
              </p>
            )}

            {settlement?.levelRewards && settlement.levelRewards.length > 0 && (
              <div className="battle-overlay__levels">
                {settlement.levelRewards.map((r) => (
                  <p key={r.monsterId} className="battle-overlay__level-reward">
                    <i className="fas fa-arrow-up"></i>{' '}
                    <strong>{r.name}</strong> gained {r.levels} level{r.levels === 1 ? '' : 's'} (now Lv. {r.newLevel})
                  </p>
                ))}
              </div>
            )}

            {settlement?.badge && (
              <div className="battle-overlay__badge">
                {settlement.badge.badgeImgLink ? (
                  <img src={settlement.badge.badgeImgLink} alt={settlement.badge.badgeName} />
                ) : (
                  <span className="battle-badge-placeholder battle-badge-placeholder--lg">
                    <i className="fas fa-medal"></i>
                  </span>
                )}
                <p><strong>{settlement.badge.badgeName}</strong> earned from {settlement.badge.gymName}!</p>
              </div>
            )}

            {settlement?.gauntlet && (
              <div className="battle-overlay__gauntlet">
                {settlement.gauntlet.status === 'active' && settlement.gauntlet.nextBattleId ? (
                  <>
                    <p>
                      Gauntlet progress: stage {settlement.gauntlet.currentStage}/{settlement.gauntlet.totalStages}
                    </p>
                    <button
                      className="button primary"
                      onClick={() => {
                        setLoading(true);
                        fx.reset();
                        navigate(`/adventures/battle/${settlement.gauntlet!.nextBattleId}`);
                      }}
                    >
                      Next opponent <i className="fas fa-arrow-right"></i>
                    </button>
                  </>
                ) : settlement.gauntlet.status === 'completed' ? (
                  <p className="battle-overlay__gauntlet-complete"><i className="fas fa-medal"></i> Gauntlet complete — Badge earned!</p>
                ) : (
                  <p className="battle-overlay__gauntlet-failed"><i className="fas fa-skull"></i> Gauntlet failed.</p>
                )}
              </div>
            )}

            <div className="battle-overlay__actions">
              <button className="button secondary" onClick={() => navigate('/adventures/battle')}>
                <i className="fas fa-arrow-left"></i> Back to Battle Hub
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
};

export default BattleArenaPage;
