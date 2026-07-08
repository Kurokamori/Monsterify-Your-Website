import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const handleMonImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = '/images/default_mon.png';
};

function hpBarClass(pct: number): string {
  if (pct > 50) return 'high';
  if (pct > 20) return 'mid';
  return 'low';
}

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
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HpBar({ monster, flashing }: { monster: BattleMonster; flashing: boolean }) {
  const pct = monster.maxHp > 0 ? Math.max(0, Math.min(100, (monster.currentHp / monster.maxHp) * 100)) : 0;
  return (
    <div className={`battle-hp ${flashing ? 'battle-hp--flash' : ''}`}>
      <div className="battle-hp__bar">
        <div
          className={`battle-hp__fill battle-hp__fill--${hpBarClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="battle-hp__text">{monster.currentHp} / {monster.maxHp}</span>
    </div>
  );
}

function MonsterInfoCard({ monster, flashing }: { monster: BattleMonster; flashing: boolean }) {
  return (
    <div className={`battle-info-card ${monster.isFainted ? 'battle-info-card--fainted' : ''}`}>
      <div className="battle-info-card__top">
        <span className="battle-info-card__name">{monster.name}</span>
        <span className="battle-info-card__level">Lv. {monster.level}</span>
      </div>
      <div className="battle-info-card__types">
        {monster.types.map(t => <TypeBadge key={t} type={t} size="xs" />)}
      </div>
      <HpBar monster={monster} flashing={flashing} />
      {monster.statusEffects.length > 0 && (
        <div className="battle-info-card__statuses">
          {monster.statusEffects.map(s => (
            <span key={s} className={`battle-status-chip battle-status-chip--${s.toLowerCase().replace(/\s+/g, '-')}`}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pokémon-style battle dialogue box. Shows one line at a time, advanced by the
 * parent (click anywhere on the box or press Space/Enter). Renders the speaker's
 * sprite (or a bespoke talking sprite) and, when a text-box skin asset is set,
 * frames the box with it as a nine-slice via CSS border-image.
 */
function DialogueBox({
  lines,
  index,
  sprite,
  speaker,
  textboxUrl,
  textboxSlice,
  onAdvance,
}: {
  lines: string[];
  index: number;
  sprite: string | null;
  speaker: string;
  textboxUrl: string | null;
  textboxSlice: number | null;
  onAdvance: () => void;
}) {
  const slice = textboxSlice && textboxSlice > 0 ? textboxSlice : 24;
  const boxStyle: React.CSSProperties = textboxUrl
    ? {
        borderStyle: 'solid',
        borderWidth: `${slice}px`,
        borderColor: 'transparent',
        borderImageSource: `url(${textboxUrl})`,
        borderImageSlice: `${slice} fill`,
        borderImageWidth: `${slice}px`,
        borderImageRepeat: 'stretch',
      }
    : {};
  const isLast = index >= lines.length - 1;
  return (
    <div className="battle-dialogue">
      {sprite && (
        <div className="battle-dialogue__portrait">
          <img src={sprite} alt={speaker} onError={handleMonImgError} />
        </div>
      )}
      <button
        type="button"
        className={`battle-dialogue__box ${textboxUrl ? 'battle-dialogue__box--custom' : ''}`}
        style={boxStyle}
        onClick={onAdvance}
      >
        <span className="battle-dialogue__speaker">{speaker}</span>
        <p className="battle-dialogue__text">{lines[index]}</p>
        <span className="battle-dialogue__advance">
          {isLast ? (
            <>Click or press Space to continue <i className="fas fa-play" /></>
          ) : (
            <>Next <i className="fas fa-angle-double-down" /></>
          )}
        </span>
      </button>
    </div>
  );
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
  const [flashSide, setFlashSide] = useState<'players' | 'opponents' | null>(null);
  const [faintingIds, setFaintingIds] = useState<Set<number>>(new Set());
  // Dialogue: intro plays before the fight, the outcome line after it ends.
  const [introDismissed, setIntroDismissed] = useState(false);
  const [outcomeDismissed, setOutcomeDismissed] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const confirmModal = useConfirmModal();
  const logRef = useRef<HTMLDivElement>(null);
  const prevHpRef = useRef<Map<number, number>>(new Map());
  const prevFaintedRef = useRef<Set<number>>(new Set());

  const applyState = useCallback((next: WebBattleStateView) => {
    // Detect HP drops for damage flash + newly-fainted monsters for the KO drop
    const prev = prevHpRef.current;
    const prevFainted = prevFaintedRef.current;
    let playersHit = false;
    let opponentsHit = false;
    const newlyFainted: number[] = [];
    for (const m of next.monsters) {
      const old = prev.get(m.id);
      if (old !== undefined && m.currentHp < old) {
        if (m.teamSide === 'players') playersHit = true;
        else opponentsHit = true;
      }
      prev.set(m.id, m.currentHp);

      if (m.isFainted && !prevFainted.has(m.id)) {
        newlyFainted.push(m.id);
        prevFainted.add(m.id);
      } else if (!m.isFainted && prevFainted.has(m.id)) {
        // Revived / new battle instance — reset so it can faint-animate again
        prevFainted.delete(m.id);
      }
    }
    if (playersHit || opponentsHit) {
      setFlashSide(playersHit ? 'players' : 'opponents');
      setTimeout(() => setFlashSide(null), 700);
    }
    if (newlyFainted.length > 0) {
      setFaintingIds((cur) => {
        const nextSet = new Set(cur);
        newlyFainted.forEach((id) => nextSet.add(id));
        return nextSet;
      });
      setTimeout(() => {
        setFaintingIds((cur) => {
          const nextSet = new Set(cur);
          newlyFainted.forEach((id) => nextSet.delete(id));
          return nextSet;
        });
      }, 1100);
    }
    setState(next);
  }, []);

  const refetch = useCallback(() => {
    if (!battleId) return;
    battleService.getBattleState(battleId)
      .then(applyState)
      .catch(err => setError(extractErrorMessage(err, 'Failed to load battle.')))
      .finally(() => setLoading(false));
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
  }, [battleId]);

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

  const yourSide = state?.yourSide ?? 'players';
  const enemySide = yourSide === 'players' ? 'opponents' : 'players';

  const yourMonsters = useMemo(
    () => (state?.monsters ?? []).filter(m => m.teamSide === yourSide),
    [state, yourSide],
  );
  const yourActive = yourMonsters.find(m => m.isActive) ?? null;
  const enemyActive = (state?.monsters ?? []).find(m => m.teamSide === enemySide && m.isActive) ?? null;
  // The AI auto-switches its next monster into the active slot in the same turn
  // it faints one, so the freshly-KO'd opponent is already inactive by the time
  // this state arrives. While its KO animation is in flight, keep showing the
  // fainted monster (hp already 0) so its bar drains to 0 and it plays the
  // faint-drop — just like the games — before the replacement enters.
  const enemyKoing = (state?.monsters ?? []).find(m => m.teamSide === enemySide && faintingIds.has(m.id)) ?? null;
  const enemyShown = enemyKoing ?? enemyActive;
  const bench = yourMonsters.filter(m => !m.isActive);

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

  // ── Actions ───────────────────────────────────────────────────────

  const sendAction = useCallback(async (action: Parameters<typeof battleService.sendAction>[1]) => {
    if (!battleId) return;
    try {
      setActionPending(true);
      setActionError(null);
      const result = await battleService.sendAction(battleId, action);
      if (result.state) applyState(result.state);
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
            className="battle-field__bg"
            style={{ backgroundImage: `url(${appearance.backgroundUrl})` }}
            aria-hidden="true"
          />
        )}
        {/* Opponent side (top-right) */}
        <div className="battle-field__side battle-field__side--enemy">
          {enemyShown ? (
            <>
              <MonsterInfoCard key={enemyShown.id} monster={enemyShown} flashing={flashSide === enemySide} />
              <div className={`battle-field__sprite-zone ${flashSide === enemySide && !faintingIds.has(enemyShown.id) ? 'battle-field__sprite-zone--hit' : ''}`}>
                {appearance?.spotUrl ? (
                  <img className="battle-field__spot" src={appearance.spotUrl} alt="" aria-hidden="true" />
                ) : (
                  <div className="battle-field__platform" />
                )}
                <img
                  key={enemyShown.id}
                  className={`battle-field__sprite battle-field__sprite--enemy ${enemyShown.isFainted ? 'battle-field__sprite--fainted' : ''} ${faintingIds.has(enemyShown.id) ? 'battle-field__sprite--fainting' : ''}`}
                  src={enemyShown.imgLink || '/images/default_mon.png'}
                  alt={enemyShown.name}
                  onError={handleMonImgError}
                />
              </div>
            </>
          ) : (
            <div className="battle-field__empty">No opposing monster</div>
          )}
        </div>

        {/* Your side (bottom-left) */}
        <div className="battle-field__side battle-field__side--player">
          {yourActive ? (
            <>
              <div className={`battle-field__sprite-zone ${flashSide === yourSide && !faintingIds.has(yourActive.id) ? 'battle-field__sprite-zone--hit' : ''}`}>
                {appearance?.spotUrl ? (
                  <img className="battle-field__spot" src={appearance.spotUrl} alt="" aria-hidden="true" />
                ) : (
                  <div className="battle-field__platform" />
                )}
                <img
                  key={yourActive.id}
                  className={`battle-field__sprite battle-field__sprite--player ${yourActive.isFainted ? 'battle-field__sprite--fainted' : ''} ${faintingIds.has(yourActive.id) ? 'battle-field__sprite--fainting' : ''}`}
                  src={yourActive.backSprite || yourActive.imgLink || '/images/default_mon.png'}
                  alt={yourActive.name}
                  onError={handleMonImgError}
                />
              </div>
              <MonsterInfoCard key={yourActive.id} monster={yourActive} flashing={flashSide === yourSide} />
            </>
          ) : (
            <div className="battle-field__empty">Choose a monster</div>
          )}
        </div>

        {/* Dialogue (intro before the fight, outcome after) */}
        {activeDialogue && (
          <DialogueBox
            lines={activeDialogue.lines}
            index={Math.min(lineIndex, activeDialogue.lines.length - 1)}
            sprite={dialogue?.sprite ?? null}
            speaker={speaker}
            textboxUrl={appearance?.textboxUrl ?? null}
            textboxSlice={appearance?.textboxSlice ?? null}
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
                  className="battle-move-button"
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
            {bench.map(m => {
              const pct = m.maxHp > 0 ? Math.max(0, (m.currentHp / m.maxHp) * 100) : 0;
              return (
                <button
                  key={m.id}
                  className={`battle-bench-monster ${m.isFainted ? 'fainted' : ''}`}
                  disabled={!canSwitch || m.isFainted}
                  title={`${m.name} (Lv. ${m.level}) — ${m.currentHp}/${m.maxHp} HP`}
                  onClick={() => sendAction({ type: 'switch', battleMonsterId: m.id })}
                >
                  <img src={m.imgLink || '/images/default_mon.png'} alt={m.name} onError={handleMonImgError} />
                  <span className="battle-bench-monster__name">{m.name}</span>
                  <span className="battle-bench-monster__hp">
                    <span className={`battle-bench-monster__hp-fill battle-hp__fill--${hpBarClass(pct)}`} style={{ width: `${pct}%` }} />
                  </span>
                </button>
              );
            })}
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
                        prevHpRef.current = new Map();
                        prevFaintedRef.current = new Set();
                        setFaintingIds(new Set());
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
