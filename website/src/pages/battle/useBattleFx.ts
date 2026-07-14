import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BATTLE_STAT_STAGE_KEYS,
  type BattleMonster,
  type BattleStatStageKey,
  type BattleStatStages,
  type WebBattleStateView,
} from '@services/battleService';

export type BattleSide = 'players' | 'opponents';

/**
 * A stat stage that just changed, floating off the monster it happened to.
 * `delta` is the change (+2), not the resulting stage — that is what the games announce.
 */
export interface StatPopup {
  id: number;
  monsterId: number;
  stat: BattleStatStageKey;
  delta: number;
}

/** Damage that just landed, floating off the monster that took it. */
export interface DamagePopup {
  id: number;
  monsterId: number;
  amount: number;
}

export interface BattleFx {
  /** Sides whose monster is mid-lunge (it is attacking). */
  lurchingSides: ReadonlySet<BattleSide>;
  /** Sides whose monster is being struck (flash + shake). */
  hitSides: ReadonlySet<BattleSide>;
  /** Monsters whose HP bar should pulse. */
  hpFlashIds: ReadonlySet<number>;
  /** Monsters playing their knockout drop right now. */
  faintingIds: ReadonlySet<number>;
  /**
   * Monsters that have been knocked out but whose drop has not finished playing.
   *
   * Wider than `faintingIds`: it opens the moment the knockout is *known* and stays open
   * until the drop ends. The server switches the replacement in on the same turn, so
   * without this the dead monster would be swapped off the field before it could fall.
   * The arena keeps rendering anything in here.
   */
  retainedIds: ReadonlySet<number>;
  /**
   * The HP each monster should currently be *shown* as having, which trails the HP the
   * server reports.
   *
   * A state update arrives with the damage already applied, so a bar driven straight from
   * it starts draining before the attacker has so much as moved — the hit reads as having
   * happened for no visible reason. Holding the old value until the blow actually connects
   * is what ties the drain to the punch. Monsters absent from the map are simply at their
   * reported HP.
   */
  displayHp: ReadonlyMap<number, number>;
  statPopups: readonly StatPopup[];
  damagePopups: readonly DamagePopup[];
}

/** Timings, in ms. One "beat" is a single attack: wind up, connect, recover. */
const LURCH_MS = 520;
/** How far into the lunge the blow actually lands. */
const CONTACT_MS = 230;
const HIT_MS = 700;
const FAINT_MS = 1100;
const STAT_POPUP_MS = 1500;
const DAMAGE_POPUP_MS = 1200;
/** Gap between two attacks that arrived in the same state update. */
const BEAT_MS = 950;
/**
 * A status move has no damage to time against, so its stat popups are held back by
 * roughly the time a blow would take to connect. Without this they fire on the same
 * frame the attacker starts moving, which reads as the effect preceding the move.
 */
const STATUS_EFFECT_DELAY_MS = 260;

/** A single action in the sequence the arena is about to play out. */
interface Beat {
  attacker: BattleSide | null;
  actorMonsterId: number | null;
  defender: BattleSide | null;
  defenderMonsterId: number | null;
  /** Zero for a status move or a miss — those animate their user but strike nobody. */
  damage: number;
}

type TimerHandle = ReturnType<typeof setTimeout>;

function sideOf(monster: BattleMonster | undefined): BattleSide | null {
  return monster ? monster.teamSide : null;
}

/** The stages a monster is carrying, defaulted so a missing payload diffs as "nothing". */
function stagesOf(monster: BattleMonster): BattleStatStages {
  return monster.statStages ?? {};
}

/**
 * Drives every transient visual in the arena from the stream of battle states.
 *
 * Feed it each state as it arrives (`observe`) and it works out what just happened by
 * diffing against the last one, then schedules the animations on a timeline: an attacker
 * lunges, its blow connects a beat later, the defender flashes and its HP bar drains,
 * numbers and stat arrows float off. Two attacks that arrive together (your move plus the
 * opponent's reply, which the server resolves before it answers) are played in sequence
 * rather than on top of each other.
 *
 * The attacker is taken from the turn record rather than inferred from an HP drop: end-of-
 * turn chip damage (burn, poison, a sandstorm) lowers HP with nobody attacking, and
 * guessing would make a monster lunge at nothing.
 */
