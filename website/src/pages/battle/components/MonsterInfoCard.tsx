import { TypeBadge } from '@components/common/TypeBadge';
import type { BattleMonster } from '@services/battleService';
import { activeStatStages, formatStage, hpBarTier } from '../battleStats';
import { GenderIcon } from './GenderIcon';
import { useMonsterHoverPanel } from './useMonsterHoverPanel';

/**
 * The HP bar, with a "ghost" trail behind the fill.
 *
 * The fill itself slides to the new value over 0.6s while the ghost lags behind it, so a
 * hit leaves a briefly-visible red wake showing how much was just taken off — the bar
 * reads as an event rather than a number that quietly changed.
 *
 * `hp` is the value to *show*, which trails what the server reports: the arena holds it
 * at the old figure until the blow that took it off actually lands. Callers that just
 * want the plain truth (the bench) can leave it out.
 */
export function HpBar({
  monster,
  flashing,
  hp,
}: {
  monster: BattleMonster;
  flashing: boolean;
  hp?: number;
}) {
  const shown = hp ?? monster.currentHp;
  const pct = monster.maxHp > 0
    ? Math.max(0, Math.min(100, (shown / monster.maxHp) * 100))
    : 0;
  return (
    <div className={`battle-hp ${flashing ? 'battle-hp--flash' : ''}`}>
      <div className="battle-hp__bar">
        <div className="battle-hp__ghost" style={{ width: `${pct}%` }} />
        <div
          className={`battle-hp__fill battle-hp__fill--${hpBarTier(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="battle-hp__text">{shown} / {monster.maxHp}</span>
    </div>
  );
}

/** The stat stages a monster is riding, as compact chips under its HP bar. */
export function StatStageChips({ monster }: { monster: BattleMonster }) {
  const stages = activeStatStages(monster.statStages);
  if (stages.length === 0) return null;

  return (
    <div className="battle-info-card__stages">
      {stages.map((s) => (
        <span
          key={s.key}
          className={`battle-stat-stage battle-stat-stage--${s.stage > 0 ? 'up' : 'down'}`}
          title={`${s.long} ${formatStage(s.stage)}`}
        >
          <i className={`fas fa-caret-${s.stage > 0 ? 'up' : 'down'}`} />
          {s.short} {formatStage(s.stage)}
        </span>
      ))}
    </div>
  );
}

/**
 * The name/level/type/HP card beside a monster on the field.
 *
 * Hovering or focusing it opens the full detail panel, so the card itself stays compact:
 * the species and attribute live there rather than crowding the field.
 */
export function MonsterInfoCard({
  monster,
  flashing,
  concealed,
  hp,
}: {
  monster: BattleMonster;
  flashing: boolean;
  /** The monster has not been thrown out yet — keep the card's space, hide its face. */
  concealed: boolean;
  /** The HP to show, which trails the server's until the blow that took it off lands. */
  hp?: number;
}) {
  const { anchorProps, panel } = useMonsterHoverPanel(monster);

  return (
    <>
      <div
        {...anchorProps}
        className={[
          'battle-info-card',
          monster.isFainted ? 'battle-info-card--fainted' : '',
          concealed ? 'battle-info-card--concealed' : '',
        ].filter(Boolean).join(' ')}
        // Not focusable while it is hidden mid-send-in — there is nothing to read yet.
        tabIndex={concealed ? -1 : 0}
      >
        <div className="battle-info-card__top">
          <span className="battle-info-card__name">
            {monster.name}
            <GenderIcon gender={monster.gender} />
          </span>
          <span className="battle-info-card__level">Lv. {monster.level}</span>
        </div>
        <div className="battle-info-card__types">
          {monster.types.map((t) => <TypeBadge key={t} type={t} size="xs" />)}
        </div>
        <HpBar monster={monster} flashing={flashing} hp={hp} />
        {monster.statusEffects.length > 0 && (
          <div className="battle-info-card__statuses">
            {monster.statusEffects.map((s) => (
              <span
                key={s}
                className={`battle-status-chip battle-status-chip--${s.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <StatStageChips monster={monster} />
        <span className="battle-info-card__hint" aria-hidden="true">
          <i className="fas fa-info-circle" />
        </span>
      </div>
      {!concealed && panel}
    </>
  );
}
