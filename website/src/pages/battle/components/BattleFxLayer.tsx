import type { DamagePopup, StatPopup } from '../useBattleFx';
import { BATTLE_STAT_META, stageChangeWord } from '../battleStats';

/**
 * The transient numbers and arrows that float off a monster mid-turn.
 *
 * Rendered inside the monster's sprite zone so it travels with the sprite and is clipped
 * to the battlefield, and marked aria-hidden throughout: every one of these is a visual
 * echo of something the battle log already states in words, so announcing them again
 * would just talk over the log.
 */
export function BattleFxLayer({
  statPopups,
  damagePopups,
}: {
  statPopups: readonly StatPopup[];
  damagePopups: readonly DamagePopup[];
}) {
  if (statPopups.length === 0 && damagePopups.length === 0) return null;

  return (
    <div className="battle-fx-layer" aria-hidden="true">
      {damagePopups.map((popup, index) => (
        <span
          key={popup.id}
          className="battle-fx-damage"
          // Stacked rather than overlapping when several land at once.
          style={{ '--fx-index': index } as React.CSSProperties}
        >
          -{popup.amount}
        </span>
      ))}

      {statPopups.map((popup, index) => {
        const rising = popup.delta > 0;
        const meta = BATTLE_STAT_META[popup.stat];
        const emphasis = stageChangeWord(popup.delta);
        return (
          <span
            key={popup.id}
            className={`battle-fx-stat battle-fx-stat--${rising ? 'up' : 'down'}`}
            // Continues the damage numbers' stack rather than restarting at the top of
            // it — a hit that also drops a stat would otherwise print both on one line.
            style={{ '--fx-index': damagePopups.length + index } as React.CSSProperties}
          >
            <i className={`fas fa-angle-double-${rising ? 'up' : 'down'}`} />
            <span className="battle-fx-stat__label">
              {meta.short} {rising ? 'rose' : 'fell'}
              {emphasis && <em> {emphasis}</em>}
            </span>
          </span>
        );
      })}
    </div>
  );
}