export function useBattleFx(): BattleFx & {
  observe: (next: WebBattleStateView) => void;
  reset: () => void;
} {
  const [lurchingSides, setLurchingSides] = useState<ReadonlySet<BattleSide>>(new Set());
  const [hitSides, setHitSides] = useState<ReadonlySet<BattleSide>>(new Set());
  const [hpFlashIds, setHpFlashIds] = useState<ReadonlySet<number>>(new Set());
  const [faintingIds, setFaintingIds] = useState<ReadonlySet<number>>(new Set());
  const [retainedIds, setRetainedIds] = useState<ReadonlySet<number>>(new Set());
  const [displayHp, setDisplayHp] = useState<ReadonlyMap<number, number>>(new Map());
  const [statPopups, setStatPopups] = useState<readonly StatPopup[]>([]);
  const [damagePopups, setDamagePopups] = useState<readonly DamagePopup[]>([]);

  const prevHpRef = useRef<Map<number, number>>(new Map());
  const prevStagesRef = useRef<Map<number, BattleStatStages>>(new Map());
  const prevFaintedRef = useRef<Set<number>>(new Set());
  /** Turns already animated. Anything newer than this is what just happened. */
  const seenTurnIdRef = useRef<number>(0);
  /** First state of a battle: catch up silently rather than replaying its whole history. */
  const primedRef = useRef(false);
  const popupSeqRef = useRef(0);
  const timersRef = useRef<Set<TimerHandle>>(new Set());
  /**
   * How many live effects are currently holding each set entry.
   *
   * The sets are keyed by side or by monster id, so the same key can legitimately be
   * added twice before the first add expires — a PvP socket update can land mid-sequence
   * and start a second attack over the top of the first. Without a count, the earlier
   * add's removal timer would clear a key the later one still needs, cutting a hit flash
   * short or un-retaining a monster in the middle of its faint.
   */
  const holdsRef = useRef<Map<string, number>>(new Map());
  /**
   * Which observation each monster's pending HP steps belong to.
   *
   * The drain is played out on timers, so a fresher state can land while a monster still
   * has steps queued from the last one. Those stale steps would rewind its bar to a value
   * that is now history. Each observation stamps the monsters it schedules for, and a
   * step only lands if its monster has not been re-observed since.
   */
  const hpGenRef = useRef<Map<number, number>>(new Map());
  const observeSeqRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  /** setTimeout that cancels itself on unmount / battle change. */
  const later = useCallback((fn: () => void, delay: number) => {
    const handle = setTimeout(() => {
      timersRef.current.delete(handle);
      fn();
    }, delay);
    timersRef.current.add(handle);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    prevHpRef.current = new Map();
    prevStagesRef.current = new Map();
    prevFaintedRef.current = new Set();
    seenTurnIdRef.current = 0;
    primedRef.current = false;
    popupSeqRef.current = 0;
    holdsRef.current.clear();
    hpGenRef.current.clear();
    observeSeqRef.current = 0;
    setLurchingSides(new Set());
    setHitSides(new Set());
    setHpFlashIds(new Set());
    setFaintingIds(new Set());
    setRetainedIds(new Set());
    setDisplayHp(new Map());
    setStatPopups([]);
    setDamagePopups([]);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  /**
   * Hold `value` in a set for `duration`, ref-counted by `group:value` so that a second,
   * overlapping hold on the same key extends it rather than being cut short when the
   * first one expires.
   */
  const addTo = useCallback(
    <T extends string | number>(
      group: string,
      setter: React.Dispatch<React.SetStateAction<ReadonlySet<T>>>,
      value: T,
      duration: number,
    ) => {
      const key = `${group}:${value}`;
      holdsRef.current.set(key, (holdsRef.current.get(key) ?? 0) + 1);
      setter((cur) => new Set(cur).add(value));
      later(() => {
        const remaining = (holdsRef.current.get(key) ?? 1) - 1;
        holdsRef.current.set(key, remaining);
        if (remaining > 0) return;
        setter((cur) => {
          const next = new Set(cur);
          next.delete(value);
          return next;
        });
      }, duration);
    },
    [later],
  );

  const pushStatPopup = useCallback(
    (monsterId: number, stat: BattleStatStageKey, delta: number) => {
      const id = ++popupSeqRef.current;
      setStatPopups((cur) => [...cur, { id, monsterId, stat, delta }]);
      later(() => setStatPopups((cur) => cur.filter((p) => p.id !== id)), STAT_POPUP_MS);
    },
    [later],
  );

  const pushDamagePopup = useCallback(
    (monsterId: number, amount: number) => {
      const id = ++popupSeqRef.current;
      setDamagePopups((cur) => [...cur, { id, monsterId, amount }]);
      later(() => setDamagePopups((cur) => cur.filter((p) => p.id !== id)), DAMAGE_POPUP_MS);
    },
    [later],
  );

  /** Show `monsterId` at `hp` after `delay`, unless a newer observation has superseded it. */
  const scheduleHp = useCallback(
    (monsterId: number, hp: number, delay: number, generation: number) => {
      const land = () => {
        if (hpGenRef.current.get(monsterId) !== generation) return;
        setDisplayHp((cur) => new Map(cur).set(monsterId, hp));
      };
      if (delay <= 0) land();
      else later(land, delay);
    },
    [later],
  );

  const observe = useCallback(
    (next: WebBattleStateView) => {
      const byId = new Map(next.monsters.map((m) => [m.id, m]));
      const generation = ++observeSeqRef.current;

      // ── What changed since the last state ─────────────────────────────
      const damageTaken = new Map<number, number>();
      /** Each monster's HP as it stood *before* this update — where its bar starts from. */
      const hpBefore = new Map<number, number>();
      const newlyFainted: number[] = [];
      const statDeltas: Array<{ monsterId: number; stat: BattleStatStageKey; delta: number }> = [];

      for (const monster of next.monsters) {
        const prevHp = prevHpRef.current.get(monster.id);
        hpBefore.set(monster.id, prevHp ?? monster.currentHp);
        if (prevHp !== undefined && monster.currentHp < prevHp) {
          damageTaken.set(monster.id, prevHp - monster.currentHp);
        }
        prevHpRef.current.set(monster.id, monster.currentHp);

        const prevStages = prevStagesRef.current.get(monster.id);
        const stages = stagesOf(monster);
        if (prevStages) {
          for (const stat of BATTLE_STAT_STAGE_KEYS) {
            const delta = (stages[stat] ?? 0) - (prevStages[stat] ?? 0);
            if (delta !== 0) {
              statDeltas.push({ monsterId: monster.id, stat, delta });
            }
          }
        }
        prevStagesRef.current.set(monster.id, stages);

        if (monster.isFainted && !prevFaintedRef.current.has(monster.id)) {
          newlyFainted.push(monster.id);
          prevFaintedRef.current.add(monster.id);
        } else if (!monster.isFainted && prevFaintedRef.current.has(monster.id)) {
          // Revived, or a fresh battle reusing the id — let it faint-animate again.
          prevFaintedRef.current.delete(monster.id);
        }
      }

      const freshTurns = (next.recentTurns ?? []).filter((t) => t.id > seenTurnIdRef.current);
      const highestTurnId = (next.recentTurns ?? []).reduce((max, t) => Math.max(max, t.id), seenTurnIdRef.current);
      seenTurnIdRef.current = highestTurnId;

      // The first state of a battle is a snapshot of history, not news: adopt it as the
      // baseline and play nothing. (A battle rejoined mid-fight would otherwise replay
      // every attack in its log the moment the page opened.) The bars start on the truth.
      if (!primedRef.current) {
        primedRef.current = true;
        next.monsters.forEach((m) => hpGenRef.current.set(m.id, generation));
        setDisplayHp(new Map(next.monsters.map((m) => [m.id, m.currentHp])));
        return;
      }

      // ── Turn the changes into a sequence of beats ─────────────────────
      const beats: Beat[] = freshTurns
        .filter((turn) => turn.actionType === 'attack')
        .map((turn) => {
          const defenderId = turn.targetMonsterId;
          const defender = defenderId !== null ? byId.get(defenderId) : undefined;
          return {
            attacker: sideOf(turn.actorMonsterId !== null ? byId.get(turn.actorMonsterId) : undefined)
              ?? (turn.actorSide as BattleSide | null),
            actorMonsterId: turn.actorMonsterId,
            defender: sideOf(defender),
            defenderMonsterId: defenderId,
            damage: turn.damageDealt,
          };
        });

      // Damage with no attack behind it (poison, burn, recoil, a sandstorm) still shakes
      // the monster and drains its bar — it just has nobody lunging at it. Only beats
      // that actually dealt damage account for a monster's HP loss, so a monster that was
      // merely the target of a status move still gets its chip damage animated.
      const struckByBeats = new Set(
        beats
          .filter((b) => b.damage > 0)
          .map((b) => b.defenderMonsterId)
          .filter((id): id is number => id !== null),
      );
      const passiveDamage = [...damageTaken.entries()].filter(([id]) => !struckByBeats.has(id));
      const passiveAt = beats.length * BEAT_MS;

      // ── Walk each bar down in step with the blows that emptied it ──────
      //
      // The server hands over the finished HP; the bar has to get there the way the
      // battle did. Each monster's drain is broken into the steps that caused it — one
      // per blow that landed on it, then any chip damage at the end of the turn — and
      // each step is timed to the moment that blow connects. A monster nothing happened
      // to is simply put at its reported HP.
      //
      // The steps are built from the turns' own damage figures, but the *last* step is
      // always the server's actual HP, so any drift (a heal, a recoil, an effect the
      // client can't see) is reconciled rather than accumulating.
      next.monsters.forEach((monster) => {
        hpGenRef.current.set(monster.id, generation);

        const hits = beats.filter((b) => b.defenderMonsterId === monster.id && b.damage > 0);
        const chip = passiveDamage.find(([id]) => id === monster.id);
        if (hits.length === 0 && !chip) {
          scheduleHp(monster.id, monster.currentHp, 0, generation);
          return;
        }

        let hp = hpBefore.get(monster.id) ?? monster.currentHp;
        // Hold the bar where it was until the first blow actually connects.
        scheduleHp(monster.id, hp, 0, generation);

        let lastAt = 0;
        hits.forEach((hit) => {
          const index = beats.indexOf(hit);
          hp = Math.max(0, hp - hit.damage);
          lastAt = index * BEAT_MS + CONTACT_MS;
          scheduleHp(monster.id, hp, lastAt, generation);
        });
        if (chip) {
          lastAt = passiveAt;
        }
        // Land on the truth, whatever the steps added up to.
        scheduleHp(monster.id, monster.currentHp, lastAt, generation);
      });

      // ── Schedule ──────────────────────────────────────────────────────
      beats.forEach((beat, index) => {
        const at = index * BEAT_MS;

        // Every action animates its user, including a status move and a miss — the
        // lunge says "this monster acted", not "this monster connected".
        if (beat.attacker) {
          later(() => addTo('lurch', setLurchingSides, beat.attacker as BattleSide, LURCH_MS), at);
        }

        // Only a blow that actually did damage shakes its target. The backend records a
        // status move as an `attack` aimed at the opposing monster (and a miss keeps its
        // target too), so going by the target alone would make Growl and a whiffed tackle
        // both detonate an impact burst on a monster that was never touched.
        const landed = beat.defender !== null && beat.defenderMonsterId !== null && beat.damage > 0;
        if (landed) {
          const defenderSide = beat.defender as BattleSide;
          const defenderId = beat.defenderMonsterId as number;
          // The blow connects partway through the lunge, not at the start of it.
          later(() => {
            addTo('hit', setHitSides, defenderSide, HIT_MS);
            addTo('hpflash', setHpFlashIds, defenderId, HIT_MS);
            // The turn's own figure, not the HP diff: if a monster is struck twice in
            // one update, the diff is the total and each blow would report all of it.
            pushDamagePopup(defenderId, beat.damage);
          }, at + CONTACT_MS);
        }
      });

      passiveDamage.forEach(([monsterId, amount]) => {
        const side = sideOf(byId.get(monsterId));
        // After the attacks, since chip damage is applied at the end of the turn.
        const at = beats.length * BEAT_MS;
        later(() => {
          if (side) addTo('hit', setHitSides, side, HIT_MS);
          addTo('hpflash', setHpFlashIds, monsterId, HIT_MS);
          pushDamagePopup(monsterId, amount);
        }, at);
      });

      // A stat change belongs to the action that caused it, and the direction says which
      // action that was: a monster buffs *itself* (so it is that beat's actor) and is
      // debuffed by its *opponent* (so it is that beat's target). Matching on role alone
      // is not enough — a monster is usually both the actor of one beat and the target of
      // the next, and the arrow would fly on whichever came first rather than on the move
      // that caused it. Anything with no action behind it (an ability ticking over at the
      // end of the turn) has nothing to sync to and simply plays.
      statDeltas.forEach(({ monsterId, stat, delta }, index) => {
        const byRole = beats.findIndex((b) => (
          delta > 0 ? b.actorMonsterId === monsterId : b.defenderMonsterId === monsterId
        ));
        const beatIndex = byRole >= 0
          ? byRole
          : beats.findIndex((b) => b.actorMonsterId === monsterId || b.defenderMonsterId === monsterId);
        const at = beatIndex >= 0
          ? beatIndex * BEAT_MS + CONTACT_MS
          : STATUS_EFFECT_DELAY_MS;
        later(() => pushStatPopup(monsterId, stat, delta), at + index * 140);
      });

      newlyFainted.forEach((monsterId) => {
        const beatIndex = beats.findIndex(
          (b) => b.defenderMonsterId === monsterId && b.damage > 0,
        );
        const at = beatIndex >= 0 ? beatIndex * BEAT_MS + CONTACT_MS : 0;
        // Hold it on the field from now until the drop has played out — the server has
        // already deactivated it and switched the replacement in, so without this it
        // would be swapped off the field before it could fall. It keeps standing until
        // the blow that killed it lands, then drops.
        addTo('retain', setRetainedIds, monsterId, at + FAINT_MS);
        later(() => addTo('faint', setFaintingIds, monsterId, FAINT_MS), at);
      });
    },
    [addTo, later, pushDamagePopup, pushStatPopup, scheduleHp],
  );

  return useMemo(
    () => ({
      lurchingSides,
      hitSides,
      hpFlashIds,
      faintingIds,
      retainedIds,
      displayHp,
      statPopups,
      damagePopups,
      observe,
      reset,
    }),
    [
      lurchingSides,
      hitSides,
      hpFlashIds,
      faintingIds,
      retainedIds,
      displayHp,
      statPopups,
      damagePopups,
      observe,
      reset,
    ],
  );
}
